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
//   DO11 the units are the user's  a header names its unit (µM, pM, a fraction, % remaining) and is read as it says; the unit shown changes no stored number and carries a typed range, a score limit and the
//                             thresholds with it; a file with no unit is read as the user's default; a unit of one's own; the CSV and the plot name the unit; it is remembered, and a hostile name is only a name
//   DO12 the data is still there   what was loaded comes back after a reload (compounds, bounds, SMILES, extra columns, a target called __proto__, thresholds, the score profile, the reading of the file);
//                             the example is not kept; "keep" off and "forget" empty it; a record that is not one, or holds text where a number goes, is cleaned
//   DO13 R-groups, pairs, core     a core is found on its compounds and each group is named by where it sits (one place, one name); a * in the core changes nothing; a bad core is said; matched pairs are counted
//                             once and Δ is the second minus the first; linker changes between the same two ends are pairs; a series is drawn on its common core
//   DO14 estimates are formulas    ESOL, Veber, Egan, LipE and the size-normalised potency are the published arithmetic on RDKit's numbers
//   DO15 what is sent is shown     Labbook gets the table that is shown (or the picked), the same table twice has one id; Hit Finder gets one target in nM and % with bounds as bounds, and the structures; the unit on the screen never leaks; with no Hub or no access the item is off
//   DO16 the new screens fit      the R-group, matched-pair and series cards and the Units card, with results on them, at 1440, 1024, 768 and 390 px in both themes: nothing wider than its box, no horizontal scroll, every text on the type scale
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

const RD_JS = fs.readFileSync(path.join(ROOT, 'vendor/rdkit-minimal-2026.9.1.js')), RD_WASM = fs.readFileSync(path.join(ROOT, 'vendor/rdkit-minimal-2026.9.1.wasm'));
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
  await page.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs/.test(u)) return r.continue(); r.abort(); });
  // RDKit is served from vendor/ (the very bytes the loader's SHA-384 pins), so these checks need no network; registered after the catch-all, which a route registered later outranks
  await page.route(/(unpkg\.com\/@rdkit|cdn\.jsdelivr\.net\/npm\/@rdkit).*RDKit_minimal\.js/, r => r.fulfill({ contentType: 'application/javascript', body: RD_JS }));
  await page.route(/(unpkg\.com\/@rdkit|cdn\.jsdelivr\.net\/npm\/@rdkit).*RDKit_minimal\.wasm/, r => r.fulfill({ contentType: 'application/wasm', body: RD_WASM }));
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


