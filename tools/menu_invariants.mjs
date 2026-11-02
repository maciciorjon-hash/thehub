// The chrome Lumina, Beacon and Tempo share — the Settings panel, the theme, the Export menu, where Setup sits, how a typed well range is read — measured in a browser,
// so three copies of a thing cannot drift into three behaviours again (found 2026-11-01: Lumina saved the theme under a key it did not read back, Beacon's switch
// ignored the Hub and its Export menu had no keyboard, Tempo's menu could not be closed by its own button and ignored Esc).
//   node tools/menu_invariants.mjs
//
// M1  Settings: one button (aria-label Settings, aria-haspopup, aria-expanded follows the panel); a click inside the panel leaves it open, Esc and a click outside close it,
//     and Esc hands the focus back to the button
// M2  the theme: the switch, an attribute set from outside (the Hub does this) and the Hub's 'setTheme:' message all end the same — data-theme, the switch, hub_theme — and the app
//     draws its charts again once per change; a stored choice comes back on reload with the switch in step
// M3  the Export menu: aria-expanded follows it; ↓ on the button opens it and goes in; ↑ ↓ Home End walk the items; Esc closes and the focus is back on the button; a click outside
//     and the button itself close it (it did not in Tempo: pointerdown closed it and the click opened it again); a tab change closes it; Lumina's Units and Export are never both open
// M4  the same words for the same things: every Export menu offers an Excel workbook, "Plot as image (.png)" and every item says what it makes
// M5  Setup sits right after the tabs in all three apps
// M6  a typed range is read as it is said, and the same in all three: "A1 to B3", "a1 : b3", "A1 .. B3", "$A$1:$B$3" are A1:B3; a corner off the plate is not a smaller range;
//     what could not be read is listed (PlateEngine.unread) so a list is never quietly shorter than it was written
// M8  the tab row is one component: the open tab is the one stop (roving tabindex), ← → Home End move along it, wrap at both ends and open the tab they land on, and every tab
//     names its pane (aria-controls → role=tabpanel) — Lumina moved the focus without opening, Beacon could not wrap to the left, Tempo had seven stops and no panes named
// M9  the Setup dialog takes the focus when it opens (onto its open step when no box is to be typed in) and gives it back to the Setup button when it closes
// M7  Tempo's results table: a compound's name is never broken over two lines, a row is one line, and a unit's exponent is a superscript
// M10 the tab row stays at the top while the page scrolls, in all three (Tempo's and Lumina's scrolled away, Beacon's stayed): under the header when the app shows it, at 0 inside
//     the Hub (which hides the header); what else sticks (Lumina's well panel, Tempo's compound list) sits under it, not behind it
// M11 [ and ] open the previous and the next tab in the order of the bar, in all three, and wrap (Tempo alone had them, in another order and only four tabs); not in a field
// M12 one look across the three (2026-11-02 pass): a segmented choice is 32 px with its border; a card title is 15 px / 600; a figure in a table is in the sans face, never
//     Mono; the keys a view answers are one .rs-keys row with the same keycaps and name [ ]; Tempo's buttons are 32 px like the others (inside its 28 px Axes row, 28)
// M13 hidden is hidden: no element with the hidden attribute is drawn on any tab (Lumina's Graph showed an empty "What the figure shows" row: .rs-head{display:flex} won)
// M14 what is on screen is read as words and round numbers: Beacon's controls chart ticks are round steps (it drew 1.3k · 2.5k · 3.8k); Lumina's curve axis is written in
//     concentrations (1 nM, 10 nM) like Beacon's and Tempo's, not log₁₀ M; Tempo's flags on screen are words (R² 0.53, DC50 above the doses, hook at 2 doses), the files keep the codes
// M15 every workbook the three apps write is clean and alike: no NaN / undefined / Infinity / [object in a cell, and no number with the float's tail (Lumina and Beacon wrote
//     103.87337551440858 and 3333.3333333333335; SheetKit now writes six significant figures, as Tempo did)
// M16 every file the three apps write is named one way: <name>_<App>_<What>_<YYYY-MM-DD>.<ext> (MenuKit.fileName) — they were Lumina_Results_<date>.xlsx,
//     beacon-<file>.xlsx and <plate>_tempo.xlsx, with -results / _Results / _tempo_tidy for the same kinds of file
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { const m = '✗ ' + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''); findings.push(m); console.log('  ' + m); } };

