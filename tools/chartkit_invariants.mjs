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
//   K9  reachable         In Beacon, Lumina and Echo, with the mouse wheel over the figure, the whole figure and the whole panel
//                         beside it can be scrolled into view at two window sizes (Echo's pane is overflow:hidden: it once could not)
//   K10 room for labels   Whatever the page size (all five presets and the smallest), the number of compounds (1 to 63), the length
//                         of a name, bars or curves: every label lies inside the figure and on no other label, and so does the legend
//   K11 a number is a     Emptying or overtyping a field of the Page / Axes tabs cannot make a figure 71 892 pt wide (a 16 000 × 1 px
//       number the figure PNG), a font of 0, a minimum above the maximum or 200 tick labels on one another
//       can hold
//   K12 a curve that      Leave out so many replicates that a curve cannot be refitted: it is not drawn, and the figure's status line and
//       cannot be refitted  the Data tab say so; putting them back clears it
//   K13 Echo's chooser    The compound count is one line (its class once collided with the Gradient Planner's round badge); a figure
//                         holds at most 24 compounds; the key of a compound includes its assay panel; opening different results
//                         (same count, same first compound) drops the old choice and the left-out replicates
//   K14 consistent axes   A run of decades is labelled all as powers of ten or all as plain numbers, never "10^-3, 0.01, 0.1"
//   K15 narrow windows    At 900 and 700 px wide nothing scrolls sideways in any of the three apps
//
//   K16 one figure at any size  Resizing the page keeps the figure the same figure: type, lines, markers, margins and where things were dragged are all in proportion to the page's
//                               width (with Scale off they are real points). 3.4 in and 9 in give the same ratios.
//   K17 fits the screen         In Beacon, Lumina and Echo the whole figure and its whole panel are inside the window at 1440 × 900 and 1280 × 720 without scrolling, and the figure is as large
//                               as the room allows (it is the width or the height that stops it, not a fixed size) — whatever shape the page is.
//   K18 the defaults            One hue by default (a blue ramp), a step apart for 2 to 12 compounds; markers, lines and error-bar caps small enough not to hide the data.
//
//   K20 a fit stops where   A fit is drawn from its first to its last dose and not across the axis (a curve to the edge of a 6-decade axis reads as a result past the data); Style › "Extend the fit across the
//       the points stop     whole axis" brings the old drawing back; the Y range of the figure is unchanged either way.
//   K21 nothing until       A figure with several compounds starts with none drawn, each with a tick beside its name (Data tab) and a hint where the figure is; ticking draws it, Show all / Hide all work, choices
//       it is ticked        survive a refresh of the same data and new data starts unticked again; a lone compound, and a host with its own chooser (drawAll), are drawn at once.
//   K22 open on request     Ticking a compound does not list its replicates: they open when its name or the arrow beside it is clicked (and close the same way), for that compound only.
//
//   K23 a title line has  Its Size changes that line (not a key of its own), from the card and from the Text tab, and is drawn at that size
//       a size
//   K24 the legend moves  Dragging the legend changes only the legend: the plot keeps its place and size; "Legend takes no room" is the one way to give its space to the plot
//   K25 colour in the     The colour card has Within the palette (swatches) and Full spectrum (picker, hex); it opens on the one the colour belongs to
//       palette or not
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
  document.querySelector('#root .ck-chip[data-pick="bar:c1"]').click(); document.querySelector('#root [data-cm=full]').click(); const inp = document.querySelector('#root .ck-color[data-item=c1]'); inp.value = '#123456'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  o.picked = [fillOf('c0'), fillOf('c1')];
  spec.hidden.c0 = true; kit.draw(); o.hidden = fillOf('c1'); delete spec.hidden.c0; kit.draw();
  document.querySelector('#root [data-pal=bold]').click(); o.bold = [fillOf('c0'), fillOf('c1')];
  document.querySelector('#root [data-a=undo]').click(); o.undone = [fillOf('c0'), fillOf('c1')];
  return o;
});
check('K5 a palette recolours every compound', k5.before[0] !== k5.okabe[0] && k5.okabe[0] === '#0072b2' && k5.okabe[1] === '#d55e00', JSON.stringify(k5));
check('K5 a colour picked for one compound is kept, and hiding another compound does not move it', k5.picked[1] === '#123456' && k5.picked[0] === '#0072b2' && k5.hidden === '#123456', JSON.stringify(k5));
check('K5 applying a palette again replaces the picked colour, and undo brings it back', k5.bold[1] === '#377eb8' && k5.undone[1] === '#123456', JSON.stringify({ bold: k5.bold, undone: k5.undone }));

