// Paste-a-protocol invariants — a protocol pasted as text becomes steps, and the durations in it are offers, never numbers invented.
//
//   PP1 reading the text   Numbered, bulleted and plain lines are steps; a wrapped line and a lettered sub-point join the step above; the
//                          lines before step 1 are left out and counted; "Day N" headers date the steps below them; a title ends at a sentence,
//                          not at a decimal point; 200 steps at most
//   PP2 a wait is offered  One duration is offered ticked (30 min, 2h15, 1,5 h, overnight, o/n); a range (10–20 min) is offered as its ends and
//                          middle and starts on none, and is NEVER added up (_parseWait("10–20 min") is 30); "3 × 5 min" is 5 min or 15; two
//                          durations in one step start on none; 10 mM, 37 °C, 30 s and "3 dilutions" are not durations
//   PP3 where the steps fall  An overnight wait (16 h or more) moves the next step to the next day, 3 days moves it 3, a short wait does not, an
//                          explicit "Day N" wins, an unpicked range moves nothing, and no step ever goes back a day
//   PP4 the dialog         Paste, read, choose chips (a chip can be taken back; a choice survives more text), Insert: the steps are appended after the
//                          last one with the title, the text kept in full, the dates, the wait exactly as picked (and none where nothing was),
//                          waitOwn so a preset rule cannot void it; one ⌘Z removes all of them; nothing to insert disables the button
//   PP5 text stays text    Markup in a pasted step is printed, in the preview and in the step it makes
//   PP6 it fits            The dialog is inside the window with its Insert button reachable at 390 and 1440 px, both themes, and the page does not
//                          scroll sideways
//
//   node tools/pasteproto_invariants.mjs [--only=PP1,PP4] [--file=apps/labbook/labbook.html]      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = arg('file', 'apps/labbook/labbook.html');
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/CLAUDE.md'); if (r.ok) break; } catch (e) {} await sleep(120); }
const browser = await chromium.launch();

const SEED = `(function(){
  var P=(LB.data.projects||[]).find(function(p){ return (p.sections||[]).length; }), S=P.sections[0];
  var tpl=LB.data.presets['WB'], su=Object.assign({},setupDefaultsFor('WB'),JSON.parse(JSON.stringify(tpl.setup||{}))), before={};
  Object.keys(LB.data.experiments).forEach(function(k){ before[k]=1; });
  buildExperimentFrom({pid:P.id,sid:S.id,key:'WB',tpl:tpl,startDate:addDays(todayStr(),-1),type:presetBase('WB'),title:tpl.title||'WB',code:'PP_WB',setup:su,plate:true});
  var e=Object.values(LB.data.experiments).filter(function(x){ return !before[x.id]; })[0]; save(); return e.id; })()`;

async function open({ w = 1440, h = 900, theme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([t]) => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('lb_backup_nudged', '1'); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} }, [theme]);
  await ctx.route(/gstatic\.com|firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage|fonts\.g/, r => r.abort());
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  page.on('dialog', d => { page.errs.push('native dialog: ' + d.message().slice(0, 80)); d.dismiss(); });
  await page.goto(BASE + '/' + FILE); await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof ppParse === 'function' && typeof renderAll === 'function', null, { timeout: 20000 }); await sleep(900);
  page.ctx = ctx; return page;
}
const parse = (page, t) => page.evaluate(t => { const r = ppParse(t); return { steps: r.steps.map(s => ({ title: s.title, day: s.day, text: s.text, offers: s.offers.map(o => o.min), labels: s.offers.map(o => o.label), pick: s.pick })), ignored: r.ignored, truncated: r.truncated, layout: ppLayout(r.steps) }; }, t);

