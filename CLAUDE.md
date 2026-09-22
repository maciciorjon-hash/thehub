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
| **Export** | a document someone else can use: Methods sheet, PDF, Word, CSV, PNG | `exportMethods`, `exportPDF`, `copyRendered` |

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
| `beacon` | Beacon | SVG donor/acceptor BRET glyph | `#5e72c4` | `apps/beacon/beacon.html` |
| `lumina` | Lumina | SVG light bulb | `#f5c518` (warm gold) | `apps/lumina/lumina.html` |
| `ribbon` | Ribbon | SVG ribbon waves | `#e36c69` (salmon) | `apps/ribbon/ribbon.html` |
| `protocols` | Archive (formerly Protocols) | SVG open book | `#a56983` (dusty pink) | `apps/archive/archive.html` |
| `cellarchive` | Cell Archive | SVG cell/nucleus | `#d17a4a` (terracotta) | `apps/cell-archive/cell-archive.html` |
| `incubator` | Incubator (**admin-only** — cell-culture tracker) | SVG incubator/cell dish | `#4f9d8f` (teal) | `apps/incubator/incubator.html` |
| `labbook` | Labbook (**admin-only** — electronic lab notebook; experiment-centric planner) | SVG notebook | `#4f9d8f` (teal) | `apps/labbook/labbook.html` |
| `blot` | Blot (western blot figure builder) | SVG blot panels | `#5b6b7a` (slate) | `apps/western-blot/western-blot.html` |

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
│   └── beacon/  lumina/  western-blot/  ribbon/  cuppa/
├── tools/                      ← not part of the build
│   ├── check_shared.py         sync_fit_engine.py
│   ├── migrate_protocols.py    make_icons.py
│   ├── mobile_sweep.mjs        snap_compare.mjs        mobile_embed.html   (Playwright; see UI.md)
├── docs/
│   ├── CLAUDE_HANDOFF.md       SESSION_HISTORY.md       UI.md
│   └── PROTOCOL_MIGRATION_REVIEW.md
├── old_stuff/                  ← retired apps and dead docs; see its README
│   ├── arc/  labmate/  plasmids/  fabricata/  gantt/  images/  superpowers/
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

**Plate Designer mobile:** `.sel-toolbar` is a **bottom sheet** below 720px — `bottom:0`, `max-height:46dvh`. It used to be pinned at `top:58/64px` with `max-height:calc(100vh - 80px)`, and this note used to claim that "never covers the plate canvas": measured at 375×720 it was **640px tall and covered all of it**, so you could not see the wells you had selected while deciding what to do to them.

**Favicon:** SVG data URI in `shell/hub-shell.html` `<head>` — dark rounded square with white "d", matches nav logo.

**`labBtn.style.display`:** Must be set to `'inline-block'` (not `''`) — a CSS rule hides it by default and `''` doesn't override it.

---

## Labbook — experiment-centric planning (added 2026-07-30)

The axis of Labbook is the **individual experiment**: you design one, it expands into dated
day-blocks, and each day's blocks surface in that day's notebook (`blocksForDate` →
`renderDayView`). Three systems support that:

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
before this change are overwritten. The flag is at **`_presetV9`** as of 2026-09-02; **bump it if you edit `PRESET_SEED` or `EXTRA_PRESET_SEED` again.**

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
Labbook* button next to Copy TSV. It posts
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

Archive is no longer only protocols (34 of them since the T-REx line joined on 2026-09-15). A kind switcher (`LIB_KINDS`) sits above the search:
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
  translate its `{rows,cols}` to Labbook's `{r,c}`; **five parsing bugs came across with the
  port and were fixed in both on 2026-09-02** — see *A port carries the bugs too*) — colours across the range present, numbers
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
`exportOneNoteDoc()` saves that HTML in a Word envelope for Insert → File Printout, and it is
the half of this that survives.

**The copy half is gone**, and the section below (*Undo, the clipboard, and one gesture on the
plate*) is the current answer: `copyForOneNote()` inlined every computed style and replaced each
SVG with "[diagram — see the PDF export]", and selecting the rendered page and pressing ⌘C beats
it outright. `copyRendered()` does that. Read this section for the inlining traps — they still
apply to the Word export — not for how Copy works.

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
top-left corner cut at 45°, and a real tube rises out of that cut in a rotated
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

*(Superseded 2026-09-14 — the rail is **Planner · Notebook** · Data Analysis · Archive · Cells ·
More apps, and Labbook's own left column names the surface inside each workspace. See *Two
workspaces, one file*.)*

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
tree never lists the three surfaces** *(reversed 2026-09-14: the rail names the workspace now, and
the column names the surface — see *Two workspaces, one file*)* — the rail owns them, and listing them twice was the
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

Both are `EXTRA_PRESET_SEED` entries with a `baseType` — data, not new code, shipped by the
`_presetV*` seed flag (at `_presetV9` since the second D2B preset landed).

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

## A port carries the bugs too (Blueprint audit, 2026-09-02)

Jon asked for a full audit of Blueprint — code, geometry and behaviour, *"como se seleccionan las
cosas, dónde sale el pop up… todo tiene que funcionar flawless"*. Most of it was already right:
`audit_app --xref` clean, selection correct in every mode (row · column · all · shift-rectangle ·
⌘-toggle), the dilution series right to the digit and auto-scaling its unit, undo restoring a
format wipe through the real path, and the drag listeners properly unregistered
(`_cleanupMouseUp`). What was wrong was worth the pass.

### The plate-reader import corrupted data four ways, silently

All four in about six lines, and all found by pasting the shapes a real export has:

- **`l.split(/[\t,;]+/)`** — the `+` treats consecutive separators as one, so an **empty well
  vanished and every value after it moved one column left**, into the wrong well. An unread or
  masked well is normal in any export.
- **Comma in that character class** — a European decimal (`0,1`) was split in two, read as 0, and
  shifted the row.
- **`text.trim()`** — a first line whose A1 is empty starts with a tab, and trimming the whole
  string ate it, so the first row lost its first cell before anything was split.
- **The header heuristic** took an empty first cell for a header and threw the plate up a row.

And a fifth found while fixing them: a first row reading `1,2,3…n` is indistinguishable from a
column header. The rule that settles it is arithmetic, not cleverness — **if the grid is already
exactly as tall as the plate there is no room for a header, so it is data.**

The delimiter is chosen now (tab, else semicolon, else comma) and never collapsed; a comma is a
decimal mark wherever it is not the separator; blank *lines* are dropped without touching any
line's own start. Verified in both apps over eight shapes: full 96 and full 384 whose first row
really is 1…n, labelled export, partial labelled paste, blanks in every row, comma decimals over
tab and over semicolon, plain CSV, titled export.

**The same five were in Labbook**, because `plParseValues` is a line-for-line port of
`pdParseValues` — which this file has recorded since the port was made. That is the lesson worth
keeping: *a port carries the bugs too, and the note saying "ported from X" is the place to look
when X turns out to be wrong.* In Labbook they mattered more, because those values land on a
structured plate map that feeds Cmd+K, the Methods paragraph and every export.

### Popups that came out off the screen

- The Gel Designer popup clamped `py` at **both** ends and `px` only on the right. At 375px it
  never fits right of the cursor, so it flipped left and landed at **`left:-188px`** — 84 of its
  272 pixels on screen, text field off the edge. Measured now instead of guessed at 300×200, and
  clamped at both ends of both axes.
- The well tooltip clamped `left` against a hardcoded **200** for a box with `max-width:none` — a
  real well label makes it **466px** — and never clamped `top` at all, so hovering a well near
  the bottom put it below the fold. Both measured; capped at 260px.

The family is the one `#lb-tip` was already in: **clamp by the element's real edges, measured, on
both axes. A number written in the source is a guess about your own element that you never have
to make.**

### Three small-screen blocks, deciding the layout by file position

`@media` at 700, 640 and 720, written at different times. Below 641 **all three applied at once**,
so which rule won was decided by where it sat in the file rather than by what it meant —
**thirteen selectors collided that way**. It is how a deliberate 40px tap target ended up
cancelled by a `36` written forty lines lower, silently, for every button in the app.

Merged into one block, per property, keeping whatever was winning on screen — so nothing below
641 changed and the tap targets now reach 720 as well. **A blind reorder would have been wrong**:
`.sel-toolbar` was in both blocks and the 640 copy was the old full-height panel, so sorting by
width would have quietly undone the bottom-sheet fix.

And the bar's height became a rule rather than a value repeated per breakpoint: `.fmt-pill` and
`.tb-chk` join the existing token-driven `.top-bar … { height: var(--tb-h) }`. Verified: **15
controls, one height**, at 375 / 640 / 641 / 720 / 800 / 1024 / 1440 — 40 below the breakpoint,
32 above it, no horizontal overflow at any of them.

### The undo merged unlike things

`pdUndoTrack` coalesced on a 700 ms window alone, which cannot tell eleven keystrokes of one word
from two deliberate actions done quickly — and it dropped whatever was between them. Verified:
paint, then clear 320 ms later, and the painted state was unreachable.

The window is necessary and no longer sufficient: inside it the change must **also** be nothing
but well labels, which is the only continuous edit there is. **Derived from the two states rather
than declared at the call site** — the failure mode of a flag is that somebody forgets to set it,
so a new kind of edit is structural until someone deliberately says otherwise.

### Also, and not fixed

- **Right-click deletes the selected wells** with no menu and no warning. It is undoable, but
  everywhere else in the Hub right-click opens a menu. Left as it is on Jon's call.
- **`sendResultsToLabbook` in Echo still uses a native `alert()`** — the same smell as Blueprint's
  five, which are now `pdToast`. Inside dHUB a native alert is a browser dialog headed
  "localhost says", which reads as the page having broken.

## Fourteen icons, and the two that were the same drawing (2026-09-02)

Jon, on the Archive landing: *"CSS icons are a mess. re check all of them and create unique,
logic icons."* Rendered as a contact sheet — every card logo, every `WS_ICONS` glyph and every
`SUITE_ICONS` glyph, at 26px and at 88px — the mess is legible at once, and it is three kinds:

**Two pairs were literally the same drawing.** `Incubator` and `Cell Archive` were both the
concentric-circle dish, character for character; `SUITE_ICONS.incubator` was a house, which is
`WS_ICONS.home`. The rail's **Cells** entry was drawing that house, so the Hub's Home button and
its Cells button were the same glyph. The three-app lifecycle now reads as three things:
Incubator a **T-flask** (canted neck, cap, medium — the drawing the Incubator app already uses
for a culture), Lines a **microscope**, Freezer the snowflake it always was, and the rail's Cells
its own **cell with a nucleus** (`WS_ICONS.cells`).

**Three were drawn too small to survive their own size.** Protein Tools' peptide bonds were
**0.4 px long** — `x1="6.8" x2="7.2"` — so it rendered as three blobs; BCA was a bare squiggle,
its twin; Dora plotted a single dot on a curve. They are a chain with real bonds, a standard
curve with three points on axes, and a dose–response with the points it fits. Beacon's two equal
rings and a bar read as **spectacles**; BRET is directional, so it is a filled donor, radiating
arcs, and a hollow acceptor. Cadence's three bars were all flush left — a hamburger menu, not a
Gantt — and are staggered now. Blot's plain grid is a membrane with four **bands**. LDI's balance
had two open hooks for pans and now has pans.

**Three said nothing at all.** The antibody's two arms met at a point and read as a map pin (it
is a Y with its two binding sites); the primer was an unreadable squiggle, then, drawn as a
primer annealed to a template, read as a *table* — an oligo is one strand, its bases and a 3′
arrow; the plasmid's ring with two stray ticks now carries a feature arc with an arrowhead, which
is what stops a ring reading as a loading spinner. Journal was a second book, a twin of Labbook's
own logo, and is the dated day page it actually is.

`SUITE_ICONS.analysis` was Echo's bar chart with axes bolted on. The category is dose–response
fitting, so it is a curve through scatter points and Echo keeps the bars.

**Where an icon is shared, it is shared on purpose** — Archive's book is the same in the rail and
on its card, because they are the same thing. The two app headers that carried a copy of their
card logo (Incubator, Blot) were updated with it, or the app and its card would disagree.

## A tooltip leaves, and a question with two answers has no Cancel (2026-09-03)

Jon's screenshot of the **This step slipped** dialog carried three things, and they are two bugs
and a design error.

**A floating layer dismissed only by `mouseout` is dismissed by the one event that is not
guaranteed to fire.** `mouseout` never arrives on a node that has been *removed* — and that is
not an edge case: `setBlockDone` ticks the step, calls `renderAll()`, and *then* opens the
dialog, so the button under the pointer is destroyed and its tooltip is orphaned by
construction, every time. `#lb-tip` has one `hide()` now, called from `mouseout` as before **and**
from `pointerdown` capture, `keydown`, `scroll` capture, `blur` and `visibilitychange`, plus a
400 ms liveness check on the remembered anchor — the only thing that notices a removal, since no
input event covers it.

**The same shape was in five more apps.** Blueprint, Dora, Helix, LDI and Protein Tools each had
their own `.pinfo` tooltip, all mouseout-only, four of them clamping with
`Math.min(e.clientX+12, window.innerWidth-270)` and none clamping vertically — the guessed-edge
family already recorded for `#lb-tip` and Blueprint's Gel popup. One implementation now: anchored
to the icon rather than trailing the cursor, measured off-screen, clamped on both axes.

**A question whose answers are all actions is not a confirm.** `lbConfirm`'s second button means
*never mind*. Here both outcomes write something, so calling one of them **Cancel** said the
wrong thing about the answer you are most likely to want — and the explanation of what Cancel
really did then had to sit in grey type under the message, which is the tell. `lbChoose(msg,
{answers})` renders each answer as a row with what it does to the record underneath it; `.dlg-ans`
stacks and wraps rather than ellipsing like `.dlg-item`'s hint, because an answer's subtitle has
to be readable in full. Escape and the backdrop resolve to the answer marked `safe` — a modal
must always be dismissible without there being a Cancel.

The slip question is three answers: **Move the rest forward by N days** · **I did it on 02/09 —
I am only recording it now** · **Done today, and the plan stands**. The middle one is not the
no-op it looks like: ticking a step always stamps `completedAt = Date.now()`, so a step done on
the planned day and recorded late claims it was done today — which is what `dayPlan` anchors the
day's wall clock on, what the wait timers date from, and a column in the Steps CSV. It writes the
planned date at midday: the day is the fact, the hour is not.

**The question has a door.** `b.slipAsked` asks once per step for ever — right for something that
interrupts, useless if you answered it wrongly — so `ctxBlock` carries *"Reschedule the steps
after this…"* beside Snooze, calling the same `slipRest`, which also gained the `undoMark` it
never had despite moving every remaining step of an experiment.

The other 27 `lbConfirm` calls were swept and **none** converted: they are deletes, replaces,
imports and restores, where Cancel genuinely means never mind.

## What n = 3 actually means (2026-09-03)

`repSiblings` has existed since biological replicates were added, and its own comment says the
link between them is *"the thing statistics and a figure legend need"* — and **nothing ever read
it** but the header chip. The promise was recorded and never kept. `repResultStats(e)` is the
reader, and it only speaks when the experiment has numeric output, which is Jon's condition for
it existing at all.

Four rules, and each one is a way of getting the number wrong:

- **n is biological replicates, not rows.** Two plates of the same compound *inside one run* are
  technical replicates: they are averaged first, or an experiment run once on two plates reports
  n=2 and a confidence it has not earned.
