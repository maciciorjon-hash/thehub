#!/usr/bin/env python3
"""Find declarations sitting outside any rule in an app's stylesheet.

A stray `background:...;}` at the top level of a stylesheet is not ignored by the browser: the
parser folds it into the PRELUDE of the next rule, so that rule's selector becomes invalid and
**the whole rule is dropped silently**. Incubator lost `.cf-pick-back{position:fixed;...}` that
way, and its cell-line picker rendered inline at the bottom of the page instead of as a centred
modal. Nothing throws, nothing logs, and the app just looks wrong.

The orphan came from deleting a rule that spanned two lines and only removing the first one —
the same end-anchor family of mistakes already recorded in docs/CLAUDE_HANDOFF.md.

  python3 tools/check_css.py                 # every app + the shell
  python3 tools/check_css.py path.html ...

Exit 1 if any stylesheet has a declaration outside a rule.
"""
import os, re, sys, glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def stylesheets(html):
    """Each inline <style> block, with the line it starts on."""
    # `<style` must be a real tag: SheetJS embeds the literal string "<style:header/>" and a
    # loose [^>]* happily matched it, reporting 29 orphans inside a minified library.
    for m in re.finditer(r'<style(?:\s[^>]*)?>([\s\S]*?)</style>', html, re.I):
        yield html.count('\n', 0, m.start(1)) + 1, m.group(1)


def orphans(css, first_line):
    """Walk the sheet tracking brace depth; report declarations seen at depth 0."""
    out, depth, buf, line, paren = [], 0, '', first_line, 0
    css = re.sub(r'/\*[\s\S]*?\*/', lambda m: '\n' * m.group(0).count('\n'), css)  # keep line numbers
    for ch in css:
        if ch == '\n':
            line += 1
        # @import url('…family=X:wght@400;500…') carries semicolons inside its parentheses;
        # counting those as statement ends reported six orphans in a valid font import.
        if ch == '(':
            paren += 1
        elif ch == ')':
            paren = max(0, paren - 1)
        if paren:
            if depth == 0:
                buf += ch
            continue
        if ch == '{':
            depth += 1
            buf = ''
            continue
        if ch == '}':
            depth -= 1
            if depth < 0:                     # a close with nothing open
                out.append((line, 'stray }'))
                depth = 0
            buf = ''
            continue
        if depth == 0:
            buf += ch
            # A ';' outside any block means a declaration was left behind. @import/@charset
            # are the legitimate exceptions and always start with @.
            if ch == ';':
                t = buf.strip()
                if t and not t.startswith('@'):
                    out.append((line, t[:90]))
                buf = ''
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = [os.path.abspath(a) for a in args] if args else (
        [os.path.join(BASE, 'shell/hub-shell.html')] + sorted(glob.glob(os.path.join(BASE, 'apps/*/*.html'))))
    bad = 0
    for path in files:
        rel = os.path.relpath(path, BASE)
        try:
            html = open(path, encoding='utf-8').read()
        except FileNotFoundError:
            print('  %s: MISSING' % rel)
            bad += 1
            continue
        hits = []
        for start, css in stylesheets(html):
            hits += orphans(css, start)
        if hits:
            bad += 1
            print('  %s: %d orphan(s)' % (rel, len(hits)))
            for ln, txt in hits[:8]:
                print('     line %-6d %s' % (ln, txt))
        else:
            print('  %s: clean' % rel)
    if bad:
        sys.stderr.write('\ncheck_css.py FAILED — %d file(s) have declarations outside a rule.\n'
                         'The browser folds these into the next selector and drops that rule silently.\n' % bad)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
