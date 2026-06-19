# LabMate Mobile/Tablet Tile Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace LabMate's 8 separately-implemented "grid of cards → tap → detail" section navigations with one shared, data-driven tile-grid component, and widen the existing 700px mobile breakpoint to 900px so tablets get the same treatment — fixing the cross-section inconsistency that was the #1 complaint from brainstorming.

**Architecture:** One new shared `renderToolGrid()` JS function renders either compact icon-badge tiles (≤900px) or the existing icon+title+description cards (>900px) from a plain `TOOLS_*` array per section. Existing show/hide functions (`showProto`, `showQcTool`, `showAssayTab`) keep their names and call signatures unchanged — only their internals gain a 2-line slide-transition hook — since they're called from many places beyond their own home grid that aren't safe to rename in one pass.

**Tech Stack:** Single HTML file (`Labmate/labmate.html`), vanilla JS (ES5-style, no build step), plain CSS. Verification via Playwright (headless Chrome) screenshots and console-error checks.

---

## Before you start

Read `docs/superpowers/specs/2026-06-19-labmate-mobile-tile-redesign-design.md` once for context on *why* each decision below was made — it documents several scope corrections found during planning (e.g. Cell Lines is intentionally NOT migrated the same way, the dead-code removal is narrower than first proposed). This plan is the authoritative *what/how*; the spec is background.

All file edits below are against `/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html`. Line numbers are approximate (cited for navigation) — match on the quoted text, not the number, since earlier tasks shift later line numbers.

---

### Task 1: Widen the mobile breakpoint from 700px to 900px

**Files:**
- Modify: `Labmate/labmate.html` (8 CSS media query blocks + 1 JS function)

**Why:** The app's entire mobile mode (sidebar hidden, hamburger shown, mobile home grid, back-button shown, compact padding/inputs) is driven by `@media (max-width: 700px)`. Brainstorming concluded the new tile pattern should cover tablets too, i.e. the sidebar should only appear on screens wider than 900px. A full-file grep confirms the literal string `700px` appears in exactly 8 places, all of them this media query's opener — no unrelated CSS uses that value — so a global replace is safe.

- [ ] **Step 1: Confirm the 8 occurrences and that there are no false positives**

Run: `grep -n "700px" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: exactly 8 lines, every one starting with `@media (max-width: 700px)`. If any line does NOT look like a media query opener, stop and report it instead of proceeding.

- [ ] **Step 2: Replace all 8 occurrences**

Run:
```bash
sed -i '' 's/@media (max-width: 700px)/@media (max-width: 900px)/g' "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"
```

- [ ] **Step 3: Update the JS breakpoint helper**

Find (around line 10695):
```js
function _lmIsMobile() { return window.innerWidth <= 700; }
```

Replace with:
```js
function _lmIsMobile() { return window.innerWidth <= 900; }
```

- [ ] **Step 4: Verify no other literal `700` was meant to change, and no `700px` remains**

Run: `grep -n "700px" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: no output (zero matches).

Run: `grep -c "900px" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: `8` (the 8 media queries), possibly more if `900px` already appeared elsewhere for unrelated reasons — if the count is less than 8, the replace didn't apply to all blocks; investigate before continuing.

- [ ] **Step 5: Live-verify the boundary moved, via Playwright**

Run this Node script (adjust nothing, it's self-contained):

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  for (const w of [700, 850, 900, 950, 1100]) {
    const page = await browser.newPage({viewport:{width:w, height:800}});
    await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
    await page.waitForTimeout(300);
    const sidebarVisible = await page.evaluate(() => {
      const sb = document.querySelector('.sidebar');
      return sb ? getComputedStyle(sb).display !== 'none' : null;
    });
    console.log(w + 'px: sidebar visible = ' + sidebarVisible);
    await page.close();
  }
  await browser.close();
})();
"
```

