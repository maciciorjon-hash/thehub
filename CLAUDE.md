# dHUB

> Auto-updated section at bottom. Static content below is maintained manually.

---

## Project overview

**dHUB** is the primary product (`dHUB.html`). It is a **self-contained** single-file launcher: all app HTMLs are base64-encoded and embedded directly inside it. Opening `dHUB.html` alone gives access to every tool, no other files required.

**Individual standalone files** also exist in their subfolders and are kept in sync — they serve as standalone versions of each app.

**Location:** `Desktop › The_Hub › dHUB.html`  
**Author:** Jon Macicior — postdoc, Ciulli Lab, University of Dundee  
**Stack:** Vanilla HTML/CSS/JS only. No build step, no server. Open in browser directly.

---

## Where this is going — read this first

**The product is Labbook**: a domain-aware ELN for targeted protein degradation and chemical
biology. The sellable asset is the **encoded domain knowledge** — 33 Archive protocols with
working calculators, parameterised experiment templates, and a plan → execute → analyse loop
that understands what a dose-response plate is. Benchling/MBook/LabArchives are rich text plus
attachments; none of them know what a 384-well plate or a DC50 is. That gap is the wedge.

**Spine** Labbook · **Flagship** Echo · **Moat** Archive. Everything else is either folded in,
supporting, or out of the product build. Stop adding app surface area; invest in the loop and
the science content.

Three builds, one source (`embed.py`):

| build | command | what it is |
|---|---|---|
| personal Hub | `python3 embed.py` | all 20 apps, ~11 MB — Jon's daily driver |
| product | `python3 embed.py --profile=product dist/index.html` | the sellable subset |
| standalone Labbook | `python3 embed.py --profile=labbook` | Labbook + Archive in one 927 KB file, no shell |

**Where we are (2026-08-01).** Labbook is the focus and is in good shape: durable attachments,
a per-experiment Files tab, explicit step completion with bounded carry-over, a week planner
that is a real peer view of experiments and the notebook, plate maps, and a standalone build
that carries the whole protocol library with live calculators. Mobile works. Seed data is
neutral. See the Labbook sections below for how each part works.

**Where we're going, in order.**
1. **Echo ↔ Labbook loop** — Echo picklist → plate-map well names; DC50/Dmax → back into the
   experiment record and the publication prose. This is the demo that sells the product.
2. **Consolidation** — Lumina → an Echo mode, Beacon → an Echo assay type (kills two copies of
   the 4PL engine); one plate engine; Helix + Plasmids; Blot + Blueprint's Gel Designer;
   Cell Archive + Incubator + Iceberg into one "Cells" lifecycle.
3. **ChemLib** — Labbook becomes ChemLib's biology notebook, joined project-to-project with
   ChemLib owning access control. See the ChemLib section.
4. **Product credibility** — migrate off `thehub-f80ae`, multi-user, audit trail, export.

**Blocked on Jon, not on code**: University of Dundee IP ownership (gates any sale — talk to
Research & Innovation Services), enabling Firebase Storage in the console, and pasting the
`/journal` rules into the Firebase console.

---

## Current apps

| ID | Name | Logo | Accent | Standalone file |
|----|------|------|--------|-----------------|
| `echo` | Echo (formerly Labcyte Echo / Echo Data Analysis) | SVG bar chart | `#ff5760` | `Echo/echo.html` |
| `deg` | Dora (formerly Degradation Explorer) | SVG curve | `#7c6fd4` | `Dora/dora.html` |
| `pd` | Blueprint (formerly Lab Designer) | SVG wells | `#0079b9` | `Blueprint/blueprint.html` |
| `dna` | Helix | SVG helix | `#43a047` | `Helix/helix.html` |
| `pt` | Protein Tools | SVG chain | `#9c6fd4` | `Protein_Tools/protein_tools.html` |
| `spectra` | BCA (formerly Spectra) | SVG standard curve | `#26a69a` | `BCA/bca.html` |
| `ldi` | LDI | SVG balance/scale | `#e91e63` | `LDI/ldi.html` |
| `cryo` | Iceberg | SVG snowflake | `#00acc1` | `Iceberg/iceberg.html` |
| `cuppa` | Cuppa | SVG coffee cup | `#8d6e63` | `Cuppa/cuppa.html` |
| `fabricata` | Fabricata™ | SVG bar chart + star | `#c07a8e` | `Fabricata/fabricata.html` |
| `beacon` | Beacon | SVG donor/acceptor BRET glyph | `#5e72c4` | `Beacon/beacon.html` |
| `lumina` | Lumina | SVG light bulb | `#f5c518` (warm gold) | `Lumina/lumina.html` |
| `ribbon` | Ribbon | SVG ribbon waves | `#e36c69` (salmon) | `Ribbon/ribbon.html` |
| `protocols` | Archive (formerly Protocols) | SVG open book | `#a56983` (dusty pink) | `Archive/archive.html` |
| `cellarchive` | Cell Archive | SVG cell/nucleus | `#d17a4a` (terracotta) | `Cell_Archive/cell_archive.html` |
| `bench` | Incubator (**admin-only** — cell-culture tracker; id stays `bench`, was "Bench") | SVG incubator/cell dish | `#4f9d8f` (teal) | `Bench/bench.html` |
| `labbook` | Labbook (**admin-only** — electronic lab notebook; experiment-centric planner) | SVG notebook | `#4f9d8f` (teal) | `Labbook/labbook.html` |
| `plasmids` | Plasmids (**admin-only** — plasmid database + SnapGene maps) | SVG plasmid | `#6d7bd0` (indigo) | `Plasmids/plasmids.html` |
| `blot` | Blot (western blot figure builder) | SVG blot panels | `#5b6b7a` (slate) | `WesternBlot/westernblot.html` |
| `gantt` | Cadence (grant/fellowship Gantt charts) | SVG timeline bars | `#d99a4e` (amber) | `Gantt/gantt.html` |

