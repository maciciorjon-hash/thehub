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
//   H3  a gate says what it   pass / borderline / fail / unknown over points AND intervals: "> 10 µM" conclusively fails "≤ 100 nM" and conclusively passes
//       knows                  "≥ 1 µM", a bound that straddles the threshold is unknown, a missing number is never a pass and never a zero, a fail beats an
//                              unknown beats a borderline, and a criterion whose slot has no screen is inactive, not failed.
//   H4  a hook is not a defect Dmax is the effect with the hook left out, so a hooker and its twin without the hook pass the same gates; the window is the
//                              last productive dose over DC50; degradation at a dose inside the hook is read from the wells or is unknown, never from the curve.
//   H6  scores and ranks       The desirability falls monotonically as a number gets worse, a compound with unread gates can never outrank a fully measured
//                              one on its guaranteed score, and ties rank by name whatever order the data came in.
//   H7  the funnel adds up     Every compound is dropped at exactly one gate or survives; the counts equal a fresh re-evaluation; the compounds listed at a
//                              gate are the ones that failed it.
//   H5  n = 3 means what it    Replicates combine as potencies do: {1,10,100} nM is 10 nM ×/÷ 10 (never 37), a bound is counted and never averaged,
//       says                    two groups of one run are collapsed before runs are combined, and two versions of one analysis are one measurement.
//   H10 typing keeps the box   A threshold typed at human pace keeps the box, the caret and every digit (the card is patched, never re-drawn under the
//                              cursor); the sentence, the counts and the hit total follow each keystroke and equal a fresh re-evaluation.
//   H14 your call is yours     h / m / x and the note are kept beside the tier and never change it; they survive a change of criteria and a reload;
//                              the arrows move through the ranked list, Enter opens the drawer, Esc closes it, / finds.
//   H18 an edge can be dragged Dragging a threshold's handle (pointer or arrow keys) moves it, the counts follow while it moves, and the result equals
//                              what typing the same number would give.
//   H19 a screen can be big     5000 compounds recompute in seconds, only the rows in view are built, and the last row is reachable.
//   H11 a plot is the data    Each plot draws exactly its compounds (a bound as an arrow, a hook as a diamond); the shaded corner moves with the criteria; a flip of
//                              the theme repaints; the SVG / PNG / CSV are on white, carry no CSS variable and no NaN, and agree with the screen; a rectangle
//                              dragged on one plot picks the same compounds in all of them, and Show in Hits lists exactly those.
//   H15 the reader creates     Reading Echo's History never creates its database: with no database there is nothing to list and nothing is made.
//       nothing
//   H16 the example is real   The example screen has 72 compounds in 5 screens, every record is schema echo-screen/1 and went through the engine
//                             (hook states, qualifiers, the compounds that could not be fitted), and a compound written three ways is one compound.
//   H20 send means sent      "Send to Hit Finder" in Echo opens Hit Finder by itself with the analysis loaded (from History, saved first, so pressing it the instant a
//                             run finishes works), and where History cannot be kept the Screen table travels instead; sending twice never doubles the screens;
//                             the button is there only inside the Hub, and a guessed slot is said where the hits are read.
//   H8  what leaves can come    The workbook's Criteria sheet re-creates exactly the tiers its own All-compounds sheet lists; Hits is the Hits tab in its order; a number is a number
//       back                       and a missing one is blank, never 0; nothing a spreadsheet would run as a formula leaves in any file; the cherry-pick ranges are
//                                  centred and on a 1-3-10 grid, a rejected compound is out and a hit you picked is in; a project round-trips (verdicts, calls,
//                                  criteria, slots, merges, edited targets) and a file that is not one changes nothing; autosave survives a reload and keeps the session
//                                  before it; the printed page is the summary alone, on white, with dark ink.
//   H9  a series is a series    Tanimoto is shared ÷ union (two empty fingerprints are 0, not 1); Butina gives the groups RDKit's would, the same groups whatever order the
//                              compounds arrive in, every compound in exactly one, and more groups as the threshold rises; the cliff score is |ΔpDC50| ÷ (1 − similarity)
//                              and never counts a bound; the map reproduces the distances it was given when they fit in two dimensions, and never produces NaN.
//   H13 RDKit says what it says  Aspirin's weight, polar surface, logP, donors, acceptors and rotatable bonds are the known ones; '' is no structure (RDKit calls it a
//                              valid empty molecule); an unreadable SMILES is flagged, not zero; a salt is its largest piece; every alert pattern compiles, fires on a
//                              molecule that has it and stays silent on one that does not.
//   H21 structures, honestly    With RDKit unreachable the app says so once and carries on; the properties a file brings are used, win over computed ones, and are
//                              judged against each rule set; a gate on them reads the right tier; a missing property is unread (skipped or Unverified as chosen), never 0.
//   H22 a bad file is a bad file  Empty, header-only, binary, a CSV with a BOM / semicolons / decimal commas, impossible numbers (1e999, negative, text), garbage curve points and
//                              markup in names: nothing throws, no row with no compound or no number is invented, and no tab ever shows NaN / Infinity / undefined.
//   H17 the tabs are a tablist One selected tab, arrows / Home / End move and select, the underline sits under the active tab.
//   H23 everything stays in    With the names a lab really uses (a 60-character screen label, a compound code with a batch suffix, a target with its fusion
//       its box                 tag, a cell line with its knock-out) every tab, the drawer and every dialog, at 1440 / 1260 (the Hub's frame on a laptop) / 1100 /
//                              900 / 390 px, is checked by tools/audit_escape.js: no icon or text leaves the box drawn around it, no two runs of text land on
//                              one another, no chart label touches another, and nothing a person must read whole hides behind a sideways scroll.
//
// Usage (repo root):  node tools/hitfinder_invariants.mjs [--only=H0,H16] [--file=path/to/hitfinder.html] [--echo=path/to/echo.html] [--verbose]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { HF_SEED } from './hitfinder_seed.mjs';

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

// A stand-in for the Hub: Echo is already in its frame, Hit Finder is loaded the first time something opens it, and the message is repeated until it is acknowledged (as the shell's _hubQueueMessage does).
const HOST_HTML = `<!doctype html><html><body style="margin:0"><iframe id="frame-echo" src="/apps/echo/echo.html" style="width:1300px;height:820px;border:0"></iframe><iframe id="frame-hitfinder" style="width:1300px;height:820px;border:0"></iframe><script>
var APP_INFO = { hitfinder: { name: 'Hit Finder' } }; window.__opens = []; var acked = {};
window.addEventListener('message', function (e) { if (e.data && e.data.type === 'dhub:ack') acked[e.data.requestId] = true; });
function openApp(id, tab, item, context) {
  window.__opens.push({ id: id, source: context && context.source, echoRun: context && context.echoRun, hasTable: !!(context && context.table), tableRows: context && context.table ? context.table.length : 0, name: context && context.name });
  var f = document.getElementById('frame-' + id); if (!f.getAttribute('src')) f.src = '/__hf.html';
  var msg = { type: 'dhub:context', version: 1, source: (context && context.source) || 'hub', target: id, action: 'open', context: context, requestId: 't' + Date.now() + Math.random() };
  var n = 0; (function send() { if (acked[msg.requestId] || n >= 60) return; try { f.contentWindow.postMessage(msg, '*'); } catch (x) {} n++; setTimeout(send, 250); })();
}
<\/script></body></html>`;

// Both apps are served from one origin, so Hit Finder reads the IndexedDB Echo has just written (file:// pages do not share it reliably).
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__host.html') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.end(HOST_HTML); }
  const f = u === '/__hf.html' ? FILE : (u === '/apps/echo/echo.html' && args.echo) ? path.resolve(String(args.echo)) : path.join(ROOT, u);
  if (!f.startsWith(ROOT) && f !== FILE && !(args.echo && f === path.resolve(String(args.echo)))) { res.statusCode = 403; return res.end(); }
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


// A scenario: a compound per entry, each with a potency in the primary slot and optionally others, gates picked by the test.
const SCN = `(() => {
  const make = ${REC};
  const arm = { primary: 'P', anti: 'A', viability: 'V', counter: 'C', rescue: 'R' };
  const load = (cmps, rows) => {
    HF.recs = []; HF.screens = new Map(); HF.arms = new Map(); HF.alias = new Map(); HF.smiles = new Map();
    const recs = []; cmps.forEach(c => Object.keys(arm).forEach(sl => { const o = c[sl]; if (!o) return; recs.push(make(Object.assign({}, o, { Compound: c.id, Group: arm[sl], Assay_ID: 'S' + arm[sl], Run_ID: 'r' + arm[sl], Set_ID: 's' + arm[sl] }))); }));
    hfAddRecords(recs, 't'); HF.arms.forEach(a => { a.slot = Object.keys(arm).find(k => arm[k] === a.group); a.guessed = false; });
    HF.crit = { v: 1, rows: rows || [] }; hfRecompute();
  };
  return { make, load, arm };
})()`;

if (run('H3')) await guard('H3', async () => {
  const r = await E((scn) => {
    const S = eval(scn), out = {};
    const pot = (o) => Object.assign({ Fit_Status: 'fitted', Potency_Qualifier: 'exact' }, o);
    const st = (cmp, c) => { S.load([cmp], [c]); return hfEvalOne(c, hfKey(cmp.id)).status; };
    const le = () => hfNewCrit('potency', { pass: 100, fail: 300 });
    const ge = () => hfNewCrit('potency', { dir: 'higher', pass: 1000, fail: null });
    out.exact = [50, 200, 500].map(v => st({ id: 'a', primary: pot({ Potency_nM: v }) }, le()));
    out.gtLE = [st({ id: 'a', primary: pot({ Potency_Qualifier: '>', Potency_nM: 10000 }) }, le()), st({ id: 'a', primary: pot({ Potency_Qualifier: '>', Potency_nM: 50 }) }, le())];
    out.ltLE = [st({ id: 'a', primary: pot({ Potency_Qualifier: '<', Potency_nM: 0.5 }) }, le()), st({ id: 'a', primary: pot({ Potency_Qualifier: '<', Potency_nM: 5000 }) }, le())];
    out.gtGE = [st({ id: 'a', primary: pot({ Potency_Qualifier: '>', Potency_nM: 10000 }) }, ge()), st({ id: 'a', primary: pot({ Potency_Qualifier: '>', Potency_nM: 500 }) }, ge())];
    out.nd = [st({ id: 'a', primary: pot({ Potency_Qualifier: 'n.d.', Potency_nM: null, Tested_Max_nM: 10000 }) }, le()), st({ id: 'a', primary: pot({ Potency_Qualifier: 'n.d.', Potency_nM: null }) }, le())];
    out.noQual = [st({ id: 'a', primary: pot({ Potency_Qualifier: null, Potency_nM: null }) }, le())];
    out.policy = ['unknown', 'fail', 'skip'].map(p => st({ id: 'a', primary: pot({ Potency_nM: 50 }) }, hfNewCrit('effect', { slot: 'viability', missing: p })));
    // contrast through intervals
    const ct = (a, b) => st({ id: 'a', primary: pot(a), viability: pot(b) }, hfNewCrit('contrast', { slot2: 'viability', pass: 10, fail: 3 }));
    out.contrast = [ct({ Potency_nM: 10 }, { Potency_nM: 200 }), ct({ Potency_nM: 10 }, { Potency_nM: 50 }), ct({ Potency_nM: 10 }, { Potency_nM: 20 }), ct({ Potency_nM: 10 }, { Potency_Qualifier: '>', Potency_nM: 10000 }), ct({ Potency_nM: 10 }, { Potency_Qualifier: '>', Potency_nM: 50 }), ct({ Potency_Qualifier: '<', Potency_nM: 0.5 }, { Potency_nM: 200 })];
    // tiers: a fail beats an unknown beats a borderline
    // (a second compound that does have a viability result, so that the viability slot exists at all)
    const decoy = { id: 'decoy', primary: pot({ Potency_nM: 50, Effect_Eff: 90 }), viability: pot({ Potency_nM: 9000, Effect_Eff: 5 }) };
    const tier = (cmp, rows) => { S.load([cmp, decoy], rows); return HF.verdicts.get(hfKey(cmp.id)).tier; };
    const cmp = { id: 'a', primary: pot({ Potency_nM: 50, Effect_Eff: 90 }) };
    out.tiers = [tier(cmp, [hfNewCrit('potency'), hfNewCrit('effect')]), tier(cmp, [hfNewCrit('potency', { pass: 20, fail: 100 }), hfNewCrit('effect')]), tier(cmp, [hfNewCrit('potency'), hfNewCrit('effect', { slot: 'viability' })]),
      tier(cmp, [hfNewCrit('potency', { pass: 10, fail: 20 }), hfNewCrit('effect', { slot: 'viability' })]), tier(cmp, [hfNewCrit('potency'), hfNewCrit('effect', { slot: 'viability', missing: 'skip' })]), tier(cmp, [hfNewCrit('potency'), hfNewCrit('effect', { slot: 'viability', kind: 'advisory' })])];
    // a criterion on a slot nobody loaded is inactive: it neither fails nor makes anything unknown
    S.load([cmp], [hfNewCrit('potency'), hfNewCrit('contrast', { slot2: 'anti' })]);
    out.inactive = { tier: HF.verdicts.get('a').tier, active: HF.activeRows.length, rows: HF.crit.rows.length };
    return out;
  }, SCN);
  const j = x => JSON.stringify(x);
  check('H3', 'exact values: 50 passes, 200 is borderline, 500 fails (≤ 100, soft 300)', j(r.exact) === '["pass","borderline","fail"]', r.exact);
  check('H3', '"> 10 µM" conclusively fails ≤ 100 nM; "> 50 nM" does not settle it', j(r.gtLE) === '["fail","unknown"]', r.gtLE);
  check('H3', '"< 0.5 nM" conclusively passes ≤ 100 nM; "< 5 µM" does not settle it', j(r.ltLE) === '["pass","unknown"]', r.ltLE);
  check('H3', '"> 10 µM" conclusively passes IC50 ≥ 1 µM; "> 500 nM" does not settle it', j(r.gtGE) === '["pass","unknown"]', r.gtGE);
  check('H3', 'n.d. fails when the highest dose tested is known, and is unknown when it is not', j(r.nd) === '["fail","unknown"]', r.nd);
  check('H3', 'a potency with no number and no qualifier is unknown, never a pass', j(r.noQual) === '["unknown"]', r.noQual);
  check('H3', 'a missing result follows the policy: unknown, fail, or skipped', j(r.policy) === '["unknown","fail","skip"]', r.policy);
  check('H3', 'contrast across intervals: ×20 pass, ×5 borderline, ×2 fail, ≥ ×1000 pass, ≥ ×5 at least borderline, from a bound below ≥ ×400 pass', j(r.contrast) === '["pass","borderline","fail","pass","borderline","pass"]', r.contrast);
  check('H3', 'tiers: pass+pass = hit; a borderline = borderline; an unread gate = unverified; a fail beats an unread gate; a skipped or advisory one changes nothing', j(r.tiers) === '["hit","borderline","unverified","rejected","hit","hit"]', r.tiers);
  check('H3', 'a criterion on a slot with no screen is inactive: it fails nothing and makes nothing unknown', r.inactive.tier === 'hit' && r.inactive.active === 1 && r.inactive.rows === 2, r.inactive);
});

