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
3. **Live bug**: opening any Quick Calc tool (`showQcTool()`) throws 3 uncaught errors in the console — `memRenderChips is not defined` plus two `Cannot read properties of null (reading 'style')` — breaking the recents/favourites "chips" feature inside that tool view (confirmed via Playwright `pageerror` capture). Root cause: `_memRenderQcChips()` (line 5877) calls `memRenderChips(...)`, a function that has never existed anywhere in the file (confirmed via grep) — the recent-values "chips" feature for Quick Calc was never actually implemented, just scaffolded (a `.mem-row` div gets injected for it and nothing else). Fix: remove the dead call and the now-pointless `.mem-row` injection, rather than building the never-finished feature speculatively.
4. **Concrete proof of the inconsistency complaint**: every detail view's back button reads "← Protocols" *except* CRISPR (correctly "← CRISPR"), Biophysics (correctly "← Biophysics"), Quick Calc (correctly "← Calculators"), and one single Cell Biology entry out of seven (correctly "← Cell Biology" while its six siblings say "← Protocols") — i.e. Cell Biology is inconsistent with *itself*. Fixed per-section as part of this work: every back button gets its actual section name.

## Scope

**Migrate to the new shared component (8 sections — all have a real multi-tool grid and a hide-grid/show-detail interaction today):**
Calculators (`sec-quickcalc`), Mol Biology (`sec-molbio`), CRISPR (`sec-crispr`), Cell Biology (`sec-cellbio`), Proteomics (`sec-proteomics`), Genomics (`sec-genomics`), Struct Bio (`sec-structbio`), Biophysics (`sec-assays`).

**Visual-only treatment (1 section):** Cell Lines (`sec-celllines`) — see exception below; CSS only, no JS/interaction change.

**Removed:** `sec-tools` ("Tools") — today it only points to Timer and Planner, both already reachable from the main home grid. Its top-nav button, mobile-home tile, and section markup are deleted.

**Unchanged structurally, light visual touch only:** Favourites (`sec-favourites`) restyled to use the same tile look for consistency; no behavior change.

**Unchanged entirely:** Planner (`sec-planner`), Timer (`sec-timer`), Pip Story (`sec-pip-story`) — none of these have a tool-selector grid today (single unified view each), so there's nothing to migrate.

**Explicitly out of scope for this plan** (per earlier sequencing decision — redesign first, broader bug audit and code-optimization pass later as a separate plan): any bug or inefficiency outside the navigation/chrome code touched here. The two fixes in "Root cause findings" above are included only because they live directly inside the code this plan rewrites.

## Architecture

### Data: one tool registry per section

Each of the 8 migrated sections gets a plain JS array, e.g. for Quick Calc:

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

### Shared render function — existing show/hide functions stay

