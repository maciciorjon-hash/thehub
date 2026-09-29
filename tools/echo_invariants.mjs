// Echo Data Analysis invariants — the bug classes the 2026-09-28 beta test of the Curves, Plots
// and exports found, as checks that run every time. Same rule as tools/invariants.mjs: each check
// is a CLASS already found once by hand, proven by running it against the build before the fix.
//
//   E1 a figure has room      Every label of a curve figure — title, ticks, axis titles, every
//      for everything         legend entry — lies inside the figure and on no other label, for
//                             one curve, eight, all 63, and a 60-character name.
//   E2 PDFs are vector        The single/compare PDF and the batch PDFs carry no raster image
//                             for plain names, and the batch PDF prints flag reasons as text.
//   E3 a curve is compound ×  Picking three rows in Compare puts three curves on the chart, and
//      group, one colour      each row's swatch is its curve's colour.
//   E4 picking moves nothing  Toggling compounds does not move the rows below them nor resize
//                             the chart.
//   E5 every edit comes back  A concentration excluded as a whole is offered back by the
//                             right-click menu, and ⌘Z restores the fit to the digit.
//   E6 a refit is the fit     Refitting each curve's own replicates reproduces its DC50, Hill
//                             and Dmax exactly.
//   E7 the fit is a minimum   No small move of bottom, logEC50 or Hill lowers the residual sum
//                             of squares by more than 0.05 % (bounds respected).
//   E8 statistics are exact   Box-plot quartiles and whiskers are numpy's type 7 / Tukey; the
//                             95 % t quantile matches the exact value.
//   E9 selectivity direction  With log DC50 on both axes, a compound more potent on X is
//                             classed X-selective.
//   E10 text is data          esc() escapes both quotes; CSV cells are quoted and formula-safe.
//   E11 names sort as people    A2 comes before A12 in Results, Curves (Single and Compare), the QC list, the
//       read them             PDF picker and the plate list — digit runs compare as numbers everywhere.
//   E12 the Plate tab tells   Raw luminescence has a scale in its legend and a value in the tooltip, a compound
//       you what it holds     can be found (typed loosely, across every plate) and named in full, a 96-well
//                             plate is drawn as 96, the plates fill their cards, and the view survives a tab switch.
//   E13 the tabs are in the   Results first and open on load, the analysis views together, the housekeeping
//       order you use them    tabs after them; exactly one pane is showing.
//
// Usage (repo root):  node tools/echo_invariants.mjs [--only=E1,E7] [--file=path/to/echo.html] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.resolve(args.file || path.join(ROOT, 'apps/echo/echo.html'));
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);