if (run('H4')) await guard('H4', async () => {
  const r = await E((scn) => {
    const S = eval(scn), out = {};
    // a hooker, as the example's own generator draws it, and its twin: the same wells with the hook points taken out
    const rng = hfRng(7), P = hfP(20, 92, 1.1, { onset: Math.log10(600e-9), depth: 45 });
    const rowA = hfSynthRow(rng, 'G', 'HK', 'hibit', P), hc = rowA._hook_concs;
    const rowB = Object.assign({}, rowA, { _reps: rowA._reps.filter(q => !hc.some(h => Math.abs(h - q.x) < 0.002)), _is_hook: false, _hook_concs: [], _hook_x: null, Flag_Reason: rowA.Flag_Reason.replace(/;?\s*Hookx\d+/, ''), _xmax: Math.max(...rowA._pts.map(q => q.x)) });
    const a = scrRecord(rowA, { assayId: 'A', runId: 1, setId: 'a' }), b = scrRecord(rowB, { assayId: 'B', runId: 2, setId: 'b' });
    out.rec = { hookA: a.Hook_State, hookB: b.Hook_State, effA: a.Effect_Eff, effB: b.Effect_Eff, dc50A: a.Potency_nM, dc50B: b.Potency_nM, winA: a.Window_Conservative, winB: b.Window_Conservative, onset: a.Hook_Onset_nM };
    const crit = [hfNewCrit('potency'), hfNewCrit('effect'), hfNewCrit('flags'), hfNewCrit('window', { kind: 'advisory' })];
    S.load([{ id: 'hk-a', primary: a }, { id: 'hk-b', primary: b }], crit);
    const va = HF.verdicts.get('hk-a'), vb = HF.verdicts.get('hk-b');
    out.tiers = [va.tier, vb.tier]; out.same = JSON.stringify(va.items.filter(i => i.c.metric !== 'window').map(i => i.status)) === JSON.stringify(vb.items.filter(i => i.c.metric !== 'window').map(i => i.status));
    out.hookFlagAllowed = !va.items.find(i => i.c.metric === 'flags').status.match(/fail/);
    // degradation at a dose: measured inside the hook, unknown between wells inside the hook, curve below the onset
    const gA = HF.agg.get('hk-a').get('primary'), onsetNM = a.Hook_Onset_nM, top = rowA.Top_val;
    const hookMeasured = Math.pow(10, hc[0]) * 1e9, mean = rowA._reps.filter(q => Math.abs(q.x - hc[0]) < 0.002).reduce((s, q, _, A) => s + q.y / A.length, 0);
    out.deg = { measured: hfDegAt(gA, hookMeasured), expect: Math.max(0, top - mean), between: hfDegAt(gA, hookMeasured * 0.6 + 1e-9 * 0), below: hfDegAt(gA, onsetNM / 8), onset: onsetNM };
    // none of it applies to a curve whose hook was never looked for
    out.unknown = scrHook(Object.assign({}, rowA, { _hookThr: undefined, _is_hook: false, _hook_concs: [] })).state;
    return out;
  }, SCN);
  const near = (x, y, t) => x != null && y != null && Math.abs(x - y) <= (t || 1e-6) * Math.max(1, Math.abs(y));
  check('H4', 'the hooker is a hook the engine saw; its twin has none', r.rec.hookA === 'excluded' && r.rec.hookB === 'none', r.rec);
  check('H4', 'Dmax, DC50 and the window are the same with and without the hook points (they are computed without them)', near(r.rec.effA, r.rec.effB) && near(r.rec.dc50A, r.rec.dc50B) && near(r.rec.winA, r.rec.winB), r.rec);
  check('H4', 'so the hooker and its twin pass the same gates and are both hits; a hook is not a disqualifying flag', r.same && r.tiers[0] === 'hit' && r.tiers[1] === 'hit' && r.hookFlagAllowed, r);
  check('H4', 'degradation inside the hook is what the wells read there (a rebound), not what the 4PL says', near(r.deg.measured, r.deg.expect, 1e-3), r.deg);
  check('H4', 'between two wells inside the hook it is unknown; below the onset it is read from the curve', r.deg.between === null && r.deg.below != null && r.deg.below > 50, r.deg);
  check('H4', 'a curve whose hook was never looked for is unknown, not "no hook"', r.unknown === 'unknown', r.unknown);
});

if (run('H6')) await guard('H6', async () => {
  const r = await E((scn) => {
    const S = eval(scn), out = {};
    // desirability falls monotonically as the number gets worse, for every direction and scale
    const mono = [];
    [['potency', 'lower'], ['effect', 'higher'], ['window', 'higher'], ['r2', 'higher'], ['ci_fold', 'lower']].forEach(([m, dir]) => {
      const c = hfNewCrit(m), M = METRICS[m], xs = Array.from({ length: 200 }, (_, i) => dir === 'lower' ? Math.pow(10, -1 + i * 0.03) : (m === 'r2' ? 0.5 + i * 0.0025 : m === 'effect' ? i * 0.5 : Math.pow(10, -1 + i * 0.02)));
      const d = xs.map(x => hfDesir(c, M, x)); let bad = 0;
      for (let i = 1; i < d.length; i++) if (dir === 'lower' ? d[i] > d[i - 1] + 1e-12 : d[i] < d[i - 1] - 1e-12) bad++;
      mono.push([m, bad, d[0], d[d.length - 1]]);
    });
    out.mono = mono;
    // an unread gate can never outrank a fully read compound on the guaranteed score
    const full = { id: 'full', primary: S.make({ Potency_nM: 90, Effect_Eff: 82 }), viability: S.make({ Potency_nM: 9000 }) }, partial = { id: 'part', primary: S.make({ Potency_nM: 5, Effect_Eff: 99 }) };
    S.load([full, partial], [hfNewCrit('potency'), hfNewCrit('effect'), hfNewCrit('contrast', { slot2: 'viability', kind: 'gate', missing: 'unknown' })]);
    const vf = HF.verdicts.get('full'), vp = HF.verdicts.get('part');
    out.bounds = { full: [vf.tier, vf.Dlo, vf.Dhi], part: [vp.tier, vp.Dlo, vp.Dhi], order: HF.uni.slice().sort(hfRankCmp) };
    // ties rank by name, whatever order the data arrived in
    const ids = ['c-10', 'c-2', 'c-1', 'c-3', 'b-1'], mk = o => ids.map(id => ({ id, primary: S.make({ Potency_nM: 50, Effect_Eff: 90 }) }));
    // the comparator itself must settle ties: hand it the list in three different orders
    S.load(mk(), [hfNewCrit('potency'), hfNewCrit('effect')]); const o1 = HF.uni.slice().reverse().sort(hfRankCmp);
    S.load(mk().reverse(), [hfNewCrit('potency'), hfNewCrit('effect')]); const o2 = HF.uni.slice().sort((a, b) => (a < b ? 1 : -1)).sort(hfRankCmp);
    out.ties = [o1, o2];
    return out;
  }, SCN);
  check('H6', 'desirability never rises as the number gets worse (potency, effect, window, R², CI)', r.mono.every(m => m[1] === 0 && m[2] !== m[3]), r.mono);
  check('H6', 'a compound with an unread gate keeps its guaranteed score below its best case, and cannot outrank a fully read hit', r.bounds.part[0] === 'unverified' && r.bounds.part[1] < r.bounds.part[2] && r.bounds.full[0] === 'hit' && r.bounds.order[0] === 'full', r.bounds);
  check('H6', 'ties rank by natural name order (c-1, c-2, c-3, c-10) whichever way the data came in', JSON.stringify(r.ties[0]) === JSON.stringify(['b-1', 'c-1', 'c-2', 'c-3', 'c-10']) && JSON.stringify(r.ties[0]) === JSON.stringify(r.ties[1]), r.ties);
});

if (run('H7')) await guard('H7', async () => {
  const r = await E(() => {
    loadHitFinderTestData();
    const uni = HF.uni.slice(), F = HF.funnel, steps = F.steps.map(s => ({ label: hfCritLabel(s.c), in: s.in, dropped: s.dropped.slice(), out: s.out, unknown: s.unknown }));
    // a fresh, independent pass over the gates
    let alive = uni.slice(); const direct = [];
    HF.activeRows.filter(c => c.kind === 'gate').forEach(c => { const gone = alive.filter(ck => hfEvalOne(c, ck).status === 'fail'); direct.push(gone.slice().sort(natCmp)); alive = alive.filter(ck => gone.indexOf(ck) < 0); });
    const dropped = new Set(); let dup = 0; steps.forEach(s => s.dropped.forEach(ck => { if (dropped.has(ck)) dup++; dropped.add(ck); }));
    const sumOk = steps.every((s, i) => s.in - s.dropped.length === s.out && (i === 0 || s.in === steps[i - 1].out));
    const list = steps.map((s, i) => JSON.stringify(s.dropped.slice().sort(natCmp)) === JSON.stringify(direct[i]));
    const rejected = [...HF.verdicts.values()].filter(v => v.tier === 'rejected').length;
    return { n: uni.length, steps: steps.map(s => [s.label, s.in, s.dropped.length, s.out]), dup, sumOk, list, survivors: F.end.length, dropTotal: dropped.size, rejected, alive: alive.length, endSame: JSON.stringify(F.end) === JSON.stringify(alive) };
  });
  check('H7', 'each gate takes in what the last let through, and in − dropped = out', r.sumOk, r.steps);
  check('H7', 'nobody is dropped twice, and survivors + everyone dropped = the whole universe', r.dup === 0 && r.survivors + r.dropTotal === r.n, r);
  check('H7', 'the funnel equals a fresh re-evaluation, gate by gate, name by name', r.list.every(Boolean) && r.endSame, r.list);
  check('H7', 'everyone dropped is a rejected compound, and nobody else is', r.dropTotal === r.rejected, r);
});


const fmtMid = v => (v >= 1000 ? +(v / 1000).toPrecision(3) + ' µM' : v < 1 ? +(v * 1000).toPrecision(3) + ' pM' : +v.toPrecision(3) + ' nM');
const hfReset = () => E(() => { try { localStorage.removeItem('hf_crit_v1'); localStorage.removeItem('hf_dec_v1'); } catch (e) {} HF.crit = null; HF.dec = new Map(); loadHitFinderTestData(); hfTab('criteria'); });
const critId = (metric, slot) => E(([m, sl]) => (HF.crit.rows.find(c => c.metric === m && (c.slot || 'primary') === (sl || 'primary')) || {}).id, [metric, slot]);

if (run('H10')) await guard('H10', async () => {
  await hfReset(); await pg.waitForTimeout(300);
  const id = await critId('potency'), sel = '#crit-' + id + ' input[data-f="pass"]';
  await E(i => { document.querySelector('#crit-' + i).__same = 1; document.querySelector('#crit-' + i + ' input[data-f="pass"]').__same = 1; }, id);
  await pg.locator(sel).click({ clickCount: 3 });
  const seen = [];
  for (const ch of '45.5') { await pg.keyboard.type(ch, { delay: 60 }); seen.push(await E(i => { const el = document.activeElement; return { same: !!(el && el.__same), v: el && el.value, card: !!document.querySelector('#crit-' + i).__same, caret: el && el.selectionStart }; }, id)); await pg.waitForTimeout(60); }
  const r = await E(i => { const c = HF.crit.rows.find(x => x.id === i); const direct = (() => { let n = 0; HF.uni.forEach(ck => { if (hfVerdictOf(ck, HF.activeRows).tier === 'hit') n++; }); return n; })();
    return { pass: c.pass, sentence: document.getElementById('sent-' + i).textContent, hits: HF.counts.hit, direct, badge: document.getElementById('b-hits').textContent, sum: document.getElementById('crit-sum').textContent, counts: document.getElementById('cnt-' + i).textContent }; }, id);
  check('H10', 'every keystroke leaves the focus in the same box, the card standing, the caret at the end', seen.length === 4 && seen.every((x, k) => x.same && x.card && x.v === '45.5'.slice(0, k + 1) && x.caret === k + 1), seen);
  check('H10', 'what was typed is the threshold (45.5 nM), and the sentence says so', r.pass === 45.5 && /45\.5 nM/.test(r.sentence), r);
  check('H10', 'the hit total, the badge and the summary follow it, and equal a fresh re-evaluation', r.hits === r.direct && +r.badge === r.hits && new RegExp('^' + r.hits + ' hits').test(r.sum), r);
  // a half-typed number does not break anything: "4." and "" keep the old value without an error state on a pass edge
  await pg.locator(sel).click({ clickCount: 3 }); await pg.keyboard.type('-', { delay: 40 });
  const bad = await E(i => ({ bad: document.querySelector('#crit-' + i + ' input[data-f="pass"]').classList.contains('bad'), pass: HF.crit.rows.find(x => x.id === i).pass, hits: HF.counts.hit }), id);
  check('H10', 'an unreadable value is marked and ignored: the last good threshold stands', bad.bad && bad.pass === 45.5, bad);
});

