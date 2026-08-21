# Phase C, Tier 2: Desktop layout-rework fixes (design)

## Overview

Part of the larger suite-wide audit (Phases A/B1/B2 shipped as v1.1.8; Phase C Tier 1 shipped as v1.1.9 — see `CLAUDE.md` Round 88-90). This spec covers Phase C, **Tier 2**: the "layout rework" tier of the desktop-density backlog, which needs actual spacing/layout judgment rather than Tier 1's mechanical max-width caps.

## Scope correction

The original audit backlog listed 7 items across 5 apps (Echo, Degradation Explorer, Protein Tools, Spectra, Lab Designer). Before building anything, each item was directly investigated against the live apps (grep + Playwright screenshots + computed-style checks), the same diligence applied throughout this project's prior rounds. **5 of the original 7 items did not hold up**:

- **Spectra's heatmap legend** already has a working gradient swatch (`.legend-bar{background:linear-gradient(...)}`) — the audit's "text-only" framing was wrong.
- **Protein Tools' "uneven card heights"** — measured with real example data loaded: both `.props-grid` cards are exactly 266.65625px tall, identical. No fix needed.
- **Lab Designer's "sparse single-column gd-ctrl form"** — the control panel already pairs related fields in 2 columns (Format/Title, Label position/Orientation, Well size/Lane numbers). Nothing to convert.
- **Lab Designer's "well-type color-picker form layout"** — opened it directly; it's a clean, compact swatch+text-input+Add/Cancel row. Nothing to fix.
- **Echo's "setup-modal vertical whitespace" + "sidebar file list"** — the "sidebar file list" doesn't correspond to anything in the actual Files tab (no sidebar concept exists there; `#qc-sidebar` is an unrelated compound-selector list gated behind having run an analysis). The modal's own spacing, examined at full resolution rather than a scaled/backdrop-blurred screenshot, is clean and intentional — not a dead-space bug. Dropped entirely.

One genuinely real substitute issue was found while investigating Lab Designer (its Gel Designer preview pane has ~600px of empty space below a 102px-tall preview) but the user reviewed a before/after comparison and chose to leave it as-is — the top-anchored "build top-down" convention was judged the better fit for a builder tool, not worth the change.

**Final scope: 3 fixes, 3 files**, all reviewed and approved (2 via direct text proposal, 1 via Visual Companion before/after).

## Fixes

### 1. Degradation Explorer — empty-state CTA button

`Degradation_Explorer/degradation_visualizer.html`. The Table tab's empty state (`.empty-state`, used when no Excel file has been loaded) already shows an icon and explanatory text, but has no clickable affordance — the user has to notice the separate "Load Data" tab on their own. Add a button to the empty state that calls `switchTab('load')`, reusing the existing tab-navigation function (no new file-picker logic — the actual upload dropzone already lives on the Load Data tab).

Button label: "↑ Go to Load Data" (matches the up-arrow glyph convention already used by Echo's tab icons for an upload concept). Button style: bordered, accent-colored text on `var(--surface)` background (an outlined secondary-style button, not a filled primary one, since this is a navigational nudge rather than the page's main action) — matches the visual weight already used by this app's other secondary actions (e.g. `.btn-load-test`). Reviewed and approved via Visual Companion before/after comparison.

### 2. Protein Tools — chart divider

`Protein_Tools/protein_tools.html`. The Hydrophobicity Profile and Charge vs pH charts sit side-by-side in `.props-grid`'s two `.chart-half` panels with zero visual separation (confirmed via computed style: `border: 0px none` on both). Add a `border-left:1px solid var(--border)` plus a small left-padding bump to the second `.chart-half` (Charge vs pH) so a thin vertical rule separates the two charts. Matches the subtle, low-contrast divider weight already used for card borders elsewhere in the suite — not a heavy/dark rule.

### 3. Spectra — Standard Curve axis tick-label font

`Spectra/spectra.html`. The Standard Curve canvas's axis tick labels (the small numbers along both X and Y axes, rendered via `ctx.font = '10px ' + getCSSVar('--mono')`) are smaller than the axis title labels (`11px ' + getCSSVar('--sans')`) right next to them. Bump both tick-label font declarations from `10px` to `11px` for consistency and readability. Pure canvas text-rendering change — no layout/positioning side effects, since the canvas's own coordinate math doesn't depend on this font size.

## Out of scope

- Gel Designer's preview-pane dead space — investigated, a real before/after comparison was reviewed, user explicitly chose to leave current top-anchored behavior unchanged.
- Tier 3 (new visual components: thumbnails, icon-hierarchy, left-border accents per the original audit) — still queued, needs its own brainstorming/Visual Companion pass.
- Any other CSS cleanup in these 3 files beyond the specific properties named above.

## Testing

- Playwright screenshot per app, before/after, at a standard desktop width (≥1000px) — confirm the CTA button renders and is clickable (calls `switchTab('load')` and the Load Data panel becomes active), confirm the chart divider renders as a thin line between the two chart halves in both light and dark theme, confirm the axis tick labels are visibly the new size.
- Zero new console errors per app.
- Div-balance + JS-syntax check on each touched file, same convention as every prior round.
- `embed.py` rebuild lists all 11 apps with no errors; version bump + changelog + session log; commit + push.
