# dHUB

Short index, loaded every session. **The long-form memory is [`docs/CLAUDE_REFERENCE.md`](docs/CLAUDE_REFERENCE.md)** (~600 KB, not auto-loaded): every design decision, bug class and verification. Find a section with `grep -n "^## " docs/CLAUDE_REFERENCE.md` (or `grep -n "<keyword>"`), read it with offset/limit. **Write new session notes there, never here** — this file must stay under ~12 KB.

## What it is

**dHUB** (`dHUB.html`) is Jon Macicior's (postdoc, Ciulli Lab, Dundee) experiment tracker for targeted protein degradation and chemical biology. Vanilla HTML/CSS/JS, no build step, no server. Every app is base64-embedded in one self-contained file. Product = **Log · Annotate · Analyse · Export**; the moat is encoded domain knowledge (34 Archive protocols with live calculators, parameterised experiment templates, a loop that understands a dose-response plate). **Spine** Labbook · **Flagship** Echo Dose Response · **Moat** Archive. No new app surface area; invest in the Echo ↔ Labbook loop and the export side.

Blocked on Jon, not on code: University of Dundee IP ownership (gates any sale), pasting `echo/**` rules from `storage.rules` into the Firebase console.

## Layout

```
shell/hub-shell.html        the shell (source of truth)       embed.py   build script (stays at root, CI calls it)
apps/<name>/<name>.html     every app, folder == file name     tools/     scripts, sync kits, Playwright invariants
docs/                       UI.md (visual standard) · CLAUDE_REFERENCE.md · SESSION_HISTORY.md · BETA_TEST_REPORT.md · CLAUDE_HANDOFF.md
vendor/  old_stuff/ (retired apps, see its README)  Backup/ (Jon's real data backups)
mobile/  the Labbook iPhone app (Capacitor; www/ from `embed.py --profile=labbook-app`, see mobile/README.md + reference › *Labbook as an iPhone app*)
```
Apps (id → folder): echo→echo · deg→dora · pd→blueprint · dna→helix · pt→protein-tools · spectra→bca · cryo→iceberg · cuppa · beacon · lumina · hitfinder · tempo · ribbon · protocols→archive · cellarchive→cell-archive · incubator · labbook · blot→western-blot. Admin-only: labbook, incubator, tempo, (hitfinder unless the Data Analysis suite code). Details: reference › *Current apps*.

## Build and CI

```bash
python3 embed.py                                    # dHUB.html, all apps (personal build)
python3 embed.py dist/index.html                    # CI/Pages
python3 embed.py --profile=product|labbook|archive|labbook-pwa
```
Push to `main` → Actions builds all profiles and deploys Pages (`https://maciciorjon-hash.github.io/thehub/`). `deploy` depends only on `build`; the invariant suites run in parallel and mark the commit but do not hold the deploy. `.githooks/pre-commit` (`tools/static_checks.sh`) runs the drift checks and refuses the commit, naming the sync script to run.

## Rules that always apply

