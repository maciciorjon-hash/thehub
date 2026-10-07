#!/usr/bin/env python3
"""Copy the shared blocks that Echo owns into every app that carries them.

Two blocks, both canonical in apps/echo/echo.html:

  SCREEN ENGINE  pure functions over a result row: hook onset / depth / observed Dmax, coverage, wells behind
                 a curve, a potency as an interval, and the Screen-export record (`scrRecord`). Echo writes the
                 Screen export with it and Hit Finder reads the same numbers back from History, so the two
                 cannot disagree about what a hook is.
  RDKIT LOADER   the version-pinned, integrity-checked RDKit loader (`loadRDKitPinned`). Echo, Dora and Hit
                 Finder draw structures; one copy of the URL and of the hashes means one place to update.

There is no module system here, so the code is copied on purpose, exactly as the 4PL fitter and the plate
engine are. Edit a block in Echo only, then:

    python3 tools/sync_screen_engine.py          # write the copies
    python3 tools/sync_screen_engine.py --check  # report, change nothing (exit 1 on drift)

An app without a block is not given one: where it goes in an app is a decision about that app's code, made
once by hand (put the BEGIN / END markers where the code should live, then run this).
"""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANON = 'apps/echo/echo.html'
BLOCKS = [
    ('SCREEN ENGINE', '// ═══ SCREEN ENGINE — BEGIN', '// ═══ SCREEN ENGINE — END', ['apps/hitfinder/hitfinder.html', 'apps/dora/dora.html']),
    ('RDKIT LOADER',  '// ═══ RDKIT LOADER — BEGIN',  '// ═══ RDKIT LOADER — END',  ['apps/dora/dora.html', 'apps/hitfinder/hitfinder.html']),
]


def span(src, begin, end):
    i = src.find(begin)
    j = src.find(end)
    if i < 0 or j < 0 or j < i:
        return None
    return i, src.index('\n', j) if '\n' in src[j:] else len(src)


def main():
    check = '--check' in sys.argv
    csrc = open(os.path.join(BASE, CANON), encoding='utf-8').read()
    drift = 0
    for name, begin, end, copies in BLOCKS:
        cs = span(csrc, begin, end)
        if not cs:
            print(f'Echo has no {name} block'); return 2
        block = csrc[cs[0]:cs[1]]
        for rel in copies:
            path = os.path.join(BASE, rel)
            src = open(path, encoding='utf-8').read()
            sp = span(src, begin, end)
            if not sp:
                print(f'{rel}: no {name} block — add its markers by hand first'); drift += 1; continue
            if src[sp[0]:sp[1]] == block:
                print(f'{rel}: {name} in sync'); continue
            drift += 1
            if check:
                print(f'{rel}: {name} DIFFERS'); continue
            open(path, 'w', encoding='utf-8').write(src[:sp[0]] + block + src[sp[1]:])
            print(f'{rel}: {name} updated')
    return 1 if (check and drift) else 0


if __name__ == '__main__':
    sys.exit(main())
