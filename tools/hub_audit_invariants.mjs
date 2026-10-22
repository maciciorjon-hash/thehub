// Shell audit invariants (2026-10-19) — what the Hub's own chrome owes a keyboard, a screen reader, a blocked
// browser store and a second device. Complements tools/hub_invariants.mjs (what a person sees on every visit).
//
//   H1  a blocked or corrupt store never blanks the Hub   localStorage that throws, a corrupt hub_unlocked: home drawn, cards built, rail built
//   H2  one way to be modal        Settings / a question / the search: focus goes in, the page behind is inert, Tab stays inside,
//                                  Esc closes and gives focus back; a question asked over another answers the first 'no'
//   H3  landmarks and names        one visible main, labelled navs, a skip link, an h1, a page title that follows the app, cards that
//                                  are buttons and open on Space, the hidden home is not tabbable behind an open app
//   H4  announced                  the toast and the announcement bar are live regions; Settings tabs are a tablist you move with arrows
//   H5  sync, two devices          nothing is written before the first cloud read; an empty cloud key after that read is the truth (the last
//                                  task another device deleted does not come back); on the first read local data the cloud lacks is kept and seeded
//   H6  who may steer the shell    a message from a window that is not one of the app frames does nothing
//   H7  backup                     Export with the cloud unreadable still writes what this browser holds (named local); an automatic backup never downloads
//   H8  Lab panel                  no inline hex / px sizes, every switch has a name, a failed save is said and put back
//   H9  contrast                   the announcement bar's text is >= 4.5:1 in both themes
//   H11 stored text stays text    markup in a task, culture, antibody, announcement, toast or question is printed, never run, on every landing, the nav note and the search
//   H10 contrast, the whole shell  every text run the shell draws (landings, Settings tabs, search, toast, bar) is >= 4.5:1 in both themes
//                                  (ink on a solid accent fill is held at 3:1, docs/UI.md)
//   H12 an access reset resets          an unlock stored under an older ACCESS_EPOCH is dropped, the old words open nothing, the discover box says who to ask
//                                  for a code, and an unlock made now survives a reload
//
//   node tools/hub_audit_invariants.mjs [--shell=PATH] [--only=H2]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const _cands = ['dist/index.html', 'dHUB.html'].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
const SHELL = path.resolve(ROOT, arg('shell', _cands[0] || path.join(ROOT, 'dHUB.html')));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);

const findings = [];
let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };

// A Firebase stand-in the test can drive: the admin is signed in, /journal's value listener fires only when the test says so,
// and every set() is recorded.
const FB = `(function(){
  var fb = window.__fb = { writes: [], listeners: [], vals: {}, failOnce: false, lastEmit: null };
  function snap(v){ return { val:function(){return v;}, exists:function(){return v!=null;}, forEach:function(){}, key:null, child:function(){return snap(null);} }; }
  fb.emit = function(v){ fb.lastEmit = v; fb.listeners.forEach(function(cb){ cb(snap(v)); }); };
  function ref(path){ var r = {
    on:function(e,cb){ if(path==='journal'&&e==='value') fb.listeners.push(cb); else setTimeout(function(){ try{cb(snap(null));}catch(x){} },0); return cb; },
    once:function(){ if(fb.failOnce) return Promise.reject(new Error('denied')); return Promise.resolve(snap(fb.vals[path]!=null?fb.vals[path]:null)); },
    off:function(){}, set:function(v){ fb.writes.push([path, v]); return Promise.resolve(); }, update:function(){ return Promise.resolve(); }, remove:function(){ return Promise.resolve(); },
    push:function(){ return ref(path+'/k'+Math.random().toString(36).slice(2,8)); }, child:function(p){ return ref(path+'/'+p); },
    onDisconnect:function(){ return { set:function(){}, remove:function(){}, cancel:function(){} }; },
    key:String(path).split('/').pop() }; return r; }
  var user = { email:'maciciorjon@gmail.com', uid:'stub', displayName:'Jon', getIdToken:function(){ return Promise.resolve('t'); } };
  var auth = { currentUser:null, onAuthStateChanged:function(cb){ var u = window.__STUB_NOUSER ? null : user; auth.currentUser = u; setTimeout(function(){ cb(u); }, 60); return function(){}; },
    signOut:function(){ return Promise.resolve(); }, signInWithPopup:function(){ return Promise.resolve({user:user}); } };
  var F = { initializeApp:function(){}, apps:[{}], SDK_VERSION:'stub', database:function(){ return { ref:ref, goOffline:function(){}, goOnline:function(){} }; }, auth:function(){ return auth; }, storage:function(){ return { ref:ref }; } };
  F.auth.GoogleAuthProvider = function(){ this.setCustomParameters = function(){}; }; F.database.ServerValue = { TIMESTAMP: Date.now() };
  window.firebase = F;
})();`;

