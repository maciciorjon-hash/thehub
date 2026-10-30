// Statistics across the data-analysis apps (docs/DATA_APPS_STUDY_2026-10-30.md, Phase 1): one question gets one answer in every app.
//   node tools/stats_invariants.mjs
//
// S1  the minimum R² a curve may have before it is flagged is the same default in Echo (Setup and the multi-assay panels), Lumina and Beacon
// S2  Beacon gives the midpoint a 95 % interval and it is honest: planted midpoints are inside it in ≥ 52 of 60 noisy runs (expected 57), and it is wider with more noise
// S4  descriptive statistics are written once (StatsKit): every app's own helper gives what an independent calculation gives — empty, one value, ties, unsorted, nulls, NaN
// S5  a midpoint past the doses is written as a bound in Echo (`> 1080`), with no interval, and the fitted number stays in the tooltip
// S6  plate quality is one rule (Z′, S/B, CV, verdict) from StatsKit.controlWindow, and Lumina and Tempo show it, from their own controls
// S7  Beacon names its flags in Echo's and Lumina's words (EC50>range, R2=…, SD=…%) and writes them to the file table; Tempo adds CI and R² only when asked
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


/* ───── S4: StatsKit, and every helper that calls it ───── */
const BATTERY = [[], [5], [2, 2, 2], [1, 2, 3, 4], [3, 1, 2], [10, 0.5, 7, 7, 120, 3], [1, null, 4, NaN, 7, Infinity, '', 10]];
const REF = a => { const b = a.filter(v => v != null && v !== '' && isFinite(v)).map(Number).sort((x, y) => x - y), n = b.length;
  const q = p => { if (!n) return null; const h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return b[lo] + (b[hi] - b[lo]) * (h - lo); };
  const m = n ? b.reduce((x, y) => x + y, 0) / n : null, sd = n > 1 ? Math.sqrt(b.reduce((x, y) => x + (y - m) ** 2, 0) / (n - 1)) : null, med = q(0.5);
  return { mean: m, sd, median: med, mad: n ? (() => { const d = b.map(v => Math.abs(v - med)).sort((x, y) => x - y), k = d.length, h = (k - 1) * 0.5; return d[Math.floor(h)] + (d[Math.ceil(h)] - d[Math.floor(h)]) * (h - Math.floor(h)); })() : null, q25: q(0.25), q75: q(0.75), sem: sd == null ? null : sd / Math.sqrt(n), cv: m && sd != null ? sd / Math.abs(m) : null }; };
