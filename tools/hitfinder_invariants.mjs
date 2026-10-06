// Hit Finder invariants — the classes of bug a triage tool can have, as checks that run every time.
// Same rule as tools/invariants.mjs and tools/echo_invariants.mjs: each check is a CLASS, proven by putting the
// bug back in a temporary copy (--file=path/to/hitfinder.html) and watching it fail.
//
//   H0  one source of truth   Every '@rdkit/rdkit' URL is pinned to a version, and the SCREEN ENGINE and RDKIT LOADER blocks are byte-identical to
//                             Echo's (the numbers a hook, a coverage or a qualifier carry cannot differ between the file and the app).
//   H16 the example is real   The example screen has 72 compounds in 5 screens, every record is schema echo-screen/1 and went through the engine
//                             (hook states, qualifiers, the compounds that could not be fitted), and a compound written three ways is one compound.
//   H17 the tabs are a tablist One selected tab, arrows / Home / End move and select, the underline sits under the active tab.
//
// Usage (repo root):  node tools/hitfinder_invariants.mjs [--only=H0,H16] [--file=path/to/hitfinder.html] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.resolve(args.file || path.join(ROOT, 'apps/hitfinder/hitfinder.html'));
const ECHO = path.join(ROOT, 'apps/echo/echo.html');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);

const out = [], counts = {}, skipped = [];
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) });
}
async function guard(inv, fn) { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } }
const block = (src, name) => { const i = src.indexOf('// ═══ ' + name + ' — BEGIN'), j = src.indexOf('// ═══ ' + name + ' — END'); return i < 0 || j < 0 ? null : src.slice(i, src.indexOf('\n', j)); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
const pageErrs = [];
pg.on('pageerror', e => pageErrs.push(String(e && e.message || e)));
// Nothing here needs the network: SheetJS and fonts are not what is being tested, and RDKit is injected where a check needs it.
await pg.route(/^https?:/, r => r.abort());
const E = (f, a) => pg.evaluate(f, a);
await pg.goto('file://' + FILE);
await pg.waitForTimeout(600);

if (run('H0')) await guard('H0', async () => {
  const mine = fs.readFileSync(FILE, 'utf8'), echo = fs.readFileSync(ECHO, 'utf8');
  const unpinned = t => [...t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').matchAll(/@rdkit\/rdkit(?!@(?:\d|' \+ RDKIT_VERSION))/g)].length;
  check('H0', 'every @rdkit/rdkit URL carries a version', unpinned(mine) === 0, unpinned(mine));
  for (const name of ['SCREEN ENGINE', 'RDKIT LOADER']) {
    const a = block(mine, name), b = block(echo, name);
    check('H0', name + ' is Echo\'s, byte for byte (run tools/sync_screen_engine.py)', !!a && a === b, { here: a && a.length, echo: b && b.length });
  }
});

if (run('H16')) await guard('H16', async () => {
  const r = await E(() => {
    loadHitFinderTestData();
    const recs = HF.recs, by = {};
    recs.forEach(x => { const k = x.Assay_ID; (by[k] = by[k] || { fit: 0, unfit: 0, hook: {}, q: {} });
      if (x.Fit_Status === 'fitted') { by[k].fit++; by[k].hook[x.Hook_State] = (by[k].hook[x.Hook_State] || 0) + 1; by[k].q[x.Potency_Qualifier] = (by[k].q[x.Potency_Qualifier] || 0) + 1; } else by[k].unfit++; });
    const spelled = [...HF.names.values()].filter(m => m.size > 1).length;
    return { compounds: hfNCompounds(), screens: HF.screens.size, schema: recs.every(x => x.Schema === 'echo-screen/1'), n: recs.length, by,
      keys: recs.every(x => Object.keys(x).filter(k => k[0] !== '_').join() === SCR_COLS.join()), spelled, smiles: HF.smiles.size };
  });
  check('H16', 'the example has 72 compounds in 5 screens', r.compounds === 72 && r.screens === 5, r);
  check('H16', 'every record is schema echo-screen/1 with exactly the SCR_COLS', r.schema && r.keys, r);
  const p1 = r.by['EX-HB-BRD4'] || {};
  check('H16', 'the primary screen has its hookers (8, hook left out of the fit) and a compound that could not be fitted', p1.hook && p1.hook.excluded === 8 && p1.unfit === 3, p1);
  check('H16', 'bounds and flat curves are qualifiers, not numbers (>, <, n.d.)', p1.q && p1.q['>'] > 0 && p1.q['<'] > 0 && p1.q['n.d.'] > 0 && p1.q.exact > 0, p1.q);
  check('H16', 'a compound spelled HF-001 / hf-001 / HF_001 is one compound (72, not more)', r.spelled > 0 && r.compounds === 72, r);
});

if (run('H17')) await guard('H17', async () => {
  const r = await E(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const sel = () => $$('.tab[aria-selected="true"]').map(t => t.dataset.tab);
    const o = { start: sel() };
    const key = k => $('#hf-tabs').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    key('ArrowRight'); o.right = sel(); key('End'); o.end = sel(); key('Home'); o.home = sel(); key('ArrowLeft'); o.left = sel();
    hfTab('hits'); await wait(350);
    const a = $('.tab.active'), ink = $('#hf-ink'), m = (ink.style.transform.match(/translateX\(([\d.]+)px\) scaleX\(([\d.]+)\)/) || []);
    o.ink = { dx: Math.abs(+m[1] - a.offsetLeft), dw: Math.abs(+m[2] - a.offsetWidth) };
    o.panes = $$('.tabpane.active').map(p => p.id);
    hfTab('screens');
    return o;
  });
  check('H17', 'exactly one tab is selected at the start', JSON.stringify(r.start) === '["screens"]', r.start);
  check('H17', 'ArrowRight / End / Home / ArrowLeft move and select', JSON.stringify(r.right) === '["criteria"]' && JSON.stringify(r.end) === '["export"]' && JSON.stringify(r.home) === '["screens"]' && JSON.stringify(r.left) === '["export"]', r);
  check('H17', 'the underline sits under the active tab; exactly one pane shows', r.ink.dx < 1.5 && r.ink.dw < 1.5 && JSON.stringify(r.panes) === '["pane-hits"]', r);
});

await browser.close();
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
skipped.forEach(s => console.log('  – skipped: ' + s));
const realErrs = pageErrs.filter(e => !/Failed to load resource|net::ERR/i.test(e));
if (realErrs.length) { console.log('  ✗ page errors:'); [...new Set(realErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + realErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Hit Finder invariants hold.');
process.exit(failed ? 1 : 0);
