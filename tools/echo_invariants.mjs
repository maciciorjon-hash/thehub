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
//   E30 every curve says       With Smart DMSO control on, each curve carries the method of its plates, its reference vs the plain mean and a
//       how it was normalised   second fit with the plain mean; the Raw CSV carries Raw_Signal and Reference_Signal so Measurement can be recomputed;
//                             the table, summary CSV, XLSX audit sheet and the Labbook payload all carry it; off, nothing is invented. Fix Y starts at −15 / 120.
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
//   E27 History keeps       One record per DATASET (a hash of the input files), one VERSION per different analysis of it: the same files
//       datasets, not copies analysed the same way add nothing, another setting is v2 and says what changed, a redraw or a curve edit
//                           updates in place, Load restores the version's own settings, a full store drops stored files first, the old
//                           browser-store list migrates once with its copies collapsed, and a cloud merge never resurrects a deletion.
//   E38 export each curve   Curves compared on one chart can each be exported alone (PNG, PDF, one PDF with a page per curve, or all as files),
//                           and every figure — overlay or single — carries the chart's axes, a fixed Y included.
//   E39 right-click in      Compare: right-click excludes / re-includes one replicate (or a whole concentration) of the curve it belongs to;
//       Compare             several points under the pointer open a list — which point of which compound — first.
//   E40 history in the cloud Every analysis is written to the cloud store under its name (row, results, whole), versions of one name are one
//                           analysis there, an empty browser gets it all back (results on demand), deletes travel, no name = no run.
//   E52 History repairs itself   A database called echo_history with no (or only some) of Echo's stores — what anything that opened it first leaves behind — is repaired in place, keeps what it holds, and an analysis survives a reload (before: "object stores was not found" on every save).
//   E53 the Results bar is      Compare · Copy TSV · Export ▾ · Send to ▾ — on a single-assay and a multi-assay run alike; every menu item
//       three groups            calls a function that exists; standalone there is no Send menu; and the raw per-well table (no longer a button)
//                               is the workbook's "Raw data" sheet, row for row and cell for cell the old CSV.
//   E37 history by name    A History entry is its NAME: runs with one name are versions of one entry (any spelling, any input files), old copies merge, unnamed runs stay by dataset, rename/merge, and every way to compare is findable.
//   E32 compare             Two analyses matched by group and compound: fold change, unmatched counted, self-compare is 1, biggest change first.
//   E28 Properties names    The Properties tab lists a compound's potency for every group it was fitted in, not the last one.
//       every group
//   E29 the source plate    Remaining volume ignores transfers that failed and transfers from other source plates, and a well asked for
//       tells the truth     more than it holds is a shortfall, not "empty".
//   E31 Properties sorts   A column header sorts the Properties table (ascending, descending, reset), a missing value is last either
//                          way, and a multi-assay run with two panels on the same files is refused instead of doubled.
//   E33 review and groups  The Review reads the files with the settings as they stand and says what will happen: curves, groups, plates
//                          without a reader file, controls that land on compound wells, curves with too few readings; the group of a
//                          plate follows the chosen rule (first dash, last dash, whole barcode, own table) in the run, the Review and
//                          the Protocol, and editing it in the Review writes the table.
//   E34 n.d.               A curve flagged "No effect" has no midpoint: with the switch on (Setup › Output) its potency, logs, Hill and
//                          confidence limits read n.d. in the table, the Curves stats, the summary CSV, Copy TSV, the workbook, Properties
//                          and the rows sent to Labbook (nd:true, no potency); it is left off potency axes and says how many; Dmax and R²
//                          stay numbers; with the switch off every number is printed as before; the data rows keep the fitted values.
//   E35 keyboard and        Tabs are a tablist (one selected, arrows / Home / End move and select), sortable headers are reachable and sort
//       screen reader       on Enter, every visible control on every view has an accessible name, the Setup dialog traps Tab, closes on
//                           Esc and gives focus back, progress is a progressbar, charts describe themselves, [ ] and / work.
//   E36 motion and focus   Nothing animates at rest; one underline travels to the picked tab (and sits under it); coming back from the Gradient
//                          Planner does not put Setup over the results; an edit made in Curves flashes its row in Results; with reduced
//                          motion the transitions are clamped.
//   E41 chemistry is honest  Structures come from a PINNED RDKit (every '@rdkit/rdkit' URL in Echo and Dora carries a version), and a
//                            descriptor RDKit did not return is MISSING (null) — never 0, which passed every property filter downstream.
//   E42 Ro5 is strict        Lipinski's limits are > 500, > 5, > 10, > 5: a compound exactly AT a limit passes, one hair over it fails.
//   E43 raw is not a mean    A run that did not normalise (No normalisation) says "None (raw signal)" in every row's Norm_Method; a normalised run
//                            still says "Plate mean" / "Smart · …". It used to call raw signal a plate mean.
//   E44 a multi-assay pivot  One result per (assay, group): a compound fitted against two groups of one assay shows BOTH, in the table and in the
//       overwrites nothing   XLSX, under headers that name the group; two results for one compound in one block open another block.
//   E45 Copy TSV says which  A multi-assay Copy TSV names the assay of every row and calls the potency column a potency; a single-assay one is unchanged.
//   E46 the screen export    Screen CSV and the workbook's last sheet are the same table (header = SCR_COLS, Schema echo-screen/1), one row per fitted
//       is the results        curve plus one per compound that could not be fitted; a midpoint past the doses is a qualifier (>, <, n.d.) with the tested
//                             range beside it — also with the n.d. display switch off; the button is on both result views; existing sheets keep their place.
//   E47 hook and coverage     The engine's hook rule is Echo's own (same concentrations on real fits); onset, last productive concentration, depth,
//       are derived           recovery and the observed Dmax are the arithmetic of the replicate means; a re-included hook is still a hook; no hook is
//                             'none' only when the test ran; a half curve is not 'complete'.
//   E48 a screen says what    Role / target / cell line / time point reach the run, every Screen row and the History run; a corrected target name is
//       it is                 not a new version; opening the run from History brings them back; the role defaults from the assay type.
//   E49 not fitted is a       A compound left with fewer than four readings is listed (few-points), exported as a row of its own, kept in History and
//       fact, not a gap       restored from it; a clean run lists none.
//   E50 right-click does    Leaving out one replicate leaves out one (replicates that read alike are two points — it used to take both), the menu is ONE
//       what it says          menu per concentration listing each replicate by its reading and the whole concentration with its count (from a replicate and
//                             from the mean dot), pointing at a row rings its points, a hook ✕ is reachable, a click off a point says so, the click says
//                             what it did to the potency, and the Plate tab matches wells to replicates the same way.
//   E51 a plate is found by   A reader file is paired with its destination plate by the barcode being IN the file name (exact · same words ·
//       its barcode in the    inside the file name · file name inside the barcode · written inside the sheet), a pairing two candidates want
//       file's name           equally is not made, an intermediate plate is never guessed, a choice made by hand wins, the plate keeps the
//                             Echo barcode as its name (the file only identifies it), six renamed bundled files give exactly the curves and
//                             groups of the exact names, and a picklist with no barcode is read by its Destination Plate Name.
//
//   E54 a plot's picture is   The Plots export is drawn by the same builder as the screen: with colour-by, size-by, a hit filter, a search and a
//       the plot on screen    zoom set, every point's colour, size and presence, the axes' ranges and the shape match the live chart, and the
//                             pixel under each point in the PNG is that point's colour (it used to rebuild its own chart and drop all five).
//
//   E55 selectivity, redrawn One painter for the screen and the PNG (the PNG has every point the screen has, on white); the plot is a square;
//                             potency is read on a log axis in nM; names never sit on each other, on a point or outside the plot, and the
//                             "hidden" note is outside the plot; the ranked lists hold exactly the compounds beyond the threshold, most
//                             selective first; a multi-assay run offers each assay's protein separately instead of overwriting one with the other.
//
//   E56 the plate's colours     Raw luminescence is not a colouring of its own (a saved choice of it opens the plate effect); "distance from the
//       say something, and      fit" is signal − the compound's fitted curve at that dose, to the digit; "plate effect" finds a column planted
//       names fit their block   15 points low; a dose series run down a column is named turned 90°, every name inside its own block.
//
//   E57 Setup lines up         Every Setup tab, with one assay and with three assay panels, at 1440 and 390 px: the alignment audit (one control
//                             height a row, centres on one line, a checkbox on its label's first line) and the escape audit find nothing.
//
//   E58 a multi-assay run      Two panels (HiBiT on one prefix, CTG on another): a fit setting typed on one panel survives another being added
//       keeps its names         and removed; every column block names its assay AND its group; the normalisation banners name the assay type,
//                               not "<id>_hibit"; Labbook gets one result set per assay, each with its own potency name and its own id;
//                               the Raw data sheet says which assay each row is; no tab prints NaN or undefined.
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

if (run('E38') && hasPdf) await guard('E38', async () => {
  await E(() => { document.querySelector('[data-tab="curves"]').click(); });
  await pg.waitForTimeout(400);
  await E(() => { window._cvSelected && window._cvSelected.clear && window._cvSelected.clear(); window._cvColorIdx && window._cvColorIdx.clear && window._cvColorIdx.clear(); setCvMode('compare'); });
  await pg.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { await pg.locator('#cv-compare-list label').nth(i).click(); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(500);
  const range = L => [L.xlo, L.xhi, L.ylo, L.yhi].map(v => +v.toFixed(6)).join();
  const r = await E(() => {
    const cv = document.getElementById('cv-canvas'), on = cv._cvLay, specs = [0, 1, 2].map(i => _cvFigureSpec(i)), c = document.createElement('canvas').getContext('2d');
    const lay = sp => _cvLayout(c, sp.W, null, sp.comps, Object.assign({}, sp.cfg));
    window._cvExpSameAxes = false; const free = [0, 1, 2].map(i => _cvLayout(c, 520, null, _cvFigureSpec(i).comps, _cvFigureSpec(i).cfg)); window._cvExpSameAxes = true;
    const o = _cvFigureSpec();
    return { n: (cv._cvCompounds || []).length, screen: [on.xlo, on.xhi, on.ylo, on.yhi], each: specs.map(sp => { const L = lay(sp); return [L.xlo, L.xhi, L.ylo, L.yhi]; }), overlay: (() => { const L = lay(o); return [L.xlo, L.xhi, L.ylo, L.yhi]; })(),
      free: free.map(L => [L.ylo, L.yhi]), names: specs.map(sp => sp.name), one: specs.every(sp => sp.comps.length === 1) };
  });
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
  check('E38', 'three curves compared, each can be exported on its own (one compound per file, distinct names)', r.n === 3 && r.one && new Set(r.names).size === 3, r);
  check('E38', 'every individual figure uses the chart\'s axes, X and Y', r.each.every(a => same(a, r.screen)) && same(r.overlay, r.screen), r);
  check('E38', 'without "same axes" a curve is scaled to itself (the option does something)', r.free.some(f => Math.abs(f[0] - r.screen[2]) > 1e-6 || Math.abs(f[1] - r.screen[3]) > 1e-6), r);
  await E(() => { const cb = document.getElementById('cv-fix-y'); cb.checked = true; _onCvFixYChange(cb); document.getElementById('cv-ymin-fixed').value = -30; document.getElementById('cv-ymax-fixed').value = 140; renderCvCurve(); });
  await pg.waitForTimeout(400);
  const f = await E(() => { const c = document.createElement('canvas').getContext('2d'); return [0, 1, 2].map(i => { const sp = _cvFigureSpec(i), L = _cvLayout(c, sp.W, null, sp.comps, sp.cfg); return [L.ylo, L.yhi]; }).concat([(() => { const sp = _cvFigureSpec(), L = _cvLayout(c, sp.W, null, sp.comps, sp.cfg); return [L.ylo, L.yhi]; })()]); });
  check('E38', 'a fixed Y (−30 to 140) is the Y of every exported figure, the overlay and each curve alone', f.every(a => a[0] === -30 && a[1] === 140), f);
  const pdf = await download(() => cvDownloadEach('pdf'));
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
  check('E38', 'one PDF with a page per curve', pages === 3, pages);
  const names = []; const on = d => names.push(d.suggestedFilename()); pg.on('download', on);
  await E(() => { cvDownloadEach('png'); }); await pg.waitForTimeout(2500); pg.off('download', on);
  check('E38', 'one PNG per curve, each its own file', names.length === 3 && new Set(names).size === 3 && names.every(n => /^curve_.*\.png$/.test(n)), names);
  await E(() => cvShowDownloadPicker()); if (args.shot) await pg.screenshot({ path: String(args.shot) }); await E(() => document.getElementById('cv-dl-picker')?.remove());
  const pk = await E(() => { cvShowDownloadPicker(); const p = document.getElementById('cv-dl-picker'), t = p.innerText; const rows = p.querySelectorAll('.cv-dl-row').length; p.remove(); return { t: t.replace(/\s+/g, ' '), rows }; });
  check('E38', 'the Download menu offers each curve on its own, all of them at once, and the axes option', pk.rows === 3 && /Each curve on its own/.test(pk.t) && /one page per curve/.test(pk.t) && /Same axes/.test(pk.t), pk);
  await E(() => { const cb = document.getElementById('cv-fix-y'); cb.checked = false; _onCvFixYChange(cb); setCvMode('single'); });
});

if (run('E39')) await guard('E39', async () => {
  await E(() => { document.querySelector('[data-tab="curves"]').click(); });
  await pg.waitForTimeout(400);
  await E(() => { window._cvSelected && window._cvSelected.clear && window._cvSelected.clear(); window._cvColorIdx && window._cvColorIdx.clear && window._cvColorIdx.clear(); setCvMode('compare'); });
  await pg.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { await pg.locator('#cv-compare-list label').nth(i).click(); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(600);
  // where the replicate of curve 2 is drawn, in page coordinates
  const at = (ci, kind) => E(({ ci, kind }) => {
    const cv = document.getElementById('cv-canvas'), rc = cv.getBoundingClientRect(), r = cv._cvCompounds[ci];
    const p = window._cvPtMap.find(q => q.r === r && (kind === 'rep' ? q.isRep && !q.isExcluded && !q.isHook : kind === 'x' ? q.isExcluded : q.isDeletedConc));
    return p ? { x: rc.left + p.px, y: rc.top + p.py, rx: p.x, ry: p.y } : null;
  }, { ci, kind });
  const menuText = () => E(() => { const m = [...document.querySelectorAll('div[role="menu"]')].pop(); return m ? m.innerText.replace(/\s+/g, ' ') : null; });
  const state = () => E(() => (document.getElementById('cv-canvas')._cvCompounds).map(r => ({ ex: (r._excludedRepXYs || []).length, del: (r._deletedPts || []).length, dc: r.DC50_nM })));
  // The row of the menu that is about a compound: a section opens with its compound's name, its rows follow.
  const rowIn = (name, re) => E(({ name, src }) => {
    const m = [...document.querySelectorAll('div[role="menu"]')].pop(); if (!m) return -1;
    let cur = '', idx = -1, k = 0;
    [...m.children].forEach(c => { if (c.getAttribute('role') === 'presentation') cur = c.innerText; else if (c.getAttribute('role') === 'separator') cur = cur; else if (c.getAttribute('role') === 'menuitem') { if (idx < 0 && cur.includes(name) && new RegExp(src).test(c.innerText)) idx = k; k++; } });
    return idx;
  }, { name, src: re.source });
  const pick = async idx => { await pg.locator('div[role="menu"] [role="menuitem"]').nth(idx).click(); await pg.waitForTimeout(500); };
  const before = await state();
  const p = await at(1, 'rep');
  check('E39', 'in Compare every drawn point is in the hit map, tagged with its compound', !!p, p);
  await pg.mouse.click(p.x, p.y, { button: 'right' }); await pg.waitForTimeout(200);
  const t1 = await menuText();
  check('E39', 'right-click on a point in Compare opens one menu, naming the compound, offering the replicate and the whole concentration', /EDA-014/.test(t1 || '') && /Exclude the (upper|lower) replicate|Exclude replicate/.test(t1 || '') && /Exclude all \d+ replicates/.test(t1 || '') && !/Which point/.test(t1 || ''), t1);
  const i1 = await rowIn('EDA-014', /Exclude (the|replicate)/);
  await pick(i1);
  const after = await state();
  check('E39', 'only that curve loses the replicate (its fit is redone); the others are untouched', after[1].ex === 1 && after[0].ex === 0 && after[2].ex === 0 && after[0].dc === before[0].dc && after[2].dc === before[2].dc, { before, after });
  check('E39', 'the stats table still lists all three curves after the edit', await E(() => /EDA-013/.test(document.getElementById('cv-stats').innerText) && /EDA-015/.test(document.getElementById('cv-stats').innerText)));
  const x = await at(1, 'x');
  await pg.mouse.click(x.x, x.y, { button: 'right' }); await pg.waitForTimeout(200);
  const t1b = await menuText();
  check('E39', 'right-click on the excluded ✕ offers to put it back', /Put back the replicate left out/.test(t1b || ''), t1b);
  await pick(await rowIn('EDA-014', /Put back the replicate/));
  const back = await state();
  check('E39', 'putting it back restores the curve to the digit', back[1].ex === 0 && back[1].dc === before[1].dc, { before: before[1], back: back[1] });
  // two curves with a point in the same place: ONE menu, a section for each compound
  await E(() => { const cv = document.getElementById('cv-canvas'), c = cv._cvCompounds; window.__e39 = [[c[2], _cvSnapRow(c[2])], [_cvTwin(c[2]), _cvSnapRow(_cvTwin(c[2]))]]; c[2]._reps = JSON.parse(JSON.stringify(c[0]._reps)); c[2]._pts = JSON.parse(JSON.stringify(c[0]._pts)); delete c[2]._repsOrig; renderCvCurve(); });
  await pg.waitForTimeout(500);
  const q = await at(0, 'rep');
  await pg.mouse.click(q.x, q.y, { button: 'right' }); await pg.waitForTimeout(200);
  const t2 = await menuText();
  check('E39', 'with several curves under the pointer one menu has a section for each compound', /EDA-013/.test(t2 || '') && /EDA-015/.test(t2 || '') && !/Which point/.test(t2 || ''), t2);
  check('E39', 'there is one menu, not a menu that opens another', await E(() => document.querySelectorAll('div[role="menu"]').length === 1));
  await pick(await rowIn('EDA-015', /Exclude (the|replicate)/));
  const fin = await state();
  check('E39', 'the chosen compound — not the one on top — lost the replicate', fin[2].ex === 1 && fin[0].ex === 0, fin);
  // leave the data as it was: the test bent one curve to sit under another
  await E(() => { window.__e39.forEach(([o, snap]) => _cvRestoreRow(o, snap)); _CV_UNDO.length = 0; _CV_REDO.length = 0; setCvMode('single'); renderCvCurve(); });
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
    const offered = await E(() => [...document.querySelectorAll('div[role="menuitem"]')].some(d => /Put back (all \d+ replicates|the point)/.test(d.textContent)));
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
    document.getElementById('sel-metric').value = 'potency'; document.getElementById('sel-show-flagged').checked = true;
    buildSelectivityChart();
    const thr = document.getElementById('sel-band-thr'); thr.add(new Option('2×', '2')); thr.value = '2';
    buildSelectivityChart();
    const pts = selChart ? selChart.data.datasets[0].data : [];
    // lower log DC50 = more potent: y − x > log 2 means X is ≥2× more potent → 'x'
    return pts.filter(p => Math.abs(p.y - p.x) > Math.log10(2) + 1e-4).map(p => ({ l: p.label, want: p.y - p.x > 0 ? 'x' : 'y', got: p.dir }));
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
  await E(() => { window._plateUI = { mode: 'signal', scale: 'assay', labels: false, clip: false, q: '' }; window._plateFit = true; document.querySelector('[data-tab="plate"]').click(); });
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
  check('E12', 'the signal map has a scale in the legend', /of control/.test(r.legend) && /\d+%/.test(r.legend), r.legend);
  check('E12', 'tooltip carries the raw reading', /Raw luminescence[\s\S]*RLU/.test(r.tip) && /Compound/.test(r.tip) && /Concentration/.test(r.tip), r.tip);
  check('E12', 'plates fill their cards', r.cvW >= r.cardW * 0.9, { cvW: r.cvW, cardW: r.cardW });
  check('E12', 'a loose query finds exactly that compound, on every plate', r.find.n === r.find.expect && r.find.other === 0 && r.find.n > 0, r.find);
  check('E12', 'the result bar names it', r.find.shown !== 'none' && r.find.bar.includes(r.find.cpd), r.find);
  check('E12', 'EDA-013, eda13 and EDA 13 are one name', new Set(r.keys).size === 1, r.keys);
  check('E12', 'no match says so', /Nothing on any plate/.test(r.none), r.none);
  check('E12', 'colour mode and search survive a tab switch', r2.mode === 'compound' && r2.q.length > 0, r2);
  check('E12', 'compound legend carries the full name', r2.chip, r2);
  check('E12', '96-well plate is drawn as 96', r2.grid[0] === 8 && r2.grid[1] === 12 && r2.aspect < 0.75, r2);
  await E(() => { window._plateUI = { mode: 'signal', scale: 'assay', labels: false, clip: false, q: '' }; });
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
    keep[bc][id] = JSON.parse(saved); window._plateUI.view = 'maps'; window._plateUI.mode = 'signal'; renderPlateTab();
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
    // Echo Dose-Response writes the compound in Sample Name and leaves Sample ID empty (NK_NEK1_D2B, 2026-10-09).
    const hdn = hd.slice(); hdn.splice(si + 1, 0, 'Sample Name');
    out.byName = parse(lines.map((l, i) => { if (i < hi || !l.trim()) return l; const c = l.split(','); if (i === hi) return hdn.join(','); if (c.length <= si) return l; c.splice(si + 1, 0, c[si]); c[si] = ''; return c.join(','); }).join('\n'));
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
  check('E26', 'a file whose Sample ID is empty on every row reads its compounds from Sample Name', same('byName') && r.byName.ids === r.base.ids, { byName: r.byName, base: r.base });
  check('E26', 'one compound typed in two letter cases is one compound', r.cases && r.cases.ids === r.base.ids, { cases: r.cases, base: r.base });
  check('E26', 'reader cells: "1000,5" "1 000,5" "1.234,5" "1,234.5" "3.5e4" "-12,5" are numbers; OVRFLW, ---- and blank are not',
    JSON.stringify(r.num) === JSON.stringify([1000.5, 1000.5, 1234.5, 1234.5, 1234, 1234.5, null, null, null, 35000, -12.5].map(v => v === null ? null : v)) || (r.num.slice(0, 6).every((v, i) => v === [1000.5, 1000.5, 1234.5, 1234.5, 1234, 1234.5][i]) && r.num.slice(6, 9).every(Number.isNaN) && r.num[9] === 35000 && r.num[10] === -12.5), r.num);
  check('E26', 'two transfer files with the same columns merge; with different columns they are refused with both names', typeof r.okMerge === 'number' && /a\.csv|b\.csv/.test(r.badMerge) && /different columns/.test(r.badMerge), { ok: r.okMerge, bad: r.badMerge });
});

if (run('E27')) await guard('E27', async () => {
  await BACK_TO_ANALYSIS();
  const wipe = () => E(async () => { await _hxLoad(); await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true); try { localStorage.removeItem(HIST_KEY); } catch (e) {} });
  const settle = () => pg.waitForTimeout(1300);
  await wipe();
  await runWith({}); await settle();
  const a = await E(() => {
    for (const col of ['DC50_nM', 'Dmax_pct', 'R2']) sortResultsBy(col);
    window._resultsShowAll = true; renderResults(_lastResultsData); renderResults(_lastResultsData);
    return new Promise(r => setTimeout(() => r({ runs: Object.keys(_hx.runs).length, sets: Object.keys(_hx.sets).length, set: Object.values(_hx.sets)[0] && Object.values(_hx.sets)[0].id }), 900));
  });
  check('E27', 'one analysis → one dataset, one version; sorting and redrawing the table add nothing', a.runs === 1 && a.sets === 1, a);
  await runWith({}); await settle();
  const b = await E(() => ({ runs: Object.keys(_hx.runs).length, reruns: Object.values(_hx.runs)[0].reruns, sets: Object.keys(_hx.sets).length }));
  check('E27', 'the same files analysed the same way again adds no version (it is counted as a re-run)', b.runs === 1 && b.reruns === 1 && b.sets === 1, b);
  await runWith({ 'p-ctrl': 'B12:O12' }); await settle();
  const c = await E(() => ({ runs: Object.keys(_hx.runs).length }));
  check('E27', 'B12:O12 and B12-O12 are the same wells: no new version', c.runs === 1, c);
  await runWith({ 'p-r2': '0.9' }); await settle();
  const d = await E(() => { const rs = Object.values(_hx.runs).sort((x, y) => x.ver - y.ver); return { runs: rs.length, sets: Object.keys(_hx.sets).length, vers: rs.map(r => r.ver), diff: rs[1] && rs[1].paramsDiff.map(x => x.label + ':' + x.from + '>' + x.to), flags: rs.map(r => r.nFlag) }; });
  check('E27', 'the same files with another setting are version 2 of the same dataset, and say what changed', d.runs === 2 && d.sets === 1 && d.vers.join() === '1,2' && d.diff && d.diff.join() === 'Min R²:0.8>0.9', d);
  const e = await E(async () => {
    const run = Object.values(_hx.runs).sort((x, y) => y.ver - x.ver)[0];
    _lastResultsData[0].DC50_nM = 123.4; renderResults(_lastResultsData);
    await new Promise(r => setTimeout(r, 900));
    const after = _hx.runs[run.id];
    return { runs: Object.keys(_hx.runs).length, edited: after.edited, same: after.id === run.id };
  });
  check('E27', 'editing the loaded analysis updates that version in place and marks it edited', e.runs === 2 && e.edited && e.same, e);
  const f = await E(async () => {
    const v1 = Object.values(_hx.runs).sort((x, y) => x.ver - y.ver)[0];
    await loadHistoryEntry(v1.id); await new Promise(r => setTimeout(r, 600));
    return { id: window._analysisId === v1.id, r2: window._lastAnalysisParams && window._lastAnalysisParams.minR2, n: _lastResultsData.length, setKey: window._setKey === v1.fk };
  });
  check('E27', 'Load brings back version 1 with its own settings', f.id && f.r2 === 0.8 && f.n === 63 && f.setKey, f);
  const g = await E(() => { const s = Object.values(_hx.sets)[0]; return { files: s.filesStored, meta: (s.fileMeta || []).length }; });
  check('E27', 'the input files are kept once for the dataset', g.files === true && g.meta >= 8, g);
  const h = await E(async () => {
    const real = _hxPut; let n = 0, evicted = null; const set = Object.values(_hx.sets)[0];
    const r = await _hxPutRetry(async () => { if (n++ < 2) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return 'ok'; });
    return { r, n, filesStored: set.filesStored, dropped: set.filesDropped };
  });
  check('E27', 'a full store frees the input files of the oldest dataset first, keeps the results, and goes on', h.r === 'ok' && h.n === 3 && h.filesStored === false && h.dropped === true, h);
  const k = await E(async () => {
    await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true);
    const mk = (id, assay, flag) => ({ id, ts: new Date(id).toLocaleString(), assayId: assay, groups: 'G', n: 1, nFlag: 0, data: [{ Protein: 'G', Sample_ID: 'x', DC50_nM: flag, Flag: 'No' }], plateData: null });
    // five old entries: the same analysis three times (the old history made a copy per run), another assay, another outcome
    localStorage.setItem(HIST_KEY, JSON.stringify([mk(5000, 'A', 1), mk(4000, 'A', 1), mk(3000, 'A', 1), mk(2000, 'B', 1), mk(1000, 'A', 2)]));
    _hxLoadP = null; for (const k of Object.keys(_hx.runs)) delete _hx.runs[k]; for (const k of Object.keys(_hx.sets)) delete _hx.sets[k];
    await _hxLoad();
    return { runs: Object.keys(_hx.runs).length, sets: Object.keys(_hx.sets).length, left: localStorage.getItem(HIST_KEY) };
  });
  check('E27', 'the old browser-store history is migrated once: the same analysis saved three times becomes one version', k.runs === 3 && k.sets === 2 && k.left === null, k);
  const m = await E(async () => {
    await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true);
    const ent = (id, extra) => Object.assign({ id, ts: id, assayId: 'CLOUD', groups: 'G', n: 1, nFlag: 0, data: [{ Protein: 'G', Sample_ID: 'x', DC50_nM: id, Flag: 'No' }] }, extra || {});
    const a1 = await _hxIngest(ent(9001)), a2 = await _hxIngest(ent(9001)), a3 = await _hxIngest(ent(9002));
    await _hxDeleteRuns([9001], true);     // tombstoned on this device
    const back = await _hxIngest(ent(9001));
    return { first: a1, again: a2, second: a3, resurrected: back, left: Object.keys(_hx.runs).map(Number).sort() };
  });
  check('E27', 'merging from the cloud adds runs this device lacks, ignores duplicates, and does not resurrect what was deleted here', m.first === 9001 && m.again === null && m.second === 9002 && m.resurrected === null && m.left.join() === '9002', m);
  await wipe();
});

