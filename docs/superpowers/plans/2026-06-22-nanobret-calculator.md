# NanoBRET™ PPI Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new self-contained Hub app, `NanoBRET/nanobret.html`, implementing the NanoBRET™ PPI assay calculation pipeline (raw ratio → mBU → corrected mBU → Z′/Z factor, plus 4PL dose-response fitting for IC50/EC50), and wire it into the Hub shell.

**Architecture:** Single-file vanilla HTML/CSS/JS app (no build step), following the exact skeleton every other Hub app uses (IBM Plex fonts, CSS-var theme system, tab bar with inline-SVG icons, light/dark toggle persisted to `localStorage`). Four tabs — Plate Data, Endpoint/QC, Dose-Response, Guide — share one in-memory state object; each tab only reads/derives from state, never mutates another tab's input. Calculation logic (raw ratio, mBU, Z′/Z, well-range parsing, plate-CSV parsing, the 4PL fitter) is written as pure functions with no DOM dependency, verified against hand-calculated synthetic data via throwaway Node scripts before being pasted into the app's `<script>` block — this project has no test runner or `tests/` convention, so Node-script verification (delete after use) is the closest TDD-equivalent that doesn't introduce new infra inconsistent with every other app in the suite.

**Tech Stack:** Vanilla HTML/CSS/JS, IBM Plex Sans/Mono (Google Fonts), inline SVG icons, HTML5 `<canvas>` for the dose-response chart. No frameworks, no npm, no bundler — matches every existing app in the repo.

---

## File Structure

- **Create:** `NanoBRET/nanobret.html` — the entire app (this is the only new file; every other Hub app is a single self-contained HTML file, so this follows established convention).
- **Modify:** `hub-shell.html` — add home-card markup, app-view iframe, `APP_INFO` entry, `APP_B64_NEW` entry, version string + changelog entry.
- **Modify:** `embed.py` — add `('nanobret', 'NanoBRET/nanobret.html')` to the `APPS` list.
- **Modify:** `CLAUDE.md` — add a row to the "Current apps" table, add a session-log entry.

---

### Task 1: Calculation engine (pure functions)

**Files:**
- Test (throwaway, not committed): `/tmp/nanobret-engine-test.js`
- Target (written in Task 3): `NanoBRET/nanobret.html` `<script>` block

- [ ] **Step 1: Write the failing test**

Create `/tmp/nanobret-engine-test.js` with ONLY the assertions (no implementations yet):

```javascript
var assert = require('assert');

var grid = [
  { label: 'A', vals: [100, 200, 300] },
  { label: 'B', vals: [400, 500, 600] }
];
assert.deepStrictEqual(wellToRowCol('A02'), { row: 'A', col: 2 });
assert.strictEqual(getWellValue(grid, 'A02'), 200);
assert.strictEqual(getWellValue(grid, 'B03'), 600);
assert.strictEqual(getWellValue(grid, 'C01'), null);

assert.strictEqual(rawRatio(100, 50), 0.5);
assert.strictEqual(mBU(0.5), 500);

var ligand = [820, 840, 810, 830, 825];
var noligand = [120, 130, 110, 125, 115];
assert.strictEqual(meanOf(ligand), 825);
assert.strictEqual(meanOf(noligand), 120);
assert.ok(Math.abs(sdOf(ligand) - 11.180339887498949) < 1e-9);
assert.ok(Math.abs(sdOf(noligand) - 7.905694150420948) < 1e-9);

var cmbu = correctedMBU(meanOf(ligand), meanOf(noligand));
assert.strictEqual(cmbu, 705);
var zprime = zPrimeFactor(sdOf(ligand), sdOf(noligand), meanOf(ligand), meanOf(noligand));
assert.ok(Math.abs(zprime - 0.91878283388119197) < 1e-9);

assert.deepStrictEqual(parseWellRange('A1-A3'), ['A01', 'A02', 'A03']);
assert.deepStrictEqual(parseWellRange('B1,B2,B3'), ['B01', 'B02', 'B03']);
assert.deepStrictEqual(parseWellRange('A1:B2'), ['A01', 'A02', 'B01', 'B02']);

var csv96 = '1,2,3,4,5,6,7,8,9,10,11,12\n' +
  'A,10,20,30,40,50,60,70,80,90,100,110,120\n' +
  'B,1,2,3,4,5,6,7,8,9,10,11,12\n' +
  'C,0,0,0,0,0,0,0,0,0,0,0,0\n' +
  'D,0,0,0,0,0,0,0,0,0,0,0,0\n' +
  'E,0,0,0,0,0,0,0,0,0,0,0,0\n' +
  'F,0,0,0,0,0,0,0,0,0,0,0,0\n' +
  'G,0,0,0,0,0,0,0,0,0,0,0,0\n' +
  'H,0,0,0,0,0,0,0,0,0,0,0,0';
var parsed96 = parsePlateCSV(csv96, '96');
assert.strictEqual(parsed96.length, 8);
assert.deepStrictEqual(parsed96[0], { label: 'A', vals: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120] });

var donorGrid = [{ label: 'A', vals: [100, 100, 100] }];
var acceptorGrid = [{ label: 'A', vals: [50, 60, 0] }];
var mbus = computeConditionMBUs(donorGrid, acceptorGrid, ['A01', 'A02', 'A03']);
assert.deepStrictEqual(mbus, [500, 600]);

console.log('All engine tests passed.');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node /tmp/nanobret-engine-test.js`
Expected: `ReferenceError: wellToRowCol is not defined` (no implementation exists yet)

- [ ] **Step 3: Write the implementation**

Prepend this block to the top of `/tmp/nanobret-engine-test.js` (above the assertions):

```javascript
function wellToRowCol(wellId) {
  var m = wellId.trim().match(/^([A-P])(\d{1,2})$/i);
  if (!m) return null;
  return { row: m[1].toUpperCase(), col: parseInt(m[2], 10) };
}

function getWellValue(grid, wellId) {
  var rc = wellToRowCol(wellId);
  if (!rc) return null;
  var rowObj = grid.filter(function(r){ return r.label === rc.row; })[0];
  if (!rowObj) return null;
  var v = rowObj.vals[rc.col - 1];
  return (typeof v === 'number' && !isNaN(v)) ? v : null;
}

function getValuesForWells(grid, wellIds) {
  return wellIds.map(function(w){ return getWellValue(grid, w); })
    .filter(function(v){ return v !== null; });
}

function rawRatio(donorVal, acceptorVal) {
  return acceptorVal / donorVal;
}

function mBU(ratio) {
  return ratio * 1000;
}

function meanOf(arr) {
  return arr.reduce(function(s, v){ return s + v; }, 0) / arr.length;
}

function sdOf(arr) {
  if (arr.length < 2) return 0;
  var m = meanOf(arr);
  var variance = arr.reduce(function(s, v){ return s + (v - m) * (v - m); }, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function computeConditionMBUs(donorGrid, acceptorGrid, wellIds) {
  return wellIds.map(function(w){
    var d = getWellValue(donorGrid, w);
    var a = getWellValue(acceptorGrid, w);
    if (d === null || a === null || d === 0 || a === 0) return null;
    return mBU(rawRatio(d, a));
  }).filter(function(v){ return v !== null; });
}

function correctedMBU(meanLigand, meanNoLigand) {
  return meanLigand - meanNoLigand;
}

function zPrimeFactor(sdA, sdB, meanA, meanB) {
  var denom = Math.abs(meanA - meanB);
  if (denom === 0) return null;
  return 1 - (3 * sdA + 3 * sdB) / denom;
}

function parseWellRange(s) {
  s = (s || '').trim();
  var wells = [];
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var colRange = s.match(/^([A-P])(\d+)-([A-P])(\d+)$/i);
  if (colRange && colRange[1].toUpperCase() === colRange[3].toUpperCase()) {
    var row = colRange[1].toUpperCase();
    var cc1 = parseInt(colRange[2], 10), cc2 = parseInt(colRange[4], 10);
    for (var j = Math.min(cc1, cc2); j <= Math.max(cc1, cc2); j++) {
      wells.push(row + (j < 10 ? '0' + j : j));
    }
    return wells;
  }
  if (colRange && colRange[2] === colRange[4]) {
    var col = parseInt(colRange[2], 10);
    var r1 = ROWS.indexOf(colRange[1].toUpperCase());
    var r2 = ROWS.indexOf(colRange[3].toUpperCase());
    for (var i = Math.min(r1, r2); i <= Math.max(r1, r2); i++) {
      wells.push(ROWS[i] + (col < 10 ? '0' + col : col));
    }
    return wells;
  }
  var rect = s.match(/^([A-P])(\d+):([A-P])(\d+)$/i);
  if (rect) {
    var c1 = parseInt(rect[2], 10), c2 = parseInt(rect[4], 10);
    var rr1 = ROWS.indexOf(rect[1].toUpperCase()), rr2 = ROWS.indexOf(rect[3].toUpperCase());
    for (var r = Math.min(rr1, rr2); r <= Math.max(rr1, rr2); r++) {
      for (var c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        wells.push(ROWS[r] + (c < 10 ? '0' + c : c));
      }
    }
    return wells;
  }
  s.split(',').forEach(function(w){
    var m = w.trim().match(/^([A-P])(\d+)$/i);
    if (m) {
      var n = parseInt(m[2], 10);
      wells.push(m[1].toUpperCase() + (n < 10 ? '0' + n : n));
    }
  });
  return wells;
}

function parsePlateCSV(text, format) {
  var dims = format === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var lines = text.trim().split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
  if (lines.length < dims.rows) return null;
  var dataLines = lines;
  var firstCells = lines[0].split(/[\t,;]+/);
  var firstIsHeader = isNaN(parseFloat(firstCells[0])) ||
    firstCells[0].trim().toLowerCase() === '1' ||
    !!firstCells[0].trim().match(/^[a-z]/i);
  if (firstIsHeader) dataLines = lines.slice(1);
  var rowLabels = 'ABCDEFGHIJKLMNOP';
  var rows = [];
  for (var i = 0; i < Math.min(dims.rows, dataLines.length); i++) {
    var cells = dataLines[i].split(/[\t,;]+/);
    var start = cells[0].trim().match(/^[A-P]$/i) ? 1 : 0;
    var vals = [];
    for (var j = start; j < Math.min(start + dims.cols, cells.length); j++) {
      var v = parseFloat(cells[j]);
      vals.push(isNaN(v) ? 0 : v);
    }
    while (vals.length < dims.cols) vals.push(0);
    rows.push({ label: rowLabels[i], vals: vals.slice(0, dims.cols) });
  }
  if (rows.length < dims.rows) return null;
  return rows;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node /tmp/nanobret-engine-test.js`
Expected: `All engine tests passed.` with exit code 0.

- [ ] **Step 5: Delete the throwaway test file**

```bash
rm /tmp/nanobret-engine-test.js
```

No commit for this task — the verified code is carried forward into Task 3, which is where it first lands in the repo and gets committed.

---

### Task 2: 4PL dose-response fitter

**Files:**
- Test (throwaway, not committed): `/tmp/nanobret-fit-test.js`
- Target (written in Task 6): `NanoBRET/nanobret.html` `<script>` block

