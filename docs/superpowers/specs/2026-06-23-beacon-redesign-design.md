# Beacon (formerly NanoBRET Calculator) — Redesign Spec

## Purpose

This supersedes large parts of `docs/superpowers/specs/2026-06-22-nanobret-calculator-design.md` (the already-shipped v1.2.3 app, id `nanobret`, folder `NanoBRET/`). That version assumed a generic two-CSV import and a single fixed assay shape. Real lab usage surfaced three corrections:

1. **Rename.** "NanoBRET Calculator" is too literal next to the rest of the suite's naming (Echo, Spectra, Helix, Cuppa). New name: **Beacon** — two interacting proteins "light up" a BRET signal. New id `beacon`, folder `Beacon/`, file `beacon.html`, unlock word `glow` (replacing `nanoluc`). Accent color stays `#5e72c4`.

2. **Real PHERAstar file format.** The actual plate-reader export is a single dual-emission `.xlsx` file (sheets: Protocol Information, Microplate End point, Table End point), not two generic CSVs. Echo already bundles the SheetJS library to parse `.xlsx` client-side and already has a PHERAstar-protocol-extraction convention — Beacon reuses both rather than inventing new ones.

3. **Two distinct assay shapes, not one.** The original spec assumed a single "+Ligand vs No-Ligand" model. Real usage has two assay modes with different biology and different curve shapes:
   - **Gain-of-Signal**: two proteins of interest (one NanoLuc-donor, one HaloTag-acceptor) — signal *rises* with interaction.
   - **Tracer Displacement**: one NanoLuc-donor protein + a small-molecule HaloTag-acceptor *tracer* — signal *falls* as a test compound displaces the tracer. This mode also needs a tracer-titration step (a binding/saturation curve, not a dose-response curve) to pick a working tracer concentration before the main compound screen.

## Architecture

Beacon is still a single self-contained `Beacon/beacon.html` file, following every other Hub app's convention. The UI now has two layers:

- **Setup modal** (matches Echo's `setup-modal` pattern exactly — a full-screen overlay with its own sub-tabs, opened via a header button, re-openable anytime to edit). Three sub-tabs, in this order: **Files** → **Assay Info** → **Plate Map**. Each later sub-tab depends on the one before it (Plate Map needs plate dimensions from Files; its role palette depends on the assay mode chosen in Assay Info).
- **Persistent app tabs** (the main tab bar, behind the modal): **Endpoint/QC** → **Dose-Response** → **Tracer Titration** (hidden entirely when assay mode is Gain-of-Signal — there's no tracer to titrate) → **Report** → **Guide**.

Data flows the same one-direction way as before: Setup's Files step populates `state.donor`/`state.acceptor` grids; Assay Info sets `state.assayMode` (`'gain'` or `'displacement'`); Plate Map paints roles onto wells, producing `state.plateMap` (a well→role assignment, with per-group concentrations for Compound/Tracer roles). Endpoint/QC, Dose-Response, and Tracer Titration all derive their working data from `state.plateMap` plus the raw grids — none of them require separate manual well-range typing as the primary path, though manual override stays available for edge cases (e.g. a second background group on a different plate).

## Setup modal — Files

Unchanged file-handling goal, new mechanics: accepts ONE PHERAstar `.xlsx` export. Parses the "Table End point" sheet (flat `Well | Content | Raw Data (xxx-LP A) | Raw Data (yyy B)` rows) into the existing `donor`/`acceptor` grid shape — no change needed downstream, since Endpoint/QC etc. already just consume those grids regardless of source.

- **Channel detection**: a column header containing "LP" (long-pass filter) is the acceptor channel; the other (band-pass, e.g. "450-80") is the donor channel. This matches the Promega protocol's own recommended filters (450nm BP donor, 600–610nm LP acceptor) and avoids hardcoding exact wavelength numbers, since gain/filter settings can vary run to run.
- **Plate size**: auto-detected from the row count in the Table End point sheet (96 vs 384) — no manual toggle needed for file-imported data. A manual 96/384 toggle remains, but only for a manual-entry fallback (typing values by hand with no file).
- **Metadata extraction**: pulls Test Name, Date, Time, Test ID, ID1/ID2/ID3, Microplate name, Optic module, Emission A/B, Gain A/B from the "Protocol Information" sheet — same fields Echo's `_extractPHERAProtocol` already captures from its own PHERAstar files. Displayed in a compact metadata card on this Files step, and carried through to the Report tab and Excel export.
- **Fallback**: the original two-CSV import (one donor, one acceptor, generic plate-shaped CSV) stays available for non-PHERAstar workflows, since it's already built.

## Setup modal — Assay Info

A single choice: **Gain-of-Signal** or **Tracer Displacement**. This sets `state.assayMode`, which controls:
- Which 4PL curve form Dose-Response uses (Echo already has both — the increasing form `_4plVal4_gain`/`_4plJac4_gain` and the decreasing form `_4plVal4`/`_4plJac4` — reused verbatim, no new math).
- Which roles appear in the next step's palette.
- Whether the Tracer Titration tab is shown at all.

## Setup modal — Plate Map (the interactive painter)

An inline canvas (not yet another nested modal) + a role palette, directly reusing Lab Designer's established interaction: click a role to make it active, click or drag-select wells to paint that role onto them (`wellState`-equivalent model, same mechanic as Lab Designer's `setActiveTypeById`/`handleWellClick`). Role palette, gated by `state.assayMode`:

| Role | Gain-of-Signal | Tracer Displacement | Meaning |
|---|---|---|---|
| Background / No-Interaction | ✓ | ✓ | True negative control (no interacting partner / no tracer at all) |
| DMSO | ✓ | ✓ | Vehicle-only point *inside* the Compound dose series (partner pair or tracer present, 0% compound) |
| Compound | ✓ | ✓ | The dose series under test — paint a group of wells, a concentration field appears immediately for that group |
| Tracer | — | ✓ | A second, separate dose series (tracer concentration, not compound concentration) feeding the Tracer Titration tab |

**Painting mechanic for dose-series roles** (Compound, Tracer): each drag-selection of new wells creates one dose-point group. The moment a group is created, an inline concentration field appears in a side list (a "chip" per group, editable/removable) — the user types the concentration right there rather than switching to a different screen. This list IS the dose series; no separate typed well-range list anywhere else.

**Endpoint/QC auto-derivation**: since DMSO (vehicle, signal-present) and Background (true negative) are always both painted, Z′/Z can be computed automatically from that pair with zero extra setup — Background and DMSO groups become the default +/− pair. Manually adding extra named conditions stays possible (e.g. a second background group from a different day), but isn't required for the basic case.

## Endpoint/QC tab

Same Z′/Z formulas as before (`Z′ = 1 − [3×SD(+) + 3×SD(−)] / |Mean(+) − Mean(−)|`, `Corrected mBU = Mean(+) − Mean(−)`), same traffic-light badges. The only change: the default +/− pair (DMSO vs Background) comes pre-populated from the Plate Map instead of requiring the user to type well-ranges and name conditions manually. The existing manual add/remove/pair UI from the original spec stays, now seeded with one pre-built pair instead of starting empty.

## Dose-Response tab

Same shared-baseline + dose-series structure as before, same 4PL fitter — but the dose series and baseline now come from the Plate Map's Compound role and Background role respectively (DMSO becomes the dose series' own 0-concentration point), instead of being typed in by hand. Which 4PL form is used (`_4plVal4` decreasing vs `_4plVal4_gain` increasing) is selected automatically from `state.assayMode`.

