# Beacon Fixes & Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the embed-breaking bug causing Beacon's reported "lots of errors"/"code showing in background", redesign the Plate Map painter for usability, clean up duplicate Endpoint/QC conditions, add an opt-in lite/ratios-only mode, and add test data — all in `Beacon/beacon.html` (+ one defensive fix in `hub-shell.html`).

**Architecture:** Single self-contained HTML file, vanilla JS, no build step. All verification is done via Playwright scripts run directly against the file (this codebase has no unit test framework) plus `python3 embed.py` to rebuild `The Hub.html` for embed-specific checks. No new files are created; every task edits `Beacon/beacon.html` in place (Task 1 also touches `hub-shell.html`).

**Tech Stack:** Vanilla HTML/CSS/JS, SheetJS (`XLSX` global, already bundled in the file), Playwright (already installed as a devDependency at the repo root — `node_modules`/`package.json`) for verification.

## Global Constraints

- No build step — every change must work by opening the `.html` file directly in a browser.
- Match existing code style: `var`-based function declarations, no semicolon-less lines, 2-space indentation, inline `onclick=` handlers (not `addEventListener` for dynamically-rendered markup) — this is the established convention throughout `beacon.html`.
- Pastel/soft color tones for any new color choices (suite-wide standing rule).
- Do not touch the BRET/mBU/Z′/4PL/one-site-binding calculation functions (`computeConditionMBUs`, `_lmFit`, `_fitBest`, `_fitOneSiteBinding`, `_4plVal4*`, `_oneSiteVal`, etc.) — none of this plan's tasks require changing the math.
- After every task that touches `Beacon/beacon.html`, also run `python3 embed.py` from the repo root before any embed-specific Playwright check, so `The Hub.html` reflects the latest source.
- Repo root for all commands: `/Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes` (this worktree).

---

### Task 1: Fix the embed-breaking script-placement bug

**Files:**
- Modify: `Beacon/beacon.html:217-242` (move the bundled SheetJS `<script>` block from `<head>` to right after `<body>`)
- Modify: `hub-shell.html` (`_loadApp(id)` function — make the `</head>` injection script-aware)

**Interfaces:**
- Consumes: nothing from other tasks (this is the first task).
- Produces: a correctly-embedding `Beacon/beacon.html` and a hardened `_loadApp()` in `hub-shell.html` that all later tasks (and all other apps) continue to rely on unchanged.

**Root cause recap:** `Beacon/beacon.html` currently has its bundled SheetJS library inside `<head>` (script opens line 217, closes line 241, `</head>` is line 242, `<body>` is line 243). That library contains the string literal `'<html><head>...</head><body>'` (SheetJS's internal `sheet_to_html` template, never actually called by Beacon). Because that fake `</head>` appears earlier in the file than Beacon's real one, `hub-shell.html`'s `html.replace('</head>', ...)` (first-match-only) corrupts the script when Beacon is opened through The Hub.

- [ ] **Step 1: Reproduce the bug with a Playwright script (baseline failure)**

Create a throwaway script (not committed) to confirm the bug exists before fixing it:

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
python3 embed.py
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(500);
  await page.evaluate(() => openApp('beacon'));
  await page.waitForTimeout(800);
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `ERRORS: [\"Invalid or unexpected token\"]` (or similar SyntaxError) — confirms the baseline failure before any fix.

- [ ] **Step 2: Move Beacon's bundled SheetJS script from `<head>` to `<body>`**

In `Beacon/beacon.html`, the file currently reads (lines 215-245, abbreviated):

```html
</style>
<script>
... huge minified SheetJS bundle ...
</script>
</head>
<body>

<header>
```

Change it to:

```html
</style>
</head>
<body>

<script>
... huge minified SheetJS bundle (byte-for-byte unchanged, just relocated) ...
</script>

<header>
```

Concretely: cut the entire `<script>` ... `</script>` block currently at lines 217–241, and paste it back in immediately after the `<body>` line (currently line 243), before the `<header>` line (currently line 245). Leave every other line (the `</style>`, `</head>`, `<body>`, `<header>` lines, and the script's own contents) untouched — this is a pure relocation, matching the convention already used in `Labcyte_Echo/labcyte_echo.html`, `Cryostorage/cryostorage.html`, and `LDI/ldi.html` (all of which place their SheetJS bundle in `<body>`, not `<head>`).

- [ ] **Step 3: Verify the file is still valid and the standalone app still works**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(500);
  console.log('STANDALONE ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `STANDALONE ERRORS: []` (it already passed before this change — this just confirms the relocation didn't break anything standalone).

- [ ] **Step 4: Harden `hub-shell.html`'s `_loadApp()` against the same bug class for every app**

In `hub-shell.html`, find `_loadApp(id)` (currently around line 1271). It contains two `html.replace('</head>', ...)` calls:

```js
html = html.replace('</head>', '<style>' + embedStyle + '</style></head>');
...
html = html.replace('</head>', backScript + '</head>');
```

Replace both with a helper that finds the real `</head>` by first masking out the contents of every `<script>...</script>` block (so a library's own incidental `</head>`-shaped string content can never be matched), then locating `</head>` in the masked copy, then splicing into the *original* (unmasked) string at that same index. Add this helper function directly above `_loadApp`:

```js
function _realHeadCloseIndex(html) {
  var masked = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, function(m) {
    return new Array(m.length + 1).join(' ');
  });
  return masked.indexOf('</head>');
}

function _insertBeforeRealHeadClose(html, insertion) {
  var idx = _realHeadCloseIndex(html);
  if (idx === -1) return html;
  return html.slice(0, idx) + insertion + html.slice(idx);
}
```

Then change the two call sites inside `_loadApp(id)` from:

```js
html = html.replace('</head>', '<style>' + embedStyle + '</style></head>');
```
to:
```js
html = _insertBeforeRealHeadClose(html, '<style>' + embedStyle + '</style>');
```

and:
```js
html = html.replace('</head>', backScript + '</head>');
```
to:
```js
html = _insertBeforeRealHeadClose(html, backScript);
```

(Inserting *before* the real `</head>` index, rather than replacing the tag itself, is equivalent in effect to the original `replace(...)` calls — both injections still land immediately before the real closing head tag — but doesn't require reconstructing the `</head>` string itself.)

- [ ] **Step 5: Rebuild and verify Beacon embeds correctly through the Hub**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
python3 embed.py
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1400,height:1000}});
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type()==='error') errors.push(msg.text()); });
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(500);
  await page.evaluate(() => openApp('beacon'));
  await page.waitForTimeout(800);
  const bodyText = await page.evaluate(() => document.querySelector('#frame-beacon').contentDocument.body.innerText.slice(0, 200));
  console.log('ERRORS:', JSON.stringify(errors));
  console.log('VISIBLE TEXT SAMPLE:', JSON.stringify(bodyText));
  await browser.close();
})();
"
```

Expected: `ERRORS: []` and `VISIBLE TEXT SAMPLE` showing readable UI text ("Beacon Setup", "Load a PHERAstar file to begin", etc.) — not raw minified JS.

- [ ] **Step 6: Regression-check the other three SheetJS-bundling apps still embed cleanly**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(500);
  for (const id of ['echo','cryo','ldi']) {
    await page.evaluate((id) => openApp(id), id);
    await page.waitForTimeout(600);
    await page.evaluate(() => backToHub());
    await page.waitForTimeout(200);
  }
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `ERRORS: []` — Echo, Iceberg (cryo), and LDI all still embed without error after the `_loadApp()` change.

- [ ] **Step 7: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html hub-shell.html
git commit -m "$(cat <<'EOF'
Fix Beacon embed corruption: relocate bundled SheetJS script out of <head>

Beacon's bundled SheetJS library lived inside <head>, ahead of the file's
real </head> tag. The library's own internal HTML-export template string
contains a literal "</head>" substring, so hub-shell.html's first-match
.replace('</head>', ...) injection landed inside that JS string instead
of before the real closing head tag -- corrupting the script's syntax and
causing the rest of the bundle to render as visible text when Beacon was
opened through The Hub (reproduced via Playwright). Fixed by moving the
script to <body>, matching Echo/Iceberg/LDI's existing convention, and
hardened hub-shell.html's _loadApp() to mask script-tag contents before
searching for </head>, so no future app can hit this same bug class.
EOF
)"
```

---

### Task 2: Widen the Setup modal on Plate Map + switch its layout to a stable CSS grid

**Files:**
- Modify: `Beacon/beacon.html` CSS (`.setup-card` around line 138, `.pm-layout`/`.pm-grid-col`/`.pm-role-col`/`.pm-dose-col` around lines 185-188)
- Modify: `Beacon/beacon.html` JS `switchSetupTab()` (currently line 1689)

**Interfaces:**
- Consumes: nothing new from Task 1.
- Produces: a `.platemap-wide` CSS class toggled on `#setup-modal .setup-card` whenever the Plate Map sub-tab is active; later tasks (3, 4) build on this same modal/grid without needing to touch its sizing again.

**Problem:** `.setup-card` is fixed at `width:680px`. `.pm-layout` is `display:flex;flex-wrap:wrap`, so the well grid, role list, and dose-group list fight for room in that fixed width, and the dose-group list growing taller (as the user paints more groups) re-wraps the row and visibly shifts the grid.

- [ ] **Step 1: Add the `.platemap-wide` class and convert `.pm-layout` to CSS grid**