const APPS = {
  lumina: { seed: 'loadLuminaTestData()', results: `switchTab('results')`, graph: `switchTab('graph')`, btn: '#rs-exp-btn', menu: '#rs-exp', spy: 'rsRefreshCharts', bar: '#lm-tabbar' },
  beacon: { seed: `loadTestData('gain')`, results: `switchTab('results')`, graph: `switchTab('graph')`, btn: '#rs-exp-btn', menu: '#rs-exp', spy: 'bDrawResults', bar: '#tabs' },
  tempo: { seed: `await tpLoadExample('degradation')`, results: `tpTab('results')`, graph: `tpTab('compare')`, btn: '#tp-exp-btn', menu: '#tp-exp-menu', spy: 'tpRender', bar: '#tp-tabs' },
};
const browser = await chromium.launch();
async function boot(id, keepTheme) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.route(/^https?:/, r => r.abort());
  await pg.addInitScript(keep => { try { localStorage.setItem('assist_seen', '1'); if (!keep) localStorage.setItem('hub_theme', 'light'); } catch (e) {} }, keepTheme);
  await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForTimeout(700);
  await pg.evaluate(`(async()=>{ document.getElementById('dep-stack')?.remove(); ${APPS[id].seed} })()`); await pg.waitForTimeout(1200);
  return { ctx, pg, errs };
}
const run = (pg, js) => pg.evaluate(`(async()=>{ ${js} })()`);
const isOpen = (pg, sel) => pg.evaluate(s => { const e = document.querySelector(s); return !!e && e.classList.contains('open') && getComputedStyle(e).display !== 'none'; }, sel);
const focusIs = (pg, sel) => pg.evaluate(s => document.activeElement === document.querySelector(s), sel);

for (const [id, A] of Object.entries(APPS)) {
  const { ctx, pg } = await boot(id);
  await run(pg, A.results); await pg.waitForTimeout(500);

  // M1 ── Settings
  const gear = await pg.evaluate(() => { const b = document.getElementById('opts-btn'); return [b.getAttribute('aria-label'), b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded'), b.title].join('|'); });
  check(`M1 ${id}: the Settings button is labelled, aria-haspopup, closed`, gear === 'Settings|true|false|Settings', gear);
  await pg.click('#opts-btn'); await pg.waitForTimeout(150);
  check(`M1 ${id}: it opens the panel and says so (aria-expanded)`, (await isOpen(pg, '#opts-panel')) && (await pg.getAttribute('#opts-btn', 'aria-expanded')) === 'true');
  await pg.click('#opts-panel .opts-label'); await pg.waitForTimeout(100);
  check(`M1 ${id}: a click inside the panel leaves it open`, await isOpen(pg, '#opts-panel'));
  await pg.keyboard.press('Tab'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  check(`M1 ${id}: Esc closes it`, !(await isOpen(pg, '#opts-panel')) && (await pg.getAttribute('#opts-btn', 'aria-expanded')) === 'false');
  await pg.click('#opts-btn'); await pg.mouse.click(300, 760); await pg.waitForTimeout(150);
  check(`M1 ${id}: a click outside closes it`, !(await isOpen(pg, '#opts-panel')));
  const geo = await pg.evaluate(() => { document.getElementById('opts-panel').classList.add('open'); const s = getComputedStyle(document.getElementById('opts-panel')), b = getComputedStyle(document.getElementById('opts-btn')); const o = { r2: getComputedStyle(document.documentElement).getPropertyValue('--r-2').trim(), r: s.borderBottomLeftRadius, z: s.zIndex, w: b.width, h: b.height, sh: s.boxShadow !== 'none' }; document.getElementById('opts-panel').classList.remove('open'); return o; });
  check(`M1 ${id}: the panel and button are one size, one radius (--r-2), above the page (z 200)`, geo.w === '30px' && geo.h === '30px' && geo.z === '200' && geo.r === geo.r2 && geo.sh, geo);

  // M2 ── theme
  const redraws = await pg.evaluate(spy => { window.__n = 0; const f = window[spy]; window[spy] = function () { window.__n++; return f.apply(this, arguments); }; return typeof f; }, A.spy);
  check(`M2 ${id}: the app's redraw function is there to be called (${A.spy})`, redraws === 'function', redraws);
  const th = async () => pg.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), chk: document.getElementById('theme-chk').checked, ls: localStorage.getItem('hub_theme'), n: window.__n }));
  await pg.evaluate(() => { window.__n = 0; }); await pg.click('#opts-btn'); await pg.click('.theme-slider'); await pg.waitForTimeout(400);
  let s = await th(); check(`M2 ${id}: the switch → dark, stored as hub_theme, and the page drawn again once`, s.t === 'dark' && s.chk && s.ls === 'dark' && s.n === 1, s);
  await pg.keyboard.press('Escape');
  await pg.evaluate(() => { window.__n = 0; document.documentElement.setAttribute('data-theme', 'light'); }); await pg.waitForTimeout(400);
  s = await th(); check(`M2 ${id}: the attribute set from outside (the Hub) → the switch follows and the page is drawn again once`, s.t === 'light' && !s.chk && s.n === 1, s);
  await pg.evaluate(() => { window.__n = 0; window.postMessage('setTheme:dark', '*'); }); await pg.waitForTimeout(400);
  s = await th(); check(`M2 ${id}: the Hub's setTheme message → dark, the switch follows, drawn once`, s.t === 'dark' && s.chk && s.n === 1, s);
  await pg.evaluate(() => { window.__n = 0; window.postMessage('setTheme:dark', '*'); }); await pg.waitForTimeout(300);
  check(`M2 ${id}: the same theme again draws nothing`, (await th()).n === 0);
  await ctx.close();
  {   // a stored choice comes back, with the switch in step (Lumina kept it under lumina_theme and read hub_theme first)
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p2 = await c2.newPage();
    await p2.route(/^https?:/, r => r.abort());
    await p2.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hub_theme', 'dark'); localStorage.setItem('lumina_theme', 'light'); } } catch (e) {} });
    await p2.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await p2.waitForTimeout(800);
    const st = await p2.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), chk: document.getElementById('theme-chk').checked }));
    check(`M2 ${id}: hub_theme = dark is read on load and the switch shows it`, st.t === 'dark' && st.chk === true, st);
    await p2.click('#opts-btn'); await p2.click('.theme-slider'); await p2.waitForTimeout(300);
    await p2.evaluate(() => document.getElementById('opts-panel').classList.remove('open'));
    const got = await p2.evaluate(() => localStorage.getItem('hub_theme'));
    await p2.reload(); await p2.waitForTimeout(600);
    const back = await p2.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), chk: document.getElementById('theme-chk').checked }));
    check(`M2 ${id}: a choice made here is the one read back after a reload`, got === 'light' && back.t === 'light' && back.chk === false, { got, back });
    await c2.close();
  }
}

