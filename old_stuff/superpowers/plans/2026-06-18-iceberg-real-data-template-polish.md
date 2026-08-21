# Iceberg Real Data, Grid Template & Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed Iceberg with Jon's real freezer/cryo-tank data (admin-only), add a downloadable multi-tab xlsx template whose grid tabs round-trip through Import, and apply a "frosted/icy" visual polish pass to the Boxes view.

**Architecture:** Everything lives in the single file `Cryostorage/cryostorage.html` (the app's existing self-contained pattern). No data-model changes — the app's `box.vials[pos]` shape already fits both real box layouts. Three independent additions: (1) a static `SEED_DATA` object + admin-gated seeding call in init, (2) a grid-sheet detector added as a fallback inside the existing `importXLSX()`, used both by re-imported templates and exercised by a new `downloadTemplate()` generator, (3) CSS-only visual changes to existing selectors.

**Tech Stack:** Vanilla HTML/CSS/JS (ES5-style, matches existing file), SheetJS (`XLSX` global, already loaded via CDN `<script>` tag), Playwright (already a local devDependency in this project) for verification, `embed.py` for the Hub rebuild.

**Important — commits/push:** Per the design discussion, do **not** run `git commit` or `git push` until every task below passes verification. Task 7 is the single commit point; pushing happens only after the user explicitly confirms (Task 7, last step).

---

### Task 1: Seed data + admin-gated seeding

**Files:**
- Modify: `Cryostorage/cryostorage.html:563` (insert after `function loadState(){...}` ends, before `function uid(){...}`)
- Modify: `Cryostorage/cryostorage.html:1409-1410` (insert the seeding call between `loadState();` and `switchTab('minus80');`)

- [ ] **Step 1: Insert the `SEED_DATA` object and seeding functions**

Insert this block immediately after the closing `}` of `loadState()` (currently line 563) and before `function uid(){...}` (currently line 564):

```js
// ─── REAL DATA SEED (admin-only) ───────────────────────────────────────────
// Derived once from "Freezer and Cryo Boxes Jon.xlsx" (-80 Jon Box 1/2, Cryo
// Storage Jon). 'X' cells in the source meant "vial taken" and were dropped.
// Trailing "P##*" meant "passage counted after de-frosting, original freeze
// passage unknown" — folded into notes; '*' itself is not stored anywhere.
var SEED_DATA = {
  minus80: {
    label: '−80°C',
    racks: [{
      id: 'seed-rack-m80',
      name: 'Right-hand −80°C, bottom Eisai',
      boxes: [
        {
          id: 'seed-box-m80-1', name: 'Box 1', rows: 9, cols: 9,
          vials: {
            A1: { cellLine: 'HCT-116', passage: 'P21', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            A2: { cellLine: 'MIA PaCa-2, RBM39-HiBiT #26', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            A3: { cellLine: 'HEK293, BRD4-HiBiT', passage: 'P26', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            A6: { cellLine: 'HCT116, DCAF15 KO #15 JMM06 Pool', passage: 'P26', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            A9: { cellLine: 'HEK293, CRBN KO C30 (AITANA)', passage: 'P8', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            B5: { cellLine: 'A549', passage: 'P8', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            B8: { cellLine: 'MIA PaCa-2', passage: 'P6', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            B9: { cellLine: 'HEK293, CRBN KO C12', passage: 'P11', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            C4: { cellLine: 'HCT116, G246V gRNA1 Pool', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            C7: { cellLine: 'HCT116, DCAF15 KO #15 JMM05 C16', passage: 'P5', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: 'Passage counted after de-frosting — original freeze passage unknown.' },
            D3: { cellLine: 'HCT116, DCAF15 KO #15', passage: 'P12', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            D6: { cellLine: 'HCT-116, RBM39-HiBiT 2x Pool', passage: 'P27', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            F4: { cellLine: 'HCT116, G246V gRNA2 Pool', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            F6: { cellLine: 'HCT116, DCAF15 KO #15 JMM06 C19', passage: 'P5', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: 'Passage counted after de-frosting — original freeze passage unknown.' },
            G3: { cellLine: 'HEK293, CRBN KO C12', passage: 'P10', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            G5: { cellLine: 'HCT116, DCAF15 KO #15 JMM05 Pool', passage: 'P26', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            I3: { cellLine: 'HEK293 FT', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
            I7: { cellLine: 'HEK293, VHL KO #24 (AITANA)', passage: 'P7', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' }
          }
        },
        {
          id: 'seed-box-m80-2', name: 'Box 2', rows: 9, cols: 9,
          vials: {
            A1: { cellLine: 'HCT-116, RBM39 G268V, C5', passage: 'P12', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: 'Passage counted after de-frosting — original freeze passage unknown.' },
            A2: { cellLine: 'HEK293T, SMARCA4-HB', passage: 'P2', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: 'Passage counted after de-frosting — original freeze passage unknown.' },
            E1: { cellLine: 'HCT-116, RBM39 G268V, C5', passage: 'P13', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: 'Passage counted after de-frosting — original freeze passage unknown.' }
          }
        }
      ]
    }]
  },
  n2: {
    label: 'Liquid N₂',
    racks: [{
      id: 'seed-rack-n2',
      name: 'Middle right N₂ tank › Yellow Ribbon Rack',
      boxes: [{
        id: 'seed-box-n2-12', name: 'CeTPD BOX 12', rows: 10, cols: 10,
        vials: {
          A1: { cellLine: 'MIA PaCa-2, RBM39-HiBiT, #8', passage: 'P3', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          A3: { cellLine: 'MIA PaCa-2, RBM39-HiBiT #49', passage: 'P4', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          A5: { cellLine: 'MIA PaCa-2, RBM39-HiBiT #26', passage: 'P4', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B1: { cellLine: 'MIA PaCa-2', passage: 'P6', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B3: { cellLine: 'A549', passage: 'P8', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B4: { cellLine: 'HCT-116 DCAF15 KO #15', passage: 'P12', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B5: { cellLine: 'HCT-116 DCAF15 KO #15, JMM05 #16', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B7: { cellLine: 'HCT-116 DCAF15 KO #15, JMM06 #19', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          B9: { cellLine: 'HEK293, CRBN KO, #12', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          C1: { cellLine: 'HCT-116, RBM39 G268V, #5', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          C3: { cellLine: 'HEK293FT', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' },
          C4: { cellLine: 'HEK293T, SMARCA4-HiBiT', passage: '', freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: '' }
        }
      }]
    }]
  }
};

function _hasAnyVials(st){
  return ['minus80', 'n2'].some(function(tab){
    var s = st.storages[tab];
    return s && s.racks && s.racks.some(function(r){ return r.boxes && r.boxes.length > 0; });
  });
}
function maybeSeedRealData(){
  try {
    if (_hasAnyVials(state)) return; // user already has local data — never overwrite
    if (!(window.parent && window.parent.isAdmin === true)) return; // not Jon — stay blank
    state.storages = JSON.parse(JSON.stringify(SEED_DATA));
    saveState();
  } catch (e) {}
}
```

- [ ] **Step 2: Wire the seeding call into init**

Find the init block at the end of the file (currently lines 1408-1410):

```js
// ─── INIT ──────────────────────────────────────────────────────────────────
loadState();
switchTab('minus80');
```

Replace with:

```js
// ─── INIT ──────────────────────────────────────────────────────────────────
loadState();
maybeSeedRealData();
switchTab('minus80');
```

- [ ] **Step 3: Verify with `node --check`**

Run: `node --check "Cryostorage/cryostorage.html"`

This will fail because the file is HTML, not pure JS — instead, extract and check just the script block:

Run: `node -e "var fs=require('fs'); var html=fs.readFileSync('Cryostorage/cryostorage.html','utf8'); var m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('OK');"`

Expected: `OK` (no `SyntaxError`)

- [ ] **Step 4: Verify blank-by-default behavior (no admin flag)**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const racks = await page.evaluate(() => state.storages.minus80.racks.length + state.storages.n2.racks.length);
  console.log('racks (should be 0):', racks);
  await browser.close();
})();
"
```
Expected: `racks (should be 0): 0` — confirms standalone (no `window.parent.isAdmin`) stays blank.

- [ ] **Step 5: Verify seeding fires when admin flag is set**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.addInitScript(() => { window.isAdmin = true; });
  // Load as an iframe-like top window where window.parent === window, so window.parent.isAdmin === window.isAdmin
  await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const counts = await page.evaluate(() => ({
    m80: Object.keys(state.storages.minus80.racks[0].boxes[0].vials).length + Object.keys(state.storages.minus80.racks[0].boxes[1].vials).length,
    n2: Object.keys(state.storages.n2.racks[0].boxes[0].vials).length
  }));
  console.log(JSON.stringify(counts));
  await browser.close();
})();
"
```
Expected: `{"m80":21,"n2":12}` (18 + 3 = 21 vials across the two −80 boxes, 12 in the N₂ box).

