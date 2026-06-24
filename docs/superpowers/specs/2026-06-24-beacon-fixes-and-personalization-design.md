# Beacon: embed-breaking bug fix, Plate Map redesign, QC cleanup, lite mode, test data

## Context

Jon reported four problems with Beacon (`Beacon/beacon.html`) after the 2026-06-23 redesign (see `2026-06-23-beacon-redesign-design.md` / `project_the_hub.md` for that history):

1. "Beacon has lots of errors"
2. "all code showing in background"
3. "input grid is very non intuitive"
4. needs more personalization options (explicitly optional — some users just want raw ratios) and test data like other Hub apps

Investigation (standalone file, synthetic-data injection through the real import pipeline via Playwright, and opening Beacon through the actual built `The Hub.html`) found that (1) and (2) are **the same root cause**, fully reproducible and fixed below. (3) and (4) are real, separately-diagnosed UX gaps with concrete fixes. This design covers all four.

## 1. Root-cause bug: embed-time script corruption

**Diagnosis:** Beacon bundles the SheetJS/xlsx library inline as a `<script>` block placed *inside* `<head>` (lines 217–241 of `Beacon/beacon.html`), ahead of the real `</head>` tag (line 242). Every other SheetJS-bundling app in the suite (Echo, Iceberg, LDI) places this same library bundle in `<body>`, after their real `</head>`.

The bundled library's minified source contains the string literal:
```
var Bm='<html><head><meta charset="utf-8"/><title>SheetJS Table Export</title></head><body>';
```
(SheetJS's internal default header for its unused `sheet_to_html` export helper.) This string contains a literal `</head>` substring.

`hub-shell.html`'s `_loadApp(id)` injects per-app embed styles and the back-navigation script via:
```js
html = html.replace('</head>', '<style>' + embedStyle + '</style></head>');
...
html = html.replace('</head>', backScript + '</head>');
```
`String.replace` with a plain string pattern (no `/g`) replaces only the **first** match. Because Beacon's library script sits in `<head>` *before* the real `</head>`, the textually-first `</head>` in the whole file is the fake one inside the `Bm` string — not Beacon's real closing head tag. Both injections land inside that JS string literal, splicing `<style>...</style>` (and later `<script>...</script>`) text into the middle of an active script block.

This corrupts the script's JS syntax (the `Invalid or unexpected token` `pageerror` reproduced via Playwright), and because the inserted markup disrupts the browser's parsing of where the original `<script>` element's text content ends, the remainder of the ~9000-line bundle is parsed as plain HTML text and rendered visibly on the page — this is the literal "all code showing in background." It is **only reproducible when Beacon is opened through The Hub** (the standalone file has no `_loadApp` injection step), which is why it wasn't caught during the redesign's own (standalone-only) verification.

**Fix:**

- **`Beacon/beacon.html`**: relocate the bundled SheetJS `<script>...</script>` block from inside `<head>` to immediately after the real `<body>` opening tag — matching the established convention in Echo/Iceberg/LDI. No code inside the library changes; this is a pure structural move. After the move, the file's only `</head>` occurrence ahead of any script content is the real one, so the embed injection becomes correct.
- **`hub-shell.html`'s `_loadApp(id)`** (defense-in-depth, protects every current and future app from this class of bug): "first occurrence" and "last occurrence" are **both** unsafe general rules — checked Echo's own bundled SheetJS copy, which has the *same* kind of duplicate `</head>` substring, but in the opposite order from Beacon (Echo's real closing tag comes first in the file; its library's fake one comes after, in `<body>`). Anchoring on "last" would fix Beacon but break Echo. The structurally-correct fix: before searching for `</head>`, mask out the contents of every `<script>...</script>` block (replace each with equal-length whitespace, preserving all other indices) using `/<script\b[^>]*>[\s\S]*?<\/script>/gi`, then find `</head>` in the masked copy. Since the real closing head tag is never itself inside a `<script>` element, this finds it correctly regardless of where any bundled library happens to place its own incidental `</head>`-shaped string content. Apply the same masked-index lookup for both injection call sites.

**Verification:** re-run the existing Playwright check (`openApp('beacon')` against a freshly-rebuilt `The Hub.html`) and confirm zero `pageerror`/console errors and that the Setup modal renders normally with no visible raw script text. Also spot-check Echo/Iceberg/LDI still embed cleanly after the `_loadApp` change (regression check on the hardening, not just Beacon).

## 2. Setup modal / Plate Map redesign

**Diagnosed problems** (via direct interaction, including real Playwright mouse-drag painting):

- `.setup-card` is a fixed `680px` width regardless of viewport. The Plate Map sub-tab's three-column layout (`pm-layout`: well grid + role list + dose-group list, `display:flex;flex-wrap:wrap`) crams all three into that width — for a 96-well plate there's large dead whitespace and the role list floats with a big disconnected gap from the grid; for a 384-well plate (24 columns × 24px cells ≈ 576px alone) it's worse.
- Each Compound/Tracer drag adds a new chip to `#pm-doselist`. Because the three columns share one wrapping flex row, that list growing taller causes the *row* to re-wrap, which visibly shifts the well grid's on-screen position while the user is mid-workflow (reproduced: grid's bounding box y-coordinate changed between consecutive dose-group paints in the same session).
- `renderPlateMapGrid()` does `wrap.innerHTML = <full table markup>` and is called from `pmWellOver()` — i.e. the **entire** well-grid table is torn down and rebuilt on every single `mousemove` during a drag. Janky, and worse at 384-well scale (384 `<td>`s rebuilt per pixel of mouse movement).
- No live feedback on how many wells are currently painted with the active role; no per-row/column shortcut (only manual cell-by-cell drag) — tedious at 384-well scale; no "clear this role" affordance short of repainting every well.
- Nothing gates the Setup sub-tab order. `switchSetupTab()` has no dependency checks despite the Guide tab's own text claiming "each step depends on the one before." A user can open Plate Map (or never visit Assay Info at all) before picking an assay mode. Combined with `state.assayMode` defaulting to `null` and every dose-fit call site doing `state.assayMode === 'gain' ? gainFn : displacementFn` (i.e. **falls through to the Displacement curve shape whenever mode is unset**, not an error or a neutral default), a Gain-of-Signal user who skips Assay Info gets a silently wrong fit shape with no warning anywhere in the UI.

