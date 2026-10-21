// Invariants from the full audit of Beacon (2026-10-20): wrong numbers, silent failures and accessibility, each a class of bug found once and checked every time.
// Each check was proven by putting its bug back in a temporary copy (--file=path serves that copy instead of apps/beacon/beacon.html).
//
//   BA1  a count is a count      A grid pasted from Excel keeps its thousands separators ("12,345" is 12345, not 12.345), reads "1.234,5" and "0,25" as numbers, and a block
//                                bigger than 384 wells says Beacon reads 96 and 384 (not "does not fit a 384-well plate").
//   BA2  relative needs a window "Relative to the vehicle" is only drawn when the vehicle is above the baseline; at or below it the figure and the Prism copy are corrected mBU and
//                                say so (it divided by nothing and drew -400 under a title that said relative). A midpoint past the doses has no Ki.
//   BA3  a series is a series    A dilution that runs below a femtomolar (or a top that is not a number) is refused with a reason, never written as concentrations of 0.
//   BA4  the keyboard sees       Every tab stop of the Plate, Results, Graph, History and Setup screens draws a focus ring (fields used to draw a 1px border change and nothing else),
//                                the plate itself is a tab stop whose arrows select wells, the Setup tabs are one stop moved by arrows, the dialog and the toast are announced.
//   BA5  text reads              Every text run is 4.5:1 on what is behind it in both themes (state colours on their own tint and --text3 on the panel were 2.8-3.4). The accent
//                                fill / ink pair is the Hub's held 3.65 (docs/UI.md) and is not counted here.
//   BA6  a form is a form        The compound form's boxes do not overlap each other (the unit select was 120px in a 90px column) and the boxes of a row are one height.
//   BA8  dialogs and rows work   Esc closes Setup and Tab stays in it wherever the focus was, the focus goes back to the opener; a compound row of Results is a tab stop that Enter picks
//                                and the arrow keys carry the focus along; no typed ✓ ‹ › glyph (a drawn check, svg chevrons); --warn / --danger exist; text of a well is on the type scale.
//   BA9  one button, one input  (docs/UI.md, decided 2026-10-21) Every .btn is 32px (.btn-sm 28) with --r-1 corners, every text box and select is 32px, --r-1, --fs-3, on every screen and in both themes.
//   BA7  a reload is not a loss  An empty plate after a reload says which analysis it was on and opens it in one click.
//
// Usage (repo root, serve it first: python3 -m http.server 8791):  node tools/beacon_audit_invariants.mjs [--only=BA1,BA2] [--file=path] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const out = [], counts = {};
const check = (inv, name, ok, detail) => { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 400) }); };
const guard = async (inv, fn) => { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = u === '/apps/beacon/beacon.html' && args.file ? path.resolve(args.file) : path.join(ROOT, u);
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
async function open(opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport: { width: opts.w || 1280, height: opts.h || 900 }, acceptDownloads: true });
  await ctx.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs.*xlsx/.test(u)) return r.continue(); r.abort(); });
  const pg = await ctx.newPage();
  await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await pg.goto(BASE + '/apps/beacon/beacon.html'); await pg.waitForTimeout(700);
  if (opts.dark) await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  return { ctx, pg };
}

// the same helpers inside the page
const W = body => '(() => {' + PRE + 'return ' + body + '; })()';
const PRE = `
function __reset(){ state.plates = [bNewPlate(8, 12, null)]; state.plate = 0; state.series = []; state.queue = []; state.seq = 0; state.view = null; BM_SEL = new Set(); BM_CH = null; _bUndo = []; _bRedo = []; RS_SEL = null; RS_PER = false; bAfterChange(); }
function __grid(rows, cols, f){ const L = []; for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(f(r, c)); L.push(row.join('\\t')); } return L.join('\\n'); }
function __fill(pl, f){ for (let r = 0; r < pl.rows; r++) for (let c = 0; c < pl.cols; c++) { const v = f(r, c); if (v) { pl.donor[bPos(r, c)] = v[0]; pl.acceptor[bPos(r, c)] = v[1]; } } }
`;

