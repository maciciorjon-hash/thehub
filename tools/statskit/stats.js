/* StatsKit — the descriptive statistics every data-analysis app needs, written once (docs/DATA_APPS_STUDY_2026-10-30.md, Phase 1).
   Rules, the same everywhere: only finite numbers count (null, '', NaN, ±Infinity are skipped, never read as 0); an empty list has no mean (null);
   a standard deviation needs two values (null with fewer); SD and SEM are the sample ones (n − 1); quantiles are type 7 (Excel's QUARTILE.INC, numpy's default,
   Prism's), so a median is the quantile at 0.5. An app keeps its own helper names as one-line calls into this. */
var StatsKit = (function () {
  function clean(a) { var o = []; if (!a) return o; for (var i = 0; i < a.length; i++) { var v = a[i]; if (v != null && v !== '' && isFinite(v)) o.push(+v); } return o; }
  function mean(a) { var b = clean(a), s = 0; if (!b.length) return null; for (var i = 0; i < b.length; i++) s += b[i]; return s / b.length; }
  function sd(a) { var b = clean(a); if (b.length < 2) return null; var m = mean(b), s = 0; for (var i = 0; i < b.length; i++) s += (b[i] - m) * (b[i] - m); return Math.sqrt(s / (b.length - 1)); }
  function sem(a) { var s = sd(a); return s == null ? null : s / Math.sqrt(clean(a).length); }
  function quantileSorted(sorted, p) { var n = sorted.length; if (!n) return null; var h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo); }
  function quantile(a, p) { var b = clean(a).sort(function (x, y) { return x - y; }); return quantileSorted(b, p); }
  function median(a) { return quantile(a, 0.5); }
  function mad(a) { var m = median(a); if (m == null) return null; return median(clean(a).map(function (v) { return Math.abs(v - m); })); }
  function cv(a) { var m = mean(a), s = sd(a); return m == null || s == null || m === 0 ? null : s / Math.abs(m); }
  // Plate quality from a high and a low control (Zhang 1999): Z′ = 1 − 3(σ₊ + σ₋)/|μ₊ − μ₋|; ≥ 0.5 a good assay, 0–0.5 marginal, below 0 the two controls overlap.
  function zPrime(sdPos, sdNeg, meanPos, meanNeg) { var d = Math.abs(meanPos - meanNeg); return d === 0 || !isFinite(d) ? null : 1 - (3 * sdPos + 3 * sdNeg) / d; }
  // One plate's controls in one place. pos = the high control (vehicle, 100 %), neg = the low one (baseline, background, 0 %). minN = the fewest wells each may have for Z′ (an app says its own: 3 by default).
  // Without a low control the spread of the high one is all there is to judge, so the verdict then rests on its CV (≤ 10 % good, ≤ 20 % marginal).
  function controlWindow(pos, neg, o) {
    var minN = (o && o.minN) || 3, p = clean(pos), q = clean(neg);
    var P = { n: p.length, mean: mean(p), sd: sd(p), cv: cv(p) }, N = { n: q.length, mean: mean(q), sd: sd(q), cv: cv(q) };
    var r = { pos: P, neg: N, window: null, sb: null, z: null, verdict: 'na', basis: 'no control wells read' };
    if (P.n && N.n) { r.window = P.mean - N.mean; r.sb = N.mean > 0 ? P.mean / N.mean : null; if (P.n >= minN && N.n >= minN) r.z = zPrime(P.sd, N.sd, P.mean, N.mean); }
    if (r.z != null) { r.verdict = r.z >= 0.5 ? 'good' : r.z >= 0 ? 'marginal' : 'poor'; r.basis = 'Z′'; }
    else if (P.n >= 3 && P.cv != null) { r.verdict = P.cv <= 0.10 ? 'good' : P.cv <= 0.20 ? 'marginal' : 'poor'; r.basis = N.n ? 'control CV (too few wells for Z′)' : 'control CV (no low control set)'; }
    return r;
  }
  return { zPrime: zPrime, controlWindow: controlWindow, clean: clean, mean: mean, sd: sd, sem: sem, quantile: quantile, quantileSorted: quantileSorted, median: median, mad: mad, cv: cv };
})();
