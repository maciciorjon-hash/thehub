# Phase C Tier 1: Desktop Density Quick Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix six desktop-width container/grid sizing issues across four files in "The Hub" project, per the approved design in `docs/superpowers/specs/2026-06-21-phase-c-tier1-density-design.md`.

**Architecture:** Pure CSS edits, no JS or markup restructuring (except one wrapper `style=` attribute change in LDI). Each fix uses whichever mechanism actually matches its root cause: adding a `max-width` cap to a container that has none, removing a CSS rule that's erroneously canceling an existing cap, or swapping `auto-fit` for `auto-fill` in a grid so a few items stop stretching to fill the row. None of these touch the existing mobile `@media` breakpoints from the earlier mobile-fixes round.

**Tech Stack:** Vanilla HTML/CSS/JS, single-file apps, no build step. Verification via Playwright (Node, headless Chromium), same pattern used throughout this project's prior rounds.

---

### Task 1: Hub home grid (`hub-shell.html`)

**Files:**
- Modify: `hub-shell.html`

- [ ] **Step 1: Cap and center the home grid wrapper**

Find:
```css
.home-wrap{padding:48px 56px;}
```

Replace with:
```css
.home-wrap{padding:48px 56px;max-width:1280px;margin:0 auto;}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:2560, height:1100}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/hub-shell.html');
  await page.evaluate(() => {
    localStorage.setItem('hub_unlocked', JSON.stringify(['echo','lm','deg','pd','dna','pt','spectra','ldi','cryo','cuppa','fabricata']));
  });
  await page.reload();
  await page.waitForTimeout(700);
  const wrap = await page.locator('.home-wrap').boundingBox();
  await page.screenshot({ path: '/tmp/hub-home-2560-fixed.png' });
  console.log(JSON.stringify({ wrapWidth: wrap ? wrap.width : null, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`, `wrapWidth` at or under 1280 (it will be exactly 1280 minus nothing, since `max-width` is the outer bound — `boundingBox().width` should read `1280`). Read the screenshot — confirm the card grid is now centered with reasonable column count (not spread across the full 2560px), no orphaned single-card row stretching edge-to-edge.

