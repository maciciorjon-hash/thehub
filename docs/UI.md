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
  --text:#1a1d2e; --text2:#5a5f7a; --text3:#9ca0b8;

  --accent:#5e87c5;                      /* ONE blue, every app, everything interactive */
  --accent-dim:rgba(94,135,197,0.12); --accent-soft:rgba(94,135,197,0.22);
  --brand:<the app's own colour>;        /* its logo box and its card tint — nothing else */

  --good:#2d9462; --warn:#c47818; --danger:#c04040;

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
  --text:#e8eaf2; --text2:#8b90a8; --text3:#4e5368;
  --accent:#8aaee0; --accent-dim:rgba(138,174,224,0.16); --accent-soft:rgba(138,174,224,0.26);
  --good:#6ddca8; --warn:#f0b060; --danger:#f08a84;
  --shadow-xs:0 1px 4px rgba(0,0,0,.30);  --shadow-sm:0 2px 8px rgba(0,0,0,.40);
  --shadow-md:0 6px 24px rgba(0,0,0,.50); --shadow-lg:0 16px 48px rgba(0,0,0,.55);
}
```

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
| `tools/mobile_sweep.mjs` | Labbook on an emulated iPhone: 51 screens, both engines, with the three above — see *The phone* |
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
