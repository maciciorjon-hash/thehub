// Labbook on a phone — the real-life sweep.
//
// Loads Labbook top-level in an emulated iPhone (touch, DPR 3, mobile UA), plants a
// deterministic notebook, drives every screen a phone user reaches — Home, Experiments,
// Journal day/week, an experiment on every tab, the plate editor, every dialog, every ⋯ sheet,
// the drawer — and at each one asserts what the eye would catch and the static audits cannot:
//
//   · nothing scrolls sideways (document and the editor pane);
//   · no two visible fixed elements overlap (FAB over a sheet, timers over a dialog…);
//   · every row you are meant to tap is ≥44px and entirely inside the viewport;
//   · no visible text is smaller than MIN_FONT px (plate grids excepted — a well is a well);
//   · the three in-page audits (__runtimeAudit / __alignAudit / __fitAudit) come back empty;
//   · no console error, no page error;
//   · a long press on a step opens its menu AND the menu is still open 800 ms later
//     (a bottom sheet is never under the finger, so the release must not close it);
//   · a tap on a menu item fires exactly once.
//
// Then a perf table under 4× CPU throttling (Chromium only — WebKit has no CDP):
// open experiment · tick a step · day view · keystroke · plate editor.
//
// Usage (repo root):   python3 -m http.server 8899 &
//                      node tools/mobile_sweep.mjs [--engine=chromium|webkit] [--url=URL]
//                        [--sizes=390x780,375x640] [--themes=light,dark] [--shots=DIR]
//                        [--no-perf] [--min-font=11] [--baseline=FILE] [--json=FILE] [--embedded]
//                        [--only=screen,screen] [--perf-only --reps=7]
// Exit 1 on any failure.  `--url` defaults to the source app served locally; pass the built
// labbook-standalone.html to sweep the Archive-embedded build.
import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ENGINE  = args.engine || 'chromium';
const URL0    = args.url || 'http://127.0.0.1:8899/apps/labbook/labbook.html';
const SIZES   = String(args.sizes || '390x780,375x640').split(',').map(s => s.split('x').map(Number));
const THEMES  = String(args.themes || 'light,dark').split(',');
const SHOTS   = args.shots ? String(args.shots) : null;
const PERF    = !args['no-perf'] && ENGINE === 'chromium';
const MIN_FONT= Number(args['min-font'] || 11);
const BASE    = args.baseline ? JSON.parse(fs.readFileSync(String(args.baseline), 'utf8')) : null;
const JSON_OUT= args.json ? String(args.json) : null;
const PERF_ONLY = !!args['perf-only'];      // skip the screens; measure (and repeat) only
const EMBEDDED = !!args.embedded;           // Labbook inside an iframe, as dHUB hosts it (tools/mobile_embed.html)
const ONLY = args.only ? String(args.only).split(',') : null;   // --only=plate-editor,menu-step — a subset while fixing one thing
const REPS = Number(args.reps || 3);

const here = path.dirname(new URL(import.meta.url).pathname);
const AUDITS = ['audit_runtime.js', 'audit_align.js', 'audit_fit.js'].map(f => path.join(here, f));

