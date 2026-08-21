# LabMate Post-Redesign Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Cell Biology's 10 embedded cell-line cross-links into their own nested sub-panel, and replace LabMate's 9 mobile-home-grid section icons (solid color + text abbreviation) with line-icon pictograms (white/tinted background + colored border + SVG glyph).

**Architecture:** Both changes reuse infrastructure already built in the prior redesign — `renderToolGrid()` for the new sub-panel's grid, the existing `.proto-entry`/`showProto`/`showProtoHome`/`toggleProto` panel mechanics for the new nested page, and the file's existing `.dark, [data-theme="dark"]` selector convention for the icons' dark-mode variant. No new JS functions are introduced.

**Tech Stack:** Vanilla HTML/CSS/JS (single file: `Labmate/labmate.html`), inline SVG icons, Playwright for verification (`chromium.launch({channel:'chrome', headless:true})`).

---

### Task 1: Move Cell Biology's 10 cell-line tiles into a "Cell Lines" sub-panel

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** `TOOLS_cellbio` currently has 18 entries (8 protocol tools + 10 cell-line cross-links) rendering flat into one grid. The 10 cell-line entries move into a single nested "Cell Lines" sub-panel, reached via one new tile, so Cell Biology's main grid shows 9 entries instead of 18.

- [ ] **Step 1: Replace `TOOLS_cellbio`'s 10 cell-line entries with 1 "Cell Lines" entry**

Find this exact block (the full current `TOOLS_cellbio` array):
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

Replace with:
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
  { title: 'Cell Lines', badge: '10', desc: '10 reference entries — tissue, ATCC code, culture notes.', open: function(){ showProto('cellbio', 'proto-celllines-list'); } }
];
```

The new "Cell Lines" entry inside `TOOLS_cellbio` uses badge `'10'` and will render with `tileColorClass: 'tile-cellbio'` like its siblings (set in Step 3) — that's correct and matches the established one-color-per-section convention for the *main* grid. The sub-panel's own 10 tiles (added in Step 5) get the distinct gray `tile-celllines` color instead, visually flagging that grid as reference content rather than a protocol.

- [ ] **Step 2: Replace the hardcoded `#cellbio-home` div — no change needed here**

`#cellbio-home` is already the empty `<div class="proto-home" id="cellbio-home"></div>` from the prior redesign (Task 6) — `renderToolGrid` populates it from `TOOLS_cellbio` automatically. No edit needed for this div itself.

- [ ] **Step 3: Confirm the existing aggregator call for `cellbio-home` needs no change**

Find (should already exist, unchanged):
```js
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
```

