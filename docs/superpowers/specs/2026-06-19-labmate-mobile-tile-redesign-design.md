# LabMate: unified mobile/tablet tile navigation

## Overview

LabMate (`Labmate/labmate.html`, ~11,250 lines) has 14 top-level sections. 10 of them already follow the same conceptual pattern — a "home" grid of cards the user taps into a detail view — but each section reimplements it with its own JS function and CSS, so they look and behave slightly differently from each other, especially below 900px where the desktop-oriented grid CSS (`minmax(200px,1fr)`) collapses into an unintentional single-column list.

This redesign replaces those 10 separate implementations with **one shared, data-driven tile-grid component** used identically across all of them, with two responsive presentations:

- **≤900px** (phone + tablet): icon-badge tiles, 2 columns, tap → slides to a full-page detail view with a consistent "← [section]" back link.
- **>900px** (desktop): unchanged from today — icon+title+description cards, multi-column `auto-fit`.

No data-model or calculation-logic changes — this is purely the navigation/chrome layer around existing tools.

## Root cause findings (from investigation)

These motivate parts of the design and are fixed as part of this work, not deferred:

1. **`.proto-home`/`.qc-home` already are the same grid as desktop** — the "broken list" look on mobile (confirmed via live screenshots) is `minmax(200px,1fr)` collapsing to 1 column on a 390px screen, not a deliberately designed mobile list.
2. **Dead code**: `_navGroups` (declared `{}` and never populated), `#mob-subhome`, `#mob-sublist`, `mobShowSubGroup()` — a parallel mobile sub-navigation system that was scaffolded but never wired up. Removed as part of this work since it's directly the kind of leftover structure causing inconsistency.
3. **Live bug**: opening any Quick Calc tool (`showQcTool()`) throws 3 uncaught errors in the console — `memRenderChips is not defined` plus two `Cannot read properties of null (reading 'style')` — breaking the recents/favourites "chips" feature inside that tool view (confirmed via Playwright `pageerror` capture). Fixed as part of rewriting this codepath.

## Scope

**Migrate to the new shared component (9 sections — all have a real multi-tool grid today):**
Calculators (`sec-quickcalc`), Mol Biology (`sec-molbio`), CRISPR (`sec-crispr`), Cell Biology (`sec-cellbio`), Proteomics (`sec-proteomics`), Genomics (`sec-genomics`), Struct Bio (`sec-structbio`), Biophysics (`sec-assays`), Cell Lines (`sec-celllines`).

**Removed:** `sec-tools` ("Tools") — today it only points to Timer and Planner, both already reachable from the main home grid. Its top-nav button, mobile-home tile, and section markup are deleted.

**Unchanged structurally, light visual touch only:** Favourites (`sec-favourites`) restyled to use the same tile look for consistency; no behavior change.

**Unchanged entirely:** Planner (`sec-planner`), Timer (`sec-timer`), Pip Story (`sec-pip-story`) — none of these have a tool-selector grid today (single unified view each), so there's nothing to migrate.

**Explicitly out of scope for this plan** (per earlier sequencing decision — redesign first, broader bug audit and code-optimization pass later as a separate plan): any bug or inefficiency outside the navigation/chrome code touched here. The two fixes in "Root cause findings" above are included only because they live directly inside the code this plan rewrites.

## Architecture

### Data: one tool registry per section

Each of the 9 migrated sections gets a plain JS array, e.g. for Quick Calc:

```js
const TOOLS_quickcalc = [
  { id: 'dilution', title: 'Simple Dilution', badge: 'C1V1' },
  { id: 'serial',   title: 'Serial Dilution',  badge: 'SER' },
  { id: 'mw',       title: 'Moles / Mass',     badge: 'MW'  },
  { id: 'pcr',      title: 'PCR Master Mix',   badge: 'PCR' },
  { id: 'pk',       title: 'PK Parameters',    badge: 'PK'  },
  { id: 'ph',       title: 'pH / Buffer',      badge: 'pH'  },
];
```

`badge` is a 2-4 character label shown inside the icon square (mirrors the existing `.lm-icon-*::before` convention, e.g. `.lm-icon-calc::before { content: 'f(x)' }`). The icon square's background color is the section's existing accent color (already defined per section via `.lm-icon-<section>` — e.g. `#0079b9` for Calculators, `#2d7a38` for Mol Biology) — every tool tile within a section shares that one color, so no new per-tool color decisions are needed.

This array is the single source of truth for that section's grid — both the ≤900px tile grid and the >900px desktop card grid render from the same array (today, the desktop cards are hardcoded HTML per section; they become generated from this array too, so adding/removing a tool only requires editing one array entry, not parallel HTML blocks).

### Shared render + navigation functions

Three new shared functions (in the existing top-level `<script>` block, near the other nav helpers like `switchNav`):

- `renderToolGrid(containerEl, tools, sectionId)` — clears `containerEl` and renders either the ≤900px tile markup or the >900px card markup, based on `window.innerWidth`, reading from the section's `TOOLS_*` array. Replaces each section's separate hand-written grid HTML.
- `openToolDetail(sectionId, toolId)` — hides the grid, shows the detail container for `toolId` (existing per-tool detail markup/logic is untouched — only the show/hide and back-button wiring is unified), and on ≤900px applies the slide-in transition. Replaces `showQcTool`, `showProto`, `showAssayTab`, `showCellLine`'s navigation portion (the actual calculation/render logic inside each detail view is unchanged, only how you get to and from it).
- `closeToolDetail(sectionId)` — reverses `openToolDetail` (slide back out, show grid again). Replaces `showQcHome`, `showProtoHome`, `showAssayHome`.

