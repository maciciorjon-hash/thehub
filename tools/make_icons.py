#!/usr/bin/env python3
"""Render the PWA icons for the installable apps (rounded square + that app's own glyph).

    python3 tools/make_icons.py                 # Archive  -> apps/archive/icons/
    python3 tools/make_icons.py --app=labbook   # Labbook  -> apps/labbook/icons/

Archive's icon is its header glyph on its --brand colour, so the home-screen icon and the app agree; Labbook's is its own
drawing (labbook_icon below), the same notebook with the proportions worked out. Only needed if a glyph or an accent changes; the PNGs are committed, because a
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


def render(size, glyph_frac=0.56, ss=4, flat=False):
    """Supersampled so the 1.8px stroke stays smooth at every size."""
    S = size * ss
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # flat = the iOS App Store icon: a full-bleed square with no alpha; the system rounds the corners itself.
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=0 if flat else int(S * 0.22), fill=ACCENT)

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
    out = img.resize((size, size), Image.LANCZOS)
    return out.convert('RGB') if flat else out


# ── Labbook: the notebook, refined ────────────────────────────────────────────────────────────────────
# Same idea as before (flat brand square, a white outlined notebook with a spine and two title lines) drawn on a 1024
# unit canvas with the proportions worked out rather than inherited from a 24 px glyph: a 444 x 596 notebook centred on
# the square (it was a third of the width), one stroke weight for wall, spine and lines, the inner corner radius equal
# to the outer minus the stroke so the wall is even all round, the spine inside the cover instead of poking out of it,
# and the lines the same distance from the spine and the right wall. `rounded` is the "any" icon (transparent
# corners); the flat ones carry no alpha because iOS and Android round them themselves.
def labbook_icon(size, rounded, sc=1.0, ss=4):
    bg = ACCENT[:3]
    S = 1024 * ss
    X = lambda v: (512 + (v - 512) * sc) * ss
    L = lambda v: v * sc * ss
    img = Image.new('RGB', (S, S), bg)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1, t = 290, 214, 734, 810, 46
    d.rounded_rectangle([X(x0), X(y0), X(x1), X(y1)], radius=L(94), fill='white')
    d.rounded_rectangle([X(x0 + t), X(y0 + t), X(x1 - t), X(y1 - t)], radius=L(48), fill=bg)
    sx = x0 + t + 30
    d.rectangle([X(sx), X(y0 + t - 2), X(sx + t), X(y1 - t + 2)], fill='white')
    lx0, lx1 = sx + t + 40, x1 - t - 40
    for yy in (y0 + t + 112, y0 + t + 112 + 92):
        d.rounded_rectangle([X(lx0), X(yy), X(lx1), X(yy + t - 2)], radius=L(22), fill='white')
    out = img.resize((size, size), Image.LANCZOS)
    if rounded:
        mk = Image.new('L', (size * 4, size * 4), 0)
        ImageDraw.Draw(mk).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * 0.225), fill=255)
        mk = mk.resize((size, size), Image.LANCZOS)
        o = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        o.paste(out, (0, 0), mk)
        return o
    return out


os.makedirs(OUT, exist_ok=True)
if APP == 'labbook':
    for name, im in [('icon-192.png', labbook_icon(192, True)),
                     ('icon-512.png', labbook_icon(512, True)),
                     ('apple-touch-icon.png', labbook_icon(180, False)),
                     ('icon-maskable-512.png', labbook_icon(512, False))]:
        p = os.path.join(OUT, name)
        im.save(p, 'PNG', optimize=True)
        print(p, os.path.getsize(p), 'bytes')
else:
    for name, size, frac in [('icon-192.png', 192, 0.56),
                             ('icon-512.png', 512, 0.56),
                             ('apple-touch-icon.png', 180, 0.56),
                             ('icon-maskable-512.png', 512, 0.40)]:
        p = os.path.join(OUT, name)
        render(size, frac).save(p, 'PNG', optimize=True)
        print(p, os.path.getsize(p), 'bytes')

# The iOS app (mobile/, Capacitor): the 1024 px icon Xcode's asset catalog asks for.
if APP == 'labbook':
    ios = os.path.join(ROOT, 'mobile', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset')
    if os.path.isdir(ios):
        p = os.path.join(ios, 'AppIcon-512@2x.png')
        labbook_icon(1024, False).save(p, 'PNG', optimize=True)
        print(p, os.path.getsize(p), 'bytes')
