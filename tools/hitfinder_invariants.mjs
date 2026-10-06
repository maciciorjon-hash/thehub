// Hit Finder invariants — the classes of bug a triage tool can have, as checks that run every time.
// Same rule as tools/invariants.mjs and tools/echo_invariants.mjs: each check is a CLASS, proven by putting the
// bug back in a temporary copy (--file=path/to/hitfinder.html) and watching it fail.
//
//   H0  one source of truth   Every '@rdkit/rdkit' URL is pinned to a version, and the SCREEN ENGINE and RDKIT LOADER blocks are byte-identical to
//                             Echo's (the numbers a hook, a coverage or a qualifier carry cannot differ between the file and the app).
//   H1  every way in is the    Echo's History, its Screen CSV, the workbook's Screen sheet, its older Results CSV and a Lumina-style file give the same
//       same table              compounds, the same qualifiers and the same numbers; the lossless ones are field-for-field identical.
//   H2  names are read, not    HF-001 / hf-001 / HF_001 are one compound; HF-7 and HF-007 are only SUGGESTED, and merging is a click that is remembered.
//       guessed
//   H5  n = 3 means what it    Replicates combine as potencies do: {1,10,100} nM is 10 nM ×/÷ 10 (never 37), a bound is counted and never averaged,
//       says                    two groups of one run are collapsed before runs are combined, and two versions of one analysis are one measurement.
//   H15 the reader creates     Reading Echo's History never creates its database: with no database there is nothing to list and nothing is made.
//       nothing
//   H16 the example is real   The example screen has 72 compounds in 5 screens, every record is schema echo-screen/1 and went through the engine
//                             (hook states, qualifiers, the compounds that could not be fitted), and a compound written three ways is one compound.
//   H17 the tabs are a tablist One selected tab, arrows / Home / End move and select, the underline sits under the active tab.
//
// Usage (repo root):  node tools/hitfinder_invariants.mjs [--only=H0,H16] [--file=path/to/hitfinder.html] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.resolve(args.file || path.join(ROOT, 'apps/hitfinder/hitfinder.html'));
const ECHO = path.join(ROOT, 'apps/echo/echo.html');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);

const out = [], counts = {}, skipped = [];
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail).slice(0, 300) });
}
async function guard(inv, fn) { try { await fn(); } catch (e) { out.push({ inv, case: 'harness', msg: 'threw: ' + String(e && e.message || e).split('\n')[0] }); } }
const block = (src, name) => { const i = src.indexOf('// ═══ ' + name + ' — BEGIN'), j = src.indexOf('// ═══ ' + name + ' — END'); return i < 0 || j < 0 ? null : src.slice(i, src.indexOf('\n', j)); };

// Both apps are served from one origin, so Hit Finder reads the IndexedDB Echo has just written (file:// pages do not share it reliably).
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = u === '/__hf.html' ? FILE : path.join(ROOT, u);
  if (!f.startsWith(ROOT) && f !== FILE) { res.statusCode = 403; return res.end(); }
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
const pageErrs = [];
pg.on('pageerror', e => pageErrs.push(String(e && e.message || e)));
// Only this server, and SheetJS (cdnjs, or --xlsx=PATH for an offline run). Fonts and everything else stay out.
const XLSX_LOCAL = args.xlsx ? fs.readFileSync(String(args.xlsx)) : null;
await ctx.route(/^https?:/, r => {
  const u = r.request().url();
  if (u.startsWith(BASE)) return r.continue();
  if (/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx/.test(u)) return XLSX_LOCAL ? r.fulfill({ body: XLSX_LOCAL, contentType: 'text/javascript' }) : r.continue();
  r.abort();
});
const E = (f, a) => pg.evaluate(f, a);
await pg.goto(BASE + '/__hf.html');
await pg.waitForTimeout(600);
const hasXlsx = await E(() => !!window.XLSX);
if (!hasXlsx) skipped.push('Excel cases — SheetJS did not load (offline: pass --xlsx=PATH)');

