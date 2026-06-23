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
| `nanobret` | NanoBRET Calculator | SVG donor/acceptor BRET glyph | `#5e72c4` | `NanoBRET/nanobret.html` |

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

Previous session: 2026-06-22 (Round 92: Firebase RTDB security fix -- leaked legacy database secret removed; v1.2.1)
Hub apps: 11. Version v1.2.1.
Jon received a Firebase email warning that thehub-f80ae-default-rtdb had insecure rules ("any user can read your entire database"). Investigation found two separate issues, not one:
- No database.rules.json had ever existed -- rules were left at Firebase's wide-open default.
- A legacy RTDB "database secret" (a platform-level admin-bypass key, not governed by rules at all) was hardcoded directly in client-side JS in both hub-shell.html (HUB_FB_SECRET) and Cuppa/cuppa.html (FB_SECRET), used as a `?auth=` query param for writes to /labconfig, /announcement, /cuppa. Since this is a public GitHub Pages site, that secret was effectively public -- visible to anyone who opened dev tools, and bypassing any rules regardless of what they said.
Fixed: both hardcoded secret variables removed; saveLabConfig()/saveAnnouncement() (hub-shell.html) and saveToFirebase() (Cuppa) converted from secret-based fetch(...+'?auth='+SECRET,{method:'PUT'}) to the Firebase JS SDK (firebase.database().ref(path).set(data)), which automatically attaches the signed-in admin's real Firebase Auth ID token instead. Added firebase-database-compat.js script tag to hub-shell.html (Cuppa already had it). Reads deliberately left untouched/public for both -- Cuppa's welcome card publicly displays the lab's real bank sort code/account number/holder name to every visitor BY DESIGN (members have no login, this isn't a leak, it's how they know where to pay), and /labconfig + /announcement need to stay readable without sign-in for the app to function.
Added database.rules.json + firebase.json + .firebaserc at repo root so the actual rules (scoped per-path: public read + admin-email-gated write on labconfig/announcement/cuppa, deny-all elsewhere) are version-controlled and deployable via `firebase deploy --only database`, instead of living only in a chat message Jon would paste manually into the console.
Found but explicitly NOT fixed, by Jon's own choice: the leaked legacy secret itself cannot be revoked or rotated through any console UI -- Firebase removed legacy-secret management entirely, years ago, for every project, with no replacement. It remains permanently valid and permanently bypasses rules on this specific database instance regardless of what the rules say -- the only way to fully close it is migrating live data to a brand-new RTDB instance (or Firestore) and never pointing app code at the old one again. Jon was offered that migration and explicitly chose "leave it as-is for now" -- residual risk accepted: only someone who already extracted the secret string from git history or an old cached page copy could still exploit it; it's no longer visible anywhere in the current live page source. Full history in memory file project_the_hub_firebase_security.md -- don't re-flag the unrevocable-secret limitation as a fresh finding in a future session without checking that note first.