if (run('H18')) await guard('H18', async () => {
  await hfReset(); await pg.waitForTimeout(300);
  const id = await critId('potency'), box = await pg.locator('#crit-' + id + ' .hh[data-h="pass"] circle').boundingBox();
  const before = await E(i => ({ pass: HF.crit.rows.find(c => c.id === i).pass, hits: HF.counts.hit, text: document.getElementById('cnt-' + i).textContent }), id);
  await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.down();
  await pg.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 8 });
  await pg.waitForTimeout(120);      // the patch is made on the next animation frame
  const mid = await E(i => { const c = HF.crit.rows.find(x => x.id === i); return { pass: c.pass, hits: HF.counts.hit, direct: HF.uni.filter(ck => hfVerdictOf(ck, HF.activeRows).tier === 'hit').length, dragging: HF.dragging, text: document.getElementById('cnt-' + i).textContent, sent: document.getElementById('sent-' + i).textContent }; }, id);
  await pg.mouse.up(); await pg.waitForTimeout(200);
  const after = await E(i => { const c = HF.crit.rows.find(x => x.id === i); const direct = HF.uni.filter(ck => hfVerdictOf(ck, HF.activeRows).tier === 'hit').length;
    // the same number, typed
    const keep = c.pass; c.pass = +c.pass; hfComputeVerdicts(); const typed = HF.counts.hit; return { pass: c.pass, hits: HF.counts.hit, direct, typed, soft: c.fail, ok: c.fail == null || c.fail >= c.pass, dragging: HF.dragging }; }, id);
  check('H18', 'dragging the handle left lowers the pass edge, live: before the pointer is let go the counts and the sentence already follow it', mid.dragging === true && mid.pass < before.pass && mid.hits === mid.direct && mid.text !== before.text && mid.sent.indexOf(fmtMid(mid.pass)) >= 0, { before, mid });
  check('H18', 'after the drop the hit total equals a fresh re-evaluation and the soft edge never sits inside the pass edge', after.hits === after.direct && after.typed === after.hits && after.ok && after.dragging === false, after);
  // the keyboard
  const k0 = await E(i => HF.crit.rows.find(c => c.id === i).pass, id);
  await pg.locator('#crit-' + id + ' .hh[data-h="pass"]').focus(); await pg.keyboard.press('ArrowRight');
  const k1 = await E(i => ({ pass: HF.crit.rows.find(c => c.id === i).pass, focus: document.activeElement && document.activeElement.dataset && document.activeElement.dataset.h }), id);
  await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('ArrowLeft');
  const k2 = await E(i => HF.crit.rows.find(c => c.id === i).pass, id);
  check('H18', 'the arrow keys move a focused handle, and the focus stays on it', k1.pass > k0 && k1.focus === 'pass' && k2 < k1.pass, { k0, k1, k2 });
});

if (run('H14')) await guard('H14', async () => {
  await hfReset(); await E(() => hfTab('hits')); await pg.waitForTimeout(500);
  await pg.locator('#hits-scroll').focus();
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown');
  const sel1 = await E(() => ({ sel: HF.hits.sel, first: HF.hitList[0], second: HF.hitList[1] }));
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const open = await E(() => ({ open: document.getElementById('hf-drawer').classList.contains('open'), drawer: HF.drawer, title: document.querySelector('#hf-drawer h3').textContent }));
  const tier0 = await E(ck => HF.verdicts.get(ck).tier, open.drawer);
  await pg.keyboard.press('h'); await pg.keyboard.press('x');
  await pg.locator('#hf-drawer textarea').fill('re-test at lower top dose'); await pg.waitForTimeout(150);
  // the verdicts are made again, as they are on every change, and must not have read the call
  const dec = await E(ck => { hfComputeVerdicts(); return { d: HF.dec.get(ck), tier: HF.verdicts.get(ck).tier, stored: localStorage.getItem('hf_dec_v1') }; }, open.drawer);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
  const closed = await E(() => !document.getElementById('hf-drawer').classList.contains('open'));
  // criteria change; the call stays, the tier may move
  await E(() => { const c = HF.crit.rows.find(x => x.metric === 'potency'); c.pass = 1; c.fail = 2; hfComputeVerdicts(); hfRender(); });
  const kept = await E(ck => ({ d: HF.dec.get(ck), tierNow: HF.verdicts.get(ck).tier }), open.drawer);
  await pg.keyboard.press('/'); const focus = await E(() => document.activeElement && document.activeElement.id);
  await pg.reload(); await pg.waitForTimeout(500);
  const reloaded = await E(ck => ({ d: HF.dec.get(ck) }), open.drawer);
  check('H14', 'the arrows move through the ranked list', sel1.sel === sel1.second, sel1);
  check('H14', 'Enter opens the drawer on that compound', open.open && open.drawer === sel1.second && /HF-\d+/.test(open.title), open);
  check('H14', 'h then x leaves the last call (reject) and the note beside the tier — which did not move', dec.d && dec.d.state === 'reject' && dec.d.note === 're-test at lower top dose' && dec.tier === tier0, { dec, tier0 });
  check('H14', 'Escape closes the drawer', closed, closed);
  check('H14', 'a change of criteria keeps the call (the tier may move, the call does not)', kept.d && kept.d.state === 'reject', kept);
  check('H14', '/ goes to the search box', focus === 'hits-q', focus);
  check('H14', 'after a reload the call and the note are still there', reloaded.d && reloaded.d.state === 'reject' && reloaded.d.note === 're-test at lower top dose', reloaded);
});

if (run('H19')) await guard('H19', async () => {
  const r = await E((scn) => {
    const S = eval(scn), cmps = [], rnd = hfRng(5);
    for (let i = 0; i < 5000; i++) { const dc = hfLogU(rnd, 0.5, 5000); cmps.push({ id: 'BIG-' + String(i + 1).padStart(4, '0'), primary: S.make({ Potency_nM: dc, Effect_Eff: 30 + rnd() * 68 }), viability: S.make({ Potency_nM: rnd() < 0.7 ? 1e5 : dc * (1 + rnd() * 20), Potency_Qualifier: 'exact' }) }); }
    const t0 = performance.now(); S.load(cmps, [hfNewCrit('potency'), hfNewCrit('effect'), hfNewCrit('contrast', { slot2: 'viability' })]); const load = performance.now() - t0;
    hfTab('hits'); const dom = document.querySelectorAll('#hits-body .h-r').length, total = HF.hitList.length;
    const t1 = performance.now(); const c = HF.crit.rows[0]; c.pass = 50; hfCritPatch(c); const patch = performance.now() - t1;
    const sc = document.getElementById('hits-scroll'); sc.scrollTop = sc.scrollHeight; sc.dispatchEvent(new Event('scroll'));
    const rows = [...document.querySelectorAll('#hits-body .h-r')].map(x => x.dataset.ck), last = HF.hitList[HF.hitList.length - 1];
    return { n: HF.uni.length, load: Math.round(load), patch: Math.round(patch), dom, total, lastShown: rows.indexOf(last) >= 0, rowsAfter: rows.length };
  }, SCN);
  check('H19', '5000 compounds load and judge in a few seconds, and a moved threshold is patched in well under one', r.n === 5000 && r.load < 8000 && r.patch < 1500, r);
  check('H19', 'only the rows in view are built (not thousands), and the last compound is reachable by scrolling', r.dom < 120 && r.rowsAfter < 120 && r.total > 100 && r.lastShown, r);
});


if (run('H11')) await guard('H11', async () => {
  await hfReset(); await E(() => hfTab('plots')); await pg.waitForTimeout(500);
  const r = await E(() => {
    const out = { plots: Object.keys(HF.plots) };
    out.counts = out.plots.map(id => { const d = HF.plots[id], dom = document.querySelectorAll('#pl-' + id + ' svg.plot .mk').length; return [id, d.spec.pts.length, dom, d.spec.pts.filter(p => p.xb || p.yb).length, document.querySelectorAll('#pl-' + id + ' svg.plot .mk path[d^="M"][fill]').length]; });
    const fillOf = () => { const m = document.querySelector('#pl-dmax .mk circle[fill="var(--good)"], #pl-dmax .mk path[fill="var(--good)"]'); return m ? getComputedStyle(m).fill : null; };
    out.light = fillOf(); document.documentElement.setAttribute('data-theme', 'dark'); out.dark = fillOf(); document.documentElement.setAttribute('data-theme', 'light');
    // the shaded corner is the criteria's
    const zone = () => { const z = document.querySelector('#pl-dmax .zp'); return z ? +z.getAttribute('width') : null; };
    out.z0 = zone(); const c = HF.crit.rows.find(x => x.metric === 'potency'); const keep = c.pass; c.pass = 10; hfComputeVerdicts(); hfRenderPlots(); out.z1 = zone(); c.pass = keep; hfComputeVerdicts(); hfRenderPlots();
    return out;
  });
  check('H11', 'each plot draws every compound it has points for, once', r.counts.length >= 4 && r.counts.every(c => c[1] === c[2] && c[1] > 0), r.counts);
  check('H11', 'the colour is the theme\'s: a hit is green in both, and the two greens differ', r.light && r.dark && r.light !== r.dark, [r.light, r.dark]);
  check('H11', 'the shaded corner is the criteria\'s: tightening the potency edge shrinks it', r.z0 > r.z1 && r.z1 > 0, [r.z0, r.z1]);
  // exports
  const files = await E(() => { const o = {}; HF.plots && Object.keys(HF.plots).forEach(id => { const f = hfPlotFile(id); o[id] = f ? { svg: f.svg, n: (f.svg.match(/data-ck=/g) || []).length, dom: HF.plots[id].spec.pts.length } : null; }); return o; });
  const ids = Object.keys(files);
  check('H11', 'every exported SVG is on white, draws as many compounds as the screen, and carries no CSS variable and no NaN', ids.length >= 4 && ids.every(id => { const f = files[id]; return f && /<rect width="720" height="520" fill="#ffffff"/.test(f.svg) && !/var\(/.test(f.svg) && !/NaN|undefined/.test(f.svg) && f.n === f.dom && /^<svg xmlns=/.test(f.svg); }), ids.map(id => [id, files[id] && files[id].n, files[id] && files[id].dom, files[id] && /var\(/.test(files[id].svg)]));
  const dl = async (fn) => { const [d] = await Promise.all([pg.waitForEvent('download', { timeout: 20000 }), E(fn)]); const p = await d.path(); return { name: d.suggestedFilename(), buf: fs.readFileSync(p) }; };
  const png = await dl(() => hfPlotSave('dmax', 'png')), csv = await dl(() => hfPlotSave('dmax', 'csv')), svg = await dl(() => hfPlotSave('window', 'svg'));
  const n = await E(() => HF.plots.dmax.spec.pts.length);
  check('H11', 'the PNG is a real PNG, four times the plot\'s size; the CSV has a row per plotted compound; the SVG file is the SVG', png.buf.slice(1, 4).toString() === 'PNG' && png.buf.readUInt32BE(16) === 720 * 4 && csv.buf.toString('utf8').split('\r\n').length === n + 1 && /^<svg /.test(svg.buf.toString()) && /hitfinder_dmax\.png/.test(png.name), { png: png.buf.length, w: png.buf.readUInt32BE(16), rows: csv.buf.toString('utf8').split('\r\n').length, n });
  // table view
  await E(() => hfPlotTable('dmax'));
  const tb = await E(() => ({ rows: document.querySelectorAll('#pl-dmax tbody tr').length, n: HF.plots.dmax.spec.pts.length, svg: !!document.querySelector('#pl-dmax svg.plot') }));
  await E(() => hfPlotTable('dmax'));
  check('H11', 'the table view lists the same compounds as the plot', tb.rows === tb.n && !tb.svg, tb);
  // brushing: a rectangle on one plot picks the same compounds in all
  const geo = await E(() => { const d = HF.plots.dmax, box = d.r.box, svg = document.querySelector('#pl-dmax svg.plot'), b = svg.getBoundingClientRect(), k = b.width / d.r.W; const xs = d.r.pts.map(p => p.x).sort((a, c) => a - c);
    const cx = box[0] + (xs[Math.floor(xs.length * 0.6)] - box[0]), cy = box[1] + (box[3] - box[1]) * 0.45; const want = d.r.pts.filter(p => p.x <= cx && p.y <= cy).map(p => p.ck).sort();
    return { x0: b.left + (box[0] + 2) * k, y0: b.top + (box[1] + 2) * k, x1: b.left + cx * k, y1: b.top + cy * k, want, xonly: d.r.pts.filter(p => p.x <= cx).length, hit: document.elementFromPoint(b.left + (box[0] + 2) * k, b.top + (box[1] + 2) * k).closest('.mk') }; });
  await pg.mouse.move(geo.x0, geo.y0); await pg.mouse.down(); await pg.mouse.move((geo.x0 + geo.x1) / 2, (geo.y0 + geo.y1) / 2, { steps: 5 }); await pg.mouse.move(geo.x1, geo.y1, { steps: 5 }); await pg.mouse.up(); await pg.waitForTimeout(200);
  const sel = await E(() => ({ sel: [...HF.selSet].sort(), bar: (document.getElementById('selbar') || {}).textContent, rings: [...document.querySelectorAll('svg.plot')].map(sv => sv.querySelectorAll('.selr').length), exp: Object.keys(HF.plots).map(id => HF.plots[id].spec.pts.filter(p => HF.selSet.has(p.ck)).length) }));
  check('H11', 'a rectangle dragged on the plot picks exactly the compounds inside it (and not everything left of its edge)', geo.want.length > 0 && geo.xonly > geo.want.length && JSON.stringify(sel.sel) === JSON.stringify(geo.want), { want: geo.want.length, got: sel.sel.length });
  check('H11', 'they are ringed in every plot that shows them, and the bar says how many', sel.rings.every((n, i) => n === sel.exp[i]) && sel.rings.some(n => n > 0) && new RegExp('^' + sel.sel.length).test(sel.bar || ''), sel);
  await E(() => hfSelToHits()); await pg.waitForTimeout(300);
  const lst = await E(() => ({ list: [...HF.hitList].sort(), sel: [...HF.selSet].sort(), tab: HF.ui.tab }));
  check('H11', 'Show in Hits lists exactly the selection, whatever its tier', lst.tab === 'hits' && JSON.stringify(lst.list) === JSON.stringify(lst.sel), lst);
  await E(() => { hfSelClear(); HF.hits.useSel = false; });
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
    hfTab('screens');
    const vis = $$('.tab:not([hidden])').map(t => t.dataset.tab), sel = () => $$('.tab[aria-selected="true"]').map(t => t.dataset.tab);
    const o = { vis, start: sel(), shown: $$('.tab').filter(t => t.offsetParent !== null).map(t => t.dataset.tab), hiddenShown: $$('[hidden]').filter(e => getComputedStyle(e).display !== 'none').length };
    const key = k => $('#hf-tabs').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    key('ArrowRight'); o.right = sel(); key('End'); o.end = sel(); key('Home'); o.home = sel(); key('ArrowLeft'); o.left = sel();
    hfTab('hits'); await wait(350);
    const a = $('.tab.active'), ink = $('#hf-ink'), m = (ink.style.transform.match(/translateX\(([\d.]+)px\) scaleX\(([\d.]+)\)/) || []);
    o.ink = { dx: Math.abs(+m[1] - a.offsetLeft), dw: Math.abs(+m[2] - a.offsetWidth) };
    o.panes = $$('.tabpane.active').map(p => p.id);
    hfTab('screens');
    return o;
  });
  check('H17', 'a tab (or anything) marked hidden is not drawn: the tabs on screen are exactly the ones that exist', JSON.stringify(r.shown) === JSON.stringify(r.vis) && r.hiddenShown === 0, { shown: r.shown, vis: r.vis, hiddenShown: r.hiddenShown });
  check('H17', 'exactly one tab is selected at the start', JSON.stringify(r.start) === '["screens"]', r.start);
  const vv = r.vis, last = vv[vv.length - 1];
  check('H17', 'ArrowRight / End / Home / ArrowLeft move and select (over the tabs that exist)', JSON.stringify(r.right) === JSON.stringify([vv[1]]) && JSON.stringify(r.end) === JSON.stringify([last]) && JSON.stringify(r.home) === JSON.stringify([vv[0]]) && JSON.stringify(r.left) === JSON.stringify([last]), r);
  check('H17', 'the underline sits under the active tab; exactly one pane shows', r.ink.dx < 1.5 && r.ink.dw < 1.5 && JSON.stringify(r.panes) === '["pane-hits"]', r);
});

