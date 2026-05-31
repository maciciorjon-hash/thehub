# JM Apps — The Hub

> Auto-updated section at bottom. Static content below is maintained manually.

---

## Project overview

**The Hub** is the primary product (`The Hub.html`). It is a **self-contained** single-file launcher: all three app HTMLs are base64-encoded and embedded directly inside it. Opening `The Hub.html` alone gives access to every tool, no other files required.

**Individual standalone files** also exist in their subfolders and are kept in sync — they serve as standalone versions of each app.

**Location:** `OneDrive › 0. General › JM Apps › The Hub.html`  
**Author:** Jon Macicior — postdoc, Ciulli Lab, University of Dundee  
**Stack:** Vanilla HTML/CSS/JS only. No build step, no server. Open in browser directly.

---

## Current apps

| ID | Name | Logo | Accent | Standalone file |
|----|------|------|--------|-----------------|
| `echo` | Echo Data Analysis | `E` | `#ff5760` | `Echo Data Analysis/Echo_Data_Analysis.html` |
| `deg` | Degradation Explorer | `D` | `#7c6fd4` | `Degradation Explorer/degradation_visualizer.html` |
| `lm` | LabMate | `L` | `#e08c30` (amber) | `Labmate/labmate.html` |
| `ff` | Figure Forge | `F` | `#f06292` | `Figure Forge/figure_forge.html` |
| `pd` | Plate Designer | `P` | `#0079b9` | `Plate Designer/plate_designer.html` |
| `dna` | Helix | `H` | `#43a047` | `DNA Tools/dna_tools.html` |
| `pt` | Protein Tools | `P` | `#9c6fd4` | `Protein Tools/protein_tools.html` |

---

## Architecture & workflow

**The Hub is self-contained.** Each app's HTML is base64-encoded and stored inside `APP_B64` in The Hub's `<script>` block. When you open an app, it is decoded with `decodeB64App()` and rendered in an `iframe.srcdoc`. This means:

- **The Hub alone** = complete product (no folder structure needed).
- **Individual app files** = standalone versions, kept manually in sync.
- When you change an individual app file, you must **re-run the Python embed script** to regenerate The Hub.

```
JM Apps/
├── The Hub.html                              ← self-contained, ~18.2MB
├── Echo Data Analysis/
│   └── Echo_Data_Analysis.html              ← standalone app
├── Degradation Explorer/
│   └── degradation_visualizer.html          ← standalone app
├── Labmate/
│   ├── labmate.html                         ← standalone app
│   └── RDKit_minimal.js / .wasm             ← used when Labmate folder is present
├── Figure Forge/
│   └── figure_forge.html                    ← standalone app
├── Plate Designer/
│   └── plate_designer.html                  ← standalone app
├── DNA Tools/
│   └── dna_tools.html                       ← standalone app
├── Kinetics/
│   └── kinetics.html                        ← standalone only (removed from Hub)
└── Protein Tools/
    └── protein_tools.html                   ← standalone app
```

### Regenerating the self-contained Hub after app changes

**`embed.py`** replaces the old inline Python snippet. Run from `JM Apps/`:

```bash
python embed.py                      # → The Hub.html  (local/offline use)
python embed.py dist/index.html     # → dist/index.html  (CI/Pages build)
```

`embed.py` reads from `hub-shell.html` (the lightweight ~28KB source-of-truth) and fills in each app's base64. The key regex is `[^"]*` (not `[A-Za-z0-9+/=]+`) to avoid the PLACEHOLDER suffix bug.

### GitHub Actions auto-deploy

**Repo:** `https://github.com/maciciorjon-hash/thehub` (private)  
**Pages URL:** `https://maciciorjon-hash.github.io/thehub/`

On every push to `main`:
1. GitHub Actions runs `python embed.py dist/index.html`
2. Deploys `dist/` to GitHub Pages
3. Hub is live at the Pages URL within ~2 min

**To enable Pages** (one-time setup): repo Settings → Pages → Source: **GitHub Actions**

**Local dev workflow:**
```bash
# 1. Edit any standalone app file
# 2. Run embed.py for local use
python embed.py
# 3. Open The Hub.html for local testing (The Hub.html is gitignored)
# 4. Push app file changes to GitHub → Pages auto-rebuilds
git add "Echo Data Analysis/Echo_Data_Analysis.html"
git commit -m "Fix: echo FP params"
git push
```

**Files tracked in git:** `hub-shell.html`, `embed.py`, `.gitignore`, `.github/`, all standalone app HTMLs, `CLAUDE.md`  
**Files NOT tracked:** `The Hub.html` (18MB generated file), `dist/`, `Labmate/RDKit_minimal.*`

### Hub shell structure

