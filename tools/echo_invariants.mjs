// Echo Dose Response invariants — the bug classes the 2026-09-28 beta test of the Curves, Plots
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
//   E14 plate QC is arithmetic  Z′, S/B, CV and control drift match the formulas on plates built to known values.
//   E15 comparing plates      Two identical plates agree perfectly (r = 1, ratio 1, 100% within tolerance); one at
//                             twice the other reads 2× with r = 1; both match modes and the diff map draw.
//   E16 the plate edits fits  Right-click a well: it is left out of its curve (and drawn crossed), the DC50 refits,
//                             the same click puts it back to the digit, and ⌘Z in Curves undoes it and redraws the plate.
//   E17 failed transfers show The Echo's failed rows are kept (not just counted) and the Plate tab counts them and
//                             says so in its legend, meta line and QC table.
//   E18 wells as data         The wells CSV carries exactly the wells a search matches, with role, dose and exclusion,
//                             quoted and formula-safe.
//   E19 pictures from Echo    Labbook keeps only real image data URLs from another app, at most 12, with safe names.
//   E20 the planner keeps       Typing a decimal into Source, a pre-fill or a volume at a human pace keeps the box, the caret and every
//       what you type          digit (the planner re-drew the stock boxes 220 ms after each key, so "0.5" became 5); an intermediate you
//                              are typing in survives the re-plan; restoring an analysis session never writes into the planner.
//   E21 Dmax is the span       Dmax / Span is top − bottom of the fitted curve, not 100 − bottom: a curve that starts at 80 %
//                             and falls to 20 % has Dmax 60 in the pipeline's rows and in the local refit.
//   E22 the Smart DMSO         The 100 % reference is learned from the plate's own control wells: a clean plate is not made
//       control is smart       noisier than the plain mean, a real row / odd-even / left-to-right effect is followed, one bad control
//                              well cannot move a row, the 0 % control scales with the row's reference, and with the toggle off the
//                              numbers are exactly the plain plate mean.
//   E23 the results table      A confidence limit is never printed as a long run of digits (three significant figures, a power of ten outside
//                              0.01–99,999, ∞ for an unbounded limit), and column widths follow the content: Flag and the numbers take what
//                              they need, Reason is the widest and wraps. The app is called Echo Dose Response in the setup header.
//   E24 a setting is a      An emptied number on the Setup form uses its default and says so (no NaN anywhere, no gate switched off in silence);
//       number or an error  a top, a Hill slope or a fixed bottom that cannot mean anything stops the run with the reason instead of
//                           flagging every curve; an empty control range is an error, not raw counts; "B1-O2" is a rectangle and
//                           "B12:O12, B1:O1" is two ranges.
//   E25 missing is missing  A well with no reading is left out of a fit. It used to be a point at 0 % of control: fully degraded.
//   E26 input files         The Echo file may be comma-, semicolon- or tab-separated, end its lines with \r, carry a BOM, give its
//                           concentrations in µM, write 2,001E-05, and spell one compound in two cases; a reader cell may be "1000,5",
//                           "1 000,5" or OVRFLW. Two transfer files with different columns are not merged.
//   E27 one analysis,       Redrawing the results (sort, show all, a curve edit) does not add History entries; the entry carries the
//       one history entry   run's own settings; a full browser store drops the oldest, not the new one.
//   E28 Properties names    The Properties tab lists a compound's potency for every group it was fitted in, not the last one.
//       every group
//   E29 the source plate    Remaining volume ignores transfers that failed and transfers from other source plates, and a well asked for
//       tells the truth     more than it holds is a shortfall, not "empty".
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

// A plate built to known numbers, shared by E14/E15: wells are [row 0-15, col 1-24] → value.
const SYN = `window.__syn = function (name, spec) {
  const w = {}; const id = (r, c) => String.fromCharCode(65 + r) + (c < 10 ? '0' + c : c);
  spec.forEach(s => { w[id(s.r, s.c)] = Object.assign({m: s.m == null ? null : s.m, raw: s.raw, ctrl: !!s.ctrl, s: s.s || (s.ctrl ? 'CTRL' : ''), c: s.cc == null ? null : s.cc, p: s.p || 'G1'}, s.z ? {z: true} : {}); });
  return w; };`;

if (run('E14')) await guard('E14', async () => {
  await E(SYN);
  const r = await E(() => {
    const keep = window._plateData, spec = [];
    // 100% controls: mean 100000, alternating ±1000. 0% controls: mean 5000, alternating ±200.
    for (let i = 0; i < 14; i++) { spec.push({r: i + 1, c: 12, ctrl: true, raw: 100000 + (i % 2 ? 1000 : -1000)}); spec.push({r: i + 1, c: 24, z: true, ctrl: false, raw: 5000 + (i % 2 ? 200 : -200)}); }
    window._plateData = {'Q-01': __syn('Q-01', spec)};
    const sd = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
    const c = spec.filter(s => s.ctrl).map(s => s.raw), z = spec.filter(s => s.z).map(s => s.raw);
    const mc = c.reduce((s, v) => s + v, 0) / c.length, mz = z.reduce((s, v) => s + v, 0) / z.length;
    _plateComputeStats(); window._plateGrid = {nR: 16, nC: 24};
    const q = _plQCStats('Q-01');
    const out = {got: {z: q.zprime, sb: q.sb, cv: q.c.cv, n: q.c.n, verdict: q.verdict}, want: {z: 1 - 3 * (sd(c) + sd(z)) / Math.abs(mc - mz), sb: mc / mz, cv: sd(c) / mc * 100}};
    // drift: control climbs 1000 per row down the plate
    const spec2 = []; for (let i = 0; i < 14; i++) spec2.push({r: i + 1, c: 12, ctrl: true, raw: 100000 + 1000 * i});
    window._plateData = {'D-01': __syn('D-01', spec2)}; _plateComputeStats();
    const d = _plQCStats('D-01'); out.drift = {got: d.driftRow, want: 13000 / 106500 * 100, col: d.driftCol};
    // and the view draws
    window._plateData = {'Q-01': __syn('Q-01', spec)}; _plateComputeStats(); window._plateUI.view = 'qc';
    renderPlateTab(); out.table = document.querySelector('.pq-table')?.textContent || '';
    window._plateUI.view = 'maps'; window._plateData = keep; _plateComputeStats(); renderPlateTab();
    return out;
  });
  const near = (a, b, t) => a != null && Math.abs(a - b) <= t;
  check('E14', "Z′", near(r.got.z, r.want.z, 1e-9), r);
  check('E14', 'S/B', near(r.got.sb, r.want.sb, 1e-9), r);
  check('E14', 'control CV', near(r.got.cv, r.want.cv, 1e-9) && r.got.n === 14, r);
  check('E14', 'verdict from Z′', r.got.verdict === 'good', r.got);
  check('E14', 'drift down the rows', near(r.drift.got, r.drift.want, 0.01) && r.drift.col == null, r.drift);
  check('E14', 'the QC table names the plate', /Q-01/.test(r.table) && /Good/.test(r.table), r.table.slice(0, 120));
});