if (run('PP1')) {
  const p = await open();
  const T = [
    ['numbered', '1. Seed cells\n2. Add compound\n3) Read', ['Seed cells', 'Add compound', 'Read']],
    ['step words', 'Step 1: Seed cells\nStep 2. Add compound', ['Seed cells', 'Add compound']],
    ['bullets', '- Spin\n* Resuspend\n• Plate', ['Spin', 'Resuspend', 'Plate']],
    ['plain lines', 'Seed cells\nAdd compound\nRead', ['Seed cells', 'Add compound', 'Read']],
    ['wrapped and lettered', '1. Seed cells in\n   6-well plates\n   a) 2 mL each\n2. Add compound', ['Seed cells in 6-well plates 2 mL each', 'Add compound']],
    ['a decimal is not a full stop', '1. Add 0.5 mL medium. Mix.', ['Add 0.5 mL medium']],
    ['windows line ends and blank lines', '1. Seed\r\n\r\n2. Read\r\n', ['Seed', 'Read']],
  ];
  for (const [n, t, want] of T) { const r = await parse(p, t); if (!same(r.steps.map(s => s.title), want)) bad('PP1', `${n}: got ${JSON.stringify(r.steps.map(s => s.title))}`); else ok(); }
  const pre = await parse(p, 'Cell viability protocol\nFrom the lab wiki\n1. Seed\n2. Read'); if (pre.steps.length !== 2 || pre.ignored !== 2) bad('PP1', `lines before step 1: ${JSON.stringify([pre.steps.length, pre.ignored])}`); else ok();
  const dy = await parse(p, 'Day 1 – Seeding\n1. Seed\nDay 2 (24 h later)\n2. Treat\n3. Read'); if (!same(dy.steps.map(s => s.day), [1, 2, 2]) || !same(dy.steps.map(s => s.title), ['Seed', 'Treat', 'Read'])) bad('PP1', `Day headers: ${JSON.stringify(dy.steps.map(s => [s.day, s.title]))}`); else ok();
  const dl = await parse(p, 'Day 2: add the compound and wash twice\nDay 3: read'); if (dl.steps.length !== 1 || dl.steps[0].day !== 2) bad('PP1', `a header with a sentence after it is a step: ${JSON.stringify(dl.steps)}`); else ok();
  const big = await parse(p, Array.from({ length: 260 }, (_, i) => `${i + 1}. Step ${i + 1}`).join('\n')); if (big.steps.length !== 200 || !big.truncated) bad('PP1', `260 steps: ${big.steps.length} ${big.truncated}`); else ok();
  const long = await parse(p, '1. ' + 'Resuspend the pellet gently in warm complete medium and mix well by pipetting up and down ten times'); if (long.steps[0].title.length > 71 || !/…$/.test(long.steps[0].title)) bad('PP1', `a long title is cut at a word: ${long.steps[0].title}`); else ok();
  const empty = await parse(p, '  \n\n'); if (empty.steps.length) bad('PP1', 'blank text made steps'); else ok();
  await p.ctx.close();
}

if (run('PP2')) {
  const p = await open();
  const one = async (t, want, pick = 0) => { const r = await parse(p, '1. ' + t); const s = r.steps[0]; if (!s || !same(s.offers, want) || s.pick !== (want.length ? pick : -1)) bad('PP2', `“${t}” offers ${JSON.stringify(s && s.offers)} pick ${s && s.pick}; wanted ${JSON.stringify(want)} pick ${want.length ? pick : -1}`); else ok(); };
  await one('Incubate 30 min at RT', [30]);
  await one('Incubate 2h15', [135]);
  await one('Incubate 1 h 30 min', [90]);
  await one('Incubate 1,5 h', [90]);
  await one('Incubate 1.5 hours', [90]);
  await one('Incubate 2 days', [2880]);
  await one('Incubate overnight at 37 °C', [960]);
  await one('Incubate O/N', [960]);
  await one('Incubate 1.5 h, about 90 min', [90]);
  await one('Shake 10–20 min', [10, 15, 20], -1);
  await one('Shake 10-20 min', [10, 15, 20], -1);
  await one('Incubate 1 to 2 h', [60, 90, 120], -1);
  await one('Incubate 5-10 min', [5, 10], -1);
  await one('Wash 3 × 5 min with PBS', [5, 15], -1);
  await one('Wash 3x5 min', [5, 15], -1);
  await one('Incubate 30 min at RT, then 10 min on ice', [30, 10], -1);
  await one('Cut 2 m of tubing and 5 m of cable', []);
  await one('Add 10 mM stock and 3 dilutions at 37 °C for 30 s', []);
  await one('Make 5 mL of 10 mM, 2 d', [2880]);
  // the trap: the library's own reader adds a range up; the importer must never take that number
  const sum = await p.evaluate(() => ({ lib: _parseWait('10–20 min'), offers: ppParse('1. Shake 10–20 min').steps[0].offers }));
  if (sum.lib === 30 && sum.offers.indexOf(30) >= 0) bad('PP2', '10–20 min was offered as 30 min'); else ok();
  await p.ctx.close();
}

if (run('PP3')) {
  const p = await open();
  const L = async t => (await parse(p, t)).layout;
  const cases = [
    ['overnight moves the next step', '1. Seed, incubate overnight\n2. Treat\n3. Read', [0, 1, 1]],
    ['a short wait does not', '1. Seed, incubate 6 h\n2. Treat', [0, 0]],
    ['3 days moves 3', '1. Treat, incubate 3 days\n2. Read', [0, 3]],
    ['16 h is overnight, 15 h is not', '1. A 16 h\n2. B 15 h\n3. C', [0, 1, 1]],
    ['an unpicked range moves nothing', '1. Incubate 12-24 h\n2. Read', [0, 0]],
    ['Day N wins', 'Day 1\n1. Seed, incubate overnight\nDay 3\n2. Read', [0, 2]],
    ['a wait and a Day header agree', 'Day 1\n1. Seed, incubate overnight\nDay 2\n2. Read', [0, 1]],
    ['never back', 'Day 3\n1. A\nDay 1\n2. B', [0, 0]],
  ];
  for (const [n, t, want] of cases) { const l = await L(t); if (!same(l, want)) bad('PP3', `${n}: ${JSON.stringify(l)} wanted ${JSON.stringify(want)}`); else ok(); }
  await p.ctx.close();
}