for (const [id, A] of Object.entries(APPS)) {
  const { ctx, pg, errs } = await boot(id);
  await run(pg, A.results); await pg.waitForTimeout(500);
  const menu = A.menu, btn = A.btn;
  // M3 ── Export menu
  await pg.click(btn); await pg.waitForTimeout(200);
  check(`M3 ${id}: Export opens, aria-expanded true, role=menu with role=menuitem rows`, (await isOpen(pg, menu)) && (await pg.getAttribute(btn, 'aria-expanded')) === 'true' && await pg.evaluate(m => document.querySelector(m).getAttribute('role') === 'menu' && document.querySelectorAll(m + ' [role=menuitem]').length >= 4, menu));
  await pg.click(btn); await pg.waitForTimeout(250);
  check(`M3 ${id}: the button closes its own menu (and it stays closed)`, !(await isOpen(pg, menu)) && (await pg.getAttribute(btn, 'aria-expanded')) === 'false');
  await pg.focus(btn); await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(150);
  const first = await pg.evaluate(m => { const f = document.querySelector(m + ' [role=menuitem]'); return document.activeElement === f; }, menu);
  check(`M3 ${id}: ↓ on the button opens the menu and goes in at the first item`, (await isOpen(pg, menu)) && first);
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('Home'); const home = await pg.evaluate(m => document.activeElement === document.querySelector(m + ' [role=menuitem]'), menu);
  await pg.keyboard.press('End'); const end = await pg.evaluate(m => { const l = document.querySelectorAll(m + ' [role=menuitem]'); return document.activeElement === l[l.length - 1]; }, menu);
  await pg.keyboard.press('ArrowDown'); const wrap = await pg.evaluate(m => document.activeElement === document.querySelector(m + ' [role=menuitem]'), menu);
  check(`M3 ${id}: Home, End and the wrap-around walk the items`, home && end && wrap, { home, end, wrap });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  check(`M3 ${id}: Esc closes it and the focus is back on the button`, !(await isOpen(pg, menu)) && await focusIs(pg, btn));
  await pg.click(btn); await pg.mouse.click(300, 800); await pg.waitForTimeout(200);
  check(`M3 ${id}: a click outside closes it`, !(await isOpen(pg, menu)));
  await pg.click(btn); await run(pg, A.graph); await pg.waitForTimeout(400);
  check(`M3 ${id}: changing tab closes it`, !(await isOpen(pg, menu)));
  await run(pg, A.results); await pg.waitForTimeout(300);
  // M4 ── the words
  await pg.click(btn); await pg.waitForTimeout(200);
  const items = await pg.evaluate(m => [...document.querySelectorAll(m + ' [role=menuitem]')].map(b => ({ t: (b.querySelector('b') || {}).textContent, s: (b.querySelector('span') || {}).textContent })), menu);
  check(`M4 ${id}: an Excel workbook and "Plot as image (.png)" are in the menu`, items.some(i => i.t === 'Excel workbook') && items.some(i => i.t === 'Plot as image (.png)'), items.map(i => i.t));
  check(`M4 ${id}: every item has a title and says what it makes`, items.every(i => i.t && i.s), items.filter(i => !i.t || !i.s).map(i => i.t));
  if (id === 'lumina') {   // Units and Export: one at a time
    await pg.click('#rs-units-btn'); await pg.waitForTimeout(200);
    check(`M3 lumina: Units and Export are never both open`, (await isOpen(pg, '#rs-units')) && !(await isOpen(pg, '#rs-exp')));
  }
  await pg.keyboard.press('Escape');
  // M5 ── Setup after the tabs
  const pos = await pg.evaluate(() => { const g = [...document.querySelectorAll('.tab')].filter(t => t.getBoundingClientRect().width > 1).pop(), s = document.querySelector('.tab-setup'); return { gap: Math.round(s.getBoundingClientRect().left - g.getBoundingClientRect().right), last: g.textContent.trim() }; });
  check(`M5 ${id}: Setup follows the last tab (${pos.last}) within 16 px`, pos.gap >= 0 && pos.gap <= 16, pos);
  // M8 ── tabs
  const ev = f => pg.evaluate(f, A.bar);
  await run(pg, A.results === `switchTab('results')` ? `switchTab(document.querySelector('${A.bar} [role=tab]').dataset.tab)` : `tpTab('plate')`); await pg.waitForTimeout(300);
  const tabsOf = () => ev(bar => [...document.querySelectorAll(bar + ' [role=tab]')].filter(t => t.getClientRects().length > 0 && !t.hidden).map(t => t.dataset.tab));
  const cur = () => ev(bar => { const a = document.querySelector(bar + ' [role=tab].active'); return a ? a.dataset.tab : null; });
  const names = await tabsOf(), stops = await ev(bar => [...document.querySelectorAll(bar + ' [role=tab]')].filter(t => t.tabIndex === 0).map(t => t.dataset.tab));
  check(`M8 ${id}: one tab is the one stop, and it is the open one`, stops.length === 1 && stops[0] === (await cur()), { stops, open: await cur() });
  const named = await ev(bar => [...document.querySelectorAll(bar + ' [role=tab]')].every(t => { const p = document.getElementById(t.getAttribute('aria-controls')); return p && p.getAttribute('role') === 'tabpanel'; }));
  check(`M8 ${id}: every tab names its pane, and the pane is a tabpanel`, named);
  await pg.focus(A.bar + ' [role=tab].active'); const seq = [await cur()];
  for (const k of ['ArrowRight', 'ArrowRight', 'End', 'Home', 'ArrowLeft']) { await pg.keyboard.press(k); await pg.waitForTimeout(250); seq.push(await cur()); }
  const want = [names[0], names[1], names[2], names[names.length - 1], names[0], names[names.length - 1]];
  check(`M8 ${id}: → → End Home ← walk the tabs, wrap, and open each one`, JSON.stringify(seq) === JSON.stringify(want), { seq, want });
  check(`M8 ${id}: the focus is on the open tab`, await ev(bar => document.activeElement === document.querySelector(bar + ' [role=tab].active')));
  check(`M? ${id}: no script error`, errs.length === 0, errs.join(' | '));
  await ctx.close();
}

