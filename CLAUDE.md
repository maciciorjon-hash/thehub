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
Last session: 2026-06-14 (Round 76: Cuppa v6 — last-sync display + CSV import; v1.0.45)
Hub apps: 10. Version v1.0.44.
Cuppa/cuppa.html changes:
- Paginated Monzo fetch: loadMonzoData() now loops up to 20 pages of 100 transactions each (max 2000 total), using the `since` parameter incremented by 1ms from the last transaction's created timestamp. Previously a single request capped at 100, silently missing earlier months for labs with >100 annual transactions.
- autoApplyMonzoPayments(txns): called inside loadMonzoData() after all pages collected. Filters incoming (amount>0), matches description to member via findMemberForTxn(), divides amount by price tier to get nMonths, marks consecutive unpaid months starting from the transaction's own calendar month as paymentSource:'auto'.
- reApplyStoredMonzo(): works on state.monzo.expenses (cached Monzo data) without needing a fresh token. Processes each stored expense the same way as autoApplyMonzoPayments but reads e.date (YYYY-MM-DD) instead of t.created. Calls render() + saveToFirebase('monzo re-apply') + toast with count.
- "↻ Re-apply all" button (id=exp-reapply-btn) added to Expenses table header next to the existing Refresh button. Shown when state.monzo.expenses has entries. Allows recovering months that pre-dated the auto-apply feature without requiring a fresh Monzo token.
- hub-shell.html: bumped to v1.0.44, new changelog entry added.

Previous session: 2026-06-13 (Round 71: orphan SVG cleanup; v1.0.37)
hub-shell.html: previous round's egg rewrite left 130 lines of stale SVG content (old <defs>, gradients, JON/CLAUDE/RYAN character groups, speech bubbles, milestone text, stats ticker, regg-bubble div) dangling between the new comic modal's closing </div></div> and the next <script> block — rendering as visible debris on the hub home. Deleted lines 1110–1239. Also removed the empty <svg id="regg-secret-dot-source"> placeholder that was left from the rewrite scaffolding. node --check passes. grep for the removed IDs (regg-stat / regg-bubble-name / regg-ryan-alias) returns 0.