// ── in-page helpers ─────────────────────────────────────────────────────────────────────────
// Everything below runs inside the page. It is one string so the same code goes to both engines.
const HELPERS = `
window.__ms = {
  vis(el){ if(!el||!el.getBoundingClientRect) return false; var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return false;
    var r=el.getBoundingClientRect(); return r.width>0&&r.height>0; },
  // Every visible ancestor must be visible too (a fixed element inside a display:none parent
  // still reports a rect of 0, but an opacity:0 parent does not).
  shown(el){ for(var n=el;n&&n!==document.documentElement;n=n.parentElement){ var cs=getComputedStyle(n);
    if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return false; }
    var r=el.getBoundingClientRect(); return r.width>0&&r.height>0; },
  overflow(){ var out=[]; var de=document.documentElement;
    if(de.scrollWidth>innerWidth+1) out.push('document scrolls sideways: '+de.scrollWidth+' > '+innerWidth);
    var ed=document.getElementById('pane-ed');
    if(ed&&ed.scrollWidth>ed.clientWidth+1){
      // name the widest offender so the finding is actionable
      var worst=null,wr=0; ed.querySelectorAll('*').forEach(function(n){ var r=n.getBoundingClientRect(); if(r.right>wr){wr=r.right;worst=n;} });
      out.push('#pane-ed scrolls sideways: '+ed.scrollWidth+' > '+ed.clientWidth+(worst?(' — widest: '+(worst.className||worst.tagName)+' right='+Math.round(wr)):'')); }
    document.querySelectorAll('.modal-back.open .modal, .pop.open').forEach(function(m){
      if(m.scrollWidth>m.clientWidth+1) out.push((m.className||m.id)+' scrolls sideways: '+m.scrollWidth+' > '+m.clientWidth); });
    return out; },
  fixedOverlaps(){ var els=[]; document.querySelectorAll('body *').forEach(function(n){
      var cs=getComputedStyle(n); if(cs.position!=='fixed') return; if(!__ms.shown(n)) return;
      if(cs.pointerEvents==='none') return; if(n.id==='mobile-backdrop'||n.classList.contains('modal-back')||n.id==='spot-back'||n.id==='pl-band') return;
      // A sheet is modal by design (it has a backdrop): opened from a row inside the drawer it
      // covers the drawer the way an iOS action sheet covers the list it came from.
      if(n.classList.contains('pop-sheet')) return;
      var r=n.getBoundingClientRect(); if(r.width<8||r.height<8) return; els.push({n:n,r:r}); });
    var out=[]; for(var i=0;i<els.length;i++) for(var j=i+1;j<els.length;j++){ var a=els[i],b=els[j];
      if(a.n.contains(b.n)||b.n.contains(a.n)) continue;
      var x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left), y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
      if(x>4&&y>4) out.push('fixed overlap: '+__ms.name(a.n)+' × '+__ms.name(b.n)+' ('+Math.round(x)+'×'+Math.round(y)+'px)'); }
    return out; },
  name(n){ return (n.id?('#'+n.id):'')+(n.className&&typeof n.className==='string'?('.'+n.className.trim().split(/\\s+/).slice(0,2).join('.')):'')||n.tagName; },
  tapTargets(){ var out=[]; var sel='.pop.open .pop-item, .modal-back.open .dlg-item, .modal-back.open .dlg-ans, #lb-tabs button, .ws-tab, .exp-tabs-m, .pop.open .pop-sheet-h';
    document.querySelectorAll(sel).forEach(function(n){ if(!__ms.shown(n)) return; var r=n.getBoundingClientRect();
      var min=n.matches('.pop-item,.dlg-item,.dlg-ans')?44:40;
      if(r.height<min-0.5) out.push('tap target '+Math.round(r.height)+'px < '+min+': '+__ms.name(n)+' "'+(n.textContent||'').trim().slice(0,30)+'"');
      // A row scrolled out of view inside its own sheet is reachable; one that the sheet shows
      // but the screen does not is the finding.
      var sc=n.closest('.pop,.modal'); if(sc){ var cr=sc.getBoundingClientRect(); if(r.top<cr.top-1||r.bottom>cr.bottom+1) return; }   // clipped by its own scroller: reachable by scrolling
      if(r.left<-0.5||r.top<-0.5||r.right>innerWidth+0.5||r.bottom>innerHeight+0.5) out.push('outside viewport: '+__ms.name(n)+' "'+(n.textContent||'').trim().slice(0,30)+'" '+JSON.stringify({l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)})); });
    // and every open menu/dialog must be fully inside the viewport itself
    document.querySelectorAll('.pop.open, .modal-back.open .modal').forEach(function(n){ var r=n.getBoundingClientRect();
      if(r.left<-1.5||r.top<-1.5||r.right>innerWidth+1.5||r.bottom>innerHeight+1.5) out.push('overlay outside viewport: '+__ms.name(n)+' '+JSON.stringify({l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)})); });
    return out; },
  smallText(min){ var out={}, n=0; var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    var t; while((t=walker.nextNode())){ if(!t.nodeValue||!t.nodeValue.trim()) continue; var el=t.parentElement; if(!el) continue;
      if(el.closest('.pl-grid,.pp-grid,svg,script,style,#print-root,#copy-stage,#onenote-stage,.pp-w,.pl-w,.pp-col,.pl-colh,.pl-rowh,.pp-rowh,#lb-bubble sub,#lb-bubble sup')) continue;   /* X₂ / X² on the bubble are glyphs, not text */
      if(!__ms.shown(el)) continue; var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) continue;
      var fs=parseFloat(getComputedStyle(el).fontSize); if(fs>0 && fs<min-0.01){ /* font-size:0 hides text on purpose (the week-strip dots) */ var k=__ms.name(el)+' '+fs+'px'; out[k]=(out[k]||0)+1; n++; } }
    return Object.keys(out).map(function(k){ return k+' ×'+out[k]; }); },
  audits(){ var out=[]; try{ if(window.__runtimeAudit) out=out.concat(window.__runtimeAudit().map(function(s){return 'runtime: '+s;})); }catch(e){ out.push('runtime audit threw: '+e); }
    try{ if(window.__alignAudit) out=out.concat(window.__alignAudit().map(function(s){return 'align: '+s;})); }catch(e){ out.push('align audit threw: '+e); }
    try{ if(window.__fitAudit) out=out.concat(window.__fitAudit().map(function(s){return 'fit: '+s;})); }catch(e){ out.push('fit audit threw: '+e); }
    return out; },
  size(){ var ed=document.getElementById('pane-ed'); return {kb:Math.round((ed?ed.innerHTML.length:0)/1024), nodes:ed?ed.querySelectorAll('*').length:0}; },
  closeAll(){ try{ document.querySelectorAll('.pop.open').forEach(function(p){ p.classList.remove('open'); }); }catch(e){}
    try{ if(window.hideBubble) hideBubble(); }catch(e){}
    try{ document.body.classList.remove('lb-sheet-open','mobile-drawer-open'); }catch(e){}
    try{ document.querySelectorAll('.modal-back.open').forEach(function(m){ m.classList.remove('open'); }); }catch(e){}
    try{ var d=document.getElementById('lb-dialog'); if(d&&d._onCancel){ d._onCancel(); } }catch(e){}
    try{ var s=document.getElementById('spot-back'); if(s) s.classList.remove('open'); if(window.SPOT) SPOT.open=false; }catch(e){}
    try{ if(window.PL&&window.closePlateEditor) closePlateEditor(); }catch(e){} }
};`;

