// Data-analysis apps — the capability ledger (docs/DATA_APPS_STUDY_2026-10-30.md, Phase 0).
// Echo, Lumina, Beacon, Tempo, Hit Finder, Dora and BCA are being brought under one set of rules (statistics, results table, tabs, graphs).
// That work must never cost an app something it can do today. So each app is opened with its example loaded, every tab is visited, and what is
// there is written down: the tab bar, the column headers of every table, every button and heading, and how many charts are drawn.
// tools/fixtures/data_apps_ledger.json is that list. A run FAILS when something in it is gone; something new is only reported.
//
//   node tools/data_apps_ledger.mjs                       check
//   node tools/data_apps_ledger.mjs --update              add what is new to the ledger (never removes anything)
//   node tools/data_apps_ledger.mjs --prune="Old label"   remove entries on purpose (a rename, a merge): list them, `|`-separated, with the tab as `app/tab/kind:label`
//
// A rename is a removal plus an addition: prune the old label and --update, and the commit shows both lines.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const LEDGER = path.join(HERE, 'fixtures', 'data_apps_ledger.json');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const UPDATE = process.argv.includes('--update'), PRUNE = (arg('prune', '') || '').split('|').filter(Boolean);
const ONLY = arg('only', '') ? arg('only', '').split(',') : null;

const echoTab = t => `document.querySelector('.tab[data-tab="${t}"]').click()`;
const APPS = {
  echo: { file: 'apps/echo/echo.html', boot: `[...document.querySelectorAll('.outer-tab')].find(b=>/Analysis/.test(b.textContent))?.click(); document.getElementById('setup-modal')?.classList.add('hidden'); loadTestData(); await new Promise(r=>setTimeout(r,300)); runPipeline();`, tabs: ['results', 'curves', 'scatter', 'plate', 'props', 'graph', 'log', 'history', 'protocol', 'survey', 'guide'], go: echoTab },
  lumina: { file: 'apps/lumina/lumina.html', boot: `loadLuminaTestData();`, tabs: ['input', 'results', 'graph', 'history', 'guide'], go: t => `switchTab('${t}')` },
  beacon: { file: 'apps/beacon/beacon.html', boot: `loadTestData();`, tabs: ['plate', 'results', 'graph', 'history', 'guide'], go: t => `switchTab('${t}')` },
  tempo: { file: 'apps/tempo/tempo.html', boot: `await tpLoadExample('degradation');`, tabs: ['plate', 'curves', 'results', 'compare', 'history'], go: t => `tpTab('${t}')` },
  tempoTC: { file: 'apps/tempo/tempo.html', boot: `await tpLoadExample('timecourse');`, tabs: ['plate', 'curves', 'results', 'compare'], go: t => `tpTab('${t}')` },
  hitfinder: { file: 'apps/hitfinder/hitfinder.html', boot: `loadHitFinderTestData();`, tabs: ['screens', 'criteria', 'hits', 'sens', 'plots', 'health', 'chem', 'export', 'guide'], go: t => `hfTab('${t}')` },
  dora: { file: 'apps/dora/dora.html', boot: `loadTestData();`, tabs: ['load', 'table', 'scatter', 'props', 'guide'], go: t => `switchTab('${t}')` },
  bca: { file: 'apps/bca/bca.html', boot: `loadTestData();`, tabs: ['standards', 'history', 'guide'], go: t => `switchTab('${t}')` },
};

// What is on the screen, as sets of labels. Digits become # (a counter, a well number, "Remove standard 3"), so a count changing is not a loss.
const READ = () => {
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0; };
  const norm = t => (t || '').replace(/\s+/g, ' ').replace(/\d+([.,]\d+)?/g, '#').trim().slice(0, 60);
  const uniq = a => [...new Set(a.filter(Boolean))].sort();
  const bars = [...document.querySelectorAll('.tabs,.tabbar,#tabs,#tp-tabs,#hf-tabs')].filter(vis);
  return {
    tabbar: bars.length ? [...bars[0].querySelectorAll('.tab,[role=tab]')].filter(vis).map(b => norm(b.textContent)) : [],
    headers: uniq([...document.querySelectorAll('table')].filter(vis).flatMap(t => [...t.querySelectorAll('thead th, tr:first-child th')].map(h => norm(h.textContent)))),
    buttons: uniq([...document.querySelectorAll('button, .btn, [role=tab], select, input[type=checkbox], input[type=range]')].filter(vis).map(b => norm(b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent || b.tagName.toLowerCase()))),
    headings: uniq([...document.querySelectorAll('h1,h2,h3,h4,.card-hdr,.card-title,summary')].filter(vis).map(h => norm(h.textContent))),
    charts: { canvas: [...document.querySelectorAll('canvas')].filter(vis).length, svg: [...document.querySelectorAll('svg')].filter(s => vis(s) && s.getBoundingClientRect().width > 160).length },
  };
};