const browser = await chromium.launch();
async function open({ mode = 'admin', init = '', w = 1440, h = 900, theme = 'light', fb = true } = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
  if (fb) {
    await context.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-app-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: FB }));
    await context.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-(auth|database|storage)-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.route(/firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage/, r => r.abort());
  } else await context.route(/^https?:/, r => r.abort());
  await context.addInitScript(([t, m, ini]) => {
    try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('hub_theme', t); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {}
    if (m === 'visitor') window.__STUB_NOUSER = 1;
    if (ini) { try { (0, eval)(ini); } catch (e) {} }
  }, [theme, mode, init]);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + SHELL, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  return { context, page, errs };
}
const settle = (page, ms = 80) => page.waitForTimeout(ms);

if (run('H1')) {
  for (const [name, init] of [['corrupt hub_unlocked', "localStorage.setItem('hub_unlocked','{bad');"],
                              ['a store that throws', "Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}});"],
                              ['a session store that throws', "Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('denied','SecurityError')}});"]]) {
    for (const mode of ['visitor', 'admin']) {
      const { context, page, errs } = await open({ mode, init });
      // The Hub fades in once auth answers (1.5 s at the latest). The admin lands inside an app (Labbook), and then #hub-home is hidden by design:
      // "drawn" is the home at full opacity OR an app view at full opacity, and a loaded runner needs longer than the fixed settle in open().
      const drawn = () => { const h = document.getElementById('hub-home'); if (h && +getComputedStyle(h).opacity === 1) return 1; return document.body.classList.contains('in-app') && [...document.querySelectorAll('.app-view')].some(v => v.style.display !== 'none' && +getComputedStyle(v).opacity === 1) ? 1 : 0; };
      await page.waitForFunction(drawn, null, { timeout: 8000 }).catch(() => {});
      const r = await page.evaluate(() => ({ home: (() => { const h = document.getElementById('hub-home'); if (h && +getComputedStyle(h).opacity === 1) return 1; return document.body.classList.contains('in-app') && [...document.querySelectorAll('.app-view')].some(v => v.style.display !== 'none' && +getComputedStyle(v).opacity === 1) ? 1 : 0; })(), cards: document.querySelectorAll('.card,.ld-card').length, rail: document.querySelectorAll('#ws-rail .ws-item').length, open: typeof openApp }));
      if (r.home !== 1 || r.open !== 'function' || r.cards < 5) bad('H1', `${name} (${mode}): the Hub did not draw: ${JSON.stringify(r)}`);
      else if (mode === 'admin' && !r.rail) bad('H1', `${name} (admin): no rail`);
      else ok();
      const own = errs.filter(e => !/sandbox/.test(e)); if (own.length) bad('H1', `${name} (${mode}): ${own[0]}`);
      await context.close();
    }
  }
}

