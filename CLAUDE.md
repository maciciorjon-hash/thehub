# The Hub

> Auto-updated section at bottom. Static content below is maintained manually.

---

## Project overview

**The Hub** is the primary product (`The Hub.html`). It is a **self-contained** single-file launcher: all app HTMLs are base64-encoded and embedded directly inside it. Opening `The Hub.html` alone gives access to every tool, no other files required.

**Individual standalone files** also exist in their subfolders and are kept in sync — they serve as standalone versions of each app.

**Location:** `Desktop › The_Hub › The Hub.html`  
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

---

## Architecture & workflow

**The Hub is self-contained.** Each app's HTML is base64-encoded and stored inside `APP_B64` / `APP_B64_NEW` in The Hub's `<script>` block. When you open an app, it is decoded with `decodeB64App()` and rendered in an `iframe.srcdoc`. This means:

- **The Hub alone** = complete product (no folder structure needed).
- **Individual app files** = standalone versions, kept manually in sync.
- When you change an individual app file, you must **re-run the Python embed script** to regenerate The Hub.

```
The_Hub/
├── The Hub.html                              ← self-contained, ~7.79MB
├── hub-shell.html                            ← source-of-truth shell (~28KB)
├── embed.py                                  ← build script
├── Labcyte_Echo/
│   └── labcyte_echo.html
├── Degradation_Explorer/
│   └── degradation_visualizer.html
├── Labmate/
│   ├── labmate.html
│   └── RDKit_minimal.js / .wasm             ← used when folder is present
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

### Regenerating the self-contained Hub after app changes

**`embed.py`** reads from `hub-shell.html` and fills in each app's base64. Run from `The_Hub/`:

```bash
python3 embed.py                      # → The Hub.html  (local/offline use)
python3 embed.py dist/index.html     # → dist/index.html  (CI/Pages build)
```

The key regex is `[^"]*` (not `[A-Za-z0-9+/=]+`) to avoid the PLACEHOLDER suffix bug.

### GitHub Actions auto-deploy

**Repo:** `https://github.com/maciciorjon-hash/thehub` (private)  
**Pages URL:** `https://maciciorjon-hash.github.io/thehub/`

On every push to `main`:
1. GitHub Actions runs `python3 embed.py dist/index.html`
2. Deploys `dist/` to GitHub Pages
3. Hub is live at the Pages URL within ~2 min

**Local dev workflow:**
```bash
# 1. Edit any standalone app file
# 2. Rebuild locally
python3 embed.py
# 3. Open The Hub.html to test
# 4. Push → Pages auto-rebuilds
git add Labcyte_Echo/labcyte_echo.html hub-shell.html CLAUDE.md
git commit -m "Fix: description"
git push
```

**Files tracked in git:** `hub-shell.html`, `embed.py`, `.gitignore`, `.github/`, all standalone app HTMLs, `CLAUDE.md`, `database.rules.json`/`firebase.json`/`.firebaserc` (Firebase RTDB security rules, deployable via `firebase deploy --only database` if the CLI is installed — see Firebase integration section)  
**Files NOT tracked:** `The Hub.html` (generated), `dist/`, `Labmate/RDKit_minimal.*`

### Hub shell structure

```
hub-shell.html / The Hub.html
├── <script>APP_B64{echo,deg,lm}</script>         — base64-encoded app HTML
├── <script>APP_B64_NEW{dna,pd,pt,spectra,ldi}</script> — base64-encoded app HTML
├── #hub-nav       — nav bar: H logo + "The Hub" + theme toggle + lab/settings btns
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
└── easter egg     — 5-click on H logo (when on hub home)
```

**Navigation:** The Hub's H logo (`#hub-logo`) acts as back button when inside an app — no button injected into app iframes.

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

## Hub home design

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

**LabMate RDKit paths:** Hub injects `<base href="{hubLocation}Labmate/">` into LabMate's `<head>` so `./RDKit_minimal.js` resolves correctly if the Labmate folder is present. Falls back to CDN otherwise.

**Same-origin srcdoc:** `srcdoc` iframes with `allow-same-origin` are same-origin as the Hub. `localStorage` and `window.parent` calls work.

**LabMate active sections (v0.9.96):** Favourites · Calculators · Mol Biology · Cell Biology · CRISPR · Proteomics · Biophysics · Struct Bio · Genomics. PROTAC Tools and Reference removed.

**Plate Designer mobile:** `.sel-toolbar` anchored to `top:58px` on mobile with `max-height:calc(100vh - 80px); overflow-y:auto` so it never covers the plate canvas.

**Favicon:** SVG data URI in `hub-shell.html` `<head>` — dark rounded square with white "H", matches nav logo.

**`labBtn.style.display`:** Must be set to `'inline-block'` (not `''`) — a CSS rule hides it by default and `''` doesn't override it.

---

## Session log
<!-- AUTO-UPDATED by .claude/stop-hook.sh — do not edit this section manually -->
<!-- LAST_SESSION_START -->
Last session: 2026-07-01 (Lumina setup/output overhaul; v1.3.4)
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
