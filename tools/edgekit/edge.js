/* EdgeKit — edge-effect compensation from the vehicle (100 %) control wells, and nothing else.
 *
 * Why this and not a B-score / median polish: in a dose-response plate a row IS a compound's dose series, so a row or column median
 * polish removes the dose-response itself. The only wells known to have no biology are the vehicle controls, so the edge is
 * estimated from them and from nothing the compounds did.
 *
 * Model (per plate, log scale, so the effects multiply and a corner carries both of its sides):
 *     ln(control) = ln(interior level) + [top]·sT + [bottom]·sB + [left]·sL + [right]·sR + noise
 * where [side] is 1 for a well on that outer row/column. Each side is its own term (evaporation, a hot shelf or a plate lid do not
 * have to be symmetric). A side is only estimated when at least one control sits on that side and on no other (otherwise two sides
 * cannot be told apart), and the interior level only when at least two controls sit inside the outer ring. A term is kept only when
 * it is both statistically clear (two-sided t-test, p < alpha, backward elimination one term at a time) and not trivial (>= minPct).
 * Nothing is imputed: a well is divided by what the model says an interior well would read minus/plus the measured edge factor; if the
 * layout cannot separate the edge from the vehicle level, the kit says so (`why`) and changes nothing.
 *
 * What it does NOT fix, and says: an edge well that lost volume also has a higher compound concentration, which moves the potency
 * rather than scaling the signal. Dividing by a local control corrects the scale; the shift in concentration needs the edge left out.
 */
