// Culture-medium invariants - the lab adds 1% pen/strep to every culture medium.
//
//   M1  the rule     a recipe without an antibiotic gets " + 1% P/S"; one that already names it is left alone
//   M2  two copies   the shell's cultureMedium and Incubator's standalone labMedium give the same answer
//   M4  the recipes   every medium the apps ship (shell cell lines, Incubator's table, Cell Archive's cards) already carries its P/S;
//                     Cell Archive's own add-a-line save goes through the same rule
//   M3  the points   a NEW culture (thaw in the shell, picking a line in Incubator) takes its medium through the rule;
//                    nothing rewrites a culture that already holds its own text
//
//   node tools/media_invariants.mjs        exit 1 on any finding
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const shell = read('shell/hub-shell.html'), inc = read('apps/incubator/incubator.html'), ca = read('apps/cell-archive/cell-archive.html');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const fnOf = (src, name) => {
  const i = src.indexOf('function ' + name + '(m){'); if (i < 0) return null;
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  return null;
};
const sFn = fnOf(shell, 'cultureMedium'), iFn = fnOf(inc, 'labMedium'), cFn = fnOf(ca, 'caMedium');
if (!sFn) fail('M2 shell has no cultureMedium(m)');
if (!iFn) fail('M2 incubator has no labMedium(m)');
if (!cFn) fail('M2 cell archive has no caMedium(m)');
if (sFn && iFn) {
  const S = new Function('window', sFn + '; return cultureMedium;')({});
  const I = new Function('window', iFn + '; return labMedium;')({});   // no parent shell: the standalone path
  const cases = [
    ['DMEM + 10% FBS', 'DMEM + 10% FBS + 1% P/S'],
    ["McCoy's 5A + 10% FBS", "McCoy's 5A + 10% FBS + 1% P/S"],
    ['EMEM + 10% FBS + insulin', 'EMEM + 10% FBS + insulin + 1% P/S'],
    ['DMEM + 10% FBS + 1% P/S', 'DMEM + 10% FBS + 1% P/S'],
    ['RPMI + 10% FBS + Pen/Strep', 'RPMI + 10% FBS + Pen/Strep'],
    ['DMEM + 10% FBS + penicillin-streptomycin', 'DMEM + 10% FBS + penicillin-streptomycin'],
    ['', '']
  ];
  for (const [a, want] of cases) {
    if (S(a) !== want) fail(`M1 shell "${a}" -> "${S(a)}" (want "${want}")`);
    if (I(a) !== S(a)) fail(`M2 copies disagree on "${a}": "${S(a)}" vs "${I(a)}"`);
    if (cFn) { const C = new Function(cFn + '; return caMedium;')(); if (C(a) !== S(a)) fail(`M2 Cell Archive copy disagrees on "${a}": "${S(a)}" vs "${C(a)}"`); }
  }
}
if (!/media:\s*\(ref&&ref\.media\)\s*\?\s*cultureMedium\(ref\.media\)/.test(shell)) fail('M3 shell thaw no longer passes the reference medium through cultureMedium');
if (!/fillIf\('cf-media',\s*labMedium\(ref\.media\)\)/.test(inc)) fail('M3 Incubator line picker no longer passes the reference medium through labMedium');
if (!/media:caMedium\(g\('media'\)\)/.test(ca)) fail('M3 Cell Archive add-a-line no longer passes its medium through caMedium');
// M4: a recipe that ships without the antibiotic is the bug
const hasAb = t => /\bP\/?S\b|pen(icillin)?[\s\/-]*strep|antibiotic|gentamicin|primocin/i.test(t);
const block = (src, start, end) => { const i = src.indexOf(start); return i < 0 ? '' : src.slice(i, src.indexOf(end, i)); };
const recipes = [
  ['shell CELL_ARCHIVE_BUILTIN', [...block(shell, 'CELL_ARCHIVE_BUILTIN = [', '];').matchAll(/media:\s*(['"])((?:(?!\1).)*)\1/g)].map(m => m[2])],
  ['Incubator CELL_REF', [...block(inc, 'var CELL_REF = {', '};').matchAll(/media:\s*(['"])((?:(?!\1).)*)\1/g)].map(m => m[2])],
  ['Cell Archive cards', [...ca.matchAll(/<th>Complete medium<\/th><td>(.*?)<\/td>/g)].map(m => m[1].replace(/<[^>]+>/g, ''))]
];
for (const [where, list] of recipes) {
  if (list.length < 8) fail(`M4 ${where}: only ${list.length} media found - the reader lost its place`);
  for (const t of list) if (!hasAb(t)) fail(`M4 ${where}: "${t}" has no P/S`);
}
console.log(bad ? `${bad} finding(s)` : 'media invariants: all pass');
process.exit(bad ? 1 : 0);
