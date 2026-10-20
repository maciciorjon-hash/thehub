// Labbook, audited 2026-10-20 — the classes of loss and of unreachable UI the full audit found, as checks that run every time.
//
// Each one was found by driving the app, not by reading it, and each was proven by putting the old behaviour back:
//
//   L1 a restore keeps what it replaces  Restoring a backup stores the notebook as it was first (IndexedDB lb_backup, key prerestore:<ts>, last three), so
//                           a wrong file is undone from Recover > Snapshots > Browse. (restoring an older file lost every experiment made since, with
//                           no way back: today's snapshot is the morning's)
//   L2 two windows keep the same designs  A window that is typing merges the other's save; the designs (presets), tags and antibodies the other saved
//                           are in both windows and in storage afterwards. (the merge only knew records, planner and projects: a design saved in one
//                           window was gone from both)
//   L3 a sentence in a step wraps  A calculator value that is a sentence (series, parts, untransfected note) is not nowrap, so no experiment page scrolls
//                           sideways at 1024 (the biosensor's step ran 49 px out of the pane)
//   L4 focus is seen        The plate rail (tabindex 0, outline none) and the search box show where the keyboard is
//   L5 every field has a name  Every visible input / select / textarea of the screens reached has a label, aria-label or title
//   L6 the bin never overwrites  Restoring from Deleted items puts a record back under its own id, but when a different record already lives
//                           there (a version restored from Recover > Versions) the live one is kept and the bin's comes back beside it as a copy.
//   L8 a step has its own id  A notebook whose experiment holds two steps with one id (a hand-edited or merged file) comes up with distinct ids, so
//                           ticking the second does not tick the first.
//   L7 an import is one undo step  Importing one experiment from a file is undone by one ⌘Z (the bundle had it; the single import did not)
//
//   node tools/labbook_audit_invariants.mjs [--url=URL] [--only=L1,L3]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('server did not come up: ' + url); }

let srv = null, base = args.url;
if (!base) { const port = await freePort(); srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); base = `http://127.0.0.1:${port}/apps/labbook/labbook.html`; await waitHttp(base); }
const browser = await chromium.launch();
const findings = [], counts = {};
const run = id => !ONLY || ONLY.includes(id);
const bad = (id, m) => findings.push({ id, m });

async function open(ctx, o = {}) {
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('dialog', d => { errs.push('native dialog: ' + d.message().slice(0, 80)); d.dismiss(); });
  await page.goto(base); await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof renderAll === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(o.settle || 1200);
  return { page, errs };
}
const newCtx = (w = 1440, h = 900) => browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true }).then(async c => {
  await c.route(/gstatic\.com|firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage|fonts\.g/, r => r.abort());
  await c.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('lb_backup_nudged', '1'); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} });
  return c; });
// A small notebook built from the presets, so nothing depends on anybody's real data.
const SEED = `(function(){
  var P=(LB.data.projects||[]).find(function(p){ return (p.sections||[]).length; }), S=P.sections[0], out={};
  function mk(key,code,start){ var tpl=LB.data.presets[key]; if(!tpl) return null;
    var su=Object.assign({},setupDefaultsFor(key),JSON.parse(JSON.stringify(tpl.setup||{})));
    var before={}; Object.keys(LB.data.experiments).forEach(function(k){ before[k]=1; });
    buildExperimentFrom({pid:P.id,sid:S.id,key:key,tpl:tpl,startDate:start,type:presetBase(key),title:tpl.title||key,code:code,setup:su,plate:true});
    return Object.values(LB.data.experiments).filter(function(x){ return !before[x.id]; })[0]||null; }
  out.bio=mk('NB_BIO_RTX96','AU_NB_BIO',addDays(todayStr(),-6));
  out.spark=mk('NB_SPARK_SCREEN96','AU_NB_SPARK',todayStr());
  out.wb=mk('WB','AU_WB',addDays(todayStr(),-1));
  save(); var ids={}; Object.keys(out).forEach(function(k){ if(out[k]) ids[k]=out[k].id; }); return ids; })()`;
