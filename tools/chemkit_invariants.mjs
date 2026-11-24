// ChemKit invariants — every 2D structure in dHUB is drawn the way ChemDraw's ACS Document 1996 style draws it (tools/chemkit/acs.js; Dora, Echo, Hit Finder).
// Each check is a CLASS of mistake, and was proven by putting the mistake back.
//
//   CK1 no letter on a letter   No two atom labels overlap, for hard molecules (degraders, fused rings, charged, salts) in every tile size the apps use and in narrow, tall and tiny ones.
//                               (Found 2026-11-24: a minimum font size made labels larger than the bond between them once a degrader was shrunk to fit a tile.)
//   CK2 ACS proportions         Line width is 0.6/14.4 of the bond and the label is 10/14.4 of it, unless the molecule had to shrink below the legible floor; a bond of a molecule that fits
//                               is the same length in every tile of a size (a small molecule is not blown up).
//   CK3 black ink               Every bond and label is black (highlights are the only colour, and a highlight is a fill behind the drawing).
//   CK4 everything inside       No ink outside the tile.
//   CK6 readable                In the tiles the apps use, no label is smaller than 5 px, for every molecule above, a degrader included.
//   CK5 one rule                Dora, Echo and Hit Finder carry the kit and draw with it: no app draws a structure with options of its own.
//
//   node tools/chemkit_invariants.mjs [--kit=path]      exit 1 on any finding
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const require = createRequire(import.meta.url);
const ctx = { Math, JSON, parseFloat, parseInt, isFinite, Object }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(ROOT, arg('kit', 'tools/chemkit/acs.js')), 'utf8') + ';this.K={acsOptions,acsSvg,ACS_1996,acsLabelsOverlap}', ctx);
const K = ctx.K, out = [], counts = {};
function check(inv, name, ok, detail) { counts[inv] = (counts[inv] || 0) + 1; if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) }); }
const init = require(path.join(ROOT, 'vendor/rdkit-minimal-2026.9.1.js'));
const rd = await init({ locateFile: () => path.join(ROOT, 'vendor/rdkit-minimal-2026.9.1.wasm') });
const MOLS = {
  ethanol: 'CCO', aspirin: 'CC(=O)Oc1ccccc1C(=O)O', methane: 'C', water: 'O', salt: 'CC(=O)[O-].[Na+]', betaine: 'C[N+](C)(C)CC(=O)[O-]', chiral: 'C[C@H](N)C(=O)Nc1ccc(S(=O)(=O)N)cc1',
  JQ1: 'CC1=C(SC2=C1C(=NC(C3=NN=C(N32)C)CC(=O)OC(C)(C)C)C4=CC=C(C=C4)Cl)C',
  pomalidomide: 'O=C1CCC(N2C(=O)c3cccc(N)c3C2=O)C(=O)N1',
  PEG3: 'CC1=C(SC2=C1C(=NC(C3=NN=C(N32)C)CC(=O)NCCOCCOCCOCCNc4cccc5C(=O)N(C(=O)c45)C6CCC(=O)NC6=O)C7=CC=C(C=C7)Cl)C',
  alkyl10: 'CC1=C(SC2=C1C(=NC(C3=NN=C(N32)C)CC(=O)NCCCCCCCCCCNc4cccc5C(=O)N(C(=O)c45)C6CCC(=O)NC6=O)C7=CC=C(C=C7)Cl)C',
  VHL: 'CC1=C(SC=N1)C2=CC=C(CNC(=O)C3CC(O)CN3C(=O)C(NC(=O)COCCOCCOCCOCCC(=O)NC4=CC=CC=C4)C(C)(C)C)C=C2',
  crowded: 'O=C(NC1CCN(CC1)c1nc2ccccc2[nH]1)c1cc(F)c(Cl)c(Br)c1OC(F)(F)F',
  sulfonamide: 'CS(=O)(=O)Nc1ccc(cc1)S(N)(=O)=O', macrocycle: 'C1CCCCCCCCCCCC(=O)NCCCCCC(=O)N1', steroid: 'CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2O', peptide: 'NCC(=O)NCC(=O)NC(C)C(=O)NC(CS)C(=O)O',
};
const TILES = [[270, 124], [210, 100], [340, 154], [240, 110], [300, 138], [260, 120], [132, 90], [150, 330], [100, 60], [480, 300], [180, 180]];
const nums = d => (d.match(/-?\d+\.?\d*/g) || []).map(Number);
function labels(svg) {      // atom label glyphs: paths with class atom-N and a fill; one box per atom
  const box = {};
  for (const m of svg.matchAll(/<path class='atom-(\d+)'\s+d='([^']*)'/g)) {
    const v = nums(m[2]), b = box[m[1]] || (box[m[1]] = [1e9, 1e9, -1e9, -1e9]);
    for (let i = 0; i + 1 < v.length; i += 2) { b[0] = Math.min(b[0], v[i]); b[1] = Math.min(b[1], v[i + 1]); b[2] = Math.max(b[2], v[i]); b[3] = Math.max(b[3], v[i + 1]); }
  }
  return box;
}
const APP = [[270, 124], [210, 100], [340, 154], [240, 110], [300, 138], [260, 120]];
const per = [];
for (const [name, smi] of Object.entries(MOLS)) for (const [w, h] of TILES) {
  const m = rd.get_mol(smi); if (!m || !m.is_valid()) { check('CK1', name + ' parses', false); continue; }
  const o = K.acsOptions(m, w, h), svg = K.acsSvg(m, w, h); m.delete();
  const tag = name + ' ' + w + 'x' + h, B = labels(svg), ids = Object.keys(B);
  // CK1
  let hit = null;
  for (let i = 0; i < ids.length && !hit; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = B[ids[i]], b = B[ids[j]], t = 0.4;
    if (a[0] < b[2] - t && b[0] < a[2] - t && a[1] < b[3] - t && b[1] < a[3] - t) { hit = [ids[i], ids[j], a.map(Math.round), b.map(Math.round)]; break; }
  }
  check('CK1', tag + ' (' + ids.length + ' labels)', !hit, hit);
  // CK2: the proportions the options carry
  const bond = o.fixedBondLength * 1.5, k = bond / K.ACS_1996.bond;
  const want = K.ACS_1996.line * k;
  check('CK2', tag + ' line width is 0.6/14.4 of the bond', o.bondLineWidth >= want * 0.99 && (o.bondLineWidth <= want * 1.01 || o.bondLineWidth <= 1.0), { line: o.bondLineWidth, want });
  check('CK2', tag + ' label is 10/14.4 of the bond', Math.abs(o.fixedFontSize - K.ACS_1996.font * k) < 0.02 || o.fixedFontSize <= 4.01, { font: o.fixedFontSize, want: K.ACS_1996.font * k });
  check('CK2', tag + ' double bonds spaced 0.18', o.multipleBondOffset === 0.18);
  per.push({ name, w, h, k });
  if (APP.some(([a, b]) => a === w && b === h)) check('CK6', tag + ' label size', o.fixedFontSize >= 5, { font: +o.fixedFontSize.toFixed(1) });
  // CK3
  const cols = [...new Set([...svg.matchAll(/(?:stroke|fill):(#[0-9A-Fa-f]{6})/g)].map(x => x[1].toUpperCase()))].filter(c => c !== '#000000' && c !== '#FFFFFF');
  check('CK3', tag + ' black only', !cols.length, cols);
  // CK4
  let ink = null; for (const x of svg.matchAll(/ d='([^']*)'/g)) { const v = nums(x[1]); for (let i = 0; i + 1 < v.length; i += 2) if (v[i] < -1 || v[i] > w + 1 || v[i + 1] < -1 || v[i + 1] > h + 1) ink = [Math.round(v[i]), Math.round(v[i + 1])]; }
  check('CK4', tag + ' inside the tile', !ink, ink);
}
// CK2: a molecule that fits has the same bond in every tile of a height
for (const [w, h] of [[270, 124], [210, 100]]) { const ks = per.filter(p => p.w === w && p.h === h && ['ethanol', 'aspirin', 'chiral', 'pomalidomide'].includes(p.name)).map(p => p.k); const mx = Math.max(...ks), top = ks.filter(k => k > mx * 0.99);
  check('CK2', 'small molecules in ' + w + 'x' + h + ' share one bond length', top.length >= 2, ks); }
// CK5
for (const f of ['apps/dora/dora.html', 'apps/echo/echo.html', 'apps/hitfinder/hitfinder.html']) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), body = src.replace(/\/\* chem-kit-js:begin[\s\S]*?chem-kit-js:end \*\//, '');
  check('CK5', f + ' carries the kit', /chem-kit-js:begin/.test(src) && /function acsSvg/.test(src));
  check('CK5', f + ' draws with the kit only', !/atomColourPalette|bondLineWidth|fixedBondLength|minFontSize/.test(body) && /acsSvg\(|acsOptions\(/.test(body), 'own drawing options outside the kit');
}
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort();
for (const inv of invs) { const f = out.filter(x => x.inv === inv); console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`); f.slice(0, 10).forEach(x => console.log(`      ${x.case}: ${x.msg}`)); }
console.log(out.length ? `\n${out.length} finding(s).` : '\nAll ChemKit invariants hold.');
process.exit(out.length ? 1 : 0);