if (run('PP4') || run('PP5')) {
  const p = await open();
  const id = await p.evaluate(SEED); await sleep(300);
  await p.evaluate(id => { openExp(id); }, id); await sleep(700);
  const before = await p.evaluate(id => { const e = LB.data.experiments[id]; return { n: e.blocks.length, last: e.blocks[e.blocks.length - 1].date }; }, id);
  if (!(await p.evaluate(() => !!document.querySelector('.add-blk[onclick^="openPasteProtocol"]')))) bad('PP4', 'no “Paste protocol” button beside Add step'); else ok();
  await p.evaluate(() => openPasteProtocol()); await sleep(250);
  if (!(await p.evaluate(() => document.getElementById('pp-ok').disabled))) bad('PP4', 'Insert is enabled with nothing pasted'); else ok();
  const TXT = '1. Seed 8,000 cells/well in 100 µL. Incubate overnight at 37 °C.\n2. Add compound. Incubate 2h15.\n3. Add CellTiter-Glo, shake 10–20 min, read.\n4. <img src=x onerror=window.__x=1> spin. Incubate 5 min';
  await p.fill('#pp-ta', TXT); await sleep(200);
  const a = await p.evaluate(() => ({ sum: document.getElementById('pp-sum').textContent, rows: document.querySelectorAll('.pp-row').length, on: [...document.querySelectorAll('.pp-chip')].filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.textContent), days: [...document.querySelectorAll('.pp-day')].map(d => d.textContent), btn: document.getElementById('pp-ok').textContent, imgs: document.querySelectorAll('#lb-dialog img').length, x: window.__x || 0 }));
  if (a.rows !== 4 || !same(a.on, ['overnight (16 h)', '2 h 15 min', '5 min']) || !same(a.days, ['Day 1', 'Day 2']) || a.btn !== 'Insert 4 steps' || !/4 steps · 3 waits · 1 to choose/.test(a.sum)) bad('PP4', `the preview: ${JSON.stringify(a)}`); else ok();
  if (a.imgs || a.x) bad('PP5', `markup became an element in the preview: ${JSON.stringify(a)}`); else ok();
  const look = await p.evaluate(() => { const on = document.querySelector('.pp-chip[aria-pressed="true"]'), off = document.querySelector('.pp-chip[aria-pressed="false"]'), g = e => getComputedStyle(e);
    return on && off && g(on).backgroundColor !== g(off).backgroundColor && g(on).color !== g(off).color; });
  if (!look) bad('PP4', 'a taken wait does not look different from one left alone'); else ok();
  // choose the middle of the range, take it back, choose again; then add text and the choice must stay
  await p.click('.pp-chip[data-i="2"][data-j="1"]'); await sleep(80);
  let c = await p.evaluate(() => document.querySelector('.pp-chip[data-i="2"][data-j="1"]').getAttribute('aria-pressed'));
  await p.click('.pp-chip[data-i="2"][data-j="1"]'); await sleep(80);
  const off = await p.evaluate(() => document.querySelector('.pp-chip[data-i="2"][data-j="1"]').getAttribute('aria-pressed'));
  if (c !== 'true' || off !== 'false') bad('PP4', `a chip did not toggle: ${c} then ${off}`); else ok();
  await p.click('.pp-chip[data-i="2"][data-j="1"]'); await sleep(80);
  await p.fill('#pp-ta', TXT + '\n5. Read the plate'); await sleep(200);
  const kept = await p.evaluate(() => document.querySelector('.pp-chip[data-i="2"][data-j="1"]').getAttribute('aria-pressed'));
  if (kept !== 'true') bad('PP4', 'a chosen wait was lost when more text was pasted'); else ok();
  await p.click('.pp-chip[data-i="1"][data-j="0"]'); await sleep(80); // take the 2h15 back: nothing picked there
  await p.fill('#pp-ta', TXT); await sleep(200);
  await p.click('#pp-ok'); await sleep(600);
  const r = await p.evaluate(id => { const e = LB.data.experiments[id]; return { n: e.blocks.length, added: e.blocks.slice(-4).map(b => ({ title: b.title, html: b.html, date: b.date, off: b.dayOffset, w: b.waitMin == null ? null : b.waitMin, own: !!b.waitOwn, same: !!b.waitSameDay, done: b.done })), dlg: !!document.querySelector('#lb-dialog.open'), x: window.__x || 0, imgs: document.querySelectorAll('#pane-ed img[src="x"]').length }; }, id);
  // step 1 waits overnight into step 2 (another day), step 2 has no wait (the 2h15 was taken back), step 3 waits 15 min before step 4 (same day), step 4 is last
  const want = [{ w: 960, own: true, same: false }, { w: null, own: false, same: false }, { w: 15, own: true, same: true }, { w: 5, own: true, same: false }];
  const got = r.added.map(b => ({ w: b.w, own: b.own, same: b.same }));
  if (r.n !== before.n + 4 || !same(got, want)) bad('PP4', `what was inserted: ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`); else ok();
  const next = (d, n) => { const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); };
  if (!same(r.added.map(b => b.date), [before.last, next(before.last, 1), next(before.last, 1), next(before.last, 1)])) bad('PP4', `dates: ${JSON.stringify(r.added.map(b => b.date))} after ${before.last}`); else ok();
  if (r.added[0].title !== 'Seed 8,000 cells/well in 100 µL' || r.added[0].html !== '<p>Seed 8,000 cells/well in 100 µL. Incubate overnight at 37 °C.</p>') bad('PP4', `title and the text kept in full: ${JSON.stringify(r.added[0])}`); else ok();
  if (r.dlg) bad('PP4', 'the dialog stayed open after Insert'); else ok();
  if (r.x || r.imgs) bad('PP5', `markup in a pasted step became an element in the experiment: ${JSON.stringify(r)}`); else ok();
  const shown = await p.evaluate(() => [...document.querySelectorAll('#pane-ed .dfx-blk-t')].some(n => n.textContent.indexOf('<img src=x onerror') === 0));
  if (r.added[3].title.indexOf('<img') !== 0 || r.added[3].html.indexOf('<img') >= 0 || r.added[3].html.indexOf('&lt;img') < 0 || !shown) bad('PP5', `markup in a step must be text in its title and escaped in its html: ${JSON.stringify([r.added[3], shown])}`); else ok();
  // the library's own reader of the wait agrees with what was stored
  const bw = await p.evaluate(id => { const e = LB.data.experiments[id], b = e.blocks[e.blocks.length - 4]; return { min: blkWait(e, b).min, txt: _waitTxt(b.waitMin) }; }, id);
  if (bw.min !== 960) bad('PP4', `blkWait does not read the stored wait: ${JSON.stringify(bw)}`); else ok();
  // one undo takes all four away
  await p.evaluate(() => lbUndo()); await sleep(300);
  const un = await p.evaluate(id => LB.data.experiments[id].blocks.length, id);
  if (un !== before.n) bad('PP4', `one undo left ${un} steps (wanted ${before.n})`); else ok();
  if (p.errs.length) bad('PP4', p.errs[0]);
  await p.ctx.close();
}

