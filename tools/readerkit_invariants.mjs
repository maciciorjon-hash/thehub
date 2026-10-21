// Invariants for a reader workbook that holds several plates (a PHERAstar run exported whole: a grid sheet and a settings sheet per plate, newest
// first). One kit (tools/readerkit) finds the plates; Echo, Lumina and Beacon each take them in. Each check was proven by putting the bug back.
//
//   R1  plates in reading order   The plates of a workbook come out in the order they were read (Test ID, not the order of the sheets), each named for its ID1, with its own wells; a 384 grid is 16 × 24.
//   R2  a file is not a split     A workbook with one plate is returned untouched (the same File); a workbook with several is one file per plate, named for the plate, holding that plate's readings.
//   R3  Lumina: one plate each    Dropping the workbook fills Plate 1, 2, 3… in reading order, named for the plates, every plate with its own readings.
//   R4  Echo reads each plate     Each plate's file goes through Echo's own reader and gives that plate's wells under that plate's name.
//   R5  Beacon: donor + acceptor  A workbook whose plates each have two grids is complete plates (first grid donor, second acceptor), named for the plate; a plain one-plate grid file still goes the old way.
//   R6  the real export           (only with --real=path) the user's file reads as the plates it holds.
//   R7  Lumina reads GloMax      A GloMax workbook (Results sheet, one headed grid per reading) is one plate whose signal is its luminescence — not the
//                                settings sheet, not the fluorescence written first; a 96 grid on a 384 plate says so; fluorescence-only is read as the signal.
//   R8  Beacon reads GloMax      A BRET export (ratio, Donor, Acceptor) fills both channels of one plate named for the file and does not read the ratio; two
//                                plain luminescence grids are donor then acceptor; one grid is the channel the plate waits for.
//   R9  the real GloMax export   (only with --glomax=path) a real double-read file reads in Lumina as its 384 luminescence wells.
//
// Usage (repo root):  node tools/readerkit_invariants.mjs [--only=R1,R3] [--real=path.xlsx]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const out = [], counts = {};
const check = (inv, name, ok, detail) => { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) }); };
const guard = async (inv, fn) => { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = path.join(ROOT, u);
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const pageErrs = [];
async function open(p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs.*xlsx/.test(u)) return r.continue(); r.abort(); });
  const pg = await ctx.newPage(); pg.on('pageerror', e => pageErrs.push(p + ': ' + String(e && e.message || e)));
  await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await pg.goto(BASE + p); await pg.waitForTimeout(900); return { ctx, pg };
}
// A PHERAstar-shaped workbook, built in the page: `plates` = [{id, testId, rows, cols, grids:[label…], base}], written newest first, suffixes _N like the reader does.
const BUILD = `window.__build = function(plates, fname){
  var L = 'ABCDEFGHIJKLMNOP', wb = XLSX.utils.book_new(), order = plates.slice().reverse();
  order.forEach(function(p, k){
    var sfx = k === order.length - 1 ? '' : '_' + (order.length - 1 - k);
    var rows = [['', ''], ['', ''], ['User: USER'], ['Path: C:\\\\x'], ['Test ID: ' + p.testId], ['Test Name: run'], ['Date: 19/10/2026'], ['Time: 14:2' + p.testId % 10], ['ID1: ' + p.id], ['Luminescence'], [], [], []];
    p.grids.forEach(function(lab, g){
      rows.push([]); rows.push(['', 'Raw Data (' + lab + ')']);
      var h = ['']; for (var c = 1; c <= p.cols; c++) h.push(c); rows.push(h);
      for (var r = 0; r < p.rows; r++) { var row = [L[r]]; for (var c2 = 0; c2 < p.cols; c2++) row.push(p.base + g * 1000 + r * 100 + c2); rows.push(row); }
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Microplate End point' + sfx);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['User: USER'], ['Test ID: ' + p.testId], ['ID1: ' + p.id], [''], ['Measurement type:', 'Luminescence'], ['Gain:', 2500]]), 'Protocol Information' + sfx);
  });
  var buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], fname || 'run_All.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};`;
const THREE = [{ id: 'RUN_72h_1', testId: 11487, rows: 8, cols: 12, grids: ['LUM plus'], base: 10000 }, { id: 'RUN_72h_2', testId: 11488, rows: 8, cols: 12, grids: ['LUM plus'], base: 20000 }, { id: 'RUN_72h_3', testId: 11489, rows: 8, cols: 12, grids: ['LUM plus'], base: 30000 }];

