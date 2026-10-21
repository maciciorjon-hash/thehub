// Archive — the calculators, the protocol data, the keyboard and the phone. The numbers a bench scientist pipettes from.
//
//   AR1  independent recompute   every calculator is re-derived here from first principles (C1V1, pmol of dsDNA, parts, overage, serial
//                                dilution…) with inputs that are NOT the defaults, and compared with what the Output tab says
//   AR2  volumes add up          a PCR with a template concentration is 50 uL, a Gibson/ligation/digest tube is its stated volume, a master
//                                mix says so when it does not fit; no total is a rounded version of its own parts
//   AR3  typing is not clamped   typing 250 into a box whose min is 20 gives 250 (the floor is applied on commit, not on the first digit)
//   AR4  the format counts       CellTiter-Glo's plate format reaches the reagent volume (384-well is not given 100 uL a well)
//   AR5  the cap is said         a digest/ligation whose stock is too dilute for the tube says how much really went in and warns
//   AR6  hostile values          0 / negative / 1e999 / text / 10^7 in every number box: no NaN, Infinity, undefined or negative volume,
//                                and no box freezes the tab (SPR points, wells)
//   AR7  data                    every protocol renders with no leftover {{token}}; DCAF15's UniProt id is Q66K64; single-cycle kinetics is
//                                the slow-off-rate one
//   AR8  the bridge              ARCHIVE_COMPUTE (what Labbook drives) returns the recipe for every calculator and puts Archive's inputs back
//   AR9  keyboard and names      a protocol card opens with Enter, every input has an accessible name, tabs have roles, Escape closes the
//                                ask dialog and gives focus back, a focused button has a visible ring
//   AR10 the phone               375x812, light and dark: no sideways scroll, the number column of every result table is on screen,
//                                every button is 44px
//   AR12 one standard            docs/UI.md: buttons and fields 32px with --r-1, headings in sentence case, tabs ←/→, every dialog Escape/trap/focus-return, µ in the text a person reads
//   AR11 offline                 the installable build, after one visit, reloads with the network gone and still lists 34 protocols
//
//   node tools/archive_audit_invariants.mjs [--only=AR3] [--url=http://127.0.0.1:8807]      exit 1 on any finding
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };

let base = arg('url', '');
let server = null;
if (!base) {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/__host.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<iframe id="a" src="/apps/archive/archive.html" style="width:1200px;height:800px"></iframe>'); return; }
    const f = path.join(ROOT, u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
}
const PAGE = base + '/apps/archive/archive.html';
const browser = await chromium.launch();
async function open(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, opts));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(PAGE); await p.waitForTimeout(500);
  p.errs = errs; return p;
}
const guard = async (inv, what, fn) => { try { await fn(); } catch (e) { bad(inv, what + ' threw: ' + String(e.message || e).split('\n')[0]); } };

// ── helpers that run inside the page ──
const SET = (vals) => { for (const [id, v] of Object.entries(vals)) { const el = document.getElementById(id); if (!el) throw new Error('no #' + id); el.value = v; el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); } };
async function stepsOf(p, pid, vals, pre) {
  return await p.evaluate(([pid, vals, pre, setSrc]) => {
    const set = eval('(' + setSrc + ')');
    if (pre) eval(pre);
    set(vals);
    const pr = PROTOCOLS.find(x => x.id === pid);
    return pr.genSteps().map(s => s.label + '\n' + s.bullets.join('\n')).join('\n').replace(/<[^>]+>/g, '');
  }, [pid, vals, pre || '', SET.toString()]);
}
// expect: text matches re, first capture is a number within tol of want
function expectNum(inv, label, text, re, want, tol) {
  const m = text.match(re);
  if (!m) { bad(inv, `${label}: no "${re}" in the recipe`); return; }
  const got = parseFloat(m[1].replace(/,/g, ''));
  if (!(Math.abs(got - want) <= tol)) bad(inv, `${label}: the recipe says ${got}, the arithmetic gives ${want}`); else ok();
}

