#!/usr/bin/env python3
"""The Hub's icon set, in one place, and the script that puts it everywhere it is drawn.

Every app's glyph used to be copied by hand into five places: its home card in the shell, the
landing card built from that card, the header crumb, the shell's rail/suite tables, and the
app's own header. Copies drifted (two app headers once carried a whole neighbouring card), and
each app wore a saturated tile of its own colour. This file is the single source:

  * APP_ICONS  — one glyph per app, drawn on a 24 grid at stroke 1.5 in currentColor. Exactly
                 one element (class "ac") is the app's accent; it takes var(--ic-ac), which the
                 tile sets from the app's muted hue. The tile itself is neutral.
  * UI_ICONS   — the rail, the landings' sections and the library kinds. Monochrome.
  * HUES       — one muted hue per app. Only the accent and the faint tile tint use it.

  python3 tools/sync_icons.py            write the icons into the shell and every app
  python3 tools/sync_icons.py --check    exit 1 if any copy differs from this file
  python3 tools/sync_icons.py --sheet F  write a contact sheet (HTML) to F

Parts that move on hover carry class m1/m2/m3; the motion lives in the shell's stylesheet.
"""
import math, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── hues: muted, one per app, readable as an accent on either theme ─────────────────────────
HUES = {
    'labbook':'#4a74a8', 'echo':'#b8646a', 'deg':'#7b70b4', 'pd':'#3f7eaa', 'dna':'#4d9468',
    'pt':'#8a70b0', 'spectra':'#3c948c', 'cryo':'#3b93aa', 'cuppa':'#94765f',
    'hitfinder':'#8a9440', 'tempo':'#c26d3a', 'beacon':'#5b6fb0', 'lumina':'#b8923a', 'ribbon':'#bb6c66', 'protocols':'#9c6e88',
    'cellarchive':'#b87a55', 'incubator':'#4b8aa2', 'blot':'#657586',
}

ACF = 'class="ac{m}" style="fill:var(--ic-ac,currentColor)" stroke="none"'   # accent, filled
ACS = 'class="ac{m}" style="stroke:var(--ic-ac,currentColor)"'               # accent, stroked
def acf(m=''): return ACF.format(m=(' '+m) if m else '')
def acs(m=''): return ACS.format(m=(' '+m) if m else '')
DIM = 'opacity=".45"'
FL = 'class="fl" fill="currentColor" stroke="none" opacity=".16"'   # the rail's soft fill

def _helix(a0=(5, 20), a1=(19, 4), R=4.2, turns=3, n=400):
    """An alpha helix seen side-on, the way a ribbon diagram draws one: the coil's front turns
    and its back turns as separate strokes, so the depth reads without shading."""
    ax, ay = a1[0]-a0[0], a1[1]-a0[1]; L = math.hypot(ax, ay); px, py = -ay/L, ax/L
    segs, cur, curz = [], None, None
    for i in range(n+1):
        th = 2*math.pi*turns*i/n; s_ = i/n
        q = (a0[0]+ax*s_+px*R*math.sin(th), a0[1]+ay*s_+py*R*math.sin(th)); z = math.cos(th) > 0
        if curz is None or z != curz:
            if cur: cur.append(q); segs.append((curz, cur))
            cur = [q] if cur is None else [cur[-1], q]; curz = z
        else:
            cur.append(q)
    segs.append((curz, cur))
    d = lambda pts: 'M' + ' L'.join('%.2f %.2f' % q for q in pts[::3] + [pts[-1]])
    return (''.join('<path d="%s"/>' % d(p) for z, p in segs if not z),
            ''.join('<path d="%s"/>' % d(p) for z, p in segs if z))

def _flake(cx, cy, r):
    out = []
    for k in range(3):
        a = math.pi/3*k + math.pi/2
        dx, dy = r*math.cos(a), r*math.sin(a)
        out.append('M%.2f %.2fL%.2f %.2f' % (cx-dx, cy-dy, cx+dx, cy+dy))
    return ''.join(out)

