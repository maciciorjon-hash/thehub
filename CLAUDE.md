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
| `ldi` | LDI | `LD` text | `#e91e63` | `LDI/ldi.html` |

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
└── LDI/
    └── ldi.html
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

**Files tracked in git:** `hub-shell.html`, `embed.py`, `.gitignore`, `.github/`, all standalone app HTMLs, `CLAUDE.md`  
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

**Lab config SSE** (`/labconfig.json`): controls which app cards are visible to non-admin users. Admin writes via PUT with `?auth=SECRET`. All sessions receive updates in real time via `EventSource`.

**Announcement banner** (`/announcement.json`): admin posts a message from the Lab panel; appears as a fixed 40px banner below the nav for all active sessions. Dismissible per browser session (tracked via `sessionStorage`). Posting an empty string clears the banner.

**Authorized domains** (Firebase console → Auth → Settings): must include `maciciorjon-hash.github.io` for Google sign-in to work on Pages.

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
Last session: 2026-06-11 (Round 56: Changelog reorganised into 0.1-increment bundles)
Hub apps: 8. Version v1.0.22.
hub-shell.html changelog restructured per user request: post-v1.0 entries grouped into 0.1-increment bundles (v1.0 → v1.1 = v1.0.0–v1.0.9; v1.1 → v1.2 = v1.0.10–v1.0.21). Only the current version (v1.0.22) stays as an exact detailed entry. Rolling rule going forward: when a new patch lands, fold the previous "exact" entry into the most recent bundle, OR start a new bundle (v1.2 → v1.3) when patch number crosses the next decade boundary.

Previous session: 2026-06-11 (Round 55: Echo 4PL — "Free" truly unbounded; v1.0.21)
Echo: removed hidden safety bounds on "Free" parameters in the 4PL fitter. Previously when the user picked "Free" Echo silently used Top [50,200], Bottom [-20,100], Hill [0.1,5.0], LogEC50 [x_min-1, x_max+1]. Now Free = ±Infinity in LM bounds (truly unconstrained, matches Prism). Applied at runAnalysisJS lines ~2168 and fit4PL_JS (interactive curve editor) lines ~6695. User-supplied constraints still honoured: Fixed-at-X stays tight, Dmax cap and Bottom-≥-floor become explicit lower bounds. _fitBest gains a fallback: when logEC50 LM bounds are ±Infinity, the 5-seed multi-start range falls back to xMin-1/xMax+1 derived from xArr (so seeds stay data-anchored even with unbounded LM). _lmFit's clamp function already handles ±Infinity correctly (Math.max/min). Audit blocks (Protocol tab + XLSX Data Analysis Protocol sheet) updated: "Free, unbounded" replaces "Free, bounded [X, Y]"; Bottom row dynamically reports actual lower bound when Dmax cap or minBot floor is active, with reason in parentheses.

Previous session: 2026-06-11 (Round 54: λ factor matched to Prism; multi-start restored)
Echo: reverted v1.0.19. _fitBest restored to 5-seed multi-start, best R² wins (Ryan reported deterministic init made the Prism gap WORSE, not better — multi-start was actually closer). _xAtYMid helper removed. ADDITIONALLY: LM damping factor changed in _lmFit from /3 ×3 to /10 ×10 to match Prism's reported schedule. λ init (0.001) unchanged. Audit blocks (Protocol tab + XLSX) updated: restored "multi-start 5 seeds" wording, added new "LM damping (λ)" row spelling out init=0.001, /10 on success, ×10 on failure.

Previous session: 2026-06-11 (Round 53: Echo 4PL fitter — Prism deterministic init; reverted in Round 54)
Echo: _fitBest in labcyte_echo.html (around line 1900) rewritten — dropped the 5-seed multi-start logEC50 loop, now runs LM exactly once. New helper _xAtYMid(xArr, yArr) computes Prism's deterministic logEC50 seed: YMID = (min Y + max Y) / 2, then walks sorted-by-X data, finds the first consecutive pair that brackets YMID, linearly interpolates X at the crossing. Fallback to midpoint of X range when Y is flat or no bracket found. Top / Bottom / Hill initial values were already aligned with Prism (Top=YMAX, Bottom=YMIN at line 2168/2178; Hill=1.0 — Echo's parameterisation always keeps Hill positive with the assay direction baked into the model formula choice, so Prism's ±1 sign convention doesn't apply here). Audit blocks in renderProtocol() and protocolRows AoA in generateOutputXLSX updated: "single deterministic seed" replaces multi-start wording, new "Initial values (Prism heuristic)" row added.

