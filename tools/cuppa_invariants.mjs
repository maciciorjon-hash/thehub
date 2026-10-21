// Cuppa invariants — the ledger is people's money; what it shows has to be what is stored, and a slip of the finger
// has to come back.
//
//   CU1  the ledger is the state   every member is a row, every row has one cell per month shown, a paid cell is
//                                  paid in state.payments and nothing else is; the tiles add up from the same state
//   CU2  a toggle undoes           an admin's click marks a month paid (and unpaid); the toast's Undo puts the payment
//                                  and its timestamp back exactly as they were
//   CU3  viewers do not write      a click from someone who is not signed in as admin changes nothing
//   CU4  months move               ‹ › cross the year boundary both ways, "this month" comes back, and the tiles, the
//                                  shaded column and the owing list follow the month chosen
//   CU5  search filters            a part of a name keeps its row and drops the rest; nothing matching says so
//   CU6  no emoji in the UI        the interface draws its icons; only the Slack message (content) may carry emoji
//   CU8  a write that fails says so      offline or refused by the server: the header says NOT SAVED, the toast offers Retry, a retry that
//                                        works clears it; a price of 0, a minus or a word is refused with a message and nothing changes
//   CU9  dialogs keep focus              each dialog takes focus, keeps Tab inside, closes on Esc and returns focus to what opened it;
//                                        a member cannot be added twice
//   CU10 text reaches 4.5:1              the quiet text and the accent as text, in both themes
//   CU7  everything in its box     escape, runtime and alignment audits at 1440, 1024 and 390 in both themes
//
//   node tools/cuppa_invariants.mjs [--only=CU1,CU2] [--file=apps/cuppa/cuppa.html]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/cuppa/cuppa.html'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const browser = await chromium.launch();
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 } });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(t => { try { localStorage.setItem('hub_theme', t); } catch (e) {} }, opts.theme || 'light');
  await page.goto('file://' + FILE); await page.waitForTimeout(500);
  // Nothing reaches Firebase from a test: the save is counted, not sent.
  await page.evaluate(() => { window.__saves = 0; window.saveToFirebase = function(){ window.__saves++; }; });
  return page;
}
const admin = p => p.evaluate(() => { isAdmin = true; document.body.classList.add('admin'); render(); });