APP_ICONS = {
    # a nanolitre droplet going into a dose series: the plate row graded from the top dose down
    'echo': ('<rect x="2.5" y="12.5" width="19" height="7.5" rx="2.2"/>'
             + ''.join('<circle cx="%s" cy="16.25" r="1.25" %s opacity="%s"/>' % (x, acf('m2'), o)
                       for x, o in ((6, '1'), (10, '.62'), (14, '.34'), (18, '.14')))
             + '<path class="m1" d="M6 3.4c1.3 1.6 2 2.7 2 3.7a2 2 0 0 1-4 0c0-1 .7-2.1 2-3.7z" '+acf()+'/>'
             '<path d="M6 10.2v.4" '+DIM+'/>'),
    # DC50 against Dmax: one compound per bubble, the one you are after filled
    'deg': ('<path d="M4 3.5v14.5a2 2 0 0 0 2 2h14.5"/>'
            '<circle cx="15" cy="14.5" r="1.4"/><circle cx="18" cy="9.5" r="1.1"/>'
            '<circle cx="13.3" cy="9.2" r="1.7"/><circle cx="8.7" cy="15.2" r="1.1"/>'
            '<circle cx="9.3" cy="7.6" r="2.2" '+acf('m1')+'/>'),
    # a plate, A1 chamfered, with the block you selected
    'pd': ('<path d="M5.6 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.6z"/>'
           + ''.join('<circle cx="%s" cy="%s" r="1" fill="currentColor" stroke="none" %s/>' % (x, y, DIM)
                     for y in (9, 12, 15) for x in (7, 10.33, 13.67, 17)
                     if not (y in (9, 12) and x in (10.33, 13.67)))
           + '<g class="m1">' + ''.join('<circle cx="%s" cy="%s" r="1.35" %s/>' % (x, y, acf())
                     for y in (9, 12) for x in (10.33, 13.67)) + '</g>'),
    # the double helix, one base pair highlighted
    'dna': ('<path d="M7.4 3C7.4 7 16.6 8 16.6 12S7.4 17 7.4 21"/>'
            '<path d="M16.6 3C16.6 7 7.4 8 7.4 12S16.6 17 16.6 21"/>'
            '<path d="M9 5h6M9 19h6" '+DIM+'/>'
            '<path d="M9.2 9.7h5.6M9.2 14.3h5.6" '+acs('m1')+'/>'),
    # a peptide: residues on a backbone, side chains alternating, one residue marked
    'pt': ('<path d="M5.4 15.2 7.6 11M9.8 10.6l2.6 3.6M13.9 14.3l2.6-4.2M18.2 9.6l.9 3.4"/>'
           '<circle cx="4.8" cy="16.8" r="1.7"/><circle cx="8.7" cy="9.2" r="1.7"/>'
           '<circle cx="17.5" cy="8.3" r="1.7"/><circle cx="19.6" cy="15" r="1.4"/>'
           '<circle cx="13.2" cy="15.7" r="2" '+acf('m1')+'/>'),
    # a straight standard curve, and the unknown read back off it
    'spectra': ('<path d="M4 3.5v14.5a2 2 0 0 0 2 2h14.5"/>'
                '<path d="M7 17.2 19.5 5.8"/>'
                '<circle cx="9" cy="15.4" r="1.05" fill="currentColor" stroke="none"/>'
                '<circle cx="17.5" cy="7.6" r="1.05" fill="currentColor" stroke="none"/>'
                '<path d="M13.6 13.4v5" stroke-dasharray="1.1 1.9" '+DIM+'/>'
                '<circle cx="13.6" cy="11.2" r="1.75" '+acf('m1')+'/>'),
    # a stopwatch whose hand is the trace itself: a signal that falls and then holds, and the one accent where it starts (t0)
    'tempo': ('<circle cx="12" cy="13.6" r="7.6"/>'
              '<path class="m2" d="M9.6 2.9h4.8"/><path d="M12 2.9V6"/>'
              '<path d="M18.4 7.5l1.3-1.3" '+DIM+'/>'
              '<path d="M8 11c1.3 0 1.9.3 2.6 1.9.8 1.8 1.9 2.8 5.2 2.8"/>'
              '<circle cx="8" cy="11" r="1.3" '+acf('m1')+'/>'),
    # a sniper scope: the reticle, four hairlines that stop short of the centre, and the one compound it has locked on
    'hitfinder': ('<circle cx="12" cy="12" r="8.6"/>'
                  '<path d="M12 1.8v5.2M12 17v5.2M1.8 12H7M17 12h5.2"/>'
                  '<circle cx="9.1" cy="12" r=".7" fill="currentColor" stroke="none" '+DIM+'/>'
                  '<circle cx="14.9" cy="12" r=".7" fill="currentColor" stroke="none" '+DIM+'/>'
                  '<circle cx="12" cy="12" r="1.9" '+acf('m1')+'/>'),
    # a cryovial, and the cold that keeps it
    'cryo': ('<path d="M5.8 5.8V4.2a1.4 1.4 0 0 1 1.4-1.4h5.6a1.4 1.4 0 0 1 1.4 1.4v1.6z"/>'
             '<path d="M8.1 2.8v3M10 2.8v3M11.9 2.8v3" '+DIM+'/>'
             '<path d="M6.6 5.8v10.4a3.4 3.4 0 0 0 6.8 0V5.8"/>'
             '<path d="M6.6 9.8h6.8" '+DIM+'/>'
             '<path d="'+_flake(18.6, 16.2, 3)+'" '+acs('m1')+'/>'),
    # a T-flask on its side: canted neck, cap, medium
    'incubator': ('<path d="M13.2 21H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8l4.5 4.5V19a2 2 0 0 1-2 2z"/>'
                  '<path d="M14.1 10.1 17.2 7M16.4 12.4l3.1-3.1"/>'
                  '<path d="M16.6 5.9l3.5 3.5" stroke-width="2.6"/>'
                  '<path class="ac m1" d="M3.75 15.5h13v3.5a1.25 1.25 0 0 1-1.25 1.25H5A1.25 1.25 0 0 1 3.75 19z" '
                  'style="fill:var(--ic-ac,currentColor)" stroke="none" opacity=".85"/>'),
    # one adherent cell and its nucleus: what the line looks like down the microscope
    'cellarchive': ('<path d="M4.5 20.5h15"/>'
                    '<path d="M15.8 20.5v-8.8a4.2 4.2 0 0 0-3.4-4.1"/>'
                    '<path d="M6.9 4.8l2.8-1.6 4.5 7.8-2.8 1.6z"/>'
                    '<path d="M12.2 13.2l.8 1.4"/>'
                    '<path d="M6.5 16.3h8.3"/>'
                    '<path d="M10.2 16.3h3.6" stroke-width="2.4" '+acs('m1')+'/>'),
    # a membrane: loading control even, the target fading across the dose series
    'blot': ('<rect x="3.5" y="3.5" width="17" height="17" rx="2"/>'
             '<path d="M6.5 6.4h2.8M10.6 6.4h2.8M14.7 6.4h2.8" '+DIM+'/>'
             '<path d="M6.5 16.2h2.8M10.6 16.2h2.8M14.7 16.2h2.8" stroke-width="2"/>'
             '<path class="ac m1" d="M6.5 11h2.8" stroke-width="2" style="stroke:var(--ic-ac,currentColor)"/>'
             '<path class="ac m2" d="M10.6 11h2.8" stroke-width="2" style="stroke:var(--ic-ac,currentColor)" opacity=".55"/>'
             '<path class="ac m3" d="M14.7 11h2.8" stroke-width="2" style="stroke:var(--ic-ac,currentColor)" opacity=".2"/>'),
    # the ledger's cup
    'cuppa': ('<path d="M5 9.5h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/>'
              '<path d="M16 11h1.2a2.3 2.3 0 0 1 0 4.6H16"/>'
              '<path d="M3.5 21.5h14" '+DIM+'/>'
              '<path class="m1" d="M8.8 3.2c-.8 1 .8 1.9 0 3M12.4 3.2c-.8 1 .8 1.9 0 3" '+DIM+'/>'
              '<path d="M5.7 11.8h9.6v3.7a3.3 3.3 0 0 1-3.3 3.3H9A3.3 3.3 0 0 1 5.7 15.5z" '+acf()+' opacity=".75"/>'),
    # NanoBRET: the donor lights, the energy crosses, the acceptor emits
    'beacon': ('<circle cx="7.4" cy="15" r="3.3" '+acf('m1')+'/>'
               '<circle cx="16.8" cy="9.4" r="3.3"/>'
               '<path class="m2" d="M10.6 13c.7-1.3 1.5.2 2.2-1.1s1.5.2 2.2-1.1" stroke-width="1.3"/>'
               '<path class="m3" d="M20.2 5.6l1.2-1.2M16.8 4.4V2.8M21.6 9.4h1.5" '+DIM+'/>'),
    # a well glowing: a luminescence read by hand
    'lumina': ('<path d="M5.5 13h13"/>'
               '<path d="M6.8 13v2.4a5.2 5.2 0 0 0 10.4 0V13"/>'
               '<path d="M8 15.5h8a4 4 0 0 1-8 0z" '+acf('m1')+'/>'
               '<path class="m2" d="M12 3.5v4M6.4 5.8l2.1 2.6M17.6 5.8l-2.1 2.6" '+DIM+'/>'),
    # an alpha helix: front turns in ink, the turns behind in the accent
    'ribbon': ('<g class="ac m1" style="stroke:var(--ic-ac,currentColor)" stroke-width="1.6">' + _helix()[0] + '</g>'
               '<g class="m2" stroke-width="2.6">' + _helix()[1] + '</g>'),
    # the protocol book, bookmarked
    'protocols': ('<path d="M12 6.5c-1.8-1.3-4.6-1.8-7.5-1.3v12.8c2.9-.5 5.7 0 7.5 1.3 1.8-1.3 4.6-1.8 7.5-1.3V5.2c-2.9-.5-5.7 0-7.5 1.3z"/>'
                  '<path d="M12 6.5v12.8"/>'
                  '<path d="M6.8 9.3c1.2 0 2.3.2 3.3.6M6.8 12.3c1.2 0 2.3.2 3.3.6" '+DIM+'/>'
                  '<path d="M14.8 5.4v5.4l1.4-1.1 1.4 1.1V5" '+acf('m1')+'/>'),
    # the notebook: a planned line, and one ticked
    'labbook': ('<rect x="6.5" y="3" width="13" height="18" rx="2"/>'
                '<path d="M4.3 7h4.4M4.3 12h4.4M4.3 17h4.4"/>'
                '<path d="M10.8 8h5.6M10.8 11.5h5.6" '+DIM+'/>'
                '<path class="ac m1" d="M11 15.5l1.6 1.6 3.4-3.6" pathLength="1" style="stroke:var(--ic-ac,currentColor)"/>'),
}

