// Hit Finder's example screen, with structures that need no chemistry toolkit: the sweeps run offline, so RDKit never loads and the
// Chemistry tab would only ever show its "unavailable" state. This fills the structure cache by hand (deterministic fingerprints in five
// families, plausible properties, a few alerts) so the map, the groups, the cliffs and the drawer are all drawn and measured. Nothing here is
// chemistry; it is layout fuel. Structures themselves show their "no drawing" placeholder, which is the layout of an offline Hub.
export const HF_SEED = [
  'loadHitFinderTestData()',
  `(async () => {
    await new Promise(r => setTimeout(r, 1500));            // let the offline RDKit attempt fail first, so it cannot overwrite what follows
    const C = HF.chem; C.cache.clear(); hfChemIndex(); let n = 0;
    C.by.forEach(e => {
      if (!e.smiles) return; n++;
      const fam = n % 5, bits = new Uint32Array(64), put = b => { b = b % 2048; bits[b >> 5] |= (1 << (b & 31)) >>> 0; };
      for (let k = 0; k < 40; k++) put(fam * 300 + k * 5);                       // what a family shares
      for (let k = 0; k < 8; k++) put(fam * 300 + 1000 + ((n * 7 + k * 13) % 90)); // what each compound adds
      C.cache.set(e.smiles, { ok: true, d: { mw: 720 + (n * 17) % 380, clogp: 2.5 + (n % 6) * 0.7, tpsa: 150 + (n * 7) % 100, hbd: 2 + n % 5, hba: 9 + n % 6, rotb: 9 + (n * 3) % 14, arom: 3 + n % 2, fsp3: 0.25 + (n % 4) * 0.05, mr: 190 + n % 40, heavy: 52 + n % 12 },
        fp: bits, pop: 48, frag: e.smiles, nfrag: n === 14 ? 2 : 1, alerts: n % 6 === 0 ? ['michael'] : [], e3: n % 2 ? 'crbn' : 'vhl' });
    });
    C.status = 'ready'; C.ver++; hfChemChanged(true);
  })()`
];
