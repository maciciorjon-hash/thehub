# Claude Handoff

This is the compact coordination note for Claude/Codex. Read it before starting work;
the full historical detail lives in `Archive_Log/SESSION_HISTORY.md`.

## Current checkpoint

- Date: 2026-08-01
- Branch: `main`
- Latest commit: the current Labbook UX/context checkpoint is recorded in the Git history;
  use `git log -1` for its exact hash.
- Remote: this checkpoint is intended to remain a separate commit on `origin/main`. The Pages
  workflow rebuilds from the tracked source files after push.
- GitHub Pages deploys from `.github/workflows/deploy.yml`; it rebuilds `dist/index.html` from
  the tracked source files. Local `dHUB.html`, `dist/`, and standalone generated bundles are
  intentionally ignored.

## Completed in the latest change

- Renamed the active Bench app completely to Incubator:
  `Bench/bench.html` -> `Incubator/incubator.html`, app ID `bench` -> `incubator`, and all
  active view/frame/placeholder/link/widget references updated.
- Kept the JournalStore data model key `incubator` unchanged; no data migration is needed.
- Reorganized the admin home into four primary cards: Labbook, Archive, Data Analysis, Incubator.
- Kept Data Analysis independent from Labbook.
- Incubator groups Incubator, Cell Archive, and Iceberg/Cryo.
- Added thematic Extra Apps groups: Design & Presentation, Molecular Biology, and Personal.
- Beacon is available in the admin Data Analysis group but remains outside the public unlock flow.
- Updated `embed.py`, Labbook deep links, shell navigation, app catalog/search, widgets,
  `APP_INFO`, `APP_B64_NEW`, and active documentation.
- Removed the token-bearing Git remote URL locally. Never restore credentials in files, URLs, or
  notes. The previously exposed credential should be revoked/rotated in GitHub if that has not
  already been done.

## Verification completed

- `python3 -m py_compile embed.py`
- JavaScript syntax checks for `hub-shell.html`, `Labbook/labbook.html`, and
  `Incubator/incubator.html`
- Personal, product, and standalone Labbook builds through `embed.py`
- `python3 check_shared.py`
- `git diff --check`
- Local browser smoke test: 20 app cards, four primary groups, Incubator view, and zero console
  errors.

## Codex checkpoint: Labbook UX and app context

- Date: 2026-08-01
- Status: implementation and validation completed in a separate checkpoint from the Incubator
  rename.
- Files changed: `Labbook/labbook.html`, `hub-shell.html`, `Archive/archive.html`, and
  `Incubator/incubator.html`.
- Experiment creation now uses semantic titles such as `HiBiT degradation`, `Cell viability`,
  `Western blot`, `Kinetic degradation`, `Direct-to-biology`, and `NanoBRET target engagement`.
  A one-time migration only changes empty or known auto-generated legacy titles; custom titles
  are preserved.
- Publication-ready rebuild now explicitly includes setup fields, Archive protocol names,
  dated block titles and text, checklist text, calculator output, compound-addition text, and
  plate-map summaries. It remains manually editable and is replaced only after `Rebuild`.
- The Labbook ribbon has a stable height. Insert keeps `Plate map` as the contextual command;
  the repeated per-step plate button was removed. The plate editor now has compact `Paint`,
  `Select`, and `Erase` modes, drag painting, and quick well types such as DMSO, Control,
  Compound, Dose, and Blank while retaining the existing plate-map schema and range tools.
- `Image (inline)` was removed from Insert and slash commands, while legacy inline images still
  render. Floating `Picture` objects support persistent 16 px `Snap to grid`, arrow nudging,
  Delete/Backspace, and Escape deselection with text-input guards.
- Added versioned `dHUB context v1` messaging. The shell queues messages until `appReady` and
  clears them on `ack`. Labbook sends and receives experiment, cell-line, compound, plate-map,
  protocol, and result context through optional `e.integration` fields (or `LB.data.dhubInbox`
  when no experiment is open). Archive keeps `ARCHIVE_INDEX`, `ARCHIVE_STEPS`,
  `ARCHIVE_CALC_SCHEMA`, and `ARCHIVE_COMPUTE`, and adds `Use in Labbook`. Incubator can open a
  culture in Labbook and focuses cultures received from Labbook.
- Full Echo/Dora/Beacon result adapters remain intentionally deferred. The result envelope is
  ready for that later phase. `JournalStore.incubator` was not changed.

### Codex verification for this checkpoint

- `python3 embed.py` regenerated the local dHUB, product, personal, and standalone bundles.
- `python3 -m py_compile embed.py`
- `python3 check_shared.py`
- `git diff --check`
- Inline JavaScript syntax checks passed for the four source files plus `dHUB.html` and
  `labbook-standalone.html`.
- Browser interaction verification remains a gap in this environment: bundled Chromium was not
  installed and the available system Chrome aborted in headless mode. Recheck the plate painter,
  Picture keyboard controls, and cold deep links in a normal browser before publishing if time
  allows.

## Next useful check

After a future push, confirm the GitHub Actions Pages workflow is green and inspect
`https://maciciorjon-hash.github.io/thehub/` for the four-card admin navigation. The local source
of truth is `hub-shell.html`; regenerate bundles with `python3 embed.py` only for local testing.

## Coordination rule

After each meaningful change, update this file with:

1. Date and short description.
2. Files changed and any user-facing behavior.
3. Tests/builds run and known gaps.
4. Commit and push status.

Keep `CLAUDE.md` aligned with durable project facts. Keep secrets out of all notes and commits.