- **Your exclusion drops the row; the fitter's flag does not.** The rule the results sentence
  already followed — only the exclusion is a decision about the science, so a flagged fit is kept
  and stays visibly flagged in the summary.
- **A bounded value never enters a mean.** `>10000 nM` is a curve that never reached its bottom;
  averaged as 10000 it becomes a potency nobody measured. It is counted, named, and left out.
- **A potency is averaged in log space.** Potencies are log-normal, and the arithmetic mean of
  1, 10 and 100 nM is **37 nM** — the middle of nothing. The geometric mean is 10, and the spread
  is a `×/÷` fold factor rather than a ± in nM. An effect in % is bounded and linear, so *that*
  one is an ordinary mean ± SD. This is the whole reason the feature is worth having in a
  domain-aware notebook rather than in a spreadsheet.

It surfaces in four places and adds no schema: a summary card at the top of the **Results** tab
(with every individual value beside the mean, so it can be checked by hand), the **PDF and the
Methods sheet** (`pdRepStats` — plain markup, because `repStatsHtml` carries live inputs), the
**publication sentence** (*"Values are geometric means of 3 biological replicates"*), and
**Replicate summary — CSV** in the Data picker.

Two things it must not do, both fixed after reading the output rather than the code: a pair whose
potency was only ever bounded **has no mean**, so it stays in the table and out of the prose —
*"the most potent were … (DC50 — nM)"* is a sentence about a number that does not exist; and the
compound and target counts in that sentence are counted **over the set being reported**, not over
the rows of whichever run happens to be open. The CSV also rounds to six significant figures:
`exp(mean(log))` reintroduces float noise, and the file said `5.000000000000001` where the screen
said `5.00`.

**Silence would have read as absence.** A replicate set where only this run has numbers shows a
dashed line saying the summary appears as soon as a second replicate has some — not nothing.

## What you need before you start (2026-09-04)

The night-before job, and the one thing here no rich-text notebook can do. A planned experiment
already knows every volume, plate format, cell line and construct it is going to consume,
because the parameters are typed — and the shell already knows where things physically are
(`cellsLineStats`, `ARCHIVE_LIB`, `HUB_FREEZER_*`). **Nothing joined the two halves.**

`openPrepSheet` takes a scope — `{expId}` for a whole experiment, `{date}` or `{from,to}` for
what is due — and both go through one derivation, because the unit is the *step*: the same
function answers "this run" and "Tuesday", which is the difference between a plan and a bench
list. Two doorways: the experiment header, and the day in the Journal.

**It is not the bench sheet, and the two must never be merged.** `buildLabSheet` is the run —
chronological, every step with its recipe, read *during* the experiment. This is the
deduplicated list of things, read *before* it, with where each one is. A reagent three steps
need is three entries there and one line here.

**`CALC_NEEDS` is a separate table from `CALC_KINDS`, deliberately.** It is the shopping list,
not the recipe: `compute` stays the single source for *how* to make a thing, and a kind with no
entry is reported as undeclared rather than silently contributing nothing — an empty list and an
undeclared one are different sentences. Where an amount is genuinely hard to attribute — the
per-plasmid ng of a NanoBRET run, which depends on the condition — the item is listed **with no
quantity** rather than a guessed one. "Take these three preps out of the freezer" is the useful
half; the nanograms are in the block's own table.

Three rules that were wrong first and are the substance of it:

- **Reagent is consumed per step; plasticware is not.** The plate you seed on is the plate you
  read, so adding the seeding step's 2 plates to the CTG step's 2 said you needed **5**. Within
  one experiment plasticware is the *maximum* any step asks for; across experiments it adds,
  because those really are different plates. Verified: one experiment 2, two experiments 2+3 = 5.
- **A name is not a missing amount.** The plate map and the header contribute names and never
  quantities, so marking the total "partial" because of them fired on almost every line.
  `nameOnly` separates "could not say" from "was never asked".
- **"Not tracked" is only worth saying where something *could* be tracked.** Reagents and
  plasticware have no home anywhere in the Hub by design, so the phrase beside each of them was
  a column of nothing. It survives for cells, plasmids and antibodies, where it is the useful
  half — *"anti-DCAF15 — not in the Library"*. And a cell line the shell has never heard of
  reads **"none in culture · no vials"**, not "not tracked": the shell *was* asked.

The sheet never says how much is left. This notebook does not do stock control, and a stock
figure nobody maintains is worse than none — the same rule the Archive Library was scoped by.

**Found while measuring it, and pre-existing:** `.blk-hd` and `.blk-title` are separated by a
comment, which makes them one **descendant selector** at (0,0,2,0) — so it beat the plain
`.blk-title` in the mobile block wherever they disagreed and the phone kept the desktop's 90px
floor. The step header then needed 366px in a 345px block and pushed the `⋯` **21px off the
screen** — the one control the mobile collapse puts every other verb behind. Confirmed against
the committed build before touching it.

## Labbook as the bench app (2026-09-04)

`python3 embed.py --profile=labbook-pwa` packages the notebook for a phone the way
`--profile=archive` packages the protocol library: manifest, icons, a service worker and an
unguessable slug — **`labbook-6b1d0c4f9a72`, which must never change**, because every installed
home-screen app is pinned to it. CI builds it, so it cannot repeat the Archive mistake of
existing only on one laptop behind a 404 its own service worker hides.

**The blocker was not the conflict rule — that was already decided.** `_applyRemote` keeps ours,
writes theirs into the version history tagged `remote`, and says so in a sticky banner with
Compare. A change made with no signal reconciles by exactly that rule; inventing a second one
for the offline case would be two answers to one question.

**The blocker was that `labbook-standalone` had no Firebase at all.** It reads `window.parent`
for the shell's, and standalone there is no parent — so a PWA built from it would have been an
island: everything ticked at the hood would stay on the phone. That is worse than no bench app.

**One seam: `lbFb()`.** It takes the parent's Firebase inside dHUB, exactly as before, and
otherwise initialises its own from `LB_FB_CONFIG`. Every consumer downstream — `hasCloud`,
`lbInitSync`, `_cloudPush`, `_applyRemote`, the status pill, `_attUpload` — is untouched, so the
two builds share one sync path, one conflict rule and one honest status pill.

- **`LB_FB_CONFIG` is injected by `embed.py`, never written into `apps/labbook/labbook.html`.**
  Same rule as the Archive PWA: the source file is not modified for a build. It also keeps the
  Bucket A promise (no shell globals, no URLs of its own) and the credentials out of the app.
- **`window.parent !== window` in that check is load-bearing.** In a top-level window
  `window.parent === window`, so the old condition would now find *its own* `firebase` — the SDK
  the build just added — and return a ref without ever checking sign-in. That is precisely the
  "Saved and synced" lie `hasCloud()` exists to prevent.
- **Signed out there is no cloud target**, because the `/journal` rules refuse every read and
  write, so `lbFb()` returns nothing and the pill reads *Saved on this device*. `lbAuthState()`
  names the reason — host · file · no SDK · signed out · signed in — and Settings → About leads
  with it and the one button that changes it. Inside dHUB it says *"The Hub signs you in."*
  rather than offering a second button that would fight the shell's.

**The service worker caches the app and never the data.** Archive can cache everything because
its content *is* the build; this holds a notebook that syncs, so anything reaching the RTDB,
Firebase Auth or Storage is excluded and fails honestly when there is no signal — a cached
answer to "what is in my notebook" is the one thing this app must not invent. Two mistakes were
made writing that list and both are worth remembering: a blanket `googleapis.com` also swallows
`fonts.googleapis.com`, which is how an offline launch silently loses its typography; and the
versioned Firebase SDK on gstatic is *static code*, so excluding it stops the app reconnecting
on a flaky connection. The local copy and IndexedDB are the offline store, exactly as in the Hub.

**Verified in real Chrome, with the server stopped**: the service worker registers and activates,
all seven shell entries precache, the app opens with the network unreachable, a step typed
offline persists, and **all 33 Archive protocols with their 24 calculators are there** (Gibson
still four stages, structured, not scraped). The in-app Browser pane cannot do this test — the
*committed* Archive PWA fails to register there too, so it is the pane, not the build.

**Not verified, and it needs Jon**: the Google sign-in flow itself. `127.0.0.1` is not an
authorized domain (only `localhost` and the Pages host are), and signing in needs his
credentials. What is verified is that the button is there, the state machine reports each case
correctly, and no ref is handed out until a session exists.

`tools/make_icons.py --app=labbook` renders the icons — Labbook's own notebook glyph on its
`--brand` blue, so the home-screen icon and the app agree. Archive's PNGs are byte-identical
after the change.

## Echo, audited (2026-09-04)

The flagship, 2.6 MB, the one app whose output *is* the result — and it had never had the pass
Blueprint got. Three silent defects, all in the path between a picklist and a published potency,
and none of them visible on screen.

**A failed transfer was read as delivered.** `_parseEchoCSV` never looked at the **Transfer
Status** column. Labbook's own picklist reader has honoured it since it was written — *"a failed
transfer never reached the plate; recording it would be a lie"* — and the flagship did not. The
well got no compound, so it reads like vehicle, and its intended concentration then sits on the
curve as a real point dragging the fit toward no effect. Same class as Blueprint's four, and the
reverse direction of the port: here Labbook was right and Echo was wrong.

**A well dosed by several transfers became several identical points.** The Echo emits one row per
*transfer*, so a dose built from several drops is several rows into one well. Each became its own
merged row, so that well was weighted N times in the least-squares fit **and** in the hook
detection, and appeared N times in the raw CSV. One destination well is one measurement: they
collapse to the last row for the well, which is the rule Labbook already follows, and where the
collapsed rows disagree about the concentration the log says so — that well received a
cumulative dose the fitter cannot represent.

**Nothing flagged an EC50 that landed on its bound**, and this is the one that reaches paper. A
curve whose midpoint is outside the doses tested still fits its own half beautifully: the
synthetic case returns **R² = 0.9967** and `DC50 = 0.0032 nM`, past the R² threshold, with no
replicate-SD flag and no hook. The fitter itself is not fooled — it reports a confidence interval
from 0 to 88 µM — but nothing read it. So a number the data cannot support was reaching the
results table, the publication sentence and, since the last pass, the replicate means, looking
exactly like a measured potency. `EC50<range` / `EC50>range` is a fact about the design rather
than a threshold, so it has no setting. Verified to fire on both sides and, importantly, **not**
to fire on a real potency sitting at the lowest dose tested.

**The 4PL engine is sound** — checked numerically rather than assumed, which also clears
Beacon's and Lumina's byte-identical copies. On clean data it recovers bottom 5, logEC50 −8,
hill 1, top 100 exactly at R² = 1; under ±4 noise it returns 9.5 nM with a CI of 8.4–14.2; hill 2
is exact; and off-scale it pins the bound and says so in the interval. `_4plVal4` is the decay
form `bot + (top−bot)/(1+10^(h(x−logEC50)))` and `_4plVal4_gain` the increasing one — reading
that backwards makes every parameter hit a bound, which looks like a broken fitter and is a
broken harness.

**Fifteen native `alert()`s became a toast.** Inside dHUB a native alert is a browser dialog
headed *"localhost says"*, which reads as the page having broken; this was already recorded as
an open item next to Blueprint's five. `echoToast(msg, kind)` is theme-aware, and an error wears
`--danger` rather than `--accent` — the shared blue every control already wears is not a mark.

**Noted and deliberately not changed** in `_parsePHERAstarXLS`: `parseFloat` on a text-formatted
cell truncates a European decimal (`1234,5` → 1234), and the reader always walks 16×24 whatever
the plate format, so a sheet with a second block below the first would pick it up as rows I–P.
Neither fires on the real PHERAstar exports this reads, both would need a real file to fix
against, and inventing one is how a parser gets a bug rather than loses one.

**Not verified: the full pipeline end to end.** It kills the renderer under browser automation —
and the *committed* build dies identically, in the in-app pane and in real Chrome, so it is the
environment and not the change. That smoke test is Jon's, on the bundled test data.

**Phase 2 — Lumina → an Echo mode, Beacon → an Echo assay type — is deliberately not in this
pass.** Auditing before consolidating is the whole reason the audit came first: two of the three
defects above are in the parser, and merging on top of them would have copied them into the
merged app exactly as the `pdParseValues` port did.

## The third copy of the same parser, and eight guessed edges (2026-09-04)

Jon: *"arregla los fallos que veas."* So this was a hunt rather than a feature — the known
failure families, run as greps over the shell and all nineteen apps, then each hit confirmed
against the committed build before it was touched. `tools/` gained nothing; the script is in the
session scratch, and what matters is the families, which are recorded here.

**Beacon's plate reader had the same four defects as Blueprint's — and a fifth.** This is the
third copy of a plate-reader parser in the Hub and nobody had read it since it was written.
`parsePlateCSV` collapsed its separators (`/[\t,;]+/`), so **an empty well vanished and every
value after it moved one column left**; it split on comma, so a European decimal became two
cells; it `trim()`ed the whole text, so a plate whose A1 is empty lost its first cell; and it
took an empty first cell for a column header, throwing the plate up a row. Measured against the
committed build, row A of a plate with A3 unread came back **`100,101,103,104,105,106`** — every
well from A3 on holding its neighbour's reading. A file whose first row is genuinely `1…12` was
rejected outright. The fifth is Beacon's own: **a well with no reading became `0`**, and zero is
a real number in a BRET ratio — an acceptor over a donor of 0 is Infinity, not "no data". It is
`null` now, which `getWellValue` already treated as "no reading". Blueprint's corrected rules
were ported deliberately this time, and the comment says so.

**Six copies of the `.pinfo` tooltip, not five.** The earlier sweep fixed Blueprint, Dora, Helix,
LDI and Protein Tools and **missed Echo**, whose copy sized itself with `const tw = 300, th =
120; // approx` and hid only on `mouseout`. It has the canonical one now.

**Eight popovers clamped by a number written in the source.** Echo's results-column menu (180×80,
really 165×76), Iceberg's storage right-click menu (170×90, really 150×72 — and it is the only
route to renaming or deleting a storage unit, so off-screen means gone), Lumina's well popup
(240×160, really 220×**204** — the height guess was 44px short, which is exactly how a popover
ends up below the fold), and four in Labbook: the tag popover, the `@`/`#`/`/` autocomplete, the
colour swatch — which measured its own height and guessed its width **in the same statement** —
and `popOpen`, the ⋯ menu every context menu in the app goes through. Labbook's four share one
`_placePop(pop, rect, opts)`.

**Iceberg's fix was wrong first, and testing is what said so:** it measured the menu *before*
`appendChild`, so `offsetWidth` was 0 and the clamp did nothing. An element that is not in the
document has no box — the same rule as the off-screen stage `_ON_*` inlining already relies on.

**And the accidental descendant selector is gone rather than merely out-ranked.** `.blk-hd` and
`.blk-title` separated by a comment is `.blk-hd .blk-title` at (0,0,2,0); last round matched the
mobile rule's specificity to fix the symptom, and it is now written on one line so the next
reader cannot be misled.

## The rail, redrawn (2026-09-04)

Jon, on the workspace rail: *"muchos CSS icons estan aun peor ahora… que sean bonitos y limpios,
que tengan sentido, simples."* Rendered as a contact sheet at 24 px and 76 px, the failures were
all one kind — **a glyph that reads as something else**, and the read only appears at the size the
rail actually uses.

- **Journal was a calendar.** A rect with two tabs on top and two ruled lines is the calendar
  icon, in every icon set there is. It is a notebook now: a page block with a spine down the left
  and three ruled lines — and distinct from Archive's open book, which is the other bound object
  in the same rail.
