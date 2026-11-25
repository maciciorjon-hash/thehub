/* PrintKit — the page you are about to print, shown as the printer will make it.
 *
 * A print preview that pours the document into a frame is a different page from the one that prints: no margins, another
 * width, none of the app's own stylesheet, no page edges, no running footer. This lays the same document out the way the
 * printer does and shows it as sheets.
 *
 *   - The sheet, its margins and the running text come from `@page` (the document's own stylesheet, or the app's).
 *   - A frame exactly one sheet wide (the page's width is what a print's width queries see) carries the app's stylesheet with `@media print` read as always and
 *     `@media screen` as never, so a width query answers for the page's width, as it does on paper.
 *   - The document is flowed into CSS columns one printable area wide and tall, and the frame is clipped to that area. Browsers fragment columns and pages with
 *     one algorithm, so break-inside, break-after:avoid, orphans/widows, table rows and forced breaks fall where the
 *     printer's do. Sheet n is a window onto column n. A forced page break has no page to break in a column (Chrome does not
 *     read break-before:page inside columns), so it is said as the column break it is.
 *   - Only the sheets near the window hold a frame; the rest are paper.
 *
 *   PrintKit.mount(host, html, o)   lay `html` (the inside of the print root) out in `host`
 *   PrintKit.show(o)                the same in a dialog with Cancel and Print / save PDF
 *   PrintKit.showDoc(o)             a complete document (its own stylesheet, its own page) in a dialog, printed from its frame
 *
 *   o.root       id of the print root the app's print CSS speaks of (default 'print-root')
 *   o.bodyClass  class the app puts on <body> while printing (Archive: 'printing')
 *   o.prepare    function(rootEl) -> Promise|undefined, run once in the frame before the pages are counted (images, floats)
 *   o.keep       function(rootEl), the app's own keep-together pass, run on the linear flow
 *   o.title, o.sub, o.html, o.onPrint, o.onCancel   for show / showDoc
 */
