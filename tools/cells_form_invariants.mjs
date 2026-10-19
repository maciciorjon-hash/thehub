// Cells form invariants — the dialogs of Incubator, Cell Archive and Iceberg are one dialect, and Labbook's New experiment is the model.
//
// Jon (2026-10-19): the edit menus of Cells looked old next to the rest of the app. They were three dialects: Incubator's form was an inline
// card with UPPERCASE mono labels and 8px-padded grey inputs, Cell Archive's was a modal with uppercase labels, Iceberg's a modal with 7px
// padding and a 4px radius, and the rows of the Incubator list were <button>s that kept the browser's 2px outset border on three sides.
//
//   F1  one control       every input / select of an open dialog is 36px high, --r-2, --surface, and takes the accent ring on focus
//   F2  one label         a label is --fs-2, 600, not uppercase; a group heading (when there is one) is --fs-2, 600
//   F3  one footer        the dialog keeps its footer in view with the primary button last, under a hairline; the whole sheet fits the window
//   F4  one sheet         radius --r-3, no backdrop-filter, and the three apps' controls agree with each other (same height, radius, weight)
//   F5  rows              an Incubator row is not a boxed button: no border on its top, left and right
//   F6  keeps what you typed   a store update while the Incubator form is open does not rebuild it; Escape closes it; the ask dialog is the same sheet
//
//   node tools/cells_form_invariants.mjs [--break]      exit 1 on any finding (--break puts the old Incubator row border back, to prove F5 can fail)
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BREAK = process.argv.includes('--break');
const findings = []; let checks = 0;
const check = (id, name, ok, detail) => { checks++; if (!ok) findings.push(`✗ ${id} ${name}${detail ? ' — ' + detail : ''}`); };

// what each app opens, and where its dialog, footer and heading live
const APPS = [
  { key: 'incubator', file: 'apps/incubator/incubator.html', dlg: '#cf-back .mdl', foot: '.mdl-act', gh: '.fg-h',
    open: `STORE.addCell({line:'HEK293',baseLine:'HEK293',passage:8,vessel:'T75',intervalDays:3,seeded:Date.now()-86400000,history:[]}); openCellForm('new');` },
  { key: 'cellarchive', file: 'apps/cell-archive/cell-archive.html', dlg: '#ca-modal-back .ca-modal', foot: '.ca-actions', gh: '.ca-fg-h',
    open: `openAddLine();` },
  { key: 'iceberg', file: 'apps/iceberg/iceberg.html', dlg: '#vial-modal .modal-card', foot: '.modal-foot', gh: null,
    open: `document.getElementById('vial-modal').classList.add('open');` },
];