if (run('E15')) await guard('E15', async () => {
  await E(SYN);
  const r = await E(() => {
    const keep = window._plateData, mk = (f) => { const spec = []; for (let i = 0; i < 40; i++) { const raw = 20000 + i * 3000 + (i % 7) * 500; spec.push({r: 2 + (i >> 3), c: 2 + (i % 8), raw: f(raw), m: f(raw) / 1000, s: 'CPD-' + (i % 5 + 1), cc: -7 + (i % 8) * 0.3}); } return __syn('x', spec); };
    const out = {};
    const run = (a, b, match, val) => { const P = _plCmpPairs(a, b, match, val); return {P, S: _plCmpStats(P, val)}; };
    window._plateData = {A: mk(v => v), B: mk(v => v)}; _plateComputeStats(); window._plateGrid = {nR: 16, nC: 24};
    let x = run('A', 'B', 'well', 'raw'); out.same = {n: x.S.n, r: x.S.r, ratio: x.S.medRatio, within: x.S.within, worst: x.S.worst[0].d};
    window._plateData = {A: mk(v => v), B: mk(v => v * 2)}; _plateComputeStats();
    x = run('A', 'B', 'well', 'raw'); out.double = {r: x.S.r, ratio: x.S.medRatio, within: x.S.within};
    x = run('A', 'B', 'dose', 'raw'); out.dose = {n: x.S.n, ratio: x.S.medRatio};
    // signal % difference, and the two views draw
    window._plateUI.cmp = {a: 'A', b: 'B', match: 'well', val: 'm'}; window._plateUI.view = 'compare';
    let err = null; try { renderPlateTab(); out.hasDiff = !!document.getElementById('pcm-diff'); out.hasScatter = !!document.getElementById('pcm-cv'); out.stats = document.querySelector('.pcm-stats')?.textContent || '';
      window._plateUI.cmp.match = 'dose'; plateCmpChanged(); out.doseView = document.querySelector('.pcm-stats')?.textContent || ''; } catch (e) { err = String(e.message); }
    out.err = err;
    window._plateUI.view = 'maps'; window._plateData = keep; _plateComputeStats(); renderPlateTab();
    return out;
  });
  check('E15', 'identical plates agree', r.same.n === 40 && Math.abs(r.same.r - 1) < 1e-9 && Math.abs(r.same.ratio - 1) < 1e-9 && r.same.within === 1 && r.same.worst === 0, r.same);
  check('E15', 'twice the reading is 2×, r = 1, none within tolerance', Math.abs(r.double.ratio - 2) < 1e-9 && Math.abs(r.double.r - 1) < 1e-9 && r.double.within === 0, r.double);
  check('E15', 'matching by compound and dose pairs them', r.dose.n > 0 && Math.abs(r.dose.ratio - 2) < 1e-9, r.dose);
  check('E15', 'both views draw', !r.err && r.hasDiff && r.hasScatter && /Pairs/.test(r.stats) && /Pairs/.test(r.doseView), r);
});

if (run('E16')) await guard('E16', async () => {
  await E(() => { window._plateUI.view = 'maps'; document.querySelector('[data-tab="plate"]').click(); });
  await pg.waitForTimeout(500);
  const r = await E(() => {
    const bc = 'BRD3-01', wells = _plateData[bc];
    const wid = Object.keys(wells).find(k => { const w = wells[k]; return _plIsCpd(w) && w.c != null && w.m != null && _plFit(w.s, w.p, bc); });
    const w = wells[wid], fit = _plFit(w.s, w.p, bc), row = wid[0], col = +wid.slice(1);
    const before = {dc: fit.DC50_nM, r2: fit.R2}, cv = document.getElementById('pc-BRD3_01'), D = cv._dims, rc = cv.getBoundingClientRect();
    const click = () => cv.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: rc.left + (D.padL + (col - .5) * D.cw) / D.W * rc.width, clientY: rc.top + (D.padT + (row.charCodeAt(0) - 64 - .5) * D.ch) / D.H * rc.height}));
    const out = {well: wid, before};
    click(); out.afterExclude = {ex: _plExcluded(bc, w), dc: fit.DC50_nM, undo: _CV_UNDO.length, legend: document.getElementById('pl-BRD3_01').textContent, meta: document.getElementById('pm-BRD3_01').textContent};
    click(); out.afterBack = {ex: _plExcluded(bc, w), dc: fit.DC50_nM, r2: fit.R2};
    click(); cvUndo(); out.afterUndo = {ex: _plExcluded(bc, w), dc: fit.DC50_nM, meta: document.getElementById('pm-BRD3_01').textContent};
    return out;
  });
  check('E16', 'a well right-clicked is left out and drawn crossed', r.afterExclude.ex && /Excluded from fit/.test(r.afterExclude.legend) && /excluded/.test(r.afterExclude.meta) && r.afterExclude.undo >= 1, r.afterExclude);
  check('E16', 'the curve refits without it', r.afterExclude.dc !== r.before.dc, { before: r.before, after: r.afterExclude.dc });
  check('E16', 'the same click puts it back to the digit', !r.afterBack.ex && r.afterBack.dc === r.before.dc && r.afterBack.r2 === r.before.r2, r);
  check('E16', '⌘Z undoes it and the plate redraws', !r.afterUndo.ex && r.afterUndo.dc === r.before.dc && !/excluded/.test(r.afterUndo.meta), r.afterUndo);
});

if (run('E17')) await guard('E17', async () => {
  const r = await E(async () => {
    const csv = ['Sample ID,Destination Plate Barcode,Destination Well,Destination Concentration,Transfer Status', 'EDA-1,BRD9-01,A1,1e-6,', 'EDA-1,BRD9-01,A2,1e-7,Fault: no droplet detected', 'EDA-2,BRD9-01,A3,1e-7,OK'].join('\n');
    const d = _parseEchoCSV(csv, 0), out = {n: d.length, failed: (d.failed || []).map(f => [f.sampleId, f.well, f.status])};
    const keep = window._plateData, bc = Object.keys(keep)[0], id = Object.keys(keep[bc]).find(k => _plIsCpd(keep[bc][k]));
    const saved = JSON.stringify(keep[bc][id]); keep[bc][id].f = 'Fault: no droplet'; keep[bc][id].fs = keep[bc][id].s;
    window._plateUI.view = 'maps'; window._plateUI.mode = 'transfer'; renderPlateTab();
    await new Promise(res => setTimeout(res, 250));
    const sid = bc.replace(/[^a-z0-9]/gi, '_');
    out.legend = document.getElementById('pl-' + sid).textContent; out.meta = document.getElementById('pm-' + sid).textContent;
    window._plateUI.view = 'qc'; renderPlateTab(); out.qc = document.querySelector('.pq-table')?.textContent || ''; out.cards = document.querySelector('.pq-fl')?.textContent || '';
    keep[bc][id] = JSON.parse(saved); window._plateUI.view = 'maps'; window._plateUI.mode = 'raw_lum'; renderPlateTab();
    return out;
  });
  check('E17', 'failed rows are kept, good ones parsed', r.n === 2 && r.failed.length === 1 && /^A0?2$/.test(r.failed[0][1]) && /Fault/.test(r.failed[0][2]), r);
  check('E17', 'legend and meta count the failure', /Transfer failed\s*1/.test(r.legend) && /1 failed transfer/.test(r.meta), { legend: r.legend, meta: r.meta });
  check('E17', 'the QC table and card say so', /1 failed/.test(r.qc) && /Fault/.test(r.cards), { qc: r.qc.slice(-160), cards: r.cards });
});

