# The visual system

The standard every app is edited against. It is **not** a stylesheet anyone imports — there is no
build step and no module system here, so each app carries its own copy. What this document does is
stop the twentieth app from inventing its own eighteenth grey.

Read this before touching an app's CSS. If something you need is missing, add it *here first*, then
in the app.

---

## Tokens

Every app declares the same names. Two scales, no loose values.

```css
:root{
  /* type — nine steps, and nothing between them */
  --fs-1:10px; --fs-2:11px; --fs-3:12px; --fs-4:13px; --fs-5:15px;
  --fs-6:17px; --fs-7:20px; --fs-8:26px; --fs-9:38px;
  /* radius — one scale, five steps */
  --r-1:4px; --r-2:6px; --r-3:9px; --r-4:13px; --r-full:999px;

  /* light is the default; dark is the override */
  --bg:#f4f5f8; --surface:#ffffff; --surface2:#f0f1f5; --surface3:#e4e6ee;
  --border:rgba(0,0,0,0.07); --border2:rgba(0,0,0,0.13);
  --text:#1a1d2e; --text2:#5a5f7a; --text3:#7c8199;

  --accent:#5e87c5;                      /* ONE blue, every app, everything interactive */
  --accent-dim:rgba(94,135,197,0.12); --accent-soft:rgba(94,135,197,0.22);
  --brand:<the app's own colour>;        /* its logo box and its card tint — nothing else */

  --good:#2d9462; --warn:#c47818; --danger:#c04040;
  --paper:#fbfaf6;                       /* Labbook only: a Notebook page. Warm, not --surface */

  --sans:'IBM Plex Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;

  --shadow-xs:0 1px 4px rgba(0,0,0,.04);  --shadow-sm:0 2px 8px rgba(0,0,0,.06);
  --shadow-md:0 6px 24px rgba(0,0,0,.09); --shadow-lg:0 16px 48px rgba(0,0,0,.14);
  --ease:cubic-bezier(.2,.8,.3,1);       /* everything the pointer touches */
  --ease-out:cubic-bezier(.16,1,.3,1);   /* something arriving: a panel, a screen */
  --dur-1:120ms;                         /* a control answering the pointer */
  --dur-2:200ms;                         /* a panel, a popover, a dialog */
  --dur-3:300ms;                         /* a screen */
}
[data-theme="dark"]{
  --bg:#0d0f14; --surface:#13161e; --surface2:#1c2030; --surface3:#252a3a;
  --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.13);
  --text:#e8eaf2; --text2:#8b90a8; --text3:#7b8099;
  --accent:#8aaee0; --accent-dim:rgba(138,174,224,0.16); --accent-soft:rgba(138,174,224,0.26);
  --good:#6ddca8; --warn:#f0b060; --danger:#f08a84;
  --paper:#1a1917;
  --shadow-xs:0 1px 4px rgba(0,0,0,.30);  --shadow-sm:0 2px 8px rgba(0,0,0,.40);
  --shadow-md:0 6px 24px rgba(0,0,0,.50); --shadow-lg:0 16px 48px rgba(0,0,0,.55);
}
```

**Section colours are data, not tokens.** Labbook's Notebook paints each section in one of eight
muted colours (`NB_COLORS`, keyed `blue … slate`, the key is what the record stores). They reach
CSS as a single custom property, `--nb-c`, set inline on the row, the pages header and the page,
so one property paints the tab, the active tint (`color-mix` with `transparent`) and the rule
under the title. They are the one place a colour other than `--accent` is interactive, and they
are what tell two sections apart at a glance — the reason OneNote has them.

**Light is the default and dark is the override.** An app written dark-first (`:root` dark,
`[data-theme="light"]` light) still works, but it means the light palette — the one the Hub actually
opens in — is the special case, and every new rule gets written for the wrong theme first. Flip it.

**Rules, not suggestions**
The radii were cut by about a third in 2026-08-26 (6/10/14/20 → 4/6/9/13). Rounder corners read
as informal; this is a lab record, and the chrome should look like one. `--r-full` is unchanged —
a pill or a dot is a shape, not a softened rectangle.

There used to be **two** radius scales: this one and a legacy `--r1/--r2/--r3/--r4` at
10/12/16/24px, left alive in 16 files by the token migration. Two scales that can disagree is a
trap — a card and the card beside it could be rounded from different tables and nothing would
say so — so the legacy names were merged into this one by role (`--r2` → `--r-2`, `--r3` →
`--r-3`), 49 uses and 35 declarations, and deleted. **There is one radius scale. Do not add a
second.**

- No loose `px` for `font-size` or `border-radius` anywhere in a stylesheet. Two exceptions, both
  narrow: values inside JS strings, where rewriting them blind would be risky; and **text drawn
  inside an SVG** (a label on a plasmid ring, a tick on an axis), which is sized against the
  drawing's viewBox and is part of the picture, not of the interface.
