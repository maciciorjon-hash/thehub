// Helix audit invariants — a primer's Tm, a reverse complement and an ORF are copied straight into an order form or a
// methods section, so each is recomputed here by a second, independent implementation.
//
//   HX1  what was pasted is read    GenBank (ORIGIN … //), old-Mac line endings, numbers and spaces give the sequence;
//                                   two records say so and use the first; a protein sent to a DNA tool is refused
//   HX2  reverse complement, frames IUPAC codes are complemented (R<->Y, K<->M, B<->V, D<->H); all six frames and both
//                                   codon tables translate as the genetic code says, through the stops
//   HX3  ORFs                       start/end/frame and length in amino acids (the stop codon not counted) equal a
//                                   second finder on random sequence in both strands; an ORF with no stop says open
//   HX4  Tm                         SantaLucia 1998 with initiation, symmetry and salt: Biopython's documented 60.32 °C,
//                                   six primers against a second implementation, more Na⁺ gives a higher Tm, an
//                                   ambiguous base gives no number
//   HX5  sequence analysis          GC is over the A/C/G/T/U bases; DNA and RNA masses are both 5′-OH
//   HX6  big input                  1.5 Mnt analysed: the sequence map stops at 20 000 nt and says so, the ORF table at 500 rows
//   HX7  restriction sites          a circular sequence finds a site across the join, a linear one does not
//   HX8  keyboard and names         labels are bound to their fields, codon cells are buttons with a name, ⓘ marks are
//                                   tab stops, Copy says "Copied"
//   HX9  colours that carry text    the A/C/G/T colours, the ORF map, the amino-acid classes, the pills and the result
//                                   rows reach 4.5:1 in light and dark
//
//   node tools/helix_audit_invariants.mjs [--only=HX3,HX4] [--file=apps/helix/helix.html]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/helix/helix.html'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const browser = await chromium.launch();
async function open(theme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(t => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); } catch (e) {} }, theme);
  await page.goto('file://' + FILE); await page.waitForTimeout(400);
  return page;
}
// ── second implementations (kept apart from the app's code on purpose) ─────────────────────
const IU = { A: 'T', C: 'G', G: 'C', T: 'A', U: 'A', R: 'Y', Y: 'R', K: 'M', M: 'K', S: 'S', W: 'W', B: 'V', V: 'B', D: 'H', H: 'D', N: 'N' };
const rc = s => [...s].reverse().map(b => IU[b] || b).join('');
const B = 'TCAG', AAS = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
const CT = {}; { let k = 0; for (const a of B) for (const b of B) for (const c of B) CT[a + b + c] = AAS[k++]; }
const CT2 = { ...CT, TGA: 'W', ATA: 'M', AGA: '*', AGG: '*' };
const tr = (s, t) => { let o = ''; for (let i = 0; i + 2 < s.length; i += 3) o += t[s.slice(i, i + 3)] || 'X'; return o; };
function rnd(n, seed) { let x = seed, o = ''; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; o += 'ACGT'[(x >> 16) & 3]; } return o; }
function orfsRef(s) {
  const out = [];
  for (const [strand, t] of [[0, s], [1, rc(s)]]) for (let f = 0; f < 3; f++) for (let i = f; i + 2 < t.length;) {
    if (t.slice(i, i + 3) === 'ATG') {
      let j = i, st = false;
      while (j + 2 < t.length) { const c = t.slice(j, j + 3); if (c === 'TAA' || c === 'TAG' || c === 'TGA') { st = true; break; } j += 3; }
      const end = st ? j + 3 : j;
      out.push({ frame: (strand ? '-' : '+') + (f + 1), start: strand ? s.length - end + 1 : i + 1, end: strand ? s.length - i : end, aa: (j - i) / 3, open: !st });
      i = j + 3;
    } else i += 3;
  }
  return out.sort((a, b) => a.start - b.start || a.frame.localeCompare(b.frame));
}
const NNREF = { AA: [-7.9, -22.2], AT: [-7.2, -20.4], TA: [-7.2, -21.3], CA: [-8.5, -22.7], GT: [-8.4, -22.4], CT: [-7.8, -21.0], GA: [-8.2, -22.2], CG: [-10.6, -27.2], GC: [-9.8, -24.4], GG: [-8.0, -19.9] };
const nnKey = p => { const q = rc(p); return NNREF[p] ? p : NNREF[q] ? q : null; };
function tmRef(seq, naMM, ctNM) {
  let H = 0, S = 0; for (let i = 0; i < seq.length - 1; i++) { const k = nnKey(seq.slice(i, i + 2)); H += NNREF[k][0]; S += NNREF[k][1]; }
  for (const b of [seq[0], seq.at(-1)]) { if ('GC'.includes(b)) { H += 0.1; S -= 2.8; } else { H += 2.3; S += 4.1; } }
  const self = seq === rc(seq); if (self) S -= 1.4;
  S += 0.368 * (seq.length - 1) * Math.log(naMM / 1000);
  return H * 1000 / (S + 1.987 * Math.log(ctNM * 1e-9 / (self ? 1 : 4))) - 273.15;
}