if (run('E18')) await guard('E18', async () => {
  const r = await E(() => {
    window._plateUI.view = 'maps'; renderPlateTab();
    const st = _plateStats, cpd = st.compounds[0], keep = window._plateUI.q;
    window._plateUI.q = cpd; const some = _plWellRows(true); const all = _plWellRows(false);
    window._plateUI.q = keep;
    const weird = _csvCell('=HYPERLINK("x")');
    return {cpd, n: some.length, expect: st.cpd.get(cpd).n, only: some.every(x => x.Compound === cpd), cols: Object.keys(some[0]), total: all.length, wells: Object.values(_plateData).reduce((s, p) => s + Object.keys(p).length, 0), roles: [...new Set(all.map(x => x.Role))], conc: some[0].Concentration_nM, weird};
  });
  check('E18', 'a search exports exactly its wells', r.n === r.expect && r.only, { n: r.n, expect: r.expect });
  check('E18', 'no query exports every well', r.total === r.wells, { total: r.total, wells: r.wells });
  check('E18', 'columns and roles', ['Plate', 'Well', 'Compound', 'Concentration_nM', 'Raw_RLU', 'Signal_pct', 'Role', 'Excluded_from_fit', 'Echo_transfer'].every(c => r.cols.includes(c)) && r.roles.includes('compound') && r.roles.includes('control'), r);
  check('E18', 'a dose is in nM, a formula is inert', typeof r.conc === 'number' && r.conc > 0 && /^"?'=/.test(r.weird), { conc: r.conc, weird: r.weird });
});

if (run('E19')) await guard('E19', async () => {
  const lb = path.join(ROOT, 'apps/labbook/labbook.html');
  if (!fs.existsSync(lb)) { skipped.push('E19 — Labbook source not found'); return; }
  // What Echo actually sends: every plate as drawn, and the QC table.
  const sent = await E(() => {
    window._plateUI.view = 'maps'; renderPlateTab();
    return new Promise(res => setTimeout(() => {
      const keep = window._plToLabbook, got = [];
      window._plToLabbook = (c) => { got.push(c); return true; };
      plateSendImages(); plateSendQC(); window._plToLabbook = keep;
      res({images: got[0] && got[0].images, tables: got[1] && got[1].tables, nPlates: Object.keys(_plateData).length});
    }, 300));
  });
  check('E19', 'Echo sends one picture per plate, each a PNG data URL with a caption', !!sent.images && sent.images.length === sent.nPlates && sent.images.every(i => /^data:image\/png;base64,.{200,}/.test(i.dataUrl) && /—/.test(i.caption) && /\.png$/.test(i.name)), sent.images && sent.images.map(i => [i.name, i.dataUrl.length]));
  check('E19', 'and the QC table, one row per plate', !!sent.tables && sent.tables[0].rows.length === sent.nPlates && sent.tables[0].cols.length === sent.tables[0].rows[0].length, sent.tables);
  const p2 = await ctx.newPage(); const errs2 = [];
  p2.on('pageerror', e => errs2.push(String(e && e.message || e)));
  await p2.goto('file://' + lb); await p2.waitForTimeout(1500);
  const r = await p2.evaluate((images) => {
    if (typeof _cleanCtx !== 'function') return {missing: true};
    const echoKept = _cleanCtx({images}).images.length;
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const good = _cleanCtx({images: [{name: 'a/b:c.png', dataUrl: png, caption: 'x'.repeat(500)}]}).images;
    const bad = _cleanCtx({images: [{name: 'h', dataUrl: 'data:text/html;base64,PHNjcmlwdD4='}, {name: 'j', dataUrl: 'javascript:alert(1)'}, {name: 'n'}, null, 'str']}).images;
    const many = _cleanCtx({images: Array.from({length: 30}, (_, i) => ({name: 'p' + i + '.png', dataUrl: png}))}).images;
    const none = _cleanCtx({images: 'nope'}).images;
    return {good, bad, many: many.length, none: none === undefined, echoKept};
  }, sent.images || []);
  await p2.close();
  if (r.missing) { check('E19', 'Labbook cleans pictures', false, 'no _cleanCtx'); return; }
  check('E19', 'a real image is kept, with a safe name and a short caption', r.good.length === 1 && !/[\\/:]/.test(r.good[0].name) && r.good[0].caption.length === 300, r.good);
  check('E19', 'anything that is not an image data URL is dropped', r.bad.length === 0, r.bad);
  check('E19', 'everything Echo sends, Labbook keeps', r.echoKept === (sent.images || []).length && r.echoKept > 0, { kept: r.echoKept, sent: (sent.images || []).length });
  check('E19', 'at most 12', r.many === 12, r.many);
  check('E19', 'not a list → no images', r.none, r);
  if (errs2.length) check('E19', 'no page error in Labbook', false, errs2);
});

if (run('E21')) await guard('E21', async () => {
  const res = await E(() => {
    // every row the pipeline produced: Dmax = round(top − bottom) of its own fit
    const rows = _lastResultsData.filter(r => !r._gainMode && r.Top_val != null && r.Bot_val != null && r.Dmax_pct != null);
    const badRows = rows.filter(r => r.Dmax_pct !== Math.round(r.Top_val - r.Bot_val)).map(r => `${r.Sample_ID}·${r.Protein} ${r.Dmax_pct} vs ${(r.Top_val - r.Bot_val).toFixed(1)}`);
    // a curve that starts at 80 % and ends at 20 %, top left free: span 60, not 100 − 20 = 80
    const xs = [-9, -8.5, -8, -7.5, -7, -6.5, -6, -5.5, -5], pts = [];
    for (const x of xs) for (let k = 0; k < 2; k++) pts.push({ x, y: 20 + 60 / (1 + Math.pow(10, 1 * (x - -7))) });
    const f = fit4PL_JS(pts, false, 100, false, null, false, null);
    return { n: rows.length, badRows, local: f && f.dmax, top: f && f.top, bot: f && f.bot };
  });
  check('E21', 'rows from the pipeline: Dmax = top − bottom', res.n > 0 && !res.badRows.length, res);
  check('E21', 'local refit with a free top: Dmax = 60, not 100 − bottom', res.local != null && Math.abs(res.local - 60) <= 1, res);
  // the whole pipeline again with the top left free: Dmax must still be top − bottom of each fit
  await E(() => { document.getElementById('p-top-en').checked = false; runPipeline(); });
  await pg.waitForTimeout(1500);
  await pg.waitForFunction(() => !window._pipelineRunning && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 }).catch(() => {});
  const free = await E(() => {
    const rows = _lastResultsData.filter(r => !r._gainMode && r.Top_val != null && r.Bot_val != null && r.Dmax_pct != null);
    const moved = rows.filter(r => Math.abs(r.Top_val - 100) > 1).length;
    return { n: rows.length, moved, bad: rows.filter(r => Math.abs(r.Dmax_pct - (r.Top_val - r.Bot_val)) > 1).map(r => `${r.Sample_ID}·${r.Protein} ${r.Dmax_pct} vs ${(r.Top_val - r.Bot_val).toFixed(1)}`).slice(0, 5) };
  });
  check('E21', 'free top, whole pipeline: Dmax = top − bottom', free.n > 0 && !free.bad.length, free);
  await E(() => { document.getElementById('p-top-en').checked = true; });
});

