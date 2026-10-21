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
const findings = []; let passed = 0;
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
  const pr = await p.evaluate(() => ({ pressed: document.getElementById('pt-0').getAttribute('aria-pressed'), injected: !!document.querySelector('#protein-toggle i,#main-thead i,#table-body b,#detail-grid i') }));
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
    const band = (y0, y1) => { const d = x.getImageData(0, y0, c.width, y1 - y0).data; let hi = 0, dk = 0; for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l > 150) hi++; else if (l > 40 && l < 110) dk++; } return { hi, dk }; };
    return { w: bm.width, h: bm.height, axis: band(c.height - 60, c.height - 8), legend: band(0, 30) }; }, Array.from(sc.buf));
  px.axis.hi > 60 ? ok() : bad('DO4', 'the plot saved on black has dark axis text: ' + JSON.stringify(px.axis));
  px.legend.hi > 60 ? ok() : bad('DO4', 'the saved plot has no legend strip: ' + JSON.stringify(px.legend));
  const back = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--chart-axis').trim() + '|' + (chartInstance && chartInstance.options.scales.x.ticks.color));
  back.split('|')[0] === back.split('|')[1] ? ok() : bad('DO4', 'after saving, the live chart kept the saved palette: ' + back);
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

await browser.close();
for (const f of findings) console.log(f);
console.log(`\ndora invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