- **Commit and push every change on main without being asked** (the push is the deploy). **Never `--no-verify`.** Other sessions edit the same working tree: commit only your own hunks, check `git status` first.
- **`Backup/` must never be moved or renamed** (the browser's directory handle finds it by name). The Archive PWA slug (`embed.py` `ARCHIVE_SLUG`) and the Labbook PWA slug `labbook-6b1d0c4f9a72` must never change.
- **Generated blocks have one source — edit the source, run the sync, never edit inside the markers:**
  fit engine → Echo only, then `tools/sync_fit_engine.py` (`check_shared.py` checks) · plate engine → Lumina only, `tools/sync_plate_engine.py` · icons → `tools/sync_icons.py` · motion → `sync_motion.py` · right-click → `tools/ctxkit/` + `sync_ctxkit.py` · help assistant → `tools/assist/` + `sync_assist.py` · guide/tour → `tools/tourkit/` + `sync_tour.py` · screen engine → `sync_screen_engine.py` · Ribbon studio → `tools/ribbon_dev/` + `inject_studio.py` · protocol Methods sentences → `tools/protocol_pub.py`.
- **Rebuild before sweeping**: `tools/mobile_hub_sweep.mjs` tests `dHUB.html`, not source — run `python3 embed.py` first or a clean run is stale. Desktop sweeps/audits read source over `python3 -m http.server 8791`.
- **A bug fix is finished only when an invariant would have caught its class** (`tools/*_invariants.mjs`), proven by putting the bug back. Verify rendering with a screenshot, not just markup.
- **Presets**: bump `_presetV*` in Labbook when you edit `PRESET_SEED`/`EXTRA_PRESET_SEED` (currently V18). `PROTOCOL_VERSION` stays outside the `PROTOCOL_DATA` markers.
- **A recorded number is never rewritten** (offer, show the diff, let the person decide). **An automatic backup never downloads.** Firebase writes only after the first cloud read has landed.
- **No native `alert/confirm/prompt`** (use the in-app toast/note/dialog); no loose `px` for `font-size`/`border-radius` (use `--fs-*`/`--r-*`); ink on a solid fill is `var(--on-accent)`; use `> svg` for one-child illustrations; `margin-left:auto` in a wrapping row is a bug (two halves + `space-between`); clamp popovers by their measured rect, never a guessed size; no `backdrop-filter`; animate only `transform`/`opacity`, never loop at rest.
- **Labbook looks like one hand**: a tick, a checkbox, a section heading, a small button, a step title are each ONE thing (`docs/UI.md › Labbook, one hand`, held by `tools/labbook_style_invariants.mjs` T1–T14; a literal `#5e87c5` fails `check_css.py`). Never write a ✓ or a `‹ ›` as text.
- Standard checks: `tools/check_css.py`, `check_js`, `audit_app.py --xref`, `check_shared.py`, `audit_runtime.js`/`audit_align.js`/`audit_escape.js`. Visual standard: `docs/UI.md`.
- Labbook on a laptop: `tools/labbook_desktop_sweep.mjs` (every screen and dialog × 3 sizes × 2 themes, in CI). Never compare `JSON.stringify` of a stored record with one built now — use `_canonJSON`/`_sigSame`; size a dialog body with `_dlgRoom`, not `70dvh`; scope a print rule to `#print-root`. Audit + study: `docs/LABBOOK_STUDY_2026-10-12.md`.
- Never put Jon's real compound names in shipped code or fixtures. UI language is English.
- The legacy RTDB secret in `thehub-f80ae` is accepted residual risk (Jon decided) — do not re-flag. `/journal` rules and Firebase Storage are deployed — do not re-raise.

## Where to read more (grep the heading in docs/CLAUDE_REFERENCE.md)

| topic | section keywords |
|---|---|
| architecture, embed, shell, Firebase, sync | *Architecture & workflow*, *Firebase integration*, *Sync: what was actually broken*, *The first push* |
| Labbook model (experiments, blocks, protocols, plates, params, trash, versions) | *Labbook — experiment-centric*, *a protocol stage is a dated block*, *As safe as OneNote*, *Attachments*, *Two workspaces*, *Planner and Journal*, *Labbook, set like OneNote* |
| Designer / presets / Methods prose / Report / exports | *The Experiment Designer*, *The Designer, broken on purpose*, *Curated experiments*, *The paragraph is live*, *Report —*, *Export by scope*, *The report is a protocol* |
| Archive, Library, PWAs, standalone Labbook | *Archive protocols are data*, *Archive Library*, *Archive as a phone app*, *Standalone Labbook*, *Labbook as the bench app* |
| Echo Dose Response | *The Echo ↔ Labbook loop*, *Echo ... beta-tested*, *Smart DMSO*, *History*, *Gradient Planner*, *normalised* |
| Lumina, Beacon, Hit Finder, Tempo, Ribbon, Blot, Blueprint, Cells/Iceberg/Incubator, Cuppa | the app's name in a heading |
| visual system, icons, motion, phone, audits | *One visual system*, *One icon set*, *Motion graphics*, *dHUB on a phone*, *Every app through the escape audit*, *The rail, compact by default* |
| ChemLib plan | *ChemLib integration* |
| open items, current state | last section, *Current state* |

Older history: `docs/SESSION_HISTORY.md`. Beta-test findings: `docs/BETA_TEST_REPORT.md`. Compact handoff: `docs/CLAUDE_HANDOFF.md`.