In `Beacon/beacon.html`, find this CSS block (currently lines 184-188):

```css
/* PLATE MAP */
.pm-layout{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;}
.pm-grid-col{flex:1 1 320px;min-width:280px;overflow-x:auto;}
.pm-role-col{flex:0 0 150px;min-width:130px;}
.pm-dose-col{flex:1 1 220px;min-width:200px;}
```

Replace with:

```css
/* PLATE MAP */
.setup-card.platemap-wide{width:min(96vw, 1100px);}
.pm-layout{display:grid;grid-template-columns:1fr 160px 260px;gap:18px;align-items:start;}
.pm-grid-col{overflow-x:auto;min-width:0;}
.pm-role-col{min-width:0;}
.pm-dose-col{min-width:0;max-height:calc(100vh - 320px);overflow-y:auto;}
@media(max-width:760px){
  .setup-card.platemap-wide{width:calc(100vw - 20px);}
  .pm-layout{grid-template-columns:1fr;}
}
```

(`grid-template-columns:1fr 160px 260px` keeps the role list and dose list at fixed widths — their content's height can never change the grid column's size or position, which is what was causing the on-screen shift while painting. The `max-height`/`overflow-y:auto` on `.pm-dose-col` means a long list of dose chips scrolls internally instead of growing the modal.)

- [ ] **Step 2: Toggle `.platemap-wide` from `switchSetupTab()`**

Find `switchSetupTab` (currently line 1689):

```js
function switchSetupTab(name){
  document.querySelectorAll('.setup-stab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.setup-pane').forEach(function(p){
    p.classList.toggle('active', p.id === 'setup-pane-' + name);
  });
  if (name === 'platemap') renderPlateMapPane();
}
```

Change to:

```js
function switchSetupTab(name){
  document.querySelectorAll('.setup-stab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.setup-pane').forEach(function(p){
    p.classList.toggle('active', p.id === 'setup-pane-' + name);
  });
  document.querySelector('#setup-modal .setup-card').classList.toggle('platemap-wide', name === 'platemap');
  if (name === 'platemap') renderPlateMapPane();
}
```

- [ ] **Step 3: Verify via Playwright**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1400,height:1000}});
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchSetupTab('files'));
  const w1 = await page.evaluate(() => document.querySelector('#setup-modal .setup-card').getBoundingClientRect().width);
  await page.evaluate(() => switchSetupTab('platemap'));
  const w2 = await page.evaluate(() => document.querySelector('#setup-modal .setup-card').getBoundingClientRect().width);
  const display = await page.evaluate(() => getComputedStyle(document.querySelector('.pm-layout')).display);
  console.log('files width:', w1, 'platemap width:', w2, 'pm-layout display:', display);
  await browser.close();
})();
"
```

Expected: `files width: 680` (unchanged), `platemap width: 1100` (widened), `pm-layout display: grid`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Widen Setup modal on Plate Map tab; switch pm-layout to stable CSS grid

The Setup modal was fixed at 680px regardless of which sub-tab was open,
cramming the well grid + role list + dose-group list together for Plate
Map specifically. The dose-group list growing as compound groups were
painted also re-wrapped the flex row and visibly shifted the grid mid-
workflow. Now the modal widens only for Plate Map, and pm-layout is a
fixed-column CSS grid so side-panel content height can never move the
grid column.
EOF
)"
```

---

### Task 3: Per-well DOM updates, live well count, Clear button, row/column click-to-select

**Files:**
- Modify: `Beacon/beacon.html` CSS (add `.pm-role-count`, `.pm-clear-btn`, `.pm-col-hdr`/`.pm-row-hdr` rules near the Task 2 PLATE MAP block)
- Modify: `Beacon/beacon.html` JS: `renderPlateMapGrid`, `pmWellDown`, `pmWellOver`, `pmWellUp`, `pmSetActiveRole` (all currently in the PLATE MAP section, ~lines 1723-1860); add new functions `pmUpdateWellCell`, `pmUpdateActiveRoleCount`, `pmClearActiveRole`, `pmRowWells`, `pmColumnWells`, `pmSelectRowOrCol`
- Modify: `Beacon/beacon.html` HTML — the `.pm-role-col` block inside the Plate Map setup pane (currently ~lines 351-366)