// ═════════ AR1 — independent recompute ═════════
if (run('AR1') || run('AR2')) await guard('AR1', 'recompute', async () => {
  const p = await open();
  const C = (label, text, re, want, tol = 0.011) => expectNum('AR1', label, text, re, want, tol);
  let t;
  // Gibson — dsDNA is 0.65 ng per pmol per bp
  t = await stepsOf(p, 'gibson', { 'gb-vsz': 5000, 'gb-vc': 40, 'gb-ratio': 3, 'gb-vol': 10, 'gb-vng': 35 }, 'gibFrags[0]={sz:1200,c:25};renderGibFrags();');
  const vecPmol = 35 / (0.65 * 5000), insNg = vecPmol * 3 * 0.65 * 1200;
  C('gibson vector uL', t, /Vector \(5000 bp, 40 ng\/µL\): ([\d.]+) µL/, 35 / 40, 0.0006);
  C('gibson insert uL', t, /Insert 1 \(1200 bp, 25 ng\/µL\): ([\d.]+) µL/, insNg / 25, 0.006);
  C('gibson water', t, /H₂O: ([\d.]+) µL\n/, 5 - 35 / 40 - insNg / 25, 0.006);
  // PCR: 25 mix + 2.5 + 2.5 primers + template + water = 50 (AR2 too)
  t = await stepsOf(p, 'gibson', { 'pcr-vec-conc': 100, 'pcr-vec-prod': 4600, 'pcr-vec-fwtm': 59, 'pcr-vec-rvtm': 61, 'pcr-pol': 'q5' });
  C('pcr template uL', t, /Vector template: ([\d.]+) µL/, 0.1, 0.006);
  C('pcr water uL (50 - 30 - template)', t, /H₂O: ([\d.]+) µL\n/, 19.9, 0.011);
  C('pcr extension (4.6 kb x 25 s/kb = 115 s = 1m 55s)', t, /72°C (\d+)m/, 1, 0);
  C('pcr anneal (lower Tm + 2)', t, /→ (\d+)°C 30s/, 61, 0);
  // restriction digest and ligation
  t = await stepsOf(p, 'redigest', { 're-dna-conc': 200, 're-dna-ug': 2, 're-rxn-vol': 50, 're-enz1-name': 'BamHI', 're-enz1-stock': 20, 'lig-vsz': 4000, 'lig-vc': 25, 'lig-isz': 600, 'lig-ic': 10, 'lig-ratio': 3, 'lig-vol': 20 });
  C('digest DNA uL (2 ug / 200 ng/uL)', t, /DNA \(200 ng\/µL\): ([\d.]+) µL/, 10, 0.001);
  C('digest enzyme uL (20 U / 20 U/uL)', t, /BamHI \(20 U\/µL\): ([\d.]+) µL/, 1, 0.001);
  C('digest water', t, /H₂O: ([\d.]+) µL \(add first\)/, 50 - 10 - 1 - 5, 0.001);
  const lp = 50 / (4000 * 0.65), li = lp * 3 * 600 * 0.65;
  C('ligation vector uL', t, /Vector \(4000 bp\): ([\d.]+) µL/, 2, 0.001);
  C('ligation insert uL', t, /Insert \(600 bp\): ([\d.]+) µL/, li / 10, 0.006);
  C('ligation water', t, /H₂O: ([\d.]+) µL \(add first\)\n10× T4/, 20 - 2 - li / 10 - 2 - 1, 0.06);
  // batch buffers: per sample x n x overage
  t = await stepsOf(p, 'miniprep', { 'mp-n': 12, 'mp-elution': 50, 'mp-excess': 1.2 });
  C('miniprep resuspension mL', t, /Resuspension Solution: ([\d.]+) mL/, 0.25 * 12 * 1.2, 0.006);
  C('miniprep neutralisation mL', t, /Neutralization Solution: ([\d.]+) mL/, 0.35 * 12 * 1.2, 0.006);
  C('miniprep wash mL (2 x 500 uL)', t, /Wash Solution: ([\d.]+) mL/, 1.0 * 12 * 1.2, 0.006);
  t = await stepsOf(p, 'nucleospin', { 'ns-gelmg': 350, 'ns-ratio': 200 });
  C('NTI uL (200 per 100 mg)', t, /NTI Buffer: (\d+) µL/, 700, 0.5);
  // IP: ug = protein(mg) x ratio; uL = ug / (stock/1000)
  t = await stepsOf(p, 'ip', { 'ip-protein': 250, 'ip-stock': 400, 'ip-target-ratio': 8, 'ip-ctrl-ratio': 2, 'ip-n': 3, 'ip-excess': 1.2 });
  C('IP target IgG uL', t, /Target IgG: ([\d.]+) µL/, 0.25 * 8 / 0.4, 0.006);
  C('IP control IgG uL', t, /Control IgG: ([\d.]+) µL/, 0.25 * 2 / 0.4, 0.006);
  C('IP beads uL', t, /Protein G\/A beads: ([\d.]+) µL/, 25 * 3 * 1.2, 0.06);
  C('IP post-wash mL (1 mL x 5 x n)', t, /Post-capture wash buffer: ([\d.]+) mL/, 5 * 3 * 1.2, 0.006);
  t = await stepsOf(p, 'scs', { 'scs-plates': 3, 'scs-vol': 100, 'scs-excess': 1.2 });
  C('SCS total mL', t, /Total: ([\d.]+) mL/, 96 * 3 * 100 * 1.2 / 1000, 0.06);
  C('SCS conditioned mL (40%)', t, /Conditioned media: ([\d.]+) mL/, 96 * 3 * 100 * 1.2 * 0.4 / 1000, 0.06);
  t = await stepsOf(p, 'westernblot', { 'wb-format': 75, 'wb-n': 10, 'wb-pi': 100, 'wb-benz': 1000, 'wb-excess': 1.2, 'wb-ab-vol': 12, 'wb-ab-n': 2, 'wb-ab-pri': 2000, 'wb-ab-sec': 4000 });
  C('WB RIPA uL', t, /RIPA buffer: ([\d.]+) µL/, 900 - 9 - 0.9, 0.6);
  C('WB protease inhibitor uL', t, /Protease Inhibitor: ([\d.]+) µL/, 9, 0.006);
  C('WB primary uL per membrane (12 mL / 2000)', t, /Primary \(1:2000\): ([\d.]+) µL/, 6, 0.006);
  C('WB secondary total uL (2 membranes)', t, /Secondary \(1:4000\): [\d.]+ µL antibody in 12 mL diluent → ([\d.]+) µL/, 6, 0.006);
  t = await stepsOf(p, 'hibit', { 'hb-vol': 20, 'hb-buffer': 10, 'hb-lgbit': 200, 'hb-substrate': 500 });
  C('HiBiT blot water uL', t, /Water: (\d+) µL/, 20000 - 2000 - 100 - 40, 0.5);
  C('HiBiT blot LgBiT uL', t, /LgBiT: ([\d.]+) µL/, 100, 0.006);
  t = await stepsOf(p, 'lenti', { 'ln-system': 'lenti', 'ln-dishes': 2, 'ln-excess': 1.2, 'ln-wells': 4, 'ln-mediavol': 2, 'ln-target': 10, 'ln-stock': 20 });
  C('lenti vector ug', t, /([\d.]+) µg lentiviral transfer plasmid/, 6 * 2 * 1.2, 0.006);
  C('lenti PEI uL', t, /([\d.]+) µL PEI/, 24 * 2 * 1.2, 0.006);
  C('polybrene per well (10 ug/mL x 2 mL / 20 mg/mL)', t, /Polybrene per well: ([\d.]+) µL/, 1, 0.006);
  C('polybrene total', t, /Total for 4 wells: ([\d.]+) µL/, 4 * 1 * 1.2, 0.006);
  // TR-FRET / FP: C1V1 = C2V2 on the mix volume (FP in 2x because it is halved by the compound)
  t = await stepsOf(p, 'trfret', { 'trf-wells': 100, 'trf-vol': 10, 'trf-excess': 1.2, 'trf-a-stock': 1000, 'trf-a-final': 25, 'trf-b-stock': 500, 'trf-b-final': 2.5, 'trf-sa-stock': 100, 'trf-sa-final': 0.25 });
  C('TR-FRET protein A uL', t, /Alexa647-Protein A: ([\d.]+) µL/, 25 * 1200 / 1000, 0.006);
  C('TR-FRET streptavidin uL', t, /LANCE Streptavidin: ([\d.]+) µL/, 0.25 * 1200 / 100, 0.006);
  C('TR-FRET buffer uL (the rest)', t, /Assay buffer: ([\d.]+) µL/, 1200 - 30 - 6 - 3, 0.006);
  t = await stepsOf(p, 'fp', { 'fp-wells': 50, 'fp-vol': 10, 'fp-excess': 1.2, 'fp-tracer-stock': 10000, 'fp-tracer-final': 8, 'fp-protein-stock': 50000, 'fp-protein-final': 150 });
  C('FP tracer uL (2x)', t, /Tracer \(2× final\): ([\d.]+) µL/, 8 * 2 * 600 / 10000, 0.006);
  C('FP protein uL (2x)', t, /Protein \(2× final\): ([\d.]+) µL/, 150 * 2 * 600 / 50000, 0.006);
  t = await stepsOf(p, 'spr', { 'spr-top': 500, 'spr-factor': 2, 'spr-points': 4, 'spr-dmso-min': 0.5, 'spr-dmso-max': 3, 'spr-dmso-points': 6 });
  C('SPR point 4 (500 / 2^3)', t, /Point 4: ([\d.]+) nM/, 62.5, 0.06);
  C('DMSO point 3 (linear 0.5..3 in 6)', t, /Point 3: ([\d.]+)%/, 1.5, 0.006);
  // PX458: pmol/uL = ng/uL x 1000 / (bp x 660); oligo uL = pmol / uM
  t = await stepsOf(p, 'crispr-ko', { 'ko-px458-vec-size': 9266, 'ko-px458-vec-conc': 12.5, 'ko-px458-vec-pmol': 0.005, 'ko-px458-oligo-conc': 1, 'ko-px458-ratio': 200, 'ko-bbsi-dna-conc': 250, 'ko-bbsi-dna-ug': 1 }, "_methodState['crispr-ko']='px458';");
  const vecUl = 0.005 / (12.5 * 1000 / (9266 * 660));
  C('PX458 vector uL', t, /([\d.]+) µL linearised PX458/, vecUl, 0.006);
  C('PX458 oligo uL', t, /([\d.]+) µL ssOligo working stock/, 1, 0.006);
  C('PX458 water uL', t, /([\d.]+) µL Nuclease-free H₂O/, 20 - 10 - vecUl - 1, 0.006);
  C('BbsI DNA uL (1 ug / 250 ng/uL)', t, /PX458 DNA \(250 ng\/µL\): ([\d.]+) µL/, 4, 0.001);
  C('BbsI water (20 - 2 - 1 - 4)', t, /Nuclease-free water: ([\d.]+) µL/, 13, 0.001);
  t = await stepsOf(p, 'bca', { 'bca-gel': '20', 'bca-nsamples': 6, 'bca-conc': 2, 'bca-lysvol': 30, 'bca-lds': '4', 'bca-rdt': '10', 'bca-target': '' });
  const tot = 30 / (1 - 0.25 - 0.1);
  C('BCA total per sample uL', t, /Total per sample: ([\d.]+) µL/, tot, 0.06);
  C('BCA LDS per sample uL', t, /4× LDS per sample: ([\d.]+) µL/, tot / 4, 0.06);
  C('BCA protein in mix (ug/uL)', t, /in final mix: ([\d.]+) µg\/µL/, 2 * 30 / tot, 0.0006);
  C('BCA max load (ug) = conc in mix x 20 uL', t, /Target per lane: ([\d.]+) µg/, 2 * 30 / tot * 20, 0.06);
  t = await stepsOf(p, 'hibitlytic', { 'hbl-format': '96', 'hbl-plates': 2, 'hbl-cellvol': 25, 'hbl-ratio': 1, 'hbl-lgbit': 100, 'hbl-substrate': 50, 'hbl-excess': 1.2 });
  C('HiBiT lytic total uL (192 wells x 25 x 1.2)', t, /Total: ([\d.]+) µL/, 5760, 0.5);
  C('HiBiT lytic LgBiT uL (1:100)', t, /LgBiT \(1:100\): ([\d.]+) µL/, 57.6, 0.06);
  t = await stepsOf(p, 'ctg2', { 'ctg-format': '25', 'ctg-cellvol': '', 'ctg-plates': 2, 'ctg-wells': 100, 'ctg-excess': 1.1 });
  C('CTG reagent per well follows the format (384 = 25 uL)', t, /Reagent per well: (\d+) µL/, 25, 0);
  C('CTG total mL', t, /Total reagent needed: ([\d.]+) mL/, 5.5, 0.006);
  t = await stepsOf(p, 'transfection', { 'tf-reagent': 'fugene', 'tf-format': '6', 'tf-nwells': 4, 'tf-dna': 2, 'tf-ratio': 3, 'tf-overage': 'x' }, "document.getElementById('tf-reagent').value='fugene';tfReagentChanged();document.getElementById('tf-overage').checked=true;");
  C('forward FuGENE uL (2 ug x 3 x 4 x 1.1)', t, /Add (\d+) µL FUGENE HD/, 26.4, 0.6);
  C('forward Opti-MEM uL (125 x 4.4)', t, /to (\d+) µL Opti-MEM/, 550, 0.6);
  t = await stepsOf(p, 'revtx', { 'rtx-format': '12', 'rtx-nwells': 10, 'rtx-extra': 1 });
  C('reverse Opti-MEM uL (100 x 11)', t, /add (\d+) µL Opti-MEM/, 1100, 0.6);
  C('reverse DNA ug (800 ng x 11)', t, /Add ([\d.]+) µg plasmid DNA/, 8.8, 0.06);
  C('reverse FuGENE uL (2.4 x 11)', t, /Add ([\d.]+) µL FuGENE HD/, 26.4, 0.06);
  t = await stepsOf(p, 'trex', { 'tx-wells': 3, 'tx-cpw': 0.8, 'tx-mediavol': 2, 'tx-count': 2, 'tx-excess': 1.1, 'tx-txwells': 3, 'tx-dna': 4, 'tx-ratio': 9, 'tx-pog44': 500, 'tx-pcdna5': '200', 'tx-hstock': 50, 'tx-htarget': 150, 'tx-hvol': 50 });
  C('T-REx suspension per well uL (0.8 M / 2 M/mL)', t, /Seed ([\d,.]+) µL of a/, 400, 0.6);
  C('T-REx pOG44 uL (3.6 ug / 500 ng/uL)', t, /pOG44 3.6 µg = ([\d.]+) µL/, 7.2, 0.06);
  C('T-REx FuGENE uL (4 ug x 3)', t, /Add ([\d.]+) µL FuGENE HD directly/, 12, 0.06);
  C('T-REx hygromycin uL (150 ug/mL x 50 mL / 50 mg/mL)', t, /Selection medium: ([\d.]+) µL of/, 150, 0.6);
  t = await stepsOf(p, 'transfo', { 'tr-n': 5, 'tr-dna': 2, 'tr-cells': 30, 'tr-soc': 400, 'tr-col': 2, 'tr-lb': 4, 'tr-abx': 500 });
  C('transformation cells uL', t, /Thaw ([\d,]+) µL competent cells/, 150, 0.5);
  C('transformation antibiotic per culture uL (4 mL / 500x = 8)', t, /([\d.]+) µL antibiotic \(500×\)/, 8, 0.06);
  t = await stepsOf(p, 'grna', { 'gr-n': 3, 'gr-stock': 100, 'gr-vol': 20, 'gr-dil': 200 });
  C('gRNA water in a 20 uL reaction (20 - 2 - 2 - 2 - 1)', t, /([\d.]+) µL H₂O/, 13, 0.006);
  t = await stepsOf(p, 'seeding', { 'sd-format': '96', 'sd-plates': 2, 'sd-cpw': 5000, 'sd-vpw': 50, 'sd-excess': 1.1 });
  C('seeding suspension mL (50 uL x 192 x 1.1)', t, /Prepare ([\d.]+) mL of cell suspension/, 10.56, 0.006);
  C('seeding density M/mL (5000 cells / 50 uL)', t, /at ([\d.]+) M\/mL/, 0.1, 0.0006);
  t = await stepsOf(p, 'strap', { 'try-prot': 200, 'try-ratio': 20, 'try-stock': 0.5 });
  C('trypsin ug', t, /Trypsin needed: ([\d.]+) µg/, 10, 0.006);
  C('trypsin uL', t, /Volume to add: ([\d.]+) µL/, 20, 0.006);
  t = await stepsOf(p, 'miseq', { 'ms-rxns': 10, 'ms-ov': 1.2, 'ms-tm': 60 });
  C('MiSeq mix uL (50 x 12)', t, /Total: 50 µL\/rxn → ([\d.]+) µL total/, 600, 0.5);
  C('MiSeq anneal (Tm - 5)', t, /→ (\d+)°C 10s/, 55, 0);
  if (p.errs.length) bad('AR1', 'console errors: ' + p.errs.slice(0, 3).join(' | '));
  await p.context().close();
});

