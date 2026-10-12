// Cell-check invariants — Today's morning question about the cell cultures (Labbook).
//
// Labbook reads the cultures from the shell (window.parent.JournalStore), so this drives labbook.html inside an iframe
// of a stub host that has a JournalStore, computeCellAlerts and openApp. What it holds:
//
//   C1  the card      Today opens with every culture asking, "N of N to check", one OK / Need to split / Issue each;
//                     a due split is outlined as a suggestion and never pre-selected
//   C2  split         "Need to split" makes exactly one planner task per culture, dated today and linked to the
//                     culture; asking again does not duplicate it; changing the answer before it is done removes it
//   C3  issue         needs its one line (an empty save records nothing), writes the flag and a history line onto
//                     the culture, and deletes nothing; an OK afterwards clears the flag it raised
//   C4  collapse      when everything is answered the card is one line, and Edit reopens it
//   C5  the split     a split logged in Incubator (seeded moves) ticks the task by itself
//   C6  the journal   the day page says what was answered, written from the record
//   C8  seed          a split for an assay: the picker offers what is planned or ongoing that day first (never a finished
//                     experiment), the task is the split task plus the experiment, the experiment gets the cell line
//                     appended (what was there stays), and changing the answer takes back only what the check added
//   C7  stable        the rows keep their order while they are answered; no console errors
//
//   node tools/cellcheck_invariants.mjs [--base=http://127.0.0.1:PORT]      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const waitHttp = async u => { for (let i = 0; i < 60; i++) { try { if ((await fetch(u)).ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 250)); } throw new Error('server did not start'); };

const HOST = `<!doctype html><meta charset=utf-8><body style="margin:0"><iframe id=f src="/apps/labbook/labbook.html" style="width:100vw;height:100vh;border:0"></iframe>
<script>
var now=Date.now(), D=86400000, SOD=new Date().setHours(0,0,0,0);   // a culture seeded 'half a day ago' was seeded TODAY after noon, which Labbook reads as a split logged today and ticks the task — so this one is always seeded before midnight
var DATA={incubator:{
 a1:{line:'HCT116 KO',passage:12,vessel:'T75',seeded:now-3.2*D,intervalDays:3,history:[]},
 b2:{line:'HEK293T',passage:7,vessel:'6-well',seeded:Math.min(now-0.5*D,SOD-3600000),intervalDays:3,history:[],mycoLast:now-D},
 c3:{line:'Jurkat',passage:20,vessel:'T25',seeded:now-1*D,intervalDays:3,history:[],mycoLast:now-D}}};
var subs=[]; window.__writes=[];
window.JournalStore={get:function(){return DATA;},attach:function(){},subscribe:function(f){subs.push(f);return function(){};},
 updateCell:function(id,p){DATA.incubator[id]=Object.assign({},DATA.incubator[id],p);window.__writes.push([id,p]);subs.forEach(function(f){f();});}};
window.computeCellAlerts=function(cell,now){ now=now||Date.now(); var out=[];
  if(cell.issue) return [{level:'warn',tag:'issue',msg:'Issue — '+(cell.issue.note||'flagged')}];
  var d=(now-cell.seeded)/86400000;
  if(d>=cell.intervalDays+1) out.push({level:'warn',tag:'split',msg:'Split overdue'});
  else if(d>=cell.intervalDays) out.push({level:'warn',tag:'split',msg:'Due to split'});
  if(!cell.mycoLast) out.push({level:'soft',tag:'myco',msg:'No mycoplasma test logged'});
  return out; };
window.openApp=function(){};
</script>`;