{   // M6 ── a typed range
  const CASES = [['A1 to B3', 6], ['a1 : b3', 6], ['A1 .. B3', 6], ['$A$1:$B$3', 6], ['A1:B3, D5', 7], ['A1-B3', 6], ['B3:A1', 6], ['A1:P24', null], ['A13', null], ['A1 to Z9', null], ['', null]];
  for (const id of ['lumina', 'beacon', 'tempo']) {
    const { ctx, pg } = await boot(id);
    const got = await pg.evaluate(({ id, CASES }) => CASES.map(([t]) => { const r = id === 'tempo' ? tpParseRange(t, { rows: 8, cols: 12 }) : PlateEngine.parseRange(t, { r: 8, c: 12 }); return r && r.length ? r.length : null; }), { id, CASES });
    check(`M6 ${id}: typed ranges are read as they are said`, JSON.stringify(got) === JSON.stringify(CASES.map(c => c[1])), got);
    if (id !== 'tempo') {
      const un = await pg.evaluate(() => [PlateEngine.unread('A1:B2 foo, Z9 C3', { r: 8, c: 12 }), PlateEngine.unread('A1:B2', { r: 8, c: 12 })]);
      check(`M6 ${id}: what could not be read is listed, so a list is not quietly shorter`, JSON.stringify(un) === JSON.stringify([['FOO', 'Z9'], []]), un);
    }
    await ctx.close();
  }
}
{   // M9 ── Setup takes the focus
  for (const [id, open] of [['lumina', '#ls-open'], ['beacon', '#bs-open'], ['tempo', '#tps-open']]) {
    const { ctx, pg } = await boot(id);
    await pg.click(open); await pg.waitForTimeout(500);
    const inside = await pg.evaluate(() => { const d = [...document.querySelectorAll('.setup-card')].find(c => c.getBoundingClientRect().width > 1); return !!d && d.contains(document.activeElement); });
    check(`M9 ${id}: Setup opens with the focus inside it`, inside);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    check(`M9 ${id}: Esc closes it and the focus is back on the Setup button`, await pg.evaluate(o => !([...document.querySelectorAll('.setup-card')].some(c => c.getBoundingClientRect().width > 1)) && document.activeElement === document.querySelector(o), open));
    await ctx.close();
  }
}
{   // M7 ── Tempo's results table
  const { ctx, pg } = await boot('tempo'); await run(pg, `tpTab('results')`); await pg.waitForTimeout(600);
  const t = await pg.evaluate(() => { const tb = document.getElementById('tp-restbl'), rows = [...tb.tBodies[0].rows], lh = parseFloat(getComputedStyle(rows[0].cells[0]).lineHeight) || 18;
    return { maxRow: Math.max(...rows.map(r => r.offsetHeight)), nameWraps: rows.filter(r => r.cells[0].getClientRects().length > 1 || r.cells[0].offsetHeight > lh * 2.2).length, heads: [...tb.tHead.rows[0].cells].map(c => c.textContent), ascii: [...tb.tHead.rows[0].cells].filter(c => /[a-zA-Z]-1\b/.test(c.textContent)).map(c => c.textContent) }; });
  check('M7 tempo: every row of the results table is one line (no name or plate broken in two)', t.maxRow <= 48, t);
  check('M7 tempo: a unit is written with its exponent (h⁻¹, nM⁻¹·h⁻¹), never "h-1"', t.ascii.length === 0 && t.heads.some(h => /h⁻¹/.test(h)), t.ascii);
  await ctx.close();
}