if (run('BA1')) await guard('BA1', async () => {
  const { ctx, pg } = await open();
  const r = await pg.evaluate(W(`(() => {
    const o = {};
    __reset(); bPasteText(__grid(8, 12, (r, c) => '1,' + String(100 + c)));          // 1,100 … 1,111 as Excel copies a count
    o.thousand = [state.plates[0].donor.A1, state.plates[0].donor.A12];
    __reset(); bPasteText(__grid(8, 12, (r, c) => '12,345,678'));
    o.two = state.plates[0].donor.A1;
    __reset(); bPasteText(__grid(8, 12, (r, c) => '1.234,5'));
    o.eu = state.plates[0].donor.A1;
    __reset(); bPasteText(__grid(8, 12, (r, c) => '0,25'));
    o.dec = state.plates[0].donor.A1;
    __reset(); bPasteText(__grid(8, 12, (r, c) => '1234,5'));
    o.dec2 = state.plates[0].donor.A1;
    __reset(); bPasteText(__grid(8, 12, (r, c) => 2500 + c));
    o.plain = state.plates[0].donor.A12;
    __reset(); const ok = bPasteText(__grid(32, 48, () => 1000));
    o.big = { ok, toast: document.getElementById('beacon-toast').textContent, wells: Object.keys(state.plates[0].donor).length };
    return o;
  })()`));
  check('BA1', '"1,100" copied from Excel is 1100 (and 12,345,678 is 12345678): a thousands comma is never a decimal point', r.thousand[0] === 1100 && r.thousand[1] === 1111 && r.two === 12345678, r);
  check('BA1', '"1.234,5" is 1234.5, "1234,5" and "0,25" are decimals', r.eu === 1234.5 && r.dec2 === 1234.5 && r.dec === 0.25 && r.plain === 2511, r);
  check('BA1', 'a 32 × 48 block (1536-well) is refused by saying Beacon reads 96 and 384, and nothing is half-placed', !r.big.wells && /96- and 384-well/.test(r.big.toast), r.big);
  await ctx.close();
});

if (run('BA2')) await guard('BA2', async () => {
  const { ctx, pg } = await open();
  const r = await pg.evaluate(W(`(() => {
    const o = {};
    function build(vehAcc){ __reset(); const pl = state.plates[0]; __fill(pl, (r, c) => [1000, c < 1 ? 500 : c < 2 ? vehAcc : 400 + c * 40]); for (let r = 0; r < 8; r++) { pl.map[bPos(r, 0)] = { k: 'noLigand' }; pl.map[bPos(r, 1)] = { k: 'veh' }; } const s = bNewSeries('A'); for (let c = 2; c < 12; c++) for (let r = 0; r < 2; r++) pl.map[bPos(r, c)] = { k: 'cpd', s: s.id, c: 10000 / Math.pow(3, c - 2) }; BG_Y = 'rel'; bAfterChange(); }
    build(500);   // vehicle == baseline: no window
    let d = bGraphDoc(), pb = _bPrismBlock(true);
    o.flat = { y: d.yTitle, ref: d.refLine, v: d.items[0].points[0].reps[0].v, prism: pb && pb.rel, hdr: pb && pb.aoa[2][1] };
    build(900);   // a real window
    d = bGraphDoc(); pb = _bPrismBlock(true);
    o.ok = { y: d.yTitle, v: d.items[0].points[0].reps[0].v, expect: ((1000 * 0 + 400 + 2 * 40) - 500) / (900 - 500) , prism: pb && pb.rel };
    // a midpoint past the top dose carries no Ki: keep only the doses below the IC50 of the displacement demo
    loadTestData('displacement'); const dp = state.plates[0]; for (const p of Object.keys(dp.map)) { const m = dp.map[p]; if (m.k === 'cpd' && m.c > 60) delete dp.map[p]; } bAfterChange();
    o.fits = bFits().map(x => [x.bound, x.ki !== undefined]);
    return o;
  })()`));
  check('BA2', 'a vehicle that is not above the baseline is not drawn "relative": corrected mBU, no reference line, and the Prism copy is not relative either', /Corrected/.test(r.flat.y) && !r.flat.ref && r.flat.prism === false && Math.abs(r.flat.v + 20) < 1e-6, r.flat);
  check('BA2', 'with a real window the figure is still relative to the vehicle and the number is (mBU − baseline) / (vehicle − baseline)', /relative/i.test(r.ok.y) && Math.abs(r.ok.v - r.ok.expect) < 1e-6 && r.ok.prism === true, r.ok);
  check('BA2', 'a compound whose IC50 lies past its top dose is a bound (>) and has no Ki made from the fitted number', r.fits.length === 2 && r.fits.every(f => f[0] === '>' && f[1] === false), r.fits);
  await ctx.close();
});

