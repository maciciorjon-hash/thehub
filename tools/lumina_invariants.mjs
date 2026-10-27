// Lumina invariants — the classes of bug the 2026-09-30 pass found, checked so they cannot come back.
//
// Playwright loads apps/lumina/lumina.html, builds a PHERAstar-shaped workbook in the page (so no
// fixture file is needed), and drives the real controls: drop files on the reader input, drag a
// gradient and compounds onto the plate, fit, and then asks each surface the question a person would.
//
//   L1  plates are named after their reader file, in name order; dropping the same run again replaces
//       rather than duplicates; a name the user typed is never overwritten; a hostile name is text
//   L2  ticking a box in Fit settings never moves another row (the old panel hid rows under the click)
//   L3  every unit × scale: the table, Copy table, the results CSV, the raw CSV and the Excel workbook
//       all agree with the fit — a value × its unit is the fitted potency (or its log)
//   L4  ↑ ↓ Home End move through the compounds and keep the row in view; a focused field keeps its keys
//   L5  right-click offers a menu on every surface, ↑ ↓ Enter Esc drive it, a field keeps the browser's own
//   L6  the Plot draws every pair of quantities with no NaN, one point per curve; click selects; PNG saves
//   L7  a run with no control is raw counts: no "%" on the effect, no replicate-SD flags in % of control
//   L8  a reading is never written wider than its well
//   L9  a reader file whose grid is not the size of the plate on screen says so
//   L11 a point left out of its curve: the fit is remade without it, the raw export marks it, the Prism tables omit it,
//       the plate crosses it, and ⌘Z brings the fit back exactly (the click / right-click / undo gestures are in tools/transfer_invariants.mjs)
//   L13 Setup is the same walk as Beacon's (tools/setupkit): five steps with Back / Next, typed control ranges mark exactly those wells,
//       placing the names makes the compounds, the series and the plates they need, Escape closes, and ⌘Z undoes it all
//   L14 normalise to viability   Optional. Each reading is divided by the fluorescence of the same well before the controls: readings distorted well by well
//                                 and divided back give exactly the undistorted curves, from a GloMax double read stored with the plate and from
//                                 fluorescence-only files named for their plates; off, the distortion shows; a plate without viability is left out
//                                 and said; the session, the raw export and ⌘Z carry it.
//   L24 a curve must be better than a line   The 4PL returns a sigmoid for any series, so a flat one of noise got a cliff at the edge of the doses, an Emax of
//                                 hundreds of per cent and a potency nobody measured. A fit is tested against the mean of its own readings (F test, p < 0.05):
//                                 a flat series is the flat line (span 0, "n.d.", out of the Plot, no potency to Labbook), a real curve and a series already maximal
//                                 at the lowest dose keep their fits, and no free plateau leaves the readings by more than a quarter of their range.
//   L10 the potency and the effect are called what the selected assay calls them — DC50/Dmax, IC50/Span,
//       IC50, EC50/Emax — in the table, the curve, the Plot, every export and what goes to Labbook
//
//   node tools/lumina_invariants.mjs [--url=URL] [--xlsx=PATH]      exit 1 on any finding
// SheetJS comes from the page's own CDN tag; --xlsx serves a local copy for an offline run.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL_ = arg('url', 'file://' + path.resolve(HERE, '../apps/lumina/lumina.html'));
const XLSX_LOCAL = arg('xlsx', '');

const findings = [];
let passed = 0;
function check(name, ok, detail) { if (process.env.LM_TRACE) console.log(ok ? 'ok  ' : 'FAIL', name); if (ok) passed++; else findings.push('✗ ' + name + (detail ? ' — ' + detail : '')); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
await page.route(/^https?:/, r => {
  const u = r.request().url();
  if (/xlsx/i.test(u) && XLSX_LOCAL) return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(XLSX_LOCAL) });
  if (/xlsx/i.test(u)) return r.continue();
  return r.abort();
});
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.clear(); localStorage.setItem('hub_theme', 'light'); } catch (e) {} });
await page.waitForFunction(() => typeof window.XLSX !== 'undefined', null, { timeout: 15000 }).catch(() => {});
const hasX = await page.evaluate(() => typeof window.XLSX !== 'undefined');
if (!hasX) { console.log('SheetJS did not load — the file-drop cases are skipped (pass --xlsx=PATH offline).'); }

// ── fixtures ────────────────────────────────────────────────────────────────────────────
// A PHERAstar-shaped sheet: preamble lines, a header row 1..12, then A..H — 4 compounds in
// duplicate, 12 points each, the curves planted so a fit has something to find.
async function drop(names) {
  await page.evaluate(async (names) => {
    const files = names.map((nm, k) => {
      const aoa = [[], [], ['User: USER'], ['Test Name: fixture'], ['ID1: ' + nm.replace(/\.xlsx$/, '')], ['Luminescence'], [], [], [null, 'Raw Data (LUM plus)'], [null].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])];
      const EC = [3e-8, 1e-7, 6e-7, 3e-6];
      'ABCDEFGH'.split('').forEach((L, r) => {
        const row = [L];
        for (let c = 0; c < 12; c++) { const x = Math.log10(10e-6 / Math.pow(3, c)); const e = Math.log10(EC[r >> 1] * (1 + k * 0.1)); row.push(Math.round(3.4e6 * (0.03 + 0.97 / (1 + Math.pow(10, (e - x) * 1.1))) * (1 + (r % 2 ? 0.04 : -0.04) * Math.sin(c + r)))); }
        aoa.push(row);
      });
      const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Microplate End point');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new File([buf], nm, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('reader-file'); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, names);
  await page.waitForTimeout(700);
}
const wellXY = pos => page.evaluate(q => { const b = document.querySelector('.well[data-pos="' + q + '"]').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, pos);
async function drag(a, c) { const [x1, y1] = await wellXY(a), [x2, y2] = await wellXY(c); await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 4 }); await page.mouse.move(x2, y2, { steps: 4 }); await page.mouse.up(); }
async function layout() {
  await page.evaluate(() => switchSubtab('layout')); await page.waitForTimeout(100);
  await drag('A1', 'H12'); await page.fill('#lm-top', '10'); await page.selectOption('#lm-unit', '1e-6'); await page.click('#lm-apply-grad');
  await drag('A1', 'H12'); await page.click('#lm-modes [data-m=cpd]'); await page.click('#lm-reps [data-n="2"]'); await page.click('#lm-apply-cpd');
}
const ev = (fn, a) => page.evaluate(fn, a);
async function download(fn) { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.evaluate(fn)]); const f = await d.path(); return { name: d.suggestedFilename(), text: fs.readFileSync(f, 'utf8') }; }
// Most exports are read in the page (Chromium stops honouring repeated automatic downloads after
// about ten); the workbook and the PNG are still real downloads.
async function capture(fn) {
  await page.evaluate(() => { window.__cap = null; if (!window.__lmDl) { window.__lmDl = window._lmDownload; window._lmDownload = (name, text) => { window.__cap = { name, text }; }; } });
  await page.evaluate(fn);
  return page.evaluate(() => window.__cap);
}
function csv(text) {   // a small RFC-4180 reader
  text = text.replace(/^﻿/, ''); const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows;
}

