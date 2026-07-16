#!/usr/bin/env python3
"""Bundle all apps into dHUB.

Usage:
  python embed.py                      ->  ./dHUB.html      (local dev)
  python embed.py dist/index.html     ->  dist/index.html   (CI / GitHub Pages)
"""
import base64, re, os, sys

BASE  = os.path.dirname(os.path.abspath(__file__))
SHELL = os.path.join(BASE, 'hub-shell.html')
OUT   = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'dHUB.html')

APPS = [
    ('echo', 'Echo/echo.html'),
    ('deg',  'Dora/dora.html'),
    ('lm',   'Labmate/labmate.html'),
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
    ('arc',        'Arc/arc.html'),
    ('protocols',  'Archive/archive.html'),
    ('cellarchive', 'Cell_Archive/cell_archive.html'),
]

src = open(SHELL, encoding='utf-8').read()
errors = []
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