if (run('H0')) await guard('H0', async () => {
  const mine = fs.readFileSync(FILE, 'utf8'), echo = fs.readFileSync(ECHO, 'utf8');
  const unpinned = t => [...t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').matchAll(/@rdkit\/rdkit(?!@(?:\d|' \+ RDKIT_VERSION))/g)].length;
  check('H0', 'every @rdkit/rdkit URL carries a version', unpinned(mine) === 0, unpinned(mine));
  for (const name of ['SCREEN ENGINE', 'RDKIT LOADER']) {
    const a = block(mine, name), b = block(echo, name);
    check('H0', name + ' is Echo\'s, byte for byte (run tools/sync_screen_engine.py)', !!a && a === b, { here: a && a.length, echo: b && b.length });
  }
});


// ── two copies of one compound spelled differently, and a bound, for the aggregation goldens ──
const REC = `(o) => { const r = {}; SCR_COLS.forEach(c => { r[c] = null; }); return Object.assign(r, { Schema: 'echo-screen/1', Fit_Status: 'fitted', Assay: 'hibit', Role: 'degradation', Panel: 0, Potency_Qualifier: 'exact', Effect_Eff: 90, Effect_Fit: 90, Hill: 1, R2: 0.99 }, o); }`;

if (run('H1')) await guard('H1', async () => {
  // Echo, in a second page of the same origin, runs its bundled test data and writes its History
  const ep = await ctx.newPage(); ep.on('pageerror', e => pageErrs.push('echo: ' + String(e && e.message || e)));
  await ep.goto(BASE + '/apps/echo/echo.html'); await ep.waitForTimeout(1500);
  await ep.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); loadTestData(); });
  await ep.waitForTimeout(800);
  await ep.evaluate(() => { document.getElementById('p-assay').value = 'H1-PARITY'; document.getElementById('p-role').value = 'degradation'; document.getElementById('p-target').value = 'BRD4'; document.getElementById('p-cell').value = 'HEK293'; document.getElementById('p-time').value = '6'; runPipeline(); });
  await ep.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
  await ep.waitForTimeout(2200);
  const echo = await ep.evaluate(() => {
    const parse = text => { const out = []; let row = [], cur = '', q = false; for (let i = 0; i < text.length; i++) { const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); out.push(row); row = []; cur = ''; } else cur += ch; }
      if (cur || row.length) { row.push(cur); out.push(row); } return out; };
    const caps = [], oS = XLSX.utils.aoa_to_sheet; XLSX.utils.aoa_to_sheet = function (a) { caps.push(a); return oS.apply(this, arguments); };
    try { generateOutputXLSX(); } finally { XLSX.utils.aoa_to_sheet = oS; }
    const summary = downloadBlobs.find(b => /Consolidated_Summary/.test(b.name));
    return { id: window._analysisId, recs: JSON.parse(JSON.stringify(_screenRecords())), csv: parse(new TextDecoder().decode(screenCsvBytes())), xlsx: caps.find(a => a[0] && a[0][0] === 'Schema') || null,
      legacy: summary ? new TextDecoder().decode(summary.bytes) : null, nd: _lastResultsData.filter(r => /No effect/.test(r.Flag_Reason || '')).length };
  });
  await ep.close();
  const r = await E(async (echo) => {
    const list = await hfEchoRuns(); const mine = (list || []).find(x => x.id === echo.id);
    if (!mine) return { noRun: true, list: (list || []).length };
    loadHitFinderTestData(); HF.recs = []; HF.screens = new Map(); HF.arms = new Map();
    const res = await hfEchoLoad([echo.id]);
    const fromHist = JSON.parse(JSON.stringify(HF.recs.map(x => { const o = {}; SCR_COLS.forEach(c => { o[c] = x[c]; }); return o; })));
    const diff = (A, B, what) => { const bad = []; if (A.length !== B.length) bad.push(what + ': ' + A.length + ' vs ' + B.length + ' rows'); for (let i = 0; i < Math.min(A.length, B.length) && bad.length < 6; i++) SCR_COLS.forEach(c => { const a = A[i][c] == null ? null : A[i][c], b = B[i][c] == null ? null : B[i][c]; if (a !== b) bad.push(what + ' #' + i + ' ' + c + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); }); return bad; };
    const out = { loaded: res.loaded, histVsEcho: diff(fromHist, echo.recs, 'History') };
    out.csvVsEcho = diff(hfParseScreenTable(echo.csv).map(x => x), echo.recs, 'CSV');
    out.xlsxVsEcho = echo.xlsx ? diff(hfParseScreenTable(echo.xlsx), echo.recs, 'XLSX') : ['no Screen sheet'];
    // the older summary CSV: same compounds, same qualifiers, the same exact potencies; a bound has no number there
    if (echo.legacy) {
      const L = hfParseLegacyTable(hfParseCSV(echo.legacy), 'old.csv'), S = echo.recs.filter(x => x.Fit_Status === 'fitted'), bad = [];
      if (L.length !== S.length) bad.push('rows ' + L.length + ' vs ' + S.length);
      const key = x => hfKey(x.Compound) + '|' + x.Group, map = new Map(S.map(x => [key(x), x]));
      L.forEach(l => { const s = map.get(key(l)); if (!s) { bad.push('missing ' + key(l)); return; }
        if ((l.Potency_Qualifier || null) !== (s.Potency_Qualifier || null)) bad.push(key(l) + ' qualifier ' + l.Potency_Qualifier + ' vs ' + s.Potency_Qualifier);
        else if (l.Potency_Qualifier === 'exact' && Math.abs(l.Potency_nM - s.Potency_nM) > 1e-3 * s.Potency_nM) bad.push(key(l) + ' potency ' + l.Potency_nM + ' vs ' + s.Potency_nM);
        if (l.Hook_State !== 'unknown' && !s.Flag_Hook) bad.push(key(l) + ' hook invented'); });
      out.legacy = bad.slice(0, 6); out.legacyN = L.length;
    } else out.legacy = ['no summary CSV'];
    return out;
  }, echo);
  check('H1', 'Hit Finder finds the analysis Echo just saved, in the same origin', !r.noRun && r.loaded && r.loaded.length === 1, r);
  check('H1', 'History → records are Echo\'s own Screen records, field for field', r.histVsEcho && r.histVsEcho.length === 0, r.histVsEcho);
  check('H1', 'the Screen CSV read back is the same table', r.csvVsEcho && r.csvVsEcho.length === 0, r.csvVsEcho);
  if (hasXlsx) check('H1', 'the workbook\'s Screen sheet read back is the same table', r.xlsxVsEcho && r.xlsxVsEcho.length === 0, r.xlsxVsEcho);
  check('H1', 'Echo\'s older summary CSV gives the same compounds, qualifiers and exact potencies, and invents no hook', r.legacy && r.legacy.length === 0 && r.legacyN > 0, r.legacy);
  const lum = await E(() => {
    const ok = [];
    // Lumina: a unit in the header, a plate column, a decimal comma behind a semicolon
    const csv = 'Sample_ID;Plate;DC50_uM;DC50_CI_lower_uM;DC50_CI_upper_uM;Dmax_pct;HillSlope;R2;n;Flag;Flag_Reason\nA-1;P1;0,0123;0,0098;0,0155;88;1,1;0,98;24;No;\nA-2;P1;>10;;;12;1,0;0,90;24;Yes;EC50>range\nA-3;P1;n.d.;;;6;;0,70;24;Yes;No effect (span 6%)\nA-4;P2;1.5e-3;;;91;0.9;0.99;24;No;\n';
    const L = hfParseLegacyTable(hfParseCSV(csv), 'lumina.csv'), by = Object.fromEntries(L.map(x => [x.Compound, x]));
    return { n: L.length, a1: [by['A-1'].Potency_nM, by['A-1'].Potency_Qualifier, by['A-1'].CI_Lower_nM, by['A-1'].Hill], a2: [by['A-2'].Potency_nM, by['A-2'].Potency_Qualifier], a3: [by['A-3'].Potency_Qualifier, by['A-3'].Potency_nM], a4: [by['A-4'].Potency_nM, by['A-4'].Group], assay: L[0].Assay };
  });
  check('H1', 'a Lumina-style file: µM in the header becomes nM, a decimal comma is a decimal, > is a bound, n.d. has no number', lum.n === 4 && lum.a1[0] === 12.3 && lum.a1[1] === 'exact' && lum.a1[2] === 9.8 && lum.a1[3] === 1.1 && lum.a2[0] === 10000 && lum.a2[1] === '>' && lum.a3[0] === 'n.d.' && lum.a3[1] === null && Math.abs(lum.a4[0] - 1.5) < 1e-9 && lum.a4[1] === 'P2' && lum.assay === 'hibit', lum);
});

