# Suite-wide tab/badge icon redesign (Phase B2)

## Overview

Part of a larger suite-wide audit (Phases A — mobile touch-target fixes — and B1 — Hub home-card logo fixes — already shipped as v1.1.7; see `CLAUDE.md`'s session log, Round 88, and the original audit plan at `/Users/jonmacicior/.claude/plans/delightful-soaring-truffle.md`). This spec covers Phase B2 only: replacing plain-text tab labels and a handful of emoji/Unicode badges with SVG line-pictograms, across 9 apps. Reviewed end-to-end via the Visual Companion (5 mockup batches, all approved).

39 icon-level changes total: 31 new tab icons (LDI 3, Echo 4, Lab Designer 4, Degradation Explorer 5, Helix 5, Protein Tools 5, Spectra 5), Iceberg's 2 Unicode tab symbols, and Cuppa's 6 expense-category emoji badges.

## Layout convention (approved)

**Icon + text, not icon-only.** Every tab keeps its existing text label; the new SVG icon sits as a prefix inside the same tab button. Confirmed via mockup comparison against an icon-only alternative — icon+text was preferred because most apps have 4-5 tabs per bar (icon-only risks ambiguity at that count) and it matches how these tab bars already read today (just adding a glyph, not changing the interaction model).

## Container/style convention

Two different conventions apply, by app:

**Cross-suite convention** (Echo, Degradation Explorer, Lab Designer, Helix, Protein Tools, Spectra, LDI, Iceberg — i.e. everything except Cuppa): copied exactly from LabMate's `.lm-icon-*` pattern (`Labmate/labmate.html` lines 1065-1139) —
- `background: var(--surface)` (light theme), `border: 1.5px solid <app-accent-hex>`, `color: <app-accent-hex>`
- `.dark`/`[data-theme="dark"]` (or `[data-theme="light"]` for apps where dark is default — check each file's existing convention before adding the override) tints the background to `rgba(<accent-rgb>, 0.16)` instead of `var(--surface)`
- Inline SVG: `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"–"1.8" stroke-linecap="round" stroke-linejoin="round"` (exact stroke-width may vary slightly per icon for visual balance, matching what was shown in the approved mockups)
- Icon sits inside the existing tab button, sized ~16-18px, with a small gap (~6-7px) before the text label

**Cuppa's own convention** (expense-category badges only — Iceberg's 2 tab icons use the cross-suite convention above): matches Cuppa's existing `.dk-*` drink-badge style, updated per review feedback —
- `background: <flat solid color per category>` (NOT a gradient — explicitly rejected during review)
- `border: 1.5px solid rgba(0,0,0,0.12)` (light theme; needs a dark-theme-appropriate equivalent, e.g. `rgba(255,255,255,0.12)`, following whatever convention Cuppa's existing `.dk-*` badges use for border in dark mode — check before implementing)
- Inline SVG: `stroke="currentColor"` (white, since text/icon sits on a solid colored tile), same general weight as the drink badges

## Icon inventory

### LDI (`LDI/ldi.html`, accent `#e91e63`)
| Tab | Concept |
|---|---|
| Data | Table/grid (rect + divider lines) |
| Results | Vertical bar chart (3 ascending bars) |
| Curves | Dose-response curve (rising-then-plateauing path) |

### Echo (`Labcyte_Echo/labcyte_echo.html`, accent `#ff5760`) — setup modal tabs
| Tab | Concept |
|---|---|
| Files | Folder |
| Assay | Flask/erlenmeyer |
| Analysis | Bar chart — **reuses LDI's Results glyph** |
| Output | Download arrow into a tray |

### Lab Designer (`Plate_Designer/plate_designer.html`, accent `#0079b9`)
| Tab | Concept |
|---|---|
| Plate Designer | 3×3 well-grid (dots) — matches this app's own Hub home-card logo |
| Gel Designer | Vertical gel lanes (rect + lane dividers) |
| History | Clock |
| Guide | Open book — **this glyph is reused by Degradation Explorer, Helix, Protein Tools, and Spectra's own Guide tabs below** |

### Degradation Explorer (`Degradation_Explorer/degradation_visualizer.html`, accent `#7c6fd4`)
| Tab | Concept |
|---|---|
| Load Data | Upward arrow into a tray (upload) |
| Table | Table/grid — **reuses LDI's Data glyph** |
| DC50 vs Dmax | Scatter plot (axis + 4 dots) — deliberately distinct from a continuous curve, since this view is a scatter, not a fitted curve |
| Properties | 3-node molecule network (3 circles + connecting lines) |
| Guide | Open book — **reused** |

### Helix (`Helix/helix.html`, accent `#43a047`)
| Tab | Concept |
|---|---|
| Genetic Code | DNA double helix |
| Sequence Tools | Sequencing-ladder bars (horizontal segments, varying length) |
| Compare | Two stacked lines with alignment tick-marks + comparison arrows |
| Vector Library | Circular plasmid map (circle + arc + origin dot) |
| Guide | Open book — **reused** |

### Protein Tools (`Protein_Tools/protein_tools.html`, accent `#9c6fd4`)
| Tab | Concept |
|---|---|
| Properties | Diagonal ruler with tick marks (deliberately distinct from Degradation Explorer's molecule-network glyph, to avoid visual confusion between the two apps' own "Properties" tabs) |
| Cleavage | Scissors |
| Structure | Secondary-structure ribbon (S-curve ribbon path) |
| Target Intel | Bullseye/target (concentric circles + center dot) |
| Guide | Open book — **reused** |

### Spectra (`Spectra/spectra.html`, accent `#26a69a`)
| Tab | Concept |
|---|---|
| A280 | Droplet/cuvette |
| Ratio | Two overlapping circles (proportion/comparison) |
| Standard Curve | Dose-response curve — **reuses LDI's Curves glyph** |
| Plate | 3×3 well-grid — **reuses Lab Designer's Plate Designer glyph** |
| Guide | Open book — **reused** |

### Iceberg (`Cryostorage/cryostorage.html`, accent `#00acc1`) — cross-suite convention
| Tab | Concept |
|---|---|
| −80°C | Snowflake (line-art, replacing `&#10052;`) |
| Liquid N₂ | Droplet with cold-vapor lines (replacing `&#127777;`) |

### Cuppa (`Cuppa/cuppa.html`) — Cuppa's own convention, flat solid color + border
| Category | Concept | Solid color |
|---|---|---|
| Supplies | Box | `#8a6f5c` |
| Coffee | Cup + handle (same shape as Cuppa's existing `.dk-coffee` badge) | `#6b4d31` |
| Milk | Carton | `#a99a87` |
| Store | Shopping cart | `#6f8a5c` |
| Cash | Circle + coin squiggle | `#9c8550` |
| Card | Card rect + stripe | `#5c7a8a` |

## Out of scope

- The ~48 individual tool/entry badges inside each section's own grid (unchanged elsewhere in the suite, e.g. LabMate's tool badges) — not touched by this spec.
- Cuppa's existing drink-type badges (`.dk-coffee`, `.dk-tea`, etc.) — unchanged, only used as a style reference for the new expense-category badges.
- Desktop nav bars/sidebars that are plain text (out of scope per the original audit, confirmed no icon usage there in any of these 9 apps).

## Files touched

`Labcyte_Echo/labcyte_echo.html`, `Degradation_Explorer/degradation_visualizer.html`, `Plate_Designer/plate_designer.html`, `Helix/helix.html`, `Protein_Tools/protein_tools.html`, `Spectra/spectra.html`, `LDI/ldi.html`, `Cryostorage/cryostorage.html`, `Cuppa/cuppa.html`. Plus `hub-shell.html` (version bump + changelog) and `CLAUDE.md` (session log) per project convention.

## Verification plan

1. Per app: confirm all listed tabs/badges render their new icon, in both light and dark theme, with no layout overflow/clipping in the tab bar (icon + text fitting comfortably).
2. Confirm reused glyphs (Table, Bar chart, Dose-response curve, Well-grid, Guide book) render identically wherever they're reused — same path data, just recolored per app accent.
3. Confirm Cuppa's badges use flat solid color (no gradient) with the border, distinct from its own drink badges' gradient style.
4. Zero new console errors at mobile (390px), tablet (750px), and desktop (1200px) widths, per app.
5. Div-balance + JS-syntax check on each touched file, same as every prior round.
6. `embed.py` rebuild lists all 11 apps with no errors; version bump + changelog + session log; commit + push.

## Out of scope for this spec

Phase C (desktop density/visual-hierarchy backlog) — separate, not part of this icon work, needs its own brainstorming pass per the original audit plan.