- **Data Analysis was a squiggle.** Three filled points sitting on a short curve merged into it at
  19 px. The shape *is* the meaning, so the points went and the curve is one clean sigmoid
  between two flat plateaus. Echo's own card keeps its bars.
- **Cells was noise.** A membrane with a nucleus and two specks read as dirt; drawn as an ellipse
  instead it reads as an **eye** (tried, rejected). Two overlapping circles each with a nucleus
  says *cells*, plural, and survives 19 px.
- **More apps was a wrench**, which says settings. It is a 2×2 tile grid — what "more apps" looks
  like everywhere.
- **Antibody, primer and plasmid** were the three added in the last pass and the three worst: a
  Y with circles on its tips is a node graph, a comb with an arrow is a sort control, and a ring
  with two heavy arcs is a loading spinner. Now: a Y with perpendicular binding sites, a short
  arrowed strand above its template, and a **complete** circle with one thick feature arc — the
  completeness is the fix, since the gap is what made it spin.
- **Incubator's T-flask** had its neck drawn as a thick stub with a floating tick beside it, which
  read as a spout with a flag. The neck is a real outlined tube now. It is the honest survivor of
  this pass: better, but at 19 px it is still an object with a canted neck rather than obviously a
  culture flask. A cabinet-with-a-dish was tried and reads as a **washing machine**.

Two things fell out of the audit rather than the drawing. `SUITE_ICONS.design` (two overlapping
photo frames) was reachable from nothing: `EXTRA_GROUPS`' `icon` field is read by no renderer —
the *More apps* landing draws a label and the app cards. That field and both dead glyphs are gone.
And the Incubator **app card logo is the same drawing**, so it moved with the suite icon; a card
and its rail entry disagreeing is the duplicate this file keeps removing.

## "localhost says" — the last of the browser dialogs (2026-09-04)

A native `alert()` inside dHUB is a browser dialog headed **"localhost says"**, which reads as the
page having broken; `confirm()` and `prompt()` are worse, because they also block the whole frame
while they are up and, in the two PWA builds, they are the operating system asking on behalf of a
page that looks broken. Blueprint's five and Echo's fifteen were converted in earlier passes and
the rest was left recorded as a smell. It was **76 more**: 52 alerts, 18 confirms and 6 prompts
across the shell and eleven apps.

There are none left anywhere in the Hub.

**Three shapes, not one.** A short failure is a **toast** (`hubToast`, and the same helper Echo
already had, per app). A long explanation is a **note** that stays up until it is read — the
file:// sign-in message is five lines and explains where to open the Hub instead. A question is a
**dialog** whose affirmative says what it does (*Erase* · *Delete* · *Thaw one* · *Freeze 3*),
with Escape and the backdrop always resolving to no, so it is dismissible without a Cancel.

**Every conversion splits a function.** `confirm()` returns a value; a dialog calls you back — so
`hubThawVial`, `deleteRack`, `deleteBoxFromDetail`, `clearAllData`, `libLocChoose`, `libAdd…`,
`pmapRemove`, `setPlateFormat`, `resetFigure`, `deleteMember` and `freezeCulture` each became a
question and a `_…Go` that does the work. The rule that made this safe to do 24 times: **the
callback is the only path to the write**, so a dialog that never resolves does nothing, and one
that resolves false does nothing. `hubAsk` with no DOM to ask with calls back **false** — never
assume yes when you could not ask.

Two things found while doing it:

- **`--danger` was never defined in the shell.** Three rules used it, including
  `.opts-action-btn.danger`, which is what *Reset app data* wears — so the one destructive button
  in Settings was drawing its "this is destructive" colour from a token with no value, and fell
  back to inheriting. Defined now in both themes, the same values Labbook uses.
- **Settings goes full-screen under 640px because it is a screen; a two-line question is not.**
  The dialog inherited that rule and filled a phone edge to edge, which reads as having navigated
  somewhere rather than as being asked something. `#hub-dlg` is exempt.

Iceberg's `clearAllData` also stopped asking twice. Two natives in a row was the old way of
saying *are you really sure*; one dialog that names what goes (**both −80 °C and Liquid N₂ —
every rack, box and vial**) says it better, and the affirmative is the one you have to press on
purpose.

Verified in the browser rather than by grep: Iceberg's whole add → rename → delete storage cycle
driven through the new dialogs (that flow is the *only* route to fixing a typo in a storage name);
Cancel, Escape and the backdrop each resolving false; prompt mode returning its text and `null` on
cancel; `only` hiding the Cancel; the shell's dialog in dark mode at phone width; and a toast in
each of the six apps that gained one.

## Labbook on a phone, second pass (2026-09-13)

Jon uses Labbook on his phone as the **installed PWA** — no dHUB around it — mostly at the bench:
follow the day's steps, tick them, run the wait, photograph the gel, and look things up. His brief
was *"nada se debe superponer, texto legible, navegación muy fluida, submenús completos"*, and a
real-life test at the end. Measured at 375px before anything was touched, the phone build was a
desktop laid out narrower, and one thing about it was structural.

**The PWA's Home was a room with no doors.** `body.lb-on-home`/`body.lb-dash` hide the ribbon, the
dock *and* the drawer button (the drawer would list nothing there), and the three surface leaves
lived in the tree inside that drawer. Inside dHUB the shell's `#ws-tabs` is the navigation;
standalone there was none. **`#lb-tabs` is Labbook's own bottom bar** — Home · Experiments ·
Journal · **+** · More — drawn by `renderMobileTabs()` from `renderPages()` on one predicate,
`_phoneTabs() = !lbHost() && _rbNarrow()`, so embedded Labbook never carries `body.lb-tabs` and is
untouched. **+** is `newExperimentFromAnywhere()` (a folder picker first, since `createExperiment`
needs one); **More** is a sheet with Search — Labbook's own spotlight had no opener a phone can
press — Week planner, Notes, the prep sheet for today, Export, Recover, Settings, Dark mode. The
drawer is one column (the tree on top as "where am I", the list below) instead of two 160px panes
that truncated every project to "Degrade…"; the standalone header is hidden under the bar and the
drawer carries the name; `--lb-tabbar-h` / `--lb-safe-b` / `--lb-timers-h` are the **bottom
stack** every fixed element adds to, and the timers are a bar docked on the tab bar rather than
246px cards at bottom-right. `viewport-fit=cover` is on the meta so the home-bar inset exists.