if (run('H8')) await guard('H8', async () => {
  const hasX = await E(() => !!window.XLSX); if (!hasX) { skipped.push('H8 — SheetJS did not load'); return; }
  await E(async () => { try { indexedDB.deleteDatabase('hitfinder'); } catch (e) {} });
  await hfReset();
  // make the criteria non-default, make some calls, merge a pair, edit a target: a round trip of the defaults proves nothing
  await E(() => {
    HF.crit.rows.find(c => c.metric === 'potency').pass = 30; HF.crit.rows.find(c => c.metric === 'potency').fail = 90;
    HF.crit.name = 'Tightened (test)'; hfComputeVerdicts(); hfRender();
    const hits = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'hit'), unv = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'unverified'), rej = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'rejected');
    hfDecide(hits[0], 'reject'); hfNote(hits[0], 'looks like an aggregator'); hfDecide(rej[0], 'hit'); if (unv[0]) hfDecide(unv[0], 'hit'); hfDecide(hits[1], 'maybe');
    window.__t = { rejected: hits[0], forced: rej[0], unv: unv[0] || null };
  });
  // ① the workbook, written for real and read back
  const wbr = await E(() => {
    const bytes = XLSX.write(hfWorkbook(), { bookType: 'xlsx', type: 'array' }), wb = XLSX.read(bytes, { type: 'array' });
    const sh = n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null });
    const all = sh('All compounds'), hits = sh('Hits'), crit = sh('Criteria used'), want = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'hit' || HF.verdicts.get(ck).tier === 'borderline').sort(hfRankCmp).map(hfName);
    const col = (a, n) => a[0].indexOf(n);
    const out = { names: wb.SheetNames, nHits: hits.length - 1, hitNames: hits.slice(1).map(r => r[col(hits, 'Compound')]), wantNames: want, ranks: hits.slice(1).map(r => r[0]), counts: HF.counts, zip: new Uint8Array(bytes)[0] === 0x50 && new Uint8Array(bytes)[1] === 0x4B };
    // rebuild the criteria from the sheet alone, re-judge every compound, compare with what the workbook says each one is
    const saved = HF.crit; let rows = null; try { rows = hfCritFromAoa(crit); } catch (e) {}
    out.critRows = rows ? rows.length : 0; out.critSame = rows && JSON.stringify(rows) === JSON.stringify(saved.rows);
    if (rows) { HF.crit = Object.assign({}, saved, { rows }); hfComputeVerdicts(); const ti = col(all, 'Tier'), ni = col(all, 'Compound'), byName = new Map(); HF.uni.forEach(ck => byName.set(hfName(ck), TIER_NAME[HF.verdicts.get(ck).tier]));
      out.mismatch = all.slice(1).filter(r => byName.get(r[ni]) !== r[ti]).length; out.n = all.length - 1; HF.crit = saved; hfComputeVerdicts(); }
    // numbers are numbers and missing is blank
    const hdr = all[0], ix = n => hdr.indexOf(n), zero = ['Potency_nM', 'Hook_Onset_nM', 'Last_Productive_nM', 'Window_x', 'Hill', 'Hook_Depth_pct'].map(n => [n, all.slice(1).filter(r => r[ix(n)] === 0).length]).filter(x => x[1]);
    const strNum = all.slice(1).filter(r => typeof r[ix('Potency_nM')] === 'string').length;
    const bound = HF.uni.filter(ck => { const g = hfPrimOf(ck); return g && g.n && g.pot.q !== 'exact'; }).map(hfName), boundRows = all.slice(1).filter(r => bound.indexOf(r[ix('Compound')]) >= 0);
    out.zero = zero; out.strNum = strNum; out.nBound = boundRows.length; out.boundHasNumber = boundRows.filter(r => typeof r[ix('Potency_nM')] === 'number').length;
    const noHook = all.slice(1).filter(r => !r[ix('Hook')] || r[ix('Hook')] === 'none'); out.noHookWithOnset = noHook.filter(r => r[ix('Hook_Onset_nM')] != null).length;
    out.sheetsAoa = hfSheets().map(s => s.name);
    return out;
  });
  const want = ['Summary', 'Hits', 'All compounds', 'Criteria used', 'Funnel', 'Screens and slots', 'Decisions', 'Cherry-pick', 'Screen data', 'Provenance'];
  check('H8', 'the file is a real workbook with the ten sheets, in this order', wbr.zip && JSON.stringify(wbr.names) === JSON.stringify(want) && JSON.stringify(wbr.sheetsAoa) === JSON.stringify(want), { names: wbr.names, zip: wbr.zip });
  check('H8', 'the Hits sheet is the Hits tab: the same compounds, in the same order, ranked 1…n', wbr.nHits === wbr.counts.hit + wbr.counts.borderline && JSON.stringify(wbr.hitNames) === JSON.stringify(wbr.wantNames) && wbr.ranks.every((r, i) => r === i + 1), { got: wbr.hitNames.slice(0, 5), want: wbr.wantNames.slice(0, 5), n: wbr.nHits });
  check('H8', 'the Criteria sheet alone re-creates the criteria exactly', wbr.critRows > 0 && wbr.critSame, { rows: wbr.critRows, same: wbr.critSame });
  check('H8', 'and judging every compound with them gives the tier the workbook gives it, for all compounds', wbr.n > 20 && wbr.mismatch === 0, { n: wbr.n, mismatch: wbr.mismatch });
  check('H8', 'a number is a number: no zero where a value is missing, nothing numeric stored as text', wbr.zero.length === 0 && wbr.strNum === 0, { zero: wbr.zero, strNum: wbr.strNum });
  check('H8', 'a bound (> or <) leaves the potency cell blank and says so in the qualifier; a compound with no hook has no onset', wbr.nBound > 0 && wbr.boundHasNumber === 0 && wbr.noHookWithOnset === 0, { nBound: wbr.nBound, boundHasNumber: wbr.boundHasNumber, noHookWithOnset: wbr.noHookWithOnset });

  // the workbook is also a way back in: its Screen data sheet is the screens and its Criteria sheet the criteria, so the same list comes out
  const rt = await E(async () => {
    const tiersOf = () => JSON.stringify([...HF.verdicts].map(([k, v]) => [k, v.tier]).sort()), want = tiersOf(), names = HF.crit.name;
    const bytes = XLSX.write(hfWorkbook(), { bookType: 'xlsx', type: 'array' }), f = new File([bytes], 'HitFinder_export.xlsx');
    hfResetSession(); HF.crit = null; HF.dec = new Map(); hfRecompute();
    await hfAddFiles([f]); const asked = !!document.querySelector('#hf-crit-go'); document.querySelector('#hf-crit-go') && document.querySelector('#hf-crit-go').click(); await new Promise(r => setTimeout(r, 300));
    return { asked, same: tiersOf() === want, name: HF.crit.name, n: HF.uni.length };
  });
  check('H8', 'the workbook opened as a file brings its screens back and offers its criteria; with them every compound lands in the same tier', rt.asked && rt.same && /Criteria from HitFinder_export/.test(rt.name), rt);
  await hfReset();
  await E(() => { HF.crit.rows.find(c => c.metric === 'potency').pass = 30; HF.crit.rows.find(c => c.metric === 'potency').fail = 90; hfComputeVerdicts(); });

  // ② nothing a spreadsheet would run leaves in any file
  const inj = await E(() => {
    const evil = ['=HYPERLINK("http://x","y")', '+1+1', '-2+3', '@SUM(A1)', '=-1', '=cmd|\' /C calc\'!A0'], cks = HF.uni.slice(0, evil.length);
    cks.forEach((ck, i) => { HF.recs.forEach(r => { if (r._ck === ck) r.Compound = evil[i]; }); });
    hfRecompute(); hfNote(hfCk(evil[0]), '=1+1'); hfNote(hfCk(evil[1]), '@x');
    const bad = [];
    const scan = (where, v) => { if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) && !HF_NUMLIKE.test(v)) bad.push(where + ': ' + v.slice(0, 24)); };
    hfSheets().forEach(sh => sh.aoa.forEach(r => r.forEach(v => scan(sh.name, v))));
    const csv = hfCsvOf(hfTable(HF.uni.slice().sort(hfRankCmp), true)), cherry = hfCsvOf(hfCherryRows(new Set(['hit', 'borderline', 'unverified', 'rejected'])));
    [csv, cherry].forEach((text, j) => hfParseCSV(text.replace(/^\uFEFF/, '')).forEach(row => row.forEach(v => { if (/^[=+\-@\t\r]/.test(v) && !HF_NUMLIKE.test(v)) bad.push('csv' + j + ': ' + v.slice(0, 24)); })));
    const present = evil.map(e => HF.names.get(hfCk(e)) && [...HF.names.get(hfCk(e)).keys()][0] === e);
    return { bad, present, plain: csvCell('-5') === '-5' && csvCell(-5) === '-5' && csvCell('1e-3') === '1e-3', formula: csvCell('-2+3') === "'-2+3" && csvCell('=1+1') === "'=1+1" };
  });
  check('H8', 'the hostile names were really in the data (so the scan means something)', inj.present.every(Boolean), inj.present);
  check('H8', 'no cell in any sheet or CSV starts with = + - @ or a control character unless it is a number', inj.bad.length === 0, inj.bad.slice(0, 5));
  check('H8', 'a real negative number is left alone and a formula that starts like one is not', inj.plain && inj.formula, inj);
  await hfReset();

  // ③ cherry-pick
  const ch = await E(() => {
    HF.crit.rows.find(c => c.metric === 'potency').pass = 30; HF.crit.rows.find(c => c.metric === 'potency').fail = 90; hfComputeVerdicts();
    const hits = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'hit'), unv = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'unverified'), rej = HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'rejected');
    hfDecide(hits[0], 'reject'); hfDecide(rej[0], 'hit');
    const rows = hfCherryRows(new Set(['hit', 'borderline'])), hdr = rows[0], ix = n => hdr.indexOf(n), body = rows.slice(1), names = body.map(r => r[ix('Compound')]);
    const grid = x => { const e = Math.floor(Math.log10(x) + 1e-9), m = Math.round(x / Math.pow(10, e) * 1000) / 1000; return [1, 3, 10].indexOf(m) >= 0; };
    const exact = body.filter(r => r[ix('Qualifier')] === 'exact' && r[ix('Retest_Top_nM')] != null && r[ix('Retest_Top_nM')] < 100000 && !/extended/.test(r[ix('Basis')]));
    const hook = body.filter(r => r[ix('Hook')] === 'excluded');
    const onsetOf = nm => { const g = hfPrimOf(hfCk(nm)); return g && g.hook ? g.hook.onset : null; };
    return { rejectedOut: names.indexOf(hfName(hits[0])) < 0, forcedIn: names.indexOf(hfName(rej[0])) >= 0, unvIn: true,
      onlyTiers: body.every(r => ['Hit', 'Borderline'].indexOf(r[ix('Tier')]) >= 0 || r[ix('Your_Call')] === 'hit'),
      ratio: body.filter(r => r[ix('Retest_Top_nM')] != null).every(r => Math.abs(r[ix('Retest_Top_nM')] / r[ix('Retest_Bottom_nM')] / 19683 - 1) < 1e-4 && r[ix('Points')] === 10 && r[ix('Fold')] === 3),
      grid: body.filter(r => r[ix('Retest_Top_nM')] != null).every(r => grid(r[ix('Retest_Top_nM')])),
      centred: exact.length > 0 && exact.every(r => { const mid = Math.sqrt(r[ix('Retest_Top_nM')] * r[ix('Retest_Bottom_nM')]); return Math.abs(Math.log10(mid / r[ix('Potency_nM')])) < 0.3; }), nExact: exact.length,
      hookPast: hook.length > 0 && hook.every(r => r[ix('Retest_Top_nM')] >= Math.min(100000, onsetOf(r[ix('Compound')]) * 5)), nHook: hook.length,
      bounded: body.filter(r => r[ix('Qualifier')] === '>' || r[ix('Qualifier')] === 'n.d.').every(r => /no midpoint/.test(r[ix('Basis')])),
      withUnv: hfCherryRows(new Set(['hit', 'borderline', 'unverified'])).length > rows.length || !unv.length, csv: hfCsvOf(rows).split('\r\n')[0] };
  });
  check('H8', 'cherry-pick: a rejected compound is out, a hit you picked is in, and nothing else is outside the tiers chosen', ch.rejectedOut && ch.forcedIn && ch.onlyTiers && ch.unvIn, ch);
  check('H8', 'cherry-pick: every range is 10 points, 3-fold (top ÷ bottom = 3⁹), on the 1-3-10 grid, and centred on the potency', ch.ratio && ch.grid && ch.centred, ch);
  check('H8', 'cherry-pick: a compound with a hook keeps its top points out past it, a bound says it has no midpoint, and more tiers add rows', ch.hookPast && ch.bounded && ch.withUnv, ch);
  check('H8', 'cherry-pick CSV opens with a byte-order mark and the header', /^﻿Rank,Compound,Tier,Your_Call,Potency_nM/.test(ch.csv), ch.csv);

  // ④ the project
  const snap = `(() => ({ v: [...HF.verdicts].map(([k, v]) => [k, v.tier, v.Dlo == null ? null : +v.Dlo.toFixed(9)]).sort(), dec: JSON.stringify([...HF.dec].sort()), crit: JSON.stringify(HF.crit.rows), arms: [...HF.arms.values()].map(a => [a.key, a.slot, a.guessed, a.target]).sort(), scr: [...HF.screens.values()].map(s => [s.key, s.role, s.target, s.cell, s.tp]).sort(), alias: [...HF.alias].sort(), n: HF.recs.length }))()`;
  const pr = await E((snapSrc) => {
    hfRecompute();
    const a = HF.uni[3], b = HF.uni[4]; hfMerge(b, a);   // a is now read as b
    const sc = [...HF.screens.values()][0]; hfSetScr(sc.key, 'target', 'XYZ'); hfSetScr(sc.key, 'cell', 'HEK-test');
    const arm = [...HF.arms.values()].find(x => x.slot === 'viability'); if (arm) hfSetArm(arm.key, 'slot', 'counter');
    const before = eval(snapSrc), txt = JSON.stringify(hfProject());
    const bad = (() => { try { hfLoadProject({ hello: 1 }); return 'did not throw'; } catch (e) { return String(e.message); } })(); const untouched = eval(snapSrc);
    hfResetSession(); HF.crit = null; HF.dec = new Map(); hfRecompute();
    const emptied = HF.recs.length === 0 && HF.dec.size === 0;
    hfLoadProject(JSON.parse(txt)); const after = eval(snapSrc);
    return { before, after, emptied, bad, untouchedSame: JSON.stringify(untouched) === JSON.stringify(before), size: txt.length, cols: JSON.parse(txt).cols.length, scrCols: SCR_COLS.length, nrecs: before.n };
  }, snap);
  check('H8', 'a project round-trips: every verdict and score, your calls, the criteria, the slots, the merges and the targets you edited', JSON.stringify(pr.before) === JSON.stringify(pr.after) && pr.emptied && pr.nrecs > 100, { same: JSON.stringify(pr.before) === JSON.stringify(pr.after), emptied: pr.emptied, n: pr.nrecs, diff: ['v', 'dec', 'crit', 'arms', 'scr', 'alias'].filter(k => JSON.stringify(pr.before[k]) !== JSON.stringify(pr.after[k])) });
  check('H8', 'a file that is not a project is refused and changes nothing', /not a Hit Finder project/.test(pr.bad) && pr.untouchedSame, { bad: pr.bad, same: pr.untouchedSame });
  // opening one over a loaded session asks first, and "keep what I have" keeps it
  const dlg = await E(async () => {
    const p = JSON.parse(JSON.stringify(hfProject())); p.crit.name = 'FROM-FILE';
    const f = new File([JSON.stringify(p)], 'x.hitfinder.json', { type: 'application/json' }), before = HF.crit.name;
    await hfAddFiles([f]); const d1 = !!document.querySelector('#hf-dlg'), keepBtn = [...document.querySelectorAll('#hf-dlg .btn')].find(b => /Keep/.test(b.textContent));
    keepBtn && keepBtn.click(); await new Promise(r => setTimeout(r, 400)); const kept = HF.crit.name === before;
    await hfAddFiles([f]); document.querySelector('#hf-open-go') && document.querySelector('#hf-open-go').click(); await new Promise(r => setTimeout(r, 400));
    return { asked: d1, kept, opened: HF.crit.name === 'FROM-FILE', tab: HF.ui.tab };
  });
  check('H8', 'opening a project over a loaded session asks first; "Keep what I have" keeps it and "Open it" replaces it', dlg.asked && dlg.kept && dlg.opened && dlg.tab === 'hits', dlg);

  // ⑤ autosave, a reload, and the session before
  await hfReset();
  await E(() => { HF.crit.name = 'AUTOSAVED'; HF.crit.rows.find(c => c.metric === 'potency').pass = 55; hfSaveCrit(); hfComputeVerdicts(); hfRender(); });
  await pg.waitForTimeout(1800);
  const saved = await E(async () => { const o = await hfSessGet('last'); return o ? { name: o.crit.name, pass: o.crit.rows.find(c => c.metric === 'potency').pass, rows: o.recs.length } : null; });
  check('H8', 'the session is kept on this device as you work', !!saved && saved.name === 'AUTOSAVED' && saved.pass === 55 && saved.rows > 100, saved);
  const beforeTiers = await E(() => JSON.stringify([...HF.verdicts].map(([k, v]) => [k, v.tier]).sort()));
  await pg.reload(); await pg.waitForTimeout(1500);
  const offer = await E(() => ({ card: !!document.querySelector('#hf-resume'), empty: HF.screens.size === 0, text: (document.querySelector('#hf-resume') || {}).textContent || '' }));
  check('H8', 'after a reload the empty app offers to pick up where you left off, with what is in it', offer.empty && offer.card && /screens/.test(offer.text) && /Resume/.test(offer.text), offer);
  const back = await E(async () => { await hfResume('last'); await new Promise(r => setTimeout(r, 300)); return { tiers: JSON.stringify([...HF.verdicts].map(([k, v]) => [k, v.tier]).sort()), name: HF.crit.name, tab: HF.ui.tab }; });
  check('H8', 'Resume puts every verdict back exactly', back.tiers === beforeTiers && back.name === 'AUTOSAVED', { same: back.tiers === beforeTiers, name: back.name });
  // starting something else must not lose it: the one before is kept as "previous"
  await pg.reload(); await pg.waitForTimeout(1200);
  await E(() => { hfResetSession(); loadHitFinderTestData(); HF.crit.name = 'SOMETHING ELSE'; hfSaveCrit(); });
  await pg.waitForTimeout(1800);
  const prev = await E(async () => { const p = await hfSessGet('prev'), l = await hfSessGet('last'); return { prev: p && p.crit.name, last: l && l.crit.name }; });
  check('H8', 'a new session never overwrites the last one: it becomes "previous" and can be reopened', prev.prev === 'AUTOSAVED' && prev.last === 'SOMETHING ELSE', prev);
  await E(() => hfTab('export')); await pg.waitForTimeout(500);
  const link = await E(() => !![...document.querySelectorAll('#pane-export .lnk')].find(b => /before this one/.test(b.textContent)));
  check('H8', 'and the Export tab says so, with a way back', link, link);

  // ⑥ the page you print
  await hfReset(); await E(() => { HF.crit.rows.find(c => c.metric === 'potency').pass = 30; hfComputeVerdicts(); hfRender(); hfDecide(HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'hit')[0], 'hit'); });
  const pageData = await E(() => { const ok = hfBuildPrint(); return { ok, hits: HF.uni.filter(ck => HF.verdicts.get(ck).tier === 'hit').sort(hfRankCmp).slice(0, 25).map(hfName), counts: HF.counts, gates: HF.activeRows.filter(c => c.kind === 'gate').length, steps: HF.funnel.steps.length }; });
  await pg.emulateMedia({ media: 'print' }); await pg.waitForTimeout(200);
  const pp = await E(() => {
    const vis = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
    const kids = [...document.body.children].filter(e => vis(e) && e.tagName !== 'SCRIPT').map(e => e.id || e.tagName);
    const root = document.getElementById('hf-print'), lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
    const texts = [...root.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()), light = texts.filter(e => lum(getComputedStyle(e).color) > 0.5).map(e => e.textContent.slice(0, 20));
    const tiles = [...root.querySelectorAll('.pr-tiles b')].map(e => +e.textContent), rowsN = [...root.querySelectorAll('table.pr-t:not(.pr-f) tbody tr')].map(r => r.children[1].querySelector('b').textContent);
    return { kids, bodyBg: getComputedStyle(document.body).backgroundColor, light, tiles, rowsN, steps: root.querySelectorAll('.pr-f tr').length, gates: root.querySelectorAll('.pr-c li').length, svg: !!root.querySelector('svg'), noVar: !/var\(/.test(root.innerHTML), width: root.getBoundingClientRect().width, text: root.textContent.length };
  });
  await pg.emulateMedia({ media: 'screen' });
  const scr = await E(() => getComputedStyle(document.getElementById('hf-print')).display);
  check('H8', 'printing shows the summary and nothing else, on white', pp.kids.length === 1 && pp.kids[0] === 'hf-print' && /255, 255, 255/.test(pp.bodyBg) && scr === 'none', { kids: pp.kids, bg: pp.bodyBg, onScreen: scr });
  check('H8', 'the ink is dark (it prints on a black-and-white laser) and the plot carries no CSS variable', pp.light.length === 0 && pp.svg && pp.noVar, { light: pp.light.slice(0, 5), svg: pp.svg });
  check('H8', 'its numbers are the app\'s: tier counts, one line per gate and per funnel step, and the top hits in rank order', JSON.stringify(pp.tiles) === JSON.stringify([pageData.counts.hit, pageData.counts.borderline, pageData.counts.unverified, pageData.counts.rejected]) && pp.gates === pageData.gates && pp.steps === pageData.steps && JSON.stringify(pp.rowsN) === JSON.stringify(pageData.hits), { tiles: pp.tiles, counts: pageData.counts, gates: [pp.gates, pageData.gates], steps: [pp.steps, pageData.steps], rows: [pp.rowsN.slice(0, 3), pageData.hits.slice(0, 3)] });

  // ⑦ the tab itself
  await E(() => hfTab('export')); await pg.waitForTimeout(400);
  const ui = await E(async () => {
    const out = { btns: [...document.querySelectorAll('#pane-export .btn')].map(b => b.textContent.trim().slice(0, 30)) };
    const n0 = document.querySelectorAll('#pane-export .ex-prev tbody tr').length; hfExTier('unverified'); await new Promise(r => setTimeout(r, 300)); const n1 = document.querySelectorAll('#pane-export .ex-prev tbody tr').length;
    out.n0 = n0; out.n1 = n1; out.sel = [...document.querySelectorAll('#pane-export .tchip')].map(c => c.getAttribute('aria-pressed')); hfExTier('unverified'); return out;
  });
  check('H8', 'the Export tab offers the workbook, the CSVs, print and the project, and the tier chips change what the cherry-pick list holds', ui.btns.some(b => /workbook/i.test(b)) && ui.btns.some(b => /Print/.test(b)) && ui.btns.some(b => /Save project/.test(b)) && ui.n1 > ui.n0 - 1 && ui.sel.length === 3, ui);
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 20000 }), E(() => document.getElementById('ex-xlsx').click())]);
  const xb = fs.readFileSync(await dl.path());
  check('H8', 'the download button gives a .xlsx named for the screen, and it is a zip', /^HitFinder_.*\.xlsx$/.test(dl.suggestedFilename()) && xb[0] === 0x50 && xb[1] === 0x4B, { name: dl.suggestedFilename(), bytes: xb.length });
});

