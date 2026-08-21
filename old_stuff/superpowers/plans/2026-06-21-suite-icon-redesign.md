# Suite-wide Tab/Badge Icon Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain-text tab labels (and two emoji/Unicode badge sets) with SVG line-pictogram icons across 9 standalone apps in "The Hub" project, per the approved design in `docs/superpowers/specs/2026-06-21-suite-icon-redesign-design.md`.

**Architecture:** Each app keeps its existing tab-bar markup and active/inactive color logic untouched — we only insert an inline `<svg>` before each tab's text label, sized to sit inline, colored via `stroke="currentColor"` so it automatically follows the tab's existing active/inactive text color (confirmed with the user: no new bordered-box treatment on tabs themselves, that idea from early mockups was explicitly rejected in favor of "icon just inherits current color"). Where a tab-bar's CSS rule isn't already a flex container (added in the prior mobile-fixes round for some apps), we add `display:inline-flex;align-items:center;gap:6px` so the icon and text align cleanly. Cuppa's 6 expense-category badges are a different case — they get small 22×22px solid-color boxed icons matching the file's own existing `.dk-*` drink-badge pattern (with a border added per user feedback), not the cross-suite "icon inherits color" tab treatment, since they aren't inside a tab bar.

**Tech Stack:** Vanilla HTML/CSS/JS, single-file apps, no build step. Verification via Playwright (Node, headless Chromium) — same pattern used throughout this project's prior mobile-fixes round.

---

### Task 1: LDI (3 tabs)

**Files:**
- Modify: `LDI/ldi.html`

- [ ] **Step 1: Add flex/gap and icon sizing to the base tab rule**

Find:
```css
.tab-btn{
  padding:12px 16px;font-size:13px;color:var(--text3);cursor:pointer;
  border-bottom:2px solid transparent;white-space:nowrap;flex-shrink:0;
  font-family:var(--sans);background:none;border-top:none;border-left:none;border-right:none;
  transition:color .15s;
}
```

Replace with:
```css
.tab-btn{
  padding:12px 16px;font-size:13px;color:var(--text3);cursor:pointer;
  border-bottom:2px solid transparent;white-space:nowrap;flex-shrink:0;
  font-family:var(--sans);background:none;border-top:none;border-left:none;border-right:none;
  transition:color .15s;display:inline-flex;align-items:center;gap:6px;
}
.tab-btn svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Data tab icon**

Find:
```html
  <button class="tab-btn active" id="tab-data-btn" onclick="showTab('data')">Data</button>
```

Replace with:
```html
  <button class="tab-btn active" id="tab-data-btn" onclick="showTab('data')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></svg>Data</button>
```

- [ ] **Step 3: Results tab icon**

Find:
```html
  <button class="tab-btn" id="tab-results-btn" onclick="showTab('results')">Results</button>
```

Replace with:
```html
  <button class="tab-btn" id="tab-results-btn" onclick="showTab('results')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V10M12 19V5M19 19v-7"/></svg>Results</button>
```

- [ ] **Step 4: Curves tab icon**

Find:
```html
  <button class="tab-btn" id="tab-curves-btn" onclick="showTab('curves')">Curves</button>
```

Replace with:
```html
  <button class="tab-btn" id="tab-curves-btn" onclick="showTab('curves')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c4-10 8 6 12-4c2-5 4-2 6-2"/></svg>Curves</button>
```

- [ ] **Step 5: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/LDI/ldi.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab-btn svg').count();
  await page.screenshot({ path: '/tmp/ldi_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/ldi_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 3`, `errors: []`. Read both screenshots — confirm each tab shows icon + text inline, no overflow, active tab's icon is colored like its text (accent), inactive tabs' icons are gray like their text.

