#!/usr/bin/env python3
"""Copy the shared plate engine from Lumina (canonical) into every app that carries it.

The block between `// ═══ PLATE ENGINE — BEGIN` and `// ═══ PLATE ENGINE — END` is the
mechanics every dHUB plate shares — which wells a drag covers, ranges like B2:C11, a dilution
series over any selection, compound blocks by replicate bands, pasted name lists. There is no
module system here, so the code is copied on purpose, exactly as the 4PL fitter is.

Edit the engine in apps/lumina/lumina.html only, then:

    python3 tools/sync_plate_engine.py          # write the copies
    python3 tools/sync_plate_engine.py --check  # report, change nothing (exit 1 on drift)

An app without the block is not given one: where the engine goes in an app is a decision about
that app's code, made once by hand.
"""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANON = 'apps/lumina/lumina.html'
COPIES = ['apps/labbook/labbook.html']
BEGIN = '// ═══ PLATE ENGINE — BEGIN'
END = '// ═══ PLATE ENGINE — END'


def span(src):
    i = src.find(BEGIN)
    j = src.find(END)
    if i < 0 or j < 0:
        return None
    return i, src.index('\n', j)


def main():
    check = '--check' in sys.argv
    csrc = open(os.path.join(BASE, CANON), encoding='utf-8').read()
    cs = span(csrc)
    if not cs:
        print('Lumina has no PLATE ENGINE block'); return 2
    block = csrc[cs[0]:cs[1]]
    drift = 0
    for rel in COPIES:
        path = os.path.join(BASE, rel)
        src = open(path, encoding='utf-8').read()
        sp = span(src)
        if not sp:
            print(f'{rel}: no PLATE ENGINE block — add one by hand first'); drift += 1; continue
        if src[sp[0]:sp[1]] == block:
            print(f'{rel}: in sync'); continue
        drift += 1
        if check:
            print(f'{rel}: DIFFERS'); continue
        open(path, 'w', encoding='utf-8').write(src[:sp[0]] + block + src[sp[1]:])
        print(f'{rel}: updated')
    return 1 if (check and drift) else 0


if __name__ == '__main__':
    sys.exit(main())