if (run('H9')) await guard('H9', async () => {
  const r = await E(async () => {
    const out = {};
    const bits = list => { const a = new Uint32Array(64); list.forEach(b => { a[b >> 5] |= (1 << (b & 31)) >>> 0; }); return a; };
    const A = bits([0, 1, 2, 3]), B = bits([2, 3, 4, 5]), Z = bits([]);
    out.tan = [hfTanimoto(A, B, hfFpPop(A), hfFpPop(B)), hfTanimoto(A, A, 4, 4), hfTanimoto(Z, Z, 0, 0), hfTanimoto(A, Z, 4, 0)];
    let ok = true; for (let k = 0; k < 400; k++) { let x = (k * 2654435761) >>> 0, n = 0; for (let b = 0; b < 32; b++) if ((x >>> b) & 1) n++; if (hfPop32(x) !== n) ok = false; } out.pop = ok;
    // Butina by hand: A-B .9, A-C .8, A-D .7, B-C .75, E-F .85
    const names = ['a', 'b', 'c', 'd', 'e', 'f'], E = [[0, 1, .9], [0, 2, .8], [0, 3, .7], [1, 2, .75], [4, 5, .85]];
    const mk = (perm) => { const nb = names.map(() => []); E.forEach(([i, j, s]) => { nb[perm[i]].push([perm[j], s]); nb[perm[j]].push([perm[i], s]); }); const nm = []; names.forEach((n, i) => { nm[perm[i]] = n; }); return { nb, nm }; };
    const lab = (g, nm) => JSON.stringify(g.groups.map(x => x.map(i => nm[i]).sort()).sort((p, q) => p[0] < q[0] ? -1 : 1));
    const id = [0, 1, 2, 3, 4, 5], sh = [3, 5, 0, 4, 1, 2];
    const m1 = mk(id), m2 = mk(sh);
    out.b70 = lab(hfButina(m1.nb, m1.nm, 0.7), m1.nm); out.b80 = lab(hfButina(m1.nb, m1.nm, 0.8), m1.nm); out.b70s = lab(hfButina(m2.nb, m2.nm, 0.7), m2.nm); out.b80s = lab(hfButina(m2.nb, m2.nm, 0.8), m2.nm);
    // a tie that matters: x-y-z-w in a line. y and z have two neighbours each; whichever is taken first decides the groups, so the NAME must, not the position
    const pn = ['x', 'y', 'z', 'w'], pe = [[0, 1], [1, 2], [2, 3]], pm = perm => { const nb = pn.map(() => []), nm = []; pn.forEach((n, i) => { nm[perm[i]] = n; }); pe.forEach(([i, j]) => { nb[perm[i]].push([perm[j], .9]); nb[perm[j]].push([perm[i], .9]); }); return { nb, nm }; };
    out.tie = [[0, 1, 2, 3], [0, 2, 1, 3], [3, 2, 1, 0], [1, 3, 0, 2]].map(pr => { const m = pm(pr); return lab(hfButina(m.nb, m.nm, 0.7), m.nm); });
    // properties on random fingerprints
    let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const fps = Array.from({ length: 70 }, (_, i) => { const base = (i % 7) * 40, l = []; for (let k = 0; k < 24; k++) l.push(rnd() < 0.7 ? base + Math.floor(rnd() * 40) : Math.floor(rnd() * 2048)); const f = bits(l); return { fp: f, pop: hfFpPop(f) }; });
    const nb = await hfEdges(fps, 0.2), nm = fps.map((_, i) => 'c' + String(i).padStart(3, '0'));
    let brute = 0, edges = 0, sym = true, selfs = false, below = false;
    for (let i = 0; i < fps.length; i++) for (let j = i + 1; j < fps.length; j++) if (hfTanimoto(fps[i].fp, fps[j].fp, fps[i].pop, fps[j].pop) >= 0.2) brute++;
    nb.forEach((l, i) => l.forEach(([j, s]) => { edges++; if (j === i) selfs = true; if (s < 0.2) below = true; if (!nb[j].some(x => x[0] === i && x[1] === s)) sym = false; }));
    out.edges = { brute, edges: edges / 2, sym, selfs, below };
    let prev = 0, mono = true, once = true, cen = true; const ts = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    ts.forEach(tv => { const g = hfButina(nb, nm, tv), seen = new Set(); g.groups.forEach((grp, gi) => { grp.forEach(i => { if (seen.has(i)) once = false; seen.add(i); }); const c = grp[0]; grp.slice(1).forEach(i => { const s = hfTanimoto(fps[c].fp, fps[i].fp, fps[c].pop, fps[i].pop); if (s < tv - 1e-12) cen = false; }); }); if (seen.size !== fps.length) once = false; if (g.groups.length < prev) mono = false; prev = g.groups.length; });
    out.butina = { mono, once, cen, n: prev };
    // cliffs
    const nb2 = [[[1, 0.8], [2, 0.5]], [[0, 0.8]], [[0, 0.5]], [[4, 1.0]], [[3, 1.0]]], p = [7, 9, 3, 6, 6.5], sali = hfSali(nb2, p, 0.55);
    out.sali = sali.map(x => [x.a, x.b, +x.sali.toFixed(4)]);
    // the map: points in the plane, distances kept (up to the rotation and mirror an embedding is free to make)
    const pts = Array.from({ length: 80 }, (_, i) => [Math.cos(i * 0.7) * (1 + i % 5), Math.sin(i * 1.3) * (1 + i % 3)]), d = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    const xy = hfMDS(d, 80, 30), xy2 = hfMDS(d, 80, 30); let worst = 0; for (let i = 0; i < 80; i += 3) for (let j = i + 1; j < 80; j += 5) { const e = Math.hypot(xy[2 * i] - xy[2 * j], xy[2 * i + 1] - xy[2 * j + 1]); worst = Math.max(worst, Math.abs(e - d(i, j))); }
    out.mds = { worst, same: Array.from(xy).every((v, i) => v === xy2[i]), nan: Array.from(xy).some(v => !isFinite(v)) };
    out.edge = [hfMDS(() => 0, 5, 10), hfMDS(() => 1, 1, 10), hfMDS(() => 1, 2, 10), hfMDS(() => 1, 0, 10)].map(a => Array.from(a).some(v => !isFinite(v)));
    return out;
  });
  check('H9', 'Tanimoto is shared ÷ union: ⅓ for {0,1,2,3} against {2,3,4,5}, 1 for itself, and 0 (not 1) for two empty fingerprints', Math.abs(r.tan[0] - 1 / 3) < 1e-12 && r.tan[1] === 1 && r.tan[2] === 0 && r.tan[3] === 0 && r.pop, r.tan);
  check('H9', 'Butina by hand: at 0.7 {a,b,c,d}{e,f}; at 0.8 {a,b,c}{d}{e,f}', r.b70 === '[["a","b","c","d"],["e","f"]]' && r.b80 === '[["a","b","c"],["d"],["e","f"]]', { b70: r.b70, b80: r.b80 });
  check('H9', 'and the same groups come out when the compounds arrive in another order, even when two compounds tie for the next centroid (the name decides, not the position)', r.b70s === r.b70 && r.b80s === r.b80 && r.tie.every(x => x === r.tie[0]) && r.tie[0] === '[["w"],["x","y","z"]]', { b70s: r.b70s, b80s: r.b80s, tie: r.tie });
  check('H9', 'all pairs at or above the cut are found, once each, both ways round, none below it', r.edges.brute === r.edges.edges && r.edges.brute > 15 && r.edges.sym && !r.edges.selfs && !r.edges.below, r.edges);
  check('H9', 'every compound is in exactly one group, every member is as close to its centroid as the threshold says, and a higher threshold never makes fewer groups', r.butina.once && r.butina.cen && r.butina.mono && r.butina.n > 10, r.butina);
  check('H9', 'cliff score = |ΔpDC50| ÷ (1 − similarity): (7,9) at 0.8 is 10; identical structures (similarity 1) are capped at 0.99, not divided by zero; a pair below the similarity floor is not scored', JSON.stringify(r.sali) === '[[3,4,50],[0,1,10]]', r.sali);
  check('H9', 'the map reproduces distances that fit in two dimensions, is the same twice, and never makes a NaN (not from zero distances, one point, or none)', r.mds.worst < 1e-6 && r.mds.same && !r.mds.nan && r.edge.every(x => !x), { mds: r.mds, edge: r.edge });
});