if (run('H2')) await guard('H2', async () => {
  const r = await E((mk) => {
    const make = eval(mk);
    HF.recs = []; HF.screens = new Map(); HF.arms = new Map(); HF.alias = new Map(); HF.dismissed = null;
    const rows = [['HF-001', 'S1'], ['hf-001', 'S2'], ['HF_001', 'S3'], [' HF 001 ', 'S4'], ['HF-7', 'S1'], ['HF-007', 'S2'], ['ABC-123', 'S1'], ['ABC-124', 'S1'], ['abc-1', 'S1'], ['TOTALLY-OTHER', 'S1'], ['DMXAA-12', 'S1'], ['DMXAB-12', 'S1']];
    const recs = rows.map(([id, s], i) => make({ Compound: id, Group: 'G', Assay_ID: s, Run_ID: s, Set_ID: s, Potency_nM: 10 + i }));
    hfAddRecords(recs, 'test'); hfAfterIngest();
    const k = [hfKey('HF-001'), hfKey('hf-001'), hfKey('HF_001'), hfKey(' HF 001 '), hfKey('HF--001'), hfKey('HF-0 01')];
    const rec = hfReconcile(), pair = (a, b) => rec.suggest.some(s => (s.a === a && s.b === b) || (s.a === b && s.b === a));
    const before = hfNCompounds();
    hfMerge('hf-7', 'hf-007');
    const after = hfNCompounds(), kept = HF.alias.get('hf-007');
    hfRecompute();
    return { keys: k, total: rec.total, variants: rec.variants.map(v => v.ck), zero: pair('hf-7', 'hf-007'), typo: pair('dmxaa-12', 'dmxab-12'), near: pair('abc-123', 'abc-124'), short: pair('abc-1', 'abc-123'), other: rec.suggest.some(s => /totally/.test(s.a + s.b)), before, after, kept };
  }, REC);
  check('H2', 'case, spaces, - and _ read as one name', r.keys[0] === 'hf-001' && r.keys.slice(0, 4).every(x => x === r.keys[0]) && r.keys[4] === 'hf-001' && r.keys[5] === 'hf-0-01', r.keys);
  check('H2', 'the four spellings of HF-001 are one compound and the variants say so', r.variants.length === 1 && r.variants[0] === 'hf-001', r.variants);
  check('H2', 'HF-7 and HF-007 are suggested, not merged; one letter apart (DMXAA / DMXAB) is suggested too', r.zero && r.typo && r.before === 9, r);
  check('H2', 'names a digit apart (ABC-123 / ABC-124 — two compounds) and names too short or too different are NOT suggested', !r.near && !r.other && !r.short, r);
  check('H2', 'merging is a click: only then is it one compound, and it is remembered', r.after === r.before - 1 && r.kept === 'hf-7', r);
});

