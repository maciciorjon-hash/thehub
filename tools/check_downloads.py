#!/usr/bin/env python3
"""A blob download must not revoke its URL until the browser has had time to start it.

`a.href = URL.createObjectURL(blob); a.click(); URL.revokeObjectURL(a.href)` works in Chrome, where the
download is queued synchronously, and fails in Safari, where the blob is read after the click: the person
gets a "Safari Can't Open the Page - blob:https://... WebKitBlobResource error 1" page instead of the file
(seen 2026-11-09 on the Pages build). Every revoke that follows an anchor click must therefore sit inside a
setTimeout of at least MIN_MS. Revokes that follow image decoding (no click) are not touched.

  python3 tools/check_downloads.py          # shell + every app in apps/
Exit 1 and the file, offset and line of each offender.
"""
import glob, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_MS = 4000
CLICK_RE = re.compile(r'\.click\(\)')
DELAY_RE = re.compile(r',\s*([0-9]+(?:\.[0-9]+)?(?:e[0-9]+)?)\s*\)')


def problems(src):
    out = []
    for m in CLICK_RE.finditer(src):
        win = src[m.end():m.end() + 260]
        r = win.find('revokeObjectURL(')
        if r < 0:
            continue
        # a statement boundary that ends the click's own block (next function) means this revoke is not its
        head = win[:r]
        if re.search(r'\bfunction\b|=>\s*\{?\s*[A-Za-z_$]+\s*\(', head) and 'setTimeout' not in head:
            continue
        if 'setTimeout' not in head:
            out.append((m.end() + r, 'revoked right after the click (no setTimeout)'))
            continue
        d = DELAY_RE.search(win[r:r + 120])
        if not d:
            out.append((m.end() + r, 'delay not readable'))
        elif float(d.group(1)) < MIN_MS:
            out.append((m.end() + r, 'revoked after only %s ms' % d.group(1)))
    return out


def main():
    files = [os.path.join(BASE, 'shell/hub-shell.html')] + sorted(glob.glob(os.path.join(BASE, 'apps/*/*.html')))
    bad = 0
    for f in files:
        s = open(f, encoding='utf-8', errors='replace').read()
        for pos, why in problems(s):
            bad += 1
            line = s.count('\n', 0, pos) + 1
            print('%s:%d  %s' % (os.path.relpath(f, BASE), line, why))
    if bad:
        print('%d blob URL(s) revoked too soon: a download needs >= %d ms in Safari' % (bad, MIN_MS))
        return 1
    print('every blob download keeps its URL for >= %d ms' % MIN_MS)
    return 0


if __name__ == '__main__':
    sys.exit(main())