// ═════════ AR2 — volumes add up ═════════
if (run('AR2')) await guard('AR2', 'sums', async () => {
  const p = await open();
  // a number printed as a total must be its own parts: 3 x 96 x 20 x 1.2 = 27648, not 27600
  const f = await p.evaluate(() => [fmt(27648, 3), fmt(26.4, 3), fmt(0.012345, 3), fmt(1234.5, 3), fmt(-27648, 3)]);
  if (f.join() !== '27648,26.4,0.0123,1235,-27648') bad('AR2', 'fmt() drops integer digits: ' + f.join());
  else ok();
  const t = await stepsOf(p, 'hibitlytic', { 'hbl-format': '384', 'hbl-plates': 3, 'hbl-cellvol': 20, 'hbl-excess': 1.2 });
  const tot = +(t.match(/Total: (\d+) µL/) || [])[1], parts = ['Lytic Buffer: (\\d+)', 'LgBiT \\(1:100\\): (\\d+)', 'Substrate \\(1:50\\): (\\d+)'].map(r => +(t.match(new RegExp(r)) || [])[1]);
  if (tot !== 27648 || Math.abs(parts.reduce((a, b) => a + b, 0) - tot) > 2) bad('AR2', `the HiBiT total ${tot} is not the sum of its parts ${parts.join('+')}`); else ok();
  // components that do not fit are said, not printed as a negative
  const w = await p.evaluate(() => { document.getElementById('hb-buffer').value = 1; document.getElementById('hb-buffer').dispatchEvent(new Event('input', { bubbles: true })); return document.getElementById('hb-result').textContent; });
  if (/-\d+ µL/.test(w) || !/does not fit/.test(w)) bad('AR2', 'HiBiT blot with a 1:1 buffer should say it does not fit, not print a negative water: ' + w.slice(0, 120)); else ok();
  // no concentration, no water: the amount is unknown, so the volume is not a number that overfills the tube
  const d = await stepsOf(p, 'redigest', { 're-dna-conc': '' });
  if (/H₂O: [\d.]+ µL/.test(d.split('Step 2')[0])) bad('AR2', 'a digest with no DNA concentration prints a water volume that will overfill the tube'); else ok();
  const tr = await stepsOf(p, 'trfret', { 'trf-a-stock': '', 'trf-b-stock': '', 'trf-sa-stock': '' });
  if (/Assay buffer: [\d.]+ µL/.test(tr)) bad('AR2', 'TR-FRET with no stock concentrations prints the whole mix as buffer'); else ok();
  const bb = await stepsOf(p, 'crispr-ko', { 'ko-bbsi-dna-conc': 250, 'ko-bbsi-dna-ug': 1 }, "_methodState['crispr-ko']='px458';");
  if (/\(20 − CutSmart/.test(bb)) bad('AR2', 'the BbsI digest export carries the formula text instead of the volume'); else ok();
  await p.context().close();
});

// ═════════ AR3 — typing ═════════
if (run('AR3')) await guard('AR3', 'typing', async () => {
  const p = await open();
  for (const [pid, id, typed, want] of [['trex', 'tx-opti', '250', '250'], ['miniprep', 'mp-elution', '80', '80'], ['grna', 'gr-vol', '12', '12'], ['westernblot', 'wb-ab-vol', '0.5', '0.5']]) {
    await p.evaluate(pid => { openProtocol(pid); }, pid);
    await p.evaluate(([pid]) => showDTab(pid, 'calc'), [pid]);
    const el = p.locator('#' + id); await el.click(); await el.fill(''); await p.keyboard.type(typed, { delay: 20 });
    const v = await el.inputValue();
    if (v !== want) bad('AR3', `typing ${typed} into #${id} (min below it on the first digit) left ${v}`); else ok();
    await p.evaluate(() => closeProtocol());
  }
  // a value under the floor is raised when the box is left, and the result follows
  await p.evaluate(() => { openProtocol('miniprep'); showDTab('miniprep', 'calc'); });
  const el = p.locator('#mp-elution'); await el.click(); await el.fill(''); await p.keyboard.type('3'); await p.keyboard.press('Tab');
  const after = await el.inputValue(), txt = await p.locator('#mp-result').innerText();
  if (after !== '10' || !/Elution Buffer\s+80 µL/.test(txt)) bad('AR3', `leaving #mp-elution at 3 should raise it to the floor (10) and recompute; got ${after} / ${txt.replace(/\s+/g, ' ').slice(-80)}`); else ok();
  // a negative is refused at once
  await el.click(); await el.fill(''); await p.keyboard.type('-5');
  const neg = await el.inputValue(); if (+neg < 0) bad('AR3', 'a negative stayed in the box'); else ok();
  await p.context().close();
});

// ═════════ AR4 / AR5 ═════════
if (run('AR4')) await guard('AR4', 'ctg format', async () => {
  const p = await open();
  const a = await stepsOf(p, 'ctg2', { 'ctg-format': '100', 'ctg-cellvol': '', 'ctg-plates': 1, 'ctg-wells': 10, 'ctg-excess': 1 });
  const b = await stepsOf(p, 'ctg2', { 'ctg-format': '25' });
  const ua = +(a.match(/Reagent per well: (\d+)/) || [])[1], ub = +(b.match(/Reagent per well: (\d+)/) || [])[1];
  if (ua !== 100 || ub !== 25) bad('AR4', `96-well gives ${ua} uL/well and 384-well ${ub} uL/well (should be 100 and 25)`); else ok();
  const c = await stepsOf(p, 'ctg2', { 'ctg-cellvol': 40 });
  if (!/Reagent per well: 40 µL/.test(c)) bad('AR4', 'a typed cell volume must win over the format'); else ok();
  await p.context().close();
});
if (run('AR5')) await guard('AR5', 'caps', async () => {
  const p = await open();
  const t = await stepsOf(p, 'redigest', { 're-dna-conc': 20, 're-dna-ug': 1, 're-rxn-vol': 50 });
  if (!/wanted 1 µg/.test(t)) bad('AR5', '1 ug of a 20 ng/uL stock does not fit in 50 uL (cap 40%): the recipe must say how much DNA is really in'); else ok();
  const ui = await p.evaluate(() => { openProtocol('redigest'); showDTab('redigest', 'calc'); return document.getElementById('re-digest-result').textContent; });
  if (!/too dilute/.test(ui)) bad('AR5', 'the digest calculator does not warn about a too-dilute stock'); else ok();
  const l = await stepsOf(p, 'redigest', { 'lig-vc': 2 });
  if (!/too dilute|capped/.test(l)) bad('AR5', 'a 2 ng/uL vector cannot give 50 ng in 20 uL; the ligation recipe does not say so'); else ok();
  await p.context().close();
});

// ═════════ AR6 — hostile values ═════════
if (run('AR6')) await guard('AR6', 'hostile', async () => {
  const p = await open();
  const ids = await p.evaluate(() => [...document.querySelectorAll('.dpane[data-tab="calc"] input[type=number]')].map(i => i.id).filter(Boolean));
  const HOSTILE = ['0', '-5', '1e999', '1e12', 'abc', '', '9999999', '3.7'];
  const probe = ([id, vals]) => {
    const inp = document.getElementById(id), orig = inp.value, out = [];
    const badRe = /NaN|Infinity|undefined|\[object|(?<![e\d.])-\d+(\.\d+)? ?(uL|µL|mL|ug|µg)\b/;
    for (const h of vals) {
      inp.value = h; let err = null;
      try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { err = String(e); }
      const pid = inp.closest('.detail-wrap').dataset.pid;
      let exp = ''; try { exp = PROTOCOLS.find(x => x.id === pid).genSteps().map(x => x.label + ' ' + x.bullets.join(' ')).join(' '); } catch (e) { err = (err || '') + ' gen:' + e; }
      const m = (inp.closest('.dpane').textContent + ' ' + exp).match(badRe);
      if (err || m) out.push(`${pid}/${id}=${JSON.stringify(h)}: ${err || m[0]}`);
    }
    inp.value = orig; inp.dispatchEvent(new Event('input', { bubbles: true }));
    return out;
  };
  let pg = p;
  for (const id of ids) {
    let r;
    try { r = await Promise.race([pg.evaluate(eval('(' + probe.toString() + ')'), [id, HOSTILE]), new Promise((_, j) => setTimeout(() => j(new Error('HANG')), 8000))]); }
    catch (e) { bad('AR6', `#${id} froze the tab with a hostile value`); await pg.context().close(); pg = await open(); continue; }
    r.forEach(x => bad('AR6', x));
  }
  if (!findings.some(f => f.startsWith('✗ AR6'))) ok();
  await pg.context().close();
});

// ═════════ AR7 — data ═════════
if (run('AR7')) await guard('AR7', 'data', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const out = { leftovers: [], text: '' };
    Object.keys(PROTOCOL_DATA).forEach(pid => { const h = renderProtocolPane(pid); if (/\{\{|undefined|\[object|NaN/.test(h)) out.leftovers.push(pid); out.text += h; });
    out.n = Object.keys(PROTOCOL_DATA).length; out.cards = PROTOCOLS.length;
    return out;
  });
  if (r.leftovers.length) bad('AR7', 'protocols that render a leftover token, undefined or NaN: ' + r.leftovers.join(', ')); else ok();
  if (r.n !== 34 || r.cards !== 34) bad('AR7', `34 protocols expected, data ${r.n} / cards ${r.cards}`); else ok();
  if (/Q9NWF9/.test(r.text) || !/DCAF15[^<]{0,12}Q66K64/.test(r.text.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"'))) bad('AR7', 'the AlphaFold example must pair DCAF15 with Q66K64 (Q9NWF9 is RNF216)'); else ok();
  const txt = r.text.replace(/<[^>]+>/g, '');
  if (/multi-cycle kinetics \(MCK\) for high-affinity/i.test(txt) || !/single-cycle kinetics \(SCK\) for high-affinity/i.test(txt)) bad('AR7', 'SPR: single-cycle is for slow off-rates (no regeneration), multi-cycle for fast ones — the text had them the wrong way round'); else ok();
  await p.context().close();
});

// ═════════ AR8 — the bridge Labbook drives ═════════
if (run('AR8')) await guard('AR8', 'bridge', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  const host = await ctx.newPage();
  const errs = []; host.on('pageerror', e => errs.push(e.message));
  await host.goto(base + '/__host.html'); await host.waitForTimeout(1500);
  const r = await host.evaluate(() => {
    const out = { bad: [], n: 0 };
    const idx = window.ARCHIVE_INDEX || [];
    if (idx.length !== 34) out.bad.push('ARCHIVE_INDEX has ' + idx.length);
    const fr = document.getElementById('a').contentDocument;
    idx.filter(p => p.hasCalc).forEach(p => {
      const sch = window.ARCHIVE_CALC_SCHEMA(p.id); if (!sch) { out.bad.push(p.id + ': no schema'); return; }
      const ids = []; sch.forEach(b => b.groups.forEach(g => g.fields.forEach(f => ids.push(f.id))));
      ids.forEach(id => { if (!fr.getElementById(id)) out.bad.push(p.id + ': schema names missing #' + id); });
      const before = ids.map(id => fr.getElementById(id).value);
      const map = {}; ids.forEach(id => { const f = fr.getElementById(id); if (f.type === 'number' && f.value !== '') map[id] = String(+f.value + 1); });
      const res = window.ARCHIVE_COMPUTE(p.id, map);
      if (!res || !res.steps || !res.steps.length) out.bad.push(p.id + ': ARCHIVE_COMPUTE returned no steps');
      const after = ids.map(id => fr.getElementById(id).value);
      if (before.join('|') !== after.join('|')) out.bad.push(p.id + ': ARCHIVE_COMPUTE did not put Archive\'s inputs back');
      out.n++;
    });
    return out;
  });
  if (r.bad.length) r.bad.slice(0, 8).forEach(x => bad('AR8', x)); else ok();
  if (r.n < 20) bad('AR8', 'only ' + r.n + ' calculators were driven');
  if (errs.length) bad('AR8', 'page errors: ' + errs.slice(0, 2).join(' | '));
  await ctx.close();
});

// ═════════ AR9 — keyboard and names ═════════
if (run('AR9')) await guard('AR9', 'keyboard', async () => {
  const p = await open();
  await p.locator('.proto-card').first().focus(); await p.keyboard.press('Enter');
  const o = await p.evaluate(() => _openProtocolId); if (!o) bad('AR9', 'Enter on a focused protocol card does not open it'); else ok();
  await p.evaluate(() => closeProtocol());
  const un = await p.evaluate(() => {
    const named = el => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest('label');
    return [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e => !named(e)).map(e => e.id || e.type);
  });
  if (un.length) bad('AR9', un.length + ' inputs have no accessible name: ' + un.slice(0, 5).join(', ')); else ok();
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.dtabs')].every(t => t.getAttribute('role') === 'tablist' && [...t.children].filter(b => b.classList.contains('dtab-btn')).every(b => b.getAttribute('role') === 'tab' && b.hasAttribute('aria-selected'))));
  if (!tabs) bad('AR9', 'the Protocol / Calculate / Output tabs have no tab roles'); else ok();
  // the ask dialog: named, Escape closes it, focus goes back
  await p.evaluate(() => { openProtocol('gibson'); }); await p.locator('#detail-gibson .back-btn').focus();
  await p.evaluate(() => arcAsk('Delete it?', 'Sure?', { ok: 'Delete' }, () => {})); await p.waitForTimeout(80);
  const nm = await p.evaluate(() => document.querySelector('#arc-ask [role=dialog]').getAttribute('aria-labelledby'));
  if (nm !== 'arc-ask-title') bad('AR9', 'the ask dialog has no accessible name'); else ok();
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  const st = await p.evaluate(() => [document.getElementById('arc-ask').classList.contains('open'), document.activeElement.className]);
  if (st[0]) bad('AR9', 'Escape does not close the ask dialog'); else if (!/back-btn/.test(st[1])) bad('AR9', 'closing the ask dialog does not give focus back (' + st[1] + ')'); else ok();
  // a visible ring on keyboard focus
  await p.evaluate(() => closeProtocol()); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const ring = await p.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e); return [e.tagName + '.' + e.className, c.outlineStyle, parseFloat(c.outlineWidth)]; });
  if (ring[1] === 'none' || !(ring[2] >= 2)) bad('AR9', 'keyboard focus on ' + ring[0] + ' has no visible ring'); else ok();
  const toast = await p.evaluate(() => { showToast('hi'); const t = document.getElementById('pt-toast'); return t && t.getAttribute('role'); });
  if (toast !== 'status') bad('AR9', 'the toast is not a status region'); else ok();
  await p.context().close();
});