**Cell Lines is an explicit exception to "replace the show/hide function" above:** today it opens each of its 15+ entries as a modal overlay (`showCellLine(cellId, element)`), not a grid-replaces-with-detail page. Per the top complaint from brainstorming ("inconsistency between sections is the worst part"), Cell Lines converts fully to the same `openToolDetail`/`closeToolDetail` pattern as the other 8 sections — its modal is removed, and each cell line becomes a normal tile in the 2-column grid that opens the same full-page slide-in detail. The per-cell-line content (ATCC code, tissue type, culture notes, etc., currently inside the modal body) moves unchanged into that detail page.

A resize listener already exists for other mobile/desktop logic (confirmed during investigation, e.g. "Recompute mob-at-home boundary on rotation/resize" at line ~10891) — `renderToolGrid` re-runs from that same listener when a resize crosses the 900px boundary while a grid (not a detail view) is showing, so rotating a tablet or resizing a browser window updates the layout without a page reload. If a detail view is open during a resize across the boundary, it is left as-is until the user backs out (no layout to switch mid-detail).

### Visual spec

- **Banner grouping is dropped.** 7 of the 9 migrated sections currently cluster their cards under colored category banners (e.g. Mol Biology splits into "Prep" / "Protocol"; CRISPR into "Reference" / "Protocol"). Quick Calc — the most-used section — has no such grouping. Since the #1 complaint from brainstorming was cross-section inconsistency, all 9 sections flatten to one ungrouped 2-column grid, matching Quick Calc's existing simplicity. This is a real behavior change worth flagging explicitly: the "Prep vs Protocol" visual hint disappears, replaced by tile titles alone (e.g. "Gibson Assembly" reads as a complete title without needing a "Protocol" banner above it to make sense).
- **Cell Lines badges**: 2-4 character codes derived mechanically from each cell line's existing name/ATCC label already in the source data (e.g. "A549" → "A549", "HCT116" → "HCT", "HEK293" → "293") — implementer picks the most recognizable short form per entry, no further design input needed.
- **≤900px tile**: square-ish card, icon badge (36px, section accent color, badge text per the registry) + title below, 2-column grid (fixed — confirmed not to add a 3-column tablet variant, to keep one fewer breakpoint to maintain), minimum tap target 44px tall per the existing mobile touch-target convention (`890–895`: `min-height: 40px` inputs — tiles go slightly larger at 56px+ to stay comfortably above that).
- **≤900px detail view**: full-width, same horizontal padding as today's `.content` mobile padding (16px). Header row: `← [Section name]` link (orange accent, matches existing `.mob-back-btn` color) top-left, tool title below it. Slide transition: `transform: translateX()` over `.28s ease`, matching the validated prototype.
- **>900px**: no visual change — existing `.proto-home-card`/`.qc-home-card` style (icon+title+description) stays, just now generated from the `TOOLS_*` array instead of hardcoded per-section HTML.
- **Dark theme**: tile background/border use existing `var(--surface)`/`var(--border)` tokens already theme-aware elsewhere in the file — no new dark-mode-specific rules needed.

### Removed code

- `_navGroups` object and everything that only exists to serve it: `mobShowSubGroup()`, `#mob-subhome`, `#mob-sublist`, `switchNavGroup()`, `switchNavChild()`, the `_navGroupMeta` map, and their CSS (`.mob-subhome*`, `.mob-sublist*`).
- All `sec-tools` markup, its `nav-btn`/`mob-nav-btn`/`mob-grid-item` entries, and `_navToSection()`.
- Per-section hardcoded grid HTML (`.proto-home`/`.qc-home`/`.cell-grid` card markup) — replaced by `renderToolGrid()` output.

## Files touched

- `Labmate/labmate.html` — all of the above. No other files; this is a single-file app.
- `hub-shell.html` — version bump per convention, changelog entry.
- `CLAUDE.md` — session log entry per convention.

## Verification plan

1. For each of the 9 migrated sections, at 390px (phone) and 800px (tablet): screenshot the grid, click each tool tile, confirm the detail view opens with correct title and the existing calculator/protocol logic still works (spot-check one calculation per section against a known-good input/output already used as test data elsewhere in the app, where available), click back, confirm return to grid.
2. Confirm 0 browser console errors during the above for every section (this is what catches both the `memRenderChips` regression and any new mistakes).
3. At 1100px (clearly >900px desktop): screenshot all 9 sections' home grids and confirm pixel-equivalent to a pre-change screenshot (no regression to desktop, which is explicitly out of scope for visual change).
4. Resize a single open page from 1100px down to 390px and back while sitting on a section's grid (not mid-detail) — confirm the grid re-renders to the correct style at the 900px crossing without a manual reload.
5. Toggle dark theme at 390px on at least 2 sections — confirm tile contrast/legibility.
6. Div-balance check on the full file (the same kind of stray-`</div>` bug that broke Labcyte Echo's layout is a realistic risk in an 11k-line file) before considering any section done.
7. Confirm `sec-tools` and all its nav entry points are fully gone (no dead links, no console errors from missing IDs).

## Out of scope

- Any change to calculation logic, formulas, or data inside individual tools.
- Code optimization / broader bug audit beyond the two bugs named above — deferred to a later, separate plan (already agreed: redesign ships first).
- Desktop (>900px) visual changes.
- 3-column tablet variant (explicitly declined in favor of consistent 2 columns).
