// CalcKit invariants — the bench arithmetic behind the search box, checked as classes of bug.
//
//   CK1 known answers   Dilution, serial dilution, molarity, master mix and conversion give the numbers worked out by hand,
//                       to the unit the bench uses (0.5 µL, never 500 nL), and say what they assumed (the DMSO, the overage)
//   CK2 volumes add up  Over 300 random dilutions the stock and the diluent add to the final volume and their ratio is C2/C1
//   CK3 no guessing     A stock more dilute than the target, a unit that needs a molecular weight, a missing volume, three of
//                       three quantities, 30 points: each says what is missing and gives no pipetting
//   CK4 not a calculation  An experiment code, a cell line with a dose, an antibody dilution in milk, a tube size, a bare
//                       number: the search is left alone (null), so the box still finds the notebook
//   CK5 nothing breaks  4000 strings built from the grammar's own pieces: never throws, never prints NaN / undefined / Infinity,
//                       and a card always names its kind
//   CK6 text stays text A component named with markup is printed, in the card and nowhere else
//   CK7 Labbook's search  The first row is the card, Enter copies the answer as text, an ordinary query gets no card, the card fits
//                       a phone and a laptop in both themes (the serial table scrolls inside itself, the page does not)
//
//   node tools/calckit_invariants.mjs [--only=CK1,CK3] [--kit=tools/calckit/calckit.js] [--file=apps/labbook/labbook.html]      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const CK = createRequire(import.meta.url)(path.resolve(ROOT, arg('kit', 'tools/calckit/calckit.js')));
const FILE = arg('file', 'apps/labbook/labbook.html');
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = q => { const r = CK.answer(q); return r ? r.copy : null; };

if (run('CK1')) {
  const T = [
    ['10 mM to 50 uM in 1 mL', ['Take 5 µL stock + 995 µL diluent', '1:200', '0.5 % DMSO']],
    ['10 mM → 50 µM in 1 mL', ['Take 5 µL stock + 995 µL diluent']],
    ['10 mM to 5 uM in 1 mL', ['Take 0.5 µL stock', 'step 1: 2 µL stock + 18 µL diluent (1:10, 20 µL)', 'then take 5 µL of the last']],
    ['10 mM to 5 nM in 1 mL', ['2 intermediates', 'step 2: 2 µL of step 1 + 198 µL diluent', 'then take 5 µL of the last']],
    ['10 mM to 10 uM in 100 uL', ['Take 0.1 µL stock', '0.1 % DMSO']],
    ['1,000 uM to 5 uM in 1 mL', ['Take 5 µL stock + 995 µL diluent']],
    ['10 mM to 5 uM in 0,5 mL', ['Take 0.25 µL stock']],
    ['mw 55 kDa 1 mg 1 mL', ['1 mg in 1 mL is 18.2 µM']],
    ['1:1000 in 10 ml', ['Take 10 µL + 9.99 mL diluent', '1 part in 1000 total']],
    ['1:5000 in 20 mL', ['Take 4 µL + ']],
    ['10x to 1x in 500 ml', ['Take 50 mL stock + 450 mL diluent', '1×']],
    ['20 mM stock for 500 ul at 10 uM', ['Take 0.25 µL stock', '1:2000']],
    ['serial 1:3 x 8 from 10 uM, 100 uL', ['8 points', '3.33 µM\t33.3 µL\t66.7 µL', '4.57 nM\t33.3 µL\t66.7 µL', 'Each tube holds 100 µL once mixed']],
    ['serial 2-fold 12 points 100 nM', ['48.8 pM']],
    ['serial half-log 5 points from 100 uM', ['31.6 µM', '3.16 µM', '1 µM']],
    ['mw 450.5 10 mM 1 mL', ['Weigh 4.505 mg, dissolve to 1 mL for 10 mM', '10 µmol']],
    ['mw 450.5 5 mg 10 mM', ['Dissolve 5 mg in 1.11 mL for 10 mM']],
    ['mw 450.5 5 mg 1 mL', ['5 mg in 1 mL is 11.1 mM']],
    ['MW = 450.5 g/mol, 0.2 mM, 500 uL', ['Weigh 45.05 µg', 'Under 1 mg a balance is guessing']],
    ['1 mg/ml to mM mw 400', ['2.5 mM']],
    ['250 nM to pM', ['250,000 pM']],
    ['10 mm to um', ['10,000 µM']],
    ['5 mg to mmol mw 500', ['0.01 mmol']],
    ['37 C to F', ['98.6 °F']],
    ['mastermix 24 rx 10 + 2 + 0.5 ul 10%', ['330 µL of mix for 24 reactions', 'Total\t12.5 µL\t330 µL', 'Overage declared: 10 % extra, so 26.4 reactions']],
    ['mix 12 x 20 ul: 10 buffer + 2 primer + water', ['water\t8 µL\t106 µL', 'Total\t20 µL\t264 µL']],
  ];
  for (const [q, want] of T) {
    const t = text(q);
    if (t === null) { bad('CK1', `“${q}” was not read as a calculation`); continue; }
    const miss = want.filter(w => !t.includes(w));
    if (miss.length) bad('CK1', `“${q}” should say ${JSON.stringify(miss)}; it said:\n${t}`); else ok();
  }
  // The DMSO note is a warning only above 0.5 %, and the under-1-µL note always is one.
  const w = q => (CK.answer(q) || { notes: [] }).notes.filter(n => n.w).map(n => n.t);
  if (w('10 mM to 50 uM in 1 mL').length) bad('CK1', '0.5 % DMSO was flagged; the line is above it'); else ok();
  if (!w('10 mM to 100 uM in 1 mL').some(t => /DMSO/.test(t))) bad('CK1', '1 % DMSO was not flagged'); else ok();
  if (!w('10 mM to 5 uM in 1 mL').some(t => /pipette/.test(t))) bad('CK1', 'a 0.5 µL take was not flagged'); else ok();
}