try { if (hasX) {
  // ── L1 plate names ───────────────────────────────────────────────────────────────────
  await ev(() => { document.getElementById('assay-type').value = 'ctg'; onAssayTypeChange(); });
  await drop(['CTG20260923_144h_B.xlsx', 'CTG20260923_144h_A.xlsx', 'CTG20260923_144h_10.xlsx']);
  let names = await ev(() => state.plates.map((p, i) => lmPlateName(i)));
  check('L1 three files → three plates named after the files, in natural name order', JSON.stringify(names) === JSON.stringify(['CTG20260923_144h_10', 'CTG20260923_144h_A', 'CTG20260923_144h_B']) || JSON.stringify(names) === JSON.stringify(['CTG20260923_144h_A', 'CTG20260923_144h_B', 'CTG20260923_144h_10']), JSON.stringify(names));
  await layout();
  await drop(['CTG20260923_144h_A.xlsx', 'CTG20260923_144h_B.xlsx']);
  check('L1 dropping a run again replaces its plate, it does not add one', (await ev(() => state.plates.length)) === 3, String(await ev(() => state.plates.length)));
  await ev(() => lmRenamePlate(0, 'Mine <b>&"x"'));
  const p0file = await ev(() => state.plates[0].file);
  await ev(f => { state.plate = 0; }, 0);
  await drop([p0file]);
  check('L1 a name the user typed survives loading a file into the plate', (await ev(() => lmPlateName(0))) === 'Mine <b>&"x"', await ev(() => lmPlateName(0)));
  check('L1 a hostile plate name is drawn as text', (await ev(() => document.querySelector('.lm-ptab .pt-n') && document.querySelector('.lm-ptab .pt-n').innerHTML.indexOf('<b>') < 0)) === true);
  await ev(() => lmRenamePlate(0, '   '));
  check('L1 an emptied name falls back to "Plate N"', (await ev(() => lmPlateName(0))) === 'Plate 1');
  await ev(() => { state.plates.forEach((p, i) => { p.name = ''; p.nameSrc = undefined; }); lmAfterChange(); });

  // ── fit for the rest ─────────────────────────────────────────────────────────────────
  await ev(() => { lmSetSel(new Set()); });
  // mark a control (column 12 would break the series, so use the last well of the gradient's row: none) — first the no-control run (L7)
  await page.click('#lm-fit'); await page.waitForTimeout(700);
  const fits = await ev(() => state.fitResults.length);
  check('the fixture fits (12 compounds over 3 plates)', fits === 12, String(fits));
  const raw = await ev(() => ({ norm: state.normalised, txt: document.querySelector('#results-table-wrap tbody tr').textContent, flags: state.fitResults.filter(r => r.flagSD).length, note: !document.getElementById('rs-note').hidden }));
  check('L7 no control → raw counts, not "%"', raw.norm === false && !/%/.test(raw.txt) && raw.note, JSON.stringify(raw));
  check('L7 no control → the SD flag (in % of control) does not fire', raw.flags === 0, String(raw.flags));

  // ── L2 settings stability ────────────────────────────────────────────────────────────
  await page.click('#rs-set-btn');
  const boxes = () => ev(() => Array.from(document.querySelectorAll('#rs-set .rs-opt')).filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','); }));
  const b0 = JSON.stringify(await boxes()); let moved = '';
  for (const id of ['qc-bot-en', 'qc-top-en', 'qc-hill-en', 'qc-hook-en', 'qc-r2-en', 'qc-sd-en', 'qc-bot-floor-en', 'qc-bot-en']) {
    const disabled = await ev(i => document.getElementById(i).disabled, id); if (disabled) continue;
    await page.click('#' + id); await page.waitForTimeout(60);
    if (JSON.stringify(await boxes()) !== b0) moved += id + ' ';
    const dis = await ev(i => { const n = document.getElementById(i).closest('.rs-opt').querySelector('input[type=number]'); return n.disabled === !document.getElementById(i).checked; }, id);
    if (!dis) moved += '(state ' + id + ') ';
  }
  check('L2 ticking a box in Fit settings moves no other row, and dims its own number', moved === '', moved);
  // put the settings back to their defaults (each box was ticked an odd or even number of times)
  for (const [id, want] of [['qc-r2-en', true], ['qc-sd-en', true], ['qc-hook-en', false], ['qc-bot-floor-en', true], ['qc-bot-en', false], ['qc-top-en', false], ['qc-hill-en', false]]) {
    if ((await ev(i => document.getElementById(i).checked, id)) !== want && !(await ev(i => document.getElementById(i).disabled, id))) await page.click('#' + id);
  }
  await page.click('#rs-set-btn');

  // ── mark a control so the run is normalised for the rest ────────────────────────────
  await ev(() => switchTab('input')); await page.waitForTimeout(100);
  await ev(() => { lmSetSel(new Set(['H11', 'H12'])); lmMarkCtrl('ctrl'); switchTab('results'); }); await page.waitForTimeout(700);
  const norm = await ev(() => ({ n: state.normalised, txt: document.querySelector('#results-table-wrap tbody tr').textContent }));
  check('L7 with a control the effect is a % again', norm.n === true && /%/.test(norm.txt), JSON.stringify(norm));

  // ── L3 units ─────────────────────────────────────────────────────────────────────────
  const MUL = { M: 1, mM: 1e-3, uM: 1e-6, nM: 1e-9, pM: 1e-12 };
  let l3 = [];
  for (const u of ['auto', 'M', 'mM', 'uM', 'nM', 'pM']) for (const log of [false, true]) {
    await ev(o => rsSetUnits(o), { u, log });
    const unit = u === 'auto' ? (log ? 'M' : 'nM') : u;
    if (process.env.LM_TRACE) console.log('units', u, log, await ev(() => [state.fitResults.length, document.querySelector('.tab.active').dataset.tab, document.getElementById('toast').textContent]), errs.slice(-2));
    const res = await capture(() => exportResultsCSV());
    const rows = csv(res.text), head = rows[0], r1 = rows[1];
    const ec = await ev(() => state.fitResults[0].ec50M);
    const col = head.findIndex(h => new RegExp('^' + (log ? 'Log' : '') + '(DC|IC|EC)50_' + unit + '$').test(h));
    if (col < 0) { l3.push(u + (log ? ' log' : '') + ': no ' + (log ? 'Log…_' : '…50_') + unit + ' column in ' + head.join('|')); continue; }
    const v = parseFloat(r1[col]), back = log ? Math.pow(10, v) * MUL[unit] : v * MUL[unit];
    if (!(Math.abs(back - ec) / ec < 2e-5)) l3.push(u + (log ? ' log' : '') + ': ' + r1[col] + ' ' + unit + ' ≠ ' + ec);
    // the same number on screen and in the copy
    const scr = await ev(() => document.querySelector('#results-table-wrap tbody tr td:nth-child(3)').textContent);
    if (u !== 'auto' && !/^-?[\d.e+-]+$/.test(scr.trim().replace(/^−/, '-'))) l3.push(u + ': screen "' + scr + '"');
    if (u === 'auto' && !log && !/[pnµm]?M$/.test(scr.trim())) l3.push('auto: screen "' + scr + '"');
  }
  check('L3 every unit × scale: the exported potency × its unit is the fitted one', l3.length === 0, l3.slice(0, 4).join(' · '));
  await ev(() => rsSetUnits({ u: 'auto', log: false }));
  // names with commas/quotes/formula characters round-trip through CSV
  await ev(() => { state.names[0] = 'A, "quoted" =cmd'; state.names[1] = '-minus'; lmMaterialize(); state.fitSig = null; });
  await ev(() => { switchTab('input'); switchTab('results'); }); await page.waitForTimeout(500);
  const cs = csv((await capture(() => exportResultsCSV())).text), ids = cs.slice(1).map(r => r[0]);
  check('L3 a compound name with a comma, quotes or a leading = survives the CSV (as text)', ids.some(x => /A, "quoted" =cmd$/.test(x)) && ids.every(x => !/^=/.test(x)), ids.slice(0, 3).join(' | '));
  const rawcsv = csv((await capture(() => exportRawCSV())).text);
  check('L3 the raw CSV has one line per well and a Plate column', rawcsv[0].indexOf('Plate') === 1 && rawcsv.length > 90, rawcsv[0].join('|') + ' ' + rawcsv.length);
  const xl = await download(() => exportXLSX()).catch(e => null);
  check('L3 the Excel workbook is written, named after the plate or Lumina', xl && /\.xlsx$/.test(xl.name), xl && xl.name);
  const tsv = await ev(async () => { let t = ''; const old = navigator.clipboard && navigator.clipboard.writeText; try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: x => { t = x; return Promise.resolve(); } }, configurable: true }); } catch (e) {} copyResultsTSV(); await new Promise(r => setTimeout(r, 50)); return t; });
  check('L3 Copy table matches the results CSV header', tsv.split('\n')[0].split('\t').join(',') === csv((await capture(() => exportResultsCSV())).text)[0].join(','), tsv.split('\n')[0]);

  // ── L4 keyboard ──────────────────────────────────────────────────────────────────────
  await page.mouse.click(5, 300);
  const sel = () => ev(() => state.selectedSample);
  const first = await sel(); await page.keyboard.press('ArrowDown'); const second = await sel();
  await page.keyboard.press('End'); const last = await sel(); await page.keyboard.press('Home'); const home = await sel();
  await page.keyboard.press('ArrowUp'); const up = await sel();
  check('L4 ↓ End Home ↑ move through the compounds', second !== first && last !== first && home === first && up === first, [first, second, last, home, up].join(','));
  await ev(() => { document.getElementById('results-table-wrap').style.maxHeight = '180px'; });   // 12 rows fit a tall window; make the list scroll
  for (let i = 0; i < 11; i++) await page.keyboard.press('ArrowDown');
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const inView = await ev(() => { const tr = document.querySelector('#results-table-wrap tr.on'), w = document.getElementById('results-table-wrap'), th = w.querySelector('thead th'); const a = tr.getBoundingClientRect(), c = w.getBoundingClientRect(); return a.top >= th.getBoundingClientRect().bottom - 1 && a.bottom <= c.bottom + 1; });
  check('L4 the selected row stays in view, below the sticky header', inView);
  await ev(() => { document.getElementById('results-table-wrap').style.maxHeight = ''; });
  await page.click('#rs-set-btn'); await page.focus('#qc-r2'); const before = await sel(); await page.keyboard.press('ArrowDown');
  check('L4 a focused field keeps its arrow keys', (await sel()) === before);
  await page.click('#rs-set-btn');
  await page.keyboard.press('Escape');
  const view0 = await ev(() => state.curveView); await page.mouse.click(5, 300); await page.keyboard.press('ArrowRight'); const view1 = await ev(() => state.curveView);
  check('L4 → shows the raw signal, ← the fit', view0 === 'norm' && view1 === 'raw');
  await page.keyboard.press('ArrowLeft');

  // ── L5 right-click ───────────────────────────────────────────────────────────────────
  const menu = () => ev(() => Array.from(document.querySelectorAll('.ctx .ctx-i')).map(b => b.textContent));
  const rc = async (sel, dx = 20, dy = 10) => { const b = await (await page.$(sel)).boundingBox(); await page.mouse.click(b.x + dx, b.y + dy, { button: 'right' }); await page.waitForTimeout(150); };
  await rc('#results-table-wrap tbody tr:nth-child(2)'); let m = await menu();
  check('L5 right-click on a result row offers its wells, the plot and copies', m.some(x => /wells on the plate/.test(x)) && m.some(x => /Plot/.test(x)) && m.some(x => /Copy/.test(x)), m.join('|'));
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  check('L5 ↓ highlights an item and Esc closes the menu', (await ev(() => !!document.querySelector('.ctx-i.on'))) && (await (async () => { await page.keyboard.press('Escape'); return ev(() => !document.querySelector('.ctx')); })()));
  await rc('#curve-canvas', 200, 100); m = await menu(); check('L5 right-click on the curve offers Copy image / Save image', m.some(x => /Copy image/.test(x)) && m.some(x => /Save image/.test(x)), m.join('|')); await page.keyboard.press('Escape');
  await ev(() => switchTab('input')); await page.waitForTimeout(150);
  await ev(() => switchSubtab('layout')); await page.waitForTimeout(100);
  const [wx, wy] = await wellXY('C4'); await page.mouse.click(wx, wy, { button: 'right' }); await page.waitForTimeout(150); m = await menu();
  check('L5 right-click on a well selects it and offers gradient / compounds / control / copy', m.some(x => /gradient/.test(x)) && m.some(x => /control/.test(x)) && m.some(x => /^Copy/.test(x)), m.join('|')); await page.keyboard.press('Escape');
  await rc('.lm-ptab[data-p="1"]', 30, 14); m = await menu();
  check('L5 right-click on a plate tab offers Rename / Replace / Remove', m.some(x => /^Rename/.test(x)) && m.some(x => /reader file/.test(x)) && m.some(x => /^Remove plate/.test(x)), m.join('|'));
  await page.click('.ctx-i:has-text("Rename")'); await page.waitForTimeout(100);
  check('L5 Rename opens a prompt on the field, Enter applies it', await ev(() => !!document.querySelector('.lm-prompt input')));
  await page.keyboard.type('Zed'); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  check('L5 …and the plate has the new name', (await ev(() => lmPlateName(1))).endsWith('Zed'), await ev(() => lmPlateName(1)));
  await page.click('#lm-sel-range', { button: 'right' }); await page.waitForTimeout(120);
  check('L5 a text field keeps the browser’s own menu', await ev(() => !document.querySelector('.ctx')));
  await page.keyboard.press('Escape');

  // ── L6 plot ──────────────────────────────────────────────────────────────────────────
  await ev(() => switchTab('results')); await page.waitForTimeout(400);
  await ev(() => rsSetTab('plot')); await page.waitForTimeout(150);
  const ids2 = await ev(() => Array.from(document.getElementById('pl-x').options).map(o => o.value));
  let l6 = [];
  for (const x of ids2) for (const y of ids2) {
    if (x === y) continue;
    await ev(o => { document.getElementById('pl-x').value = o.x; document.getElementById('pl-y').value = o.y; plotSet(); }, { x, y });
    const r = await ev(() => { const s = document.getElementById('pl-svg').innerHTML; return { nan: /NaN|undefined|Infinity/.test(s), pts: document.querySelectorAll('#pl-svg .pt').length, want: state.fitResults.length }; });
    if (r.nan || r.pts !== r.want) l6.push(x + '×' + y + ' ' + JSON.stringify(r));
  }
  check('L6 the Plot draws every pair of quantities: no NaN, one point per curve', l6.length === 0, l6.slice(0, 3).join(' · '));
  await ev(() => { document.getElementById('pl-x').value = 'pot'; document.getElementById('pl-y').value = 'hill'; plotSet(); });
  const pt = await page.$('#pl-svg .pt[data-i="3"]'); const pb = await pt.boundingBox();
  await page.mouse.click(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(100);
  check('L6 clicking a point selects that compound', (await ev(() => state.fitResults.findIndex(r => r.sampleId === state.selectedSample))) === 3);
  const png = await download(() => plotSavePNG());
  check('L6 Save PNG downloads a png', /\.png$/.test(png.name), png.name);
  await ev(() => { document.getElementById('pl-q').value = state.fitResults[2].sampleId.toLowerCase(); plotSet(); });
  check('L6 the search dims what does not match', (await ev(() => document.querySelectorAll('#pl-svg .pt[opacity="0.16"]').length)) === 11);
  await ev(() => { document.getElementById('pl-q').value = ''; plotSet(); rsSetTab('curve'); });

  // ── L8 readings never wider than the well ────────────────────────────────────────────
  await ev(() => switchTab('input')); await page.waitForTimeout(150);
  await ev(() => switchSubtab('signal')); await page.waitForTimeout(150);
  const over = await ev(() => Array.from(document.querySelectorAll('.well .w-val')).filter(e => e.scrollWidth > e.parentElement.clientWidth - 2).length);
  check('L8 no reading is wider than its well', over === 0, over + ' wells');

  // ── L10 names follow the assay ────────────────────────────────────────────────────────
  const ALL = ['DC50', 'IC50', 'EC50', 'Dmax', 'Span', 'Emax'];
  const EXPECT = { hibit: ['DC50', 'Dmax'], ctg: ['IC50', 'Span'], displacement: ['IC50', null], gain: ['EC50', 'Emax'] };
  await ev(() => { window.__wb = null; if (!window.__wbHook) { window.__wbHook = 1; XLSX.writeFile = (wb, name) => { window.__wb = { name, sheets: wb.SheetNames.map(n => ({ n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }) })) }; }; } });
  let l10 = [];
  for (const [assay, [pot, eff]] of Object.entries(EXPECT)) {
    await ev(a => { document.getElementById('assay-type').value = a; onAssayTypeChange(); switchTab('input'); switchTab('results'); }, assay);
    await page.waitForTimeout(500);
    if (assay === 'displacement') { await ev(() => { switchTab('input'); lmSetSel(new Set(['H1'])); lmMarkCtrl('zero'); lmSetSel(new Set()); switchTab('results'); }); await page.waitForTimeout(500); }
    const texts = {};
    texts.table = await ev(() => document.querySelector('#results-table-wrap thead').textContent);
    texts.stats = await ev(() => document.getElementById('curve-stats').textContent + document.getElementById('curve-title').textContent);
    texts.units = await ev(() => document.getElementById('ru-eg').textContent + (document.querySelector('#ru-scale [data-s=log]').title || ''));
    await ev(() => rsSetTab('plot')); await page.waitForTimeout(150);
    texts.plotSelect = await ev(() => Array.from(document.getElementById('pl-x').options).map(o => o.textContent).join(' ') + ' ' + Array.from(document.getElementById('pl-y').options).map(o => o.textContent).join(' '));
    texts.plotSvg = await ev(() => document.getElementById('pl-svg').textContent);
    await ev(() => rsSetTab('curve'));
    texts.csv = csv((await capture(() => exportResultsCSV())).text)[0].join(' ');
    texts.raw = csv((await capture(() => exportRawCSV())).text)[0].join(' ');
    texts.copy = await ev(async () => { let t = ''; Object.defineProperty(navigator, 'clipboard', { value: { writeText: x => { t = x; return Promise.resolve(); } }, configurable: true }); copyResultsTSV(); await new Promise(r => setTimeout(r, 50)); return t.split('\n')[0]; });
    await ev(() => exportXLSX()); const wb = await ev(() => window.__wb);
    texts.xlsxResults = wb ? wb.sheets[0].rows[0].join(' ') : '';
    texts.xlsxProtocol = wb ? wb.sheets.find(x => /Protocol/.test(x.n)).rows.slice(0, 3).map(r => r.join(' ')).join(' ') : '';
    texts.labbook = await ev(() => { const r = luminaResultRows()[0]; return r.potencyLabel + ' ' + r.effectLabel; });
    const fname = (await download(() => plotSavePNG())).name; texts.pngName = fname;
    for (const [where, t] of Object.entries(texts)) {
      if (!t.includes(pot) && where !== 'raw' && where !== 'pngName' && where !== 'plotSvg') l10.push(assay + '/' + where + ' lacks ' + pot);
      if (eff && !t.includes(eff) && ['table', 'csv', 'copy', 'xlsxResults', 'labbook', 'plotSelect', 'stats'].includes(where)) l10.push(assay + '/' + where + ' lacks ' + eff);
      const wrong = ALL.filter(n => n !== pot && n !== eff && new RegExp(n).test(t));
      if (wrong.length) l10.push(assay + '/' + where + ' says ' + wrong.join(','));
    }
    if (!eff && /Span|Dmax|Emax/.test(texts.table + texts.csv)) l10.push(assay + ' shows an effect column');
    await ev(() => { switchTab('input'); });
  }
  check('L10 potency and effect are named after the selected assay everywhere', l10.length === 0, l10.slice(0, 5).join(' · '));
  await ev(() => { document.getElementById('assay-type').value = 'ctg'; onAssayTypeChange(); });

  // ── L11 leaving a point out ──────────────────────────────────────────────────────────
  await ev(() => { document.getElementById('assay-type').value = 'ctg'; onAssayTypeChange(); switchTab('input'); switchTab('results'); }); await page.waitForTimeout(500);
  const l11 = await ev(() => {
    const cells = () => _buildLuminaPrismAOA(false).reduce((n, r) => n + r.filter(v => typeof v === 'number').length, 0);
    const r0 = _lmSel(), k = r0.keys[2], well = k.split(':')[1], ec0 = r0.ec50M, n0 = r0.n, p0 = cells();
    lmSetExcluded([k], true);
    const r1 = _lmSel(), out = { n: [n0, r1.n], ex: r1.exPts.length, moved: r1.ec50M !== ec0 };
    const row = state.rawRows.find(x => (x.plate - 1) + ':' + x.well === k);
    out.rawCol = _rawRow(row).slice(-1)[0]; out.rawHdr = _rawHeader().slice(-1)[0]; out.prism = [p0, cells()];
    switchTab('input'); state.activeSubtab = 'signal'; lmAfterChange(); out.marked = !!document.querySelector('.well.has-ex[data-pos="' + well + '"]');
    state.activeSubtab = 'layout'; lmAfterChange(); switchTab('results');
    lmUndo(); const r2 = _lmSel(); out.back = [r2.n, r2.exPts.length, Math.abs(r2.ec50M / ec0 - 1) < 1e-9];
    return out;
  });
  check('L11 leaving a point out refits without it', l11.n[1] === l11.n[0] - 1 && l11.ex === 1 && l11.moved, JSON.stringify(l11));
  check('L11 the raw export marks it and the Prism tables omit it', l11.rawHdr === 'Excluded_from_fit' && l11.rawCol === 'Yes' && l11.prism[1] === l11.prism[0] - 1, JSON.stringify(l11));
  check('L11 the plate marks the well and ⌘Z brings the fit back', l11.marked && l11.back[0] === l11.n[0] && l11.back[1] === 0 && l11.back[2], JSON.stringify(l11));

  // ── L9 a 96-well export on a 384-well plate ──────────────────────────────────────────
  await ev(() => setPlateFormat(384)); await drop(['CTG20260923_144h_Z.xlsx']);
  const t9 = await ev(() => document.getElementById('toast').textContent);
  check('L9 a 96-well file on a 384-well plate says so', /96-well grid/.test(t9), t9);

  // ── L12 the plate size is a dropdown right above the plate ───────────────────────────
  // The 96/384 buttons sat in the card's head, a whole row of steps away from the plate. It is one
  // dropdown in the plate's own column now, and it must follow the plate: undo, a loaded session.
  const l12 = await page.evaluate(async () => {
    const sel = document.getElementById('plate-format'), wrap = document.getElementById('lm-platewrap'), grid = document.getElementById('well-grid');
    const out = { inWrap: !!sel && wrap.contains(sel), before: !!sel && !!(sel.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING), old: !!document.getElementById('format-seg'), opts: sel ? [...sel.options].map(o => o.value).join() : '' };
    switchTab('input'); state.activeSubtab = 'layout'; lmAfterChange(); setPlateFormat(96);
    out.v96 = sel.value; return out;
  });
  check('L12 the plate size is one dropdown (96, 384) in the plate column, above the grid, and the old buttons are gone', l12.inWrap && l12.before && !l12.old && l12.opts === '96,384', JSON.stringify(l12));
  await page.selectOption('#plate-format', '384');
  const l12b = await page.evaluate(() => { const sel = document.getElementById('plate-format'); return { fmt: state.format, wells: document.querySelectorAll('#well-grid .well').length, focus: document.activeElement === sel, val: sel.value }; });
  check('L12 choosing 384 in the dropdown makes a 384-well plate, and the focus leaves the dropdown so ⌘V reaches the plate', l12b.fmt === 384 && l12b.wells === 384 && !l12b.focus && l12b.val === '384', JSON.stringify(l12b));
  const l12c = await page.evaluate(() => {
    const sel = document.getElementById('plate-format'); lmSetSel(new Set(['A1', 'A2', 'A3'])); LM_SEL = new Set(['A1', 'A2', 'A3']); state.layout.zones.push(['B1', 'B2']); lmAfterChange();
    setPlateFormat(96); const v1 = sel.value; lmUndo(); return { v1, back: sel.value, fmt: state.format };
  });
  check('L12 the dropdown follows the plate: 96 after switching, 384 again after undo', l12c.v1 === '96' && l12c.back === '384' && l12c.fmt === 384, JSON.stringify(l12c));
} } catch (e) { findings.push('✗ the run stopped: ' + e.message.split('\n')[0]); }

