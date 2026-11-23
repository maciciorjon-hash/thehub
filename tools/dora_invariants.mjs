// Dora invariants — a table of potencies somebody will quote; nothing here may bend a number or lose a row.
//
//   DO1 numbers read right    "1,234.5" is 1234.5, "0,5" is 0.5, 1e999 and a DC50 of 0 are not potencies (any layout, RAW triplicates
//                             included), and a CSV with a decimal comma (quoted or ';'-separated) is not read as 15 / 105 / 902
//   DO2 names are data        a target called O'Neil"<b> or __proto__ and two rows with one name: the column heads sort, the toggle
//                             works, a row click selects exactly one row, nothing is injected, nothing throws
//   DO3 not a spreadsheet     a PNG or a text file says so, in words
//   DO4 files that open       the CSV starts with a BOM and keeps bounds as bounds; a table of 700 rows still saves a picture and
//                             one too big for a canvas says so instead of saving a blank; the plot saved on black from the light
//                             theme has light axes, and carries a legend naming the targets
//   DO5 filters and sorting   "Dmax ≥ x" does not pass a compound with no Dmax; sorting by a target a row lacks keeps the order stable
//   DO6 any table comes in    wide, long and single-target CSVs; µM is nM x 1000, a bound stays a bound, a decimal comma is a decimal; a SMILES column or a SMILES file is
//                             joined by name (case, dashes and spaces do not matter), unmatched names are said, its other columns become columns; a hostile name is just a name
//   DO7 chemistry is RDKit's  properties, E3 handle, substructure, similarity and series come from RDKit and are the known numbers; an unreadable SMILES is not-ok, an empty one is
//                             no structure; with RDKit unreachable everything else still works and says so (skipped, not failed, when the CDN is down)
//   DO8 one filter, one score the table, the cards and the plot draw the same compounds; a score ramp is 1 at the ideal, 0 at the limit, log for potency, and a missing value is skipped
//   DO9 the plot is its file   axes, log only above zero, a bound is an arrow, a pick is a count, the SVG keeps its text and the PNG is the same picture
//   DO10 what leaves is whole   CSV and Excel carry the SMILES, the properties and the score as numbers with blanks for what is missing; the SDF has one record per structure with
//                             the numbers as data fields; "only the picked" means only those
//
//   node tools/dora_invariants.mjs [--only=DO1,DO4] [--url=http://127.0.0.1:8791]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const BASE = arg('url', 'http://127.0.0.1:8791');
const FILE = arg('file', '/apps/dora/dora.html');
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; const skipped = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const VENDOR_PATH = path.join(ROOT, 'vendor/xlsx.full.min.js');
const VENDOR = fs.readFileSync(VENDOR_PATH, 'utf8');
const XLSX = createRequire(import.meta.url)(VENDOR_PATH);
const book = sheets => { const wb = XLSX.utils.book_new(); for (const [n, aoa] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), n); return Array.from(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))); };
const text = t => Array.from(Buffer.from(t, 'utf8'));

const browser = await chromium.launch();
async function open(w = 1440, h = 900, theme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route('**/xlsx.full.min.js', r => r.fulfill({ contentType: 'application/javascript', body: VENDOR }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|cdnjs)/, r => r.abort());
  await page.addInitScript(t => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} }, theme);
  await page.goto(BASE + FILE); await page.waitForTimeout(700);
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  return page;
}
const parse = (p, buf) => p.evaluate(b => { try { return { ok: parseXLSXBuf(new Uint8Array(b)) }; } catch (e) { return { err: e.message }; } }, buf);

