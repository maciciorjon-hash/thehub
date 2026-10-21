// Shell invariants — things about the Hub's own chrome that a person sees on every visit.
//
//   S1  fixed order       the Data Analysis landing lists its apps in the declared order, however
//                         recently or often each was opened (it used to lead with the last opened)
//   S2  clean cards       no app card carries a tag line ("HiBiT · FP · DC50"); each says what it is in one
//                         sentence, and no description is cut on a landing at 1440px
//   S3  smooth changes    one landing to another cross-fades (a copy of the old one fades out, then goes); a data write
//                         replaces the live band only, not the cards; a Cells tab switch keeps the tab bar's buttons
//                         and fades the old frame out under the new one instead of hiding it in one frame
//   S4  preload           while the intro plays the likely apps are loaded one after another — for a visitor, never
//                         an app they cannot open; for the admin, Archive, Echo Dose Response, Hit Finder, Lumina, Tempo
//   S5  no pinned apps    the rail carries the sections and nothing else: opening Echo or Blueprint adds no entry to it
//                         (it used to keep the last three opened and let you pin four), no "Pin to the rail" is offered, and an
//                         open app lights the landing it belongs to
//   S6  the rail's order      Journal, Planner, Experiments, Designer, then the landings; Experiments has its own entry and icon, an old
//                         "exps" link lights it, and Labbook telling the Hub it is in Experiments lights it
//   S7  opaque links      a public app's link is an opaque slug, never its name: opening Echo writes the slug to the URL, the
//                         slug opens it for anyone, and #echo opens only for the admin or a visitor who typed Echo's word
//
//   node tools/hub_invariants.mjs [--shell=PATH] [--only=S1]      exit 1 on any finding
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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.route(/^https?:/, r => r.abort());
await page.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('hub_theme', 'light'); localStorage.setItem('hub_recent', JSON.stringify(['beacon', 'spectra', 'tempo'])); } catch (e) {} });
await page.goto('file://' + SHELL, { waitUntil: 'load' });
await page.waitForTimeout(800);

if (run('S1')) {
  const r = await page.evaluate(async () => {
    isAdmin = true;
    const want = LANDINGS.analysis.apps.filter(a => document.querySelector('#app-grid .card[data-app-id="' + a + '"]'));
    const seen = [];
    // open in reverse, so a recency sort would put the last ones first
    for (const id of want.slice().reverse()) {
      try { openApp(id); } catch (e) {}
      await new Promise(r => setTimeout(r, 120));
      try { backToHub(); } catch (e) {}
      await new Promise(r => setTimeout(r, 60));
    }
    renderLanding('analysis');
    document.querySelectorAll('#hub-suites .ld-card[data-app-id]').forEach(c => seen.push(c.dataset.appId));
    return { want, seen, head: LANDINGS.analysis.apps.slice(0, 4) };
  });
  if (r.head.join() !== 'echo,hitfinder,lumina,tempo') bad('S1', 'declared order starts ' + r.head.join(', ') + ' (want echo, hitfinder, lumina, tempo)');
  else ok();
  if (r.seen.join() !== r.want.join()) bad('S1', 'landing shows ' + r.seen.join(', ') + ' — declared ' + r.want.join(', '));
  else ok();
}

if (run('S2')) {
  const r = await page.evaluate(async () => {
    isAdmin = true;
    const out = { foot: [], long: [], cut: [] };
    document.querySelectorAll('#app-grid .card').forEach(c => {
      const id = c.dataset.appId;
      if (c.querySelector('.card-foot')) out.foot.push(id);
      const d = (c.querySelector('.card-desc') || {}).textContent || '';
      if (d.length > 95) out.long.push(id + ' (' + d.length + ')');
    });
    for (const L of ['analysis', 'more', 'archive', 'cells']) {
      try { renderLanding(L); } catch (e) {}
      await new Promise(r => setTimeout(r, 50));
      document.querySelectorAll('#hub-suites .ld-desc').forEach(d => {
        if (d.scrollHeight > d.clientHeight + 1) out.cut.push(L + ': ' + d.textContent.slice(0, 40));
      });
      if (document.querySelector('#hub-suites .ld-foot')) out.foot.push('landing ' + L);
    }
    return out;
  });
  if (r.foot.length) bad('S2', 'cards still carry a tag line: ' + r.foot.join(', ')); else ok();
  if (r.long.length) bad('S2', 'descriptions over one sentence: ' + r.long.join(', ')); else ok();
  if (r.cut.length) bad('S2', 'descriptions cut by the clamp at 1440px: ' + r.cut.join(' | ')); else ok();
}

