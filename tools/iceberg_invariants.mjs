// Freezer (Iceberg) invariants — the inventory is a record of real vials; nothing here may lose or bend one.
//
//   F1  nothing lost        an inventory saved by the old app loads and saves back with every vial identical
//   F2  Firebase shapes     a storage with no racks, a rack with no boxes, a box with no vials, a rack list that came
//                           back as an object: all render and are normalised, nothing throws
//   F3  stable colours      a line's colour is a function of its name — the same in any order and after a reload;
//                           "HCT116, X" and "HCT116 Y" share a family hue; a plasmid is not coloured like a cell line
//   F4  find anywhere       words in any order, across every storage; a result opens its box with the well ringed
//   F5  move and discard    moving vials to another box keeps every record, writes the move in both boxes' history;
//                           dragging inside a box moves one vial; discarding a selection logs each one
//   F6  fill a selection    selecting empty wells and filling them fills exactly those wells
//   F7  thaw is history     thawing from the Hub (the shell's _hubThawGo) decrements the vial and logs it in the box
//   F8  views are local     changing the view, the box view, the search or the space filter does not save (or sync)
//                           the inventory
//   F9  backed up first     the inventory as it was is put aside in IndexedDB before this version saves
//
//   node tools/iceberg_invariants.mjs [--only=F1,F4] [--file=apps/iceberg/iceberg.html]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/iceberg/iceberg.html'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const OLD = {   // what the app before the rework wrote: view/search inside the state, logs without a kind
  v: 1, updated: 1759000000000, view: 'table', boxView: 'group', search: 'hek',
  cellLineColors: {},
  storages: {
    minus80: { label: '−80°C', racks: [{ id: 'r1', name: 'Shelf 1', boxes: [
      { id: 'b1', name: 'Box A', rows: 9, cols: 9, vials: {
        A1: { cellLine: 'HCT116, DCAF15 KO #15', passage: 'P12', freezeDate: '2026-01-02', freezeMedia: 'FBS 10% DMSO', cultureMedia: 'McCoy', frozenBy: 'JM', vialCount: 2, notes: 'n1' },
        A2: { kind: 'plasmid', label: 'pJM07', conc: '1 µg/µL', freezeDate: '2026-02-03', frozenBy: 'JM', notes: '' },
        C4: { cellLine: 'HEK293 FT', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' } },
        log: [{ pos: 'B2', vial: { cellLine: 'A549' }, ts: 1758000000000, reason: 'used up' }] },
      { id: 'b2', name: 'Box B', rows: 8, cols: 12, vials: {} }] }] },
    n2: { label: 'Liquid N₂', racks: [{ id: 'r2', name: 'Tank', boxes: [
      { id: 'b3', name: 'Box C', rows: 10, cols: 10, vials: { B4: { cellLine: 'HCT116 DCAF15 KO #15', passage: 'P13', freezeDate: '2026-03-04', vialCount: 1 } } }] }] }
  }
};

const browser = await chromium.launch();
async function open(state, opts) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(([st, o]) => { try { if (st) localStorage.setItem('cryo_state_v1', JSON.stringify(st)); if (o && o.flag) localStorage.setItem('cryo_prerework', '1'); } catch (e) {} }, [state, opts || {}]);
  await page.goto('file://' + FILE); await page.waitForTimeout(700);
  return page;
}
const strip = st => { const c = JSON.parse(JSON.stringify(st)); delete c.updated; delete c.view; delete c.boxView; delete c.search; return c.storages; };