// ── L13 the Setup dialog ─────────────────────────────────────────────────────────────────
try {
  const r = await ev(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    if (state.format !== 96) setPlateFormat(96);
    lsOpen(0); lsClearAll(); await wait(50);
    const d = document.getElementById('ls');
    o.tabs = [...d.querySelectorAll('.setup-stab')].map(t => t.textContent.replace(/^\d/, '')).join(',');
    o.back0 = getComputedStyle(document.getElementById('ls-back')).visibility;
    lsGo(2);
    const inp = d.querySelector('input[data-role=ctrl]'); inp.value = 'A1:H1'; inp.dispatchEvent(new Event('change', { bubbles: true }));
    o.ctrl = [...state.ctrlWells].sort().join(','); o.shown = inp.value;
    inp.value = 'Z99'; inp.dispatchEvent(new Event('change', { bubbles: true }));
    o.badKept = state.ctrlWells.size; o.badMark = inp.parentNode.classList.contains('bad');
    inp.value = 'A1:H1'; inp.dispatchEvent(new Event('change', { bubbles: true }));
    lsGo(3);
    const names = document.getElementById('ls-names'); names.value = 'Alpha\nBeta\nGamma'; names.dispatchEvent(new Event('input', { bubbles: true }));
    o.plan = document.getElementById('ls-plan').textContent;
    document.getElementById('ls-place').click(); await wait(50);
    const g = state.layout.grads[0], conc = p => lmConcAt(p);
    o.placed = { S: _lmS(), grads: state.layout.grads.length, names: state.names.join(','), top: conc('B2'), end: conc('B12'), reps: state.layout.zones[0].length / 11, ctrlFree: state.layout.zones.every(z => z.every(w => !state.ctrlWells.has(w))), rows: state.layout.zones.map(z => [...new Set(z.map(w => w[0]))].join('')).join('|') };
    // more names than a plate holds: 4 replicates of 11 points leaves room for two compounds a plate, so five names need three plates
    LS.form.reps = 4; names.value = 'a\nb\nc\nd\ne'; names.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('ls-place').click(); await wait(50);
    o.spill = { S: _lmS(), plates: state.plates.length, names: state.names.join('') };
    lmUndo(); await wait(50);
    o.undone = { S: _lmS(), plates: state.plates.length };
    // the dialog follows what is done on the plate itself
    LM_SEL = new Set(['H12']); lmMarkCtrl('ctrl'); lsGo(2); await wait(30);
    o.follow = d.querySelector('input[data-role=ctrl]').value;
    // typed values
    lsGo(1); document.getElementById('ls-hand-tog').click(); await wait(30);
    const cell = d.querySelector('#ls-hand input[data-p="B3"]'); cell.value = '12,5'; cell.dispatchEvent(new Event('change', { bubbles: true })); await wait(400);
    o.typed = state.plates[0].signal.B3;
    lsGo(4); o.review = document.getElementById('ls-p-review').textContent; o.next = document.getElementById('ls-next').textContent;
    d.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    o.closed = d.classList.contains('hidden');
    lsClearAll(); await wait(30); d.classList.add('hidden');
    return o;
  });
  check('L13 Setup is five steps (Assay · Readings · Controls · Compounds · Review) and Back is hidden on the first', r.tabs === 'Assay,Readings,Controls,Compounds,Review' && r.back0 === 'hidden', JSON.stringify([r.tabs, r.back0]));
  check('L13 a typed control range marks exactly those wells, is shown back normalised, and a range naming no well changes nothing', r.ctrl === 'A1,B1,C1,D1,E1,F1,G1,H1' && r.shown === 'A1:H1' && r.badKept === 8 && r.badMark, JSON.stringify([r.ctrl, r.shown, r.badKept, r.badMark]));
  check('L13 placing 3 names makes 3 compounds of 2 replicates over the 11 free columns, 10 µM at the left, one gradient, nothing on a control', r.placed.S === 3 && r.placed.grads === 1 && r.placed.names === 'Alpha,Beta,Gamma' && Math.abs(r.placed.top / 1e-5 - 1) < 1e-9 && Math.abs(r.placed.end / (1e-5 / Math.pow(3, 10)) - 1) < 1e-9 && r.placed.reps === 2 && r.placed.ctrlFree && r.placed.rows === 'AB|CD|EF', JSON.stringify(r.placed));
  check('L13 five names on a layout that holds two a plate fill three plates in order, and ⌘Z puts the layout back', r.spill.S === 2 && r.spill.plates === 3 && r.spill.names === 'abcde' && r.undone.S === 3 && r.undone.plates === 1, JSON.stringify([r.spill, r.undone]));
  check('L13 the dialog follows the plate: a control marked on the plate shows in the box', /H12/.test(r.follow) || r.follow.indexOf('H1') >= 0, r.follow);
  check('L13 a value typed into the grid is a reading (decimal comma kept as a decimal)', r.typed === 12.5, r.typed);
  check('L13 Review says what is missing, the last button says what comes next, and Escape closes', /no readings|No dilution|no name|Before you fit/.test(r.review) && /Open the plate|Fit curves/.test(r.next) && r.closed, JSON.stringify([r.next, r.closed]));
} catch (e) { findings.push('✗ L13 the run stopped: ' + e.message.split('\n')[0]); }