UI_ICONS = {
    # The rail's eight are duotone: an outline at the rail's stroke and one soft fill (class "fl")
    # that the rail lifts when the entry is active. Drawn to read at 20-22px, not at 19.
    'planner':   ('<path '+FL+' d="M3.5 9.5V7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5v2z"/>'
                  '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'
                  '<path class="m1" d="M8.8 15l2.2 2.2 4.2-4.4" pathLength="1"/>'),
    'notebook':  ('<path '+FL+' d="M7.2 3H9v18H7.2A2.2 2.2 0 0 1 5 18.8V5.2A2.2 2.2 0 0 1 7.2 3z"/>'
                  '<rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M9 3v18"/>'
                  '<path class="m1" d="M12.2 8h3.8M12.2 11.5h3.8M12.2 15h2.4" pathLength="1"/>'),
    # modules laid out over days: a staircase of steps on a time axis
    'designer':  ('<rect '+FL+' x="8" y="10.25" width="9" height="3.5" rx="1.5"/>'
                  '<path d="M3.5 3.5v17" opacity=".6"/>'
                  '<rect class="m1" x="5.5" y="4.5" width="8" height="3.5" rx="1.5"/><rect class="m1" x="8" y="10.25" width="9" height="3.5" rx="1.5"/>'
                  '<rect class="m1" x="11.5" y="16" width="9" height="3.5" rx="1.5"/>'),
    # a dose response in its frame
    'analysis':  ('<rect '+FL+' x="3.5" y="3.5" width="17" height="17" rx="3.5"/>'
                  '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/>'
                  '<path class="m1" d="M6.5 8h1.4c3.8 0 3.4 8 7.4 8h2.2" pathLength="1"/>'),
    'archive':   ('<path '+FL+' d="M12 6.5c-1.8-1.3-4.6-1.8-7.5-1.3v12.8c2.9-.5 5.7 0 7.5 1.3z"/>'
                  '<path d="M12 6.5c-1.8-1.3-4.6-1.8-7.5-1.3v12.8c2.9-.5 5.7 0 7.5 1.3 1.8-1.3 4.6-1.8 7.5-1.3V5.2c-2.9-.5-5.7 0-7.5 1.3z"/>'
                  '<path d="M12 6.5v12.8"/><path class="m1" d="M14.8 5.4v5.4l1.4-1.1 1.4 1.1V5" fill="currentColor" stroke="none"/>'),
    'cells':     ('<circle class="fl m1" fill="currentColor" stroke="none" opacity=".16" cx="9" cy="9.3" r="5.2"/>'
                  '<circle class="m1" cx="9" cy="9.3" r="5.2"/><circle class="m2" cx="16.2" cy="16" r="3.8"/>'
                  '<circle class="m1" cx="9" cy="9.3" r="1.8" fill="currentColor" stroke="none"/>'
                  '<circle class="m2" cx="16.2" cy="16" r="1.35" fill="currentColor" stroke="none"/>'),
    'apps':      ('<rect '+FL+' x="13.5" y="4" width="6.5" height="6.5" rx="2"/>'
                  + ''.join('<rect class="m1" x="%s" y="%s" width="6.5" height="6.5" rx="2"/>' % (x, y)
                            for y in (4, 13.5) for x in (4, 13.5))),
    # the rail itself: a panel, and which way it will go (the chevron, class cv, turns)
    'fold':      ('<path '+FL+' d="M6 4.5h3v15H6a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 6 4.5z"/>'
                  '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9 4.5v15"/><path class="cv" d="M15.5 9.5 13 12l2.5 2.5"/>'),
    'antibody':  ('<path d="M12 20.5V14L6.5 7.5M12 14l5.5-6.5"/><path class="m1" d="M5.1 10.6l2.6 3M18.9 10.6l-2.6 3" opacity=".55"/>'
                  '<circle cx="6.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="17.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>'),
    'primer':    ('<path d="M3.5 16.5h17" opacity=".55"/><path d="M5.5 16.5v-1.8M8 16.5v-1.8M10.5 16.5v-1.8M13 16.5v-1.8M15.5 16.5v-1.8M18 16.5v-1.8" opacity=".55"/>'
                  '<path class="m1" d="M5.5 10.5h9.5m-2-2.2 2.2 2.2-2.2 2.2M7.5 10.5v1.8M10 10.5v1.8M12.5 10.5v1.8"/>'),
    'plasmid':   ('<circle cx="12" cy="12" r="7.5" opacity=".55"/><path class="m1" d="M12 4.5a7.5 7.5 0 0 1 7.2 5.4" stroke-width="3.2"/>'
                  '<circle cx="6.4" cy="17" r="1.3" fill="currentColor" stroke="none"/>'),
}