if (run('H5')) await guard('H5', async () => {
  const r = await E((mk) => {
    const make = eval(mk), out = {};
    const go = (rows) => { HF.recs = []; HF.screens = new Map(); HF.arms = new Map(); HF.alias = new Map(); hfAddRecords(rows.map(make), 't'); HF.arms.forEach(a => { a.slot = 'primary'; a.guessed = false; }); hfRecompute(); const g = HF.agg.get('x'); return g && g.get('primary'); };
    const set = (v, o) => Object.assign({ Compound: 'X', Group: 'G', Assay_ID: 'S' + v + (o && o.tag || ''), Run_ID: 'r' + v + (o && o.tag || ''), Set_ID: 's' + v + (o && o.tag || ''), Potency_nM: v }, o);
    let a = go([set(1), set(10), set(100)]);
    out.gm = { n: a.n, v: a.pot.value, spread: a.pot.spread, ci: a.pot.ci };
    a = go([set(1), set(100), set(1000, { Potency_Qualifier: '>' })]);
    out.bound = { n: a.n, q: a.pot.q, v: a.pot.value, nExact: a.pot.nExact, nBound: a.pot.nBound };
    a = go([set(4, { Run_ID: 'rA', Set_ID: 'A', Group: 'G1', Assay_ID: 'A' }), set(16, { Run_ID: 'rA', Set_ID: 'A', Group: 'G2', Assay_ID: 'A' }), set(2, { Run_ID: 'rB', Set_ID: 'B', Assay_ID: 'B' })]);
    out.tech = { n: a.n, v: a.pot.value };
    a = go([set(10, { Run_ID: 1, Set_ID: 'same', Version: 1, Assay_ID: 'V' }), set(40, { Run_ID: 2, Set_ID: 'same', Version: 2, Assay_ID: 'V' })]);
    out.ver = { n: a.n, v: a.pot.value };
    a = go([set(10, { Potency_Qualifier: 'n.d.', Potency_nM: null }), set(20, { Potency_Qualifier: 'n.d.', Potency_nM: null })]);
    out.nd = { q: a.pot.q, v: a.pot.value, nND: a.pot.nND };
    a = go([set(10), set(20, { Fit_Status: 'few-points', Potency_nM: null, Potency_Qualifier: null })]);
    out.unfit = { n: a.n, nUnfit: a.nUnfit, v: a.pot.value };
    a = go([set(10, { Effect_Eff: 80 }), set(30, { Effect_Eff: 90 }), set(1000, { Potency_Qualifier: '>', Effect_Eff: 40 })]);
    out.eff = { mean: a.eff.mean, n: a.eff.n, sd: a.eff.sd };
    return out;
  }, REC);
  const near = (a, b, t) => a != null && Math.abs(a - b) <= (t || 1e-9) * Math.max(1, Math.abs(b));
  const half = 4.303 / Math.sqrt(3);
  check('H5', '{1, 10, 100} nM is 10 nM ×/÷ 10 — the geometric mean, never 37', r.gm.n === 3 && near(r.gm.v, 10) && near(r.gm.spread, 10), r.gm);
  check('H5', 'its 95 % interval is the geometric one (t with 2 degrees of freedom), symmetric in log space', r.gm.ci && near(r.gm.ci[0], Math.pow(10, 1 - half), 1e-6) && near(r.gm.ci[1], Math.pow(10, 1 + half), 1e-6), r.gm.ci);
  check('H5', 'a bound is counted and never averaged: {1, 100, >1000} is 10 nM from two exact runs and one bound', r.bound.q === 'exact' && near(r.bound.v, 10) && r.bound.nExact === 2 && r.bound.nBound === 1, r.bound);
  check('H5', 'two groups of one run are collapsed first: (4, 16) → 8, then with 2 → 4 (not the 5.04 of pooling all three)', r.tech.n === 2 && near(r.tech.v, 4), r.tech);
  check('H5', 'two versions of one analysis are one measurement: the newest (40 nM), n = 1', r.ver.n === 1 && near(r.ver.v, 40), r.ver);
  check('H5', 'all n.d. stays n.d. (no number, counted)', r.nd.q === 'n.d.' && r.nd.v === null && r.nd.nND === 2, r.nd);
  check('H5', 'a replicate that could not be fitted is counted as such and does not enter the mean', r.unfit.n === 1 && r.unfit.nUnfit === 1 && near(r.unfit.v, 10), r.unfit);
  check('H5', 'the effect is an ordinary mean over runs even when the potency of one is only a bound', r.eff.n === 3 && near(r.eff.mean, (80 + 90 + 40) / 3), r.eff);
});