**Every menu is a sheet, and every dialog.** `popOpen` is the one seam every menu goes through
(`ctxAt` ×11, `plateMenu`, `openAddMenu`, `expTabMenu`, `expActsMenu`, `wkCtxBlock`); at phone
width it adds `pop-sheet`, clears the inline `left/top` a popover leaves behind (or the
stylesheet's `left:0;right:0` loses to them) and lets CSS pin it to the foot of the screen with
46px rows — `ctxBlock`'s tenth item, "Delete block", used to be clipped behind a 300px scrollbar.
`.modal` under 640 is a bottom sheet with a sticky title and footer, **every variant named**
(`.modal.wide`, `.pick`, `.prep`, `.plate-modal` are (0,2,0) and a bare `.modal{max-width:none}`
loses to them whatever the order), and the plate editor is the whole screen. Two things a sheet
meets that a popover never did: **the long press's release closes it** — a popover opens under the
finger, so the synthesised mousedown lands inside; a sheet is never under the finger, so it landed
outside and the document closer shut the menu before anyone saw it (the closer now skips inside
the same 700 ms window the click-swallow uses); and **the backdrop cannot be a `::before`** on the
sheet, because `.pop` carries `backdrop-filter`, which makes it the containing block for fixed
children (the `#pl-band` trap) — `#mobile-backdrop` is reused, with `_backdropTap()` ignoring the
click WebKit still delivers after the closer has acted.

**The bench tab.** What you do on a phone with an experiment is follow it, and the Dated sections
tab is the *plan*: a header the size of the screen, editable dates and titles, calculator inputs.
`EXP_TAB==='bench'` is the same blocks as they are run — grouped by day with the day's clock
(`dayPlanLine`), one row per step with a 26px tick, the name, the wait chip and its timer, a
camera and a ⋯, the recipe as computed, the plate, the text; past days that are finished start
folded (`BENCH_FOLD`, session-only like `DAY_FOLD`), today is open and scrolled to once per open.
`benchRowHtml(exp,b,opts)` is **one row builder shared with the Journal** — `dayDueBlocksHtml` is
a call to it — so the two surfaces cannot disagree about what a step looks like. On a phone it is
the default (`_defaultExpTab()`, in both `openExp` and `selectPage`, the two places an experiment
is opened); on a desktop it is a sixth tab and `dated` stays the default. Three gates had to admit
it: the `EXP_TAB` whitelist, the hand-written desktop strip, and `TABDEF`. Rows carry
`id="blk-<id>"` and the recipe `id="ccr-<id>"`, so `scrollBlk`/`openBlk` and `refreshCalcRecipes`
work there unchanged. **A step's photo is filed under the experiment, not the block**: `addFileTo`
accepts a `blk:` key and pushes to `b.files`, but the Files tab renders `e.files` only — a block
photo would have been stored where nothing shows it. The caption is prefilled with the step's name
and `phSave` stays on the bench instead of jumping to Files.

**The overlaps, each one rule.** The Journal navigator was 470px in a 375px pane (Day/Week fell
off the edge and the pane scrolled sideways): it is `‹ Sun 13 Sep ›` with the native date input
laid transparently over the label, and the Day/Week switch on its own row; the day header gained a
⋯ (`dayActsMenu`) because "Delete day" was hidden on phones with no route to it. The step header's
date input — 150px at the 16px iOS rule — squeezed the title to 55px; it is a label with the input
over it (`.blk-datewrap`). **Plate column headers overlapped** — "12.3 nM4.12 nM1.37 nM" — in the
preview *and* the editor, and on the desktop too: under a 30px pitch (40px in the editor) each
header spans two columns and they alternate between two rows, evens up aligned left and odds down
aligned right, with the space before the unit dropped (`_plHdrCell`, `_plHdrCompact`). The editor
**fits the plate to the box** (`_plFitWpx`: a 96 at 24px, a 384 at 11px — floors a finger can still
hit) instead of scrolling a 458px grid inside 291px; its panel is reordered on the phone (the
conditions you paint with straight under the grid, the fields for the selection, then the layout
summary, format and title last — `.pl-left{display:contents}` lets the sections be ordered) and its
six-button footer is Done, Undo and a ⋯. Home's week strip is one row of seven with a dot per
experiment — the pill's `border-left` *is* the dot. The type scale moves one step up under 760
(`--fs-1` 11 … `--fs-5` 16): 10px labels and 13px prose are a desktop read.

**Performance was three things that were not slow but were wasted.** `renderPages()` rebuilt the
journal day list — one `blocksForDate` per notebook day and a regex strip of every day's html — on
each `renderAll()` into a drawer that was closed; the list is `_renderPagesList()`, skipped while
the drawer is closed and built by `toggleMobileNav(true)` (not by `renderPages`, which resets the
ribbon's chosen pane). `renderDockPanels()` rebuilt three panels into an off-screen dock after
every editor render; it returns early while the dock floats closed. And **glass costs a
compositor layer per element**, and `.blk` is one per step: under `(hover:none)` `.blk`, `.exh`,
`#rightdock` and `.modal-back` go solid and the two fixed radial gradients behind everything are
off. Attachments load as they near the viewport (`hydrateAtt(root,{lazy:true})`, the seven
on-screen sites; the print and copy stages are off-screen, never intersect, await the Promise, and
keep the eager default), re-armed over the whole pane on each call because an observer keeps hold
of every target it was given. The Experiments search patches `.xv-list` after 120 ms instead of
re-rendering the surface per keystroke; `_phRotated` caches the rotated photo per angle (it was
re-rasterised on every pointermove of a crop); the tooltip ignores the `mouseover` a tap
synthesises; and the week planner's touch drag has a **direction lock** — a scroll that starts on
a chip scrolls, a sideways move drags — where it used to cancel every scroll that began on one.
Measured under 4× CPU throttling: open experiment 73 → 18 ms, tick a step 44 → 14, keystroke
45 → 12, plate editor 70 → 38, drawer 32 → 19.

**Two things found by measuring, not by reading.** A `body:has(.modal-back.open)` rule — the
obvious way to hide the FAB under a dialog — made **every `innerHTML` replacement in the app 6×
slower**: a `:has()` on body makes the engine re-check the whole subtree on every mutation. Eight
elements are watched for a class change instead (`body.lb-modal-open`). And a perf harness that
times only JS lies about layout: a render that flushes layout itself and one that leaves it dirty
cost the user the same frame, so the forced read is inside the timed region.

### The sweep is a script now: `tools/mobile_sweep.mjs`

Playwright (already a devDependency; WebKit installed too) emulates an iPhone — touch, DPR 3,
mobile UA — plants a deterministic notebook (8 experiments over 6 presets, two in the past, ticks,
a wait), drives **51 screens** (every surface, every tab, the plate editor, every dialog and every
⋯) at two sizes in both themes, and asserts what the eye would catch: nothing scrolls sideways, no
two fixed elements overlap, every row you tap is ≥44px and inside the viewport (a row scrolled out
of view inside its own sheet is reachable and does not count), no visible text under 11px outside
the plate grids, the three in-page audits empty, no console error — plus **a long press opens a
menu that is still open 800 ms later**, and **a tap on a menu item fires exactly once**. Then a perf
table under 4× throttling against a saved baseline. `--engine=webkit` runs the same sweep on
Safari's engine; `--embedded` loads Labbook inside an iframe (`tools/mobile_embed.html`) the way
dHUB hosts it; `--only=`, `--perf-only --reps=`, `--url=` for the built standalone. Baseline before
this pass: **691 findings** (78 clipped menu rows, 84 clipped placeholders, 5 sideways scrolls, 512
of 10px text, the long press closing its own menu). After: **0**, on Chromium and WebKit, source
and standalone, top-level and embedded. `tools/snap_compare.mjs` proved the breakpoint merge
pixel-identical at six widths before a single new rule was written, and shows the desktop changed
in exactly two places: the Bench tab in the strip, and the plate headers that overlapped there too.

**One phone block, one touch block, at the end of the file.** Eleven `@media` blocks decided the
phone from eleven places; the five 760 blocks were moved verbatim into one (they did not collide —
the move is proven pixel-identical), and the 720/640/560 rules are **nested** inside it rather than
widened: widening them would have re-laid-out tablet windows between 561 and 760px that nobody
asked about. The duplicated viewport copy of the step header's collapse went; the `@container`
rule on `.blk` is the one copy.

**Not done, and deliberately**: the three full-tree `JSON.stringify` per save and the 83 KB of
presets inside every save — per-record local persistence is a separate change; swipe between
days; the `black-translucent` iOS status bar. **Needs Jon**: the PWA on his iPhone after the push
(Home → the bar; an experiment → the bench; a long press → the sheet stays; a step's camera →
back on the bench; the plate map full-screen; no zoom on focusing a field).

## The phone had no session (2026-09-13, same day)

Jon, from the iPhone: *"no veo mis experimentos. no está la información que yo veo en el laptop."*
The bar, the sheets and the bench were all there; the notebook was not. Two causes, one of them
the whole story.

**Firebase restores a signed-in session asynchronously, and nothing in the standalone build was
waiting for it.** For the first few hundred milliseconds after load `currentUser` is null even on
a device that signed in yesterday. `lbInitSync()` ran at boot, asked `lbFb()`, got "signed out",
cached the answer as "no cloud" (`_lbFbRef=undefined`) and settled — and nothing ever asked again.
So the installed PWA synced only in the one session the sign-in button was pressed in, and every
launch after that showed the device's own copy: six seed projects and no experiments. **`_lbAuthWatch()`**
registers `onAuthStateChanged` before the first `lbInitSync`: it fires once at start-up with the
restored user (or null) and on every sign-in and sign-out; it drops the cached ref, forgets what
the cloud was believed to hold (`_cloudSeen=null` — null means "not yet known", `{}` would push
the whole tree over the real one), unlistens the old account's collections, and re-inits.
`lbInitSync` no longer settles while the SDK is present and the session is still unknown, so the
GC and the daily backup cannot run against a tree the cloud is about to replace. **A device that
holds nothing but the seed adopts the cloud whatever the timestamps say**: the seed is stamped at
first launch, so a phone opened *after* the laptop's last save had the newer `updated`, kept its
empty projects, and received the real experiments one by one under project ids it had never seen.

**And the only sign-in button was in Settings → About, on a Home that hides the ribbon.** A phone
that had never signed in showed seed projects with nothing in them and no word about it.
`homeSyncBand()` is the first card on Home when the device is not syncing and says which case it
is — signed out (with the buttons), no SDK (reload when online), signed in and fetching, signed in
and genuinely empty; **More** leads with *Sign in* while signed out.

**Google sign-in cannot be trusted on an installed iOS app**, and this is the part that needs
Jon. `signInWithPopup` opens Safari and never comes back (no browser to return to);
`signInWithRedirect` is used in standalone display mode instead, but Safari's third-party storage
partitioning is documented to break the redirect result when `authDomain` is on another site,
as `thehub-f80ae.firebaseapp.com` is from `github.io` — the fix for that would be serving the PWA
from Firebase Hosting under the same domain. So there is a route that needs neither: **email &
password on the same account.** `lbSetPhonePassword()` (Settings → About, on a signed-in machine —
the dHUB laptop, through the parent's `firebase.auth()`) links `EmailAuthProvider` to the Google
user, so the token carries the same email and the rules are untouched; `lbSignInEmail()` on the
phone is a plain API call — no popup, no redirect, persisted like any session. Verified that the
Email/Password provider is already enabled on the project (a bad-password probe returns
`auth/invalid-credential`, not `auth/operation-not-allowed`), so the whole of Jon's part is: set
the password once on the laptop, type it once on the phone.

**Also in this round, from the suggestions list:** a sideways **swipe on the Journal's day** is the
previous or the next day (touch only, pointer-based, `.pane-ed{touch-action:pan-y pinch-zoom}` so
the browser hands the gesture over; a text selection or an open sheet cancels it) — and the arrows
were found not to work after a day was picked from the drawer, because they moved `DAY_VIEW` while
the view showed `SEL.page`; **hold + for a photo into today's note** (`quickCapture` — the hold
arms it, the *release* opens the camera, because a file input opens only inside a real user
gesture on iOS and a timer is not one); and the **app icon carries the overdue count**
(`_updateBadge`, `setAppBadge`, a no-op where it cannot show). Deliberately not done: per-record
local persistence (a data-safety change for ~2 ms on this notebook), Web Share of the bench sheet
(needs a PDF blob the app does not make), and the `black-translucent` status bar (cannot be
verified without the device).

## A new protocol is data plus a calculator pane (T-REx stable line, 2026-09-15)

Jon's first protocol added since the migration to `PROTOCOL_DATA`: **Stable Cell Line —
Flp-In T-REx (HEK293)** (`trex`), from Alejandro Correa Sáez's sheet with the lab's own
changes written in as the protocol, not as notes on the side — **FuGENE HD, forward
transfection, 0.8 × 10⁶ cells per 6-well in 2 mL the day before.** The original's
Lipofectamine 3000 is mentioned once, in the preamble, as what it replaced.

What adding one takes, so the next one is the same shape: the entry in `PROTOCOL_DATA`
(injected through Python with `json.dumps(…, separators=(',',':'), ensure_ascii=False)`, which
round-trips the existing line byte-for-byte — verified before touching it), the `PROTOCOLS`
index row, a `detail-<pid>` pane with the three tabs and one `calc-box` per calculator (the
schema scanner reads the boxes, so a box title is what Labbook shows), the calculator
functions and a `generate<Pid>Steps()` that returns `[{label,bullets}]`, one line in the init
list, and the Methods sentences in `tools/protocol_pub.py` (re-run it; it re-injects). Day
offsets: day 0 is the first dated thing you do (seeding), not the thaw — the cells being in
culture is a precondition in the preamble, and a negative day is not something Labbook dates.

Four calculators, every total wearing `_ovx`: **seeding** from the user's own count
(suspension per well, medium to top up, and a warning when the suspension is too dilute to
fit the well); **the 9:1 co-transfection mix** by parts, with the plasmid volumes from their
stock concentrations — pOG44, Opti-MEM and FuGENE pool across wells, pcDNA5 does not, since it
differs per construct; **hygromycin B** as selection medium and as the 50–400 µg/mL kill-curve
series from one stock; **tetracycline** for induction. Checked by hand: 0.8 M ÷ 1 M/mL = 800
µL; 3.6 µg at 500 ng/µL = 7.2 µL; 12 µL FuGENE at 3:1; 150 µL of 50 mg/mL into 50 mL. Verified
through the bridge in the standalone build — `ARCHIVE_PROTOCOL` returns nine dated stages,
`ARCHIVE_CALC_SCHEMA` the four boxes, `ARCHIVE_COMPUTE` recomputes with overrides — and the
runtime + alignment audits are clean on the new pane at 1280 and 375 in both themes.

## One Steps tab, steps as numbered actions, and a crop tool that is one (2026-09-15)

Jon, on the experiment: *"me gusta más la visión de Bench, más limpia… añade el plate map a
bench, elimina dated sections… hay que simplificar labbook… prefiero algo más secuencial, bullet
point con las cosas claras que hay que hacer… quita las listas tick."* Plus the New-experiment
window ("más ancha, más elegante, homogeneiza letras y tamaños"), the header's Details that
opened and never closed, a crop tool "fully usable", and overlapping text on the Files rows.

**Steps replaces Bench and Dated sections.** The two tabs showed the same blocks twice — a card
the size of the screen per step, and the same steps as they are run. `stepsBodyHtml` is the
bench view with everything the card had folded into it: the experiment's plate map on top
(`+ Plate map` when there is none), the preset-stale and deviation banners, the calculator with
its **Inputs** folded under the recipe (`calcInputsHtml` in the row; `.bench .blk-calc
.cc-inputs` starts closed), a grip that reorders and the `.bench-row` as a drop target, and the
⋯ gained **Rename step…**, **Change the date…** (`lbPrompt` learned `type:'date'`) and
**Remove the calculator**. `EXP_TAB` values `dated`/`bench` alias to `steps`; `blkCardHtml`
and its card CSS (the `@container` collapse, the date-over-label trick) are gone. `_defaultExpTab`
is `steps` on every width. The step row is one line — grip · tick · name · wait · camera · ⋯,
all 28px — with the name taking the slack.

**A step is a numbered list of actions, and the why is a footnote.** Every seeded block
(43 in `PRESET_SEED`, `EXTRA_PRESET_SEED` and the step library) is `<ol>` of imperatives —
*prepare X · add Y µL · incubate Z h* — followed, where a reason was worth keeping, by
`<p class="lb-fn">` (small, grey, ruled). No `ul.lb-check` is shipped any more; one left in an
older experiment renders as plain bullets in the Steps tab. `_labBodyHtml` makes the bench
sheet's boxes from the `<ol>` now (footnotes and prose stay behind), and `_pubText` strips
`.lb-fn` the way it strips `pub-skip`. `_presetV10` refreshes untouched built-ins.

**The New-experiment preview was dirtying the stored preset.** `nmPreview` handed the preset's
own blocks (`list.slice()`, a shallow copy) to NB's `apply`, which wrote `minVolUL` into their
calculator inputs — so the stored copy differed from its seed stamp for ever and no correction
to the seed ever reached it. Deep copy now, and `_presetSig` ignores `minVolUL` so a notebook
already carrying the mismatch takes the refresh.

**The SPARK screen plate is Jon's.** `nbscreen96` draws his sheet: row A −ligand · mock ·
−substrate in fours, row B donor alone · acceptor alone · **DMSO** (his B9–B12 were empty; the
vehicle every compound is read against is the one addition), compounds from row C in
replicate × concentration blocks (3 points in duplicate by default → 12 per 96, shaded dark to
light), and the same shape on a 384 in eights. The calculator counts follow (76 pair · 4 · 4 ·
4 mock · 8 controls); every calculator in the preset and the `nbtx`/`nbsusp` defaults carry
**1.1×** overage.

**And the wording reaches the experiments that already exist.** Jon: *"aplica los cambios de
diseño a los experimentos que están en marcha o completados. No cambies fechas y setups, solo el
wording."* `_rewordFromPresets(before)` runs from `seedPresets` on every load (not flag-gated —
adoption carries this device's flags over a tree that has not had it; a block already reworded
compares equal and costs a string compare). It rewrites a block only when it can be **proved**
to be the preset's own text — its stored `b.tpl` filled with the setup still equals it, or, for
a block from before templates were stored, the *old* preset's block of the same title does
(`before` is the presets as they were before the refresh) — and touches nothing but `html`,
`tpl` and `pub`: no date, no setup, no calculator input, no tick, no note. A block you wrote
into is counted and left; the experiment's banner still offers it side by side. One alert says
how many, only when something changed.

Also: `.modal.nm` is 760px with a two-column field grid and one label style throughout (labels
in sentence case — uppercase turned *µL* into *ML*); `body.lb-lean .exh.open .exh-lean` kept its
Details button so the header collapses again, and `leanToggle` relabels Details/Hide details;
the Files row is a grid — thumbnail, name and facts, caption, then one row of actions — so the
actions column can no longer cross a wrapped name; the photo editor opens with the whole
picture as the crop (eight handles, clamped to the picture, Free · 1:1 · 4:3 · 3:2 · 16:9,
thirds while dragging), a single picture dropped or picked on Files goes through it, and
**Crop / edit** on a filed picture replaces the bytes under the same attachment id
(`editFilePhoto`).

## The PDF and the bench sheet, set as documents (2026-09-15)

Jon: *"they don't fit in the page (too big)… make them visually more pleasant and productive
and professional."* Rendered to real PDFs (`tools/pdf_probe.mjs` — Playwright, `page.pdf()` on
`#print-root` under print media, then rasterised) the cause was legible at once: every block,
day, step and plate carried `page-break-inside:avoid`, so anything taller than the room left on
a page jumped to the next one **whole** — a first page holding a header and a section title, a
day banner alone at the foot of a page, a last page with one line of footer. A six-page export
of a four-block experiment, most of it white. That is what "too big" looks like from the
outside. And the type was the screen's: 11–11.5pt body, pill chips, tinted cards, boxed prose.

Both stylesheets are set as documents now. **Breaks are avoided only where a break is wrong**:
after a heading, a day bar, a section title or a plate title (`break-after:avoid`), inside a
table row or a checklist item, and inside the plate grid itself — everything else flows. 10pt
body in the record, 11pt on the bench sheet, tables at 8.5–9.5pt with rules instead of boxes,
the recipe as a table under a thin blue rule, the header as filing › code › title › one line of
facts › the aim. Chrome 131+ prints **Page n of m** from the `@page` margin boxes; an engine
without them prints none rather than a broken one. Floating pictures are scaled from the
editor's column to the page (a picture placed at x=900 on a 1400px column was off the paper),
and the body is held open under the lowest one. The plate summary's range column no longer
takes 22% of the width to hold `A1–B4`.

## FuGENE follows the DNA, a screen preset, and a banner that fired on every push (2026-09-15)

Three things from one afternoon on the SPARK NanoBRET.

**The reverse-transfection mix asked for FuGENE as µL per well.** Every other transfection in
the Hub takes the reagent as a ratio on the DNA, and the volume per well *depends on* how much
plasmid the well gets — so a box holding 0.24 was a number copied from one design and wrong for
the next. `nbtx` takes **`fugeneRatio`** (µL : µg, 3:1 standard) and works the volume out from
the DNA a well receives — `_nbtxDnaNg`. Which is *not* simply acceptor + donor: **Jon's rule is
that when the donor adds 10% or less to the acceptor, the acceptor's own amount is the total** —
80 + 8 is 80 in the tube, since nobody tops a pair well down and nobody adds 1.6 ng. That number
is now the one target: the carrier top-up in `_nbtxConditions` (the mock gets 80, not 88), the
FuGENE, the Methods sentence and the prep sheet all read it. A block saved with `fugenePerWell`
is folded to the ratio that reproduces its recorded volume (`_nbtxMigrate`), so the µL it prints
do not move. Carrier DNA defaults to 1000 ng/µL.

**"Was changed on another device too" fired on every push, and stayed.** Two causes, both in
`_applyRemote`. Firebase raises the local event for our own write *before* the promise resolves,
and `_cloudSeen` is only updated in the `.then` — so the echo arrived while the record was still
"dirty" against its own previous value, and that is the conflict branch: a sticky banner and a
spurious `remote` version filed in the history, per push. And the fingerprints were
`JSON.stringify` of objects in two different orders: the cloud returns keys sorted, drops nulls
and stores an empty array as nothing, so the same record stringified locally and from a snapshot
never matched. `_cjson` is the canonical form (sorted keys, no nulls, no empties) on both sides,
and an incoming value equal to what this device already holds is nothing to apply and nothing to
dispute. A real conflict — theirs differs from ours and ours differs from what the cloud last
held — still raises the banner, verified by hand.

