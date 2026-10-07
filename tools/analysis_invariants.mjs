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
//   B1  a range is on the plate  Beacon's well ranges never invent wells outside a 24-column plate: "A1:A99999999" is 24 wells in a blink, "A0" and "A25" are none.
//   D1  a bound is a bound       Dora keeps "> 10000" and "< 1" as bounds (shown with their sign, drawn hollow, never "good" when the bound is in the wrong direction), a DC50 of 0
//                                or less and "n/a" are no potency, and a missing Dmax is a dash, not a 0 with an empty bar.
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
    const t0 = performance.now(), big = parseWellRange('A1:A99999'), big2 = parseWellRange('A1:P99999'), ms = performance.now() - t0;
    return { bigN: big.length, big2N: big2.length, ms, zero: parseWellRange('A0'), over: parseWellRange('A25'), rev: parseWellRange('A12:A1').join(), fwd: parseWellRange('A01-A12').join(), rect: parseWellRange('B2:C3').join(), lower: parseWellRange('b2:c3').join(), list: parseWellRange('A1, b2, Z9, A0, C24, C25').join(), col: parseWellRange('A3-P3').length };
  });
  check('B1', 'a column past the plate is clipped to it: "A1:A99999" is 24 wells and "A1:P99999" is 384, instantly', r.bigN === 24 && r.big2N === 384 && r.ms < 200, { bigN: r.bigN, big2N: r.big2N, ms: Math.round(r.ms) });
  check('B1', 'column 0 and column 25 are not wells; a list keeps the wells that exist and drops the rest', r.zero.length === 0 && r.over.length === 0 && r.list === 'A01,B02,C24', { zero: r.zero, over: r.over, list: r.list });
  check('B1', 'ranges still mean what they did: reversed or forward the same wells, a rectangle, a column, either case', r.rev === 'A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12' && r.fwd === r.rev && r.rect === 'B02,B03,C02,C03' && r.lower === r.rect && r.col === 16, r);
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

await browser.close(); server.close();
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort();
for (const inv of invs) { const f = out.filter(x => x.inv === inv); console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`); (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`)); }
const realErrs = pageErrs.filter(e => !/Failed to load resource|net::ERR/i.test(e));
if (realErrs.length) { console.log('  ✗ page errors:'); [...new Set(realErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + realErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll analysis invariants hold.');
process.exit(failed ? 1 : 0);