- `--accent` owns everything interactive: focus rings, active tabs, links, primary buttons,
  selection. `--brand` appears in exactly two places: the 32px logo box and the app's card.
- Semantic colour is `--good` / `--warn` / `--danger`, never a raw hex. The exception is a
  **print stylesheet** (`#print-root`, `@media print`): paper has one theme, so fixed values there
  are correct and theme tokens would be wrong.
- Every colour has a dark value. If you cannot say what a rule does in dark mode, it is not done.

**Motion** — three durations and two curves, the same in every app. The scale was declared in the
shell in 2026 and shared with nobody until 2026-08-31, which is how twenty apps ended up each
having its own idea of how fast a hover is, or none at all.

- **Everything the pointer can act on transitions.** A control that changes colour, border or
  shadow on hover, focus or press and does it instantly reads as unfinished — that, not slowness,
  is what "sloppy" turned out to mean. Use `--dur-1` and `--ease`.
- **The shared list is `background-color, color, border-color, box-shadow, opacity`.** Never
  `all`, and never `transform` in a blanket rule: transform is what drags, pans and canvas zooms
  are made of, and a transition on it makes them trail the pointer. Name it per element where the
  element really moves.
- **Nothing repeated in bulk gets one.** A plate well, a freezer slot and a table cell are
  restyled hundreds at a time; a 120 ms colour fade on each is slower *and* harder to read.
- **Something that appears arrives.** A dialog, popover or overlay that switches on one class can
  be animated in CSS alone — `@starting-style` for the from-state, `transition-behavior:
  allow-discrete` so `display` waits for the exit. A browser without either lands on exactly the
  un-animated behaviour, so it is safe to add. Always pair it with `pointer-events:none` on the
  closed state: a backgrounded tab does not advance a transition, and an overlay stuck mid-exit is
  full-screen, invisible and still clickable.
- **Every app carries the `prefers-reduced-motion` block** that clamps every duration to 1 ms.
  That is what makes motion something you may add without asking.
- **An icon moves while you point at it, once — never in a loop.** A motif is a 400–900 ms
  animation on the icon's own parts, under `@media (hover:hover)`, keyed on a root class
  (`svg.mo-<app>`) so it travels with the SVG wherever it is copied. A 24px glyph cycling
  forever beside the thing you are reading is decoration you cannot turn off.
- **Animate `transform` and `opacity`, nothing else, for anything that moves across the
  screen.** The browser can run those two off the main thread. `clip-path`, `stroke-dashoffset`,
  `background-color` and sizes are painted on the main thread, and they stutter exactly when
  something is loading, which is when they are most likely to run. A motif starts and ends at
  rest and plays to its end once started (`.ic-play`); it is never cut off by `:hover` ending.
