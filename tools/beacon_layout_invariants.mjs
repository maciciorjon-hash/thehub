// Beacon › Layout from Labbook: the plate map an experiment already has, laid over the plates Beacon reads. A wrong layout
// changes every number without looking wrong, so each check is a way it could be wrong in silence. The page is a small host
// with the real Labbook and the real Beacon in two frames (what dHUB gives them), and a made-up notebook.
// Each check was proven by putting its bug back in a temporary copy (--file=beacon copy, --labbook=labbook copy).
//
//   LY1  a well is what it is       Doses (nM, µM with either mu, a bare number), DMSO however Labbook writes it, no ligand, no substrate, mock, donor and
//                                   acceptor only. What has no place (untransfected, a mass dose, no dose) is left unmarked and said, never given another role.
//   LY2  nothing pooled by accident One compound under two pairs or in two cell lines is two series; each pair's doses are divided by its own DMSO; unnamed
//                                   screen columns are one compound each, and an unnamed dose in no block is left out.
//   LY3  readings stay              Applying keeps every count, Undo gives the old layout back, a plate that is not chosen is untouched, a 384 layout is not
//                                   offered to a plate with 96-well readings, and readings pasted after the layout keep it.
//   LY4  a person decides           Nothing is applied by opening or by a name match; the longest code in a file name is preselected and no match selects
//                                   nothing; Escape closes this dialog only (Setup comes back); Tab stays in it; ⌘V does not reach the plate behind it.
//   LY5  the door                   No button outside dHUB or without access to Labbook, and Labbook is not even loaded before it is asked for.
//
// Usage:  node tools/beacon_layout_invariants.mjs [--only=LY1] [--file=path] [--labbook=path] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const out = [], counts = {};
const check = (inv, name, ok, detail) => { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 500) }); };
const guard = async (inv, fn) => { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } };

// ── the notebook: invented names only ──
const W = (typeId, extra) => Object.assign({ typeId }, extra || {});
const row = (wells, letter, from, to, make) => { for (let c = from; c <= to; c++) wells[letter + c] = make(c - from, c); };
const mixed = {};
mixed.A1 = W('noht'); mixed.A2 = W('p:X', { noLig: true }); mixed.A3 = W('nosub'); mixed.A4 = W('mock'); mixed.A5 = W('d:X'); mixed.A6 = W('a:Y');
mixed.A7 = W('untr'); mixed.A8 = W('dmso'); mixed.A9 = W('dose', { compound: 'DMSO' }); mixed.A10 = W('dose', { compound: 'Cmpd-1', label: 'DMSO' }); mixed.A11 = W('blank');
mixed.A12 = W('dose', { compound: 'Cmpd-1' });
mixed.B1 = W('dose', { compound: 'Cmpd-1', conc: '10 µM' }); mixed.B2 = W('dose', { compound: 'Cmpd-1', conc: '10 μM' }); mixed.B3 = W('dose', { compound: 'Cmpd-1', conc: '508 pM' });
mixed.B4 = W('dose', { compound: 'Cmpd-1', conc: '25' }); mixed.B5 = W('dose', { compound: 'Cmpd-1', conc: '5 ug/mL' }); mixed.B6 = W('cells');
const pairTypes = [{ id: 'p:N1+H', name: 'N1 + H' }, { id: 'p:N2+H', name: 'N2 + H' }];
const pairs = {};
['p:N1+H', 'p:N2+H'].forEach((t, i) => { const a = i ? 'E' : 'C', b = i ? 'F' : 'D';
  row(pairs, a, 1, 4, k => W(t, { compound: 'Cmpd-1', conc: ['10 µM', '1 µM', '100 nM', '10 nM'][k] })); row(pairs, b, 1, 2, () => W(t, { compound: 'DMSO' })); });
