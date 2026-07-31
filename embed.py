#!/usr/bin/env python3
"""Bundle all apps into dHUB.

Usage:
  python embed.py                                  ->  ./dHUB.html     (local dev, everything)
  python embed.py dist/index.html                 ->  dist/index.html (CI / GitHub Pages)
  python embed.py --profile=product dist/index.html
        ->  only the apps that make up the product story (see PROFILES). Personal-workflow
            apps stay in the repo and in the default build; they just don't ship.
"""
import base64, re, os, sys

BASE  = os.path.dirname(os.path.abspath(__file__))
SHELL = os.path.join(BASE, 'hub-shell.html')

args    = [a for a in sys.argv[1:] if not a.startswith('--')]
flags   = [a for a in sys.argv[1:] if a.startswith('--')]
profile = 'all'
for f in flags:
    if f.startswith('--profile='):
        profile = f.split('=', 1)[1]
OUT = args[0] if args else os.path.join(BASE, 'dHUB.html')

APPS = [
    ('echo', 'Echo/echo.html'),
    ('deg',  'Dora/dora.html'),
    ('pd',   'Blueprint/blueprint.html'),
    ('dna',  'Helix/helix.html'),
    ('pt',   'Protein_Tools/protein_tools.html'),
    ('spectra', 'BCA/bca.html'),
    ('ldi',     'LDI/ldi.html'),
    ('cryo',    'Iceberg/iceberg.html'),
    ('cuppa',      'Cuppa/cuppa.html'),
    ('fabricata',  'Fabricata/fabricata.html'),
    ('beacon',     'Beacon/beacon.html'),
    ('lumina',     'Lumina/lumina.html'),
    ('ribbon',     'Ribbon/ribbon.html'),
    ('protocols',  'Archive/archive.html'),
    ('cellarchive', 'Cell_Archive/cell_archive.html'),
    ('bench',       'Bench/bench.html'),
    ('labbook',     'Labbook/labbook.html'),
    ('plasmids',    'Plasmids/plasmids.html'),
    ('blot',        'WesternBlot/westernblot.html'),
    ('gantt',       'Gantt/gantt.html'),
]

# Which apps ship in which build. 'all' is the personal Hub; 'product' is the sellable
# story — the notebook, the analysis that feeds it, the protocol library and the modules
# they depend on. Cuppa/Fabricata/Cadence and the off-path tools stay out.
PROFILES = {
    'product': ['labbook', 'echo', 'protocols', 'pd', 'blot', 'dna', 'plasmids',
                'cellarchive', 'bench', 'cryo', 'deg', 'ldi', 'spectra', 'beacon', 'lumina'],
}
# ── Standalone Labbook ────────────────────────────────────────────────────
# Labbook + Archive as one self-contained file, with no dHUB around it. Archive is embedded
# verbatim as a base64 iframe: it publishes its bridge onto window.parent, which inside Labbook
# IS Labbook — so nothing in either app has to be forked or de-collided.
if profile == 'labbook':
    lb = open(os.path.join(BASE, 'Labbook/labbook.html'), encoding='utf-8').read()
    arc = open(os.path.join(BASE, 'Archive/archive.html'), 'rb').read()
    arc_b64 = base64.b64encode(arc).decode('ascii')
    lb, n = re.subn(r'(?<=var ARCHIVE_B64 = ")[^"]*', arc_b64, lb)
    if n != 1:
        sys.stderr.write('labbook profile: expected 1 ARCHIVE_B64 placeholder, got %d\n' % n)
        sys.exit(1)
    out = OUT if args else os.path.join(BASE, 'labbook-standalone.html')
    open(out, 'w', encoding='utf-8').write(lb)
    print('Labbook standalone: %s (%s chars, Archive embedded: %s chars)'
          % (out, f'{len(lb):,}', f'{len(arc_b64):,}'))
    sys.exit(0)

if profile != 'all':
    if profile not in PROFILES:
        sys.stderr.write('unknown profile: %s (known: %s)\n' % (profile, ', '.join(PROFILES)))
        sys.exit(1)
    keep = set(PROFILES[profile])
    unknown = keep - {k for k, _ in APPS}
    if unknown:
        sys.stderr.write('profile %s lists unknown app ids: %s\n' % (profile, ', '.join(sorted(unknown))))
        sys.exit(1)
    dropped = [k for k, _ in APPS if k not in keep]
    APPS = [(k, r) for k, r in APPS if k in keep]
    print('profile=%s — shipping %d apps, omitting: %s' % (profile, len(APPS), ', '.join(dropped)))

src = open(SHELL, encoding='utf-8').read()
errors = []

# Omitted apps keep their placeholder in the shell, so blank it (no payload) and strip their
# home card, otherwise the build ships a card that opens an empty iframe.
if profile != 'all':
    for key in dropped:
        src = re.sub(r'(?<=' + key + r': ")[^"]*', '', src)
        card = re.search(r'[ \t]*<div class="card"[^>]*data-app-id="' + key + r'"[\s\S]*?\n[ \t]*</div>\n',
                         src)
        if card:
            src = src[:card.start()] + src[card.end():]

for key, rel in APPS:
    path = os.path.join(BASE, rel)
    try:
        data = open(path, 'rb').read()
    except FileNotFoundError:
        print(f'  {key}: MISSING SOURCE — {rel}')
        errors.append(f'{key}: source file not found ({rel})')
        continue
    b64 = base64.b64encode(data).decode('ascii')
    src, n = re.subn(r'(?<=' + key + r': ")[^"]*', b64, src)
    print(f'  {key}: {n} replacement(s)')
    # Exactly one placeholder must be filled. n==0 (typo'd/renamed key) or n>1
    # (duplicated entry) would ship a blank/broken app silently — fail loudly.
    if n != 1:
        errors.append(f'{key}: expected 1 placeholder replacement, got {n}')

if errors:
    sys.stderr.write('\nembed.py FAILED — the bundle was NOT written:\n  - '
                     + '\n  - '.join(errors) + '\n')
    sys.exit(1)

out_abs = os.path.abspath(OUT)
out_dir = os.path.dirname(out_abs)
if out_dir:
    os.makedirs(out_dir, exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(src)
print(f'Output: {OUT} ({len(src):,} chars)')
