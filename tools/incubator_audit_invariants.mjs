// Incubator audit invariants — what the 2026-10 audit found, each held by a check that fails with the bug put back (--break N puts bug N back).
//
//   IN1  a day is a calendar day   "Next split", "Last split" and the postpone shortcuts count local calendar days: a due date at midnight two days away read
//                                  "tomorrow" (round(1.4 d)), "yesterday" at 23:00 read "today" eight hours later, and "Tomorrow" in the evening before the
//                                  clocks go forward landed on the day after (+24 h = +25 h of wall clock)
//   IN2  the freezer date is local  a vial frozen between 00:00 and 01:00 summer time was dated yesterday (the UTC date)
//   IN3  numbers are numbers        passage, "split every", limit and the split dialog's passage take a whole number in range; -5, 1.5, 1e999 and text are refused
//                                  with a message and nothing is stored; a split or a myco test cannot be dated in the future
//   IN4  a repaint keeps the form   a sync landing while the split or postpone panel is open does not empty what was typed
//   IN5  freezing writes the cell as it is   the dialogs can stay open for minutes: the history written back is the cell's now, not the copy taken when they opened
//   IN6  dialogs                    the drawer, the culture form, the picker and the ask take focus, hold Tab, close on Escape and give focus back; each is named;
//                                  a closed drawer has nothing to tab to; search has a name; the toast is a status; a cell line named with a quote cannot break the picker
//
//   node tools/incubator_audit_invariants.mjs [--url=http://127.0.0.1:8806] [--break=1..2] [--only=1,4,5,6]      exit 1 on any finding
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = arg('url', null), BREAK = +arg('break', 0), ONLY = arg('only', ''), RUN = n => !ONLY || ONLY.split(',').includes(String(n));
const FILE = URL ? URL + '/apps/incubator/incubator.html' : 'file://' + path.join(ROOT, 'apps/incubator/incubator.html');
const findings = []; let checks = 0;
const check = (id, name, ok, detail) => { checks++; if (!ok) findings.push(`✗ ${id} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
async function fresh(tz) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: tz || 'Europe/London' }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(FILE); await p.waitForFunction(() => typeof renderIncubator === 'function');
  if (BREAK) await p.evaluate(n => {
    if (n === 1) { window.dayNum = ts => Math.floor(ts / 86400000); window.addDays = (ts, k) => ts + k * 86400000; window.daysAgo = ts => ts == null ? null : Math.floor((Date.now() - ts) / 86400000); }
    if (n === 2) window.toDateInput = (orig => ts => ts === window.__today ? new Date(ts).toISOString().slice(0, 10) : orig(ts))(window.toDateInput);
  }, BREAK);
  return { ctx, p, errs };
}
// the page's clock, frozen at a local wall-clock moment
const at = (p, iso) => p.evaluate(iso => { const t = new Date(iso).getTime(); window.__today = t; Date.now = () => t; return t; }, iso);

try {
  /* IN1 calendar days */
  if (RUN(1)) {
    const { ctx, p } = await fresh('Europe/London');
    await at(p, '2026-10-20T14:00:00+01:00');
    const r = await p.evaluate(() => {
      const mid = (y, m, d, h) => new Date(y, m, d, h || 0, 0, 0).getTime(), out = {};
      out.due = dueText({ seeded: mid(2026, 9, 19), intervalDays: 3 }).text;            // Mon 00:00 + 3 d = Thu 00:00, it is Tue 14:00: in 2 days
      out.dueTomorrow = dueText({ seeded: mid(2026, 9, 18, 15), intervalDays: 3 }).text;  // Sun 15:00 + 3 = Wed: tomorrow
      out.dueToday = dueText({ seeded: mid(2026, 9, 17, 9), intervalDays: 3 }).text;       // Sat 09:00 + 3 = Tue: today
      out.over = dueText({ seeded: mid(2026, 9, 16, 20), intervalDays: 3 }).text;          // Fri 20:00 + 3 = Mon: 1d overdue
      out.rel = relDays(mid(2026, 9, 19, 23));                                              // yesterday at 23:00, it is 14:00 now
      return out;
    });
    check('IN1', 'a due date two calendar days away is "in 2d", the day after is "tomorrow", the same day is "today", the day before is "1d overdue"', r.due === 'in 2d' && r.dueTomorrow === 'tomorrow' && r.dueToday === 'today' && r.over === '1d overdue', JSON.stringify(r));
    check('IN1', '"yesterday" at 23:00 is still "yesterday" the next afternoon', r.rel === 'yesterday', r.rel);
    // the evening before the clocks go forward: Tomorrow is the next day, not the one after
    await at(p, '2026-03-28T23:30:00+00:00');
    const sp = await p.evaluate(() => { STORE.addCell({ line: 'X', seeded: Date.now() - 1000, intervalDays: 3, history: [] }); const id = Object.keys(STORE.get().incubator)[0]; openDrawer(id); openPostpone(id); setPostponeDay(id, 1); const a = document.getElementById('po-date-' + id).value; setPostponeDay(id, 2); return [a, document.getElementById('po-date-' + id).value]; });
    check('IN1', '"Tomorrow" and "In 2 days" on the night before the clocks go forward are 29 and 30 March', sp.join() === '2026-03-29,2026-03-30', sp.join());
    await ctx.close();
  }
  /* IN2 freezer date */
  if (RUN(2)) {
    const { ctx, p } = await fresh('Europe/London');
    await at(p, '2026-07-10T00:30:00+01:00');   // 23:30 UTC the day before
    const r = await p.evaluate(() => { STORE.addCell({ line: 'X', passage: 4, history: [] }); const id = Object.keys(STORE.get().incubator)[0], got = []; _freezeVialsGo(id, STORE.get().incubator[id], { HUB_FREEZER_PLACE: (a, rec) => got.push(rec.freezeDate) }, { boxId: 'b', box: 'Box 1' }, ['A1']); return got; });
    check('IN2', 'vials frozen at 00:30 summer time are dated that day, not the day before', r[0] === '2026-07-10', JSON.stringify(r));
    await ctx.close();
  }
  /* IN3 numbers */
  if (RUN(3)) {
    const { ctx, p } = await fresh('Europe/London');
    await at(p, '2026-10-20T14:00:00+01:00');
    const tryForm = async (v) => {
      if (v.typed) { await p.evaluate(() => { openCellForm('new'); }); await p.waitForTimeout(60); await p.focus('#cf-passage'); await p.keyboard.type(v.typed); }
      return p.evaluate(v => {
      const n0 = Object.keys(STORE.get().incubator).length; if (!v.typed) openCellForm('new'); const set = (id, x) => { document.getElementById(id).value = x; };
      set('cf-baseline', 'HCT116'); if (!v.typed) set('cf-passage', v.passage || '5'); set('cf-interval', v.interval || '3'); set('cf-limit', v.limit || '30'); if (v.seeded) set('cf-seeded', v.seeded); if (v.myco) set('cf-myco', v.myco);
      saveCellForm(); const n1 = Object.keys(STORE.get().incubator).length, t = document.getElementById('toast').textContent; if (n1 === n0) closeCellForm(); return { added: n1 - n0, toast: t };
      }, v); };
    for (const [k, v] of [['passage -5', { passage: '-5' }], ['passage 1.5', { passage: '1.5' }], ['passage 1e999 typed', { typed: '1e999' }], ['passage text typed', { typed: 'abc' }], ['interval 0', { interval: '0' }], ['interval 366', { interval: '366' }], ['limit -1', { limit: '-1' }], ['future split', { seeded: '2099-01-01' }], ['future myco', { myco: '2099-01-01' }]]) {
      const r = await tryForm(v); check('IN3', `the culture form refuses ${k} with a message and stores nothing`, r.added === 0 && r.toast.length > 8, JSON.stringify(r));
    }
    const ok = await tryForm({ passage: '7', interval: '', limit: '' }); check('IN3', 'a whole passage with the other two left empty is stored', ok.added === 1, JSON.stringify(ok));
    const sp = await p.evaluate(() => { const id = Object.keys(STORE.get().incubator)[0]; openDrawer(id); openSplit(id); const res = []; for (const v of ['-1', '2.5', '1e999', 'x']) { document.getElementById('sp-passage-' + id).value = v; const before = STORE.get().incubator[id].passage; confirmSplit(id); res.push(STORE.get().incubator[id].passage === before); } document.getElementById('sp-passage-' + id).value = '8'; document.getElementById('sp-date-' + id).value = '2099-01-01'; const b2 = STORE.get().incubator[id].passage; confirmSplit(id); res.push(STORE.get().incubator[id].passage === b2); return res; });
    check('IN3', 'the split dialog refuses a passage of -1, 2.5, 1e999, text and a date in the future', sp.every(Boolean), JSON.stringify(sp));
    await ctx.close();
  }
  /* IN4 repaint keeps the form */
  if (RUN(4)) {
    const { ctx, p } = await fresh('Europe/London');
    await at(p, '2026-10-20T14:00:00+01:00');
    const r = await p.evaluate(async () => {
      STORE.addCell({ line: 'X', passage: 4, seeded: Date.now() - 86400000, intervalDays: 3, history: [] }); const id = Object.keys(STORE.get().incubator)[0];
      openDrawer(id); openSplit(id); const ra = document.getElementById('sp-ratio-' + id), pa = document.getElementById('sp-passage-' + id); ra.value = '1:7'; pa.value = '12'; ra.focus();
      STORE.updateCell(id, { notes: 'a sync landed' }); await new Promise(r => setTimeout(r, 50));
      const out = { ratio: document.getElementById('sp-ratio-' + id).value, passage: document.getElementById('sp-passage-' + id).value, focus: document.activeElement.id === 'sp-ratio-' + id };
      closeDrawer(); openDrawer(id); openSplit(id); out.reopened = document.getElementById('sp-ratio-' + id).value; return out;
    });
    check('IN4', 'a store update while the split panel is open keeps what was typed and the focus; reopening starts from the defaults', r.ratio === '1:7' && r.passage === '12' && r.focus && r.reopened !== '1:7', JSON.stringify(r));
    await ctx.close();
  }
  /* IN5 freeze writes the cell as it is */
  if (RUN(5)) {
    const { ctx, p } = await fresh('Europe/London');
    const r = await p.evaluate(() => {
      STORE.addCell({ line: 'X', passage: 4, history: [{ action: 'seeded', ts: 1 }] }); const id = Object.keys(STORE.get().incubator)[0], stale = JSON.parse(JSON.stringify(STORE.get().incubator[id]));
      STORE.updateCell(id, { passage: 5, history: stale.history.concat([{ action: 'media change', ts: 2 }]), needsMedia: 3 });   // logged while the dialogs were open
      _freezeVialsGo(id, stale, { HUB_FREEZER_PLACE() {} }, { boxId: 'b', box: 'Box 1' }, ['A1']);
      const c = STORE.get().incubator[id]; return { passage: c.passage, needsMedia: c.needsMedia, hist: c.history.map(h => h.action).join('|') };
    });
    check('IN5', 'freezing keeps what was logged while its dialogs were open (history, passage, flags)', r.passage === 5 && r.needsMedia === 3 && /seeded\|media change\|froze 1 vial/.test(r.hist), JSON.stringify(r));
    await ctx.close();
  }
  /* IN6 dialogs */
  if (RUN(6)) {
    const { ctx, p } = await fresh('Europe/London');
    const probe = await p.evaluate(() => { STORE.addCell({ line: 'HCT116', passage: 3, seeded: Date.now() - 86400000, intervalDays: 3, history: [] }); CELL_REF["x\\');window.__x=1;//"] = { ratio: '1:2', intervalDays: 3, passageLimit: 20, type: 'Adherent' }; return { q: document.getElementById('inc-q').getAttribute('aria-label'), toast: document.getElementById('toast').getAttribute('role') }; });
    check('IN6', 'the search box has a name and the toast is a status', !!probe.q && probe.toast === 'status', JSON.stringify(probe));
    await p.waitForTimeout(100);
    const closedTab = await p.evaluate(() => { const d = document.getElementById('cell-drawer'); return getComputedStyle(d).visibility; });
    await p.focus('.crow'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const d1 = await p.evaluate(() => { const d = document.getElementById('cell-drawer'); return { role: d.getAttribute('role'), name: d.getAttribute('aria-label'), vis: getComputedStyle(d).visibility, inside: d.contains(document.activeElement) }; });
    let left = false; for (let i = 0; i < 25 && !left; i++) { await p.keyboard.press(i % 3 ? 'Tab' : 'Shift+Tab'); left = await p.evaluate(() => !document.getElementById('cell-drawer').contains(document.activeElement)); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const back = await p.evaluate(() => document.activeElement.className + ' ' + (document.activeElement.getAttribute('data-id') ? 'row' : ''));
    check('IN6', 'the drawer is a named dialog, takes focus, keeps Tab inside, hands focus back to its row on Escape; closed it is not focusable', closedTab === 'hidden' && d1.role === 'dialog' && /HCT116/.test(d1.name || '') && d1.vis === 'visible' && d1.inside && !left && /crow/.test(back), JSON.stringify({ closedTab, d1, left, back }));
    await p.focus('#add-cell-btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const f1 = await p.evaluate(() => ({ first: document.activeElement.id, name: document.querySelector('#cf-back [role=dialog]').getAttribute('aria-label') }));
    await p.evaluate(() => openCellPicker()); await p.waitForTimeout(100);
    const pk = await p.evaluate(() => { const row = [...document.querySelectorAll('.cf-pick-row')].find(b => /window\.__x/.test(b.dataset.name)); row.click(); return { x: window.__x === undefined, base: document.getElementById('cf-baseline').value.slice(0, 3) }; });
    let leftF = false; for (let i = 0; i < 30 && !leftF; i++) { await p.keyboard.press('Tab'); leftF = await p.evaluate(() => !document.getElementById('cf-back').contains(document.activeElement)); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const b2 = await p.evaluate(() => document.activeElement.id);
    check('IN6', 'the culture form is named, starts in its first field, keeps Tab inside, returns focus to + Culture; a cell line named with a quote and a backslash is picked and runs nothing', f1.first === 'cf-baseline' && /culture/i.test(f1.name) && pk.x && pk.base === "x\\'" && !leftF && b2 === 'add-cell-btn', JSON.stringify({ f1, pk, leftF, b2 }));
    await p.evaluate(() => incAsk('Delete it?', 'This deletes the culture.', { ok: 'Delete', danger: true }, () => {})); await p.waitForTimeout(150);
    const ask = await p.evaluate(() => { const b = document.querySelector('#inc-ask [role=dialog]'), t = document.getElementById(b.getAttribute('aria-labelledby') || '_'); return { name: t && t.textContent, focus: document.activeElement.id }; });
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check('IN6', 'the ask is named by its title and focuses its answer', ask.name === 'Delete it?' && ask.focus === 'inc-ask-ok', JSON.stringify(ask));
    await ctx.close();
  }
} catch (e) { findings.push('✗ the run stopped: ' + (e && e.stack || e)); }
await browser.close();
if (findings.length) { findings.forEach(f => console.log(f)); console.log(`\n${findings.length} finding(s), ${checks - findings.length} checks passed.`); process.exit(1); }
console.log(`Incubator audit invariants: ${checks} checks passed.`);
