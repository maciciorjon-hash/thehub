// New analysis — every analysis app with a Setup (Echo, Lumina, Beacon, Tempo; tools/newkit).
//
//   N1  entering the app with nothing on screen opens Setup by itself
//   N2  with nothing on screen the button goes straight to an empty Setup (no question)
//   N3  with an analysis on screen the button asks; Esc changes nothing
//   N4  "Start empty": the analysis is kept in History, the screen is empty and Setup is open
//   N5  "Keep these inputs": the same readings, layout and settings are on screen, what was worked out from them is gone, Setup is open, and the copy is
//       an entry of its own in History next to the first, which is exactly as it was (with a typed Assay ID the copy is "<id> (2)")
//   N6  the same readings read again after "New analysis" are a new entry, never the one kept before
//
//   node tools/newanalysis_invariants.mjs [--app=lumina|tempo|beacon|echo]      exit 1 on any finding
import { chromium } from 'playwright';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const only = (process.argv.find(a => a.startsWith('--app=')) || '').slice(6);
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { findings.push('✗ ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 300) : '')); console.log('  ✗ ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 300) : '')); } };

try { execSync('python3 tools/sync_newkit.py --check', { cwd: ROOT, stdio: 'pipe' }); check('the kit copies are current', true); }
catch (e) { check('the kit copies are current', false, String(e.stdout || e.message).trim()); }

// What each app is asked to do: put an analysis on screen (with a typed Assay ID), say what its inputs are, whether Setup is open, whether the screen is empty.
const APPS = {
  lumina: {
    file: 'apps/lumina/lumina.html', ready: () => typeof lmNew !== 'undefined' && typeof lmHist !== 'undefined' && lmHist.loaded,
    open: () => !!(lsK && lsK.isOpen()), close: () => lsClose(), empty: () => !lmHasReads() && !state.layout.grads.length,
    load: () => { loadLuminaTestData(); state.assayId = 'VIAB1'; lmAfterChange(); }, id: 'VIAB1',
    inputs: () => { const s = lmSession(); delete s.assayId; return JSON.stringify(s); }, assayId: () => state.assayId,
    hist: () => lmHist, worked: () => (state.fitResults || []).length === 0
  },
  tempo: {
    file: 'apps/tempo/tempo.html', ready: () => typeof tpNew !== 'undefined' && typeof tpHist !== 'undefined' && tpHist.loaded,
    open: () => !!(tpsK && tpsK.isOpen()), close: () => tpsK.close(), empty: () => !TP.plates.length,
    load: async () => { await tpLoadExample(); TP.plates.forEach((p, i) => { if (!i) { p.name = 'TC1'; p.idTyped = true; } }); tpRender(); }, id: 'TC1',
    inputs: () => JSON.stringify(TP.plates.map(p => [p.id, Object.keys(p.wells).length, p.times.length, JSON.stringify(p.wells)])), assayId: () => TP.plates[0] && TP.plates[0].name,
    hist: () => tpHist
  },
  beacon: {
    file: 'apps/beacon/beacon.html', ready: () => typeof bNew !== 'undefined' && typeof bhist !== 'undefined' && bhist.loaded,
    open: () => !!(bsK && bsK.isOpen()), close: () => bsClose(), empty: () => !bHasAnything(),
    load: () => { loadTestData('gain'); bRename('NB1'); }, id: 'NB1',
    inputs: () => JSON.stringify(state.plates.map(pl => [Object.keys(pl.donor).length, Object.keys(pl.acceptor).length, JSON.stringify(pl.map)])) + JSON.stringify(state.series), assayId: () => state.name,
    hist: () => bhist
  }
};

