// Cell Archive invariants — what the lines list shows must be whole, not cut by the column it is in.
//
//   A1  list facts whole    in the list (seven columns, a container wider than 880px) the medium and the doubling time of every line
//                           are drawn in full: nothing is line-clamped, and no text sits below the box it is drawn in. The doubling
//                           column was the narrowest in the row (88px) and cut "Very slow — ≥2 weeks to ~50%" at two lines while the
//                           stats column beside it was empty.
//   A2  narrow list         below that width the list is the two-line row layout and still shows both facts whole, with no page scroll
//
//   node tools/cellarchive_invariants.mjs [--file=apps/cell-archive/cell-archive.html]      exit 1 on any finding
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/cell-archive/cell-archive.html'));
const findings = []; let checks = 0;
const check = (id, name, ok, detail) => { checks++; if (!ok) findings.push(`✗ ${id} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
try {
  for (const theme of ['light', 'dark']) for (const w of [1440, 1180, 1024, 900, 880, 820, 600, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
    await p.goto('file://' + FILE); await p.waitForTimeout(700);
    await p.addStyleTag({ content: ':root{--sans:"DejaVu Sans",Verdana,sans-serif !important;--mono:"DejaVu Sans Mono",Menlo,monospace !important}' });   // a wide system font, as CI's DejaVu is: the medium needed three lines at 880px there and two on a Mac
    await p.evaluate(t => { document.documentElement.setAttribute('data-theme', t); const b = [...document.querySelectorAll('.ca-vt')].find(x => /list/i.test(x.textContent)); if (b) b.click(); }, theme);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const g = document.querySelector('.cell-grid.as-list'); if (!g) return { noList: true };
      // the line-clamp and an ancestor's overflow both cut: a fact is whole when its text needs no more height than the box has
      const cut = [...g.querySelectorAll('.cell-tile-med,.cell-tile-dt')].filter(e => e.offsetParent && e.scrollHeight > e.clientHeight + 1).map(e => e.className.replace('cell-tile-', '') + ' "' + e.textContent.slice(0, 32) + '" ' + e.clientWidth + 'px');
      return { cut: cut, n: g.querySelectorAll('.cell-tile-dt').length, wide: g.getBoundingClientRect().width > 880, sw: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    const tag = `${theme} ${w}px `;
    if (r.noList) { check('A1', tag + 'the list is there', false); await ctx.close(); continue; }
    check(r.wide ? 'A1' : 'A2', tag + 'the medium and the doubling time of every line are drawn whole', r.n > 0 && r.cut.length === 0, r.cut.slice(0, 3).join(' | '));
    check('A2', tag + 'the list does not scroll the page sideways', r.sw <= 1, r.sw + 'px');
    check('A2', tag + 'no console errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
} finally { await browser.close(); }
if (findings.length) { findings.forEach(x => console.log(x)); console.log(`\n${findings.length} finding(s) in ${checks} checks.`); process.exit(1); }
console.log(`Cell Archive invariants: ${checks} checks passed.`);
