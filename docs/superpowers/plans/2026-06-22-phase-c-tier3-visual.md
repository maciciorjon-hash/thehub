# Phase C Tier 3: New Visual Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 3 fixes approved in `docs/superpowers/specs/2026-06-22-phase-c-tier3-visual-design.md` — guide-tab content icons across 6 apps, Protein Tools' Target Intel section grouping, and Cuppa's top-row visual-weight rebalance.

**Architecture:** Three independent work streams. The guide-icon stream touches 6 files but is the same mechanical pattern repeated per app (add `display:flex` to one CSS rule, prepend an inline SVG to each heading); the Target Intel and Cuppa streams are each a single, self-contained edit in their own file. All edits are additive CSS/markup changes with no JS logic changes except removing two inline `style=` overrides in Cuppa.

**Tech Stack:** Vanilla HTML/CSS/JS, single-file apps, no build step. Verification via Playwright (Node, headless Chromium), same pattern used throughout this project's prior rounds.

---

### Task 1: Lab Designer guide-section icons (`Plate_Designer/plate_designer.html`)

**Files:**
- Modify: `Plate_Designer/plate_designer.html`

- [ ] **Step 1: Add flex layout to the guide-section heading rule**

Find:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;}
```

Replace with:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:7px;}
.guide-section h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Add icons to all 4 headings**

Find:
```html
      <div class="guide-section">
        <h3>Selecting wells</h3>
```

Replace with:
```html
      <div class="guide-section">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="1" stroke-dasharray="3 3"/><rect x="3" y="4" width="3" height="3" fill="currentColor" stroke="none"/></svg>Selecting wells</h3>
```

Find:
```html
      <div class="guide-section">
        <h3>Assigning well types</h3>
```

Replace with:
```html
      <div class="guide-section">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><path d="M6 8v5h4v3"/><rect x="8" y="14" width="4" height="5" rx="1"/></svg>Assigning well types</h3>
```

Find:
```html
      <div class="guide-section">
        <h3>Labels and dilutions</h3>
```

Replace with:
```html
      <div class="guide-section">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H4v8l9 9 8-8z"/><circle cx="7" cy="7" r="1.3" fill="currentColor" stroke="none"/></svg>Labels and dilutions</h3>
```

Find:
```html
      <div class="guide-section">
        <h3>Export</h3>