// ── DO11: the units are the user's ──
if (run('DO11')) await guard('DO11', async () => {
  const p = await open();
  // a header that names its unit is read as it says: µM, pM, a fraction, and "% remaining" (90 % degraded = 10 % left)
  await feed(p, [['u.csv', 'Compound,A DC50 (µM),A Dmax (fraction),B DC50 (pM),B Dmax (% remaining)\nQ1,0.05,0.9,250,10\nQ2,"2,5",0.5,4000,70\n']]); await p.waitForTimeout(600);
  let r = await snap(p);
  const q1 = r.row.Q1.t, q2 = r.row.Q2.t;
  q1.A[0] === 50 && q1.A[2] === 90 && q2.A[0] === 2500 && q2.A[2] === 50 ? ok() : bad('DO11', 'µM and a fraction read as ' + JSON.stringify([q1.A, q2.A]));
  q1.B[0] === 0.25 && q1.B[2] === 90 && q2.B[0] === 4 && q2.B[2] === 30 ? ok() : bad('DO11', 'pM and "% remaining" read as ' + JSON.stringify([q1.B, q2.B]));
  const mixed = await p.evaluate(() => [dgUnit, dmaxUnit]);
  mixed.join() === 'nM,pct' ? ok() : bad('DO11', 'columns in different units must not change the display, it is ' + mixed.join());
  // one unit in the whole file: the numbers are shown in it (until the user chooses)
  await feed(p, [['one.csv', 'Compound,DC50 (uM),Dmax (fraction)\nR1,0.05,0.9\nR2,1.5,0.6\n']]); await p.waitForTimeout(600);
  const one = await p.evaluate(() => { switchTab('table'); return { u: [dgUnit, dmaxUnit], row: document.querySelector('#table-body tr').textContent.replace(/\s+/g, ' '), head: document.querySelector('#th-dc50-0').textContent + '|' + document.querySelector('#th-dmax-0').textContent }; });
  one.u.join() === 'uM,frac' && /0\.05/.test(one.row) && /0\.90/.test(one.row) && /µM/.test(one.head) && /fraction/.test(one.head) ? ok() : bad('DO11', 'a file in µM and a fraction is shown as ' + JSON.stringify(one));
  // looking at it another way changes no stored number, and a typed range follows (10–100 nM is 0.01–0.1 µM is pDC50 7–8)
  const sw = await p.evaluate(() => {
    const before = JSON.stringify(RAW.map(c => c.targets)); const o = {};
    setDgUnit('nM'); setDmaxUnit('pct'); FILT.ranges = [{ f: 'dc50', lo: 10, hi: 100 }, { f: 'dmax', lo: 80, hi: null }];
    setDgUnit('uM'); o.uM = [FILT.ranges[0].lo, FILT.ranges[0].hi];
    setDgUnit('p'); o.p = [FILT.ranges[0].lo, FILT.ranges[0].hi];
    setDgUnit('pM'); o.pM = [FILT.ranges[0].lo, FILT.ranges[0].hi];
    setDgUnit('nM'); o.back = [FILT.ranges[0].lo, FILT.ranges[0].hi];
    setDmaxUnit('rem'); o.rem = [FILT.ranges[1].lo, FILT.ranges[1].hi];
    setDmaxUnit('frac'); o.frac = [FILT.ranges[1].lo, FILT.ranges[1].hi];
    setDmaxUnit('pct'); o.pct = [FILT.ranges[1].lo, FILT.ranges[1].hi];
    o.same = before === JSON.stringify(RAW.map(c => c.targets)); FILT.ranges = []; return o;
  });
  sw.same ? ok() : bad('DO11', 'switching the unit shown rewrote a stored number');
  sw.uM.join() === '0.01,0.1' && sw.p.join() === '7,8' && sw.pM.join() === '10000,100000' && sw.back.join() === '10,100' ? ok() : bad('DO11', 'a DC50 range 10–100 nM became ' + JSON.stringify([sw.uM, sw.p, sw.pM, sw.back]));
  sw.rem.join() === ',20' && sw.frac.join() === '0.8,' && sw.pct.join() === '80,' ? ok() : bad('DO11', 'Dmax ≥ 80 % became ' + JSON.stringify([sw.rem, sw.frac, sw.pct]));
  // the places that take a typed number take it in the unit shown: a score limit, "what excellent means"
  const ty = await p.evaluate(() => {
    const o = {}; setDgUnit('uM'); profileDefaults(false); const i = PROFILE.crit.findIndex(c => c.f === 'dc50');
    scoreSet(i, 'good', '0.02'); o.good = PROFILE.crit[i].good; o.shown = critShown(PROFILE.crit[i], 'good');
    renderDataCard(); $('q-dc50').value = '0.1'; setQThresh(); o.q = qThreshDC50;
    setDgUnit('p'); renderDataCard(); $('q-dc50').value = '7'; setQThresh(); o.qp = qThreshDC50;
    setDgUnit('nM'); setDmaxUnit('remfrac'); renderDataCard(); $('q-dmax').value = '0.2'; setQThresh(); o.qd = qThreshDmax; setDmaxUnit('pct');
    return o;
  });
  Math.abs(ty.good - 20) < 1e-9 && ty.shown === 0.02 ? ok() : bad('DO11', 'a score limit typed as 0.02 µM is stored as ' + ty.good + ' nM (' + ty.shown + ' shown)');
  Math.abs(ty.q - 100) < 1e-6 && Math.abs(ty.qp - 100) < 1e-6 && Math.abs(ty.qd - 80) < 1e-9 ? ok() : bad('DO11', 'thresholds typed as 0.1 µM / pDC50 7 / 0.2 remaining are ' + JSON.stringify([ty.q, ty.qp, ty.qd]));
  // a file without a unit is read as the default the user set; a header beats it; a unit of one's own
  const d = await p.evaluate(() => { importDef('dc50', 'uM'); return IMPORT_DEF.dc50; });
  await feed(p, [['n.csv', 'Compound,DC50,Dmax\nK1,3,50\n']]); await p.waitForTimeout(500);
  r = await snap(p); r.row.K1.t.Target[0] === 3000 && d === 'uM' ? ok() : bad('DO11', 'a bare DC50 of 3 with µM as the default is ' + JSON.stringify(r.row.K1.t));
  await feed(p, [['n2.csv', 'Compound,DC50 (nM),Dmax\nK1,3,50\n']]); await p.waitForTimeout(500);
  r = await snap(p); r.row.K1.t.Target[0] === 3 ? ok() : bad('DO11', 'a header that says nM lost to the default: ' + JSON.stringify(r.row.K1.t));
  await p.evaluate(() => importDef('dc50', 'nM'));
  const undef = await p.evaluate(() => { const k = LASTMAP.cols.findIndex(c => c.role === 'dc50'); mapSet(k, 'unit', 'custom'); mapApply(); return document.getElementById('load-preview').textContent; });
  /own unit|not defined/i.test(undef) ? ok() : bad('DO11', 'an undefined unit of one\'s own was read without a word: ' + undef);
  await p.evaluate(() => { $('cu-label').value = 'XX'; $('cu-f').value = '2.5'; customUnitSet(); });
  await feed(p, [['c.csv', 'Compound,DC50 (XX),Dmax\nK2,4,50\n']]); await p.waitForTimeout(500);
  r = await snap(p);
  const cu = await p.evaluate(() => { setDgUnit('custom'); switchTab('table'); return { u: dgUnit, row: document.querySelector('#table-body tr').textContent.replace(/\s+/g, ' ') }; });
  r.row.K2.t.Target[0] === 10 && cu.u === 'custom' && /4\.00/.test(cu.row) ? ok() : bad('DO11', 'a unit of 2.5 nM: 4 XX is ' + JSON.stringify(r.row.K2.t) + ' and shows ' + cu.row);
  // what is written follows the unit shown
  await p.evaluate(() => { setDgUnit('uM'); setDmaxUnit('rem'); });
  const csv = (await grab(p, () => exportCSV())).buf.toString('utf8').replace(/^﻿/, '').split('\r\n').filter(Boolean);
  const hd = csv[0].split(',');
  hd.includes('Target DC50 (µM)') && hd.includes('Target Dmax (% remaining)') ? ok() : bad('DO11', 'the CSV does not name its units: ' + csv[0]);
  const row = csv[1].split(','), ix = hd.indexOf('Target DC50 (µM)'), iy = hd.indexOf('Target Dmax (% remaining)');
  Math.abs(+row[ix] - 0.01) < 1e-9 && +row[iy] === 50 ? ok() : bad('DO11', 'K2 (10 nM, 50 % degraded) is written as ' + row[ix] + ' µM, ' + row[iy] + ' % remaining');
  const pl = await p.evaluate(async () => { switchTab('scatter'); plotDraw(); await new Promise(r => setTimeout(r, 200)); return plotFileSVG('white').svg.replace(/<[^>]+>/g, ' '); });
  /DC50 \(µM\)/.test(pl) && /Dmax \(% remaining\)/.test(pl) ? ok() : bad('DO11', 'the plot axes do not name the units');
  // remembered between sessions, and a hostile name of one's own is only a name
  await p.evaluate(() => { setDgUnit('mM'); $('cu-label').value = '<img src=x onerror=window.__pwn=1>'; $('cu-f').value = '1'; customUnitSet(); });
  await p.reload(); await p.waitForTimeout(700);
  const rem = await p.evaluate(() => ({ u: dgUnit, inj: !!document.querySelector('#units-card img, .dg-unit-sel img'), pwn: !!window.__pwn, opt: [...document.querySelectorAll('#dg-unit option')].map(o => o.textContent).join('|') }));
  rem.u === 'mM' && !rem.inj && !rem.pwn && /<img/.test(rem.opt) ? ok() : bad('DO11', 'after a reload: ' + JSON.stringify(rem));
  // the units card is rebuilt under an open <details>: no error, and it stays open
  const keep = await p.evaluate(async () => { switchTab('load'); document.getElementById('units-open').open = true; await new Promise(r => setTimeout(r, 100)); setDgUnit('nM'); setDgUnit('uM'); await new Promise(r => setTimeout(r, 200)); return document.getElementById('units-open').open; });
  keep ? ok() : bad('DO11', 'the units card closed itself when a unit changed');
  // the table's own header names the unit shown, also when the unit is changed after the table was drawn
  await feed(p, [['h.csv', 'Compound,DC50 (nM),Dmax (%)\nH1,10,90\n']]); await p.waitForTimeout(500);
  const hdr = await p.evaluate(() => { switchTab('table'); setDgUnit('p'); setDmaxUnit('frac'); const a = [document.querySelector('#th-dc50-0').textContent, document.querySelector('#th-dmax-0').textContent]; setDgUnit('mM'); setDmaxUnit('remfrac'); return a.concat([document.querySelector('#th-dc50-0').textContent, document.querySelector('#th-dmax-0').textContent, document.getElementById('pill-good').textContent]); });
  /pDC50/.test(hdr[0]) && /fraction\)/.test(hdr[1]) && /mM/.test(hdr[2]) && /fraction remaining/.test(hdr[3]) && /remaining ≤ \d/.test(hdr[4]) && !/rem\./.test(hdr[4]) ? ok() : bad('DO11', 'the headers or the quality pill do not follow the unit: ' + JSON.stringify(hdr));
  p.errs.length ? bad('DO11', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});


