#!/usr/bin/env python3
"""A calendar day is never `toISOString().slice(0,10)`.

`new Date().toISOString()` is the UTC instant, so its first ten characters are the UTC day: for a person in
New Zealand before 13:00, or in the Americas after 19:00, that is yesterday or tomorrow. It named exports,
stamped "added" dates and defaulted date fields to the wrong day (Labbook, found 2026-11-16; Archive, Echo,
Hit Finder, Iceberg, Lumina, Beacon, Ribbon, Tempo and the shell had the same line). Use the app's local-day
helper (`_localDay(ms)`, `_localStamp()`; Labbook `_dayOf`/`_stampOf`/`todayStr()`).

A line that really means the UTC day (a YYYY-MM-DD string parsed as UTC midnight, an Excel serial) says so
with a `utc-ok` comment on the same line.

  python3 tools/check_days.py       # shell + every app in apps/ (minified vendor code is not read)
Exit 1 and file:line of each offender.
"""
import glob, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAD = re.compile(r'toISOString\(\)\s*\.\s*(?:slice|substr|substring|split)\b|toJSON\(\)\s*\.\s*(?:slice|substr|substring|split)\b')

def main():
    files = [os.path.join(BASE, 'shell', 'hub-shell.html')] + sorted(glob.glob(os.path.join(BASE, 'apps', '*', '*.html')))
    bad = []
    for f in files:
        for n, line in enumerate(open(f, encoding='utf-8').read().split('\n'), 1):
            if len(line) > 4000:  # minified vendor code (SheetJS) — not ours
                continue
            if BAD.search(line) and 'utc-ok' not in line:
                bad.append('%s:%d  %s' % (os.path.relpath(f, BASE), n, line.strip()[:140]))
    if bad:
        print('UTC day used as the local day (use _localDay()/_stampOf(), or mark `utc-ok` if it really is UTC):')
        print('\n'.join('  ' + b for b in bad))
        return 1
    print('✓ no UTC day taken as a calendar day (%d files)' % len(files))
    return 0

if __name__ == '__main__':
    sys.exit(main())
