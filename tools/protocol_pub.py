# -*- coding: utf-8 -*-
"""Add the past-tense Methods sentence to Archive protocol stages.

A stage is one dated block in a Labbook experiment, so the sentence describes that block.
`noPub` marks a stage that is reference material — a guide to reading a PAE plot is not a step
anybody performed, and it must not turn into a Methods paragraph.
"""
import re, json, sys

SRC = 'apps/archive/archive.html'

PUB = {
 'gibson': [
   '',   # Overview — background, publishes nothing
   'Primers were designed with 15–30 bp overlaps between adjacent fragments, with the 3′ binding region at a Tm of ~60 °C.',
   'Vector backbone and insert were amplified separately with a high-fidelity polymerase, digested with DpnI to remove template plasmid, resolved on an agarose gel and purified.',
   'Fragments were assembled with NEBuilder HiFi 2× master mix in a 20 µL reaction at 50 °C for 60 min, using ~0.06 pmol of vector and a two-fold molar excess of insert.',
 ],
 'transfo': [
   '',   # thawing cells and pre-warming plates
   'Plasmid DNA (1–5 µL) was mixed with 25–50 µL of competent E. coli, incubated on ice for 2 min, heat-shocked at 42 °C for 30 s, returned to ice for 2 min, recovered in 450 µL of LB/SOC and shaken at 37 °C for 1 h.',
   'Cells were plated on LB agar containing the appropriate antibiotic and grown overnight at 37 °C.',
   'Single colonies were picked into 5 mL of LB with antibiotic and grown overnight at 37 °C.',
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
   'Plasmid DNA was diluted in Opti-MEM, transfection reagent added directly to the diluted DNA at the stated ratio, complexes left 10–15 min at room temperature and added dropwise to the cells, which were then incubated for 24–48 h.',
 ],
 'revtx': [
   '',   # the per-well conditions table
   'Cells were freshly trypsinized and resuspended in complete growth medium.',
   'Transfection complexes were formed by adding plasmid DNA to Opti-MEM followed by FuGENE HD, left 5–15 min at room temperature and dispensed into the wells, and the cells overlaid on top immediately.',
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

def main():
    s = open(SRC, encoding='utf-8').read()
    a, b = extract(s)
    D = json.loads(s[a:b])
    n_pub = n_nopub = 0
    for pid, sents in PUB.items():
        st = D[pid]['stages']
        assert len(st) == len(sents), '%s: %d stages, %d sentences' % (pid, len(st), len(sents))
        for i, txt in enumerate(sents):
            if txt:
                st[i]['pub'] = txt; n_pub += 1
            else:
                st[i]['noPub'] = True; n_nopub += 1
    for pid in NOPUB:
        for stg in D[pid]['stages']:
            stg['noPub'] = True; n_nopub += 1
    out = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    open(SRC, 'w', encoding='utf-8').write(s[:a] + out + s[b:])
    total = sum(len(v['stages']) for v in D.values())
    print('stages with a Methods sentence: %d' % n_pub)
    print('stages marked reference-only:   %d' % n_nopub)
    print('still on protocol prose:        %d of %d' % (total - n_pub - n_nopub, total))

if __name__ == '__main__':
    main()