**Interfaces:**
- Consumes: the `.pm-layout` grid + `.platemap-wide` modal from Task 2 (this task doesn't change sizing, only interaction/perf).
- Produces: `PM_CELL_MAP` (module-level `{wellId: <td>}` map, rebuilt by `renderPlateMapGrid`), `pmUpdateWellCell(wellId)`, `pmRowWells(rowLabel)`, `pmColumnWells(col)` — all usable by later tasks if needed, though none of Tasks 4-9 currently require them.

**Problem:** `renderPlateMapGrid()` rebuilds the *entire* well-grid table on every `mousemove` during a drag (called from `pmWellOver`/`pmWellDown`). At 384 wells this is wasteful and was observed (via Playwright bounding-box checks) to contribute to layout instability during painting. There's also no live feedback on how many wells are painted, no quick "clear this role," and no row/column shortcut for painting many wells at once (relevant at 384-well scale).

- [ ] **Step 1: Add `PM_CELL_MAP` and CSS for the new controls**

Add `var PM_CELL_MAP = {};` next to the other `PM_*` module-level vars (currently lines 1724-1730):

```js
var PM_ACTIVE_ROLE = 'background';
var PM_DRAGGING = false;
var PM_DRAG_WELLS = [];
var PM_GROUP_SEQ = 0;
var PM_CELL_MAP = {};
var PM_COMPOUND_COLORS = ['#f3c98b', '#f3a8a0', '#f6df9b', '#e8b88a', '#f0c4d4', '#f5b87c', '#eacb7c', '#f0a98f'];
var PM_TRACER_COLORS = ['#e3b8e0', '#b9c6ef', '#a9d8e6', '#c8b6ec', '#9fd6cf', '#b3c4f0', '#d3aee0', '#9ccbe8'];
var PM_ROLE_COLORS = { background: '#cfd3e6', dmso: '#bcdfd0' };
```

Add to the CSS PLATE MAP block introduced in Task 2 (right after the `@media(max-width:760px)` rule):

```css
.pm-role-count{font-size:11px;color:var(--text3);margin-top:10px;}
.pm-clear-btn{width:100%;margin-top:8px;}
.pm-grid th.pm-col-hdr,.pm-grid th.pm-row-hdr{cursor:pointer;transition:color .15s,background .15s;}
.pm-grid th.pm-col-hdr:hover,.pm-grid th.pm-row-hdr:hover{color:var(--accent);background:var(--accent-dim);}
```

- [ ] **Step 2: Add `data-well` attributes + row/column header click handlers to `renderPlateMapGrid`, and populate `PM_CELL_MAP`**

Replace the entire `renderPlateMapGrid` function (currently lines 1833-1860) with:

```js
function renderPlateMapGrid() {
  var wrap = document.getElementById('platemap-grid-wrap');
  if (!wrap) return;
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var html = '<table class="pm-grid"><thead><tr><th></th>';
  for (var c = 1; c <= dims.cols; c++) {
    html += '<th class="pm-col-hdr" title="Select column ' + c + '" onclick="pmSelectRowOrCol(pmColumnWells(' + c + '))">' + c + '</th>';
  }
  html += '</tr></thead><tbody>';
  for (var r = 0; r < dims.rows; r++) {
    var rowLabel = ROWS[r];
    html += '<tr><th class="pm-row-hdr" title="Select row ' + rowLabel + '" onclick="pmSelectRowOrCol(pmRowWells(\'' + rowLabel + '\'))">' + rowLabel + '</th>';
    for (var c2 = 1; c2 <= dims.cols; c2++) {
      var wellId = rowLabel + (c2 < 10 ? '0' + c2 : c2);
      var info = pmWellRole(wellId);
      var bg = '';
      if (info) {
        bg = info.group ? info.group.color : PM_ROLE_COLORS[info.role];
      }
      var pending = PM_DRAGGING && PM_DRAG_WELLS.indexOf(wellId) !== -1;
      var style = bg ? ' style="background:' + bg + ';"' : '';
      html += '<td class="' + (pending ? 'pm-pending' : '') + '" data-well="' + wellId + '"' + style +
        ' onmousedown="pmWellDown(\'' + wellId + '\')" onmouseover="pmWellOver(\'' + wellId + '\')"></td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
  PM_CELL_MAP = {};
  wrap.querySelectorAll('td[data-well]').forEach(function(td){ PM_CELL_MAP[td.dataset.well] = td; });
}
```

- [ ] **Step 3: Add `pmUpdateWellCell`, `pmRowWells`, `pmColumnWells`, `pmUpdateActiveRoleCount`, `pmClearActiveRole`, `pmSelectRowOrCol`**

Add these new functions directly after `renderPlateMapGrid`:

```js
function pmUpdateWellCell(wellId) {
  var td = PM_CELL_MAP[wellId];
  if (!td) return;
  var info = pmWellRole(wellId);
  var bg = info ? (info.group ? info.group.color : PM_ROLE_COLORS[info.role]) : '';
  var pending = PM_DRAGGING && PM_DRAG_WELLS.indexOf(wellId) !== -1;
  td.style.background = bg || '';
  td.classList.toggle('pm-pending', pending);
}

function pmRowWells(rowLabel) {
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var wells = [];
  for (var c = 1; c <= dims.cols; c++) wells.push(rowLabel + (c < 10 ? '0' + c : c));
  return wells;
}

function pmColumnWells(col) {
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var wells = [];
  for (var r = 0; r < dims.rows; r++) wells.push(ROWS[r] + (col < 10 ? '0' + col : col));
  return wells;
}

function pmUpdateActiveRoleCount() {
  var el = document.getElementById('pm-role-count');
  if (!el) return;
  var n;
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    n = state.plateMap[PM_ACTIVE_ROLE].length;
  } else {
    var arrKey = PM_ACTIVE_ROLE === 'compound' ? 'compoundGroups' : 'tracerGroups';
    n = state.plateMap[arrKey].reduce(function(s, g){ return s + g.wells.length; }, 0);
  }
  el.textContent = n + ' well' + (n === 1 ? '' : 's') + ' painted';
}

function pmClearActiveRole() {
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    state.plateMap[PM_ACTIVE_ROLE] = [];
  } else {
    var arrKey = PM_ACTIVE_ROLE === 'compound' ? 'compoundGroups' : 'tracerGroups';
    state.plateMap[arrKey] = [];
  }
  renderPlateMapGrid();
  renderDoseGroupList();
  seedQcFromPlateMap();
  renderDoseSummary();
  renderTracerSummary();
  pmUpdateActiveRoleCount();
}

function pmSelectRowOrCol(wellIds) {
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    wellIds.forEach(function(w){
      pmRemoveWellFromAllRoles(w);
      state.plateMap[PM_ACTIVE_ROLE].push(w);
      pmUpdateWellCell(w);
    });
  } else {
    wellIds.forEach(function(w){ pmRemoveWellFromAllRoles(w); });
    var colors = PM_ACTIVE_ROLE === 'compound' ? PM_COMPOUND_COLORS : PM_TRACER_COLORS;
    var arrKey = PM_ACTIVE_ROLE === 'compound' ? 'compoundGroups' : 'tracerGroups';
    var color = colors[state.plateMap[arrKey].length % colors.length];
    var newGroup = { id: ++PM_GROUP_SEQ, wells: wellIds.slice(), conc: null, color: color };
    state.plateMap[arrKey].push(newGroup);
    wellIds.forEach(function(w){ pmUpdateWellCell(w); });
    renderDoseGroupList();
  }
  seedQcFromPlateMap();
  renderDoseSummary();
  renderTracerSummary();
  pmUpdateActiveRoleCount();
}
```

- [ ] **Step 4: Replace full-rebuild calls in `pmWellDown`/`pmWellOver`/`pmWellUp` with targeted per-well updates**

Replace the existing `pmWellDown` (currently lines 1767-1781) with:

```js
function pmWellDown(wellId) {
  PM_DRAGGING = true;
  PM_DRAG_WELLS = [wellId];
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    pmRemoveWellFromAllRoles(wellId);
    state.plateMap[PM_ACTIVE_ROLE].push(wellId);
    pmUpdateWellCell(wellId);
    seedQcFromPlateMap();
    renderDoseSummary();
    renderTracerSummary();
    pmUpdateActiveRoleCount();
  } else {
    pmUpdateWellCell(wellId);
  }
}
```

Replace the existing `pmWellOver` (currently lines 1783-1802) with:

```js
function pmWellOver(wellId) {
  if (!PM_DRAGGING) return;
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    if (state.plateMap[PM_ACTIVE_ROLE].indexOf(wellId) === -1) {
      pmRemoveWellFromAllRoles(wellId);
      state.plateMap[PM_ACTIVE_ROLE].push(wellId);
    }
    if (PM_DRAG_WELLS.indexOf(wellId) === -1) PM_DRAG_WELLS.push(wellId);
    pmUpdateWellCell(wellId);
    seedQcFromPlateMap();
    renderDoseSummary();
    renderTracerSummary();
    pmUpdateActiveRoleCount();
  } else {
    if (PM_DRAG_WELLS.indexOf(wellId) === -1) {
      PM_DRAG_WELLS.push(wellId);
      pmUpdateWellCell(wellId);
    }
  }
}
```

Replace the existing `pmWellUp` (currently lines 1804-1829) with:

```js
function pmWellUp() {
  if (!PM_DRAGGING) return;
  if (PM_ACTIVE_ROLE === 'background' || PM_ACTIVE_ROLE === 'dmso') {
    PM_DRAGGING = false;
    PM_DRAG_WELLS = [];
    return;
  }
  var paintedWells = PM_DRAG_WELLS.slice();
  if (PM_DRAG_WELLS.length > 0) {
    PM_DRAG_WELLS.forEach(function(w){ pmRemoveWellFromAllRoles(w); });
    var colors = PM_ACTIVE_ROLE === 'compound' ? PM_COMPOUND_COLORS : PM_TRACER_COLORS;
    var arrKey = PM_ACTIVE_ROLE === 'compound' ? 'compoundGroups' : 'tracerGroups';
    var color = colors[state.plateMap[arrKey].length % colors.length];
    var newGroup = { id: ++PM_GROUP_SEQ, wells: PM_DRAG_WELLS.slice(), conc: null, color: color };
    state.plateMap[arrKey].push(newGroup);
  }
  PM_DRAGGING = false;
  PM_DRAG_WELLS = [];
  paintedWells.forEach(function(w){ pmUpdateWellCell(w); });
  renderDoseGroupList();
  seedQcFromPlateMap();
  renderDoseSummary();
  renderTracerSummary();
  pmUpdateActiveRoleCount();
  var newInput = document.getElementById('chip-conc-' + PM_GROUP_SEQ);
  if (newInput) newInput.focus();
}
```

- [ ] **Step 5: Update `pmSetActiveRole` and `renderPlateMapPane` to refresh the count**

Replace `pmSetActiveRole` (currently lines 1760-1765) with:

```js
function pmSetActiveRole(role) {
  PM_ACTIVE_ROLE = role;
  document.querySelectorAll('#pm-role-list .pm-role').forEach(function(el){
    el.classList.toggle('active', el.dataset.role === role);
  });
  pmUpdateActiveRoleCount();
}
```

Replace `renderPlateMapPane` (currently lines 1907-1912) with:

```js
function renderPlateMapPane() {
  var tracerRow = document.getElementById('pm-role-tracer');
  if (tracerRow) tracerRow.style.display = (state.assayMode === 'displacement') ? '' : 'none';
  renderPlateMapGrid();
  renderDoseGroupList();
  pmUpdateActiveRoleCount();
}
```

- [ ] **Step 6: Add the count display + Clear button to the Plate Map pane HTML**

Find the `.pm-role-col` block inside the Setup modal's Plate Map pane (currently ~lines 351-366):

```html
            <div class="pm-role-col">
              <div class="pm-role-list" id="pm-role-list">
                <div class="pm-role active" data-role="background" onclick="pmSetActiveRole('background')">
                  <span class="pm-role-swatch" style="background:#cfd3e6;"></span>Background
                </div>
                <div class="pm-role" data-role="dmso" onclick="pmSetActiveRole('dmso')">
                  <span class="pm-role-swatch" style="background:#bcdfd0;"></span>DMSO
                </div>
                <div class="pm-role" data-role="compound" onclick="pmSetActiveRole('compound')">
                  <span class="pm-role-swatch" style="background:#f3c98b;"></span>Compound
                </div>
                <div class="pm-role" id="pm-role-tracer" data-role="tracer" onclick="pmSetActiveRole('tracer')">
                  <span class="pm-role-swatch" style="background:#e3b8e0;"></span>Tracer
                </div>
              </div>
            </div>
```

Replace with (adds the count line + Clear button immediately after `#pm-role-list`):

```html
            <div class="pm-role-col">
              <div class="pm-role-list" id="pm-role-list">
                <div class="pm-role active" data-role="background" onclick="pmSetActiveRole('background')">
                  <span class="pm-role-swatch" style="background:#cfd3e6;"></span>Background
                </div>
                <div class="pm-role" data-role="dmso" onclick="pmSetActiveRole('dmso')">
                  <span class="pm-role-swatch" style="background:#bcdfd0;"></span>DMSO
                </div>
                <div class="pm-role" data-role="compound" onclick="pmSetActiveRole('compound')">
                  <span class="pm-role-swatch" style="background:#f3c98b;"></span>Compound
                </div>
                <div class="pm-role" id="pm-role-tracer" data-role="tracer" onclick="pmSetActiveRole('tracer')">
                  <span class="pm-role-swatch" style="background:#e3b8e0;"></span>Tracer
                </div>
              </div>
              <div class="pm-role-count" id="pm-role-count"></div>
              <button class="btn btn-sec btn-sm pm-clear-btn" onclick="pmClearActiveRole()">Clear</button>
            </div>
```

- [ ] **Step 7: Verify via Playwright**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1400,height:1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => { switchSetupTab('platemap'); });
  // click column header 1 to select whole column with Background role (default active)
  await page.evaluate(() => pmSelectRowOrCol(pmColumnWells(1)));
  const bgCount = await page.evaluate(() => state.plateMap.background.length);
  const countText = await page.evaluate(() => document.getElementById('pm-role-count').textContent);
  // switch to compound, select row A
  await page.evaluate(() => { pmSetActiveRole('compound'); pmSelectRowOrCol(pmRowWells('A')); });
  const groupCount = await page.evaluate(() => state.plateMap.compoundGroups.length);
  const groupWells = await page.evaluate(() => state.plateMap.compoundGroups[0].wells.length);
  // clear compound role
  await page.evaluate(() => pmClearActiveRole());
  const afterClear = await page.evaluate(() => state.plateMap.compoundGroups.length);
  // confirm PM_CELL_MAP populated and same node identity survives a per-well update (no full rebuild)
  const sameNode = await page.evaluate(() => {
    var before = PM_CELL_MAP['A01'];
    pmUpdateWellCell('A01');
    return PM_CELL_MAP['A01'] === before;
  });
  console.log('bgCount:', bgCount, 'countText:', countText, 'groupCount:', groupCount, 'groupWells:', groupWells, 'afterClear:', afterClear, 'sameNode:', sameNode);
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `bgCount: 8` (96-well plate, column 1 = 8 rows), `countText: '8 wells painted'` (re-fetched after role switch it'll reflect compound, but bgCount itself confirms the column-select worked), `groupCount: 1`, `groupWells: 12` (row A on a 96-well plate = 12 columns), `afterClear: 0`, `sameNode: true`, `ERRORS: []`.

- [ ] **Step 8: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Plate Map: per-well DOM updates, live well count, Clear button, row/col select

renderPlateMapGrid() was rebuilding the entire well-grid table's innerHTML
on every mousemove during a drag (pmWellDown/pmWellOver). Replaced with
targeted per-well DOM updates via a new PM_CELL_MAP (wellId -> <td>), kept
in sync only on full grid rebuilds (tab switch, plate format change, file
load). Also added a live "N wells painted" counter for the active role, a
Clear button to empty it in one click, and click-to-select on row/column
headers -- useful at 384-well scale where cell-by-cell dragging is tedious.
EOF
)"
```

---

### Task 4: Gate Setup sub-tab order (closes the silent wrong-curve-shape bug)

**Files:**
- Modify: `Beacon/beacon.html` CSS (add `.setup-stab.disabled` near the existing `.setup-stab` rules, ~line 145-148)
- Modify: `Beacon/beacon.html` JS: `switchSetupTab` (already edited in Task 2 — extend further), `handlePheraFile`, `loadChannelFile`, `setAssayMode`, `setPlateFormat`, `openSetupModal`; add new `renderSetupTabGate()`

**Interfaces:**
- Consumes: `switchSetupTab` from Task 2 (the version with `.platemap-wide` toggling).
- Produces: `renderSetupTabGate()`, called by every state-changing function that affects whether Assay Info / Plate Map should be reachable. Task 6 (lite mode) and Tasks 7-8 (test data) must also call it after they set `state.donor`/`state.acceptor`/`state.assayMode`.

**Problem:** nothing currently prevents opening Plate Map (or skipping Assay Info entirely) before an assay mode is chosen. Combined with every dose-fit call site doing `state.assayMode === 'gain' ? gainFn : displacementFn` (falling through to the Displacement curve shape whenever `state.assayMode` is `null`), a Gain-of-Signal user who skips Assay Info gets a silently wrong fit with no warning.

- [ ] **Step 1: Add the disabled-tab CSS**

Add directly after the existing `.setup-stab.active{...}` rule (currently line 148):

```css
.setup-stab.disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}
```

- [ ] **Step 2: Add the gating check to `switchSetupTab` and a new `renderSetupTabGate()`**

Replace `switchSetupTab` (as left by Task 2) with:

```js
function switchSetupTab(name){
  if (name === 'assay' && !(state.donor && state.acceptor)) return;
  if (name === 'platemap' && !state.assayMode) return;
  document.querySelectorAll('.setup-stab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.setup-pane').forEach(function(p){
    p.classList.toggle('active', p.id === 'setup-pane-' + name);
  });
  document.querySelector('#setup-modal .setup-card').classList.toggle('platemap-wide', name === 'platemap');
  if (name === 'platemap') renderPlateMapPane();
}

