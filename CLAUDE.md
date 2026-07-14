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
| `echo` | Echo (formerly Labcyte Echo / Echo Data Analysis) | SVG bar chart | `#ff5760` | `Labcyte_Echo/labcyte_echo.html` |
| `lm` | LabMate | SVG flask | `#e08c30` (amber) | `Labmate/labmate.html` |
| `deg` | Dora (formerly Degradation Explorer) | SVG curve | `#7c6fd4` | `Degradation_Explorer/degradation_visualizer.html` |
| `pd` | Blueprint (formerly Lab Designer) | SVG wells | `#0079b9` | `Plate_Designer/plate_designer.html` |
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

## Session log
<!-- AUTO-UPDATED by .claude/stop-hook.sh — do not edit this section manually -->
<!-- LAST_SESSION_START -->
Last session: 2026-07-14 (Echo backfill vehicle wells + changelog cleanup + rebrand to dHUB + app renames; v1.3.7)
Hub apps: 15. Version v1.3.7. (All of this day's work is one version bump / one changelog entry — see the versioning rule.)
**Echo Gradient Planner backfill calculator now accounts for DMSO-only (vehicle) wells.** Jon pointed out the existing intermediate-plate backfill calculator (`_egBfCompute`, `Labcyte_Echo/labcyte_echo.html`) only summed the DMSO shortfall of compound-dosed wells (`maxT - vAdj` per dose point) — it missed that real runs also include wells filled with **only DMSO** (no compound) at the same max-transfer volume as the highest-dose well, used to homogenize final DMSO% across the whole destination plate (vehicle/homogenization controls). Since those wells get zero compound transfer, their *entire* volume comes from backfill DMSO, not just a shortfall — a bigger contribution than any compound well's partial top-up. Added a new **"DMSO-only (vehicle) wells"** input (per set, default 0 for exact backward compatibility) next to the existing compound/sets/replicates fields; `vehicleBackfillNL = nVehicle*nSets*maxT` is now added to `totalBackfillNL` alongside the pre-existing `compoundBackfillNL`, and vehicle wells are added to `destWellsNeedingBackfill`. Both the live calculator output and the Copy-summary text now break out the compound-vs-vehicle contribution when vehicle wells > 0. Verified via Playwright against the standalone file: with the default gradient loaded, 4 vehicle wells/set at maxT=40 nL added exactly 160 nL (4×40) on top of the existing 775 nL compound backfill for a 935 nL total; leaving the field at its default 0 reproduces the prior numbers exactly (775 nL, 20 dest wells needing backfill) — confirmed no regression for existing users who don't use vehicle wells.
**Changelog cleanup.** The in-app "What's new" panel had drifted back into detailed paragraph-style bullets (v1.1.1–v1.3.7, 25 entries). Jon: "shorten the log entries A LOT... if we have added new stuff write (added new features), if there are bug fixes just write bug fixes." Rewrote that whole range to the terse `<b>App</b>: new features` / `<b>App</b>: bug fixes` / `<b>App</b>: visual updates` style already used for v1.0.95 and older (no mechanism/rationale in-app — that still lives here and in git history). Also caught and merged several same-calendar-day version bumps that had never been day-grouped (29 Jun had 4 separate entries, 24 Jun had 4, 22 Jun had 4, 21 Jun had 3, 20 Jun had 3) into one entry each. Explicitly asked and confirmed: this terseness rule applies to the in-app changelog only, **not** to this Session log, which keeps its detailed style on purpose.
**Rebrand: The Hub → dHUB.** Jon is thinking bigger-picture — positioning this suite as a centralized TPD (targeted protein degradation) ops platform, potentially sellable to other labs, with the Data Analysis pack (Echo/Beacon/Lumina/Degradation Explorer/LDI) as the flagship. First step: rename "The Hub" to "dHUB" (pronounced the same, "d" now standing for Degradation) everywhere user-facing. Changed: page `<title>`, favicon (H→d), nav logo box + `#nav-title`, home hero `.hub-title`, `.opts-version` label, changelog `<b>Hub</b>` mentions, "Back to Hub" tooltips, the Ryan-easter-egg comic's `regg-title`, plus code comments in Cuppa/Iceberg that explained embed behavior in terms of "The Hub." Renamed the build output `The Hub.html` → `dHUB.html` (updated `embed.py`'s default `OUT`, `.gitignore`, `CLAUDE.md`) and the GitHub Actions workflow display names — **none of this touches the actual build target for Pages** (`dist/index.html`), so the live deploy path is unaffected. Deliberately left alone: (1) the GitHub repo name (`maciciorjon-hash/thehub`) and Pages URL (`.../thehub/`) — renaming that breaks the live/shared URL and is an external, harder-to-reverse call Jon hasn't made yet; (2) the local folder name `Desktop/The_Hub` — same reasoning, lower stakes but still worth a deliberate decision rather than a silent mid-session rename; (3) the Firebase project id `thehub-f80ae` — renaming a Firebase project isn't a text edit, it's standing up a new project and migrating data, wildly out of scope for a cosmetic rebrand; (4) historical/narrative content that names the old brand as a period-accurate detail — the Ryan-egg comic's "THE HUB — v1.0.35" screenshot text (explicitly version-pinned to an old release) and LabMate's Pip's Story "Chapter VI · The Hub Era" (narrates the app's actual history chronologically) both keep the old name on purpose, same logic as not retconning a real company's old product name out of its own history page. All of `<b>App</b>: category` changelog bullets that mention "Hub" as one of the affected apps were updated to "dHUB" for the current-and-future entries; the legacy pre-v1.0.95 bundle blocks were left alone (pre-existing, deliberately untouched convention, see the changelog-format memory note). Verified via Playwright screenshot against the rebuilt `dHUB.html`: title/nav/home-title/logo-letter/version-string all read "dHUB" correctly.
**App renames (same rebrand push):** three apps got new short names matching the Echo/Beacon/Lumina/Ribbon/Arc one-word convention — `Labcyte Echo`/`Echo Data Analysis` → **Echo**, `Degradation Explorer` → **Dora** (Jon's own pun, "Degradation" + "the Explorer"), `Lab Designer` → **Blueprint** (covers both its plate-layout and gel-diagram design work). Updated everywhere current: home cards, `APP_INFO`, `HUB_SEARCH_INDEX` (old names kept as extra search keywords so old muscle memory still finds them), the current-range changelog bullets, and each app's own `<title>`/header self-reference (`Labcyte_Echo/labcyte_echo.html`'s `<h1>`/setup-modal title/Guide heading, `Degradation_Explorer/degradation_visualizer.html`'s `<title>` — which had actually drifted to "Degradation Visualizer", a third, inconsistent name, before this fix — and its `updateMeta()` fallback label, `Plate_Designer/plate_designer.html`'s `<title>`/`.app-name`). Left alone on purpose: legacy pre-v1.0.95 changelog bundles and narrative/historical content (same reasoning as the dHUB rebrand), and the on-disk folder/directory names (`Labcyte_Echo/`, `Degradation_Explorer/`, `Plate_Designer/`) — renaming those is a bigger git-mv operation with no user-facing payoff, deferred unless Jon asks.

**MERGED TO MAIN (2026-07-14, still v1.3.7 — no version bump, see the versioning rule):** built out to a full 31-protocol migration (up from an initial 3-protocol proof-of-concept prototype — see below for what changed between passes). `Protocols/protocols.html` (app id `protocols`, accent `#a56983`) is a card-grid-per-protocol app with **Protocol / Calculate / Output** tabs, wired into the shell like any other app (`embed.py`, `APP_INFO`, `ALL_APP_IDS`, `PACKAGES` under Molecular Biology, `HUB_SEARCH_INDEX`, home card, `app-view` iframe, unlock word `benchwork`). Built on `feature/protocols-suite`, fast-forward merged to `main` and pushed once Jon reviewed and asked to publish; the in-app changelog's existing v1.3.7 entry got one added bullet (`New app: Protocols`) rather than a fresh version bump, since v1.3.7 already represents today's work per the one-bump-per-day rule.

**Pass 1 (prototype, superseded):** 3 protocols (Simple Dilution, Gibson Assembly, Western Blot) to prove the pattern before investing further. Jon's review: liked the style, but flagged two concrete problems — "los output son malos, el pdf es muy feo y esta mal" (the outputs are bad, the PDF is ugly and wrong) — and asked for the full migration, excluding LabMate's Quick Calc section (generic calculators like Simple Dilution — those stay in LabMate for now), classified by knowledge branch, combining near-duplicate protocols.

**Root cause of the PDF bug:** jsPDF's built-in fonts only cover WinAnsi/CP1252 — arrows (→), the real minus sign (−), subscript digits (₂), and Greek letters (α) all silently mis-render as garbage glyphs, and — worse — the resulting glyph-width mismatch was corrupting jsPDF's own line-spacing calculations, producing the "letters spread apart" look Jon saw. **Fix: replaced jsPDF entirely with a print-based export** (`exportProtocolPDF` now builds a hidden `#print-root` clone of the Protocol tab + any calculated values, adds a `body.printing` class that a `@media print` block uses to hide everything else, and calls `window.print()`). This gets full Unicode for free from the browser's own text engine — no font table to maintain — and it visually matches the on-screen design exactly since it IS the on-screen markup, just restyled for paper. The "↓ PDF" button is now labelled "🖶 Print / Save as PDF" to be honest about the mechanism. jsPDF's `<script>` tag was removed entirely (one fewer CDN dependency). Verified the exact bug is gone: printed a protocol containing arrows/subscripts/Greek letters (TR-FRET, which has both), confirmed the injected `#print-root` HTML contains real `α` and `<sub>` markup rather than any character substitution.

**Pass 2 (full migration):** re-ran the same content audit (this time reading every remaining section directly rather than via subagent, since I already had the file's structure) and migrated all of Mol Biology, CRISPR, Cell Biology, Proteomics, Genomics, Structural Biology, and Biophysics — **32 protocols total**, organized into 7 category filter pills (dropped the "Calculators" pill entirely, per the exclusion). Removed Simple Dilution from Protocols (it belongs to Quick Calc, which stays in LabMate for now — Jon said "ya veremos cómo organizarlos luego"). **Combined near-duplicates as asked:** LabMate had two separate protocols — "CRISPR KO via PX458 Transfection" and "Knock-in — PX458 + Plasmid Donor" — that shared byte-for-byte identical calculators (`calcBbsIDigest`/`calcPX458HiFi`, both already accepted an id-prefix parameter in the original, evidence they were always meant to be reusable). Merged into one **"CRISPR Cloning (PX458 Vector)"** protocol: one shared Part 1 (clone gRNA into PX458, one calculator), then a "Path A — Knockout" / "Path B — Knock-in" fork covering only the genuinely different downstream steps (transfection reagent amounts, donor design, screening). Confirmed via the code (not guessed) that this was safe: both source protocols called the exact same functions with the exact same math, just different narrative around them. Left "Electroporation (CRISPR RNP)" and "Knock-in — RNP Electroporation + ssODN" as two separate protocols — they share a topic (RNP delivery) but materially different content/specificity (one is the lab's general SOP, the other is HDR-donor-specific design + genotyping guidance), not "practically identical" the way the PX458 pair was. Skipped LabMate's orphaned/dead `proto-ki` (a third, UI-unreachable "combined" Knock-in write-up, confirmed via the earlier content-audit subagent) rather than resurrecting unclear-provenance content.

Of the (then-)32: **9 are calculators** (Gibson, Restriction Cloning, CRISPR Cloning/PX458, BCA & Sample Prep, HiBiT Lytic, CellTiter-Glo 2.0, Transfection, S-Trap, MiSeq PCR) each with a full Protocol/Calculate/Output flow; **23 are reference-only** (no Calculate tab) spanning Transformation/Miniprep/NucleoSpin, gRNA Design/Electroporation/ssODN-KI/Single-Cell Sorting, Immunoprecipitation/HiBiT-Blotting/Lentiviral-Transduction, DIA-NN/Perseus, Gene-Sequence-Retrieval, all 6 Structural Biology protocols (PDB/AlphaFold/PyMOL×2/Pockets/Ternary-Complex-Modelling), and all 3 Biophysics assays (TR-FRET/FP/SPR) — the last two categories are dense, TPD-specific reference material (Cheng-Prusoff, cooperativity α, ternary complex kinetics) that reads as genuinely flagship-quality content for the "sell this to other labs" framing. Output tab now also has a CSV/Excel button (Blob-download, no SheetJS dependency) wherever a calculator produces genuine tabular output (Gibson, BCA, HiBiT Lytic, CTG2, Transfection, S-Trap, MiSeq) — skipped for the two multi-calculator-box protocols (Restriction Cloning, PX458) where "which table" would be ambiguous; PDF/Print and Copy-as-text cover those instead. All 32 verified via Playwright: every protocol opened + (if present) Calculate tab exercised + Output tab exercised with zero console errors; spot-checked math correctness (BCA, Restriction Digest/Ligation, combined PX458 BbsI+HiFi) against the original LabMate formulas; caught and fixed one genuine bug during testing — a copy-pasted emoji in the AlphaFold pLDDT color legend (🟦 light-blue square) had the wrong decimal HTML entity (`&#129462;`, decodes to an unrelated codepoint) instead of the correct `&#128998;` — screenshotted the fix to confirm all four confidence-color emoji now render correctly.

**Pass 3 (visual audit + CRISPR dropdown unification, same review round):** Did a real interactive-browser pass (claude-in-chrome against a local `python3 -m http.server`, not just synthetic Playwright screenshots) over the home grid, dark mode, and several protocols, and fixed what it found: a CSS specificity bug where `.search-box input{padding-left:34px}` was being overridden by a later equal-specificity `input[type="text"]{padding:7px 10px}` (search icon overlapped the placeholder text) — fixed by raising specificity to `.search-box input[type="text"]`; a broken printer emoji on all 32 Output-tab buttons (`&#128438;`, the obscure "PRINTER WITH RIGHT ARROW" codepoint with poor font support → tofu box) → standard `&#128424;` PRINTER emoji; `text-transform:uppercase` was folding the micro sign "µ" to Greek capital Mu, so "20 µL reaction" rendered as "20 ML REACTION" in 3 spots (2× `.calc-box-title` in the PX458 protocol, 1× `.proto-section` in TR-FRET) — replaced `&micro;L` with plain `uL` there, matching the file's dominant convention; and missing CSS for `.proto-part`/`.proto-day`/`.proto-day-badge`/`.proto-day-label` (markup ported from LabMate's PX458 write-up but the styles never came with it), which rendered as unstyled run-together text — added the missing rules. Mid-audit, Jon asked for a bigger structural change: **"unifica los protocolos necesarios y pon dropdown menus... si quieres hacer un knock out, la card es CRISPR knock out y dentro ya elegimos si queremos electroporation o con el plasmido"** — one card per *experiment*, not per delivery method. Replaced the three separate CRISPR cards (CRISPR Cloning/PX458, Electroporation/RNP, Knock-in RNP+ssODN) with two: **CRISPR Knockout** and **CRISPR Knock-in**, each with a `.delivery-bar` dropdown (PX458 plasmid vs RNP electroporation) that toggles paired `.method-branch[data-pid][data-method]` divs across all three tabs (Protocol/Calculate/Output) via a new `setMethodBranch(pid, method)` + `_methodState` map. The PX458 calculators (`calcBbsIDigest`/`calcPX458HiFi`/`renderPX458Export`/`generatePX458Steps`) already took an id-prefix parameter from the Pass-2 merge, so this reused that mechanism with two new prefixes (`ko-`/`ki-`) instead of inventing a new one — each card's inputs and results are fully state-isolated (verified: filling in the Knockout card's calculator leaves the Knock-in card's fields untouched). `genSteps()` for these two cards returns `null` (not `[]`) when the RNP branch is selected, since RNP has no calculator — `refreshExportPanel` was adjusted to treat a falsy return as "no calculator" so the Output tab shows the correct fallback message instead of a misleading "fill in the Calculate tab" note. The delivery-method dropdown itself is hidden from the printed/PDF output (`#print-root .delivery-bar{display:none}`) and the export's `.print-meta` line now states which delivery method was exported — printing already correctly excluded the hidden branch's content for free, since `setMethodBranch` toggles the branches' *inline* `style.display`, which `innerHTML` naturally carries into the print clone. Net protocol count: 32 → **31** (three cards → two). Verified end-to-end in a real Chrome tab: dropdown swaps content on both cards, both calculators compute correctly and independently per prefix, Output tab reflects the active branch (calculator steps for PX458, no-calc note for RNP), zero console errors on load or interaction.

**Pass 3 continued — full interactive visual audit, all 31 protocols:** finished walking every protocol card in a real Chrome tab (not just Playwright) — all 21 reference-only cards' Protocol tab, and all 10 calculators' Protocol/Calculate/Output tabs, including re-verifying the pLDDT emoji fix and the new CRISPR dropdown cards. Zero console errors across the entire pass. **Caught one real math bug along the way**: CTG2's `calcCTG()`/`generateCTGSteps()` (`Protocols/protocols.html`) used `fmt(x, 0)` in several places expecting "no decimal places," but `fmt()`'s second argument is *significant figures* (`n.toPrecision(d)`, `d=Math.max(1,Math.round(d))`) — `fmt(x,0)` therefore rounds to **1 significant figure**, not zero decimals. Harmless when the value already had 1 leading sig fig (e.g. 100→100), but silently wrong otherwise: with the default 3 plates × 80 wells × 100 µL × 1.1 excess, the reagent-needed cell showed "26 mL" in the Value column but "**30000** uL (incl. 10% excess)" in the Notes column for the same number — the true value is 26400 uL. Fixed by switching those specific calls to `Math.round()`, which is what the code actually meant; left every other `fmt(x, 2/3/4)` call alone since 2-4 significant figures reads correctly for their default inputs and wasn't the pattern that broke. **Lesson: `fmt(x, 0)` anywhere in this file is a latent version of this same bug — grep for it before reusing the pattern in a new calculator.**

**Mobile audit, Protocols absolute priority (2026-07-14, same day):** Jon asked to "re analyze everyhting para movil... prioridad absoluta protocols." **Tooling note**: this sandbox's `resize_window` (and CSS `zoom`) both hit a hard floor around 517px viewport width — could not get a literal true-phone (~375px) screenshot. Worked around it by (1) testing everything real at the achievable 517px width, and (2) for anything narrower, forcing a DOM element's own `width`/`max-width` via `element.style.cssText` to reproduce the exact box-model math a real narrow viewport would produce, then checking `scrollWidth > clientWidth` / `scrollHeight > clientHeight` for objective overflow detection (not just eyeballing) — since `element.style.width` doesn't change `window.innerWidth`, this method verifies layout math but does NOT itself trigger real `@media` breakpoints, so breakpoint CSS was written and then separately confirmed to be *correct as authored*, not observed firing live in-browser at true phone width. **Two real bugs found and fixed in `Protocols/protocols.html`**: (1) `header{height:58px}` (fixed height) combined with an unconstrained subtitle `<p>` — at narrow widths the subtitle wraps to 2 lines, needs more than 58px, and since `height` (not `min-height`) doesn't let a box grow, the wrapped text visually overflowed past the box and — because `header{position:sticky}` — permanently overlapped whatever content sat below it while scrolling. Confirmed via `scrollHeight` (57) baked at the *unwrapped* single-line height while the rendered content clearly needed more. Fixed by changing to `min-height:58px` (verified this alone stops the overlap — box now grows instead of clipping) plus, as compact-header polish, a new `@media(max-width:480px){header p{display:none}}` (keeps the header a tidy single line on real phones instead of just "less broken but still tall"). (2) The CRISPR Knockout/Knock-in `.delivery-bar` (label + native `<select>` in one `display:flex` row, no `flex-wrap`) — a `<select>` resists shrinking below its widest `<option>` text's intrinsic width by default (flex items have `min-width:auto`), so at a 343px-wide container (≈375px phone minus padding) the bar measured `scrollWidth:410` vs `clientWidth:341` — a genuine 69px horizontal overflow, confirmed by direct measurement before any fix existed. Fixed with `@media(max-width:480px){.delivery-bar{flex-wrap:wrap} .delivery-bar select{width:100%;max-width:none}}` — re-measured after the fix: `scrollWidth` dropped to exactly `clientWidth`, confirmed zero overflow, bar wraps to label-then-full-width-select instead. Also added in the same pass, lower-confidence/less rigorously verified but low-risk: `.proto-grid{grid-template-columns:1fr}` at ≤480px (mostly redundant with the existing `auto-fill,minmax(230px,1fr)` — belt-and-suspenders), `.proto-table{overflow-x:auto}` as a defensive wrapper (no actual overflowing table found in testing — none of the app's tables use `white-space:nowrap` or unbreakable tokens, so cell text already wraps safely), and a modest touch-target padding bump on `.dtab-btn`/`.btn`/`.btn-sm`/`.filter-pill` at ≤480px (not measured against a specific failure, just brought closer to the ~40-44px guideline). **Final verification**: zero `document.documentElement.scrollWidth > window.innerWidth` across home grid, a calculator protocol (all 3 tabs), a wide-table protocol (PyMOL), and a dense-content protocol (TR-FRET) at the achievable 517px width; zero console errors.

**Suite-wide pass, "arregla todos los bugs que conozcas" (same day):** Jon asked to fix everything flagged in the survey above. Correction to that survey first: the earlier "no subtitle `<p>`" read for 8 apps was a false negative — those apps use a `<div class="app-sub">` instead of `<p>` for the header subtitle, not no-subtitle-at-all, so the actual risk pool was all 12 other apps, not 2. Applied `height`→`min-height` on the `header{...}` rule (`Arc/arc.html`, `Beacon/beacon.html`, `Cryostorage/cryostorage.html`, `Cuppa/cuppa.html` (54px, not 58px), `Helix/helix.html`, `Labcyte_Echo/labcyte_echo.html`, `LDI/ldi.html`, `Lumina/lumina.html`, `Plate_Designer/plate_designer.html`, `Protein_Tools/protein_tools.html`, `Ribbon/ribbon.html`, `Spectra/spectra.html`) plus a `@media(max-width:480px){header .app-sub{display:none}}` (or `header p{display:none}` for the 4 apps using `<p>`) in each. **Before applying anything, checked whether each app already had protection further down the file** rather than assuming the Protocols bug generalized uniformly — it didn't: **9 of the 12** (Cryostorage/Iceberg, Cuppa, Helix, Labcyte_Echo/Echo, LDI, Plate_Designer/Blueprint, Protein_Tools, Ribbon, Spectra) already had their own `white-space:nowrap;overflow:hidden;text-overflow:ellipsis` treatment on the subtitle at `@media(max-width:720px)` plus a hide-entirely rule at `@media(max-width:420px)` from an earlier mobile-audit pass — meaning `height:58px` was never actually unsafe there (ellipsis prevents wrapping at any width below 720px, so the box never needed to grow). My added rules are redundant-but-harmless for those 9. **Only 3 apps had zero prior protection**: Arc, Beacon, Lumina. Verified via direct DOM measurement (force `header` to a 375px box with the *old* `height:58px`, compare `scrollHeight` vs `clientHeight`) rather than assuming: **Beacon genuinely broke** — its subtitle is 93 characters, the longest in the whole suite ("Gain-of-Signal & Tracer Displacement · Plate Map · Z′/Z · dose-response · tracer titration"), wrapped to 3 lines and overflowed past the fixed-height sticky header exactly like Protocols did; confirmed the fix resolves it (`scrollHeight` back to matching `clientHeight`). Arc (50 chars) and Lumina (47 chars) did NOT actually overflow even unprotected — short enough to fit — so these were hardened proactively rather than fixed for an active bug. **Net result: one more real, confirmed-broken app found and fixed (Beacon); two apps (Arc, Lumina) given the same protection defensively; nine apps got a harmless no-op.** Also checked the 3 remaining apps not in the original 12-app survey: **LabMate** has no fixed `height` on its header at all (`flex-direction:column`, auto height) — never had this bug, nothing to fix. **Dora/Degradation Explorer** has no `<header>` element in its markup at all (top bar is `.tabs`, not header+subtitle) — not applicable; its mobile-breakpoint `header{padding:0 12px}` rule is pre-existing dead CSS (targets a selector that matches nothing) but causes no harm, left alone. **Fabricata** has a header with no subtitle text (just logo + title + a "Beta" badge) — no wrap risk, not touched (inert easter egg, lowest priority). **`hub-shell.html`'s own `#hub-nav`** also uses fixed `height:58px`, but its title span already uses `text-overflow:ellipsis` (never wraps) and its search/settings controls are separately width-constrained — already correctly handled, not touched. Rebuilt `dHUB.html`, zero console errors on Beacon/Iceberg/Arc/Lumina spot-checks post-fix.

**Known transitional state, not yet cleaned up:** none of the 31 migrated protocols' content has been removed from LabMate yet (Jon said to leave LabMate's non-Quick-Calc sections alone for now too, pending this review) — so `HUB_SEARCH_INDEX` still has some overlapping entries between LabMate and Protocols for the same topics. **Next steps, only after Jon reviews and approves:** remove the migrated sections from LabMate (Mol Biology/CRISPR/Cell Biology-minus-Cell-Lines/Proteomics/Genomics/Struct-Bio/Biophysics), dedupe the search index, decide what happens to LabMate's own Quick Calc section long-term ("ya veremos"), then treat the whole thing as a normal version bump + changelog entry + merge to `main` + push. **To revert entirely:** `git checkout main` — nothing on `main` has been touched at any point in this branch's history.

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