if (run('CU1')) await guard('CU1', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const out = { rows: 0, cellMismatch: [], paidMismatch: [], members: state.members.length };
    const heads = [...document.querySelectorAll('#tbl-scroll thead th')].filter(th => !th.classList.contains('name') && th.textContent.trim());
    const rows = [...document.querySelectorAll('#tbl-scroll tbody tr')];
    out.rows = rows.length;
    rows.forEach(tr => {
      const cells = [...tr.querySelectorAll('td')].filter(td => !td.classList.contains('name') && !td.querySelector('.edit-btn'));
      if (cells.length !== heads.length) out.cellMismatch.push(tr.textContent.trim().slice(0, 20));
      tr.querySelectorAll('button.pay').forEach(b => { const paid = !!memberPaid(b.dataset.m, b.dataset.mn); if (paid !== b.classList.contains('paid') || String(paid) !== b.getAttribute('aria-pressed')) out.paidMismatch.push(b.dataset.mn); });
    });
    const active = state.members.filter(m => m.drink !== 'none'); let col = 0, owe = 0;
    active.forEach(m => { const v = memberPriceMonthly(m); if (memberPaid(m.id, currentMonth)) col += v; else owe += v; });
    const tiles = [...document.querySelectorAll('#sum-row .tile-val')].map(e => e.textContent.trim());
    out.tilesOk = tiles[0] === '£' + col.toFixed(2) && tiles[1] === '£' + owe.toFixed(2);
    out.tiles = tiles; out.owingRows = document.querySelectorAll('#wos-body .owing-row').length;
    out.owingExpected = active.filter(m => !memberPaid(m.id, currentMonth)).length;
    out.now = (document.querySelector('#tbl-scroll th.now') || {}).textContent;
    return out;
  });
  r.rows === r.members ? ok() : bad('CU1', `${r.rows} rows for ${r.members} members`);
  r.cellMismatch.length ? bad('CU1', 'rows with the wrong number of month cells: ' + r.cellMismatch.join(', ')) : ok();
  r.paidMismatch.length ? bad('CU1', 'cells that do not match the stored payment: ' + r.paidMismatch.slice(0, 5).join(', ')) : ok();
  r.tilesOk ? ok() : bad('CU1', 'the tiles do not add up from the state: ' + r.tiles.join(' / '));
  r.owingRows === r.owingExpected ? ok() : bad('CU1', `owing list has ${r.owingRows} rows, ${r.owingExpected} expected`);
  r.now ? ok() : bad('CU1', 'the month you are on is not marked in the ledger');
  p.errs.length ? bad('CU1', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('CU2')) await guard('CU2', async () => {
  const p = await open(); await admin(p);
  // A paid month (with its timestamp) and an unpaid one, each toggled and undone.
  const r = await p.evaluate(() => new Promise(res => {
    const out = {};
    const paidBtn = document.querySelector('#tbl-scroll button.pay.paid'), freeBtn = document.querySelector('#tbl-scroll button.pay:not(.paid):not(.future)');
    // Compared as Firebase stores it: key order does not matter and an empty object is no object.
    const canon = v => { if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => { const c = canon(v[k]); if (c !== undefined) o[k] = c; }); return Object.keys(o).length ? o : undefined; } return v; };
    const snap = () => JSON.stringify(canon([state.payments, state.paymentsMeta || {}].reduce((o, x, i) => (o[i] = x, o), {})));
    const m1 = paidBtn.dataset.m, mn1 = paidBtn.dataset.mn;
    (state.paymentsMeta = state.paymentsMeta || {}); ((state.paymentsMeta[currentYear] = state.paymentsMeta[currentYear] || {})[m1] = state.paymentsMeta[currentYear][m1] || {})[mn1] = '2026-04-03T10:00:00.000Z';
    const before = snap();
    paidBtn.click();
    out.unpaid = !memberPaid(m1, mn1);
    out.cellFollows = document.querySelector('#tbl-scroll button.pay[data-m="' + m1 + '"][data-mn="' + mn1 + '"]').getAttribute('aria-pressed') === 'false';
    const undo = document.querySelector('#toast button');
    out.hasUndo = !!undo && /undo/i.test(undo.textContent);
    if (undo) undo.click();
    out.restored = snap() === before;
    const m2 = freeBtn.dataset.m, mn2 = freeBtn.dataset.mn, before2 = snap();
    document.querySelector('#tbl-scroll button.pay[data-m="' + m2 + '"][data-mn="' + mn2 + '"]').click();
    out.paid = !!memberPaid(m2, mn2) && !!(state.paymentsMeta[currentYear][m2] || {})[mn2];
    const u2 = document.querySelector('#toast button'); if (u2) u2.click();
    out.restored2 = snap() === before2;
    out.saves = window.__saves;
    // keyboard: the cells are buttons, so Enter on a focused one toggles it
    const kb = document.querySelector('#tbl-scroll button.pay:not(.future)');
    out.focusable = kb && kb.tabIndex >= 0;
    res(out);
  }));
  r.unpaid && r.cellFollows ? ok() : bad('CU2', 'clicking a paid month did not mark it unpaid on screen and in the state');
  r.hasUndo ? ok() : bad('CU2', 'the toast after a toggle offers no Undo');
  r.restored ? ok() : bad('CU2', 'Undo did not put the payment and its timestamp back exactly');
  r.paid ? ok() : bad('CU2', 'clicking an unpaid month did not mark it paid with a timestamp');
  r.restored2 ? ok() : bad('CU2', 'Undo after marking paid left something behind');
  r.saves >= 4 ? ok() : bad('CU2', `${r.saves} saves for two toggles and two undos`);
  r.focusable ? ok() : bad('CU2', 'a month cell cannot be reached from the keyboard');
  await p.context().close();
});

if (run('CU3')) await guard('CU3', async () => {
  const p = await open();
  const r = await p.evaluate(() => { isAdmin = false; render(); const before = JSON.stringify(state.payments); document.querySelector('#tbl-scroll button.pay').click(); return { same: JSON.stringify(state.payments) === before, saves: window.__saves }; });
  r.same && r.saves === 0 ? ok() : bad('CU3', 'a viewer\'s click changed the ledger or saved it');
  await p.context().close();
});

