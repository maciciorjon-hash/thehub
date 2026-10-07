# Beta Test Report

One file, newest run first. Each run is a dated section.

---

## Ribbon, reworked — 2026-10-07

Jon asked for Ribbon to be reworked: *better app, one style with the rest of the Hub, bugs found and fixed,
improvements, and suggestions.* Ribbon had last been audited on 2026-09-28 (RB-1 … RB-10 below) and had three
known gaps (N5–N7). This pass broke it first, then rebuilt it around what it found.

### Scope & environment
- **App:** `apps/ribbon/ribbon.html` — standalone, and embedded in the built Hub (phone and desktop sweeps).
- **Tools:** Playwright (Chromium and WebKit) against live RCSB, AlphaFold DB and UniProt for the break-it phase;
  stubs for the permanent checks. 3Dmol from its CDN. `mobile_hub_sweep.mjs --escape`, `check_css`, `check_js`,
  `audit_app --xref`, the three sync checks, `assist_invariants.mjs`.
- **Viewports:** 1440×900, 1024×768, 768×1024, 390×844, 844×390, 320×568, light and dark.
- **Structures used:** 1CRN, 4HHB, 5T35 (VHL–MZ1–BRD4), 6VXX, 7K00 (150 k atoms, 56 chains), 1D3Z (NMR, 10 models),
  1BNA (DNA), AF p53 (AlphaFold), hostile files.

### Bugs found by breaking the old build
| ID | Sev | What happened | Root cause |
|---|---|---|---|
| RB-11 | High | With the CDN unreachable the **whole page was dead**: no theme switch, no swatches, no design list, Go did nothing and said nothing | `initViewer()` threw inside the one `DOMContentLoaded` handler, so nothing after it was wired |
| RB-12 | High | On a portrait phone **every protein ran off both edges**; 5T35 touched the bottom of a 1440×900 window and sat 90 px off-centre | `zoomTo` fits a sphere to the view's height and ignores its shape and perspective |
| RB-13 | Med | A search with no hits said "Search failed. Check your connection" | RCSB answers *no hits* with HTTP 204 and an empty body; `r.json()` threw |
| RB-14 | Med | A saved design did not hold the camera: loading it gave the colours back and the structure at the default view | `collectDesign` never wrote `getView()` |
| RB-15 | Med | The "All colours" sliders did **nothing** in Spectrum and Secondary mode | those modes were 3Dmol colour schemes, outside the HSL tuning |
| RB-16 | Med | Saving under an existing name overwrote it silently (N6) | no check |
| RB-17 | Med | A chain could only be picked by clicking the model (N5): not from the keyboard, hard on a phone | no list |
| RB-18 | Low | Extended ids (`pdb_00001abc`) were refused (N7); `1crn.pdb` was searched for as a name | id regex |
| RB-19 | Med | A file that parsed to nothing cleared the viewer and was reported as "could not reach the PDB" | render ran inside the fetch chain, and any throw there counted as offline |
| RB-20 | Low | Residue labels were 3Dmol sprites: not draggable, not styled by Label style, hidden from the export by removing and re-adding them | a second label system |
| RB-21 | Low | 3Dmol was loaded unpinned from `3Dmol.org` (a different build from the npm release) with no integrity check | script tag |
| RB-22 | Low | A 1200 dpi export was a 14 MB `data:` URL on an `<a href>`, which Safari refuses | `toDataURL` |
| RB-23 | Med | Swatches, chips and search results were clickable `div`/`span`s: not focusable; sliders and the theme switch had no name | markup |

### Bugs found in the new code by the same checks, before it shipped
A PROTAC built on a hydroxyproline has `N`, `CA` and `C` atoms, so "has a backbone" made it a *residue* and the
ligand list was empty (5T35) · lists with a height limit **shrank their rows into each other** (the escape audit) ·
a right click on an atom also picked its chain (3Dmol fires the click for every button) · macOS raises the context
menu on the button *press*, so a right-drag to pan opened a menu · a corrupt `ribbon_recent` threw on a `null`.

### What changed
Everything is in `apps/ribbon/ribbon.html`; ids the older tools use (`fetchBtn`, `pdbInput`, `.example-chip`, `state`,
`saveDesign`, …) were kept, and R1–R3 in `design_invariants.mjs` still pass unchanged.
- **A viewer that is never inert.** 3Dmol 2.5.5 is pinned with a SHA-384 hash, tried on unpkg, jsDelivr and cdnjs
  (the same bytes), and a failure says so in the viewer with *Try again*; the rest of the page keeps working.
- **Framing.** `fitView` projects the atoms and corrects until they fit, in any viewer shape, and follows a resize until
  the user moves the structure. Fit animates (a quaternion slerp of the camera).
- **One colour function** drives cartoon, stick and surface: highlight > chain colour > mode, then the palette tuning,
  then dimming. Colour modes: uniform, chain, rainbow N→C, secondary structure, B-factor / **AlphaFold pLDDT** with a key.
- **Sources:** PDB (incl. extended ids), **AlphaFold DB** by UniProt id, AF id or a name search (UniProt), and
  **local files** (`.pdb .ent .cif .mmcif .pqr`, `.gz`, drag and drop); NMR ensembles get a model slider.
- **Panel as folding sections** (Structure · Chains · Highlight · Appearance · Labels · Designs), the same
  language as the Gel Designer; what is open is remembered; a folded section says what is in it.
- **Chains** list with molecule names from the entry, hide / isolate / colour, reachable from the keyboard.
  **Ligands** with their own carbon colour and a **pocket** (residues within *r* Å); **residue highlights** by
  `chain:range`; ions drawn but not listed; modified residues stay in their chain.
- **Labels** — chain and residue labels are one kind of element: drag, arrow keys, Delete, placed clear of each other,
  hidden with their chain, drawn into the export exactly when asked.
- **Designs** keep the camera (restored exactly when the viewer has the same shape, brought into view when not), a
  thumbnail, the source; replacing asks, deleting offers Undo.
- **Export:** PNG/JPEG as a blob, **Copy** to the clipboard, **Send to Labbook** (the figure arrives on the experiment's
  Files), and the colour key as a band under the picture.
- **Right-click** on the structure: a menu about the atom under the pointer; hover names it.
- **Help assistant** notes for Ribbon (`tools/assist/kb/ribbon.js`) and an updated context menu.