if (run('E37')) await guard('E37', async () => {
  await BACK_TO_ANALYSIS();
  const wipe = () => E(async () => { await _hxLoad(); await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true); });
  await wipe();
  // 1. a real run, named: the name is the identity, so another run under it is a version of the same entry
  await runWith({ 'p-assay': 'NAMETEST' }); await pg.waitForTimeout(1300);
  await runWith({ 'p-assay': 'NAMETEST', 'p-r2': '0.9' }); await pg.waitForTimeout(1300);
  const a = await E(() => ({ sets: Object.keys(_hx.sets), vers: Object.values(_hx.runs).map(r => r.ver).sort().join(), fk: Object.values(_hx.runs).every(r => !!r.fk) }));
  check('E37', 'two runs called the same are one History entry with two versions', a.sets.length === 1 && a.sets[0] === 'n:nametest' && a.vers === '1,2' && a.fk, a);
  const b = await E(async () => {
    // the same name typed another way, run on other input files (a different hash): still the same entry
    const run = Object.values(_hx.runs)[0], data = (await _hxGet('blobs', run.id)).data;
    const ent = (id, name, setId) => ({ id, ts: id, assayId: name, setId, groups: 'G', n: 1, nFlag: 0, data: [{ Protein: 'G', Sample_ID: 'x', DC50_nM: id, Flag: 'No' }] });
    await _hxIngest(ent(5e12, '  NameTest ', 'sOTHERFILES'));
    const u1 = await _hxIngest(ent(5e12 + 1, 'HB_ANALYSIS', 'sUNRELATED1')), u2 = await _hxIngest(ent(5e12 + 2, 'HB_ANALYSIS', 'sUNRELATED2'));
    const mine = _hxRunsOf('n:nametest');
    return { sets: Object.keys(_hx.sets).sort(), vers: mine.map(r => r.ver).sort().join(), setN: _hx.sets['n:nametest'].nextVer };
  });
  check('E37', 'the same name in another spelling, on other files, is a third version — not a copy', b.vers === '1,2,3' && b.setN === 4, b);
  check('E37', 'analyses nobody named keep to their own dataset (two unrelated HB_ANALYSIS are two entries)', b.sets.includes('sUNRELATED1') && b.sets.includes('sUNRELATED2'), b);
  // 2. History saved before names were the identity: several datasets with one name become one entry
  const c = await E(async () => {
    await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true);
    const mkSet = (id, t, extra) => Object.assign({ id, name: 'OLD', created: t, updated: t, nextVer: 2, filesStored: false }, extra || {});
    const mkRun = (id, setId, params) => ({ id, setId, ts: id, assayId: 'OLD', groups: 'G', n: 1, nCompounds: 1, nFlag: 0, params, fp: 'f' + id, pk: 'p' + id, ver: 1, paramsDiff: [], pinned: false, label: '', bytes: 1 });
    for (const [sid, t] of [['saaa', 1000], ['sbbb', 2000], ['sccc', 3000]]) { _hx.sets[sid] = mkSet(sid, t, sid === 'sbbb' ? { filesStored: true, fileMeta: [{ role: 'echo', name: 'x.csv' }] } : {}); await _hxPut('sets', _hx.sets[sid]); }
    await _hxPut('files', { setId: 'sbbb', echo: [], readers: {}, smiles: null });
    for (const [id, sid, r2] of [[1000, 'saaa', 0.8], [2000, 'sbbb', 0.9], [3000, 'sccc', 0.7]]) { _hx.runs[id] = mkRun(id, sid, { minR2: r2, r2Enabled: true }); await _hxPut('runs', _hx.runs[id]); await _hxPut('blobs', { id, data: [{ Protein: 'G', Sample_ID: 'x', DC50_nM: r2, Flag: 'No' }] }); }
    await _hxMergeByName();
    const has = async k => { const v = await _hxGet('files', k).catch(() => null); return !!v && v !== true; };
    const rs = _hxRunsOf('n:old').sort((x, y) => x.ver - y.ver), f = await has('n:old');
    return { sets: Object.keys(_hx.sets), vers: rs.map(r => r.ver).join(), diff: rs[1] && rs[1].paramsDiff.map(d => d.label).join(), fk: rs.map(r => r.fk).join(), files: f, filesFlag: _hx.sets['n:old'].filesStored, oldFiles: await has('sbbb') };
  });
  check('E37', 'old copies of one name are merged into a single entry with versions 1..n in the order they were made', c.sets.length === 1 && c.sets[0] === 'n:old' && c.vers === '1,2,3' && /Min R²/.test(c.diff), c);
  check('E37', 'the merge keeps the input files (under the new entry) and remembers which dataset each version ran on', c.files && c.filesFlag && !c.oldFiles && c.fk === 'saaa,sbbb,sccc', c);
  // 3. rename, merge by rename, and unnamed → named
  const d = await E(async () => {
    const mk = (id, name, setId) => _hxIngest({ id, ts: id, assayId: name, setId, groups: 'G', n: 1, nFlag: 0, data: [{ Protein: 'G', Sample_ID: 'x', DC50_nM: id, Flag: 'No' }] });
    await mk(7e12, 'HB_ANALYSIS', 'sLOOSE'); await mk(7e12 + 1, 'OTHER', 'sX');
    const inp = v => { const i = document.createElement('input'); i.value = v; i.dataset.x = ''; return i; };
    await hxRenameDo('sLOOSE', inp('Fresh name'));
    const named = Object.keys(_hx.sets).includes('n:fresh name') && !_hx.sets['sLOOSE'] && Object.values(_hx.runs).find(r => r.id === 7e12).assayId === 'Fresh name';
    await hxRenameDo('n:other', inp('old'));      // typed over an existing name: merged
    const merged = _hxRunsOf('n:old').length === 4 && !_hx.sets['n:other'];
    return { named, merged, vers: _hxRunsOf('n:old').map(r => r.ver).sort().join(), sets: Object.keys(_hx.sets) };
  });
  check('E37', 'renaming an unnamed analysis names it; renaming one to an existing name merges them as versions', d.named && d.merged && d.vers === '1,2,3,4', d);
  // 4. comparing is findable: a Compare button on every version, "vs v1" on the later ones, and one on the Results tab
  const e = await E(async () => {
    document.querySelector('.tab[data-tab="history"]').click(); _hxUi.all = true; await renderHistoryTab();
    const panel = document.getElementById('history-panel');
    const txt = panel.innerText.replace(/\s+/g, ' ');
    const cmpBtns = panel.querySelectorAll('.hx-ver .hist-btn').length, vs = [...panel.querySelectorAll('.hx-ver .hist-btn')].filter(b => /^vs v/.test(b.textContent)).length;
    const [r1, r2] = _hxRunsOf('n:old').sort((x, y) => x.ver - y.ver);
    hxCmpPick(r1.id); await new Promise(r => setTimeout(r, 300));
    const chosen = /chosen/.test(panel.innerText);
    hxCmpPick(r2.id); await new Promise(r => setTimeout(r, 600));
    const open = !!document.querySelector('.hx-cmp');
    hxCloseCompare(); _hxUi.all = false; _hxUi.sel = [];
    return { hint: /Compare two analyses/.test(txt), cmpBtns, vs, chosen, open };
  });
  check('E37', 'History says how to compare, every version has a Compare button, later ones "vs v…", and two presses open the comparison', e.hint && e.cmpBtns >= 8 && e.vs >= 3 && e.chosen && e.open, e);
  const f = await E(async () => {
    switchPanel('analysis', document.querySelectorAll('.outer-tab')[0]); document.querySelector('.tab[data-tab="results"]').click();
    return !!document.querySelector('#results-panel button[onclick="hxCompareFromResults()"]');
  });
  check('E37', 'the Results tab has a Compare… button', f, f);
  // 5. the hint under Assay ID tells what a name will do
  const g = await E(async () => {
    const el = document.getElementById('p-assay'); el.value = 'old'; await _hxNameHint(); const t1 = document.getElementById('p-assay-hint').textContent;
    el.value = 'brand new'; await _hxNameHint(); const t2 = document.getElementById('p-assay-hint').textContent; el.value = '';
    return { t1, t2 };
  });
  check('E37', 'under Assay ID: an existing name says a new version will be added; a new one says it is new', /4 versions/.test(g.t1) && /not a copy/.test(g.t1) && /New in History/.test(g.t2), g);
  await wipe();
});