**Home grid packages:** the home cards are grouped into labelled sections by `PACKAGES` in `hub-shell.html` (Data Analysis · Design & Presentation · Molecular Biology · Lab Operations · Just for Fun). `_buildPackages()` reorganizes the flat `#app-grid` into per-package `.grid` blocks at load; drag-reorder is scoped within a package and persisted per-package in `localStorage` (`hub_card_order_v2`). Empty sections auto-hide via `_updateSectionVisibility()`. Any app id not in `PACKAGES` falls into a trailing "More" section.

---

## Architecture & workflow

**dHUB is self-contained.** Each app's HTML is base64-encoded and stored inside `APP_B64` / `APP_B64_NEW` in dHUB's `<script>` block. When you open an app, it is decoded with `decodeB64App()` and rendered in an `iframe.srcdoc`. This means:

- **dHUB alone** = complete product (no folder structure needed).
- **Individual app files** = standalone versions, kept manually in sync.
- When you change an individual app file, you must **re-run the Python embed script** to regenerate dHUB.

```
The_Hub/
├── dHUB.html                                 ← self-contained, ~11 MB (generated)
├── hub-shell.html                            ← source-of-truth shell
├── embed.py                                  ← build script
├── Echo/
│   └── echo.html
├── Dora/
│   └── dora.html
├── Blueprint/
│   └── blueprint.html
├── Helix/
│   └── helix.html
├── Protein_Tools/
│   └── protein_tools.html
├── BCA/
│   └── bca.html
├── LDI/
│   └── ldi.html
├── Iceberg/
│   └── iceberg.html
├── Cuppa/
│   └── cuppa.html
├── Fabricata/
│   └── fabricata.html
├── Beacon/
│   └── beacon.html
├── Lumina/
│   └── lumina.html
├── Ribbon/
│   └── ribbon.html
├── Archive/
│   └── archive.html
└── Cell_Archive/
    └── cell_archive.html
```

### Regenerating the self-contained dHUB after app changes

**`embed.py`** reads from `hub-shell.html` and fills in each app's base64. Run from `The_Hub/`:

```bash
python3 embed.py                      # → dHUB.html  (local/offline use — every app)
python3 embed.py dist/index.html     # → dist/index.html  (CI/Pages build)
python3 embed.py --profile=product dist/index.html   # → only the product apps
python3 embed.py --profile=labbook                   # → labbook-standalone.html (Labbook + Archive)
```

The key regex is `[^"]*` (not `[A-Za-z0-9+/=]+`) to avoid the PLACEHOLDER suffix bug. `embed.py` fails loudly (exit 1) if a source file is missing or a key doesn't match exactly one placeholder.

### Shared curve-fit engine (Echo is canonical)

There is no module system, so the 4PL Levenberg-Marquardt fitter (`_lmFit`, `_solveLin`, `_matInv`, `_fitBest`, `_4plVal4`/`_gain`, `_4plJac4`/`_gain`, `_xAtYMid`, `_tQ95`) is **duplicated** in **Echo** (canonical), **Beacon**, and **Lumina**. As of v1.4.0 (2026-07-13) all three are **in sync** — Beacon/Lumina's copies were reconciled onto Echo's (verified fit-for-fit identical: Beacon in-browser maxParamDiff=0, Lumina Node A/B maxParamDiff=0). Two scripts maintain this:
- **`check_shared.py`** — read-only drift monitor (`python3 check_shared.py`, exit 1 on drift, 2 on a missing source). Run after editing any fit function.
  Both scripts pointed at the pre-rename `Labcyte_Echo/labcyte_echo.html` from the Echo rename until 2026-07-30, so they errored out instead of checking anything.
  Fixed and re-run: **Beacon and Lumina are confirmed byte-identical to Echo** for every shared function (`_4plVal3`/`_tQ95` are Echo-only).