**Fixes:**

- `.setup-card` gains a `.platemap-wide` class (toggled by `switchSetupTab()`) applying `width:min(96vw, 1100px)` only while the Plate Map sub-tab is active; Files/Assay Info keep the current 680px since their content doesn't need more room.
- `pm-layout` becomes a CSS grid (`grid-template-columns: 1fr 150px 240px` or similar, not flex-wrap) so the side columns' content height can never affect the grid column's position — eliminates the shift-while-painting bug structurally, not just cosmetically.
- `pmWellOver()` (and `pmWellDown()`) stop calling `renderPlateMapGrid()` (full rebuild) on every move. Instead, directly toggle the affected `<td>`'s class/inline background via its DOM reference (looked up once per well by id, or tracked via a `wellId → <td>` map built at grid-render time) — only the actually-changed cells touch the DOM. Final commit on `mouseup` can still do a full `renderDoseGroupList()` refresh (cheap, not per-well).
- Add a small live counter near the role list ("14 wells — Background") reflecting the active role's current well count, updated on the same cheap per-well path above.
- Add a "Clear [role name]" button under the role list that empties the active role's wells (and any dose groups solely composed of removed wells) in one click.
- Add click-to-select on row/column headers: clicking a row letter or column number paints/selects that entire row/column with the active role in one action — drag-paint remains available for partial selections.
- Setup sub-tabs gain dependency gating: `.setup-stab[data-tab="assay"]` is disabled (greyed, non-clickable) until `state.donor && state.acceptor`; `.setup-stab[data-tab="platemap"]` is disabled until `state.assayMode` is set. `switchSetupTab()` checks this before switching (defends against stale onclick handlers as well as the visual disabling). This closes the silent-wrong-curve-shape gap as a side effect: it becomes structurally impossible to reach Plate Map (and therefore impossible to run a dose fit) without an explicit assay-mode choice having been made first.

## 3. Endpoint/QC condition-list cleanup

**Problem:** `state.conditions` holds both Plate-Map-auto-derived entries (`id:'auto-bg'`/`id:'auto-dmso'`, `auto:true`, written by `seedQcFromPlateMap()`) and manually-added entries (written by `addCondition()`, triggered by the "+ Ligand/Treated condition" / "+ No-Ligand/Untreated condition" buttons that sit permanently at the top of the Endpoint/QC panel). `renderConditions()` renders all of them in one undifferentiated list — the only distinction is that auto cards have their Name/Wells fields disabled. A user who paints a Plate Map AND clicks the manual add buttons (very plausible, since those buttons are the first thing visible on the tab) ends up with duplicate-looking ligand/background cards and confusing/conflicting Z′ results.