// ── K23 / K24 / K25 ──
await open('bars');
const k23 = await ev(() => {
  const o = {}, spec = kit.spec(); spec.title[0].text = 'Heading'; kit.draw(); kit.select('title0');
  const inp = document.querySelector('#root [data-tp="title.0.size"]'); o.hasInput = !!inp;
  if (inp) { inp.value = '24'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  o.size = kit.spec().title[0].size; o.junk = Object.keys(kit.spec()).filter(k => /^title\d$/.test(k));
  const t = [...document.querySelectorAll('#root svg [data-el]')].find(x => x.dataset.el === 'title0'); const tx = t && (t.tagName === 'text' ? t : t.querySelector('text')); o.fs = tx && +tx.getAttribute('font-size');
  document.querySelector('#root [data-tab=text]').click(); const tin = document.querySelector('#root [data-p="title.2.size"]'); o.tabInput = !!tin;
  if (tin) { tin.value = '17'; tin.dispatchEvent(new Event('input', { bubbles: true })); } o.size2 = kit.spec().title[2].size;
  const w = ChartKitCore.withDefaults({ title0: { size: 9 } }); o.healed = !('title0' in w);
  return o;
});
check('K23 the Size of a title line changes that line (title[0].size), not a key of its own, and the Text tab has a size for each line', k23.hasInput && k23.size === 24 && k23.junk.length === 0 && k23.tabInput && k23.size2 === 17 && k23.healed, JSON.stringify(k23));
check('K23 the title is drawn at the size set', k23.fs && Math.abs(k23.fs - 24) < 6, JSON.stringify(k23));

await open('bars');
await ev(() => { kit.spec().snap = false; });
const plotOf = () => ev(() => { const s = kit.scene(); return { x: s.plot.x, y: s.plot.y, w: s.plot.w, h: s.plot.h, W: s.W, H: s.H }; });
const pl0 = await plotOf();
await drag('legend', -70, 25, true);
const pl1 = await plotOf();
const legIn = await ev(() => { const svg = document.querySelector('#root svg'), o = svg.getBoundingClientRect(), l = [...svg.querySelectorAll('[data-el]')].find(x => x.dataset.el === 'legend').getBoundingClientRect(); return l.left >= o.left - 1 && l.right <= o.right + 1 && l.top >= o.top - 1 && l.bottom <= o.bottom + 1; });
check('K24 dragging the legend moves the legend and nothing else: the plot keeps its place and size, and the legend stays on the page', ['x', 'y', 'w', 'h', 'W', 'H'].every(k => Math.abs(pl0[k] - pl1[k]) < 0.01) && legIn, JSON.stringify({ pl0, pl1, legIn }));
await ev(() => { kit.spec().legend.float = true; kit.draw(); });
const pl2 = await plotOf();
check('K24 "Legend takes no room" hands its space to the plot, on request only', pl2.w > pl1.w + 20, JSON.stringify({ pl1, pl2 }));

await open('bars');
const k25 = await ev(() => {
  const o = {}, spec = kit.spec(), q = s => document.querySelector('#root ' + s);
  document.querySelector('#root [data-tab=colors]').click(); o.chip = !!q('.ck-chip[data-pick="bar:c1"]'); q('.ck-chip[data-pick="bar:c1"]').click();
  o.tabs = [...document.querySelectorAll('#root [data-cm]')].map(b => b.textContent);
  o.swatches = document.querySelectorAll('#root .ck-sw .ck-swb').length; o.pickerInPalette = !!q('.ck-selbox .ck-color, #root .ck-color[data-item="c1"]') && !!document.querySelector('#root .ck-sel .ck-color');
  const sw = document.querySelectorAll('#root .ck-sw .ck-swb')[3]; const c3 = sw && sw.dataset.c; if (sw) sw.click(); o.paletteColour = spec.colors.c1 === c3;
  q('[data-cm="full"]').click(); o.full = !!document.querySelector('#root [data-hex="c1"]');
  const hx = document.querySelector('#root [data-hex="c1"]'); hx.value = '#abcdef'; hx.dispatchEvent(new Event('change', { bubbles: true })); o.hex = spec.colors.c1;
  kit.select(null); kit.select('bar:c1'); o.opensFull = !!document.querySelector('#root [data-hex="c1"]');
  document.querySelector('#root [data-a="resetcolor"]').click(); kit.select(null); kit.select('bar:c1'); o.opensPalette = !document.querySelector('#root [data-hex="c1"]') && document.querySelectorAll('#root .ck-sw .ck-swb').length > 0;
  return o;
});
check('K25 the colour card has "Within the palette" and "Full spectrum": swatches in the first, any colour (picker or hex) in the second, opening on the one the colour belongs to', k25.chip && k25.tabs.join('|') === 'Within the palette|Full spectrum' && k25.swatches >= 8 && k25.paletteColour && k25.full && k25.hex === '#abcdef' && k25.opensFull && k25.opensPalette, JSON.stringify(k25));

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
const saved = await ev(() => JSON.parse(localStorage.getItem('ck2:persist2') || 'null'));
check('K8 what is stored between visits is the style (the palette) and none of the data\'s own state (omitted replicates, colours, titles)', saved && saved.palette === 'bold' && Object.keys(saved.omit).length === 0 && Object.keys(saved.colors).length === 0 && saved.title[0].text === null, JSON.stringify(saved && { palette: saved.palette, omit: saved.omit, colors: saved.colors, t: saved.title[0].text }));

// ── K20 / K21 ──
await open('xy');
const k20 = await ev(() => {
  const o = {}, spec = kit.spec();
  const ends = (sc, id) => { const f = sc.prims.find(p => p.el === 'fit:' + id), mk = sc.prims.filter(p => p.el === 'pt:' + id && (p.t === 'marker' || p.t === 'circle') && !p.dash).map(p => p.cx !== undefined ? p.cx : p.x); return f ? { fit: [Math.min(...f.pts.map(q => q[0])), Math.max(...f.pts.map(q => q[0]))], pts: [Math.min(...mk), Math.max(...mk)], plot: [sc.plot.x, sc.plot.x + sc.plot.w] } : null; };
  spec.xy.extend = false; kit.draw(); o.stop = ends(kit.scene(), 'c0');
  spec.xy.extend = true; kit.draw(); o.extend = ends(kit.scene(), 'c0');
  spec.xy.extend = false; kit.draw();
  return o;
});
check('K20 the fit starts and ends on the first and last point, inside the plot', k20.stop && Math.abs(k20.stop.fit[0] - k20.stop.pts[0]) < 1 && Math.abs(k20.stop.fit[1] - k20.stop.pts[1]) < 1 && k20.stop.fit[0] > k20.stop.plot[0] + 3 && k20.stop.fit[1] < k20.stop.plot[1] - 3, JSON.stringify(k20.stop));
check('K20 "Extend the fit across the whole axis" draws it from edge to edge of the plot', k20.extend && Math.abs(k20.extend.fit[0] - k20.extend.plot[0]) < 1 && Math.abs(k20.extend.fit[1] - k20.extend.plot[1]) < 1, JSON.stringify(k20.extend));

await page.goto(URL_ + '?kind=xy&hide=1');
const k21 = await ev(() => {
  const o = {}, sc = () => kit.scene(), root = document.getElementById('root'), ticks = () => [...root.querySelectorAll('.ck-tick')];
  o.start = { hidden: sc().items.map(i => i.hidden), fits: sc().prims.filter(p => /^fit:/.test(p.el || '')).length, ticks: ticks().map(t => t.checked), status: root.querySelector('.ck-status').textContent };
  ticks()[1].click(); o.one = { hidden: sc().items.map(i => i.hidden), fits: sc().prims.filter(p => /^fit:/.test(p.el || '')).map(p => p.el) };
  root.querySelector('[data-a=showall]').click(); o.all = sc().items.every(i => !i.hidden);
  root.querySelector('[data-a=hideall]').click(); o.none = sc().items.every(i => i.hidden);
  ticks()[2].click(); kit.refresh(); o.kept = sc().items.map(i => i.hidden);
  // new data: the compounds already met keep their tick, a compound not seen before starts unticked
  const el = document.createElement('div'); document.body.appendChild(el); let n = 2; const mk = () => ({ sig: 'same', title: ['T'], items: Array.from({ length: n }, (_, i) => ({ id: 'z' + i, name: 'Z' + i, points: [{ x: 1, reps: [{ id: 'q' + i, v: 1 }] }, { x: 10, reps: [{ id: 'r' + i, v: 2 }] }] })) });
  const k = ChartKit.mount(el, { key: 'k21b', doc: mk }); o.two = k.scene().items.map(i => i.hidden);
  k.spec().hidden = { z0: true }; delete k.spec().hidden.z1; n = 3; k.refresh(); o.grown = k.scene().items.map(i => i.hidden);
  const el2 = document.createElement('div'); document.body.appendChild(el2); o.lone = ChartKit.mount(el2, { key: 'k21c', doc: () => ({ sig: 'l', title: ['T'], items: [{ id: 'a', name: 'A', points: [{ x: 1, reps: [{ id: 'q', v: 1 }] }] }] }) }).scene().items.map(i => i.hidden);
  const el3 = document.createElement('div'); document.body.appendChild(el3); o.own = ChartKit.mount(el3, { key: 'k21d', drawAll: true, doc: mk }).scene().items.map(i => i.hidden);
  return o;
});
check('K21 a figure with several compounds starts with none drawn, every box unticked, and says so under the figure', k21.start.hidden.every(Boolean) && k21.start.hidden.length >= 3 && k21.start.fits === 0 && k21.start.ticks.length === k21.start.hidden.length && k21.start.ticks.every(t => !t) && /tick the compounds/i.test(k21.start.status), JSON.stringify(k21.start));
check('K21 ticking a compound draws it and only it', k21.one.hidden.filter(h => !h).length === 1 && !k21.one.hidden[1] && k21.one.fits.length === 1, JSON.stringify(k21.one));
check('K21 Show all draws every compound, Hide all none, and a tick survives a refresh of the same data', k21.all === true && k21.none === true && k21.kept.filter(h => !h).length === 1 && !k21.kept[2], JSON.stringify({ all: k21.all, none: k21.none, kept: k21.kept }));
check('K21 data that gains a compound leaves the ticks as they were and starts the new one unticked', JSON.stringify(k21.two) === '[true,true]' && JSON.stringify(k21.grown) === '[true,false,true]', JSON.stringify({ two: k21.two, grown: k21.grown }));
check('K21 a lone compound is drawn at once, and so is every compound of a host with its own chooser', JSON.stringify(k21.lone) === '[false]' && k21.own.every(h => !h), JSON.stringify({ lone: k21.lone, own: k21.own }));

await page.goto(URL_ + '?kind=xy&hide=1');
const k22 = await ev(() => {
  const root = document.getElementById('root'), o = {}, dp = () => root.querySelectorAll('.ck-dp').length, tick = i => root.querySelectorAll('.ck-tick')[i];
  tick(0).click(); tick(1).click(); o.afterTick = dp();
  root.querySelectorAll('.ck-name')[0].click(); o.afterName = dp(); o.open0 = root.querySelectorAll('.ck-dg')[0].querySelectorAll('.ck-dp').length; o.open1 = root.querySelectorAll('.ck-dg')[1].querySelectorAll('.ck-dp').length;
  root.querySelectorAll('.ck-chev')[1].click(); o.afterArrow = [root.querySelectorAll('.ck-dg')[0].querySelectorAll('.ck-dp').length, root.querySelectorAll('.ck-dg')[1].querySelectorAll('.ck-dp').length];
  root.querySelectorAll('.ck-chev')[0].click(); o.closed = root.querySelectorAll('.ck-dg')[0].querySelectorAll('.ck-dp').length;
  return o;
});
check('K22 ticking compounds lists no replicates', k22.afterTick === 0, JSON.stringify(k22));
check('K22 the name opens its compound\'s replicates, and only its own', k22.open0 > 0 && k22.open1 === 0, JSON.stringify(k22));
check('K22 the arrow opens another compound\'s, and closes an open one', k22.afterArrow[0] > 0 && k22.afterArrow[1] > 0 && k22.closed === 0, JSON.stringify(k22));

// ═════ the editor inside the apps (what a person actually meets) ═════
const APPS = {
  echo: { file: 'apps/echo/echo.html', kit: '_egKit', root: '#eg-root', load: async pg => { await pg.evaluate(() => loadTestData()); await pg.waitForTimeout(600); await pg.evaluate(() => runPipeline()); await pg.waitForFunction(() => typeof _lastResultsData !== 'undefined' && _lastResultsData && _lastResultsData.length > 0, null, { timeout: 120000 }); await pg.waitForTimeout(500); await pg.evaluate(() => document.querySelector('[data-tab="graph"]').click()); } },
  lumina: { file: 'apps/lumina/lumina.html', kit: '_lgKit', root: '#lg-root', load: async pg => { await pg.evaluate(() => loadLuminaTestData()); await pg.waitForTimeout(1500); await pg.evaluate(() => switchTab('graph')); } },
  beacon: { file: 'apps/beacon/beacon.html', kit: '_bgKit', root: '#bg-root', load: async pg => { await pg.evaluate(() => loadTestData('gain')); await pg.waitForTimeout(800); await pg.evaluate(() => document.querySelector('[data-tab="graph"]').click()); } },
};
const REPO = path.resolve(HERE, '..');
const LABELS = () => {   // every label inside the figure and on no other label; the legend inside too
  window.__ckLabels = function (sc) {
    const C = ChartKitCore, out = [], bad = [];
    function box(p, tag) { const w = p.w || C.measure(p.text, p.size, p.bold, p.italic, p.font), h = p.size, l = p.anchor === 'middle' ? -w / 2 : p.anchor === 'end' ? -w : 0, pts = [[l, -h * .8], [l + w, -h * .8], [l + w, h * .25], [l, h * .25]], th = (p.rot || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), q = pts.map(a => [p.x + a[0] * c - a[1] * s, p.y + a[0] * s + a[1] * c]), xs = q.map(a => a[0]), ys = q.map(a => a[1]); out.push({ id: tag || p.el, l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) }); }
    sc.prims.forEach(p => { if (p.t === 'text') box(p); else if (p.t === 'group') p.kids.forEach(k => { if (k.t === 'text') box(k, 'legtext'); }); });
    out.forEach(x => { if (x.l < -.5 || x.t < -.5 || x.r > sc.W + .5 || x.b > sc.H + .5) bad.push('outside:' + x.id); });
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) { const p = out[i], q = out[j], ox = Math.min(p.r, q.r) - Math.max(p.l, q.l), oy = Math.min(p.b, q.b) - Math.max(p.t, q.t); if (ox > 1 && oy > 1 && !(p.id.startsWith('xTick') && q.id.startsWith('xTick'))) bad.push(p.id + '/' + q.id); }
    const g = sc.prims.find(p => p.t === 'group'); if (g && (g.y < -.5 || g.y + g.h > sc.H + .5 || g.x + g.w > sc.W + .5 || g.x < -.5)) bad.push('legend box');
    // the labels under bars: written ones are a text height apart (rotated labels' boxes overlap legitimately, so it is the spacing that is asked)
    if (sc.kind === 'bars') { const xt = sc.prims.filter(p => p.t === 'text' && /^xTick/.test(p.el) && p.text).sort((a, b) => a.x - b.x); for (let i = 1; i < xt.length; i++) { const a = xt[i - 1], b = xt[i], rot = Math.abs(a.rot || 0), need = (rot >= 80 ? a.size * 1.0 : rot ? a.size * 1.3 : Math.max(a.w, b.w) * .95); if (b.x - a.x > .01 && b.x - a.x < need - .01) { bad.push('xlabels crowded'); break; } } }
    return [...new Set(bad)].slice(0, 4);
  };
};
async function openApp(name, vp, asMet) {
  const a = APPS[name], c = await browser.newContext({ viewport: vp || { width: 1280, height: 800 }, acceptDownloads: true }), pg = await c.newPage(), e = [];
  pg.on('pageerror', x => e.push(name + ' pageerror: ' + x.message)); pg.on('console', m => { if (m.type() === 'error') e.push(name + ' console: ' + m.text().slice(0, 140)); });
  await pg.goto('file://' + path.join(REPO, a.file)); await pg.waitForTimeout(1200); await a.load(pg); await pg.waitForTimeout(900); await pg.evaluate(LABELS);
  // the kit starts every compound unticked; the checks about drawing tick them first, K19b asks for the kit as it is first met (asMet)
  if (!asMet) await pg.evaluate(k => { const kit = window[k]; if (kit) { kit.spec().hidden = {}; kit.refresh(); } }, a.kit);
  return { c, pg, e, a };
}
const appErrs = [];