if (run('F1')) await guard('F1', async () => {
  const p = await open(OLD);
  const r = await p.evaluate(() => { saveState(); return JSON.parse(localStorage.getItem('cryo_state_v1')); });
  const a = strip(OLD), b = strip(r);
  const vials = s => { const out = {}; Object.keys(s).forEach(k => (s[k].racks || []).forEach(rk => (rk.boxes || []).forEach(bx => Object.keys(bx.vials || {}).forEach(pos => { out[k + '/' + bx.id + '/' + pos] = bx.vials[pos]; })))); return out; };
  JSON.stringify(vials(a)) === JSON.stringify(vials(b)) ? ok() : bad('F1', 'a vial changed between the old save and the new one');
  JSON.stringify(b.minus80.racks[0].boxes[0].log) === JSON.stringify(a.minus80.racks[0].boxes[0].log) ? ok() : bad('F1', 'the box history changed');
  p.errs.length ? bad('F1', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('F2')) await guard('F2', async () => {
  const weird = { v: 1, storages: { minus80: { label: '−80°C' }, n2: { label: 'N2', racks: { 0: { id: 'r', name: 'R' }, 1: { id: 'r2', name: 'R2', boxes: { 0: { id: 'bx', name: 'X', rows: '9', cols: '9' } } } } } } };
  const p = await open(weird);
  const r = await p.evaluate(() => { const out = {}; try { renderStorageTabs(); switchTab('minus80'); switchTab('n2'); setView('table'); setView('history'); setView('grid'); out.ok = true; } catch (e) { out.err = e.message; }
    out.racks = Array.isArray(state.storages.minus80.racks) && Array.isArray(state.storages.n2.racks) && state.storages.n2.racks.every(r => Array.isArray(r.boxes));
    out.vials = state.storages.n2.racks[1].boxes[0].vials && typeof state.storages.n2.racks[1].boxes[0].vials === 'object';
    out.rows = state.storages.n2.racks[1].boxes[0].rows === 9; return out; });
  r.ok ? ok() : bad('F2', 'threw: ' + r.err);
  r.racks && r.vials && r.rows ? ok() : bad('F2', 'not normalised: ' + JSON.stringify(r));
  p.errs.length ? bad('F2', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('F3')) await guard('F3', async () => {
  const p = await open(OLD);
  const a = await p.evaluate(() => [cellLineColor('HEK293 FT'), cellLineColor('HCT116, DCAF15 KO #15'), cellLineFamilyHue('HCT116, A'), cellLineFamilyHue('HCT116 B'), cellLineColor('pJM07', 'plasmid'), cellLineColor('pJM07', 'cells')]);
  await p.reload(); await p.waitForTimeout(500);
  const b = await p.evaluate(() => { clearColorCache(); cellLineColor('ZZZ, first'); return [cellLineColor('HEK293 FT'), cellLineColor('HCT116, DCAF15 KO #15')]; });
  a[0] === b[0] && a[1] === b[1] ? ok() : bad('F3', 'a colour moved after a reload / another line first: ' + JSON.stringify([a, b]));
  a[2] === a[3] ? ok() : bad('F3', '"HCT116, A" and "HCT116 B" are different families');
  a[4] !== a[5] ? ok() : bad('F3', 'a plasmid is coloured like a cell line');
  await p.context().close();
});

if (run('F4')) await guard('F4', async () => {
  const p = await open(OLD);
  const r = await p.evaluate(async () => {
    const hits = _findVials('dcaf15 hct116').map(h => h.sk + ':' + h.pos);
    const byDate = _findVials('2026-02').map(h => h.pos), byWho = _findVials('jm p12').map(h => h.pos);
    onSearch('dcaf15 hct116'); await new Promise(r => setTimeout(r, 250));
    const rows = document.querySelectorAll('.find-row').length;
    openFindHit(0); await new Promise(r => setTimeout(r, 200));
    const ring = !!document.querySelector('#detail-body .well.found');
    return { hits, byDate, byWho, rows, ring };
  });
  r.hits.length === 2 && r.hits.includes('minus80:A1') && r.hits.includes('n2:B4') ? ok() : bad('F4', 'words in any order across storages: ' + JSON.stringify(r.hits));
  r.byDate.join() === 'A2' && r.byWho.join() === 'A1' ? ok() : bad('F4', 'date / who search: ' + JSON.stringify([r.byDate, r.byWho]));
  r.rows === 2 && r.ring ? ok() : bad('F4', 'the panel or the ring: ' + JSON.stringify(r));
  await p.context().close();
});

if (run('F5')) await guard('F5', async () => {
  const p = await open(OLD);
  const r = await p.evaluate(() => {
    const st = state.storages.minus80, a = st.racks[0].boxes[0], b = st.racks[0].boxes[1];
    const before = JSON.stringify([a.vials.A1, a.vials.A2]);
    const put = _moveVials(a, ['A1', 'A2'], b, 'Shelf 1 › Box B', 'Shelf 1 › Box A');
    const after = JSON.stringify([b.vials[put[0]], b.vials[put[1]]]);
    const out = { put, same: before === after, gone: !a.vials.A1 && !a.vials.A2, outLog: (a.log || []).filter(e => e.kind === 'move').length, inLog: (b.log || []).filter(e => e.kind === 'movein').length };
    openBoxDetail('minus80', 'r1', 'b1'); out.drag = moveWithinBox('C4', 'D5') && !!a.vials.D5 && !a.vials.C4;
    SELW = new Set(['D5']); const realAsk = icebergAsk; icebergAsk = (t, m, o, cb) => cb('failed'); discardSelection(); icebergAsk = realAsk;
    out.disc = !a.vials.D5 && a.log.some(e => e.kind === 'discard' && e.pos === 'D5' && e.reason === 'failed');
    return out;
  });
  r.same && r.gone && r.put.length === 2 ? ok() : bad('F5', 'moving changed or lost a record: ' + JSON.stringify(r));
  r.outLog === 2 && r.inLog === 2 ? ok() : bad('F5', 'the move is not in both histories: ' + JSON.stringify(r));
  r.drag ? ok() : bad('F5', 'drag inside a box did not move the vial');
  r.disc ? ok() : bad('F5', 'discarding a selection did not log it');
  await p.context().close();
});

if (run('F6')) await guard('F6', async () => {
  const p = await open(OLD);
  const r = await p.evaluate(() => {
    openBoxDetail('minus80', 'r1', 'b1');
    ['B1', 'E5', 'I9'].forEach(x => wellClick(x, { metaKey: true }));
    fillSelection(); _vf('cl').value = 'U2OS'; saveVial();
    const b = state.storages.minus80.racks[0].boxes[0];
    return { filled: ['B1', 'E5', 'I9'].filter(x => b.vials[x] && b.vials[x].cellLine === 'U2OS').length, extra: Object.keys(b.vials).filter(x => b.vials[x].cellLine === 'U2OS').length };
  });
  r.filled === 3 && r.extra === 3 ? ok() : bad('F6', 'filling a selection: ' + JSON.stringify(r));
  await p.context().close();
});

if (run('F7')) await guard('F7', async () => {
  const shell = [path.join(ROOT, 'dHUB.html'), path.join(ROOT, 'dist/index.html')].filter(f => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (!shell) bad('F7', 'no built dHUB to run the thaw through (python3 embed.py)');
  else {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:/, r => r.abort());
    await p.addInitScript(st => { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('cryo_state_v1', JSON.stringify(st)); }, OLD);
    await p.goto('file://' + shell); await p.waitForTimeout(900);
    const r = await p.evaluate(async () => {
      isAdmin = true; openCells('cryo');
      for (let i = 0; i < 60; i++) { const f = document.getElementById('frame-cryo'); if (f && f.contentWindow && f.contentWindow.state && f.contentWindow.cryoLog) break; await new Promise(r => setTimeout(r, 150)); }
      const w = document.getElementById('frame-cryo').contentWindow;
      const slot = HUB_FREEZER_FIND(s => s.boxId === 'b1' && s.pos === 'A1')[0];
      if (!slot) return { none: true };
      try { JournalStore.addCell = function () {}; } catch (e) {}
      _hubThawGo(slot, slot.vial.cellLine);
      const box = w.state.storages.minus80.racks[0].boxes[0];
      return { count: box.vials.A1 && box.vials.A1.vialCount, log: (box.log || []).filter(e => e.kind === 'thaw').map(e => e.pos) };
    });
    r.count === 1 && r.log.join() === 'A1' ? ok() : bad('F7', 'thaw from the Hub: ' + JSON.stringify(r) + (errs.length ? ' errors: ' + errs[0] : ''));
    await ctx.close();
  }
});

if (run('F8')) await guard('F8', async () => {
  const p = await open(OLD);
  const r = await p.evaluate(async () => {
    let n = 0; const real = saveState; saveState = function () { n++; return real.apply(this, arguments); };
    setView('table'); setView('grid'); setBoxView('group'); onSearch('hek'); setFitN('3'); await new Promise(r => setTimeout(r, 300));
    saveState = real; return { n, ui: JSON.parse(localStorage.getItem('cryo_ui') || '{}') };
  });
  r.n === 0 ? ok() : bad('F8', 'a view change saved the inventory ' + r.n + ' time(s)');
  r.ui.boxView === 'group' && r.ui.fitN === '3' ? ok() : bad('F8', 'the view is not remembered on this device: ' + JSON.stringify(r.ui));
  await p.context().close();
});

if (run('F9')) await guard('F9', async () => {
  const p = await open(OLD);
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => new Promise(res => { const q = indexedDB.open('iceberg_backup', 1); q.onupgradeneeded = () => q.result.createObjectStore('h'); q.onsuccess = () => { try { const g = q.result.transaction('h', 'readonly').objectStore('h').get('pre-rework'); g.onsuccess = () => res(g.result ? JSON.parse(g.result.json) : null); g.onerror = () => res(null); } catch (e) { res(null); } }; q.onerror = () => res(null); }));
  r && r.storages && r.storages.minus80.racks[0].boxes[0].vials.A1 ? ok() : bad('F9', 'the old inventory was not set aside before saving');
  await p.context().close();
});

await browser.close();
for (const f of findings) console.log(f);
console.log(`\nfreezer invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
