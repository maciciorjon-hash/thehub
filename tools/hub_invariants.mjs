// Shell invariants — things about the Hub's own chrome that a person sees on every visit.
//
//   S1  fixed order       the Data Analysis landing lists its apps in the declared order, however
//                         recently or often each was opened (it used to lead with the last opened)
//   S2  clean cards       no app card carries a tag line ("HiBiT · FP · DC50"); each says what it is in one
//                         sentence, and no description is cut on a landing at 1440px
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

for (const e of errs) bad('page', e);
await browser.close();
for (const f of findings) console.log(f);
console.log(`\n${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
