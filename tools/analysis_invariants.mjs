// Invariants for the Data Analysis apps that did not have any: BCA, Dora, Beacon. The same rule as everywhere: a class of bug, found once, is a check that
// runs every time, and each check was proven by putting the bug back in a temporary copy.
//
//   C1  no reading is not zero   A pasted plate keeps its blanks blank: an empty cell, "OVRFLW" or "n/a" is no reading, a decimal comma is a decimal, and a well that was not read
//                                never drags an average to 0 or colours the heatmap as the lowest well.
//   C2  nothing runs in a file   Names and notes that start = + - @ are neutral in every CSV the app writes; a real number is left alone.
//   C3  a concentration is real  A sample below the blank is not a negative concentration; a dilution of 0 or less, or a negative standard, is "not set".
//   C4  text is data             HTML in a name is shown as text everywhere it is shown.
//   D2  Echo's word is Echo's    Dora opening an Echo analysis uses the potency Echo stands behind: a flat curve is n.d. (not its fitted 0.4 nM), a midpoint past the doses is a bound at the
//                                dose limit (not the fitted number).
//   B1  a range is on the plate  Beacon's well ranges never invent wells outside the plate: "A1:A99999999" is none (or clipped) in a blink, "A0", "A13" on a 96-well and "Q1" are none.
//   B2  one plate, one plate     A reader list holding two plates (the Well header repeated, or the same wells coming round again) is two plates, each with its own numbers — it used to be one plate
//                                whose wells the last plate overwrote. A well with no reading is absent, never 0.
//   B3  paste lands right        Values copied from Excel go to the channel the plate is waiting for; two grids (stacked or blank-line separated) are donor then acceptor; a Well table fills both.
//   B4  a plate is not a dose    The same compound name on two plates pools its replicates, each plate corrected against its OWN baseline: a plate that reads 200 mBU higher lands on the same levels (bottom 0, top 500, no spread) and the same potency.
//   B5  a bound is a bound       A midpoint past the top dose is reported as > the dose limit, never as the fitted number; a flat series or one of 3 concentrations is n.d., not a curve.
//   B6  a drag is a layout       Selecting a block and applying gives the compounds, replicates, points and concentrations the preview said; controls inside the block are left alone; undo restores it.
//   B7  exports are text         A name that would be a formula leaves the workbook and the CSV as text; the rest of a header ("--- ASSAY ---", "-0.5") is left alone.
//   D1  a bound is a bound       Dora keeps "> 10000" and "< 1" as bounds (shown with their sign, drawn hollow, never "good" when the bound is in the wrong direction), a DC50 of 0
//                                or less and "n/a" are no potency, and a missing Dmax is a dash, not a 0 with an empty bar.
//   B12 a plate keeps its size  The wells are the size their column allows: the same at 900 and at 600 px of window height, with the steps' text longer or shorter, with data or without.
//   B13 keys on Results         ↑ ↓ Home End move between compounds (the row, the curve and its title follow, the table keeps its scroll); ← → switch the plate under Controls.
//   B14 Prism copy              Concentration (nM) down one column, descending; every compound's replicates side by side (2 replicates on 2 plates = 4 columns), relative to the vehicle; the workbook's Prism Copy sheet says the same.
//   B15 clear all               Starts again from one empty 96-well plate, no compounds, no name, protein–protein; ⌘Z brings everything back.
//   B16 history                 An analysis with readings is kept under its name, comes back exactly (plates, compounds, name) after Clear all, and a rename renames the entry.
//   B17 setup                   Typed control ranges mark exactly those wells (and clear when emptied); placing compounds makes the names, points and replicates asked, never on a control well; Review names what is missing.
//   B18 the shell               Beacon inside dHUB hides its whole header like every other app (an empty white band was left under the shell's bar).
//   B19 compounds spill        Two plates, one list of names: the first plate takes as many compounds as its layout holds, the rest go on the next plate in the same order and set-up
//                               (each plate its own compounds); "the same on every plate" gives replicate plates; boxes edited by hand win, and what fits nowhere waits.
//   B20 a drag reaches         A drag that runs past the edge of the plate (or crosses the gaps and labels) ends on the edge well, and one held at the window's edge scrolls the page by itself,
//                               so the last rows of a plate taller than the window can be drawn.
//
// Usage (repo root):  node tools/analysis_invariants.mjs [--only=C1,C3] [--file-bca=path] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const OVER = { '/apps/bca/bca.html': args['file-bca'], '/apps/dora/dora.html': args['file-dora'], '/apps/beacon/beacon.html': args['file-beacon'] };
const out = [], counts = {};
const check = (inv, name, ok, detail) => { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) }); };
const guard = async (inv, fn) => { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = OVER[u] ? path.resolve(OVER[u]) : path.join(ROOT, u);
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const pageErrs = [];
async function open(p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs.*xlsx/.test(u)) return r.continue(); r.abort(); });
  const pg = await ctx.newPage(); pg.on('pageerror', e => pageErrs.push(p + ': ' + String(e && e.message || e)));
  await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await pg.goto(BASE + p); await pg.waitForTimeout(900); return { ctx, pg };
}

if (run('C1')) await guard('C1', async () => {
  const { ctx, pg } = await open('/apps/bca/bca.html');
  const r = await pg.evaluate(async () => {
    const out = {};
    switchTab('import'); await new Promise(r => setTimeout(r, 200));
    const put = (r, c, v) => { const i = pasteGridCell(r, c); i.value = v; };
    put(0, 0, '0,543'); put(0, 1, '0.601'); put(0, 2, ''); put(0, 3, 'OVRFLW'); put(1, 0, '1.234,5'); put(1, 1, ' 0.5 '); put(1, 2, 'n/a');
    commitPasteGrid(); const g = state.plate;
    out.vals = [g[0].vals[0], g[0].vals[1], g[0].vals[2], g[0].vals[3], g[1].vals[0], g[1].vals[1], g[1].vals[2]];
    out.toast = (document.getElementById('bca-toast') || {}).textContent || '';
    // a group holding one read well and one that was not: the average is the read well, not half of it
    state.plateMap.standardGroups.push({ id: 90, wells: ['A01', 'A03'], conc: 1, excluded: [], color: '#ccc' });
    out.avg = groupAvgAbs(state.plateMap.standardGroups[0]); out.avgNone = groupAvgAbs({ wells: ['A03', 'A04'], excluded: [] });
    // the heatmap and the exports cope with holes
    let err = null; try { drawHeatmap(); } catch (e) { err = String(e); } out.heatErr = err;
    out.legend = [document.getElementById('legend-min').textContent, document.getElementById('legend-max').textContent];
    const csvs = []; const old = downloadCSV; window.downloadCSV = (c) => csvs.push(c); try { exportPlateCSV(); } catch (e) { out.csvErr = String(e); } window.downloadCSV = old;
    out.csv = (csvs[0] || '').split('\n').slice(0, 2);
    // an empty paste reads nothing and says so
    clearPasteGrid(); const before = state.plate; commitPasteGrid(); out.emptyKept = state.plate === before || !state.plate;
    return out;
  });
  check('C1', 'a decimal comma is a decimal ("0,543" → 0.543, "1.234,5" → 1234.5), spaces are trimmed', r.vals[0] === 0.543 && r.vals[1] === 0.601 && r.vals[4] === 1234.5 && r.vals[5] === 0.5, r.vals);
  check('C1', 'an empty cell, "OVRFLW" and "n/a" are no reading (null) — not 0 — and the toast counts the ones that were text', r.vals[2] === null && r.vals[3] === null && r.vals[6] === null && /could not be read/.test(r.toast), { vals: r.vals, toast: r.toast });
  check('C1', 'a well that was not read does not enter an average, and a group with none has no average', r.avg === 0.543 && Number.isNaN(r.avgNone), { avg: r.avg, none: r.avgNone });
  check('C1', 'the heatmap draws holes without throwing, the legend is a real range, and the plate CSV leaves a hole empty', !r.heatErr && !/Infinity|NaN/.test(r.legend.join()) && /^A,0\.5430,0\.6010,,,/.test(r.csv[1] || '') && !r.csvErr, { heatErr: r.heatErr, legend: r.legend, csv: r.csv, csvErr: r.csvErr });
  check('C1', 'pressing Commit on an empty grid reads nothing and does not replace a plate with zeros', r.emptyKept, r);
  await ctx.close();
});