**`NanoBRET SPARK - Screen`** (`NB_SPARK_SCREEN96`) is the SPARK plate as a compound screen: one
pair (NL-DELE1(CTD) + HT-HRI at 1:10), every well transfected with it and carrying the HaloTag
ligand, the plate filled with as many compounds as it holds — 11 on a 96, 47 on a 384 — each a
block of technical replicates × a short series, and the NanoBRET controls (−ligand, −substrate,
mock) with DMSO in the last block. Reverse transfection with the ligand in the suspension on day
0; compounds on day 1, 4 h, then the read. The series is the setup's: **`setupAdd`** is the
fourth thing a curated preset can declare (after `setupHide`, `plateOn`, `layout`) — questions
its base type does not ask, appended by `setupFieldsFor`, answered into `e.setup` like any other,
shown as chips, and deliberately absent from the setup line (`_pubSetupText` walks the type's
fields; the preset's own Methods sentence carries them). The `nbscreen96` layout draws itself
from `topUM · df · nConc · nReps` and the format — a layout may now declare `formats:[…]`, which
`presetLayout` honours — and names its conditions through `_nbtxConditions` from the setup's own
strings, so the plate counts its wells into the mix table without a second vocabulary.

Found on the way: the plate numbers were invisible in the dark theme (dark ink over the dark
gaps between pastel wells, contrast 1.03 — light ink with a dark halo there now); `.ci-f.chk`
was a 44px row on a 30px input line, so every setup checkbox sat 7px above the field beside
it; `minVol` printed on the setup line as *"Smallest volume you will pipette (µL) 0.25"*
(`pubSkip`); and the runtime audit's dead-handler rule read `DELE1(` inside a plasmid name as a
missing function — it strips string literals first now.

## The first push, and the six generic names (2026-09-15)

Jon, the morning after the two-workspace push: *"¿qué ha pasado con todos mis proyectos? Ahora
solo hay nombres genéricos."* The cloud's `projects` root held the six seed projects; his real
ones (Multivalent Chemistry, SPARK NS…) were gone from every device, and with them every
experiment disappeared from the Experiments list — the list is built from the projects, so an
experiment whose project id is missing was simply not drawn.

**The mechanism, pre-existing and armed by the migration.** `_cloudDelta` treated `_cloudSeen
=== null` — "the first read has not landed yet" — as "diff against nothing" and sent the **whole
local tree**. Any `save()` in the first 1.2 s of a session, on a signed-in device whose first
read was still in flight, replaced every root in the cloud with that device's copy. The seed's
`_backfillPrefixes` save had been able to do this since the prefixes shipped; `_nbMigrate()`'s
boot-time save made it fire on every device once — including one that held nothing but the
seed. The seed device pushed its `projects` root over the real one; the laptop then read a
cloud whose `updated` was newer and adopted it, exactly as designed. The experiments were never
touched: they are per-record maps, and a seed device has none to push.

Four things changed:
- **Nothing is pushed while the cloud state is unknown.** `_cloudPush` defers on
  `_cloudSeen === null` (`_pushWanted`); `lbInitSync` makes the pending push the moment the read
  lands. `_cloudSeen` is then seeded **from the cloud** (`_cloudFingerprintOf(v)`), restricted
  to the keys this device holds — a record only the cloud has must stay out of it, or
  `_applyRemote` takes its `child_added` for our own write coming back and never applies it.
  The first push is a real diff: offline edits go up, remote-only records are left to the
  listeners.
- **A deletion is only sent for a key this device has held** (`_cloudHeld`). A record the cloud
  has and this device has never seen has not arrived yet; it was not removed here.
- **A projects root that orphans the cloud's own experiments is wrong, whatever its
  timestamp.** `_reconcileProjects(before)` runs after adoption: any project this device held a
  moment ago that experiments still name is put back by id, and said so. Ids, not names — every
  experiment re-attaches on its own and nothing on the experiments is rewritten.
- **An orphaned experiment is shown, not hidden**: a red *Project missing* group in
  Experiments with the way back written on it. And **Recover → Snapshots / Backup file → Projects
  only…** (`restoreProjectsFrom`) puts a project list back by id without replacing the notebook;
  it drops a seed placeholder only when nothing at all is filed under it.

**Recovery for the real notebook** is the *Projects only…* door on the laptop, from yesterday's
snapshot or backup file (`_snapRecords` counts projects, and six seed projects count the same
as six real ones, so today's snapshot may already hold the seed — take the day before). The
experiments were in the cloud throughout.

## Two workspaces, one file — Planner and Notebook (2026-09-14)

Jon: *"no me convence labbook… necesito algo más intuitivo, con partes más diferenciadas… un
experiment planner robusto (vamos por camino) y un cuaderno tipo OneNote sin fisuras."* Asked
what OneNote does that Labbook did not: **the hierarchy and the feel — ease of use,
straightforward**. Not the free canvas; the abandoned OneNote reimport already showed where that
work dies. The decisions, taken one at a time: two separate spaces · the daily note lives in the
Notebook as a page per day · columns on the left, not tabs on top · notebooks → sections → pages
→ subpages, no section groups · **every project is a notebook** · the UI stays English.

**Labbook is the Planner and the Notebook, in one file, on one engine.** The Planner is Home ·
Today · Week · Experiments — everything that existed, minus the note editor Today carried at its
foot. The Notebook is OneNote's shape: a notebook picker with the sections under it, the pages
column with subpages indented, and the page on paper. Rich text, attachments, sync, trash,
versions, undo, Cmd+K and the PWA are shared, so neither half is a copy of anything.

**The rail names the workspace; the column names the surface.** `WS_NAV` is **Planner ·
Notebook** where it was Home · Experiments · Journal, and Labbook's left column lists Home ·
Today · Week · Experiments *in both builds* — the 2026-08-22 rule that an embedded Labbook never
lists its surfaces is deliberately reversed, because the rail no longer does that job. Standalone
the switch sits at the top of that column (`_wsSwitchHtml`); the PWA's tab bar is Home ·
Experiments · Notebook · + · More, with Today and Week under More. `wsGo` still answers the old
ids (`home/exps/journal` → Planner, `labbook` → Notebook) so saved state and old links land.
`LB.ws` is **derived** from the node in `renderPages` (`lbWorkspace()`), never set by hand, so it
cannot disagree with what is on screen; `WS_LAST.notebook` is where the rail's Notebook returns
you, else today's Journal page.

**The notebook list is derived** (`nbList`): every Planner project is `'proj:'+p.id` with the
project's own name and colour, then `LB.data.notebooks[]` (general ones; the migrated one is
`nb_general`, "Lab"), then **Journal** (`'journal'`). No second record to keep in step, so a
project made in the Planner is a notebook here at once, and deleting a project takes its
sections and pages into the *same* trash entry. Sections stay in `generalSections` — the key
backups and the cloud already know — with `nb`, `color` (a key into `NB_COLORS`) and `order`.
Pages gain `order` and `level` (0–2): **OneNote's own model**, a flat ordered list where a deeper
level is a subpage of the nearest shallower page above it. A page moves with its subtree
(`movePageBefore`, `_pgSubtree`), a level can only be one deeper than the row before it, a
deleted parent promotes its children rather than taking them, and a restored page lands at the
end of its section at level 0 — its old slot has been renumbered since, and dropped into the
middle of someone else's subpages it would adopt them.

**Journal is derived from the day notes** — sections are months, pages are days with a note, and
today is listed before its record exists so there is always somewhere to write (`setNotebook`
creates it on the first keystroke, as it always did). Nothing migrated, so trash kind `day`,
versions, Cmd+K and `_verLabel` all still work. Today keeps steps · carried over · tasks ·
cultures · running and ends with a **Journal — today** card (`dayJournalCard`: the first lines
and *Open →*); the day-list pane that sat beside Today is gone, since the date navigator moves you
and Journal *is* the list.

**`_nbMigrate()` is idempotent per record and never flag-gated.** Cloud adoption carries this
device's flags over a tree that may predate the fields, so the only honest test is the record:
a section with no `nb` gets `nb_general`, a page with no `order` takes its place from the sort
the list used to draw it in, so nothing moves on the first load. It runs at boot, at the end of
`maybeSeed`, and on adoption beside `_backfillPrefixes`.

**The node**: `{kind:'nb', projectId:<notebookId>, sectionId}` — the `projectId` slot carries
the notebook id so `nodeEq`, `secLeaf` and `selectNode(kind,a,b)` keep their shape; read it only
through `_nbId()`. `selectNode('general',…)` still works: it is aliased into `openSection`.
Column 1 reuses `#pane-sec` (`renderNbColumn`), column 2 `#pane-pages` (`_renderNbPages`); no
pane was added, so `_paneWidths` and the splitters are untouched.

Things that had to be right rather than merely present:
- **`lb-nb-nopage`, not `lb-dash`**, hides the ribbon and dock on a Notebook list: `lb-dash` also
  hides the phone's drawer button, and the drawer is how a phone reaches the pages. `lb-nonav`
  (set when neither the column nor the list drew anything) is what hides that button now.
- **A title keystroke patches the row in place** (`setPageTitle`); `setPage` re-renders the pages
  on every non-html field and would take the caret with it. A title is stored empty and shown
  as "Untitled" (`pgTitle`) — a page literally named Untitled has to be deleted before typing.
- **Enter in the title lands the caret in the body** (`_nbFocusBody`, inside the first paragraph
  — before it, the text arrived outside the `<p>`).
- **A sheet opened from a row inside the drawer covers the drawer** — an iOS action sheet over
  the list it came from. The sweep's fixed-overlap rule now exempts `.pop-sheet` for that reason;
  it is modal and has a backdrop.
- **The pages list keeps a chevron gutter on every row** so titles line up whether or not a
  page has subpages; the first version put the chevron over the title.
- **Backlinks** (`_backlinksHtml`): an experiment's Info panel lists pages and day notes whose
  html carries `data-exp="<id>"` — the notebook side of the join, read rather than stored twice.
- Roots have no live listener (`_cloudListen` attaches maps only), so a notebook or section made
  on one device reaches the other on reload — pre-existing, unchanged, now stated.
- The week planner's header was the `margin-left:auto` idiom again, found at 900px by the
  desktop audit this pass added; it has `.wk-left` and `space-between` now.

Verified: `audit_app --xref`, `check_css`, `check_js`, `check_shared` clean; the runtime and
alignment audits clean over Home, Experiments, Today, Week, an experiment, a page, a Journal
page, both empty states and both menus at 1440/1180/1024/900 in both themes; the phone sweep
(62 screens now — Notebook, page, section, Journal, project notebook, the drawer, the picker,
and four menus) at **0** on Chromium, WebKit, embedded and the built standalone; the five
profiles rebuilt. Not done: a pixel diff of the Planner against the committed build — the sweep's
seed now creates pages, so it cannot run against a build without them; the desktop audit and
screenshots stood in.

## Where the time went, and where it stops going (2026-09-15)

Jon asked for a walk through Labbook as a user — a flow diagram and the points that cost time
without giving anything back. Fifteen came out of the code and the live standalone; all are
fixed here. The report is the artifact *Dónde pierde tiempo Labbook*.

**Every day.** The Home chips looked like checkboxes and only opened the experiment — the box
is a real tick now (`setBlockDone`, which already existed). Today drew every due step in full
(recipe table, prose, notes: four screens for two experiments); due rows are one line and open
on click like carried-over ones (`benchRowHtml` `opts.fold`, `DUE_OPEN`, `dueToggle`; a lone
step for an experiment opens by itself). The last tick used to flip the experiment to `done` in
silence — `askOutcome` is asked once from the tick, skippable (`e.outcomeAsked`). A planner task
not done on its day vanished (`tasksForDate` is exact) — `tasksCarriedTo` lists it under the day
with its date, and its ⋯ has *Move to this day* / *Dismiss*. The slip dialog fired per step;
`_SLIP_ANS` remembers the session's answer per experiment and applies it to the siblings.

**Every experiment.** One door: `newExperimentFromAnywhere` — inside a folder it opens there, with
one folder in the notebook it opens there, otherwise it asks; a project with no folder is offered
as-is and gets "General" made for it on pick. It is the **+ New experiment** button on
Experiments, the link on Home's empty Running card, and `⌘E`. The modal takes its target as a
parameter (`NM_TARGET`) and navigates only in `finish()`, so Cancel leaves you where you were.
The head is preset + date + setup; code, tag, title and aim fold under *More details* and the
footer (fixed, with the code echoed beside Create) no longer sits below the fold. The weekend
warning has *Skip weekends* (`_skipWeekends`: a block on Sat/Sun goes to Monday, later blocks
keep their gaps; the preview shows the moved dates) and *Start on Monday*. *Repeat as replicate*
and *Duplicate* are on the row menu in Experiments; **Duplicate is a fresh plan** now — dated
from today, nothing ticked, its own code (`_dupCode`), and `_freshRecord` drops verdict, results,
files and observations, which a replicate also drops. A calculator input the setup wrote wears
*from the setup* (a button to Edit setup) or *yours · setup says N* (`_setupTag`).

**Chrome.** With an experiment open on a desktop the folder list beside it is gone
(`body.lb-exp-open`) and the header walks the folder with ‹ n/N › (`_folderSiblings`); the dock
hides where nothing is open (`body.lb-dock-idle`) and *Info* — which repeated the header — is
*Linked from* (backlinks only). The header keeps ⋯ · What you need · Bench sheet; close, repeat,
duplicate, delete and PDF are in the ⋯ or the one Export at the foot. *Meeting / Note (no code)*
is gone from the folder's + menu (it points at the Notebook; old records still render), and the
Observations placeholder states the rule: the step for what happened in a step, Observations
for the run, the Notebook for everything else. The week chip's step name takes two lines
instead of ellipsing at twelve characters.

**Shortcuts** gained a *The day* group: `⌘E` new experiment · `⌘⇧J` Today · `⌘⏎` tick the step
under the cursor (tick only, never reopen; on a done step it moves to the next undone) · `⌘⇧S`
start the wait · `⌘O` open by code (`openSpot({only:'exp'})`). Chosen around what a browser
keeps: ⌘N, ⌘T, ⌘W and their ⇧ forms cannot be taken by a page.

## Planner and Journal — the Notebook hierarchy went (2026-09-16)

Jon, one day after using the OneNote-shaped Notebook he had asked for: *"¿por qué el notebook es
tan complicado? Journal, donde se pongan las acciones del día con proyecto + link al experimento
y una anotación, y aparte anotación general con @."* Right — notebooks → sections → pages →
subpages was four levels of filing for prose that in a lab almost always has a date, and what
has a date already had a home. His three calls: Journal **plus a flat list of Notes** for what
has no date; the existing pages **go to the day they were created**; and the day's lines are
**written from the ticks**, not typed.

**Panel A is the Planner, unchanged. Panel B is the Journal**: one column — the days (today
first, then every day with a note or a ticked step, under month headers), then **Notes**, flat
(`notesList`, newest edit first, `+ Note`) — and the page. The rail says Planner · Journal; the
phone tab too. The node is one shape, `_jrNode()` = `{kind:'nb', projectId:NB_JOURNAL,
sectionId:null}`, and `SEL.page` is a date (a day) or a page id (a note) — `_isDateKey` tells
them apart. No notebook picker, no sections, no subpages, no page drag, no colours; `openSection`
and `openNotebookWs` survive as aliases into `openJournalWs`.

**A day page writes itself.** `doneOnDay(D)` is every step whose `completedAt` falls on D,
grouped by project → experiment in the order they were ticked; `doneTodayHtml` draws it as
project · code · title, then `10:42 · Transfection mix · [what happened]`. The line is a new
one-line field, **`b.log`** (`setBlockLog`), and it lives on the step: the Steps tab shows it
under a ticked row, the PDF prints it in italics above the recipe, and Cmd+K indexes it.
The Methods paragraph deliberately does not carry it. Under that, the day's free note as before,
with `@` (experiments, protocols, antibodies, plasmids, pages) and `#`.

**`_journalMigrate()`** is idempotent per record and never flag-gated, like `_nbMigrate`: it
makes the one `sec_notes` section (`NOTES_SEC`), appends every page in any other section to the
day note of its creation date (a seminar to its own date) as `<div data-frompage="id">` with the
title as a heading, deletes the page and every other section, and empties `notebooks`. The
marker is what makes it safe across devices: a day note arriving from a device that already
migrated carries the page, so the copy here is dropped rather than appended again. A trash
restore of a page lands in Notes; of a section, its pages go through the migration.
`maybeSeed` had to learn that the Notes section is not a sign of a used notebook, and no
sections are seeded any more.

**What went wrong on the way, so it is not repeated**: pruning the orphaned notebook code with a
brace-matching deleter driven by the audit in a loop deleted 150 live functions — the deleter
misjudged one span, the audit then saw everything as orphaned, and the loop obeyed. The file was
restored from git and the whole Journal patch replayed from one script. The prune now runs one
function at a time, parse-checks after each, refuses a deletion over 60 lines, and stops when a
round reports more orphans than a cascade can explain. `tools/mobile_sweep.mjs` drives the
Journal screens (journal, note, day, empty, drawer, both menus) in place of the Notebook ones.

## Every app re-audited, and a step that quotes its own numbers (2026-09-16)

Jon: *"re-audit las otras apps y la identidad visual de cada una y del colectivo… textos, alineados,
tamaños, espacios vacíos, móvil; una sugerencia de contenido por app."* All 18 apps at 1440 / 1024 /
375 in both themes, at rest and on 35 working screens, through the runtime and alignment audits plus a
text-size / clipping / tap-target pass, then every sheet read. The report is the artifact *Auditoría
visual dHUB*; the harnesses (`sweep.mjs`, `sweep2.mjs`) lived in the session scratch.

**Two headers had been corrupt since 2 Sep.** The icon pass (91eeb03) replaced a logo SVG that also
appears in the shell's home cards, and the replacement carried the card's context along: Incubator's
and Blot's `<header>` held `card-name">Labbook` and whole neighbouring cards. dHUB hides app headers,
so it never showed; standalone, both apps were titled Labbook. **Verify a multi-line replacement
against the file it lands in, not the one it was copied from** — and load the standalone page.

Fixed across the set, one rule each: Echo's phone setup footer put *Run Analysis* 109 px past the
edge; Dora probed five sibling `.xlsx` on every open (five 404s against Pages from a `srcdoc` frame);
Echo opened on a brochure (Data Analysis is first now); BCA's heatmap was a fixed near-white canvas (a
white block in dark mode); Lumina's modal had 640 px of fixed height; Beacon's "Fit results" was a
blank canvas; Helix said *No valid sequence.* on an empty form; Cell Archive's micrographs — "the
reason the tab exists" — showed a third of each at 130 px (whole frame at 220, click to enlarge);
Cuppa had two gears; the header logo is the card's SVG in all 18 (BCA, Cell Archive, LDI and Cuppa
were text or emoji); one 14 px ⓘ badge everywhere (four apps used an 8 px superscript); the last
glyph icons (◑ ☼ ⚠️) are SVG. **Still inconsistent, deliberately left for Jon**: the header's right
side — gear vs. theme switch vs. "? Help" vs. a sun that means *theme* in three apps and *keep awake*
in Archive.

