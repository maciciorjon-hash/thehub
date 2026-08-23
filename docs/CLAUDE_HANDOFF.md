# Claude Handoff

Compact coordination note. Read it before starting work; the full changelog is
`docs/SESSION_HISTORY.md`, and the durable design facts are in `CLAUDE.md`.

## Current checkpoint

- Date: 2026-08-23 · **v1.8.0** · branch `main`, everything pushed and deployed.
- This pass was corrective: an audit found things the visual work could not see. Deployment did
  not do what the docs said, three data paths reported things that were not true, and the
  flagship saved nothing. Then four product gaps: closing an experiment, editing a setup,
  getting a catalogue in and out, and reporting across experiments. Then a shell dead-code
  sweep, the protocol-day derivation, and one SheetJS for the whole Hub.
- **The Archive PWA is live**: `…/archive-14cadcd792a2/` returns 200 with all five files, where
  it returned 404 for as long as CI has existed. Root `/` serves the 11.61 MB bundle.
- Full detail is the 2026-08-22/23 entry at the top of `docs/SESSION_HISTORY.md`.

## What changed this pass

1. **Deployment told the truth.** CI built one profile with no `--profile`, so the Archive PWA
   was never in the artifact and the public build was the full personal one. `openApp` now
   enforces `ADMIN_ONLY_APPS` from every entry point (`#labbook` used to open Labbook for
   anyone); `openCells` filters its three tabs for the same reason. `embed.py`'s card strip used
   a lazy regex that cut mid-card — 4 opens, 3 closes — so `product` shipped 8 orphaned
   fragments; it is a depth counter now.
2. **dHUB survives without Firebase.** `initializeApp` was unguarded at the top of the one
   `<script>` block that defines everything else, so blocked gstatic was a blank page.
3. **`tools/check_js.py`** parses all 43 inline script blocks plus the concatenated injected
   back-button script — the one that shipped a SyntaxError into all 19 apps unnoticed. Wired
   into `embed.py` and CI.
4. **Echo persists sessions** — IndexedDB autosave + `.echo.json`. Verified by SHA-256: every
   input file returns byte-identical through both paths.
5. **Labbook**: experiments can be closed (paused/abandoned/archived, and a chosen status is no
   longer reverted by `syncExpStatus`); the setup can be re-applied after creation; reports
   across a project or a date range; results and deviations finally reach the PDF; deviations
   now see calculator edits, not just protocol params.
6. **Sync is per record.** `save()` sent the whole tree every 1.2 s; it sends only what moved,
   as one `update()`, and listens for other clients.
7. **Archive Library** has CSV import/export with a preview and real dedupe keys.
8. **Shell dead code removed, cross-checked.** Four of the six names the audit flagged were live
   bridges other apps reach through `window.parent`. `_allGroups` and `wgCompleteTask` went, and
   with them `PRIMARY_CARDS` — whose only reader `_allGroups` was. `audit_app.py` gained
   `--xref` and top-level data-table checking; the repo is clean under it.
9. **8 protocol stage days injected** across 6 protocols, from `tools/derive_protocol_days.py`
   via a reviewed TSV. `PROTOCOL_VERSION` deliberately not bumped — see Open ends.
10. **One SheetJS, carried by the shell.** Dora, Lumina and Iceberg take `window.parent.XLSX`
   and work with no signal; their CDN tag is the standalone fallback. +0.84 MB.

## What exists now, in one pass

1. **Protocols are data.** `PROTOCOL_DATA` in Archive: 153 stages, 512 steps, 561 typed params,
   111 callouts. The Protocol tab is generated from it. Round trip verified 33/33 including
   digits, against the pre-migration file from git.
2. **A protocol stage is a dated block.** One block per stage, so two protocols interleave on
   the calendar. Locked prose, editable params, per-step ticks and notes. `b.html` is a derived
   cache, which is why ~15 existing consumers were untouched.
3. **One Today view** replaced the Notebook day page, the `__ongoing__` dashboard and the
   carry-over list, and shows live cultures from the shell's `JournalStore`.
4. **The Echo loop runs both ways**: picklist → plate map (parsed in Labbook) and picklist →
   whole experiment; potencies → Results tab and the publication prose.
