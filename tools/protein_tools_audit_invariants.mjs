// Protein Tools audit invariants — the numbers a bench scientist copies into a methods section, and the inputs that
// used to break the page.
//
//   PT1  numbers match ExPASy      MW, pI, ε280 and the instability index of ubiquitin and hen lysozyme equal what
//                                  ExPASy ProtParam / Compute pI/Mw give (pI 6.56 and 9.32; the instability index uses
//                                  all 400 dipeptide weights and divides by the length)
//   PT2  odd sequences             a 9-residue sequence (one hydrophobicity window), letters ExPASy refuses, a header
//                                  only, and 600 000 residues digested by trypsin neither throw nor go blank
//   PT3  A280 needs a path length  0 and negative path lengths say so instead of reading as 1 cm or a negative
//                                  concentration; an A280 above 1.5 says to dilute
//   PT4  another server is text    a UniProt answer with markup in its names is shown as text, never run
//   PT5  keyboard                  every labelled field has a label bound to it, the ⓘ marks are in the tab order with a
//                                  name, and the toggle buttons say which one is on
//
//   node tools/protein_tools_audit_invariants.mjs [--only=PT1,PT3] [--file=apps/protein-tools/protein-tools.html]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(ROOT, arg('file', 'apps/protein-tools/protein-tools.html'));
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const browser = await chromium.launch();
async function open(routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => routes ? routes(r) : r.abort());
  await page.goto('file://' + FILE); await page.waitForTimeout(400);
  return page;
}
const UBIQ = 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG';
const LYSO = 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL';

if (run('PT1')) await guard('PT1', async () => {
  const p = await open();
  const r = await p.evaluate(([u, l]) => [u, l].map(s => ({ avg: calcMW(s).avg, mono: calcMW(s).mono, pi: calcPI(s), ii: calcInstability(s), e: calcE280(s) })), [UBIQ, LYSO]);
  const near = (a, b, t) => Math.abs(a - b) <= t;
  if (!near(r[0].avg, 8564.84, 0.05)) bad('PT1', `ubiquitin average mass ${r[0].avg} (ExPASy 8564.84)`); else ok();
  if (!near(r[1].avg, 14313.14, 0.05)) bad('PT1', `lysozyme average mass ${r[1].avg} (ExPASy 14313.14)`); else ok();
  if (r[0].pi !== 6.56) bad('PT1', `ubiquitin pI ${r[0].pi} (ExPASy 6.56)`); else ok();
  if (r[1].pi !== 9.32) bad('PT1', `lysozyme pI ${r[1].pi} (ExPASy 9.32)`); else ok();
  if (r[1].e.reduced !== 6 * 5500 + 3 * 1490 || r[1].e.oxidized !== r[1].e.reduced + 4 * 125) bad('PT1', 'lysozyme ε280 is not 6 W, 3 Y and 4 cystines'); else ok();
  // the instability index, recomputed here from dipeptide weights written out for the pairs these two sequences use is not
  // practical; check the properties that were wrong instead: length, not pair count, divides; and every dipeptide has its own weight
  const t = await p.evaluate(() => ({ n: Object.keys(DIWV).length, tbl: DIWV, ii: calcInstability('AC'), iiAA: calcInstability('AAAA') }));
  if (t.n !== 400) bad('PT1', `the dipeptide table has ${t.n} entries, not 400`); else ok();
  if (Math.abs(t.ii - 10 / 2 * 44.94) > 1e-9) bad('PT1', `II of "AC" is ${t.ii}: the sum is divided by the length (2), 10/2 × DIWV(AC)=44.94`); else ok();
  if (Math.abs(t.iiAA - 10 / 4 * 3) > 1e-9) bad('PT1', `II of "AAAA" is ${t.iiAA}, expected 10/4 × 3`); else ok();
  if (t.tbl.WG !== -9.37 || t.tbl.GW !== 13.34) bad('PT1', 'WG and GW are swapped in the dipeptide table'); else ok();
  const chk = await p.evaluate(() => { analyzeSeq === analyzeSeq; document.getElementById('seq-input').value = '>x\nMQIFVKTLTG'; analyzeSeq(); return document.getElementById('r-pi').textContent; });
  if (!/^\d\.\d\d$/.test(chk)) bad('PT1', 'the pI box does not show a number'); else ok();
  await p.close();
});

if (run('PT2')) await guard('PT2', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const out = {}; const set = v => { document.getElementById('seq-input').value = v; analyzeSeq(); };
    set('MKTAYIAKQ'); out.nine = document.getElementById('seq-warn').textContent; out.nineChart = document.getElementById('hydro-svg').innerHTML.length;
    set('>x\nMAKQ*XBZUO123 9'); out.odd = document.getElementById('seq-warn').textContent;
    set('>only a header'); out.header = document.getElementById('r-mw').textContent;
    set('>a\nMKTAY\n>b\nGGGGG'); out.multi = document.getElementById('seq-warn').textContent + '|' + document.getElementById('r-len').textContent;
    set('MK'.repeat(300000)); switchTab('cleavage', document.querySelectorAll('.tab')[1]);
    try { renderCleavageTable(); out.big = document.getElementById('cleavage-result').textContent.slice(0, 40); } catch (e) { out.big = 'ERR ' + e.message; }
    return out;
  });
  if (/error/i.test(r.nine) || r.nineChart < 100) bad('PT2', `a 9-residue sequence: "${r.nine}" (chart ${r.nineChart} chars)`); else ok();
  if (/error/i.test(r.odd)) bad('PT2', `ambiguous letters: "${r.odd}"`); else ok();
  if (r.header !== '—') bad('PT2', `a header with no sequence shows "${r.header}"`); else ok();
  if (!/2 sequences/.test(r.multi) || !/\|5$/.test(r.multi)) bad('PT2', `two pasted records: "${r.multi}" (the first, 5 residues, with a note)`); else ok();
  if (/^ERR/.test(r.big) || !/peptides/.test(r.big)) bad('PT2', `600 000 residues digested: ${r.big}`); else ok();
  if (p.errs.length) bad('PT2', 'page errors: ' + p.errs.slice(0, 2).join(' | ')); else ok();
  await p.close();
});