// The notebook every run starts from. Relative dates keep the carry-over and the "today" band
// populated whatever day the sweep runs; two experiments sit in the past so the Journal has
// carried-over steps and the Experiments list has an overdue row.
const SEED = `(function(){
  function d(off){ var x=new Date(); x.setHours(12,0,0,0); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); }
  var P=LB.data.projects; var mk=function(pi,si,type,title,off){ var p=P[pi], s=p.sections[si%p.sections.length];
    selectNode('expsec',p.id,s.id); openNew(); el('nm-type').value=type; nmUpdateCode(); nmResetSetup(); nmProtos();
    el('nm-date').value=d(off); el('nm-title').value=title; nmUpdateCode(); nmPreview(); createExperiment();
    var ids=Object.keys(LB.data.experiments); return ids[ids.length-1]; };
  var ids=[];
  ids.push(mk(0,5,'NB_BIO_RTX96','BET biosensor, reverse 96',-2));
  ids.push(mk(0,1,'HB','HiBiT degradation BRD4',-1));
  ids.push(mk(0,3,'CTG_TCIP96','TCIP viability screen',0));
  ids.push(mk(0,1,'WB','Western blot DCAF15 timecourse with a long title that wraps',0));
  ids.push(mk(1,1,'CLONE_HIFI','Gibson sgRNA cloning',1));
  ids.push(mk(0,2,'D2B_SEED1','D2B chem screen plate 1',-3));
  ids.push(mk(2,0,'NB_SPARK_RTX96','SPARK NanoBRET 96',3));
  ids.push(mk(0,0,'BLANK','Meeting notes on the phone',0));
  // tick the first step of the two past experiments so the day plan has an anchor
  [ids[0],ids[1]].forEach(function(id){ var e=LB.data.experiments[id]; if(e&&e.blocks&&e.blocks[0]) setBlockDone(id,e.blocks[0].id,true,true); });
  // a wait on the first NB step, so the wait chip and the timer button exist
  var nb=LB.data.experiments[ids[0]]; if(nb&&nb.blocks[1]) nb.blocks[1].waitMin=45;
  // results and a verdict, so Visualize has a potency landscape and a success rate to draw
  var comps=['EDA-099','JQ1','dBET6'], tg=['BRD4','BRD2'];
  [ids[1],ids[5]].forEach(function(id,k){ var e=LB.data.experiments[id]; var rows=[]; comps.forEach(function(c,ci){ tg.forEach(function(t,ti){ rows.push({compound:c,target:t,potency:Math.pow(10,ci*0.7+ti*0.3),effect:80,hill:1,r2:0.98,flag:ci===2&&ti===1}); }); }); rows[1].excluded=true;
    e.integration=e.integration||{sources:[],cellLines:[],compounds:[],plateMaps:[],protocols:[],results:[],tables:[]};
    e.integration.results=[{id:'r'+k,source:'Echo',label:'Echo fit',assay:'HB',potencyLabel:'DC50',effectLabel:'Dmax',potencyUnit:'nM',effectUnit:'%',rows:rows,createdAt:new Date().toISOString()}]; });
  var wb=LB.data.experiments[ids[3]]; wb.status='done'; wb.statusLocked=true; wb.outcome={verdict:'worked',text:'',at:Date.now()};
  // the Journal: two flat notes, today's day note, and a step ticked today so "Done that day" draws
  newPage(); var pg1=_curPage(); pg1.title='Gel photos, with a title long enough to wrap on a phone'; pg1.html='<p>Bands at 60 and 120 kDa. <b>Lane 3</b> is the control.</p>';
  newPage(); var pg2=_curPage(); pg2.title='Second attempt';
  LB.data.notebook[d(0)]={date:d(0),html:'<p>Ran the SPARK gel; bands look right.</p><p>Talked to Rub\u00e9n about ChemLib.</p>'};
  if(nb&&nb.blocks[0]){ nb.blocks[0].done=true; nb.blocks[0].completedAt=Date.now()-3600e3; nb.blocks[0].log='bubbles in B7, re-read'; }
  ids.push(pg1.id);
  save(); selectNode('home');
  return ids;
})()`;