if (run('HX1')) await guard('HX1', async () => {
  const p = await open();
  const r = await p.evaluate(() => ({
    gb: parseFASTA('LOCUS       X  10 bp\nORIGIN\n        1 atgcatgcat\n//'), cr: parseFASTA('>h\ratgc\ratgc'), crlf: parseFASTA('>h\r\natgc\r\natgc'),
    num: parseFASTA('1 atg cat 10'), semi: parseFASTA('; comment\nATGC'), two: parseFASTA('>a\nATGC\n>b\nGGGG'), stop: parseFASTA('MKT*', true, true),
  }));
  if (r.gb !== 'ATGCATGCAT') bad('HX1', `a GenBank record reads as "${r.gb}"`); else ok();
  if (r.cr !== 'ATGCATGC' || r.crlf !== 'ATGCATGC') bad('HX1', `line endings: "${r.cr}" / "${r.crlf}"`); else ok();
  if (r.num !== 'ATGCAT' || r.semi !== 'ATGC') bad('HX1', `numbers / comments: "${r.num}" / "${r.semi}"`); else ok();
  if (r.two !== 'ATGC') bad('HX1', `two records read as "${r.two}", the first is ATGC`); else ok();
  if (r.stop !== 'MKT*') bad('HX1', 'reverse translation drops the * of a protein'); else ok();
  const t = await p.evaluate(() => { document.getElementById('tools-seq').value = 'MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQ'; runSeqTools(); const el = document.getElementById('helix-toast'); return { toast: el ? el.textContent : '', visible: document.getElementById('tools-results').classList.contains('visible') }; });
  if (!/protein/i.test(t.toast) || t.visible) bad('HX1', 'a protein sent to Sequence Tools is analysed as DNA'); else ok();
  const m = await p.evaluate(() => { document.getElementById('tools-seq').value = '>one\nATGAAA\n>two\nCCCGGG'; runSeqTools(); const e = document.getElementById('helix-toast'); return e.textContent; });
  if (!/2 sequences/.test(m)) bad('HX1', 'two pasted records are not mentioned'); else ok();
  await p.close();
});

if (run('HX2')) await guard('HX2', async () => {
  const p = await open();
  const s = rnd(600, 7);
  const a = await p.evaluate(s => ({ plain: revComp(s, 'dna'), iupac: revComp('ACGRYKMSWBDHVN', 'dna'), comp: complement('RYKMBVDH', 'dna'), rna: revComp('ACGU', 'rna') }), s);
  if (a.plain !== rc(s)) bad('HX2', 'reverse complement of random DNA differs'); else ok();
  if (a.iupac !== rc('ACGRYKMSWBDHVN')) bad('HX2', `IUPAC reverse complement ${a.iupac}, expected ${rc('ACGRYKMSWBDHVN')}`); else ok();
  if (a.comp !== 'YRMKVBHD') bad('HX2', `IUPAC complement ${a.comp}`); else ok();
  for (const [tid, T] of [['1', CT], ['2', CT2]]) for (const f of ['+1', '+2', '+3', '-1', '-2', '-3']) {
    const got = await p.evaluate(([s, f, t]) => translate(s, f, t), [s, f, tid]);
    const ref = tr((f[0] === '+' ? s : rc(s)).slice(+f[1] - 1), T);
    if (got !== ref) bad('HX2', `frame ${f}, table ${tid}: translation differs`); else ok();
  }
  const th = await p.evaluate(() => { document.getElementById('tr-seq').value = 'ATGTAAGGGTGA'; document.getElementById('tr-frame').value = '+1'; runTranslate(); return [document.getElementById('tr-protein').textContent, document.getElementById('tr-stop-pill').textContent]; });
  if (th[0] !== 'M*G*' || !/2 stop/.test(th[1])) bad('HX2', `translation stops at the first stop: ${th.join(' | ')}`); else ok();
  await p.close();
});