const screen = {}; for (let c = 1; c <= 3; c++) 'BCDE'.split('').forEach((l, k) => { screen[l + c] = W('treatment', { conc: ['10 µM', '1 µM', '100 nM', '10 nM'][k], shade: (4 - k) / 4 }); });
const loose = { A1: W('treatment', { conc: '1 µM' }), B7: W('treatment', { conc: '2 µM' }) };
const line = ln => { const w = {}; row(w, 'C', 1, 4, k => W('dose', { compound: 'Cmpd-1', conc: ['10 µM', '1 µM', '100 nM', '10 nM'][k] })); return { format: '96', cellLine: ln, types: [], wells: w }; };
const big = { format: '384', types: [], wells: { P24: W('dose', { compound: 'Cmpd-9', conc: '1 µM' }) } };
const exp = (id, code, plate, more, updated) => ({ id, code, title: 'Run ' + code, kind: 'exp', blocks: [], plate, morePlates: more || [], updated, created: updated });
const TREE = { projects: [], generalSections: [], pages: {}, notebook: {}, tags: [], presets: {}, antibodies: [], attachments: {}, experiments: {
  m: exp('m', 'NB_MIX', { format: '96', types: [{ id: 'p:X', name: 'X + Y' }, { id: 'cells', name: 'Cells only' }], wells: mixed }, [], 9),
  p: exp('p', 'SP_NB20260101', { format: '96', types: pairTypes, wells: pairs }, [], 8),
  q: exp('q', 'SP_NB20260101_CRBN', { format: '96', types: pairTypes, wells: pairs }, [], 7),
  s: exp('s', 'D2B_X1', { format: '96', types: [], wells: screen }, [], 6),
  o: exp('o', 'LOOSE_1', { format: '96', types: [], wells: loose }, [], 5),
  l: exp('l', 'LINES_1', line('HEK293'), [line('HeLa')], 4),
  g: exp('g', 'BIG_384', big, [], 3),
  n: exp('n', 'NO_PLATE', null, [], 2)
} };

const HOST = `<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe id="frame-beacon" src="/apps/beacon/beacon.html" style="width:1366px;height:800px;border:0"></iframe><iframe id="frame-labbook" style="width:1366px;height:300px;border:0"></iframe>
<script>window.__access = true; window.__asked = 0; window._isAppAccessible = function(){ return window.__access; }; window.openApp = function(){};
window.hubEnsureApp = function(id){ if (id !== 'labbook') return false; window.__asked++; var f = document.getElementById('frame-labbook'); if (!f.getAttribute('src')) f.src = '/apps/labbook/labbook.html'; return true; };</script>`;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/host') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.end(HOST); }
  const f = u === '/apps/beacon/beacon.html' && args.file ? path.resolve(args.file) : u === '/apps/labbook/labbook.html' && args.labbook ? path.resolve(args.labbook) : path.join(ROOT, u);
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/javascript'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
async function open(url = '/host') {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 1100 } });
  await ctx.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /cdnjs.*xlsx/.test(u)) return r.continue(); r.abort(); });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(t => { try { if (!localStorage.getItem('hub_labbook')) localStorage.setItem('hub_labbook', t); localStorage.setItem('assist_seen', '1'); } catch (e) {} }, JSON.stringify(TREE));
  await pg.goto(BASE + url);
  let f = pg.mainFrame();
  if (url === '/host') f = await (await pg.$('#frame-beacon')).contentFrame();
  await f.waitForFunction(() => window.bLbOpen && document.getElementById('well-grid'));
  await f.evaluate(() => bRenderAll());
  return { ctx, pg, f, errs };
}
const openDialog = async f => { await f.click('#bn-lb'); await f.waitForSelector('.blb-exp', { timeout: 20000 }); };
const pick = async (f, id) => { await f.click(`[data-exp="${id}"]`); };
const mapNow = (f, i = 0) => f.evaluate(i => { const pl = state.plates[i], o = {}; Object.keys(pl.map).forEach(p => { const m = pl.map[p]; o[p] = m.k === 'cpd' ? [bSeriesById(m.s).name, m.c] : m.k; }); return o; }, i);

if (run('LY5')) await guard('LY5', async () => {
  const a = await open('/apps/beacon/beacon.html');
  check('LY5', 'alone: no button', await a.f.evaluate(() => document.getElementById('bn-lb').hidden));
  await a.ctx.close();
  const { ctx, pg, f } = await open();
  check('LY5', 'in dHUB: a button', await f.evaluate(() => !document.getElementById('bn-lb').hidden));
  check('LY5', 'Labbook not loaded before it is asked for', await pg.evaluate(() => window.__asked === 0 && !document.getElementById('frame-labbook').getAttribute('src')));
  await pg.evaluate(() => { window.__access = false; });
  check('LY5', 'no access: no button, and the call does nothing', await f.evaluate(() => { bRenderAll(); bsOpen(2); const none = !document.getElementById('bs-lb'); bsClose(); bLbOpen(); return none && document.getElementById('bn-lb').hidden && !document.querySelector('#blb.on'); }) && await pg.evaluate(() => window.__asked === 0));
  await ctx.close();
});