const browser = await chromium.launch();
for (const [id, A] of Object.entries(APPS)) {
  if (only && only !== id) continue;
  console.log('· ' + id);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { window.__autoSetup = true; });
  await page.route(/^https?:/, r => r.abort());
  await page.goto('file://' + path.join(ROOT, A.file));
  await page.waitForFunction(A.ready, null, { timeout: 15000 });
  const E = (f, a) => page.evaluate(f, a);
  const list = () => E(h => eval('(' + h + ')')().list.map(r => ({ id: r.id, name: r.name, dkey: r.dkey, n: JSON.stringify(r.data).length, data: JSON.stringify(r.data).replace(/"saved":"[^"]*"/, '') })), A.hist.toString());   // Tempo's project file carries the moment it was written
  const dlg = () => page.locator('.nk-back').count();
  // N1
  await page.waitForFunction(A.open, null, { timeout: 4000 }).catch(() => {});
  check(id + ' N1 Setup opens by itself on entry', await E(A.open));
  await E(A.close);
  // N2
  await page.click('#nk-open'); await page.waitForTimeout(300);
  check(id + ' N2 an empty app: no question, Setup opens', (await dlg()) === 0 && await E(A.open));
  await E(A.close);
  // an analysis on screen
  await E(A.load); await page.waitForTimeout(1200);
  const before = await E(A.inputs), l0 = await list();
  check(id + ' the analysis is in History before New analysis', l0.length === 1 && l0[0].name === A.id, l0.map(r => r.name));
  // N3
  await page.click('#nk-open'); await page.waitForTimeout(200);
  check(id + ' N3 with an analysis the button asks', (await dlg()) === 1 && (await page.locator('.nk-opt').count()) === 2);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  check(id + ' N3 Esc closes the question and changes nothing', (await dlg()) === 0 && !(await E(A.open)) && (await E(A.inputs)) === before);
  // N5 copy
  await page.click('#nk-open'); await page.click('.nk-opt[data-k="copy"]'); await page.waitForTimeout(900);
  const after = await E(A.inputs), l1 = await list();
  check(id + ' N5 the copy opens Setup', await E(A.open));
  check(id + ' N5 the inputs are the same', after === before);
  check(id + ' N5 the copy is called "<id> (2)"', (await E(A.assayId)) === A.id + ' (2)', await E(A.assayId));
  check(id + ' N5 two entries now, the first as it was', l1.length === 2 && l1.some(r => r.name === A.id && r.data === l0[0].data && r.id === l0[0].id) && l1.some(r => r.name === A.id + ' (2)'), l1.map(r => r.name));
  await E(A.close);
  // N4 blank
  await page.click('#nk-open'); await page.click('.nk-opt[data-k="blank"]'); await page.waitForTimeout(900);
  const l2 = await list();
  check(id + ' N4 empty screen with Setup open', (await E(A.empty)) && await E(A.open));
  check(id + ' N4 both kept, as they were', l2.length === 2 && l2.some(r => r.id === l0[0].id && r.data === l0[0].data), l2.map(r => r.name));
  await E(A.close);
  // N6 the same readings again
  await E(A.load); await page.waitForTimeout(1300);
  const l3 = await list();
  check(id + ' N6 the same readings again are a new entry', l3.length === 3 && l3.some(r => r.id === l0[0].id && r.data === l0[0].data), l3.map(r => r.name));
  check(id + ' no script error', errs.length === 0, errs);
  await ctx.close();
}

// Echo keeps its own History (by Assay ID, with versions), written when a run is run: it has no readings to compare, so its flow is its own.
if (!only || only === 'echo') {
  console.log('· echo');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.goto('file://' + path.join(ROOT, 'apps/echo/echo.html'));
  await page.waitForFunction(() => typeof echoNew !== 'undefined' && typeof loadTestData === 'function' && typeof EchoSetup !== 'undefined', null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  const E = (f, a) => page.evaluate(f, a);
  const dlg = () => page.locator('.nk-back').count();
  const sets = () => E(() => Object.values(_hx.sets).map(s => ({ name: s.name, runs: Object.values(_hx.runs).filter(r => r.setId === s.id).length })));
  const state0 = () => E(() => ({ files: echoFiles.length, readers: Object.keys(readerFiles).length, rows: scatterData.length, name: document.getElementById('p-assay').value, open: EchoSetup.isOpen(),
    emptyResults: !!document.querySelector('#results-panel .empty') && !document.querySelector('#results-panel table'), emptyScatter: !!document.querySelector('#scatter-panel .empty'), counts: ['rc', 'sc'].map(i => document.getElementById(i).textContent).join('/') }));
  check('echo N1 Setup opens by itself on entry', (await state0()).open);
  await E(() => closeSetupModal()); await page.waitForTimeout(200);
  await page.click('#nk-open'); await page.waitForTimeout(300);
  check('echo N2 an empty app: no question, Setup opens', (await dlg()) === 0 && (await state0()).open);
  await E(() => closeSetupModal());
  await E(() => { document.documentElement.setAttribute('data-theme', 'light'); loadTestData(); }); await page.waitForTimeout(800);
  await E(() => { document.getElementById('p-assay').value = 'ECHO1'; });
  await E(() => runPipeline());
  await page.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const ran = await state0(), s0 = await sets();
  check('echo the run is in History before New analysis', s0.length === 1 && s0[0].name === 'ECHO1' && s0[0].runs === 1, s0);
  await page.click('#nk-open'); await page.waitForTimeout(200);
  check('echo N3 with an analysis the button asks', (await dlg()) === 1 && (await page.locator('.nk-opt').count()) === 2);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  const esc = await state0();
  check('echo N3 Esc closes the question and changes nothing', (await dlg()) === 0 && esc.rows === ran.rows && esc.name === 'ECHO1' && !esc.open);
  // N5 copy
  await page.click('#nk-open'); await page.click('.nk-opt[data-k="copy"]'); await page.waitForTimeout(900);
  const cp = await state0();
  check('echo N5 the copy opens Setup on the same files', cp.open && cp.files === ran.files && cp.readers === ran.readers && cp.files > 0, cp);
  check('echo N5 the results are gone', cp.rows === 0 && cp.emptyResults && cp.emptyScatter, cp);
  check('echo N5 the copy is called "<id> (2)"', cp.name === 'ECHO1 (2)', cp.name);
  const s1 = await sets();
  check('echo N5 the first analysis is as it was', s1.length === 1 && s1[0].name === 'ECHO1' && s1[0].runs === 1, s1);
  await E(() => runPipeline());
  await page.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0 && !document.getElementById('run-btn').textContent.includes('Running'), null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const s2 = await sets();
  check('echo N5 running the copy makes an analysis of its own, not a version', s2.length === 2 && s2.every(x => x.runs === 1), s2);
  // N4 blank
  await page.click('#nk-open'); await page.click('.nk-opt[data-k="blank"]'); await page.waitForTimeout(900);
  const bl = await state0();
  check('echo N4 empty screen with Setup open', bl.open && bl.files === 0 && bl.readers === 0 && bl.rows === 0 && bl.name === '' && bl.emptyResults && bl.emptyScatter && bl.counts === '0/0', bl);
  const s3 = await sets();
  check('echo N4 both kept', s3.length === 2, s3);
  await E(() => closeSetupModal());
  // every tab is still there and says it has nothing
  const tabs = await E(() => [...document.querySelectorAll('.tab[data-tab]')].map(t => t.dataset.tab));
  for (const t of tabs) { await E(t => { const b = document.querySelector('.tab[data-tab="' + t + '"]'); if (b) b.click(); }, t); await page.waitForTimeout(150); }
  check('echo every tab opens on an empty analysis without an error', errs.length === 0, errs);
  // and the app runs again from there
  await E(() => { document.querySelector('.tab[data-tab="results"]').click(); loadTestData(); }); await page.waitForTimeout(800);
  await E(() => { document.getElementById('p-assay').value = 'ECHO3'; runPipeline(); });
  await page.waitForFunction(() => _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
  check('echo a new analysis runs after "start empty"', (await E(() => scatterData.length)) > 0 && errs.length === 0, errs);
  await ctx.close();
}
await browser.close();
console.log(findings.length ? '\n' + findings.length + ' finding(s), ' + passed + ' passed' : '\nOK — ' + passed + ' checks');
process.exit(findings.length ? 1 : 0);
