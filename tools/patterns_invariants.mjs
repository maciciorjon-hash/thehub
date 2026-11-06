// Echo Patterns invariants — what the compounds that behave alike have in common (tools/patternkit/pattern.js, Plate › Patterns).
// Same rule as the other invariant files: each check is a CLASS of mistake, and was proven by putting the mistake back.
//
//   P1 names are read like a chemist   "projectX_A1" is a source position, "GX-012" is a family, "GX12" is not a well; case and zeros do not matter.
//   P2 the statistics are exact        Fisher, Mann-Whitney (ties) and Benjamini-Hochberg equal an independent implementation / exact enumeration.
//   P3 a planted pattern is found      A source column, a family and an assay row, each planted in a noisy plate, come back with their members and the
//                                      right side — and nothing else is reported.
//   P4 chance is not a pattern         Random plates produce a strong finding in at most a few per cent of runs (the correction is for every group).
//   P5 the DMSO decides                A pattern on one assay row is the plate when the DMSO wells there read off, and is not when they read clean; a
//                                      source pattern that shares an assay row is "cannot separate" with no DMSO there, "source" with clean DMSO.
//   P6 missing is not zero             A curve with no hook test or no potency is left out of that test, never counted as "no hook" / potency 0.
//   P7 small is not a finding          A group under the minimum is never reported, and a group that is the whole scope is never compared with nothing.
//   P8 one finding, one list           The same compounds found through two factors are one finding (listing the other).
//   P9 the page answers                Plate › Patterns draws on a real run: cards for a planted family, the chemistry-plate map, chips that jump to the
//                                      plate maps, a copy that carries every finding, and an honest "no pattern" for a clean plate.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const out = [], counts = {};
function check(inv, name, ok, detail) { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) }); }

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(ROOT, args.kit || 'tools/patternkit/pattern.js'), 'utf8') + ';this.PK=PatternKit', ctx);
const PK = ctx.PK;
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const close = (a, b, tol = 1e-5) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const L = 'ABCDEFGH';
// one chemistry plate of 96, named like a chem plate, dosed so the assay position does not follow the source one
function plate96(opt = {}) {
  const items = [];
  for (let r = 0; r < 8; r++) for (let c = 1; c <= 12; c++) {
    const i = r * 12 + c - 1, id = (opt.project || 'projectX') + '_' + L[r] + c;
    const base = { id, hook: rnd() < (opt.base ?? 0.06), nd: false, dmax: 60 + 20 * (rnd() - 0.5), pdc50: 7 + rnd(), plate: 'P' + (1 + Math.floor(rnd() * 3)), dRow: L[Math.floor(rnd() * 8)], dCol: 1 + Math.floor(rnd() * 12) };
    items.push(opt.mod ? Object.assign(base, opt.mod(base, r, c, i)) : base);
  }
  return items;
}
const findings = (items, o) => PK.find(items, o || {}).findings;

if (run('P1')) {
  const n = PK.parseName;
  check('P1', 'projectX_A1', JSON.stringify(n('projectX_A1')) === JSON.stringify({ family: 'projectX', project: 'projectX', row: 'A', col: 1 }), n('projectX_A1'));
  check('P1', 'zeros and case: projectX_b07', n('projectX_b07').row === 'B' && n('projectX_b07').col === 7, n('projectX_b07'));
  check('P1', 'GX-012 is a family, not a well', n('GX-012').project === null && n('GX-012').family === 'GX', n('GX-012'));
  check('P1', 'GX12 is not a well (no separator)', n('GX12').project === null, n('GX12'));
  check('P1', 'CDK12 and BRD4 are gene names, not wells (CDK12 is not project CD, well K12)', n('CDK12').project === null && n('BRD4').project === null && n('BRD4').family === 'BRD', [n('CDK12'), n('BRD4')]);
  check('P1', 'a column of 0 is not a well', n('projectX_A0').project === null, n('projectX_A0'));
  check('P1', 'a 384 name beyond a 96 plate is still read, the plate is 384', (() => { const p = PK.prepare([...plate96().slice(0, 40), { id: 'projectX_P24' }], {}); return p.formats.projectX.nR === 16; })());
  check('P1', 'few parsed names are noise: 1 of 10 is not a source position', (() => { const it = Array.from({ length: 10 }, (_, i) => ({ id: i ? 'Cpd-' + i : 'X_A1' })); return PK.prepare(it, {}).cs.every(c => !c.src); })());
}

