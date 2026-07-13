#!/usr/bin/env python3
"""Drift monitor for the shared 4PL curve-fit engine.

Echo (Labcyte_Echo/labcyte_echo.html) is the CANONICAL implementation of the
Levenberg-Marquardt 4PL fitter. Beacon and Lumina carry their own copies of the
same functions (there is no build step / module system in this repo, so the code
is duplicated on purpose). Over time those copies drift.

This script does NOT modify anything — it extracts each shared function from all
three apps, compares it (whitespace-normalised) against Echo's version, and
reports MATCH / DIFF / absent. Exit code 0 = every present copy matches Echo,
1 = drift detected.

Use it after editing any fit-engine function: fix Echo first, then mirror the
change into Beacon/Lumina until this reports all-MATCH. It is intentionally kept
out of embed.py's build gate so current (working-but-drifted) copies don't block
a bundle — run it manually:

    python3 check_shared.py
"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
CANONICAL = 'Echo'
FILES = {
    'Echo':   'Labcyte_Echo/labcyte_echo.html',
    'Beacon': 'Beacon/beacon.html',
    'Lumina': 'Lumina/lumina.html',
}
# The functions that make up the shared engine (superset — not all exist in every app).
FUNCS = ['_4plVal4', '_4plVal4_gain', '_4plVal3', '_4plJac4', '_4plJac4_gain',
         '_solveLin', '_matInv', '_lmFit', '_fitBest', '_xAtYMid', '_tQ95']


def extract(src, name):
    """Return the whitespace-normalised source of `function name(...) { ... }`, or None."""
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
    return re.sub(r'\s+', '', src[m.start():j + 1])


def main():
    data = {}
    for name, rel in FILES.items():
        path = os.path.join(BASE, rel)
        try:
            data[name] = open(path, encoding='utf-8').read()
        except FileNotFoundError:
            sys.stderr.write(f'missing source: {rel}\n')
            return 2

    others = [n for n in FILES if n != CANONICAL]
    drift = []
    print(f'Fit-engine drift vs {CANONICAL} (canonical):\n')
    header = f'{"function":16} {CANONICAL:10} ' + ' '.join(f'{n:10}' for n in others)
    print(header)
    print('-' * len(header))
    for fn in FUNCS:
        ref = extract(data[CANONICAL], fn)
        cells = [f'{"present" if ref else "absent":10}']
        for n in others:
            x = extract(data[n], fn)
            if x is None:
                tag = 'absent'
            elif ref is None:
                tag = '(no ref)'
            elif x == ref:
                tag = 'MATCH'
            else:
                tag = 'DIFF'
                drift.append((fn, n))
            cells.append(f'{tag:10}')
        print(f'{fn:16} ' + ' '.join(cells))

    print()
    if drift:
        print(f'DRIFT: {len(drift)} function(s) diverge from {CANONICAL} — '
              + ', '.join(f'{fn} in {n}' for fn, n in drift))
        print('(All three may still fit correctly; reconcile deliberately with '
              'before/after numerical verification, since outputs can shift.)')
        return 1
    print(f'All present copies match {CANONICAL}. No drift.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