const TABS = { lumina: `switchTab('guide')`, beacon: `switchTab('guide')`, tempo: `tpTab('guide')` };
for (const id of ['lumina', 'beacon', 'tempo']) {   // M10 · M11 · M13
  const { ctx, pg } = await boot(id); const A = APPS[id];
  await run(pg, TABS[id]); await pg.waitForTimeout(400);
  await pg.mouse.move(720, 600); await pg.mouse.wheel(0, 1500); await pg.waitForTimeout(400);
  const pin = await pg.evaluate(bar => { const h = document.querySelector('body > header'), b = document.querySelector(bar).closest('.tabbar,#tabs') || document.querySelector(bar), s = document.scrollingElement.scrollTop + ((document.querySelector('.content') || {}).scrollTop || 0);
    return { scrolled: s, head: Math.round(h.getBoundingClientRect().bottom), bar: Math.round(b.getBoundingClientRect().top), barH: b.offsetHeight }; }, A.bar);
  check(`M10 ${id}: the page scrolled and the tab row stayed under the header`, pin.scrolled > 300 && Math.abs(pin.bar - pin.head) <= 1, pin);
  // inside the Hub the header is hidden: the row sits at the top of the window
  await pg.addStyleTag({ content: 'header{display:none!important}' }); await pg.waitForTimeout(300); await pg.mouse.wheel(0, 400); await pg.waitForTimeout(300);
  const hub = await pg.evaluate(bar => { const b = document.querySelector(bar).closest('.tabbar,#tabs') || document.querySelector(bar); return Math.round(b.getBoundingClientRect().top); }, A.bar);
  check(`M10 ${id}: with the header hidden (the Hub) the tab row sits at the top of the window`, hub === 0, hub);
  if (id !== 'beacon') {
    const st = await pg.evaluate(async (go) => { await (async () => { eval(go); })(); await new Promise(r => setTimeout(r, 500)); window.scrollTo(0, 2000); await new Promise(r => setTimeout(r, 300));
      const el = document.querySelector(go.includes('tpTab') ? '.cv-list' : '.lm-sel'), b = document.querySelector('.tabbar'); return el ? { top: Math.round(el.getBoundingClientRect().top), barBottom: Math.round(b.getBoundingClientRect().bottom), pos: getComputedStyle(el).position } : null; },
      id === 'tempo' ? `tpTab('curves')` : `switchTab('input')`);
    check(`M10 ${id}: what sticks inside the page sits under the tab row, not behind it`, st && (st.pos !== 'sticky' || st.top >= st.barBottom), st);
  }
  // M11 — [ ] walk the visible tabs in the order of the bar
  const order = await pg.evaluate(bar => [...document.querySelector(bar).querySelectorAll('[role=tab]')].filter(t => !t.hidden && t.getClientRects().length).map(t => t.dataset.tab), A.bar);
  await run(pg, id === 'tempo' ? `tpTab('${order[0]}')` : `switchTab('${order[0]}')`); await pg.waitForTimeout(300);
  await pg.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); document.body.focus(); });
  const seen = [];
  for (let i = 0; i < order.length; i++) { await pg.keyboard.press(']'); await pg.waitForTimeout(250); seen.push(await pg.evaluate(bar => (document.querySelector(bar).querySelector('[role=tab][aria-selected="true"]') || {}).dataset?.tab, A.bar)); }
  await pg.keyboard.press('['); await pg.waitForTimeout(250); const back = await pg.evaluate(bar => (document.querySelector(bar).querySelector('[role=tab][aria-selected="true"]') || {}).dataset?.tab, A.bar);
  check(`M11 ${id}: ] walks the tabs in the order of the bar and wraps, [ goes back`, seen.join() === order.slice(1).concat(order[0]).join() && back === order[order.length - 1], { order, seen, back });
  // M13 — on every tab, nothing hidden is drawn
  const drawn = [];
  for (const t of order) { await run(pg, id === 'tempo' ? `tpTab('${t}')` : `switchTab('${t}')`); await pg.waitForTimeout(350);
    drawn.push(...await pg.evaluate(tab => [...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').map(e => tab + ': ' + e.tagName.toLowerCase() + '#' + e.id + '.' + String(e.className).split(' ')[0]), t)); }
  check(`M13 ${id}: no element marked hidden is drawn, on any tab`, drawn.length === 0, drawn.slice(0, 5));
  await ctx.close();
}
{   // M12 — one look
  const looks = {};
  for (const id of ['lumina', 'beacon', 'tempo']) {
    const { ctx, pg } = await boot(id);
    const views = id === 'tempo' ? [`tpTab('plate')`, `tpTab('results')`, `tpTab('curves')`, `tpTab('compare')`] : [APPS[id].results, `switchTab('history')`];
    const L = { seg: [], title: [], monoFig: [], keys: [], btn: [] };
    for (const v of views) {
      await run(pg, v); await pg.waitForTimeout(600);
      const r = await pg.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'; };
        const pane = document.querySelector('.tabpane.active,.panel.active') || document.body;
        const seg = [...pane.querySelectorAll('.seg,.segw')].filter(vis).filter(s => s.getClientRects().length === 1 && s.offsetHeight < 40).map(s => Math.round(s.getBoundingClientRect().height));
        const title = [...pane.querySelectorAll('.rs-title,.hk-title,.card-hdr,.sec-hd h2,.card > h3,.cv-hd h2,.nm-head b')].filter(vis).map(e => { const s = getComputedStyle(e); return parseFloat(s.fontSize) + '/' + s.fontWeight + ' ' + e.textContent.trim().slice(0, 20); });
        const monoFig = [...pane.querySelectorAll('td, td *, .stat .v, .kv dd, .curve-stats *, .rs-stats b')].filter(vis).filter(e => !e.closest('.pill,.badge,kbd,.wchip,code,.mono-id')).filter(e => /^[-−≥≤<>]?\s?\d[\d.,]*\s?(%|×|h|nM|µM|pM)?$/.test([...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()) && /Mono/i.test(getComputedStyle(e).fontFamily)).map(e => e.textContent.trim().slice(0, 12));
        const keys = [...pane.querySelectorAll('.rs-keys')].filter(vis).map(k => ({ t: k.textContent, kbd: [...k.querySelectorAll('kbd')].map(b => Math.round(b.getBoundingClientRect().height)) }));
        const btn = [...pane.querySelectorAll('.btn')].filter(vis).filter(b => !b.closest('table,.ax-bar')).map(b => Math.round(b.getBoundingClientRect().height)).filter(h => h !== 32);
        return { seg, title, monoFig, keys, btn };
      });
      for (const k in L) L[k].push(...r[k]);
    }
    looks[id] = L; await ctx.close();
  }
  for (const id in looks) {
    const L = looks[id];
    check(`M12 ${id}: every segmented choice is 32 px with its border`, L.seg.length > 0 && L.seg.every(h => h === 32), L.seg);
    check(`M12 ${id}: every card title is 15 px / 600`, L.title.length > 0 && L.title.every(t => /^15\/600 /.test(t)), L.title.filter(t => !/^15\/600 /.test(t)));
    check(`M12 ${id}: no figure in a table or a result tile is set in Mono`, L.monoFig.length === 0, L.monoFig.slice(0, 6));
    check(`M12 ${id}: the keys of a view are one .rs-keys row with 20 px keycaps that names [ ] for the tabs`, L.keys.length > 0 && L.keys.every(k => k.kbd.every(h => h === 20)) && L.keys.some(k => /\[\]\s*tab/.test(k.t.replace(/\s+/g, ''))), L.keys.map(k => k.t.replace(/\s+/g, ' ').slice(0, 60)));
    check(`M12 ${id}: a button outside a table is 32 px`, L.btn.length === 0, L.btn.slice(0, 6));
  }
}
{   // M14 — words and round numbers
  let c = await boot('beacon');
  const ticks = await c.pg.evaluate(() => { const cv = document.createElement('canvas'); cv.style.cssText = 'width:600px;height:280px'; document.body.appendChild(cv); const out = [];
    const orig = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t) { out.push(String(t)); return orig.apply(this, arguments); };
    try { for (const max of [3770, 4990, 812, 61234, 9]) { out.push('|'); bDrawControls(cv, [{ tag: 'a', n: 2, donor: max, donorSd: 0, acceptor: max / 3, acceptorSd: 0 }]); } } finally { CanvasRenderingContext2D.prototype.fillText = orig; }
    return out.join(' '); });
  const nums = ticks.split('|').slice(1).map(g => g.trim().split(' ').filter(x => /^[\d.]+k?$/.test(x)).map(x => x.endsWith('k') ? parseFloat(x) * 1000 : parseFloat(x)));
  const round = v => { if (v === 0) return true; const m = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].some(f => Math.abs(v / m - f) < 1e-9) || Number.isInteger(v / m); };
  check('M14 beacon: the controls chart ticks are round steps from 0 and its top holds the tallest bar', nums.every(g => g.length >= 3 && g.every(round) && g[0] === 0 && new Set(g.slice(1).map((v, i) => +(v - g[i]).toFixed(6))).size === 1), ticks);
  await c.ctx.close();
  c = await boot('lumina');
  const lt = await c.pg.evaluate(() => { const r = [-11, -10, -9, -8, -7, -6, -5].map(_lmDecadeTick).concat([_lmDecadeTick(-8.5)]); switchTab('results'); return { r, axis: curveChart && curveChart.options.scales.x.title.text }; });
  check('M14 lumina: the curve axis is written in concentrations (10 pM … 10 µM), nothing between decades', lt.r.join('|') === '10 pM|100 pM|1 nM|10 nM|100 nM|1 µM|10 µM|' && lt.axis === 'Concentration', lt);
  await c.ctx.close();
  c = await boot('tempo');
  const fw = await c.pg.evaluate(() => ({ w: tpFlagWords('R2=0.53; EC50>range; Hookx2; n=4 (df=1); EC50<range; Hookx1'), screen: [...document.querySelectorAll('#tp-restbl td[data-h=Flags]')].map(t => t.textContent).join(' '), file: tpResultsJSON(TP.plates[0]).compounds.map(c => c.promega && c.promega.flags || '').join(' ') }));
  await run(c.pg, `tpTab('results')`); await c.pg.waitForTimeout(500);
  const scr = await c.pg.evaluate(() => [...document.querySelectorAll('#tp-restbl td[data-h=Flags]')].map(t => t.textContent).join(' '));
  check('M14 tempo: flags on screen are words, the files keep ProNect\'s codes', fw.w === 'R² 0.53; DC50 above the doses; hook at 2 doses; 4 points, 1 left over; DC50 below the doses; hook at 1 dose' && !/R2=|Hookx|EC50[<>]range/.test(scr) && /Hookx|R2=/.test(fw.file), { w: fw.w, scr: scr.slice(0, 120) });
  await c.ctx.close();
}

