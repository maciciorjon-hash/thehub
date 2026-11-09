// EdgeKit invariants — edge-effect compensation from the vehicle wells (tools/edgekit/edge.js; Lumina Setup › Controls, Echo).
// Each check is a CLASS of mistake, and was proven by putting the mistake back.
//
//   ED1 recovery          Edge effects planted in noisy plates come back, per side, within a few points; a well restated at the interior level reads 100 %.
//   ED2 chance            A clean plate is called "edgy" in a few per cent of runs, not one in five (four t-tests need the joint F gate first).
//   ED3 the layout decides  Controls only on the edge, only inside, one inside, too few wells: ok:false, a reason that says what to move, and NOTHING changes.
//   ED4 nothing found = nothing done   Whatever is not applied leaves ref(r,c) equal to the plain mean of the control wells, for every well.
//   ED5 exact             Noise-free multiplicative effects are recovered exactly (a corner is the product of its two sides, not their sum).
//   ED6 p-values          Student t and F tails equal textbook values.
//   ED7 sides with no control   A side nobody measured is not corrected, is said, and its wells keep factor 1 (covered() is false there).
//   ED8 bad readings      Zero, negative and NaN controls are left out, never counted as a dead well.
//   ED9 scale             Multiplying every reading by a constant changes no factor and scales the reference by the same constant.
//
//   node tools/edgekit_invariants.mjs [--kit=path]      exit 1 on any finding
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(ROOT, arg('kit', 'tools/edgekit/edge.js')), 'utf8') + ';this.E=EdgeKit', ctx);
const E = ctx.E, out = [], counts = {};
function check(inv, name, ok, detail) { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) }); }
let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
const R = 8, C = 12, G = { R, C };
const fac = e => (r, c) => (1 + (r === 0 ? e.top || 0 : 0)) * (1 + (r === R - 1 ? e.bottom || 0 : 0)) * (1 + (c === 0 ? e.left || 0 : 0)) * (1 + (c === C - 1 ? e.right || 0 : 0));
const LAYOUT = {
  rich: [[0, 1], [0, 5], [0, 9], [7, 2], [7, 6], [7, 10], [2, 0], [5, 0], [3, 11], [6, 11], [0, 0], [7, 11], [3, 3], [3, 8], [4, 5], [5, 4], [2, 7], [4, 2], [3, 6], [5, 9]],
  col12: Array.from({ length: 8 }, (_, r) => [r, 11]),
  inside: [[3, 3], [3, 8], [4, 5], [5, 4], [2, 7], [4, 2]],
  oneInside: [[3, 3], [0, 4], [0, 8], [7, 4], [4, 0], [4, 11]],
  tiny: [[3, 3], [3, 8], [0, 4], [4, 0]],
};
const mk = (cells, f, cv, base = 100000) => cells.map(([r, c]) => ({ r, c, v: base * f(r, c) * (1 + cv * gauss()) }));

// ED1 — recovery
{ const eff = { right: -0.18, top: -0.10, bottom: -0.08, left: -0.12 }, f = fac(eff), err = { top: [], bottom: [], left: [], right: [] }, rd = [];
  for (let k = 0; k < 300; k++) { const m = E.fit(mk(LAYOUT.rich, f, 0.04), G); if (!m.ok) continue;
    for (const s of ['top', 'bottom', 'left', 'right']) { const t = m.terms.find(x => x.side === s); err[s].push(t && t.applied ? t.pct - eff[s] * 100 : (-eff[s] * 100)); }
    rd.push(m.ref(3, 11) / (100000 * (1 + eff.right)) - 1); }
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
  for (const s of ['top', 'bottom', 'left', 'right']) check('ED1', 'median error of the ' + s + ' effect < 2.5 points', Math.abs(med(err[s])) < 2.5, { s, e: med(err[s]) });
  check('ED1', 'the reference for a right-edge well is within 3 % of the truth (median)', Math.abs(med(rd)) < 0.03, med(rd));
  const m = E.fit(mk(LAYOUT.rich, f, 0.02), G);
  check('ED1', 'the interior level is the unaffected level (±2 %)', m.ok && Math.abs(m.mu / 100000 - 1) < 0.02, m.mu); }

