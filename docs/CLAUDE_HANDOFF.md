# Claude Handoff

This is the compact coordination note for Claude/Codex. Read it before starting work;
the full historical detail lives in `Archive_Log/SESSION_HISTORY.md`.

## Current checkpoint

- Date: 2026-08-01
- Branch: `main`
- Latest commit: `6d23e34 Rename Bench app to Incubator and reorganize hub`
- Remote: `origin/main` is aligned with the latest commit. The user ran `git push origin main`
  and Terminal returned `Everything up-to-date`.
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