const same = (a, b) => (a == null && b == null) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)));
const APPS4 = { echo: { mean: '_smMean', median: '_smMedian', q: '_quantile' }, beacon: { mean: 'meanOf', sd: 'sdOf' }, tempo: { mean: 'tpMean', sd: 'tpSD', median: 'tpMedian', mad: 'tpMAD' }, hitfinder: { mean: 'hfMean', sd: 'hfSD' } };
for (const id of ['echo', 'lumina', 'beacon', 'tempo', 'hitfinder', 'dora', 'bca']) {
  const pg = await (await browser.newContext()).newPage(); await pg.route(/^https?:/, r => r.abort()); await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForTimeout(600);
  const out = await pg.evaluate(([bat, names]) => {
    const r = { kit: typeof StatsKit === 'object', rows: [] };
    if (!r.kit) return r;
    const call = (fn, ...a) => { try { return typeof fn === 'function' ? fn(...a) : '<missing>'; } catch (e) { return '<threw ' + e.message + '>'; } };
    const f = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
    bat.forEach((a, i) => {
      const row = { i, kit: { mean: StatsKit.mean(a), sd: StatsKit.sd(a), sem: StatsKit.sem(a), median: StatsKit.median(a), mad: StatsKit.mad(a), q25: StatsKit.quantile(a, 0.25), q75: StatsKit.quantile(a, 0.75), cv: StatsKit.cv(a) }, own: {} };
      // an app's helper is held to the clean part of the input only where it never took the dirty part before (a plain mean of a list with a NaN was NaN)
      const clean = a.filter(v => v != null && v !== '' && isFinite(v)).map(Number), isClean = clean.length === a.length;
      if (names.mean) row.own.mean = isClean ? call(f(names.mean), a) : undefined;
      if (names.sd) row.own.sd = isClean ? call(f(names.sd), a) : undefined;
      if (names.median) row.own.median = isClean ? call(f(names.median), a) : undefined;
      if (names.mad) row.own.mad = call(f(names.mad), a);
      if (names.q) row.own.q = isClean && a.length ? [call(f(names.q), clean.slice().sort((x, y) => x - y), 0.25), call(f(names.q), clean.slice().sort((x, y) => x - y), 0.75)] : undefined;
      r.rows.push(row);
    });
    return r;
  }, [BATTERY, APPS4[id] || {}]);
  check(`S4 ${id}: StatsKit is in the page`, out.kit === true);
  if (!out.kit) { await pg.close(); continue; }
  out.rows.forEach(row => {
    const ref = REF(BATTERY[row.i]);
    for (const k of ['mean', 'sd', 'sem', 'median', 'mad', 'cv']) check(`S4 ${id}: StatsKit.${k} of ${JSON.stringify(BATTERY[row.i])}`, same(row.kit[k], ref[k]), { kit: row.kit[k], ref: ref[k] });
    check(`S4 ${id}: StatsKit quartiles of ${JSON.stringify(BATTERY[row.i])}`, same(row.kit.q25, ref.q25) && same(row.kit.q75, ref.q75), { kit: [row.kit.q25, row.kit.q75], ref: [ref.q25, ref.q75] });
    const o = row.own, empty = BATTERY[row.i].length === 0;
    const eq = (v, want) => v === undefined || same(v, want) || (empty && (Number.isNaN(v) || v === null)) || (v === 0 && want == null);   // empty: NaN or null by the app's old habit; one value: SD 0 in Beacon
    if ('mean' in o) check(`S4 ${id}: its own mean of ${JSON.stringify(BATTERY[row.i])}`, eq(o.mean, ref.mean), { own: o.mean, ref: ref.mean });
    if ('sd' in o) check(`S4 ${id}: its own SD of ${JSON.stringify(BATTERY[row.i])}`, eq(o.sd, ref.sd), { own: o.sd, ref: ref.sd });
    if ('median' in o) check(`S4 ${id}: its own median of ${JSON.stringify(BATTERY[row.i])}`, eq(o.median, ref.median), { own: o.median, ref: ref.median });
    if ('mad' in o) check(`S4 ${id}: its own MAD of ${JSON.stringify(BATTERY[row.i])}`, eq(o.mad, ref.mad), { own: o.mad, ref: ref.mad });
    if (o.q) check(`S4 ${id}: its own quartiles of ${JSON.stringify(BATTERY[row.i])}`, same(o.q[0], ref.q25) && same(o.q[1], ref.q75), { own: o.q, ref: [ref.q25, ref.q75] });
  });
  await pg.close();
}


/* ───── S5: Echo writes a bound as a bound ───── */
{
  const pg = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); await pg.route(/^https?:/, r => r.abort());
  const e5 = []; pg.on('pageerror', e => e5.push(String(e).slice(0, 160)));
  await pg.goto('file://' + path.join(ROOT, 'apps/echo/echo.html')); await pg.waitForTimeout(1000);
  await pg.evaluate(async () => { [...document.querySelectorAll('.outer-tab')].find(b => /Analysis/.test(b.textContent))?.click(); document.getElementById('setup-modal')?.classList.add('hidden'); loadTestData(); await new Promise(r => setTimeout(r, 300)); runPipeline(); });
  await pg.waitForFunction(() => document.querySelectorAll('#results-panel tbody tr').length > 10, null, { timeout: 60000 }); await pg.waitForTimeout(500);
  const r5 = await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('#results-panel tbody tr')], out = { bound: [], rangeRows: 0, plainNumberOnRange: [] };
    const hdr = [...document.querySelectorAll('#results-panel thead th')].map(h => h.textContent.trim()), ci = hdr.findIndex(h => /95% CI/.test(h));
    rows.forEach(tr => {
      const txt = tr.innerText; if (!/range/.test(txt)) return; out.rangeRows++;
      const b = tr.querySelector('td.bnd'); const c = ci >= 0 ? tr.children[ci] : null;
      if (!b) out.plainNumberOnRange.push(tr.children[1].textContent); else out.bound.push({ cell: b.textContent.trim(), tip: /beyond the doses tested/.test(b.title), ci: c ? c.textContent.trim() : null });
    });
    return out;
  });
  check('S5 every curve whose midpoint is outside the doses shows a bound, not a bare number', r5.rangeRows >= 2 && r5.plainNumberOnRange.length === 0, r5);
  check('S5 …as "> n" or "< n", with the fitted number in the tooltip and no interval', r5.bound.length >= 2 && r5.bound.every(b => /^[<>] [\d.e+-]+$/.test(b.cell) && b.tip && b.ci === '—'), r5.bound);
  check('S5 no script error in Echo', e5.length === 0, e5.join(' | '));
  await pg.close();
}