if (run('H2')) {
  const { context, page } = await open({});
  await page.evaluate(() => wsGo('analysis')); await settle(page, 400);
  await page.focus('#opts-btn');
  await page.keyboard.press('Enter'); await settle(page, 120);
  let r = await page.evaluate(() => ({ inDlg: !!document.activeElement.closest('#settings-back'), homeInert: document.getElementById('hub-home').inert, railInert: document.getElementById('ws-rail').inert, navInert: document.getElementById('hub-nav').inert }));
  if (!r.inDlg) bad('H2', 'Settings opened and focus stayed outside it'); else ok();
  if (!r.homeInert || !r.railInert || !r.navInert) bad('H2', 'the page behind Settings is not inert: ' + JSON.stringify(r)); else ok();
  let leaked = false;
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); if (!await page.evaluate(() => !!document.activeElement.closest('#settings-back'))) { leaked = true; break; } }
  for (let i = 0; i < 25 && !leaked; i++) { await page.keyboard.press('Shift+Tab'); if (!await page.evaluate(() => !!document.activeElement.closest('#settings-back'))) { leaked = true; break; } }
  if (leaked) bad('H2', 'Tab left the Settings dialog'); else ok();
  // arrows move between its tabs
  await page.focus('#set-tabs .set-tab.on'); await page.keyboard.press('ArrowRight'); await settle(page, 120);
  r = await page.evaluate(() => ({ tab: document.activeElement.id, sel: document.querySelector('#set-tabs [aria-selected=true]').id, pane: !document.getElementById('set-pane-data').hidden }));
  if (r.tab !== 'set-tab-data' || r.sel !== 'set-tab-data' || !r.pane) bad('H2', 'ArrowRight on the Settings tabs: ' + JSON.stringify(r)); else ok();
  // a question over Settings; a second question answers the first 'no'
  const answers = await page.evaluate(async () => {
    const out = []; hubAsk('One', 'first', {}, y => out.push('one:' + y)); await new Promise(r => setTimeout(r, 60));
    const settingsInert = document.getElementById('settings-back').inert; hubAsk('Two', 'second', {}, y => out.push('two:' + y)); await new Promise(r => setTimeout(r, 60));
    out.push('inert:' + settingsInert, 'focusOk:' + (document.activeElement.id === 'hub-dlg-ok')); return out;
  });
  if (answers[0] !== 'one:false' || answers[1] !== 'inert:true' || answers[2] !== 'focusOk:true') bad('H2', 'questions over Settings: ' + answers.join(' ')); else ok();
  await page.keyboard.press('Escape'); await settle(page, 120);
  r = await page.evaluate(() => ({ dlgHidden: document.getElementById('hub-dlg').classList.contains('hidden'), settingsOpen: !document.getElementById('settings-back').classList.contains('hidden'), settingsInert: document.getElementById('settings-back').inert }));
  if (!r.dlgHidden || !r.settingsOpen || r.settingsInert) bad('H2', 'Esc on the question should close only it and give Settings back: ' + JSON.stringify(r)); else ok();
  await page.keyboard.press('Escape'); await settle(page, 150);
  r = await page.evaluate(() => ({ focus: document.activeElement.id, homeInert: document.getElementById('hub-home').inert, navInert: document.getElementById('hub-nav').inert }));
  if (r.focus !== 'opts-btn') bad('H2', 'closing Settings did not give focus back to its button (it is on ' + (r.focus || 'nothing') + ')'); else ok();
  if (r.homeInert || r.navInert) bad('H2', 'the page stayed inert after Settings closed'); else ok();
  // the search: Tab onto the nav box opens it, Esc closes it and does not open it again
  await page.focus('#opts-btn'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab'); await settle(page, 150);
  r = await page.evaluate(() => ({ open: document.getElementById('hub-spot-back').classList.contains('open'), focus: document.activeElement.id }));
  if (!r.open || r.focus !== 'hub-spot-in') { await page.evaluate(() => window.hubSpot.open()); await settle(page, 150); }
  await page.keyboard.type('echo'); await settle(page, 100);
  r = await page.evaluate(() => ({ role: document.getElementById('hub-spot-in').getAttribute('role'), ad: document.getElementById('hub-spot-in').getAttribute('aria-activedescendant'), opt: document.querySelectorAll('#hub-spot-res [role=option]').length, dlg: !!document.querySelector('#hub-spot-back [role=dialog][aria-modal=true]') }));
  if (r.role !== 'combobox' || !r.ad || !r.opt || !r.dlg) bad('H2', 'the search is not a dialog with a combobox and options: ' + JSON.stringify(r)); else ok();
  await page.keyboard.press('Escape'); await settle(page, 250);
  r = await page.evaluate(() => ({ open: document.getElementById('hub-spot-back').classList.contains('open'), inert: document.getElementById('hub-home').inert }));
  if (r.open || r.inert) bad('H2', 'Esc on the search did not close it for good (a hand-back of focus to the nav box opened it again): ' + JSON.stringify(r)); else ok();
  await context.close();
}

