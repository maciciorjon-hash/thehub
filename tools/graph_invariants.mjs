// The Graph tab in every data app (docs/DATA_APPS_STUDY_2026-10-30.md, Phase 5): one chart editor, ChartKit, the same in Echo, Lumina, Beacon, Tempo, Hit Finder, Dora and BCA.
//   node tools/graph_invariants.mjs
//
// GR1  a linear x axis (a time, a standard's concentration): round ticks across the data, a fit drawn between the first and the last point, never decades
// GR2  a point can carry its name; names that would sit on one another are left out, never stacked
// GR3  points can be joined by a line, in the order of x; a doc can say its figure is never bars (a scatter, a standard curve)
// GR4  an app's own colour for a series is its default, another palette replaces it; an app's starting look (no markers, no error bars) is applied once and the person's choices stand
// GR5  Dora: DC50 against Dmax, one series per target, every compound named; a bound is not a place on the axis
// GR6  Hit Finder: potency against effect, one series per tier, the tiers' own colours
// GR7  BCA: the standard curve, a well left out of the figure refits the line (and not the Workflow), the equation is in the title
// GR8  Tempo: dose–response (a degradation) and kinetics (any plate); a replicate left out refits that compound alone; a time course has no dose–response, so only kinetics
// GR9  every figure exports: an SVG with its text in it, a PDF that opens with %PDF, and no script error anywhere
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { const m = '✗ ' + name + (detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''); findings.push(m); console.log('  ' + m); } };
const browser = await chromium.launch();
async function open(id, boot) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 200))); await pg.route(/^https?:/, r => r.abort());
  await pg.goto('file://' + path.join(ROOT, `apps/${id}/${id}.html`)); await pg.waitForTimeout(900);
  if (boot) { await pg.evaluate(`(async()=>{ document.getElementById('dep-stack')?.remove(); ${boot} })()`); await pg.waitForTimeout(1300); }
  return { pg, errs, ctx };
}
const fig = pg => pg.evaluate(() => { const svg = document.querySelector('.ck-root svg'); return svg ? { texts: [...svg.querySelectorAll('text')].map(t => t.textContent), paths: svg.querySelectorAll('path').length, circles: svg.querySelectorAll('circle').length } : null; });
const exportsOk = (pg, kitName) => pg.evaluate(async name => {
  const k = new Function('return ' + name)(), scene = k.scene(), svg = ChartKitExport.toSVG(scene), pdf = ChartKitExport.toPDF(scene), head = await pdf.slice(0, 5).text();
  return { svg: svg.length > 800 && /<svg/.test(svg), withText: scene.prims.filter(p => p.t === 'text').every(p => svg.includes(String(p.text).replace(/&/g, '&amp;').split('^')[0].slice(0, 4))), pdf: head };
}, kitName).catch(e => ({ err: String(e) }));