**Fix:** restructure the Endpoint/QC panel into two visually distinct sections:
- "From Plate Map" — the auto-derived Background/DMSO cards (existing disabled-field behavior unchanged), shown whenever `pm.background.length || pm.dmso.length`.
- A collapsed `<details>`-style "+ Add custom condition (advanced)" disclosure below it, containing the existing manual add buttons + manually-added condition cards — closed by default once Plate Map data exists, open by default if it doesn't (so manual-only / CSV-fallback users without Plate Map see it immediately, not buried).

No change to the underlying data model (`state.conditions`, `seedQcFromPlateMap`, `addCondition`) — this is a rendering/grouping fix in `renderConditions()` only.

## 4. Lite mode

**Goal:** let a user who only wants the raw donor/acceptor/ratio numbers skip the entire guided workflow — Assay Info, Plate Map, QC, Dose-Response, Tracer Titration all stay irrelevant to them. Optional, per Jon's framing: the full guided workflow remains the default/primary path, lite mode is an explicit opt-in, not a replacement.

**Design:**
- After a file loads in Setup → Files (PHERAstar `.xlsx` or the CSV fallback), a new choice appears for the first time: "Full workflow" vs "Just show ratios" (two buttons/cards, similar visual treatment to the existing Assay Info mode-cards). This replaces the current behavior where loading a file silently assumes the full workflow.
- Choosing "Full workflow" continues exactly as today (proceed to Assay Info).
- Choosing "Just show ratios" closes the Setup modal directly into a new lightweight view: the existing "Combined preview — raw ratio (acceptor/donor) per well" table (currently only ever shown inside the Setup → Files pane) is promoted to occupy the main panel area, with an "Download Excel" / "Download CSV" export button above it (reuses the existing `_xlsxSafeCell`/sanitization conventions from `generateOutputXLSX`, just exporting one sheet: the ratio grid). The tab bar (Endpoint/QC, Dose-Response, Tracer Titration, Report) is hidden in this mode — Guide remains visible.
- The choice is per file load, not a persistent app-wide setting: loading a new file (or re-opening Setup → Files and loading a different one) re-asks. `state.litemode` (boolean) tracks the current choice; re-running Setup's Files step resets it to unset until chosen again.
- Switching from lite mode back to full workflow (or vice versa) is possible via re-opening Setup and choosing differently — no data is lost (the underlying `state.donor`/`state.acceptor` grids are identical in both modes; only which UI is shown differs).

## 5. Test data

Following the existing suite convention (`⚗ Load test data` button, e.g. `Labcyte_Echo/labcyte_echo.html`'s `loadTestData()`, `Degradation_Explorer/degradation_visualizer.html`'s equivalent): Beacon gains two embedded synthetic datasets, since assay mode determines curve shape and Tracer Titration only applies to one mode.

- **Gain-of-Signal test dataset**: a synthetic PHERAstar `.xlsx` export (built once, base64-embedded as a `_TEST_PHERA_GAIN_B64` constant, decoded via the existing `_b64toFile`-style helper) shaped as: 96-well plate, 8 Background wells, 8 DMSO wells, 5 Compound dose groups (4+ wells each) at concentrations spanning ~4 orders of magnitude producing a clean rising sigmoid when run through the real `_4plVal4_gain` fit. Includes a populated Protocol Information sheet so the Assay Metadata card has real-looking values.
- **Tracer Displacement test dataset**: same structural shape, but donor/acceptor values shaped to produce a clean *falling* sigmoid via `_4plVal4`, plus Tracer role wells/groups at varying concentrations shaped to produce a clean one-site binding curve via `_fitOneSiteBinding` when Tracer Titration is computed.
- **UI:** one "⚗ Load test data" control in Setup → Files, expanded to a small two-option choice (Gain-of-Signal / Tracer Displacement) given there are now two datasets — matches the existing Setup mode-card visual pattern rather than introducing a new control type. Loading either: populates `state.donor`/`state.acceptor`/`state.plateFormat` exactly as `handlePheraFile()` would, sets `state.assayMode` to the matching mode, pre-paints the Plate Map (`state.plateMap`) with the Background/DMSO/Compound(+Tracer) wells and concentrations described above, and lands the user directly in the full guided workflow (lite-mode choice is skipped for test data — it's meant to demonstrate the full pipeline).

## Out of scope

- Any change to the underlying BRET/mBU/Z′/4PL/one-site-binding math — none of it is touched by this design; all four problems are UI/embedding bugs, not calculation bugs.
- Persistent cross-session personalization preferences (e.g. remembered default plate format/units) — explicitly declined; lite-mode-per-file-load is the only personalization surface this design adds.
- Reordering or making Files → Assay Info → Plate Map fully non-linear/skippable for advanced users — explicitly declined; the fix is to gate the existing intended order more strictly, not to relax it.