if (run('E20')) await guard('E20', async () => {
  await E(() => { document.getElementById('setup-modal')?.classList.add('hidden'); [...document.querySelectorAll('.outer-tab')].find(b => /Gradient/.test(b.textContent)).click(); });
  await pg.waitForTimeout(700);
  const typeSlow = async (sel, text, delay) => {
    await pg.click(sel, { clickCount: 3 });
    for (const ch of text) { await pg.keyboard.type(ch); await pg.waitForTimeout(delay); }
    await pg.waitForTimeout(500);
  };
  const state = () => E(() => ({ src: window._egS[0].val, srcBox: document.querySelector('#eg-stocks-container input').value,
    focusOk: document.activeElement && document.activeElement.tagName === 'INPUT', pre: document.getElementById('eg-inter-vol').value,
    vol: document.getElementById('eg-vol').value, rows: document.querySelectorAll('#eg-tbody tr').length }));
  for (const [what, sel, text, key] of [['Source', '#eg-stocks-container input', '0.5', 'src'], ['Source', '#eg-stocks-container input', '12.25', 'src']]) {
    await typeSlow(sel, text, 320);
    const st = await state();
    check('E20', `typing ${text} into ${what} at a human pace gives ${text}`, st.src === parseFloat(text) && st.srcBox === text && st.focusOk, st);
  }
  await typeSlow('#eg-inter-vol', '12.5', 320);
  let st = await state(); check('E20', 'a decimal pre-fill volume is kept', st.pre === '12.5', st);
  await typeSlow('#eg-vol', '17.5', 320);
  st = await state(); check('E20', 'a decimal assay volume is kept', st.vol === '17.5' && st.rows > 0, st);
  // an intermediate typed by hand is not re-drawn under the caret
  await E(() => { window._egLoadPreset('hibit'); });
  await pg.waitForTimeout(600);
  const n = await E(() => window._egS.length);
  if (n > 1) {
    const before = await E(() => { const i = document.querySelectorAll('#eg-stocks-container input')[1]; i.dataset.mark = 'kept'; return true; });
    await typeSlow('#eg-stocks-container .eg-srow:nth-child(2) input', '7.5', 320);
    const kept = await E(() => ({ same: document.querySelectorAll('#eg-stocks-container input')[1].dataset.mark === 'kept', v: window._egS[1].val }));
    check('E20', 'an intermediate being typed in is the same box afterwards, with every digit', kept.same && kept.v === 7.5, kept);
  }
  // a restored analysis never touches the planner
  const leak = await E(() => {
    const snap = _esFormState(); const keys = Object.keys(snap).filter(k => k.startsWith('eg-'));
    document.getElementById('eg-vol').value = '33'; _esApplyForm({ 'eg-vol': '99', 'eg-inter-vol': '99' });
    return { keys, vol: document.getElementById('eg-vol').value };
  });
  check('E20', 'an analysis session neither saves nor restores planner boxes', leak.keys.length === 0 && leak.vol === '33', leak);
});