def svg(body, cls=''):
    c = (' class="%s"' % cls) if cls else ''
    return ('<svg%s viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
            'stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" '
            'aria-hidden="true">%s</svg>') % (c, body)

def app_svg(app):
    return svg(APP_ICONS[app], 'ic mo-' + app)

def ui_svg(name):
    return svg(UI_ICONS[name], 'ic ui-' + name)


# ── contact sheet ───────────────────────────────────────────────────────────────────────────
def sheet(path):
    cells = []
    for a in APP_ICONS:
        cells.append('<div class="c"><div class="t" style="--hue:%s">%s</div>'
                     '<div class="t m" style="--hue:%s">%s</div>'
                     '<div class="t l" style="--hue:%s">%s</div><span>%s</span></div>'
                     % (HUES[a], app_svg(a), HUES[a], app_svg(a), HUES[a], app_svg(a), a))
    ui = ''.join('<div class="c"><div class="u">%s</div><div class="u b">%s</div><span>%s</span></div>'
                 % (ui_svg(n), ui_svg(n), n) for n in UI_ICONS)
    html = '''<!doctype html><html data-theme="light"><head><meta charset="utf-8"><style>
:root{--bg:#f4f5f8;--surface:#fff;--surface2:#f0f1f5;--border:rgba(0,0,0,.08);--text:#1a1d2e;--text2:#5a5f7a}
[data-theme=dark]{--bg:#0d0f14;--surface:#13161e;--surface2:#1c2030;--border:rgba(255,255,255,.09);--text:#e8eaf2;--text2:#8b90a8}
body{background:var(--bg);color:var(--text);font:12px system-ui;margin:0;padding:24px;display:flex;flex-direction:column;gap:18px}
.g{display:flex;flex-wrap:wrap;gap:14px}.c{display:flex;flex-direction:column;align-items:center;gap:6px;width:150px}
.row{display:flex;gap:8px;align-items:center}
.t{--ic-tile:color-mix(in oklab,var(--hue) 8%%,var(--surface));--ic-ac:var(--hue);width:48px;height:48px;border-radius:11px;display:flex;align-items:center;justify-content:center;
  background:var(--ic-tile);border:1px solid color-mix(in oklab,var(--hue) 18%%,var(--border));color:var(--text)}
[data-theme=dark] .t{--ic-ac:color-mix(in oklab,var(--hue) 60%%,#fff);--ic-tile:color-mix(in oklab,var(--hue) 12%%,var(--surface))}
.t svg{width:28px;height:28px}.t.m{width:32px;height:32px;border-radius:8px}.t.m svg{width:19px;height:19px}
.t.l{width:120px;height:120px;border-radius:26px}.t.l svg{width:72px;height:72px}
.c{flex-direction:row;flex-wrap:wrap;justify-content:center;width:auto}.c span{width:100%%;text-align:center;color:var(--text2)}
.u{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--text2)}.u svg{width:19px;height:19px}.u.b svg{width:60px;height:60px}.u.b{width:72px;height:72px}
</style></head><body><div class="g">%s</div><div class="g">%s</div></body></html>''' % (''.join(cells), ui)
    open(path, 'w').write(html)


