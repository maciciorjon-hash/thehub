// The experiment's header bar — what it offers, what each button does, and what it must never do to a record.
//
// 2026-10-27: "toda esta barra y los submenus que estan dentro necesitan un rework … busca fallos y arreglalos … aplicalo a todos los
// experimentos, nuevos y viejos". Each check below is a class of fault found by driving the bar, and each was proven by putting the old
// behaviour back. They read the live record, so a stored experiment is held to them exactly as a new one is.
//
//   HB1  notes are not runs     a note's bar is Duplicate and Delete. It offered the bench sheet, the materials list, a preset, a replicate and
//                               Close — and Repeat did nothing when pressed
//   HB2  no standing dead end   the bar has no "Refresh wording" (it opened "Nothing to update" for nearly every run — the Steps say when there is
//                               something, with the button) and no "Unarchive" (see HB3); no two buttons share a label
//   HB3  Close has a way back   Reopen after Close hands the status back to the ticks and puts the run back in the planner. Unarchive left it
//                               "on hold", locked and closed, so a run you had come back to went on behaving as if you had not; and Close was
//                               two undo steps, the first of which left it archived with no status
//   HB4  a ticked step is fixed moving the start date moves the steps still to do, never one already ticked (it re-dated the record)
//   HB5  Type is not stale      changing the type redraws the line under the title
//   HB6  a preset has one name  saving a design under a name that exists makes "name (2)", never two of one name in the New-experiment list
//   HB7  What you need is brief no provenance notes ("named in the setup · named on the experiment") and a one-sentence preamble
//   HB8  Delete says what goes  the confirmation names the ticks, results and files the run carries
//   HB9  one way to decide      Details has no Status select while the run has steps (Close and Reopen are the way); a run with none keeps it
//   HB10 Repeat says which      the replicate dialog names its number and the run it links to
//
//   node tools/labbook_header_invariants.mjs [--url=URL] [--only=HB3,HB4]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 150)); } throw new Error('server did not start'); }

// In the page: a run built from a preset (as a person makes one), a note, and the helpers every check uses.
const LIB = `(function(){
  var P=(LB.data.projects||[]).find(function(p){ return (p.sections||[]).length; }), S=P.sections[0];
  window.__H={
    P:P, S:S,
    mk:function(key,code,start){
      var tpl=LB.data.presets[key]; var su=Object.assign({},setupDefaultsFor(key),JSON.parse(JSON.stringify(tpl.setup||{})));
      var before={}; Object.keys(LB.data.experiments).forEach(function(k){ before[k]=1; });
      buildExperimentFrom({pid:P.id,sid:S.id,key:key,tpl:tpl,startDate:start||todayStr(),type:presetBase(key),title:tpl.title||key,code:code,setup:su,plate:true});
      return Object.values(LB.data.experiments).filter(function(x){ return !before[x.id]; })[0]; },
    note:function(){ var id=uid(); LB.data.experiments[id]={id:id,kind:'note',noteType:'note',title:'A note',projectId:P.id,sectionId:S.id,date:todayStr(),html:'',created:Date.now(),updated:Date.now()}; return LB.data.experiments[id]; },
    open:function(e){ SEL.node={kind:'expsec',projectId:P.id,sectionId:S.id}; SEL.page=e.id; renderAll(); },
    labels:function(){ return [].map.call(document.querySelectorAll('#pane-ed .exh .exh-grp .exh-act'),function(b){ var l=b.querySelector('.exh-act-l'); return l?l.textContent.trim():''; }); },
    dlg:function(){ var d=document.querySelector('.modal-back.open'); return d?d.innerText.replace(/\\s+/g,' ').trim():''; },
    shut:function(){ document.querySelectorAll('.modal-back.open,.pop.open').forEach(function(x){ x.classList.remove('open'); }); },
    wait:function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); },
    pick:function(){ var it=document.querySelector('.modal-back.open .dlg-item'); if(it) it.click(); }
  };
  return true; })()`;