/* ───── S6: plate quality is one rule ───── */
{
  const w = await page.evaluate(() => {
    const hi = [100, 102, 98, 101], lo = [10, 11, 9, 10];
    return { good: StatsKit.controlWindow(hi, lo), over: StatsKit.controlWindow([50, 80, 20, 65], [45, 70, 30, 55]), few: StatsKit.controlWindow([100, 101], [10, 11]), few2: StatsKit.controlWindow([100, 101], [10, 11], { minN: 2 }), onlyHi: StatsKit.controlWindow([100, 104, 96, 101], []), tight: StatsKit.controlWindow([100, 100.5, 99.5, 100], []), loose: StatsKit.controlWindow([100, 140, 70, 90], []), none: StatsKit.controlWindow([], []) };
  });
  const sdHi = Math.sqrt(((100 - 100.25) ** 2 + (102 - 100.25) ** 2 + (98 - 100.25) ** 2 + (101 - 100.25) ** 2) / 3), sdLo = Math.sqrt(((10 - 10) ** 2 + (11 - 10) ** 2 + (9 - 10) ** 2 + (10 - 10) ** 2) / 3);
  const zRef = 1 - 3 * (sdHi + sdLo) / (100.25 - 10);
  check('S6 Z′ is 1 − 3(σ₊ + σ₋)/|μ₊ − μ₋|, S/B the ratio, window the difference', Math.abs(w.good.z - zRef) < 1e-9 && Math.abs(w.good.sb - 100.25 / 10) < 1e-9 && Math.abs(w.good.window - 90.25) < 1e-9 && w.good.verdict === 'good', w.good);
  check('S6 overlapping controls are poor', w.over.z < 0 && w.over.verdict === 'poor', w.over);
  check('S6 Z′ needs minN wells of each (3 unless an app says 2), and says what it judged instead', w.few.z === null && w.few2.z != null, { few: w.few.z, few2: w.few2.z });
  check('S6 with no low control the CV of the high one is judged (≤ 10 % good, ≤ 20 % marginal)', w.tight.verdict === 'good' && w.loose.verdict === 'poor' && /CV/.test(w.onlyHi.basis) && w.none.verdict === 'na', { tight: w.tight.verdict, loose: w.loose.verdict, none: w.none.verdict });
  const lp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); await lp.route(/^https?:/, r => r.abort()); const e6 = []; lp.on('pageerror', e => e6.push(String(e).slice(0, 160)));
  await lp.goto('file://' + path.join(ROOT, 'apps/lumina/lumina.html')); await lp.waitForTimeout(900);
  const L = await lp.evaluate(() => { loadLuminaTestData(); switchTab('results'); const h = document.getElementById('rs-qc'); const rows = [...h.querySelectorAll('tbody tr')].map(r => r.textContent.replace(/\s+/g, ' ')); return { hidden: h.hidden, rows, plates: state.plates.length }; });
  check('S6 Lumina shows plate quality for each plate that has a 100 % control', !L.hidden && L.rows.length === L.plates && L.rows.every(r => /\d/.test(r)), L);
  const L2 = await lp.evaluate(() => { state.ctrlWells = new Set(); lmPlateQC(); return document.getElementById('rs-qc').hidden; });
  check('S6 …and nothing when no control is marked', L2 === true, L2);
  check('S6 no script error in Lumina', e6.length === 0, e6.join(' | ')); await lp.close();
  const tp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); await tp.route(/^https?:/, r => r.abort()); const e7 = []; tp.on('pageerror', e => e7.push(String(e).slice(0, 160)));
  await tp.goto('file://' + path.join(ROOT, 'apps/tempo/tempo.html')); await tp.waitForTimeout(900);
  const T = await tp.evaluate(async () => { await tpLoadExample('degradation'); tpTab('results'); const q = TP.plates.map(tpPlateQC), card = [...document.querySelectorAll('#pane-results .card')].pop().innerText;
    const p0 = TP.plates[0], veh = [], bk = []; Object.keys(p0.wells).forEach(id => { const r = tpRole(p0.wells[id]); if (r === 'veh') veh.push(p0.wells[id].raw[0]); else if (r === 'bkg') bk.push(p0.wells[id].raw[0]); });
    return { z: q[0].w.z, ref: StatsKit.controlWindow(veh, bk).z, n: [q[0].w.pos.n, q[0].w.neg.n], card: /Plate quality/.test(card) && /Z′/.test(card), base: [...document.querySelectorAll('#tp-restbl thead th')].map(h => h.textContent) }; });
  check('S6 Tempo shows plate quality and its Z′ is the shared rule on the vehicle and background wells at the first read', T.card && T.z != null && Math.abs(T.z - T.ref) < 1e-12 && T.n[0] >= 3 && T.n[1] >= 3, T);
  /* ───── S7 (Tempo half): fit detail is opt-in ───── */
  const T2 = await tp.evaluate(() => { const off = [...document.querySelectorAll('#tp-restbl thead th')].map(h => h.textContent); TP.ui.fitCols = true; tpRenderResults(); const on = [...document.querySelectorAll('#tp-restbl thead th')].map(h => h.textContent); const ci = tpAllRows().map(r => tpDC50CI(r.comp)), file = tpResultsTable(tpAllRows())[0]; const A = tpAllRows()[0].comp.A; return { off, on, ci, file, lo: A.CI_DC50_lower, hi: A.CI_DC50_upper, r2: A.R2, cell: document.querySelector('#tp-restbl tbody tr').innerText }; });
  check('S7 Tempo\'s Results has no CI or R² column until asked for', !T2.off.some(h => /95% CI|R²/.test(h)) && T2.on.some(h => /DC50 95% CI/.test(h)) && T2.on.some(h => /R² \(Dmax fit\)/.test(h)) && T2.on.length === T2.off.length + 2, { off: T2.off, on: T2.on });
  check('S7 …the interval is the fit\'s own (lower–upper) and the file table carries it', T2.ci[0] === `${+T2.lo.toPrecision(3)}–${+T2.hi.toPrecision(3)}` && T2.file.includes('DC50 95% CI (nM)'), { ci: T2.ci[0], lo: T2.lo, hi: T2.hi });
  check('S7 no script error in Tempo', e7.length === 0, e7.join(' | ')); await tp.close();
}