if (run('R1') || run('R2')) await guard('R1', async () => {
  const { ctx, pg } = await open('/apps/lumina/lumina.html');
  await pg.evaluate(BUILD);
  const r = await pg.evaluate(async (THREE) => {
    const f = __build(THREE), wb = XLSX.read(await f.arrayBuffer(), { type: 'array', raw: true });
    const ps = RDR.plates(wb), o = { sheets: wb.SheetNames.slice(0, 2) };
    o.names = ps.map(p => p.name); o.n = ps.map(p => p.blocks[0].n); o.first = ps.map(p => p.blocks[0].vals.A1); o.dims = ps.map(p => [p.rows, p.cols]);
    o.proto = ps.map(p => !!p.protocolRows && p.meta['Test ID']);
    const big = __build([{ id: 'BIG', testId: 5, rows: 16, cols: 24, grids: ['LUM'], base: 1 }, { id: 'BIG2', testId: 6, rows: 16, cols: 24, grids: ['LUM'], base: 1 }], 'big.xlsx');
    const pb = RDR.plates(XLSX.read(await big.arrayBuffer(), { type: 'array', raw: true }));
    o.big = pb.map(p => [p.rows, p.cols, p.blocks[0].n]);
    const one = __build([THREE[0]], 'one.xlsx'), ex1 = await RDR.expand([one]);
    o.same = ex1.length === 1 && ex1[0] === one;
    const ex = await RDR.expand([f]);
    o.files = ex.map(x => x.name);
    o.back = [];
    for (const x of ex) { const p = RDR.plates(XLSX.read(await x.arrayBuffer(), { type: 'array', raw: true })); o.back.push([p.length, p[0] && p[0].blocks[0].vals.A1, p[0] && p[0].name]); }
    return o;
  }, THREE);
  if (run('R1')) {
    check('R1', 'sheets are newest first', r.sheets[0] === 'Microplate End point_2' && /^Protocol/.test(r.sheets[1]), r.sheets);
    check('R1', 'reading order, named for ID1', JSON.stringify(r.names) === '["RUN_72h_1","RUN_72h_2","RUN_72h_3"]', r.names);
    check('R1', 'each plate its own wells', JSON.stringify(r.first) === '[10000,20000,30000]' && r.n.every(n => n === 96), { first: r.first, n: r.n });
    check('R1', 'a 96 grid is 8 × 12, a 384 grid 16 × 24', r.dims.every(d => d[0] === 8 && d[1] === 12) && JSON.stringify(r.big) === '[[16,24,384],[16,24,384]]', { dims: r.dims, big: r.big });
    check('R1', 'its settings sheet comes with it', JSON.stringify(r.proto) === '["11487","11488","11489"]', r.proto);
  }
  if (run('R2')) {
    check('R2', 'one plate: the same file, untouched', r.same === true);
    check('R2', 'several: one file per plate, named for it', JSON.stringify(r.files) === '["RUN_72h_1.xlsx","RUN_72h_2.xlsx","RUN_72h_3.xlsx"]', r.files);
    check('R2', 'each file holds its own plate', JSON.stringify(r.back) === '[[1,10000,"RUN_72h_1"],[1,20000,"RUN_72h_2"],[1,30000,"RUN_72h_3"]]', r.back);
  }
  await ctx.close();
});

if (run('R3')) await guard('R3', async () => {
  const { ctx, pg } = await open('/apps/lumina/lumina.html');
  await pg.evaluate(BUILD);
  const r = await pg.evaluate(async (THREE) => {
    await handleReaderFiles([__build(THREE)]);
    return state.plates.map(p => ({ name: p.name, n: Object.keys(p.signal).length, a1: p.signal.A1, file: p.file }));
  }, THREE);
  check('R3', 'three plates', r.length === 3, r);
  check('R3', 'named for the plates, in reading order', JSON.stringify(r.map(p => p.name)) === '["RUN_72h_1","RUN_72h_2","RUN_72h_3"]', r.map(p => p.name));
  check('R3', 'every plate its own readings', JSON.stringify(r.map(p => [p.n, p.a1])) === '[[96,10000],[96,20000],[96,30000]]', r);
  await ctx.close();
});