const browser = await chromium.launch();
const now = {};
for (const [id, A] of Object.entries(APPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto('file://' + path.join(ROOT, A.file));
  await page.waitForTimeout(1200);
  try { await page.evaluate(`(async()=>{ document.getElementById('dep-stack')?.remove(); ${A.boot} })()`); } catch (e) { console.log('  ! ' + id + ' boot: ' + String(e).slice(0, 120)); }
  await page.waitForTimeout(1500);
  now[id] = {};
  for (const t of A.tabs) {
    try { await page.evaluate(`(async()=>{ ${A.go(t)} })()`); await page.waitForTimeout(800); await page.evaluate(() => document.getElementById('dep-stack')?.remove()); now[id][t] = await page.evaluate(READ); }
    catch (e) { console.log('  ! ' + id + '/' + t + ': ' + String(e).slice(0, 120)); }
  }
  await ctx.close();
}
await browser.close();

// flatten to "app/tab/kind:label" strings; charts are "app/tab/charts:canvas=N"
function flat(o) {
  const out = new Set();
  for (const [a, tabs] of Object.entries(o)) {
    for (const [t, d] of Object.entries(tabs)) {
      d.tabbar.forEach(x => out.add(`${a}/${t}/tabbar:${x}`));
      for (const k of ['headers', 'buttons', 'headings']) d[k].forEach(x => out.add(`${a}/${t}/${k}:${x}`));
      out.add(`${a}/${t}/charts:canvas=${d.charts.canvas}`); out.add(`${a}/${t}/charts:svg=${d.charts.svg}`);
    }
  }
  return out;
}

const have = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : { entries: [] };
const base = new Set(have.entries), cur = flat(now);
// A chart count is a floor, not a label: 4 canvases where the ledger says 2 is fine, 1 where it says 2 is a loss.
const chartLoss = e => { const m = /^(.*\/charts:(canvas|svg))=(\d+)$/.exec(e); if (!m) return false; const n = [...cur].map(c => c.startsWith(m[1] + '=') ? +c.split('=').pop() : -1).filter(x => x >= 0)[0]; return n === undefined || n < +m[3]; };
const ranApps = new Set(Object.keys(now));
const inScope = e => ranApps.has(e.split('/')[0]);
const missing = [...base].filter(e => inScope(e) && !PRUNE.includes(e) && (/\/charts:/.test(e) ? chartLoss(e) : !cur.has(e)));
const added = [...cur].filter(e => !base.has(e) && !/\/charts:/.test(e));
const chartUp = [...cur].filter(e => /\/charts:/.test(e) && !base.has(e));

if (UPDATE || PRUNE.length) {
  const next = new Set([...base].filter(e => !PRUNE.includes(e)));
  if (UPDATE) { added.forEach(e => next.add(e)); chartUp.forEach(e => { const m = /^(.*\/charts:(?:canvas|svg))=/.exec(e); for (const b of [...next]) if (b.startsWith(m[1] + '=')) next.delete(b); next.add(e); }); }
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, JSON.stringify({ note: 'tools/data_apps_ledger.mjs — what each data-analysis app shows today. A run fails when something here is gone.', entries: [...next].sort() }, null, 1) + '\n');
  console.log(`ledger written: ${next.size} entries (${added.length} added, ${PRUNE.length} pruned)`);
  process.exit(0);
}
if (added.length) console.log(`  new (not in the ledger yet): ${added.length} — run with --update to record them`);
if (missing.length) { console.log(`✗ ${missing.length} capabilities are gone from the ledger:`); missing.slice(0, 60).forEach(m => console.log('   - ' + m)); if (missing.length > 60) console.log('   … and ' + (missing.length - 60) + ' more'); process.exit(1); }
console.log(`✓ data-apps ledger: ${base.size} entries, none missing`);