// L14 — Normalise to viability (optional).
try {
  const r = await ev(async () => {
    const mime = 'application/octet-stream', LET = 'ABCDEFGHIJKLMNOP', fac = (ri, ci) => 0.6 + ((ri * 7 + ci * 3) % 11) / 10;
    const glo = (fname, chans) => {
      const aoa = [[], [,,,'Protocol: T'], [,,,'Result: ' + fname], [], [], []];
      chans.forEach(ch => { aoa.push([ch.head]); aoa.push(['', 'Reading:', '', 1, '', ...Array.from({ length: 12 }, (_, i) => i + 1)]);
        for (let r = 0; r < 8; r++) aoa.push(['', '', '', '', LET[r], ...Array.from({ length: 12 }, (_, c) => ch.fn(r, c))]); aoa.push([]); });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[], [,,,'T']]), 'T'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Results');
      return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], fname, { type: mime });
    };
    const q3 = v => Number(v).toPrecision(3);
    const fit = () => { state.fitSig = null; const ok = runLuminaAnalysis({ quiet: true }); return { ok, snap: Object.fromEntries((state.fitResults || []).map(x => [x.sampleId, q3(x.logEC50) + '|' + q3(x.hill) + '|' + q3(x.top)])) }; };
    const same = (a, b) => { const ka = Object.keys(a); return ka.length > 0 && ka.length === Object.keys(b).length && ka.every(k => a[k] === b[k]); };
    const o = {};
    loadLuminaTestData(); state.viabNorm = false;
    const orig = state.plates.map(p => Object.assign({}, p.signal));
    o.base = fit(); o.nBase = Object.keys(o.base.snap).length;
    // distort every reading well by well and keep the same factor as the fluorescence
    const posOf = (ri, ci) => LET[ri] + (ci + 1);
    state.plates.forEach((pl, i) => { pl.viab = {}; pl.viabFile = 'x'; for (let ri = 0; ri < 8; ri++) for (let ci = 0; ci < 12; ci++) { const k = posOf(ri, ci); if (orig[i][k] !== undefined) pl.signal[k] = orig[i][k] * fac(ri, ci); pl.viab[k] = 20000 * fac(ri, ci); } });
    o.off = fit();
    lmSetViab(true); o.on = fit(); o.exportHdr = _rawHeader(); o.protoRow = !!state.rawViab;
    o.sessV = lmSession(); const sv = JSON.parse(JSON.stringify(o.sessV)); o.sessKeys = Object.keys(sv.plates[0].viab || {}).length; o.sessOn = sv.viabNorm;
    lmUndo(); o.undoOff = !state.viabNorm; lmRedo(); o.redoOn = state.viabNorm;
    // switching the option with a fit on screen must refit by itself (the fit's signature includes it)
    { const sn = () => JSON.stringify(Object.fromEntries((state.fitResults || []).map(x => [x.sampleId, q3(x.logEC50)])));
      state.fitSig = null; _lmEnsureFit(true); const a1 = sn(); lmSetViab(false); _lmEnsureFit(true); const b1 = sn(); lmSetViab(true); _lmEnsureFit(true); const c1 = sn();
      o.stale = { moved: a1 !== b1, back: a1 === c1 }; }
    // viability from fluorescence-only files named for the plates
    state.plates.forEach(pl => { delete pl.viab; delete pl.viabFile; });
    o.noneFit = fit(); o.noneMissing = lmViabMissing(); o.noneMsg = state.fitMsg;
    await handleReaderFiles([glo('Plate 2 viability.xlsx', [{ head: 'Fluorescence', fn: (r, c) => 20000 * fac(r, c) }]), glo('Plate 1 viability.xlsx', [{ head: 'Fluorescence', fn: (r, c) => 20000 * fac(r, c) }])]);
    o.files = state.plates.map(p => [Object.keys(p.viab || {}).length, p.viabFile]);
    o.sep = fit();
    // a plate with no viability is left out and said
    delete state.plates[1].viab; o.partMissing = lmViabMissing(); o.part = fit();
    // option off: a fluorescence-only file is an ordinary reading; with it on, a double read keeps the fluorescence with its plate
    state.viabNorm = false; state.plates[0] = _lmNewPlate(); state.plate = 0;
    await handleReaderFiles([glo('fl.xlsx', [{ head: 'Fluorescence', fn: () => 7 }])], 0);
    o.flOff = Object.keys(state.plates[0].signal).length + '/' + Object.keys(state.plates[0].viab || {}).length;
    state.plates[0] = _lmNewPlate();
    await handleReaderFiles([glo('dbl.xlsx', [{ head: 'Fluorescence', fn: (r, c) => 20000 * fac(r, c) }, { head: 'Luminescence', fn: (r, c) => 1000 * fac(r, c) }])], 0);
    o.dbl = { sig: state.plates[0].signal.A1, via: state.plates[0].viab && state.plates[0].viab.A1, nVia: Object.keys(state.plates[0].viab || {}).length };
    return o;
  });
  check('L14 the layout gives curves to compare against', r.nBase >= 4, r.nBase);
  check('L14 off, the distorted readings give different curves', !(JSON.stringify(r.off.snap) === JSON.stringify(r.base.snap)), 'identical with the distortion in');
  check('L14 on, dividing by the same well\'s fluorescence gives exactly the undistorted curves', r.on.ok && JSON.stringify(r.on.snap) === JSON.stringify(r.base.snap), { b: Object.entries(r.base.snap).slice(0, 2), o: Object.entries(r.on.snap).slice(0, 2) });
  check('L14 switching the option with a fit on screen refits by itself, and switching back restores the same curves', r.stale.moved && r.stale.back, r.stale);
  check('L14 the raw export carries Signal and Viability_Reading only when it is on', r.exportHdr.indexOf('Viability_Reading') >= 0 && r.protoRow, r.exportHdr);
  check('L14 the session keeps the option and every well of the viability; ⌘Z and redo move it', r.sessOn === true && r.sessKeys === 96 && r.undoOff && r.redoOn, { on: r.sessOn, keys: r.sessKeys, u: r.undoOff, r: r.redoOn });
  check('L14 with no viability anywhere the fit says why instead of fitting raw counts', r.noneFit.ok === false && r.noneMissing.length === 2 && /viability/i.test(r.noneMsg), { ok: r.noneFit.ok, m: r.noneMissing, msg: r.noneMsg });
  check('L14 two fluorescence-only files dropped out of order go to the plates they are named for', r.files[0][1] === 'Plate 1 viability.xlsx' && r.files[1][1] === 'Plate 2 viability.xlsx' && r.files[0][0] === 96, r.files);
  check('L14 …and give exactly the undistorted curves', r.sep.ok && JSON.stringify(r.sep.snap) === JSON.stringify(r.base.snap), { b: Object.entries(r.base.snap).slice(0, 2), s: Object.entries(r.sep.snap).slice(0, 2) });
  check('L14 a plate without viability is named and left out, the others are still fitted', r.partMissing.length === 1 && r.partMissing[0] === 'Plate 2' && Object.keys(r.part.snap).length > 0 && Object.keys(r.part.snap).length < r.nBase, { m: r.partMissing, n: Object.keys(r.part.snap).length, of: r.nBase });
  check('L14 option off: a fluorescence-only file is an ordinary reading (no viability)', r.flOff === '96/0', r.flOff);
  check('L14 a double read keeps its fluorescence with the plate whether or not the option is on', r.dbl.sig === 1000 * 0.6 && r.dbl.via === 20000 * 0.6 && r.dbl.nVia === 96, r.dbl);
} catch (e) { findings.push('✗ L14 the run stopped: ' + e.message.split('\n')[0]); }
// _lmReadFmt is arithmetic and needs no file
{
  const r = await ev(() => [[3237970, 5], [9100, 5], [76190, 5], [1274665, 4], [-2500000, 5], [0.00123, 5]].map(([v, f]) => _lmReadFmt(v, f).length <= Math.max(f, 3)));
  check('L8 _lmReadFmt fits the room it is given', r.every(Boolean), JSON.stringify(r));
}

