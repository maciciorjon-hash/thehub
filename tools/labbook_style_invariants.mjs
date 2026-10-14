// Labbook looks like one product — the classes of inconsistency Jon found by eye, as checks that run every time.
//
// 2026-10-13: "check los experimentos visualmente, tamaños de letra, ticks, dibujos, líneas, cuadros… homogeneiza todo".
// Each check below is a CLASS of difference that was on screen at once — measured, not looked at — and each was proven by
// putting the old rule back (see the notes in docs/CLAUDE_REFERENCE.md › *Labbook, one hand*):
//
//   T1  one tick            a step / week / protocol tick is a circle of one size per role, carries no ✓ glyph, and a
//                           done one is accent-filled and draws the same mask check (it was three shapes, six sizes, and
//                           a ✓ from whichever font was nearest, in a literal #5e87c5 that stayed light blue in dark)
//   T2  one checkbox        every checkbox is the same 16px square drawn with the same check
//   T3  one section heading Setup, Steps, Observations, Files, Report share size / weight / colour and a rule under them
//   T4  setup cells align   the values of one row of the Setup grid share a baseline however long the labels are
//   T5  one left edge       the experiment's action rows start at the same x, and the first icon stands under the title
//   T6  no typed chevrons   no ‹ › glyph button, and no text off the nine-step type scale (an 18px ‹ ›)
//   T7  no ▸ on a toggle    "+ Add plate" and "Fold done days" disclose nothing
//   T8  one height per kind small bordered chips are 24, icon / row buttons 28, toolbar controls 32 (--tb-h)
//   T9  one step title      a step's name is the same size in the experiment and in the Journal
//   T10 week banner         "Still outstanding" sits on the grid's margins, not the pane's edge
//   T11 day header          the plan chip is a chip on the day's line, not a bar across the page
//   T12 tick is flush       the first tick of a day starts where the section headings and the rules do
//   T13 designer foot       a row of design cards has its buttons on one line
//   T14 drawn marks         an outcome's mark (chip, list, band, picker) is an svg, never a typed ✓ × ~ ?
//
//   node tools/labbook_style_invariants.mjs [--url=URL] [--only=T1,T5]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('server did not come up: ' + url); }

// The notebook, in the page: four runs from the presets (the same fixture tools/labbook_desktop_sweep.mjs uses).
const SEED = `(function(){
  var P=(LB.data.projects||[]).find(function(p){ return (p.sections||[]).length; }), S=P.sections[0], out={};
  function mk(key,code,start,setup){
    var tpl=LB.data.presets[key]; if(!tpl) return null;
    var su=Object.assign({},setupDefaultsFor(key),JSON.parse(JSON.stringify(tpl.setup||{})),setup||{});
    var before={}; Object.keys(LB.data.experiments).forEach(function(k){ before[k]=1; });
    buildExperimentFrom({pid:P.id,sid:S.id,key:key,tpl:tpl,startDate:start,type:presetBase(key),title:tpl.title||key,code:code,setup:su,plate:true});
    return Object.values(LB.data.experiments).filter(function(x){ return !before[x.id]; })[0]||null; }
  function day(n){ return addDays(todayStr(),n); }
  out.spark=mk('NB_SPARK_SCREEN96','ST_NB_SPARK',day(0),{nConc:3,nReps:2,topUM:100,df:3});
  /* three days before this week's Monday: a step left over from last week on every weekday (day(-2) was last week only on Mon/Tue, so T10 had nothing to measure from Wednesday on) */
  out.ctg=mk('CTG','ST_CTG',addDays(wkMonday(todayStr()),-3));
  out.bio=mk('NB_BIO_RTX96','ST_NB_BIO',day(-6));
  out.wb=mk('WB','ST_WB',day(-1));
  [out.ctg,out.bio].forEach(function(e,i){ if(!e) return; (e.blocks||[]).forEach(function(b,j){ if(i===1||j<1){ b.done=true; b.completedAt=Date.now()-86400000; } }); });
  if(out.bio){ out.bio.status='done'; out.bio.outcome={verdict:'worked',text:'Fixture.'}; out.bio.aim='Does the fixture render?'; }
  var D=todayStr(); addPlannerTask(D,'Order plasmid prep kit'); addPlannerTask(D,'Book the plate reader');
  var ts=plannerTasks(); var first=Object.keys(ts)[0]; if(first) togglePlannerTask(first);
  save();
  var ids={}; Object.keys(out).forEach(function(k){ if(out[k]) ids[k]=out[k].id; }); return ids; })()`;