if (run('R4')) await guard('R4', async () => {
  const { ctx, pg } = await open('/apps/echo/echo.html');
  await pg.evaluate(BUILD);
  const r = await pg.evaluate(async (THREE) => {
    const files = await RDR.expand([__build(THREE)]), o = [];
    for (const f of files) {
      const stem = f.name.replace(/\.[^.]+$/, ''), w = _parsePHERAstarXLS(await f.arrayBuffer(), stem, '');
      const a1 = w.find(x => x.well === 'A01');
      o.push({ stem, bk: [...new Set(w.map(x => x.barcode))], n: w.filter(x => x.measurement !== null).length, a1: a1 && a1.measurement });
    }
    return o;
  }, THREE);
  check('R4', 'a plate per file, its own barcode', JSON.stringify(r.map(x => x.bk)) === '[["RUN_72h_1"],["RUN_72h_2"],["RUN_72h_3"]]', r);
  check('R4', 'its own readings', JSON.stringify(r.map(x => [x.n, x.a1])) === '[[96,10000],[96,20000],[96,30000]]', r);
  await ctx.close();
});

if (run('R5')) await guard('R5', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  await pg.evaluate(BUILD);
  const r = await pg.evaluate(async () => {
    const two = [{ id: 'NB_1', testId: 1, rows: 8, cols: 12, grids: ['460', '610-LP'], base: 1000 }, { id: 'NB_2', testId: 2, rows: 8, cols: 12, grids: ['460', '610-LP'], base: 2000 }];
    await bHandleFiles([__build(two, 'nb.xlsx')]);
    const o = { plates: state.plates.map(p => ({ name: p.name, d: Object.keys(p.donor).length, a: Object.keys(p.acceptor).length, d1: p.donor.A1, a1: p.acceptor.A1, complete: bComplete(p) })) };
    return o;
  });
  check('R5', 'two plates', r.plates.length === 2, r.plates);
  check('R5', 'named for the plates', JSON.stringify(r.plates.map(p => p.name)) === '["NB_1","NB_2"]', r.plates.map(p => p.name));
  check('R5', 'first grid donor, second acceptor, 96 each', r.plates.every(p => p.d === 96 && p.a === 96 && p.complete) && r.plates[0].d1 === 1000 && r.plates[0].a1 === 2000 && r.plates[1].d1 === 2000 && r.plates[1].a1 === 3000, r.plates);
  await ctx.close();
});

if (run('R6') && args.real) await guard('R6', async () => {
  const { ctx, pg } = await open('/apps/lumina/lumina.html');
  const b64 = fs.readFileSync(path.resolve(String(args.real))).toString('base64');
  const r = await pg.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    await handleReaderFiles([new File([u], 'real.xlsx')]);
    return state.plates.map(p => [p.name, Object.keys(p.signal).length]);
  }, b64);
  console.log('real export →', JSON.stringify(r));
  check('R6', 'the real export is several plates with readings', r.length >= 2 && r.every(p => p[1] > 0), r);
  await ctx.close();
});

// A GloMax-shaped workbook: settings sheet, Results (headed grids in the order given), Results By Well.
const GLO = `window.__glo = function(fname, name, chans){
  var L = 'ABCDEFGHIJKLMNOP', aoa = [[], [,,,'Protocol: Test'], [,,,'Result: ' + name], [], [], []];
  chans.forEach(function(ch){
    var R = ch.rows || 8, C = ch.cols || 12;
    if (ch.head) aoa.push([ch.head]);
    var h = ['', ch.own || 'Reading:', '', ch.own ? '' : 1, '']; for (var c = 1; c <= C; c++) h.push(c); aoa.push(h);
    for (var r = 0; r < R; r++) { var row = ['', '', '', '', L[r]]; for (var c2 = 0; c2 < C; c2++) row.push(ch.base + r * 100 + c2); aoa.push(row); }
    aoa.push([]);
  });
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[], [,,,'Test'], [], [], [], [], ['Executed by:', , , 'PC'], [, 'Plate Type:', , 'plate']]), 'Test');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Results');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[], [,,,'Protocol: Test']]), 'Results By Well');
  return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], fname, { type: 'application/octet-stream' });
};`;

