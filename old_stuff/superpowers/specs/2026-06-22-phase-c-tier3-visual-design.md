# Phase C, Tier 3: New visual components (design)

## Overview

Final tier of the suite-wide audit's Phase C (see `CLAUDE.md` Round 88-91; Tier 1 shipped as v1.1.9, Tier 2 as v1.2.0). The original backlog listed 6 items across 4 apps, framed as "real design judgment, new visual components — treat like Phase B2's scope" (B2 was the suite-wide tab-icon redesign, also gated on Visual Companion review).

## Scope correction

Each item was checked against the live code before designing anything, the same diligence applied in Tiers 1 and 2. The backlog's framing didn't fully hold up:

- **Lab Designer's `.gd-preview-wrap` hardcoded background** — already fixed. `[data-theme="dark"] .gd-preview-wrap{background:var(--surface2);}` has existed since Round 58. Dropped, nothing to do.
- **Lab Designer's `.hist-card` Plate/Gel differentiation** — already partially done (a colored text pill, "Plate" blue / "Gel" green, not literally undifferentiated as the backlog implied). Reviewed via Visual Companion: an icon-in-pill upgrade was mocked up and explicitly rejected — the existing color+text pill already reads clearly at a glance. Dropped, leave as-is.
- **Protein Tools' `.ti-card` "Function/Mechanism/Disease" hierarchy** — that framing doesn't match the real card. The actual sections are Identity, Drugs & mechanisms, Top disease associations, Structures (PDB), Network, Links (6 sections, not 3). Redesigned around the real content (see Fix 2).
- **Cuppa's "stat-card vs welcome-card" mismatch** — not a clean two-category split. The Welcome card AND the first stat card ("June 2026" total) both already carry the bold amber gradient ("feature" treatment); the second stat card ("Monzo Pot / Active Members") is plain. It's a 2-bold-vs-1-plain imbalance, not a category mismatch (see Fix 3).

One item not in the original backlog at all was folded in after investigation: **Degradation Explorer's `.guide-card` icon hierarchy** and **Lab Designer's `.guide-section` icon-per-section** turned out to be one instance of a pattern repeated across the whole suite — every app's Guide tab content has the identical flat heading-plus-paragraph structure with no icon, except Echo, which uses raw emoji (📁 ⚙️ 📊 etc.) baked directly into the heading text rather than the SVG line-icon convention the rest of the suite settled on during Phase B2. Folding all six apps into one consistent pass (Fix 1) is more coherent than fixing two of them in isolation.

**Final scope: 3 fixes.** Reviewed via Visual Companion (4 mockup rounds: icon-treatment style, history-card chip, Target Intel grouping in 2 iterations, Cuppa weight rebalance).

## Fixes

### 1. Guide-tab content icons (cross-suite, 6 apps)

Add a small inline SVG icon directly before each Guide-tab section heading, inheriting the heading's existing text color via `stroke="currentColor"` — no bordered box, no background fill. This matches Phase B2's tab-icon convention exactly (icon + text, color inherited from context) rather than the Hub home-card's bordered-box convention, since these are content headings inside a panel, not tab-bar items competing for active/inactive state. Reviewed via Visual Companion; this was the explicitly chosen option over the bordered-box alternative.

Markup pattern (applies to both `<h3>` inside `.guide-section` and `.guide-card`):
```html
<h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">...</svg> Heading text</h3>
```
with `display:flex;align-items:center;gap:7px` added to the existing `.guide-section h3` / `.guide-card h3` rule in each file (icon sized ~15×15px to sit comfortably against the existing 13px heading text).

**Icon assignment principle:** reuse the app's own existing tab/setup icon whenever the guide heading names a feature that already has one elsewhere in the same file (exact glyph, copy-pasted, so the same concept always looks identical within an app). Only design a new glyph when no existing icon matches. Most apps are 4-for-4 on reuse, since their Guide content headings are literally named after their own tabs.