if (run('CK2')) {
  let s = 12345; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const U = [['M', 1], ['mM', 1e-3], ['uM', 1e-6]], V = [['mL', 1e-3], ['uL', 1e-6], ['L', 1]];
  let n = 0, worst = 0;
  for (let i = 0; i < 300; i++) {
    const [cu, cf] = U[Math.floor(rnd() * 3)], [vu, vf] = V[Math.floor(rnd() * 3)];
    const c1 = Math.round((1 + rnd() * 99) * 10) / 10, k = 1 + Math.floor(rnd() * 2000), v = Math.round((1 + rnd() * 99) * 10) / 10;
    const c2 = Math.round(c1 / k * 1e6) / 1e6; if (!(c2 > 0) || c2 / 1000 < 1e-9) continue;
    const r = CK.answer(`${c1} ${cu} to ${c2} ${cu} in ${v} ${vu}`); if (!r) { bad('CK2', `unread: ${c1} ${cu} to ${c2} ${cu} in ${v} ${vu}`); continue; }
    const m = /^Take (.+) stock \+ (.+) diluent$/.exec(r.head); if (!m) continue;
    const rd = t => CK.tokens(t.replace(/µ/g, 'u'))[0], a = rd(m[1]), b = rd(m[2]); if (!a || !b) { bad('CK2', 'head not readable: ' + r.head); continue; }
    n++; const V2 = v * vf, sum = a.si + b.si, ratio = a.si / V2, want = c2 / c1;
    const e1 = Math.abs(sum - V2) / V2, e2 = Math.abs(ratio - want) / want; worst = Math.max(worst, e1, e2);
    if (e1 > 0.01 || e2 > 0.01) bad('CK2', `${c1} ${cu} to ${c2} ${cu} in ${v} ${vu}: “${r.head}” sums to ${sum} (want ${V2}), ratio ${ratio} (want ${want})`);
  }
  if (n < 150) bad('CK2', 'too few dilutions were checked: ' + n); else ok();
}

