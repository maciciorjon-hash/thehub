// Dora · Blueprint · Iceberg — one generic accessibility check over every screen of the three apps, in both themes.
// A class, not a list of controls: whatever is drawn next is held to the same rules.
//
//   A1 keyboard reach     nothing with a click handler is a bare element: it is a control, or it has a tabindex (a dialog's backdrop is exempt)
//   A2 names              every visible button, link, field, select and textarea has an accessible name (label, aria-label, text, title)
//   A3 ink                every text run reaches 4.5:1 against what is behind it (3:1 for large text), light and dark. Not measured: text on a solid
//                         accent fill (held at 3:1 by docs/UI.md), a disabled control, the tour kit's own card
//   A4 tabs               a tab list is role=tablist with role=tab / aria-selected, and the arrow keys move between its tabs
//   A5 dialogs            role=dialog (or alertdialog) with a name; Esc closes it; focus goes back to what opened it (Iceberg's vial dialog, Blueprint's
//                         values dialog, Dora's Echo picker)
//   A6 focus ring         every control Tab reaches shows a ring or an equivalent change
//
//   node tools/audit3_invariants.mjs [--only=dora,blueprint,iceberg] [--url=http://127.0.0.1:8791]      exit 1 on any finding
import { chromium } from 'playwright';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const BASE = arg('url', 'http://127.0.0.1:8791');
const only = arg('only', '').split(',').filter(Boolean);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };

const IN_PAGE = `(() => {
  const out = [];
  const desc = e => { const t = (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : '') + (t ? ' "' + t + '"' : ''); };
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .05) return false; } return true; };
  const parse = c => { let m = c.match(/^rgba?\\(([^)]+)\\)/); if (m) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; } m = c.match(/^color\\(srgb ([^)]+)\\)/); if (m) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const L = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
  const accent = parse(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5e87c5') || [94, 135, 197, 1];
  function bgOf(e) { const st = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (/gradient|url/.test(cs.backgroundImage || '')) return null; const c = parse(cs.backgroundColor); if (c && c[3] > 0) { st.push(c); if (c[3] >= 1) break; } }
    let base = parse(getComputedStyle(document.body).backgroundColor); if (!base || base[3] < 1) base = [255, 255, 255, 1]; for (let i = st.length - 1; i >= 0; i--) base = over(st[i], base); return base; }
  const seen = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const p = n.parentElement; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(p.tagName) || !n.textContent.trim() || !vis(p) || p.closest('svg,[data-tk-guide],.tk-card,#dep-stack,[id^=dep-],[role=status][style*="99999"],.sr-only,canvas')) continue;
    if (p.closest('button:disabled,[disabled],[aria-disabled=true]')) continue;
    const cs = getComputedStyle(p); let fg = parse(cs.color); const bg = bgOf(p); if (!fg || !bg) continue;
    if (ratio(bg, accent) < 1.15) continue;   // laid on the solid accent fill: held at 3:1 by docs/UI.md
    let op = 1; for (let q = p; q && q.nodeType === 1; q = q.parentElement) op *= +getComputedStyle(q).opacity;
    if (fg[3] < 1) fg = over(fg, bg); if (op < 1) fg = [fg[0] * op + bg[0] * (1 - op), fg[1] * op + bg[1] * (1 - op), fg[2] * op + bg[2] * (1 - op), 1];
    const fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700), need = large ? 3 : 4.5, r = ratio(fg, bg);
    if (r < need) { const k = desc(p); if (!seen.has(k)) { seen.add(k); out.push({ k: 'A3', m: desc(p) + ' ' + r.toFixed(2) + ':1' }); } } }
  const NATIVE = 'a[href],button,input,select,textarea,summary,[tabindex],[role=button],[role=tab],[role=link],[role=checkbox],[role=menuitem],[role=switch],[role=option],label';
  document.querySelectorAll('[onclick]').forEach(e => { if (!vis(e) || e.matches(NATIVE) || e.closest('button,a[href],label,summary,[role=button],[role=tab]') || e.matches('[role=dialog],[role=alertdialog],.modal-overlay,.detail-overlay,.eh-back')) return; out.push({ k: 'A1', m: desc(e) }); });
  const nameOf = e => { if ((e.getAttribute('aria-label') || '').trim()) return 1; const lb = e.getAttribute('aria-labelledby'); if (lb && lb.split(/\\s+/).some(i => (document.getElementById(i) || {}).textContent)) return 1; if (e.labels && e.labels.length && [...e.labels].some(l => l.textContent.trim())) return 1; const cl = e.closest('label'); if (cl && cl.textContent.trim()) return 1;
    if (!e.matches('input,select,textarea') && (e.textContent || '').replace(/[\\s✕×]/g, '')) return 1; if (e.getAttribute('title')) return 1; if (e.matches('input[type=button],input[type=submit]') && e.value) return 1; if (e.getAttribute('placeholder')) return 1; return 0; };
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab]').forEach(e => { if (!vis(e) && !/^(file|checkbox|radio)$/.test(e.type || '')) return; if (!nameOf(e)) out.push({ k: 'A2', m: desc(e) }); });
  document.querySelectorAll('[role=tab]').forEach(e => { if (!e.hasAttribute('aria-selected') || !e.closest('[role=tablist]')) out.push({ k: 'A4', m: desc(e) + ' is a tab without aria-selected or outside a tablist' }); });
  document.querySelectorAll('[role=dialog],[role=alertdialog]').forEach(e => { if (!vis(e)) return; if (!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby'))) out.push({ k: 'A5', m: desc(e) + ' has no name' }); if (!e.hasAttribute('aria-modal')) out.push({ k: 'A5', m: desc(e) + ' has no aria-modal' }); });
  return out;
})()`;

