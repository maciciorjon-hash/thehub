// Ribbon studio — a visual sweep of every pane and popup with a real, busy structure on screen.
//
// The Hub sweep sees Ribbon at rest with 1CRN; this one opens 5T35 (two copies of a ternary complex with MZ1), runs the
// analyses, puts the sequence bar, a selection, a measurement and a second structure on screen, and then visits every tab,
// the command line's suggestions and help, the chain popup, Export and the multi-panel dialog — at desktop and phone sizes,
// light and dark — running the escape, runtime and alignment audits on each screen and saving a screenshot.
//
//   node tools/ribbon_visual.mjs [--out=DIR] [--sizes=1440x900,1024x768,390x844] [--themes=light,dark] [--shots]
//
// Needs the network (RCSB). Prints one line per finding and exits 1 if there are any.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const SIZES = String(args.sizes || '1440x900,1024x768,390x844').split(',').map(s => s.split('x').map(Number));
const THEMES = String(args.themes || 'light,dark').split(',');
const OUT = args.out ? path.resolve(String(args.out)) : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const AUD = ['audit_escape.js', 'audit_runtime.js', 'audit_align.js'].map(f => fs.readFileSync(path.join(ROOT, 'tools', f), 'utf8').replace(/window\.__(escape|runtime|align)Audit\(\);\s*$/, '')).join(';\n');
const ESC_OPTS = { allowScroll: '.sq-scroll,.cmd-pop,.rb-pane' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const findings = [];
try {
  for (let t = 0; t < 40; t++) { try { if ((await fetch(base)).ok) break; } catch (e) {} await sleep(150); }
  const browser = await chromium.launch();
  for (const [W, H] of SIZES) for (const theme of THEMES) {
    const phone = W < 761 || H < 521;   // a phone held sideways is a phone
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
    await ctx.addInitScript(th => { try { localStorage.setItem('hub_theme', th); localStorage.removeItem('ribbon_last'); } catch (e) {} }, theme);
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 160)));
    await pg.goto(base + 'apps/ribbon/ribbon.html', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.viewer, null, { timeout: 40000 });
    await pg.evaluate(() => { document.getElementById('pdbInput').value = '5T35'; handleSubmit(); });
    await pg.waitForFunction(() => window.currentModel && currentPdbId === '5T35' && !document.getElementById('fetchBtn').disabled, null, { timeout: 40000 });
    await sleep(1500);
    // a busy figure: the analyses, the sequence, a selection, a measurement, a second structure
    await pg.evaluate(async () => {
      ['interactions', 'lysines', 'pockets', 'clashes A D', 'select within 5 of ligand', 'label chain A "BRD4 BD2"', 'scalebar on', 'axes on'].forEach(c => { try { runCommand(c); } catch (e) {} });
      if (typeof seqToggle === 'function' && !SEQ.on) seqToggle();
      state.measures.push({ id: 'mv1', kind: 'dist', pts: [{ c: 'A', r: 97, n: 'CA' }, { c: 'B', r: 54, n: 'CA' }] }); recolorStructure();
      try { addOverlay('5T35'); } catch (e) {}
    });
    await sleep(3500);
    const tag = `${W}x${H} ${theme}`;
    const audit = async (name) => {
      await sleep(350);
      const r = await pg.evaluate(o => { const out = []; try { out.push(...window.__escapeAudit({ allowScroll: o.allowScroll }).map(m => 'escape: ' + m)); } catch (e) { out.push('escape threw ' + e.message); } try { out.push(...(window.__runtimeAudit({ accentInk: o.ink }) || [])); } catch (e) {} try { out.push(...(window.__alignAudit() || [])); } catch (e) {} return out; }, { ...ESC_OPTS, ink: theme === 'dark' ? 4.5 : 3 });
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 1) r.push('page scrolls sideways by ' + ov + 'px');
      r.forEach(m => findings.push(`${tag} · ${name}: ${m}`));
      if (OUT && args.shots) await pg.screenshot({ path: path.join(OUT, `${W}x${H}-${theme}-${name}.png`) });
    };
    await pg.evaluate(AUD);
    for (const tab of ['open', 'models', 'colour', 'analyse', 'figure', 'designs']) {
      await pg.evaluate(t => { rbTab(t); document.querySelectorAll('.rb-pane[data-tab="' + t + '"] details.rb-sec').forEach(d => { d.open = true; }); }, tab);
      await audit('tab-' + tab);
      if (phone) {   // the sheet scrolled to its foot
        await pg.evaluate(() => { const p = document.querySelector('.rb-panel'); if (p) p.scrollTop = p.scrollHeight; document.querySelectorAll('.rb-pane').forEach(x => { x.scrollTop = x.scrollHeight; }); });
        await audit('tab-' + tab + '-end');
        await pg.evaluate(() => { const p = document.querySelector('.rb-panel'); if (p) p.scrollTop = 0; document.querySelectorAll('.rb-pane').forEach(x => { x.scrollTop = 0; }); });
      }
    }
    // the command line: suggestions and help
    await pg.evaluate(ph => { if (ph) cmdShow(true); }, phone);
    await sleep(200);
    await pg.evaluate(() => { const i = document.getElementById('cmdInput'); i.focus(); i.value = 'color lig'; i.dispatchEvent(new Event('input')); });
    await audit('cmd-suggest');
    await pg.evaluate(() => { const i = document.getElementById('cmdInput'); i.value = ''; i.dispatchEvent(new Event('input')); runCommand('help'); });
    await audit('cmd-help');
    await pg.evaluate(ph => { document.getElementById('cmdPop').hidden = true; document.getElementById('cmdInput').blur(); if (ph) cmdShow(false); }, phone);
    // the chain popup, Export, the multi-panel dialog
    await pg.evaluate(() => { rbTab('models'); const row = document.querySelector('#chainList [data-chain], #chainList .chain-row, #chainList button'); openChainPopup('A', row || document.getElementById('chainList')); });
    await audit('chain-popup');
    await pg.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); if (typeof closeChainPopup === 'function') closeChainPopup(); });
    await pg.evaluate(() => openExport()); await audit('export');
    await pg.evaluate(() => { if (typeof closeExport === 'function') closeExport(); });
    await pg.evaluate(() => { try { document.getElementById('designName').value = 'Visual sweep'; saveDesign(); } catch (e) {} try { openPanels(); } catch (e) {} });
    await audit('panels');
    await pg.keyboard.press('Escape');
    errs.forEach(e => findings.push(`${tag}: page error ${e}`));
    await ctx.close();
    console.log('done', tag);
  }
  await browser.close();
} finally { srv.kill(); }
const uniq = [...new Set(findings)];
uniq.forEach(f => console.log('  ✗ ' + f));
console.log(uniq.length ? `\n${uniq.length} finding(s).` : '\nRibbon studio looks right on every screen.');
process.exit(uniq.length ? 1 : 0);
