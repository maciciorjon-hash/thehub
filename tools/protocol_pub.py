# -*- coding: utf-8 -*-
"""Archive protocol data: the Methods sentences, and the numbers that must agree with a calculator.

    python3 tools/protocol_pub.py           write both into apps/archive/archive.html
    python3 tools/protocol_pub.py --check   change nothing; exit 1 if the file is out of step (the pre-commit hook runs this)

1. METHODS. A stage is one dated block in a Labbook experiment, so its sentence describes that block.
   `noPub` marks a stage that is reference material — a guide to reading a PAE plot is not a step
   anybody performed, and it must not turn into a Methods paragraph.
   A sentence may carry `{{key}}` tokens. They are read from the parameters of the stage's own steps and
   printed exactly as the Protocol tab prints them, so a number in a Methods sentence is the number in the
   step. Use a token for every number a calculator also holds.

2. MIRRORED PARAMETERS. A step parameter may name what it must equal:

       "calc": "{wb-ab-sec}"                              the DEFAULT of a calculator box (its HTML id)
       "calc": "{gb-vng}*1000/({gb-vsz}*650)", "round": 3  arithmetic over boxes ...
       "calc": "{p.rnpAddVol}*{p.rnpCas9Conc}/2"           ... and over other parameters of the same protocol
       "calcMax": "{p.rnpAddVol.max}*..."                  the upper end of a range

   The value written into PROTOCOL_DATA is then computed from those defaults, here, so the prose and the
   calculator cannot disagree (the audit found WB secondary 1:4000 in the steps and 1:5000 in the box).
   Change the box's default and re-run this script: the step, the Labbook feed and every Methods sentence
   follow. archive_audit_invariants AR14 recomputes the same thing in the browser from the live DOM.
"""
import re, json, sys, math

SRC = 'apps/archive/archive.html'

PUB = {
 'gibson': [
   '',   # Overview — background, publishes nothing
   'Primers were designed with 15–30 bp overlaps between adjacent fragments, with the 3′ binding region at a Tm of ~60 °C.',
   'Vector backbone and insert were amplified separately with a high-fidelity polymerase, digested with DpnI to remove template plasmid, resolved on an agarose gel and purified.',
   'Fragments were assembled with NEBuilder HiFi {{masterMixX}} master mix in a {{reactionVol}} reaction at {{assemblyTemp}} for {{assemblyTimeFew}} (2–3 fragments) or {{assemblyTimeMany}} (4–6 fragments), using {{vectorNg}} of vector (~{{vectorPmol}} for a {{vectorBp}} vector) and a {{insertExcess}} molar excess of each insert.',
 ],
 'transfo': [
   '',   # thawing cells and pre-warming plates
   'Plasmid DNA (1–5 µL) was mixed with 25–50 µL of competent E. coli, incubated on ice for 2 min, heat-shocked at 42 °C for 30 s, returned to ice for 2 min, recovered in {{recoveryVol}} of LB/SOC and shaken at {{recoveryTemp}} for {{recoveryTime}}.',
   'Cells were plated on LB agar containing the appropriate antibiotic and grown overnight at 37 °C.',
   'Single colonies were picked into {{cultureVol}} of LB with antibiotic and grown overnight at 37 °C.',
 ],
 'miniprep': [
   'Overnight cultures were harvested and lysed by alkaline lysis (GeneJET).',
   'Plasmid DNA was bound to a silica column, washed with ethanol-containing wash solution, dried and eluted; yield and purity were checked by NanoDrop.',
 ],
 'nucleospin': [
   'PCR products were purified with the NucleoSpin Gel and PCR Clean-up kit in PCR clean-up mode and eluted in 15–20 µL.',
   'Bands were excised under long-wave UV and purified with the NucleoSpin Gel and PCR Clean-up kit in gel-extraction mode, eluting in 15–20 µL.',
 ],
 'seeding': [
   'Cells were trypsinized, counted and seeded at the stated density and volume per well, then returned to the incubator.',
 ],
 'transfection': [
   'Cells were seeded to reach ~70–80% confluence and left overnight at 37 °C, 5% CO₂.',
   'Plasmid DNA was diluted in Opti-MEM, FuGENE HD was added directly to the diluted DNA at the stated ratio, complexes were left {{complexTime}} at room temperature and added dropwise to the cells, which were then incubated for 24–48 h.',
 ],
 'revtx': [
   '',   # the per-well conditions table
   'Cells were freshly trypsinized and resuspended in complete growth medium.',
   'Transfection complexes were formed by adding plasmid DNA to Opti-MEM and FuGENE HD directly to the diluted DNA, left {{complexTime}} at room temperature and dispensed into the wells, and the cells overlaid on top immediately.',
 ],
 'trex': [
   'HEK293 T-REx cells were seeded at {{cellsPerWell}} cells per well of a {{format}}-well plate in {{mediaVol}} of T-REx complete medium (DMEM, 10% FBS, 2 mM L-glutamine, 1% Pen-Strep) and grown overnight to {{confluency}} confluence.',
   'The next day the cells were co-transfected with {{dnaTotal}} of plasmid DNA per well at a {{ratio}}:1 ratio of pOG44 to pcDNA5/FRT/TO ({{pog44}} and {{pcdna5}}): the DNA was diluted in {{optiVol}} of Opti-MEM, FuGENE HD was added directly to the diluted DNA at {{fugeneRatio}}:1 (µL:µg; {{fugeneVol}} per well) and the complexes were left {{complexTime}} at room temperature before being added dropwise to the cells, with an empty pcDNA5/FRT/TO well as control.',
   'Twenty-four hours after transfection the medium was replaced with fresh T-REx complete medium without hygromycin.',
   'At 48 h the cells were expanded into 10 cm dishes and allowed to attach overnight.',
   'Before selection the dishes were held at {{temp}} for {{hours}} to favour Flp-mediated integration.',
   'Selection was started with {{hygro}} hygromycin B in T-REx complete medium.',
   'The cells were kept under selection for {{weeks}}, with half to two-thirds of the medium replaced by fresh T-REx complete medium with hygromycin B every {{every}}.',
   'Surviving cells were expanded and expression of the construct was confirmed by inducing with {{tet}} tetracycline for {{induceH}}.',
   'The confirmed line was expanded without hygromycin and frozen for long-term storage.',
 ],
 'ctg2': [
   '',   # reagent thawing
   'Plates were equilibrated to room temperature for ~30 min, CellTiter-Glo 2.0 reagent added at a volume equal to the culture medium, mixed on an orbital shaker for 2 min and luminescence recorded after a 10 min incubation.',
 ],
 'hibitlytic': [
   'HiBiT Lytic Detection Reagent was prepared by adding LgBiT protein and substrate to Nano-Glo HiBiT Lytic Buffer, added directly to each well, mixed on a plate shaker and luminescence recorded after 10 min at room temperature.',
 ],
 'bca': [
   'Protein concentration was determined against a BSA standard curve (0.125–2 mg/mL) with BCA reagent, reading absorbance at 562 nm and requiring R² ≥ 0.99 for the standard curve.',
   '',   # the sample-prep calculator
 ],
}