// ═════════ AR10 — the phone ═════════
if (run('AR10')) await guard('AR10', 'phone', async () => {
  for (const theme of ['light', 'dark']) {
    const p = await open({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    const pids = await p.evaluate(() => PROTOCOLS.filter(x => x.hasCalc).map(x => x.id));
    const found = new Set();
    for (const pid of pids) {
      await p.evaluate(pid => { openProtocol(pid); showDTab(pid, 'calc'); }, pid); await p.waitForTimeout(60);
      const r = await p.evaluate(() => {
        const out = [], vw = innerWidth;
        if (document.documentElement.scrollWidth > vw + 1) out.push('page scrolls sideways');
        const wrap = document.querySelector('.detail-wrap.active');
        wrap.querySelectorAll('.dpane.active table').forEach(t => {
          t.querySelectorAll('th').forEach(th => { if (/^(volume|amount|per well|value|concentration|per sample)/i.test(th.textContent.trim()) && th.getBoundingClientRect().right > vw) out.push('table column "' + th.textContent.trim() + '" is off screen'); });
        });
        document.querySelectorAll('button,.btn').forEach(b => { if (!b.offsetParent || b.closest('.notes-menu')) return; const r = b.getBoundingClientRect(); if (r.height && r.height < 43.5) out.push('button "' + (b.textContent.trim().slice(0, 18) || b.id || b.className) + '" is ' + Math.round(r.height) + 'px'); });
        return out;
      });
      r.forEach(x => { const k = x.replace(/\d+px/, 'Npx'); if (!found.has(pid + k)) { found.add(pid + k); bad('AR10', `${theme} ${pid}: ${x}`); } });
      await p.evaluate(() => closeProtocol());
    }
    await p.evaluate(() => { showDTab; });
    const home = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (home[0] > home[1] + 1) bad('AR10', theme + ' home scrolls sideways'); else ok();
    await p.context().close();
  }
});

// ═════════ AR12 — one standard (docs/UI.md) ═════════
if (run('AR12')) await guard('AR12', 'standard', async () => {
  const p = await open();
  await p.evaluate(() => { openProtocol('trex'); showDTab('trex', 'calc'); });
  const r = await p.evaluate(() => {
    const out = [], px = v => parseFloat(v);
    const seen = {};
    document.querySelectorAll('.detail-wrap.active .btn, #detail-trex .btn').forEach(b => { if (!b.offsetParent) return; const c = getComputedStyle(b); if (px(c.height) !== 32 || c.borderRadius !== '4px') seen['button ' + c.height + ' r' + c.borderRadius] = 1; });
    document.querySelectorAll('.detail-wrap.active input[type=text],.detail-wrap.active input[type=number],.detail-wrap.active select').forEach(b => { if (!b.offsetParent) return; const c = getComputedStyle(b); if (px(c.height) < 32 || px(c.height) > 33 || c.borderRadius !== '4px' || px(c.borderTopWidth) !== 1) seen['field ' + c.height + ' r' + c.borderRadius + ' b' + c.borderTopWidth] = 1; });
    document.querySelectorAll('.calc-box-title,.proto-section,.delivery-bar-label').forEach(h => { if (getComputedStyle(h).textTransform !== 'none') seen['heading is ' + getComputedStyle(h).textTransform + ': ' + h.className] = 1; });
    out.push(...Object.keys(seen));
    // µ: the text a person reads
    const txt = [...document.querySelectorAll('.detail-wrap.active .dpane')].map(x => x.textContent).join(' ') + ' ' + PROTOCOLS.map(x => x.genSteps ? x.genSteps().map(s => s.label + s.bullets.join(' ')).join(' ') : '').join(' ');
    const m = txt.replace(/<[^>]+>/g, '').match(/\b\d*\.?\d*\s?(uL|ug|uM)\b/); if (m) out.push('ASCII unit in text: ' + m[0]);
    // tabs: right arrow moves and opens
    const tab = document.querySelector('#detail-trex .dtab-btn.active'); tab.focus();
    return out;
  });
  // an uppercase style turns µ (U+00B5) into Greek capital Mu: "per sample (µL)" would read "(ML)", millilitres
  for (const pid of ['gibson', 'bca', 'trex', 'grna', 'transfo']) {
    await p.evaluate(pid => { openProtocol(pid); showDTab(pid, 'calc'); }, pid);
    const up = await p.evaluate(() => [...document.querySelectorAll('.detail-wrap.active .dpane.active *')].filter(e => e.children.length === 0 && /µ/.test(e.textContent) && getComputedStyle(e).textTransform === 'uppercase').map(e => e.tagName + '.' + e.className + ': ' + e.textContent.trim().slice(0, 40)));
    up.slice(0, 3).forEach(u => r.push('uppercase turns the micro sign into M — ' + u));
  }
  r.forEach(x => bad('AR12', x)); if (!r.length) ok();
  await p.evaluate(() => { openProtocol('trex'); showDTab('trex', 'calc'); });
  await p.locator('#detail-trex .dtab-btn.active').focus(); await p.keyboard.press('ArrowRight');
  const t2 = await p.evaluate(() => [document.activeElement.textContent.trim(), document.activeElement.getAttribute('aria-selected'), document.querySelectorAll('#detail-trex .dtab-btn[tabindex="0"]').length]);
  if (t2[0] !== 'Output' || t2[1] !== 'true' || t2[2] !== 1) bad('AR12', 'ArrowRight on a tab should move to the next tab, open it and leave one tab stop: ' + t2.join('/')); else ok();
  // the CSV import and the freezer picker behave like every dialog: named, Escape closes, Tab stays in, focus returns
  await p.evaluate(() => closeProtocol()); await p.evaluate(() => setLibKind('primers'));
  await p.locator('#lib-view button', { hasText: 'Import CSV' }).first().focus().catch(() => {});
  const opener = await p.evaluate(() => { const b = [...document.querySelectorAll('#lib-view button')].find(x => /Import CSV/.test(x.textContent)); if (b) b.focus(); return !!b; });
  await p.evaluate(() => { window._libImport = { kind: 'primers', add: [{ line: 2, rec: { name: 'P1', seq: 'ATGCGT' } }], dupe: [], conflict: [] }; libImportShow(); }); await p.waitForTimeout(80);
  const d = await p.evaluate(() => { const b = document.querySelector('#libimp-back .libimp-box'); return [b && b.getAttribute('role'), b && b.getAttribute('aria-modal'), !!(b && b.getAttribute('aria-labelledby')), document.activeElement.closest('#libimp-back') ? 'in' : 'out']; });
  if (d.join() !== 'dialog,true,true,in') bad('AR12', 'the CSV import dialog is not a named modal with focus inside: ' + d.join()); else ok();
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  if (!(await p.evaluate(() => !!document.activeElement.closest('#libimp-back')))) bad('AR12', 'Tab leaves the CSV import dialog'); else ok();
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  const gone = await p.evaluate(() => [!document.getElementById('libimp-back'), document.activeElement.textContent.trim().slice(0, 10)]);
  if (!gone[0]) bad('AR12', 'Escape does not close the CSV import dialog'); else if (opener && !/Import/.test(gone[1])) bad('AR12', 'focus does not return to Import CSV (' + gone[1] + ')'); else ok();
  // touch: a box is 40px
  const tp = await open({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await tp.evaluate(() => { openProtocol('trex'); showDTab('trex', 'calc'); });
  const small = await tp.evaluate(() => [...document.querySelectorAll('#detail-trex input[type=number],#detail-trex select')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 39.5).length);
  if (small) bad('AR12', small + ' fields are under 40px on touch'); else ok();
  await tp.context().close(); await p.context().close();
});

// ═════════ AR11 — offline ═════════
if (run('AR11')) await guard('AR11', 'offline', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-pwa-'));
  const b = spawnSync('python3', ['embed.py', '--profile=archive', tmp], { cwd: ROOT, encoding: 'utf8' });
  if (b.status !== 0 || !fs.existsSync(path.join(tmp, 'index.html'))) { bad('AR11', 'the archive profile did not build: ' + (b.stderr || '').split('\n')[0]); return; }
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  const s = http.createServer((req, res) => { const f = path.join(tmp, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html')); if (!f.startsWith(tmp) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
  await new Promise(r => s.listen(0, '127.0.0.1', r));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); const pg = await ctx.newPage();
  await pg.goto(`http://127.0.0.1:${s.address().port}/index.html`); await pg.waitForTimeout(500);
  await pg.evaluate(() => navigator.serviceWorker.ready); await pg.waitForTimeout(1500);
  await ctx.setOffline(true); await pg.reload(); await pg.waitForTimeout(800);
  const n = await pg.evaluate(() => document.querySelectorAll('.proto-card').length);
  if (n !== 34) bad('AR11', 'offline, the installed build shows ' + n + ' protocols instead of 34'); else ok();
  await pg.evaluate(() => { openProtocol('gibson'); showDTab('gibson', 'calc'); }); await pg.waitForTimeout(200);
  const calc = await pg.evaluate(() => document.getElementById('gb-result').textContent.length); if (calc < 40) bad('AR11', 'a calculator is empty offline'); else ok();
  await ctx.close(); s.close();
});

await browser.close(); if (server) server.close();
console.log(findings.length ? findings.join('\n') + `\n\n${findings.length} finding(s), ${passed} checks passed` : `archive audit invariants: ${passed} checks passed, 0 findings`);
process.exit(findings.length ? 1 : 0);