// What every check shares, inside the page.
const LIB = `(function(){
  var FS={10:1,11:1,12:1,13:1,15:1,17:1,20:1,26:1,38:1};
  window.__st={
    vis:function(e){ var r=e.getBoundingClientRect(); if(!r.width||!r.height) return false; var cs=getComputedStyle(e); return cs.visibility!=='hidden'&&cs.display!=='none'; },
    cls:function(e){ var c=(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)||''; return e.tagName.toLowerCase()+(c?'.'+String(c).trim().split(/\\s+/).join('.'):''); },
    color:function(v){ var p=document.createElement('i'); p.style.cssText='position:fixed;left:-99px;background-color:'+v; document.body.appendChild(p); var c=getComputedStyle(p).backgroundColor; p.remove(); return c; },
    all:function(sel,root){ return [].slice.call((root||document).querySelectorAll(sel)).filter(window.__st.vis); },
    quiet:function(){ document.querySelectorAll('*').forEach(function(e){ e.style.transition='none'; }); },
    off:function(root){ var out=[]; root.querySelectorAll('*').forEach(function(e){ if(e.closest('svg,.pp-grid,.pl-grid')||!window.__st.vis(e)) return;   /* text drawn inside a picture (a plate well) is sized against the picture */
      var own=''; for(var i=0;i<e.childNodes.length;i++) if(e.childNodes[i].nodeType===3) own+=e.childNodes[i].nodeValue; own=own.trim(); if(!own) return;
      var fs=Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10; if(!FS[fs]) out.push(window.__st.cls(e)+' '+fs+'px "'+own.slice(0,16)+'"'); }); return out; }
  };
  window.__st.quiet(); return true; })()`;

const SCENES = {
  exp_planned: `openExp(window.__SW.spark)`,
  exp_running: `openExp(window.__SW.ctg)`,
  exp_done: `openExp(window.__SW.bio)`,
  journal_day: `openDayPage(todayStr())`,
  planner_today: `selectNode('journal')`,
  week: `selectNode('week')`,
  exps: `selectNode('exps')`,
  designer: `selectNode('design')`,
  new_exp: `(function(){ var p=LB.data.projects.filter(function(x){ return (x.sections||[]).length; })[0]; selectNode('expsec',p.id,p.sections[0].id); openNew(); })()`,
  setup_editor: `openSetupEditor(window.__SW.spark)`,
  pdf_export: `openPdfExport({kind:'exp',id:window.__SW.spark})`,
  outcome_picker: `askOutcome(window.__SW.spark)`,
};