- [ ] **Step 6: If both checks pass, leave staged but do not commit yet** (commit happens in Task 7).

---

### Task 2: Grid-sheet detector + `importXLSX()` fallback

**Files:**
- Modify: `Cryostorage/cryostorage.html:1267` (insert helper functions before `function importXLSXBtn(){...}`)
- Modify: `Cryostorage/cryostorage.html:1295` (replace the early-return line inside `importXLSX()`'s per-sheet loop)

- [ ] **Step 1: Insert the grid-detection helpers**

Insert this block immediately before `function importXLSXBtn(){ document.getElementById('import-file').click(); }` (currently line 1267):

```js
// ─── GRID-FORMAT IMPORT (fallback when a sheet isn't flat-table shaped) ────
function _isLetterLabel(v){ return typeof v === 'string' && /^[A-Z]\d{1,2}$/.test(v.trim()); }
function _isIntCell(v){ return typeof v === 'number' && Number.isInteger(v) && v > 0; }
function _parseGridCellText(raw){
  if (raw == null) return null;
  var s = String(raw).trim();
  if (!s || s.toUpperCase() === 'X') return null;
  var joined = s.split(/\r?\n/).map(function(p){ return p.trim(); }).filter(Boolean).join(', ');
  var m = joined.match(/,?\s*(P\d+)(\*)?\s*$/);
  var cellLine = joined, passage = '', notes = '';
  if (m) {
    passage = m[1];
    cellLine = joined.slice(0, m.index).trim();
    if (m[2]) notes = 'Passage counted after de-frosting — original freeze passage unknown.';
  }
  return { cellLine: cellLine, passage: passage, freezeDate: '', freezeMedia: '', cultureMedia: '', frozenBy: '', vialCount: 1, notes: notes };
}
function _detectGridSheet(aoa){
  var vials = {};
  var maxLetterCode = 0, maxNum = 0, found = false;
  for (var r = 0; r < aoa.length; r++) {
    var row = aoa[r] || [];
    var letterCells = [];
    for (var c = 0; c < row.length; c++) {
      if (_isLetterLabel(row[c])) letterCells.push({ c: c, label: String(row[c]).trim() });
    }
    if (letterCells.length >= 3) {
      found = true;
      var contentRow = aoa[r + 1] || [];
      letterCells.forEach(function(lc){
        var parsed = _parseGridCellText(contentRow[lc.c]);
        var letter = lc.label.charCodeAt(0) - 64;
        var num = parseInt(lc.label.slice(1), 10);
        if (letter > maxLetterCode) maxLetterCode = letter;
        if (num > maxNum) maxNum = num;
        if (parsed) vials[lc.label] = parsed;
      });
      continue;
    }
    var bestRun = [], curRun = [];
    for (var c2 = 0; c2 < row.length; c2++) {
      var v = row[c2];
      if (_isIntCell(v)) {
        if (curRun.length && v === curRun[curRun.length - 1].n + 1) curRun.push({ c: c2, n: v });
        else curRun = [{ c: c2, n: v }];
        if (curRun.length > bestRun.length) bestRun = curRun;
      } else {
        curRun = [];
      }
    }
    if (bestRun.length >= 3) {
      found = true;
      var wrap = bestRun.length;
      var contentRow2 = aoa[r + 1] || [];
      bestRun.forEach(function(rc){
        var parsed = _parseGridCellText(contentRow2[rc.c]);
        var rowIdx = Math.floor((rc.n - 1) / wrap);
        var colIdx = ((rc.n - 1) % wrap) + 1;
        var pos = String.fromCharCode(65 + rowIdx) + colIdx;
        if (rowIdx + 1 > maxLetterCode) maxLetterCode = rowIdx + 1;
        if (colIdx > maxNum) maxNum = colIdx;
        if (parsed) vials[pos] = parsed;
      });
    }
  }
  if (!found) return null;
  return { rows: maxLetterCode, cols: maxNum, vials: vials };
}
```

- [ ] **Step 2: Wire the fallback into `importXLSX()`**

Find this line inside `importXLSX()` (currently line 1295):

```js
        if (idx.pos < 0 || idx.cellLine < 0) return;
```

Replace with:

```js
        if (idx.pos < 0 || idx.cellLine < 0) {
          var grid = _detectGridSheet(aoa);
          if (!grid) return;
          var sname2 = sheetName.toLowerCase();
          var tab2 = /n2|nitrogen|liquid/.test(sname2) ? 'n2' : 'minus80';
          var storage2 = state.storages[tab2];
          var rackName2 = 'Imported';
          for (var hr = 0; hr < Math.min(aoa.length, 8); hr++) {
            var line = String((aoa[hr] && (aoa[hr][0] || aoa[hr][1])) || '');
            var hm = line.match(/^(?:TOWER|LOCATION):\s*(.+)$/i);
            if (hm) { rackName2 = hm[1].trim(); break; }
          }
          var rack2 = storage2.racks.find(function(r){ return r.name === rackName2; });
          if (!rack2) { rack2 = { id: uid(), name: rackName2, boxes: [] }; storage2.racks.push(rack2); }
          var boxName2 = sheetName;
          var box2 = rack2.boxes.find(function(b){ return b.name === boxName2; });
          if (!box2) { box2 = { id: uid(), name: boxName2, rows: grid.rows, cols: grid.cols, vials: {} }; rack2.boxes.push(box2); }
          Object.keys(grid.vials).forEach(function(pos){ box2.vials[pos] = grid.vials[pos]; added++; });
          return;
        }
```

(`added` is already declared as `var added = 0, skipped = 0;` earlier in `importXLSX()` — confirm this is still true at this line before editing; it is, in the existing code.)

- [ ] **Step 3: Verify with the same script-extraction check**

Run: `node -e "var fs=require('fs'); var html=fs.readFileSync('Cryostorage/cryostorage.html','utf8'); var m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('OK');"`

Expected: `OK`

- [ ] **Step 4: Verify grid detection against the real source-shaped data, in-browser**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    var aoa = [
      [], ['','-80 Test'], [], ['','USER: Test'], ['','TOWER: Test Tower'], ['','BOX NUMBER: 1'],
      ['', 'A1','B1','C1'], ['', 'HCT-116\nP21','X','MIA PaCa-2\nP6*']
    ];
    return _detectGridSheet(aoa);
  });
  console.log(JSON.stringify(result));
  await browser.close();
})();
"
```
Expected: `{"rows":3,"cols":1,"vials":{"A1":{"cellLine":"HCT-116","passage":"P21",...},"C1":{"cellLine":"MIA PaCa-2","passage":"P6",...,"notes":"Passage counted after de-frosting — original freeze passage unknown."}}}` — `B1` absent (was `'X'`).

(The content row needs the same leading blank gutter cell as the label row, since `_detectGridSheet` reads `contentRow[lc.c]` by column index, not by position within the row. `rows` = letter axis count, `cols` = numeric axis count — 3 distinct letters (A/B/C), 1 distinct number ("1") — consistent with how `box.rows`/`box.cols` are used elsewhere in this file, e.g. "this box has N rows (A–...)".)

---

### Task 3: Download template button + generator

**Files:**
- Modify: `Cryostorage/cryostorage.html:316-317` (insert new opts-row button)
- Modify: `Cryostorage/cryostorage.html:1266` (insert generator functions after `exportAllXLSX()`, before `importXLSXBtn()`)

- [ ] **Step 1: Add the button to the Options panel**

Find (currently lines 314-319):

```html
  <div class="opts-row" style="margin-top:10px;">
    <button class="tb-btn" style="width:100%;justify-content:center;" onclick="exportAllXLSX()">Export all (.xlsx)</button>
  </div>
  <div class="opts-row" style="margin-top:8px;">
    <button class="tb-btn" style="width:100%;justify-content:center;" onclick="importXLSXBtn()">Import (.xlsx / .csv)</button>
  </div>