// ── screens ─────────────────────────────────────────────────────────────────────────────────
// Each screen: how to get there (in-page code, may use the seeded ids), what to look at, and
// whether it is a menu (then the ≥44px / inside-viewport checks apply to its items).
function screens(ids) {
  const e0 = ids[0], e2 = ids[2], e3 = ids[3];
  const S = (name, drive, opts = {}) => ({ name, drive, ...opts });
  return [
    S('home',            `selectNode('home')`),
    S('experiments',     `selectNode('exps')`),
    S('experiments-search', `selectNode('exps'); var q=document.querySelector('.xv-q'); if(q){ q.value='BRD'; q.dispatchEvent(new Event('input',{bubbles:true})); }`),
    S('journal-day',     `selectNode('journal'); if(window.DAY_VIEW!==undefined) DAY_VIEW=null; renderEditor()`),
    S('journal-week',    `selectNode('week')`),
    S('visualize',       `selectNode('viz')`, { settle: 600 }),
    // The Experiment Designer: the surface that lists the lab's designs, then each step of the
    // wizard, then the module picker (a dialog with its own list, so its rows are menu rows).
    S('designer',        `selectNode('design')`),
    S('designer-type',   `var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id})`, { menu: false }),
    S('designer-params', `var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id}); dsSetType('CTG'); DS.step=1; dsDraw()`),
    S('designer-modules',`var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id}); dsSetType('CTG'); ['lib:seed','lib:compound-manual','lib:ctg'].forEach(function(i){ DS.mods.push(dsMod(libSpec(i))); }); DS.mods[1].gap=1; DS.mods[2].gap=1; DS.step=2; dsDraw()`),
    S('designer-config', `var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id}); dsSetType('CTG'); ['lib:seed','lib:compound-manual','lib:ctg'].forEach(function(i){ DS.mods.push(dsMod(libSpec(i))); }); DS.step=3; DS.cur=1; dsDraw()`),
    S('designer-review', `var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id}); dsSetType('CTG'); ['lib:seed','lib:compound-manual','lib:ctg'].forEach(function(i){ DS.mods.push(dsMod(libSpec(i))); }); DS.step=4; dsDraw()`),
    S('designer-picker', `var p=LB.data.projects[0]; dsOpen({mode:'exp',pid:p.id,sid:p.sections[0].id}); dsSetType('CTG'); DS.step=2; dsDraw(); dsPick()`, { menu: true }),
    S('visualize-drill', `selectNode('viz'); var m=document.querySelector('.vz-seg[data-go]'); if(!m) throw new Error('n/a'); vizGo(m.getAttribute('data-go'))`, { optional: true, settle: 600 }),
    S('exp-default',     `openExp('${e0}')`),
    S('exp-steps',       `openExp('${e0}'); expTab('steps')`),
    S('exp-steps-inputs',`openExp('${e0}'); expTab('steps'); var b=document.querySelector('.bench .blk-calc .lean-tog'); if(b) b.click(); else throw new Error('n/a');`, { optional: true }),
    S('exp-obs',         `openExp('${e0}'); expTab('obs')`),
    S('exp-results',     `openExp('${e0}'); expTab('res')`),
    S('exp-pub',         `openExp('${e0}'); expTab('pub')`),
    S('exp-files',       `openExp('${e0}'); expTab('files')`),
    S('exp-blank',       `openExp('${ids[7]}')`),
    S('exp-long-title',  `openExp('${e3}')`),
    S('drawer',          `openExp('${e0}'); toggleMobileNav(true)`),
    S('drawer-journal',  `selectNode('journal'); toggleMobileNav(true)`),
    S('journal',         `openJournalWs()`),
    S('journal-note',    `openPage('${ids[8]}')`),
    S('journal-page',    `openDayPage(todayStr())`),
    S('journal-empty',   `openDayPage(todayStr()); SEL.page=null; renderAll()`),
    S('drawer-journal-ws',`openPage('${ids[8]}'); toggleMobileNav(true)`),
    S('menu-note',       `openPage('${ids[8]}'); toggleMobileNav(true); var t=document.querySelector('.jr-note'); ctxPage({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, '${ids[8]}')`, { menu: true }),
    S('menu-day-page',   `openDayPage(todayStr()); toggleMobileNav(true); var t=document.querySelector('.jr-day'); ctxDay({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, todayStr())`, { menu: true }),
    // The ribbon and the dock are gone (2026-09-22): one top bar with a breadcrumb, On this page
    // as a sheet, and the bubble carries the formatting.
    S('topbar-crumb',    `openExp('${e0}'); document.getElementById('topbar').scrollIntoView()`),
    S('on-this-page',    `openExp('${e0}'); var t=document.querySelector('#topbar .tp-btn'); openOnThisPage({currentTarget:t,preventDefault:function(){},stopPropagation:function(){}})`, { menu: true }),
    S('bubble-para',     `openPage('${ids[8]}'); var h=document.querySelector('#pane-ed [contenteditable="true"]'); h.focus(); var r=document.createRange(); r.selectNodeContents(h); var sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); BUB.menu='para'; positionBubble(true)`),
    S('menu-step',       `openExp('${e0}'); expTab('steps'); var b=LB.data.experiments['${e0}'].blocks[0]; var t=document.querySelector('.blk-more, [onclick*="ctxBlock"]'); ctxBlock({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, b.id)`, { menu: true }),
    // The experiment banner has no ⋯ any more — every action is a button in it (2026-09-16).
    S('exp-acts',        `openExp('${e0}'); document.querySelector('.exh-acts').scrollIntoView()`),
    S('menu-exp-tabs',   `openExp('${e0}'); var t=document.querySelector('.exp-tabs-m')||document.body; expTabMenu({currentTarget:t,preventDefault:function(){},stopPropagation:function(){}}, '${e0}')`, { menu: true }),
    S('menu-exp-row',    `selectNode('exps'); var t=document.querySelector('.xv-row'); ctxExp({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, '${e0}')`, { menu: true }),
    S('menu-project',    `selectNode('exps'); ctxProject({clientX:200,clientY:300,preventDefault:function(){},stopPropagation:function(){}}, LB.data.projects[0].id)`, { menu: true }),
    S('menu-day-step',   `selectNode('journal'); var e=LB.data.experiments['${e2}']; wkCtxBlock({clientX:200,clientY:300,preventDefault:function(){},stopPropagation:function(){}}, '${e2}', e.blocks[0].id)`, { menu: true }),
    S('menu-add',        `var p=LB.data.projects[0]; selectNode('expsec',p.id,p.sections[0].id); var t=document.body; openAddMenu({currentTarget:t,target:t,clientX:200,clientY:300,preventDefault:function(){},stopPropagation:function(){}})`, { menu: true }),
    S('menu-more',       `if(!window.lbMoreMenu||!document.body.classList.contains('lb-tabs')) throw new Error('n/a'); lbMoreMenu()`, { menu: true, optional: true }),
    S('tab-bar',         `if(typeof lbHost==='function'&&lbHost()) throw new Error('n/a'); selectNode('home'); if(!document.body.classList.contains('lb-tabs')||!document.querySelector('#lb-tabs .lbt')) throw new Error('the PWA has no tab bar')`, { optional: true }),
    S('menu-calc',       `openExp('${e3}'); var b=LB.data.experiments['${e3}'].blocks.filter(function(x){return !x.calc;})[0]; if(!b) throw new Error('n/a'); calcMenu(b.id)`, { dialog: true, optional: true, settle: 3600 }),
    S('dialog-new',      `var p=LB.data.projects[0]; selectNode('expsec',p.id,p.sections[0].id); openNew()`, { dialog: true }),
    S('dialog-preset',   `openPresetEditorFor('WB')`, { dialog: true }),
    S('dialog-setup',    `openExp('${e0}'); openSetupEditor('${e0}')`, { dialog: true }),
    S('dialog-report',   `openReport()`, { dialog: true }),
    S('dialog-recover',  `openRecover('deleted')`, { dialog: true }),
    S('dialog-recover-backup', `openRecover('backup')`, { dialog: true }),
    S('dialog-settings', `openSettings()`, { dialog: true }),
    S('dialog-prep',     `openExp('${e0}'); openPrepSheet({expId:'${e0}'})`, { dialog: true, settle: 900 }),
    S('dialog-export',   `openExp('${e0}'); exportMenu()`, { dialog: true }),
    S('dialog-pdf',      `openExp('${e0}'); openPdfExport()`, { dialog: true, settle: 1200 }),
    S('dialog-pdf-day',  `openDayPage(todayStr()); openPdfExport()`, { dialog: true, settle: 1200 }),
    S('dialog-confirm',  `lbConfirm('Delete this experiment and its 5 steps? This cannot be undone from here.',{title:'Delete',danger:true})`, { dialog: true }),
    S('dialog-choose',   `lbChoose('This step was planned for Tuesday and you are ticking it on Thursday.',{title:'This step slipped',answers:[{id:'a',label:'Move the rest forward by 2 days',sub:'The intervals between the remaining steps are kept',primary:true},{id:'b',label:'I did it on Tuesday — I am only recording it now',sub:'Records the planned date as the completion date'},{id:'c',label:'Done today, and the plan stands',sub:'Nothing else moves',safe:true}]})`, { dialog: true }),
    S('dialog-prompt',   `lbPrompt('Minutes to wait after this step before the next one. Leave empty for none.','45',{title:'Wait after "Transfection"',ok:'Save'})`, { dialog: true }),
    S('dialog-picker',   `lbPicker('Move to folder', LB.data.projects.map(function(p){ return {id:p.id,label:p.name,sub:(p.sections||[]).length+' folders',ic:p.name[0],c:p.color}; }), function(){})`, { dialog: true }),
    S('dialog-close-exp',`closeExperiment('${e2}')`, { dialog: true }),
    S('spot',            `openSpot(); el('spot-in').value='BRD'; el('spot-in').dispatchEvent(new Event('input',{bubbles:true}))`, { dialog: true }),
    S('plate-editor',    `openExp('${e0}'); openPlateEditor('exp:${e0}')`, { dialog: true, settle: 600 }),
    S('plate-editor-384',`openExp('${ids[5]}'); var e=LB.data.experiments['${ids[5]}']; if(!e.plate) throw new Error('n/a'); openPlateEditor('exp:${ids[5]}')`, { dialog: true, optional: true, settle: 600 }),
    S('plate-cond-menu', `openExp('${e0}'); openPlateEditor('exp:${e0}'); var t=document.querySelector('.pl-cond, .pl-type'); if(!t) throw new Error('n/a'); var tid=t.getAttribute('data-tid')||(t.getAttribute('oncontextmenu')||'').match(/'([^']+)'/)[1]; ctxPlType({clientX:200,clientY:400,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, tid)`, { menu: true, optional: true, settle: 600 }),
    S('timers',          `openExp('${e0}'); LB_TIMERS.push({id:'t1',label:'45 min after Transfection',sub:'DD_NB',ends:Date.now()+45*60000,total:2700}); LB_TIMERS.push({id:'t2',label:'3 h after Compound',sub:'DD_HB',ends:Date.now()+3*3600000,total:10800}); renderTimers()`, { cleanup: `LB_TIMERS.length=0; renderTimers()` }),
    S('timers-with-menu',`openExp('${e0}'); LB_TIMERS.push({id:'t1',label:'45 min after Transfection',sub:'DD_NB',ends:Date.now()+45*60000,total:2700}); renderTimers(); var b=LB.data.experiments['${e0}'].blocks[0]; var t=document.querySelector('.blk-more'); ctxBlock({clientX:200,clientY:300,currentTarget:t,target:t,preventDefault:function(){},stopPropagation:function(){}}, b.id)`, { menu: true, cleanup: `LB_TIMERS.length=0; renderTimers()` }),
    S('photo-fab-drawer',`openExp('${e0}'); toggleMobileNav(true)`),
    S('journal-past-day',`selectNode('journal'); DAY_VIEW=(function(){var x=new Date(); x.setDate(x.getDate()-3); return x.toISOString().slice(0,10);})(); renderEditor()`),
  ];
}

