#!/usr/bin/env python3
"""Render the Archive PWA icons (rounded square + the header book glyph).

Run from anywhere: python3 Archive/icons/make_icons.py — writes the PNGs next to itself.
Only needed if the icon or the accent colour changes; the PNGs are committed.
Requires Pillow.
"""
import os
from PIL import Image, ImageDraw

ACCENT = (165, 105, 131, 255)          # #a56983
OUT = os.path.dirname(os.path.abspath(__file__))

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
    d.line([xf(p) for p in COVER], fill=(255, 255, 255, 255), width=w, joint='curve')
    d.line([xf(p) for p in SPINE], fill=(255, 255, 255, 255), width=w)
    # round the stroke ends the way the SVG's stroke-linecap:round does
    for p in (SPINE[0], SPINE[1]):
        x, y = xf(p)
        d.ellipse([x - w/2, y - w/2, x + w/2, y + w/2], fill=(255, 255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
for name, size, frac in [('icon-192.png', 192, 0.56),
                         ('icon-512.png', 512, 0.56),
                         ('apple-touch-icon.png', 180, 0.56),
                         ('icon-maskable-512.png', 512, 0.40)]:
    p = os.path.join(OUT, name)
    render(size, frac).save(p, 'PNG', optimize=True)
    print(p, os.path.getsize(p), 'bytes')