```

Replace with:

```html
  <div class="opts-row" style="margin-top:10px;">
    <button class="tb-btn" style="width:100%;justify-content:center;" onclick="exportAllXLSX()">Export all (.xlsx)</button>
  </div>
  <div class="opts-row" style="margin-top:8px;">
    <button class="tb-btn" style="width:100%;justify-content:center;" onclick="downloadTemplate()">Download template (.xlsx)</button>
  </div>
  <div class="opts-row" style="margin-top:8px;">
    <button class="tb-btn" style="width:100%;justify-content:center;" onclick="importXLSXBtn()">Import (.xlsx / .csv)</button>
  </div>
```

- [ ] **Step 2: Insert the generator functions**

Insert immediately after the closing `}` of `exportAllXLSX()` (currently line 1266) and before `function importXLSXBtn(){...}`:

```js
// ─── DOWNLOAD TEMPLATE ──────────────────────────────────────────────────────
function _buildLetterGridSheet(rows, cols, locLabel){
  var aoa = [[], ['', 'Box name'], ['', 'USER:'], ['', locLabel + ':'], ['', 'BOX NUMBER:'], []];
  var merges = [];
  for (var r = 0; r < rows; r++) {
    var labelRow = [''];
    for (var c = 1; c <= cols; c++) labelRow.push(String.fromCharCode(65 + r) + c);
    aoa.push(labelRow);
    var startContentRow = aoa.length;
    for (var cr = 0; cr < 3; cr++) aoa.push(['']);
    for (var c2 = 1; c2 <= cols; c2++) merges.push({ s: { r: startContentRow, c: c2 }, e: { r: startContentRow + 2, c: c2 } });
  }
  var ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  return ws;
}
function _buildNumberedGridSheet(rows, cols, locLabel){
  var aoa = [[], ['', 'USER:'], ['', locLabel + ':'], []];
  var merges = [];
  var n = 1;
  for (var r = 0; r < rows; r++) {
    var labelRow = [''];
    for (var c = 0; c < cols; c++) labelRow.push(n++);
    aoa.push(labelRow);
    var startContentRow = aoa.length;
    for (var cr = 0; cr < 3; cr++) aoa.push(['']);
    for (var c2 = 1; c2 <= cols; c2++) merges.push({ s: { r: startContentRow, c: c2 }, e: { r: startContentRow + 2, c: c2 } });
  }
  var ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  return ws;
}
function downloadTemplate(){
  if (typeof XLSX === 'undefined') { toast('XLSX library not loaded'); return; }
  var wb = XLSX.utils.book_new();
  var tableRows = [
    ['Rack', 'Box', 'Position', 'Cell line', 'Passage', 'Freeze date', 'Freezing media', 'Culture media / conditions', 'Frozen by', 'Vials', 'Notes'],
    ['Shelf 1', 'Box 01', 'A1', 'HeLa', 'P12', '2026-01-15', 'DMEM+10%FBS+10%DMSO', 'DMEM+10%FBS', 'JM', 2, ''],
    ['Shelf 1', 'Box 01', 'B1', 'U2OS', 'P8', '2026-02-03', 'DMEM+15%FBS+10%DMSO', 'DMEM+10%FBS', 'JM', 1, '']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tableRows), 'Table format');
  XLSX.utils.book_append_sheet(wb, _buildLetterGridSheet(9, 9, 'TOWER'), 'Grid - lettered');
  XLSX.utils.book_append_sheet(wb, _buildNumberedGridSheet(10, 10, 'LOCATION'), 'Grid - numbered');
  XLSX.writeFile(wb, 'iceberg_template.xlsx');
  toast('Template downloaded');
}
```

- [ ] **Step 3: Verify script validity**

Run: `node -e "var fs=require('fs'); var html=fs.readFileSync('Cryostorage/cryostorage.html','utf8'); var m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('OK');"`

Expected: `OK`

- [ ] **Step 4: Verify the template has 3 correctly-shaped sheets**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true, downloadsPath:'/tmp'});
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => downloadTemplate())
  ]);
  const path = await download.path();
  const buf = require('fs').readFileSync(path);
  const wbInfo = await page.evaluate((b64) => {
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var wb = XLSX.read(arr, { type: 'array' });
    return wb.SheetNames;
  }, buf.toString('base64'));
  console.log(JSON.stringify(wbInfo));
  await browser.close();
})();
"
```
Expected: `["Table format","Grid - lettered","Grid - numbered"]`