if (run('P2')) {
  // reference values from an independent implementation (python: math.comb enumeration; the asymptotic Mann-Whitney written out)
  check('P2', 'Fisher 7/9 vs 2/80', close(PK.fisher(7, 9, 9, 89), 1.801071230964056e-07, 1e-6), PK.fisher(7, 9, 9, 89));
  check('P2', 'Fisher [[3,1],[1,3]] = 0.4857', close(PK.fisher(3, 4, 4, 8), 0.4857142857142857), PK.fisher(3, 4, 4, 8));
  check('P2', 'Fisher 0 of 9 (fewer) is two-sided', close(PK.fisher(0, 9, 9, 89), 0.5895584656350825), PK.fisher(0, 9, 9, 89));
  const g = [5, 6, 7, 8, 9, 12, 3], r = [1, 2, 3, 4, 5.5, 6, 4, 2, 8];
  check('P2', 'Mann-Whitney p', close(PK.mannWhitney(g, r).p, 0.038290666254740084, 1e-5), PK.mannWhitney(g, r).p);
  check('P2', 'Mann-Whitney with ties', close(PK.mannWhitney([1, 1, 2, 2, 3], [1, 2, 2, 3, 3, 4, 4]).p, 0.17874524945630035, 1e-5), PK.mannWhitney([1, 1, 2, 2, 3], [1, 2, 2, 3, 3, 4, 4]).p);
  check('P2', 'rank-biserial sign: a higher group is positive', PK.mannWhitney([9, 10, 11], [1, 2, 3, 4]).rb > 0.9 && PK.mannWhitney([1, 2], [8, 9, 10]).rb < -0.9);
  const q = PK.bh([0.01, 0.04, 0.03, 0.2, 0.0004, 0.5]);
  check('P2', 'Benjamini-Hochberg', [0.03, 0.06, 0.06, 0.24, 0.0024, 0.5].every((v, i) => close(q[i], v)), q);
  check('P2', 'q is never below p and never above 1', [0.5, 0.9, 1, 0.001].every((p, i) => PK.bh([0.5, 0.9, 1, 0.001])[i] >= p && PK.bh([0.5, 0.9, 1, 0.001])[i] <= 1));
}

if (run('P3')) {
  seed = 7;
  const col = findings(plate96({ mod: (_b, _r, c) => c === 3 ? { hook: true } : {} })).filter(f => f.trait === 'hook');
  const f = col.find(x => x.factor === 'srcCol');
  check('P3', 'a hook in source column 3 is found as a source pattern', f && f.side === 'source' && f.level === 'projectX|c3' && f.k === 8 && f.n === 8, col.map(x => [x.factor, x.level, x.q]));
  check('P3', 'its members are the eight compounds of the column, in natural order', f && f.members.join() === ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => 'projectX_' + l + '3').join(), f && f.members);
  check('P3', 'the pattern is strong, the others are not made up', f && f.strong && col.filter(x => x.factor !== 'srcCol' && x.factor !== 'project').length === 0, col.map(x => [x.factor, x.level]));
  check('P3', 'spread over the assay plate, it says source', f && f.verdict === 'source', f && f.verdict);
  seed = 8;
  const fam = [];
  for (let i = 1; i <= 30; i++) fam.push({ id: 'GX-' + String(i).padStart(3, '0'), hook: true, nd: false, dmax: 70, pdc50: 8 });
  for (let i = 1; i <= 60; i++) fam.push({ id: 'AB-' + String(i).padStart(3, '0'), hook: rnd() < 0.05, nd: false, dmax: 70, pdc50: 8 });
  const ff = findings(fam).find(x => x.trait === 'hook' && x.factor === 'family');
  check('P3', 'a hook in the GX family is found by name, with no source position', ff && ff.label === 'GX compounds' && ff.k === 30 && ff.side === 'name' && ff.verdict === 'compound', ff && [ff.label, ff.k, ff.verdict]);
  seed = 9;
  const dm = findings(plate96({ mod: (_b, r) => r < 4 ? { dmax: 85 + 10 * (rnd() - 0.5) } : { dmax: 35 + 10 * (rnd() - 0.5) } })).filter(x => x.trait === 'dmax');
  check('P3', 'Dmax high in rows A-D, low in E-H: one finding for the split (the halves are mirror images), never a single row', dm.length === 1 && dm[0].factor === 'srcHalfR' && /rows (A–D|E–H)/.test(dm[0].label), dm.map(x => [x.label, x.dir]));
  check('P3', 'and says the median in the group and elsewhere', dm[0] && Math.abs(dm[0].med - dm[0].restMed) > 40, dm[0] && [dm[0].med, dm[0].restMed]);
  seed = 10;
  const rowC = findings(plate96({ mod: b => b.dRow === 'C' ? { hook: true } : {} }), { dmso: [] }).find(x => x.trait === 'hook' && x.factor === 'dRow');
  check('P3', 'a hook on one assay row is found as an assay-plate pattern', rowC && rowC.side === 'destination' && rowC.level === 'C', rowC && [rowC.label, rowC.q]);
}

