// Tab-switch jank: does changing tab or section in an app stall the page? For each app, seeded with its demo
// data, every tab is clicked in turn under a 4× CPU throttle while a PerformanceObserver records long tasks
// (main-thread work over 50 ms) in the 700 ms after the click. A switch whose longest task is over the budget
// is a finding — that is the "bumpy" a person feels: the click lands, the screen freezes, then jumps.
//
//   node tools/tab_jank.mjs [--only=echo,lumina] [--url=http://127.0.0.1:8791] [--budget=120] [--throttle=4]
//   (serve the repo first: python3 -m http.server 8791)
import { chromium } from 'playwright';
import { HF_SEED } from './hitfinder_seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const BASE = args.url || 'http://127.0.0.1:8791', ONLY = args.only ? String(args.only).split(',') : null;
const BUDGET = +(args.budget || 120), THROTTLE = +(args.throttle || 4);
const APPS = {
  echo:      { url: '/apps/echo/echo.html', seed: ['loadTestData()', 'runPipeline()'], wait: 9000, tabs: '.tab[data-tab]' },
  hitfinder: { url: '/apps/hitfinder/hitfinder.html', seed: HF_SEED, wait: 3500, tabs: '.tab' },
  lumina:    { url: '/apps/lumina/lumina.html', seed: ['loadLuminaTestData()'], wait: 1200, tabs: '.tab' },
  tempo:     { url: '/apps/tempo/tempo.html', seed: ['loadTestData()'], wait: 2500, tabs: '.tab' },
  dora:      { url: '/apps/dora/dora.html', seed: ['loadTestData()'], wait: 900, tabs: '.tab' },
  bca:       { url: '/apps/bca/bca.html', seed: ['loadTestData()'], wait: 900, tabs: '.tab' },
  beacon:    { url: '/apps/beacon/beacon.html', seed: ["loadTestData('gain')"], wait: 900, tabs: '.tab' },
  blueprint: { url: '/apps/blueprint/blueprint.html', seed: [], wait: 600, tabs: '.tab' },
  iceberg:   { url: '/apps/iceberg/iceberg.html', seed: [], wait: 900, tabs: '#storage-tabs > *' },
  blot:      { url: '/apps/western-blot/western-blot.html', seed: [], wait: 600, tabs: '.tab, [role=tab]' },
  cuppa:     { url: '/apps/cuppa/cuppa.html', seed: [], wait: 900, tabs: '.tab, [role=tab]' },
};
const browser = await chromium.launch();
const rows = []; let bad = 0;
for (const [id, A] of Object.entries(APPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.goto(BASE + A.url); await p.waitForTimeout(800);
  for (const s of A.seed) { try { await p.evaluate(s); } catch (e) {} await p.waitForTimeout(300); }
  await p.waitForTimeout(A.wait);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await p.evaluate(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: false }); } catch (e) {} });
  const n = await p.evaluate(sel => document.querySelectorAll(sel).length, A.tabs);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    const r = await p.evaluate(async ([sel, i]) => {
      const t = [...document.querySelectorAll(sel)][i]; if (!t || !t.offsetParent) return null;
      const name = (t.textContent || t.dataset.tab || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      const t0 = performance.now(); window.__lt.length = 0; t.click();
      await new Promise(r => setTimeout(r, 700));
      const long = window.__lt.filter(e => e.t >= t0 - 5).map(e => e.d);
      return { name, max: long.length ? Math.max(...long) : 0, sum: long.reduce((a, b) => a + b, 0) };
    }, [A.tabs, i]);
    if (!r || pass === 0) continue;   // the first pass is the first visit (lazy builds); judge the second
    const over = r.max > BUDGET; if (over) bad++;
    rows.push((over ? '✗ ' : '  ') + id.padEnd(10) + ' ' + r.name.padEnd(26) + ' longest ' + Math.round(r.max) + ' ms · blocked ' + Math.round(r.sum) + ' ms');
  }
  await ctx.close();
}
await browser.close();
console.log(rows.join('\n'));
console.log('\n' + bad + ' switch' + (bad === 1 ? '' : 'es') + ' over ' + BUDGET + ' ms at ' + THROTTLE + '× CPU');
process.exit(bad ? 1 : 0);