Investigation found the existing per-section show/hide functions (`showQcTool`/`showQcHome`, `showProto`/`showProtoHome`, `showAssayTab`/`showAssayHome`) are already called from many places beyond their own home grid — nested sub-tabs (Gibson's vector/insert PCR tabs), Favourites' deep-linking (`goToFav`), etc. Replacing them with new function names would mean auditing every one of those call sites across an 11k-line file. Lower-risk, equally effective: **keep every existing function name and call signature**, and change only two things inside each:

1. **One new shared function, `renderToolGrid(containerId, tools, openFn, desktopClasses)`** — clears the container and renders either ≤900px tile markup or >900px card markup (via `_lmIsMobile()`) from a section's `TOOLS_*` array. Called once at page load for each of the 8 sections (replacing their hardcoded grid HTML), and again from the existing resize listener so crossing the 900px boundary re-renders live.
2. **A 2-line addition inside each existing show-function** where it currently does `panel.style.display = ''` — add `panel.classList.add('lm-detail-page')` and, on mobile, retrigger the `lmDetailIn` slide-in keyframe (defined once in CSS). The function's existing show/hide logic, scroll-reset, and any per-tool side effects are untouched.

This is the same end result (one consistent grid look, one consistent slide-in feel, across all 8 sections) without rewriting logic that already works.

**Cell Lines is a corrected exception, not a migration:** investigation showed it isn't actually a modal — `showCellLine()` reveals a detail panel *below* the still-visible tile grid (no hide/show swap, no back button, `.active` highlights the selected tile). That's a reasonable, different interaction for a reference/comparison grid (10 short cards a user browses and compares), not a tool launcher — forcing it into the same hide-grid-and-navigate pattern as the other 8 would trade a real usability advantage (compare entries without round-trips) for surface-level uniformity. Cell Lines keeps its current JS behavior entirely. Only its CSS changes: at ≤900px, `.cell-tile` picks up sizing consistent with `.lm-tile` (so it doesn't look visually foreign sitting next to the other 8 sections), via the same icon-badge treatment, without changing the interaction model.

A resize listener already exists for other mobile/desktop logic (confirmed during investigation, e.g. "Recompute mob-at-home boundary on rotation/resize" at line ~10891) — `renderToolGrid` re-runs from that same listener when a resize crosses the 900px boundary while a grid (not a detail view) is showing, so rotating a tablet or resizing a browser window updates the layout without a page reload. If a detail view is open during a resize across the boundary, it is left as-is until the user backs out (no layout to switch mid-detail).

### Breakpoint implementation detail

The app's existing mobile mode (sidebar hidden, hamburger shown, header nav hidden, compact padding, touch-sized inputs, mobile home grid, back-button/breadcrumb shown) is entirely driven by `@media (max-width: 700px)` — there are exactly 8 such blocks in the file (confirmed via full-file grep, no other use of the literal `700px` exists) — plus one JS helper, `function _lmIsMobile() { return window.innerWidth <= 700; }`. To honor "≤900px = new pattern, sidebar only on clearly wide screens," all 8 blocks become `@media (max-width: 900px)` and `_lmIsMobile()`'s threshold becomes 900. This is the mechanism that actually moves the sidebar/hamburger boundary — the new tile-grid CSS doesn't need its own separate breakpoint, since `renderToolGrid()` only ever generates tile markup while already in this (now 900px-wide) mobile mode.

### Visual spec

- **Banner grouping is dropped.** 6 of those 8 migrated sections currently cluster their cards under colored category banners (e.g. Mol Biology splits into "Prep" / "Protocol"; CRISPR into "Reference" / "Protocol"). Quick Calc — the most-used section — has no such grouping. Since the #1 complaint from brainstorming was cross-section inconsistency, all 8 sections flatten to one ungrouped 2-column grid, matching Quick Calc's existing simplicity. This is a real behavior change worth flagging explicitly: the "Prep vs Protocol" visual hint disappears, replaced by tile titles alone (e.g. "Gibson Assembly" reads as a complete title without needing a "Protocol" banner above it to make sense).
- **Cell Lines icon badges** (within its CSS-only treatment): 2-4 character codes derived mechanically from each cell line's existing name already in the source HTML (e.g. "A549" → "A549", "HCT116" → "HCT", "HEK293" → "293") — implementer picks the most recognizable short form per entry, no further design input needed.
- **≤900px tile**: square-ish card, icon badge (36px, section accent color, badge text per the registry) + title below, 2-column grid (fixed — confirmed not to add a 3-column tablet variant, to keep one fewer breakpoint to maintain), minimum tap target 44px tall per the existing mobile touch-target convention (`890–895`: `min-height: 40px` inputs — tiles go slightly larger at 56px+ to stay comfortably above that).
- **≤900px detail view**: full-width, same horizontal padding as today's `.content` mobile padding (16px). Header row: `← [Section name]` link (orange accent, matches existing `.mob-back-btn` color) top-left, tool title below it. Slide transition: `transform: translateX()` over `.28s ease`, matching the validated prototype.
- **>900px**: no visual change — existing `.proto-home-card`/`.qc-home-card` style (icon+title+description) stays, just now generated from the `TOOLS_*` array instead of hardcoded per-section HTML.
- **Dark theme**: tile background/border use existing `var(--surface)`/`var(--border)` tokens already theme-aware elsewhere in the file — no new dark-mode-specific rules needed.

### Removed code

- The mobile sub-nav scaffold that's cleanly isolated: `mobShowSubGroup()`, `#mob-subhome`, `#mob-sublist` (HTML + CSS), `switchNavChild()`, the `_navGroupMeta` map, the dead `if (_navGroups[sectionId])` branch inside `mobGoTo()` (keeping its `else { switchNav(...) }` as the unconditional call), and the two monkey-patch wrapper blocks that wrap `switchNavGroup`/`mobShowSubGroup` for breadcrumb tracking (since the functions they wrap are themselves unreachable).
- All `sec-tools` markup (confirmed: it currently has no live entry point in either the desktop or mobile nav — it's reachable from nowhere in the UI today, so there's no nav button/tile to also remove), plus the `'tools'` entry in `_PROTO_SECS` and the `sidebarItems['tools'] = []` line. `_navToSection()` itself stays — it's a small, generic cross-section-navigation helper that `renderSidebar()` detects via regex on any card's `onclick`, not Tools-specific; deleting it would mean editing into `renderSidebar()`'s generic detection logic for no benefit, since leaving an unused-but-defined helper in place is harmless.
- Per-section hardcoded grid HTML (`.proto-home`/`.qc-home`/`.cell-grid` card markup) — replaced by `renderToolGrid()` output.
- **Deferred, not removed in this plan:** `_navGroups`, `_sectionToGroup`, and `switchNavGroup()` themselves stay. Tracing every call site (`renderSidebar()`, `goToFav()`, `_switchSectionFromSidebar()`) confirmed they're *also* fully dead (the seed object is permanently empty, so every branch keyed off it is unreachable) — but removing them cleanly means editing deep into `renderSidebar()`, which is large and central to the desktop sidebar and out of proportion with this redesign. That cleanup belongs in the later code-optimization pass already agreed as a separate, later phase — not bundled into this navigation redesign.

## Files touched

- `Labmate/labmate.html` — all of the above. No other files; this is a single-file app.
- `hub-shell.html` — version bump per convention, changelog entry.
- `CLAUDE.md` — session log entry per convention.

## Verification plan

1. For each of the 8 migrated sections, at 390px (phone) and 800px (tablet): screenshot the grid, click each tool tile, confirm the detail view opens with correct title and the existing calculator/protocol logic still works (spot-check one calculation per section against a known-good input/output already used as test data elsewhere in the app, where available), click back, confirm return to grid.
2. Confirm 0 browser console errors during the above for every section (this is what catches both the `memRenderChips` regression and any new mistakes).
3. At 1100px (clearly >900px desktop): screenshot all 8 migrated sections' home grids and confirm pixel-equivalent to a pre-change screenshot (no regression to desktop, which is explicitly out of scope for visual change).
4. Resize a single open page from 1100px down to 390px and back while sitting on a section's grid (not mid-detail) — confirm the grid re-renders to the correct style at the 900px crossing without a manual reload.
5. Toggle dark theme at 390px on at least 2 sections — confirm tile contrast/legibility.
6. Div-balance check on the full file (the same kind of stray-`</div>` bug that broke Labcyte Echo's layout is a realistic risk in an 11k-line file) before considering any section done.
7. Confirm `sec-tools` and all its nav entry points are fully gone (no dead links, no console errors from missing IDs).

## Out of scope

- Any change to calculation logic, formulas, or data inside individual tools.
- Code optimization / broader bug audit beyond the two bugs named above — deferred to a later, separate plan (already agreed: redesign ships first).
- Desktop (>900px) visual changes.
- 3-column tablet variant (explicitly declined in favor of consistent 2 columns).
