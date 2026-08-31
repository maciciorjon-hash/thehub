# Claude Handoff

Compact coordination note. Read it before starting work; the full changelog is
`docs/SESSION_HISTORY.md`, and the durable design facts are in `CLAUDE.md`.

## Current checkpoint

- Date: 2026-08-31 · **v1.9.0** · branch `main`.
- Latest work: **the motion and scrolling pass** — the answer to Jon's *"el uso de la app es un
  poco sloppy… tiene que funcionar smooth, transiciones, desplazamientos."* It was measured
  first, and the app was not slow: a screen switch renders in 1–13 ms, a keystroke costs
  0.25 ms, a 384-well plate repaints in 1.9 ms. It was **abrupt**. See *"Sloppy" was not slow*
  in `CLAUDE.md` for the full write-up.
- The one thing that really was slow is **opening an app**: `_loadApp` froze the main thread for
  67 ms on Echo (a 46 ms per-character byte loop over 3.4 MB of base64) before the fade could
  start. Warmed on hover, the same call is 4.5 ms.
- The checkpoint below this line had gone stale — it still described the 2026-08-24 pass while
  five sessions of work (the SPARK plate, the plate gestures, undo, chained volumes, the
  selection bubble, autocorrect) landed on top of it. Their detail is in `CLAUDE.md`; the
  sections here from *What exists now* down are from 2026-08-24 and are marked as such.

## What changed this pass

1. **One timing scale, in all twenty surfaces.** `--dur-1/2/3` + `--ease`/`--ease-out`, declared
   in the shell years ago and shared with nobody. Every hover, focus and press state now
   transitions; `docs/UI.md` carries the rules.
2. **`transform` is never in the shared list** (it is what drags and canvas zooms are made of),
   and **nothing repeated in bulk gets a transition** — a plate well, a freezer slot, a table
   cell. Both exclusions are the design, not an oversight.
3. **Dialogs, popovers and both Cmd+K overlays arrive and leave** — `@starting-style` +
   `transition-behavior:allow-discrete`, no JS change, and every closed overlay is
   `pointer-events:none` so one stuck mid-exit cannot eat clicks.
4. **A screen enters, and remembers your scroll.** `_edScreenKey()` tells a navigation from a
   re-render; `#pane-ed`'s scrollTop is filed per screen and restored.
5. **An experiment's tab bar is sticky** on desktop as it already was on a phone.
6. **`overscroll-behavior` on every inner pane, axis named**, so a list running out no longer
   hands the gesture to the page behind it.
7. **Three `{passive:false}` listeners on `document` are gone** — Labbook's plate grid and week
   planner, and Echo's results-table wheel handler, which was also broken (it drove
   `.tbl-wrap`, which has no overflow, so a wide table swallowed the wheel and moved nothing).
8. **Apps are warmed on hover/focus**, on `requestIdleCallback`. `openApp`'s "nothing is touched
   until we know there is somewhere to go" guard is now actually first — it used to sit below
   `_loadApp`.
9. **Beacon's header ran two control heights** (27 and 30). One 32 px height, scoped to the
   header row.

## What changed on 2026-08-24

1. **Plasmid maps take touch.** Pointer Events + pinch. The rule: a **fitted** map gives a
   single finger back to the page (`touch-action:pan-y`); only a **zoomed** one takes it to
   pan. `_pmApplyBox` is the one writer of the viewBox because the touch rule reads the zoom
   state off `.pm-zoomed`.
2. **An experiment can be moved.** `moveExpTo` (picker), drag a row onto a folder header, and
   folders move up/down or into another project **carrying their experiments**. A project
   header does not accept a drop — "which folder" would be a guess.
3. **Priority** is `e.prio` = `high|low`; normal is the absence of the field. It sorts
   Experiments and only tie-breaks Today/Running, where the date is the fact.
4. **One menu, three doorways** — right-click, `⋯`, long press. The long press is delegated
   once against `[oncontextmenu]`, so anything with a menu gets it, now and later.
5. **Cmd+K indexes content**: block prose, step notes, daily notes, page bodies, observations,
   files, Echo results and **plate wells**. Built once per open (was: per keystroke), scored
   (was: unordered then truncated), multi-word (was: one `indexOf`), and the dead tag rows now
   refine the query.
6. **Empty folders render while browsing**, because a folder you cannot see is a place you
   cannot file into. Under a search or filter they hide again.
7. **The remote dependencies are announced.** RDKit (Echo, Dora) and jsPDF (Echo) still come
   from a CDN, but each app says so before you use the feature and again if the load fails.
   `window._depNotice(id, html)` in Echo is the one banner.
8. **Plate maps export PNG** (canvas, 2×, legend of used types) and their **well types are
   editable** — `_plOwnTypes` copies the shared default before mutating it, and removing a type
   keeps the wells.
9. **The nine "verify" calculators were re-derived numerically.** The maths was right in all
   nine; what was wrong was the arithmetic printed beside the totals, which omitted the
   dead-volume overage. `_ovx(excess)` states it, in the tables and the exported steps.
10. **The three polish items are done.** Seeding densities are *derived* from the format's
   growth area and the line's cited doubling time (`seedAdvice`), not tabulated. The
   publication prose builds real sentences — `textContent` returns "ab" for
   `<p>a</p><p>b</p>`, which had been gluing every block to the next and every search term to
   the word before it. And the step palette drags into position (`insertStepBlock(spec, at)`),
   with blocks reordering from a grip.