```

Replace with:
```html
      <div class="guide-section">
        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>Export</h3>
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Plate_Designer/plate_designer.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-section h3 svg').count();
  await page.locator('.guide-panel').screenshot({ path: '/tmp/pd-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4`, `errors: []`. Read the screenshot — confirm all 4 headings show a small icon before the text, no clipping, no layout shift in the surrounding bullet lists.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Plate_Designer/plate_designer.html && git commit -m "Lab Designer: add icons to Guide tab section headings"
```

---

### Task 2: Degradation Explorer guide-card icons (`Degradation_Explorer/degradation_visualizer.html`)

**Files:**
- Modify: `Degradation_Explorer/degradation_visualizer.html`

- [ ] **Step 1: Add flex layout to the guide-card heading rule**

Find:
```css
.guide-card h3{font-size:13px;font-weight:700;color:var(--col1);margin-bottom:6px;}
```

Replace with:
```css
.guide-card h3{font-size:13px;font-weight:700;color:var(--col1);margin-bottom:6px;display:flex;align-items:center;gap:7px;}
.guide-card h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Add icons to all 4 headings, reusing this file's own tab icons verbatim**

Find:
```html
    <div class="guide-card">
      <h3>Load Data</h3>
```

Replace with:
```html
    <div class="guide-card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>Load Data</h3>
```

Find:
```html
    <div class="guide-card">
      <h3>Table</h3>
```

Replace with:
```html
    <div class="guide-card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></svg>Table</h3>
```

Find:
```html
    <div class="guide-card">
      <h3>DC50 vs Dmax</h3>
```

Replace with:
```html
    <div class="guide-card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>DC50 vs Dmax</h3>
```

Find:
```html
    <div class="guide-card">
      <h3>Properties</h3>
```

Replace with:
```html
    <div class="guide-card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="16" r="2.6"/><path d="M9 9.5l1 4M15 9.3l-1 4.5"/></svg>Properties</h3>
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Degradation_Explorer/degradation_visualizer.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-card h3 svg').count();
  await page.locator('#panel-guide').screenshot({ path: '/tmp/deg-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4`, `errors: []`. Read the screenshot to confirm icons render correctly and match this file's own tab-bar icons exactly.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Degradation_Explorer/degradation_visualizer.html && git commit -m "Degradation Explorer: add icons to Guide tab section headings, reusing the app's own tab glyphs"
```

---

### Task 3: Helix guide-card icons (`Helix/helix.html`)

**Files:**
- Modify: `Helix/helix.html`

- [ ] **Step 1: Add flex layout to the guide-card heading rule**

Find:
```css
.guide-card h3{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:6px;}
```

Replace with:
```css
.guide-card h3{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:6px;display:flex;align-items:center;gap:7px;}
.guide-card h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Add icons to all 4 headings, reusing this file's own tab icons verbatim**

Find:
```html
  <div class="guide-card">
    <h3>Genetic Code tab</h3>
```

Replace with:
```html
  <div class="guide-card">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 2c0 4 10 4 10 8s-10 4-10 8M17 2c0 4-10 4-10 8s10 4 10 8"/></svg>Genetic Code tab</h3>
```

Find:
```html
  <div class="guide-card">
    <h3>Sequence Tools tab</h3>
```

Replace with:
```html
  <div class="guide-card">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h4M9 6h12M3 12h10M15 12h6M3 18h7M12 18h9"/></svg>Sequence Tools tab</h3>
```

Find:
```html
  <div class="guide-card">
    <h3>Compare</h3>
```

Replace with:
```html
  <div class="guide-card">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h16M4 16h16"/><path d="M9 8v8M14 8v8"/><path d="M19 6l2 2-2 2M5 14l-2 2 2 2"/></svg>Compare</h3>
```

Find:
```html
  <div class="guide-card">
    <h3>Vector Library</h3>
```

Replace with:
```html
  <div class="guide-card">
    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M16 6.5a8 8 0 010 11"/><circle cx="12" cy="4" r="1.1" fill="currentColor" stroke="none"/></svg>Vector Library</h3>
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Helix/helix.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-card h3 svg').count();
  await page.locator('#panel-guide').screenshot({ path: '/tmp/helix-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4`, `errors: []`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Helix/helix.html && git commit -m "Helix: add icons to Guide tab section headings, reusing the app's own tab glyphs"
```

---

### Task 4: Spectra guide-section icons (`Spectra/spectra.html`)

**Files:**
- Modify: `Spectra/spectra.html`

- [ ] **Step 1: Add flex layout to the guide-section heading rule (preserving the existing border-bottom)**

Find:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;
  border-bottom:1px solid var(--border);padding-bottom:6px;}
```

Replace with:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;
  border-bottom:1px solid var(--border);padding-bottom:6px;display:flex;align-items:center;gap:7px;}
.guide-section h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Add icons to all 5 headings (4 reused from this file's own tabs, 1 new)**

Find:
```html
    <div class="guide-section">
      <h3>A280 — Beer-Lambert Law</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c3 4 6 7.5 6 11a6 6 0 01-12 0c0-3.5 3-7 6-11z"/></svg>A280 — Beer-Lambert Law</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Ratios — Nucleic Acid & Protein Purity</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/></svg>Ratios — Nucleic Acid & Protein Purity</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Standard Curve — BCA / Bradford / A280</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c4-10 8 6 12-4c2-5 4-2 6-2"/></svg>Standard Curve — BCA / Bradford / A280</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Plate Reader — 96-Well CSV Import</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate Reader — 96-Well CSV Import</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>General Tips</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11.2V16h6v-1.8A6 6 0 0012 3z"/></svg>General Tips</h3>
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Spectra/spectra.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-section h3 svg').count();
  await page.locator('#panel-guide').screenshot({ path: '/tmp/spectra-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 5`, `errors: []`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Spectra/spectra.html && git commit -m "Spectra: add icons to Guide tab section headings"
```

---

### Task 5: Protein Tools guide-section icons (`Protein_Tools/protein_tools.html`)

**Files:**
- Modify: `Protein_Tools/protein_tools.html`

- [ ] **Step 1: Add flex layout to the guide-section heading rule**

Find:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;}
```

Replace with:
```css
.guide-section h3{font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:7px;}
.guide-section h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Add icons to all 4 headings, reusing this file's own tab icons verbatim**

Find:
```html
    <div class="guide-section">
      <h3>Properties tab</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 5L5 19M7 5h4M5 7v4M17 19h-4M19 17v-4"/></svg>Properties tab</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Cleavage tab</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M20 20L11 11"/></svg>Cleavage tab</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Structure tab</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 3c4 2 8 2 8 6s-4 4-8 6M6 3v15"/></svg>Structure tab</h3>
```

Find:
```html
    <div class="guide-section">
      <h3>Target Intel tab</h3>
```

Replace with:
```html
    <div class="guide-section">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>Target Intel tab</h3>
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Protein_Tools/protein_tools.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-section h3 svg').count();
  await page.locator('#panel-guide').screenshot({ path: '/tmp/pt-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 4`, `errors: []`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Protein_Tools/protein_tools.html && git commit -m "Protein Tools: add icons to Guide tab section headings, reusing the app's own tab glyphs"
```

---

### Task 6: Echo guide-section icons — replace emoji with SVG (`Labcyte_Echo/labcyte_echo.html`)

**Files:**
- Modify: `Labcyte_Echo/labcyte_echo.html`

**Do not touch:** the `.guide-section h3` CSS rule itself — it already has `display:flex;align-items:center;gap:7px` (added in an earlier round). Only the markup (the 11 `<h3>` lines) needs to change.

- [ ] **Step 1: Add a `svg` sizing rule alongside the existing `.guide-section h3` rule**

Find:
```css
.guide-section h3{font-size:11px;font-weight:600;color:var(--text);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;letter-spacing:.8px;text-transform:uppercase;}
```

Replace with:
```css
.guide-section h3{font-size:11px;font-weight:600;color:var(--text);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;letter-spacing:.8px;text-transform:uppercase;}
.guide-section h3 svg{flex-shrink:0;width:15px;height:15px;}
```

- [ ] **Step 2: Replace all 11 emoji headings with SVG icons**

Find:
```html
          <h3>📁 Input files</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>Input files</h3>
```

Find:
```html
          <h3>⚙️ Parameters</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>Parameters</h3>
```

Find:
```html
          <h3>📊 Output values</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>Output values</h3>
```

Find:
```html
          <h3>🔬 Scatter &amp; Selectivity plots</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>Scatter &amp; Selectivity plots</h3>
```

Find:
```html
          <h3>📦 Box plot</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="9" width="12" height="7" rx="1"/><path d="M12 4v5M12 16v4"/></svg>Box plot</h3>
```

Find:
```html
          <h3>🎯 Selectivity plot</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>Selectivity plot</h3>
```

Find:
```html
          <h3>📊 Scatter tools</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>Scatter tools</h3>
```

Find:
```html
          <h3>📈 Curves tab</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c4-10 8 6 12-4c2-5 4-2 6-2"/></svg>Curves tab</h3>
```

Find:
```html
          <h3>🔬 Plate view</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>Plate view</h3>
```

Find:
```html
          <h3>🧪 Properties tab</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="16" r="2.6"/><path d="M9 9.5l1 4M15 9.3l-1 4.5"/></svg>Properties tab</h3>
```

Find:
```html
          <h3>💡 Tips</h3>
```

Replace with:
```html
          <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11.2V16h6v-1.8A6 6 0 0012 3z"/></svg>Tips</h3>
```

- [ ] **Step 3: Verify all emoji are gone and all 11 icons render**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const fs = require('fs');
const html = fs.readFileSync('Labcyte_Echo/labcyte_echo.html', 'utf8');
const emojiPattern = /<h3>[📁⚙️📊🔬📦🎯📈🧪💡]/u;
console.log(JSON.stringify({ anyEmojiLeftInH3: emojiPattern.test(html) }));
"
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labcyte_Echo/labcyte_echo.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchPanel('guide'));
  await page.waitForTimeout(200);
  const svgCount = await page.locator('.guide-section h3 svg').count();
  await page.locator('#guide-panel').screenshot({ path: '/tmp/echo-guide-icons.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `anyEmojiLeftInH3: false`, `svgCount: 11`, `errors: []`. If `switchPanel('guide')` is not the correct function name for this file, check the file for the actual guide-panel-opening function (search for `guide-panel` and `onclick=` near Echo's main nav) and use that instead — do not guess silently.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labcyte_Echo/labcyte_echo.html && git commit -m "Echo: replace emoji Guide-tab icons with SVG, matching the suite's icon convention"
```

---

### Task 7: Protein Tools Target Intel section grouping (`Protein_Tools/protein_tools.html`)

**Files:**
- Modify: `Protein_Tools/protein_tools.html`

**Context:** this is a separate feature area from Task 5 (Guide tab) in the same file — safe to run independently, different functions/markup.

- [ ] **Step 1: Add cluster wrapper CSS rules**

Find:
```css
.ti-section{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin:12px 0 6px;}
```

Replace with:
```css
.ti-section{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin:12px 0 6px;}
.ti-cluster-identity{border-left:2px solid var(--accent);padding-left:10px;}
.ti-cluster-identity .ti-section{color:var(--accent);}
.ti-cluster-other{border-left:2px solid var(--accent2);padding-left:10px;}
.ti-cluster-other .ti-section{color:var(--accent2);}
```

- [ ] **Step 2: Wrap the Identity column's content in the identity cluster**

Find:
```html
        <div class="ti-col">
          <div class="ti-section">Identity</div>
          <div class="ti-prop"><span class="ti-prop-label">Gene</span><span class="ti-prop-val"><strong>${geneName}</strong></span></div>
          <div class="ti-prop"><span class="ti-prop-label">UniProt</span><span class="ti-prop-val"><a href="https://www.uniprot.org/uniprot/${acc}" target="_blank" style="color:var(--accent)">${acc}</a></span></div>
          <div class="ti-prop"><span class="ti-prop-label">Length</span><span class="ti-prop-val">${length} aa</span></div>
          ${chemblTargetId?`<div class="ti-prop"><span class="ti-prop-label">ChEMBL</span><span class="ti-prop-val"><a href="https://www.ebi.ac.uk/chembl/target_report_card/${chemblTargetId}/" target="_blank" style="color:var(--accent)">${chemblTargetId}</a></span></div>`:''}
          ${diseases.length?`<div class="ti-prop"><span class="ti-prop-label">Diseases</span><span class="ti-prop-val">${diseases.slice(0,3).join(', ')}${diseases.length>3?' …':''}</span></div>`:''}
          ${fnHtml}
        </div>
        <div class="ti-col">
          <div class="ti-section">Drugs &amp; mechanisms</div>
          ${mecHtml}
          <div class="ti-section">Top disease associations</div>
          ${otHtml}
        </div>
      </div>
      <div class="ti-section">Structures (PDB)</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${pdbHtml}</div>
      ${stringId?`<div class="ti-section">Network</div><a href="https://string-db.org/network/${stringId}" target="_blank" class="ti-link">STRING interaction network ↗</a>`:''}
      <div class="ti-section">Links</div>
      <div class="ti-links">
```

Replace with:
```html
        <div class="ti-col ti-cluster-identity">
          <div class="ti-section">Identity</div>
          <div class="ti-prop"><span class="ti-prop-label">Gene</span><span class="ti-prop-val"><strong>${geneName}</strong></span></div>
          <div class="ti-prop"><span class="ti-prop-label">UniProt</span><span class="ti-prop-val"><a href="https://www.uniprot.org/uniprot/${acc}" target="_blank" style="color:var(--accent)">${acc}</a></span></div>
          <div class="ti-prop"><span class="ti-prop-label">Length</span><span class="ti-prop-val">${length} aa</span></div>
          ${chemblTargetId?`<div class="ti-prop"><span class="ti-prop-label">ChEMBL</span><span class="ti-prop-val"><a href="https://www.ebi.ac.uk/chembl/target_report_card/${chemblTargetId}/" target="_blank" style="color:var(--accent)">${chemblTargetId}</a></span></div>`:''}
          ${diseases.length?`<div class="ti-prop"><span class="ti-prop-label">Diseases</span><span class="ti-prop-val">${diseases.slice(0,3).join(', ')}${diseases.length>3?' …':''}</span></div>`:''}
          ${fnHtml}
        </div>
        <div class="ti-col ti-cluster-other">
          <div class="ti-section">Drugs &amp; mechanisms</div>
          ${mecHtml}
          <div class="ti-section">Top disease associations</div>
          ${otHtml}
        </div>
      </div>
      <div class="ti-cluster-other">
        <div class="ti-section">Structures (PDB)</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${pdbHtml}</div>
        ${stringId?`<div class="ti-section">Network</div><a href="https://string-db.org/network/${stringId}" target="_blank" class="ti-link">STRING interaction network ↗</a>`:''}
        <div class="ti-section">Links</div>
        <div class="ti-links">
```

- [ ] **Step 3: Close the new wrapping div before the final `</div>` of the card**

Find:
```html
        <a href="https://platform.opentargets.org/target/${geneName}" target="_blank" class="ti-link">Open Targets ↗</a>
      </div>
    </div>`;
```

Replace with:
```html
        <a href="https://platform.opentargets.org/target/${geneName}" target="_blank" class="ti-link">Open Targets ↗</a>
      </div>
      </div>
    </div>`;
```

- [ ] **Step 4: Verify (use real test data — the Target Intel tab makes live external API calls, so seed it directly via JS rather than waiting on network)**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1000, height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Protein_Tools/protein_tools.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => switchTab('ti'));
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const res = document.getElementById('ti-results') || document.querySelector('#panel-ti [id*=res]') || document.querySelector('#panel-ti');
    res.innerHTML = '<div class=\"ti-card\"><div class=\"ti-name\">Test</div><div class=\"ti-org\">Homo sapiens</div><div class=\"ti-cols\">'
      + '<div class=\"ti-col ti-cluster-identity\"><div class=\"ti-section\">Identity</div><div class=\"ti-prop\">Gene</div></div>'
      + '<div class=\"ti-col ti-cluster-other\"><div class=\"ti-section\">Drugs &amp; mechanisms</div><div>x</div><div class=\"ti-section\">Top disease associations</div><div>y</div></div>'
      + '</div><div class=\"ti-cluster-other\"><div class=\"ti-section\">Structures (PDB)</div><div>z</div><div class=\"ti-section\">Links</div><div>w</div></div></div>';
  });
  await page.waitForTimeout(100);
  const identityBorder = await page.locator('.ti-cluster-identity').first().evaluate(el => getComputedStyle(el).borderLeftColor);
  const otherBorder = await page.locator('.ti-cluster-other').first().evaluate(el => getComputedStyle(el).borderLeftColor);
  await page.locator('.ti-card').screenshot({ path: '/tmp/pt-ti-clusters.png' });
  console.log(JSON.stringify({ identityBorder, otherBorder, errors }));
  await browser.close();
})();
"
```

Expected: `identityBorder` and `otherBorder` are two different, real color values (not equal, not transparent), `errors: []`. If the script's `document.getElementById('ti-results')` selector doesn't match this file's actual results container ID, inspect the file for the real container (search for where `res.innerHTML` is assigned in the Target Intel lookup function) and use that ID instead. Read the screenshot to confirm the two clusters visually separate with different-colored left borders.

- [ ] **Step 5: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Protein_Tools/protein_tools.html && git commit -m "Protein Tools: group Target Intel sections into Identity / everything-else clusters with left-border accents"
```

