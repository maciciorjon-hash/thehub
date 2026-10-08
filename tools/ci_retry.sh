#!/usr/bin/env bash
# Run a command, and run it once more if it fails.
#
#   tools/ci_retry.sh node tools/echo_invariants.mjs
#   CI_ATTEMPTS=3 tools/ci_retry.sh node tools/monkey.mjs
#
# Why: several suites load jsPDF, SheetJS, RDKit or 3Dmol from a CDN, and the layout sweeps are
# timing-sensitive on a 2-vCPU runner. One bad fetch or one slow frame must not stop a deploy, but
# a real failure fails every attempt, so retrying hides nothing. Every attempt's output is kept.
set -u
attempts="${CI_ATTEMPTS:-2}"
n=1
while true; do
  echo "::group::attempt $n/$attempts: $*"
  "$@"
  rc=$?
  echo "::endgroup::"
  if [ "$rc" -eq 0 ]; then
    [ "$n" -gt 1 ] && echo "::warning::passed on attempt $n of $attempts — flaky: $*"
    exit 0
  fi
  if [ "$n" -ge "$attempts" ]; then
    echo "::error::failed on all $attempts attempts: $*"
    exit "$rc"
  fi
  echo "::warning::attempt $n failed (exit $rc), retrying: $*"
  n=$((n + 1))
  sleep 5
done
