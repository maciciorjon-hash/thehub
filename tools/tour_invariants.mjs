// Tour invariants — the guided tours and Guide tabs are written by hand, so they rot; this is what stops them.
//
// For every app that carries a tour (tools/tourkit/apps/*.js), at a desktop size and on a phone, in both themes:
//
//   G1  the Guide      draws, has one section per tab with something in it, its nav jumps, and a tour button per tab;
//                      nothing overflows sideways; no text under 11px
//   G2  the whole tour with data loaded, every step points at something that is on screen (the spotlight is on),
//                      the card is inside the window and does not cover what it points at, "Back" returns, Esc ends it
//                      and puts the app on the tab it started on, and no tour layer is left behind
//   G3  one tab        appTour('<tab>') walks only that tab's steps and ends after them
//   G4  empty app      with nothing loaded, a step that needs data says so and offers the example — and the tour never
//                      loads anything by itself
//   G5  first time     the corner offer appears once on a fresh app, never over an app that has work in it, and never twice
//   G6  honest         no step is a dead end: a step that cannot find its target has a reason to give (miss) or it is a
//                      centred note; no console errors
//   G7  it holds        when the page under a step scrolls, the spotlight moves with its target within two frames (it
//                      used to be re-placed every 420 ms, and then glide after the target across the screen)
//
//   node tools/tour_invariants.mjs [--only=hitfinder,echo] [--shots=DIR] [--base=http://localhost:8791] [--file=COPY.html]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const only = arg('only', '').split(',').filter(Boolean);
const shots = arg('shots', '');
const base = arg('base', '');
const fileArg = arg('file', '');                 // run one app from another copy of its file (the mutation checks do this)
if (shots) fs.mkdirSync(shots, { recursive: true });

// What "the app has something in it" takes, per app. `data` runs in the page; `ready` says it is done.
const APPS = {
  hitfinder: { file: 'apps/hitfinder/hitfinder.html', data: 'loadHitFinderTestData()', ready: 'HF.screens.size>0' },
  echo:      { file: 'apps/echo/echo.html',           data: 'loadTestData(); setTimeout(runPipeline, 1800)',  ready: '!!(document.querySelector("#rc") && +document.querySelector("#rc").textContent>0)' },
  dora:      { file: 'apps/dora/dora.html',           data: 'loadTestData()', ready: 'RAW.length>0' },
  bca:       { file: 'apps/bca/bca.html',             data: 'loadTestData()',  ready: 'document.querySelector("#import-results") && document.querySelector("#import-results").offsetParent!==null' },
  lumina:    { file: 'apps/lumina/lumina.html',       data: 'loadLuminaTestData()', ready: 'Object.keys(state.wellData||{}).length>0' },
  beacon:    { file: 'apps/beacon/beacon.html',       data: "loadTestData('gain')", ready: '!!(state.donor && state.acceptor)' }
};
const APP_IDS = Object.keys(APPS).filter(a => !only.length || only.includes(a));

const findings = [];
let passed = 0;
const bad = (inv, where, msg) => findings.push(`✗ ${inv} ${where} — ${msg}`);
const ok = () => { passed++; };