if (run('E22')) await guard('E22', async () => {
  const res = await E(() => {
    // seeded normal noise, so a failure is reproducible
    let seed = 12345; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
    const cv = 0.08;
    // 14 rows (B..O) of controls in the given columns; eff(row,col) is the true reference of that spot
    const plate = (cols, eff, bad) => { const pts = []; for (let r = 1; r <= 14; r++) for (const c of cols) pts.push({ well: String.fromCharCode(65 + r) + String(c + 1).padStart(2, '0'), row: r, col: c, v: eff(r, c) * (1 + cv * gauss()) }); if (bad) bad(pts); return pts; };
    const out = {};
    const stat = (n, eff, cols) => { let sp = 0, sr = 0, ss = 0, flagged = 0;
      for (let i = 0; i < n; i++) {
        const pts = plate(cols, eff), m = _smartCtrl(pts, { nR: 16 }), mu = pts.reduce((a, p) => a + p.v, 0) / pts.length;
        const r = 1 + Math.floor(rnd() * 14), c = cols[0], t = eff(r, c), x = t * (1 + cv * gauss());
        const own = pts.filter(p => p.row === r), rm = own.reduce((a, p) => a + p.v, 0) / own.length;
        sp += (x / mu - 1) ** 2; sr += (x / rm - 1) ** 2; ss += (x / m.ref(r, c) - 1) ** 2;
        if (m.info.rowEffect && m.info.rowEffect.applied) flagged++;
      }
      return { plate: Math.sqrt(sp / n), row: Math.sqrt(sr / n), smart: Math.sqrt(ss / n), flagged: flagged / n }; };
    out.clean = stat(2000, () => 1, [21, 22]);   // many plates: the cost is a few %, and 300 plates cannot resolve 3 % from sampling noise
    // a row effect, redrawn for every plate
    { let sp = 0, sr = 0, ss = 0, n = 300, flagged = 0;
      for (let i = 0; i < n; i++) { const fx = Array.from({ length: 16 }, () => 1 + 0.1 * gauss()), eff = r => fx[r];
        const pts = plate([21, 22], eff), m = _smartCtrl(pts, { nR: 16 }), mu = pts.reduce((a, p) => a + p.v, 0) / pts.length;
        const r = 1 + Math.floor(rnd() * 14), x = eff(r) * (1 + cv * gauss()), own = pts.filter(p => p.row === r), rm = own.reduce((a, p) => a + p.v, 0) / own.length;
        sp += (x / mu - 1) ** 2; sr += (x / rm - 1) ** 2; ss += (x / m.ref(r, 21) - 1) ** 2; if (m.info.rowEffect.applied) flagged++; }
      out.rowFx = { plate: Math.sqrt(sp / n), row: Math.sqrt(sr / n), smart: Math.sqrt(ss / n), flagged: flagged / n }; }
    // one dead control well (40 %) in a row, in 100 plates
    { let worst = 0, missed = 0;
      for (let i = 0; i < 100; i++) { const r = 1 + Math.floor(rnd() * 14), pts = plate([21, 22], () => 1, ps => { const q = ps.find(p => p.row === r && p.col === 22); q.v = 0.4 * (1 + 0.02 * gauss()); });
        const m = _smartCtrl(pts, { nR: 16 }); worst = Math.max(worst, Math.abs(m.ref(r, 21) - 1)); if (!m.info.rejected.some(x => x.well === String.fromCharCode(65 + r) + '23')) missed++; }
      out.bad = { worst, missed }; }
    // a left-to-right drift of 20 % across the plate, controls on both sides
    { const slope = 0.2 / 22, eff = (r, c) => 1 + slope * (c - 11.5), pts = plate([0, 1, 22, 23], eff), m = _smartCtrl(pts, { nR: 16 });
      let worst = 0; for (const c of [0, 3, 6, 11, 17, 20, 23]) worst = Math.max(worst, Math.abs(m.ref(5, c) / eff(5, c) - 1));
      out.drift = { applied: !!(m.info.trend && m.info.trend.applied), worst, pct: m.info.trend && m.info.trend.pct };
      const one = _smartCtrl(plate([21, 22], () => 1), { nR: 16 }); out.driftOneSide = { note: one.info.notes.some(n => /left-to-right/.test(n)), trend: !!one.info.trend }; }
    // odd rows +15 %, even rows −5 %, controls in rows B..O only: rows A and P borrow their parity's reference
    { const eff = r => r % 2 ? 1.15 : 0.95, pts = plate([21, 22], eff), m = _smartCtrl(pts, { nR: 16 });
      out.parity = { applied: !!(m.info.parity && m.info.parity.applied), a: m.ref(0, 5) / eff(0) - 1, p: m.ref(15, 5) / eff(15) - 1, mode: m.info.mode }; }
    // one control per row: no row effect can be told from noise — plate reference, and it says so
    { const pts = plate([21], r => (r === 5 ? 1.3 : 1)), m = _smartCtrl(pts, { nR: 16 });
      out.single = { note: m.info.notes.some(n => /one control well per row/i.test(n)), rowEffect: !!(m.info.rowEffect && m.info.rowEffect.applied) }; }
    // the 0 % control scales with the row: a row reading 1.2× gives the same answer as one reading 1×
    { const c0 = 1000, z0 = 100, f = 0.5, meas0 = z0 + f * (c0 - z0), s = 1.2;
      out.disp = { same: _normValue('displacement', meas0 * s, c0 * s, z0, s), plain: _normValue('displacement', meas0, c0, z0, 1), unscaled: _normValue('displacement', meas0 * s, c0 * s, z0, 1), gain: _normValue('gain', 700, 200, null, 1), ratio: _normValue('hibit', 40, 80, null, 1) }; }
    // the p-values the tests use
    out.p = { t: _pT2(2.228, 10), f: _pF(4.066, 3, 8), tq: _tQ95(10) };
    return out;
  });
  check('E22', 'a clean plate costs at most a few % of noise against the plate mean (≤ 6 %)', res.clean.smart <= res.clean.plate * 1.06, res.clean);
  check('E22', 'a clean plate rarely invents a row effect (≤ 12 % of plates)', res.clean.flagged <= 0.12, res.clean);
  check('E22', 'with a real row effect it beats the plate mean and the raw row mean', res.rowFx.smart < res.rowFx.plate * 0.9 && res.rowFx.smart <= res.rowFx.row * 1.03, res.rowFx);
  check('E22', 'a dead control well is left out, every time, and cannot move its row', res.bad.missed === 0 && res.bad.worst < 0.12, res.bad);
  check('E22', 'a 20 % left-to-right drift is followed across the plate (within 4.5 % with 8 % well noise)', res.drift.applied && res.drift.worst < 0.045, res.drift);
  check('E22', 'controls on one side only: no drift invented, and it says it cannot check', !res.driftOneSide.trend && res.driftOneSide.note, res.driftOneSide);
  check('E22', 'odd/even rows are told apart and a row with no control borrows its parity', res.parity.applied && Math.abs(res.parity.a) < 0.04 && Math.abs(res.parity.p) < 0.04, res.parity);
  check('E22', 'one control per row: no row effect claimed, and it says why', res.single.note && !res.single.rowEffect, res.single);
  check('E22', 'the 0 % control scales with the row (same answer at 1.2× as at 1×)', Math.abs(res.disp.same - res.disp.plain) < 1e-9 && Math.abs(res.disp.unscaled - res.disp.plain) > 0.5, res.disp);
  check('E22', 'normalised value per assay: gain subtracts, the rest divide', res.disp.gain === 500 && res.disp.ratio === 50, res.disp);
  check('E22', 'the t and F p-values are the textbook ones', Math.abs(res.p.t - 0.05) < 0.001 && Math.abs(res.p.f - 0.05) < 0.001 && Math.abs(res.p.tq - 2.228) < 0.001, res.p);

  // the whole pipeline: toggle off is the plain mean, toggle on learns per plate and the QC tab shows it
  const off = await E(() => {
    const out = { plates: 0, bad: [], smartKeys: Object.keys(window._smartInfo || {}).length };
    for (const [bc, wells] of Object.entries(window._plateData)) {
      const ctrl = Object.values(wells).filter(w => w.ctrl && w.raw != null); if (!ctrl.length) continue; out.plates++;
      const mean = ctrl.reduce((a, w) => a + w.raw, 0) / ctrl.length;
      for (const w of Object.values(wells)) if (w.raw != null && w.m != null && Math.abs(w.m - w.raw / mean * 100) > 0.06 * Math.max(1, w.raw / mean) + 0.02) out.bad.push(bc);
    }
    return out;
  });
  check('E22', 'toggle off: every well is raw / plain control mean × 100 and nothing smart is recorded', off.plates > 0 && !off.bad.length && off.smartKeys === 0, off);
  await E(() => { document.getElementById('p-row-norm').checked = true; runPipeline(); });
  await pg.waitForTimeout(1500);
  await pg.waitForFunction(() => !window._pipelineRunning && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 }).catch(() => {});
  const on = await E(() => {
    const info = window._smartInfo || {}, bcs = Object.keys(window._plateData);
    const nan = Object.values(window._plateData).some(p => Object.values(p).some(w => w.m != null && !isFinite(w.m)));
    let html = ''; try { _plateComputeStats(); window._plateGrid = _plGrid(window._plateData); const host = document.createElement('div'); _plateQCRender(host); html = host.innerHTML; } catch (e) { html = 'THREW ' + e.message; }
    return { plates: bcs.length, smart: Object.keys(info).length, modes: [...new Set(Object.values(info).map(i => i.mode))], nan, rows: _lastResultsData.length,
      qc: /Smart ·/.test(html), qcCard: /100% reference per row/.test(html), threw: /THREW/.test(html) ? html.slice(0, 120) : '', params: (typeof _lastAnalysisParams !== 'undefined') && _lastAnalysisParams.rowNorm === true };
  });
  check('E22', 'toggle on: a model for every plate, results produced, no NaN', on.plates > 0 && on.smart === on.plates && on.rows > 0 && !on.nan && on.params, on);
  check('E22', 'toggle on: the Plate QC tab says what the reference did', on.qc && on.qcCard && !on.threw, on);
  await E(() => { document.getElementById('p-row-norm').checked = false; });
});