if (run('H3')) {
  const { context, page } = await open({});
  await page.evaluate(() => wsGo('analysis')); await settle(page, 400);
  let r = await page.evaluate(() => {
    const vis = e => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden'; };
    const mains = [...document.querySelectorAll('main,[role=main]')].filter(e => vis(e) && !e.closest('[hidden]'));
    const navs = [...document.querySelectorAll('nav')].filter(e => vis(e));
    return { mains: mains.length, navs: navs.map(n => n.getAttribute('aria-label')), skip: !!document.querySelector('a.skip-link[href="#hub-home"]'), h1: [...document.querySelectorAll('[role=heading][aria-level="1"],h1')].filter(vis).length,
      title: document.title, cards: [...document.querySelectorAll('#hub-suites .ld-card')].map(c => c.getAttribute('role')), logo: document.getElementById('hub-logo').getAttribute('role') };
  });
  if (r.mains !== 1) bad('H3', 'the page has ' + r.mains + ' visible main landmarks (want 1)'); else ok();
  if (r.navs.some(n => !n)) bad('H3', 'an unlabelled nav landmark'); else ok();
  if (!r.skip) bad('H3', 'no skip link'); else ok();
  if (r.h1 !== 1) bad('H3', 'the landing has ' + r.h1 + ' level-1 headings'); else ok();
  if (!/Data Analysis/.test(r.title)) bad('H3', 'the page title does not say where you are: ' + r.title); else ok();
  if (!r.cards.length || r.cards.some(x => x !== 'button')) bad('H3', 'landing cards are not buttons: ' + r.cards.join()); else ok();
  if (r.logo !== 'button') bad('H3', 'the logo is not a button'); else ok();
  // Space opens a card, as Enter does
  await page.focus('#hub-suites .ld-card[data-app-id="echo"]'); await page.keyboard.press('Space'); await settle(page, 700);
  r = await page.evaluate(() => ({ app: currentApp, title: document.title, homeInert: document.getElementById('hub-home').inert, main: (document.querySelector('#view-echo') || {}).getAttribute && document.querySelector('#view-echo').getAttribute('role'), label: document.querySelector('#view-echo').getAttribute('aria-label') }));
  if (r.app !== 'echo') bad('H3', 'Space on a card did not open the app'); else ok();
  if (!/Echo/.test(r.title)) bad('H3', 'the title did not follow into the app: ' + r.title); else ok();
  if (!r.homeInert) bad('H3', 'the home behind an open app is still tabbable'); else ok();
  if (r.main !== 'main' || !r.label) bad('H3', 'the open app is not the labelled main'); else ok();
  await page.evaluate(() => backToHub()); await settle(page, 600);
  r = await page.evaluate(() => ({ homeInert: document.getElementById('hub-home').inert, focus: (document.activeElement.dataset || {}).appId || document.activeElement.tagName }));
  if (r.homeInert) bad('H3', 'the home stayed inert after leaving the app'); else ok();
  await context.close();
}

