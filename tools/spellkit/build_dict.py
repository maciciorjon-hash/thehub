#!/usr/bin/env python3
"""Build the spelling dictionary that SpellKit carries (tools/spellkit/dict.b64).

    python3 tools/spellkit/build_dict.py            # write dict.b64
    python3 tools/spellkit/build_dict.py --stats    # also print what went in

Three sources, each one a file in this folder, so the build is the same on any machine:

  data/en-US.aff + en-US.dic   Hunspell en-US (SCOWL, Kevin Atkinson; permissive licence, see data/README.md).
                               The affix rules are expanded here, so the browser reads a plain word list.
  domain.txt                   Words a lab writes that a general dictionary does not know (cereblon,
                               lysate, immunoblot, …) — generic science and lab vocabulary only, never a
                               compound or construct of anybody's. One word per line, # comments.
  freq.txt                     The most common words in English text, most common first. Only the ORDER is
                               used, to put the likelier correction first. Built by freq_build.py from
                               prose that ships with this repository.

The blob is one gzip of five sections separated by a line holding a single "§":
  L  lower-case words, sorted, front-coded (a digit/letter = how many leading characters repeat the line above)
  C  words that exist only with a capital (Dundee, Monday), same coding
  N  words never offered as a correction (the dictionary's own NOSUGGEST list)
  F  the frequency order, one word per line
  R  the dictionary's own sound-alike table (ph/f, ei/a …), "from to" per line, used to suggest
"""
import re, sys, gzip, base64, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'dict.b64'


def load_aff(path):
    pfx, sfx = {}, {}
    cross = {}
    for line in path.read_text(encoding='latin-1').splitlines():
        p = line.split()
        if len(p) >= 4 and p[0] in ('PFX', 'SFX') and p[2] in ('Y', 'N') and p[3].isdigit():
            cross[(p[0], p[1])] = p[2] == 'Y'
        elif len(p) >= 5 and p[0] in ('PFX', 'SFX'):
            kind, flag, strip, add, cond = p[0], p[1], p[2], p[3], p[4]
            add = add.split('/')[0]
            if strip == '0': strip = ''
            if add == '0': add = ''
            rx = re.compile(('^' + cond) if kind == 'PFX' else (cond + '$'))
            (pfx if kind == 'PFX' else sfx).setdefault(flag, []).append((strip, add, rx))
    return pfx, sfx, cross


def expand(dic_path, aff_path, extra=None):
    pfx, sfx, cross = load_aff(aff_path)
    words, nosug = set(), set()
    lines = (dic_path.read_text(encoding='latin-1').splitlines()[1:] if dic_path else []) + list(extra or [])
    for line in lines:
        if not line.strip(): continue
        stem, _, flags = line.partition('/')
        stem = stem.strip()
        if not stem or re.search(r'[0-9]', stem): continue
        flags = flags.strip()
        forms = {stem}
        sfx_forms = []
        for f in flags:
            for strip, add, rx in sfx.get(f, []):
                if rx.search(stem) and (not strip or stem.endswith(strip)):
                    w = (stem[:len(stem) - len(strip)] if strip else stem) + add
                    sfx_forms.append((w, cross.get(('SFX', f), False)))
        forms.update(w for w, _ in sfx_forms)
        for f in flags:
            for strip, add, rx in pfx.get(f, []):
                if rx.search(stem) and (not strip or stem.startswith(strip)):
                    pre = add + (stem[len(strip):] if strip else stem)
                    forms.add(pre)
                    if cross.get(('PFX', f), False):
                        forms.update(add + w for w, x in sfx_forms if x)
        words |= forms
        if '!' in flags: nosug |= forms
    return words, nosug



# ── British spellings, derived rather than shipped ───────────────────────────────────────────────────────────────
# The dictionary is American. A lab in Dundee writes normalised, colour, centre, litre, haemoglobin, labelled, and a
# checker that underlines them is one nobody trusts. Both spellings are accepted; the rules below add the British
# one for every American word the dictionary has, so no second licensed dictionary is needed.
OR_OUR = 'color favor flavor honor humor labor neighbor odor rumor savior vapor behavior harbor tumor endeavor rigor vigor parlor armor candor clamor fervor glamor splendor valor rancor demeanor arbor'.split()
ER_RE = {'center': 'centre', 'fiber': 'fibre', 'liter': 'litre', 'meter': 'metre', 'theater': 'theatre', 'caliber': 'calibre',
         'saber': 'sabre', 'somber': 'sombre', 'luster': 'lustre', 'meager': 'meagre', 'spectre': 'spectre', 'sepulcher': 'sepulchre'}
