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
  /* radius */
  --r-1:6px; --r-2:10px; --r-3:14px; --r-4:20px; --r-full:999px;
  --r2:12px; --r3:16px;                 /* the two card radii */

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
  --ease:cubic-bezier(.2,.8,.3,1);
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
