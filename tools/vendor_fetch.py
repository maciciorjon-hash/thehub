#!/usr/bin/env python3
"""Fetch the third-party files the native Labbook app carries inside it, into vendor/, and record their hashes.

The web builds load these from CDNs (Firebase SDK from gstatic, IBM Plex from Google Fonts, SheetJS from cdnjs). An app
that is meant to open on a bench with no signal cannot do that, so `embed.py --profile=labbook-app` writes them into
the app bundle instead. This script is the one place the versions are named; embed.py refuses to build if a file's
SHA-384 is not the one in vendor/MANIFEST.json, so what ships is byte-for-byte what was fetched here.

    python3 tools/vendor_fetch.py          # (re)download everything and rewrite vendor/MANIFEST.json
"""
import base64, hashlib, json, os, re, subprocess, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(BASE, 'vendor')
FB = '10.12.2'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
FONT_CSS = ('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500'
            '&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap')


def get(url, ua=False):
    # curl, not urllib: the python.org build has no CA bundle on macOS, and curl uses the system's.
    cmd = ['curl', '-sSfL', '--max-time', '60'] + (['-A', UA] if ua else []) + [url]
    return subprocess.run(cmd, check=True, capture_output=True).stdout


def sha384(b):
    return 'sha384-' + base64.b64encode(hashlib.sha384(b).digest()).decode()


def main():
    manifest = {}

    def put(rel, data, src):
        p = os.path.join(V, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'wb').write(data)
        manifest[rel] = {'source': src, 'integrity': sha384(data)}
        print('  %-44s %8d bytes' % (rel, len(data)))

    for n in ('app', 'auth', 'database', 'storage'):
        url = 'https://www.gstatic.com/firebasejs/%s/firebase-%s-compat.js' % (FB, n)
        put('firebase/firebase-%s-compat.js' % n, get(url), url)

    url = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    put('xlsx.full.min.js', get(url), url)

    # IBM Plex: only the Latin and Latin-extended subsets (what an English/Spanish lab notebook needs); the Cyrillic,
    # Greek and Vietnamese ranges are dropped and the browser falls back to the system font for them.
    css = get(FONT_CSS, ua=True).decode()
    out, seen = [], {}
    for m in re.finditer(r'/\* ([a-z-]+) \*/\s*(@font-face \{.*?\})', css, re.S):
        subset, block = m.group(1), m.group(2)
        if subset not in ('latin', 'latin-ext'):
            continue
        fam = re.search(r"font-family: '([^']+)'", block).group(1)
        wgt = re.search(r'font-weight: (\d+)', block).group(1)
        u = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
        # Google serves one variable file for every weight of a family/subset: keep one copy, point every weight at it.
        if u not in seen:
            seen[u] = 'fonts/%s-%s.woff2' % (fam.lower().replace(' ', '-'), subset) if 'Sans' in fam else 'fonts/%s-%s-%s.woff2' % (fam.lower().replace(' ', '-'), wgt, subset)
            put(seen[u], get(u), u)
        name = seen[u]
        out.append(re.sub(r'url\([^)]+\)', 'url(%s)' % os.path.basename(name), block))
    put('fonts/plex.css', ('/* IBM Plex Sans + Mono, Latin and Latin-ext (SIL Open Font License 1.1). */\n' + '\n'.join(out) + '\n').encode(),
        FONT_CSS)

    json.dump(manifest, open(os.path.join(V, 'MANIFEST.json'), 'w'), indent=1, sort_keys=True)
    print('wrote vendor/MANIFEST.json (%d files)' % len(manifest))


if __name__ == '__main__':
    sys.exit(main())