- [ ] **Step 5: Verify round-trip — fill a couple of grid cells, re-import, confirm positions land correctly**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const bytes = await page.evaluate(() => {
    var ws = _buildLetterGridSheet(9, 9, 'TOWER');
    // Simulate hand-filling: row label 'A1' is in the label row, value goes 1 row below, same column.
    // Label row for r=0 is aoa index 6 (after the 6 header rows), content starts at index 7.
    XLSX.utils.sheet_add_aoa(ws, [['Test Line\nP9']], { origin: { r: 7, c: 1 } });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '-80 Hand Filled');
    var bin = XLSX.write(wb, { type: 'binary' });
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i) & 0xff;
    return Array.from(arr);
  });
  // Build a File-like Blob and feed it through importXLSX's reader path by calling importXLSX directly with a Blob.
  await page.evaluate((arr) => {
    var blob = new Blob([new Uint8Array(arr)]);
    return new Promise((resolve) => { importXLSX(blob); setTimeout(resolve, 200); });
  }, bytes);
  await page.waitForTimeout(200);
  const a1 = await page.evaluate(() => {
    var rack = state.storages.minus80.racks.find(r => r.name === 'Imported');
    var box = rack && rack.boxes.find(b => b.name === '-80 Hand Filled');
    return box && box.vials['A1'];
  });
  console.log(JSON.stringify(a1));
  await browser.close();
})();
"
```
Expected: `{"cellLine":"Test Line","passage":"P9",...}` confirming the hand-filled grid cell round-tripped through `downloadTemplate()`'s layout and `importXLSX()`'s grid detector into the correct position.

---

### Task 4: Visual polish (frosted/icy)

**Files:**
- Modify: `Cryostorage/cryostorage.html:96-97` (`.stat-card` / `.stat-card:hover`)
- Modify: `Cryostorage/cryostorage.html:115` (`.box-card`)
- Modify: `Cryostorage/cryostorage.html:124` (`.box-preview .pw`)
- Modify: `Cryostorage/cryostorage.html:194` (`.empty-state`)

- [ ] **Step 1: Update `.stat-card`**

Find (currently lines 96-97):

```css
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;transition:border-color .15s,transform .15s;}
.stat-card:hover{border-color:var(--border2);}
```

Replace with:

```css
.stat-card{background:linear-gradient(135deg,var(--surface) 0%,var(--accent-dim) 140%);border:1px solid var(--border);border-radius:10px;padding:12px 16px;transition:border-color .15s,transform .15s,box-shadow .15s;box-shadow:var(--shadow-xs);}
.stat-card:hover{border-color:var(--border2);box-shadow:var(--shadow-sm);}
```

- [ ] **Step 2: Update `.box-card` with a radial glow**

Find (currently line 115):

```css
.box-card{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .18s,transform .12s,box-shadow .18s,background .18s;position:relative;overflow:hidden;}
```

Replace with:

```css
.box-card{background:linear-gradient(135deg,var(--surface2) 0%,var(--accent-dim) 160%);border:1px solid var(--border);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .18s,transform .12s,box-shadow .18s,background .18s;position:relative;overflow:hidden;}
.box-card::before{content:'';position:absolute;top:-30px;right:-30px;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,var(--accent-dim),transparent 70%);pointer-events:none;}
```

- [ ] **Step 3: Soften the mini preview wells**

Find (currently line 124):

```css
.box-preview .pw{width:100%;aspect-ratio:1;border-radius:1px;background:var(--surface3);}
```

Replace with:

```css
.box-preview .pw{width:100%;aspect-ratio:1;border-radius:2px;background:var(--surface3);}
```

- [ ] **Step 4: Give empty states the same gradient card treatment**

Find (currently line 194):

```css
.empty-state{padding:60px 20px;text-align:center;color:var(--text3);animation:fadeIn .4s;}
```

Replace with:

```css
.empty-state{padding:60px 20px;text-align:center;color:var(--text3);animation:fadeIn .4s;background:linear-gradient(135deg,var(--surface) 0%,var(--accent-dim) 160%);border:1px solid var(--border);border-radius:14px;}
```

(No separate dark-theme override is needed: `--accent-dim` already has a darker-tuned value under `[data-theme="dark"]` (`rgba(0,172,193,0.18)` vs light's `0.10`), so the gradient automatically adapts.)

- [ ] **Step 5: Visual check — screenshot both themes**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  for (const theme of ['light','dark']) {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    await page.addInitScript((t) => { localStorage.setItem('hub_theme', t); }, theme);
    await page.goto('file://' + process.cwd() + '/Cryostorage/cryostorage.html');
    await page.waitForTimeout(300);
    await page.click('text=+ Add your first rack');
    await page.fill('#rf-name', 'Demo rack');
    await page.click('#rack-modal .tb-btn.primary');
    await page.waitForTimeout(200);
    await page.click('text=+ Box');
    await page.click('#box-modal .tb-btn.primary');
    await page.waitForTimeout(200);
    await page.screenshot({path: '/tmp/iceberg_polish_' + theme + '.png'});
    await page.close();
  }
  await browser.close();
})();
"
```
Expected: two screenshots saved; manually inspect `/tmp/iceberg_polish_light.png` and `/tmp/iceberg_polish_dark.png` for the gradient/glow rendering without clipping or contrast issues (read them with the Read tool after this script runs).