if (run('P3')) {
  seed = 11;
  const half = findings(plate96({ mod: (_b, _r, c) => c <= 6 ? { hook: true } : {} })).filter(x => x.trait === 'hook');
  const h = half.find(x => x.factor === 'srcHalfC');
  check('P3', 'a hook in the left half of the chemistry plate is found as ONE finding for the half', h && h.k === 48 && h.n === 48 && /left half \(columns 1–6\)/.test(h.label), half.map(x => [x.factor, x.level]));
  check('P3', 'and the single columns inside it are not listed as findings of their own', half.every(x => x.factor !== 'srcCol'), half.map(x => [x.factor, x.level]));
  seed = 13;
  const dh = findings(plate96({ mod: b => ({ dHalfC: b.dCol <= 6 ? 'L' : 'R', hook: b.dCol <= 6 }) })).find(x => x.trait === 'hook' && x.factor === 'dHalfC');
  check('P3', 'a hook in the left half of the assay plate is found on the assay side', dh && dh.side === 'destination' && dh.level === 'L', dh && [dh.label]);
}

if (run('P4')) {
  let any = 0, total = 40;
  for (let s = 0; s < total; s++) { seed = 1000 + s; if (findings(plate96({ base: 0.15 })).some(f => f.strong)) any++; }
  check('P4', 'no planted pattern: a strong finding in at most 3 of 40 random plates', any <= 3, { any, total });
  let sug = 0; for (let s = 0; s < total; s++) { seed = 2000 + s; if (findings(plate96({ base: 0.15 })).length) sug++; }
  check('P4', 'including suggestive ones, at most 10 of 40', sug <= 10, { sug, total });
  seed = 55; const R = PK.find(plate96({ base: 0.15 }));
  check('P4', 'every group compared is counted in the correction', R.tests >= 20, R.tests);
}

if (run('P5')) {
  const hookC = b => b.dRow === 'C' ? { hook: true } : {};
  const mkDmso = (devC) => { const d = []; for (const plate of ['P1', 'P2', 'P3']) for (let r = 0; r < 8; r++) for (let c = 1; c <= 12; c += 3) d.push({ plate, row: L[r], col: c, dev: (r === 2 ? devC : 0) + (rnd() - 0.5) * 2 }); return d; };
  seed = 21;
  const items = plate96({ mod: hookC });
  const off = findings(items, { dmso: mkDmso(-18) }).find(x => x.factor === 'dRow' && x.trait === 'hook');
  check('P5', 'row C: DMSO wells 18 % low there -> the plate', off && off.verdict === 'destination' && off.dmso.state === 'off', off && [off.verdict, off.dmso]);
  const clean = findings(items, { dmso: mkDmso(0) }).find(x => x.factor === 'dRow' && x.trait === 'hook');
  check('P5', 'row C: DMSO clean there -> not the plate', clean && clean.verdict !== 'destination' && clean.dmso.state === 'clean', clean && [clean.verdict, clean.dmso]);
  const none = findings(items, { dmso: [] }).find(x => x.factor === 'dRow' && x.trait === 'hook');
  check('P5', 'no DMSO wells -> unclear, never a verdict', none && none.verdict === 'unclear' && none.dmso.state === 'unknown', none && [none.verdict, none.dmso]);
  // a source column whose compounds were all dosed on one assay row: the two cannot be separated without DMSO
  seed = 22;
  const confounded = plate96({ mod: (_b, _r, c) => c === 3 ? { hook: true, dRow: 'C', plate: 'P1' } : {} });
  const f0 = findings(confounded, { dmso: [] }).find(x => x.factor === 'srcCol' && x.trait === 'hook');
  check('P5', 'source column dosed on one assay row, no DMSO -> cannot separate', f0 && f0.verdict === 'ambiguous' && f0.coincides && f0.coincides.factor !== undefined, f0 && [f0.verdict, f0.coincides]);
  const f1 = findings(confounded, { dmso: mkDmso(0) }).find(x => x.factor === 'srcCol' && x.trait === 'hook');
  check('P5', 'the same, DMSO clean on that row -> source', f1 && f1.verdict === 'source', f1 && [f1.verdict, f1.dmso]);
  const f2 = findings(confounded, { dmso: mkDmso(-18) }).find(x => x.factor === 'srcCol' && x.trait === 'hook');
  check('P5', 'the same, DMSO off on that row -> cannot separate (it may be the plate)', f2 && f2.verdict === 'ambiguous' && f2.dmso.state === 'off', f2 && [f2.verdict, f2.dmso]);
  seed = 23;
  const mixed = plate96({ mod: (_b, r, c) => c === 3 ? { hook: true, plate: 'P1', dRow: r < 6 ? 'C' : L[(r * 3) % 8] } : {} });
  const f3 = findings(mixed, { dmso: mkDmso(-18) }).find(x => x.factor === 'srcCol' && x.trait === 'hook');
  check('P5', 'a group on one plate AND mostly on one row: the row whose DMSO is off decides, not the plate that is more shared', f3 && f3.dmso && f3.dmso.state === 'off' && f3.verdict === 'ambiguous', f3 && [f3.verdict, f3.dmso, f3.coincides && f3.coincides.label]);
  check('P5', 'one DMSO well is not evidence', PK.dmsoAt([{ plate: 'P1', row: 'C', col: 1, dev: -40 }], 'dRow', 'C', {}).state === 'unknown');
}