if (run('E40')) await guard('E40', async () => {
  await BACK_TO_ANALYSIS();
  // an in-memory stand-in for the Hub's Firebase: enough of the real-time database for the History's cloud copy
  await E(() => {
    const tree = {}, L = [];
    const get = path => path.split('/').filter(Boolean).reduce((o, k) => (o === undefined || o === null) ? undefined : o[k], tree);
    const snap = path => ({ val: () => { const v = get(path); return v === undefined ? null : JSON.parse(JSON.stringify(v)); } });
    const setAt = (path, val) => { const ks = path.split('/').filter(Boolean); let o = tree; ks.slice(0, -1).forEach(k => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); const last = ks[ks.length - 1]; if (val === null || val === undefined) delete o[last]; else o[last] = JSON.parse(JSON.stringify(val)); };
    const fire = () => L.slice().forEach(l => setTimeout(() => l.cb(snap(l.path)), 0));
    const node = path => ({ child: p => node(path + '/' + p), parent: { child: p => node(path.split('/').slice(0, -1).join('/') + '/' + p) },
      once: async () => snap(path), set: async v => { setAt(path, v); fire(); }, remove: async () => { setAt(path, null); fire(); },
      update: async u => { Object.keys(u).forEach(k => setAt(path + '/' + k, u[k])); fire(); },
      on: (ev, cb) => { L.push({ path, cb }); setTimeout(() => cb(snap(path)), 0); }, off: () => { for (let i = L.length - 1; i >= 0; i--) if (L[i].path === path) L.splice(i, 1); } });
    window.firebase = { database: () => ({ ref: p => node(p) }) }; window.__tree = tree; window.__fbHas = () => get('journal/echo/store') || {};
  });
  const resetEh = () => E(async () => { await _hxLoad(); for (const id of Object.keys(_hx.runs)) { await _hxDel('runs', +id).catch(() => {}); await _hxDel('blobs', +id).catch(() => {}); delete _hx.runs[id]; } for (const k of Object.keys(_hx.sets)) { await _hxDel('sets', k).catch(() => {}); await _hxDel('files', k).catch(() => {}); delete _hx.sets[k]; } try { localStorage.removeItem(HX_TOMB_KEY); } catch (e) {} Object.assign(_eh, { runFp: {}, blobSig: {}, setFp: {}, tombSent: {}, legacyDone: true, state: 'local' }); });
  await resetEh(); await E(() => { window.__tree = window.__tree; for (const k of Object.keys(window.__tree)) delete window.__tree[k]; ehSyncInit(); });
  await runWith({ 'p-assay': 'CLOUD1' }); await pg.waitForTimeout(4000);
  const a = await E(() => { const s = window.__fbHas(), r = Object.keys(s.runs || {}), b = s.blobs && s.blobs[r[0]]; let n = 0; try { n = JSON.parse(b.j).data.length; } catch (e) {} return { runs: r.length, blobs: Object.keys(s.blobs || {}).length, sets: Object.keys(s.sets || {}).length, n, state: _eh.state, name: r[0] && JSON.parse(s.runs[r[0]].j).assayId }; });
  check('E40', 'an analysis is written to the cloud: its row, its results (all 63 fits) and the analysis as a whole, under its name', a.runs === 1 && a.blobs === 1 && a.sets === 1 && a.n === 63 && a.name === 'CLOUD1' && a.state === 'ok', a);
  const st = await E(async () => { document.querySelector('.tab[data-tab="history"]').click(); await renderHistoryTab(); return document.getElementById('hx-cloud').innerText; });
  check('E40', 'the History says it is backed up', /Backed up in the cloud/.test(st), st);
  // a second run under the same name is another version in the same analysis, in the cloud too
  await runWith({ 'p-assay': 'CLOUD1', 'p-r2': '0.9' }); await pg.waitForTimeout(4000);
  const b = await E(() => { const s = window.__fbHas(); return { runs: Object.keys(s.runs || {}).length, sets: Object.keys(s.sets || {}).length, vers: Object.values(s.runs || {}).map(r => JSON.parse(r.j).ver).sort().join() }; });
  check('E40', 'the same name again is version 2 of one analysis in the cloud, not a second analysis', b.runs === 2 && b.sets === 1 && b.vers === '1,2', b);
  // History: the analysis is one line; its versions open on click
  const h = await E(async () => { _hxUi.open = {}; _hxUi.all = false; document.querySelector('.tab[data-tab="history"]').click(); await renderHistoryTab(); const p = document.getElementById('history-panel'); return { rows: p.querySelectorAll('.hx-set').length, vers: p.querySelectorAll('.hx-ver').length, name: p.querySelector('.hx-name').innerText, pill: p.querySelector('.hx-sa .hx-pill').innerText }; });
  check('E40', 'History lists the analysis by name on one line, its versions hidden', h.rows === 1 && h.vers === 0 && /CLOUD1/.test(h.name) && /2 versions/.test(h.pill), h);
  await pg.locator('.hx-set .hx-sm').first().click(); await pg.waitForTimeout(300);
  const h2 = await E(() => document.querySelectorAll('#history-panel .hx-ver').length);
  check('E40', 'clicking the analysis shows its versions', h2 === 2, h2);
  // another device / a cleared browser: everything comes back from the cloud, results on demand
  await resetEh(); await E(() => { _hxUi.open = {}; ehSyncInit(); }); await pg.waitForTimeout(1500);
  const c = await E(async () => { const rs = Object.values(_hx.runs).sort((x, y) => x.ver - y.ver), local = await _hxGet('blobs', rs[0] && rs[0].id).catch(() => null); return { runs: rs.length, vers: rs.map(r => r.ver).join(), sets: Object.keys(_hx.sets), name: _hx.sets['n:cloud1'] && _hx.sets['n:cloud1'].name, localBlob: !!local && local !== true && !!local.data }; });
  check('E40', 'with an empty browser the History comes back from the cloud: the analysis, its name, its versions', c.runs === 2 && c.vers === '1,2' && c.name === 'CLOUD1', c);
  check('E40', 'its results are not downloaded until it is opened', c.localBlob === false, c);
  const d = await E(async () => { const r = Object.values(_hx.runs).find(x => x.ver === 1); _lastResultsData = null; await loadHistoryEntry(r.id); await new Promise(res => setTimeout(res, 600)); const l = await _hxGet('blobs', r.id).catch(() => null); return { n: (_lastResultsData || []).length, cached: !!l && l !== true && !!l.data }; });
  check('E40', 'opening it fetches the results from the cloud (and keeps a copy here)', d.n === 63 && d.cached, d);
  // deleting here removes it from the cloud and leaves a tombstone for the other devices
  const id2 = await E(async () => { const r = Object.values(_hx.runs).find(x => x.ver === 2); await _hxDeleteRuns([r.id]); ehSyncPush(); return r.id; }); await pg.waitForTimeout(2800);
  const e = await E(id => { const s = window.__fbHas(); return { run: !!(s.runs && s.runs[id]), blob: !!(s.blobs && s.blobs[id]), tomb: !!(s.deleted && s.deleted[id]), left: Object.keys(s.runs || {}).length }; }, id2);
  check('E40', 'deleting a version removes it from the cloud and leaves a deletion marker', !e.run && !e.blob && e.tomb && e.left === 1, e);
  // an analysis with no name is not run
  const f = await E(async () => { const before = _lastResultsData, pa = document.getElementById('p-assay'); pa.value = ''; await runPipeline(); const toast = document.body.innerText; const r = { same: _lastResultsData === before, flagged: pa.classList.contains('needs-name'), modal: !document.getElementById('setup-modal').classList.contains('hidden') }; pa.value = 'CLOUD1'; closeSetupModal(); return r; });
  check('E40', 'Run with no name stops, opens Setup on the Assay tab and marks the field', f.same && f.flagged && f.modal, f);
  // no Firebase: the History says it is only on this device
  const g = await E(async () => { delete window.firebase; await _ehFlush(); document.querySelector('.tab[data-tab="history"]').click(); await renderHistoryTab(); return document.getElementById('hx-cloud').innerText; });
  check('E40', 'without the cloud the History says plainly that it is only on this device', /On this device only/.test(g), g);
  await E(() => { _hxUi.open = {}; }); await resetEh();
});

if (run('E32')) await guard('E32', async () => {
  await BACK_TO_ANALYSIS();
  await E(async () => { await _hxLoad(); await _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true); });
  await runWith({}); await pg.waitForTimeout(1300);
  await runWith({ 'p-r2': '0.9' }); await pg.waitForTimeout(1300);
  const r = await E(async () => {
    const rs = Object.values(_hx.runs).sort((x, y) => x.ver - y.ver);
    // doctor version 2: one compound twice as potent, one flat, one missing
    const blob = await _hxGet('blobs', rs[1].id);
    const d = blob.data; d[0].DC50_nM = +(d[0].DC50_nM / 2).toPrecision(3); d[1].DC50_nM = d[1].DC50_nM * 10; d[2].Flag = 'Yes'; d[2].Flag_Reason = 'No effect (span 3%)'; const gone = d.pop();
    await _hxPut('blobs', blob);
    const A = (await _hxGet('blobs', rs[0].id)).data, P = _hxPairs(A, d);
    const self = _hxPairs(A, A);
    hxCompare(rs[0].id, rs[1].id); await new Promise(r => setTimeout(r, 700));
    const panel = document.getElementById('history-panel');
    return { matched: P.rows.length, onlyA: P.onlyA, onlyB: P.onlyB, r0: P.rows[0].ratio, r1: P.rows[1].ratio, nd: P.rows[2].ratio, selfOne: self.rows.every(x => Number.isNaN(x.ratio) || Math.abs(x.ratio - 1) < 1e-12), text: panel.innerText.replace(/\s+/g, ' '),
      points: panel.querySelectorAll('.hx-pt').length, valid: P.rows.filter(x => Number.isFinite(x.lr)).length, rows: panel.querySelectorAll('.hx-tbl tbody tr').length, first: panel.querySelector('.hx-tbl tbody tr') && panel.querySelector('.hx-tbl tbody tr').getAttribute('data-k'), diff: !!panel.querySelector('.hx-d') };
  });
  check('E32', 'rows are matched by group and compound; unmatched ones are counted, not dropped silently', r.matched === 62 && r.onlyA === 1 && r.onlyB === 0, r);
  check('E32', 'the fold change is second over first (÷2 for a halved DC50, ×10 for a tenfold one) and a flat curve has none', Math.abs(r.r0 - 0.5) < 0.01 && Math.abs(r.r1 - 10) < 1e-9 && Number.isNaN(r.nd), r);
  check('E32', 'comparing an analysis with itself changes nothing anywhere', r.selfOne, r);
  check('E32', 'the view lists the setting that differs, draws every comparable point, and puts the biggest change first',
    /Min R² 0\.8 → 0\.9/.test(r.text) && r.points === r.valid && r.rows === 62 && /EDA-014/.test(r.first || '') && /Newly flagged/.test(r.text), { text: r.text.slice(150, 600), points: r.points, valid: r.valid, rows: r.rows, first: r.first });
  await E(() => { hxCloseCompare(); return _hxDeleteRuns(Object.keys(_hx.runs).map(Number), true); });
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

if (run('E30')) await guard('E30', async () => {
  const runWith = async on => {
    await E(on => { document.getElementById('p-row-norm').checked = on; window._pipelineRunning = true; runPipeline(); }, on);
    await pg.waitForTimeout(1500);
    await pg.waitForFunction(() => !window._pipelineRunning && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 }).catch(() => {});
  };
  await runWith(true);
  const on = await E(() => {
    const rows = _lastResultsData, aud = window._normAudits || [];
    const raw = downloadBlobs.find(b => b.kind === 'csv' && b.name.includes('Raw_Data')), sum = downloadBlobs.find(b => b.kind === 'csv' && b.name.includes('Consolidated_Summary'));
    const txt = b => new TextDecoder().decode(b.bytes).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
    const rl = txt(raw), rh = rl[0].split(','), iM = rh.indexOf('Measurement'), iR = rh.indexOf('Raw_Signal'), iF = rh.indexOf('Reference_Signal');
    let badRecalc = 0, n = 0; rl.slice(1).forEach(l => { const c = l.split(','); const m = +c[iM], r = +c[iR], f = +c[iF]; if (isFinite(m) && r && f) { n++; if (Math.abs(m - r / f * 100) > 0.01 + Math.abs(m) * 1e-4) badRecalc++; } });
    const sl = txt(sum), sh = sl[0];
    const tbl = document.getElementById('results-panel'); document.querySelector('.tab[data-tab="results"]').click(); renderResults(_lastResultsData);
    const th = [...document.querySelectorAll('.results-tbl-scroll th')].map(t => t.textContent);
    const ctx = (() => { const r = echoResultRows(); return { norm: r.filter(x => x.norm && x.norm.method).length, n: r.length }; })();
    return { rows: rows.length, withMethod: rows.filter(r => r.Norm_Method).length, withCheck: rows.filter(r => r.Norm_Check).length, withPlain: rows.filter(r => r.Plain_DC50_nM != null).length,
      checks: [...new Set(rows.map(r => r.Norm_Check))], reps: rows.every(r => (r._reps || []).some(p => p.yp != null)), aud: aud.length, audN: aud[0] && aud[0].n, audLines: aud[0] ? _normAuditLines(aud[0]).length : 0,
      banner: !!document.querySelector('.na-box'), thN: th.includes('Normalisation'), thC: th.includes('vs plain mean'), nRaw: n, badRecalc, hasRawCols: iR > 0 && iF > 0,
      sumHdr: /Normalisation/.test(sh) && /Ratio_vs_plain_mean/.test(sh), ctx, tip: rows[0] && _normTip(rows[0]).length > 10 };
  });
  check('E30', 'every curve carries its method, the check and the plain-mean fit', on.rows > 0 && on.withMethod === on.rows && on.withCheck === on.rows && on.withPlain > 0 && on.reps, on);
  check('E30', 'the audit exists, is not empty, and covers every curve', on.aud === 1 && on.audN === on.rows && on.audLines >= 5, on);
  check('E30', 'Measurement = Raw_Signal / Reference_Signal × 100 on every row of the Raw CSV', on.hasRawCols && on.nRaw > 0 && on.badRecalc === 0, on);
  check('E30', 'the table has the two columns and the audit above it; the summary CSV has them too', on.banner && on.thN && on.thC && on.sumHdr, on);
  check('E30', 'Labbook receives the method and the check for every curve', on.ctx.norm === on.ctx.n, on);
  if (hasPdf) {
    const bt = (await download(() => _pdfExportFiltered(_lastResultsData.filter(r => r.Protein === 'BRD2')))).toString('latin1');
    check('E30', 'the curve PDF says how each curve was normalised and carries the account on the page', /Normalisation: Smart/.test(bt) && /Readings were normalised to a per-plate/.test(bt) && /plain mean/.test(bt), { smart: /Normalisation: Smart/.test(bt), foot: /Readings were normalised/.test(bt) });
  }
  await runWith(false);
  const off = await E(() => {
    const rows = _lastResultsData, aud = window._normAudits || [];
    return { methods: [...new Set(rows.map(r => r.Norm_Method))], checks: rows.filter(r => r.Norm_Check).length, plain: rows.filter(r => r.Plain_DC50_nM != null).length, yp: rows.some(r => (r._reps || []).some(p => p.yp != null)), smart: aud[0] && aud[0].smart, banner: !!document.querySelector('.na-box') };
  });
  check('E30', 'Smart off: "Plate mean", no comparison invented, the audit says the bias check was not run', off.methods.length === 1 && off.methods[0] === 'Plate mean' && !off.checks && !off.plain && !off.yp && off.smart === false && off.banner, off);
  const fy = await E(() => { document.querySelector('.tab[data-tab="curves"]').click(); if (!document.getElementById('cv-fix-y')) renderCurvesTab(_lastResultsData); const cb = document.getElementById('cv-fix-y'), a = document.getElementById('cv-ymin-fixed'), b = document.getElementById('cv-ymax-fixed'); a.value = ''; b.value = ''; cb.checked = true; _onCvFixYChange(cb); const d = [a.value, b.value]; a.value = '-30'; cb.checked = false; cb.checked = true; _onCvFixYChange(cb); return { d, kept: a.value }; });
  check('E30', 'Fix Y starts at −15 / 120 and keeps a value you typed', fy.d[0] === '-15' && fy.d[1] === '120' && fy.kept === '-30', fy);
});

if (run('E31')) await guard('E31', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(() => {
    const ids = [...new Set(_lastResultsData.map(x => x.Sample_ID))].slice(0, 5);
    const mw = [300, 120, null, 250, 500];
    const cd = {}; ids.forEach((id, i) => { cd[id] = { smiles: 'C'.repeat(i + 1), MW: mw[i], logP: i, HBA: 1, HBD: 1, TPSA: 1, RotBonds: 1, ArRings: 1, svg: '' }; });
    window._propSort = { col: null, asc: true };
    const col = () => [...document.querySelectorAll('#props-panel tbody tr')].map(tr => tr.children[3].textContent.trim());
    renderProperties(_lastResultsData, cd); window._lastCompoundData = cd;
    const th = [...document.querySelectorAll('#props-panel th.pp-sort')].find(t => /^MW/.test(t.textContent.trim()));
    const out = { plain: col() };
    th.click(); out.asc = col(); document.querySelectorAll('#props-panel th.pp-sort').forEach(t => { if (/^MW/.test(t.textContent.trim())) out.sortAttr = t.getAttribute('aria-sort'); });
    [...document.querySelectorAll('#props-panel th.pp-sort')].find(t => /^MW/.test(t.textContent.trim())).click(); out.desc = col();
    [...document.querySelectorAll('#props-panel th.pp-sort')].find(t => /^MW/.test(t.textContent.trim())).click(); out.reset = col();
    window._propSort = { col: null, asc: true };
    return out;
  });
  check('E31', 'ascending: 120 250 300 500, the missing value last', JSON.stringify(r.asc) === JSON.stringify(['120', '250', '300', '500', '—']), r);
  check('E31', 'descending keeps the missing value last', JSON.stringify(r.desc) === JSON.stringify(['500', '300', '250', '120', '—']), r);
  check('E31', 'a third click restores the original order, and the header says which way it sorts', JSON.stringify(r.reset) === JSON.stringify(r.plain) && r.sortAttr === 'ascending', r);
  const dup = await E(async () => {
    const chk = document.getElementById('multi-assay-chk'); chk.checked = true; toggleMultiAssay(); 
    const list = document.querySelectorAll('#mat-type-list [id^="mat-panel-"]');
    while (document.querySelectorAll('#mat-type-list [id^="mat-panel-"]').length < 2) addAssayType();
    await runPipeline();
    const msg = document.getElementById('results-panel').innerText.replace(/\s+/g, ' ');
    chk.checked = false; toggleMultiAssay();
    return { stopped: /analysis stopped/i.test(msg), msg: msg.slice(0, 200) };
  });
  check('E31', 'two panels with the same assay type and prefix stop the run instead of doubling every compound', dup.stopped && /Two assay panels/.test(dup.msg), dup);
});

if (run('E33')) await guard('E33', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(async () => {
    const out = {};
    const rv = async () => { const R = await echoReview(); return { level: R.level, issues: R.issues.map(i => i.level + ': ' + i.msg), plates: R.plates.map(p => p.plate + ':' + p.status + ':' + p.group), stats: R.stats }; };
    document.getElementById('p-ctrl').value = 'B12-O12';
    out.ok = await rv();
    document.getElementById('p-ctrl').value = 'B2:O3'; out.onCpd = await rv();
    document.getElementById('p-ctrl').value = ''; out.noCtrl = await rv();
    document.getElementById('p-ctrl').value = 'B12-O12';
    const saved = readerFiles['BRD3-02.xlsx']; delete readerFiles['BRD3-02.xlsx']; out.noReader = await rv(); readerFiles['BRD3-02.xlsx'] = saved;
    const savedEcho = echoFiles.slice();
    const txt = new TextDecoder().decode(Uint8Array.from(atob(_TEST_ECHO_B64), c => c.charCodeAt(0)));
    let n = 0; const cut = txt.split(/\r?\n/).filter(l => { if (/,BRD2-01,/.test(l) && /,EDA-013,/.test(l)) { n++; return n <= 3; } return true; }).join('\n');
    echoFiles = [new File([cut], 'few.csv', { type: 'text/csv' })]; out.few = await rv(); echoFiles = savedEcho;
    // group rules
    const g = document.getElementById('p-group-mode');
    g.value = 'whole'; out.whole = (await rv()).plates;
    g.value = 'last'; out.last = (await rv()).plates;
    g.value = 'first';
    // the Review's own editing writes the table and switches to it
    const inp = document.querySelector('#rv-body input.rv-g'); document.querySelector('.setup-stab[data-tab="review"]').click(); await new Promise(r => setTimeout(r, 1500));
    const first = document.querySelector('#rv-body input.rv-g[data-bc="BRD2-01"]'); first.value = 'Alpha'; first.dispatchEvent(new Event('change', { bubbles: true }));
    out.mode = g.value; out.map = document.getElementById('p-group-map').value; await new Promise(r => setTimeout(r, 900));
    out.afterEdit = (await rv()).plates.map(p => p.replace(/:[a-z]+:/, ':'));
    return out;
  });
  check('E33', 'clean data: ready, 63 curves in 3 groups, the intermediate plate is skipped not flagged', r.ok.level === 'ok' && r.ok.stats.curves === 63 && r.ok.stats.groups === 3 && r.ok.plates.some(p => p.startsWith('INTER:skip')) && !r.ok.issues.length, r.ok);
  check('E33', 'control wells that hold compounds are reported', r.onCpd.issues.some(i => /compound transfers land in the control wells/.test(i)), r.onCpd);
  check('E33', 'no control wells is an error', r.noCtrl.level === 'error' && r.noCtrl.issues.some(i => /No control wells/.test(i)), r.noCtrl);
  check('E33', 'a plate without a reader file is an error naming it', r.noReader.level === 'error' && r.noReader.issues.some(i => /BRD3-02/.test(i) && /no reader file/.test(i)), r.noReader);
  check('E33', 'a compound with fewer than 4 readings is listed as skipped', r.few.issues.some(i => /will be skipped/.test(i) && /EDA-013/.test(i)), r.few);
  check('E33', 'group rules: whole barcode and last dash', r.whole.includes('BRD2-01:ok:BRD2-01') && r.last.includes('BRD2-01:ok:BRD2'), { whole: r.whole, last: r.last });
  check('E33', 'editing a plate\'s group in the Review writes the table, switches to it, and regroups only that plate', r.mode === 'custom' && /BRD2-01 = Alpha/.test(r.map) && r.afterEdit.includes('BRD2-01:Alpha') && r.afterEdit.includes('BRD2-02:BRD2'), { mode: r.mode, map: r.map, after: r.afterEdit });
  const run = await runWith({ 'p-group-mode': 'custom', 'p-group-map': 'BRD2-* = Alpha\nBRD3-01 = Beta' });
  const grp = await E(() => ({ groups: [...new Set(_lastResultsData.map(x => x.Protein))].sort(), proto: (document.getElementById('tab-protocol')?.innerText || '').match(/Plates grouped by[^\n]*\n?[^\n]*/)?.[0] || '', mode: _lastAnalysisParams.groupMode }));
  check('E33', 'the run uses the table (BRD2-* → Alpha, BRD3-01 → Beta, the rest by the first dash) and the Protocol tab says so', grp.groups.join() === 'Alpha,BRD3,BRD4,Beta' || grp.groups.join() === 'Alpha,BRD3,BRD4,Beta'.split(',').sort().join(), grp);
  await E(() => { document.getElementById('p-group-mode').value = 'first'; document.getElementById('p-group-map').value = ''; onGroupModeChange(); });
  await runWith({});
});