{   // M15 — the workbooks
  const VENDOR = (await import('fs')).readFileSync(path.join(ROOT, 'vendor/xlsx.full.min.js'), 'utf8');
  const J = [['lumina', `loadLuminaTestData(); switchTab('results')`, 'exportXLSX()'], ['beacon', `loadTestData('gain')`, 'generateOutputXLSX()'], ['beacon', `loadTestData('gain')`, 'exportPlateMBretXLSX()'],
    ['beacon', `loadTestData('displacement')`, 'generateOutputXLSX()'], ['tempo', `await tpLoadExample('degradation')`, 'tpExportXLSX()'], ['tempo', `await tpLoadExample('timecourse')`, 'tpExportXLSXTC()']];
  for (const [id, seed, fn] of J) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await ctx.newPage();
    await pg.route('**/xlsx.full.min.js', r => r.fulfill({ contentType: 'application/javascript', body: VENDOR }));
    await pg.route(/^https?:(?!.*xlsx\.full\.min\.js)/, r => r.abort());
    await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); localStorage.setItem('hub_theme', 'light'); } catch (e) {} });
    await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForFunction(() => window.XLSX, null, { timeout: 10000 }).catch(() => {}); await pg.waitForTimeout(500);
    await run(pg, seed); await pg.waitForTimeout(2200);
    const r = await pg.evaluate(async fn => {
      let cap = null; const o = XLSX.writeFile; XLSX.writeFile = (wb, name) => { cap = { wb, name }; };
      try { await eval(fn); } catch (e) { return { err: String(e) }; } finally { XLSX.writeFile = o; }
      if (!cap) return { err: 'no workbook written' };
      const bad = [], noisy = [];
      for (const sn of cap.wb.SheetNames) XLSX.utils.sheet_to_json(cap.wb.Sheets[sn], { header: 1, raw: true, defval: null }).forEach((row, i) => row.forEach((v, j) => {
        if (v === null) return; const at = sn + '!R' + (i + 1) + 'C' + (j + 1);
        if (typeof v === 'number') { if (!isFinite(v)) bad.push(at + '=' + v); else if (!Number.isInteger(v) && String(v).replace(/^-?0?\.?0*/, '').replace('.', '').replace(/e.*/, '').length > 10) noisy.push(at + '=' + v); }
        else if (/\bNaN\b|undefined|\[object|Infinity/.test(String(v))) bad.push(at + '=' + String(v).slice(0, 40));
      }));
      return { name: cap.name, bad: bad.slice(0, 5), noisy: noisy.slice(0, 5), n: noisy.length };
    }, fn);
    check(`M15 ${id} ${fn}: the workbook has no NaN / undefined / [object and no float tail in a number`, !r.err && !r.bad.length && !r.n, r);
    await ctx.close();
  }
}