This reuses Echo's existing Levenberg-Marquardt 4PL fitter verbatim (`Labcyte_Echo/labcyte_echo.html:1965-2103`) — a working, already-proven implementation. The test here is a sanity check that the copy-paste is faithful and recovers known parameters from noise-free synthetic data, not a re-validation of the algorithm itself.

- [ ] **Step 1: Write the failing test**

Create `/tmp/nanobret-fit-test.js`:

```javascript
var assert = require('assert');

// Synthetic dose-response data: bottom=50, top=900, EC50=100 (log10EC50=2), hillSlope=1, no noise.
var trueBottom = 50, trueTop = 900, trueLogEC50 = 2, trueHill = 1;
var concs = [1, 3, 10, 30, 100, 300, 1000, 3000];
var xArr = concs.map(function(c){ return Math.log10(c); });
var yArr = xArr.map(function(xi){ return _4plVal4(xi, trueBottom, trueLogEC50, trueHill, trueTop); });

var loBound = [0, 0, 0.1, 200];
var hiBound = [1000, 4, 5, 2000];
var pBase = [100, 2, 1, 800];
var result = _fitBest(xArr, yArr, pBase, loBound, hiBound, _4plVal4, _4plJac4, 1000);

assert.ok(result.r2 > 0.999, 'expected near-perfect fit on noise-free data, got r2=' + result.r2);
assert.ok(Math.abs(result.params[1] - trueLogEC50) < 0.01, 'expected logEC50≈2, got ' + result.params[1]);
assert.ok(Math.abs(Math.pow(10, result.params[1]) - 100) < 1, 'expected EC50≈100, got ' + Math.pow(10, result.params[1]));

console.log('4PL fit test passed. EC50=' + Math.pow(10, result.params[1]).toFixed(2) + ' r2=' + result.r2.toFixed(5));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node /tmp/nanobret-fit-test.js`
Expected: `ReferenceError: _4plVal4 is not defined`

- [ ] **Step 3: Write the implementation**

Prepend this block (copied verbatim from `Labcyte_Echo/labcyte_echo.html:1965-2103`, no modifications) to the top of `/tmp/nanobret-fit-test.js`:

```javascript
function _4plVal4(xi, bot, logec50, h, top) {
  return bot + (top - bot) / (1 + Math.pow(10, h * (xi - logec50)));
}

function _4plJac4(xi, bot, logec50, h, top) {
  const ln10 = Math.LN10;
  const E = Math.pow(10, h * (xi - logec50));
  const denom = (1 + E) * (1 + E);
  return [E / (1 + E), (top - bot) * h * ln10 * E / denom, -(top - bot) * (xi - logec50) * ln10 * E / denom, 1 / (1 + E)];
}

function _solveLin(A, b) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < n; col++) {
    let mx = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[mx][col])) mx = r;
    [M[col], M[mx]] = [M[mx], M[col]];
    if (Math.abs(M[col][col]) < 1e-14) return null;
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) M[k][n] -= M[k][i] * x[i];
  }
  return x;
}

function _matInv(A) {
  const n=A.length;
  const M=A.map((row,i)=>[...row,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let col=0;col<n;col++){
    let maxRow=col;
    for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[maxRow][col])) maxRow=r;
    [M[col],M[maxRow]]=[M[maxRow],M[col]];
    if(Math.abs(M[col][col])<1e-14) return null;
    const piv=M[col][col];
    for(let j=0;j<2*n;j++) M[col][j]/=piv;
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const f=M[r][col];
      for(let j=0;j<2*n;j++) M[r][j]-=f*M[col][j];
    }
  }
  return M.map(row=>row.slice(n));
}

function _lmFit(xArr, yArr, pInit, loBound, hiBound, valFn, jacFn, maxIter) {
  const n = xArr.length, np = pInit.length;
  const cl = (v, i) => Math.max(loBound[i], Math.min(hiBound[i], v));
  let p = pInit.map(cl);
  const ssq = (pp) => { let s = 0; for (let i = 0; i < n; i++) { const r = yArr[i] - valFn(xArr[i], ...pp); s += r * r; } return s; };
  let lam = 0.001, bestP = [...p], bestSS = ssq(p);

  for (let iter = 0; iter < maxIter; iter++) {
    const JtJ = Array.from({ length: np }, () => new Array(np).fill(0));
    const Jtr = new Array(np).fill(0);
    for (let i = 0; i < n; i++) {
      const res = yArr[i] - valFn(xArr[i], ...p);
      const jac = jacFn(xArr[i], ...p);
      for (let a = 0; a < np; a++) {
        Jtr[a] += jac[a] * res;
        for (let b = 0; b < np; b++) JtJ[a][b] += jac[a] * jac[b];
      }
    }
    const _gradNorm = Math.max(...Jtr.map(Math.abs));
    if (_gradNorm < 1e-8 * (1 + Math.abs(bestSS))) break;
    const A = JtJ.map((row, i) => row.map((v, j) => i === j ? v * (1 + lam) : v));
    const delta = _solveLin(A, Jtr);
    if (!delta) { lam = Math.min(lam * 10, 1e8); continue; }
    const pNew = p.map((v, i) => cl(v + delta[i], i));
    const newSS = ssq(pNew);
    const curSS = ssq(p);
    if (newSS < bestSS) { bestSS = newSS; bestP = [...pNew]; }
    if (newSS < curSS) {
      let _pred = 0;
      for (let a = 0; a < np; a++) _pred += delta[a] * (lam * delta[a] + Jtr[a]);
      _pred *= 0.5;
      const _actual = curSS - newSS;
      const rho = _pred > 1e-12 ? _actual / _pred : 1;
      const _factor = Math.max(1/3, 1 - Math.pow(2 * rho - 1, 3));
      p = pNew;
      lam = Math.max(lam * _factor, 1e-10);
    } else {
      lam = Math.min(lam * 2, 1e7);
    }
    if (Math.max(...delta.map(Math.abs)) < 1e-10) break;
  }
  p = bestP;
  const yMean = yArr.reduce((s, v) => s + v, 0) / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) { ssTot += (yArr[i] - yMean) ** 2; ssRes += (yArr[i] - valFn(xArr[i], ...p)) ** 2; }
  const df = Math.max(1, n - np);
  const sigma2 = ssRes / df;
  const finalJtJ = Array.from({length:np},()=>new Array(np).fill(0));
  for(let i=0;i<n;i++){const jac=jacFn(xArr[i],...p);for(let a=0;a<np;a++) for(let b=0;b<np;b++) finalJtJ[a][b]+=jac[a]*jac[b];}
  const inv=_matInv(finalJtJ);
  const se=inv?inv.map((row,i)=>Math.sqrt(Math.max(0,row[i]*sigma2))):null;
  return { params: p, r2: ssTot > 0 ? 1 - ssRes / ssTot : 0, se, df };
}

function _xAtYMid(xArr, yArr) {
  var minY = Math.min.apply(null, yArr), maxY = Math.max.apply(null, yArr);
  var mid = (minY + maxY) / 2;
  var best = xArr[0], bestDist = Infinity;
  for (var i = 0; i < yArr.length; i++) {
    var d = Math.abs(yArr[i] - mid);
    if (d < bestDist) { bestDist = d; best = xArr[i]; }
  }
  return best;
}

function _fitBest(xArr, yArr, pBase, loBound, hiBound, valFn, jacFn, maxIter) {
  const loEC = loBound[1], hiEC = hiBound[1];
  const evenSeeds = [0.1, 0.3, 0.5, 0.7, 0.9].map(f => loEC + (hiEC - loEC) * f);
  const inflSeed = Math.max(loEC, Math.min(hiEC, _xAtYMid(xArr, yArr)));
  const seeds = [...evenSeeds, inflSeed];
  let best = null;
  for (const ec of seeds) {
    const p = [...pBase];
    p[1] = Math.max(loEC, Math.min(hiEC, ec));
    const r = _lmFit(xArr, yArr, p, loBound, hiBound, valFn, jacFn, maxIter);
    if (!best || r.r2 > best.r2) best = r;
  }
  return best;
}
```

`_solveLin` and `_matInv` above are copied verbatim from `Labcyte_Echo/labcyte_echo.html:1984-2022`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node /tmp/nanobret-fit-test.js`
Expected: `4PL fit test passed. EC50=100.00 r2=1.00000` (or extremely close — noise-free synthetic data should fit almost exactly).

- [ ] **Step 5: Delete the throwaway test file**

```bash
rm /tmp/nanobret-fit-test.js
```

No commit for this task — the verified, corrected (real `_solveLin`/`_matInv`) code is carried into Task 6.

---

### Task 3: App shell — head, theme system, header, tab bar, empty panels

**Files:**
- Create: `NanoBRET/nanobret.html`

This establishes the page skeleton every later task builds inside. Follows `Spectra/spectra.html`'s exact structure (lines 1-65, 298-329, 775-820), re-themed to accent `#5e72c4` and renamed.

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NanoBRET Calculator</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:#f4f5f8;--surface:#ffffff;--surface2:#f0f1f5;--surface3:#e4e6ee;
  --border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);
  --text:#1a1d2e;--text2:#5a5f7a;--text3:#9ca0b8;
  --accent:#5e72c4;--accent-dim:rgba(94,114,196,0.12);
  --good:#2d9462;--mid:#b58830;--poor:#b84545;
  --sans:'IBM Plex Sans',sans-serif;--mono:'IBM Plex Mono',monospace;
  --shadow-xs:0 1px 4px rgba(0,0,0,.04);--shadow-sm:0 2px 8px rgba(0,0,0,.06);
  --shadow-md:0 6px 24px rgba(0,0,0,.09);--shadow-lg:0 16px 48px rgba(0,0,0,.14);
  --shadow-xl:0 32px 80px rgba(0,0,0,.22);--modal-backdrop:rgba(0,0,0,.45);
}
[data-theme="dark"]{
  --bg:#0d0f14;--surface:#13161e;--surface2:#1c2030;--surface3:#252a3a;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#e8eaf2;--text2:#8b90a8;--text3:#4e5368;
  --accent:#5e72c4;--accent-dim:rgba(94,114,196,0.15);
  --good:#6ddca8;--mid:#f8cc6d;--poor:#f89090;
  --shadow-xs:0 1px 4px rgba(0,0,0,.30);--shadow-sm:0 2px 8px rgba(0,0,0,.40);
  --shadow-md:0 6px 24px rgba(0,0,0,.50);--shadow-lg:0 16px 48px rgba(0,0,0,.55);
  --shadow-xl:0 32px 80px rgba(0,0,0,.65);--modal-backdrop:rgba(0,0,0,.65);
}
input::placeholder,textarea::placeholder{color:var(--text3);opacity:1;}

html,body{height:100%;overflow:hidden;}
body{display:flex;flex-direction:column;background:var(--bg);color:var(--text);
  font-family:var(--sans);font-size:14px;-webkit-font-smoothing:antialiased;}

/* HEADER */
header{border-bottom:1px solid var(--border);padding:0 28px;display:flex;
  align-items:center;gap:14px;background:var(--surface);height:58px;flex-shrink:0;}