if (run('H4')) {
  const { context, page } = await open({});
  const r = await page.evaluate(() => {
    hubToast('saved'); const a = document.getElementById('hub-toast').getAttribute('role'); hubToast('broke', 'err'); const b = document.getElementById('hub-toast').getAttribute('role');
    return { a, b, live: document.getElementById('hub-toast').getAttribute('aria-live'), ann: document.getElementById('hub-announce').getAttribute('role'), tabs: document.querySelector('#set-tabs') && (openSettings('appearance'), document.getElementById('set-tabs').getAttribute('role')) };
  });
  if (r.a !== 'status' || r.b !== 'alert' || r.live !== 'polite') bad('H4', 'the toast is not a live region: ' + JSON.stringify(r)); else ok();
  if (r.ann !== 'status') bad('H4', 'the announcement bar is not a live region'); else ok();
  if (r.tabs !== 'tablist') bad('H4', 'Settings tabs are not a tablist'); else ok();
  await context.close();
}

if (run('H5')) {
  // (a) nothing is written before the first cloud read; (b) after it, an empty cloud key is the truth
  let { context, page } = await open({});
  let r = await page.evaluate(async () => {
    const fb = window.__fb; JournalStore.attach(); await new Promise(r => setTimeout(r, 50));
    const id = 'loc1'; JournalStore.addTask({ t: 'typed before the read landed' });
    await new Promise(r => setTimeout(r, 50));
    const before = fb.writes.filter(w => /^journal\//.test(w[0])).length;
    fb.emit({ tasks: { a: { t: 'from the cloud' } } }); await new Promise(r => setTimeout(r, 80));
    const mid = JournalStore.get().tasks, afterWrites = fb.writes.filter(w => /^journal\/tasks\//.test(w[0])).length;
    const ids = Object.keys(mid);
    fb.emit({ tasks: { a: { t: 'from the cloud' }, [ids.find(k => k !== 'a')]: { t: 'typed before the read landed' } } }); await new Promise(r => setTimeout(r, 80));
    const seeded0 = fb.writes.length;
    fb.emit({}); await new Promise(r => setTimeout(r, 80));   // another device deleted both
    return { before, ids, afterWrites, left: Object.keys(JournalStore.get().tasks), reseeded: fb.writes.length - seeded0 };
  });
  if (r.before !== 0) bad('H5', 'wrote to the cloud before the first read landed (' + r.before + ' writes)'); else ok();
  if (r.ids.length !== 2 || r.afterWrites < 1) bad('H5', 'a task typed before the first read was lost or never sent: ' + JSON.stringify(r)); else ok();
  if (r.left.length || r.reseeded) bad('H5', 'tasks another device deleted came back after the first read: ' + JSON.stringify({ left: r.left, reseeded: r.reseeded })); else ok();
  await context.close();
  // (c) the very first read: local data the cloud lacks is kept and seeded (rules were just deployed, writes had been refused)
  ({ context, page } = await open({ init: "localStorage.setItem('hub_journal_cache', JSON.stringify({tasks:{x:{t:'only here'}},incubator:{},antibodies:{},primers:{},plasmids:{}}));" }));
  r = await page.evaluate(async () => { const fb = window.__fb; JournalStore.attach(); await new Promise(r => setTimeout(r, 50)); fb.emit({}); await new Promise(r => setTimeout(r, 80));
    return { kept: Object.keys(JournalStore.get().tasks), seeded: fb.writes.filter(w => w[0] === 'journal/tasks').length }; });
  if (r.kept.join() !== 'x' || r.seeded !== 1) bad('H5', 'first read with an empty cloud: local data was not kept and seeded ' + JSON.stringify(r)); else ok();
  await context.close();
}

if (run('H6')) {
  const { context, page } = await open({});
  const r = await page.evaluate(async () => {
    openApp('pd'); await new Promise(r => setTimeout(r, 500));
    const f = document.createElement('iframe'); document.body.appendChild(f);
    window.dispatchEvent(new MessageEvent('message', { data: 'backToHub', source: f.contentWindow, origin: location.origin }));
    await new Promise(r => setTimeout(r, 100)); const stayed = currentApp;
    const own = document.getElementById('frame-pd').contentWindow;
    window.dispatchEvent(new MessageEvent('message', { data: 'backToHub', source: own, origin: location.origin }));
    await new Promise(r => setTimeout(r, 100)); f.remove();
    return { stayed, after: currentApp };
  });
  if (r.stayed !== 'pd') bad('H6', 'a message from a foreign window closed the open app'); else ok();
  if (r.after !== null) bad('H6', 'a message from the app\'s own frame no longer works'); else ok();
  await context.close();
}

if (run('H7')) {
  const { context, page } = await open({});
  const dls = []; page.on('download', d => dls.push(d.suggestedFilename()));
  await page.evaluate(async () => { window.__fb.failOnce = true; JournalStore.attach(); window.__fb.emit({ tasks: {} }); JournalStore.addTask({ t: 'kept on this browser' }); await new Promise(r => setTimeout(r, 50)); });
  await page.evaluate(() => backupJournal(true)); await settle(page, 900);
  if (dls.length !== 1 || !/^dhub-backup-local-/.test(dls[0])) bad('H7', 'Export with the cloud unreadable gave ' + JSON.stringify(dls) + ' (want one dhub-backup-local-… file)'); else ok();
  const toast = await page.evaluate(() => document.getElementById('hub-toast').textContent);
  if (!/downloaded/i.test(toast) || !/browser has/i.test(toast)) bad('H7', 'the Export said nothing about what it wrote: ' + toast); else ok();
  // automatic: a folder that will not take the file must not turn into a download
  dls.length = 0;
  await page.evaluate(async () => { window.__fb.failOnce = false; window.__fb.vals.journal = { tasks: { a: { t: 'x' } } }; localStorage.removeItem('hub_journal_last_backup_at');
    window.lbBackup = { state: () => Promise.resolve('granted'), writeFile: () => Promise.reject(new Error('nodir')), listFiles: () => Promise.resolve([]), removeFile: () => Promise.resolve() };
    backupJournal(false); await new Promise(r => setTimeout(r, 700)); });
  if (dls.length) bad('H7', 'an automatic backup downloaded ' + dls.join()); else ok();
  await context.close();
}

if (run('H8')) {
  const { context, page } = await open({});
  const r = await page.evaluate(async () => {
    openSettings('lab'); await new Promise(r => setTimeout(r, 120));
    const p = document.getElementById('lab-panel'), html = p.innerHTML;
    const unnamed = [...p.querySelectorAll('input[type=checkbox],textarea')].filter(i => !i.getAttribute('aria-label')).length;
    const inline = (html.replace(/<span class="lab-dot" style="[^"]*"><\/span>/g, '').match(/style="[^"]*(font-size:\s*\d+px|#[0-9a-f]{3,6}|border-radius:\s*\d+px)/gi) || []).length;   // the dot is an app's own colour: data
    // a save that fails is said, and the switch goes back
    const first = p.querySelector('.lab-toggle'), id = first.dataset.id, was = labConfig[id] !== false;
    const orig = saveLabConfig; saveLabConfig = () => Promise.reject(new Error('x')); first.checked = !was; onLabToggle(id, !was);
    await new Promise(r => setTimeout(r, 80)); saveLabConfig = orig;
    return { unnamed, inline, back: first.checked === was, said: /could not save/i.test(document.getElementById('hub-toast').textContent) };
  });
  if (r.unnamed) bad('H8', r.unnamed + ' Lab controls have no accessible name'); else ok();
  if (r.inline) bad('H8', r.inline + ' inline hex / px sizes in the Lab panel'); else ok();
  if (!r.back || !r.said) bad('H8', 'a failed Lab save was not put back and said: ' + JSON.stringify(r)); else ok();
  await context.close();
}

if (run('H9')) {
  for (const theme of ['light', 'dark']) {
    const { context, page } = await open({ theme });
    const c = await page.evaluate(() => {
      applyAnnouncement({ enabled: true, text: 'Freezer 2 defrost on Friday' });
      const bar = document.getElementById('hub-announce'), t = document.getElementById('hub-announce-text');
      const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/) || s.match(/color\(srgb ([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(parseFloat); return p.length >= 3 && p[0] <= 1 && p[1] <= 1 && s.startsWith('color') ? p.slice(0, 3).map(v => v * 255) : p.slice(0, 3); };
      const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const fg = parse(getComputedStyle(t).color), bg = parse(getComputedStyle(bar).backgroundColor);
      if (!fg || !bg) return { err: getComputedStyle(bar).backgroundColor };
      const a = lum(fg), b = lum(bg); return { ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    });
    if (c.err || c.ratio < 4.5) bad('H9', `announcement bar ${theme}: ${c.err ? 'colour not read: ' + c.err : c.ratio.toFixed(2) + ':1'}`); else ok();
    await context.close();
  }
}

if (run('H10')) {
  const scan = () => {
    const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,\/]+/).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
      const c = s.match(/color\(srgb ([^)]+)\)/); if (c) { const p = c[1].split(/[ \/]+/).map(parseFloat); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
    const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const accent = parse(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ? (() => { const d = document.createElement('i'); d.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent'); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })() : 'rgb(0,0,0)');
    const bgOf = el => { const stack = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } }
      let b = parse(getComputedStyle(document.body).backgroundColor); if (!b || b[3] < 1) b = [255, 255, 255, 1]; for (let i = stack.length - 1; i >= 0; i--) b = over(stack[i], b); return b; };
    const out = new Map(); const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
    while ((t = tw.nextNode())) {
      if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || el.closest('script,style,svg,#hub-intro,[inert],.as-root,.ctx')) continue;
      let hid = false; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || +c.opacity === 0 || c.visibility === 'hidden') { hid = true; break; } } if (hid) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el), fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el), f = over(fg, bg);
      const a = lum(f), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
      const onAccent = accent && Math.abs(bg[0] - accent[0]) < 3 && Math.abs(bg[1] - accent[1]) < 3 && Math.abs(bg[2] - accent[2]) < 3;
      const need = onAccent ? 3 : (large ? 3 : 4.5);
      if (ratio < need) { const k = (el.id ? '#' + el.id : el.tagName.toLowerCase()) + '.' + String(el.className).split(' ').slice(0, 2).join('.'); if (!out.has(k)) out.set(k, k + ' ' + ratio.toFixed(2) + ':1 "' + t.nodeValue.trim().slice(0, 24) + '"'); }
    }
    return [...out.values()];
  };
  for (const theme of ['light', 'dark']) {
    const { context, page } = await open({ theme });
    const all = new Set(); const add = async () => { for (const x of await page.evaluate(scan)) all.add(x); };
    for (const L of ['analysis', 'archive', 'cells', 'more']) { await page.evaluate(l => wsGo(l), L); await settle(page, 450); await add(); }
    await page.evaluate(() => openSettings('appearance')); await settle(page, 300); await add();
    for (const t of ['data', 'lab', 'about']) { await page.evaluate(x => setTab(x), t); await settle(page, 300); await add(); }
    await page.evaluate(() => closeSettings());
    await page.evaluate(() => window.hubSpot.open()); await page.keyboard.type('echo'); await settle(page, 300); await add(); await page.keyboard.press('Escape');
    await page.evaluate(() => { applyAnnouncement({ enabled: true, text: 'Notice' }); hubToast('toast'); }); await settle(page, 300); await add();
    if (all.size) bad('H10', theme + ': ' + [...all].join(' | ')); else ok();
    await context.close();
    const v = await open({ theme, mode: 'visitor' }); const vs = await v.page.evaluate(scan);
    if (vs.length) bad('H10', 'visitor ' + theme + ': ' + vs.join(' | ')); else ok();
    await v.context.close();
  }
}

if (run('H11')) {
  const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
  const init = `localStorage.setItem('hub_journal_cache', JSON.stringify({tasks:{a:{t:${JSON.stringify(X)}}},incubator:{c1:{line:${JSON.stringify(X)},baseLine:${JSON.stringify(X)},passage:5,seeded:1,intervalDays:3,issue:{note:${JSON.stringify(X)}}}},antibodies:{a:{name:${JSON.stringify(X)}}},primers:{},plasmids:{},cellArchive:[{id:'z',name:${JSON.stringify(X)}}]}));`;
  const { context, page } = await open({ init });
  const r = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    for (const l of ['planner', 'cells', 'archive', 'analysis', 'more']) { wsGo(l); await w(250); }
    applyAnnouncement({ enabled: true, text: '<img src=x onerror="window.__xss=(window.__xss||0)+1">' });
    hubToast('<img src=x onerror="window.__xss=(window.__xss||0)+1">');
    hubAsk('<b>t</b>', '<img src=x onerror="window.__xss=(window.__xss||0)+1">', {}, () => {});
    window.hubSpot.open(); const i = document.getElementById('hub-spot-in'); i.value = '<img'; i.dispatchEvent(new Event('input', { bubbles: true }));
    hubDlgClose(false); window.hubSpot.close(); _navPop = 'note'; renderNavChips(); await w(200);
    return { xss: window.__xss || 0, imgs: document.querySelectorAll('#hub-suites img,#nav-chips img,#hub-announce img,#hub-toast img,#hub-dlg img,#hub-spot-res img').length };
  });
  if (r.xss || r.imgs) bad('H11', 'stored or typed markup was run or became an element: ' + JSON.stringify(r)); else ok();
  await context.close();
}

