# Phase C, Tier 1: desktop density quick fixes (design)

## Overview

Part of the larger suite-wide audit (Phases A/B1/B2 already shipped as v1.1.8 — see `CLAUDE.md` Round 88/89, original plan at `/Users/jonmacicior/.claude/plans/delightful-soaring-truffle.md`). Phase C is the deferred "desktop density/visual-hierarchy backlog," organized into 3 tiers by how much design judgment each item needs. This spec covers **Tier 1 only**: the mechanical/quick fixes — containers that stretch too wide on desktop monitors, plus one sticky-header addition. Tiers 2 and 3 need their own brainstorming/Visual Companion passes later, scoped per app or cluster.

Reviewed via the Visual Companion: real before/after screenshots of the Hub home grid (2560px) and Cuppa's top-row (1600px) confirmed the "sparse/over-stretched" symptom is real. The remaining items were investigated directly (grep + targeted Playwright screenshots) rather than mocked up, since they're root-cause/mechanism questions, not visual-preference questions — and two of them turned out to have a different actual cause than the original audit's wording assumed.

## Scope

Six fixes across four files, all desktop-width-only (none touch the existing mobile `@media` breakpoints from Phase A). All CSS-only — no JS or markup changes.

| # | File | Selector | Symptom | Mechanism |
|---|------|----------|---------|-----------|
| 1 | `hub-shell.html` | `.home-wrap` | Home grid spreads to 8 columns + an orphaned card on ultra-wide monitors | Missing `max-width` |
| 2 | `Cuppa/cuppa.html` | `.tab-panel` (line ~524) | Top-row stat cards AND member-card grid both over-stretch | A later, unrelated rule sets `max-width:none`, silently canceling an *existing* `max-width:1280px` cap (line ~211) for every tab, not just the one it was meant for |
| 3 | `LDI/ldi.html` | `.params-strip` | Large dead gap between the param controls and the description text on wide desktops | Description text has `margin-left:auto`, which grows unbounded with no cap on the row |
| 4 | `Cryostorage/cryostorage.html` | `.boxes-grid` | Box cards can fill an entire ultra-wide row when there are enough of them | Already uses `auto-fill` (good), but has no `max-width` ceiling |
| 5 | `Spectra/spectra.html` | `.res-grid` | 2-4 result tiles stretch to fill a wide card, looking sparse | Uses `auto-fit`, which collapses empty grid tracks and redistributes their space into existing tiles |
| 6 | `LDI/ldi.html` | Results table wrapper | Long results tables scroll the header out of view | No sticky header; wrapper has no bounded height to scroll within |

## Fixes

### 1. Hub home grid

`.home-wrap{padding:48px 56px;}` → add `max-width:1280px;margin:0 auto;`.

No change to `.grid`'s `auto-fill` column logic — capping the wrapper is sufficient; fewer, evenly-sized columns form naturally once the available width is bounded.

### 2. Cuppa top-row + member grid

Cuppa already has the right fix in place (`.tab-panel{padding:22px 28px 32px;max-width:1280px;margin:0 auto;}`, line ~211) — a later rule in the same file's "MODERN WEBSITE REDESIGN" section overwrites it:

```css
.tab-panel{padding:28px clamp(16px,3vw,40px) 40px;max-width:none;}
```

Remove `;max-width:none` from this rule, keeping the `padding` change. This restores the pre-existing cap for every tab (Ledger, Members, Expenses, Stats), fixing both originally-reported symptoms (top-row stretch, member-grid stretch) with one edit, since both `.top-row` and `.members-grid` already use sensible sizing internally (`minmax(280px,360px) 1fr 1fr` and `auto-fill` respectively) and just needed a bounded parent.

### 3. LDI param strip

`.params-strip{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rlg);margin-bottom:16px;}` → add `max-width:1100px;margin-left:auto;margin-right:auto;` (additive properties, existing `margin-bottom` stays as-is rather than being folded into a `margin` shorthand, to avoid clobbering it).

This bounds how far the `margin-left:auto`-pushed description text on the right can drift from the actual controls.

### 4. Iceberg boxes-grid

`.boxes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}` → add `max-width:900px;`.

`auto-fill` is already correct (doesn't blow up sparse grids), but with enough boxes in a rack, a wide-enough monitor can still stretch the row past a reasonable width. Capping at 900px keeps box cards from growing beyond ~6 comfortable columns.

### 5. Spectra res-grid

`.res-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:4px;}` → change `auto-fit` to `auto-fill`.

No `max-width` needed — `auto-fit` is the actual bug (it collapses unused tracks and hands their space to existing tiles); `auto-fill` leaves trailing space empty instead, which is the standard fix for "a few grid items stretching too wide."

### 6. LDI sticky results-table header

Iceberg's existing sticky header (`thead{position:sticky;top:0}`, `Cryostorage/cryostorage.html` line 178) works because its table sits directly inside `.table-wrap{flex:1;overflow:auto;min-height:0}` — a bounded, self-scrolling flex child.

LDI's results table instead sits inside `<div style="overflow-x:auto;margin-bottom:18px;">` with no height bound. Per the CSS spec, setting `overflow-x:auto` with no explicit `overflow-y` silently promotes `overflow-y` to `auto` as well — making this div its own (non-functional) scroll container that never actually overflows, since its height just equals its content's height. A literal copy of Iceberg's CSS would have no visible effect inside this wrapper.

Fix: change the wrapper to `style="overflow-x:auto;max-height:60vh;overflow-y:auto;margin-bottom:18px;"` and add `#res-tbl thead{position:sticky;top:0;background:var(--bg);z-index:2;}` to LDI's CSS (background needed so the table body doesn't show through the sticky header as it overlaps scrolled rows; `var(--bg)` matches the page background the results table already sits on directly — unlike Iceberg's table, LDI's isn't wrapped in its own `var(--surface)` card).

## Testing

- Playwright screenshots per app at 1280px, 1600px, and 2560px desktop widths, before/after, for items 1-5 — confirm capped/adjusted containers look balanced and no layout regression at any of those widths.
- For item 6 (LDI sticky header): seed a results table with enough rows to exceed 60vh, screenshot mid-scroll, confirm the header stays pinned and rows aren't visually doubled/clipped.
- Confirm zero new console errors at each tested width, each app.
- Confirm none of Phase A's existing mobile `@media` rules (≤720px tiers) are affected — these are desktop-only additions with no media query (items 1, 3, 4, 5) or a property removal that's already non-mobile-gated (item 2).
- Div-balance + JS-syntax check per touched file (same convention as every prior round).
- `embed.py` rebuild, version bump, changelog, session log, commit + push — same as Phases A/B1/B2.

## Out of scope

- Tier 2 (layout rework: Echo's setup-modal whitespace, Degradation Explorer's empty-state, Protein Tools' uneven card heights, Spectra's axis-label sizing, Lab Designer's control-panel layout) and Tier 3 (new visual components: thumbnails, icon-hierarchy, left-border accents) — each needs its own brainstorming/Visual Companion pass, scoped later.
- The Hub's `.card-arrow` Unicode-to-SVG-chevron swap — confirmed out of scope for this round (cosmetic, not a density fix); can be revisited separately if wanted.
- Any other Cuppa CSS cleanup beyond the one `max-width:none` removal — the file's broader "two competing CSS layers" technical debt (logged in `CLAUDE.md` Round 88) is not being consolidated here, just this one specific regression.