if (run('P6')) {
  seed = 31;
  const items = plate96({ mod: (_b, _r, c) => c === 3 ? { hook: null, pdc50: null } : {} });
  const f = findings(items).find(x => x.trait === 'hook' && x.factor === 'srcCol' && x.level === 'projectX|c3');
  check('P6', 'a column with no hook test is not "no hook"', !f, f && [f.n, f.k]);
  const fp = findings(plate96({ mod: (_b, _r, c) => c === 3 ? { pdc50: null } : { pdc50: 8 } })).find(x => x.trait === 'pdc50' && x.level === 'projectX|c3');
  check('P6', 'a missing potency is left out, not read as potency 0', !fp, fp && [fp.n, fp.med]);
  const part = findings(plate96({ base: 0, mod: (_b, r, c) => r === 0 ? (c <= 8 ? { hook: true } : { hook: null }) : { hook: false } })).find(x => x.trait === 'hook' && x.level === 'projectX|rA');
  check('P6', 'a row of 12 where 4 have no hook test is 8 curves tested, 8 with a hook', part && part.n === 8 && part.k === 8, part && [part.n, part.k]);
  const it = plate96({ mod: (_b, _r, c) => c <= 2 ? { hook: null } : {} }), R = PK.find(it);
  check('P6', 'counts in a finding are of curves that were tested', R.n === 96, R.n);
}

if (run('P7')) {
  seed = 41;
  const mk = (n, f) => Array.from({ length: n }, (_, i) => Object.assign({ id: 'AB-' + (i + 1), hook: false, nd: false, dmax: 50 + (i % 5), pdc50: 7 }, f(i)));
  const two = [...mk(60, () => ({})), { id: 'ZZ-1', hook: true, nd: false, dmax: 99, pdc50: 9 }, { id: 'ZZ-2', hook: true, nd: false, dmax: 99, pdc50: 9 }];
  check('P7', 'a family of two compounds, both with a hook, is not reported', !findings(two).some(f => /ZZ/.test(f.label)), findings(two).map(f => f.label));
  const three = [...mk(60, () => ({})), ...['ZZ-1', 'ZZ-2', 'ZZ-3', 'ZZ-4'].map(id => ({ id, hook: true, nd: false, dmax: 99, pdc50: 9 }))];
  check('P7', 'four of the same kind are', findings(three).some(f => f.label === 'ZZ compounds' && f.trait === 'hook'), findings(three).map(f => f.label));
  const everyone = mk(30, i => ({ hook: i % 3 === 0 }));
  check('P7', 'a family that is every compound is never compared with nothing', findings(everyone).every(f => f.rest >= 3), findings(everyone).map(f => [f.label, f.rest]));
  check('P7', 'no finding is about fewer than 3 compounds', findings(three).every(f => f.n >= 3));
  check('P7', 'three curves give nothing to test', findings([{ id: 'A-1', hook: true }, { id: 'A-2', hook: true }, { id: 'A-3', hook: true }]).length === 0);
  check('P7', 'depletion is not a pattern by default (a family with FEWER hooks is not listed)', !findings([...mk(40, i => ({ hook: i < 20 })), ...['ZZ-1', 'ZZ-2', 'ZZ-3', 'ZZ-4', 'ZZ-5'].map(id => ({ id, hook: false, nd: false, dmax: 50, pdc50: 7 }))]).some(f => f.label === 'ZZ compounds' && f.trait === 'hook'));
}