---

### Task 5: Rebuild Hub, bump version, update changelog

**Files:**
- Modify: `hub-shell.html:338` (version string)
- Modify: `hub-shell.html:341-342` (changelog — insert new top entry)
- Modify: `CLAUDE.md` (session log — prepend new entry)
- Run: `python3 embed.py`

- [ ] **Step 1: Bump the version string**

Find (currently line 338):

```html
    <span class="opts-version">The Hub &middot; v1.1.1</span>
```

Replace with:

```html
    <span class="opts-version">The Hub &middot; v1.1.2</span>
```

- [ ] **Step 2: Add the new changelog entry**

Find (currently lines 341-342):

```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.1 &mdash; 17 Jun 2026</strong><br>
```

Replace with:

```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.2 &mdash; 18 Jun 2026</strong><br>
    &#9679; <b>Iceberg</b>: real freezer/cryo-tank data (admin-only), downloadable re-importable xlsx template (table + 2 grid formats), frosted visual polish on Boxes view<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.1 &mdash; 17 Jun 2026</strong><br>
```

- [ ] **Step 3: Rebuild the self-contained Hub**

Run: `cd "/Users/jonmacicior/Desktop/The_Hub" && python3 embed.py`

Expected output includes a success line with 0 placeholders (matches the pattern from every prior session-log round, e.g. "9/9 base64 replacements, 0 placeholders").

