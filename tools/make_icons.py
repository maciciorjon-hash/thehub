#!/usr/bin/env python3
"""Render the PWA icons for the installable apps (rounded square + that app's own glyph).

    python3 tools/make_icons.py                 # Archive  -> apps/archive/icons/
    python3 tools/make_icons.py --app=labbook   # Labbook  -> apps/labbook/icons/

Each app's icon is its own header glyph on its own --brand colour, so the home-screen icon and
the app agree. Only needed if a glyph or an accent changes; the PNGs are committed, because a
build that generates them would fail on a machine without Pillow.
Requires Pillow.
"""
import os, sys
from PIL import Image, ImageDraw

APP = 'archive'
for a in sys.argv[1:]:
    if a.startswith('--app='):
        APP = a.split('=', 1)[1]
if APP not in ('archive', 'labbook'):
    sys.stderr.write('unknown app %r (archive|labbook)\n' % APP)
    sys.exit(1)

ACCENTS = {'archive': (165, 105, 131, 255),   # #a56983
           'labbook': (63, 111, 168, 255)}    # #3f6fa8, Labbook's own --brand
ACCENT = ACCENTS[APP]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'apps', APP, 'icons')

# The header glyph, 24x24 viewBox, as explicit segments.
def cub(p0, c1, c2, p1, n=48):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p1[0]
        y = u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p1[1]
        pts.append((x, y))
    return pts

COVER = (
    cub((12, 6.2), (10.4, 5.1), (7.8, 4.6), (5.2, 5.1))
    + [(5.2, 17.5)]
    + cub((5.2, 17.5), (7.8, 17.0), (10.4, 17.5), (12, 18.6))
    + cub((12, 18.6), (13.6, 17.5), (16.2, 17.0), (18.8, 17.5))
    + [(18.8, 5.1)]
    + cub((18.8, 5.1), (16.2, 4.6), (13.6, 5.1), (12, 6.2))
)
SPINE = [(12, 6.2), (12, 18.6)]

# Labbook's own header glyph: a notebook seen closed, with the spine and two ruled lines. The
# app draws the cover with 2.5-radius arcs; Pillow has no arc-to-path, so the cover is a rounded
# rectangle at the same radius and the shape is identical at every size these render at.
NB_BOX = (5.0, 2.0, 19.0, 22.0)
NB_R = 2.5
NB_LINES = [[(8.2, 2.6), (8.2, 21.4)],
            [(11.0, 7.4), (16.4, 7.4)],
            [(11.0, 11.0), (16.4, 11.0)]]


def render(size, glyph_frac=0.56, ss=4):
    """Supersampled so the 1.8px stroke stays smooth at every size."""
    S = size * ss
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=ACCENT)

    scale = S * glyph_frac / 24.0
    off = (S - 24 * scale) / 2.0
    w = max(2, int(round(1.8 * scale)))
    xf = lambda p: (off + p[0] * scale, off + p[1] * scale)
    ink = (255, 255, 255, 255)

    def cap(pts):
        # round the stroke ends the way the SVG's stroke-linecap:round does
        for p in pts:
            x, y = xf(p)
            d.ellipse([x - w/2, y - w/2, x + w/2, y + w/2], fill=ink)

    if APP == 'labbook':
        x0, y0 = xf((NB_BOX[0], NB_BOX[1]))
        x1, y1 = xf((NB_BOX[2], NB_BOX[3]))
        d.rounded_rectangle([x0, y0, x1, y1], radius=NB_R * scale, outline=ink, width=w)
        for seg in NB_LINES:
            d.line([xf(p) for p in seg], fill=ink, width=w)
            cap(seg)
    else:
        d.line([xf(p) for p in COVER], fill=ink, width=w, joint='curve')
        d.line([xf(p) for p in SPINE], fill=ink, width=w)
        cap(SPINE)
    return img.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
for name, size, frac in [('icon-192.png', 192, 0.56),
                         ('icon-512.png', 512, 0.56),
                         ('apple-touch-icon.png', 180, 0.56),
                         ('icon-maskable-512.png', 512, 0.40)]:
    p = os.path.join(OUT, name)
    render(size, frac).save(p, 'PNG', optimize=True)
    print(p, os.path.getsize(p), 'bytes')