function renderSetupTabGate(){
  var assayTab = document.querySelector('.setup-stab[data-tab="assay"]');
  var platemapTab = document.querySelector('.setup-stab[data-tab="platemap"]');
  if (assayTab) assayTab.classList.toggle('disabled', !(state.donor && state.acceptor));
  if (platemapTab) platemapTab.classList.toggle('disabled', !state.assayMode);
}
```

- [ ] **Step 3: Call `renderSetupTabGate()` from every place that changes `state.donor`/`state.acceptor`/`state.assayMode`**

In `handlePheraFile` (currently lines 2007-2053), find the success path's last few lines before the `catch`:

```js
      document.getElementById('phera-fname').textContent = file.name;
      document.getElementById('phera-drop').classList.add('filled');
      renderPheraMeta();
      renderCombinedTable();
      renderPlateMapGrid();
      renderDoseGroupList();
    } catch (err) {
```

Add `renderSetupTabGate();` right after `renderDoseGroupList();`:

```js
      document.getElementById('phera-fname').textContent = file.name;
      document.getElementById('phera-drop').classList.add('filled');
      renderPheraMeta();
      renderCombinedTable();
      renderPlateMapGrid();
      renderDoseGroupList();
      renderSetupTabGate();
    } catch (err) {
```

In `loadChannelFile` (currently lines 925-946), find:

```js
    document.getElementById(channel + '-status').textContent = file.name;
    renderCombinedTable();
    renderPlateMapGrid();
    renderDoseGroupList();
  };
  reader.readAsText(file);
```

Add `renderSetupTabGate();` after `renderDoseGroupList();`:

```js
    document.getElementById(channel + '-status').textContent = file.name;
    renderCombinedTable();
    renderPlateMapGrid();
    renderDoseGroupList();
    renderSetupTabGate();
  };
  reader.readAsText(file);
```

In `setAssayMode` (currently lines 1699-1714), find the end:

```js
  if (typeof renderDoseSummary === 'function') renderDoseSummary();
  if (typeof renderTracerSummary === 'function') renderTracerSummary();
  renderPlateMapPane();
}
```

Add `renderSetupTabGate();` after `renderPlateMapPane();`:

```js
  if (typeof renderDoseSummary === 'function') renderDoseSummary();
  if (typeof renderTracerSummary === 'function') renderTracerSummary();
  renderPlateMapPane();
  renderSetupTabGate();
}
```

In `setPlateFormat` (currently lines 884-911), find the end:

```js
  if(typeof renderQCResults === 'function') renderQCResults();
  lastFitResult = null;
  if(typeof renderDoseResults === 'function') renderDoseResults();
  var doseCanvas = document.getElementById('dose-canvas');
  if(doseCanvas) doseCanvas.getContext('2d').clearRect(0, 0, doseCanvas.width, doseCanvas.height);
}
```

Add `renderSetupTabGate();` after the `clearRect` line (this function clears `state.donor`/`state.acceptor`, so the Assay Info tab must re-disable too):

```js
  if(typeof renderQCResults === 'function') renderQCResults();
  lastFitResult = null;
  if(typeof renderDoseResults === 'function') renderDoseResults();
  var doseCanvas = document.getElementById('dose-canvas');
  if(doseCanvas) doseCanvas.getContext('2d').clearRect(0, 0, doseCanvas.width, doseCanvas.height);
  renderSetupTabGate();
}
```

In `openSetupModal` (currently lines 1677-1682), so reopening the modal reflects current state:

```js
function openSetupModal(){
  var modal = document.getElementById('setup-modal');
  if (modal) modal.classList.remove('hidden');
  var hclose = document.getElementById('setup-hclose');
  if (hclose) hclose.style.display = '';
}
```

Add `renderSetupTabGate();` before the closing brace:

```js
function openSetupModal(){
  var modal = document.getElementById('setup-modal');
  if (modal) modal.classList.remove('hidden');
  var hclose = document.getElementById('setup-hclose');
  if (hclose) hclose.style.display = '';
  renderSetupTabGate();
}
```

- [ ] **Step 4: Verify via Playwright**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({
    assayDisabled: document.querySelector('.setup-stab[data-tab=\"assay\"]').classList.contains('disabled'),
    platemapDisabled: document.querySelector('.setup-stab[data-tab=\"platemap\"]').classList.contains('disabled')
  }));
  await page.evaluate(() => switchSetupTab('platemap'));
  const stillOnFiles = await page.evaluate(() => document.getElementById('setup-pane-files').classList.contains('active'));
  await page.evaluate(() => {
    var rows = [['Table End point'],['Well','Type','665 (LUM)','620 (LUM) LP']];
    var ROWS='ABCDEFGH';
    for (var r=0;r<8;r++) for (var c=1;c<=12;c++){ var w=ROWS[r]+(c<10?'0'+c:c); rows.push([w,'Sample',5000,1000]); }
    var ws=XLSX.utils.aoa_to_sheet(rows); var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Table End point');
    var out=XLSX.write(wb,{type:'array',bookType:'xlsx'});
    handlePheraFile(new File([new Blob([out])], 't.xlsx'));
  });
  await page.waitForTimeout(300);
  const afterLoad = await page.evaluate(() => ({
    assayDisabled: document.querySelector('.setup-stab[data-tab=\"assay\"]').classList.contains('disabled'),
    platemapDisabled: document.querySelector('.setup-stab[data-tab=\"platemap\"]').classList.contains('disabled')
  }));
  await page.evaluate(() => switchSetupTab('platemap'));
  const stillOnFiles2 = await page.evaluate(() => document.getElementById('setup-pane-files').classList.contains('active'));
  await page.evaluate(() => setAssayMode('gain'));
  const afterMode = await page.evaluate(() => document.querySelector('.setup-stab[data-tab=\"platemap\"]').classList.contains('disabled'));
  console.log('before:', JSON.stringify(before));
  console.log('stillOnFiles (blocked platemap click before data):', stillOnFiles);
  console.log('afterLoad:', JSON.stringify(afterLoad));
  console.log('stillOnFiles2 (blocked platemap click before mode):', stillOnFiles2);
  console.log('platemap disabled after setAssayMode:', afterMode);
  await browser.close();
})();
"
```