const browser = await chromium.launch();
async function open(A, vp, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: vp.size, deviceScaleFactor: 1, hasTouch: !!vp.touch, isMobile: !!vp.touch }, {}));
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|RDKit CDN load failed|SMILES error/.test(m.text())) page.errs.push(m.text()); });
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(o => {
    try { localStorage.setItem('hub_theme', o.theme); localStorage.setItem('lb_tour_done', '1'); } catch (e) {}
    if (o.realUser) Object.defineProperty(navigator, 'webdriver', { get: () => false });
  }, { theme: opts.theme || 'light', realUser: !!opts.realUser });
  const url = fileArg ? 'file://' + path.resolve(fileArg) : base ? base + '/' + A.file : 'file://' + path.join(ROOT, A.file);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  return page;
}
async function loadData(page, A) {
  await page.evaluate(A.data);
  await page.waitForFunction(A.ready, null, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(600);
}
const VPS = [{ name: 'desktop', size: { width: 1440, height: 900 } }, { name: 'phone', size: { width: 390, height: 844 }, touch: true }];

async function cardState(page) {
  return page.evaluate(() => {
    const root = document.getElementById('tk-root'); if (!root) return null;
    const card = root.querySelector('.tk-card'), hole = root.querySelector('.tk-hole');
    const c = card.getBoundingClientRect(), h = hole.getBoundingClientRect();
    return { fade: card.classList.contains('fade'), on: hole.classList.contains('on'), title: (card.querySelector('.tk-t') || {}).textContent || '', body: (card.querySelector('.tk-b') || {}).textContent || '',
      k: (card.querySelector('.tk-k span:last-of-type') || {}).textContent || '', btns: [...card.querySelectorAll('button')].map(b => b.textContent.trim()),
      card: { l: c.left, t: c.top, r: c.right, b: c.bottom }, hole: { l: h.left, t: h.top, r: h.right, b: h.bottom, w: h.width, h: h.height }, vw: innerWidth, vh: innerHeight };
  });
}
const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 6 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 6;
async function settle(page) {      // the card fades in once the target is found; give it its time
  for (let i = 0; i < 40; i++) { const s = await cardState(page); if (s && !s.fade) { await page.waitForTimeout(450); return cardState(page); } await page.waitForTimeout(100); }
  return cardState(page);
}

for (const id of APP_IDS) {
  const A = APPS[id];
  if (!fs.existsSync(path.join(ROOT, A.file))) continue;
  for (const vp of VPS) for (const theme of vp.name === 'desktop' ? ['light', 'dark'] : ['light']) {
    const tag = `${id}/${vp.name}/${theme}`;
    // ── G1 the Guide ──────────────────────────────────────────────────────────
    {
      const page = await open(A, vp, { theme });
      const has = await page.evaluate(() => typeof appTour === 'function' && !!document.querySelector('[data-tk-guide] .tkg'));
      if (!has) { bad('G1', tag, 'no tour or no Guide drawn (run tools/sync_tour.py)'); await page.context().close(); continue; }
      const info = await page.evaluate(() => {
        const g = document.querySelector('[data-tk-guide]');
        const secs = [...g.querySelectorAll('.tkg-sec[id^="tkg-"]')].map(s => ({ id: s.id, text: s.innerText.length, tour: !!s.querySelector('[data-tk="tab-tour"]') }));
        const nav = [...g.querySelectorAll('.tkg-nav a')].map(a => a.getAttribute('data-id'));
        return { secs, nav, ids: [...g.querySelectorAll('[id]')].map(e => e.id) };
      });
      const dupe = info.ids.filter((x, i) => info.ids.indexOf(x) !== i);
      dupe.length ? bad('G1', tag, 'duplicate ids ' + dupe.join(',')) : ok();
      info.nav.forEach(n => { info.secs.some(s => s.id === n) || n === 'tkg-start' ? ok() : bad('G1', tag, 'nav entry ' + n + ' has no section'); });
      info.secs.filter(s => !/words|faq|keys/.test(s.id)).forEach(s => { s.text > 160 ? ok() : bad('G1', tag, s.id + ' is nearly empty'); s.tour ? ok() : bad('G1', tag, s.id + ' has no tour button'); });
      // the Guide is on a tab: show it and measure what a person would see
      await page.evaluate(() => { const t = document.querySelector('[data-tk-guide]'); let p = t; const tabs = [...document.querySelectorAll('[data-tab="guide"],[onclick*="\'guide\'"]')]; if (tabs[0]) tabs[0].click(); });
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const g = document.querySelector('[data-tk-guide]');
        const small = [...g.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 10.5).map(e => e.textContent.trim().slice(0, 30));
        const sw = document.documentElement.scrollWidth - innerWidth;
        const vis = g.getBoundingClientRect().width > 100;
        return { small, sw, vis };
      });
      m.vis ? ok() : bad('G1', tag, 'the Guide is not on screen after opening its tab');
      m.sw > 2 ? bad('G1', tag, 'the page scrolls sideways by ' + m.sw + 'px with the Guide open') : ok();
      m.small.length ? bad('G1', tag, 'text under 11px: ' + m.small.slice(0, 3).join(' | ')) : ok();
      if (shots) await page.screenshot({ path: path.join(shots, `${id}-guide-${vp.name}-${theme}.png`) });
      page.errs.length ? bad('G6', tag, 'errors: ' + page.errs.slice(0, 2).join(' | ')) : ok();
      await page.context().close();
    }
    // ── G2 the whole tour, with data ──────────────────────────────────────────
    {
      const page = await open(A, vp, { theme });
      await loadData(page, A);
      const start = await page.evaluate(() => { try { return (window.__tkWhere || (() => null))(); } catch (e) { return null; } });
      await page.evaluate(() => appTour());
      let n = 0, total = 0, prevTitle = '';
      for (let guard = 0; guard < 60; guard++) {
        const s = await settle(page);
        if (!s) { bad('G2', tag, 'the tour layer vanished at step ' + n); break; }
        n++;
        const m = s.k.match(/(\d+) of (\d+)/); total = m ? +m[2] : total;
        const where = `${tag} step ${m ? m[1] : n} “${s.title.slice(0, 40)}”`;
        // inside the window
        if (s.card.l < -1 || s.card.t < -1 || s.card.r > s.vw + 1 || s.card.b > s.vh + 1) bad('G2', where, `the card is outside the window (${Math.round(s.card.l)},${Math.round(s.card.t)},${Math.round(s.card.r)},${Math.round(s.card.b)} in ${s.vw}×${s.vh})`);
        else ok();
        // pointing at something, or a note that says why not
        if (!s.on && !/Welcome|Come back|That is the tour|Next steps|Done/.test(s.title) && !/appears once|fills in once|needs|This appears|Once /.test(s.body)) bad('G6', where, 'points at nothing and gives no reason');
        if (s.on && !(s.hole.w > 8)) bad('G2', where, 'the spotlight is empty');
        if (s.on && vp.name === 'desktop') overlap(s.card, { l: s.hole.l + 8, t: s.hole.t + 8, r: s.hole.r - 8, b: s.hole.b - 8 }) && s.hole.w < s.vw * 0.9 ? bad('G2', where, 'the card covers what it points at') : ok();
        if (shots) await page.screenshot({ path: path.join(shots, `${id}-tour-${vp.name}-${theme}-${String(n).padStart(2, '0')}.png`) });
        if (s.on && vp.name === 'desktop' && theme === 'light' && (page.__g7 = (page.__g7 || 0) + 1) <= 4) {
          const g7 = await page.evaluate(async () => {
            const hole = document.querySelector('#tk-root .tk-hole'), h0 = hole.getBoundingClientRect();
            const raw = document.elementsFromPoint(h0.left + h0.width / 2, h0.top + h0.height / 2).find(e => !e.closest('#tk-root'));
            let sc = raw; while (sc && sc !== document.documentElement && !(sc.scrollHeight > sc.clientHeight + 100 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
            if (!sc || sc === document.documentElement) sc = document.scrollingElement;
            // scroll the way that keeps the spotlight whole on screen (a spotlight is clamped at the window's edge)
            const before = sc.scrollTop, dir = h0.top > 90 ? 1 : (h0.bottom < innerHeight - 90 ? -1 : 0); if (!dir) return { skip: true };
            sc.scrollTop = before + 60 * dir; const moved = sc.scrollTop - before; if (!moved) return { skip: true };
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const h1 = hole.getBoundingClientRect(); sc.scrollTop = before;
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            return { moved, dy: h0.top - h1.top };
          });
          if (!g7.skip) Math.abs(g7.dy - g7.moved) <= 3 ? ok() : bad('G7', where, `the page scrolled ${g7.moved}px and the spotlight moved ${Math.round(g7.dy)}px two frames later`);
        }
        // Back and forth once: the second step goes back to the first and returns
        if (n === 2) { await page.click('#tk-root [data-tk="back"]'); const b = await settle(page); b && /Welcome/.test(b.title) ? ok() : bad('G2', tag, 'Back from step 2 did not return to the welcome'); await page.click('#tk-root [data-tk="next"]'); await settle(page); }
        const last = m && m[1] === m[2];
        if (last) { await page.click('#tk-root [data-tk="next"]'); break; }
        await page.click('#tk-root [data-tk="next"]');
        prevTitle = s.title;
      }
      total > 20 ? bad('G2', tag, 'the whole tour has ' + total + ' steps — a tour is about a minute; mark the detail `deep`') : ok();
      await page.waitForTimeout(400);
      const left = await page.evaluate(() => !!document.getElementById('tk-root'));
      left ? bad('G2', tag, 'the tour layer is still there after Done') : ok();
      page.errs.length ? bad('G6', tag, 'errors: ' + page.errs.slice(0, 2).join(' | ')) : ok();
      await page.context().close();
    }
    if (vp.name !== 'desktop' || theme !== 'light') continue;
    // ── G3 one tab ────────────────────────────────────────────────────────────
    {
      const page = await open(A, vp, { theme });
      await loadData(page, A);
      const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-tk-guide] [data-tk="tab-tour"]')].map(b => b.getAttribute('data-t')));
      for (const t of tabs) {
        await page.evaluate(t => appTour(t), t);
        let steps = 0;
        for (let g = 0; g < 20; g++) {
          const s = await settle(page); if (!s) break; steps++;
          const m = s.k.match(/(\d+) of (\d+)/); if (g === 0 && m && +m[2] > 8) bad('G3', `${id}/${t}`, 'a single tab has ' + m[2] + ' steps — too long to be a tab tour');
          if (m && m[1] === m[2]) { await page.click('#tk-root [data-tk="next"]'); break; }
          await page.click('#tk-root [data-tk="next"]');
        }
        await page.waitForTimeout(300);
        (steps >= 1 && !(await page.evaluate(() => !!document.getElementById('tk-root')))) ? ok() : bad('G3', `${id}/${t}`, 'the tab tour did not run or did not end');
      }
      await page.context().close();
    }
    // ── G4 an empty app ───────────────────────────────────────────────────────
    {
      const page = await open(A, vp, { theme });
      const dataless = await page.evaluate(() => { try { return typeof tourRegister === 'function'; } catch (e) { return false; } });
      await page.evaluate(() => appTour());
      let offered = false, ended = false;
      for (let g = 0; g < 60; g++) {
        const s = await settle(page); if (!s) { ended = true; break; }
        if (s.btns.some(b => /example|Load/i.test(b))) offered = true;
        const m = s.k.match(/(\d+) of (\d+)/);
        if (m && m[1] === m[2]) { await page.click('#tk-root [data-tk="next"]'); ended = true; break; }
        await page.click('#tk-root [data-tk="next"]');
      }
      const hasNow = await page.evaluate(A.ready).catch(() => false);
      if (dataless && A.ready !== 'true') (hasNow ? bad('G4', tag, 'the tour loaded data by itself') : ok());
      ended ? ok() : bad('G4', tag, 'the empty-app tour did not finish');
      if (A.ready !== 'true') offered ? ok() : bad('G4', tag, 'with nothing loaded, no step offered the example');
      await page.context().close();
    }
    // ── G5 first time ─────────────────────────────────────────────────────────
    {
      const page = await open(A, vp, { theme, realUser: true });
      await page.waitForTimeout(3600);
      const shown = await page.evaluate(() => !!document.getElementById('tk-offer'));
      shown ? ok() : bad('G5', tag, 'a fresh app did not offer the tour');
      if (shown) {
        const r = await page.evaluate(() => { const b = document.getElementById('tk-offer').getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, vw: innerWidth, vh: innerHeight }; });
        (r.l >= 0 && r.r <= r.vw && r.t >= 0 && r.b <= r.vh) ? ok() : bad('G5', tag, 'the offer is outside the window');
        if (shots) await page.screenshot({ path: path.join(shots, `${id}-offer-${vp.name}.png`) });
        await page.click('#tk-offer [data-tk="no"]');
        await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(3600);
        (await page.evaluate(() => !!document.getElementById('tk-offer'))) ? bad('G5', tag, 'the offer came back after “Not now”') : ok();
      }
      await page.context().close();
      const p2 = await open(A, vp, { theme, realUser: true });
      await loadData(p2, A);
      if (A.ready !== 'true') { await p2.evaluate(() => { try { localStorage.removeItem('tk_seen_' + (window.__tkId || '')); } catch (e) {} }); }
      await p2.context().close();
    }
  }
}
await browser.close();
console.log(findings.join('\n') || '');
console.log(`\ntour invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