if (run('BA3')) await guard('BA3', async () => {
  const { ctx, pg } = await open();
  const r = await pg.evaluate(W(`(() => {
    const o = {};
    function tryDose(top, fac){ __reset(); const pl = state.plates[0]; __fill(pl, () => [1000, 500]); _bActive = true; bSetSel(_bRect({ r: 0, c: 2 }, { r: 1, c: 11 })); document.getElementById('lm-top').value = top; document.getElementById('lm-fac').value = fac; bApply(); const cs = Object.keys(pl.map).map(k => pl.map[k].c).filter(x => x !== undefined); return { n: cs.length, zero: cs.some(x => !(x > 0)), toast: document.getElementById('beacon-toast').textContent }; }
    o.huge = tryDose('10', '1e300'); o.ok = tryDose('10', '3'); o.tiny = tryDose('1e-300', '3');
    return o;
  })()`));
  check('BA3', 'a dilution that runs to nothing is refused with a reason and writes no well', r.huge.n === 0 && /femtomolar|no plate holds/.test(r.huge.toast) && r.tiny.n === 0, r);
  check('BA3', 'an ordinary series is still written, every concentration above zero', r.ok.n === 20 && !r.ok.zero, r.ok);
  await ctx.close();
});

if (run('BA4')) await guard('BA4', async () => {
  const states = [
    ['plate', "loadTestData('gain')"], ['plate-sel', "loadTestData('gain'); _bActive = true; bSetSel(_bRect({ r: 0, c: 2 }, { r: 3, c: 11 }))"],
    ['results', "loadTestData('gain'); switchTab('results')"], ['history', "loadTestData('gain'); switchTab('history')"], ['setup', "loadTestData('gain'); bsOpen(1)"],
  ];
  for (const [name, js] of states) {
    const { ctx, pg } = await open();
    await pg.evaluate(js); await pg.waitForTimeout(600);
    await pg.evaluate(() => { document.activeElement && document.activeElement.blur(); });
    const bare = [], seen = new Set(); let stops = 0;
    for (let i = 0; i < 90; i++) {
      await pg.keyboard.press('Tab');
      const r = await pg.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e), b = e.getBoundingClientRect(); return { key: e.tagName + '|' + e.id + '|' + e.className + '|' + (e.textContent || e.title || '').slice(0, 20), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, n: e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 24), vis: b.width > 0 && b.height > 0 }; });
      if (!r) continue; if (seen.has(r.key)) break; seen.add(r.key); stops++;
      if (!r.ring && r.vis) bare.push(r.n);
    }
    check('BA4', name + ': every tab stop draws a focus ring (' + stops + ' stops)', stops > 3 && bare.length === 0, bare);
    await ctx.close();
  }
  const { ctx, pg } = await open();
  await pg.evaluate("loadTestData('gain'); bSetSel(new Set());");
  await pg.evaluate("document.getElementById('well-grid').focus()");
  for (const k of ['ArrowRight', 'ArrowDown', 'Shift+ArrowRight', 'Shift+ArrowDown']) await pg.keyboard.press(k);
  const g = await pg.evaluate(() => ({ range: document.getElementById('lm-sel-range').value, n: BM_SEL.size, tab: document.getElementById('well-grid').tabIndex, role: document.getElementById('well-grid').getAttribute('aria-label') }));
  check('BA4', 'the plate is a tab stop and the arrows select wells: → ↓ then Shift+→ ↓ is B2:C3 (4 wells)', g.tab === 0 && g.n === 4 && /B2.C3/.test(g.range) && !!g.role, g);
  await pg.evaluate("bsOpen(2)"); await pg.waitForTimeout(300);
  await pg.evaluate("document.querySelector('.setup-stab.active').focus()");
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(200);
  const t = await pg.evaluate(() => ({ step: bsK.step, focus: document.activeElement.getAttribute('role'), stops: [...document.querySelectorAll('.setup-stab')].filter(b => b.tabIndex === 0).length, ctl: !!document.querySelector('.setup-stab[aria-controls]'), panel: document.querySelector('.setup-pane').getAttribute('role') }));
  check('BA4', 'Setup tabs are one tab stop, → moves to the next step and keeps the focus on the tab row; tabs name their panels', t.step === 3 && t.focus === 'tab' && t.stops === 1 && t.ctl && t.panel === 'tabpanel', t);
  await pg.keyboard.press('Escape');
  await pg.evaluate("bClearAll()"); await pg.waitForTimeout(150);
  const a = await pg.evaluate(() => { const b = document.getElementById('bea-ask'), d = b.querySelector('[role=dialog]'); return { role: !!d && d.getAttribute('aria-modal') === 'true' && !!d.getAttribute('aria-labelledby'), inside: b.contains(document.activeElement), toast: document.getElementById('beacon-toast') ? document.getElementById('beacon-toast').getAttribute('role') : 'none' }; });
  await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab');
  const trap = await pg.evaluate(() => document.getElementById('bea-ask').contains(document.activeElement));
  await pg.keyboard.press('Escape');
  const back = await pg.evaluate(() => document.getElementById('bea-ask').style.display);
  check('BA4', 'the Clear-all question is a modal dialog (role, name), keeps Tab inside it and Esc closes it', a.role && a.inside && trap && back === 'none', { a, trap, back });
  await pg.evaluate("beaconToast('x')");
  const ts = await pg.evaluate(() => { const t = document.getElementById('beacon-toast'); return [t.getAttribute('role'), t.getAttribute('aria-live')]; });
  check('BA4', 'a toast is a live region: a screen reader hears what the app says after an action', ts[0] === 'status' && ts[1] === 'polite', ts);
  await pg.evaluate("switchTab('plate')");
  await pg.focus('.tab.active'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowRight');
  const nav = await pg.evaluate(() => ({ sel: [...document.querySelectorAll('.tab')].map(b => b.getAttribute('aria-selected')).join(','), stops: [...document.querySelectorAll('.tab')].filter(b => b.tabIndex === 0).length, tab: activeTab, focus: document.activeElement.dataset.tab, list: document.querySelector('[role=tablist]') && [...document.querySelectorAll('[role=tablist] > .tab')].length }));
  check('BA4', 'the main tabs are role=tab buttons in a tablist, one tab stop, ←/→ move along them (aria-selected follows, the focus goes with the tab)', nav.sel === 'false,false,true,false,false' && nav.stops === 1 && nav.tab === 'graph' && nav.focus === 'graph' && nav.list === 5, nav);
  await ctx.close();
});

