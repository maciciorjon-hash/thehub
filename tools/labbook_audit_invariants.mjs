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
//   L9 one date format      No date on screen is written 19/10/2026 or "Oct 19": it is `19 Oct 2026` (docs/UI.md); records stay ISO.
//   L10 Tab leaves the text  Tab in a step's text outside a list moves on (it indented the paragraph: a keyboard trap); Esc then Tab leaves a list too.
//   L11 text is readable    On the main screens, in both themes, every piece of text that is not ink-on-a-fill is 4.5:1 against what is behind it
//                           (--text3 was 3.85, accent / good / warn as text 3.5-3.8, a literal green in the dark recipe).
//   L12 a stale device cannot undo a folder  Projects and folders are merged by id against what the cloud holds at the moment of the write (a
//                           transaction), never written over it: a device that never heard of a folder, or holds an older list with a newer
//                           `updated`, refreshes without erasing it; a folder made offline survives the cloud winning the tree; a deletion still
//                           goes. (the list was one cloud value, last writer wins: the folder vanished and its experiment became an orphan)
//   L13 a setup can be changed  Every question of an experiment's setup can be removed (a copy of a run that used OA need not ask for OA), a removed
//                           type question can be restored, one of your own can be added and edited, and the experiment keeps the change; the Designer's
//                           parameters step does the same. (Edit setup could only answer the fixed questions; the Designer could not remove a design's own)
//   L14 the day sheet keeps the circles  Today on paper lists every culture with the five answers the screen offers (OK, Change media, Need to split,
//                           Seed, Issue) as words to circle with a pen, not a bare box. (the sheet printed a box and the alert text only)
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
  // ── L9 / L11 ──
  if (run('L9') || run('L11')) {
    counts.L9 = counts.L11 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`);
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    const SCENES = [`openExp('${ids.spark}')`, `openExp('${ids.bio}')`, `selectNode('home')`, `selectNode('journal')`, `selectNode('week')`, `selectNode('exps')`, `selectNode('design')`, `openRecover('trash')`, `openSettings()`, `(function(){var p=LB.data.projects.filter(function(x){return (x.sections||[]).length})[0];selectNode('expsec',p.id,p.sections[0].id);openNew();})()`];
    for (const theme of ['light', 'dark']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      for (const js of SCENES) {
        await page.evaluate(js => { document.querySelectorAll('.modal-back.open,#spot-back.open').forEach(x => x.classList.remove('open')); (0, eval)(js); }, js);
        await page.waitForTimeout(500);
        const r = await page.evaluate(() => {
          const out = { dates: [], low: [] };
          const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let p = e; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
          const txt = document.body.innerText;
          const d1 = txt.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g), d2 = txt.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),? (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b/g);
          (d1 || []).concat(d2 || []).slice(0, 3).forEach(x => out.dates.push(x));
          const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
          const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
          const Lm = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
          const blend = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
          const onAcc = parse(getComputedStyle(document.documentElement).getPropertyValue('--on-accent').trim().replace(/^#(..)(..)(..)$/, (m, a, b, c) => `rgb(${parseInt(a, 16)},${parseInt(b, 16)},${parseInt(c, 16)})`) || 'rgb(255,255,255)');
          const bgOf = e => { const st = []; let p = e; while (p) { const cs = getComputedStyle(p); if (/gradient/.test(cs.backgroundImage)) return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } p = p.parentElement; } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = blend(st[i], base); return base; };
          const seen = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, k = 0;
          while ((n = w.nextNode()) && k < 3000) {
            const t = n.textContent.trim(); if (!t) continue; const e = n.parentElement; if (!e || /^(SCRIPT|STYLE)$/.test(e.tagName) || !vis(e)) continue; k++;
            if (e.closest('.modal-back:not(.open),[disabled],svg,#lb-tour')) continue;
            const cs = getComputedStyle(e); const fg = parse(cs.color), bg = bgOf(e); if (!fg || !bg) continue;
            if (onAcc && Math.abs(fg.r - onAcc.r) < 3 && Math.abs(fg.g - onAcc.g) < 3 && Math.abs(fg.b - onAcc.b) < 3) continue;   // ink on a fill: held at 3:1 by docs/UI.md
            if (document.querySelector('.modal-back.open') && !e.closest('.modal-back.open')) continue;       // behind a dialog's backdrop
            const f = blend({ ...fg, a: fg.a * (+cs.opacity || 1) }, bg); const l1 = Lm(f), l2 = Lm(bg); const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
            const fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
            if (ratio < (large ? 3 : 4.5)) { const key = (e.className || e.tagName) + cs.color; if (!seen.has(key)) { seen.add(key); out.low.push(ratio.toFixed(2) + ' ' + (typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) + ' "' + t.slice(0, 18) + '" ' + cs.color); } }
          }
          return out;
        });
        if (run('L9')) r.dates.forEach(d => bad('L9', 'a date on screen reads "' + d + '"'));
        if (run('L11')) r.low.forEach(m => bad('L11', theme + ' · ' + js.slice(0, 22) + ' · ' + m));
      }
    }
    await ctx.close();
  }

  // ── L12 ──
  if (run('L12')) {
    counts.L12 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    const r = await page.evaluate(async () => {
      const clone = v => JSON.parse(JSON.stringify(v));
      const names = (list, pid) => { const p = (list || []).find(x => x.id === pid); return p ? (p.sections || []).map(s => s.name).join('|') : '(no project)'; };
      // A cloud with the real Firebase's behaviours that matter here: a transaction is first offered null (nothing cached), then the real value.
      function mock(cloud, log) {
        const ref = {
          once: () => Promise.resolve({ val: () => clone(cloud) }),
          update: d => { log.push(Object.keys(d)); Object.keys(d).forEach(k => { if (k.indexOf('/') > 0) { const a = k.split('/'); cloud[a[0]] = cloud[a[0]] || {}; if (d[k] === null) delete cloud[a[0]][a[1]]; else cloud[a[0]][a[1]] = clone(d[k]); } else cloud[k] = clone(d[k]); }); return Promise.resolve(); },
          child: name => ({ on() {}, off() {},
            transaction: (fn) => { fn(null); const out = fn(clone(cloud[name] === undefined ? null : cloud[name])); if (out === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => clone(cloud[name]) } });
              if (Array.isArray(out) && !out.length) delete cloud[name]; else cloud[name] = clone(out); log.push('tx:' + name);
              return Promise.resolve({ committed: true, snapshot: { val: () => clone(cloud[name] === undefined ? null : cloud[name]) } }); } }) };
        return ref;
      }
      const sec = (id, name) => ({ id, name });
      async function boot(cloud, local) {
        const log = []; LB.data.projects = clone(local.projects); LB.data.experiments = clone(local.experiments || { E1: { id: 'E1', projectId: 'P1', sectionId: 'S2', code: 'TC', blocks: [] } });
        LB.data.generalSections = []; LB.data.notebooks = []; LB.data.updated = local.updated; if (local.base) LB.data._rootBase = { projects: JSON.stringify(local.base) }; else delete LB.data._rootBase;
        window._lbFbRef = mock(cloud, log); _cloudSeen = null; _cloudOn = true; _pushWanted = false; _rootBusy = {}; _rootAgain = {};
        lbInitSync(); await new Promise(r => setTimeout(r, 700)); return log;
      }
      const P = secs => [{ id: 'P1', name: 'SPARK', prefix: 'SP', color: '#5e87c5', sections: secs }];
      const out = {};
      // a  the device that never heard of Time Course, and whose `updated` is newer, refreshes (no base: a first run of this build)
      let cloud = { updated: 1000, projects: P([sec('S1', 'NanoBRET'), sec('S2', 'Time Course')]), experiments: {}, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET')]), updated: 2000 });
      out.a = [names(cloud.projects, 'P1'), names(LB.data.projects, 'P1')];
      // b  the same, with a base (the list as this device last agreed it with the cloud)
      cloud = { updated: 1000, projects: P([sec('S1', 'NanoBRET'), sec('S2', 'Time Course')]), experiments: {}, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET')]), base: P([sec('S1', 'NanoBRET')]), updated: 2000 });
      out.b = [names(cloud.projects, 'P1'), names(LB.data.projects, 'P1')];
      // c  a folder made here and not yet sent; the cloud's tree is newer and wins the tree
      cloud = { updated: 3000, projects: P([sec('S1', 'NanoBRET')]), experiments: { E9: { id: 'E9', projectId: 'P1', sectionId: 'S1', code: 'X', blocks: [] } }, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET'), sec('S3', 'Made offline')]), base: P([sec('S1', 'NanoBRET')]), updated: 2000 });
      out.c = [names(cloud.projects, 'P1'), names(LB.data.projects, 'P1')];
      // d  a folder deleted here goes from the cloud; one made elsewhere meanwhile stays
      cloud = { updated: 1000, projects: P([sec('S1', 'NanoBRET'), sec('S2', 'Time Course'), sec('S4', 'Made elsewhere')]), experiments: {}, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET')]), base: P([sec('S1', 'NanoBRET'), sec('S2', 'Time Course')]), updated: 2000 });
      out.d = [names(cloud.projects, 'P1'), names(LB.data.projects, 'P1')];
      // e  a rename made elsewhere is taken by a device that did not touch the name; a folder made here is sent
      cloud = { updated: 1000, projects: [{ id: 'P1', name: 'SPARK renamed', prefix: 'SP', color: '#5e87c5', sections: [sec('S1', 'NanoBRET')] }], experiments: {}, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET'), sec('S5', 'New here')]), base: P([sec('S1', 'NanoBRET')]), updated: 2000 });
      out.e = [cloud.projects[0].name + ':' + names(cloud.projects, 'P1'), LB.data.projects[0].name + ':' + names(LB.data.projects, 'P1')];
      // f  a project that exists only in the cloud arrives; a whole project made here goes up
      cloud = { updated: 1000, projects: [{ id: 'P2', name: 'Other', prefix: 'OT', color: '#999', sections: [sec('T1', 'A')] }], experiments: {}, generalSections: [], pages: {}, notebook: {} };
      await boot(cloud, { projects: P([sec('S1', 'NanoBRET')]), updated: 2000 });
      out.f = [cloud.projects.map(p => p.id).sort().join(','), LB.data.projects.map(p => p.id).sort().join(',')];
      return out;
    });
    const want = { a: 'NanoBRET|Time Course', b: 'NanoBRET|Time Course', c: 'NanoBRET|Made offline', d: 'NanoBRET|Made elsewhere', e: 'SPARK renamed:NanoBRET|New here', f: 'P1,P2' };
    const why = { a: 'a device that never heard of a folder erased it from the cloud on refresh (or did not receive it)', b: 'same, with a base', c: 'a folder made here and not yet sent was lost when the cloud won the tree', d: 'a deletion did not go, or a folder made elsewhere was dropped with it', e: 'a rename elsewhere was reverted, or a new folder here was not sent', f: 'a project that exists only on one side was dropped' };
    for (const k of Object.keys(want)) { const [c, l] = r[k]; if (c !== want[k] || l !== want[k]) bad('L12', `${k}: cloud "${c}", here "${l}", wanted "${want[k]}" — ${why[k]}`); }
    await ctx.close();
  }
  // ── L10 ──
  if (run('L14')) {
    counts.L14 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    await page.evaluate(`${SEED}`);
    const r = await page.evaluate(() => {
      window.lbCultures = () => [{ id: 'c1', c: { line: 'HEK293T', passage: 12, vessel: 'T75' }, alerts: [], worst: 'ok' }, { id: 'c2', c: { line: 'HeLa', passage: 8 }, alerts: [], worst: 'ok' }];
      const d = document.createElement('div'); d.innerHTML = buildDaySheet(todayStr());
      return [...d.querySelectorAll('.ds-cul')].map(row => [...row.querySelectorAll('.ds-o')].map(o => o.textContent));
    });
    const want = ['OK', 'Change media', 'Need to split', 'Seed', 'Issue'];
    if (r.length !== 2) bad('L14', 'the day sheet printed ' + r.length + ' culture rows for 2 cultures');
    r.forEach(o => { if (o.join('|') !== want.join('|')) bad('L14', 'a culture row offers [' + o.join(', ') + '] instead of the five answers'); });
    await ctx.close();
  }
  if (run('L10')) {
    counts.L10 = 1;
    const ctx = await newCtx(); const { page } = await open(ctx);
    const ids = await page.evaluate(`${SEED}`);
    await page.evaluate(id => openExp(id), ids.wb); await page.waitForTimeout(600);
    await page.evaluate(() => { document.querySelectorAll('.modal-back.open').forEach(x => x.classList.remove('open')); });
    const ed = await page.evaluate(() => { const rts = [...document.querySelectorAll('.bench-group .rt[contenteditable="true"]')]; const t = rts.find(e => !e.querySelector('li')) || rts[0]; if (!t) return null; t.setAttribute('data-l10', '1'); return true; });
    if (!ed) bad('L10', 'no step text to test');
    else {
      await page.focus('[data-l10]'); await page.evaluate(() => { const t = document.querySelector('[data-l10]'); const r = document.createRange(); r.selectNodeContents(t); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
      const html0 = await page.evaluate(() => document.querySelector('[data-l10]').innerHTML);
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => ({ still: document.activeElement === document.querySelector('[data-l10]') || !!document.querySelector('[data-l10]').contains(document.activeElement), html: document.querySelector('[data-l10]').innerHTML }));
      if (r.still) bad('L10', 'Tab stayed in the text of a step (a keyboard trap)');
      if (r.html !== html0) bad('L10', 'Tab changed the text of a step outside a list');
    }
    await ctx.close();
  }
  // ── L13 ──
  if (run('L13')) {
    counts.L13 = 1;
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const id = await page.evaluate(() => { const P = LB.data.projects.find(p => (p.sections || []).length), S = P.sections[0], key = 'KD_TC_SPARKNS';
      const tpl = LB.data.presets[key] || EXTRA_PRESET_SEED[key]; if (!tpl) return null;
      const su = Object.assign({}, setupDefaultsFor(key), JSON.parse(JSON.stringify(tpl.setup || {})));
      const before = Object.assign({}, LB.data.experiments);
      buildExperimentFrom({ pid: P.id, sid: S.id, key, tpl, startDate: todayStr(), type: presetBase(key), title: tpl.title || key, code: 'AU_L13', setup: su, plate: true });
      save(); return Object.values(LB.data.experiments).find(x => !before[x.id]).id; });
    if (!id) bad('L13', 'the OA time course preset is gone (the test is void)');
    else {
      const has = k => page.evaluate(([id, k]) => expSetupFields(LB.data.experiments[id]).some(f => f.f === k), [id, k]);
      await page.evaluate(id => openSetupEditor(id), id);
      const n0 = await page.locator('#es-fields .q-i').count();
      for (const k of ['oligoHi', 'antiHi', 'oligoLo', 'antiLo']) {
        await page.locator(`#es-fields .q-i[data-q="${k}"] .ds-mb.x`).click();
        if (await page.locator('#lb-dialog.open').count()) await page.click('#lb-dlg-ok');   // the steps quote it: say so, then go
        await page.waitForTimeout(80);
      }
      const n1 = await page.locator('#es-fields .q-i').count();
      if (n1 !== n0 - 4) bad('L13', `removing four questions left ${n1} of ${n0} (every question needs a way out)`);
      // one of the type's own goes and comes back
      await page.locator('#es-fields .q-i[data-q="intervalMin"] .ds-mb.x').click();
      if (await page.locator('#lb-dialog.open').count()) await page.click('#lb-dlg-ok');
      if (await page.locator('#es-fields .q-i[data-q="intervalMin"]').count()) bad('L13', 'a type question stayed after it was removed');
      // the "Not asked" note wraps when the list is long or the font wide (CI's DejaVu did): a row that starts after a bare word is the align audit's
      // 'wrapped rows start at different left edges', so every line of the note starts at the same edge whatever the width
      const nl = await page.evaluate(() => { const n = document.querySelector('#es-fields .q-gone'); if (!n) return null; const w0 = n.style.width; n.style.width = '120px';
        const rows = []; [...n.children].forEach(c => { const r = c.getBoundingClientRect(); const g = rows.find(x => !(r.bottom <= x.top + 2 || r.top >= x.bottom - 2)); if (g) g.left = Math.min(g.left, r.left); else rows.push({ top: r.top, bottom: r.bottom, left: r.left }); });
        n.style.width = w0; const ls = rows.map(x => Math.round(x.left)), lead = [...n.childNodes].find(x => x.nodeType === 1 || x.textContent.trim()); return { lead: !!lead && lead.nodeType === 1, rows: rows.length, spread: Math.max(...ls) - Math.min(...ls) }; });
      if (!nl) bad('L13', 'removing questions left no "Not asked" note to restore them from');
      else if (!nl.lead) bad('L13', 'the lead-in word of the "Not asked" note is bare text: when the note wraps the first line starts after it and the rest start at the edge');
      else if (nl.rows < 2) bad('L13', 'the "Not asked" note did not wrap at 120px (the test is void)');
      else if (nl.spread > 8) bad('L13', `the lines of the "Not asked" note start ${nl.spread}px apart (the lead-in word is not an element, so the first line starts after it)`);
      await page.locator('#es-fields .q-gone button:has-text("Read interval")').click();
      if (!await page.locator('#es-fields .q-i[data-q="intervalMin"]').count()) bad('L13', 'a removed type question could not be restored');
      // add and edit one of our own
      await page.click('#es-modal .q-add');
      await page.fill('#dsp-l', 'Medium change (h)'); await page.fill('#dsp-d', '4'); await page.click('#dsp-ok');
      const k = await page.evaluate(() => ES_ADD.filter(f => f.lbl === 'Medium change (h)').map(f => f.f)[0]);
      if (!k) bad('L13', 'the parameter added in Edit setup is not there');
      else {
        await page.locator(`#es-fields .q-i[data-q="${k}"] .ds-mb:not(.x)`).click();
        await page.fill('#dsp-l', 'Medium change (min)'); await page.click('#dsp-ok');
        await page.click('#es-modal .es-foot .btn:not(.ghost)'); await page.waitForTimeout(200);
        const r = await page.evaluate(([id, k]) => { const e = LB.data.experiments[id]; return { oa: expSetupFields(e).some(f => /oligoHi|antiHi|oligoLo|antiLo/.test(f.f)), mine: expSetupFields(e).filter(f => f.f === k).map(f => f.lbl)[0], v: e.setup[k], oaKept: Object.keys(e.setup).some(x => /oligoHi|antiHi|oligoLo|antiLo/.test(x)), chips: setupSummaryHtml(e).indexOf('OA high') >= 0 }; }, [id, k]);
        if (r.oa || r.chips) bad('L13', 'OA is still asked, or still on the setup line, after it was removed and applied');
        if (r.oaKept) bad('L13', 'removed questions left their answers in the setup');
        if (r.mine !== 'Medium change (min)' || String(r.v) !== '4') bad('L13', `the added parameter was not kept as edited (${r.mine} = ${r.v})`);
        await page.evaluate(id => openSetupEditor(id), id);
        if (await page.locator('#es-fields .q-i[data-q="oligoHi"]').count()) bad('L13', 'reopening Edit setup asked the removed question again');
        await page.click('#es-modal .es-foot .btn.ghost');
      }
      // the Designer, from the same design: its own questions can go too
      const d = await page.evaluate(() => { const p = LB.data.projects.find(p => (p.sections || []).length); dsOpen({ mode: 'exp', pid: p.id, sid: p.sections[0].id }); dsLoadPreset('KD_TC_SPARKNS'); DS.step = 1; dsDraw();
        return [...document.querySelectorAll('#ds-body .q-i')].map(c => '{{' + c.dataset.q + '}}'); });
      if (!d.includes('{{oligoHi}}')) bad('L13', 'the Designer did not list the design\'s own questions with controls: ' + d.join(' '));
      else {
        await page.locator('#ds-body .q-i[data-q="oligoHi"] .ds-mb.x').click();
        if (await page.locator('#lb-dialog.open').count()) await page.click('#lb-dlg-ok');
        if (await page.evaluate(() => dsFields(DS).some(f => f.f === 'oligoHi'))) bad('L13', 'a question of the design could not be removed in the Designer');
      }
    }
    errs.forEach(m => bad('L13', 'page error: ' + m)); await ctx.close();
  }
} finally { await browser.close(); if (srv) srv.kill(); }
for (const id of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14']) { if (ONLY && !ONLY.includes(id)) continue; const fs_ = findings.filter(f => f.id === id); process.stdout.write(`  ${fs_.length ? '✗' : '✓'} ${id}${fs_.length ? '  — ' + fs_.length + ' finding(s)' : ''}\n`); }
const seen = new Set(); findings.forEach(f => { const k = f.id + f.m; if (seen.has(k)) return; seen.add(k); process.stdout.write(`     [${f.id}] ${f.m}\n`); });
if (!findings.length) process.stdout.write('\nLabbook audit invariants hold.\n');
process.exit(findings.length ? 1 : 0);