const idbKeys = (page, db, store) => page.evaluate(([db, store]) => new Promise(res => { const r = indexedDB.open(db); r.onsuccess = () => { try { const q = r.result.transaction(store, 'readonly').objectStore(store).getAllKeys(); q.onsuccess = () => res(q.result); } catch (e) { res([]); } }; r.onerror = () => res([]); }), [db, store]);

try {
  // ── L1 ──
  if (run('L1')) {
    counts.L1 = 1;
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    await page.evaluate(`window.__SW=${SEED}`);
    await page.evaluate(() => { const k = Object.keys(LB.data.experiments)[0]; const e = JSON.parse(JSON.stringify(LB.data.experiments[k])); e.id = 'zz_newwork'; e.code = 'ZZ_NEW'; LB.data.experiments.zz_newwork = e; save(); });
    await page.waitForTimeout(1500);
    // the "older backup": a payload that does not hold zz_newwork
    const payload = await page.evaluate(() => { const d = JSON.parse(JSON.stringify(LB.data)); delete d.experiments.zz_newwork; return JSON.stringify({ _lbBackup: 3, savedAt: Date.now(), data: d, blobs: {}, versions: {} }); });
    const f = path.join(os.tmpdir(), 'lb-audit-restore-' + process.pid + '.json'); fs.writeFileSync(f, payload);
    await page.setInputFiles('#lb-restore-input', f);
    await page.waitForSelector('#lb-dialog.open', { timeout: 5000 });
    await page.click('#lb-dlg-ok');
    await page.waitForTimeout(3500);
    await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data, null, { timeout: 15000 });
    await page.waitForTimeout(1000);
    if (await page.evaluate(() => !!LB.data.experiments.zz_newwork)) bad('L1', 'the restore did not replace the notebook (the test is void)');
    const keys = (await idbKeys(page, 'lb_backup', 'h')).filter(k => String(k).startsWith('prerestore:'));
    if (!keys.length) bad('L1', 'no prerestore copy after a restore: the experiment made since the backup is gone for good');
    else {
      const holds = await page.evaluate(k => new Promise(res => { const r = indexedDB.open('lb_backup'); r.onsuccess = () => { const q = r.result.transaction('h').objectStore('h').get(k); q.onsuccess = () => res(!!(q.result && /zz_newwork/.test(q.result.json))); }; }), keys[0]);
      if (!holds) bad('L1', 'the prerestore copy does not hold the notebook that was replaced');
    }
    errs.forEach(m => bad('L1', 'page error: ' + m)); await ctx.close(); fs.rmSync(f, { force: true });
  }
  // ── L2 ──
  if (run('L2')) {
    counts.L2 = 1;
    const ctx = await newCtx(); const A = (await open(ctx)).page;
    await A.evaluate(`window.__SW=${SEED}`); await A.waitForTimeout(1500);
    const B = (await open(ctx)).page;
    const ids = await A.evaluate(() => Object.keys(LB.data.experiments));
    await B.evaluate(() => { const i = document.createElement('input'); document.body.appendChild(i); i.focus(); });   // B is typing
    await A.evaluate(([x]) => { const e = LB.data.experiments[x]; e.title = 'A-EDIT'; e.updated = Date.now(); LB.data.presets['ZZ_DESIGN'] = { title: 'A design', blocks: [] }; LB.data.tags = (LB.data.tags || []).concat(['zz-tag']); LB.data.antibodies = LB.data.antibodies || {}; LB.data.antibodies['zz-ab'] = { name: 'zz' }; save(); }, [ids[0]]);
    await A.waitForTimeout(1500);
    await B.evaluate(([y]) => { const e = LB.data.experiments[y]; e.title = 'B-EDIT'; e.updated = Date.now(); save(); }, [ids[1]]);
    await B.waitForTimeout(1800);
    await B.evaluate(() => document.activeElement.blur()); await B.waitForTimeout(1500);
    const read = p => p.evaluate(([x, y]) => ({ x: LB.data.experiments[x].title, y: LB.data.experiments[y].title, d: !!LB.data.presets.ZZ_DESIGN, t: (LB.data.tags || []).includes('zz-tag'), a: !!(LB.data.antibodies || {})['zz-ab'] }), [ids[0], ids[1]]);
    const C = (await open(ctx)).page;
    for (const [n, p] of [['window A', A], ['window B', B], ['a fresh window', C]]) {
      const r = await read(p);
      if (r.x !== 'A-EDIT' || r.y !== 'B-EDIT') bad('L2', `${n}: record edits lost (${r.x} / ${r.y})`);
      if (!r.d) bad('L2', `${n}: the design saved in the other window is gone`);
      if (!r.t) bad('L2', `${n}: the tag saved in the other window is gone`);
      if (!r.a) bad('L2', `${n}: the antibody saved in the other window is gone`);
    }
    await ctx.close();
  }
  // ── L3 ──
  if (run('L3')) {
    counts.L3 = 1;
    const ctx = await newCtx(1024, 768); const { page } = await open(ctx);
    const r = await page.evaluate(`(function(){ var ids=${SEED}; openExp(ids.bio); return ids; })()`);
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => { const pe = document.getElementById('pane-ed'); const over = []; const pr = pe.getBoundingClientRect(); pe.querySelectorAll('.cv').forEach(e => { const q = e.getBoundingClientRect(); if (q.width && q.right > pr.right + 1) over.push((e.getAttribute('data-c') || '') + ' ' + Math.round(q.right - pr.right) + 'px'); }); return { over, sw: pe.scrollWidth, cw: pe.clientWidth }; });
    if (m.over.length) bad('L3', 'a calculator value runs out of the pane: ' + m.over.join(', '));
    if (m.sw > m.cw + 1) bad('L3', `the experiment pane scrolls sideways (${m.sw} > ${m.cw})`);
    await ctx.close();
  }
  // ── L4 / L5 ──
  if (run('L4') || run('L5')) {
    counts.L4 = counts.L5 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`);
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    const SCENES = [`openExp('${ids.spark}')`, `selectNode('journal')`, `selectNode('week')`, `selectNode('exps')`, `selectNode('design')`, `(function(){var p=LB.data.projects.filter(function(x){return (x.sections||[]).length})[0];selectNode('expsec',p.id,p.sections[0].id);openNew();})()`, `openSetupEditor('${ids.spark}')`, `openSpot()`, `openSettings()`];
    for (const js of SCENES) {
      await page.evaluate(js => { document.querySelectorAll('.modal-back.open,#spot-back.open').forEach(x => x.classList.remove('open')); (0, eval)(js); }, js);
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
        const d = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '');
        const noname = [], nofocus = [];
        document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(e => { if (!vis(e)) return; if (e.closest('[hidden]')) return;
          const lab = e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.closest('label') || e.placeholder; if (!lab) noname.push(d(e)); });
        const snap = e => { const c = getComputedStyle(e); return [c.outlineStyle, c.outlineWidth, c.outlineColor, c.boxShadow, c.borderTopColor, c.borderBottomColor, c.backgroundColor].join('|'); };
        document.querySelectorAll('.xp-rail,#spot').forEach(e => { if (!vis(e)) return; const t = e.id === 'spot' ? document.getElementById('spot-in') : e; if(document.activeElement) document.activeElement.blur(); const b = snap(e); t.focus({ focusVisible: true }); if (document.activeElement === t && snap(e) === b) nofocus.push(d(e)); t.blur(); });
        return { noname, nofocus };
      });
      if (run('L5')) r.noname.forEach(n => bad('L5', 'no name on ' + n));
      if (run('L4')) r.nofocus.forEach(n => bad('L4', 'focus not visible on ' + n));
    }
    await ctx.close();
  }
  // ── L6 ──
  if (run('L6')) {
    counts.L6 = 1;
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`);
    const r = await page.evaluate((id) => {
      const live = LB.data.experiments[id]; const orig = JSON.stringify(live);
      // the bin holds an older copy of the same id; the live one was edited since
      const old = JSON.parse(orig); old.title = 'OLD-FROM-BIN';
      LB.data.trash = LB.data.trash || {}; LB.data.trash.t_test = { id: 't_test', kind: 'experiment', label: 'bin', at: Date.now(), payload: { exp: old } };
      live.title = 'LIVE-NEWER';
      lbTrashRestore('t_test');
      const all = Object.values(LB.data.experiments);
      return { liveTitle: LB.data.experiments[id].title, copies: all.filter(e => e.title === 'OLD-FROM-BIN (restored)').length, gone: !LB.data.trash.t_test };
    }, ids.bio);
    if (r.liveTitle !== 'LIVE-NEWER') bad('L6', 'the live record was overwritten by the bin (' + r.liveTitle + ')');
    if (r.copies !== 1) bad('L6', 'the bin\'s record did not come back as a copy (' + r.copies + ')');
    if (!r.gone) bad('L6', 'the bin entry stayed after the restore');
    errs.forEach(m => bad('L6', 'page error: ' + m)); await ctx.close();
  }
  // ── L7 ──
  if (run('L7')) {
    counts.L7 = 1;
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`);
    const f = path.join(os.tmpdir(), 'lb-audit-import-' + process.pid + '.json');
    const json = await page.evaluate((id) => JSON.stringify({ _lbExperiment: 1, app: 'Labbook', exported: '2026-10-20', project: 'P', folder: 'F', experiment: LB.data.experiments[id] }), ids.wb);
    fs.writeFileSync(f, json);
    const n0 = await page.evaluate(() => Object.keys(LB.data.experiments).length);
    await page.evaluate(() => { const p = LB.data.projects.filter(x => (x.sections || []).length)[0]; selectNode('expsec', p.id, p.sections[0].id); });
    await page.evaluate(() => importExpJSON());
    await page.setInputFiles('#lb-impexp-input', f);
    await page.waitForSelector('#lb-dialog.open', { timeout: 5000 }); await page.click('#lb-dlg-ok'); await page.waitForTimeout(600);
    const n1 = await page.evaluate(() => Object.keys(LB.data.experiments).length);
    if (n1 !== n0 + 1) bad('L7', `the import did not add one experiment (${n0} -> ${n1})`);
    await page.evaluate(() => lbUndo()); await page.waitForTimeout(300);
    const n2 = await page.evaluate(() => Object.keys(LB.data.experiments).length);
    if (n2 !== n0) bad('L7', `one undo did not take the import back (${n0} -> ${n1} -> ${n2})`);
    errs.forEach(m => bad('L7', 'page error: ' + m)); await ctx.close(); fs.rmSync(f, { force: true });
  }
  // ── L8 ──
  if (run('L8')) {
    counts.L8 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`); await page.waitForTimeout(1500);
    await page.evaluate(id => { const bl = LB.data.experiments[id].blocks; bl[1].id = bl[0].id; LB.data.updated = Date.now() + 5000; save(); }, ids.bio);
    await page.waitForTimeout(1500);
    await page.reload(); await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof renderAll === 'function'); await page.waitForTimeout(1500);
    const r = await page.evaluate(id => LB.data.experiments[id].blocks.map(b => b.id), ids.bio);
    if (new Set(r).size !== r.length) bad('L8', 'two steps of one experiment still share an id after a reload');
    await ctx.close();
  }
} finally { await browser.close(); if (srv) srv.kill(); }
for (const id of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']) { if (ONLY && !ONLY.includes(id)) continue; const fs_ = findings.filter(f => f.id === id); process.stdout.write(`  ${fs_.length ? '✗' : '✓'} ${id}${fs_.length ? '  — ' + fs_.length + ' finding(s)' : ''}\n`); }
const seen = new Set(); findings.forEach(f => { const k = f.id + f.m; if (seen.has(k)) return; seen.add(k); process.stdout.write(`     [${f.id}] ${f.m}\n`); });
if (!findings.length) process.stdout.write('\nLabbook audit invariants hold.\n');
process.exit(findings.length ? 1 : 0);
