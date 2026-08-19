# Claude Handoff

This is the compact coordination note for Claude/Codex. Read it before starting work;
the full historical detail lives in `Archive_Log/SESSION_HISTORY.md`.

## Current checkpoint

- Date: 2026-08-19
- Branch: `main`, pushed. Use `git log -1` for the exact hash.
- The Labbook/Archive rework landed in eight commits. `CLAUDE.md` carries the durable design
  notes for each piece; this file is only the running order and the open ends.

## What changed, in order

1. **Protocols became data.** `migrate_protocols.py` turned Archive's 33 hand-authored panes
   into `PROTOCOL_DATA` (153 stages, 512 steps, 561 typed params, 111 callouts). Archive's
   Protocol tab is generated from it. Round trip verified letter *and digit* by letter: 33/33.
2. **All 561 params named**, in English, keys and labels. Three extraction bugs were found by
   reading the content, not by running checks: thousands separators, ratios, negative temps.
3. **A protocol stage is a dated block.** `createExperiment` produces one block per stage, so
   two protocols interleave on the calendar. Locked prose, editable params, per-step ticks and
   notes. `b.html` is a derived cache so ~15 existing consumers were untouched.
4. **Day cadence is remembered** per protocol in `LB.data.protoDays`, set against a real
   experiment rather than guessed for 150 stages in the abstract.
5. **One Today view** replaced the Notebook day page, the `__ongoing__` dashboard and the
   carry-over list, and shows live cell cultures from the shell's `JournalStore`.
6. **The Echo loop closed** both ways: picklist → plate map (parsed in Labbook), potencies →
   Results tab and the publication prose.
7. **Cells** merged Incubator + Cell Archive + Iceberg at the shell, joined by base cell-line
   name at read time. Cell_Archive's micrographs resized: 742 KB → 323 KB.
8. **Archive Library** added antibodies and primers on `journal/*`; Labbook's antibodies were
   copied, not moved.

## Open ends

- **`freeEditBlock` is one-way and there is no "update to the current protocol" diff yet.**
  `b.proto.v` is recorded for it; `PROTOCOL_VERSION` is still 1 and nothing bumps it, so the UI
  would have no case to serve.
- **150 of 153 stage `day` values are still 0** by design — they get set in the New-experiment
  timeline as real experiments are planned.
- **Plasmids and cell lines are not in the Library** on purpose; see the CLAUDE.md section.
- Echo loads **jsPDF from a CDN** (`cdnjs.cloudflare.com`), which the offline/self-hosted notes
  in CLAUDE.md do not mention. Not fixed.
- The `/journal` rules already cover the new `antibodies`/`primers` children — no rules change
  is needed, but they still have to be pasted into the Firebase console like the rest.

## Traps worth knowing

- Anything declared **between the `PROTOCOL_DATA` markers is regenerated away** by
  `migrate_protocols.py --inject`. `PROTOCOL_VERSION` was lost that way once, and
  `ARCHIVE_PROTOCOL` then threw into its own `catch` and returned `null` — with every experiment
  silently falling back to the flat one-block path and no error anywhere.
- `migrate_protocols.py` **refuses to run without `--from`** now. Pointed at the generated
  panes it parses to empty stages, `--check` compares empty with empty and passes, and an
  inject wipes all 33 protocols.
- Echo's `_lastResultsData` is a top-level `let`; assigning it from the parent window does not
  reach it. Use `eval` inside Echo's scope.
- The browser console buffer in this tooling is **per tab and not cleared on reload**. A fresh
  tab is the only reliable way to tell a real error from a leftover.

## Verification used throughout

`migrate_protocols.py --from <pre-migration> --check` · inline-JS syntax check of every edited
file · `python3 -m py_compile` · `check_shared.py` · all four `embed.py` profiles ·
`git diff --check` · and browser checks in **both** paths — standalone (Archive embedded in
Labbook) and dHUB (Archive as a sibling frame).

## Coordination rule

After each meaningful change, update this file with what changed, what it touched, what was
verified and what is still open. Keep `CLAUDE.md` for durable design facts. Keep secrets out.
