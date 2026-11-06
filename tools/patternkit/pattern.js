/* PatternKit — what do the compounds that behave alike have in common? (Echo Dose Response, Patterns view.)
   Pure functions, no DOM. A screen from a chemistry plate names its compounds by where they sat in it ("projectX_A1"), so a pattern is
   either about the NAME (the family GX), the SOURCE (a row, a column, the edge of that plate) or the DESTINATION (the assay plate, a row,
   a column). Each curve is one item: { id, hook, nd, dmax, pdc50, plate, dRow, dCol } — a missing value is null, never 0.
   Rules, the same everywhere:
   - every group of at least minGroup compounds is tested against the rest of its own scope (a source position against the rest of ITS plate,
     everything else against all compounds); binary traits with Fisher's exact test (two-sided), numbers with Mann-Whitney (ties corrected);
   - all tests of one run are corrected together (Benjamini-Hochberg), so looking at many groups does not manufacture patterns;
   - a finding must also be large enough to matter (a difference of at least minShare in a share, or a rank-biserial of at least minRank);
   - a finding says whether its compounds ALSO share a place on the other side (source against destination) and what the DMSO wells there
     read: DMSO is the same everywhere, so a destination location where DMSO is off is a plate effect, and one where it is clean is not. */
var PatternKit = (function () {
  function fin(v) { return v != null && v !== '' && isFinite(v); }
  // ---- natural order: A2 before A12 ------------------------------------------------------------------------------------------------------------
  function natCmp(a, b) {
    var x = String(a).toLowerCase().match(/\d+|\D+/g) || [], y = String(b).toLowerCase().match(/\d+|\D+/g) || [];
    for (var i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] === y[i]) continue;
      var nx = /^\d/.test(x[i]), ny = /^\d/.test(y[i]);
      if (nx && ny) { var d = +x[i] - +y[i]; if (d) return d; } else return x[i] < y[i] ? -1 : 1;
    }
    return x.length - y.length;
  }
  // ---- the name --------------------------------------------------------------------------------------------------------------------------------
  // "projectX_A1" -> { project:'projectX', row:'A', col:1 }; a separator before the well is required ("GX12" is not a well).
  // "GX-012" -> { family:'GX' }. Case and leading zeros ("A01") do not matter.
  function parseName(id) {
    var s = String(id == null ? '' : id).trim(), out = { family: null, project: null, row: null, col: null };
    var m = /^(.*?)[_\-\s.]([A-Pa-p])\s?0*(\d{1,2})$/.exec(s);
    if (m && m[1]) { out.project = m[1]; out.row = m[2].toUpperCase(); out.col = +m[3]; if (out.col < 1) { out.project = out.row = out.col = null; } }
    var f = /^([A-Za-z]{2,})/.exec(out.project || s);
    if (f) out.family = f[1];
    return out;
  }
  // ---- tests -----------------------------------------------------------------------------------------------------------------------------------
  var _lf = [0, 0];
  function lfact(n) { for (var i = _lf.length; i <= n; i++) _lf[i] = _lf[i - 1] + Math.log(i); return _lf[n]; }
  function hyper(a, n1, K, N) { return Math.exp(lfact(K) - lfact(a) - lfact(K - a) + lfact(N - K) - lfact(n1 - a) - lfact(N - K - n1 + a) - (lfact(N) - lfact(n1) - lfact(N - n1))); }
  // Fisher's exact, two-sided: the group has a of its n1 with the trait; K of N have it. The probability of every table at most as likely.
  function fisher(a, n1, K, N) {
    var lo = Math.max(0, n1 + K - N), hi = Math.min(n1, K), p0 = hyper(a, n1, K, N), p = 0;
    for (var x = lo; x <= hi; x++) { var px = hyper(x, n1, K, N); if (px <= p0 * (1 + 1e-9)) p += px; }
    return Math.min(1, p);
  }
  function erfc(x) { // Numerical Recipes erfcc, relative error < 1.2e-7
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  // Mann-Whitney U, normal approximation with a tie correction and a continuity correction. Needs a few values on each side (the caller checks).
  function mannWhitney(g, rest) {
    var n1 = g.length, n2 = rest.length, all = [], i;
    for (i = 0; i < n1; i++) all.push({ v: g[i], g: 1 });
    for (i = 0; i < n2; i++) all.push({ v: rest[i], g: 0 });
    all.sort(function (a, b) { return a.v - b.v; });
    var N = all.length, r1 = 0, tie = 0, j;
    i = 0;
    while (i < N) { j = i; while (j + 1 < N && all[j + 1].v === all[i].v) j++; var rk = (i + j) / 2 + 1, t = j - i + 1; for (var k = i; k <= j; k++) if (all[k].g) r1 += rk; tie += t * t * t - t; i = j + 1; }
    var U = r1 - n1 * (n1 + 1) / 2, mu = n1 * n2 / 2, v = n1 * n2 / 12 * ((N + 1) - tie / (N * (N - 1)));
    var rb = 2 * U / (n1 * n2) - 1;
    if (!(v > 0)) return { p: 1, rb: 0, U: U };
    var z = (Math.abs(U - mu) - 0.5) / Math.sqrt(v); if (z < 0) z = 0;
    return { p: Math.min(1, erfc(z / Math.SQRT2)), rb: rb, U: U };
  }
  function bh(ps) { // Benjamini-Hochberg q-values for a list of p-values, in the input order
    var m = ps.length, idx = ps.map(function (_, i) { return i; }).sort(function (a, b) { return ps[a] - ps[b]; }), q = new Array(m), prev = 1;
    for (var r = m - 1; r >= 0; r--) { var i = idx[r], v = Math.min(prev, ps[i] * m / (r + 1)); q[i] = Math.min(1, v); prev = q[i]; }
    return q;
  }
  function median(a) { var b = a.filter(fin).slice().sort(function (x, y) { return x - y; }), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; }
  function mad(a) { var m = median(a); return m == null ? null : median(a.filter(fin).map(function (v) { return Math.abs(v - m); })); }

  // ---- the traits (what a compound did) ---------------------------------------------------------------------------------------------------------
  var TRAITS = [
    { key: 'hook', kind: 'bin', get: function (c) { return c.hook == null ? null : !!c.hook; }, label: 'a hook' },
    { key: 'nd', kind: 'bin', get: function (c) { return c.nd == null ? null : !!c.nd; }, label: 'no effect' },
    { key: 'dmax', kind: 'num', get: function (c) { return fin(c.dmax) ? +c.dmax : null; }, label: 'Dmax', unit: ' %', dec: 0 },
    { key: 'pdc50', kind: 'num', get: function (c) { return fin(c.pdc50) ? +c.pdc50 : null; }, label: 'potency', dec: 2 }
  ];
  // ---- the factors (where it was, or what it is called) ------------------------------------------------------------------------------------------
  // levels(c, ctx) returns [{ level, label }]; scope = 'plate' compares with the rest of the same source plate, 'all' with every compound.
  var FACTORS = [
    { key: 'srcRow', side: 'source', scope: 'plate', levels: function (c) { return c.src ? [{ level: c.src.project + '|r' + c.src.row, label: c.src.project + ' · source row ' + c.src.row }] : []; } },
    { key: 'srcCol', side: 'source', scope: 'plate', levels: function (c) { return c.src ? [{ level: c.src.project + '|c' + c.src.col, label: c.src.project + ' · source column ' + c.src.col }] : []; } },
    { key: 'srcEdge', side: 'source', scope: 'plate', levels: function (c) { return c.src && c.src.edge ? [{ level: c.src.project + '|edge', label: c.src.project + ' · source edge wells' }] : []; } },
    { key: 'srcHalfC', side: 'source', scope: 'plate', levels: function (c) { return c.src ? [{ level: c.src.project + '|h' + c.src.hc, label: c.src.project + ' · source ' + (c.src.hc === 'L' ? 'left' : 'right') + ' half (' + c.src.lc + ')' }] : []; } },
    { key: 'srcHalfR', side: 'source', scope: 'plate', levels: function (c) { return c.src ? [{ level: c.src.project + '|v' + c.src.hr, label: c.src.project + ' · source ' + (c.src.hr === 'T' ? 'top' : 'bottom') + ' half (' + c.src.lr + ')' }] : []; } },
    { key: 'family', side: 'name', scope: 'all', levels: function (c) { return c.fam ? [{ level: c.fam, label: c.fam + ' compounds' }] : []; } },
    { key: 'project', side: 'name', scope: 'all', levels: function (c) { return c.src ? [{ level: c.src.project, label: c.src.project + ' (chemistry plate)' }] : []; } },
    { key: 'plate', side: 'destination', scope: 'all', levels: function (c) { return c.plate ? [{ level: c.plate, label: 'assay plate ' + c.plate }] : []; } },
    { key: 'dRow', side: 'destination', scope: 'all', levels: function (c) { return c.dRow ? [{ level: c.dRow, label: 'assay row ' + c.dRow }] : []; } },
    { key: 'dCol', side: 'destination', scope: 'all', levels: function (c) { return c.dCol != null ? [{ level: 'c' + c.dCol, label: 'assay column ' + c.dCol }] : []; } },
    { key: 'dHalfC', side: 'destination', scope: 'all', levels: function (c) { return c.dHalfC ? [{ level: c.dHalfC, label: (c.dHalfC === 'L' ? 'left' : 'right') + ' half of the assay plate' }] : []; } },
    { key: 'dHalfR', side: 'destination', scope: 'all', levels: function (c) { return c.dHalfR ? [{ level: c.dHalfR, label: (c.dHalfR === 'T' ? 'top' : 'bottom') + ' half of the assay plate' }] : []; } }
  ];

  // Where each compound sat in its chemistry plate, once the names say so. Used only when most names do: a few "A1" among other names is noise.
  function prepare(items, o) {
    var cs = items.map(function (it) { var n = parseName(it.id), c = {}; for (var k in it) c[k] = it[k]; c.nm = n; return c; });
    var parsed = cs.filter(function (c) { return c.nm.project; });
    var byProj = {};
    parsed.forEach(function (c) { var p = c.nm.project; (byProj[p] = byProj[p] || []).push(c); });
    var useSrc = cs.length && parsed.length / cs.length >= (o.minParsed == null ? 0.6 : o.minParsed);
    var formats = {};
    Object.keys(byProj).forEach(function (p) {
      var mr = 0, mc = 0; byProj[p].forEach(function (c) { mr = Math.max(mr, c.nm.row.charCodeAt(0) - 64); mc = Math.max(mc, c.nm.col); });
      formats[p] = (mr <= 8 && mc <= 12) ? { nR: 8, nC: 12 } : { nR: 16, nC: 24 };
    });
    cs.forEach(function (c) {
      c.src = null; c.fam = c.nm.family;
      if (useSrc && c.nm.project) {
        var f = formats[c.nm.project], r = c.nm.row.charCodeAt(0) - 64;
        if (r <= f.nR && c.nm.col <= f.nC) {
          var hc = c.nm.col <= f.nC / 2, hr = r <= f.nR / 2;
          c.src = { project: c.nm.project, row: c.nm.row, col: c.nm.col, edge: r === 1 || r === f.nR || c.nm.col === 1 || c.nm.col === f.nC,
            hc: hc ? 'L' : 'R', hr: hr ? 'T' : 'B',
            lc: hc ? 'columns 1–' + (f.nC / 2) : 'columns ' + (f.nC / 2 + 1) + '–' + f.nC,
            lr: hr ? 'rows A–' + String.fromCharCode(64 + f.nR / 2) : 'rows ' + String.fromCharCode(65 + f.nR / 2) + '–' + String.fromCharCode(64 + f.nR) };
        }
      }
    });
    return { cs: cs, formats: formats, useSrc: !!useSrc, parsed: parsed.length };
  }

  // ---- the DMSO wells ---------------------------------------------------------------------------------------------------------------------------
  // dmso: [{ plate, row, col, dev }] with dev = how far a control well reads from its plate's control mean, in %. A location is off when its
  // DMSO wells are, together, further from the plate than the scatter of every DMSO well allows (and by at least minDev %).
  function dmsoAt(dmso, factor, level, o) {
    if (!dmso || !dmso.length) return { state: 'unknown', n: 0 };
    var w = dmso.filter(function (d) {
      if (factor === 'plate') return d.plate === level;
      if (factor === 'dRow') return d.row === level;
      if (factor === 'dCol') return 'c' + d.col === level;
      if (factor === 'dHalfC') return d.hc === level;
      if (factor === 'dHalfR') return d.hr === level;
      return false;
    });
    if (w.length < 2) return { state: 'unknown', n: w.length };
    var all = dmso.map(function (d) { return d.dev; }), s = 1.4826 * (mad(all) || 0), med = median(w.map(function (d) { return d.dev; }));
    var minDev = o.minDev == null ? 3 : o.minDev, se = Math.max(s, 0.5) / Math.sqrt(w.length);
    return { state: (Math.abs(med) >= minDev && Math.abs(med) >= 3 * se) ? 'off' : 'clean', n: w.length, dev: med };
  }

  // ---- the search -------------------------------------------------------------------------------------------------------------------------------
  function find(items, o) {
    o = o || {};
    var minG = o.minGroup || 3, minGN = o.minGroupNum || 5, alpha = o.alpha == null ? 0.05 : o.alpha, sugg = o.suggestive == null ? 0.2 : o.suggestive;
    var minShare = o.minShare == null ? 0.25 : o.minShare, minRank = o.minRank == null ? 0.4 : o.minRank, shareAt = o.sharePct == null ? 0.7 : o.sharePct;
    var P = prepare(items, o), cs = P.cs, tests = [];
    // groups: factor -> level -> items
    var groups = [];
    FACTORS.forEach(function (F) {
      var by = {}, lab = {};
      cs.forEach(function (c) { F.levels(c).forEach(function (L) { (by[L.level] = by[L.level] || []).push(c); lab[L.level] = L.label; }); });
      var nLevels = Object.keys(by).length;
      if (nLevels < 2 && F.side !== 'source') return;   // one plate / one family: nothing to compare
      Object.keys(by).forEach(function (lv) {
        var members = by[lv], scope = cs;
        if (F.scope === 'plate') { var pr = lv.split('|')[0]; scope = cs.filter(function (c) { return c.src && c.src.project === pr; }); }
        groups.push({ F: F, level: lv, label: lab[lv], members: members, scope: scope });
      });
    });
    groups.forEach(function (G) {
      var inG = new Set(G.members);
      TRAITS.forEach(function (T) {
        var gv = [], rv = [], gi = [];
        G.scope.forEach(function (c) { var v = T.get(c); if (v == null) return; if (inG.has(c)) { gv.push(v); gi.push(c); } else rv.push(v); });
        var n1 = gv.length, n2 = rv.length;
        if (T.kind === 'bin') {
          if (n1 < minG || n2 < minG) return;
          var a = gv.filter(Boolean).length, c2 = rv.filter(Boolean).length, K = a + c2, N = n1 + n2;
          if (K < 2) return;
          var p = fisher(a, n1, K, N), sh1 = a / n1, sh2 = c2 / n2;
          tests.push({ G: G, T: T, p: p, n: n1, k: a, rest: n2, restK: c2, share: sh1, restShare: sh2, size: Math.abs(sh1 - sh2), big: Math.abs(sh1 - sh2) >= minShare && (sh1 > sh2 || !!o.depleted), dir: sh1 >= sh2 ? 'more' : 'fewer', gi: gi });
        } else {
          if (n1 < minGN || n2 < minGN) return;
          var r = mannWhitney(gv, rv), md1 = median(gv), md2 = median(rv);
          tests.push({ G: G, T: T, p: r.p, n: n1, rest: n2, med: md1, restMed: md2, rb: r.rb, size: Math.abs(r.rb), big: Math.abs(r.rb) >= minRank, dir: md1 >= md2 ? 'higher' : 'lower', gi: gi });
        }
      });
    });
    var q = bh(tests.map(function (x) { return x.p; }));
    tests.forEach(function (x, j) { x.q = q[j]; });
    var keep = tests.filter(function (x) { return x.big && x.q <= sugg; }).sort(function (a, b) { return a.q - b.q || a.p - b.p || b.size - a.size; });
    // the same compounds found through two factors (a plate with one project) are one finding: keep the clearest
    // a finding that adds nothing to a clearer one is dropped: a binary trait is explained by another group with the same compounds having it
    // (or more) and a better q — the edge wells that carry only row A's hooks; a number is explained by a clearer group that contains it
    function pos(x) { return x.T.kind === 'bin' ? x.gi.filter(function (c) { return !!x.T.get(c); }) : x.gi; }
    keep = keep.filter(function (x) {
      var px = new Set(pos(x));
      return !keep.some(function (y) {
        if (y === x || y.T.key !== x.T.key || y.dir !== x.dir) return false;
        var py = new Set(pos(y)), better = y.q < x.q || (y.q === x.q && py.size < px.size);
        if (!better) return false;
        var inside = true; px.forEach(function (c) { if (!py.has(c)) inside = false; });
        return inside && (x.T.kind === 'bin' || py.size > px.size);
      });
    });
    // two halves (two plates) split the compounds in two, so "higher on the left" and "lower on the right" are one finding: keep the clearer
    keep = keep.filter(function (x) {
      return !keep.some(function (y) {
        if (y === x || y.T.key !== x.T.key || y.G.F.key !== x.G.F.key || y.dir === x.dir || y.G.scope.length !== x.G.scope.length || y.G.scope[0] !== x.G.scope[0] || y.gi.length + x.gi.length !== x.G.scope.filter(function (c) { return x.T.get(c) != null; }).length) return false;
        var s = new Set(y.gi), disjoint = true; x.gi.forEach(function (c) { if (s.has(c)) disjoint = false; });
        return disjoint && (y.q < x.q || (y.q === x.q && y.G.label < x.G.label));
      });
    });
    var seen = {}, out = [];
    keep.forEach(function (x) {
      var sig = x.T.key + '|' + x.dir + '|' + x.gi.map(function (c) { return c.id; }).sort().join(',');
      if (seen[sig]) { seen[sig].also.push(x.G.label); return; }
      seen[sig] = x; x.also = []; out.push(x);
    });
    return { findings: out.map(function (x) { return describe(x, cs, o, shareAt, alpha); }), tests: tests.length, parsed: P.parsed, useSrc: P.useSrc, formats: P.formats, n: cs.length };
  }

  // what else the group of a finding shares, and what the DMSO says there
  function describe(x, cs, o, shareAt, alpha) {
    var G = x.G, side = G.F.side, members = G.members, coinc = null, dm = null;
    var others = FACTORS.filter(function (F) { return F.side !== side && !(side === 'name' && F.side === 'source') && !(side === 'source' && F.key === 'project'); });
    var shared = [];
    others.forEach(function (F) {
      var cnt = {}, lab = {}, tot = {};
      members.forEach(function (c) { F.levels(c).forEach(function (L) { cnt[L.level] = (cnt[L.level] || 0) + 1; lab[L.level] = L.label; }); });
      cs.forEach(function (c) { F.levels(c).forEach(function (L) { tot[L.level] = (tot[L.level] || 0) + 1; }); });
      if (Object.keys(tot).length < 2) return;
      Object.keys(cnt).forEach(function (lv) {
        var sh = cnt[lv] / members.length, base = tot[lv] / cs.length;
        if (cnt[lv] >= 3 && sh >= shareAt && sh - base >= 0.25 && fisher(cnt[lv], members.length, tot[lv], cs.length) <= (o.sharedP == null ? 0.01 : o.sharedP)) shared.push({ factor: F.key, level: lv, label: lab[lv], share: sh, count: cnt[lv], of: members.length, side: F.side });
      });
    });
    // the clearest shared place for the sentence: the most shared, a row or column before a whole plate
    shared.sort(function (a, b) { return b.share - a.share || (a.factor === 'plate') - (b.factor === 'plate'); });
    coinc = shared[0] || null;
    // the destination place that decides it: a destination finding's own; else of the places its compounds share, the one whose DMSO is off, then unread, then clean
    var loc = null;
    if (side === 'destination') { loc = { factor: G.F.key, level: G.level, label: G.label }; dm = dmsoAt(o.dmso, loc.factor, loc.level, o); }
    else {
      var rank = { off: 0, unknown: 1, clean: 2 };
      shared.filter(function (c) { return c.side === 'destination'; }).forEach(function (c) { var d = dmsoAt(o.dmso, c.factor, c.level, o); if (!dm || rank[d.state] < rank[dm.state]) { dm = d; loc = c; } });
      if (loc) coinc = loc;
    }
    if (dm) dm.label = loc.label;
    var kind, why;
    if (side === 'destination') {
      if (dm.state === 'off') { kind = 'destination'; why = 'The DMSO wells on ' + loc.label + ' are off too (' + dmNote(dm) + ' from the plate), so this is the plate, not the compounds.'; }
      else if (dm.state === 'clean') { kind = coinc ? 'source' : 'compound'; why = 'The DMSO wells on ' + loc.label + ' read normally (' + dmNote(dm) + '), so it is not the plate' + (coinc ? '; the same compounds share ' + coinc.label + '.' : ' — look at the compounds that sit there.'); }
      else { kind = 'unclear'; why = 'No DMSO wells on ' + loc.label + ' to check it against.'; }
    } else if (loc) {
      if (dm.state === 'off') { kind = 'ambiguous'; why = 'These compounds also share ' + loc.label + ', where the DMSO wells are off (' + sgn(dm.dev) + ' %): it may be the plate rather than where they came from.'; }
      else if (dm.state === 'clean') { kind = side === 'source' ? 'source' : 'compound'; why = 'They also share ' + loc.label + ', but the DMSO wells there read normally (' + dmNote(dm) + '): it points to ' + (side === 'source' ? 'the source plate.' : 'the compounds.'); }
      else { kind = 'ambiguous'; why = 'They also share ' + loc.label + ' and there are no DMSO wells there to tell the two apart.'; }
    } else if (coinc) { kind = side === 'source' ? 'source' : 'compound'; why = 'They also share ' + coinc.label + '.'; }
    else if (side === 'source') { kind = 'source'; why = 'They are spread over the assay plates, so it follows where they came from, not where they were dosed.'; }
    else if (side === 'name') { kind = 'compound'; why = 'A family of compounds that share a name and behave alike.'; }
    else { kind = 'unclear'; why = ''; }
    var ids = (x.T.kind === 'bin' && x.dir === 'more' ? x.gi.filter(function (c) { return !!x.T.get(c); }) : x.gi.slice().sort(function (a, b) { return x.dir === 'higher' ? x.T.get(b) - x.T.get(a) : x.T.get(a) - x.T.get(b); })).map(function (c) { return c.id; });
    if (x.T.kind === 'bin') ids.sort(natCmp);
    return { trait: x.T.key, traitLabel: x.T.label, kind: x.T.kind, factor: G.F.key, side: side, level: G.level, label: G.label, n: x.n, k: x.k, rest: x.rest, restK: x.restK, share: x.share, restShare: x.restShare,
      med: x.med, restMed: x.restMed, rb: x.rb, dir: x.dir, p: x.p, q: x.q, strong: x.q <= alpha, members: ids, groupIds: x.gi.map(function (c) { return c.id; }), also: x.also, coincides: coinc, dmso: dm, verdict: kind, why: why };
  }
  function dmNote(d) { return d.n + ' wells, ' + sgn(d.dev) + ' %'; }
  function sgn(v) { return (v > 0 ? '+' : '') + (Math.round(v * 10) / 10); }

  return { parseName: parseName, fisher: fisher, mannWhitney: mannWhitney, bh: bh, find: find, natCmp: natCmp, TRAITS: TRAITS, FACTORS: FACTORS, prepare: prepare, dmsoAt: dmsoAt, median: median };
})();