/* ───── GR1–GR4: the kit itself, on a page that has it ───── */
{
  const { pg, errs, ctx } = await open('dora');
  const R = await pg.evaluate(() => {
    const C = ChartKitCore, one = (x, v, l) => ({ x, label: l, reps: [{ id: 'r' + x + (l || ''), v }] });
    const lin = { kind: 'xy', xScale: 'lin', title: ['T', '', ''], xTitle: 'Time (h)', yTitle: 'y', items: [{ id: 'a', name: 'a', points: [0, 2, 4, 6, 8, 10].map(x => one(x, 1 + x / 2)), fit: { fn: x => 1 + x / 2 } }] };
    const log = { kind: 'xy', title: ['T', '', ''], xTitle: 'c (nM)', xUnit: 'nM', yTitle: 'y', items: [{ id: 'a', name: 'a', points: [1, 10, 100, 1000].map(x => one(x, 10 + x / 20)) }] };
    const sc = C.build(lin, C.withDefaults(null)), sl = C.build(log, C.withDefaults(null)), txt = s => s.prims.filter(p => p.t === 'text').map(p => p.text);
    const fitPath = sc.prims.find(p => p.el === 'fit:a');
    // names
    const lab = { kind: 'xy', xScale: 'lin', pointLabels: true, title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [one(1, 5, 'first'), one(1.01, 5.01, 'second'), one(5, 9, 'third')] }] };
    const sn = C.build(lab, C.withDefaults(null)), plab = sn.prims.filter(p => p.t === 'text' && /^plab:/.test(p.el)).map(p => p.text);
    const off = C.build(Object.assign({}, lab, { pointLabels: false }), C.withDefaults(null)).prims.filter(p => p.t === 'text' && /^plab:/.test(p.el)).length;
    // join
    const jn = C.build({ kind: 'xy', xScale: 'lin', join: true, title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [one(5, 1), one(1, 3), one(3, 2)] }] }, C.withDefaults(null)).prims.find(p => p.el === 'join:a');
    const no = C.build({ kind: 'xy', xScale: 'lin', title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [one(5, 1), one(1, 3)] }] }, C.withDefaults(null)).prims.find(p => p.el === 'join:a');
    // kind: two points per series would be bars in auto; the doc says otherwise
    const k2 = C.build({ kind: 'xy', title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [one(1, 1), one(10, 2)] }] }, C.withDefaults(null)).kind, k3 = C.build({ title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [one(1, 1), one(10, 2)] }] }, C.withDefaults(null)).kind;
    // colours
    const col = (spec, c) => C.build({ kind: 'xy', title: ['', '', ''], items: [{ id: 'a', name: 'a', color: c, points: [one(1, 1), one(10, 2), one(100, 3), one(1000, 4)] }] }, C.withDefaults(spec)).items[0].color;
    return { linTicks: sc.prims.filter(p => p.t === 'text' && /^xTick/.test(p.el) && p.text !== '').map(p => p.text), linPow: txt(sc).some(t => /10\^/.test(t)), fitFirst: fitPath && fitPath.pts[0], fitLast: fitPath && fitPath.pts[fitPath.pts.length - 1], plot: sc.plot, logPow: txt(sl).some(t => /^(10\^|1000$|100$|10$)/.test(t)),
      plab, off, join: jn && jn.pts.length, joinOrder: jn && jn.pts[0][0] < jn.pts[1][0] && jn.pts[1][0] < jn.pts[2][0], noJoin: !no, k2, k3, own: col({}, '#2d9462'), other: col({ palette: 'okabe' }, '#2d9462'), picked: col({ colors: { a: '#123456' } }, '#2d9462') };
  });
  check('GR1 a linear x axis has round ticks across the data and no powers of ten', R.linTicks.join(',') === '0,2,4,6,8,10' && !R.linPow, R.linTicks);
  check('GR1 …and the fit is drawn from the first point to the last, inside the plot', R.fitFirst && R.fitLast && R.fitFirst[0] >= R.plot.x - 0.5 && R.fitLast[0] <= R.plot.x + R.plot.w + 0.5 && R.fitLast[0] > R.fitFirst[0], { a: R.fitFirst, b: R.fitLast, plot: R.plot });
  check('GR1 a log axis is still decades (the other three apps\' figures)', R.logPow, R.logPow);
  check('GR2 each point is named, and a name that would sit on another is left out', R.plab.includes('first') && R.plab.includes('third') && !R.plab.includes('second'), R.plab);
  check('GR2 no doc flag, no names', R.off === 0, R.off);
  check('GR3 points are joined in the order of x, only when asked', R.join === 3 && R.joinOrder && R.noJoin, { join: R.join, order: R.joinOrder, noJoin: R.noJoin });
  check('GR3 a doc that says "xy" is never bars, even with two points per series', R.k2 === 'xy' && R.k3 === 'bars', { k2: R.k2, k3: R.k3 });
  check('GR4 an app\'s own colour is the default; another palette replaces it; a colour picked stays', R.own.toLowerCase() === '#2d9462' && R.other.toLowerCase() !== '#2d9462' && R.picked.toLowerCase() === '#123456', { own: R.own, other: R.other, picked: R.picked });
  const D = await pg.evaluate(() => {
    const host = document.createElement('div'); host.id = 'gr-host'; document.body.appendChild(host);
    const doc = { kind: 'xy', xScale: 'lin', join: true, sig: 'x', defaults: { xy: { points: false }, err: { type: 'none' } }, title: ['', '', ''], items: [{ id: 'a', name: 'a', points: [1, 2, 3, 4].map(x => ({ x, label: '', reps: [{ id: 'q' + x, v: x }, { id: 'p' + x, v: x + 1 }] })) }] };
    localStorage.removeItem('ck:gr'); const kit = ChartKit.mount(host, { key: 'gr', doc: () => doc, drawAll: true, toast() {} });
    const a = JSON.parse(JSON.stringify([kit.spec().xy.points, kit.spec().err.type])); kit.spec().xy.points = true; kit.refresh();
    return { start: a, after: [kit.spec().xy.points, kit.spec().err.type] };
  });
  check('GR4 an app\'s starting look (no markers, no error bars) is applied once; after that the person\'s choice stands', D.start[0] === false && D.start[1] === 'none' && D.after[0] === true, D);
  check('GR9 no script error in the kit tests', errs.length === 0, errs.join(' | ')); await ctx.close();
}