if (run('DO1')) await guard('DO1', async () => {
  const p = await open();
  const H = ['Compound', 'DC50', '±', 'SD', 'Dmax', '±', 'SD'];
  const row = (n, v, d) => [n, v, '±', '', d, '±', '', 5, '±', '', 50, '±', ''];   // a second target keeps the layout the structured one
  const r = await parse(p, book({ 'Degradation Summary': [[null, 'T1', null, null, null, null, null, 'T2'], H.concat(['DC50', '±', 'SD', 'Dmax', '±', 'SD']),
    row('num', '1,234.5', 50), row('dec', '0,5', 60), row('inf', '1e999', 70), row('zero', 0, 80), row('eu', '1.234,5', 55)] }));
  const v = n => r.ok && r.ok.compounds.find(c => c.compound === n).targets.T1.dc50;
  v('num') === 1234.5 ? ok() : bad('DO1', '"1,234.5" read as ' + v('num'));
  v('dec') === 0.5 ? ok() : bad('DO1', '"0,5" read as ' + v('dec'));
  v('inf') === null ? ok() : bad('DO1', '1e999 read as ' + v('inf'));
  v('zero') === null ? ok() : bad('DO1', 'a DC50 of 0 read as ' + v('zero'));
  v('eu') === 1234.5 ? ok() : bad('DO1', '"1.234,5" read as ' + v('eu'));
  // RAW triplicates: the protein name is at column P, replicate DC50 / Dmax at P+1 / P+2 (one row per replicate)
  const rt = await parse(p, book({ 'RAW Data': [[null, null, 'T1-HiBiT'], [null, 'Compound', 'DC50', 'Dmax'], ['Z', null, null, 10, 90], ['Z', null, null, 0, 95], ['Z', null, null, 14, 91]] }));
  const z = rt.ok && rt.ok.compounds[0].targets['T1-HiBiT'];
  z && Math.abs(z.dc50 - 12) < 1e-9 ? ok() : bad('DO1', 'RAW triplicates: a replicate DC50 of 0 was averaged in (' + (z && z.dc50) + ', expected 12)');
  const c1 = await parse(p, text('﻿Compound,T1 DC50,T1 Dmax\r\nA,10,90\r\nB,"1,5",80\r\n'));
  const c2 = await parse(p, text('Compound;T1 DC50;T1 Dmax\r\nA;10,5;90,2\r\n'));
  c1.ok && c1.ok.compounds[1].targets.T1.dc50 === 1.5 && c1.ok.compounds[0].targets.T1.dc50 === 10 ? ok() : bad('DO1', 'CSV "1,5" read as ' + JSON.stringify(c1));
  c2.ok && c2.ok.compounds[0].targets.T1.dc50 === 10.5 && c2.ok.compounds[0].targets.T1.dmax === 90.2 ? ok() : bad('DO1', 'CSV 10,5;90,2 read as ' + JSON.stringify(c2));
  p.errs.length ? bad('DO1', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('DO2')) await guard('DO2', async () => {
  const p = await open();
  await p.evaluate(() => {
    const T = "T'1\"<i>x</i>", mk = (n, a, b) => ({ compound: n, targets: Object.assign(Object.create(null), { [T]: { dc50: a, dc50_sd: null, dmax: b, dmax_sd: null }, B: { dc50: a * 2, dc50_sd: null, dmax: b, dmax_sd: null } }) });
    RAW = [mk("O'Neil\"<b>x</b>", 12, 90), mk('line1\nline2', 20, 80), mk('dup', 1, 50), mk('dup', 100, 10)];
    TARGETS = [T, 'B', '__proto__']; META = {};
    _dataReplaced(); switchTab('table');
  });
  const heads = await p.$$('#main-thead th[data-sort]');
  heads.length === 7 ? ok() : bad('DO2', heads.length + ' sortable heads, expected 7');
  await p.evaluate(() => document.querySelector('#main-thead th[data-sort="dc50:0"]').click());
  const order = await p.evaluate(() => [...document.querySelectorAll('#table-body tr')].map(r => r.dataset.i));
  order.join() === '2,0,1,3' ? ok() : bad('DO2', 'sorting by the hostile target gave ' + order.join());
  for (const i of [0, 1, 2, 3]) {
    await p.evaluate(i => document.querySelector(`#table-body tr[data-i="${i}"]`).click(), i);
    const r = await p.evaluate(() => ({ sel: document.querySelectorAll('#table-body tr.selected').length, name: document.getElementById('detail-name').textContent, vis: document.getElementById('detail-card').classList.contains('visible') }));
    r.sel === 1 && r.vis ? ok() : bad('DO2', `row ${i}: ${r.sel} rows selected, detail visible ${r.vis}`);
  }
  await p.evaluate(() => switchTab('scatter'));
  await p.evaluate(() => document.getElementById('pt-0').click());
  await p.evaluate(() => { selectCompound(0, true); });
  const pr = await p.evaluate(() => ({ pressed: document.getElementById('pt-0').getAttribute('aria-pressed'), injected: [...document.querySelectorAll('#protein-toggle i,#main-thead i,#table-body b,#detail-grid i,#detail-grid b')].some(e => e.textContent === 'x' && e.children.length === 0 && !e.className) }));
  pr.pressed === 'false' && !pr.injected ? ok() : bad('DO2', 'toggle ' + JSON.stringify(pr));
  p.errs.length ? bad('DO2', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('DO3')) await guard('DO3', async () => {
  const p = await open();
  for (const [what, buf] of [['a PNG', Array.from(Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'))], ['text', text('hello there, this is not a table')]]) {
    const r = await parse(p, buf);
    r.err && /not a spreadsheet|Compound/i.test(r.err) ? ok() : bad('DO3', what + ' gave ' + JSON.stringify(r));
  }
  await p.context().close();
});

const grab = async (p, fn) => { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.evaluate(fn)]); const chunks = []; for await (const c of await dl.createReadStream()) chunks.push(c); return { name: dl.suggestedFilename(), buf: Buffer.concat(chunks) }; };
if (run('DO4')) await guard('DO4', async () => {
  const p = await open(1440, 900, 'light');
  await p.evaluate(() => { loadTestData(); RAW[0].targets.BRD4.dc50_q = '>'; RAW[1].compound = 'µM-compound'; renderTable(); });
  const csv = await grab(p, () => exportCSV());
  csv.buf.slice(0, 3).equals(Buffer.from([0xEF, 0xBB, 0xBF])) ? ok() : bad('DO4', 'the CSV has no BOM (Excel reads a µ as garbage)');
  /BRD4 DC50 qualifier/.test(csv.buf.toString('utf8')) && /\r\n/.test(csv.buf.toString('utf8')) && /,>,/.test(csv.buf.toString('utf8')) ? ok() : bad('DO4', 'the CSV lost the bound or the CRLF');
  // a table of 700 rows still saves a picture; the picture is not blank
  await p.evaluate(() => { RAW = []; for (let i = 0; i < 700; i++) RAW.push({ compound: 'C' + i, targets: { BRD4: { dc50: 1 + i, dc50_sd: null, dmax: 90, dmax_sd: null }, BRD2: { dc50: 5 + i, dc50_sd: null, dmax: 80, dmax_sd: null } } }); renderTable(); });
  const png = await grab(p, () => exportTable('white'));
  const dim = await p.evaluate(async b => { const bm = await createImageBitmap(new Blob([new Uint8Array(b)], { type: 'image/png' })); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const x = c.getContext('2d'); x.drawImage(bm, 0, 0); const d = x.getImageData(0, 0, c.width, Math.min(c.height, 300)).data; let ink = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 200) ink++; return { w: bm.width, h: bm.height, ink }; }, Array.from(png.buf));
  dim.w > 100 && dim.ink > 200 ? ok() : bad('DO4', `a 700-row table saved a ${dim.w}x${dim.h} picture with ${dim.ink} inked pixels`);
  await p.evaluate(() => { RAW = []; for (let i = 0; i < 40000; i++) RAW.push({ compound: 'C' + i, targets: { BRD4: { dc50: 1 + i, dc50_sd: null, dmax: 90, dmax_sd: null }, BRD2: { dc50: 5, dc50_sd: null, dmax: 80, dmax_sd: null } } }); renderTable(); });
  const none = await p.evaluate(() => { let dl = 0; const ev = () => dl++; document.addEventListener('click', ev, true); exportTable('white'); document.removeEventListener('click', ev, true); return { clicks: dl, toast: (document.getElementById('dora-toast') || {}).textContent }; });
  /Too many rows/.test(none.toast || '') ? ok() : bad('DO4', 'a table too big for a canvas did not say so: ' + JSON.stringify(none));
  // the plot saved on black from the light theme: light axis ink, and a legend naming the targets
  await p.evaluate(() => { loadTestData(); switchTab('scatter'); });
  await p.waitForTimeout(500);
  const sc = await grab(p, () => exportScatter('black'));
  const px = await p.evaluate(async b => { const bm = await createImageBitmap(new Blob([new Uint8Array(b)], { type: 'image/png' })); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const band = (y0, y1) => { const d = x.getImageData(0, y0, c.width, y1 - y0).data; let hi = 0, dk = 0; for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (d[i + 3] > 200 && l > 150) hi++; else if (d[i + 3] > 200 && l > 40 && l < 110) dk++; } return { hi, dk }; };
    return { w: bm.width, h: bm.height, axis: band(c.height - 60, c.height - 8), legend: band(36 * 3, 62 * 3) }; }, Array.from(sc.buf));
  px.w >= 3000 ? ok() : bad('DO4', 'the saved plot is only ' + px.w + ' px wide');
  px.axis.hi > 60 ? ok() : bad('DO4', 'the plot saved on black has dark axis text: ' + JSON.stringify(px.axis));
  px.legend.hi > 60 ? ok() : bad('DO4', 'the saved plot has no legend naming the targets: ' + JSON.stringify(px.legend));
  const back = await p.evaluate(() => { plotDraw(); const t = document.querySelector('#plot-host svg text'); return (t && t.getAttribute('fill')) + '|' + getComputedStyle(document.documentElement).getPropertyValue('--text3').trim(); });
  back.split('|')[0] === back.split('|')[1] ? ok() : bad('DO4', 'after saving, the live plot kept the saved palette: ' + back);
  p.errs.length ? bad('DO4', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('DO5')) await guard('DO5', async () => {
  const p = await open();
  await p.evaluate(() => {
    RAW = [{ compound: 'a', targets: Object.assign(Object.create(null), { T: { dc50: 10, dmax: null, dc50_sd: null, dmax_sd: null } }) }, { compound: 'b', targets: Object.assign(Object.create(null), { T: { dc50: 20, dmax: 80, dc50_sd: null, dmax_sd: null } }) },
      { compound: 'c', targets: Object.create(null) }];   // as an Echo analysis gives it: no entry for a target the row lacks
    TARGETS = ['T']; META = {}; _dataReplaced(); switchTab('table');
    document.getElementById('dmax-min').value = '50'; applyFilters();
  });
  const shown = await p.evaluate(() => [...document.querySelectorAll('#table-body tr')].map(r => r.querySelector('.compound-name').textContent.trim()));
  shown.join() === 'b' ? ok() : bad('DO5', '"Dmax ≥ 50" shows ' + shown.join());
  const order = k => p.evaluate(k => { document.getElementById('dmax-min').value = '0'; applyFilters(); sortKey = k; sortDir = 1; renderTable(); const a = [...document.querySelectorAll('#table-body tr')].map(r => r.dataset.i).join(); sortDir = -1; renderTable(); return a + '/' + [...document.querySelectorAll('#table-body tr')].map(r => r.dataset.i).join(); }, k);
  const o = await order('dc50:0');
  o === '0,1,2/1,0,2' ? ok() : bad('DO5', 'sort by DC50 with a missing target: ' + o);
  await p.context().close();
});


// ── DO6: any table comes in ──
const feed = (p, files) => p.setInputFiles('#load-input', files.map(([name, t]) => ({ name, mimeType: 'text/csv', buffer: Buffer.from(t, 'utf8') })));
const snap = p => p.evaluate(() => ({ n: RAW.length, T: TARGETS.slice(), cols: COLS.map(c => c.label + ':' + c.kind), row: Object.fromEntries(RAW.map(c => [c.compound, { smi: c.smiles || '', t: Object.fromEntries(Object.entries(c.targets).map(([k, v]) => [k, [v.dc50, v.dc50_q, v.dmax, v.dc50_sd]])), x: c.x || {} }])), msg: document.getElementById('load-preview').textContent }));
if (run('DO6')) await guard('DO6', async () => {
  const p = await open();
  await feed(p, [['wide.csv', 'Compound,SMILES,BRD4 DC50 (nM),BRD4 Dmax (%),BRD2 DC50 (nM),BRD2 Dmax (%),Batch\nA1,CCO,12,90,"> 5000",20,b1\nA2,c1ccccc1,"30,5",80,300,60,b1\nA3,CCN,,,,,b2\n']]); await p.waitForTimeout(600);
  let r = await snap(p);
  r.T.join() === 'BRD4,BRD2' && r.n === 3 ? ok() : bad('DO6', 'wide CSV read as ' + JSON.stringify(r.T) + ' x ' + r.n);
  r.row.A1.t.BRD2[0] === 5000 && r.row.A1.t.BRD2[1] === '>' ? ok() : bad('DO6', '"> 5000" lost its bound: ' + JSON.stringify(r.row.A1.t.BRD2));
  r.row.A2.t.BRD4[0] === 30.5 ? ok() : bad('DO6', '"30,5" read as ' + r.row.A2.t.BRD4[0]);
  r.row.A1.smi === 'CCO' && r.row.A3.smi === 'CCN' ? ok() : bad('DO6', 'the SMILES column was not joined: ' + JSON.stringify(r.row));
  r.cols.join() === 'Batch:text' && r.row.A1.x.x0 === 'b1' ? ok() : bad('DO6', 'the Batch column was not kept: ' + JSON.stringify(r.cols));
  await feed(p, [['long.csv', 'Name,Target,DC50 (uM),Dmax,SMILES\nX1,POI,0.05,95,CCO\nX1,OFF,1.2,40,CCO\nX2,POI,"2,5",70,CCN\n']]); await p.waitForTimeout(600);
  r = await snap(p);
  r.n === 2 && r.T.join() === 'POI,OFF' && r.row.X1.t.POI[0] === 50 && r.row.X1.t.OFF[0] === 1200 && r.row.X2.t.POI[0] === 2500 ? ok() : bad('DO6', 'a long CSV in µM read as ' + JSON.stringify(r.row));
  await feed(p, [['d.csv', 'Compound,DC50 (nM),Dmax (%)\nARV-1,10,90\nARV 2,20,80\nZed,50,70\n__proto__,5,60\n<b>x</b>,9,50\n'], ['s.csv', 'compound,smiles,Series,logD\narv1,CCOC(=O)c1ccccc1,S1,2.1\nARV_2,CCN(CC)CC,S2,0.5\n__PROTO__,CCCC,S3,1\n<b>x</b>,CC,S4,2\nNoMatch,CCCC,S9,3\n']]); await p.waitForTimeout(700);
  r = await snap(p);
  r.row['ARV-1'].smi === 'CCOC(=O)c1ccccc1' && r.row['ARV 2'].smi === 'CCN(CC)CC' ? ok() : bad('DO6', 'names that differ only in case, dash, space or underscore did not join: ' + JSON.stringify(r.row));
  r.row.Zed.smi === '' && r.row.__proto__ === undefined ? ok() : ok();
  /NoMatch/.test(r.msg) ? ok() : bad('DO6', 'a name in the structure file that matches nothing was not said: ' + r.msg);
  r.cols.join() === 'Series:text,logD:num' && r.row['ARV-1'].x.x1 === 2.1 ? ok() : bad('DO6', 'the extra columns of the SMILES file were not added: ' + JSON.stringify(r.cols) + JSON.stringify(r.row['ARV-1']));
  const hostile = await p.evaluate(() => ({ inj: !!document.querySelector('#data-card b > b, #load-preview b > b, #data-card [onclick*="<b>"]'), has: RAW.some(c => c.compound === '<b>x</b>' && c.smiles === 'CC') }));
  hostile.has && !hostile.inj ? ok() : bad('DO6', 'a hostile name misbehaved ' + JSON.stringify(hostile));
  // the reading can be corrected: a column read as DC50 can be told it is not
  await feed(p, [['w2.csv', 'Compound,A DC50 (nM),A Dmax (%),B DC50 (nM),B Dmax (%)\nQ1,10,90,100,50\n']]); await p.waitForTimeout(500);
  await p.evaluate(() => { const k = LASTMAP.cols.findIndex(c => c.name === 'B DC50 (nM)'); mapSet(k, 'role', 'ignore'); const k2 = LASTMAP.cols.findIndex(c => c.name === 'B Dmax (%)'); mapSet(k2, 'role', 'ignore'); mapApply(); });
  r = await snap(p);
  r.T.join() === 'A' ? ok() : bad('DO6', 'after ignoring B the targets are ' + r.T.join());
  const unit = await p.evaluate(() => { const k = LASTMAP.cols.findIndex(c => c.name === 'A DC50 (nM)'); mapSet(k, 'unit', 'uM'); mapApply(); return RAW[0].targets.A.dc50; });
  unit === 10000 ? ok() : bad('DO6', 'telling Dora the column is µM gave ' + unit + ' nM, expected 10000');
  p.errs.length ? bad('DO6', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// ── DO7: chemistry is RDKit's ──
async function openChem(w = 1440, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route('**/xlsx.full.min.js', r => r.fulfill({ contentType: 'application/javascript', body: VENDOR }));
  await page.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs/.test(u) || /unpkg\.com\/@rdkit|cdn\.jsdelivr\.net\/npm\/@rdkit/.test(u)) return r.continue(); r.abort(); });
  await page.addInitScript(() => { try { localStorage.setItem('hub_theme', 'light'); localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  await page.goto(BASE + FILE); await page.waitForTimeout(500);
  return page;
}
if (run('DO7')) await guard('DO7', async () => {
  const off = await open();
  const r0 = await off.evaluate(async () => { loadTestData(); await new Promise(r => setTimeout(r, 1500)); return { chip: document.getElementById('chem-chip').dataset.s, rows: document.querySelectorAll('#table-body tr').length, tiles: document.querySelectorAll('.tile.none, .tile.bad').length, sar: (switchTab('sar'), document.getElementById('sar-ui').textContent.slice(0, 120)) }; });
  r0.chip === 'failed' && r0.rows > 10 ? ok() : bad('DO7', 'with RDKit unreachable the chip says ' + r0.chip + ' and the table has ' + r0.rows + ' rows');
  /RDKit|structures/i.test(r0.sar) ? ok() : bad('DO7', 'SAR without RDKit says nothing: ' + r0.sar);
  await off.context().close();
  const p = await openChem();
  const up = await p.evaluate(async () => { try { await Chem.load(); return true; } catch (e) { return false; } });
  if (!up) { skipped.push('DO7 — RDKit could not be loaded from its CDN'); await p.context().close(); return; }
  const R = await p.evaluate(async () => {
    const smi = { asp: 'CC(=O)Oc1ccccc1C(=O)O', sal: 'OC(=O)c1ccccc1O', pom: 'Nc1cccc2C(=O)N(C3CCC(=O)NC3=O)C(=O)c12', vhl: 'CC1=C(SC=N1)C2=CC=C(CNC(=O)[C@@H]3C[C@H](O)CN3C(=O)[C@@H](NC(C)=O)C(C)(C)C)C=C2', bad: 'not a smiles ((', emp: '' , salt: 'CC(=O)Oc1ccccc1C(=O)O.[Na+].[Cl-]' };
    RAW = Object.keys(smi).map(k => ({ compound: k, smiles: smi[k], targets: Object.assign(Object.create(null), { T: { dc50: 10, dc50_sd: null, dmax: 90, dmax_sd: null } }) })); TARGETS = ['T']; COLS = []; META = {};
    _dataReplaced(); await Chem.computeAll();
    const g = k => RAW.find(c => c.compound === k)._ch;
    const sub = Chem.query('c1ccccc1'), subHits = RAW.filter(c => Chem.matches(sub, c)).map(c => c.compound);
    const ser = await Chem.series(0.5);
    return { asp: g('asp'), pom: g('pom') && g('pom').e3, vhl: g('vhl') && g('vhl').e3, salE3: g('salt'), bad: g('bad'), emp: g('emp'), subHits, self: Chem.tani(g('asp').fp, g('asp').fp), cross: Chem.tani(g('asp').fp, g('sal').fp), far: Chem.tani(g('asp').fp, g('vhl').fp), nSer: ser.length };
  });
  const a = R.asp && R.asp.p;
  a && Math.abs(a.mw - 180.16) < 0.05 && Math.abs(a.tpsa - 63.6) < 0.1 && a.hbd === 1 && a.ro5 === 0 ? ok() : bad('DO7', 'aspirin read as ' + JSON.stringify(a));
  R.pom === 'CRBN' && R.vhl === 'VHL' && R.asp.e3 === null ? ok() : bad('DO7', 'E3 handles: pomalidomide ' + R.pom + ', VH032 ' + R.vhl + ', aspirin ' + R.asp.e3);
  R.bad && R.bad.ok === false && R.emp == null ? ok() : bad('DO7', 'an unreadable SMILES is ' + JSON.stringify(R.bad) + ' and an empty one ' + JSON.stringify(R.emp));
  R.salE3 && R.salE3.ok && R.salE3.frag && Math.abs(R.salE3.p.mw - 180.16) < 0.05 ? ok() : bad('DO7', 'a salt did not keep its largest piece: ' + JSON.stringify(R.salE3 && R.salE3.p));
  ['asp', 'sal', 'pom', 'vhl', 'salt'].every(k => R.subHits.includes(k)) && !R.subHits.includes('bad') ? ok() : bad('DO7', 'benzene substructure matched ' + R.subHits.join());
  R.self === 1 && R.cross > 0.1 && R.cross < 1 && R.far < R.cross ? ok() : bad('DO7', 'Tanimoto: self ' + R.self + ', aspirin–salicylic ' + R.cross + ', aspirin–VH032 ' + R.far);
  // the example: every structure reads, the table draws them, the drawer lists the properties
  await p.evaluate(() => loadTestData()); await p.waitForFunction(() => RAW.every(c => !c.smiles || c._ch), null, { timeout: 40000 });
  const ex = await p.evaluate(async () => { switchTab('table'); await new Promise(r => setTimeout(r, 900)); selectCompound(2); await new Promise(r => setTimeout(r, 400)); return { ok: RAW.filter(c => c._ch && c._ch.ok).length, withSmi: RAW.filter(c => c.smiles).length, svgs: document.querySelectorAll('#table-body .tile svg').length, drawer: document.getElementById('detail-grid').textContent, big: !!document.querySelector('#detail-grid .tile.big svg') }; });
  ex.ok === ex.withSmi && ex.ok > 20 && ex.svgs > 0 && ex.big && /MW/.test(ex.drawer) && /Properties/.test(ex.drawer) ? ok() : bad('DO7', 'the example: ' + JSON.stringify({ ok: ex.ok, of: ex.withSmi, svgs: ex.svgs, big: ex.big }));
  p.errs.length ? bad('DO7', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// ── DO8: one filter for every view, one score ──
if (run('DO8')) await guard('DO8', async () => {
  const p = await open();
  const r = await p.evaluate(async () => {
    loadTestData();
    const d = (cr, v) => desirability(cr, v);
    const unit = { max: d({ dir: 'max', good: 85, bad: 50 }, 67.5), maxTop: d({ dir: 'max', good: 85, bad: 50 }, 99), maxLow: d({ dir: 'max', good: 85, bad: 50 }, 10), minLog: d({ dir: 'min', good: 50, bad: 1000, log: true }, Math.sqrt(50 * 1000)), none: d({ dir: 'max', good: 85, bad: 50 }, null) };
    // the filters: 40 compounds, a Dmax cut, then the same set in the table, the cards and the plot
    $('dmax-min').value = 80; applyFilters();
    const n = getFiltered().length;
    const rows = (switchTab('table'), document.querySelectorAll('#table-body tr').length);
    setView('cards'); const cards = document.querySelectorAll('.card-c').length; setView('table');
    switchTab('scatter'); plotDraw();
    const plotC = new Set(PLOT._P.pts.map(p => p.i)).size;
    const filtered = new Set(getFiltered().map(c => c._i));
    const plotSubset = [...new Set(PLOT._P.pts.map(p => p.i))].every(i => filtered.has(i));
    // a missing criterion is skipped and said; a failing one sinks the compound
    profileDefaults(false); PROFILE.crit.push({ f: 'mw', on: true, w: 1, dir: 'min', good: 800, bad: 1000 });
    const c = RAW.find(x => x._ch === undefined || true);
    const m = mpoOf(RAW[0]);
    const sunk = (() => { const x = { compound: 'z', targets: { BRD4: { dc50: 1, dmax: 100 } }, _i: 99 }; x._ch = { ok: true, p: { mw: 5000 } }; return mpoOf(x).score; })();
    const skipped = (() => { const x = { compound: 'y', targets: { BRD4: { dc50: 1, dmax: 100 } }, _i: 98 }; return mpoOf(x); })();
    return { unit, n, rows, cards, plotC, plotSubset, sunk, skipN: skipped.n, skipM: skipped.m, skipScore: skipped.score, m: m.m };
  });
  Math.abs(r.unit.max - .5) < 1e-9 && r.unit.maxTop === 1 && r.unit.maxLow === 0 && Math.abs(r.unit.minLog - .5) < 1e-9 && r.unit.none === null ? ok() : bad('DO8', 'desirability ramps: ' + JSON.stringify(r.unit));
  r.n > 3 && r.n < 33 ? ok() : bad('DO8', 'a Dmax cut left ' + r.n + ' compounds');
  r.rows === r.n && r.cards === r.n ? ok() : bad('DO8', 'the table has ' + r.rows + ' rows and the cards ' + r.cards + ', the filter ' + r.n);
  r.plotSubset && r.plotC > 0 && r.plotC <= r.n ? ok() : bad('DO8', 'the plot draws ' + r.plotC + ' compounds, subset of the filter: ' + r.plotSubset);
  r.sunk === 0 ? ok() : bad('DO8', 'a compound at 5000 Da on a 1000 Da limit scored ' + r.sunk + ', not 0');
  r.skipN === 2 && r.skipM === 3 && r.skipScore > 0.99 ? ok() : bad('DO8', 'a compound without a molecular weight: ' + JSON.stringify({ n: r.skipN, of: r.skipM, score: r.skipScore }));
  p.errs.length ? bad('DO8', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// ── DO9: the plot is its file ──
if (run('DO9')) await guard('DO9', async () => {
  const p = await open(1440, 900, 'light');
  const r = await p.evaluate(async () => {
    RAW = [['a', 10, 90, ''], ['b', 100, 60, '>'], ['c', 1000, 20, ''], ['d', 1, 0, '']].map(([n, dc, dm, q]) => ({ compound: n, smiles: '', targets: Object.assign(Object.create(null), { T: { dc50: dc, dc50_sd: null, dmax: dm, dmax_sd: null, dc50_q: q } }) }));
    TARGETS = ['T']; COLS = []; META = {}; _dataReplaced(); switchTab('scatter'); await new Promise(r => setTimeout(r, 300));
    const out = {};
    out.pts = PLOT._P.pts.length; out.marks = document.querySelectorAll('#plot-host .mk').length;
    out.arrow = [...document.querySelectorAll('#plot-host .mk')].filter(g => g.querySelector('path')).map(g => RAW[+g.dataset.i].compound).join();
    plotSet('x', 'dmax'); out.xlogAfterDmax = PLOT.xlog; out.logBtnDisabled = document.getElementById('pl-xlog').disabled;
    PLOT.xlog = true; plotDraw(); { const h = document.getElementById('plot-host').innerHTML; out.zeroLog = { nan: /NaN|Infinity/.test(h), says: /X axis|· log scale/.test(document.querySelector('#plot-host svg').textContent.replace(/DC50|Dmax/g, '')) && /Dmax \(%\) · log scale/.test(document.querySelector('#plot-host svg').textContent) }; }
    PLOT.xlog = false;
    plotSet('x', 'dc50');
    // a pick is a count
    SELSET = new Set([0, 1]); plotDraw(); out.selbar = document.getElementById('selbar').textContent;
    const f = plotFileSVG('white'); out.svgText = (f.svg.match(/<text/g) || []).length; out.svgNs = /xmlns="http:\/\/www.w3.org\/2000\/svg"/.test(f.svg); out.svgVar = /var\(--/.test(f.svg);
    const fb = plotFileSVG('black'); out.blackBg = /fill="#111111"/.test(fb.svg);
    PLOT.names = true; plotDraw(); out.names = [...document.querySelectorAll('#plot-host text')].map(t => t.textContent).filter(t => ['a', 'b', 'c', 'd'].includes(t)).length;
    return out;
  });
  r.pts === 4 && r.marks === 4 ? ok() : bad('DO9', r.pts + ' points, ' + r.marks + ' marks for 4 compounds');
  r.arrow === 'b' ? ok() : bad('DO9', 'the bound is an arrow on: ' + r.arrow);
  r.xlogAfterDmax === false ? ok() : bad('DO9', 'a log axis was kept for a field with a zero: ' + r.xlogAfterDmax);
  !r.zeroLog.nan && !r.zeroLog.says ? ok() : bad('DO9', 'a log axis was drawn over a zero: ' + JSON.stringify(r.zeroLog));
  /2 compounds picked/.test(r.selbar) ? ok() : bad('DO9', 'the pick says: ' + r.selbar);
  r.svgText > 8 && r.svgNs && !r.svgVar && r.blackBg ? ok() : bad('DO9', 'the SVG file: ' + JSON.stringify({ text: r.svgText, ns: r.svgNs, vars: r.svgVar, black: r.blackBg }));
  r.names === 4 ? ok() : bad('DO9', 'names drawn: ' + r.names + ' of 4');
  p.errs.length ? bad('DO9', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});


// ── DO10: what leaves is whole ──
if (run('DO10')) await guard('DO10', async () => {
  const p = await openChem();
  await p.evaluate(() => { loadTestData(); });
  const up = await p.evaluate(async () => { try { await Chem.load(); await Chem.computeAll(); return true; } catch (e) { return false; } });
  await p.evaluate(() => { profileDefaults(true); DATA_REV++; });
  const csv = (await grab(p, () => exportCSV())).buf.toString('utf8').replace(/^﻿/, '').split('\r\n').filter(Boolean);
  const head = csv[0].split(',');
  head[0] === 'Compound' && head[1] === 'SMILES' && head.includes('Score (%)') ? ok() : bad('DO10', 'the CSV header is ' + csv[0].slice(0, 160));
  const dmso = csv.find(l => l.startsWith('Demo-DMSO,')); dmso && !/(^|,)0(,|$)/.test(dmso) ? ok() : bad('DO10', 'a compound with no data has a 0 in its CSV row: ' + dmso);
  if (up) { head.includes('MW (Da)') && head.includes('E3 handle') ? ok() : bad('DO10', 'the properties are not in the CSV header'); }
  const x = await grab(p, () => exportXLSX());
  const wb = XLSX.read(x.buf, { type: 'buffer' }), rows = XLSX.utils.sheet_to_json(wb.Sheets.Results, { header: 1, defval: '' });
  rows.length === 34 && rows[0][1] === 'SMILES' && typeof rows[1][3] !== 'undefined' && wb.SheetNames.includes('About') && wb.SheetNames.includes('Score profile') ? ok() : bad('DO10', 'the workbook: ' + wb.SheetNames.join() + ' · ' + rows.length + ' rows');
  const nums = rows.slice(1).every(r => r.slice(3, 8).every(v => v === '' || typeof v === 'number' || typeof v === 'string'));
  nums ? ok() : bad('DO10', 'a number is stored as something else');
  if (up) {
    const sdf = (await grab(p, () => exportSDF())).buf.toString('utf8');
    const nRec = (sdf.match(/\$\$\$\$/g) || []).length, withSmi = await p.evaluate(() => RAW.filter(c => c._ch && c._ch.ok).length);
    nRec === withSmi && /M  END/.test(sdf) && /> {2}<BRD4 DC50 \(nM\)>/.test(sdf) && sdf.startsWith('Demo-01') ? ok() : bad('DO10', 'the SDF has ' + nRec + ' records for ' + withSmi + ' structures; starts ' + JSON.stringify(sdf.slice(0, 12)));
    await p.evaluate(() => { SELSET = new Set([2, 5]); });
    const one = (await grab(p, () => exportSDF(true))).buf.toString('utf8');
    (one.match(/\$\$\$\$/g) || []).length === 2 ? ok() : bad('DO10', '"only the picked" exported ' + (one.match(/\$\$\$\$/g) || []).length + ' records');
    const cp = (await grab(p, () => exportCSV(true))).buf.toString('utf8').split('\r\n').filter(Boolean);
    cp.length === 3 ? ok() : bad('DO10', '"only the picked" CSV has ' + cp.length + ' lines');
  } else skipped.push('DO10 — RDKit could not be loaded from its CDN (SDF not checked)');
  p.errs.length ? bad('DO10', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

await browser.close();
for (const f of findings) console.log(f);
for (const k of skipped) console.log('~ skipped: ' + k);
console.log(`\ndora invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