.logo{width:32px;height:32px;border-radius:7px;background:#5e72c4;display:flex;
  align-items:center;justify-content:center;font-family:var(--mono);font-size:20px;
  font-weight:700;color:#fff;flex-shrink:0;}
.app-name{font-size:15px;font-weight:600;letter-spacing:-0.2px;}
.app-sub{font-size:11px;color:var(--text2);}
.header-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
.opts-btn{background:none;border:1px solid var(--border2);color:var(--text2);
  width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;
  display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;}
.opts-btn:hover{background:var(--surface2);color:var(--text);}
.opts-panel{display:none;position:fixed;top:58px;right:0;background:var(--surface);
  border:1px solid var(--border2);border-radius:0 0 0 10px;padding:14px 18px;
  z-index:200;min-width:170px;box-shadow:0 4px 20px rgba(0,0,0,.15);}
.opts-panel.open{display:block;}
.opts-row{display:flex;align-items:center;justify-content:space-between;gap:20px;}
.opts-label{font-size:13px;color:var(--text2);}
.theme-switch{position:relative;display:inline-block;width:40px;height:22px;}
.theme-switch input{opacity:0;width:0;height:0;}
.theme-slider{position:absolute;cursor:pointer;inset:0;background:var(--surface3);
  border-radius:22px;transition:.2s;border:1px solid var(--border2);}
.theme-slider:before{position:absolute;content:'';height:16px;width:16px;left:2px;
  top:2px;background:var(--text2);border-radius:50%;transition:.2s;}
input:checked + .theme-slider{background:var(--accent);}
input:checked + .theme-slider:before{transform:translateX(18px);background:var(--surface);}

/* TABS */
.tabs{display:flex;gap:2px;padding:0 28px;background:var(--surface);
  border-bottom:1px solid var(--border);flex-shrink:0;overflow-x:auto;position:relative;}
.tab{padding:10px 16px;border:none;background:none;color:var(--text2);
  font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;
  white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
.tab svg{width:15px;height:15px;flex-shrink:0;}
.tab.active{color:var(--accent);border-bottom-color:transparent;}
.tab:hover:not(.active){color:var(--text);}
.tab-indicator{position:absolute;bottom:0;height:2px;background:var(--accent);
  border-radius:1px 1px 0 0;z-index:1;transition:none;}
.tab-indicator.ready{transition:left .22s ease,width .22s ease;}

.content{flex:1;overflow-y:auto;padding:24px 28px;}
.panel{display:none;}
.panel.active{display:block;}

/* SHARED CONTROLS */
.btn{padding:7px 16px;border-radius:7px;border:none;font-family:var(--sans);
  font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s,background .15s;}
.btn-primary{background:var(--accent);color:#fff;}
.btn-primary:hover{opacity:.88;}
.btn-sec{background:var(--surface3);color:var(--text);border:1px solid var(--border2);}
.btn-sec:hover{background:var(--surface2);}
.btn-sm{padding:5px 12px;font-size:12px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;}
.card-hdr{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
  color:var(--text3);margin-bottom:14px;}
.row{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;}
.field{display:flex;flex-direction:column;gap:4px;}
.field label{font-size:11px;color:var(--text3);}
.field input,.field select{min-width:120px;padding:7px 10px;border-radius:7px;
  border:1px solid var(--border2);background:var(--surface);color:var(--text);
  font-family:var(--sans);font-size:13px;outline:none;}
.field input:focus,.field select:focus{border-color:var(--accent);}

.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
  border-radius:20px;font-size:12px;font-weight:600;}
.badge-good{background:rgba(45,148,98,.15);color:var(--good);}
.badge-mid{background:rgba(181,136,48,.15);color:var(--mid);}
.badge-poor{background:rgba(184,69,69,.15);color:var(--poor);}
.badge-neutral{background:var(--surface2);color:var(--text2);}

/* GUIDE (matches suite-wide icon-per-section convention, v1.2.2) */
.guide-section{margin-bottom:24px;}
.guide-section h3{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;
  border-bottom:1px solid var(--border);padding-bottom:6px;display:flex;align-items:center;gap:7px;}
.guide-section h3 svg{flex-shrink:0;width:15px;height:15px;}
.guide-section h4{font-size:12px;font-weight:700;color:var(--text);margin:12px 0 5px;}
.guide-section p,.guide-section li{font-size:12px;color:var(--text2);line-height:1.65;}
.guide-section ul,.guide-section ol{padding-left:18px;margin-top:4px;}
.guide-section li{margin-bottom:3px;}

@media(max-width:720px){
  header{padding:0 16px;}
  .tabs{padding:0 16px;}
  .content{padding:16px;}
  input[type],select,textarea{min-height:36px;}
}
</style>
</head>
<body>

<header>
  <div class="logo">N</div>
  <div>
    <div class="app-name">NanoBRET Calculator</div>
    <div class="app-sub">BRET ratio &middot; mBU &middot; Z&prime;/Z &middot; dose-response</div>
  </div>
  <div class="header-right">
    <button class="opts-btn" id="opts-btn" title="Settings">&#9881;</button>
  </div>
</header>

<div class="opts-panel" id="opts-panel">
  <div class="opts-row">
    <span class="opts-label">Dark mode</span>
    <label class="theme-switch">
      <input type="checkbox" id="theme-chk">
      <span class="theme-slider"></span>
    </label>
  </div>
</div>

<div class="tabs" id="tabs">
  <button class="tab active" data-tab="plate" onclick="switchTab('plate')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate Data</button>
  <button class="tab" data-tab="qc" onclick="switchTab('qc')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 1116 0"/><path d="M12 14l3.5-4.5"/><circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none"/></svg>Endpoint / QC</button>
  <button class="tab" data-tab="dose" onclick="switchTab('dose')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>Dose-Response</button>
  <button class="tab" data-tab="guide" onclick="switchTab('guide')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</button>
  <div class="tab-indicator" id="tab-indicator"></div>
</div>

<div class="content">

<div class="panel active" id="panel-plate"></div>
<div class="panel" id="panel-qc"></div>
<div class="panel" id="panel-dose"></div>
<div class="panel" id="panel-guide"></div>

</div>

<script>
/* ---- shared state ---- */
var state = {
  plateFormat: '96',
  donor: null,
  acceptor: null,
  conditions: [],
  doseRows: [],
  baselineWells: ''
};

/* ---- calculation engine (verified in Task 1) ---- */
function wellToRowCol(wellId) {
  var m = wellId.trim().match(/^([A-P])(\d{1,2})$/i);
  if (!m) return null;
  return { row: m[1].toUpperCase(), col: parseInt(m[2], 10) };
}

function getWellValue(grid, wellId) {
  var rc = wellToRowCol(wellId);
  if (!rc) return null;
  var rowObj = grid.filter(function(r){ return r.label === rc.row; })[0];
  if (!rowObj) return null;
  var v = rowObj.vals[rc.col - 1];
  return (typeof v === 'number' && !isNaN(v)) ? v : null;
}

function getValuesForWells(grid, wellIds) {
  return wellIds.map(function(w){ return getWellValue(grid, w); })
    .filter(function(v){ return v !== null; });
}

function rawRatio(donorVal, acceptorVal) {
  return acceptorVal / donorVal;
}

function mBU(ratio) {
  return ratio * 1000;
}

function meanOf(arr) {
  return arr.reduce(function(s, v){ return s + v; }, 0) / arr.length;
}

function sdOf(arr) {
  if (arr.length < 2) return 0;
  var m = meanOf(arr);
  var variance = arr.reduce(function(s, v){ return s + (v - m) * (v - m); }, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function computeConditionMBUs(donorGrid, acceptorGrid, wellIds) {
  return wellIds.map(function(w){
    var d = getWellValue(donorGrid, w);
    var a = getWellValue(acceptorGrid, w);
    if (d === null || a === null || d === 0 || a === 0) return null;
    return mBU(rawRatio(d, a));
  }).filter(function(v){ return v !== null; });
}

function correctedMBU(meanLigand, meanNoLigand) {
  return meanLigand - meanNoLigand;
}

function zPrimeFactor(sdA, sdB, meanA, meanB) {
  var denom = Math.abs(meanA - meanB);
  if (denom === 0) return null;
  return 1 - (3 * sdA + 3 * sdB) / denom;
}

function parseWellRange(s) {
  s = (s || '').trim();
  var wells = [];
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var colRange = s.match(/^([A-P])(\d+)-([A-P])(\d+)$/i);
  if (colRange && colRange[1].toUpperCase() === colRange[3].toUpperCase()) {
    var row = colRange[1].toUpperCase();
    var cc1 = parseInt(colRange[2], 10), cc2 = parseInt(colRange[4], 10);
    for (var j = Math.min(cc1, cc2); j <= Math.max(cc1, cc2); j++) {
      wells.push(row + (j < 10 ? '0' + j : j));
    }
    return wells;
  }
  if (colRange && colRange[2] === colRange[4]) {
    var col = parseInt(colRange[2], 10);
    var r1 = ROWS.indexOf(colRange[1].toUpperCase());
    var r2 = ROWS.indexOf(colRange[3].toUpperCase());
    for (var i = Math.min(r1, r2); i <= Math.max(r1, r2); i++) {
      wells.push(ROWS[i] + (col < 10 ? '0' + col : col));
    }
    return wells;
  }
  var rect = s.match(/^([A-P])(\d+):([A-P])(\d+)$/i);
  if (rect) {
    var c1 = parseInt(rect[2], 10), c2 = parseInt(rect[4], 10);
    var rr1 = ROWS.indexOf(rect[1].toUpperCase()), rr2 = ROWS.indexOf(rect[3].toUpperCase());
    for (var r = Math.min(rr1, rr2); r <= Math.max(rr1, rr2); r++) {
      for (var c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        wells.push(ROWS[r] + (c < 10 ? '0' + c : c));
      }
    }
    return wells;
  }
  s.split(',').forEach(function(w){
    var m = w.trim().match(/^([A-P])(\d+)$/i);
    if (m) {
      var n = parseInt(m[2], 10);
      wells.push(m[1].toUpperCase() + (n < 10 ? '0' + n : n));
    }
  });
  return wells;
}

function parsePlateCSV(text, format) {
  var dims = format === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var lines = text.trim().split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
  if (lines.length < dims.rows) return null;
  var dataLines = lines;
  var firstCells = lines[0].split(/[\t,;]+/);
  var firstIsHeader = isNaN(parseFloat(firstCells[0])) ||
    firstCells[0].trim().toLowerCase() === '1' ||
    !!firstCells[0].trim().match(/^[a-z]/i);
  if (firstIsHeader) dataLines = lines.slice(1);
  var rowLabels = 'ABCDEFGHIJKLMNOP';
  var rows = [];
  for (var i = 0; i < Math.min(dims.rows, dataLines.length); i++) {
    var cells = dataLines[i].split(/[\t,;]+/);
    var start = cells[0].trim().match(/^[A-P]$/i) ? 1 : 0;
    var vals = [];
    for (var j = start; j < Math.min(start + dims.cols, cells.length); j++) {
      var v = parseFloat(cells[j]);
      vals.push(isNaN(v) ? 0 : v);
    }
    while (vals.length < dims.cols) vals.push(0);
    rows.push({ label: rowLabels[i], vals: vals.slice(0, dims.cols) });
  }
  if (rows.length < dims.rows) return null;
  return rows;
}

/* ---- THEME ---- */
(function(){
  var saved = localStorage.getItem('hub_theme');
  if(saved === 'dark'){
    document.documentElement.setAttribute('data-theme','dark');
    document.getElementById('theme-chk').checked = true;
  }
})();

document.getElementById('theme-chk').addEventListener('change', function(){
  var t = this.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('hub_theme', t);
  if(activeTab === 'dose' && typeof drawDoseChart === 'function') drawDoseChart();
});

document.getElementById('opts-btn').addEventListener('click', function(e){
  e.stopPropagation();
  document.getElementById('opts-panel').classList.toggle('open');
});
document.addEventListener('click', function(){
  document.getElementById('opts-panel').classList.remove('open');
});

/* ---- TABS ---- */
var activeTab = 'plate';
var tabIndicator = document.getElementById('tab-indicator');

function switchTab(name){
  document.querySelectorAll('.tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.panel').forEach(function(p){
    p.classList.toggle('active', p.id === 'panel-' + name);
  });
  activeTab = name;
  updateIndicator();
  if(name === 'dose' && typeof drawDoseChart === 'function' && state.doseRows.length) { setTimeout(drawDoseChart, 50); }
}

function updateIndicator(){
  var activeEl = document.querySelector('.tab.active');
  if(!activeEl) return;
  tabIndicator.style.left = activeEl.offsetLeft + 'px';
  tabIndicator.style.width = activeEl.offsetWidth + 'px';
  tabIndicator.classList.add('ready');
}
window.addEventListener('load', updateIndicator);
window.addEventListener('resize', updateIndicator);
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the file has no syntax errors**

Extract and check the inline `<script>` block with Node (Node tolerates the browser-only `localStorage`/`document` calls failing at *runtime*, but this confirms there's no *syntax* error in the JS):

```bash
node -e "
var fs = require('fs');
var html = fs.readFileSync('NanoBRET/nanobret.html', 'utf8');
var m = html.match(/<script>([\s\S]*)<\/script>/);
new Function(m[1]);
console.log('Script block parses with no syntax errors.');
"
```

Expected: `Script block parses with no syntax errors.`

- [ ] **Step 3: Verify div balance**

```bash
node -e "
var fs = require('fs');
var html = fs.readFileSync('NanoBRET/nanobret.html', 'utf8');
var opens = (html.match(/<div/g) || []).length;
var closes = (html.match(/<\/div>/g) || []).length;
console.log('opens:', opens, 'closes:', closes);
if (opens !== closes) process.exit(1);
"
```

Expected: `opens:` and `closes:` print equal numbers, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add NanoBRET/nanobret.html
git commit -m "Add NanoBRET Calculator app shell (head, theme, tabs, calc engine)"
```

---

### Task 4: Plate Data tab

**Files:**
- Modify: `NanoBRET/nanobret.html`

- [ ] **Step 1: Add CSS** (insert before the `@media(max-width:720px)` block added in Task 3)

```css
/* PLATE DATA */
.plate-upload-zone{border:2px dashed var(--border2);border-radius:10px;padding:24px;
  text-align:center;cursor:pointer;transition:border-color .15s,background .15s;}
.plate-upload-zone:hover,.plate-upload-zone.drag-over{border-color:var(--accent);background:var(--accent-dim);}
.plate-upload-zone p{font-size:13px;color:var(--text2);}
.fmt-btn.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.combined-table{border-collapse:collapse;font-size:11px;font-family:var(--mono);width:100%;}
.combined-table th{padding:4px 6px;text-align:center;font-size:10px;font-weight:700;color:var(--text3);background:var(--surface2);}
.combined-table td{padding:4px 6px;text-align:center;min-width:44px;border:1px solid var(--border);cursor:pointer;transition:background .1s;}
.combined-table td:hover{background:var(--accent-dim);}
.combined-table-wrap{overflow-x:auto;}
```

- [ ] **Step 2: Replace the empty `<div class="panel active" id="panel-plate"></div>`** with:

```html
<div class="panel active" id="panel-plate">
  <div class="card" style="margin-bottom:16px;">
    <div class="card-hdr">Plate format</div>
    <div class="row">
      <button class="btn btn-sec btn-sm fmt-btn active" id="fmt-96" onclick="setPlateFormat('96')">96-well</button>
      <button class="btn btn-sec btn-sm fmt-btn" id="fmt-384" onclick="setPlateFormat('384')">384-well</button>
    </div>
  </div>

  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
    <div class="card" style="flex:1;min-width:260px;">
      <div class="card-hdr">Donor (460nm)</div>
      <div class="plate-upload-zone" id="donor-drop"
        onclick="document.getElementById('donor-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleChannelDrop(event,'donor')">
        <p id="donor-status">Click to upload or drag &amp; drop donor CSV</p>
      </div>
      <input type="file" id="donor-file" accept=".csv,.txt" style="display:none" onchange="handleChannelFile(event,'donor')">
    </div>
    <div class="card" style="flex:1;min-width:260px;">
      <div class="card-hdr">Acceptor (618nm)</div>
      <div class="plate-upload-zone" id="acceptor-drop"
        onclick="document.getElementById('acceptor-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleChannelDrop(event,'acceptor')">
        <p id="acceptor-status">Click to upload or drag &amp; drop acceptor CSV</p>
      </div>
      <input type="file" id="acceptor-file" accept=".csv,.txt" style="display:none" onchange="handleChannelFile(event,'acceptor')">
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">Combined preview — raw ratio (acceptor / donor) per well</div>
    <div id="combined-table-wrap"><p style="font-size:12px;color:var(--text2);">Load or enter donor and acceptor values to see the combined plate preview.</p></div>
  </div>

  <div id="well-editor-backdrop" style="display:none;position:fixed;inset:0;background:var(--modal-backdrop);z-index:300;" onclick="closeWellEditor()">
    <div class="card" style="max-width:280px;margin:120px auto;" onclick="event.stopPropagation()">
      <div class="card-hdr" id="well-editor-title">Edit well</div>
      <div class="row" style="flex-direction:column;align-items:stretch;">
        <div class="field"><label>Donor (460nm)</label><input type="number" id="well-editor-donor" step="any"></div>
        <div class="field"><label>Acceptor (618nm)</label><input type="number" id="well-editor-acceptor" step="any"></div>
      </div>
      <div class="row" style="margin-top:12px;justify-content:flex-end;">
        <button class="btn btn-sec btn-sm" onclick="closeWellEditor()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="saveWellEditor()">Save</button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add JS** (append at the end of the `<script>` block, after the calc-engine functions from Task 3, before the closing `</script>`)

```javascript
var wellEditorTarget = null;

function setPlateFormat(fmt){
  if((state.donor || state.acceptor) && !confirm('Switching plate format clears loaded donor/acceptor data. Continue?')) return;
  state.plateFormat = fmt;
  state.donor = null;
  state.acceptor = null;
  document.getElementById('fmt-96').classList.toggle('active', fmt === '96');
  document.getElementById('fmt-384').classList.toggle('active', fmt === '384');
  document.getElementById('donor-status').textContent = 'Click to upload or drag & drop donor CSV';
  document.getElementById('acceptor-status').textContent = 'Click to upload or drag & drop acceptor CSV';
  renderCombinedTable();
  // Plate format underlies Endpoint/QC and Dose-Response too -- their condition/dose-row
  // well-range inputs are left as-is (not auto-cleared, since a well like "A1-A3" is still
  // valid in either format), but any already-computed results derived from the now-cleared
  // donor/acceptor grids must be invalidated, not left showing stale numbers.
  if(typeof renderQCResults === 'function') renderQCResults();
  lastFitResult = null;
  if(typeof renderDoseResults === 'function') renderDoseResults();
  var doseCanvas = document.getElementById('dose-canvas');
  if(doseCanvas) doseCanvas.getContext('2d').clearRect(0, 0, doseCanvas.width, doseCanvas.height);
}

function handleChannelFile(event, channel){
  var file = event.target.files[0];
  if(file) loadChannelFile(file, channel);
}

function handleChannelDrop(event, channel){
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  var file = event.dataTransfer.files[0];
  if(file) loadChannelFile(file, channel);
}

function loadChannelFile(file, channel){
  var reader = new FileReader();
  reader.onload = function(e){
    var parsed = parsePlateCSV(e.target.result, state.plateFormat);
    if(!parsed){
      alert('Could not parse CSV for the ' + (state.plateFormat === '384' ? '384-well (16x24)' : '96-well (8x12)') + ' format.');
      return;
    }
    state[channel] = parsed;
    document.getElementById(channel + '-status').textContent = file.name;
    renderCombinedTable();
  };
  reader.readAsText(file);
}

function renderCombinedTable(){
  var wrap = document.getElementById('combined-table-wrap');
  if(!state.donor && !state.acceptor){
    wrap.innerHTML = '<p style="font-size:12px;color:var(--text2);">Load or enter donor and acceptor values to see the combined plate preview.</p>';
    return;
  }
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var html = '<div class="combined-table-wrap"><table class="combined-table"><thead><tr><th></th>';
  for(var c = 1; c <= dims.cols; c++) html += '<th>' + c + '</th>';
  html += '</tr></thead><tbody>';
  for(var r = 0; r < dims.rows; r++){
    var rowLabel = ROWS[r];
    html += '<tr><th>' + rowLabel + '</th>';
    for(var c2 = 1; c2 <= dims.cols; c2++){
      var wellId = rowLabel + (c2 < 10 ? '0' + c2 : c2);
      var d = state.donor ? getWellValue(state.donor, wellId) : null;
      var a = state.acceptor ? getWellValue(state.acceptor, wellId) : null;
      var label = (d !== null && a !== null && d !== 0 && a !== 0) ? rawRatio(d, a).toFixed(3) : '–';
      html += '<td onclick="openWellEditor(\'' + wellId + '\')">' + label + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

function openWellEditor(wellId){
  wellEditorTarget = wellId;
  var d = state.donor ? getWellValue(state.donor, wellId) : null;
  var a = state.acceptor ? getWellValue(state.acceptor, wellId) : null;
  document.getElementById('well-editor-title').textContent = 'Edit well ' + wellId;
  document.getElementById('well-editor-donor').value = d !== null ? d : '';
  document.getElementById('well-editor-acceptor').value = a !== null ? a : '';
  document.getElementById('well-editor-backdrop').style.display = 'block';
}

function closeWellEditor(){
  document.getElementById('well-editor-backdrop').style.display = 'none';
  wellEditorTarget = null;
}

function setWellValue(grid, wellId, value){
  var rc = wellToRowCol(wellId);
  if(!rc) return;
  var rowObj = grid.filter(function(r){ return r.label === rc.row; })[0];
  if(!rowObj) return;
  rowObj.vals[rc.col - 1] = value;
}

function ensureGrid(channel){
  if(state[channel]) return state[channel];
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var grid = [];
  for(var i = 0; i < dims.rows; i++){
    grid.push({ label: ROWS[i], vals: new Array(dims.cols).fill(0) });
  }
  state[channel] = grid;
  return grid;
}

function saveWellEditor(){
  if(!wellEditorTarget) return;
  var dVal = parseFloat(document.getElementById('well-editor-donor').value);
  var aVal = parseFloat(document.getElementById('well-editor-acceptor').value);
  if(!isNaN(dVal)) setWellValue(ensureGrid('donor'), wellEditorTarget, dVal);
  if(!isNaN(aVal)) setWellValue(ensureGrid('acceptor'), wellEditorTarget, aVal);
  closeWellEditor();
  renderCombinedTable();
}

renderCombinedTable();
```

- [ ] **Step 4: Verify with a Playwright script** (this app has no DOM test framework, so direct browser verification via Playwright is this project's established equivalent — see `CLAUDE.md`'s past session-log entries for the same pattern used on every other app)

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());

  // Inject synthetic donor/acceptor grids directly (bypasses real file upload, exercises the same render path)
  await page.evaluate(() => {
    state.donor = [{ label: 'A', vals: [100,100,100,100,100,100,100,100,100,100,100,100] }];
    state.acceptor = [{ label: 'A', vals: [50,60,0,0,0,0,0,0,0,0,0,0] }];
    renderCombinedTable();
  });
  const cellA01 = await page.textContent('.combined-table tbody tr:nth-child(1) td:nth-child(2)');
  const cellA03 = await page.textContent('.combined-table tbody tr:nth-child(1) td:nth-child(4)');
  console.log('A01 ratio:', cellA01, '(expect 0.500)');
  console.log('A03 ratio:', cellA03, '(expect – , acceptor is 0)');

  await page.click('#fmt-384');
  const fmt384Active = await page.evaluate(() => document.getElementById('fmt-384').classList.contains('active'));
  console.log('384 toggle active:', fmt384Active, '(expect true)');

  console.log('pageerrors:', errors);
  await browser.close();
})();
"
```

Expected output: `A01 ratio: 0.500`, `A03 ratio: –`, `384 toggle active: true`, `pageerrors: []`.

- [ ] **Step 5: Commit**

```bash
git add NanoBRET/nanobret.html
git commit -m "Add Plate Data tab: format toggle, dual CSV import, combined preview, well editor"
```

---

### Task 5: Endpoint / QC tab

**Files:**
- Modify: `NanoBRET/nanobret.html`

Two roles cover both the protocol's QC framing and the optional treated/untreated framing from the spec, since the Z′ formula is identical either way — `'ligand'` ("+Ligand / Treated") and `'background'` ("No-Ligand / Untreated"). Each `'ligand'` condition picks one `'background'` condition to pair against via `bgId`.

- [ ] **Step 1: Replace the empty `<div class="panel" id="panel-qc"></div>`** with:

```html
<div class="panel" id="panel-qc">
  <div class="row" style="margin-bottom:16px;">
    <button class="btn btn-primary btn-sm" onclick="addCondition('ligand')">+ Ligand/Treated condition</button>
    <button class="btn btn-sec btn-sm" onclick="addCondition('background')">+ No-Ligand/Untreated condition</button>
  </div>
  <div id="qc-conditions-wrap" style="margin-bottom:20px;"></div>
  <div class="card-hdr">Results</div>
  <div id="qc-results-wrap"></div>
</div>
```

- [ ] **Step 2: Add JS** (append to `<script>`, after Task 4's functions)

```javascript
function addCondition(role){
  var id = 'c' + Date.now() + Math.floor(Math.random() * 1000);
  var n = state.conditions.filter(function(c){ return c.role === role; }).length + 1;
  var cond = {
    id: id,
    name: role === 'ligand' ? 'Condition ' + n : 'Background ' + n,
    role: role,
    wells: '',
    bgId: null
  };
  state.conditions.push(cond);
  renderConditions();
}

function removeCondition(id){
  state.conditions = state.conditions.filter(function(c){ return c.id !== id; });
  state.conditions.forEach(function(c){ if(c.bgId === id) c.bgId = null; });
  renderConditions();
}

function updateConditionField(id, field, value){
  var cond = state.conditions.filter(function(c){ return c.id === id; })[0];
  if(!cond) return;
  cond[field] = value;
  renderConditions();
}

function computeConditionStats(cond){
  var wellIds = parseWellRange(cond.wells);
  var mbus = (state.donor && state.acceptor) ? computeConditionMBUs(state.donor, state.acceptor, wellIds) : [];
  return { mean: mbus.length ? meanOf(mbus) : null, sd: mbus.length > 1 ? sdOf(mbus) : 0, n: mbus.length };
}

function escapeAttr(s){
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderConditions(){
  var wrap = document.getElementById('qc-conditions-wrap');
  if(!state.conditions.length){
    wrap.innerHTML = '<p style="font-size:12px;color:var(--text2);">Add a +Ligand/Treated condition and a No-Ligand/Untreated background condition to begin.</p>';
  } else {
    var html = '';
    state.conditions.forEach(function(cond){
      html += '<div class="card" style="margin-bottom:10px;"><div class="row">';
      html += '<div class="field"><label>Name</label><input type="text" value="' + escapeAttr(cond.name) + '" onchange="updateConditionField(\'' + cond.id + '\',\'name\',this.value)"></div>';
      html += '<div class="field"><label>Role</label><select onchange="updateConditionField(\'' + cond.id + '\',\'role\',this.value)">';
      html += '<option value="ligand"' + (cond.role === 'ligand' ? ' selected' : '') + '>+Ligand / Treated</option>';
      html += '<option value="background"' + (cond.role === 'background' ? ' selected' : '') + '>No-Ligand / Untreated</option>';
      html += '</select></div>';
      html += '<div class="field"><label>Wells</label><input type="text" placeholder="A1-A3" value="' + escapeAttr(cond.wells) + '" onchange="updateConditionField(\'' + cond.id + '\',\'wells\',this.value)"></div>';
      if(cond.role === 'ligand'){
        html += '<div class="field"><label>Background</label><select onchange="updateConditionField(\'' + cond.id + '\',\'bgId\',this.value)"><option value="">— none —</option>';
        state.conditions.filter(function(c){ return c.role === 'background'; }).forEach(function(bg){
          html += '<option value="' + bg.id + '"' + (cond.bgId === bg.id ? ' selected' : '') + '>' + escapeAttr(bg.name) + '</option>';
        });
        html += '</select></div>';
      }
      html += '<button class="btn btn-sec btn-sm" onclick="removeCondition(\'' + cond.id + '\')">Remove</button>';
      html += '</div></div>';
    });
    wrap.innerHTML = html;
  }
  renderQCResults();
}

function renderQCResults(){
  var resWrap = document.getElementById('qc-results-wrap');
  var ligands = state.conditions.filter(function(c){ return c.role === 'ligand' && c.bgId; });
  if(!ligands.length){
    resWrap.innerHTML = '<p style="font-size:12px;color:var(--text2);">No paired +Ligand/Background conditions yet.</p>';
    return;
  }
  var html = '';
  ligands.forEach(function(cond){
    var bg = state.conditions.filter(function(c){ return c.id === cond.bgId; })[0];
    if(!bg) return;
    var sA = computeConditionStats(cond);
    var sB = computeConditionStats(bg);
    if(sA.mean === null || sB.mean === null){
      html += '<div class="card" style="margin-bottom:10px;"><div class="card-hdr">' + escapeAttr(cond.name) + ' vs ' + escapeAttr(bg.name) + '</div><p style="font-size:12px;color:var(--text2);">Load plate data and well ranges to compute.</p></div>';
      return;
    }
    var corrected = correctedMBU(sA.mean, sB.mean);
    var zp = zPrimeFactor(sA.sd, sB.sd, sA.mean, sB.mean);
    var badgeClass = zp === null ? 'badge-neutral' : (zp >= 0.5 ? 'badge-good' : (zp >= 0 ? 'badge-mid' : 'badge-poor'));
    html += '<div class="card" style="margin-bottom:10px;">';
    html += '<div class="card-hdr">' + escapeAttr(cond.name) + ' vs ' + escapeAttr(bg.name) + '</div><div class="row">';
    html += '<div><div style="font-size:11px;color:var(--text3);">Mean mBU (' + escapeAttr(cond.name) + ')</div><div style="font-family:var(--mono);font-size:16px;">' + sA.mean.toFixed(1) + ' ± ' + sA.sd.toFixed(1) + '</div></div>';
    html += '<div><div style="font-size:11px;color:var(--text3);">Mean mBU (' + escapeAttr(bg.name) + ')</div><div style="font-family:var(--mono);font-size:16px;">' + sB.mean.toFixed(1) + ' ± ' + sB.sd.toFixed(1) + '</div></div>';
    html += '<div><div style="font-size:11px;color:var(--text3);">Corrected mBU</div><div style="font-family:var(--mono);font-size:16px;">' + corrected.toFixed(1) + '</div></div>';
    html += '<div><span class="badge ' + badgeClass + '">Z′ = ' + (zp === null ? 'n/a' : zp.toFixed(3)) + '</span></div>';
    html += '</div></div>';
  });
  resWrap.innerHTML = html;
}

renderConditions();
```

- [ ] **Step 3: Verify with a Playwright script**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());

  // Switch to the Endpoint/QC tab first — panel-qc is display:none until its
  // tab is active, so the +Ligand/+Background buttons inside it are not
  // clickable from the default 'plate' tab (Playwright times out waiting
  // for visibility otherwise).
  await page.click('button[data-tab=\"qc\"]');

  await page.evaluate(() => {
    state.donor = [
      { label: 'A', vals: [1000,1000,1000,1000,1000,0,0,0,0,0,0,0] },
      { label: 'B', vals: [1000,1000,1000,1000,1000,0,0,0,0,0,0,0] }
    ];
    state.acceptor = [
      { label: 'A', vals: [820,840,810,830,825,0,0,0,0,0,0,0] },
      { label: 'B', vals: [120,130,110,125,115,0,0,0,0,0,0,0] }
    ];
  });
  await page.click('button[onclick=\"addCondition(\\'ligand\\')\"]');
  await page.click('button[onclick=\"addCondition(\\'background\\')\"]');
  await page.evaluate(() => {
    state.conditions[0].wells = 'A1-A5';
    state.conditions[1].wells = 'B1-B5';
    state.conditions[0].bgId = state.conditions[1].id;
    renderConditions();
  });
  const corrected = await page.textContent('#qc-results-wrap .card div:nth-of-type(3) div:nth-of-type(2)');
  const badge = await page.textContent('#qc-results-wrap .badge');
  console.log('corrected mBU:', corrected, '(expect 705.0)');
  console.log('Z-prime badge:', badge, '(expect Z′ = 0.919)');
  console.log('pageerrors:', errors);
  await browser.close();
})();
"
```

Expected output: `corrected mBU: 705.0`, `Z-prime badge: Z′ = 0.919`, `pageerrors: []`.

- [ ] **Step 4: Commit**

```bash
git add NanoBRET/nanobret.html
git commit -m "Add Endpoint/QC tab: named conditions, corrected mBU, Z-prime/Z factor"
```

---

### Task 6: Dose-Response tab

**Files:**
- Modify: `NanoBRET/nanobret.html`

Reuses the 4PL fitter from Task 2 (`_4plVal4`, `_4plJac4`, `_fitBest`, plus their dependencies `_solveLin`/`_matInv`/`_lmFit`/`_xAtYMid` — all five must already be present in the file from Task 2; if Task 2's code was never pasted into `nanobret.html`, paste it now as part of this task before proceeding, since Task 2 only verified it in a throwaway `/tmp` script).

- [ ] **Step 1: Add the 4PL fitter to the `<script>` block** (verbatim from Task 2, paste after the calc-engine functions from Task 3/Task1)

```javascript
function _4plVal4(xi, bot, logec50, h, top) {
  return bot + (top - bot) / (1 + Math.pow(10, h * (xi - logec50)));
}

function _4plJac4(xi, bot, logec50, h, top) {
  const ln10 = Math.LN10;
  const E = Math.pow(10, h * (xi - logec50));
  const denom = (1 + E) * (1 + E);
  return [E / (1 + E), (top - bot) * h * ln10 * E / denom, -(top - bot) * (xi - logec50) * ln10 * E / denom, 1 / (1 + E)];
}

function _solveLin(A, b) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < n; col++) {
    let mx = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[mx][col])) mx = r;
    [M[col], M[mx]] = [M[mx], M[col]];
    if (Math.abs(M[col][col]) < 1e-14) return null;
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) M[k][n] -= M[k][i] * x[i];
  }
  return x;
}

function _matInv(A) {
  const n=A.length;
  const M=A.map((row,i)=>[...row,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let col=0;col<n;col++){
    let maxRow=col;
    for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[maxRow][col])) maxRow=r;
    [M[col],M[maxRow]]=[M[maxRow],M[col]];
    if(Math.abs(M[col][col])<1e-14) return null;
    const piv=M[col][col];
    for(let j=0;j<2*n;j++) M[col][j]/=piv;
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const f=M[r][col];
      for(let j=0;j<2*n;j++) M[r][j]-=f*M[col][j];
    }
  }
  return M.map(row=>row.slice(n));
}

function _xAtYMid(xArr, yArr) {
  var minY = Math.min.apply(null, yArr), maxY = Math.max.apply(null, yArr);
  var mid = (minY + maxY) / 2;
  var best = xArr[0], bestDist = Infinity;
  for (var i = 0; i < yArr.length; i++) {
    var d = Math.abs(yArr[i] - mid);
    if (d < bestDist) { bestDist = d; best = xArr[i]; }
  }
  return best;
}

function _lmFit(xArr, yArr, pInit, loBound, hiBound, valFn, jacFn, maxIter) {
  const n = xArr.length, np = pInit.length;
  const cl = (v, i) => Math.max(loBound[i], Math.min(hiBound[i], v));
  let p = pInit.map(cl);
  const ssq = (pp) => { let s = 0; for (let i = 0; i < n; i++) { const r = yArr[i] - valFn(xArr[i], ...pp); s += r * r; } return s; };
  let lam = 0.001, bestP = [...p], bestSS = ssq(p);

  for (let iter = 0; iter < maxIter; iter++) {
    const JtJ = Array.from({ length: np }, () => new Array(np).fill(0));
    const Jtr = new Array(np).fill(0);
    for (let i = 0; i < n; i++) {
      const res = yArr[i] - valFn(xArr[i], ...p);
      const jac = jacFn(xArr[i], ...p);
      for (let a = 0; a < np; a++) {
        Jtr[a] += jac[a] * res;
        for (let b = 0; b < np; b++) JtJ[a][b] += jac[a] * jac[b];
      }
    }
    const _gradNorm = Math.max(...Jtr.map(Math.abs));
    if (_gradNorm < 1e-8 * (1 + Math.abs(bestSS))) break;
    const A = JtJ.map((row, i) => row.map((v, j) => i === j ? v * (1 + lam) : v));
    const delta = _solveLin(A, Jtr);
    if (!delta) { lam = Math.min(lam * 10, 1e8); continue; }
    const pNew = p.map((v, i) => cl(v + delta[i], i));
    const newSS = ssq(pNew);
    const curSS = ssq(p);
    if (newSS < bestSS) { bestSS = newSS; bestP = [...pNew]; }
    if (newSS < curSS) {
      let _pred = 0;
      for (let a = 0; a < np; a++) _pred += delta[a] * (lam * delta[a] + Jtr[a]);
      _pred *= 0.5;
      const _actual = curSS - newSS;
      const rho = _pred > 1e-12 ? _actual / _pred : 1;
      const _factor = Math.max(1/3, 1 - Math.pow(2 * rho - 1, 3));
      p = pNew;
      lam = Math.max(lam * _factor, 1e-10);
    } else {
      lam = Math.min(lam * 2, 1e7);
    }
    if (Math.max(...delta.map(Math.abs)) < 1e-10) break;
  }
  p = bestP;
  const yMean = yArr.reduce((s, v) => s + v, 0) / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) { ssTot += (yArr[i] - yMean) ** 2; ssRes += (yArr[i] - valFn(xArr[i], ...p)) ** 2; }
  const df = Math.max(1, n - np);
  const sigma2 = ssRes / df;
  const finalJtJ = Array.from({length:np},()=>new Array(np).fill(0));
  for(let i=0;i<n;i++){const jac=jacFn(xArr[i],...p);for(let a=0;a<np;a++) for(let b=0;b<np;b++) finalJtJ[a][b]+=jac[a]*jac[b];}
  const inv=_matInv(finalJtJ);
  const se=inv?inv.map((row,i)=>Math.sqrt(Math.max(0,row[i]*sigma2))):null;
  return { params: p, r2: ssTot > 0 ? 1 - ssRes / ssTot : 0, se, df };
}

function _fitBest(xArr, yArr, pBase, loBound, hiBound, valFn, jacFn, maxIter) {
  const loEC = loBound[1], hiEC = hiBound[1];
  const evenSeeds = [0.1, 0.3, 0.5, 0.7, 0.9].map(f => loEC + (hiEC - loEC) * f);
  const inflSeed = Math.max(loEC, Math.min(hiEC, _xAtYMid(xArr, yArr)));
  const seeds = [...evenSeeds, inflSeed];
  let best = null;
  for (const ec of seeds) {
    const p = [...pBase];
    p[1] = Math.max(loEC, Math.min(hiEC, ec));
    const r = _lmFit(xArr, yArr, p, loBound, hiBound, valFn, jacFn, maxIter);
    if (!best || r.r2 > best.r2) best = r;
  }
  return best;
}
```

- [ ] **Step 2: Replace the empty `<div class="panel" id="panel-dose"></div>`** with:

```html
<div class="panel" id="panel-dose">
  <div class="card" style="margin-bottom:16px;">
    <div class="card-hdr">Shared no-ligand baseline</div>
    <div class="field"><label>Wells</label><input type="text" placeholder="H1-H3" oninput="updateBaselineWells(this.value)"></div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-hdr">Dose series</div>
    <div id="dose-rows-wrap" style="margin-bottom:10px;"></div>
    <div class="row">
      <button class="btn btn-sec btn-sm" onclick="addDoseRow()">+ Dose point</button>
      <button class="btn btn-primary btn-sm" onclick="computeDoseResponse()">Compute fit</button>
    </div>
  </div>
  <div class="card">
    <div class="card-hdr">Fit results</div>
    <div id="dose-results-wrap" style="margin-bottom:14px;"></div>
    <canvas id="dose-canvas" width="600" height="320" style="max-width:100%;border-radius:8px;"></canvas>
  </div>
</div>
```

- [ ] **Step 3: Add JS** (append to `<script>`, after Task 5's functions)

```javascript
function addDoseRow(){
  var id = 'd' + Date.now() + Math.floor(Math.random() * 1000);
  state.doseRows.push({ id: id, conc: '', wells: '' });
  renderDoseRows();
}

function removeDoseRow(id){
  state.doseRows = state.doseRows.filter(function(r){ return r.id !== id; });
  renderDoseRows();
}

function updateDoseField(id, field, value){
  var row = state.doseRows.filter(function(r){ return r.id === id; })[0];
  if(!row) return;
  row[field] = value;
  renderDoseRows();
}

function updateBaselineWells(value){
  state.baselineWells = value;
}

function renderDoseRows(){
  var wrap = document.getElementById('dose-rows-wrap');
  if(!state.doseRows.length){
    wrap.innerHTML = '<p style="font-size:12px;color:var(--text2);">Add dose points (concentration + wells) to begin.</p>';
    return;
  }
  var html = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr>' +
    '<th style="text-align:left;padding:4px 8px;font-size:11px;color:var(--text3);">Concentration</th>' +
    '<th style="text-align:left;padding:4px 8px;font-size:11px;color:var(--text3);">Wells</th><th></th></tr></thead><tbody>';
  state.doseRows.forEach(function(row){
    html += '<tr>' +
      '<td style="padding:4px 8px;"><input type="number" step="any" value="' + escapeAttr(row.conc) + '" onchange="updateDoseField(\'' + row.id + '\',\'conc\',this.value)" style="width:100%;"></td>' +
      '<td style="padding:4px 8px;"><input type="text" placeholder="A1-A3" value="' + escapeAttr(row.wells) + '" onchange="updateDoseField(\'' + row.id + '\',\'wells\',this.value)" style="width:100%;"></td>' +
      '<td style="padding:4px 8px;"><button class="btn btn-sec btn-sm" onclick="removeDoseRow(\'' + row.id + '\')">×</button></td></tr>';
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

var lastFitResult = null;

function computeDoseResponse(){
  if(!state.donor || !state.acceptor){
    alert('Load donor and acceptor plate data first (Plate Data tab).');
    return;
  }
  var baselineWellIds = parseWellRange(state.baselineWells);
  var baselineMBUs = computeConditionMBUs(state.donor, state.acceptor, baselineWellIds);
  if(!baselineMBUs.length){
    alert('Enter a valid shared baseline well range.');
    return;
  }
  var baselineMean = meanOf(baselineMBUs);

  var points = [];
  state.doseRows.forEach(function(row){
    var conc = parseFloat(row.conc);
    if(isNaN(conc) || conc <= 0) return;
    var wellIds = parseWellRange(row.wells);
    var mbus = computeConditionMBUs(state.donor, state.acceptor, wellIds);
    if(!mbus.length) return;
    var corrected = correctedMBU(meanOf(mbus), baselineMean);
    points.push({ conc: conc, logConc: Math.log10(conc), corrected: corrected });
  });

  if(points.length < 4){
    alert('Need at least 4 valid dose points with data to fit a curve.');
    return;
  }

  points.sort(function(a, b){ return a.conc - b.conc; });
  var xArr = points.map(function(p){ return p.logConc; });
  var yArr = points.map(function(p){ return p.corrected; });
  var yMin = Math.min.apply(null, yArr), yMax = Math.max.apply(null, yArr);
  var xMinArr = Math.min.apply(null, xArr), xMaxArr = Math.max.apply(null, xArr);
  var loBound = [yMin - Math.abs(yMin) - 1, xMinArr - 2, 0.1, yMax];
  var hiBound = [yMax, xMaxArr + 2, 5, yMax + Math.abs(yMax) * 2 + 10];
  var pBase = [yMin, (xMinArr + xMaxArr) / 2, 1, yMax];

  var fit = _fitBest(xArr, yArr, pBase, loBound, hiBound, _4plVal4, _4plJac4, 1000);
  lastFitResult = { points: points, fit: fit };
  renderDoseResults();
  drawDoseChart();
}

function renderDoseResults(){
  var wrap = document.getElementById('dose-results-wrap');
  if(!lastFitResult){ wrap.innerHTML = ''; return; }
  var fit = lastFitResult.fit;
  var ec50 = Math.pow(10, fit.params[1]);
  var badgeClass = fit.r2 >= 0.9 ? 'badge-good' : (fit.r2 >= 0.7 ? 'badge-mid' : 'badge-poor');
  wrap.innerHTML =
    '<div class="row">' +
    '<div><div style="font-size:11px;color:var(--text3);">IC50 / EC50</div><div style="font-family:var(--mono);font-size:18px;">' + ec50.toPrecision(4) + '</div></div>' +
    '<div><span class="badge ' + badgeClass + '">R² = ' + fit.r2.toFixed(3) + '</span></div>' +
    '</div>';
}

function drawDoseChart(){
  if(!lastFitResult) return;
  var canvas = document.getElementById('dose-canvas');
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var pad = 40;
  var points = lastFitResult.points;
  var xs = points.map(function(p){ return p.logConc; });
  var ys = points.map(function(p){ return p.corrected; });
  var xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
  var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys);
  var yPad = (yMax - yMin) * 0.15 || 10;
  yMin -= yPad; yMax += yPad;

  function toPx(x, y){
    return [
      pad + (x - xMin) / (xMax - xMin) * (w - 2 * pad),
      h - pad - (y - yMin) / (yMax - yMin) * (h - 2 * pad)
    ];
  }

  var textColor = getComputedStyle(document.documentElement).getPropertyValue('--text2').trim();
  var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.stroke();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  var fit = lastFitResult.fit;
  for(var i = 0; i <= 100; i++){
    var xi = xMin + (xMax - xMin) * i / 100;
    var yi = _4plVal4(xi, fit.params[0], fit.params[1], fit.params[2], fit.params[3]);
    var px = toPx(xi, yi);
    if(i === 0) ctx.moveTo(px[0], px[1]); else ctx.lineTo(px[0], px[1]);
  }
  ctx.stroke();

  ctx.fillStyle = accentColor;
  points.forEach(function(p){
    var px = toPx(p.logConc, p.corrected);
    ctx.beginPath();
    ctx.arc(px[0], px[1], 4, 0, 2 * Math.PI);
    ctx.fill();
  });
}

renderDoseRows();
```

- [ ] **Step 4: Verify with a Playwright script**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());

  // Switch to the Dose-Response tab first — panel-dose is display:none until
  // its tab is active, so its buttons are not clickable from the default
  // 'plate' tab (same class of bug as Task 5's verification script: Playwright
  // times out waiting for visibility otherwise).
  await page.click('button[data-tab=\"dose\"]');

  await page.evaluate(() => {
    var concs = [1,3,10,30,100,300,1000,3000];
    var trueBottom = 100, trueTop = 950, trueLogEC50 = 2, trueHill = 1;
    var acceptorRow = concs.map(function(c){
      return _4plVal4(Math.log10(c), trueBottom, trueLogEC50, trueHill, trueTop);
    });
    state.donor = [
      { label: 'G', vals: [1000,1000,1000,1000,1000,1000,1000,1000,0,0,0,0] },
      { label: 'H', vals: [1000,0,0,0,0,0,0,0,0,0,0,0] }
    ];
    state.acceptor = [
      { label: 'G', vals: acceptorRow.concat([0,0,0,0]) },
      { label: 'H', vals: [100,0,0,0,0,0,0,0,0,0,0,0] }
    ];
    state.baselineWells = 'H1';
    state.doseRows = concs.map(function(c, i){ return { id: 'd' + i, conc: String(c), wells: 'G' + (i + 1) }; });
  });
  await page.click('button[onclick=\"computeDoseResponse()\"]');
  const ec50Text = await page.textContent('#dose-results-wrap div div:nth-of-type(2)');
  const r2Badge = await page.textContent('#dose-results-wrap .badge');
  console.log('EC50:', ec50Text, '(expect ~100.0)');
  console.log('R2 badge:', r2Badge, '(expect R² = 1.000)');
  console.log('pageerrors:', errors);
  await browser.close();
})();
"
```

Expected output: `EC50: 100.0` (or extremely close, e.g. `99.99`–`100.0`), `R2 badge: R² = 1.000`, `pageerrors: []`.

- [ ] **Step 5: Commit**

```bash
git add NanoBRET/nanobret.html
git commit -m "Add Dose-Response tab: dose series, shared baseline, 4PL fit, IC50/EC50 chart"
```

---

### Task 7: Guide tab

**Files:**
- Modify: `NanoBRET/nanobret.html`

Five icon-headed static sections, matching the suite-wide Guide-tab convention shipped in v1.2.2 (`.guide-section h3 svg`, established in `Spectra/spectra.html:210-218`). No new CSS needed — `.guide-section` rules already exist from Task 3.

- [ ] **Step 1: Replace the empty `<div class="panel" id="panel-guide"></div>`** with:

```html
<div class="panel" id="panel-guide">
  <div style="font-size:17px;font-weight:600;color:var(--text);margin-bottom:3px;">NanoBRET Calculator — User Guide</div>
  <div style="font-size:12px;color:var(--text3);margin-bottom:28px;">BRET ratio, mBU, Z′/Z factor &amp; 4PL dose-response fitting for the Promega NanoBRET™ PPI assay (TM439)</div>

  <div class="guide-section">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate Data</h3>
    <p>Choose 96-well (8×12) or 384-well (16×24) format first — switching formats clears loaded data. Import a CSV for the donor (NanoLuc, 460nm) channel and a separate CSV for the acceptor (HaloTag-ligand, 618nm) channel; each should have plate-shaped rows (letters) × columns (numbers), matching the same layout PHERAstar/plate-reader exports use elsewhere in this suite.</p>
    <p>The combined preview shows the raw ratio (acceptor ÷ donor) for every well. Click any well to manually enter or override its donor/acceptor values — useful for spot-fixing a handful of wells without re-importing a whole CSV.</p>
  </div>

  <div class="guide-section">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 1116 0"/><path d="M12 14l3.5-4.5"/><circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none"/></svg>Endpoint / QC conditions</h3>
    <p>Define one or more <b>+Ligand / Treated</b> conditions and one or more <b>No-Ligand / Untreated</b> background conditions. Each condition needs a well range using the same syntax as the rest of the suite: <b>A1-A3</b> (row range), <b>A1:B3</b> (rectangular block), or <b>A1,B2,C3</b> (comma-separated list).</p>
    <p>Pair each +Ligand condition with a background condition using the <b>Background</b> dropdown — this is what's subtracted to get corrected mBU.</p>
  </div>

  <div class="guide-section">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>Reading Z′ / Z</h3>
    <p>Z′/Z factor measures assay quality from the spread between a positive and negative condition:</p>
    <div style="font-family:var(--mono);font-size:12px;background:var(--surface2);padding:8px 10px;border-radius:6px;margin:8px 0;">Z′ = 1 − [3×SD(+Ligand) + 3×SD(No-Ligand)] / |Mean(+Ligand) − Mean(No-Ligand)|</div>
    <ul>
      <li><span class="badge badge-good" style="padding:2px 8px;">≥ 0.5</span> excellent separation, assay is reliable</li>
      <li><span class="badge badge-mid" style="padding:2px 8px;">0 – 0.5</span> marginal — usable but noisy</li>
      <li><span class="badge badge-poor" style="padding:2px 8px;">&lt; 0</span> the two populations overlap too much to trust</li>
    </ul>
  </div>

  <div class="guide-section">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>Dose-Response fitting</h3>
    <p>One shared <b>No-Ligand baseline</b> well range is subtracted from every dose point's mean mBU — only the compound concentration should vary between dose rows, all of which still contain ligand. Add at least 4 dose points (concentration + well range) and click <b>Compute fit</b> to run a 4-parameter logistic fit and extract IC50/EC50, plotted against log-concentration.</p>
    <p>R² below ~0.7 (red badge) means the fit is unreliable — check for missing wells, a baseline that doesn't match the dose-series plate, or too few dose points spanning the inflection.</p>
  </div>

  <div class="guide-section">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11.2V16h6v-1.8A6 6 0 0012 3z"/></svg>What NanoBRET measures</h3>
    <p>NanoBRET detects protein:protein interaction via bioluminescence resonance energy transfer (BRET) between a NanoLuc® donor fusion (emits ~460nm) and a HaloTag® acceptor fusion labeled with a fluorescent ligand (emits ~618nm). When the two fusion partners interact, the donor's energy transfers to the acceptor, raising the 618nm:460nm signal ratio. mBU (milliBRET Units) is simply that raw ratio × 1000, giving a more convenient scale to work with.</p>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add NanoBRET/nanobret.html
git commit -m "Add Guide tab with icon-headed sections"
```

---

### Task 8: Hub integration

**Files:**
- Modify: `hub-shell.html`
- Modify: `embed.py`

- [ ] **Step 1: Add the home-card markup** in `hub-shell.html`, immediately after the Fabricata™ card (after the closing `</div>` at line 626, before the `</div>` at line 628 that closes the card grid):

```html
      <div class="card" tabindex="0" data-app-id="nanobret"
           onclick="openApp('nanobret')"
           onkeydown="if(event.key==='Enter')openApp('nanobret')">
        <div class="card-header-row">
          <div class="card-logo" style="background:#5e72c4;"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="12" r="5" stroke="white" stroke-width="1.6"/><circle cx="16" cy="12" r="5" stroke="white" stroke-width="1.6" opacity="0.7"/><path d="M9.5 12h4" stroke="white" stroke-width="1.6" stroke-linecap="round"/><path d="M12.5 10l2 2-2 2" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>
          <div class="card-name">NanoBRET Calculator</div>
        </div>
        <div class="card-desc">Promega NanoBRET™ PPI assay calculator: raw ratio, mBU, corrected mBU, Z&prime;/Z factor QC, and 4PL dose-response fitting for IC50/EC50.</div>
        <div class="card-foot">
          <span>BRET &middot; Z&prime;/Z &middot; Dose-Response</span>
          <span class="card-arrow">&#8594;</span>
        </div>
      </div>
```

- [ ] **Step 2: Add the app-view iframe**, immediately after `<div class="app-view" id="view-fabricata">...</div>` (after line 665, before the blank line and `<canvas id="confetti-canvas">` at line 667):

```html
<div class="app-view" id="view-nanobret">
  <iframe id="frame-nanobret" sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups allow-top-navigation-by-user-activation"></iframe>
</div>
```

- [ ] **Step 3: Add the `APP_B64_NEW` entry**, in the `var APP_B64_NEW = { ... }` line:

Change:
```javascript
var APP_B64_NEW = { dna: "", pd: "", pt: "", spectra: "PLACEHOLDER_SPECTRA", ldi: "PLACEHOLDER_LDI", cryo: "PLACEHOLDER_CRYO", cuppa: "PLACEHOLDER_CUPPA", fabricata: "PLACEHOLDER_FABRICATA" };
```
to:
```javascript
var APP_B64_NEW = { dna: "", pd: "", pt: "", spectra: "PLACEHOLDER_SPECTRA", ldi: "PLACEHOLDER_LDI", cryo: "PLACEHOLDER_CRYO", cuppa: "PLACEHOLDER_CUPPA", fabricata: "PLACEHOLDER_FABRICATA", nanobret: "PLACEHOLDER_NANOBRET" };
```

- [ ] **Step 4: Add the `APP_INFO` entry**, in the `var APP_INFO = { ... }` block:

Change:
```javascript
  cuppa:      { letter:'C', color:'#8d6e63', name:'Cuppa' },
  fabricata:  { letter:'F', color:'#c07a8e', name:'Fabricata™' }
};
```
to:
```javascript
  cuppa:      { letter:'C', color:'#8d6e63', name:'Cuppa' },
  fabricata:  { letter:'F', color:'#c07a8e', name:'Fabricata™' },
  nanobret:   { letter:'N', color:'#5e72c4', name:'NanoBRET Calculator' }
};
```

- [ ] **Step 4.5: Add `nanobret` to the app-unlock-word gating system**

`hub-shell.html` has an `ALL_APP_IDS` array and an `APP_UNLOCK_WORDS` map (added after this plan was first drafted) that every other app participates in — cards stay hidden until their unlock word is typed or an admin is signed in. Skipping this step leaves the new card permanently visible to every visitor, unlike all 11 other apps. Find:

```javascript
var ALL_APP_IDS = ['echo','lm','deg','pd','dna','pt','spectra','ldi','cryo','cuppa','fabricata'];
```
change to:
```javascript
var ALL_APP_IDS = ['echo','lm','deg','pd','dna','pt','spectra','ldi','cryo','cuppa','fabricata','nanobret'];
```

Find the `APP_UNLOCK_WORDS` object's closing entries (the line with `fabricata` and the closing `};`) and add a `nanobret` entry following the suite's one-word-per-app convention:
```javascript
  nanobret:   'nanoluc'
