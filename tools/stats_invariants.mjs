// Statistics across the data-analysis apps (docs/DATA_APPS_STUDY_2026-10-30.md, Phase 1): one question gets one answer in every app.
//   node tools/stats_invariants.mjs
//
// S1  the minimum R² a curve may have before it is flagged is the same default in Echo (Setup and the multi-assay panels), Lumina and Beacon
// S2  Beacon gives the midpoint a 95 % interval and it is honest: planted midpoints are inside it in ≥ 52 of 60 noisy runs (expected 57), and it is wider with more noise
// S3  that interval reaches the screen, the CSV / TSV / Excel table and the Labbook row; a bound (a midpoint outside the doses) has none, never a made-up one
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { findings.push('✗ ' + name + (detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); console.log('  ✗ ' + name + (detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); } };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ───── S1: one default, read from the files themselves ───── */
{
  const echo = read('apps/echo/echo.html'), lum = read('apps/lumina/lumina.html'), bea = read('apps/beacon/beacon.html');
  const num = (src, re) => { const m = re.exec(src); return m ? +m[1] : null; };
  const d = {
    'Echo Setup box': num(echo, /id="p-r2" aria-label="Minimum R squared" value="([\d.]+)"/),
    'Echo when the box is empty': num(echo, /_pNum\('p-r2', ([\d.]+),/),
    'Echo multi-assay panel': num(echo, /_row\(idx,'r2','Min R²','value="([\d.]+)"/),
    'Echo multi-assay read': num(echo, /minR2:gn\('r2',([\d.]+)\)/),
    'Lumina QC box': num(lum, /id="qc-r2" type="number"[^>]*value="([\d.]+)"/),
    'Lumina when the box is empty': num(lum, /_numFieldOr\('qc-r2', ([\d.]+)\)/),
    'Beacon': num(bea, /var B_MIN_R2 = ([\d.]+);/),
  };
  const vals = new Set(Object.values(d));
  check('S1 the minimum R² default is one number in Echo, Lumina and Beacon', vals.size === 1 && !vals.has(null), d);
  check('S1 Beacon has no other R² threshold written into its rules', !/f\.r2 < 0\.\d/.test(bea), 'a literal R² threshold is back in beacon.html');
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.route(/^https?:/, r => r.abort());
await page.goto('file://' + path.join(ROOT, 'apps/beacon/beacon.html'));
await page.waitForFunction(() => typeof bFits === 'function');

/* ───── S2: the interval covers ───── */
const S2 = await page.evaluate(() => {
  let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const doses = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000];
  const run = sd => { let cover = 0, n = 0, widths = [];
    for (let k = 0; k < 60; k++) {
      const raw = []; doses.forEach(c => { for (let r = 0; r < 3; r++) raw.push({ c, v: 400 + 500 / (1 + Math.pow(10, -(Math.log10(c) - Math.log10(300)))) + sd * gauss() }); });
      const f = bFitPoints(raw).fit, ci = bMidCI(f); if (!f || !ci) continue; n++; widths.push(Math.log10(ci.hi / ci.lo));
      if (ci.lo <= 300 && 300 <= ci.hi) cover++;
    }
    return { cover, n, width: widths.reduce((a, b) => a + b, 0) / Math.max(1, widths.length) }; };
  return { quiet: run(12), noisy: run(48) };
});
check('S2 the 95 % interval of the midpoint holds the true value in ≥ 52 of 60 noisy runs', S2.quiet.n >= 55 && S2.quiet.cover >= 52 && S2.noisy.n >= 50 && S2.noisy.cover >= 47, S2);
check('S2 more noise, a wider interval', S2.noisy.width > S2.quiet.width * 2, S2);

/* ───── S3: it is shown and exported ───── */
const S3 = await page.evaluate(() => {
  loadTestData(); switchTab('results');
  const fits = bFits(), t = bResultsTable(), rows = bResultRows(), tbl = document.querySelector('.rs-tbl table');
  const ci = (name) => t.head.indexOf(bPotencyName() + ' CI ' + name + ' (nM)');
  const lo = ci('lower'), hi = ci('upper');
  return {
    fits: fits.map(f => ({ n: f.name, bound: f.bound, lo: f.ciLo, hi: f.ciHi, ec50: f.ec50 })),
    head: t.head, aligned: t.rows.every(r => r.length === t.head.length),
    cols: { lo, hi }, tableCI: t.rows.map(r => [r[lo], r[hi]]),
    headers: [...tbl.querySelectorAll('thead th')].map(h => h.textContent.trim()),
    cells: [...tbl.querySelectorAll('tbody tr')].map(r => r.children[2].textContent.trim()),
    labbook: rows.map(r => r.curve && r.curve.ci),
  };
});
const meas = S3.fits.filter(f => !f.bound), bnd = S3.fits.filter(f => f.bound);
check('S3 every measured midpoint has an interval that contains it', meas.length >= 3 && meas.every(f => f.lo > 0 && f.lo < f.ec50 && f.ec50 < f.hi), S3.fits);
check('S3 a bound has no interval', bnd.length >= 1 && bnd.every(f => f.lo === undefined && f.hi === undefined), S3.fits);
check('S3 the file table carries both ends, aligned with its header', S3.cols.lo > 0 && S3.cols.hi === S3.cols.lo + 1 && S3.aligned, { head: S3.head });
check('S3 the file table says nothing where there is no interval', S3.fits.every((f, i) => f.bound ? S3.tableCI[i].every(v => v === '') : S3.tableCI[i].every(v => typeof v === 'number')), S3.tableCI);
check('S3 the screen table has a 95% CI column next to the potency', /^(EC|IC)50/.test(S3.headers[1]) && S3.headers[2] === '95% CI', S3.headers);
check('S3 …and a measured row shows a range, a bound shows a dash', S3.cells.every((c, i) => S3.fits[i].bound ? c === '–' : /\d.*[–-].*\d/.test(c)), S3.cells);
check('S3 the Labbook row carries the interval too', S3.fits.every((f, i) => f.bound ? S3.labbook[i] === null : Array.isArray(S3.labbook[i]) && S3.labbook[i][0] < S3.labbook[i][1]), S3.labbook);
check('S3 no script error', errs.length === 0, errs.join(' | '));

await browser.close();
console.log(findings.length ? `\n${findings.length} statistics invariants failed (${passed} held)` : `\nAll ${passed} statistics invariants hold.`);
process.exit(findings.length ? 1 : 0);