DOUBLE_L = 'label model cancel travel level signal channel fuel counsel marvel quarrel tunnel duel jewel shovel funnel pencil panel total equal rival model initial'.split()
OG_OGUE = 'analog catalog dialog homolog ortholog paralog monolog prolog epilog travelog'.split()
MISC = {'gray': 'grey', 'aluminum': 'aluminium', 'tire': 'tyre', 'artifact': 'artefact', 'judgment': 'judgement', 'aging': 'ageing',
        'mold': 'mould', 'plow': 'plough', 'skeptic': 'sceptic', 'cozy': 'cosy', 'mom': 'mum', 'defense': 'defence', 'offense': 'offence',
        'pretense': 'pretence', 'curb': 'kerb', 'story': 'storey', 'program': 'programme', 'check': 'cheque', 'sulfur': 'sulphur',
        'sulfate': 'sulphate', 'sulfide': 'sulphide', 'sulfite': 'sulphite', 'sulfonate': 'sulphonate', 'sulfhydryl': 'sulphhydryl',
        'anemia': 'anaemia', 'anesthesia': 'anaesthesia', 'anesthetic': 'anaesthetic', 'edema': 'oedema', 'esophagus': 'oesophagus',
        'estrogen': 'oestrogen', 'fetus': 'foetus', 'fetal': 'foetal', 'diarrhea': 'diarrhoea', 'pediatric': 'paediatric',
        'orthopedic': 'orthopaedic', 'maneuver': 'manoeuvre', 'ameba': 'amoeba', 'gynecology': 'gynaecology', 'cecum': 'caecum',
        'leukemia': 'leukaemia', 'hemoglobin': 'haemoglobin', 'hemorrhage': 'haemorrhage', 'hematology': 'haematology',
        'hematocrit': 'haematocrit', 'hemocytometer': 'haemocytometer', 'hemolysis': 'haemolysis', 'hemolytic': 'haemolytic',
        'hemolyzed': 'haemolysed', 'ischemia': 'ischaemia', 'glycemia': 'glycaemia', 'hypoxemia': 'hypoxaemia', 'septicemia': 'septicaemia',
        'license': 'licence', 'practice': 'practise', 'inquiry': 'enquiry', 'inquire': 'enquire', 'ax': 'axe', 'pajamas': 'pyjamas',
        'smolder': 'smoulder', 'molt': 'moult', 'draft': 'draught', 'yogurt': 'yoghurt', 'learned': 'learnt', 'spelled': 'spelt',
        'burned': 'burnt', 'dreamed': 'dreamt', 'leaped': 'leapt', 'spilled': 'spilt', 'spoiled': 'spoilt', 'amid': 'amidst'}
EXTRA_BRITISH = ('whilst amongst learnt spelt burnt spilt spoilt dreamt towards afterwards backwards forwards upwards downwards '
                 'microlitre millilitre nanolitre picolitre centilitre decilitre kilolitre microlitres millilitres nanolitres '
                 'micrometre millimetre nanometre centimetre kilometre picometre micrometres millimetres nanometres centimetres '
                 'programme programmes fulfil fulfils skilful instalment enrolment enrolments aeroplane mum mummy tyres storeys').split()


def british(words):
    out = set()
    wl = set(words)
    for w in wl:
        if len(w) > 5 and w.endswith('ize') and not w.endswith('size'): out.add(w[:-3] + 'ise')
        for suf, rep in (('ized', 'ised'), ('izes', 'ises'), ('izing', 'ising'), ('izer', 'iser'), ('izers', 'isers'),
                         ('ization', 'isation'), ('izations', 'isations'), ('izable', 'isable')):
            if len(w) > len(suf) + 2 and w.endswith(suf) and not re.search(r'size[ds]?$|sizing$', w): out.add(w[:-len(suf)] + rep)
        for suf, rep in (('yze', 'yse'), ('yzed', 'ysed'), ('yzes', 'yses'), ('yzing', 'ysing'), ('yzer', 'yser'), ('yzers', 'ysers')):
            if w.endswith(suf): out.add(w[:-len(suf)] + rep)
        for us in OR_OUR:
            if w.startswith(us) or w.startswith('dis' + us) or w.startswith('un' + us):
                i = w.index(us)
                out.add(w[:i] + us[:-2] + 'our' + w[i + len(us):])
        for us, uk in ER_RE.items():
            for pre in ('', 'milli', 'micro', 'nano', 'pico', 'centi', 'deci', 'kilo'):
                if pre and us not in ('liter', 'meter'): continue
                base = pre + us
                if w == base: out.add(pre + uk)
                elif w == base + 's': out.add(pre + uk + 's')
                elif w == base + 'ed': out.add(pre + uk + 'd')
                elif w == base + 'ing': out.add(pre + uk[:-2] + 'ring')
        for st in DOUBLE_L:
            for suf in ('ed', 'ing', 'er', 'ers'):
                if w == st + suf: out.add(st + 'l' + suf)
        for us in OG_OGUE:
            if w == us: out.add(us + 'ue')
            elif w == us + 's': out.add(us + 'ues')
            elif w == us + 'ed': out.add(us + 'ued')
            elif w == us + 'ing': out.add(us + 'uing')
        if w.startswith('hemo') or w.startswith('hema'): out.add('hae' + w[2:])
        if w.endswith('emia') and len(w) > 6: out.add(w[:-4] + 'aemia')
        if w.startswith('esophag'): out.add('oe' + w[1:])
        if w.startswith('estrogen'): out.add('oe' + w[1:])
        for us, uk in MISC.items():
            if w == us: out.add(uk)
            elif w == us + 's': out.add(uk + 's')
    out.update(EXTRA_BRITISH)
    return out - wl