### Coverage matrix
| Area | Functional | Edge | UI | Mobile | Persistence | Errors | A11y | Perf |
|---|---|---|---|---|---|---|---|---|
| Load: PDB, extended id, AlphaFold, name search, file, gz, drop | ✅ | ✅ 204/404/500/offline, junk, huge range | ✅ | ✅ | ✅ recent, last | ✅ | ✅ | ✅ 150 k atoms |
| Framing and resize | ✅ | ✅ rod, tall, globular × 4 viewer shapes | ✅ | ✅ | — | — | — | ✅ |
| Colour modes, palette tuning, surface | ✅ | ✅ every mode vs HSL | ✅ | ✅ | ✅ design | — | — | ⚠️ software GL only |
| Chains, ligands, pockets, highlights | ✅ | ✅ PROTAC with backbone, MSE, ions | ✅ | ✅ | ✅ design | ✅ bad ranges | ✅ | — |
| Labels (chain and residue), export | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ keys | — |
| Designs and sync | ✅ | ✅ old design, corrupt storage | ✅ | ✅ | ✅ | ✅ | ✅ | — |

### Not fixed — recommendations
See *Suggestions* in the session notes; the open items are an embedded 3Dmol (offline viewer, +0.9 MB on the Hub),
distance and angle measurements, an interface/contact view for ternary complexes, and superposition of two structures.

### Regression results
- `tools/ribbon_invariants.mjs` (new, **RB1–RB17, ~175 cases**, in CI): every one of ~20 bugs put back in a copy was
  caught by the invariant it belongs to (two mutations were behaviour-equivalent — a refused file is protected twice).
- `design_invariants.mjs` R1–R3 pass unchanged. `assist_invariants.mjs` passes with the new notes.
- `mobile_hub_sweep.mjs --escape`: 0 findings, Ribbon, 390×844 · 844×390 · 1440×900 · 1024×768 · 768×1024, both themes;
  WebKit phone portrait and landscape clean.
- `check_css`, `check_js`, `audit_app --xref`, `sync_icons/ctxkit/assist --check` clean.

### Residual risk
- Rendering was measured in **software GL** (headless); a draw is ~10× slower than on a GPU, so the 150 k-atom
  timings are an upper bound.