No edit here — `TOOLS_cellbio` now has 9 entries instead of 18, but the render call itself is unchanged (it just renders whatever's in the array).

- [ ] **Step 4: Add a new aggregator call for the sub-panel's grid**

Find:
```js
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
```

Replace with:
```js
  renderToolGrid('cellbio-home', TOOLS_cellbio, { tileColorClass: 'tile-cellbio', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
  renderToolGrid('cellbio-celllines-sublist', TOOLS_cellbio_celllines, { tileColorClass: 'tile-celllines', gridClass: 'proto-home', cardClass: 'proto-home-card', titleClass: 'proto-home-title', subClass: 'proto-home-sub' });
```

- [ ] **Step 5: Add the new `TOOLS_cellbio_celllines` array to the early anchor chain**

Following the same hoisting rule established throughout the prior redesign — every `TOOLS_*` array must be declared before the point where `_lmRenderAllToolGrids()` first executes at page load — anchor this new array on the current front of the chain.

Find:
```js
var TOOLS_assays = [
```

Insert immediately BEFORE that line:
```js
var TOOLS_cellbio_celllines = [
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

- [ ] **Step 6: Add the new `#proto-celllines-list` panel HTML inside `sec-cellbio`**

Find this exact block (the closing of the last protocol entry in Cell Biology, `proto-transfection`, followed immediately by the section's own closing tag):
```html
        <div id="tf-result" style="margin-top:18px"></div>
      </div>
    </div>
  </div>
</div><!-- end sec-cellbio -->
```

Replace with:
```html
        <div id="tf-result" style="margin-top:18px"></div>
      </div>
    </div>
  </div>

  <!-- Cell Lines sub-panel -->
  <div class="proto-entry proto-gated" id="proto-celllines-list">
    <button class="proto-back-btn" onclick="showProtoHome('cellbio')">← Cell Biology</button>
    <div class="proto-header" onclick="toggleProto('proto-celllines-list')">
      <span class="proto-title">Cell Lines</span>
      <span class="proto-date">—</span>
      <span class="proto-chevron">▶</span>
    </div>
    <div class="proto-body">
      <div class="proto-home" id="cellbio-celllines-sublist"></div>
    </div>
  </div>
</div><!-- end sec-cellbio -->
```

This follows the exact same `.proto-entry.proto-gated` + `.proto-header`/`.proto-chevron` (clickable, `toggleProto`) + `.proto-body` structure as every other protocol entry in this section (e.g. `#proto-bca`) — `showProto('cellbio', 'proto-celllines-list')` (called from the new tile's `open` callback) will show this entry exactly like any other, including the `.lm-detail-page` slide-in and the `.open` class that reveals `.proto-body`. `#cellbio-celllines-sublist` is the container `renderToolGrid` populates (Step 4).

- [ ] **Step 7: Verify — Cell Biology's main grid now shows 9 tiles, "Cell Lines" opens the sub-panel with 10 tiles, tapping one reaches the real cell-line detail, back navigation works at both levels**

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
  const mainTileCount = await page.locator('#cellbio-home .lm-tile').count();

  await page.locator('#cellbio-home .lm-tile', { hasText: 'Cell Lines' }).click();
  await page.waitForTimeout(400);
  const subTileCount = await page.locator('#cellbio-celllines-sublist .lm-tile').count();
  const subBackText = await page.locator('#proto-celllines-list .proto-back-btn').textContent();

  await page.locator('#cellbio-celllines-sublist .lm-tile', { hasText: 'A549' }).click();
  await page.waitForTimeout(400);
  const onCellLinesSection = await page.evaluate(() => getComputedStyle(document.getElementById('sec-celllines')).display !== 'none');

  console.log(JSON.stringify({ mainTileCount, subTileCount, subBackText, onCellLinesSection, errors }));
  await browser.close();
})();
"
```

Expected: `mainTileCount: 9`, `subTileCount: 10`, `subBackText: \"← Cell Biology\"`, `onCellLinesSection: true`. `errors` may include the known, pre-existing, unrelated `pinfo-tip` null-style error — not a regression.

- [ ] **Step 8: Verify the sub-panel's own back button returns to Cell Biology's 9-tile grid, not all the way to LabMate home**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage({viewport:{width:390, height:800}});
  await page.goto('file:///Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html');
  await page.waitForTimeout(300);
  await page.locator('.mob-grid-item', { hasText: 'Cell Biology' }).click();
  await page.waitForTimeout(300);
  await page.locator('#cellbio-home .lm-tile', { hasText: 'Cell Lines' }).click();
  await page.waitForTimeout(400);
  await page.locator('#proto-celllines-list .proto-back-btn').click();
  await page.waitForTimeout(300);
  const backToMainGrid = await page.locator('#cellbio-home .lm-tile').count();
  const stillInCellBio = await page.evaluate(() => getComputedStyle(document.getElementById('sec-cellbio')).display !== 'none');
  console.log(JSON.stringify({ backToMainGrid, stillInCellBio }));
  await browser.close();
})();
"
```

Expected: `backToMainGrid: 9`, `stillInCellBio: true`.

- [ ] **Step 9: Desktop regression check**

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
  await page.locator('#cellbio-home .proto-home-card', { hasText: 'Cell Lines' }).click();
  await page.waitForTimeout(300);
  const subCardCount = await page.locator('#cellbio-celllines-sublist .proto-home-card').count();
  console.log(JSON.stringify({ cardCount, subCardCount }));
  await browser.close();
})();
"
```

Expected: `cardCount: 9`, `subCardCount: 10`.

