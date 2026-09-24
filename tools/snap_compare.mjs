// Pixel-identical-or-not, before and after a refactor.
//
// Renders a fixed set of Labbook screens at a set of widths into PNGs, or compares two such
// sets byte for byte. A CSS move that is meant to be behaviour-neutral (the breakpoint merge)
// is proven by an identical set; a change that is meant to touch phones only is proven by the
// desktop widths staying identical. External requests are blocked so the fonts cannot differ
// between runs.
//
//   node tools/snap_compare.mjs snap  DIR [--url=URL] [--widths=375,600,700,760,1024,1440]
//   node tools/snap_compare.mjs diff  DIR_A DIR_B
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [mode, A, B, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.concat(process.argv.slice(2).filter(a => a.startsWith('--'))).map(a => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a, true]; }));
const URL0 = opt.url || 'http://127.0.0.1:8899/apps/labbook/labbook.html';
const WIDTHS = String(opt.widths || '375,600,700,760,1024,1440').split(',').map(Number);

const SEED = fs.readFileSync(new URL('./mobile_sweep.mjs', import.meta.url), 'utf8').match(/const SEED = `([\s\S]*?)`;\n/)[1];

function screensFor(ids) {
  return {
    home: `selectNode('home')`,
    exps: `selectNode('exps')`,
    journal: `selectNode('journal'); DAY_VIEW=null; renderEditor()`,
    week: `selectNode('week')`,
    exp: `openExp('${ids[0]}'); expTab('dated')`,
    'exp-results': `openExp('${ids[0]}'); expTab('res')`,
    drawer: `openExp('${ids[0]}'); toggleMobileNav(true)`,
    menu: `openExp('${ids[0]}'); var b=LB.data.experiments['${ids[0]}'].blocks[0]; var t=document.querySelector('.blk-more'); ctxBlock({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, b.id)`,
    'dialog-new': `var p=LB.data.projects[0]; selectNode('expsec',p.id,p.sections[0].id); openNew()`,
    plate: `openExp('${ids[0]}'); openPlateEditor('exp:${ids[0]}')`,
    settings: `openSettings()`,
    prep: `openExp('${ids[0]}'); openPrepSheet({expId:'${ids[0]}'})`,
  };
}

async function snap(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  for (const W of WIDTHS) {
    const H = W <= 760 ? 780 : 900;
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: W <= 760, isMobile: W <= 760, deviceScaleFactor: 1 });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_lean', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    // A fixed clock: the day plan prints wall-clock times and a timer counts down, and two
    // runs a minute apart must not differ because of it.
    await page.clock.setFixedTime(new Date('2026-09-13T10:00:00'));
    await page.goto(URL0 + '?_ts=' + Date.now());
    await page.waitForFunction(() => window.LB && window.renderAll);
    await page.addStyleTag({ content: '*{transition:none!important;animation:none!important;caret-color:transparent!important}' });
    // Fixed clock, so "today" and the timers render the same in both runs.
    const ids = await page.evaluate(SEED);
    await page.waitForTimeout(300);
    for (const [name, code] of Object.entries(screensFor(ids))) {
      await page.evaluate(`(function(){ try{ document.querySelectorAll('.pop.open,.modal-back.open').forEach(function(n){n.classList.remove('open');}); document.body.classList.remove('mobile-drawer-open','mobile-dock-open','lb-sheet-open'); if(window.closePlateEditor) closePlateEditor(); }catch(e){} })()`);
      try { await page.evaluate(`(function(){ ${code} })()`); } catch (e) { console.error(W, name, 'drive threw', e.message); }
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, `${W}-${name}.png`), fullPage: false });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('snapped', fs.readdirSync(dir).length, 'files into', dir);
}

function diff(a, b) {
  const fa = fs.readdirSync(a).filter(f => f.endsWith('.png')).sort();
  let same = 0, differ = [];
  for (const f of fa) {
    const pa = path.join(a, f), pb = path.join(b, f);
    if (!fs.existsSync(pb)) { differ.push(f + ' (missing in B)'); continue; }
    if (fs.readFileSync(pa).equals(fs.readFileSync(pb))) same++; else differ.push(f);
  }
  console.log(`${same} identical, ${differ.length} differ`);
  differ.forEach(f => console.log('  ≠ ' + f));
  process.exit(differ.length ? 1 : 0);
}

if (mode === 'snap') snap(A).catch(e => { console.error(e); process.exit(2); });
else if (mode === 'diff') diff(A, B);
else { console.log('usage: snap DIR | diff DIR_A DIR_B'); process.exit(2); }
