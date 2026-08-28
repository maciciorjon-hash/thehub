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
bumped `_presetV2` → `_presetV3` → `_presetV4` → `_presetV5` → **`_presetV6`** (2026-08-25, `pub` Methods sentences, the closing analysis clause and the `w` waits), so `seedPresets()` re-seeds all built-in presets once
per browser. Custom/user-added presets are untouched; hand-edits to built-in presets made
before this change are overwritten. **Bump to `_presetV7` if you edit `PRESET_SEED` again.**

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

## Current state

**v1.9.0**, 19 apps in the personal build / 11 in the product build, last worked 2026-08-24. (This session: the card verbs, one context menu with three doorways, a Cmd+K that searches contents, the open-items pass, the seeding linkage, and the mobile pass — see above.) Start with the compact [Claude handoff note](docs/CLAUDE_HANDOFF.md) for the current checkpoint, then use the full changelog/session history: [`docs/SESSION_HISTORY.md`](docs/SESSION_HISTORY.md) (not auto-loaded — open it directly for past-change detail; nothing was deleted, only moved there).

### Open items / not yet done
- ~~**Firebase Storage not enabled in the console.**~~ **Done 2026-08-27** — bucket created in
  `europe-west1` and `storage.rules` published; verified from outside (the bucket went from
  `404 Not Found` to `403 Permission denied`, the correct answer for no session). Uploads
  themselves need a signed-in session to confirm. **Old attachments still need a backfill** —
  see the Attachments section.
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