if (run('H15')) await guard('H15', async () => {
  const ctx2 = await browser.newContext(), p2 = await ctx2.newPage();
  await p2.route(/^https?:/, rt => rt.request().url().startsWith(BASE) ? rt.continue() : rt.abort());
  await p2.goto(BASE + '/__hf.html'); await p2.waitForTimeout(500);
  const r = await p2.evaluate(async () => {
    const before = (await indexedDB.databases()).map(d => d.name), runs = await hfEchoRuns(), load = await hfEchoLoad([123]), after = (await indexedDB.databases()).map(d => d.name);
    return { before, after, runs, loaded: load.loaded.length, missing: load.missing.length };
  });
  await ctx2.close();
  check('H15', 'with no Echo database there is nothing to list', r.runs === null && r.loaded === 0 && r.missing === 1, r);
  check('H15', 'and reading did not create one', !r.after.includes('echo_history') && !r.before.includes('echo_history'), r);
});

if (run('H16')) await guard('H16', async () => {
  const r = await E(() => {
    loadHitFinderTestData();
    const recs = HF.recs, by = {};
    recs.forEach(x => { const k = x.Assay_ID; (by[k] = by[k] || { fit: 0, unfit: 0, hook: {}, q: {} });
      if (x.Fit_Status === 'fitted') { by[k].fit++; by[k].hook[x.Hook_State] = (by[k].hook[x.Hook_State] || 0) + 1; by[k].q[x.Potency_Qualifier] = (by[k].q[x.Potency_Qualifier] || 0) + 1; } else by[k].unfit++; });
    const spelled = [...HF.names.values()].filter(m => m.size > 1).length;
    return { compounds: hfNCompounds(), screens: HF.screens.size, schema: recs.every(x => x.Schema === 'echo-screen/1'), n: recs.length, by,
      keys: recs.every(x => Object.keys(x).filter(k => k[0] !== '_').join() === SCR_COLS.join()), spelled, smiles: HF.smiles.size };
  });
  check('H16', 'the example has 72 compounds in 5 screens', r.compounds === 72 && r.screens === 5, r);
  check('H16', 'every record is schema echo-screen/1 with exactly the SCR_COLS', r.schema && r.keys, r);
  const p1 = r.by['EX-HB-BRD4'] || {};
  check('H16', 'the primary screen has its hookers (8, hook left out of the fit) and a compound that could not be fitted', p1.hook && p1.hook.excluded === 8 && p1.unfit === 3, p1);
  check('H16', 'bounds and flat curves are qualifiers, not numbers (>, <, n.d.)', p1.q && p1.q['>'] > 0 && p1.q['<'] > 0 && p1.q['n.d.'] > 0 && p1.q.exact > 0, p1.q);
  check('H16', 'a compound spelled HF-001 / hf-001 / HF_001 is one compound (72, not more)', r.spelled > 0 && r.compounds === 72, r);
});

