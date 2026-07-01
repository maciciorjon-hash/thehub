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
Last session: 2026-06-22 (Round 93: Phase C Tier 3 -- new visual components; v1.2.2)
Hub apps: 11. Version v1.2.2.
Final tier of Phase C (see Round 88-92 for Phases A/B1/B2 and Tiers 1-2). The original 6-item, 4-app backlog was checked against the live code before designing anything -- several items didn't hold up as originally framed:
- Lab Designer's .gd-preview-wrap hardcoded background turned out to already be fixed (Round 58) -- dropped.
- Lab Designer's .hist-card already had a color+text pill distinguishing Plate/Gel entries, not fully undifferentiated as the backlog implied -- an icon-in-pill upgrade was mocked up via Visual Companion and explicitly rejected; left as-is.
- Protein Tools' "Function/Mechanism/Disease" framing for .ti-card didn't match the real card -- actual sections are Identity, Drugs & mechanisms, Top disease associations, Structures (PDB), Network, Links (6, not 3) -- redesigned around the real content.
- Cuppa's "stat-card vs welcome-card" framing wasn't a clean two-category split -- the Welcome card AND the first stat card both already had the bold gradient treatment, the second stat card was plain. A 2-bold-vs-1-plain imbalance, not a category mismatch.
One item not in the original backlog was folded in after investigation: every app's Guide tab content (not just Lab Designer's and Degradation Explorer's, as originally flagged) has the same flat heading-plus-paragraph pattern with no icon -- Echo was the one partial exception, using raw emoji baked into the heading text rather than the SVG convention the rest of the suite settled on during Phase B2.
Final shipped scope -- 3 fixes across 7 files:
- Guide-tab content icons added across Lab Designer, Degradation Explorer, Helix, Spectra, Protein Tools (4 each) and Echo (11, replacing emoji). Icon style: inline, inherits the heading's text color via stroke=currentColor -- matches Phase B2's tab-icon convention, not the Hub home-card's bordered-box convention (reviewed and chosen via Visual Companion). The vast majority of icons are reused verbatim from each app's own existing tab-bar glyphs (since most Guide headings are literally named after that app's own tabs); only Lab Designer's 4 workflow-step headings and a handful of Echo's results-area headings needed new glyphs, since B2 never touched Echo's results tabs, only its setup-modal tabs.
- Protein_Tools/protein_tools.html: Target Intel's 6 sections grouped into 2 left-border-accent clusters -- Identity standalone (purple, var(--accent)), everything else combined (blue, var(--accent2)). A 3-cluster version was mocked up first and rejected in favor of this simpler 2-cluster split.
- Cuppa/cuppa.html: removed the bold gradient ("feature" class) from the "June 2026" stat card so only the Welcome card carries it; the two stat cards now read as a matched plain pair instead of one randomly outweighing the other. Required also fixing the progress-bar/divider/year-to-date sub-elements, which had inline white-on-gradient styling that would otherwise have gone invisible (white-on-white) once the gradient was removed.
Reviewed via Visual Companion across 4 mockup rounds (icon style, history-card chip, Target Intel grouping x2 iterations, Cuppa weight rebalance) plus direct technical investigation for the scope-correction items.
Mid-session note: implementation was briefly interrupted by a session-limit reset partway through the first parallel batch of 6 tasks; recovered by verifying which file edits had already landed correctly (via git diff/git status) before committing those directly, and completing the remaining unfinished edits (Echo's heading replacements, Cuppa's full task) manually rather than re-dispatching fresh agents against find-strings that may have already been partially changed.
Full design rationale in docs/superpowers/specs/2026-06-22-phase-c-tier3-visual-design.md, plan in docs/superpowers/plans/2026-06-22-phase-c-tier3-visual.md.
This closes out Phase C and the larger suite-wide audit plan (Phases A/B1/B2/C, started Round 88).

Previous bundle: v1.1.0 → v1.2.1 (Rounds 83–92, 2026-06-18 to 2026-06-22)
New app Iceberg/Cryostorage added (round 64) then seeded with Jon's real freezer/cryo-tank inventory + XLSX grid-template import/export (round 83). Echo: fixed a stray `</div>` collapsing the Plots tab's chart height (round 84). LabMate: unified 8 separate "grid→detail" navigations into one shared renderToolGrid() data-driven pattern, widened mobile/tablet breakpoint to 900px, fixed inconsistent back-button labels and a dead chip-render call (round 85); fixed an embedded-mode back-nav bug, widened mobile home grid to 2 columns, removed Pip mascot illustrations from always-visible UI (round 86); moved Cell Lines into its own sub-panel, replaced 9 mobile section icons with SVG (round 87). Suite-wide audit Phases A–C: mobile touch-target fixes across all apps + Hub logo SVG consistency (round 88); ~39 tab-navigation icons redesigned as line-pictograms across 9 apps (round 89); desktop density quick-fixes — max-width caps, sticky table headers, auto-fill grid fixes (Tier 1, round 90); desktop layout rework — Degradation Explorer empty-state CTA, Protein Tools chart divider, Spectra font bump (Tier 2, round 91); Guide-tab content icons added across 6 apps, Protein Tools Target Intel regrouped, Cuppa stat-card weight rebalanced (Tier 3, round 93 — see Last session above). Firebase RTDB security fix (round 92): removed hardcoded legacy database secret from client JS in hub-shell.html and Cuppa, converted admin writes to Firebase Auth SDK, added version-controlled `database.rules.json`. Known accepted residual risk: the leaked legacy RTDB secret itself cannot be revoked (Firebase removed all console UI for this years ago) — see Firebase integration section above, don't re-flag without checking that note first.

Previous bundle: v1.0.11 → v1.0.68 (Rounds 45–82, 2026-06-11 to 2026-06-18)
Echo 4PL fitter underwent extensive iterative tuning chasing parity with GraphPad Prism (rounds 47–63): convergence criteria, LM damping schedule, multi-start seeding, and parameter-bound handling were each tried, reported back as worse by the user, and partially reverted multiple times. Final settled state (round 62, unchanged since): 6-seed multi-start (5 evenly-spaced + 1 X-at-Y-midpoint), Fletcher/Madsen-Nielsen adaptive λ, gradient-norm convergence as primary criterion, robust median-based Top/Bottom initial values, maxIter 1000, "Free" params truly unbounded (±Infinity). Round 81 ran a full Echo audit fixing 61 findings, most notably a critical 4PL Jacobian sign bug (Hill-slope gradient was negated, fighting the optimizer every iteration) plus numerous O(n²)→O(n) perf fixes, dead-code removal, and dark-mode contrast bugs; round 82 fixed a syntax-error regression from that audit. Other notable work in this span: Hub app unlock/discovery system gated by per-app secret codes (round 79); Gel Designer multi-row copy/paste + click-to-edit popup, Cuppa/Iceberg modal style unification (round 79); Echo assay-specific parameter labels (CTG/Gain/Displacement, round 80); Echo PNG export quality/clipping fixes (rounds 65, 79); Cuppa Monzo pagination + auto-apply-payments (round 78); hardware back-button navigation wired through Hub + Iceberg + Echo + LabMate (round 69); cross-app horizontal-panning fix removing trapped `overflow:hidden` on mobile (round 68); cross-app mobile-polish media queries added to all 10 apps (round 67); Iceberg mobile polish (round 66); new app Iceberg/Cryostorage created (round 64); LabMate dead "cheminfo" feature removed (round 59); cross-app visual-polish pass — shadow design tokens, placeholder styling, several real dark-mode color bugs fixed (round 58); Fabricata™ easter-egg app added + Cuppa pastel-palette/Monzo fixes (round 58, 2026-06-17); "Alessio" easter egg added then twice rewritten (plain SVG → 4-panel interactive comic → orphan-SVG cleanup, rounds 51/70/71). Rolling-bundle rule established round 56: keep only the latest session as an exact detailed entry, fold everything else into version-range bundles like this one.
<!-- LAST_SESSION_END -->