- [ ] **Step 4: Update `CLAUDE.md` session log**

Insert a new entry at the top of the `## Session log` section (after the `## Session log` heading, before the existing `Last session: ...` line) with this content:

```markdown
Last session: 2026-06-18 (Round 83: Iceberg real data + template + visual polish; v1.1.2)
Hub apps: 11. Version v1.1.2.
Cryostorage/cryostorage.html changes (v1.1.2):
- Seeded Jon's real freezer/cryo-tank inventory (33 vials: 18 in -80 Box 1, 3 in -80 Box 2, 12 in N2 CeTPD Box 12), derived from "Freezer and Cryo Boxes Jon.xlsx". 'X' cells in the source meant "vial taken" -> dropped, not stored as occupied-unlabeled. Trailing "P##*" -> passage extracted, '*' folded into a note ("Passage counted after de-frosting — original freeze passage unknown.").
- Seeding is admin-gated: maybeSeedRealData() only populates state when there's no existing local data AND window.parent.isAdmin === true (Hub's existing admin flag, true only for maciciorjon@gmail.com) — other Hub users keep today's blank default.
- New "Download template (.xlsx)" button (Options panel) generates a 3-tab workbook: flat "Table format" (matches existing import/export columns), "Grid - lettered" (blank 9x9 mirroring the -80 box layout), "Grid - numbered" (blank 10x10 mirroring the N2 box layout) — both grid tabs use vertically-merged cells for the "boxy" look.
- importXLSX() extended with a grid-sheet fallback (_detectGridSheet/_parseGridCellText) for when a sheet isn't flat-table shaped: detects row-letter (A1, B12...) or sequential-number label rows, reads the row immediately below as content (works regardless of merge, since non-anchor merged cells already read as empty). Numbered labels convert to row-letter+column via the row's own wrap-width. Lets a hand-filled template round-trip straight back through the existing Import button.
- Visual polish ("frosted/icy", Direction A from brainstorming): .stat-card, .box-card, .empty-state get a subtle cool gradient (var(--surface) -> var(--accent-dim)) plus a soft radial accent glow on box cards; .box-preview .pw corners softened slightly. No new CSS vars — dark theme adapts automatically since --accent-dim is already theme-tuned.
hub-shell.html: version bump v1.1.1 -> v1.1.2, changelog entry added.
```