// ── interaction tests ───────────────────────────────────────────────────────────────────────
// A real long press: pointerdown(touch) → hold → pointerup, then the compat mousedown/click a
// browser synthesises at the finger. The menu must be open at +800 ms.
const LONG_PRESS = `(async function(){
  var e=LB.data.experiments[arguments[0]]; openExp(e.id); expTab('steps'); await new Promise(r=>setTimeout(r,300));
  var row=document.querySelector('.bench-row .bench-hd[oncontextmenu]'); if(!row) return 'no row with oncontextmenu';
  // Scroll it into view first, which is what anyone pressing it would do. The point used to be
  // derived from wherever the row happened to sit and clamped toward the middle of the viewport,
  // so on a page whose steps start below the fold it landed OFF-SCREEN -- and the
  // fallback to the row itself then dispatched on the row anyway, so the test passed without ever pressing anything. The moment
  // the content above the steps got 78 px shorter the same point landed on the fixed bottom tab
  // bar instead: a real element, with no oncontextmenu, and an accidental pass became a failure
  // that was never about the product. Press the middle of the row, and say so when it is covered.
  row.scrollIntoView({block:'center'});
  await new Promise(r=>setTimeout(r,140));
  var r=row.getBoundingClientRect(); var x=Math.round(r.left+r.width/2), y=Math.round(r.top+r.height/2);
  var target=document.elementFromPoint(x,y);
  if(!target||!target.closest('[oncontextmenu]')) return 'the press point is not on the row - it lands on '+(target?(target.tagName+'.'+target.className):'nothing');
  var mk=function(type,extra){ var ev=new PointerEvent(type,Object.assign({bubbles:true,cancelable:true,clientX:x,clientY:y,pointerType:'touch',pointerId:1,isPrimary:true},extra||{})); return ev; };
  target.dispatchEvent(mk('pointerdown'));
  await new Promise(r=>setTimeout(r,560));
  var openAfterPress=!!document.querySelector('.pop.open');
  target.dispatchEvent(mk('pointerup'));
  // the compat mouse events land where the finger was — on a bottom sheet that is *outside* it
  var under=document.elementFromPoint(x,y)||target;
  under.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0}));
  under.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0}));
  under.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0}));
  await new Promise(r=>setTimeout(r,800));
  var still=!!document.querySelector('.pop.open');
  var res = openAfterPress ? (still ? 'ok' : 'menu opened by the press but was closed by the release') : 'long press did not open a menu';
  __ms.closeAll(); return res;
})`;