Previous session: 2026-06-11 (Round 52: Egg trigger fix; v1.0.18)
Hub: setupRyanEgg keystroke listener was bailing whenever any input had focus, so typing "alessio" in the search bar (the obvious place) never accumulated. Removed the input/textarea/select bail; now relies on currentApp check (iframe focus already blocks document keydowns anyway) and skips keys with modifier keys held. Also added a hidden search-index entry {id:'__egg__'} for "alessio / ryan / easter egg / cartoon / behind the scenes" — hubSearchGo intercepts that id and calls showRyanEgg() instead of openApp(). Two entry-points now: type "alessio" anywhere (search bar OK) or search for it.

Previous session: 2026-06-11 (Round 51: Ryan/Alessio cartoon easter egg added)
Hub apps: 8. Version v1.0.17.
Hub: added third easter egg in hub-shell.html. Trigger: typing "alessio" anywhere on the hub home (no input focused, no app open). Opens #ryan-egg-overlay containing an inline SVG cartoon of Jon, Claude, Ryan with speech bubbles and a milestone ticker covering the major fixes from v0.7 → v1.0.16. CSS for #ryan-egg-overlay added next to glootie CSS. JS setup function setupRyanEgg() listens via document keydown, ignores when typing in form fields, buffers last 7 chars and matches "alessio". Coexists with the existing 5-click (egg-overlay) and 10-click (glootie) eggs on #hub-logo.

Previous session: 2026-06-11 (Round 50: Echo 4PL fitter convergence matched to Prism)
Hub apps: 8. Version v1.0.16.
Echo: _lmFit at labcyte_echo.html:1858 — convergence rewritten to mirror GraphPad Prism's "log(inhibitor) vs response — Variable slope" defaults. New criterion: relative SSR change |ΔSSR|/SSR < 1e-6 (medium) then auto-tighten to < 1e-9 (strict) once medium is met; first time strict is met, break. Old criterion (max(|Δp|) < 1e-8) removed. All four _fitBest callers (lines 2174, 2185 in runAnalysisJS for free-top / fixed-top; 6662, 6668 in interactive curve editor) bumped maxIter from 200/300 to 1000 to match Prism's cap. Audit blocks in renderProtocol() and protocolRows AoA in generateOutputXLSX updated to the new wording. Other Prism-matching settings (least-squares regression, unweighted SSR, each replicate as individual point) were already in place — only convergence needed changing.

