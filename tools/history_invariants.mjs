// History invariants — an analysis is kept under its name, in every app that reads data and fits it (tools/historykit).
//
//   H1  nothing is kept while there is nothing to keep; an analysis with readings is kept by itself a moment after it appears
//   H2  the History tab lists it with its name, plate count and compounds; no second copy for the same analysis
//   H3  a change to the same analysis updates its entry; loading the same readings in a new session finds the entry
//   H4  Open puts the analysis back exactly (the app's own session / project, compared whole) and lands on Results
//   H5  rename sticks through the next save; pin puts the entry first; delete asks, then removes
//   H6  the copy of the kit in the app is the kit (tools/sync_historykit.py --check, run by static_checks)
//
//   H7  Beacon: an entry written before the kit (snap, info, compounds …) is listed, opens, and is rewritten in the kit's shape when pinned
//
//   node tools/history_invariants.mjs [--app=lumina|tempo|beacon|bca]      exit 1 on any finding
import { chromium } from 'playwright';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const only = (process.argv.find(a => a.startsWith('--app=')) || '').slice(6);
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { findings.push('✗ ' + name + (detail ? ' — ' + detail : '')); console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); } };

try { execSync('python3 tools/sync_historykit.py --check', { cwd: ROOT, stdio: 'pipe' }); check('H6 the kit copies are current', true); }
catch (e) { check('H6 the kit copies are current', false, String(e.stdout || e.message).trim()); }

const browser = await chromium.launch();

// What each app is asked to do: put an analysis on screen, say what is on screen, empty it, and name the History tab.
const APPS = {
  lumina: {
    file: 'apps/lumina/lumina.html', ready: () => typeof lmSession === 'function' && typeof lmHist !== 'undefined',
    load: () => { const sig = {}; 'ABCDEFGH'.split('').forEach((L, r) => { for (let c = 1; c <= 12; c++) sig[L + c] = Math.round(1e5 * (0.05 + 0.95 / (1 + Math.pow(10, (r - 3.5 + (c - 6) * 0.2))))); });
      lmLoadSession({ v: 1, assay: document.getElementById('assay-type').value, format: 96, layout: { grads: [], zones: [] }, plates: [{ signal: sig, file: 'HB20260504.xlsx', name: 'HB20260504' }], names: ['Compound A', 'Compound B'], ctrl: [], zero: [], excluded: [], settings: [], units: { u: 'auto', log: false } }); return true; },
    what: () => JSON.stringify(lmSession()), clear: () => { lmLoadSession({ v: 1, format: 96, layout: { grads: [], zones: [] }, plates: [], names: [], ctrl: [], zero: [], excluded: [], settings: [] }); },
    edit: () => { state.names[0] = 'Compound Z'; lmAfterChange(); }, tab: () => document.querySelector('.tab.active').dataset.tab,
    hist: () => lmHist, entryName: 'HB20260504'
  },
  tempo: {
    file: 'apps/tempo/tempo.html', ready: () => typeof tpLoadExample === 'function' && typeof tpHist !== 'undefined',
    load: async () => { await tpLoadExample(); return true; },
    what: () => JSON.stringify(tpProject().plates.map(p => [p.id, p.name, Object.keys(p.wells).length, p.times.length])), clear: async () => { TP.plates = []; TP.res = {}; TP.pi = 0; tpAfterLoad(); },
    edit: () => { TP.plates[0].name = 'Renamed plate'; tpRender(); }, tab: () => TP.ui.tab,
    hist: () => tpHist, entryName: 'Example plate A + 1 more'
  },
  beacon: {
    file: 'apps/beacon/beacon.html', ready: () => typeof bhist !== 'undefined' && typeof loadTestData === 'function',
    load: () => { loadTestData('gain'); bRename('My NanoBRET run'); return true; },
    what: () => JSON.stringify(JSON.parse(_bSnap(), (k, v) => k === '_bb' ? undefined : v)), clear: () => { bClearAll(); const ok = document.getElementById('bea-ask-ok'); if (ok) ok.click(); },
    edit: () => { state.series[0].name = 'Compound Z'; bAfterChange(); }, tab: () => activeTab,
    hist: () => bhist, entryName: 'My NanoBRET run'
  },
  bca: {
    file: 'apps/bca/bca.html', ready: () => typeof bcaHist !== 'undefined' && typeof loadTestData === 'function',
    load: () => { loadTestData(); return true; },
    what: () => JSON.stringify(bcaSession()), clear: () => { clearPlate(); },
    edit: () => { state.plateMap.sampleGroups[0].name = 'Zed'; renderSamplesTable(); }, tab: () => activeTab,
    hist: () => bcaHist, entryName: 'BCA · Demo data · ', prefix: true, land: 'standards'
  }
};