if (run('E34')) await guard('E34', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({});
  const r = await E(async () => {
    const out = {};
    const nds = _lastResultsData.filter(x => /No effect/.test(x.Flag_Reason || '')), ok = _lastResultsData.find(x => x.Flag !== 'Yes');
    out.nNd = nds.length; const nd0 = nds[0];
    out.keeps = typeof nd0.DC50_nM === 'number' && nd0.DC50_nM > 0;
    document.querySelector('.tab[data-tab="results"]').click(); renderResults(_lastResultsData);
    const rowOf = x => [...document.querySelectorAll('.results-tbl-scroll tbody tr')].find(tr => tr.children[1] && tr.children[1].textContent.trim() === x.Sample_ID && tr.children[0].textContent.trim() === x.Protein);
    const cells = tr => [...tr.children].map(c => c.textContent.trim());
    out.ndRow = cells(rowOf(nd0)).join('|'); out.okRow = cells(rowOf(ok)).join('|');
    out.ndCount = [...rowOf(nd0).children].filter(c => c.textContent.trim() === 'n.d.').length;
    // summary csv
    const blob = downloadBlobs.find(b => /Consolidated_Summary/.test(b.name)); const csv = new TextDecoder().decode(blob.bytes);
    const lines = csv.split(/\r?\n/), hdr = lines[0].split(','), line = lines.find(l => l.indexOf(nd0.Sample_ID) >= 0 && l.indexOf(nd0.Protein) === 0 || l.startsWith(nd0.Protein + ',' + nd0.Sample_ID));
    out.csvNd = line && line.split(',').filter(c => c === 'n.d.').length; out.csvHdr = hdr.length;
    // TSV
    let tsv = ''; const realClip = navigator.clipboard; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { tsv = t; return Promise.resolve(); } }, configurable: true });
    copyResultsTSV(); await new Promise(r => setTimeout(r, 100)); Object.defineProperty(navigator, 'clipboard', { value: realClip, configurable: true });
    out.tsvNd = (tsv.split('\n').find(l => l.startsWith(nd0.Protein + '\t' + nd0.Sample_ID)) || '').split('\t').filter(c => c === 'n.d.').length;
    // workbook
    let wb = null; const realWrite = XLSX.write; XLSX.write = (w, o) => { wb = w; return realWrite.call(XLSX, w, o); }; try { generateOutputXLSX(); } finally { XLSX.write = realWrite; }
    if (wb) { const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }); const h = rows[0]; const row = rows.find(rw => rw[0] === nd0.Protein && rw[1] === nd0.Sample_ID); out.xlsxNd = row.filter(c => c === 'n.d.').length; out.xlsxDmax = row[h.findIndex(c => /Dmax/.test(c))]; }
    // labbook
    const lb = echoResultRows().find(x => x.compound === nd0.Sample_ID && x.target === nd0.Protein), lbOk = echoResultRows().find(x => x.compound === ok.Sample_ID);
    out.lb = { nd: lb.nd, potency: lb.potency, fit: lb.potencyFit, bound: lb.bound, okPotency: lbOk.potency, okNd: lbOk.nd, effect: lb.effect };
    // properties
    const cd = {}; cd[nd0.Sample_ID] = { smiles: 'C', MW: 1, logP: 1, HBA: 1, HBD: 1, TPSA: 1, RotBonds: 1, ArRings: 1, svg: '' };
    renderProperties(_lastResultsData, cd); out.props = document.querySelector('#props-panel td.pp-aff') ? document.querySelector('#props-panel td.pp-aff').innerText.replace(/\s+/g, ' ') : null;
    // scatter: potency axes drop it, a Dmax-only plot keeps it
    window._scNd = 0; renderScatter(_lastResultsData); document.getElementById('sc-flags').checked = true; buildScatterChart(); out.scNd = window._scNd; out.scNote = document.getElementById('sc-nd-note') && document.getElementById('sc-nd-note').textContent;
    // switch off
    _lastAnalysisParams.ndNoEffect = false; renderResults(_lastResultsData);
    out.offRow = cells(rowOf(nd0)).join('|'); out.offNd = _outVal(nd0, 'DC50_nM') === nd0.DC50_nM; _lastAnalysisParams.ndNoEffect = true;
    return out;
  });
  check('E34', 'there are flat curves in the test data and the data rows keep their fitted values', r.nNd >= 2 && r.keeps, r);
  check('E34', 'the table prints n.d. for potency, Abs, logs, Hill and the interval of a flat curve, and numbers for a good one', r.ndCount >= 5 && !/n\.d\./.test(r.okRow), { nd: r.ndRow, ok: r.okRow });
  check('E34', 'the summary CSV, Copy TSV and the workbook say n.d. too, and Dmax stays a number', r.csvNd >= 4 && r.tsvNd >= 4 && r.xlsxNd >= 4 && typeof r.xlsxDmax === 'number', { csv: r.csvNd, tsv: r.tsvNd, xlsx: r.xlsxNd, dmax: r.xlsxDmax });
  check('E34', 'Labbook gets nd:true and no potency for a flat curve, the numbers for the rest', r.lb.nd === true && r.lb.potency === null && r.lb.fit > 0 && r.lb.bound && r.lb.okNd === false && r.lb.okPotency > 0 && typeof r.lb.effect === 'number', r.lb);
  check('E34', 'Properties shows n.d. for it', r.props && /n\.d\./.test(r.props), r.props);
  check('E34', 'potency plots leave it out and say how many', r.scNd >= 1 && /no effect/.test(r.scNote || ''), { n: r.scNd, note: r.scNote });
  check('E34', 'with the switch off the numbers come back everywhere', !/n\.d\./.test(r.offRow) && r.offNd, { off: r.offRow });
});

if (run('E35')) await guard('E35', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({});
  const r = await E(async () => {
    const out = { unnamed: {}, tablists: [] };
    const named = el => !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.labels && el.labels.length) || (['BUTTON'].includes(el.tagName) && (el.textContent || '').trim()) || el.getAttribute('title'));
    for (const t of ['results', 'curves', 'scatter', 'plate', 'props', 'log', 'history', 'protocol', 'survey', 'guide']) {
      document.querySelector('.tab[data-tab="' + t + '"]').click(); await new Promise(r => setTimeout(r, t === 'plate' ? 1000 : 450));   // the plate view is drawn before it is named
      const pane = document.getElementById('tab-' + t);
      out.unnamed[t] = [...pane.querySelectorAll('button, input:not([type=hidden]), select, textarea, [role=button]')].filter(e => e.offsetParent !== null && !named(e)).map(e => (e.tagName + '#' + e.id + '.' + e.className).slice(0, 50)).slice(0, 4);
    }
    document.querySelector('.tab[data-tab="results"]').click(); await new Promise(r => setTimeout(r, 300));
    document.querySelectorAll('[role=tablist]').forEach(l => out.tablists.push({ label: l.getAttribute('aria-label'), tabs: l.querySelectorAll('[role=tab]').length, selected: l.querySelectorAll('[aria-selected="true"]').length, focusable: l.querySelectorAll('[role=tab][tabindex="0"]').length }));
    // arrows
    const first = document.querySelector('.tabs-scroll .tab.active'); first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    out.afterArrow = document.querySelector('.tabs-scroll .tab.active').dataset.tab;
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); await new Promise(r => setTimeout(r, 200));
    out.afterEnd = document.querySelector('.tabs-scroll .tab.active').dataset.tab;
    document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '[', bubbles: true })); await new Promise(r => setTimeout(r, 200));
    out.afterBracket = document.querySelector('.tabs-scroll .tab.active').dataset.tab;
    document.querySelector('.tab[data-tab="results"]').click(); await new Promise(r => setTimeout(r, 300));
    // sortable header
    const th = [...document.querySelectorAll('.results-tbl-scroll th[data-col-key]')].find(h => h.getAttribute('data-col-key') === 'DC50_nM');
    out.thTab = th.tabIndex; th.focus(); th.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await new Promise(r => setTimeout(r, 200));
    out.thSort = [...document.querySelectorAll('.results-tbl-scroll th[data-col-key]')].find(h => h.getAttribute('data-col-key') === 'DC50_nM').getAttribute('aria-sort');
    // dialog
    const opener = document.querySelector('[onclick*="openSetupModal"]'); opener.focus(); opener.click(); await new Promise(r => setTimeout(r, 300));
    const m = document.getElementById('setup-modal'), card = m.querySelector('.setup-card');
    out.dialog = { role: card.getAttribute('role'), modal: card.getAttribute('aria-modal'), inside: m.contains(document.activeElement) };
    const f = [...m.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
    f[f.length - 1].focus(); document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    out.trapped = m.contains(document.activeElement);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 300));
    out.closed = m.classList.contains('hidden'); out.restored = document.activeElement === opener;
    const pb = document.querySelector('.pbar-wrap'); out.pb = pb.getAttribute('role');
    document.querySelector('.tab[data-tab="curves"]').click(); await new Promise(r => setTimeout(r, 500)); a11yDescribeCharts();
    const cv = document.getElementById('cv-canvas'); out.cv = cv.getAttribute('role') + ' | ' + cv.getAttribute('aria-label');
    return out;
  });
  const un = Object.entries(r.unnamed).filter(([, v]) => v.length);
  check('E35', 'every visible button, input and select on every view has a name', un.length === 0, un);
  check('E35', 'each tab list has one selected tab and one tab stop', r.tablists.length >= 3 && r.tablists.every(l => l.tabs > 0 && l.selected === 1 && l.focusable === 1), r.tablists);
  check('E35', '→ selects the next view, End the last, [ the previous', r.afterArrow === 'curves' && r.afterEnd === 'guide' && r.afterBracket === 'survey', { a: r.afterArrow, e: r.afterEnd, b: r.afterBracket });
  check('E35', 'a sortable header is a tab stop and Enter sorts it (aria-sort follows)', r.thTab === 0 && r.thSort === 'ascending', { tab: r.thTab, sort: r.thSort });
  check('E35', 'the Setup dialog is a modal dialog, takes focus, traps Tab, closes on Esc and gives focus back', r.dialog.role === 'dialog' && r.dialog.modal === 'true' && r.dialog.inside && r.trapped && r.closed && r.restored, { d: r.dialog, trapped: r.trapped, closed: r.closed, restored: r.restored });
  check('E35', 'progress is a progressbar; the curve describes itself', r.pb === 'progressbar' && /^img \| Dose-response curve of /.test(r.cv), { pb: r.pb, cv: r.cv });
});

if (run('E36')) await guard('E36', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({});
  await pg.waitForTimeout(1500);
  const r = await E(async () => {
    const out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('.tab[data-tab="results"]').click(); await wait(500);
    // 1. nothing loops at rest
    out.looping = [...document.querySelectorAll('body *')].filter(el => el.getClientRects().length > 0).filter(el => { const cs = getComputedStyle(el); return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite'; }).map(el => el.tagName + '#' + el.id + '.' + el.className).slice(0, 5);
    // 2. the ink
    const host = document.querySelector('.tabs-scroll'), ink = host.querySelector(':scope > .tab-ink');
    const under = () => { const a = host.querySelector('.tab.active'), m = (ink.style.transform.match(/translate\(([\d.]+)px,\s*([\d.]+)px\) scaleX\(([\d.]+)\)/) || []); return { dx: Math.abs(+m[1] - a.offsetLeft), dw: Math.abs(+m[3] * 100 - a.offsetWidth), dy: Math.abs(+m[2] - (a.offsetTop + a.offsetHeight - 2)) }; };
    out.ink0 = under();
    document.querySelector('.tab[data-tab="scatter"]').click(); await wait(80);
    out.inkMoving = getComputedStyle(ink).transitionProperty.includes('transform') && parseFloat(getComputedStyle(ink).transitionDuration) > 0;
    await wait(450); out.ink1 = under();
    // 3. coming back from the planner
    switchPanel('gradient', document.querySelectorAll('.outer-tab')[1]); await wait(200);
    switchPanel('analysis', document.querySelectorAll('.outer-tab')[0]); await wait(300);
    out.setupAfterPlanner = !document.getElementById('setup-modal').classList.contains('hidden');
    // 4. an edit flashes its row
    document.querySelector('.tab[data-tab="results"]').click(); await wait(300);
    const r0 = _lastResultsData[0]; window._flashKey = null;
    _cvApplyEditsAndRefit(r0); await wait(150);
    out.flash = !!document.querySelector('.results-tbl-scroll tr.row-flash') && document.querySelector('.results-tbl-scroll tr.row-flash').getAttribute('data-k') === r0.Protein + '|' + r0.Sample_ID;
    return out;
  });
  check('E36', 'nothing at rest runs an infinite animation', r.looping.length === 0, r.looping);
  check('E36', 'the tab underline sits under the active tab, and travels to the next by transform', r.ink0.dx < 1.5 && r.ink0.dw < 1.5 && r.ink0.dy < 1.5 && r.inkMoving && r.ink1.dx < 1.5 && r.ink1.dw < 1.5, { a: r.ink0, b: r.ink1, moving: r.inkMoving });
  check('E36', 'returning from the Gradient Planner does not put Setup over the results', r.setupAfterPlanner === false, r);
  check('E36', 'an edit made in Curves flashes the changed row in Results', r.flash, r);
  const ctx2 = await browser.newContext({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage(); await p2.goto('file://' + FILE); await p2.waitForTimeout(1200);
  const rm = await p2.evaluate(() => { const ink = document.querySelector('.tabs-scroll > .tab-ink'); const ds = [ink, document.querySelector('.hist-btn') || document.querySelector('.tab')].filter(Boolean).map(e => parseFloat(getComputedStyle(e).transitionDuration)); return ds; });
  check('E36', 'with reduced motion every transition is clamped to a hair', rm.length > 0 && rm.every(d => d <= 0.01), rm);
  await ctx2.close();
});

if (run('E41')) await guard('E41', async () => {
  // A URL is pinned when '@rdkit/rdkit' is followed by '@<digit>' or by '@' + RDKIT_VERSION; comments are not URLs.
  const unpinned = f => { const t = fs.readFileSync(f, 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n'); return [...t.matchAll(/@rdkit\/rdkit(?!@(?:\d|' \+ RDKIT_VERSION))/g)].length; };
  check('E41', 'every @rdkit/rdkit URL in echo.html carries a version', unpinned(FILE) === 0, unpinned(FILE));
  const dora = path.join(ROOT, 'apps/dora/dora.html');
  check('E41', 'every @rdkit/rdkit URL in dora.html carries a version', unpinned(dora) === 0, unpinned(dora));
  const r = await E(async () => {
    const full = { amw: 46.069, tpsa: 20.23, CrippenClogP: -0.0014, lipinskiHBA: 1, lipinskiHBD: 1, NumRotatableBonds: 0, NumAromaticRings: 0 };
    const mk = d => ({ is_valid: () => true, get_svg: () => '<svg/>', get_descriptors: () => JSON.stringify(d), get_substruct_match: () => '[]', delete() {} });
    const keep = window._rdkit;
    window._rdkit = { get_mol: smi => mk(smi === 'CCO' ? full : {}), get_qmol: () => null };
    let cd, err = null;
    try { cd = await processSmilesWithRDKit(new File(['id,smiles\nA,CCO\nB,CCN\n'], 's.csv', { type: 'text/csv' })); } catch (e) { err = String(e && e.message || e); }
    window._rdkit = keep;
    return { err, A: cd && cd.A, B: cd && cd.B };
  });
  check('E41', 'a compound RDKit described keeps its numbers', r.A && r.A.MW === 46.1 && r.A.TPSA === 20.2 && r.A.HBA === 1 && r.A.HBD === 1 && r.A.logP === 0, r);
  check('E41', 'a descriptor RDKit did not return is null, never 0', r.B && ['MW', 'logP', 'HBA', 'HBD', 'TPSA', 'RotBonds', 'ArRings'].every(k => r.B[k] === null), r);
});

if (run('E42')) await guard('E42', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(() => {
    const verdict = (MW, logP, HBA, HBD) => {
      const cd = { 'EDA-013': { smiles: 'CCO', MW, logP, HBA, HBD, TPSA: 20, RotBonds: 0, ArRings: 0, svg: '' } };
      renderProperties(_lastResultsData, cd);
      const row = document.querySelector('#props-panel table.props-table tbody tr');
      return row ? row.lastElementChild.textContent.replace(/\s+/g, ' ').trim() : null;
    };
    return { atLimits: verdict(500, 5, 10, 5), mwOver: verdict(500.1, 5, 10, 5), logpOver: verdict(500, 5.01, 10, 5), hbaOver: verdict(500, 5, 11, 5), hbdOver: verdict(500, 5, 10, 6) };
  });
  check('E42', 'a compound exactly AT every Lipinski limit passes', /Pass/.test(r.atLimits || ''), r);
  check('E42', 'a hair over MW / logP / HBA / HBD each fails', [r.mwOver, r.logpOver, r.hbaOver, r.hbdOver].every(t => /1 fail/.test(t || '')), r);
});

// Rows for a multi-assay table: compound X is fitted against two groups of one assay (BRD2, BRD4) and once in viability.
const MA_ROWS = `(() => {
  const mk = (g, sid, at, dc, dm) => ({ Protein: g, Sample_ID: sid, DC50_nM: dc, AbsDC50_nM: null, Dmax_pct: dm, LogIC50_M: -8, pDC50: 8, HillSlope: 1.2, R2: 0.98, Flag: 'No', Flag_Reason: '',
    Top_val: 100, Bot_val: 100 - dm, CI_DC50_lower: dc / 2, CI_DC50_upper: dc * 2, _assayType: at });
  return [mk('BRD2', 'X-1', 'hibit', 11.1, 80), mk('BRD4', 'X-1', 'hibit', 222, 60), mk('HEK', 'X-1', 'ctg', 3333, 90), mk('BRD2', 'X-2', 'hibit', 44.4, 70)];
})()`;