if (run('C2')) await guard('C2', async () => {
  const { ctx, pg } = await open('/apps/bca/bca.html');
  const r = await pg.evaluate(async () => {
    loadTestData(); const evil = ['=HYPERLINK("http://x","y")', '+1+1', '-2+3', '@SUM(A1)', '=cmd|\' /C calc\'!A0'];
    state.plateMap.sampleGroups.slice(0, 5).forEach((g, i) => { g.name = evil[i]; });
    bcaFit = bcaFit || null; renderStandardsCurve(); const csvs = []; const old = downloadCSV; window.downloadCSV = (c, n) => csvs.push([n, c]);
    exportSamplesCSV(); window.downloadCSV = old;
    const lines = (csvs[0] ? csvs[0][1] : '').split('\n').slice(1, 6).map(l => l.split(',')[0]);
    return { lines, plain: escapeCsv('-5') === '"-5"' && escapeCsv(0.5) === '"0.5"', neutral: escapeCsv('-2+3') === '"\'-2+3"' && escapeCsv('=1') === '"\'=1"' };
  });
  check('C2', 'every hostile sample name leaves the CSV with a quote in front, so a spreadsheet shows text', r.lines.length === 5 && r.lines.every(l => /^"'[=+\-@]/.test(l)), r.lines);
  check('C2', 'a real number is left alone and a formula that starts like one is not', r.plain && r.neutral, r);
  await ctx.close();
});

if (run('C3')) await guard('C3', async () => {
  const { ctx, pg } = await open('/apps/bca/bca.html');
  const r = await pg.evaluate(async () => {
    loadTestData(); switchTab('standards'); await new Promise(r => setTimeout(r, 200)); switchTab('samples'); await new Promise(r => setTimeout(r, 200));
    const out = {}, smp = state.plateMap.sampleGroups, std = state.plateMap.standardGroups;
    // a sample darker than nothing: well below the blank
    smp[0].wells.forEach(w => { const rc = wellToRowCol(w); state.plate.filter(r => r.label === rc.row)[0].vals[rc.col - 1] = 0.001; });
    const res = computeSampleResults()[0]; out.below = { assay: res.assayConc, final: res.finalConc, invalid: res.invalid, flag: res.belowBlank };
    renderSamplesTable(); out.cell = document.querySelector('#samples-table tbody tr td:nth-child(10)').textContent;
    pmSetGroupField('sample', smp[1].id, 'dilutionFactor', '0'); out.dil0 = smp[1].dilutionFactor;
    pmSetGroupField('sample', smp[1].id, 'dilutionFactor', '-3'); out.dilNeg = smp[1].dilutionFactor;
    pmSetGroupField('sample', smp[1].id, 'dilutionFactor', '2,5'); out.dilComma = smp[1].dilutionFactor;
    pmSetGroupField('standard', std[0].id, 'conc', '-1'); out.concNeg = std[0].conc;
    pmSetGroupField('standard', std[0].id, 'conc', '0'); out.conc0 = std[0].conc;
    return out;
  });
  check('C3', 'a sample darker than the blank has no concentration (not a negative one) and says it is below the blank', r.below.invalid && r.below.flag && Number.isNaN(r.below.final) && /below the blank/.test(r.cell), r);
  check('C3', 'a dilution of 0 or less is "not set" (so the default applies), 2,5 is 2.5; a negative standard concentration is not set, and 0 is a real blank standard', r.dil0 === null && r.dilNeg === null && r.dilComma === 2.5 && r.concNeg === null && r.conc0 === 0, r);
  await ctx.close();
});

if (run('C4')) await guard('C4', async () => {
  const { ctx, pg } = await open('/apps/bca/bca.html');
  const r = await pg.evaluate(async () => {
    window.__x = 0; loadTestData(); const evil = '<img src=x onerror="window.__x=1">';
    state.plateMap.sampleGroups[0].name = evil; state.plateMap.standardGroups[0].name = evil;
    switchTab('samples'); await new Promise(r => setTimeout(r, 300)); renderGroupList('sample'); renderGroupList('standard'); renderSamplesTable();
    await new Promise(r => setTimeout(r, 300));
    return { ran: window.__x, imgs: document.querySelectorAll('img[src="x"]').length, shown: document.body.innerHTML.indexOf('&lt;img src=x') >= 0 };
  });
  check('C4', 'HTML in a sample or standard name is text everywhere it is drawn: nothing runs and no element is made', r.ran === 0 && r.imgs === 0 && r.shown, r);
  await ctx.close();
});

if (run('B1')) await guard('B1', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const d96 = { r: 8, c: 12 }, d384 = { r: 16, c: 24 }, t0 = performance.now();
    const big = PlateEngine.parseRange('A1:A99999', d96), big2 = PlateEngine.parseRange('A1:P99999999', d384), ms = performance.now() - t0;
    return { big: big ? big.length : 0, big2: big2 ? big2.length : 0, ms, zero: PlateEngine.parseRange('A0', d96), over: PlateEngine.parseRange('A13', d96), q: PlateEngine.parseRange('Q1', d384),
      rev: (PlateEngine.parseRange('A12:A1', d96) || []).join(), fwd: (PlateEngine.parseRange('A1:A12', d96) || []).join(), rect: (PlateEngine.parseRange('B2:C3', d96) || []).join(), lower: (PlateEngine.parseRange('b2:c3', d96) || []).join(),
      list: (PlateEngine.parseRange('A1, b2, Z9, P24', d384) || []).join(), col: (PlateEngine.parseRange('A1:H1', d96) || []).length };
  });
  check('B1', 'a column past the plate is no well, and a huge range costs nothing: "A1:A99999" and "A1:P99999999" are instant and never invent wells', r.big <= 24 && r.big2 <= 384 && r.ms < 200, { big: r.big, big2: r.big2, ms: Math.round(r.ms) });
  check('B1', 'column 0, column 13 on a 96-well and row Q are not wells; a list keeps the wells that exist and drops the rest', r.zero === null && r.over === null && r.q === null && r.list === 'A1,B2,P24', { zero: r.zero, over: r.over, q: r.q, list: r.list });
  check('B1', 'ranges still mean what they did: reversed or forward the same wells, a rectangle, a column, either case', r.rev === r.fwd && r.rect === 'B2,B3,C2,C3' && r.lower === r.rect && r.col === 8, r);
  await ctx.close();
});

if (run('B2')) await guard('B2', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const hdr = ['Well', 'Type', '665 (LUM)', '620 (LUM) LP'], L = 'AB';
    const plate = k => { const rows = [hdr.slice()]; for (const l of L) for (let c = 1; c <= 3; c++) rows.push([l + '0' + c, 'Sample', 1000 * k + c, 100 * k + c]); return rows; };
    // A: the header repeated. B: no second header, the wells simply come round again. C: a hole (no reading) must stay a hole.
    const A = bParseTableRows(plate(1).concat(plate(2))), B = bParseTableRows(plate(1).concat(plate(2).slice(1)));
    const rowsC = plate(1); rowsC[2][2] = ''; rowsC[3][3] = 'n/a'; const C = bParseTableRows(rowsC);
    // D: several sheets, each a plate
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(plate(1)), 'Table End point'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(plate(2)), 'Table End point (2)');
    const D = bParseWorkbook(wb);
    // placement: two plates in -> two plates on screen, the second not overwriting the first; the same file again replaces rather than duplicates
    state.plates = []; state.series = []; bPlaceReadings(A, 'f.xlsx', null, null); const n1 = state.plates.length; bPlaceReadings(A, 'f.xlsx', null, null); const n2 = state.plates.length;
    return { A: A.map(p => [Object.keys(p.donor).length, p.donor.A1, p.donor.B3, p.acceptor.A1]), B: B.length, Bv: B[1] && B[1].donor.A1, C: C.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length, 'A2' in p.donor, 'A3' in p.acceptor]), D: D.plates.length, n1, n2, names: state.plates.map(p => p.name), raw0: bRaw({ donor: { A1: 0 }, acceptor: { A1: 5 } }, 'A1'), rawNeg: bRaw({ donor: { A1: 10 }, acceptor: { A1: -5 } }, 'A1'), rawOk: bRaw({ donor: { A1: 1000 }, acceptor: { A1: 500 } }, 'A1') };
  });
  check('B2', 'a list with the Well header repeated is two plates, each with its own numbers (not one plate with the last one\'s wells)', r.A.length === 2 && r.A[0][1] === 1001 && r.A[1][1] === 2001 && r.A[0][3] === 101 && r.A[1][3] === 201 && r.A[0][0] === 6, r.A);
  check('B2', 'the same wells coming round again, with no second header, is the next plate', r.B === 2 && r.Bv === 2001, { B: r.B, Bv: r.Bv });
  check('B2', 'a well with no reading ("", "n/a") is absent from its plate, never 0', r.C.length === 1 && r.C[0][0] === 5 && r.C[0][1] === 5 && r.C[0][2] === false && r.C[0][3] === false, r.C);
  check('B2', 'every Table End point sheet is a plate', r.D === 2, r.D);
  check('B2', 'the plates land as two tabs; reading the same file again replaces them instead of adding two more', r.n1 === 2 && r.n2 === 2, { n1: r.n1, n2: r.n2, names: r.names });
  check('B2', 'a donor of zero or an acceptor below zero is no ratio (null), not 0 and not Infinity', r.raw0 === null && r.rawNeg === null && r.rawOk === 500, { raw0: r.raw0, rawNeg: r.rawNeg, rawOk: r.rawOk });
  await ctx.close();
});