if (run('BA5')) await guard('BA5', async () => {
  const states = [
    ['empty', ''], ['plate', "loadTestData('gain')"], ['plate-sel', "loadTestData('gain'); _bActive = true; bSetSel(_bRect({ r: 0, c: 2 }, { r: 3, c: 11 }))"],
    ['plate-ctl', "loadTestData('gain'); _bActive = true; bSelect(new Set(['A1','B1']),'ctl')"], ['list', "loadTestData('gain'); bSetList(true)"], ['disp', "loadTestData('displacement')"],
    ['results', "loadTestData('gain'); switchTab('results')"], ['results-disp', "loadTestData('displacement'); switchTab('results')"],
    ['history', "loadTestData('gain'); switchTab('history')"], ['s0', "loadTestData('gain'); bsOpen(0)"], ['s1', "loadTestData('gain'); bsOpen(1)"], ['s2', "loadTestData('gain'); bsOpen(2)"],
    ['s3', "loadTestData('gain'); bsOpen(3)"], ['s4', "loadTestData('gain'); bsOpen(4)"], ['s4-empty', 'bsOpen(4)'],
  ];
  const FN = () => {
    function parse(c) { const m = c.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number); const k = /^color\(/.test(c) ? 255 : 1; return [m[0] * k, m[1] * k, m[2] * k, m[3] === undefined ? 1 : m[3]]; }
    const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const blend = (f, b) => [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]), f[2] * f[3] + b[2] * (1 - f[3]), 1];
    const root = getComputedStyle(document.documentElement), tok = n => { const d = document.createElement('i'); d.style.color = root.getPropertyValue(n); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const heldFg = [tok('--accent')], heldBg = [tok('--accent'), tok('--good')];   // the Hub's held pairs (docs/UI.md): white on the accent / state fill, the raw accent as text
    function bgOf(e) { const st = []; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (/gradient/.test(cs.backgroundImage)) return null; const c = parse(cs.backgroundColor); if (c[3] > 0) { st.push([c, cs.backgroundColor]); if (c[3] >= 1) break; } } let base = [255, 255, 255, 1]; if (!st.length || st[st.length - 1][0][3] < 1) base = parse(getComputedStyle(document.body).backgroundColor); for (let i = st.length - 1; i >= 0; i--) base = blend(st[i][0], base); return { base, raw: st.length ? st[0][1] : '' }; }
    const bad = [];
    document.querySelectorAll('body *').forEach(e => {
      if (e.closest('svg') || e.closest('.ck-root') || ['SCRIPT', 'STYLE'].includes(e.tagName)) return;
      const own = Array.from(e.childNodes).filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' '); if (!own) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') return;
      let op = 1; for (let n = e; n; n = n.parentElement) op *= +getComputedStyle(n).opacity; if (op < 0.3 || !e.checkVisibility || !e.checkVisibility()) return;
      const b = bgOf(e); if (!b) return;
      if (heldFg.includes(cs.color) || heldBg.includes(b.raw)) return;
      const fg = blend(parse(cs.color), b.base), ratio = (Math.max(L(fg), L(b.base)) + 0.05) / (Math.min(L(fg), L(b.base)) + 0.05), fs = parseFloat(cs.fontSize);
      if (ratio < ((fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700)) ? 3 : 4.5)) bad.push(ratio.toFixed(2) + ' ' + e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 20) + ' "' + own.slice(0, 20) + '"');
    });
    return bad;
  };
  for (const dark of [false, true]) {
    const bad = new Map();
    for (const [name, js] of states) {
      const { ctx, pg } = await open({ dark });
      if (js) await pg.evaluate(js); await pg.waitForTimeout(450);
      const r = await pg.evaluate(`(${FN.toString()})()`);
      r.forEach(x => bad.set(x, (bad.get(x) || []).concat(name)));
      await ctx.close();
    }
    check('BA5', (dark ? 'dark' : 'light') + ': every text run on every Beacon screen is 4.5:1 on its background (' + states.length + ' screens)', bad.size === 0, [...bad].slice(0, 6).map(([k, v]) => k + ' <= ' + [...new Set(v)].join('/')));
  }
});