// ED2 — chance
{ let hit = 0; const N = 600; for (let k = 0; k < N; k++) { const m = E.fit(mk(LAYOUT.rich, () => 1, 0.07), G); if (m.ok && m.applied) hit++; }
  check('ED2', 'a plate with no edge effect is corrected in ≤ 9 % of runs (joint gate)', hit / N <= 0.09, hit / N); }

// ED3 — the layout decides
{ for (const [name, why] of [['col12', /outer ring/], ['inside', /no control well sits on the edge|nothing to measure the edge/i], ['oneInside', /only one control well is inside/i], ['tiny', /too few|unknowns|inside/i]]) {
    const pts = mk(LAYOUT[name], () => 0.9, 0.05), m = E.fit(pts, G), plain = pts.reduce((a, p) => a + p.v, 0) / pts.length;
    check('ED3', name + ': not ok, says why', !m.ok && why.test(m.why), m.why);
    check('ED3', name + ': changes nothing (reference = plain mean, factor 1)', !m.applied && Math.abs(m.ref(0, 11) - plain) < 1e-6 && m.factor(0, 11) === 1, { ref: m.ref(0, 11), plain }); }
  check('ED3', 'the layout alone can be judged without readings', E.layout(LAYOUT.rich.map(([r, c]) => ({ r, c })), G).ok && !E.layout(LAYOUT.col12.map(([r, c]) => ({ r, c })), G).ok);
  check('ED3', 'a small plate (2×3) has no inner region', !E.fit([{ r: 0, c: 0, v: 1 }, { r: 1, c: 2, v: 1 }], { R: 2, C: 3 }).ok); }

// ED4 — nothing found = nothing done
{ let bad = 0; for (let k = 0; k < 50; k++) { const pts = mk(LAYOUT.rich, () => 1, 0.05), m = E.fit(pts, G), plain = pts.reduce((a, p) => a + p.v, 0) / pts.length;
    if (!m.applied) for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (Math.abs(m.ref(r, c) - plain) > 1e-9 * plain || m.factor(r, c) !== 1) bad++; }
  check('ED4', 'when no term is applied every well keeps the plain mean of the controls and factor 1', bad === 0, bad); }

// ED5 — exact
{ const eff = { right: -0.2, top: -0.1, left: -0.05, bottom: -0.15 }, f = fac(eff), pts = LAYOUT.rich.map(([r, c]) => ({ r, c, v: 80000 * f(r, c) * (1 + 0.003 * Math.sin(5 * r + 3 * c)) })), m = E.fit(pts, G);
  check('ED5', 'applied with all four sides', m.ok && m.applied && m.terms.every(t => t.applied), m.terms.map(t => [t.side, t.applied]));
  check('ED5', 'a pure side comes back to < 0.5 point', ['top', 'bottom', 'left', 'right'].every(s => Math.abs(m.terms.find(t => t.side === s).pct - eff[s] * 100) < 0.5), m.terms.map(t => [t.side, +t.pct.toFixed(2)]));
  check('ED5', 'the corner is the product of its two sides (not their sum)', Math.abs(m.factor(0, 11) - (1 + eff.top) * (1 + eff.right)) < 0.004 && Math.abs(m.factor(0, 11) - (1 + eff.top + eff.right)) > 0.005, { f: m.factor(0, 11), prod: (1 + eff.top) * (1 + eff.right), sum: 1 + eff.top + eff.right });
  check('ED5', 'an interior well has factor 1', m.factor(3, 5) === 1);
  const exact = E.fit(LAYOUT.rich.map(([r, c]) => ({ r, c, v: 80000 * f(r, c) })), G);
  check('ED5', 'noise-free data does not break the tests (zero residual)', exact.ok && exact.applied && Math.abs(exact.mu - 80000) < 1e-6 * 80000, { ok: exact.ok, a: exact.applied, mu: exact.mu }); }