if (run('B3')) await guard('B3', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const out = {}, L = 'ABCDEFGH', g = f => L.split('').map((l, r) => [...Array(12)].map((_, c) => f(r, c)).join('\t')).join('\n');
    const reset = () => { state.plates = []; state.series = []; state.plate = 0; BM_SEL = new Set(); BM_CH = null; _bUndo = []; };
    reset(); bPasteText(g((r, c) => 5000 + r)); const a = state.plates.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length]); const aim = BM_CH;
    bPasteText(g((r, c) => 100 + c)); out.seq = { a, aim, b: state.plates.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length]), v: state.plates[0].acceptor.A5 };
    reset(); bPasteText(g((r, c) => 5000 + r) + '\n\n' + g((r, c) => 100 + c)); out.blank = state.plates.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length, p.donor.A1, p.acceptor.A1]);
    reset(); bPasteText(g((r, c) => 5000 + r) + '\n' + g((r, c) => 100 + c)); out.stacked = state.plates.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length, p.donor.H12, p.acceptor.H12]);
    reset(); bPasteText(L.split('').map((l, r) => l + '\t' + [...Array(12)].map((_, c) => 5000 + r * 10 + c).join('\t')).join('\n')); out.lettered = state.plates.map(p => [Object.keys(p.donor).length, p.donor.C4]);
    reset(); const rows = ['Well\tType\t665 (LUM)\t620 (LUM) LP']; for (let c = 1; c <= 12; c++) rows.push('A' + (c < 10 ? '0' + c : c) + '\tSample\t5000\t' + (100 + c)); bPasteText(rows.join('\n')); out.table = state.plates.map(p => [Object.keys(p.donor).length, Object.keys(p.acceptor).length, p.acceptor.A12]);
    reset(); bPasteText(g((r, c) => 5000 + r)); bPasteText(g((r, c) => 100 + c)); out.third = bPasteText(g((r, c) => 7)); out.third2 = state.plates.length;
    reset(); out.junk = bPasteText('hello world\nnot numbers'); out.junkPlates = state.plates.length;
    reset(); bPasteText(g((r, c) => (r === 0 && c === 0) ? '' : 5000 + r)); out.hole = [Object.keys(state.plates[0].donor).length, 'A1' in state.plates[0].donor];
    return out;
  });
  check('B3', 'a lone grid goes to the channel the plate is waiting for (donor, then acceptor) and the strip is aimed at the next one', r.seq.a[0][0] === 96 && r.seq.a[0][1] === 0 && r.seq.aim === 'acceptor' && r.seq.b.length === 1 && r.seq.b[0][1] === 96 && r.seq.v === 104, r.seq);
  check('B3', 'two grids, blank-line separated or one above the other, are donor then acceptor of one plate', r.blank.length === 1 && r.blank[0][0] === 96 && r.blank[0][1] === 96 && r.blank[0][2] === 5000 && r.blank[0][3] === 100 && r.stacked.length === 1 && r.stacked[0][2] === 5007 && r.stacked[0][3] === 111, { blank: r.blank, stacked: r.stacked });
  check('B3', 'a lettered grid lands by its row letters; a PHERAstar-style Well table fills both channels', r.lettered[0][0] === 96 && r.lettered[0][1] === 5023 && r.table[0][0] === 12 && r.table[0][1] === 12 && r.table[0][2] === 112, { lettered: r.lettered, table: r.table });
  check('B3', 'with both channels read, a lone grid is refused and says why — it never silently overwrites', r.third === true && r.third2 === 1, { third: r.third, plates: r.third2 });
  check('B3', 'text with no numbers is not a paste (false), and an empty cell in a grid is a hole, not 0', r.junk === false && r.junkPlates === 0 && r.hole[0] === 95 && r.hole[1] === false, { junk: r.junk, hole: r.hole });
  await ctx.close();
});

if (run('B4')) await guard('B4', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    // two plates, the same compound, the same curve (EC50 100 nM, gain), plate 2 reading 200 mBU higher all over
    const mk = off => { const pl = bNewPlate(8, 12, null); for (let r = 0; r < 8; r++) { pl.donor[bPos(r, 0)] = 5000; pl.acceptor[bPos(r, 0)] = (50 + off) * 5; if (r < 4) pl.map[bPos(r, 0)] = { k: 'noLigand' };
      for (let c = 1; c < 11; c++) { const conc = 10000 / Math.pow(3, c - 1), y = 50 + off + 500 / (1 + Math.pow(10, Math.log10(100) - Math.log10(conc))); pl.donor[bPos(r, c)] = 5000; pl.acceptor[bPos(r, c)] = y * 5; if (r < 2) pl.map[bPos(r, c)] = { k: 'cpd', s: 's1', c: conc }; } } return pl; };
    state.plates = [mk(0), mk(200)]; state.series = [{ id: 's1', name: 'X' }]; state.assayMode = 'gain'; state.rev++; RS_PER = false; _bFitC = null;
    const pooled = bFits(); RS_PER = true; state.rev++; const per = bFits(); RS_PER = false; state.rev++;
    // plate 2 without a baseline: raw, and the fit says so
    state.plates[1].map = bCloneMap(state.plates[1].map, 8, 12); Object.keys(state.plates[1].map).forEach(p => { if (state.plates[1].map[p].k === 'noLigand') delete state.plates[1].map[p]; }); state.rev++; const half = bFits();
    return { pooled: pooled.map(f => [f.ec50, f.plates.length, f.pts.length, f.unc.length]), per: per.map(f => f.ec50), lvl: pooled.map(f => [f.bottom, f.top, Math.max.apply(null, f.pts.map(p => p.sd))]), half: half.map(f => [f.unc.join(), f.nW]) };
  });
  const near = (a, b, t) => Math.abs(a / b - 1) < t;
  check('B4', 'per plate, a plate that reads 200 mBU higher gives the same potency (each corrected against its own baseline)', r.per.length === 2 && near(r.per[0], 100, 0.05) && near(r.per[1], 100, 0.05), r.per);
  check('B4', 'pooled, the same name is ONE compound over both plates (20 wells per concentration x 2 plates, 10 concentrations) and the potency is the same 100 nM, not a blend of two baselines', r.pooled.length === 1 && r.pooled[0][1] === 2 && r.pooled[0][2] === 10 && near(r.pooled[0][0], 100, 0.05), r.pooled);
  check('B4', 'and the pooled points really are one population: bottom 0, top 500 and no spread between the plates (a plate corrected against another plate\'s baseline sits 200 mBU away and shows as SD ~100 at every concentration)', r.lvl.length === 1 && Math.abs(r.lvl[0][0]) < 2 && Math.abs(r.lvl[0][1] - 500) < 3 && r.lvl[0][2] < 0.5, r.lvl);
  check('B4', 'a plate with no baseline is flagged as raw (and pooled with its siblings only because it is said)', r.half.length === 1 && r.half[0][0] === '1' && r.half[0][1] === 40, r.half);
  await ctx.close();
});

if (run('B5')) await guard('B5', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const mk = (ec, concs) => { const pl = bNewPlate(8, 12, null); for (let r = 0; r < 8; r++) { pl.donor[bPos(r, 0)] = 5000; pl.acceptor[bPos(r, 0)] = 250; if (r < 4) pl.map[bPos(r, 0)] = { k: 'noLigand' };
      concs.forEach((conc, i) => { const c = i + 1, y = 50 + 500 / (1 + Math.pow(10, Math.log10(ec) - Math.log10(conc))); pl.donor[bPos(r, c)] = 5000; pl.acceptor[bPos(r, c)] = y * 5; if (r < 2) pl.map[bPos(r, c)] = { k: 'cpd', s: 's1', c: conc }; }); } return pl; };
    const run = (ec, concs) => { state.plates = [mk(ec, concs)]; state.series = [{ id: 's1', name: 'X' }]; state.assayMode = 'gain'; state.rev++; _bFitC = null; const f = bFits()[0]; return { bound: f.bound, limit: f.limit, fit: !!f.fit, ec50: f.ec50, n: f.pts.length }; };
    const dec = [...Array(8)].map((_, i) => 10000 / Math.pow(3, i));
    return { inside: run(300, dec), above: run(5e6, dec), flat: run(1e-4, dec), few: run(100, [10, 100, 1000]) };
  });
  check('B5', 'a midpoint inside the doses is a number', r.inside.bound === '' && r.inside.fit && Math.abs(r.inside.ec50 / 300 - 1) < 0.1, r.inside);
  check('B5', 'a midpoint past the top dose is "> the top dose" with the dose limit, not the fitted 108 000 nM', r.above.bound === '>' && Math.abs(r.above.limit - 10000) < 1, r.above);
  check('B5', 'a series that is flat across every dose (all on the plateau) has no midpoint: n.d., not a potency the optimiser made up', r.flat.fit === false && r.flat.n === 8, r.flat);
  check('B5', 'a series of 3 concentrations is not a curve (no fit), whatever it looks like', r.few.fit === false && r.few.n === 3, r.few);
  await ctx.close();
});