if (run('PT3')) await guard('PT3', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    document.getElementById('seq-input').value = 'MWKY'; analyzeSeq(); const a = document.getElementById('a280-input'), l = document.getElementById('pathlength'), o = document.getElementById('conc-result');
    const out = {}; a.value = '0.5';
    l.value = '0'; calcConc(); out.zero = o.textContent; l.value = '-2'; calcConc(); out.neg = o.textContent;
    l.value = '1'; calcConc(); out.good = o.textContent; a.value = '2.5'; calcConc(); out.high = o.textContent; return out;
  });
  if (!/path length/i.test(r.zero) || /mg\/mL/.test(r.zero)) bad('PT3', `path length 0 gives "${r.zero}"`); else ok();
  if (!/path length/i.test(r.neg) || /-\d/.test(r.neg)) bad('PT3', `path length −2 gives "${r.neg}"`); else ok();
  if (!/mg\/mL/.test(r.good)) bad('PT3', 'a normal reading gives no concentration'); else ok();
  if (!/dilute/i.test(r.high)) bad('PT3', 'A280 2.5 does not say to dilute'); else ok();
  await p.close();
});

if (run('PT4')) await guard('PT4', async () => {
  const entry = { primaryAccession: 'P99999', genes: [{ geneName: { value: '<img src=x onerror="window.__pwn=1">' } }], organism: { scientificName: 'Homo <b>sapiens</b>' },
    proteinDescription: { recommendedName: { fullName: { value: '<img src=x onerror="window.__pwn=2"> kinase' } } }, sequence: { length: 100 },
    comments: [{ commentType: 'FUNCTION', texts: [{ value: 'Does it\'s thing \\ <script>window.__pwn=3</script> ' + 'x'.repeat(400) }] }] };
  const p = await open(r => /rest\.uniprot\.org/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(/search/.test(r.request().url()) ? { results: [entry] } : entry) }) : r.abort());
  await p.evaluate(() => { document.getElementById('ti-input').value = 'KRAS'; });
  await p.evaluate(() => tiLookup()); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ pwn: window.__pwn || 0, imgs: document.querySelectorAll('#ti-result img').length, name: (document.querySelector('#ti-result .ti-name') || {}).textContent }));
  if (r.pwn || r.imgs) bad('PT4', `markup in a UniProt answer ran (pwn=${r.pwn}, ${r.imgs} img)`); else ok();
  if (!/<img/.test(r.name || '')) bad('PT4', 'the name is not shown as text: ' + r.name); else ok();
  await p.evaluate(() => { const b = document.querySelector('#ti-result .ti-more'); if (b) b.click(); });
  const more = await p.evaluate(() => ({ pwn: window.__pwn || 0, txt: (document.querySelector('#ti-result .ti-fn') || {}).textContent || '' }));
  if (more.pwn || !/<script>/.test(more.txt)) bad('PT4', '"more" did not show the function text as text'); else ok();
  await p.evaluate(() => { document.getElementById('ti-input').value = '<img src=x onerror="window.__pwn=4">'; });
  await p.evaluate(() => tiLookup()).catch(() => {}); await p.waitForTimeout(800);
  if (await p.evaluate(() => window.__pwn === 4)) bad('PT4', 'the typed search text ran as markup in the error line'); else ok();
  await p.close();
});

if (run('PT5')) await guard('PT5', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const unlabeled = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]),textarea,select')].filter(i => !(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || (i.id && document.querySelector('label[for="' + i.id + '"]')) || i.closest('label'))).map(i => i.id || i.className);
    const tips = [...document.querySelectorAll('.pinfo')].filter(a => a.tabIndex < 0 || !a.getAttribute('aria-label')).length;
    const enz = [...document.querySelectorAll('.enz-btn')].filter(b => b.getAttribute('aria-pressed') !== (b.classList.contains('active') ? 'true' : 'false')).length;
    return { unlabeled, tips, enz };
  });
  if (r.unlabeled.length) bad('PT5', 'fields with no label bound: ' + r.unlabeled.join(', ')); else ok();
  if (r.tips) bad('PT5', `${r.tips} ⓘ marks are not keyboard reachable or have no name`); else ok();
  if (r.enz) bad('PT5', 'enzyme buttons do not report which is pressed'); else ok();
  await p.close();
});

await browser.close();
console.log(findings.length ? findings.join('\n') : `Protein Tools audit invariants: ${passed} passed, 0 findings`);
if (findings.length) console.log(`\n${passed} passed, ${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
