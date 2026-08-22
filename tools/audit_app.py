#!/usr/bin/env python3
"""Find CSS classes, JS functions and top-level data tables an app defines and never uses.

  python3 tools/audit_app.py apps/echo/echo.html
  python3 tools/audit_app.py --xref shell/hub-shell.html apps/*/*.html

--xref counts JS uses across EVERY file given, not just the one being audited. Apps reach into
the shell as `window.parent.HUB_FREEZER_BOXES`, so a per-file audit calls those orphans and
deleting one takes a live bridge with it. CSS stays per-file on purpose: each app is a separate
document inside a srcdoc iframe, so the shell's stylesheet genuinely cannot reach it and a class
the shell defines but never applies is dead however many apps happen to use the same name.

Embedded libraries (Chart.js, SheetJS) ship as one enormous minified line, and their property
names look exactly like class names and function names to a regex — which is why a naive audit
reports two thousand "orphans" for any app that carries one. Lines longer than LIB_LINE are
treated as vendor code: not searched for uses, never reported as definitions.
"""
import re, sys

LIB_LINE = 2000
# Markers that identify an embedded third-party library. A density heuristic was tried first and
# was worse: Echo builds its markup from long template strings, so "minified-looking" threw away
# the very code that uses its classes.
VENDOR = ('Chart.js', 'chartjs', 'SheetJS', 'sheetjs', 'XLSX', 'UTIF', 'pako', '3Dmol', 'NGL',
          'jsPDF', 'JpegDecoder', 'LosslessJpeg', '/*! ')

def strip_libs(text):
    """Drop vendor code so its property names are not mistaken for the app's own classes."""
    out, i = [], 0
    for m in re.finditer(r'<script\b[^>]*>([\s\S]*?)</script>', text, re.I):
        body = m.group(1)
        out.append(text[i:m.start()])
        if not any(v in body[:4000] for v in VENDOR):
            out.append(body)
        i = m.end()
    out.append(text[i:])
    joined = ''.join(out)
    return '\n'.join(l for l in joined.split('\n') if len(l) <= LIB_LINE)

def audit(path, xref_src=''):
    """Definitions come from the app's own code; USES are counted against the whole file.

    Counting uses in the filtered text was the bug that nearly cost real code: Blueprint puts
    a lot of markup on very long lines, so the class it applies there looked unused."""
    src = open(path, encoding='utf-8').read()
    own = strip_libs(src)                       # where a definition may legitimately live
    head, _, tail = own.partition('</style>')
    skip = {'googleapis', 'gstatic', 'jsdelivr', 'cloudflare', 'com', 'md', 'js', 'org',
            'html', 'svg', 'w3', 'net', 'io', 'chartjs', 'umd', 'getItem'}
    body = src.partition('</style>')[2]         # the WHOLE body, long lines included
    css = [c for c in sorted(set(re.findall(r'\.([a-zA-Z][\w-]*)', head)))
           if c not in skip and not re.search(r'\b' + re.escape(c) + r'\b', body)]

    keep = set(re.findall(r'AUDIT-KEEP[\s\S]{0,240}?function\s+([A-Za-z_$][\w$]*)\s*\(', own))
    # A named IIFE — (function setUp(){...})() — runs itself, so its name legitimately appears
    # once. Reporting those as orphans is how you end up deleting working code.
    keep |= set(re.findall(r'\(\s*function\s+([A-Za-z_$][\w$]*)\s*\(', own))
    fns = []
    for n in sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', own)) - keep):
        defs = len(re.findall(r'function\s+' + re.escape(n) + r'\s*\(', src))
        if len(re.findall(r'\b' + re.escape(n) + r'\b', src)) <= defs:
            if xref_src and re.search(r'\b' + re.escape(n) + r'\b', xref_src):
                continue                       # another file consumes it — a bridge, not an orphan
            fns.append(n)

    # Top-level data tables. Checking only `function NAME(` is how PRIMARY_CARDS survived in the
    # shell: a six-entry array describing the old home, whose one reader was itself an orphan
    # function. Deleting that function left the table unreferenced and the audit still said
    # clean. Restricted to SHOUTY_CASE at the start of a line, because that is what these tables
    # are called here and a loose `var x =` match reports every local in the file.
    tables = []
    for n in sorted(set(re.findall(r'^var ([A-Z][A-Z0-9_]{2,})\s*=\s*[\[{]', own, re.M))):
        if n in keep:
            continue
        # A mention inside a comment is not a use — that is exactly what a superseded table
        # tends to have left behind.
        uses = len([1 for line in src.split('\n')
                    if re.search(r'\b' + re.escape(n) + r'\b', line)
                    and not line.lstrip().startswith(('//', '*'))])
        if uses <= 1:
            if xref_src and re.search(r'\b' + re.escape(n) + r'\b', xref_src):
                continue
            tables.append(n)
    return css, fns, tables

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    xref = '--xref' in sys.argv
    others = {}
    if xref:
        for p in args:
            others[p] = '\n'.join(open(q, encoding='utf-8').read() for q in args if q != p)
    for p in args:
        css, fns, tables = audit(p, others.get(p, ''))
        print(f'== {p}')
        print('   CSS:', ', '.join(css) or 'clean')
        print('   JS :', ', '.join(fns) or 'clean')
        print('   VAR:', ', '.join(tables) or 'clean')
