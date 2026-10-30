// The frame the data-analysis apps share (docs/UI.md › Data apps; docs/DATA_APPS_STUDY_2026-10-30.md, Phase 3). Measured in a browser at 1440 × 900, light,
// with each app's example loaded, so a stylesheet cannot say one thing and the screen another.
//   node tools/data_apps_frame_invariants.mjs
//
// F1  every tab bar is 40 px tall, 13 px type, 500 → 600 when active; the first tab's label sits on the page gutter (28 px at this width)
// F2  a card is one thing: --r-3 corners, --shadow-xs, the page gutter at its left
// F3  no text on the page is off the type scale (10 11 12 13 15 17 20 26 38 px); superscripts and drawn SVG text are the two exemptions
// F5  the main results table of each app is a ResultsKit table: 11 px headers in sentence case (never uppercase), cells at its density's size in the sans face, numbers aligned on the right,
//     and — where an app reports an interval — the order potency · 95% CI · … · Hill · R² (Echo, Lumina, Beacon)
// F6  the tabs: the same order in every app, an icon on each, Guide last (Echo groups what was run under Run)
// F4  the retired accent #5e87c5 draws nothing of these apps' own (Echo keeps it as the colour of the Displacement assay, a category, not the accent)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { const m = '✗ ' + name + (detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''); findings.push(m); console.log('  ' + m); } };

const EBOOT = `[...document.querySelectorAll('.outer-tab')].find(b=>/Analysis/.test(b.textContent))?.click(); document.getElementById('setup-modal')?.classList.add('hidden'); loadTestData(); await new Promise(r=>setTimeout(r,300)); runPipeline(); await new Promise(r=>setTimeout(r,3000));`;
const eTab = t => `document.querySelector('.tab[data-tab="${t}"]').click()`;
const APPS = {
  echo: { gutter: 20, boot: EBOOT, tabs: ['results', 'curves', 'scatter', 'graph', 'plate', 'props', 'log', 'protocol', 'survey', 'history', 'guide'].map(eTab) },
  lumina: { boot: `loadLuminaTestData(); switchTab('results')`, tabs: [`switchTab('input')`, `switchTab('results')`, `switchTab('graph')`, `switchTab('history')`, `switchTab('guide')`] },
  beacon: { boot: `loadTestData(); switchTab('results')`, tabs: [`switchTab('plate')`, `switchTab('results')`, `switchTab('graph')`, `switchTab('history')`, `switchTab('guide')`] },
  tempo: { boot: `await tpLoadExample('degradation'); tpTab('results')`, tabs: [`tpTab('plate')`, `tpTab('curves')`, `tpTab('results')`, `tpTab('compare')`, `tpTab('history')`] },
  hitfinder: { boot: `loadHitFinderTestData(); hfTab('hits')`, tabs: [`hfTab('screens')`, `hfTab('criteria')`, `hfTab('hits')`, `hfTab('plots')`, `hfTab('guide')`] },
  dora: { boot: `loadTestData(); switchTab('table')`, tabs: [`switchTab('load')`, `switchTab('table')`, `switchTab('scatter')`, `switchTab('props')`, `switchTab('guide')`] },
  bca: { boot: `loadTestData()`, tabs: [`switchTab('standards')`, `switchTab('history')`, `switchTab('guide')`] },
};
// F6  the order of the tabs: Data first, Results before Curves, History then Guide last — what each app has, in the one order (Echo's Run groups Console, Protocol and Source Plate)
const ORDER = {
  echo: ['Results', 'Curves', 'Plots', 'Graph', 'Plate', 'Properties', 'Run', 'History', 'Guide'],
  lumina: ['Plate', 'Results', 'Graph', 'History', 'Guide'],
  beacon: ['Plate', 'Results', 'Graph', 'History', 'Guide'],
  tempo: ['Plate', 'Results', 'Curves', 'Compare', 'Graph', 'History', 'Guide'],
  hitfinder: ['Screens', 'Criteria', 'Hits', 'Sensitivity', 'Plots', 'Graph', 'Health', 'Chemistry', 'Export', 'Guide'],
  dora: ['Data', 'Results', 'Compare', 'Graph', 'Properties', 'Guide'],
  bca: ['Workflow', 'Graph', 'History', 'Guide'],
};
const SCALE = [10, 11, 12, 13, 15, 17, 20, 26, 38];

