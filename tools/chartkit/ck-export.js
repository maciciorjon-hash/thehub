/* ChartKit export — the scene drawn as SVG, as a vector PDF, and as a PNG at any dpi.
 *
 * Nothing here knows what a chart is: it draws primitives (line, path, rect, circle, marker, text, group).
 * The PDF is written by hand (Helvetica, one page, the figure's own size) so it stays vector and needs no library.
 */
var ChartKitExport = (function(){
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v){ return String(+(+v).toFixed(2)); }

  // ── SVG ─────────────────────────────────────────────────────
  function markerPath(type, cx, cy, r){
    if (type === 'square') return 'M' + n(cx - r) + ' ' + n(cy - r) + 'H' + n(cx + r) + 'V' + n(cy + r) + 'H' + n(cx - r) + 'Z';
    if (type === 'triangle') return 'M' + n(cx) + ' ' + n(cy - r * 1.15) + 'L' + n(cx + r * 1.1) + ' ' + n(cy + r * 0.85) + 'H' + n(cx - r * 1.1) + 'Z';
    if (type === 'diamond') return 'M' + n(cx) + ' ' + n(cy - r * 1.3) + 'L' + n(cx + r * 1.3) + ' ' + n(cy) + 'L' + n(cx) + ' ' + n(cy + r * 1.3) + 'L' + n(cx - r * 1.3) + ' ' + n(cy) + 'Z';
    return null;
  }
  function svgPrim(p, attrs){
    var a = attrs ? ' ' + attrs : '', el = p.el ? ' data-el="' + esc(p.el) + '"' : '';
    var st = function(){ return (p.stroke ? ' stroke="' + p.stroke + '" stroke-width="' + n(p.sw || 1) + '"' + (p.dash ? ' stroke-dasharray="' + p.dash + '"' : '') + (p.cap ? ' stroke-linecap="' + p.cap + '"' : '') + ' stroke-linejoin="round"' : ''); };
    if (p.t === 'line') return '<line' + el + a + ' x1="' + n(p.x1) + '" y1="' + n(p.y1) + '" x2="' + n(p.x2) + '" y2="' + n(p.y2) + '"' + st() + '/>';
    if (p.t === 'path') { if (!p.pts.length) return ''; var d = p.pts.map(function(q, i){ return (i ? 'L' : 'M') + n(q[0]) + ' ' + n(q[1]); }).join(''); return '<path' + el + a + ' d="' + d + '" fill="none"' + st() + (p.clip ? ' clip-path="url(#ckclip)"' : '') + '/>'; }
    if (p.t === 'rect') return '<rect' + el + a + ' x="' + n(p.x) + '" y="' + n(p.y) + '" width="' + n(p.w) + '" height="' + n(p.h) + '" fill="' + (p.fill || 'none') + '"' + st() + '/>';
    if (p.t === 'circle') return '<circle' + el + a + ' cx="' + n(p.cx) + '" cy="' + n(p.cy) + '" r="' + n(p.r) + '" fill="' + (p.fill || 'none') + '"' + st() + '/>';
    if (p.t === 'marker') { var mp = markerPath(p.type, p.cx, p.cy, p.r); return mp ? '<path' + el + a + ' d="' + mp + '" fill="' + (p.fill || 'none') + '"' + st() + '/>' : '<circle' + el + a + ' cx="' + n(p.cx) + '" cy="' + n(p.cy) + '" r="' + n(p.r) + '" fill="' + (p.fill || 'none') + '"' + st() + '/>'; }
    if (p.t === 'text') {
      var tf = (p.rot ? ' transform="rotate(' + n(p.rot) + ' ' + n(p.x) + ' ' + n(p.y) + ')"' : '');
      return '<text' + el + a + ' x="' + n(p.x) + '" y="' + n(p.y) + '"' + tf + ' font-family="' + esc(p.font || 'Arial') + ', Helvetica, sans-serif" font-size="' + n(p.size) + '"' + (p.bold ? ' font-weight="bold"' : '') + (p.italic ? ' font-style="italic"' : '') + ' text-anchor="' + p.anchor + '" fill="' + (p.fill || '#000') + '">' + textSpans(p) + '</text>';
    }
    if (p.t === 'group') return '<g' + el + a + '>' + p.kids.map(function(k){ return svgPrim(k); }).join('') + '</g>';
    return '';
  }
  // 10^6 written "10^6" is set as a superscript
  function textSpans(p){
    var parts = String(p.text).split(/\^(-?\d+)/);
    if (parts.length === 1) return esc(p.text);
    return parts.map(function(s, i){ return i % 2 ? '<tspan dy="' + n(-p.size * 0.38) + '" font-size="' + n(p.size * 0.7) + '">' + esc(s) + '</tspan><tspan dy="' + n(p.size * 0.38) + '"></tspan>' : esc(s); }).join('');
  }
  function toSVG(scene, o){
    o = o || {};
    var px = o.px;
    var head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n(scene.W) + ' ' + n(scene.H) + '"' + (px ? ' width="' + px.w + '" height="' + px.h + '"' : ' width="' + n(scene.W) + 'pt" height="' + n(scene.H) + 'pt"') + '>';
    var defs = '<defs><clipPath id="ckclip"><rect x="' + n(scene.clip.x) + '" y="' + n(scene.clip.y) + '" width="' + n(scene.clip.w) + '" height="' + n(scene.clip.h) + '"/></clipPath></defs>';
    var bg = o.transparent ? '' : '<rect x="0" y="0" width="' + n(scene.W) + '" height="' + n(scene.H) + '" fill="#ffffff"/>';
    return head + defs + bg + scene.prims.map(function(p){ return svgPrim(p); }).join('') + '</svg>';
  }

  // ── PNG ─────────────────────────────────────────────────────
  var _crcT = null;
  function crc32(buf){
    if (!_crcT) { _crcT = new Uint32Array(256); for (var i = 0; i < 256; i++) { var c = i; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; _crcT[i] = c >>> 0; } }
    var c2 = 0xFFFFFFFF; for (var j = 0; j < buf.length; j++) c2 = _crcT[(c2 ^ buf[j]) & 255] ^ (c2 >>> 8); return (c2 ^ 0xFFFFFFFF) >>> 0;
  }
  // Tell the file how big it is: pHYs is pixels per metre, so 1200 dpi is 47244.
  function setPngDpi(bytes, dpi){
    var ppm = Math.round(dpi / 0.0254), chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, crc32(chunk.subarray(4, 17)));
    var at = 33, out = new Uint8Array(bytes.length + 21);   // 8 signature + 25 IHDR
    out.set(bytes.subarray(0, at), 0); out.set(chunk, at); out.set(bytes.subarray(at), at + 21);
    return out;
  }
  // The largest canvas a browser will make: the side and the area both have limits (iOS Safari: 16.7 Mpx).
  function pngSize(scene, dpi){
    var w = Math.round(scene.W / 72 * dpi), h = Math.round(scene.H / 72 * dpi), scaled = false, MAX_SIDE = 16000, MAX_AREA = 120e6;
    var k = Math.min(1, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_AREA / (w * h)));
    if (k < 1) { w = Math.floor(w * k); h = Math.floor(h * k); scaled = true; }
    return { w: w, h: h, dpi: dpi, effective: Math.round(w / (scene.W / 72)), scaled: scaled };
  }
  function toPNG(scene, dpi, o){
    o = o || {};
    return new Promise(function(resolve, reject){
      var sz = pngSize(scene, dpi), svg = toSVG(scene, { px: sz, transparent: o.transparent }), img = new Image();
      img.onload = function(){
        try {
          var cv = document.createElement('canvas'); cv.width = sz.w; cv.height = sz.h;
          var ctx = cv.getContext('2d'); if (!o.transparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sz.w, sz.h); }
          ctx.drawImage(img, 0, 0, sz.w, sz.h);
          cv.toBlob(function(b){
            if (!b) { reject(new Error('The browser could not make an image this large (' + sz.w + ' × ' + sz.h + ' px) — choose a lower dpi.')); return; }
            b.arrayBuffer().then(function(ab){ resolve({ blob: new Blob([setPngDpi(new Uint8Array(ab), sz.effective)], { type: 'image/png' }), size: sz }); });
          }, 'image/png');
        } catch (e) { reject(e); }
      };
      img.onerror = function(){ reject(new Error('The chart could not be drawn to an image.')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  // ── PDF ─────────────────────────────────────────────────────
  var CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F, 0x2212: 0x2D, 0x2032: 0x27, 0x03BC: 0xB5, 0x00D7: 0xD7 };
  function pdfStr(s){
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i), b = c < 256 && !(c >= 0x80 && c <= 0x9F) ? c : (CP1252[c] !== undefined ? CP1252[c] : 63);
      if (b === 40 || b === 41 || b === 92) out += '\\' + String.fromCharCode(b); else if (b < 32 || b > 126) out += '\\' + ('00' + b.toString(8)).slice(-3); else out += String.fromCharCode(b);
    }
    return '(' + out + ')';
  }
  function col(h){ var m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return '0 0 0'; var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255].map(function(x){ return n(x / 255); }).join(' '); }
  function toPDF(scene){
    var W = scene.W, H = scene.H, ops = [], fontOf = function(p){ return p.bold && p.italic ? 'F4' : p.bold ? 'F2' : p.italic ? 'F3' : 'F1'; };
    function Y(y){ return n(H - y); }
    function stroke(p){ var s = n(p.sw || 1) + ' w ' + (p.cap === 'square' ? '2' : '1') + ' J 1 j ' + col(p.stroke) + ' RG ' + (p.dash ? '[' + p.dash + '] 0 d ' : '[] 0 d '); return s; }
    function paint(p, shape){
      var f = p.fill && p.fill !== 'none', s = !!p.stroke;
      var o = (f ? col(p.fill) + ' rg ' : '') + (s ? stroke(p) : '') + shape + (f && s ? ' B' : f ? ' f' : s ? ' S' : ' n');
      return 'q ' + o + ' Q';
    }
    function draw(p){
      if (p.t === 'line') ops.push(paint(p, n(p.x1) + ' ' + Y(p.y1) + ' m ' + n(p.x2) + ' ' + Y(p.y2) + ' l'));
      else if (p.t === 'path') { if (p.pts.length < 2) return; var d = p.pts.map(function(q, i){ return n(q[0]) + ' ' + Y(q[1]) + (i ? ' l' : ' m'); }).join(' '); ops.push((p.clip ? 'q ' + n(scene.clip.x) + ' ' + Y(scene.clip.y + scene.clip.h) + ' ' + n(scene.clip.w) + ' ' + n(scene.clip.h) + ' re W n ' : '') + paint({ stroke: p.stroke, sw: p.sw, dash: p.dash, cap: p.cap }, d) + (p.clip ? ' Q' : '')); }
      else if (p.t === 'rect') ops.push(paint(p, n(p.x) + ' ' + Y(p.y + p.h) + ' ' + n(p.w) + ' ' + n(p.h) + ' re'));
      else if (p.t === 'circle' || (p.t === 'marker' && !markerPath(p.type, 0, 0, 1))) {
        var cx = p.cx, cy = p.cy, r = p.r, k = 0.5523 * r;
        ops.push(paint(p, n(cx + r) + ' ' + Y(cy) + ' m ' + n(cx + r) + ' ' + Y(cy - k) + ' ' + n(cx + k) + ' ' + Y(cy - r) + ' ' + n(cx) + ' ' + Y(cy - r) + ' c ' + n(cx - k) + ' ' + Y(cy - r) + ' ' + n(cx - r) + ' ' + Y(cy - k) + ' ' + n(cx - r) + ' ' + Y(cy) + ' c ' + n(cx - r) + ' ' + Y(cy + k) + ' ' + n(cx - k) + ' ' + Y(cy + r) + ' ' + n(cx) + ' ' + Y(cy + r) + ' c ' + n(cx + k) + ' ' + Y(cy + r) + ' ' + n(cx + r) + ' ' + Y(cy + k) + ' ' + n(cx + r) + ' ' + Y(cy) + ' c h'));
      }
      else if (p.t === 'marker') {
        var mp = markerPath(p.type, p.cx, p.cy, p.r), toks = mp.match(/[MLHVZ]|-?[\d.]+/g), x = 0, y = 0, d2 = [], i = 0;
        while (i < toks.length) { var c = toks[i++]; if (c === 'M' || c === 'L') { x = +toks[i++]; y = +toks[i++]; d2.push(n(x) + ' ' + Y(y) + (c === 'M' ? ' m' : ' l')); } else if (c === 'H') { x = +toks[i++]; d2.push(n(x) + ' ' + Y(y) + ' l'); } else if (c === 'V') { y = +toks[i++]; d2.push(n(x) + ' ' + Y(y) + ' l'); } else if (c === 'Z') d2.push('h'); }
        ops.push(paint(p, d2.join(' ')));
      }
      else if (p.t === 'text') {
        var m = measureText(p), dx = p.anchor === 'middle' ? -m / 2 : p.anchor === 'end' ? -m : 0, th = (p.rot || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
        // rotation is clockwise on the page (y down); PDF is y up, so the angle flips
        var ox = p.x + dx * cs, oy = p.y + dx * sn;
        var segs = String(p.text).split(/\^(-?\d+)/), cur = 0;
        segs.forEach(function(s, i){
          var sup = i % 2 === 1, sz = sup ? p.size * 0.7 : p.size, rise = sup ? p.size * 0.38 : 0, w0 = measureStr(s, sz, p);
          if (s) ops.push('BT ' + col(p.fill || '#000') + ' rg /' + fontOf(p) + ' ' + n(sz) + ' Tf ' + n(cs) + ' ' + n(-sn) + ' ' + n(sn) + ' ' + n(cs) + ' ' + n(ox + cur * cs + rise * sn) + ' ' + Y(oy + cur * sn - rise * cs) + ' Tm ' + pdfStr(s) + ' Tj ET');
          cur += w0;
        });
      }
      else if (p.t === 'group') p.kids.forEach(draw);
    }
    function measureStr(s, size, p){ return ChartKitCore.measure(s, size, p.bold, p.italic, 'Arial'); }
    function measureText(p){ return String(p.text).split(/\^(-?\d+)/).reduce(function(a, s, i){ return a + measureStr(s, i % 2 ? p.size * 0.7 : p.size, p); }, 0); }
    scene.prims.forEach(draw);
    var content = ops.join('\n');
    var objs = [];
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + n(W) + ' ' + n(H) + '] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> >>');
    objs.push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'].forEach(function(f){ objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /' + f + ' /Encoding /WinAnsiEncoding >>'); });
    var out = '%PDF-1.4\n', offs = [];
    objs.forEach(function(o, i){ offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var xref = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offs.forEach(function(o){ out += ('0000000000' + o).slice(-10) + ' 00000 n \n'; });
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var bytes = new Uint8Array(out.length); for (var i2 = 0; i2 < out.length; i2++) bytes[i2] = out.charCodeAt(i2) & 255;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  function save(blob, name){
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  return { toSVG: toSVG, toPNG: toPNG, toPDF: toPDF, pngSize: pngSize, save: save, setPngDpi: setPngDpi, esc: esc };
})();