// ── DO12: the data is still there next time ──
if (run('DO12')) await guard('DO12', async () => {
  const p = await open();
  const idbPut = (page, v) => page.evaluate(v => idbDo('readwrite', st => st.put(v, 'session')), v);
  await feed(p, [['k.csv', 'Compound,SMILES,A DC50 (nM),A Dmax (%),Batch\nK1,CCO,"> 5000",20,b1\n__proto__,CCN,12,90,b2\n<b>x</b>,,30,70,b3\n']]); await p.waitForTimeout(400);
  await p.evaluate(() => { qThreshDmax = 70; qThreshDC50 = 123; PROFILE.crit.push({ f: 'mw', on: true, w: 2, dir: 'min', good: 700, bad: 900 }); PROFILE.linked = false; PROFILE.rev++; DATA_REV++; refreshAll(); });
  const before = await snap(p); await p.waitForTimeout(1500);
  await p.reload(); await p.waitForTimeout(1200);
  const after = await snap(p), st = await p.evaluate(() => ({ q: [qThreshDmax, qThreshDC50], crit: PROFILE.crit.some(c => c.f === 'mw' && c.w === 2 && c.good === 700), msg: document.getElementById('load-preview').textContent, tab: document.querySelector('[role=tab][aria-selected=true]') && document.querySelector('[role=tab][aria-selected=true]').id, map: !!(LASTMAP && LASTMAP.lay) }));
  JSON.stringify(before.row) === JSON.stringify(after.row) && before.T.join() === after.T.join() && before.cols.join() === after.cols.join() ? ok() : bad('DO12', 'what came back is not what was saved: ' + JSON.stringify(after.row).slice(0, 300));
  st.q.join() === '70,123' && st.crit ? ok() : bad('DO12', 'the thresholds or the score profile did not come back: ' + JSON.stringify(st));
  /Back where you left it/.test(st.msg) && /k\.csv/.test(st.msg) ? ok() : bad('DO12', 'the restore does not say so: ' + st.msg);
  // the saved reading can still be corrected
  const fix = await p.evaluate(() => { if (!LASTMAP || !LASTMAP.lay) return null; const k = LASTMAP.cols.findIndex(c => c.role === 'dc50'); mapSet(k, 'unit', 'uM'); mapApply(); return RAW.find(c => c.compound === '__proto__').targets.A.dc50; });
  fix === 12000 ? ok() : bad('DO12', 're-reading the restored file as µM gave ' + fix);
  // the example is nobody's data; "keep" off forgets; a record that is not one is ignored
  await p.evaluate(() => { clearAll(); }); await p.waitForTimeout(300);
  await p.evaluate(() => loadTestData()); await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(900);
  (await p.evaluate(() => RAW.length)) === 0 ? ok() : bad('DO12', 'the example was kept as if it were the user\'s data');
  await feed(p, [['k2.csv', 'Compound,DC50 (nM),Dmax (%)\nM1,10,90\n']]); await p.waitForTimeout(1500);
  await p.evaluate(() => { keepSet(false); DATA_REV++; refreshAll(); }); await p.waitForTimeout(1600); await p.reload(); await p.waitForTimeout(900);
  (await p.evaluate(() => RAW.length)) === 0 ? ok() : bad('DO12', 'with "keep" off the data came back');
  await p.evaluate(() => keepSet(true));
  await feed(p, [['k3.csv', 'Compound,DC50 (nM),Dmax (%)\nM2,10,90\n']]); await p.waitForTimeout(1500);
  await p.evaluate(() => forgetSession(false)); await p.reload(); await p.waitForTimeout(900);
  (await p.evaluate(() => RAW.length)) === 0 ? ok() : bad('DO12', '"Forget" left the data');
  await idbPut(p, { v: 1, cpds: [{ compound: 5, t: 'x' }], targets: [] }); await p.reload(); await p.waitForTimeout(900);
  await idbPut(p, { v: 1, cpds: [{ compound: 'ok', t: [['A', { dc50: 'abc', dmax: 1e999, dc50_q: '<script>' }]] }], targets: ['A'] }); await p.reload(); await p.waitForTimeout(900);
  const odd = await p.evaluate(() => { const d = RAW[0] && RAW[0].targets.A; return RAW.length === 1 && d && d.dc50 === null && d.dc50_q === '' ; });
  odd ? ok() : bad('DO12', 'a hand-made record was not cleaned: text kept as a number or a bound');
  p.errs.length ? bad('DO12', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});


// ── DO13: R-groups, matched pairs and the common core ──
if (run('DO13')) await guard('DO13', async () => {
  const p = await openChem();
  const up = await p.evaluate(async () => { try { await Chem.load(); return true; } catch (e) { return false; } });
  if (!up) { skipped.push('DO13 — RDKit could not be loaded'); await p.context().close(); return; }
  const R = await p.evaluate(async () => {
    const pd = n => Math.pow(10, 9 - n);                         // a DC50 (nM) that is this pDC50
    const set = [['A', 'CC(=O)Nc1ccc(F)cc1', 7], ['B', 'CC(=O)Nc1ccc(Cl)cc1', 8], ['C', 'CC(=O)Nc1ccc(OC)cc1', 6], ['D', 'CC(=O)Nc1ccccc1C', 5], ['E', 'CCC(=O)Nc1ccc(F)cc1', 7.5], ['F', 'c1ccccc1O', 4], ['G', 'CC(=O)Nc1ccccc1', 6.5], ['H', 'CC(=O)Nc1ccc(-c2ccccc2)cc1', 7.2], ['D2', 'CC(=O)Nc1c(Cl)cccc1', 5.5],
      ['X1', 'c1ccccc1C(=O)NCCNC(=O)c1ccccc1', 6], ['X2', 'c1ccccc1C(=O)NCCCNC(=O)c1ccccc1', 7], ['X3', 'c1ccccc1C(=O)NCCCCNC(=O)c1ccccc1', 8]];
    RAW = set.map(([n, s, p]) => ({ compound: n, smiles: s, targets: Object.assign(Object.create(null), { T: { dc50: pd(p), dc50_sd: null, dmax: 80, dmax_sd: null } }) })); TARGETS = ['T']; COLS = []; META = {};
    _dataReplaced(); await Chem.computeAll();
    const name = i => RAW[i].compound, out = {};
    // R-groups: the same core written as a SMILES, with a * where a group goes, and badly
    const rg = await Chem.rgroups('CC(=O)Nc1ccccc1', RAW.filter(c => c._ch && c._ch.ok));
    const grp = (res, n) => { const r = res.rows.find(x => name(x.i) === n); return r ? r.groups.map(g => g.pos + '=' + g.smi).sort().join(' ') : null; };
    out.rg = { n: rg.rows.length, no: rg.nomatch, pos: rg.pos.length, A: grp(rg, 'A'), B: grp(rg, 'B'), C: grp(rg, 'C'), D: grp(rg, 'D'), D2: grp(rg, 'D2'), H: grp(rg, 'H'), E: grp(rg, 'E'), G: grp(rg, 'G') };
    const rg2 = await Chem.rgroups('O=C(C)Nc1ccc(*)cc1', RAW.filter(c => c._ch && c._ch.ok));
    out.rg2 = { n: rg2.rows.length, A: grp(rg2, 'A'), G: grp(rg2, 'G') };
    out.bad = (await Chem.rgroups('((not a core', RAW)).error;
    // the screen: the leaderboard is by group, and a click shows exactly those compounds
    switchTab('sar'); await new Promise(r => setTimeout(r, 300));
    $('rg-core').value = 'CC(=O)Nc1ccccc1'; await rgRun(); await new Promise(r => setTimeout(r, 300));
    const para = SAR.rg.pos.find(p => SAR.rg.rows.some(r => name(r.i) === 'A' && r.groups.some(g => g.pos === p.key)));
    out.ui = { rows: document.querySelectorAll('#sar-rg .rg-t tbody tr').length, lead: document.querySelectorAll('#sar-rg .rg-g').length, svgs: document.querySelectorAll('#sar-rg .frag svg').length };
    rgPick(para.key, '*F'); out.pick = [...FILT.ids].map(name).sort().join(); FILT.ids = null;
    // matched pairs: F→Cl and F→OMe at the same place; Δ is the second minus the first; a pair is counted once
    SAR.mmo = { maxVar: 10, linker: false, maxLinker: 24, minN: 1, sort: 'gain' };
    SAR.mm = { res: await Chem.mmp(RAW.filter(c => c._ch && c._ch.ok), SAR.mmo) };
    const st = mmpStats(), find = (a, b) => st.find(r => r.t.from === a && r.t.to === b);
    const fc = find('Cl[*:1]', 'F[*:1]'), co = find('COC' + '', 'x');
    out.mm = { n: st.length, once: !find('F[*:1]', 'Cl[*:1]'), ClF: fc && [fc.n, +fc.mean.toFixed(6)], pairsA: st.filter(r => r.t.pairs.some(([a, b]) => name(a) === 'A' && name(b) === 'B' || name(a) === 'B' && name(b) === 'A')).length, twice: st.some(r => r.t.pairs.length !== new Set(r.t.pairs.map(x => x.join())).size) };
    // linker changes: NCCN → NCCCN → NCCCCN between the same ends
    SAR.mmo.linker = true; SAR.mmo.minN = 1;
    SAR.mm = { res: await Chem.mmp(RAW.filter(c => c._ch && c._ch.ok && /^X/.test(c.compound)), SAR.mmo) };
    const st2 = mmpStats();
    out.lk = { n: st2.length, two: st2.filter(r => /\[\*:2\]/.test(r.t.from)).length, pair12: st2.some(r => /\[\*:2\]/.test(r.t.from) && r.t.pairs.some(([a, b]) => [name(a), name(b)].sort().join() === 'X1,X2')), d12: (st2.find(r => /\[\*:2\]/.test(r.t.from) && r.t.pairs.some(([a, b]) => [name(a), name(b)].sort().join() === 'X1,X2')) || {}).mean, from12: (() => { const r = st2.find(r => /\[\*:2\]/.test(r.t.from) && r.t.pairs.some(([a, b]) => [name(a), name(b)].sort().join() === 'X1,X2')); const pr = r && r.t.pairs.find(([a, b]) => [name(a), name(b)].sort().join() === 'X1,X2'); return pr ? name(pr[0]) : null; })() };
    // the common core, and a series drawn on it
    const sm = Chem.mcs(RAW.filter(c => ['A', 'B', 'C', 'G'].includes(c.compound)));
    out.mcs = sm ? (sm.match(/\[#/g) || []).length : 0;
    RAW.forEach(c => { c._series = ['A', 'B', 'C', 'G'].includes(c.compound) ? 'S1' : null; }); FILT.series = 'S1'; SAR.align = true; await serCore();
    switchTab('table'); setView('cards'); await new Promise(r => setTimeout(r, 900));
    const tiles = [...document.querySelectorAll('#cards-host .tile.on, .card-c .tile.on')];
    out.ser = { qo: !!SERCORE.qo, tiles: tiles.length, hl: tiles.filter(t => /#8[Cc][Bb][78][Ff][9Aa]/i.test(t.innerHTML)).length };
    SAR.align = false; await serCore(); Chem.clearSvg(); setView('cards'); await new Promise(r => setTimeout(r, 300)); setView('table'); FILT.series = null;
    return out;
  });
  const q = R.rg;
  q.n === 8 && q.no === 4 && q.pos >= 2 ? ok() : bad('DO13', 'the core of an acetanilide is carried by ' + q.n + ' of 12 (' + q.no + ' not), at ' + q.pos + ' positions: ' + JSON.stringify(q));
  /=\*F$/.test(q.A) && /=\*Cl$/.test(q.B) && /=\*OC$/.test(q.C) && q.A.split('=')[0] === q.B.split('=')[0] && q.B.split('=')[0] === q.C.split('=')[0] ? ok() : bad('DO13', 'para F, Cl and OMe are not one position with their own groups: ' + JSON.stringify([q.A, q.B, q.C]));
  q.H && q.H.split('=')[0] === q.A.split('=')[0] && /=\*c1ccccc1$/.test(q.H) ? ok() : bad('DO13', 'a ring in a group (para phenyl) is not written back as a ring: ' + q.H);
  q.D && q.D.split('=')[0] !== q.A.split('=')[0] && /=\*C$/.test(q.D) ? ok() : bad('DO13', 'an ortho methyl sits in the para position: ' + JSON.stringify([q.A, q.D]));
  q.D2 && q.D2.split('=')[0] === q.D.split('=')[0] && /=\*Cl$/.test(q.D2) ? ok() : bad('DO13', 'ortho on either side of a symmetric core is not one position: ' + JSON.stringify([q.D, q.D2]));
  q.E && q.E.split(' ').length === 2 && q.E.includes(q.A) && q.G === null || q.G === '' || (q.G && q.G.length === 0) ? ok() : bad('DO13', 'a compound with two groups, or none: ' + JSON.stringify([q.E, q.G]));
  R.rg2.n === 8 && R.rg2.A === q.A ? ok() : bad('DO13', 'a core written with a * is not the same core: ' + JSON.stringify(R.rg2));
  /cannot read/i.test(R.bad || '') ? ok() : bad('DO13', 'an unreadable core says: ' + R.bad);
  R.ui.rows === 8 && R.ui.lead >= 4 && R.ui.svgs >= 10 ? ok() : bad('DO13', 'the R-group card draws ' + JSON.stringify(R.ui));
  R.pick === 'A,E' ? ok() : bad('DO13', 'clicking the group F shows ' + R.pick + ', expected A,E');
  R.mm.ClF && R.mm.ClF[0] === 1 && Math.abs(R.mm.ClF[1] - (7 - 8)) < 1e-9 ? ok() : bad('DO13', 'Cl→F should be −1 over 1 pair: ' + JSON.stringify(R.mm));
  !R.mm.twice && R.mm.once && R.mm.pairsA >= 1 ? ok() : bad('DO13', 'pairs counted twice or A–B missing: ' + JSON.stringify(R.mm));
  R.lk.two >= 1 && R.lk.pair12 && Math.abs(Math.abs(R.lk.d12) - 1) < 1e-9 && (R.lk.from12 === 'X1' ? R.lk.d12 > 0 : R.lk.d12 < 0) ? ok() : bad('DO13', 'linker changes between the same two ends: ' + JSON.stringify(R.lk));
  R.mcs >= 8 ? ok() : bad('DO13', 'the common core of four acetanilides has ' + R.mcs + ' atoms');
  R.ser.qo && R.ser.tiles >= 3 && R.ser.hl === R.ser.tiles ? ok() : bad('DO13', 'the series is not drawn on its core: ' + JSON.stringify(R.ser));
  p.errs.length ? bad('DO13', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// ── DO14: estimates are the published formulas ──
if (run('DO14')) await guard('DO14', async () => {
  const p = await openChem();
  const up = await p.evaluate(async () => { try { await Chem.load(); return true; } catch (e) { return false; } });
  if (!up) { skipped.push('DO14 — RDKit could not be loaded'); await p.context().close(); return; }
  const R = await p.evaluate(async () => {
    RAW = [['asp', 'CC(=O)Oc1ccccc1C(=O)O', 10], ['big', 'Nc1cccc2C(=O)N(C3CCC(=O)NC3=O)C(=O)c12', 100], ['pal', 'CCCCCCCCCCCCCCCC(=O)O', 1000], ['suc', 'OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O', 1000]].map(([n, s, d]) => ({ compound: n, smiles: s, targets: Object.assign(Object.create(null), { T: { dc50: d, dc50_sd: null, dmax: 90, dmax_sd: null } }) }));
    TARGETS = ['T']; COLS = []; META = {}; _dataReplaced(); await Chem.computeAll();
    const g = n => RAW.find(c => c.compound === n), pv = (n, k) => propVal(g(n), k), F = id => fieldById(id), o = {};
    const a = g('asp')._ch.p, arom = 6 / 13;
    o.logs = [pv('asp', 'logs'), 0.16 - 0.63 * a.clogp - 0.0062 * a.mw + 0.066 * a.rotb - 0.74 * arom];
    o.veber = ['asp', 'pal', 'suc'].map(n => pv(n, 'veber')); o.egan = ['asp', 'pal', 'suc'].map(n => pv(n, 'egan'));
    o.num = { palRot: pv('pal', 'rotb'), palTpsa: pv('pal', 'tpsa'), sucRot: pv('suc', 'rotb'), sucTpsa: pv('suc', 'tpsa') };
    o.lipe = [F('lipe').get(g('asp'), null), 8 - a.clogp];
    o.le = [F('le').get(g('asp'), null), 1.37 * 8 / a.heavy];
    o.fields = ['logs', 'veber', 'egan', 'lipe', 'le'].every(id => !!F(id));
    return o;
  });
  Math.abs(R.logs[0] - R.logs[1]) < 1e-9 && R.logs[0] < -1.5 && R.logs[0] > -2.5 ? ok() : bad('DO14', 'ESOL for aspirin is ' + R.logs[0] + ', the formula gives ' + R.logs[1]);
  R.veber.join() === '0,1,1' && R.egan.join() === '0,0,1' ? ok() : bad('DO14', 'Veber / Egan violations of aspirin, palmitic acid (14 rotatable bonds, TPSA 37) and sucrose (TPSA 190): ' + R.veber.join() + ' / ' + R.egan.join() + ' ' + JSON.stringify(R.num));
  Math.abs(R.lipe[0] - R.lipe[1]) < 1e-9 && Math.abs(R.le[0] - R.le[1]) < 1e-9 ? ok() : bad('DO14', 'LipE / efficiency of a 10 nM aspirin: ' + JSON.stringify([R.lipe, R.le]));
  R.fields ? ok() : bad('DO14', 'the estimates are not offered as fields');
  p.errs.length ? bad('DO14', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// ── DO15: what is sent is what is shown ──
if (run('DO15')) await guard('DO15', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route('**/xlsx.full.min.js', r => r.fulfill({ contentType: 'application/javascript', body: VENDOR }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|cdnjs)/, r => r.abort());
  // a stand-in for the Hub: a page with Dora in a frame that answers openApp, so what Dora sends can be read
  await page.route('**/__hub.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><script>window.__sent=[];window.APP_INFO={labbook:{},hitfinder:{}};window._isAppAccessible=function(id){return id!=="hitfinder"||window.__hf!==false;};window.openApp=function(id,a,b,ctx){window.__sent.push({id:id,ctx:ctx});};</script><iframe id="d" src="' + FILE + '" style="width:1400px;height:880px"></iframe>' }));
  await page.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await page.goto(BASE + '/__hub.html'); await page.waitForTimeout(900);
  const fr = page.frames().find(f => f !== page.mainFrame());
  await fr.evaluate(() => {
    RAW = [['K1', 'CCO', '>', 5000, 20], ['K2', 'c1ccccc1', '', 12.5, 90], ['K3', '', '', null, null], ['K4', 'CCN', '', 300, 60]].map(([n, s, q, d, m]) => ({ compound: n, smiles: s, targets: Object.assign(Object.create(null), { BRD4: { dc50: d, dc50_sd: null, dmax: m, dmax_sd: null, dc50_q: q, nd: n === 'K3' }, BRD2: { dc50: null, dc50_sd: null, dmax: null, dmax_sd: null, dc50_q: '' } }) })); TARGETS = ['BRD4', 'BRD2']; COLS = []; META = {}; _dataReplaced();
  });
  await page.waitForTimeout(500);
  const sent = () => page.evaluate(() => window.__sent.slice());
  await fr.evaluate(() => { ddClose && 0; sendLabbook(false); });
  let s = await sent();
  const L = s[0] && s[0].ctx && s[0].ctx.tables && s[0].ctx.tables[0];
  s[0] && s[0].id === 'labbook' && s[0].ctx.source === 'dora' && L && L.rows.length === 4 && L.columns.includes('Compound') && L.columns.includes('SMILES') && L.rows[0].includes('K1') ? ok() : bad('DO15', 'Labbook got ' + JSON.stringify(s[0]).slice(0, 300));
  await fr.evaluate(() => sendLabbook(false)); s = await sent();
  s[1] && s[1].ctx.tables[0].id === L.id ? ok() : bad('DO15', 'the same table sent twice has two ids (Labbook would file it twice)');
  await fr.evaluate(() => { SELSET = new Set([1, 3]); sendLabbook(true); }); s = await sent();
  s[2] && s[2].ctx.tables[0].rows.length === 2 && /picked/.test(s[2].ctx.tables[0].label) ? ok() : bad('DO15', 'only the picked: ' + JSON.stringify(s[2] && s[2].ctx.tables[0].label) + ' ' + (s[2] && s[2].ctx.tables[0].rows.length));
  await fr.evaluate(() => { SELSET = new Set(); sendHitFinder(0, false); }); s = await sent();
  const H = s[3] && s[3].ctx;
  s[3] && s[3].id === 'hitfinder' && H.source === 'dora' && H.table[0].join() === 'Compound,DC50 (nM),Dmax (%)' && H.table.length === 5 && H.table[1][1] === '> 5000' && H.table[2][1] === 12.5 && H.table[3][1] === 'n.d.' && H.table[4][1] === 300 ? ok() : bad('DO15', 'Hit Finder got ' + JSON.stringify(H && H.table));
  H && H.structures && H.structures.length === 4 && H.structures[1].join() === 'Compound,SMILES' || (H && H.structures && H.structures[1][0] === 'K1' && !H.structures.some(r => r[0] === 'K3')) ? ok() : bad('DO15', 'the structures sent: ' + JSON.stringify(H && H.structures));
  // the numbers go in nM and Dmax in % whatever the screen shows
  await fr.evaluate(() => { setDgUnit('uM'); setDmaxUnit('frac'); sendHitFinder(0, false); }); s = await sent();
  s[4] && s[4].ctx.table[2][1] === 12.5 && s[4].ctx.table[2][2] === 90 ? ok() : bad('DO15', 'the unit shown leaked into what Hit Finder gets: ' + JSON.stringify(s[4] && s[4].ctx.table[2]));
  await fr.evaluate(() => sendHitFinder(1, false)); s = await sent();
  s.length === 5 ? ok() : bad('DO15', 'a target with nothing measured was sent anyway');
  // outside the Hub, or without access, the items are off and nothing is sent
  await page.evaluate(() => { window.__hf = false; });
  const menu = await fr.evaluate(() => { renderExportMenu(); return [...document.querySelectorAll('#exp-menu .dd-i')].filter(b => /^Send to/.test(b.textContent)).map(b => [b.textContent.replace(/\s+/g, ' ').trim(), b.disabled]); });
  menu.length === 3 && menu[0][1] === false && menu[1][1] === true && menu[2][1] === true ? ok() : bad('DO15', 'the Send items with no Hit Finder access: ' + JSON.stringify(menu));
  const alone = await ctx.newPage(); await alone.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort()); await alone.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  await alone.goto(BASE + FILE); await alone.waitForTimeout(600);
  const solo = await alone.evaluate(() => { loadTestData(); renderExportMenu(); return [...document.querySelectorAll('#exp-menu .dd-i')].filter(b => /^Send to/.test(b.textContent)).every(b => b.disabled); });
  solo ? ok() : bad('DO15', 'standalone Dora offers a Send it cannot do');
  page.errs.length ? bad('DO15', 'errors: ' + page.errs.join(' | ')) : ok();
  await ctx.close();
});


// ── DO16: the new screens fit and are on the type scale ──
if (run('DO16')) await guard('DO16', async () => {
  for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) for (const theme of ['light', 'dark']) {
    const p = await openChem(w, h);
    const up = await p.evaluate(async () => { try { await Chem.load(); return true; } catch (e) { return false; } });
    if (!up) { skipped.push('DO16 — RDKit could not be loaded'); await p.context().close(); return; }
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    const r = await p.evaluate(async () => {
      loadTestData(); await Chem.computeAll(); await new Promise(r => setTimeout(r, 500));
      const out = {};
      const scale = new Set(['--fs-1', '--fs-2', '--fs-3', '--fs-4', '--fs-5', '--fs-6', '--fs-7', '--fs-8', '--fs-9'].map(v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;font-size:var(' + v + ')'; document.body.appendChild(e); const px = parseFloat(getComputedStyle(e).fontSize); e.remove(); return px; }));
      const off = root => { const bad = []; root.querySelectorAll('*').forEach(el => { if (el.closest('svg') || el.closest('script,style') || el.closest('[hidden]')) return; const t = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!t) return; const px = parseFloat(getComputedStyle(el).fontSize); if (![...scale].some(x => Math.abs(x - px) < 0.2)) bad.push(el.tagName + '.' + el.className + ' ' + px.toFixed(2) + 'px "' + el.textContent.trim().slice(0, 24) + '"'); }); return bad; };
      const over = (root, name) => { const bad = []; root.querySelectorAll('.sar-card, .units-card, .map-card').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) bad.push(name + ' ' + (c.id || c.className) + ' ' + c.scrollWidth + '>' + c.clientWidth); }); return bad; };
      switchTab('sar'); await new Promise(r => setTimeout(r, 300));
      $('rg-core').value = 'O=C1CCC(N2C(=O)c3ccccc3C2=O)C(=O)N1'; await rgRun(); await new Promise(r => setTimeout(r, 300));
      await mmpRun(); SAR.mmOpen = 0; sarRender(); await new Promise(r => setTimeout(r, 500));
      out.cards = document.querySelectorAll('#sar-ui .sar-card').length; out.rows = document.querySelectorAll('#sar-rg .rg-t tbody tr').length; out.tf = document.querySelectorAll('#sar-mmp .tf').length;
      out.fs = off($('sar-ui')); out.over = over($('sar-ui'), 'sar');
      out.page = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      switchTab('load'); document.getElementById('units-open').open = true; await new Promise(r => setTimeout(r, 200));
      out.fsU = off($('units-card')); out.overU = over($('units-card').parentNode, 'data'); out.page2 = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    });
    const tag = w + 'px ' + theme;
    r.cards === 6 && r.rows > 5 && r.tf > 3 ? ok() : bad('DO16', tag + ': the SAR tab shows ' + JSON.stringify({ c: r.cards, rows: r.rows, tf: r.tf }));
    !r.fs.length && !r.fsU.length ? ok() : bad('DO16', tag + ': text off the type scale: ' + r.fs.concat(r.fsU).slice(0, 3).join(' | '));
    !r.over.length && !r.overU.length && r.page <= 1 && r.page2 <= 1 ? ok() : bad('DO16', tag + ': something is wider than its box: ' + r.over.concat(r.overU).join(' | ') + ' page ' + r.page + '/' + r.page2);
    p.errs.length ? bad('DO16', tag + ' errors: ' + p.errs.join(' | ')) : ok();
    await p.context().close();
  }
});

// DO17 — every popover is a layer with a role. The laptop sweep (tools/mobile_hub_sweep.mjs) treats [role=menu]/[role=dialog] as a layer the person opened on purpose;
// Filters, Columns, Score and Range were bare divs, so the table text under each open panel was reported as covered (CI red on 704a2a4..1248741, 2026-11-23).
if (run('DO17')) await guard('DO17', async () => {
  const p = await open();
  const r = await p.evaluate(async () => {
    loadTestData(); switchTab('table'); await new Promise(r => setTimeout(r, 400));
    const out = { bare: [], opened: [] };
    document.querySelectorAll('.dd-menu').forEach(m => { if (!m.matches('[role=menu],[role=dialog]')) out.bare.push(m.id || m.className); });
    for (const id of ['flt-dd', 'col-dd', 'sc-dd']) {
      ddToggle(id); await new Promise(r => setTimeout(r, 150));
      const m = document.querySelector('#' + id + ' .dd-menu'), b = m.getBoundingClientRect();
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + Math.min(40, b.height / 2));
      out.opened.push({ id, shown: !m.hidden && b.width > 50 && b.height > 30, layer: !!(top && top.closest('[role=menu],[role=dialog]')) });
      ddClose();
    }
    return out;
  });
  !r.bare.length ? ok() : bad('DO17', 'a popover with no role (the sweep reads what it covers as covered text): ' + r.bare.join(', '));
  r.opened.every(o => o.shown && o.layer) ? ok() : bad('DO17', 'an opened panel is not drawn as a layer: ' + JSON.stringify(r.opened));
  p.errs.length ? bad('DO17', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

// DO18 — nothing moves when a choice is made. Changing the DC50 unit, the Dmax unit or the size of the structures moved every column of Results and reflowed the filter bar (an auto-width table
// and readouts as wide as their text; Jon, 2026-11-24). The columns stay where they are, the toolbar controls stay where they are, the Plot toolbar is two rows, a header that says SMILES is
// the SMILES column even when the molecules are short (CCO), and a small molecule is drawn with a bond of a drawing, not as long as its tile.
if (run('DO18')) await guard('DO18', async () => {
  const p = await openChem();
  await p.evaluate(() => { loadTestData(); switchTab('table'); });
  await p.waitForFunction(() => RAW.length && RAW.every(c => !c.smiles || c._ch), { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);
  const snap = () => p.evaluate(() => {
    const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)].join(','); };
    return { ths: [...document.querySelectorAll('#main-thead tr:nth-child(2) th')].map(r), row: [...document.querySelector('#table-body tr').children].map(r),
      bar: [...document.querySelectorAll('#fbar .ctl-l > *, #panel-table .tbar .ctl-l > *')].filter(e => e.offsetParent).map(e => (e.id || e.className) + ':' + r(e)),
      w: document.getElementById('main-table').getBoundingClientRect().width };
  });
  const base = await snap(); const moved = [];
  const steps = [['setDgUnit', ['pM', 'uM', 'mM', 'M', 'p', 'nM']], ['setDmaxUnit', ['frac', 'rem', 'remfrac', 'pct']]];
  for (const [fn, vals] of steps) for (const v of vals) {
    await p.evaluate(([f, x]) => window[f](x), [fn, v]); await p.waitForTimeout(250);
    const n = await snap();
    if (n.ths.join('|') !== base.ths.join('|')) moved.push(fn + '(' + v + ') moved the columns');
    if (n.row.join('|') !== base.row.join('|')) moved.push(fn + '(' + v + ') moved the cells');
    if (n.bar.join('|') !== base.bar.join('|')) moved.push(fn + '(' + v + ') moved the toolbar');
  }
  !moved.length ? ok() : bad('DO18', 'a choice moved the layout: ' + moved.slice(0, 4).join(' · '));
  // the size of the structures changes the structure column and nothing else's width
  const m0 = await snap(); await p.evaluate(() => setTileSize('l')); await p.waitForTimeout(250); const l1 = await snap(); await p.evaluate(() => setTileSize('m'));
  const wOf = a => a.ths.map(t => +t.split(',')[2]);
  JSON.stringify(wOf(m0).slice(1)) === JSON.stringify(wOf(l1).slice(1)) ? ok() : bad('DO18', 'the structure size changed another column: ' + wOf(m0).join('/') + ' → ' + wOf(l1).join('/'));
  // the Plot toolbar is two rows at a laptop width, with every control inside the viewport
  const pt = await p.evaluate(async () => { switchTab('scatter'); await new Promise(r => setTimeout(r, 500));
    const ys = new Set(), out = [...document.querySelectorAll('#plot-ui .ctl-l > *, #plot-ui .ctl-r > *')].filter(e => e.offsetParent).map(e => { const b = e.getBoundingClientRect(); ys.add(Math.round(b.y / 8)); return b.right; });
    return { rows: ys.size, right: Math.max(...out), vw: innerWidth }; });
  pt.rows <= 4 && pt.right <= pt.vw ? ok() : bad('DO18', 'the Plot toolbar wraps into too many rows or leaves the window: ' + JSON.stringify(pt));
  // SMILES by its header, short molecules and a typo
  const sm = await p.evaluate(() => { const L = detectLayout([['Compound', 'SMILES', 'DC50 (nM)', 'Dmax (%)'], ['A', 'CCO', 10, 90], ['B', 'CCN', 20, 80], ['C', 'not a smiles', 30, 70]]); return L.cols.map(c => c.role).join(','); });
  sm === 'compound,smiles,dc50,dmax' ? ok() : bad('DO18', 'a column headed SMILES holding CCO / CCN is read as ' + sm);
  // a small molecule is not blown up to its tile: ethanol's longest bond in a medium tile is a bond of a drawing
  const bond = await p.evaluate(async () => { const rd = Chem.get(); const m = rd.get_mol('CCO'); const c = { _ch: { ok: true, p: { heavy: 3 }, can: 'CCO' }, _i: 99999, smiles: 'CCO' };
    const s = Chem.svg(Object.assign(c, {}), 270, 124); m.delete(); let mx = 0; for (const x of s.matchAll(/d='M ([\d.]+),([\d.]+) L ([\d.]+),([\d.]+)/g)) mx = Math.max(mx, Math.hypot(x[3] - x[1], x[4] - x[2])); return mx; });
  bond > 5 && bond < 45 ? ok() : bad('DO18', 'ethanol in a 270×124 tile has a bond of ' + Math.round(bond) + ' px (RDKit fills the tile when nothing caps it)');
  const e = p.errs.filter(x => !/Failed to load resource/.test(x)); e.length ? bad('DO18', 'errors: ' + e.join(' | ')) : ok();
  await p.context().close();
});

await browser.close();
for (const f of findings) console.log(f);
for (const k of skipped) console.log('~ skipped: ' + k);
console.log(`\ndora invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
