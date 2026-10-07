// The desktop counterpart of tools/mobile_hub_sweep.mjs — the apps that changed most recently,
// driven into their working screens at desktop and tablet widths, in both themes, and measured
// with the same detector the phone sweep uses (overlap · covered · clipped · sideways · tiny)
// plus the in-page runtime and alignment audits.
//
//   node tools/desktop_sweep.mjs [--url=http://127.0.0.1:8791] [--sizes=1440x900,1024x768,768x1024]
//        [--themes=light,dark] [--only=echo,lumina] [--shots=DIR] [--verbose]
//
// Serve the repo first:  python3 -m http.server 8791
// Screens: Echo — Gradient Planner, Results, Curves, Plots, Plate (Maps · QC · Compare), Properties, History;
//          Lumina — Plate (example loaded), Results (curve and Plot, Fit settings open), the assistant bubble
//          open on top of both, and a right-click menu open on top of the plate.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { DETECT } from './mobile_hub_sweep.mjs';
import { HF_SEED } from './hitfinder_seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const BASE = args.url || 'http://127.0.0.1:8791';
const SIZES = String(args.sizes || '1440x900,1024x768,768x1024').split(',').map(s => s.split('x').map(Number));
const THEMES = String(args.themes || 'light,dark').split(',');
const ONLY = args.only ? String(args.only).split(',') : null;
const SHOTS = args.shots ? String(args.shots) : null;
const here = path.dirname(new URL(import.meta.url).pathname);
const AUDITS = ['audit_runtime.js', 'audit_align.js'].map(f => fs.readFileSync(path.join(here, f), 'utf8'));
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const findings = [];
let screens = 0;
const browser = await chromium.launch();

async function measure(page, label, size, theme) {
  screens++;
  await page.waitForTimeout(350);
  // A missing CDN script raises an offline notice over the page; that is the sandbox, not the screen
  // being measured. (Stacking of the notices themselves is checked once, below.)
  await page.evaluate(() => { document.getElementById('dep-stack')?.remove(); document.querySelectorAll('#dep-jspdf,#dep-rdkit').forEach(n => n.remove()); document.querySelectorAll('body > div[role=status][style*="99999"]').forEach(n => n.remove()); const t = document.getElementById('toast'); if (t) t.style.display = 'none'; });
  const r = await page.evaluate(([D, A, B]) => {
    try { (0, eval)(D); (0, eval)(A); (0, eval)(B); } catch (e) { return { err: String(e) }; }
    const det = window.__hub.detect({ minFont: 10 });
    const rt = window.__runtimeAudit ? window.__runtimeAudit() : { errors: [] };
    const al = window.__alignAudit ? window.__alignAudit() : [];
    const sw = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return { det, rt: rt.errors || [], al, sw };
  }, [DETECT, AUDITS[0], AUDITS[1]]);
  if (r.err) { findings.push(`${label} @${size.join('x')} ${theme}: harness ${r.err}`); return; }
  const add = (k, v) => findings.push(`${label} @${size.join('x')} ${theme} · ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  (r.det || []).forEach(x => add('detect', x));
  r.rt.forEach(x => add('runtime', x));
  r.al.forEach(x => add('align', x));
  if (r.sw > 1) add('sideways', r.sw + 'px');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${label.replace(/[^\w]+/g, '_')}_${size.join('x')}_${theme}.png`) });
}

async function app(name, url, drive) {
  if (ONLY && !ONLY.includes(name)) return;
  for (const size of SIZES) for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, acceptDownloads: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e.message || e)));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.addInitScript(t => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} }, theme);
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    try { await drive(page, (label) => measure(page, label, size, theme)); }
    catch (e) { findings.push(`${name} @${size.join('x')} ${theme}: driver threw ${String(e.message).split('\n')[0]}`); }
    errs.forEach(e => findings.push(`${name} @${size.join('x')} ${theme}: pageerror ${e}`));
    await ctx.close();
  }
}