if (run('CK3')) {
  const no = (q, say, notSay = 'Take ') => { const t = text(q); if (t === null) return bad('CK3', `“${q}” was not answered at all`); if (!t.includes(say)) return bad('CK3', `“${q}” should say “${say}”:\n${t}`); if (t.includes(notSay)) return bad('CK3', `“${q}” gave pipetting it had no business giving:\n${t}`); ok(); };
  no('50 uM to 10 mM in 1 mL', 'Stock is more dilute than the target');
  no('10 mM to 10 mg/ml', 'Needs a molecular weight');
  no('5 mg to mmol', 'Needs a molecular weight');
  no('10 mM to 50 uM', 'Add a final volume');
  no('1:1000 anti-BRD4 dilute', 'Add a final volume');
  no('serial 1:3', 'needs a factor, a count and a top concentration', '#');
  no('serial 1:3 x 30 from 10 uM', 'At most 24 points', '#');
  no('mix 10 rx', 'Master mix needs the volume of each component', 'Total');
  no('mastermix 4 rx: 10 + 2 ul + water', 'Water to volume needs the volume per reaction', 'Total');
  no('mastermix 4 x 5 ul: 10 + 2 + water', 'add up to 12 µL, more than 5 µL', 'Total');
  no('mw 450 10 mM 1 mL 5 mg', 'not three', 'Weigh');
  no('mw 450 10 mM', 'two of', 'Weigh');
  no('5 mg to uL', 'Cannot convert', '0');
  no('1 mL to mM', 'Cannot convert', '0');
  const same = CK.answer('10 mM to 10 mM in 1 mL'); if (!same || /Take/.test(same.copy)) bad('CK3', 'equal concentrations were diluted'); else ok();
}

if (run('CK4')) {
  for (const q of ['EX41', 'HCT116 10 uM', 'anti-BRD4 1:1000 in 5% milk', '5 ml tube', 'CellTiter-Glo 100 uL 50 uL', 'Western blot', '24 h', '37 C', 'PBS 1x', '10 uM', 'mw 450',
                   '55 kDa', 'dose response 8 points', 'GeneRuler 1 kb', 'MV4-11 day 3', 'plate 384', '', '   ', 'x'.repeat(300), '1:1000', 'Gibson 50 C 15 min', 'cells/mL', 'passage 12']) {
    const t = text(q); if (t !== null) bad('CK4', `“${q.slice(0, 40)}” was read as a calculation:\n${t}`); else ok();
  }
}

if (run('CK5')) {
  let s = 99; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = ['10', '0', '0.5', '1e3', '1,000', '-5', '999999999', '1e-12', ' to ', ' in ', ' → ', ' x ', ' ', ': ', ' + ', ', ', ' mw ', ' MW=', '450.5', 'mM', 'uM', 'µM', 'nM', 'pM', 'M', 'mL', 'uL', 'µL', 'L', 'mg', 'ug', 'ng', 'mg/ml', 'ug/ul', 'g/mol', 'kDa', 'mol', 'nmol',
             'serial', 'mastermix', 'mix', 'rx', '%', '+10%', '1:', '1:1000', '3-fold', 'half-log', 'points', 'steps', 'from', 'water', 'buffer', '37 C', '°F', 'F', 'x', '100x', '1x', 'dilute', '.', ',', '/', '(', ')', '<b>', '∞', 'NaN'];
  let thrown = 0, cards = 0;
  for (let i = 0; i < 4000; i++) {
    let q = ''; const n = 1 + Math.floor(rnd() * 9); for (let j = 0; j < n; j++) q += P[Math.floor(rnd() * P.length)] + (rnd() < 0.5 ? ' ' : '');
    let r; try { r = CK.answer(q); } catch (e) { thrown++; if (thrown < 4) bad('CK5', `“${q}” threw: ${e.message}`); continue; }
    if (!r) continue; cards++;
    if (typeof r.kind !== 'string' || !r.kind) bad('CK5', `“${q}”: a card without a kind`);
    else if (/NaN|undefined|Infinity|\[object|null/.test(r.copy)) { bad('CK5', `“${q}” printed a non-number:\n${r.copy}`); break; }
  }
  if (!thrown && cards > 50) ok(); else if (!thrown) bad('CK5', 'the grammar never produced a card in 4000 tries: ' + cards);
}

if (run('CK6')) {
  const r = CK.answer('mastermix 4 rx <img src=x onerror=window.__x=1> 10 + 2 ul');
  const h = r ? CK.html(r, t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))) : '';
  if (!r) bad('CK6', 'the master mix with a hostile name was not read'); else if (/<img/i.test(h)) bad('CK6', 'a component name became markup: ' + h.slice(0, 200)); else ok();
}