if (run('H21')) await guard('H21', async () => {
  await hfReset();
  const r = await E(async () => {
    const out = {}, cks = HF.uni.slice(0, 8), names = cks.map(hfName);
    const csv = ['Compound,SMILES,MW,cLogP,TPSA,HBD,HBA,RotB,LogD',
      names[0] + ',CCO,450,3,100,2,6,5,1.1', names[1] + ',CCN,600,4,120,3,8,8,2.0', names[2] + ',CCC,800,6.5,200,7,12,14,3.2', names[3] + ',CCCC,500,5,140,5,10,10,1', names[4] + ',CCCCC,,2,90,1,4,3,0.5', 'NOT-IN-SCREENS,CCCCCC,300,1,50,1,2,1,0'].join('\n');
    HF.smiles = new Map(); hfChemReset();                              // the example brings structures of its own: start from none
    const f = new File([csv], 'structures.csv', { type: 'text/csv' });
    const msg = await hfAddFiles([f]); out.msg = msg.join(' | ');
    await new Promise(r => setTimeout(r, 400));
    out.have = HF.chem.by.size; out.status = HF.chem.status; hfChemNotice(true); hfChemNotice(true); out.notice = document.querySelectorAll('#hf-rd-note').length;
    out.mw = [hfProp(cks[0], 'mw'), hfProp(cks[4], 'mw')]; out.from = [hfPropFrom(cks[0], 'mw'), hfPropFrom(cks[4], 'mw')];
    out.extra = (HF.chem.by.get(cks[0]).props || {})['x:LogD'];
    out.prof = HF_PROFILE_ORDER.map(id => [id, [0, 1, 2, 3, 4].map(i => { const r = hfProfileEval(cks[i], id); return r ? r.pass + ':' + r.viol + ':' + r.unread : null; })]);
    // a gate on the property reads the right status
    hfCritAdd('mw'); const c = HF.crit.rows.find(x => x.metric === 'mw'); c.pass = 500; c.fail = 700; hfCritPatch(c);
    out.mwStatus = cks.slice(0, 5).map(ck => HF.verdicts.get(ck).items.find(i => i.c.id === c.id).status);
    out.gateIsGate = c.kind === 'gate' && c.missing === 'skip';
    c.missing = 'unknown'; hfCritPatch(c); out.mwUnk = HF.verdicts.get(cks[4]).items.find(i => i.c.id === c.id).status; out.tierUnk = HF.verdicts.get(cks[4]).unknown.indexOf(c.id) >= 0;
    c.missing = 'skip'; hfCritPatch(c); out.mwSkip = HF.verdicts.get(cks[4]).items.find(i => i.c.id === c.id).status;
    hfChemGate('ro5'); const g = HF.crit.rows.find(x => x.metric === 'viol_ro5'); hfComputeVerdicts();
    out.ro5 = cks.slice(0, 5).map(ck => { const it = HF.verdicts.get(ck).items.find(i => i.c.id === g.id); return it.status + ':' + it.text; });
    hfChemGate('ro5'); out.noDup = HF.crit.rows.filter(x => x.metric === 'viol_ro5').length;
    // the tab and the drawer draw without a chemistry toolkit
    hfTab('chem'); await new Promise(r => setTimeout(r, 400));
    out.tab = { profRows: document.querySelectorAll('#pane-chem .prof-t tbody tr').length, hist: document.querySelectorAll('#pane-chem .ph-c').length, note: (document.querySelector('#chem-series') || {}).textContent.slice(0, 300) };
    hfOpenDrawer(cks[0]); out.drawer = { chips: document.querySelectorAll('#hf-drawer .pchip').length, text: document.querySelector('#hf-drawer .dr-sec .pchips').textContent, profs: document.querySelectorAll('#hf-drawer .prof').length };
    hfCloseDrawer();
    // the workbook carries them
    const sh = hfSheets().find(s => s.name === 'All compounds').aoa, h = sh[0]; out.cols = ['MW (Da)', 'cLogP', 'Lipinski Ro5 violations', 'Structural alerts', 'SMILES'].map(n => h.indexOf(n) >= 0);
    const i0 = h.indexOf('MW (Da)'), nmI = h.indexOf('Compound'), row = sh.find(r => r[nmI] === names[0]); out.xlMw = row ? row[i0] : 'missing'; const row4 = sh.find(r => r[nmI] === names[4]); out.xlMw4 = row4 ? row4[i0] : 'missing';
    // a .smi file, and a results file that carries its own SMILES column
    out.smi = hfParseSmi('CCO ethanol\n# comment\n\nCCN ethylamine extra words\n').map(r => r.join('|')).join(';');
    return out;
  });
  check('H21', 'a structure file is read: its rows, matched to the screens\' compounds, and one unmatched structure is said to be unmatched', /structures\.csv: 6 structures/.test(r.msg) && r.have === 6, { msg: r.msg, have: r.have });
  check('H21', 'with RDKit unreachable the status says so, once, and the banner is not repeated', r.status === 'unavailable' && r.notice === 1, { status: r.status, notice: r.notice });
  check('H21', 'a property the file brought is used and wins; a blank cell is missing (null), not 0; an extra numeric column is kept', r.mw[0] === 450 && r.mw[1] === null && r.from[0] === 'file' && r.from[1] === '' && r.extra === 1.1, { mw: r.mw, from: r.from, extra: r.extra });
  const P = Object.fromEntries(r.prof);
  check('H21', 'Ro5 is strict "greater than" (500 Da / logP 5 / 5 donors / 10 acceptors are NOT violations) and allows one; Veber and Egan allow none', P.ro5[0] === 'pass:0:0' && P.ro5[1] === 'pass:1:0' && P.ro5[3] === 'pass:0:0' && P.ro5[2].startsWith('fail:') && P.veber[3] === 'pass:0:0' && P.veber[1] === 'pass:0:0' && P.veber[2].startsWith('fail:') && P.egan[0] === 'pass:0:0' && P.egan[2].startsWith('fail:'), P);
  check('H21', 'an unread rule is unread, not a pass: Ro5 with MW missing and nothing else wrong is "unknown", and one violation already seen still fails', P.ro5[4].startsWith('unknown:') && P.ghose[0].startsWith('unknown:'), { ro5: P.ro5[4], ghose: P.ghose[0] });
  check('H21', 'a gate on MW (pass ≤ 500, borderline ≤ 700) reads pass (450), borderline (600), fail (800), pass at the edge (500), and skip/unknown for the compound with no MW, as the policy says', JSON.stringify(r.mwStatus) === JSON.stringify(['pass', 'borderline', 'fail', 'pass', 'skip']) && r.gateIsGate && r.mwUnk === 'unknown' && r.tierUnk === true && r.mwSkip === 'skip', { mwStatus: r.mwStatus, unk: r.mwUnk, tier: r.tierUnk, skip: r.mwSkip });
  check('H21', 'the violations gate reads each compound from the numbers and names what was violated; adding it twice adds it once', r.ro5.length === 5 && /^pass:0 violations/.test(r.ro5[0]) && /^pass:1 violation: MW > 500/.test(r.ro5[1]) && /^fail:\d+ violations?: /.test(r.ro5[2]) && r.noDup === 1, { ro5: r.ro5, noDup: r.noDup });
  check('H21', 'the Chemistry tab and the drawer draw without RDKit: the rule sets, the distributions, the property chips and the verdict pills', r.tab.profRows === 6 && r.tab.hist === 8 && /RDKit/.test(r.tab.note) && r.drawer.chips === 8 && /450/.test(r.drawer.text) && r.drawer.profs === 6, { tab: r.tab, drawer: r.drawer });
  check('H21', 'the workbook carries the properties, the violations and the SMILES, with a number where the file gave one and a blank where it did not', r.cols.every(Boolean) && r.xlMw === 450 && r.xlMw4 === null, { cols: r.cols, xlMw: r.xlMw, xlMw4: r.xlMw4 });
  check('H21', 'a .smi file is "SMILES name", comments and blank lines skipped, a name may have spaces', r.smi === 'SMILES|Compound;CCO|ethanol;CCN|ethylamine extra words', r.smi);
});