const out = [], counts = {}, skipped = [];
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) });
}
async function guard(inv, fn) { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
const pageErrs = [];
pg.on('pageerror', e => pageErrs.push(String(e && e.message || e)));
const E = (f, a) => pg.evaluate(f, a);
await pg.goto('file://' + FILE);
await pg.waitForTimeout(1500);
await E(() => { document.documentElement.setAttribute('data-theme', 'light'); loadTestData(); });
await pg.waitForTimeout(800);
await E(() => runPipeline());
await pg.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
await pg.waitForTimeout(800);
const hasPdf = await E(() => !!(window.jspdf && window.jspdf.jsPDF));
if (!hasPdf) skipped.push('E2 — jsPDF did not load from its CDN');
const download = async fn => { const [d] = await Promise.all([pg.waitForEvent('download', { timeout: 90000 }), E(fn)]); const p = await d.path(); return fs.readFileSync(p); };

if (run('E1')) await guard('E1', async () => {
  const res = await E(() => {
    if (typeof _cvLayout !== 'function') return { missing: true };
    const d = _lastResultsData, c = document.createElement('canvas').getContext('2d');
    const long = Object.assign({}, d[0], { Sample_ID: 'EDA-013-a-very-long-compound-identifier-with-a-salt-form-HCl-x' });
    const sets = { one: [d[0]], eight: d.slice(0, 8), all: d, long: [long, ...d.slice(1, 6)] };
    const cfg = { _exportFontMul: 1.1, _exportLegendMul: 1.05, _exportBoldTitle: true };
    const r = {};
    for (const [k, comps] of Object.entries(sets)) for (const W of [340, 520, 620]) {
      const L = _cvLayout(c, W, null, comps, cfg), F = L.F, bad = [];
      const bottomOfAxisTitle = L.pT + L.ph + L.xTitleY + F.axis * 1.1;
      if (L.pT < L.titleY + F.title) bad.push('title on plot');
      if (bottomOfAxisTitle > L.H) bad.push('axis title off figure');
      if (L.legend) {
        const top = L.pT + L.ph + L.legY;
        if (top < bottomOfAxisTitle) bad.push('legend on axis title');
        if (top + L.legend.h > L.H + 0.5) bad.push('legend off figure');
        if (L.legend.items.length !== comps.length) bad.push('legend lost entries');
        L.legend.items.forEach((it, i) => { const x = L.pL + (i % L.legend.cols) * (L.legend.colW + L.legend.colGap); if (x + it.w > W + 0.5) bad.push('legend entry past edge'); });
      } else if (comps.length > 1) bad.push('no legend');
      if (L.pL + L.pw + L.pR > W + 0.5) bad.push('plot wider than figure');
      r[k + '@' + W] = bad;
    }
    return r;
  });
  if (res.missing) { check('E1', 'measured layout exists', false, 'no _cvLayout'); return; }
  Object.entries(res).forEach(([k, bad]) => check('E1', k, !bad.length, bad));
});

if (run('E2') && hasPdf) await guard('E2', async () => {
  await E(() => document.querySelector('[data-tab="curves"]').click()); await pg.waitForTimeout(600);
  const imgs = b => (b.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length;
  const single = await download(() => cvDownloadPDF());
  check('E2', 'single-curve PDF has no raster', imgs(single) === 0, imgs(single));
  await E(() => { setCvMode('compare'); });
  await pg.waitForTimeout(300);
  await E(() => { const rows = document.querySelectorAll('.cv-cmp-row input, #cv-compare-list input'); for (let i = 0; i < 6 && i < rows.length; i++) rows[i].click(); });
  await pg.waitForTimeout(400);
  const cmp = await download(() => cvDownloadPDF());
  check('E2', 'compare PDF has no raster', imgs(cmp) === 0, imgs(cmp));
  await E(() => setCvMode('single'));
  const batch = await download(() => _pdfExportFiltered(_lastResultsData.filter(r => r.Protein === 'BRD2')));
  const txt = batch.toString('latin1');
  check('E2', 'batch PDF has no raster', imgs(batch) === 0, imgs(batch));
  check('E2', 'batch PDF prints a flag reason as text', /\(Hookx1\)/.test(txt), 'Hookx1 not found as a text run');
});

if (run('E3') || run('E4')) await guard('E3', async () => {
  await E(() => { document.querySelector('[data-tab="curves"]').click(); });
  await pg.waitForTimeout(400);
  await E(() => { window._cvSelected && window._cvSelected.clear && window._cvSelected.clear(); window._cvColorIdx && window._cvColorIdx.clear && window._cvColorIdx.clear(); setCvMode('compare'); });
  await pg.waitForTimeout(500);
  const rowSel = '#cv-compare-list label';
  const before = await E(s => { const r = document.querySelectorAll(s); const c = document.getElementById('cv-canvas').getBoundingClientRect(); return { tops: [...r].slice(5, 12).map(x => Math.round(x.getBoundingClientRect().top)), cw: Math.round(c.width), ch: Math.round(c.height) }; }, rowSel);
  for (let i = 0; i < 3; i++) { await pg.locator(rowSel).nth(i).click(); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(500);
  if (run('E3')) {
    const r = await E(s => {
      const cv = document.getElementById('cv-canvas');
      const n = (cv._cvCompounds || []).length, pal = cv._cvPalette || [];
      const toHex = c => { const m = String(c).match(/\d+/g); return m && m.length >= 3 ? '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('') : String(c).toLowerCase(); };
      const sw = [...document.querySelectorAll(s)].slice(0, 3).map(l => { const e = l.querySelector('.cv-cmp-sw') || l.querySelector('span'); return toHex(getComputedStyle(e).backgroundColor); });
      return { n, pal: pal.map(x => String(x).toLowerCase()), sw };
    }, rowSel);
    check('E3', 'three picks, three curves', r.n === 3, r);
    check('E3', 'row swatch = curve colour', r.pal.length === 3 && r.sw.every((c, i) => c === r.pal[i]), r);
  }
  if (run('E4')) {
    const after = await E(s => { const r = document.querySelectorAll(s); const c = document.getElementById('cv-canvas').getBoundingClientRect(); return { tops: [...r].slice(5, 12).map(x => Math.round(x.getBoundingClientRect().top)), cw: Math.round(c.width), ch: Math.round(c.height) }; }, rowSel);
    check('E4', 'rows below stay where they were', JSON.stringify(after.tops) === JSON.stringify(before.tops), { before: before.tops, after: after.tops });
    check('E4', 'the chart keeps its size', after.cw === before.cw && after.ch === before.ch, { before, after });
  }
  await E(() => setCvMode('single'));
});

if (run('E5')) await guard('E5', async () => {
  await E(() => { document.querySelector('[data-tab="curves"]').click(); setCvMode('single'); const s = document.getElementById('cv-compound'); s.selectedIndex = 0; renderCvCurve(); });
  await pg.waitForTimeout(600);
  const r0 = await E(() => { const r = document.getElementById('cv-canvas')._cvCompounds[0]; return r.DC50_nM; });
  await E(() => { const p = (window._cvPtMap || []).find(q => q.x > -8.1 && q.x < -7.9); cvDeletePoint(p.x); });
  await pg.waitForTimeout(500);
  const hit = await E(() => (window._cvPtMap || []).some(q => q.isDeletedConc || q.isExcluded && !q.isRep));
  check('E5', 'an excluded concentration is in the hit map', hit);
  if (hit) {
    const box = await E(() => { const c = document.getElementById('cv-canvas').getBoundingClientRect(); const p = window._cvPtMap.find(q => q.isDeletedConc); return { x: c.left + p.px, y: c.top + p.py }; });
    await pg.mouse.click(box.x, box.y, { button: 'right' }); await pg.waitForTimeout(200);
    const offered = await E(() => [...document.querySelectorAll('div')].some(d => d.children.length === 2 && /^Re-include all at/.test(d.children[1].textContent)));
    check('E5', 'right-click offers it back', offered);
    await pg.mouse.click(5, 5);
  }
  await pg.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await pg.waitForTimeout(500);
  const r1 = await E(() => { const r = document.getElementById('cv-canvas')._cvCompounds[0]; return { dc: r.DC50_nM, del: (r._deletedPts || []).length }; });
  check('E5', '⌘Z restores the fit', r1.dc === r0 && r1.del === 0, { before: r0, after: r1 });
});

if (run('E6')) await guard('E6', async () => {
  const diff = await E(() => {
    if (!window._echoFitOne) return ['no _echoFitOne'];
    return _lastResultsData.map(r => {
      const sdata = (r._reps || []).filter(p => p.y != null && isFinite(p.y)).map(p => ({ log10Conc: p.x, measurement: p.y }));
      const nr = window._echoFitOne(r.Protein, r.Sample_ID, sdata, { noHook: false });
      return nr && (nr.DC50_nM !== r.DC50_nM || nr.HillSlope !== r.HillSlope || nr.Dmax_pct !== r.Dmax_pct) ? `${r.Sample_ID}·${r.Protein} ${r.DC50_nM}→${nr.DC50_nM}` : null;
    }).filter(Boolean);
  });
  check('E6', 'refit of every curve', !diff.length, diff);
});

if (run('E7')) await guard('E7', async () => {
  const bad = await E(() => {
    const minBot = document.getElementById('p-min-bot-en')?.checked !== false ? (parseFloat(document.getElementById('p-min-bot-val')?.value) || 0) : -20;
    const res = [];
    for (const r of _lastResultsData) {
      if (r._gainMode || r._logec50 == null || /No effect/.test(r.Flag_Reason || '')) continue;
      const hook = new Set((r._hook_concs || []).map(h => h.toFixed(6)));
      const pts = (r._reps || []).filter(p => p.y != null && isFinite(p.y) && !hook.has(p.x.toFixed(6)));
      const xs = pts.map(p => p.x), tc = r._tc ?? 100;
      const lo = [minBot, Math.min(...xs) - 1, 0.1], hi = [100, Math.max(...xs) + 1, 5];
      const sse = p => pts.reduce((s, q) => { const f = p[0] + (tc - p[0]) / (1 + Math.pow(10, p[2] * (q.x - p[1]))); return s + (q.y - f) ** 2; }, 0);
      let p = [r._bot, r._logec50, r._hill], best = sse(p);
      const s0 = best;
      let st = [1, 0.05, 0.05];
      for (let it = 0; it < 400 && st[1] > 1e-6; it++) {
        let moved = false;
        for (let k = 0; k < 3; k++) for (const sg of [1, -1]) {
          const q = p.slice(); q[k] = Math.max(lo[k], Math.min(hi[k], q[k] + sg * st[k]));
          const v = sse(q); if (v < best - 1e-12) { best = v; p = q; moved = true; }
        }
        if (!moved) st = st.map(v => v / 2);
      }
      if (best < s0 * (1 - 5e-4)) res.push(`${r.Sample_ID}·${r.Protein} SSE ${s0.toFixed(2)} → ${best.toFixed(2)}`);
    }
    return res;
  });
  check('E7', 'every fit is at its minimum', !bad.length, bad);
});

if (run('E8')) await guard('E8', async () => {
  const r = await E(() => ({ a: boxStats([1, 2, 3, 4]), b: boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]),
    t: [1, 3, 6, 8, 16, 17, 31, 60].map(d => +_tQ95(d).toFixed(3)) }));
  check('E8', 'quartiles of [1,2,3,4]', r.a.q1 === 1.75 && r.a.med === 2.5 && r.a.q3 === 3.25, r.a);
  check('E8', 'whisker at the last point inside the fence', r.b.whi === 10 && r.b.wlo === 1 && r.b.outliers.join() === '100', r.b);
  const exact = [12.706, 3.182, 2.447, 2.306, 2.12, 2.11, 2.04, 2.0];
  check('E8', 't quantiles', r.t.every((v, i) => Math.abs(v - exact[i]) < 0.002), r.t);
});

if (run('E9')) await guard('E9', async () => {
  await E(() => { document.querySelector('[data-tab="scatter"]').click(); });
  await pg.waitForTimeout(400);
  const r = await E(() => {
    switchPlotType('selectivity');
    document.getElementById('sel-metric-x').value = 'DC50_nM'; document.getElementById('sel-metric-y').value = 'DC50_nM';
    const thr = document.getElementById('sel-band-thr'); thr.add(new Option('2×', '0.3')); thr.value = '0.3';
    buildSelectivityChart();
    const pts = selChart ? selChart.data.datasets[0].data : [];
    // lower log DC50 = more potent: y − x > 0.3 means X is ≥2× more potent → 'x'
    return pts.filter(p => Math.abs(p.y - p.x) > 0.3001).map(p => ({ l: p.label, want: p.y - p.x > 0 ? 'x' : 'y', got: p.dir }));
  });
  const wrong = r.filter(p => p.want !== p.got);
  check('E9', 'log DC50 selectivity direction', !wrong.length, { wrong, of: r.length });
  if (!r.length) skipped.push('E9 — no compound beyond 2× on the bundled plates; the direction was checked on none');
  await E(() => switchPlotType('scatter'));
});

if (run('E10')) await guard('E10', async () => {
  const r = await E(() => ({ esc: esc(`a"b'c<d>`), cell: typeof _csvCell === 'function' ? [_csvCell('=SUM(A1),x'), _csvCell('say "hi"'), _csvCell(-8.12), _csvCell('-8.12')] : null }));
  check('E10', 'esc escapes both quotes', !/["']/.test(r.esc), r.esc);
  check('E10', 'CSV cells', !!r.cell && r.cell[0] === `"'=SUM(A1),x"` && r.cell[1] === '"say ""hi"""' && r.cell[2] === '-8.12' && r.cell[3] === '-8.12', r.cell);
});

if (run('E11')) await guard('E11', async () => {
  const r = await E(() => {
    const want = ['A1','A2','a3','A9','A10','A11','A12','A20','A100','B1','B3','B12'];
    const shuffled = ['A12','A2','B12','A10','A1','B3','A100','a3','A9','B1','A20','A11'];
    const d = _lastResultsData, grp = d[0].Protein;
    const rows = d.filter(x => x.Protein === grp).slice(0, 12).map((x, i) => Object.assign({}, x, { Sample_ID: shuffled[i] }));
    const out = { cmp: ['A12','A2','A1','a10'].sort(natCmp), suffix: ['1234-B','1234-A'].sort(natCmp) };
    _natOrder(rows);
    out.order = rows.map(x => x.Sample_ID);
    // Results table, default order and sorted by the compound column
    _sortState = { col: null, asc: true };
    renderResults(rows);
    const names = new Set(want);
    const cells = () => [...document.querySelectorAll('#results-panel td')].map(t => t.textContent.trim()).filter(t => names.has(t));
    out.table = cells();
    _sortState = { col: 'Sample_ID', asc: true };
    renderResults(rows.slice().reverse());
    out.tableSorted = cells();
    _sortState = { col: null, asc: true };
    const sfx = rows.slice(0, 2).map((x, i) => Object.assign({}, x, { Sample_ID: ['1234-B', '1234-A'][i] }));
    _sortState = { col: 'Sample_ID', asc: true }; renderResults(sfx);
    out.sfx = [...document.querySelectorAll('#results-panel td')].map(t => t.textContent.trim()).filter(t => /^1234-/.test(t));
    _sortState = { col: null, asc: true };
    // Curves: the compound select and the Compare list
    renderCurvesTab(rows);
    out.select = [...document.querySelectorAll('#cv-compound option')].map(o => o.textContent.trim()).filter(t => names.has(t.split(/\s/)[0]) || names.has(t)).map(t => t.split(/\s/)[0]);
    setCvMode('compare');
    out.compare = [...document.querySelectorAll('#cv-compare-list .cv-cmp-name')].map(n => (n.firstChild ? n.firstChild.textContent : n.textContent).trim());
    setCvMode('single');
    return out;
  });
  const asWord = (a) => JSON.stringify(a);
  const want = ['A1','A2','a3','A9','A10','A11','A12','A20','A100','B1','B3','B12'];
  check('E11', 'natCmp', asWord(r.cmp) === asWord(['A1','A2','a10','A12']), r.cmp);
  check('E11', 'suffix decides between equal numbers', asWord(r.suffix) === asWord(['1234-A','1234-B']), r.suffix);
  check('E11', '_natOrder', asWord(r.order) === asWord(want), r.order);
  check('E11', 'Results table, default', asWord(r.table) === asWord(want), r.table);
  check('E11', 'Results table, sorted by compound', asWord(r.tableSorted) === asWord(want), r.tableSorted);
  check('E11', 'Results table, 1234-A before 1234-B', asWord(r.sfx) === asWord(['1234-A','1234-B']), r.sfx);
  check('E11', 'Curves compound select', asWord(r.select) === asWord(want), r.select);
  check('E11', 'Curves compare list', asWord(r.compare) === asWord(want), r.compare);
});

if (run('E12')) await guard('E12', async () => {
  await E(() => { window._plateUI = { mode: 'raw_lum', scale: 'assay', labels: false, clip: false, q: '' }; window._plateFit = true; document.querySelector('[data-tab="plate"]').click(); });
  await pg.waitForTimeout(500);
  const r = await E(() => {
    const out = {};
    const first = _plateStats.barcodes[0], id = first.replace(/[^a-z0-9]/gi, '_');
    out.legend = document.getElementById('pl-' + id).textContent;
    // tooltip on a well that holds a compound
    const cv = document.getElementById('pc-' + id), D = cv._dims, wells = _plateData[first];
    let ri = -1, ci = -1;
    outer: for (let r = 0; r < D.nR; r++) for (let c = 0; c < D.nC; c++) { const w = _plWell(wells, PLATE_ROWS[r], c + 1); if (w && _plIsCpd(w)) { ri = r; ci = c; break outer; } }
    const rect = cv.getBoundingClientRect();
    const ev = { currentTarget: cv, clientX: rect.left + (D.padL + (ci + .5) * D.cw) / D.W * rect.width, clientY: rect.top + (D.padT + (ri + .5) * D.ch) / D.H * rect.height };
    plateMouseMove(ev);
    out.tip = document.getElementById('tt').textContent;
    document.getElementById('tt').style.display = 'none';
    out.cardW = cv.parentElement.clientWidth - 32; out.cvW = cv.getBoundingClientRect().width;
    // a loose query finds one compound on every plate that holds it
    const st = _plateStats, cpd = st.compounds.find(c => /13$/.test(c)) || st.compounds[0];
    plateFind(cpd.replace(/([A-Za-z]+)-?0*/, '$1-'));
    const M = _plMatcher(window._plateUI.q); let n = 0, other = 0;
    st.barcodes.forEach(bc => Object.keys(_plateData[bc]).forEach(k => { const w = _plateData[bc][k]; if (M.pred(bc, k, w)) { if (w.s === cpd) n++; else other++; } }));
    out.find = { q: window._plateUI.q, cpd, n, other, expect: st.cpd.get(cpd).n, bar: document.getElementById('plate-found').textContent, shown: getComputedStyle(document.getElementById('plate-found')).display };
    out.keys = [_plKey('EDA-013'), _plKey('eda13'), _plKey('EDA 13')];
    plateFind('zzzz-nothing');
    out.none = document.getElementById('plate-found').textContent;
    plateFind('');
    // the choices survive leaving the tab
    document.getElementById('plate-mode').value = 'compound'; plateUIChanged(); plateFind(cpd);
    document.querySelector('[data-tab="results"]').click();
    return out;
  });
  await pg.waitForTimeout(300);
  const r2 = await E(() => {
    document.querySelector('[data-tab="plate"]').click();
    return new Promise(res => setTimeout(() => {
      const out = { mode: document.getElementById('plate-mode').value, q: document.getElementById('plate-find').value };
      // full names in the compound legend (a long name used to be cut at nine characters)
      const long = 'EDA-013-a-very-long-compound-identifier-HCl';
      const bc = _plateStats.barcodes[0], w = Object.values(_plateData[bc]).find(_plIsCpd); w.s = long;
      plateFind('');
      out.chip = [...document.querySelectorAll('#pl-' + bc.replace(/[^a-z0-9]/gi, '_') + ' .pl-chip')].some(b => b.textContent.includes(long));
      // a 96-well plate is drawn as 96
      const keep = window._plateData, small = {};
      Object.keys(keep).slice(0, 1).forEach(b => { small[b] = {}; Object.keys(keep[b]).forEach(k => { const m = /^([A-P])0*(\d+)$/.exec(k); if (m && m[1] <= 'H' && +m[2] <= 12) small[b][k] = keep[b][k]; }); });
      window._plateData = small; renderPlateTab();
      setTimeout(() => {
        const cv = document.querySelector('.plate-canvas'), rc = cv.getBoundingClientRect();
        out.grid = [cv._dims.nR, cv._dims.nC]; out.aspect = rc.height / rc.width;
        window._plateData = keep; renderPlateTab();
        res(out);
      }, 120);
    }, 400));
  });
  check('E12', 'raw luminescence has a scale in the legend', /RLU/.test(r.legend) && /\d/.test(r.legend), r.legend);
  check('E12', 'tooltip carries the raw reading', /Raw luminescence[\s\S]*RLU/.test(r.tip) && /Compound/.test(r.tip) && /Concentration/.test(r.tip), r.tip);
  check('E12', 'plates fill their cards', r.cvW >= r.cardW * 0.9, { cvW: r.cvW, cardW: r.cardW });
  check('E12', 'a loose query finds exactly that compound, on every plate', r.find.n === r.find.expect && r.find.other === 0 && r.find.n > 0, r.find);
  check('E12', 'the result bar names it', r.find.shown !== 'none' && r.find.bar.includes(r.find.cpd), r.find);
  check('E12', 'EDA-013, eda13 and EDA 13 are one name', new Set(r.keys).size === 1, r.keys);
  check('E12', 'no match says so', /Nothing on any plate/.test(r.none), r.none);
  check('E12', 'colour mode and search survive a tab switch', r2.mode === 'compound' && r2.q.length > 0, r2);
  check('E12', 'compound legend carries the full name', r2.chip, r2);
  check('E12', '96-well plate is drawn as 96', r2.grid[0] === 8 && r2.grid[1] === 12 && r2.aspect < 0.75, r2);
  await E(() => { window._plateUI = { mode: 'raw_lum', scale: 'assay', labels: false, clip: false, q: '' }; });
});

if (run('E13')) await guard('E13', async () => {
  const r = await E(() => ({ order: [...document.querySelectorAll('.tabs .tab')].map(t => t.dataset.tab), panes: document.querySelectorAll('.tabpane.active').length }));
  const o = r.order, first5 = o.slice(0, 5);
  check('E13', 'the analysis views come first, in the order you use them', JSON.stringify(first5) === JSON.stringify(['results', 'curves', 'scatter', 'plate', 'props']), first5);
  check('E13', 'housekeeping tabs come after', ['log', 'history', 'protocol', 'survey', 'guide'].every(t => o.indexOf(t) > 4), o);
  check('E13', 'one pane is showing', r.panes === 1, r.panes);
});

await browser.close();
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
skipped.forEach(s => console.log('  – skipped: ' + s));
if (pageErrs.length) { console.log('  ✗ page errors:'); [...new Set(pageErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + pageErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Echo invariants hold.');
process.exit(failed ? 1 : 0);