var PrintKit = (function(){
  // the tags are spelled in two pieces: a stylesheet checker reads a literal style tag inside a script as the start of a stylesheet
  var ST = '<' + 'style>', SE = '<' + '/style>', K = 96 / 25.4, cssText = null, pageText = '', gen = 0, openDlg = null;
  function e(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // One @media query list as the printer reads it: print is always, screen is never, a bare width query stays.
  function media(mt){
    var keep = [], always = false;
    String(mt || '').split(',').forEach(function(q){ q = q.trim(); if(!q) return;
      var l = q.toLowerCase();
      if(/^(only\s+)?screen\b/.test(l) || /^not\s+print\b/.test(l)) return;
      if(/^not\s+screen\b/.test(l)){ always = true; return; }
      var m = l.match(/^(?:only\s+)?print\b\s*(?:and\s+)?(.*)$/);
      if(m){ if(m[1]) keep.push(m[1]); else always = true; return; }
      keep.push(q); });
    if(always) return '';
    return keep.length ? keep.join(',') : null;
  }
  function rules(list){ var out = [];
    for(var i = 0; i < list.length; i++){ var r = list[i];
      if(r.type === 4){ var q = media(r.media.mediaText); if(q === null) continue; var inner = rules(r.cssRules); out.push(q === '' ? inner : '@media ' + q + '{' + inner + '}'); }
      else if(r.type === 12 && r.cssRules){ out.push('@supports ' + r.conditionText + '{' + rules(r.cssRules) + '}'); }
      else if(r.type === 6){ pageText += r.cssText + '\n'; }   // the frame is not a printer: the sheet is read from it, not applied
      else out.push(r.cssText); }
    return out.join('\n'); }
  function appCss(){
    if(cssText != null) return cssText;
    var css = ''; pageText = '';
    Array.prototype.forEach.call(document.styleSheets, function(ss){ try{ css += rules(ss.cssRules) + '\n'; }catch(err){} });
    return (cssText = css); }

  // The sheet the document asks for: its size, its margins and the running text in them.
  function geom(html){
    appCss();
    var css = ''; String(html || '').replace(new RegExp('<' + 'style[^>]*>([\\s\\S]*?)<' + '\\/style>', 'gi'), function(_, c){ css += c + '\n'; return ''; });
    css += pageText;
    var W = 210, H = 297, mg = [15, 15, 15, 15];
    var m = css.match(/@page\s*\{\s*size:\s*([^;}]+)/i);
    if(m){ var sz = m[1].toLowerCase(), base = { a3: [297, 420], a4: [210, 297], a5: [148, 210], letter: [216, 279], legal: [216, 356] };
      Object.keys(base).forEach(function(k){ if(new RegExp('\\b' + k + '\\b').test(sz)){ W = base[k][0]; H = base[k][1]; } });
      if(/landscape/.test(sz)){ var t = W; W = Math.max(W, H); H = Math.min(t, H); } }
    var mm = css.match(/@page\s*\{[^}]*?margin:\s*([^;}]+)/i);
    if(mm){ var v = mm[1].trim().split(/\s+/).map(parseFloat); if(v.length && v.every(function(x){ return !isNaN(x); })){
      mg = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : [v[0], v[1], v[2], v[3]]; } }
    var boxes = [];
    css.replace(/@(top|bottom)-(left|center|right)\s*\{([^}]*)\}/g, function(_, vv, hh, body){
      var d = {}; body.split(';').forEach(function(x){ var i = x.indexOf(':'); if(i > 0) d[x.slice(0, i).trim().toLowerCase()] = x.slice(i + 1).trim(); });
      if(!d.content) return '';
      var toks = []; d.content.replace(/"((?:[^"\\]|\\.)*)"|counter\(\s*(page|pages)\s*\)/g, function(_2, s, c){ toks.push(c ? { c: c } : { s: s }); return ''; });
      boxes.push({ v: vv, h: hh, toks: toks, font: d.font || '', color: d.color || '', pad: d['padding-top'] || '', va: (d['vertical-align'] || 'middle').toLowerCase() }); return ''; });
    // Chrome rounds the printable area to 1/64 px; stating it that way makes column n begin at exactly n widths.
    var cw = Math.round((W - mg[1] - mg[3]) * K * 64) / 64, ch = Math.round((H - mg[0] - mg[2]) * K * 64) / 64;
    return { W: W, H: H, mt: mg[0], mr: mg[1], mb: mg[2], ml: mg[3], cw: cw, ch: ch, sw: W * K, sh: H * K, land: W > H, boxes: boxes,
      name: (W === 210 && H === 297) || (W === 297 && H === 210) ? 'A4' : (W === 216 && H === 279) || (W === 279 && H === 216) ? 'Letter' : (W + ' × ' + H + ' mm') }; }
  function cols(s){
    return String(s || '').replace(/page-break-(before|after)\s*:\s*(?:always|left|right)/gi, 'break-$1:column')
      .replace(/break-(before|after)\s*:\s*(?:page|left|right|recto|verso)\b/gi, 'break-$1:column'); }
  function doc(S, i){
    var g = S.G || S.g, o = S.o || {}, th = document.documentElement.getAttribute('data-theme') || 'light', cw = g.cw + 'px', ch = g.ch + 'px', root = o.root || 'print-root';
    // The frame is the paper, not the printable area: a print's `width` media feature is the page's width, margins and all (816px on Letter,
    // 794px on A4), so a rule like (max-width: 800px) holds on Letter and not on A4. The page is clipped to its printable area below.
    var sw = g.sw + 'px', sh = g.sh + 'px', ml = g.ml * K, mt = g.mt * K;
    var ov = 'html.pgv-doc{margin:0!important;padding:0!important;background:#fff!important;width:' + sw + '!important;height:' + sh + '!important;overflow:hidden!important;}'
      + 'html.pgv-doc body{margin:' + mt + 'px 0 0 ' + (i ? ml - i * g.cw : ml) + 'px!important;padding:0!important;min-height:0!important;max-height:none!important;background:#fff!important;display:block!important;width:' + cw + '!important;height:auto!important;overflow:visible!important;}'
      + 'html.pgv-doc.pgv-cols{clip-path:inset(' + mt + 'px ' + g.mr * K + 'px ' + g.mb * K + 'px ' + ml + 'px);}'
      + 'html.pgv-doc.pgv-cols body{height:' + ch + '!important;columns:auto ' + cw + '!important;column-gap:0!important;column-fill:auto!important;}';
    return '<!doctype html><html class="pgv-doc' + (i == null ? '' : ' pgv-cols') + '" data-theme="' + e(th) + '"><head><meta charset="utf-8">' + ST + appCss() + SE + ST + ov + SE + '</head><body class="' + e(o.bodyClass || '') + '"><div id="' + e(root) + '">' + S.inner + '</div></body></html>'; }

  var IC = {
    up: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' };
  function chrome(){
    return '<div class="pgv-bar"><span class="pgv-meta"></span><span class="pgv-sp"></span>'
      + '<button type="button" class="pgv-b" data-a="prev" title="Previous page" aria-label="Previous page">' + IC.up + '</button><span class="pgv-pn" aria-live="polite"></span><button type="button" class="pgv-b" data-a="next" title="Next page" aria-label="Next page">' + IC.down + '</button>'
      + '<span class="pgv-sep"></span><button type="button" class="pgv-b" data-a="out" title="Zoom out" aria-label="Zoom out">' + IC.minus + '</button><span class="pgv-zv"></span><button type="button" class="pgv-b" data-a="in" title="Zoom in" aria-label="Zoom in">' + IC.plus + '</button>'
      + '<span class="pgv-sep"></span><button type="button" class="pgv-b" data-a="width" title="Fit the width of the page">Width</button><button type="button" class="pgv-b" data-a="page" title="Fit the whole page">Page</button></div>'
      + '<div class="pgv-stage" tabindex="0"><div class="pgv-list"></div></div>'; }
  function zoomNow(host){
    var S = host._pgv, st = host.querySelector('.pgv-stage'); if(!S || !st || !S.g) return;
    var cs = getComputedStyle(st), cw = st.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), chh = st.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    var z = S.zoom === 'width' ? cw / S.g.sw : S.zoom === 'page' ? Math.min(cw / S.g.sw, chh / S.g.sh) : S.zoom;
    z = Math.max(.1, Math.min(S.zoom === 'width' || S.zoom === 'page' ? 1 : 3, z)); S.z = z;
    host.querySelector('.pgv-list').style.setProperty('--z', z.toFixed(4));
    host.querySelector('.pgv-zv').textContent = Math.round(z * 100) + '%';
    Array.prototype.forEach.call(host.querySelectorAll('.pgv-bar [data-a=width],.pgv-bar [data-a=page]'), function(b){ b.classList.toggle('on', b.getAttribute('data-a') === S.zoom); });
    current(host); }
  function current(host){
    var S = host._pgv, st = host.querySelector('.pgv-stage'); if(!S || !st || !S.pages) return;
    var mid = st.getBoundingClientRect().top + st.clientHeight * 0.4, cur = 1, pgs = host.querySelectorAll('.pgv-pg');
    for(var i = 0; i < pgs.length; i++){ if(pgs[i].getBoundingClientRect().top <= mid) cur = i + 1; else break; }
    S.cur = cur; host.querySelector('.pgv-pn').textContent = 'Page ' + cur + ' of ' + S.pages;
    host.querySelector('[data-a=prev]').disabled = cur <= 1; host.querySelector('[data-a=next]').disabled = cur >= S.pages; }
  function go(host, i){
    var st = host.querySelector('.pgv-stage'), pgs = host.querySelectorAll('.pgv-pg'); i = Math.max(0, Math.min(pgs.length - 1, i)); if(!pgs[i]) return;
    var top = st.scrollTop + pgs[i].getBoundingClientRect().top - st.getBoundingClientRect().top - 14;
    try{ st.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); }catch(err){ st.scrollTop = Math.max(0, top); } }
  function act(host, a){
    var S = host._pgv; if(!S) return;
    if(a === 'prev') go(host, S.cur - 2); else if(a === 'next') go(host, S.cur);
    else if(a === 'width' || a === 'page'){ S.zoom = a; zoomNow(host); }
    else if(a === 'in' || a === 'out'){ S.zoom = Math.max(.1, Math.min(3, (S.z || 1) * (a === 'in' ? 1.2 : 1 / 1.2))); zoomNow(host); } }
  // Sheet n shows column n.
  function load(host, i){
    var S = host._pgv, win = host.querySelector('.pgv-win[data-i="' + i + '"]'); if(!S || !win || win.firstChild || S.inner == null) return;
    var fr = document.createElement('iframe'); fr.title = 'Page ' + (i + 1); fr.setAttribute('scrolling', 'no'); fr.tabIndex = -1; fr.setAttribute('aria-hidden', 'true');
    fr.onload = function(){ fr.classList.add('on'); };
    var G = S.G || S.g; if(S.f > 1){ fr.style.cssText = 'width:' + G.sw + 'px;height:' + G.sh + 'px;transform:scale(' + (1 / S.f) + ');transform-origin:0 0'; }
    fr.srcdoc = doc(S, i); win.appendChild(fr); S.live[i] = Date.now();
    var keys = Object.keys(S.live); if(keys.length > 8){
      keys.sort(function(a, b){ return Math.abs(a - S.cur + 1) - Math.abs(b - S.cur + 1); });
      keys.slice(8).forEach(function(k){ var w = host.querySelector('.pgv-win[data-i="' + k + '"]'); if(w) w.innerHTML = ''; delete S.live[k]; }); } }
  function showPages(host, S, inner, pages){
    var g = S.g, list = host.querySelector('.pgv-list'), st = host.querySelector('.pgv-stage'), keep = st.scrollTop;
    S.inner = inner; S.pages = pages; S.live = {};
    if(S.io){ try{ S.io.disconnect(); }catch(err){} }
    list.style.setProperty('--sw', g.sw + 'px'); list.style.setProperty('--sh', g.sh + 'px');
    var h = '';
    for(var i = 0; i < pages; i++){
      var mb = g.boxes.map(function(b){
        var txt = b.toks.map(function(t){ return t.c === 'page' ? (i + 1) : t.c === 'pages' ? pages : e(t.s); }).join('');
        var top = b.v === 'top', y = top ? 0 : (g.H - g.mb) * K, hh = (top ? g.mt : g.mb) * K;
        var pos = b.h === 'left' ? 'left:' + g.ml * K + 'px;' : b.h === 'right' ? 'right:' + g.mr * K + 'px;' : 'left:0;right:0;justify-content:center;';
        var al = b.va === 'top' ? 'flex-start' : b.va === 'bottom' ? 'flex-end' : 'center';
        return '<div class="pgv-mb" style="top:' + y + 'px;height:' + hh + 'px;' + pos + 'align-items:' + al + ';' + (b.pad && b.va === 'top' ? 'padding-top:' + b.pad + ';' : '') + (b.font ? 'font:' + b.font + ';' : '') + (b.color ? 'color:' + b.color + ';' : '') + '">' + txt + '</div>'; }).join('');
      h += '<div class="pgv-pg" data-i="' + i + '"><div class="pgv-sheet"><div class="pgv-win" data-i="' + i + '" style="left:0;top:0;width:' + g.sw + 'px;height:' + g.sh + 'px"></div>' + mb + '</div></div>'; }
    list.innerHTML = h;
    host.querySelector('.pgv-meta').textContent = g.name + (g.land ? ' landscape' : ' portrait') + ' · ' + pages + ' page' + (pages === 1 ? '' : 's');
    zoomNow(host); st.scrollTop = keep;
    if(typeof IntersectionObserver === 'function'){
      S.io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting) load(host, +en.target.getAttribute('data-i')); }); }, { root: st, rootMargin: '120% 0px 120% 0px' });
      Array.prototype.forEach.call(list.children, function(c){ S.io.observe(c); });
    } else { for(var j = 0; j < Math.min(pages, 4); j++) load(host, j); }
    host.classList.remove('pgv-busy'); current(host); }

  function mount(host, html, o){
    if(!host) return; o = o || {};
    var S = host._pgv;
    if(!S || !host.querySelector('.pgv-stage')){
      S = host._pgv = { zoom: 'width', z: 1, cur: 1, pages: 0, live: {}, gen: 0, g: null, inner: null, o: o };
      host.classList.add('pgv'); host.innerHTML = chrome();
      host.querySelector('.pgv-bar').addEventListener('click', function(ev){ var b = ev.target.closest && ev.target.closest('[data-a]'); if(b && !b.disabled) act(host, b.getAttribute('data-a')); });
      var st = host.querySelector('.pgv-stage'), raf = 0;
      st.addEventListener('scroll', function(){ if(raf) return; raf = requestAnimationFrame(function(){ raf = 0; current(host); }); }, { passive: true });
      st.addEventListener('keydown', function(ev){
        if(ev.key === 'PageDown' || (ev.key === ' ' && !ev.shiftKey)){ ev.preventDefault(); go(host, S.cur); }
        else if(ev.key === 'PageUp' || (ev.key === ' ' && ev.shiftKey)){ ev.preventDefault(); go(host, S.cur - 2); }
        else if(ev.key === 'Home'){ ev.preventDefault(); go(host, 0); } else if(ev.key === 'End'){ ev.preventDefault(); go(host, S.pages - 1); } });
      if(typeof ResizeObserver === 'function'){ var ro = new ResizeObserver(function(){ zoomNow(host); }); ro.observe(st); S.ro = ro; }
    }
    S.o = o;
    var my = ++S.gen, g = geom(html); S.g = g; host.classList.add('pgv-busy');
    if(!S.pages) host.querySelector('.pgv-list').innerHTML = '<div class="pgv-wait">Laying out the pages…</div>';
    var old = host.querySelector('.pgv-probe'); if(old) old.remove();
    // One pass lays the document out in a hidden frame the size of a sheet (scaled by f) and says what it found.
    function pass(f, inner, first){
      var G = f === 1 ? g : scaleGeom(g, f), probe = document.createElement('iframe');
      probe.className = 'pgv-probe'; probe.setAttribute('aria-hidden', 'true'); probe.tabIndex = -1; probe.style.width = G.sw + 'px'; probe.style.height = G.sh + 'px';
      host.appendChild(probe);
      return new Promise(function(resolve){
        var alive = function(){ return my === S.gen ? probe.contentDocument : null; };
        probe.onload = function(){
          var d = alive(); if(!d){ probe.remove(); return resolve(null); }
          var root = d.getElementById(o.root || 'print-root');
          Promise.resolve().then(function(){ return d.fonts && d.fonts.ready; }).catch(function(){})
            .then(function(){ return first && o.prepare ? o.prepare(root) : null; }).catch(function(){})
            .then(function(){
              if(!alive()){ probe.remove(); return resolve(null); }
              // the app's keep-together pass measures a linear flow at the page's width, as it does before a print, so it runs once, before the columns
              try{ if(first && o.keep) o.keep(root); }catch(err){}
              var need = root.scrollWidth, fin0 = root.innerHTML;
              d.documentElement.classList.add('pgv-cols');
              repeatHeads(d, root, G);
              var fin = root.innerHTML;
              // the column the last box begins in (scrollWidth cannot say: the frame is a sheet wide, which is more than one column)
              var rg = d.createRange(); rg.selectNodeContents(root); var mx = 0;
              Array.prototype.forEach.call(rg.getClientRects(), function(r){ if(r.width > 0 || r.height > 0) mx = Math.max(mx, r.left); });
              var pages = Math.max(1, Math.floor((mx - G.ml * K) / G.cw + 0.001) + 1);
              probe.remove(); resolve({ need: need, fin0: fin0, fin: fin, pages: pages, G: G, f: f }); }); };
        probe.srcdoc = doc({ g: g, G: G, o: o, inner: inner }, null); }); }
    // The printer does not clip what is wider than the page: it lays the page out wider (at most a third) and scales it down to fit.
    pass(1, cols(html), true).then(function(r){
      if(!r) return null;
      var f = Math.min(4 / 3, r.need / g.cw);
      return f > 1.005 ? pass(f, r.fin0, false) : r; })
    .then(function(r){
      if(!r || my !== S.gen) return;
      S.G = r.G; S.f = r.f; showPages(host, S, r.fin, r.pages); });
  }
  // A table's header row is printed again at the top of every page its body runs onto; in columns it is not (Chrome does it for pages
  // only), so the continuation gets a copy before its first row, which moves the rows after it, so the layout is read again until it holds.
  function repeatHeads(d, root, G){
    var x0 = G.ml * K, col = function(el){ return Math.floor((el.getBoundingClientRect().left - x0) / G.cw + 0.001); };
    for(var n = 0; n < 12; n++){
      var added = 0;
      Array.prototype.forEach.call(root.querySelectorAll('table'), function(t){
        var th = t.tHead; if(!th || !th.rows.length) return;
        var rows = []; Array.prototype.forEach.call(t.tBodies, function(b){ rows = rows.concat(Array.prototype.slice.call(b.rows)); });
        var prev = col(th.rows[0]);
        for(var i = 0; i < rows.length; i++){
          var c = col(rows[i]), before = rows[i].previousElementSibling;
          if(rows[i].classList.contains('pgv-rep')){ prev = c; continue; }
          if(c > prev && !(before && before.classList.contains('pgv-rep'))){
            Array.prototype.forEach.call(th.rows, function(h){ var cl = h.cloneNode(true); cl.classList.add('pgv-rep'); rows[i].parentNode.insertBefore(cl, rows[i]); });
            added++; return; }
          prev = c; } });
      if(!added) break; } }
  // the geometry the frame is laid out in when the printer lays the page wider and scales it back by 1/f
  function scaleGeom(g, f){
    var G = {}; Object.keys(g).forEach(function(k){ G[k] = g[k]; });
    G.sw = g.sw * f; G.sh = g.sh * f; G.ml = g.ml * f; G.mr = g.mr * f; G.mt = g.mt * f; G.mb = g.mb * f;
    G.cw = Math.round(g.cw * f * 64) / 64; G.ch = Math.round(g.ch * f * 64) / 64; return G; }

  // ── a dialog of its own, for the apps whose print was one click ───────────────────────────────────────────────
  function dialog(o, inner, onReady){
    close(true);
    var back = document.createElement('div'); back.className = 'prk-back'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true'); back.setAttribute('aria-label', 'Print preview');
    back.innerHTML = '<div class="prk-card"><div class="prk-t">' + e(o.title || 'Print preview') + '<span class="prk-sub">' + e(o.sub || 'the pages shown are the pages that print') + '</span></div>'
      + '<div class="prk-prev">' + inner + '</div>'
      + '<div class="prk-act"><button type="button" class="prk-btn" data-a="cancel">Cancel</button><button type="button" class="prk-btn prk-go" data-a="print">Print / save PDF</button></div></div>';
    document.body.appendChild(back);
    var d = openDlg = { el: back, o: o };
    back.addEventListener('click', function(ev){
      if(ev.target === back){ close(); return; }
      var b = ev.target.closest && ev.target.closest('.prk-btn'); if(!b) return;
      if(b.getAttribute('data-a') === 'cancel') close(); else print(); });
    d.key = function(ev){ if(ev.key === 'Escape'){ ev.stopPropagation(); close(); } };
    document.addEventListener('keydown', d.key, true);
    var go = back.querySelector('.prk-go'); if(go) go.focus();
    onReady(back.querySelector('.prk-prev'));
    return d; }
  function close(silent){
    var d = openDlg; if(!d) return; openDlg = null;
    document.removeEventListener('keydown', d.key, true);
    if(d.el.parentNode) d.el.parentNode.removeChild(d.el);
    if(!silent && d.o.onCancel) d.o.onCancel(); }
  function print(){
    var d = openDlg; if(!d) return; var o = d.o, fr = d.frame; openDlg = null;
    document.removeEventListener('keydown', d.key, true);
    var gone = function(){ if(d.el.parentNode) d.el.parentNode.removeChild(d.el); };
    if(fr){
      // a printed frame is named after the page that holds it, so the page is named for the file for as long as the print takes;
      // the frame stays in the page until the print is over (a frame taken out of the page has no window to print)
      var was = document.title, back = function(){ document.title = was; window.removeEventListener('afterprint', back); };
      if(o.title) document.title = String(o.title).replace(/[\\/:*?"<>|]/g, '-'); window.addEventListener('afterprint', back); setTimeout(back, 12000);
      try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(err){ back(); }
      gone(); return; }
    gone();
    if(o.onPrint) o.onPrint(); }
  function show(o){ return dialog(o, '', function(host){ mount(host, o.html, o); }); }
  // A complete document that already knows how to look on screen and on paper (the freezer sheets): shown in its own frame.
  function showDoc(o){
    return dialog(o, '<iframe class="prk-doc" title="Preview"></iframe>', function(host){
      var fr = host.querySelector('iframe'); openDlg.frame = fr; fr.srcdoc = o.html; }); }
  return { mount: mount, show: show, showDoc: showDoc, close: close, geom: geom, doc: doc, media: media, appCss: appCss };
})();