if (run('S3')) {
  const r = await page.evaluate(async () => {
    isAdmin = true; wsGo('analysis'); await new Promise(r => setTimeout(r, 400));
    const card = document.querySelector('#hub-suites .ld-card');
    wsGo('more'); await new Promise(r => setTimeout(r, 40));
    const g = document.getElementById('ld-ghost'), op = g ? +getComputedStyle(g).opacity : null;
    await new Promise(r => setTimeout(r, 320));
    const gone = !document.getElementById('ld-ghost');
    // a data write: the band changes, the cards stay the same elements
    wsGo('archive'); await new Promise(r => setTimeout(r, 300));
    const c1 = document.querySelector('#hub-suites .ld-card'); try { _homeLive(); } catch (e) {}
    const same = document.querySelector('#hub-suites .ld-card') === c1;
    // Cells
    let cells = null;
    try {
      openCells('cryo'); await new Promise(r => setTimeout(r, 400));
      const tabs = [...document.querySelectorAll('#cells-tabs .cells-tab')]; const t0 = tabs[0];
      const other = tabs.find(b => b.dataset.appId !== 'cryo');
      if (other) { openCells(other.dataset.appId); await new Promise(r => setTimeout(r, 40));
        const fOld = document.getElementById('frame-cryo');
        cells = { kept: document.querySelector('#cells-tabs .cells-tab') === t0, oldShown: fOld && fOld.style.display !== 'none', fading: fOld && fOld.classList.contains('tab-out') };
        await new Promise(r => setTimeout(r, 400)); cells.oldHidden = fOld && fOld.style.display === 'none'; }
      backToHub({ plain: true });
    } catch (e) { cells = { err: e.message }; }
    return { ghost: !!g, op, gone, same, cells };
  });
  if (!r.ghost || !(r.op < 1)) bad('S3', 'no cross-fade between landings: ' + JSON.stringify(r)); else ok();
  if (!r.gone) bad('S3', 'the old landing copy was left on the page'); else ok();
  if (!r.same) bad('S3', 'a data write re-rendered the landing cards'); else ok();
  if (r.cells && (r.cells.err || !r.cells.kept || !r.cells.oldShown || !r.cells.fading || !r.cells.oldHidden)) bad('S3', 'Cells tab switch: ' + JSON.stringify(r.cells)); else ok();
}

if (run('S4')) {
  const r = await page.evaluate(async () => {
    window.__forcePreload = 1;
    isAdmin = false; try { _unlockedApps.clear(); } catch (e) {} _preloadDone = {}; _preloadApps();
    const vis = (window._preloadList || []).slice();
    isAdmin = true; _preloadDone = {}; _preloadApps(); const adm = (window._preloadList || []).slice();
    const t0 = performance.now();
    while (adm.some(id => !loaded[id]) && performance.now() - t0 < 20000) await new Promise(r => setTimeout(r, 100));
    // Hit Finder and Tempo are Jon's alone: a visitor who has typed every code (suite words included) still cannot open them
    isAdmin = false; _unlockedApps.clear(); Object.keys(APP_UNLOCK_WORDS).forEach(id => _unlockedApps.add(id));
    Object.values(SUITE_UNLOCK_WORDS).forEach(su => su.apps.forEach(id => _unlockedApps.add(id)));
    const adminLeak = ['hitfinder', 'tempo'].filter(id => _isAppAccessible(id));
    _unlockedApps.clear(); isAdmin = true;
    return { adminLeak, vis, adm, loaded: adm.filter(id => loaded[id]), five: ['protocols', 'echo', 'hitfinder', 'lumina', 'tempo'].filter(id => loaded[id]), admOnly: Object.keys(ADMIN_ONLY_APPS) };
  });
  if (r.adminLeak.length) bad('S4', 'a visitor with every code can open ' + r.adminLeak.join(', ')); else ok();
  if (r.vis.some(id => r.admOnly.includes(id))) bad('S4', 'a visitor preloads an admin app: ' + r.vis.join(', ')); else ok();
  if (r.five.length !== 5) bad('S4', 'after the admin preload only these are loaded: ' + r.five.join(', ')); else ok();
  if (r.loaded.length !== r.adm.length) bad('S4', 'not every preloaded app finished loading: ' + r.loaded.join(', ') + ' of ' + r.adm.join(', ')); else ok();
}