---

### Task 8: Cuppa top-row visual weight rebalance (`Cuppa/cuppa.html`)

**Files:**
- Modify: `Cuppa/cuppa.html`

- [ ] **Step 1: Change the progress-bar base CSS from white-on-gradient to a plain-card-appropriate look**

Find:
```css
.stat-progress{height:4px;background:rgba(255,255,255,.22);border-radius:2px;margin:12px 0 6px;overflow:hidden;}
.stat-progress-fill{height:100%;background:rgba(255,255,255,.75);border-radius:2px;transition:width .5s cubic-bezier(.4,0,.2,1);}
```

Replace with:
```css
.stat-progress{height:4px;background:var(--surface3);border-radius:2px;margin:12px 0 6px;overflow:hidden;}
.stat-progress-fill{height:100%;background:var(--accent);border-radius:2px;transition:width .5s cubic-bezier(.4,0,.2,1);}
```

(Confirmed via `grep -n "stat-progress"` that this selector is used in exactly one place in the file — the card this task is changing — so this is safe to edit directly rather than needing a new scoped class.)

- [ ] **Step 2: Remove the `feature` class and the white-on-gradient inline style overrides**

Find:
```html
  var smEl = document.getElementById('stat-month');
  if (smEl) smEl.innerHTML =
    '<div class="stat-card feature" style="height:100%;box-sizing:border-box;">'
    +   '<div class="stat-lbl">'+currentMonth+' '+currentYear+'</div>'
    +   '<div class="stat-val">£'+collected.toFixed(2)+'</div>'
    +   '<div class="stat-progress"><div class="stat-progress-fill" style="width:'+pct+'%"></div></div>'
    +   '<div class="stat-sub">£'+expected.toFixed(2)+' expected &middot; '+pct+'% in</div>'
    +   '<div class="stat-divider" style="background:rgba(255,255,255,.18);"></div>'
    +   '<div class="stat-mini-lbl" style="color:rgba(255,255,255,.7);">Year to date</div>'
    +   '<div style="font-size:15px;font-weight:700;color:#fff;letter-spacing:-.3px;">£'+collectedYear.toFixed(2)+'</div>'
    + '</div>';
```

