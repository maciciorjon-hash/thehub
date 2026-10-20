// A reader workbook that holds several plates. A PHERAstar can export every plate of a run into one .xlsx: for
// each plate a sheet of the lettered grid ("Microplate End point", "…_1", "…_2") and a sheet of its settings
// ("Protocol Information", "…_1"…), the newest first. RDR turns that into plates: which wells, which sheet, what
// the plate is called (the ID1 typed at the reader), and in which order they were read. It only recognises the
// shape; what an app does with a plate is that app's business. Pure functions over a SheetJS workbook.
var RDR = (function () {
  var LET = 'ABCDEFGHIJKLMNOP';
  function str(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var t = str(v).replace(/[\s  ]/g, '');
    if (!t) return null;
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
    else if (/^-?\d+,\d+$/.test(t)) t = t.replace(',', '.');
    return /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : null;
  }
  function aoa(ws) { return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true }); }
  // The grids on a sheet. A grid is a header row 1,2,3… with the letters A,B,C… down the column to its left.
  // A sheet with a donor and an acceptor grid (or any two channels) has two; the text above each is its label.
  function blocks(rows) {
    var out = [], r = 0, lastEnd = -1;
    while (r < rows.length) {
      var row = rows[r] || [], hit = null;
      for (var c = 1; c < row.length - 1 && !hit; c++) {
        if (num(row[c]) === 1 && num(row[c + 1]) === 2 && str((rows[r + 1] || [])[c - 1]).toUpperCase() === 'A') hit = c;
      }
      if (!hit) { r++; continue; }
      var c0 = hit, n = 0;
      while (num(row[c0 + n]) === n + 1) n++;
      var h = 0;
      while (h < LET.length && str((rows[r + 1 + h] || [])[c0 - 1]).toUpperCase() === LET[h]) h++;
      if (n < 3 || h < 1) { r++; continue; }
      var vals = {}, got = 0, i, j;
      for (i = 0; i < h; i++) for (j = 0; j < n; j++) {
        var v = num((rows[r + 1 + i] || [])[c0 + j]);
        if (v !== null) { vals[LET[i] + (j + 1)] = v; got++; }
      }
      var label = '';
      for (var u = r - 1; u > lastEnd && u >= r - 4; u--) {
        var t = (rows[u] || []).map(str).filter(function (x) { return x; });
        if (t.length) { label = t[0]; break; }
      }
      if (got) out.push({ r: r, label: label, rows: h > 8 ? 16 : 8, cols: n > 12 ? 24 : 12, n: got, vals: vals });
      lastEnd = r + h; r += h + 1;
    }
    return out;
  }
  // "Key: value" lines above the data ("ID1: CTG_72h_5"); and two-column key / value sheets (Protocol Information).
  function meta(rows) {
    var m = {};
    rows.forEach(function (row) {
      var a = str(row[0]), b = row[1];
      if (!a) return;
      var mm = /^([^:]{1,40}):\s*(.*)$/.exec(a);
      if (mm && mm[2]) { if (!(mm[1] in m)) m[mm[1].trim()] = mm[2].trim(); }
      else if (mm && str(b) !== '') m[mm[1].trim()] = b;
    });
    return m;
  }
  function suffix(name) { var m = /_(\d+)\s*$/.exec(name); return m ? +m[1] : 0; }
  // Every plate in a workbook, in the order the reader read them. Empty when no sheet holds a plate grid.
  function plates(wb) {
    var protoOf = {}, protoRows = {}, found = [];
    wb.SheetNames.forEach(function (n) { if (/protocol/i.test(n)) { protoOf[suffix(n)] = n; } });
    wb.SheetNames.forEach(function (n, idx) {
      if (/protocol/i.test(n)) return;
      var rows = aoa(wb.Sheets[n]), b = blocks(rows);
      if (!b.length) return;
      var m = meta(rows.slice(0, 14)), sfx = suffix(n);
      var pn = protoOf[sfx] || null, pr = null, pm = {};
      if (pn) { pr = aoa(wb.Sheets[pn]).filter(function (r) { return r.some(function (c) { return str(c) !== ''; }); }); pm = meta(pr); }
      var id = str(m.ID1) || str(m.ID2) || str(m.ID3) || str(pm.ID1) || '';
      var testId = +(str(m['Test ID']) || str(pm['Test ID'])) || 0;
      found.push({ id: id, name: id, testId: testId, date: str(m.Date), time: str(m.Time), sheet: n, protocolSheet: pn,
        protocolRows: pr, meta: Object.assign({}, pm, m), blocks: b, rows: Math.max.apply(null, b.map(function (x) { return x.rows; })),
        cols: Math.max.apply(null, b.map(function (x) { return x.cols; })), sfx: sfx, idx: idx });
    });
    found.sort(function (x, y) { return (x.testId - y.testId) || (x.sfx - y.sfx) || (x.idx - y.idx); });
    var seen = {};
    found.forEach(function (p, i) {
      p.order = i;
      if (!p.name) p.name = 'Plate ' + (i + 1);
      var k = p.name.toLowerCase(); seen[k] = (seen[k] || 0) + 1;
      if (seen[k] > 1) p.name += ' (' + seen[k] + ')';
    });
    return found;
  }
  // A GloMax export (GloMax Discover / Explorer, "Export to Excel"): one workbook per run. The first sheet holds the
  // protocol's settings, "Results" holds one lettered grid per reading — each under its own heading in column A
  // ("Luminescence", "Fluorescence") — with "Protocol: …" and "Result: <the run's name>" at the top, and "Results By
  // Well" repeats them well by well. A double read (HiBiT luminescence, then CellTiter-Fluor fluorescence, on the
  // same plate) is two grids on that one sheet. null when the workbook is not one.
  function glomax(wb) {
    var sn = null;
    wb.SheetNames.forEach(function (n) { if (!sn && /^results$/i.test(n)) sn = n; });
    if (!sn) return null;
    var rows = aoa(wb.Sheets[sn]), top = rows.slice(0, 6).map(function (r) { return r.map(str).join('|'); }).join('|');
    var rm = /Result:\s*([^|]*)/.exec(top), pm = /Protocol:\s*([^|]*)/.exec(top);
    if (!rm || !pm) return null;
    var bl = blocks(rows), prev = -1, ch = [];
    bl.forEach(function (b) {
      var head = '';
      for (var u = b.r - 1; u > prev && u >= b.r - 6 && !head; u--) { var t = str((rows[u] || [])[0]); if (t && !/:$/.test(t)) head = t; }
      prev = b.r + (b.rows || 0);
      var kind = /lumin/i.test(head) ? 'lum' : /fluor/i.test(head) ? 'fluor' : /absorb|\bOD\b/i.test(head) ? 'abs' : 'other';
      ch.push({ kind: kind, label: head || b.label, rows: b.rows, cols: b.cols, n: b.n, vals: b.vals });
    });
    if (!ch.length) return null;
    return { name: rm[1].trim(), protocol: pm[1].trim(), sheet: sn, channels: ch };
  }
  // One plate as a workbook of its own — its grid sheet and its settings sheet, under the plain names — so
  // code that reads one reader file per plate reads it unchanged.
  function plateBook(wb, p) {
    var w = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(w, wb.Sheets[p.sheet], 'Microplate End point');
    if (p.protocolSheet) XLSX.utils.book_append_sheet(w, wb.Sheets[p.protocolSheet], 'Protocol Information');
    return w;
  }
  function safeName(s) { return String(s).replace(/[\\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80); }
  // Files in, files out: a workbook with two or more plates becomes one file per plate, named for its plate
  // (ID1), in reading order; anything else comes back untouched. A file that cannot be read is left for the app
  // to complain about in its own words.
  async function expand(files) {
    var out = [], mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/\.xlsx?$/i.test(f.name) || typeof XLSX === 'undefined') { out.push(f); continue; }
      var ps = null, wb = null;
      try { wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: false, raw: true }); ps = plates(wb); } catch (e) { ps = null; }
      if (!ps || ps.length < 2) { out.push(f); continue; }
      var stem = f.name.replace(/\.[^.]+$/, ''), taken = {};
      ps.forEach(function (p) {
        var nm = safeName(p.id || (stem + '_P' + (p.order + 1))) || (stem + '_P' + (p.order + 1)), k = nm.toLowerCase();
        if (taken[k]) nm += '_' + (p.order + 1);
        taken[nm.toLowerCase()] = 1;
        var buf = XLSX.write(plateBook(wb, p), { type: 'array', bookType: 'xlsx' });
        var nf = new File([buf], nm + '.xlsx', { type: mime });
        nf.fromWorkbook = f.name;
        out.push(nf);
      });
    }
    return out;
  }
  return { plates: plates, blocks: blocks, expand: expand, plateBook: plateBook, glomax: glomax };
})();