if (run('B6')) await guard('B6', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    loadTestData('gain'); state.plates = state.plates.slice(0, 1); state.series = []; const pl = bPl(); pl.map = {}; state.rev++; _bUndo = [];
    const sel = (a, b) => bSetSel(new Set(PlateEngine.rect(a, b, bDims())));
    // controls first: column 1 no ligand
    sel({ r: 0, c: 0 }, { r: 7, c: 0 }); const m0 = bMode(); bMarkRole('noLigand');
    // then a block over EVERYTHING else, 2 replicates: eight rows -> four compounds; the control column is inside the drag and must be left alone
    sel({ r: 0, c: 0 }, { r: 7, c: 11 }); BM_REPS = 2; BM_DIR = 'right';
    document.getElementById('lm-name').value = 'Alpha'; document.getElementById('lm-top').value = '10'; document.getElementById('lm-unit').value = '\u00b5M'; document.getElementById('lm-fac').value = '3'; bRenderPanel();
    const plan = bDosePlan('cpd'); const planned = { zones: plan.zones.length, reps: plan.reps, n: plan.sp.n, skipped: plan.skipped, preview: document.getElementById('lm-preview').textContent };
    bApply();
    const names = state.series.map(s => s.name), a1 = pl.map.A1, b2 = pl.map.B2, h12 = pl.map.H12, a12 = pl.map.A12;
    const concs = [pl.map.A2.c, pl.map.A3.c, pl.map.A11.c, pl.map.A12.c];
    bUndo(); const afterUndo = Object.keys(bPl().map).length; bRedo();
    // a tracer series is one series however many rows
    state.assayMode = 'displacement'; sel({ r: 6, c: 1 }, { r: 7, c: 4 }); BM_MODE = 'trc'; BM_DIR = 'right'; document.getElementById('lm-top').value = '1'; document.getElementById('lm-unit').value = '\u00b5M'; document.getElementById('lm-fac').value = '2'; bApplyDose('trc');
    return { m0, planned, names, a1: a1 && a1.k, a2: pl.map.A2 && pl.map.A2.s, b2s: b2 && b2.s, h12s: h12 && h12.s, concs, afterUndo, afterRedo: Object.keys(bPl().map).length, trc: bPl().map.G2 && bPl().map.G2.k, trcC: [bPl().map.G2 && bPl().map.G2.c, bPl().map.G3 && bPl().map.G3.c], trcWells: Object.keys(bPl().map).filter(p => bPl().map[p].k === 'trc').length, series: state.series.length };
  });
  check('B6', 'a column on an empty plate reads as controls; a block as a dose series', r.m0 === 'ctl', r.m0);
  check('B6', 'eight rows of 11 points at 2 replicates is four compounds x 2 replicates x 11 points; the 8 control wells inside the drag are left out and the preview says so', r.planned.zones === 4 && r.planned.reps === 2 && r.planned.n === 11 && r.planned.skipped === 8 && /4 compounds/.test(r.planned.preview) && /8 control wells left out/.test(r.planned.preview), r.planned);
  check('B6', 'applying names them in order (Alpha, Alpha 2…), puts the same compound on both replicate rows, and leaves the control column a control', r.names.length === 4 && r.names[0] === 'Alpha' && r.names[1] === 'Alpha 2' && r.a1 === 'noLigand' && r.a2 === r.b2s && r.a2 !== r.h12s, { names: r.names, a1: r.a1 });
  check('B6', 'the concentrations are the series asked for: 10 µM at the left, 3-fold, 11 points (10 000 → 0.169 nM)', Math.abs(r.concs[0] - 10000) < 1e-6 && Math.abs(r.concs[1] - 10000 / 3) < 1e-6 && Math.abs(r.concs[3] - 10000 / Math.pow(3, 10)) < 1e-9, r.concs);
  check('B6', 'undo takes the whole block back to the controls alone (8 wells) and redo returns it', r.afterUndo === 8 && r.afterRedo >= 80, { afterUndo: r.afterUndo, afterRedo: r.afterRedo });
  check('B6', 'a tracer series is wells of one tracer (not a compound): G2:H5 at 1 µM, 2-fold, replaces what was there, and no phantom compound is left', r.trc === 'trc' && Math.abs(r.trcC[0] - 1000) < 1e-6 && Math.abs(r.trcC[1] - 500) < 1e-6 && r.trcWells === 8, { trc: r.trc, trcC: r.trcC, trcWells: r.trcWells, series: r.series });
  await ctx.close();
});

if (run('B7')) await guard('B7', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => ({ f: _xlsxSafeCell('=HYPERLINK("http://x","y")'), at: _xlsxSafeCell('@SUM(A1)'), plus: _xlsxSafeCell('+cmd'), dash: _xlsxSafeCell('--- ASSAY ---'), neg: _xlsxSafeCell('-0.5'), num: _xlsxSafeCell(-0.5), txt: _xlsxSafeCell('Compound A'), csv: _bCsvCell('=1+1'), csvOk: _bCsvCell('a,b') }));
  check('B7', 'a name that would be a formula leaves the workbook and the CSV as text, with a quote in front', r.f === '\'=HYPERLINK("http://x","y")' && r.at[0] === '\'' && r.plus[0] === '\'' && r.csv === '\'=1+1', r);
  check('B7', 'a header, a negative number or a name is left exactly as it is; a comma is quoted', r.dash === '--- ASSAY ---' && r.neg === '-0.5' && r.num === -0.5 && r.txt === 'Compound A' && r.csvOk === '"a,b"', r);
  await ctx.close();
});

if (run('B8')) await guard('B8', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const g = (R, C, f) => Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => f(r, c)).join('\t')).join('\n');
    const out = {}, sel = document.getElementById('plate-format');
    out.start = { plates: state.plates.length, wells: document.querySelectorAll('#well-grid .well').length, fmt: sel.value, above: !!(sel.compareDocumentPosition(document.getElementById('well-grid')) & Node.DOCUMENT_POSITION_FOLLOWING), bar: !!document.querySelector('#lm-platewrap #plate-format') };
    bPasteText(g(16, 24, (r, c) => 5000 + c)); out.p384 = { rows: bPl().rows, cols: bPl().cols, n: Object.keys(bPl().donor).length, fmt: sel.value, wells: document.querySelectorAll('#well-grid .well').length, plates: state.plates.length };
    bPasteText(g(16, 24, (r, c) => 100 + c)); out.both = bComplete(bPl());
    sel.value = '96'; sel.dispatchEvent(new Event('change')); out.to96 = { rows: bPl().rows, n: Object.keys(bPl().donor).length, wells: document.querySelectorAll('#well-grid .well').length, focus: document.activeElement === sel };
    bUndo(); out.undo = { rows: bPl().rows, n: Object.keys(bPl().donor).length, fmt: sel.value };
    // a 96-well block on a plate chosen as 384 stays on the 384 plate at A1; a 384 grid on a 96 plate grows it
    bDelPlate(0); sel.value = '384'; sel.dispatchEvent(new Event('change')); bPasteText(g(8, 12, () => 7)); out.small = { rows: bPl().rows, n: Object.keys(bPl().donor).length, a12: 'A12' in bPl().donor, a13: 'A13' in bPl().donor };
    bDelPlate(0); out.afterDel = { plates: state.plates.length, rows: bPl().rows };
    return out;
  });
  check('B8', 'Beacon opens on an empty 96-well plate with its size dropdown directly above it: nothing has to be loaded to see the plate', r.start.plates === 1 && r.start.wells === 96 && r.start.fmt === '96' && r.start.above && r.start.bar, r.start);
  check('B8', 'a 384-well grid pasted onto that plate makes it a 384-well plate (the dropdown follows) — one plate, not a second one', r.p384.rows === 16 && r.p384.cols === 24 && r.p384.n === 384 && r.p384.fmt === '384' && r.p384.wells === 384 && r.p384.plates === 1 && r.both, r.p384);
  check('B8', 'choosing the other size by hand clears that plate (readings are for the old wells), the focus leaves the dropdown so ⌘V reaches the plate, and ⌘Z brings it back', r.to96.rows === 8 && r.to96.n === 0 && r.to96.wells === 96 && !r.to96.focus && r.undo.rows === 16 && r.undo.n === 384 && r.undo.fmt === '384', { to96: r.to96, undo: r.undo });
  check('B8', 'a 96-well block pasted on a plate set to 384 stays on it, at A1, and does not shrink it; removing the last plate leaves an empty plate, not none', r.small.rows === 16 && r.small.n === 96 && r.small.a12 && !r.small.a13 && r.afterDel.plates === 1 && r.afterDel.rows === 16, { small: r.small, afterDel: r.afterDel });
  await ctx.close();
});

if (run('B9')) await guard('B9', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    loadTestData('gain'); state.plates = state.plates.slice(0, 1); state.series = []; bPl().map = {}; state.rev++; bAfterChange();
    const sel = (a, b) => bSetSel(new Set(PlateEngine.rect(a, b, bDims())));
    sel({ r: 0, c: 0 }, { r: 7, c: 0 }); bMarkRole('noLigand');
    sel({ r: 0, c: 1 }, { r: 7, c: 11 }); BM_REPS = 2; BM_DIR = 'right';
    const set = (n, t) => { document.getElementById('lm-name').value = n; document.getElementById('lm-top').value = t; document.getElementById('lm-unit').value = 'µM'; document.getElementById('lm-fac').value = '3'; bRenderPanel(); };
    set('Alpha', '10'); bApply();
    const col = n => getComputedStyle(document.querySelector('.well[data-pos="' + n + '"]')).backgroundColor;
    const snap = () => { const gr = document.getElementById('well-grid').getBoundingClientRect(); return { h: Math.round(gr.height), top: Math.round(gr.top), cell: Math.round(document.querySelector('.well[data-pos="A3"]').getBoundingClientRect().width), colors: ['A3', 'C3', 'E3', 'G3'].map(col), hex: state.series.map(s => bColor(s.id).join()) }; };
    const before = snap();
    // change one compound — a new name and a different top concentration (so the columns no longer share a concentration) — and press OK
    bSetSel(new Set(bWellsOf(m => m.s === state.series[1].id))); set('Beta', '20'); bApply();
    const after = snap();
    // a compound made later takes a colour no compound has, and removing one frees its colour for the next
    const keep0 = state.series.slice(1).map(s => s.id + ':' + bColor(s.id).join());
    bSetSel(new Set(bWellsOf(m => m.s === state.series[0].id))); bClearWells();
    const keep1 = state.series.map(s => s.id + ':' + bColor(s.id).join());
    sel({ r: 0, c: 2 }, { r: 1, c: 11 }); set('Gamma', '10'); bApply();
    return { before, after, keep0, keep1, ids: state.series.map(s => s.name + ':' + s.ci), gamma: state.series.filter(s => s.name === 'Gamma')[0].ci };
  });
  check('B9', 'pressing OK on a changed compound does not recolour the others, and the renamed one keeps its own colour', JSON.stringify(r.before.colors) === JSON.stringify(r.after.colors) && JSON.stringify(r.before.hex) === JSON.stringify(r.after.hex), { before: r.before, after: r.after });
  check('B9', 'the plate does not move or resize when a compound is changed (the band a concentration is written in stays while the plate has concentrations)', r.before.h === r.after.h && r.before.top === r.after.top && r.before.cell === r.after.cell, { before: r.before, after: r.after });
  check('B9', 'removing the first compound leaves every other compound its colour (the colour was its place in the list, so each moved up one)', JSON.stringify(r.keep0) === JSON.stringify(r.keep1), { keep0: r.keep0, keep1: r.keep1 });
  check('B9', 'a colour freed by removing a compound is the one the next compound takes (no two compounds share one)', new Set(r.ids.map(x => x.split(':')[1])).size === r.ids.length, r.ids);
  await ctx.close();
});