/* ───── GR5: Dora ───── */
{
  const { pg, errs, ctx } = await open('dora', 'loadTestData(); switchTab("graph");');
  const f = await fig(pg), d = await pg.evaluate(() => { const doc = dgGraphDoc(); return { items: doc.items.map(i => [i.name, i.points.length]), names: new Set(doc.items.flatMap(i => i.points.map(p => p.label))).size, kind: doc.kind, raw: RAW.length, bounds: RAW.reduce((n, c) => n + Object.values(c.targets).filter(t => t && t.dc50_q).length, 0), hasKind: !!document.querySelector('.ck-kind') && getComputedStyle(document.querySelector('.ck-kind')).display !== 'none' }; });
  check('GR5 Dora\'s Graph draws one series per target with each compound named', f && d.items.length === 2 && d.items.every(i => i[1] >= 4) && f.texts.includes('ARV-771') && f.texts.includes('DC50 against Dmax'), { f: f && f.texts.slice(0, 8), d });
  check('GR5 the figure is never bars: no Bars button', d.kind === 'xy' && d.hasKind === false, d);
  const bnd = await pg.evaluate(() => { const t = TARGETS[0], c = RAW.find(c => c.targets[t] && c.targets[t].dc50 > 0 && c.targets[t].dmax != null); const keep = c.targets[t].dc50_q; c.targets[t].dc50_q = '>'; const n = dgGraphDoc().items.find(i => i.id === t).points.length, all = RAW.filter(r => r.targets[t] && r.targets[t].dc50 > 0 && r.targets[t].dmax != null && !r.targets[t].dc50_q).length; c.targets[t].dc50_q = keep; return { n, all }; });
  check('GR5 a potency that is a bound is not drawn', bnd.n === bnd.all, bnd);
  const ex = await exportsOk(pg, '_dgKit'); check('GR9 Dora\'s figure exports an SVG with its text and a PDF', ex.svg && ex.withText && ex.pdf === '%PDF-', ex);
  check('GR9 no script error in Dora', errs.length === 0, errs.join(' | ')); await ctx.close();
}

/* ───── GR6: Hit Finder ───── */
{
  const { pg, errs, ctx } = await open('hitfinder', 'loadHitFinderTestData(); hfTab("graph");');
  const d = await pg.evaluate(() => { const doc = hfGraphDoc(); return { items: doc.items.map(i => [i.name, i.points.length, i.color]), kind: doc.kind, prim: hfPlotSpecs().find(s => s.id === 'dmax').pts.length, bounds: hfPlotSpecs().find(s => s.id === 'dmax').pts.filter(p => p.xb || p.x === hfInf).length, drawn: doc.items.reduce((n, i) => n + i.points.length, 0) }; });
  check('GR6 Hit Finder\'s Graph has one series per tier, in the tiers\' own colours', d.items.length >= 3 && d.items[0][0] === 'Hit' && d.items[0][2] === '#2d9462', d);
  check('GR6 every compound of the primary screen with a measured potency is in it, a bound is not', d.drawn === d.prim - d.bounds, d);
  const f = await fig(pg); check('GR6 …and it is drawn', f && f.circles + f.paths > 20 && f.texts.includes('Potency and effect'), f && f.texts.slice(0, 6));
  const ex = await exportsOk(pg, '_hgKit'); check('GR9 Hit Finder\'s figure exports', ex.svg && ex.withText && ex.pdf === '%PDF-', ex);
  check('GR9 no script error in Hit Finder', errs.length === 0, errs.join(' | ')); await ctx.close();
}

/* ───── GR7: BCA ───── */
{
  const { pg, errs, ctx } = await open('bca', 'loadTestData(); switchTab("graph");');
  const d = await pg.evaluate(() => {
    const doc = bgGraphDoc(), it = doc.items[0], fit0 = bcaFit && JSON.stringify(bcaFit), y1 = it.fit.fn(1), n = it.points.reduce((a, p) => a + p.reps.length, 0), eq = doc.title[2];
    const spec = _bgKit.spec(), last = it.points[it.points.length - 1], id = last.reps[0].id; spec.omit[id] = true; _bgKit.refresh();
    const sc = _bgKit.scene(), fit1 = sc.items[0].fit, y2 = fit1 && fit1.fn ? fit1.fn(1) : null, dropped = sc.items[0].pts.reduce((a, p) => a + p.dropped.length, 0);
    return { n, eq, y1, y2, dropped, workflowSame: fit0 === (bcaFit && JSON.stringify(bcaFit)), x: doc.xScale, xs: it.points.map(p => p.x) };
  });
  check('BCA GR7 the standards are every well of every standard, on a linear concentration axis, the equation and R² in the title', d.n >= 8 && d.x === 'lin' && /R² = 0\.\d+/.test(d.eq) && /y = /.test(d.eq), d);
  check('GR7 leaving a well out of the figure refits the line, and only the figure', d.dropped === 1 && Math.abs(d.y2 - d.y1) > 1e-6 && d.workflowSame, d);
  const ex = await exportsOk(pg, '_bgKit'); check('GR9 BCA\'s figure exports', ex.svg && ex.withText && ex.pdf === '%PDF-', ex);
  check('GR9 no script error in BCA', errs.length === 0, errs.join(' | ')); await ctx.close();
}

