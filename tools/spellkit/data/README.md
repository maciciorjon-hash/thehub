# Source of the dictionary

`en-US.aff` and `en-US.dic` are the Hunspell US-English dictionary that Mozilla ships (derived from SCOWL, Kevin Atkinson, and
released under a permissive, BSD-like licence that allows use, copying, modification and redistribution without fee provided the
copyright notice stays). They were taken from the copy bundled with Wine Gecko 2.47.4 on the author's machine; nothing was
downloaded. `../build_dict.py` expands the affix rules into a plain word list, adds the lab vocabulary of `../domain.txt` and the
British spellings it derives, and writes `../dict.b64`, which `tools/sync_spellkit.py` carries into Labbook.