// K16 / K18 — the core
await open('xy');
const k16 = await ev(() => {
  const C = ChartKitCore, doc = { title: ['T', '', ''], xTitle: 'x', yTitle: 'y', items: [{ id: 'a', name: 'A', fit: { fn: x => 1 - 1 / (1 + Math.pow(x / 100, -1)) }, points: [1000, 300, 100, 30, 10, 3].map((c, j) => ({ x: c, label: String(c), reps: [0, 1].map(r => ({ id: 'a' + j + r, v: 1 - 1 / (1 + Math.pow(c / 100, -1)) + r * 0.03 })) })) }] };
  function at(w, scale) { const sp = { w: w, h: w * 0.62, kind: 'xy', pos: { yTitle: { dx: 6, dy: 0 } } }; if (scale === false) sp.scale = false; const sc = C.build(doc, sp), mk = sc.prims.find(p => p.t === 'marker'), ln = sc.prims.find(p => p.el === 'axisX'), tk = sc.prims.find(p => p.t === 'text' && /^yTick/.test(p.el)), yt = sc.prims.find(p => p.el === 'yTitle'), base = C.build(doc, (scale === false ? { w: w, h: w * 0.62, kind: 'xy', scale: false } : { w: w, h: w * 0.62, kind: 'xy' })).prims.find(p => p.el === 'yTitle');
    return { r: mk.r / sc.W, sw: ln.sw / sc.W, tick: tk.size / sc.W, plot: sc.plot.w / sc.W, drag: (yt.x - base.x) / sc.W, W: sc.W }; }
  return { small: at(3.4, undefined), big: at(9, undefined), refSmall: at(3.4, false), refBig: at(9, false) };
});
const same = (a, b) => ['r', 'sw', 'tick', 'plot', 'drag'].every(k => Math.abs(a[k] - b[k]) <= Math.max(1e-4, Math.abs(a[k]) * 0.03));
check('K16 a figure 3.4 in wide and one 9 in wide have the same marker, line, type, plot and dragged position in proportion to their width', same(k16.small, k16.big) && Math.abs(k16.small.W - 3.4 * 72) < 0.01 && Math.abs(k16.big.W - 9 * 72) < 0.01, JSON.stringify(k16));
check('K16 with Scale off the sizes are real points, so a smaller page holds relatively larger marks', !same(k16.refSmall, k16.refBig) && k16.refSmall.r > k16.refBig.r * 1.5, JSON.stringify({ a: k16.refSmall, b: k16.refBig }));
const k18 = await ev(() => {
  const C = ChartKitCore, d = C.defaults(), o = {};
  function hue(h) { const c = C.rgb(h).map(x => x / 255), mx = Math.max(...c), mn = Math.min(...c), dl = mx - mn; let hh = dl === 0 ? 0 : mx === c[0] ? ((c[1] - c[2]) / dl) % 6 : mx === c[1] ? (c[2] - c[0]) / dl + 2 : (c[0] - c[1]) / dl + 4; hh = (hh * 60 + 360) % 360; return { h: hh, l: (mx + mn) / 2 }; }
  o.pal = d.palette; o.ramps = [2, 4, 8, 12].map(n => { const hs = Array.from({ length: n }, (_, i) => hue(C.blueRamp(i, n))); return { n, hueSpan: Math.max(...hs.map(x => x.h)) - Math.min(...hs.map(x => x.h)), minStep: Math.min(...hs.slice(1).map((x, i) => Math.abs(x.l - hs[i].l))) }; });
  o.msize = d.xy.msize; o.lw = d.xy.lw; o.cap = d.err.cap; o.ptsize = d.pts.size;
  const sc = C.build({ items: [{ id: 'a', name: 'A', points: [{ x: 1, reps: [{ id: 'r', v: 1 }] }, { x: 10, reps: [{ id: 'r2', v: 2 }] }] }, { id: 'b', name: 'B', points: [{ x: 1, reps: [{ id: 'r3', v: 1 }] }] }] }, { kind: 'xy' }); o.colours = [...new Set(sc.prims.filter(p => p.t === 'marker').map(p => p.fill))];
  return o;
});
check('K18 the default palette is a blue ramp: 2, 4, 8 and 12 compounds share one hue (within 6°) and neighbouring steps differ in lightness', k18.pal === 'blue' && k18.ramps.every(r => r.hueSpan < 6 && (r.n > 8 ? r.minStep > 0.02 : r.minStep > 0.04)), JSON.stringify(k18.ramps));
check('K18 default markers (r ≤ 3.2 pt), lines (≤ 1.6 pt), error caps (≤ 3.5 pt) and replicate points (≤ 2.2 pt) are small, and the figure draws two blues', k18.msize <= 3.2 && k18.lw <= 1.6 && k18.cap <= 3.5 && k18.ptsize <= 2.2 && k18.colours.length === 2, JSON.stringify(k18));