if (run('S5')) {
  const r = await page.evaluate(async () => {
    isAdmin = true; try { backToHub({ plain: true }); } catch (e) {}
    const rest = () => new Promise(r => setTimeout(r, 450));   // backToHub finishes its exit after a moment; an app opened inside it is cleared
    await rest();
    // an old pin list left on the device is swept away at start-up, and opening apps never writes one again
    try { localStorage.setItem('hub_rail_apps', JSON.stringify({ pins: ['echo'], recent: ['pd'] })); _wsRestoreRail(); } catch (e) {}
    const lit = id => { try { openApp(id); } catch (e) {} return new Promise(res => setTimeout(() => { renderRail(); res((document.querySelector('#ws-rail .ws-item.on') || {}).dataset ? document.querySelector('#ws-rail .ws-item.on').dataset.ws : null); }, 150)); };
    const echoLit = await lit('echo'); try { backToHub({ plain: true }); } catch (e) {}
    await rest();
    const pdLit = await lit('pd'); try { backToHub({ plain: true }); } catch (e) {}
    await rest();
    renderRail();
    const items = [...document.querySelectorAll('#ws-rail .ws-item[data-ws]')].map(b => b.dataset.ws).filter(id => id !== undefined && !/^(cloud|fold)$/.test(id));
    const nav = WS_NAV.filter(n => !n.sep).map(n => n.id);
    const card = document.querySelector('#app-grid .card[data-app-id="echo"]');
    if (card) card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 }));
    await new Promise(r => setTimeout(r, 60));
    const menu = (document.querySelector('.ctx') || {}).textContent || ''; if (document.querySelector('.ctx')) document.querySelector('.ctx').remove();
    return { items: items.filter(id => nav.includes(id) || /^app:/.test(id)), nav, apps: document.querySelectorAll('#ws-rail .ws-app').length, stored: localStorage.getItem('hub_rail_apps'), echoLit, pdLit, pin: /Pin to the rail|Unpin from the rail/.test(menu), hasPinFn: typeof railPin };
  });
  if (r.apps || r.items.join() !== r.nav.join()) bad('S5', 'the rail carries more than the sections: ' + r.items.join(', ') + ' (want ' + r.nav.join(', ') + ')'); else ok();
  if (r.stored !== null && r.stored !== undefined) bad('S5', 'hub_rail_apps is still kept or rewritten: ' + r.stored); else ok();
  if (r.echoLit !== 'analysis' || r.pdLit !== 'more') bad('S5', 'an open app should light its landing: Echo lit ' + r.echoLit + ' (want analysis), Blueprint lit ' + r.pdLit + ' (want more)'); else ok();
  if (r.pin || r.hasPinFn !== 'undefined') bad('S5', 'pinning to the rail is still offered (railPin is ' + r.hasPinFn + ')'); else ok();
}

