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

## Current apps

| ID | Name | Logo | Accent | Standalone file |
|----|------|------|--------|-----------------|
| `echo` | Echo Data Analysis | SVG bar chart | `#ff5760` | `Labcyte_Echo/labcyte_echo.html` |
| `lm` | LabMate | SVG flask | `#e08c30` (amber) | `Labmate/labmate.html` |
| `deg` | Degradation Explorer | SVG curve | `#7c6fd4` | `Degradation_Explorer/degradation_visualizer.html` |
| `pd` | Lab Designer | SVG wells | `#0079b9` | `Plate_Designer/plate_designer.html` |
| `dna` | Helix | SVG helix | `#43a047` | `Helix/helix.html` |
| `pt` | Protein Tools | SVG chain | `#9c6fd4` | `Protein_Tools/protein_tools.html` |
| `spectra` | Spectra | SVG waveform | `#26a69a` | `Spectra/spectra.html` |
| `ldi` | LDI | SVG balance/scale | `#e91e63` | `LDI/ldi.html` |
| `cryo` | Iceberg | SVG snowflake | `#00acc1` | `Cryostorage/cryostorage.html` |
| `cuppa` | Cuppa | SVG coffee cup | `#8d6e63` | `Cuppa/cuppa.html` |
| `fabricata` | Fabricata™ | SVG bar chart + star | `#c07a8e` | `DataFaker/fabricata.html` |
| `beacon` | Beacon | SVG donor/acceptor BRET glyph | `#5e72c4` | `Beacon/beacon.html` |
| `lumina` | Lumina | SVG light bulb | `#f5c518` (warm gold) | `Lumina/lumina.html` |
| `ribbon` | Ribbon | SVG ribbon waves | `#e36c69` (salmon) | `Ribbon/ribbon.html` |
| `arc` | Arc | SVG narrative arc + nodes | `#816baf` (purple) | `Arc/arc.html` |

**Home grid packages:** the home cards are grouped into labelled sections by `PACKAGES` in `hub-shell.html` (Data Analysis · Design & Presentation · Molecular Biology · Lab Operations · Just for Fun). `_buildPackages()` reorganizes the flat `#app-grid` into per-package `.grid` blocks at load; drag-reorder is scoped within a package and persisted per-package in `localStorage` (`hub_card_order_v2`). Empty sections auto-hide via `_updateSectionVisibility()`. Any app id not in `PACKAGES` falls into a trailing "More" section.

---

## Architecture & workflow

**dHUB is self-contained.** Each app's HTML is base64-encoded and stored inside `APP_B64` / `APP_B64_NEW` in dHUB's `<script>` block. When you open an app, it is decoded with `decodeB64App()` and rendered in an `iframe.srcdoc`. This means:

- **dHUB alone** = complete product (no folder structure needed).
- **Individual app files** = standalone versions, kept manually in sync.
- When you change an individual app file, you must **re-run the Python embed script** to regenerate dHUB.

```
The_Hub/
├── dHUB.html                                 ← self-contained, ~9.4MB
├── hub-shell.html                            ← source-of-truth shell (~28KB)
├── embed.py                                  ← build script
├── Labcyte_Echo/
│   └── labcyte_echo.html
├── Degradation_Explorer/
│   └── degradation_visualizer.html
├── Labmate/
│   ├── labmate.html
│   └── RDKit_minimal.js / .wasm             ← ORPHANED (no longer referenced by labmate.html)
├── Plate_Designer/
│   └── plate_designer.html
├── Helix/
│   └── helix.html
├── Protein_Tools/
│   └── protein_tools.html
├── Spectra/
│   └── spectra.html
├── LDI/
│   └── ldi.html
└── Lumina/
    └── lumina.html
```

### Regenerating the self-contained dHUB after app changes

**`embed.py`** reads from `hub-shell.html` and fills in each app's base64. Run from `The_Hub/`:

```bash
python3 embed.py                      # → dHUB.html  (local/offline use)
python3 embed.py dist/index.html     # → dist/index.html  (CI/Pages build)
```

The key regex is `[^"]*` (not `[A-Za-z0-9+/=]+`) to avoid the PLACEHOLDER suffix bug. `embed.py` fails loudly (exit 1) if a source file is missing or a key doesn't match exactly one placeholder.

### Shared curve-fit engine (Echo is canonical)

