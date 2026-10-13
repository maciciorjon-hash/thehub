// ChartKit invariants — the chart editor shared by Beacon, Lumina and Echo, checked as classes of bug.
//
//   K1  the right chart   Auto draws grouped bars when every compound has fewer than 4 concentrations and
//                         dose-response curves otherwise; the type can be forced either way
//   K2  omit a replicate  A left-out replicate is out of the mean, the error bar and the refitted curve, is drawn as
//                         a ghost so it is clear it was left out, and comes back
//   K3  drag and snap     Titles and the legend drag; they snap to the centre of the plot and to each other, Alt
//                         (or the Snap switch) moves freely, arrows nudge, undo puts it back
//   K4  one scene         The PNG is the size and dpi asked for (and says so in its pHYs chunk; a figure too big
//                         for a browser is made smaller and says so); the PDF is well-formed vector with every offset
//                         in its xref right; non-ASCII text survives into the PDF
//   K5  colour            A palette recolours every compound, a colour picked for one is kept until a palette is
//                         applied again, a compound keeps its colour when another is hidden, undo restores
//   K6  hostile input     Markup in a name or a title is text, in the panel, the chart and the SVG export
//   K7  errors            SD, SEM, 95% CI and range are the numbers they say; one replicate has no bar
//
//   node tools/chartkit_invariants.mjs        exit 1 on any finding
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL_ = 'file://' + path.resolve(HERE, 'chartkit/dev.html');
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else findings.push('✗ ' + name + (detail ? ' — ' + detail : '')); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
async function open(kind) { await page.goto(URL_ + '?kind=' + kind); await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await page.goto(URL_ + '?kind=' + kind); }
const ev = (f, a) => page.evaluate(f, a);

// ── K1 ──
await open('bars');
const k1 = await ev(() => {
  const o = {}; o.bars = kit.scene().kind;
  const doc = { items: [{ id: 'a', name: 'A', points: [1, 2, 3, 4].map(x => ({ x: x * 10, reps: [{ id: 'r' + x, v: x }] })) }] };
  o.four = ChartKitCore.build(doc, {}).kind;
  const spec = kit.spec(); spec.kind = 'xy'; kit.draw(); o.forced = kit.scene().kind; spec.kind = 'bars'; kit.draw(); o.forcedBars = kit.scene().kind; spec.kind = 'auto'; kit.draw();
  return o;
});
check('K1 three concentrations per compound is a bar chart, four is a curve, and the type can be forced', k1.bars === 'bars' && k1.four === 'xy' && k1.forced === 'xy' && k1.forcedBars === 'bars', JSON.stringify(k1));

// ── K2 / K7 ──
await open('xy');
const k2 = await ev(() => {
  const o = {}, spec = kit.spec(), doc = { title: ['t'], items: [{ id: 'a', name: 'A', points: [{ x: 1, reps: [{ id: 'a1', v: 1 }, { id: 'a2', v: 2 }, { id: 'a3', v: 6 }] }, { x: 10, reps: [{ id: 'b1', v: 5 }] }] }] };
  const m0 = ChartKitCore.model(doc, ChartKitCore.withDefaults(spec)); o.mean0 = m0[0].pts[0].st.mean;
  const s2 = ChartKitCore.withDefaults(spec); s2.omit = { a3: true }; const m1 = ChartKitCore.model(doc, s2); o.mean1 = m1[0].pts[0].st.mean; o.n1 = m1[0].pts[0].st.n; o.dropped = m1[0].pts[0].dropped.length; o.sd1 = m1[0].pts[0].st.sd;
  // errors
  const st = ChartKitCore.stats([1, 2, 3, 4]); o.sd = st.sd; o.sem = st.sem; o.ci = st.ci; o.single = ChartKitCore.stats([5]);
  // a refit is asked for when something is omitted, with the replicates that are left
  let asked = null; const doc2 = Object.assign({}, doc, { refit: (it, pts) => { asked = pts.map(p => p.n); return { fn: x => x }; } });
  ChartKitCore.model(doc2, s2); o.asked = asked;
  // the ghost: a dashed circle for an omitted replicate
  s2.kind = 'xy'; const sc = ChartKitCore.build(doc, s2); o.ghost = sc.prims.filter(p => p.t === 'circle' && p.dash).length;
  return o;
});
check('K2 an omitted replicate is out of the mean (3 values 1,2,6 → mean 3; without the 6 → 1.5) and out of the count', k2.mean0 === 3 && k2.mean1 === 1.5 && k2.n1 === 2 && k2.dropped === 1, JSON.stringify(k2));
check('K2 an omitted replicate is drawn as a ghost, and the curve is refitted from what is left', k2.ghost === 1 && JSON.stringify(k2.asked) === '[2,1]', JSON.stringify({ ghost: k2.ghost, asked: k2.asked }));
check('K7 SD, SEM and 95% CI are the numbers they say (1,2,3,4: SD 1.291, SEM 0.645, CI 2.054) and one replicate has no error', Math.abs(k2.sd - 1.2910) < 1e-3 && Math.abs(k2.sem - 0.6455) < 1e-3 && Math.abs(k2.ci - 3.182 * 0.6455) < 1e-2 && k2.single.sd === 0, JSON.stringify({ sd: k2.sd, sem: k2.sem, ci: k2.ci }));