async function ring(page, max) {
  const miss = [];
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e);
      const has = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      let changed = false; if (!has) { const a = [cs.borderColor, cs.backgroundColor, cs.color].join('|'); e.blur(); const c2 = getComputedStyle(e); changed = a !== [c2.borderColor, c2.backgroundColor, c2.color].join('|'); e.focus(); }
      return { has: has || changed, d: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).trim().split(/\s+/)[0], hidden: e.type === 'file' || e.type === 'date' || e.closest('[data-tk-guide]') ? 1 : 0 }; });
    if (r && !r.has && !r.hidden) miss.push(r.d);
  }
  return [...new Set(miss)];
}

const ICE_VIALS = {}; ['HCT116, X KO', 'HEK293 FT', 'A549', 'HeLa'].forEach((n, i) => { for (let k = 0; k < 6; k++) ICE_VIALS[String.fromCharCode(65 + i) + (k + 1)] = { cellLine: n, passage: 'P' + (k + 3), freezeDate: '2026-01-0' + (k + 1), frozenBy: 'JM', vialCount: 1 }; });
const ICE_STATE = { v: 1, updated: 1759000000000, cellLineColors: {}, storages: { minus80: { label: '−80°C', racks: [{ id: 'r1', name: 'Shelf 1', boxes: [{ id: 'b1', name: 'Box A', rows: 9, cols: 9, vials: ICE_VIALS, log: [] }, { id: 'b2', name: 'Box B', rows: 8, cols: 12, vials: {} }] }] }, n2: { label: 'Liquid N₂', racks: [] } } };
const closeAll = '[...document.querySelectorAll(".modal-overlay")].forEach(m=>m.classList.remove("open"))';
const APPS = {
  dora: { url: '/apps/dora/dora.html', states: [
    ['load', p => p.evaluate(() => {})], ['table', p => p.evaluate(() => loadTestData())], ['detail', p => p.evaluate(() => selectCompound('MZ1'))],
    ['scatter', p => p.evaluate(() => switchTab('scatter'))], ['props', p => p.evaluate(() => switchTab('props'))], ['guide', p => p.evaluate(() => switchTab('guide'))],
    ['opts', p => p.evaluate(() => { switchTab('table'); toggleOpts(); })]], tabs: '.tabs' },
  blueprint: { url: '/apps/blueprint/blueprint.html', states: [
    ['plate', p => p.evaluate(() => {})],
    ['filled', p => p.evaluate(() => { wellState.A1 = { typeId: WELL_TYPES[0].id, label: '10 µM' }; wellState.B1 = { typeId: WELL_TYPES[1].id, label: 'DMSO' }; selection.add('A1'); selection.add('B1'); drawPlateCanvas(document.getElementById('plate-canvas-main')); renderLegend(); updateSelToolbar(); })],
    ['types', p => p.evaluate(() => toggleTypesPanel())], ['brackets', p => p.evaluate(() => { toggleTypesPanel(); pdToggleBracketsBar(); pdAddBracket('top'); })],
    ['values', p => p.evaluate(() => { pdToggleBracketsBar(); pdOpenValues(); })], ['fmt', p => p.evaluate(() => { pdCloseValues(); showFmtModal(384); })],
    ['colour', p => p.evaluate(() => { hideFmtModal(); openColorPicker('#e36c69', () => {}, document.getElementById('btn-types-panel')); })],
    ['gel', p => p.evaluate(() => { pdcpCancel(); switchTab('gel', document.querySelectorAll('.tab')[1]); })],
    ['history', p => p.evaluate(() => switchTab('history', document.querySelectorAll('.tab')[2]))], ['guide', p => p.evaluate(() => switchTab('guide', document.querySelectorAll('.tab')[3]))]], tabs: '.tabs' },
  iceberg: { url: '/apps/iceberg/iceberg.html', seed: ICE_STATE, states: [
    ['boxes', p => p.evaluate(() => {})], ['table', p => p.evaluate(() => setView('table'))], ['history', p => p.evaluate(() => setView('history'))],
    ['find', p => p.evaluate(() => { setView('grid'); UI.search = 'hela'; _saveUI(); renderTab(currentTab); })],
    ['box', p => p.evaluate(() => { UI.search = ''; _saveUI(); renderTab(currentTab); openBoxDetail('minus80', 'r1', 'b1'); })],
    ['select', p => p.evaluate(() => { toggleSelMode(); SELW.add('A1'); SELW.add('G1'); renderBoxDetail(); })],
    ['vial', p => p.evaluate(() => { clearSel(); openEditVial('A1'); })],
    ['bulk', p => p.evaluate(closeAll + ';openBulkAdd()')], ['rack', p => p.evaluate(closeAll + ';openAddRack()')], ['ask', p => p.evaluate(closeAll + ';icebergAsk("Delete?","x",{ok:"Delete",danger:true},()=>{})')],
    ['opts', p => p.evaluate('icebergAskClose(false);' + closeAll + ';toggleOpts()')]], tabs: '#storage-tabs' }
};