Expected output: sidebar visible = `false` at 700, 850, 900; `true` at 950, 1100. (At exactly 900 the media query `max-width:900px` still applies, so sidebar stays hidden — that's correct, "≤900px" means 900 itself is still mobile mode.)

- [ ] **Step 6: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: widen mobile/tablet breakpoint from 700px to 900px"
```

---

### Task 2: Add shared tile-grid and detail-page CSS

**Files:**
- Modify: `Labmate/labmate.html` (CSS insertion only, no JS/HTML yet)

**Why:** This adds the new visual vocabulary (`.lm-tile-grid`, `.lm-tile`, slide-in keyframe) without wiring it to anything yet, so it can be verified in isolation before any section depends on it.

- [ ] **Step 1: Insert the new CSS block**

Find this exact text (a blank line immediately followed by the mobile home grid comment — search for the comment to anchor, the blank line above it is line ~1151):
```css
/* ── MOBILE HOME GRID ── */
```

Insert immediately BEFORE that line (i.e. before the comment, keeping the comment and everything after it unchanged):
```css
/* ── Unified mobile/tablet tool tiles (≤900px) and detail-page chrome ── */
.lm-tile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lm-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 8px; min-height: 96px; cursor: pointer;
  font-family: var(--sans); text-align: center; -webkit-tap-highlight-color: transparent;
  transition: transform .08s ease, border-color .15s ease;
}
.lm-tile:active { transform: scale(0.96); }
.lm-tile-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.lm-tile-badge { font-family: var(--mono); font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.3px; }
.lm-tile-title { font-size: 12.5px; font-weight: 600; color: var(--text); line-height: 1.25; }
.tile-quickcalc   { background: #0079b9; }
.tile-molbio      { background: #2d7a38; }
.tile-crispr      { background: #6d28d9; }
.tile-cellbio     { background: #b5175a; }
.tile-proteomics  { background: #0277bd; }
.tile-genomics    { background: #c2185b; }
.tile-structbio   { background: #4527a0; }
.tile-assays      { background: #c62828; }
.tile-celllines   { background: #374151; }

@keyframes lmDetailIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@media (max-width: 900px) {
  .lm-detail-page { animation: lmDetailIn .28s ease; }
}

```

- [ ] **Step 2: Sanity-check the file still parses as valid HTML (no stray tag/brace damage)**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html', 'utf8');
const opens = (html.match(/<style>/g) || []).length;
const closes = (html.match(/<\/style>/g) || []).length;
console.log('style open/close:', opens, closes);
"
```

Expected: both numbers equal (same as before this edit — this just confirms you didn't break out of the `<style>` block).

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: add shared tile-grid and detail-page CSS (unused until Task 3+)"
```

---

### Task 3: Add the shared `renderToolGrid()` function and wire it into the resize listener

**Files:**
- Modify: `Labmate/labmate.html` (JS insertion only)

**Why:** This is the one function every section task from here on calls. It takes a container id, a `TOOLS_*` array, and a small classes object, and renders either tiles (≤900px) or the existing card look (>900px). Each array entry carries its own `open` callback (not a single shared one), because Task "Migrate Cell Biology" needs mixed dispatch — some of its cards open a protocol, others jump to a different section's cell-line reference entry.

- [ ] **Step 1: Insert the shared function and the (initially empty) aggregator**

Find (around line 5590):
```js
function showQcTool(tool) {
```

Insert immediately BEFORE that line:
```js
// ── Unified tool-grid renderer: ≤900px tiles vs >900px cards, shared by 8 sections ──
function renderToolGrid(containerId, tools, desktopClasses) {
  var container = document.getElementById(containerId);
  if (!container || !tools) return;
  container.innerHTML = '';
  if (_lmIsMobile()) {
    container.className = 'lm-tile-grid';
    tools.forEach(function(t) {
      var tile = document.createElement('button');
      tile.className = 'lm-tile';
      tile.setAttribute('aria-label', 'Open ' + t.title);
      tile.innerHTML =
        '<div class="lm-tile-icon ' + desktopClasses.tileColorClass + '"><span class="lm-tile-badge">' + t.badge + '</span></div>' +
        '<span class="lm-tile-title">' + t.title + '</span>';
      tile.onclick = t.open;
      container.appendChild(tile);
    });
  } else {
    container.className = desktopClasses.gridClass;
    tools.forEach(function(t) {
      var card = document.createElement('button');
      card.className = desktopClasses.cardClass;
      card.setAttribute('aria-label', 'Open ' + t.title);
      var html = '<div class="' + desktopClasses.titleClass + '">' + t.title + '</div>';
      if (t.desc) html += '<div class="' + desktopClasses.subClass + '">' + t.desc + '</div>';
      if (t.formula && desktopClasses.formulaClass) html += '<div class="' + desktopClasses.formulaClass + '">' + t.formula + '</div>';
      card.innerHTML = html;
      card.onclick = t.open;
      container.appendChild(card);
    });
  }
}

// Each migrated section adds its own renderToolGrid(...) call inside this function
// (one line per section, added by that section's migration task).
function _lmRenderAllToolGrids() {
}
_lmRenderAllToolGrids();

function showQcTool(tool) {
```

- [ ] **Step 2: Wire the resize listener to re-render on breakpoint crossing**

Find (around line 10890):
```js
window.addEventListener('resize', function(){
  // Recompute mob-at-home boundary on rotation/resize.
  if (!_lmIsMobile()) {
    // Desktop: hide breadcrumb (CSS handles it via @media)
  }
  updateMobBreadcrumb();
});
```

Replace with:
```js
window.addEventListener('resize', function(){
  // Recompute mob-at-home boundary on rotation/resize.
  if (!_lmIsMobile()) {
    // Desktop: hide breadcrumb (CSS handles it via @media)
  }
  updateMobBreadcrumb();
  _lmRenderAllToolGrids();
});
```

- [ ] **Step 3: Verify with a temporary manual test (no real section wired yet)**

Run:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    var div = document.createElement('div');
    div.id = 'tmp-test-grid';
    document.body.appendChild(div);
    renderToolGrid('tmp-test-grid', [
      { title: 'Test One', badge: 'T1', desc: 'desc one', open: function(){ window._tmpClicked = 'one'; } },
      { title: 'Test Two', badge: 'T2', desc: 'desc two', open: function(){ window._tmpClicked = 'two'; } }
    ], { tileColorClass: 'tile-quickcalc', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
    var tiles = document.querySelectorAll('#tmp-test-grid .lm-tile');
    tiles[0].click();
    var clicked = window._tmpClicked;
    document.body.removeChild(div);
    return { tileCount: tiles.length, clicked: clicked };
  });
  console.log(JSON.stringify(result));
  await browser.close();
})();
"
```

Expected: `{"tileCount":2,"clicked":"one"}` and no `PAGE ERROR` lines.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: add shared renderToolGrid() function, wire into resize listener"
```

---

### Task 4: Migrate Mol Biology (also adds the slide-transition hook shared by 6 sections)

**Files:**
- Modify: `Labmate/labmate.html`

**Why this section first:** Mol Biology uses the generic `showProto(sec, pid)` / `showProtoHome(sec)` pair that Mol Biology, CRISPR, Cell Biology, Proteomics, Genomics, and Struct Bio all share. Adding the slide-transition hook here benefits all 6 at once — later tasks for those 5 sections only need their own registry + container swap, not another copy of this hook.

- [ ] **Step 1: Add the `TOOLS_molbio` registry**

Find (around line 5589, right before the function you inserted in Task 3):
```js
function showQcTool(tool) {
```

Insert immediately BEFORE that line:
```js
var TOOLS_molbio = [
  { title: 'Gibson Assembly', badge: 'GIB', desc: 'Seamless cloning — NEBuilder HiFi 50 °C × 1 h.', open: function(){ showProto('molbio', 'proto-gibson'); } },
  { title: 'Restriction Cloning', badge: 'RE', desc: 'Classical restriction digest + ligation cloning.', open: function(){ showProto('molbio', 'proto-redigest'); } },
  { title: 'Transformation', badge: 'TRF', desc: 'Heat-shock 42 °C × 30 s into competent <em>E. coli</em>.', open: function(){ showProto('molbio', 'proto-transfo'); } },
  { title: 'Miniprep (GeneJET)', badge: 'MINI', desc: 'Plasmid DNA purification from 5 mL overnight culture.', open: function(){ showProto('molbio', 'proto-miniprep'); } },
  { title: 'NucleoSpin Cleanup', badge: 'NSC', desc: 'PCR / gel-extraction cleanup (Macherey-Nagel).', open: function(){ showProto('molbio', 'proto-nucleospin'); } }
];

function showQcTool(tool) {
```

- [ ] **Step 2: Replace the hardcoded Mol Biology grid HTML with an empty container**

Find this exact block (around line 2201):
```html
  <div class="proto-home" id="molbio-home">
    <div class="proto-banner proto-banner-protocol" id="bn-molbio-protocol">
      <span class="proto-banner-label">Protocol</span>
      <span class="proto-banner-sub">Cloning · Transformation</span>
    </div>
    <button class="proto-home-card" onclick="showProto('molbio', 'proto-gibson')" aria-label="Open Gibson Assembly">
      <div class="proto-home-title">Gibson Assembly</div>
      <div class="proto-home-sub">Seamless cloning — NEBuilder HiFi 50 °C × 1 h.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('molbio', 'proto-redigest')" aria-label="Open Restriction Cloning">
      <div class="proto-home-title">Restriction Cloning</div>
      <div class="proto-home-sub">Classical restriction digest + ligation cloning.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('molbio', 'proto-transfo')" aria-label="Open Transformation">
      <div class="proto-home-title">Transformation</div>
      <div class="proto-home-sub">Heat-shock 42 °C × 30 s into competent <em>E. coli</em>.</div>
    </button>
    <div class="proto-banner proto-banner-prep" id="bn-molbio-prep">
      <span class="proto-banner-label">Prep</span>
      <span class="proto-banner-sub">DNA purification · Cleanup</span>
    </div>
    <button class="proto-home-card" onclick="showProto('molbio', 'proto-miniprep')" aria-label="Open Miniprep (GeneJET)">
      <div class="proto-home-title">Miniprep (GeneJET)</div>
      <div class="proto-home-sub">Plasmid DNA purification from 5 mL overnight culture.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('molbio', 'proto-nucleospin')" aria-label="Open NucleoSpin Cleanup">
      <div class="proto-home-title">NucleoSpin Cleanup</div>
      <div class="proto-home-sub">PCR / gel-extraction cleanup (Macherey-Nagel).</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="molbio-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find (added in Task 3):
```js
function _lmRenderAllToolGrids() {
}
```

Replace with:
```js
function _lmRenderAllToolGrids() {
  renderToolGrid('molbio-home', TOOLS_molbio, { tileColorClass: 'tile-molbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Fix the 5 generic "← Protocols" back buttons to say "← Mol Biology"**

There are 5 occurrences of this exact line within the Mol Biology section (verified at lines ~2234, 2384, 2500, 2536, 2565):
```html
    <button class="proto-back-btn" onclick="showProtoHome('molbio')">← Protocols</button>
```

Replace ALL 5 with:
```html
    <button class="proto-back-btn" onclick="showProtoHome('molbio')">← Mol Biology</button>
```

Use a scoped replace so you don't touch other sections' identical-looking `('molbio')`-free lines:
```bash
python3 -c "
import re
path = '/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html'
with open(path) as f: html = f.read()
old = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'molbio'"'"')\">← Protocols</button>'''
new = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'molbio'"'"')\">← Mol Biology</button>'''
count = html.count(old)
html = html.replace(old, new)
with open(path, 'w') as f: f.write(html)
print('replaced', count, 'occurrences')
"
```

Expected output: `replaced 5 occurrences`.

- [ ] **Step 5: Add the slide-transition hook to `showProto()` and `showProtoHome()`**

Find (around line 5634):
```js
function showProto(sec, pid) {
  var secEl = document.getElementById('sec-' + sec);
  if (!secEl) return;
  var home = document.getElementById(sec + '-home');
  if (home) home.style.display = 'none';
  // hide all gated entries in this section
  secEl.querySelectorAll('.proto-entry.proto-gated').forEach(function(p) {
    p.style.display = 'none';
    p.classList.remove('open');
  });
  // show the requested entry, opened
  var entry = document.getElementById(pid);
  if (entry) {
    entry.style.display = 'block';
    entry.classList.add('open');
    setTimeout(initCollapsibleCalcs, 50);
  }
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Replace with:
```js
function showProto(sec, pid) {
  var secEl = document.getElementById('sec-' + sec);
  if (!secEl) return;
  var home = document.getElementById(sec + '-home');
  if (home) home.style.display = 'none';
  // hide all gated entries in this section
  secEl.querySelectorAll('.proto-entry.proto-gated').forEach(function(p) {
    p.style.display = 'none';
    p.classList.remove('open');
  });
  // show the requested entry, opened
  var entry = document.getElementById(pid);
  if (entry) {
    entry.style.display = 'block';
    entry.classList.add('open');
    entry.classList.add('lm-detail-page');
    if (_lmIsMobile()) {
      entry.style.animation = 'none';
      requestAnimationFrame(function(){ entry.style.animation = 'lmDetailIn .28s ease'; });
    }
    setTimeout(initCollapsibleCalcs, 50);
  }
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Find (around line 5698):
```js
function showProtoHome(sec) {
  if (sec === 'assays') { showAssayHome(); return; }
  var secEl = document.getElementById('sec-' + sec);
  if (!secEl) return;
  var home = document.getElementById(sec + '-home');
  if (home) {
    home.style.display = '';
    if (home.dataset.activeFilter) {
      delete home.dataset.activeFilter;
      Array.from(home.children).forEach(function(child) { child.style.display = ''; });
    }
  }
  secEl.querySelectorAll('.proto-entry.proto-gated').forEach(function(p) {
    p.style.display = 'none';
    p.classList.remove('open');
  });
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Replace with:
```js
function showProtoHome(sec) {
  if (sec === 'assays') { showAssayHome(); return; }
  var secEl = document.getElementById('sec-' + sec);
  if (!secEl) return;
  var home = document.getElementById(sec + '-home');
  if (home) {
    home.style.display = '';
    if (home.dataset.activeFilter) {
      delete home.dataset.activeFilter;
      Array.from(home.children).forEach(function(child) { child.style.display = ''; });
    }
  }
  secEl.querySelectorAll('.proto-entry.proto-gated').forEach(function(p) {
    p.style.display = 'none';
    p.classList.remove('open');
  });
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

(`showProtoHome` needed no functional change — it already just hides entries and shows home; the slide effect only needs to trigger on *opening* a detail view, which `showProto` now handles. This step is here so the next 5 sections' tasks don't need to touch `showProtoHome` again.)

- [ ] **Step 6: Verify live — grid renders, tap opens detail with slide, back works, back-button text correct, no console errors**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Mol Biology' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#molbio-home .lm-tile').count();
  await page.locator('#molbio-home .lm-tile', { hasText: 'Gibson Assembly' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#proto-gibson .proto-back-btn').textContent();
  const detailVisible = await page.evaluate(() => getComputedStyle(document.getElementById('proto-gibson')).display !== 'none');
  await page.locator('#proto-gibson .proto-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#molbio-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, detailVisible, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 5`, `backText: "← Mol Biology"`, `detailVisible: true`, `backToGrid: 5`, `errors: []`.

- [ ] **Step 7: Desktop regression check — Mol Biology card grid still looks like before**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Mol Biology' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#molbio-home .proto-home-card').count();
  await page.screenshot({ path: '/tmp/lm_molbio_desktop.png' });
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 5`. Read `/tmp/lm_molbio_desktop.png` and visually confirm it looks like the original icon+title+description card grid (no banners now — that's the intended, already-agreed change).

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Mol Biology to shared tile grid, add slide-transition hook to showProto/showProtoHome"
```

---

### Task 5: Migrate CRISPR

**Files:**
- Modify: `Labmate/labmate.html`

**Why lighter than Task 4:** `showProto`/`showProtoHome` already got the slide-transition hook in Task 4 — CRISPR reuses it. Its back buttons already correctly say "← CRISPR" (verified via grep), so no text fix is needed here.

- [ ] **Step 1: Add the `TOOLS_crispr` registry**

Find:
```js
var TOOLS_molbio = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_crispr = [
  { title: 'gRNA & Donor Design', badge: 'gRNA', desc: 'Guide shortlisting, PAM silencing, HA design, ssODN rules.', open: function(){ showProto('crispr', 'proto-grna'); } },
  { title: 'Knock-out (PX458)', badge: 'KO', desc: 'Gene disruption via NHEJ indels — BbsI cloning + GFP selection.', open: function(){ showProto('crispr', 'proto-px458ko'); } },
  { title: 'Knock-in (PX458)', badge: 'KI-P', desc: 'HDR with plasmid donor — BbsI cloning, HiFi assembly, GFP sort.', open: function(){ showProto('crispr', 'proto-ki-px458'); } },
  { title: 'Knock-in (RNP + ssODN)', badge: 'KI-R', desc: 'HDR with ssODN — electroporation, no plasmid cloning needed.', open: function(){ showProto('crispr', 'proto-ki-rnp'); } },
  { title: 'Single-Cell Sorting', badge: 'SCS', desc: 'FACS deposition, clone expansion, genotyping workflow.', open: function(){ showProto('crispr', 'proto-scs'); } }
];

```

- [ ] **Step 2: Replace the hardcoded CRISPR grid HTML**

Find this exact block (around line 2603):
```html
  <div class="proto-home" id="crispr-home">
    <div class="proto-banner proto-banner-reference" id="bn-crispr-reference">
      <span class="proto-banner-label">Reference</span>
      <span class="proto-banner-sub">Guide design · Off-target scoring · Donor strategy</span>
    </div>
    <button class="proto-home-card" onclick="showProto('crispr','proto-grna')" aria-label="gRNA Design">
      <div class="proto-home-title">gRNA &amp; Donor Design</div>
      <div class="proto-home-sub">Guide shortlisting, PAM silencing, HA design, ssODN rules.</div>
    </button>
    <div class="proto-banner proto-banner-protocol" id="bn-crispr-protocol">
      <span class="proto-banner-label">Protocol</span>
      <span class="proto-banner-sub">Editing · Delivery · Cell enrichment</span>
    </div>
    <button class="proto-home-card" onclick="showProto('crispr','proto-px458ko')" aria-label="Knock-out">
      <div class="proto-home-title">Knock-out (PX458)</div>
      <div class="proto-home-sub">Gene disruption via NHEJ indels — BbsI cloning + GFP selection.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('crispr','proto-ki-px458')" aria-label="Knock-in PX458">
      <div class="proto-home-title">Knock-in (PX458)</div>
      <div class="proto-home-sub">HDR with plasmid donor — BbsI cloning, HiFi assembly, GFP sort.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('crispr','proto-ki-rnp')" aria-label="Knock-in RNP">
      <div class="proto-home-title">Knock-in (RNP + ssODN)</div>
      <div class="proto-home-sub">HDR with ssODN — electroporation, no plasmid cloning needed.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('crispr','proto-scs')" aria-label="Single-Cell Sorting">
      <div class="proto-home-title">Single-Cell Sorting</div>
      <div class="proto-home-sub">FACS deposition, clone expansion, genotyping workflow.</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="crispr-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
function _lmRenderAllToolGrids() {
  renderToolGrid('molbio-home', TOOLS_molbio, { tileColorClass: 'tile-molbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
function _lmRenderAllToolGrids() {
  renderToolGrid('molbio-home', TOOLS_molbio, { tileColorClass: 'tile-molbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('crispr-home', TOOLS_crispr, { tileColorClass: 'tile-crispr', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Verify live (mobile) — same pattern as Task 4 Step 6, adjusted for CRISPR**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'CRISPR' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#crispr-home .lm-tile').count();
  await page.locator('#crispr-home .lm-tile', { hasText: 'gRNA & Donor Design' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#proto-grna .proto-back-btn').textContent();
  await page.locator('#proto-grna .proto-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#crispr-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 5`, `backText: "← CRISPR"` (unchanged, already correct), `backToGrid: 5`, `errors: []`.

- [ ] **Step 5: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'CRISPR' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#crispr-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 5`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate CRISPR to shared tile grid"
```

---

### Task 6: Migrate Cell Biology (includes 10 embedded Cell Lines cross-link cards)

**Files:**
- Modify: `Labmate/labmate.html`

**Important — read before starting:** Cell Biology's home grid is bigger than it first looks. Besides its 8 own protocol/assay tools, it also embeds 10 cards that jump to a *different* section's reference entries (`onclick="_openCellLine('a549')"` etc., under a "Cell Lines" banner). These must be preserved as tiles too, just with a different `open` callback (`_openCellLine(id)` instead of `showProto('cellbio', id)`). This is exactly why `renderToolGrid()` takes a per-entry `open` function rather than one shared callback for the whole array — this section is the reason that design choice was made.

Also: 7 of Cell Biology's 8 back buttons say generic "← Protocols"; the 8th (CellTiter-Glo® 2.0) is already correct ("← Cell Biology") — confirmed via grep. Fix only the 7 wrong ones.

- [ ] **Step 1: Add the `TOOLS_cellbio` registry (18 entries: 8 tools + 10 cell-line links)**

Find:
```js
var TOOLS_crispr = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_cellbio = [
  { title: 'BCA & Sample Prep', badge: 'BCA', desc: 'Protein quantification + SDS-PAGE sample prep.', open: function(){ showProto('cellbio', 'proto-bca'); } },
  { title: 'Western Blot', badge: 'WB', desc: 'SDS-PAGE · transfer · antibody · ECL detection.', open: function(){ showProto('cellbio', 'proto-wb'); } },
  { title: 'Immunoprecipitation', badge: 'IP', desc: 'Antibody + bead pulldown for binding partners.', open: function(){ showProto('cellbio', 'proto-ip'); } },
  { title: 'HiBiT Blotting', badge: 'HiBiT', desc: 'HiBiT-tagged protein detection — Nano-Glo blotting.', open: function(){ showProto('cellbio', 'proto-hibit'); } },
  { title: 'Retro/Lentiviral', badge: 'LENT', desc: 'Virus production + transduction for stable lines.', open: function(){ showProto('cellbio', 'proto-lenti'); } },
  { title: 'Transfection', badge: 'TFX', desc: 'FUGENE HD · Lipofectamine 2000/3000 · PEI — per-well amounts + steps.', open: function(){ showProto('cellbio', 'proto-transfection'); } },
  { title: 'HiBiT Lytic Assay', badge: 'LYT', desc: 'Degradation readout — luminescence in lysed cells.', open: function(){ showProto('cellbio', 'proto-hibit-lytic'); } },
  { title: 'CellTiter-Glo® 2.0', badge: 'CTG', desc: 'ATP-based viability assay + D<sub>max</sub> curves.', open: function(){ showProto('cellbio', 'proto-ctg2'); } },
  { title: '22Rv1', badge: '22Rv1', desc: 'Prostate carcinoma · ATCC CRL-2505', open: function(){ _openCellLine('22rv1'); } },
  { title: 'A549', badge: 'A549', desc: 'Lung carcinoma · ATCC CCL-185', open: function(){ _openCellLine('a549'); } },
  { title: 'HCT116', badge: 'HCT', desc: 'Colorectal carcinoma · ATCC CCL-247', open: function(){ _openCellLine('hct116'); } },
  { title: 'HEK293', badge: '293', desc: 'Embryonic kidney · ATCC CRL-1573', open: function(){ _openCellLine('hek293'); } },
  { title: 'HAP-1', badge: 'HAP1', desc: 'Near-haploid · Horizon C631', open: function(){ _openCellLine('hap1'); } },
  { title: 'LNCaP', badge: 'LNCaP', desc: 'Prostate carcinoma · ATCC CRL-1740', open: function(){ _openCellLine('lncap'); } },
  { title: 'MCF7', badge: 'MCF7', desc: 'Breast adenocarcinoma · ATCC HTB-22', open: function(){ _openCellLine('mcf7'); } },
  { title: 'MIA PaCa-2', badge: 'MIA', desc: 'Pancreatic carcinoma · ATCC CRL-1420', open: function(){ _openCellLine('miapaca2'); } },
  { title: 'VCaP', badge: 'VCaP', desc: 'Prostate carcinoma · ATCC CRL-2876', open: function(){ _openCellLine('vcap'); } },
  { title: 'SU-DHL-5', badge: 'SDHL5', desc: 'DLBCL · CRL-2958', open: function(){ _openCellLine('sudhl5'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Cell Biology grid HTML**

Find this exact block (around line 3206 — it's long, copy carefully from `<div class="proto-home" id="cellbio-home">` through its matching closing `</div>` right before the `<!-- BCA & Sample Prep -->` comment):
```html
  <div class="proto-home" id="cellbio-home">

    <div class="proto-banner proto-banner-prep" id="bn-cellbio-prep">
      <span class="proto-banner-label">Prep</span>
      <span class="proto-banner-sub">Protein quantification · Lysis</span>
    </div>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-bca')" aria-label="Open BCA & Sample Prep">
      <div class="proto-home-title">BCA & Sample Prep</div>
      <div class="proto-home-sub">Protein quantification + SDS-PAGE sample prep.</div>
    </button>

    <div class="proto-banner proto-banner-protocol" id="bn-cellbio-protocol">
      <span class="proto-banner-label">Protocol</span>
      <span class="proto-banner-sub">Detection · Pulldown · Gene delivery</span>
    </div>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-wb')" aria-label="Open Western Blot">
      <div class="proto-home-title">Western Blot</div>
      <div class="proto-home-sub">SDS-PAGE · transfer · antibody · ECL detection.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-ip')" aria-label="Open Immunoprecipitation">
      <div class="proto-home-title">Immunoprecipitation</div>
      <div class="proto-home-sub">Antibody + bead pulldown for binding partners.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-hibit')" aria-label="Open HiBiT Blotting">
      <div class="proto-home-title">HiBiT Blotting</div>
      <div class="proto-home-sub">HiBiT-tagged protein detection — Nano-Glo blotting.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-lenti')" aria-label="Open Retro/Lentiviral">
      <div class="proto-home-title">Retro/Lentiviral</div>
      <div class="proto-home-sub">Virus production + transduction for stable lines.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-transfection')" aria-label="Open Transfection Calculator">
      <div class="proto-home-title">Transfection</div>
      <div class="proto-home-sub">FUGENE HD · Lipofectamine 2000/3000 · PEI — per-well amounts + steps.</div>
    </button>

    <div class="proto-banner proto-banner-assay" id="bn-cellbio-assay">
      <span class="proto-banner-label">Assay</span>
      <span class="proto-banner-sub">Degradation · Viability readouts</span>
    </div>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-hibit-lytic')" aria-label="Open HiBiT Lytic Assay">
      <div class="proto-home-title">HiBiT Lytic Assay</div>
      <div class="proto-home-sub">Degradation readout — luminescence in lysed cells.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('cellbio', 'proto-ctg2')" aria-label="Open CellTiter-Glo® 2.0">
      <div class="proto-home-title">CellTiter-Glo® 2.0</div>
      <div class="proto-home-sub">ATP-based viability assay + D<sub>max</sub> curves.</div>
    </button>

    <div class="proto-banner proto-banner-tools" id="bn-cellbio-tools">
      <span class="proto-banner-label">Tools</span>
      <span class="proto-banner-sub">Visualisation aids</span>
    </div>
    <div class="proto-banner proto-banner-reference" id="bn-cellbio-celllines">
      <span class="proto-banner-label">Cell Lines</span>
      <span class="proto-banner-sub">Culture conditions · Handling notes</span>
    </div>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('22rv1')" aria-label="Open 22Rv1">
      <div class="proto-home-title">22Rv1</div>
      <div class="proto-home-sub">Prostate carcinoma · ATCC CRL-2505</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('a549')" aria-label="Open A549">
      <div class="proto-home-title">A549</div>
      <div class="proto-home-sub">Lung carcinoma · ATCC CCL-185</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('hct116')" aria-label="Open HCT116">
      <div class="proto-home-title">HCT116</div>
      <div class="proto-home-sub">Colorectal carcinoma · ATCC CCL-247</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('hek293')" aria-label="Open HEK293">
      <div class="proto-home-title">HEK293</div>
      <div class="proto-home-sub">Embryonic kidney · ATCC CRL-1573</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('hap1')" aria-label="Open HAP-1">
      <div class="proto-home-title">HAP-1</div>
      <div class="proto-home-sub">Near-haploid · Horizon C631</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('lncap')" aria-label="Open LNCaP">
      <div class="proto-home-title">LNCaP</div>
      <div class="proto-home-sub">Prostate carcinoma · ATCC CRL-1740</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('mcf7')" aria-label="Open MCF7">
      <div class="proto-home-title">MCF7</div>
      <div class="proto-home-sub">Breast adenocarcinoma · ATCC HTB-22</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('miapaca2')" aria-label="Open MIA PaCa-2">
      <div class="proto-home-title">MIA PaCa-2</div>
      <div class="proto-home-sub">Pancreatic carcinoma · ATCC CRL-1420</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('vcap')" aria-label="Open VCaP">
      <div class="proto-home-title">VCaP</div>
      <div class="proto-home-sub">Prostate carcinoma · ATCC CRL-2876</div>
    </button>
    <button class="proto-home-card" data-section-nav="celllines" onclick="_openCellLine('sudhl5')" aria-label="Open SU-DHL-5">
      <div class="proto-home-title">SU-DHL-5</div>
      <div class="proto-home-sub">DLBCL · CRL-2958</div>
    </button>

  </div>
```

Replace with:
```html
  <div class="proto-home" id="cellbio-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('crispr-home', TOOLS_crispr, { tileColorClass: 'tile-crispr', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
  renderToolGrid('crispr-home', TOOLS_crispr, { tileColorClass: 'tile-crispr', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Fix the 7 generic "← Protocols" back buttons to say "← Cell Biology" (leave the 8th, already-correct one alone)**

Run this Python script — it targets only `showProtoHome('cellbio')` lines that still say "← Protocols", so it can't touch the already-correct CellTiter-Glo line:

```bash
python3 -c "
path = '/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html'
with open(path) as f: html = f.read()
old = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'cellbio'"'"')\">← Protocols</button>'''
new = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'cellbio'"'"')\">← Cell Biology</button>'''
count = html.count(old)
html = html.replace(old, new)
with open(path, 'w') as f: f.write(html)
print('replaced', count, 'occurrences')
"
```

Expected output: `replaced 7 occurrences`.

- [ ] **Step 5: Verify all 8 Cell Biology back buttons now say the same thing**

```bash
grep -n "showProtoHome('cellbio')" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"
```

Expected: 8 lines, every single one ending in `← Cell Biology</button>` (none should still say `← Protocols`).

- [ ] **Step 6: Verify live (mobile) — grid has 18 tiles, a protocol tile and a cell-line tile both work correctly**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Cell Biology' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#cellbio-home .lm-tile').count();
  // Click a normal protocol tile
  await page.locator('#cellbio-home .lm-tile', { hasText: 'Western Blot' }).click();
  await page.waitForTimeout(400);
  const protoBackText = await page.locator('#proto-wb .proto-back-btn').textContent();
  await page.locator('#proto-wb .proto-back-btn').click();
  await page.waitForTimeout(300);
  // Click a cell-line cross-link tile
  await page.locator('#cellbio-home .lm-tile', { hasText: 'A549' }).click();
  await page.waitForTimeout(400);
  const onCellLinesSection = await page.evaluate(() => getComputedStyle(document.getElementById('sec-celllines')).display !== 'none');
  console.log(JSON.stringify({ tileCount, protoBackText, onCellLinesSection, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 18`, `protoBackText: "← Cell Biology"`, `onCellLinesSection: true`, `errors: []`.

- [ ] **Step 7: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Cell Biology' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#cellbio-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 18`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Cell Biology to shared tile grid (18 entries incl. cell-line cross-links), fix back-button text"
```

---

### Task 7: Migrate Proteomics

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** Same pattern as Task 5 (CRISPR) — reuses the already-hooked `showProto`/`showProtoHome`. All 3 back buttons currently say generic "← Protocols" (verified via grep) and need fixing.

- [ ] **Step 1: Add the `TOOLS_proteomics` registry**

Find:
```js
var TOOLS_cellbio = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_proteomics = [
  { title: 'S-Trap Prep', badge: 'STRAP', desc: 'S-Trap sample preparation for MS proteomics.', open: function(){ showProto('proteomics', 'proto-strap'); } },
  { title: 'DIA-NN', badge: 'DIA', desc: 'Data-independent acquisition MS analysis.', open: function(){ showProto('proteomics', 'proto-diann'); } },
  { title: 'Perseus Analysis', badge: 'PER', desc: 'Statistical analysis of MaxQuant / DIA-NN output.', open: function(){ showProto('proteomics', 'proto-perseus'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Proteomics grid HTML**

Find this exact block (around line 3762):
```html
  <div class="proto-home" id="proteomics-home">
    <div class="proto-banner proto-banner-prep" id="bn-proteomics-prep">
      <span class="proto-banner-label">Prep</span>
      <span class="proto-banner-sub">MS-grade sample preparation</span>
    </div>
    <button class="proto-home-card" onclick="showProto('proteomics', 'proto-strap')" aria-label="Open S-Trap Prep">
      <div class="proto-home-title">S-Trap Prep</div>
      <div class="proto-home-sub">S-Trap sample preparation for MS proteomics.</div>
    </button>
    <div class="proto-banner proto-banner-analysis" id="bn-proteomics-analysis">
      <span class="proto-banner-label">Analysis</span>
      <span class="proto-banner-sub">Data processing · Statistical analysis</span>
    </div>
    <button class="proto-home-card" onclick="showProto('proteomics', 'proto-diann')" aria-label="Open DIA-NN">
      <div class="proto-home-title">DIA-NN</div>
      <div class="proto-home-sub">Data-independent acquisition MS analysis.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('proteomics', 'proto-perseus')" aria-label="Open Perseus Analysis">
      <div class="proto-home-title">Perseus Analysis</div>
      <div class="proto-home-sub">Statistical analysis of MaxQuant / DIA-NN output.</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="proteomics-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('proteomics-home', TOOLS_proteomics, { tileColorClass: 'tile-proteomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Fix the 3 generic "← Protocols" back buttons to say "← Proteomics"**

```bash
python3 -c "
path = '/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html'
with open(path) as f: html = f.read()
old = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'proteomics'"'"')\">← Protocols</button>'''
new = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'proteomics'"'"')\">← Proteomics</button>'''
count = html.count(old)
html = html.replace(old, new)
with open(path, 'w') as f: f.write(html)
print('replaced', count, 'occurrences')
"
```

Expected output: `replaced 3 occurrences`.

- [ ] **Step 5: Verify live (mobile)**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Proteomics' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#proteomics-home .lm-tile').count();
  await page.locator('#proteomics-home .lm-tile', { hasText: 'S-Trap Prep' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#proto-strap .proto-back-btn').textContent();
  await page.locator('#proto-strap .proto-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#proteomics-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 3`, `backText: "← Proteomics"`, `backToGrid: 3`, `errors: []`.

- [ ] **Step 6: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Proteomics' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#proteomics-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 3`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Proteomics to shared tile grid, fix back-button text"
```

---

### Task 8: Migrate Genomics

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** Same pattern again. Both back buttons currently say generic "← Protocols" and need fixing to "← Genomics".

- [ ] **Step 1: Add the `TOOLS_genomics` registry**

Find:
```js
var TOOLS_proteomics = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_genomics = [
  { title: 'MiSeq Amplicon', badge: 'SEQ', desc: 'Amplicon sequencing on Illumina MiSeq.', open: function(){ showProto('genomics', 'proto-miseq'); } },
  { title: 'Retrieve & Annotate Genes', badge: 'GENE', desc: 'Ensembl / NCBI gene sequence retrieval.', open: function(){ showProto('genomics', 'proto-geneseq'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Genomics grid HTML**

Find this exact block (around line 4004):
```html
  <div class="proto-home" id="genomics-home">
    <div class="proto-banner proto-banner-protocol" id="bn-genomics-protocol">
      <span class="proto-banner-label">Protocol</span>
      <span class="proto-banner-sub">NGS · Sequencing</span>
    </div>
    <button class="proto-home-card" onclick="showProto('genomics', 'proto-miseq')" aria-label="Open MiSeq Amplicon">
      <div class="proto-home-title">MiSeq Amplicon</div>
      <div class="proto-home-sub">Amplicon sequencing on Illumina MiSeq.</div>
    </button>
    <div class="proto-banner proto-banner-analysis" id="bn-genomics-analysis">
      <span class="proto-banner-label">Analysis</span>
      <span class="proto-banner-sub">Sequence retrieval · Annotation</span>
    </div>
    <button class="proto-home-card" onclick="showProto('genomics', 'proto-geneseq')" aria-label="Open Retrieve & Annotate Genes">
      <div class="proto-home-title">Retrieve &amp; Annotate Genes</div>
      <div class="proto-home-sub">Ensembl / NCBI gene sequence retrieval.</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="genomics-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('proteomics-home', TOOLS_proteomics, { tileColorClass: 'tile-proteomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
  renderToolGrid('proteomics-home', TOOLS_proteomics, { tileColorClass: 'tile-proteomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('genomics-home', TOOLS_genomics, { tileColorClass: 'tile-genomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Fix the 2 generic "← Protocols" back buttons to say "← Genomics"**

```bash
python3 -c "
path = '/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html'
with open(path) as f: html = f.read()
old = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'genomics'"'"')\">← Protocols</button>'''
new = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'genomics'"'"')\">← Genomics</button>'''
count = html.count(old)
html = html.replace(old, new)
with open(path, 'w') as f: f.write(html)
print('replaced', count, 'occurrences')
"
```

Expected output: `replaced 2 occurrences`.

- [ ] **Step 5: Verify live (mobile)**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Genomics' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#genomics-home .lm-tile').count();
  await page.locator('#genomics-home .lm-tile', { hasText: 'MiSeq Amplicon' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#proto-miseq .proto-back-btn').textContent();
  await page.locator('#proto-miseq .proto-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#genomics-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 2`, `backText: "← Genomics"`, `backToGrid: 2`, `errors: []`.

- [ ] **Step 6: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Genomics' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#genomics-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 2`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Genomics to shared tile grid, fix back-button text"
```

---

### Task 9: Migrate Struct Bio

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** Same pattern again. All 6 back buttons currently say generic "← Protocols" and need fixing to "← Struct Bio".

- [ ] **Step 1: Add the `TOOLS_structbio` registry**

Find:
```js
var TOOLS_genomics = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_structbio = [
  { title: 'Find PDB Structures', badge: 'PDB', desc: 'Search & download crystal / cryo-EM structures.', open: function(){ showProto('structbio', 'proto-pdb'); } },
  { title: 'AlphaFold Prediction', badge: 'AF', desc: 'AI structure prediction — AlphaFold 2 / 3.', open: function(){ showProto('structbio', 'proto-alphafold'); } },
  { title: 'PyMOL Basics', badge: 'PML', desc: 'Molecular visualisation — navigation + selections.', open: function(){ showProto('structbio', 'proto-pymol'); } },
  { title: 'PyMOL Publication Figures', badge: 'FIG', desc: 'Ray-tracing + high-res figure export.', open: function(){ showProto('structbio', 'proto-pymolfig'); } },
  { title: 'Binding Site Analysis', badge: 'POC', desc: 'fpocket cavity detection + druggability.', open: function(){ showProto('structbio', 'proto-pockets'); } },
  { title: 'Ternary Complex Modelling', badge: 'TERN', desc: 'PROTAC ternary docking — HADDOCK / PRosettaC.', open: function(){ showProto('structbio', 'proto-ternary'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Struct Bio grid HTML**

Find this exact block (around line 4136):
```html
  <div class="proto-home" id="structbio-home">
    <div class="proto-banner proto-banner-reference" id="bn-structbio-reference">
      <span class="proto-banner-label">Reference</span>
      <span class="proto-banner-sub">Structure databases · Prediction</span>
    </div>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-pdb')" aria-label="Open Find PDB Structures">
      <div class="proto-home-title">Find PDB Structures</div>
      <div class="proto-home-sub">Search & download crystal / cryo-EM structures.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-alphafold')" aria-label="Open AlphaFold Prediction">
      <div class="proto-home-title">AlphaFold Prediction</div>
      <div class="proto-home-sub">AI structure prediction — AlphaFold 2 / 3.</div>
    </button>
    <div class="proto-banner proto-banner-tools" id="bn-structbio-tools">
      <span class="proto-banner-label">Tools</span>
      <span class="proto-banner-sub">Visualisation · Publication figures</span>
    </div>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-pymol')" aria-label="Open PyMOL Basics">
      <div class="proto-home-title">PyMOL Basics</div>
      <div class="proto-home-sub">Molecular visualisation — navigation + selections.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-pymolfig')" aria-label="Open PyMOL Publication Figures">
      <div class="proto-home-title">PyMOL Publication Figures</div>
      <div class="proto-home-sub">Ray-tracing + high-res figure export.</div>
    </button>
    <div class="proto-banner proto-banner-analysis" id="bn-structbio-analysis">
      <span class="proto-banner-label">Analysis</span>
      <span class="proto-banner-sub">Binding sites · Ternary complexes</span>
    </div>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-pockets')" aria-label="Open Binding Site Analysis">
      <div class="proto-home-title">Binding Site Analysis</div>
      <div class="proto-home-sub">fpocket cavity detection + druggability.</div>
    </button>
    <button class="proto-home-card" onclick="showProto('structbio', 'proto-ternary')" aria-label="Open Ternary Complex Modelling">
      <div class="proto-home-title">Ternary Complex Modelling</div>
      <div class="proto-home-sub">PROTAC ternary docking — HADDOCK / PRosettaC.</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="structbio-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('genomics-home', TOOLS_genomics, { tileColorClass: 'tile-genomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
  renderToolGrid('genomics-home', TOOLS_genomics, { tileColorClass: 'tile-genomics', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('structbio-home', TOOLS_structbio, { tileColorClass: 'tile-structbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Fix the 6 generic "← Protocols" back buttons to say "← Struct Bio"**

```bash
python3 -c "
path = '/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html'
with open(path) as f: html = f.read()
old = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'structbio'"'"')\">← Protocols</button>'''
new = '''<button class=\"proto-back-btn\" onclick=\"showProtoHome('"'"'structbio'"'"')\">← Struct Bio</button>'''
count = html.count(old)
html = html.replace(old, new)
with open(path, 'w') as f: f.write(html)
print('replaced', count, 'occurrences')
"
```

Expected output: `replaced 6 occurrences`.

- [ ] **Step 5: Verify live (mobile)**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Struct Bio' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#structbio-home .lm-tile').count();
  await page.locator('#structbio-home .lm-tile', { hasText: 'Find PDB Structures' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#proto-pdb .proto-back-btn').textContent();
  await page.locator('#proto-pdb .proto-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#structbio-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 6`, `backText: "← Struct Bio"`, `backToGrid: 6`, `errors: []`.

- [ ] **Step 6: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Struct Bio' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#structbio-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 6`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Struct Bio to shared tile grid, fix back-button text"
```

---

### Task 10: Migrate Quick Calc (adds its own slide hook, fixes the `memRenderChips` bug)

**Files:**
- Modify: `Labmate/labmate.html`

**Why separate slide hook:** Quick Calc uses its own `showQcTool`/`showQcHome` pair (not the shared `showProto`), so it needs its own 2-line slide-transition addition, same idea as Task 4 did for `showProto`. Its back buttons already correctly say "← Calculators" (verified via grep) — no text fix needed. It also has formula text (`.qc-home-formula`) that the other sections don't, so its `desktopClasses` includes a `formulaClass` key.

**The bug fix:** `_memRenderQcChips()` calls `memRenderChips(...)`, a function that doesn't exist anywhere in the file (confirmed via grep — it's the only call site, and there's no definition under that name or any close variant). This throws on every single Quick Calc tool open. The recent-values "chips" feature was scaffolded (a `.mem-row` div gets injected) but never actually built. Fix: delete the dead call and the now-pointless injection, not invent the missing feature.

- [ ] **Step 1: Add the `TOOLS_quickcalc` registry**

Find:
```js
var TOOLS_structbio = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_quickcalc = [
  { title: 'Simple Dilution', badge: 'C1V1', desc: 'C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub> — stock → working concentration.', formula: 'V<sub>1</sub> = C<sub>2</sub>·V<sub>2</sub> / C<sub>1</sub>', open: function(){ showQcTool('dilution'); } },
  { title: 'Serial Dilution', badge: 'SER', desc: 'Fold-dilution series — dose-response compound plates.', formula: 'C<sub>n</sub> = C<sub>0</sub> / f<sup>n</sup>', open: function(){ showQcTool('serial'); } },
  { title: 'Moles / Mass', badge: 'MW', desc: 'Stock prep — mass needed for a target concentration.', formula: 'mass = MW · C · V', open: function(){ showQcTool('mw'); } },
  { title: 'PCR Master Mix', badge: 'PCR', desc: 'Scale master mix by reactions × volume × overage.', formula: 'V<sub>mix</sub> = n · V<sub>rxn</sub> · overage', open: function(){ showQcTool('pcr'); } },
  { title: 'PK Parameters', badge: 'PK', desc: 'Clearance, half-life, Vd, and bioavailability from IV/PO data.', formula: 't<sub>½</sub> = 0.693 / k<sub>el</sub>', open: function(){ showQcTool('pk'); } },
  { title: 'pH / Buffer', badge: 'pH', desc: 'Henderson-Hasselbalch. Common lab buffers with pKa presets.', formula: 'pH = pKa + log([A⁻]/[HA])', open: function(){ showQcTool('ph'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Quick Calc grid HTML**

Find this exact block (around line 1981):
```html
  <div class="qc-home" id="qc-home">
    <button class="qc-home-card" onclick="showQcTool('dilution')" aria-label="Open Simple Dilution">
      <div class="qc-home-title">Simple Dilution</div>
      <div class="qc-home-sub">C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub> — stock → working concentration.</div>
      <div class="qc-home-formula">V<sub>1</sub> = C<sub>2</sub>·V<sub>2</sub> / C<sub>1</sub></div>
    </button>
    <button class="qc-home-card" onclick="showQcTool('serial')" aria-label="Open Serial Dilution">
      <div class="qc-home-title">Serial Dilution</div>
      <div class="qc-home-sub">Fold-dilution series — dose-response compound plates.</div>
      <div class="qc-home-formula">C<sub>n</sub> = C<sub>0</sub> / f<sup>n</sup></div>
    </button>
    <button class="qc-home-card" onclick="showQcTool('mw')" aria-label="Open Moles calculator">
      <div class="qc-home-title"> Moles  Mass</div>
      <div class="qc-home-sub">Stock prep — mass needed for a target concentration.</div>
      <div class="qc-home-formula">mass = MW · C · V</div>
    </button>
    <button class="qc-home-card" onclick="showQcTool('pcr')" aria-label="Open PCR Master Mix">
      <div class="qc-home-title">PCR Master Mix</div>
      <div class="qc-home-sub">Scale master mix by reactions × volume × overage.</div>
      <div class="qc-home-formula">V<sub>mix</sub> = n · V<sub>rxn</sub> · overage</div>
    </button>
    <button class="qc-home-card" onclick="showQcTool('pk')" aria-label="Open PK Calculator">
      <div class="qc-home-title">PK Parameters</div>
      <div class="qc-home-sub">Clearance, half-life, Vd, and bioavailability from IV/PO data.</div>
      <div class="qc-home-formula">t<sub>½</sub> = 0.693 / k<sub>el</sub></div>
    </button>
    <button class="qc-home-card" onclick="showQcTool('ph')" aria-label="Open pH / Buffer Calculator">
      <div class="qc-home-title">pH / Buffer</div>
      <div class="qc-home-sub">Henderson-Hasselbalch. Common lab buffers with pKa presets.</div>
      <div class="qc-home-formula">pH = pKa + log([A⁻]/[HA])</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="qc-home" id="qc-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('structbio-home', TOOLS_structbio, { tileColorClass: 'tile-structbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

Replace with:
```js
  renderToolGrid('structbio-home', TOOLS_structbio, { tileColorClass: 'tile-structbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('qc-home', TOOLS_quickcalc, { tileColorClass: 'tile-quickcalc', gridClass: 'qc-home', cardClass: 'qc-home-card', titleClass: 'qc-home-title', subClass: 'qc-home-sub', formulaClass: 'qc-home-formula' });
}
```

- [ ] **Step 4: Add the slide hook to `showQcTool()` and fix the `memRenderChips` bug in the same edit**

Find (around line 5590, now shifted later by earlier insertions — match on text):
```js
function showQcTool(tool) {
  _qcTool = tool;
  var home = document.getElementById('qc-home');
  if (home) home.style.display = 'none';
  document.querySelectorAll('#sec-quickcalc .qc-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('qc-panel-' + tool);
  if (panel) panel.style.display = '';
  // Inject mem-row if not present, then render chips
  if (panel) {
    var card = panel.querySelector('.card');
    if (card && !document.getElementById('mem-qc-'+tool)) {
      var row = document.createElement('div');
      row.id = 'mem-qc-'+tool; row.className = 'mem-row'; row.style.display = 'none';
      card.insertBefore(row, card.firstChild);
    }
    _memRenderQcChips(tool);
  }
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Replace with:
```js
function showQcTool(tool) {
  _qcTool = tool;
  var home = document.getElementById('qc-home');
  if (home) home.style.display = 'none';
  document.querySelectorAll('#sec-quickcalc .qc-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('qc-panel-' + tool);
  if (panel) {
    panel.style.display = '';
    panel.classList.add('lm-detail-page');
    if (_lmIsMobile()) {
      panel.style.animation = 'none';
      requestAnimationFrame(function(){ panel.style.animation = 'lmDetailIn .28s ease'; });
    }
  }
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

(The `_memRenderQcChips(tool)` call and the `mem-row` injection block are removed entirely — they only ever existed to feed a function, `memRenderChips`, that was never written.)

- [ ] **Step 5: Remove the now-orphaned `_memRenderQcChips` function**

Find:
```js
function _memRenderQcChips(tool) {
  var fns = {
    dilution: function(inp) {
      document.getElementById('dil-c1').value=inp.c1||'';
      document.getElementById('dil-c1u').value=inp.c1u||'µM';
      document.getElementById('dil-c2').value=inp.c2||'';
      document.getElementById('dil-c2u').value=inp.c2u||'µM';
      document.getElementById('dil-v2').value=inp.v2||'';
      document.getElementById('dil-v2u').value=inp.v2u||'uL';
      calcDilution();
    },
    serial: function(inp) {
      document.getElementById('ser-start').value=inp.start||'';
      document.getElementById('ser-unit').value=inp.unit||'µM';
      document.getElementById('ser-factor').value=inp.factor||3;
      document.getElementById('ser-points').value=inp.pts||8;
      document.getElementById('ser-vol').value=inp.vol||200;
      calcSerial();
    },
    mw: function(inp) {
      document.getElementById('mw-mw').value=inp.mw||'';
      document.getElementById('mw-mass').value=inp.mass||'';
      document.getElementById('mw-massu').value=inp.massu||'mg';
      document.getElementById('mw-vol').value=inp.vol||'';
      document.getElementById('mw-volu').value=inp.volu||'mL';
    },
    pcr: function(inp) {
      document.getElementById('pcrq-rxns').value=inp.rxns||8;
      document.getElementById('pcrq-vol').value=inp.vol||25;
      document.getElementById('pcrq-ov').value=inp.ov||1.1;
      calcPCRquick();
    }
  };
  if (fns[tool]) memRenderChips('qc-'+tool, 'mem-qc-'+tool, fns[tool]);
}
```

Replace with: *(nothing — delete the whole function. It has no other callers: confirm with the grep in Step 6 below before deleting.)*

- [ ] **Step 6: Confirm `_memRenderQcChips` and `memRenderChips` have no remaining references after deletion**

Run: `grep -n "memRenderChips" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: no output (zero matches) — both the dead call and its now-deleted definition are gone.

- [ ] **Step 7: Add the slide hook to `showQcHome()` is NOT needed**

`showQcHome()` only hides panels and shows the grid again — there's nothing to slide on the way *out*, only on the way *in* (handled in Step 4). No change needed here; this step exists only to record that the omission is intentional, not missed.

- [ ] **Step 8: Verify live (mobile) — grid renders, tool opens with no console errors (the original 3 errors must be gone), back works**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Calculators' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#qc-home .lm-tile').count();
  await page.locator('#qc-home .lm-tile', { hasText: 'Simple Dilution' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#qc-panel-dilution .qc-back-btn').textContent();
  await page.locator('#qc-panel-dilution .qc-back-btn').click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#qc-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 6`, `backText: "← Calculators"`, `backToGrid: 6`, `errors: []` (this is the critical check — previously this exact flow produced 3 `pageerror` entries).

- [ ] **Step 9: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Calculators' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#qc-home .qc-home-card').count();
  const hasFormula = await page.locator('#qc-home .qc-home-formula').count();
  console.log(JSON.stringify({ cardCount, hasFormula }));
  await browser.close();
})();
"
```

Expected: `{"cardCount":6,"hasFormula":6}` (formula line preserved on desktop).

- [ ] **Step 10: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Quick Calc to shared tile grid, fix memRenderChips dead-code bug"
```

---

### Task 11: Migrate Biophysics/Assays (adds its own slide hook)

**Files:**
- Modify: `Labmate/labmate.html`

**Why separate slide hook:** Assays uses its own `showAssayTab`/`showAssayHome` pair, not `showProto`. Its back buttons already correctly say "← Biophysics" (verified via grep) — no text fix needed.

- [ ] **Step 1: Add the `TOOLS_assays` registry**

Find:
```js
var TOOLS_quickcalc = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_assays = [
  { title: 'TR-FRET', badge: 'FRET', desc: 'Ternary complex formation — cooperativity (α), C<sub>max</sub>, hook effect in 384-well.', open: function(){ showAssayTab('trfret'); } },
  { title: 'FP', badge: 'FP', desc: 'Fluorescence Polarization — K<sub>D</sub> of VHL/CRBN warheads with FAM-HIF1α / thalidomide probes.', open: function(){ showAssayTab('fp'); } },
  { title: 'SPR', badge: 'SPR', desc: 'Surface Plasmon Resonance — k<sub>on</sub>/k<sub>off</sub> and ternary complex residence times.', open: function(){ showAssayTab('spr'); } }
];

```

- [ ] **Step 2: Replace the hardcoded Assays grid HTML**

Find this exact block (around line 4507):
```html
  <div class="proto-home" id="assays-home">

    <div class="proto-banner proto-banner-assay" id="bn-assays-assay">
      <span class="proto-banner-label">Assay</span>
      <span class="proto-banner-sub">Binding · Affinity · Kinetics</span>
    </div>
    <button class="proto-home-card" onclick="showAssayTab('trfret')" aria-label="Open TR-FRET assay">
      <div class="proto-home-title">TR-FRET</div>
      <div class="proto-home-sub">Ternary complex formation — cooperativity (α), C<sub>max</sub>, hook effect in 384-well.</div>
    </button>
    <button class="proto-home-card" onclick="showAssayTab('fp')" aria-label="Open Fluorescence Polarization assay">
      <div class="proto-home-title">FP</div>
      <div class="proto-home-sub">Fluorescence Polarization — K<sub>D</sub> of VHL/CRBN warheads with FAM-HIF1α / thalidomide probes.</div>
    </button>
    <button class="proto-home-card" onclick="showAssayTab('spr')" aria-label="Open SPR assay">
      <div class="proto-home-title">SPR</div>
      <div class="proto-home-sub">Surface Plasmon Resonance — k<sub>on</sub>/k<sub>off</sub> and ternary complex residence times.</div>
    </button>
  </div>
```

Replace with:
```html
  <div class="proto-home" id="assays-home"></div>
```

- [ ] **Step 3: Add this section's render call to the aggregator**

Find:
```js
  renderToolGrid('qc-home', TOOLS_quickcalc, { tileColorClass: 'tile-quickcalc', gridClass: 'qc-home', cardClass: 'qc-home-card', titleClass: 'qc-home-title', subClass: 'qc-home-sub', formulaClass: 'qc-home-formula' });
}
```

Replace with:
```js
  renderToolGrid('qc-home', TOOLS_quickcalc, { tileColorClass: 'tile-quickcalc', gridClass: 'qc-home', cardClass: 'qc-home-card', titleClass: 'qc-home-title', subClass: 'qc-home-sub', formulaClass: 'qc-home-formula' });
  renderToolGrid('assays-home', TOOLS_assays, { tileColorClass: 'tile-assays', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
}
```

- [ ] **Step 4: Add the slide hook to `showAssayTab()`**

Find:
```js
function showAssayTab(tab) {
  _assayTab = tab;
  var home = document.getElementById('assays-home');
  if (home) home.style.display = 'none';
  document.querySelectorAll('.assay-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('assay-panel-' + tab);
  if (panel) panel.style.display = '';
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Replace with:
```js
function showAssayTab(tab) {
  _assayTab = tab;
  var home = document.getElementById('assays-home');
  if (home) home.style.display = 'none';
  document.querySelectorAll('.assay-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('assay-panel-' + tab);
  if (panel) {
    panel.style.display = '';
    panel.classList.add('lm-detail-page');
    if (_lmIsMobile()) {
      panel.style.animation = 'none';
      requestAnimationFrame(function(){ panel.style.animation = 'lmDetailIn .28s ease'; });
    }
  }
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

- [ ] **Step 5: Verify live (mobile)**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Biophysics' }).click();
  await page.waitForTimeout(300);
  const tileCount = await page.locator('#assays-home .lm-tile').count();
  await page.locator('#assays-home .lm-tile', { hasText: 'TR-FRET' }).click();
  await page.waitForTimeout(400);
  const backText = await page.locator('#assay-panel-trfret .proto-back-btn').first().textContent();
  await page.locator('#assay-panel-trfret .proto-back-btn').first().click();
  await page.waitForTimeout(200);
  const backToGrid = await page.locator('#assays-home .lm-tile').count();
  console.log(JSON.stringify({ tileCount, backText, backToGrid, errors }));
  await browser.close();
})();
"
```

Expected: `tileCount: 3`, `backText: "← Biophysics"`, `backToGrid: 3`, `errors: []`.

- [ ] **Step 6: Desktop regression check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Biophysics' }).click();
  await page.waitForTimeout(300);
  const cardCount = await page.locator('#assays-home .proto-home-card').count();
  console.log('cardCount:', cardCount);
  await browser.close();
})();
"
```

Expected: `cardCount: 3`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: migrate Biophysics/Assays to shared tile grid"
```

---

### Task 12: Cell Lines — visual-only tile restyle (no interaction change)

**Files:**
- Modify: `Labmate/labmate.html`

**Why this section is different:** Investigation found `showCellLine()` doesn't hide the grid and navigate away — it reveals a detail panel *below* the still-visible grid, with no back button, so the user can keep comparing cell lines without round-tripping. That's a legitimate, different interaction for a 10-item reference grid, not a bug — forcing it into the same hide/show/back pattern as the other 8 sections would remove a real usability advantage. This task ONLY adds a small icon badge to each existing tile and adjusts sizing at ≤900px; `showCellLine()`/`hideCellLine()` are not touched.

- [ ] **Step 1: Add badge spans to the 10 cell-tile buttons**

There are 10 buttons matching this pattern (verified exact list via grep, lines ~4856–4905). For each one, insert a badge div as the FIRST child, right after the opening `<button ...>` tag, with a section-appropriate badge derived from the cell line name (already decided, no further judgment needed):

| `data-cell` | badge text |
|---|---|
| `22rv1` | `22Rv1` |
| `a549` | `A549` |
| `hct116` | `HCT` |
| `hek293` | `293` |
| `lncap` | `LNCaP` |
| `mcf7` | `MCF7` |
| `miapaca2` | `MIA` |
| `vcap` | `VCaP` |
| `hap1` | `HAP1` |
| `sudhl5` | `SDHL5` |

Find (around line 4856):
```html
    <button class="cell-tile" data-cell="22rv1" onclick="showCellLine('22rv1', this)">
      <div class="cell-tile-tissue">Prostate</div>
```

Replace with:
```html
    <button class="cell-tile" data-cell="22rv1" onclick="showCellLine('22rv1', this)">
      <div class="lm-tile-icon tile-celllines" style="margin-bottom:4px"><span class="lm-tile-badge">22Rv1</span></div>
      <div class="cell-tile-tissue">Prostate</div>
```

Repeat the identical pattern for the remaining 9 buttons — find each `<button class="cell-tile" data-cell="X" onclick="showCellLine('X', this)">` line followed by its `<div class="cell-tile-tissue">...` line, and insert the same `<div class="lm-tile-icon tile-celllines" style="margin-bottom:4px"><span class="lm-tile-badge">BADGE</span></div>` line between them, substituting that row's badge text from the table above. The 9 remaining `data-cell` values to find: `a549`, `hct116`, `hek293`, `lncap`, `mcf7`, `miapaca2`, `vcap`, `hap1`, `sudhl5`.

- [ ] **Step 2: Add sizing CSS so the badge fits the existing tile at ≤900px**

Find (around line 1594, inside the existing `.cell-grid` CSS block):
```css
    @media (max-width: 480px) {
      .cell-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .cell-tile-name { font-size: 15px; }
    }
```

Insert immediately AFTER that block:
```css
    @media (max-width: 900px) {
      .cell-tile { gap: 3px; padding: 12px 6px; }
      .cell-tile .lm-tile-icon { width: 28px; height: 28px; border-radius: 7px; }
      .cell-tile .lm-tile-badge { font-size: 8.5px; }
    }
```

- [ ] **Step 3: Verify all 10 badges were added and the page still loads clean**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item').filter({ hasText: /^$/ }).first(); // no-op, keep selector engine warm
  // Cell Lines is reached via Cell Biology's embedded cross-links, or directly if it has its own nav — try direct nav button first
  const hasDirectNav = await page.locator('.nav-btn', { hasText: 'Cell Lines' }).count();
  console.log('hasDirectNavButton:', hasDirectNav);
  await page.evaluate(() => { _doSwitchSection('celllines'); });
  await page.waitForTimeout(300);
  const badgeCount = await page.locator('#cell-grid .lm-tile-badge').count();
  await page.screenshot({ path: '/tmp/lm_celllines_mobile.png' });
  console.log(JSON.stringify({ badgeCount, errors }));
  await browser.close();
})();
"
```

Expected: `badgeCount: 10`, `errors: []`. Read `/tmp/lm_celllines_mobile.png` and confirm each tile shows a small dark badge above the tissue/name/ATCC text, without visually overflowing the tile.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: add icon badges to Cell Lines tiles for visual consistency (no interaction change)"
```

---

### Task 13: Remove the orphaned "Tools" section

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** `sec-tools` (cards linking to Timer and Planner) has no entry point anywhere in the desktop nav, mobile nav, or mobile home grid — confirmed via grep, it's unreachable in the live app today. Both Timer and Planner are already directly reachable from the main mobile home grid and desktop nav. Removing it is pure deletion, no replacement needed.

- [ ] **Step 1: Confirm it's truly unreachable before deleting (defensive check)**

Run: `grep -n "data-nav=\"tools\"\|mob-btn-tools\|mobGoTo('tools'" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: no output. If this returns any line, STOP — something does reference it and the section isn't actually orphaned; report back instead of deleting.

- [ ] **Step 2: Delete the `sec-tools` block**

Find this exact block:
```html
<div id="sec-tools" class="tab-section">
  <div class="sec-header">
    <div><div class="sec-title">Tools</div><div class="sec-sub">Lab timers · Experiment planner</div></div>
  </div>

  <div class="proto-home" id="tools-home">

    <div class="proto-banner proto-banner-tools" id="bn-tools-lab">
      <span class="proto-banner-label">Tools</span>
      <span class="proto-banner-sub">Timing · Planning</span>
    </div>
    <button class="proto-home-card" onclick="_navToSection('timer')" aria-label="Open Lab Timers">
      <div class="proto-home-title">Lab Timers</div>
      <div class="proto-home-sub">Multiple named countdown timers — run in parallel</div>
    </button>
    <button class="proto-home-card" onclick="_navToSection('planner')" aria-label="Open Experiment Planner">
      <div class="proto-home-title">Experiment Planner</div>
      <div class="proto-home-sub">Viability · Timeline · Plate map · Cell calculation</div>
    </button>


  </div>
</div>
```

Replace with: *(nothing — delete the entire block)*

- [ ] **Step 3: Remove `'tools'` from `_PROTO_SECS`**

Find:
```js
  var _PROTO_SECS = ['molbio','cellbio','crispr','proteomics','structbio','genomics','tools','assays'];
```

Replace with:
```js
  var _PROTO_SECS = ['molbio','cellbio','crispr','proteomics','structbio','genomics','assays'];
```

- [ ] **Step 4: Remove the `sidebarItems['tools']` line**

Find:
```js
sidebarItems['tools']        = [];
```

Replace with: *(nothing — delete the line)*

- [ ] **Step 5: Verify no dangling references**

Run: `grep -n "sec-tools\|'tools'" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: no output (zero matches). `_navToSection()` itself is untouched (it's a generic helper used by `renderSidebar()`'s regex-based card detection, not specific to Tools — leave it defined even though nothing currently calls it with `'timer'`/`'planner'` anymore).

- [ ] **Step 6: Verify live — app still loads with no console errors**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  // Click through every remaining nav button once, confirm no crash
  const navCount = await page.locator('.nav-btn').count();
  for (let i = 0; i < navCount; i++) {
    await page.locator('.nav-btn').nth(i).click();
    await page.waitForTimeout(150);
  }
  console.log(JSON.stringify({ navCount, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`. `navCount` should be one less than it was before this task (Tools was never in the nav, so this count is unaffected by this specific deletion — this check just confirms the remaining nav still works end-to-end after editing nearby code).

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: remove orphaned Tools section (unreachable from any nav)"
```

---

### Task 14: Remove the isolated dead mobile sub-nav scaffold

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** `_navGroups` is declared `{}` and never populated anywhere in the file — confirmed by grep showing only reads (`_navGroups[x]`), never an assignment of a real group object. Every code path that depends on a truthy `_navGroups[x]` lookup is therefore unreachable. This task removes the parts of that dead system that are cleanly isolated (the mobile sub-list UI it was built for). It does NOT touch `_navGroups`, `_sectionToGroup`, or `switchNavGroup()` themselves — those are also dead, but tracing every call site showed they're entangled inside `renderSidebar()` (large, central, used by every section), so removing them is deferred to a later code-optimization pass, not bundled here.

**Important — do not break Favourites' back button.** `.mob-subhome-back` and `.sec-mob-back` CSS classes are also used by Favourites' own "← Back" button (a *different* element, inside `sec-favourites`, unrelated to the dead `#mob-subhome` container). Keep those two CSS classes. Only remove the classes/elements that exclusively serve the dead sub-list (`#mob-subhome`'s own internal `.mob-subhome-title`, `.mob-sublist`, `.mob-sublist-item`, `.mob-sublist-label`, `.mob-sublist-sub`, and the `#mob-subhome` id rules).

- [ ] **Step 1: Delete the dead `#mob-subhome` HTML block**

Find this exact block (around line 1950):
```html
<div id="mob-subhome">
  <button class="mob-subhome-back" onclick="mobGoHome()">← LabMate</button>
  <div class="mob-subhome-title" id="mob-subhome-title"></div>
  <div class="mob-sublist" id="mob-sublist"></div>
</div>
```

Replace with: *(nothing — delete the entire block)*

- [ ] **Step 2: Delete the dead CSS rules**

Find this exact block:
```css
#mob-subhome { display: none; padding: 20px 16px 40px; }
#mob-subhome.mob-subhome-active { display: block; }
.mob-subhome-back {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface); border: 1.5px solid var(--border2);
  border-radius: 8px; padding: 0 16px;
  font-size: 13px; font-weight: 600; color: var(--text);
  cursor: pointer; font-family: var(--sans);
  margin-bottom: 20px; -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07); min-height: 40px;
}
.sec-mob-back { display: none; }
@media (max-width: 900px) { .sec-mob-back { display: inline-flex; } }
.mob-subhome-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
.mob-sublist { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.mob-sublist-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--surface); border-radius: 14px;
  padding: 14px 6px 12px; gap: 7px; border: none; width: 100%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 3px 10px rgba(0,0,0,0.07);
  cursor: pointer; text-align: center; font-family: var(--sans);
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); min-height: 80px;
  -webkit-tap-highlight-color: transparent;
}
.mob-sublist-item:active { transform: scale(0.92); }
.mob-sublist-label { font-size: 11px; font-weight: 500; color: var(--text2); line-height: 1.3; }
.mob-sublist-sub  { font-size: 11px; color: var(--text3); margin-top: 1px; }
```

Replace with:
```css
.mob-subhome-back {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface); border: 1.5px solid var(--border2);
  border-radius: 8px; padding: 0 16px;
  font-size: 13px; font-weight: 600; color: var(--text);
  cursor: pointer; font-family: var(--sans);
  margin-bottom: 20px; -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07); min-height: 40px;
}
.sec-mob-back { display: none; }
@media (max-width: 900px) { .sec-mob-back { display: inline-flex; } }
```

(This keeps `.mob-subhome-back`/`.sec-mob-back`, which Favourites still uses, and removes only the dead `#mob-subhome`/`.mob-sublist*`/`.mob-subhome-title` rules.)

- [ ] **Step 3: Delete the other dead-system reference to `#mob-subhome` inside the 900px mobile-home media query**

Find (inside the `@media (max-width: 900px)` block that was originally the 700px mobile-home block):
```css
@media (max-width: 900px) {
  body.mob-at-home #mob-subhome.mob-subhome-active { display: block; }
  footer { position: relative; z-index: 1; }
}
```

Replace with:
```css
@media (max-width: 900px) {
  footer { position: relative; z-index: 1; }
}
```

- [ ] **Step 4: Delete `mobShowSubGroup()`, `switchNavChild()`, and `_navGroupMeta`**

Find this exact block:
```js
// Sub-group icon map for the sub-list
var _navGroupMeta = {
  reference: { icon: '', title: 'Reference' },
};

function mobShowSubGroup(groupId) {
  var group = _navGroups[groupId];
  if (!group) { mobGoTo(groupId); return; }
  var meta = _navGroupMeta[groupId] || { icon: '', title: groupId };

  // Hide main grid, show sub-list (stay in mob-at-home state)
  document.getElementById('mob-home').classList.add('mob-home-hidden');
  document.getElementById('mob-subhome-title').textContent = meta.title;

  var list = document.getElementById('mob-sublist');
  list.innerHTML = group.children.map(function(c) {
    var iconHtml = c.iconClass ? '<div class="lm-icon ' + c.iconClass + '"></div>' : '';
    return '<button class="mob-sublist-item" onclick="mobGoTo(\'' + groupId + '\',\'' + c.id + '\')">'  +
           iconHtml +
           '<span class="mob-sublist-label">' + c.label + '</span>' +
           '</button>';
  }).join('');

  var subhome = document.getElementById('mob-subhome');
  subhome.dataset.currentGroup = groupId;
  subhome.classList.add('mob-subhome-active');
  var _ca=document.getElementById('content-area');if(_ca)_ca.scrollTop=0;
}
```

Replace with: *(nothing — delete the whole block; confirm with Step 7's grep that `switchNavChild` had no other callers before this step, since it lived just below this block and is deleted in the next find/replace)*

Then find:
```js
function switchNavChild(groupId, subId, btn) {
  var group = _navGroups[groupId];
```

Read a few lines past this to capture its complete body (it continues for several more lines — read the file at this point to get the exact closing brace, since it wasn't fully captured during investigation) and delete the entire function the same way as above.

- [ ] **Step 5: Simplify `mobGoTo()` — remove the dead `_navGroups` branch**

Find:
```js
  if (_navGroups[sectionId]) {
    var group = _navGroups[sectionId];
    var sub = subTabId || group.lastChild || group.defaultChild;
    group.lastChild = sub;
    switchNavGroup(sectionId, btn);
    if (group.type === 'panels' && typeof group.switchFn === 'function') {
      group.switchFn(sub);
    }
  } else {
    switchNav(sectionId, btn);
  }
```

Replace with:
```js
  switchNav(sectionId, btn);
```

- [ ] **Step 6: Simplify `mobBack()` — remove the dead `prevGroup` branch**

Find:
```js
function mobBack() {
  var subhome = document.getElementById('mob-subhome');
  var prevGroup = subhome && subhome.dataset.prevGroup;
  if (prevGroup) {
    delete subhome.dataset.prevGroup;
    mobShowSubGroup(prevGroup);
  } else {
    mobGoHome();
  }
}
```

Replace with:
```js
function mobBack() {
  mobGoHome();
}
```

- [ ] **Step 7: Remove the now-dead `fromGroup`/`prevGroup` bookkeeping inside `mobGoTo()`**

Find (the part of `mobGoTo` that tracks which group it came from, now meaningless since groups never exist):
```js
function mobGoTo(sectionId, subTabId) {
  // Track where we came from for mobBack()
  var subhome = document.getElementById('mob-subhome');
  var fromGroup = subhome && subhome.classList.contains('mob-subhome-active') ? (subhome.dataset.currentGroup || '') : '';
  if (fromGroup) {
    subhome.dataset.prevGroup = fromGroup;
  } else {
    if (subhome) delete subhome.dataset.prevGroup;
  }
  // Update back button label
  var backLabel = document.getElementById('mob-back-label');
  if (backLabel) {
    var groupMeta = fromGroup && _navGroupMeta[fromGroup];
    backLabel.textContent = groupMeta ? '← ' + groupMeta.title : '← LabMate';
  }
  // Hide both home screens
  document.getElementById('mob-home').classList.add('mob-home-hidden');
  if (subhome) subhome.classList.remove('mob-subhome-active');
  document.body.classList.remove('mob-at-home');
  _mobAtHome = false;
```

Replace with:
```js
function mobGoTo(sectionId, subTabId) {
  // Update back button label
  var backLabel = document.getElementById('mob-back-label');
  if (backLabel) backLabel.textContent = '← LabMate';
  // Hide home screen
  document.getElementById('mob-home').classList.add('mob-home-hidden');
  document.body.classList.remove('mob-at-home');
  _mobAtHome = false;
```

- [ ] **Step 8: Remove the leftover `subhome` reference inside `mobGoHome()`**

Find:
```js
function mobGoHome() {
  document.getElementById('mob-home').classList.remove('mob-home-hidden');
  var subhome = document.getElementById('mob-subhome');
  if (subhome) subhome.classList.remove('mob-subhome-active');
  document.body.classList.add('mob-at-home');
  _mobAtHome = true;
  var backLabel = document.getElementById('mob-back-label');
  if (backLabel) backLabel.textContent = '← LabMate';
```

Replace with:
```js
function mobGoHome() {
  document.getElementById('mob-home').classList.remove('mob-home-hidden');
  document.body.classList.add('mob-at-home');
  _mobAtHome = true;
  var backLabel = document.getElementById('mob-back-label');
  if (backLabel) backLabel.textContent = '← LabMate';
```

- [ ] **Step 9: Delete the two monkey-patch wrapper blocks for now-deleted functions**

Find:
```js
  if (typeof switchNavGroup === 'function') {
    var _origSwitchGroup = switchNavGroup;
    window.switchNavGroup = function(id, btn) {
      _lmNavStack = [];
      var r = _origSwitchGroup.apply(this, arguments);
      updateMobBreadcrumb();
      return r;
    };
  }
```

Replace with: *(nothing — delete this block. `switchNavGroup` itself still exists per the deferred-removal decision, but since it's never actually invoked at runtime — confirmed, its only callers were inside the dead branches just removed — wrapping it adds nothing.)*

Find:
```js
  // mobShowSubGroup: showing the mobile sub-list (e.g. tools → timer/planner)
  if (typeof mobShowSubGroup === 'function') {
    var _origSub = mobShowSubGroup;
    window.mobShowSubGroup = function(groupId) {
      var r = _origSub.apply(this, arguments);
      // Stack-aware so phone-back returns to mob-home
      if (_lmIsMobile()) {
        pushNavLevel(function(){
          if (typeof mobGoHome === 'function') mobGoHome();
        });
      }
      updateMobBreadcrumb();
      return r;
    };
  }
```

Replace with: *(nothing — delete this block, since `mobShowSubGroup` itself was deleted in Step 4.)*

- [ ] **Step 10: Verify cleanup is complete and consistent**

Run: `grep -n "mob-subhome\|mob-sublist\|mobShowSubGroup\|switchNavChild\|_navGroupMeta\|prevGroup\|fromGroup" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: no output (zero matches).

Run: `grep -n "_navGroups\|switchNavGroup\|_sectionToGroup" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"`

Expected: some output remains (these are the deferred items — `_navGroups = {}`, `_sectionToGroup`, `switchNavGroup()`'s own definition, and its uses inside `renderSidebar()`/`goToFav()`/`_switchSectionFromSidebar()`) — that's correct, not a bug, per the deferred-removal decision in the spec.

- [ ] **Step 11: Verify live — Favourites' back button still works (the one thing sharing CSS with the deleted scaffold), no console errors anywhere**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  // Go to favourites, click its back button, confirm it returns home
  await page.locator('.mob-grid-item', { hasText: 'Favourites' }).click();
  await page.waitForTimeout(300);
  const backBtnVisible = await page.locator('.sec-mob-back').first().isVisible();
  await page.locator('.sec-mob-back').first().click();
  await page.waitForTimeout(300);
  const atHome = await page.evaluate(() => document.body.classList.contains('mob-at-home'));
  // Click through all 9 home tiles, confirm no crash anywhere
  const tiles = await page.locator('.mob-grid-item').count();
  for (let i = 0; i < tiles; i++) {
    await page.locator('.mob-grid-item').nth(i).click();
    await page.waitForTimeout(150);
    await page.evaluate(() => { if (typeof mobGoHome === 'function') mobGoHome(); });
    await page.waitForTimeout(100);
  }
  console.log(JSON.stringify({ backBtnVisible, atHome, tiles, errors }));
  await browser.close();
})();
"
```

Expected: `backBtnVisible: true`, `atHome: true`, `tiles: 9`, `errors: []`.

- [ ] **Step 12: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: remove dead mobile sub-nav scaffold (#mob-subhome, mobShowSubGroup, switchNavChild)"
```

---

### Task 15: Favourites — verify, no change needed

**Files:**
- None modified. This task is a documented verification, not an edit.

**Why no change:** The spec originally assumed Favourites renders small summary cards like the other sections, needing the same tile restyle. Investigation in Task-writing found this is wrong: `renderFavourites()` / `_moveFavsInline()` physically moves each favourited item's *entire original content* (the full calculator form or full protocol entry, not a summary card) into `#fav-grid`. A 2-column icon-tile treatment doesn't apply to full-width forms — today's effective single-column stacked layout on narrow screens is correct for this content, not an instance of the "list bug" the other 8 sections had (where summary cards were being squeezed, not full forms). Changing it would be a change for its own sake, not a fix.

- [ ] **Step 1: Confirm this reasoning against the live app**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  // Favourites is the default-active section already
  const favGridHTML = await page.evaluate(() => {
    var el = document.getElementById('fav-grid');
    return el ? el.innerHTML.length : 0;
  });
  console.log('fav-grid content length:', favGridHTML);
  await browser.close();
})();
"
```

Expected: a length greater than 0 if any items are favourited in the default profile, or 0 (showing the empty state) if none are. Either way, no errors. If you see something unexpected here (e.g. summary cards, not full forms), stop and re-investigate before assuming this task is a no-op.

- [ ] **Step 2: No commit for this task** — nothing changed.

---

### Task 16: Final verification pass, version bump, changelog, session log

**Files:**
- Modify: `Labmate/labmate.html` (final check only, no further functional edits expected)
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check**

The same kind of stray-`</div>` bug that broke Labcyte Echo's Plots tab layout (an extra closing tag silently pops a later element out of its intended parent) is a realistic risk after this many edits to an 11k-line file. Run:

```bash
python3 -c "
import re
with open('/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html') as f:
    html = f.read()
opens = len(re.findall(r'<div\b', html))
closes = len(re.findall(r'</div>', html))
print('div opens:', opens, 'div closes:', closes, 'balanced:', opens == closes)
"
```

Expected: `balanced: True`. If unbalanced, use the same line-by-line depth-tracking approach used to find the Echo bug (track depth per line across the whole file, find where it goes negative or never returns to 0) before considering this task done.

- [ ] **Step 2: Full click-through regression test — all 8 migrated sections, mobile and desktop, zero console errors**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const sections = ['Calculators','Mol Biology','CRISPR','Cell Biology','Proteomics','Genomics','Struct Bio','Biophysics'];
  for (const width of [390, 800, 1200]) {
    const page = await browser.newPage({viewport:{width, height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(width + ': ' + e.message));
    await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
    await page.waitForTimeout(300);
    for (const name of sections) {
      const navSel = width <= 900 ? '.mob-grid-item' : '.nav-btn';
      const loc = page.locator(navSel, { hasText: name });
      if (await loc.count() === 0) continue;
      await loc.first().click();
      await page.waitForTimeout(200);
    }
    console.log(width + 'px errors:', JSON.stringify(errors));
    await page.close();
  }
  await browser.close();
})();
"
```

Expected: `errors: []` at all three widths.

- [ ] **Step 3: Dark theme spot-check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.getElementById('theme-toggle-chk').click(); });
  await page.waitForTimeout(200);
  await page.locator('.mob-grid-item', { hasText: 'Mol Biology' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/lm_molbio_dark.png' });
  await browser.close();
})();
"
```

Read `/tmp/lm_molbio_dark.png` and confirm tiles are legible (text contrast, icon badges still readable) in dark mode.

- [ ] **Step 4: Resize-across-boundary check**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1200, height:900}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.nav-btn', { hasText: 'Mol Biology' }).click();
  await page.waitForTimeout(300);
  const wideClass = await page.evaluate(() => document.getElementById('molbio-home').className);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(300);
  const narrowClass = await page.evaluate(() => document.getElementById('molbio-home').className);
  console.log(JSON.stringify({ wideClass, narrowClass }));
  await browser.close();
})();
"
```

Expected: `wideClass: \"proto-home\"`, `narrowClass: \"lm-tile-grid\"` — confirming the resize listener actually re-renders the grid live, without a page reload.

- [ ] **Step 5: Bump the Hub version and add a changelog entry**

Find in `hub-shell.html` (check the current version first — it may have moved past v1.1.3 if other work happened since; use whatever the current value is and bump the patch number by one):
```html
    <span class="opts-version">The Hub &middot; v1.1.3</span>
```

Replace with (adjust the version number to be one patch above whatever was actually found):
```html
    <span class="opts-version">The Hub &middot; v1.1.4</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.3 &mdash; 19 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.4 &mdash; 19 Jun 2026</strong><br>
    &#9679; <b>LabMate</b>: unified mobile/tablet navigation — every section now uses the same icon-tile grid instead of 8 different hand-built layouts; widened mobile breakpoint to 900px so tablets get it too; fixed inconsistent/wrong back-button labels; fixed a console error on every Quick Calc tool open; removed an unreachable "Tools" section and dead mobile-nav scaffolding<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.3 &mdash; 19 Jun 2026</strong><br>
```

- [ ] **Step 6: Rebuild `The Hub.html`**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && python3 embed.py
```

Expected: output lists all apps including `lm: 1 replacement(s)`, ending in `Output: /Users/jonmacicior/Desktop/The_Hub/The Hub.html (N chars)` with no errors.

- [ ] **Step 7: Add the CLAUDE.md session log entry**

Find the line:
```
<!-- LAST_SESSION_START -->
```

Insert immediately after it (pushing the previous "Last session" entry down to become a "Previous session" entry, matching the existing convention — read the surrounding ~10 lines first to copy the exact demotion pattern used by prior entries):

```
Last session: [TODAY'S DATE] (Round 85: LabMate mobile/tablet tile navigation unification; v1.1.4)
Hub apps: 11. Version v1.1.4.
Labmate/labmate.html changes (v1.1.4):
- Replaced 8 separately-implemented "grid of cards -> detail view" navigations (Calculators, Mol Biology, CRISPR, Cell Biology, Proteomics, Genomics, Struct Bio, Biophysics) with one shared, data-driven renderToolGrid() — icon-badge tiles (2 columns) at <=900px, unchanged icon+title+description cards at >900px desktop.
- Widened the mobile/tablet breakpoint from 700px to 900px throughout (8 media query blocks + _lmIsMobile()), so tablets get the new pattern, not just phones.
- Fixed a real, demonstrable instance of the "sections feel inconsistent" complaint: most detail-view back buttons said generic "<- Protocols" instead of their actual section name (Mol Biology, Cell Biology, Proteomics, Genomics, Struct Bio all affected; Cell Biology was even inconsistent with itself, 7 of 8 wrong).
- Fixed a live bug: opening any Quick Calc tool threw 3 console errors because _memRenderQcChips() called memRenderChips(), a function that was never actually written (recent-values "chips" feature was scaffolded but never finished) -- removed the dead call instead of building the unfinished feature speculatively.
- Cell Biology's migration preserved 10 embedded cross-link cards to Cell Lines reference entries (showProto cards and _openCellLine cards coexist in one data-driven grid).
- Cell Lines itself was NOT migrated to the hide-grid/navigate pattern -- investigation showed its tap-to-reveal-below-grid interaction (no back button, grid stays visible) is a legitimate, different, and arguably better UX for a 10-item reference/comparison grid; only got a visual-only icon-badge touch-up.
- Removed an orphaned "Tools" section (sec-tools) that had no entry point in any nav -- unreachable in the live app.
- Removed the dead mobile sub-navigation scaffold (#mob-subhome, mobShowSubGroup(), switchNavChild(), _navGroupMeta) -- a parallel mobile-grouping system that was scaffolded but never wired up (_navGroups stayed permanently empty). _navGroups/_sectionToGroup/switchNavGroup() themselves were left in place -- tracing every call site showed they're entangled inside renderSidebar(), too large/central to safely remove alongside this redesign; deferred to a later code-optimization pass.
hub-shell.html: version bump -> v1.1.4, changelog entry added.
```

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html hub-shell.html "The Hub.html" CLAUDE.md && git commit -m "LabMate: unify mobile/tablet section navigation into shared tile grid; bump Hub to v1.1.4"
```

(Note: `The Hub.html` may be gitignored, as it was for a previous session's similar rebuild — check with `git status --short "The Hub.html"` first; if it shows as ignored, drop it from the `git add` and commit the other 3 files only.)

- [ ] **Step 9: Report completion**

Summarize for the human: what changed, the verification results from Steps 1-4, and explicitly call out the one deferred item (the `_navGroups`/`renderSidebar()` cleanup) so it isn't forgotten when the later code-optimization pass is eventually planned. Do not push to GitHub without explicit confirmation — ask first, per this project's established convention.
