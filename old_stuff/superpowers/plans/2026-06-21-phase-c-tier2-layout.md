# Phase C Tier 2: Desktop Layout-Rework Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 3 fixes approved in `docs/superpowers/specs/2026-06-21-phase-c-tier2-layout-design.md` — a Degradation Explorer empty-state CTA button, a Protein Tools chart divider, and a Spectra axis-tick-label font bump.

**Architecture:** Three independent, surgical edits across three files, each scoped to exactly the element investigated and approved (not the other similar-looking elements nearby that were explicitly ruled out of scope — see each task's "do not touch" note).

**Tech Stack:** Vanilla HTML/CSS/JS, single-file apps, no build step. Verification via Playwright (Node, headless Chromium), same pattern used throughout this project's prior rounds.

---

### Task 1: Degradation Explorer empty-state CTA (`Degradation_Explorer/degradation_visualizer.html`)

**Files:**
- Modify: `Degradation_Explorer/degradation_visualizer.html`

**Do not touch:** the OTHER empty-state in this file (line ~1195, `'<div class="empty-state"><div class="ei">🧬</div><div class="et">No assay data loaded</div>...'`, the SMILES-upload empty state) — only the Table tab's empty state is in scope.

- [ ] **Step 1: Add the CTA button to the Table tab's empty state**

Find:
```js
      '<tr><td colspan="1"><div class="empty-state"><div class="ei">📊</div><div class="et">No data loaded</div><div class="es">Import an Excel file to get started</div></div></td></tr>';
```

Replace with:
```js
      '<tr><td colspan="1"><div class="empty-state"><div class="ei">📊</div><div class="et">No data loaded</div><div class="es">Import an Excel file to get started</div><button onclick="switchTab(\'load\')" style="margin-top:14px;padding:8px 16px;border-radius:7px;border:1px solid var(--accent);background:var(--surface);color:var(--accent);font-size:12.5px;font-weight:600;cursor:pointer;">&#8593; Go to Load Data</button></div></td></tr>';
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:600}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Degradation_Explorer/degradation_visualizer.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('table'));
  await page.waitForTimeout(200);
  const btnCount = await page.locator('.empty-state button').count();
  await page.locator('.empty-state').screenshot({ path: '/tmp/deg-empty-cta-fixed.png' });
  await page.locator('.empty-state button').click();
  await page.waitForTimeout(200);
  const loadPanelActive = await page.locator('#panel-load.active').count();
  console.log(JSON.stringify({ btnCount, loadPanelActive, errors }));
  await browser.close();
})();
"
```

Expected: `btnCount: 1`, `errors: []`, `loadPanelActive: 1` (confirming the click navigated to the Load Data tab). Read the screenshot — confirm the button renders below the existing icon/text with a small gap, bordered in the accent color, not visually crowding the text above it.

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Degradation_Explorer/degradation_visualizer.html && git commit -m "Degradation Explorer: add a CTA button to the Table tab's empty state"
```

---

### Task 2: Protein Tools chart divider (`Protein_Tools/protein_tools.html`)

**Files:**
- Modify: `Protein_Tools/protein_tools.html`

- [ ] **Step 1: Add a divider between the two chart halves via an adjacent-sibling selector (no markup change needed — both `.chart-half` divs are already direct children of `.props-charts-row`)**

Find:
```css
.chart-half{flex:1;min-width:0;}
```

Replace with:
```css
.chart-half{flex:1;min-width:0;}
.chart-half+.chart-half{border-left:1px solid var(--border);padding-left:16px;}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1100, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Protein_Tools/protein_tools.html');
  await page.waitForTimeout(300);
  const halves = await page.locator('.chart-half').all();
  const borders = [];
  for (const h of halves) {
    const b = await h.evaluate(el => getComputedStyle(el).borderLeft);
    borders.push(b);
  }
  await page.locator('.props-charts-row').screenshot({ path: '/tmp/pt-chart-divider-fixed.png' });
  console.log(JSON.stringify({ borders, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`, `borders` array of length 2 where the first entry has no border (e.g. `0px none ...`) and the second entry shows `1px solid` in some color (the `var(--border)` value). Read the screenshot — confirm a thin vertical line now separates Hydrophobicity Profile from Charge vs pH, with the second chart's content sitting slightly clear of the line (not touching it).

- [ ] **Step 3: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Protein_Tools/protein_tools.html && git commit -m "Protein Tools: add a divider between the Hydrophobicity Profile and Charge vs pH charts"
```

---

### Task 3: Spectra Standard Curve axis tick-label font (`Spectra/spectra.html`)

**Files:**
- Modify: `Spectra/spectra.html`

**Do not touch:** the THIRD occurrence of `ctx.font = '10px ' + getCSSVar('--mono');` in this file (inside `drawHeatmap()`, the Plate Reader tab's heatmap — a completely different chart, out of scope). Only the two occurrences inside the Standard Curve's axis-tick-drawing loops (shown below, identifiable by their surrounding `xTicks`/`yTicks` loop context) are in scope.

- [ ] **Step 1: Bump the X-axis tick-label font**

Find:
```js
  for(var i=0;i<=xTicks;i++){
    var xv = x0 + i*(x1-x0)/xTicks;
    var cx = margin.left + i*cW/xTicks;
    ctx.beginPath(); ctx.moveTo(cx, margin.top); ctx.lineTo(cx, margin.top+cH); ctx.stroke();
    ctx.fillStyle = text3;
    ctx.font = '10px ' + getCSSVar('--mono');
    ctx.textAlign = 'center';
    ctx.fillText(xv.toFixed(xv > 100 ? 0 : 1), cx, margin.top + cH + 14);
  }
```

Replace with:
```js
  for(var i=0;i<=xTicks;i++){
    var xv = x0 + i*(x1-x0)/xTicks;
    var cx = margin.left + i*cW/xTicks;
    ctx.beginPath(); ctx.moveTo(cx, margin.top); ctx.lineTo(cx, margin.top+cH); ctx.stroke();
    ctx.fillStyle = text3;
    ctx.font = '11px ' + getCSSVar('--mono');
    ctx.textAlign = 'center';
    ctx.fillText(xv.toFixed(xv > 100 ? 0 : 1), cx, margin.top + cH + 14);
  }
```

- [ ] **Step 2: Bump the Y-axis tick-label font**

Find:
```js
  for(var j=0;j<=yTicks;j++){
    var yv = y0 + j*(y1-y0)/yTicks;
    var cy = margin.top + cH - j*cH/yTicks;
    ctx.beginPath(); ctx.moveTo(margin.left, cy); ctx.lineTo(margin.left+cW, cy); ctx.stroke();
    ctx.fillStyle = text3;
    ctx.font = '10px ' + getCSSVar('--mono');
    ctx.textAlign = 'right';
    ctx.fillText(yv.toFixed(2), margin.left - 5, cy + 3);
  }
```

Replace with:
```js
  for(var j=0;j<=yTicks;j++){
    var yv = y0 + j*(y1-y0)/yTicks;
    var cy = margin.top + cH - j*cH/yTicks;
    ctx.beginPath(); ctx.moveTo(margin.left, cy); ctx.lineTo(margin.left+cW, cy); ctx.stroke();
    ctx.fillStyle = text3;
    ctx.font = '11px ' + getCSSVar('--mono');
    ctx.textAlign = 'right';
    ctx.fillText(yv.toFixed(2), margin.left - 5, cy + 3);
  }
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:900, height:700}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Spectra/spectra.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('stdcurve'));
  await page.waitForTimeout(300);
  await page.locator('#panel-stdcurve').screenshot({ path: '/tmp/spectra-stdcurve-font-fixed.png' });
  console.log(JSON.stringify({ errors }));
  // Confirm the heatmap function itself is untouched
  const fs = require('fs');
  const html = fs.readFileSync('Spectra/spectra.html', 'utf8');
  const heatmapFontStillTen = /function drawHeatmap[\s\S]{0,400}?ctx\.font = '10px '/.test(html);
  console.log(JSON.stringify({ heatmapFontStillTen }));
  await browser.close();
})();
"
```

Expected: `errors: []`, `heatmapFontStillTen: true` (confirming `drawHeatmap()`'s own font declaration was left at `10px`, untouched). Read the screenshot — the Standard Curve's axis numbers should be visibly present and legible (exact 1px size difference won't be dramatic, but confirm nothing broke — labels still positioned correctly, not overlapping the grid lines or each other).

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Spectra/spectra.html && git commit -m "Spectra: bump Standard Curve axis tick-label font 10px to 11px"
```

---

### Task 4: Final verification, version bump, changelog, session log

**Files:**
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check on all touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in Degradation_Explorer/degradation_visualizer.html Protein_Tools/protein_tools.html Spectra/spectra.html; do
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

Expected: `balanced: True` for all 3 files.

- [ ] **Step 2: JS syntax check on all touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in Degradation_Explorer/degradation_visualizer.html Protein_Tools/protein_tools.html Spectra/spectra.html; do
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

Expected: `all ok: true` for all 3 files.

If either check fails for any file, STOP and report back — do not attempt fixes yourself, this is unexpected given each file's task was already individually verified.

- [ ] **Step 3: Bump the Hub version and add a changelog entry**

First check the CURRENT version in `hub-shell.html` (it may have moved past v1.1.9 — use the actual current value and bump the patch number by one).

Find in `hub-shell.html`:
```html
    <span class="opts-version">The Hub &middot; v1.1.9</span>
```

Replace with (adjusted to the real current version + 1):
```html
    <span class="opts-version">The Hub &middot; v1.2.0</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.9 &mdash; 21 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.2.0 &mdash; 21 Jun 2026</strong><br>
    &#9679; Desktop layout fixes: added a CTA button to Degradation Explorer's empty state, a divider between Protein Tools' two charts, and a slightly larger axis-label font on Spectra's Standard Curve<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.9 &mdash; 21 Jun 2026</strong><br>
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
Last session: [TODAY'S ACTUAL DATE] (Round 91: Phase C Tier 2 -- desktop layout-rework fixes; v1.2.0)
Hub apps: 11. Version v1.2.0.
Phase C Tier 2 of the suite-wide audit (see Round 88-90 for Phases A/B1/B2 and Tier 1). The original 7-item, 5-app backlog (Echo, Degradation Explorer, Protein Tools, Spectra, Lab Designer) was directly investigated against the live apps before building anything -- 5 of the 7 items turned out to be false positives once tested against real content (not just read from the original audit's wording):
- Spectra's heatmap legend already has a working gradient swatch (.legend-bar) -- the "text-only" framing was wrong.
- Protein Tools' "uneven card heights" -- measured with real example data loaded, both .props-grid cards are exactly 266.65625px tall. Identical.
- Lab Designer's "sparse single-column gd-ctrl form" -- it already pairs fields in 2 columns (Format/Title, Label position/Orientation, etc).
- Lab Designer's "well-type color-picker form layout" -- opened it directly; clean, compact, nothing to fix.
- Echo's "setup-modal vertical whitespace" + "sidebar file list" -- the sidebar doesn't correspond to anything in the Files tab; the modal's own spacing, viewed at full resolution instead of a scaled/backdrop-blurred screenshot, turned out to be clean and intentional, not a dead-space bug.
One genuinely real substitute issue was found while investigating Lab Designer (Gel Designer's preview pane has ~600px of empty space below a 102px-tall preview) -- reviewed via Visual Companion before/after, user chose to leave the current top-anchored behavior unchanged (better fit for a "build top-down" tool than centering would be).
Final shipped scope -- 3 fixes:
- Degradation_Explorer/degradation_visualizer.html: added a "Go to Load Data" CTA button to the Table tab's empty state (it already had an icon+text, just no clickable affordance); button calls the existing switchTab('load') function, no new file-picker logic.
- Protein_Tools/protein_tools.html: added a thin border-left divider between the Hydrophobicity Profile and Charge vs pH charts via a `.chart-half+.chart-half` adjacent-sibling selector -- no markup change needed.
- Spectra/spectra.html: bumped the Standard Curve chart's axis tick-label font from 10px to 11px (both X and Y axes) for readability; left the Plate Reader heatmap's own, textually-identical font declaration at 10px since that's a different chart, out of scope.
Reviewed via Visual Companion for the Degradation Explorer + Gel Designer items (real before/after screenshots); the chart divider and font bump were simple enough to approve as direct text proposals.
Full design rationale in docs/superpowers/specs/2026-06-21-phase-c-tier2-layout-design.md, plan in docs/superpowers/plans/2026-06-21-phase-c-tier2-layout.md.
Tier 3 (new visual components) of Phase C remains queued, needs its own brainstorming/Visual Companion pass.
```

- [ ] **Step 6: Commit and push**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html CLAUDE.md && git commit -m "Phase C Tier 2 (desktop layout-rework fixes): bump Hub to v1.2.0" && git push
```

(`The Hub.html` is gitignored — confirm with `git status --short "The Hub.html"` first; if it shows as ignored or untracked-but-ignored, do not add it.)

- [ ] **Step 7: Report completion**

Summarize: all 3 fixes shipped, verification results from each task plus Steps 1-2 of this task, embed.py rebuild result, and confirm the push succeeded.
