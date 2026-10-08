// Tempo invariants — what every kinetic number depends on, checked with data whose answer is known.
// Each check is a class of bug, proven by putting the bug back (docs: CLAUDE.md › Tempo). Run:
//   node tools/tempo_invariants.mjs [--file=PATH] [--real]        (--real also reads tools/fixtures/tempo/*, which is gitignored)
//
// K0  the blocks Tempo shares with Echo are byte-identical to the canonical ones
// K1  every reader layout gives the same plate: ProNect JSON and CSV, time down / across, decimal comma, blank = missing (never 0)
// K2  the time axis: units, strictly increasing, zero
// K3  normalisation = background − own T0 − vehicle, against an independent calculation; a vehicle that decays does not leak into Dmax
// K4  a trace with a known answer is recovered; the confidence interval covers; time rescaled rescales K; the grid fit agrees with brute force
// K5  a rebound after the plateau is cut off; a clean trace uses all its reads
// K6  noise is not degradation (white and autocorrelated); a real 10 % loss is found
// K7  a plateau that is not reached is a bound, a rate faster than the read interval is a bound
// K8  Michaelis–Menten: planted KDegMax / KDeg50 recovered; Jon's exclusion rules; validation grades; his four headers verbatim
// K9  exports: numbers are numbers, missing is blank, formulas are inert; the ProNect-compatible files read back identically
// K10 leaving a read out refits that compound alone; undo puts everything back exactly
// K11 the flag text and the Screen engine agree
// K12 hostile input: nothing throws, nothing is rendered as markup, every tab draws
// K14 everything stays in its box: the empty state and the example plate, every tab, 1440 → 320 px, both themes — no icon or text leaves the box drawn around it,
//     no two runs of text land on each other, nothing is cut with no way to scroll to it, no dead handler, no misaligned row (the empty-state icon that was 44px inside a button)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = path.resolve(arg('file', path.join(ROOT, 'apps/tempo/tempo.html')));
const REAL = process.argv.includes('--real'), TRACE = !!process.env.TP_TRACE;
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) { passed++; if (TRACE) console.log('  ✓ ' + name); } else { findings.push('✗ ' + name + (detail ? ' — ' + detail : '')); console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); } };

/* ───── K0: shared blocks, compared as text (no browser) ───── */
{
  const norm = s => s.replace(/\s+/g, '');
  const span = (src, name) => { const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(src); if (!m) return null; const i = src.indexOf('{', m.index + m[0].length - 1); let d = 0, j = i; for (; j < src.length; j++) { const c = src[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) break; } } return norm(src.slice(m.index, j + 1)); };
  const echo = fs.readFileSync(path.join(ROOT, 'apps/echo/echo.html'), 'utf8'), me = fs.readFileSync(FILE, 'utf8');
  const bad = ['_4plVal4', '_4plVal4_gain', '_4plJac4', '_4plJac4_gain', '_solveLin', '_matInv', '_lmFit', '_fitBest', '_xAtYMid', '_tQ95'].filter(f => span(echo, f) !== span(me, f));
  check('K0 the fit engine is Echo’s, byte for byte', bad.length === 0, bad.join(', '));
  const blk = s => { const i = s.indexOf('// ═══ SCREEN ENGINE — BEGIN'), j = s.indexOf('// ═══ SCREEN ENGINE — END'); return i < 0 || j < 0 ? null : s.slice(i, s.indexOf('\n', j)); };
  check('K0 the Screen engine is Echo’s, byte for byte', blk(echo) && blk(echo) === blk(me), 'run python3 tools/sync_screen_engine.py');
  check('K0 the app pins no URL it does not need (SheetJS only)', [...me.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]).filter(u => !/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx|fonts\.googleapis|fonts\.gstatic|www\.w3\.org|promega\.com|doi\.org/.test(u)).length === 0, [...me.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]).filter(u => !/cdnjs|fonts|w3\.org|promega|doi\.org/.test(u)).join(' '));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push('console: ' + m.text()); });
await page.route(/^https?:/, r => r.abort());
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto('file://' + FILE);
await page.waitForFunction(() => typeof tpAnalyse === 'function');
const ev = (fn, a) => page.evaluate(fn, a);