Note: `hub-shell.html` itself has empty/placeholder `APP_B64`/`APP_B64_NEW` strings for several apps (it's a lightweight template, never opened directly in production) — opening it directly for this screenshot is fine for checking the home grid's own layout, since that markup/CSS doesn't depend on app content being decoded.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html && git commit -m "Hub: cap and center home grid wrapper on ultra-wide desktops"
```

---

### Task 2: Cuppa top-row + member grid (`Cuppa/cuppa.html`)

**Files:**
- Modify: `Cuppa/cuppa.html`

- [ ] **Step 1: Remove the erroneous max-width:none override**

Find:
```css
.tab-panel{padding:28px clamp(16px,3vw,40px) 40px;max-width:none;}
```

Replace with:
```css
.tab-panel{padding:28px clamp(16px,3vw,40px) 40px;}
```

This restores the pre-existing `max-width:1280px;margin:0 auto;` cap on `.tab-panel` (defined earlier in this same file, around line 211) for every tab — Ledger, Members, Expenses, Stats — since this later rule was unconditionally overwriting it with no media query guard.

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1600, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Cuppa/cuppa.html');
  await page.waitForTimeout(500);
  const panel = await page.locator('.tab-panel').first().boundingBox();
  await page.screenshot({ path: '/tmp/cuppa-toprow-1600-fixed.png' });
  const membersTab = await page.locator('text=Members').first();
  if (await membersTab.count()) await membersTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/cuppa-members-1600-fixed.png' });
  console.log(JSON.stringify({ panelWidth: panel ? panel.width : null, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`, `panelWidth` at or under 1280. Read both screenshots — confirm the Ledger top-row's three stat cards no longer stretch with large dead space, and the Members grid no longer over-stretches either.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Cuppa/cuppa.html && git commit -m "Cuppa: remove dead max-width:none override that was canceling the existing tab-panel cap"
```

---

### Task 3: LDI param strip (`LDI/ldi.html`)

**Files:**
- Modify: `LDI/ldi.html`

- [ ] **Step 1: Cap and center the params strip**

Find:
```css
.params-strip{
  display:flex;gap:14px;flex-wrap:wrap;align-items:center;
  padding:12px 16px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--rlg);margin-bottom:16px;
}
```

Replace with:
```css
.params-strip{
  display:flex;gap:14px;flex-wrap:wrap;align-items:center;
  padding:12px 16px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--rlg);margin-bottom:16px;max-width:1100px;margin-left:auto;margin-right:auto;
}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1400, height:700}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/LDI/ldi.html');
  await page.waitForTimeout(400);
  const strip = await page.locator('.params-strip').boundingBox();
  await page.screenshot({ path: '/tmp/ldi-params-1400-fixed.png' });
  console.log(JSON.stringify({ stripWidth: strip ? strip.width : null, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`, `stripWidth` at or under 1100. Read the screenshot — confirm the description text on the right no longer floats far away from the param controls with a large empty gap.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add LDI/ldi.html && git commit -m "LDI: cap params strip width so its description text can't drift far from the controls on wide desktops"
```

---

### Task 4: Iceberg boxes-grid (`Cryostorage/cryostorage.html`)

**Files:**
- Modify: `Cryostorage/cryostorage.html`

- [ ] **Step 1: Cap the boxes grid width**

Find:
```css
.boxes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
```

Replace with:
```css
.boxes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-width:900px;}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:2560, height:1100}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Cryostorage/cryostorage.html');
  await page.waitForTimeout(500);
  const grid = await page.locator('.boxes-grid').first();
  const gridCount = await grid.count();
  let gridWidth = null;
  if (gridCount) { const bb = await grid.boundingBox(); gridWidth = bb ? bb.width : null; }
  await page.screenshot({ path: '/tmp/iceberg-boxes-2560-fixed.png' });
  console.log(JSON.stringify({ gridCount, gridWidth, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`. If `gridCount` is 0 (no rack/box exists in a fresh empty state, since this is real seeded data gated behind admin status — see `maybeSeedRealData()`), this is expected on a fresh non-admin load; confirm via the screenshot that the empty state renders without errors instead, and move on — do not attempt to seed data just to test this CSS-only change. If `gridCount` is >0, confirm `gridWidth` is at or under 900.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Cryostorage/cryostorage.html && git commit -m "Iceberg: cap boxes-grid max-width on ultra-wide desktops"
```

---

### Task 5: Spectra res-grid (`Spectra/spectra.html`)

**Files:**
- Modify: `Spectra/spectra.html`

- [ ] **Step 1: Stop the grid from stretching sparse tiles**

Find:
```css
.res-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:4px;}
```

Replace with:
```css
.res-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:4px;}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1920, height:1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Spectra/spectra.html');
  await page.waitForTimeout(400);
  const tiles = await page.locator('#a280-results .res-item').count();
  let tileWidths = [];
  for (let i = 0; i < tiles; i++) {
    const bb = await page.locator('#a280-results .res-item').nth(i).boundingBox();
    if (bb) tileWidths.push(Math.round(bb.width));
  }
  await page.screenshot({ path: '/tmp/spectra-resgrid-1920-fixed.png' });
  console.log(JSON.stringify({ tiles, tileWidths, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`. Read the screenshot — confirm the A280 result tiles (Molar concentration, etc.) stay at a reasonable width with empty space trailing after them, rather than stretching to fill the entire 1920px row.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Spectra/spectra.html && git commit -m "Spectra: switch res-grid from auto-fit to auto-fill so sparse result tiles stop stretching"
```

---

### Task 6: LDI sticky results-table header (`LDI/ldi.html`)

**Files:**
- Modify: `LDI/ldi.html`

- [ ] **Step 1: Give the table wrapper a bounded, scrollable height**

Find:
```html
      <div style="overflow-x:auto;margin-bottom:18px;">
        <table class="res-tbl" id="res-tbl">
```

Replace with:
```html
      <div style="overflow-x:auto;max-height:60vh;overflow-y:auto;margin-bottom:18px;">
        <table class="res-tbl" id="res-tbl">
```

- [ ] **Step 2: Add the sticky header rule**

Find:
```css
.res-tbl{width:100%;border-collapse:collapse;font-size:12.5px;}
```

Replace with:
```css
.res-tbl{width:100%;border-collapse:collapse;font-size:12.5px;}
.res-tbl thead{position:sticky;top:0;background:var(--bg);z-index:2;}
```

- [ ] **Step 3: Verify the header stays pinned while scrolling a long table**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1280, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/LDI/ldi.html');
  await page.waitForTimeout(300);
  // Seed the results table with enough rows to exceed 60vh, then render it directly
  await page.evaluate(() => {
    var tbody = document.getElementById('res-tbody');
    var rows = '';
    for (var i = 0; i < 40; i++) {
      rows += '<tr><td>Compound ' + i + '</td><td>10</td><td>85</td><td>50</td><td>80</td><td>CRBN-dependent</td><td>0.5</td></tr>';
    }
    tbody.innerHTML = rows;
    document.getElementById('results-empty').style.display = 'none';
    document.getElementById('results-content').style.display = '';
  });
  await page.waitForTimeout(200);
  const theadBoxBefore = await page.locator('#res-tbl thead').boundingBox();
  await page.locator('#res-tbl').evaluate(t => { t.parentElement.scrollTop = 400; });
  await page.waitForTimeout(150);
  const theadBoxAfter = await page.locator('#res-tbl thead').boundingBox();
  await page.screenshot({ path: '/tmp/ldi-sticky-header-scrolled.png' });
  console.log(JSON.stringify({ theadBoxBefore, theadBoxAfter, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`, and `theadBoxAfter.y` should be roughly equal to `theadBoxBefore.y` (the header stayed pinned at the top of its scroll container instead of scrolling away with the rows). Read the screenshot — confirm the header row is visible at the top with table rows scrolled underneath it, and the header isn't see-through (rows shouldn't show through behind the header text).

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add LDI/ldi.html && git commit -m "LDI: add sticky header to the results table, with a bounded scroll wrapper so it actually works"
```

---

### Task 7: Final verification, version bump, changelog, session log

**Files:**
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check on all touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in hub-shell.html Cuppa/cuppa.html LDI/ldi.html Cryostorage/cryostorage.html Spectra/spectra.html; do
  python3 -c "
import re
with open('$f') as fh:
    html = fh.read()
opens = len(re.findall(r'<div\b', html))
closes = len(re.findall(r'</div>', html))
print('$f', 'div opens:', opens, 'div closes:', closes, 'balanced:', opens == closes)
"
done
```

Expected: `balanced: True` for all 5 files.

- [ ] **Step 2: JS syntax check on all touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in hub-shell.html Cuppa/cuppa.html LDI/ldi.html Cryostorage/cryostorage.html Spectra/spectra.html; do
  node -e "
const fs = require('fs');
const html = fs.readFileSync('$f', 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let m, i=0, ok=true;
while ((m = re.exec(html))) { i++; try { new Function(m[1]); } catch(e) { ok=false; console.log('$f Block', i, 'FAILED:', e.message); } }
console.log('$f', 'script blocks:', i, 'all ok:', ok);
"
done
```

Expected: `all ok: true` for all 5 files.

If either check fails for any file, STOP and report back — do not attempt fixes yourself, this is unexpected given each file's task was already individually verified.

- [ ] **Step 3: Bump the Hub version and add a changelog entry**

First check the CURRENT version in `hub-shell.html` (it may have moved past v1.1.8 — use the actual current value and bump the patch number by one).

Find in `hub-shell.html`:
```html
    <span class="opts-version">The Hub &middot; v1.1.8</span>
```

Replace with (adjusted to the real current version + 1):
```html
    <span class="opts-version">The Hub &middot; v1.1.9</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.8 &mdash; 21 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.9 &mdash; 21 Jun 2026</strong><br>
    &#9679; Desktop density fixes: capped the Hub home grid, Iceberg's box grid &amp; LDI's param strip from over-stretching on ultra-wide monitors; fixed a dead CSS rule that was breaking Cuppa's existing width cap; fixed Spectra's result tiles stretching when there are only a few; added a sticky header to LDI's results table<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.8 &mdash; 21 Jun 2026</strong><br>
```

- [ ] **Step 4: Rebuild `The Hub.html`**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && python3 embed.py
```

Expected: output lists all 11 apps with `1 replacement(s)` each, ending in `Output: /Users/jonmacicior/Desktop/The_Hub/The Hub.html (N chars)` with no errors.

- [ ] **Step 5: Add the CLAUDE.md session log entry**

Find the line:
```
<!-- LAST_SESSION_START -->
```

Insert immediately after it (the existing top "Last session: ..." entry becomes the next "Previous session: ..." entry, same pattern as every prior round):

```
Last session: [TODAY'S ACTUAL DATE] (Round 90: Phase C Tier 1 — desktop density quick fixes; v1.1.9)
Hub apps: 11. Version v1.1.9.
Phase C Tier 1 of the suite-wide audit (see Round 88/89 for Phases A/B1/B2). Six CSS-only desktop-width fixes, each using the mechanism that actually matched its root cause rather than a blanket "add max-width everywhere":
- hub-shell.html: .home-wrap capped at max-width:1280px;margin:0 auto -- the home card grid was spreading to 8 columns with an orphaned card on ultra-wide monitors.
- Cuppa/cuppa.html: removed a dead `.tab-panel{...;max-width:none}` rule that was silently canceling an EXISTING max-width:1280px cap on the same selector (defined earlier in the file) for every tab, not just the one it was written for -- this was the real cause of both the top-row stat-card stretch and the member-grid stretch flagged in the original audit; one rule, two symptoms.
- LDI/ldi.html: .params-strip capped at max-width:1100px;margin-left/right:auto -- its description text uses margin-left:auto and was drifting arbitrarily far from the actual param controls on wide screens. (Investigated and ruled out the audit's original "wraps awkwardly at 800-900px" framing -- that doesn't reproduce; the real issue only shows up on wide desktops, not medium ones.)
- Cryostorage/cryostorage.html: .boxes-grid capped at max-width:900px -- already used the correct auto-fill grid strategy, just had no width ceiling.
- Spectra/spectra.html: .res-grid switched from auto-fit to auto-fill -- auto-fit was collapsing empty tracks and handing their space to existing result tiles, which is what was actually causing 2-4 tiles to stretch wide on roomy screens. No max-width needed for this one.
- LDI/ldi.html: added a sticky header to the Results tab's table. Investigated Iceberg's existing working sticky header first -- it works because its table sits in a bounded, self-scrolling flex container. LDI's table wrapper had no height bound, so per the CSS spec its overflow-x:auto was silently also becoming a non-functional overflow-y:auto with nothing to ever scroll -- a literal copy of Iceberg's CSS would have done nothing. Real fix: gave the wrapper a max-height:60vh;overflow-y:auto so it's an actual scrolling region, then added position:sticky;top:0 to the thead.
Reviewed via Visual Companion (2 real before/after screenshots: Hub home grid at 2560px, Cuppa top-row at 1600px) plus direct technical investigation for the rest. Full design rationale in docs/superpowers/specs/2026-06-21-phase-c-tier1-density-design.md, plan in docs/superpowers/plans/2026-06-21-phase-c-tier1-density.md.
Tier 2 (layout rework) and Tier 3 (new visual components) of Phase C remain queued, each needing its own brainstorming/Visual Companion pass.
```

- [ ] **Step 6: Commit and push**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html CLAUDE.md && git commit -m "Phase C Tier 1 (desktop density quick fixes): bump Hub to v1.1.9" && git push
```

(`The Hub.html` is gitignored — confirm with `git status --short "The Hub.html"` first; if it shows as ignored or untracked-but-ignored, do not add it.)

- [ ] **Step 7: Report completion**

Summarize: all 6 fixes shipped, verification results from each task plus Steps 1-2 of this task, embed.py rebuild result, and confirm the push succeeded.