var EdgeKit = (function () {
  var SIDES = ['top', 'bottom', 'left', 'right'];
  function lnG(z) {
    var c = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnG(1 - z);
    z -= 1; var x = 0.99999999999980993; for (var i = 0; i < 8; i++) x += c[i] / (z + i + 1);
    var t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betaI(x, a, b) {
    function cf(x, a, b) {
      var c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; var h = d;
      for (var m = 1; m <= 300; m++) {
        var m2 = 2 * m, aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
        aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
        var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
      }
      return h;
    }
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lnG(a + b) - lnG(a) - lnG(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * cf(x, a, b) / a : 1 - bt * cf(1 - x, b, a) / b;
  }
  function pT2(t, df) { return betaI(df / (df + t * t), df / 2, 0.5); }
  function pF(F, d1, d2) { return F <= 0 ? 1 : !isFinite(F) ? 0 : betaI(d2 / (d2 + d1 * F), d2 / 2, d1 / 2); }
  function tCrit(df) { var lo = 0, hi = 64; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (pT2(m, df) > 0.05) lo = m; else hi = m; } return (lo + hi) / 2; }

  function rowName(r) { return r < 26 ? String.fromCharCode(65 + r) : 'A' + String.fromCharCode(65 + r - 26); }
  function sidesAt(r, c, R, C) { return { top: r === 0, bottom: r === R - 1, left: c === 0, right: c === C - 1 }; }
  function isEdge(r, c, R, C) { return r === 0 || r === R - 1 || c === 0 || c === C - 1; }
  function sideLabel(s, R, C) { return s === 'top' ? 'row ' + rowName(0) : s === 'bottom' ? 'row ' + rowName(R - 1) : s === 'left' ? 'column 1' : 'column ' + C; }
  // "A1" / "h12" → {r, c} 0-based, or null
  function wellRC(w) { var m = /^([A-Za-z]{1,2})0*(\d{1,2})$/.exec(String(w || '').trim()); if (!m) return null; var L = m[1].toUpperCase(), r = L.length === 1 ? L.charCodeAt(0) - 65 : 26 + L.charCodeAt(1) - 65; return { r: r, c: +m[2] - 1 }; }

  // Solve (X'X) b = X'y and return b and (X'X)^-1 (Gauss–Jordan on a small symmetric matrix); null when singular.
  function ols(X, y) {
    var n = X.length, p = X[0].length, A = [], i, j, k;
    for (i = 0; i < p; i++) { A.push([]); for (j = 0; j < p; j++) { var s = 0; for (k = 0; k < n; k++) s += X[k][i] * X[k][j]; A[i].push(s); } for (j = 0; j < p; j++) A[i].push(i === j ? 1 : 0); }
    for (i = 0; i < p; i++) {
      var piv = i; for (j = i + 1; j < p; j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
      if (Math.abs(A[piv][i]) < 1e-9) return null;
      var t = A[i]; A[i] = A[piv]; A[piv] = t;
      var d = A[i][i]; for (j = 0; j < 2 * p; j++) A[i][j] /= d;
      for (j = 0; j < p; j++) if (j !== i) { var f = A[j][i]; if (f) for (k = 0; k < 2 * p; k++) A[j][k] -= f * A[i][k]; }
    }
    var inv = A.map(function (row) { return row.slice(p); }), xty = [];
    for (i = 0; i < p; i++) { var s2 = 0; for (k = 0; k < n; k++) s2 += X[k][i] * y[k]; xty.push(s2); }
    var b = inv.map(function (row) { var s3 = 0; for (var q = 0; q < p; q++) s3 += row[q] * xty[q]; return s3; });
    var rss = 0; for (k = 0; k < n; k++) { var e = y[k]; for (j = 0; j < p; j++) e -= X[k][j] * b[j]; rss += e * e; }
    return { b: b, inv: inv, rss: rss, n: n, p: p };
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function cvOf(a) { if (a.length < 3) return null; var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)) / m * 100; }

  /* What a set of control positions can and cannot say about the edge, with no readings needed. pts: [{r, c}] (0-based). */
  function layout(pts, geom) {
    var R = geom.R, C = geom.C, all = pts || [], o = { ok: false, why: '', notes: [], R: R, C: C, n: all.length };
    var inner = all.filter(function (p) { return !isEdge(p.r, p.c, R, C); }), edge = all.filter(function (p) { return isEdge(p.r, p.c, R, C); });
    o.nInner = inner.length; o.nEdge = edge.length;
    var onSide = {}; SIDES.forEach(function (s) { onSide[s] = all.filter(function (p) { return sidesAt(p.r, p.c, R, C)[s]; }).length; });
    var cand = SIDES.filter(function (s) { return all.some(function (p) { var a = sidesAt(p.r, p.c, R, C); return a[s] && SIDES.every(function (q) { return q === s || !a[q]; }); }); });
    o.cand = cand; o.onSide = onSide;
    o.used = all.filter(function (p) { var a = sidesAt(p.r, p.c, R, C); return SIDES.every(function (s) { return !a[s] || cand.indexOf(s) >= 0; }); });
    if (R < 4 || C < 4) { o.why = 'The plate is too small to have an inner region.'; return o; }
    if (!all.length) { o.why = 'No control well is marked.'; return o; }
    if (inner.length < 2) {
      o.why = !inner.length ? 'Every control well is on the outer ring of the plate (' + edge.length + ' of ' + edge.length + '). A control on the edge cannot say how much the edge reads low, because there is nothing inside the plate to compare it with. Put at least 3 vehicle wells inside the plate (and keep some on the edge).'
        : 'Only one control well is inside the plate. Put at least 3 vehicle wells inside the plate (and keep some on the edge) so the edge can be told apart from noise.';
      return o;
    }
    if (!cand.length) { o.why = 'No control well sits on the edge (or only in corners), so there is nothing to measure the edge with. Keep some vehicle wells on the outer rows and columns as well as inside.'; return o; }
    var dropped = all.length - o.used.length;
    if (dropped) o.notes.push(dropped + ' control well' + (dropped > 1 ? 's' : '') + ' on a side that no other control tells apart ' + (dropped > 1 ? 'were' : 'was') + ' left out of the edge model.');
    SIDES.forEach(function (s) { if (cand.indexOf(s) < 0) o.notes.push(onSide[s] ? sideLabel(s, R, C) + ' only has controls in the corners, so it cannot be told apart from the neighbouring side: its wells are not corrected.' : sideLabel(s, R, C) + ' has no control well, so its wells are not corrected.'); });
    o.ok = true;
    return o;
  }

  /* pts: [{r, c, v, well?}] — the control wells of ONE plate with a reading (0-based). geom: {R, C}. opt: {alpha (0.05), minPct (2)}.
     Returns {ok, applied, why, notes[], terms[], factor(r,c), mu, ref(r,c), n, nInner, cvInner, cvEdge, covered(r,c), cand}.
     factor(r,c) is the multiplicative edge factor the model gives a well (1 inside the ring and wherever nothing was applied);
     ref(r,c) = mu · factor(r,c) is the value that well's reading is divided by to be 100 %. `ok:false` = the layout could not be assessed
     and nothing changes (ref is the plain mean of the control wells). */
  function fit(pts, geom, opt) {
    opt = opt || {}; var alpha = opt.alpha == null ? 0.05 : opt.alpha, minPct = opt.minPct == null ? 2 : opt.minPct, R = geom.R, C = geom.C;
    var all = (pts || []).filter(function (p) { return isFinite(p.v) && p.v > 0 && p.r >= 0 && p.c >= 0 && p.r < R && p.c < C; });
    var plain = all.length ? mean(all.map(function (p) { return p.v; })) : NaN;
    var L = layout(all, geom);
    var res = { ok: false, applied: false, why: L.why, notes: L.notes.slice(), terms: [], n: all.length, nInner: L.nInner, nEdge: L.nEdge, mu: plain, plain: plain,
      cvInner: cvOf(all.filter(function (p) { return !isEdge(p.r, p.c, R, C); }).map(function (p) { return p.v; })), cvEdge: cvOf(all.filter(function (p) { return isEdge(p.r, p.c, R, C); }).map(function (p) { return p.v; })),
      cand: L.cand, factor: function () { return 1; }, ref: function () { return plain; }, covered: function () { return true; } };
    if (!L.ok) return res;
    var cand = L.cand, onSide = L.onSide, usedPts = L.used, terms = cand.slice(), log = [], model = null, final = null;
    function build(ts) {
      var X = usedPts.map(function (p) { var a = sidesAt(p.r, p.c, R, C), row = [1]; ts.forEach(function (s) { row.push(a[s] ? 1 : 0); }); return row; });
      var y = usedPts.map(function (p) { return Math.log(p.v); });
      var m = ols(X, y); if (!m) return null; m.df = m.n - m.p; m.terms = ts; return m;
    }
    function stats(m) {
      var s2 = m.df > 0 ? m.rss / m.df : NaN;
      return m.terms.map(function (s, i) { var b = m.b[i + 1], se = Math.sqrt(Math.max(0, s2 * m.inv[i + 1][i + 1])), t = se > 0 ? b / se : (b ? Infinity : 0);
        var p = m.df > 0 ? pT2(Math.abs(t), m.df) : 1, h = tCrit(Math.max(1, m.df)) * se;
        return { side: s, label: sideLabel(s, R, C), n: onSide[s], pct: (Math.exp(b) - 1) * 100, lo: (Math.exp(b - h) - 1) * 100, hi: (Math.exp(b + h) - 1) * 100, p: p, beta: b }; });
    }
    model = build(terms);
    if (!model || model.df < 2) {
      res.why = 'Too few control wells to tell an edge effect from noise (' + usedPts.length + ' wells for ' + (cand.length + 1) + ' unknowns). A few more vehicle wells, inside and on the edge, would let it.';
      return res;
    }
    res.ok = true;
    var tested = stats(model);
    // One joint test before any single term: four terms each at p < 0.05 would call a clean plate "edgy" about one time in five.
    { var ys = usedPts.map(function (p) { return Math.log(p.v); }), my = mean(ys), rss0 = 0; ys.forEach(function (v) { rss0 += (v - my) * (v - my); });
      var q = model.p - 1, F = model.rss > 0 ? ((rss0 - model.rss) / q) / (model.rss / model.df) : (rss0 > 0 ? Infinity : 0);
      res.pJoint = pF(F, q, model.df);
      if (res.pJoint >= alpha) { terms = []; model = null; final = []; } }
    // backward elimination: drop the least convincing term until every one left is clear and not trivial
    while (model && terms.length && !final) {
      var st = stats(model), worst = -1, wv = -1;
      st.forEach(function (t, i) { var bad = t.p >= alpha || Math.abs(t.pct) < minPct, score = bad ? (t.p >= alpha ? t.p : 0.5) : -1; if (score > wv) { wv = score; worst = i; } });
      if (worst < 0 || wv < 0) { final = st; break; }
      log.push(st[worst]); terms.splice(worst, 1);
      model = terms.length ? build(terms) : null;
      if (model && model.df < 1) { model = null; terms = []; }
      if (!terms.length) final = [];
    }
    var kept = final || [];
    res.terms = cand.map(function (s) {
      var k = kept.filter(function (t) { return t.side === s; })[0];
      if (k) { k.applied = true; return k; }
      var o = Object.assign({}, tested.filter(function (t) { return t.side === s; })[0]); o.applied = false; return o;
    });
    var beta = {}; kept.forEach(function (t) { beta[t.side] = t.beta; });
    var f = function (r, c) { var a = sidesAt(r, c, R, C), v = 0; SIDES.forEach(function (s) { if (a[s] && beta[s] !== undefined) v += beta[s]; }); return Math.exp(v); };
    res.applied = kept.length > 0;
    res.factor = f;
    // the interior level: every control restated at the interior level, then averaged (with nothing applied this is the plain mean)
    var base = res.applied ? usedPts : all;
    res.mu = mean(base.map(function (p) { return p.v / f(p.r, p.c); }));
    res.ref = function (r, c) { return res.mu * f(r, c); };
    res.covered = function (r, c) { var a = sidesAt(r, c, R, C); return SIDES.every(function (s) { return !a[s] || cand.indexOf(s) >= 0; }); };
    res.nUsed = base.length;
    if (!res.applied) res.notes.push('No edge effect is distinguishable from noise with these ' + usedPts.length + ' control wells (' + L.nInner + ' inside, ' + L.nEdge + ' on the edge): nothing was changed.');
    return res;
  }
  // The compound wells an edge model could not cover and that sit on the ring (reported, never filled in).
  function ringWells(R, C) { var out = []; for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (isEdge(r, c, R, C)) out.push({ r: r, c: c }); return out; }
  function summary(res) {
    if (!res) return '';
    if (!res.ok) return res.why;
    if (!res.applied) return res.notes[res.notes.length - 1] || '';
    return res.terms.filter(function (t) { return t.applied; }).map(function (t) { return t.label + ' ' + (t.pct > 0 ? '+' : '') + t.pct.toFixed(1) + '%'; }).join(', ');
  }
  return { fit: fit, layout: layout, summary: summary, isEdge: isEdge, sidesAt: sidesAt, wellRC: wellRC, rowName: rowName, ringWells: ringWells, sideLabel: sideLabel, SIDES: SIDES, _pT2: pT2, _pF: pF };
})();