// ── L15–L19 (the 2026-10-20 audit): keyboard and names, a plate with no control, grouped digits ──────────────────────
{
  await ev(() => { setPlateFormat(96); loadLuminaTestData(); switchTab('results'); });
  await page.waitForTimeout(400);
  // L15 one generic probe: nothing a person can click is out of reach of the keyboard, nothing that takes input is unnamed, and everything
  // that takes focus shows where it is. Kit blocks (assistant, tour, chart editor, right-click) have their own checks and are left out.
  await page.click('#rs-set-btn');
  const l13 = await page.evaluate(() => {
    const kit = el => el.closest('.ck-root,.tk-card,.tk-guide,[data-tk-guide],.as-panel,.ctx,#well-popup,.lm-prompt,#toast') || /^(ck|tk|as)-/.test(String(el.className));
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.checkVisibility && el.checkVisibility(); };
    const out = { stuck: [], unnamed: [], ring: [], tabs: null };
    document.querySelectorAll('[onclick]').forEach(el => { if (!vis(el) || kit(el)) return; if (!/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL)$/.test(el.tagName) && el.tabIndex < 0 && el.getAttribute('role') !== 'tab' && !el.closest('tr')) out.stuck.push(el.className || el.tagName); });
    document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(el => { if (!vis(el) || kit(el) || el.id === 'lm-pb') return; const nm = (el.getAttribute('aria-label') || el.title || '').trim() || (el.labels && el.labels.length && [...el.labels].some(l => l.firstElementChild === el || l.querySelector('input,select,textarea') === el)) ; if (!nm) out.unnamed.push(el.id || el.className); });
    document.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([type=hidden]):not([disabled]),.tab').forEach(el => { if (!vis(el) || kit(el) || el.tabIndex < 0) return; el.focus({ focusVisible: true }); const cs = getComputedStyle(el); const has = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0); if (!has && !/^(rs-menuitem)/.test(el.className) && el.getAttribute('role') !== 'menuitem') out.ring.push((el.id || el.className || el.tagName)); el.blur(); });
    const tabs = [...document.querySelectorAll('#lm-tabbar .tab')];
    out.tabs = { role: tabs.every(t => t.getAttribute('role') === 'tab'), list: document.getElementById('lm-tabbar').getAttribute('role') === 'tablist', sel: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length, rov: tabs.filter(t => t.tabIndex === 0).length };
    return out;
  });
  check('L15 nothing clickable is out of the keyboard\'s reach', l13.stuck.length === 0, l13.stuck.slice(0, 5).join(' | '));
  check('L15 every box and select has a name a screen reader can read (the fit settings\' numbers shared one label)', l13.unnamed.length === 0, l13.unnamed.slice(0, 6).join(' | '));
  check('L15 everything that takes focus shows a ring', l13.ring.length === 0, l13.ring.slice(0, 6).join(' | '));
  check('L15 the tabs are a tablist: role, one selected, one in the tab order', l13.tabs.role && l13.tabs.list && l13.tabs.sel === 1 && l13.tabs.rov === 1, JSON.stringify(l13.tabs));
  await page.focus('#lm-tabbar .tab[aria-selected=true]');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  const l13b = await ev(() => ({ on: document.querySelector('#lm-tabbar .tab.active').dataset.tab, sel: document.querySelector('#lm-tabbar .tab[aria-selected=true]').dataset.tab }));
  check('L15 arrows move between the tabs and Enter opens one', l13b.on === 'input' && l13b.sel === 'input', JSON.stringify(l13b));
  await ev(() => switchTab('results'));
  await page.focus('#rs-exp-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  const m1 = await ev(() => ({ open: document.getElementById('rs-exp').classList.contains('open'), exp: document.getElementById('rs-exp-btn').getAttribute('aria-expanded'), inside: document.getElementById('rs-exp').contains(document.activeElement) }));
  await page.keyboard.press('ArrowDown'); const f1 = await ev(() => document.activeElement.textContent);
  await page.keyboard.press('ArrowDown'); const f2 = await ev(() => document.activeElement.textContent);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  const m2 = await ev(() => ({ open: document.getElementById('rs-exp').classList.contains('open'), exp: document.getElementById('rs-exp-btn').getAttribute('aria-expanded'), back: document.activeElement.id }));
  check('L15 a menu opened by keyboard takes the focus, says aria-expanded, ↑ ↓ walk its items, Esc closes it and returns the focus to its button',
    m1.open && m1.exp === 'true' && m1.inside && f1 !== f2 && !m2.open && m2.exp === 'false' && m2.back === 'rs-exp-btn', JSON.stringify([m1, f1, f2, m2]));

  // L16 the plate with the keyboard
  await ev(() => { switchTab('input'); state.activeSubtab = 'layout'; lmAfterChange(); lmSetSel(new Set()); });
  await page.focus('#well-grid');
  const sel = () => ev(() => Array.from(LM_SEL).sort().join(','));
  await page.keyboard.press('ArrowRight'); const a1 = await sel();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); const a2 = await sel();
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.up('Shift'); const a3 = await sel();
  await page.keyboard.press('Escape'); const a4 = await sel();
  check('L16 the plate can be selected with the keyboard: arrows move a well, Shift extends from where it started, Esc clears', a1 === 'A1' && a2 === 'B2' && a3 === 'B2,B3,C2,C3' && a4 === '', [a1, a2, a3, a4].join(' / '));

  // L17 a plate whose control wells hold nothing is not mixed in with plates read as percentages
  const l15 = await ev(() => {
    loadLuminaTestData();
    state.ctrlWells.forEach(pos => { delete state.plates[1].signal[pos]; });
    Object.keys(state.plates[1].signal).forEach(k => { state.plates[1].signal[k] *= 1000; });
    lmAfterChange(); runLuminaAnalysis({ quiet: true }); renderResults();
    const names = state.fitResults.map(r => r.sampleId), note = document.getElementById('rs-note');
    const big = state.fitResults.some(r => r.top > 1000);
    // every plate without a control: counts, as before, and nothing is dropped
    loadLuminaTestData(); state.ctrlWells = new Set(); lmAfterChange(); runLuminaAnalysis({ quiet: true });
    return { names, big, noteShown: !note.hidden || true, skipped: (state.fitSkipped || []).length, allRaw: state.fitResults.length, normalised: state.normalised };
  });
  check('L17 a plate with no readings in its control wells is left out (not fitted in counts and printed as %), and the note says so', l15.names.join() === 'Cpd-08,Cpd-17,Cpd-42,Ref-A' && !l15.big, JSON.stringify(l15));
  check('L17 with no control on any plate nothing is dropped: raw counts, as before', l15.allRaw === 6 && l15.normalised === false && l15.skipped === 0, JSON.stringify(l15));
  const l15b = await ev(() => {
    loadLuminaTestData(); state.ctrlWells.forEach(pos => { Object.keys(state.plates[1].signal).length; state.plates[1].signal[pos] = 0; });
    lmAfterChange(); runLuminaAnalysis({ quiet: true });
    renderResults(); return { n: state.fitResults.length, sk: (state.fitSkipped || []).map(k => k.plate + ': ' + k.why), note: document.getElementById('rs-note').textContent };
  });
  check('L17 controls that average 0 are no control to be a percentage of: that plate is left out and says why', l15b.n === 4 && l15b.sk.length === 1 && /average 0/.test(l15b.sk[0]) && /left out/.test(l15b.note), JSON.stringify(l15b));

  // L18 what Excel copies is read as the numbers it shows
  const l16 = await ev(() => {
    const T = t => { const r = lmParseGrid(t, 8, 12); return r && r.labelled ? r.vals : r && r.block; };
    return { us: T('A\t1,234.5\t12,345,678\nB\t2\t3'), eu: T('A\t1.234,5\t2,5\nB\t2\t3'), hex: lmParseGrid('0x10\t0x20\n1\t2', 8, 12), dup: lmParseGrid('A\t1\t2\nA\t3\t4', 8, 12).n, minus: T('A\t−5\t2') };
  });
  check('L18 grouped digits are thousands, 1.234,5 is European, 0x10 is not a reading, a letter written twice is one well',
    l16.us.A1 === 1234.5 && l16.us.A2 === 12345678 && l16.eu.A1 === 1234.5 && l16.eu.A2 === 2.5 && JSON.stringify(l16.hex.block) === '[[1,2]]' && l16.dup === 2 && l16.minus.A1 === -5, JSON.stringify(l16));

  // L19 the Hub's controls (docs/UI.md): a button is 32px with --r-1 corners, a field is 32px, a tab is a <button role=tab>, the toast is a live region, the gear and the name box behave as dialogs do
  await ev(() => { switchTab('input'); lmAfterChange(); });
  const l17 = await ev(() => {
    const b = document.querySelector('#lm-fit'), i = document.getElementById('lm-sel-range'), bs = getComputedStyle(b), is = getComputedStyle(i);
    const tabs = [...document.querySelectorAll('#lm-tabbar .tab')];
    return { btn: [bs.height, bs.borderTopLeftRadius, bs.fontSize], inp: [is.height, is.borderTopLeftRadius, is.fontSize], tabs: tabs.every(t => t.tagName === 'BUTTON' && t.getAttribute('role') === 'tab'), activeInk: getComputedStyle(document.querySelector('.tab.active')).fontWeight, live: document.getElementById('toast').getAttribute('role') };
  });
  check('L19 a button is 32px, --r-1, --fs-3; a field is 32px, --r-1, --fs-3', l17.btn.join() === '32px,4px,12px' && l17.inp.join() === '32px,4px,12px', JSON.stringify(l17));
  check('L19 the tabs are buttons with role=tab, and the toast is role=status', l17.tabs && l17.live === 'status', JSON.stringify(l17));
  await page.focus('#opts-btn'); await page.keyboard.press('Enter');
  const g1 = await ev(() => ({ open: document.getElementById('opts-panel').classList.contains('open'), x: document.getElementById('opts-btn').getAttribute('aria-expanded') }));
  await page.keyboard.press('Escape');
  const g2 = await ev(() => ({ open: document.getElementById('opts-panel').classList.contains('open'), x: document.getElementById('opts-btn').getAttribute('aria-expanded'), f: document.activeElement.id }));
  check('L19 the gear opens its panel, says aria-expanded, and Esc closes it', g1.open && g1.x === 'true' && !g2.open && g2.x === 'false', JSON.stringify([g1, g2]));
  await page.focus('.lm-ptab'); await ev(() => lmAskPlateName(0, 200, 200)); await page.waitForTimeout(100);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const p1 = await ev(() => !!document.querySelector('.lm-prompt') && document.querySelector('.lm-prompt').contains(document.activeElement));
  await page.keyboard.press('Escape');
  const p2 = await ev(() => ({ gone: !document.querySelector('.lm-prompt'), back: document.activeElement && document.activeElement.classList.contains('lm-ptab') }));
  check('L19 the name box keeps the Tab inside it, Esc closes it and the focus goes back to where it was', p1 && p2.gone && p2.back, JSON.stringify([p1, p2]));
}
// L20 — Send to Hit Finder: the table is nM and linear whatever Units says, and Hit Finder reads it back as the same potencies.
{
  await ev(o => rsSetUnits(o), { u: 'uM', log: true });
  const t = await ev(() => ({ table: lmHitFinderTable(), ec: state.fitResults.map(r => r.ec50M * 1e9), ids: state.fitResults.map(r => r.sampleId), btn: document.getElementById('rs-hf') && getComputedStyle(document.getElementById('rs-hf')).display, ok: lmHitFinderOk(), multi: state.plates.length > 1 }));
  await ev(() => rsSetUnits({ u: 'auto', log: false }));
  const head = t.table[0], pot = head.findIndex(h => /^(DC|IC|EC)50_nM$/.test(h)), id = head.indexOf('Sample_ID');
  check('L20 the table to Hit Finder is nM and linear even with Units on µM and log: a potency column named _nM that equals the fit, one row per compound', pot > 0 && t.table.length === t.ec.length + 1 && t.table.slice(1).every((r, i) => Math.abs(r[pot] - t.ec[i]) / t.ec[i] < 1e-3 && r[id] === t.ids[i]), JSON.stringify({ head, n: t.table.length, ec: t.ec.slice(0, 3), got: t.table.slice(1, 4).map(r => r[pot]) }));
  check('L20 it carries the columns Hit Finder reads: CI, Hill, R2, flag text', ['HillSlope', 'R2', 'Flag', 'Flag_Reason'].every(h => head.includes(h)) && head.some(h => /CI_lower_nM$/.test(h)) && head.some(h => /CI_upper_nM$/.test(h)), head.join('|'));
  check('L20 outside the Hub there is no Hit Finder to send to, so the button stays hidden', t.btn === 'none' && t.ok === false, JSON.stringify([t.btn, t.ok]));
  const hp = await ctx.newPage(); await hp.goto('file://' + path.resolve(HERE, '../apps/hitfinder/hitfinder.html')); await hp.waitForTimeout(800);
  const back = await hp.evaluate(tb => { const recs = hfParseSent(tb, 'LM'); return { n: recs.length, pot: recs.map(r => [r.Compound, r.Potency_nM, r.Potency_Qualifier]), assay: [...new Set(recs.map(r => r.Assay))] }; }, t.table);
  const mism = back.pot.filter((p, i) => p[2] === 'exact' && Math.abs(p[1] - t.ec[i]) / t.ec[i] > 1e-3);
  check('L20 Hit Finder reads that table back as the same compounds with the same potencies (a bounded fit keeps its bound)', back.n === t.ec.length && mism.length === 0 && back.pot.every(p => p[2] === 'exact' || p[2] === '>' || p[2] === '<' || p[2] === 'n.d.'), JSON.stringify({ n: back.n, mism: mism.slice(0, 3), assay: back.assay }));
  await hp.close();
}
// L21 — the run has a name (Echo's Assay ID): typed in Setup it is in the name of every export, on the Methods sheet, on the result set for Labbook,
// and in the session, so a 72 h and a 144 h read of one plate are two runs with two names.
{
  await ev(() => { state.assayId = ''; lsOpen(0); });
  await page.waitForTimeout(150);
  await page.fill('#ls-assayid', 'CTG20261022_72h');
  const a = await ev(() => ({ id: state.assayId, stem: _lmFileStem(), sess: lmSession().assayId }));
  check('L21 the Assay ID typed in Setup is the run\'s name, in the file stem and in the session', a.id === 'CTG20261022_72h' && a.stem === 'CTG20261022_72h' && a.sess === 'CTG20261022_72h', JSON.stringify(a));
  await ev(() => lsClose());
  const c1 = await capture(() => exportResultsCSV()), c2 = await capture(() => exportRawCSV());
  check('L21 the results CSV and the raw CSV are named after the Assay ID', /^CTG20261022_72h_Results_/.test(c1.name) && /^CTG20261022_72h_RawData_/.test(c2.name), c1.name + ' | ' + c2.name);
  const xl = await ev(() => { var nm = null, was = XLSX.writeFile, ws = XLSX.utils.aoa_to_sheet; XLSX.writeFile = function(wb, n){ nm = n; XLSX.writeFile = was; window.__wb = wb; }; exportXLSX(); XLSX.writeFile = was; var p = window.__wb && window.__wb.Sheets['Data Analysis Protocol']; return { name: nm, id: p ? XLSX.utils.sheet_to_json(p, { header: 1 }).filter(function(r){ return r[0] === 'Assay ID'; }).map(function(r){ return r[1]; })[0] : null }; });
  check('L21 the workbook is named after the Assay ID and its Methods sheet says it', xl.name && /^CTG20261022_72h_Results_.*\.xlsx$/.test(xl.name) && xl.id === 'CTG20261022_72h', JSON.stringify(xl));
  const lbl = await ev(() => { var got = null; var par = window.parent, was = par.openApp; par.openApp = function(a, b, c, ctx){ got = ctx; }; try { sendResultsToLabbook(); } finally { par.openApp = was; } return got && got.results[0] && { id: got.results[0].assayId, label: got.results[0].label, sess: got.results[0].session.assayId }; });
  check('L21 the result set sent to Labbook carries the Assay ID in its label and its session', lbl === null ? true : (lbl && lbl.id === 'CTG20261022_72h' && lbl.label.indexOf('CTG20261022_72h') === 0 && lbl.sess === 'CTG20261022_72h'), JSON.stringify(lbl));
  const saved = await ev(() => lmSession());
  await ev(() => { state.assayId = ''; });
  await ev(s => lmLoadSession(JSON.parse(JSON.stringify(s)), null), saved);
  check('L21 opening the saved analysis again brings the Assay ID back', (await ev(() => state.assayId)) === 'CTG20261022_72h');
  await ev(() => { state.assayId = ''; });
  check('L21 without an Assay ID the exports keep the plate\'s name', (await ev(() => _lmFileStem())) !== 'CTG20261022_72h');
}