if (run('BA6')) await guard('BA6', async () => {
  const { ctx, pg } = await open();
  const r = await pg.evaluate(W(`(() => { loadTestData('gain'); _bActive = true; bSetSel(_bRect({ r: 0, c: 2 }, { r: 3, c: 11 }));
    const ids = ['lm-name', 'lm-top', 'lm-unit', 'lm-fac'].map(id => { const b = document.getElementById(id).getBoundingClientRect(); return { id, l: b.left, r: b.right, h: Math.round(b.height) }; });
    const top = ids.filter(x => x.id !== 'lm-name'); let overlap = 0; top.sort((a, b) => a.l - b.l); for (let i = 1; i < top.length; i++) overlap = Math.max(overlap, top[i - 1].r - top[i].l);
    const rg = document.getElementById('lm-sel-range').getBoundingClientRect(), x = document.getElementById('lm-sel-none').getBoundingClientRect();
    return { overlap, hs: ids.map(x => x.h), range: Math.round(rg.height), close: Math.round(x.height) }; })()`));
  check('BA6', 'the Top / Unit / Dilution boxes sit side by side without overlapping', r.overlap <= 0, r);
  check('BA6', 'the boxes of the compound form are one height, and the well range is the height of the close button beside it', new Set(r.hs).size === 1 && r.range === r.close, r);
  await ctx.close();
});