if (run('H13')) await guard('H13', async () => {
  const c3 = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  await c3.route(/^https?:/, r => { const u = r.request().url(); if (u.startsWith(BASE) || /unpkg\.com\/@rdkit|cdn\.jsdelivr\.net\/npm\/@rdkit/.test(u)) return r.continue(); r.abort(); });
  const p3 = await c3.newPage(); p3.on('pageerror', e => pageErrs.push('rdkit page: ' + String(e && e.message || e)));
  await p3.goto(BASE + '/__hf.html'); await p3.waitForTimeout(600);
  const up = await p3.evaluate(async () => { try { await loadRDKitPinned(); return true; } catch (e) { return false; } });
  if (!up) { skipped.push('H13 — RDKit could not be loaded from its CDN'); await c3.close(); return; }
  const r = await p3.evaluate(async () => {
    const rd = await loadRDKitPinned(), qm = hfAlertQmols(rd), out = {};
    const asp = hfChemOne(rd, 'CC(=O)Oc1ccccc1C(=O)O', qm); out.asp = { ok: asp.ok, d: asp.d, pop: asp.pop, words: asp.fp.length, nfrag: asp.nfrag };
    out.empty = hfChemOne(rd, '', qm); out.bad = [hfChemOne(rd, 'not a smiles', qm), hfChemOne(rd, 'C1CC', qm)].map(x => [x.ok, !!x.empty]);
    const salt = hfChemOne(rd, 'CC(=O)Oc1ccccc1C(=O)O.[Na+].[Cl-]', qm); out.salt = { mw: salt.d.mw, nfrag: salt.nfrag, frag: salt.frag, asp: asp.frag };
    const para = hfChemOne(rd, 'CC(=O)Nc1ccc(O)cc1', qm); out.sim = [hfTanimoto(asp.fp, asp.fp, asp.pop, asp.pop), hfTanimoto(asp.fp, para.fp, asp.pop, para.pop)];
    out.nq = [qm.length, HF_ALERTS.length + HF_E3_HINTS.length];
    out.alerts = HF_ALERTS.concat(HF_E3_HINTS).map(a => { const q = qm.find(x => x.id === a.id); const pm = rd.get_mol(a.pos), nm = rd.get_mol(a.neg); const o = [a.id, !!q && pm.get_substruct_match(q.q) !== '{}', !!q && nm.get_substruct_match(q.q) === '{}']; pm.delete(); nm.delete(); return o; });
    // through the app: imported beats computed; none of the example's structures is an empty one; the salt, the unreadable and the missing are all accounted for
    loadHitFinderTestData(); await new Promise(r => { const t = setInterval(() => { if (HF.chem.status === 'ready') { clearInterval(t); r(); } }, 100); });
    const R = hfReconcileChem(); out.ex = { cache: HF.chem.cache.size, bad: R.bad, noStruct: R.noStruct, salts: R.salts, okN: [...HF.chem.cache.values()].filter(x => x.ok).length };
    const ck = HF.uni[0], c = hfChemOf(ck); out.exProp = { mw: c.d.mw, from: hfPropFrom(ck, 'mw') }; HF.chem.by.get(ck).props = { mw: 999 }; out.exImp = [hfProp(ck, 'mw'), hfPropFrom(ck, 'mw')];
    out.svg = (await hfStructSvg(ck, 200, 140)).slice(0, 60); out.notice = document.querySelectorAll('#hf-rd-note').length;
    return out;
  });
  const d = r.asp.d;
  check('H13', 'aspirin: MW 180.159, TPSA 63.6, cLogP 1.3101, 1 donor, 4 acceptors, 2 rotatable bonds, 1 aromatic ring, Fsp3 0.111; a 2048-bit fingerprint in 64 words', r.asp.ok && Math.abs(d.mw - 180.159) < 1e-3 && Math.abs(d.tpsa - 63.6) < 1e-6 && Math.abs(d.clogp - 1.3101) < 1e-4 && d.hbd === 1 && d.hba === 4 && d.rotb === 2 && d.arom === 1 && Math.abs(d.fsp3 - 1 / 9) < 1e-6 && r.asp.words === 64 && r.asp.pop > 5, r.asp);
  check('H13', '"" is no structure (RDKit calls it a valid molecule with no atoms), and an unreadable SMILES is not-ok but not "empty"', r.empty.ok === false && r.empty.empty === true && JSON.stringify(r.bad) === '[[false,false],[false,false]]', { empty: r.empty, bad: r.bad });
  check('H13', 'a salt is its largest piece: the weight and the drawing are aspirin\'s, and the app knows there were three pieces', r.salt.nfrag === 3 && Math.abs(r.salt.mw - 180.159) < 1e-3 && r.salt.frag === r.salt.asp, r.salt);
  check('H13', 'Tanimoto of a molecule with itself is 1 and aspirin against paracetamol is well below that', r.sim[0] === 1 && r.sim[1] < 0.5 && r.sim[1] > 0, r.sim);
  check('H13', 'every alert and E3 pattern compiles, fires on a molecule that has it and stays silent on one that does not', r.nq[0] === r.nq[1] && r.alerts.every(a => a[1] && a[2]), r.alerts.filter(a => !(a[1] && a[2])));
  check('H13', 'in the app: the example\'s 71 structures are read, the unreadable one (HF-010) and the missing one (HF-006) are counted, the salt is flagged, nothing is "empty"', r.ex.okN === 70 && r.ex.bad.length === 1 && r.ex.noStruct.length === 1 && r.ex.salts.length === 1, r.ex);
  check('H13', 'a number from the file beats the computed one and says where it came from', r.exProp.from === 'RDKit' && r.exProp.mw > 500 && r.exImp[0] === 999 && r.exImp[1] === 'file', { exProp: r.exProp, exImp: r.exImp });
  check('H13', 'a structure is drawn as an SVG on a transparent ground, and no "RDKit unavailable" banner appears when RDKit is there', /^<svg/.test(r.svg) && r.notice === 0, { svg: r.svg, notice: r.notice });
  await c3.close();
});