if (run('E43')) await guard('E43', async () => {
  await BACK_TO_ANALYSIS();
  const raw = await E(async () => { const set = { 'p-skip-norm': true }; for (const [k, v] of Object.entries(set)) { const el = document.getElementById(k); if (el) el.checked = !!v; } _lastResultsData = null; await runPipeline(); return _lastResultsData.map(r => r.Norm_Method); });
  check('E43', 'a run with No normalisation says None (raw signal) on every row', raw.length > 0 && raw.every(m => m === 'None (raw signal)'), [...new Set(raw)]);
  const norm = await E(async () => { const el = document.getElementById('p-skip-norm'); if (el) el.checked = false; _lastResultsData = null; await runPipeline(); return _lastResultsData.map(r => r.Norm_Method); });
  check('E43', 'a normalised run still says Plate mean (or Smart …), never None', norm.length > 0 && norm.every(m => /^(Plate mean|Smart)/.test(m)), [...new Set(norm)]);
});

if (run('E44')) await guard('E44', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(async (ma) => {
    const data = eval(ma), keepP = window._lastAnalysisParams, keepD = _lastResultsData, keepS = scatterData, keepH = window.saveToHistory;
    window._lastAnalysisParams = Object.assign({}, keepP || {}, { multiAssay: true }); window.saveToHistory = () => {};
    renderMultiAssayResults(data);
    const heads = [...document.querySelectorAll('#results-panel thead tr:first-child th')].map(t => t.textContent.trim());
    const rows = [...document.querySelectorAll('#results-panel tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim()));
    // the workbook: capture the Results sheet's array
    scatterData = data; _lastResultsData = data;
    const caps = [], orig = XLSX.utils.aoa_to_sheet; XLSX.utils.aoa_to_sheet = function (a) { caps.push(a); return orig.apply(this, arguments); };
    try { generateOutputXLSX(); } finally { XLSX.utils.aoa_to_sheet = orig; }
    window._lastAnalysisParams = keepP; window.saveToHistory = keepH; _lastResultsData = keepD; scatterData = keepS;
    return { heads, rows, xlsx: caps[0] };
  }, '(' + MA_ROWS + ')');
  const x1 = r.rows.find(t => t[0] === 'X-1') || [];
  check('E44', 'the table has a block per assay and group: HiBiT · BRD2, HiBiT · BRD4, CTG/Viability · HEK', ['HiBiT · BRD2', 'HiBiT · BRD4', 'CTG/Viability · HEK'].every(h => r.heads.includes(h)), r.heads);
  check('E44', 'compound X-1 shows BOTH HiBiT results (11.1 and 222) and the viability one', ['11.1', '222', '3333'].every(v => x1.includes(v)), x1);
  const hx = r.xlsx || [], hrow = hx[0] || [], x1x = (hx.find(t => t[0] === 'X-1') || []);
  check('E44', 'the workbook has the same blocks and the same numbers', ['HiBiT · BRD2', 'HiBiT · BRD4', 'CTG/Viability · HEK'].every(h => hrow.includes(h)) && ['11.1', '222', '3333'].every(v => x1x.map(String).includes(v)), { hrow, x1x });
  check('E44', 'a compound only fitted in one group leaves the other block empty, not copied', (r.rows.find(t => t[0] === 'X-2') || []).includes('44.4') && !(r.rows.find(t => t[0] === 'X-2') || []).includes('222'), r.rows);
});

if (run('E45')) await guard('E45', async () => {
  await BACK_TO_ANALYSIS();
  const r = await E(async (ma) => {
    const data = eval(ma), keepP = window._lastAnalysisParams, keepD = _lastResultsData;
    let text = ''; const keepC = navigator.clipboard; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { text = t; return Promise.resolve(); } } });
    const grab = async () => { text = ''; copyResultsTSV(); await new Promise(r => setTimeout(r, 30)); return text.split('\n').map(l => l.split('\t')); };
    _lastResultsData = data; window._lastAnalysisParams = Object.assign({}, keepP || {}, { multiAssay: true });
    const multi = await grab();
    window._lastAnalysisParams = Object.assign({}, keepP || {}, { multiAssay: false }); _lastResultsData = keepD;
    const single = await grab();
    window._lastAnalysisParams = keepP;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: keepC });
    return { multi, single };
  }, '(' + MA_ROWS + ')');
  check('E45', 'a multi-assay Copy TSV starts with an Assay column', r.multi[0] && r.multi[0][0] === 'Assay', r.multi[0]);
  check('E45', 'every row names its assay (HiBiT / CTG/Viability)', r.multi.slice(1).every(l => /^(HiBiT|CTG\/Viability)$/.test(l[0])) && r.multi.slice(1).some(l => l[0] === 'CTG/Viability'), r.multi.slice(1).map(l => l[0]));
  check('E45', 'the potency column is called a potency, not DC50, when viability rows share it', (r.multi[0] || []).some(h => /^Potency/.test(h)), r.multi[0]);
  check('E45', 'a single-assay Copy TSV has no Assay column', r.single[0] && r.single[0][0] !== 'Assay' && !r.single[0].includes('Assay'), r.single[0]);
});

// A synthetic compound for the engine: 12 doses, a sigmoid around -7.6, and (optionally) the top doses rebounding.
const SCR_SYN = `((hookTop, protein, sid, xs) => {
  const doses = xs || Array.from({ length: 12 }, (_, i) => -10 + i * 0.45), f = x => 5 + 95 / (1 + Math.pow(10, 1.1 * (x - (-7.6))));
  const top3 = doses.slice().sort((a, b) => b - a).slice(0, 3);
  const mk = (x, m) => ({ sampleId: sid, protein, barcode: protein + '-01', barcodeKey: protein.toLowerCase() + '-01', well: 'C03', conc: Math.pow(10, x), log10Conc: x, measurement: m });
  const rows = [];
  doses.forEach(x => { let y = f(x); if (hookTop === true && x === top3[0]) y = 62; if (hookTop === true && x === top3[1]) y = 40; if (hookTop === true && x === top3[2]) y = 22 + 6;
    // subtle: only the top dose rebounds, by 16 points, and the next one by 7 — a hook against the concentration TWO down, not against its neighbour
    if (hookTop === 'subtle' && x === top3[0]) y = f(x) + 16; if (hookTop === 'subtle' && x === top3[1]) y = f(x) + 7; [-1.5, 0, 1.5].forEach(d => rows.push(mk(x, y + d))); });
  return rows;
})`;

if (run('E46')) await guard('E46', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({});
  await pg.waitForTimeout(800);
  const r = await E(async () => {
    const parse = text => { const out = []; let row = [], cur = '', q = false; for (let i = 0; i < text.length; i++) { const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); out.push(row); row = []; cur = ''; } else cur += ch; }
      if (cur || row.length) { row.push(cur); out.push(row); } return out; };
    const recs = _screenRecords(), csv = parse(new TextDecoder().decode(screenCsvBytes()));
    const names = [], caps = [], oA = XLSX.utils.book_append_sheet, oS = XLSX.utils.aoa_to_sheet;
    XLSX.utils.book_append_sheet = function (wb, ws, n) { names.push(n); return oA.apply(this, arguments); };
    XLSX.utils.aoa_to_sheet = function (a) { caps.push(a); return oS.apply(this, arguments); };
    try { generateOutputXLSX(); } finally { XLSX.utils.book_append_sheet = oA; XLSX.utils.aoa_to_sheet = oS; }
    const screenAoa = caps.find(a => a[0] && a[0][0] === 'Schema');
    const same = csv.length === (screenAoa || []).length && csv.every((rw, i) => rw.length === screenAoa[i].length && rw.every((c, j) => c === String(screenAoa[i][j])));
    // n.d. and bounds, with the DISPLAY switch off
    const keep = window._lastAnalysisParams; window._lastAnalysisParams = Object.assign({}, keep, { ndNoEffect: false });
    const recsOff = _screenRecords(); window._lastAnalysisParams = keep;
    const nd = _lastResultsData.filter(x => /No effect/.test(x.Flag_Reason || ''));
    const ndRecs = recsOff.filter(x => /No effect/.test(x.Flag_Reason || ''));
    const base = _lastResultsData.find(x => !/No effect|range/.test(x.Flag_Reason || ''));
    const hi = scrRecord(Object.assign({}, base, { Flag_Reason: 'EC50>range' })), lo = scrRecord(Object.assign({}, base, { Flag_Reason: 'EC50<range' }));
    const oneCsv = recs.filter(x => x.Fit_Status === 'fitted').length;
    const btn1 = document.querySelectorAll('#results-panel .res-dl #cv-pdf-gen-btn').length && _resExportItems().some(i => /Screen table/.test(i.label)) ? 1 : 0;
    const keepP = window._lastAnalysisParams, keepD = _lastResultsData, keepH = window.saveToHistory; window.saveToHistory = () => {};
    window._lastAnalysisParams = Object.assign({}, keepP, { multiAssay: true });
    renderMultiAssayResults(keepD.map(x => Object.assign({}, x)));
    const btn2 = document.querySelectorAll('#results-panel .res-dl #cv-pdf-gen-btn').length && _resExportItems().some(i => /Screen table/.test(i.label)) ? 1 : 0;
    window._lastAnalysisParams = keepP; window.saveToHistory = keepH; _lastResultsData = keepD; renderResults(scatterData);
    return { header: csv[0], cols: SCR_COLS, nCsv: csv.length - 1, nRecs: recs.length, nFit: _lastResultsData.length, nNf: (window._notFitted || []).length, schemaOK: recs.every(x => x.Schema === 'echo-screen/1'),
      same, names, ndN: nd.length, ndOk: ndRecs.length === nd.length && ndRecs.every(x => x.Potency_Qualifier === 'n.d.' && x.Potency_nM === null && x.Tested_Max_nM > 0),
      hi: [hi.Potency_Qualifier, hi.Potency_nM, hi.Tested_Max_nM], lo: [lo.Potency_Qualifier, lo.Potency_nM, lo.Tested_Min_nM], oneCsv, btn1, btn2, hitFinderBtn: !!document.querySelector('#results-panel #res-send-btn') };
  });
  check('E46', 'the CSV header is SCR_COLS, Schema echo-screen/1 on every row', JSON.stringify(r.header) === JSON.stringify(r.cols) && r.schemaOK, r.header);
  check('E46', 'one row per fitted curve plus one per compound that could not be fitted', r.nCsv === r.nFit + r.nNf && r.nRecs === r.nCsv && r.nFit > 0, r);
  check('E46', 'the workbook carries the same table as its last sheet, after every existing sheet', r.same && r.names[r.names.length - 1] === 'Screen (Hit Finder)' && r.names.slice(0, 1)[0] === 'Results', r.names);
  check('E46', 'a flat curve is n.d. with the tested maximum beside it, even with the display switch off', r.ndN > 0 && r.ndOk, r);
  check('E46', 'a midpoint past the doses is a qualifier: > carries the tested maximum, < the tested minimum', r.hi[0] === '>' && r.hi[1] === r.hi[2] && r.lo[0] === '<' && r.lo[1] === r.lo[2], r);
  check('E46', 'the Screen table is under Export on the single-assay and the multi-assay result views; Send to only inside the Hub', r.btn1 >= 1 && r.btn2 >= 1 && !r.hitFinderBtn, { single: r.btn1, multi: r.btn2, hitFinderButton: r.hitFinderBtn });
});

if (run('E47')) await guard('E47', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({ 'p-hook-en': true, 'p-hook': 10 });
  const r = await E(async (syn) => {
    const mkRows = eval(syn);
    const out = {};
    const hk = _echoFitOne('PX', 'HK', mkRows(true, 'PX', 'HK'));
    out.hk = hk && { concs: hk._hook_concs, thr: hk._hookThr, isHook: hk._is_hook };
    const hv = scrHook(hk);
    const g = scrGroupReps(hk._reps);
    out.engineRule = JSON.stringify(scrDetectHook(g, hk._hookThr)) === JSON.stringify(hk._hook_concs);
    const sub = _echoFitOne('PX', 'SUB', mkRows('subtle', 'PX', 'SUB'));
    out.subtle = sub && { concs: sub._hook_concs, engine: scrDetectHook(scrGroupReps(sub._reps), sub._hookThr), state: scrHook(sub).state };
    const nonHook = g.filter(c => !hk._hook_concs.some(h => Math.abs(h - c.x) < 0.002));
    const nadir = Math.min(...nonHook.map(c => c.mean)), top = hk.Top_val;
    out.hv = { state: hv.state, onset: hv.onset_nM, last: hv.lastProductive_nM, depth: hv.depth, rec: hv.recovery, dmaxObs: hv.dmaxObs };
    out.exp = { onset: Math.pow(10, Math.min(...hk._hook_concs)) * 1e9, last: Math.pow(10, Math.max(...nonHook.map(c => c.x))) * 1e9, depth: g[0].mean - nadir, dmaxObs: top - nadir, rec: (g[0].mean - nadir) / (top - nadir) };
    // re-included: refit with the hook in, flagged as the editor does
    const back = Object.assign(_echoFitOne('PX', 'HK', mkRows(true, 'PX', 'HK'), { noHook: true }), { _hookIn: true });
    const bv = scrHook(back); const brec = scrRecord(back, {});
    out.back = { state: bv.state, concs: bv.concs, eff: brec.Effect_Eff, obs: brec.Effect_Obs };
    // no hook: a clean sigmoid, the test ran
    const cl = _echoFitOne('PX', 'CL', mkRows(false, 'PX', 'CL'));
    const cv = scrHook(cl); const crec = scrRecord(cl, {});
    out.clean = { state: cv.state, onset: cv.onset_nM, win: crec.Window_Conservative, cov: crec.Coverage, last: crec.Last_Productive_Nm };
    // never asked / not an assay with a hook
    out.off = scrHook(Object.assign({}, cl, { _hookThr: null })).state;
    out.old = scrHook(Object.assign({}, cl, { _hookThr: undefined })).state;
    out.oldWithSettings = scrHook(Object.assign({}, cl, { _hookThr: undefined }), { hookEnabled: true, hookThr: 10 }).state;
    out.gain = scrHook(Object.assign({}, cl, { _assayType: 'gain' })).state;
    // a half curve: the doses stop before the midpoint (-7.6)
    const half = _echoFitOne('PX', 'HALF', mkRows(false, 'PX', 'HALF', Array.from({ length: 8 }, (_, i) => -10 + i * 0.3)));
    out.half = half && { cov: scrCoverage(half, scrHook(half)).cat, q: scrPotency(half).q, flag: half.Flag_Reason };
    const rec = scrRecord(hk, {}); out.win = [rec.Window_Conservative, rec.Last_Productive_nM / rec.Potency_nM];
    return out;
  }, SCR_SYN);
  const near = (a, b) => a != null && b != null && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  check('E47', 'Echo finds the hook on the synthetic curve (engine reads the same concentrations)', r.hk && r.hk.isHook && r.hk.concs.length >= 1 && r.engineRule, r.hk);
  check('E47', 'a hook that only shows against the concentration two down is found by Echo and by the engine alike', r.subtle && r.subtle.concs.length === 1 && JSON.stringify(r.subtle.engine) === JSON.stringify(r.subtle.concs) && r.subtle.state === 'excluded', r.subtle);
  check('E47', 'onset is the lowest hook concentration, last productive the highest one before it', r.hv.state === 'excluded' && near(r.hv.onset, r.exp.onset) && near(r.hv.last, r.exp.last), { hv: r.hv, exp: r.exp });
  check('E47', 'depth, recovery and the observed Dmax are the arithmetic of the replicate means', near(r.hv.depth, r.exp.depth) && near(r.hv.rec, r.exp.rec) && near(r.hv.dmaxObs, r.exp.dmaxObs), { hv: r.hv, exp: r.exp });
  check('E47', 'the conservative window is last productive / potency', near(r.win[0], +(+r.win[1]).toPrecision(3)), r.win);
  check('E47', 'a hook the user put back in the fit is still a hook, and its Dmax is the observed one', r.back.state === 'included' && r.back.concs.length >= 1 && r.back.eff === r.back.obs, r.back);
  check('E47', 'a curve with no hook is none only because the test ran; not asked is off / unknown; gain has none', r.clean.state === 'none' && r.clean.onset === null && r.off === 'off' && r.old === 'unknown' && r.oldWithSettings === 'none' && r.gain === 'n/a', r);
  check('E47', 'a complete curve says so; a half curve is not complete and its midpoint is a qualifier', r.clean.cov === 'complete' && r.half && r.half.cov !== 'complete' && r.half.q !== '=', r);
});

if (run('E48')) await guard('E48', async () => {
  await BACK_TO_ANALYSIS();
  const fields = { 'p-assay': 'E48-SCREEN', 'p-role': 'degradation', 'p-target': 'BRD4', 'p-cell': 'HEK293', 'p-time': '6' };
  await runWith(fields);
  await pg.waitForTimeout(1600);
  const a = await E(async () => { await _hxLoad(); const id = window._analysisId, run = _hx.runs[id];
    const recs = _screenRecords();
    return { screens: window._runScreens, stored: run && run.screens, setId: run && run.setId, id, nRuns: Object.values(_hx.runs).filter(x => run && x.setId === run.setId).length, reruns: run && run.reruns,
      rowsOK: recs.every(x => x.Role === 'degradation' && x.Target === 'BRD4' && x.Cell_Line === 'HEK293' && x.Timepoint_h === 6 && x.Set_ID === run.setId && x.Run_ID === id) }; });
  const want = { panel: 0, assayType: 'hibit', role: 'degradation', target: 'BRD4', cellLine: 'HEK293', timepointH: 6, prefix: '' };
  check('E48', 'the run carries the screen\'s role, target, cell line and time point', JSON.stringify(a.screens) === JSON.stringify([want]), a.screens);
  check('E48', 'the History run keeps them, and every Screen row repeats them with the run identity', JSON.stringify(a.stored) === JSON.stringify([want]) && a.rowsOK, a);
  await runWith(Object.assign({}, fields, { 'p-target': 'BRD4-corrected' }));
  await pg.waitForTimeout(1600);
  const b = await E(async () => { await _hxLoad(); const run = _hx.runs[window._analysisId]; return { nRuns: Object.values(_hx.runs).filter(x => x.setId === run.setId).length, target: run.screens && run.screens[0] && run.screens[0].target, reruns: run.reruns }; });
  check('E48', 'correcting a target name is not a new version: same run, updated', b.nRuns === a.nRuns && b.target === 'BRD4-corrected', { a: a.nRuns, b });
  const c = await E(async () => { const id = window._analysisId; window._runScreens = null; await loadHistoryEntry(id); await new Promise(r => setTimeout(r, 200)); return window._runScreens; });
  check('E48', 'opening the run from History brings the screen back', c && c[0] && c[0].target === 'BRD4-corrected' && c[0].cellLine === 'HEK293', c);
  const d = await E(() => ({ ctg: _screenMeta(0, 'ctg', '', '', '', ''), hib: _screenMeta(0, 'hibit', '', '', '', ''), t1: _screenMeta(0, 'hibit', '', '', '', '6,5').timepointH, t2: _screenMeta(0, 'hibit', '', '', '', 'abc').timepointH, t3: _screenMeta(0, 'hibit', 'rescue', ' BRD2 ', '', '').target }));
  check('E48', 'the role defaults from the assay type; a time point is a number or nothing', d.ctg.role === 'viability' && d.hib.role === 'degradation' && d.t1 === 6.5 && d.t2 === null && d.t3 === 'BRD2', d);
});

