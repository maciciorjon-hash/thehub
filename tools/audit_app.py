#!/usr/bin/env python3
"""Find CSS classes and JS functions an app defines and never uses.

  python3 tools/audit_app.py apps/echo/echo.html

Embedded libraries (Chart.js, SheetJS) ship as one enormous minified line, and their property
names look exactly like class names and function names to a regex — which is why a naive audit
reports two thousand "orphans" for any app that carries one. Lines longer than LIB_LINE are
treated as vendor code: not searched for uses, never reported as definitions.
"""
import re, sys

LIB_LINE = 2000

def strip_libs(text):
    return '\n'.join(l for l in text.split('\n') if len(l) <= LIB_LINE)

def audit(path):
    src = open(path, encoding='utf-8').read()
    head, _, tail = src.partition('</style>')
    head, tail = strip_libs(head), strip_libs(tail)
    own = strip_libs(src)
    skip = {'googleapis','gstatic','jsdelivr','cloudflare','com','md','js','org','html','svg','w3','net','io'}
    css = [c for c in sorted(set(re.findall(r'\.([a-zA-Z][\w-]*)', head)))
           if c not in skip and not re.search(r'\b' + re.escape(c) + r'\b', tail)]
    # a function marked AUDIT-KEEP is deliberate (a declared placeholder, an API another app
    # calls through window.parent) — reporting it every run trains you to ignore the report
    keep = set(re.findall(r'AUDIT-KEEP[\s\S]{0,240}?function\s+([A-Za-z_$][\w$]*)\s*\(', own))
    # A named IIFE — (function setUp(){...})() — runs itself, so its name legitimately appears
    # once. Reporting those as orphans is how you end up deleting working code.
    keep |= set(re.findall(r'\(\s*function\s+([A-Za-z_$][\w$]*)\s*\(', own))
    fns = []
    for n in sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', own)) - keep):
        defs = len(re.findall(r'function\s+' + re.escape(n) + r'\s*\(', own))
        if len(re.findall(r'\b' + re.escape(n) + r'\b', own)) <= defs:
            fns.append(n)
    return css, fns

if __name__ == '__main__':
    for p in sys.argv[1:]:
        css, fns = audit(p)
        print(f'== {p}')
        print('   CSS:', ', '.join(css) or 'clean')
        print('   JS :', ', '.join(fns) or 'clean')