if (run('PP6')) {
  for (const [w, h] of [[1440, 900], [390, 780]]) for (const theme of ['light', 'dark']) {
    const p = await open({ w, h, theme }); const id = await p.evaluate(SEED); await sleep(200);
    await p.evaluate(id => openExp(id), id); await sleep(600);
    await p.evaluate(() => openPasteProtocol()); await sleep(200);
    await p.fill('#pp-ta', 'Day 1\n1. Seed 8,000 cells/well in 100 µL, incubate overnight\n2. Add compound, incubate 2h15\n3. Add CellTiter-Glo, shake 10–20 min, read\n4. Wash 3 × 5 min with PBS\n5. Incubate 30 min at RT, then 10 min on ice\n6. Read\n7. Export\n8. Analyse'); await sleep(250);
    const m = await p.evaluate(() => { const c = document.getElementById('lb-dialog-card').getBoundingClientRect(), ok = document.getElementById('pp-ok').getBoundingClientRect(), b = document.querySelector('.pp-body');
      return { inside: c.left >= -1 && c.right <= innerWidth + 1 && c.top >= -1 && c.bottom <= innerHeight + 1, ok: ok.top >= 0 && ok.bottom <= innerHeight && ok.right <= innerWidth, pageX: document.documentElement.scrollWidth > innerWidth + 1, bodyX: b.scrollWidth > b.clientWidth + 1, scrolls: b.scrollHeight > b.clientHeight }; });
    if (!m.inside || !m.ok || m.pageX || m.bodyX) bad('PP6', `${w}px ${theme}: ${JSON.stringify(m)}`); else ok();
    if (p.errs.length) bad('PP6', `${w}px ${theme}: ${p.errs[0]}`);
    await p.ctx.close();
  }
}

await browser.close(); srv.kill();
console.log(findings.length ? findings.join('\n') + `\n${findings.length} finding(s), ${passed} checks passed` : `✓ ${passed} checks pass`);
process.exit(findings.length ? 1 : 0);
