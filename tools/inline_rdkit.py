#!/usr/bin/env python3
"""The pinned RDKit, for a Hub build that has to work with no network.

`embed.py` calls `blobs()` for a personal build (no output path) and writes the two text blobs into the shell at the
<!--RDKIT-EMBED--> marker; the apps take them through window.parent.hubRDKitSrc() (see the RDKIT LOADER block). A deployed
build calls `write_siblings(out_dir)` instead, which puts the same two files in rdkit/ beside index.html (the loader's second
route), so the page itself stays small.

Both are checked against the hashes the loader pins (RDKIT_SRI in apps/echo/echo.html) before anything is written:
what ships is byte-for-byte what the CDN would have served. A file that does not match refuses the build.

usage:  python3 tools/inline_rdkit.py          (verify only)
"""
import base64, hashlib, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(BASE, 'vendor', 'rdkit-minimal-2026.9.1.js')
WASM = os.path.join(BASE, 'vendor', 'rdkit-minimal-2026.9.1.wasm')
MARK = '<!--RDKIT-EMBED-->'


def _sri(b):
    return 'sha384-' + base64.b64encode(hashlib.sha384(b).digest()).decode('ascii')


def _pinned():
    t = open(os.path.join(BASE, 'apps', 'echo', 'echo.html'), encoding='utf-8').read()
    m = re.search(r"RDKIT_SRI = \{ js: '(sha384-[A-Za-z0-9+/=]+)',\s*wasm: '(sha384-[A-Za-z0-9+/=]+)' \}", t)
    v = re.search(r"RDKIT_VERSION = '([0-9.]+)'", t)
    if not m or not v:
        raise ValueError('RDKIT_SRI / RDKIT_VERSION not found in the RDKIT LOADER block of apps/echo/echo.html')
    if v.group(1) not in os.path.basename(JS):
        raise ValueError('the loader pins RDKit %s but vendor/ holds %s' % (v.group(1), os.path.basename(JS)))
    return m.group(1), m.group(2)


def load():
    """Returns (js_bytes, wasm_bytes), both verified against the loader's pinned hashes."""
    js_h, wasm_h = _pinned()
    js, wasm = open(JS, 'rb').read(), open(WASM, 'rb').read()
    if _sri(js) != js_h:
        raise ValueError('%s (%s) is not the file the loader pins (%s)' % (os.path.basename(JS), _sri(js), js_h))
    if _sri(wasm) != wasm_h:
        raise ValueError('%s (%s) is not the file the loader pins (%s)' % (os.path.basename(WASM), _sri(wasm), wasm_h))
    if re.search(rb'</script', js, re.I):
        raise ValueError('the vendored RDKit JS contains "</script" and would end its own element')
    return js, wasm


def blobs():
    """The HTML that replaces the marker in the shell: the JS as text, the wasm as base64 text (neither is executed)."""
    js, wasm = load()
    return ('<script type="text/plain" id="hub-rdkit-js">' + js.decode('utf-8') + '</script>\n'
            '<script type="text/plain" id="hub-rdkit-wasm">' + base64.b64encode(wasm).decode('ascii') + '</script>')


def write_siblings(out_dir):
    js, wasm = load()
    d = os.path.join(out_dir, 'rdkit')
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'RDKit_minimal.js'), 'wb').write(js)
    open(os.path.join(d, 'RDKit_minimal.wasm'), 'wb').write(wasm)
    return d


if __name__ == '__main__':
    js, wasm = load()
    print('RDKit verified: js %s bytes, wasm %s bytes' % (format(len(js), ','), format(len(wasm), ',')))
