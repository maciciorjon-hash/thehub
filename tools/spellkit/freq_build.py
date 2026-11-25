#!/usr/bin/env python3
"""Build tools/spellkit/freq.txt: the most common words in English text, most common first.

    python3 tools/spellkit/freq_build.py

Only the ORDER matters (build_dict.py keeps the first 15 000 that the dictionary knows): SpellKit puts the likelier
correction first. The text is prose that ships with this repository — the reference notes, the studies, the
session history, the UI guide — and the prose in Python's own documentation, which gives the everyday words that a
lab's notes under-use. Code blocks, inline code, links and markup are cut out first.
"""
import re, pathlib, collections
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
files = [p for p in (ROOT / 'docs').glob('*.md')] + [p for p in (ROOT / 'tools/assist/kb').glob('*.js')]
text = []
for p in files:
    t = p.read_text(encoding='utf-8', errors='ignore')
    t = re.sub(r'```.*?```', ' ', t, flags=re.S)
    t = re.sub(r'`[^`\n]*`', ' ', t)
    t = re.sub(r'https?://\S+', ' ', t)
    text.append(t)
try:
    import pydoc_data.topics as T
    text.append('\n'.join(T.topics.values()))
except Exception:
    pass
cnt = collections.Counter()
for t in text:
    for w in re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)*", t):
        if w != w.lower() and not (w[0].isupper() and w[1:] == w[1:].lower()): continue   # CamelCase, ALLCAPS
        cnt[w.lower()] += 1
out = [w for w, c in cnt.most_common(40000) if c >= 2]
(HERE / 'freq.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')
print(len(out), 'words; first:', ' '.join(out[:12]))