5. **Cells** = Incubator + Cell Archive + Iceberg, merged at the shell, joined by base cell-line
   name at read time. Incubator is a dense list with a right drawer; Cell Archive has no tab bar.
   The lifecycle closes both ways — `hubThawVial(loc)` and `freezeCulture(id)`.
6. **Archive is a Library**: Protocols · Antibodies · Primers · Plasmids, each with a detail
   pane and a structured location that points at a real Iceberg box. Plasmids reads SnapGene
   `.dna` and GenBank, with ring/linear/sequence views and unique cutters. The standalone
   Plasmids app is retired. Labbook has no reagent catalogue of its own — only mentions.
9. **Iceberg is the one freezer map** for every kind of contents, and the shell's
   `HUB_FREEZER_*` bridge is how anything else asks where something is.
10. **OneNote export** in Labbook: `copyForOneNote()` and `exportOneNoteDoc()`.
7. **Eight features off the typed params**: deviations, timers, biological replicates, protocol
   update diff, picklist→experiment, reader values, hub-wide Cmd+K, thaw.
8. **Visual system**: nine type steps, five radii, one icon set (`tbSvg`). dHUB is 40% smaller.

## Open ends

- **142 of 153 stage `day` values are 0**, and that is the right number, not a backlog. Only 18
  stages contain any day-ish phrase and several are false positives; the honest yield was 8.
  `docs/protocol-days-review.tsv` records the three rejections and why. The rest get set in the
  New-experiment timeline against a real experiment, and `LB.data.protoDays` remembers them per
  protocol — which is the mechanism, not a workaround for one.
- **`PROTOCOL_VERSION` is still 1, deliberately.** `b.proto` does not snapshot `day` and
  `protoDiff` compares step ids, params and prose, so bumping it for a day-only change would
  mark every existing block outdated and then show an empty diff. Bump it when protocol *prose*
  changes; the update-diff machinery still has no real case to serve.
- **The `/journal` rules still need pasting into the Firebase console.** They already cover the
  new `antibodies`/`primers`/`plasmids` children, so no rules change is needed — but until they
  are deployed the Library is local per device.
- **Echo loads jsPDF from a CDN** (`cdnjs.cloudflare.com`) and Echo and Dora load **RDKit from
  unpkg**. CLAUDE.md's offline section now names all three; none is fixed, and RDKit is the one
  with no page-level banner in either app that uses it.
- **The 2026-08-21 session has no `SESSION_HISTORY.md` entry** (the workspace rail, the three
  Labbook surfaces, the tooltip/icons/background pass). CLAUDE.md carries the design facts; the
  changelog does not. Not mine to reconstruct.
- **The stop-hook is stale**: `.claude/stop-hook.sh` targets `The Hub.html` (gone) and a
  `LAST_SESSION_END` marker that no longer exists, so it is a no-op. The changelog is maintained
  by hand.
- Blueprint, Blot and Helix are out of the product profile. If they should be in, it is one line
  in `embed.py`.

## Traps added this pass

- **`node --check` is the whole test suite.** `tools/check_js.py` is the only thing standing
  between a stray brace and 19 apps that fail silently in `srcdoc` iframes. Run it; do not
  `--no-js-check` past it.
- **A lazy `[\s\S]*?` to the next `</div>` cuts mid-element.** It stops at the first close on
  its own line, which in a card is `.card-header-row`. Count depth. This is a second instance of
  the end-anchor family of bugs already recorded below.
- **`fillSetup` destroys its own template.** Placeholders are substituted in place, so a second
  pass has nothing to fill — that is why blocks now carry `b.tpl`. And re-rendering prose you
  have edited is data loss: only regenerate what still matches the template for the *old* setup.
- **Print rules belong in `PRINT_CSS`, not the app stylesheet.** `buildOneNoteHtml` rescopes and
  inlines `PRINT_CSS`; anything elsewhere comes out of OneNote unstyled. I put the new table
  rules in the wrong place first and got exactly the documented unruled-table symptom.
- **Record `_cloudSeen` only after the write resolves.** Recording it before makes a failed
  write invisible to the next diff and the record is never retried.
- **The preview browser's renderer dies during a full Echo analysis.** The committed pre-change
  Echo does the same, so it is the pane, not your change — verify the pipeline in a real
  browser and say so rather than claiming an end-to-end check you did not run.