- **Touch gestures were emulated**, not tested on a device (dragging tags, pinch).
- **Send to Labbook** was verified end to end against a real Labbook frame (RB17: the picture lands on the open
  experiment's Files, captioned, with `ribbon` recorded as a source), not through a signed-in Hub session.
- The hover picker is disabled above 160 k atoms.

## dHUB on a phone — 2026-09-29

### Scope & environment
- **What:** the whole Hub as a phone user meets it — the shell (visitor home, the signed-in workspace,
  the four landings, Settings, Cmd+K search, the boot intro), and each of the 17 apps opened the way
  a person opens them: through the shell, inside its `srcdoc` frame, under the shell's own header and
  bottom tab bar. Portrait **and** landscape.
- **Brief (Jon):** *"beta test dhub entero en el móvil. Break it, flag it, fix it. Muy importante el
  aspecto visual: absolutamente todo se tiene que poder ver, sin solapamientos de letras. Si algo no
  cabe en vertical, un mensaje al usuario en ese apartado diciendo que lo ponga en horizontal, pero
  que no aparezcan cosas que no se ven."*
- **Base commit:** `3b13b28`. Worked on `main`, one commit per area.
- **Tools:** Playwright — Chromium and WebKit (Safari's engine), touch, DPR 2, iPhone user agent —
  driving the built `dHUB.html`. New: `tools/mobile_hub_sweep.mjs` + `tools/mobile_hub_scenarios.mjs`
  (below). Existing: `mobile_sweep.mjs` (Labbook, embedded and top-level), `audit_runtime.js`,
  `audit_align.js`, `check_css`, `check_js`, `check_shared`, `audit_app --xref`, `embed.py`.
- **Viewports:** 390×844 · 375×667 · 320×568 (portrait) · 844×390 · 667×375 (landscape) · light and
  dark at 390×844 · WebKit at 390×844 and 844×390 · `--offline` (Firebase blocked) at 390×844 and 844×390.
- **Firebase** is stubbed (admin signed in, nothing in the cloud) so the healthy state is what is
  measured; `--offline` measures the state a phone at the bench with no signal is in.

### How it tests (new harness)
`tools/mobile_hub_sweep.mjs` is an eye in code. At every screen, in the shell and in the app frame, it
measures **painted text**, not markup: `overlap` (two painted lines intersect), `covered` (something
else is on top — `elementFromPoint`), `clipped` (cut by an `overflow:hidden` ancestor or the screen
edge with nothing to scroll it back), `offscreen`, `strip` (a tab sliced by a scrolling row), `spill`
(text sticking out of its own bordered box), `sideways`, `fixed` (two fixed layers overlapping),
`tiny` (<11px; 10px for plate axis labels), `unfit` (the rotate-note contract), `truncated`
(advisory). Every screen is measured at the top **and** with every scroller at its end, so what can
never be scrolled clear is a finding. Each app is opened, **seeded with its own demo data** (Echo runs
the whole pipeline on its bundled plates; Dora/BCA/Beacon/Lumina/Helix/Protein Tools their examples; a
synthetic blot; Ribbon loads 1CRN from RCSB) and **crawled** — every tab-like control and every button
that opens a dialog is pressed once, the screen measured, the dialog put away. 143 screens per
size/theme, about 4–5 minutes.

The first version reported ~1,300 findings; most were the detector being wrong, and each false
positive taught it a rule it now states in its own source: a fixed element is clipped only by its
containing-block chain (Echo's fixed dialog inside a 137px `<main>`), a closed `<details>` paints
nothing, `elementFromPoint` cannot see through `pointer-events:none` (a toast reads as "covered"), a
sticky header over rows that scroll under it is what sticky is for, the page's own scroll makes a line
cut by the screen edge reachable, and a transparent file input over a drop zone is a hit layer.

### Coverage matrix
| Area | Functional | Edge | Math | UI | Mobile | Stress | Persistence | Errors | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Shell — visitor home, unlock | ✅ | ✅ | — | ✅ | ✅ | — | — | ✅ offline | — | — |
| Shell — workspace, rail/tab bar, 4 landings | ✅ | ✅ landscape | — | ✅ | ✅ | — | — | ✅ | — | — |
| Shell — Settings (4 tabs), Cmd+K, boot intro | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Echo (analysis run, all result tabs, Gradient Planner, setup) | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Dora · BCA · LDI · Beacon · Lumina | ✅ seeded | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Blueprint (plate, 384, gel, history) | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Helix · Protein Tools · Ribbon · Blot (crop, figure) | ✅ seeded | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Archive (protocol, library kinds) · Cell Archive · Incubator · Iceberg | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Labbook embedded (portrait) | ✅ `mobile_sweep.mjs` | ✅ | — | ✅ | ✅ | — | — | — | — | ⚠️ not re-measured |
| Labbook embedded (landscape) | ✅ | ✅ | — | ✅ | ⚠️ tap targets, see below | — | — | — | — | — |
| Touch gestures on plates (drag select, pinch) | ❌ | | | | ❌ | | | | | | 
| iOS keyboard covering an input | ❌ not emulable | | | | | | | | | |

### Bugs
Every bug in this table is fixed and committed on `main`. Commits are in the order they landed.

| ID | Sev | Area | Summary | Root cause |
|---|---|---|---|---|
| MB-1 | High | Cell Archive | On a phone the list was 234px wider than its card: the vial/culture badge, the medium and **Add cell line** were outside it with nothing to scroll; rows overprinted each other | The phone rule sat before the seven-column list rule at the same specificity and never applied; the list (`overflow:hidden`) was also shrunk by its flex parent instead of letting the panel scroll |
| MB-2 | High | Shell | Two fixed banners ("Offline…" and "Not syncing…", same message) stacked on each other and over the first 41–65px of **every** app, hiding the Cells tabs and the top of Echo/Dora | `position:fixed;top:58px` above the app views; a duplicate notice |
| MB-3 | Med | Shell | Landscape phone (844×390): a 58px header + 56px tab bar left an app 276px of a 390px screen | width query says "desktop", height says no room; nothing keyed on height |
| MB-4 | High | Echo Plots | The plot panel clipped what did not fit; the chart was a strip with **PNG / CSV / Select drawn over it** and no way to scroll to the rest | `#scatter-panel{overflow:hidden}` with stacked controls |
| MB-5 | Med | All 17 files | 10px text across the Hub on a phone (tab-bar labels, landing tags, Echo/Dora/LDI/Iceberg labels, 65 inline `font-size:10px`) | Labbook alone had the phone type step; the rest did not |
| MB-6 | High | Lumina | The 96-well plate's column 12 (and the 100 % controls) ran 11px out of its card at 390px | a 24px well floor against 23px of room |
| MB-7 | Med | Lumina | Concentration headers overprinted each other ("1 µM333 nM…"); `100%` cut in a 22px well | horizontal headers wider than the column; fixed label |
| MB-8 | Med | Lumina | The five steps scrolled sideways; the fifth was cut to "Readin" | a strip instead of a wrapping grid |
| MB-9 | Med | Lumina · Blueprint · Labbook | A 384-well plate in portrait is 24 columns of 14px wells: unreadable, untappable | no portrait treatment → **"Turn your phone sideways" note**, plate hidden, the 96/384 switch kept |
| MB-10 | Med | Dora · Helix · Beacon · Blueprint · Echo · Archive · Ribbon | Tab rows and filter pills scrolled sideways with a label sliced in half ("Proper" for Properties, "Proteomics" cut 63px) and no sign of what was behind | scrolling strips |
| MB-11 | Med | Blot | The ⋯ menu was 21px off the left edge; its last items 12–56px below the fold | anchored `right:0` to a button that is mid-screen on a phone |
| MB-12 | Med | Beacon · Echo | The drop-zone's last hint line was cut; the setup dialog's last tab ("Plate Map", "Output") cut by the card at 320px | fixed 88px height + `overflow:hidden`; padded tabs |
| MB-13 | Med | Echo | "COMPOUNDS" stuck out of its tile; the Plate tab's second card cut in half | 110px tiles ×3 in 350px; three fixed grid columns |
| MB-14 | Med | Blueprint | Toolbar + plate + note clipped by the panel; the plate got a strip | `#panel-designer` is `overflow:hidden` inline |
| MB-15 | Med | Shell | The Settings sheet (full screen on a phone) let the page behind ghost through its text | 86 %-opaque glass on a full-screen surface |
| MB-16 | Low | Dora | Header counts cut between 641 and 880px; a long file name stuck out of the drop zone at 320px; a wrapped controls row started on the right | auto margins and fixed widths |
| MB-17 | Med | Ribbon | **Go** sat 16px under the 3D viewer in the 290px sidebar | a flex `<input>` without `min-width:0` |
| MB-18 | Low | Iceberg | A rack name stood five lines tall beside its counts | no wrap in the header row |
| MB-19 | Low | Cuppa | 36px search box beside a 33px button | no shared control height |
| MB-20 | Low | Lumina | Wrapped header rows started at different left edges | `margin-left:auto` |
| MB-21 | Med | Labbook (landscape) | 96-well editor cut at column 9; search/new-project placeholders cut; day arrows 24px beside a 30px date field; the PDF scope select clipped its widest option; selection bar 28/35px | the fit-to-width ran only in the phone layout; desktop widths on a touch screen |
| MB-22 | Med | WebKit | Selects drawn 25px beside 34px inputs (Ribbon label panel, Lumina assay row); Blot's *Confirm crop* wrapped and stood 50px tall; Echo's "last session" offer floated over the tabs until answered | Safari ignores padding on `select`; nowrap; fixed position |
| MB-23 | Low | Labbook | The folded Setup card on a phone (two rows and a fade) cut its second row in half | a regression of MB-5 itself: `max-height:118px` held two rows at the 10px scale, not at 11px; caught by the stricter detector. Folded by counting items now (the first four), not by height |

**Totals:** 23 found (0 Critical, 4 High, 14 Medium, 5 Low), 23 fixed, 0 open.

### Not fixed — recommendations
- **Tap targets in Labbook's landscape layout.** At 844×390 Labbook uses the desktop layout, whose menus and dialog rows are 34–36px (the phone sheets are 46px). `mobile_sweep.mjs --sizes=844x390` reports ~190 of them. They are readable and complete; a touch user has to be a little more careful. Proposed: enable the sheet/44px rules for `(hover:none) and (pointer:coarse)` at any width. Not done: it changes the interaction model of every menu on tablets (768–1024) too and needs Jon's call.
- **Ellipsised names** (a project name in Labbook's narrow column, Echo's `LogDC50 (M)` header, Lumina's "Drop a file or paste from Excel" hint) are reported as advisory `truncated`. They are a design choice in a dense list and carry a tooltip; `--strict` counts them.
- **Canvas text is not measured.** Curve axes, the 3D viewer and plate images are drawn to a canvas; the harness sees the DOM. Echo's scatter axes were checked by eye.
- **Gel Designer** is usable in portrait (preview under the lane list) but the preview is small; a sticky preview would be better. Design decision.
- **Touch gestures** (rectangle-drag on a plate, pinch on the 3D view) were not driven.

### Regression results
Final pass, on the commit that carries the last fix (`0 failing` = no finding other than the advisory `truncated`):

| Run | Result |
|---|---|
| Chromium · 390×844 · 375×667 · 320×568 · 844×390 · 667×375, light — 143 screens each | **0 failing** |
| Chromium · 390×844 dark | **0 failing** |
| WebKit · 390×844 · 844×390 | **0 failing** |
| `--offline` (Firebase blocked) · 390×844 · 844×390 · Chromium and WebKit | **0 failing** — one sync notice, in the layout, rail below it |
| `tools/mobile_sweep.mjs --embedded` (Labbook in dHUB, two sizes, both themes) | all screens clean |
| `tools/mobile_sweep.mjs` top-level (Labbook standalone) | all screens clean |
| `tools/invariants.mjs` (Labbook) · `design_invariants.mjs` (Blueprint + Ribbon) · `echo_invariants.mjs` | all hold |
| `check_js` · `check_css` · `check_shared` · `audit_app --xref` · `sync_icons --check` | clean (`check_css` still lists Echo's one undefined `--x`, which predates this run) |

**The harness catches what it is for.** Eleven of the defects above were put back one at a time in a
temporary build (the file restored afterwards) and the sweep had to find each. The first pass caught 7
of 11. The four it missed were four blind spots, and each is closed:

| Put back | Was missed because | Now |
|---|---|---|
| Lumina 96-well floor at 36px (plate wider than its card) | the plate sits in a scrolling box, so nothing was "cut" | `unfit: a plate is Npx wider than its box` |
| Echo result tabs as a scrolling strip | the tabs are `div.tab` with a JS listener, not `[onclick]`, so they were not controls | tab-like classes are controls |
| Beacon drop zone fixed at 88px | a page that scrolls counted as a scroller for text clipped by an inner `overflow:hidden` box | a scroller rescues text only between it and the box that cuts it |
| Settings card at 86% opacity | a modal covering the page is "by design"; its own translucency was not looked at | `see-through: N lines of the page show through it` |

The other seven: the phone type scale, Cell Archive's dead phone rule, the Lumina and Blueprint
rotate notes, Blot's unclamped menu, the banner covering the app, and Dora's scrolling tabs.

### Residual risk
- A real iPhone: Safari's dynamic toolbar, the on-screen keyboard and the notch in landscape (the shell has no `viewport-fit=cover`, so Safari pads the safe area itself) were emulated, not measured.
- The CDN-loaded libraries (RDKit, jsPDF, 3Dmol) are reached from the test browser; offline they are already announced by their apps.
- Third-party overlays (the OS share sheet, file pickers) cannot be tested.

---

## Echo Data Analysis (Curves, Plots, exports) — 2026-09-28

### Scope & environment
- **App:** `apps/echo/echo.html`, Data Analysis: the Curves tab (Single and Compare, the style
  panel, zoom, Fix Y, the pinned reference, right-click exclusions), the Plots tab (scatter, box
  plot, selectivity, point names), every export of a chart (curve PNG/PDF, batch curve PDFs,
  scatter/box/selectivity PNG, CSV (filtered), Raw Data and Summary CSV, Copy TSV, Results XLSX),
  and the fitting mathematics behind them. Also Echo embedded in dHUB.
- **Base commit:** `921cf61`. Worked on `main`; one commit per bug or per tightly coupled group.
- **Reported by Jon during the run:** PDF exports overlap, charts look low quality, names overlap
  when comparing and exporting, Compare looks wrong and the UI moves while adding; then: an
  excluded concentration cannot be re-included, and ⌘Z does nothing.
- **Tools:** Playwright (Chromium) on the bundled test plates (1 picklist, 6 PHERAstar plates,
  63 fits); PyMuPDF to rasterise every exported PDF and read it; scipy 1.18 `least_squares` and
  `scipy.stats.t` as the reference for the fits and confidence intervals; numpy type-7 quantiles
  for the box plot; `check_js`, `check_css`, `check_shared`, `audit_app --xref`, `embed.py`.
- **Viewports:** 1440×900, 768, 390×780/844, 320; light and dark.

### Coverage matrix
| Area | Functional | Edge | Math | UI | Mobile | Stress | Persistence | Errors | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Curves — Single | ✅ | ✅ zoom, Fix Y, ref, no-fit | ✅ | ✅ | ✅ | — | — | ✅ | ⚠️ keyboard nav only | ✅ |
| Curves — Compare | ✅ | ✅ quotes, 60-char, α/emoji, 63 curves | — | ✅ | ✅ | ✅ 40 rapid toggles | ⚠️ selection is per session | — | ✅ checkboxes | ✅ 63 curves ≈ 70 ms |
| Curve edits (exclude, re-include, resolve, undo) | ✅ | ✅ | ✅ refit vs fit | — | — | ✅ | — | — | ✅ ⌘Z/Ctrl+Z | — |
| Curve PNG / PDF / batch PDF | ✅ | ✅ Unicode, long names, 63-entry legend | — | ✅ read page by page | — | ✅ double click | — | ✅ | — | ✅ |
| Fit engine (LM, CI) | ✅ | ✅ bound-hitting fits, flat curves | ✅ vs scipy, all 63 | — | — | — | — | — | — | — |
| Plots — scatter | ✅ | ✅ unfitted rows | — | ✅ | ✅ | — | — | — | — | — |
| Plots — box plot | ✅ | ✅ even n, outliers, 0 limit | ✅ vs numpy | ✅ | ✅ | — | — | — | — | — |
| Plots — selectivity | ✅ | ✅ log DC50, manual limits | ✅ direction | ✅ | ✅ | — | — | — | — | — |
| CSV / TSV / XLSX | ✅ | ✅ commas, quotes, formulas | ✅ values vs results | — | — | — | — | — | — | — |
| Plate / Properties / History tabs | ⚠️ looked at, not tested in depth | | | | | | | | | |
| Multi-assay runs | ❌ no multi-assay test data | | | | | | | | | |

### Bugs
Every bug in this table is fixed and pushed to `main`.

| ID | Sev | Area | Summary | Root cause |
|---|---|---|---|---|
| EC-1 | High | Compare export | The legend was drawn over the x-axis title, and every row after the first fell off the image: 5 of 24 names shown | Legend placed at a fixed offset, canvas height never grew for it |
| EC-5 | High | Compare | One click put a compound on all three proteins: 8 clicks, 24 curves | Selection keyed by Sample_ID |
| EC-9 | High | Box plot | The median of [1,2,3,4] was 3; whiskers ended at the fence, where no point lies | `sorted[floor(n·p)]` quartiles |
| EC-10 | High | Selectivity | With log DC50 on both axes every selective compound was painted on the wrong protein | Bands assumed higher = more potent |
| EC-14 | High | Curve edits | A concentration excluded as a whole could not be re-included by right-click (Jon) | Its crosses were drawn but not in the hit map |
| EC-15 | High | Undo | ⌘Z did nothing on a Mac anywhere; curve edits had no undo at all (Jon) | Only `e.ctrlKey` was checked; no snapshot of edits |
| EC-17 | High | Fitting | Six fits stopped short of their minimum, all with the bottom on 0 %: EDA-139·BRD2 23.5 nM vs 23.0 | `_lmFit` clamped the whole step at the bound |
| EC-2 | Med | Curve export | Title overlapped the plot; 100 % label, EC50 line, error bars and grid ignored the export scale | Hand-set pads and multipliers not applied everywhere |
| EC-3 | Med | PDF | Every PDF was a JPEG/PNG raster on an A4 page | No vector path; now `_pdfCtx`, a Canvas-2D front for jsPDF |
| EC-4 | Med | Batch PDF | "⚠ Hookx1" printed as "& H o o k x 1"; DC50/Dmax labels regardless of assay; the title twice | Non-WinAnsi glyph in a standard font; labels hard-coded |
| EC-6 | Med | Compare | A chip's colour and its curve's colour disagreed | List position vs chart position |
| EC-7 | Med | Compare | Adding a compound moved the list under the pointer and shrank the plot (Jon) | Table grew above the list; legend drawn in the canvas |
| EC-8 | Med | Curves | Data not clipped (Fix Y drew over the axes); hover/pan/popup used hard-coded pads; duplicate zoomed ticks; sparklines ignored gain mode; CTG said DC50; "pDC50" uppercased to "PDC50" | Several |
| EC-11 | Med | Selectivity | Black grid and labels, bands outside the plot, "&amp;" in titles, a "600 DPI" PNG that was the screen canvas, a dead "Only shared" box | `var(--x)` handed to a canvas; no clip |
| EC-12 | Med | Point names | Names drawn on top of each other (scatter, selectivity) | No placement |
| EC-16 | Med | Curve edits | Re-including a point refit EDA-013 to 7.54 nM instead of 7.53 | Replicates stored rounded |
| EC-18 | Med | CIs | 95 % CIs 1–6 % too narrow | `_tQ95` returned the top of each df bin |
| EC-19 | Med | Fitting | Abs EC50 of a rising curve on the mirror side; CTG span 100 − bottom with a free top | Falling-curve formula for every assay |
| EC-20 | Med | Scatter | Unfitted compounds plotted at x = 0 (1 M); side panel drew a gain curve falling | `parseFloat(null)||0`; a copy of the row |
| EC-21 | Med | Names | A quote in a compound or group name broke its compare row; file names rendered as HTML; "Mike's plate" could not be removed | `esc()` left quotes; inline JS strings |
| EC-22 | Med | CSV | Unquoted cells, formula injection, "CSV (filtered)" not what the chart showed, 50 fM printed 0 nM | Values joined raw; filter re-derived from inputs |
| EC-24 | Med | Selectivity | The chart collapsed to nothing on a phone; stretched to 16° on a desktop | `min-height:0`; no aspect |
| EC-13 | Low | Scatter PNG | 100 % line, its label and names ignored the 5× scale; hulls doubled on Retina | Unscaled constants |
| EC-23 | Low | Batch PDF | Double click: two pickers or every PDF twice; no Escape | No guard |
| EC-25 | Low | Style panel | Controls reset to their first option while the chart kept the style | No `selected` state |
| EC-26 | Low | Curves | Fix Y placeholder read "Bottor" | 60 px field |

**Totals:** 26 bugs found (0 Critical, 7 High, 15 Medium, 4 Low), 26 fixed, 0 open.

### Not fixed — recommendations
- **"pDC50 (M)" column headers.** A p-value is dimensionless; the "(M)" is a convention for "of a
  molar value". Left alone because the headers are what Jon's downstream sheets read.
- **The scatter's hi-res PNG follows the theme** — dark in dark mode. Curve, box and selectivity
  exports are white. Whether a published scatter should ever be dark is Jon's call.
- **Plate tab cards** leave ~40 % of each card empty below the legend. Cosmetic, outside this pass.
- **Flag text "Hookx1"** would read better as "Hook ×1"; it is matched by prefix elsewhere, so it
  was left.

### Regression results
`tools/echo_invariants.mjs` (E1–E10, now in CI) passes; against `921cf61` it reports 15 findings
and against `7105f71` the E6 refit drift — each check proven by the bug it guards. All 63 fits
match scipy's bounded optimum (no larger SSE; DC50s agree to three significant figures); CIs
match scipy within rounding; `_tQ95` matches `scipy.stats.t` to five decimals. `check_shared`:
Beacon and Lumina in sync, Lumina's example plate refits. Every exported PDF rasterised and read;
no raster in vector PDFs for plain names. No horizontal overflow at 390, 320 or 768 px on any
Plots or Curves view. Echo embedded in dHUB runs the pipeline and exports a compare PDF.

### Residual risk
- No multi-assay test data: the assay-type labels and per-assay PDF split were read, not run.
- The PDF raster fallback (Greek, emoji) is drawn in Plex while the rest of the PDF is
  Helvetica — correct glyphs, visibly a different face.
- Curve-edit undo is per session; it does not survive a reload (the edits themselves do).

---

## Labbook — 2026-09-28

### Scope & environment
- **App:** `apps/labbook/labbook.html` — Planner (Home, Today, Week, Experiments), experiments and
  their steps, calculators and plate maps, Journal and Notes, Visualize, the Designer, the Report
  and every export, import/backup/restore, boot and persistence, cross-app messages, search,
  timers, the tour. Also `labbook-standalone.html` and Labbook embedded in dHUB (file:// and http).
- **Base commit:** `c30f5d0`. Worked directly on `main` (the tree was clean); one commit per bug.
- **Tools:** Playwright (Chromium and WebKit) driving the real page; `tools/invariants.mjs`,
  `tools/mobile_sweep.mjs`, the in-page runtime/alignment/fit audits, `check_css`, `check_js`,
  `check_shared`, `audit_app --xref`, `embed.py` (all five profiles). Session scratch scripts for
  probes: injection sweep, typing, boot with corrupted storage, quota, cross-origin framing.
- **Viewports:** 1920×1080, 1366×768, 1024×768, 768×1024, 390×780/844, 375×640, 320×568, light and
  dark. Touch emulation below 768 px.
- **Baseline:** every invariant held, the phone sweep was clean and the static checks were clean
  before anything was changed. So all 29 bugs below lay outside what the existing checks covered.

### Coverage matrix
| Area | Functional | Edge | Math | UI | Mobile | Stress | Persistence | Errors | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Home / Today / Week | ✅ | ✅ | — | ✅ | ✅ | ✅ drag | ✅ undo | ✅ | ✅ keyboard | ✅ |
| Experiments: create, code, prefix, duplicate, replicate, move, delete | ✅ | ✅ dup codes, blanks | — | ✅ | ✅ | ✅ double-click | ✅ undo + trash | ✅ | ✅ | ✅ 600 exps |
| Steps, snooze, slip, waits, timers | ✅ | ✅ | ✅ `_parseWait` | ✅ | ✅ | ✅ rapid tick | ✅ reload | ✅ | — | ✅ |
| Calculators | ✅ | ✅ 0/blank/neg/huge/text | ✅ hand-checked | ✅ | ✅ | — | — | ✅ | — | — |
| Plate editor & reader values | ✅ | ✅ 7 grid shapes | ✅ series, units | ✅ | ✅ | — | ✅ undo | ✅ | — | ✅ |
| Echo picklist → plate | ✅ | ✅ BOM, `;`, padded wells, failed | ✅ concentrations | — | — | — | — | ✅ | — | — |
| Journal & Notes | ✅ | ✅ switch day mid-typing | — | ✅ | ✅ | — | ✅ | — | ✅ | ✅ 365 days |
| Visualize | ✅ | ✅ 0, neg, NaN, Infinity, 1e12 | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| Designer | ⚠️ via invariants I1–I25 | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | — |
| Report & exports (PDF, CSV, JSON, bundle) | ✅ | ✅ formulas, quotes | — | ✅ | ✅ | — | ✅ round trip | ✅ | — | — |
| Import / backup / restore | ✅ | ✅ wrong file kinds, script | ✅ replicate stats | — | — | — | ✅ | ✅ | — | — |
| Boot & storage | ✅ | ✅ corrupt, wrong shapes, `[]` | — | ✅ pill | — | ✅ quota | ✅ | ✅ | — | — |
| Cross-app messages (`dhub:context`, `lb:go`) | ✅ | ✅ malformed, cross-origin | — | — | — | — | ✅ | ✅ | — | — |
| Search (⌘K, Experiments filter) | ✅ | ✅ regex chars, 500 chars | — | — | ✅ | — | — | ✅ | — | ✅ |
| Inline sum & autocorrect | ✅ | ✅ | ✅ | — | — | — | ✅ ⌘Z | — | — | — |
| Tour | ✅ | — | — | ✅ on screen | ✅ | — | ✅ returns | — | — | — |
| Firebase sync, attachment upload | ❌ needs a signed-in session | | | | | | | | | |

### Bugs
Every bug in this table is fixed. Commits are on `main`, one per bug, with the ID in the message.

| ID | Sev | Area | Summary | Root cause |
|---|---|---|---|---|
| LB-1 | High | Plate values | A space-separated reader grid filled only column 1 (8 of 96 values); with row letters, nothing | The separator was tab / `;` / `,` only — report item N1 from the Blueprint run, now fixed here |
| LB-3 | High | Import | An imported experiment's rich text could run script inside the Hub's origin, where the Firebase session lives | Imported HTML was rendered as-is |
| LB-4 | High | Undo / trash | ⌘Z after a delete left the item in Deleted items; restoring it later wrote the old copy over everything edited since | Six delete paths snapshotted the record but not the trash entry |
| LB-7 | High | Boot | When the saved copy could not be parsed, the first save (seeding runs at boot) overwrote it within a second, while the warning said nothing had been deleted | Nothing set the unreadable text aside |
| LB-8 | High | Boot | `projects` as an object, a null record or a non-list `blocks` gave a blank page; a stored `[]` was taken for a tree and saved back as `[]` on every change | No shape normalisation at boot or cloud adoption |
| LB-9 | High | Replicates | Importing a copy of your own replicate added it to the set: n 2 → 3, geometric mean 10 → 4.6 nM | `repGroup` survived the import |
| LB-17 | High | Messages | A malformed result, table or plate from another app broke that experiment's Results, Home and Visualize on every render | The payload was saved unchecked |
| LB-19 | High | Visualize | A target name could run script from the target chips | `esc(t).replace(/'/g,"\\'")` — `&#39;` decodes back to `'` inside the attribute |
| LB-21 | High | Restore | Restoring a folder export replaced the whole notebook with nothing, behind a confirm that did not say what the file held | The check was `'experiments' in data`, which a bundle passes |
| LB-23 | High | Calculators | With a plasmid too small to pipette, the NanoBRET mix table made the tube 101.9 µL instead of 88: each well got 86% of the DNA and FuGENE | The Opti-MEM remainder subtracted the undiluted volume, not the diluted one it told you to add |
| LB-24 | High | Calculators | Same for the spike-in intermediate | Same |
| LB-2 | Med | Exports | Notes, compounds and labels starting with `= + - @` ran as formulas in Excel/Sheets | No CSV formula guard |
| LB-5 | Med | Steps | Snoozing a step re-dated the steps already ticked on that day | `snoozeBlock` did not skip done steps (`slipRest` did) |
| LB-6 | Med | Experiment | A typed code could be blank or another run's; the list never refreshed; the start date had no undo | A malformed guard (`if(f==='status') if(f==='code'…`) and no checks |
| LB-10 | Med | Plate summary | A rising series read as "12 concentrations"; 0.9999 nM printed "1000 pM"; the exponent form was unreadable | `_seriesText` read one direction; rounding after choosing the unit |
| LB-11 | Med | Plate editor | After 384 → 96, dropped wells' values still set the colour range and their headers still printed | `plSetFormat` only filtered the wells (the Labbook twin of BP-6) |
| LB-12 | Med | Inline sum | `3.5e3*2=` wrote 6; `B12*2=` multiplied a well name | The run was cut out of the middle of a token |
| LB-14 | Med | Status | After a full disk was freed, the pill said "Not saved!" for the rest of the session | The failure flag was never cleared |
| LB-15 | Med | A11y | Navigation rows, experiments in a folder, Journal days and Home's cards could not be reached with Tab | Clickable `div`s with no `tabindex` |
| LB-18 | Med | Security | Any page that framed or opened the standalone build could post results or a plate into the open experiment | No origin check on the message listener |
| LB-20 | Med | Visualize | A non-finite potency crashed Visualize ("Invalid string length") | The axis tick loop ran to infinity |
| LB-22 | Med | Picklist | Zero-padded wells (`B05`) were counted and drawn nowhere; European-Excel picklists read as empty | No unpadding; comma-only CSV reader |
| LB-26 | Med | Projects | A typed prefix already used by another project was accepted; re-coding could duplicate codes and had no undo | No uniqueness check on the typed path |
| LB-27 | Med | Undo | Protocol update, move, archive, status, exclude, duplicate and replicate had no undo step | `undoMark` missing |
| LB-29 | Med | Week | Dragging a step had no undo, never offered to move the later steps, and skipped the volume chain | `wkMoveTo` set the date directly |
| LB-13 | Low | Mobile | At 320 px the Designer's cards scrolled the page sideways | 310 px grid floor |
| LB-16 | Low | Timers | Pressing a step's timer twice started two alarms | No duplicate check |
| LB-25 | Low | Calculators | The ligand-in-suspension recipe printed 0.004 µL as a step | No pipetting hint there |
| LB-28 | Low | Concentrations | Below 1 fM only two decimals: 0.00501 fM printed "0.01 fM" | `_cn` in the fM branch |

**Totals:** 29 bugs found (0 Critical, 11 High, 14 Medium, 4 Low), 29 fixed, 0 open in this
table. Items that need a decision are below.

### Not fixed — recommendations
- **D1. The local cache has a ~5.2 MB ceiling (Needs decision; critical on trajectory).**
  `localStorage` rejects writes past ~5.2 MB, and a NanoBRET-sized experiment is ~35 KB, so the
  notebook stops saving locally at roughly 130–140 experiments. Jon's notebook is 0.36 MB with 10.
  When it happens the app says so loudly ("Not saved!", an alert, and since LB-14 it recovers), and
  a signed-in device still syncs per record. But the standalone PWA, signed out, loses what was
  typed after the last good save on reload. **Fix:** move the tree to IndexedDB, per record, with
  a one-time migration. It is a storage-format change, so it was not made without asking.
- **D2. Replicate means do not convert units.** `repResultStats` averages potencies as reported,
  while Visualize converts µM/pM to nM. Echo and Lumina both always send nM, so no live data is
  affected. Fix: the same conversion `vizPotencyRows` does.
- **D3. At 320 px a few placeholders are clipped** (Designer search, two New-experiment fields)
  and the Visualize legend wraps with a hanging indent. Cosmetic, on the narrowest phones only.
- **D4. Beacon's `parsePlateCSV` still reads a space-separated grid as one column** (the Blueprint
  report's N1, third copy). Out of scope for a Labbook run; the two-line fix is Labbook's LB-1.

### Regression results
- **`tools/invariants.mjs`:** every invariant holds on both builds — I1–I25, R1–R7 and the new
  **B1–B19**, one per class found here. Each B check was proven against the pre-test build
  (`c30f5d0`), where every one reports its bug.
- **Phone sweep:** clean on Chromium at 390 and 375 in both themes, on WebKit, embedded in an
  iframe, and at 320×568 apart from D3.
- **Desktop and tablet audits** (runtime, alignment, fit, sideways scroll) are clean over 20
  screens at 1920, 1366, 1024 and 768 in both themes.
- **Perf** under 4× CPU throttling is unchanged versus the pre-test build: open experiment 53 vs
  52 ms, keystroke 31 vs 32 ms, plate editor 92 vs 90 ms.
- **Messages:** Echo → Labbook still lands in the file:// Hub and the http Hub; a same-origin
  embed is accepted and a cross-origin framer is rejected.
- **Static:** `check_css`, `check_js`, `check_shared` and `audit_app --xref` are clean, and all
  five `embed.py` profiles build.

### Residual risk
- **Firebase sync and attachment uploads were not exercised.** They need a signed-in session.
  LB-8's normalisation runs on cloud adoption, but it was tested only with local trees.
- **Archive-embedded protocol steps** were covered through the invariants on the standalone
  build. They were not explored by hand.
- **Touch** was emulated, not tested on a real iPhone.
- **Rich text pasted from the web** relies on the browser's paste sanitiser. Only imports are
  defanged (LB-3).

---

## Blueprint + Ribbon — 2026-09-28

### Scope & environment
- **Apps:** `apps/blueprint/blueprint.html` (Plate Designer, Gel Designer, History) and
  `apps/ribbon/ribbon.html` (3Dmol structure renderer), standalone and embedded in dHUB.
- **Base commit:** `091da2a`. Work was done in a temporary worktree, because the main checkout
  had another session's uncommitted Labbook/Lumina work. It was merged into `main` afterwards.
- **Tools:** Playwright (Chromium, headless WebGL) driving the real pages, plus
  `tools/audit_runtime.js`, `tools/audit_align.js`, `check_css`, `check_js`, `audit_app --xref`
  and `embed.py`.
- **Viewports:** 1920×1080, 1366×768, 1024×768, 768×1024, 844×390, 390×844 and 320×568, in
  light and dark themes. Touch and mobile emulation were used below 768 px.
- **Ribbon network:** Ribbon was driven against live RCSB. The permanent checks stub RCSB with a
  synthetic two-chain structure.

### Coverage matrix
| Area | Functional | Edge | Math | UI | Mobile | Stress | Persistence | Errors | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Plate designer (select, type, label, merge, gradient) | ✅ | ✅ | — | ✅ | ✅ | ⚠️ rapid-click not scripted | ✅ undo | ✅ | ⚠️ keyboard only | ✅ 384×labels, 10 redraws 16 ms |
| Dilution series | ✅ | ✅ block/row/col, fold ≤1 | ✅ hand-checked | ✅ | ✅ | — | ✅ undo | ✅ | — | — |
| Plate-reader values | ✅ | ✅ 7 paste shapes | ✅ values checked well by well | ✅ | ✅ | — | ⚠️ not saved in History (by design) | ✅ | — | — |
| Brackets / format / PNG export | ✅ | ✅ quotes, narrow plate | ✅ legend geometry | ✅ | ✅ | — | ✅ | — | — | — |
| Gel designer | ✅ | ✅ quotes, comb changes | — | ✅ | ⚠️ ribbon is a sideways strip | — | ✅ undo | — | ⚠️ | — |
| History (plate + gel) | ✅ | ✅ repeat export | — | ✅ | ✅ | — | ✅ save/load round trip | — | — | — |
| Ribbon load / search | ✅ | ✅ bad code, offline, race | — | ✅ | ✅ | ✅ overlapping requests | — | ✅ | ⚠️ | — |
| Ribbon chains, tags, residue labels | ✅ | ✅ long text | — | ✅ | ✅ | — | ✅ design round trip | — | ❌ no keyboard route (N5) | — |
| Ribbon export | ✅ | ✅ labels on/off, JPEG, 1200 dpi dims | ✅ image hash with/without labels | ✅ | — | — | — | — | — | — |

### Bugs
Every bug in this table is fixed. Commits are on `main`, one per bug group, with the IDs in the
message.

| ID | Sev | Area | Summary | Root cause |
|---|---|---|---|---|
| BP-1 | High | Plate | Clicking the plate format already active, with wells on it, opened "Change plate format?" and Continue wiped the plate | `setFormat` skipped the no-op only when the plate was empty |
| BP-5 | High | Values | A space-separated grid (the format the dialog itself advertises) filled only column 1: 8 of 96 values, silently | The separator was tab / `;` / `,`, so each line became one cell |
| H1 | High | History | A saved plate loaded with the brackets of the plate on screen before it | Brackets were never saved or reset on load |
| G1 | High | Gel | A lane label containing `"` was cut at the quote on the next render, and the next edit stored the cut text | `value="'+label+'"` was not escaped |
| G2 | High | Gel | Changing 20 → 15 wells erased every lane label | `gdInit` rebuilt every lane |
| G3 | High | Gel | ⌘V inside a label field, with lanes selected, pasted lanes over lanes | The clipboard keys were handled before the in-field check |
| RB-1 | High | Ribbon | A saved design lost its residue labels | `collectDesign` never wrote `residueLabels`, though load read it |
| BP-2 | Med | Plate | Giving wells a type dropped their merged-label group | The well was rebuilt as `{typeId,label}` |
| BP-3 | Med | Plate | Renaming a built-in type could not be undone, was not saved with the design, and carried over into every design loaded later | The rename wrote into the shared `WELL_TYPES` list, which was outside the undo state |
| BP-4 | Med | Plate | Opening the well editor on an empty well and clicking away painted the well | Commit created the well even with no text typed |
| BP-6 | Med | Values | Reader values survived a change of plate format and coloured the new plate | Nothing cleared `pdVals` |
| BP-7 | Med | Dilution | A block (replicate rows) got no dilution series | The series was offered only for a single row or column |
| BP-8 | Med | A11y | Tab could never leave the plate | Tab was always captured to walk the wells |
| BP-10 | Med | Plate | A bracket label containing `"` was cut at the quote | Same as G1 |
| BP-11 | Med | Plate | The dilution section widened the panel to 471 px over the plate; its title sat beside the fields, the checkbox was 78 px wide and the buttons 38 px tall | `.dil-fields input` matched the checkbox; a column container had `flex-wrap` |
| BP-12 | Med | Export | On a narrow plate the PNG legend ran off the image (817 px of legend on a 552 px image) | The legend was one line, never wrapped |
| H2 | Med | History | A loaded gel lost its lane widths and its B/I button states | The load copied only label and type |
| G4 | Med | Gel | A gel bracket label was cut at a quote | Same as G1 |
| G5 | Med | Gel | The gel had no undo, yet Clear, Cut, Fill lanes and a comb change all destroy work | Undo was never built for the gel |
| M1 | Med | Mobile | At phone width a bracket's size box and ✕ were off the edge, and the panel does not scroll sideways | The row did not wrap |
| M2 | Med | Mobile | The selection sheet stayed over the plate after the selection was cleared | Nothing closed a sheet that a selection had opened |
| RB-2 | Med | Ribbon | A design whose structure failed to load applied its colours and labels to the next structure | The pending design was not tied to its PDB id |
| RB-3 | Med | Ribbon | A slow earlier search replaced a newer search's results | Searches had no request token |
| RB-4 | Med | Ribbon | After a failed fetch, the old structure was labelled, saved and exported under the failed code | `currentPdbId` was set before the fetch and never restored |
| RB-5 | Med | Ribbon | Chain tags were cut to "…" on screen while the export drew the full text | `.chain-tag` had `max-width` + ellipsis |
| RB-6 | Med | Ribbon | "Include labels" off still exported residue labels | 3Dmol labels live inside the WebGL canvas |
| RB-10 | Med | Ribbon | Offline, the app said the PDB entry does not exist | Network and 404 failures shared one message |
| BP-9 | Low | Plate | The format dialog said "cannot be undone", but ⌘Z undoes it | Stale copy |
| H3 | Low | History | Exporting an unchanged design again added a duplicate entry | No dedupe |
| M3–M5 | Low | Mobile | At 320 px the bracket add-buttons were clipped, the dilution rows were off-screen, and the Values dialog buttons broke onto two lines | Rows did not wrap; buttons had no `nowrap` |
| RB-7 | Low | Ribbon | On a phone, the load toast covered the Controls button for 2 s | Both sat at the same bottom offset |
| RB-8 | Low | Ribbon | On a phone, the ✕ and palette Reset tap targets were 13–20 px | No mobile size |
| RB-9 | Low | Ribbon | Standalone Ribbon ignored the `hub_theme` every other app reads | It used its own `ribbon_theme` key |

**Totals:** 35 bugs found (7 High, 20 Medium, 8 Low), 35 fixed, 0 open. Nothing was Critical.

### Not fixed — recommendations
- **N1. The same paste bug (BP-5) is in Labbook's `plParseValues` and Beacon's `parsePlateCSV`.**
  They are the 3rd and 4th copies of the parser, and both read a space-separated grid as one
  cell per line. They were not touched: they are outside this test's scope, and `labbook.html`
  had another session's uncommitted edits in it. Fix: port Blueprint's `spaced` detection (two
  lines). Risk if left: the same silent one-column fill.
- **N2. Blueprint → Labbook drops gradient shades, merged-label groups and brackets.**
  Labbook's plate supports `shade` and `groups`. The fix needs a decision on how those map
  across, and it touches Labbook.
- **N3. On a 1366 px screen, the floating selection panel covers the right third of a 96-well
  plate.** This predates the test. There is no room beside the plate, and the panel is
  draggable. Deciding where it goes when it does not fit is a design call.
- **N4. On a phone, the Gel Designer's ribbon is a 1,700 px sideways strip, with Export PNG at
  the far end.** The source comments say this was deliberate. The alternative is a tall wrapped
  ribbon.
- **N5. In Ribbon, a chain can only be picked by clicking the 3D model.** There is no keyboard
  or list route to colour or label a chain. Proposed: chain chips in the sidebar.
- **N6. Saving a Ribbon design under an existing name overwrites it without asking.**
- **N7. Ribbon rejects extended PDB ids (`pdb_0000xxxx`).**
- **N8. On first load, Blueprint's plate is blank for about 0.6–1 s** while the page settles.
  Cosmetic.

### Regression results
- **Blueprint scripted regression:** 32/32 pass. It covers every fixed bug plus the adjacent
  paths: other format pills still ask, typing in the editor still works, row paste still works,
  and single-row dilution offers one direction only.
- **Ribbon scripted regression:** pass. It covers save → load with a residue label, the failed
  design, the search race, the failed-fetch id, an export with and without labels, and offline
  versus missing entries.
- **Runtime + alignment audits:** clean at all seven viewports in both themes, on 10 Blueprint
  states and 8 Ribbon states. What remains is the intentional sideways-scroll strips (tab bar,
  gel ribbon, Ribbon top bar) and two known low alignment notes in the gel bracket rows.
- **Static checks:** `check_css`, `check_js` and `audit_app --xref` are clean.
- **Build:** `embed.py` builds, and both apps load inside dHUB with no page errors.
- **Permanent checks:** `tools/design_invariants.mjs` has 12 invariants and 31 cases, and runs
  in CI before deploy. Every invariant was proven by running it against the pre-fix files,
  where each one reports its bug.

### Residual risk
- **Firebase sync of History and Ribbon designs was not exercised.** It needs a signed-in session.
- **Touch gestures were emulated, not tested on a device.** That covers rubber-band select on the
  plate and dragging label tags in Ribbon.
- **Exported PNGs were checked** by size, legend geometry and a pixel hash, **not by eye at every
  format.**