if (run('LY1')) await guard('LY1', async () => {
  const { ctx, f, errs } = await open(); await openDialog(f); await pick(f, 'm');
  const text = await f.$eval('#blb-main', e => e.textContent);
  await f.click('#blb-ok');
  const m = await mapNow(f);
  const want = { A1: 'noLigand', A2: 'noLigand', A3: 'noSubstrate', A4: 'mock', A5: 'donorOnly', A6: 'acceptorOnly', A8: 'veh', A9: 'veh', A10: 'veh', B1: ['Cmpd-1', 10000], B2: ['Cmpd-1', 10000], B3: ['Cmpd-1', 0.508], B4: ['Cmpd-1', 25] };
  Object.keys(want).forEach(p => check('LY1', p, JSON.stringify(m[p]) === JSON.stringify(want[p]), m[p]));
  check('LY1', 'nothing else is marked', Object.keys(m).sort().join() === Object.keys(want).sort().join(), Object.keys(m));
  for (const [w, why] of [['A7', 'untransfected'], ['A12', 'no concentration'], ['B5', 'mass concentration'], ['B6', 'Cells only']]) check('LY1', 'says why ' + w + ' is left out', new RegExp(why + '[^.]*\\b' + w + '\\b').test(text), text.slice(0, 700));
  check('LY1', 'no page error', !errs.length, errs);
  await ctx.close();
});

if (run('LY2')) await guard('LY2', async () => {
  const { ctx, f } = await open(); await openDialog(f); await pick(f, 'p'); await f.click('#blb-ok');
  const m = await mapNow(f);
  check('LY2', 'two pairs, two series', m.C1[0] === 'Cmpd-1 · N1 + H' && m.E1[0] === 'Cmpd-1 · N2 + H', [m.C1, m.E1]);
  const rules = await f.evaluate(() => state.plates[0].norm.map(r => r.x.slice().sort().join() + ' / ' + r.y.slice().sort().join()).sort());
  check('LY2', 'a rule per pair', JSON.stringify(rules) === JSON.stringify(['C1,C2,C3,C4 / D1,D2', 'E1,E2,E3,E4 / F1,F2']), rules);
  // the numbers: pair 1's DMSO reads twice pair 2's; each dose reads its own DMSO, so relative to its own it is 1
  const rel = await f.evaluate(() => { const pl = state.plates[0]; Object.keys(pl.map).forEach(p => { pl.donor[p] = 1000; pl.acceptor[p] = /^[CD]/.test(p) ? 200 : 100; }); bAfterChange(); return bDoseData(true).groups.map(g => g.pts.map(q => q.reps.map(r => +r.v.toFixed(3)))).flat(2); });
  check('LY2', 'each pair is relative to its own DMSO', rel.length === 8 && rel.every(v => v === 1), rel);
  await f.evaluate(() => bClearCore()); await openDialog(f); await pick(f, 'l'); await f.click('#blb-ok');
  const a = await mapNow(f, 0), b = await mapNow(f, 1);
  check('LY2', 'two cell lines, two series', a.C1 && b.C1 && a.C1[0] === 'Cmpd-1 · HEK293' && b.C1[0] === 'Cmpd-1 · HeLa', [a.C1, b.C1]);
  await f.evaluate(() => bClearCore()); await openDialog(f); await pick(f, 's'); await f.click('#blb-ok');
  const s = await mapNow(f), names = ['B1', 'B2', 'B3'].map(p => s[p] && s[p][0]);
  check('LY2', 'a screen column is a compound', new Set(names).size === 3 && ['C', 'D', 'E'].every(l => [1, 2, 3].every(c => s[l + c] && s[l + c][0] === names[c - 1])), s);
  await f.evaluate(() => bClearCore()); await openDialog(f); await pick(f, 'o');
  const t = await f.$eval('#blb-main', e => e.textContent), off = await f.$eval('#blb-ok', e => e.disabled);
  check('LY2', 'an unnamed dose in no block is left out, not pooled', off && /no block/.test(t), t.slice(0, 400));
  await ctx.close();
});

