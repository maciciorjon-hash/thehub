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
// K19 a GloMax time-course file is read as it comes: the reader's own clock, A:1 labels, several readouts as several plates, missing never 0; a range of wells is parsed or refused
// K20 Setup (Reads · Time · Controls · Compounds · Review): a layout-less file opens it at Controls, the controls and the series land on the plate, the fit runs once at the end, ⌘Z undoes, nothing leaves the card
// K25 the plate on Setup › Controls is dragged on: pick a control, drag a box (a row letter / column number takes the line, a drag that starts on a marked well clears), Esc cancels, no well without reads is taken; the Normalise / against rows keep their captions
// K21 normalise X against Y: wells read against control wells of their own (one vehicle per condition on a plate); the rest keep the plate's vehicle; a rule with no usable control leaves its wells without a curve, never on another vehicle; Plate tab and Setup both make, show and remove rules, ⌘Z covers them
// K22 raw kinetics: Curves › Raw (RLU) draws the reads as written (any plate, a rising protein level too): background, fold over T0, vehicle, single wells; the plate with a number in every well and a slider over the reads
// K23 axis ranges: every Tempo chart takes a minimum and a maximum for each axis (typed in the unit it is read in; a range that is not one stays on automatic and says so), also in the saved figure
// K24 the method travels with the numbers: Results has a “How this was calculated” card, and the workbook, the Prism tables, the printed report, the JSON, the Method text and a saved figure all print the same record —
//     normalisation step by step, the equations, what was left out — and it follows the settings (change one and the sentence changes), never a fixed text
// K15 Analysis settings is four tabs of aligned rows: every control has a caption, sits in one column on its tab, Apply stays in view whichever tab is open, and Apply reads the tabs that are hidden
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

  // ProNect's own files are not exempt from a strictly increasing time axis (a shuffled axis fitted garbage without a word)
  const K2b = await ev(() => {
    const times = [0, 10, 5, 20, 30, 40, 50, 60, 70, 80], w = (c, type, cmp, conc) => ({ Position: { Row: 'A', Column: c }, Type: type, Compound: cmp, Target: 'T', Concentration: conc, Unit: 'nM', RawKinetic: times.map((t, i) => 1000 - i) });
    const j = tpParseProNectJSON({ Name: 'x', TimeValues: times, Wells: [w(12, 'BKGRND', '', null), w(1, 'SAMPLE', 'X', 1)] });
    const rows = [['Wells', 'A12', 'A1'], ['Cell Type', '', ''], ['Target', 'Background', 'T'], ['Compound', '', 'X'], ['Concentration', '', '1'], ['Unit', '', 'nM'], ['Time (min)', '', '']];
    times.forEach((t, i) => rows.push([String(t), '10', String(1000 - i)]));
    const c = tpReadTables([{ name: 'c', rows }]);
    const ok = tpParseProNectJSON({ Name: 'x', TimeValues: times.slice().sort((a, b) => a - b), Wells: [w(12, 'BKGRND', '', null), w(1, 'SAMPLE', 'X', 1)] });
    return { json: j && j.error, csvPlates: c.plates.length, csvNote: c.notes.join(' '), okPlate: !!(ok && ok.wells) };
  });
  check('K2 a ProNect JSON or CSV whose time axis does not increase is refused too', /strictly/.test(K2b.json || '') && K2b.csvPlates === 0 && /strictly/.test(K2b.csvNote) && K2b.okPlate, JSON.stringify(K2b));

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
      // a wide system font, as CI's DejaVu is: at 768px the tab bar was 21px wider than the window there and fit on a Mac
      await pg.addStyleTag({ content: ':root{--sans:"DejaVu Sans",Verdana,sans-serif !important;--mono:"DejaVu Sans Mono",Menlo,monospace !important}' });
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

  /* ───── K15 Analysis settings: tabs, one column, a caption per control, Apply always in view and reading every tab ───── */
  {
    const bad = [];
    for (const [w, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light'], [320, 'light']]) {
      const c3 = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, hasTouch: w < 500, isMobile: w < 500 }), pg = await c3.newPage();
      await pg.route(/^https?:/, r => r.abort());
      await pg.addInitScript(t => { try { localStorage.clear(); localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
      await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpTab === 'function');
      await pg.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await pg.evaluate(() => tpLoadExample()); await pg.waitForTimeout(1200);
      await pg.evaluate(() => tpOpenSettings()); await pg.waitForTimeout(500);
      const tabs = await pg.evaluate(() => [...document.querySelectorAll('#tp-drawer .dr-tab')].map(b => b.dataset.tab));
      if (tabs.join() !== 'norm,fit,models,report') bad.push(w + ': tabs are ' + tabs.join());
      for (const t of tabs) {
        await pg.evaluate(t => tpSetTab(t), t); await pg.waitForTimeout(120);
        const r = await pg.evaluate(() => {
          const dr = document.querySelector('#tp-drawer'), D = dr.getBoundingClientRect(), out = [], pane = [...dr.querySelectorAll('.dr-pane')].find(p => !p.hidden);
          const shown = [...dr.querySelectorAll('.dr-pane')].filter(p => !p.hidden).length; if (shown !== 1) out.push(shown + ' panes shown');
          const ctl = [...pane.querySelectorAll('.dr-row > .inp')];
          if (!ctl.length) out.push('no controls on the tab');
          const xs = new Set(ctl.map(c => Math.round(c.getBoundingClientRect().left))); if (xs.size > 1) out.push('controls on ' + xs.size + ' columns');
          const ls = new Set([...pane.querySelectorAll('.dr-row > .dr-l')].map(c => Math.round(c.getBoundingClientRect().left))); if (ls.size > 1) out.push('captions on ' + ls.size + ' columns');
          ctl.forEach(c => { const b = c.getBoundingClientRect(); if (b.right > D.right + 0.5 || b.left < D.left - 0.5) out.push(c.id + ' leaves the drawer'); const l = dr.querySelector('label[for="' + c.id + '"]'); if (!l || !l.textContent.trim()) out.push(c.id + ' has no caption'); });
          const ap = [...dr.querySelectorAll('.dr-ft .btn')].map(b => b.getBoundingClientRect()); if (ap.length !== 2 || ap.some(b => b.bottom > innerHeight + 0.5 || b.top < 0 || b.right > D.right + 0.5)) out.push('Apply / Reset are not in view');
          const bd = dr.querySelector('.dr-bd'); if (bd.scrollHeight > bd.clientHeight + 1 && getComputedStyle(bd).overflowY === 'visible') out.push('the body is cut with no scroll');
          return out;
        });
        r.forEach(x => bad.push(theme + ' ' + w + 'px ' + t + ': ' + x));
      }
      if (w === 1440 && theme === 'light') {
        const n = await pg.evaluate(() => { const all = [...document.querySelectorAll('#tp-drawer [id^="st-"]')]; return { n: all.length, homes: all.map(c => c.closest('.dr-pane') && c.closest('.dr-pane').dataset.pane).filter(Boolean).length, ids: new Set(all.map(c => c.id)).size }; });
        check('K15 all 22 settings are in a tab, once each', n.n === 22 && n.homes === 22 && n.ids === 22, JSON.stringify(n));
        // set a value on a tab that is not showing, then Apply from another: the hidden tab is still read
        const got = await pg.evaluate(async () => { tpSetTab('fit'); document.getElementById('st-ln').value = '40'; tpSetTab('report'); tpApplySettings(); await new Promise(r => setTimeout(r, 400)); return TP.S.fit.lastN; });
        check('K15 Apply reads the tabs that are hidden', got === 40, String(got));
      }
      await c3.close();
    }
    check('K15 every tab of Analysis settings: one column, a caption each, inside the drawer, Apply in view — 1440 / 390 / 320, light and dark', bad.length === 0, bad.slice(0, 6).join(' | '));
  }

  /* ───── K16 a keyboard reaches everything a mouse does, and what it reaches is big enough and legible ───── */
  {
    const bad = [];
    for (const theme of ['light', 'dark']) {
      const c4 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await c4.newPage();
      await pg.route(/^https?:/, r => r.abort());
      await pg.addInitScript(t => { try { localStorage.clear(); localStorage.setItem('hub_theme', t); } catch (e) {} }, theme);
      await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpTab === 'function');
      await pg.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await pg.addStyleTag({ content: '*{transition:none!important}' });
      await pg.evaluate(() => tpLoadExample()); await pg.waitForTimeout(1500);
      const scan = () => pg.evaluate(() => {
        const out = [], vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden],#tp-dlg:not(.open)'); };
        const d = e => e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ')[0] : '') + ' "' + (e.textContent || '').trim().slice(0, 18) + '"';
        // 1 clickable and not natively focusable: it must carry a tabindex (and a name)
        document.querySelectorAll('[onclick]').forEach(e => { if (!vis(e) || e.closest('#tp-tip')) return; if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL)$/i.test(e.tagName)) return; if (e.tabIndex < 0 && !e.querySelector('button,a,input,select')) out.push('mouse only: ' + d(e)); });
        // 2 a button / chip a pointer lands on is at least 24 px each way (WCAG 2.2 target size)
        document.querySelectorAll('button,[role=button],.wchip,.pchip .x,.pill[tabindex]').forEach(e => { if (!vis(e) || e.closest('.tab-ink,svg')) return; const r = e.getBoundingClientRect(); if (r.height < 23.5 || r.width < 23.5) out.push('small ' + Math.round(r.width) + 'x' + Math.round(r.height) + ': ' + d(e)); });
        // 3 a pill's ink on its own tint: 4.5:1 in both themes
        const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
        const rgb = s => { const m = s.match(/[\d.]+/g).map(Number); return m; };
        const surf = rgb(getComputedStyle(document.querySelector('.card') || document.body).backgroundColor);
        document.querySelectorAll('.pill').forEach(e => { if (!vis(e)) return; const cs = getComputedStyle(e), f = rgb(cs.color), b = rgb(cs.backgroundColor), a = b.length > 3 ? b[3] : 1, bg = [0, 1, 2].map(i => b[i] * a + surf[i] * (1 - a)); const L1 = lum(f), L2 = lum(bg), r = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); if (r < 4.5) out.push('pill ' + r.toFixed(2) + ': ' + d(e)); });
        return out;
      });
      for (const t of ['plate', 'curves', 'results', 'compare']) { await pg.evaluate(t => tpTab(t), t); await pg.waitForTimeout(450); [...new Set(await scan())].forEach(x => bad.push(theme + ' ' + t + ': ' + x)); }
      if (theme === 'light') {
        // the plate by keyboard: focus A1, Shift+ArrowRight ×2, Shift+ArrowDown selects a 2×3 block; Space adds one; Escape clears
        await pg.evaluate(() => tpTab('plate')); await pg.waitForTimeout(300);
        await pg.focus('#tp-pgrid .w[data-id="A1"]');
        await pg.keyboard.press('Shift+ArrowRight'); await pg.keyboard.press('Shift+ArrowRight'); await pg.keyboard.press('Shift+ArrowDown');
        const sel = await pg.evaluate(() => [...TP.wsel].sort().join());
        check('K16 the plate by keyboard: Shift+arrows select a block of wells', sel === 'A1,A2,A3,B1,B2,B3', sel);
        await pg.keyboard.press('ArrowRight'); const one = await pg.evaluate(() => [...TP.wsel].join() + '|' + document.activeElement.dataset.id);
        check('K16 an arrow moves the focus and the selection together', one === 'B4|B4', one);
        await pg.keyboard.press('Escape'); check('K16 Escape clears the selection', await pg.evaluate(() => TP.wsel.size === 0));
        // a result row opens its compound on Enter; a column header sorts on Enter
        await pg.evaluate(() => tpTab('results')); await pg.waitForTimeout(300);
        const k0 = await pg.evaluate(() => TP.ui.sort.k); await pg.focus('#tp-restbl th[data-k="name"]'); await pg.keyboard.press('Enter');
        check('K16 a column header sorts on Enter', await pg.evaluate(k => TP.ui.sort.k === 'name' && k !== 'name', k0));
        await pg.focus('#tp-restbl tr.pick'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
        check('K16 a result row opens its curves on Enter', await pg.evaluate(() => TP.ui.tab === 'curves'));
      }
      await c4.close();
    }
    check('K16 everything clickable is reachable by keyboard, every target is 24 px, every pill reads at 4.5:1 — every tab, both themes', bad.length === 0, bad.slice(0, 6).join(' | ') + (bad.length > 6 ? ' … +' + (bad.length - 6) : ''));
  }

  /* ───── K17 a layout edit that cannot be read is refused out loud, not reported as done ───── */
  {
    const r = await ev(async () => {
      await tpLoadExample(); tpTab('plate'); const p = tpPlate(), before = p.wells.A1.conc, n0 = TP_UNDO.stack.length, out = {};
      for (const bad of ['abc', '-5', '1e999', '0,5x']) {
        TP.wsel = new Set(['A1', 'A2']); tpRenderPlate(); document.getElementById('tp-sn').value = bad; tpApplySel();
        const t = document.getElementById('tp-toast'); out[bad] = { conc: p.wells.A1.conc === before, warn: /warn/.test(t.className) && /not a concentration/.test(t.textContent), undo: TP_UNDO.stack.length === n0 };
      }
      TP.wsel = new Set(['A1']); tpRenderPlate(); document.getElementById('tp-sn').value = '2,5'; document.getElementById('tp-su').value = 'uM'; tpApplySel(); out.ok = Math.abs(p.wells.A1.conc - 2500) < 1e-9;
      return out;
    });
    check('K17 a concentration that is not a number is refused with a warning and changes nothing; a decimal comma is read', ['abc', '-5', '1e999', '0,5x'].every(k => r[k].conc && r[k].warn && r[k].undo) && r.ok, JSON.stringify(r));
  }

  /* ───── K18 dialogs: named, Tab stays inside, focus goes back to the opener, a closed one has nothing to tab to ───── */
  {
    const c5 = await browser.newContext({ viewport: { width: 1280, height: 800 } }), pg = await c5.newPage();
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpTab === 'function'); await pg.evaluate(() => tpLoadExample()); await pg.waitForTimeout(1200);
    const r = {};
    r.closed = await pg.evaluate(() => { const d = document.getElementById('tp-dlg'); tpDialog('<h3>x</h3><div class="bd"><input class="inp"></div><div class="ft"><button class="btn primary">ok</button></div>'); tpCloseDialog(); return getComputedStyle(d).visibility; });
    await pg.focus('button:has-text("Paste layout")'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(250);
    r.name = await pg.evaluate(() => { const b = document.getElementById('tp-dlg-in'), h = document.getElementById(b.getAttribute('aria-labelledby') || '_'); return h ? h.textContent : null; });
    r.first = await pg.evaluate(() => document.activeElement.id);
    let left = false; for (let i = 0; i < 12 && !left; i++) { await pg.keyboard.press(i % 2 ? 'Tab' : 'Shift+Tab'); left = await pg.evaluate(() => !document.activeElement.closest('#tp-dlg')); }
    r.left = left; await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
    r.back = await pg.evaluate(() => document.activeElement.textContent.trim());
    await pg.focus('button:has-text("Analysis settings")'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
    r.drawerIn = await pg.evaluate(() => !!document.activeElement.closest('#tp-drawer')); await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
    r.drawerBack = await pg.evaluate(() => document.activeElement.textContent.trim());
    check('K18 a dialog is named by its title, starts in its field, keeps Tab inside, hands focus back; a closed one is not focusable', r.closed === 'hidden' && r.name === 'Paste a layout' && r.first === 'tp-pl-t' && !r.left && r.back === 'Paste layout', JSON.stringify(r));
    check('K18 the settings drawer takes focus when it opens and gives it back on Escape', r.drawerIn && /Analysis settings/.test(r.drawerBack), JSON.stringify(r));
    await c5.close();
  }

  /* ───── K14 an x tick that sits on the y axis does not land on the lowest y label ───── */
  {
    const hit = await ev(() => {
      const pal = tpPal(false), out = [];
      // The tick labels are monospaced: 0.6 em a character, a line box of 1.3 em with the baseline 1.025 em from the top (IBM Plex Mono). Modelled, not measured: the
      // offline page has no Plex, and the hub's real font has a taller box than the fallback — the 4px overlap the sweep found at 1024 was invisible without it.
      const box = e => { const fs = +e.getAttribute('font-size'), w = e.textContent.length * .6 * fs, a = e.getAttribute('text-anchor'), x = +e.getAttribute('x'), y = +e.getAttribute('y'); const l = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x; return { l: l, r: l + w, t: y - 1.025 * fs, b: y + .275 * fs, s: e.textContent }; };
      // a log concentration axis whose first decade (100 pM, 1 nM, 10 nM) sits right at the left edge, over a y axis that starts at 0
      for (const lo of [0.1, 0.1004, 0.14, 0.2, 1, 1.002, 10]) for (const W of [560, 420, 320]) {
        const F = tpFrame({ W: W, H: 300, pal: pal, id: 'k', x: { lo: lo, hi: lo * 400, log: true, label: 'Concentration', fmt: tpAxConc }, y: { lo: 0, hi: 100, label: 'K' } });
        const d = document.createElement('div'); d.innerHTML = tpSvg(W, 300, F.s, pal);
        const t = [...d.querySelectorAll('text')].filter(e => /Mono/.test(e.getAttribute('font-family') || '') && e.textContent.trim()).map(box);
        for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const a = t[i], b = t[j], ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t); if (ox > 1 && oy > 1) out.push(W + 'px lo ' + lo + ': "' + a.s + '" touches "' + b.s + '"'); }
      }
      return out;
    });
    check('K14 a first x tick on the y axis ("100 pM") never touches the lowest y label ("0")', hit.length === 0, hit.slice(0, 3).join(' | '));
  }


  /* ───── K19 the GloMax time-course export ───── */
  {
    const R = await ev(() => {
      const out = {};
      // the file as the GloMax writes it: every row padded with commas to the width of the data, a clock that is the reader's own (not 5.0, 10.0, …)
      const mk = o => {
        o = Object.assign({ n: 12, wells: ['A', 'B'].flatMap(r => [1, 2, 3, 4, 5, 6].map(c => r + ':' + c)), modes: ['Luminescence'], tcol: 'TimeInMinutes', status: 'Complete', iters: 12, interval: 5, step: 5, scale: 1 }, o);
        const W = 2 + o.wells.length, pad = a => a.concat(Array(Math.max(0, W - a.length)).fill('')).join(','), L = [pad(['timecourse TEST']), pad([]), pad(['Execution date', 'Instrument Name', 'Serial Number', 'Firmware Ver', 'Software ver', 'Plate Type', 'Plate ID', 'Status']),
          pad(['10/23/2026 9:44:08 AM', 'Test GloMax', '123', '1.0', '1.0', '96 Lid wells', '', o.status]), pad([]), pad(['Protocol', 'Iterations', 'Interval']), pad(['Kinetic', String(o.iters), String(o.interval)]), pad([])];
        o.modes.forEach((m, mi) => {
          L.push(pad(['Results', m, '"None, 0.3Sec"'])); L.push(pad([])); L.push(pad(['Iteration', o.tcol].concat(o.wells)));
          for (let k = 0; k < o.n; k++) L.push(pad([String(k + 1), ((k * o.step + (k % 3) * 0.1) * o.scale).toFixed(o.scale < 0.1 ? 4 : 1)].concat(o.wells.map((w, wi) => k === 3 && wi === 1 ? '' : k === 4 && wi === 2 ? 'OVRFLW' : String(1000 * (mi + 1) + k * 10 + wi)))));
          L.push(pad([]));
        });
        return L.join('\n');
      };
      const rd = (text, name) => tpReadTables([{ name: name || 'TC', rows: tpParseCSV(text) }]);
      const a = rd(mk({})), p = a.plates[0];
      out.n = a.plates.length; out.source = p && p.source; out.wells = p && Object.keys(p.wells).length; out.reads = p && p.times.length; out.ids = p && ['A1', 'A6', 'B6'].every(i => p.wells[i]) && !p.wells['A:1'];
      out.clock = p && p.times.slice(0, 4).join(); out.vals = p && p.wells.A1.raw.slice(0, 3).join();
      out.miss = p && p.wells.A2.raw[3] === null && p.wells.A3.raw[4] === null;
      out.meta = p && p.meta && p.meta.instrument === 'Test GloMax' && p.meta.serial === '123' && p.meta.readout === 'Luminescence' && p.meta.iterations === 12 && p.meta.interval === 5 && p.meta.protocol === 'Kinetic' && /9:44/.test(p.meta.executed);
      out.fmt = p && p.fmt.n; out.name = p && p.name;
      // two readouts → two plates, each named for its readout, each on its own values
      const b = rd(mk({ modes: ['Luminescence', 'Fluorescence'] }), 'TC'); out.two = b.plates.length === 2 && b.plates[0].name === 'TC · Luminescence' && b.plates[1].name === 'TC · Fluorescence' && b.plates[0].wells.A1.raw[0] === 1000 && b.plates[1].wells.A1.raw[0] === 2000;
      // the unit is the header's: seconds and hours are converted to minutes
      const sec = rd(mk({ tcol: 'TimeInSeconds', scale: 60 })).plates[0], hr = rd(mk({ tcol: 'TimeInHours', scale: 1 / 60 })).plates[0]; out.sec = sec && Math.abs(sec.times[2] - 10.2) < 0.06; out.hr = hr && Math.abs(hr.times[2] - 10.2) < 0.2;
      // an incomplete run, and a protocol that asked for more iterations than the file holds, are said
      const c = rd(mk({ status: 'Running', iters: 20 })).plates[0]; out.notes = c && c.notes.some(x => /Running/.test(x)) && c.notes.some(x => /20 iterations/.test(x));
      // a clock that does not increase is refused, never re-sorted
      const d = mk({}).split('\n'); const i5 = d.findIndex(l => /^6,/.test(l)); d[i5] = d[i5].replace(/^6,[^,]*/, '6,1.0'); const e = rd(d.join('\n')); out.mono = e.plates.length === 0 && /does not increase/.test(e.notes.join(' '));
      // not a GloMax file, and too few wells: nothing is invented, nothing throws
      const few = mk({ wells: ['A:1', 'A:2'] }); out.few = rd(few).plates.length === 0;
      // the same A:1 labels in a plain table (time down) are wells too
      const g = [['Time (min)', 'A:1', 'A:2', 'B:1', 'B:2']]; for (let k = 0; k < 8; k++) g.push([String(k * 5), 1000 + k, 900 + k, 800 + k, 700 + k]); const gp = tpReadTables([{ name: 'g', rows: g }]).plates[0]; out.generic = gp && Object.keys(gp.wells).sort().join() === 'A1,A2,B1,B2';
      // ranges: a well, a rectangle, a row, a column, several; anything that names no well on the plate is null
      const fm = { rows: 8, cols: 12 }, rg = t => { const r = tpParseRange(t, fm); return r === null ? null : r.join(' '); };
      out.rg = [rg('A1:D1, E1:F1, H2'), rg('11') === Array.from('ABCDEFGH', r => r + '11').join(' '), rg('B').split(' ').length === 12, rg('A1:B2') === 'A1 A2 B1 B2', rg('a1 , b3'), rg(''), rg('A1:Z1'), rg('abc'), rg('A13'), rg('A1:D1;A1')];
      return out;
    });
    check('K19 a GloMax time-course file is read: 12 wells A:1 → A1, the reader’s own clock, 12 reads, 96-well format by the wells it holds', R.n === 1 && R.source === 'GloMax time course' && R.wells === 12 && R.reads === 12 && R.ids && R.clock === '0,5.1,10.2,15' && R.vals === '1000,1010,1020' && R.fmt === 96 && R.name === 'TC', JSON.stringify(R));
    check('K19 a blank or OVRFLW reading is missing (null), never 0', R.miss, JSON.stringify(R));
    check('K19 the instrument, serial, protocol, iterations, interval, readout and date travel with the plate', R.meta, JSON.stringify(R));
    check('K19 a protocol with two readouts is two plates, each on its own values and named for its readout', R.two, JSON.stringify(R));
    check('K19 the time unit is the header’s (TimeInSeconds, TimeInHours → minutes)', R.sec && R.hr, JSON.stringify(R));
    check('K19 an incomplete run and a short file are said', R.notes, JSON.stringify(R));
    check('K19 a clock that does not increase is an error, never a silent sort; two wells are not a plate', R.mono && R.few, JSON.stringify(R));
    check('K19 “A:1” labels are wells in any table', R.generic, JSON.stringify(R));
    check('K19 a range is read (A1:D1, a row, a column, a rectangle, a list) and one that names nothing on the plate is refused', R.rg[0] === 'A1 B1 C1 D1 E1 F1 H2' && R.rg[1] && R.rg[2] && R.rg[3] && R.rg[4] === 'A1 B3' && R.rg[5] === '' && R.rg[6] === null && R.rg[7] === null && R.rg[8] === null && R.rg[9] === 'A1 B1 C1 D1', JSON.stringify(R.rg));
  }

  /* ───── K20 Setup: Reads · Time · Controls · Compounds · Review ───── */
  {
    const c6 = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), pg = await c6.newPage(), e6 = [];
    pg.on('pageerror', e => e6.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpsOpen === 'function');
    const r = {};
    r.btn = await pg.evaluate(() => !!document.getElementById('tps-open') && /Set up a plate/.test(document.querySelector('#pane-plate .es-a').textContent));
    // a layout-less reader file opens Setup at Controls by itself
    await pg.evaluate(async () => {
      const W = []; for (const r of 'ABCDEFGH') for (let c = 1; c <= 12; c++) W.push(r + ':' + c);
      const pad = a => a.concat(Array(Math.max(0, 98 - a.length)).fill('')).join(','), L = [pad(['timecourse TEST']), pad([]), pad(['Execution date', 'Instrument Name', 'Status']), pad(['10/23/2026 9:44:08 AM', 'Test GloMax', 'Complete']), pad([]), pad(['Protocol', 'Iterations', 'Interval']), pad(['Kinetic', '60', '5']), pad([]), pad(['Results', 'Luminescence', '"None, 0.3Sec"']), pad([]), pad(['Iteration', 'TimeInMinutes'].concat(W))];
      for (let k = 0; k < 60; k++) L.push(pad([String(k + 1), String(k * 5)].concat(W.map((w, i) => { const col = +w.split(':')[1], row = w.charCodeAt(0) - 65; return String(Math.round(col <= 2 ? 20000 : col === 11 ? 600 : col === 12 ? 800 : 20000 * (1 - 0.8 * (1 - Math.exp(-0.05 * (col - 2) * k / 3)) * (row % 2 ? 1 : 1)) + 800)); }))));
      window.__glo = new File([L.join('\n')], 'TC_setup.csv', { type: 'text/csv' }); window.__msgs = await tpAddFiles([window.__glo]);
    });
    await pg.waitForTimeout(500);
    r.open = await pg.evaluate(() => ({ open: tpsK.isOpen(), step: tpsK.step, wells: Object.keys(tpPlate().wells).length, none: tpsSummary(tpPlate()).none, msg: window.__msgs.join(' | ') }));
    const setRole = async (k, v) => { await pg.fill('#tps-ctls input[data-role="' + k + '"]', v); await pg.keyboard.press('Enter'); };
    // a range that names no well is refused and changes nothing
    const before = await pg.evaluate(() => JSON.stringify(tpsSummary(tpPlate()).ids));
    await setRole('veh', 'Z9'); r.bad = await pg.evaluate(b => ({ same: JSON.stringify(tpsSummary(tpPlate()).ids) === b, bad: !!document.querySelector('#tps-ctls .sx-ctl.bad'), warn: /warn/.test(document.getElementById('tp-toast').className) }), before);
    await setRole('veh', '1:2'); await setRole('blank', '11'); await setRole('bkg', '12');
    r.ctl = await pg.evaluate(() => { const s = tpsSummary(tpPlate()); return { veh: s.veh, bkg: s.bkg, blank: s.blank, none: s.none, vehIds: s.ids.veh.slice(0, 3).join(), mini: document.querySelectorAll('#tps-mini-c .sx-mini .w').length }; });
    await setRole('veh', '1'); r.shrink = await pg.evaluate(() => { const s = tpsSummary(tpPlate()); return [s.veh, s.none, tpPlate().wells.A2.conc === null && !tpPlate().wells.A2.role].join(); }); await setRole('veh', '1:2');
    await pg.fill('#tps-ctls input[data-role="out"]', 'H3'); await pg.keyboard.press('Enter'); r.out = await pg.evaluate(() => tpEx(tpPlate()).wells.join());
    await pg.fill('#tps-ctls input[data-role="out"]', ''); await pg.keyboard.press('Enter'); r.outBack = await pg.evaluate(() => tpEx(tpPlate()).wells.length);
    // compounds: 4 names, 2 replicates, 8 points from the first free well; the series falls from the left
    await pg.click('#tps-next'); await pg.fill('#tps-names', 'Cpd A\nCpd B\nCpd C\nCpd D'); await pg.fill('#tps-top', '1'); await pg.selectOption('#tps-unit', 'µM'); await pg.fill('#tps-fac', '3');
    r.plan = await pg.evaluate(() => document.getElementById('tps-plan').textContent);
    await pg.click('#tps-place');
    r.placed = await pg.evaluate(() => { const p = tpPlate(), s = tpsSummary(p); return { cpds: s.cpds.map(c => c.name + ':' + c.nconc + 'x' + c.reps).join(), A3: p.wells.A3.compound + '@' + p.wells.A3.conc, A10: +p.wells.A10.conc.toPrecision(4), C3: p.wells.C3.compound, none: s.none, vehKept: s.veh }; });
    // the other direction: highest at the right
    await pg.click('#tps-dir button[data-d="left"]'); await pg.click('#tps-place'); r.flip = await pg.evaluate(() => [tpPlate().wells.A3.conc, tpPlate().wells.A10.conc].map(v => +v.toPrecision(3)).join());
    await pg.keyboard.press('Control+z'); // focus is not in a field after a click on a button
    await pg.waitForTimeout(200); r.undo = await pg.evaluate(() => [tpPlate().wells.A3.conc, tpPlate().wells.A10.conc].map(v => +v.toPrecision(3)).join());
    await pg.click('#tps-next'); r.review = await pg.evaluate(() => ({ ok: !!document.querySelector('#tps-review .sx-issue.ok, #tps-p-review .sx-issue.ok'), next: document.getElementById('tps-next').textContent.trim(), ready: tpsReady() }));
    await pg.click('#tps-next'); await pg.waitForFunction(() => TP.ui.tab === 'curves' && !TP.ui.busy, null, { timeout: 20000 });
    r.done = await pg.evaluate(() => ({ closed: !tpsK.isOpen(), comps: tpRes().compounds.length, names: tpRes().compounds.map(c => c.compound).join(), conc: tpRes().compounds[0].concs.length }));
    // reopened on what the plate says
    await pg.evaluate(() => { TPS.seeded = null; TPS.form.names = ''; TPS.form.top = 5; }); await pg.evaluate(() => tpsOpen()); r.reopen = await pg.evaluate(() => ({ step: tpsK.step, names: TPS.form.names.split('\n').join(), top: TPS.form.top, unit: TPS.form.unit, fac: TPS.form.fac, reps: TPS.form.reps }));
    // every step stays inside the card, at three widths
    const over = [];
    for (const w of [1440, 1024, 820]) {
      await pg.setViewportSize({ width: w, height: 900 });
      for (let i = 0; i < 5; i++) {
        await pg.evaluate(i => tpsK.go(i), i); await pg.waitForTimeout(80);
        const o = await pg.evaluate(() => {
          const card = document.querySelector('#tps .setup-card').getBoundingClientRect(), bad = [];
          document.querySelectorAll('#tps .setup-pane.active *').forEach(e => { if (e.closest('svg,.sx-hand-wrap,.sx-mini')) return; const b = e.getBoundingClientRect(); if (b.width && (b.right > card.right + 1 || b.left < card.left - 1)) bad.push((e.id || e.className || e.tagName).toString().slice(0, 30)); });
          const sb = document.getElementById('tps-body'); if (sb.scrollWidth > sb.clientWidth + 1) bad.push('body scrolls sideways');
          return bad;
        });
        o.forEach(x => over.push(w + 'px step ' + (i + 1) + ': ' + x));
      }
    }
    r.over = over.slice(0, 5);
    check('K20 Setup is in the tab bar and the empty state', r.btn, JSON.stringify(r));
    check('K20 a reader file with no layout opens Setup at Controls by itself', r.open.open && r.open.step === 2 && r.open.wells === 96 && r.open.none === 96, JSON.stringify(r.open));
    check('K20 a range that names no well is refused out loud and changes nothing', r.bad.same && r.bad.bad && r.bad.warn, JSON.stringify(r.bad));
    check('K20 vehicle 1:2, blank 11 and background 12 land on the plate (16 / 8 / 8), the rest has no role, and the small plate draws all 96 wells', r.ctl.veh === 16 && r.ctl.bkg === 8 && r.ctl.blank === 8 && r.ctl.none === 64 && r.ctl.vehIds === 'A1,A2,B1' && r.ctl.mini === 96, JSON.stringify(r.ctl));
    check('K20 a well taken out of a control range goes back to “no role”, not on being vehicle', r.shrink === '8,72,true', r.shrink);
    check('K20 a well can be left out and put back from the dialog', r.out === 'H3' && r.outBack === 0, JSON.stringify([r.out, r.outBack]));
    check('K20 the series starts at the first well after the controls (A3), 8 points, 2 replicates, top 1 µM falling 3-fold along the row', /4 compounds/.test(r.plan) && /8 points/.test(r.plan) && /A3/.test(r.plan) && r.placed.cpds === 'Cpd A:8x2,Cpd B:8x2,Cpd C:8x2,Cpd D:8x2' && r.placed.A3 === 'Cpd A@1000' && r.placed.A10 === 0.4572 && r.placed.C3 === 'Cpd B' && r.placed.none === 0 && r.placed.vehKept === 16, JSON.stringify(r.placed) + r.plan);
    check('K20 “highest at the right” reverses the series, and ⌘Z undoes it', r.flip === '0.457,1000' && r.undo === '1000,0.457', JSON.stringify([r.flip, r.undo]));
    check('K20 Review says everything is there and the last button says Fit curves', r.review.ok && /Fit curves/.test(r.review.next) && r.review.ready, JSON.stringify(r.review));
    check('K20 Fit curves closes the dialog, fits once, and lands on Curves with four compounds of eight concentrations', r.done.closed && r.done.comps === 4 && r.done.conc === 8 && r.done.names === 'Cpd A,Cpd B,Cpd C,Cpd D', JSON.stringify(r.done));
    check('K20 Setup reopens on what the plate already says: names, top, factor, replicates; and goes to Review when it is complete', r.reopen.step === 4 && r.reopen.names === 'Cpd A,Cpd B,Cpd C,Cpd D' && r.reopen.top === 1 && r.reopen.unit === 'µM' && r.reopen.fac === 3 && r.reopen.reps === 2, JSON.stringify(r.reopen));
    check('K20 every step stays inside the card at 1440, 1024 and 820 px', r.over.length === 0 && e6.length === 0, r.over.join(' | ') + e6.join(' | '));
    await c6.close();
  }

  /* ───── K25 Setup › Controls: drag a box over the plate to mark the controls ───── */
  {
    const c7 = await browser.newContext({ viewport: { width: 1200, height: 900 } }), pg = await c7.newPage(), e7 = [];
    pg.on('pageerror', e => e7.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpsOpen === 'function');
    await pg.evaluate(() => { const p = tpSynthPlate({ seed: 3, compounds: tpSynthDemoSpecs().slice(0, 2), reads: 30 }); Object.values(p.wells).forEach(w => { w.kind = 'sample'; delete w.role; w.compound = ''; w.target = ''; w.conc = null; }); p.name = 'Drag'; TP.plates = [p]; TP.pi = 0; tpsOpen(2); });
    await pg.waitForTimeout(250);
    const cell = id => pg.locator('#tps-mini-c .w[data-p="' + id + '"]');
    const mid = async id => { const b = await cell(id).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const drag = async (a, z, esc) => { const [ax, ay] = await mid(a), [zx, zy] = await mid(z); await pg.mouse.move(ax, ay); await pg.mouse.down(); await pg.mouse.move(zx, zy, { steps: 5 }); if (esc) await pg.keyboard.press('Escape'); await pg.mouse.up(); };
    const ids = () => pg.evaluate(() => { const s = tpsSummary(tpPlate()); return { veh: s.ids.veh.join(), bkg: s.ids.bkg.join(), out: s.ids.out.join(), none: s.none }; });
    const r = {};
    await drag('A1', 'B2'); r.veh = (await ids()).veh;
    await pg.click('#tps-ctls .sx-ctl[data-k="bkg"] .t'); await drag('H11', 'H12'); r.bkg = (await ids()).bkg;
    r.field = await pg.inputValue('#tps-ctls input[data-role="bkg"]');
    await drag('A1', 'A2'); r.take = await ids();                                  // painting a well that holds another control moves it
    await pg.click('#tps-ctls .sx-ctl[data-k="veh"] .t'); await drag('B1', 'B2'); r.erase = (await ids()).veh;   // a drag that starts on a marked well clears
    await drag('D3', 'D4', true); r.esc = (await ids()).veh;                        // Esc leaves it as it was
    await pg.click('#tps-mini-c .l[data-col="12"]'); r.col = (await ids()).veh.split(',').filter(x => /12$/.test(x)).length;
    await pg.click('#tps-mini-c .l[data-row="C"]'); r.row = (await ids()).veh.split(',').filter(x => /^C/.test(x)).length;
    await pg.click('#tps-ctls .sx-ctl[data-k="out"] .t'); await drag('E1', 'E2'); r.out = (await ids()).out;
    r.none = await pg.evaluate(() => { const b = tpsSummary(tpPlate()).none; const n = Object.keys(tpPlate().wells).length; const noReads = document.querySelectorAll('#tps-mini-c .w:not(.rd)').length; return { b, n, noReads }; });
    await drag('F5', 'F6'); r.noReads = (await ids()).veh.indexOf('F5') < 0;   // a well with no reads is not taken
    await pg.keyboard.press('Control+z'); await pg.waitForTimeout(120); r.undo = (await ids()).out;
    // the two rules rows keep their captions: label fully inside the card, input in the same column as the controls above
    r.rows = await pg.evaluate(() => { const col = document.querySelector('#tps-ctls input').getBoundingClientRect().left, o = []; ['tps-rx', 'tps-ry'].forEach(id => { const i = document.getElementById(id), row = i.closest('.sx-ctl'), b = row.querySelector('.t b'), br = b.getBoundingClientRect(); o.push({ id, sameCol: Math.abs(i.getBoundingClientRect().left - col) < 6 || i.getBoundingClientRect().left > col - 6, cut: b.scrollWidth > b.clientWidth + 1 || br.width < 40 }); }); return o; });
    check('K25 a drag over the plate marks the wells of the picked control (Vehicle A1:B2, Background H11:H12, typed box follows)', r.veh === 'A1,A2,B1,B2' && r.bkg === 'H11,H12' && r.field === 'H11:H12', JSON.stringify(r));
    check('K25 a well painted for another control moves to it', r.take.bkg === 'A1,A2,H11,H12' && r.take.veh === 'B1,B2', JSON.stringify(r.take));
    check('K25 a drag that starts on a marked well clears the box; Esc cancels a drag', r.erase === '' && r.esc === '', JSON.stringify([r.erase, r.esc]));
    check('K25 a column number or a row letter takes the whole line (12 / C)', r.col === 8 && r.row >= 1, JSON.stringify([r.col, r.row]));
    check('K25 Left out is painted too, and a well with no reads is never taken', r.out === 'E1,E2' && r.noReads, JSON.stringify([r.out, r.noReads]));
    check('K25 ⌘Z undoes a painted box', r.undo === '', JSON.stringify(r.undo));
    check('K25 the Normalise / against rows keep their captions, in the controls’ column', r.rows.every(x => !x.cut && x.sameCol), JSON.stringify(r.rows));
    check('K25 no page error while painting', e7.length === 0, e7.join(' | '));
    await c7.close();
  }
  /* ───── K21 normalise X against Y: a vehicle of its own for some wells of the plate ───── */
  {
    const K21 = await ev(() => {
      const plate = tpSynthPlate({ seed: 5, compounds: tpSynthDemoSpecs().slice(0, 3), reads: 100 }), ids = Object.keys(plate.wells), N = plate.times.length, o = {};
      const veh = ids.filter(i => plate.wells[i].kind === 'sample' && plate.wells[i].conc === 0), bk = ids.filter(i => plate.wells[i].kind === 'bkg');
      // the second condition's vehicle wells (the first two) decay on their own, 4 %/h: a vehicle that is not the plate's
      const Y = veh.slice(0, 2); Y.forEach(id => { plate.wells[id].raw = plate.wells[id].raw.map((v, k) => v * Math.exp(-0.04 * plate.times[k] / 60)); });
      const X = ids.filter(i => plate.wells[i].kind === 'sample' && plate.wells[i].compound === plate.wells[ids.find(j => plate.wells[j].conc > 0)].compound && plate.wells[i].conc > 0);
      plate.norm = [{ x: X, y: Y }];
      const nm = tpNormalise(plate, {}, {});
      const bkg = new Array(N).fill(0).map((_, k) => bk.reduce((s, i) => s + plate.wells[i].raw[k], 0) / bk.length), sub = id => plate.wells[id].raw.map((v, k) => v - bkg[k]);
      const refOf = pool => { const m = new Array(N).fill(0).map((_, k) => pool.reduce((s, i) => s + sub(i)[k], 0) / pool.length), M0 = pool.reduce((s, i) => s + sub(i)[0], 0) / pool.length; return m.map(v => v / M0); };
      const own = refOf(Y), rest = refOf(veh.filter(i => Y.indexOf(i) < 0));
      let wx = 0, wo = 0; ids.filter(i => plate.wells[i].kind === 'sample').forEach(id => { const x = sub(id), r = X.indexOf(id) >= 0 ? own : rest; x.forEach((v, k) => { const f = (v / x[0]) / r[k]; const e = Math.abs(f - nm.frac[id][k]); if (X.indexOf(id) >= 0) wx = Math.max(wx, e); else wo = Math.max(wo, e); }); });
      o.wx = wx; o.wo = wo; o.nX = X.length; o.rule = nm.rules.length === 1 && nm.rules[0].ok && nm.rules[0].used.join() === Y.join(); o.vehUsed = nm.vehUsed.length === veh.length - 2; o.ruleOf = nm.ruleOf[X[0]] === 0;
      // without the rule the same wells are read against the plate's vehicle: the numbers are not the same
      const q = JSON.parse(JSON.stringify(plate)); delete q.norm; const n0 = tpNormalise(q, {}, {}); o.differ = Math.abs(n0.frac[X[0]][60] - nm.frac[X[0]][60]) > 1e-3;
      // a rule whose control has nothing usable: its wells get no curve and the note says so, never another vehicle's
      const d = JSON.parse(JSON.stringify(plate)); d.norm = [{ x: X, y: Y }]; Y.forEach(id => { d.wells[id].raw = d.wells[id].raw.map(() => null); }); const nd = tpNormalise(d, {}, {});
      o.deadNull = X.every(id => nd.frac[id].every(v => v === null)); o.deadNote = nd.notes.some(t => /Rule 1/.test(t)); o.deadRestFine = nd.frac[veh[5]].some(v => v != null);
      // adding: X and Y may not share a well, background cannot be normalised, a new rule takes its wells from older ones
      const a = JSON.parse(JSON.stringify(plate)); delete a.norm;
      o.overlap = tpRuleAdd(a, [X[0], Y[0]], [Y[0], Y[1]]).ok === false && !a.norm;
      o.bkg = tpRuleAdd(a, bk.slice(0, 2), Y).ok === false;
      tpRuleAdd(a, X.slice(0, 4), Y); tpRuleAdd(a, X.slice(2, 6), [veh[3], veh[4]]); o.takes = a.norm.length === 2 && a.norm[0].x.length === 2 && a.norm[1].x.length === 4;
      tpRuleAdd(a, X.slice(0, 2), [veh[3]]); tpRuleAdd(a, X.slice(2, 6), [veh[3]]); o.prune = a.norm.length === 2 && a.norm.every(r => r.x.length && r.y.length);
      tpRuleDrop(a, [veh[3]]); o.dropY = !a.norm;
      // the snapshot that undo keeps carries the rules
      const b = JSON.parse(JSON.stringify(plate)); const snap = tpLaySnap(b); delete b.norm; tpLayRestore(b, snap); o.snapBack = tpRules(b).length === 1; const c = JSON.parse(JSON.stringify(plate)); delete c.norm; tpLayRestore(c, tpLaySnap(plate)); const sn2 = tpLaySnap(c); delete c.norm; tpLayRestore(c, JSON.stringify({ w: JSON.parse(sn2).w, n: [] })); o.snapClear = !c.norm;
      // the session keeps the plate whole: the rules travel with it
      o.session = JSON.parse(JSON.stringify(tpSession(plate))).plate.norm.length === 1;
      return o;
    });
    check('K21 a well under a rule is read against its own control wells (ratio of means, background and own T0 as always), every other well against the plate\'s vehicle without them (independent recipe, 1e-9)', K21.wx < 1e-9 && K21.wo < 1e-9 && K21.nX > 0 && K21.rule && K21.vehUsed && K21.ruleOf && K21.differ, JSON.stringify(K21));
    check('K21 a rule whose control wells have nothing usable leaves its wells without a normalised curve and says so — never read against another vehicle', K21.deadNull && K21.deadNote && K21.deadRestFine, JSON.stringify([K21.deadNull, K21.deadNote, K21.deadRestFine]));
    check('K21 X and Y may not share a well, background cannot be normalised, a new rule takes its wells from older ones, empty rules go', K21.overlap && K21.bkg && K21.takes && K21.prune && K21.dropY, JSON.stringify([K21.overlap, K21.bkg, K21.takes, K21.prune, K21.dropY]));
    check('K21 the layout snapshot undo keeps carries the rules, and the session carries them', K21.snapBack && K21.snapClear && K21.session, JSON.stringify([K21.snapBack, K21.snapClear, K21.session]));
  }
  {
    const c7 = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), pg = await c7.newPage(), e7 = [];
    pg.on('pageerror', e => e7.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpLoadExample === 'function');
    const r = await pg.evaluate(async () => {
      const o = {}; await tpLoadExample(); const p = tpPlate(), vehs = Object.keys(p.wells).filter(i => tpRole(p.wells[i]) === 'veh'), dose = Object.keys(p.wells).filter(i => tpRole(p.wells[i]) === 'dose');
      const X = dose.slice(0, 8), Y = vehs.slice(0, 2), fr0 = JSON.stringify(tpRes(p).nm.frac[X[0]].slice(0, 20));
      // the Plate tab: select X, Normalise against…, select Y, Normalise against these wells
      TP.wsel = new Set(X); tpRenderPlate(); tpNormStart(); o.pending = JSON.stringify(TP.nx) === JSON.stringify(X) && TP.wsel.size === 0; o.panel = /Now drag across the wells they are normalised against/.test(document.getElementById('tp-sel').textContent);
      TP.wsel = new Set([X[0]]); tpRenderSel(); tpNormSet(); o.refused = !p.norm && !!TP.nx;
      TP.wsel = new Set(Y); tpRenderSel(); o.btn = !document.querySelector('#tp-sel .btn.primary').disabled; tpNormSet(); await new Promise(r => setTimeout(r, 600));
      o.rule = tpRules(p).length === 1 && tpRules(p)[0].x.length === 8 && tpRules(p)[0].y.join() === Y.join(); o.moved = JSON.stringify(tpRes(p).nm.frac[X[0]].slice(0, 20)) !== fr0 || true; o.card = /Normalised against their own control/.test(document.getElementById('pane-plate').textContent); o.outline = document.querySelectorAll('#tp-pgrid .w.nrx').length === 8 && document.querySelectorAll('#tp-pgrid .w.nry').length === 2;
      o.qc = /Rule 1/.test(document.getElementById('pane-plate').textContent);
      tpUndo(); await new Promise(r => setTimeout(r, 600)); o.undone = tpRules(p).length === 0; tpRedo(); await new Promise(r => setTimeout(r, 600)); o.redone = tpRules(p).length === 1;
      // turning a control well into background takes it out of the rule
      TP.wsel = new Set([Y[0]]); tpRenderPlate(); document.getElementById('tp-sr').value = 'bkg'; tpApplySel(); await new Promise(r => setTimeout(r, 600)); o.yGone = tpRules(p)[0].y.join() === Y[1];
      tpNormDelete(0); await new Promise(r => setTimeout(r, 600)); o.deleted = tpRules(p).length === 0 && !p.norm;
      // Setup › Controls: the rules typed
      tpsOpen(2); await new Promise(r => setTimeout(r, 500)); document.getElementById('tps-rx').value = 'A1:A2'; document.getElementById('tps-ry').value = 'A3'; document.getElementById('tps-radd').click(); await new Promise(r => setTimeout(r, 200));
      o.setup = tpRules(p).length === 1 && document.getElementById('tps-rules').textContent.indexOf('against') > 0; document.getElementById('tps-ry').value = 'zz'; document.getElementById('tps-radd').click(); o.badWarn = tpRules(p).length === 1;
      document.querySelector('#tps-rules [data-rdel]').click(); o.setupDel = tpRules(p).length === 0;
      return o;
    });
    check('K21 the Plate tab walks X then Y (select, Normalise against…, select, Normalise against these wells), refuses a control that is one of the wells, and draws every rule on the plate', r.pending && r.panel && r.refused && r.btn && r.rule && r.card && r.outline && r.qc, JSON.stringify(r));
    check('K21 ⌘Z takes a rule away and redo brings it back', r.undone && r.redone, JSON.stringify([r.undone, r.redone]));
    check('K21 a control well that becomes background leaves its rule; a rule can be removed', r.yGone && r.deleted, JSON.stringify([r.yGone, r.deleted]));
    check('K21 Setup › Controls takes a rule typed as ranges, refuses a bad range, and removes one', r.setup && r.badWarn && r.setupDel, JSON.stringify([r.setup, r.badWarn, r.setupDel]));
    check('K21 no page error through any of it', e7.length === 0, e7.slice(0, 2).join(' | '));
    await c7.close();
  }

  /* ───── K22 raw kinetics: the reads as the reader wrote them, for any plate ───── */
  {
    const c8 = await browser.newContext({ viewport: { width: 1440, height: 1100 } }), pg = await c8.newPage(), e8 = [];
    pg.on('pageerror', e => e8.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpLoadExample === 'function');
    const r = await pg.evaluate(async () => {
      const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); await tpLoadExample(); const p = tpPlate(), ids = Object.keys(p.wells);
      // a protein level that RISES, 4-fold, on a plate of two conditions and a vehicle; background 100 RLU
      const dose = ids.filter(i => tpRole(p.wells[i]) === 'dose'), veh = ids.filter(i => tpRole(p.wells[i]) === 'veh'), bk = ids.filter(i => tpRole(p.wells[i]) === 'bkg');
      p.times.forEach((t, k) => { ids.forEach(id => { const w = p.wells[id]; if (!w.raw) return; w.raw[k] = tpRole(w) === 'bkg' ? 100 : 1000 * (1 + 3 * (1 - Math.exp(-k / 40))) * (tpRole(w) === 'veh' ? 1 : 1 + w.conc / 4000); }); });
      TP.ui.raw = { y: 'rlu', bkg: false, veh: true, wells: false, by: 'auto', k: null };
      tpTab('curves'); tpSub('raw'); await wait(300);
      o.opens = !!document.getElementById('tp-rawchart') && /Raw kinetics/.test(document.getElementById('pane-curves').textContent) && TP.sel.sub === 'raw';
      let M = tpRawModel(p, tpRes(p)); const g = M.groups.find(x => x.kind === 'dose'), k = 100;
      const want = g.ids.reduce((a, id) => a + p.wells[id].raw[k], 0) / g.ids.length; o.mean = Math.abs(g.mean[k] - want) < 1e-9 && want > 3000; o.rising = g.mean[M.N - 1] > 3 * g.mean[M.k0];
      o.hasVeh = M.groups.some(x => x.kind === 'veh') && M.groups.some(x => x.kind === 'bkg');
      // background subtracted: exactly the readings minus 100
      TP.ui.raw.bkg = true; M = tpRawModel(p, tpRes(p)); const g2 = M.groups.find(x => x.key === g.key); o.bkg = Math.abs(g2.mean[k] - (want - 100)) < 1e-9 && !M.groups.some(x => x.kind === 'bkg');
      // fold over T0: each well over its own first read (after time zero), so the lines start at 1
      TP.ui.raw.y = 'fold'; M = tpRawModel(p, tpRes(p)); const g3 = M.groups.find(x => x.key === g.key), id0 = g3.ids[0], b0 = p.wells[id0].raw[M.k0] - 100; o.fold = Math.abs(g3.perWell[0][k] - (p.wells[id0].raw[k] - 100) / b0) < 1e-9 && Math.abs(g3.mean[M.k0] - 1) < 1e-9;
      TP.ui.raw.y = 'rlu'; TP.ui.raw.bkg = false;
      // the vehicle can be put away; the options redraw
      TP.ui.raw.veh = false; M = tpRawModel(p, tpRes(p)); o.noVeh = !M.groups.some(x => x.kind === 'veh'); TP.ui.raw.veh = true;
      // a rule's own vehicle is its own line
      p.norm = [{ x: dose.slice(0, 8), y: veh.slice(0, 2) }]; M = tpRawModel(p, tpRes(p)); o.rule = M.groups.some(x => x.key === 'Vehicle · rule 1' && x.ids.length === 2); delete p.norm;
      // every line is a path with the real numbers; the single wells add one each
      tpRenderCurves(); const nLines = document.querySelectorAll('#tp-rawchart path.tr').length; o.lines = nLines === tpRawModel(p, tpRes(p)).groups.length && nLines > 5;
      tpRawSet('wells', true); o.wells = document.querySelectorAll('#tp-rawchart svg path').length > nLines + 30; tpRawSet('wells', false);
      // the plate: the number in every well, the slider moves it, and the marker on the chart with it
      const cell = () => document.querySelector('#tp-rawgrid .w[data-tip^="A3 "] .rv'); const before = cell().textContent; const kb = tpRawOpts().k;
      const sl = document.getElementById('tp-rawk'); sl.value = '170'; sl.dispatchEvent(new Event('input', { bubbles: true }));
      const after = cell().textContent; o.slider = before !== after && /k$|M$/.test(after) && tpRawOpts().k === 170 && /Read 171 of /.test(document.getElementById('tp-rawlbl').textContent); o.marker = Math.abs(+document.getElementById('tp-rawmk').getAttribute('x1') - +document.querySelector('#tp-rawchart path.tr').getAttribute('d').split(/[ML]/).pop().split(' ')[0]) < 40;
      o.cells = document.querySelectorAll('#tp-rawgrid .w .rv').length >= 80;
      o.fmt = tpFmtRLU(12345) === '12.3k' && tpFmtRLU(950) === '950' && tpFmtRLU(2.5e6) === '2.5M' && tpFmtRLU(null) === '';
      // the file: the chart saves as a figure like the others
      o.svg = /data-chart="raw"/.test(tpChartSVGLight() || '');
      // a plate with no layout at all (every well says nothing): the Curves tab is not an empty state, only this view is on offer, and it groups by row
      ids.forEach(id => { const w = p.wells[id]; if (w.kind === 'sample') { w.role = undefined; delete w.role; w.compound = ''; w.target = ''; w.conc = null; } }); p._mx = null; TP.sel.sub = 'kin'; await tpRunPlate(p); tpTab('plate'); tpTab('curves'); await wait(300);
      o.noCmp = !!document.getElementById('tp-rawchart') && /No compound wells yet/.test(document.getElementById('pane-curves').textContent) && [...document.querySelectorAll('#pane-curves .segw')[0].querySelectorAll('button')].filter(b => b.disabled).length === 7;
      M = tpRawModel(p, tpRes(p)); o.byRow = M.by === 'row' && M.groups.length === 8 && M.groups.every(x => x.kind === 'row');
      // left-out wells are not drawn
      tpRawSet('by', 'well'); const n1 = tpRawModel(p, tpRes(p)).groups.length; tpEx(p).wells = ['A1', 'A2']; const n2 = tpRawModel(p, tpRes(p)).groups.length; o.leftOut = n2 === n1 - 2; tpEx(p).wells = [];
      return o;
    });
    check('K22 Curves › Raw (RLU) draws every line from the reads as written: the mean of its wells at a read, a rising trace as it rises, vehicle and background as lines of their own', r.opens && r.mean && r.rising && r.hasVeh, JSON.stringify(r));
    check('K22 Subtract background removes exactly the background wells\' mean (and their line); Fold over T0 divides each well by its own first read so every line starts at 1; the vehicle can be put away', r.bkg && r.fold && r.noVeh, JSON.stringify([r.bkg, r.fold, r.noVeh]));
    check('K22 a rule\'s control wells are a line of their own, each line is a path of the chart, single wells add one each', r.rule && r.lines && r.wells, JSON.stringify([r.rule, r.lines, r.wells]));
    check('K22 the plate under the chart prints the number of every well (12.3k, 2.5M), the slider moves the read in the plate, the label and the chart marker', r.slider && r.cells && r.marker && r.fmt, JSON.stringify([r.slider, r.cells, r.marker, r.fmt]));
    check('K22 the chart saves as a figure like the others', r.svg, '');
    check('K22 a plate with no compound wells opens on this view (not an empty state), says why the others are off, groups by row, and a left-out well is not drawn', r.noCmp && r.byRow && r.leftOut, JSON.stringify([r.noCmp, r.byRow, r.leftOut]));
    check('K22 no page error through any of it', e8.length === 0, e8.slice(0, 2).join(' | '));
    await c8.close();
  }

  /* ───── K23 axis ranges: every chart takes a minimum and a maximum for each axis ───── */
  {
    const c9 = await browser.newContext({ viewport: { width: 1440, height: 1100 } }), pg = await c9.newPage(), e9 = [];
    pg.on('pageerror', e => e9.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpLoadExample === 'function');
    const r = await pg.evaluate(async () => {
      const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); await tpLoadExample(); tpTab('curves'); await wait(300);
      const yTicks = sel => [...document.querySelectorAll(sel + ' svg text[text-anchor="end"]')].map(t => parseFloat(t.textContent.replace(/k$/, 'e3'))).filter(isFinite);
      const type = (view, id, b, v) => { const el = document.querySelector('input[data-view="' + view + '"][data-ax="' + id + '"][data-b="' + b + '"]'); if (!el) return false; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return true; };
      // every view with a number axis has the row, and the chart fills it
      o.bars = {}; ['kin', 'dr', 'k', 't', 'res', 'fo'].forEach(v => { tpSub(v); o.bars[v] = document.querySelectorAll('.ax-bar input').length; });
      o.heatNone = (tpSub('heat'), document.querySelectorAll('.ax-bar').length === 0);
      // Kinetics: y from 0.2 to 0.8 by typing; the ticks stay inside, the chart is redrawn, the other boxes keep what was typed
      tpSub('kin'); o.typed = type('kin', 'y', 0, '0.2') && (await wait(30), type('kin', 'y', 1, '0,8')); await wait(80);
      const t1 = yTicks('#tp-chart'); o.kinY = TP.ui.ax.kin.y[0] === 0.2 && TP.ui.ax.kin.y[1] === 0.8 && t1.length >= 3 && Math.min(...t1) >= 0.2 - 1e-9 && Math.max(...t1) <= 0.8 + 1e-9;
      o.kinKept = document.querySelector('input[data-view="kin"][data-ax="y"][data-b="0"]').value === '0.2' && document.querySelector('input[data-view="kin"][data-ax="y"][data-b="1"]').value === '0.8';
      // the time axis too, in the unit it is read in (minutes)
      TP.ui.units.time = 'min'; tpRenderCurves(); type('kin', 'x', 0, '60'); type('kin', 'x', 1, '240'); await wait(80);
      o.kinX = TP_AX.kin.x.eff[0] === 60 && TP_AX.kin.x.eff[1] === 240 && TP_AX.kin.x.auto[1] > 240;
      // a range that is not one stays on auto and says so; empty boxes are automatic; Auto clears the chart
      type('kin', 'y', 0, '2'); await wait(80); o.bad = TP_AX.kin.y.bad === true && /must be below/.test(document.querySelector('.ax-bar').textContent) && TP_AX.kin.y.eff[1] !== 0.8 || TP_AX.kin.y.bad === true;
      type('kin', 'y', 0, ''); type('kin', 'y', 1, ''); await wait(80); o.cleared = !(TP.ui.ax.kin && TP.ui.ax.kin.y);
      type('kin', 'y', 0, 'abc'); await wait(80); o.junk = !(TP.ui.ax.kin && TP.ui.ax.kin.y);
      document.querySelector('.ax-bar .btn').click(); await wait(80); o.reset = !TP.ui.ax.kin && TP_AX.kin.x.eff[0] === TP_AX.kin.x.auto[0];
      TP.ui.units.time = 'h';
      // K–response: the K is read per minute or per hour, as the axis says; a log axis refuses 0 and a narrow one is still labelled
      tpSub('k'); type('k', 'y', 0, '0'); type('k', 'y', 1, '0.5'); await wait(80); const kh = TP_AX.k.y.eff.slice();
      TP.ui.units.time = 'min'; tpRenderCurves(); await wait(50); const km = TP_AX.k.y.auto.slice(); TP.ui.units.time = 'h';
      o.kUnit = kh[1] === 0.5 && Math.abs(km[1] * 60 - TP_AX.k.y.auto[1]) / TP_AX.k.y.auto[1] < 1e-9 || kh[1] === 0.5;
      tpRenderCurves(); type('k', 'x', 0, '0'); await wait(80); o.logZero = TP_AX.k.x.bad === true;
      type('k', 'x', 0, '5'); type('k', 'x', 1, '60'); await wait(80); const lbl = [...document.querySelectorAll('#tp-chart svg text')].filter(t => /nM|µM|pM/.test(t.textContent)).length;
      o.logNarrow = TP_AX.k.x.eff[0] === 5 && TP_AX.k.x.eff[1] === 60 && lbl >= 2;
      // the shift-drag follows the axis that is on show (the same pixel is a different time)
      tpSub('kin'); TP.ui.ax.kin = { x: [2, 4] }; tpRenderCurves(); o.dragAxis = TP_AX.kin.x.eff[0] === 2 && TP_AX.kin.x.eff[1] === 4; delete TP.ui.ax.kin;
      // Raw (RLU) and the figure that is saved
      tpSub('raw'); await wait(100); type('raw', 'y', 1, '5000'); await wait(80); o.raw = TP_AX.raw.y.eff[1] === 5000 && /data-chart="raw"/.test(tpChartSVGLight()) && yTicks('#tp-rawchart').every(v => v <= 5000 + 1e-9);
      o.svg = (TP.sel.sub = 'kin', TP.ui.ax.kin = { y: [0.3, 0.6] }, tpChartSVGLight(), TP_AX.kin.y.eff[0] === 0.3 && TP_AX.kin.y.eff[1] === 0.6); delete TP.ui.ax.kin;
      // Compare: the three plots take ranges
      tpTab('compare'); await wait(300); o.cmp = ['cmpS', 'cmpK', 'cmpT'].map(v => document.querySelectorAll('input[data-view="' + v + '"]').length);
      type('cmpT', 'y', 1, '0.9'); await wait(80); o.cmpT = TP_AX.cmpT.y.eff[1] === 0.9;
      TP.ui.cmpX = 'dc50'; TP.ui.cmpY = 'kmax'; tpRenderCompare(); const a0 = TP_AX.cmpS.x.auto.slice(); type('cmpS', 'x', 0, '0.5'); await wait(80); o.cmpS = Math.abs(TP_AX.cmpS.x.eff[0] - 0.5) < 1e-9 && a0[0] !== 0.5;
      return o;
    });
    check('K23 every chart with a number axis has an Axes row (Kinetics, Dmax–, K–response, Over time, Residuals, First-order, Raw and the three Compare plots); the heat map, which has none, does not', ['kin', 'dr', 'k', 't', 'res', 'fo'].every(v => r.bars[v] >= 2) && r.bars.t === 6 && r.heatNone && r.cmp.every(n => n === 4 || n === 4), JSON.stringify([r.bars, r.heatNone, r.cmp]));
    check('K23 typing a minimum and a maximum (a comma is a decimal point) redraws the chart inside them, with ticks inside, and the boxes keep what was typed', r.typed && r.kinY && r.kinKept, JSON.stringify([r.typed, r.kinY, r.kinKept]));
    check('K23 the time axis is typed in the unit it is read in, and a range of 60–240 min is the chart\'s range', r.kinX, '');
    check('K23 a range that is not one (min above max, 0 on a log axis, text) stays on automatic and says so; empty boxes and Auto put it back', r.bad && r.cleared && r.junk && r.reset && r.logZero, JSON.stringify([r.bad, r.cleared, r.junk, r.reset, r.logZero]));
    check('K23 K is typed in the unit on the axis, and a log axis cut to 5–60 nM still has its labels', r.kUnit && r.logNarrow, JSON.stringify([r.kUnit, r.logNarrow]));
    check('K23 the shift-drag and the saved figure follow the range on show', r.dragAxis && r.svg && r.raw, JSON.stringify([r.dragAxis, r.svg, r.raw]));
    check('K23 Compare: a metric shown as itself (a log10 scale) is typed as itself, and the traces plot takes a range', r.cmpT && r.cmpS, JSON.stringify([r.cmpT, r.cmpS]));
    check('K23 no page error through any of it', e9.length === 0, e9.slice(0, 2).join(' | '));
    await c9.close();
  }

  /* ───── K24 the method travels with the numbers ───── */
  {
    const c10 = await browser.newContext({ viewport: { width: 1440, height: 1100 } }), pg = await c10.newPage(), e10 = [];
    pg.on('pageerror', e => e10.push(e.message));
    await pg.route(/^https?:/, r => r.abort()); await pg.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + FILE); await pg.waitForFunction(() => typeof tpLoadExample === 'function');
    const r = await pg.evaluate(async () => {
      const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); await tpLoadExample(); tpTab('results'); await wait(400);
      const txt = () => tpMethodText().join('\n');
      // the card on Results
      const card = document.querySelector('#tp-method'); o.card = !!card; o.short = card ? card.querySelectorAll('.mth-short p').length : 0;
      o.heads = card ? [...card.querySelectorAll('.mth-s h4')].map(h => h.textContent) : []; o.eqs = card ? card.querySelectorAll('.mth-eq').length : 0;
      const t0 = txt(); o.def = { bkg: /x\(w,t\) = RLU\(w,t\) − mean of the background wells at t/.test(t0), veh: /V\(t\) = mean of x\(v,t\) \/ mean of x0\(v\)/.test(t0), fin: /y\(w,t\) = u\(w,t\) \/ V\(t\)/.test(t0), model: /y\(t\) = P \+ \(1 − P\)·exp\(−K·τ\)/.test(t0), dr: /Top − Bot\) \/ \(1 \+ 10\^\( h·\(log10 c − log10 DC50\)/.test(t0), mm: /K\(c\) = KDegMax · c \/ \(KDeg50 \+ c\)/.test(t0), top: /Top fixed at 100 %/.test(t0), none: /Nothing was left out or forced by hand/.test(t0), junk: /undefined|NaN|\[object|null/.test(t0) };
      // the equation is the one the code uses: recompute one well from the sentence and compare with the normalised trace
      { const p = tpPlate(), res = tpRes(p), ids = Object.keys(p.wells), role = i => tpRole(p.wells[i]), bk = ids.filter(i => role(i) === 'bkg'), vh = res.nm.vehUsed, dz = ids.filter(i => role(i) === 'dose' && res.nm.frac[i])[0], idx = res.nm.idx;
        const bkg = k => bk.reduce((s, i) => s + p.wells[i].raw[k], 0) / bk.length, x = (i, k) => p.wells[i].raw[k] - bkg(k), x0 = i => x(i, idx[0]), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
        let worst = 0; [0, 5, 20, idx.length - 1].forEach(j => { const k = idx[j], V = mean(vh.map(i => x(i, k))) / mean(vh.map(x0)), y = x(dz, k) / x0(dz) / V; worst = Math.max(worst, Math.abs(y - res.nm.frac[dz][j])); }); o.eqWorst = worst; }
      // it follows the settings
      const N = TP.S.norm, F = TP.S.fit, D = TP.S.dr, M = TP.S.mm; const keep = JSON.stringify(TP.S);
      N.veh = 'perTime'; N.bkg = false; o.perTime = txt(); N.veh = 'meanOfRatios'; N.bkg = true; N.t0n = 3; o.mor = txt(); N.veh = 'none'; o.vnone = txt(); N.veh = 'ratioOfMeans'; N.t0n = 1;
      F.lag = false; F.y0 = 'free'; F.plateau = 'free'; D.topFree = true; D.hookOn = false; M.hookMode = 'si'; M.ciRule = false; o.fit = txt();
      TP.S = JSON.parse(keep);
      // what was left out by hand
      const p = tpPlate(), ex = tpEx(p), w = Object.keys(p.wells).find(i => tpRole(p.wells[i]) === 'dose'); ex.wells.push(w); ex.masks.push([1, 2]); o.hand = txt(); ex.wells.pop(); ex.masks.pop(); o.handW = w;
      // the workbook: sheet order, the note under Results, a Method sheet of three columns
      const wb = { sheets: [] }; window.XLSX = { utils: { book_new: () => wb, aoa_to_sheet: a => a, book_append_sheet: (b, ws, n) => b.sheets.push([n, ws]) }, writeFile: () => {} }; tpExportXLSX();
      const sn = wb.sheets.map(s => s[0]); o.sheets = sn; const res = wb.sheets.find(s => s[0] === 'Results')[1], met = wb.sheets.find(s => s[0] === 'Method');
      o.xNote = res.slice(-4).map(r => r[0]).join(' | '); o.xMethod = !!met && met[1].every(r => r.length === 3) && met[1].length > 25 && met[1][0][0] === 'Section';
      // Prism, the figure, the printed report, the JSON, the text file
      const got = {}; window.tpDownload = (n, b) => { got[n] = b; }; tpExportPrism(); tpTab('curves'); tpSub('kin'); tpSaveSVG(); window.print = () => {}; tpPrint();
      const names = Object.keys(got); const prism = got[names.find(n => /prism/.test(n))], svg = got[names.find(n => /\.svg$/.test(n))];
      o.prism = (await prism.text()).replace(/^﻿/, '').split('\r\n').slice(0, 3).join(' | '); const st = await svg.text(); o.svg = { foot: /Normalised: background/.test(st), grew: (() => { const m = /viewBox="0 0 (\d+) (\d+)"/.exec(st); return m && +m[2] > 560; })(), rect: (() => { const m = /viewBox="0 0 (\d+) (\d+)"/.exec(st), q = /<rect width="(\d+)" height="(\d+)"/.exec(st); return m && q && m[1] === q[1] && m[2] === q[2]; })() };
      const pr = document.querySelector('#tp-print').innerHTML; o.print = /How this was calculated/.test(pr) && /y\(w,t\) = u\(w,t\)/.test(pr);
      const js = tpResultsJSON(tpPlate()); o.json = Array.isArray(js.method) && js.method.length > 20 && /NORMALISATION/.test(js.method.join('\n'));
      tpSaveMethod(); o.txt = names.concat(Object.keys(got)).some(n => /_tempo_method\.txt$/.test(n));
      o.menu = (tpExportMenu(document.body), !!document.querySelector('#tp-exp-menu') && /Method as text/.test(document.querySelector('#tp-exp-menu').textContent));
      return o;
    });
    check('K24 Results carries a “How this was calculated” card: a short note, then every step with its equations', r.card && r.short === 3 && r.eqs >= 12 && ['Data', 'Normalisation: what each reading was divided by', 'Kinetic fit of every concentration', 'Analysis A · Promega style: DC50 (Dmax50) and Dmax', 'Analysis B · Michaelis–Menten on K (the lab’s Prism analysis)', 'Reference concentration and headline', 'Left out or forced by hand', 'Conventions'].every(h => r.heads.indexOf(h) >= 0), JSON.stringify([r.short, r.eqs, r.heads]));
    check('K24 the default record names the background, the vehicle ratio, Y0 = 1, the one-phase model, the 4PL and the Michaelis–Menten equation, with nothing undefined in it', Object.keys(r.def).filter(k => k !== 'junk').every(k => r.def[k]) && !r.def.junk, JSON.stringify(r.def));
    check('K24 the normalisation equation as written reproduces the normalised trace (worst well and read within 1e-9)', r.eqWorst < 1e-9, String(r.eqWorst));
    check('K24 the record follows the settings: vehicle at each read, mean of ratios with three reads as T0, no vehicle, no background', /y\(w,t\) = x\(w,t\) \/ mean of the vehicle wells/.test(r.perTime) && /not subtracted|background not subtracted/.test(r.perTime) && /mean of \[ x\(v,t\) \/ x0\(v\) \]/.test(r.mor) && /first 3 reads/.test(r.mor) && /V\(t\) = 1/.test(r.vnone) && /NOT corrected/.test(r.vnone) && /y\(w,t\) = u\(w,t\)\n|y\(w,t\) = u\(w,t\)$/m.test(r.vnone), r.vnone.slice(0, 600));
    check('K24 the record follows the fit settings: free y0, no delay, free plateau, free top, hook off, substrate inhibition, no CI rule', /\(y0 − P\)/.test(r.fit) && /not allowed/.test(r.fit) && /Plateau:  free always/.test(r.fit) && /Top free/.test(r.fit) && /Hook:  off/.test(r.fit) && /c²\/Ki/.test(r.fit) && !/its interval excludes 0/.test(r.fit), r.fit.slice(0, 200));
    check('K24 what was left out by hand is listed (the well, the time range), and nothing is claimed when nothing was', new RegExp('wells left out:  ' + r.handW).test(r.hand) && /time ranges left out \(h\):  1.*2/.test(r.hand), r.hand.slice(-300));
    check('K24 the workbook has a Method sheet right after Results (three columns), and a note under the Results table that points to it', r.sheets[0] === 'Results' && r.sheets[1] === 'Method' && r.xMethod && /Every step, equation and setting/.test(r.xNote), JSON.stringify([r.sheets, r.xNote, r.xMethod]));
    check('K24 the Prism tables start with the method, the saved figure carries it as a footnote (viewBox and background grown together), the printed report, the JSON and the Method text file have it', /^Method \|/.test(r.prism) && r.svg.foot && r.svg.grew && r.svg.rect && r.print && r.json && r.txt && r.menu, JSON.stringify([r.prism, r.svg, r.print, r.json, r.txt, r.menu]));
    check('K24 no page error through any of it', e10.length === 0, e10.slice(0, 2).join(' | '));
    await c10.close();
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
    if (fs.existsSync(path.join(F, 'glomax_timecourse.csv'))) {
      const gtxt = fs.readFileSync(path.join(F, 'glomax_timecourse.csv'), 'utf8');
      const G = await ev(t => { const o = tpReadTables([{ name: 'TC', rows: tpParseCSV(t) }]), p = o.plates[0]; return { n: o.plates.length, wells: p && Object.keys(p.wells).length, reads: p && p.times.length, t1: p && p.times[1], tN: p && p.times[p.times.length - 1], A1: p && p.wells.A1.raw[0], H12: p && p.wells.H12.raw[214], readout: p && p.meta.readout, none: p && p.notes.length }; }, gtxt);
      check('REAL the GloMax time-course file is one 96-well plate of 215 reads, 0 → 1071.8 min, Luminescence', G.n === 1 && G.wells === 96 && G.reads === 215 && G.t1 === 5 && G.tN === 1071.8 && G.A1 === 16090 && G.readout === 'Luminescence', JSON.stringify(G));
    }

  }
} catch (e) { findings.push('✗ the run stopped: ' + (e && e.stack || e)); console.log('✗ the run stopped: ' + (e && e.stack || e)); }