Replace with:
```html
  var smEl = document.getElementById('stat-month');
  if (smEl) smEl.innerHTML =
    '<div class="stat-card" style="height:100%;box-sizing:border-box;">'
    +   '<div class="stat-lbl">'+currentMonth+' '+currentYear+'</div>'
    +   '<div class="stat-val">£'+collected.toFixed(2)+'</div>'
    +   '<div class="stat-progress"><div class="stat-progress-fill" style="width:'+pct+'%"></div></div>'
    +   '<div class="stat-sub">£'+expected.toFixed(2)+' expected &middot; '+pct+'% in</div>'
    +   '<div class="stat-divider"></div>'
    +   '<div class="stat-mini-lbl">Year to date</div>'
    +   '<div style="font-size:15px;font-weight:700;color:var(--text);letter-spacing:-.3px;">£'+collectedYear.toFixed(2)+'</div>'
    + '</div>';
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:1300, height:1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Cuppa/cuppa.html');
  await page.waitForTimeout(1200);
  const monthCardClass = await page.locator('#stat-month .stat-card').getAttribute('class');
  const monthBg = await page.locator('#stat-month .stat-card').evaluate(el => getComputedStyle(el).background);
  const welcomeBg = await page.locator('.welcome-card').evaluate(el => getComputedStyle(el).backgroundImage);
  const ytdValColor = await page.locator('#stat-month .stat-card > div').nth(6).evaluate(el => getComputedStyle(el).color);
  await page.locator('.top-row, .welcome-card').first().screenshot({ path: '/tmp/cuppa-toprow-fixed.png' }).catch(async()=>{ await page.locator('body').screenshot({ path: '/tmp/cuppa-toprow-fixed.png' }); });
  console.log(JSON.stringify({ monthCardClass, monthBg, welcomeBgHasGradient: /gradient/.test(welcomeBg), ytdValColor, errors }));
  await browser.close();
})();
"
```