if (run('E49')) await guard('E49', async () => {
  await BACK_TO_ANALYSIS();
  await runWith({ 'p-assay': 'E49-NF' });
  const clean = await E(() => (window._notFitted || []).length);
  const victim = await E(() => { const r = _lastResultsData[0]; const per = {}; r._reps.forEach(p => { const k = p.x.toFixed(4); per[k] = (per[k] || 0) + 1; });
    // keep the highest concentrations only while their readings add up to three: Echo counts READINGS (replicate wells), not concentrations, so four readings is a fit
    const xs = Object.keys(per).map(Number).sort((a, b) => b - a); let n = 0, drop = []; xs.forEach(x => { const c = per[x.toFixed(4)]; if (n + c <= 3) n += c; else drop.push(x); });
    return { key: r.Sample_ID + '||' + r.Protein, sid: r.Sample_ID, grp: r.Protein, drop, kept: n }; });
  const r = await E(async (v) => {
    window._pendingQcOverrides = JSON.stringify({ [v.key]: { excludedPts: v.drop.map(x => ({ x })) } });
    _lastResultsData = null; await runPipeline();
    await new Promise(r => setTimeout(r, 1600)); await _hxLoad();
    const id = window._analysisId, blob = await _hxBlob(id), recs = _screenRecords();
    const nf = (window._notFitted || []).find(n => n.compound === v.sid && n.group === v.grp);
    const row = recs.find(x => x.Compound === v.sid && x.Group === v.grp);
    window._notFitted = null; await loadHistoryEntry(id); await new Promise(r => setTimeout(r, 200));
    return { nf, inFit: _lastResultsData.some(x => x.Sample_ID === v.sid && x.Protein === v.grp), stored: blob && (blob.notFitted || []).some(n => n.compound === v.sid), row: row && { st: row.Fit_Status, pot: row.Potency_nM, fl: row.Flag_Reason }, restored: (window._notFitted || []).some(n => n.compound === v.sid) };
  }, victim);
  check('E49', 'a clean run lists no compound as not fitted', clean === 0, clean);
  check('E49', 'a compound left with three readings is listed (few-points) and has no curve', r.nf && r.nf.why === 'few-points' && r.inFit === false, r);
  check('E49', 'it is a row of its own in the Screen export, with no potency', r.row && r.row.st === 'few-points' && r.row.pot === null && /Not fitted/.test(r.row.fl), r);
  check('E49', 'it is kept in History and restored from it', r.stored === true && r.restored === true, r);
  await runWith({});   // leave the page as the next test expects it
});

// E50 — a right-click on the curve does what its menu says, to the replicate it says. Found 2026-10-07 on the bundled data:
// "Exclude this replicate" matched ANY replicate of the concentration within 0.1 of its reading, so where two replicates
// read alike (12 of 256) one click left out both; the menu was a list of two identical-looking rows, then a second menu;
// a hook ✕ was drawn and unreachable; and nothing said what the click had done to the fit.
if (run('E50')) await guard('E50', async () => {
  await E(() => { document.querySelector('[data-tab="curves"]').click(); });
  await pg.waitForTimeout(400);
  await E(() => { setCvMode('single'); window._cvCfg.showReps = true; });
  await pg.waitForTimeout(400);
  const rowsOf = () => E(() => document.getElementById('cv-compound')._filtered.length);
  const nRows = await rowsOf();
  // a. leaving out one replicate leaves out one — every replicate of the curves that have two that read alike, and of a few that do not
  const bad = await E(() => {
    const out = [], list = document.getElementById('cv-compound')._filtered;
    const alike = r => { const reps = (r._repsOrig || r._reps || []).filter(p => p.y != null); return reps.some((p, i) => reps.some((q, j) => j !== i && Math.abs(p.x - q.x) < 0.002 && Math.abs(p.y - q.y) < 0.1)); };
    const pick = list.filter(alike).slice(0, 10).concat(list.filter(r => !alike(r)).slice(0, 3));
    pick.forEach(r => {
      const reps = (r._repsOrig || r._reps || []).filter(p => p.y != null && isFinite(p.y)).map(p => ({ x: p.x, y: p.y }));
      reps.forEach(p => {
        const n0 = r._reps.length;
        cvExcludeRepXY(p.x, p.y, r);
        const n1 = r._reps.length;
        if (n1 !== n0 - 1) out.push(r.Sample_ID + '·' + r.Protein + ' x=' + p.x.toFixed(2) + ' y=' + p.y.toFixed(2) + ': ' + n0 + '→' + n1);
        cvRestoreAll(r);
      });
    });
    _CV_UNDO.length = 0; _CV_REDO.length = 0;
    return { checked: pick.length, bad: out };
  });
  check('E50', 'leaving out one replicate removes exactly one, for every replicate of ' + bad.checked + ' curves (incl. replicates that read alike)', bad.checked >= 8 && bad.bad.length === 0, bad.bad.slice(0, 5));
  // b. replicates that read exactly the same are two points: two exclusions take both, a third is refused, one put back returns one
  const same = await E(() => {
    const r = document.getElementById('cv-compound')._filtered[0], snap = [[r, _cvSnapRow(r)], [_cvTwin(r), _cvSnapRow(_cvTwin(r))]];
    const xs = {}; r._reps.forEach(p => { (xs[p.x.toFixed(4)] = xs[p.x.toFixed(4)] || []).push(p); });
    const pair = Object.values(xs).find(a => a.length >= 2); pair[1].y = pair[0].y;
    delete r._repsOrig; _cvApplyEditsAndRefit(r);
    const x = pair[0].x, y = pair[0].y, n0 = r._reps.length, o = {};
    cvExcludeRepXY(x, y, r); o.one = r._reps.length - n0;
    cvExcludeRepXY(x, y, r); o.two = r._reps.length - n0;
    cvExcludeRepXY(x, y, r); o.three = r._reps.length - n0; o.entries = (r._excludedRepXYs || []).length;
    cvReincludeRepXY(x, y, r); o.back = r._reps.length - n0;
    snap.forEach(([a, s]) => _cvRestoreRow(a, s)); delete r._repsOrig; delete r._excludedRepXYs; delete r._deletedPts; _CV_UNDO.length = 0; _CV_REDO.length = 0;
    return o;
  });
  check('E50', 'replicates that read exactly the same are two points: one click takes one, two take both, a third is refused', same.one === -1 && same.two === -2 && same.three === -2 && same.entries === 2, same);
  check('E50', 'putting one back returns one', same.back === -1, same);
  // c. the menu: every replicate at the concentration, with its reading, and the whole concentration with its count — from a replicate and from the mean
  const probe = async mode => {
    await E(m => { window._cvCfg.showReps = (m === 'reps'); document.getElementById('cv-compound').selectedIndex = 1; renderCvCurve(); }, mode); await pg.waitForTimeout(600);
    const t = await E(m => {
      const cv = document.getElementById('cv-canvas'), rc = cv.getBoundingClientRect(), r = cv._cvCompounds[0];
      const xs = {}; r._reps.forEach(p => { (xs[p.x.toFixed(4)] = xs[p.x.toFixed(4)] || []).push(p); });
      const grp = Object.values(xs).find(a => a.length >= 2 && !(r._hook_concs || []).some(h => Math.abs(h - a[0].x) < 0.002)), x = grp[0].x;
      const e = window._cvPtMap.find(p => p.r === r && Math.abs(p.x - x) < 0.002 && (m === 'reps' ? p.isRep : p.isMean));
      return { x: rc.left + e.px, y: rc.top + e.py, ys: grp.map(p => p.y), n: grp.length, ex: grp[0].x };
    }, mode);
    await pg.mouse.click(t.x, t.y, { button: 'right' }); await pg.waitForTimeout(250);
    const txt = await E(() => { const ms = [...document.querySelectorAll('div[role="menu"]')]; return { count: ms.length, text: ms.length ? ms[ms.length - 1].innerText.replace(/\s+/g, ' ') : '' }; });
    return { t, txt };
  };
  for (const mode of ['reps', 'mean']) {
    const { t, txt } = await probe(mode);
    check('E50', (mode === 'reps' ? 'from a replicate' : 'from the mean ± SD dot') + ': the menu lists each of the ' + t.n + ' replicates by its reading and "Exclude all ' + t.n + ' replicates"',
      txt.count === 1 && t.ys.every(y => txt.text.includes(y.toFixed(1))) && new RegExp('Exclude all ' + t.n + ' replicates').test(txt.text) && !/Which point/.test(txt.text), { t, txt });
    await E(() => _cvCloseCtx());
  }
  await E(() => { window._cvCfg.showReps = true; renderCvCurve(); }); await pg.waitForTimeout(500);
  // d. pointing at a row rings the points it is about; leaving, or closing the menu, takes the rings away
  const { t } = await probe('reps');
  const ringN = () => E(() => document.querySelectorAll('#cv-hl span').length);
  await pg.locator('div[role="menu"] [role="menuitem"]').first().hover(); await pg.waitForTimeout(150);
  const one = await ringN();
  await pg.locator('div[role="menu"] [role="menuitem"]', { hasText: 'Exclude all' }).hover(); await pg.waitForTimeout(150);
  const all = await ringN();
  check('E50', 'pointing at "Exclude the … replicate" rings that one point; at "Exclude all N" rings all N', one === 1 && all === t.n, { one, all, n: t.n });
  const where = await E(() => { const s = document.querySelector('#cv-hl span'); const r = s && s.getBoundingClientRect(), cv = document.getElementById('cv-canvas').getBoundingClientRect(); return r && { cx: r.left + r.width / 2 - cv.left, cy: r.top + r.height / 2 - cv.top, map: window._cvPtMap.filter(p => p.isRep).map(p => [p.px, p.py]) }; });
  check('E50', 'a ring sits on a drawn point (within a pixel)', !!where && where.map.some(([px, py]) => Math.abs(px - where.cx) < 1 && Math.abs(py - where.cy) < 1), where && { cx: where.cx, cy: where.cy });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  check('E50', 'closing the menu takes the rings away', (await ringN()) === 0 && !(await E(() => !!document.querySelector('div[role="menu"]'))));
  // e. ↓ moves into the rows
  await pg.mouse.click(t.x, t.y, { button: 'right' }); await pg.waitForTimeout(250);
  await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(100);
  check('E50', '↓ moves the focus to the first row', await E(() => document.activeElement && document.activeElement.getAttribute('role') === 'menuitem'));
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  // f. the click says what it did to the curve
  const toast = await E(() => document.getElementById('echo-toast') && document.getElementById('echo-toast').textContent);
  check('E50', 'after the click a line says what was left out, what the potency did, and how to undo it', /Excluded one replicate/.test(toast || '') && /(DC50|IC50|EC50) .* (→|\(unchanged\))/.test(toast || '') && /(⌘Z|Ctrl\+Z) to undo/.test(toast || ''), toast);
  await E(() => { cvRestoreAll(); _CV_UNDO.length = 0; _CV_REDO.length = 0; });
  // g. a hook ✕ is not a dead spot
  const hk = await E(() => {
    const sel = document.getElementById('cv-compound'), i = sel._filtered.findIndex(r => r._is_hook);
    if (i < 0) return null; sel.selectedIndex = i; renderCvCurve(); return i;
  });
  if (hk === null) skipped.push('E50 — no curve with a hook in this data');
  else {
    await pg.waitForTimeout(600);
    const h = await E(() => { const cv = document.getElementById('cv-canvas'), rc = cv.getBoundingClientRect(), p = window._cvPtMap.find(q => q.isHook); return p && { x: rc.left + p.px, y: rc.top + p.py }; });
    check('E50', 'a hook ✕ is in the hit map', !!h);
    if (h) {
      await pg.mouse.click(h.x, h.y, { button: 'right' }); await pg.waitForTimeout(250);
      const txt = await E(() => { const m = [...document.querySelectorAll('div[role="menu"]')].pop(); return m ? m.innerText.replace(/\s+/g, ' ') : ''; });
      check('E50', 'right-click on it says it is a hook effect, already left out, and offers to include it', /hook effect/i.test(txt) && /Include the hook concentrations in the fit/.test(txt), txt);
      await E(() => _cvCloseCtx());
    }
  }
  // h. near a point: the nearest one, said so; far from every point: say that, not a menu of nothing
  await E(() => { document.getElementById('cv-compound').selectedIndex = 1; renderCvCurve(); }); await pg.waitForTimeout(600);
  const spots = await E(() => {
    const cv = document.getElementById('cv-canvas'), rc = cv.getBoundingClientRect(), L = cv._cvLay, m = window._cvPtMap;
    const d = (x, y) => Math.min(...m.map(p => Math.hypot(p.px - x, p.py - y)));
    let far = null, near = null;
    for (let x = L.pL + 20; x < L.pL + L.pw - 20 && !far; x += 25) for (let y = L.pT + 20; y < L.pT + L.ph - 20 && !far; y += 25) if (d(x, y) > 80) far = { x: rc.left + x, y: rc.top + y };
    const p = m.find(q => q.isRep);
    for (const [dx, dy] of [[26, 0], [-26, 0], [0, 26], [0, -26]]) { if (!near && Math.abs(d(p.px + dx, p.py + dy) - 26) < 1.5) near = { x: rc.left + p.px + dx, y: rc.top + p.py + dy }; }
    return { far, near };
  });
  if (spots.near) { await pg.mouse.click(spots.near.x, spots.near.y, { button: 'right' }); await pg.waitForTimeout(250); check('E50', 'a click a little off a point opens the nearest one’s menu and says it is the nearest', await E(() => /Nearest point/.test([...document.querySelectorAll('div[role="menu"]')].pop()?.innerText || '')), spots.near); await E(() => _cvCloseCtx()); }
  if (spots.far) { await pg.mouse.click(spots.far.x, spots.far.y, { button: 'right' }); await pg.waitForTimeout(250); check('E50', 'a click far from every point says there is no point there', await E(() => /No data point here/.test([...document.querySelectorAll('div[role="menu"]')].pop()?.innerText || '')), spots.far); await E(() => _cvCloseCtx()); }
  // i. the Plate tab is the same: right-clicking one of two wells that read alike leaves out that well and not the other
  const plate = await E(() => {
    const out = { found: false };
    for (const bc of Object.keys(window._plateData)) {
      const wells = window._plateData[bc], ids = Object.keys(wells).filter(k => _plIsCpd(wells[k]) && wells[k].c != null && wells[k].m != null && _plFit(wells[k].s, wells[k].p, bc));
      for (const a of ids) for (const b of ids) {
        if (a >= b) continue; const wa = wells[a], wb = wells[b];
        if (wa.s === wb.s && wa.p === wb.p && Math.abs(wa.c - wb.c) < 0.002 && Math.abs(wa.m - wb.m) < 0.1 && Math.abs(wa.m - wb.m) > 0.0005) {
          const r = _plFit(wa.s, wa.p, bc), n0 = r._reps.length;
          plateToggleExclude(bc, a[0], +a.slice(1));
          out.found = true; out.n = r._reps.length - n0; out.first = _plExcluded(bc, wa); out.second = _plExcluded(bc, wb); out.pair = [bc, a, b, wa.m, wb.m];
          plateToggleExclude(bc, a[0], +a.slice(1)); out.restored = r._reps.length - n0;
          _CV_UNDO.length = 0; _CV_REDO.length = 0; return out;
        }
      }
    }
    return out;
  });
  if (!plate.found) skipped.push('E50 — no two wells that read alike in the Plate data');
  else check('E50', 'Plate tab: right-click one of two wells that read alike leaves out that curve point only, and the same click puts it back', plate.n === -1 && plate.first === true && plate.second === false && plate.restored === 0, plate);
  await E(() => { window._cvCfg.showReps = true; cvRestoreAll(document.getElementById('cv-canvas')._cvCompounds[0]); _CV_UNDO.length = 0; _CV_REDO.length = 0; });
  void nRows;
});