- **Motion that crosses screens must start from where you clicked.** An app grows out of the card
  that opened it (a `clip-path` from the card's rect); anything opened from elsewhere fades. A
  grow with no origin is the generic kind, and that is what the Hub stopped being.

**Scrolling** is part of the same standard.

- Every inner scroll pane gets `overscroll-behavior`, and the **axis is named**: `-y` on a
  vertical pane, `-x` on a horizontal strip. A blanket `contain` on a horizontal-only scroller
  swallows the vertical wheel that was meant for the page underneath it.
- **No `{passive:false}` wheel or touch listener on `document`.** It tells the browser that every
  scroll gesture anywhere in the app might be cancelled by JS, so the whole app scrolls off the
  main thread to serve one grid. Bind it to the element that needs it, or add it on drag start and
  remove it on drag end.

**Bars, and the two ways they go wrong.** Both have now been fixed in six apps, which is what
makes them rules rather than incidents.

- **One height per bar.** A toolbar's controls take one height, set as `height` *and*
  `min-height` from a `--tb-h` token on the bar — 32px, 40px under `(hover:none)`. `min-height`
  alone is not enough: a label that wraps grows past it, so the control also needs
  `white-space:nowrap`. A dialog footer is a bar too.
- **`margin-left:auto` and a `flex:1` spacer are one-line idioms.** They read as "push right"
  only while the bar is one line; the moment it wraps, the pushed element keeps its margin (or
  the spacer grows on the new row) and lands on the right of the *second* line, leaving a hole
  under a left-aligned first row. Drop the auto margin, or hide the spacer, at the width where
  the bar wraps — and when the wrap depends on content rather than viewport width, make the row
  `nowrap` and let one element ellipsis instead.
- **A note about a field belongs with its label, not after its control.** A labelled field is
  `justify-content:space-between` — label at the top of the cell, control at the bottom — so a row
  lines up however long its labels are. Put a caption *after* the input ("from the steps above",
  "from the plate format") and it takes part in that: the control lifts off the line its
  neighbours sit on, by as much as 19px. Put it inside the label.
- **A checkbox whose label is a sentence needs its own row in a narrow panel.** `.ci-f.chk` asks
  for the width of two fields for exactly that reason; where the panel is narrower than the one it
  was sized for the sentence still wraps, the cell grows, and the box — correctly staying on the
  line the sentence starts on — ends up above everything beside it. Give it `grid-column:1/-1`
  there rather than letting it share a row it cannot fit in.
- **When the bar's width comes from a pane rather than the window, use a container query.**
  `@container` is the only thing that can see it. Labbook's step header is nine controls in a
  block whose width is whatever the editor pane leaves it — 617px on a 1440px screen with the
  panes open — so the collapse-to-`⋯` is keyed on `.blk`'s own inline size, not the viewport's.
  A browser without container queries keeps the viewport rule, so it is additive.

**Chrome yields before content does.** In a multi-pane layout the panes are chrome and the
editor is the product. Labbook's tree + page list + right dock are 740px of a 1024px window; the
content had 272px, less than any one of them. The dock becomes an overlay below
`LB_DOCK_FLOAT_MAX`, and the two left panes are *clamped at render time* — the stored widths are
never rewritten, so widening the window brings the panes back to exactly the size they were
dragged to.

---

## The audits

Five scripts, and each answers a question the others cannot.

| | what it can see |
|---|---|
| `tools/audit_app.py --xref` | dead CSS classes, unreachable functions, orphaned data tables |
| `tools/audit_align.js` | whether the controls on one row actually line up, and wrapped rows |
| `tools/audit_runtime.js` | what only a loaded page knows — see below |
| `tools/mobile_sweep.mjs` | Labbook on an emulated iPhone: 62 screens, both engines, with the three above — see *The phone* |
| `tools/snap_compare.mjs` | whether a CSS change changed any pixel, at any width, on any screen |

**`tools/audit_runtime.js`** loads an app in an iframe and reports: an inline handler naming a
function that no longer exists (nothing throws until somebody clicks, so neither a grep nor a
smoke test finds it); a duplicate element id (`el('x')` returns the first, so the second is
silently inert); text whose colour matches what is behind it, in either theme; and content
pushed outside a clipping box with no scroller between it and the edge.

Four of its rules exist because each was a false positive first, and they are why its findings
can be trusted:

- **Kill transitions before reading a computed style.** A `getComputedStyle` during a transition
  returns the tween, and in a tab that is not compositing the tween never finishes — so with
  `background-color` transitions on every surface, flipping the theme made *every* themed card
  look like it had no dark value. The first run reported 60 invisible-text findings; two were
  real.
- **A gradient has no single colour to compare against.** Walking past it to the page background
  reported white text on a blue card as invisible — every line of Cuppa's welcome card.
- **Judge an element on its own text, not its subtree's.** A wrapper whose first child is the
  newline before a `<div>` was being judged on all of its children's text against its own colour.
- **Clipping is a descendant's right edge past the content edge, not `scrollWidth`.** A padded
  flex column reports 24px of overflow it does not have; `text-overflow:ellipsis` *is* deliberate
  truncation; and content inside an intermediate scroller is reachable, so the container it
  overflows is not at fault.

---

## Paper, not dashboard (Labbook, 2026-09-22)

The notebook is a sheet of paper, not a wall of cards. In Labbook the editor pane is the
sheet (`--surface`), the columns beside it are the desk (`--bg`), and nothing inside the sheet
is boxed: a section is a sentence-case heading (`--fs-4`, 600, `--text2`) over one hairline,
content flush left; a step is a row with a hairline above it; a calculator is a 2px left rule.
No `backdrop-filter` anywhere (the `--glass-*` tokens survive as names and resolve to the
flat surface), no shadow except on floating layers (popovers, dialogs, tooltips), no
uppercase micro-label — 76 of them were the thing that read as "dashboard". Uppercase stays
only where the text is a code (a project prefix, `DD_NB20260920`, a well id, a unit).

**Controls appear when you reach for them.** Under `@media (hover:hover)` the tools on a row
or an object (a step's grip · camera · ⋯, a plate card's Edit · ⋯, a calculator's Inputs ·
×, "Why these numbers", a file's actions) sit at `opacity:0` and come up on `:hover` or
`:focus-within` — `opacity`, never `display:none`, so they stay laid out for the keyboard and
the audits. Under `(hover:none)` nothing is hidden: hover would hide them on exactly the
devices that cannot hover. The experiment banner's actions are always visible on purpose.

## Components

**Header** (each app keeps its own — it is what makes the file usable on its own, and the shell
hides it when embedding). 48px min-height, `--surface`, one bottom border:

```html
<header>
  <div class="logo">…20px svg…</div>            <!-- 32×32, --r-1, background:var(--brand) -->
  <div><div class="app-name">Echo</div><div class="app-sub">…</div></div>
  <div class="grow"></div>                       <!-- actions live on the right -->
</header>
```
`.app-name` = `--fs-5`/600. `.app-sub` = `--fs-2`/`--text2`.

**Button** — three kinds and no more. Pill radius (`--r-4`), 32px high, `--fs-3`:
| kind | look |
|---|---|
| primary | `background:var(--accent)`, white text, 600 |
| default | `1px solid var(--border2)`, `--text2`, transparent; hover → `--surface2` and `--text` |
| danger | same as default until hover, then `--danger` |

**Input / select / textarea** — `--surface2` fill, `1px solid var(--border2)`, `--r-2`, 7px 11px,
`--fs-3`. Focus: `border-color:var(--accent)`. Never a browser-default outline left visible.

**Tabs** — a row of text buttons over a 1px `--border` rail; the active one is `--text`/600 with a
2px `--accent` bottom border. Not pills, not boxes.

**Card** — `--surface`, `1px solid var(--border)`, `--r3`, `--shadow-xs`; hover lifts 3px and goes
to `--shadow-md`. A card header is `--fs-2`/700/uppercase/1.3px in `--text3`.

**Panel** — the same surface without the hover: a titled box inside a screen.

**Table** — header row `--fs-2`/700/uppercase/`--text3`, cells `--fs-3`, rows separated by
`1px solid var(--border)` and nothing else. Numbers in `--mono` with `font-variant-numeric:
tabular-nums`. Wide tables scroll inside their own `overflow-x:auto`, never the page.

**Modal** — backdrop `rgba(0,0,0,.45)` (dark: `.65`), panel `--surface`, `--r3`, `--shadow-lg`,
title `--fs-6`/700, actions bottom-right with the primary last.

**Badge** — `--mono`, `--fs-1`, 700, uppercase, `--r-4`, tinted background at ~16% of its semantic
colour.

**Empty state** — an icon at 44px and 50% opacity, a `--fs-5` line saying what is missing, and one
sentence saying what to do about it. Never a bare "No data".

**Icons** — 24-unit viewBox, `stroke-width:1.5`, `stroke-linecap/linejoin:round`, rendered at their
native size with `shape-rendering:geometricPrecision`. Outline only. No emoji as iconography.

An icon set *inside a line of text* — a chevron in a button label, a marker on a chip — is the
same 24 viewBox rendered at 12–15px with **`stroke-width:2`**, because 1.5 scaled to 13px lands
under one device pixel and turns to mud. Labbook's `tbIco(path, size)` is that variant;
`tbSvg(path)` stays the native-size one.

**Two things the earlier sweeps missed, so check both:**
- **Entity-encoded glyphs.** `&#9200;` is ⏰. Grepping for literal emoji found nothing and the
  snooze button kept its alarm clock for another two releases. Sweep decimal entities too.
- **`content:'▸'` in CSS.** A stylesheet cannot hold an SVG inline, so these hide from a markup
  sweep. Draw the shape in CSS (a rotated border corner makes a chevron; a `border-radius` box
  makes a dot) or use a `background-image:url("data:image/svg+xml,…")`.

**Never use a semantic `<header>` inside an app.** The shell injects
`header{display:none!important}` into every embedded app to strip its own title bar, so any
`<header>` you add anywhere in the tree silently vanishes once it is inside dHUB — and only
inside dHUB, so the standalone file looks fine while the real product does not.

**What is *not* iconography, and must be left alone:** the scatter-plot marker palettes in
Echo/BCA/Beacon (`■ □ ▲ ● ○ ◆ ★ ♂ ♀ ⌠ ⌡` and the rest — those are chart marks a user picks
from), the `✓` inside a checkbox, `→` in prose, and sub/superscripts. Cuppa and Fabricata keep
their warm glyphs on purpose.

---

## Layout

- Content column max 1180px, 20–26px page padding, 14–16px grid gap.
- Breakpoints: **1100** (three columns → two), **900** (two → one, cards go full width), **760**
  (the shell's rail becomes a bottom bar; touch targets ≥44px), **640** (phone padding).
- Nothing scrolls the page horizontally. Ever. Wide things scroll inside their own container.

---

## The phone

Everything that decides how an app lays itself out under 760px lives in **one `@media
(max-width:760px)` block at the end of the last stylesheet**, with a `@media (hover:none)` block
beside it for what a device with no hover needs at any width. Last on purpose: a `@media` rule
earlier in the sheet loses to a plain rule further down at the same specificity, and that is how a
phone rule was silently overruled twice in Labbook. Narrower thresholds (720 / 640 / 560) are
**nested** inside the phone block, never widened to 760 — widening them re-lays-out tablet windows
between 561 and 760px that nobody asked about. A move like this is proven with
`tools/snap_compare.mjs` (identical pixels at 375 / 600 / 700 / 760 / 1024 / 1440) before a single
new rule is written.

**The type scale moves one step up on a phone** (`--fs-1` 11 · `--fs-2` 12 · `--fs-3` 13 · `--fs-4`
14 · `--fs-5` 16; the two largest stay). 10px labels and 13px prose are a desktop read; a phone is
held at arm's length under a hood. This is separate from the 16px rule for form controls, which is
about iOS zoom, not legibility.

**Navigation is a bottom bar the app owns when nothing else does.** Inside dHUB the shell's
`#ws-tabs` is the bar; a standalone build on a phone draws its own (`_phoneTabs() = !lbHost() &&
_rbNarrow()` in Labbook), and every fixed element at the foot of the screen — FAB, timers, toast,
drawers — adds the bar's height from one token (`--lb-tabbar-h`) plus `env(safe-area-inset-bottom)`
so nothing is drawn under it. The bar is exactly the token tall; its buttons fill it. Content wraps
end above the bar (padding on the wrap, not on the scroll container).

**Every menu is a bottom sheet; every dialog is a bottom sheet.** A 250px popover of 12px rows
anchored to a fingertip clips its tenth item behind a scrollbar; a sheet is the same list at 16px
in ≥44px rows, pinned to the foot of the screen above the bar, scrolling inside itself when it must.
A dialog is full width from the bottom with its title and its footer sticky (negative margins over
the padding, a solid background), **every variant named** in the rule — `.modal.wide` is (0,2,0)
and a bare `.modal{max-width:none}` loses to it whatever the order. Four things a sheet meets that a
popover never did:

- **The long press's release closes it.** A popover opens under the finger, so the release's
  synthesised `mousedown` lands inside it (hence the arming delay); a sheet is never under the
  finger. The document closer must skip inside the same 700 ms window the click-swallow uses.
- **The backdrop is a sibling, never a `::before`.** The sheet carries `backdrop-filter`, which
  makes it the containing block for a fixed child — the `#pl-band` trap. And the backdrop's own
  `click` still arrives after the closer has acted on `mousedown`, so the handler ignores a click
  within 400 ms of a menu closing, or it shuts the drawer the menu was opened from.
- **Inline `left/top` from a previous popover placement beat the stylesheet's `left:0;right:0`.**
  Clear them when switching an element to sheet mode.
- **`@starting-style` flips.** The popover's from-state is `translateY(-4px)`; the sheet's is
  `translateY(100%)`, and the rule has to outrank `.pop.open{transform:none}`.

**A row you tap is 44px, and it is whole.** `.pop-item`, `.dlg-item`, `.dlg-ans`, tabs. A row
scrolled out of view inside its own sheet is reachable; a row the sheet shows but the screen cuts
off is the finding. Selects on WebKit draw 25px tall at 16px and ignore `min-height`: give a row's
controls `height` outright.

**Never `body:has(...)`.** It is the obvious way to say "a dialog is open" and it made every
`innerHTML` replacement in Labbook **6× slower** — a `:has()` on body makes the engine re-check the
whole subtree on every mutation. Watch the eight elements for a class change with a
`MutationObserver` and toggle a body class.

**A touch drag needs a direction lock.** A `touchstart` that arms a drag on any chip cancels every
scroll that begins on one, and on a phone a planner *is* chips. On the first move, `|dy|>|dx|` is
the scroll it always was; only a sideways move becomes a drag. Not long-press-armed where the chips
already carry `oncontextmenu` — the press is their menu.

**Glass costs a compositor layer per element.** A blurred `.blk` per step is forty layers under a
finger. Under `(hover:none)` the repeated surfaces go solid and keep their tint; one blur each on
the ribbon, the sheet and the dialog is fine. The fixed gradients behind everything are off too.

**Nothing hidden is rebuilt.** A list inside a closed drawer, panels inside a closed dock: skip the
build and mark it stale; the thing that opens the drawer builds it. And a render that flushes layout
itself costs the same frame as one that leaves it dirty — a perf harness that times only JS has to
force the read inside the timed region, or it praises the wrong build.

**Dense grids get staggered headers.** Column labels wider than the column ("12.3 nM" over a 21px
well) overlap however small the font; under a 30px pitch each header spans two columns and the
headers alternate between two rows, evens up aligned left, odds down aligned right, with the space
before the unit dropped. Same rule in every renderer of the same grid, or they disagree.

**The sweep.** `node tools/mobile_sweep.mjs` (with `python3 -m http.server 8899` running) emulates
an iPhone — touch, DPR 3, mobile UA — plants a deterministic notebook, drives every screen at two
sizes in both themes and asserts: no sideways scroll, no two fixed elements overlapping, every
tappable row ≥44px and inside the viewport, no visible text under 11px outside the plate grids,
`__runtimeAudit`/`__alignAudit`/`__fitAudit` empty, no console error, a long press that opens a menu
still open 800 ms later, a tap on an item firing exactly once; then a perf table under 4× CPU
throttling against a saved baseline (`--baseline`). `--engine=webkit` is Safari's engine;
`--embedded` is Labbook inside an iframe as dHUB hosts it; `--url` takes the built standalone;
`--only=` a subset; `--perf-only --reps=7` the numbers alone. The in-app Browser pane still cannot
register a service worker and cannot advance a transition while hidden; the sweep does not have
either problem.

### The whole Hub on a phone (2026-09-29)

Jon's rule, in his words: *everything on screen can be seen, nothing overlaps, and a screen that
cannot fit says so instead of drawing something nobody can read.* `tools/mobile_hub_sweep.mjs`
enforces it over the shell and all 17 apps in their real frames (below). What it changed:

- **One phone type scale in every file**, not only Labbook: `--fs-1…5` step up under 760px **and on a
  phone held sideways** (`(hover:none) and (pointer:coarse) and (max-height:520px)`; 844px wide is
  "desktop" to a width query). Markup built in JS strings carries its size inline where no token
  reaches it, so the same block has an attribute net (`[style*="font-size:10px"]:not(svg *)`) — HTML
  only; SVG text scales with its viewBox. **10px is the floor for a plate's axis labels and nothing
  else.**
- **A phone held sideways is 844×390 — wide and short.** The shell keys on height: `--top` 44px (not
  58), the rail of icons at 52px instead of the bottom bar, no labels. A 58px header plus a 56px tab
  bar left an app 276px of a 390px screen. Anything with a fixed header or tab row must budget for
  height the same way.
- **A banner takes space; it never covers it.** The sync notice sits in the layout
  (`--hub-notice-h`, measured, updated on resize/rotation) and `#hub-home`, `.app-view` and the
  announcement bar start below it. It used to be two fixed strips stacked on the first 41–65px of
  every app. It has a visible ✕.
- **Rows of tabs and filter pills wrap; they do not scroll.** A strip that scrolls slices a label in
  half at the edge and says nothing about what is behind it. (Data tables still scroll inside their
  own container — that is what a table is.) Setup tabs in a 300px dialog share the width.
- **A screen that cannot be drawn honestly in portrait carries a note.** `.rotate-note` (icon +
  "Turn your phone sideways" + why) is shown by `@media (max-width:640px) and (orientation:portrait)`
  while the thing it stands in for is hidden, keyed on a body/modal class the app sets from the one
  place the state changes (Lumina `lm-needs-landscape`, Blueprint `pd-needs-landscape` in
  `buildPlateArea`, Labbook `#plate-modal.pl-384`). **The controls that undo the cause stay** (the
  96/384 switch) — the note must never be a dead end. Today the case is a 384-well plate: 24 columns
  cannot be read or tapped at 390px. `GATES` in `tools/mobile_hub_scenarios.mjs` checks the whole
  contract in both orientations: the note is on screen and the plate is not, and the reverse.
- **File order decides between equal specificities, and the phone rule was first.** Cell Archive's
  two-line list row was written before the seven-column rule it was meant to override, so on a phone
  the list was 234px wider than its card — the vial badge, the medium and "Add cell line" outside
  it, nothing to scroll. The phone rule goes **after** the rule it overrides. A list whose layout
  depends on the width *it* has (the rail comes and goes) is a container query, not a media query.
- **An `overflow:hidden` flex child shrinks instead of letting its parent scroll.** Cell Archive's
  list and Echo's plot panel were squeezed to the room left and clipped their own rows and buttons.
  `flex:none` on the child, `overflow-y:auto` on the panel.
- **A flex `<input>` needs `min-width:0`.** It keeps its intrinsic width otherwise: Ribbon's "Go"
  sat 16px under the viewer.
- **A full-screen sheet is opaque.** Settings drew at 86% over the page, and the text behind showed
  through as a ghost. Glass is for things that do not cover text.
- **A menu anchored to a button is measured after it opens** and shifted inside the screen on both
  axes (Blot's ⋯ was 21px off the left edge and its last items 56px below the fold).
- **Plate concentration headers stand up** (`writing-mode:vertical-rl`) when the column is narrower
  than the text ("12.3 nM" over a 22px well), and a control well prints "100", not "100%", below 30px.
- **Wrapped rows start at the same edge**: `justify-content:space-between`, not `margin-left:auto`
  (Lumina's header, Dora's controls between 641 and 1000px — the ≤640 fix did not reach a phone
  held sideways).

**The hub sweep.** `python3 embed.py && python3 -m http.server 8899` then
`node tools/mobile_hub_sweep.mjs [--sizes=390x844,375x667,320x568,844x390,667x375] [--themes=light,dark]
[--engine=webkit] [--only=echo,pd,rotate] [--shots=DIR] [--offline] [--verbose] [--strict]`. It signs
in a stubbed Firebase (or blocks it with `--offline`), opens each screen the way a person would
(rail, cards, Cmd+K, Settings), seeds every app with its demo data, and **crawls** — every tab-like
control and every button that opens a dialog is pressed once, the screen measured, the dialog put
away. At each screen it reports: `overlap` (two painted lines of text intersect), `covered` (text
with something else painted over it), `clipped` (cut by an `overflow:hidden` ancestor or the screen
edge with nothing to scroll), `offscreen` (a control cut by an edge), `strip` (a tab or chip sliced by
a scrolling row), `spill` (text sticking out of its own bordered box), `sideways` (the page scrolls
horizontally), `fixed` (two fixed layers overlapping), `tiny` (under 11px), `unfit` (the rotate-note
contract), `truncated` (an ellipsis — advisory, `--strict` fails on it), plus the runtime and
alignment audits. Each screen is measured at the top and again with every scroller at its end, so
what can never be scrolled clear (the last row under the tab bar) is a finding. It ignores what is
by design: whatever a dialog, sheet or toast covers; a sticky header over the rows that scroll under
it; a closed `<details>`; `pointer-events:none` overlays; and clipping that does not apply to a fixed
or absolute element (the clip chain is the containing-block chain, which is why Echo's fixed setup
dialog inside a 137px `<main>` is not "cut").

---

## The audit

Before calling an app done, run the two checks the repo has always used:

```bash
# a CSS class defined and never used anywhere after </style>
# a function defined and never referenced beyond its own definition
python3 - <<'PY'
import re,sys
s=open(sys.argv[1] if len(sys.argv)>1 else 'apps/echo/echo.html',encoding='utf-8').read()
head,_,tail=s.partition('</style>')
print('CSS:', [c for c in sorted(set(re.findall(r'\.([a-zA-Z][\w-]+)',head)))
               if not re.search(r'\b'+re.escape(c)+r'\b',tail)])
print('JS :', sorted({n for n in re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',s)
      if len(re.findall(r'\b'+re.escape(n)+r'\b',s)) <= len(re.findall(r'function\s+'+re.escape(n)+r'\s*\(',s))}))
PY
```

Then open the app **on its own** (not only inside the Hub) in light and dark, at 1440 and 375, and
check the console is clean. An app that only works embedded has stopped being portable, and that is
what keeps the Archive PWA, `labbook-standalone` and the ChemLib hand-off alive.

## Tertiary text still has to be read (2026-10-07)

`--text3` was 2.6:1 on white and 2.4:1 on the dark surface — a colour for things nobody needs to read, used for the table headers, the counts, the hints and the placeholders, which people do. It is **3.8:1 light (`#7c8199`) and 4.1:1 dark (`#7b8099`)** now: still the quietest ink, no longer a disabled one. A placeholder is `color-mix(in srgb, var(--text2) 80%, var(--surface))` (≥ 3:1 in both themes). On touch, a box is **40px** (`min-height:40px !important`, like the 16px rule: a device rule, not a taste) and its neighbours in the row are raised to match, or the row misaligns. `tools/inputs_audit.mjs` measures all of it at 1440 · 1024 · 768 · 390 · 320, both themes: clipped values, text under 16px on touch, boxes under 26/40px, text under 4.5:1 and placeholders under 3:1.

## Everything stays in its box (2026-10-07)

`tools/audit_escape.js` asks whether anything leaves the box drawn around it or lands on its neighbour, and `node tools/mobile_hub_sweep.mjs --escape` (also `--desktop`) runs it on every screen of every app; CI stops the deploy on a finding. The rules it holds:

- **A selector meant for one child says `>`.** `.empty-state svg` styles the illustration *and* the icon inside every button in it. Use `.empty-state > svg`.
- **`1fr` is `minmax(auto,1fr)`.** A grid track grows to its widest unbreakable content (an input's own width, a table's minimum) and drags the page past its card. Write `minmax(0,1fr)`, and give a two-column key/value row a single column under 640px.
- **A bar wraps; it does not scroll.** A strip of tabs, tool groups or controls that scrolls sideways hides what is in it. The exception is a bar carrying a sliding indicator, which tightens its padding instead.
- **A fixed `height` on a box whose text can wrap is `min-height`.** `overflow:hidden` makes the clip silent.
- **Chart text is fitted to the picture.** Axis labels are thinned when they would touch (the gridline stays), an axis title is cut at a bracket or with an ellipsis when it is longer than the plot, point names go right, left, above or below and are left out rather than drawn over another name or dot, and a legend that has no room beside the plot goes above it.
- **A well, chip or cell too small for its text drops the text**, never overflows: the colour, the outline and the tooltip carry it.
- **A rejected clipboard write is not a copy.** Handle the rejection (fall back to a textarea) and say so when it also fails.

Scrollers that are a data table or a figure larger than their box on purpose are listed in `ESC_OPTS` in the sweep; a box whose only content is a `<table>` is allowed by the audit itself.

## A tool strip is sections that fold (Blueprint, 2026-10-07)

A ribbon of grouped tools is wide on a desktop and, once it wraps, a screenful on a phone. Make each group a `<details class="…-sec">` in a column beside the thing being edited:
- **A folded section shows what is set in it** (one muted line, hidden while open), so folding hides the controls and never the state.
- **What is open is remembered per device** and the first visit opens what the job needs first (nothing on a phone). Set `open` programmatically *before* attaching the `toggle` listener that saves: the events are asynchronous and a default must not be stored as a choice.
- **Anything used every minute is not a section**: Copy and Export sit in the header of the thing they act on.
- **Provide Fold all / Unfold all** and update its label in the same call, not from the `toggle` events.
- On a phone put the thing being edited first and the folded tools under it.
- A button that toggles a panel keeps its icon and says so in `aria-expanded`; the chevron is CSS that rotates. Never rewrite its `innerHTML`.

## Screening charts (Hit Finder, 2026-10-07)

A chart that ranks things is read for what is **in** it and what is **missing from** it, so these rules are not decoration.

- **One builder for the screen and for the file.** The export is the same function with the light palette on white. A canvas does not understand `var(--x)` and paints it black; an SVG for a slide must not carry one.
- **Marks never collide in meaning.** Tier is the fill (solid · half · hollow · dashed); a bound is an arrow towards the limit; a flag is a ring; a hook is a diamond; excluded is struck through. A selection is a ring in the accent, never a fill.
- **A chart has a table.** Every plot can be seen as the rows behind it, because a figure nobody can check is an opinion.
- **A threshold is a handle.** The edge of a histogram can be dragged with a pointer or with the arrow keys, and what moves is the number the user would have typed.
- **A crowd is a texture.** Past ~2,500 points the grey rest is one bitmap and only the compounds that matter are elements.
- **Missing is blank.** In a file a missing number is an empty cell — not 0, not "—" (a spreadsheet would sum it).
- **`[hidden]` always wins** (`[hidden]{display:none !important}`): an author rule such as `.tab{display:flex}` otherwise beats the attribute.

## Kinetic charts (Tempo, 2026-10-07)

A trace chart answers *how fast, how deep, and did it come back*, so what is drawn must show what the fit was **given** as well as what it returned.

- **One hue, light to dark, for the concentrations.** Vehicle is grey and dashed at 1; the fit is a dashed line in the trace's own colour; the window, the onset and the plateau are markers, not extra series. A hooked concentration is hollow.
- **A bound is drawn as a bound.** A plateau that was not reached is an arrow on the end of the trace; a rate faster than the read interval carries `>`; an excluded read is a cross at its position, never absent.
- **Ranking bars hang from zero.** A metric can be negative (a log efficiency of −1.64): the baseline is at zero and the bar goes down from it, so a smaller value is never drawn as a bigger bar.
- **Fractional signal, not raw counts, on the y axis** — and the normalisation that produced it is named under the chart, because two analyses of one plate are only comparable if their reference is the same.
- **Validation is a pill, not a colour.** Acceptable · excellent · check, with the rule that failed in the tooltip. A green dot nobody can explain is a decoration.

## A viewer frames its subject by measurement, and a canvas has its own right-click (Ribbon, 2026-10-07)

- **Fit is measured.** A 3D viewer's own "zoom to" fits a sphere to one dimension; on a portrait phone or an elongated subject
  it cuts the subject off. Project the subject's points, move and scale until the box fits with a margin, and keep following
  the viewer's size **until the user moves the view** — then never again until they press Fit.
- **A saved camera is a composition.** Restore it exactly when the viewer has the same shape; only when it does not, bring the
  subject into view.
- **One colour function for the whole figure.** Every mode, the palette tuning, a highlight, a chain colour and the dimming of
  what is not selected go through one function, so a control that "tunes every colour" cannot silently skip a mode.
- **A canvas that uses the right button for panning opens its menu on *release*, and only if the pointer did not move.** macOS
  raises `contextmenu` on the press, so check whether the button is still down. A click handler fired for every button
  must ignore the right one.
- **A viewer that cannot load leaves the page alive:** the rest of the controls work, the viewer says why and offers *Try again*.