- [ ] **Step 5: Verify the build**

Run: `cd "/Users/jonmacicior/Desktop/The_Hub" && grep -c "PLACEHOLDER" "The Hub.html"`

Expected: `0`

---

### Task 6: Full live verification pass against the built Hub

**Files:** none modified — verification only, against `The Hub.html` (built in Task 5).

- [ ] **Step 1: Confirm a non-admin session through the Hub stays blank**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(800);
  // Open Iceberg without any admin sign-in.
  await page.evaluate(() => { if (typeof openApp === 'function') openApp('cryo'); });
  await page.waitForTimeout(500);
  const frame = page.frameLocator('#frame-cryo');
  const racks = await frame.locator('.rack').count();
  console.log('rack count (should be 0):', racks);
  await browser.close();
})();
"
```
Expected: `rack count (should be 0): 0`

- [ ] **Step 2: Confirm an admin session seeds correctly through the Hub**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.isAdmin = true; if (typeof openApp === 'function') openApp('cryo'); });
  await page.waitForTimeout(500);
  const frame = page.frameLocator('#frame-cryo');
  const tcMinus80 = await frame.locator('#tc-minus80').textContent();
  console.log('minus80 vial count (should be 21):', tcMinus80);
  await browser.close();
})();
"
```
Expected: `minus80 vial count (should be 21): 21`

