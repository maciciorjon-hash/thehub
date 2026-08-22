#!/usr/bin/env python3
"""Parse-check every inline <script> in every app before it can ship.

There is no build step here and no module system, so a stray brace in one app's
1,800-line inline script is invisible until the browser hits it — and it stays
invisible, because each app runs in its own srcdoc iframe and the shell's retry
loop masks the failure. That is not hypothetical: the comment at
shell/hub-shell.html:1033 records a stray closer in the injected back-button
script that threw SyntaxError inside all 19 apps for a long time with nobody
noticing.

This is the cheapest guard that would have caught it: pull out every inline
script block and hand it to `node --check`. Script first, then module — a block
using top-level `await` or `import` is legal but does not parse as a script.

Usage:
  python3 tools/check_js.py                # shell + every app in embed.py's APPS
  python3 tools/check_js.py path.html ...  # just these
  python3 tools/check_js.py --quiet        # only report failures

Exit 1 on any parse error, 2 if node is missing (so a build can choose to skip).
"""
import os, re, subprocess, sys, tempfile

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# <script> with a src= is a remote file, not ours to parse. Everything else is inline.
SCRIPT_RE = re.compile(r'<script\b([^>]*)>([\s\S]*?)</script>', re.I)
SRC_RE    = re.compile(r'\bsrc\s*=', re.I)
TYPE_RE   = re.compile(r'\btype\s*=\s*["\']([^"\']*)["\']', re.I)

# type= values that are JavaScript. Anything else (importmap, text/template,
# application/json) is data and must not be parsed as code.
JS_TYPES = {'', 'module', 'text/javascript', 'application/javascript',
            'text/ecmascript', 'application/ecmascript'}


def _targets():
    """shell + the apps embed.py actually bundles, so the two lists cannot drift."""
    out = [os.path.join(BASE, 'shell/hub-shell.html')]
    embed = open(os.path.join(BASE, 'embed.py'), encoding='utf-8').read()
    block = re.search(r'APPS = \[([\s\S]*?)\n\]', embed)
    if not block:
        sys.stderr.write('check_js.py: could not read APPS from embed.py\n')
        sys.exit(1)
    for rel in re.findall(r"'([^']+\.html)'", block.group(1)):
        out.append(os.path.join(BASE, rel))
    return out


def _blocks(html):
    """(line_number, code) for every inline JS block."""
    for m in SCRIPT_RE.finditer(html):
        attrs, body = m.group(1), m.group(2)
        if SRC_RE.search(attrs):
            continue
        t = TYPE_RE.search(attrs)
        if t and t.group(1).strip().lower() not in JS_TYPES:
            continue
        if not body.strip():
            continue
        yield html.count('\n', 0, m.start(2)) + 1, body


def _node_check(code, tmpdir, tag):
    """Parse as script, then as module. Returns node's message, or None if clean."""
    err = None
    for ext in ('.js', '.mjs'):
        p = os.path.join(tmpdir, tag + ext)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(code)
        r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
        if r.returncode == 0:
            return None
        if err is None:
            err = (r.stderr or r.stdout).strip()
    return err


def _unescape(js_string_body):
    """Undo JS single-quoted string escapes. Not unicode_escape: that mangles \\/
    and any non-ASCII byte in the source."""
    simple = {'n': '\n', 't': '\t', 'r': '\r', '\\': '\\', "'": "'", '"': '"', '/': '/'}
    out, i = [], 0
    while i < len(js_string_body):
        c = js_string_body[i]
        if c == '\\' and i + 1 < len(js_string_body):
            nxt = js_string_body[i + 1]
            out.append(simple.get(nxt, nxt))
            i += 2
        else:
            out.append(c)
            i += 1
    return ''.join(out)


def _injected_scripts():
    """The shell builds a <script> for each app frame by string concatenation and
    nothing checks it. Recover the literal pieces and parse what they add up to."""
    shell = open(os.path.join(BASE, 'shell/hub-shell.html'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r"var backScript\s*=\s*([\s\S]*?);\n", shell):
        parts = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))
        if not parts:
            continue
        js = ''.join(_unescape(p) for p in parts)
        # The concatenation is a whole <script> element as text, and its closer is
        # written <\/script> so it cannot end the shell's own script early.
        js = re.sub(r'^\s*<script[^>]*>', '', js.strip())
        js = re.sub(r'<\\?/script>\s*$', '', js.strip())
        if js.strip():
            out.append((shell.count('\n', 0, m.start()) + 1, js))
    return out


def main():
    args  = [a for a in sys.argv[1:] if not a.startswith('--')]
    quiet = '--quiet' in sys.argv

    if subprocess.run(['node', '--version'], capture_output=True).returncode != 0:
        sys.stderr.write('check_js.py: node not found — skipping JS parse check\n')
        return 2

    files = [os.path.abspath(a) for a in args] if args else _targets()
    failures, nblocks = [], 0

    with tempfile.TemporaryDirectory() as tmp:
        for path in files:
            rel = os.path.relpath(path, BASE)
            try:
                html = open(path, encoding='utf-8').read()
            except FileNotFoundError:
                failures.append((rel, 0, 'source file not found'))
                print(f'  {rel}: MISSING')
                continue
            bad = 0
            for i, (line, code) in enumerate(_blocks(html)):
                nblocks += 1
                err = _node_check(code, tmp, f'b{i}')
                if err:
                    bad += 1
                    failures.append((rel, line, err))
            if not quiet or bad:
                n = sum(1 for _ in _blocks(html))
                print(f'  {rel}: {n} block(s) — {"FAIL" if bad else "ok"}')

        for line, code in _injected_scripts():
            nblocks += 1
            err = _node_check(code, tmp, 'inj')
            if err:
                failures.append(('shell/hub-shell.html (injected)', line, err))
                print('  shell/hub-shell.html injected script: FAIL')
            elif not quiet:
                print('  shell/hub-shell.html injected script: ok')

    if failures:
        sys.stderr.write('\ncheck_js.py FAILED — %d block(s) do not parse:\n' % len(failures))
        for rel, line, err in failures:
            sys.stderr.write('\n  %s (script starting at line %d):\n    %s\n'
                             % (rel, line, err.replace('\n', '\n    ')))
        return 1

    print('\n%d inline script block(s) parse clean.' % nblocks)
    return 0


if __name__ == '__main__':
    sys.exit(main())