if (run('E23')) await guard('E23', async () => {
  // E20 and E21 leave the Gradient Planner open, and the widths of a hidden pane are 0.
  await E(() => { switchPanel('analysis', document.querySelectorAll('.outer-tab')[0]); document.querySelector('.tab[data-tab="results"]').click(); });
  await pg.waitForTimeout(500);
  const res = await E(() => {
    const strip = h => h.replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
    const cases = [[3.1e-5, 1.1e7], [0.00429, 1.68e6], [0, Infinity], [0, null], [1.04, 34100], [9.996e-3, 99999.7], [0.272, 3.99e6], [5, 5.7]]
      .map(([a, b]) => strip(_ciHtml(a, b)));
    renderResults(_lastResultsData);
    const cells = [...document.querySelectorAll('.results-tbl-scroll td.c-ci')].map(c => c.textContent);
    const ths = Object.fromEntries([...document.querySelectorAll('.results-tbl-scroll th')].map(t => [t.textContent.replace(/ [▲▼]$/, ''), t.getBoundingClientRect().width]));
    const reasons = [...document.querySelectorAll('.results-tbl-scroll td.c-reason')];
    return { cases, cells: cells.length, longCells: cells.filter(t => /\d{7,}|e[+-]?\d/.test(t)), ths,
      reasonOverflow: reasons.filter(c => c.scrollWidth > c.clientWidth + 1).length, title: document.querySelector('.setup-htitle')?.textContent, tab: document.title };
  });
  check('E23', 'limits read as three significant figures, a power of ten outside 0.01–99,999, ∞ when unbounded',
    JSON.stringify(res.cases) === JSON.stringify(['3.1×10^−5–1.1×10^7', '4.29×10^−3–1.68×10^6', '0–∞', '0–∞', '1.04–34100', '0.01–1×10^5', '0.272–3.99×10^6', '5–5.7']), res.cases);
  check('E23', 'no confidence limit in the table runs to seven digits or prints as 1e-5', res.cells > 0 && !res.longCells.length, res.longCells.slice(0, 5));
  check('E23', 'Reason is the widest column and Flag is narrow (widths follow the content)', res.ths.Reason > 200 && res.ths.Flag < 70 && res.ths.Reason > 3 * res.ths.Flag, res.ths);
  check('E23', 'the Reason text wraps rather than being cut', res.reasonOverflow === 0, res.reasonOverflow);
  check('E23', 'the app is called Echo Dose Response', res.title === 'Echo Dose Response' && res.tab === 'Echo Dose Response', { t: res.title, tab: res.tab });
});

// ── E24–E29: the input and bookkeeping beat of 2026-10-03 ──────────────────────────────────────────────
const BACK_TO_ANALYSIS = () => E(() => { switchPanel('analysis', document.querySelectorAll('.outer-tab')[0]); document.querySelector('.tab[data-tab="results"]').click(); });
const SETUP_DEFAULTS = { 'p-ctrl': 'B12-O12', 'p-skip': '8', 'p-hook': '10', 'p-r2': '0.8', 'p-sd': '25', 'p-top': '100', 'p-bot-val': '0', 'p-hill-val': '1', 'p-min-bot-val': '0', 'p-zero-pct': '' };
const runWith = set => E(async ({ set, defs }) => {
  for (const [k, v] of Object.entries(defs)) { const el = document.getElementById(k); if (el) el.value = v; }
  for (const id of ['p-row-norm', 'p-skip-norm', 'p-fix-bot', 'p-fix-hill']) { const el = document.getElementById(id); if (el) el.checked = false; }
  for (const [k, v] of Object.entries(set)) { const el = document.getElementById(k); if (!el) continue; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
  _lastResultsData = null; document.getElementById('log-panel').innerHTML = '';
  await runPipeline();
  const d = _lastResultsData || [], p = window._lastAnalysisParams || {};
  const panel = (document.getElementById('results-panel')?.innerText || '') + '\n' + (document.getElementById('tab-protocol')?.innerText || '');
  return { n: d.length, flagged: d.filter(r => r.Flag === 'Yes').length, nan: /\bNaN\b|undefined/.test(panel), stopped: /analysis stopped/i.test(document.getElementById('results-panel')?.innerText || ''),
    msg: (document.getElementById('results-panel')?.innerText || '').replace(/\s+/g, ' ').slice(0, 220), params: { hookThr: p.hookThr, minR2: p.minR2, maxSd: p.maxSd, minBotVal: p.minBotVal, skipRows: p.skipRows, topConstrain: p.topConstrain } };
}, { set, defs: SETUP_DEFAULTS });

if (run('E24')) await guard('E24', async () => {
  const base = await runWith({});
  const empty = await runWith({ 'p-skip': '', 'p-hook': '', 'p-r2': '', 'p-sd': '', 'p-top': '', 'p-min-bot-val': '' });
  check('E24', 'emptied numbers use their defaults: the same results as the defaults, finite parameters, no NaN on screen',
    empty.n === base.n && empty.flagged === base.flagged && !empty.nan && Object.values(empty.params).every(Number.isFinite), { base: base.n + '/' + base.flagged, empty });
  for (const [name, set, re] of [['top 0', { 'p-top': '0' }, /Top constraint/], ['negative top', { 'p-top': '-5' }, /Top constraint/], ['fixed Hill −2', { 'p-fix-hill': true, 'p-hill-val': '-2' }, /Hill/], ['fixed bottom above the top', { 'p-fix-bot': true, 'p-bot-val': '150' }, /bottom/i]]) {
    const r = await runWith(set);
    check('E24', name + ' stops the run and names the setting (not 63 flagged curves)', r.n === 0 && r.stopped && re.test(r.msg), r);
  }
  const noCtrl = await runWith({ 'p-ctrl': '' });
  check('E24', 'no control wells stops the run and says what to do', noCtrl.n === 0 && noCtrl.stopped && /No control wells/.test(noCtrl.msg) && /No normalisation/.test(noCtrl.msg), noCtrl);
  const rawOk = await runWith({ 'p-ctrl': '', 'p-skip-norm': true });
  check('E24', 'ticking No normalisation still allows an empty control range', rawOk.n > 0, rawOk);
  const garbage = await runWith({ 'p-ctrl': 'hello' });
  check('E24', 'control wells that are not wells stop the run', garbage.n === 0 && garbage.stopped, garbage);
  const pr = await E(() => ({ rect: _parseCtrlRange('B1-O2').length, two: _parseCtrlRange('B12:O12, B1:O1').length, sp: _parseCtrlRange('B12 - O12').length, one: _parseCtrlRange('b3').join(), bad: _parseCtrlRange('B12, zz, 7').slice().join() + '|' + _parseCtrlRange('B12, zz, 7')._bad.join(), col: _parseCtrlRange('B12-O12').length, pad: _parseCtrlRange('B012:C012').join() }));
  check('E24', '"B1-O2" is the 28 wells of a rectangle, not the first column', pr.rect === 28, pr);
  check('E24', '"B12:O12, B1:O1" is both ranges (28 wells), "B12 - O12" tolerates spaces', pr.two === 28 && pr.sp === 14 && pr.col === 14, pr);
  check('E24', 'single wells are padded, padded input is read, and the tokens that are not wells are reported', pr.one === 'B03' && pr.pad === 'B12,C12' && pr.bad === 'B12|zz,7', pr);
  await runWith({});
});

if (run('E25')) await guard('E25', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(() => {
    const doses = Array.from({ length: 12 }, (_, i) => -10 + i * 0.45), f = x => 5 + 95 / (1 + Math.pow(10, 1.1 * (x - (-7.6))));
    const rows = [], mk = (x, m) => ({ sampleId: 'SYN', protein: 'PX', barcode: 'PX-01', barcodeKey: 'px-01', well: 'C03', conc: Math.pow(10, x), log10Conc: x, measurement: m });
    doses.forEach(x => { rows.push(mk(x, f(x) + 1.5)); rows.push(mk(x, f(x) - 1.5)); });
    const full = _echoFitOne('PX', 'SYN', rows);
    const gone = rows.filter(r => r.log10Conc < -6.3);
    const withNulls = rows.map(r => r.log10Conc >= -6.3 ? Object.assign({}, r, { measurement: null }) : r);
    const holes = _echoFitOne('PX', 'SYN', withNulls), clean = _echoFitOne('PX', 'SYN', gone);
    const nan = _echoFitOne('PX', 'SYN', rows.map((r, i) => i % 7 === 0 ? Object.assign({}, r, { measurement: NaN }) : r));
    return { full: full && [full.DC50_nM, full.Dmax_pct], holes: holes && [holes.DC50_nM, holes.Dmax_pct, holes.Flag_Reason, holes._reps.length], clean: clean && [clean.DC50_nM, clean.Dmax_pct, clean._reps.length], nan: nan && [nan.DC50_nM, nan.R2] };
  });
  check('E25', 'a fit with unread wells is exactly the fit of the wells that were read', r.holes && r.clean && r.holes[0] === r.clean[0] && r.holes[1] === r.clean[1] && r.holes[3] === r.clean[2], r);
  check('E25', 'unread wells are not a point at 0 % (Dmax stays what the read points say)', r.holes && r.full && Math.abs(r.holes[1] - r.full[1]) < 25 && !/Bottom at bound/.test(r.holes[2] || ''), r);
  check('E25', 'a NaN reading is left out too, and the fit stays finite', r.nan && Number.isFinite(r.nan[0]) && Number.isFinite(r.nan[1]), r);
});