**Labbook, from the same afternoon.** The experiment banner has no ⋯: every action is an icon+label
button (`expActs`), grouped by rule, folding to icons under 700 px of banner via a container query,
all nine visible on a phone. `.pop-item .pop-l` never shrinks — the hint gives way (it was truncating
*Update text…* to "U…"). The folder list stays beside an open experiment (`lb-exp-open` is gone).

**A step quotes its calculator.** `CALC_VALUES[kind](v)` declares the numbers a step may quote,
formatted as spoken; the prose holds `{{c.dnaUL}}`; `fillCalc` resolves it into a non-editable
`span.cv` wherever the block is drawn (Steps, Journal, PDF, bench sheet, `_pubText`, Cmd+K) and
`_unfillCalc` writes the span back as the token in `setExpBlockHtml`, so **the stored html always
carries tokens** — every "is this still the preset's text" proof works unchanged, and
`refreshCalcSpans` updates the sentence live from `calcUpd`. All 36 preset blocks and 12 library steps
are numbered procedures now (`_presetV11`); the reword pass carries them into existing experiments
where the proof holds. `fillSetup` leaves `{{c.*}}` alone because its regex is `\w+` and the key has a
dot — that is load-bearing.

## The report is a protocol (2026-09-16, afternoon)

Jon read the exported PDF page by page and the app around it. What was wrong, and the rule that
replaced it — every rule holds in the app as well as on paper:

- **Export PDF is a dialog** (`openPdfExport`): tick boxes left, the printed page right, laid out
  at page width and re-rendered as the boxes change. `PDF_DEFAULTS` / `PDF_FIELDS`; `buildPrintDoc(o)`
  takes the options and `_pdPost` strips what is off — checklists, rationale (`.lb-fn`, `.cc-note`,
  `.cc-rule`), the well-by-well plate list, an empty map, an empty "Results" heading, and the Methods
  paragraph's prose plate section when the map is on the page. The choice persists in `lb_pdf_opts`.
- **A plate prints so it can be read.** `printPlateHtml`: a block whose wells all say the same thing
  (a control) is one cell — number large, flag under it; a dose block keeps every well printing its
  concentration, outlined, with a key under the legend naming each outline. `_plateTitleTrue` reads
  the title's numbers off the wells. In the app, `plateNumberBoxes` never merges across compounds or
  over a well with a concentration (that was the "1" across two compounds), dose blocks are outlined
  and captioned (`.pp-gl-dose`, `.pp-conc`), and a map with dose blocks grows with its room.
- **A step is the procedure, not the reasoning.** Recipe notes fold behind "Why these numbers"
  (`.cc-fold`); the bench sheet drops them; a series spike prints no total; the "placeholder — set it
  to your kit lot" sentences are gone. Watch for seed html written as `'…'+'…'` concatenations: a
  regex on the first literal leaves the rest appended (that is how a rewritten block came out with
  its old tail).
- **The setup is a table** (`.exh-setup-g`: question over answer, one cell each) under a ruled row
  with Edit, shown on Steps too; the banner's action row has air under it.
- **Pictures reach every device.** `lbStorage()` looked only for the parent's Storage — in the PWA a
  bench photo was "no storage configured" for ever. It takes the app's own Storage when there is no
  host and is never cached as "none" before the session is restored; the sweep runs after sign-in.
  `attachments` moved from `_CLOUD_ROOTS` to `_CLOUD_MAPS`: as a root, two devices attaching in one
  day overwrote each other's `{id:{url}}` table and nothing listened; per id it arrives live and
  `_applyRemote` loads any image on screen that was waiting for it. Not verified with two signed-in
  devices — that test is Jon's.
