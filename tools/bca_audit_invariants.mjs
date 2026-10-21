// BCA audit invariants — a concentration read off a standard curve ends up in a lysate loading table, so the fit and the
// inversion are recomputed against exact arithmetic, and the plate painter is held to what a keyboard can do.
//
//   BC1  the fit is the fit         linear and quadratic least squares on a typical BSA series, in µg/µL and in µg/mL, equal the
//                                   same fit done in exact rational arithmetic (constants below) to 1e-9
//   BC2  back-calculation           samples on a known curve come back at their true concentration; below the blank, above a
//                                   quadratic that has flattened, and beyond the standards are each said in words
//   BC3  numbers people paste       "0,543", "1.234,5", "OVRFLW" and "" (no reading is not zero)
//   BC4  files                      the sample CSV neutralises a formula in a name and says "above the top standard"
//   BC5  keyboard                   wells are tab stops that paint and exclude with Enter/Space and move with the arrows; wells
//                                   can be typed (A1:A2, B2:C3); row/column headers are buttons; every field has a name; no
//                                   typed ✕; the tabs are a tablist; toasts are role=status
//   BC6  colours that carry text    tabs, headings, table, flags and chips reach 4.5:1 in light and dark
//
//   node tools/bca_audit_invariants.mjs [--only=BC1,BC2] [--file=apps/bca/bca.html]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/bca/bca.html'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const browser = await chromium.launch();
async function open(theme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(t => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); } catch (e) {} }, theme);
  await page.goto('file://' + FILE); await page.waitForTimeout(500);
  return page;
}
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1e-12, Math.abs(b));

// Exact least squares (Python fractions) on the nine points below: [c, b, a] and r2.
const SERIES = [[0, 0.052], [0.025, 0.098], [0.125, 0.31], [0.25, 0.55], [0.5, 0.98], [0.75, 1.31], [1, 1.62], [1.5, 2.05], [2, 2.31]];
const REF = {
  lin: { m: 1.1741965513593569, b: 0.2287434676822173, r2: 0.9557888420828503 },
  quad: { a: -0.44355851313998557, b: 2.0048693139749973, c: 0.0623527182394082, r2: 0.9996694663748718 },
};

if (run('BC1')) await guard('BC1', async () => {
  const p = await open();
  for (const k of [1, 1000]) {
    const pts = SERIES.map(([x, y]) => ({ x: x * k, y }));
    const r = await p.evaluate(pts => ({ l: linearRegression(pts), q: quadraticRegression(pts) }), pts);
    const sl = 1 / k;
    if (!(near(r.l.m, REF.lin.m * sl) && near(r.l.b, REF.lin.b) && near(r.l.r2, REF.lin.r2))) bad('BC1', `linear fit, x×${k}: ${JSON.stringify(r.l)}`); else ok();
    if (!(near(r.q.a, REF.quad.a * sl * sl, 1e-8) && near(r.q.b, REF.quad.b * sl, 1e-8) && near(r.q.c, REF.quad.c, 1e-8) && near(r.q.r2, REF.quad.r2))) bad('BC1', `quadratic fit, x×${k}: ${JSON.stringify(r.q)}`); else ok();
  }
  await p.close();
});

// A plate whose standards sit exactly on a chosen curve, and samples at chosen absorbances.
const SETUP = `window.__plate = function(curve, sampleAbs){
  var ROWS = 'ABCDEFGH', g = ROWS.split('').map(function(r){ return { label: r, vals: new Array(12).fill(0.04) }; }), std = [2, 1, 0.5, 0.25, 0.125, 0];
  std.forEach(function(c, i){ g[i].vals[0] = g[i].vals[1] = curve(c); });
  sampleAbs.forEach(function(a, i){ g[i].vals[2] = g[i].vals[3] = a; });
  state.plate = g; resetPlateState();
  std.forEach(function(c, i){ state.plateMap.standardGroups.push({ id: ++PM_GROUP_SEQ, wells: [ROWS[i] + '01', ROWS[i] + '02'], conc: c, excluded: [], color: '#999' }); });
  sampleAbs.forEach(function(a, i){ state.plateMap.sampleGroups.push({ id: ++PM_GROUP_SEQ, wells: [ROWS[i] + '03', ROWS[i] + '04'], name: 'S' + (i + 1), dilutionFactor: 1, excluded: [], color: '#999' }); });
  document.getElementById('sc-fit').value = 'quadratic'; showImportResults(); switchTab('standards'); renderStandardsTab(); return computeSampleResults().map(function(r){ return { c: r.assayConc, f: r.finalConc, ex: r.extrapolated, below: r.belowBlank, above: r.aboveCurve, inv: r.invalid }; }); };`;