- [ ] **Step 10: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: move Cell Biology's 10 cell-line cross-links into a nested Cell Lines sub-panel"
```

---

### Task 2: Replace the 9 mobile-home-grid section icons with line pictograms

**Files:**
- Modify: `Labmate/labmate.html`

**Why:** Confirmed via full-file search that these 9 `.lm-icon-*` classes each appear in exactly one HTML location — `#mob-home`'s grid (desktop nav/sidebar are plain text, unaffected). Replacing solid-color-square-with-abbreviation with white/tinted-background + colored border + SVG line glyph, per the approved visual-companion direction (Option B + dark-mode tint).

**Important:** there are several OTHER `.lm-icon-*` CSS rules in this same stylesheet block for sections that no longer exist (`lm-icon-protac`, `lm-icon-reference`, `lm-icon-tools`, `lm-icon-ref-ov`, `lm-icon-ref-tbl`, `lm-icon-ref-kits`, `lm-icon-tools-ov`, `lm-icon-timer-ic`, `lm-icon-planner-ic`) interspersed between the 9 you're touching. These are pre-existing dead code, **out of scope** — do not remove or modify them. Each step below has a precise, individually-anchored find/replace specifically to avoid touching these unrelated dead rules.

- [ ] **Step 1: Add a shared sizing rule for the new inline SVG icons**

Find:
```css
.lm-icon {
  flex-shrink: 0; width: 44px; height: 44px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  transition: transform 0.12s ease, filter 0.1s ease;
}
```

Replace with:
```css
.lm-icon {
  flex-shrink: 0; width: 44px; height: 44px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  transition: transform 0.12s ease, filter 0.1s ease;
}
.lm-icon svg { width: 22px; height: 22px; flex-shrink: 0; }
```

- [ ] **Step 2: Favourites icon — CSS**

Find:
```css
.lm-icon-favs { background: #d17a00; }
.lm-icon-favs::before { content: '\2605'; font-size: 20px; color: #fff; }
```

Replace with:
```css
.lm-icon-favs { background: var(--surface); border: 1.5px solid #e0a85c; color: #e0a85c; }
.dark .lm-icon-favs, [data-theme="dark"] .lm-icon-favs { background: rgba(224,168,92,0.16); }
```