// ── K3 ──
await open('bars');
const box = async (el) => page.evaluate(id => { const n = [...document.querySelectorAll('#root svg [data-el]')].find(x => x.dataset.el === id); const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, el);
async function drag(el, dx, dy, alt) {
  const b = await box(el); const x = b.x + b.w / 2, y = b.y + b.h / 2;
  await page.mouse.move(x, y); if (alt) await page.keyboard.down('Alt'); await page.mouse.down(); await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 }); await page.mouse.move(x + dx, y + dy, { steps: 3 }); await page.mouse.up(); if (alt) await page.keyboard.up('Alt');
}
const p0 = await ev(() => JSON.stringify(kit.spec().pos));
await drag('title0', 40, 30, true);
const free = await ev(() => kit.spec().pos.title0);
check('K3 a title can be dragged, and moves by what the pointer moved (Alt: free)', free && Math.abs(free.dx) > 10 && Math.abs(free.dy) > 8, JSON.stringify(free));
await ev(() => { kit.spec().pos = {}; kit.draw(); });
// snap: drag the legend a little off the plot centre line and it lands on it
const geo = await ev(() => { const s = kit.scene(), svg = document.querySelector('#root svg'), k = svg.getBoundingClientRect().width / s.W, l = [...svg.querySelectorAll('[data-el]')].find(x => x.dataset.el === 'legend').getBoundingClientRect(), o = svg.getBoundingClientRect(); return { k, plotMid: s.plot.y + s.plot.h / 2, legMid: ((l.top + l.bottom) / 2 - o.top) / k, W: s.W }; });
await drag('legend', 0, (geo.plotMid - geo.legMid + 1.5) * geo.k);
const snapped = await ev(() => { const s = kit.scene(), svg = document.querySelector('#root svg'), k = svg.getBoundingClientRect().width / s.W, l = [...svg.querySelectorAll('[data-el]')].find(x => x.dataset.el === 'legend').getBoundingClientRect(), o = svg.getBoundingClientRect(); return { mid: ((l.top + l.bottom) / 2 - o.top) / k, plotMid: s.plot.y + s.plot.h / 2 }; });
check('K3 a legend dropped 1.5 pt off the plot\'s middle snaps onto it', Math.abs(snapped.mid - snapped.plotMid) < 0.6, JSON.stringify(snapped));
await ev(() => { kit.spec().pos = {}; kit.spec().snap = false; kit.draw(); });
await drag('legend', 0, (geo.plotMid - geo.legMid + 1.5) * geo.k);
const loose = await ev(() => { const s = kit.scene(), svg = document.querySelector('#root svg'), k = svg.getBoundingClientRect().width / s.W, l = [...svg.querySelectorAll('[data-el]')].find(x => x.dataset.el === 'legend').getBoundingClientRect(), o = svg.getBoundingClientRect(); return { mid: ((l.top + l.bottom) / 2 - o.top) / k, plotMid: s.plot.y + s.plot.h / 2 }; });
check('K3 with Snap off the same drop stays where it was put', Math.abs(loose.mid - loose.plotMid) > 0.9 && Math.abs(loose.mid - loose.plotMid) < 3, JSON.stringify(loose));
await ev(() => { kit.spec().snap = true; kit.spec().pos = {}; kit.draw(); kit.select('title1'); });
await page.focus('#root'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowDown');
const nudged = await ev(() => kit.spec().pos.title1);
check('K3 arrow keys nudge the selected title 1 pt, Shift 10 pt', nudged && nudged.dx === 1 && nudged.dy === 10, JSON.stringify(nudged));
await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z');
const undone = await ev(() => kit.spec().pos.title1);
check('K3 undo takes the nudges back', !undone || (undone.dx === 0 && undone.dy === 0), JSON.stringify(undone));

// ── K4 ──
await open('bars');
const k4 = await ev(async () => {
  const o = {}, sc = kit.scene(), pdf = ChartKitExport.toPDF(sc), txt = new TextDecoder('latin1').decode(new Uint8Array(await pdf.arrayBuffer()));
  o.head = txt.slice(0, 8); o.tail = txt.slice(-5); o.title = txt.indexOf('(Compound screen @1h)') > 0; o.vector = /\sre\b/.test(txt) && !/\/Subtype \/Image/.test(txt);
  const xr = /startxref\n(\d+)/.exec(txt), tbl = txt.slice(+xr[1]).split('\n').slice(3, 11); o.xrefOk = tbl.every((l, i) => { const off = +l.slice(0, 10); return txt.slice(off).startsWith((i + 1) + ' 0 obj'); });
  const png = await ChartKitExport.toPNG(sc, 600), b = new Uint8Array(await png.blob.arrayBuffer()), dv = new DataView(b.buffer);
  o.png = { w: dv.getUint32(16), h: dv.getUint32(20), chunk: String.fromCharCode(...b.slice(37, 41)), ppm: dv.getUint32(41), expectW: Math.round(sc.W / 72 * 600) };
  // too big for a browser: scaled down and says so
  const big = ChartKitExport.pngSize({ W: 20 * 72, H: 20 * 72 }, 1200); o.big = big;
  // text outside ASCII reaches the PDF in WinAnsi
  const s2 = ChartKitCore.withDefaults(null); s2.title[0].text = 'Z\u2032 5 \u00b5M \u00b1 SD \u2013 x'; const t2 = new TextDecoder('latin1').decode(new Uint8Array(await ChartKitExport.toPDF(ChartKitCore.build(kit.scene && { items: [] }, s2)).arrayBuffer()));
  o.winansi = /Z\\?47 5 \\265M \\261 SD \\226 x|Z' 5 \\265M/.test(t2) || t2.indexOf('\\265M') > 0;
  return o;
});
check('K4 the PDF is well-formed vector (header, trailer, text, no bitmaps) and every xref offset points at its object', k4.head === '%PDF-1.4' && k4.tail === '%%EOF' && k4.title && k4.vector && k4.xrefOk, JSON.stringify({ head: k4.head, tail: k4.tail, title: k4.title, vector: k4.vector, xrefOk: k4.xrefOk }));
check('K4 a PNG at 600 dpi is figure width × 600 / 72 pixels and says 23622 pixels per metre in its pHYs chunk', k4.png.w === k4.png.expectW && k4.png.chunk === 'pHYs' && Math.abs(k4.png.ppm - 23622) <= 1, JSON.stringify(k4.png));
check('K4 a 20 × 20 in figure at 1200 dpi is more than a browser can draw: it is made smaller and says what it came to', k4.big.scaled && k4.big.w <= 16000 && k4.big.effective < 1200, JSON.stringify(k4.big));
check('K4 µ, ± and – reach the PDF as WinAnsi characters (not "?")', k4.winansi, '');
const png1200 = await ev(async () => { const r = await ChartKitExport.toPNG(kit.scene(), 1200), b = new Uint8Array(await r.blob.arrayBuffer()), dv = new DataView(b.buffer); return { w: dv.getUint32(16), ppm: dv.getUint32(41), expect: Math.round(kit.scene().W / 72 * 1200) }; });
check('K4 the 1200 dpi PNG is 1200 dpi: figure width × 1200 / 72 pixels, 47244 per metre', png1200.w === png1200.expect && png1200.ppm === 47244, JSON.stringify(png1200));

// ── K5 ──
await open('bars');
const k5 = await ev(() => {
  const o = {}, spec = kit.spec(), svg = document.querySelector('#root svg'), fillOf = id => { const r = [...svg.querySelectorAll('rect[data-el="bar:' + id + '"]')][0]; return r && r.getAttribute('fill'); };
  o.before = [fillOf('c0'), fillOf('c1')];
  document.querySelector('#root [data-tab=colors]').click(); document.querySelector('#root [data-pal=okabe]').click();
  o.okabe = [fillOf('c0'), fillOf('c1')];
  const inp = document.querySelector('#root .ck-color[data-item=c1]'); inp.value = '#123456'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  o.picked = [fillOf('c0'), fillOf('c1')];
  spec.hidden.c0 = true; kit.draw(); o.hidden = fillOf('c1'); delete spec.hidden.c0; kit.draw();
  document.querySelector('#root [data-pal=bold]').click(); o.bold = [fillOf('c0'), fillOf('c1')];
  document.querySelector('#root [data-a=undo]').click(); o.undone = [fillOf('c0'), fillOf('c1')];
  return o;
});
check('K5 a palette recolours every compound', k5.before[0] !== k5.okabe[0] && k5.okabe[0] === '#0072b2' && k5.okabe[1] === '#d55e00', JSON.stringify(k5));
check('K5 a colour picked for one compound is kept, and hiding another compound does not move it', k5.picked[1] === '#123456' && k5.picked[0] === '#0072b2' && k5.hidden === '#123456', JSON.stringify(k5));
check('K5 applying a palette again replaces the picked colour, and undo brings it back', k5.bold[1] === '#377eb8' && k5.undone[1] === '#123456', JSON.stringify({ bold: k5.bold, undone: k5.undone }));

// ── K6 ──
await open('bars');
const k6 = await ev(() => {
  window.__x = 0; const evil = '<img src=x onerror="window.__x=1">';
  const el = document.createElement('div'); document.body.appendChild(el);
  const k = ChartKit.mount(el, { key: 'evil', doc: () => ({ title: [evil], xTitle: evil, yTitle: evil, items: [{ id: 'e<1>', name: evil, points: [{ x: 1, label: evil, reps: [{ id: 'r"1', v: 1 }] }] }] }) });
  k.select('bar:e<1>'); document.querySelector('[data-tab=colors]'); el.querySelector('[data-tab=data]').click(); el.querySelector('[data-tab=colors]').click(); el.querySelector('[data-tab=text]').click();
  const svgTxt = ChartKitExport.toSVG(k.scene());
  return { ran: window.__x, imgs: el.querySelectorAll('img').length + (svgTxt.indexOf('<img') >= 0 ? 1 : 0), shown: svgTxt.indexOf('&lt;img src=x') >= 0 };
});
check('K6 markup in a compound name, a title or a label is text everywhere: nothing runs and no element is made', k6.ran === 0 && k6.imgs === 0 && k6.shown, JSON.stringify(k6));

// ── K8 ──
await open('bars');
const k8 = await ev(() => {
  const o = {}, el = document.createElement('div'); document.body.appendChild(el);
  let sig = 'one'; const mk = () => ({ sig, title: ['Hello'], items: [{ id: 'a', name: 'A', points: [{ x: 1, reps: [{ id: 'w1', v: 1 }, { id: 'w2', v: 2 }] }] }] });
  const k = ChartKit.mount(el, { key: 'sigtest', doc: mk });
  const spec = k.spec(); spec.omit.w1 = true; spec.colors.a = '#123456'; spec.pos.title0 = { dx: 5, dy: 5 }; spec.title[0].text = 'Mine'; spec.palette = 'okabe'; spec.err.type = 'sem';
  k.refresh(); o.sameSig = [!!spec.omit.w1, spec.colors.a, spec.title[0].text];
  sig = 'two'; k.refresh(); const s2 = k.spec(); o.newSig = [!!s2.omit.w1, s2.colors.a || null, s2.title[0].text, s2.pos.title0 || null, s2.palette, s2.err.type];
  return o;
});
check('K8 the same data keeps what was done to it; different data drops omitted replicates, colours, positions and retyped titles but keeps the style (palette, error type)', k8.sameSig[0] === true && k8.sameSig[1] === '#123456' && k8.sameSig[2] === 'Mine' && k8.newSig[0] === false && k8.newSig[1] === null && k8.newSig[2] === null && k8.newSig[3] === null && k8.newSig[4] === 'okabe' && k8.newSig[5] === 'sem', JSON.stringify(k8));
await page.evaluate(() => { const host = document.createElement('div'); host.id = 'persist-host'; document.body.appendChild(host); window.__pk = ChartKit.mount(host, { key: 'persist2', doc: () => ({ sig: 's', title: ['T'], items: [{ id: 'a', name: 'A', points: [{ x: 1, reps: [{ id: 'w1', v: 1 }] }] }] }) }); const sp = window.__pk.spec(); sp.omit.w1 = true; sp.colors.a = '#abcdef'; sp.title[0].text = 'Secret title'; });
await page.click('#persist-host [data-tab=colors]'); await page.click('#persist-host [data-pal=bold]');
await page.waitForTimeout(500);
const saved = await ev(() => JSON.parse(localStorage.getItem('ck:persist2') || 'null'));
check('K8 what is stored between visits is the style (the palette) and none of the data\'s own state (omitted replicates, colours, titles)', saved && saved.palette === 'bold' && Object.keys(saved.omit).length === 0 && Object.keys(saved.colors).length === 0 && saved.title[0].text === null, JSON.stringify(saved && { palette: saved.palette, omit: saved.omit, colors: saved.colors, t: saved.title[0].text }));

check('no page or console errors', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close();
if (findings.length) { console.log(findings.join('\n')); console.log(`\n${findings.length} finding(s), ${passed} checks passed.`); process.exit(1); }
console.log(`ChartKit invariants: ${passed} checks passed.`);
