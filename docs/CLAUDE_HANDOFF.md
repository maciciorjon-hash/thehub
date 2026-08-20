# Claude Handoff

Compact coordination note. Read it before starting work; the full changelog is
`Archive_Log/SESSION_HISTORY.md`, and the durable design facts are in `CLAUDE.md`.

## Current checkpoint

- Date: 2026-08-20 · **v1.6.0** · branch `main`, pushed. `git log -1` for the hash.
- The Labbook/Archive rework and the visual pass landed across ~24 commits. Every piece has a
  section in `CLAUDE.md`; this file is the running order, the open ends, and the traps.

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

- **150 of 153 stage `day` values are still 0** by design — they get set in the New-experiment
  timeline against real experiments, and `LB.data.protoDays` remembers them per protocol.
- **`PROTOCOL_VERSION` is still 1** and nothing bumps it, so the update-diff machinery is tested
  but has no real case to serve yet.
- **The `/journal` rules still need pasting into the Firebase console.** They already cover the
  new `antibodies`/`primers`/`plasmids` children, so no rules change is needed — but until they
  are deployed the Library is local per device.
- **Echo loads jsPDF from a CDN** (`cdnjs.cloudflare.com`), which the offline notes in CLAUDE.md
  do not mention. Not fixed.
- **The stop-hook is stale**: `.claude/stop-hook.sh` targets `The Hub.html` (gone) and a
  `LAST_SESSION_END` marker that no longer exists, so it is a no-op. The changelog is maintained
  by hand.
- Blueprint, Blot and Helix are out of the product profile. If they should be in, it is one line
  in `embed.py`.

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

`migrate_protocols.py --from <pre-migration> --check` (33/33) · inline-JS syntax check of every
edited file · `python3 -m py_compile` · `check_shared.py` · all four `embed.py` profiles ·
`git diff --check` · browser checks in **both** paths (standalone and dHUB) · and a **fresh tab**
for console errors.

## Coordination rule

After each meaningful change, update this file with what changed, what it touched, what was
verified and what is still open. Add a dense entry to `Archive_Log/SESSION_HISTORY.md`. Keep
`CLAUDE.md` for durable design facts. Keep secrets out.