```
The Hub.html
├── <script>APP_B64{echo,deg,lm}</script>        — base64-encoded app HTML (3 original apps)
├── <script>APP_B64_NEW{dna,ff,pd,pt}</script>   — base64-encoded app HTML (4 new apps)
├── #hub-nav       — nav bar: H logo + "The Hub" + theme toggle (#theme-btn)
├── #hub-home      — 42px title + rotating subtitle + 7-card grid
├── .app-view × 7  — position:fixed overlays (z-index:10), always in DOM at opacity:0
├── var APP_INFO   — map: id → {letter, color, name} for all 7 apps
├── decodeB64App() — UTF-8 base64 decoder
├── enterAppNav()  — hides #theme-btn, sets hub-logo title to 'Back to The Hub'
├── exitAppNav()   — restores #theme-btn, clears hub-logo title
├── openApp()      — fades in app view; calls enterAppNav(); uses APP_B64[id] || APP_B64_NEW[id]
├── backToHub()    — fades out app view; calls exitAppNav()
├── HUB_SUBS[]     — rotating subtitles (5s interval, crossfade)
└── easter egg     — 5-click on H logo (when on hub home), tier bios escalate with each open
```

**Navigation from apps back to Hub:** Apps do NOT have an injected back button. The Hub's H logo in the nav bar (always visible above the app iframe) acts as back button when `currentApp` is set — clicking it calls `backToHub()`.

### Animation design

App views are `position:fixed; inset:0; z-index:10`. Opening an app:
1. Overlay fades from `opacity:0` to `opacity:1` (150ms ease) — hub home is visible underneath during fade
2. After 200ms, hub chrome is hidden (it's behind the app anyway)
3. `scheduleInject` polls every 50ms until the app header element is in DOM, then injects `← Hub` button

Going back:
1. Hub chrome restored immediately (it's behind the fading app view)
2. Overlay fades from `opacity:1` to `opacity:0` — seamless reveal of hub home

No blank/black frames between hub and app.

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
| Back button | Injected as first child of header by Hub's `injectBackBtn()` |

**Back navigation:** The Hub logo (`#hub-logo`) acts as a back button when inside an app — no back button is injected into app headers. Apps do not need any `window.parent.backToHub()` calls; the Hub handles navigation entirely from the Hub nav layer above the iframe.

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

Create `MyApp/myapp.html`. It should use IBM Plex Sans/Mono, the Echo palette CSS vars, and a 58px header with:
- `.app-logo` box (32×32, accent background, bold letter)
- App name (`h1` 15px/600) + subtitle (`p` 11px)

### 2. Add app card to `#hub-home`

```html
<div class="card" tabindex="0" onclick="openApp('myapp')" onkeydown="if(event.key==='Enter')openApp('myapp')">
  <div class="card-logo" style="background:#COLOR;">X</div>
  <div>
    <div class="card-name">My App Name</div>
    <div class="card-desc">Short description.</div>
  </div>
  <div class="card-foot">
    <span>Tag1 · Tag2</span>
    <span class="card-arrow">&#8594;</span>
  </div>
</div>
```

### 3. Add app-view iframe

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

Run the Python embed script to add `myapp` to `APP_B64`.

---

## Technical notes

**Self-contained embedding:** Apps are stored as UTF-8 base64 strings in `APP_B64`. Decoding at runtime: `decodeB64App(b64)` uses `atob()` + `TextDecoder`. No `</script>` escaping needed — base64 contains only safe characters.

**LabMate RDKit paths:** At runtime, Hub injects `<base href="{hubLocation}Labmate/">` into LabMate's `<head>` so `./RDKit_minimal.js` resolves correctly if the Labmate folder exists next to The Hub. If not, LabMate falls back to CDN automatically.

**Same-origin srcdoc:** `srcdoc` iframes with `allow-same-origin` sandbox are same-origin as the Hub. `localStorage` works, and `window.parent.backToHub()` in the injected back button works.

**Sandbox:** All iframes use `sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups allow-top-navigation-by-user-activation"`.

**Degradation Explorer tab order:** Load Data is the default/first tab (changed from Table).

---

## Session log
<!-- AUTO-UPDATED by .claude/stop-hook.sh — do not edit this section manually -->
<!-- LAST_SESSION_START -->
Last session: 2026-05-31 (Hub split, Plate canvas, Echo CDN fix, Protein Tools init)
Hub apps: 6 (echo, deg, lm, pd, dna→Helix, pt) [Figure Forge removed]
Hub file size: 18.12MB (18,121,629 chars)
Hub: Options and Suggestions split into two pill buttons (#opts-btn/#sug-btn); #opts-panel empty placeholder; #sug-panel has Formspree form (xeokadev). Commit d950e91
Echo: Critical fix — Chart.js CDN failure threw at top-level Chart.register(), stopping ALL init code after line 1905 (incl. _ctrlPickerSel Set). Guarded with _ensureChartPlugins(). Commit d950e91
Protein Tools: Added clearResults() call on init so SVG charts show placeholder text; analyzeSeq wrapped in try/catch for error visibility. Commit d950e91
Plate Designer: drawSelCanvas() now shows ALL row letters + ALL col numbers, uses roundRect (matching 384 style), sized from FORMATS.selWell/selGap; FORMATS updated with selWell/selGap; well sizes increased; calcWellPx MAX increased; 384 now shows ALL col numbers; subtitle changed to "High-res export". Commit d950e91
<!-- LAST_SESSION_END -->