Previous session: 2026-06-22 (Round 91: Phase C Tier 2 -- desktop layout-rework fixes; v1.2.0)
Hub apps: 11. Version v1.2.0.
Phase C Tier 2 of the suite-wide audit (see Round 88-90 for Phases A/B1/B2 and Tier 1). The original 7-item, 5-app backlog (Echo, Degradation Explorer, Protein Tools, Spectra, Lab Designer) was directly investigated against the live apps before building anything -- 5 of the 7 items turned out to be false positives once tested against real content (not just read from the original audit's wording):
- Spectra's heatmap legend already has a working gradient swatch (.legend-bar) -- the "text-only" framing was wrong.
- Protein Tools' "uneven card heights" -- measured with real example data loaded, both .props-grid cards are exactly 266.65625px tall. Identical.
- Lab Designer's "sparse single-column gd-ctrl form" -- it already pairs fields in 2 columns (Format/Title, Label position/Orientation, etc).
- Lab Designer's "well-type color-picker form layout" -- opened it directly; clean, compact, nothing to fix.
- Echo's "setup-modal vertical whitespace" + "sidebar file list" -- the sidebar doesn't correspond to anything in the Files tab; the modal's own spacing, viewed at full resolution instead of a scaled/backdrop-blurred screenshot, turned out to be clean and intentional, not a dead-space bug.
One genuinely real substitute issue was found while investigating Lab Designer (Gel Designer's preview pane has ~600px of empty space below a 102px-tall preview) -- reviewed via Visual Companion before/after, user chose to leave the current top-anchored behavior unchanged (better fit for a "build top-down" tool than centering would be).
Final shipped scope -- 3 fixes, two of which needed real follow-up commits after code review caught actual gaps (not just "more polish"):
- Degradation_Explorer/degradation_visualizer.html: added a "Go to Load Data" CTA button to the Table tab's empty state (it already had an icon+text, just no clickable affordance); button calls the existing switchTab('load') function, no new file-picker logic. First review caught the button using inline styles with no :hover state (fixed by introducing a .btn-cta-link class matching the file's existing .btn-load-test/.btn-sm convention); second review caught the new class referencing var(--accent), a CSS variable that was never defined anywhere in this file (carried over from the original inline-style code, not introduced by the fix) -- replaced with var(--col1), the file's actual pervasive primary/accent token, confirmed by checking its use on tab underlines, headings, and focus borders elsewhere in the file. A separate pre-existing bug was flagged but left out of scope: var(--accent2) on the theme-toggle slider is the same class of bug, unrelated to this feature.
- Protein_Tools/protein_tools.html: added a thin border-left divider between the Hydrophobicity Profile and Charge vs pH charts via a `.chart-half+.chart-half` adjacent-sibling selector -- no markup change needed. Review caught it unscoped (would've matched any future `.chart-half` pair anywhere in the file, not just this one), not disabled on the existing mobile breakpoint where the two charts stack vertically (a stray vertical line would've been meaningless once stacked), and producing an asymmetric 16px/32px gutter against the row's existing gap. Fixed by scoping to `.props-charts-row .chart-half+.chart-half`, adding a `border-left:none` override inside the existing `@media(max-width:640px)` block, and halving the padding to 8px.
- Spectra/spectra.html: bumped the Standard Curve chart's axis tick-label font from 10px to 11px (both X and Y axes) for readability; left the Plate Reader heatmap's own, textually-identical font declaration at 10px since that's a different chart, out of scope. Approved with no issues on first review.
Reviewed via Visual Companion for the Degradation Explorer + Gel Designer items (real before/after screenshots); the chart divider and font bump were simple enough to approve as direct text proposals.
Mid-session note: implementation was briefly interrupted by a session-limit reset partway through dispatching the first three tasks; recovered cleanly by verifying which file edits had already landed correctly before the cutoff and committing those directly rather than re-dispatching fresh agents against find-strings that no longer existed.
Full design rationale in docs/superpowers/specs/2026-06-21-phase-c-tier2-layout-design.md, plan in docs/superpowers/plans/2026-06-21-phase-c-tier2-layout.md.
Tier 3 (new visual components) of Phase C remains queued, needs its own brainstorming/Visual Companion pass.

Previous session: 2026-06-21 (Round 90: Phase C Tier 1 — desktop density quick fixes; v1.1.9)
Hub apps: 11. Version v1.1.9.
Phase C Tier 1 of the suite-wide audit (see Round 88/89 for Phases A/B1/B2). Six CSS-only desktop-width fixes, each using the mechanism that actually matched its root cause rather than a blanket "add max-width everywhere":
- hub-shell.html: .home-wrap capped at max-width:1280px;margin:0 auto -- the home card grid was spreading to 8 columns with an orphaned card on ultra-wide monitors.
- Cuppa/cuppa.html: removed TWO dead `max-width:none` overrides (not just the one originally flagged) that were silently canceling an EXISTING max-width:1280px cap shared by `.wrap`/`.tab-panel` -- this was the real cause of both the top-row stat-card stretch and the member-grid stretch flagged in the original audit; both rules had to go for the fix to actually take effect.
- LDI/ldi.html: .params-strip capped at max-width:1100px;margin-left/right:auto -- its description text uses margin-left:auto and was drifting arbitrarily far from the actual param controls on wide screens. (Investigated and ruled out the audit's original "wraps awkwardly at 800-900px" framing -- that doesn't reproduce; the real issue only shows up on wide desktops, not medium ones.)
- Cryostorage/cryostorage.html: .boxes-grid capped at max-width:900px;margin:0 auto -- already used the correct auto-fill grid strategy, just had no width ceiling; centering was added in a follow-up commit after code review caught it sitting left-aligned with dead space otherwise.
- Spectra/spectra.html: .res-grid switched from auto-fit to auto-fill -- auto-fit was collapsing empty tracks and handing their space to existing result tiles, which is what was actually causing 2-4 tiles to stretch wide on roomy screens. No max-width needed for this one.
- LDI/ldi.html: added a sticky header to the Results tab's table. Investigated Iceberg's existing working sticky header first -- it works because its table sits in a bounded, self-scrolling flex container. LDI's table wrapper had no height bound, so per the CSS spec its overflow-x:auto was silently also becoming a non-functional overflow-y:auto with nothing to ever scroll -- a literal copy of Iceberg's CSS would have done nothing. Real fix: gave the wrapper a max-height bound so it's an actual scrolling region, then added position:sticky;top:0 to the thead. A first attempt used a bare max-height:60vh; code review flagged that as risky on short viewports (could squeeze the charts-row below out of reach), so it was changed to max-height:min(60vh,420px) -- a comfortable fixed ~420px cap on normal/tall viewports that still shrinks gracefully on short ones.
Reviewed via Visual Companion (2 real before/after screenshots: Hub home grid at 2560px, Cuppa top-row at 1600px) plus direct technical investigation for the rest. Two of six fixes needed a follow-up commit after code-quality review caught a real gap (Iceberg's missing centering, LDI's risky height value) -- both caught before merging, not after. Full design rationale in docs/superpowers/specs/2026-06-21-phase-c-tier1-density-design.md, plan in docs/superpowers/plans/2026-06-21-phase-c-tier1-density.md.
Tier 2 (layout rework) and Tier 3 (new visual components) of Phase C remain queued, each needing its own brainstorming/Visual Companion pass.

Previous session: 2026-06-21 (Round 89: Suite-wide icon redesign — Phase B2; v1.1.8)
Hub apps: 11. Version v1.1.8.
Phase B2 of the suite-wide audit (see Round 88 for Phases A/B1). Added line-pictogram icons (icon + text, icon inherits the tab's existing active/inactive color via stroke="currentColor" -- no new bordered-box treatment on the tabs themselves, confirmed with the user this should NOT look like LabMate's mobile-grid tiles) to:
- LDI (Data/Results/Curves), Echo (Files/Assay/Analysis/Output, setup modal), Lab Designer (Plate Designer/Gel Designer/History/Guide), Degradation Explorer (Load Data/Table/DC50 vs Dmax/Properties/Guide), Helix (Genetic Code/Sequence Tools/Compare/Vector Library/Guide), Protein Tools (Properties/Cleavage/Structure/Target Intel/Guide), Spectra (A280/Ratios/Std Curve/Plate Reader/Guide) -- 31 tab icons total, several glyphs intentionally reused across apps for the same concept (table/grid, bar chart, dose-response curve, well-grid, open-book "Guide").
- Iceberg's 2 tab symbols (-80C, Liquid N2) upgraded from Unicode to SVG, matching the cross-suite convention. Its large illustrative empty-state icons (.ei class, separate from the .ti tab icons) were explicitly left untouched -- out of scope.
- Cuppa's 6 expense-category badges (Amazon/Coffee/Milk/Supermarket/Incoming/Other) upgraded from emoji to SVG, following Cuppa's OWN existing .dk-* drink-badge convention (22x22 box, 13px svg) rather than the cross-suite tab style, since they're not a tab bar -- per explicit user choice during mockup review. Flat solid color + a thin border per user feedback (gradient was tried first in mockups and rejected).
All 39 icon-level changes went through Visual Companion mockup review (5 batches) before implementation; full two-stage subagent review (spec-compliance + code-quality) per task.
hub-shell.html: version bump -> v1.1.8, changelog entry added.

Previous session: 2026-06-21 (Round 88: Suite-wide mobile touch-target audit + Hub logo consistency; v1.1.7)
Hub apps: 11. Version v1.1.7.
Phase A (mobile touch-target fixes) + Phase B1 (Hub home-card logo fixes) of a larger suite-wide audit (plan: mobile/desktop optimization + LabMate-style icon treatment across all apps + the Hub shell). Phase B2 (tab-navigation icon redesign, ~39 icons across 9 apps) and Phase C (desktop density backlog) are scoped but not yet started -- B2 needs a visual-companion mockup review first, C needs its own brainstorming pass.
Mobile touch-target fixes (v1.1.7), one file each:
- Labcyte_Echo/labcyte_echo.html: .setup-stab/.stbtn/icon-close-button sizing; fixed a self-inflicted cascade conflict between two overlapping media tiers on .stbtn (resolved by aligning both to 40px).
- Degradation_Explorer/degradation_visualizer.html: .tab/.filter-group/.pill sizing (base-rule fixes, not mobile-only).
- Plate_Designer/plate_designer.html: .tab/.fmt-pill base-rule sizing; fixed a real regression where .type-btn shrank on mobile instead of growing; slider touch sizing. (.type-btn is currently unused dead CSS in the live UI -- fix is harmless forward-compat, not user-visible today.)
- Helix/helix.html: fixed a real JS bug (.tab-indicator didn't recompute position on horizontal tab-bar scroll, now wired via a scroll listener calling the existing updateTabIndicator()); .tab min-height; .seq-disp mobile font-size bump (needed a second follow-up commit to fix a cascade conflict with the 720px tier before it actually took visible effect).
- Protein_Tools/protein_tools.html: structure-viewer mobile stacking (needed a follow-up commit -- the first attempt targeted a dead class with no matching element; the working fix targets the real inner flex div, now via a proper class instead of a fragile nth-of-type selector); peptide-table overflow wrapper.
- Spectra/spectra.html: needle-label overlap hidden <480px; A280 row stacking scoped via a new id (avoided widening the reused .row class); epsilon-table overflow; standard-curve controls wrap. .eps-row-btn's touch-target fix needed a follow-up commit -- min-height has no effect on <tr> elements per CSS spec, real fix was padding the <td> children instead.
- LDI/ldi.html: fixed .chart-wrap's height calc breaking on short viewports. (The originally-flagged ".well touch-action" fix was a false positive from the audit -- confirmed LDI has no .well element at all, that pattern belongs to Iceberg.)
- Cryostorage/cryostorage.html: added the suite's now-standard bare input/select/textarea min-height:36px mobile rule (was entirely missing).
- Cuppa/cuppa.html: same bare-input rule added; .cell-paid touch-target bump (discovered and fixed in BOTH of two competing/overlapping mobile CSS layers in this file -- an older pre-redesign block and a newer "MODERN WEBSITE REDESIGN" block, confirmed the newer one wins cascade ties today); gated a hover-scale transform behind @media(hover:hover). Known follow-up debt, not yet cleaned up: the two competing mobile layers should eventually be consolidated (several other shared selectors between them already silently diverge by source order); a fully-dead legacy `.cell-paid:hover{transform:scale(1.1)}` rule and a redundant `@media(hover:none)` override of the same property both linger from before this round.
hub-shell.html (v1.1.7): LDI and Cuppa's Hub home-card logos (the suite's last 2 holdouts using plain text/emoji instead of SVG) replaced with inline SVG pictograms matching the other 9 cards' convention -- LDI gets a balance/scale glyph (CRBN vs VHL scoring), Cuppa gets a coffee-cup+steam+saucer glyph adapted directly from its own in-app .dk-coffee badge SVG. "Current apps" table in this file also backfilled with the 3 previously-undocumented apps (cryo, cuppa, fabricata) and LDI's logo column corrected. Version bump -> v1.1.7, changelog entry added.
All fixes went through full two-stage subagent review (spec-compliance + code-quality); several real bugs were caught and fixed before merging, see notes above.

Previous session: 2026-06-20 (Round 87: LabMate post-redesign polish — Cell Lines sub-panel, new section icons; v1.1.6)
Hub apps: 11. Version v1.1.6.
Labmate/labmate.html changes (v1.1.6):
- Cell Biology's 10 embedded Cell Lines cross-link tiles (previously flat among 8 protocol tools in one 18-tile grid) moved into a nested "Cell Lines" sub-panel: TOOLS_cellbio now has 9 entries (8 protocols + 1 "Cell Lines" tile, badge "10", gray tile-celllines accent); tapping it opens #proto-celllines-list (same .proto-entry/showProto/toggleProto pattern as every other protocol entry) containing a second renderToolGrid() of the 10 cell lines (TOOLS_cellbio_celllines); tapping one still calls the existing _openCellLine(id), unchanged.
- Replaced the 9 mobile-home-grid section icons (Favourites/Calculators/Mol Biology/Cell Biology/CRISPR/Proteomics/Biophysics/Struct Bio/Genomics) -- previously solid-color squares with text abbreviations ("bp", "MW", "Kd", "PDB", "NGS") or Unicode symbols -- with inline SVG line-pictograms: white background + colored border + colored stroke icon in light theme, accent-tinted background in dark theme (matching the file's existing .dark/[data-theme="dark"] convention). Confirmed via full-file search these 9 classes only ever appear in the mobile home grid, not the desktop nav/sidebar, so desktop is unaffected. Individual tool badges inside each section (e.g. "GIB" for Gibson Assembly) were explicitly left unchanged -- out of scope, confirmed with the user during brainstorming.
hub-shell.html: version bump -> v1.1.6, changelog entry added.

Previous session: 2026-06-20 (Round 86: LabMate post-redesign fixes — embedded back-nav bug, mobile grid sizing, Pip mascot removal; v1.1.5)
Hub apps: 11. Version v1.1.5.
Labmate/labmate.html + hub-shell.html changes (v1.1.5):
- Fixed a real mobile navigation bug reported after the Round 85 redesign: entering any section (e.g. Struct Bio) while LabMate was opened inside The Hub left no way back to LabMate's own home grid -- only escape was Hub's own back-to-Hub control. Root cause: hub-shell.html's per-app embedStyle injection for 'lm' was `.header-top{display:none!important;}`, an unconditional rule that blanket-hid LabMate's entire top header bar when embedded -- including `.mob-back-btn`/`.mob-breadcrumb`/`.mob-hamburger`, LabMate's ONLY mobile in-app navigation controls (no per-section back link exists below the top header; mobile sections rely entirely on that one global chevron to return to the home grid). This rule predates this round; it was written to hide LabMate's redundant logo/title bar when embedded but over-scoped to the whole header-top container. Confirmed via Playwright against the actual embedded `The Hub.html` (not just the standalone file) -- this bug was NOT reproducible when testing labmate.html standalone, only when embedded, which is why it slipped through Round 85's verification. Fixed by narrowing the embedStyle selector to `#logo-el,.lm-hdr-name,.lm-hdr-sub,.pip-tip-bar{display:none!important;}` (hub-shell.html ~line 1234) -- hides only the redundant branding + desktop tip bar, leaves the mobile back/breadcrumb/hamburger fully visible and functional.
- Main mobile home grid (#mob-home .mob-grid) widened from 3 columns to 2 to better use screen space per user feedback ("cards too small"). `.mob-grid-item` padding/gap increased, `.lm-icon` inside each tile bumped 44px->56px, `.mob-grid-label` font-size 10.5px->13px + weight 500->600.
- Removed Pip mascot illustrations (base64 PNG images, multiple mood poses) from the always-visible UI per user feedback that they no longer fit the app's visual identity: the `.mob-home-wordmark` icon next to "LabMate" on the mobile home screen, the icon in the desktop "Pip's tips" drawer header, and all 22 `.pip-note-icon` face icons inside "Pip Tip" protocol callout boxes (kept the "Pip Tip" text badge + tip content -- only the mascot graphic was removed, not the feature). Deleted the now-orphaned `.pip-note-icon` CSS rule (dead base64 image definition, no longer referenced). The hidden Pip Story easter egg (`sec-pip-story`, reachable only via the existing secret unlock gesture) was deliberately left untouched -- its 13 mascot illustrations are the intended home for this content now.
hub-shell.html: version bump -> v1.1.5, changelog entry added.

Previous session: 2026-06-20 (Round 85: LabMate mobile/tablet tile navigation unification; v1.1.4)
Hub apps: 11. Version v1.1.4.
Labmate/labmate.html changes (v1.1.4):
- Replaced 8 separately-implemented "grid of cards -> detail view" navigations (Calculators, Mol Biology, CRISPR, Cell Biology, Proteomics, Genomics, Struct Bio, Biophysics) with one shared, data-driven renderToolGrid() — icon-badge tiles (2 columns) at <=900px, unchanged icon+title+description cards at >900px desktop.
- Widened the mobile/tablet breakpoint from 700px to 900px throughout (8 media query blocks + _lmIsMobile()), so tablets get the new pattern, not just phones.
- Fixed a real, demonstrable instance of the "sections feel inconsistent" complaint: most detail-view back buttons said generic "<- Protocols" instead of their actual section name (Mol Biology, Cell Biology, Proteomics, Genomics, Struct Bio all affected; Cell Biology was even inconsistent with itself, 7 of 8 wrong).
- Fixed a live bug: opening any Quick Calc tool threw 3 console errors because _memRenderQcChips() called memRenderChips(), a function that was never actually written (recent-values "chips" feature was scaffolded but never finished) -- removed the dead call instead of building the unfinished feature speculatively.
- Cell Biology's migration preserved 10 embedded cross-link cards to Cell Lines reference entries (showProto cards and _openCellLine cards coexist in one data-driven grid).
- Cell Lines itself was NOT migrated to the hide-grid/navigate pattern -- investigation showed its tap-to-reveal-below-grid interaction (no back button, grid stays visible) is a legitimate, different, and arguably better UX for a 10-item reference/comparison grid; only got a visual-only icon-badge touch-up.
- Removed an orphaned "Tools" section (sec-tools) that had no entry point in any nav -- unreachable in the live app.
- Removed the dead mobile sub-navigation scaffold (#mob-subhome, mobShowSubGroup(), switchNavChild(), _navGroupMeta) -- a parallel mobile-grouping system that was scaffolded but never wired up (_navGroups stayed permanently empty). _navGroups/_sectionToGroup/switchNavGroup() themselves were left in place -- tracing every call site showed they're entangled inside renderSidebar(), too large/central to safely remove alongside this redesign; deferred to a later code-optimization pass.
hub-shell.html: version bump -> v1.1.4, changelog entry added.

Previous session: 2026-06-19 (Round 84: Echo Plots tab layout fix; v1.1.3)
Hub apps: 11. Version v1.1.3.
Labcyte_Echo/labcyte_echo.html changes (v1.1.3):
- Root cause: an extra stray `</div>` at the end of the Gradient Planner panel markup (was `</div></div>` closing both panel-gradient AND .content-area; should have closed only panel-gradient) prematurely closed `.content-area` before `#panel-analysis` opened. That made panel-analysis a sibling of .content-area instead of a child, so the `.shell` CSS grid computed 4 rows instead of 3 — the orphaned `.content-area` row kept its old Overview-panel height (~409px) as dead blank space, squeezing the scatter chart canvas down to ~200px tall. That's what looked like "dots not in proper places" / "axis scale not correct" — Chart.js's data mapping and auto-scaling were actually fine, just rendered into a tiny, badly-proportioned canvas.
- Fix: removed the stray extra `</div>` (line ~697) so `.content-area` now correctly wraps all three app-panels (overview/gradient/analysis) and closes once, after panel-analysis, at its original intended closing tag. Chart canvas now renders at full height (~600px+) responsive to viewport.
- Verified via Playwright: Overview and Gradient Planner panels unaffected (no regression); Plots tab now fills its panel correctly; confirmed the 39-of-63 plotted points is intentional (Flag==='Yes' rows, 24 of them, are excluded from the scatter by design), not a data bug.
hub-shell.html: version bump v1.1.2 -> v1.1.3, changelog entry added.

Previous session: 2026-06-18 (Round 83: Iceberg real data + template + visual polish; v1.1.2)
Hub apps: 11. Version v1.1.2.
Cryostorage/cryostorage.html changes (v1.1.2):
- Seeded Jon's real freezer/cryo-tank inventory (33 vials: 18 in -80 Box 1, 3 in -80 Box 2, 12 in N2 CeTPD Box 12), derived from "Freezer and Cryo Boxes Jon.xlsx". 'X' cells in the source meant "vial taken" -> dropped, not stored as occupied-unlabeled. Trailing "P##*" -> passage extracted, '*' folded into a note ("Passage counted after de-frosting — original freeze passage unknown.").
- Seeding is admin-gated: maybeSeedRealData() only populates state when there's no existing local data AND window.parent.isAdmin === true (Hub's existing admin flag, true only for maciciorjon@gmail.com) — other Hub users keep today's blank default.
- New "Download template (.xlsx)" button (Options panel) generates a 3-tab workbook: flat "Table format" (matches existing import/export columns), "Grid - lettered" (blank 9x9 mirroring the -80 box layout), "Grid - numbered" (blank 10x10 mirroring the N2 box layout) — both grid tabs use vertically-merged cells for the "boxy" look, plus a tip line noting entries must go on the merged cell's top row.
- importXLSX() extended with a grid-sheet fallback (_detectGridSheet/_parseGridCellText) for when a sheet isn't flat-table shaped: detects row-letter (A1, B12...) or sequential-number label rows, reads the row immediately below as content (works regardless of merge, since non-anchor merged cells already read as empty). Numbered labels convert to row-letter+column via the row's own wrap-width. Lets a hand-filled template round-trip straight back through the existing Import button.
- Visual polish ("frosted/icy", Direction A from brainstorming): .stat-card, .box-card, .empty-state get a subtle cool gradient (var(--surface) -> var(--accent-dim)) plus a soft radial accent glow on box cards; .box-preview .pw corners softened slightly. No new CSS vars — dark theme adapts automatically since --accent-dim is already theme-tuned.
hub-shell.html: version bump v1.1.1 -> v1.1.2, changelog entry added.

Previous session: 2026-06-15 (Round 82: Echo syntax crash fix + CSV diagnostic logging; v1.0.68)
Hub apps: 10. Version v1.0.68.
Labcyte_Echo/labcyte_echo.html changes (v1.0.68):
- Fixed fatal JS SyntaxError introduced by audit rawqc block removal: stray } after if(legendEl) closed drawPlateCanvas early; subsequent } was global-scope syntax error preventing entire script from loading.
- Also restored correct if(legendEl) wrapping for plate legend mode branches.
- Added diagnostic logging in _parseEchoCSV when no data rows found: reports which columns (SampleID/Barcode/Well/Conc) were located and how many rows were skipped for each reason.

Previous session: 2026-06-15 (Round 81: Full Echo app audit — 61 findings fixed; v1.0.67)
Hub apps: 10. Version v1.0.67.
Labcyte_Echo/labcyte_echo.html changes (v1.0.67):
- CRITICAL: Fixed 4PL Jacobian sign bug in _4plJac3 and _4plJac4 (∂f/∂h was positive — Hill-slope gradient was negated, LM optimizer fought itself on every iteration). _4plJac4_gain was already correct.
- Fixed stale closure in debounceUpdateAxisLabel: colorBy, cbMin, cbMax, valToColor all lived inside buildScatterChart scope; moved valToColor to top level, exposed cbMin/cbMax as window._cbMin/_cbMax, reads colorBy fresh from DOM.
- Fixed rect-select O(n²) indexOf + backgroundColor→pointBackgroundColor highlight bug.
- Fixed histogram last-bin edge (inclusive ≤ instead of <); median for even-N compound arrays.
- O(n) plate-viz and protein/sample lookup Maps replacing O(n²) array filters.
- Fixed SD flag loop (fitSdata not sdata), QC fixTop check, setProgress throttle (10-batch).
- Fixed pivot Flag_Reason propagation; DC50 unit scaling in pivot scatter mode (xKey/yKey2 base name extraction).
- Fixed SVG curve background (transparent not white); curvePlot enabled flag; cvCanvasHover pads.
- Fixed downloadScatterHiRes dark-mode theme; downloadSelHiRes now exports canvas directly.
- Fixed selectivity empty-state guard; box plot ticks (_sigFmt + correct spine colour).
- Fixed compound label dark-mode contrast; _cvComputePads pR minimum; legend row wrap threshold.
- Fixed roundRect browser-support guard (main well drawing); applyZeroPicker threshold 4→24.
- Fixed plate legend no-fit colour in dc50/dmax/flag modes (#2a2f42 dark / #dde0ec light).
- Added multi-assay _bpVarLabels entry (dc/adc/dm/lic/pdc); multi dmax cap UI labels.
- Removed dead code: _sig2, nmSimplex, toggleCvPoints, maxAfter, rawqc legend block (unreachable), else-if-false branch, refLine100Plugin unused scale var, _midVal helper, dead sn/sn2 vars.
- CSS: .grad-wrap .field scoped to prevent global form override; .pbar.spin display:none removed; var(--text1)→var(--text) in 3 inline styles; modal backdrop uses var(--modal-backdrop).
- Optimized concColor: precompute _cMin/_cMin outside per-call path.

Previous session: 2026-06-15 (Round 80: Echo assay-specific parameter labels; v1.0.66)
Hub apps: 10. Version v1.0.66.
Labcyte_Echo/labcyte_echo.html changes (v1.0.66):
- Assay-specific parameter labels throughout all plots: CTG shows "Span (%)", Gain shows "Emax", Displacement hides Dmax entirely (no such metric). Fixed: scatter X/Y axis dropdown (dmaxLbl ternary + spread exclusion for displacement), scatter default Y key (DC50_nM for displacement), scatter filter label ("Span ≥" / "Dmax ≥" / hidden for displacement), selectivity metric dropdowns (_selDmaxOpt), box plot yVars (AbsDC50 hibit-only, Dmax_pct excluded for displacement), chart axLabelMap fallback (reads _bpVarLabels), _selMetricLabel (reads _bpVarLabels), curves Compare sort options (_cvDmaxLbl), renderCvStats dmaxLbl/dmaxColHdr (_isCTG branch), PDF stat line (_pdfDmaxLbl), plate legend ("Low/High Span" etc.).

Previous session: 2026-06-15 (Round 79: Hub unlock system + Echo PNG fix; v1.0.65)
Hub apps: 10. Version v1.0.65.
hub-shell.html changes (v1.0.61–v1.0.64):
- v1.0.61: Auth glitch fix — #hub-home starts at opacity:0, fades in after onAuthStateChanged fires + 80ms grace period (setTimeout _showHub 80); 1.5s fallback ensures hub always appears. _hubShown flag prevents double-firing.
- v1.0.62: Gel Designer (Plate_Designer/plate_designer.html) — multi-row copy/paste in lane label editor (Shift/Ctrl+click multi-select, Copy/Paste toolbar + Ctrl+C/V); canvas click-to-edit with floating Word-style popup (gdp- prefix); hit zones stored in _gdHitZones after gdDraw(); text cursor on hover.
- v1.0.63: Cuppa + Iceberg modal style unification — all popup/modal dialogs restyled to match gel popup visual language (surface2 header, uppercase 11px label, two-layer shadow, spring entrance animation).
- v1.0.64: Hub app unlock/discovery system — APP_UNLOCK_WORDS maps each of 10 app IDs to a secret code; _unlockedApps Set persisted in localStorage key 'hub_unlocked'; non-admin sees blank hub until codes are typed; applyLabConfig() gates on both labConfig and _unlockedApps; _updateUnlockUI() shows/hides input and section label; admin bypasses entirely; Lab panel shows "Unlock codes" reference section; hub-home section-lbl starts display:none to prevent flash; input styled as bordered box with hint text.
Labcyte_Echo/labcyte_echo.html changes (v1.0.65):
- PNG export axis clipping fixed: new _cvComputePads(fSz, fMul, lMul, legMul) helper computes pL/pR/pT/pB dynamically so all labels and titles fit regardless of export multipliers. pL accounts for rotated Y-title half-height + tick label width; pB accounts for X-axis title (28×fMul) and legend (38×fMul). Y-axis title re-centered at yTitleX (dynamic) instead of hardcoded 14.
- Export quality: _exportScale 3→4 (DPR-independent; removed DPR multiplication from export path for consistent pixel count across screens), _fMul 5→2.5, _lMul 4→2.5, _legMul 4→2.5. At 2.5× font on 4× canvas: ~13pt text at 600 DPI, correct publication proportions.

Previous session: 2026-06-14 (Round 78: Cuppa v8 — month nav removed, full-year scroll in Members; v1.0.48)
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

Previous session: 2026-06-17 (Round 58: Fabricata™ easter egg app + Cuppa fixes; v1.1.1)
Hub apps: 11 (echo, lm, deg, pd, dna/Helix, pt, spectra, ldi, cryo/Iceberg, cuppa, fabricata). Version v1.1.1.
Cuppa: pastel palette (--accent #b86030→#c9875c + full dark-mode softening); Wall of Shame gradient softened to dusty terracotta; .src-dot CSS+JS removed; dead whitespace in empty wall-of-shame fixed (flex column + flex:1 on .wos-empty); account holder default changed from 'J. Macicior' to 'Jon Macicior Michelena' (placeholder, defaultState, ensureState). Hub embedStyle: Cuppa now gets its own branch hiding only .logo/header h1/header p (was hiding full header, making Sign in/Settings inaccessible). Fabricata™: new unlockable app (code word: fabricate); ethics warning on first open → 5-second "Disappointing." countdown → re-locks after fade; re-opens skip ethics modal and show DIS_VARIANTS variant based on cumulative open count (9 variants); every 3rd unlock triggers FAB_MSGS fourth-wall modal (9 rotating unhinged messages written via Python to avoid typographic-quote JS syntax error). Critical bug fixed: FAB_MSGS strings were written with curly/typographic quotes (U+2018/2019/201C/201D) by the Edit tool, causing "Invalid or unexpected token" breaking the entire Hub — fixed by Python regex patch with ASCII string literals.

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
