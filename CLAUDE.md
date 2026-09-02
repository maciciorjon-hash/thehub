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

**The product is an experiment tracker** — plan, log, annotate, analyse, export — for targeted
protein degradation and chemical biology. *(Repositioned 2026-08-25. This section used to say
"a domain-aware ELN" and treat everything but the notebook as supporting cast. The two halves
that turned out to carry it are **Labbook** and **data analysis**, and the verbs that sell it
are the ones a generic ELN does badly: annotate, attach results, and get a clean document back
out.)*

Four things have to be excellent, and they are the four to invest in:

| | what it means | where it lives |
|---|---|---|
| **Log** | a dated record of what was actually done, deviations included | Labbook day-blocks, `b.params`, `expDeviations` |
| **Annotate** | notes on a step, on a block, on a day, on a well | `stepNotes`, `b.note`, plate maps, `e.files` |
| **Analyse** | curves, potencies, plate readings — as data, not screenshots | Echo, `integration.results`, `plParseValues` |
| **Export** | a document someone else can use: Methods sheet, PDF, OneNote, CSV, PNG | `exportMethods`, `exportPDF`, `copyForOneNote` |

The **encoded domain knowledge** is still the moat under all four — 33 Archive protocols with
working calculators, parameterised experiment templates, and a loop that understands what a
dose-response plate is. Benchling/MBook/LabArchives are rich text plus attachments; none of
them know what a 384-well plate or a DC50 is.

**Spine** Labbook · **Flagship** Echo (analysis is a selling point in its own right now, not
just a feeder) · **Moat** Archive. Still no new app surface area — but "invest in the loop"
now explicitly includes the export side of it, which was previously treated as plumbing.

Four builds, one source (`embed.py`):

| build | command | what it is |
|---|---|---|
| personal Hub | `python3 embed.py` | all 20 apps, ~11 MB — Jon's daily driver |
| product | `python3 embed.py --profile=product dist/index.html` | the sellable subset |
| standalone Labbook | `python3 embed.py --profile=labbook` | Labbook + Archive in one 927 KB file, no shell |
| Archive PWA | `python3 embed.py --profile=archive` | Archive alone, installable + offline on a phone |

### Where things live (reorganised 2026-08-21)

`shell/hub-shell.html` is the shell, `apps/<name>/<name>.html` is every app (folder name == file
name), `tools/` holds the scripts that are not part of the build, `docs/` the documentation, and
**`old_stuff/`** the retired apps and dead plans — see its README. `embed.py` stays at the root
because CI calls it there. **`Backup/` must never be moved or renamed**: it holds your real data
backups and the browser's directory handle finds it by name, so renaming it breaks the automatic
backup silently.

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
| `echo` | Echo (formerly Labcyte Echo / Echo Data Analysis) | SVG bar chart | `#ff5760` | `apps/echo/echo.html` |
| `deg` | Dora (formerly Degradation Explorer) | SVG curve | `#7c6fd4` | `apps/dora/dora.html` |
| `pd` | Blueprint (formerly Lab Designer) | SVG wells | `#0079b9` | `apps/blueprint/blueprint.html` |
| `dna` | Helix | SVG helix | `#43a047` | `apps/helix/helix.html` |
| `pt` | Protein Tools | SVG chain | `#9c6fd4` | `apps/protein-tools/protein-tools.html` |
| `spectra` | BCA (formerly Spectra) | SVG standard curve | `#26a69a` | `apps/bca/bca.html` |
| `ldi` | LDI | SVG balance/scale | `#e91e63` | `apps/ldi/ldi.html` |
| `cryo` | Iceberg | SVG snowflake | `#00acc1` | `apps/iceberg/iceberg.html` |
| `cuppa` | Cuppa | SVG coffee cup | `#8d6e63` | `apps/cuppa/cuppa.html` |
| `fabricata` | Fabricata™ | SVG bar chart + star | `#c07a8e` | `apps/fabricata/fabricata.html` |
| `beacon` | Beacon | SVG donor/acceptor BRET glyph | `#5e72c4` | `apps/beacon/beacon.html` |
| `lumina` | Lumina | SVG light bulb | `#f5c518` (warm gold) | `apps/lumina/lumina.html` |
| `ribbon` | Ribbon | SVG ribbon waves | `#e36c69` (salmon) | `apps/ribbon/ribbon.html` |
| `protocols` | Archive (formerly Protocols) | SVG open book | `#a56983` (dusty pink) | `apps/archive/archive.html` |
| `cellarchive` | Cell Archive | SVG cell/nucleus | `#d17a4a` (terracotta) | `apps/cell-archive/cell-archive.html` |
| `incubator` | Incubator (**admin-only** — cell-culture tracker) | SVG incubator/cell dish | `#4f9d8f` (teal) | `apps/incubator/incubator.html` |
| `labbook` | Labbook (**admin-only** — electronic lab notebook; experiment-centric planner) | SVG notebook | `#4f9d8f` (teal) | `apps/labbook/labbook.html` |
| `blot` | Blot (western blot figure builder) | SVG blot panels | `#5b6b7a` (slate) | `apps/western-blot/western-blot.html` |
| `gantt` | Cadence (grant/fellowship Gantt charts) | SVG timeline bars | `#d99a4e` (amber) | `apps/gantt/gantt.html` |

**Home navigation:** signed in, the admin home is the **workspace** — the `#ws-rail` left rail
driven by `WS_NAV`, with each non-Labbook entry rendering a landing from `LANDINGS`. `EXTRA_GROUPS`
(Design & Presentation, Molecular Biology, Personal) is what the *More apps* landing groups.
Visitors keep the titled, centred landing and the individual-app discovery flow
(`_renderVisitorGrid`).

*(Corrected 2026-08-22. This paragraph described a wall of four panels drawn from `PRIMARY_CARDS`
by `_renderPanels()`. `_renderPanels` does not exist — the workspace rework replaced it — and
`PRIMARY_CARDS`' only remaining reader was `_allGroups()`, itself called by nothing. Both are
deleted. `PACKAGES`/`_buildPackages()` were already gone; their stylesheet survived them until
now.)*

---

## Architecture & workflow

**dHUB is self-contained.** Each app's HTML is base64-encoded and stored inside `APP_B64` / `APP_B64_NEW` in dHUB's `<script>` block. When you open an app, it is decoded with `decodeB64App()` and rendered in an `iframe.srcdoc`. This means:

- **dHUB alone** = complete product (no folder structure needed).
- **Individual app files** = standalone versions, kept manually in sync.
- When you change an individual app file, you must **re-run the Python embed script** to regenerate dHUB.

```
The_Hub/
├── CLAUDE.md · README.md · LICENSE
├── embed.py                    ← build script (CI runs it from the repo root)
├── dHUB.html                   ← self-contained, ~11 MB (generated, gitignored)
├── labbook-standalone.html     ← generated by --profile=labbook (gitignored)
├── firebase.json · .firebaserc · database.rules.json · storage.rules
├── shell/
│   └── hub-shell.html          ← source-of-truth shell
├── apps/                       ← one folder per app, folder name == file name
│   ├── labbook/labbook.html    (+ backups/)
│   ├── archive/archive.html    (+ icons/ for the PWA build)
│   ├── echo/echo.html   dora/dora.html   blueprint/blueprint.html
│   ├── helix/  protein-tools/  bca/  ldi/  iceberg/  incubator/  cell-archive/
│   └── beacon/  lumina/  western-blot/  gantt/  ribbon/  cuppa/  fabricata/
├── tools/                      ← not part of the build
│   ├── check_shared.py         sync_fit_engine.py
│   ├── migrate_protocols.py    make_icons.py
├── docs/
│   ├── CLAUDE_HANDOFF.md       SESSION_HISTORY.md       UI.md
│   └── PROTOCOL_MIGRATION_REVIEW.md
├── old_stuff/                  ← retired apps and dead docs; see its README
│   ├── arc/  labmate/  plasmids/  images/  superpowers/
└── Backup/                     ← YOUR data backups. Untracked, and never move this folder:
                                  the browser's backup directory handle points at it by name.
```

### Regenerating the self-contained dHUB after app changes

**`embed.py`** reads from `shell/hub-shell.html` and fills in each app's base64. Run from `The_Hub/`:

```bash
python3 embed.py                      # → dHUB.html  (local/offline use — every app)
python3 embed.py dist/index.html     # → dist/index.html  (CI/Pages build)
python3 embed.py --profile=product dist/index.html   # → only the product apps
python3 embed.py --profile=labbook                   # → labbook-standalone.html (Labbook + Archive)
```

The key regex is `[^"]*` (not `[A-Za-z0-9+/=]+`) to avoid the PLACEHOLDER suffix bug. `embed.py` fails loudly (exit 1) if a source file is missing or a key doesn't match exactly one placeholder.

### Shared curve-fit engine (Echo is canonical)

There is no module system, so the 4PL Levenberg-Marquardt fitter (`_lmFit`, `_solveLin`, `_matInv`, `_fitBest`, `_4plVal4`/`_gain`, `_4plJac4`/`_gain`, `_xAtYMid`, `_tQ95`) is **duplicated** in **Echo** (canonical), **Beacon**, and **Lumina**. As of v1.4.0 (2026-07-13) all three are **in sync** — Beacon/Lumina's copies were reconciled onto Echo's (verified fit-for-fit identical: Beacon in-browser maxParamDiff=0, Lumina Node A/B maxParamDiff=0). Two scripts maintain this:
- **`tools/check_shared.py`** — read-only drift monitor (`python3 tools/check_shared.py`, exit 1 on drift, 2 on a missing source). Run after editing any fit function.
  Both scripts pointed at the pre-rename `Labcyte_Echo/labcyte_echo.html` from the Echo rename until 2026-07-30, so they errored out instead of checking anything.
  Fixed and re-run: **Beacon and Lumina are confirmed byte-identical to Echo** for every shared function (`_4plVal3`/`_tQ95` are Echo-only).
- **`tools/sync_fit_engine.py`** — copies Echo's canonical versions into Beacon/Lumina (`--check` for dry run).

Workflow: **edit the fit math in Echo only**, then `python3 tools/sync_fit_engine.py` to propagate, then verify fits numerically (outputs *can* change if you altered the actual math), then `python3 embed.py`. Neither script is wired into `embed.py`'s build gate.

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
git add apps/echo/echo.html hub-shell.html CLAUDE.md
git commit -m "Fix: description"
git push
```

**Files tracked in git:** `shell/hub-shell.html`, `embed.py`, `.gitignore`, `.github/`, all standalone app HTMLs, `CLAUDE.md`, `database.rules.json`/`firebase.json`/`.firebaserc` (Firebase RTDB security rules, deployable via `firebase deploy --only database` if the CLI is installed — see Firebase integration section)  
**Files NOT tracked:** `dHUB.html` (generated), `dist/`, `old_stuff/labmate/RDKit_minimal.*`

### dHUB shell structure

```
shell/hub-shell.html / dHUB.html
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

Create `apps/myapp/myapp.html`. Use IBM Plex Sans/Mono, Echo palette CSS vars, 58px header.

### 2. Add app card to `#hub-home` in `shell/hub-shell.html`

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

### 3. Add app-view iframe in `shell/hub-shell.html`

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

**LabMate RDKit (removed):** LabMate no longer uses RDKit — `labmate.html` has zero references to it (the chemistry that needed it went with the removed PROTAC Tools section). The `old_stuff/labmate/RDKit_minimal.js`/`.wasm` files on disk are orphaned (and gitignored, so not in the repo or the built Hub). The old `<base href>` injection note no longer applies; safe to delete the local assets.

**Same-origin srcdoc:** `srcdoc` iframes with `allow-same-origin` are same-origin as dHUB. `localStorage` and `window.parent` calls work.

**LabMate active sections (v0.9.96):** Favourites · Calculators · Mol Biology · Cell Biology · CRISPR · Proteomics · Biophysics · Struct Bio · Genomics. PROTAC Tools and Reference removed.

**Plate Designer mobile:** `.sel-toolbar` anchored to `top:58px` on mobile with `max-height:calc(100vh - 80px); overflow-y:auto` so it never covers the plate canvas.

