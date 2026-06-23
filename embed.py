#!/usr/bin/env python3
"""Bundle all apps into The Hub.

Usage:
  python embed.py                      ->  ./The Hub.html   (local dev)
  python embed.py dist/index.html     ->  dist/index.html   (CI / GitHub Pages)
"""
import base64, re, os, sys

BASE  = os.path.dirname(os.path.abspath(__file__))
SHELL = os.path.join(BASE, 'hub-shell.html')
OUT   = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'The Hub.html')

APPS = [
    ('echo', 'Labcyte_Echo/labcyte_echo.html'),
    ('deg',  'Degradation_Explorer/degradation_visualizer.html'),
    ('lm',   'Labmate/labmate.html'),
    ('pd',   'Plate_Designer/plate_designer.html'),
    ('dna',  'Helix/helix.html'),
    ('pt',   'Protein_Tools/protein_tools.html'),
    ('spectra', 'Spectra/spectra.html'),
    ('ldi',     'LDI/ldi.html'),
    ('cryo',    'Cryostorage/cryostorage.html'),
    ('cuppa',      'Cuppa/cuppa.html'),
    ('fabricata',  'DataFaker/fabricata.html'),
    ('beacon',     'Beacon/beacon.html'),
]

src = open(SHELL, encoding='utf-8').read()
for key, rel in APPS:
    path = os.path.join(BASE, rel)
    b64 = base64.b64encode(open(path, 'rb').read()).decode('ascii')
    src, n = re.subn(r'(?<=' + key + r': ")[^"]*', b64, src)
    print(f'  {key}: {n} replacement(s)')

out_abs = os.path.abspath(OUT)
out_dir = os.path.dirname(out_abs)
if out_dir:
    os.makedirs(out_dir, exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(src)
print(f'Output: {OUT} ({len(src):,} chars)')
