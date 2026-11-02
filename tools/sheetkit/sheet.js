// SheetKit — every dHUB workbook is a few sheets, each a column of sections read from the top down (never a table to the right of another):
// a title row, an optional note row, the table (its own header first), a blank row. A table copied for Prism is one drag from its header to its last row.
var SheetKit = (function(){
  // blocks: [{ title, note, aoa, merges }] → { aoa, merges, starts } ; `starts` is the sheet row (0-based) of each table's first line (its header).
  function stack(blocks){
    var aoa = [], merges = [], starts = [];
    blocks.forEach(function(b){
      if (!b || !b.aoa || !b.aoa.length) return;
      if (aoa.length) aoa.push([]);
      if (b.title) aoa.push([b.title]);
      if (b.note) aoa.push([b.note]);
      var at = aoa.length; starts.push(at);
      b.aoa.forEach(function(r){ aoa.push(r); });
      (b.merges || []).forEach(function(m){ merges.push({ s: { r: m.s.r + at, c: m.s.c }, e: { r: m.e.r + at, c: m.e.c } }); });
    });
    return { aoa: aoa, merges: merges, starts: starts };
  }
  // The worksheet of a stack; the columns are as wide as their longest table cell (titles and notes run over the empty cells beside them).
  // A number goes in to six significant figures (103.873, 0.999622, 3333.33), as Tempo always wrote them: the float's tail (103.87337551440858) is noise nobody measured,
  // and it made every numeric column 20 characters wide. Whole numbers and text are left as they are.
  function tidy(v){ return typeof v === 'number' && isFinite(v) && !Number.isInteger(v) ? +v.toPrecision(6) : v; }
  function sheet(blocks, clean){
    var s = stack(blocks), rows = (clean ? clean(s.aoa) : s.aoa).map(function(r){ return r.map(tidy); }), ws = XLSX.utils.aoa_to_sheet(rows), w = [], skip = {};
    var r = 0;
    blocks.forEach(function(b){
      if (!b || !b.aoa || !b.aoa.length) return;
      if (r) r++;
      if (b.title) { skip[r] = 1; r++; }
      if (b.note) { skip[r] = 1; r++; }
      r += b.aoa.length;
    });
    rows.forEach(function(row, i){
      if (skip[i]) return;
      row.forEach(function(v, c){ var n = v === null || v === undefined ? 0 : String(v).split('\n').reduce(function(m, t){ return Math.max(m, t.length); }, 0); w[c] = Math.max(w[c] || 8, Math.min(n + 2, 44)); });
    });
    ws['!cols'] = w.map(function(x){ return { wch: x }; });
    if (s.merges.length) ws['!merges'] = s.merges;
    return ws;
  }
  return { stack: stack, sheet: sheet };
})();