if (run('B10')) await guard('B10', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const zone = (pl, s, r0, c0, c1) => { for (let r = r0; r < r0 + 2; r++) for (let c = c0; c <= c1; c++) pl.map[bPos(r, c)] = { k: 'cpd', s: s.id, c: 1000 / Math.pow(3, c - c0) }; };
    const out = {};
    // plate 1: S1 on the right of the top rows, S2 on the left below it; plate 2: S3 (its own compound)
    state.plates = [bNewPlate(8, 12, null), bNewPlate(8, 12, null)]; state.series = []; state.queue = [];
    const s1 = bNewSeries('S1'), s2 = bNewSeries('S2'), s3 = bNewSeries('S3');
    zone(state.plates[0], s1, 0, 6, 11); zone(state.plates[0], s2, 2, 0, 5); zone(state.plates[1], s3, 0, 0, 5);
    bAfterChange(); bSetList(true);
    const names = () => bListRows().map(x => bSeriesById(x.sid).name).join();
    BM_LORD = 'cols'; out.cols = names(); BM_LORD = 'rows'; out.rows = names(); BM_LORD = 'made'; out.made = names();
    BM_LSCOPE = 'plate'; BM_LORD = 'cols'; out.thisPlate = names(); BM_LSCOPE = 'all'; out.all = names();
    // a column pasted into the first name fills downwards, across plates; what does not fit waits
    const inp = document.querySelector('#lm-idle .bc-nm[data-i="0"]'), dt = new DataTransfer(); dt.setData('text', 'Alpha\nBeta\nGamma\nDelta\nEpsilon');
    inp.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    out.afterPaste = names(); out.queue = state.queue.slice(); out.series = state.series.length;
    // the waiting names go to the next compounds made, in order
    BM_LIST = false; bSelect(new Set(PlateEngine.rect({ r: 4, c: 0 }, { r: 7, c: 5 }, bDims())), 'cpd'); BM_REPS = 2; BM_DIR = 'right';
    document.getElementById('lm-name').value = ''; document.getElementById('lm-top').value = '10'; document.getElementById('lm-unit').value = 'µM'; document.getElementById('lm-fac').value = '3'; bRenderPanel(); bApply();
    out.made2 = state.series.map(x => x.name).join(); out.queue2 = state.queue.slice();
    // typing a new name into a row renames that compound in place (same id, same colour) — and undo restores
    BM_LIST = true; bRenderPanel(); const row = bListRows()[0], id0 = row.sid, col0 = bColor(id0).join();
    const inp2 = document.querySelector('#lm-idle .bc-nm[data-i="0"]'); inp2.value = 'Renamed'; inp2.dispatchEvent(new Event('change', { bubbles: true }));
    out.renamed = { name: bSeriesById(id0).name, same: bListRows()[0].sid === id0 || !!bSeriesById(id0), col: bColor(id0).join() === col0 };
    bUndo(); out.undone = bSeriesById(id0).name;
    return out;
  });
  check('B10', 'the list is ordered as asked: down the columns (S2, whose wells are further left, first), along the rows (S1 first), or as made', r.cols === 'S2,S1' && r.rows === 'S1,S2' && r.made === 'S1,S2', r);
  check('B10', 'down columns puts the compound that is further left first, along rows the one that is higher first', r.thisPlate === 'S2,S1' && r.rows.indexOf('S1') < r.rows.indexOf('S2'), r);
  check('B10', 'one list can cover all plates (plate 1\'s compounds, then plate 2\'s) or just the one on screen', r.all === 'S2,S1,S3', r);
  check('B10', 'a column pasted into a name fills downwards in that order across plates, and what does not fit waits as the next names (nothing is invented)', r.afterPaste === 'Alpha,Beta,Gamma' && r.queue.join() === 'Delta,Epsilon' && r.series === 3, r);
  check('B10', 'compounds made next take the waiting names, in order, instead of "Compound A"', /Delta/.test(r.made2) && /Epsilon/.test(r.made2) && r.queue2.length === 0, r);
  check('B10', 'renaming a compound in the list keeps its colour, and ⌘Z puts the name back', r.renamed.name === 'Renamed' && r.renamed.col && r.undone === 'Alpha', r);
  await ctx.close();
});

if (run('B11')) await guard('B11', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    const out = {};
    loadTestData('gain'); state.plates = state.plates.slice(0, 1);
    const full = bGraphDoc(); out.fullKind = ChartKitCore.autoKind(full, ChartKitCore.defaults()); out.n = full.items.length; out.pts = full.items[0].points.length;
    // the x values are written in the unit the title names (top 10 µM → "10"), not in nM
    out.x0 = full.items[0].points[0].x; out.label0 = full.items[0].points[0].label; out.xt = full.xTitle;
    // the fit is the same curve the Results tab fits (EC50 in the same place): half-maximal in the doc's own unit
    const f = bFits().filter(x => x.name === 'Compound A')[0]; out.ec50nM = f.fit && f.ec50;
    const it = full.items[0], fn = it.fit.fn, P = f.fit.params; out.fnAtEc50 = fn(f.ec50 / 1000); out.fnTop = fn(10);
    // relative to the vehicle: the vehicle's own mean is 1
    const vehVals = []; bPl().map && Object.keys(bPl().map).forEach(p => { if (bPl().map[p].k === 'veh') vehVals.push(bVal(bPl(), p, true)); }); out.vehMean = vehVals.reduce((a, b) => a + b, 0) / vehVals.length;
    BG_Y = 'corr'; const raw = bGraphDoc(); BG_Y = 'rel'; out.ratio = raw.items[0].points[0].reps[0].v / full.items[0].points[0].reps[0].v; out.yRaw = raw.yTitle; out.yRel = full.yTitle;
    // three concentrations a compound: bars
    const pl = bPl(); Object.keys(pl.map).forEach(p => { const q = PlateEngine.rc(p); if (pl.map[p].k === 'cpd' && q.c > 4) delete pl.map[p]; }); state.rev++;
    out.threeKind = ChartKitCore.autoKind(bGraphDoc(), ChartKitCore.defaults());
    // the ids are the wells, so an omitted replicate is a well: it leaves the mean
    const d3 = bGraphDoc(), rep = d3.items[0].points[0].reps; const spec = ChartKitCore.withDefaults(null); const m0 = ChartKitCore.model(d3, spec)[0].pts[0].st.mean; spec.omit[rep[0].id] = true; const m1 = ChartKitCore.model(d3, spec)[0].pts[0].st.mean;
    out.omit = { ids: rep.map(r => r.id).join(), moved: Math.abs(m0 - m1) > 1e-9, ok: /^\d+:[A-P]\d+$/.test(rep[0].id) };
    return out;
  });
  check('B11', 'a compound with 10 concentrations is a curve, with 3 a bar chart (the editor decides from the data)', r.fullKind === 'xy' && r.threeKind === 'bars' && r.n === 4 && r.pts === 10, r);
  check('B11', 'the x values are in the unit the axis title names (10 µM is 10, not 10 000)', r.x0 === 10 && r.label0 === '10' && /µM/.test(r.xt), { x0: r.x0, label: r.label0, xt: r.xt });
  check('B11', 'the curve drawn is the curve Results fits: at the EC50 (in the chart\'s unit) it is half way, and at the top dose it is near the top', r.ec50nM > 0 && r.fnAtEc50 > 1 && r.fnAtEc50 < 2.5 && r.fnTop > r.fnAtEc50, { ec50: r.ec50nM, atEc50: r.fnAtEc50, top: r.fnTop });
  check('B11', 'relative to the vehicle divides by the vehicle\'s mean (corrected mBU / vehicle mean) and is labelled so', Math.abs(r.ratio / r.vehMean - 1) < 1e-6 && /vehicle/.test(r.yRel) && /mBU/.test(r.yRaw), { ratio: r.ratio, vehMean: r.vehMean });
  check('B11', 'a replicate is a well (plate:well), so omitting it takes that well out of the mean', r.omit.ok && r.omit.moved, r.omit);
  await ctx.close();
});

if (run('D2')) await guard('D2', async () => {
  const { ctx, pg } = await open('/apps/dora/dora.html');
  const r = await pg.evaluate(async () => {
    const row = (n, p, dc, dm, why, xmin, xmax) => ({ Sample_ID: n, Protein: p, DC50_nM: dc, Dmax_pct: dm, Flag: why ? 'Yes' : 'No', Flag_Reason: why, _xmin: xmin == null ? -9 : xmin, _xmax: xmax == null ? -5 : xmax });
    window._echoHist = [{ assayId: 'T', data: [row('EXACT', 'BRD4', 12, 90, ''), row('FLAT', 'BRD4', 0.4, 6, 'No effect (span 6%)'), row('HIGH', 'BRD4', 90000, 95, 'EC50>range', -9, -5), row('LOW', 'BRD4', 0.02, 95, 'EC50<range', -8, -5), row('ZERO', 'BRD4', 0, 70, '')] }];
    loadFromEcho(0); const t = n => RAW.find(c => c.compound === n).targets.BRD4;
    return { exact: [t('EXACT').dc50, t('EXACT').dc50_q], flat: [t('FLAT').dc50, t('FLAT').nd], high: [t('HIGH').dc50, t('HIGH').dc50_q], low: [t('LOW').dc50, t('LOW').dc50_q], zero: t('ZERO').dc50,
      cell: [...document.querySelectorAll('#table-body tr')].map(tr => tr.textContent.replace(/\s+/g, ' ').trim()) };
  });
  check('D2', 'a flat curve is n.d.: no potency (not its fitted 0.4 nM) and the table says n.d.', r.flat[0] === null && r.flat[1] === true && r.cell.some(c => /^FLAT\s+n\.d\./.test(c)), { flat: r.flat, cells: r.cell });
  check('D2', 'a midpoint past the doses is a bound at the dose limit: "> 10000 nM" (10^−5 M), "< 10 nM" (10^−8 M) — not the fitted 90000 / 0.02', r.high[0] === 10000 && r.high[1] === '>' && Math.abs(r.low[0] - 10) < 1e-6 && r.low[1] === '<', { high: r.high, low: r.low });
  check('D2', 'an ordinary fit is exact, and a potency of 0 is none', r.exact[0] === 12 && r.exact[1] === '' && r.zero === null, { exact: r.exact, zero: r.zero });
  await ctx.close();
});