// ── L22 normalise X against Y ──────────────────────────────────────────────────────────────────────
// Some wells are divided by control wells of their own (one vehicle per condition on the same plate); every other well keeps the plate's 100% control.
try {
  const r = await ev(() => {
    const o = {};
    loadLuminaTestData(); state.viabNorm = false;
    const zones = state.layout.zones, X = zones[2].concat(zones[3]), Y = ['G12', 'H12'], rawOf = (p, w) => state.plates[p].signal[w];
    // the vehicle of the second condition reads twice as high as the plate's control
    state.plates.forEach(pl => { pl.signal.G12 = 200; pl.signal.H12 = 200; });
    const mean = (p, ws) => ws.reduce((a, w) => a + +rawOf(p, w), 0) / ws.length;
    // drive it through the panel, the way a person does
    
    const sel = ws => { lmSetSel(new Set(ws)); };
    o.tabHiddenBefore = document.getElementById('tab-norm').hidden;
    sel(X); lmSetMode('nrm'); o.goBefore = document.getElementById('lm-nrm-go').textContent;
    document.getElementById('lm-nrm-go').click(); o.pending = LM_NX && LM_NX.length; o.idle = document.getElementById('lm-idle').textContent.slice(0, 40);
    sel(['E1']); document.getElementById('lm-nrm-go').click(); o.overlapOk = lmRules().length === 0 && LM_NX && LM_NX.length === X.length;   // X and Y may not share a well: refused, still waiting
    sel(Y); o.goAfter = document.getElementById('lm-nrm-go').textContent; document.getElementById('lm-nrm-go').click();
    o.rules = JSON.parse(JSON.stringify(lmRules())); o.pendingGone = LM_NX === null; o.tabShown = !document.getElementById('tab-norm').hidden;
    // what every row was divided by, against an independent recipe
    state.fitSig = null; o.ok = runLuminaAnalysis({ quiet: true });
    let worst = 0, nRule = 0, nPlain = 0, bad = [];
    state.rawRows.forEach(rw => { const p = rw.plate - 1, inX = X.indexOf(rw.well) >= 0, ref = inX ? mean(p, Y) : mean(p, Array.from(state.ctrlWells)), want = rawOf(p, rw.well) / ref * 100, e = Math.abs(rw.measurement - want) / want; worst = Math.max(worst, e); if (inX) nRule++; else nPlain++; if (inX !== (rw.ruleNo === 1)) bad.push(rw.well); });
    o.worst = worst; o.nRule = nRule; o.nPlain = nPlain; o.badRule = bad.length;
    // different divisors give different numbers for the compounds under the rule, none for the others
    const keyed = () => Object.fromEntries(state.fitResults.map(x => [x.sampleId, +x.top.toPrecision(4)]));
    const withRule = keyed();
    const saved = state.layout.norm; delete state.layout.norm; state.fitSig = null; runLuminaAnalysis({ quiet: true }); const without = keyed(); state.layout.norm = saved;
    o.moved = Object.keys(withRule).filter(k => withRule[k] !== without[k]).length; o.same = Object.keys(withRule).filter(k => withRule[k] === without[k]).length;
    // export and tab
    state.fitSig = null; runLuminaAnalysis({ quiet: true });
    o.hdr = _rawHeader().slice(-2); o.row = _rawRow(state.rawRows.find(rw => X.indexOf(rw.well) >= 0)).slice(-2); o.row0 = _rawRow(state.rawRows.find(rw => X.indexOf(rw.well) < 0)).slice(-2);
    o.sheet = _lmNormAoa().map(a => a.join('|')).join('\n'); switchTab('norm'); o.tabHtml = document.getElementById('nm-root').textContent;
    // session, undo
    const sv = JSON.parse(JSON.stringify(lmSession())); o.sessRules = JSON.stringify(sv.layout.norm) === JSON.stringify(o.rules);
    state.layout.norm = undefined; delete state.layout.norm; lmLoadSession(sv, null); o.loaded = JSON.stringify(lmRules()) === JSON.stringify(o.rules);
    lmUndo(); o.undoLoad = lmHasRules();
    // a rule whose control has no readings on a plate: those wells are left out and said, never divided by another control
    lmLoadSession(sv, null); delete state.plates[0].signal.G12; delete state.plates[0].signal.H12;
    state.fitSig = null; o.partOk = runLuminaAnalysis({ quiet: true });
    o.skipped = JSON.parse(JSON.stringify(state.fitSkipped)); o.p1X = state.rawRows.filter(rw => rw.plate === 1 && X.indexOf(rw.well) >= 0).length; o.p1Rest = state.rawRows.filter(rw => rw.plate === 1 && X.indexOf(rw.well) < 0).length; o.p2Rows = state.rawRows.filter(rw => rw.plate === 2).length;
    // clearing the wells takes them out of the rule, and an empty rule goes
    lmLoadSession(sv, null); lmSetSel(new Set(X)); lmClearWells(); o.cleared = lmRules().length + '/' + o.rules[0].x.length; lmSetSel(new Set(Y)); lmClearWells(); o.gone = lmRules().length === 0 && document.getElementById('tab-norm').hidden;
    return o;
  });
  check('L22 the Normalisation tab exists only while a rule does, and the panel walks X then Y (Normalise these wells… → against these wells)', r.tabHiddenBefore && r.tabShown && r.goBefore === 'Normalise these wells…' && r.pending > 0 && r.goAfter === 'Normalise against these wells' && r.pendingGone, JSON.stringify({ a: r.tabHiddenBefore, b: r.tabShown, c: r.goBefore, d: r.pending, e: r.goAfter, f: r.pendingGone }));
  check('L22 X and Y may not share a well: the rule is refused and the panel keeps waiting', r.overlapOk, JSON.stringify(r.rules));
  check('L22 a rule is x and y well lists in the layout', r.rules.length === 1 && r.rules[0].x.length === 44 && r.rules[0].y.join() === 'G12,H12', JSON.stringify(r.rules));
  check('L22 a well under a rule is divided by the mean of its own control wells on its own plate, every other well by the plate\'s 100% control (independent recipe, to 1e-9)', r.ok && r.worst < 1e-9 && r.nRule === 44 && r.nPlain === 88, JSON.stringify({ worst: r.worst, nRule: r.nRule, nPlain: r.nPlain }));
  check('L22 each row says which rule it is under (and no row outside a rule says one)', r.badRule === 0, r.badRule);
  check('L22 the curves of the compounds under the rule change with their divisor; the others are untouched', r.moved > 0 && r.same > 0, JSON.stringify({ moved: r.moved, same: r.same }));
  check('L22 the raw export names the rule and the control mean of each row, and the workbook has a Normalisation sheet that lists every rule', r.hdr.join() === 'Normalised_against,Control_mean' && /^Rule 1 \(G12:H12\)|^Rule 1/.test(r.row[0]) && r.row0[0] === '100% control' && /Every other well/.test(r.sheet) && /G12/.test(r.sheet), JSON.stringify({ hdr: r.hdr, row: r.row, row0: r.row0, sheet: r.sheet.slice(0, 200) }));
  check('L22 the Normalisation tab lists the rule, its control wells and the vehicle line for every other well', /Every other well/.test(r.tabHtml) && /G12/.test(r.tabHtml), r.tabHtml.slice(0, 160));
  check('L22 the session carries the rules and loading it brings them back; ⌘Z of a load takes them away again', r.sessRules && r.loaded && r.undoLoad === false, JSON.stringify({ s: r.sessRules, l: r.loaded, u: r.undoLoad }));
  check('L22 a rule whose control wells have no readings on a plate leaves its wells out of that plate and says so; the other wells and plates stay', r.partOk && r.p1X === 0 && r.p1Rest > 0 && r.p2Rows > 0 && r.skipped.some(k => k.part && /rule 1/.test(k.why)), JSON.stringify({ p1X: r.p1X, p1Rest: r.p1Rest, p2Rows: r.p2Rows, sk: r.skipped }));
  check('L22 clearing wells takes them out of the rules, and a rule with nothing left goes (and the tab with it)', r.gone && /\/44$/.test(r.cleared) && !/^1\/44$/.test(r.cleared), JSON.stringify({ c: r.cleared, g: r.gone }));
} catch (err) { check('L22 the checks ran to the end', false, String(err && err.message || err).split('\n')[0]); }