if (run('HX3')) await guard('HX3', async () => {
  const p = await open();
  for (const seed of [3, 7, 11]) {
    const s = rnd(900, seed), min = 10;
    const got = await p.evaluate(([s, m]) => findORFs(s, m).map(o => ({ frame: o.frame, start: o.start, end: o.end, aa: o.length, open: o.partial })), [s, min]);
    const ref = orfsRef(s).filter(o => o.aa >= min);
    const key = o => `${o.frame}:${o.start}-${o.end}:${o.aa}:${o.open ? 'o' : 'c'}`;
    const A = got.map(key).sort().join('|'), R = ref.map(key).sort().join('|');
    if (A !== R) bad('HX3', `seed ${seed}: ${got.length} ORFs vs ${ref.length} in the second finder; first difference ${A.split('|').find(x => !R.split('|').includes(x)) || R.split('|').find(x => !A.split('|').includes(x))}`); else ok();
  }
  const e = await p.evaluate(() => findORFs('ATGAAATAA', 1).map(o => [o.length, o.partial]));
  if (JSON.stringify(e) !== '[[2,false]]') bad('HX3', `ATG AAA TAA is 2 aa with a stop, got ${JSON.stringify(e)}`); else ok();
  await p.close();
});

if (run('HX4')) await guard('HX4', async () => {
  const p = await open();
  const bio = await p.evaluate(() => tmNN('CGTTCCAAAGATGTGGGCATGAGCTTAC', 50, 50));
  if (Math.abs(bio - 60.32) > 0.01) bad('HX4', `Biopython's documented example is 60.32 °C, got ${bio.toFixed(2)}`); else ok();
  for (const sq of ['ATGCGTACGGATCCTTAAGG', 'GCGCGCGCGCGCGCGCGCGC', 'AAAAAAAAAAAAAAAAAAAA', 'ATGAAACCCGGGTTTAAA', 'GAATTCGAATTC', 'TTGACAATTAATCATCGGCTCG']) {
    const got = await p.evaluate(s => tmNN(s, 50, 250), sq);
    const want = tmRef(sq, 50, 250);
    if (Math.abs(got - want) > 0.01) bad('HX4', `${sq}: ${got.toFixed(2)} vs ${want.toFixed(2)}`); else ok();
  }
  const x = await p.evaluate(() => [tmNN('ATGCGTACGGATCCTTAAGG', 50, 250), tmNN('ATGCGTACGGATCCTTAAGG', 200, 250), tmNN('ATGCGTACGGATNCTTAAGG', 50, 250), tmNN('ATGCGTACGGAUCCTTAAGG', 50, 250)]);
  if (!(x[1] > x[0] + 3)) bad('HX4', 'more Na⁺ does not raise the Tm'); else ok();
  if (!Number.isNaN(x[2])) bad('HX4', 'an N gives a Tm'); else ok();
  const ui = await p.evaluate(() => { switchTab('primers', document.querySelectorAll('.tab')[3]); document.getElementById('pr-seq').value = 'ATGCGTACGGATCCTTAAGG'; calcPrimer(); const a = document.getElementById('pr-result').textContent; document.getElementById('pr-na').value = '150'; calcPrimer(); return [a, document.getElementById('pr-result').textContent]; });
  const tmOf = t => +(t.match(/Tm \(nearest-neighbour\)([\d.]+)/) || [])[1];
  if (!(tmOf(ui[0]) > 50 && tmOf(ui[0]) < 56)) bad('HX4', 'the primer card shows ' + tmOf(ui[0]) + ' °C for ATGCGTACGGATCCTTAAGG (≈53.6)'); else ok();
  if (!(tmOf(ui[1]) > tmOf(ui[0]))) bad('HX4', 'the Na⁺ box does not move the Tm'); else ok();
  await p.close();
});