```

- [ ] **Step 5: Register the app in `embed.py`**

Change the `APPS` list:
```python
APPS = [
    ('echo', 'Labcyte_Echo/labcyte_echo.html'),
    ('deg',  'Degradation_Explorer/degradation_visualizer.html'),
    ('lm',   'Labmate/labmate.html'),
    ('pd',   'Plate_Designer/plate_designer.html'),
    ('dna',  'Helix/helix.html'),
    ('pt',   'Protein_Tools/protein_tools.html'),
    ('spectra', 'Spectra/spectra.html'),
    ('ldi',     'LDI/ldi.html'),
    ('cryo',    'Cryostorage/cryostorage.html'),
    ('cuppa',      'Cuppa/cuppa.html'),
    ('fabricata',  'DataFaker/fabricata.html'),
]
```
to:
```python
APPS = [
    ('echo', 'Labcyte_Echo/labcyte_echo.html'),
    ('deg',  'Degradation_Explorer/degradation_visualizer.html'),
    ('lm',   'Labmate/labmate.html'),
    ('pd',   'Plate_Designer/plate_designer.html'),
    ('dna',  'Helix/helix.html'),
    ('pt',   'Protein_Tools/protein_tools.html'),
    ('spectra', 'Spectra/spectra.html'),
    ('ldi',     'LDI/ldi.html'),
    ('cryo',    'Cryostorage/cryostorage.html'),
    ('cuppa',      'Cuppa/cuppa.html'),
    ('fabricata',  'DataFaker/fabricata.html'),
    ('nanobret',   'NanoBRET/nanobret.html'),
]
```

- [ ] **Step 6: Rebuild and verify**

```bash
python3 embed.py
```

Expected: a line `nanobret: 1 replacement(s)` among the output, and the final `Output: ... (X chars)` line with no errors. If `nanobret: 0 replacement(s)` prints instead, the `APP_B64_NEW` placeholder string added in Step 3 doesn't match what `embed.py`'s regex expects — double check the key name `nanobret` is spelled identically in both files.

`"The Hub.html"` is listed in `.gitignore` ("Generated — do not commit") — do not `git add` it; only `hub-shell.html` and `embed.py` are source-controlled.

- [ ] **Step 7: Commit**

```bash
git add hub-shell.html embed.py
git commit -m "Wire NanoBRET Calculator into the Hub shell"
```

---

### Task 9: Version bump, changelog, CLAUDE.md app table

**Files:**
- Modify: `hub-shell.html`
- Modify: `CLAUDE.md`

**Note:** `CLAUDE.md`'s "Session log" section (under the `<!-- AUTO-UPDATED by .claude/stop-hook.sh — do not edit this section manually -->` comment, currently starting at line 259) is written automatically by a stop-hook at the end of a session — do not hand-edit it as part of this task. Only the "Current apps" table (lines 19-33) is touched here.

- [ ] **Step 1: Bump the version string** in `hub-shell.html`

Change (line 339):
```html
<span class="opts-version">The Hub &middot; v1.2.2</span>
```
to:
```html
<span class="opts-version">The Hub &middot; v1.2.3</span>
```

- [ ] **Step 2: Add a changelog entry**, immediately before the existing `v1.2.2` entry (line 343):

Change:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.2.2 &mdash; 22 Jun 2026</strong><br>
```
to:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.2.3 &mdash; 22 Jun 2026</strong><br>
    &#9679; New app: <b>NanoBRET Calculator</b> &mdash; BRET ratio, mBU, Z&prime;/Z factor QC and 4PL dose-response fitting (IC50/EC50) for the Promega NanoBRET&trade; PPI assay<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.2.2 &mdash; 22 Jun 2026</strong><br>
