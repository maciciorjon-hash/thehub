// Shell invariants — things about the Hub's own chrome that a person sees on every visit.
//
//   S1  fixed order       the Data Analysis landing lists its apps in the declared order, however
//                         recently or often each was opened (it used to lead with the last opened)
//   S2  clean cards       no app card carries a tag line ("HiBiT · FP · DC50"); each says what it is in one
//                         sentence, and no description is cut on a landing at 1440px
//   S3  smooth changes    one landing to another is a cut with a short arrival of the cards, never a copy of the old one fading
//                         over the new (two grids at half strength read as a smear); a data write
//                         replaces the live band only, not the cards; a Cells tab switch keeps the tab bar's buttons
//                         and fades the old frame out under the new one instead of hiding it in one frame
//   S4  preload           while the intro plays the likely apps are loaded one after another — for a visitor, never
//                         an app they cannot open; for the admin, Archive, Echo Dose Response, Hit Finder, Lumina, Tempo
//   S5  no pinned apps    the rail carries the sections and nothing else: opening Echo or Blueprint adds no entry to it
//                         (it used to keep the last three opened and let you pin four), no "Pin to the rail" is offered, and an
//                         open app lights the landing it belongs to
//   S6  the rail's order      Journal, Planner, Experiments, Designer, then the landings; Experiments has its own entry and icon, an old
//                         "exps" link lights it, and Labbook telling the Hub it is in Experiments lights it
//   S8  lands on Today     an admin opening dHUB starts on Labbook's Today, whatever the last session left (Week, Designer, Experiments)
//   S7  opaque links      a public app's link is an opaque slug, never its name: opening Echo writes the slug to the URL, the
//                         slug opens it for anyone, and #echo opens only for the admin or a visitor who typed Echo's word
//
//   S9  navigation is quick  a rail click between sections changes the screen at full strength within a frame or two and has
//                         settled inside 200 ms: no crossfade copy, no section animation longer than --dur-1 + stagger
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
    const arriving = document.getElementById('hub-suites').classList.contains('ld-enter');
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
    return { ghost: !!g, op, arriving, gone, same, cells };
  });
  if (r.ghost) bad('S3', 'a copy of the old landing was laid over the new one: ' + JSON.stringify(r)); else ok();
  if (!r.arriving) bad('S3', 'the new landing did not arrive (no .ld-enter): ' + JSON.stringify(r)); else ok();
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
    // Tempo is Jon's alone: a visitor who has typed every code still cannot open it. Hit Finder opens only with its own
    // suite word (tryUnlock), never with the Data Analysis word or any per-app word.
    isAdmin = false; _unlockedApps.clear(); Object.keys(APP_UNLOCK_WORDS).forEach(id => _unlockedApps.add(id));
    tryUnlock(SUITE_UNLOCK_WORDS.analysis.word);
    const adminLeak = ['hitfinder', 'tempo'].filter(id => _isAppAccessible(id));
    _unlockedApps.clear(); tryUnlock(SUITE_UNLOCK_WORDS.hitfinder.word);
    const hfByCode = _isAppAccessible('hitfinder') && !_isAppAccessible('tempo');
    _unlockedApps.clear(); isAdmin = true;
    return { adminLeak, hfByCode, vis, adm, loaded: adm.filter(id => loaded[id]), five: ['protocols', 'echo', 'hitfinder', 'lumina', 'tempo'].filter(id => loaded[id]), admOnly: Object.keys(ADMIN_ONLY_APPS) };
  });
  if (r.adminLeak.length) bad('S4', 'a visitor with every public code can open ' + r.adminLeak.join(', ')); else ok();
  if (!r.hfByCode) bad('S4', "Hit Finder's own code does not open it (or opens Tempo)"); else ok();
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

if (run('S8')) {
  // Its own contexts: the landing is decided by what the previous session saved (lb_last), so each starts from a different one.
  for (const saved of [null, { ws: 'planner', planner: { node: { kind: 'week' } } }, { ws: 'designer' }, { ws: 'experiments', experiments: { node: { kind: 'exps' } } }]) {
    const c8 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p8 = await c8.newPage();
    await p8.route(/^https?:/, r => r.abort());
    await p8.addInitScript(s => { localStorage.setItem('lb_tour_done', '1'); if (s) localStorage.setItem('lb_last', JSON.stringify(s)); }, saved);
    await p8.goto('file://' + SHELL, { waitUntil: 'load' });
    await p8.waitForTimeout(800);
    await p8.evaluate(() => { isAdmin = true; renderSuites(); });
    await p8.waitForTimeout(3500);
    const r = await p8.evaluate(() => { const w = (document.getElementById('frame-labbook') || {}).contentWindow; return { node: w && w.SEL && w.SEL.node && w.SEL.node.kind, page: w && w.SEL && w.SEL.page, rail: (document.querySelector('#ws-rail .ws-item.on') || { dataset: {} }).dataset.ws }; });
    if (r.node !== 'journal' || r.page || r.rail !== 'planner') bad('S8', 'dHUB opened on ' + JSON.stringify(r) + ' after ' + JSON.stringify(saved) + ' (want the Planner on Today)'); else ok();
    await c8.close();
  }
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

if (run('S9')) {
  const r = await page.evaluate(async () => {
    isAdmin = true; document.body.classList.add('ws'); wsGo('planner'); await new Promise(r => setTimeout(r, 1200));
    const out = { ghosts: 0, longest: 0, dips: [] };
    const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } });
    const rule = n => { const k = css.find(x => x.selectorText === n); return k ? k.cssText : null; };
    out.cardIn = rule('.ld-enter > *'); out.tabIn = rule('.tab-in'); out.tabOut = rule('.tab-out');
    const lb = document.getElementById('frame-labbook').contentDocument;
    for (const id of ['experiments', 'planner', 'notebook', 'designer', 'experiments']) {
      wsGo(id);
      const t0 = performance.now();
      await new Promise(r => setTimeout(r, 30));
      if (lb.querySelector('.lb-ghost') || document.getElementById('ld-ghost')) out.ghosts++;
      const ed = lb.getElementById('pane-ed');
      const kid = ed && ed.firstElementChild, op = kid ? +getComputedStyle(kid).opacity : 1;
      if (op < 0.4) out.dips.push(id + ':' + op.toFixed(2));
      await new Promise(r => setTimeout(r, 260));
      const still = lb.querySelector('.pane-ed.screen-in, .tab-in');
      if (still) out.longest = Math.max(out.longest, performance.now() - t0);
    }
    return out;
  });
  if (r.ghosts) bad('S9', 'a section change laid a copy of the old screen over the new one'); else ok();
  if (r.dips.length) bad('S9', 'the new screen started nearly transparent (unreadable for the first frames): ' + r.dips.join(' ')); else ok();
  if (r.longest) bad('S9', 'a section animation was still running ' + Math.round(r.longest) + ' ms after the click'); else ok();
  if (!/var\(--dur-1\)/.test(r.cardIn || '')) bad('S9', 'landing cards animate with ' + r.cardIn + ', not one --dur-1'); else ok();
  if (!/var\(--dur-1\)/.test(r.tabIn || '')) bad('S9', 'a tab body animates with ' + r.tabIn + ', not one --dur-1'); else ok();
}

for (const e of errs) bad('page', e);
await browser.close();
for (const f of findings) console.log(f);
console.log(`\n${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