- **`sync_fit_engine.py`** — copies Echo's canonical versions into Beacon/Lumina (`--check` for dry run).

Workflow: **edit the fit math in Echo only**, then `python3 sync_fit_engine.py` to propagate, then verify fits numerically (outputs *can* change if you altered the actual math), then `python3 embed.py`. Neither script is wired into `embed.py`'s build gate.

### GitHub Actions auto-deploy

**Repo:** `https://github.com/maciciorjon-hash/thehub` (private)  
**Pages URL:** `https://maciciorjon-hash.github.io/thehub/`

On every push to `main`:
1. GitHub Actions runs `python3 embed.py dist/index.html`
2. Deploys `dist/` to GitHub Pages
3. dHUB is live at the Pages URL within ~2 min

**Local dev workflow:**
```bash
# 1. Edit any standalone app file
# 2. Rebuild locally
python3 embed.py
# 3. Open dHUB.html to test
# 4. Push → Pages auto-rebuilds
git add Echo/echo.html hub-shell.html CLAUDE.md
git commit -m "Fix: description"
git push
```

**Files tracked in git:** `hub-shell.html`, `embed.py`, `.gitignore`, `.github/`, all standalone app HTMLs, `CLAUDE.md`, `database.rules.json`/`firebase.json`/`.firebaserc` (Firebase RTDB security rules, deployable via `firebase deploy --only database` if the CLI is installed — see Firebase integration section)  
**Files NOT tracked:** `dHUB.html` (generated), `dist/`, `Labmate/RDKit_minimal.*`

### dHUB shell structure

```
hub-shell.html / dHUB.html
├── <script>APP_B64{echo,deg,lm}</script>         — base64-encoded app HTML
├── <script>APP_B64_NEW{dna,pd,pt,spectra,ldi}</script> — base64-encoded app HTML
├── #hub-nav       — nav bar: d logo + "dHUB" + theme toggle + lab/settings btns
├── #hub-announce  — fixed banner below nav (Firebase-driven, admin posts, all sessions see it)
├── #hub-home      — 42px title + rotating subtitle + 8-card grid
├── .app-view × 8  — position:fixed overlays (z-index:10), always in DOM at opacity:0
├── var APP_INFO   — map: id → {letter, color, name} for all 8 apps
├── decodeB64App() — UTF-8 base64 decoder
├── openApp()      — fades in app view
├── backToHub()    — fades out app view
├── HUB_SUBS[]     — rotating subtitles (5s interval, crossfade)
├── Firebase auth  — Google sign-in; isAdmin = user.email === 'maciciorjon@gmail.com'
├── Firebase SSE   — /labconfig.json (lab card visibility) + /announcement.json (banner)
├── applyLabConfig() — hides/shows cards for non-admin; admin always sees all
├── Lab panel      — admin only: per-app toggles + announcement input + preview lab view
└── easter egg     — 5-click on d logo (when on hub home)
```

**Navigation:** dHUB's d logo (`#hub-logo`) acts as back button when inside an app — no button injected into app iframes.

### Animation design

App views are `position:fixed; inset:0; z-index:10`. Opening: overlay fades in (150ms), hub chrome hidden after 200ms. Going back: hub chrome restored immediately, overlay fades out. No blank frames.

---

## Firebase integration

**Project:** `thehub-f80ae` (europe-west1)  
**DB:** `thehub-f80ae-default-rtdb.europe-west1.firebasedatabase.app`  
**Auth domain:** `thehub-f80ae.firebaseapp.com`  
**API key:** `AIzaSyBpw9UbXnCciIi7VBapBeBJOq9U7RSS4g8`

**Admin auth:** Google sign-in via Firebase Auth compat SDK. Admin = `maciciorjon@gmail.com`. Sign in from Settings panel (gear icon). Session persists across reloads.