if (run('HX5')) await guard('HX5', async () => {
  const p = await open();
  const r = await p.evaluate(() => { document.getElementById('tools-seq').value = 'GGGGCCCCNNNN'; runSeqTools(); const rows = [...document.querySelectorAll('#st-rows .result-row')].map(x => x.textContent); return { rows, dna: nucMW('ACGT', 'dna'), rna: nucMW('ACGU', 'rna') }; });
  const gc = r.rows.find(x => /^GC content/.test(x)) || '';
  if (!/100\.0 %/.test(gc)) bad('HX5', `GGGGCCCCNNNN GC is "${gc}" (100 % of the 8 A/C/G/T bases)`); else ok();
  const d = 313.21 + 304.19 + 329.21 + 289.18 - 61.96, u = 329.2 + 306.2 + 345.2 + 305.2 - 61.96;
  if (Math.abs(r.dna - d) > 0.01 || Math.abs(r.rna - u) > 0.01) bad('HX5', `5′-OH masses: DNA ${r.dna}, RNA ${r.rna}`); else ok();
  await p.close();
});

if (run('HX6')) await guard('HX6', async () => {
  const p = await open();
  const r = await p.evaluate(() => { const s = ((n, x) => { let o = ''; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; o += 'ACGT'[(x >> 16) & 3]; } return o; })(1500000, 3); document.getElementById('tools-seq').value = s; const t0 = performance.now(); runSeqTools(); return { ms: performance.now() - t0, spans: document.querySelectorAll('#orf-seq-disp span').length, rows: document.querySelectorAll('#orf-tbody tr').length, note: document.getElementById('orf-seq-disp').textContent.includes('first 20,000') }; });
  if (r.spans > 25000 || !r.note) bad('HX6', `${r.spans} spans in the map, note=${r.note}`); else ok();
  if (r.rows > 502) bad('HX6', `${r.rows} ORF rows`); else ok();
  if (r.ms > 6000) bad('HX6', `1.5 Mnt took ${Math.round(r.ms)} ms`); else ok();
  await p.close();
});

if (run('HX7')) await guard('HX7', async () => {
  const p = await open();
  const r = await p.evaluate(() => { switchTab('primers', document.querySelectorAll('.tab')[3]); const seq = 'TCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAT'; // GAATTC across the join: ...GAAT + TC...
    document.getElementById('re-seq').value = seq; document.getElementById('re-circ').checked = false; findRE(); const lin = document.getElementById('re-result').textContent;
    document.getElementById('re-circ').checked = true; findRE(); return { lin, circ: document.getElementById('re-result').textContent }; });
  if (/EcoRI\s*GAATTC\s*1/.test(r.lin)) bad('HX7', 'a linear sequence finds a site across its ends'); else ok();
  if (!/EcoRI\s*GAATTC\s*1\s*\d+/.test(r.circ)) bad('HX7', 'a circular sequence misses EcoRI across the join'); else ok();
  await p.close();
});

if (run('HX8')) await guard('HX8', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const unl = [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(i => !(i.getAttribute('aria-label') || (i.id && document.querySelector('label[for="' + i.id + '"]')) || i.closest('label'))).map(i => i.id);
    const cells = [...document.querySelectorAll('.codon-cell')]; const badCell = cells.filter(c => c.tagName !== 'BUTTON' || !c.getAttribute('aria-label')).length;
    const tips = [...document.querySelectorAll('.pinfo')].filter(a => a.tabIndex < 0 || !a.getAttribute('aria-label')).length;
    document.getElementById('tools-seq').value = 'ATGAAACCCGGG'; runSeqTools(); const cb = document.querySelector('#st-rows .copy-btn'); cb.click();
    return { unl, n: cells.length, badCell, tips, hasCopy: !!cb };
  });
  await p.waitForTimeout(300);
  const toast = await p.evaluate(() => document.getElementById('helix-toast').textContent);
  if (r.unl.length) bad('HX8', 'fields with no label: ' + r.unl.join(', ')); else ok();
  if (r.n !== 64 || r.badCell) bad('HX8', `${r.n} codon cells, ${r.badCell} not buttons or unnamed`); else ok();
  if (r.tips) bad('HX8', `${r.tips} ⓘ marks are not keyboard stops`); else ok();
  if (!/Copied|did not allow/.test(toast)) bad('HX8', `Copy gives no answer: "${toast}"`); else ok();

  const tb = await p.evaluate(() => { const tl = document.querySelector('.tabs'), tabs = [...tl.querySelectorAll('[role=tab]')], sel = () => tabs.filter(t => t.getAttribute('aria-selected') === 'true').length;
    const first = tabs.filter(t => t.tabIndex === 0).length; tabs[0].focus(); tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const moved = tabs[1].classList.contains('active') && document.activeElement === tabs[1];
    const toast = (typeof helixToast === 'function' ? (helixToast('x'), document.getElementById('helix-toast')) : (ptToast('x'), document.getElementById('pt-toast')));
    return { list: tl.getAttribute('role'), n: tabs.length, sel: sel(), first, moved, panels: tabs.filter(t => { const pn = document.getElementById(t.getAttribute('aria-controls')); return pn && pn.getAttribute('role') === 'tabpanel'; }).length, toast: toast.getAttribute('role') + '/' + toast.getAttribute('aria-live') }; });
  if (tb.list !== 'tablist' || tb.panels !== tb.n || tb.sel !== 1 || tb.first !== 1) bad('HX8', 'tabs are not a tablist with one selected tab and one tab stop: ' + JSON.stringify(tb)); else ok();
  if (!tb.moved) bad('HX8', 'the right arrow does not move to and select the next tab'); else ok();
  if (!/^status\//.test(tb.toast)) bad('HX8', 'the toast is not role=status'); else ok();
  await p.close();
});