if (run('D1')) await guard('D1', async () => {
  const { ctx, pg } = await open('/apps/dora/dora.html');
  const hasX = await pg.evaluate(() => !!window.XLSX); if (!hasX) { console.log('  – D1 skipped: SheetJS did not load'); await ctx.close(); return; }
  const r = await pg.evaluate(async () => {
    const out = {};
    const rows = [['Compound', 'BRD2 DC50', 'BRD2 Dmax', 'BRD4 DC50', 'BRD4 Dmax'],
      ['EXACT', 12.5, 92, 40, 90], ['UPPER', '>10000', 85, '> 5000', 70], ['LOWER', '<1', 96, 2, null], ['ZERO', 0, 80, -3, 60], ['NA', 'n/a', 70, 'ND', 50], ['COMMA', '12,5', 90, 30, 88],
      ['<img src=x onerror="window.__x=1">', 20, 91, 25, 92], ['=HYPERLINK("http://x","y")', 10, 90, 10, 90], ['NODMAX', 10, null, 10, null]];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Summary');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const { compounds, targets, meta } = parseXLSXBuf(new Uint8Array(buf));
    RAW = compounds; TARGETS = targets; META = meta; window.__x = 0;
    updateDC50SliderMax(); updateMeta(); renderHeader(); renderProteinToggles(); updateStats(); renderTable();
    const by = n => RAW.find(c => c.compound === n), t = (n, k) => by(n).targets[k];
    out.parsed = { exact: [t('EXACT', 'BRD2').dc50, t('EXACT', 'BRD2').dc50_q], upper: [t('UPPER', 'BRD2').dc50, t('UPPER', 'BRD2').dc50_q, t('UPPER', 'BRD4').dc50_q], lower: [t('LOWER', 'BRD2').dc50, t('LOWER', 'BRD2').dc50_q],
      zero: [t('ZERO', 'BRD2').dc50, t('ZERO', 'BRD4').dc50], na: [t('NA', 'BRD2').dc50, t('NA', 'BRD4').dc50], comma: t('COMMA', 'BRD2').dc50, noDmax: [t('NODMAX', 'BRD2').dmax] };
    qThreshDC50 = 100; qThreshDmax = 80;
    out.quality = { exact: quality(by('EXACT')), upper: quality(by('UPPER')), lower: quality(by('LOWER')), zero: quality(by('ZERO')), na: quality(by('NA')) };
    out.cell = [...document.querySelectorAll('#table-body tr')].find(tr => /UPPER/.test(tr.textContent)).querySelector('td.val-cell').textContent;
    out.cellMark = !![...document.querySelectorAll('#table-body tr')].find(tr => /UPPER/.test(tr.textContent)).querySelector('.bnd');
    selectCompound('NODMAX'); await new Promise(r => setTimeout(r, 200)); out.detail = [...document.querySelectorAll('#detail-grid .dp-row')].map(x => x.querySelector('.dp-label').textContent + '=' + x.querySelector('.dp-value').textContent);
    // the scatter: bounds are hollow triangles
    switchTab('scatter'); await new Promise(r => setTimeout(r, 400)); updateChart(); await new Promise(r => setTimeout(r, 300));
    const ds = chartInstance && chartInstance.data.datasets[0]; const bound = ds && ds.data.find(p => p.label === 'UPPER'), exact = ds && ds.data.find(p => p.label === 'EXACT');
    const fn = f => typeof f === 'function' ? f : () => f;
    out.scatter = ds ? { n: ds.data.length, boundStyle: fn(ds.pointStyle)({ raw: bound }), exactStyle: fn(ds.pointStyle)({ raw: exact }), boundFill: fn(ds.backgroundColor)({ raw: bound }), hasZero: ds.data.some(p => p.label === 'ZERO') } : null;
    // text is data
    switchTab('table'); renderTable(); await new Promise(r => setTimeout(r, 200)); out.xss = { ran: window.__x, imgs: document.querySelectorAll('img[src="x"]').length };
    const csvs = []; const old = URL.createObjectURL; URL.createObjectURL = b => { csvs.push(b); return 'blob:x'; }; HTMLAnchorElement.prototype.click = function () {}; exportCSV(); URL.createObjectURL = old;
    out.csvText = csvs[0] ? await csvs[0].text() : '';
    return out;
  });
  check('D1', 'a number is read as a number: "12,5" is 12.5, "n/a" and "ND" are none, and 0 or −3 is no potency (null), not a record-breaking one', r.parsed.exact[0] === 12.5 && r.parsed.comma === 12.5 && r.parsed.na[0] === null && r.parsed.na[1] === null && r.parsed.zero[0] === null && r.parsed.zero[1] === null, r.parsed);
  check('D1', '"> 10000", "> 5000" and "< 1" keep their direction next to the number', r.parsed.upper[0] === 10000 && r.parsed.upper[1] === '>' && r.parsed.upper[2] === '>' && r.parsed.lower[0] === 1 && r.parsed.lower[1] === '<' && r.parsed.exact[1] === '', r.parsed);
  check('D1', 'a lower bound can never pass "DC50 at most 100": > 10000 is not good however deep the degradation; < 1 with 96 % is; an exact 12.5 nM at 92 % is', r.quality.exact === 'good' && r.quality.upper !== 'good' && r.quality.lower === 'good' && r.quality.zero !== 'good' && r.quality.na === 'none', r.quality);
  check('D1', 'the table shows the sign (with a marker that explains it) and the detail card shows a missing Dmax as a dash with an empty bar, not "0"', r.cellMark && /^>/.test(r.cell.trim()) && r.detail.some(x => /Dmax/.test(x) && /=—/.test(x)), { cell: r.cell, detail: r.detail });
  check('D1', 'in the scatter a bound is a hollow triangle and an exact value a filled circle; a compound with no potency is not drawn', r.scatter && r.scatter.boundStyle === 'triangle' && r.scatter.exactStyle === 'circle' && r.scatter.boundFill === 'transparent' && !r.scatter.hasZero, r.scatter);
  check('D1', 'HTML in a name is text; a name that is a formula leaves the CSV with a quote in front', r.xss.ran === 0 && r.xss.imgs === 0 && /(^|\n)"?'=HYPERLINK/.test(r.csvText), { xss: r.xss, csv: r.csvText.split('\n').slice(0, 4) });
  await ctx.close();
});


if (run('B12')) await guard('B12', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const cell = () => pg.evaluate(() => Math.round(document.querySelector('.well[data-pos="A3"]') ? document.querySelector('.well[data-pos="A3"]').getBoundingClientRect().width : -1));
  const empty = await cell();
  await pg.setViewportSize({ width: 1280, height: 600 }); await pg.waitForTimeout(250); const short = await cell();
  await pg.setViewportSize({ width: 1280, height: 1100 }); await pg.waitForTimeout(250); const tall = await cell();
  await pg.evaluate(() => loadTestData('gain')); await pg.waitForTimeout(400); const loaded = await cell();
  await pg.evaluate(() => { bPl().name = 'A very long plate name that makes the steps and the strip above the plate wrap onto more lines than before'; bPl().nameSrc = 'user'; bAfterChange(); }); await pg.waitForTimeout(250); const wrapped = await cell();
  check('B12', 'the wells are the same size at 600 and 1100 px of window height', short === tall && short > 0, { short, tall });
  check('B12', 'the wells do not change size when data arrives or a long name makes the strip above wrap', empty === loaded && loaded === wrapped, { empty, loaded, wrapped });
  const cap = await pg.evaluate(() => { const w = document.querySelector('.well[data-pos="A3"]').getBoundingClientRect().width; return w; });
  check('B12', 'a 96-well plate is never drawn with wells above 60 px', cap <= 60.5, cap);
  await ctx.close();
});