Expected: `monthCardClass` is `"stat-card"` (no `feature`), `monthBg` does NOT contain `gradient` (plain background now), `welcomeBgHasGradient: true` (Welcome card is unchanged, still gradient), `ytdValColor` is a real dark/text color (not `rgb(255, 255, 255)`), `errors: []`. Read the screenshot — confirm the Welcome card is the only bold/gradient card, and the other two now look like a matched pair.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Cuppa/cuppa.html && git commit -m "Cuppa: rebalance top-row visual weight so only the Welcome card carries the bold gradient"
```

---

### Task 9: Final verification, version bump, changelog, session log

**Files:**
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check on all 7 touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in Plate_Designer/plate_designer.html Degradation_Explorer/degradation_visualizer.html Helix/helix.html Spectra/spectra.html Protein_Tools/protein_tools.html Labcyte_Echo/labcyte_echo.html Cuppa/cuppa.html; do
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

Expected: `balanced: True` for all 7 files. (Task 7 deliberately added one extra opening `<div class="ti-cluster-other">` and one matching extra `</div>` — if this file shows an imbalance, re-check that Task 7's Step 3 closing-div edit was applied.)

- [ ] **Step 2: JS syntax check on all 7 touched files**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && for f in Plate_Designer/plate_designer.html Degradation_Explorer/degradation_visualizer.html Helix/helix.html Spectra/spectra.html Protein_Tools/protein_tools.html Labcyte_Echo/labcyte_echo.html Cuppa/cuppa.html; do
  node -e "
const fs = require('fs');
const html = fs.readFileSync('$f', 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let m, i=0, ok=true;
while ((m = re.exec(html))) { i++; if (/gstatic\.com/.test(m[0])) continue; try { new Function(m[1]); } catch(e) { ok=false; console.log('$f Block', i, 'FAILED:', e.message); } }
console.log('$f', 'script blocks:', i, 'all ok:', ok);
"
done
```