const findings = []; let checks = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const eq = (inv, what, got, want) => { checks++; if (JSON.stringify(got) !== JSON.stringify(want)) bad(inv, `${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
const yes = (inv, what, v) => { checks++; if (!v) bad(inv, what); };

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
try {
  await waitHttp(base + '/');
  const browser = await chromium.launch();
  for (const [w, h, tag] of [[1280, 900, 'desktop'], [390, 844, 'phone']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e && e.message || e)));
    await p.route('**/__host.html', r => r.fulfill({ contentType: 'text/html', body: HOST }));
    await p.goto(base + '/__host.html'); await p.waitForTimeout(2200);
    const f = p.frames().find(x => x.url().includes('labbook.html'));
    await f.waitForFunction(() => window.LB && LB.data && (LB.data.projects || []).length, null, { timeout: 20000 });
    const dlg = f.locator('#lb-dialog.open button'); if (await dlg.count()) await dlg.first().click();
    await f.evaluate(() => selectNode('journal')); await p.waitForTimeout(500);
    const W = tag + ': ';
    const txt = () => f.evaluate(() => { const n = document.getElementById('lb-cultures'); return n ? n.innerText.replace(/\s+/g, ' ') : null; });
    const seg = (line, k) => f.locator('.cul-row.cc', { hasText: line }).locator('.mck-seg .mck-' + k);
    const tasks = () => f.evaluate(() => Object.values(LB.data.planner.tasks).filter(t => t.cellId).map(t => ({ id: t.id, date: t.date, cell: t.cellId, done: !!t.done })));
    const order = () => f.evaluate(() => [...document.querySelectorAll('#lb-cultures .cul-line')].map(x => x.textContent));
    const today = await f.evaluate(() => todayStr());
    await f.evaluate(t => { const pj = LB.data.projects[0].id, mk = (id, code, title, status, extra) => LB.data.experiments[id] = Object.assign({ id, code, title, projectId: pj, status, blocks: [], created: Date.now(), updated: Date.now() }, extra || {});
      mk('x1', 'EX1', 'Dose response', 'planned', { cellLines: 'HeLa', blocks: [{ id: 'bk1', title: 'Seed plate', date: t }] });
      mk('x2', 'EX2', 'Time course', 'ongoing'); mk('x3', 'EX3', 'Finished one', 'done', { blocks: [{ id: 'bk3', title: 'old', date: t }] });
      mk('x4', 'EX4', 'Later assay', 'planned'); renderAll(); }, today);

    // C1
    yes('C1', W + 'the card says how many to check', /3 of 3 to check/.test(await txt() || ''));
    eq('C1', W + 'four answers per culture', await f.locator('.mck-seg button').count(), 12);
    eq('C1', W + 'nothing is pre-selected', await f.locator('.mck-seg button.on').count(), 0);
    eq('C1', W + 'the due split is outlined, only that one', await f.evaluate(() => [...document.querySelectorAll('.mck-seg button.sug')].map(b => b.className.includes('mck-split') && b.closest('.cul-row').innerText.includes('HCT116'))), [true]);
    const order0 = await order();

    // C2
    await seg('HCT116', 'split').click(); await p.waitForTimeout(150);
    eq('C2', W + 'one task for the culture, today, linked', await tasks(), [{ id: 'cell_a1_' + today, date: today, cell: 'a1', done: false }]);
    await f.evaluate(() => setCellCheck('a1', 'ok')); await p.waitForTimeout(150);
    eq('C2', W + 'changing the answer before the split removes the task', await tasks(), []);
    await f.evaluate(() => { setCellCheck('a1', 'split'); setCellCheck('a1', 'split'); }); await p.waitForTimeout(150);
    eq('C2', W + 'asking twice is still one task', (await tasks()).length, 1);

    // C3
    await seg('HEK293T', 'ok').click(); await p.waitForTimeout(100);
    await seg('Jurkat', 'issue').click(); await p.waitForTimeout(150);
    yes('C3', W + 'Issue opens the line to write', await f.locator('#cc-note').count() === 1);
    yes('C3', W + 'nothing is recorded before the line is written', !(await f.evaluate(d => (LB.data.cellCheck[d] || {}).c3, today)));
    await f.locator('.mck-ask .btn.sm').first().click(); await p.waitForTimeout(100);
    yes('C3', W + 'an empty save records nothing', !(await f.evaluate(d => (LB.data.cellCheck[d] || {}).c3, today)) && await f.locator('#cc-note').count() === 1);
    await f.locator('#cc-note').fill('Contaminated'); await f.locator('#cc-note').press('Enter'); await p.waitForTimeout(250);
    const wr = await p.evaluate(() => window.__writes.filter(x => x[0] === 'c3').map(x => ({ issue: x[1].issue && x[1].issue.note, hist: (x[1].history || []).map(h => h.action) })));
    eq('C3', W + 'the culture got the flag and a history line', wr, [{ issue: 'Contaminated', hist: ['issue'] }]);
    yes('C3', W + 'the culture still exists', await p.evaluate(() => !!JournalStore.get().incubator.c3));

    // C4
    yes('C4', W + 'all answered: one line', /3 in culture · 1 OK · 1 need to split · 1 with an issue/.test(await txt() || '') && await f.locator('#lb-cultures .cul-row').count() === 0);
    await f.locator('.mck-tog').click(); await p.waitForTimeout(100);
    eq('C4', W + 'Edit reopens the three rows', await f.locator('#lb-cultures .cul-row').count(), 3);
    eq('C7', W + 'rows keep their order while answered (an issue is the worst, and does not move up)', await order(), order0);
    await seg('Jurkat', 'ok').click(); await p.waitForTimeout(250);
    eq('C3', W + 'an OK afterwards clears the flag it raised', await p.evaluate(() => !JournalStore.get().incubator.c3.issue), true);
    eq('C3', W + 'and says so in the history', await p.evaluate(() => JournalStore.get().incubator.c3.history.map(h => h.action)), ['issue', 'issue cleared']);

    // C5
    await p.evaluate(() => JournalStore.updateCell('a1', { seeded: Date.now() })); await p.waitForTimeout(400);
    eq('C5', W + 'a split logged in Incubator ticks the task', (await tasks()).map(t => t.done), [true]);

    // C6
    await f.evaluate(() => openDayPage(todayStr())); await p.waitForTimeout(400);
    const day = await f.evaluate(() => { const t = document.querySelector('.nb-day'); return t ? t.innerText.replace(/\s+/g, ' ') : ''; });
    yes('C6', W + 'the journal day lists the answers', /Cell cultures/.test(day) && /HEK293T OK/.test(day) && /HCT116 KO Need to split/.test(day) && /Jurkat OK/.test(day));

    // C8
    await f.evaluate(() => selectNode('journal')); await p.waitForTimeout(400);
    await f.evaluate(() => { CC_OPEN = true; ccPatch(); }); await p.waitForTimeout(100);
    const ch = await f.evaluate(d => ccAssayChoices(d).map(x => x.label.split(' \u00b7 ')[0] + '|' + x.sub.split(' \u00b7 ').slice(-2).join('/')), today);
    eq('C8', W + 'planned today and ongoing first, then the rest, a finished one never, "no assay" last', ch.map(x => x.split('|')[0]), ['EX1 ', 'EX2 ', 'EX4 ', 'No assay yet'].map(x => x.trim()).map(x => x === 'EX1' ? 'EX1' : x));
    await seg('HEK293T', 'seed').click(); await p.waitForTimeout(250);
    yes('C8', W + 'Seed opens the picker with the suggestions', await f.locator('#lb-pick-list .dlg-item').count() === 4);
    await f.locator('#lb-pick-list .dlg-item', { hasText: 'EX1' }).click(); await p.waitForTimeout(300);
    const st = () => f.evaluate(d => ({ rec: LB.data.cellCheck[d].b2, task: LB.data.planner.tasks['cell_b2_' + d], cl: ['x1', 'x2'].map(i => LB.data.experiments[i].cellLines || '') }), today);
    let a = await st();
    eq('C8', W + 'the answer carries the assay', [a.rec.s, a.rec.exp, a.rec.code], ['seed', 'x1', 'EX1']);
    eq('C8', W + 'the task is the split task plus the experiment', [a.task.cellId, a.task.expId, /^Seed cells · HEK293T/.test(a.task.text), /EX1/.test(a.task.text)], ['b2', 'x1', true, true]);
    eq('C8', W + 'the cell line is appended, HeLa stays', a.cl, ['HeLa, HEK293T', '']);
    await f.evaluate(() => { ccSeedPick('b2'); }); await p.waitForTimeout(250);
    await f.locator('#lb-pick-list .dlg-item', { hasText: 'EX2' }).click(); await p.waitForTimeout(300);
    a = await st();
    eq('C8', W + 'seeding for another assay moves it: the first gets its line back, one task', [a.cl, a.task.expId, Object.values(await f.evaluate(() => LB.data.planner.tasks)).filter(t => t.cellId === 'b2').length], [['HeLa', 'HEK293T'], 'x2', 1]);
    await seg('HEK293T', 'ok').click(); await p.waitForTimeout(250);
    a = await st();
    eq('C8', W + 'OK afterwards removes the task and the line it added', [a.cl, !!a.task], [['HeLa', ''], false]);
    await f.evaluate(() => { ccSeedPick('b2'); }); await p.waitForTimeout(250);
    await f.locator('#lb-pick-list .dlg-item', { hasText: 'No assay yet' }).click(); await p.waitForTimeout(300);
    a = await st();
    eq('C8', W + 'no assay yet is a seed without a link', [a.rec.s, a.rec.exp || null, a.task.expId, a.cl], ['seed', null, null, ['HeLa', '']]);
    await p.evaluate(() => JournalStore.updateCell('b2', { seeded: Date.now() })); await p.waitForTimeout(400);
    eq('C8', W + 'the split logged in Incubator ticks a seed too', (await st()).task.done, true);
    await f.evaluate(() => openDayPage(todayStr())); await p.waitForTimeout(400);
    yes('C8', W + 'the journal day says Seed', /HEK293T Seed/.test(await f.evaluate(() => document.querySelector('.nb-day').innerText.replace(/\s+/g, ' '))));

    eq('C7', W + 'no console errors', errs, []);
    await ctx.close();
  }
  await browser.close();
} finally { srv.kill(); }
if (findings.length) { findings.forEach(x => console.log(x)); console.log(`\n${findings.length} finding(s) in ${checks} checks.`); process.exit(1); }
console.log(`✓ cell check — ${checks} checks hold.`);