**Lab config SSE** (`/labconfig.json`): controls which app cards are visible to non-admin users. Admin writes via `firebase.database().ref('/labconfig').set(...)` (Firebase JS SDK, authenticated by the signed-in admin's real ID token). All sessions receive updates in real time via `EventSource`.

**Announcement banner** (`/announcement.json`): admin posts a message from the Lab panel via `firebase.database().ref('/announcement').set(...)`; appears as a fixed 40px banner below the nav for all active sessions. Dismissible per browser session (tracked via `sessionStorage`). Posting an empty string clears the banner.

**Authorized domains** (Firebase console → Auth → Settings): must include `maciciorjon-hash.github.io` for Google sign-in to work on Pages.

**Security (fixed 2026-06-22, see Round 92 session log):** writes used to go through a hardcoded legacy RTDB "database secret" embedded directly in client JS — a platform-level admin-bypass key with no expiry, no rules enforcement, and (since it was server-bundled into a public GitHub Pages page) effectively public. Replaced with real Firebase Auth SDK writes (`firebase.database().ref(path).set(...)`) tied to the signed-in admin's actual identity; rules are tracked in `database.rules.json`/`firebase.json`/`.firebaserc` at repo root (paste into Firebase console → Realtime Database → Rules, or `firebase deploy --only database` if the CLI is installed). **Known unresolved limitation:** the leaked legacy secret itself cannot be revoked or rotated — Firebase removed all console UI for managing legacy RTDB secrets years ago, with no replacement, for every project. It remains permanently valid and permanently bypasses rules on this specific database instance (`thehub-f80ae-default-rtdb`) regardless of what rules say. Jon explicitly accepted this residual risk rather than migrating to a new database instance — don't re-flag this as a fresh finding without checking this note first.

---

## Banner design system

All apps share a consistent header:

| Element | Style |
|---------|-------|
| Logo box | 32×32px, `border-radius:7px`, `font-family:var(--mono)`, `font-size:20px`, **`font-weight:700`**, `color:#fff` |
| App name | `font-size:15px; font-weight:600; letter-spacing:-0.2px` |
| Subtitle | `font-size:11px; color:var(--text2)` |
| Header height | 58px |
| Header layout | `display:flex; align-items:center; gap:14px; padding:0 28px` |

---

## dHUB home design

- Title: **42px, font-weight:700, letter-spacing:-1.2px**
- Rotating subtitle: `font-size:14px`, `color:var(--text2)`, crossfade every 5s
- Cards: 280px min-width grid, 48×48px logo boxes, `font-weight:700` on logo letter
- Max-width: 880px centered

---

## Design system (Echo-style)

All hub chrome uses Echo's exact CSS variables and IBM Plex fonts:

```css
/* Dark */
--bg:#0d0f14  --surface:#13161e  --surface2:#1c2030  --surface3:#252a3a
--border:rgba(255,255,255,0.07)  --border2:rgba(255,255,255,0.13)
--text:#e8eaf2  --text2:#8b90a8  --text3:#4e5368
--accent:#ff5760  --accent2:#0079b9  --accent3:#00c896

/* Light */
--bg:#f4f5f8  --surface:#ffffff  --surface2:#f0f1f5  --surface3:#e4e6ee
--border:rgba(0,0,0,0.07)  --border2:rgba(0,0,0,0.13)
--text:#1a1d2e  --text2:#5a5f7a  --text3:#9ca0b8
```

**Default theme: light** (`<html data-theme="light">`)

---

## How to add a new app

### 1. Build the app HTML file (standalone)

Create `MyApp/myapp.html`. Use IBM Plex Sans/Mono, Echo palette CSS vars, 58px header.

### 2. Add app card to `#hub-home` in `hub-shell.html`

```html
<div class="card" tabindex="0" data-app-id="myapp" onclick="openApp('myapp')" onkeydown="if(event.key==='Enter')openApp('myapp')">
  <div class="card-header-row">
    <div class="card-logo" style="background:#COLOR;">X</div>
    <div class="card-name">My App Name</div>
  </div>
  <div class="card-desc">Short description.</div>
  <div class="card-foot"><span>Tag1 · Tag2</span><span class="card-arrow">&#8594;</span></div>
</div>
```

### 3. Add app-view iframe in `hub-shell.html`

```html
<div class="app-view" id="view-myapp">
  <iframe id="frame-myapp" sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups allow-top-navigation-by-user-activation"></iframe>
</div>
```

### 4. Add entry to `APP_INFO` and `APP_B64_NEW`

```js
var APP_INFO = { ..., myapp: { letter:'X', color:'#COLOR', name:'My App' } };
var APP_B64_NEW = { ..., myapp: "PLACEHOLDER_MYAPP" };
```

### 5. Base64-encode and embed

```bash
python3 embed.py
```

---

## Technical notes

**Self-contained embedding:** Apps stored as UTF-8 base64 in `APP_B64` / `APP_B64_NEW`. Decoded at runtime via `decodeB64App()` using `atob()` + `TextDecoder`.

**LabMate RDKit (removed):** LabMate no longer uses RDKit — `labmate.html` has zero references to it (the chemistry that needed it went with the removed PROTAC Tools section). The `Labmate/RDKit_minimal.js`/`.wasm` files on disk are orphaned (and gitignored, so not in the repo or the built Hub). The old `<base href>` injection note no longer applies; safe to delete the local assets.

**Same-origin srcdoc:** `srcdoc` iframes with `allow-same-origin` are same-origin as dHUB. `localStorage` and `window.parent` calls work.

**LabMate active sections (v0.9.96):** Favourites · Calculators · Mol Biology · Cell Biology · CRISPR · Proteomics · Biophysics · Struct Bio · Genomics. PROTAC Tools and Reference removed.

**Plate Designer mobile:** `.sel-toolbar` anchored to `top:58px` on mobile with `max-height:calc(100vh - 80px); overflow-y:auto` so it never covers the plate canvas.

**Favicon:** SVG data URI in `hub-shell.html` `<head>` — dark rounded square with white "d", matches nav logo.

**`labBtn.style.display`:** Must be set to `'inline-block'` (not `''`) — a CSS rule hides it by default and `''` doesn't override it.

---

## Labbook — experiment-centric planning (added 2026-07-30)

The axis of Labbook is the **individual experiment**: you design one, it expands into dated
day-blocks, and each day's blocks surface in that day's notebook (`blocksForDate` →
`renderNotebookEditor`). Three systems support that:

**Setup parameters** — `SETUP_SCHEMA` (one entry per experiment type) declares the handful of
decisions you make when planning. The plate assays (WB/HB/CTG/NB/KD/RTX/D2B) lead with
**Format: 96/384**; Proteomics and Cloning get non-plate fields. Answers are collected in the
New-experiment modal (`nmSetup`/`nmSetupUpd`, transient `NM_SETUP`), pushed into the
instantiated blocks by `applySetupToBlocks` (rewrites calculator inputs — plate format, cell
line, cells/well, plate counts by ratio, per-well volumes scaled via `PLATE_VOL` — and fills
`{{placeholder}}` tokens in the preset text via `fillSetup`), and stored on the record as
`e.setup` (shown as read-only chips by `setupSummaryHtml`). A type may add an `apply(setup,
blocks)` hook for structural changes — CTG uses it to drop the readout you didn't ask for.

**Templates** live in `PRESET_SEED` and now carry `{{placeholders}}` plus `ul.lb-check`
checklists (which is what drives the existing carry-over logic). The seed version flag was
bumped `_presetV2` → **`_presetV3`**, so `seedPresets()` re-seeds all built-in presets once
per browser. Custom/user-added presets are untouched; hand-edits to built-in presets made
before this change are overwritten. **Bump to `_presetV4` if you edit `PRESET_SEED` again.**

**Snooze** — `snoozeBlock(expId, blockId, n)` pushes a step **and every later-dated step in the
same experiment** forward n days, then `recomputeDayOffsets`. Buttons in `blkCardHtml` (needs
`blkCardHtml(b, expId)`), both notebook sections, and `ctxBlock` (1 day / 1 week). It takes
`expId` explicitly because `_curExp()` is null in the notebook.

**Plate maps** — the point is the *record*: what was in each well, so a run can be repeated or
read back later. Every view therefore pairs a colour grid (the shape at a glance) with
`plateSummary()` — wells grouped by identical content and compacted into ranges, so a whole
96-well plate reads as ~5 lines ("B1–D10 · SU-DHL-5 · JQ1 · 1 µM → 3.81 pM (10 pts, 4-fold)
×3 replicates"). `_compactRanges` merges rows with identical column runs; `_concDesc` collapses
a series repeated across replicate rows/columns; `_seriesText` fits the fold from the endpoints
in log space (per-step ratios break on rounded values) and snaps to the nearest standard
dilution. `plateSummaryText` backs the Copy button.

Three drawing idioms are supported, all from Jon's real OneNote pages:
per-well text; **per-well `shade`** (a visual gradient when the numbers live in an Echo
picklist, `plApplyShade`); and **block labels** (`plate.groups[gid].label` + `well.groupId`,
one name written once across a rectangle, `plGroupLabel`), plus **column headers**
(`plate.colLabels`/`colTitle`, e.g. the nM of each dose column — `plDoseToCols` writes a series
into them). Grids place **every** cell explicitly (`grid-row`/`grid-column`): block labels are
grid items spanning their wells, and any auto-placed sibling would flow around them.
`PLATE_LAYOUTS` holds ready-made starting layouts (`echo384`, `blocks384`), offered via
"Start from a layout…" and seeded automatically for a 384-well Echo HB/D2B experiment.

Storage is structured objects attached like `b.calc`, not inline rich text:
`e.plate` (experiment-level, optionally seeded at creation) and `b.plate` (per day-block, via
the `⊞ plate` button, the ribbon Insert tab, or `/plate map`). Shape:
`{format, title, types[], wells:{A1:{typeId, cellLine, compound, conc, label}}}` — well ids are
**unpadded** (`A1`, `A10`), so always go through `wellRC()`, never sort them as strings.
`platePreviewHtml(plate, ownerKey)` renders the read-only inline card; `openPlateEditor(key)`
opens `#plate-modal` (div grid, not canvas) with drag/shift-range/row/column selection, a type
palette, structured per-well fields showing `Mixed…`, and a dose-series filler. `ownerKey` is
`exp:<expId>` or `blk:<expId>:<blkId>`, resolved by `_plateOwner`. Edits are live-saved (no
OK/Cancel). Format switching **keeps** wells that still fit the new grid — unlike Blueprint's
`setFormat`, which wipes them. PDF export via `pdPlate()`.

Blueprint was the design reference for the grid but shares **no code** — its brackets, colour
picker, annotations and heatmap were deliberately not ported.

## ChemLib integration (Rubén Prieto)

**ChemLib** is a lab-management app in the same group: FastAPI + SQLAlchemy + SQLite, JWT cookie
auth, vanilla-JS frontend where ~15 scripts share one global scope, no build step. It already
has an ELN, a biology assay module with its own client-side 4PL (`_beFit4PL` + `_beNelderMead`,
Nelder–Mead), and a D2B plate module.

**The seam is an iframe, never a script merge.** ChemLib's scripts all live in one global scope
and already define `showToast`, `api`, `escHtml`, `closeModals`, `#modal`, `#search-input` —
pasting a thehub app in as a 16th script would collide silently. An iframe gets its own window,
scope and CSS cascade, which is what dHUB already does. Nothing here requires changing
`hub-shell.html`, `embed.py` or the base64 pipeline; it is additive.

**Bucket A — importable as-is** (no shell globals, no Firebase): Echo, Dora, Blueprint, Helix,
Protein Tools, BCA, LDI, Beacon, Lumina. Of these, Blueprint, Helix, Protein Tools, BCA, Beacon
and LDI are fully self-contained. **Bucket B — needs a host or Firebase**: Labbook, Archive,
Plasmids, Incubator, Cell Archive, Iceberg, Blot, Ribbon, Cadence, Cuppa.

**The rule that keeps Bucket A importable:** a standalone app must never depend on
`decodeB64App`, `APP_INFO`, `openApp`, `backToHub` or any other dHUB-shell global, and must not
hardcode an absolute URL to its own assets. Both are currently true — keep it that way.

### Labbook → ChemLib's biology notebook (agreed, not built)

**The join is the Project.** ChemLib has projects; Labbook has projects; one maps to one. A user
sees a Labbook project only if ChemLib has already granted access to the corresponding ChemLib
project.

**Labbook gets no permission model of its own.** It is a OneNote replacement — a notebook with
protocol integration. Confidentiality is enforced once, by ChemLib, at the project boundary.
That removes per-record ACLs, sharing rules and any notion of groups or divisions inside
Labbook: it inherits them by only ever being handed projects the user can already see. It is an
organisation problem, not a security one.

Consequences: the only structural addition Labbook ever needs is a stable link from its project
record to the ChemLib project id (one optional field, added at migration time — don't guess it
now). The whole-tree `save()` must go, since with two people it is last-write-wins over the
entire notebook; the natural unit of sync is the project, which is also the permission
boundary. Sections stay Labbook's own sub-level inside a ChemLib project. Archive stays global —
it is a shared reference library, not project data. The persistence seam is the four existing
entry points (`save`, `_flushLocal`, `lbFb`, `lbInitSync`); attachments already have the right
split (metadata in the tree, bytes in IndexedDB) and map cleanly onto REST + file storage.

**Fit engines:** Echo's LM 4PL is canonical here and guarded by `check_shared.py`. It can be
offered to ChemLib, but only after both fitters are run on the same real dose-response data and
shown to agree — the bar `sync_fit_engine.py` already sets. A fitter that produces published
DC50s is not swapped because the shapes look similar.

### Offline / self-hosted robustness

A self-hosted ChemLib may sit behind a firewall, and a bench laptop may have no wifi, so remote
dependencies matter. Chart.js is now **embedded** in Dora, LDI and Lumina (all standardised on
4.4.2, the copy Echo already carries) — LDI is fully self-contained as a result. Every app's
`--sans`/`--mono` carries a real system fallback stack, so a blocked `fonts.googleapis.com`
degrades to the platform UI font.

Still remote, deliberately: **SheetJS** (Dora, Lumina, Iceberg — ~640 KB each, already embedded
in Echo and BCA; three more copies would add ~1.9 MB) and **3Dmol** (Ribbon, ~2 MB, out of the
product build). Each of those apps now shows a plain banner when the global is missing at load
instead of throwing into the console. **Note the honest consequence: Dora and Lumina read Excel
as their primary input, so offline they are announced-but-not-usable.** Embedding SheetJS in
those two costs ~1.28 MB if that trade changes.

## Standalone Labbook (Labbook + Archive in one file)

`python3 embed.py --profile=labbook` → `labbook-standalone.html` (~920 KB): the notebook,
experiments, week planner **and the full Archive** — 33 protocols with their 24 live
calculators — with no dHUB and no parent frame.

**Archive is embedded as a base64 iframe, not inlined.** Archive publishes its bridge
(`ARCHIVE_INDEX/CALC/CALC_SCHEMA/COMPUTE/STEPS`) onto *its* `window.parent`, so an Archive
running inside Labbook publishes straight onto Labbook's window. That means:
- `archive.html` is used **verbatim** — no fork, no CSS/ID de-collision, and it stays its own
  app in dHUB.
- Four of the five bridge functions are DOM scrapers (`ARCHIVE_STEPS` walks `.proto-section`;
  `ARCHIVE_COMPUTE` mutates Archive's live inputs, fires synthetic events and reads
  `_lastCalcTable` back). They need a **laid-out** document, so the parked frame is positioned
  off-screen (`#arc-host`, `left:-10000px`) — never `display:none`, which would measure nothing.
- `_arcWin()` resolves which window holds the globals: the local frame if `ARCHIVE_B64` was
  filled, otherwise `window.parent` (the dHUB shell). `archiveEmbedded()` gates the Archive nav
  node, so the dHUB build shows no duplicate.
- The frame is created once and moved between `#arc-host` and the visible `.arc-mount`
  (`_arcPark()`), so Archive keeps its calculator state across view switches.

Archive is a **browsable view** in the standalone build (nav node next to Week planner), not a
hidden data source — looking a protocol up on a phone is a first-class use case.

### Standalone honesty

Things the standalone build used to claim but not do, now fixed — worth knowing because they
are the failure modes a customer would hit first:

- **The status pill lied.** With no parent Firebase, `lbFb()` returns undefined but `save()`
  still called `setSync(true)`, so it read "Saved ✓ / Saved and synced" on a build that syncs
  nowhere. `hasCloud()` now gates it: standalone shows **"Saved on this device"**.
- **Auto-backup never ran on Firefox or Safari.** `maybeAutoBackup` gated on the File System
  Access API, so on the browsers where the backup file is the *only* durability guarantee,
  nothing happened, silently. It now falls back to `_snapshotBackup()` — a rolling 3-day v2
  payload in IndexedDB (`snapshot:<date>` in the `lb_backup` store), restorable from
  **View → Snapshots…** (`restoreFromSnapshot`).
- **A fresh install silently downloaded a JSON** on first load, because the same path fell
  through to `_download()` with no directory handle and no user gesture. It now writes a
  snapshot and asks once (`lb_backup_nudged`) for a real folder.
- `_attUpload` returned *before* `_cloudUnavailable()` when no storage was configured, so the
  "images are on this device only" warning never fired in the build that needed it.
- Exported PDFs were footed "dHUB Labbook". `_brand()` reports **"Labbook"** when there is no
  host frame.
- **Dark mode was unreachable** — the palette existed but only responded to a `postMessage`
  from the shell. There's a **View → Dark mode** toggle now.
- Cross-app links (`data-app`) were styled, clickable and inert with no host. They now route a
  `protocols` link to the embedded Archive, and otherwise say the target isn't in this build.

## Attachments & data-dump files (Labbook)

**Attachment bytes never go in `LB.data`.** `save()` re-`set()`s the whole tree to RTDB on a
1.2 s debounce, so a base64 image there would be re-uploaded on every keystroke. The contract is:
metadata in `LB.data`, bytes in IndexedDB (`lb_att`), optional cloud copy in Firebase Storage.

- **`e.files[]`** — the per-experiment data dump (Files tab): `{id, attId, name, mime, size,
  kind, added, caption, include}`. `addFileTo(key,file)` / `addFilesTo` accept any type;
  `fileKind()` classifies for the icon; images route through `_compressImage`. `include`
  controls whether it lands in the PDF (`pdFiles()` — images embedded, everything else listed,
  since `window.print()` cannot embed a foreign file). Owner keys are the plate-map keys
  (`exp:<id>` / `blk:<expId>:<blkId>`, resolved by `_plateOwner`).
- **`_collectAttIds()` must know about every place an attId can live.** `gcAttachments()` runs
  4 s after each load and hard-deletes any `lb_att` key it doesn't recognise — a new attachment
  site that isn't scanned there is silent data loss. It currently scans rich-text `data-att`,
  `floatImgs[]` and `files[]`.
- **Backups carry the bytes** (`_buildBackupPayload` → `{_lbBackup:2, data, blobs}`). Restore
  writes blobs back via `_attPut` *before* swapping the tree. Pre-v2 backups still restore, with
  a warning that images will be placeholders.
- **Storage failures are loud.** `_attPut` resolves `false` and calls `_storageFailed`, which
  flips the status pill to "Not saved!" and shows `lbAlert` once. `_flushLocal` no longer
  swallows quota errors. `_storageRoom(bytes)` pre-checks via `navigator.storage.estimate()`.
- **Firebase Storage must be enabled in the console** for cross-device sync. The SDK is loaded
  and `lbStorage()` resolves, but uploads fail until the bucket exists — `_cloudUnavailable`
  says so once, then falls back to device-local + backups.

## Current state

**v1.4.1**, 20 apps, last worked 2026-08-01. Full changelog/session history: [`Archive_Log/SESSION_HISTORY.md`](Archive_Log/SESSION_HISTORY.md) (not auto-loaded — open it directly for past-change detail; nothing was deleted, only moved there).

### Open items / not yet done
- **Firebase Storage not enabled in the console** — blocks cross-device image/file sync for
  Labbook and Plasmids. Everything works device-local and survives backup/restore without it.
- **Firebase `/journal` rules** still need pasting into the console (Realtime DB → Rules) for
  full cross-device sync — until deployed, admin writes silently stay local-only.
- **IP ownership is unresolved.** As employee-created work, the University of Dundee very
  likely owns or co-owns this. Resolve with Research & Innovation Services before any sale
  conversation — it also opens the legitimate routes (spin-out, licence).
- **The public Pages URL still serves the full personal build.** Seed data is now neutral, but
  the real instance should sit behind auth rather than on a public URL.
- **The leaked legacy RTDB secret** (see Firebase section) is accepted risk for personal use but
  is disqualifying for a product — Phase 3 migrates off `thehub-f80ae` entirely.
- **Archive calculator audit**: the 9 "verify" calcs (trfret/fp/spr/miniprep/nucleospin/lenti/
  miseq/ip/crispr) were spot-checked against worked examples and found OK — not re-derived.
- **Labbook plate maps**: no PNG export (CSV + PDF only); no plate-reader value overlay
  (Blueprint's `pdParseValues` is the obvious donor); custom well types can't be added/renamed
  from the editor yet; no Echo picklist import to name wells automatically.
- Minor polish, no urgency: drag-drop step palette, per-cell-line seeding-density
  recommendations, `PUB_SEED` prose refinement, deep-link Archive's calc-chip to its Calculate
  tab, excise `PACKAGES`/`_buildPackages` in hub-shell (superseded, harmless).

### Product direction (agreed 2026-07-30)

The sellable asset is the **encoded domain knowledge**, not the app framework — 33 Archive
protocols with working calculators, parameterised experiment templates, and a plan → execute →
analyse loop that understands what a dose-response plate is. Generic ELNs (Benchling, MBook,
LabArchives) are rich text plus attachments; none of them know what a 384-well plate or a DC50
is. Positioning: **a domain-aware ELN for targeted protein degradation and chemical biology.**

Consequence: stop adding app surface area; invest in the loop and the science content.

- **Spine** Labbook · **Flagship** Echo · **Moat** Archive.
- **Fold in (Phase 2)**: Lumina → an Echo mode and Beacon → an Echo assay type (removes two
  copies of the 4PL engine); one plate engine (Labbook's, plus Blueprint's `pdParseValues`);
  Helix + Plasmids (two GenBank parsers); Blot + Blueprint's Gel Designer; Cell Archive +
  Incubator + Iceberg into one "Cells" lifecycle; Dora + LDI.
- **The demo that sells it**: Echo picklist → Labbook plate-map well names, and Echo DC50/Dmax
  → back into the experiment record and the publication-ready prose. Prioritise this over any
  consolidation that doesn't enable it.
- **Out of the product build**: Cuppa, Fabricata, Cadence, Ribbon, Protein Tools (see
  `PROFILES` in `embed.py`). They stay in the repo and in the default build.
- **Retired 2026-07-30**: LabMate and Arc removed from `embed.py`, `APP_INFO` and the shell —
  both had been unreachable (no card, no `openApp()`) and together were ~3.6 MB of the bundle.
  Files remain on disk. Beacon stays deliberately hidden (see the comment in `hub-shell.html`)
  and is still built, pending its Phase 2 absorption into Echo.