# ── where the icons live ────────────────────────────────────────────────────────────────────
APP_FILES = {
    'echo':'apps/echo/echo.html', 'deg':'apps/dora/dora.html', 'pd':'apps/blueprint/blueprint.html',
    'dna':'apps/helix/helix.html', 'pt':'apps/protein-tools/protein-tools.html', 'spectra':'apps/bca/bca.html',
    'cryo':'apps/iceberg/iceberg.html', 'cuppa':'apps/cuppa/cuppa.html',
    'hitfinder':'apps/hitfinder/hitfinder.html', 'tempo':'apps/tempo/tempo.html', 'beacon':'apps/beacon/beacon.html', 'lumina':'apps/lumina/lumina.html', 'ribbon':'apps/ribbon/ribbon.html',
    'protocols':'apps/archive/archive.html', 'cellarchive':'apps/cell-archive/cell-archive.html',
    'incubator':'apps/incubator/incubator.html', 'labbook':'apps/labbook/labbook.html',
    'blot':'apps/western-blot/western-blot.html',
}
SHELL = 'shell/hub-shell.html'
WS_KEYS = ['planner', 'fold', 'antibody', 'primer', 'plasmid', 'notebook', 'designer', 'cells']
SUITE_KEYS = ['analysis', 'archive', 'apps']

