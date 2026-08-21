# Iceberg: real data seed, downloadable grid template, visual polish

## Overview

Three related improvements to the Iceberg (Cryostorage) app:

1. Seed Jon's real freezer/cryo-tank inventory (from `Freezer and Cryo Boxes Jon.xlsx`) as the app's starting data, visible only to Jon (admin), so other Hub users still see today's blank default.
2. Add a "Download template (.xlsx)" feature producing a multi-tab workbook — one flat table-format tab and two grid-format tabs that visually mirror Jon's real spreadsheet layouts — and teach the existing Import to read the grid tabs back in.
3. A visual polish pass on the Boxes view (stat tiles, box cards, empty states) using a "frosted/icy" treatment — soft cool gradients and a subtle accent-colored glow, built entirely from existing CSS variables.

No data-model changes are required: the app's existing `box.vials[pos]` shape (row-letter + column-number keys, e.g. `"A1"`) already accommodates both of Jon's real box layouts.

## Source data

`Freezer and Cryo Boxes Jon.xlsx` (OneDrive, read-only source — not copied into the repo) has 3 sheets:

- `-80 Jon Box 1`, `-80 Jon Box 2` — each a 9×9 grid (positions A1–I9), vertically-merged cells, header rows: `TOWER: Right-hand -80 oC, bottom Eisai`, `BOX NUMBER: 1` / `2`.
- `Cryo Storage Jon` — a 10×10 grid numbered 1–100 sequentially (row-major), header row: `LOCATION: Middle right nitrogen tank > Yellow Ribbon Rack > CeTPD BOX 12`.

Cell content per position is one of: empty, `'X'`, or free text like `"HCT116\nDCAF15 KO #15 JMM05 C16 P5*"`.

## Part 1 — Seed data & parsing rules