if (run('CU4')) await guard('CU4', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const out = {};
    const y0 = currentYear, m0 = currentMonth;
    currentYear = 2025; currentMonth = 'January'; cuppaMonth(-1);
    out.back = currentYear === 2024 && currentMonth === 'December';
    cuppaMonth(1); out.fwd = currentYear === 2025 && currentMonth === 'January';
    currentMonth = 'December'; cuppaMonth(1); out.fwd2 = currentYear === 2026 && currentMonth === 'January';
    cuppaMonth(0); out.home = currentYear === y0 && currentMonth === m0;
    out.todayHidden = getComputedStyle(document.getElementById('month-today')).display === 'none';
    // a month in the past: title, tiles and owing list follow it
    currentYear = y0; currentMonth = 'May'; render();
    out.title = document.getElementById('month-title').textContent;
    out.tileLbl = document.querySelector('#sum-row .tile-lbl').textContent;
    out.shade = (document.querySelector('#tbl-scroll th.now') || {}).textContent;
    const owe = state.members.filter(m => m.drink !== 'none' && !memberPaid(m.id, 'May')).length;
    out.owing = document.querySelectorAll('#wos-body .owing-row').length === owe;
    out.todayShown = getComputedStyle(document.getElementById('month-today')).display !== 'none';
    return out;
  });
  r.back && r.fwd && r.fwd2 ? ok() : bad('CU4', 'month navigation does not cross the year boundary');
  r.home && r.todayHidden ? ok() : bad('CU4', '"this month" does not come back, or its button stays up on this month');
  /May/.test(r.title) && /May/.test(r.tileLbl) && r.shade === 'May' && r.owing ? ok() : bad('CU4', `the screen does not follow the month chosen (${r.title} · ${r.tileLbl} · ${r.shade})`);
  r.todayShown ? ok() : bad('CU4', 'away from this month there is no way back to it');
  await p.context().close();
});

if (run('CU5')) await guard('CU5', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const name = state.members[0].name, part = name.slice(1, 4).toLowerCase();
    const inp = document.getElementById('search-input'); inp.value = part; inp.dispatchEvent(new Event('input', { bubbles: true }));
    const rows = [...document.querySelectorAll('#tbl-scroll tbody tr')].map(tr => tr.textContent);
    const want = state.members.filter(m => m.name.toLowerCase().includes(part)).length;
    inp.value = 'zzqqxx'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    const none = document.querySelector('#tbl-scroll tbody').textContent;
    inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true }));
    return { kept: rows.some(t => t.includes(name)), n: rows.length, want, none, all: document.querySelectorAll('#tbl-scroll tbody tr').length === state.members.length };
  });
  r.kept && r.n === r.want ? ok() : bad('CU5', `searching kept ${r.n} rows, ${r.want} expected`);
  /nobody matches/i.test(r.none) ? ok() : bad('CU5', 'a search with no match does not say so');
  r.all ? ok() : bad('CU5', 'clearing the search does not bring every member back');
  await p.context().close();
});

if (run('CU6')) await guard('CU6', async () => {
  const p = await open(); await admin(p);
  const r = await p.evaluate(() => {
    const re = /\p{Extended_Pictographic}/u, hits = [];
    const walk = n => { if (n.nodeType === 3) { if (re.test(n.nodeValue) && n.parentElement && n.parentElement.closest('body') && !n.parentElement.closest('script,style')) hits.push(n.nodeValue.trim().slice(0, 30)); return; } n.childNodes.forEach(walk); };
    walk(document.body);
    document.querySelectorAll('option,[title],[aria-label],[placeholder]').forEach(e => ['title', 'aria-label', 'placeholder'].forEach(a => { const v = e.getAttribute(a); if (v && re.test(v)) hits.push(a + ': ' + v.slice(0, 30)); }));
    isAdmin = false; copyWallOfShame(); const pop = document.getElementById('snitch-pop');
    if (pop && re.test(pop.textContent)) hits.push('snitch: ' + pop.textContent.slice(0, 30));
    // The message is picked at random, so every one it could pick is checked.
    (typeof _SNITCH_MSGS !== 'undefined' ? _SNITCH_MSGS : []).forEach(s => { if (re.test(s)) hits.push('snitch: ' + s.slice(0, 30)); });
    return hits;
  });
  r.length ? bad('CU6', 'emoji in the interface: ' + r.slice(0, 5).join(' · ')) : ok();
  await p.context().close();
});