Expected: `before: {"assayDisabled":true,"platemapDisabled":true}`, `stillOnFiles (blocked...): true`, `afterLoad: {"assayDisabled":false,"platemapDisabled":true}`, `stillOnFiles2 (blocked...): true`, `platemap disabled after setAssayMode: false`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Gate Setup sub-tab order: Assay Info needs data, Plate Map needs assay mode

Nothing previously stopped a user from reaching Plate Map (and therefore
running a dose-response fit) without ever visiting Assay Info. Since every
fit call site falls through to the Displacement curve shape whenever
state.assayMode is null, a Gain-of-Signal user who skipped that step got
a silently wrong fit with no warning. Assay Info and Plate Map sub-tabs
are now disabled (greyed, non-clickable, and guarded in switchSetupTab)
until their prerequisite step is actually done.
EOF
)"
```

---

### Task 5: Endpoint/QC — separate auto (Plate Map) conditions from manual ones

**Files:**
- Modify: `Beacon/beacon.html` HTML — the `#panel-qc` block (currently ~lines 437-444)
- Modify: `Beacon/beacon.html` CSS (add `.qc-manual-summary` near `.card-hdr`, ~line 94)
- Modify: `Beacon/beacon.html` JS — `renderConditions` (currently lines 1064-1091); add new `renderConditionCard(cond)`

**Interfaces:**
- Consumes: `state.conditions` (unchanged shape, `auto:true`/absent distinguishes Plate-Map-derived vs manual entries — already set by the existing `seedQcFromPlateMap`/`addCondition`, neither of which this task modifies).
- Produces: `renderConditionCard(cond)` — a single-condition-card renderer factored out of `renderConditions`, used by no other task in this plan but kept as the obvious extension point if a future task needs to render one condition card outside this list.

**Problem:** `renderConditions()` renders every entry in `state.conditions` (both `auto:true` Plate-Map-derived entries and manually-added ones) into one undifferentiated list, with the "+ Ligand/Treated condition" / "+ No-Ligand/Untreated condition" buttons permanently visible above it — inviting a user who already painted a Plate Map to also click these and end up with confusing duplicate condition cards.

- [ ] **Step 1: Restructure the `#panel-qc` HTML**

Find (currently ~lines 437-444):

```html
<div class="panel active" id="panel-qc">
  <div class="row" style="margin-bottom:16px;">
    <button class="btn btn-primary btn-sm" onclick="addCondition('ligand')">+ Ligand/Treated condition</button>
    <button class="btn btn-sec btn-sm" onclick="addCondition('background')">+ No-Ligand/Untreated condition</button>
  </div>
  <div id="qc-conditions-wrap" style="margin-bottom:20px;"></div>
  <div class="card-hdr">Results</div>
  <div id="qc-results-wrap"></div>
</div>
```

Replace with:

```html
<div class="panel active" id="panel-qc">
  <div id="qc-auto-wrap" style="margin-bottom:16px;"></div>
  <details id="qc-manual-details">
    <summary class="qc-manual-summary">+ Add custom condition (advanced)</summary>
    <div class="row" style="margin:12px 0 16px;">
      <button class="btn btn-primary btn-sm" onclick="addCondition('ligand')">+ Ligand/Treated condition</button>
      <button class="btn btn-sec btn-sm" onclick="addCondition('background')">+ No-Ligand/Untreated condition</button>
    </div>
    <div id="qc-manual-wrap"></div>
  </details>
  <div class="card-hdr" style="margin-top:20px;">Results</div>
  <div id="qc-results-wrap"></div>
</div>
```

- [ ] **Step 2: Add the disclosure-summary CSS**

Add directly after the existing `.card-hdr{...}` rule (currently ~line 94):

```css
.qc-manual-summary{font-size:12px;font-weight:600;color:var(--accent);cursor:pointer;padding:6px 0;list-style:none;}
.qc-manual-summary::-webkit-details-marker{display:none;}
```

- [ ] **Step 3: Factor out `renderConditionCard(cond)` and split `renderConditions()` into auto/manual sections**

Replace `renderConditions` (currently lines 1064-1091) with:

```js
function renderConditionCard(cond){
  var html = '<div class="card" style="margin-bottom:10px;"><div class="row">';
  html += '<div class="field"><label>Name</label><input type="text" value="' + escapeAttr(cond.name) + '" onchange="updateConditionField(\'' + cond.id + '\',\'name\',this.value)"></div>';
  html += '<div class="field"><label>Role</label><select onchange="updateConditionField(\'' + cond.id + '\',\'role\',this.value)"' + (cond.auto ? ' disabled' : '') + '>';
  html += '<option value="ligand"' + (cond.role === 'ligand' ? ' selected' : '') + '>+Ligand / Treated</option>';
  html += '<option value="background"' + (cond.role === 'background' ? ' selected' : '') + '>No-Ligand / Untreated</option>';
  html += '</select></div>';
  html += '<div class="field"><label>Wells' + (cond.auto ? ' (from Plate Map)' : '') + '</label><input type="text" placeholder="A1-A3" value="' + escapeAttr(cond.wells) + '" onchange="updateConditionField(\'' + cond.id + '\',\'wells\',this.value)"' + (cond.auto ? ' disabled' : '') + '></div>';
  if(cond.role === 'ligand'){
    html += '<div class="field"><label>Background</label><select onchange="updateConditionField(\'' + cond.id + '\',\'bgId\',this.value)"><option value="">— none —</option>';
    state.conditions.filter(function(c){ return c.role === 'background'; }).forEach(function(bg){
      html += '<option value="' + bg.id + '"' + (cond.bgId === bg.id ? ' selected' : '') + '>' + escapeAttr(bg.name) + '</option>';
    });
    html += '</select></div>';
  }
  if (!cond.auto) html += '<button class="btn btn-sec btn-sm" onclick="removeCondition(\'' + cond.id + '\')">Remove</button>';
  html += '</div></div>';
  return html;
}

function renderConditions(){
  var autoWrap = document.getElementById('qc-auto-wrap');
  var manualWrap = document.getElementById('qc-manual-wrap');
  var manualDetails = document.getElementById('qc-manual-details');
  var autoConds = state.conditions.filter(function(c){ return c.auto; });
  var manualConds = state.conditions.filter(function(c){ return !c.auto; });

  if(!autoConds.length){
    autoWrap.innerHTML = '';
  } else {
    var ah = '<div class="setup-section-lbl">From Plate Map</div>';
    autoConds.forEach(function(cond){ ah += renderConditionCard(cond); });
    autoWrap.innerHTML = ah;
  }

  if(!manualConds.length){
    manualWrap.innerHTML = '<p style="font-size:12px;color:var(--text2);">Add a +Ligand/Treated condition and a No-Ligand/Untreated background condition to begin.</p>';
  } else {
    var mh = '';
    manualConds.forEach(function(cond){ mh += renderConditionCard(cond); });
    manualWrap.innerHTML = mh;
  }
  if(manualDetails) manualDetails.open = !autoConds.length;

  renderQCResults();
}
```

(`renderQCResults` itself, currently lines 1093-1122, is unchanged — it already correctly operates across all of `state.conditions` regardless of `auto`, since Z′ pairing logic doesn't care which UI section a condition is shown in.)

- [ ] **Step 4: Verify via Playwright**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  // before any data: auto-wrap empty, manual details open (since no auto conditions yet)
  const before = await page.evaluate(() => ({
    autoHtml: document.getElementById('qc-auto-wrap').innerHTML.trim(),
    manualOpen: document.getElementById('qc-manual-details').open
  }));
  // simulate Plate Map auto-deriving Background + DMSO
  await page.evaluate(() => {
    setAssayMode('gain');
    state.plateMap.background = ['A01','A02'];
    state.plateMap.dmso = ['B01','B02'];
    seedQcFromPlateMap();
  });
  const afterAuto = await page.evaluate(() => ({
    autoHasCard: document.getElementById('qc-auto-wrap').innerHTML.indexOf('Background (Plate Map)') !== -1,
    manualOpen: document.getElementById('qc-manual-details').open,
    manualConditionCount: state.conditions.filter(c => !c.auto).length
  }));
  // now add a manual condition and confirm it lands in the manual section, not mixed into auto
  await page.evaluate(() => addCondition('ligand'));
  const afterManualAdd = await page.evaluate(() => ({
    manualHasCard: document.getElementById('qc-manual-wrap').innerHTML.indexOf('Condition 1') !== -1,
    autoStillJustTwo: state.conditions.filter(c => c.auto).length
  }));
  console.log('before:', JSON.stringify(before));
  console.log('afterAuto:', JSON.stringify(afterAuto));
  console.log('afterManualAdd:', JSON.stringify(afterManualAdd));
  await browser.close();
})();
"
```

Expected: `before: {"autoHtml":"","manualOpen":true}`, `afterAuto: {"autoHasCard":true,"manualOpen":false,"manualConditionCount":0}`, `afterManualAdd: {"manualHasCard":true,"autoStillJustTwo":2}`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Endpoint/QC: separate Plate-Map-auto conditions from manual ones

Auto-derived (Plate Map) and manually-added conditions previously rendered
in one undifferentiated list, with the manual "+ condition" buttons always
visible above it -- a user who painted a Plate Map could still click them
and end up with confusing duplicate condition cards. Auto conditions now
get their own "From Plate Map" section; the manual add buttons + manual
conditions move into a collapsed "+ Add custom condition (advanced)"
disclosure, open by default only when there are no auto conditions yet.
EOF
)"
```