- [ ] **Step 3: Favourites icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-favs"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-favs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5.5 6 .7-4.4 4 1.2 5.9L12 16l-5.3 3.1 1.2-5.9-4.4-4 6-.7z"/></svg></div>
```

- [ ] **Step 4: Calculators icon — CSS**

Find:
```css
/* Calculators — blue, f(x) */
.lm-icon-calc { background: #0079b9; }
.lm-icon-calc::before { content: 'f(x)'; font-family: var(--mono); font-size: 10px; font-weight: 700; color: #fff; }
```

Replace with:
```css
/* Calculators — blue, calculator pictogram */
.lm-icon-calc { background: var(--surface); border: 1.5px solid #6fa8c9; color: #6fa8c9; }
.dark .lm-icon-calc, [data-theme="dark"] .lm-icon-calc { background: rgba(111,168,201,0.16); }
```

- [ ] **Step 5: Calculators icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-calc"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-calc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h2M11 9h2M15 9h2M7 13h2M11 13h2M15 13h6M7 17h10"/></svg></div>
```

- [ ] **Step 6: Mol Biology icon — CSS**

Find:
```css
/* Mol Biology — green, bp */
.lm-icon-molbio { background: #2d7a38; }
.lm-icon-molbio::before { content: 'bp'; font-family: var(--mono); font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
```

Replace with:
```css
/* Mol Biology — green, DNA helix pictogram */
.lm-icon-molbio { background: var(--surface); border: 1.5px solid #7fb88a; color: #7fb88a; }
.dark .lm-icon-molbio, [data-theme="dark"] .lm-icon-molbio { background: rgba(127,184,138,0.16); }
```

- [ ] **Step 7: Mol Biology icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-molbio"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-molbio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2c0 4 10 4 10 8s-10 4-10 8M17 2c0 4-10 4-10 8s10 4 10 8"/></svg></div>
```

- [ ] **Step 8: Cell Biology icon — CSS**

Find:
```css
/* Cell Biology — pink, nucleus-in-cell (concentric circles) */
.lm-icon-cellbio {
  background: #b5175a;
  background-image:
    radial-gradient(circle 7px at center, rgba(255,255,255,0.9) 100%, transparent 100%),
    radial-gradient(circle at center, transparent 11px, rgba(255,255,255,0.28) 11px, rgba(255,255,255,0.28) 14px, transparent 14px);
}
```

Replace with:
```css
/* Cell Biology — pink, petri dish pictogram */
.lm-icon-cellbio { background: var(--surface); border: 1.5px solid #d98fae; color: #d98fae; }
.dark .lm-icon-cellbio, [data-theme="dark"] .lm-icon-cellbio { background: rgba(217,143,174,0.16); }
```

- [ ] **Step 9: Cell Biology icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-cellbio"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-cellbio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><circle cx="9" cy="11" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="9" r="0.8" fill="currentColor" stroke="none"/></svg></div>
```

- [ ] **Step 10: CRISPR icon — CSS**

Find:
```css
/* CRISPR — violet, scissors */
.lm-icon-crispr { background: #6d28d9; }
.lm-icon-crispr::before { content: '\2702'; font-size: 18px; color: #fff; }
```

Replace with:
```css
/* CRISPR — violet, scissors pictogram */
.lm-icon-crispr { background: var(--surface); border: 1.5px solid #a78bd6; color: #a78bd6; }
.dark .lm-icon-crispr, [data-theme="dark"] .lm-icon-crispr { background: rgba(167,139,214,0.16); }
```

- [ ] **Step 11: CRISPR icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-crispr"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-crispr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M20 20L11 11"/></svg></div>
```

- [ ] **Step 12: Proteomics icon — CSS**

Find:
```css
/* Proteomics — teal, MW */
.lm-icon-proteomics { background: #0277bd; }
.lm-icon-proteomics::before { content: 'MW'; font-family: var(--mono); font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
```

Replace with:
```css
/* Proteomics — teal, protein pictogram */
.lm-icon-proteomics { background: var(--surface); border: 1.5px solid #7ab0c9; color: #7ab0c9; }
.dark .lm-icon-proteomics, [data-theme="dark"] .lm-icon-proteomics { background: rgba(122,176,201,0.16); }
```

- [ ] **Step 13: Proteomics icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-proteomics"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-proteomics"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="8" r="2.6"/><circle cx="17" cy="8" r="2.2"/><circle cx="12" cy="17" r="3"/><path d="M9.3 9.5L10.5 14M14.8 9.3L13.2 14.5"/></svg></div>
```

- [ ] **Step 14: Biophysics/Assays icon — CSS**

Find:
```css
/* Biophysics/Assays — red, Kd */
.lm-icon-assays { background: #c62828; }
.lm-icon-assays::before { content: 'Kd'; font-family: var(--mono); font-size: 13px; font-style: italic; font-weight: 600; color: #fff; }
```

Replace with:
```css
/* Biophysics/Assays — red, binding-curve pictogram */
.lm-icon-assays { background: var(--surface); border: 1.5px solid #d98080; color: #d98080; }
.dark .lm-icon-assays, [data-theme="dark"] .lm-icon-assays { background: rgba(217,128,128,0.16); }
```

- [ ] **Step 15: Biophysics/Assays icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-assays"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-assays"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16a9 9 0 0118 0"/><path d="M12 16L17 9"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg></div>
```

- [ ] **Step 16: Struct Bio icon — CSS**

Find:
```css
/* Struct Bio — deep purple, PDB */
.lm-icon-structbio { background: #4527a0; }
.lm-icon-structbio::before { content: 'PDB'; font-family: var(--mono); font-size: 10px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
```

Replace with:
```css
/* Struct Bio — deep purple, ribbon pictogram */
.lm-icon-structbio { background: var(--surface); border: 1.5px solid #9a8bc4; color: #9a8bc4; }
.dark .lm-icon-structbio, [data-theme="dark"] .lm-icon-structbio { background: rgba(154,139,196,0.16); }
```

- [ ] **Step 17: Struct Bio icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-structbio"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-structbio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3c4 2 8 2 8 6s-4 4-8 6M6 3v15"/></svg></div>
```

- [ ] **Step 18: Genomics icon — CSS**

Find:
```css
.lm-icon-genomics { background: #c2185b; }
.lm-icon-genomics::before { content: 'NGS'; font-family: var(--mono); font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.95); letter-spacing: 0.5px; }
```

Replace with:
```css
/* Genomics — rose, sequencing-ladder pictogram */
.lm-icon-genomics { background: var(--surface); border: 1.5px solid #d189a8; color: #d189a8; }
.dark .lm-icon-genomics, [data-theme="dark"] .lm-icon-genomics { background: rgba(209,137,168,0.16); }
```

- [ ] **Step 19: Genomics icon — HTML**

Find:
```html
      <div class="lm-icon lm-icon-genomics"></div>
```

Replace with:
```html
      <div class="lm-icon lm-icon-genomics"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h4M9 6h12M3 12h10M15 12h6M3 18h7M12 18h9"/></svg></div>
```

- [ ] **Step 20: Verify all 9 icons render their new SVG, in both themes, with no console errors**

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
  const svgCount = await page.locator('#mob-home .lm-icon svg').count();
  await page.screenshot({ path: '/tmp/lm_icons_light.png' });
  await page.evaluate(() => { document.getElementById('theme-toggle-chk').click(); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/lm_icons_dark.png' });
  console.log(JSON.stringify({ svgCount, errors }));
  await browser.close();
})();
"
```

Expected: `svgCount: 9`. Read both `/tmp/lm_icons_light.png` and `/tmp/lm_icons_dark.png` and confirm: each icon shows a visible line-drawn glyph (not a blank square), legible border/stroke contrast in both themes, no layout overflow or clipped icons. `errors` may include the known pre-existing `pinfo-tip` issue — not a regression.

- [ ] **Step 21: Confirm dead/unrelated icon classes were not touched**

```bash
grep -n "lm-icon-protac\|lm-icon-reference\|lm-icon-tools \|lm-icon-ref-ov\|lm-icon-ref-tbl\|lm-icon-ref-kits\|lm-icon-tools-ov\|lm-icon-timer-ic\|lm-icon-planner-ic" "/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html"
```

Expected: these 9 dead classes still present, completely unchanged (still using their original `background`/`::before` form) — confirms Task 2's individually-anchored edits didn't accidentally touch the interspersed unrelated CSS.

- [ ] **Step 22: Desktop regression check (icons don't appear there, so nothing should change)**

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
  const navCount = await page.locator('.nav-btn').count();
  console.log(JSON.stringify({ navCount, errors }));
  await browser.close();
})();
"
```

Expected: `navCount` unchanged from before this task (desktop nav is plain text buttons, untouched by this task), `errors` only the known pre-existing issue if any.

- [ ] **Step 23: Commit**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add Labmate/labmate.html && git commit -m "LabMate: replace 9 mobile-home section icons with line-pictogram style"
```

---

### Task 3: Final verification, version bump, changelog, session log

**Files:**
- Modify: `hub-shell.html` (version bump + changelog)
- Modify: `CLAUDE.md` (session log)
- Run: `python3 embed.py` (rebuild `The Hub.html`)

- [ ] **Step 1: Full-file div-balance check**

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

Expected: `balanced: True`.

- [ ] **Step 2: JS syntax check on all script blocks**

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/jonmacicior/Desktop/The_Hub/Labmate/labmate.html', 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let m, i=0, ok=true;
while ((m = re.exec(html))) { i++; try { new Function(m[1]); } catch(e) { ok=false; console.log('Block', i, 'FAILED:', e.message); } }
console.log('total script blocks:', i, 'all ok:', ok);
"
```

Expected: `all ok: true`.

- [ ] **Step 3: Bump the Hub version and add a changelog entry**

Find in `hub-shell.html` (check the current version first — it may have moved past v1.1.5 if other work happened since; use whatever the current value actually is and bump the patch number by one):
```html
    <span class="opts-version">The Hub &middot; v1.1.5</span>
```

Replace with (adjust the version number to be one patch above whatever was actually found):
```html
    <span class="opts-version">The Hub &middot; v1.1.6</span>
```

Find:
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.5 &mdash; 20 Jun 2026</strong><br>
```

Insert a new entry above it (adjust the date to the actual day this task runs):
```html
  <div id="opts-changelog" style="display:none;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.6;max-width:220px;">
    <strong style="color:var(--text);font-size:12px;">v1.1.6 &mdash; 20 Jun 2026</strong><br>
    &#9679; <b>LabMate</b>: Cell Biology's 10 individual cell-line tiles moved into their own nested "Cell Lines" sub-panel instead of sitting flat among the 8 protocol tools; replaced the 9 mobile-home section icons with line-pictogram style (was solid color + text abbreviation)<br>
    <br>
    <strong style="color:var(--text);font-size:12px;">v1.1.5 &mdash; 20 Jun 2026</strong><br>
```

- [ ] **Step 4: Rebuild `The Hub.html`**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && python3 embed.py
```

Expected: output lists all apps including `lm: 1 replacement(s)`, ending in `Output: /Users/jonmacicior/Desktop/The_Hub/The Hub.html (N chars)` with no errors.

- [ ] **Step 5: Add the CLAUDE.md session log entry**

Find the line:
```
<!-- LAST_SESSION_START -->
```

Insert immediately after it (read the surrounding ~15 lines first to copy the exact demotion pattern used by prior entries — push the previous "Last session" entry down to become a "Previous session" entry):

```
Last session: [TODAY'S DATE] (Round 87: LabMate post-redesign polish — Cell Lines sub-panel, new section icons; v1.1.6)
Hub apps: 11. Version v1.1.6.
Labmate/labmate.html changes (v1.1.6):
- Cell Biology's 10 embedded Cell Lines cross-link tiles (previously flat among 8 protocol tools in one 18-tile grid) moved into a nested "Cell Lines" sub-panel: TOOLS_cellbio now has 9 entries (8 protocols + 1 "Cell Lines" tile, badge "10", gray tile-celllines accent); tapping it opens #proto-celllines-list (same .proto-entry/showProto/toggleProto pattern as every other protocol entry) containing a second renderToolGrid() of the 10 cell lines (TOOLS_cellbio_celllines); tapping one still calls the existing _openCellLine(id), unchanged.
- Replaced the 9 mobile-home-grid section icons (Favourites/Calculators/Mol Biology/Cell Biology/CRISPR/Proteomics/Biophysics/Struct Bio/Genomics) -- previously solid-color squares with text abbreviations ("bp", "MW", "Kd", "PDB", "NGS") or Unicode symbols -- with inline SVG line-pictograms: white background + colored border + colored stroke icon in light theme, accent-tinted background in dark theme (matching the file's existing .dark/[data-theme="dark"] convention). Confirmed via full-file search these 9 classes only ever appear in the mobile home grid, not the desktop nav/sidebar, so desktop is unaffected. Individual tool badges inside each section (e.g. "GIB" for Gibson Assembly) were explicitly left unchanged -- out of scope, confirmed with the user during brainstorming.
hub-shell.html: version bump -> v1.1.6, changelog entry added.
```

- [ ] **Step 6: Commit and push**

```bash
cd "/Users/jonmacicior/Desktop/The_Hub" && git add hub-shell.html CLAUDE.md && git commit -m "LabMate post-redesign polish: Cell Lines sub-panel + new section icons; bump Hub to v1.1.6" && git push
```

(`The Hub.html` is gitignored — confirm with `git status --short "The Hub.html"` first; if it shows as ignored, do not add it.)

- [ ] **Step 7: Report completion**

Summarize for the human: both changes shipped, verification results from Steps 1-2 of this task plus the per-task verification steps (Task 1 Steps 7-9, Task 2 Steps 20-22), and confirm the push succeeded (per the user's standing "always push automatically" preference — no separate confirmation needed before this push).