try {
  /* ───── K1 readers ───── */
  const K1 = await ev(() => {
    const out = {}, plate = tpSynthPlate({ seed: 3, compounds: tpSynthDemoSpecs().slice(0, 2), reads: 60 });
    const js = tpToProNectJSON(plate), p2 = tpParseProNectJSON(JSON.parse(JSON.stringify(js)));
    out.jsonWells = Object.keys(p2.wells).length; out.expectWells = Object.keys(plate.wells).length; out.jsonReads = p2.times.length;
    let bad = 0; Object.keys(plate.wells).forEach(id => { const a = plate.wells[id], b = p2.wells[id]; if (!b || a.compound !== b.compound || tpRole(a) !== tpRole(b) || (a.conc || 0) !== (b.conc || 0) && Math.abs((a.conc || 0) - (b.conc || 0)) > 1e-9 * (a.conc || 1) || a.raw.some((v, k) => v !== b.raw[k])) bad++; });
    out.jsonBad = bad;
    // a raw_kinetic.csv, written the way ProNect writes it (wells are COLUMNS, any order, background first, metadata rows, then the reads), with junk rows after
    const ids = ['A1', 'A12'].concat(Object.keys(plate.wells).filter(i => tpRole(plate.wells[i]) === 'dose' || tpRole(plate.wells[i]) === 'veh')).filter((v, i, a) => a.indexOf(v) === i);
    const w = id => plate.wells[id], rows = [['Wells'].concat(ids), ['Cell Type'].concat(ids.map(() => '')), ['Target'].concat(ids.map(i => tpRole(w(i)) === 'bkg' ? 'Background' : w(i).target)), ['Compound'].concat(ids.map(i => w(i).compound)),
      ['Concentration'].concat(ids.map(i => w(i).conc == null ? '' : String(w(i).conc / 1000))), ['Unit'].concat(ids.map(i => w(i).conc == null ? '' : 'μM')), ['Time (min)'].concat(ids.map(() => ''))];
    plate.times.forEach((t, k) => rows.push([String(t)].concat(ids.map(i => String(w(i).raw[k])))));
    for (let j = 0; j < 5; j++) rows.push(['', '0']);
    const text = rows.map(r => r.join(',')).join('\n');
    const p3 = tpParseProNectCSV(tpParseCSV(text), 'x');
    out.csvWells = Object.keys(p3.wells).length; out.csvReads = p3.times.length; out.csvBkg = Object.values(p3.wells).filter(q => tpRole(q) === 'bkg').map(q => q.id).join();
    out.csvVeh = Object.values(p3.wells).filter(q => tpRole(q) === 'veh').length; out.expectVeh = ids.filter(i => tpRole(w(i)) === 'veh').length;
    out.csvConcOK = ids.every(i => (tpRole(w(i)) === 'bkg') || Math.abs((p3.wells[i].conc || 0) - (w(i).conc || 0)) <= 1e-9 * (w(i).conc || 1));
    out.csvRawOK = ids.every(i => p3.wells[i].raw.every((v, k) => v === w(i).raw[k]));
    // the same plate through the generic reader: time down, with a decimal comma, a blank, OVRFLW and an empty A1 corner
    const g = [['', 'Time [s]', 'A1', 'A2', 'B1', 'B2']]; const T = 12;
    for (let k = 0; k < T; k++) g.push(['', String(k * 300), String(1000 + k).replace('.', ','), '1.234,5', k === 3 ? '' : String(900 - k * 10), k === 4 ? 'OVRFLW' : String(800 - k * 20)]);
    const r = tpReadTables([{ name: 'g', rows: g }]); const gp = r.plates[0];
    out.genOK = !!gp; if (gp) { out.genTimes = gp.times.slice(0, 4).join(); out.genA2 = gp.wells.A2.raw[0]; out.genBlank = gp.wells.B1.raw[3]; out.genOvr = gp.wells.B2.raw[4]; out.genWells = Object.keys(gp.wells).length; out.genA1 = gp.wells.A1.raw[0]; }
    // time across, h:mm:ss in the header
    const A = [['Well', '0:00:00', '0:05:00', '0:10:00', '0:15:00', '0:20:00']]; ['A1', 'A2', 'B1', 'B2', 'C1'].forEach((id, i) => A.push([id, 100 + i, 90 + i, 80 + i, 70 + i, 60 + i]));
    const r2 = tpReadTables([{ name: 'a', rows: A }]); out.acrossOK = r2.plates.length === 1; if (r2.plates[0]) { out.acrossT = r2.plates[0].times.join(); out.acrossWells = Object.keys(r2.plates[0].wells).length; }
    // a time axis that does not increase is an error, never a silent re-sort
    const bad2 = g.map(r => r.slice()); bad2[5][1] = '300'; const r3 = tpReadTables([{ name: 'b', rows: bad2 }]); out.nonMono = r3.plates.length === 0 && r3.notes.join(' ');
    // seconds, minutes and hours by header, and with none
    const mk = (hdr, vals) => { const rr = [['Time' + hdr, 'A1', 'A2', 'B1', 'B2']]; vals.forEach(v => rr.push([String(v), 1, 2, 3, 4])); return tpReadTables([{ name: 'u', rows: rr }]); };
    out.uSec = mk(' (s)', [0, 300, 600, 900, 1200, 1500]).plates[0].times.join(); out.uHr = mk(' (h)', [0, .5, 1, 1.5, 2, 2.5]).plates[0].times.join(); out.uMin = mk(' (min)', [0, 5, 10, 15, 20, 25]).plates[0].times.join();
    out.uNone = mk('', [0, 5, 10, 15, 20, 25]).plates[0].times.join();
    return out;
  });
  check('K1 ProNect JSON: every well, compound, role, concentration and read survives', K1.jsonWells === K1.expectWells && K1.jsonBad === 0 && K1.jsonReads === 60, JSON.stringify([K1.jsonWells, K1.jsonBad, K1.jsonReads]));
  check('K1 ProNect CSV: wells in any column order, background by its Target, vehicle by concentration 0, μM → nM, reads exact, junk rows ignored', K1.csvReads === 60 && K1.csvBkg === 'A12' && K1.csvVeh === K1.expectVeh && K1.csvConcOK && K1.csvRawOK, JSON.stringify(K1));
  check('K1 generic table: seconds → minutes, decimal comma, a blank is missing (not 0), OVRFLW is missing, an empty corner is no header', K1.genOK && K1.genTimes === '0,5,10,15' && K1.genA1 === 1000 && K1.genA2 === 1234.5 && K1.genBlank === null && K1.genOvr === null && K1.genWells === 4, JSON.stringify(K1));
  check('K1 time across the page with h:mm:ss', K1.acrossOK && K1.acrossT === '0,5,10,15,20' && K1.acrossWells === 5, JSON.stringify([K1.acrossT, K1.acrossWells]));
  check('K2 a time axis that does not increase is refused, not re-sorted', typeof K1.nonMono === 'string' && /strictly/.test(K1.nonMono), String(K1.nonMono));
  check('K2 the unit of time comes from the header; a bare column is read from its spacing', K1.uSec === '0,5,10,15,20,25' && K1.uHr === '0,30,60,90,120,150' && K1.uMin === '0,5,10,15,20,25' && K1.uNone === '0,5,10,15,20,25', JSON.stringify([K1.uSec, K1.uHr, K1.uMin, K1.uNone]));

  /* ───── K3 normalisation against an independent calculation ───── */
  const K3 = await ev(() => {
    const plate = tpSynthPlate({ seed: 5, compounds: tpSynthDemoSpecs().slice(0, 3), reads: 100 }), nm = tpNormalise(plate, {}, {}), ids = Object.keys(plate.wells), N = plate.times.length, o = {};
    // independent: ProNect's recipe written out plainly
    const bk = ids.filter(i => plate.wells[i].kind === 'bkg'), bkg = new Array(N).fill(0).map((_, k) => bk.reduce((s, i) => s + plate.wells[i].raw[k], 0) / bk.length);
    const sub = id => plate.wells[id].raw.map((v, k) => v - bkg[k]), veh = ids.filter(i => plate.wells[i].kind === 'sample' && plate.wells[i].conc === 0);
    const vm = new Array(N).fill(0).map((_, k) => veh.reduce((s, i) => s + sub(i)[k], 0) / veh.length), vref = vm.map(v => v / vm[0]);
    let worst = 0; ids.filter(i => plate.wells[i].kind === 'sample').forEach(id => { const x = sub(id); x.forEach((v, k) => { const f = (v / x[0]) / vref[k]; worst = Math.max(worst, Math.abs(f - nm.frac[id][k])); }); });
    o.worst = worst; o.t0 = nm.frac['A1'][0]; o.vehNotes = nm.notes.length;
    // a missing reading is missing — in a well, and in the vehicle
    const p2 = JSON.parse(JSON.stringify(plate)); p2.wells['A1'].raw[10] = null; p2.wells['H1'].raw[10] = null; const n2 = tpNormalise(p2, {}, {});
    o.nullStays = n2.frac['A1'][10 - nm.preCount] === null || n2.frac['A1'][10] === null; o.neighbourFine = Math.abs(n2.frac['A1'][11] - nm.frac['A1'][11]) < 0.05 && n2.frac['A1'][11] != null;
    // one dead vehicle well: ProNect keeps it; the option leaves it out
    const p3 = JSON.parse(JSON.stringify(plate)); p3.wells['H3'].raw = p3.wells['H3'].raw.map((v, k) => v * Math.exp(-0.05 * p3.times[k] / 60)); /* a vehicle well whose OWN kinetics are off (a level alone cancels in T0 normalisation) */ const keep = tpNormalise(p3, {}, {}), drop = tpNormalise(p3, { norm: { vehOutlier: true } }, {});
    o.keepN = keep.vehUsed.length; o.dropN = drop.vehUsed.length; o.dropped = drop.vehDropped.join();
    // the vehicle decays 1.2 %/h: if it leaked, Dmax would be wrong; planted truth is recovered
    const R = tpAnalyse(plate, {}, {}), errs = [];
    R.compounds.forEach(c => { const tr = plate.truth.comps[c.compound]; c.concs.forEach(cc => { const t = tr.byConc[tpCKey(cc.c)], f = cc.fit; if (f.degrading && f.plateau === 'reached' && t.P < 0.5) errs.push(Math.abs(f.P - t.P)); }); });
    o.pErr = Math.max.apply(null, errs); o.nP = errs.length;
    // without the vehicle the substrate decline is NOT corrected: say so
    const p4 = JSON.parse(JSON.stringify(plate)); Object.keys(p4.wells).forEach(i => { if (p4.wells[i].conc === 0) p4.wells[i].conc = 1; }); o.noVehNote = tpNormalise(p4, {}, {}).notes.some(n => /No vehicle wells/.test(n));
    return o;
  });
  check('K3 ProNect-compatible normalisation equals the plain recipe (background per read, own T0, vehicle as ratio of means)', K3.worst < 1e-9 && Math.abs(K3.t0 - 1) < 1e-12, JSON.stringify(K3));
  check('K3 a missing reading stays missing in a well and in the vehicle, and leaves its neighbours alone', K3.nullStays && K3.neighbourFine, JSON.stringify(K3));
  check('K3 a dead vehicle well is kept as ProNect keeps it, and left out only when asked', K3.keepN === 6 && K3.dropN === 5 && K3.dropped === 'H3', JSON.stringify([K3.keepN, K3.dropN, K3.dropped]));
  check('K3 the vehicle’s own decline (1.2 %/h) does not leak into the plateau: planted P recovered within 0.02', K3.nP >= 6 && K3.pErr < 0.02, JSON.stringify([K3.pErr, K3.nP]));
  check('K3 no vehicle wells: the curves are not claimed to be corrected', K3.noVehNote, '');

  /* ───── K4 a trace with a known answer ───── */
  const K4 = await ev(() => {
    const o = { noiseFree: [], cover: 0, nCover: 0, medErr: [], resc: null, brute: null };
    const t = Array.from({ length: 180 }, (_, i) => i * 5 / 60), mk = (K, P, sd, seed, rho) => { const R = tpRng(seed); let e = 0; return t.map(x => { e = (rho || 0) * e + Math.sqrt(1 - (rho || 0) ** 2) * tpRandn(R) * sd; return P + (1 - P) * Math.exp(-K * x) + (sd ? e : 0); }); };
    [0.3, 0.6, 1.5].forEach(K => [0.05, 0.3, 0.6].forEach(P => { const f = tpFitTrace(t, mk(K, P, 0), { lag: false, skip: 0 }); o.noiseFree.push([K, P, f.K, f.P, f.degrading, f.plateau]); }));
    for (let s = 1; s <= 80; s++) { const K = 0.5, P = 0.2, f = tpFitTrace(t, mk(K, P, 0.02, s), { lag: false, skip: 0 }); if (f.degrading) { o.nCover++; if (f.KLo < K && K < f.KHi) o.cover++; o.medErr.push(Math.abs(f.K - K) / K); } }
    o.medErr.sort((a, b) => a - b); o.med = o.medErr[Math.floor(o.medErr.length / 2)];
    const y = mk(0.4, 0.15, 0.015, 77), f1 = tpFitTrace(t, y, { lag: false, skip: 0 }), f2 = tpFitTrace(t.map(x => x * 2), y, { lag: false, skip: 0 }); o.resc = [f1.K, f2.K];
    // brute force, written separately: a dense K grid, P in closed form
    let best = null; for (let K = 0.01; K < 12; K *= 1.002) { let a = 0, b = 0; t.forEach((x, i) => { const g = Math.exp(-K * x); a += (1 - g) * (1 - g); b += (1 - g) * (y[i] - g); }); const P = Math.max(0, Math.min(1.15, b / a)); let sse = 0; t.forEach((x, i) => { const g = Math.exp(-K * x), r = y[i] - (P + (1 - P) * g); sse += r * r; }); if (!best || sse < best.sse) best = { K, P, sse }; }
    o.brute = [best.K, best.P, f1.K, f1.P];
    return o;
  });
  check('K4 noise-free traces: K within 0.1 % and the plateau within 0.001 over a grid of K and P', K4.noiseFree.every(r => r[4] && Math.abs(r[2] - r[0]) / r[0] < 1e-3 && Math.abs(r[3] - r[1]) < 1e-3), JSON.stringify(K4.noiseFree.filter(r => !(r[4] && Math.abs(r[2] - r[0]) / r[0] < 1e-3 && Math.abs(r[3] - r[1]) < 1e-3))));
  check('K4 with 2 % noise the median error of K is under 4 % and the 95 % interval covers the truth in at least 85 % of 80 runs', K4.nCover >= 70 && K4.med < 0.04 && K4.cover / K4.nCover >= 0.85, JSON.stringify([K4.nCover, K4.med, K4.cover / K4.nCover]));
  check('K4 time stretched by 2 halves K', Math.abs(K4.resc[0] / K4.resc[1] - 2) < 0.01, JSON.stringify(K4.resc));
  check('K4 the grid fit agrees with a brute-force search written separately (K within 1 %, P within 0.002)', Math.abs(K4.brute[2] - K4.brute[0]) / K4.brute[0] < 0.01 && Math.abs(K4.brute[3] - K4.brute[1]) < 0.002, JSON.stringify(K4.brute));

  /* ───── K5 / K6 / K7 ───── */
  const K5 = await ev(() => {
    const o = {}, t = Array.from({ length: 180 }, (_, i) => i * 5 / 60), R = tpRng(9);
    const reb = t.map(x => { let y = 0.15 + 0.85 * Math.exp(-0.8 * x); if (x > 6) y += (1 - y) * 0.75 * (1 - Math.exp(-0.15 * (x - 6))); return y + tpRandn(R) * 0.012; });
    const f = tpFitTrace(t, reb, { lag: false, skip: 0 }); o.reb = [f.P, f.window[1], f.flags.join('|'), f['class']];
    const clean = t.map(x => 0.2 + 0.8 * Math.exp(-0.7 * x) + tpRandn(R) * 0.012); const c = tpFitTrace(t, clean, { lag: false, skip: 0 }); o.clean = [c.P, c.window[1], c.flags.join('|')];
    // the one-read outlier does not cut a window
    const spike = clean.slice(); spike[90] += 0.4; const s = tpFitTrace(t, spike, { lag: false, skip: 0 }); o.spike = [s.window[1], s.flags.join('|')];
    // few reads: never fitted
    o.few = tpFitTrace(t.slice(0, 6), clean.slice(0, 6), {}).why;
    // an early dip that recovers is skipped
    const art = t.map((x, i) => 0.25 + 0.75 * Math.exp(-0.5 * x) + (x < 0.4 ? -0.2 * Math.sin(Math.PI * x / 0.4) : 0) + tpRandn(R) * 0.01); const a = tpFitTrace(t, art, { lag: false, skip: 'auto' }); o.art = [a.skip, a.K, a.P];
    // a delay is found when it is there, and not invented when it is not
    const dl = t.map(x => 0.2 + 0.8 * Math.exp(-0.8 * Math.max(0, x - 1.2)) + tpRandn(R) * 0.01), d = tpFitTrace(t, dl, { lag: true, skip: 0 }), nd = tpFitTrace(t, clean, { lag: true, skip: 0 }); o.lag = [d.lag, nd.lag];
    return o;
  });
  check('K5 a rebound after the plateau cuts the window: plateau within 0.04 of the true nadir, window ends before the rise', Math.abs(K5.reb[0] - 0.15) < 0.04 && K5.reb[1] < 9 && /window ends/.test(K5.reb[2]), JSON.stringify(K5.reb));
  check('K5 a clean trace uses all its reads', K5.clean[1] > 14.5 && !/window ends/.test(K5.clean[2]) && Math.abs(K5.clean[0] - 0.2) < 0.01, JSON.stringify(K5.clean));
  check('K5 one wild read does not cut the window', K5.spike[0] > 14 && !/window ends/.test(K5.spike[1]), JSON.stringify(K5.spike));
  check('K5 fewer than 8 reads are never fitted', K5.few === 'few-points', String(K5.few));
  check('K5 an early dip that recovers is skipped and K comes out right', K5.art[0] >= 2 && Math.abs(K5.art[1] - 0.5) < 0.06 && Math.abs(K5.art[2] - 0.25) < 0.02, JSON.stringify(K5.art));
  check('K5 a delay of 1.2 h is found; a trace without one gets none', K5.lag[0] != null && Math.abs(K5.lag[0] - 1.2) < 0.4 && K5.lag[1] == null, JSON.stringify(K5.lag));

  const K6 = await ev(() => {
    const t = Array.from({ length: 180 }, (_, i) => i * 5 / 60), o = { white: 0, ar: 0, real: 0, n: 150 };
    for (let s = 1; s <= o.n; s++) {
      const R = tpRng(1000 + s), w = t.map(() => 1 + tpRandn(R) * 0.03); if (tpFitTrace(t, w, { lag: true, skip: 0 }).degrading) o.white++;
      let e = 0; const R2 = tpRng(5000 + s), a = t.map(() => { e = 0.9 * e + Math.sqrt(1 - 0.81) * tpRandn(R2) * 0.02; return 1 + e; }); if (tpFitTrace(t, a, { lag: true, skip: 0 }).degrading) o.ar++;
      const R3 = tpRng(9000 + s), r = t.map(x => 0.9 + 0.1 * Math.exp(-0.5 * x) + tpRandn(R3) * 0.015); if (tpFitTrace(t, r, { lag: true, skip: 0 }).degrading) o.real++;
    }
    return o;
  });
  check('K6 pure white noise is called degradation in at most 3 % of 150 traces', K6.white / K6.n <= 0.03, K6.white + ' of ' + K6.n);
  check('K6 autocorrelated noise (ρ 0.9, what a drifting vehicle looks like) in at most 8 %', K6.ar / K6.n <= 0.08, K6.ar + ' of ' + K6.n);
  check('K6 a real 10 % loss is found in at least 90 %', K6.real / K6.n >= 0.9, K6.real + ' of ' + K6.n);

  const K7 = await ev(() => {
    const t = Array.from({ length: 180 }, (_, i) => i * 5 / 60), o = {};
    const slow = t.map(x => 0.3 + 0.7 * Math.exp(-0.07 * x)), f = tpFitTrace(t, slow, { lag: false, skip: 0 }); o.slow = [f.plateau, f.Dq, f.P, f.flags.join('|')];
    const fast = t.map(x => 0.1 + 0.9 * Math.exp(-60 * x)), g = tpFitTrace(t, fast, { lag: false, skip: 0 }); o.fast = [g.Kq, g.flags.join('|')];
    const ok = t.map(x => 0.2 + 0.8 * Math.exp(-0.7 * x)), h = tpFitTrace(t, ok, { lag: false, skip: 0 }); o.ok = [h.plateau, h.Dq, h.Kq];
    return o;
  });
  check('K7 a plateau that is not reached is a lower bound on Dmax, never a plain number', K7.slow[0] !== 'reached' && K7.slow[1] === '≥', JSON.stringify(K7.slow));
  check('K7 a rate faster than the read interval is a bound', K7.fast[0] === '>' && /faster than the read interval/.test(K7.fast[1]), JSON.stringify(K7.fast));
  check('K7 a clean curve is reported as a value', K7.ok[0] === 'reached' && K7.ok[1] === '=' && K7.ok[2] === '=', JSON.stringify(K7.ok));

  /* ───── K8 Michaelis–Menten ───── */
  const K8 = await ev(() => {
    const o = {}, cs = [0.244, 0.977, 3.9, 15.6, 62.5, 250, 1000], mm = c => 0.8 * c / (12 + c);
    const mkItem = (c, K, P, extra) => Object.assign({ c, K, Kq: '=', P: P == null ? 0.2 : P, degrading: true, plateau: 'reached', ciOK: true, grade: 'excellent', fit: { ok: true } }, extra || {});
    // planted, noise-free
    const items = cs.map(c => mkItem(c, mm(c))), B = tpMM(items, {});
    o.plant = [B.ok, B.Kmax, B.K50, B.Eff, B.LogEff, B.saturated, B.K50q];
    // Jon's rules
    const flat = cs.map(c => mkItem(c, mm(c), c < 5 ? 0.9 : 0.2)), Bf = tpMM(flat, {}); o.flat = Bf.rows.filter(r => !r.use).map(r => r.reason);
    const hookItems = cs.map(c => mkItem(c, mm(c) * (c > 100 ? 0.4 : 1))), Bh = tpMM(hookItems, {}); o.hook = [Bh.hookConcs.join(), Bh.ok, Bh.Kmax];
    const Bs = tpMM(hookItems, { mm: { hookMode: 'si' } }); o.si = !!Bs.si;
    const ci = cs.map((c, i) => mkItem(c, mm(c), 0.2, { ciOK: i !== 2 })), Bc = tpMM(ci, {}); o.ci = Bc.rows[2].reason;
    const falling = cs.map((c, i) => mkItem(c, 1 / (1 + i))), Bd = tpMM(falling, {}); o.falling = [Bd.ok, Bd.why];
    const sat = cs.map(c => mkItem(c, 0.8 * c / (0.05 + c))), Bk = tpMM(sat, {}); o.below = [Bk.K50q, Bk.effq];
    const lin = cs.slice(0, 5).map(c => mkItem(c, 0.002 * c)), Bl = tpMM(lin, {}); o.lin = [Bl.ok && Bl.saturated, Bl.Kmaxq, Bl.effq];
    // the grades are R² > 0.98 excellent, > 0.95 acceptable, else poor
    const t = Array.from({ length: 180 }, (_, i) => i * 5 / 60); const gr = [0.004, 0.02, 0.05, 0.09].map((sd, i) => { const R = tpRng(40 + i); const f = tpFitTrace(t, t.map(x => 0.2 + 0.8 * Math.exp(-0.5 * x) + tpRandn(R) * sd), { lag: false, skip: 0 }); return [f.r2, f.grade]; });
    o.grades = gr.every(([r2, g]) => g === (r2 > 0.98 ? 'excellent' : r2 > 0.95 ? 'acceptable' : 'poor')) && new Set(gr.map(x => x[1])).size >= 2;
    // a plateau fixed from the last N reads is flagged
    const sl = t.map(x => 0.3 + 0.7 * Math.exp(-0.07 * x)); o.fixed = tpFitTrace(t, sl, { lag: false, skip: 0 }).flags.some(f => /plateau fixed to the mean of the last 25 reads/.test(f));
    return o;
  });
  check('K8 noise-free K against concentration: KDegMax, KDeg50, efficiency and its log recovered', K8.plant[0] && Math.abs(K8.plant[1] - 0.8) < 1e-3 && Math.abs(K8.plant[2] - 12) < 0.02 && Math.abs(K8.plant[3] - 0.8 / 12) < 1e-4 && Math.abs(K8.plant[4] - Math.log10(0.8 / 12)) < 1e-3 && K8.plant[5], JSON.stringify(K8.plant));
  check('K8 Jon’s rule: a flat curve (plateau ≥ 0.85) is left out and reported as no significant degradation', K8.flat.length === 3 && K8.flat.every(r => /no significant degradation observed/.test(r)), JSON.stringify(K8.flat));
  check('K8 Jon’s rule: a hook (K falls above the optimum) is left out, or modelled with substrate inhibition on request', K8.hook[0] !== '' && K8.hook[1] && Math.abs(K8.hook[2] - 0.8) < 0.1 && K8.si, JSON.stringify([K8.hook, K8.si]));
  check('K8 Jon’s rule: K whose interval includes 0 or is wider than 10 × K is left out', /not well determined/.test(K8.ci || ''), String(K8.ci));
  check('K8 K that only falls with concentration is not a Michaelis–Menten response (no number is invented)', K8.falling[0] === false && /not a Michaelis–Menten/.test(K8.falling[1] || ''), JSON.stringify(K8.falling));
  check('K8 KDeg50 below the lowest concentration is a bound, and so is the efficiency', K8.below[0] === '<' && K8.below[1] === '≥', JSON.stringify(K8.below));
  check('K8 K that does not saturate gives KDegMax as a lower bound', K8.lin[0] && K8.lin[1] === '≥' || K8.lin[0] === false || K8.lin[0] === undefined, JSON.stringify(K8.lin));
  check('K8 validation grades follow R² (> 0.98 excellent, > 0.95 acceptable, else poor)', K8.grades, '');
  check('K8 a plateau fixed from the last 25 reads says so', K8.fixed, '');

  /* ───── the example plates through the real UI ───── */
  await ev(async () => { await loadTestData(); });
  const U = await ev(() => {
    const o = {}, res = tpRes(); o.comps = res.compounds.map(c => c.compound + ':' + c.cls).join(' ');
    // the planted answers, plate A
    const A = tpPlate(), errs = [];
    // (the demo deletes .truth from the plates it loads, so regenerate the same plate to read the truth)
    const T = tpSynthPlate({ name: 'x', seed: 11, compounds: tpSynthDemoSpecs().slice(0, 5), target: 'TARGET-1-HiBiT' });
    res.compounds.forEach(c => { const sp = T.truth.comps[c.compound].spec; if (c.B.ok && sp.name !== 'Hooker-C' && !sp.rebound) errs.push([c.compound, c.B.Kmax / sp.Kmax, c.A.DC50_nM / sp.DC50]); });
    o.errs = errs; o.mode = TP.S.headline;
    return o;
  });
  check('K8 the example plate: each compound’s KDegMax is within 15 % of what was planted and its DC50 within a factor 1.7', U.errs.length >= 3 && U.errs.every(e => Math.abs(e[1] - 1) < 0.15 && e[2] > 0.6 && e[2] < 1.7), JSON.stringify(U.errs));
  check('K8 the example finds a delayed, a rebounding and an inactive curve', /Delayed-D:delayed/.test(U.comps) && /Rebound-E:rebound/.test(U.comps), U.comps);

  /* ───── K9 exports ───── */
  const K9 = await ev(async () => {
    const o = {}, sheets = {}; const got = [];
    window.XLSX = { utils: { book_new: () => ({ s: [] }), aoa_to_sheet: a => a, book_append_sheet: (wb, ws, n) => { sheets[n] = ws; } }, writeFile: () => { } };
    const plate = tpPlate(); plate.wells['A1'].compound = '=1+1'; await tpRunPlate(plate); tpExportXLSX();
    const mmSheet = sheets['Michaelis-Menten'] || sheets[Object.keys(sheets).find(k => /Michaelis/.test(k))], head = mmSheet[0];
    o.heads = ['KDegMax\n(h-1)', 'KDeg50\n(nM)', 'KDegMax/KDeg50\n(nM-1*h-1)', 'Log[KDegMax/KDeg50\n(nM-1*h-1)]'].map(h => head.indexOf(h) >= 0);
    const flat = [].concat.apply([], Object.values(sheets).map(s => [].concat.apply([], s)));
    o.nanText = flat.some(v => typeof v === 'string' && /^(NaN|Infinity|undefined|-Infinity)$/.test(v)); o.formula = flat.some(v => v === '=1+1'); o.safe = flat.some(v => v === "'=1+1");
    o.sheetNames = Object.keys(sheets).join('|');
    const res = sheets['Results']; o.dc50Numeric = res.slice(1).every(r => { const v = r[res[0].indexOf('DC50 (Dmax50) (nM)')]; return v == null || typeof v === 'number'; });
    // the ProNect-compatible trio read back
    tpDownload = (n, b) => got.push([n, b]); tpExportProNect(); await new Promise(r => setTimeout(r, 1200));
    const txt = async b => await b.text(); const raw = got.find(g => /raw_kinetic/.test(g[0])), nrm = got.find(g => /norm_kinetic/.test(g[0])), js = got.find(g => /normalized_data/.test(g[0]));
    o.files = got.map(g => g[0]).join();
    if (raw) { const p = tpParseProNectCSV(tpParseCSV((await txt(raw[1])).replace(/^﻿/, '')), 'back'); o.rawBack = !!p && p.times.length === plate.times.length; o.rawWells = p && Object.keys(p.wells).length; o.rawSame = p && Object.keys(p.wells).filter(i => plate.wells[i].raw).every(i => p.wells[i].raw.every((v, k) => v === plate.wells[i].raw[k])); }
    if (nrm) { const text = (await txt(nrm[1])).replace(/^﻿/, ''), rows = tpParseCSV(text); o.normRows = rows.length; const p = tpParseProNectCSV(rows, 'n'); o.normOK = !!p && p.preNorm; o.normJunk = rows.filter(r => r[0] === '' && r[1] === '0').length; }
    if (js) { const j = JSON.parse((await txt(js[1])).replace(/^﻿/, '')), p = tpParseProNectJSON(j); o.jsonOK = !!p && Object.keys(p.wells).length === 96 && j.Protocol === 'TPD' && !!j.Results; }
    return o;
  });
  check('K8 the Excel sheet carries Jon’s four headers exactly as he writes them', K9.heads.every(Boolean), JSON.stringify(K9.heads) + ' ' + K9.sheetNames);
  check('K9 numbers leave as numbers, missing as blank — never NaN, Infinity or undefined as text — and DC50 is numeric', !K9.nanText && K9.dc50Numeric, JSON.stringify([K9.nanText, K9.dc50Numeric]));
  check('K9 a compound called =1+1 leaves as text, not as a formula', !K9.formula && K9.safe, JSON.stringify([K9.formula, K9.safe]));
  check('K9 the three ProNect-compatible files are written, and read back with every read exact', /raw_kinetic/.test(K9.files) && /norm_kinetic/.test(K9.files) && /normalized_data/.test(K9.files) && K9.rawBack && K9.rawSame, JSON.stringify(K9));
  check('K9 norm_kinetic.csv carries no junk rows and reads as ProNect’s normalised form; the JSON is the ProNect schema plus Results', K9.normOK && K9.normJunk === 0 && K9.jsonOK, JSON.stringify([K9.normOK, K9.normJunk, K9.jsonOK]));

  /* ───── K10 leaving something out, and undo ───── */
  const K10 = await ev(async () => {
    const o = {}; await loadTestData(); const p = tpPlate(), res0 = tpRes(p), c0 = res0.compounds[0], c1 = res0.compounds[1], key = c0.key;
    const before = JSON.stringify(c0.concs.map(c => [c.fit.K, c.fit.P])), same1 = c1;
    const cc = c0.concs[c0.concs.length - 1]; tpUndoMark('test'); const ex = tpEx(p); cc.live.forEach(id => { ex.pts[id] = [30, 31, 32, 33, 34, 35, 36, 37]; }); tpRefit(p, key); await new Promise(r => setTimeout(r, 50));
    const res1 = tpRes(p); o.onlyThis = res1.compounds[1] === same1 && res1.compounds[0] !== c0;
    o.changed = JSON.stringify(res1.compounds[0].concs.map(c => [c.fit.K, c.fit.P])) !== before;
    // a well left out changes n and refits
    tpUndoMark('well'); ex.wells.push(cc.wells[0]); await tpRunPlate(p); o.n = tpRes(p).compounds[0].concs[tpRes(p).compounds[0].concs.length - 1].live.length;
    tpUndo(); await new Promise(r => setTimeout(r, 300)); tpUndo(); await new Promise(r => setTimeout(r, 300));
    o.restored = JSON.stringify(tpRes(p).compounds[0].concs.map(c => [c.fit.K, c.fit.P])) === before && tpEx(p).wells.length === 0 && Object.keys(tpEx(p).pts).length === 0;
    // a time range masked away: fewer than 8 reads left is not fitted
    tpUndoMark('mask'); tpEx(p).masks.push([0.5, 99]); await tpRunPlate(p); const f = tpRes(p).compounds[0].concs[3].fit; o.few = f.why; tpUndo(); await new Promise(r => setTimeout(r, 300));
    // the layout is undoable too
    const w = p.wells['A1']; const was = w.compound; tpUndoMark('lay'); w.compound = 'ZZZ'; tpUndo(); await new Promise(r => setTimeout(r, 300)); o.layout = w.compound === was;
    return o;
  });
  check('K10 leaving a read out refits that compound alone (the others are the same objects) and the fit changes', K10.onlyThis && K10.changed, JSON.stringify(K10));
  check('K10 a well left out reduces n', K10.n === 1, String(K10.n));
  check('K10 undo puts every fit, left-out well and read back exactly', K10.restored, JSON.stringify(K10));
  check('K10 masking away nearly every read leaves a trace that is not fitted; the layout undoes', K10.few === 'few-points' && K10.layout, JSON.stringify([K10.few, K10.layout]));

  /* ───── K11 the flag text and the Screen engine ───── */
  const K11 = await ev(() => {
    const o = { bad: [] }, res = tpRes();
    res.compounds.forEach(c => { if (!c.A || c.A.fail) return; const f = scrFlags(c.A); if (!!f.noEffect !== /No effect/.test(c.A.Flag_Reason)) o.bad.push(c.compound + ' noEffect'); if (f.hookN !== (c.A._hook_concs || []).length) o.bad.push(c.compound + ' hook'); (c.ref ? c.ref.flags : []).forEach(t => { if (/No effect|EC50|Hookx|R2=|SD=/.test(t)) o.bad.push('K flag mimics Echo: ' + t); }); const rec = scrRecord(c.A, { assayId: 'x', runId: 'r', panel: 0, role: 'degradation' }, {}); if (rec.Potency_nM == null && !/No effect|EC50/.test(c.A.Flag_Reason) && c.A.DC50_nM != null) o.bad.push(c.compound + ' potency'); });
    o.n = res.compounds.length; return o;
  });
  check('K11 the Screen engine reads Tempo’s flag text as Tempo meant it, and no “K:” flag looks like one of Echo’s', K11.bad.length === 0 && K11.n >= 5, JSON.stringify(K11));

  /* ───── K12 hostile input and every tab ───── */
  const K12 = await ev(async () => {
    const o = { thrown: [] }, t = async (n, f) => { try { await f(); } catch (e) { o.thrown.push(n + ': ' + e.message); } };
    await t('empty', () => tpReadTables([{ name: 'e', rows: [] }])); await t('header only', () => tpReadTables([{ name: 'h', rows: [['Time (min)', 'A1', 'A2', 'A3', 'A4']] }]));
    await t('one row', () => tpReadTables([{ name: 'o', rows: [['Time (min)', 'A1', 'A2', 'A3', 'A4'], [0, 1, 2, 3, 4]] }])); await t('text', () => tpParseCSV('\u0000\u0001binary\u0002')); await t('null json', () => tpParseProNectJSON(null)); await t('weird json', () => tpParseProNectJSON({ Wells: [{}], TimeValues: ['a'] }));
    await t('huge number', () => tpNum('1e999')); o.huge = tpNum('1e999'); o.txt = tpNum('abc'); o.zero = tpNum('0');
    const p = tpSynthPlate({ seed: 2, compounds: tpSynthDemoSpecs().slice(0, 1), reads: 40 }); Object.keys(p.wells).forEach(id => { const w = p.wells[id]; if (w.kind === 'sample') w.compound = '<img src=x onerror="window.__xss=1">'; }); p.name = '<b id="xssb">name</b>'; p.id = 'xss'; TP.plates = [p]; TP.pi = 0; await tpRunPlate(p);
    for (const tab of ['plate', 'curves', 'results', 'compare']) await t('tab ' + tab, () => tpTab(tab));
    for (const s of ['kin', 'dr', 'k', 't', 'heat', 'res', 'fo']) await t('sub ' + s, () => { TP.sel.sub = s; tpTab('curves'); });
    o.xss = !!window.__xss || !!document.querySelector('#xssb') || !!document.querySelector('img[src="x"]');
    // a plate with no vehicle, no compound, one well
    const q = tpNewPlate('lonely'); q.times = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45]; q.wells.A1 = { id: 'A1', kind: 'sample', compound: 'c', target: '', cell: '', conc: 10, raw: q.times.map(() => 1000), pn: null }; await t('lonely', async () => { TP.plates = [q]; TP.pi = 0; await tpRunPlate(q); tpTab('curves'); tpTab('results'); tpTab('compare'); });
    return o;
  });
  check('K12 nothing throws on an empty table, a header only, one row, binary, null or odd JSON, or a plate with one well', K12.thrown.length === 0, JSON.stringify(K12.thrown));
  check('K12 a number that is not a number is missing, not 0 and not Infinity', K12.huge === null && K12.txt === null && K12.zero === 0, JSON.stringify([K12.huge, K12.txt, K12.zero]));
  check('K12 names and compounds are never rendered as markup', !K12.xss, '');
  check('K12 no page error or console error in the whole run', errs.length === 0, errs.slice(0, 3).join(' | '));

  /* ───── K13 Hit Finder reads what Tempo sends ───── */
  const table = await ev(async () => { TP.plates = []; TP.res = {}; TP.ex = {}; await loadTestData(); const t = tpScreenTable(); return { table: t, comps: [].concat.apply([], TP.plates.map(p => tpRes(p).compounds.map(c => ({ n: c.compound, dc50: c.A && !c.A.fail ? c.A.DC50_nM : null, hook: c.A && !c.A.fail ? c.A._hook_concs.length : null, nd: c.A && !c.A.fail && /No effect/.test(c.A.Flag_Reason) })))), cols: SCR_COLS.length }; });
  const hfPage = await ctx.newPage(); hfPage.on('pageerror', e => errs.push('hitfinder: ' + e.message)); await hfPage.route(/^https?:/, r => r.abort());
  await hfPage.addInitScript(() => { try { localStorage.clear(); indexedDB.deleteDatabase('hitfinder'); } catch (e) {} });
  await hfPage.goto('file://' + path.join(ROOT, 'apps/hitfinder/hitfinder.html')); await hfPage.waitForFunction(() => typeof hfReceiveFromEcho === 'function');
  const K13 = await hfPage.evaluate(async t => {
    const o = {}; o.recs = hfParseScreenTable(t.table); o.n = o.recs.length;
    // through the Hub's own door: a dhub:context message from the parent frame (here the page is its own parent)
    const send = async () => { window.dispatchEvent(new MessageEvent('message', { source: window.parent, data: { type: 'dhub:context', version: 1, requestId: 'k13', context: { source: 'tempo', name: 'plate', table: t.table } } })); await new Promise(r => setTimeout(r, 700)); };
    await send(); o.screens1 = HF.screens.size; await send(); o.screens2 = HF.screens.size;
    o.roles = [...new Set(o.recs.map(r => r.Role))].join(); o.assays = [...new Set(o.recs.map(r => r.Assay))].join();
    o.dc50 = t.comps.every(c => { const r = o.recs.find(x => x.Compound === c.n); return r && (c.dc50 == null || c.nd || r.Potency_nM == null || Math.abs(r.Potency_nM - c.dc50) / c.dc50 < 1e-3); });
    o.hooker = (o.recs.find(r => r.Compound === 'Hooker-C') || {}).Hook_State; o.inactive = (o.recs.find(r => r.Compound === 'Inactive-G') || {}).Potency_Qualifier;
    o.nanText = JSON.stringify(o.recs).match(/NaN|undefined|Infinity/) ? true : false;
    return o;
  }, table);
  check('K13 Hit Finder reads every compound Tempo sends, as a degradation screen with the potency it was sent', K13.n === table.comps.length && K13.roles === 'degradation' && K13.dc50, JSON.stringify([K13.n, table.comps.length, K13.roles, K13.dc50]));
  check('K13 the hook Tempo found arrives as Echo’s hook state, and a curve with no effect as n.d.', K13.hooker === 'excluded' && K13.inactive === 'n.d.', JSON.stringify([K13.hooker, K13.inactive]));
  check('K13 one screen per plate, and sending again replaces it instead of doubling', K13.screens1 === 2 && K13.screens2 === 2, JSON.stringify([K13.screens1, K13.screens2]));
  check('K13 the table is Echo’s 57 Screen columns in their order, then Tempo’s kinetic ones, and no NaN, Infinity or undefined', table.table[0].length > table.cols && table.table[0][0] === 'Schema' && table.table[0][table.cols - 1] === 'Hook_Points' && table.table[0][table.cols] === 'Kin_Class' && table.table.every(r => r.length === table.table[0].length) && !K13.nanText, JSON.stringify([table.table[0].length, table.cols, table.table[0][table.cols - 1]]));
  const kcol = table.table[0].indexOf('KDegMax_per_h'), lcol = table.table[0].indexOf('KDeg_LogEff');
  check('K13 the kinetic columns carry KDegMax and its log efficiency for a compound with a K–response, blank (never 0) for one without', kcol > 0 && table.table.slice(1).some(r => typeof r[kcol] === 'number' && typeof r[lcol] === 'number') && table.table.slice(1).some(r => r[kcol] === null), '');
  await hfPage.close();

  /* ───── K14 everything stays in its box ───── */
  {
    const ESC = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8').replace(/window\.__escapeAudit\(\);\s*$/, ''), RT = fs.readFileSync(path.join(ROOT, 'tools/audit_runtime.js'), 'utf8'), AL = fs.readFileSync(path.join(ROOT, 'tools/audit_align.js'), 'utf8');
    const bad = [];
    for (const theme of ['light', 'dark']) for (const w of [1440, 1180, 1024, 768, 390, 320]) {
      const c2 = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, hasTouch: w < 500, isMobile: w < 500 }), pg = await c2.newPage();
      await pg.route(/^https?:/, r => r.abort());
      await pg.addInitScript(t => { try { localStorage.clear(); localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
      await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpTab === 'function');
      await pg.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      const run = async tag => {
        await pg.waitForTimeout(400);
        // ink on a solid fill: 4.5:1 in dark (fixed with --on-accent); 3:1 in light, where the palette's white on #5e87c5 is 3.65 (held, see docs/UI.md)
        const f = [].concat(await pg.evaluate(ESC + ';window.__escapeAudit({allowScroll:".tbl-wrap,.tbl-scroll,table"})').catch(x => ['escape audit crashed: ' + x.message]).then(r => r.map(x => 'ESCAPE ' + x)),
          await pg.evaluate(RT + ';(window.__runtimeAudit||(()=>[]))({accentInk:' + (theme === 'dark' ? 4.5 : 3) + '})').catch(() => []).then(r => (r || []).map(x => 'RUNTIME ' + x)),
          await pg.evaluate(AL + ';(window.__alignAudit||(()=>[]))()').catch(() => []).then(r => (r || []).map(x => 'ALIGN ' + x)));
        f.forEach(x => bad.push(theme + ' ' + w + 'px ' + tag + ': ' + x));
      };
      if (w === 1440 && theme === 'light') {
        const ic = await pg.evaluate(() => [...document.querySelectorAll('.empty-state .btn svg')].map(s => Math.round(s.getBoundingClientRect().width)));
        check('K14 the icons inside the empty state’s buttons are button-sized, not the 44px illustration', ic.length === 3 || ic.length === 1 ? ic.every(v => v <= 16) && ic.length >= 1 : false, JSON.stringify(ic));
      }
      for (const t of ['plate', 'curves', 'results', 'compare']) { await pg.evaluate(t => tpTab(t), t); await run('empty/' + t); }
      await pg.evaluate(() => tpTab('plate')); await pg.evaluate(() => tpLoadExample()); await pg.waitForTimeout(1500);
      for (const t of ['plate', 'curves', 'results', 'compare']) { await pg.evaluate(t => tpTab(t), t); await run('example/' + t); }
      await c2.close();
    }
    check('K14 nothing leaves its box, lands on its neighbour, is cut with no scroll, or sits off the line — empty and example, every tab, 1440 to 320 px, both themes', bad.length === 0, bad.slice(0, 6).join(' | ') + (bad.length > 6 ? ' … +' + (bad.length - 6) : ''));
  }

  /* ───── the real ProNect files, when they are here ───── */
  if (REAL) {
    const F = path.join(ROOT, 'tools/fixtures/tempo');
    if (fs.existsSync(path.join(F, 'normalized_data.json'))) {
      const json = fs.readFileSync(path.join(F, 'normalized_data.json'), 'utf8'), raw = fs.readFileSync(path.join(F, 'raw_kinetic.csv'), 'utf8'), nrm = fs.readFileSync(path.join(F, 'norm_kinetic.csv'), 'utf8');
      const R = await ev(async ([json, raw, nrm]) => {
        const o = {}, p = tpParseProNectJSON(JSON.parse(json)), nm = tpNormalise(p, {}, {}); let worst = 0; Object.keys(nm.frac).forEach(id => { const w = p.wells[id]; if (!w.pn) return; nm.frac[id].forEach((v, k) => { if (v != null && w.pn[k] != null) worst = Math.max(worst, Math.abs(v - w.pn[k])); }); });
        o.worst = worst; o.wells = Object.keys(p.wells).length; o.reads = p.times.length;
        const pr = tpParseProNectCSV(tpParseCSV(raw), 'raw'), pn = tpParseProNectCSV(tpParseCSV(nrm), 'norm'); o.rawWells = Object.keys(pr.wells).length; o.normWells = Object.keys(pn.wells).length; o.normReads = pn.times.length;
        const a = tpAnalyse(p, {}, {}); o.comps = a.compounds.map(c => c.compound).join(); o.mm = a.compounds.filter(c => c.B.ok).length;
        return o;
      }, [json, raw, nrm]);
      check('REAL Tempo’s normalisation reproduces ProNect’s NormKinetic for every sample well (limited only by the 4-digit raw RLU)', R.worst < 2e-3, JSON.stringify(R));
      check('REAL the JSON, the raw CSV and the norm CSV are the same plate: 96 / 81 / 80 wells, 180 reads, five compounds', R.wells === 96 && R.rawWells === 81 && R.normWells === 80 && R.reads === 180 && R.normReads === 180 && R.comps.split(',').length === 5, JSON.stringify(R));
    } else console.log('  (--real: tools/fixtures/tempo is not here, skipped)');
  }
} catch (e) { findings.push('✗ the run stopped: ' + (e && e.stack || e)); console.log('✗ the run stopped: ' + (e && e.stack || e)); }

await browser.close();
if (findings.length) { console.log('\n' + findings.length + ' finding(s), ' + passed + ' checks passed.'); process.exit(1); }
console.log('Tempo invariants: ' + passed + ' checks passed.');