if (run('P8')) {
  seed = 51;
  const proj = (name, hook) => plate96({ project: name, base: 0.04, mod: () => ({ hook: hook ? true : false }) });
  const items = [...proj('projectX', true), ...proj('projectY', false)];
  const hooks = findings(items).filter(f => f.trait === 'hook');
  const sigs = hooks.map(f => f.groupIds.slice().sort().join());
  check('P8', 'the same compounds are listed once whatever factor found them', new Set(sigs).size === sigs.length, sigs.map(s => s.length));
  const px = hooks.find(f => f.groupIds.length === 96 && f.groupIds[0].startsWith('projectX'));
  check('P8', 'and the finding names the other factors that gave the same group', px && px.also.length >= 1, px && [px.label, px.also]);
  seed = 52;
  const rowA = findings(plate96({ base: 0, mod: (_b, r) => ({ hook: r === 0 }) })).filter(f => f.trait === 'hook');
  check('P8', 'hooks only in row A: the edge wells that carry the same hooks are not a second finding', rowA.length === 1 && rowA[0].factor === 'srcRow', rowA.map(f => [f.factor, f.level, f.q]));
  check('P8', 'the sentence gives the DMSO numbers it relied on', (() => { const f = findings(plate96({ mod: b => b.dRow === 'C' ? { hook: true } : {} }), { dmso: Array.from({ length: 40 }, (_, i) => ({ plate: 'P1', row: L[i % 8], col: 1 + i % 12, dev: 0 })) }).find(x => x.factor === 'dRow'); return f && /\d+ wells, [+-]?\d/.test(f.why); })());
  seed = 53;
  const mir = findings(plate96({ mod: (_b, r) => r < 4 ? { dmax: 90 + 4 * (rnd() - 0.5) } : { dmax: 30 + 4 * (rnd() - 0.5) } })).filter(f => f.trait === 'dmax' && f.factor === 'srcHalfR');
  check('P8', 'top half higher and bottom half lower is ONE finding, not two mirror images', mir.length === 1, mir.map(f => [f.label, f.dir]));
  check('P8', 'the survivor is the clearer side and says so in numbers', mir.length === 1 && mir[0].restMed != null && Math.abs(mir[0].med - mir[0].restMed) > 40, mir.map(f => [f.med, f.restMed]));
  check('P8', 'every member of a "more" finding really has the trait', hooks.every(f => f.members.every(id => items.find(c => c.id === id).hook === true)));
}