There is no module system, so the 4PL Levenberg-Marquardt fitter (`_lmFit`, `_solveLin`, `_matInv`, `_fitBest`, `_4plVal4`/`_gain`, `_4plJac4`/`_gain`, `_xAtYMid`, `_tQ95`) is **duplicated** in **Echo** (canonical), **Beacon**, and **Lumina**. As of v1.4.0 (2026-07-13) all three are **in sync** — Beacon/Lumina's copies were reconciled onto Echo's (verified fit-for-fit identical: Beacon in-browser maxParamDiff=0, Lumina Node A/B maxParamDiff=0). Two scripts maintain this:
- **`check_shared.py`** — read-only drift monitor (`python3 check_shared.py`, exit 1 on drift). Run after editing any fit function.
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
git add Labcyte_Echo/labcyte_echo.html hub-shell.html CLAUDE.md
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

All hub chrome uses Echo Data Analysis's exact CSS variables and IBM Plex fonts:

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

## Session log
<!-- AUTO-UPDATED by .claude/stop-hook.sh — do not edit this section manually -->
<!-- LAST_SESSION_START -->
Last session: 2026-07-14 (Echo backfill vehicle wells + changelog cleanup + rebrand to dHUB; v1.3.7)
Hub apps: 15. Version v1.3.7. (All of this day's work is one version bump / one changelog entry — see the versioning rule.)
**Echo Gradient Planner backfill calculator now accounts for DMSO-only (vehicle) wells.** Jon pointed out the existing intermediate-plate backfill calculator (`_egBfCompute`, `Labcyte_Echo/labcyte_echo.html`) only summed the DMSO shortfall of compound-dosed wells (`maxT - vAdj` per dose point) — it missed that real runs also include wells filled with **only DMSO** (no compound) at the same max-transfer volume as the highest-dose well, used to homogenize final DMSO% across the whole destination plate (vehicle/homogenization controls). Since those wells get zero compound transfer, their *entire* volume comes from backfill DMSO, not just a shortfall — a bigger contribution than any compound well's partial top-up. Added a new **"DMSO-only (vehicle) wells"** input (per set, default 0 for exact backward compatibility) next to the existing compound/sets/replicates fields; `vehicleBackfillNL = nVehicle*nSets*maxT` is now added to `totalBackfillNL` alongside the pre-existing `compoundBackfillNL`, and vehicle wells are added to `destWellsNeedingBackfill`. Both the live calculator output and the Copy-summary text now break out the compound-vs-vehicle contribution when vehicle wells > 0. Verified via Playwright against the standalone file: with the default gradient loaded, 4 vehicle wells/set at maxT=40 nL added exactly 160 nL (4×40) on top of the existing 775 nL compound backfill for a 935 nL total; leaving the field at its default 0 reproduces the prior numbers exactly (775 nL, 20 dest wells needing backfill) — confirmed no regression for existing users who don't use vehicle wells.
**Changelog cleanup.** The in-app "What's new" panel had drifted back into detailed paragraph-style bullets (v1.1.1–v1.3.7, 25 entries). Jon: "shorten the log entries A LOT... if we have added new stuff write (added new features), if there are bug fixes just write bug fixes." Rewrote that whole range to the terse `<b>App</b>: new features` / `<b>App</b>: bug fixes` / `<b>App</b>: visual updates` style already used for v1.0.95 and older (no mechanism/rationale in-app — that still lives here and in git history). Also caught and merged several same-calendar-day version bumps that had never been day-grouped (29 Jun had 4 separate entries, 24 Jun had 4, 22 Jun had 4, 21 Jun had 3, 20 Jun had 3) into one entry each. Explicitly asked and confirmed: this terseness rule applies to the in-app changelog only, **not** to this Session log, which keeps its detailed style on purpose.
**Rebrand: The Hub → dHUB.** Jon is thinking bigger-picture — positioning this suite as a centralized TPD (targeted protein degradation) ops platform, potentially sellable to other labs, with the Data Analysis pack (Echo/Beacon/Lumina/Degradation Explorer/LDI) as the flagship. First step: rename "The Hub" to "dHUB" (pronounced the same, "d" now standing for Degradation) everywhere user-facing. Changed: page `<title>`, favicon (H→d), nav logo box + `#nav-title`, home hero `.hub-title`, `.opts-version` label, changelog `<b>Hub</b>` mentions, "Back to Hub" tooltips, the Ryan-easter-egg comic's `regg-title`, plus code comments in Cuppa/Iceberg that explained embed behavior in terms of "The Hub." Renamed the build output `The Hub.html` → `dHUB.html` (updated `embed.py`'s default `OUT`, `.gitignore`, `CLAUDE.md`) and the GitHub Actions workflow display names — **none of this touches the actual build target for Pages** (`dist/index.html`), so the live deploy path is unaffected. Deliberately left alone: (1) the GitHub repo name (`maciciorjon-hash/thehub`) and Pages URL (`.../thehub/`) — renaming that breaks the live/shared URL and is an external, harder-to-reverse call Jon hasn't made yet; (2) the local folder name `Desktop/The_Hub` — same reasoning, lower stakes but still worth a deliberate decision rather than a silent mid-session rename; (3) the Firebase project id `thehub-f80ae` — renaming a Firebase project isn't a text edit, it's standing up a new project and migrating data, wildly out of scope for a cosmetic rebrand; (4) historical/narrative content that names the old brand as a period-accurate detail — the Ryan-egg comic's "THE HUB — v1.0.35" screenshot text (explicitly version-pinned to an old release) and LabMate's Pip's Story "Chapter VI · The Hub Era" (narrates the app's actual history chronologically) both keep the old name on purpose, same logic as not retconning a real company's old product name out of its own history page. All of `<b>App</b>: category` changelog bullets that mention "Hub" as one of the affected apps were updated to "dHUB" for the current-and-future entries; the legacy pre-v1.0.95 bundle blocks were left alone (pre-existing, deliberately untouched convention, see the changelog-format memory note). Verified via Playwright screenshot against the rebuilt `dHUB.html`: title/nav/home-title/logo-letter/version-string all read "dHUB" correctly.

Previous session: 2026-07-13 (Suite-wide audit — Wave 1 correctness + shared fit-engine reconciliation; v1.3.6)
Hub apps: 15. Version v1.3.6. (All of this day's work is one version bump / one changelog entry — see the versioning rule.)
**Shared curve-fit engine reconciled (Echo canonical).** Jon chose to consolidate the drifted 4PL engines. Measured the drift first: `_4plVal4`/`_gain` identical everywhere, but `_lmFit` differed in all three and `_4plJac4_gain`/`_matInv`/`_solveLin`/`_xAtYMid`/`_fitBest` in some. Analysed every diff: **Lumina's were pure ES6→ES5 rewrites (identical math); Beacon's `_lmFit`/`_4plJac4_gain` were cosmetic (comments/formatting); Beacon's only real algorithmic difference was `_xAtYMid`** (nearest-neighbour vs Echo's interpolation — feeds 1 of 6 multi-start seeds). Verified BEFORE touching files: instrumented Beacon's `_fitBest` in-browser, replayed both test datasets with Echo's `_xAtYMid` → **maxParamDiff=0**. Then reconciled via new **`sync_fit_engine.py`** (copies Echo's canonical functions into Beacon/Lumina by brace-matching), `check_shared.py` now reports no drift. Re-verified: Beacon fits in-browser give the exact intended test values (logEC50=2→100 nM, R²=1); Lumina old-vs-new engine A/B'd in Node on fixed falling+gain data → **maxParamDiff=0.000e+0, r2Diff=0**. **Net: single canonical engine, zero change to any fit output.** Also this day: Degradation Explorer CSV formula-injection guard (`csvSafe`) + guide quadrant-label fix; **`check_shared.py`** drift monitor added. Workflow going forward: edit fit math in Echo only → `sync_fit_engine.py` → verify → `embed.py` (see Shared curve-fit engine section above).
**Spectra nonlinear standard curve (first Wave-3 feature, same day):** added a Linear/Quadratic **Fit** selector to the Std Curve tab. `quadraticRegression` fits `y=ax²+bx+c` via 3×3 normal equations (`_solve3`); a `scPredictY`/`scInvertX` abstraction replaces the old inline `(a-b)/m` so BOTH the Unknowns table and the Plate-Reader absorbance→concentration conversion follow the chosen fit. `scInvertX` solves the quadratic and picks the physical root nearest the standards' concentration range. Renamed `scLinear`→`scFit` ({type,...}). Verified in-browser: linear default R²=0.9997 unchanged; on nonlinear BCA-like data linear R²=0.911 → quadratic R²=0.996; inversion round-trips exactly (x=600→A=0.926→x=600.000). BCA/Bradford are genuinely nonlinear, so this removes interpolation bias.

**Wave 1 (correctness pass — same day):** Full audit of all 15 apps + Hub shell + `embed.py` (three domain-grouped Explore passes; findings + roadmap in `~/.claude/plans/warm-sparking-castle.md`). Decisions with Jon: **keep all apps** (no merges; Fabricata stays an inert easter egg), **de-dupe shared code with Echo as the canonical fit engine** (future wave). **Wave 1 shipped (this session):** (1) **Two 1000× scientific bugs** — A280→mg/mL was overstated ×1000 in **Protein Tools** (`:1338`, `cR*mw*1e3`→`cR*mw`) and **Spectra** (`:890`/`:907`, dropped the stray `*1000`; Guide text `:687` fixed). µM was always right. Verified in-browser: Spectra 0.85 mg/mL (was 850), Protein Tools 0.79 mg/mL for 77.8 µM/~10 kDa. (2) **Spectra**: high-DPI canvases (`sc-canvas`, `plate-canvas`) grew on every redraw because they read `offsetHeight` with no CSS height — pinned CSS `height`/`width` (verified sc-canvas stays 300 across redraws); labelled-plate CSV that starts with row "A" no longer dropped (fixed `firstIsHeader` to not treat an A–H row label as a header, `:1367`); guarded the `localStorage` theme read; heatmap teal `#26a69a`→Nature `#51c3ce`. (3) **esc() hardening** — upgraded to full `&<>"'` in Helix/Lumina/LDI/Degradation/Lab Designer; added an `escJs()` (backslash-escapes for a single-quoted JS string in an inline `on*` handler — HTML-escaping the quote is NOT enough there, the parser decodes it back) and used it for the Lumina sample chip + Degradation compound onclick; Helix `parseFASTA` now strips to `[A-Z]` at the source (kills injection into the ORF map / copy button). Wrapped Degradation's compound/target display in `esc()`. (4) **Iceberg**: `maybeSeedRealData` read `window.parent.isAdmin` synchronously before Firebase resolved → blank inventory; now `seedWhenAdminReady()` retries ~4 s and re-renders on late seed. (5) **Echo**: the rect-select `document` keydown is now bound once (`_attachRectListeners._escBound`) so it can't stack if the overlay is recreated. (6) **Hub**: `arc`/`ribbon` were missing from `ALL_APP_IDS`/`APP_UNLOCK_WORDS`/`HUB_SEARCH_INDEX` (unlock words `cartoon`/`storyboard`; search entries added) — they were always-visible and un-hideable; now consistent. Purged dead search deep-links to removed LabMate **Reference** + **PROTAC** sections; re-pointed **Lab Timers**/**Experiment Planner** to their real `sec-timer`/`sec-planner` and added a `_navToSection` fallback in LabMate's `switchTab` message handler for sections that have no top-nav button. (7) **embed.py** now guards missing source files and asserts exactly one replacement per key (a typo'd key used to ship a blank app silently); deleted empty `Manual_Plate_Reader/` and `dist/`.
**Audit correction — LabMate "2 MB image strip" was a MISREAD and was NOT done:** the ~2 MB of inline images are *legitimate content*, not dead Pip variants — the 6 `.pip-*` PNGs + two JS-assigned PNGs + the header PNG drive the **pip-story** section, and the 9 JPEGs are **cell-line photos** (`cell-card-img`, used by the Cell Lines feature). Stripping them would break real features. `Labmate/RDKit_minimal.js`/`.wasm` are orphaned (0 refs) but **gitignored**, so they're already out of the repo and the built Hub — deleting them has zero product impact (CLAUDE.md RDKit notes updated to say so). PROTAC/Reference dead code (~37 scattered residue refs) left for a later careful pass — cosmetic, risky to bulk-excise in an 11k-line file. Real remaining LabMate size win would be image *recompression* or lazy-loading pip-story, not deletion.

Previous session: 2026-07-12 (Cuppa refresh — last-updated bar, banter, Fraunces, fun-stats polish, admin-gated shame button; v1.3.5)
Hub apps: 15. Version v1.3.5. (One version bump / one changelog entry for the whole day.)
**Admin-gated shame button:** the Wall-of-Shame "Name & shame on Slack" button (`copyWallOfShame()`) is now **admin-only**. Jon wanted the wall kept (it's an established dynamic) but only he should be able to fire the Slack call-out. Added an `if(!isAdmin){ _snitchBlock(); return; }` guard at the top of `copyWallOfShame()`; `_snitchBlock()` shows a custom (non-native) centred pop-up (`#snitch-pop`, built lazily, tap-to-dismiss + 3.2s auto-hide) with a **rotating** playful message from `_SNITCH_MSGS` ("We don't snitch here.", "Put the megaphone down — this one's Jon's job.", etc. — avoids immediate repeats). Admin path unchanged (still copies the Slack message). Verified in-browser as a viewer (`isAdmin=false` → pop-up, no copy).
**Consolidated top bar + banter + fun-stats polish:** three follow-on Cuppa changes. (1) **Consolidated the top bar**: Jon flagged an "excess of banners" when embedded — The Hub's breadcrumb (fine), then *three* Cuppa-level rows (an almost-empty `viewer / Sign in / Settings` header row, the last-updated bar, the tab strip). Moved Cuppa's own controls (`.hdr-right`: role badge, Sign in, Settings, opts gear) out of `<header>` and into `.lastupd-bar`, so the header now holds only branding. Because the controls no longer live in the header, `hub-shell.html`'s `embedStyle` ternary for `cuppa` was simplified to hit the default `header{display:none!important;}` (removed the old `header .logo,header h1,header p` narrow override) — the whole Cuppa header now collapses when embedded, dropping Cuppa from 3 rows to 2 (bar + tabs). The controls stay reachable because the bar is outside the header; the opts gear stays hidden in embed via the shared `common` `.opts-btn{display:none}` injection. **This supersedes the v1.0.95 reasoning** (which kept Cuppa's header partly visible *specifically* so Sign in/Settings were reachable when embedded) — that constraint is gone now that those buttons moved to the always-visible bar. (2) **Rotating coffee banter** in the centre of the bar (`.lu-banter` + `startBanter()`, crossfades every 6.5s through `LU_BANTER`) — Jon asked for motivational banter but **no negative/individual callouts**, so the phrases are all positive and name nobody (kept separate from the pre-existing Wall-of-Shame "name & shame" feature, which was left untouched). (3) **Fun-stats "magic" pass**: the flat counter/fact tiles got icon chips, soft gradients, a spring hover-lift, scroll-in reveal, and **count-up** on the tallies (generalised `_countUp` to handle thousands separators so "~3,535" animates without mangling; `setupFunStatsIO`/`_revealFunEl` now also observe `.stats-counter-box`), plus accent ticks on the chart titles. Browser-verified standalone + embedded, light + dark.

**The core of the day:**
Two changes to **Cuppa**, edited in standalone `Cuppa/cuppa.html`, re-embedded via `embed.py`, browser-smoke-tested in both themes (light + dark) at `localhost:8899`. (1) **Prominent "Last updated" bar**: the timestamp used to live in an 11px `#hdr-status` badge in the header corner that nobody noticed. Replaced it with a full-width bar (`.lastupd-bar`) directly below `<header>` — a clock-in-circle icon, a mono `LAST UPDATED` eyebrow, and the time·date in the Fraunces display face on an `--accent-dim` ground. It sits outside `<header>` on purpose so it survives The Hub's embedded mode (which hides `header .logo/h1/p`). `renderLastUpdated()` now targets `#lastupd-value` instead of the removed badge; still driven by `state.updatedAt`, which is set on every admin save in `saveToFirebase()`, so Jon's manual data updates keep refreshing it automatically. Removed the dead `.lastupd-badge` CSS (definition + the 420px media-query hide). (2) **Editorial typography pass**: a prior "MODERN WEBSITE REDESIGN" block had loaded Fraunces and defined `--display:'Fraunces'` but never wired it into the UI (every title/number stayed on IBM Plex Sans; `--display` was only used in a canvas chart). Added a scoped block applying `var(--display)` to the true display surfaces — `header h1`, `.welcome-title`, `.stat-val`/`.stat-mini-val`/`.stats-counter-num` (with `tabular-nums`), `.table-title`/`.wos-title`, `.fun-stats h2`, the WoS total, and the empty states — while body text, tables, and labels stay on the sans. Jon liked this exact serif-display treatment from an artifact mockup and asked to bring it into Cuppa. Both changes verified rendering correctly against live Firebase data.

Previous session: 2026-07-06 (Ribbon audit / optimization pass)
Hub apps: 15.
Full code audit + optimization of **Ribbon** (protein structure renderer, 3Dmol.js) — edited standalone `Ribbon/ribbon.html`, re-embedded into The Hub via `embed.py`, committed + pushed to `main` (commit `8b4876b`). Correctness fixes: guarded fetch responses with a request-sequence token (`_reqSeq`) so a stale in-flight PDB load can no longer overwrite a newer one; fixed chain selection-dimming for blank chain IDs (was a truthiness bug — `selectedChain` can be `''`, now `selectedChain!==null`); `computeChains` seeds from polymer atoms (`{hetflag:false}`) only, so water/ligand-only chains don't consume a by-chain colour slot or become clickable; `recolorStructure` rebuilds the surface once (new `_surfaceTopologyStale()`) when a per-chain colour override lands on a unified spectrum/SS surface (previously the override hit only the cartoon underneath). Performance: chain select/deselect now takes the cheap recolour path instead of recomputing SES meshes (it was doing a full surface rebuild **twice** per click in surface mode); the label-callout `requestAnimationFrame` loop idles when no tags exist and restarts from `renderLabelTags`. Visual/UX: `.top-bar` wraps (`flex-wrap`) instead of `overflow-x:auto` scrolling the reset/export buttons off-screen in the ~760–950px band; theme toggle now shows sun/moon and persists to `localStorage`; HSL Light slider max tightened 170→150 so the default (100) sits at the true midpoint; non-selected chain surfaces now dim on selection (previously only the cartoon dimmed, so clicks read poorly in surface mode). Cleanup: removed dead `.viewer-toolbar` CSS and the hidden `#exportLabels` checkbox; merged the duplicated surface-material loop into `applySurfaceMaterials()` and the two bg-key mappings into `_setViewerBg()`; dropped the `state._lsShape`/`_lsBgMode` temp-on-state hack (`segHandler` now passes the clicked value straight to its callback). Enhancements: **mmCIF fallback** — on a `.pdb` 404, retry `.cif` (`addModel(text,'cif')`) so large/newer entries without a legacy PDB file load; persist + auto-restore the last-viewed structure on load instead of dropping to the empty state; new label tags stagger diagonally so they don't stack. Not yet browser-smoke-tested — the mmCIF-fallback parse on a large structure and the surface-mode selection dimming are the two behaviours worth eyes-on.

Previous session: 2026-07-01 (Lumina setup/output overhaul; v1.3.4)
Hub apps: 13. Version v1.3.4.
New app since the last logged session: **Lumina** (dose-response curve fitting, plate-grid input) was added and then taken through a full setup/output pass in one continuous day, all bundled together since these are all same-day iterations on one app rather than separate efforts:
- Setup modal restyled to match Echo's visual system throughout: section labels/grids, a drag-and-drop dropzone for the PHERAstar/GloMax reader file (replacing a bare file input), grid-based control-well picker (click wells directly on the plate instead of typing a range), auto-suggested next start well when adding successive compounds, and a one-click "Load test plate example" synthetic demo. Setup now opens automatically on load.
- Setup tabs renamed/reordered/iconified to Echo's Files/Assay/Analysis/Output convention, then further consolidated after review: Assay type + control-well marking moved into the Layout tab (a standalone Assay tab was too sparse on its own), and a new Output tab lets the user toggle which result columns (Top/Bottom/Hill/Dmax-Span-Emax/R²/Max SD/Flags) appear in the results table, Excel export, and TSV copy — Sample ID and the primary potency metric are always included.
- New: assay-aware DC50/IC50/EC50/Dmax/Span/Emax naming throughout (results table, chart axes, Excel headers) matching Echo's `_csvColMap` convention; Excel export now bundles Prism (%) and Prism (fraction) sheets, plus standalone "Copy results (TSV)" / "Copy Prism (%)" / "Copy Prism (fraction)" clipboard buttons; a "% of control / Raw signal" toggle on the Curves view.
- Plots/Curves/Plate were merged into one Visualization tab with an internal sub-nav, since Lumina's output is much smaller than Echo's and three separate top-level tabs left mostly-empty screens.
- Bug fixes: removed a browser confirm() popup on compound removal (now a silent toast); the Setup modal no longer visually jumps position when switching tabs (card height was auto-sizing per-tab while centered via flexbox — now fixed height).
Colors switched to the shared Nature palette across the whole session (accent f5c518→ffbf7b, accent2 0079b9→5e87c5, accent3 00c896→51c3ce), including previously-hardcoded chart/heatmap colors.
Also fixed: `.claude/settings.json`'s Stop hook pointed at a stale OneDrive path instead of this repo's `.claude/stop-hook.sh`, so the session log had gone stale silently for several versions (v1.2.3–v1.3.3 shipped with no log entries) — corrected to `$CLAUDE_PROJECT_DIR/.claude/stop-hook.sh` so future sessions auto-log again. Note: the hook script itself only writes a terse "Last session: DATE / Hub apps: N / Hub file size: X" stub (no narrative) — it will overwrite this detailed entry with that stub the next time it fires, same as it's always done; the auto-generated stub is only a starting point, not a replacement for a written summary like this one.

Previous bundle: v1.2.3 → v1.3.3 (2026-06-23 to 2026-06-30, undocumented at the time due to the stale-hook-path bug above — reconstructed from commit history)
Beacon (formerly NanoBRET Calculator) built out and renamed: Setup modal with Files/Assay Info/Plate Map sub-tabs, PHERAstar import, drag-paint dose-series Plate Map, auto-derived Endpoint/QC background-vs-DMSO pairing, Tracer Titration one-site-binding fit, Report tab, Excel export (Results/Plate Map/Assay Protocol/PHERAstar Protocol/Prism Copy), lite mode, embed-corruption fix (bundled SheetJS was breaking srcdoc embedding), scientific audit (Cheng-Prusoff Ki, tracer Kd fix, axis labels, error bars). Lab Designer: Excel-like keyboard navigation (v1.2.9), inline editing + square wells + sans-serif labels (v1.3.0), Illustrator-style color picker with Nature-palette swatches (v1.3.1). Suite-wide "Audit v1.3.2"/"Audit v1.3.3" passes: 5-app correctness/UX fixes, then full Nature palette rollout to Echo/Spectra/Beacon/Lab Designer/LabMate (shared swatches: #e36c69 salmon, #51c3ce teal, #5e87c5 blue, #ffbf7b orange, #816baf purple, #a56983 dusty pink, #c5c5c5 grey) plus a Spectra A260/A280 threshold fix (1.7→1.8, per literature), then LDI/Protein Tools got the same Nature-palette pass.

Previous bundle: v1.1.0 → v1.2.2 (Rounds 83–93, 2026-06-18 to 2026-06-22)
New app Iceberg/Cryostorage added (round 64) then seeded with Jon's real freezer/cryo-tank inventory + XLSX grid-template import/export (round 83). Echo: fixed a stray `</div>` collapsing the Plots tab's chart height (round 84). LabMate: unified 8 separate "grid→detail" navigations into one shared renderToolGrid() data-driven pattern, widened mobile/tablet breakpoint to 900px, fixed inconsistent back-button labels and a dead chip-render call (round 85); fixed an embedded-mode back-nav bug, widened mobile home grid to 2 columns, removed Pip mascot illustrations from always-visible UI (round 86); moved Cell Lines into its own sub-panel, replaced 9 mobile section icons with SVG (round 87). Suite-wide audit Phases A–C: mobile touch-target fixes across all apps + Hub logo SVG consistency (round 88); ~39 tab-navigation icons redesigned as line-pictograms across 9 apps (round 89); desktop density quick-fixes — max-width caps, sticky table headers, auto-fill grid fixes (Tier 1, round 90); desktop layout rework — Degradation Explorer empty-state CTA, Protein Tools chart divider, Spectra font bump (Tier 2, round 91); Guide-tab content icons added across 6 apps, Protein Tools Target Intel regrouped, Cuppa stat-card weight rebalanced (Tier 3, round 93). Firebase RTDB security fix (round 92): removed hardcoded legacy database secret from client JS in hub-shell.html and Cuppa, converted admin writes to Firebase Auth SDK, added version-controlled `database.rules.json`. Known accepted residual risk: the leaked legacy RTDB secret itself cannot be revoked (Firebase removed all console UI for this years ago) — see Firebase integration section above, don't re-flag without checking that note first.

Previous bundle: v1.0.11 → v1.0.68 (Rounds 45–82, 2026-06-11 to 2026-06-18)