- **`audit_app.py` cannot see a cross-app bridge.** Apps reach the shell through
  `window.parent`, so per file the shell's live bridges look like orphans. Run it with
  `--xref` over the shell and every app before deleting anything. CSS is the opposite and stays
  per file: a `srcdoc` iframe is a separate document, so a class the shell defines and never
  applies is dead however many apps use the same name.
- **Check a candidate against the pre-session commit before deleting it.** If the count is
  unchanged it was already dead and is not something you orphaned — and if it changed, find out
  what you broke first.
- **Reviewing rows one at a time cannot see the sequence.** Every proposed protocol day was
  defensible alone; loaded into the timeline, `ip` read 0,0,0,1,0 — elution dated a day *before*
  the capture it follows. Check the whole ordering, not each diff.
- **"overnight" as an adjective is a reference, not a wait.** "Add overnight samples to beads"
  describes a wait that already happened. Same shape as the `&amp;` trap: text that means one
  thing to a reader and another to a matcher.
- **`len(str)` is characters, not bytes.** SheetJS's codepage tables are multi-byte, so a
  639,127-char block is 882 KB on disk. Quote sizes from `wc -c`, not from Python's `len`.
- **`selectNode` takes a string kind, not an object.** `selectNode({kind:'home'})` silently does
  nothing, which reads as "the view is broken" when it is the test that is.

## Traps

- **OneNote export**: read every element's computed style *before* mutating the DOM. Removing
  the `<style>` block during the walk strips the CSS from everything measured after it — the
  symptom is unruled tables, and it looks like a CSS bug rather than an ordering one.
- **`_ON_*` inlining** renders into a stage that is *positioned off-screen*, never
  `display:none` — `getComputedStyle` on a hidden tree returns nothing usable. Same reason
  Archive's parked frame uses `left:-10000px`.
- **Regex alternation is ordered.** `/(α|a|anti)/` strips the `a` out of `anti-DCAF15`. This bit
  the antibody name derivation; longest alternative first.
- **`migratePlasmidsToLibrary` is now the only route** out of the retired app's
  `localStorage['hub_plasmids']`. Don't break it.

- Anything declared **between the `PROTOCOL_DATA` markers is regenerated away** by
  `migrate_protocols.py --inject`. `PROTOCOL_VERSION` was lost that way once, and every
  experiment then silently fell back to the flat one-block path with no error anywhere.
- `migrate_protocols.py` **refuses to run without `--from`**. Pointed at its own output it parses
  to empty stages, `--check` passes vacuously, and an inject wipes all 33 protocols.
- When deleting a block, **search the end anchor forward from the start index**, never from the
  start of the file. `classList.add('pulsing')` appears twice; getting this wrong duplicated
  14 KB instead of removing it. **Assert brace balance before writing** — a block can span into
  a function.
- Echo's `_lastResultsData` is a top-level `let`; assigning it from the parent window does not
  reach it. Use `eval` inside Echo's scope.
- The browser console buffer in this tooling is **per tab and not cleared on reload**. A fresh
  tab is the only reliable way to tell a real error from a leftover.
- Blueprint's plate formats are `{rows,cols}`; Labbook's are `{r,c}`. Porting between them
  without translating returns null silently.

## Verification used throughout

`tools/check_js.py` (all 43 blocks; also runs inside `embed.py`) · `tools/check_shared.py` ·
`tools/audit_app.py --xref shell/hub-shell.html apps/*/*.html` · `migrate_protocols.py --from
<pre-migration> --check` (33/33) · `python3 -m py_compile` · all four `embed.py` profiles ·
`git diff --check` · browser checks in **both** paths (standalone and dHUB) · and a **fresh tab**
for console errors.

The pre-migration file for the protocol round trip is `git show 0af7612:Archive/archive.html`
(the path was `Archive/` before the repo reorganisation). `migrate_protocols.py` refuses to run
without `--from`, and pointed at its own output it passes vacuously and an inject wipes all 33.

## Coordination rule

After each meaningful change, update this file with what changed, what it touched, what was
verified and what is still open. Add a dense entry to `docs/SESSION_HISTORY.md`. Keep
`CLAUDE.md` for durable design facts. Keep secrets out.