/* ───── GR8: Tempo ───── */
{
  const { pg, errs, ctx } = await open('tempo', "await tpLoadExample('degradation'); tpTab('graph');");
  const d = await pg.evaluate(async () => {
    const dr = tgDRDoc(), rows = tgRows(), n = dr.items.length, it = dr.items[0], reps = it.points.reduce((a, p) => a + p.reps.length, 0), A = rows.find(r => r.plate.id + '|' + r.comp.key === it.id).comp.A;
    const ref = it.fit.ec50nM, rel = Math.abs(ref - A.DC50_nM) / A.DC50_nM, half = (A._bot + A._tc) / 2;
    const kit = _tgKit.dr; const sp = kit.spec(); sp.hidden = {}; kit.refresh(); const before = kit.scene().items.find(i => i.id === it.id).fit.ec50nM;
    const mid = it.points[Math.floor(it.points.length / 2)]; sp.omit[mid.reps[0].id] = true; kit.refresh(); const sc = kit.scene(), after = sc.items.find(i => i.id === it.id).fit, other = dr.items[1], oBefore = other.fit.ec50nM, oAfter = sc.items.find(i => i.id === other.id).fit.ec50nM;
    return { n, reps, rel, fnAt: it.fit.fn(A.DC50_nM), half, before, after: after && after.ec50nM, other: [oBefore, oAfter], table: !!dr.table, top: A._tc };
  });
  check('GR8 Tempo\'s dose–response has every compound with a dose–response, its replicates, and the fit of Analysis A', d.n >= 8 && d.reps >= 8 && d.rel < 0.01, d);
  check('GR8 the curve passes half-way between its bottom and its top at the DC50', Math.abs(d.fnAt - d.half) < 0.02 * Math.abs(d.half) + 0.5, d);
  check('GR8 leaving a replicate out refits that compound alone', d.after != null && Math.abs(d.after - d.before) > 1e-9 && Math.abs(d.other[1] - d.other[0]) < 1e-9, d);
  check('GR8 the figure can carry a table of DC50 and Dmax', d.table, d.table);
  const K = await pg.evaluate(async () => { TP.ui.gfig = 'kin'; tpRenderGraph(); await new Promise(r => setTimeout(r, 300)); const doc = tgKinDoc(), kit = _tgKit.kin, sc = kit.scene(), first = doc.items[0].name;
    const rows = tgRows(), other = rows.find(r => r.comp.key !== rows[0].comp.key), sel = document.getElementById('tg-comp'); sel.value = other.plate.id + '|' + other.comp.key; sel.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 300));
    return { n: doc.items.length, pts: doc.items[0].points.length, reads: TP.plates[0] && tpRes(TP.plates[0]).t.length, markers: kit.spec().xy.points, err: kit.spec().err.type, join: sc.prims.filter(p => /^join:/.test(p.el || '')).length, title2: tgKinDoc().title[0], title1: doc.title[0], first, other: other.comp.compound };
  });
  check('GR8 Kinetics draws one joined line per concentration, every read, no markers and no error bars until asked', K.n >= 5 && K.pts >= 100 && K.markers === false && K.err === 'none' && K.join === K.n, K);
  check('GR8 choosing another compound redraws the figure for it', K.title2.startsWith(K.other) && K.title1 !== K.title2, K);
  const ex = await exportsOk(pg, '_tgKit.kin'); check('GR9 Tempo\'s figure exports', ex.svg && ex.withText && ex.pdf === '%PDF-', ex);
  const T = await pg.evaluate(async () => { await tpLoadExample('timecourse'); tpTab('graph'); await new Promise(r => setTimeout(r, 400)); const btn = [...document.querySelectorAll('#tg-bar .btn')].map(b => [b.textContent, b.disabled, b.getAttribute('aria-pressed')]); return { btn, root: document.getElementById('tg-root-kin').style.display !== 'none', note: document.getElementById('tg-note').textContent }; });
  check('GR8 a time course has no dose–response: that button is off and Kinetics is shown', T.btn[0][1] === true && T.btn[1][2] === 'true' && T.root, T);
  check('GR9 no script error in Tempo', errs.length === 0, errs.join(' | ')); await ctx.close();
}

await browser.close();
console.log(findings.length ? `\n${findings.length} graph invariants failed (${passed} held)` : `\nAll ${passed} graph invariants hold.`);
process.exit(findings.length ? 1 : 0);