```

- [ ] **Step 3: Add a row to `CLAUDE.md`'s "Current apps" table**

Change (line 32-33):
```markdown
| `cuppa` | Cuppa | SVG coffee cup | `#8d6e63` | `Cuppa/cuppa.html` |
| `fabricata` | Fabricata™ | SVG bar chart + star | `#c07a8e` | `DataFaker/fabricata.html` |
```
to:
```markdown
| `cuppa` | Cuppa | SVG coffee cup | `#8d6e63` | `Cuppa/cuppa.html` |
| `fabricata` | Fabricata™ | SVG bar chart + star | `#c07a8e` | `DataFaker/fabricata.html` |
| `nanobret` | NanoBRET Calculator | SVG donor/acceptor BRET glyph | `#5e72c4` | `NanoBRET/nanobret.html` |
```

- [ ] **Step 4: Rebuild and commit**

```bash
python3 embed.py
git add hub-shell.html CLAUDE.md
git commit -m "Bump to v1.2.3: NanoBRET Calculator changelog entry + app table"
```

---

### Task 10: Final cross-tab verification

**Files:** none modified — this task only verifies `NanoBRET/nanobret.html` end-to-end, matching the manual-Playwright-pass convention used at the end of every prior round in this suite (see `CLAUDE.md`'s session log for precedent).

- [ ] **Step 1: Desktop, light theme — all 4 tabs, zero console errors**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  for (const tab of ['plate', 'qc', 'dose', 'guide']) {
    await page.click('button[data-tab=\"' + tab + '\"]');
    await page.screenshot({ path: '/tmp/nanobret-' + tab + '-light-desktop.png' });
  }
  console.log('desktop/light pageerrors:', errors);
  await browser.close();
})();
"
```