if (run('B13')) await guard('B13', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  await pg.evaluate(() => { loadTestData('gain'); switchTab('results'); }); await pg.waitForTimeout(500);
  const st = () => pg.evaluate(() => ({ sel: RS_SEL, on: [...document.querySelectorAll('#rs-root .rs-tbl tbody tr.on')].map(r => r.dataset.k), title: (document.getElementById('rs-curve-t') || {}).textContent, names: bFits().map(f => f.key), cp: RS_PLATE }));
  const a = await st();
  await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(80); const b = await st();
  await pg.keyboard.press('End'); await pg.waitForTimeout(80); const c = await st();
  await pg.keyboard.press('Home'); await pg.waitForTimeout(80); const d = await st();
  await pg.keyboard.press('k'); await pg.waitForTimeout(80); const e = await st();
  check('B13', 'ArrowDown moves to the next compound: the row, the selection and the curve title follow', a.sel === a.names[0] && b.sel === a.names[1] && b.on.length === 1 && b.on[0] === b.sel && /Compound B/.test(b.title), { a: a.sel, b: b.sel, t: b.title });
  check('B13', 'End goes to the last compound, Home to the first, and k at the first stays there', c.sel === a.names[a.names.length - 1] && d.sel === a.names[0] && e.sel === a.names[0], { c: c.sel, d: d.sel, e: e.sel });
  const keep = await pg.evaluate(async () => { const t = document.querySelector('#rs-root .rs-tbl'); t.scrollTop = 7; rsPick(bFits()[1].key, false); return t.scrollTop; });
  check('B13', 'choosing a compound does not rebuild the table (its scroll position is kept)', keep === 7 || keep === 0 && (await pg.evaluate(() => document.querySelector('#rs-root .rs-tbl').scrollHeight <= document.querySelector('#rs-root .rs-tbl').clientHeight)), keep);
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(100); const f = await st();
  check('B13', 'ArrowRight switches the plate shown under Controls', f.cp === 1, f.cp);
  await pg.evaluate(() => { document.getElementById('rs-exp-btn').click(); }); await pg.waitForTimeout(80);
  await pg.keyboard.press('ArrowDown'); const g = await st();
  check('B13', 'with the export menu open the arrow keys leave the compounds alone', g.sel === (await pg.evaluate(() => RS_SEL)), g.sel);
  await ctx.close();
});

if (run('B14')) await guard('B14', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(() => {
    loadTestData('gain');
    const b = _bPrismBlock(true), rows = b.aoa, D = bDoseData(true), g0 = D.groups[0];
    const top = rows[0], sub = rows[1], first = rows[2];
    const veh = (() => { const v = []; state.plates.forEach(pl => Object.keys(pl.map).forEach(p => { if (pl.map[p].k === 'veh') { const x = bVal(pl, p, true); if (x !== null) v.push(x); } })); return v.reduce((a, c) => a + c, 0) / v.length; })();
    const raw = _bPrismBlock(false);
    return { names: top.filter(x => x), n: rows.length - 2, head: sub[0], reps: sub.slice(1, 5), xs: rows.slice(2).map(x => x[0]), cols: first.length, merges: b.merges.length, firstRel: first[1], expectRel: g0.pts[0].reps[0].v, rawFirst: raw.aoa[2][1], veh };
  });
  check('B14', 'one X column: concentration in nM, highest first, one row per concentration (10 µM is 10000)', r.head === 'Concentration (nM)' && r.xs[0] === 10000 && r.xs.length === 10 && r.xs.every((v, i) => i === 0 || v < r.xs[i - 1]), { head: r.head, xs: r.xs });
  check('B14', 'every compound is a name over its replicate columns: 4 compounds × (2 replicates × 2 plates) = 4 columns each, 16 + the X column', JSON.stringify(r.names) === JSON.stringify(['Compound A', 'Compound B', 'Compound C', 'Compound D']) && r.cols === 17 && r.reps.join() === 'Rep 1,Rep 2,Rep 3,Rep 4' && r.merges === 4, r);
  check('B14', 'the values are relative to the vehicle (1 = vehicle), not mBU', r.firstRel === +r.expectRel.toPrecision(6) && r.firstRel > 1 && r.firstRel < 4 && r.rawFirst > 100, { rel: r.firstRel, raw: r.rawFirst });
  const cp = await pg.evaluate(async () => { let got = ''; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { got = t; return Promise.resolve(); } }, configurable: true }); copyPrism(); await new Promise(r => setTimeout(r, 50)); return got; });
  const lines = cp.split('\n');
  check('B14', 'Copy for Prism puts the same table on the clipboard, tab separated', lines.length === 12 && lines[1].split('\t')[0] === 'Concentration (nM)' && lines[0].split('\t')[1] === 'Compound A' && lines[2].split('\t').length === 17, { n: lines.length, l1: lines[1] });
  await ctx.close();
});

if (run('B15')) await guard('B15', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(async () => {
    loadTestData('displacement'); bRename('Typed name'); const had = { plates: state.plates.length, ser: state.series.length, name: state.name, mode: state.assayMode };
    bClearAll(); document.getElementById('bea-ask-ok').click(); await new Promise(r => setTimeout(r, 50));
    const cleared = { plates: state.plates.length, rows: bPl().rows, cols: bPl().cols, reads: bHasReads(bPl()), ser: state.series.length, name: state.name, mode: state.assayMode, hid: state.hid, btn: document.getElementById('bn-clear').hidden };
    bUndo(); const back = { plates: state.plates.length, ser: state.series.length, name: state.name, mode: state.assayMode };
    return { had, cleared, back };
  });
  check('B15', 'Clear all leaves one empty 96-well plate, no compounds, no name, protein–protein, and hides itself', r.cleared.plates === 1 && r.cleared.rows === 8 && r.cleared.cols === 12 && !r.cleared.reads && r.cleared.ser === 0 && r.cleared.name === '' && r.cleared.mode === 'gain' && r.cleared.btn, r);
  check('B15', '⌘Z brings the whole analysis back (plates, compounds, name, assay)', r.back.plates === r.had.plates && r.back.ser === r.had.ser && r.back.name === r.had.name && r.back.mode === 'displacement', r);
  await ctx.close();
});

if (run('B16')) await guard('B16', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  await pg.evaluate(() => { loadTestData('gain'); bRename('My NanoBRET run'); }); await pg.waitForTimeout(1500);
  const a = await pg.evaluate(() => ({ n: BH.list.length, name: BH.list[0] && BH.list[0].name, comp: BH.list[0] && BH.list[0].compounds.length, hid: state.hid, tab: document.getElementById('bh-n').textContent }));
  const b = await pg.evaluate(async () => { bClearAll(); document.getElementById('bea-ask-ok').click(); await new Promise(r => setTimeout(r, 900)); const id = BH.list[0].id; bhOpen(id); await new Promise(r => setTimeout(r, 100)); return { n: BH.list.length, plates: state.plates.length, ser: state.series.map(s => s.name), name: state.name, ready: bReadyPlates().length, tab: activeTab, hid: state.hid === id, fits: bFits().length }; });
  check('B16', 'an analysis with readings is saved by itself under its name', a.n === 1 && a.name === 'My NanoBRET run' && a.comp === 4 && a.tab === '1', a);
  check('B16', 'opening it after Clear all brings back the plates, compounds, name and fits, and lands on Results', b.plates === 2 && b.ser.length === 4 && b.name === 'My NanoBRET run' && b.ready === 2 && b.fits === 4 && b.tab === 'results' && b.hid, b);
  const c = await pg.evaluate(async () => { const id = BH.list[0].id; bRename('Renamed run'); await new Promise(r => setTimeout(r, 1200)); return { n: BH.list.length, name: BH.list[0].name }; });
  check('B16', 'renaming the analysis renames its History entry (it does not add a second one)', c.n === 1 && c.name === 'Renamed run', c);
  const d = await pg.evaluate(async () => { bClearAll(); document.getElementById('bea-ask-ok').click(); await new Promise(r => setTimeout(r, 1000)); return { n: BH.list.length }; });
  check('B16', 'an empty analysis is not kept, and Clear all does not delete what History holds', d.n === 1, d);
  await ctx.close();
});

if (run('B17')) await guard('B17', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(async () => {
    const o = {}; bsOpen(2); await new Promise(r => setTimeout(r, 100));
    const inp = k => document.querySelector('#bs-ctls input[data-role="' + k + '"]');
    const type = (k, v) => { const i = inp(k); i.value = v; i.dispatchEvent(new Event('change', { bubbles: true })); };
    type('noLigand', 'A1:D1'); type('veh', 'A2:H2, E1:H1');
    const wells = k => Object.keys(bPl().map).filter(p => bPl().map[p].k === k).sort();
    o.nl = wells('noLigand'); o.veh = wells('veh'); o.nlShown = inp('noLigand').value; o.vehShown = inp('veh').value;
    type('veh', ''); o.vehCleared = wells('veh').length;
    type('mock', 'Z99'); o.bad = wells('mock').length; o.badClass = inp('mock').parentNode.classList.contains('bad');
    type('veh', 'A2:H2'); type('mock', 'E5');
    bsGo(3); document.getElementById('bs-names').value = 'Alpha\nBeta\nGamma'; document.getElementById('bs-names').dispatchEvent(new Event('input', { bubbles: true }));
    o.plan = document.getElementById('bs-plan').textContent;
    document.getElementById('bs-place').click(); await new Promise(r => setTimeout(r, 50));
    o.ser = state.series.map(s => s.name); const m = bPl().map;
    const ofS = id => Object.keys(m).filter(p => m[p].s === id);
    o.shape = state.series.map(s => bShapeOf(bPl(), ofS(s.id)));
    o.onControl = Object.keys(m).filter(p => bIsFlat(m[p].k)).some(p => m[p].s) || !m.E5 || m.E5.k !== 'mock'; o.cells = Object.keys(m).filter(p => m[p].k === 'cpd').length;
    o.minCol = Math.min.apply(null, Object.keys(m).filter(p => m[p].k === 'cpd').map(p => PlateEngine.rc(p).c));
    o.top = Math.max.apply(null, Object.keys(m).filter(p => m[p].k === 'cpd').map(p => m[p].c));
    bsGo(4); o.review = document.getElementById('bs-p-review').textContent;
    bsClose(); bUndo(); o.afterUndo = state.series.length;
    return o;
  });
  check('B17', 'typed ranges mark exactly those wells, are shown back normalised, and emptying a box clears the control', JSON.stringify(r.nl) === JSON.stringify(['A1', 'B1', 'C1', 'D1']) && r.veh.length === 12 && r.vehShown === 'A2:D2, E1:H2' && r.vehCleared === 0, { nl: r.nl, veh: r.veh.length, shown: [r.nlShown, r.vehShown] });
  check('B17', 'a range that names no well changes nothing and marks the box', r.bad === 0 && r.badClass, { bad: r.bad, cls: r.badClass });
  check('B17', 'placing 3 names makes 3 compounds of 10 points × 2 replicates, 10 µM at the top, starting after the control columns, and a block that would land on a control well (E5) slides past it instead of overwriting it', JSON.stringify(r.ser) === JSON.stringify(['Alpha', 'Beta', 'Gamma']) && r.shape.every(x => x.pts === 10 && x.reps === 2) && r.cells === 60 && r.top === 10000 && r.minCol === 2 && !r.onControl, r);
  check('B17', 'Review says what is missing (no-ligand wells are marked but a vehicle on one column only is not a problem; compounds are placed) and ⌘Z undoes the placement', /Before you read the results/.test(r.review) && r.afterUndo === 0, { rv: r.review.slice(0, 160), u: r.afterUndo });
  await ctx.close();
});