// Each check: which scenes, and a function (run in the page) returning a list of findings.
const CHECKS = [
  ['T1', ['exp_planned', 'exp_running', 'exp_done', 'journal_day', 'planner_today', 'week'], `(function(){ var S=__st, bad=[], html=document.documentElement, was=html.getAttribute('data-theme');
    ['light','dark'].forEach(function(th){ html.setAttribute('data-theme',th); S.quiet(); var ACC=S.color('var(--accent)');
      S.all('.blk-done,.wk-cb,.pstep-tick').forEach(function(e){ var cs=getComputedStyle(e), r=e.getBoundingClientRect(), c=S.cls(e)+' ('+th+')';
        if(!(cs.borderTopLeftRadius==='50%'||parseFloat(cs.borderTopLeftRadius)>=r.width/2-.5)) bad.push(c+' is not a circle ('+cs.borderTopLeftRadius+')');
        if((e.textContent||'').trim()) bad.push(c+' carries a glyph "'+e.textContent.trim()+'" instead of the drawn check');
        var want=e.closest('.bench-row')?28:(e.classList.contains('blk-done')?20:16);
        if(Math.abs(r.width-want)>.6||Math.abs(r.height-want)>.6) bad.push(c+' is '+r.width+'x'+r.height+', a tick here is '+want);
        var on=e.classList.contains('on')||!!e.closest('.nbt.done,.wk-blk.done,.wk-task.done');
        if(on){ var af=getComputedStyle(e,'::after'); if(!/url\\(/.test(af.webkitMaskImage||af.maskImage||'')) bad.push(c+' is done and draws no check');
          if(cs.backgroundColor!==ACC) bad.push(c+' is done but filled '+cs.backgroundColor+', not the accent '+ACC); } }); });
    html.setAttribute('data-theme',was||'light'); S.quiet(); return bad.slice(0,8); })()`],
  ['T2', ['new_exp', 'setup_editor', 'pdf_export'], `(function(){ var S=__st, bad=[];
    S.all('input[type=checkbox]').forEach(function(e){ var cs=getComputedStyle(e), r=e.getBoundingClientRect();
      if(cs.appearance!=='none'&&cs.webkitAppearance!=='none') bad.push(S.cls(e)+' is the browser checkbox');
      if(Math.abs(r.width-16)>.6||Math.abs(r.height-16)>.6) bad.push(S.cls(e)+' is '+r.width+'x'+r.height+', a checkbox is 16x16'); }); return bad; })()`],
  ['T3', ['exp_planned', 'exp_done'], `(function(){ var S=__st, bad=[], seen={}, ref=null;
    S.all('.exp-sec-h').forEach(function(h){ var t=h.querySelector('.exp-sec-t'); if(!t) return; var cs=getComputedStyle(t), k=cs.fontSize+'/'+cs.fontWeight+'/'+cs.color;
      seen[t.textContent.trim()]=k; if(ref===null) ref=k; if(k!==ref) bad.push('"'+t.textContent.trim()+'" is '+k+' where the first heading is '+ref);
      if(parseFloat(getComputedStyle(h).borderBottomWidth)<1) bad.push('"'+t.textContent.trim()+'" has no rule under it'); });
    ['Setup','Steps','Observations','Files','Report'].forEach(function(n){ if(!seen[n]) bad.push('no "'+n+'" section heading'); }); return bad; })()`],
  ['T4', ['exp_planned', 'exp_done'], `(function(){ var S=__st, bad=[], rows={};
    S.all('.exh-setup-i').forEach(function(c){ var k=Math.round(c.getBoundingClientRect().top/4); (rows[k]=rows[k]||[]).push(c); });
    Object.keys(rows).forEach(function(k){ var cells=rows[k]; if(cells.length<2) return; var bs=cells.map(function(c){ return Math.round(c.querySelector('span').getBoundingClientRect().bottom); });
      if(Math.max.apply(null,bs)-Math.min.apply(null,bs)>1) bad.push('a Setup row has values at '+bs.join(', ')+' — its labels wrap differently and the values do not share a line'); });
    if(S.all('.exh-setup-i').length&&!S.all('.exh-setup-hd.exp-sec-h').length) bad.push('Setup is not a section heading');
    var cs=S.all('.exh-setup-i'); cs.forEach(function(c){ if(parseFloat(getComputedStyle(c).borderBottomWidth)>0) bad.push('a Setup cell draws its own rule (it stops short under an incomplete last row)'); }); return bad.slice(0,6); })()`],
  ['T5', ['exp_planned', 'exp_running', 'exp_done'], `(function(){ var S=__st, bad=[], rows={};
    S.all('.exh-exp .exh-top .exh-grp .exh-act').forEach(function(b){ var r=b.getBoundingClientRect(); var k=Math.round(r.top/12); (rows[k]=rows[k]||[]).push(r.left); });
    var lefts=Object.keys(rows).map(function(k){ return Math.min.apply(null,rows[k]); });
    if(lefts.length>1&&Math.max.apply(null,lefts)-Math.min.apply(null,lefts)>1) bad.push('the action rows start at x '+lefts.map(Math.round).join(' / ')+' — they should share one left edge');
    var t=document.querySelector('.exh-exp .exh-title'), a=S.all('.exh-exp .exh-top .exh-grp .exh-act svg')[0];
    if(t&&a){ var d=a.getBoundingClientRect().left-t.getBoundingClientRect().left; if(d<-1||d>9) bad.push('the first action icon is '+Math.round(d)+'px from the title edge'); }
    return bad; })()`],
  ['T6', ['exp_planned', 'exp_running', 'exp_done', 'journal_day', 'planner_today', 'week', 'exps', 'designer', 'new_exp'], `(function(){ var S=__st, bad=[];
    S.all('button').forEach(function(b){ var t=(b.textContent||'').trim(); if(/^[‹›<>«»]$/.test(t)) bad.push(S.cls(b)+' draws "'+t+'" as text; use the chevron svg'); });
    var root=document.querySelector('.modal-back.open')||document.body; S.off(root).forEach(function(x){ bad.push('off the type scale: '+x); }); return bad.slice(0,8); })()`],
  ['T7', ['exp_planned', 'exp_running', 'exp_done'], `(function(){ var S=__st, bad=[];
    S.all('.lean-tog').forEach(function(b){ var c=getComputedStyle(b,'::before').content; if(c&&c!=='none'&&c!=='normal'&&c!=='""') bad.push(S.cls(b)+' "'+b.textContent.trim()+'" has a glyph '+c+' in front of it'); }); return bad; })()`],
  ['T8', ['exp_planned', 'exp_running', 'exp_done', 'journal_day', 'week', 'exps'], `(function(){ var S=__st, bad=[];
    var H={'.lean-tog':24,'.dfx-open':24,'.dfx-snooze:not(.bench-photo):not(.bench-more)':24,'.jr-today':24,'.xv-add':24,
           '.exh-act':28,'.bench-photo':28,'.bench-more':28,'.blk-wait':28,'.rep-x':28,'.pub-btn':28,
           '.xv-q':32,'.xv-filters':32,'.xv-top > .xv-f':32,'.xv-new':32,'.wk-nav > button':32,'.wk-nav .jr-seg':32};
    Object.keys(H).forEach(function(s){ S.all(s).forEach(function(e){ var h=e.getBoundingClientRect().height; if(Math.abs(h-H[s])>1.2) bad.push(S.cls(e)+' "'+(e.textContent||'').trim().slice(0,14)+'" is '+Math.round(h)+'px high, '+s+' is '+H[s]); }); });
    return bad.slice(0,8); })()`],
  ['T9', ['exp_running', 'journal_day'], `(function(){ var S=__st, bad=[];
    S.all('.dfx-blk-t,.dfx-blk-t2').forEach(function(e){ var fs=getComputedStyle(e).fontSize, fw=getComputedStyle(e).fontWeight; if(fs!=='15px'||+fw<600) bad.push('a step title is '+fs+'/'+fw+' in '+S.cls(e.parentElement)+', it is 15px/600 everywhere'); }); return bad.slice(0,4); })()`],
  ['T10', ['week'], `(function(){ var S=__st, bad=[]; var od=S.all('.wk-od')[0], cols=S.all('.wk-col'); if(!od||!cols.length) return ['the Week fixture has no outstanding step to measure'];
    var a=od.getBoundingClientRect(), f=cols[0].getBoundingClientRect(), l=cols[cols.length-1].getBoundingClientRect();
    if(Math.abs(a.left-f.left)>1.5||Math.abs(a.right-l.right)>1.5) bad.push('the outstanding banner spans '+Math.round(a.left)+'–'+Math.round(a.right)+' and the grid '+Math.round(f.left)+'–'+Math.round(l.right)); return bad; })()`],
  ['T11', ['exp_done'], `(function(){ var S=__st, bad=[]; S.all('.bench-day').forEach(function(h){ var p=h.querySelector('.dg-plan'), d=h.querySelector('.dg-day'); if(!p||!d) return;
      var pr=p.getBoundingClientRect(), hr=h.getBoundingClientRect(), dr=d.getBoundingClientRect();
      if(pr.width>hr.width*.6) bad.push('the plan chip is '+Math.round(pr.width)+'px of a '+Math.round(hr.width)+'px day header: a bar, not a chip');
      if(Math.abs(pr.top+pr.height/2-(dr.top+dr.height/2))>6) bad.push('the plan chip is not on the Day pill\\'s line'); }); return bad; })()`],
  ['T12', ['exp_done', 'exp_running'], `(function(){ var S=__st, bad=[]; var tk=S.all('.bench-row .blk-done')[0], h=S.all('.exp-sec-h')[0]; if(!tk||!h) return bad;
    if(matchMedia('(hover:hover)').matches){ var d=tk.getBoundingClientRect().left-h.getBoundingClientRect().left; if(Math.abs(d)>1.5) bad.push('the first tick is '+Math.round(d)+'px from the section edge (the drag handle used to leave a gap there)'); } return bad; })()`],
  ['T13', ['designer'], `(function(){ var S=__st, bad=[], rows={};
    S.all('.dg-card').forEach(function(c){ var k=Math.round(c.getBoundingClientRect().top/6); var a=c.querySelector('.dg-act'); if(a) (rows[k]=rows[k]||[]).push(Math.round(a.getBoundingClientRect().bottom)); });
    Object.keys(rows).forEach(function(k){ var b=rows[k]; if(b.length>1&&Math.max.apply(null,b)-Math.min.apply(null,b)>1) bad.push('design cards in one row have their buttons at '+b.join(' / ')); }); return bad; })()`],
  ['T14', ['exp_done', 'outcome_picker'], `(function(){ var S=__st, bad=[], n=0;
    S.all('.oc-chip i,.xv-oc,.oc-band .oc-v i,.dlg-item .ic').forEach(function(e){ n++; var t=(e.textContent||'').trim();
      if(e.closest('.dlg-item')&&!e.closest('.dlg-item').querySelector('.ic-svg')&&/^[✓×~?–]$/.test(t)&&!/Not yet/.test(e.closest('.dlg-item').textContent)) bad.push('the outcome picker draws "'+t+'" as text');
      if(!e.closest('.dlg-item')){ if(t) bad.push(S.cls(e)+' draws "'+t+'" as text'); if(!e.querySelector('svg')) bad.push(S.cls(e)+' has no drawn mark'); } });
    if(!n) bad.push('no outcome mark on this screen to measure'); return bad.slice(0,5); })()`],
];

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
let failed = 0;
try {
  const base = `http://127.0.0.1:${port}/`;
  await waitHttp(base);
  const url = args.url ? (/^https?:/.test(String(args.url)) ? String(args.url) : base + String(args.url)) : base + 'apps/labbook/labbook.html';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e && e.message || e)));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now(), { waitUntil: 'load' });
  await pg.waitForFunction(() => window.LB && LB.data && LB.data.presets && Object.keys(LB.data.presets).length && (LB.data.projects || []).length, null, { timeout: 20000 });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => { document.querySelectorAll('.modal-back.open').forEach(x => x.classList.remove('open')); window.lbAlert = () => Promise.resolve(); });
  await pg.evaluate(`window.__SW=${SEED}`);
  // Group the checks by scene so each screen is opened once.
  const bySceneChecks = {};
  for (const [id, scenes, fn] of CHECKS) { if (ONLY && !ONLY.includes(id)) continue; for (const s of scenes) (bySceneChecks[s] = bySceneChecks[s] || []).push([id, fn]); }
  const findings = [];
  const counts = {};
  for (const [scene, list] of Object.entries(bySceneChecks)) {
    await pg.evaluate(h => { document.querySelectorAll('.modal-back.open,#spot-back.open,.pop.open').forEach(x => x.classList.remove('open')); void (0, eval)('(function(){ ' + h + '\n})()'); }, SCENES[scene]);
    await pg.waitForTimeout(800);
    await pg.evaluate(LIB);
    for (const [id, fn] of list) {
      counts[id] = (counts[id] || 0) + 1;
      let r; try { r = await pg.evaluate(fn); } catch (e) { r = ['the check itself threw: ' + String(e.message || e).split('\n')[0]]; }
      for (const m of r) findings.push({ id, scene, m });
    }
  }
  await browser.close();
  errs.forEach(m => findings.push({ id: 'run', scene: '-', m: 'page error: ' + m }));
  const byId = {}; findings.forEach(f => { (byId[f.id] = byId[f.id] || []).push(f); });
  for (const [id] of CHECKS) { if (ONLY && !ONLY.includes(id)) continue; const fs = byId[id] || []; process.stdout.write(`  ${fs.length ? '✗' : '✓'} ${id.padEnd(4)} ${counts[id] || 0} screens${fs.length ? '  — ' + fs.length + ' finding(s)' : ''}\n`); }
  (byId.run || []).forEach(f => process.stdout.write(`  ✗ run  ${f.m}\n`));
  failed = findings.length;
  const seen = new Set();
  findings.forEach(f => { const k = f.id + '|' + f.m; if (seen.has(k)) return; seen.add(k); process.stdout.write(`     [${f.id}] ${f.scene}: ${f.m}\n`); });
  if (!failed) process.stdout.write('\nLabbook looks the same everywhere: every style invariant holds.\n');
} finally { srv.kill(); }
process.exit(failed ? 1 : 0);