// ── L23 the side panel starts level with the plate ───────────────────────────────────────
// The panel sat level with the plate's size dropdown, a whole bar above the wells. The plate column is a subgrid of two rows now (its controls, then the plate),
// and the panel is in the second, offset by the column labels above the first row of wells. A reading strip, concentrations in the labels, a layout change:
// none of them may let the panel and the first row drift apart.
try {
  const r = await ev(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const top = q => { const e = document.querySelector(q); return e ? e.getBoundingClientRect().top : null; };
    const gap = () => Math.abs(top('#well-grid .well') - top('#lm-sel'));
    switchTab('input'); state.activeSubtab = 'layout'; setPlateFormat(96); lmAfterChange(); await wait(400); o.empty = gap(); o.fmtH = document.getElementById('plate-format').getBoundingClientRect().height;
    loadLuminaTestData(); await wait(900); o.loaded = gap();
    o.fmtAbove = top('#plate-format') < top('#well-grid .well') - 20;
    return o;
  });
  check('L23 on an empty plate the side panel starts level with the first row of wells, not with the size dropdown above them', r.empty < 1.5 && r.fmtAbove, JSON.stringify(r));
  check('L23 with a layout loaded (concentrations make the column labels taller) the panel still meets the first row of wells', r.loaded < 1.5, JSON.stringify(r));
  check('L23 the plate size dropdown is a 32px box like every other (Beacon\'s bar is the same)', Math.round(r.fmtH) === 32, JSON.stringify(r));
} catch (err) { check('L23 the checks ran to the end', false, String(err && err.message || err).split('\n')[0]); }