const browser = await chromium.launch();
for (const [id, A] of Object.entries(APPS)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.route(/^https?:/, r => r.abort());
  await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForTimeout(900);
  await pg.evaluate(`(async()=>{ document.getElementById('dep-stack')?.remove(); ${A.boot} })()`); await pg.waitForTimeout(1200);
  const frame = await pg.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const bar = [...document.querySelectorAll('.tabs,.tabbar')].find(vis), tabs = [...bar.querySelectorAll('.tab,.tabgrp,[role=tab]')].filter(vis), first = tabs[0], act = tabs.find(t => t.classList.contains('active') || t.getAttribute('aria-selected') === 'true');
    const cs = e => getComputedStyle(e), pad = parseFloat(cs(first).paddingLeft);
    const card = [...document.querySelectorAll('.card,.rs-card')].find(e => vis(e) && !e.closest('[hidden]'));
    return { barH: bar.getBoundingClientRect().height, tabH: tabs.map(t => Math.round(t.getBoundingClientRect().height)), fs: [...new Set(tabs.map(t => cs(t).fontSize))], w: cs(tabs.find(t => t !== act) || first).fontWeight, wAct: act ? cs(act).fontWeight : null,
      label: first.getBoundingClientRect().left + pad, card: card ? { x: card.getBoundingClientRect().left, r: cs(card).borderRadius, sh: cs(card).boxShadow } : null };
  });
  check(`F1 ${id}: the tab bar is 40 px with 13 px tabs, 500 → 600 when active`, frame.barH >= 40 && frame.barH <= 41.5 && frame.tabH.every(h => h === 40) && frame.fs.join() === '13px' && frame.w === '500' && (frame.wAct === '600' || frame.wAct === null), frame);
  check(`F1 ${id}: the first tab's label sits on the page gutter (${A.gutter || 28} px)`, Math.abs(frame.label - (A.gutter || 28)) <= 1, frame.label);
  if (frame.card && !A.gutter) { check(`F2 ${id}: a card is --r-3 (9 px) with --shadow-xs, on the gutter`, frame.card.r === '9px' && /rgba\(0, 0, 0, 0\.04\) 0px 1px 4px/.test(frame.card.sh) && Math.abs(frame.card.x - 28) <= 1, frame.card); }
  const labels = await pg.evaluate(() => { const bar = [...document.querySelectorAll('.tabs,.tabbar')].find(e => e.getBoundingClientRect().width > 1); return [...bar.querySelectorAll('.tab,.tabgrp,[role=tab]')].filter(t => { const r = t.getBoundingClientRect(); return r.width > 1 && r.height > 1; }).map(t => t.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\d+$/, '').trim().replace(/^Run · .*/, 'Run')); });
  check(`F6 ${id}: the tabs, in the order the data apps share`, JSON.stringify(labels) === JSON.stringify(ORDER[id]), labels);
  check(`F6 ${id}: every tab has an icon`, await pg.evaluate(() => { const bar = [...document.querySelectorAll('.tabs,.tabbar')].find(e => e.getBoundingClientRect().width > 1); return [...bar.querySelectorAll('.tab,.tabgrp,[role=tab]')].filter(t => t.getBoundingClientRect().width > 1).every(t => t.querySelector('svg')); }));
  const odd = [];
  for (const go of A.tabs) {
    await pg.evaluate(`(async()=>{ ${go} })()`); await pg.waitForTimeout(600); await pg.evaluate(() => document.getElementById('dep-stack')?.remove());
    odd.push(...await pg.evaluate(S => { const o = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const e = n.parentElement; if (!n.nodeValue.trim() || e.closest('svg,script,style,sup,sub') || n.nodeValue.trim() === '×') continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none') continue; const fs = parseFloat(s.fontSize); if (!S.includes(fs)) o.push(fs + 'px ' + e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 20) + ' "' + n.nodeValue.trim().slice(0, 24) + '"'); } return o; }, SCALE));
  }
  check(`F3 ${id}: every text on every tab is on the type scale`, odd.length === 0, [...new Set(odd)].slice(0, 6));
  check(`F? ${id}: no script error`, errs.length === 0, errs.join(' | '));
  await ctx.close();
}
for (const id of ['lumina', 'beacon', 'tempo', 'hitfinder', 'dora', 'bca']) {
  const src = fs.readFileSync(path.join(ROOT, `apps/${id}/${id}.html`), 'utf8');
  check(`F4 ${id}: the retired accent #5e87c5 is not in the file`, !/#5e87c5/i.test(src), (src.match(/#5e87c5/gi) || []).length + ' left');
}
{
  const src = fs.readFileSync(path.join(ROOT, 'apps/echo/echo.html'), 'utf8');
  const bad = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /#5e87c5/i.test(l) && !/displacement|_assayColors|CV_PALETTE|'#e36c69','#5e87c5'/i.test(l));
  check('F4 echo: #5e87c5 only as the Displacement assay\'s colour or in the curve palette', bad.length === 0, bad.map(([n]) => n));
}

/* ───── F5: the results table ───── */
const RES = {
  echo: { boot: `[...document.querySelectorAll('.outer-tab')].find(b=>/Analysis/.test(b.textContent))?.click(); document.getElementById('setup-modal')?.classList.add('hidden'); loadTestData(); await new Promise(r=>setTimeout(r,300)); runPipeline(); await new Promise(r=>setTimeout(r,3000));`, density: 'compact', fs: '11px', order: true },
  lumina: { boot: `loadLuminaTestData(); switchTab('results')`, density: 'standard', fs: '12px', order: true },
  beacon: { boot: `loadTestData(); switchTab('results')`, density: 'standard', fs: '12px', order: true },
  tempo: { boot: `await tpLoadExample('degradation'); tpTab('results')`, density: 'roomy', fs: '13px' },
  dora: { boot: `loadTestData(); switchTab('table')`, density: 'standard', fs: '12px' },
};
for (const [id, R] of Object.entries(RES)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await ctx.newPage(); await pg.route(/^https?:/, r => r.abort());
  await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForTimeout(900);
  await pg.evaluate(`(async()=>{ document.getElementById('dep-stack')?.remove(); ${R.boot} })()`); await pg.waitForTimeout(1200);
  const t = await pg.evaluate(() => {
    const tb = document.querySelector('table.rk'); if (!tb) return null; const cs = e => getComputedStyle(e);
    const heads = [...tb.querySelectorAll('thead tr:last-child th')].map(h => h.textContent.replace(/\s+/g, ' ').trim());
    const nums = [...tb.querySelectorAll('tbody td.num')].slice(0, 40), inner = [...tb.querySelectorAll('tbody td.num, tbody td.num *')].slice(0, 80);
    return { density: tb.dataset.density, th: [...new Set([...tb.querySelectorAll('th')].map(h => cs(h).fontSize + '/' + cs(h).fontWeight + '/' + cs(h).textTransform))], tdFs: [...new Set([...tb.querySelectorAll('tbody td')].map(d => cs(d).fontSize))], align: [...new Set(nums.map(n => cs(n).textAlign))], mono: inner.some(n => /Mono/.test(cs(n).fontFamily)), heads };
  });
  check(`F5 ${id}: the results table is a ResultsKit table at ${R.density} density`, !!t && t.density === R.density, t && t.density);
  if (!t) { await ctx.close(); continue; }
  check(`F5 ${id}: headers are 11 px / 600 in sentence case`, t.th.length === 1 && t.th[0] === '11px/600/none', t.th);
  check(`F5 ${id}: cells are ${R.fs} (the one size of the ${R.density} density) except marks the app sets smaller`, t.tdFs.includes(R.fs), t.tdFs);
  check(`F5 ${id}: numbers are right-aligned and in the sans face`, (t.align.length === 0 || (t.align.length === 1 && t.align[0] === 'right')) && !t.mono, { align: t.align, mono: t.mono });
  if (R.order) { const at = re => t.heads.findIndex(h => re.test(h)), a = at(/^(DC50|IC50|EC50)/), c = at(/95% CI/), h = at(/^Hill/), r2 = at(/^R²/);
    check(`F5 ${id}: potency · 95% CI · … · Hill · R²`, a >= 0 && c === a + 1 && h > c && r2 > h, t.heads); }
  await ctx.close();
}

await browser.close();
console.log(findings.length ? `\n${findings.length} frame invariants failed (${passed} held)` : `\nAll ${passed} frame invariants hold.`);
process.exit(findings.length ? 1 : 0);