if (run('B19')) await guard('B19', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  const r = await pg.evaluate(async () => {
    const o = {}; loadTestData('gain'); await new Promise(r => setTimeout(r, 300));
    state.plates.forEach(pl => { pl.map = {}; for (let i = 0; i < 8; i++) pl.map[bPos(i, 0)] = { k: i < 4 ? 'noLigand' : 'veh' }; }); state.series = []; state.queue = []; state.plate = 0; bAfterChange();
    bsOpen(3); await new Promise(r => setTimeout(r, 100));
    const names = id => Object.keys(state.plates[id].map).map(p => state.plates[id].map[p]).filter(m => m.k === 'cpd').map(m => bSeriesById(m.s).name).filter((v, i, a) => a.indexOf(v) === i);
    const type = v => { const t = document.getElementById('bs-names'); t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); };
    type(Array.from({ length: 10 }, (_, i) => 'ARV-' + (i + 1)).join('\n'));
    o.caps = bsSplit().caps; o.boxes = [0, 1].map(i => document.getElementById('bs-pl-' + i).value.split('\n').length);
    document.getElementById('bs-place').click(); await new Promise(r => setTimeout(r, 50));
    o.p1 = names(0); o.p2 = names(1); o.queue = state.queue.slice();
    o.sameSeries = state.series.length;
    // by hand: move ARV-4 to plate 2
    const b0 = document.getElementById('bs-pl-0'), b1 = document.getElementById('bs-pl-1');
    b0.value = 'ARV-1\nARV-2\nARV-3'; b0.dispatchEvent(new Event('input', { bubbles: true })); b1.value = 'ARV-4\nARV-5'; b1.dispatchEvent(new Event('input', { bubbles: true }));
    o.manual = bsSplit().per.map(a => a.length); o.foot = document.getElementById('bs-dfoot').textContent;
    document.getElementById('bs-place').click(); await new Promise(r => setTimeout(r, 50));
    o.m1 = names(0); o.m2 = names(1);
    // the same on every plate: replicate plates
    document.querySelector('#bs-dist-seg button[data-g="same"]').click(); await new Promise(r => setTimeout(r, 50));
    type('Alpha\nBeta'); document.getElementById('bs-place').click(); await new Promise(r => setTimeout(r, 50));
    o.s1 = names(0); o.s2 = names(1);
    // one plate only: no choice offered, the names that do not fit wait
    bDelPlate(1); bsGo(3); await new Promise(r => setTimeout(r, 50)); o.seg = !!document.getElementById('bs-dist-seg');
    type(Array.from({ length: 6 }, (_, i) => 'Q' + i).join('\n')); document.getElementById('bs-place').click(); await new Promise(r => setTimeout(r, 50));
    o.one = names(0); o.oneQueue = state.queue.slice();
    return o;
  });
  check('B19', 'each plate holds 4 compounds of 2 replicates beside its control column, and the box for each plate says what goes on it', r.caps[0] === 4 && r.caps[1] === 4 && r.boxes[0] === 4 && r.boxes[1] === 4, { caps: r.caps, boxes: r.boxes });
  check('B19', 'ten names on two plates: plate 1 takes ARV-1…4, plate 2 ARV-5…8 in the same order, and the two that fit nowhere wait', JSON.stringify(r.p1) === JSON.stringify(['ARV-1', 'ARV-2', 'ARV-3', 'ARV-4']) && JSON.stringify(r.p2) === JSON.stringify(['ARV-5', 'ARV-6', 'ARV-7', 'ARV-8']) && JSON.stringify(r.queue) === JSON.stringify(['ARV-9', 'ARV-10']) && r.sameSeries === 8, r);
  check('B19', 'a name moved by hand to the other plate is placed there, the footer says it was placed by hand, and the placement follows the boxes', JSON.stringify(r.manual) === '[3,2]' && /by hand/.test(r.foot) && JSON.stringify(r.m1) === JSON.stringify(['ARV-1', 'ARV-2', 'ARV-3']) && JSON.stringify(r.m2) === JSON.stringify(['ARV-4', 'ARV-5']), { manual: r.manual, foot: r.foot, m1: r.m1, m2: r.m2 });
  check('B19', '"the same on every plate" puts the same compounds on both plates (replicates)', JSON.stringify(r.s1) === JSON.stringify(['Alpha', 'Beta']) && JSON.stringify(r.s2) === JSON.stringify(['Alpha', 'Beta']), { s1: r.s1, s2: r.s2 });
  check('B19', 'with one plate there is nothing to choose, and the names past what it holds wait', !r.seg && r.one.length === 4 && r.oneQueue.length === 2, { seg: r.seg, one: r.one, q: r.oneQueue });
  await ctx.close();
});

if (run('B20')) await guard('B20', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 } });
  await ctx.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs.*xlsx/.test(u)) return r.continue(); r.abort(); });
  const pg = await ctx.newPage(); pg.on('pageerror', e => pageErrs.push('beacon: ' + String(e && e.message || e)));
  await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await pg.goto(BASE + '/apps/beacon/beacon.html'); await pg.waitForTimeout(900);
  await pg.evaluate(async () => { loadTestData('gain'); await new Promise(r => setTimeout(r, 300)); state.plates = state.plates.slice(0, 1); state.plate = 0; state.plates[0].map = {}; state.series = []; bAfterChange(); const d = document.getElementById('bs'); if (d) d.classList.add('hidden'); });
  await pg.waitForTimeout(300);
  const pos = p => pg.evaluate(p => { const r = document.querySelector('#well-grid .well[data-pos="' + p + '"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, p);
  const box = () => pg.evaluate(() => { const b = _bBox(BM_SEL); return { n: BM_SEL.size, r0: b.r0, r1: b.r1, c0: b.c0, c1: b.c1 }; });
  const tall = await pg.evaluate(() => document.getElementById('well-grid').getBoundingClientRect().bottom > window.innerHeight);
  // a drag held at the bottom of a window shorter than the plate scrolls the page to the last rows, and past the right edge it ends on column 12
  const A = await pos('A2'); await pg.mouse.move(A.x, A.y); await pg.mouse.down();
  await pg.mouse.move(A.x + 200, A.y + 200, { steps: 6 }); await pg.mouse.move(900, 690, { steps: 6 }); await pg.waitForTimeout(900);
  const mid = await pg.evaluate(() => ({ n: BM_SEL.size, top: _bScroller().scrollTop }));
  await pg.mouse.move(1270, 690, { steps: 4 }); await pg.waitForTimeout(400); await pg.mouse.up(); await pg.waitForTimeout(150);
  const a = await box();
  await pg.evaluate(() => { _bScroller().scrollTop = 0; }); await pg.waitForTimeout(150);
  // a drag out over the row labels and the gaps still ends where it was released
  const B = await pos('B3'), C = await pos('C5'); await pg.mouse.move(B.x, B.y); await pg.mouse.down(); await pg.mouse.move(B.x - 300, B.y, { steps: 5 }); await pg.mouse.move(C.x, C.y, { steps: 8 }); await pg.mouse.up(); await pg.waitForTimeout(150);
  const b = await box();
  check('B20', 'the plate is taller than the window here (the case that needs scrolling)', tall, tall);
  check('B20', 'a drag held at the bottom edge scrolls the page by itself', mid.top > 100, mid);
  check('B20', 'and one carried past the plate ends on the edge: A2 to H12 is 88 wells, not the wells the pointer last crossed', a.n === 88 && a.r1 === 7 && a.c1 === 11 && a.r0 === 0 && a.c0 === 1, a);
  check('B20', 'a drag that wanders out over the labels and comes back ends exactly where it was released (B3 to C5 = 6 wells)', b.n === 6 && b.r0 === 1 && b.r1 === 2 && b.c0 === 2 && b.c1 === 4, b);
  await ctx.close();
});

if (run('B18')) await guard('B18', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'shell/hub-shell.html'), 'utf8');
  check('B18', 'the shell hides Beacon\'s whole header like every other app (it hid only the logo and name and left a 48 px white band)', /var embedStyle = common \+ 'header:not\(\[class\]\)\{display:none!important;\}';/.test(src) && !/id === 'beacon'\s*\?\s*common/.test(src), '');
});

await browser.close(); server.close();
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort();
for (const inv of invs) { const f = out.filter(x => x.inv === inv); console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`); (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`)); }
const realErrs = pageErrs.filter(e => !/Failed to load resource|net::ERR/i.test(e));
if (realErrs.length) { console.log('  ✗ page errors:'); [...new Set(realErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + realErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll analysis invariants hold.');
process.exit(failed ? 1 : 0);