if (run('P9')) {
  const browser = await chromium.launch();
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await c.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e && e.message || e)));
  const E = (f, a) => pg.evaluate(f, a);
  try {
    await pg.goto('file://' + path.join(ROOT, 'apps/echo/echo.html')); await pg.waitForTimeout(1500);
    await E(() => { document.documentElement.setAttribute('data-theme', 'light'); loadTestData(); }); await pg.waitForTimeout(800);
    await E(() => runPipeline());
    await pg.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
    await pg.waitForTimeout(800);
    // 1. the real run, with real names: the view opens, says what it checked, never throws
    await E(() => document.querySelector('.tab[data-tab="plate"]').click()); await pg.waitForTimeout(300);
    const real = await E(() => { plateSetView('patterns'); const p = document.querySelector('.pt-page'); return { has: !!p, text: p ? p.innerText.slice(0, 400) : '', cards: document.querySelectorAll('.pt-card').length, none: !!document.querySelector('.pt-none') }; });
    check('P9', 'Plate › Patterns opens on a real run and says what it checked', real.has && /curves/.test(real.text) && /compared|DMSO|names/.test(real.text), real);
    // 2. rename the real compounds like a chemistry plate and plant a hook in one column, in the results AND in the plate data
    const planted = await E(() => {
      const gr = {}; _lastResultsData.forEach(r => { (gr[r.Protein] = gr[r.Protein] || []).push(r); });
      const top = Object.keys(gr).sort((a, b) => gr[b].length - gr[a].length)[0], ids = [...new Set(gr[top].map(r => r.Sample_ID))];
      const map = {}; ids.forEach((id, i) => { map[id] = 'projectX_' + 'ABC'[Math.floor(i / 7)] + (i % 7 + 1); });
      _lastResultsData.forEach(r => { if (map[r.Sample_ID]) { r._origId = r.Sample_ID; r.Sample_ID = map[r.Sample_ID]; } });
      Object.values(window._plateData).forEach(w => Object.values(w).forEach(x => { if (x.s && map[x.s]) x.s = map[x.s]; }));
      // a hook in source row A (7 of 21 compounds), none elsewhere
      _lastResultsData.forEach(r => { if (r.Protein !== top) return; r._is_hook = /_A\d$/.test(r.Sample_ID); r._hookThr = 10; });
      window._ptUI.group = top; window._ptUI.side = 'all'; plateSetView('patterns');
      const cards = [...document.querySelectorAll('.pt-card')];
      return { n: cards.length, titles: cards.map(x => x.querySelector('.pt-title').innerText), hook: cards.filter(x => /Hook/i.test(x.querySelector('.pt-trait').innerText)).map(x => x.querySelector('.pt-title').innerText), map: !!document.querySelector('.pt-map'), chips: document.querySelectorAll('.pt-m').length, lead: document.querySelector('.pt-lead').innerText };
    });
    check('P9', 'a hook planted in source row A is a Hook card for that row, with a source-plate map and a chip per compound', planted.hook.some(h => /source row A/.test(h)) && planted.map && planted.chips >= 7, planted);
    check('P9', 'the header reads names as positions and counts the groups compared', /names read as chemistry-plate positions/.test(planted.lead) && /groups compared/.test(planted.lead), planted.lead);
    // 3. a chip finds the compound on the plate maps
    const jump = await E(() => { const b = document.querySelector('.pt-m'); const id = b.dataset.id; b.click(); return { id, q: window._plateUI.q, on: document.querySelector('.plate-view.on') && document.querySelector('.plate-view.on').dataset.v }; });
    check('P9', 'clicking a compound opens the plate maps searching for it', jump.q === jump.id && jump.on === 'maps', jump);
    // 4. copy carries every finding
    const copied = await E(async () => { plateSetView('patterns'); window.__copied = ''; const old = window._echoCopy; window._echoCopy = t => { window.__copied = t; return Promise.resolve(); }; ptCopy(); window._echoCopy = old; await new Promise(r => setTimeout(r, 50)); return { t: window.__copied, n: (window._ptLast.findings || []).length }; });
    check('P9', 'Copy as table has a header and one line per finding', copied.t.split('\n').length === copied.n + 1 && /^Trait\tWhere/.test(copied.t), { lines: copied.t.split('\n').length, n: copied.n });
    // 5. a clean plate: an honest "no pattern", not an empty page
    const clean = await E(() => { _lastResultsData.forEach(r => { r._is_hook = false; r._hookThr = 10; }); plateSetView('patterns'); const n = document.querySelector('.pt-none'); return { cards: document.querySelectorAll('.pt-card').length, none: n ? n.innerText.slice(0, 80) : '' }; });
    check('P9', 'no hook anywhere: no cards from hook, and a plain sentence when nothing else is found', clean.cards === 0 ? /No pattern/.test(clean.none) : true, clean);
    // 6. the side switch and the group switch re-draw without throwing, in both themes
    const sw = await E(() => { const r = []; for (const s of ['source', 'destination', 'name', 'all']) { ptSide(s); r.push(!!document.querySelector('.pt-page')); } document.documentElement.setAttribute('data-theme', 'dark'); plateSetView('patterns'); r.push(!!document.querySelector('.pt-page')); document.documentElement.setAttribute('data-theme', 'light'); return r; });
    check('P9', 'every side and both themes draw', sw.every(Boolean), sw);
    check('P9', 'no page error', errs.length === 0, errs);
  } finally { await browser.close(); }
}

const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
console.log(out.length ? `\n${out.length} finding(s).` : '\nAll Patterns invariants hold.');
process.exit(out.length ? 1 : 0);