// K14 — a run of decades is labelled one way (the editor's own core, three data ranges)
await open('xy');
const k14 = await ev(() => { const C = ChartKitCore, out = {}; [[-4, 2], [-6, 1], [-2, 2], [0, 3], [-8, -4]].forEach(r => { const e = []; for (let x = r[0]; x <= r[1]; x++) e.push(x); out[r.join('..')] = C.decadeLabels(e); }); return out; });
check('K14 a run of decades is all powers of ten or all plain numbers', Object.values(k14).every(l => l.every(x => /^10\^/.test(x)) || l.every(x => !/^10\^/.test(x))), JSON.stringify(k14));

// K10 — room for labels, in the core (every page preset, 1–63 compounds, long names, bars and curves)
await open('xy');
await ev(LABELS);
const k10core = await ev(() => {
  const C = ChartKitCore, out = {};
  const doc = (n, long, bars) => ({ title: ['HiBiT degradation', '', ''], xTitle: '[compound] (µM)', yTitle: '% Signal (norm. to ctrl)', refLine: { y: 100 }, items: Array.from({ length: n }, (_, i) => ({ id: 'i' + i, name: (long ? 'A-very-long-compound-identifier-with-a-salt-form-HCl-' : 'EDA-0') + i + ' · BRD2', points: [10, 3, 1, .3, .1, .03, .01, .003, .001, .0003].slice(0, bars === 'dense' ? 10 : bars ? 3 : 7).map((x, j) => ({ x, reps: [{ id: 'r' + i + j + 'a', v: 100 - j * 13 }, { id: 'r' + i + j + 'b', v: 98 - j * 13 }] })), fit: { fn: x => 50 } })) });
  [['1 column', 3.4, 2.7], ['1.5 columns', 5, 3.5], ['2 columns', 6.5, 4.2], ['Slide', 9, 5.2], ['Square', 4.5, 4.5], ['smallest', 1, 1]].forEach(pg => [1, 3, 6, 12, 24, 63].forEach(n => [false, true].forEach(long => [false, true, 'dense'].forEach(bars => { const sc = C.build(doc(n, long, bars), { w: pg[1], h: pg[2], kind: bars ? 'bars' : 'xy' }), bad = window.__ckLabels(sc); if (bad.length) out[pg[0] + ' n=' + n + (long ? ' long' : '') + (bars ? ' bars' + (bars === 'dense' ? ' ×10' : '') : '')] = bad.join(','); }))));
  return out;
});
check('K10 every label and the legend lie inside the figure and on no other label — 6 page sizes × 1–63 compounds × short/long names × bars/curves', Object.keys(k10core).length === 0, JSON.stringify(k10core).slice(0, 400));