- Every app header ends in the same gear (the shell's SVG) opening a panel with the Dark-mode switch.

## The eighteen suggestions, applied (2026-09-16, evening)

The audit report carried one content suggestion per app; Jon asked for all of them. Fabricata is
retired to `old_stuff/` (18 apps in the personal build now). Echo lost its brochure tab, Helix its
Vector Library (Archive → Plasmids is the one place a map is drawn), Protein Tools its Guide, Cuppa
its Members tab and banter. Dora and LDI read Echo's fitted history (`journal/echo`, else this
origin's `localStorage['eda_history_v1']`) — LDI pairs two analyses by compound. BCA sends its
sample sheet to Labbook through a new `tables` channel on `dhub:context` (`e.integration.tables`,
drawn on the Results tab and in the PDF by `tablesHtml`); Blueprint sends its plate as
`ctx.plate`, which becomes `e.plate` (asks before replacing one). Iceberg prints a box map;
Cell Archive's list has medium and doubling time; Archive cards say stages · days · calculators;
Lumina's setup is inline beside the plate (ids kept, `closeSetupModal` is a no-op); Beacon's demo
gives Z′ 0.94; Ribbon's palette panels wait for a structure; Incubator's filters wait for a
culture; Blot's text tools appear while a label is edited.

**Later the same evening: Cadence retired too** ("no lo uso para nada") — `old_stuff/gantt/`, out of
`embed.py`, `APP_INFO`, `ALL_APP_IDS`, `PUBLIC_APPS`, the Design group and the search index. 17 apps
in the personal build. And **Settings → Lab is one list**: per app, the dot and name, the code word
a visitor types (or *admin only*), and the visibility switch — `.lab-app-row`, in `buildLabPanel` —
where it was a list of switches and, under a divider, the same apps again with their codes.

## Export by scope, Visualize, and a bench sheet with a clock (2026-09-16, night)

Jon: the Journal's exported sheets lost the day's experiments; export whole blocks (a month of
Journal, all of it, a project, a folder); a **Visualize** workspace after Journal with charts and
statistics of the experiments; and the bench sheet remodelled from scratch. Options were put to
him first — the choices below are his.

**A Journal day prints what the page shows.** `buildPrintDoc`'s day branch printed the note and
the full body of every block *dated* that day, and not the section the page leads with — **Done
that day**, written from the ticks. `_pdDayHtml(D,o)` mirrors `renderDayPage`: done that day
(project › code · title, then `HH:MM · step · log`), planned that day (a box for what is not
done; a tick and the date for a step done on another day), then the note. The day now goes
through the export dialog like an experiment; `openPdfExport` no longer short-circuits when no
experiment is current.

**Export has a scope.** The Export PDF dialog opens with *What to export* — this experiment ·
each project (the whole project, then its folders, as one optgroup per project so a folder's
option is its own name and fits a phone's select) · all experiments · one day · a month · the
whole Journal. `pdfScopeDefault()` derives it from where you are; `pdfScopeExps(scope)` and
`pdfScopeDays(scope)` are the two readers; `_pdBulkHtml` prints a cover with an index (code ·
title · start · status · outcome) and then each experiment on its own pages, exactly as it prints
alone (`_pdExpHtml` is the single-experiment body, extracted); `_pdJournalHtml` prints the days
under day headings with a month heading where the month changes. The preview shows the first 4
experiments / 10 days and says so (`_pdfxCapText`); the print carries all. `PDF_FIELDS` gained a
fourth element — which scopes a box applies to — so a Journal export offers only rationale,
checklists and the log. The scope is never persisted; the boxes are. The **Data** picker offers
the same scopes: a JSON **bundle** (`{_lbBundle:1, experiments:[…]}`, each entry the same envelope
`buildExpJSON` writes) and results / steps CSV across a folder or project; `importExpFile`
recognises a bundle and lands every record in one folder through the same `_landImported` the
single import uses (new ids, suffixed codes, provenance).

**Visualize** is the third workspace — `WS_NAV` entry after Journal, kind `viz` in Labbook,
`lb:go view:'visualize'`, the standalone's column switch is Planner | Journal | Visualize (the
inactive segments show their icon only, or three do not fit a 130px column), the PWA's More menu
and `⌘⇧V`. Everything is derived from what the record already holds — `vizDataset()` filters
coded experiments by project, type and range (30 · 90 · 365 days · all; an experiment is in the
range when any of its days overlaps it, the report's rule) — and drawn as **SVG in place, no
library**: Chart.js exists only inside Echo and the standalone and the PWA must stay lean.
Panels: headline tiles (experiments · running · completed · success rate = worked ÷ verdicts
given · steps ticked · measurements · overdue); an **activity heatmap** (a cell per day, one hue
in five steps, the cell size growing on a short range so it is not a stamp in the corner of the
card); **rhythm** (started vs closed per month); **portfolio** (a stacked bar per project by
status) and **verdicts** (per type, worked · partial · failed · inconclusive · a hatched *no
verdict*, with % worked); a **timeline** (a bar per experiment from first to last day, filled to
its progress, a red dot on each overdue step, a today line); and the **potency landscape** —
every measurement Echo sent, by compound against its target on a log axis, flagged hollow,
excluded struck, bounded as an arrow, the geometric mean with its ×/÷ spread where n ≥ 2, target
chips, and a compound × target table of geometric means when there is more than one target.
Statuses and verdicts wear the state tokens; targets take a fixed eight-slot categorical order
(the ninth is grey). Every mark carries `data-tip` and `data-go`: hover is the tip, a click opens
the experiment or the day, or names the experiments behind a segment in the list at the foot
(`VZ._picks`, `vizGo`). On a touch screen the first tap shows the tip with *Open →*, the second
goes. Two things the audits found: `color-mix()` in an inline style is a colour the runtime
audit cannot read (`_vzMix` resolves the hue in JS for the heat table), and a count inside a
segment needs its ink chosen by theme — white on the light theme's saturated fills, ink on the
dark theme's pastels, and the grey segment the exception both ways.

**The bench sheet is a run sheet.** One day per page (`.lb-day+.lb-day{break-before:page}` is
the one deliberate hard break; everything else flows by the 2026-09-15 rule). The day bar names
the day and carries the clock: `Start __:__ · 3 h 05 of waits · finish ≈ start + 4 h 05`, or
the real times when the day is already anchored on a tick (`dayPlan`'s `anchoredOn`). Under it a
**What you need today** box — `prepNeeds` over that day's blocks with a bare `{id}` stub for the
experiment, so the header's own names are not repeated — two columns, amount bold, location in
grey where the shell answers. Each step is a box and its number in the margin; the title row
carries its place in the clock (`start + 2 h 15`, absolute when anchored) and a `done __:__`
field; the actions are numbered boxes `3.1, 3.2…` with the calculator's amounts bold (`.cv`
kept as `<b>`); the recipe table under them; a dashed **then wait 1 h → next step at start +
1 h** line between steps. An empty plate map no longer prints as a grid of empty boxes
(`_labPlateHtml` applies `pdPlate`'s test). Not chosen by Jon: writing lines, a day sheet across
experiments, a preview dialog.

Verified: the day, month and project exports and both bench sheets rendered to PDF with
Playwright and read page by page (project: cover + index, one experiment per page, 7 pages for
5 experiments); the Visualize screens and both PDF dialogs through the runtime and alignment
audits at 1440/1180/1024/900 in both themes; `tools/mobile_sweep.mjs` gained `visualize`,
`visualize-drill`, `dialog-pdf` and `dialog-pdf-day` (and its seed gained results and a
verdict) and is at 0; `check_css` / `check_js` / `audit_app --xref` / `check_shared` clean; the
rail renders Planner · Journal · Visualize and `lb:go` lands on the workspace.

## The sheets, set in grey — and the reword that a tick had blocked (2026-09-17)

Jon, on the printed bench sheet: too big, too saturated, has to work in black and white, no
start time, and *"los protocolos siguen teniendo listas como 1.1 Pair mix and mock made"* when
the presets had been numbered actions for two days. Plus: write the cell-suspension step
properly, the report as lean, and the *Drag a step in* strip is gone (*"no aporta nada"*).

**The tick lists were still there because the proof compared two serialisations.** The seed
writes `&ndash;`, `&minus;`, `&deg;`; a block that has been through the DOM — every tick on a
checklist goes through `_blkChecklist` — comes back with the characters. `_proseOnly` compared
the strings, so the reword pass of 09-16 skipped every block Jon had already ticked (steps 1
and 2, ticked on the 15th) and took the two he had not (3 and 4, ticked on the 16th, after the
pass). It now round-trips both sides through a `div` and strips the list-item classes and the
calculator spans, so a difference is a difference in the words. Reproduced with the 27c1e44
block text, ticked, then `seedPresets()`: proof holds, block reworded. The same function backs
`_expBlockUntouched`, so the *See what changed* banner had the same blind spot.

**The NanoBRET blocks are written as what you do** — `nbsusp` gained `volTotal`/`cellsTotal` so
the step can say *prepare 9.5 mL of suspension at 0.222 M/mL · set 396 µL aside for the 4
−ligand wells · add 9.11 µL of ligand to the remaining 9.1 mL · seed 90 µL per well*; the mix
step is *prepare 4 mixes as in the table below · FuGENE straight into the liquid · 10–15 min ·
dispense 10.32 µL per well*. Untouched presets refresh by signature; the reword pass carries
the words into existing runs where the proof holds.

**Both documents are greyscale by design.** Every blue is gone from `PRINT_CSS` and `LAB_CSS`
(the day badge, the section rules, the recipe's left rule, the code); `_printTint` takes each
plate colour at half strength on paper so the number, the outline and the legend carry the
layout on a black-and-white printer; the app's `.pd-recipe` rule (an accent left border, meant
for the Journal) was reaching the print root and is overridden. Bench sheet: 9.5pt body, the
day on a rule (no black bar, no *Start __:__*, no clock — the waits sit between the steps), one
box per action beside its number, and days flow rather than break (a page per day left a page
holding four lines of a table). Record PDF: steps numbered through the run, the actions before
the recipe table they refer to, 9.5pt. **A recipe that is one sentence with no table, under a
step that already quotes its numbers, is dropped on both sheets** (`_recipeRedundant`); a
table or a warning always prints. The page behind the print root is white under `@media print`.

**And a setup changed after creation failed the proof too.** Jon's run had a second donor added
in Edit setup, so the template filled with *today's* setup ("NL-DELE1(CTD), VHL-NL + HT-HRI")
never equalled prose written from the setup of the day it was made. `_tplMatches` compares
against the template with every `{{placeholder}}` as a wildcard: the words are the template's,
the values in the gaps are the setup's, whichever setup that was. A block somebody typed into
still fails (verified both ways).

**The plate preview merged ten compound blocks into one "1".** `plateNumberBoxes` keyed on type,
flags and the well's compound — and Jon's blocks were drawn by hand: the name on the *group
label*, shading for the series, no concentration on the wells, so nothing separated them. A
group is a block boundary now; a number box carries the group's label or compound under the
number (`b.cap`: "1 · DMSO"); a **dose block** is a group with a concentration *or a shade* on
any well (`_plateBlockIsDose`), outlined and captioned, and no number is drawn over it. Every
figure on the map — numbers, concentrations, legend, editor wells, PNG — is sans, tabular
(Jon: *"fuente sans legible"*). And **Concentrations onto the compound blocks** (plate ⋯ menu,
`plFillDoseBlocks`) writes the setup's series left to right onto every shaded / named block,
skipping the controls, the flagged wells and DMSO, and copies the label onto the wells as the
compound — which is how a hand-drawn plate gets its numbers. `plateSummary` no longer prints
the label and the compound when they are the same name, nor "gradient · 3 levels" once the
concentrations are on the wells.

**"Dispense 10.2 µL per well" — Jon's rule is that exactly 10 µL goes into every well.** The
`nbtx` table made 10 µL of Opti-MEM per well and added the plasmids and the FuGENE on top, so
the pair mix was 11.1 µL a well and the mock 10.3, and the prose summed Opti-MEM + FuGENE +
DNA-at-1000-ng/µL to 10.2 — a number no tube held. Now **the Opti-MEM is the remainder**
(`rtxmix`'s rule): a mix is `optimemPerWell` (relabelled *Mix dispensed per well*) × wells ×
overage, the plasmids at their stocks and the FuGENE come out of it, and a mix whose DNA and
FuGENE alone exceed that says *short by N µL* in the Opti-MEM cell and in a warning. `VOL_ADD.nbtx`
is exactly the dispense; the step reads *"each made to 10 µL per well … Dispense 10 µL of the
mix into every well"*.

**The selection bubble had two native `<select>`s.** Focusing one fired `mouseup` → `positionBubble`
→ `innerHTML` rebuilt the bubble under the open list, which vanished. The font, the size and the
colours are now lists drawn *inside* the bubble (`BUB.menu`), every control prevents its
mousedown so the selection never moves, and the bubble is redrawn only when the selection
signature changes (`_bubSelSig`) or a control asks for it — never on a click inside itself. The
pills name the font and size the selection is set in (`_bubCur`); the last colour picked is what
the A and the highlighter paint. 28px controls, one sans, no serif letters.

**A rebuilt plate could not be taken back** (Jon, same afternoon): `rebuildNbPlate`, the
*Start from a layout…* apply and `rebuildPub` had no `undoMark`. They do.

## Report — the experiment on one page, and every way out of it (2026-09-17, night)

Jon: *"me gusta la página de Methods, simple y directo. Llámala Report, ponla al final, contiene
toda la info del experimento. Unifica los exports en esta página. Audit entero de cómo corre
un experimento y cómo se refleja todo."* And: *"el plate map en PNG no pone qué compuesto va en
cada sitio."*

- **The tab is Report, last** (internal id still `pub`, so `EXP_TAB`, the spotlight and the
  sweep are untouched). Sections in `PUB_SECTIONS`, all on by default: Aim · **Run** (code,
  first–last day, steps done, status, replicate n) · Setup · Methods · **Plate layout as the
  map itself** (`platePreviewHtml` read-only, `contenteditable=false`, plus one line per block)
  · Deviations · **What happened** (`_pubLogHtml`: the ticks by day with their times and the
  `b.log` lines) · Results (sentence **and** the table — exclusions struck, flags and notes
  kept) · Observations (`e.html`) · Outcome (its real label) · Files (names and captions).
  `_pubSourceSig` covers all of it. **`METHODS_ONLY`** is the manuscript subset: the Methods
  sheet prints it (the plate as a sentence there), and the record PDF's paragraph is
  `{setup, methods, plate}` — the PDF already prints results, log and files on its own.
- **Exports live on the page** (`reportExportsHtml`): Record PDF · Methods sheet · Bench sheet ·
  What you need · Copy (HTML + text on the clipboard) · Word · Data… · Plate PNG. Same functions
  the ribbon and the banner call; nothing moved, everything is also here.
- **The PNG names its compounds.** `plateToPNG` outlines every dose block, writes the compound
  along its top edge with a halo, prints the concentration in each well, wraps the legend onto
  as many lines as it needs (it was measured after the canvas was sized, so a long key ran off
  the edge) and adds a `C1–D3  Compound 1` key line.
- **Found by the audit: the record PDF of any experiment had thrown since the live-paragraph
  commit** (`'+_ptdy+'` — a replacement that ate the tail of `e.pubReady`). Verified now: every
  export button resolves to a function, the PDF, prep and data dialogs open, the Methods sheet
  carries Methods · Plate layout · Results, and ticking, logging, excluding a result, typing a
  wait and setting the outcome each reach the Report with nothing pressed. The phone sweep is
  clean on the experiment screens.

## The paragraph is live, and the wait it quotes is the plan's (2026-09-17, evening)

Jon: *"publication ready sigue sin coger los datos live. Al cambiar la adición de compuestos al
día anterior no ha cambiado el tiempo de incubación a 16 h. Todo, absolutamente todo, tiene que
estar sync."* Two things were snapshots and one number was a string.

- **`pubText(e)` builds the paragraph from the experiment every time it is read** — pane, Copy,
  PDF, Methods sheet, Cmd+K. `e.pubReady` is only what you *wrote*: the first keystroke in the
  pane sets `pubEdited` and stamps `pubSrcSig`; from then on your wording is kept, the banner
  says when the steps have moved on, and **Back to live** (`pubBackToLive`, undoable) hands it
  back. The section toggles, Rebuild and a replicate all reset to live. `_pubMigrate` runs with
  the other idempotent migrations: an old record whose stored text differs from today's build
  *with an unchanged source* was written by hand and stays so; anything else is live.
- **`{{c.wait}}`** is the wait as the text quotes it (`_waitVal` → `blkWait`), in a step's html
  and in its `pub` sentence (`pubSentence` now fills `b.pub`). The SPARK screen's compound step
  carries it instead of "4 h" (`_presetV13`; the reword pass takes it into untouched runs).
  `_pubSourceSig` includes each block's date and wait, so a moved step makes a hand-written
  paragraph stale.
- **A preset's wait was written for the plan the preset shipped.** `waitSameDay` (stamped at
  creation; read off the preset for older records by `_waitSeedSameDay`) records that "4 h, then
  the read" was a same-day wait. Move the read to tomorrow and `blkWait` voids that 4 h (`voided`)
  and the implied overnight takes over; the D2B 20 h reaction, seeded cross-day, stands. A wait
  you typed sets `waitOwn` and is never voided. Verified end to end: drag the compound step to
  the day before → chip *16 h · overnight*, step text *Incubate 16 h*, Methods *incubated for
  16 h at 37 °C*, with nothing pressed.

## A wait can be hours, and tomorrow's read implies tonight's incubation (2026-09-17)

Jon: *"si añado compuestos un día y la lectura es el día siguiente, se da por hecho que es
incubación overnight (16 h). En tiempo wait permite poner horas también."*

- **`_parseWait`** reads "45 min", "3 h", "1 h 30", "1.5h", "90" (a bare number stays minutes,
  as the field always was) and "overnight" / "o/n" (`OVERNIGHT_MIN`, 16 h). The prompt shows the
  current wait as text ("16 h"), not as 960.
- **`blkWait(e,b)`** is the one reader of a step's wait: the stored `waitMin`, or — with nothing
  stored, the step last on its day, and the experiment's next step dated **exactly tomorrow** — an
  implied overnight. **Derived, never stored**: writing 16 h onto the step would make an assumed
  value and a typed one look the same, and a step moved to another day would carry it. A two-day
  gap implies nothing. The chip reads *16 h · overnight* (`.blk-wait.implied`), the ⋯ says
  "Change the wait", the timer counts it down after the tick, and the bench sheet prints
  *overnight 16 h → Read (Fri 18/09)*.
- **A wait on the last step of a day bridges to the next day** (`_waitBridges`), whether typed or
  implied, and stays out of the day's clock — `dayPlan` and the bench sheet's "n h of waits" count
  only the waits inside the day. A day that reads *09:00 → 05:00* because of a 20 h incubation is
  not a day.

## A condition is a slot, not a name (2026-09-17, afternoon)

Jon, on the NanoBRET plate: Rebuild redrew everything; ⌘Z did not take it back; and changing one
plasmid meant redrawing the whole map. Three things, one root — the plate knew conditions by their
**tid**, which is built from the names (`p:NL-DELE1(CTD)+HT-HRI@10`), so a renamed plasmid was a
*new* condition to the palette and the old one stayed on the wells for ever.

- **`slot`** on every `_nbtxConditions` entry (`pair:ri:di:ai`, `donor:ri:di`, `acc:ai`, `mock`,
  `untr`) is the condition's place in the design and survives a rename. `nbNumberPlate` matches a
  numbered type the table no longer has to the condition that took its slot (by kind in number
  order for a plate from before slots existed), and **the wells follow**: same wells, same number,
  new name; group labels renamed with it. It runs from `calcUpd`, so typing the new name in the
  calculator is the whole edit. A type wells still carry that matches nothing is left alone.
  **The rename also reaches `e.setup`** (`donors`/`acceptors`/`ratios`/`minVol`, the same strings)
  and the setup table repaints in place — the setup is what Edit setup and Rebuild read, so
  without it the next Edit setup save wrote the old name straight back over table and map.
- **The mix table numbers its rows as the plate does** (`plateTidNos` → `nbtxRecipe(v,counts,nos)`,
  rows sorted by that number): a condition added later takes the next free number instead of
  shifting every row below it, so the number on a well and the number beside its mix are one number.
- **Rebuild asks** (`lbChoose`): *Keep the map, update the conditions* (default, and the subtitle
  says what would change — renamed · new to paint · no longer in the table) · *Redraw from the
  setup* (says what it throws away) · *Leave it*. An empty map still redraws without asking.
- **⌘Z in a field takes our step when ours is the newer thing.** With the caret left in a field
  (Safari never focuses a clicked button; any browser after a programmatic re-render) the key went
  to the browser's text undo. Rebuild → ⌘Z is verified in Chromium standalone, embedded in an
  iframe, and with the plate editor open — a report that it "still" fails after a push is most
  likely the Pages cache (`max-age=600`): hard-reload before re-testing. `UNDO.at` (last mark) against `UNDO.typedAt` (last input in an
  editable, captured at document level) decides; typing since the mark keeps the field's undo.
- Dragging a step onto another day in Steps now **re-dates it** (`_blkPlace`); the array-only
  reorder snapped it back because `dayGroups` sorts by date first. A day group is a drop target.

## Labbook, set like OneNote — chrome that yields, paper that reads (2026-09-22)

Jon, with a OneNote recreation blueprint in hand: *"aún sigo pensando que usar labbook es
demasiado complicado, el layout no es clean como OneNote."* Read against the live app, what
makes OneNote *easy* is not its canvas or its ink — it is discipline about chrome, and that was
what Labbook lacked: 15 `backdrop-filter`s, 61 shadows, **76 uppercase micro-labels**, a
permanent ribbon, a permanent right dock, nine buttons on the banner and nine on every plate
card, a three-icon workspace switch above a project tree with a × on every row. The decisions
were his (asked before anything was built): remove the ribbon · remove the dock · one
OneNote-style column · the experiment as one page · per-object controls on hover except the
banner (*"quiero items individuales, no escondidos"*) · everything flat · Home = Today +
Running + Recent · open where you left off. Five commits, one per decision.

**Paper, not dashboard.** `.pane-ed` is the sheet (`--surface`), the columns are the desk
(`--bg`), `body::before`'s gradients are gone. No `backdrop-filter` anywhere — the `--glass-*`
tokens survive as names and resolve to the flat surface, which also removes the `#pl-band`
containing-block trap. A card is a sentence-case heading over one hairline; a step is a row; a
calculator is a 2px left rule; prose is `--fs-5`/1.6. The uppercase labels are sentence case
except where the text is a code (`.proj-px`, `.res-src`, `.lh-flag`, `.nb-crumb`) — and the
print stylesheets, which are paper and keep their own. `docs/UI.md` carries the rule.

**Controls appear when you reach for them** — under `@media (hover:hover)` only. A step's grip
· camera · ⋯, a plate card's Edit · ⋯ (the other five buttons were already in `plateMenu`), a
calculator's Inputs · ×, *Why these numbers*, a file's and a result's actions sit at
`opacity:0` and come up on `:hover`/`:focus-within`. `opacity`, never `display:none`, so the
sweep's tap-target rule and the keyboard still find them; `(hover:none)` hides nothing.

**The top bar.** `#ribbon` → `#topbar`: `crumbHtml()` (segments that navigate — `Planner ›
project › folder › code`, `Journal › date`, `Visualize`; a phone shows only the current one),
**On this page** (`openOnThisPage` — the steps, then the page's sections, as a popover/sheet),
search (omitted inside dHUB, whose header has one), the save pill (`ribbonStatus` reused) and
settings. `renderPanels()` now draws it. Where the ribbon's commands went: formatting → the
bubble, which gained a **¶** menu (`BUBBLE_BLOCKS`, alignment, indent, checklist — the only
things it lacked); Insert → `/`, `@`, `#`, all named in the Shortcuts legend; View → the
column foot (Export · Recover · Settings · Theme) and Settings → Appearance (Lean). Deleted:
`coreRibbon`, `insertPane`, `viewPane`, `INSERT_ITEMS`, `_rbTab/_rbOpen/rbPaneOpen/setRbTab`,
`applyFontSize`, `openMention`, `openSlash`, the `.tb-*` swatch machinery, `rebuildPub` (an
orphan since the paragraph went live).

**The dock is gone**: `#rightdock`, `DOCK_PANELS`, `PANEL_DEFS`, `renderDockPanels` (16 call
sites), `toggleDock`, `LB_DOCK_FLOAT_MAX`, `lb-dock-float/-idle`, `mobile-dock-open`,
`LAYOUT.dockOpen`. Outline → On this page; Tags → `tagsHtml()` is a chip row under the
Experiments header and `xvMatch` answers a `#tag` query against every rich-text field of a
run; Linked from → `_backlinksHtml` at the foot of the experiment page, drawn only when
non-empty.

**One column** (`renderSections`, both builds): Home · Today · Week · Experiments, then every
project as a coloured tab (`.proj-row::before` is the bar, `--pc`) with its folders under it —
always listed, not only inside an experiment — `+ Folder` / `+ Project` as quiet rows that
`lbPrompt` for a name (`addProject(name)` / `addSection(pid,name)` take it; the Experiments
view keeps its inline adder, so `#new-proj` still exists somewhere), and standalone only
Journal · Visualize at the foot (in dHUB the rail owns the workspaces). No × per row. The second
pane lists the context: a folder's experiments, or `_journalListHtml()` — the days and Notes —
so the Journal reads notebooks | pages | page and `renderNbColumn` is gone.

**The experiment is one page.** Title, the meta line (`.exh-lean`, always shown now: the code
as an input, type, date, status, outcome, line, plasmids; Details opens the form behind it),
the aim, the actions, the setup, then **Steps · Observations · Results (only once there are
any) · Files · Report** as `.exp-sec-h` sections of one scrolling page. Report is folded until
asked for (`REPORT_OPEN`, session state) so `renderEditor`'s every-tick calls never build the
paragraph; its exports stay on the folded row. `EXP_TAB` is only where the *next* render lands
(a result from ⌘K, a photo just added) and is consumed; `expTab(k)` scrolls to `#sec-k`;
`_edScreenKey` no longer carries a tab. The phone's sticky button is *Jump to*
(`expTabMenu`). `.exp-tabs` and its CSS are gone.

**Home** is the today band, Running experiments and Recently edited. This week, Projects,
Results in from Echo, Deviations and Cell cultures went (`homeWeekCard`, `homeProjectsCard`,
`HOME_PROJ`, `homeResultsCard`, `homeDeviationsCard`, `homeCulturesCard` and their CSS).

**Where you left off.** `WS_LAST` is persisted per device in `localStorage['lb_last']`
(`{planner:{node,page}, notebook:{page}, ws}`), written from `renderPages`, never in
`LB.data`. Boot restores the Journal page, Visualize, or the Planner's last node — only if the
record still exists — else Home; the rail's `lb:go view:'planner'` does the same. dHUB's own
"opens on Home" still holds for the shell; Labbook restores inside it.

**The day's work is one builder, on both day pages.** Jon: *"desde la página de hoy tengo
acceso a todo lo que tengo que hacer hoy en diferentes experimentos… cuando se tache un paso
se tiene que reflejar en todos los sitios."* Today (the Planner) already grouped the day's
steps project › code · title with a tick per step and the carry-over under it; the Journal's
day page showed only *Done that day* and the note. `dayWorkHtml(D,{noCarry})` is what
`renderDayView` built inline, extracted, and the Journal page draws it above *Done that day*
(a past day says *What was due that day*, with no carry-over — carry-over only means
something looking forward). The tick handlers are document-level, so a tick on the Journal
page, on Today, on Home's band or on the experiment writes the one `b.done` the others read.
Verified round trip in the browser: tick on Today → the experiment's row and its 2/4, Home's
1/6 and the chip gone, the Journal's *Done that day* with the time; untick on the experiment →
Today's row, the Journal's row and its done list all back.

**Lean mode is gone, and had to be.** `.lean-tog` was `display:none` except under
`body.lb-lean`, so once the header's form folded behind *Details* by default, turning Lean
**off** hid the Details button while the fields stayed folded — type, status, start date,
plasmids and cell lines unreachable. Everything Lean governed (the header form, the bench
calculator inputs, the deviations list) is the default fold now, the toggles are always
visible, and the Settings → Appearance row, `toggleLean` and `lb_lean` are deleted.

Found on the way: cutting the Insert block took the icon definitions (`tbIco`, `P_*`,
`ICON_*`, `SLASH_ITEMS`) with it, and cutting the Home cards' CSS took `.lh-exp`/`.lh-x-*` —
both restored from git. **A cut between two comment markers is a claim about what lies
between them; diff it before trusting it.** The Details form's Type select clipped its widest
option at every width (`minmax(150px)` → `220px`). The sweep's `closeAll` now hides the bubble
(one screen left it open over the next), and X₂/X² on the bubble are exempt from the
small-text rule. Verified: `check_css` / `check_js` / `audit_app --xref` / `check_shared`
clean; the runtime, alignment and fit audits clean over Home, Experiments, Today, Week, an
experiment (Report open, Details open), a Journal day, a note, Visualize, On this page and the
bubble at 1440/1180/1024/900 in both themes; the phone sweep at **0** on Chromium, WebKit and
embedded; dHUB and the standalone rebuilt.

## Current state

**v1.18.0**, 17 apps in the personal build / 11 in the product build, last worked 2026-09-22. (This session: **Labbook set like OneNote** — flat paper, hover chrome, a top bar with a breadcrumb in place of the ribbon and the dock, one coloured-tab column, the experiment as one page, Home = Today + Running + Recent, and it opens where you left off; see *Labbook, set like OneNote*. Before it, last: **Report** — the last tab is the whole experiment on one page with every export on it, the PNG names its compounds, and the audit found the record PDF had been throwing; see *Report — the experiment on one page*. Before it: **the paragraph is live** — the Methods text is built from the record on every read until you write in it, `{{c.wait}}` quotes the plan's wait, and a preset's same-day wait gives way to the overnight when the read moves to tomorrow; see *The paragraph is live*. Before it: **waits in hours, overnight implied** — a read dated tomorrow makes the compound step's wait 16 h without anyone typing it, the wait field takes hours, and a wait that crosses into the next day stays out of the day's clock; see *A wait can be hours*. Before it: **a condition is a slot** — a renamed plasmid reaches the wells that carry it, the mix table numbers rows as the plate does, Rebuild keeps the map by default, ⌘Z takes a rebuild back even from a field, and a step dragged to another day is re-dated; see *A condition is a slot, not a name*. Before it: **the sheets set in grey** — the reword pass had been skipping every ticked block because a tick changes the serialisation; the NanoBRET steps are written as actions with the suspension totals; bench sheet and record PDF are greyscale, smaller, without the start time or the palette strip; plate rebuilds undo. See *The sheets, set in grey*. Before it: **export by scope, Visualize and the run sheet** — a Journal day prints what its page shows, the Export PDF dialog has a scope (experiment · folder · project · all · day · month · whole Journal) with a cover and index for bulk, the Data picker exports and imports bundles, a third **Visualize** workspace draws the notebook as SVG charts with drill-down, and the bench sheet is one day per page with a clock from the waits and a needs box; see *Export by scope, Visualize, and a bench sheet with a clock*. Before it: **the eighteen content suggestions applied**, then Cadence retired and the Lab settings made one list — see *The eighteen suggestions, applied*. Before it: **the report is a protocol** — an Export PDF dialog with a live page, plate maps that read (per-well concentrations, outlined dose blocks, merged controls), rationale folded, and attachments that sync per id from every build; plus one gear in every header. See *The report is a protocol*. Before it: **every app re-audited** — two headers corrupt since 2 Sep repaired, one identity across eighteen, ~40 fixes, one content suggestion per app in the report — and in Labbook the banner shows every action, the folder list stays open, and every step is a numbered procedure quoting its calculator's numbers live; see *Every app re-audited*. Before it: **the Notebook hierarchy went** — Labbook is the Planner and the Journal: days that write what was done from the ticks (with a one-line `b.log` per step), a day note with @ and #, and one flat list of Notes; existing pages migrated to the day they were written. See *Planner and Journal*. Before it: **fifteen workflow fixes** from the flow review — real ticks on Home, folded due rows on Today, the verdict on the last tick, tasks that carry over, one door to a new experiment (⌘E), a modal that fits, weekends skipped, Duplicate as a fresh plan, and the desktop's chrome out of the way. See *Where the time went*. Before it: **one Steps tab** in the experiment — Bench and Dated sections merged, every preset block a numbered list of actions with footnotes and no tick lists, the SPARK screen plate drawn as Jon laid it out, a wider New-experiment sheet, a real crop tool, and the preview that was dirtying stored presets fixed; see *One Steps tab*. Before it: **the PDF and the bench sheet set as documents** — page breaks only where a break is wrong, document type, page numbers; see *The PDF and the bench sheet*. Before it: **FuGENE as a ratio on the DNA a well actually receives** (the 10% rule is one target for carrier, FuGENE and Methods), the **NanoBRET SPARK - Screen** preset with `setupAdd` and a format-aware layout, and the conflict banner that fired on every push because the SDK echoes a write before its promise resolves and the fingerprints were never canonical. See *FuGENE follows the DNA*. Earlier: **the first push** — a `save()` before the first cloud read pushed the whole local tree, and a seed-only device replaced every real project in the cloud; nothing is pushed now until the cloud state is known, the first push is a diff, adoption puts back projects that the cloud's own experiments still name, orphans are shown, and Recover has *Projects only…*. See *The first push, and the six generic names*. Before it: **two workspaces, one file** — Labbook is the Planner (Home · Today · Week · Experiments) and the Notebook (OneNote's shape: notebook picker + sections · pages with subpages · a page on paper). Every project is a notebook, Journal is a derived notebook with a page per day, sections and pages gained `nb`/`color`/`order`/`level` through an idempotent migration, and the shell rail says Planner · Notebook. See *Two workspaces, one file*. Previous session, second half: **the phone had no session** — the standalone build never listened for the restored Firebase session, so the PWA synced only in the one session the button was pressed in; `_lbAuthWatch` fixes it, a pristine device adopts the cloud, Home says where the notebook is, and email & password sign-in exists for an installed iOS app where Google's popup cannot come back — Jon sets the password once from the laptop. Plus swipe between days, hold-+-for-a-photo, and the overdue badge. See *The phone had no session*. First half: **Labbook on a phone, second pass** — the PWA got its own bottom bar (its Home had no doors), every menu and dialog became a bottom sheet through the one `popOpen`/`.modal` seam, a **Bench tab** shows an experiment as it is run and is the phone's default, fifteen measured overlaps were fixed one rule each (the Journal navigator, plate headers that overlapped on the desktop too, the step header, the drawer), glass and hidden-pane rebuilds came off the phone's render path, and `tools/mobile_sweep.mjs` — Playwright on an emulated iPhone, Chromium and WebKit — drives 51 screens and went from 691 findings to 0. Two things only measuring found: `body:has()` made every innerHTML replacement 6× slower, and a long press's release closes a bottom sheet. See *Labbook on a phone, second pass*. Before it: **the last of the browser dialogs** — 76 native `alert`/`confirm`/`prompt` calls across the shell and eleven apps became toasts, notes and in-app questions, so nothing in the Hub opens a dialog headed "localhost says" any more. Each `confirm` split its function into a question and a `_…Go` that does the work, with the callback as the only path to the write. `--danger` turned out never to have been defined in the shell, so *Reset app data* had been drawing its destructive colour from nothing. See *"localhost says"*. Before it: **the rail redrawn** — Journal was a calendar, Data Analysis a squiggle, Cells noise, More apps a wrench, and the antibody/primer/plasmid trio read as a node graph, a sort control and a loading spinner. Each was diagnosed on a contact sheet at the size the rail actually uses. See *The rail, redrawn*. Before it: **a hunt for the known failure families** — Beacon's plate reader turned out to be the third copy of the parser Blueprint and Labbook already had fixed, with the same four silent defects plus one of its own (an unread well became 0, and zero is a real number in a BRET ratio); Echo had a sixth `.pinfo` tooltip the earlier sweep missed; and eight popovers across five apps clamped themselves by a number written in the source rather than by measuring. See *The third copy of the same parser*. Before it: **Echo audited** — three silent defects between a picklist and a published potency. A failed transfer was read as delivered; a well dosed by several transfers became several identical points, weighted that many times in the fit; and nothing flagged an EC50 that landed on its bound, which fits its own half at R²=0.997 and reaches the paper as a measured number. The 4PL engine itself checks out exactly. Phase 2 is deliberately still to do. See *Echo, audited*. Before it: **Labbook as the bench app** — a fifth build profile packages the notebook as an installable, offline PWA. The thing that had to be fixed first was that `labbook-standalone` had no Firebase at all, so a phone build would have been an island; `lbFb()` is the one seam and every sync consumer is untouched. Verified in real Chrome with the server stopped: the app opens, writes persist, and all 33 protocols and 24 calculators are there. See *Labbook as the bench app*. Before it: **the prep sheet** — a planned experiment already knew every volume, plate and construct it would consume, and the shell already knew where things are; nothing joined them. `openPrepSheet` answers "what do I need" for a whole experiment or for a day, with the amounts the step calculators already worked out and the location from the Library and the freezer. Plasticware takes the max within an experiment and adds across them, because the plate you seed on is the plate you read. See *What you need before you start*. Before it: **what n = 3 actually means** — `repSiblings` had been recorded since replicates were added and read by nothing but the header chip, so an experiment run three times reported three separate numbers and no result. `repResultStats` averages them, in log space for potencies, with technical replicates collapsed inside each run first, bounded values counted and never averaged, and your exclusions honoured over the fitter's flags. Summary card, PDF, Methods sentence and a CSV. See *What n = 3 actually means*. Before it: **the slip dialog and the stuck tooltip** — one screenshot from Jon, two bugs and a design error. A tooltip dismissed only by `mouseout` is dismissed by the one event that cannot fire when the trigger is re-rendered away, which is exactly what ticking a step does; the same shape was in five more apps' `.pinfo` tooltips, four of them clamping against a guessed 270 px. And a question whose answers are all actions is not a confirm — `lbChoose` gives the slip three real answers and no Cancel, one of which records that the step was done on the day it was planned for. See *A tooltip leaves, and a question with two answers has no Cancel*. Before it: **the icon set**, audited as a contact sheet at both sizes — two pairs were the same drawing (Incubator/Cell Archive, and Cells/Home), three were drawn too small to read (Protein Tools' bonds were 0.4 px long), and three said nothing at all; see *Fourteen icons, and the two that were the same drawing*. Before it: **Blueprint, audited end to end** at Jon's request — code, geometry and behaviour. Most of it was already right; what was not was worth the pass. The plate-reader import corrupted data **four** ways in six lines, all silently — an empty well vanished and shifted the row, a European decimal read as 0, `trim()` ate the first cell of a plate whose A1 was empty, and an empty first cell was taken for a header — plus a fifth found while fixing them. **All five were in Labbook too**, because `plParseValues` is a line-for-line port of `pdParseValues`, and there they land on a structured plate map that feeds Cmd+K, the Methods paragraph and every export. Then two popups that came out off the screen (the Gel one at `left:-188px` on a phone), three overlapping small-screen blocks in which thirteen selectors collided and file position decided the layout — that is how a 40px tap target got cancelled by a 36 written forty lines lower — and an undo that merged two deliberate actions into one step. Before it: **durability** (a recycle bin that syncs, version history, conflicts that keep both copies, the attachment backfill, and a GC that no longer hard-deletes on a derivation that can be wrong), **aim and outcome** on an experiment, timers that survive a reload, 23 declared keyboard shortcuts with a legend rendered from the same table, and four curated presets. See *A port carries the bugs too* and *As safe as OneNote* above.) Start with the compact [Claude handoff note](docs/CLAUDE_HANDOFF.md) for the current checkpoint, then use the full changelog/session history: [`docs/SESSION_HISTORY.md`](docs/SESSION_HISTORY.md) (not auto-loaded — open it directly for past-change detail; nothing was deleted, only moved there).

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
- **Out of the product build**: Cuppa, Ribbon, Protein Tools (see `PROFILES` in `embed.py`). They
  stay in the repo and in the default build. Fabricata and Cadence were retired to `old_stuff/` on
  2026-09-16.
- **Retired 2026-07-30**: LabMate and Arc removed from `embed.py`, `APP_INFO` and the shell —
  both had been unreachable (no card, no `openApp()`) and together were ~3.6 MB of the bundle.
  Files remain on disk. Beacon is visible to admins inside Data Analysis but remains outside the
  public unlock flow, pending its Phase 2 absorption into Echo.