// E51 — a plate is found by its barcode being IN its reader file's name, not by the two being equal. A reader file
// named after the run (HB20260504_P1_144h.xlsx) against the barcode HB20260504_P1 matched nothing ("Merge = 0 rows"),
// and so did "Plate 3.xlsx" for PLATE-03, or a reader that carries no ID inside it at all. Names are matched in
// stages (exact · same words · barcode inside the file name · file name inside the barcode · the barcode written in
// the sheet), a pairing two candidates want equally is NOT made, an intermediate plate is never guessed, and what
// is paired keeps the Echo barcode as its name, so groups work as ever. A picklist with no Destination Plate Barcode is named by its
// Destination Plate Name. Proven by putting each rule's bug back.
if (run('E51')) await guard('E51', async () => {
  const R = await E(() => {
    const P = (...names) => names.map(n => ({ key: n.toLowerCase(), name: n, inter: /inter|dilution|source|prefill/i.test(n) }));
    const F = (...stems) => stems.map(s => ({ file: s + '.xlsx', stem: s }));
    const res = (plates, files, assign) => { const r = _resolvePlates(plates, files, { assign }); return { m: Object.fromEntries([...r.byPlate].map(([k, v]) => [k, v.stem + ':' + v.how])), amb: r.ambiguous.length, leftF: r.leftFiles.map(f => f.stem), leftP: r.leftPlates.map(p => p.name) }; };
    const o = {};
    o.exact = res(P('BRD2-01', 'BRD2-02'), F('BRD2-01', 'brd2-02'));
    o.decorated = res(P('BRD2-01', 'BRD2-02', 'BRD3-01'), F('BRD2-01_144h', 'brd2_02 (reread)', 'E5XX BRD3-01 read'));
    o.spelled = res(P('BRD3-02'), F('brd3_02'));
    o.zeros = res(P('PLATE-03'), F('Plate 3'));
    o.inPlate = res(P('HB20260504_P1', 'HB20260504_P11'), F('P1'));
    o.prefix = res(P('P1'), F('P12'));
    o.ambig = res(P('P1'), F('P1_24h', 'P1_72h'));
    o.inter = res(P('Intermediate Sample Plate[1]', 'P1'), F('read Intermediate Sample Plate 1', 'P1_144h'));
    o.single = res(P('A'), F('A_plate'));
    o.shortNum = res(P('1', '2'), F('plate 1', 'plate 2'));
    o.oneEach = res(P('P1', 'HB_P1'), F('HB_P1_read'));
    o.manual = res(P('BRD2-01', 'BRD2-02'), F('scan0007', 'scan0008'), { 'brd2-02': 'scan0007.xlsx' });
    o.manualBeatsName = res(P('P1', 'P2'), F('P1_read', 'P2_read'), { p1: 'P2_read.xlsx' });
    const withTxt = (stems, txt) => stems.map(s => ({ file: s + '.xlsx', stem: s, texts: txt[s] }));
    const pl = P('BRD2-01', 'BRD2-02');
    o.noSheet = _resolvePlates(pl, withTxt(['scan0007'], {}), {}).byPlate.size;
    o.sheet = (() => { const r = _resolvePlates(pl, withTxt(['scan0007'], { scan0007: ['Protocol', 'ID1: BRD2-01', 'Date'] }), {}); return [...r.byPlate].map(([k, v]) => k + ':' + v.how); })();
    o.sheetGeneric = (() => { const r = _resolvePlates(P('A'), withTxt(['scan'], { scan: ['Plate A', 'A'] }), {}); return r.byPlate.size; })();
    o.tok = [_plTok('Plate 03'), _plTok('PLATE-3'), _plTok('plate3'), _plTok('HB20260504_P1_144h')].map(t => t.join('|'));
    // naming: the file only identifies the plate — its readings are filed under the Echo barcode; an exact match and an unpaired file are untouched
    const wells = [{ barcode: 'P1', barcodeKey: 'p1' }, { barcode: 'BRD2-01', barcodeKey: 'brd2-01' }, { barcode: 'loose', barcodeKey: 'loose' }];
    const r2 = _resolvePlates(P('HB_P1', 'BRD2-01'), F('P1', 'BRD2-01', 'loose'), {});
    _applyPlateNames(wells, r2.byPlate);
    o.rename = wells.map(w => w.barcode + '/' + w.barcodeKey);
    return o;
  });
  check('E51', 'exact names pair exactly, in any case — nothing is renamed', R.exact.m['brd2-01'] === 'BRD2-01:exact' && R.exact.m['brd2-02'] === 'brd2-02:exact' && !R.exact.leftF.length, R.exact);
  check('E51', 'a file named after the run, a spelling variant and extra words around the barcode are all found', R.decorated.m['brd2-01'] === 'BRD2-01_144h:in-file' && R.decorated.m['brd2-02'] === 'brd2_02 (reread):in-file' && R.decorated.m['brd3-01'] === 'E5XX BRD3-01 read:in-file' && !R.decorated.leftP.length, R.decorated);
  check('E51', 'Plate 3 is PLATE-03 (leading zeros, spaces and dashes do not matter)', R.zeros.m['plate-03'] === 'Plate 3:same' && R.spelled.m['brd3-02'] === 'brd3_02:same' && JSON.stringify(R.tok) === JSON.stringify(['plate|3', 'plate|3', 'plate|3', 'hb|20260504|p|1|144|h']), { z: R.zeros, tok: R.tok });
  check('E51', 'a file named P1 is the plate HB20260504_P1 and not HB20260504_P11', R.inPlate.m['hb20260504_p1'] === 'P1:in-plate' && !R.inPlate.m['hb20260504_p11'], R.inPlate);
  check('E51', 'P12 is not P1 (words, not letters)', !Object.keys(R.prefix.m).length, R.prefix);
  check('E51', 'two files that both look like plate P1 pair with neither, and say so', !Object.keys(R.ambig.m).length && R.ambig.amb === 1 && R.ambig.leftF.length === 2, R.ambig);
  check('E51', 'an intermediate plate is never guessed from a file name', !R.inter.m['intermediate sample plate[1]'] && R.inter.m['p1'] === 'P1_144h:in-file', R.inter);
  check('E51', 'a one-letter or one-digit barcode is not found inside file names', !Object.keys(R.single.m).length && !Object.keys(R.shortNum.m).length, { s: R.single, n: R.shortNum });
  check('E51', 'one file reads one plate, and the more specific barcode wins', R.oneEach.m['hb_p1'] === 'HB_P1_read:in-file' && !R.oneEach.m['p1'], R.oneEach);
  check('E51', 'a file chosen by hand pairs with its plate, beats the name match, and the other plate still pairs by name', R.manual.m['brd2-02'] === 'scan0007:manual' && R.manualBeatsName.m.p1 === 'P2_read:manual' && R.manualBeatsName.m.p2 === undefined, { m: R.manual, b: R.manualBeatsName });
  check('E51', 'a barcode written inside the sheet places a file the name could not — and only then', R.noSheet === 0 && R.sheet.length === 1 && R.sheet[0] === 'brd2-01:sheet' && R.sheetGeneric === 0, { noSheet: R.noSheet, sheet: R.sheet, g: R.sheetGeneric });
  check('E51', 'a paired file’s readings are filed under the Echo barcode (HB_P1); an exact match and a file nothing paired keep their own names', JSON.stringify(R.rename) === JSON.stringify(['HB_P1/hb_p1', 'BRD2-01/brd2-01', 'loose/loose']), R.rename);

  // The whole run: the six bundled reader files, renamed as a person would, give the same curves as when the names are exact.
  const run1 = await E(async () => {
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const snap = () => Object.fromEntries(_lastResultsData.map(r => [r.Protein + '|' + r.Sample_ID, r.DC50_nM + '|' + r.Dmax_pct]));
    loadTestData(); await new Promise(r => setTimeout(r, 400));
    document.getElementById('p-assay').value = 'E51-exact'; document.getElementById('p-ctrl').value = 'B12-O12';
    _lastResultsData = null; await runPipeline();
    const base = snap(), plates0 = Object.keys(window._plateData || {}).sort();
    const fancy = { 'BRD2-01.xlsx': 'EDA20260504_BRD2-01_144h.xlsx', 'BRD2-02.xlsx': 'brd2_02 (reread).xlsx', 'BRD3-01.xlsx': 'BRD3-01 read 2.xlsx', 'BRD3-02.xlsx': 'brd3_02.xlsx', 'BRD4-01.xlsx': 'BRD4-01_p.xlsx', 'BRD4-02.xlsx': 'BRD4-02.xls.xlsx' };
    const nf = {}; _TEST_READERS.forEach(r => { const n = fancy[r.name]; nf[n] = _b64toFile(r.b64, n, mime); });
    readerFiles = nf; window._plateAssign = {};
    document.getElementById('p-assay').value = 'E51-renamed';
    document.getElementById('p-group-mode').value = 'first'; onGroupModeChange();   // the rule of the exact run: the plates are still called BRD2-01 …
    _lastResultsData = null; await runPipeline();
    const ren = _lastResultsData ? snap() : null, plates1 = Object.keys(window._plateData || {}).sort(), map = window._plateMap || [];
    const log = document.getElementById('log-panel').innerText;
    // the same files, by hand: one plate whose file the names cannot place
    const o = Object.assign({}, nf); const odd = (() => {
      // the same readings as BRD2-01 in a bare sheet: row letters, column numbers and no ID anywhere in it
      const w = _parsePHERAstarXLS(Uint8Array.from(atob(_TEST_READERS[0].b64), c => c.charCodeAt(0)).buffer, 'x', ''), L = 'ABCDEFGHIJKLMNOP'.split('');
      const aoa = [['', ...Array.from({ length: 24 }, (_, i) => i + 1)]]; L.forEach((l, ri) => aoa.push([l, ...Array.from({ length: 24 }, (_, ci) => { const m = w[ri * 24 + ci].measurement; return m === null ? '' : m; })]));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Data');
      return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], 'scan0007.xlsx', { type: mime });
    })(); delete o['EDA20260504_BRD2-01_144h.xlsx']; o['scan0007.xlsx'] = odd;
    readerFiles = o; window._plateAssign = {};
    const rv0 = await echoReview();
    window._plateAssign = { 'brd2-01': 'scan0007.xlsx' };
    const rv1 = await echoReview();
    window._plateAssign = {}; readerFiles = nf;
    // the group preview in Setup names plates as the run will: BRD2 · BRD3 · BRD4, not one group per decorated file name
    const gp = await (async () => { document.getElementById('setup-modal')?.classList.remove('hidden'); await renderReview(); const t = document.getElementById('p-group-preview').innerText; document.getElementById('setup-modal')?.classList.add('hidden'); return t; })();
    return { gp, same: ren && Object.keys(base).length === Object.keys(ren).length && Object.keys(base).every(k => ren[k] === base[k]), nBase: Object.keys(base).length, nRen: ren ? Object.keys(ren).length : 0, plates0, plates1,
      how: map.map(m => m.how).sort(), logHas: /plate “BRD2-01” \(the file name contains the plate barcode\)/.test(log), logHasSame: /plate “BRD3-02” \(same name, spelled differently\)/.test(log),
      rv0: { err: rv0.issues.filter(i => i.level === 'error').length, free: rv0.freeFiles, nofile: rv0.plates.filter(p => !p.file && !p.inter).map(p => p.plate) },
      rv1: { err: rv1.issues.filter(i => i.level === 'error').length, how: (rv1.plates.find(p => p.key === 'brd2-01') || {}).how, plate: (rv1.plates.find(p => p.key === 'brd2-01') || {}).plate },
      rvHtml: await (async () => { readerFiles = o; window._plateAssign = {}; document.getElementById('setup-modal')?.classList.remove('hidden'); await renderReview(); const h = document.getElementById('rv-body').innerHTML; document.getElementById('setup-modal')?.classList.add('hidden'); return /class="rv-pick"/.test(h); })() };
  });
  check('E51', 'six reader files renamed with run names, spellings and extra words give exactly the curves — and groups — of the exact names', run1.same && run1.nBase > 0 && run1.nBase === run1.nRen, { base: run1.nBase, ren: run1.nRen });
  check('E51', 'the group preview in Setup names the plates as the run does: 3 groups (BRD2, BRD3, BRD4)', /3 groups/.test(run1.gp) && /BRD2/.test(run1.gp) && !/reread|scan|EDA2026/.test(run1.gp), run1.gp);
  check('E51', 'the plates keep their Echo barcodes in the Plate tab data (the same names as the exact run), and the run says how each file was found', JSON.stringify(run1.plates1) === JSON.stringify(run1.plates0) && run1.how.length === 6 && run1.how.filter(h => h === 'in-file').length === 5 && run1.how.includes('same') && run1.logHas && run1.logHasSame, { p0: run1.plates0, p1: run1.plates1, how: run1.how });
  check('E51', 'Review: a plate no file name can place is an error that offers the loose files; choosing one clears it and says it was chosen by hand', run1.rv0.err >= 1 && run1.rv0.nofile.includes('BRD2-01') && run1.rv0.free.includes('scan0007.xlsx') && run1.rv1.err === 0 && run1.rv1.how === 'manual' && run1.rv1.plate === 'BRD2-01' && run1.rvHtml, { rv0: run1.rv0, rv1: run1.rv1, rvHtml: run1.rvHtml });
  // a picklist with no barcode column value: the Destination Plate Name is the plate
  const nb = await E(() => {
    const txt = new TextDecoder().decode(Uint8Array.from(atob(_TEST_ECHO_B64), c => c.charCodeAt(0)));
    const lines = txt.split(/\r?\n/), hi = lines.findIndex(l => /destination.*well/i.test(l)), hd = lines[hi].split(',');
    const bi = hd.findIndex(h => /^destination plate barcode$/i.test(h)), ni = hd.findIndex(h => /^destination plate name$/i.test(h));
    const conv = (fn) => lines.map((l, i) => { if (i <= hi || !l.trim()) return l; const c = l.split(','); if (c.length <= Math.max(bi, ni)) return l; fn(c); return c.join(','); }).join('\n');
    const plates = t => { try { const d = _parseEchoCSV(t, 8); return { n: d.length, p: [...new Set(d.map(x => x.barcode))].sort() }; } catch (e) { return { err: e.message.slice(0, 120) }; } };
    const base = plates(txt);
    const named = plates(conv(c => { c[ni] = c[bi].replace('INTER', 'Intermediate Sample Plate[1]'); c[bi] = ''; }));
    const dropped = (() => { const hd2 = hd.filter((_, i) => i !== bi); const t = lines.map((l, i) => { if (i < hi || !l.trim()) return l; const c = l.split(','); if (i === hi) return hd2.join(','); c[ni] = c[bi]; c.splice(bi, 1); return c.join(','); }).join('\n'); return plates(t); })();
    const both = plates(conv(c => { c[bi] = ''; c[ni] = ''; }));
    return { base, named, dropped, both };
  });
  check('E51', 'a picklist whose barcodes are blank takes the plates from Destination Plate Name — the same transfers, the same plates', !nb.named.err && nb.named.n === nb.base.n && nb.named.p.length === nb.base.p.length && nb.named.p.includes('BRD2-01'), nb);
  check('E51', 'a picklist with no barcode column at all reads too; one with neither barcode nor name is refused, not read as empty', !nb.dropped.err && nb.dropped.n === nb.base.n && (nb.both.err || nb.both.n === 0), nb);
  await runWith({});   // leave the page as the next test expects it
});

if (run('E52')) await guard('E52', async () => {
  // A database called echo_history can exist WITHOUT Echo's four stores (anything that opened it with no version and no
  // abort leaves an empty v1). Echo's own open then never ran its upgrade and EVERY save failed with "object stores was
  // not found". It must repair itself, keep whatever is already there, and keep an analysis across a reload.
  const mk = async (stores, rec) => { const c = await browser.newContext({ viewport: { width: 1200, height: 800 } }); const q = await c.newPage(); const errs = []; q.on('pageerror', e => errs.push(String(e.message || e)));
    await q.goto('file://' + FILE); await q.waitForTimeout(500);
    await q.evaluate(() => new Promise(r => { const d = indexedDB.deleteDatabase('echo_history'); d.onsuccess = d.onerror = d.onblocked = () => r(); }));
    await q.goto('about:blank');
    const q2 = await c.newPage(); await q2.goto('file://' + path.join(ROOT, 'apps/cuppa/cuppa.html')); await q2.waitForTimeout(300);   // any page that is not Echo: it plants the broken database on the same origin
    return { c, q2, errs };
  };
  for (const scenario of ['empty', 'partial']) {
    const { c, q2 } = await mk();
    // plant the broken database from a page that is not running Echo's History yet
    await q2.evaluate(async sc => { window.__noHx = 1; await new Promise(r => { const rq = indexedDB.open('echo_history'); rq.onsuccess = () => { rq.result.close(); r(); }; }); if (sc === 'partial') { await new Promise(r => { const rq = indexedDB.open('echo_history', 2); rq.onupgradeneeded = () => { const d = rq.result; d.createObjectStore('runs', { keyPath: 'id' }).put({ id: 7, setId: 'n:keepme', assayId: 'KeepMe', ts: 7, ver: 1, n: 1, nFlag: 0, groups: 'G', nCompounds: 1 }); }; rq.onsuccess = () => { rq.result.close(); r(); }; }); } }, scenario);
    await q2.goto('about:blank'); await q2.goto('file://' + FILE); await q2.waitForTimeout(1500);
    const pre = await q2.evaluate(() => _hxLoad().then(() => ({ broken: _hxBroken && _hxBroken.message, runs: Object.keys(_hx.runs).map(Number) })));
    check('E52', scenario + ': a database with missing stores opens (History is not "broken")', !pre.broken, pre);
    if (scenario === 'partial') check('E52', 'partial: a run already stored survives the repair', pre.runs.includes(7), pre);
    await q2.evaluate(() => loadTestData()); await q2.waitForTimeout(1500);
    await q2.evaluate(() => { document.getElementById('p-assay').value = 'E52SAVE'; return runPipeline(); }); await q2.waitForTimeout(3500);
    const a = await q2.evaluate(() => ({ broken: _hxBroken && _hxBroken.message, sets: Object.keys(_hx.sets) }));
    check('E52', scenario + ': an analysis is saved to History', !a.broken && a.sets.includes('n:e52save'), a);
    await q2.reload({ waitUntil: 'load' }); await q2.waitForTimeout(2500);
    const b = await q2.evaluate(async () => { await _hxLoad(); const run = Object.values(_hx.runs).find(r => r.setId === 'n:e52save'); const blob = run && await _hxGet('blobs', run.id); return { broken: _hxBroken && _hxBroken.message, run: !!run, rows: blob && blob.data ? blob.data.length : 0, tab: document.getElementById('history-panel').textContent.includes('E52SAVE') }; });
    check('E52', scenario + ': after a reload the analysis, its results and its History row are still there', !b.broken && b.run && b.rows > 0 && b.tab, b);
    await c.close();
  }
});

if (run('E53')) await guard('E53', async () => {
  await E(() => document.querySelector('[data-tab="results"]').click()); await pg.waitForTimeout(300);
  const r = await E(() => {
    const bars = [...document.querySelectorAll('#results-panel .res-dl')];
    const lbls = bars.map(b => [...b.querySelectorAll('button')].map(x => x.textContent.trim()));
    const exp = _resExportItems().map(i => ({ l: i.label, f: String(i.act) }));
    const fnsOk = ['generateOutputXLSX', 'downloadScreenCsv', 'generateAndDownloadCurvePDFs', 'hxCompareFromResults', 'copyResultsTSV'].every(n => typeof window[n] === 'function');
    const raw = downloadBlobs.filter(b => /_Raw_Data\.csv$/.test(b.name));
    let wb = null; const realWrite = XLSX.write; XLSX.write = (w, o) => { wb = w; return realWrite.call(XLSX, w, o); };
    try { generateOutputXLSX(); } finally { XLSX.write = realWrite; }
    const sheet = wb && wb.Sheets['Raw data'] ? XLSX.utils.sheet_to_json(wb.Sheets['Raw data'], { header: 1, raw: true }) : null;
    const csv = raw.length ? new TextDecoder().decode(raw[0].bytes).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map(l => l.split(',')) : null;
    let same = !!(sheet && csv && sheet.length === csv.length);
    if (same) for (let i = 1; i < csv.length && same; i++) for (let k = 0; k < csv[i].length; k++) {
      const a = csv[i][k], b = sheet[i][k] == null ? '' : sheet[i][k];
      if (a === '' && b === '') continue;
      if (isFinite(+a) && a !== '' ? Math.abs(+a - +b) > 1e-9 * Math.max(1, Math.abs(+a)) : String(a) !== String(b)) { same = { i, k, a, b }; break; }
    }
    return { lbls, exp, fnsOk, rawN: raw.length, sheetN: sheet && sheet.length, csvN: csv && csv.length, same, sheets: wb && wb.SheetNames };
  });
  check('E53', 'one Results bar, reading Compare · Copy TSV · Export', r.lbls.length >= 1 && r.lbls.every(l => l.join('|') === 'Compare…|Copy TSV|Export'), r.lbls);
  check('E53', 'no Raw Data CSV or curve-PDF button in the bar', !r.lbls.flat().some(t => /Raw Data|curve PDFs|Results XLSX|Screen CSV/.test(t)), r.lbls);
  check('E53', 'Export lists the workbook, the Screen table and the curve PDFs', r.exp.map(x => x.l).join('|') === 'Results workbook (XLSX)|Screen table (CSV)|Curve PDFs', r.exp);
  check('E53', 'every action the bar reaches exists', r.fnsOk);
  check('E53', 'the workbook carries a "Raw data" sheet', (r.sheets || []).includes('Raw data'), r.sheets);
  check('E53', 'the Raw data sheet is the old CSV, row for row and cell for cell', r.same === true, { same: r.same, sheetN: r.sheetN, csvN: r.csvN });
  // inside a frame whose parent is the Hub, Send to lists only the apps that can take it
  const s2 = await E(() => { const save = window.parent; let items; try { Object.defineProperty(window, 'parent', { value: { APP_INFO: { hitfinder: 1, ribbon: 1 }, openApp() {} }, configurable: true }); items = _resSendItems().map(i => i.label); const bar = _resBar(); return { items, bar: /res-send-btn/.test(bar) }; } finally { Object.defineProperty(window, 'parent', { value: save, configurable: true }); } });
  check('E53', 'inside the Hub, Send to lists Labbook and Hit Finder', s2.bar && s2.items[0] === 'Labbook' && s2.items.includes('Hit Finder'), s2);
  const s3 = await E(() => ({ items: _resSendItems().length, bar: /res-send-btn/.test(_resBar()) }));
  check('E53', 'standalone there is no Send menu', s3.items === 0 && !s3.bar, s3);
});