Expected: `desktop/light pageerrors: []`. Visually inspect the 4 screenshots in `/tmp/` for layout issues (overlapping text, unstyled elements, broken icons).

- [ ] **Step 2: Desktop, dark theme — all 4 tabs**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  await page.click('#opts-btn');
  await page.click('.theme-slider'); // #theme-chk itself is visually hidden (opacity:0); click its visible sibling
  for (const tab of ['plate', 'qc', 'dose', 'guide']) {
    await page.click('button[data-tab=\"' + tab + '\"]');
    await page.screenshot({ path: '/tmp/nanobret-' + tab + '-dark-desktop.png' });
  }
  console.log('desktop/dark pageerrors:', errors);
  await browser.close();
})();
"
```

Expected: `desktop/dark pageerrors: []`. Check that every panel actually re-themes (no hardcoded light-only colors left over from copy-pasted Echo/Spectra code).

- [ ] **Step 3: Mobile viewport — all 4 tabs**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://$(pwd)/NanoBRET/nanobret.html');
  for (const tab of ['plate', 'qc', 'dose', 'guide']) {
    await page.click('button[data-tab=\"' + tab + '\"]');
    await page.screenshot({ path: '/tmp/nanobret-' + tab + '-mobile.png' });
  }
  console.log('mobile pageerrors:', errors);
  await browser.close();
})();
"
```

