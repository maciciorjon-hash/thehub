#!/usr/bin/env python3
"""Write 3Dmol into Ribbon's page, for a build that has to work with no network.

Ribbon's source file loads 3Dmol from a CDN with a pinned version and an integrity hash. `embed.py` calls
`inline(html_bytes)` when it packs Ribbon into the Hub, which replaces that one tag with the same bytes, inline,
from vendor/. Two things are checked rather than assumed:

  * the vendored file's SHA-384 is the hash the tag pins (so the Hub carries exactly what the CDN would have served);
  * nothing in it could end the <script> element early.

usage:  python3 tools/inline_3dmol.py apps/ribbon/ribbon.html out.html      (what the invariants use)
"""
import base64, hashlib, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(BASE, 'vendor', '3Dmol-min-2.5.5.js')
TAG = re.compile(r'<script src="https://unpkg\.com/3dmol@2\.5\.5/build/3Dmol-min\.js" integrity="(sha384-[A-Za-z0-9+/=]+)" crossorigin="anonymous"></script>')


def inline(html):
    """html: bytes. Returns bytes with the CDN tag replaced by the vendored library. Raises ValueError on anything off."""
    text = html.decode('utf-8')
    tags = TAG.findall(text)
    if len(tags) != 1:
        raise ValueError('expected exactly one pinned 3Dmol tag in Ribbon, found %d' % len(tags))
    lib = open(VENDOR, 'rb').read()
    digest = 'sha384-' + base64.b64encode(hashlib.sha384(lib).digest()).decode('ascii')
    if digest != tags[0]:
        raise ValueError('vendor/3Dmol-min-2.5.5.js (%s) is not the file the tag pins (%s)' % (digest, tags[0]))
    js = lib.decode('utf-8')
    if re.search(r'</script', js, re.I):
        raise ValueError('the vendored 3Dmol contains "</script" and would end its own element')
    m = TAG.search(text)
    return (text[:m.start()] + '<script>/* 3Dmol 2.5.5 - embedded by embed.py so Ribbon works offline */\n' + js + '\n</script>' + text[m.end():]).encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    out = inline(open(sys.argv[1], 'rb').read())
    open(sys.argv[2], 'wb').write(out)
    print('wrote %s (%s bytes)' % (sys.argv[2], format(len(out), ',')))