# The tile: neutral, the faintest wash of the app's hue, the glyph in ink and one accent in the
# hue. Specificity is raised on purpose so it beats each app's own logo rule wherever it sits.
TILE_CSS = ('/* ic-tile:begin — generated by the sync_icons tool, do not edit here */\n'
    ':root .ic-tile.ic-tile{--ic-ac:var(--hue,currentColor);color:var(--text);box-sizing:border-box;'
    'background:color-mix(in oklab,var(--hue,#888) 9%,var(--surface));'
    'border:1px solid color-mix(in oklab,var(--hue,#888) 22%,var(--border));}\n'
    ':root[data-theme="dark"] .ic-tile.ic-tile{--ic-ac:color-mix(in oklab,var(--hue,#888) 60%,#fff);'
    'background:color-mix(in oklab,var(--hue,#888) 13%,var(--surface));}\n'
    ':root .ic-tile.ic-tile svg{width:58%;height:58%;display:block;flex:none;}\n'
    '/* ic-tile:end */\n')

def _put_tile_css(s):
    s = re.sub(r'/\* ic-tile:begin.*?/\* ic-tile:end \*/\n', '', s, flags=re.S)
    i = s.index('</style>')
    return s[:i] + TILE_CSS + s[i:]

def sync_app(app, s):
    m = re.search(r'<div class="(logo|app-logo|logo-box)(?: ic-tile)?"[^>]*>.*?</div>', s, re.S)
    assert m, app
    s = s[:m.start()] + '<div class="%s ic-tile" style="--hue:%s">%s</div>' % (m.group(1), HUES[app], app_svg(app)) + s[m.end():]
    return _put_tile_css(s)