{   // M16 — one way to name a file
  const VENDOR = (await import('fs')).readFileSync(path.join(ROOT, 'vendor/xlsx.full.min.js'), 'utf8');
  const J = { lumina: [`loadLuminaTestData(); switchTab('results')`, ['exportXLSX()', 'exportResultsCSV()', 'exportRawCSV()'], 'Lumina'],
    beacon: [`loadTestData('gain'); switchTab('results')`, ['generateOutputXLSX()', 'exportPlateMBretXLSX()', 'exportResultsCSV()', 'rsSavePNG()'], 'Beacon'],
    tempo: [`await tpLoadExample('degradation'); tpTab('results')`, ['tpExportXLSX()', 'tpExportCSV()', 'tpExportPrism()', 'tpExportScreenCSV()', 'tpSaveMethod()'], 'Tempo'] };
  const names = {};
  for (const id in J) {
    const [seed, fns, App] = J[id];
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage();
    await pg.route('**/xlsx.full.min.js', r => r.fulfill({ contentType: 'application/javascript', body: VENDOR }));
    await pg.route(/^https?:(?!.*xlsx\.full\.min\.js)/, r => r.abort());
    await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
    await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForFunction(() => window.XLSX, null, { timeout: 10000 }).catch(() => {}); await pg.waitForTimeout(500);
    await run(pg, seed); await pg.waitForTimeout(2200);
    names[id] = await pg.evaluate(async fns => {
      const got = [], ow = XLSX.writeFile, oc = HTMLAnchorElement.prototype.click;
      XLSX.writeFile = (wb, n) => got.push(n); HTMLAnchorElement.prototype.click = function () { if (this.download) got.push(this.download); else oc.call(this); };
      try { for (const f of fns) { try { await eval(f); } catch (e) { got.push('threw ' + f + ': ' + e); } await new Promise(r => setTimeout(r, 900)); } } finally { XLSX.writeFile = ow; HTMLAnchorElement.prototype.click = oc; }
      return got;
    }, fns);
    names[id].push(await pg.evaluate(App => MenuKit.fileName(App, '', 'Figure', 'png'), App));
    await ctx.close();
    const re = new RegExp('^([A-Za-z0-9][\\w.\\-]*_)?' + App + '_[A-Za-z][\\w.\\-]*_\\d{4}-\\d\\d-\\d\\d\\.(xlsx|csv|pdf|png|svg|txt)$');
    const bad = names[id].filter(n => !re.test(n));
    check(`M16 ${id}: every file is <name>_${App}_<What>_<date>.<ext> (${names[id].length} files)`, names[id].length >= fns.length + 1 && bad.length === 0, bad.length ? bad : names[id]);
  }
  const kinds = id => names[id].map(n => n.replace(/^(.*?_)?(Lumina|Beacon|Tempo)_/, '').replace(/_\d{4}.*$/, ''));
  check('M16 the same kind of file has the same word in the three apps: Results (workbook and table)', ['lumina', 'beacon', 'tempo'].every(id => kinds(id).includes('Results')), { lumina: kinds('lumina'), beacon: kinds('beacon'), tempo: kinds('tempo') });
  check('M16 a name with spaces and symbols is written plainly', await (async () => { const { ctx, pg } = await boot('lumina'); const n = await pg.evaluate(() => MenuKit.fileName('Lumina', ' Demo - protein/protein (2) ', 'Results', 'xlsx')); await ctx.close(); return /^Demo-protein_protein_2_Lumina_Results_\d{4}-\d\d-\d\d\.xlsx$/.test(n) || n; })());
}
await browser.close();
console.log(findings.length ? `\n${findings.length} finding(s), ${passed} checks passed.` : `\nAll ${passed} menu invariants hold.`);
process.exit(findings.length ? 1 : 0);