if (run('H22')) await guard('H22', async () => {
  await E(() => { HF.recs.length = 0; HF.screens.clear(); HF.arms.clear(); HF.smiles = new Map(); hfChemReset(); HF.verdicts = null; });
  const r = await E(async () => {
    const out = { msgs: [], threw: null };
    const head = SCR_COLS.join(','), mk = (o) => SCR_COLS.map(c => o[c] == null ? '' : String(o[c]).replace(/,/g, '.')).join(',');
    const base = { Schema: 'echo-screen/1', Assay_ID: 'HOSTILE', Run_ID: 1, Set_ID: 'h', Version: 1, Panel: 0, Assay: 'hibit', Role: 'degradation', Target: 'BRD4', Group: 'BRD4', Fit_Status: 'fitted', Potency_Qualifier: 'exact' };
    const files = [
      new File([''], 'empty.csv'), new File([head + '\n'], 'header.csv'), new File([new Uint8Array([0, 255, 254, 1, 2, 3, 0, 0, 9, 200])], 'binary.xlsx'), new File(['not a table at all'], 'text.csv'),
      new File([[head, mk(Object.assign({}, base, { Compound: 'OK-1', Potency_nM: 12, Effect_Eff: 90 })), mk(Object.assign({}, base, { Compound: '', Potency_nM: 5, Effect_Eff: 80 })),
        mk(Object.assign({}, base, { Compound: 'INF', Potency_nM: '1e999', Effect_Eff: 'abc', Hill: -3, R2: 7 })), mk(Object.assign({}, base, { Compound: 'NEG', Potency_nM: -4, Effect_Eff: 120, Hook_Onset_nM: -1, Last_Productive_nM: 'x' })),
        mk(Object.assign({}, base, { Compound: '<img src=x onerror="window.__h=1">', Potency_nM: 30, Effect_Eff: 70, Curve_Points: '1,2;abc;3,NaN;,;5', Fit_Params: 'a,b,c,d', Hook_Points: ';;' })),
        mk(Object.assign({}, base, { Compound: '=HYPERLINK("http://x")', Potency_nM: 40, Effect_Eff: 75 })), mk(Object.assign({}, base, { Compound: 'NOQ', Potency_nM: 50, Effect_Eff: 80, Potency_Qualifier: '≈' }))].join('\n')], 'hostile.csv'),
      new File(['﻿Compound;DC50 (nM);Dmax (%)\nSEMI-1;"12,5";"90,1"\nSEMI-2;n.d.;50\n'], 'semi.csv')
    ];
    window.__h = 0;
    try { out.msgs = await hfAddFiles(files); } catch (e) { out.threw = String(e && e.message || e); }
    await new Promise(r => setTimeout(r, 400));
    out.recs = HF.recs.map(x => x.Compound); out.uni = (HF.uni || []).length;
    const bad = [], scan = where => { const txt = document.body.innerText || ''; const m = txt.match(/\bNaN\b|\bInfinity\b|\bundefined\b|\[object /); if (m) bad.push(where + ': ' + m[0]); };
    for (const tab of ['screens', 'criteria', 'hits', 'plots', 'chem', 'export']) { try { hfTab(tab); } catch (e) { bad.push(tab + ' threw ' + e); } await new Promise(r => setTimeout(r, 250)); scan(tab); }
    try { if (HF.uni && HF.uni.length) { hfOpenDrawer(HF.uni[0]); await new Promise(r => setTimeout(r, 250)); scan('drawer'); hfCloseDrawer(); } } catch (e) { bad.push('drawer threw ' + e); }
    out.num = [hfNum('1e999'), hfNum('-1e999'), hfNum('1e3'), hfNum('1,5'), hfNum('abc'), hfNum('')].map(String);
    out.bad = bad; out.xss = window.__h; out.imgs = document.querySelectorAll('img[src="x"]').length;
    return out;
  });
  check('H22', 'a pile of bad files does not throw, and each says what it is (empty, no rows, not a table)', !r.threw && r.msgs.length >= 5, { threw: r.threw, msgs: r.msgs });
  check('H22', 'a row with no compound is not invented; the good rows from the same file are read', !r.recs.includes('') && r.recs.includes('OK-1') && r.recs.includes('SEMI-1') && r.recs.includes('SEMI-2'), r.recs);
  check('H22', 'no tab and no drawer ever shows NaN, Infinity or undefined, whatever was in the file', r.bad.length === 0, r.bad);
  check('H22', 'a number too big for a number is no number (1e999 is Infinity, which would take every axis and every mean with it)', JSON.stringify(r.num) === JSON.stringify(['null', 'null', '1000', '1.5', 'null', 'null']), r.num);
  check('H22', 'markup in a name is text', r.xss === 0 && r.imgs === 0, { xss: r.xss, imgs: r.imgs });
});

if (run('H20')) await guard('H20', async () => {
  const sendRun = async (broken) => {
    const hp = await ctx.newPage(); hp.on('pageerror', e => pageErrs.push('host: ' + String(e && e.message || e)));
    await hp.goto(BASE + '/__host.html'); await hp.waitForTimeout(1800);
    const ef = hp.frames().find(f => /echo\.html/.test(f.url()));
    await ef.evaluate((b) => { document.documentElement.setAttribute('data-theme', 'light'); if (b) _hxBroken = new Error('no storage'); loadTestData(); }, broken);
    await ef.waitForTimeout(800);
    await ef.evaluate(() => { document.getElementById('p-assay').value = 'H20-SEND'; document.getElementById('p-role').value = 'degradation'; document.getElementById('p-target').value = 'BRD4'; runPipeline(); });
    await ef.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 });
    return { hp, ef };
  };
  const hfOf = hp => hp.frames().find(f => /__hf\.html/.test(f.url()));
  // ① pressed the moment the run finishes: History has not been written yet (its save is debounced), and the send has to cope
  const { hp, ef } = await sendRun(false);
  const btn = await ef.evaluate(() => { const b = document.querySelector('.hf-send'); return b ? { text: b.textContent.trim(), svg: !!b.querySelector('svg circle') } : null; });
  check('H20', 'inside the Hub the results carry a "Send to Hit Finder" button with the scope icon', !!btn && /Send to Hit Finder/.test(btn.text) && btn.svg, btn);
  const nEcho = await ef.evaluate(() => _screenRecords().length);
  await ef.evaluate(() => document.querySelector('.hf-send').click());
  await hp.waitForFunction(() => { const f = document.getElementById('frame-hitfinder'); try { return !!(f && f.contentWindow && f.contentWindow.eval('typeof HF !== "undefined" && HF.screens.size > 0')); } catch (e) { return false; } }, null, { timeout: 30000 });
  const hf = hfOf(hp); await hf.waitForTimeout(400);
  const a = await hf.evaluate(() => ({ recs: HF.recs.length, srcs: [...HF.screens.values()].map(s => s.source), tab: HF.ui.tab, active: (document.querySelector('.tab.active') || {}).dataset && document.querySelector('.tab.active').dataset.tab, pane: [...document.querySelectorAll('.tabpane.active')].map(p => p.id), toast: (document.querySelector('.toast') || {}).textContent, hits: HF.counts && HF.counts.hit, uni: (HF.uni || []).length }));
  const opens = await hp.evaluate(() => window.__opens);
  check('H20', 'it opened Hit Finder by itself, once, naming the analysis', opens.length === 1 && opens[0].id === 'hitfinder' && opens[0].source === 'echo' && opens[0].name === 'H20-SEND', opens);
  check('H20', 'the analysis arrived through History (so it carries its version), with every curve Echo has', a.srcs.length > 0 && a.srcs.every(x => /^Echo History/.test(x)) && a.recs === nEcho && nEcho > 0, { nEcho, a });
  check('H20', 'it lands on the hits (a primary screen was found), and says what arrived', a.tab === 'hits' && a.active === a.tab && a.pane.length === 1 && /Received H20-SEND/.test(a.toast || ''), a);
  check('H20', 'the verdicts were read without another click', a.uni > 0 && a.hits != null, a);
  // ② the same analysis sent again is the same analysis
  await ef.evaluate(() => openInHitFinder()); await hf.waitForTimeout(900);
  const b = await hf.evaluate(() => ({ screens: HF.screens.size, recs: HF.recs.length, toast: (document.querySelector('.toast') || {}).textContent }));
  check('H20', 'sending it again does not double the screens', b.screens === (await hf.evaluate(() => new Set([...HF.screens.values()].map(s => s.key)).size)) && b.recs === a.recs && /already loaded/.test(b.toast || ''), b);
  // ③ a guessed slot is said where the hits are read, and one click settles it
  await hf.evaluate(() => hfTab('hits')); await hf.waitForTimeout(400);
  const n1 = await hf.evaluate(() => ({ guessed: hfSlotsGuessed(), note: !![...document.querySelectorAll('#pane-hits .note')].find(n => /guessed/.test(n.textContent)) }));
  check('H20', 'while slots are guessed, the Hits tab says so', n1.guessed === n1.note && n1.guessed, n1);
  await hf.evaluate(() => hfConfirmSlots()); await hf.waitForTimeout(300);
  const n2 = await hf.evaluate(() => ({ guessed: hfSlotsGuessed(), note: !![...document.querySelectorAll('#pane-hits .note')].find(n => /guessed/.test(n.textContent)) }));
  check('H20', 'and confirming them takes the note away', !n2.guessed && !n2.note, n2);
  // a screen with one group has nothing to confirm: it goes straight to the hits, from wherever you were
  const one = await ef.evaluate(() => { const a = _screenAoa(), gi = a[0].indexOf('Group'), g = a[1][gi]; return [a[0]].concat(a.slice(1).filter(r => r[gi] === g)); });
  await hf.evaluate(() => { HF.recs.length = 0; HF.screens.clear(); HF.arms.clear(); hfAfterIngest(); hfTab('plots'); });
  await hf.evaluate(t => hfReceiveFromEcho({ source: 'echo', table: t, name: 'ONE-GROUP' }), one); await hf.waitForTimeout(500);
  const e1 = await hf.evaluate(() => ({ tab: HF.ui.tab, arms: HF.arms.size, uni: (HF.uni || []).length }));
  check('H20', 'one group needs no confirming: it opens on the hits, from whichever tab you were on', e1.arms === 1 && e1.tab === 'hits' && e1.uni > 0, e1);
  await hp.close();
  // ④ History cannot be kept in this browser: the table goes with the message
  const r2 = await sendRun(true);
  const nEcho2 = await r2.ef.evaluate(() => _screenRecords().length);
  await r2.ef.evaluate(() => openInHitFinder());
  await r2.hp.waitForFunction(() => { const f = document.getElementById('frame-hitfinder'); try { return !!(f && f.contentWindow && f.contentWindow.eval('typeof HF !== "undefined" && HF.screens.size > 0')); } catch (e) { return false; } }, null, { timeout: 30000 });
  const hf2 = hfOf(r2.hp); await hf2.waitForTimeout(400);
  const c = await hf2.evaluate(() => ({ recs: HF.recs.length, srcs: [...HF.screens.values()].map(s => s.source), screens: HF.screens.size }));
  const o2 = await r2.hp.evaluate(() => window.__opens);
  check('H20', 'with no History the Screen table travels instead and arrives whole', o2[0].hasTable && o2[0].echoRun == null && c.recs === nEcho2 && c.srcs.every(x => /\(sent\)/.test(x)), { o2, c, nEcho2 });
  await r2.ef.evaluate(() => openInHitFinder()); await hf2.waitForTimeout(900);
  const d = await hf2.evaluate(() => ({ recs: HF.recs.length, screens: HF.screens.size, toast: (document.querySelector('.toast') || {}).textContent }));
  check('H20', 'sent again, it replaces itself rather than adding a second copy', d.recs === c.recs && d.screens === c.screens && /Updated/.test(d.toast || ''), d);
  await r2.hp.close();
  // ⑤ outside the Hub there is nobody to send it to
  const sp = await ctx.newPage(); await sp.goto(BASE + '/apps/echo/echo.html'); await sp.waitForTimeout(1500);
  const solo = await sp.evaluate(() => ({ ready: _hitFinderReady(), html: _screenBtns('', '') }));
  check('H20', 'standalone Echo offers Screen CSV and no Send button', !solo.ready && /Screen CSV/.test(solo.html) && !/hf-send/.test(solo.html), solo);
  await sp.close();
});

if (run('H23')) await guard('H23', async () => {
  const SRC = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8').replace(/window\.__escapeAudit\(\);\s*$/, '');   // defines the audit; each screen then calls it
  const c23 = await browser.newContext({ acceptDownloads: true });   // its own storage: the criteria and calls the earlier invariants saved would change what the list shows
  await c23.route(/^https?:/, r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
  const ALLOW = { allowScroll: '.hits-scroll' };            // the ranked list is a wide table in its own box by design
  const sizes = [[1440, 900], [1260, 800], [1180, 800], [1100, 800], [900, 800], [390, 844]];   // 1180: a laptop window, where the screens table is a table and has 1130px of its own to find
  for (const [w, h] of sizes) {
    const sp = await c23.newPage(); await sp.bringToFront(); await sp.setViewportSize({ width: w, height: h });
    const seen = [], at = tag => r => r.forEach(x => seen.push(`${w}px ${tag}: ${x}`));
    const audit = async tag => at(tag)(await sp.evaluate(SRC + ';window.__escapeAudit(' + JSON.stringify(ALLOW) + ')'));
    try {
      await sp.goto(BASE + '/__hf.html'); await sp.waitForTimeout(700);
      await sp.evaluate(() => { document.getElementById('dep-stack')?.remove(); });
      await audit('empty');                                                                     // the empty state: its illustration must not size the icons inside its buttons
      await sp.evaluate(() => {                                                                  // the names a lab really uses
        const o = window.hfExampleRuns;
        window.hfExampleRuns = () => { const ex = o(); ex.runs.forEach(r => { r.assayId += '_BET_degradation_screen_plate_series_ABC_20260504'; r.screens.forEach(s => { if (s.target) s.target += '(BD1)-NanoLuc fusion'; s.cellLine += ' DCAF15 KO #15 pool'; }); }); return ex; };
        loadHitFinderTestData();
        HF.names.forEach((m, ck) => { const [[n, c]] = [...m.entries()]; HF.names.set(ck, new Map([['EDA-099-JMM06-batch-2-' + n, c]])); });   // after the ingest, which would rebuild the names
      });
      await sp.waitForTimeout(500);
      await sp.evaluate(HF_SEED[1]); await sp.waitForTimeout(2600);                              // structures the offline run cannot fetch
      for (const t of ['screens', 'criteria', 'hits', 'plots', 'chem', 'export']) {
        await sp.evaluate(k => { hfTab(k); window.scrollTo(0, 0); }, t); await sp.waitForTimeout(450);
        if (t === 'chem') { const drawn = await sp.waitForSelector('.cl-grp', { timeout: 8000 }).then(() => true, () => false); await sp.waitForTimeout(300); check('H23', `the Chemistry tables were drawn at ${w}px, so they were measured`, drawn, drawn); }
        if (t === 'hits') {      // the widest thing each metric cell can hold, whatever the first rows of this data happen to say
          const spill = await sp.evaluate(() => { const r = document.querySelector('.h-r'), c = r.cloneNode(true), W = ['> 10 µM ×/÷1.45', '103%', '×100000', '≥ ×100000', '≥ ×100000', '≥ ×100000'];
            c.querySelectorAll('.c-ms .c-m').forEach((e, i) => { e.textContent = W[i] || '×1'; }); r.parentNode.insertBefore(c, r);
            return innerWidth > 760 ? [...c.querySelectorAll('.c-ms .c-m')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent + ' needs ' + e.scrollWidth + 'px in ' + e.clientWidth) : []; });
          spill.forEach(x => seen.push(`${w}px hits: a number is cut or spills out of its cell: ${x}`));
        }
        await audit(t);
      }
      await sp.evaluate(() => { hfTab('chem'); hfChemQ(hfName(HF.uni[3])); }); await sp.waitForTimeout(600); await audit('closest-to');
      await sp.evaluate(() => { hfTab('hits'); hfOpenDrawer(HF.uni[0]); }); await sp.waitForTimeout(600); await audit('drawer');
      await sp.evaluate(() => { document.querySelector('.dr-bd').scrollTop = 99999; }); await sp.waitForTimeout(300); await audit('drawer-end');
      await sp.evaluate(() => hfCloseDrawer());
      // dialogs, with the file names a plate reader writes
      await sp.evaluate(() => {
        window.hfEchoRuns = async () => { const mk = (id, setId, name, ver) => ({ id, setId, name, groups: 'BRD2, BRD3, BRD4, BRD9 and a very long list of groups that goes on and on', ver, ts: Date.now() - id * 8.64e7, n: 138, nFlag: 7, multi: id % 2 === 0, assayType: 'hibit', screens: [{ target: 'BRD4(BD1)-NanoLuc fusion in HEK293' }] });
          return [mk(5, 's1', 'HB20260504_BET_degradation_screen_plate_series_A_B_C', 3), mk(4, 's1', 'HB20260504_BET_degradation_screen_plate_series_A_B_C', 2), mk(3, 's2', 'CTG72_viability', 1)]; };
        hfOpenEcho();
      });
      await sp.waitForTimeout(500); await audit('dialog-echo'); await sp.evaluate(() => hfCloseDialog());
      await sp.evaluate(() => hfOpenMapper([['Very long compound identifier column name', 'Potency (DC50, nM) measured at 24 h in HEK293 cells', 'Group', 'Dmax (%)'], ['A', 1, 'g', 90]], 'a_really_long_file_name_from_the_plate_reader_export_2026-10-07_final_v3.csv'));
      await sp.waitForTimeout(500); await audit('dialog-mapper'); await sp.evaluate(() => hfCloseDialog());
      await sp.evaluate(() => hfSavePreset()); await sp.waitForTimeout(400); await audit('dialog-preset'); await sp.evaluate(() => hfCloseDialog());
    } finally { await sp.close(); }
    check('H23', `at ${w}px nothing leaves its box, nothing lands on its neighbour, and nothing is hidden behind a sideways scroll`, seen.length === 0, [...new Set(seen)].slice(0, 6));
  }
  await c23.close();
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
