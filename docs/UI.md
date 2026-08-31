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