// ED6 — p-values
{ const near = (a, b, tol = 2e-4) => Math.abs(a - b) < tol;
  check('ED6', 't = 2.228, df 10 → p = 0.05', near(E._pT2(2.2281388, 10), 0.05), E._pT2(2.2281388, 10));
  check('ED6', 't = 4.303, df 2 → p = 0.05', near(E._pT2(4.30265273, 2), 0.05), E._pT2(4.30265273, 2));
  check('ED6', 't = 2.0, df 10 → p = 0.0734', near(E._pT2(2, 10), 0.07339, 2e-4), E._pT2(2, 10));
  check('ED6', 'F = 4.9646 (1, 10) → p = 0.05', near(E._pF(4.9646, 1, 10), 0.05), E._pF(4.9646, 1, 10));
  check('ED6', 'F = 3.4780 (4, 10) → p = 0.05', near(E._pF(3.4780, 4, 10), 0.05), E._pF(3.4780, 4, 10)); }

// ED7 — sides with no control
{ const cells = LAYOUT.rich.filter(([, c]) => c !== 0), f = fac({ right: -0.2, top: -0.1, bottom: -0.1, left: -0.3 }), m = E.fit(mk(cells, f, 0.02), G);
  check('ED7', 'the left side is not estimated and says so', m.ok && !m.terms.some(t => t.side === 'left') && m.notes.some(n => /column 1 /.test(n)), { terms: m.terms.map(t => t.side), notes: m.notes });
  check('ED7', 'a left-edge well is not covered and keeps factor 1; a right-edge well is covered', m.covered(3, 0) === false && m.factor(3, 0) === 1 && m.covered(3, 11) === true && m.factor(3, 11) < 0.9, { c0: m.covered(3, 0), f0: m.factor(3, 0), f11: m.factor(3, 11) });
  const corners = LAYOUT.rich.filter(([r, c]) => !(c === 11 && r !== 0 && r !== 7)).concat([[0, 11], [7, 11]]), m2 = E.fit(mk(corners, f, 0.02), G);
  check('ED7', 'a side with controls only in the corners is not told apart', m2.ok && !m2.terms.some(t => t.side === 'right'), { terms: m2.terms.map(t => t.side), notes: m2.notes }); }

// ED8 — bad readings
{ const f = fac({ right: -0.15 }), good = mk(LAYOUT.rich, f, 0.02), bad = good.concat([{ r: 3, c: 4, v: 0 }, { r: 2, c: 5, v: -5 }, { r: 4, c: 6, v: NaN }, { r: 5, c: 5, v: null }]), a = E.fit(good, G), b = E.fit(bad, G);
  check('ED8', 'zero, negative and missing controls change nothing', a.ok && b.ok && Math.abs(a.mu - b.mu) < 1e-9 && b.n === good.length, { a: a.mu, b: b.mu, n: b.n }); }

// ED9 — scale
{ const f = fac({ right: -0.15, top: -0.08 }); seed = 99; const pts = mk(LAYOUT.rich, f, 0.03), a = E.fit(pts, G), b = E.fit(pts.map(p => ({ r: p.r, c: p.c, v: p.v * 1234.5 })), G);
  check('ED9', 'same factors, reference scales with the readings', a.ok && b.ok && Math.abs(a.factor(3, 11) - b.factor(3, 11)) < 1e-9 && Math.abs(b.ref(3, 11) / a.ref(3, 11) - 1234.5) < 1e-6, { a: a.factor(3, 11), b: b.factor(3, 11) }); }

const total = Object.values(counts).reduce((a, b) => a + b, 0);
if (out.length) { console.log('EdgeKit invariants: ' + out.length + ' failing of ' + total); out.forEach(o => console.log('  ' + o.inv + ' ' + o.case + ' — ' + o.msg)); process.exit(1); }
console.log('EdgeKit invariants: ' + total + ' checks, all pass (' + Object.entries(counts).map(([k, v]) => k + '×' + v).join(' ') + ')');