if (run('E26')) await guard('E26', async () => {
  const r = await E(() => {
    const txt = new TextDecoder().decode(Uint8Array.from(atob(_TEST_ECHO_B64), c => c.charCodeAt(0)));
    const lines = txt.split(/\r?\n/), hi = lines.findIndex(l => /destination.*well/i.test(l)), hd = lines[hi].split(',');
    const si = hd.findIndex(h => /sample.?id/i.test(h)), ci = hd.findIndex(h => /^destination concentration$/i.test(h)), ui = hd.findIndex(h => /destination concentration units/i.test(h));
    const parse = (t, skip = 8) => { try { const d = _parseEchoCSV(t, skip); return { n: d.length, c0: d[0] && d[0].conc, ids: new Set(d.map(x => x.sampleId)).size, plates: new Set(d.map(x => x.barcode)).size }; } catch (e) { return { err: e.message.slice(0, 120) }; } };
    const mod = fn => lines.map((l, i) => { if (i <= hi || !l.trim()) return l; const c = l.split(','); if (c.length <= Math.max(si, ci, ui)) return l; fn(c); return c.join(','); }).join('\n');
    const out = { base: parse(txt) };
    out.semicolon = parse(lines.map((l, i) => i >= hi ? l.replace(/,/g, ';') : l).join('\n'));
    out.tab = parse(lines.map((l, i) => i >= hi ? l.replace(/,/g, '\t') : l).join('\n'));
    out.cr = parse(txt.replace(/\n/g, '\r'));
    out.bom = parse('﻿' + txt);
    out.uM = parse(mod(c => { c[ci] = String(+c[ci] * 1e6); c[ui] = 'uM'; }));
    out.nM = parse(mod(c => { c[ci] = String(+c[ci] * 1e9); c[ui] = 'nM'; }));
    out.euro = parse(mod(c => { c[ci] = '"' + String(c[ci]).replace('.', ',') + '"'; }));
    out.cases = parse(mod(c => { if (Math.random() < 0.5) c[si] = c[si].toLowerCase(); }));
    const num = ['1000,5', '1 000,5', '1.234,5', '1,234.5', '1234', 1234.5, 'OVRFLW', '', '----', '3.5e4', '-12,5'].map(v => _readerNum(v));
    // the pipeline's own message for two files whose columns differ
    return Promise.all([
      mergeEchoCsvs([new File([lines.slice(hi).join('\n')], 'a.csv'), new File([lines.slice(hi).join('\n')], 'b.csv')]).then(b => b.text()).then(t => t.split('\n').length, e => 'ERR ' + e.message),
      mergeEchoCsvs([new File([lines.slice(hi).join('\n')], 'a.csv'), new File([[...hd].reverse().join(',') + '\n' + lines[hi + 1]], 'b.csv')]).then(() => 'merged', e => e.message.slice(0, 90))
    ]).then(([okMerge, badMerge]) => Object.assign(out, { num, okMerge, badMerge }));
  });
  const same = k => r[k] && !r[k].err && r[k].n === r.base.n && Math.abs(r[k].c0 - r.base.c0) / r.base.c0 < 1e-9 && r[k].plates === r.base.plates;
  check('E26', 'semicolon-, tab- and CR-separated transfer files read exactly like the comma one', same('semicolon') && same('tab') && same('cr'), { s: r.semicolon, t: r.tab, c: r.cr });
  check('E26', 'a byte-order mark does not matter', same('bom'), r.bom);
  check('E26', 'concentrations given in µM or nM are converted to molar', same('uM') && same('nM'), { uM: r.uM, nM: r.nM, base: r.base });
  check('E26', 'a decimal comma in scientific notation ("2,001E-05") is read as 2.001E-05', same('euro'), { euro: r.euro, base: r.base });
  check('E26', 'one compound typed in two letter cases is one compound', r.cases && r.cases.ids === r.base.ids, { cases: r.cases, base: r.base });
  check('E26', 'reader cells: "1000,5" "1 000,5" "1.234,5" "1,234.5" "3.5e4" "-12,5" are numbers; OVRFLW, ---- and blank are not',
    JSON.stringify(r.num) === JSON.stringify([1000.5, 1000.5, 1234.5, 1234.5, 1234, 1234.5, null, null, null, 35000, -12.5].map(v => v === null ? null : v)) || (r.num.slice(0, 6).every((v, i) => v === [1000.5, 1000.5, 1234.5, 1234.5, 1234, 1234.5][i]) && r.num.slice(6, 9).every(Number.isNaN) && r.num[9] === 35000 && r.num[10] === -12.5), r.num);
  check('E26', 'two transfer files with the same columns merge; with different columns they are refused with both names', typeof r.okMerge === 'number' && /a\.csv|b\.csv/.test(r.badMerge) && /different columns/.test(r.badMerge), { ok: r.okMerge, bad: r.badMerge });
});