def sync_shell(s):
    for app in APP_ICONS:
        pat = (r'(data-app-id="' + app + r'"[^>]*>\s*<div class="card-header-row">\s*)'
               r'<div class="card-logo[^"]*"[^>]*>.*?</svg></div>')
        s, n = re.subn(pat, lambda m: m.group(1) + '<div class="card-logo ic-tile" style="--hue:%s">%s</div>'
                       % (HUES[app], app_svg(app)), s, flags=re.S)
        assert n == 1, (app, n)
    for table, keys in (('WS_ICONS', WS_KEYS), ('SUITE_ICONS', SUITE_KEYS)):
        a = s.index('var %s = {' % table); b = s.index('\n};', a)
        body = s[a:b]
        for k in keys:
            body, n = re.subn(r"(\n\s+%s\s*:\s*)'<svg.*?</svg>'" % k,
                              lambda m: m.group(1) + "'" + ui_svg(k) + "'", body, flags=re.S)
            assert n == 1, (table, k, n)
        s = s[:a] + body + s[b:]
    a = s.index('var APP_INFO = {'); b = s.index('\n};', a)
    body = s[a:b]
    for app, h in HUES.items():
        body, n = re.subn(r"(\n\s+%s\s*:\s*\{[^}]*?color:')#[0-9a-fA-F]{6}" % app, lambda m: m.group(1) + h, body)
        assert n == 1, ('APP_INFO', app, n)
    s = s[:a] + body + s[b:]
    return _put_tile_css(s)

def run(check):
    bad = []
    jobs = [(SHELL, sync_shell)] + [(f, (lambda a: lambda s: sync_app(a, s))(a)) for a, f in APP_FILES.items()]
    for rel, fn in jobs:
        path = os.path.join(ROOT, rel)
        cur = open(path, encoding='utf-8').read()
        new = fn(cur)
        if new != cur:
            bad.append(rel)
            if not check:
                open(path, 'w', encoding='utf-8').write(new)
    if check:
        print('icons: ' + ('in sync' if not bad else 'DRIFT in ' + ', '.join(bad)))
        return 1 if bad else 0
    print('icons: wrote ' + (', '.join(bad) if bad else 'nothing (already in sync)'))
    return 0


if __name__ == '__main__':
    if '--sheet' in sys.argv:
        sheet(sys.argv[sys.argv.index('--sheet')+1]); sys.exit(0)
    sys.exit(run('--check' in sys.argv))