- [ ] **Step 3: Read both polish screenshots from Task 4 Step 5 to confirm visually**

Use the Read tool on `/tmp/iceberg_polish_light.png` and `/tmp/iceberg_polish_dark.png` and visually confirm the gradient/glow is present, subtle, and not clipped or low-contrast in either theme.

- [ ] **Step 4: Re-run `node --check` equivalent on the final file**

Run: `node -e "var fs=require('fs'); var html=fs.readFileSync('Cryostorage/cryostorage.html','utf8'); var m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('OK');"`

Expected: `OK`

---

### Task 7: Commit and report (push requires explicit confirmation)

**Files:**
- Stage: `Cryostorage/cryostorage.html`, `hub-shell.html`, `CLAUDE.md`
- Do NOT stage/commit: `The Hub.html` (gitignored, generated)

- [ ] **Step 1: Only proceed if every verification step in Tasks 1-6 passed.** If anything failed, stop and fix before committing.

- [ ] **Step 2: Stage and commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub"
git add Cryostorage/cryostorage.html hub-shell.html CLAUDE.md
git commit -m "$(cat <<'EOF'
Iceberg: seed real freezer data (admin-only), add re-importable grid template, visual polish

Admin-gated seeding of Jon's actual -80C/N2 inventory so other Hub users
still see a blank app. New downloadable xlsx template (table + 2 grid
formats) round-trips through the existing Import via a new grid-sheet
detector. Boxes view gets a frosted/icy gradient treatment.
EOF
)"
git status
```

- [ ] **Step 3: Report to the user.** Summarize what was verified (vial counts, blank-for-others confirmed, template round-trip confirmed, screenshots reviewed) and explicitly ask whether to `git push`. Do not push without an explicit yes.