def front_code(words):
    out, prev = [], ''
    for w in sorted(words):
        n = 0
        m = min(len(prev), len(w), 35)
        while n < m and prev[n] == w[n]: n += 1
        out.append((chr(48 + n) if n < 10 else chr(87 + n)) + w[n:])   # 0-9 then a-z (10 = 'a')
        prev = w
    return '\n'.join(out)


def read_list(path):
    if not path.exists(): return []
    out = []
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.split('#')[0].strip().lower()
        if line: out.append(line)
    return out


def build(stats=False):
    dom_lines = [l.split('#')[0].strip() for l in (HERE / 'domain.txt').read_text(encoding='utf-8').splitlines()]
    dom_lines = [l for l in dom_lines if l]
    words, nosug = expand(HERE / 'data/en-US.dic', HERE / 'data/en-US.aff', dom_lines)
    words = {w.replace('’', "'") for w in words}
    # Only words a reader would type as words: letters and inner apostrophes.
    words = {w for w in words if re.fullmatch(r"[A-Za-z]+(?:'[A-Za-z]+)*", w) and len(w) >= 1}
    lower = {w for w in words if w == w.lower()}
    uk = {w for w in british(lower) if re.fullmatch(r"[a-z]+(?:'[a-z]+)*", w)}
    lower |= uk
    cap = {w for w in words if w != w.lower() and w[0].isupper() and w[1:] == w[1:].lower() and w.lower() not in lower}
    domain = {l.split('/')[0].lower() for l in dom_lines}
    lower |= {d for d in domain if re.fullmatch(r"[a-z]+(?:'[a-z]+)*", d)}
    freq = [w for w in read_list(HERE / 'freq.txt') if w in lower]
    # The lab's own words rank after the common ones: a slip into one of them (alliquot → aliquot) is still a clear typo.
    dom_forms, _ = expand(None, HERE / 'data/en-US.aff', dom_lines)
    seen = set(freq)
    freq += sorted(w.lower() for w in dom_forms if w.lower() in lower and w.lower() not in seen and re.fullmatch(r'[a-z]+', w.lower()))
    ns = {w for w in nosug if w == w.lower() and w in lower}
    reps = []
    for line in (HERE / 'data/en-US.aff').read_text(encoding='latin-1').splitlines():
        q = line.split()
        if len(q) == 3 and q[0] == 'REP' and q[1] != q[2] and '_' not in q[1] + q[2]: reps.append(q[1] + ' ' + q[2])
    blob = '\n§\n'.join([front_code(lower), front_code(cap), '\n'.join(sorted(ns)), '\n'.join(freq[:20000]), '\n'.join(reps)])
    raw = blob.encode('utf-8')
    gz = gzip.compress(raw, 9, mtime=0)
    OUT.write_text(base64.b64encode(gz).decode('ascii') + '\n', encoding='ascii')
    if stats:
        print('stems expanded to', len(words), 'forms:', len(lower), 'lower-case,', len(cap), 'capitalised only,',
              len(ns), 'never suggested; British added', len(uk), '; domain', len(domain), '; frequency list', len(freq))
        print('raw', len(raw), 'gzip', len(gz), 'base64', OUT.stat().st_size)
    return lower


if __name__ == '__main__':
    build('--stats' in sys.argv)