await app('echo', '/apps/echo/echo.html', async (page, m) => {
  await page.evaluate(() => { document.getElementById('setup-modal')?.classList.add('hidden'); [...document.querySelectorAll('.outer-tab')].find(b => /Gradient/.test(b.textContent)).click(); });
  await m('echo-gradient');
  await page.evaluate(() => { [...document.querySelectorAll('.outer-tab')].find(b => /Analysis/.test(b.textContent)).click(); document.getElementById('setup-modal')?.classList.add('hidden'); loadTestData(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { document.getElementById('setup-modal')?.classList.remove('hidden'); switchSetupTab('review'); });
  await page.waitForTimeout(2500);
  await m('echo-review');
  await page.evaluate(() => { runPipeline(); });
  await page.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  // a second analysis of the same files: History gets a version, Compare something to compare
  await page.evaluate(() => { document.getElementById('p-r2').value = '0.9'; runPipeline(); });
  await page.waitForTimeout(6000);
  await page.evaluate(() => document.getElementById('setup-modal')?.classList.add('hidden'));
  for (const t of ['results', 'curves', 'scatter', 'props', 'history']) {
    await page.evaluate(k => document.querySelector(`.tab[data-tab="${k}"]`).click(), t);
    await m('echo-' + t);
  }
  await page.evaluate(() => { const r = Object.values(_hx.runs).sort((a, b) => a.ver - b.ver); if (r.length > 1) hxCompare(r[0].id, r[1].id); });
  await page.waitForTimeout(900);
  await m('echo-compare');
  await page.evaluate(() => hxCloseCompare());
  await page.evaluate(() => document.querySelector('.tab[data-tab="plate"]').click());
  for (const v of ['maps', 'qc', 'compare']) {
    await page.evaluate(k => plateSetView(k), v).catch(() => {});
    await m('echo-plate-' + v);
  }
});

await app('lumina', '/apps/lumina/lumina.html', async (page, m) => {
  await m('lumina-empty');
  await page.evaluate(() => loadLuminaTestData());
  await page.waitForTimeout(700);
  await m('lumina-plate');
  await page.evaluate(() => runLuminaAnalysis && switchTab('results'));
  await page.waitForTimeout(900);
  await m('lumina-results');
  await page.evaluate(() => rsToggleSettings());
  await m('lumina-fitsettings');
  await page.evaluate(() => { rsToggleSettings(); rsSetTab('plot'); });
  await m('lumina-plot');
  // the assistant bubble open, over the busiest screen
  await page.evaluate(() => { const b = document.querySelector('.as-bubble,#as-bubble,[class*="assist"][class*="bubble"],[id*="assist"]'); b && b.click(); });
  await m('lumina-assistant');
});

// Every other app: its opening screen, then each of its top-level tabs in turn. No data is loaded, so
// this is the empty state and the navigation — the demo-data screens are the phone sweep's job.
const GENERIC = ['hitfinder/hitfinder', 'tempo/tempo', 'dora/dora', 'blueprint/blueprint', 'helix/helix', 'protein-tools/protein-tools', 'bca/bca',
  'iceberg/iceberg', 'cuppa/cuppa', 'beacon/beacon', 'ribbon/ribbon', 'archive/archive', 'cell-archive/cell-archive',
  'incubator/incubator', 'labbook/labbook', 'western-blot/western-blot'];
for (const g of GENERIC) {
  const name = g.split('/')[0];
  await app(name, `/apps/${g}.html`, async (page, m) => {
    await m(name + '-open');
    const n = await page.evaluate(() => {
      const seen = new Set(), out = [];
      document.querySelectorAll('.tab,.dtab,.outer-tab,[role=tab],.nav-tab,.seg-btn,.mode-btn,.sub-tab,.tb-tab').forEach((e, i) => {
        const r = e.getBoundingClientRect(); const t = (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        if (!(r.width > 0 && r.height > 0) || !t || seen.has(t)) return; seen.add(t); e.setAttribute('data-sw', String(out.length)); out.push(t);
      });
      return out.slice(0, 9);
    });
    for (let i = 0; i < n.length; i++) {
      await page.evaluate(k => { const e = document.querySelector(`[data-sw="${k}"]`); e && e.click(); }, i);
      await page.waitForTimeout(300);
      await m(`${name}-tab-${n[i].replace(/\W+/g, '_')}`);
    }
  });
}

// Hit Finder with the example screen and structures: every tab, then a compound drawer open over the Hits tab and over the Chemistry tab.
await app('hitfinder', '/apps/hitfinder/hitfinder.html', async (page, m) => {
  for (const js of HF_SEED) await page.evaluate(js);
  await page.waitForTimeout(3200);
  for (const t of ['screens', 'criteria', 'hits', 'plots', 'chem', 'export']) { await page.evaluate(k => hfTab(k), t); await page.waitForTimeout(500); await m('hitfinder-data-' + t); }
  await page.evaluate(() => { hfTab('hits'); hfOpenDrawer(HF.uni[0]); }); await page.waitForTimeout(500); await m('hitfinder-drawer');
  await page.evaluate(() => hfCloseDrawer());
  await page.evaluate(() => { hfTab('chem'); hfChemQ(hfName(HF.uni[3])); }); await page.waitForTimeout(500); await m('hitfinder-chem-similar');
});

await browser.close();
const uniq = [...new Set(findings)];
console.log(`${screens} screens measured · ${uniq.length} findings`);
uniq.forEach(f => console.log('  ✗ ' + f));
process.exit(uniq.length ? 1 : 0);
