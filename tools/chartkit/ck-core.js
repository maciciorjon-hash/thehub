/* ChartKit core — data → statistics → one scene of primitives.
 *
 * A chart is a `doc` (what the app measured) and a `spec` (how it is drawn). build(doc, spec) returns a
 * scene: a list of primitives in points (1 pt = 1/72 in) with a figure size. The same scene is drawn as
 * the interactive SVG, as the PNG (any dpi) and as the PDF, so what is on screen is what is exported.
 *
 * doc = { title:[...], xTitle, yTitle, xLog:true,
 *         items:[{ id, name, points:[{ x, label, reps:[{ id, v }] }], fit:{ fn(x)->y, label }|null }],
 *         refLine:{ y, label }|null, refit(points)->{ fn }|null }
 * x is a concentration; label is how it is written under a bar. A replicate with spec.omit[id] is left out
 * of every mean, error bar and fit — it is drawn as a ghost point so it is clear it was omitted.
 */
var ChartKitCore = (function(){
  var PALETTES = [
    { id: 'prism',   name: 'Prism',               c: ['#4b2991', '#872b4f', '#215d3a', '#4c7fc0', '#8e6fc5', '#d77bd6', '#8cbf4f', '#2f8fb0', '#6e4ea0', '#c46a2c', '#2c2c2c', '#9a9a9a'] },
    { id: 'okabe',   name: 'Colour-blind safe',   c: ['#0072b2', '#d55e00', '#009e73', '#cc79a7', '#e69f00', '#56b4e9', '#f0e442', '#000000', '#7f7f7f', '#8c564b', '#17becf', '#bcbd22'] },
    { id: 'pastel',  name: 'Pastel',              c: ['#8fb8de', '#f4b183', '#a9d18e', '#f2a3a8', '#b9a7d8', '#f5d76e', '#9fd6d2', '#d9b7a4', '#c5c5c5', '#e6a8d7', '#b7d98f', '#a0b4e8'] },
    { id: 'bold',    name: 'Bold',                c: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#a65628', '#f781bf', '#999999', '#1b9e77', '#d95f02', '#7570b3', '#66a61e'] },
    { id: 'blues',   name: 'Blues (one hue)',     c: ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#3b5b8a', '#5b7fb0', '#86a3cc', '#b4c6e0'] },
    { id: 'warm',    name: 'Warm',                c: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fdae61', '#fee090', '#e6ab02', '#a6761d', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3'] },
    { id: 'viridis', name: 'Viridis',             c: ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21908d', '#27ad81', '#5cc863', '#aadc32', '#fde725', '#355f8d', '#1fa187', '#9fda3a'] },
    { id: 'gray',    name: 'Greys (for print)',   c: ['#111111', '#3a3a3a', '#5e5e5e', '#808080', '#a0a0a0', '#bcbcbc', '#d2d2d2', '#e6e6e6', '#2a2a2a', '#4d4d4d', '#707070', '#939393'] }
  ];
  var MARKERS = ['circle', 'square', 'triangle', 'diamond'];
  var T95 = [0, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];

  function defaults(){
    return {
      v: 1, kind: 'auto',
      w: 6.5, h: 4.2,                                   // inches
      font: 'Arial',
      title: [{ text: null, size: 15, bold: true, italic: false }, { text: null, size: 15, bold: true, italic: false }, { text: null, size: 13, bold: false, italic: true }],
      xTitle: { text: null, size: 13, bold: false, italic: false }, yTitle: { text: null, size: 13, bold: false, italic: false },
      x: { size: 10, rot: 45, labels: true, order: 'given', min: null, max: null }, y: { size: 10, min: null, max: null, major: null, log: false, dec: null },
      axisW: 1.5, tick: 4, box: false, grid: false,
      palette: 'prism', colors: {}, fill: 'solid',
      bar: { width: 1, gap: 1.1, inner: 0.12, border: 1.2, shade: false },
      err: { type: 'sd', cap: 4, w: 1.2, dir: 'up' },
      pts: { show: false, size: 2.6 },
      xy: { marker: 'circle', msize: 4.5, lw: 1.8, fit: true, points: true, open: false, dash: false },
      ref: { show: true, y: null, dash: true, w: 1, label: true },
      legend: { show: true, size: 10, swatch: 11, pos: 'auto' },
      hidden: {}, omit: {}, pos: {}, margin: { l: 0, r: 0, t: 0, b: 0 },
      snap: true, grid2: false
    };
  }
  function merge(a, b){ if (!b || typeof b !== 'object') return a; Object.keys(b).forEach(function(k){ if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) && typeof b[k] === 'object' && b[k]) merge(a[k], b[k]); else a[k] = b[k]; }); return a; }
  // What a number in the spec may be. A field the person is typing in passes through every value on the way to the one
  // they mean ("" → 0 → 8, "99" on the way to "9.9"), and a spec kept in localStorage may hold anything: none of it may
  // reach the drawing as a figure 71 892 pt wide (a 16 000 × 1 px PNG) or a font of 0. null stays null (auto).
  var RANGE = { w: [3, 20], h: [2.6, 20], axisW: [0.25, 5], tick: [0, 12], 'x.size': [4, 40], 'y.size': [4, 40], 'xTitle.size': [4, 60], 'yTitle.size': [4, 60], 'legend.size': [4, 40],
    'bar.width': [0.2, 1.2], 'bar.gap': [0, 4], 'bar.inner': [0, 1], 'bar.border': [0, 5], 'err.cap': [0, 16], 'err.w': [0.25, 5], 'xy.msize': [1, 14], 'xy.lw': [0.25, 6], 'ref.w': [0.25, 5],
    'margin.l': [-40, 200], 'margin.r': [-40, 200], 'margin.t': [-40, 200], 'margin.b': [-40, 200], 'y.dec': [0, 6], 'y.major': [0, 1e6] };
  function getp(o, path){ return path.split('.').reduce(function(a, k){ return a == null ? a : a[k]; }, o); }
  function putp(o, path, v){ var ks = path.split('.'), t = o; for (var i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null || typeof t[ks[i]] !== 'object') t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
  var AUTO = { 'y.dec': 1, 'y.major': 1 };   // empty means "auto" there
  function sanitize(s){
    var d = defaults();
    Object.keys(RANGE).forEach(function(k){
      var v = getp(s, k), r = RANGE[k];
      if (AUTO[k] && (v === null || v === undefined || v === '')) { putp(s, k, null); return; }
      v = (v === null || v === undefined || v === '') ? NaN : +v;
      putp(s, k, isFinite(v) ? clamp(v, r[0], r[1]) : getp(d, k));
    });
    (s.title || []).forEach(function(t, i){ var v = +t.size; t.size = isFinite(v) ? clamp(v, 4, 60) : (d.title[i] || d.title[2]).size; });
    if (s.y.dec !== null) s.y.dec = Math.round(s.y.dec);
    return s;
  }
  function withDefaults(s){ var d = defaults(); if (s && typeof s === 'object') { merge(d, JSON.parse(JSON.stringify(s))); if (Array.isArray(s.title)) d.title = s.title.map(function(t, i){ return merge(JSON.parse(JSON.stringify(defaults().title[i] || defaults().title[2])), t); }); } return sanitize(d); }

  // ── numbers ─────────────────────────────────────────────────
  function fin(v){ return typeof v === 'number' && isFinite(v); }
  function stats(vals){
    var n = vals.length; if (!n) return { n: 0, mean: null, sd: 0, sem: 0, ci: 0, min: null, max: null };
    var m = vals.reduce(function(a, b){ return a + b; }, 0) / n, ss = vals.reduce(function(a, b){ return a + (b - m) * (b - m); }, 0), sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0, sem = n > 1 ? sd / Math.sqrt(n) : 0;
    var t = n > 1 ? (n - 1 < T95.length ? T95[n - 1] : 1.96) : 0;
    return { n: n, mean: m, sd: sd, sem: sem, ci: t * sem, min: Math.min.apply(null, vals), max: Math.max.apply(null, vals) };
  }
  function errOf(st, type){ if (st.n < 2 || type === 'none') return null; if (type === 'sem') return [st.mean - st.sem, st.mean + st.sem]; if (type === 'ci95') return [st.mean - st.ci, st.mean + st.ci]; if (type === 'range') return [st.min, st.max]; return [st.mean - st.sd, st.mean + st.sd]; }
  function niceStep(span, target){
    var raw = span / Math.max(1, target), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function linTicks(lo, hi, major, target){
    if (!(hi > lo)) hi = lo + 1;
    if (major > 0 && (hi - lo) / major > 60) major = 0;   // a step this small is 200 labels on one another: ask for a sensible one
    var step = major > 0 ? major : niceStep(hi - lo, target || 6), a = Math.ceil(lo / step - 1e-9) * step, out = [];
    for (var v = a, g = 0; v <= hi + step * 1e-6 && g < 200; v += step, g++) out.push(+(+v.toPrecision(12)));
    return { step: step, ticks: out };
  }
  function decimalsOf(step){ if (!(step > 0)) return 0; var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return Math.min(6, step % 1 === 0 ? 0 : (String(+step.toPrecision(6)).split('.')[1] || '').length || d); }
  function fmt(v, dec){
    if (!fin(v)) return '';
    if (dec !== null && dec !== undefined && dec !== '') return (+v).toFixed(dec).replace(/^-0(\.0*)?$/, function(m){ return m.slice(1); });
    var a = Math.abs(v); if (a !== 0 && (a >= 1e6 || a < 1e-3)) return (+v).toExponential(1).replace('e+', '×10^').replace('e-', '×10^-');
    return String(+(+v).toPrecision(6));
  }
  // The labels of a run of decades: all plain numbers (0.001 … 10000) or all powers of ten, never "10^-3, 0.01, 0.1".
  function decadeLabels(exps){
    var plain = exps.every(function(e){ return e >= -3 && e <= 4; });
    return exps.map(function(e){ return plain ? String(+Math.pow(10, e).toPrecision(6)) : '10^' + e; });
  }
  function fmtX(v){ if (!fin(v)) return ''; var a = Math.abs(v); if (a >= 1e5 || (a > 0 && a < 1e-2)) return '10^' + Math.round(Math.log10(a)); return String(+(+v).toPrecision(3)); }

  // ── colour ──────────────────────────────────────────────────
  function rgb(hex){ var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return [0, 0, 0]; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(c){ return '#' + c.map(function(x){ x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function mix(h, to, a){ var c = rgb(h), d = rgb(to); return hex([c[0] + (d[0] - c[0]) * a, c[1] + (d[1] - c[1]) * a, c[2] + (d[2] - c[2]) * a]); }
  function lighten(h, a){ return mix(h, '#ffffff', a); }
  function darken(h, a){ return mix(h, '#000000', a); }

  // ── text measuring (Arial ≈ Helvetica, which is what the PDF uses) ──
  var _mc = null;
  function measure(text, size, bold, italic, font){
    text = String(text == null ? '' : text); if (!text) return 0;
    try {
      if (!_mc) _mc = document.createElement('canvas').getContext('2d');
      _mc.font = (italic ? 'italic ' : '') + (bold ? 'bold ' : '') + size + 'px ' + (font || 'Arial') + ', Helvetica, sans-serif';
      return _mc.measureText(text.replace(/\^/g, '')).width;
    } catch (e) { return text.length * size * 0.55; }
  }

  function itemColor(spec, it, idx){
    var pal = PALETTES.filter(function(p){ return p.id === spec.palette; })[0] || PALETTES[0];
    return spec.colors[it.id] || pal.c[idx % pal.c.length];
  }

  // ── the data the chart shows, with omitted replicates left out ──
  function model(doc, spec){
    var items = [];
    (doc.items || []).forEach(function(it, idx){
      var col = itemColor(spec, it, idx), pts = (it.points || []).map(function(p){
        var kept = [], dropped = [];
        (p.reps || []).forEach(function(r){ if (!fin(r.v)) return; (spec.omit[r.id] ? dropped : kept).push(r); });
        var st = stats(kept.map(function(r){ return r.v; }));
        return { x: p.x, label: p.label != null ? p.label : fmtX(p.x), kept: kept, dropped: dropped, st: st };
      });
      if (spec.x.order === 'asc') pts.sort(function(a, b){ return a.x - b.x; }); else if (spec.x.order === 'desc') pts.sort(function(a, b){ return b.x - a.x; });
      var fit = null, refitFailed = false;
      if (it.fit || it.refit !== false) {
        var anyOmit = (it.points || []).some(function(p){ return (p.reps || []).some(function(r){ return spec.omit[r.id]; }); });
        if (anyOmit && doc.refit) { try { fit = doc.refit(it, pts.filter(function(p){ return p.st.n; }).map(function(p){ return { x: p.x, y: p.st.mean, sd: p.st.sd, n: p.st.n, reps: p.kept.map(function(r){ return r.v; }) }; })); } catch (e) { fit = null; } refitFailed = !fit && !!it.fit; }
        else fit = it.fit || null;
      }
      items.push({ id: it.id, name: it.name, idx: idx, color: col, pts: pts, fit: fit, refitFailed: refitFailed, hidden: !!spec.hidden[it.id] });
    });
    return items;
  }

  function fitText(text, size, maxW, F){
    text = String(text == null ? '' : text); if (measure(text, size, false, false, F) <= maxW) return text;
    var lo = 0, hi = text.length;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (measure(text.slice(0, mid) + '\u2026', size, false, false, F) <= maxW) lo = mid; else hi = mid - 1; }
    return text.slice(0, lo) + '\u2026';
  }
  // The legend is a block at the right of the plot. It must stay inside the figure whatever it holds: a long list goes into
  // columns, then smaller, then each name is cut short (…), so 6 compounds are a column and 40 are a small block, not a
  // legend that runs off the page and squeezes the plot to nothing.
  function legendLayout(names, kind, spec, W, H, F){
    var n = names.length, swW = kind === 'bars' ? spec.legend.swatch : spec.legend.swatch * 1.4, off = swW + 8, gap = 14, cap = Math.max(60, W * 0.4), availH = Math.max(40, H - 20);
    var ls = spec.legend.size, maxTxt = Math.max(40, W * 0.3), res = null;
    for (var pass = 0; pass < 16; pass++) {
      var line = ls * (n > 12 ? 1.45 : 1.7), rowsMax = Math.max(1, Math.floor(availH / line)), rows = Math.min(n, rowsMax), cols = Math.ceil(n / rows); rows = Math.ceil(n / cols);
      var texts = names.map(function(nm){ return fitText(nm, ls, maxTxt, F); }), colW = [], c, r, i;
      for (c = 0; c < cols; c++) { var m = 0; for (r = 0; r < rows; r++) { i = c * rows + r; if (i < n) m = Math.max(m, measure(texts[i], ls, false, false, F)); } colW.push(off + m); }
      var w = colW.reduce(function(a, b){ return a + b; }, 0) + gap * (cols - 1);
      res = { ls: ls, line: line, rows: rows, cols: cols, colW: colW, w: w, h: rows * line, texts: texts, off: off, gap: gap };
      if (w <= cap) break;
      if (ls > 6.5) ls = Math.max(6.5, ls - 1); else if (maxTxt > 30) maxTxt = Math.max(30, maxTxt - 15); else break;
    }
    // still too wide (well over a hundred names): keep the columns that fit and say how many are not listed
    if (res.w > cap && res.cols > 1) {
      var cols2 = res.cols, rows2 = res.rows, colW2;
      function widths(cn){ var o = [], c, r, i; for (c = 0; c < cn; c++) { var m = 0; for (r = 0; r < rows2; r++) { i = c * rows2 + r; if (i < n) m = Math.max(m, measure(res.texts[i], res.ls, false, false, F)); } o.push(off + m); } return o; }
      do { cols2--; colW2 = widths(cols2); } while (cols2 > 1 && colW2.reduce(function(a, b){ return a + b; }, 0) + gap * (cols2 - 1) > cap);
      res.cols = cols2; res.colW = colW2; res.w = colW2.reduce(function(a, b){ return a + b; }, 0) + gap * (cols2 - 1);
      var keep = rows2 * cols2; if (keep < n) { res.shown = keep; res.more = n - keep + 1; res.texts = res.texts.slice(0, keep); res.texts[keep - 1] = '+ ' + res.more + ' more'; res.colW = widths(cols2); res.w = res.colW.reduce(function(a, b){ return a + b; }, 0) + gap * (cols2 - 1); }
    }
    res.cells = []; var lim = res.shown !== undefined ? res.shown : n;
    for (var q = 0; q < lim; q++) { var qc = Math.floor(q / res.rows), qx = 0; for (var z = 0; z < qc; z++) qx += res.colW[z] + res.gap; res.cells.push({ i: q, dx: qx, row: q % res.rows }); }
    return res;
  }
  // The legend under the plot: entries run along rows, as many as fit the width, and the whole block is centred.
  function legendFlow(names, kind, spec, W, F){
    var swW = kind === 'bars' ? spec.legend.swatch : spec.legend.swatch * 1.4, off = swW + 8, gap = 14, availW = Math.max(60, W - 20), ls = spec.legend.size, res = null;
    for (var pass = 0; pass < 16; pass++) {
      var texts = names.map(function(nm){ return fitText(nm, ls, availW - off, F); }), line = ls * 1.55, rows = [], cur = [], curW = 0;
      texts.forEach(function(t, i){ var w = off + measure(t, ls, false, false, F); if (cur.length && curW + gap + w > availW) { rows.push(cur); cur = []; curW = 0; } cur.push({ i: i, w: w, dx: curW + (cur.length ? gap : 0) }); curW += w + (cur.length > 1 ? gap : 0); });
      if (cur.length) rows.push(cur);
      var wmax = 0; rows.forEach(function(r){ var e = r[r.length - 1]; wmax = Math.max(wmax, e.dx + e.w); });
      var cells = []; rows.forEach(function(r, ri){ r.forEach(function(e){ cells.push({ i: e.i, dx: e.dx, row: ri }); }); });
      res = { ls: ls, line: line, w: wmax, h: rows.length * line, texts: texts, off: off, gap: gap, cells: cells, rows: rows.length };
      if (rows.length <= 3 || ls <= 6.5) break;
      ls = Math.max(6.5, ls - 1);
    }
    return res;
  }

  // ── the scene ───────────────────────────────────────────────
  function build(doc, specIn){
    var spec = withDefaults(specIn), kind = spec.kind === 'auto' ? autoKind(doc, spec) : spec.kind;
    var W = spec.w * 72, H = spec.h * 72, prims = [], els = {}, F = spec.font || 'Arial';
    var items = model(doc, spec), vis = items.filter(function(i){ return !i.hidden; });
    var pos = function(id){ return spec.pos[id] || { dx: 0, dy: 0 }; };
    function T(id, text, x, y, size, o){ o = o || {}; var p = pos(id); return { t: 'text', el: id, text: text, x: x + p.dx, y: y + p.dy, size: size, bold: !!o.bold, italic: !!o.italic, anchor: o.anchor || 'start', rot: o.rot || 0, fill: o.fill || '#000000', font: F, drag: o.drag !== false, w: measure(text, size, o.bold, o.italic, F) }; }

    // titles
    var titles = [], tTop = 10;
    spec.title.forEach(function(t, i){ var text = t.text === null ? (doc.title && doc.title[i]) || '' : t.text; if (String(text).trim()) titles.push({ i: i, text: String(text), t: t }); });
    var titleH = titles.reduce(function(a, x){ return a + x.t.size * 1.25; }, 0);
    // axis titles
    var xt = spec.xTitle.text === null ? (doc.xTitle || '') : spec.xTitle.text, yt = spec.yTitle.text === null ? (doc.yTitle || '') : spec.yTitle.text;
    var yTitleW = yt ? spec.yTitle.size * 1.5 : 0, xTitleH = xt ? spec.xTitle.size * 1.6 : 0;

    // y scale
    var lo = Infinity, hi = -Infinity;
    function take(v){ if (fin(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    vis.forEach(function(it){ it.pts.forEach(function(p){
      if (!p.st.n) return; take(p.st.mean); var e = errOf(p.st, spec.err.type); if (e) { take(e[0]); take(e[1]); }
      if (spec.pts.show || (kind === 'xy' && spec.xy.points)) p.kept.forEach(function(r){ take(r.v); });
    }); if (kind === 'xy' && spec.xy.fit && it.fit && it.fit.fn) { var xs = it.pts.map(function(p){ return p.x; }).filter(function(x){ return x > 0; }); if (xs.length) { var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs); for (var k = 0; k <= 30; k++) take(it.fit.fn(a * Math.pow(b / a, k / 30))); } } });
    var refY = spec.ref.show ? (spec.ref.y !== null && spec.ref.y !== undefined && spec.ref.y !== '' ? +spec.ref.y : (doc.refLine ? doc.refLine.y : null)) : null;
    if (fin(refY)) take(refY);
    if (!fin(lo)) { lo = 0; hi = 1; }
    if (kind === 'bars' && lo > 0) lo = 0;
    var yMin = fin(spec.y.min) ? +spec.y.min : null, yMax = fin(spec.y.max) ? +spec.y.max : null, yTicks;
    if (yMin !== null && yMax !== null && yMin >= yMax) { yMin = null; yMax = null; }   // a range that is not one: the axis stays on auto
    if (spec.y.log) {
      var l0 = Math.max(1e-12, yMin !== null ? yMin : lo * 0.8), l1 = yMax !== null ? yMax : hi * 1.25;
      yTicks = { step: 0, ticks: [], min: Math.pow(10, Math.floor(Math.log10(l0))), max: Math.pow(10, Math.ceil(Math.log10(l1))) };
      for (var q = Math.log10(yTicks.min); q <= Math.log10(yTicks.max) + 1e-9; q++) yTicks.ticks.push(Math.pow(10, q));
    } else {
      var pad = (hi - lo) * 0.04 || 1, a0 = yMin !== null ? yMin : (lo < 0 ? lo - pad : (kind === 'bars' ? 0 : lo - pad)), a1 = yMax !== null ? yMax : hi + pad;
      if (a1 <= a0) { if (yMax !== null && yMin === null) a0 = a1 - Math.max(hi - lo, 1); else a1 = a0 + Math.max(hi - lo, 1); }   // one bound set past the data: the other follows it
      var tk = linTicks(a0, a1, +spec.y.major || 0, 6);
      if (yMin === null) a0 = Math.min(a0, tk.ticks.length ? tk.ticks[0] : a0); if (yMax === null) a1 = Math.max(a1, tk.ticks.length ? tk.ticks[tk.ticks.length - 1] : a1);
      if (yMax === null && tk.ticks.length && a1 > tk.ticks[tk.ticks.length - 1] + tk.step * 0.02) a1 = tk.ticks[tk.ticks.length - 1] + (a1 > tk.ticks[tk.ticks.length - 1] + tk.step * 0.5 ? tk.step : 0);
      tk = linTicks(a0, a1, +spec.y.major || tk.step, 6);
      yTicks = { step: tk.step, ticks: tk.ticks, min: a0, max: a1 };
    }
    var yDec = spec.y.dec !== null && spec.y.dec !== undefined && spec.y.dec !== '' ? +spec.y.dec : decimalsOf(yTicks.step);
    var yLabels = spec.y.log ? decadeLabels(yTicks.ticks.map(function(v){ return Math.round(Math.log10(v)); })) : yTicks.ticks.map(function(v){ return fmt(v, yDec); });
    var yLabW = Math.max.apply(null, yLabels.map(function(l){ return measure(l, spec.y.size, false, false, F); }).concat([0]));

    // legend
    // x labels height
    var nBarsMax = Math.max.apply(null, vis.map(function(i){ return i.pts.length; }).concat([1]));
    var xLabH = 0;
    if (kind === 'bars' && spec.x.labels) { var lw = Math.max.apply(null, vis.reduce(function(a, i){ return a.concat(i.pts.map(function(p){ return measure(p.label, spec.x.size, false, false, F); })); }, []).concat([0])); xLabH = Math.abs(spec.x.rot) >= 80 ? lw + 6 : spec.x.rot ? lw * Math.sin(Math.abs(spec.x.rot) * Math.PI / 180) + spec.x.size * Math.cos(Math.abs(spec.x.rot) * Math.PI / 180) + 4 : spec.x.size + 4; }
    else if (kind === 'xy') xLabH = spec.x.size + 6;

    var legItems = vis.slice(), legW = 0, legH = 0, LG = null, legBelow = false;
    if (spec.legend.show && legItems.length) {
      var names = legItems.map(function(i){ return i.name; }), right = legendLayout(names, kind, spec, W, H, F), below = null, mode = spec.legend.pos || 'auto';
      // At the right of the plot while the plot keeps at least half the figure; on a narrow figure (a one-column page) the legend goes under it.
      var plotIfRight = W - (12 + yTitleW + yLabW + spec.tick + 6 + spec.margin.l) - (14 + right.w + 22) - spec.margin.r;
      if (mode === 'below' || (mode === 'auto' && plotIfRight < Math.max(110, W * 0.5))) {
        below = legendFlow(names, kind, spec, W, F);
        if (mode === 'auto') {   // keep whichever leaves the plot more room
          var pH0 = H - (tTop + titleH + 14 + spec.margin.t) - (10 + xTitleH + xLabH + spec.tick + 4 + spec.margin.b), pW0 = W - (12 + yTitleW + yLabW + spec.tick + 6 + spec.margin.l) - 14 - spec.margin.r;
          if (Math.max(60, pW0) * Math.max(50, pH0 - below.h - 8) <= Math.max(60, plotIfRight) * Math.max(50, pH0)) below = null;
        }
      }
      LG = below || right; legBelow = !!below; legW = LG.w; legH = LG.h;
    }


    var M = spec.margin, pL = 12 + yTitleW + yLabW + spec.tick + 6 + M.l, pR = 14 + (legW && !legBelow && !spec.pos.legend ? legW + 22 : (legW && !legBelow ? 14 : 0)) + M.r, pT = tTop + titleH + 14 + M.t, legRes = legBelow && !spec.pos.legend ? legH + 8 : 0, pB = 10 + xTitleH + xLabH + spec.tick + 4 + legRes + M.b;
    // A page too small for its own labels does not get labels on top of one another: the figure grows to what they need, and says so.
    var grew = null, W0 = W, H0 = H, ysz = spec.yTitle.size, minPH = 60;
    if (yt) {   // the Y title runs up the plot: set smaller (to 8 pt) when it is longer than the plot is high, and the plot is made high enough for what is left
      var yl = measure(yt, ysz, spec.yTitle.bold, spec.yTitle.italic, F), ph0 = H - pT - pB;
      if (yl > ph0 && ph0 > 0) { ysz = Math.max(Math.min(8, ysz), ysz * ph0 / yl); yl = measure(yt, ysz, spec.yTitle.bold, spec.yTitle.italic, F); }
      minPH = Math.max(60, yl + 4);
    }
    if (W - pL - pR < 80) W = pL + pR + 80;
    if (H - pT - pB < minPH) H = pT + pB + minPH;
    if (W > W0 + 0.5 || H > H0 + 0.5) grew = { w: W / 72, h: H / 72, askedW: W0 / 72, askedH: H0 / 72 };
    var plot = { x: pL, y: pT, w: W - pL - pR, h: H - pT - pB };
    els.plot = plot;
    function yPx(v){ if (spec.y.log) { var a = Math.log10(yTicks.min), b = Math.log10(yTicks.max); return plot.y + plot.h - (Math.log10(Math.max(v, yTicks.min)) - a) / (b - a) * plot.h; } return plot.y + plot.h - (v - yTicks.min) / ((yTicks.max - yTicks.min) || 1) * plot.h; }

    // grid and reference
    if (spec.grid) yTicks.ticks.forEach(function(v){ prims.push({ t: 'line', x1: plot.x, y1: yPx(v), x2: plot.x + plot.w, y2: yPx(v), stroke: '#d9d9d9', sw: 0.6 }); });
    var data = [];
    // x geometry
    var xPx, xTickList = [];
    if (kind === 'bars') {
      var nG = Math.max(1, vis.length), nb = nBarsMax, B = spec.bar;
      // total width = nG*(nb*bw + (nb-1)*inner*bw) + (nG+1)*gap*bw
      var unit = plot.w / (nG * (nb + (nb - 1) * B.inner) + (nG + 1) * B.gap);
      var slot = unit * (nb + (nb - 1) * B.inner), gapW = unit * B.gap, bwReal = unit * Math.max(0.2, Math.min(1.2, B.width));
      vis.forEach(function(it, gi){
        var gx = plot.x + gapW * (gi + 1) + slot * gi, ink = it.color;
        var fillC = spec.fill === 'outline' ? '#ffffff' : spec.fill === 'tint' ? lighten(ink, 0.55) : ink, edge = spec.fill === 'solid' ? darken(ink, 0.35) : ink;
        it.pts.forEach(function(p, bi){
          if (!p.st.n) return;
          var step = unit * (1 + B.inner), cx = gx + bi * step + unit / 2, x0 = cx - bwReal / 2, y0 = yPx(Math.max(yTicks.min, Math.min(0, yTicks.max))), y1 = yPx(p.st.mean);
          // shaded: the highest concentration is the compound's own colour, each one below it lighter
          var fillB = B.shade && spec.fill !== 'outline' && it.pts.length > 1 ? lighten(fillC, 0.55 * bi / (it.pts.length - 1)) : fillC;
          data.push({ t: 'rect', el: 'bar:' + it.id, x: Math.min(x0, x0 + bwReal), y: Math.min(y0, y1), w: bwReal, h: Math.abs(y1 - y0), fill: fillB, stroke: edge, sw: B.border });
          var e = errOf(p.st, spec.err.type);
          if (e) { var up = yPx(e[1]), dn = yPx(spec.err.dir === 'up' ? p.st.mean : e[0]), c = spec.err.cap / 2, ec = darken(ink, spec.fill === 'outline' ? 0 : 0.2);
            data.push({ t: 'path', pts: [[cx, dn], [cx, up]], stroke: ec, sw: spec.err.w, el: 'bar:' + it.id }, { t: 'path', pts: [[cx - c, up], [cx + c, up]], stroke: ec, sw: spec.err.w, el: 'bar:' + it.id });
            if (spec.err.dir === 'both') data.push({ t: 'path', pts: [[cx - c, dn], [cx + c, dn]], stroke: ec, sw: spec.err.w, el: 'bar:' + it.id }); }
          var all = (spec.pts.show ? p.kept.map(function(r){ return { v: r.v, o: 0 }; }) : []).concat(p.dropped.map(function(r){ return { v: r.v, o: 1 }; }));
          all.forEach(function(r, ri){ var jx = cx + ((ri % 5) - 2) * Math.min(3, bwReal / 7); data.push({ t: 'circle', cx: jx, cy: yPx(r.v), r: spec.pts.size * (r.o ? 0.85 : 1), fill: r.o ? 'none' : '#ffffff', stroke: r.o ? '#9a9a9a' : darken(ink, 0.35), sw: r.o ? 0.8 : 1, dash: r.o ? '2 1.5' : '', el: 'bar:' + it.id }); });
          if (spec.x.labels) xTickList.push({ x: cx, label: p.label, bi: bi });
        });
      });
      // so many bars that their labels would sit on one another: every k-th label along the axis is written (the ticks all stay)
      if (spec.x.labels && xTickList.length > 1) {
        var rotA = Math.abs(spec.x.rot), szx = spec.x.size, lwMax = Math.max.apply(null, xTickList.map(function(t){ return measure(t.label, szx, false, false, F); })), needX = rotA >= 80 ? szx * 1.15 : rotA ? szx * 1.45 : lwMax + 4, gapX = Infinity, sx = xTickList.map(function(t){ return t.x; }).sort(function(a, b){ return a - b; });
        for (var gi2 = 1; gi2 < sx.length; gi2++) if (sx[gi2] - sx[gi2 - 1] > 0.01) gapX = Math.min(gapX, sx[gi2] - sx[gi2 - 1]);
        var kx = isFinite(gapX) ? Math.max(1, Math.ceil(needX / gapX)) : 1;
        if (kx > 1) xTickList.forEach(function(t, ti){ if (ti % kx) t.label = ''; });
      }
    } else {
      var xv = []; vis.forEach(function(it){ it.pts.forEach(function(p){ if (p.x > 0) xv.push(p.x); }); });
      var xlo = xv.length ? Math.min.apply(null, xv) : 1, xhi = xv.length ? Math.max.apply(null, xv) : 10;
      var d0 = fin(spec.x.min) && +spec.x.min > 0 ? Math.log10(+spec.x.min) : Math.floor(Math.log10(xlo) - 0.35), d1 = fin(spec.x.max) && +spec.x.max > 0 ? Math.log10(+spec.x.max) : Math.ceil(Math.log10(xhi) + 0.35);
      if (d1 <= d0) d1 = d0 + 1;
      xPx = function(x){ return plot.x + (Math.log10(Math.max(x, 1e-30)) - d0) / (d1 - d0) * plot.w; };
      var exps = []; for (var e0 = Math.ceil(d0 - 1e-9); e0 <= d1 + 1e-9; e0++) exps.push(e0);
      var dl = decadeLabels(exps); exps.forEach(function(e, i){ xTickList.push({ x: xPx(Math.pow(10, e)), label: dl[i], major: true }); });
      for (var e1 = Math.floor(d0); e1 < d1; e1++) for (var m2 = 2; m2 < 10; m2++) { var vv = m2 * Math.pow(10, e1); if (Math.log10(vv) > d0 && Math.log10(vv) < d1) xTickList.push({ x: xPx(vv), label: '', minor: true }); }
      vis.forEach(function(it){
        var ink = it.color, pts = it.pts.filter(function(p){ return p.x > 0 && p.st.n; });
        if (spec.xy.fit && it.fit && it.fit.fn && pts.length > 1) {
          var a = Math.pow(10, d0), b = Math.pow(10, d1), poly = [];
          for (var k = 0; k <= 160; k++) { var xx = a * Math.pow(b / a, k / 160), yy = it.fit.fn(xx); if (fin(yy)) poly.push([xPx(xx), yPx(yy)]); }
          data.push({ t: 'path', pts: poly, stroke: ink, sw: spec.xy.lw, dash: spec.xy.dash ? '5 3' : '', el: 'fit:' + it.id, clip: true });
        }
        if (spec.xy.points) pts.forEach(function(p){
          var cx = xPx(p.x), e = errOf(p.st, spec.err.type);
          if (e) { var c = spec.err.cap / 2; data.push({ t: 'path', pts: [[cx, yPx(e[0])], [cx, yPx(e[1])]], stroke: ink, sw: spec.err.w, el: 'pt:' + it.id }, { t: 'path', pts: [[cx - c, yPx(e[0])], [cx + c, yPx(e[0])]], stroke: ink, sw: spec.err.w, el: 'pt:' + it.id }, { t: 'path', pts: [[cx - c, yPx(e[1])], [cx + c, yPx(e[1])]], stroke: ink, sw: spec.err.w, el: 'pt:' + it.id }); }
          p.dropped.forEach(function(r){ data.push({ t: 'circle', cx: cx, cy: yPx(r.v), r: spec.xy.msize * 0.6, fill: 'none', stroke: '#9a9a9a', sw: 0.8, dash: '2 1.5', el: 'pt:' + it.id }); });
          if (spec.pts.show) p.kept.forEach(function(r){ data.push({ t: 'circle', cx: cx + 4, cy: yPx(r.v), r: spec.pts.size * 0.8, fill: lighten(ink, 0.4), stroke: ink, sw: 0.6, el: 'pt:' + it.id }); });
          var mk = MARKERS[(it.idx % MARKERS.length)], mkType = spec.xy.marker === 'auto' ? mk : spec.xy.marker;
          data.push({ t: 'marker', type: mkType, cx: cx, cy: yPx(p.st.mean), r: spec.xy.msize, fill: spec.xy.open ? '#ffffff' : ink, stroke: ink, sw: 1.2, el: 'pt:' + it.id });
        });
      });
    }
    // reference line (under the data)
    if (fin(refY) && refY >= yTicks.min && refY <= yTicks.max) {
      prims.push({ t: 'line', el: 'ref', x1: plot.x, y1: yPx(refY), x2: plot.x + plot.w, y2: yPx(refY), stroke: '#000000', sw: spec.ref.w, dash: spec.ref.dash ? '1.5 3' : '' });
    }
    data.forEach(function(d){ prims.push(d); });

    // axes
    var ax = spec.axisW;
    prims.push({ t: 'line', el: 'axisY', x1: plot.x, y1: plot.y - ax / 2, x2: plot.x, y2: plot.y + plot.h + ax / 2, stroke: '#000000', sw: ax, cap: 'square' });
    prims.push({ t: 'line', el: 'axisX', x1: plot.x - ax / 2, y1: plot.y + plot.h, x2: plot.x + plot.w + ax / 2, y2: plot.y + plot.h, stroke: '#000000', sw: ax });
    if (spec.box) { prims.push({ t: 'line', x1: plot.x, y1: plot.y, x2: plot.x + plot.w, y2: plot.y, stroke: '#000000', sw: ax }, { t: 'line', x1: plot.x + plot.w, y1: plot.y, x2: plot.x + plot.w, y2: plot.y + plot.h, stroke: '#000000', sw: ax }); }
    yTicks.ticks.forEach(function(v, i){
      var y = yPx(v); prims.push({ t: 'line', x1: plot.x - spec.tick, y1: y, x2: plot.x, y2: y, stroke: '#000000', sw: ax });
      prims.push(T('yTick' + i, yLabels[i], plot.x - spec.tick - 4, y + spec.y.size * 0.35, spec.y.size, { anchor: 'end', drag: false }));
    });
    xTickList.forEach(function(tk, i){
      var yb = plot.y + plot.h, len = tk.minor ? spec.tick * 0.55 : spec.tick;
      prims.push({ t: 'line', x1: tk.x, y1: yb, x2: tk.x, y2: yb + len, stroke: '#000000', sw: ax });
      if (tk.label) {
        if (kind === 'bars' && spec.x.rot) { var rot = -Math.abs(spec.x.rot); prims.push(T('xTick' + i, tk.label, tk.x + 2, yb + spec.tick + 4 + spec.x.size * 0.6, spec.x.size, { anchor: 'end', rot: rot, drag: false })); }
        else prims.push(T('xTick' + i, tk.label, tk.x, yb + spec.tick + 3 + spec.x.size * 0.85, spec.x.size, { anchor: 'middle', drag: false }));
      }
    });
    // titles
    var ty = tTop + 2;
    // a title is centred on the plot, but never runs off the figure: it is moved in, and set smaller if it is wider than the page
    titles.forEach(function(t){
      var sz = t.t.size, w0 = measure(t.text, sz, t.t.bold, t.t.italic, F); if (w0 > W - 16) { sz = Math.max(6, sz * (W - 16) / w0); w0 = measure(t.text, sz, t.t.bold, t.t.italic, F); }
      var cx = clamp(plot.x + plot.w / 2, 8 + w0 / 2, Math.max(8 + w0 / 2, W - 8 - w0 / 2));
      ty += sz * 1.2; prims.push(T('title' + t.i, t.text, cx, ty, sz, { anchor: 'middle', bold: t.t.bold, italic: t.t.italic })); ty += sz * 0.05;
    });
    if (xt) { var xsz = spec.xTitle.size, xw = measure(xt, xsz, spec.xTitle.bold, spec.xTitle.italic, F); if (xw > W - 16) { xsz = Math.max(6, xsz * (W - 16) / xw); xw = measure(xt, xsz, spec.xTitle.bold, spec.xTitle.italic, F); } prims.push(T('xTitle', xt, clamp(plot.x + plot.w / 2, 8 + xw / 2, Math.max(8 + xw / 2, W - 8 - xw / 2)), H - 10 - legRes - xsz * 0.2, xsz, { anchor: 'middle', bold: spec.xTitle.bold, italic: spec.xTitle.italic })); }
    if (yt) prims.push(T('yTitle', yt, 14 + ysz * 0.35, plot.y + plot.h / 2, ysz, { anchor: 'middle', rot: -90, bold: spec.yTitle.bold, italic: spec.yTitle.italic }));
    // legend
    if (LG) {
      var lp = pos('legend'), ls2 = LG.ls, sw = spec.legend.swatch;
      var lx0 = legBelow ? Math.max(8, (W - legW) / 2) + lp.dx : plot.x + plot.w + 22 + lp.dx, ly0 = (legBelow ? H - 8 - legH : clamp(plot.y + plot.h / 2 - legH / 2, 8, Math.max(8, H - 8 - legH))) + lp.dy;
      var g = { t: 'group', el: 'legend', x: lx0, y: ly0, w: legW, h: legH, kids: [] };
      LG.cells.forEach(function(cell){
        var i = cell.i, it = legItems[i], lxc = lx0 + cell.dx, cy = ly0 + cell.row * LG.line + ls2 * 0.85, ink = it.color;
        var fillC = spec.fill === 'outline' ? '#ffffff' : spec.fill === 'tint' ? lighten(ink, 0.55) : ink, edge = spec.fill === 'solid' ? darken(ink, 0.35) : ink;
        var isMore = LG.more && i === LG.shown - 1;
        if (isMore) { /* "+ N more" has no swatch */ }
        else if (kind === 'bars') g.kids.push({ t: 'rect', el: 'leg:' + it.id, x: lxc, y: cy - sw / 2, w: sw, h: sw * 0.78, fill: fillC, stroke: edge, sw: 1.2 });
        else { g.kids.push({ t: 'line', x1: lxc, y1: cy, x2: lxc + sw * 1.4, y2: cy, stroke: ink, sw: spec.xy.lw, el: 'leg:' + it.id }); g.kids.push({ t: 'marker', type: spec.xy.marker === 'auto' ? MARKERS[it.idx % MARKERS.length] : spec.xy.marker, cx: lxc + sw * 0.7, cy: cy, r: spec.xy.msize * 0.8, fill: spec.xy.open ? '#ffffff' : ink, stroke: ink, sw: 1, el: 'leg:' + it.id }); }
        g.kids.push({ t: 'text', el: isMore ? undefined : 'leg:' + it.id, text: LG.texts[i], x: lxc + LG.off, y: cy + ls2 * 0.35, size: ls2, bold: false, italic: false, anchor: 'start', rot: 0, fill: '#000000', font: F, drag: false, w: measure(LG.texts[i], ls2, false, false, F) });
      });
      prims.push(g);
    }
    return { W: W, H: H, prims: prims, plot: plot, kind: kind, font: F, clip: { x: plot.x, y: plot.y - 2, w: plot.w, h: plot.h + 4 }, items: items, yTicks: yTicks, titles: titles.length, grew: grew };
  }
  function autoKind(doc, spec){
    var vis = (doc.items || []).filter(function(i){ return !spec.hidden[i.id]; });
    if (!vis.length) return 'xy';
    return vis.every(function(i){ return (i.points || []).length < 4; }) ? 'bars' : 'xy';
  }

  return { build: build, defaults: defaults, withDefaults: withDefaults, sanitize: sanitize, RANGE: RANGE, decadeLabels: decadeLabels, PALETTES: PALETTES, MARKERS: MARKERS, autoKind: autoKind, model: model, stats: stats, measure: measure, lighten: lighten, darken: darken, rgb: rgb, hex: hex, fin: fin, itemColor: itemColor, merge: merge };
})();