if (run('E27')) await guard('E27', async () => {
  await BACK_TO_ANALYSIS();
  await E(() => { localStorage.removeItem(HIST_KEY); });
  await runWith({});
  const r = await E(() => {
    const count = () => (JSON.parse(localStorage.getItem(HIST_KEY) || '[]')).length;
    const n0 = count();
    for (const col of ['DC50_nM', 'Dmax_pct', 'R2']) sortResultsBy(col);
    window._resultsShowAll = true; renderResults(_lastResultsData); renderResults(_lastResultsData);
    const h = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    return { n0, n1: count(), ids: new Set(h.map(x => x.id)).size, hasParams: !!(h[0] && h[0].params && Number.isFinite(h[0].params.minR2)), assay: h[0] && h[0].assayId, ts: h[0] && h[0].ts };
  });
  check('E27', 'sorting and redrawing the table leaves one History entry for the analysis', r.n0 === 1 && r.n1 === 1 && r.ids === 1, r);
  check('E27', 'the entry carries the run\'s own settings', r.hasParams, r);
  const q = await E(() => {
    const real = Storage.prototype.setItem; let calls = 0;
    // a store with room for the new analysis and ONE of the old ones: the newest must survive, the oldest go
    localStorage.removeItem(HIST_KEY); window._analysisId = 5555; saveToHistory([{ Protein: 'G', Sample_ID: 'new', Flag: 'No' }]);
    const L = localStorage.getItem(HIST_KEY).length; localStorage.removeItem(HIST_KEY);
    Storage.prototype.setItem = function (k, v) { if (k === HIST_KEY && v.length > L + 60000) { calls++; throw new DOMException('full', 'QuotaExceededError'); } return real.call(this, k, v); };
    try {
      const mk = i => ({ id: 1000 + i, ts: 'old' + i, assayId: 'old' + i, groups: 'G', n: 1, nFlag: 0, data: [{ Protein: 'G', Sample_ID: 'x', Flag: 'No', pad: 'x'.repeat(40000) }] });
      real.call(localStorage, HIST_KEY, JSON.stringify([mk(1), mk(2), mk(3)]));
      window._analysisId = 5555; saveToHistory([{ Protein: 'G', Sample_ID: 'new', Flag: 'No' }]);
      const h = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      return { ids: h.map(x => x.id), calls };
    } finally { Storage.prototype.setItem = real; }
  });
  check('E27', 'a full browser store drops the oldest analyses, keeps the new one', q.ids[0] === 5555 && q.ids.length < 4 && q.ids.length >= 1, q);
  await E(() => { localStorage.removeItem(HIST_KEY); });
});

if (run('E28')) await guard('E28', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(() => {
    const d = _lastResultsData.find(x => x.Sample_ID === 'EDA-013'), others = _lastResultsData.filter(x => x.Sample_ID === 'EDA-013');
    const cd = { 'EDA-013': { smiles: 'CCO', MW: 46, logP: -0.3, HBA: 1, HBD: 1, TPSA: 20, RotBonds: 0, ArRings: 0, svg: '' } };
    const host = document.getElementById('props-panel'); renderProperties(_lastResultsData, cd);
    const cell = host.querySelector('td.pp-aff');
    return { groups: others.map(x => x.Protein + ':' + x.DC50_nM), rows: cell ? [...cell.querySelectorAll('.pp-aff-r')].map(e => e.textContent.replace(/\s+/g, ' ').trim()) : null };
  });
  check('E28', 'the Properties tab lists the potency for every group a compound was fitted in', r.rows && r.rows.length === r.groups.length && r.groups.every(g => r.rows.some(t => t.replace(' ', ':') === g || t.includes(g.split(':')[1]) && t.includes(g.split(':')[0]))), r);
});

if (run('E29')) await guard('E29', async () => {
  const r = await E(() => {
    const survey = ['[DETAILS]', 'Source Plate Barcode,Source Plate Type,Source Well,Survey Fluid Volume,Survey Status', 'RP-001,384PP_DMSO2,A1,40.0,OK', 'RP-001,384PP_DMSO2,A2,40.0,OK', 'RP-001,384PP_DMSO2,A3,10.0,OK', 'RP-001,384PP_DMSO2,A4,40.0,OK'].join('\n');
    const pick = ['[DETAILS]', 'Source Plate Barcode,Source Well,Transfer Volume,Transfer Status,Destination Well,Destination Plate Barcode,Sample ID,Destination Concentration',
      'RP-001,A1,5000,OK,B2,P1,a,1e-6', 'RP-001,A1,5000,FAILED,B3,P1,a,1e-6', 'RP-002,A1,9000,OK,B4,P1,b,1e-6', 'RP-001,A2,60000,OK,B5,P1,c,1e-6', 'RP-001,A4,0,OK,B6,P1,d,1e-6'].join('\n');
    const sv = parseSurveyCSV(survey); window._lastEchoText = pick;
    const m = _buildTransferMap(sv.plateName);
    const tab = document.querySelector('.tab[data-tab="survey"]'); tab && tab.click();
    renderSurveyPlate(sv);
    const canvas = document.querySelector('#survey-plate-container canvas'), w = canvas && canvas._surveyWells;
    return { plate: sv.plateName, a1: m.A01, a2: m.A02, filtered: m._filtered, a1after: w && w.A01 && w.A01.afterUL, a2: w && w.A02 && { after: w.A02.afterUL, short: w.A02.shortUL }, a3: w && w.A03 && w.A03.afterUL };
  });
  check('E29', 'only the survey plate\'s own, successful transfers are subtracted (A1: 5 µL of 40 → 35 left, not 49)', r.filtered && Math.abs(r.a1after - 35) < 1e-6, r);
  check('E29', 'a well asked for more than it holds is a shortfall, not an empty well', r.a2 && r.a2.after === 0 && Math.abs(r.a2.short - 20) < 1e-6, r);
  check('E29', 'a well nothing was drawn from keeps its volume', Math.abs(r.a3 - 10) < 1e-6, r);
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