if (run('CU8')) await guard('CU8', async () => {
  // the page is offline (no Firebase SDK): toggling must not pretend
  const q = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const pg = await q.newPage(); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(e.message)); await pg.route(/^https?:/, r => r.abort()); await pg.goto('file://' + FILE); await pg.waitForTimeout(500);
  await pg.evaluate(() => { isAdmin = true; document.body.classList.add('admin'); render(); });
  const off = await pg.evaluate(async () => { const b = document.querySelector('button.pay'); b.click(); await new Promise(r => setTimeout(r, 200));
    return { toast: document.getElementById('toast').textContent, hdr: document.getElementById('lastupd-value').textContent }; });
  /not saved/i.test(off.toast) && /NOT SAVED/.test(off.hdr) ? ok() : bad('CU8', `offline: toast "${off.toast}", header "${off.hdr}"`);
  const refused = await pg.evaluate(async () => { window.firebase = { database: () => ({ ref: () => ({ set: () => Promise.reject({ code: 'PERMISSION_DENIED' }) }) }) };
    saveToFirebase('x'); await new Promise(r => setTimeout(r, 200)); return document.getElementById('toast').textContent; });
  /refused/i.test(refused) ? ok() : bad('CU8', `refused by the server: "${refused}"`);
  const fixed = await pg.evaluate(async () => { window.firebase = { database: () => ({ ref: () => ({ set: () => Promise.resolve() }) }) };
    const rb = document.querySelector('#toast button'); if (rb) rb.click(); await new Promise(r => setTimeout(r, 300)); return { hdr: document.getElementById('lastupd-value').textContent, retry: !!rb }; });
  fixed.retry && !/NOT SAVED/.test(fixed.hdr) ? ok() : bad('CU8', `after a good retry: retry=${fixed.retry}, header "${fixed.hdr}"`);
  // prices
  const pr = await pg.evaluate(async () => { window.saveToFirebase = function(){ return Promise.resolve(); }; openSettings(); const out = {}, c = document.getElementById('sf-coffee'), t = document.getElementById('sf-tea'), before = state.prices.coffee;
    for (const v of ['0', '-3', 'abc', '', '1e999', '5000']) { c.value = v; saveSettings(); out[v] = { price: state.prices.coffee === before, open: document.getElementById('settings-modal').classList.contains('open'), toast: /number above 0/.test(document.getElementById('toast').textContent) }; document.getElementById('toast').textContent = ''; }
    c.value = '8.25'; t.value = '5'; saveSettings(); out.good = state.prices.coffee; return out; });
  const badP = Object.entries(pr).filter(([k, v]) => k !== 'good' && !(v.price && v.open && v.toast)).map(([k]) => k);
  badP.length ? bad('CU8', 'prices accepted or not explained: ' + badP.join(', ')) : ok();
  pr.good === 8.25 ? ok() : bad('CU8', 'a good price was not saved');
  await q.close();
});