/* ───── S7: Beacon's flags ───── */
{
  const F = await page.evaluate(() => {
    const mk = (r2, sd, bound) => ({ fit: {}, r2, top: 900, bottom: 400, bound: bound || '', pts: [{ n: 4, sd: 5 }, { n: 4, sd: sd }] });
    loadTestData(); const t = bResultsTable(), rows = bResultRows();
    return { clean: bFlagReasons(mk(0.99, 40)), r2: bFlagReasons(mk(0.85, 40)), sd: bFlagReasons(mk(0.99, 200)), bound: bFlagReasons(mk(0.99, 40, '>')), all: bFlagReasons(mk(0.5, 200, '<')), frac: bSDFrac(mk(0.99, 100)), head: t.head[t.head.length - 1], flagsCol: t.rows.map(r => r[r.length - 1]), lb: rows.map(r => r.flagReason), single: bSDFrac({ fit: {}, top: 900, bottom: 400, pts: [{ n: 1, sd: 400 }] }) };
  });
  check('S7 a clean fit has no flag; R² below the minimum says `R2=0.85`; scatter over a quarter of the span says `SD=40%`; a midpoint outside the doses says `EC50>range`', F.clean.length === 0 && F.r2.join() === 'R2=0.85' && F.sd.join() === 'SD=40%' && F.bound.join() === 'EC50>range', F);
  check('S7 reasons add up, in one fixed order', F.all.join(';') === 'EC50<range;R2=0.50;SD=40%', F.all);
  check('S7 a single well at a concentration has no SD to judge', F.single === 0 || F.single === null, F.single);
  check('S7 the file table ends in a Flags column, the Labbook row carries the same words', F.head === 'Flags' && F.flagsCol.join('|') === F.lb.join('|'), { head: F.head, file: F.flagsCol, lb: F.lb });
}

await browser.close();
console.log(findings.length ? `\n${findings.length} statistics invariants failed (${passed} held)` : `\nAll ${passed} statistics invariants hold.`);
process.exit(findings.length ? 1 : 0);