## What exists now, in one pass (2026-08-24)

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
11. **Every card can be acted on**, from three doorways — right-click, `⋯`, long press — with
   rename, move (menu or drag), priority, and delete on one menu per kind of thing. Cmd+K
   searches the *contents*: prose, notes, days, files, results and plate wells.

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
- **Version drift is a recurring failure here.** All three now read `v1.9.0`; check the shell
  whenever you bump the docs. It has happened before (v1.3.16 vs v1.4.1). The
  version lives in exactly one place — `shell/hub-shell.html`, the `.opts-version` span — so
  bump it there when you bump it in the docs.
- **The stop-hook is gone** (2026-08-24, with Jon's agreement). It targeted `The Hub.html`
  (removed long ago) and a `LAST_SESSION_END` marker that never made it into CLAUDE.md when the
  changelog was split out, so it had been rewriting CLAUDE.md with identical content on every
  session end and changing nothing. Script deleted, `hooks` block dropped from
  `.claude/settings.json`. **The changelog is maintained by hand** — that is the rule now, not a
  fallback.
- Blueprint, Blot and Helix are out of the product profile. If they should be in, it is one line
  in `embed.py`.

## Traps added this pass

- **A backgrounded tab does not advance a transition.** Anything whose `display` is waiting on
  one (`transition-behavior:allow-discrete`) can be left mid-exit: full-screen, invisible and
  still clickable. Every closed overlay needs `pointer-events:none`. This is also why animation
  cannot be verified in a hidden Browser pane — `document.hidden` is true, rAF never fires, and
  every computed opacity reads as its from-state. Check the wiring with `getAnimations()`
  instead; screenshots still force a paint, so layout can be checked.
- **`allow-discrete` inside the `transition` shorthand is all-or-nothing.** A browser that does
  not know the keyword drops the *whole* declaration, opacity included. That is fine — it lands
  on the un-animated behaviour — but only if the open/closed states are still correct without
  the transition. Always state them so they are.
- **A margin above a sticky element is not painted with its background.** `.exp-tabs` had
  `margin-top:10px`, so content scrolled up through the slot. Move it to `padding`.
- **An animation class left on a parent replays on every new child.** `.pane-ed.screen-in > *`
  plus an `innerHTML` swap on each render is a strobe. Take the class off — by timer, not
  `animationend`, which never fires in a backgrounded tab.
- **`overscroll-behavior: contain` is per axis, and the axis matters.** A blanket `contain` on a
  horizontal-only strip swallows the vertical wheel that was meant for the page under it.
- **A `{passive:false}` listener on `document` is charged to the whole app**, for the life of
  the session, whether or not the screen it serves is open. Bind it to the element, or add it on
  drag start and remove it on drag end.
- **`scrollLeft` on a box with `overflow:visible` is a silent no-op.** Echo's wheel handler read
  and wrote `.tbl-wrap`, whose scroller is the `.results-tbl-scroll` around it, so it called
  `preventDefault` and then moved nothing.
- **An inline `display` cannot be animated past.** The shell's Cmd+K wrote it in `cssText`, which
  beats every stylesheet rule.
- **A blocklist has to match the first token, not the whole compound.** `.well` was excluded from
  the transition sweep and `.well.filled` walked straight through it.
- **The Browser pane caches.** A rebuilt artifact served from `python3 -m http.server` came back
  as the previous build with two `<style>` tags instead of three; add a query string.

## Traps added on 2026-08-24

- **A viewport meta tag does not make a page fit a phone.** Any horizontal overflow — 16px is
  enough — makes the browser zoom the whole document out. And iOS zooms *in*, permanently, the
  moment you focus a control under 16px. Both look like "the layout is broken"; neither is.
- **`flex-wrap:wrap` on a toolbar does nothing for the groups inside it.** All three overflowing
  apps were this exact shape.
- **`s.index('</head>')` is not the head.** SheetJS's minified bundle contains that literal
  string, so the first match can be inside a `<script>`. Skip `</head>` inside script spans.
- **`#mobile-nav-btn` lives outside `<header>` on purpose** — dHUB hides each app's own header
  when embedded and `display:none` takes the subtree with it. The comment on the element is
  load-bearing; I moved it in and it vanished in the only build that matters.
- **Cells scale with area, volumes with volume.** `PLATE_VOL` had no `PLATE_AREA` beside it, so
  changing a plate format rescaled the volume and left the cell count untouched.

- **`touch-action:none` is not "make it work on touch".** It switches off the browser's
  gestures and gives nothing back; unless you implement pan *and* pinch yourself, it makes the
  element worse on a phone than doing nothing. And the honest default is `pan-y`, so the page
  can still scroll past whatever you built.
- **A long press ends in a click.** Both halves have to be handled: the click after the release
  would open the row you were only getting a menu for, and a menu drawn under a finger that is
  still down fires the item nearest the thumb (`pop._armAt`, 260 ms).
- **A filtered-out empty container is a feature until it becomes a target.** Hiding empty
  folders was right for browsing and wrong the moment you could drop something into one.
- **`indexOf` is not a search.** Two words in the right entry but not adjacent returned "no
  matches", which reads as broken software. And filtering *then* truncating to 40 throws away
  exact matches: rank before you cut.
- **A menu item that sets state without rendering does nothing at all**, and looks like the app
  ignoring you. The Cmd+K tag rows had been dead this way (`TAGFILTER` is cleared by
  `selectNode` on top of that).

## Traps from the previous pass

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