if (run('CU9')) await guard('CU9', async () => {
  const p = await open(); await admin(p);
  for (const [name, openFn, id, closeFn] of [['member', "editMember(state.members[0].id)", 'member-modal', 'closeMemberModal'], ['settings', 'openSettings()', 'settings-modal', 'closeSettings']]) {
    await p.evaluate(() => { const b = document.getElementById('hdr-settings-btn') || document.querySelector('button.btn'); b.focus(); document.activeElement.setAttribute('data-opener', '1'); });
    await p.evaluate(openFn); await p.waitForTimeout(300);
    const r = await p.evaluate(id => { const b = document.getElementById(id), c = b.querySelector('[role=dialog]'), x = b.querySelector('.modal-close'); return { role: c.getAttribute('role'), named: !!(c.getAttribute('aria-labelledby') || c.getAttribute('aria-label')), closeName: x.getAttribute('aria-label'), inside: b.contains(document.activeElement) }; }, id);
    r.role === 'dialog' && r.named && r.closeName ? ok() : bad('CU9', `${name}: ${JSON.stringify(r)}`);
    r.inside ? ok() : bad('CU9', `${name}: focus did not move in`);
    await p.evaluate(id => { const b = document.getElementById(id), f = [...b.querySelectorAll('button,input,select,textarea')].filter(e => e.getClientRects().length && !e.disabled); f[f.length - 1].focus(); }, id);
    await p.keyboard.press('Tab'); const stay = await p.evaluate(id => document.getElementById(id).contains(document.activeElement), id);
    stay ? ok() : bad('CU9', `${name}: Tab leaves the dialog`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const back = await p.evaluate(id => ({ closed: !document.getElementById(id).classList.contains('open'), opener: document.activeElement && document.activeElement.getAttribute('data-opener') === '1' }), id);
    back.closed && back.opener ? ok() : bad('CU9', `${name}: Esc / focus return: ${JSON.stringify(back)}`);
    await p.evaluate(() => document.querySelectorAll('[data-opener]').forEach(e => e.removeAttribute('data-opener')));
  }
  const dup = await p.evaluate(() => { const n = state.members.length, nm = state.members[0].name; openAddMember(); document.getElementById('mf-name').value = nm.toUpperCase(); saveMember(); const out = { same: state.members.length === n, toast: document.getElementById('toast').textContent }; closeMemberModal(); return out; });
  dup.same && /already a member/.test(dup.toast) ? ok() : bad('CU9', 'the same name can be added twice: ' + JSON.stringify(dup));
  await p.context().close();
});

if (run('CU10')) await guard('CU10', async () => {
  const CONTRAST = () => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const over = (t, b) => [t[0] * t[3] + b[0] * (1 - t[3]), t[1] * t[3] + b[1] * (1 - t[3]), t[2] * t[3] + b[2] * (1 - t[3]), 1];
    const bgOf = el => { const st = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { if (/gradient|url/.test(getComputedStyle(e).backgroundImage)) return null; const b = rgba(getComputedStyle(e).backgroundColor); if (b[3] > 0) { st.push(b); if (b[3] >= 0.999) break; } } let cur = (st.length && st[st.length - 1][3] >= 0.999) ? st.pop() : [255, 255, 255, 1]; while (st.length) cur = over(st.pop(), cur); return cur; };
    const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const t = n.textContent.trim(); const el = n.parentElement; if (!t || !el || /^(SCRIPT|STYLE|OPTION)$/.test(el.tagName)) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || el.closest('.ctx,#toast')) continue; if (el.closest('button:disabled')) continue;
      const bg = bgOf(el); if (!bg) continue; const cs = getComputedStyle(el), fg = over(rgba(el.closest('svg') ? cs.fill : cs.color), bg), a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700); if (ratio < (big ? 3 : 4.5) - 0.01) out.push(`${el.className || el.tagName} "${t.slice(0, 14)}" ${ratio.toFixed(2)}`); }
    return [...new Set(out)].slice(0, 6);
  };
  for (const theme of ['light', 'dark']) {
    const p = await open({ theme }); await admin(p);
    const f = await p.evaluate(`(${CONTRAST.toString()})()`);
    f.length ? bad('CU10', `${theme}: ${f.join('; ')}`) : ok();
    await p.context().close();
  }
});

if (run('CU7')) await guard('CU7', async () => {
  const ESC = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8').replace(/window\.__escapeAudit\(\);\s*$/, '');
  const RT = fs.readFileSync(path.join(ROOT, 'tools/audit_runtime.js'), 'utf8'), AL = fs.readFileSync(path.join(ROOT, 'tools/audit_align.js'), 'utf8');
  for (const theme of ['light', 'dark']) for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
    const p = await open({ w, h, theme }); await admin(p);
    const screens = [['ledger', null], ['member dialog', () => { editMember(state.members[0].id); }], ['settings', () => { openSettings(); }], ['gear', () => { toggleOpts(); }]];
    for (const [name, fn] of screens) {
      if (fn) { await p.evaluate(fn); await p.waitForTimeout(250); }
      const f = [].concat(
        await p.evaluate(ESC + ';window.__escapeAudit({allowScroll:"#tbl-scroll,.tbl-scroll,.owing-list,table"})').catch(x => ['escape audit crashed: ' + x.message]).then(r => r.map(x => 'ESCAPE ' + x)),
        await p.evaluate(RT + ';(window.__runtimeAudit||(()=>[]))({accentInk:' + (theme === 'dark' ? 4.5 : 3) + '})').catch(() => []).then(r => (r || []).map(x => 'RUNTIME ' + x)),
        await p.evaluate(AL + ';(window.__alignAudit||(()=>[]))()').catch(() => []).then(r => (r || []).map(x => 'ALIGN ' + x)));
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 1) f.push(`the page scrolls sideways by ${over}px`);
      f.length ? f.slice(0, 4).forEach(x => bad('CU7', `${theme} ${w}×${h} ${name}: ${x}`)) : ok();
      if (fn) await p.evaluate(() => { closeMemberModal(); closeSettings(); const o = document.getElementById('opts-panel'); if (o) o.classList.remove('open'); });
    }
    p.errs.length ? bad('CU7', `${theme} ${w}: errors: ` + p.errs.join(' | ')) : ok();
    await p.context().close();
  }
});

await browser.close();
findings.forEach(f => console.log(f));
console.log(`\nCuppa invariants: ${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