const CONTRAST = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const over = (t, b) => [t[0] * t[3] + b[0] * (1 - t[3]), t[1] * t[3] + b[1] * (1 - t[3]), t[2] * t[3] + b[2] * (1 - t[3]), 1];
  const bgOf = el => { const st = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const b = rgba(getComputedStyle(e).backgroundColor); if (b[3] > 0) { st.push(b); if (b[3] >= 0.999) break; } } let cur = (st.length && st[st.length - 1][3] >= 0.999) ? st.pop() : [255, 255, 255, 1]; while (st.length) cur = over(st.pop(), cur); return cur; };
  const out = [];
  document.querySelectorAll('.nt-A,.nt-T,.nt-G,.nt-C,.aa-nonpolar,.aa-polar,.aa-acidic,.aa-basic,.aa-stop,.pill,.res-val,.res-lbl,#orf-seq-disp span[id],#hx-comp-counts span,.match-line,.codon-legend-item,#re-result td,#re-result div,#pr-result div,.stat-table td,.tab,.btn-sec,.copy-btn,label,.result-card-hdr,.seq-a,.seq-b').forEach(el => {
    if (!(el.textContent || '').trim() || el.children.length > 3) return; const r = el.getBoundingClientRect(); if (r.width < 1) return;
    const bg = bgOf(el), fg = over(rgba(getComputedStyle(el).color), bg), a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) out.push(`${(el.className || el.tagName)} "${el.textContent.trim().slice(0, 14)}" ${ratio.toFixed(2)}`);
  });
  return [...new Set(out)].slice(0, 8);
};
if (run('HX9')) await guard('HX9', async () => {
  for (const theme of ['light', 'dark']) {
    const p = await open(theme);
    await p.evaluate(() => { document.getElementById('tools-seq').value = '>x\nATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG' + 'ATGAAACCCGGGTTTTAAGCTAGCTAGCATGCATGCATGAAAAAAAA'; updateNtPreview(); runSeqTools(); });
    await p.evaluate(() => { switchTab('primers', document.querySelectorAll('.tab')[3]); document.getElementById('pr-seq').value = 'ATGCGTACGGATCCTTAAGG'; calcPrimer(); document.getElementById('re-seq').value = 'GAATTCAAAGGATCCAAAGAATTC'; findRE(); });
    await p.evaluate(() => { switchTab('seqtools', document.querySelectorAll('.tab')[1]); });
    let all = await p.evaluate(`(${CONTRAST.toString()})()`);
    await p.evaluate(() => { switchTab('primers', document.querySelectorAll('.tab')[3]); });
    all = all.concat(await p.evaluate(`(${CONTRAST.toString()})()`));
    await p.evaluate(() => { switchTab('genetic', document.querySelectorAll('.tab')[0]); selectCodon('ATG'); document.getElementById('tr-seq').value = 'ATGTAAGGG'; runTranslate(); });
    all = all.concat(await p.evaluate(`(${CONTRAST.toString()})()`));
    if (all.length) bad('HX9', `${theme}: ${[...new Set(all)].join('; ')}`); else ok();
    await p.close();
  }
});

await browser.close();
console.log(findings.length ? findings.join('\n') : `Helix audit invariants: ${passed} passed, 0 findings`);
if (findings.length) console.log(`\n${passed} passed, ${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