if (run('H12')) {
  {
    const { context, page } = await open({ mode: 'visitor', init: "localStorage.setItem('hub_unlocked', JSON.stringify(['lumina','echo']));" });
    const r = await page.evaluate(() => ({
      held: Array.from(_unlockedApps), stored: localStorage.getItem('hub_unlocked'), epoch: localStorage.getItem('hub_access_epoch'), want: String(ACCESS_EPOCH),
      cards: document.querySelectorAll('#hub-suites .card').length,
      note: (document.querySelector('#hub-unlock .unlock-note') || {}).textContent || '', mail: (document.querySelector('#hub-unlock .unlock-note a') || {}).href || '',
      old: ['acoustic', 'illuminate', 'hillslope', 'degrade'].filter(w => tryUnlock(w)),
    }));
    if (r.held.length || r.stored !== null || r.cards) bad('H12', 'an unlock stored before the reset still opened apps: ' + JSON.stringify(r));
    else if (r.epoch !== r.want) bad('H12', 'the visitor was not moved to the current epoch: ' + JSON.stringify(r));
    else if (r.old.length) bad('H12', 'a retired code word still unlocks: ' + r.old.join(', '));
    else if (!/Jon/.test(r.note) || !/Slack/.test(r.note) || !/^mailto:/.test(r.mail)) bad('H12', 'the discover box does not say who to ask for a code: ' + JSON.stringify(r.note));
    else ok();
    await context.close();
  }
  {
    const { context, page } = await open({ mode: 'visitor' });
    await page.evaluate(() => { tryUnlock(APP_UNLOCK_WORDS.lumina); });
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
    await page.waitForFunction(() => typeof _unlockedApps !== 'undefined' && _unlockedApps.has('lumina'), null, { timeout: 6000 }).catch(() => {});   // a slow runner reads the store later
    const r = await page.evaluate(() => ({ has: _unlockedApps.has('lumina'), others: Array.from(_unlockedApps).filter(x => x !== 'lumina') }));
    r.has && !r.others.length ? ok() : bad('H12', 'an unlock made under the current epoch did not survive a reload: ' + JSON.stringify(r));
    await context.close();
  }
}

await browser.close();
for (const f of findings) console.log(f);
console.log(`\n${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
