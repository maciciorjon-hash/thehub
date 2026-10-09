#!/bin/sh
# The static checks the CI `build` job runs before it will deploy — the same commands, in the same order.
# Run by .githooks/pre-commit, so a commit that would stop the deploy is refused on this machine instead.
#
#   sh tools/static_checks.sh
#
# Between 2026-10-01 and 10-09 these stopped 17 deploys (icon set 11, motion kit 3, assistant 3), every one a
# generated block committed out of step with its source. The fix for a drift failure is always the same:
# run the sync script it names without --check, look at the diff, and commit it.
cd "$(dirname "$0")/.." || exit 2
PY=$(command -v python3 || command -v python)

fail=0
run() {
  name=$1; shift
  out=$("$@" 2>&1)
  if [ $? -ne 0 ]; then
    fail=1
    echo "✗ $name"
    echo "$out" | tail -n 15 | sed 's/^/    /'
    case "$2" in
      tools/sync_*) echo "    fix: python3 $2   (then review the diff and add it to the commit)";;
    esac
  fi
}

run "JavaScript parses in every app"   "$PY" tools/check_js.py
run "Stylesheets"                      "$PY" tools/check_css.py
run "Shared fit engine"                "$PY" tools/check_shared.py
run "Icon set"                         "$PY" tools/sync_icons.py --check
run "Motion kit"                       "$PY" tools/sync_motion.py --check
run "Right-click kit"                  "$PY" tools/sync_ctxkit.py --check
run "Help assistant"                   "$PY" tools/sync_assist.py --check
run "Shared Echo blocks"               "$PY" tools/sync_screen_engine.py --check

if [ $fail -ne 0 ]; then
  echo ""
  echo "These are the checks GitHub runs before deploying; with any of them red, Pages is not updated."
  exit 1
fi
echo "✓ static checks (the deploy gate) pass"