**Lab Designer** (`Plate_Designer/plate_designer.html`, `.guide-section`) — none of these 4 map to existing tabs (they're workflow steps within one tab, not separate tabs), so all 4 are new glyphs:
| Heading | Icon |
|---|---|
| Selecting wells | Dashed marquee-selection box with one solid corner handle: `<rect x="4" y="5" width="16" height="14" rx="1" stroke-dasharray="3 3"/><rect x="3" y="4" width="3" height="3" fill="currentColor" stroke="none"/>` |
| Assigning well types | Paint roller: `<rect x="3" y="3" width="7" height="5" rx="1"/><path d="M6 8v5h4v3"/><rect x="8" y="14" width="4" height="5" rx="1"/>` |
| Labels and dilutions | Tag: `<path d="M12 2H4v8l9 9 8-8z"/><circle cx="7" cy="7" r="1.3" fill="currentColor" stroke="none"/>` |
| Export | Download arrow, reused verbatim from this app's own Echo-style convention: `<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>` |

**Degradation Explorer** (`Degradation_Explorer/degradation_visualizer.html`, `.guide-card`) — all 4 reuse this file's own existing tab icons verbatim (lines ~294-298):
| Heading | Icon (reused from) |
|---|---|
| Load Data | `load` tab icon: `<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>` |
| Table | `table` tab icon: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>` |
| DC50 vs Dmax | `scatter` tab icon: `<path d="M4 19h16"/><circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="1.2".../><circle cx="15" cy="13" r="1.2".../><circle cx="19" cy="6" r="1.2".../>` |
| Properties | `props` tab icon: `<circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="16" r="2.6"/><path d="M9 9.5l1 4M15 9.3l-1 4.5"/>` |

**Helix** (`Helix/helix.html`, `.guide-card`) — all 4 reuse this file's own tab icons (lines 265-268):
| Heading | Icon (reused from) |
|---|---|
| Genetic Code tab | `genetic` tab icon (double-helix curve) |
| Sequence Tools tab | `seqtools` tab icon (ruler/lines) |
| Compare | `compare` tab icon (bracket comparison) |
| Vector Library | `vectors` tab icon (plasmid circle) |

**Spectra** (`Spectra/spectra.html`, `.guide-section`) — all 4 reuse this file's own tab icons (lines 321-324):
| Heading | Icon (reused from) |
|---|---|
| A280 — Beer-Lambert Law | `a280` tab icon (droplet) |
| Ratios — Nucleic Acid & Protein Purity | `ratios` tab icon (two overlapping circles) |
| Standard Curve — BCA / Bradford / A280 | `stdcurve` tab icon (dose-response curve) |
| Plate Reader — 96-Well CSV Import | `plate` tab icon (9-dot well grid) |
| General Tips | new glyph: lightbulb `<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11.2V16h6v-1.8A6 6 0 0012 3z"/>` |

**Protein Tools** (`Protein_Tools/protein_tools.html`, `.guide-section`) — all 4 reuse this file's own tab icons (lines 209-212):
| Heading | Icon (reused from) |
|---|---|
| Properties tab | `props` tab icon (right-angle ruler) |
| Cleavage tab | `cleavage` tab icon (scissor-cut lines) |
| Structure tab | `structure` tab icon (ribbon curve) |
| Target Intel tab | `ti` tab icon (concentric circles) |

**Echo** (`Labcyte_Echo/labcyte_echo.html`, `.guide-section`) — replaces the existing inline emoji (📁 ⚙️ 📊 🔬 📦 🎯 📈 🧪 💡) with SVG. 3 of 11 reuse this file's own setup-modal tab icons (lines 714, 716, 717); the rest are new or borrowed from the cross-app glyphs established above, since Echo's results-area tabs were never given B2 icons (B2 only covered Echo's setup-modal tabs):
| Heading | Icon |
|---|---|
| Input files | `files` setup-tab icon (folder), reused |
| Parameters | new glyph: gear `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>` |
| Output values | `output` setup-tab icon (download arrow), reused |
| Scatter & Selectivity plots | scatter-dot icon, borrowed from Degradation Explorer's glyph above |
| Box plot | new glyph: box/whisker `<rect x="6" y="9" width="12" height="7" rx="1"/><path d="M12 4v5M12 16v4"/>` |
| Selectivity plot | new glyph: crosshair/target `<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>` |
| Scatter tools | same scatter-dot icon as "Scatter & Selectivity plots" above (same underlying chart) |
| Curves tab | dose-response curve icon, borrowed from Spectra's `stdcurve` glyph above |
| Plate view | well-grid icon, borrowed from Spectra's `plate` / Lab Designer's `designer` glyph above |
| Properties tab | molecule icon, borrowed from Degradation Explorer's `props` glyph above |
| Tips | lightbulb icon, same as Spectra's "General Tips" glyph above |

### 2. Protein Tools — Target Intel section grouping

`Protein_Tools/protein_tools.html`, `.ti-card`. Group the 6 existing `.ti-section` headers into 2 clusters via a left-border accent, rather than leaving all 6 visually identical:

- **Identity** (the card's own profile/factual data: Gene, UniProt, Length, ChEMBL, Diseases, Function text) — `border-left:2px solid var(--accent)` (#9c6fd4, purple), label color also `var(--accent)`.
- **Everything else** (Drugs & mechanisms, Top disease associations, Structures (PDB), Network, Links — all "what we found out about it" reference/research content) — `border-left:2px solid var(--accent2)` (#0079b9, blue), label color also `var(--accent2)`.

This was chosen over two alternatives during Visual Companion review: a 3-cluster version (Identity / Pharmacology / Resources, adding `--accent3` teal) and a 6-distinct-colors version. The user picked 2 clusters. `--accent3` is not used by this treatment.

Each cluster wraps its member sections in one `<div style="border-left:...;padding-left:10px;">` containing the existing `.ti-section`/content markup unchanged — no change to the section content itself, only a wrapping div and a color override on the `.ti-section` label color (currently a flat `var(--text2)` uppercase label, per the existing CSS).

### 3. Cuppa — top-row visual weight rebalance

`Cuppa/cuppa.html`. The `#stat-month` card ("June 2026" total, built in `renderStats()` ~line 1396) currently uses `class="stat-card feature"`, which applies the same bold amber gradient as `.welcome-card`. Change it to plain `class="stat-card"` so it matches `#stat-overview` ("Monzo Pot / Active Members", ~line 1408), which is already plain. The Welcome card (`renderWelcome()`, ~line 1343) is unchanged and remains the row's single bold/gradient anchor.

This was chosen over two alternatives during Visual Companion review (shown against a real screenshot of the current 2-bold-vs-1-plain row): elevating the third card to also be bold (rejected — busier, no clear anchor), and leaving it as-is (rejected — the imbalance was the actual problem).

Removing the `feature` class also means the card's `.stat-progress`/`.stat-divider`/year-to-date sub-rows (currently styled for a white-text-on-gradient background, e.g. `color:rgba(255,255,255,.7)`) need their inline colors switched to the plain-card text tokens (`var(--text2)`/`var(--text)`) so they remain legible against the now-plain background instead of disappearing (white text on white card).

## Out of scope

- Lab Designer's `.gd-preview-wrap` — already fixed (Round 58), confirmed via live code, no action.
- Lab Designer's `.hist-card` Plate/Gel icon — reviewed via Visual Companion, user explicitly chose to leave the existing text+color pill as-is.
- Any other CSS/markup in these files beyond what's named above.

## Testing

- Playwright screenshot per app's Guide tab (6 apps), before/after, confirming each icon renders next to its heading with no layout shift or clipping, in both light and dark theme.
- Grep-based check that Echo's emoji characters (📁 ⚙️ 📊 🔬 📦 🎯 📈 🧪 💡) are fully removed from `.guide-section` headings after the edit (none should remain).
- Playwright screenshot of Protein Tools' Target Intel card (real lookup, e.g. existing test data) confirming the 2-cluster border-accent renders correctly in both themes.
- Playwright screenshot of Cuppa's top row confirming `#stat-month` no longer has the gradient background and its text remains legible (not white-on-white).
- Zero new console errors per app.
- Div-balance + JS-syntax check on each of the 7 touched files (Echo, Helix, Spectra, Protein Tools, Lab Designer, Degradation Explorer, Cuppa).
- `embed.py` rebuild lists all 11 apps with no errors; version bump + changelog + session log; commit + push.