if (run('BC2')) await guard('BC2', async () => {
  const p = await open();
  // convex curve (BCA-like): exact quadratic, so the quadratic fit must reproduce it
  const r = await p.evaluate(SETUP + ';__plate(function(c){ return 0.28*c*c + 0.78*c + 0.26; }, [0.26+0.78*1.3+0.28*1.69, 0.26+0.78*0.4+0.28*0.16, 0.26+0.78*2.6+0.28*6.76, 0.1])');
  if (!(near(r[0].c, 1.3, 1e-6) && near(r[1].c, 0.4, 1e-6))) bad('BC2', `1.3 and 0.4 came back as ${r[0].c} and ${r[1].c}`); else ok();
  if (!r[2].ex || !near(r[2].c, 2.6, 1e-6)) bad('BC2', 'a sample beyond the top standard is not flagged as extrapolated (or is wrong): ' + JSON.stringify(r[2])); else ok();
  if (!r[3].below || !Number.isNaN(r[3].f)) bad('BC2', 'a read below the blank is not "below the blank"'); else ok();
  // concave curve (it flattens): -0.2c² + 1.1c + 0.1, top standard 1.5 at c = 2, peak 1.6
  const q = await p.evaluate(SETUP + ';__plate(function(c){ return -0.2*c*c + 1.1*c + 0.1; }, [-0.2*1.5*1.5+1.1*1.5+0.1, 1.9])');
  if (!near(q[0].c, 1.5, 1e-6)) bad('BC2', 'concave curve: 1.5 came back as ' + q[0].c); else ok();
  if (!q[1].above || !q[1].inv) bad('BC2', 'a read above a flattened curve is not flagged: ' + JSON.stringify(q[1])); else ok();
  const txt = await p.evaluate(() => { switchPrepTab('results'); renderSamplesTable(); return document.getElementById('samples-table').textContent; });
  if (!/above the top standard/.test(txt)) bad('BC2', 'the results table does not say "above the top standard"'); else ok();
  await p.close();
});

if (run('BC3')) await guard('BC3', async () => {
  const p = await open();
  const r = await p.evaluate(() => ['0,543', ' 1.2 ', '1.234,5', 'OVRFLW', '', '1e999', '-0,5', '٣'].map(bcaNum));
  if (r[0] !== 0.543 || r[1] !== 1.2 || r[2] !== 1234.5 || r[3] !== null || r[4] !== null || r[6] !== -0.5) bad('BC3', JSON.stringify(r)); else ok();
  if (r[5] !== null && Number.isFinite(r[5])) bad('BC3', '1e999 is a finite number'); else ok();
  await p.close();
});