**Favicon:** SVG data URI in `shell/hub-shell.html` `<head>` — dark rounded square with white "d", matches nav logo.

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
bumped `_presetV2` → `_presetV3` → `_presetV4` → `_presetV5` → `_presetV6` → **`_presetV7`** (2026-08-28, the SPARK preset's `ctrlRatio`), so `seedPresets()` re-seeds all built-in presets once
per browser. Custom/user-added presets are untouched; hand-edits to built-in presets made
before this change are overwritten. **Bump to `_presetV8` if you edit `PRESET_SEED` again.**

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

## Archive protocols are data (`PROTOCOL_DATA`)

The Protocol tab used to be 33 hand-authored HTML panes. It is now **generated from
`PROTOCOL_DATA`**, an inline structured model in `apps/archive/archive.html`:

```
pid: { stages:[ { id, name, day, durationH, part?, badge?, variant?,
                  body:[ {t:'steps', ordered, items:[{id, html, params}]}
                       | {t:'note'|'warn'|'tip', html}
                       | {t:'table', headers, rows}
                       | {t:'variantPicker', label, options} ] } ],
       preamble:[...same body items...], variants?:[{id,label}] }
```

- **`body[]` is ordered on purpose.** Separate buckets for steps/notes/tables would render a
  "do not exceed 80 bp" warning five steps from the step it warns about, which is where it is
  useless.
- **`params`** are typed values (`temp|time|vol|conc|mass|pct|ratio|fold|count|range`) referenced
  from the step prose as `{{p.key}}`. `substParams()` renders them as
  `<span class="pparam" data-p="key">`, and accepts an override map so Labbook can supply an
  experiment's own value without touching the protocol. Units follow the prose convention:
  no space before `°C`, `%`, `×`; a space before everything else (`_punit`).
- **`variant`** solves "one protocol, two methods" (`crispr-ko`, `crispr-ki`). A stage with no
  `variant` is shared; a stage tagged with one is shown only when that delivery method is
  selected. `setMethodBranch` repaints the pane; the **Calculate** pane still uses the old
  `.method-branch` display toggling and was not touched.
- `renderProtocolPane(pid)` builds the markup (mirroring the original classes exactly, so the
  CSS is unchanged); `paintProtocolPane(pid)` is called from `openProtocol`, **before**
  `openNotesForProtocol`, since notes attach nodes to the pane.
- Cost: archive.html went 414 KB → 498 KB (+83 KB). Structure is not free; the JSON is bigger
  than the markup it replaced. Some of that comes back as the `TODO:` labels get short names.

**Bridge (`ARCHIVE_API_VERSION` is now 2):** `ARCHIVE_PROTOCOL(pid)` returns the whole structured
protocol — this is what Labbook instantiates an experiment from. `ARCHIVE_STEPS(pid)` stays for
back-compat but **now reads `PROTOCOL_DATA`, not the DOM** — panes are painted on demand, so
scraping returned nothing for any protocol the user had not opened. It also now emits `note` and
`table` entries: the old scraper dropped all 111 notes/warnings/tips and every table, so a
protocol reached the notebook stripped of the warnings that stop the experiment failing.
`partBlockHtml` in Labbook renders them (`.lb-note`, `.lb-note-warn`, `.lb-note-tip`,
`.lb-table`), including in the PDF export.

**`tools/migrate_protocols.py`** produced the model and verifies it: `--check` compares, letter by
letter, the prose rendered from the JSON against the original pane — **33/33**. It is one-shot
and **refuses to run against the generated panes** (they parse to empty stages, which would pass
a vacuous check and then wipe every protocol on inject). Re-verify against git:

```bash
git show <pre-migration-sha>:apps/archive/archive.html > /tmp/orig.html
python3 tools/migrate_protocols.py --from /tmp/orig.html --check
```

Review list for the remaining human work — naming the 565 params, setting each stage's `day`:
[`docs/PROTOCOL_MIGRATION_REVIEW.md`](docs/PROTOCOL_MIGRATION_REVIEW.md).

## Labbook: a protocol stage is a dated block

`createExperiment` used to turn each chosen protocol into **one** block dated at
`PROTO_OFFSET[pid]`. A three-stage protocol was a single day. It now produces **one block per
stage**, dated `startDate + protoOffset + stage.day` — which is also what lets two protocols
interleave on the calendar (Gibson on day 0, Transformation on day 3, in one experiment).

**The stage is snapshotted into the block** (`b.proto = {pid, protoName, stageId, v, name,
badge, variant, body}`), not looked up live. A notebook entry is evidence: it has to render the
same years later even if the protocol was edited or retired, and it must not need Archive loaded
to display. `proto.v` records the version it came from, so a later protocol change can still be
offered as an update.

Writable state lives **outside** the snapshot, so the protocol and what you did stay separable:
- `b.params[key] = {value, max?}` — **overrides only**, never a copy of the defaults.
- `b.stepNotes[stepId]`, `b.stepDone[stepId]`, and `b.note` for the whole block.

**`b.html` is a derived cache**, rebuilt by `refreshProtoHtml(b)` on every edit. That is what
keeps ~15 existing consumers (PDF export, `buildPubReadyFromExp`, search, tag filter,
`_collectAttIds`) working untouched — they still read `b.html` and never learn about `b.proto`.
`protoRenderHtml(b, live)` renders interactive (chips, ticks, note buttons) or static (the
cache, the PDF).

- Parameters render as `<input class="pchip">` sized to their content, so a value stays part of
  the sentence rather than becoming a form field. A changed one is accented — the deviation from
  the protocol is visible without opening anything.
- `freeEditBlock` is the escape hatch and is **one-way**: the block becomes ordinary rich text,
  stops following the protocol, and records `b.freedFrom` so the entry still says where it came
  from.
- Blocks with no `b.proto` (presets, older experiments, `SYNTH_PARTS`) keep the free
  contenteditable exactly as before. So does an Archive that only speaks API v1.
- The New-experiment modal pulls each protocol's stage list up front (`nmLoadStages`), so the
  preview shows the real dated stages instead of promising "1 block" and producing 8. Protocols
  with delivery variants (`crispr-ko`, `crispr-ki`) get a method `<select>`; each protocol gets a
  start-day offset.

**`PROTOCOL_VERSION` is declared outside the `PROTOCOL_DATA` markers on purpose.** It was
originally inside them, and the next `migrate_protocols.py --inject` silently wiped it — which
made `ARCHIVE_PROTOCOL` throw into its own `catch` and return `null`, so every experiment
quietly fell back to the flat one-block path. Anything declared between those markers is
regenerated away.

## Labbook: one day view, and live cultures

**Today** (`kind:'today'`) and any Notebook date are now the *same screen* — `renderDayView(host, D)`
— with a date navigator. Three places showing the same block was the thing that needed cutting:
the Notebook day page, the `__ongoing__` dashboard and the carry-over list have become one view.
`renderOngoing` and the `__ongoing__` page item are gone; what they were for survives as
`ongoingHtml(D)`, a compact strip of running experiments with progress and the date of their
next step. Today hides the middle pane (it joins `week`/`archive` in the condition that already
existed in `renderPages`) because there is nothing to pick from — the day *is* the thing.

Order in the day: steps due · carried over · tasks · **cell cultures** · running experiments ·
daily note. The note is last because it is the biggest surface and the one you scroll to when
you are already working; the actionable parts come first.

**Cultures are read, never copied.** `lbCultures()` reads `window.parent.JournalStore.get().incubator`
and calls the shell's `computeCellAlerts` — the same store and the same canonical alert logic
Incubator itself uses. Nothing is duplicated, so nothing can drift, and a passage logged in
Incubator shows up here immediately: `lbWatchCultures()` subscribes **once** and patches only
`#lb-cultures` rather than re-rendering the view, or an update arriving from another app would
yank the caret out of whatever you were typing.

In the standalone build there is no shell, so `lbCultures()` returns `null` and the section is
**not drawn at all** — no empty panel implying you have no cells. Same honesty rule as
`hasCloud()`.

`setNotebook(html, D)` now takes the date explicitly; it used to read `SEL.page`, which is null
in the Today view.

## The Echo ↔ Labbook loop

This is the demo the product direction calls for, and it runs in both directions.

**Verified end to end (2026-08-25)** on Echo's own bundled test data — one picklist, six
PHERAstar plates: 1,320 merged points, 21 compounds, 3 proteins, 63 fits, *Send to Labbook*,
63 rows in the Results tab with the 24 flagged ones still flagged, and a Results sentence in the
publication paragraph. Three things had to be fixed for that to be true:

- **The results were being thrown away on the most likely path.** `_mergeDHubContext` needs an
  experiment and took `_curExp()` — but you fit curves in Echo with Labbook sitting on its
  dashboard, so `_curExp()` is null and the whole analysis died in a toast telling you to open
  an experiment and press Send *again*. It asks which experiment now (`_pickExpForContext`,
  newest first, closed ones sorted below), opens it on the Results tab, and says plainly when
  you cancel that nothing was attached. `lbPicker` grew an optional `onCancel` for exactly that:
  a caller holding data has to be able to tell "picked" from "dismissed".
- **"63 compounds gave measurable DC50 values"** — 21 compounds against 3 targets is 63
  measurements, not 63 compounds. Compounds are counted, pairs are ranked.
- **The top three named the same compound three times**, because a potency belongs to a
  compound *against a target* and the target was not in the sentence. Now it is, and the ranking
  is deduplicated by compound-target so a pair fitted on two replicate plates is one result.

**Picklist → plate map.** `parseEchoPicklist(text)` reads a Labcyte transfer CSV in Labbook
itself — not through Echo — so it works from the file alone with Echo closed. It finds the
header by looking for `Destination Well` (there is a preamble and a `[DETAILS]` line above it),
groups by destination plate, and returns wells carrying compound, concentration and summed
volume. `applyEchoToPlate` writes them onto an existing map, keeping every well it does not
touch. Two rules matter: a transfer whose `Transfer Status` is set and not OK **never reached
the plate**, so recording it would be a lie; and DMSO backfill transfers carry no sample name
and must not overwrite the compound already in the well. Concentrations are converted out of
molar into how they are spoken (`2.001E-05 M` → `20.01 µM`). Verified against Echo's own 2,867-line
test picklist: 7 destination plates, 14 compounds, 308 wells, and `plateSummary` then reads them
back as "EDA-099 · 10 concentrations ×2 replicates · B2–C11" with no typing at all.

**Potencies → the experiment record.** Echo gained `sendResultsToLabbook()` and a *Send to
Labbook* button next to Copy TSV, plus `ECHO_RESULTS`/`ECHO_API_VERSION` on the parent. It posts
`dhub:context v1` with a `results[]` entry carrying compound, target, potency, effect, Hill, R²
and Echo's own flag, labelled per assay type (`DC50`/`IC50`/`EC50`/Potency). Labbook renders them
in a new **Results** tab (`resultsPaneHtml`), keeping the flag visible so a curve Echo was
unhappy about stays visibly unhappy in the notebook. `pubResultsSentence` folds them into the
publication prose, **excluding flagged rows** and sorted by potency.

Note for anyone testing Echo from the outside: `_lastResultsData` is a top-level `let`, so
assigning `echoFrame.contentWindow._lastResultsData` does *not* reach it. Use `eval` inside
Echo's own scope, or call `renderResults(data)`.

## Cells — Incubator + Cell Archive + Iceberg as one app

A line becomes a flask becomes a vial: one lifecycle that used to be three home cards joined by
nothing but matching strings. **Merged at the shell, not by merging three codebases.** `view-cells`
holds a tab bar (Cultures · Lines · Freezer) and the three existing frames are *moved into it*
on first open, so each keeps its own window, CSS, ids and state, and no data moves. `openApp`
routes `incubator`/`cellarchive`/`cryo` into `openCells(tab)`, so Labbook's `openIncubatorLink`,
saved `#hashes` and the app catalog all keep working untouched.

**The join is resolved at read time, not migrated.** All three write the cell line as free text —
Incubator splits `baseLine` + `titleSuffix`, Iceberg writes `"HCT116, DCAF15 KO #15 JMM06 Pool"`,
Cell Archive stores the plain name. `cellsBaseLine()` takes the part before the first comma;
`cellsLineStats()` sums cultures from `JournalStore.incubator` and vials from Iceberg (preferring
the **live frame**, since Iceberg only writes localStorage on change and a fresh session has an
empty stored copy). Cell Archive's tiles then read "HCT116 · 1 in culture · 3 vials". Rewriting
real vial records to carry ids, just to gain a join that name resolution already provides, is not
a trade worth making.

**Correction to an earlier claim in this file:** Cell Archive's 760 KB was described as static
prose. It is not — it is **9 embedded JPEG micrographs** (709 KB); the markup is only 41 KB. They
are 720×540 but displayed at 130×130 with `object-fit:cover`, and nothing enlarges them (no
lightbox, no click handler). Resized to 347×260 at q82 they still exceed what can reach the
screen: **742 KB → 323 KB**. Do not delete these photos — knowing what a line should look like
down the microscope is the reason the tab exists.

## Archive Library — the reagents this lab makes or buys

Archive is no longer only protocols. A kind switcher (`LIB_KINDS`) sits above the search:
**Protocols · Antibodies · Primers**. Protocols are shared, universal and read-only; antibodies
and primers are *yours* and change, so they live in the same store the rest of dHUB uses
(`journal/antibodies`, `journal/primers` via `JournalStore.libAdd/libSet/libDel`) rather than
inside Archive's own file. `LIB_FIELDS` declares each kind, so a third kind is a data entry, not
three more methods.

Scope is **catalogue + location + lot**, not stock management: what it is, whose, catalog, lot,
the dilution that worked, and where it physically lives. Inventory with quantities only tells
the truth if every use is decremented, and a stock figure nobody maintains is worse than none.
Primers show computed **length, GC% and Tm** (Wallace under 14 nt, GC-based above) — a hint, not
a replacement for the supplier's value.

**Plasmids and cell lines are deliberately *not* duplicated here.** Plasmids is a working app
with a GenBank map renderer, and cell lines live in Cells with the culture and vial counts that
give them meaning. Copying either into Archive would create a second place to edit the same
record, which is the problem this rework exists to remove.

**Standalone Archive (the bench PWA) falls back to `localStorage`**, so records are editable
offline and reconcile last-write-wins *per record*. That cost is printed in the UI rather than
hidden — same rule as `hasCloud()` in Labbook.

**Labbook's antibodies were copied, not moved.** `migrateAntibodiesToLibrary()` runs once
(`LB.data._abMigrated`), dedupes by normalised name, preserves `usedIn[]`, and leaves
`LB.data.antibodies` **exactly as it was** — so nothing is lost if the shell is unavailable or
the move is reversed. Labbook's Antibodies section reads the shared store when there is one and
falls back to its own.

Bridge: `ARCHIVE_LIB(kind)` returns the catalogue; `ARCHIVE_LIB_USE(kind, id, expId)` records a use.

## What the typed parameters bought

Everything here exists because a protocol step's numbers are typed values rather than characters
in a sentence. None of it is possible in a rich-text notebook.

- **Deviation report** (`expDeviations`) — `b.params` holds overrides only, so the difference
  between the protocol and this run is already in the data. Panel above the day blocks, plus its
  own sentence in the publication prose.
- **Bench timers** (`startTimer`) — a play button on every `time` parameter; timers stack
  bottom-right naming the step they came from, beep, and hold a screen wake lock.
- **Biological replicates** (`repeatExperiment`) — a repeat *is* the next replicate, so it joins
  a `repGroup` and shows "Biological replicate 2 of 3" linking siblings. Dates rebase keeping
  the intervals; ticks reset; **params and notes are kept on purpose** — a replicate repeats
  what you actually did, deviations included.
- **Picklist → experiment** (`nmImportEcho`) — the Echo preamble names the protocol
  (`HB20260504_BET.edr` → type HB) and the run date; the wells give the format; the destination
  plate becomes the plate map. One file, whole experiment.
- **Reader values on the plate** (`plParseValues`, ported from Blueprint's `pdParseValues` —
  translate its `{rows,cols}` to Labbook's `{r,c}`) — colours across the range present, numbers
  where the format has room. A dead column is obvious here and invisible in a fitted curve.
- **Hub-wide Cmd+K** (`spotBeyondLabbook`) — protocols, antibodies and primers with their shelf,
  cultures, freezer vials with their box. Labbook's own antibody list drops out when the shared
  Library is reachable, or everything appears twice.
- **Thaw** (`cellsThaw`, in the shell) — oldest vial by freeze date, shows box and position
  first, **decrements the freezer before writing the culture** (an over-counted freezer is a
  smaller lie than a vial recorded twice), and seeds media/interval from the Cell Archive entry.
- **Protocol update diff** (`protoDiff`/`applyProtoUpdate`) — a block always renders the version
  it was recorded from, but says when the protocol moved on. The rule that matters: **a step
  note whose step no longer exists is moved into the block's Notes, never deleted.** A numeric
  override with no home is dropped, but only after the dialog has said so, and the deviation
  report had already shown it to you.

## Backups: an automatic one never downloads

The rule, after Jon reported a save dialog appearing out of nowhere: **a download is something
you pressed a button for.** An automatic backup may write to a folder you chose, or keep a local
snapshot. It may not open a file dialog.

Two separate daily jobs were both breaking that rule when **no backup folder had ever been
chosen** — which is the default state:

- **Labbook `maybeAutoBackup`.** Embedded in dHUB it checked `pb.writeFile` *exists* and went
  straight to `doBackup(false)`. But `window.lbBackup` always exposes `writeFile`; that says
  nothing about whether a folder is configured. `writeFile` then rejected with `nodir` and
  `_doBackupWrite`'s catch called `_download()`. It now asks `pb.dirName()` first, and the catch
  only downloads when `manual` is true — otherwise it keeps a snapshot and explains once.
  (The *standalone* path had already been fixed for exactly this; the embedded one had not.)
- **Shell `backupJournal`.** Its own comment said "never auto-downloads". It did: the same
  `nodir` rejection hit a catch that downloaded unconditionally. Now gated on `manual`.

So on the first load of any day with no folder set, you could get **two** unexplained JSON save
dialogs — one per job — and nothing said why.

Also added so the safety net is visible rather than mysterious: `_markBackup(kind)` records
*when* and *where* (`folder` / `download` / `snapshot`), and `backupStatus()` puts it on the
Backup button ("Last backup today") and in its tooltip ("Saved today to your backup folder").
The one-time nudge now leads with **"Nothing was downloaded"**, because that is the thing the
user is confused about.

## Visual system, and what dHUB stopped being

Jon's read was that Labbook felt "frágil y poco compacto" and dHUB "una página genérica hecha
por IA". Both had concrete causes.

**One type scale, one radius scale.** Labbook had 22 distinct font sizes, the shell 23, Archive
17 — including half-pixels (12.5, 10.5, 9.5), which is what per-component nudging looks like
after two years. Eight values between 7px and 10.5px were all doing one job. There are nine
steps now (`--fs-1` … `--fs-9`: 10 · 11 · 12 · 13 · 15 · 17 · 20 · 26 · 38) and five radii
(`--r-1` … `--r-4`, `--r-full`). 661 substitutions; **no loose px value for `font-size` or
`border-radius` survives in any of the three stylesheets.** Inline styles built in JS strings
are deliberately untouched — smaller, riskier to rewrite blind.

**One icon language.** `tbSvg()` (24×24, stroke 1.9, outline) is now the only one. Every emoji
and glyph used as an icon is gone: `α` `#` `⚗` `⏱` `▶` `🧫` `❄` `▤` and the five file-type emoji.
`hdIcon()` wraps one at label size so a heading reads as a single object. What remains is
typography, not iconography: the `✓` inside a checkbox, `X₂`/`X²`, `α-Tubulin` as a default
value, and DH5α in protocol prose.

**The ribbon sizes to its content.** `.rb-pane` and `.rb-lbtn` had fixed `height`, so anything
needing more room was clipped against a ceiling — that is what broke when the backup status was
put inside a button. Both are `min-height`. The status itself moved next to the save pill, which
is where you already look. Insert went from eleven 82px buttons (~900px, running off the edge)
to six at 68px, with the rest in the `/` menu — and `SLASH_ITEMS` is now one declared list, so
the menu genuinely contains them. It did not at first: Web link and Tag were in neither place
after the trim.

**dHUB lost 1,565 lines and 40% of its size** (297 KB → 179 KB): three easter eggs including a
32 KB inline-SVG comic with colleagues' real names, a 28 KB embedded changelog, twelve jokey
rotating subtitles, the weather widget and its painted sky, and a ~340-line card-reorder
subsystem driving `#hub-packages` — an element the current home never builds. `tryUnlock` was
defined twice; the earlier copy and its three helpers were dead weight attached to the live
input.

**Kept on Jon's instruction:** the code-word unlock. It hides the app list from casual visitors,
which is what he uses it for. It is *not* access control — the words are in plain JS and every
app is embedded regardless.

Two traps this pass hit, both worth remembering: an end-anchor searched from the start of the
file instead of forward from the start index duplicated 14 KB, because
`classList.add('pulsing')` appears twice; and the reorder block spans into `initHub`, so slicing
from its comment to the next landmark crossed a function boundary. Assert brace balance before
writing, and load the page — neither showed up in a diff.

## ChemLib integration (Rubén Prieto)

**ChemLib** is a lab-management app in the same group: FastAPI + SQLAlchemy + SQLite, JWT cookie
auth, vanilla-JS frontend where ~15 scripts share one global scope, no build step. It already
has an ELN, a biology assay module with its own client-side 4PL (`_beFit4PL` + `_beNelderMead`,
Nelder–Mead), and a D2B plate module.

**The seam is an iframe, never a script merge.** ChemLib's scripts all live in one global scope
and already define `showToast`, `api`, `escHtml`, `closeModals`, `#modal`, `#search-input` —
pasting a thehub app in as a 16th script would collide silently. An iframe gets its own window,
scope and CSS cascade, which is what dHUB already does. Nothing here requires changing
`shell/hub-shell.html`, `embed.py` or the base64 pipeline; it is additive.

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

**Fit engines:** Echo's LM 4PL is canonical here and guarded by `tools/check_shared.py`. It can be
offered to ChemLib, but only after both fitters are run on the same real dose-response data and
shown to agree — the bar `tools/sync_fit_engine.py` already sets. A fitter that produces published
DC50s is not swapped because the shapes look similar.

### Offline / self-hosted robustness

A self-hosted ChemLib may sit behind a firewall, and a bench laptop may have no wifi, so remote
dependencies matter. Chart.js is now **embedded** in Dora, LDI and Lumina (all standardised on
4.4.2, the copy Echo already carries) — LDI is fully self-contained as a result. Every app's
`--sans`/`--mono` carries a real system fallback stack, so a blocked `fonts.googleapis.com`
degrades to the platform UI font.

**SheetJS is carried once, by the shell** (2026-08-23). Dora, Lumina and Iceberg fetched it from
cdnjs, and Excel is the primary input for the first two — offline they opened, showed a banner
and could do nothing. An app inside a `srcdoc` iframe is same-origin, so it now takes
`window.parent.XLSX` before its own `<script src>` runs; the CDN tag stays as the standalone
fallback, and when it loads it simply replaces the reference with the same library at the same
version. Verified with the CDN tag removed: all three hold the shell's own object and a
write-then-read round trip works.

Cost **+0.84 MB** on the bundle (10.72 → 11.61 MB). Embedding a copy in Dora and Lumina instead
would have cost ~2.35 MB after base64 and left Iceberg out. **Echo, Beacon and BCA keep their own
embedded copies** — Echo's primary input (PHERAstar XLS) goes through `XLSX.read`, and an app
that cannot be opened on its own is not what self-contained means. That is why this is +0.84 MB
rather than the −1.22 MB a naive "remove the duplicates" reading suggests.

Still remote, deliberately: **3Dmol** (Ribbon, ~2 MB, out of the product build), and SheetJS for
any of these apps opened outside the Hub. Each app still shows a plain banner when the global is
missing at load instead of throwing into the console.

**Two remote dependencies this section used to omit entirely** (audited 2026-08-22):

- **jsPDF from cdnjs** in Echo (`apps/echo/echo.html:434`). PDF export dies offline; Echo already
  shows a banner for it. Analysis, plots, XLSX and CSV all work.
- **RDKit from unpkg** in Echo (`:5508`) and Dora (`:1171`). Structure rendering dies offline and
  **neither app has a page-level banner for it** — Echo throws into its own log, Dora shows only
  status text. Echo's section header claimed the opposite ("embedded RDKit.js, fully offline");
  it now says what is true. This is the one dependency still unannounced to the user.

The shell itself loads **four Firebase scripts from gstatic**. Until 2026-08-22 a blocked gstatic
meant a blank page — `firebase.initializeApp` was an unguarded top-level call inside the single
`<script>` block that also defines `JournalStore`, `WS_NAV` and the DOM wiring, so one
ReferenceError took all of it with it. `FB_OK` now gates every SDK call site and the hub renders
with an offline banner. Verified with the four tags stripped.

## Archive as a phone app (installable PWA)

`python3 embed.py --profile=archive` packages Archive on its own for bench use:
`index.html` + `manifest.webmanifest` + `sw.js` + `icons/`. CI builds it on every push, so it is
live at **`https://maciciorjon-hash.github.io/thehub/archive-14cadcd792a2/`** — Safari → Share →
*Add to Home Screen* gives a real app icon, no browser chrome, and it works with no signal.

**The path is the access control.** A private repo still serves a *public* Pages site (per-site
access control is Enterprise-only), so Archive is published under an unguessable slug —
`ARCHIVE_SLUG` in `embed.py` — plus `noindex` on the page and a site-wide `robots.txt`
(`Disallow: /`, written into `dist/` by the main build) so it never turns up in search. Be honest
about what that is: a **bearer link**. Unguessable, but permanent for anyone it is sent to, and it
leaks through browser history. **Never change the slug** — every installed home-screen app is
pinned to it and would silently stop updating. If it ever needs to be genuinely private, the two
real options are an encrypted payload unlocked by a passcode (AES-GCM + PBKDF2, decrypted
client-side, keeps offline + one-tap) or moving to a host with auth in front (Cloudflare Pages +
Access). Note the dHUB `APP_UNLOCK_WORDS` code gate is **not** protection — the codewords are in
plain JS and every app is embedded regardless.

**The source file is never modified for this.** `apps/archive/archive.html` is already self-contained
(no external JS, notes in `localStorage`, and the two dHUB hooks — `window.parent.openApp` and
the Firebase note sync — fall back to a toast). The profile injects the manifest link, the Apple
meta tags and the service-worker registration at build time, so **the copy embedded in dHUB never
registers a service worker** — which matters, since a `srcdoc` iframe cannot anyway.

- **Offline strategy is cache-first**, deliberately: at the bench there is often no signal, and a
  protocol that opens instantly beats one that is seconds-fresh. Navigations always resolve to the
  cached `index.html`. Everything else is cache-first with runtime caching, which is what pulls the
  Google Fonts CSS/woff2 in on the first online run.
- **Updates**: the cache name carries a hash of the built HTML (`archive-<sha8>`), so a new build
  is a new cache; `activate` deletes the old ones. A running app shows a toast ("Update ready —
  reopen Archive to apply") rather than swapping the page under you mid-protocol.
- **Icons are committed**, not generated at build time: `apps/archive/icons/*.png`, regenerated by
  `python3 tools/make_icons.py` (Pillow) only if the glyph or accent changes. iOS ignores
  SVG for `apple-touch-icon`, which is why these are PNG.
- `embed.py` **fails loudly** if an icon is missing rather than shipping an uninstallable app.
- Verified end-to-end over `localhost` (service workers need a secure context): registration,
  precache contents, and a full reload with the server stopped — all 33 protocols and their
  calculators work with no network.

**Bench affordances in `apps/archive/archive.html`** (shared with dHUB, not PWA-only): the `.dtabs`
row is `position:sticky` on ≤720px so Protocol/Calculate/Output stay one thumb-tap away in a long
protocol; `#app-body` is the scroll container, so `openProtocol` resets *its* `scrollTop` (the old
`window.scrollTo` did nothing on a phone) and `closeProtocol` restores where you were in the list;
`env(safe-area-inset-*)` on the header, page padding and FAB for the notch/home bar; a header
magnifier that appears only when a protocol is open on a narrow screen (`_syncSearchBtn` →
`goSearch`); and a **keep-awake toggle** (`toggleWake`, Screen Wake Lock) so a 20-minute incubation
doesn't blank the screen — it re-acquires on `visibilitychange`, since iOS drops the lock whenever
the app is backgrounded.

**Public-exposure note:** the root build at the Pages URL already embeds Archive and is still
served publicly at a guessable address — the unlisted slug protects the phone app, not the Hub
(see *Open items*).

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
- **Firebase Storage is enabled** (2026-08-27). The bucket is
  `thehub-f80ae.firebasestorage.app` in `europe-west1`, matching `storageBucket` in the shell,
  with `storage.rules` published — `labbook/**` and `plasmids/**` for the admin email, all
  else denied. Before that the bucket did not exist and every upload failed; `_cloudUnavailable`
  said so once and fell back to device-local + backups, which is still the behaviour if a
  write is ever refused.
- **Attachments added before that date were never uploaded.** `_attUpload` runs only when you
  attach, so anything older lives solely in the IndexedDB of the browser it was pasted into —
  it reaches backups, not the other machine. A backfill (walk `_collectAttIds()`, upload the
  ids with no `LB.data.attachments[id].url`) is the fix and is **not built**.

## Inventory says where things are (2026-08-20)

The complaint was that Plasmids was useless — you could not open a record, see where it was, or
look at a box. The root was wider: **nothing in the Hub said where anything physically is.**
Library records carried a free-text `location`, cultures had none, and only Iceberg knew what a
box was — for cell vials only.

**Iceberg is now the one freezer map, for everything.** A vial record carries a `kind`
(`cells|plasmid|antibody|primer|other`); absent means cells, so nothing migrated. Cells keep
writing `cellLine` because every reader outside the app expects it there; other kinds write
`label` + `conc`, and everything that colours, searches, groups or exports goes through
`vialLabel(v)`. Storages are rendered from `state.storages` with a `+` button, so −20 °C and
4 °C exist and an antibody has a home; the four hardcoded `['minus80','n2']` loops now walk
whatever is there. `box.log[]` keeps discarded vials with a reason (**discard ≠ delete**).

The shell exposes `HUB_FREEZER` / `_WALK` / `_FIND` / `_LOCATE` / `_TEXT` / `_PLACE` / `_BOXES`.
**`_WALK` is the only traversal** — `cellsFindVials` and `cellsLineStats` were two more copies
and now go through it. Anything that wants to know where something is asks; nothing keeps a
second copy of the answer.

**Vials without retyping**: "how many" fills that many *consecutive free positions* rather than
stacking a count on one key (a stack was a picture of the box the box did not agree with, and
made "how many are left" unanswerable by looking); plus duplicate-to-next-free, shift-click to
paint a rectangle, and a form prefilled from the last thing put in that box (`box._last`).

**The lifecycle closes both ways.** `hubThawVial(loc)` in the shell is the one implementation —
it must decrement the freezer *before* writing the culture — with three doorways: the Freezer's
vial modal, the Lines list, and anything holding a slot. `freezeCulture(id)` in Incubator is the
counterpart: pick a box, say how many, and real vials land in consecutive free positions
carrying the line, passage and media already on screen.

## Plasmids: one home, and maps you can actually read

`old_stuff/plasmids/plasmids.html` is **retired** — dropped from `APP_INFO`, the home group, `embed.py`
and the shell. `openApp('plasmids')` routes to Archive → Library → Plasmids via a
`dhub:context {lib:'plasmids'}` message, so saved `#hashes` and Labbook's `data-app` links still
land somewhere real. The file stays on disk, unreferenced.

**Every Library kind got a master/detail.** `renderLib` rendered static text with a delete
cross; there is a list (name · identifying facts · location chip) and `libOpen(kind,id)` opens
the record with editable fields, location, notes and used-in. That fixed antibodies and primers
at the same time.

**Location is structured**: `r.loc = {storage, rackId, boxId, pos}` plus a cached `locText`.
`libPickLoc` opens the freezer map itself and you click a free position; it writes **both** the
record's `loc` and the Iceberg slot (with a `ref` back to the record), so the two cannot drift.
No shell ⇒ prompt fallback that says the map is not there.

**`parseSnapGene(buf)` reads .dna directly** — `0x09` header + `SnapGene` magic, then
`[type:u8][len:u32be][payload]`; type 0 sequence (first byte's low bit = circular), 10 feature
XML, 6 notes. It returns **the shape `parseGenBank` returns**, so there is one renderer, not
two. Verified against the same construct in both formats: identical features, byte-identical
sequence. `parseGenBank` now also reads `ORIGIN`; FASTA loads; a file can be dropped on the
record.

**The viewer** is a labelled ring with bp ticks, a linear view, the sequence at 60/line with the
selected feature called out and copyable, and the cutters. `findSites` searches the sequence
**wrapped by one site length when circular** — a site straddling position 1 is exactly the one
that ruins a digest, and a linear search silently misses it (verified: a planted EcoRI site
across the origin is found circular, missed linear).

Bytes stay in the `archive_maps` IndexedDB; only metadata goes on the record. `_pmCache` holds
the parsed model so switching views is not a re-read.

**Two bugs found here**: `libAddFromForm` generated the `pJM##` code *before* reading the form,
so the empty Code input wiped it — every plasmid added through the form had no code. And
`migratePlasmidsToLibrary` used one "done" flag, stranding anything added to the old app after
the first run; it remembers which source records it has seen instead. **That migration matters
now** — it is the only route from `localStorage['hub_plasmids']`.

## An antibody is a target

`LIB_FIELDS.antibodies` leads with `target` and has no `name`: the name was always "α-" plus the
target typed again, which is two fields that can disagree. `libDisplayName`/`abName` derive it in
one place, used by Archive's list and detail, Labbook's `@` list, the insert picker and Cmd+K.
Legacy records keep their `name` and have a target read out of it.

**The regex is worth remembering**: alternation is ordered, so `/(α|a|anti)/` matched the bare
`a` first and turned `anti-DCAF15` into `α-nti-DCAF15`. Longest alternative first, and a bare
`a` only strips when a separator follows — otherwise `ALK` and `Actin` get mangled too.

**The Antibodies tab in Labbook was data, not code.** An older seed created a `generalSections`
entry; the seed stopped, but nothing removed the ones already written.
`cleanupAntibodySection()` (guarded by `LB.data._abSecCleaned`) deletes an **empty** one and
leaves one with pages alone.

## Cells: a list, a drawer, and a location

Cultures were a wall of flask drawings that expanded in place, so the list reflowed under the
cursor. There is a dense sortable list (status · line · P · vessel · media · **next split** ·
where), overdue first, with the detail in a **right drawer**. Search plus All / Overdue / Needs
attention / Healthy with live counts. The grid survives as a toggle — the flask and plate
drawings are the good part.

`_incLayout` (list/grid) and `_incView` (flask/plate) are **separate now**; they shared one
variable, so choosing "Plates" also decided whether you got a list. Cultures gained
`incubator` + `shelf` — live cells are inventory too.

Cell Archive lost its tab bar and the Guide behind it (an "about this reference" blurb two
clicks away). One panel, a search, and the same Grid | List toggle — implemented by
**restyling the tiles into rows**, not by a second renderer, so user lines, the add tile and the
culture/vial badges work in both. The Cells tabs read **Incubator · Lines · Freezer**.

## OneNote export

OneNote's paste keeps inline style and discards stylesheets — which is why copying out of
Labbook arrived as unstyled text. `buildPrintDoc()` already resolves whichever entry you are on,
so `buildOneNoteHtml()` renders it off-screen and **inlines the computed styles**.
`copyForOneNote()` writes `text/html` + `text/plain` via `ClipboardItem` with an
`execCommand('copy')` fallback (Safari/older Firefox — `writeText` cannot carry the HTML
flavour); `exportOneNoteDoc()` saves the same HTML in a Word envelope for Insert → File Printout.

Three traps, all found by looking at the output:
- The stage is positioned off-screen, **never `display:none`** — `getComputedStyle` on a hidden
  tree returns nothing usable.
- **Read every element's style before touching the DOM.** Removing the `<style>` block during
  the walk stripped the CSS out from under everything measured after it, so tables came out
  unruled — measured correctly, with no stylesheet left to measure.
- `PRINT_CSS` is written against `#print-root`, which the stage is not; it is **rescoped to the
  stage** rather than given a duplicate id.

Checkbox squares are `::before` and cannot be inlined, so real ☐/☑ characters go in first —
and `list-style-type:none` is the one place `none` is the value we mean, not a default to skip.

## One blue, and icons that survive a non-Retina monitor

Every app's `--accent` is one pastel blue (`#5e87c5` light / `#8aaee0` dark, with `--accent-dim`
and a new `--accent-soft`) — a colour the Hub already wore as Archive's `--accent2`. Each app's
own colour survives as **`--brand`**, used only by its 32px logo box; home-card tints are
unchanged. Labbook and Cells get their own brand blues (`#3f6fa8`, `#4a8fb5`) rather than
collapsing onto the Data Analysis card. Semantic greens (`--good`, "ok" badges, chart series)
are deliberately left alone.

`tbSvg` drew stroke **1.9** into a 24 viewBox rendered at **20px**, so every stroke landed at
1.58 device px — small and muddy at once. Icons render at their native 24px with a **1.5**
stroke and `geometricPrecision`; Insert buttons grew 68→76px to hold them.

## What was left over in Labbook (audited 2026-08-20)

An audit for dead and duplicated code, re-run until it came back clean — removing the first
round orphaned two more (`printBlocks` lost its only caller, `.dock-btn` its only user).

**The panel drag-and-drop subsystem could not run.** All three panels are `dockOnly`,
`#rb-move` does not exist, and nothing in the document is `draggable`. `panelDrag`,
`panelDrop`, `movePanel`, `_dragPanel`, the `dockOnly` flag, the persisted `LAYOUT.panels`
map and the `.rb-move-zone`/`.panel-swap`/`.pdrag` CSS are gone. `DOCK_PANELS` is the list.

**`renderPanels` built every panel body twice** — `panelDom` calls `build()`, then
`renderDockPanels` rebuilt all three on top. `renderDockPanels` stays (refreshing bodies in
place is what you want when a tag changes); the redundant call does not.

Also gone, each defined and never reachable: `btns()`, `applyFont()` (no font-family picker
exists; `applyFontSize` is the survivor), `printExpBlocks()` + `printBlocks()` (superseded by
`printExpByDay`), `plateGroupRange()` + `plateWellText()` (superseded by
`plateSummary`/`_compactRanges`), and 15 orphaned CSS classes — including the `.ov-*` rules
left from the `renderOngoing` dashboard the one day view replaced.

**One thing was half-dead, and was fixed rather than deleted**: `openImageIns` is a complete
inline-image picker with no entry point — paste and drop were the only routes to an image in
the text. It is in the `/` menu as **"Image in the text"**, beside Picture (which places a
movable object).

The audit is reproducible: parse `function NAME(`, count occurrences of `NAME` in the whole
file, and flag any where the count equals the number of definitions. Same trick on `.class`
selectors, comparing the stylesheet against everything after `</style>`.

## The Incubator flask, and phenol red

The old drawing was a rectangle with a stub on its side, which is why it read as a blob. What
makes a T-flask recognisable is the canted neck: the body is a rounded rectangle with the
top-left corner cut at 45° (`FLASK_BODY`), and a real tube rises out of that cut in a rotated
frame, capped, with two vent ribs.

**The body must be opaque** (`.vsl-base`). The neck is drawn behind it, and through a
translucent glass fill it showed as a diagonal line straight across the medium.

**The fill colours are phenol red, not a traffic light.** Fresh medium is red-pink and
acidifies through orange to yellow as the culture grows out — so a healthy flask is red and an
overdue one is yellow. It reads as inverted status colour until you know that, which is why
`_vslStops` now says so. The passage number is dark ink: the fills went pastel, and white
needed a heavy shadow to survive on the yellow.

## The workspace: one file, two faces

**Signed out, dHUB is what it always was** — the 42px title, the `discover` box and the cards
you unlock with a code word (`_renderVisitorGrid`). That is the public face on Pages and it is
deliberately unchanged.

**Signed in, the same file is a workspace**: a rail down the left (`#ws-rail`, 180px with icon
and label, collapsing to 52px — `localStorage['hub_rail']`), the section you are in named in
the header (`#ws-where`), and Labbook's own dashboard as the home. `renderSuites()` is still
the dispatcher; it toggles `body.ws` and everything follows from that class.

**The rail is categories only** — Home · Labbook · Data Analysis · Archive · Cells · More apps
(`WS_NAV`). Labbook's own tree stays inside Labbook, one level down. `wsGo(id)` routes: the two
Labbook entries open the frame and post **`{type:'lb:go', view}`** (a ~15-line handler next to
Labbook's `dhub:context` one); the rest render a landing here.

**The home is Labbook's dashboard, not a copy of it.** The shell opens the Labbook frame at
`kind:'home'`. One implementation, in `apps/labbook/labbook.html`, serving both the workspace
and `labbook-standalone`. Rendering a second copy in the shell would mean two panels reading
two sources — `LB.data` here, a `localStorage` snapshot there — which is the duplication this
rework exists to remove.

**Landings follow one rule: a live band, then cards for what is inside** — apps when the
category is a group of apps (Data Analysis), sections when it is one app (Archive → Protocols ·
Antibodies · Primers · Plasmids; Cells → Incubator · Lines · Freezer). Every target already had
an entry point (`openApp`, `openCells(tab)`, Archive's `dhub:context {lib}`), so no app had to
learn anything new. A band whose source cannot be read draws **nothing**, never a zero.

Three things that bite when the rail exists:
- `.app-view` and `#hub-home` shift by `var(--rail-w)` under `body.ws`. Nothing else about app
  hosting changed — `_loadApp` already hides each embedded app's own header.
- `enterAppNav` must not overwrite `#ws-where` for Home and Labbook: they are the *same frame*
  at two views, so the app's name would erase which of the two you asked for.
- The logo means "go home" in the workspace, not "back out of the app" — the home *is* an app.

**On a phone the rail becomes a bottom tab bar** (`#ws-tabs`, five tabs; More apps lives inside
Home), `.app-view` gets `bottom:56px`, and Labbook's floating pane button is hidden on Home.

### Labbook's home (`kind:'home'`, the default landing)

`renderHome()` — the band (progress ring over today's steps, the carried-over ones flagged, the
cultures needing attention), This week, Running experiments with progress and next step,
Projects that drill into folders and then experiments **inside the card** (`HOME_PROJ`),
Recently edited, Results in from Echo with their flags intact, and Deviations. Every number
comes from data that already existed — `blocksForDate`, `carryoverForDate`, `b.done`,
`e.status`, `e.updated`, `expDeviations`, `lbCultures` — no schema was added.

`SEL.node` now defaults to `{kind:'home'}`; it used to be `notebook`, which meant a fresh
session opened on *"Nothing open — pick an entry on the left"*. On Home the ribbon and the
right dock are hidden (`body.lb-on-home`), and **the tree is hidden only when there is a host
frame**: in the standalone build the rail does not exist, so hiding it would make the home a
room with no doors.

## One visual system, and the audit that keeps it

`docs/UI.md` is the standard every app is edited against — the two scales, the palette, the
components, the breakpoints. It is **not** a stylesheet anyone imports (there is no build step
here); it is what stops the twentieth app from inventing its own eighteenth grey. Three
exceptions are written into it rather than "fixed", because in each case the token would be the
wrong answer: values inside JS strings, **text drawn inside an SVG** (sized against the drawing's
viewBox, not the interface), and a **print stylesheet** (paper has one theme).

All 19 apps are through it. What that actually meant, app by app: none of them had the type or
radius scales (Echo alone had 106 loose font sizes, Cuppa 150); Echo, Helix and Protein Tools
were **dark-first**, so every rule was authored against the theme the Hub does not open in; Dora
carried an entire private purple palette and had **no header at all**, so opened on its own it
never said what it was; and Fabricata's dark mode was half-defined, leaving the app pale in a
dark Hub. Each app's own colour survives as `--brand` on its 32px logo; everything interactive
is the one blue. Cuppa and Fabricata keep their warm palettes on purpose — both sit outside the
product build, and a coffee ledger that looks like a coffee ledger is the point.

### `tools/audit_app.py`

The audit is a script now, because running it by regex kept being wrong in ways that delete
working code:

- **Run it with `--xref` over the shell and every app.** Per file it reports the cross-app
  bridges as orphans — `HUB_FREEZER_BOXES`, `HUB_FREEZER_TEXT`, `cellsThaw`, `cellsStatsFor`,
  `CELL_REF` — because the consumer lives in another file and reaches them through
  `window.parent`. Deleting one on the audit's word takes a live bridge with it. `--xref` counts
  uses across every file given; the whole repo is clean under it.
- **CSS stays per file on purpose.** Each app is a separate document inside a `srcdoc` iframe, so
  the shell's stylesheet cannot reach it: a class the shell defines and never applies is dead
  however many apps happen to use the same name (`.section-lbl` was exactly this).
- **It now also checks top-level SHOUTY_CASE data tables**, and a mention inside a comment does
  not count as a use. That blind spot is how `PRIMARY_CARDS` survived: a six-entry table whose
  one reader was an orphan function, so removing the function left the table unreferenced and
  the audit still said clean.

- **Vendor code is excluded by marker, not by shape.** Chart.js, SheetJS and UTIF ship property
  names that look exactly like class names. A density heuristic was tried first and was worse:
  Echo builds its markup from long template strings, so "minified-looking" threw away the very
  code that uses its classes.
- **Definitions come from the app's own code; uses are counted against the whole file.** Counting
  uses in the filtered text is what made Blueprint's live classes look dead — it puts a lot of
  markup on very long lines.
- **A named IIFE runs itself.** `(function initTheme(){…})()` legitimately appears once. I deleted
  two of those in Lumina before adding that rule and broke its theme and its reader dropzone.
- `// AUDIT-KEEP:` above a function marks a deliberate placeholder (Lumina's GloMax parser, which
  the UI already says is not implemented).

**Deleting a dead entry point cascades**, and that is the point: removing Echo's unreachable
`renderQCTab` orphaned four more functions, which orphaned two more. Re-run until it comes back
clean, and check each name against the *committed* version first — if it had one occurrence
before you started, it was already dead.

What the audit found that styling never would: Protein Tools still advertised a **Structure tab**
in its subtitle and guide and carried the whole NGL viewer for a screen that no longer exists
(structures live in Ribbon); Helix had `drawPlasmidMap` with hand-written feature coordinates,
from before the Vector Library learned to draw a map from a real GenBank record — two sources of
truth for where a feature sits; Incubator's `cfPrefill` had been replaced by `cfArchPrefill` and
never unhooked; and Iceberg's `renameStorage`/`deleteStorage` were complete, careful functions
with **no way in at all**, so you could add a storage unit and never fix a typo in its name.
Those two are on a right-click menu now — fixed rather than deleted, as Labbook's image picker
was.

## Three surfaces, and the OneNote tree that went with them

Jon's read after using the workspace: the OneNote metaphor is the wrong frame. It is, and the
data says so — **the notebook was already derived**. A day page is `renderDayView` assembling
that date's experiment blocks, which the experiment already owns. What was left of OneNote was
the parallel `sections → pages` filing cabinet storing the same science a second time.

Labbook is **Home · Experiments · Journal**, matching the shell rail one-to-one:

| surface | kind | renderer |
|---|---|---|
| Home | `home` | `renderHome` — unchanged; it already had the today band, This week and Running |
| Experiments | `exps` | `renderExperiments` — **new** |
| Journal | `journal` | `renderDayView` + `renderWeekPlanner` behind a Day / Week toggle |

**Nothing was deleted and no data moved.** `today` and `notebook` are aliased to `journal` by
`NODE_ALIAS` inside `selectNode`, so every existing caller — the Home cards, week column
headers, `openIncubatorLink`, the shell's `lb:go` — still works. `generalSections` and
`LB.data.pages` keep their shape and appear under Journal › Notes.

**Experiments is the surface Jon asked for**: projects expand in place into their folders and
experiments, with progress and next step, and picking one opens `renderExpEditor` completely
unchanged — Archive protocols, day blocks, calculators, plate maps, Files, Results, Output.
`lbSurface()` maps a node to its surface; `expsec` is "inside an experiment", which is the one
state where the tree shows Projects.

**The tree is contextual and hides itself.** `renderSections()` returns whether it drew
anything and `renderPages` hides the pane when it did not; `renderAll` no longer calls it
separately, so the pane's visibility and its contents cannot disagree. **With a host frame the
tree never lists the three surfaces** — the rail owns them, and listing them twice was the
duplicate Home button one level down. Standalone has no rail, so there it keeps them.

`body.lb-dash` (home · exps · week) hides the ribbon, the right dock and the mobile nav
button: none of those three screens has text being edited for them to act on.

**Creation had to move with the list.** Dropping the surfaces from the tree also dropped its
`new-proj` input, which is the only caller `addProject()` has — so for one build there was no
way to make a project. Both adders live in the Experiments view now (and the tree keeps its
own when you are inside an experiment). If you touch `renderSections`, check `addProject` and
`addSection` still have their `#new-proj` / `#new-sec-<id>` inputs somewhere on screen.

## The tooltip was three bugs

`#lb-tip` set `white-space:nowrap` **and** `max-width:240px` — nowrap wins, so the box grew to
the full one-line width of its text and covered the content under the ribbon. The clamp pinned
the tooltip's **centre** to `[60, innerWidth-60]`, which says nothing about where its edges
land. And `top` was always `r.bottom+7`. It now measures itself off-screen first, clamps its
real rect, and flips above the trigger when there is no room below.

Then the strings: OneNote was 78 characters, Word 91, Snapshots 96, and Backup was
`backupStatus().detail` plus 54 more — and the detail already repeated the right-click hint the
suffix gave. **A tooltip is a label, not a sentence.**

## Settings: one modal, four tabs

It was a 300px popover holding seven unlike things, with destructive **Reset app data** one
click from the accent swatches, plus a second popover for Lab that looked identical to it.
Now `#settings-back` with Appearance · Data · Lab (admin) · About. Re-housing, not rewriting:
`toggleOpts`, `backupJournal`, `chooseBackupFolder`, `resetAllData`, `buildLabPanel` and
`updateAdminAuthUI` all keep their names and their element ids. `toggleLabPanel` opens the same
modal on its Lab tab; `_labPanelOpen` and the `.opts-panel` rules are gone. Reset now names what
it erases instead of asking about "settings and data".

## The background was two layers

`body::before` (four accent-tinted radial gradients) **and** `#hub-bg-canvas` — an animated
"marble ripples" canvas at `mix-blend-mode:soft-light` running a permanent rAF loop, which
unlike the mesh was never hidden in-app. Both removed; the ground is flat `--bg`.

The glass surfaces stay, but the tokens had to be rebalanced: light-mode `--glass-brd` was
`rgba(255,255,255,0.7)`, a **white** border that only read against a tinted ground and vanished
on a flat one. It is a real border now, and the shadows are lighter to match.

**Full width**: the shell workspace was already uncapped; the cap was `.lh-wrap` at 1180px
inside Labbook. Home and Experiments are edge-to-edge with `clamp()` padding. `.ed-wrap` went
1060 → 1400 but **keeps a measure on purpose** — it is the prose column, and body text the full
width of a 27" monitor is unreadable.

## What this pass corrected (2026-08-22)

Everything here was found by auditing rather than by using the app, which is the point: each one
was invisible from the screen.

**Deployment did not match the documentation.** `.github/workflows/deploy.yml` ran one command
with no `--profile`, and `dist/` is gitignored — so `dist/archive-14cadcd792a2/` only ever
existed on Jon's laptop. Every installed Archive home-screen app resolves to a 404 that its own
cache-first service worker hides until a cache miss. CI now builds all four profiles and asserts
the PWA files are in the artifact. **The slug must never change.**

**`ADMIN_ONLY_APPS` was enforced only by the card renderer**, so `#labbook` opened Labbook for
any visitor on the public Pages site. The check lives in `openApp` now — the one door every
entry point uses — with a parked-and-replayed deep link, because `isAdmin` resolves after
`DOMContentLoaded` and bouncing Jon out of his own link on reload is not a fix. `openCells`
needs its own filter: it is asked about `cells` and loads three frames, two of them admin-only.

**Three Labbook data paths reported things that were not true.** A rejected cloud write called
`setSync(true)` and rendered as "Saved ✓". `applyEchoToPlate`'s bounds check compared
`dims.rows`/`dims.cols` against a `{r,c}` object, so it never fired once and a 384 picklist wrote
invisible-but-counted wells onto a 96 plate. `homeResultsCard` read `e.results`, which nothing
writes — the card could never appear.

**Echo saved nothing at all.** Ten `localStorage` calls, all `hub_theme`. It now autosaves to
IndexedDB and can save/open an `.echo.json`. Nothing new was modelled: `_lastAnalysisParams` and
`_qcOverrides` already existed, and `loadTestData()` already showed how to rebuild `File`
objects from bytes. Settings are captured as *every form control with an id* rather than a list
that would drift — with `_ES_SKIP` for the theme, because opening someone's project must not
repaint your app.

**Sync is per record.** `save()` did `r.set(LB.data)` — the whole tree, every 1.2 s — and
`lbInitSync` read once and never listened. A per-record fingerprint is diffed against what the
cloud last held, so one edited experiment sends two paths instead of thirteen. Incoming changes
never re-render the record you have open (the caret rule `lbWatchCultures` already follows), and
a record you have edited since your last push keeps *your* version and warns.

**An experiment can be closed.** `paused` and `abandoned` join the three derived states, and a
status you chose is locked so `syncExpStatus` stops reverting it. `archived` is separate from
status. Closing never ticks the steps you did not do.

**`e.setup` is editable.** `applySetupToBlocks` ran once, at creation, taking the volume
rescaling with it. Blocks keep `b.tpl` so prose can be re-rendered — but only prose that still
matches what the template produced for the old setup.

**The deviation report was structurally empty for most experiments.** It early-returned on
anything without `b.proto`/`b.params`, so a preset-built WB or CTG had nothing to report and a
changed calculator value counted as nothing. `b.calcSeed` records the planned value.

**Protocol days cannot be derived from the prose, and that is measured.** Only 18 of 153 stages
contain any day-ish phrase. Accumulating waits produced 28 proposals of which ~6 were
defensible; tightened to direct evidence it proposes 10.
`tools/derive_protocol_days.py` writes a review TSV and injects nothing on its own. The friction
it was meant to solve is already solved by `LB.data.protoDays`.

## Acting on a card, and a menu a thumb can reach (2026-08-24)

Projects, folders and experiments could be **created and opened**. Everything else — rename,
move, prioritise — either had no route or had one that existed only in the left tree and only
for a mouse.

**One menu, three doorways: right-click, a `⋯` button, and a long press.** The long press is
delegated **once** against `[oncontextmenu]`, so every menu that exists today or is added later
works on a phone. Two things must come with it, and both are the kind of bug that only appears
on a device: the click that follows the release opens the row you were only getting a menu for
(swallowed for 700 ms after a press fires), and a menu drawn under a finger that is still down
fires the item nearest the thumb (`pop._armAt`, 260 ms). The `⋯` is always in the DOM — showing
it on hover would put it on exactly the devices that have no hover — and is 36px under
`(hover:none)`.

**Move** is `moveExpTo` (the searchable picker that already existed), dragging a row onto a
folder header, `moveProject`/`moveFolder` for ordering, and `moveFolderTo` across projects —
which **re-points every experiment in that folder**, because the folder is the address and
leaving them behind files them in a folder that is no longer there. A **project** header
deliberately does not accept a drop: "which folder" would be a guess. Dropping also forced
empty folders to render while browsing (hidden again under a search or filter), since a folder
you cannot see is a place you cannot file into.

**Priority** is `e.prio` = `high|low`; normal is the **absence** of the field, so nothing is
written to every existing experiment to say it is ordinary. It sorts the Experiments list,
where you are choosing what to work on, and only **tie-breaks** Today and Running — there the
date is the fact, and floating an experiment whose next step is a fortnight away above one due
this morning would be a lie about the day.

## Cmd+K reads what you wrote

`spotAll()` indexed **names**. "What was the Gibson incubation" is a question about the
contents of a step, and the only way to answer it was to remember which day you wrote it on.
`spotContent()` indexes block prose, step notes, block notes, daily notes, page bodies,
observations, file names and captions, Echo results, and **plate maps** — the wells are
searchable because they are structured data rather than a picture, which is the whole reason
the map is modelled.

Three defects came out with it, all invisible from the screen: the index was **rebuilt on every
keystroke** (it walks Archive, the Library, cultures and the freezer; now once per open — 10 ms
build / 2 ms search over 2,139 rows); results were **unranked and then cut to 40**, so an exact
code match could be thrown away (`_spotScore`: name-prefix > name-substring > subtitle > body,
with the matching sentence shown as the row's subtitle); and **multi-word queries matched
nothing**, because one `indexOf` needs the phrase adjacent — the phrase is tried first, then
every word must appear. The tag rows were dead as well: they set `TAGFILTER` with no render, and
`selectNode` clears it anyway. A tag refines the query now, which is what the content index is
for.

## Calculators tell you their overage (2026-08-24)

The nine "verify" calculators were re-derived rather than spot-checked. Every formula was
right — GeneJET's 250/250/350 and 2×500 µL wash, NucleoSpin's 200 µL NTI per 100 mg,
C1V1=C2V2 for the TR-FRET mix at 1× (Echo dispenses nanolitres) and the FP mix at 2× (10 µL
compound + 10 µL mix), IP's µg-per-mg antibody ratio through a µg/mL stock, polybrene from a
mg/mL stock read as µg/µL, and the RNP volumes.

**What was wrong was what they said about the numbers.** Most of them printed the per-unit
arithmetic beside a total that silently included the dead-volume overage — "250 uL × 8" next to
**2.20 mL**. Anyone checking by hand gets 2.00 and nothing on screen says which is right, in the
part of the product whose whole claim is encoded domain knowledge. `_ovx(excess)` appends the
factor, and it is now in the tables *and* the exported steps, so the copy that reaches the
notebook says the same thing as the screen. `calcCTG`, `calcHiBiTLytic` and `calcMiSeqPCR`
already did this — they are where the idiom came from.

**And a master mix that cannot be made now says so.** TR-FRET and FP printed an em-dash for the
buffer volume when the components already exceeded the mix, with a total that read as if the
recipe were fine. They state the overflow in µL and what to change (a more concentrated stock,
or more volume per well), in the pane and in the export.

## What the last three polish items turned out to be

**Seeding densities are derived, not remembered.** A table of per-line densities would be the
same mistake the doubling times were before they were checked. The recommendation is computed
from the format's growth area (geometry — the standard Corning/Nunc figures in
`SEED_AREA_CM2`), the line's **cited** doubling time from `CELL_REF`, and how long the assay
runs: seed what still leaves you at 80% of capacity at readout. HCT116, 96-well, 72 h → 0.32 cm²
× 1e5/cm² × 80% ÷ 2^(72/21) ≈ 2,400 cells/well, which lands near the 3,000 the calculator
already defaulted to, from the other direction. The two confluence constants are working values,
not per-line numbers anyone publishes, and the panel says so beside the citation for the part
that *is* cited. The line list is read through `window.parent.CELL_REF` — a third copy of that
table is how its citations came out blank the first time.

**`textContent` does not know what a paragraph is.** `<p>a</p><p>b</p>` returns `"ab"`, so every
publication-ready build glued each block to the next ("SeedingCells were counted and
plated.Warm mediumCount cells") and the Cmd+K content index inherited it through `_plain` —
a search for a word could miss text containing it because it was glued to the one before.
`_blockText`/`_htmlLines` is the one block-aware extractor both now use; the index costs 24 ms
instead of 10 ms over 2,141 rows, once per open. With it: the setup renders as Methods prose
rather than a form dump, ticks stop appearing as words, and the plate map reads off
`plateSummary`'s groups instead of re-describing them.

**The step library could only append.** `insertStepBlock(spec, at)` takes a position and dates
the block from the one it lands *after* — a step dropped mid-run belongs to that day, not to the
last one in the list. The palette is a strip where the steps go, chips are draggable **and**
clickable (HTML5 drag and drop does not exist on touch, so a drag-only palette is no palette on
a phone), and blocks reorder from a grip — the grip carries the drag because a draggable
ancestor stops you selecting text in the inputs inside it.

## The mobile pass (2026-08-24)

Jon's report was "empieza todo con un zoom y no se ve todo el menú, y las páginas no se adecúan
a la pantalla". Three separate causes, none of them the one that phrase suggests.

**iOS zooms the page when you focus a control whose text is under 16px, and never zooms back.**
Everything after that is a magnified page whose fixed header and bottom tab bar are wider than
the screen. Every control in the Hub was under 16px — Archive alone had 190 at 12px. One device
rule per file (`@media (hover:none)` → `font-size:16px !important`, excluding checkboxes and
friends), no `maximum-scale`: taking pinch-zoom away to fix this would trade one accessibility
bug for a worse one. The rule is `!important` because it must beat every per-component size, and
it is not a design choice.

**A page that overflows horizontally by any amount is one a phone zooms out to fit.** Three apps
did: Blot 152px, Cadence 18px, Cuppa 16px. Every one was the same shape — a flex container with
`flex-wrap:wrap` whose *groups inside it* did not wrap, so one 509px group set the page's
minimum width. All 19 apps are now clean at 375px, measured in a frame that cannot shrink-to-fit
and hide it.

**`vh` is the wrong unit on a phone**: iOS measures `100vh` against the viewport with the URL bar
hidden, so an `88vh` modal puts its buttons below the fold. 46 declarations carry `dvh` after the
`vh` — a browser without it keeps the first, one with it takes the second.

Then the navigation itself. The header held six controls at 375px, so the title truncated to
"d…" and the search box showed "Searc": it becomes a magnifier that opens the full-screen
spotlight — which **had no opener but Cmd+K**, a key a phone does not have, so hub search did not
exist on mobile at all. In Labbook the ribbon's tool pane starts closed (44px instead of ~200px)
with the tab row as its switch, and the drawer button is docked into that row instead of
floating over the bottom-left of every screen for ever.

**`#mobile-nav-btn` must stay outside `<header>`.** The comment on the element says why and it is
right: dHUB hides each app's own header when embedded, and `display:none` on a parent takes the
whole subtree with it. Moving it in makes it invisible in the build Jon actually uses.

**`_wsIcon` falls back to the named app's card logo**, because three Cells cards were drawing the
same house and four Archive cards the same book — every section in `LANDINGS` asked for its
parent app's icon.

## Curated experiments are presets, not new code (2026-08-25)

Jon is feeding in his own experiments one at a time — versions he has run and validated. Each
one lands as an entry in **`EXTRA_PRESET_SEED`** with a `baseType` pointing at an existing
`EXP_TYPES` id, and **nothing about the existing experiment types changes**. The first is
`NB_BIO_RTX96` / **NanoBRET_biosensor_Reverse_96** (baseType `NB`): a BET biosensor read in
96-well, reverse-transfected, so there is no 6-well transfection and no replating.

A curated preset can now answer three things the generic type answers for it:

- **`setupHide`** — drop a setup question the variant has no use for (`nTransfect` here).
- **`plateOn`** — whether this assay gets a plate map, overriding `SETUP_SCHEMA[type].plateOn`
  (`presetPlateOn`).
- **`layout`** — the `PLATE_LAYOUTS` id to start that map from (`presetLayout`), which beats the
  hardcoded HB/D2B → `echo384` rule in `createExperiment`. It is **ignored if the setup moved
  the format**: a layout drawn for 96 wells is not a starting point for a 384 plate.

`nb96bio` is Jon's own map, drawn as it is on the bench: a labelled control band along row A
(no HT ligand · untransfected · no substrate), row B empty on purpose, and three compounds in
row pairs C–H with 11 points at 3-fold across columns 1–11 and DMSO in column 12. The
concentrations go on the **wells**, not only in the column headers, so `plateSummary` reads it
straight back as "C1–D11 · Compound 1 · 1 µM → 16.9 pM (11 pts, 3-fold) ×2 replicates".
`plateSummary` also stopped printing a block or well label that only repeats the well type —
"No HT ligand · No HT ligand" is one fact twice.

### Three calculators, each one an error the protocol made

The corrections went into `CALC_KINDS`, not into the prose, so the next experiment gets them too.

- **`rtxmix`** — a reverse-transfection master mix where the **diluent is the remainder**. The
  original made up 880 µL of Opti-MEM and added 7.04 µL DNA and 21.1 µL FuGENE on top: 908 µL,
  so 10 µL/well delivers 77.5 ng, not the 80 ng the protocol says. The calculator prints both
  numbers side by side.
- **`spike`** — a concentrated intermediate going into wells that already hold liquid. The
  volume is **V/(X−1), not V/X**: 11.11 µL of a 10× into 100 µL, then 12.34 µL into 111.1 µL.
  The original had the first right and the second wrong (12.2 → "122 µL"), because it took a
  tenth of the final volume rather than a ninth of the starting one.
- **`serial`** — a dose series that keeps **the top concentration in the well** and **the
  strength it is made at** as separate inputs. It is **in the picker but not in this preset**:
  Jon's call, and the right one — everyone knows how to make a 10× dilution, so the block says
  "prepare 10× dilutions of each concentration in Opti-MEM and add the 10×" and `spike` gives
  the only number that is not obvious, the volume that goes in.

`spike`'s source stock is **optional** for exactly that reason: with no `stockUM`/`finalUM` it
reports the volume per well and how much 10× to make, and says nothing about how to make it.

### Methods prose is a Methods section, not a transcript

Jon's read of the publication-ready output was that it explained itself: it carried the "why"
("aspirating risks lifting the monolayer"), the bench imperatives and the tense of an
instruction. A Methods section is the minimum complete information to repeat the work, in the
past tense — the yardstick is a Nature methods paragraph, ~200 words.

The machinery for that already existed and was not being used. **`CALC_PUB[kind]` writes the
Methods sentence; the block prose is bench instruction**, and `CALC_PUB_FULL` marks the
calculators that speak for the whole block so the prose beside them is dropped. `rtxmix` and
`spike` are both, which is what removed most of the transcript. What is left of the "why" is
wrapped in `pub-skip`, which `_pubText` already strips.

Two things the setup line was doing that no Methods section does:

- **Repeating what a block already said.** `_pubSetupText(e, said)` now takes the assembled
  Methods text and is built *last*: it drops its seeding clause when a calculator has already
  written one with the real numbers, and drops any leftover field whose value appears in the
  text. The format survives that as "Assays were run in 96-well plates." when nothing else
  states it — without the plate format the section cannot be repeated.
- **Printing the form.** A `check` field became "MG132 pre-treatment yes". A tick says nothing:
  the step it switches on is either in the Methods or it is not.

283 words for the whole NanoBRET preset, all of it past tense, no rationale, numbers intact.

### Every preset writes Methods, not bench text (`b.pub`)

The register above had to reach all thirteen presets, and for a prose-only step there was
nowhere to put it: `pubSentence` fell through to the block's own HTML, which is written in the
imperative because it is written to be *followed*. **A preset block may now carry `pub`** — the
past-tense Methods sentence — which beats the calculator and the prose. It is
`{{placeholder}}`-substituted from `e.setup` exactly as `b.html` is (`b.tpl.pub` holds the
unsubstituted original), so `{{treatH}}`, `{{targets}}` and `{{nColonies}}` land in the sentence.
Every block of every seeded preset has one now; **`_presetV4`** ships them.

Four things that were wrong underneath, all of them invisible until the output was read:

- **A block whose only content was its title became a sentence.** "Results." was a Methods
  paragraph in every HiBiT experiment. That fallback is gone.
- **A bulleted list was read out one full stop per bullet** — "Controls to include. NanoLuc +
  HaloTag + ligand 618. Mock." A `<ul>` is now collapsed into one comma list for publication
  (bench checklists and `pub-skip` are still removed outright).
- **The setup line printed the form.** "Cells / well 20000", "Trypsin 1:X 20", "Readouts
  24+72". Every clause and every leftover field is now checked against what the blocks already
  said, on a word boundary — `\b3\b` matches "3:1" and "3-fold" but not "37 °C", which is the
  difference between deduping and deleting. `SETUP_SCHEMA[type].pubSkip` drops a field that a
  block states in its own words (CTG's readout timepoints).
- **A correction could not reach an existing notebook.** `seedPresets` refuses to overwrite a
  preset it cannot prove is untouched, and a preset seeded before signatures existed carries no
  proof — so `CLONE_HIFI` kept its old text for ever. `_seedUnedited(cur,seed)` supplies the
  proof by comparing title, day offsets and every block's HTML letter-for-letter against the
  seed. Calculator *inputs* are deliberately not compared: those are the numbers, and a preset
  whose prose is untouched but whose defaults moved is still the shipped preset.

Result, per preset (words, Methods + plate layout): EXP 6 · CTG 45 · HB 58 · RTX 64 · PR 84 ·
KD 86 · CLONE_HIFI 87 · D2B 102 · CLONE 103 · WB 123 · NB 126 · NB_SPARK 158 · NB_BIO 284.

Each preset's **last** block now closes the paragraph the way a Methods section does — how the
numbers became a result ("normalised to the vehicle control and fitted with a four-parameter
logistic model"). No new field: it is the last block's own sentence.

### Anyone can write the sentence (`pePubField`)

Until now only someone editing `labbook.html` could author a curated preset's Methods prose.
The preset editor has a **Methods sentence** box under each block's bench text, deliberately in
a different register so it is obvious which one is written to be followed and which to be read.
It knows when the block's calculator already speaks for it (`CALC_PUB_FULL`) and says so in the
placeholder; `{{setup}}` placeholders work there too. An empty box is deleted rather than
stored, so "has a sentence" stays a real question.

### Archive protocols publish Methods too (`st.pub` / `st.noPub`)

A protocol stage is a dated block, so it needed the same treatment — and it was the worst
offender: a Gibson Assembly experiment published **328 words** that opened with *"Gibson
Assembly joins linearised DNA fragments that share overlapping sequences… an exonuclease (chews
back 5′ ends to expose overlaps)"*. A textbook paragraph inside a Methods section.

Three fixes, in order of how much each was worth:

- **A stage may carry `pub`**, snapshotted into the block like the rest of the stage so the
  entry still publishes correctly years later, and **`noPub`** marks a stage that is reference
  material — how to read a PAE plot is not a step anybody performed.
- **A protocol's notes and tips are stripped** from published prose; a *warning* is kept,
  because it usually encodes a real constraint ("overlaps longer than 80 bp reduce efficiency").
- **`_pubArchiveSteps` was re-importing the whole protocol.** It is the fallback for the old
  flat path, and it fired on a stage block the moment that stage's own prose came back empty —
  putting the preamble back, verbatim, exactly when it had just been removed.

`tools/protocol_pub.py` holds the sentences and injects them into `PROTOCOL_DATA`; re-run it
after editing. [`docs/PROTOCOL_PUB_QUEUE.tsv`](docs/PROTOCOL_PUB_QUEUE.tsv) is the review sheet
for the ones still outstanding — protocol, stage, stage name, the step text as it publishes
today, and an empty column for the sentence (or `SKIP` to mark it reference-only). Fill the
column, and the sentences go into `tools/protocol_pub.py` and get injected. It regenerates from
whatever is still unresolved, so it shrinks as the queue is worked. **18 stages have a Methods sentence, 36 are marked reference-only, 99 of 153
still publish the protocol's own step prose** — that queue is the content job, one protocol at
a time. Gibson 328 → 78 words, Transformation 126 → 79, Miniprep 156 → 39, PyMOL 494 → 3.

### Three things the Methods work exposed

- **A version bump overwrote every built-in preset, edits included.** Survivable while the only
  way to change one was to edit `labbook.html`; not survivable now the preset editor has a
  Methods box in it. Built-ins carry the same `_seedSig` the extra presets do, so from `_presetV5`
  on a bump refreshes an untouched preset and leaves an edited one alone. This upgrade is still
  a blunt refresh — no built-in can have been edited through a field that did not exist — and it
  is what stamps the signatures that make every later bump safe.
- **The paragraph is a snapshot and never said when it had gone stale.** Change a calculator's
  number and the Methods quietly keep the old one until somebody remembers to press Rebuild.
  `_pubSourceSig(e)` fingerprints what the paragraph was built *from* — setup, protocols, each
  block's `pub`/prose/calculator inputs, the plate summaries — deliberately not the paragraph
  itself, so typing in it does not make it look out of date, and not `e.updated`, which moves
  when you tick a step. `pubIsStale` puts a line above the text offering the rebuild and saying
  it is fine to ignore it if the wording is yours.
- **Cmd+K did not index the Methods paragraph** — often the most carefully written text in the
  notebook, and the one place a number appears in a full sentence.

Two things that were quietly wrong and are fixed with it: a bare plate format was inventing
"Cells were seeded in 96-well plates." for a cloning experiment that has no cells, and the
format sentence now fires only when a calculator really did say cells were seeded.

`_pipHint(µL)` is the shared "that is not a volume anyone pipettes" test; the factor scales, so
0.09 µL is not answered with a fixed 1:10 that produces 0.9 µL.

### The setup grid, and a class of alignment bug

A checkbox is half the height of a labelled field, so `.cc-inputs` stretched its cell and
centred it — landing the tick between its neighbours' label row and their inputs. Three rules,
all in the shared `.ci-f` styles rather than one panel's:

- `.ci-f` is `justify-content:space-between`, so the label sits at the top of the cell and the
  control at the bottom. A row whose labels are different lengths now lines its controls up
  even when one of them wraps to two lines.
- `.ci-f.chk` is `align-self:end` with `padding:6px 0` (not `min-height`), so a one-line label
  comes to the height of an input and centres against it, and a label that wraps grows
  downward with the box staying on the line the sentence starts on.
- `.ci-f.chk` spans two columns: a checkbox's label is a sentence, not a caption over an input.

Same rule for `.nm-setup-plate`, whose two-line label had the box centred in the gap between
the lines.

### `tools/audit_align.js` — the alignment audit

A static scan cannot see whether the controls on a row line up, so this is the browser-side
companion to `tools/audit_app.py`: load each app into a 1280×900 iframe over http, `eval` the
file in the frame, call `__alignAudit()`, and it returns one line per row that is out of line.
Its own header lists the four rules and, more usefully, the four things it deliberately ignores
— every one of which was a false positive first (a checkbox is *meant* to be shorter than a
text field; a hidden native checkbox behind a custom switch has no height; a stacked group is
centred as a block on purpose; a 200px pane is not a field row).

The first pass over 18 apps found **18 rows** across ten of them, and every one was the same
root cause: a bar whose controls had never been given one height. `docs/UI.md` has said **32px**
since it was written and nothing enforced it. Blueprint's top bar carried 35/13/33/28/28/28;
Blot's toolbar had five heights in one strip; Incubator's had four in four controls. Fixed per
bar — `height`, not `min-height`, since most of the offenders were already *taller* than the
target — plus two that were the `.ci-f` bug in another costume: **LDI's `.params-strip`**
centred each labelled group as a block, so its shorter controls sat off the line, and
**Cadence's ribbon title** hung 8px below the tabs. Helix's 2px came from a borderless button
beside bordered selects, which is the same transparent-border fix `.btn` needed in Labbook.

### `margin-left:auto` is a one-line idiom

Jon, on Blueprint's toolbar: *"visually not aligned in this app."* The bar wraps, and the
actions group carried `margin-left:auto`. That reads as "push right" only while everything fits
on one line — the moment the group wraps it **keeps** the auto margin and lands on the right of
the *second* line, leaving a 636px hole under a left-aligned first row.

The fix is two named halves (`.tb-left` / `.tb-right`) and `justify-content:space-between`:
flex justifies each line separately, so on one line the actions sit right and when they wrap the
second row starts at the same left edge as the first. Measured both ways — 1280px: rows at
x=20 and x=20; 1900px: one row with the actions at x=1269.

**The audit now catches the class.** A wrapped flex container whose lines start at different left
edges is a finding, and it is proven rather than assumed: with the fix in place Blueprint is
clean, and re-applying `margin-left:auto` in the live page makes the check report *"wrapped rows
start at different left edges (by 629px)"*. Its first version grouped children by matching
`top`, which called a 20px separator beside a 33px group a second row — it groups by vertical
overlap now, the same rule the row check already used.

While measuring it, that bar turned out to hold three heights at 375px (36/32/28): the mobile
block raises the tap target with `min-height:40px`, which beats a fixed `height:32px`, and the
two sliders carried `height:28px` **inline**, which beats the stylesheet. The bar has a
`--tb-h` token now — 32 normally, 40 under the mobile breakpoint — set as both `height` and
`min-height`, and the inline slider heights are gone. Eight controls, one height, at both widths.

**Swept the rest of the apps for it.** The bug is width-dependent — it only appears where the
bar actually wraps — so the sweep loads each app once and resizes the frame through ten widths
(1440 → 375) re-running the audit at each. Three more, all the same idiom, none visible at the
width anyone develops at:

| app | bar | breaks at | offset |
|---|---|---|---|
| Blot | `.toolbar` (Export) | ≤640px | 501px |
| LDI | `.params-strip` (the hint) | ≤760px | 458px |
| Cuppa | `.lastupd-bar` (`.hdr-right`) | 375px | 153px |

Each keeps the auto margin where the bar is one line and drops it at the measured breakpoint,
so the wide layout is unchanged and the wrapped one shares its left edge. Verified both ways:
Blot's Export sits at x=1317 of 1440 and at x=16 of 640; LDI's hint at 1033 and at 25.

The same sweep turned up two more of the *height* kind at 375px, both the mobile tap-target rule
beating a fixed height: LDI's strip ran 36/36/30 and Ribbon's top bar 32/40/40/40/40. Both have
a `--tb-h`/`--ps-h` token now, set as `height` and `min-height` and raised under the mobile
breakpoint — the same shape as Blueprint's fix.

All 20 surfaces (19 apps + standalone Labbook with an experiment open) come back clean, and so
is every app at **375px** — which is where two of the fixes had to be taken back. A fixed
`height` only holds if the label cannot wrap inside it: Blueprint's toolbar buttons needed 49px
for their text at phone width and got `white-space:nowrap` instead, so the *button* wraps to the
next line and the bar keeps one row height. Cell Archive's "+ Add cell line" was the same shape
in reverse — stacked in a 44px list row that needed 70 — and is laid out side by side, which is
what every other row in that list is.

One known survivor: two buttons in a Fabricata confirm dialog are clipped by 3px at 375px.
Fabricata is outside the product build.

**The setup editor asked questions the experiment does not have.** `esRender` mapped
`SETUP_SCHEMA[type].fields` directly, so a preset's `setupHide` was honoured at creation and
forgotten on edit — the NanoBRET variant re-offered "# 6-well transfections" as an empty box.
It goes through `setupFieldsFor(e.presetKey)` now, which is what the New-experiment modal uses.

The MG132 step also said "aspirate media and replace" above sub-steps that spike 11.1 µL into
100 µL. The preset says spike, and says why: aspirating takes the conditioned medium and risks
lifting the monolayer.

## The methods sheet, and the software that closes the paragraph

Two additions that follow from the repositioning (below): the product is an **experiment
tracker with export**, so the thing you send out matters as much as the thing you keep.

- **`exportMethods(id)`** prints the paragraph, the plate layouts it refers to and the results
  table — and nothing else. The full PDF is the *record*: every step, every tick, every
  attachment. This is the same experiment with everything that only means something to the
  person who ran it taken out. It warns first if the paragraph is stale, because a stale export
  is the version that leaves the lab.
- **`analysisSoftware()`** is one lab-wide setting (View → Analysis) appended as the last
  Methods sentence — "Data were analysed in GraphPad Prism 10.2." A Nature paragraph names the
  software and its version, and writing it into each of the thirteen presets would be thirteen
  places to update when Prism goes to v11. It is skipped when something has already said it.

## The ribbon stopped being furniture

Jon's read: the Home/Insert/View strip is the last of the OneNote frame, and a permanent 120px
of formatting buttons is what a word processor looks like. It might earn its place in the
Journal or a note page; above an experiment it is space taken from the thing you came to look at.

**It follows the surface now.** `_rbProseSurface()` is the whole rule: the Journal, a day, a
note page — the screens you sit and write on — open with the pane; everywhere else gets the tab
row alone, ~36px against ~160px. `selectNode` resets `_rbOpen` to `null` so each surface
re-derives its own answer rather than inheriting the last screen's, and clicking the tab you are
already on puts the pane away at any width (it used to be a phone-only gesture).

`renderEditor` re-derives the class too, because **the surface changes without the tree
knowing**: `openExp()` renders the editor and never calls `selectNode`, so the class went stale
and left a full ribbon above a screen that had asked for none.

**The selection bubble is what makes closed the right default.** `positionBubble()` shows eight
commands — bold, italic, underline, strikethrough, highlight, clear, bullets, link — over any
non-collapsed selection inside our own rich text, and nothing else: a selection in a results
table or the page chrome must not be offered bold. It measures itself, clamps by its real edges
rather than pinning its centre (the bug `#lb-tip` had), and flips below the selection when there
is no room above. Everything on it is also in the Home pane; the point is that the eight you use
follow the text, so the other forty do not have to sit above every screen waiting.

## Multi-day experiments: the three ways they went wrong silently

The focus after the repositioning. Everything here was found by asking what actually breaks over
a week at the bench, then checking the code rather than guessing.

**A step ticked late left the rest of the plan behind.** `setBlockDone` recorded `completedAt`
and nothing else, so doing Tuesday's transfection on Thursday and ticking it left every later
step dated from a day that did not happen — and two days on, the plate is read 48 h early with
nothing on screen having said so. `_offerSlip` compares the tick date against the planned date
and offers to move the remaining steps by the same number of days, preserving the intervals.
Three rules make it right rather than annoying:

- **It offers, never acts.** A step ticked late is often a step done on time and recorded later,
  and the dialog says exactly that. Same principle as the protocol diff, and as the stocks.
- **`>=`, not `>`.** A sibling on the *same day* that has not happened either slipped too.
  `snoozeBlock` already used `>=` for this reason and the two must not disagree about "after".
- **It asks once per step** (`b.slipAsked`), because a checkbox you toggle twice is not two slips.

**Weekends were invisible.** A protocol that says day 0 → day 3 lands on a Sunday one week in
seven, and the app knew the weekday all along. The New-experiment preview now names the day
(`Fri`, `Sat`) and counts them — *"2 of these days fall on a weekend"* — and a weekend date on a
step is coloured. It does not move anything: which day to lose is a decision about the science.

**The day had no clock.** A NanoBRET day is 1 h of MG132, then 3 h of compound, then substrate,
then the read — and the day was a bag of blocks with no sequence and no time: the waits were
prose, and the only way to know when the read was due was to remember when you started.

`b.waitMin` is the wait **after** a step before the next one can start. `dayPlan(e,date)` walks
that date's blocks in order and accumulates the offsets; `dayPlanLine` prints the day as
*"09:00 → 13:05 · 4 h 5 min of waits"* in the day-group header, and each step wears its own wait
with the clock time the next one is due.

The part that matters is the anchor. **The schedule is relative until you tick something, then
it is wall-clock from the step you actually completed** — so a day that started at 09:00 reads
09:00 → 10:00 → 13:00, and a day that started at 11:20 re-times itself with no input. Failing a
tick it anchors on *now*, and only for today; a future day shows the shape and no false times.

Waits come from three places and no new typing: `w` on a preset block (seeded for the NanoBRET
MG132/compound/substrate steps, CTG's equilibrations and HiBiT's lytic incubation, shipped by
`_presetV6`), an Archive stage's `durationH` — but **only under 24 h**, because a longer wait is
already expressed by the next stage's date — and the `+ wait` button on any step. The wait feeds
the existing bench timers rather than a second timing system: `startWaitTimer` pushes the
remaining time into `LB_TIMERS`, which already beeps and already holds the screen wake lock.

**A step could fall off the back of the carry-over and never be mentioned again.**
`CARRY_LOOKBACK_DAYS` is 21, which is right for a list read every morning — three weeks of
misses would be noise — but nothing else ever said the step was outstanding. `expOverdue(e)`
puts it where it belongs: on the experiment, which is the thing that is stuck. Verified with a
run started 40 days ago: five steps, absent from carry-over, and the header says
**5 STEPS OVERDUE**.

## A recorded number is never rewritten (2026-08-25)

Jon, asked about propagating a corrected calculator default back into experiments already
created: **no.** Stocks change. A plasmid prep is re-made at a different concentration, a
compound stock is diluted, a lot runs out. The number in an experiment is what that run used,
and an app that quietly refreshes it turns a record into a guess — the same failure as a Methods
paragraph that drifts from its steps, one step worse, because nothing on screen would say it had
happened.

The existing machinery is already the right shape and stays the model: `protoDiff` /
`applyProtoUpdate` **offer** a protocol update and show the diff, and even then a step note whose
step disappeared is moved, never deleted. Offer, show, let the person decide. Never rewrite.

**Compound-level views are ChemLib's, not ours.** A per-compound panel ("what do I know about
EDA-099") and cross-experiment comparison were proposed and are deliberately not being built
here: dHUB is going to be folded into ChemLib, where every result is already linked to its
compound. Building a second, weaker copy of that join would create the duplicate-source problem
this codebase keeps removing. See the ChemLib section.

## Data out — JSON and CSV

The PDF and the methods sheet are documents. These are the numbers, and until now there was no
way to get them: someone who wants to analyse this outside needs a table, and someone moving an
experiment elsewhere needs the record as data. One **Data** button in the View ribbon opens a
picker rather than five more buttons.

- **This experiment — JSON.** The whole record: setup, blocks with their params, calculator
  inputs, notes and ticks, plate maps, results with their notes and exclusions. Attachment
  *bytes* are deliberately not in it — they live in IndexedDB and Backup is what carries them —
  and the export says so in an `attachments` block rather than dropping them silently, which is
  the kind of quiet lie this file keeps recording.
- **Results — CSV.** One row per measurement with the experiment repeated on every row, because
  that is the shape a spreadsheet or an R script wants. Seventeen columns including `Flagged`,
  `Excluded` and `Note` — the annotation work is what makes the export worth having.
- **Steps — CSV.** Every dated step: day, date, done, completed at, protocol, stage, note. The
  tracker half of the product in one table.
- **All results in this notebook — CSV.** Every measurement across every experiment. "Give me
  every DC50 I have measured" is one click.

`_dl(name,text,mime)` replaces the old `_download`, which announced `application/json` whatever
it was handed.

**And it reads them back.** An interchange format that only goes one way is half a feature:
`importExpFile` is how an experiment moves between notebooks or comes back from a colleague.
Three rules, and they are the whole design:

- **It never overwrites.** An import is always a new record — new id, new block ids, filed where
  you say — because the alternative is a file quietly replacing work you did after you sent it.
  A `code` that already exists gets a suffix rather than making two rows look like the same run.
- **It says what cannot come.** The dialog counts the attachments and states plainly that a JSON
  export carries the record and not the bytes, before you commit to the import rather than after.
- **The record says where it came from.** `e.imported` holds the date, the sending project and
  folder and the original id, and the experiment header wears an *Imported from…* chip. Without
  it an imported experiment is indistinguishable from one you ran, which is the one thing a lab
  notebook must never be.

**A picker was truncating the wrong half.** `.dlg-item .l` had `flex:1` and the subtitle no
limit, so a long "why" pushed the "what" into an ellipsis. The label keeps the room it needs and
the subtitle shrinks first — in every picker in the app, not just this one.

## Annotate, audited

Of the four verbs the product now leads with, this was the one never looked at. Rich text
exists on blocks, protocol steps, whole blocks, observations, days and note pages; files and
floating images have captions. Two things carried no annotation at all, and both are where
log meets analyse:

**A measurement could not be annotated or excluded.** Echo raises a flag; there was nowhere to
say *why*, and no way to record that you had looked at a flagged curve and kept it, or looked at
a clean one and thrown it out. `x.note` and `x.excluded` are separate from `x.flag` on purpose:
the flag is the fitter's opinion, excluded is yours, and **only yours removes the number from
the results sentence**. An excluded row stays in the table, struck through, with its reason — a
measurement you discarded is part of the record, not absent from it.

Found while testing it: the table is 630px inside a 467px card with `overflow:hidden`, so the
new exclude button was simply unreachable. `docs/UI.md` already says a wide table scrolls inside
its own container and never the page; it does now.

**A well could not carry a note.** "B7 meniscus", "F2 bubble, re-read" — the thing you write on
the lid. `w.note` is deliberately **not** part of `plateSummary`'s grouping key: a note is about
that well, not a different condition, and letting it split the ranges would shred the layout
summary that makes a 384-well plate readable in five lines. It shows in the well tooltip, as its
own line under the summary, and in `plateSummaryText` — which is what puts it in the Cmd+K
content index, because an annotation nobody can find later is not an annotation.

## Sync: what was actually broken (2026-08-27)

Jon's report was that **nothing** synced — Labbook included — and that everything only ever
lived in the browser it was typed into. That rules out the per-app sync code, which is
per-app by definition, and points at the one thing they share.

**The server side is healthy and was never the problem.** Verified live: the `/journal` rules
are deployed (see *Open items*), the authorized domains are `localhost`,
`thehub-f80ae.firebaseapp.com`, `thehub-f80ae.web.app` and `maciciorjon-hash.github.io`, and
the Pages build loads the SDK with `FB_OK` true and auth resolving cleanly.

**The likeliest cause is the address the Hub is opened at, and it cannot be fixed from inside
the page.** `CLAUDE.md` calls the local `Desktop › The_Hub › dHUB.html` the daily driver. That
is a `file://` origin — origin `null` — and Firebase Auth does not work there: `file://` is not
a domain, so it can never be an authorized one, and `signInWithPopup` throws
`auth/operation-not-supported-in-this-environment`. No session ⇒ every `/journal` write is
refused by the rules ⇒ every app falls back to `localStorage`. Two machines then hold two
unrelated notebooks, and **the Hub said nothing about any of it** — it rendered as an ordinary
home page. **The Hub must be opened at the Pages URL on every device.**

So the first half of the work is making the Hub state the truth:

- **`hubSyncEnv()`** classifies the situation — `file` · `sdk` · `auth` · `denied` · `pending` ·
  `ok` — and carries the reason and the fix as prose. Every app already reported its own save
  state honestly; none of them could see the *reason*, which always lives in the shell.
- A **banner** appears only when the answer is "your work is not leaving this device", and
  **Settings → Data leads with Sync** — the one place that answers "is this on my other
  machine?", with a button that opens the Pages URL or signs in.
- **`adminSignIn()` explains `file://`** instead of relaying
  `auth/operation-not-supported-in-this-environment`, which tells nobody that the fix is to
  open a different address.

### A cancelled listener is permanent, and nothing retried

Firebase **cancels** a listener when a read is refused, and reports it only through the error
callback. Almost nothing here had one.

- **`JournalStore.attach()`** assigned `_ref` *before* `.on()`, so after a cancellation `_ref`
  stayed non-null and the `if (_ref || !fbReady()) return;` guard refused every later attempt.
  One refused read and that device never synced again for the whole session, silently, serving
  its stale cache. It now drops the ref, records why (`syncState()`), and retries.
- **`lbInitSync`'s** failed first read ended sync for the session: no adoption, no `_cloudSeen`,
  and `_cloudListen` never reached. It retries with backoff (~10 min, then waits for a reload),
  and a cancelled child listener detaches **every** collection before re-init — re-listening
  with the siblings still attached would double every handler.

### Adopting once at load is an import, not sync

Iceberg, Blot, Cadence, Ribbon and Archive's notes all did `once('value')` at load and then
wrote the **whole blob** on a debounce. With two devices open neither ever saw the other until
a reload — and whichever reloaded last then pushed its stale copy back over the top. All five
listen with `on('value')` now, guarded by the `updated` timestamp so our own write coming back
is not treated as news, with the same backoff retry.

Two of them edit text, so they carry the caret rule `lbWatchCultures` already followed: **never
repaint something being typed in.** Iceberg holds the incoming state while a modal is open,
Archive's notes while an editable has focus, and a self-arming drain applies it the moment the
coast is clear — armed only while something is waiting, and it stops itself. Hooking the five
`close*` functions instead would leave the sixth one added later silently broken.

### The two apps with no sync at all

- **Blueprint** — thirty saved plate designs with no route off the machine that made them.
  `ldHistSaveList` was already the single write point, so it is the seam: `journal/blueprint`,
  same shape as the others.
- **Echo** — the flagship, and the one app whose output *is* the result. `journal/echo` now
  carries the analysis history: fitted values, flags and plate readings. **The raw input files
  deliberately do not travel** — they are bytes, and bytes do not belong in a tree that is
  re-`set()` on every change. `_ehFit` drops the oldest analyses until the payload is under
  2.5 MB and says which ones stayed behind, so one oversized run cannot silently stop the whole
  history from syncing.

No rules change was needed: `journal/echo` and `journal/blueprint` are children of `journal`.

**Attachments were the one thing still blocked on Jon, and he unblocked it the same day.**
`GET .../b/thehub-f80ae.firebasestorage.app/o` returned **404** — no bucket, so Storage had
never been enabled and every Labbook image stayed on the device that added it. The bucket now
exists (that probe returns **403**, which is what an unauthenticated read of a real bucket
looks like). New attachments upload; **older ones do not migrate on their own** — see Open
items. The Sync panel keeps saying what is true rather than implying more.

## The SPARK plate, opening on Home, and the project prefix (2026-08-28)

**`nbspark96` had the right shape and the wrong conditions.** Jon's photographed lid numbers the
same fifteen blocks the layout draws, so the geometry was never in question — what it corrected
was which mix is in three of them. The controls in rows A and B are the **1:50** pair mixes
(conditions 5 and 7), not the 1:10 ones, and G9–12 is the **acceptor-only** control (9), not a
second untransfected block. Two of those were provable from the calculator's own inputs rather
than from the photo: `nAcceptor:8` only adds up if acceptor-only sits at the right-hand end of
*both* bands, and `nUntr:8` only adds up if untransfected appears once, as A5–B8. `ctrlRatio`
moved 10 → 50 to match, which is what puts the +8 control wells on the mixes that hold them.

The numbering itself needed no work: `_nbtxConditions` already walks ratio → donor → pair →
donor-only, then acceptor, then untransfected, which is exactly 1–10 as drawn.

The layout is a template, so **an experiment already created keeps the plate it was created
with** — re-apply it from *Start from a layout…* to take the correction.

**dHUB opens on Home.** Two things were putting you back where you left off: `hub_ws_section` in
`localStorage`, and the hash `openApp` writes. The section is simply gone (`_wsSection` starts at
`'home'` and is tracked for the life of the page). The hash is the interesting one — it has to
keep working for a real link (`dHUB.html#protocols` from a phone home screen) while not
restoring the app you happened to close inside. `_markOwnHash()` records in **sessionStorage**
that this tab wrote the hash itself; `_openFromHash` opens the app only when that mark is absent,
which is true in a tab opened from a link or a bookmark and false in one that navigated here. It
also learned `#cells`, which it had never handled.

**A completed experiment stops asking for work.** `carryoverForDate` excluded only *archived*
experiments, so one marked Completed from the status dropdown — without archiving — went on
pushing its unticked steps into tomorrow's carry-over for the full 21 days. `expClosed(e)` is
archived **or** any `EXP_DECIDED` status (done · paused · abandoned), and it is now the predicate
in `carryoverForDate`, `expOverdue` and `wkOverdue` — the last of which filtered nothing at all,
so the week planner and the day view disagreed about what was owed.

**Ticking a step ticks what is inside it.** A step marked completed cannot contain a sub-step you
did not do, and the empty boxes made a finished block read as half-finished in the block header's
"2/7 steps", in the checklist and in the PDF. `_fillSubSteps(b,on)` has one branch per kind,
never both: a protocol block's sub-steps are its `stepDone` ticks (its html is a cache
`refreshProtoHtml` rebuilds, so writing into it would be discarded on the next render), and a
preset block's are the `ul.lb-check` boxes in its html, which *is* the block. Only what it filled
in is recorded in `b.autoTicked`, so reopening the step undoes exactly those and leaves the ones
you ticked yourself — a tick is evidence. `_checklistDoneSync` passes `fromChecklist` so the
boxes-to-step direction does not rewrite the html under the caret of whoever just clicked one.

**A project has a code prefix.** `SP_NB20260826` says whose work it is; `NB20260826` only says
what and when. Two letters by default, derived from the name by two tests in `_prefixDefault`:

1. **An ALL-CAPS first word owns the prefix.** A lab names a project after a gene symbol or an
   acronym — SMARCA, SPARK, LRRC58 — and that word *is* the project, so the prefix is its first
   two letters (SM, SP, LR) and whatever follows is a qualifier, not half the name.
2. Otherwise the name is an ordinary phrase and a second **word** earns an initial: Multivalent
   Chemistry → MC. Three letters is the cut — NS, KO and V2 are qualifiers.
3. One word, no acronym: its first two letters (RTag → RT, Eisai → EI).

**Casing is the signal because it is the one the names already carry**, and it is what separates
SMARCA Glues (SM) from Multivalent Chemistry (MC) — a distinction no word-counting rule can make.
The alternative was a table of Jon's six project names, which is not a rule and would have
shipped his lab's vocabulary inside a product other labs use. So a project created without touching the box is
still prefixed from its first experiment rather than from whenever someone remembers. The box is
beside the name in both project add-rows and its placeholder tracks what you type; a prefix you
typed is never overwritten by the next keystroke in the name. `nmUpdateCode` builds the code with
it and `createExperiment` puts it back on a code typed over by hand.

**Every existing project has one already.** `_backfillPrefixes()` runs on load (and on a tree
adopted from the cloud), stamping the derived default on any project without one — so a notebook
that predates the field is fully prefixed rather than waiting to be asked project by project. It
is *stored*, not re-derived each load: a prefix that moved when you renamed the project would
leave two halves of one project's experiments carrying two different codes. And it is unique —
`_uniquePrefix` tries later letters of the name before a digit, because "SPARK" and "SPARK NS"
both derive SP, and two projects sharing a prefix defeat the point of having one. The chip on
each project header in Experiments is how you read the one that was derived for you.

**`p.prefixAuto` marks a derived prefix, and that is what let the rule be pinned down against
real names without ever touching a decision.** `_prefixV4` re-derives every auto one under the
current rule and leaves every typed one exactly as it is — the same line `protoDiff` and the
calculator defaults draw between a value the app produced and a value somebody chose. Jon's six
come out Multivalent Chemistry **MC** · LRRC58 **LR** · RTag **RT** · SPARK NS **SP** ·
SMARCA Glues **SM** · Eisai **EI**, all distinct with no fallback needed. The chip on the project header is a button — clicking it is the way to change one, since
a right-click menu is not where you look for a two-letter label you can see.

Two things this turned up. `addProject` called `renderSections`, which only redraws the tree —
so a project added from the adder that is actually on screen, the one in the Experiments view,
was created and never appeared. And the New-experiment modal already had a field labelled
**"Code prefix (optional)"** which is not a prefix and never was: `nm-poi` is appended
(`SP_NB20260826_BRD4`), so with a real prefix beside it the label was two different things under
one name. It says what it is now.

Changing it later (`setProjectPrefix`, on the project context menu) **re-codes the experiments
already in the project** — a project whose old and new codes both survive is a project you cannot
search — but as a confirmation carrying the count and a worked example, because the code is what
is written on the plate, the tube and the file names. A code that already carries some other
prefix is left alone.

## Painting a plate is picking a condition and saying where (2026-08-28)

Jon, on drawing the SPARK map: the condition numbers have to be much clearer, and the loop should
be *pick a condition, say which wells, next condition*. The loop already existed — Paint mode
does exactly that — but nothing on screen made it findable, and the one thing that makes a
NanoBRET plate readable was missing from the editor entirely.

**The editor did not print the numbers.** `platePreviewHtml` had shown them since the numbering
went in; `plRenderGrid` still printed `plateWellShort` — the label, concentration or compound —
gated at `wpx>=28`. So while you painted, a 96-well SPARK plate was four wells of
"NL-DELE1(CTD) + HT-H…" truncated under a block caption, and the number you are actually
checking was nowhere. Every well prints its number now, at 1.55em and down to `wpx>=14`: one or
two characters survive a well where a name never could. A plate-reader value still wins, because
that is a different question being asked of the same grid.

**The block caption moved off the wells.** On a numbered plate it was an opaque pill across the
middle of the block, sitting on the numbers it exists to explain. The block keeps its outline —
which wells are one block is worth seeing — and loses its caption; the name is in the condition
list, the layout summary and now the well tooltip (`plateWellTip` leads with the number and adds
the block label when it says something the type name does not).

**The palette became the working list.** `pl-cond` rows are number · colour · full name · how
many wells it already holds, down a column rather than wrapped into chips: these names are long
and differ only at the end ("(NL 1:10)" against "(NL 1:50)"), which is exactly what an ellipsis
eats, so the name wraps instead of truncating. The count is the part that answers "what have I
not placed yet" — an unplaced condition reads "—". It sits at the top of the panel under a
heading that says what to do, and **Quick types is dropped when the conditions are numbered**:
there it was the same list one section lower with the numbers taken off.

**Shift-click paints the rectangle.** In Paint mode it only *selected* one, so laying out a 4×2
block was a drag you had to hold accurately instead of two clicks — while the hint said Paint
assigns a type. Select mode still only selects; that is the mode's whole job.

The grid also gets the vertical room before the summary does (`.pl-sum` is `flex:0 1 auto` with a
cap, not `1 1 auto`) — the plate you are painting was the thing being cut off. And the instruction
line is `.pl-howto`, not `.pl-hint`: that class already styles the hint in the modal title, and a
second rule for it restyled the header.

## One block, one number — and the text that has to match the conditions (2026-08-28)

Four reports from Jon on the SPARK map, and they share a root: the plate model knew things the
renderers did not.

**A number repeated per well is the same fact written twelve times.** The preview printed
`5 5 5 5 10 10 10 10 5 5 5 5` across row A. **`plateNumberBoxes(p)`** derives maximal rectangles
of identical condition *and flags* straight from the wells — not from a stored `groupId`, so a
plate drawn by hand, from a layout, or by Rebuild all read the same; a map whose groups were
never set used to get nothing merged at all. One number, once, over the wells that hold it, in
tabular mono at **one size across the whole plate** (`_plNoFs`) so the map reads as one system
rather than blocks competing by how many wells they span. The flags are part of the key on
purpose: a −ligand well holds its pair's mix but is not the same condition, and merging them
would draw one block over two.

**The numbers were never centred at the size that needs them.** `.pp-w` only got its centring
flex from `.pp-grid.txt`, added at `wpx>=26` — so on 96 and 384, exactly where numbering earns
its keep, every figure sat wherever the box put it.

**The PNG had no numbers at all.** `plateToPNG` printed well labels and block *names*: the
picture you put on a slide was the one artefact that did not carry the numbering, while the
app's own preview did. It now draws the same blocks, the same one number, the control caption
under it, and a legend of `1 · name`.

**A −ligand control could not be painted.** Flags are right as flags — the well holds the pair's
mix with something left out at the read — but that also meant you picked a condition, painted
the block, and then had to remember a different section to toggle the flag on a selection.
`PL.flags` is a **brush**: switch −ligand on, paint the control wells, switch it off. The
selection toggles stay, for fixing wells already painted. And the preview marks them at last —
same hatch and ring the editor already used, plus the label under the block's number, because a
control block is otherwise the same colour and the same number as its pair.

**A preset's text is a snapshot, and presets get corrected.** Jon's run still said *"the NanoLuc
construct at 1:50 of it (1.6 ng)"* — written when the preset assumed one ratio. His experiment
has two, so the prose named one and silently dropped the other. The preset was fixed long ago by
taking the number out of the prose entirely (the calculator owns it, and the calculator follows
the setup); what was missing was any route from that fix to an experiment already created.
`expPresetStale(e)` finds blocks whose words are still the preset's own — `fillSetup(b.tpl.html,
e.setup) === b.html`, the same proof `_seedUnedited` uses — matched to the current preset **by
the template's title, not by position**, since a snoozed or inserted step moves the indices.
**Calculator inputs, ticks
and notes are never touched**: those are the numbers this run used, and a recorded number is not
rewritten.

That banner alone was not enough, and Jon's own run is why. It only offers what it can *prove*
you did not write, which is right for something that acts on its own — but a block that fails the
proof can still carry wording that contradicts the experiment, and there was no route to it at
all. Two things came out of that:

- **Ticking a checkbox was reading as editing the text.** A tick writes `class="done"` into the
  block's html, so any step you had started working through dropped out of the offer. `_proseOnly`
  strips the list-item classes before comparing: what is being compared is the wording, not the
  state of the run.
- **`updateExpTextFromPreset(id)`** is the manual route, on the experiment menu and behind the
  banner's button so there is one place the change happens. It lists every preset-built block
  whose text differs from the preset today — **both versions side by side** — ticked by default
  only where the proof holds, and labelled *you edited this* where it does not. Nothing is assumed
  about which version is right, because at that point only Jon knows. It also matches a block
  with no `b.tpl` at all (experiments created before the field existed) by title, which is the
  case that was unreachable.

Also, in the editor: shift-click paints the rectangle in Paint mode (it only selected one, so a
4×2 block was an accurate drag instead of two clicks), and the grid gets the vertical room before
the layout summary does.

## Undo, the clipboard, and one gesture on the plate (2026-08-30)

Jon's list was seven things and they turn out to be three: the plate editor asked you to say
twice what one gesture already says, nothing could be taken back, and the copy we built by hand
was worse than the copy the browser already does.

**⌘Z / Ctrl+Z, and Ctrl+Y or ⌘⇧Z to redo.** Typing inside a field or a contenteditable is left
to the browser — it is better at character-level undo than any snapshot can be — so the two
never collide: the handler hands the key straight back whenever the caret is in something
editable. In **Labbook** a step stores the JSON of the *records* it touches (`undoMark(label,
['experiments.<id>'])`), never the whole tree, because `LB.data` is megabytes and almost every
action is one experiment; the redo image is taken at undo time, so one line at the top of a
mutator is the whole wiring. Every plate mutation, every deletion, every tick, snooze and
reorder carries one. In **Blueprint** the whole plate is the unit (`_pdState()` — wells, custom
types, annotations, brackets, format) and it is tracked from the one place every change already
passes through, the redraw: instrumenting each of the twenty things that can change a plate
leaves the twenty-first out, and the twenty-first is always the one you wanted back. Undoing a
format change brings the wiped plate back, which is the undo that matters most there.

**The plate editor has one interaction.** Paint / Select / Erase is gone — three modes made you
declare a gesture that the gesture already stated, and which one you were in was invisible from
the plate. Now: **drag a rectangle, click the condition.** It applies straight away, the
selection stays (so the fields underneath still describe what you just placed), and the next
drag replaces it. Delete clears wells. Shift extends the box, ⌘/Ctrl-click adds.

- **The drag draws a real rubber band**, like Blueprint: `#pl-band` is a fixed overlay *outside*
  the modal, because `.modal-back` and `.modal` both carry a `backdrop-filter`, which makes them
  the containing block for anything `position:fixed` inside them. The well rects are measured
  once at mousedown — 384 `getBoundingClientRect` calls per mousemove is a layout thrash — and a
  drag only moves the `sel` class about (`plSyncSelClasses`), never re-renders: a repaint would
  destroy the very nodes the band is hit-testing.
- **On touch the same rectangle**, corner to corner rather than the path traced. A wandering
  thumb cannot keep a straight line, which is what made the old path-drag unusable on a phone.
- **⌘/Ctrl+C, X, V copy a block of wells**, on both platforms from one handler. "The same eight
  wells again, one column over" is the commonest thing anyone does twice on a plate and retyping
  every field was the only route to it. The full well objects stay in `PL.clip` — a paste has to
  carry the flags, the shading and the block label, none of which survive a line of text — and
  the system clipboard gets the block as TSV so it can also go into a spreadsheet. A pasted block
  gets **new group ids**: reusing the source's would merge the copy into the original and stretch
  one label across both. A type the copy used that this plate does not have is carried across.
- **Shading has four directions.** `plApplyShade` derived its axis from "is it a column?", which
  left *dark at the bottom* with no button at all — the one Jon asked for. It is `right`/`down`
  (dark end first) and `left`/`up` (reversed), and each button says where the dark end goes.

**Copy is the browser's copy.** `copyForOneNote` built its own payload, inlined every computed
style and replaced each SVG with "[diagram — see the PDF export]". Selecting the rendered page
and pressing ⌘C beats it: the formatting survives *and* it stays editable where it lands. So
`copyRendered()` does exactly that — one selection over the same clean document the PDF is built
from, laid out off-screen, and `execCommand('copy')`. Two things it has to do: real ☐/☑ go in
first (a `::before` square is not part of any selection), and the `<style>` is moved to the head
before selecting — its selectors are scoped to `#copy-stage` so it keeps applying, and left
inside the selection the whole of `PRINT_CSS` arrives as a paragraph of literal CSS at the top of
the paste. The Word export still needs its own inlining and keeps it.

### The plate map and the mix table are one thing seen twice

Jon's NanoBRET has transfection conditions *and* a hemin titration run on the plasmid combination
of condition 1 — which is twelve more wells of that condition and of no other. The transfection
design was not counting them, so the mix was made for a quarter of the wells it is dispensed into.

**The counts are read off the plate now, per condition** (`plateTidCounts` → `_nbtxConditions(v,
counts)`). A condition's `tid` is the same string on the map and in the mix table, so the drawing
can say how many wells there are without anything being typed twice — and it is the drawing that
knows: there is one `nPair` for every pair, and a titration on one of them cannot be expressed in
it. A count the plate supplied is marked *from the plate* in the table. The rule is that the plate
**can add and correct, never delete**: a map is often half-drawn, and a condition missing from it
is not a condition you decided against.

`syncPlateToCalcs` no longer writes anything back for `nbtx`. Copying the plate's totals into a
single box flattened exactly the difference that mattered, and its guard meant it could only ever
run in the one-donor-one-ratio case anyway. `nbsusp` still takes the aggregate, which is right.

**Live, both ways.** `platePersist` calls `refreshCalcRecipes(e)`, so the table moves while the
plate editor is still open — not when it is closed. `calcUpd` calls `nbNumberPlate(e)` (debounced
900 ms, or a construct renamed letter by letter puts one condition in the palette per letter) and
repaints the plate cards in place. Only the recipe bodies and the plate cards are repainted; a
full `renderEditor` would take the caret with it.

`nbNumberPlate` grew the other half of the join: it **adds** a condition the palette does not have
yet, so a donor or ratio added after the map was drawn can be painted immediately, and **removes**
one the calculator no longer has *that no well carries* — without that, a rename leaves both halves
in the palette for ever. A type wells still use is never touched: those wells are the record of
what was in them. It only does any of this on a palette that is already the experiment's
conditions; appending eight numbered conditions to a generic layout would turn a plate nobody
asked to number into a numbered one.

## The dose series, the manual compound step, and two print bugs (2026-08-30)

**A NanoBRET plate could not carry a concentration.** `expUsesCompounds` is off by default for NB
— a PPI plate has conditions, not concentrations, and the compound and concentration fields are
in the way while you draw one. But a titration *run on one of those conditions* is the ordinary
next experiment, and the only route back to the numbers was a checkbox in the setup form nobody
would think to look for. It is a switch in the plate editor now, where you notice you want it,
writing the same `e.setup.doseSeries`; and a plate that already has a compound or a concentration
written into it (an Echo import, an experiment created before the box existed) is not asked at
all — it plainly doses something.

**The dilution filler refused a block.** `plSelAxis` returned a direction for a single row or
column and `null` for anything else, so a 3×4 titration in triplicate — the ordinary shape — got
no filler. It returns `'block'`, which is offered **both** ways (Across → ← / Down ↓ ↑), and
`plApplyDose(dir, axis)` takes each well's **position along the axis** rather than its place in
the flat list: three rows of four now get the same four concentrations, which is what a replicate
is. It used to read the block boustrophedon and produce a twelve-point series.

**Compound addition by hand had no step.** The library offered "Compound addition (Echo)" and
nothing else; the `spike` and `serial` calculators existed but the only way to either was to add a
blank block and know the calculator picker held them. Two library steps now — **Compound addition
(by hand)**, carrying the BET biosensor preset's own wording and numbers (spike the 10× in, do not
aspirate; the concentrations you record are the ones in the well) and its 3 h wait, and **Serial
dilution series**. `insertStepBlock` gained `spec.inputs` and `spec.w` to carry them: a library
step that ships real numbers cannot arrive on the calculator's defaults.

### A cell number is meaningless without the plate it is in

Picking HeLa for a 6-well western put **3,000 cells** in the dish. `cpw` was one number per line
with no format attached — a 384-well figure — written in whenever a line was picked, and it also
overwrote the number the format change had just rescaled correctly.

`lineCells(line, fmt)` answers it properly, and the fix is that there were two questions wearing
one label. A **6-, 12-, 24- or 48-well is plated**: you seed a monolayer and use it the next day,
and the density is the lab's own 800,000 per 6-well — the `SEED_PER_CM2` anchor already in the
file. A **96- or 384-well is an assay well**: you seed sparse and the cells grow through the
assay, and the density is the line's own working figure at the format it was measured in
(`cpwFmt`, now declared). HeLa comes out 6-well 800,000 · 96-well 17,000 · 384-well 3,000. The
edit-setup form also had no rescale at all, so changing the plate there left the cell number
behind; it has the one the New-experiment modal has had since the areas went in.

### Why the PDF was a different document on Windows

Two independent bugs, and they compounded.

- **`@page` named no size.** The sheet came from the machine — A4 on a Mac, **Letter** on Windows
  — and Chrome scales the laid-out document to whatever printable area it gets. Same export,
  readable on one and enormous on the other. `size:A4` is stated now, in `PRINT_CSS` and
  `LAB_CSS`; the week planner had always pinned it, which is why it never drifted.
- **Every rule in the second half of both stylesheets was being thrown away.**
  `#print-root *{font-size:inherit;font-family:inherit;color:inherit;background:none}` is
  (0,1,0,0); `.pd-title` and `.lb-h1` are (0,0,1,0). The reset won all of them. Nothing had its
  own size, colour or background: a heading, a table cell and a footnote all rendered at the root
  size in one flat grey, every tinted box lost its fill, and a white-on-blue day badge became
  white on white. That is the "todo más claro". Both tails are scoped to `#print-root` now, so
  they outrank the reset — and this is the first time their greys have ever been seen, which is
  why they also had to be darkened: paper is not a backlit screen, and a `#999` rule or a `#ccc`
  border is legible on one and gone on the other.

The type came down with the fix: 14pt body (record PDF) and 15pt (bench sheet) only ever looked
right *because* fit-to-page scaling was shrinking them. Unscaled they are a large-print edition.
11pt and 11.5pt, with the rest in proportion — the bench sheet stays the larger of the two on
purpose, since it is read at arm's length beside a hood. `print-color-adjust:exact` so the
backgrounds actually reach the page.

## Blank experiment — a page, not a form (2026-08-30)

Not every experiment is one of the ten that are modelled, and the ones that are not still have to
go somewhere. **Blank experiment** is a OneNote page: a title, a date, and somewhere to write.

It is a preset (`EXTRA_PRESET_SEED.BLANK`, `baseType:'EXP'`), not an eleventh type — so nothing
about the existing ten changes. `setupHide:['format']` empties its setup, and `nmSetup` already
hides the whole panel when a preset has no fields, which takes the plate-map checkbox with it:
creating one asks nothing at all. Its single block ships `html:''` rather than `'<p></p>'`,
because `<p></p>` has a child node and is therefore not `:empty` — the placeholder that says
what the page is for could never have shown.

**`e.blank` rides on the record, not on the preset.** What this page is stays true however the
preset is later renamed, edited or deleted. It drives one thing: `.exh-quiet` folds the
type/status/date/plasmid/cell-line grid behind its own Details button, whether or not the app is
in lean mode. Everything is still there — a page that turns out to be a real assay must not have
to be recreated — and the one line above it reads *Blank experiment · 30/08/2026 · planned*.

**Day-blocks were already the answer to the second half of the ask.** `+ Add day-block` dates the
new block from the one it lands after, the step palette and the library are underneath it, and a
plate map or a calculator is one click on any block. A blank experiment is a real experiment that
has not decided yet, not a lesser kind of record — so nothing is taken away, only not asked for
up front.

Two routes in: last in the New-experiment preset list (last, not first — putting it at the top
would make it the default the modal opens on), and **Blank experiment** in the `+` menu beside
*Experiment (coded)*, which fills the modal in and creates it in one click.

Every empty block now carries a placeholder, not just the blank preset's: `addBlock` also creates
`html:''`.

## What a step starts from is what the steps above it left (2026-08-30)

Jon, on a **Compound addition (by hand)** block dropped into a NanoBRET: *"por qué dice que el
volumen in well es 111? eso tiene que saberlo de los previos pasos"* — and then the general rule:
**everything inside an experiment is joined, and a change in one section reaches the ones below
it.** That is app-wide, not a fix for one block.

**`wellVolUL` is derived now, not typed.** Every step that puts liquid in a well decides what the
next one starts from: 10 µL of complex plus 90 µL of suspension is 100 µL, and a 10× spike into
that adds 11.1 µL more. `VOL_ADD` says what each calculator kind contributes per well
(`rtxmix.dispenseUL`, `nbtx.optimemPerWell + fugenePerWell`, `nbsusp/seed/ctg.volPerWell`,
`lytic.cellVolPerWell / ratio`, and a spike's own `V/(X−1)`), and `syncChainedInputs(e)` walks the
blocks in order writing the answer into every `CHAINED_INPUTS` field. It is **stored**, not
computed at render time, so the PDF, the Methods paragraph and the CSV export all read the same
number without any of them having to know a chain exists.

The value a preset ships is a number about somebody else's experiment — 111.1 µL is the BET
biosensor's well *after its MG132 spike*. That is why the library step now carries a placeholder
that is replaced the moment the block lands somewhere.

Three rules make it safe:
- **A number you typed is yours.** `b.calc.own[key]` is set when *that* field is edited, which is
  why `calcUpd` had to learn which box moved — the whole panel is read back on every keystroke,
  so without it editing anything in the calculator would claim every derived value in it. The
  field wears *from the steps above* or *yours · re-link*: a value the app supplied and one you
  chose must never look the same.
- **A chain that comes to zero writes nothing.** No step above has said what is in the well, and
  0 is worse than the block's own default.
- **No false precision.** The NanoBRET mix is 10 µL of Opti-MEM with 0.24 µL of FuGENE and eight
  nanolitres of DNA added *into* it, so the arithmetic says 100.24 µL and nobody has ever written
  that on a plate. `_wellVolRound` snaps to the whole number when the difference is under 0.25 µL
  — the smallest volume this app will print as pipettable at all.

It re-runs wherever the structure moves: `renderExpEditor` (beside `nbNumberPlate`),
`insertStepBlock` (a step's starting volume is a property of where it *lands*, not of the preset
it came from), `moveBlock`, `delBlock`, and `calcUpd` — which repaints the recipes below, live.

### A dose series is not one tube

*"si estoy añadiendo una dilución seriada no tiene sentido que me digas que prepare 10×
intermediate — 24 wells × 1.1 overage → 326 µL. esos 24 wells no son los mismos."* Right: those
wells hold twenty-four different things. One total for one tube is a lie about the experiment,
and the dilution from the stock is different at every point.

`spike` gained a **`series`** flag, and with it on the recipe prints only what is true — the
volume that goes into each well, and how much 10× to have **in total, split between the
concentrations** — plus a line saying that how much of *each* depends on how many wells it goes
in, which is the plate map's business, not the calculator's. The stock-dilution rows and their
warnings are suppressed: there is no single dilution to state. `CALC_PUB.spike` follows —
a titration has as many final concentrations as it has points, so the Methods sentence says
*"at the concentrations given in the plate layout"* rather than naming one of them.

`CALC_KINDS` gained a `check` field type for it, which the block calculators did not have.

## The selection bubble, made a real bar (2026-08-30)

Jon: *"este menú es escaso… highlight funciona pero pulsando el mismo no desactivo el highlight."*
Both true, and the second is the more interesting one.

**A toggle has to toggle.** `bubbleCmd('hiliteColor')` only ever painted yellow, so the one thing
everybody tries — press it again — did nothing at all. `_hiliteOn()` walks out from the selection
to the editable looking for a real background (`queryCommandValue('backColor')` answers for the
caret, not for the run), and the command paints or clears accordingly.

**A button has to say whether it is on.** Bold text and unbold text offered the same unlit **B**,
so the bar told you nothing about what you had selected. The bubble is rebuilt on every selection
change now — it is markup with no state of its own and it lives outside the editable, so
redrawing it cannot disturb the selection it is reporting on — and every button carries
`queryCommandState`.

**What it holds**: B I U S · **Font** · **Size** · text colour and highlight, each a button with
a caret (the button does the obvious thing; the caret opens a swatch row inside the bubble — two
clicks to highlight yellow would be one too many) · **X₂ / X²**, because a lab notebook writes
formulae · bullet and numbered lists · link · clear formatting. 617px on a desktop, wrapping to
two rows at 375px.

Font and size go through `_wrapSel(prop,val)` rather than `execCommand`: `fontName` writes a
`<font>` tag and `fontSize` writes 1–7, neither of which is a size anybody asked for. Sub- and
superscript deliberately do *not* go through `styleWithCSS` — a chemical formula is plain text
with two characters lowered, not a span with a CSS rule on it.

**The icons.** Every glyph is one set at one size now: `•≡` standing in for a bullet list and a
🔗 emoji for the link are gone (the emoji audit had missed this one file), replaced by 24-box
SVGs at stroke 1.6 with `geometricPrecision`, and B/I/U/S are set in Plex Serif with the weight,
slant, underline and strike they name — the convention, drawn properly rather than as four
default-weight letters.

## The text corrects itself (2026-08-30)

Three things happen as you type in any Labbook rich text, and all three are the same idea: the
notation a keyboard produces is not the notation science uses.

**The sum.** `9*9=` puts 81 after it, and a space after an `=` that did not fire finishes the job
— the trigger is `=` *or* the separator that follows it, which is how anyone who has used OneNote
expects it to work. `^` is a power now. `_safeMath` still refuses anything that is not arithmetic:
an operator and a digit are required, the charset is `0-9.()+-*/` only, and it is `Function`, not
`eval` on free text.

**The micro sign**, which is on no keyboard anyone writes a protocol on. `u` in front of a unit
becomes `µ` — but the unit's own case is left exactly as typed, because `um` and `uM` are a
micrometre and a micromolar and only the writer knows which was meant. The one exception is the
litre, which this lab and every Archive protocol write with a capital L, so `ul` → `µL` and
`ml` → `mL`. Composites are split at the slash and each side corrected on its own
(`2 ug/ml` → `2 µg/mL`). `oC` and `37oC` become `°C` and `37 °C` — with the space, because a
degree sign takes one.

**The compounds**, by case rather than by spelling: `naoh` → `NaOH`, `nacl` → `NaCl`,
`dmso` → `DMSO`, `tris` → `Tris`, and about fifty more this lab actually writes. Plus the
sequences nobody has a key for: `->` `<-` `<->` `+/-` `~=` `!=` `<=` `>=`.

Four rules keep it from rewriting your prose:
- **Whole tokens only.** A rule that fires on part of a word will one day rewrite the middle of
  somebody's sentence.
- **A unit is only a unit after a number.** `40 uM` is micromolar; "the uM" and "thank us" are
  words, and `500 nm` is left alone entirely — nanometre against nanomolar is the writer's call.
- **One character at a time.** The correction runs on a single-character `insertText`, so pasted
  text arrives exactly as it was written elsewhere.
- **⌘Z takes it back**, because the replacement goes through `execCommand('insertText')` and
  lands in the browser's own undo stack.

Two things had to be got right underneath, and both were wrong first:

- **The separator is replaced along with the word.** Leaving it behind puts the caret in front of
  it, and everything typed next lands on the wrong side of the space — `40uM naoh` came out as
  `40µMnaoh`.
- **The correction is deferred out of the input event.** Chrome refuses a nested `execCommand`
  while one is being dispatched: it returns false and leaves the range *selected*, so the next
  character typed overwrote the word instead of following it — `Add 40uM naoh and` came out as
  `Add and`. A tick later it works, and it re-derives the run from the live selection rather than
  holding the text node it was handed, because inserting a trailing space makes Chrome rebuild
  that node.

## "Sloppy" was not slow (2026-08-31)

Jon: *"el uso de la app es un poco sloppy… tiene que funcionar smooth, transiciones,
desplazamientos."* The first thing to establish was whether that meant **slow** or **abrupt**,
because the fixes are opposites. It was measured before anything was changed, on a seeded
notebook of 45 experiments:

| | |
|---|---|
| a screen switch | 1–13 ms |
| a keystroke in a block | 0.25 ms (p95 0.5) |
| a 384-well plate repaint | 1.9 ms |
| 20 scroll steps of a 23,762 px experiment | 1.1 ms of layout |
| `renderEditor` | 1.8 ms |

Nothing here is slow. What the app never did was **arrive**: 127 hover rules in Labbook had no
transition on the element they changed, every dialog and every context menu appeared and vanished
between one frame and the next, a screen replaced the one before it with no acknowledgement, and
coming back to a list put you at the top of it. Adding transitions is therefore the fix, not
optimisation — and the one genuinely expensive thing in the product turned out to be somewhere
else entirely (below).

### One timing scale, in every app

`--dur-1: 120ms` (a control) · `--dur-2: 200ms` (a panel) · `--dur-3: 300ms` (a screen) ·
`--ease` · `--ease-out`. The shell **declared these years ago and shared them with nobody** — four
rules used them and no app had ever seen them, which is how twenty apps each arrived at their own
idea of how fast a hover is, or none at all. They are in all twenty now, alongside the type and
radius scales, and `docs/UI.md` carries the rules. Every app already had the
`prefers-reduced-motion` block that clamps them to 1 ms, which is what made this safe to add
without asking.

Two exclusions are the whole design, and both are deliberate:

- **`transform` is never in the shared transition list.** It is what drags, panning and canvas
  zooms are made of; a transition on it makes them trail behind the pointer. It is named per
  element, only where the element really moves — a press scale on buttons, the rise on a dialog.
- **Nothing repeated in bulk gets a transition.** A plate well, a freezer slot and a table cell are
  restyled hundreds at a time (`plSyncSelClasses` restyles 384 of them per rubber-band drag); a
  120 ms colour fade on each is both slower and harder to read. `.well.filled` slipped past the
  first blocklist because it was matched whole — the rule judges the first token now.

### Dialogs arrive and leave, with no JS change

Every dialog in Labbook goes through `_lbDlg()`/`popOpen()` and switches on one `.open` class, so
`@starting-style` (the from-state) plus `transition-behavior: allow-discrete` (hold `display`
until the exit has played) reaches all of them at once — the plate editor, the new-experiment
modal, every picker, the protocol diff, every context menu — and the same for the shell's settings
modal and both Cmd+K overlays. A browser without either feature lands on exactly the old snap, so
this is additive rather than a rewrite.

**Every closed overlay is `pointer-events:none`, and that is not tidiness.** A backgrounded tab
does not advance a transition, so an overlay whose `display` is waiting on one can be left lying
over the app: full-screen, invisible, and still taking every click. Found by testing in a hidden
tab, where it happens every time.

The shell's Cmd+K wrote `display` **inline**, which no stylesheet rule can beat; it toggles a
class now and the display lives in CSS.

### A screen enters, and it remembers where you were

`renderEditor()` runs on every tick, every calculator keystroke, every save and every incoming
sync — 62 call sites — so it cannot itself tell that a *screen* changed. `_edScreenKey()` is what
identifies one: which surface, which record, which tab, which day. Two things hang off it and
neither is possible without it:

- the 300 ms enter animation runs on a real navigation and never on a re-render, so ticking a step
  does not strobe the page;
- `#pane-ed`'s scroll position is filed under the screen you are leaving and restored when you come
  back, so opening an experiment and closing it returns you to the row you clicked instead of the
  top of the list.

The class has to come **off** again: the rule is `.pane-ed.screen-in > *`, and `renderEditor`
replaces that child every time, so a class left on the pane would re-run the animation on each new
child — the exact strobe the key exists to prevent. By timer, not `animationend`: a backgrounded
tab never fires the event and the class would stick, leaving `.ed-wrap` frozen at the from-state
with a transform on it.

### The tab bar of an experiment stays put

An experiment is ten to twenty thousand pixels tall. Scrolling to Results and finding no way back
to Steps without scrolling to the top was the sloppiest thing in the app, and it had already been
fixed **on a phone** (`.exp-tabs-m` has been sticky for months) and nowhere else. `.exp-tabs` is
sticky now, with its 10 px gap moved from `margin` to `padding` — a margin above a sticky element
is not painted with its background, so content scrolled up through the slot. `scroll-margin-top`
goes with it, or `scrollBlk()` parks the step it scrolled to underneath the bar.

### Scrolling: chaining, and two listeners that cost the whole app

Every inner pane in every app now has `overscroll-behavior`, so running a list to its end no longer
hands the gesture to the page behind it mid-swipe. **The axis is named** — `-y` on a vertical pane,
`-x` on a horizontal strip — because a blanket `contain` on a horizontal-only scroller swallows the
vertical wheel that was meant for the page underneath it.

Three listeners were making the *whole* app scroll on the main thread to serve one screen:

- **Labbook's plate grid** registered `touchstart`/`touchmove` `{passive:false}` on `document`.
  That tells the browser that every touch scroll anywhere in Labbook may have to wait for JS, for
  the life of the session, whether or not a plate is open. `#pl-grid` is a static node — its
  innerHTML is replaced, the element is not — so it binds there.
- **Labbook's week planner** did the same for chip dragging. Its `touchmove` is added on
  `touchstart` and removed on `touchend` now, the pattern Archive already used for sticky notes.
- **Echo's results table** had a document-level `{passive:false}` wheel handler turning a vertical
  wheel into sideways table scroll — in the flagship, whose primary screen is that table. It was
  also **not working**: it read and wrote `scrollLeft` on `.tbl-wrap`, which has no overflow of its
  own (the scroller is `.results-tbl-scroll` around it), so on a table wide enough to trigger it the
  wheel was swallowed by `preventDefault` and neither the table nor the page moved. It is bound to
  `#results-panel`, it drives the real scroller, and at either end it lets the page have the gesture
  back.

### Opening an app was the one thing that really was slow

`_loadApp` is the only genuinely expensive operation in the shell: Echo is 3.4 MB of base64, and
the per-character byte loop that turns it back into text costs **46 ms** before the iframe has
parsed anything. Measured end to end on the real bundle: **67 ms of frozen main thread** between
the click and the start of the fade.

The fix is not a faster click but having already done the work. A pointer resting on a card, or a
keyboard focus landing on one, is a reliable 100+ ms of warning; `_warmApp` spends it, on
`requestIdleCallback` so it never competes with anything the user is doing. Same call, warmed:
**4.5 ms**. The 90 ms delay is what stops a mouse crossing the grid from decoding five apps on its
way somewhere else, and `ld-card` and the Cells tabs carry a `data-app-id` so there is one thing to
look for rather than an `onclick` to parse.

`openApp`'s "nothing is touched until we know there is somewhere to go" guard now actually is
first: it used to sit *below* `_loadApp`, so a stale `#hash` decoded and parsed a megabyte of app
before discovering there was nowhere to put it.

### What was measured and deliberately not done

- **`content-visibility:auto` on the day blocks.** Tested: layout was already 1.1 ms for twenty
  scroll steps, so there was nothing to win, and it changed `scrollHeight` by 149 px — which is
  scrollbar jitter, the opposite of what was asked for.
- **The Journal day view costs ~38 ms**, and almost none of it is JS (2 ms across
  `blocksForDate`/`carryoverForDate`/`ongoingHtml`). It is `innerHTML` parsing **330 KB** of markup:
  carry-over renders every unticked step of every open experiment in full, for 21 days. Cutting that
  means collapsing carried-over steps, which is a design decision, not an optimisation. The enter
  animation now covers it, so it reads as a transition rather than a stall.

### Also found while sweeping

Beacon's header ran two heights in one row — `.btn` sizes from its padding (27 px) and `.opts-btn`
is a 30 px circle. `docs/UI.md` has said 32 px for a toolbar control since it was written. Scoped to
the header, because `.btn` is also used full-width inside panels where a fixed height would clip a
label that wraps.

**Verified**: `check_css` / `check_js` / `audit_app --xref` / `check_shared` all clean; the
alignment audit clean on all 19 apps at 1440 px and 375 px with no horizontal overflow at either;
all 19 apps load standalone with the tokens resolving; the four build profiles rebuilt.


## The day view was 86% of something nobody reads (2026-08-31)

Jon, on the measurement above: *"esos 330 KB no me convencen."* Right — the honest answer was not
"it is a design decision". Broken down, a day view on a notebook with 105 open experiments was
411 KB of markup and 5,190 nodes, and **354 KB of it was the carried-over list**: for every
unfinished step of the last three weeks, of every open experiment, the *whole step body* —
protocol prose, calculators, notes — plus four buttons.

**Carried over is a decision list, not a work surface.** What you do with a carried-over step is
decide: tick it, move it here, snooze it, or dismiss it — and if you decide to do it, *Move to this
day* puts it in the section above with its body and its calculators. So the body is built by the
click that asks for it (`carryToggle`, `CARRY_OPEN`) and stays open for the session; opening one
does not re-render the list and lose your place in it.

The row lost its button wall too, to the `⋯` the row **already answered to on right-click and long
press** — `wkCtxBlock` has carried Open / Done / Snooze 1 day / Snooze 1 week / Move since it was
written, and then the row printed three of them inline anyway. It gains `Dismiss`, and "Move to
today" becomes "Move to this day" when the day you are looking at is not today, which it was
quietly lying about before.

What was left after that was markup waste, and it measured: the row was **1,219 bytes** of which
**896 was four buttons**, and the same two 15-character ids were re-quoted into four inline
handlers. They are written once as `data-e`/`data-b`/`data-d` and one delegated listener reads
them. `oncontextmenu` deliberately **stays an attribute**: the long-press delegation matches
`[oncontextmenu]`, and a row that lost it would lose its menu on the phone.

**An empty plate map drew 384 empty boxes** — 29 KB to say what its own header already says
("0 wells used"). It says it in a line now, and keeps the card and its **Edit** button, which is
the thing you actually want in front of you on a map you have not laid out yet.

And the ⋯ drawing had been written out by hand in two places and was about to be a third, as three
0.6-radius circles stroked at 2.2 — which is a dot drawn the hard way. One `ICON_MORE_H`, filled,
a third the markup, in a list that can run to hundreds of rows.

Measured on the same seed, before and after, at 1400 px:

| | before | after |
|---|---|---|
| a realistic notebook (25 experiments, 8 running, 9 carried) | 67 KB · 916 nodes | **30 KB · 466 nodes** |
| nothing ever ticked (105 experiments, 281 carried) | 672 KB · 8,916 nodes · 587 ms | **335 KB · 5,492 nodes · 341 ms** |

What remains in the degenerate case is one group header per experiment, and that is not waste: 105
stuck experiments is information the notebook has to show.

### Two bugs on the home screen

- **The week band showed one pill per step**, so an experiment with two steps on Monday appeared
  twice under the same code — which is exactly the question a week band answers wrongly. One pill
  per experiment; the steps are named in its tooltip, and how many are left is the experiment's own
  question, which it answers when you open it. `+N` counts experiments now too, or it disagrees
  with the pills above it.
- **`.lh-x-code` was a fixed 78 px with nothing to stop overflow**, so in Running experiments the
  code ran underneath the title beside it. Every code is now longer than that box was sized for:
  the project prefix added two characters and an underscore, so `NB20260830` became
  `SP_NB20260830`. It sizes to its content with 78 px as a floor rather than a ceiling.

### `margin-left:auto` again, and this time no breakpoint could fix it

Both day-view step rows (`.day-carry-hd`, `.dfx-blk-hd`) were `flex-wrap:wrap` with the last
control on `margin-left:auto` — the idiom already recorded for Blueprint's toolbar. With a long
step name the row wrapped and the control kept its auto margin, landing on the right of the
*second* line under a left-aligned first row. Unlike the earlier cases this does not have a width:
it happens whenever the title is long, so the media query that fixed Blueprint fixes nothing here.
The rows do not wrap at all now — the title takes the slack and ellipses, which is what a dense
list wants anyway — and everything that is not the title holds its size, because a ⋯ squeezed to
5 px is not a button. The carried-over badge dropped the word "from": the section header says it,
and 33 px matters when the pane is narrow.

**Noted, not fixed:** between about 900 px and 1024 px the tree, the pages pane and the right dock
leave the day view roughly 272 px — the content gets less room than any of the chrome. The rows
truncate cleanly there rather than breaking, but the pane layout at that width is a real gap.

### An experiment folds out of the day (2026-08-31)

Jon: *"en el journal permite plegar todo el experimento, para limpiar la vista de día y poder ver
las notas etc."* The day is where the notebook is actually written, and the daily note sits under
everything else — on a four-experiment day with one plate map it starts **27,497 px** down. That
is the whole complaint, and it is a number.

A chevron on each experiment's header folds it. Folding does not hide the body, it **stops
building it**: `dayDueBlocksHtml` / `dayCarryBlocksHtml` are only called for a group that is open,
which is the same "render what was asked for" the carried-over list already does one level down.
*Fold all* is in the section header, and turns into *Unfold all*.

| | day view | nodes | daily note at |
|---|---|---|---|
| everything open | 31.1 KB | 452 | 27,497 px |
| folded | **8.3 KB** | **137** | **880 px** |

Three things make it the right kind of fold:

- **It is keyed by experiment, not by card.** An experiment with steps due today *and* steps
  carried over appears twice; folding it puts both away. It is the experiment you are setting
  aside, not one of its two appearances.
- **The header says what went with it** — "4 steps · 1 done". A fold that hides the amount of work
  it is hiding is how you miss a day.
- **Session state, like `CARRY_OPEN`, and deliberately not persisted.** A fold that outlived the
  tab could hide work that is due, on the one screen whose job is to say what is due. Reload and
  the day is whole again.

**Verified**: every carry-over verb re-tested through the delegated handler — tick (and the row
leaves the list), expand from the step text, the arrow that jumps without expanding, the `⋯`,
right-click, and an expanded step still open after a re-render; `check_css` / `check_js` /
`audit_app --xref` / `check_shared` clean; the alignment audit clean on all 19 apps at 1440 px and
375 px, and on Labbook's Journal and Home at 375 / 600 / 760 / 900 / 1024 / 1180 / 1440 with no
horizontal overflow at any of them; the four build profiles rebuilt.

## The chrome outgrew the content, and an audit that could see it (2026-08-31)

Jon: *"arregla el layout de los paneles a 1024px. quiero audit completo de toda la app, verifica
código y visuales. no quiero ni un solo error."*

### The panes

At 1024 the tree (210), the page list (280) and the right dock (250) are **740px of a 1024px
window** — the day view got 272px, less than any one of the three things squeezing it. At 900 it
got 157. The rows truncated cleanly, which is what had made it easy to keep calling it a gap
rather than a bug.

**The chrome yields before the content does, in the order it matters.**

- **The dock is first**, because it is reference material (Outline · Tags · Info), it already has
  a button, and it already knew how to be an overlay — it just only knew it below 760px. Below
  `LB_DOCK_FLOAT_MAX` (1150) `body.lb-dock-float` gives it the slide-in treatment the phone
  layout uses, and the threshold is written once, in JS, instead of in a media query and a
  comparison that can drift apart.
- **Then the two left panes are clamped** — at render time, not in the store. `_paneWidths()`
  works out what the editor needs (`LB_ED_MIN`, 580: `.ed-wrap` is a prose column and below about
  that it stops being one) and lends the rest, stopping at the width where a list stops being
  readable. **The stored widths are never rewritten**, so widening the window brings the panes
  back to exactly the size they were dragged to. `!important` was the alternative and would have
  fought the splitter drag.

| window | editor before | editor after |
|---|---|---|
| 1440 | 688 | 688 (untouched — everything fits) |
| 1180 | 432 | 580 |
| 1024 | 272 | 580 |
| 900 | 157 | 558 |

### The audit

`tools/audit_runtime.js` is new and is the third leg: `audit_app.py` reads the source,
`audit_align.js` measures a row, and this one loads the page and asks what only a loaded page
knows — a handler naming a function that no longer exists, a duplicate id, text the same colour
as what is behind it, content pushed outside a clipping box. Nineteen apps × four widths × both
themes, plus every Labbook screen driven into place (Home, Experiments, Journal, an experiment,
each tab, the plate editor, every dialog), plus the shell with all eighteen apps loaded in their
real frames, plus the four build profiles.

**The harness was wrong before the app was.** Its first run reported sixty invisible-text
findings; two were real. `getComputedStyle` during a transition returns the tween, and in a tab
that is not compositing the tween never finishes — so with the new `background-color`
transitions on every surface, flipping `data-theme` made *every* themed card look like it had no
dark value. Three more false-positive classes followed (a gradient behind the text, an element
judged on its children's text, `scrollWidth` on a padded flex column). All four are written into
the file as the reason each rule exists, and `docs/UI.md` carries them.

That also turned up a real thing: **a theme switch was cross-fading the whole page**, because
every surface now has a colour transition. `html.theme-swap` suppresses transitions for one
frame, driven by a `MutationObserver` on `data-theme` so it catches all 49 call sites across the
twenty files and any added later.

### What it found

- **Beacon's logo had been invisible since it was written.** `--brand` was declared in the dark
  palette and nowhere else, so in the light theme — the one the Hub opens in — `var(--brand)`
  resolved to nothing, the 32px box had no background, and the white "B" sat on white.
  `check_css.py` passes it because the token *is* defined; the mirror check (a colour token with
  no value in the theme that is actually open) is what catches it, and Beacon was the only one.
- **Blueprint's ⓘ marker is `--accent` and sits on a `--primary` button**, whose background is
  also `--accent`. Invisible on the one button that carries it.
- **Labbook's day-view recipe panel had no dark value** — `#eef2f9`, a near-white, with the text
  inheriting `--text`: light grey on light grey, unreadable, on the screen you open every
  morning.
- **On a phone you could not delete a step, snooze it, or add a calculator or a plate map.** The
  step header is nine controls needing 481px in a 347px block that clips: the trailing four were
  simply outside it, and the title input was squeezed to **0px** — a step you cannot name. They
  are behind the `⋯` that `ctxBlock` has always answered to on right-click and long press, and
  the menu gained the verbs those buttons carried.
- **The same header gave the title 50px on a 1440px screen.** The collapse is keyed on the
  *block's* width with a container query, because the block is only as wide as the editor pane
  leaves it and no viewport query can see that. Above 660px of block width the buttons are back.
- **Dora's tab bar pushed the whole document sideways** between 641 and ~880px — 65px of
  horizontal overflow, which is what makes a phone zoom out to fit. The ≤640 block already made
  the bar scroll; it just started too late. Its Template button was also two lines beside a
  one-line settings circle, because `min-height` cannot hold a label that wraps.
- **Ribbon's top bar, Labbook's calculator header and every dialog footer** were the
  `margin-left:auto` / `flex:1` spacer idiom again — a hole under a left-aligned first row once
  the bar wraps. Three more instances, one rule, now written into `docs/UI.md`.
- **Cell Archive's list row is five columns whose minimums add up to 430px** before the gaps, in
  a 289px row at phone width: the last two columns were outside the card. Lumina's setup dialog
  clipped its own last tab. Fabricata's preview table lost two columns. All three now scroll or
  drop to the columns that are the reason the list exists.

**Verified**: `check_css` / `check_js` / `audit_app --xref` / `check_shared` clean; the runtime
and alignment audits clean on all 19 apps at 1440 / 1024 / 375 in both themes and at 1180 / 960 /
900 / 800 / 600 besides; every Labbook screen and dialog clean at four widths; the shell clean
with all 18 apps loaded in their real frames; dHUB, the product build, the standalone Labbook and
the Archive PWA all clean; the four profiles rebuilt.

**Still open, and deliberately**: `.blk-title` is 90px at its floor on a narrow block — the step
header is dense by nature and the ⋯ is what makes it work. Fabricata keeps two confirm-dialog
buttons clipped by 3px at 375; it is outside the product build.

## As safe as OneNote (2026-09-01)

Jon's brief was three things — an experiment that says what it was for and what it showed,
timers that reach you, and *"me preocupa la pérdida de datos, esto tiene que ser tan seguro como
OneNote… tiene que haber sistemas que impidan la pérdida de datos de ningún tipo."*

OneNote's safety is four things: a local cache, **per-page version history**, a **recycle bin**,
and **conflict pages that never silently overwrite**. Labbook had the cache. It had none of the
other three, and it had two active loss paths of its own.

### The boot race that destroyed attachments

`setTimeout(gcAttachments,4000)` at the foot of the file, against a `_collectAttIds()` derived
from `LB.data` — and the boot read swallowed its own failure into an empty `catch(e){}`. So a
`localStorage` value that would not parse gave a **blank tree**, and four seconds later every
image and every dropped file on that machine was hard-deleted from IndexedDB — before the cloud
copy landed at t≈6 s and repopulated the tree with `data-att` references pointing at nothing.
Reproduced against the committed build: both planted attachments gone at t=4 s.

- **Mark, never hard-delete.** An unreferenced blob is marked in a reserved `__gc__` key and
  deleted 30 days later only if it is still unreferenced. An id that **comes back** — an undo, a
  restore, an adopted tree — has the mark lifted rather than left standing.
- **A settle gate.** `_bootSettled` / `_onBootSettled` — nothing destructive runs until
  `lbInitSync`'s first read resolves, or 20 s pass, or there is no cloud to wait for.
- **`_localReadFailed`** separates "a value was there and did not parse" from "this is a new
  browser". The first blocks the GC and the daily backup, says *Cache unreadable* on the status
  pill, and interrupts once — carrying on typing makes it worse.
- **A snapshot never replaces a bigger one** (`_snapRecords`), and retention went 3 → 7 days. A
  boot from a blank tree used to write a blank snapshot over the good one *and* rotate a third
  of the safety net out with it.

### A recycle bin

`delProject` deleted the project **and every experiment in it** with no `undoMark` at all — same
for `delSection` and `delGeneral` — and `save()` pushed it to RTDB 1.2 s later. `UNDO` is sixty
steps of memory that dies on reload.

`LB.data.trash`, and **`trash` is in `_CLOUD_MAPS`**: a deletion that syncs while the way back
does not is the same permanent loss with extra steps. 60 days, which is OneNote's own number.

- A **project or folder is one entry** carrying its experiments. Restoring one experiment at a
  time would be a different and worse feature.
- A **step remembers its index** — put back at the end of the list it is dated from the wrong day.
- Restoring into a project that has since gone files it under **Recovered**. A missing *folder*
  needs no such thing: `xvProjectBody` already draws an "Unfiled" group.
- A **day written in since** gets the old note appended under a rule, never overwritten.
- **`_collectAttIds` scans the trash.** Miss it and the GC marks the bytes of everything you
  deleted and a restore hands back empty boxes. The scanner (`_attScanInto`) is now shared
  between the live tree and the trash so the two cannot disagree.

### Version history, and a conflict that keeps both

Each stored version is the record **as it was before a change**, not after — that is the state
you want back, and it means the newest version is never a copy of what is already on screen.

It rides the `save()` debounce and reuses the same per-record fingerprint `_cloudPush` does, with
its own `_verSeen` so it works with **no cloud at all**. One scan per 2.5 min, one version per
record per 10 min; measured on a 1.4 MB notebook of 122 records: **3.2 ms**. Last 20 per record
whatever their age, then one per day for 60 days, then oldest-first over a 60 MB cap. It is
**local**, in its own `lb_ver` IndexedDB, and travels inside the backup file (last 5 per record;
backups are `_lbBackup:3` and **merge** rather than replace on restore).

`_applyRemote` used to keep ours, **discard theirs entirely**, and say so in a banner that removed
itself after nine seconds — so the other machine's work went with our next push and you had to be
at the screen to know. Theirs is now written into the history tagged `remote`, which makes a
conflict *a version that arrived from the other device*: restorable, comparable, saveable as a
separate copy. That is OneNote's conflict page built out of machinery that had to exist anyway.

### Attachments that never reached the cloud

`_attUpload` ran only from the attach path and never retried, and a failure left **nothing**
behind — so the bytes stayed in one browser for ever. Everything attached before Storage was
enabled on 2026-08-27 was never uploaded at all; that backfill had been listed as "not built"
since. Both are the same question — which live attachment has no cloud copy? — so they are one
sweep (`_attSweep`), three at a time, nine seconds after the settle gate and on demand.

A failure records `{pending, tries, at, why}`, which is what lets the sweep find it again. An id
whose **bytes are not on this machine** is reported as "not on this device", not as a failure —
it means the file is on the other machine or in a backup, which is a different sentence.

### One Recover dialog

The View ribbon carried Backup, Snapshots and Restore and would have needed five. They answer one
question, so: **Deleted items · Versions · Snapshots · Backup file**, replacing two buttons with
one. Reusing `.exp-tabs` for its tab row was wrong twice — the experiment editor hides it under
the mobile breakpoint (so the phone could reach neither Snapshots nor Backup file) and it is
sticky with a `--bg` background inside a glass card. It has its own `.rc-tab`, and the row stacks
below 560px instead of ellipsing a name to fourteen characters.

## An experiment can say what it was for and what it showed

`grep` for `conclusion|outcome|hypothesis|objective` returned **zero**. `buildReportDoc` listed
ten codes, ten dates and ten step counts and said nothing about what any of them found.

`e.aim` is one line, asked in the New-experiment modal and editable under the title. `e.outcome`
is `{verdict, text, at}` over **worked · partial · failed · inconclusive**. `closeExperiment`
already opened the right conversation and only ever asked about *process* state; it now asks
about the science too, as a second, skippable step.

**Nothing is inferred and nothing is required.** An experiment with no outcome reads as *no
verdict recorded* — "—" in the report, no marker in the list, "No verdict recorded" in the band.

Wired through what already existed: `xvRow`, `metaHtml`, the header lean line, `resultsPaneHtml`,
`homeRunningCard`, `buildReportDoc` (a column **and** the two lead lines under each experiment),
`exportReportCSV`, and `spotContent` — an aim and an outcome are one sentence each and are what
you go looking for by meaning rather than by name. `buildExpJSON` carries them for free.

Two things that had to be right rather than merely present:

- **The paragraph section is off by default.** What `buildPubReadyFromExp` builds is a Methods
  section and a Methods section carries no verdict. `PUB_DEFAULT_OFF` is the mechanism.
- **`_pubSourceSig` includes the outcome.** It can be in the paragraph, so changing it has to be
  able to make the paragraph stale — leaving it out is precisely the silent drift that signature
  exists to catch.

## A timer that survives a reload

`LB_TIMERS` was an in-memory array and `_timerBeep` is WebAudio in a foreground tab; a background
tab throttles `setInterval` to a minute or suspends it. A three-hour incubation reached nobody.

**`HUB_NOTIFY` / `HUB_NOTIFY_ASK` / `HUB_NOTIFY_OK` on the shell**, for the same reason
`HUB_FREEZER_*` is there — an app in a `srcdoc` iframe asks the host rather than nineteen apps
each working out permissions — with a local fallback so the standalone build works. Permission is
asked on the **first timer you start**, a real user gesture; never at load, which is the prompt
everybody clicks Block on.

Timers persist to `localStorage`, **not `LB.data`** — a timer belongs to this bench, and syncing
it would ring on the machine at home. One that ran out while the tab was closed comes back
showing the time it finished at and *finished while you were away*. Older than a day is litter.

**The ceiling is stated where the timers are**: this arrives while the browser is running. A
`srcdoc` iframe cannot register a service worker and a scheduled notification for a closed
browser needs a push server, so it is not an alarm clock and does not pretend to be.

## Two curated presets from Jon's own runs

Both are `EXTRA_PRESET_SEED` entries with a `baseType` — data, not new code — and `_presetV8`
ships them.

- **`Viability_CTG_TCIP_96`** (`CTG_TCIP96`, baseType `CTG`) — a TCIP dose-response viability
  screen: 1,000 nM top, 3-fold, 11 points plus DMSO in column 12, four compounds each on a pair
  of rows, read at 24 h and 72 h. New layout `ctgdr96`. The four compound names are generic on
  purpose; Jon's twelve real ones appear nowhere. **Jon's notes carried two impossible dates** —
  "31/06/2026" (June has 30 days) and a 72 h read dated *before* the 24 h one; the plot title
  `CTG20260731` settles it, so the offsets are day 0 · 1 · 3.
- **`Degradation_D2B_1`** (`D2B_CHEM1`) and **`Degradation_D2B_2`** (`D2B_SEED1`) — the same
  screen with the order inverted, which is the only thing that differs. 1: reaction overnight at
  RT → compound addition + seeding on top → 20 h → read. 2: reaction *and* seeding on day 0, so
  the cells are attached when they are dosed the next morning → 20–24 h → read. Same density,
  volume and lytic prep. The overnight reaction correctly carries **no** `w`: the next block's
  date expresses a wait of ≥24 h.

### The preset keeps the proportions; the setup supplies the absolutes

Jon's rule, and it turned out to be half-built already. `applySetupToBlocks` takes the **seeding
block's `nPlates` as the base** and rescales every other block by the same ratio — so 16 dosed
per line and 32 lysed in one prep stays 2× whatever "# assay plates" becomes (verified at 8:
92,160 µL seeding, 73,728 µL lytic). The overages (1.5 seeding, 1.2 lytic) and the 1:2 reagent
ratio are proportions too, and they are what the preset carries.

What was missing was the plate. A `PLATE_LAYOUTS` entry's `build` was **already a function**, so
it can be one of the setup rather than a picture of one run. `SETUP_SCHEMA.D2B` now asks
**# compounds / plate · # concentrations · technical replicates**, and **`d2b384`** derives its
geometry from them: one compound per column from column 2, the dose running *down* each of
`nReps` stacked bands, DMSO in the last two columns, blank edge. Jon's numbers (20 · 7 · 2) give
280 treatment + 28 DMSO + 76 blank = 384.

Three rules in it worth keeping: **when the bands do not fit** (7 × 3 = 21 rows in 14) the
concentrations give way, not the replicates, and the plate's own title says what it drew —
a replicate you asked for and silently did not get is the worse of the two lies. **DMSO stays at
the right edge** whatever the compound count, because that is where it is on the bench. And the
three fields are in D2B's **`pubSkip`**: the Plate layout section states all of them in its own
words, so the Setup line printing "# concentrations 7; Technical replicates 2" is exactly the
form dump `_pubSetupText` exists to stop.

**`echo384` is not this plate**, though it fills the same wells: it describes a 10-point gradient
running *across* the columns. Same geometry, different experiment.

`CALC_KINDS.seed`, `.ctg` and `.lytic` gained `_ovxL(v.excess)`: all three printed the per-unit
arithmetic beside a total that silently included the dead-volume overage, which is the exact
defect *Calculators tell you their overage* fixed elsewhere. **No calculator maths moved.**

**Flagged, not silently decided:** `lytic` derives LgBiT and substrate from the unrounded
147,456 µL → 1,475 and 2,949 µL. Jon's sheet rounds to 147,000 first → 1,470 and 2,940. A 5 and
9 µL difference, left as the calculator had it.

## A checklist can hold a bullet list, and a set of shortcuts you can state

Jon: *"no me deja combinar lista check y bullet point… debe ser posible y hacerlo más fácil"*,
and then *"inserta también legend de atajos. hay que re organizar menús de settings y help."*

**The structure was never the problem.** `Tab` inside a checklist produces a plain nested `<ul>`
with no class — which *is* a bullet list. Two **descendant** selectors were overriding it:
`.rt ul.lb-check li` painted a checkbox on everything inside a checklist, and
`.rt ul.lb-check ul` stripped the bullet for good. `> li` is the whole fix; a nested
`ul.lb-check` still matches it on its own, so a checklist inside a checklist keeps working, and
an `li` holding nothing but a list draws no box (the orphan checkbox in Jon's screenshot). The
three JS sites that enumerate checkable items had to follow, or a bullet sub-item keeps counting
towards "2/7 steps" while being impossible to tick.

### `SHORTCUTS` is one table, and the legend is rendered from it

There were five shortcuts. **`⌘K` stays search** — Jon's call, and the right one: it is the key
pressed here twenty times a day. So the set is organised around that rather than around
OneNote's bindings, and it states its own rule, which is what makes a set learnable:

> **⌘ acts on what you are writing · ⌘⇧ inserts a thing · the number keys choose a kind of list.**

A link therefore joins the Insert family on `⌘⇧L`. The handler dispatches from `SHORTCUTS` and
the legend renders from it, so a shortcut cannot exist without appearing in the legend and the
legend cannot drift from what the keys do — 23 entries, 23 rows, no orphan, no duplicate combo.

**Matching is by character for letters and by physical key (`e.code`) for digits.** A Spanish
keyboard puts `/` and `7` somewhere else than a US one; digits are stable by position and
letters by what they type.

`⌘1` is the one the screenshot needed: it makes the list under the cursor a checklist, and again
turns it back to plain bullets — with `Tab`, that is the whole gesture. `⌥↑`/`⌥↓` move a line by
moving the **node**, not by cut-and-paste, so a ticked checkbox stays ticked.

**A shortcut in a table is also a shortcut two handlers can claim.** `⌘K` was in the new table
*and* still in the spotlight's own listener; both fired, so it opened and closed inside one
keypress. That listener now keeps only the keys that mean something while the spotlight is open.

### Settings and help: one modal, four tabs

The View ribbon was **ten buttons mixing four unlike things** — export (PDF · Copy · Word ·
Data), safety (Backup · Recover), appearance (Lean · Theme · Panel) and one lab-wide setting
(Analysis). Help had nowhere to live at all.

- **Export** is one picker whose rows say what each answer is *for* — the whole record, the
  clipboard, a Word file, the Methods sheet, the numbers, a report. Four icons in a row never
  said that.
- **Backup** was already inside Recover.
- **Settings** (`openSettings`) is Shortcuts · Writing · Appearance · About, the same shape as
  the shell's *Settings: one modal, four tabs*, reusing the Recover dialog's `.rc-tab` markup.
  About is where "where does this notebook live" and "what to do if something goes wrong" are
  answered, which is the help half.

Six buttons instead of ten, each a real category. `⌘/` opens it on Shortcuts, `⌘,` on Settings.

## Current state

**v1.10.0**, 19 apps in the personal build / 11 in the product build, last worked 2026-09-01. (This session: **durability** — Labbook is now as safe as OneNote in the four ways that phrase means anything. The attachment GC hard-deleted on a derivation that could be wrong and did so four seconds after every load: reproduced against the committed build, both planted blobs gone at t=4 s with a corrupt cache. It marks now and deletes after 30 days, behind a settle gate, and a boot read that fails says so instead of pretending to be an empty notebook. Deleting stopped being permanent — a recycle bin that syncs, 60 days, with a project or folder restored in one piece. Version history, local and carried in backups, storing what a record was **before** each change. A conflict keeps both copies instead of discarding the other device's work behind a nine-second banner. And the attachment backfill that had been listed as "not built" since August is built. Then **aim and outcome**: an experiment can finally say what it was for and what it showed, which is what turns the report from a list of codes into a report. Then timers that survive a reload and reach a backgrounded tab. Plus two curated presets from Jon's own runs — a TCIP viability dose response and the plate-chem D2B — and, last, the writing surface: a checklist can hold a bullet sub-list again (two descendant selectors were overriding a structure that was always correct), there are 23 shortcuts declared in one table that the legend renders from, and the View ribbon's ten buttons became six real categories with settings and help behind one door. See *As safe as OneNote*, *An experiment can say what it was for and what it showed* and *A timer that survives a reload* above.) Start with the compact [Claude handoff note](docs/CLAUDE_HANDOFF.md) for the current checkpoint, then use the full changelog/session history: [`docs/SESSION_HISTORY.md`](docs/SESSION_HISTORY.md) (not auto-loaded — open it directly for past-change detail; nothing was deleted, only moved there).

### Open items / not yet done
- ~~**Firebase Storage not enabled in the console.**~~ **Done 2026-08-27** — bucket created in
  `europe-west1` and `storage.rules` published; verified from outside (the bucket went from
  `404 Not Found` to `403 Permission denied`, the correct answer for no session). Uploads
  themselves need a signed-in session to confirm. ~~**Old attachments still need a backfill**~~ —
  **built 2026-09-01** (`_attSweep`), and it is the retry path for failed uploads too. It has
  not yet been *run* against Jon's real notebook on a signed-in session; the counter in
  Recover → Backup file is what will say how many there were.
- ~~**Firebase `/journal` rules** still need pasting into the console.~~ **Wrong — they are
  deployed** (verified 2026-08-27 by probing the RTDB anonymously: `labconfig` and
  `announcement` return 200, `journal` and `journal/labbook` return `Permission denied` 401,
  exactly matching `database.rules.json`). Don't re-raise this.
- **IP ownership is unresolved.** As employee-created work, the University of Dundee very
  likely owns or co-owns this. Resolve with Research & Innovation Services before any sale
  conversation — it also opens the legitimate routes (spin-out, licence).
- **The public Pages URL still serves the full personal build.** Seed data is neutral and
  `ADMIN_ONLY_APPS` is enforced in `openApp`, but the real instance should sit behind auth.
- **The leaked legacy RTDB secret** (see Firebase section) is accepted risk for personal use but
  is disqualifying for a product — Phase 3 migrates off `thehub-f80ae` entirely.
- **Archive calculator audit — done 2026-08-24.** All nine were re-derived and checked
  numerically in the browser against hand arithmetic (TR-FRET, FP, SPR, miniprep, NucleoSpin,
  IP, lentivirus/polybrene, MiSeq PCR, CRISPR KO/KI RNP). The **maths was right in every one**;
  what was wrong was what they said about it — see *Calculators tell you their overage* below.
- **Echo still loads jsPDF from cdnjs, and Echo and Dora load RDKit from unpkg.** Both are now
  *announced* — a banner when the load fails, and a line in each app's own description before
  you use it — but neither is embedded, so PDF export and structure rendering still need the
  network. 3Dmol in Ribbon is the third, and is out of the product build.
- Nothing else is queued that does not need Jon. The three "minor polish" items are done
  (2026-08-24): the step palette drags into position, seeding densities are derived from the
  line's cited doubling time, and the publication prose builds real sentences.

*(Closed 2026-08-24: Labbook plate maps export PNG and their well types can be added, renamed,
recoloured and removed; Archive's calculator link opens the **Calculate** tab rather than the
protocol text; and `docs/mockups/labbook-home.html` was retired to `old_stuff/` — the real home
shipped in v1.7.0, so the mockup could only contradict it.)*

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
  Files remain on disk. Beacon is visible to admins inside Data Analysis but remains outside the
  public unlock flow, pending its Phase 2 absorption into Echo.
