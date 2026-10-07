// Does the app move the way the rest of the Hub moves? For each Data Analysis app, seeded with its demo data:
//   still      a control (button, link, tab, field, summary) that changes on hover or focus but has no transition at all — it snaps
//   long       a transition or animation longer than 400ms on something a person is waiting to use
//   bulk       a transition on `all`, or on a property that makes layout (width, height, top, left): the cost of a transition is paid per frame
//   loops      an animation that repeats for ever while nothing is happening (a spinner while it is loading is fine; a breathing icon at rest is not)
//   reduced    with prefers-reduced-motion, anything still longer than 20ms
//   pane       the tab you switch to does not arrive: the pane that becomes active has no entering animation
//
//   node tools/motion_audit.mjs [--only=bca,dora] [--url=http://127.0.0.1:8791] [--verbose]      (serve the repo first: python3 -m http.server 8791)
import { chromium } from 'playwright';
import { HF_SEED } from './hitfinder_seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const BASE = args.url || 'http://127.0.0.1:8791';
const ONLY = args.only ? String(args.only).split(',') : null;
const APPS = {
  echo: { url: '/apps/echo/echo.html', seed: ['loadTestData()'], views: [''], wait: 1500, tabs: '.outer-tab' },
  hitfinder: { url: '/apps/hitfinder/hitfinder.html', seed: HF_SEED, views: [''], wait: 3500, tabs: '.tab' },
  dora: { url: '/apps/dora/dora.html', seed: ['loadTestData()'], views: [''], wait: 800, tabs: '.tab' },
  bca: { url: '/apps/bca/bca.html', seed: ['loadTestData()'], views: [''], wait: 800, tabs: '.tab' },
  beacon: { url: '/apps/beacon/beacon.html', seed: ["loadTestData('gain')"], views: [''], wait: 800, tabs: '.tab' },
  lumina: { url: '/apps/lumina/lumina.html', seed: ['loadLuminaTestData()'], views: [''], wait: 800, tabs: '.tab' },
};
const found = new Map(); const add = (k, v) => found.set(k, v);
const browser = await chromium.launch();

const SCAN = () => {
  const out = { still: new Map(), long: new Map(), bulk: new Map(), loops: new Map() };
  const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const secs = s => Math.max(0, ...String(s).split(',').map(x => parseFloat(x) * (/ms$/.test(x.trim()) ? 0.001 : 1)).filter(Number.isFinite));
  document.querySelectorAll('button,a[href],[role=button],[role=tab],.tab,.outer-tab,input:not([type=hidden]),select,textarea,summary,[onclick]').forEach(e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (r.width < 6 || r.height < 6 || cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return;
    if (e.closest('canvas,svg') && !e.matches('svg *')) return; if (e.closest('.plate, #plate-wrap, .well, .pm-grid, #paste-grid-wrap, #pl-grid, .pp-grid')) return;     // a plate well is restyled hundreds at a time: no transition on purpose
    const td = secs(cs.transitionDuration), ad = secs(cs.animationDuration), tp = cs.transitionProperty;
    const k = name(e);
    if (td === 0 && ad === 0 && (cs.cursor === 'pointer' || /^(BUTTON|SELECT|INPUT|TEXTAREA|SUMMARY)$/.test(e.tagName))) out.still.set(k, (out.still.get(k) || 0) + 1);
    if (td > 0.4 || (ad > 0.4 && cs.animationIterationCount !== 'infinite')) out.long.set(k, td + '/' + ad);
    if (/(^|,)\s*(all|width|height|top|left|right|bottom|margin|padding)\b/.test(tp) && td > 0) out.bulk.set(k, tp);
  });
  document.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') { const r = e.getBoundingClientRect(); if (r.width > 0 && !/spin|load|progress|busy|pulse-load/i.test(cs.animationName + ' ' + String(e.className))) out.loops.set(name(e), cs.animationName); } });
  return Object.fromEntries(Object.entries(out).map(([k, m]) => [k, [...m.entries()]]));
};

for (const [id, A] of Object.entries(APPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  for (const theme of ['light']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage(); await pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    await pg.goto(BASE + A.url); await pg.waitForTimeout(800);
    for (const js of A.seed) { try { await pg.evaluate(js); } catch (e) {} }
    await pg.waitForTimeout(A.wait);
    // every tab in turn: what is on each, and does the arriving pane animate
    const nTabs = await pg.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0).length, A.tabs);
    for (let i = 0; i < Math.min(nTabs, 8); i++) {
      const arrive = await pg.evaluate(async ([sel, i]) => {
        const t = [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0)[i]; if (!t) return null;
        const before = new Set([...document.querySelectorAll('.tabpane,.tab-pane,.panel,.view,.pane,[role=tabpanel]')].filter(p => getComputedStyle(p).display !== 'none'));
        t.click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const shown = [...document.querySelectorAll('.tabpane,.tab-pane,.panel,.view,.pane,[role=tabpanel]')].filter(p => getComputedStyle(p).display !== 'none' && !before.has(p));
        const anim = shown.map(p => getComputedStyle(p).animationName + '/' + getComputedStyle(p).transitionProperty + '/' + (p.firstElementChild ? getComputedStyle(p.firstElementChild).animationName : ''));
        return { label: t.textContent.trim().replace(/\s+/g, ' ').slice(0, 18), shown: shown.length, anim };
      }, [A.tabs, i]);
      if (arrive && arrive.shown && arrive.anim.every(a => /^none\/(all|none)?\/(none)?$/.test(a) || /^none\/(none)?\/(none)?$/.test(a))) add(`pane   ${id} › ${arrive.label}: the pane that arrives has no entering animation`, 1);
      await pg.waitForTimeout(420);
      const r = await pg.evaluate(SCAN);
      for (const [kind, list] of Object.entries(r)) for (const [k, v] of list) add(`${kind.padEnd(6)} ${id} › ${arrive ? arrive.label : 'main'} · ${k}${kind === 'still' ? ' ×' + v : ' ' + v}`, 1);
    }
    await ctx.close();
    // reduced motion
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p2 = await c2.newPage(); await p2.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await p2.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
    await p2.goto(BASE + A.url); await p2.waitForTimeout(800); for (const js of A.seed) { try { await p2.evaluate(js); } catch (e) {} } await p2.waitForTimeout(A.wait);
    const rm = await p2.evaluate(() => { const bad = new Map(); document.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); const s = x => Math.max(0, ...String(x).split(',').map(v => parseFloat(v) * (/ms$/.test(v.trim()) ? 0.001 : 1)).filter(Number.isFinite)); const t = Math.max(s(cs.transitionDuration), cs.animationName !== 'none' ? s(cs.animationDuration) : 0); if (t > 0.02) bad.set(e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''), Math.round(t * 1000) + 'ms'); }); return [...bad.entries()].slice(0, 12); });
    for (const [k, v] of rm) add(`reduced ${id} · ${k} still ${v} with reduced motion`, 1);
    await c2.close();
  }
}
await browser.close();
const lines = [...found.keys()].sort();
console.log(lines.length ? lines.join('\n') : 'Everything that moves moves like the rest of the Hub, and stands still when asked to.');
console.log(`\n${lines.length} finding(s).`);
process.exit(lines.length ? 1 : 0);