const TAP_ONCE = `(async function(){
  window.__hits=0; var items=[{label:'Count me',fn:function(){ window.__hits++; }},{label:'Other',fn:function(){}}];
  popOpen('ctxmenu',items,{left:100,right:120,top:200,bottom:220});
  await new Promise(r=>setTimeout(r,320));           // past the 260 ms arming
  var it=document.querySelector('#ctxmenu .pop-item'); if(!it) return 'no item rendered';
  var r=it.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)});
})`;

// ── runner ──────────────────────────────────────────────────────────────────────────────────
function tableize(rows) {
  const cols = Object.keys(rows[0] || {});
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
  const line = (r) => '| ' + cols.map((c, i) => String(r[c] ?? '').padEnd(w[i])).join(' | ') + ' |';
  return [line(Object.fromEntries(cols.map(c => [c, c]))), '|' + w.map(x => '-'.repeat(x + 2)).join('|') + '|', ...rows.map(line)].join('\n');
}

async function sweep() {
  const browserType = ENGINE === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch();
  const dev = devices['iPhone 13'];
  const failures = [];      // {where, msg}
  const results = {};       // per screen key → {kb,nodes,issues}
  const perf = {};
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

  for (const [W, H] of SIZES) for (const theme of THEMES) {
    const tag = `${W}x${H}/${theme}`;
    const ctx = await browser.newContext({ ...dev, viewport: { width: W, height: H }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
    await ctx.addInitScript((t) => {
      try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('hub_theme', t); localStorage.setItem('lb_lean', '1'); } catch (e) {}
    }, theme);
    const pg = await ctx.newPage();
    const errors = [];
    pg.on('pageerror', e => errors.push('pageerror: ' + (e.message || e)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
    // Embedded, every evaluate goes to the app's frame; the frame fills the page, so tap
    // coordinates need no offset.
    let page = pg;
    if (EMBEDDED) {
      const host = new URL('tools/mobile_embed.html', URL0.replace(/apps\/labbook\/.*$/, '')).href;
      await pg.goto(host + '?src=' + encodeURIComponent(URL0), { waitUntil: 'load' });
      await pg.waitForFunction(() => { const f = document.querySelector('iframe'); return f && f.contentWindow && f.contentWindow.LB && f.contentWindow.renderAll; }, null, { timeout: 20000 });
      page = pg.frame({ name: 'app' });
      page.waitForTimeout = (ms) => pg.waitForTimeout(ms);
      page.screenshot = (o) => pg.screenshot(o);
      page.touchscreen = pg.touchscreen;
    } else {
      await pg.goto(URL0 + (URL0.includes('?') ? '&' : '?') + '_ts=' + Date.now(), { waitUntil: 'load' });
    }
    await page.waitForFunction(() => window.LB && window.renderAll && document.getElementById('pane-ed'), null, { timeout: 20000 });
    await page.evaluate(HELPERS);
    for (const f of AUDITS) await page.addScriptTag({ path: f });
    // theme: the app reads hub_theme at boot; make sure the attribute matches
    await page.evaluate((t) => { document.documentElement.setAttribute('data-theme', t); }, theme);
    const ids = await page.evaluate(SEED);
    await page.waitForTimeout(400);
    errors.length = 0;   // boot noise (fonts, missing host) is not what we are sweeping

    for (const sc of (PERF_ONLY ? [] : screens(ids)).filter(sc => !ONLY || ONLY.includes(sc.name))) {
      const key = `${tag} ${sc.name}`;
      let skipped = false;
      try {
        await page.evaluate(`(function(){ __ms.closeAll(); })()`);
        await page.evaluate(`(function(){ ${sc.drive} })()`);
      } catch (e) {
        if (sc.optional && String(e.message || e).includes('n/a')) { skipped = true; }
        else failures.push({ where: key, msg: 'drive threw: ' + String(e.message || e).split('\n')[0] });
      }
      if (skipped) { results[key] = { skipped: true }; continue; }
      await page.waitForTimeout(sc.settle || 380);
      const rep = await page.evaluate((min) => ({
        overflow: __ms.overflow(), fixed: __ms.fixedOverlaps(), taps: __ms.tapTargets(), small: __ms.smallText(min), audits: __ms.audits(), size: __ms.size(),
      }), MIN_FONT);
      const issues = [...rep.overflow, ...rep.fixed, ...rep.taps, ...rep.small.map(s => 'small text: ' + s), ...rep.audits, ...errors.splice(0)];
      results[key] = { ...rep.size, issues };
      issues.forEach(msg => failures.push({ where: key, msg }));
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${tag.replace(/[\/x]/g, '_')}-${sc.name}.png`) }).catch(() => {});
      if (sc.cleanup) await page.evaluate(`(function(){ ${sc.cleanup} })()`).catch(() => {});
      await page.evaluate(`(function(){ __ms.closeAll(); })()`).catch(() => {});
      await page.waitForTimeout(120);
      await page.evaluate(`(function(){ __ms.closeAll(); })()`).catch(() => {});
    }

    // interaction tests (once per context)
    if (!PERF_ONLY) try {
      const lp = await page.evaluate(`${LONG_PRESS}('${ids[0]}')`);
      if (lp !== 'ok') failures.push({ where: `${tag} long-press`, msg: lp });
    } catch (e) { failures.push({ where: `${tag} long-press`, msg: 'threw: ' + e.message }); }
    if (!PERF_ONLY) try {
      const pos = await page.evaluate(`${TAP_ONCE}()`);
      if (!pos.startsWith('{')) failures.push({ where: `${tag} tap-once`, msg: pos });
      else { const { x, y } = JSON.parse(pos); await page.touchscreen.tap(x, y); await page.waitForTimeout(250);
        const hits = await page.evaluate(() => window.__hits);
        if (hits !== 1) failures.push({ where: `${tag} tap-once`, msg: `item fired ${hits} times (expected 1)` }); }
      await page.evaluate(`(function(){ __ms.closeAll(); })()`);
    } catch (e) { failures.push({ where: `${tag} tap-once`, msg: 'threw: ' + e.message }); }

    // perf (Chromium, first light context only)
    if (PERF && !perf.done && !EMBEDDED) {
      const cdp = await ctx.newCDPSession(pg);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const t = async (label, code) => {
        const ms = [];
        // The forced layout read is inside the timed region on purpose: a render that leaves
        // layout dirty and one that flushes it itself cost the user the same frame, and only
        // the sum compares fairly between builds.
        for (let i = 0; i < REPS; i++) { ms.push(await page.evaluate(`(function(){ var t0=performance.now(); ${code}; void document.getElementById('pane-ed').offsetHeight; return performance.now()-t0; })()`)); await page.waitForTimeout(80); }
        ms.sort((a, b) => a - b);
        perf[label] = Math.round(ms[Math.floor(ms.length / 2)] * 10) / 10;   // the median: a warm-up run or a GC pause is not the number
      };
      await t('open experiment (ms)', `openExp('${ids[0]}')`);
      await t('steps tab (ms)', `openExp('${ids[0]}'); expTab('steps')`);
      await t('tick a step (ms)', `var e=LB.data.experiments['${ids[2]}']; var b=e.blocks[e.blocks.length-1]; b.date=todayStr(); openExp(e.id); setBlockDone(e.id,b.id,!b.done,true)`);
      await t('day view (ms)', `selectNode('journal'); DAY_VIEW=null; renderEditor()`);
      await t('week view (ms)', `selectNode('week')`);
      await t('experiments list (ms)', `selectNode('exps')`);
      await t('keystroke in a block (ms)', `openExp('${ids[3]}'); var ed=document.querySelector('.blk .rt[contenteditable]'); if(ed){ ed.focus(); ed.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'a'})); }`);
      await t('plate editor open (ms)', `openExp('${ids[0]}'); openPlateEditor('exp:${ids[0]}'); closePlateEditor()`);
      await t('drawer open (ms)', `openExp('${ids[0]}'); toggleMobileNav(true); toggleMobileNav(false)`);
      await t('notebook page (ms)', `selectNode('home'); openPage('${ids[8]}')`);
      await t('keystroke in a page (ms)', `openPage('${ids[8]}'); var ed=document.querySelector('.nb-page .rt[contenteditable]'); if(ed){ ed.focus(); ed.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'a'})); }`);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      perf.done = true;
    }
    await ctx.close();
  }
  await browser.close();

  // ── report ──
  const rows = Object.entries(results).map(([k, v]) => ({ screen: k, kb: v.skipped ? '—' : v.kb, nodes: v.skipped ? '—' : v.nodes, issues: v.skipped ? 'n/a' : v.issues.length }));
  console.log(`\n# Labbook mobile sweep — ${ENGINE} — ${URL0}\n`);
  console.log(tableize(rows));
  if (PERF) {
    const prow = Object.entries(perf).filter(([k]) => k !== 'done').map(([k, v]) => ({ metric: k, 'now (4× CPU)': v, baseline: BASE && BASE.perf ? BASE.perf[k] ?? '' : '' }));
    console.log(`\n## Perf (Chromium, CPU throttled 4×, median of ${REPS})\n`); console.log(tableize(prow));
  }
  if (failures.length) {
    console.log(`\n## ${failures.length} finding(s)\n`);
    const byWhere = {}; failures.forEach(f => { (byWhere[f.where] = byWhere[f.where] || []).push(f.msg); });
    for (const [w, ms] of Object.entries(byWhere)) { console.log(`- **${w}**`); [...new Set(ms)].forEach(m => console.log(`    - ${m}`)); }
  } else console.log('\nAll screens clean.');
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ engine: ENGINE, url: URL0, results, perf, failures }, null, 1));
  process.exit(failures.length ? 1 : 0);
}

sweep().catch(e => { console.error(e); process.exit(2); });