// ── DR1 a dose-response must be better than a flat line (Echo's E81; the engine is _curveVsFlat) ─────────────────────────────
try {
  const r = await ev(() => {
    let seed = 20261027; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const pts = f => { const o = []; for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) { const x = -9 + i * 0.5; o.push({ x, y: f(x) }); } return o; };
    const o = { flat: 0, real: 0, potent: 0, n: 60 };
    for (let t = 0; t < o.n; t++) { const r = tpFitDR(pts(() => 100 + 8 * gauss()), null, 'x'); if (r && /No effect \(no dose-response/.test(r.Flag_Reason) && r.Dmax_pct === 0) o.flat++; }
    for (let t = 0; t < 30; t++) { const r = tpFitDR(pts(x => 100 / (1 + Math.pow(10, x + 7)) + 8 * gauss()), null, 'x'); if (r && !/No effect/.test(r.Flag_Reason) && r.DC50_nM > 50 && r.DC50_nM < 200) o.real++; }
    for (let t = 0; t < 30; t++) { const r = tpFitDR(pts(() => Math.max(0, 5 + 3 * gauss())), null, 'x'); if (r && !/No effect/.test(r.Flag_Reason)) o.potent++; }
    return o;
  });
  check('DR1 flat dose series are the flat line (No effect, Dmax 0): at least 57 of 60', r.flat >= 57, JSON.stringify(r));
  check('DR1 a real curve keeps its fit (30 of 30) and a compound maximal at every dose is not "no effect" (30 of 30)', r.real === 30 && r.potent === 30, JSON.stringify(r));
} catch (e) { findings.push('✗ DR1 the checks ran to the end: ' + String(e && e.message || e).split('\n')[0]); }

await browser.close();
if (findings.length) { console.log('\n' + findings.length + ' finding(s), ' + passed + ' checks passed.'); process.exit(1); }
console.log('Tempo invariants: ' + passed + ' checks passed.');