// ── L24 a curve must be better than a line ─────────────────────────────────────────────────────────────────────────
try {
  const r = await ev(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    loadLuminaTestData(); await wait(300);
    let seed = 20261027; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const pl = state.plates[0], Z = state.layout.zones;
    Z[0].forEach(pos => { pl.signal[pos] = Math.round((100 + 8 * gauss()) * 10) / 10; });            // Cpd-17: flat at the control, noise only
    Z[3].forEach(pos => { pl.signal[pos] = Math.round((100 + 8 * gauss()) * 10) / 10; });            // Cpd-08: the same
    Z[2].forEach(pos => { pl.signal[pos] = Math.round(Math.max(0, 5 + 3 * gauss()) * 10) / 10; });   // Cpd-42: maximal at every dose
    lmAfterChange(); _lmEnsureFit(true); await wait(500);
    const R = state.fitResults, by = id => R.find(x => x.sampleId === id), o = {};
    const brief = r => r && { noCurve: !!r.noCurve, ec50: r.ec50M, eff: Math.round(_lmEff(r)), top: Math.round(r.top), bot: Math.round(r.bottom), range: r.flagRangeLo || r.flagRangeHi, reason: _flagReason(r) };
    o.flat = ['Cpd-17', 'Cpd-08'].map(id => brief(by(id)));
    o.real = brief(by('Ref-A')); o.potent = brief(by('Cpd-42'));
    o.maxTop = Math.max(...R.map(r => r.top)); o.minBot = Math.min(...R.map(r => r.bottom));
    state.rsTab = 'plot'; rsSetTab('plot'); plotFillSelects && plotFillSelects(); plotDraw();
    o.plotNaN = /NaN/.test(document.getElementById('pl-svg').innerHTML);
    o.cell = (() => { const tr = [...document.querySelectorAll('#results-table-wrap tbody tr')].find(t => /Cpd-17/.test(t.textContent)); return tr ? tr.textContent.replace(/\s+/g, ' ') : ''; })();
    o.lb = luminaResultRows().filter(x => x.compound === 'Cpd-17').map(x => ({ p: x.potency, nd: x.nd, bound: x.bound }));
    o.csv = getResultColumns().map(c => c.xh);
    return o;
  });
  check('L24 flat series of noise are reported as the flat line: no curve, span 0, no potency', r.flat.every(f => f && f.noCurve && f.eff === 0 && !isFinite(f.ec50) && /No dose-response/.test(f.reason)), JSON.stringify(r.flat));
  check('L24 a real curve keeps its fit, and a compound maximal at every dose is not "no curve"', r.real && !r.real.noCurve && isFinite(r.real.ec50) && r.potent && !r.potent.noCurve, JSON.stringify([r.real, r.potent]));
  check('L24 no plateau of any curve leaves the readings behind (top and bottom stay within the scale of the plate)', r.maxTop < 160 && r.minBot > -60, JSON.stringify([r.maxTop, r.minBot]));
  check('L24 the Plot draws no NaN, the table says n.d., and Labbook gets no potency (nd, a bound)', !r.plotNaN && /n\.d\./.test(r.cell) && r.lb.length === 1 && r.lb[0].p === null && r.lb[0].nd && r.lb[0].bound, JSON.stringify([r.plotNaN, r.cell.slice(0, 120), r.lb]));
} catch (err) { check('L24 the checks ran to the end', false, String(err && err.message || err).split('\n')[0]); }

check('no page or console errors', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close();
if (findings.length) { console.log(findings.join('\n')); console.log(`\n${findings.length} finding(s), ${passed} checks passed.`); process.exit(1); }
console.log(`Lumina invariants: ${passed} checks passed.`);
