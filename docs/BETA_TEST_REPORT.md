# Beta Test Report

One file, newest run first. Each run is a dated section.

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