# Reference material: real protocols in Archive, but nothing anyone "did" in an experiment.
NOPUB = ['pdb', 'alphafold', 'pymol', 'pymolfig', 'pockets', 'ternary', 'geneseq']


def extract(s):
    m = re.search(r'var PROTOCOL_DATA = ', s)
    start = m.end(); d = 0; i = start
    while True:
        c = s[i]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
        elif c == '"':
            i += 1
            while s[i] != '"' or s[i-1] == '\\': i += 1
        i += 1
    return start, i + 1


# ── number formatting: the same as _pfmt / paramText in archive.html ──
def half_up(x, digits=0):
    k = 10 ** digits
    return math.floor(x * k + 0.5) / k

def pfmt(n):
    r = half_up(n, 6)
    sign = '−' if r < 0 else ''
    r = abs(r)
    if abs(r - round(r)) >= 1e-9:
        t = repr(r)
        return sign + (t[:-2] if t.endswith('.0') else t)
    r = int(round(r))
    return sign + (format(r, ',') if r >= 10000 else str(r))

def ptext(v, methods=False):
    """The text of a parameter. methods=True puts a space before °C, the way a Methods section writes it."""
    if v['type'] == 'ratio':
        return '1:' + pfmt(v['value'])
    t = pfmt(v['value'])
    if v['type'] == 'range' and v.get('max') is not None:
        t += '–' + pfmt(v['max'])
    u = v.get('unit') or ''
    if methods and u == '°C':
        return t + ' °C'
    sp = '' if (u == '°C' or u == '%' or not u or u[:1] == '×') else ' '
    return t + sp + u


# ── calculator defaults, read from the markup (everything before PROTOCOL_DATA) ──
def calc_defaults(s, upto):
    html = s[:upto]
    out = {}
    for m in re.finditer(r'<(input|select)\b[^>]*?\bid="([^"]+)"', html):
        tag, id_ = m.group(1), m.group(2)
        start = m.start()
        if tag == 'input':
            end = html.index('>', m.end())
            vm = re.search(r'\bvalue="([^"]*)"', html[start:end + 1])
            out[id_] = vm.group(1) if vm else ''
        else:
            end = html.index('</select>', start)
            opts = re.findall(r'<option\b([^>]*)>', html[start:end])
            pick = None
            for o in opts:
                if re.search(r'\bselected\b', o):
                    pick = o; break
            if pick is None and opts: pick = opts[0]
            vm = re.search(r'\bvalue="([^"]*)"', pick or '')
            out[id_] = vm.group(1) if vm else ''
    return out