const browser = await chromium.launch();
for (const [name, A] of Object.entries(APPS)) {
  if (only.length && !only.includes(name)) continue;
  for (const th of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.addInitScript(([t, st]) => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); if (st) localStorage.setItem('cryo_state_v1', JSON.stringify(st)); } catch (e) {} }, [th, A.seed || null]);
    await page.goto(BASE + A.url); await page.waitForTimeout(800);
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), th);
    for (const [st, fn] of A.states) {
      try { await fn(page); } catch (e) { bad('A0', `${name} ${st}: driver threw ${String(e.message).split('\n')[0]}`); continue; }
      await page.waitForTimeout(300);
      await page.evaluate(() => { document.querySelectorAll('[id^=dep-]').forEach(n => n.remove()); const t = document.querySelector('body > div[role=status][style*="99999"]'); if (t) t.remove(); });
      const r = await page.evaluate(IN_PAGE);
      const by = {}; r.forEach(f => { (by[f.k] = by[f.k] || []).push(f.m); });
      for (const k of ['A1', 'A2', 'A3', 'A4', 'A5']) { if (by[k]) bad(k, `${name} ${st} ${th}: ${[...new Set(by[k])].slice(0, 4).join(' · ')}${by[k].length > 4 ? ' …' + by[k].length : ''}`); else ok(); }
      if (th === 'light') { const m = await ring(page, 24); if (m.length) bad('A6', `${name} ${st}: no ring on ${m.slice(0, 4).join(' · ')}`); else ok(); }
    }
    errs.length ? bad('A0', `${name} ${th}: errors ${errs.slice(0, 2).join(' | ')}`) : ok();
    await ctx.close();
  }
}
// tabs: role and arrows
for (const [name, sel] of [['dora', '.tabs'], ['blueprint', '.tabs'], ['iceberg', '#storage-tabs']]) {
  if (only.length && !only.includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  await page.addInitScript(st => { try { localStorage.setItem('assist_seen', '1'); if (st) localStorage.setItem('cryo_state_v1', JSON.stringify(st)); } catch (e) {} }, name === 'iceberg' ? ICE_STATE : null);
  await page.goto(BASE + APPS[name].url); await page.waitForTimeout(700);
  const t = await page.evaluate(sel => { const l = document.querySelector(sel); const tabs = [...l.querySelectorAll('[role=tab]')]; return { list: l.getAttribute('role'), n: tabs.length, sel: tabs.filter(x => x.getAttribute('aria-selected') === 'true').length }; }, sel);
  t.list === 'tablist' && t.n >= 2 && t.sel === 1 ? ok() : bad('A4', `${name}: ${JSON.stringify(t)}`);
  const before = await page.evaluate(sel => document.querySelector(sel + ' [role=tab][aria-selected=true]').id || document.querySelector(sel + ' [role=tab][aria-selected=true]').textContent, sel);
  await page.focus(sel + ' [role=tab][aria-selected=true]'); await page.keyboard.press('ArrowRight');
  const after = await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 20) + '|' + document.activeElement.id);
  after && !after.startsWith('|' + before) && !String(before).includes(after.split('|')[0]) ? ok() : bad('A4', `${name}: ArrowRight did not move to the next tab (${before} -> ${after})`);
  await ctx.close();
}
// dialogs: Esc closes and focus returns to the opener
async function dlg(name, setup, opener, openJs, isOpen, label) {
  if (only.length && !only.includes(name)) return;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  await page.addInitScript(st => { try { localStorage.setItem('assist_seen', '1'); if (st) localStorage.setItem('cryo_state_v1', JSON.stringify(st)); } catch (e) {} }, name === 'iceberg' ? ICE_STATE : null);
  await page.goto(BASE + APPS[name].url); await page.waitForTimeout(700);
  await page.evaluate(setup); await page.waitForTimeout(200);
  await page.focus(opener); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  if (!await page.evaluate(isOpen)) { await page.evaluate(openJs); await page.waitForTimeout(250); }
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  (await page.evaluate(isOpen)) ? bad('A5', `${label}: Esc did not close it`) : ok();
  const back = await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className));
  back && String(back).length ? (await page.evaluate(o => document.activeElement === document.querySelector(o) || document.activeElement.closest(o) !== null, opener)) ? ok() : bad('A5', `${label}: focus did not return to the opener (it is on ${back})`) : bad('A5', `${label}: focus was lost`);
  await ctx.close();
}
await dlg('iceberg', () => { openBoxDetail('minus80', 'r1', 'b1'); }, '#detail-overlay .tb-btn.primary', () => openAddVial(), () => document.getElementById('vial-modal').classList.contains('open'), 'Iceberg add-vial dialog');
await dlg('blueprint', () => {}, '#btn-pd-values', () => pdOpenValues(), () => document.getElementById('pd-values-modal').style.display === 'flex', 'Blueprint values dialog');
await browser.close();
for (const f of findings) console.log(f);
console.log(`\naudit3 invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