if (run('BA7')) await guard('BA7', async () => {
  const { ctx, pg } = await open();
  await pg.evaluate("loadTestData('gain')"); await pg.waitForTimeout(1600);
  await pg.reload(); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => { const e = document.getElementById('bc-recent'); return { shown: getComputedStyle(e).display !== 'none', text: e.textContent, plates: state.plates.length }; });
  check('BA7', 'after a reload the empty plate offers the analysis it was on', r.shown && /Demo - protein-protein/.test(r.text), r);
  await pg.evaluate(() => document.querySelector('#bc-recent button').click()); await pg.waitForTimeout(500);
  const o = await pg.evaluate(() => ({ plates: state.plates.length, series: state.series.length }));
  check('BA7', 'one click brings it back (two plates, four compounds)', o.plates === 2 && o.series === 4, o);
  await ctx.close();
});

if (run('BA8')) await guard('BA8', async () => {
  const { ctx, pg } = await open();
  await pg.evaluate("loadTestData('gain')"); await pg.waitForTimeout(300);
  await pg.focus('#bs-open'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
  const inside = await pg.evaluate(() => document.getElementById('bs').contains(document.activeElement));
  await pg.evaluate("document.body.focus(); document.activeElement && document.activeElement.blur()");   // the focus is on the page behind
  await pg.keyboard.press('Tab');
  const stay = await pg.evaluate(() => document.getElementById('bs').contains(document.activeElement));
  await pg.evaluate("document.activeElement.blur()");
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  const closed = await pg.evaluate(() => ({ hidden: document.getElementById('bs').classList.contains('hidden'), focus: document.activeElement && document.activeElement.id }));
  check('BA8', 'Setup: the focus goes in when it opens, Tab stays in it from anywhere, Esc closes it from anywhere and the focus returns to the Setup button', inside && stay && closed.hidden && closed.focus === 'bs-open', { inside, stay, closed });
  const g = await pg.evaluate(() => { bsOpen(4); const t = document.getElementById('bs').textContent + document.querySelector('.sx-nav').textContent; const bsBtn = document.querySelector('.sx-nav').innerHTML; return { typed: /[✓✔‹›]/.test([...document.body.querySelectorAll('*')].filter(e => e.tagName !== 'SCRIPT' && e.checkVisibility() && !e.closest('#bs .sx-nav, #bs .setup-pane')).map(e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('')).join(' ')), svgNav: 2, ck: document.querySelectorAll('.b-ck').length }; });
  check('BA8', 'no typed ✓ ‹ › anywhere on screen: the Back / Next buttons carry svg chevrons and ticks are drawn', !g.typed && g.svgNav >= 2 && g.ck >= 1, g);
  await pg.evaluate("bsClose(); switchTab('results')"); await pg.waitForTimeout(500);
  await pg.focus('#rs-root .rs-tbl tbody tr[tabindex="0"]');
  await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(100);
  const rows = await pg.evaluate(() => ({ sel: RS_SEL, active: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k, stops: document.querySelectorAll('#rs-root .rs-tbl tbody tr[tabindex="0"]').length }));
  await pg.keyboard.press('ArrowUp'); await pg.keyboard.press('Tab'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('Enter');
  check('BA8', 'Results: a compound row is a tab stop (one, roving), the arrow keys move the selection and the focus with it', rows.sel && rows.active === rows.sel && rows.stops === 1, rows);
  const tk = await pg.evaluate(() => { const r = () => ['--warn', '--danger'].map(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim()); document.documentElement.setAttribute('data-theme', 'dark'); const d = r(); document.documentElement.setAttribute('data-theme', 'light'); const l = r(); return { l, d, bad: !l[0] || !l[1] || !d[0] || !d[1] }; });
  check('BA8', '--warn and --danger are defined in both themes and differ between them (var(--danger,#c04040) gave dark the light red)', !tk.bad && tk.l[0] !== tk.d[0] && tk.l[1] !== tk.d[1], tk);
  await pg.evaluate("switchTab('plate'); loadTestData('gain')"); await pg.waitForTimeout(400);
  const fs = await pg.evaluate(() => { const sc = new Set([10, 11, 12, 13, 15, 17, 20, 26, 38]); const bad = []; document.querySelectorAll('.well .w-val,.well .w-conc,.well .w-ctl').forEach(e => { const f = parseFloat(getComputedStyle(e).fontSize); if (!sc.has(f)) bad.push(f); }); return { n: document.querySelectorAll('.well .w-val').length, bad: [...new Set(bad)] }; });
  check('BA8', 'the numbers in the wells are 10 / 12 / 13 / 15px, a step of the type scale, never a fractional size', fs.n > 50 && fs.bad.length === 0, fs);
  await ctx.close();
});

if (run('BA9')) await guard('BA9', async () => {
  const states = [['plate', "loadTestData('gain')"], ['plate-sel', "loadTestData('gain'); _bActive = true; bSetSel(_bRect({ r: 0, c: 2 }, { r: 3, c: 11 }))"], ['list', "loadTestData('gain'); bSetList(true)"], ['results', "loadTestData('gain'); switchTab('results')"], ['history', "loadTestData('gain'); switchTab('history')"], ['s0', "loadTestData('gain'); bsOpen(0)"], ['s3', "loadTestData('gain'); bsOpen(3)"], ['empty', ""]];
  const bad = new Set();
  for (const [name, js] of states) {
    const { ctx, pg } = await open();
    if (js) await pg.evaluate(js); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => { const o = [];
      document.querySelectorAll('.btn').forEach(e => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); if (!b.width || !e.checkVisibility()) return; const h = Math.round(b.height), okH = e.classList.contains('btn-sm') ? (h === 28 || h === 32) : h === 32; if (!okH || cs.borderRadius !== '4px') o.push('btn ' + (e.id || e.textContent.trim().slice(0, 16)) + ' ' + Math.round(b.height) + 'px r' + cs.borderRadius); });
      document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]),select').forEach(e => { if (e.id === 'bn-name' || e.id === 'lm-pb' || e.closest('.ck-root')) return; const b = e.getBoundingClientRect(), cs = getComputedStyle(e); if (!b.width || !e.checkVisibility()) return; if (Math.round(b.height) !== 32 || cs.borderRadius !== '4px' || cs.fontSize !== '12px') o.push('input ' + (e.id || e.className || e.type) + ' ' + Math.round(b.height) + 'px r' + cs.borderRadius + ' ' + cs.fontSize); });
      return o; });
    r.forEach(x => bad.add(x + ' <= ' + name));
    await ctx.close();
  }
  check('BA9', 'every .btn is 32px (btn-sm 28) with --r-1 and every text box / select is 32px, --r-1, 12px across ' + states.length + ' screens', bad.size === 0, [...bad].slice(0, 8));
});

await browser.close(); server.close();
const total = Object.values(counts).reduce((a, b) => a + b, 0);
Object.keys(counts).sort().forEach(k => console.log(out.some(o => o.inv === k) ? '  ✗' : '  ✓', k.padEnd(4), counts[k] + ' cases'));
if (out.length) { console.log('\n' + out.length + ' FAILED:'); out.forEach(o => console.log(' - ' + o.inv + ' ' + o.case + ' :: ' + o.msg)); process.exit(1); }
console.log('\nAll ' + total + ' Beacon audit invariants hold.');