for (const name of Object.keys(APPS)) {
  const { c, pg, e, a } = await openApp(name);
  const E = (f, x) => pg.evaluate(f, x);
  try {
  // K9 — reachable with the wheel
  const reach = () => E(r => { const sv = document.querySelector(r + ' svg.ck-svg').getBoundingClientRect(), p = document.querySelector(r + ' .ck-panel').getBoundingClientRect(); return { svgTop: Math.round(sv.top), svgBottom: Math.round(sv.bottom), panelBottom: Math.round(p.bottom), vh: innerHeight }; }, a.root);
  for (const [w, h] of [[1280, 800], [1024, 768]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(400);
    await E(() => window.scrollTo(0, 0));
    const at = await E(r => { const b = document.querySelector(r + ' svg.ck-svg').getBoundingClientRect(); return [b.x + b.width / 2, Math.min(b.y + 40, innerHeight - 60)]; }, a.root);
    await pg.mouse.move(at[0], Math.max(at[1], 120)); for (let i = 0; i < 8; i++) await pg.mouse.wheel(0, 700); await pg.waitForTimeout(350);
    const r1 = await reach();
    check('K9 ' + name + ' ' + w + '×' + h + ': with the wheel the whole figure (bottom ' + r1.svgBottom + ') and the whole panel (' + r1.panelBottom + ') can be scrolled into the window (' + r1.vh + ')', r1.svgBottom <= r1.vh + 1 && r1.panelBottom <= r1.vh + 1, JSON.stringify(r1));
    for (let i = 0; i < 8; i++) await pg.mouse.wheel(0, -700); await pg.waitForTimeout(350);
    const r0 = await reach();
    check('K9 ' + name + ' ' + w + '×' + h + ': and back up to the top of the figure', r0.svgTop >= 0, JSON.stringify(r0));
  }
  await pg.setViewportSize({ width: 1280, height: 800 });
  // K10 — the adapter's own data at every page size, as bars and as curves
  const k10 = await E(k => { const kit = window[k], spec = kit.spec(), out = {}, keep = JSON.stringify([spec.w, spec.h, spec.kind]); [['1 column', 3.4, 2.7], ['1.5 columns', 5, 3.5], ['2 columns', 6.5, 4.2], ['Slide', 9, 5.2], ['Square', 4.5, 4.5], ['smallest', 1, 1]].forEach(pg => ['xy', 'bars'].forEach(kind => { spec.w = pg[1]; spec.h = pg[2]; spec.kind = kind; kit.draw(); const bad = window.__ckLabels(kit.scene()); if (bad.length) out[pg[0] + ' ' + kind] = bad.join(','); })); const k0 = JSON.parse(keep); spec.w = k0[0]; spec.h = k0[1]; spec.kind = k0[2]; kit.draw(); return out; }, a.kit);
  check('K10 ' + name + ': its own compounds fit every page size as curves and as bars', Object.keys(k10).length === 0, JSON.stringify(k10));
  // K11 — numbers
  await pg.click(a.root + ' .ck-tabs [data-tab="page"]');
  const wf = pg.locator(a.root + ' input[data-p="w"]'); await wf.click(); await wf.fill(''); await pg.waitForTimeout(80);
  const k11a = await E(k => ({ w: window[k].spec().w, W: window[k].scene().W }), a.kit);
  await wf.fill(''); await wf.type('99'); await pg.waitForTimeout(80);
  const k11b = await E(k => ({ w: window[k].spec().w, W: window[k].scene().W }), a.kit);
  await wf.fill('6.5'); await pg.waitForTimeout(80);
  check('K11 ' + name + ': an emptied width, and a width of 99 in, are held to what a figure can be (3–20 in)', k11a.w >= 3 && k11a.w <= 20 && k11b.w === 20 && k11b.W === 1440, JSON.stringify({ emptied: k11a, typed99: k11b }));
  const k11c = await E(k => { const kit = window[k], s = kit.spec(), o = {}; s.y.min = 100; s.y.max = 20; kit.draw(); o.inv = { n: kit.scene().yTicks.ticks.length, lo: kit.scene().yTicks.min, hi: kit.scene().yTicks.max, bad: window.__ckLabels(kit.scene()) }; s.y.min = null; s.y.max = null; s.y.major = 0.0001; kit.draw(); o.tiny = { n: kit.scene().yTicks.ticks.length, bad: window.__ckLabels(kit.scene()) }; s.y.major = null; s.title.forEach(t => t.size = 0); s.x.size = -5; s.legend.size = 'abc'; kit.draw(); o.fonts = window.__ckLabels(kit.scene()); const sc = kit.scene(); o.sizes = [s.x.size, s.legend.size]; s.title = ChartKitCore.defaults().title; s.x.size = 10; s.legend.size = 10; kit.draw(); return o; }, a.kit);
  check('K11 ' + name + ': a minimum above the maximum is ignored (the axis stays on auto), a step of 0.0001 does not make 200 labels, a font of 0 or "abc" is a readable font', k11c.inv.lo < k11c.inv.hi && k11c.inv.n <= 60 && k11c.inv.bad.length === 0 && k11c.tiny.n <= 61 && k11c.tiny.bad.length === 0 && k11c.fonts.length === 0, JSON.stringify(k11c));
  // the PNG of an out-of-range page is still a figure
  const png = await E(async k => { const kit = window[k], s = kit.spec(); s.w = 1e6; s.h = 0; kit.draw(); const sc = kit.scene(), r = await ChartKitExport.toPNG(sc, 300), b = new Uint8Array(await r.blob.arrayBuffer()), dv = new DataView(b.buffer); s.w = 6.5; s.h = 4.2; kit.draw(); return { w: dv.getUint32(16), h: dv.getUint32(20) }; }, a.kit);
  check('K11 ' + name + ': a figure of absurd size still exports a real picture (300 dpi: ' + png.w + ' × ' + png.h + ' px, not 16000 × 1)', png.w >= 900 && png.h >= 600, JSON.stringify(png));
  await E(() => window.scrollTo(0, 0));
  // K17 — the figure and its panel fit the window, at the size the room allows
  for (const [w, h] of [[1440, 900], [1280, 720]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(500);
    await E(() => window.scrollTo(0, 0));
    const shapes = [[6.5, 4.2], [4.5, 4.5], [9, 5.2], [3.4, 2.7]], bad = [];
    for (const [pw, ph] of shapes) {
      const r = await E(([k, root, pw, ph]) => { const kit = window[k], s = kit.spec(); s.w = pw; s.h = ph; kit.draw(); return new Promise(res => setTimeout(() => { const sv = document.querySelector(root + ' svg.ck-svg').getBoundingClientRect(), p = document.querySelector(root + ' .ck-panel').getBoundingClientRect(), cv = document.querySelector(root + ' .ck-canvas').getBoundingClientRect(); res({ top: Math.round(sv.top), bottom: Math.round(sv.bottom), right: Math.round(sv.right), vh: innerHeight, vw: innerWidth, panelBottom: Math.round(p.bottom), fillW: sv.width / (cv.width - 32), fillH: sv.height / (cv.height - 32) }); }, 120)); }, [a.kit, a.root, pw, ph]);
      if (r.top < 0 || r.bottom > r.vh + 1 || r.right > r.vw + 1 || r.panelBottom > r.vh + 1 || Math.max(r.fillW, r.fillH) < 0.93) bad.push(pw + '×' + ph + ' ' + JSON.stringify(r));
    }
    await E(k => { const s = window[k].spec(); s.w = 6.5; s.h = 4.2; window[k].draw(); }, a.kit);
    check('K17 ' + name + ' ' + w + '×' + h + ': the whole figure and panel are inside the window, and the figure is as large as the room allows (4 page shapes)', bad.length === 0, bad.slice(0, 2).join(' | '));
  }
  // K19 — a dose label wider than its column wraps; it never sticks out of its box (CI's font draws 0.0000693 wider than 54px)
  { const r = await E(() => { const tb = document.querySelector('.ck-tabs button[data-tab="data"]'); if (tb) tb.click(); document.querySelectorAll('.ck-chev:not(.open)').forEach(b => b.click()); const xs = [...document.querySelectorAll('.ck-dx')].filter(e => e.getBoundingClientRect().width > 0); xs.forEach(e => { e.textContent = '0.000000069300'; }); return { n: xs.length, wide: xs.filter(e => e.scrollWidth > e.clientWidth + 0.5).length }; });
    check('K19 ' + name + ': a long dose label stays inside its box (' + r.n + ' labels)', r.n > 0 && r.wide === 0, JSON.stringify(r)); }
  await pg.setViewportSize({ width: 1280, height: 800 });
  // K15 — narrow windows
  for (const [w, h] of [[900, 700], [700, 900]]) { await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(450); const ov = await E(() => [document.documentElement.scrollWidth, innerWidth]); check('K15 ' + name + ' at ' + w + ' px nothing scrolls sideways', ov[0] <= ov[1], JSON.stringify(ov)); }
  await pg.setViewportSize({ width: 1280, height: 800 });

  if (name === 'echo') {
    // K12
    await pg.click(a.root + ' .ck-tabs [data-tab="data"]');
    const k12 = await E(() => { const s = _egKit.spec(), d = egGraphDoc(), it = d.items[0], o = {}; it.points.slice(0, it.points.length - 3).forEach(p => p.reps.forEach(r => s.omit[r.id] = true)); _egKit.draw(); _egKit.select(null); o.fit = !!_egKit.scene().items[0].fit; o.status = document.querySelector('#eg-root .ck-status').textContent; o.note = document.querySelectorAll('#eg-root .ck-fitnote').length; s.omit = {}; _egKit.draw(); o.after = document.querySelector('#eg-root .ck-status').textContent; return o; });
    check('K12 echo: with too few points left the curve is not drawn and the status line says so; putting them back clears it', !k12.fit && /too few points/.test(k12.status) && k12.after === '', JSON.stringify(k12));
    // K13
    const k13 = await E(() => {
      const o = {}, n = [...document.querySelectorAll('#eg-pick span')].find(x => /^\d+ of \d+$/.test(x.textContent.trim())); if (n) { const rg = document.createRange(); rg.selectNodeContents(n); o.nLines = new Set([...rg.getClientRects()].map(r => Math.round(r.top))).size; o.nW = Math.round(n.getBoundingClientRect().width); } else { o.nLines = null; o.nW = null; }
      const keys = egRows().map(egKey); o.unique = new Set(keys).size === keys.length; o.keyHasPanel = keys[0].split('|').length === 3 && /\|\d*$/.test(keys[0]);
      egSetSel(new Set(egRows().map(egKey))); o.cap = _egSel.size; o.docItems = egGraphDoc().items.length;
      // opening different results with the same count and first compound
      egSetSel(new Set(egRows().slice(0, 3).map(egKey))); _egKit.spec().omit['x#0'] = true; const rows = egRows(); rows[2]._logec50 += 0.5; egShow(); o.reset = [_egSel.size, Object.keys(_egKit.spec().omit).length]; rows[2]._logec50 -= 0.5;
      return o;
    });
    check('K13 echo: the compound count ("6 of 63") is on one line (its class once collided with the Gradient Planner\'s 20 px round badge and wrapped to three)', k13.nLines === 1 && k13.nW >= 30, JSON.stringify({ lines: k13.nLines, width: k13.nW }));
    check('K13 echo: a figure holds at most 24 compounds, and a compound\'s key is protein, name and assay panel, unique', k13.cap === 24 && k13.docItems === 24 && k13.unique && k13.keyHasPanel, JSON.stringify(k13));
    check('K13 echo: other results with the same count and first compound start with the default choice and nothing left out', k13.reset[0] === 6 && k13.reset[1] === 0, JSON.stringify(k13.reset));
  }
  } catch (err) { check('K9-K15 ' + name + ': the checks ran to the end', false, String(err && err.message || err).split('\n')[0]); }
  e.forEach(x => appErrs.push(x));
  await c.close();
}
check('no page or console errors in the apps', appErrs.length === 0, appErrs.slice(0, 3).join(' | '));

check('no page or console errors', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close();
if (findings.length) { console.log(findings.join('\n')); console.log(`\n${findings.length} finding(s), ${passed} checks passed.`); process.exit(1); }
console.log(`ChartKit invariants: ${passed} checks passed.`);