const CHECKS = [
  ['HB1', `(async function(){ var H=__H, bad=[], n=H.note(); H.open(n);
    var l=H.labels(); if(l.join('|')!=='Duplicate|Delete') bad.push('a note\\'s bar is ['+l.join(', ')+'], it should be [Duplicate, Delete]');
    delete LB.data.experiments[n.id]; SEL.page=null; renderAll(); return bad; })()`],
  ['HB2', `(async function(){ var H=__H, bad=[], e=H.mk('NB_SPARK_SCREEN96','HB2_RUN'); H.open(e);
    var l=H.labels(), seen={}; ['What you need','Bench sheet','Save as preset','Close','Repeat','Duplicate','Delete'].forEach(function(w){ if(l.indexOf(w)<0) bad.push('the bar has no "'+w+'" ['+l.join(', ')+']'); });
    // one way into the setup editor, not two: the Setup block's Edit, or the bar's Setup only when that block is empty
    var blockEdit=!!document.querySelector('#pane-ed .exh-setup-edit'), barSetup=l.indexOf('Setup')>=0;
    if(blockEdit&&barSetup) bad.push('the Setup block has Edit and the bar also says Setup (two buttons for one dialog)');
    if(!blockEdit&&!barSetup) bad.push('no way into the setup editor: no Edit in the block and no Setup in the bar');
    var keep=JSON.stringify(e.setup); e.setup={}; e.imported=null; H.open(e); var l2=H.labels();
    if(document.querySelector('#pane-ed .exh-setup-edit')||l2.indexOf('Setup')<0) bad.push('a setup with no answers to show must keep the bar\\'s Setup ['+l2.join(', ')+']');
    e.setup=JSON.parse(keep);
    if(l.indexOf('Refresh wording')>=0) bad.push('"Refresh wording" is a standing button again'); if(l.indexOf('Unarchive')>=0) bad.push('"Unarchive" is on an open run');
    l.forEach(function(x){ if(seen[x]) bad.push('two buttons say "'+x+'"'); seen[x]=1; });
    [].forEach.call(document.querySelectorAll('.exh .exh-grp .exh-act'),function(b){ if(!(b.title||'').trim()) bad.push('a button has no tooltip'); });
    delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB3', `(async function(){ var H=__H, bad=[], e0=H.mk('CTG','HB3_RUN'), id=e0.id, E=function(){ return LB.data.experiments[id]; }; H.open(e0);
    (E().blocks||[]).forEach(function(b,i){ b.done=(i<1); }); syncExpStatus(E()); renderAll(); var st0=E().status;
    closeExperiment(id); await H.wait(60); H.pick(); await H.wait(500); H.shut();
    var e=E(); if(!e.archived||e.status!=='done'||!e.statusLocked) bad.push('Close did not close: archived='+e.archived+' status='+e.status);
    H.open(e); var l=H.labels(); if(l.indexOf('Reopen')<0) bad.push('a closed run offers no Reopen ['+l.join(', ')+']'); if(l.indexOf('Close')>=0) bad.push('a closed run still offers Close');
    lbUndo(); e=E(); if(e.archived||e.status!==st0) bad.push('one undo did not take Close back: archived='+e.archived+' status='+e.status+' (was '+st0+')');
    closeExperiment(id); await H.wait(60); H.pick(); await H.wait(500); H.shut();
    reopenExperiment(id); e=E();
    if(e.archived||e.statusLocked) bad.push('Reopen left it closed: archived='+e.archived+' locked='+e.statusLocked+' status='+e.status);
    if(e.status!==st0) bad.push('Reopen did not hand the status back to the ticks: '+e.status+' (the ticks say '+st0+')');
    // an old run left "on hold" and unarchived by the old Unarchive is still reopenable
    e.status='paused'; e.statusLocked=true; e.archived=false; H.open(e); if(H.labels().indexOf('Reopen')<0) bad.push('a run left on hold and unarchived has no way back');
    delete LB.data.experiments[id]; return bad; })()`],
  ['HB4', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB4_RUN',addDays(todayStr(),-3)); H.open(e);
    (e.blocks||[]).forEach(function(b,i){ b.done=(i<2); });
    var was=e.blocks.map(function(b){ return b.date; }); setField('startDate',addDays(e.startDate,5));
    e.blocks.forEach(function(b,i){ if(b.done&&b.date!==was[i]) bad.push('a ticked step was re-dated '+was[i]+' → '+b.date);
      if(!b.done&&b.date&&b.date!==addDays(was[i],5)) bad.push('a step still to do did not move with the start: '+was[i]+' → '+b.date); });
    delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB5', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB5_RUN'); H.open(e); var before=document.querySelector('.exh-lean-l').innerText;
    setField('type','WB'); var after=document.querySelector('.exh-lean-l').innerText;
    if(before===after) bad.push('the line under the title still says "'+after.replace(/\\s+/g,' ').slice(0,40)+'" after the type changed');
    delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB6', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB6_RUN'); var was=window.lbPrompt; window.lbPrompt=function(){ return Promise.resolve('Header probe design'); };
    var n0=Object.keys(LB.data.presets).length; saveExpAsPreset(e.id); await H.wait(80); saveExpAsPreset(e.id); await H.wait(80); window.lbPrompt=was;
    var names=Object.keys(LB.data.presets).map(function(k){ return LB.data.presets[k].name; }).filter(function(x){ return /^Header probe design/.test(x||''); });
    if(names.length!==2||names[0]===names[1]) bad.push('two saves under one name gave ['+names.join(' | ')+']');
    Object.keys(LB.data.presets).forEach(function(k){ if(/^Header probe design/.test(LB.data.presets[k].name||'')) delete LB.data.presets[k]; });
    delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB7', `(async function(){ var H=__H, bad=[], e=H.mk('NB_SPARK_SCREEN96','HB7_RUN'); openPrepSheet({expId:e.id}); await H.wait(150);
    var t=H.dlg(), msg=(document.querySelector('.modal-back.open .dlg-msg')||{}).innerText||'';
    if(/named in the setup|named on the experiment/.test(t)) bad.push('the list still says where a name was read from ("named in the setup · named on the experiment")');
    if(msg.length>260) bad.push('the preamble is '+msg.length+' characters, it should be a sentence or two');
    H.shut(); delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB8', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB8_RUN'); (e.blocks||[]).forEach(function(b,i){ b.done=(i<2); });
    delExperiment(e.id); await H.wait(100); var t=H.dlg(); H.shut();
    if(!/2 of \\d+ steps ticked/.test(t)) bad.push('the confirmation does not say what the run carries: "'+t.slice(0,160)+'"');
    delete LB.data.experiments[e.id]; return bad; })()`],
  ['HB9', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB9_RUN'); H.open(e); var has=!!document.querySelector('.exh-fields select[onchange*="setExpStatus"]');
    if(has) bad.push('Details offers a Status select on a run with steps — a second way to decide what Close and Reopen decide');
    var b=H.note(); b.kind='exp'; b.type='EXP'; b.code='HB9_BLANK'; b.blank=true; b.blocks=[]; b.status='planned'; H.open(b);
    if(!document.querySelector('.exh-fields select[onchange*="setExpStatus"]')) bad.push('a run with no steps has no way to say it is under way');
    delete LB.data.experiments[e.id]; delete LB.data.experiments[b.id]; return bad; })()`],
  ['HB10', `(async function(){ var H=__H, bad=[], e=H.mk('CTG','HB10_RUN'); repeatExperiment(e.id); await H.wait(100); var t=H.dlg(); H.shut();
    if(!/Replicate 2 of HB10_RUN/.test(t)) bad.push('the dialog does not name the replicate: "'+t.slice(0,120)+'"');
    delete LB.data.experiments[e.id]; return bad; })()`],
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
  await pg.evaluate(LIB);
  const findings = [];
  for (const [id, fn] of CHECKS) {
    if (ONLY && !ONLY.includes(id)) continue;
    await pg.evaluate(() => { __H.shut(); });
    let r; try { r = await pg.evaluate(fn); } catch (e) { r = ['the check itself threw: ' + String(e.message || e).split('\n')[0]]; }
    process.stdout.write(`  ${r.length ? '✗' : '✓'} ${id.padEnd(5)}${r.length ? ' — ' + r.length + ' finding(s)' : ''}\n`);
    r.forEach(m => findings.push({ id, m }));
  }
  await browser.close();
  errs.forEach(m => findings.push({ id: 'run', m: 'page error: ' + m }));
  failed = findings.length;
  findings.forEach(f => process.stdout.write(`     [${f.id}] ${f.m}\n`));
  if (!failed) process.stdout.write('\nThe experiment header holds: every invariant is met.\n');
} finally { srv.kill(); }
process.exit(failed ? 1 : 0);