## Tracer Titration tab (new)

Same painting mechanic, applied to the Tracer role's dose series (tracer concentration vs. raw BRET signal — no compound, no displacement). Fits a **one-site binding/saturation curve** (`signal = Bmax × [tracer] / (Kd + [tracer])`, a 2-parameter hyperbola), not a 4PL — different shape (plateau, not sigmoid), reusing the same Levenberg-Marquardt solver (`_lmFit`) already proven in Tasks 1/2 of the original build, just with a 2-parameter value/Jacobian function instead of 4. Output: fitted `Bmax`, `Kd`, and a **suggested working tracer concentration** (~80% of `Bmax` by default — a starting suggestion the user can override, not an enforced value), plus the binding curve plotted on the same canvas-chart pattern as Dose-Response.

## Report tab (new) + Excel export

A sixth tab, mirroring Echo's `renderProtocol()`/Protocol-tab convention exactly (`.proto-row`/`.proto-k`/`.proto-v`/`.proto-sec` sections): assay metadata (from the Files step), assay mode, plate map summary, the exact formulas used (Z′/Z, corrected mBU, which 4PL form, the binding model), and the computed results restated (Endpoint/QC pair, Dose-Response fit, Tracer Titration fit if applicable). Ends with the raw PHERAstar Protocol Information sheet dumped verbatim as a table, same as Echo's "PHERAstar Protocol Sheet" section.

**Excel export** (same bundled SheetJS `XLSX.utils.book_new()`/`book_append_sheet()` pattern Echo's `generateOutputXLSX()` already uses), sheets:
- **Results** — Endpoint/QC pair(s) + Dose-Response fit + Tracer Titration fit (whichever apply).
- **Plate Map** — flat well→role(+concentration) table.
- **Assay Protocol** — Beacon-authored methodology (formulas, fitting method, bounds), matching Echo's "Data Analysis Protocol" sheet.
- **PHERAstar Protocol** — raw dump from the uploaded file's Protocol Information sheet, matching Echo's "PHERAstar Protocol" sheet.
- **Prism Copy** — Dose-Response (and Tracer Titration, if run) X/Y pairs, paste-ready for GraphPad Prism, matching Echo's "Prism Copy" sheet.

## App identity (updated)

- **App ID:** `beacon` (was `nanobret`)
- **Display name:** Beacon
- **Folder/file:** `Beacon/beacon.html` (was `NanoBRET/nanobret.html`)
- **Accent color:** `#5e72c4` (unchanged)
- **Unlock word:** `glow` (was `nanoluc`)
- **Tab icons:** Endpoint/QC and Dose-Response keep their existing icons (gauge, scatter-dot). Tracer Titration gets a new icon (a droplet/pipette glyph, reflecting titration). Report gets a new icon (a clipboard/document glyph). Guide keeps the open-book icon. Setup's three sub-tabs reuse Echo's exact sub-tab icon convention (file, flask/assay, grid).
- **Hub home card**: same BRET donor/acceptor glyph as before, same accent — only the card's name/id text changes.

## Testing

Same Node-script-verification approach for new pure functions (one-site binding fit, channel-detection-by-filter-type, plate-size auto-detection) as the original build — hand-calculated synthetic datasets checked via throwaway `/tmp` Node scripts before pasting into the app, since this repo still has no test framework. UI flows (Setup modal steps, Plate Map painting, tab gating by assay mode) verified via Playwright, matching every other app's established verification convention.

## Out of scope (unchanged from original spec, plus one addition)

Donor Saturation Assay (Section 10.B of the Promega protocol — a separate specificity-validation workflow, structurally different from tracer titration despite both being "titration-shaped"), kinetic time-course readouts, and multi-compound/multi-curve comparison in a single analysis remain out of scope. **Newly out of scope for this round**: any tracer-titration convention beyond the ~80%-of-Bmax default suggestion (the user may specify their own lab convention later, but none was specified now).