const browser = await chromium.launch();
const sig = {};   // app -> what its controls look like, to compare the three
try {
  for (const A of APPS) for (const theme of ['light', 'dark']) for (const [w, h] of [[1280, 800], [760, 700], [390, 720]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
    await p.goto('file://' + path.join(ROOT, A.file)); await p.waitForTimeout(600);
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await p.evaluate(A.open);
    await p.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
    await p.waitForTimeout(250);
    const r = await p.evaluate(({ dlg, foot, gh }) => {
      const d = document.querySelector(dlg); if (!d) return { none: true };
      const probe = (css) => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;visibility:hidden;' + css; document.body.appendChild(e); const c = getComputedStyle(e); const o = { fs: c.fontSize, bg: c.backgroundColor, r: c.borderTopLeftRadius }; e.remove(); return o; };
      const fs2 = probe('font-size:var(--fs-2)').fs, accent = probe('background:var(--accent)').bg, surface = probe('background:var(--surface)').bg, r2 = probe('border-radius:var(--r-2)').r, r3 = probe('border-radius:var(--r-3)').r;
      const vis = e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
      const ctl = [...d.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select')].filter(vis);
      const bad = ctl.filter(e => { const c = getComputedStyle(e); return Math.round(e.getBoundingClientRect().height) !== 36 || c.borderTopLeftRadius !== r2 || c.backgroundColor !== surface; }).map(e => (e.id || e.name || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height) + '/' + getComputedStyle(e).borderTopLeftRadius);
      const first = ctl[0]; let ring = null;
      if (first) { first.focus(); const c = getComputedStyle(first); ring = { border: c.borderTopColor, shadow: c.boxShadow }; }
      const labs = [...d.querySelectorAll('label')].filter(vis).map(l => { const c = getComputedStyle(l); return { t: l.textContent.trim().slice(0, 18), up: c.textTransform, w: +c.fontWeight, fs: c.fontSize }; });
      const heads = gh ? [...d.querySelectorAll(gh)].map(l => { const c = getComputedStyle(l); return { w: +c.fontWeight, fs: c.fontSize }; }) : [];
      const f = d.querySelector(foot), btns = f ? [...f.querySelectorAll('button')].filter(b => vis(b) && b.offsetWidth) : [], last = btns[btns.length - 1];
      const fr = f && f.getBoundingClientRect(), dr = d.getBoundingClientRect(), dc = getComputedStyle(d);
      return { n: ctl.length, bad, ring, accent, labs, heads, fs2, nbtn: btns.length, lastBg: last ? getComputedStyle(last).backgroundColor : null,
        footTop: f ? getComputedStyle(f).borderTopWidth : null, fin: !!f && fr.top >= 0 && fr.bottom <= innerHeight + 1, fit: dr.top >= -1 && dr.bottom <= innerHeight + 1 && dr.left >= -1 && dr.right <= innerWidth + 1,
        r: dc.borderTopLeftRadius, r3, bf: dc.backdropFilter, h0: ctl[0] ? Math.round(ctl[0].getBoundingClientRect().height) : 0, lw: labs[0] ? labs[0].w : 0, ctlR: ctl[0] ? getComputedStyle(ctl[0]).borderTopLeftRadius : '' };
    }, { dlg: A.dlg, foot: A.foot, gh: A.gh });
    const tag = `${A.key} ${theme} ${w}px `;
    if (r.none) { check('F1', tag + 'the dialog opens', false); await ctx.close(); continue; }
    check('F1', tag + 'every control is 36px, --r-2, --surface', r.n > 0 && r.bad.length === 0, r.bad.slice(0, 3).join(' | '));
    check('F1', tag + 'focus draws the accent border and a ring', !!r.ring && r.ring.border === r.accent && r.ring.shadow !== 'none', JSON.stringify(r.ring));
    check('F2', tag + 'labels are --fs-2, 600, not uppercase', r.labs.length > 0 && r.labs.every(l => l.up === 'none' && l.w >= 600 && l.fs === r.fs2), r.labs.filter(l => !(l.up === 'none' && l.w >= 600 && l.fs === r.fs2)).slice(0, 3).map(l => `${l.t} ${l.up}/${l.w}/${l.fs}`).join(' | '));
    check('F2', tag + 'group headings are --fs-2 and 600', r.heads.every(l => l.w >= 600 && l.fs === r.fs2), JSON.stringify(r.heads.slice(0, 2)));
    check('F3', tag + 'the footer is in view, the primary last, a hairline above', r.fin && r.nbtn >= 2 && r.lastBg === r.accent && r.footTop === '1px', `fin=${r.fin} btns=${r.nbtn} last=${r.lastBg} top=${r.footTop}`);
    check('F3', tag + 'the sheet fits the window', r.fit);
    check('F4', tag + 'the sheet is --r-3 with no backdrop-filter', r.r === r.r3 && (r.bf === 'none' || r.bf === ''), `${r.r} vs ${r.r3}, ${r.bf}`);
    check('F4', tag + 'no console errors', errs.length === 0, errs.join(' | '));
    if (w === 1280 && theme === 'light') sig[A.key] = { h: r.h0, r: r.ctlR, w: r.lw };
    await ctx.close();
  }
  const ks = Object.keys(sig);
  check('F4', 'the three apps agree on control height, radius and label weight', ks.length === 3 && ks.every(k => JSON.stringify(sig[k]) === JSON.stringify(sig[ks[0]])), JSON.stringify(sig));

  // F5 + F6, Incubator only
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 760 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
    await p.goto('file://' + path.join(ROOT, 'apps/incubator/incubator.html')); await p.waitForTimeout(600);
    if (BREAK) await p.addStyleTag({ content: '.crow{border:2px outset #000!important}' });
    await p.evaluate(() => { ['HEK293', 'HCT116'].forEach((l, i) => STORE.addCell({ line: l, baseLine: l, passage: 5 + i, vessel: 'T75', intervalDays: 3, seeded: Date.now() - (i + 1) * 86400000, history: [] })); renderIncubator(); });
    await p.waitForTimeout(250);
    const row = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.crow')); return [c.borderTopWidth, c.borderLeftWidth, c.borderRightWidth, c.borderBottomWidth]; });
    check('F5', `${theme} an Incubator row has no border on its top, left and right`, row[0] === '0px' && row[1] === '0px' && row[2] === '0px' && row[3] === '1px', row.join(' '));
    await p.evaluate(() => openCellForm('new')); await p.waitForTimeout(250);
    await p.fill('#cf-vessel', 'T175'); await p.fill('#cf-notes', 'typed before a sync landed');
    await p.evaluate(() => { const id = Object.keys(STORE.get().incubator)[0]; STORE.updateCell(id, { notes: 'a sync' }); renderIncubator(); });
    await p.waitForTimeout(150);
    const kept = await p.evaluate(() => [document.getElementById('cf-vessel') && document.getElementById('cf-vessel').value, document.getElementById('cf-notes') && document.getElementById('cf-notes').value]);
    check('F6', `${theme} a store update does not empty the open form`, kept[0] === 'T175' && kept[1] === 'typed before a sync landed', JSON.stringify(kept));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check('F6', `${theme} Escape closes the form`, await p.evaluate(() => !document.getElementById('cf-back')));
    await p.evaluate(() => incAsk('Remove it?', 'This removes the culture.', { ok: 'Remove', danger: true }, () => {})); await p.waitForTimeout(150);
    const ask = await p.evaluate(() => { const d = document.querySelector('#inc-ask .mdl'); const b = [...document.querySelectorAll('#inc-ask button')].filter(x => x.offsetWidth); return { sheet: !!d, hs: b.map(x => Math.round(x.getBoundingClientRect().height)), last: b[b.length - 1] && b[b.length - 1].textContent }; });
    check('F6', `${theme} the ask is the same sheet, its buttons 36px, the answer last`, ask.sheet && ask.hs.length === 2 && ask.hs.every(x => x === 36) && ask.last === 'Remove', JSON.stringify(ask));
    check('F6', `${theme} no console errors`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
} finally { await browser.close(); }
if (findings.length) { console.log(findings.join('\n')); console.log(`\n${findings.length} of ${checks} checks failed.`); process.exit(1); }
console.log(`Cells form invariants: ${checks} checks passed.`);
