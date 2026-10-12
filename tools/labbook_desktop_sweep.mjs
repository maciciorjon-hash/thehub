// Labbook on a laptop — every screen and dialog, in its real frame inside dHUB, at the window sizes people have, in both themes.
//
// tools/mobile_sweep.mjs does this for a phone; tools/desktop_sweep.mjs does it for Echo and Lumina. Labbook, the app opened most,
// had no desktop sweep at all, and the 2026-10-12 audit found what that costs: dialogs whose Done / Print buttons hung below the
// window at 1366x680, a Week whose columns were crushed to 27 px so a step's name broke every third letter, setup labels cut
// with an ellipsis, plate captions broken inside a word on paper. Each is a fixed rule now (tools/invariants.mjs I27, B28–B32, R9);
// this is what looks for the next one.
//
// The notebook is built here, from the presets, so nothing depends on anybody's real data: a SPARK screen due today, a viability run
// part-way through, a finished biosensor run, a Western. Each screen is then measured with the detectors the other sweeps use
// (overlap · covered · clipped · sideways · tiny) plus the in-page runtime, alignment and escape audits.
//
//   python3 embed.py dist/index.html && (cd dist && python3 -m http.server 8899 &)
//   node tools/labbook_desktop_sweep.mjs [--url=http://127.0.0.1:8899/index.html] [--sizes=1440x900,1280x720,1024x768] [--themes=light,dark]
//        [--only=week,exp_planned] [--shots=DIR] [--verbose]
//
// `truncated:` findings (a label cut by an ellipsis) are listed with --verbose and never fail the run: a name in a list may ellipse. The
// ones that lost something a person needs were fixed by letting them wrap, and a short label that is cut again shows up in the Hub sweeps.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { DETECT, FIREBASE_STUB } from './mobile_hub_sweep.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const URL0 = args.url || 'http://127.0.0.1:8899/index.html';
const SIZES = String(args.sizes || '1440x900,1280x720,1024x768').split(',').map(s => s.split('x').map(Number));
const THEMES = String(args.themes || 'light,dark').split(',');
const ONLY = args.only ? String(args.only).split(',') : null;
const SHOTS = args.shots ? String(args.shots) : null;
const VERBOSE = !!args.verbose;
const here = path.dirname(new URL(import.meta.url).pathname);
const T = f => fs.readFileSync(path.join(here, f), 'utf8');
const AUDITS = ['audit_runtime.js', 'audit_align.js'].map(T);
const ESC_SRC = T('audit_escape.js').replace(/window\.__escapeAudit\(\);\s*$/, '');
// .wk-grid: the Week scrolls sideways below 7 columns of 118 px rather than crushing them — a design choice, not a hidden overflow.
const ESC_OPTS = JSON.stringify({ allowScroll: '.wk-grid,.results-tbl-scroll,.hits-scroll,.fig-shell,.crop-area,.eg-tblwrap,.eg-scroll,.sq-scroll' });
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

// The notebook, in the page: four runs from the presets, one of them ticked through and closed.
const SEED = `(function(){
  var P=(LB.data.projects||[]).find(function(p){ return (p.sections||[]).length; }), S=P.sections[0], out={};
  function mk(key,code,start,setup){
    var tpl=LB.data.presets[key]; if(!tpl) return null;
    var su=Object.assign({},setupDefaultsFor(key),JSON.parse(JSON.stringify(tpl.setup||{})),setup||{});
    var before={}; Object.keys(LB.data.experiments).forEach(function(k){ before[k]=1; });
    buildExperimentFrom({pid:P.id,sid:S.id,key:key,tpl:tpl,startDate:start,type:presetBase(key),title:tpl.title||key,code:code,setup:su,plate:true});
    return Object.values(LB.data.experiments).filter(function(x){ return !before[x.id]; })[0]||null; }
  function day(n){ return addDays(todayStr(),n); }
  out.spark=mk('NB_SPARK_SCREEN96','SW_NB_SPARK',day(0),{nConc:3,nReps:2,topUM:100,df:3});
  out.ctg=mk('CTG','SW_CTG',day(-2));
  out.bio=mk('NB_BIO_RTX96','SW_NB_BIO',day(-6));
  out.wb=mk('WB','SW_WB',day(-1));
  [out.ctg,out.bio].forEach(function(e,i){ if(!e) return; (e.blocks||[]).forEach(function(b,j){ if(i===1||j<1){ b.done=true; b.completedAt=Date.now()-86400000; } }); });
  if(out.bio){ out.bio.status='done'; out.bio.outcome={verdict:'worked',text:'Sweep fixture.'}; out.bio.aim='Does the sweep fixture render?'; }
  save();
  var ids={}; Object.keys(out).forEach(function(k){ if(out[k]) ids[k]=out[k].id; }); return ids; })()`;