if (run('E54')) await guard('E54', async () => {
  await E(() => { document.querySelector('[data-tab="scatter"]').click(); }); await pg.waitForTimeout(900);
  await E(() => { if (typeof switchPlotType === 'function') switchPlotType('scatter'); }); await pg.waitForTimeout(500);
  const r = await E(async () => {
    const set = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dataset.userSet = '1'; } return !!el; };
    const opt = id => [...(document.getElementById(id) || { options: [] }).options].map(o => o.value).filter(Boolean);
    const cb = opt('sc-colorby'), sb = opt('sc-sizeby');
    set('sc-colorby', cb.includes('R2') ? 'R2' : cb[0]); set('sc-sizeby', sb.includes('HillSlope') ? 'HillSlope' : sb[1] || sb[0]);
    set('sc-dmax-min', '30');
    set('sc-search', 'EDA-01');
    buildScatterChart();
    await new Promise(r => setTimeout(r, 200));
    const sx = scatterChart.scales.x, sy = scatterChart.scales.y;
    _zoomBounds = { xMin: sx.min + (sx.max - sx.min) * 0.05, xMax: sx.max - (sx.max - sx.min) * 0.05, yMin: sy.min, yMax: sy.max };
    applyZoom(); await new Promise(r => setTimeout(r, 150));
    const live = scatterChart, L = live.data.datasets.map(d => ({ label: d.label, bg: d.pointBackgroundColor, r: d.pointRadius, n: d.data.length }));
    const lx = [live.scales.x.min, live.scales.x.max], ly = [live.scales.y.min, live.scales.y.max];
    const pts = []; live.data.datasets.forEach((d, di) => { live.getDatasetMeta(di).data.forEach((el, i) => { if (isFinite(el.x) && el.x > live.chartArea.left + 4 && el.x < live.chartArea.right - 4 && el.y > live.chartArea.top + 4 && el.y < live.chartArea.bottom - 4) pts.push({ x: el.x, y: el.y, c: d.pointBackgroundColor[i] }); }); });
    const a = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
    try { await downloadScatterHiRes(); } finally { HTMLAnchorElement.prototype.click = a; }
    const X = window._scLastExport; if (!X) return { none: true };
    const c = X.canvas.getContext('2d'), scl = X.w / live.canvas.clientWidth;
    const parse = s => { const m = String(s).match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i); if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), m[2] ? parseInt(m[2], 16) / 255 : 1];
      const q = String(s).match(/rgba?\(([^)]+)\)/); if (q) { const v = q[1].split(',').map(Number); return [v[0], v[1], v[2], v[3] == null ? 1 : v[3]]; } return null; };
    let pixBad = 0, pixN = 0;
    pts.slice(0, 40).forEach(p => { const want = parse(p.c); if (!want) return; const d = c.getImageData(Math.round(p.x * scl), Math.round(p.y * scl), 1, 1).data;
      const exp = want.slice(0, 3).map(v => v * want[3] + 255 * (1 - want[3])); pixN++; if (exp.some((v, k) => Math.abs(v - d[k]) > 48)) pixBad++; });
    return { L, E: X.chart.datasets, lx, ly, ex: X.chart.x, ey: X.chart.y, ratioLive: live.canvas.clientWidth / live.canvas.clientHeight, ratioExp: X.w / X.h, pixN, pixBad, cb: document.getElementById('sc-colorby').value, sb: document.getElementById('sc-sizeby').value };
  });
  if (r.none) { check('E54', 'the export ran', false); return; }
  check('E54', 'colour-by and size-by were set for the test', !!r.cb && !!r.sb, r);
  check('E54', 'the same groups, with the same number of points', JSON.stringify(r.L.map(d => [d.label, d.n])) === JSON.stringify(r.E.map(d => [d.label, d.n])), { L: r.L.map(d => [d.label, d.n]), E: r.E.map(d => [d.label, d.n]) });
  check('E54', 'every point has the colour it has on screen', JSON.stringify(r.L.map(d => d.bg)) === JSON.stringify(r.E.map(d => d.bg)));
  check('E54', 'every point has the size it has on screen', JSON.stringify(r.L.map(d => d.r)) === JSON.stringify(r.E.map(d => d.r)));
  const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
  check('E54', 'the axes are the ones on screen (zoom included)', near(r.lx[0], r.ex[0]) && near(r.lx[1], r.ex[1]) && near(r.ly[0], r.ey[0]) && near(r.ly[1], r.ey[1]), r);
  check('E54', 'the picture has the shape of the plot on screen', Math.abs(r.ratioLive - r.ratioExp) < 0.02, r);
  check('E54', 'the pixel under each point is that point\'s colour', r.pixN >= 5 && r.pixBad <= Math.ceil(r.pixN * 0.1), { n: r.pixN, bad: r.pixBad });
  await E(() => { _zoomBounds = null; ['sc-colorby', 'sc-sizeby', 'sc-dmax-min', 'sc-search'].forEach(id => { const el = document.getElementById(id); if (el) { el.value = ''; delete el.dataset.userSet; } }); buildScatterChart(); });
});

if (run('E55')) await guard('E55', async () => {
  await E(() => { document.querySelector('[data-tab="scatter"]').click(); }); await pg.waitForTimeout(400);
  const r = await E(async () => {
    switchPlotType('selectivity');
    document.getElementById('sel-metric').value = 'potency'; document.getElementById('sel-show-flagged').checked = true; document.getElementById('sel-show-names').checked = true;
    buildSelectivityChart(); const thr = document.getElementById('sel-band-thr'); thr.value = '3'; buildSelectivityChart();
    await new Promise(r => setTimeout(r, 150));
    const D = SEL.last, L = SEL.L;
    // names: record every label box the painter places
    const boxes = []; const real = _placePointLabels;
    window._placePointLabels = function (ctx, pts, opt) { const ft = ctx.fillText.bind(ctx); const o = ctx.fillText; let mine = [];
      ctx.fillText = function (t, x, y) { const w = ctx.measureText(t).width; mine.push({ t, x, y, w }); return o.apply(this, arguments); };
      const h = real(ctx, pts, opt); ctx.fillText = o; boxes.push({ mine, area: opt.area, note: opt.noNote }); return h; };
    _selDraw(); window._placePointLabels = real;
    const lab = boxes[0] ? boxes[0].mine : [];
    const area = boxes[0] && boxes[0].area;
    const out = lab.filter(b => area && (b.x < area.left - 0.5 || b.x + b.w > area.right + 0.5)).length;
    let overlap = 0; for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) { const a = lab[i], b = lab[j]; if (a.x < b.x + b.w && a.x + a.w > b.x && Math.abs(a.y - b.y) < 9) overlap++; }
    const a = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {}; try { downloadSelHiRes(); } finally { HTMLAnchorElement.prototype.click = a; }
    const X = window._selLastExport;
    const px = X ? X.canvas.getContext('2d').getImageData(2, 2, 1, 1).data : null;
    const want = D.points.filter(p => p.dir !== 'neutral').map(p => p.label).sort().join();
    const listed = [...document.querySelectorAll('#sel-list .sel-row')].map(b => b.dataset.l).sort().join();
    const ys = [...document.querySelectorAll('#sel-list .sel-col')].map(c => [...c.querySelectorAll('.sel-fd')].map(e => parseFloat(e.textContent)));
    const sorted = ys.every(v => v.every((x, i) => i === 0 || v[i - 1] >= x));
    // multi-assay: the same protein in two assays is two options, and neither overwrites the other
    const save = { d: window._resultsData, p: window._lastAnalysisParams };
    window._lastAnalysisParams = Object.assign({}, save.p, { multiAssay: true });
    window._resultsData = [{ Sample_ID: 'C1', Protein: 'BRD4', _assayType: 'hibit', DC50_nM: 10 }, { Sample_ID: 'C1', Protein: 'BRD4', _assayType: 'ctg', DC50_nM: 1000 }, { Sample_ID: 'C2', Protein: 'BRD4', _assayType: 'hibit', DC50_nM: 5 }, { Sample_ID: 'C2', Protein: 'BRD4', _assayType: 'ctg', DC50_nM: 5 }];
    document.getElementById('sel-prot-x').dataset.sig = ''; _initSelectivity();
    const opts = [...document.getElementById('sel-prot-x').options].map(o => o.value);
    document.getElementById('sel-prot-x').value = 'ctg::BRD4'; document.getElementById('sel-prot-y').value = 'hibit::BRD4'; buildSelectivityChart();
    const mp = SEL.last.points.map(p => p.label + ':' + p.dir).join();
    window._resultsData = save.d; window._lastAnalysisParams = save.p; document.getElementById('sel-prot-x').dataset.sig = ''; _initSelectivity();
    return { square: !!L && L.side > 100, log: D.log, n: D.points.length, exp: X && X.n, white: px && px[0] > 250 && px[1] > 250 && px[2] > 250, nLab: lab.length, out, overlap, noteOut: boxes[0] && boxes[0].note, want, listed, sorted, opts, mp };
  });
  check('E55', 'the plot is a square with potency on a log axis', r.square && r.log, r);
  check('E55', 'the PNG is the same points, on white', r.exp === r.n && r.n > 0 && r.white, r);
  check('E55', 'names are placed, none outside the plot, none on another', r.nLab > 0 && r.out === 0 && r.overlap === 0, { n: r.nLab, out: r.out, overlap: r.overlap });
  check('E55', 'the "hidden names" note is not drawn inside the plot', r.noteOut === true, r.noteOut);
  check('E55', 'the ranked lists hold exactly the selective compounds, most selective first', r.want === r.listed && r.sorted, { want: r.want, listed: r.listed, sorted: r.sorted });
  check('E55', 'a multi-assay run offers each assay\'s protein, and compares them', r.opts.includes('hibit::BRD4') && r.opts.includes('ctg::BRD4') && /C1:y/.test(r.mp) && /C2:neutral/.test(r.mp), { opts: r.opts, mp: r.mp });
  await E(() => switchPlotType('scatter'));
});

if (run('E56')) await guard('E56', async () => {
  await E(() => { window._plateUI = { view: 'maps', mode: 'raw_lum', scale: 'assay', labels: false, clip: false, q: '', cmp: { a: '', b: '', match: 'dose', val: 'm' } }; window._plateFit = true; document.querySelector('[data-tab="plate"]').click(); });
  await pg.waitForTimeout(500);
  const r = await E(async () => {
    const out = { mapped: document.getElementById('plate-mode').value, opts: [...document.getElementById('plate-mode').options].map(o => o.value) };
    // residual by hand
    const st = _plateStats, bc = st.barcodes[0], wells = _plateData[bc];
    let checked = 0, worst = 0;
    Object.keys(wells).forEach(id => { const w = wells[id]; if (!_plIsCpd(w) || w.m == null || w.c == null || _plExcluded(bc, w)) return; const f = _plFit(w.s, w.p, bc); if (!f || !_cvFitted(f)) return;
      const want = w.m - (f._gainMode ? f._bot + ((f._tc ?? 100) - f._bot) / (1 + Math.pow(10, f._hill * (f._logec50 - w.c))) : f._bot + ((f._tc ?? 100) - f._bot) / (1 + Math.pow(10, f._hill * (w.c - f._logec50))));
      const got = st.res[bc][id]; checked++; worst = Math.max(worst, Math.abs(got - want)); });
    out.res = { checked, worst };
    // plant a column 15 points low on a copy of a plate: the plate effect must find it
    const keep = window._plateData, copy = JSON.parse(JSON.stringify(keep[bc]));
    Object.keys(copy).forEach(id => { const m = /^([A-P])0*(\d+)$/.exec(id); if (m && +m[2] === 7 && copy[id].m != null) copy[id].m -= 15; });
    window._plateData = Object.assign({}, keep, { PLANTED: copy }); window._plateFitMap = null;
    const st2 = _plateComputeStats();
    const col = c => { const v = Object.keys(st2.eff.PLANTED).filter(id => +(/\d+$/.exec(id)[0]) === c).map(id => st2.eff.PLANTED[id]); return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length); };
    const base = Object.keys(st2.eff[bc]).filter(id => +(/\d+$/.exec(id)[0]) === 7).map(id => st2.eff[bc][id]);
    out.eff = { c7: col(7), c7base: base.reduce((a, b) => a + b, 0) / Math.max(1, base.length), c8: col(8) };
    // a vertical plate: the first plate transposed, so every series runs down a column
    const src = keep[bc], vert = {};
    Object.keys(src).forEach(id => { const m = /^([A-P])0*(\d+)$/.exec(id); if (!m) return; const r = m[1].charCodeAt(0) - 65, c = +m[2] - 1; if (c > 15 || r > 23) return; vert[String.fromCharCode(65 + c) + ((r + 1) < 10 ? '0' + (r + 1) : (r + 1))] = src[id]; });
    window._plateData = Object.assign({}, keep, { VERTICAL: vert });
    window._plateUI.mode = 'compound'; window._plateUI.labels = true; renderPlateTab();
    await new Promise(r => setTimeout(r, 250));
    const cv = document.getElementById('pc-VERTICAL'), L = cv ? cv._labels || [] : [];
    out.v = { n: L.length, rot: L.filter(l => l.rot).length, cut: L.filter(l => /…$/.test(l.text)).length,
      outside: L.filter(l => l.x - l.w / 2 < l.box.x1 - 0.5 || l.x + l.w / 2 > l.box.x2 + 0.5 || l.y - l.h / 2 < l.box.y1 - 0.5 || l.y + l.h / 2 > l.box.y2 + 0.5).length };
    // The same in a narrow font: on a machine without Plex (CI) a name can fit across a column at full size, and
    // a size comparison alone then left every name level.
    const nf = document.createElement('style'); nf.textContent = "@font-face{font-family:'IBM Plex Sans';src:local('Arial Narrow'),local('ArialNarrow'),local('Liberation Sans Narrow'),local('DejaVu Sans Condensed');font-weight:100 900;}";
    document.head.appendChild(nf); try { await document.fonts.load("700 12px 'IBM Plex Sans'"); } catch (e) {} renderPlateTab(); await new Promise(r => setTimeout(r, 250));
    const cvN = document.getElementById('pc-VERTICAL'), LN = cvN ? cvN._labels || [] : [];
    out.vn = { n: LN.length, rot: LN.filter(l => l.rot).length }; nf.remove(); renderPlateTab(); await new Promise(r => setTimeout(r, 150));
    const cvH = document.getElementById('pc-' + bc.replace(/[^a-z0-9]/gi, '_')), LH = cvH ? cvH._labels || [] : [];
    out.h = { n: LH.length, rot: LH.filter(l => l.rot).length };
    window._plateData = keep; window._plateFitMap = null; window._plateUI.mode = 'signal'; window._plateUI.labels = false; renderPlateTab();
    return out;
  });
  check('E56', 'raw luminescence is no longer a colouring; a saved choice of it opens the plate effect', r.mapped === 'effect' && !r.opts.includes('raw_lum') && ['signal', 'resid', 'effect', 'ctrl'].every(v => r.opts.includes(v)), r);
  check('E56', 'distance from the fit is signal − the fitted curve, to the digit', r.res.checked > 20 && r.res.worst < 1e-9, r.res);
  check('E56', 'the plate effect finds a column planted 15 points low', r.eff.c7 - r.eff.c7base < -10 && Math.abs(r.eff.c8) < 8, r.eff);
  check('E56', 'a series down a column is named turned 90°, inside its block, in full', r.v.n > 5 && r.v.rot === r.v.n && r.v.outside === 0 && r.v.cut === 0, r.v);
  check('E56', 'a series across a row is named across it', r.h.n > 5 && r.h.rot === 0, r.h);
  check('E56', 'a series down a column is turned 90° in a narrow font too', r.vn.n > 5 && r.vn.rot === r.vn.n, r.vn);
});

if (run('E57')) await guard('E57', async () => {
  const AL = fs.readFileSync(path.join(ROOT, 'tools/audit_align.js'), 'utf8'), ES = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const c = await browser.newContext({ viewport: { width: w, height: h } }); const q = await c.newPage();
    await q.goto('file://' + FILE); await q.waitForTimeout(1200);
    await q.evaluate(() => { loadTestData(); }); await q.waitForTimeout(900);
    await q.evaluate(AL); await q.evaluate(ES);
    for (const multi of [false, true]) {
      await q.evaluate(m => { openSetupModal(); const cb = document.getElementById('multi-assay-chk'); if (cb && cb.checked !== m) { cb.checked = m; toggleMultiAssay(); if (m) addAssayType(); } }, multi);
      for (const t of ['files', 'assay', 'analysis', 'output', 'review']) {
        await q.evaluate(t => switchSetupTab(t), t); await q.waitForTimeout(300);
        const r = await q.evaluate(() => ({ a: __alignAudit(), e: __escapeAudit() }));
        const bad = [...(r.a || []).map(x => 'align: ' + x), ...(r.e || []).map(x => 'escape: ' + (typeof x === 'string' ? x : JSON.stringify(x)))];
        check('E57', w + 'px ' + (multi ? 'three panels' : 'one assay') + ' · ' + t, !bad.length, bad.slice(0, 4));
      }
    }
    await c.close();
  }
});

if (run('E58')) await guard('E58', async () => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const q = await c.newPage(); const errs = []; q.on('pageerror', e => errs.push(e.message));
  await q.goto('file://' + FILE); await q.waitForTimeout(1200);
  await q.evaluate(() => { loadTestData(); }); await q.waitForTimeout(900);
  const kept = await q.evaluate(() => {
    openSetupModal(); const cb = document.getElementById('multi-assay-chk'); cb.checked = true; toggleMultiAssay();
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); };
    set('mat-type-0', 'hibit'); set('mat-prefix-0', 'BRD2'); set('mat-ctrl-0', 'B12-O12'); updateMatPanel(0);
    set('mat-type-1', 'ctg'); set('mat-prefix-1', 'BRD3'); set('mat-ctrl-1', 'B12-O12'); updateMatPanel(1);
    document.getElementById('mat-r2-0').value = '0.77';
    addAssayType(); removeAssayType(_matCounter - 1);
    const v = document.getElementById('mat-r2-0').value; document.getElementById('mat-r2-0').value = '0.8'; return v;
  });
  check('E58', 'a fit setting typed on a panel survives another panel being added and removed', kept === '0.77', kept);
  await q.evaluate(() => { document.getElementById('p-assay').value = 'E58MULTI'; return runPipeline(); });
  await q.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 }); await q.waitForTimeout(800);
  const r = await q.evaluate(() => {
    const heads = [...document.querySelectorAll('#results-panel th')].map(t => t.textContent.trim()).filter(t => /HiBiT|CTG/.test(t));
    const banners = [...document.querySelectorAll('#results-panel .na-id')].map(e => e.textContent.trim());
    const sets = _echoLabbookSets().map(s => ({ id: s.id, assay: s.assay, pot: s.potencyLabel, n: s.rows.length, label: s.label }));
    let wb = null; const w0 = XLSX.write; XLSX.write = (w, o) => { wb = w; return w0.call(XLSX, w, o); }; const a0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
    try { generateOutputXLSX(); } finally { XLSX.write = w0; HTMLAnchorElement.prototype.click = a0; }
    const raw = wb && wb.Sheets['Raw data'] ? XLSX.utils.sheet_to_json(wb.Sheets['Raw data'], { header: 1 }) : [];
    const bad = [];
    for (const t of ['results', 'curves', 'scatter', 'plate', 'props']) { const b = document.querySelector('[data-tab="' + t + '"]'); if (b) b.click(); const m = document.body.innerText.match(/\bNaN\b|\bundefined\b|\[object Object\]/); if (m) bad.push(t + ': ' + m[0]); }
    return { heads, banners, sets, rawA: [...new Set(raw.slice(1).map(x => x[0]))], bad };
  });
  check('E58', 'each column block names its assay and its group', r.heads.some(h => /HiBiT · BRD2/.test(h)) && r.heads.some(h => /CTG\/Viability · BRD3/.test(h)), r.heads);
  check('E58', 'the normalisation banners name the assay type', r.banners.length === 2 && r.banners.every(b => /^(HiBiT|CTG\/Viability)$/.test(b)), r.banners);
  check('E58', 'Labbook gets one set per assay, each with its own potency name and id', r.sets.length === 2 && r.sets.some(s => s.assay === 'hibit' && /DC50/.test(s.pot)) && r.sets.some(s => s.assay === 'ctg' && /IC50/.test(s.pot)) && new Set(r.sets.map(s => s.id)).size === 2 && r.sets.every(s => s.n > 0), r.sets);
  check('E58', 'the Raw data sheet says which assay each row is', r.rawA.length === 2 && r.rawA.every(a => /^(HiBiT|CTG\/Viability)$/.test(a)), r.rawA);
  check('E58', 'no tab prints NaN or undefined, and nothing throws', !r.bad.length && !errs.length, { bad: r.bad, errs });
  await c.close();
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