if (run('H17')) await guard('H17', async () => {
  const r = await E(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const sel = () => $$('.tab[aria-selected="true"]').map(t => t.dataset.tab);
    const o = { start: sel() };
    const key = k => $('#hf-tabs').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    key('ArrowRight'); o.right = sel(); key('End'); o.end = sel(); key('Home'); o.home = sel(); key('ArrowLeft'); o.left = sel();
    hfTab('hits'); await wait(350);
    const a = $('.tab.active'), ink = $('#hf-ink'), m = (ink.style.transform.match(/translateX\(([\d.]+)px\) scaleX\(([\d.]+)\)/) || []);
    o.ink = { dx: Math.abs(+m[1] - a.offsetLeft), dw: Math.abs(+m[2] - a.offsetWidth) };
    o.panes = $$('.tabpane.active').map(p => p.id);
    hfTab('screens');
    return o;
  });
  check('H17', 'exactly one tab is selected at the start', JSON.stringify(r.start) === '["screens"]', r.start);
  check('H17', 'ArrowRight / End / Home / ArrowLeft move and select', JSON.stringify(r.right) === '["criteria"]' && JSON.stringify(r.end) === '["export"]' && JSON.stringify(r.home) === '["screens"]' && JSON.stringify(r.left) === '["export"]', r);
  check('H17', 'the underline sits under the active tab; exactly one pane shows', r.ink.dx < 1.5 && r.ink.dw < 1.5 && JSON.stringify(r.panes) === '["pane-hits"]', r);
});

await browser.close(); server.close();
const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
skipped.forEach(s => console.log('  – skipped: ' + s));
const realErrs = pageErrs.filter(e => !/Failed to load resource|net::ERR/i.test(e));
if (realErrs.length) { console.log('  ✗ page errors:'); [...new Set(realErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + realErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Hit Finder invariants hold.');
process.exit(failed ? 1 : 0);
