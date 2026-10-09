#!/usr/bin/env python3
"""Find declarations sitting outside any rule in an app's stylesheet.

A stray `background:...;}` at the top level of a stylesheet is not ignored by the browser: the
parser folds it into the PRELUDE of the next rule, so that rule's selector becomes invalid and
**the whole rule is dropped silently**. Incubator lost `.cf-pick-back{position:fixed;...}` that
way, and its cell-line picker rendered inline at the bottom of the page instead of as a centred
modal. Nothing throws, nothing logs, and the app just looks wrong.

The orphan came from deleting a rule that spanned two lines and only removing the first one —
the same end-anchor family of mistakes already recorded in docs/CLAUDE_HANDOFF.md.

It also checks the second silent way a stylesheet can be wrong: a `var(--token)` that nothing
in the file ever defines. That is not a parse error either — the declaration is simply invalid
at computed-value time and the property falls back to its inherited or initial value. Blueprint,
Helix and Protein Tools each used the whole type and radius scale (79 font sizes in Blueprint)
without ever declaring it, so every string rendered at the inherited 16px and every corner at 0.
It looked like a design choice, and nothing anywhere said otherwise.

A fourth: a second bare `<header>` in an app. Inside dHUB the shell hides the app's own header with
`header:not([class])`, so a header used inside the content must carry a class — Echo's History rows were
plain headers once the rule was `header{display:none}` and every entry rendered empty in the Hub.

A third: white ink literally written on a solid fill (`background:var(--accent|good|warn|danger)` with
`color:#fff`). In the dark theme every one of those fills is a light pastel, so white on the primary
button was 2.3:1 (1.7 on the green). Ink on a fill is `var(--on-accent)`: white in light, near-black in dark.

  python3 tools/check_css.py                 # every app + the shell
  python3 tools/check_css.py path.html ...

Exit 1 if any stylesheet has a declaration outside a rule, uses a token it never defines, or puts white
ink on a solid fill.
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


def undefined_tokens(html):
    """Custom properties used by this file that it never defines.

    Definitions are counted across the whole file, not just its <style> blocks: a token can be
    set from JS with style.setProperty, and a token used in an inline style attribute built in a
    JS string is read from the same cascade as one used in the stylesheet.

    A var() with a fallback is deliberate and is not reported — `var(--accent-dim,rgba(...))`
    says what to do when the token is absent.
    """
    defined = set(re.findall(r'(--[A-Za-z0-9_-]+)\s*:', html))
    used = {}
    for m in re.finditer(r'var\(\s*(--[A-Za-z0-9_-]+)\s*([,)])', html):
        name, nxt = m.group(1), m.group(2)
        if nxt == ',':
            continue                      # has a fallback: absence is handled
        used.setdefault(name, 0)
        used[name] += 1
    return sorted(((n, c) for n, c in used.items() if n not in defined), key=lambda x: -x[1])


FILL = r'var\(--(?:accent|accent2|accent3|good|warn|danger)(?:,[^)]*)?\)'
_BG = re.compile(r'background(?:-color)?\s*:\s*' + FILL + r'\s*(?:;|!important|$)')
_WHITE = re.compile(r'(?<![-\w])color\s*:\s*(?:#fff(?:fff)?|white)\b', re.I)
_INLINE = re.compile(r'background(?:-color)?:\s*' + FILL + r'(?![-\w])[^"\'`<>{}]{0,160}?(?<![-\w])color:\s*(?:#fff(?:fff)?|white)\b'
                     r'|(?<![-\w])color:\s*(?:#fff(?:fff)?|white)\b[^"\'`<>{}]{0,160}?background(?:-color)?:\s*' + FILL + r'(?![-\w])', re.I)


def white_on_fill(html):
    """Rules (and inline styles built in JS strings) that write white ink on a solid colour fill."""
    out = []
    for start, css in stylesheets(html):
        css = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), css, flags=re.S)
        for m in re.finditer(r'([^{}]*)\{([^{}]*)\}', css):
            dec = m.group(2)
            if (_BG.search(dec.strip()) or _BG.search(dec + ';')) and _WHITE.search(dec):
                sel = m.group(1).strip().split('\n')[-1].strip()
                out.append((start + css.count('\n', 0, m.start(2)), sel[-60:]))
    # inline styles built in markup or JS strings — outside the stylesheets, which were read rule by rule above
    blank = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
    outside = re.sub(r'<style(?:\s[^>]*)?>[\s\S]*?</style>', blank, html, flags=re.I)
    for m in _INLINE.finditer(outside):
        out.append((html.count('\n', 0, m.start()) + 1, 'inline: ' + m.group(0)[:50]))
    return out


def bare_headers(html):
    """<header> tags with no class, outside HTML comments. An app may have exactly one: its own."""
    blank = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
    code = re.sub(r'<!--[\s\S]*?-->|<style(?:\s[^>]*)?>[\s\S]*?</style>', blank, html, flags=re.I)
    return [html.count('\n', 0, m.start()) + 1 for m in re.finditer(r'<header(\s[^>]*)?>', code)
            if not re.search(r'\bclass\s*=', m.group(1) or '')]


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
        missing = undefined_tokens(html)
        inks = white_on_fill(html)
        heads = bare_headers(html) if '/apps/' in path.replace(os.sep, '/') else []
        heads = heads[1:]
        if hits or missing or inks or heads:
            bad += 1
            parts = []
            if hits:
                parts.append('%d orphan(s)' % len(hits))
            if missing:
                parts.append('%d undefined token(s)' % len(missing))
            if inks:
                parts.append('%d white ink on a solid fill' % len(inks))
            if heads:
                parts.append('%d bare <header> after the app header' % len(heads))
            print('  %s: %s' % (rel, ', '.join(parts)))
            for ln, txt in hits[:8]:
                print('     line %-6d %s' % (ln, txt))
            for name, n in missing[:10]:
                print('     %-18s used %d time(s), never defined' % (name, n))
            for ln, txt in inks[:8]:
                print('     line %-6d white on a fill: %s   -> color:var(--on-accent)' % (ln, txt))
            for ln in heads[:8]:
                print('     line %-6d a <header> with no class: dHUB hides it with the app header -> give it a class' % ln)
        else:
            print('  %s: clean' % rel)
    if bad:
        sys.stderr.write('\ncheck_css.py FAILED — %d file(s) with a problem.\n'
                         'An orphan declaration is folded into the next selector and drops that rule silently;\n'
                         'an undefined token leaves its property at the inherited or initial value;\n'
                         'white ink on a solid fill is 2.3:1 in the dark theme (use var(--on-accent));\n'
                         'a bare <header> inside an app is hidden by dHUB along with the app header.\n' % bad)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