---

### Task 6: Lite mode — "Just show ratios" opt-in path

**Files:**
- Modify: `Beacon/beacon.html` state object (`state.liteMode`, ~line 514-522)
- Modify: `Beacon/beacon.html` HTML — Files pane (add the mode-choice cards after the Combined Preview group, ~line 317-321) and a new `#panel-lite` (add alongside the other `.panel` divs, after `#panel-tracer`, ~line 432)
- Modify: `Beacon/beacon.html` JS — refactor `renderCombinedTable` into a shared `_buildCombinedTableHtml()` helper (currently lines 948-973); add `renderLiteModeChoice`, `setLiteMode`, `renderLiteRatioTable`, `exportLiteRatiosXLSX`; extend `handlePheraFile` and `loadChannelFile` to reset `state.liteMode` on each new file load

**Interfaces:**
- Consumes: `_xlsxSafeCell`/`_sanitizeAoa` (existing, from the Report/export section, ~line 1514-1523) for the export — reused unchanged.
- Produces: `state.liteMode` (`null` = not yet chosen, `false` = full workflow, `true` = lite). No other task in this plan reads it, but it must stay `null` by default so Tasks 7-8's test-data loader (which goes straight to the full workflow) doesn't need to call `setLiteMode` at all.

**Goal:** let a user who only wants the raw ratio numbers skip Assay Info/Plate Map/QC/Dose-Response/Tracer Titration entirely, without removing or complicating the default full workflow for everyone else.

- [ ] **Step 1: Add `state.liteMode` to the state object**

In the `state` object (currently lines 514-522):

```js
var state = {
  plateFormat: '96',
  donor: null,
  acceptor: null,
  conditions: [],
  assayMode: null,
  plateMap: { background: [], dmso: [], compoundGroups: [], tracerGroups: [] },
  pheraMeta: null
};
```

Add `liteMode: null,` after `assayMode: null,`:

```js
var state = {
  plateFormat: '96',
  donor: null,
  acceptor: null,
  conditions: [],
  assayMode: null,
  liteMode: null,
  plateMap: { background: [], dmso: [], compoundGroups: [], tracerGroups: [] },
  pheraMeta: null
};
```

- [ ] **Step 2: Add the mode-choice cards to the Files pane**

Find, inside `#setup-pane-files` (currently ~lines 317-321):

```html
        <div class="setup-group">
          <div class="setup-section-lbl">Combined preview — raw ratio (acceptor / donor) per well</div>
          <div id="combined-table-wrap"><p style="font-size:12px;color:var(--text2);">Load plate data above to see the combined preview.</p></div>
        </div>
      </div>
      <div class="setup-pane" id="setup-pane-assay">
```

Insert a new `setup-group` between the combined-preview group and the closing `</div>` of `#setup-pane-files`:

```html
        <div class="setup-group">
          <div class="setup-section-lbl">Combined preview — raw ratio (acceptor / donor) per well</div>
          <div id="combined-table-wrap"><p style="font-size:12px;color:var(--text2);">Load plate data above to see the combined preview.</p></div>
        </div>

        <div class="setup-group" id="litemode-choice-group" style="display:none;">
          <div class="setup-section-lbl">How do you want to use this data?</div>
          <div class="assay-mode-grid">
            <div class="assay-mode-card" id="litemode-card-full" onclick="setLiteMode(false)">
              <div class="assay-mode-title">Full workflow</div>
              <div class="assay-mode-desc">Assay mode, Plate Map, QC, Dose-Response, and (when applicable) Tracer Titration — the guided pipeline.</div>
            </div>
            <div class="assay-mode-card" id="litemode-card-lite" onclick="setLiteMode(true)">
              <div class="assay-mode-title">Just show ratios</div>
              <div class="assay-mode-desc">Skip straight to the raw donor/acceptor ratio table and export it — no Plate Map or fitting.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="setup-pane" id="setup-pane-assay">
```

- [ ] **Step 3: Add the `#panel-lite` view**

Find the end of `#panel-tracer` (currently ~lines 427-432):

```html
<div class="panel" id="panel-tracer">
  ...
  <div class="card">
    <div class="card-hdr">Binding curve</div>
    <div id="tracer-results-wrap" style="margin-bottom:14px;"></div>
    <canvas id="tracer-canvas" width="600" height="320" style="max-width:100%;border-radius:8px;"></canvas>
  </div>
</div>
<div class="panel" id="panel-report">
```

Insert a new panel between them:

```html
<div class="panel" id="panel-tracer">
  ...
  <div class="card">
    <div class="card-hdr">Binding curve</div>
    <div id="tracer-results-wrap" style="margin-bottom:14px;"></div>
    <canvas id="tracer-canvas" width="600" height="320" style="max-width:100%;border-radius:8px;"></canvas>
  </div>
</div>
<div class="panel" id="panel-lite">
  <div class="row" style="margin-bottom:14px;">
    <button class="btn btn-primary btn-sm" onclick="exportLiteRatiosXLSX()">Download Excel (ratios)</button>
    <button class="btn btn-sec btn-sm" onclick="openSetupModal();switchSetupTab('files');">Load a different file</button>
  </div>
  <div class="card-hdr">Raw ratio (acceptor / donor) per well</div>
  <div id="lite-table-wrap"></div>
</div>
<div class="panel" id="panel-report">
```

- [ ] **Step 4: Refactor `renderCombinedTable` into a shared helper**

Replace `renderCombinedTable` (currently lines 948-973) with:

```js
function _buildCombinedTableHtml(){
  if(!state.donor && !state.acceptor){
    return '<p style="font-size:12px;color:var(--text2);">Load or enter donor and acceptor values to see the combined plate preview.</p>';
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
      html += '<td>' + label + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderCombinedTable(){
  document.getElementById('combined-table-wrap').innerHTML = _buildCombinedTableHtml();
}

function renderLiteRatioTable(){
  var wrap = document.getElementById('lite-table-wrap');
  if (wrap) wrap.innerHTML = _buildCombinedTableHtml();
}
```

- [ ] **Step 5: Add `renderLiteModeChoice`, `setLiteMode`, `exportLiteRatiosXLSX`**

Add these new functions directly after `renderLiteRatioTable`:

```js
function renderLiteModeChoice(){
  var group = document.getElementById('litemode-choice-group');
  if (!group) return;
  group.style.display = (state.donor && state.acceptor && state.liteMode === null) ? '' : 'none';
}

function setLiteMode(isLite){
  state.liteMode = isLite;
  var fullCard = document.getElementById('litemode-card-full');
  var liteCard = document.getElementById('litemode-card-lite');
  if (fullCard) fullCard.classList.toggle('active', !isLite);
  if (liteCard) liteCard.classList.toggle('active', isLite);
  renderLiteModeChoice();
  ['qc', 'dose', 'report'].forEach(function(name){
    var t = document.querySelector('.tab[data-tab="' + name + '"]');
    if (t) t.style.display = isLite ? 'none' : '';
  });
  var tracerTab = document.querySelector('.tab[data-tab="tracer"]');
  if (tracerTab) tracerTab.style.display = (isLite || state.assayMode !== 'displacement') ? 'none' : '';
  if (isLite) {
    closeSetupModal();
    renderLiteRatioTable();
    switchTab('lite');
  } else {
    switchTab('qc');
  }
}

function exportLiteRatiosXLSX(){
  if (!state.donor || !state.acceptor) { alert('Load plate data first (Setup → Files).'); return; }
  var dims = state.plateFormat === '384' ? { rows: 16, cols: 24 } : { rows: 8, cols: 12 };
  var ROWS = 'ABCDEFGHIJKLMNOP';
  var rows = [['Well', 'Donor', 'Acceptor', 'Raw ratio (acceptor/donor)']];
  for (var r = 0; r < dims.rows; r++){
    for (var c = 1; c <= dims.cols; c++){
      var wellId = ROWS[r] + (c < 10 ? '0' + c : c);
      var d = getWellValue(state.donor, wellId);
      var a = getWellValue(state.acceptor, wellId);
      var ratio = (d !== null && a !== null && d !== 0 && a !== 0) ? rawRatio(d, a) : '';
      rows.push([wellId, d === null ? '' : d, a === null ? '' : a, ratio]);
    }
  }
  var ws = XLSX.utils.aoa_to_sheet(_sanitizeAoa(rows));
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ratios');
  var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  var blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Beacon_ratios.xlsx';
  a.click();
}
```