Expected: `all ok: true` for all 7 files.

If either check fails for any file, STOP and report back — do not attempt fixes yourself, this is unexpected given each file's task was already individually verified.

- [ ] **Step 3: Bump the Hub version and add a changelog entry**

First check the CURRENT version in `hub-shell.html` (it may have moved past v1.2.1 — use the actual current value and bump the patch number by one).

Find in `hub-shell.html`:
```html
    <span class="opts-version">The Hub &middot; v1.2.1</span>
```

Replace with (adjusted to the real current version + 1):
```html
    <span class="opts-version">The Hub &middot; v1.2.2</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.2.1 &mdash; 22 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.2.2 &mdash; 22 Jun 2026</strong><br>
    &#9679; New visual touches: icons on every app's Guide tab, a clearer Target Intel layout in Protein Tools, and a rebalanced Cuppa top row<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.2.1 &mdash; 22 Jun 2026</strong><br>
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
Last session: [TODAY'S ACTUAL DATE] (Round 93: Phase C Tier 3 -- new visual components; v1.2.2)
Hub apps: 11. Version v1.2.2.
Final tier of Phase C (see Round 88-92 for Phases A/B1/B2 and Tiers 1-2). The original 6-item, 4-app backlog was checked against the live code before designing anything -- several items didn't hold up as originally framed:
- Lab Designer's .gd-preview-wrap hardcoded background turned out to already be fixed (Round 58) -- dropped.
- Lab Designer's .hist-card already had a color+text pill distinguishing Plate/Gel entries, not fully undifferentiated as the backlog implied -- an icon-in-pill upgrade was mocked up via Visual Companion and explicitly rejected; left as-is.
- Protein Tools' "Function/Mechanism/Disease" framing for .ti-card didn't match the real card -- actual sections are Identity, Drugs & mechanisms, Top disease associations, Structures (PDB), Network, Links (6, not 3) -- redesigned around the real content.
- Cuppa's "stat-card vs welcome-card" framing wasn't a clean two-category split -- the Welcome card AND the first stat card both already had the bold gradient treatment, the second stat card was plain. A 2-bold-vs-1-plain imbalance, not a category mismatch.
One item not in the original backlog was folded in after investigation: every app's Guide tab content (not just Lab Designer's and Degradation Explorer's, as originally flagged) has the same flat heading-plus-paragraph pattern with no icon -- Echo was the one partial exception, using raw emoji baked into the heading text rather than the SVG convention the rest of the suite settled on during Phase B2.
Final shipped scope -- 3 fixes across 7 files:
- Guide-tab content icons added across Lab Designer, Degradation Explorer, Helix, Spectra, Protein Tools (4 each) and Echo (11, replacing emoji). Icon style: inline, inherits the heading's text color via stroke=currentColor -- matches Phase B2's tab-icon convention, not the Hub home-card's bordered-box convention (reviewed and chosen via Visual Companion). The vast majority of icons are reused verbatim from each app's own existing tab-bar glyphs (since most Guide headings are literally named after that app's own tabs); only Lab Designer's 4 workflow-step headings and a handful of Echo's results-area headings needed new glyphs, since B2 never touched Echo's results tabs, only its setup-modal tabs.
- Protein_Tools/protein_tools.html: Target Intel's 6 sections grouped into 2 left-border-accent clusters -- Identity standalone (purple, var(--accent)), everything else combined (blue, var(--accent2)). A 3-cluster version was mocked up first and rejected in favor of this simpler 2-cluster split.
- Cuppa/cuppa.html: removed the bold gradient ("feature" class) from the "June 2026" stat card so only the Welcome card carries it; the two stat cards now read as a matched plain pair instead of one randomly outweighing the other. Required also fixing the progress-bar/divider/year-to-date sub-elements, which had inline white-on-gradient styling that would otherwise have gone invisible (white-on-white) once the gradient was removed.
Reviewed via Visual Companion across 4 mockup rounds (icon style, history-card chip, Target Intel grouping x2 iterations, Cuppa weight rebalance) plus direct technical investigation for the scope-correction items.
Full design rationale in docs/superpowers/specs/2026-06-22-phase-c-tier3-visual-design.md, plan in docs/superpowers/plans/2026-06-22-phase-c-tier3-visual.md.
This closes out Phase C and the larger suite-wide audit plan (Phases A/B1/B2/C, started Round 88).
```

- [ ] **Step 6: Commit and push**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git status --short "The Hub.html"
```

(`The Hub.html` is gitignored — confirm it does not show as a trackable change; if it shows as ignored or doesn't appear, proceed. Do not add it.)

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html CLAUDE.md && git commit -m "Phase C Tier 3 (new visual components): bump Hub to v1.2.2" && git push
```

- [ ] **Step 7: Report completion**

Summarize: all 3 fixes shipped (guide icons across 6 apps, Target Intel grouping, Cuppa rebalance), verification results from each task plus Steps 1-2 of this task, embed.py rebuild result, and confirm the push succeeded.