if (run('R7')) await guard('R7', async () => {
  const { ctx, pg } = await open('/apps/lumina/lumina.html');
  await pg.evaluate(GLO);
  const r = await pg.evaluate(async () => {
    const o = {}, read = async (f) => { await handleReaderFiles([f]); const p = state.plates[state.plate]; return { n: Object.keys(p.signal).length, a1: p.signal.A1, h12: p.signal.H12, name: p.name, file: p.file, toast: (document.querySelector('.toast, #toast') || {}).innerText || '' }; };
    // double read, fluorescence first (as the instrument writes it); 96-well plate on screen
    o.dbl = await read(__glo('dbl.xlsx', 'dbl', [{ head: 'Fluorescence', base: 50000 }, { head: 'Luminescence', base: 1000 }]));
    state.plates.forEach(p => { p.signal = {}; });
    o.fl = await read(__glo('fl.xlsx', 'fl', [{ head: 'Fluorescence', base: 50000 }]));
    // a 384 grid on a 96-well plate: only the plate's own wells, and the shape is said
    state.plates.forEach(p => { p.signal = {}; });
    o.big = await read(__glo('big.xlsx', 'big', [{ head: 'Luminescence', base: 1000, rows: 16, cols: 24 }]));
    o.bigNote = _lmReadShape;
    return o;
  });
  check('R7', 'a double read gives the luminescence (A1 1000), 96 wells, not the fluorescence written first', r.dbl.n === 96 && r.dbl.a1 === 1000 && r.dbl.h12 === 1000 + 700 + 11, r.dbl);
  check('R7', 'the plate is named for the file', r.dbl.name === 'dbl', r.dbl);
  check('R7', 'a fluorescence-only file is read as the signal', r.fl.n === 96 && r.fl.a1 === 50000, r.fl);
  check('R7', 'a 384 grid on a 96-well plate reads the first 8 × 12 wells and says it holds more', r.big.n === 96 && r.bigNote === 'bigger', { big: r.big, note: r.bigNote });
  await ctx.close();
});

if (run('R8')) await guard('R8', async () => {
  const { ctx, pg } = await open('/apps/beacon/beacon.html');
  await pg.evaluate(GLO);
  const r = await pg.evaluate(async () => {
    const o = {}, snap = () => state.plates.map(p => ({ name: p.name, d: Object.keys(p.donor).length, a: Object.keys(p.acceptor).length, d1: p.donor.A1, a1: p.acceptor.A1, complete: bComplete(p) }));
    // BRET: the ratio under "BRET", then "Donor:" and "Acceptor:" in column B of their header rows
    await bHandleFiles([__glo('bret.xlsx', 'BRET 1', [{ head: 'BRET', base: 7 }, { own: 'Donor:', base: 1000 }, { own: 'Acceptor:', base: 2000 }])]);
    o.bret = snap();
    // two plain luminescence grids: donor then acceptor
    while (state.plates.length > 1) state.plates.pop(); state.plates[0] = bNewPlate(8, 12, null);
    await bHandleFiles([__glo('two.xlsx', 'two', [{ head: 'Luminescence', base: 3000 }, { head: 'Luminescence', base: 4000 }])]);
    o.two = snap();
    // one grid: the channel the plate is waiting for
    state.plates[0] = bNewPlate(8, 12, null);
    await bHandleFiles([__glo('one donor.xlsx', 'one', [{ head: 'Luminescence', base: 5000 }])]);
    o.one = snap();
    return o;
  });
  check('R8', 'a BRET export is one plate with donor 1000 and acceptor 2000 — the ratio grid is not a channel — named for the file', r.bret.length === 1 && r.bret[0].d === 96 && r.bret[0].a === 96 && r.bret[0].d1 === 1000 && r.bret[0].a1 === 2000 && r.bret[0].complete && r.bret[0].name === 'bret', r.bret);
  check('R8', 'two luminescence grids are donor then acceptor', r.two[0].d1 === 3000 && r.two[0].a1 === 4000 && r.two[0].complete, r.two);
  check('R8', 'one grid fills the channel the file name says (a donor), and the plate waits for the other', r.one[0].d1 === 5000 && r.one[0].a === 0 && !r.one[0].complete, r.one);
  await ctx.close();
});

if (run('R9') && args.glomax) await guard('R9', async () => {
  const b64 = fs.readFileSync(path.resolve(String(args.glomax))).toString('base64');
  const { ctx, pg } = await open('/apps/lumina/lumina.html');
  const r = await pg.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    setPlateFormat(384);
    await handleReaderFiles([new File([u], 'spark-sc4-4.xlsx')]);
    const p = state.plates[0]; return { n: Object.keys(p.signal).length, a1: p.signal.A1, p24: p.signal.P24, name: p.name };
  }, b64);
  console.log('real GloMax →', JSON.stringify(r));
  check('R9', 'the real double read is 384 luminescence wells (A1 8304), not the fluorescence', r.n === 384 && r.a1 === 8304, r);
  await ctx.close();
});

await browser.close(); server.close();
if (pageErrs.length) out.push({ inv: 'page', case: 'errors', msg: pageErrs.slice(0, 3).join(' | ') });
console.log(Object.entries(counts).map(([k, v]) => k + ':' + v).join('  '), '—', Object.values(counts).reduce((a, b) => a + b, 0), 'checks');
if (out.length) { out.forEach(o => console.log('FAIL', o.inv, o.case, o.msg)); process.exit(1); }
console.log('all pass');