TOKEN = re.compile(r'\{(p\.[A-Za-z0-9_]+(?:\.max)?|[A-Za-z][A-Za-z0-9-]*)\}')

def all_params(proto):
    out = []
    for blk in [{'body': proto.get('preamble', [])}] + proto.get('stages', []):
        for b in blk['body']:
            if b['t'] == 'steps':
                for it in b['items']:
                    for k, v in (it.get('params') or {}).items():
                        out.append((it['id'], k, v))
    return out

def link_params(D, defaults):
    """Recompute every param that names a calculator expression. Returns the list of (pid, key, old, new)."""
    changed = []
    for pid, proto in D.items():
        plist = all_params(proto)
        byKey = {}
        for sid, k, v in plist: byKey.setdefault(k, v)
        busy = set()
        def val(v, which, key):
            expr = v.get('calc' if which == 'value' else 'calcMax')
            if expr is None:
                return float(v['value'] if which == 'value' else v['max'])
            tag = (id(v), which)
            if tag in busy: raise SystemExit('%s.%s: the calc refers to itself' % (pid, key))
            busy.add(tag)
            def sub(m):
                t = m.group(1)
                if t.startswith('p.'):
                    parts = t.split('.')
                    q = byKey.get(parts[1])
                    if q is None: raise SystemExit('%s.%s: no parameter %s in this protocol' % (pid, key, parts[1]))
                    return repr(val(q, 'max' if len(parts) > 2 else 'value', parts[1]))
                if t not in defaults: raise SystemExit('%s.%s: no calculator box #%s' % (pid, key, t))
                try: return repr(float(defaults[t]))
                except ValueError: raise SystemExit('%s.%s: box #%s has no numeric default (%r)' % (pid, key, t, defaults[t]))
            e = TOKEN.sub(sub, expr)
            if not re.fullmatch(r'[0-9eE+\-*/(). ]+', e): raise SystemExit('%s.%s: bad expression %r' % (pid, key, expr))
            r = eval(e)
            busy.discard(tag)
            if 'round' in v: r = half_up(r, v['round'])
            return float(r)
        for sid, k, v in plist:
            if 'calc' not in v: continue
            for which, fld in (('value', 'value'), ('max', 'max')):
                if which == 'max' and 'calcMax' not in v: continue
                new = val(v, which, k)
                if v.get(fld) != new:
                    changed.append((pid, sid + '.' + k, v.get(fld), new))
                    v[fld] = new
    return changed


def apply_pub(D):
    n_pub = n_nopub = 0
    for pid, sents in PUB.items():
        st = D[pid]['stages']
        assert len(st) == len(sents), '%s: %d stages, %d sentences' % (pid, len(st), len(sents))
        for i, txt in enumerate(sents):
            if txt:
                pool = {}
                for b in st[i]['body']:
                    if b['t'] == 'steps':
                        for it in b['items']:
                            for k, v in (it.get('params') or {}).items(): pool.setdefault(k, v)
                def sub(m):
                    if m.group(1) not in pool: raise SystemExit('%s stage %d: the sentence uses {{%s}}, which no step of the stage defines' % (pid, i, m.group(1)))
                    return ptext(pool[m.group(1)], True)
                st[i]['pub'] = re.sub(r'\{\{(\w+)\}\}', sub, txt); n_pub += 1
                st[i].pop('noPub', None)
            else:
                st[i]['noPub'] = True; n_nopub += 1
    for pid in NOPUB:
        for stg in D[pid]['stages']:
            stg['noPub'] = True; n_nopub += 1
    return n_pub, n_nopub


def main():
    check = '--check' in sys.argv
    s = open(SRC, encoding='utf-8').read()
    a, b = extract(s)
    D = json.loads(s[a:b])
    defaults = calc_defaults(s, a)
    changed = link_params(D, defaults)
    n_pub, n_nopub = apply_pub(D)
    out = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    if check:
        if out != s[a:b]:
            print('protocol data is out of step with the calculators or the Methods sentences in tools/protocol_pub.py')
            for c in changed[:12]: print('  %s.%s: %s -> %s' % c)
            if not changed: print('  (a Methods sentence differs: run python3 tools/protocol_pub.py and look at the diff)')
            print('fix: python3 tools/protocol_pub.py   (then review the diff and add it to the commit)')
            sys.exit(1)
        print('protocol data is in step: %d Methods sentences, %d mirrored parameters' % (n_pub, sum(1 for _, _, v in sum((all_params(p) for p in D.values()), []) if 'calc' in v)))
        return
    open(SRC, 'w', encoding='utf-8').write(s[:a] + out + s[b:])
    for c in changed: print('  set %s.%s: %s -> %s' % c)
    total = sum(len(v['stages']) for v in D.values())
    print('stages with a Methods sentence: %d' % n_pub)
    print('stages marked reference-only:   %d' % n_nopub)
    print('still on protocol prose:        %d of %d' % (total - n_pub - n_nopub, total))


if __name__ == '__main__':
    main()
