// The Journal's list of days and its writing page — the classes of bug Jon found (2026-11-10: "páginas de días que no
// aparecen", "la página de escritura no es cómoda", "el tabulador no funciona bien"), as checks that run every time.
// Each is driven with real keys and real clicks, and each was proven by putting the old behaviour back.
//
//   J1  every day that exists is listed   a day with only a picture, only a plan (past), only a planner task is a page in the list;
//                           the open day is always there; a cleared editor's `<br>` is not a note; a day still to come is not listed
//                           (the list asked for words, so a day of pictures, of plans or a day you had walked to with the arrows was not there)
//   J2  the list keeps its place          opening a day well down a long list leaves it in view, and the list is one scroll
//                           (every click rebuilt the list at the top: the day you opened was off the screen)
//   J3  Tab is a word processor's Tab     in a list item it nests (and Shift+Tab un-nests; a checklist stays a checklist); at the start
//                           of a paragraph it indents two ems; in the middle of a line it types a tab; in a table it moves to the next cell
//                           and, at the last, adds a row; Esc then Tab leaves the text; ⌘Z takes an indent back
//   J4  the page formats as you type      `- ` `1. ` `[] ` `# ` `> ` at the start of a line, `---` then Enter; Backspace at the start of a
//                           heading makes it text
//   J5  the toolbar acts and says so      Bold / lists / heading style / colour work on the selection, the button is lit while the caret is
//                           in bold, a click on it never takes the caret out of the page, and every control has a name
//   J6  a paste arrives clean             Word / Docs markup (mso classes, fonts, ids, empty spans) is gone, bold, lists and tables stay,
//                           and a copy from a Labbook page keeps its checklist
//   J7  the page is whole                 an empty page says so whatever it holds, a table at the foot has a line after it, a click under
//                           the last line writes there, a cleared day stores nothing, and what is typed is there after a reload
//   J8  the bar fits                      the bar is two rows at most and nothing runs off; in a pane under 640px it is one row that scrolls
//                           inside itself (a laptop with both columns open, a phone); the page never scrolls sideways
//
//   node tools/journal_invariants.mjs [--url=URL] [--only=J1,J3]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('server did not come up: ' + url); }

let srv = null, base = args.url;
if (!base) { const port = await freePort(); srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); base = `http://127.0.0.1:${port}/apps/labbook/labbook.html`; await waitHttp(base); }
const browser = await chromium.launch();
const findings = [], counts = {};
const run = id => !ONLY || ONLY.includes(id);
const bad = (id, m) => findings.push({ id, m });
const tick = id => { counts[id] = (counts[id] || 0) + 1; };

async function open(ctx) {
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('dialog', d => { errs.push('native dialog: ' + d.message().slice(0, 80)); d.dismiss(); });
  await page.goto(base); await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof renderAll === 'function' && typeof jrBarHtml === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(900);
  return { page, errs };
}
const newCtx = (w = 1440, h = 900) => browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] }).then(async c => {
  await c.route(/gstatic\.com|firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage|fonts\.g/, r => r.abort());
  await c.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('lb_backup_nudged', '1'); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} });
  return c; });
