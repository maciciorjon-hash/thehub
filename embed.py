#!/usr/bin/env python3
"""Bundle all JM Apps into The Hub.

Usage:
  python embed.py                      ->  ./The Hub.html   (local dev)
  python embed.py dist/index.html     ->  dist/index.html   (CI / GitHub Pages)
"""
import base64, re, os, sys

BASE  = os.path.dirname(os.path.abspath(__file__))
SHELL = os.path.join(BASE, 'hub-shell.html')
OUT   = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'The Hub.html')

APPS = [
    ('echo', 'Echo Data Analysis/Echo_Data_Analysis.html'),
    ('deg',  'Degradation Explorer/degradation_visualizer.html'),
    ('lm',   'Labmate/labmate.html'),
    ('pd',   'Plate Designer/plate_designer.html'),
    ('dna',  'DNA Tools/dna_tools.html'),
    ('pt',   'Protein Tools/protein_tools.html'),
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