Previous session: 2026-06-13 (Round 70: 4-panel comic rewrite; v1.0.36)
hub-shell.html: previous easter egg was buggy (CSS transform:translate on SVG <g>s doesn't work with hover; speech-bubble positioning was off; interactivity inconsistent). Wholesale rewrite as a multi-panel comic.
- CSS: .regg-panel uses opacity + translateX(40px) transitions between panels (NOT SVG hover transforms). Animations confined to small targeted elements via transform-box:fill-box (.regg-eye blink, .regg-pulse-dot fade, .regg-float subtle Y-bob).
- HTML: 4 self-contained <div class="regg-panel"> entries, each holding its own <svg> with the panel's scene. Title bar with panel counter; dot navigation row; prev/next nav buttons; footer with hint.
- Panel 1 — Origin story: lab setting (window with stars, reagent shelf, lab bench, 96-well plate, laptop with terminal showing blinking cursor). Jon character with lab coat + Dundee Lab badge, glasses, curly hair, blinking eyes. Speech bubble asking Claude for help. Caption.
- Panel 2 — Enter Ryan: full email window mock-up with traffic-light buttons, "Hi Alessio," in red, the actual feedback body. Jon's thought bubble: "...wait. Who is Alessio? my name is Jon." Claude terminal saying "it me. they mean me."
- Panel 3 — Bug parade: 10 fix tickets (5 columns × 2) each with severity tag (CRITICAL/MAJOR/UX/FEATURE/MOBILE), description, and a green ✓ stamp. Big rotated "RESOLVED" stamp. Caption "every email was a new bug. every bug got squashed. — push."
- Panel 4 — Hub today: aurora-gradient bg, 9 app icons in a grid with their accent colours and letter monograms. Iceberg highlighted with floating animation + cyan outline + "✦ Iceberg" label. Final caption "…and the saga continues."
- JS: REGG_PANEL_COUNT, _reggPanel index, reggGoTo(idx) toggles .curr/.prev/.next classes on panels (CSS handles slide+fade), updates dot active state, prev/next button [disabled] state, panel counter. reggNav(±1) wrapper. Keyboard ←/→ arrow handlers attached on open, removed on close. Touch swipe (>50px) on .regg-panel-wrap navigates. closeRyanEgg removes the keydown listener and resets state. Hidden confetti: click the red traffic-light dot in title bar 7× within 2.5s → reggConfetti() drops 80 multi-coloured particles.
- All hub-shell.html JS passes node --check after the rewrite.

Previous session: 2026-06-12 (Round 69: hardware-back + LabMate mobile + first egg upgrade; v1.0.35)
Hardware back integration (phone back button walks up one nav level instead of leaving browser):
- hub-shell.html openApp pushes {_hubApp: id} state; popstate listener detects currentApp and calls backToHub. backToHub itself calls history.back() unless invoked from popstate (guard via _backPopping flag).
- Cryostorage/cryostorage.html: added _navStack + pushNavLevel(closeFn) + popNavLevel() + popstate listener. Wired into openBoxDetail (closes box detail), openAddVial (closes vial form modal), openEditVial (same), openBulkAdd, openAddRack, openAddBox. UI close buttons (closeBoxDetail etc.) call popNavLevel which triggers history.back; popstate runs the closer.
- Labcyte_Echo/labcyte_echo.html openSetupModal at ~9103: added _initial flag. The on-page-load auto-open call now passes (true) so it doesn't push state (Hub already pushed one for opening Echo). Manual reopens via ⚙ Setup do push state. popstate listener closes the modal if open. closeSetupModal calls history.back unless _setupModalPopping.
LabMate mobile nav rework (agent-built):
- New mobile-only header: orange .mob-back-btn (44px tap target, animated chevron) + breadcrumb #mob-breadcrumb showing "Section › Sub-section" with fade animation. Visible only at ≤700px and only when not at the mobile nav home.
- LM_SECTION_LABELS map labels each top-level nav. _lmCurrentLeafLabel() derives the sub-label by inspecting open .proto-entry / qc-panel / assay-panel.
- _lmNavStack + pushNavLevel + popNavLevel + popstate listener (mobile-only via _lmIsMobile() check). Wraps switchNav, switchNavGroup, mobGoTo, mobShowSubGroup, mobGoHome, showProto, showProtoHome (raw exposed as showProtoHomeRaw), _navToSection, showQcTool/showQcHome, showAssayTab/showAssayHome, showProtacTab/showProtacHome, showRefTool/showRefHome. Top-level changes RESET the stack; deeper navigation PUSHES a level whose closer returns to that section's home.
- _lmMobNavBack() (back button click) calls popNavLevel; falls back to original mobBack for the drawer/grid path. Quick Notes / command palette / drawer untouched - they don't touch _lmNavStack so phone-back doesn't close them spuriously.
Alessio easter egg upgrade in hub-shell.html:
- CSS animations: Claude eye blink + antenna pulse via @keyframes; reggStagger class for stagger-fade of milestone checkmarks; reggPop modal entrance with cubic-bezier spring; reggConf confetti drop animation.
- New interactive elements: regg-jon/regg-claude/regg-ryan groups all become clickable (regg-clickable class with hover lift). Click triggers reggBubble() with a random phrase from JON_PHRASES / CLAUDE_PHRASES / RYAN_PHRASES. Ryan also rotates his alias on click.
- Auto-rotation timers (cleared on close): Ryan's alias every 3.2s through RYAN_ALIASES (12 entries including "anyone", "Jon", "Hi Claude"); stats ticker every 4.4s through STATS_LINES (7 entries with Hub trivia).
- Hidden inside-egg: tap the antenna red dot (#regg-antenna) 7 times → reggConfetti() drops 60 multi-coloured particles. Counter shows progress in tooltip.
- Subtitle now reads v1.0.34 (auto-updates in changelog); milestone ticker rewritten to cover all the wins through v1.0.34 including Iceberg, mobile audit, Fletcher λ, square PNG.
All 9 source HTMLs pass node --check after edits. embed.py rebuild succeeds 9/9.

Previous session: 2026-06-12 (Round 68: horizontal panning fix; v1.0.34)
Pattern across all apps: top-level layout containers (main, .content, .panel, .tabpane, #app-body, sometimes html/body) had overflow:hidden as the desktop "scroll-inside-inner-divs" pattern. On mobile, this trapped wide content (Echo results tables, scatter charts, plate canvases, sequence displays) inside their parent — user couldn't pan sideways.
Fix per app, added inside the existing @media (max-width:720px) block:
- Echo: main + .tabpane + .tabpane.active + .results-tbl-scroll all overflow:auto.
- LabMate: .content overflow-x:auto !important, .main overflow:auto.
- Plate Designer: html/body + .panel + .plate-scroll-area + .plate-canvas-wrap overflow:auto.
- Helix: html/body + .content + .panel overflow:auto.
- Protein Tools: html/body + .content overflow:auto.
- Spectra: html/body + .content + .plate-wrap + .plate-table-wrap overflow:auto.
- LDI: html/body + #app-body overflow:auto.
- Degradation Explorer: html/body overflow:auto.
- Iceberg: main + .tab-pane + .table-wrap overflow:auto.
All include -webkit-overflow-scrolling:touch for iOS momentum scroll. Desktop behaviour unchanged (rules only fire at ≤720px).

Previous session: 2026-06-12 (Round 67: cross-app mobile polish; v1.0.33)
Mobile media queries appended to each app's CSS (only ADDED rules; existing untouched; per-app selectors confirmed via grep before emitting):
- Labcyte_Echo/labcyte_echo.html @ line 385: header chrome tighten, .outer-tabs horizontal scroll, .setup-overlay/card → full-screen on mobile, .setup-2col → 1-col, .scatter-toolbar/.cv-toolbar/.plate-toolbar wrap, .stbtn min-height 32px, .mcard 2-up then full-width, .props-table tighter padding, .field input 36px min-height. (hover:none) kills hover transforms on .stbtn/.outer-tab/.mcard.
- Labmate/labmate.html @ line ~1781: .header-top padding, .section padding cap, .calc-box/.proto-home-card padding tighten, inputs/textareas 38px min-height, .qn-area/.search-wrap full width, .mem-row wrap, .btn/.sb-btn 38px touch + tap-highlight-color none, .mob-nav-btn bumped to 48px min-height (was unset).
- Plate_Designer/plate_designer.html @ line 175: header/tabs scrollable, .top-bar wraps, .fmt-pill/.type-btn touch sizing, .plate-scroll-area/.plate-canvas-wrap responsive, .gd-layout 1-col on mobile, .gd-ctrl/.gd-preview stack, .sel-toolbar adapts, .hist-wrap stack, .guide-panel sized, .btn 36px.
- LDI/ldi.html @ line 209: header tighten, .tabs-bar scroll, .tab-btn 38px, .card padding tighten, .params-strip wraps, .charts-row 1-col, .stat-grid 2-col, .thresh-row wraps, generic input/select 36px. (Note: file was post-modified by linter; mobile block intact.)
- Helix/helix.html @ line 176: header/tabs scrollable, .row 1-col, .tools-grid/.vec-grid 1-col, .vec-card padding, .vec-map-wrap responsive, #vec-modal full-screen, .stat-table tighter, .seq-disp tighter, .range-wrap full width, .opts-panel right:8px;left:8px on mobile, .btn/.copy-btn 36px.
- Degradation_Explorer/degradation_visualizer.html @ line 261: header tighten, .tab scroll, .chart-container responsive, .scatter-controls wrap, .props-table-scroll horizontal scroll with min-width 560px on .props-tbl, .detail-grid 1-col, .btn/.btn-theme/.pt-btn 36px, .load-panel responsive.
- Spectra/spectra.html @ line 253: header tighten, .tabs scroll, .tab-indicator tracks, .card padding, .row 1-col, .res-grid 1-col, .res-item padding, .plate-upload-zone responsive, .plate-wrap/.plate-table-wrap responsive scroll, .curve-canvas-wrap responsive, .heatmap-legend wraps, .ratio-result-row wraps, .std-table tighter, .field 36px.
- Protein_Tools/protein_tools.html @ line 155: header/.app-name/.app-sub tighten, .tab-indicator, .card padding, .res-grid 1-col, .conc-row wraps, .chart-wrap responsive, .ti-search-row/.ti-cols/.ti-col stack, #struct-viewer-card min-height:340px (NOT 100vh — header overlap), #struct-ngl-viewport min-height:280px, .pep-table tighter, .opts-panel right:8px;left:8px.
All 10 source HTMLs pass node --check after edits. embed.py rebuild succeeded: 9/9 base64 replacements, 0 placeholders.

Previous session: 2026-06-12 (Round 66: Iceberg mobile; v1.0.32)
Iceberg (Cryostorage/cryostorage.html) mobile polish:
- Two media-query blocks added at end of <style>: @media (max-width:720px) and @media (max-width:420px), plus @media (hover:none) for touch.
- 720px breakpoint: header padding/font tightened, subtitle ellipsised; tabs padding/height reduced; tab-pane padding 24→14; toolbar tb-search drops to its own row (order:99, flex-basis:100%); view-tabs margin-left:0; stats-row 2-col; rack/box padding tightened; box grid minmax 130; detail-overlay padding 0 + card full-viewport (height:100vh, border-radius:0) so modal feels native; modal-overlay same treatment; vial-form collapses to 1-col with .span2 fields normalised; icon-btn bumped 26→34 for thumb tap targets; well-grid-wrap gets overflow-x:auto + -webkit-overflow-scrolling:touch so wide grids scroll; .well gets touch-action:manipulation to suppress 300ms double-tap zoom.
- 420px breakpoint: tab counters hidden, stats and box grid drop to 2-col strict, header subtitle hidden.
- Touch (hover:none): suppress .well/.box-card hover transform so taps don't feel "stuck".
- renderBoxDetail (line ~789) reads window.innerWidth and picks grid-template cell minmax/maxmin per breakpoint: <480 = 32-44 / 22px row label; <720 = 30-46 / 22px; else = 28-44 / 24px. Wider grid + scroll wrap means a 12-col box always has reachable cells on a 360px phone.
- renderBoxDetail also gates the hover tooltip on window.matchMedia('(hover:hover)').matches; on pure-touch devices the mouseenter/leave/move listeners are not attached. The tap still opens the edit modal which surfaces the same fields, so no info is hidden — just the floating tooltip.
- Resize listener (180ms debounce) re-flows the well grid on orientation change so portrait→landscape recovers cleanly.

Previous session: 2026-06-12 (Round 65: PNG export scaling; v1.0.31)
Echo (labcyte_echo.html):
- cvDownloadPNG (line ~6447) now passes 5 export-only multipliers into drawMultiCurve: _exportPointMul=4, _exportLineMul=4, _exportFontMul=5, _exportLegendMul=4, _exportBoldTitle=true.
- drawMultiCurve at line ~6507 picks them up as _pMul/_lMul/_fMul/_legMul/_titleW (defaults 1 / '500' so on-screen renders unchanged):
  * Axis tick labels font * _fMul; tick mark stub length * _lMul; tick stroke width * _lMul (lines ~6585, ~6593).
  * Axis border lineWidth (1.5) * _lMul (line ~6602).
  * Axis titles ("Signal (% DMSO)" / "log10[concentration, M]") font * _fMul; X-title vertical offset * _fMul to keep clearance (lines ~6606-6613).
  * Curve fit lineWidth (2 or 2.5) * _lMul (line ~6657).
  * ptSz = (cfg.pointSize||5) * _pMul (line ~6638) — propagates to all point-shape draws.
  * Chart title weight = _titleW (bold for export) and font * _fMul (line ~6768).
  * Legend: swatch width * _legMul, font * _legMul, text/offset gaps * _legMul (lines ~6774-6782).

Previous session: 2026-06-12 (Round 64: New app Iceberg; v1.0.30)
New app: Iceberg (id: cryo, accent #00acc1).
- File: Cryostorage/cryostorage.html (~1800 lines, self-contained, SheetJS via CDN for XLSX).
- Two tabs: −80°C and Liquid N₂, each with rack → box → vial hierarchy.
- Boxes are configurable (rows×cols, default 8×12 = 96-well). Box card shows fill bar coloured by dominant cell line + 96-cell preview grid.
- Click box → modal with full well grid. Hover well → floating tooltip (cell line, passage, freeze date, freeze media, culture conditions, frozen by, vial count, notes). Click empty well → add vial. Click filled well → edit.
- Vial fields: position, cellLine, passage, freezeDate, freezeMedia, cultureMedia, frozenBy, vialCount, notes. Cell-line autocomplete from prior entries.
- Table view: Excel-style, sortable on every column, live search filter (cell line / position / box / rack / notes / media / by).
- Stats row per tab: total vials, cell lines tracked, capacity %, oldest vial.
- Bulk add: paste tab/comma-separated rows, header auto-detected.
- XLSX export (both tabs as separate sheets) + XLSX/CSV import (auto-detects column headers, creates racks/boxes by name if missing).
- Cell-line colouring: deterministic hash → HSL for consistent palette across views.
- Theme via hub_theme localStorage, postMessage switchTab listener for Hub deep-links.
- LocalStorage persistence under key 'cryo_state_v1'.
Hub integration: embed.py APPS list gained `('cryo', 'Cryostorage/cryostorage.html')`; hub-shell APP_INFO + APP_B64_NEW gained `cryo`; card + view + iframe added; 3 HUB_SEARCH_INDEX entries (main, −80, N₂). Hub apps count goes from 8 → 9.

Previous session: 2026-06-12 (Round 63: max iter 1000 + square PNG; v1.0.29)
Echo (labcyte_echo.html):
- 4PL maxIter raised 200 → 1000 at both _fitBest call sites in runAnalysisJS (lines ~2233, ~2244) and both call sites in fit4PL_JS interactive editor (lines ~6823, ~6829). Audit blocks updated.
- Curves canvas display reverted to v1.0.26 sizing (responsive flex:1 wrap, canvas width:100%/height:100%) — user said the on-screen display was fine; the square change in v1.0.27 was unwanted.
- cvDownloadPNG (line ~6447): now builds the export canvas so the PLOT AREA (X-axis length === Y-axis length) is square. Uses drawMultiCurve's hardcoded padding constants (PAD_L=62, PAD_R=28, PAD_T=32, PAD_B=52) plus a target pw of max(cssW-90, cssH-84, 320) to give expCssW = pwTarget + PAD_L + PAD_R, expCssH = pwTarget + PAD_T + PAD_B. The canvas itself is slightly asymmetric (because the padding around the axes isn't square) but the data plot area is true square.

Previous session: 2026-06-12 (Round 62: all 4 Gemini fitter suggestions; v1.0.28)
Echo 4PL fitter (_lmFit + _fitBest + runAnalysisJS pInit):
- Multi-start (`_fitBest` around line 1932): seeds expanded from 5 evenly-spaced to 6 = 5 evenly + 1 X-at-YMID (linear-interpolated X where data crosses (Ymin+Ymax)/2). `_xAtYMid` helper reintroduced (was added in v1.0.19, removed in v1.0.20). Catches the "all 5 seeds in flat region" failure mode.
- Fletcher / Madsen-Nielsen adaptive λ in `_lmFit`: on accepted step, λ ×= max(1/3, 1 − (2ρ−1)³) where ρ = (curSS − newSS) / (½·δᵀ(λ·δ + Jᵀr)). On reject, λ ×= 2. Replaces the fixed ÷3 / ×3.
- Gradient-norm convergence as primary: at top of each iter, break if max(|Jᵀr|) < 1e-8 × (1 + |bestSS|). Catches the flat-valley case where |Δp| can shrink below 1e-8 while gradient is still meaningful (Gemini's #4 - the most likely real cause of the visual mismatch). |Δp| backup tightened to 1e-10.
- Robust pInit Top/Bottom: median of top-3 / bottom-3 Y values (`_yMinRobust`/`_yMaxRobust` computed at line 2160), replacing raw `yMin2`/`yMax2` in the 4-param and 3-param pInit. Single noisy extreme no longer biases the starting curve.
- Audit blocks (Protocol tab + XLSX Data Analysis Protocol) updated to spell out all four mechanics.

Previous session: 2026-06-12 (Round 61: Flagged scope + Plate Flag per-assay + Curves square; v1.0.27)
Echo (labcyte_echo.html):
- Flagged checkbox in multi-assay (line ~3993): now scoped to ONLY the assays currently shown on the scatter's X/Y axes. Extract assay prefix from xKeyRaw/yKeyRaw; filter on `<assay>::Flag === 'Yes'` for those specific assays. A compound flagged in a different (not-plotted) assay no longer hides.
- Plate "Colour by Flag status" (drawPlateCanvas, line ~7407): _plateFlagMap rebuilt as {sampleId: {assayType: flag}} instead of flat {sampleId: flag} (which lost data when scatterData iteration overwrote across assays — every plate ended up showing the last-iterated assay's flag). Each plate now resolves its own assay type via window._lastAnalysisParams.matConfigs (matching by prefix), then looks up the correct flag. Single-assay falls back to '_' key. Plate legend at line ~7564 gained a 'flag' mode case (Flagged red, Passed green, Control teal, No fit grey).
- Curves canvas (line 286 + line ~5987): wrap now centers contents; #cv-canvas uses aspect-ratio:1/1 with max-width/max-height:100% so the canvas renders as a square (previously stretched to fill the wrap's full 16:9-ish rectangle, making curves look shallow).

Previous session: 2026-06-12 (Round 60: 4PL revert + 5 fixes; v1.0.26)
Echo (labcyte_echo.html):
- 4PL fitter rolled back to v0.9.96 behaviour: _lmFit uses max(|Δp|) < 1e-8 convergence + 200 iters; λ factor /3 ×3; runAnalysisJS bounds restored to safety guardrails (Bottom [-20,100], Hill [0.1,5.0], LogEC50 [xMin-1,xMax+1], Top [50,200] when free); fit4PL_JS interactive editor mirrors. User reported the Prism-matching push (v1.0.16/20/21) made the curves look worse. Audit blocks in Protocol tab + XLSX restored to v0.9.96 wording.
- Curve PDF picker: generateAndDownloadCurvePDFs at line ~5649 now opens a modal listing distinct (assay, protein) groups with checkboxes. Single-group runs skip the modal. generateCurvePDFs groups by (_assayType, Protein) in multi-assay mode (was Protein only), so each PDF covers ONE curve type. Filenames include assay (Results_<assay>_<assayType>_<protein>.pdf). Page title also includes assay type.
- Plots default in multi-assay: renderScatter at line ~3748 now computes _defXKey / _defYKey BEFORE rendering. In multi-assay mode with ≥2 assays: X = firstAssay::LogIC50_M, Y = secondAssay::LogIC50_M. Templated into the X/Y select options as the `selected` attribute.
- Plots Flagged checkbox in multi-assay: line ~3993 was reading r.Flag (undefined on pivoted rows). Now checks Object.keys(r).some(k => k.endsWith('::Flag') && r[k] === 'Yes') in pivot mode.
- Plate tab "Colour by Flag status" (drawPlateCanvas, line ~7407): replaced the per-well SD outlier check (which used a green that looked identical to the control-well green) with a compound-level Flag lookup. window._plateFlagMap built lazily from scatterData; reset to null at line 1571 alongside _plateFitMap. Red = Flag==='Yes'; muted green = passed; neutral = no result.
- Curves Compare: added #cv-compare-search input above #cv-compare-list. buildCompareList reads the value and filters by Sample_ID.toLowerCase().includes(searchQ).

Previous session: 2026-06-12 (Round 59: LabMate cheminfo removed; v1.0.25)
LabMate: removed orphan "cheminfo / Compound Lookup" feature. Was entirely dead code — scaffolded CSS classes (.chem-search-row, .chem-results-grid, .chem-struct-wrap, .chem-view-toggle, .chem-props-table, .chem-ro5-row/chip/pass/fail/na, .chem-iupac, .chem-pubchem-link, .chem-prop-section, .chem-hint), JS functions (chemCopySmiles, _chemblXref, chemEditClose), Marvin JS edit modal (#chem-edit-modal with iframe), but NO HTML section ever instantiated them and NO call site invoked the functions. Cleaned all references: sidebar label maps at lines ~8030 & ~10963; sub-tab _navToSection routing array; quick-notes tips entry; _NEVER_COLLAPSE list. Kept .chem-loading class because it's genuinely shared with UniProt + drug-data lookups elsewhere in the file.

Previous session: 2026-06-12 (Round 58: Cross-app visual polish pass; v1.0.24)
Cross-app visual polish (all 9 files touched):
- Shadow design tokens: every app now has --shadow-xs/sm/md/lg/xl in :root + dark-theme overrides (light variants use rgba(0,0,0,.04..22), dark variants use .30..65). Replaced bare rgba(0,0,0,.X) box-shadows in nav/cards/dropdowns/modals in hub-shell.html + Echo + LabMate header; remaining sweep can happen incrementally.
- Theme-slider thumb: replaced hardcoded #fff with var(--surface) in hub-shell, Echo, Helix, Protein Tools, Spectra, Degradation Explorer. LDI didn't have a theme slider (uses different toggle pattern).
- Global ::placeholder rule added to all 8 apps (was missing or inconsistent in Helix/Protein Tools/Spectra/Degradation/LDI/Plate Designer + reinforced in Echo/LabMate). Now placeholders consistently read var(--text3).
- Hub home cards: hover state now adds background:var(--surface2) tint alongside the existing border+shadow+transform lift.
- Echo: --accent2-soft var introduced for dropzone hover; --modal-backdrop var for setup overlay (was rgba(0,0,0,.55) flat); setup-card gained border:1px solid var(--border2) + var(--shadow-xl).
- LabMate: --error + --error-soft vars (theme-aware red); .chem-error uses them; toast (gib-toast) uses var(--text)/var(--surface)/var(--shadow-md) instead of hardcoded #222/#fff.
- Plate Designer (gel designer): well fills + strokes are now isDark-aware (was hardcoded #e0e0e0 mw, #d6ecd6 dmso, #fff sample, invisible on dark theme — real bug). gd-preview-wrap dark bg uses var(--surface2) instead of hardcoded #2a2a2a.
- Degradation Explorer: test-data button moved from inline onmouseover/onmouseout to .btn-load-test CSS class with :hover rule.
- Protein Tools: #struct-info-toggle inline onmouseover removed, replaced with CSS :hover.

Previous session: 2026-06-12 (Round 57: Echo Setup modal stops blocking Overview/Gradient; v1.0.23)
Echo: openSetupModal (labcyte_echo.html:8885) no longer gates the close buttons on scatterData.length>0 — close (×) and Close buttons always visible, so the modal can be dismissed on first load. switchPanel (line 8256) now auto-hides the setup modal when switching to any panel other than 'analysis' (so Overview and Gradient Planner are immediately usable without the modal blocking them). The modal still auto-opens once on initial load (line 8907) and via the ⚙ Setup re-open button, which is the intended Data Analysis flow.

Previous session: 2026-06-11 (Round 56: Changelog reorganised; v1.0.22)
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