// A day opened and its editor focused with the caret at the end of an empty page.
async function day(page, D, html = '') {
  await page.evaluate(([D, html]) => { if (html) { LB.data.notebook[D] = { date: D, html }; save(); } else { delete LB.data.notebook[D]; } openDayPage(D); }, [D, html]);
  await page.waitForSelector('#pane-ed .jr-ed');
  await page.locator('#pane-ed .jr-ed').click();
}
// Selection by script: Ctrl+A / Ctrl+End / Home are not the same keys on a Mac, and what is under test is the page, not the OS.
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';
const selAll = page => page.evaluate(() => { const e = jrEd(); e.focus(); getSelection().selectAllChildren(e); });
const caretEnd = page => page.evaluate(() => { const e = jrEd(); e.focus(); const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) last = n; const r = document.createRange(); if (last) { r.setStart(last, last.textContent.length); } else { r.selectNodeContents(e); } r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
const caretStart = page => page.evaluate(() => { const e = jrEd(); e.focus(); const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const n = w.nextNode(); const r = document.createRange(); r.setStart(n, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
const html = page => page.evaluate(() => jrEd().innerHTML);
const type = async (page, t) => { await page.keyboard.type(t, { delay: 25 }); };

try {
  // ── J1 ──
  if (run('J1')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const r = await page.evaluate(() => {
      var T = todayStr(), out = {};
      var P = (LB.data.projects || []).find(function (p) { return (p.sections || []).length; }), S = P.sections[0];
      var key = Object.keys(LB.data.presets || {})[0], tpl = LB.data.presets[key];
      var su = Object.assign({}, setupDefaultsFor(key), JSON.parse(JSON.stringify(tpl.setup || {})));
      var before = Object.assign({}, LB.data.experiments);
      // a run whose first step is planned on a past day and never ticked, and one with a step ticked yesterday
      buildExperimentFrom({ pid: P.id, sid: S.id, key: key, tpl: tpl, startDate: addDays(T, -9), type: presetBase(key), title: 'J1', code: 'JJ_NB1', setup: su, plate: true });
      var e = Object.values(LB.data.experiments).filter(function (x) { return !before[x.id]; })[0];
      out.planned = e.blocks.map(function (b) { return b.date; }).filter(function (d) { return d && d < T; })[0];
      LB.data.notebook[addDays(T, -2)] = { date: addDays(T, -2), html: '<img class="lb-att" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">' };
      LB.data.notebook[addDays(T, -3)] = { date: addDays(T, -3), html: '<br>' };
      LB.data.notebook[addDays(T, 4)] = { date: addDays(T, 4), html: '<p>a thing for next week</p>' };
      plannerTasks()['jt1'] = { id: 'jt1', date: addDays(T, -4), text: 'a task', done: false, created: Date.now(), updated: Date.now() };
      save();
      out.days = journalDays(); out.T = T; return out; });
    tick('J1');
    const T = r.T, d = n => { const x = new Date(T + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    if (!r.days.includes(d(-2))) bad('J1', 'a day that holds only a picture is not in the list');
    if (r.planned && !r.days.includes(r.planned)) bad('J1', 'a past day with steps planned and nothing written is not in the list');
    if (!r.planned) bad('J1', 'the test could not plan a past step (the test is void)');
    if (!r.days.includes(d(-4))) bad('J1', 'a day with a planner task is not in the list');
    if (r.days.includes(d(-3))) bad('J1', 'a day whose note is only `<br>` is listed as if it had been written on');
    if (!r.days.includes(d(4))) bad('J1', 'a day to come that has a note is not in the list');
    // the open day, and a day to come with nothing on it
    await page.evaluate(n => openDayPage(addDays(todayStr(), n)), 9);
    const open9 = await page.evaluate(() => journalDays().includes(addDays(todayStr(), 9)));
    if (!open9) bad('J1', 'the day that is open is not in the list (the list does not say where you are)');
    await page.evaluate(() => openDayPage(todayStr()));
    if (await page.evaluate(() => journalDays().includes(addDays(todayStr(), 9)))) bad('J1', 'an empty day to come stays in the list after it is left');
    // the list on screen says the same and names what each day holds
    const rows = await page.evaluate(() => [...document.querySelectorAll('.jr-days .jr-day')].map(x => x.getAttribute('data-day') + '|' + x.textContent));
    if (!rows.some(x => x.startsWith(d(-4)) && /task/.test(x))) bad('J1', 'a day of tasks does not say so in the list: ' + rows.slice(0, 6).join(' / '));
    if (!rows.some(x => x.startsWith(d(-2)) && /Picture/i.test(x))) bad('J1', 'a day of pictures does not say so in the list');
    errs.forEach(m => bad('J1', 'page error: ' + m)); await ctx.close();
  }
  // ── J2 ──
  if (run('J2')) {
    const ctx = await newCtx(1440, 700); const { page, errs } = await open(ctx);
    await page.evaluate(() => { var T = todayStr(); for (var i = 1; i <= 60; i++) { var D = addDays(T, -i); LB.data.notebook[D] = { date: D, html: '<p>day ' + i + '</p>' }; } save(); openDayPage(T); });
    await page.waitForSelector('.jr-days .jr-day');
    tick('J2');
    const m = await page.evaluate(() => { var d = document.getElementById('jr-days'), pg = document.getElementById('pane-pages'); return { max: d.scrollHeight - d.clientHeight, outer: pg.scrollHeight - pg.clientHeight }; });
    if (m.max < 100) bad('J2', 'the list of days did not overflow (the test is void)');
    await page.evaluate(() => { var d = document.getElementById('jr-days'); d.scrollTop = d.scrollHeight; });
    const target = await page.evaluate(() => { var rows = [...document.querySelectorAll('#jr-days .jr-day')]; return rows[rows.length - 3].getAttribute('data-day'); });
    await page.locator(`#jr-days .jr-day[data-day="${target}"]`).click();
    await page.waitForTimeout(200);
    const after = await page.evaluate(t => { var d = document.getElementById('jr-days'), on = d.querySelector('.jr-day.active'); if (!on) return { none: true };
      var a = on.getBoundingClientRect(), b = d.getBoundingClientRect(); return { top: d.scrollTop, on: on.getAttribute('data-day'), inView: a.top >= b.top - 1 && a.bottom <= b.bottom + 1 }; }, target);
    if (after.none) bad('J2', 'after opening a day from the list no row is marked open');
    else if (after.on !== target) bad('J2', `opened ${target} and the marked day is ${after.on}`);
    else if (after.top < 50) bad('J2', 'a click on a day well down the list put the list back at the top');
    else if (!after.inView) bad('J2', 'the day just opened is not in view in the list');
    // the arrows bring the day into view too
    await page.evaluate(() => openDayPage(addDays(todayStr(), -55), true)); await page.waitForTimeout(150);
    const arrow = await page.evaluate(() => { var d = document.getElementById('jr-days'), on = d.querySelector('.jr-day.active'), a = on.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; });
    if (!arrow) bad('J2', 'a day reached with the arrows or the date picker is not brought into view in the list');
    errs.forEach(m => bad('J2', 'page error: ' + m)); await ctx.close();
  }
  // ── J3 ──
  if (run('J3')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    // a list: Tab nests, Shift+Tab un-nests
    await day(page, '2026-03-02');
    await type(page, 'one'); await page.keyboard.press('Enter'); await type(page, 'two');
    await selAll(page); await page.evaluate(() => document.execCommand('insertUnorderedList'));
    await caretEnd(page);
    await page.keyboard.press('Tab'); tick('J3');
    let h = await html(page);
    if (!/<li>one<\/li><ul><li>two<\/li><\/ul>|<li>one<ul>.*<li>two<\/li><\/ul>/.test(h.replace(/\s/g, ''))) bad('J3', 'Tab in a list item did not nest it: ' + h);
    await page.keyboard.press('Shift+Tab');
    h = await html(page);
    if (/<ul>.*<ul>/.test(h)) bad('J3', 'Shift+Tab did not bring the nested item back out: ' + h);
    // a checklist stays a checklist one level down
    await day(page, '2026-03-03');
    await type(page, 'a'); await page.keyboard.press('Enter'); await type(page, 'b');
    await selAll(page); await page.evaluate(() => insertTodo());
    await caretEnd(page); await page.keyboard.press('Tab');
    const nest = await page.evaluate(() => { var u = jrEd().querySelectorAll('ul.lb-check ul'); return u.length ? [...u].every(x => x.classList.contains('lb-check')) : null; });
    if (nest === null) bad('J3', 'Tab in a checklist item did not nest it'); else if (!nest) bad('J3', 'a nested checklist item lost its checkbox (the new level is a bare bullet list)');
    // a paragraph: at its start Tab indents two ems, Shift+Tab takes it back, ⌘Z too
    await day(page, '2026-03-04');
    await type(page, 'hello world');
    await caretStart(page); await page.keyboard.press('Tab');
    let ml = await page.evaluate(() => { var p = jrEd().firstElementChild; return p && p.style.marginLeft; });
    if (ml !== '2em') bad('J3', `Tab at the start of a paragraph left margin-left ${ml} (wanted 2em)`);
    if (await page.evaluate(() => /<p><blockquote|<blockquote/.test(jrEd().innerHTML))) bad('J3', 'Tab put a <blockquote> in the page: ' + await html(page));
    await page.keyboard.press('Tab');
    ml = await page.evaluate(() => jrEd().firstElementChild.style.marginLeft); if (ml !== '4em') bad('J3', `a second Tab gave ${ml} (wanted 4em)`);
    await page.keyboard.press('Shift+Tab'); ml = await page.evaluate(() => jrEd().firstElementChild.style.marginLeft); if (ml !== '2em') bad('J3', `Shift+Tab gave ${ml} (wanted 2em)`);
    await page.keyboard.press(MOD + '+z'); ml = await page.evaluate(() => jrEd().firstElementChild.style.marginLeft); if (ml !== '4em') bad('J3', `⌘Z after an indent gave ${ml}: the indent was not taken back (wanted 4em)`);
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
    if ((await page.evaluate(() => jrEd().firstElementChild.getAttribute('style')))) bad('J3', 'a paragraph indented and brought back is left with a style attribute');
    // reload: nothing becomes empty lines
    await page.evaluate(() => { var p = jrEd().firstElementChild; p.style.marginLeft = '2em'; jrInput(jrEd()); });
    await page.waitForTimeout(800);
    await page.evaluate(() => { openDayPage('2026-03-02'); openDayPage('2026-03-04'); });
    if ((await html(page)).replace(/ style="margin-left: 2em;"/, '') !== '<div>hello world</div>') bad('J3', 'an indented paragraph does not come back as it was: ' + await html(page));
    // mid-line: a tab is typed
    await day(page, '2026-03-05');
    await type(page, 'ab'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Tab');
    const tab = await page.evaluate(() => jrEd().textContent);
    if (!/^a[\u00a0 ]{4}b$/.test(tab)) bad('J3', 'Tab in the middle of a line did not type a tab: ' + JSON.stringify(tab));
    await page.keyboard.press('Shift+Tab');
    if ((await page.evaluate(() => jrEd().textContent)).length !== 2) bad('J3', 'Shift+Tab after a tab did not take it back');
    // a table
    await day(page, '2026-03-06');
    await page.evaluate(() => { jrFocus(); insertTableRC(2, 2); });
    await page.waitForTimeout(100);
    await page.evaluate(() => { var c = jrEd().querySelector('th'); var r = document.createRange(); r.selectNodeContents(c); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await type(page, 'A'); await page.keyboard.press('Tab'); await type(page, 'B'); await page.keyboard.press('Tab'); await type(page, 'C');
    const tb = await page.evaluate(() => [...jrEd().querySelectorAll('th,td')].map(c => c.textContent.replace(/ /g, '').trim()));
    if (tb.join('|') !== 'A|B|C|') bad('J3', 'Tab through a table did not walk the cells in order: ' + tb.join('|'));
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await type(page, 'Z');
    const rows = await page.evaluate(() => jrEd().querySelectorAll('tr').length);
    if (rows !== 3) bad('J3', `Tab in the last cell did not add a row (${rows} rows)`);
    if (await page.evaluate(() => document.activeElement !== jrEd())) bad('J3', 'Tab in a table left the page');
    // Esc, then Tab, leaves the text: the keyboard is not trapped
    await day(page, '2026-03-07'); await type(page, 'x');
    await page.keyboard.press('Escape'); await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement === jrEd())) bad('J3', 'Esc then Tab did not leave the page: the keyboard is trapped in the text');
    // and without Esc the focus stays
    await day(page, '2026-03-07'); await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement !== jrEd())) bad('J3', 'a plain Tab left the page (it should be the text\'s)');
    // Esc, then typing, then Tab: the Esc is spent
    await page.keyboard.press('Escape'); await type(page, 'y'); await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement !== jrEd())) bad('J3', 'Tab left the page after Esc and more typing (the Esc should be spent)');
    errs.forEach(m => bad('J3', 'page error: ' + m)); await ctx.close();
  }
  // ── J4 ──
  if (run('J4')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const probe = async (D, text, test, what) => {
      await day(page, D); await page.keyboard.type(text, { delay: 25 }); await page.waitForTimeout(150); tick('J4');
      const ok = await page.evaluate(test); if (!ok) bad('J4', `${what}: typing ${JSON.stringify(text)} left ${await html(page)}`); };
    await probe('2026-04-01', '- one', () => !!jrEd().querySelector('ul > li') && !jrEd().querySelector('ul.lb-check') && jrEd().textContent.trim() === 'one', '"- " is a bullet list');
    await probe('2026-04-02', '* one', () => !!jrEd().querySelector('ul > li') && jrEd().textContent.trim() === 'one', '"* " is a bullet list');
    await probe('2026-04-03', '1. one', () => !!jrEd().querySelector('ol > li') && jrEd().textContent.trim() === 'one', '"1. " is a numbered list');
    await probe('2026-04-04', '[] one', () => !!jrEd().querySelector('ul.lb-check > li') && jrEd().textContent.trim() === 'one', '"[] " is a checklist');
    await probe('2026-04-05', '# one', () => !!jrEd().querySelector('h1') && jrEd().textContent.trim() === 'one', '"# " is a heading 1');
    await probe('2026-04-06', '### one', () => !!jrEd().querySelector('h3') && jrEd().textContent.trim() === 'one', '"### " is a heading 3');
    await probe('2026-04-07', '> one', () => !!jrEd().querySelector('blockquote') && jrEd().textContent.trim() === 'one', '"> " is a quote');
    await probe('2026-04-08', 'a - b', () => !jrEd().querySelector('ul') && jrEd().textContent === 'a - b', 'a dash inside a sentence is a dash');
    await day(page, '2026-04-09'); await type(page, '---'); await page.keyboard.press('Enter'); await type(page, 'after');
    if (!(await page.evaluate(() => !!jrEd().querySelector('hr') && /after/.test(jrEd().textContent) && !/---/.test(jrEd().textContent)))) bad('J4', '"---" and Enter did not draw a rule: ' + await html(page));
    // a list typed that way goes on: Enter makes the next item, Enter on an empty item leaves it
    await day(page, '2026-04-10'); await type(page, '- a'); await page.keyboard.press('Enter'); await type(page, 'b'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await type(page, 'c');
    if (!(await page.evaluate(() => jrEd().querySelectorAll('li').length === 2 && /c$/.test(jrEd().textContent)))) bad('J4', 'a typed list did not go on and then end: ' + await html(page));
    // Backspace at the start of a heading makes it text
    await day(page, '2026-04-11'); await type(page, '# '); await type(page, 'big'); await caretStart(page); await page.keyboard.press('Backspace');
    if (!(await page.evaluate(() => !jrEd().querySelector('h1') && jrEd().textContent.trim() === 'big'))) bad('J4', 'Backspace at the start of a heading did not make it text: ' + await html(page));
    errs.forEach(m => bad('J4', 'page error: ' + m)); await ctx.close();
  }
  // ── J5 ──
  if (run('J5')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    await day(page, '2026-05-01'); await type(page, 'hello world');
    const btn = c => page.locator(`#jr-bar [data-c="${c}"]`);
    await selAll(page); tick('J5');
    await btn('bold').click();
    if (!(await page.evaluate(() => /<b>hello world<\/b>|<strong>/.test(jrEd().innerHTML)))) bad('J5', 'the Bold button did not bold the selection: ' + await html(page));
    if (await page.evaluate(() => document.activeElement !== jrEd())) bad('J5', 'a click on a toolbar button took the caret out of the page');
    if (!(await page.evaluate(() => getSelection().toString() === 'hello world'))) bad('J5', 'a click on a toolbar button lost the selection');
    await page.waitForTimeout(80);
    if (!(await btn('bold').evaluate(b => b.classList.contains('on') && b.getAttribute('aria-pressed') === 'true'))) bad('J5', 'Bold is not lit while the selection is bold');
    await btn('bold').click();
    if (await page.evaluate(() => /<b>|<strong>/.test(jrEd().innerHTML))) bad('J5', 'the Bold button did not toggle bold off');
    // heading through the style menu
    await page.locator('#jr-bar .jr-p-style').click();
    await page.locator('#jr-menu .jr-mst-h2').click();
    if (!(await page.evaluate(() => !!jrEd().querySelector('h2')))) bad('J5', 'Heading 2 in the style menu did not make a heading: ' + await html(page));
    await page.waitForTimeout(80);
    if (!/Heading 2/.test(await page.locator('#jr-bar .jr-p-style').textContent())) bad('J5', 'the style pill does not say Heading 2 while the caret is in one');
    if (await page.locator('#jr-menu').count()) bad('J5', 'the style menu stayed open after a choice');
    // the menu closes on a second click and on Escape
    await page.locator('#jr-bar .jr-p-size').click(); if (!await page.locator('#jr-menu').count()) bad('J5', 'the size menu did not open');
    await page.locator('#jr-bar .jr-p-size').click(); if (await page.locator('#jr-menu').count()) bad('J5', 'a second click on the size pill did not close its menu');
    await page.locator('#jr-bar .jr-p-size').click(); await page.keyboard.press('Escape'); if (await page.locator('#jr-menu').count()) bad('J5', 'Escape did not close the menu');
    // the keyboard walks an open menu and the caret stays in the page
    await day(page, '2026-05-08'); await type(page, 'keys');
    await page.locator('#jr-bar .jr-p-style').click(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    if (!(await page.evaluate(() => !!jrEd().querySelector('h1') && document.activeElement === jrEd()))) bad('J5', 'the style menu could not be walked with ArrowDown and Enter: ' + await html(page));
    // size on a selection
    await selAll(page); await page.locator('#jr-bar .jr-p-size').click(); await page.locator('#jr-menu .jr-mi', { hasText: /^20$/ }).click();
    if (!(await page.evaluate(() => /font-size:\s*20px/.test(jrEd().innerHTML)))) bad('J5', 'the size menu did not set 20px: ' + await html(page));
    // lists, checklist, colour, alignment
    await day(page, '2026-05-02'); await type(page, 'x'); await btn('ul').click();
    if (!(await page.evaluate(() => !!jrEd().querySelector('ul > li')))) bad('J5', 'the bullet button did not make a list');
    await page.waitForTimeout(80); if (!(await btn('ul').evaluate(b => b.classList.contains('on')))) bad('J5', 'the bullet button is not lit inside a bullet list');
    await btn('todo').click();
    if (!(await page.evaluate(() => !!jrEd().querySelector('ul.lb-check')))) bad('J5', 'the checklist button did not make a checklist');
    await page.waitForTimeout(80); if (!(await btn('todo').evaluate(b => b.classList.contains('on'))) || (await btn('ul').evaluate(b => b.classList.contains('on')))) bad('J5', 'in a checklist the checklist button is lit and the bullet one is not');
    await btn('ol').click(); if (!(await page.evaluate(() => !!jrEd().querySelector('ol > li')))) bad('J5', 'the numbered button did not make a numbered list');
    await day(page, '2026-05-03'); await type(page, 'centre me'); await page.locator('#jr-bar .jr-align').click(); await page.locator('#jr-menu .jr-mi', { hasText: 'Centre' }).click();
    if (!(await page.evaluate(() => /text-align:\s*center/.test(jrEd().innerHTML) || /align="center"/.test(jrEd().innerHTML)))) bad('J5', 'the centre button did not centre the line: ' + await html(page));
    await selAll(page); await page.locator('#jr-bar .jr-cb[data-menu="foreColor"]').click(); await page.locator('#jr-menu .jr-c').nth(1).click();
    if (!(await page.evaluate(() => /color:/.test(jrEd().innerHTML)))) bad('J5', 'the colour menu did not colour the selection: ' + await html(page));
    // undo / redo buttons are real
    await day(page, '2026-05-04'); await type(page, 'abc'); await btn('undo').click();
    if ((await page.evaluate(() => jrEd().textContent)) === 'abc') bad('J5', 'the Undo button did nothing');
    // every control has a name
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('#jr-bar button')].filter(b => !(b.getAttribute('aria-label') || b.title || '').trim()).length);
    if (unnamed) bad('J5', `${unnamed} toolbar controls have no name`);
    // the heading keys
    await day(page, '2026-05-05'); await type(page, 'title'); await page.keyboard.press('Control+Alt+Digit1');
    if (!(await page.evaluate(() => !!jrEd().querySelector('h1')))) bad('J5', '⌘⌥1 did not make a heading 1: ' + await html(page));
    await page.keyboard.press('Control+Alt+Digit0');
    if (await page.evaluate(() => !!jrEd().querySelector('h1'))) bad('J5', '⌘⌥0 did not make it normal text again');
    // the / menu and @ still work on the page (they live on the text, not on the bubble)
    await day(page, '2026-05-06'); await type(page, '/divi'); await page.waitForTimeout(200);
    if (!(await page.evaluate(() => !!(window.AC && AC.open)))) bad('J5', 'the / menu did not open on the Journal page');
    else { await page.keyboard.press('Enter'); await page.waitForTimeout(150); if (!(await page.evaluate(() => !!jrEd().querySelector('hr')))) bad('J5', 'choosing a divider in the / menu on the Journal page inserted nothing: ' + await html(page)); }
    await page.evaluate(() => { LB.data.pages.zz_alpha = { id: 'zz_alpha', title: 'Alpha note', html: '', created: Date.now(), updated: Date.now(), sectionId: NOTES_SEC }; });
    await day(page, '2026-05-07'); await type(page, '@Alp'); await page.waitForTimeout(200);
    if (!(await page.evaluate(() => !!(window.AC && AC.open)))) bad('J5', 'the @ menu did not open on the Journal page');
    // the selection bubble is not drawn over the page: the toolbar is the one place
    await selAll(page); await page.waitForTimeout(150);
    if (await page.evaluate(() => { var b = document.getElementById('lb-bubble'); return !!(b && b.classList.contains('on')); })) bad('J5', 'the selection bubble floats over the Journal page beside the toolbar');
    errs.forEach(m => bad('J5', 'page error: ' + m)); await ctx.close();
  }
  // ── J6 ──
  if (run('J6')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    const paste = async (htmlText) => page.evaluate(h => { var e = jrEd(); e.focus(); var dt = new DataTransfer(); dt.setData('text/html', h); dt.setData('text/plain', 'x');
      e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, htmlText);
    await day(page, '2026-06-01'); tick('J6');
    await paste('<html><body><!--StartFragment--><p class="MsoNormal" style="margin:0cm;font-family:Calibri;font-size:11pt"><span style="font-family:Calibri;mso-bidi-font-size:12pt"><b>Bold</b> and <span style="font-style:italic">slanted</span> <o:p></o:p></span></p><ul class="MsoListParagraph"><li style="mso-list:l0 level1 lfo1">one</li><li>two</li></ul><table style="border:solid"><tr><td style="width:100pt">c1</td><td>c2</td></tr></table><script>alert(1)</script><!--EndFragment--></body></html>');
    await page.waitForTimeout(100);
    const h = await html(page);
    if (/Mso|mso-|font-family|font-size|<span[^>]*>\s*<\/span>|<script|o:p|class="Mso|style="margin:0cm/.test(h)) bad('J6', 'pasted Word markup arrived with its baggage: ' + h);
    if (!/<b>Bold<\/b>/.test(h) || !/<i>slanted<\/i>/.test(h)) bad('J6', 'bold and italic did not survive a paste: ' + h);
    if (!/<ul><li>one<\/li><li>two<\/li><\/ul>/.test(h)) bad('J6', 'a pasted list did not stay a list: ' + h);
    if (!/<table[^>]*><tbody>|<table[^>]*><tr>/.test(h) || !/c1/.test(h)) bad('J6', 'a pasted table did not stay a table: ' + h);
    // Google Docs wraps everything in <b style="font-weight:normal">
    await day(page, '2026-06-02');
    await paste('<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr"><span style="font-weight:400">plain words</span></p><p><span style="font-weight:700">heavy</span></p></b>');
    const g = await html(page);
    if (/<b>plain|<b><p/.test(g) || /docs-internal/.test(g)) bad('J6', 'a Google Docs paste came in bold or with its guid: ' + g);
    if (!/<b>heavy<\/b>/.test(g)) bad('J6', 'a Google Docs bold run did not become bold: ' + g);
    // a Labbook checklist is kept whole
    await day(page, '2026-06-03');
    await paste('<ul class="lb-check"><li class="done">tick</li><li>open</li></ul><p><a class="lb-link" data-k="exp" data-id="abc">CODE1</a></p>');
    const l = await html(page);
    if (!/<ul class="lb-check"><li class="done">tick<\/li>/.test(l)) bad('J6', 'a copied Labbook checklist lost its state: ' + l);
    if (!/class="lb-link"[^>]*data-id="abc"|data-id="abc"[^>]*class="lb-link"/.test(l)) bad('J6', 'a copied Labbook link lost its target: ' + l);
    // plain text is plain text, and Shift is "paste without format"
    await day(page, '2026-06-04');
    if (!(await page.evaluate(() => typeof jrCleanHtml === 'function' && jrCleanHtml('<img src="http://x/y.png"><p>hi</p>') === '<div>hi</div>'))) bad('J6', 'a remote image in pasted HTML was kept (it would never load again)');
    errs.forEach(m => bad('J6', 'page error: ' + m)); await ctx.close();
  }
  // ── J7 ──
  if (run('J7')) {
    const ctx = await newCtx(); const { page, errs } = await open(ctx);
    // an empty page says so, whatever it holds
    await day(page, '2026-07-01', '<br>'); tick('J7');
    const cls = await page.evaluate(() => jrEd().classList.contains('jr-empty')); if (!cls) bad('J7', 'a page holding only <br> does not show its prompt');
    await page.evaluate(() => { var e = jrEd(); e.blur(); });
    // typing and clearing leaves nothing stored
    await day(page, '2026-07-02'); await type(page, 'abc'); await page.waitForTimeout(700);
    if ((await page.evaluate(() => (LB.data.notebook['2026-07-02'] || {}).html || '')).indexOf('abc') < 0) bad('J7', 'typed text is not in the notebook');
    await selAll(page); await page.keyboard.press('Backspace'); await page.waitForTimeout(700);
    const stored = await page.evaluate(() => (LB.data.notebook['2026-07-02'] || {}).html);
    if (stored) bad('J7', 'a cleared page stored ' + JSON.stringify(stored) + ' (it should be empty, not a <br>)');
    if (!(await page.evaluate(() => jrEd().classList.contains('jr-empty')))) bad('J7', 'a cleared page does not show its prompt again');
    // a day looked at and not written on makes no record
    await page.evaluate(() => openDayPage('2026-07-03')); await page.evaluate(() => jrEd().focus()); await page.evaluate(() => openDayPage('2026-07-04'));
    if (await page.evaluate(() => !!LB.data.notebook['2026-07-03'])) bad('J7', 'looking at a day made a record of it');
    // a table at the foot has a line after it
    await day(page, '2026-07-05');
    for (const tail of ['<table class="lb-table"><tr><td>a</td></tr></table>', '<div>text</div><hr>', '<div>text</div><img class="lb-att" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">']) {
      await page.evaluate(h => { const e = jrEd(); e.innerHTML = h; jrInput(e); }, tail);
      if (!(await page.evaluate(() => { var l = jrEd().lastElementChild; return l && l.tagName === 'DIV' && !l.textContent.trim(); }))) bad('J7', 'a page ending in ' + tail.replace(/<(\w+)[^>]*>.*/, '$1') + ' has no line after it to put the caret in: ' + await html(page));
    }
    // a click under the last line writes there
    await day(page, '2026-07-06'); await type(page, 'first line');
    await page.evaluate(() => { document.activeElement.blur(); });
    const box = await page.locator('#pane-ed .jr-sheet').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 8); await type(page, '!');
    if (!(await page.evaluate(() => /first line!$/.test(jrEd().textContent)))) bad('J7', 'a click under the last line did not put the caret at the end of the text: ' + JSON.stringify(await page.evaluate(() => jrEd().textContent)));
    // it is there after a reload
    await page.waitForTimeout(900);
    await page.evaluate(() => { _flushLocal(); });
    await page.waitForTimeout(300);
    await page.reload(); await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof renderAll === 'function' && typeof jrBarHtml === 'function'); await page.waitForTimeout(700);
    await page.evaluate(() => openDayPage('2026-07-06'));
    if (!(await page.evaluate(() => /first line!/.test(jrEd().textContent)))) bad('J7', 'what was written is not there after a reload');
    // words are counted
    await day(page, '2026-07-07'); await type(page, 'one two three'); await page.waitForTimeout(100);
    if (!/3 words/.test(await page.locator('#jr-wc').textContent())) bad('J7', 'the word count is not 3: ' + await page.locator('#jr-wc').textContent());
    // a note with no date is the same page
    await page.evaluate(() => { newPage && newPage(); }); await page.waitForTimeout(300);
    const note = await page.evaluate(() => !!document.querySelector('#pane-ed .jr-ed') && !!document.getElementById('jr-bar'));
    if (!note) bad('J7', 'a Note has no toolbar / editor of the same kind');
    else { await page.locator('#pane-ed .jr-ed').click(); await type(page, '- note item'); await page.waitForTimeout(700);
      if (!(await page.evaluate(() => { var pg = _curPage(); return !!pg && /<li>note item<\/li>/.test(pg.html || ''); }))) bad('J7', 'what is written in a Note is not stored in the Note'); }
    errs.forEach(m => bad('J7', 'page error: ' + m)); await ctx.close();
  }
  // ── J8 ──
  if (run('J8')) {
    for (const [w, h] of [[1440, 900], [1100, 800], [375, 812]]) {
      const ctx = await newCtx(w, h); const { page, errs } = await open(ctx);
      await page.evaluate(() => openDayPage(todayStr())); await page.waitForSelector('#jr-bar'); tick('J8');
      const m = await page.evaluate(() => { var b = document.getElementById('jr-bar'), l = b.querySelector('.jr-bar-l'), r = b.getBoundingClientRect(), ed = document.getElementById('pane-ed');
        var btns = [...b.querySelectorAll('.jr-b,.jr-pill')], tops = [...new Set(btns.map(x => Math.round(x.getBoundingClientRect().top)))];
        return { h: Math.round(r.height), rows: tops.length, barW: Math.round(r.width), scrollW: l.scrollWidth, clientW: l.clientWidth, docOver: document.documentElement.scrollWidth - document.documentElement.clientWidth, paneOver: ed.scrollWidth - ed.clientWidth, pos: getComputedStyle(b).position }; });
      if (m.pos !== 'sticky') bad('J8', `at ${w} the bar is ${m.pos}, not sticky: it scrolls away with the page`);
      if (m.rows > 2) bad('J8', `at ${w} the toolbar is ${m.rows} rows tall (two at most; a narrow pane scrolls one row)`);
      if (m.barW > 640 && m.scrollW > m.clientW + 1) bad('J8', `at ${w} the toolbar runs ${m.scrollW - m.clientW}px past its box`);
      if (m.barW <= 640 && m.rows !== 1) bad('J8', `at ${w} the pane is ${m.barW}px and the toolbar wraps to ${m.rows} rows (it should be one row that scrolls inside itself)`);
      if (m.docOver > 1 || m.paneOver > 1) bad('J8', `at ${w} the page scrolls sideways (${m.docOver}/${m.paneOver}px)`);
      // sticky: scrolled down, the bar is still at the top of the pane
      await page.evaluate(() => { var e = jrEd(); e.innerHTML = '<p>' + 'line</p><p>'.repeat(120) + 'end</p>'; document.getElementById('pane-ed').scrollTop = 800; });
      const top = await page.evaluate(() => Math.round(document.getElementById('jr-bar').getBoundingClientRect().top - document.getElementById('pane-ed').getBoundingClientRect().top));
      if (Math.abs(top) > 2) bad('J8', `at ${w} the bar is ${top}px from the top of the pane after scrolling (it should stay)`);
      errs.forEach(x => bad('J8', 'page error: ' + x)); await ctx.close();
    }
  }
} catch (e) { bad('J?', 'the run stopped: ' + String(e.message).split('\n').slice(0, 3).join(' ')); } finally { await browser.close(); if (srv) srv.kill(); }
const ids = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8'];
for (const id of ids) { if (ONLY && !ONLY.includes(id)) continue; const f = findings.filter(x => x.id === id); process.stdout.write(`  ${f.length ? '✗' : '✓'} ${id}${counts[id] ? ' (' + counts[id] + ')' : ''}\n`); }
const seen = new Set(); findings.forEach(f => { const k = f.id + f.m; if (seen.has(k)) return; seen.add(k); process.stdout.write(`     [${f.id}] ${f.m}\n`); });
if (!findings.length) process.stdout.write('\nJournal invariants hold.\n');
process.exit(findings.length ? 1 : 0);
