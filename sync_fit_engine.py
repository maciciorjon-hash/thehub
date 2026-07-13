#!/usr/bin/env python3
"""Sync the shared 4PL curve-fit engine from Echo (canonical) into Beacon + Lumina.

Companion to check_shared.py: `check_shared.py` REPORTS drift, this script FIXES
it by copying Echo's version of each shared engine function verbatim into Beacon
and Lumina (only functions that already exist in the target app are replaced —
nothing new is added). After running, `python3 check_shared.py` should report
no drift.

The engine functions are pure numerics (they take arrays / callbacks as args and
reference only each other), so copying Echo's versions in is self-contained.
IMPORTANT: this can change fitted outputs if the copies had genuinely different
math — verify fits numerically before shipping. (The 2026-07-13 reconciliation
was verified output-preserving: Beacon/Lumina diffs were cosmetic / ES6-vs-ES5,
and Beacon's only real difference (_xAtYMid) gave bit-identical fits on its test
data.)

Usage:  python3 sync_fit_engine.py         # apply
        python3 sync_fit_engine.py --check  # dry run (report only)
"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
CANONICAL = ('Echo', 'Labcyte_Echo/labcyte_echo.html')
TARGETS = [('Beacon', 'Beacon/beacon.html'), ('Lumina', 'Lumina/lumina.html')]
# Shared engine functions. _4plVal3 is Echo-only (not synced). Only functions
# present in a target get replaced.
FUNCS = ['_4plVal4', '_4plVal4_gain', '_4plJac4', '_4plJac4_gain',
         '_solveLin', '_matInv', '_lmFit', '_fitBest', '_xAtYMid', '_tQ95']


def span(src, name):
    """Return (start, end) char offsets of `function name(...) { ... }`, or None."""
    m = re.search(r'function\s+' + re.escape(name) + r'\s*\(', src)
    if not m:
        return None
    i = src.index('{', m.end() - 1)
    depth, j = 0, i
    while j < len(src):
        c = src[j]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                break
        j += 1
    return (m.start(), j + 1)


def main():
    check = '--check' in sys.argv
    echo = open(os.path.join(BASE, CANONICAL[1]), encoding='utf-8').read()
    canon = {}
    for fn in FUNCS:
        s = span(echo, fn)
        if s:
            canon[fn] = echo[s[0]:s[1]]

    total = 0
    for name, rel in TARGETS:
        path = os.path.join(BASE, rel)
        src = open(path, encoding='utf-8').read()
        changed = []
        # Replace right-to-left so offsets stay valid.
        edits = []
        for fn in FUNCS:
            if fn not in canon:
                continue
            s = span(src, fn)
            if not s:
                continue
            cur = src[s[0]:s[1]]
            if cur != canon[fn]:
                edits.append((s[0], s[1], fn))
        for start, end, fn in sorted(edits, reverse=True):
            src = src[:start] + canon[fn] + src[end:]
            changed.append(fn)
        if changed:
            total += len(changed)
            print(f'{name}: {"would sync" if check else "synced"} {len(changed)} fn(s) from {CANONICAL[0]}: {", ".join(reversed(changed))}')
            if not check:
                open(path, 'w', encoding='utf-8').write(src)
        else:
            print(f'{name}: already in sync')

    if check and total:
        print('\n(dry run — re-run without --check to apply)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