const OPEN = k => `openExp(window.__SW.${k})`;
const SCENES = [
  ['home', `selectNode('home')`],
  ['today', `openDayPage(todayStr())`],
  ['week', `selectNode('week')`],
  ['exps', `selectNode('exps')`],
  ['exp_planned', OPEN('spark')],
  ['exp_planned_report', OPEN('spark') + `;setTimeout(function(){ REPORT_OPEN=true; renderAll(); expTab('report'); },50)`],
  ['exp_running', OPEN('ctg')],
  ['exp_done', OPEN('bio')],
  ['exp_wb', OPEN('wb')],
  ['plate_editor', `openPlateEditor('exp:'+window.__SW.spark)`, `closePlateEditor()`],
  ['new_exp', `(function(){ var p=LB.data.projects.filter(function(x){ return (x.sections||[]).length; })[0]; selectNode('expsec',p.id,p.sections[0].id); openNew(); })()`, `closeNew()`],
  ['designer', `selectNode('design')`],
  ['setup_editor', `openSetupEditor(window.__SW.spark)`, `closeSetupEditor()`],
  ['prep_sheet', `openPrepSheet({expId:window.__SW.spark})`],
  ['pdf_export', `openPdfExport({kind:'exp',id:window.__SW.spark})`],
  ['spot', `openSpot()`, `closeSpot()`],
  ['recover', `openRecover()`],
  ['settings', `openSettings()`],
  ['export_menu', `exportMenu()`],
];

const browser = await chromium.launch();
const findings = [], advisory = [];
let screens = 0;
for (const [w, h] of SIZES) for (const theme of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-app-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: FIREBASE_STUB }));
  await ctx.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-(auth|database|storage)-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: '' }));
  await ctx.route(/firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage/, r => r.abort());
  await ctx.addInitScript(t => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('hub_theme', t); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|fonts\.g/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await page.goto(URL0, { timeout: 120000 }); await page.waitForTimeout(1500);
  await page.evaluate(() => openApp('labbook')); await page.waitForTimeout(1800);
  const fr = await (await page.$('#frame-labbook')).contentFrame();
  await fr.evaluate(() => { document.querySelectorAll('.modal-back.open').forEach(x => x.classList.remove('open')); window.lbAlert = () => Promise.resolve(); });
  await fr.evaluate(`window.__SW=${SEED}`);
  await fr.evaluate(DETECT); await fr.evaluate(AUDITS[0]); await fr.evaluate(AUDITS[1]);
  for (const [name, how, cleanup] of SCENES) {
    if (ONLY && !ONLY.includes(name)) continue;
    screens++;
    const tag = `${w}x${h} ${theme}`;
    try {
      await fr.evaluate(h2 => { void (0, eval)('(function(){ ' + h2 + '\n})()'); }, how);   // statements allowed; a returned promise is not waited on
      await page.waitForTimeout(900);
      const r = await fr.evaluate(([o, escSrc, escOpts]) => {
        const det = window.__hub.detect(o);
        let rt = []; try { rt = (window.__runtimeAudit && window.__runtimeAudit({ accentInk: o.ai })) || []; } catch (e) { rt = ['runtime audit threw ' + e.message]; }
        let al = []; try { al = (window.__alignAudit && window.__alignAudit()) || []; } catch (e) { al = ['align audit threw ' + e.message]; }
        let es = []; try { (0, eval)(escSrc); es = window.__escapeAudit(JSON.parse(escOpts)); } catch (e) { es = ['escape audit threw ' + e.message]; }
        return { det, rt: Array.isArray(rt) ? rt : (rt.errors || []), al, es };
      }, [{ minFont: 10, ai: theme === 'dark' ? 4.5 : 3 }, ESC_SRC, ESC_OPTS]);
      const add = (k, arr) => (arr || []).forEach(m => { const row = { tag, name, k, m: String(m).slice(0, 300) }; (k === 'detect' && /^truncated:/.test(m) ? advisory : findings).push(row); });
      add('detect', r.det); add('runtime', r.rt); add('align', r.al); add('escape', r.es);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${w}x${h}_${theme[0]}_${name}.png`) });
    } catch (e) { findings.push({ tag, name, k: 'harness', m: String(e).slice(0, 300) }); }
    try { await fr.evaluate(c => { document.querySelectorAll('.modal-back.open,#spot-back.open,.pop.open').forEach(x => x.classList.remove('open')); try { if (c) (0, eval)(c); } catch (e) {} }, cleanup || ''); } catch (e) {}
  }
  errs.forEach(m => findings.push({ tag: `${w}x${h} ${theme}`, name: 'run', k: 'console', m }));
  await ctx.close();
  process.stdout.write(`  ${w}x${h} ${theme}: ${findings.filter(f => f.tag === `${w}x${h} ${theme}`).length} findings\n`);
}
await browser.close();

const group = rows => { const by = new Map(); for (const f of rows) { const k = `${f.name}|${f.k}|${f.m}`; if (!by.has(k)) by.set(k, { ...f, at: [] }); by.get(k).at.push(f.tag); } return [...by.values()]; };
const rows = group(findings);
console.log(`\n${screens} screens measured, ${rows.length} distinct findings (${advisory.length ? group(advisory).length + ' truncation notes' : 'no truncation notes'})`);
rows.forEach(r => console.log(`  ✗ [${r.name}] ${r.k}: ${r.m}  (${[...new Set(r.at)].join(', ')})`));
if (VERBOSE) group(advisory).forEach(r => console.log(`  · [${r.name}] ${r.m}  (${[...new Set(r.at)].join(', ')})`));
process.exit(rows.length ? 1 : 0);