**Mapping:**
- `minus80` tab → rack **"Right-hand −80°C, bottom Eisai"** → boxes **"Box 1"**, **"Box 2"** (rows=9, cols=9, positions A1–I9, taken directly from the sheet's own labels).
- `n2` tab → rack **"Middle right N₂ tank › Yellow Ribbon Rack"** → box **"CeTPD BOX 12"** (rows=10, cols=10). Numbered position `n` (1–100) maps to row-letter+column via `row = floor((n-1)/10)`, `col = ((n-1) % 10) + 1`, e.g. `n=11` → `B1`.

**Per-cell parsing (applied once, offline, to produce the static seed object — not a runtime parser):**
1. `'X'` (trimmed, case-insensitive) → no vial entry at that position (these vials were already taken/used).
2. Empty/`None` → no vial entry.
3. Otherwise, the cell text (newline-joined into one string with `", "` as separator) is the candidate `cellLine` value. If it ends in `P\d+` optionally followed by `*`:
   - Extract `P\d+` into the `passage` field (e.g. `"P5"`).
   - Strip that trailing token (and the `*` if present) from `cellLine`.
   - If `*` was present, append to `notes`: `"Passage counted after de-frosting — original freeze passage unknown."`
4. All other vial fields (`freezeDate`, `freezeMedia`, `cultureMedia`, `frozenBy`) are left as empty strings — not present in the source data.
5. `vialCount` defaults to `1`.

**Where it lives:** a `SEED_DATA` JS object (same shape as `state.storages`) hardcoded into `Cryostorage/cryostorage.html`, built once by hand-translating the parsed spreadsheet (verified via a one-off local Python/openpyxl script — not shipped, not committed).

**Gating — admin-only:**
```js
function maybeSeedRealData(){
  if (!hasAnyData(state) && window.parent && window.parent.isAdmin === true) {
    state.storages = JSON.parse(JSON.stringify(SEED_DATA));
    saveState();
  }
}
```
Called once during init, before the first `renderTab()`, only when `state.storages` has zero racks across both tabs (i.e. genuinely fresh `localStorage`) and `window.parent.isAdmin` is `true` — the same flag Hub's own admin/Lab-panel gating already relies on (`isAdmin = user.email === HUB_ADMIN_EMAIL`, `HUB_ADMIN_EMAIL = 'maciciorjon@gmail.com'`). Standalone-opened files and non-admin Hub sessions have no `window.parent.isAdmin`, so they keep today's blank default — unchanged behavior for everyone except Jon.

This relies on the already-documented same-origin `srcdoc` behavior (`window.parent` calls work cross-frame within the Hub).

## Part 2 — Download template & grid re-import

**New button:** "Download template (.xlsx)" in the Options panel, alongside the existing Export/Import buttons. Generates an in-memory workbook via the already-loaded SheetJS (`XLSX` global) with 3 sheets:

1. **"Table format"** — header row: `Rack, Box, Position, Cell line, Passage, Freeze date, Freezing media, Culture media / conditions, Frozen by, Vials, Notes` (identical to the existing flat-table import/export columns) plus 1–2 example rows.
2. **"Grid - lettered"** — blank 9×9 layout matching the `-80` sheets: placeholder header rows (`USER:`, `TOWER:`, `BOX NUMBER:` left blank for the user to fill), then label rows `A1..I1`, `A2..I2`, … `A9..I9` each followed by a vertically-merged (3-row) blank content row per column.
3. **"Grid - numbered"** — blank 10×10 layout matching the `Cryo Storage` sheet: placeholder header rows (`USER:`, `LOCATION:`), then label rows `1..10`, `11..20`, … `91..100`, each followed by a merged blank content row.

**Extending `importXLSX()` to read grid sheets back in:** for each sheet in an imported workbook, try in order:
1. **Existing flat-table detection** (unchanged) — header row matching `pos`/`cell line` etc.
2. **New grid detection** (fallback) — scan rows for a "label row": a row where ≥3 cells in sequence are either `/^[A-Z]\d{1,2}$/` tokens or an ascending run of integers. For each label row found, read the row immediately below it as the content row for those same columns (works regardless of whether cells are merged — non-anchor cells of a vertical merge already read back as empty in SheetJS's `sheet_to_json`, so the value is always in the row directly under the label, never below that).
   - Numbered labels convert to row-letter+column using that label row's column count as the wrap width (same formula as Part 1).
   - Same `'X'`-is-empty and trailing-`P\d+`/`*` parsing rules from Part 1 apply here, so a hand-filled template round-trips with the same semantics as the original seed data.
   - Box name defaults to the sheet name; rack name defaults to `"Imported"` unless a `TOWER:`/`LOCATION:` header line is found above the grid, in which case that becomes the rack name (mirroring how the flat-table importer already falls back to `"Imported"`/`"Box"` when no rack/box column exists).
3. If neither detection matches, skip the sheet (existing behavior, unchanged).

No new UI surface beyond the one download button — a filled-in template goes through the existing "Import (.xlsx / .csv)" button unchanged.

## Part 3 — Visual polish ("Frosted/icy", Direction A)

Scoped to background/shadow treatment only — no layout, interaction, or data changes. All new color use stays within existing CSS vars at low opacity (consistent with the Hub's pastel-tone convention).

- `.stats-row .stat-card`: background becomes `linear-gradient(135deg, var(--surface) 0%, var(--accent-dim) 140%)`; shadow tinted toward accent instead of flat grey.
- `.box-card`: same gradient base, plus a `position:absolute` soft radial accent-glow (`radial-gradient(circle, var(--accent-dim), transparent)`) positioned top-right, contained via `overflow:hidden` (card already has `overflow:hidden`).
- `.box-preview .pw` (mini well swatches): slightly increased `border-radius` so they rhyme more with the circular wells used in the box-detail view.
- `.empty-state`: gets the same gradient-card treatment (currently plain text on transparent background) so "no racks yet" / "no vials yet" reads as designed rather than blank.
- Dark theme: glow/gradient opacity reduced via the existing `--accent-dim` dark-mode value (already tuned darker per `[data-theme="dark"]`), so it reads as a subtle cyan glow rather than washing out the dark surface.

## Files touched

- `Cryostorage/cryostorage.html` — seed data object + gating logic, grid-importer extension, new download-template function/button, CSS polish.
- `hub-shell.html` — no functional change expected (Iceberg is embedded via existing `cryo` app entry); rebuilt via `embed.py` so `The Hub.html` picks up the change.
- `CLAUDE.md` — session log entry per existing convention.
- Version bump v1.1.1 → v1.1.2 in `hub-shell.html` per versioning convention.

## Verification plan (Playwright against the built `The Hub.html`)

1. Non-admin / standalone path: confirm Iceberg still opens blank — no seed leakage.
2. Simulated admin path (inject `window.isAdmin = true` at the top level before opening Iceberg): confirm both tabs populate with correct vial counts per box; spot-check a few parsed entries (e.g. a `P5*` source cell) against the source spreadsheet for correct passage/notes split.
3. Download template: confirm the workbook has exactly 3 sheets with the expected headers/layout.
4. Round-trip: download template, programmatically fill a few grid cells (simulating manual entry), re-import, confirm vials land at the expected positions with correct field values.
5. Visual check: screenshot box cards and stat tiles in both light and dark theme; confirm gradient/glow renders without clipping or contrast issues.
6. `node --check` on the edited file; `python3 embed.py` rebuild; confirm 0 placeholders in the build output.

## Out of scope

- Changing the app's data model (rows/cols/vials shape) — not needed, existing shape already fits.
- Any change to the existing "Export all (.xlsx)" backup button — confirmed adequate as-is.
- Visual polish beyond the Boxes view (box-detail well-grid, table view) — explicitly deferred unless requested later.
- Any Firebase/cloud sync for Iceberg data — stays purely `localStorage`-based, consistent with today.