if (run('S6')) {
  const r = await page.evaluate(async () => {
    isAdmin = true; document.body.classList.add('ws'); renderRail();
    const rail = () => [...document.querySelectorAll('#ws-rail .ws-item[data-ws]')].map(b => b.dataset.ws);
    const lit = () => (document.querySelector('#ws-rail .ws-item.on') || {}).dataset ? document.querySelector('#ws-rail .ws-item.on').dataset.ws : null;
    const out = { order: rail(), nav: WS_NAV.filter(n => !n.sep).map(n => n.id), tabs: WS_TABS.slice(), icon: !!(WS_ICONS && WS_ICONS.experiments && /<svg/.test(WS_ICONS.experiments)) };
    wsGo('exps'); await new Promise(r => setTimeout(r, 400));
    out.afterExps = lit(); out.section = _wsSection;
    wsGo('planner'); await new Promise(r => setTimeout(r, 400));
    out.afterPlanner = lit();
    // Labbook says which workspace it is in (opening an experiment from Today moves it to Experiments)
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'lb:ws', ws: 'experiments' }, origin: location.origin }));
    await new Promise(r => setTimeout(r, 120)); out.afterTold = lit();
    try { backToHub({ plain: true }); } catch (e) {}
    return out;
  });
  const want = 'notebook,planner,experiments,designer,analysis,archive,cells,more';
  if (r.order.join() !== want || r.nav.join() !== want) bad('S6', 'the rail reads ' + r.order.join(', ') + ' (want ' + want + ')'); else ok();
  if (r.tabs.join() !== 'notebook,planner,experiments,analysis,archive,cells') bad('S6', 'the phone bar reads ' + r.tabs.join(', ')); else ok();
  if (!r.icon) bad('S6', 'Experiments has no rail icon'); else ok();
  if (r.afterExps !== 'experiments' || r.section !== 'experiments') bad('S6', 'the old Experiments link lit ' + r.afterExps + ' (section ' + r.section + '), expected Experiments'); else ok();
  if (r.afterPlanner !== 'planner') bad('S6', 'Planner lit ' + r.afterPlanner); else ok();
  if (r.afterTold !== 'experiments') bad('S6', 'Labbook said it is in Experiments and the rail lit ' + r.afterTold); else ok();
}

if (run('S7')) {
  const r = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const reset = async () => { try { backToHub({ plain: true }); } catch (e) {} await wait(450); sessionStorage.removeItem('hub_own_hash'); };
    const tryHash = async h => { await reset(); history.replaceState({}, '', location.pathname + '#' + h); _openFromHash(); await wait(400); return { app: currentApp, hash: location.hash }; };
    const out = {};
    _authResolved = true; isAdmin = false; _unlockedApps.clear();
    out.slugOk = APP_SLUG.echo && /^[0-9a-f]{12}$/.test(APP_SLUG.echo) && new Set(Object.values(APP_SLUG)).size === Object.keys(APP_SLUG).length;
    out.name = await tryHash('echo');
    out.slug = await tryHash(APP_SLUG.echo);
    out.urlInApp = out.slug.hash;
    _unlockedApps.add('echo');
    out.unlocked = await tryHash('echo');
    _unlockedApps.clear(); isAdmin = true;
    out.admin = await tryHash('echo');
    out.copy = _hashFor('echo');
    await reset();
    return out;
  });
  if (!r.slugOk) bad('S7', 'the public apps need distinct 12-hex slugs'); else ok();
  if (r.name.app === 'echo') bad('S7', '#echo opened Echo for a visitor who never typed the word'); else ok();
  if (r.name.hash) bad('S7', 'the refused #echo was left in the URL: ' + r.name.hash); else ok();
  if (r.slug.app !== 'echo') bad('S7', 'the slug link did not open Echo: ' + JSON.stringify(r.slug)); else ok();
  if (r.urlInApp !== '#' + r.copy || r.urlInApp === '#echo') bad('S7', 'inside Echo the URL reads ' + r.urlInApp + ', not its slug'); else ok();
  if (r.unlocked.app !== 'echo') bad('S7', '#echo did not open Echo for a visitor who typed its word'); else ok();
  if (r.admin.app !== 'echo') bad('S7', '#echo did not open Echo for the admin'); else ok();
}

for (const e of errs) bad('page', e);
await browser.close();
for (const f of findings) console.log(f);
console.log(`\n${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