- [ ] **Step 6: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add LDI/ldi.html && git commit -m "LDI: add line-pictogram icons to Data/Results/Curves tabs"
```

---

### Task 2: Echo (4 tabs, setup modal)

**Files:**
- Modify: `Labcyte_Echo/labcyte_echo.html`

- [ ] **Step 1: Add flex/gap and icon sizing to the base tab rule**

Find:
```css
.setup-stab{padding:8px 16px;font-size:12px;font-weight:600;color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap;}
```

Replace with:
```css
.setup-stab{padding:8px 16px;font-size:12px;font-weight:600;color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
.setup-stab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Files tab icon**

Find:
```html
      <div class="setup-stab active" data-tab="files" onclick="switchSetupTab('files')">Files</div>
```

Replace with:
```html
      <div class="setup-stab active" data-tab="files" onclick="switchSetupTab('files')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>Files</div>
```

- [ ] **Step 3: Assay tab icon**

Find:
```html
      <div class="setup-stab" data-tab="assay" onclick="switchSetupTab('assay')">Assay</div>
```

Replace with:
```html
      <div class="setup-stab" data-tab="assay" onclick="switchSetupTab('assay')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/></svg>Assay</div>
```

- [ ] **Step 4: Analysis tab icon**

Find:
```html
      <div class="setup-stab" data-tab="analysis" onclick="switchSetupTab('analysis')">Analysis</div>
```

Replace with:
```html
      <div class="setup-stab" data-tab="analysis" onclick="switchSetupTab('analysis')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V10M12 19V5M19 19v-7"/></svg>Analysis</div>
```

- [ ] **Step 5: Output tab icon**

Find:
```html
      <div class="setup-stab" data-tab="output" onclick="switchSetupTab('output')">Output</div>
```

Replace with:
```html
      <div class="setup-stab" data-tab="output" onclick="switchSetupTab('output')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>Output</div>
```

- [ ] **Step 6: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labcyte_Echo/labcyte_echo.html');
  await page.waitForTimeout(400);
  const svgCount = await page.locator('.setup-stab svg').count();
  await page.screenshot({ path: '/tmp/echo_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/echo_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4` (the setup modal auto-opens on load per existing behavior), `errors: []`. Read both screenshots, confirm icon+text alignment and active/inactive coloring.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labcyte_Echo/labcyte_echo.html && git commit -m "Echo: add line-pictogram icons to setup modal tabs (Files/Assay/Analysis/Output)"
```

---

### Task 3: Lab Designer (4 tabs)

**Files:**
- Modify: `Plate_Designer/plate_designer.html`

- [ ] **Step 1: Add gap and icon sizing to the base tab rule (already flex from a prior round)**

Find:
```css
.tab{padding:9px 16px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;min-height:40px;display:inline-flex;align-items:center;}
```

Replace with:
```css
.tab{padding:9px 16px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;min-height:40px;display:inline-flex;align-items:center;gap:6px;}
.tab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Plate Designer tab icon**

Find:
```html
  <button class="tab active" onclick="switchTab('designer',this)">Plate Designer</button>
```

Replace with:
```html
  <button class="tab active" onclick="switchTab('designer',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate Designer</button>
```

- [ ] **Step 3: Gel Designer tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('gel',this)">Gel Designer</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('gel',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M7 5v14M11 5v14M15 5v14"/></svg>Gel Designer</button>
```

- [ ] **Step 4: History tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('history',this)">History</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('history',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>History</button>
```

- [ ] **Step 5: Guide tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('guide',this)">Guide</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('guide',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</button>
```

- [ ] **Step 6: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Plate_Designer/plate_designer.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab svg').count();
  await page.screenshot({ path: '/tmp/pd_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/pd_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4`, `errors: []`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Plate_Designer/plate_designer.html && git commit -m "Lab Designer: add line-pictogram icons to Plate Designer/Gel Designer/History/Guide tabs"
```

---

### Task 4: Degradation Explorer (5 tabs)

**Files:**
- Modify: `Degradation_Explorer/degradation_visualizer.html`

- [ ] **Step 1: Add gap and icon sizing to the base tab rule (already flex from a prior round)**

Find:
```css
.tab { padding: 10px 20px; font-size: 12px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text3); transition: color 0.12s, border-color 0.12s; user-select: none; min-height:36px; display:inline-flex; align-items:center; }
```

Replace with:
```css
.tab { padding: 10px 20px; font-size: 12px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text3); transition: color 0.12s, border-color 0.12s; user-select: none; min-height:36px; display:inline-flex; align-items:center; gap:6px; }
.tab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Load Data tab icon**

Find:
```html
  <div class="tab active" onclick="switchTab('load')">Load Data</div>
```

Replace with:
```html
  <div class="tab active" onclick="switchTab('load')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>Load Data</div>
```

- [ ] **Step 3: Table tab icon**

Find:
```html
  <div class="tab" onclick="switchTab('table')">Table</div>
```

Replace with:
```html
  <div class="tab" onclick="switchTab('table')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></svg>Table</div>
```

- [ ] **Step 4: DC50 vs Dmax tab icon**

Find:
```html
  <div class="tab" onclick="switchTab('scatter')">DC50 vs Dmax</div>
```

Replace with:
```html
  <div class="tab" onclick="switchTab('scatter')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>DC50 vs Dmax</div>
```

- [ ] **Step 5: Properties tab icon**

Find:
```html
  <div class="tab" onclick="switchTab('props')">Properties</div>
```

Replace with:
```html
  <div class="tab" onclick="switchTab('props')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="16" r="2.6"/><path d="M9 9.5l1 4M15 9.3l-1 4.5"/></svg>Properties</div>
```

- [ ] **Step 6: Guide tab icon**

Find:
```html
  <div class="tab" onclick="switchTab('guide')">Guide</div>
```

Replace with:
```html
  <div class="tab" onclick="switchTab('guide')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</div>
```

- [ ] **Step 7: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Degradation_Explorer/degradation_visualizer.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab svg').count();
  await page.screenshot({ path: '/tmp/deg_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/deg_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 5`, `errors: []`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Degradation_Explorer/degradation_visualizer.html && git commit -m "Degradation Explorer: add line-pictogram icons to all 5 tabs"
```

---

### Task 5: Helix (5 tabs)

**Files:**
- Modify: `Helix/helix.html`

- [ ] **Step 1: Add flex/gap and icon sizing to the base tab rule**

Find:
```css
.tab{padding:10px 16px;min-height:36px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;}
```

Replace with:
```css
.tab{padding:10px 16px;min-height:36px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;display:inline-flex;align-items:center;gap:6px;}
.tab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Genetic Code tab icon**

Find:
```html
  <button class="tab active" onclick="switchTab('genetic',this)">Genetic Code</button>
```

Replace with:
```html
  <button class="tab active" onclick="switchTab('genetic',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 2c0 4 10 4 10 8s-10 4-10 8M17 2c0 4-10 4-10 8s10 4 10 8"/></svg>Genetic Code</button>
```

- [ ] **Step 3: Sequence Tools tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('seqtools',this)">Sequence Tools</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('seqtools',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h4M9 6h12M3 12h10M15 12h6M3 18h7M12 18h9"/></svg>Sequence Tools</button>
```

- [ ] **Step 4: Compare tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('compare',this)">Compare</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('compare',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h16M4 16h16"/><path d="M9 8v8M14 8v8"/><path d="M19 6l2 2-2 2M5 14l-2 2 2 2"/></svg>Compare</button>
```

- [ ] **Step 5: Vector Library tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('vectors',this)">Vector Library</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('vectors',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M16 6.5a8 8 0 010 11"/><circle cx="12" cy="4" r="1.1" fill="currentColor" stroke="none"/></svg>Vector Library</button>
```

- [ ] **Step 6: Guide tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('guide',this)">Guide</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('guide',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</button>
```

- [ ] **Step 7: Re-verify the tab-indicator scroll fix from the prior round still works**

This file has a `.tab-indicator` underline (fixed in the mobile-fixes round to recompute on `.tabs` scroll). Adding icons changes each tab's rendered width — confirm the indicator still aligns correctly under the active tab after this change, since width changed.

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Helix/helix.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab svg').count();
  const activeTab = await page.locator('.tab.active').first();
  const tabBox = await activeTab.boundingBox();
  const indicator = await page.locator('.tab-indicator').boundingBox();
  await page.screenshot({ path: '/tmp/helix_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/helix_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors, tabBox, indicator }));
  await browser.close();
})();
"
```

Expected: `svgCount: 5`, `errors: []`, and `indicator.x`/`indicator.width` closely matching `tabBox.x`/`tabBox.width` (the indicator should still sit under the active tab, not be offset from when tabs were narrower).

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Helix/helix.html && git commit -m "Helix: add line-pictogram icons to all 5 tabs"
```

---

### Task 6: Protein Tools (5 tabs)

**Files:**
- Modify: `Protein_Tools/protein_tools.html`

- [ ] **Step 1: Add flex/gap and icon sizing to the base tab rule**

Find:
```css
.tab{padding:10px 16px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;white-space:nowrap;}
```

Replace with:
```css
.tab{padding:10px 16px;border:none;background:none;color:var(--text2);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
.tab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: Properties tab icon**

Find:
```html
  <button class="tab active" onclick="switchTab('props',this)">Properties</button>
```

Replace with:
```html
  <button class="tab active" onclick="switchTab('props',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 5L5 19M7 5h4M5 7v4M17 19h-4M19 17v-4"/></svg>Properties</button>
```

- [ ] **Step 3: Cleavage tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('cleavage',this)">Cleavage</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('cleavage',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M20 20L11 11"/></svg>Cleavage</button>
```

- [ ] **Step 4: Structure tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('structure',this)">Structure</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('structure',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 3c4 2 8 2 8 6s-4 4-8 6M6 3v15"/></svg>Structure</button>
```

- [ ] **Step 5: Target Intel tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('ti',this)">Target Intel</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('ti',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>Target Intel</button>
```

- [ ] **Step 6: Guide tab icon**

Find:
```html
  <button class="tab" onclick="switchTab('guide',this)">Guide</button>
```

Replace with:
```html
  <button class="tab" onclick="switchTab('guide',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</button>
```

- [ ] **Step 7: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Protein_Tools/protein_tools.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab svg').count();
  await page.screenshot({ path: '/tmp/pt_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/pt_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 5`, `errors: []`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Protein_Tools/protein_tools.html && git commit -m "Protein Tools: add line-pictogram icons to all 5 tabs"
```

---

### Task 7: Spectra (5 tabs)

**Files:**
- Modify: `Spectra/spectra.html`

- [ ] **Step 1: Add flex/gap and icon sizing to the base tab rule**

Find:
```css
.tab{padding:10px 16px;border:none;background:none;color:var(--text2);
  font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;
  white-space:nowrap;}
```

Replace with:
```css
.tab{padding:10px 16px;border:none;background:none;color:var(--text2);
  font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;
  white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
.tab svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: A280 tab icon**

Find:
```html
  <button class="tab active" data-tab="a280" onclick="switchTab('a280')">A280</button>
```

Replace with:
```html
  <button class="tab active" data-tab="a280" onclick="switchTab('a280')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c3 4 6 7.5 6 11a6 6 0 01-12 0c0-3.5 3-7 6-11z"/></svg>A280</button>
```

- [ ] **Step 3: Ratios tab icon**

Find:
```html
  <button class="tab" data-tab="ratios" onclick="switchTab('ratios')">Ratios</button>
```

Replace with:
```html
  <button class="tab" data-tab="ratios" onclick="switchTab('ratios')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/></svg>Ratios</button>
```

- [ ] **Step 4: Std Curve tab icon**

Find:
```html
  <button class="tab" data-tab="stdcurve" onclick="switchTab('stdcurve')">Std Curve</button>
```

Replace with:
```html
  <button class="tab" data-tab="stdcurve" onclick="switchTab('stdcurve')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c4-10 8 6 12-4c2-5 4-2 6-2"/></svg>Std Curve</button>
```

- [ ] **Step 5: Plate Reader tab icon**

Find:
```html
  <button class="tab" data-tab="plate" onclick="switchTab('plate')">Plate Reader</button>
```

Replace with:
```html
  <button class="tab" data-tab="plate" onclick="switchTab('plate')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate Reader</button>
```

- [ ] **Step 6: Guide tab icon**

Find:
```html
  <button class="tab" data-tab="guide" onclick="switchTab('guide')">Guide</button>
```

Replace with:
```html
  <button class="tab" data-tab="guide" onclick="switchTab('guide')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 014 16.5v-12z"/><path d="M4 16.5A2.5 2.5 0 016.5 19H20"/></svg>Guide</button>
```

- [ ] **Step 7: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Spectra/spectra.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab svg').count();
  await page.screenshot({ path: '/tmp/spectra_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/spectra_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 5`, `errors: []`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Spectra/spectra.html && git commit -m "Spectra: add line-pictogram icons to all 5 tabs"
```

---

### Task 8: Iceberg (2 tabs)

**Files:**
- Modify: `Cryostorage/cryostorage.html`

**Important — out of scope:** this file also uses the same snowflake glyph (`&#10052;`) as a large 38px illustrative icon inside an empty-state (`.ei` class, around line 744) and a clipboard emoji (`&#128203;`) in another empty-state (line 894). Do NOT touch either of those — only the `.ti` spans inside the `.tabs` tab bar (lines 333/336) are in scope.

- [ ] **Step 1: Resize the `.ti` tab-icon class for SVG instead of emoji**

Find:
```css
.tab .ti{font-size:13px;}
```

Replace with:
```css
.tab .ti{font-size:13px;display:inline-flex;align-items:center;}
.tab .ti svg{width:15px;height:15px;flex-shrink:0;}
```

- [ ] **Step 2: −80°C tab icon**

Find:
```html
    <span class="ti">&#10052;</span><span>&minus;80&deg;C</span><span class="tcount" id="tc-minus80">0</span>
```

Replace with:
```html
    <span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg></span><span>&minus;80&deg;C</span><span class="tcount" id="tc-minus80">0</span>
```

- [ ] **Step 3: Liquid N₂ tab icon**

Find:
```html
    <span class="ti">&#127777;</span><span>Liquid N&#8322;</span><span class="tcount" id="tc-n2">0</span>
```

Replace with:
```html
    <span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2c0 3-3 5-3 9a5 5 0 0010 0c0-1.5-.7-2.7-1.5-3.8"/><path d="M9 8c.5 1 1.5 1.5 1.5 3"/></svg></span><span>Liquid N&#8322;</span><span class="tcount" id="tc-n2">0</span>
```

- [ ] **Step 4: Verify**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Cryostorage/cryostorage.html');
  await page.waitForTimeout(300);
  const svgCount = await page.locator('.tab .ti svg').count();
  const eiUntouched = await page.locator('.ei').count();
  await page.screenshot({ path: '/tmp/iceberg_tabs_mobile.png' });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/iceberg_tabs_desktop.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
grep -n "class=\"ei\"" Cryostorage/cryostorage.html
```

Expected: `svgCount: 2`, `errors: []`. The `grep` should still show the original emoji content (`&#10052;`, `&#128203;`) inside `.ei` spans, confirming those were not touched.

- [ ] **Step 5: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Cryostorage/cryostorage.html && git commit -m "Iceberg: replace Unicode tab symbols with SVG line-pictograms (-80C/Liquid N2)"
```

---

### Task 9: Cuppa (6 expense-category badges)

**Files:**
- Modify: `Cuppa/cuppa.html`

**Background:** Cuppa's expense categories are NOT a tab bar — they're rendered inline inside a `.cat-badge` pill (`<td><span class="cat-badge" style="background:'+cat.color+'22;color:'+cat.color+';">'+cat.icon+' '+esc(e.category)+'</span></td>`, around line 2143) where `cat.icon` currently holds a raw emoji character from the `EXPENSE_CATS` object (around line 997). This file already has an established pattern for icon badges — `DRINK_ICONS` (around line 987) stores `<span class="dk dk-coffee" title="Coffee"><svg ...>...</svg></span>`-style markup, sized via a shared `.dk{width:22px;height:22px;border-radius:6px;...}` + `.dk svg{width:13px;height:13px;}` CSS rule (around line 696), with each drink getting its own `.dk-coffee{background:linear-gradient(...)}` class. We're reusing this exact `.dk` sizing convention for the new category icons, but with flat solid color + a border (per explicit user feedback during mockup review — gradients were tried first and rejected) instead of a gradient.

- [ ] **Step 1: Add new CSS classes for the 6 category icon boxes**

Find:
```css
.dk-none{background:var(--surface3);box-shadow:none;}
.dk-none svg{opacity:.55;}
```

Replace with:
```css
.dk-none{background:var(--surface3);box-shadow:none;}
.dk-none svg{opacity:.55;}
.dk-cat{border:1.5px solid rgba(0,0,0,0.12);}
[data-theme="dark"] .dk-cat{border-color:rgba(255,255,255,0.12);}
.dk-cat-amazon{background:#8a6f5c;}
.dk-cat-coffee{background:#6b4d31;}
.dk-cat-milk{background:#a99a87;}
.dk-cat-supermarket{background:#6f8a5c;}
.dk-cat-incoming{background:#9c8550;}
.dk-cat-other{background:#5c7a8a;}
```

- [ ] **Step 2: Replace the 6 emoji icons in EXPENSE_CATS with inline SVG badge markup**

Find:
```js
var EXPENSE_CATS = {
  'Amazon':     { icon:'📦', color:'#ff9800' },
  'Coffee':     { icon:'☕', color:'#8d6e63' },
  'Milk':       { icon:'🥛', color:'#42a5f5' },
  'Supermarket':{ icon:'🛒', color:'#66bb6a' },
  'Incoming':   { icon:'💰', color:'#43a047' },
  'Other':      { icon:'💳', color:'#9e9e9e' }
};
```

Replace with:
```js
var EXPENSE_CATS = {
  'Amazon':     { icon:'<span class="dk dk-cat dk-cat-amazon" title="Amazon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg></span>', color:'#ff9800' },
  'Coffee':     { icon:'<span class="dk dk-cat dk-cat-coffee" title="Coffee"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M5 9h13v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z"/><path d="M18 10h1.4a2 2 0 010 4H18"/></svg></span>', color:'#8d6e63' },
  'Milk':       { icon:'<span class="dk dk-cat dk-cat-milk" title="Milk"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M8 3h8l1 4-2 13H9L7 7l1-4z"/><path d="M7.5 8h9"/></svg></span>', color:'#42a5f5' },
  'Supermarket':{ icon:'<span class="dk dk-cat dk-cat-supermarket" title="Supermarket"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M3 4h2l2.4 12.5a2 2 0 002 1.5h7.2a2 2 0 002-1.8L20 8H6"/></svg></span>', color:'#66bb6a' },
  'Incoming':   { icon:'<span class="dk dk-cat dk-cat-incoming" title="Incoming"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2.5-5 2-5 5a2.5 2.5 0 005 0"/></svg></span>', color:'#43a047' },
  'Other':      { icon:'<span class="dk dk-cat dk-cat-other" title="Other"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg></span>', color:'#9e9e9e' }
};
```

- [ ] **Step 3: Verify the badge still renders correctly with the new icon markup**

The rendering code at (originally) line 2143 does `+cat.icon+' '+esc(e.category)+'` — since `cat.icon` is now HTML markup instead of a plain character, confirm this still works (it will, since it's already building an HTML string via string concatenation and inserting it via `.innerHTML`, the same mechanism `DRINK_ICONS` already relies on elsewhere in this file).

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Cuppa/cuppa.html');
  await page.waitForTimeout(300);
  // Navigate to the Expenses tab where .cat-badge rows render, if not default
  const expensesTabExists = await page.locator('[onclick*=\"expenses\"], [data-tab=\"expenses\"]').count();
  if (expensesTabExists) await page.locator('[onclick*=\"expenses\"], [data-tab=\"expenses\"]').first().click();
  await page.waitForTimeout(300);
  const badgeSvgCount = await page.locator('.cat-badge .dk-cat svg').count();
  await page.screenshot({ path: '/tmp/cuppa_expenses_mobile.png', fullPage: true });
  await page.setViewportSize({width:1200, height:900});
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/cuppa_expenses_desktop.png', fullPage: true });
  console.log(JSON.stringify({ badgeSvgCount, errors }));
  await browser.close();
})();
"
```

Expected: `errors: []`. `badgeSvgCount` should be >0 if there are expense rows visible with real data — if this app loads with zero seeded expense data in a fresh context, navigate to wherever sample/seed data can be triggered (check the file for a "load test data" or similar button, same as other apps in this suite use), or just confirm visually via the screenshot that at least one badge renders with an icon instead of an emoji. Read both screenshots and confirm the badges show a small colored box (not a bare emoji character), bordered, with the category text next to it — and confirm it doesn't look oversized or broken next to the existing pill background tint.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Cuppa/cuppa.html && git commit -m "Cuppa: replace expense-category emoji with SVG badges matching the existing drink-badge style"
```

---

### Task 10: Final verification, version bump, changelog, session log

**Files:**
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check on all 9 touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in LDI/ldi.html Labcyte_Echo/labcyte_echo.html Plate_Designer/plate_designer.html Degradation_Explorer/degradation_visualizer.html Helix/helix.html Protein_Tools/protein_tools.html Spectra/spectra.html Cryostorage/cryostorage.html Cuppa/cuppa.html; do
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

Expected: `balanced: True` for all 9 files.

- [ ] **Step 2: JS syntax check on all 9 touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in LDI/ldi.html Labcyte_Echo/labcyte_echo.html Plate_Designer/plate_designer.html Degradation_Explorer/degradation_visualizer.html Helix/helix.html Protein_Tools/protein_tools.html Spectra/spectra.html Cryostorage/cryostorage.html Cuppa/cuppa.html; do
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

Expected: `all ok: true` for all 9 files.

- [ ] **Step 3: Bump the Hub version and add a changelog entry**

Find in `hub-shell.html` (check the current version first — it may have moved past v1.1.7; use whatever the current value actually is and bump the patch number by one):
```html
    <span class="opts-version">The Hub &middot; v1.1.7</span>
```

Replace with (adjust the version number to be one patch above whatever was actually found):
```html
    <span class="opts-version">The Hub &middot; v1.1.8</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.7 &mdash; 21 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.8 &mdash; 21 Jun 2026</strong><br>
    &#9679; Added line-pictogram icons to tab bars across Echo, Lab Designer, Degradation Explorer, Helix, Protein Tools, Spectra &amp; LDI; replaced Iceberg's Unicode tab symbols and Cuppa's expense-category emoji with matching SVG icons<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.7 &mdash; 21 Jun 2026</strong><br>
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

Insert immediately after it (read the surrounding ~10 lines first to copy the exact demotion pattern used by the prior entry — push the previous "Last session" entry down to become a "Previous session" entry):

```
Last session: [TODAY'S DATE] (Round 89: Suite-wide icon redesign — Phase B2; v1.1.8)
Hub apps: 11. Version v1.1.8.
Phase B2 of the suite-wide audit (see Round 88 for Phases A/B1). Added line-pictogram icons (icon + text, icon inherits the tab's existing active/inactive color via stroke="currentColor" -- no new bordered-box treatment on the tabs themselves, confirmed with the user this should NOT look like LabMate's mobile-grid tiles) to:
- LDI (Data/Results/Curves), Echo (Files/Assay/Analysis/Output, setup modal), Lab Designer (Plate Designer/Gel Designer/History/Guide), Degradation Explorer (Load Data/Table/DC50 vs Dmax/Properties/Guide), Helix (Genetic Code/Sequence Tools/Compare/Vector Library/Guide), Protein Tools (Properties/Cleavage/Structure/Target Intel/Guide), Spectra (A280/Ratios/Std Curve/Plate Reader/Guide) -- 31 tab icons total, several glyphs intentionally reused across apps for the same concept (table/grid, bar chart, dose-response curve, well-grid, open-book "Guide").
- Iceberg's 2 tab symbols (-80C, Liquid N2) upgraded from Unicode to SVG, matching the cross-suite convention. Its large illustrative empty-state icons (.ei class, separate from the .ti tab icons) were explicitly left untouched -- out of scope.
- Cuppa's 6 expense-category badges (Amazon/Coffee/Milk/Supermarket/Incoming/Other) upgraded from emoji to SVG, following Cuppa's OWN existing .dk-* drink-badge convention (22x22 box, 13px svg) rather than the cross-suite tab style, since they're not a tab bar -- per explicit user choice during mockup review. Flat solid color + a thin border per user feedback (gradient was tried first in mockups and rejected).
All 39 icon-level changes went through Visual Companion mockup review (5 batches) before implementation; full two-stage subagent review (spec-compliance + code-quality) per task.
hub-shell.html: version bump -> v1.1.8, changelog entry added.
```

- [ ] **Step 6: Commit and push**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html CLAUDE.md && git commit -m "Suite-wide icon redesign (Phase B2): bump Hub to v1.1.8" && git push
```

(`The Hub.html` is gitignored — confirm with `git status --short "The Hub.html"` first; if it shows as ignored, do not add it.)

- [ ] **Step 7: Report completion**

Summarize for the human: all 9 apps' icon work shipped, verification results from Steps 1-2 of this task plus each task's own Step verification, and confirm the push succeeded (per the user's standing "always push automatically" preference — no separate confirmation needed before this push).