- [ ] **Step 6: Reset `state.liteMode` and restore full tab visibility whenever a new file loads**

In `handlePheraFile` (currently lines 2007-2053), the success path (as already extended by Task 4) ends with:

```js
      document.getElementById('phera-fname').textContent = file.name;
      document.getElementById('phera-drop').classList.add('filled');
      renderPheraMeta();
      renderCombinedTable();
      renderPlateMapGrid();
      renderDoseGroupList();
      renderSetupTabGate();
    } catch (err) {
```

Add the lite-mode reset right before `renderSetupTabGate();`:

```js
      document.getElementById('phera-fname').textContent = file.name;
      document.getElementById('phera-drop').classList.add('filled');
      renderPheraMeta();
      renderCombinedTable();
      renderPlateMapGrid();
      renderDoseGroupList();
      state.liteMode = null;
      ['qc', 'dose', 'report'].forEach(function(name){
        var t = document.querySelector('.tab[data-tab="' + name + '"]');
        if (t) t.style.display = '';
      });
      renderTabVisibility();
      renderLiteModeChoice();
      renderSetupTabGate();
    } catch (err) {
```

In `loadChannelFile` (currently lines 925-946), the end (as already extended by Task 4) is:

```js
    document.getElementById(channel + '-status').textContent = file.name;
    renderCombinedTable();
    renderPlateMapGrid();
    renderDoseGroupList();
    renderSetupTabGate();
  };
  reader.readAsText(file);
```

Add the same reset right before `renderSetupTabGate();`:

```js
    document.getElementById(channel + '-status').textContent = file.name;
    renderCombinedTable();
    renderPlateMapGrid();
    renderDoseGroupList();
    state.liteMode = null;
    ['qc', 'dose', 'report'].forEach(function(name){
      var t = document.querySelector('.tab[data-tab="' + name + '"]');
      if (t) t.style.display = '';
    });
    renderTabVisibility();
    renderLiteModeChoice();
    renderSetupTabGate();
  };
  reader.readAsText(file);
```

- [ ] **Step 7: Verify via Playwright**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    var rows = [['Table End point'],['Well','Type','665 (LUM)','620 (LUM) LP']];
    var ROWS='ABCDEFGH';
    for (var r=0;r<8;r++) for (var c=1;c<=12;c++){ var w=ROWS[r]+(c<10?'0'+c:c); rows.push([w,'Sample',5000+c*10,1000+c]); }
    var ws=XLSX.utils.aoa_to_sheet(rows); var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Table End point');
    var out=XLSX.write(wb,{type:'array',bookType:'xlsx'});
    handlePheraFile(new File([new Blob([out])], 't.xlsx'));
  });
  await page.waitForTimeout(300);
  const choiceVisible = await page.evaluate(() => getComputedStyle(document.getElementById('litemode-choice-group')).display !== 'none');
  await page.evaluate(() => setLiteMode(true));
  const afterLite = await page.evaluate(() => ({
    modalHidden: document.getElementById('setup-modal').classList.contains('hidden'),
    litePanelActive: document.getElementById('panel-lite').classList.contains('active'),
    qcTabHidden: document.querySelector('.tab[data-tab=\"qc\"]').style.display === 'none',
    tableHasRatio: document.getElementById('lite-table-wrap').innerHTML.indexOf('.') !== -1
  }));
  const exportOk = await page.evaluate(() => { try { exportLiteRatiosXLSX(); return true; } catch(e) { return e.message; } });
  // loading a new file should re-ask
  await page.evaluate(() => {
    var rows = [['Table End point'],['Well','Type','665 (LUM)','620 (LUM) LP']];
    var ROWS='ABCDEFGH';
    for (var r=0;r<8;r++) for (var c=1;c<=12;c++){ var w=ROWS[r]+(c<10?'0'+c:c); rows.push([w,'Sample',6000,1100]); }
    var ws=XLSX.utils.aoa_to_sheet(rows); var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Table End point');
    var out=XLSX.write(wb,{type:'array',bookType:'xlsx'});
    handlePheraFile(new File([new Blob([out])], 't2.xlsx'));
  });
  await page.waitForTimeout(300);
  const afterReload = await page.evaluate(() => ({
    liteMode: state.liteMode,
    qcTabVisible: document.querySelector('.tab[data-tab=\"qc\"]').style.display !== 'none',
    choiceVisibleAgain: getComputedStyle(document.getElementById('litemode-choice-group')).display !== 'none'
  }));
  console.log('choiceVisible:', choiceVisible);
  console.log('afterLite:', JSON.stringify(afterLite));
  console.log('exportOk:', exportOk);
  console.log('afterReload:', JSON.stringify(afterReload));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `choiceVisible: true`, `afterLite: {"modalHidden":true,"litePanelActive":true,"qcTabHidden":true,"tableHasRatio":true}`, `exportOk: true`, `afterReload: {"liteMode":null,"qcTabVisible":true,"choiceVisibleAgain":true}`, `ERRORS: []`.

- [ ] **Step 8: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Add lite mode: optional "just show ratios" path that skips the full pipeline

Some users only want the raw donor/acceptor ratio table to plot themselves
elsewhere, not the full Assay Info/Plate Map/QC/Dose-Response/Tracer
pipeline. After loading a file, Setup now asks once: "Full workflow" vs
"Just show ratios". Choosing lite mode closes Setup directly into a new
ratio-table view with an Excel export button and hides the now-irrelevant
tabs (Guide stays visible). The choice is per file load -- loading a new
file always re-asks. Full workflow behavior is otherwise unchanged.
EOF
)"
```

---

### Task 7: Test data — Gain-of-Signal and Tracer Displacement datasets

**Files:**
- Modify: `Beacon/beacon.html` HTML — add a "Try it with test data" `setup-group` in the Files pane (after the PHERAstar dropzone group, ~line 280)
- Modify: `Beacon/beacon.html` JS — add `_buildTestPheraWorkbook(mode)` and `loadTestData(mode)`

**Interfaces:**
- Consumes: `pmColumnWells(col)` (Task 3), `setAssayMode` / `renderSetupTabGate` (Task 4), `renderLiteModeChoice` (Task 6) — this task must run after Tasks 3, 4, and 6. Also consumes existing, unmodified calc functions `_4plVal4_gain`, `_oneSiteVal`, and existing parse functions `parsePheraTableEndpoint`, `extractPheraProtocolFields` (all already in the file, none touched by this plan).
- Produces: nothing consumed by other tasks — this is the last task.

**Design notes:** rather than hand-crafting and base64-embedding a static `.xlsx` file (more common when a real captured lab export needs to be preserved byte-for-byte, like Echo's test data), this task generates the synthetic workbook *in memory* using the `XLSX` library already bundled in the file, then feeds it through the same `parsePheraTableEndpoint`/`extractPheraProtocolFields` functions a real upload would use — keeping the dataset's actual values visible and editable as plain JS, with no large opaque blob to maintain. Layout (96-well plate, columns instead of rows so both datasets fit in 96 wells): column 1 = Background, column 2 = DMSO, columns 3-7 = 5 Compound dose groups (1/10/100/1000/10000 nM), columns 8-11 (Tracer Displacement only) = 4 Tracer dose groups (3/10/30/100 nM). Values are constructed directly from the existing `_4plVal4_gain`/one-site-binding formulas so the resulting fit is clean and deterministic (no random jitter, so repeated test runs always produce the same numbers).

- [ ] **Step 1: Add the "Try it with test data" UI to the Files pane**

Find, inside `#setup-pane-files` (currently right after the PHERAstar dropzone group's `<div id="phera-meta-wrap"></div>`, ~line 280):

```html
          <div id="phera-meta-wrap"></div>
        </div>

        <div class="setup-group">
          <span class="setup-fallback-toggle" id="fallback-toggle" onclick="toggleFilesFallback()">Or import donor/acceptor CSVs separately</span>
```

Insert a new `setup-group` between them:

```html
          <div id="phera-meta-wrap"></div>
        </div>

        <div class="setup-group">
          <div class="setup-section-lbl">Try it with test data</div>
          <div class="assay-mode-grid">
            <div class="assay-mode-card" onclick="loadTestData('gain')">
              <div class="assay-mode-title">⚗ Gain-of-Signal</div>
              <div class="assay-mode-desc">Synthetic 96-well plate — Background/DMSO + 5 Compound dose groups, clean rising curve.</div>
            </div>
            <div class="assay-mode-card" onclick="loadTestData('displacement')">
              <div class="assay-mode-title">⚗ Tracer Displacement</div>
              <div class="assay-mode-desc">Synthetic 96-well plate — Background/DMSO + Compound (falling curve) + Tracer (binding curve) groups.</div>
            </div>
          </div>
        </div>

        <div class="setup-group">
          <span class="setup-fallback-toggle" id="fallback-toggle" onclick="toggleFilesFallback()">Or import donor/acceptor CSVs separately</span>
```

- [ ] **Step 2: Add `_buildTestPheraWorkbook(mode)` and `loadTestData(mode)`**

Add these two functions directly after `setupDrop('phera-drop', 'phera-file', function(files){ handlePheraFile(files[0]); });` (currently the line right before `openSetupModal();` at the end of the script):