for (const [id, A] of Object.entries(APPS)) {
  if (only && only !== id) continue;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.goto('file://' + path.join(ROOT, A.file));
  await page.waitForFunction(A.ready, null, { timeout: 15000 });
  const recs = () => page.evaluate(id => new Promise(res => { const rq = indexedDB.open(id + '_history'); rq.onsuccess = () => { const g = rq.result.transaction('runs').objectStore('runs').getAll(); g.onsuccess = () => res(g.result.map(r => ({ id: r.id, name: r.name, named: r.named, pinned: r.pinned, bits: r.bits, chips: r.chips }))); }; rq.onerror = () => res(null); }), id);
  const settle = () => page.waitForTimeout(1900);

  await settle();
  check(id + ' H1 nothing on screen, nothing kept', (await recs()).length === 0);
  await page.evaluate(A.load); await settle();
  let r = await recs();
  check(id + ' H1 the analysis is kept by itself', r.length === 1, JSON.stringify(r));
  check(id + ' H1 named after the plate', r[0] && (A.prefix ? r[0].name.indexOf(A.entryName) === 0 : r[0].name === A.entryName), r[0] && r[0].name);

  await page.evaluate(() => { const b = document.querySelector('.tab[data-tab="history"]'); b.click(); });
  await page.waitForTimeout(300);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.hk-row')].map(x => x.innerText.replace(/\s+/g, ' ')));
  check(id + ' H2 the tab lists it once', rows.length === 1 && rows[0].indexOf(A.entryName) >= 0 && /plate|sample/i.test(rows[0]), JSON.stringify(rows));
  check(id + ' H2 marked open now', /Open now/i.test(rows[0] || ''));

  await page.evaluate(A.edit); await settle();
  r = await recs();
  check(id + ' H3 an edit updates the entry, no second copy', r.length === 1, JSON.stringify(r.map(x => x.name)));

  // a new session with the same readings finds its entry
  await page.reload(); await page.waitForFunction(A.ready, null, { timeout: 15000 });
  await page.evaluate(A.clear); await settle();
  check(id + ' H1 emptying the screen keeps nothing new', (await recs()).length === 1);
  await page.evaluate(A.load); await settle();
  r = await recs();
  check(id + ' H3 the same readings in a new session find their entry', r.length === 1, JSON.stringify(r.map(x => x.name)));

  // H4 open
  const kept = await page.evaluate(A.what);
  await page.evaluate(A.clear); await settle();
  await page.evaluate(() => document.querySelector('.tab[data-tab="history"]').click()); await page.waitForTimeout(300);
  await page.evaluate(() => { const b = document.querySelector('.hk-row [data-a="open"]'); b.click(); });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(A.what);
  check(id + ' H4 Open puts the analysis back exactly', after === kept, after.slice(0, 80));
  check(id + ' H4 …on Results', (await page.evaluate(A.tab)) === (A.land || 'results'), await page.evaluate(A.tab));
  await settle();
  check(id + ' H4 opening does not make a second entry', (await recs()).length === 1);

  // H5 rename, pin, delete
  await page.evaluate(() => document.querySelector('.tab[data-tab="history"]').click()); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.hk-row [data-a="ren"]').click()); await page.waitForTimeout(200);
  await page.fill('.hk-dlg input', 'My kept name'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  r = await recs();
  check(id + ' H5 rename is stored', r[0] && r[0].name === 'My kept name' && r[0].named, JSON.stringify(r[0]));
  await page.evaluate(A.edit); await settle();
  r = await recs();
  check(id + ' H5 a later save keeps the name a person gave it', r.length === 1 && r[0].name === 'My kept name', JSON.stringify(r.map(x => x.name)));
  await page.evaluate(() => document.querySelector('.tab[data-tab="history"]').click()); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.hk-row [data-a="pin"]').click()); await page.waitForTimeout(400);
  check(id + ' H5 pin is stored', (await recs())[0].pinned === true);
  await page.evaluate(() => document.querySelector('.hk-row [data-a="del"]').click()); await page.waitForTimeout(200);
  check(id + ' H5 delete asks first', (await recs()).length === 1 && !!(await page.$('.hk-dlg')));
  await page.evaluate(() => document.querySelector('.hk-dlg [data-x="1"]').click()); await page.waitForTimeout(500);
  check(id + ' H5 delete removes it', (await recs()).length === 0);
  if (id === 'beacon') {
    // H7 an entry from before the kit
    await page.evaluate(A.load); await settle();
    const legacy = await page.evaluate(() => { const comps = state.series.map(s => s.name); return { id: 'legacy1', name: 'Old run', assay: state.assayMode, info: { target: 'BRD4' }, snap: _bSnap(), created: 1700000000000, updated: 1700000000000, pinned: false, plates: state.plates.length, read: bReadyPlates().length, wells: 10, fmt: state.plates.map(() => 96), compounds: comps, files: ['old.xlsx'] }; });
    await page.evaluate(() => new Promise(res => { const rq = indexedDB.open('beacon_history'); rq.onsuccess = () => { const t = rq.result.transaction('runs', 'readwrite'); t.objectStore('runs').clear(); t.oncomplete = () => res(); }; }));
    await page.evaluate(l => new Promise(res => { const rq = indexedDB.open('beacon_history'); rq.onsuccess = () => { const t = rq.result.transaction('runs', 'readwrite'); t.objectStore('runs').put(l); t.oncomplete = () => res(); }; }), legacy);
    await page.evaluate(A.clear); await page.waitForTimeout(300);
    await page.reload(); await page.waitForFunction(A.ready, null, { timeout: 15000 }); await settle();
    await page.evaluate(() => document.querySelector('.tab[data-tab="history"]').click()); await page.waitForTimeout(300);
    const lrows = await page.evaluate(() => [...document.querySelectorAll('.hk-row')].map(x => x.innerText.replace(/\s+/g, ' ')));
    check(id + ' H7 an entry from before the kit is listed with its facts', lrows.length === 1 && /Old run/.test(lrows[0]) && /BRD4/.test(lrows[0]) && /old\.xlsx/.test(lrows[0]), JSON.stringify(lrows));
    await page.evaluate(() => document.querySelector('.hk-row [data-a="open"]').click()); await page.waitForTimeout(1500);
    const op = await page.evaluate(() => ({ plates: state.plates.length, ser: state.series.map(s => s.name), name: state.name, tab: activeTab, n: bhist.list.length }));
    check(id + ' H7 …opens with its plates, compounds and name', op.plates === legacy.plates && op.ser.join() === legacy.compounds.join() && op.name === 'Old run' && op.tab === 'results', JSON.stringify(op));
    await settle();
    check(id + ' H7 …and opening it adds no second entry', (await recs()).length === 1);
    await page.evaluate(() => document.querySelector('.tab[data-tab="history"]').click()); await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('.hk-row [data-a="pin"]').click()); await page.waitForTimeout(500);
    const lr = (await recs())[0];
    check(id + ' H7 pinning rewrites it in the kit\'s shape, same id', lr && lr.id === 'legacy1' && lr.pinned === true && Array.isArray(lr.chips) && lr.chips.length === legacy.compounds.length, JSON.stringify(lr));
  }
  check(id + ' no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(findings.length ? '\n' + findings.length + ' finding(s), ' + passed + ' passed' : 'History invariants: ' + passed + ' checks passed');
process.exit(findings.length ? 1 : 0);
