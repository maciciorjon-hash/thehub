// The Labbook phone app (mobile/, built by `embed.py --profile=labbook-app`) — what makes it a bench companion rather
// than a web page: it opens with no connection at all, it carries the cells, and nothing written at the bench is lost.
//
//   PA1  the door          the tab bar has Cells; it opens a view with Cultures · Lines · Freezer, and each tab
//                          loads its app with no page error
//   PA2  self-contained    with every request that is not the app itself refused, the app starts, loads its
//                          typeface, and Freezer has SheetJS — nothing it needs is fetched
//   PA3  one store         planted cultures show in Incubator, on Home and as the Cells badge; the badge counts
//                          the ones that are overdue
//   PA4  frames stay       leaving Cells and coming back does not reload a frame (a reload would leave the old
//                          copy's listeners on the store)
//   PA5  nothing is lost   a culture edited with no signal is still there after the app is closed and reopened,
//                          even though the cloud snapshot that arrives first still holds the old one; it is sent
//                          once the server confirms, and not before the first cloud read has landed
//   PA6  no seeding        the host never says it is admin, and a Freezer opened with nothing stored holds no vials
//                          (it would otherwise seed a demo inventory and push it over the real freezer)
//   PA7  the layout        at 390x780 and 375x640, light and dark: the frame fills the area under the Cells tabs,
//                          stops above the tab bar, and the five tabs are all there
//   PA8  native sign-in    the installed app offers email & password only (Google cannot finish in a WKWebView)
//   PA9  the web app       the installable PWA (built here into a temp folder) is as self-contained: after ONE visit it
//                          reloads with the network gone and still has its SDK, its typeface and the Cells tab; its
//                          service worker precaches every file it loads, and it still offers Google sign-in
//
//   node tools/phone_app_invariants.mjs [--dir=mobile/www] [--only=PA5]      exit 1 on any finding
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DIR = path.resolve(ROOT, arg('dir', 'mobile/www'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };

if (!fs.existsSync(path.join(DIR, 'index.html'))) { console.error('no build at ' + DIR + ' — run: python3 embed.py --profile=labbook-app'); process.exit(2); }

// A static server for the bundle, on a free port: the page must come from http://127.0.0.1 so IndexedDB and storage work.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/index.html`;

const NOW = Date.now(), D = 86400000;
const CULTURES = {
  a1: { line: 'HCT116', baseLine: 'HCT116', passage: 12, seeded: NOW - 4 * D, intervalDays: 3, passageLimit: 35, vessel: 'T75', mycoLast: NOW - 5 * D, history: [] },   // overdue
  a2: { line: 'HEK293T', baseLine: 'HEK293T', passage: 8, seeded: NOW - 1 * D, intervalDays: 3, passageLimit: 35, vessel: 'T25', mycoLast: NOW - 2 * D, history: [] },  // fine
  a3: { line: 'MV4-11', baseLine: 'MV4-11', passage: 20, seeded: NOW - 2 * D, intervalDays: 2, passageLimit: 30, vessel: 'T25', mycoLast: NOW - 3 * D, history: [] },   // due today
};

const browser = await chromium.launch();
async function open({ w = 390, h = 780, theme = 'light', cultures = CULTURES } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/*', r => {
    const u = r.request().url();
    if (/^https?:\/\/127\.0\.0\.1/.test(u) || /^(data|blob|about):/.test(u)) return r.continue();
    external.push(u); return r.abort();
  });
  await page.addInitScript(([t, c]) => {
    try {
      localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_lean', '1'); localStorage.setItem('lb_tour_done', '1');
      localStorage.setItem('hub_theme', t);
      if (c && !localStorage.getItem('hub_journal_cache')) localStorage.setItem('hub_journal_cache', JSON.stringify({ tasks: {}, antibodies: {}, primers: {}, plasmids: {}, incubator: c }));
    } catch (e) {}
  }, [theme, cultures]);
  await page.goto(URL0); await page.waitForSelector('#lb-tabs', { timeout: 15000 });
  await page.evaluate(() => { const o = document.getElementById('lb-dlg-ok'); if (o) o.click(); });
  return { ctx, page, errors, external };
}
const frameText = (page, id) => page.evaluate(i => { const f = document.getElementById('cells-f-' + i); try { return f ? (f.contentDocument.body.innerText || '') : null; } catch (e) { return null; } }, id);
async function waitFrame(page, id, re) {
  for (let i = 0; i < 40; i++) { const t = await frameText(page, id); if (t && re.test(t)) return t; await page.waitForTimeout(150); }
  return await frameText(page, id);
}
const TABS = [['incubator', /Incubator/], ['cellarchive', /Cell Archive/], ['cryo', /Iceberg|racks|−80/]];

// ── PA1 + PA2 + PA3 + PA4: one session, offline from the first byte ──────────────────────────────
if (['PA1', 'PA2', 'PA3', 'PA4', 'PA6', 'PA8'].some(run)) {
  const { ctx, page, errors, external } = await open();
  try {
    const tab = await page.$('#lb-tabs [data-tab="cells"]');
    if (!tab) bad('PA1', 'the tab bar has no Cells tab');
    else {
      await tab.click();
      const seg = await page.$$eval('.cells-tabs [data-ct]', bs => bs.map(b => b.getAttribute('data-ct')));
      if (seg.join() !== 'incubator,cellarchive,cryo') bad('PA1', 'the Cells view should offer Cultures · Lines · Freezer, found ' + seg.join());
      for (const [id, re] of TABS) {
        await page.click(`.cells-tabs [data-ct="${id}"]`);
        const t = await waitFrame(page, id, re);
        if (!t || !re.test(t)) bad('PA1', `the ${id} tab did not load its app (got ${JSON.stringify((t || '').slice(0, 60))})`); else ok();
      }
      if (errors.length) bad('PA1', 'page errors opening the three tabs: ' + errors.slice(0, 3).join(' | ')); else ok();

      // PA2
      if (run('PA2')) {
        const real = external.filter(u => !/apis\.google\.com\/js\/api\.js/.test(u));
        if (real.length) bad('PA2', 'the app asked the network for ' + [...new Set(real)].slice(0, 4).join(', ')); else ok();
        const info = await page.evaluate(async () => { await document.fonts.ready; return { plex: [...document.fonts].some(f => /IBM Plex Sans/.test(f.family) && f.status === 'loaded'),
          xlsx: (() => { try { return typeof document.getElementById('cells-f-cryo').contentWindow.XLSX; } catch (e) { return 'x'; } })(), fb: typeof firebase }; });
        if (!info.plex) bad('PA2', 'IBM Plex did not load from the bundle'); else ok();
        if (info.xlsx !== 'object') bad('PA2', 'Freezer has no SheetJS offline (typeof XLSX = ' + info.xlsx + ')'); else ok();
        if (info.fb !== 'object') bad('PA2', 'the Firebase SDK is not in the bundle'); else ok();
      }
      // PA3
      if (run('PA3')) {
        await page.click('.cells-tabs [data-ct="incubator"]');
        const t = await waitFrame(page, 'incubator', /HCT116/);
        const missing = ['HCT116', 'HEK293T', 'MV4-11'].filter(n => !(t || '').includes(n));
        if (missing.length) bad('PA3', 'Incubator does not list ' + missing.join(', ')); else ok();
        const badge = await page.$eval('.cells-badge', e => e.textContent).catch(() => null);
        const expected = await page.evaluate(() => lbCultures().filter(x => x.worst === 'warn').length);
        if (!(expected >= 1)) bad('PA3', 'the planted overdue culture is not "warn" to the alert rules'); else ok();
        if (String(badge) !== String(expected)) bad('PA3', `Cultures badge says ${badge}, the alert rules say ${expected}`); else ok();
        const tabBadge = await page.$eval('#lb-tabs [data-tab="cells"] .lbt-badge', e => e.textContent).catch(() => null);
        if (String(tabBadge) !== String(expected)) bad('PA3', `Cells tab badge says ${tabBadge}, the alert rules say ${expected}`); else ok();
        await page.evaluate(() => selectNode('home')); await page.waitForTimeout(300);
        const home = await page.evaluate(() => document.getElementById('pane-ed').innerText);
        if (!/HCT116/.test(home)) bad('PA3', 'Home does not show the cultures that need attention'); else ok();
      }
      // PA4
      if (run('PA4')) {
        await page.evaluate(() => { selectNode('cells'); });
        await page.waitForTimeout(300);
        await page.evaluate(() => { document.getElementById('cells-f-incubator').contentWindow.__mark = 'alive'; });
        await page.evaluate(() => selectNode('home')); await page.waitForTimeout(200);
        const hidden = await page.$eval('#cells-layer', e => getComputedStyle(e).display);
        if (hidden !== 'none') bad('PA4', 'the frames stay on screen after leaving Cells (layer display = ' + hidden + ')'); else ok();
        await page.evaluate(() => selectNode('cells')); await page.waitForTimeout(300);
        const mark = await page.evaluate(() => document.getElementById('cells-f-incubator').contentWindow.__mark);
        if (mark !== 'alive') bad('PA4', 'Incubator was reloaded by leaving Cells and coming back'); else ok();
      }
      // PA6
      if (run('PA6')) {
        const host = await page.evaluate(() => ({ admin: typeof window.isAdmin, adminVal: window.isAdmin }));
        if (host.admin !== 'undefined') bad('PA6', 'the host defines isAdmin (' + host.adminVal + ') — Freezer would seed a demo inventory'); else ok();
        await page.click('.cells-tabs [data-ct="cryo"]'); await waitFrame(page, 'cryo', /Iceberg|racks/);
        await page.waitForTimeout(5000);   // seedWhenAdminReady retries for ~4 s
        const vials = await page.evaluate(() => { const w = document.getElementById('cells-f-cryo').contentWindow; try { return w._hasAnyVials(w.state); } catch (e) { return 'err ' + e.message; } });
        if (vials !== false) bad('PA6', 'a Freezer opened with nothing stored has vials: ' + vials); else ok();
      }
    }
    // PA8
    if (run('PA8')) {
      await page.evaluate(() => selectNode('home')); await page.waitForTimeout(300);
      const banner = await page.evaluate(() => (document.querySelector('.lh-sync') || {}).innerText || '');
      if (!banner) bad('PA8', 'signed out, Home shows no sign-in prompt');
      else if (/Sign in with Google/.test(banner) || !/email/i.test(banner)) bad('PA8', 'the app offers Google sign-in (it cannot finish in a WKWebView): ' + banner.slice(0, 80)); else ok();
    }
  } finally { await ctx.close(); }
}

// ── PA7: the layout ───────────────────────────────────────────────────────────────────────────
if (run('PA7')) {
  for (const [w, h] of [[390, 780], [375, 640]]) for (const theme of ['light', 'dark']) {
    const { ctx, page } = await open({ w, h, theme });
    try {
      await page.click('#lb-tabs [data-tab="cells"]'); await waitFrame(page, 'incubator', /Incubator/); await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
        return { layer: r(document.getElementById('cells-layer')), slot: r(document.getElementById('cells-slot')), bar: r(document.getElementById('lb-tabs')),
          tabs: [...document.querySelectorAll('#lb-tabs .lbt')].map(b => b.dataset.tab), vw: innerWidth };
      });
      const tag = `${w}x${h} ${theme}`;
      if (Math.abs(m.layer.t - m.slot.t) > 1 || Math.abs(m.layer.b - m.slot.b) > 1 || Math.abs(m.layer.w - m.slot.w) > 1) bad('PA7', `${tag}: the frame is not on its slot (${JSON.stringify(m.layer)} vs ${JSON.stringify(m.slot)})`); else ok();
      if (m.layer.b > m.bar.t + 1) bad('PA7', `${tag}: the frame reaches under the tab bar (${m.layer.b} > ${m.bar.t})`); else ok();
      if (m.layer.h < 300) bad('PA7', `${tag}: the frame is only ${Math.round(m.layer.h)}px tall`); else ok();
      if (m.tabs.join() !== 'home,exps,cells,add,more') bad('PA7', `${tag}: the tabs are ${m.tabs.join()}`); else ok();
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (sideways) bad('PA7', `${tag}: the page scrolls sideways`); else ok();
    } finally { await ctx.close(); }
  }
}
await browser.close(); server.close();

// ── PA5: the JournalStore, as shipped in the shell, run in isolation ──────────────────────────────
if (run('PA5')) {
  const shell = fs.readFileSync(path.join(ROOT, 'shell/hub-shell.html'), 'utf8');
  const a = shell.indexOf('// CELLS-HOST:BEGIN'), z = shell.indexOf('// CELLS-HOST:END');
  if (a < 0 || z < a) bad('PA5', 'the CELLS-HOST markers are gone from the shell');
  else {
    const src = shell.slice(a, z);
    const storage = {};   // survives "closing the app", like localStorage does
    const ls = { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: k => { delete storage[k]; } };
    // A boot of the store: `cloud` is what the server holds, `acks` says whether writes are confirmed (false = no signal).
    const boot = (cloud, acks) => {
      const sent = [], listeners = {};
      const fb = { database: () => ({ ref: (p) => ({
        on: (ev, cb) => { listeners.value = cb; }, off() {},
        set: (v) => { sent.push([p, v]); return acks.v ? Promise.resolve() : new Promise(() => {}); } }) }) };
      const ctx = { localStorage: ls, firebase: fb, fbReady: () => true, window: { addEventListener() {} }, Object, Promise, JSON, Date, Math, Array, String, setTimeout, clearTimeout, console };
      vm.createContext(ctx); vm.runInContext(src + '\n;this.JournalStore = JournalStore;', ctx);
      const S = ctx.JournalStore; S.attach();
      const snap = () => listeners.value({ val: () => JSON.parse(JSON.stringify(cloud)) });
      return { S, sent, snap };
    };
    const cloud = { incubator: { a1: { line: 'HCT116', passage: 12 } } };
    // session 1: the first cloud read lands, then the phone is offline and a passage is logged
    const acks = { v: false };
    const s1 = boot(cloud, acks);
    s1.S.updateCell('a1', { passage: 13 });
    if (s1.sent.length) bad('PA5', 'a write was sent before the first cloud read had landed'); else ok();
    s1.snap();
    if (!s1.sent.some(x => x[0] === 'journal/incubator/a1')) bad('PA5', 'the pending write was not sent once the cloud read landed'); else ok();
    if (!/"incubator\/a1"/.test(storage.hub_journal_outbox || '')) bad('PA5', 'an unconfirmed write is not in the outbox'); else ok();
    // session 2: iOS closed the app; it opens (still offline) and the cloud snapshot arrives first, with the OLD passage
    const s2 = boot(cloud, acks); s2.snap();
    const p2 = (s2.S.get().incubator.a1 || {}).passage;
    if (p2 !== 13) bad('PA5', 'after reopening, the cloud snapshot overwrote the unsent edit (passage ' + p2 + ', expected 13)'); else ok();
    // a delete made offline is also remembered
    s2.S.deleteCell('a1'); const s3 = boot(cloud, acks); s3.snap();
    if (s3.S.get().incubator.a1) bad('PA5', 'a culture deleted offline came back after reopening'); else ok();
    // session 4: the connection returns; the server confirms; the outbox empties
    acks.v = true; const s4 = boot(cloud, acks); s4.snap();
    await new Promise(r => setTimeout(r, 20));
    if (Object.keys(JSON.parse(storage.hub_journal_outbox || '{}')).length) bad('PA5', 'a confirmed write is still in the outbox: ' + storage.hub_journal_outbox); else ok();
  }
}

// ── PA9: the installable web app, offline after a single visit ───────────────────────────────────
if (run('PA9')) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-pwa-'));
  const b = spawnSync('python3', [path.join(ROOT, 'embed.py'), '--profile=labbook-pwa', tmp], { cwd: ROOT, encoding: 'utf8' });
  if (b.status !== 0) bad('PA9', 'embed.py --profile=labbook-pwa failed: ' + (b.stderr || '').slice(-200));
  else {
    const sw = fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8');
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="((?:firebase|fonts)\/[^"]+|xlsx\.full\.min\.js)"/g)].map(m => m[1]);
    if (!refs.length) bad('PA9', 'the page references no local firebase/fonts/xlsx files'); else ok();
    for (const r of refs) {
      if (!fs.existsSync(path.join(tmp, r))) bad('PA9', r + ' is referenced by the page but is not in the build');
      else if (!sw.includes('./' + r)) bad('PA9', r + ' is not in the service worker precache');
      else ok();
    }
    if (/https:\/\/(www\.gstatic|fonts\.googleapis|cdnjs)/.test(html.replace(/\/\/ If these tags[^\n]*\n/, ''))) bad('PA9', 'the page still loads something from a CDN');
    else ok();
    if (!/Sign in with Google/.test(html)) bad('PA9', 'the web app lost its Google sign-in button'); else ok();
    const srv2 = http.createServer((req, res) => {
      const f = path.join(tmp, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+$/, '/index.html'));
      if (!f.startsWith(tmp) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    });
    await new Promise(r => srv2.listen(0, '127.0.0.1', r));
    const br = await chromium.launch();
    const ctx = await br.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_lean', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    const pg = await ctx.newPage();
    const u = `http://127.0.0.1:${srv2.address().port}/index.html`;
    await pg.route('**/*', r => { const x = r.request().url(); return /^https?:\/\/127\.0\.0\.1/.test(x) || /^(data|blob|about):/.test(x) ? r.continue() : r.abort(); });
    await pg.goto(u);
    await pg.evaluate(async () => { await navigator.serviceWorker.ready; });
    await pg.waitForTimeout(1500);
    await ctx.setOffline(true);
    await pg.reload(); await pg.waitForSelector('#lb-tabs', { timeout: 15000 }).catch(() => {});
    const st = await pg.evaluate(async () => { await document.fonts.ready; return { tabs: !!document.querySelector('#lb-tabs [data-tab="cells"]'), fb: typeof firebase,
      plex: [...document.fonts].some(f => /IBM Plex Sans/.test(f.family) && f.status === 'loaded') }; }).catch(e => ({ err: String(e) }));
    if (st.err) bad('PA9', 'the web app did not reload offline: ' + st.err);
    else { if (!st.tabs) bad('PA9', 'offline reload: no Cells tab'); else ok(); if (st.fb !== 'object') bad('PA9', 'offline reload: no Firebase SDK'); else ok(); if (!st.plex) bad('PA9', 'offline reload: IBM Plex missing'); else ok(); }
    await br.close(); srv2.close();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (findings.length) { console.log(findings.join('\n')); console.log(`\n${findings.length} finding(s), ${passed} checks passed`); process.exit(1); }
console.log(`✓ phone app invariants: ${passed} checks passed`);