if (run('BC4')) await guard('BC4', async () => {
  const p = await open();
  const csv = await p.evaluate(SETUP + `;(() => { __plate(function(c){ return -0.2*c*c + 1.1*c + 0.1; }, [1.9]); state.plateMap.sampleGroups[0].name = '=HYPERLINK("x")';
    var out = null; window.downloadCSV = function(c){ out = c; }; exportSamplesCSV(); return out; })()`);
  if (!csv || !/"'=HYPERLINK/.test(csv)) bad('BC4', 'a sample name that is a formula reaches the CSV as one'); else ok();
  if (!/above the top standard/.test(csv || '')) bad('BC4', 'the CSV note does not say above the top standard'); else ok();
  await p.close();
});

if (run('BC5')) await guard('BC5', async () => {
  const p = await open();
  await p.evaluate(() => { loadTestData(); state.plateMap.standardGroups.length = 0; state.plateMap.sampleGroups.length = 0; renderStandardsTab(); renderSamplesTab(); });
  // typed wells
  await p.evaluate(() => { document.getElementById('standards-type').value = 'A1:A2'; pmAddTyped('standard'); document.getElementById('standards-type').value = 'B2:C3, E5'; pmAddTyped('standard'); document.getElementById('samples-type').value = 'A1'; pmAddTyped('sample'); });
  const t = await p.evaluate(() => ({ std: state.plateMap.standardGroups.map(g => g.wells.join(' ')), smp: state.plateMap.sampleGroups.length }));
  if (JSON.stringify(t.std) !== '["A01 A02","B02 B03 C02 C03 E05"]') bad('BC5', 'typed wells: ' + JSON.stringify(t.std)); else ok();
  if (t.smp !== 0) bad('BC5', 'a typed well that belongs to the standards was taken for a sample'); else ok();
  await p.evaluate(() => { document.getElementById('standards-type').value = 'Z9'; pmAddTyped('standard'); });
  if (!/Not a well/.test(await p.evaluate(() => document.getElementById('bca-toast') ? document.getElementById('bca-toast').textContent : ''))) bad('BC5', 'a bad well name gives no answer'); else ok();
  // keyboard on the grid
  const k = await p.evaluate(() => {
    const cell = w => document.querySelector('#standards-grid-wrap td[data-well="' + w + '"]');
    const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    const out = { stops: document.querySelectorAll('#standards-grid-wrap td[tabindex="0"]').length };
    key(cell('H12'), 'Enter'); out.painted = state.plateMap.standardGroups.some(g => g.wells.join() === 'H12');
    key(cell('H12'), 'Enter'); out.excluded = state.plateMap.standardGroups.find(g => g.wells.join() === 'H12').excluded.join();
    out.refocus = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.well;
    cell('D04').focus(); key(cell('D04'), 'ArrowRight'); out.moved = document.activeElement.dataset.well;
    return out;
  });
  if (k.stops < 90) bad('BC5', `only ${k.stops} wells of the standards grid are keyboard stops`); else ok();
  if (!k.painted || k.excluded !== 'H12') bad('BC5', `Enter on a well: painted=${k.painted}, second Enter excluded="${k.excluded}"`); else ok();
  if (k.refocus !== 'H12') bad('BC5', 'focus is lost after painting a well (' + k.refocus + ')'); else ok();
  if (k.moved !== 'D05') bad('BC5', 'the right arrow moved to ' + k.moved); else ok();
  const r = await p.evaluate(() => {
    const unl = [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(i => i.getBoundingClientRect().width > 0 && !(i.getAttribute('aria-label') || (i.id && document.querySelector('label[for="' + i.id + '"]')) || i.closest('label'))).map(i => i.id || i.className);
    const hdr = [...document.querySelectorAll('#standards-grid-wrap th.pm-col-hdr,#standards-grid-wrap th.pm-row-hdr,#samples-grid-wrap th.pm-col-hdr,#samples-grid-wrap th.pm-row-hdr')].filter(th => !th.querySelector('button')).length;
    const glyph = /\\u2715|\\u2716|✕/.test(document.getElementById('panel-standards').innerHTML);
    const tl = document.querySelector('.tabs');
    return { unl, hdr, glyph, list: tl.getAttribute('role'), tabs: [...tl.querySelectorAll('[role=tab]')].length, sel: [...tl.querySelectorAll('[aria-selected=true]')].length };
  });
  if (r.unl.length) bad('BC5', 'fields with no name: ' + r.unl.join(', ')); else ok();
  if (r.hdr) bad('BC5', `${r.hdr} row/column headers are not buttons`); else ok();
  if (r.glyph) bad('BC5', 'a typed ✕ is used as an icon'); else ok();
  if (r.list !== 'tablist' || r.tabs !== 2 || r.sel !== 1) bad('BC5', 'tabs: ' + JSON.stringify(r)); else ok();
  const ts = await p.evaluate(() => { bcaToast('x'); const t = document.querySelector('[id*=toast]'); return t && t.getAttribute('role'); });
  if (ts !== 'status') bad('BC5', 'the toast is not role=status'); else ok();
  await p.close();
});

const CONTRAST = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const over = (t, b) => [t[0] * t[3] + b[0] * (1 - t[3]), t[1] * t[3] + b[1] * (1 - t[3]), t[2] * t[3] + b[2] * (1 - t[3]), 1];
  const bgOf = el => { const st = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const b = rgba(getComputedStyle(e).backgroundColor); if (b[3] > 0) { st.push(b); if (b[3] >= 0.999) break; } } let cur = (st.length && st[st.length - 1][3] >= 0.999) ? st.pop() : [255, 255, 255, 1]; while (st.length) cur = over(st.pop(), cur); return cur; };
  const out = [];
  document.querySelectorAll('.tab,.subtab,.card-hdr,.std-table th,.std-table td,.std-table td span,.pm-role-count,.dose-chip-label,.dose-chip-wells,.btn-sec,label,.pm-grid th,.pm-hb,.pm-doselist-empty,.r2-badge,#sc-equation,.heatmap-legend span,.pm-type label').forEach(el => {
    if (!(el.textContent || '').trim() || el.children.length > 3) return; const r = el.getBoundingClientRect(); if (r.width < 1) return;
    const bg = bgOf(el), fg = over(rgba(getComputedStyle(el).color), bg), a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) out.push(`${(el.className || el.tagName)} "${el.textContent.trim().slice(0, 14)}" ${ratio.toFixed(2)}`);
  });
  return [...new Set(out)].slice(0, 8);
};
if (run('BC6')) await guard('BC6', async () => {
  for (const theme of ['light', 'dark']) {
    const p = await open(theme);
    await p.evaluate(() => { loadTestData(); document.getElementById('sc-fit').value = 'quadratic'; renderStandardsCurve(); switchPrepTab('setup'); });
    let all = await p.evaluate(`(${CONTRAST.toString()})()`);
    await p.evaluate(() => { switchPrepTab('results'); });
    all = all.concat(await p.evaluate(`(${CONTRAST.toString()})()`));
    if (all.length) bad('BC6', `${theme}: ${[...new Set(all)].join('; ')}`); else ok();
    await p.close();
  }
});

await browser.close();
console.log(findings.length ? findings.join('\n') : `BCA audit invariants: ${passed} passed, 0 findings`);
if (findings.length) console.log(`\n${passed} passed, ${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