Expected: `mobile pageerrors: []`. Check the tab bar scrolls horizontally rather than wrapping/clipping, and the combined-preview table and dose-series table both fit inside `overflow-x:auto` rather than breaking page width.

- [ ] **Step 4: Confirm the Hub shell itself loads the app with no errors**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://$(pwd)/The Hub.html');
  // nanobret's card is gated behind the unlock-word system (added after this plan was first
  // drafted) -- unlock it directly rather than typing its word, then re-render the home grid.
  await page.evaluate(() => { _unlockedApps.add('nanobret'); applyLabConfig(); });
  await page.click('[data-app-id=\"nanobret\"]');
  await page.waitForTimeout(500);
  const frameVisible = await page.isVisible('#frame-nanobret');
  console.log('nanobret frame visible:', frameVisible, '(expect true)');
  console.log('hub pageerrors:', errors);
  await browser.close();
})();
"
```

Expected: `nanobret frame visible: true`, `hub pageerrors: []`.

- [ ] **Step 5: Clean up screenshots and report**

```bash
rm -f /tmp/nanobret-*.png
```

No commit for this task (verification only, no file changes).

---

## Self-Review

**1. Spec coverage** — checked every section of `docs/superpowers/specs/2026-06-22-nanobret-calculator-design.md` against this plan:
- Purpose/out-of-scope (DSA mode, kinetic time-course, multi-compound comparison) — honored by omission; no task implements any of these.
- Architecture (4 tabs, one-way data derivation, single HTML file, Hub integration pattern) — Tasks 3, 8.
- Plate Data tab (format toggle, dual CSV import, combined preview, manual per-well edit) — Task 4.
- Endpoint/QC tab (named conditions, well-range reuse, +Ligand/No-Ligand roles, raw ratio/mBU/mean/SD/corrected mBU, Z′ formula, Z factor framing, traffic-light badges) — Task 5.
- Dose-Response tab (single compound per analysis, dose series + shared baseline, 4PL fit reuse, IC50/EC50, R² confidence) — Task 6.
- Guide tab (icon-headed sections, BRET science explainer) — Task 7.
- App identity (id, name, accent, tab icons, home card) — Tasks 3 (tab icons + accent), 8 (home card).
- Testing section's call for hand-calculated synthetic-data verification of pure functions — Tasks 1 and 2 (Node scripts with the exact hand-calculated values from the spec's own worked example).

No spec requirement was found without a corresponding task.

**2. Placeholder scan** — no "TBD"/"TODO" strings, no "add appropriate error handling" hand-waves; every step shows complete, runnable code or an exact command with an exact expected output. The one near-miss (Task 2's `_solveLin`/`_matInv`) was caught and replaced with the real verbatim implementation from `Labcyte_Echo/labcyte_echo.html:1984-2022` rather than left as a "go look it up" instruction.

**3. Type consistency** — `state` shape (`plateFormat`, `donor`, `acceptor`, `conditions`, `doseRows`, `baselineWells`) is declared once in Task 3 and used identically in Tasks 4-6; no field is renamed across tasks. `getWellValue`/`setWellValue`/`ensureGrid` all use the same `{ label, vals }` row-object shape produced by `parsePlateCSV`. Condition objects (`{ id, name, role, wells, bgId }`) and dose-row objects (`{ id, conc, wells }`) are each defined once (Task 5, Task 6) and not redefined elsewhere. The 4PL fitter's call signature (`_fitBest(xArr, yArr, pBase, loBound, hiBound, valFn, jacFn, maxIter)` returning `{ params, r2, se, df }`) is identical between Task 2's test and Task 6's real usage.

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-nanobret-calculator.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