if (run('CK7')) {
  const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
  const port = await freePort();
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  const BASE = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/CLAUDE.md'); if (r.ok) break; } catch (e) {} await sleep(120); }
  const browser = await chromium.launch();
  try {
    for (const [w, h] of [[1440, 900], [390, 780]]) for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addInitScript(([t]) => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} window.__copied = []; try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: s => { window.__copied.push(s); return Promise.resolve(); } }, configurable: true }); } catch (e) {} }, [theme]);
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
      await page.goto(BASE + '/' + FILE); await page.waitForFunction(() => typeof openSpot === 'function' && typeof CalcKit === 'object', null, { timeout: 15000 }); await sleep(500);
      const tag = `${w}px ${theme}`;
      const type = async q => { await page.evaluate(q => { openSpot(); const i = document.getElementById('spot-in'); i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })); spotRender(); }, q); await sleep(120); };
      await type('10 mM to 50 uM in 1 mL');
      const a = await page.evaluate(() => { const f = document.querySelector('#spot-res .spot-item'); return { card: !!(f && f.querySelector('.cq-card')), txt: f ? f.textContent : '', sel: f && f.classList.contains('sel') }; });
      if (!a.card || !a.sel || !/995 µL/.test(a.txt)) bad('CK7', `${tag}: the first row is not the selected card: ${JSON.stringify(a)}`); else ok();
      await page.keyboard.press('Enter'); await sleep(150);
      const c = await page.evaluate(() => ({ copied: window.__copied.slice(), open: SPOT.open }));
      if (c.copied.length !== 1 || !/^Take 5 µL stock \+ 995 µL diluent/.test(c.copied[0]) || c.open) bad('CK7', `${tag}: Enter did not copy the answer as text and close: ${JSON.stringify(c)}`); else ok();
      await type('EX41 dose response');
      const b = await page.evaluate(() => document.querySelectorAll('#spot-res .cq-card').length);
      if (b) bad('CK7', `${tag}: an ordinary query got a card`); else ok();
      await type('mastermix 4 rx <img src=x onerror=window.__x=1> 10 + 2 ul');
      const x = await page.evaluate(() => ({ imgs: document.querySelectorAll('#spot-res img').length, ran: window.__x || 0, card: !!document.querySelector('#spot-res .cq-card') }));
      if (x.imgs || x.ran || !x.card) bad('CK7', `${tag}: a component name became markup, or the card was not drawn: ${JSON.stringify(x)}`); else ok();
      await type('serial 1:3 x 12 from 10 uM, 100 uL');
      const m = await page.evaluate(() => { const r = document.getElementById('spot-res'), k = r.querySelector('.cq-card'), box = document.getElementById('spot').getBoundingClientRect(), kb = k.getBoundingClientRect();
        return { pageX: document.documentElement.scrollWidth > innerWidth + 1, resX: r.scrollWidth > r.clientWidth + 1, inside: kb.left >= box.left - 1 && kb.right <= box.right + 1, rows: k.querySelectorAll('.cq-t tr').length }; });
      if (m.pageX || m.resX || !m.inside || m.rows !== 13) bad('CK7', `${tag}: the serial table does not fit: ${JSON.stringify(m)}`); else ok();
      if (errs.length) bad('CK7', `${tag}: ${errs[0]}`);
      await ctx.close();
    }
  } finally { await browser.close(); srv.kill(); }
}

console.log(findings.length ? findings.join('\n') + `\n${findings.length} finding(s), ${passed} checks passed` : `✓ ${passed} checks pass`);
process.exit(findings.length ? 1 : 0);