Previous session: 2026-06-11 (Round 49: Source Plate survey reader bug fix)
Hub apps: 8. Version v1.0.15.
Echo: parseSurveyCSV / renderSurveyPlate (labcyte_echo.html:7837, 7904) — Survey Fluid Volume was being interpreted as nL and divided by 1000 (it's actually µL per Echo spec), so every well rendered red as "below min working volume". Picklist Transfer Volume IS in nL — that path unchanged. parseSurveyCSV also rewritten to use named column-header indices (plate type / barcode / plate name) instead of regex-on-col[0], which previously failed to pick up `384PP_DMSO2` from the data rows since the type sits in column index 2, not 0. plateName now prefers the barcode column (e.g. "RP-001") over the redundant "Source Plate[1]".

Previous session: 2026-06-11 (Round 48: Protocol tab linked to XLSX audit block)
Hub apps: 8. Version v1.0.14.
Echo: renderProtocol() at labcyte_echo.html:2899 — added "Fitting Model" + "Fit Bounds (this run)" sections mirroring the XLSX Data Analysis Protocol sheet exactly. Two views now linked: anything in the XLSX FITTING MODEL/FIT BOUNDS sections also appears in the in-app Protocol tab.

Previous session: 2026-06-11 (Round 47: Echo Ryan-round-2 — 5 fixes)
Hub apps: 8. Version v1.0.13.
Echo changes (labcyte_echo.html):
- Task 2: Removed `{showReps:true}` override at line 6911 in scatter→curve preview's `_cpCfg` so the Curves Style Mode toggle (Mean±SD vs Individual reps) now propagates to the dual-curve preview opened from clicking a scatter dot.
- Task 1: Gain-of-Signal labels — stripped '%' from `Emax (%)` → `Emax` at sites 2458, 2756, 3670, 3692, 6864 (and 2581 CSV header `Emax_pct` → `Emax`). Curves Y-axis at 6394 for gain now reads "Signal (a.u.)" (was "FRET Ratio (subtracted)"). Scatter→curve preview meta `_cpAssayMeta.gain.yLabel` also updated to "Signal (a.u.)".
- Task 4: Removed Setup→Output "Generate dose-response curve PDFs" checkbox (line 733) and the auto-call at line 1578. Added `generateAndDownloadCurvePDFs()` wrapper before `generateCurvePDFs`. Replaced the per-PDF button iteration in both `renderResults` (single-assay) and `renderMultiAssayResults` with a single `📄 Generate curve PDFs` button (`id="cv-pdf-gen-btn"`) that shows `⏳ Generating…` during run, auto-downloads on success. Dropped `{showReps:true}` override in `generateCurvePDFs` cfg merge at line 5615 so PDFs honour the Mode toggle.
- Task 5: Scatter Colour and Size dropdowns (lines 3727-3743) now generate options from `window._scatterAxisOpts` instead of hardcoded single-assay column names — so in multi-assay mode `hibit::DC50_nM` etc. show up and `r[colorBy]` resolves on pivoted rows. Kept the `Group`/`Fixed` first option for "no gradient".
- Task 3: Extended `protocolRows` in `generateOutputXLSX` with new "─── FITTING MODEL ───" and "─── FIT BOUNDS (this run) ───" sections — equation per assay type, Prism-equivalent form, algorithm/loss/replicate handling/convergence, and the actual bounds in force for the run (Top/Bottom/Hill/LogEC50). Investigation only — NO fitter changes this round (user decided audit-only). EDA-013 gap (app 7.2 vs Prism 7.417) traced to subtle LM implementation differences (replicate layout, bestP tracking, convergence/lambda strategy) — not Top constraint (user uses Top=100 in Prism too) and not logEC50 clamp (potent compound stays inside the clamp).

Previous session: 2026-06-11 (Round 46: changelog condensed; Round 45: Echo Ryan-round-1)
Hub apps: 8 (echo, lm, deg, pd, dna→Helix, pt, spectra, ldi) [unchanged]
Version v1.0.11
Echo changes (labcyte_echo.html):
- Control-well picker `applyCtrlPicker` (line ~7405): removed `cols.length<=4 && rows.length<=16` gate so wide rectangles (e.g. N2:O23, 22×2) are emitted as range syntax, not comma list.
- Control-well parser `_parseCtrlRange` (line ~1612): comma branch now pipes through `_stdWell` so wells like "N2" are zero-padded to "N02", matching the rest of the pipeline. Previously cols 1–9 silently dropped from analysis (e.g. N2:O23 input → only N10:O23 reached plates tab).
- Results XLSX `generateOutputXLSX` (line ~2708): multi-assay mode now builds a pivoted AoA — Sample ID rowspan=2 + per-assay column groups (assay name spans cols in header row 1, column names in header row 2). Single-assay path unchanged. Applies `!merges` for the assay-name spans.
- Results buttons (Copy TSV / Results XLSX / Raw CSV / Curve PDFs): moved out of `.meta-row` into their own centered flex-wrap row so they never get clipped off the right edge. Same treatment applied to multi-assay renderer; bonus, multi-assay results now show Raw CSV and Curve PDFs (previously only single-assay showed them).
- Properties tab structures cut: v1.0.9's global `table{table-layout:fixed;width:100%}` rule was hitting `.props-table` and squeezing the Structure column. Rule now scoped to `.results-tbl-scroll table`. `.props-table` falls back to its own `auto` layout so the 150×110 SVG gets full content width.
- Curves Mean±SD/Individual toggle moved from toolbar button (`#cv-pts-btn`) into the Style panel (`#cv-custom-panel`) as a Mode select. Standalone button removed; `toggleCvPoints` kept as no-op for safety.
<!-- LAST_SESSION_END -->