```js
function _buildTestPheraWorkbook(mode) {
  var ROWS = 'ABCDEFGH';
  var rows = [['Well', 'Type', '665 (LUM)', '620 (LUM) LP']];
  var donor = 5000;
  function pushWell(wellId, mbu) {
    rows.push([wellId, 'Sample', donor, mbu * donor / 1000]);
  }
  var baseline = 500;
  for (var r = 0; r < 8; r++) {
    pushWell(ROWS[r] + '01', baseline);
    pushWell(ROWS[r] + '02', baseline);
  }
  var concs = [1, 10, 100, 1000, 10000];
  concs.forEach(function(c, i) {
    var xi = Math.log10(c);
    var corrected = mode === 'gain'
      ? _4plVal4_gain(xi, 0, 2, 1, 500)
      : (-400 + 400 / (1 + Math.pow(10, xi - 2)));
    var mbuTarget = baseline + corrected;
    var col = 3 + i;
    for (var r2 = 0; r2 < 8; r2++) pushWell(ROWS[r2] + (col < 10 ? '0' + col : col), mbuTarget);
  });
  if (mode === 'displacement') {
    var tConcs = [3, 10, 30, 100];
    tConcs.forEach(function(c, i) {
      var signal = _oneSiteVal(c, 400, 20);
      var col = 8 + i;
      for (var r3 = 0; r3 < 8; r3++) pushWell(ROWS[r3] + (col < 10 ? '0' + col : col), signal);
    });
  }
  var protRows = [
    ['Test Name', mode === 'gain' ? 'Beacon Test - Gain-of-Signal' : 'Beacon Test - Tracer Displacement'],
    ['Test ID', 'TEST-001'],
    ['Date', new Date().toISOString().slice(0, 10)],
    ['Time', '10:00:00'],
    ['Microplate name', '96 well plate'],
    ['Optic module', 'BRET']
  ];
  var ws1 = XLSX.utils.aoa_to_sheet(rows);
  var ws2 = XLSX.utils.aoa_to_sheet(protRows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Table End point');
  XLSX.utils.book_append_sheet(wb, ws2, 'Protocol Information');
  return { wb: wb, filename: mode === 'gain' ? 'Beacon_test_gain.xlsx' : 'Beacon_test_displacement.xlsx' };
}

function loadTestData(mode) {
  var built = _buildTestPheraWorkbook(mode);
  var wb = built.wb;
  var tableRows = XLSX.utils.sheet_to_json(wb.Sheets['Table End point'], { header: 1, defval: '' });
  var parsed = parsePheraTableEndpoint(tableRows);
  state.donor = parsed.donor;
  state.acceptor = parsed.acceptor;
  state.plateFormat = parsed.plateFormat;
  var protRows = XLSX.utils.sheet_to_json(wb.Sheets['Protocol Information'], { header: 1, defval: '' })
    .filter(function(r){ return r.some(function(c){ return String(c).trim() !== ''; }); });
  state.pheraMeta = extractPheraProtocolFields(protRows);
  state.pheraProtocolRows = protRows;
  document.getElementById('fmt-96').classList.toggle('active', parsed.plateFormat === '96');
  document.getElementById('fmt-384').classList.toggle('active', parsed.plateFormat === '384');
  document.getElementById('phera-fname').textContent = built.filename;
  document.getElementById('phera-drop').classList.add('filled');
  renderPheraMeta();
  renderCombinedTable();

  state.liteMode = null;
  ['qc', 'dose', 'report'].forEach(function(name){
    var t = document.querySelector('.tab[data-tab="' + name + '"]');
    if (t) t.style.display = '';
  });
  renderLiteModeChoice();

  setAssayMode(mode); // resets state.plateMap + PM_GROUP_SEQ; re-rendered below once populated

  var pm = state.plateMap;
  pm.background = pmColumnWells(1);
  pm.dmso = pmColumnWells(2);
  var concs = [1, 10, 100, 1000, 10000];
  concs.forEach(function(c, i){
    var wells = pmColumnWells(3 + i);
    var color = PM_COMPOUND_COLORS[i % PM_COMPOUND_COLORS.length];
    pm.compoundGroups.push({ id: ++PM_GROUP_SEQ, wells: wells, conc: c, color: color });
  });
  if (mode === 'displacement') {
    var tConcs = [3, 10, 30, 100];
    tConcs.forEach(function(c, i){
      var wells = pmColumnWells(8 + i);
      var color = PM_TRACER_COLORS[i % PM_TRACER_COLORS.length];
      pm.tracerGroups.push({ id: ++PM_GROUP_SEQ, wells: wells, conc: c, color: color });
    });
  }
  seedQcFromPlateMap();
  renderPlateMapGrid();
  renderDoseGroupList();
  renderDoseSummary();
  renderTracerSummary();
  renderSetupTabGate();
  closeSetupModal();
  switchTab('qc');
}
```

(Note the comment in `loadTestData`: `setAssayMode(mode)` resets `state.plateMap` to empty as one of its existing side effects — this is intentional pre-existing behavior, not something this task changes. Calling it *before* populating `pm.background`/`pm.dmso`/the dose groups, and re-rendering everything afterward, avoids the well-documented gotcha where `setAssayMode` wipes out plate-map data if called after it's been set.)

- [ ] **Step 3: Verify via Playwright — Gain-of-Signal**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => loadTestData('gain'));
  await page.waitForTimeout(200);
  const state1 = await page.evaluate(() => ({
    assayMode: state.assayMode,
    groups: state.plateMap.compoundGroups.length,
    concsSet: state.plateMap.compoundGroups.every(g => g.conc !== null),
    bgWells: state.plateMap.background.length,
    dmsoWells: state.plateMap.dmso.length
  }));
  await page.evaluate(() => switchTab('dose'));
  await page.evaluate(() => computeDoseResponse());
  const fit1 = await page.evaluate(() => ({ r2: lastFitResult.fit.r2 }));
  console.log('gain state:', JSON.stringify(state1));
  console.log('gain fit:', JSON.stringify(fit1));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `gain state: {"assayMode":"gain","groups":5,"concsSet":true,"bgWells":8,"dmsoWells":8}`, `gain fit: {"r2":<a number > 0.95>}`, `ERRORS: []`.

- [ ] **Step 4: Verify via Playwright — Tracer Displacement**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + process.cwd() + '/Beacon/beacon.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => loadTestData('displacement'));
  await page.waitForTimeout(200);
  const state1 = await page.evaluate(() => ({
    assayMode: state.assayMode,
    compoundGroups: state.plateMap.compoundGroups.length,
    tracerGroups: state.plateMap.tracerGroups.length,
    tracerTabVisible: document.querySelector('.tab[data-tab=\"tracer\"]').style.display !== 'none'
  }));
  await page.evaluate(() => switchTab('dose'));
  await page.evaluate(() => computeDoseResponse());
  const fit1 = await page.evaluate(() => ({ r2: lastFitResult.fit.r2, ec50: Math.pow(10, lastFitResult.fit.params[1]) }));
  await page.evaluate(() => switchTab('tracer'));
  await page.evaluate(() => computeTracerTitration());
  const fit2 = await page.evaluate(() => ({ r2: lastTracerFitResult.fit.r2, kd: lastTracerFitResult.fit.params[1] }));
  console.log('displacement state:', JSON.stringify(state1));
  console.log('dose fit:', JSON.stringify(fit1));
  console.log('tracer fit:', JSON.stringify(fit2));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
"
```

Expected: `displacement state: {"assayMode":"displacement","compoundGroups":5,"tracerGroups":4,"tracerTabVisible":true}`, `dose fit.r2 > 0.95` with `ec50` near `100`, `tracer fit.r2 > 0.95` with `kd` near `20`, `ERRORS: []`.

- [ ] **Step 5: Rebuild the Hub and do one final embed-level smoke check**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
python3 embed.py
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1400,height:1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  await page.goto('file://' + process.cwd() + '/The Hub.html');
  await page.waitForTimeout(500);
  await page.evaluate(() => openApp('beacon'));
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    var frame = document.getElementById('frame-beacon').contentWindow;
    frame.loadTestData('gain');
  });
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => document.getElementById('frame-beacon').contentWindow.state.plateMap.compoundGroups.length === 5);
  console.log('ERRORS:', JSON.stringify(errors));
  console.log('test data worked through the embedded Hub:', ok);
  await browser.close();
})();
"
```

Expected: `ERRORS: []`, `test data worked through the embedded Hub: true` — confirms the whole plan's worth of changes (especially Task 1's embed fix) works end-to-end through the real Hub, not just standalone.

- [ ] **Step 6: Commit**

```bash
cd /Users/jonmacicior/Desktop/The_Hub/.claude/worktrees/beacon-fixes
git add Beacon/beacon.html
git commit -m "$(cat <<'EOF'
Add Gain-of-Signal and Tracer Displacement test datasets

Beacon had no "Load test data" option, unlike every other Hub app with a
multi-step setup flow (Echo, Degradation Explorer). Added two synthetic
96-well datasets generated in-memory via the already-bundled XLSX library
and fed through the same parsePheraTableEndpoint/extractPheraProtocolFields
functions a real upload uses: Gain-of-Signal (Background/DMSO + 5 Compound
groups, clean rising curve) and Tracer Displacement (same plus 4 Tracer
groups for a clean one-site binding curve). Both are reachable from a new
"Try it with test data" control in Setup -> Files and land the user
directly in the full guided workflow with everything pre-painted.
EOF
)"
```