if (run('LY3')) await guard('LY3', async () => {
  const { ctx, f } = await open();
  await f.evaluate(() => { const pl = state.plates[0]; for (const p of ['A1', 'C1', 'H12']) { pl.donor[p] = 1000; pl.acceptor[p] = 123; } pl.map = { H12: { k: 'mock' } }; bAfterChange(); bAddPlate(); state.plates[1].map = { A1: { k: 'veh' } }; bGoPlate(0); });
  const reads = () => f.evaluate(() => JSON.stringify(state.plates.map(p => [p.donor, p.acceptor])));
  const r0 = await reads(), m0 = await mapNow(f);
  await openDialog(f); await pick(f, 'g');
  check('LY3', 'a 384 layout is not offered to 96-well readings', await f.$eval('[data-row="0"] option[value="0"]', o => o.disabled));
  await pick(f, 'p'); await f.selectOption('[data-row="1"]', '-1'); await f.click('#blb-ok');
  check('LY3', 'the readings are as they were', await reads() === r0);
  check('LY3', 'a plate not chosen is untouched', JSON.stringify(await mapNow(f, 1)) === JSON.stringify({ A1: 'veh' }), await mapNow(f, 1));
  await f.evaluate(() => bUndo());
  check('LY3', 'Undo gives the old layout back', JSON.stringify(await mapNow(f)) === JSON.stringify(m0) && await f.evaluate(() => state.series.length === 0));
  await f.evaluate(() => bClearCore()); await openDialog(f); await pick(f, 'p'); await f.click('#blb-ok');
  const before = await mapNow(f);
  const ok = await f.evaluate(() => { const grid = v => Array.from({ length: 8 }, () => Array(12).fill(v).join('\t')).join('\n'); bPasteText(grid(1000)); bPasteText(grid(100)); return state.plates.length === 1 && bComplete(state.plates[0]); });
  check('LY3', 'readings pasted after the layout keep it', ok && JSON.stringify(await mapNow(f)) === JSON.stringify(before));
  await ctx.close();
});

if (run('LY4')) await guard('LY4', async () => {
  const { ctx, pg, f } = await open();
  await openDialog(f);
  check('LY4', 'no name, nothing selected', await f.evaluate(() => !document.querySelector('.blb-exp.on') && document.getElementById('blb-ok').disabled));
  check('LY4', 'an experiment with no plate is not listed', await f.evaluate(() => !document.querySelector('[data-exp="n"]')));
  for (let i = 0; i < 14; i++) await pg.keyboard.press('Tab');
  check('LY4', 'Tab stays in the dialog', await f.evaluate(() => !!document.activeElement.closest('#blb')));
  // ⌘V on a button of the dialog must not wake the plate's paste (it moves the focus to its hidden box).
  await f.focus('.blb-x'); await pg.keyboard.press('ControlOrMeta+v');
  check('LY4', '⌘V does not reach the plate', await f.evaluate(() => document.activeElement.classList.contains('blb-x')));
  await pg.keyboard.press('Escape');
  check('LY4', 'Escape closes it', await f.evaluate(() => !document.querySelector('#blb.on')));
  await f.evaluate(() => { state.plates[0].file = 'SP_NB20260101_CRBN_read2.xlsx'; bAfterChange(); });
  await openDialog(f); await f.waitForSelector('.blb-exp.on');
  check('LY4', 'the longest code in the file name is preselected', await f.$eval('.blb-exp.on', e => e.dataset.exp) === 'q');
  check('LY4', 'a match applies nothing', await f.evaluate(() => Object.keys(state.plates[0].map).length === 0));
  await pg.keyboard.press('Escape');
  await ctx.close();
  // A fresh page, Setup first: the order a person does it in, and the one where Setup hears Escape before a later listener would.
  const s = await open();
  // opened once from the Plate tab before Setup has ever been drawn, so this dialog's listener is the older of the two
  await openDialog(s.f); await s.pg.keyboard.press('Escape');
  await s.f.evaluate(() => bsOpen(2)); await s.f.click('#bs-lb'); await s.f.waitForSelector('.blb-exp'); await s.pg.keyboard.press('Escape'); await s.pg.waitForTimeout(250);
  check('LY4', 'from Setup, Escape returns to the same step', await s.f.evaluate(() => bsK.isOpen() && bsK.step === 2 && !document.querySelector('#blb.on')));
  await s.ctx.close();
});

await browser.close(); server.close();
const ids = Object.keys(counts).sort();
for (const id of ids) { const bad = out.filter(o => o.inv === id); console.log((bad.length ? 'FAIL ' : 'ok   ') + id + '  (' + counts[id] + ' checks' + (bad.length ? ', ' + bad.length + ' failed' : '') + ')'); }
for (const o of out) console.log('  ' + o.inv + ' · ' + o.case + ' — ' + o.msg);
console.log(out.length ? out.length + ' violation(s)' : 'all ' + Object.values(counts).reduce((a, b) => a + b, 0) + ' checks passed');
process.exit(out.length ? 1 : 0);
