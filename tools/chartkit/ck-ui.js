/* ChartKit UI — the editor around the scene.
 *
 *   ChartKit.mount(el, { key, doc: function(){ return doc; }, filename: function(){ return 'name'; }, toast: function(msg, kind){} })
 *     → { refresh(), draw() }
 *
 * Click anything on the chart to edit it; drag titles and the legend (they snap to each other, to the plot and to
 * the figure's centre — hold Alt to move freely; arrow keys nudge). The settings are a menu along the top of the figure, each
 * entry saying what is set in it: Compounds (which are drawn, their colours and palette, replicates to omit), Chart, Axes,
 * Text & legend, Table and Page. An entry opens in a column at the right of the figure, so every change is seen as it is made;
 * clicking a thing on the figure opens its entry. Export is PNG at 300 / 600 / 1200 dpi, a vector PDF, SVG, and the table as Copy / CSV / Excel.
 */
var ChartKit = (function(){
  var C = ChartKitCore, X = ChartKitExport;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var DRAG = /^(title\d|xTitle|yTitle|legend)$/;
  var TEXTS = { title0: 'Title, line 1', title1: 'Title, line 2', title2: 'Title, line 3', xTitle: 'X axis title', yTitle: 'Y axis title' };
  var PAGES = [['1 column', 3.4, 2.7], ['1.5 columns', 5, 3.5], ['2 columns', 6.5, 4.2], ['Slide', 9, 5.2], ['Square', 4.5, 4.5]];

  function get(o, path){ return path.split('.').reduce(function(a, k){ return a == null ? a : a[k]; }, o); }
  function put(o, path, v){ var ks = path.split('.'), t = o; for (var i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null || typeof t[ks[i]] !== 'object') t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; }

  function mount(root, opts){
    opts = opts || {};
    var KEY = 'ck2:' + (opts.key || 'chart'), spec, doc = { items: [] }, scene = null, sel = null, cur = null, undo = [], redo = [], lastUndoKey = '', lastUndoAt = 0, dpi = 1200, saveT = 0, drag = null, openItems = {}, cmode = null, palOpen = false;
    try { spec = C.withDefaults(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { spec = C.withDefaults(null); }

    root.classList.add('ck-root'); root.setAttribute('tabindex', '-1');
    root.innerHTML =
      '<div class="ck-stage">' +
        '<div class="ck-bar" role="toolbar" aria-label="Chart">' +
          '<div class="ck-slot"></div>' +
          '<div class="ck-seg ck-kind" role="group" aria-label="Chart type"><button type="button" data-kind="auto">Auto</button><button type="button" data-kind="bars">Bars</button><button type="button" data-kind="xy">Curves</button></div>' +
          '<span class="ck-sep"></span>' +
          '<button type="button" class="ck-btn" data-a="undo" title="Undo (⌘Z)">Undo</button><button type="button" class="ck-btn" data-a="redo" title="Redo (⇧⌘Z)">Redo</button>' +
          '<span class="ck-gap"></span>' +
          '<select class="ck-dpi" aria-label="PNG resolution" data-a="dpi"><option value="300">300 dpi</option><option value="600">600 dpi</option><option value="1200">1200 dpi</option></select>' +
          '<button type="button" class="ck-btn ck-pri" data-a="png">PNG</button><button type="button" class="ck-btn ck-pri" data-a="pdf">PDF</button><button type="button" class="ck-btn" data-a="svg">SVG</button>' +
        '</div>' +
        '<div class="ck-menurow"><div class="ck-menu" role="toolbar" aria-label="Settings"></div><span class="ck-gap"></span>' +
          '<label class="ck-chk ck-tblchk" title="Add a table of the fitted values for the compounds drawn under the figure. It is part of the PNG, PDF and SVG; what it holds is set under Table." hidden><span class="ck-tog"><input type="checkbox" data-p="table.show" data-t="bool"><i></i></span> Add table</label>' +
          '<label class="ck-chk" title="Titles and the legend snap to each other, to the plot and to the centre of the figure. Hold Alt to move freely."><span class="ck-tog"><input type="checkbox" data-a="snap"><i></i></span> Snap &amp; align</label>' +
        '</div>' +
        '<div class="ck-canvas"><svg class="ck-svg" role="img" aria-label="Chart preview"></svg></div>' +
        '<div class="ck-status" aria-live="polite" data-hint="Click anything in the figure to edit it. Drag titles and the legend; they snap to the plot and to each other (Alt moves freely, arrow keys nudge)."></div>' +
      '</div>' +
      '<div class="ck-panel" role="region" aria-label="Settings" hidden>' +
        '<div class="ck-ph"><span class="ck-pt"></span><span class="ck-pbtns">' +
          '<button type="button" class="ck-ib" data-a="closepop" aria-label="Close" title="Close (Esc)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</span></div>' +
        '<div class="ck-scroll"><div class="ck-sel" hidden></div><div class="ck-body"></div></div>' +
      '</div>';
    var svg = root.querySelector('.ck-svg'), panel = root.querySelector('.ck-body'), selBox = root.querySelector('.ck-sel'), status = root.querySelector('.ck-status'), menu = root.querySelector('.ck-menu'), pop = root.querySelector('.ck-panel'), scroller = root.querySelector('.ck-scroll');
    // the column is closed when the editor opens, so the figure has the whole width until an entry is chosen
    function motion(){ return !!pop.animate && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) && !document.hidden; }

    function toast(m, k){ if (opts.toast) opts.toast(m, k); status.textContent = m; status.classList.remove('ck-warnline'); lastFitNote = ''; }
    // Only the style is kept between visits. What was omitted, hidden, recoloured, moved or retitled belongs to the data it
    // was done to: a replicate left out of one experiment must not be silently left out of the next.
    function persistable(){
      var o = JSON.parse(JSON.stringify(spec)); o.omit = {}; o.hidden = {}; o.seen = {}; o.colors = {}; o.pos = {};
      o.title.forEach(function(t){ t.text = null; }); o.xTitle.text = null; o.yTitle.text = null; o.ref.y = null;
      return o;
    }
    function save(){ clearTimeout(saveT); saveT = setTimeout(function(){ try { localStorage.setItem(KEY, JSON.stringify(persistable())); } catch (e) {} }, 300); }
    function pushUndo(k){
      var now = Date.now(); if (k && k === lastUndoKey && now - lastUndoAt < 700) { lastUndoAt = now; return; }
      lastUndoKey = k || ''; lastUndoAt = now; undo.push(JSON.stringify(spec)); if (undo.length > 60) undo.shift(); redo = []; syncBar();
    }
    function restore(s){ spec = C.withDefaults(JSON.parse(s)); draw(); renderPanel(); save(); syncBar(); }
    function doUndo(){ if (!undo.length) return; redo.push(JSON.stringify(spec)); restore(undo.pop()); }
    function doRedo(){ if (!redo.length) return; undo.push(JSON.stringify(spec)); restore(redo.pop()); }
    function syncBar(){
      root.querySelector('[data-a=undo]').disabled = !undo.length; root.querySelector('[data-a=redo]').disabled = !redo.length;
      if (!hasTable() && cur === 'table') closeMenu();
      var tc = root.querySelector('.ck-tblchk'); if (tc) { tc.hidden = !hasTable(); tc.querySelector('input').checked = !!spec.table.show; }
      root.querySelector('[data-a=snap]').checked = !!spec.snap; root.querySelector('[data-a=dpi]').value = String(dpi);
      root.querySelectorAll('.ck-kind button').forEach(function(b){ b.classList.toggle('active', b.dataset.kind === spec.kind); });
      renderMenu();
    }

    // ── drawing ────────────────────────────────────────────────
    function scale(){ var r = svg.getBoundingClientRect(); return scene && r.width ? r.width / scene.W : 1; }
    // What is dragged is stored in the reference page's points (the scene is multiplied by k afterwards), so a title put
    // somewhere stays there when the page is made larger or smaller.
    function kk(){ return scene && scene.k || 1; }
    // The figure takes the room the host leaves it — the window's height below where it starts — and is drawn as large as fits that
    // room and its width, whatever its shape; on a narrow window it takes the width and the panel goes under it.
    function narrow(){ return window.matchMedia && window.matchMedia('(max-width:900px)').matches; }
    function fit(){
      if (!root.offsetParent || !scene) return;
      var cv = root.querySelector('.ck-canvas'), cs = getComputedStyle(cv), pw = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), ph = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), nar = narrow();
      if (nar) root.style.height = '';
      else { var room = opts.room ? opts.room() : window.innerHeight - root.getBoundingClientRect().top - (opts.bottom === undefined ? 16 : opts.bottom); root.style.height = Math.max(440, Math.round(room)) + 'px'; }
      var aw = cv.clientWidth - pw, ah = nar ? Infinity : cv.clientHeight - ph;
      if (aw <= 0) return;
      var f = Math.min(aw / scene.W, ah / scene.H);
      svg.style.width = Math.floor(scene.W * f) + 'px'; svg.style.height = Math.floor(scene.H * f) + 'px';
    }
    function draw(){
      scene = C.build(doc, spec);
      var s = X.toSVG(scene, { transparent: true });
      var inner = s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'));
      svg.setAttribute('viewBox', '0 0 ' + scene.W.toFixed(2) + ' ' + scene.H.toFixed(2));
      fit();
      svg.innerHTML = inner + '<g class="ck-ov"></g>';
      var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); bg.setAttribute('width', scene.W); bg.setAttribute('height', scene.H); bg.setAttribute('fill', '#ffffff'); bg.setAttribute('class', 'ck-paper'); svg.insertBefore(bg, svg.firstChild.nextSibling || null);
      overlay(); pngNote(); fitNote(); renderMenu();
    }
    if (window.ResizeObserver) { var ro = new ResizeObserver(function(){ fit(); overlay(); }); ro.observe(root.querySelector('.ck-canvas')); ro.observe(root); }
    // A curve that cannot be refitted without the replicates left out is not drawn; say so where the figure is, not only under Compounds.
    var lastFitNote = '';
    function fitFailed(){ return scene && scene.kind === 'xy' ? scene.items.filter(function(i){ return i.refitFailed && !i.hidden; }) : []; }
    function fitNote(){
      var f = fitFailed(), msgs = [];
      if (f.length) msgs.push((f.length === 1 ? f[0].name : f.length + ' compounds') + ': too few points are left to refit, so ' + (f.length === 1 ? 'its curve is' : 'their curves are') + ' not drawn. Put a replicate back to bring ' + (f.length === 1 ? 'it' : 'them') + ' back.');
      if (scene && scene.grew) msgs.push('The labels need more room than ' + scene.grew.askedW.toFixed(1) + ' × ' + scene.grew.askedH.toFixed(1) + ' in, so the figure is made ' + scene.grew.w.toFixed(1) + ' × ' + scene.grew.h.toFixed(1) + ' in. A larger page, a smaller legend or fewer compounds keeps the size you asked for.');
      var msg = msgs.join(' ');
      if (msg) { status.textContent = msg; status.classList.add('ck-warnline'); lastFitNote = msg; }
      else if ((doc.items || []).length > 1 && (doc.items || []).every(function(it){ return spec.hidden[it.id]; })) { lastFitNote = 'Nothing is drawn yet — tick the compounds to show under Compounds.'; status.textContent = lastFitNote; status.classList.remove('ck-warnline'); }
      else if (lastFitNote && status.textContent === lastFitNote) { status.textContent = ''; status.classList.remove('ck-warnline'); lastFitNote = ''; }
    }
    function rectOf(node){ var r = node.getBoundingClientRect(), o = svg.getBoundingClientRect(), k = scale(); return { l: (r.left - o.left) / k, t: (r.top - o.top) / k, r: (r.right - o.left) / k, b: (r.bottom - o.top) / k }; }
    function nodeOf(id){ var n = svg.querySelectorAll('[data-el]'); for (var i = 0; i < n.length; i++) if (n[i].dataset.el === id) return n[i]; return null; }
    function overlay(guides){
      var ov = svg.querySelector('.ck-ov'); if (!ov) return; var h = '';
      if (sel) { var id = sel.indexOf('leg:') === 0 ? 'legend' : sel, nd = nodeOf(id) || nodeOf(sel); if (nd) { var r = rectOf(nd); h += '<rect class="ck-selbox" x="' + (r.l - 3).toFixed(1) + '" y="' + (r.t - 3).toFixed(1) + '" width="' + (r.r - r.l + 6).toFixed(1) + '" height="' + (r.b - r.t + 6).toFixed(1) + '" fill="none"/>'; } }
      (guides || []).forEach(function(g){ h += g.v ? '<line class="ck-guide" x1="' + g.v.toFixed(1) + '" y1="0" x2="' + g.v.toFixed(1) + '" y2="' + scene.H + '"/>' : '<line class="ck-guide" x1="0" y1="' + g.h.toFixed(1) + '" x2="' + scene.W + '" y2="' + g.h.toFixed(1) + '"/>'; });
      ov.innerHTML = h;
    }

    // ── selection ──────────────────────────────────────────────
    // a title line is spec.title[n]; xTitle and yTitle are keys of their own
    function tpath(id){ return id.indexOf('title') === 0 ? 'title.' + id.slice(5) : id; }
    function itemOf(id){ var m = /^(?:bar|fit|pt|leg):(.+)$/.exec(id || ''); return m ? m[1] : null; }
    // the entry a thing on the chart belongs to: clicking it opens that entry. A title or the legend can be dragged, so it opens on release (defer).
    function secOfSel(id){ if (!id) return null; if (TEXTS[id] || id === 'legend') return 'text'; if (itemOf(id)) return 'compounds'; if (id === 'table') return 'table'; if (id === 'ref' || id === 'axisX' || id === 'axisY') return 'axes'; return null; }
    function select(id, defer){
      if ((id || null) !== sel) cmode = null; sel = id || null; overlay();
      var sc = secOfSel(sel);
      if (sc && !defer && (sc !== 'table' || hasTable())) openMenu(sc); else { renderSel(); if (cur) renderPanel(); }
      if (sc && !defer && TEXTS[sel]) { var ti = panel.querySelector('[data-text="' + sel + '"]'); if (ti && ti.scrollIntoView) ti.scrollIntoView({ block: 'nearest' }); }
    }
    function hasTable(){ return !!(doc.table && doc.table.cols && doc.table.cols.length); }
    function renderSel(){
      var h = '', done = '<button type="button" class="ck-link" data-a="deselect">Done</button>';
      if (!sel || secOfSel(sel) !== cur) { selBox.innerHTML = ''; selBox.hidden = true; return; }
      if (TEXTS[sel]) h = '<div class="ck-selh"><b>' + TEXTS[sel] + '</b>' + done + '</div><div class="ck-hint">Its words, size and style are in the list below. Drag it in the figure to move it.</div>' + alignRow();
      else if (sel === 'legend') h = '<div class="ck-selh"><b>Legend</b>' + done + '</div><div class="ck-row"><button type="button" class="ck-btn" data-a="hideleg">Hide the legend</button></div>' + alignRow();
      else if (sel === 'table') h = '<div class="ck-selh"><b>Table</b>' + done + '</div><div class="ck-hint">What it holds, its layout and its format are below.</div>';
      else if (itemOf(sel)) {
        var id = itemOf(sel), it = (doc.items || []).filter(function(x){ return x.id === id; })[0], ci = (doc.items || []).indexOf(it);
        if (it) {
          var col = C.itemColor(spec, it, ci, (doc.items || []).length), pal = C.PALETTES.filter(function(p){ return p.id === spec.palette; })[0] || C.PALETTES[0];
          var pcs = palColors(pal), inPal = !spec.colors[id] || pcs.some(function(c){ return c.toLowerCase() === col.toLowerCase(); }), mode = cmode || (inPal ? 'palette' : 'full');
          h = '<div class="ck-selh"><b>' + esc(it.name) + '</b>' + done + '</div>' +
            '<div class="ck-seg ck-cm ck-segf" role="group" aria-label="Where the colour comes from"><button type="button" class="' + (mode === 'palette' ? 'active' : '') + '" aria-pressed="' + (mode === 'palette') + '" data-cm="palette">Within the palette</button><button type="button" class="' + (mode === 'full' ? 'active' : '') + '" aria-pressed="' + (mode === 'full') + '" data-cm="full">Full spectrum</button></div>' +
            (mode === 'palette'
              ? '<div class="ck-sw">' + pcs.map(function(c){ return '<button type="button" class="ck-swb' + (c.toLowerCase() === col.toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-a="setcolor" data-id="' + esc(id) + '" data-c="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>'
              : '<div class="ck-row"><label class="ck-f"><span>Colour</span><input class="ck-color" type="color" data-item="' + esc(id) + '" value="' + col + '"></label>' +
                '<label class="ck-f"><span>Hex</span><input class="ck-in ck-hex" type="text" maxlength="7" data-hex="' + esc(id) + '" value="' + col + '" aria-label="Hex colour of ' + esc(it.name) + '"></label></div>') +
            '<div class="ck-row"><button type="button" class="ck-link" data-a="resetcolor" data-id="' + esc(id) + '">Back to the palette</button><button type="button" class="ck-link" data-a="hideitem" data-id="' + esc(id) + '">Hide</button></div>';
        }
      } else if (sel === 'ref') h = '<div class="ck-selh"><b>Reference line</b>' + done + '</div><div class="ck-hint">Its value and style are in Reference line, below.</div>';
      else if (sel === 'axisX' || sel === 'axisY') h = '<div class="ck-selh"><b>' + (sel === 'axisX' ? 'X' : 'Y') + ' axis</b>' + done + '</div><div class="ck-hint">Range, ticks and line width are below.</div>';
      selBox.innerHTML = h; selBox.hidden = false;
    }
    function palColors(pal){ return pal.ramp ? Array.apply(null, Array(12)).map(function(_, i){ return C.blueRamp(i, 12); }) : pal.c; }
    function alignRow(){ return '<div class="ck-row ck-align"><button type="button" class="ck-btn" data-al="cx">Centre on plot</button><button type="button" class="ck-btn" data-al="fx">Centre on figure</button><button type="button" class="ck-link" data-a="resetpos">Reset position</button></div>'; }
    function defaultText(id){ if (id === 'xTitle') return doc.xTitle || ''; if (id === 'yTitle') return doc.yTitle || ''; return (doc.title && doc.title[+id.slice(5)]) || ''; }

    // ── the panel: sections that fold ──────────────────────────
    // A setting is a row: its name at the left, the control at the right (a switch for yes/no, a segmented control for a few choices, a box
    // for a number). A short hint under the name where the name alone is not enough.
    function hintOf(o){ return o && o.hint ? '<small>' + o.hint + '</small>' : ''; }
    function setRow(label, ctl, o){ o = o || {}; return '<div class="ck-set' + (o.cls ? ' ' + o.cls : '') + '"><span class="ck-sl">' + label + hintOf(o) + '</span><span class="ck-ctl">' + ctl + '</span></div>'; }
    function segHtml(path, opts, num){
      var cur = String(get(spec, path));
      return '<span class="ck-seg ck-segf" role="group">' + opts.map(function(x){ var on = cur === String(x[0]); return '<button type="button" class="' + (on ? 'active' : '') + '" aria-pressed="' + on + '" data-tset="' + path + '" data-v="' + x[0] + '"' + (num ? ' data-n="1"' : '') + '>' + x[1] + '</button>'; }).join('') + '</span>';
    }
    function fld(label, path, type, o){
      o = o || {}; var v = get(spec, path), rg = C.RANGE[path]; if (rg) { if (o.min === undefined) o.min = rg[0]; if (o.max === undefined) o.max = rg[1]; }
      if (type === 'bool') return '<label class="ck-set ck-sett"><span class="ck-sl">' + label + hintOf(o) + '</span><span class="ck-tog"><input type="checkbox" data-p="' + path + '" data-t="bool"' + (v ? ' checked' : '') + '><i></i></span></label>';
      if (type === 'sel' && o.seg) return '<div class="ck-set ck-setseg"><span class="ck-sl">' + label + hintOf(o) + '</span>' + segHtml(path, o.opts, o.num) + '</div>';
      var ctl;
      if (type === 'sel') ctl = '<select class="ck-in" data-p="' + path + '" data-t="' + (o.num ? 'selnum' : 'str') + '" aria-label="' + esc(label) + '">' + o.opts.map(function(x){ return '<option value="' + x[0] + '"' + (String(v) === String(x[0]) ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>';
      else ctl = '<input class="ck-in ck-num" type="number" step="' + (o.step || 'any') + '"' + (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + ' data-p="' + path + '" data-t="' + (o.auto ? 'numauto' : 'num') + '" value="' + (v === null || v === undefined ? '' : v) + '"' + (o.auto ? ' placeholder="auto"' : '') + ' aria-label="' + esc(label) + '">';
      return setRow(label, ctl, o);
    }
    function pair(a, b){ return '<div class="ck-pair">' + a + b + '</div>'; }
    function pf(label, path, o){ o = o || {}; var v = get(spec, path), rg = C.RANGE[path]; if (rg) { if (o.min === undefined) o.min = rg[0]; if (o.max === undefined) o.max = rg[1]; } return '<label class="ck-f"><span>' + label + '</span><input class="ck-in" type="number" step="' + (o.step || 'any') + '"' + (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + ' data-p="' + path + '" data-t="' + (o.auto ? 'numauto' : 'num') + '" value="' + (v === null || v === undefined ? '' : v) + '"' + (o.auto ? ' placeholder="auto"' : '') + '></label>'; }
    function grp(title, inner, note){ return '<div class="ck-sg"><div class="ck-sgh">' + title + '</div>' + inner + (note ? '<div class="ck-note">' + note + '</div>' : '') + '</div>'; }

    var SEC_T = { compounds: 'Compounds', chart: 'Chart', axes: 'Axes', text: 'Text & legend', table: 'Table', page: 'Page' };
    var SEC_L = { compounds: 'Compounds', chart: 'Chart', axes: 'Axes', text: 'Text', table: 'Table', page: 'Page' };
    function palName(){ var p = C.PALETTES.filter(function(x){ return x.id === spec.palette; })[0]; return p ? p.name : ''; }
    // what an entry of the menu says is set in it (kept short: it sits under the entry's name)
    function secShort(id){
      var kind = scene ? scene.kind : 'bars', its = doc.items || [], nOn = its.filter(function(it){ return !spec.hidden[it.id]; }).length;
      if (id === 'compounds') return its.length ? nOn + ' of ' + its.length + ' drawn' : 'none yet';
      if (id === 'chart') return (kind === 'bars' ? 'Bars' : 'Curves') + ' · ' + ({ sd: 'SD', sem: 'SEM', ci95: '95% CI', range: 'range', none: 'no bars' }[spec.err.type] || 'SD');
      if (id === 'axes') { var rg = function(a){ return a.min !== null && a.min !== '' && a.max !== null && a.max !== '' ? a.min + '–' + a.max : 'auto'; }; var uo = C.xUnitOf(doc, spec); return kind === 'xy' && uo.to ? uo.to + ' · ' + (spec.y.log ? 'log ' : '') + 'Y ' + rg(spec.y) : 'Y ' + (spec.y.log ? 'log ' : '') + rg(spec.y); }
      if (id === 'text') return 'legend ' + (spec.legend.show ? (spec.legend.pos === 'auto' ? 'auto' : spec.legend.pos) : 'off');
      if (id === 'table') { if (!spec.table.show) return 'off'; var n = doc.table.cols.filter(function(c){ return spec.table.cols[c.id] === undefined ? c.on : !!spec.table.cols[c.id]; }).length; return 'on · ' + n + ' value' + (n === 1 ? '' : 's'); }
      if (id === 'page') return +spec.w.toFixed(1) + ' × ' + +spec.h.toFixed(1) + ' in';
      return '';
    }
    function secBody(id){
      var kind = scene ? scene.kind : 'bars';
      if (id === 'compounds') return compoundsHtml();
      if (id === 'chart') return chartHtml(kind);
      if (id === 'axes') return axesHtml(kind);
      if (id === 'text') return textHtml();
      if (id === 'table') return tableHtml();
      if (id === 'page') return pageHtml();
      return '';
    }
    function secIds(){ return Object.keys(SEC_T).filter(function(i){ return i !== 'table' || hasTable(); }); }
    // the menu along the top of the figure: the buttons are kept (focus stays on the one you pressed), only their state and summary change
    function renderMenu(){
      var ids = secIds(), key = ids.join(',');
      if (menu.dataset.ids !== key) { menu.innerHTML = ids.map(function(id){ return '<button type="button" class="ck-mt" data-menu="' + id + '" aria-expanded="false" aria-haspopup="true"><span class="ck-mn">' + SEC_L[id] + '</span><span class="ck-ms"></span></button>'; }).join(''); menu.dataset.ids = key; }
      ids.forEach(function(id){
        var b = menu.querySelector('[data-menu="' + id + '"]'), on = cur === id, t = secShort(id), m = b.querySelector('.ck-ms');
        b.classList.toggle('on', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); if (m.textContent !== t) m.textContent = t;
      });
    }
    // the column at the right of the figure (under the figure on a narrow window)
    function docked(){ return !narrow(); }
    function renderPanel(){
      if (cur === 'table' && !hasTable()) cur = null;
      renderMenu();
      if (!cur) { if (!pop.hidden && !pop.getAnimations().length) pop.hidden = true; root.classList.remove('ck-dock'); return; }
      pop.hidden = false; root.classList.toggle('ck-dock', docked());
      root.querySelector('.ck-pt').textContent = SEC_T[cur];
      var top = scroller.scrollTop; panel.innerHTML = secBody(cur); renderSel(); scroller.scrollTop = top;
      pngNote(); scaleNote();
    }
    // open an entry: the card fades in under it, or, when another entry was open, glides across to the new one while its content fades in
    function openMenu(id){
      if (!SEC_T[id] || (id === 'table' && !hasTable())) return;
      var was = cur, wasHidden = pop.hidden;
      cur = id; renderPanel();
      if (was === id && !wasHidden) return;
      if (!motion()) return;
      pop.getAnimations().forEach(function(a){ a.cancel(); });
      if (wasHidden || !was) pop.animate([{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'none' }], { duration: 170, easing: 'cubic-bezier(.2,.8,.3,1)' });
      else {
        scroller.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
      }
    }
    function closeMenu(){
      if (!cur) return;
      cur = null; renderMenu(); root.classList.remove('ck-dock');
      if (!motion() || pop.hidden) { pop.hidden = true; return; }
      var a = pop.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(10px)' }], { duration: 120, easing: 'ease-out' });
      a.onfinish = a.oncancel = function(){ if (!cur) pop.hidden = true; };
    }
    function setSection(id, on){ if (on) openMenu(id); else if (cur === id) closeMenu(); }

    function chartHtml(kind){
      return (kind === 'bars'
        ? grp('Bars', fld('Fill', 'fill', 'sel', { opts: [['solid', 'Solid'], ['tint', 'Light fill, coloured border'], ['outline', 'Outline only']] }) + fld('Width', 'bar.width', 'num', { step: 0.05, min: 0.2, max: 1.2 }) + fld('Gap between groups', 'bar.gap', 'num', { step: 0.1, min: 0, max: 4 }) + fld('Gap inside a group', 'bar.inner', 'num', { step: 0.05, min: 0, max: 1 }) + fld('Border', 'bar.border', 'num', { step: 0.25, min: 0, max: 5 }) + fld('Shade by concentration', 'bar.shade', 'bool', { hint: 'highest darkest' }) + fld('Every replicate as a point', 'pts.show', 'bool'))
        : grp('Points', fld('Marker', 'xy.marker', 'sel', { opts: [['circle', 'Circle'], ['square', 'Square'], ['triangle', 'Triangle'], ['diamond', 'Diamond'], ['auto', 'One per compound']] }) + fld('Marker size', 'xy.msize', 'num', { step: 0.5, min: 1, max: 14 }) + fld('Show the points', 'xy.points', 'bool') + fld('Name each point', 'xy.labels', 'bool', { hint: 'the compound beside its point; names that would overlap are left out' }) + fld('Open markers', 'xy.open', 'bool') + fld('Every replicate beside its mean', 'pts.show', 'bool')) +
          grp('Curves', fld('Show the fit', 'xy.fit', 'bool') + fld('Join the points with a line', 'xy.join', 'bool') + fld('Line width', 'xy.lw', 'num', { step: 0.25, min: 0.25, max: 6 }) + fld('Dashed', 'xy.dash', 'bool') + fld('Extend across the whole axis', 'xy.extend', 'bool', { hint: 'a curve past the data is a guess' }))) +
        grp('Error bars', fld('Show', 'err.type', 'sel', { seg: true, opts: [['sd', 'SD'], ['sem', 'SEM'], ['ci95', '95% CI'], ['range', 'Range'], ['none', 'None']] }) + (kind === 'bars' ? fld('Direction', 'err.dir', 'sel', { seg: true, opts: [['up', 'Up only'], ['both', 'Both ways']] }) : '') + fld('Cap', 'err.cap', 'num', { step: 0.5, min: 0, max: 16 }) + fld('Width', 'err.w', 'num', { step: 0.25, min: 0.25, max: 5 }));
    }
    function axesHtml(kind){
      var yBad = C.fin(+spec.y.min) && C.fin(+spec.y.max) && spec.y.min !== null && spec.y.max !== null && +spec.y.min >= +spec.y.max;
      return grp('Y axis', pair(pf('Minimum', 'y.min', { auto: 1 }), pf('Maximum', 'y.max', { auto: 1 })) + pair(pf('Major step', 'y.major', { auto: 1 }), pf('Decimals', 'y.dec', { auto: 1, step: 1 })) + (yBad ? '<div class="ck-warn">The maximum has to be above the minimum — the axis is on auto until it is.</div>' : '') + fld('Logarithmic', 'y.log', 'bool')) +
        grp('X axis', (doc.xUnit ? fld('Concentration unit', 'x.unit', 'sel', { seg: true, opts: [['auto', 'Auto'], ['M', 'M'], ['mM', 'mM'], ['\u00b5M', '\u00b5M'], ['nM', 'nM'], ['pM', 'pM']], hint: spec.x.unit === 'auto' ? 'Auto keeps ' + doc.xUnit + ', chosen from your data' : 'the numbers on the axis, the curves and the title follow' }) : '') + (kind === 'xy' && doc.xScale !== 'lin' ? fld('Numbers on the axis', 'x.fmt', 'sel', { seg: true, opts: [['auto', 'Auto'], ['plain', 'Numbers'], ['pow', 'Powers'], ['log', 'log']], hint: spec.x.fmt === 'log' ? 'log of the molar concentration, as Prism writes it' : 'Numbers 0.1, 1, 10 · Powers 10\u207b\u2079' }) : '') + (kind === 'bars' ? fld('Label angle', 'x.rot', 'sel', { seg: true, num: 1, opts: [[0, 'Flat'], [45, '45°'], [90, 'Vertical']] }) + fld('Order', 'x.order', 'sel', { seg: true, opts: [['given', 'As given'], ['desc', 'High → low'], ['asc', 'Low → high']] }) + fld('Concentration labels', 'x.labels', 'bool') : pair(pf('Minimum', 'x.min', { auto: 1 }), pf('Maximum', 'x.max', { auto: 1 })))) +
        grp('Lines', fld('Axis width', 'axisW', 'num', { step: 0.25, min: 0.25, max: 5 }) + fld('Tick length', 'tick', 'num', { step: 0.5, min: 0, max: 12 }) + fld('Box around the plot', 'box', 'bool') + fld('Horizontal grid', 'grid', 'bool')) +
        grp('Reference line', fld('Show', 'ref.show', 'bool') + pair(pf('At', 'ref.y', { auto: 1 }), pf('Width', 'ref.w', { step: 0.25, min: 0.25, max: 5 })) + fld('Dotted', 'ref.dash', 'bool'));
    }
    // every line of text is edited where it is listed: its words, its size, bold and italic. Clicking it in the figure marks its row.
    function textLine(id, label){
      var tt = id.indexOf('title') === 0 ? spec.title[+id.slice(5)] : spec[id], cur = tt.text === null ? defaultText(id) : tt.text, sp = tpath(id);
      return '<div class="ck-tl' + (sel === id ? ' on' : '') + '"><div class="ck-tlh">' + label + '</div><div class="ck-tlr"><input class="ck-in ck-txt" type="text" data-text="' + id + '" value="' + esc(cur) + '" aria-label="' + label + '" placeholder="Empty hides it">' +
        '<input class="ck-in ck-sz" type="number" step="0.5" min="4" max="60" data-tp="' + sp + '.size" value="' + tt.size + '" aria-label="Size of ' + label + '" title="Size (pt)">' +
        '<button type="button" class="ck-tg' + (tt.bold ? ' on' : '') + '" data-tg="' + id + '.bold" title="Bold" aria-pressed="' + !!tt.bold + '"><b>B</b></button><button type="button" class="ck-tg' + (tt.italic ? ' on' : '') + '" data-tg="' + id + '.italic" title="Italic" aria-pressed="' + !!tt.italic + '"><i>I</i></button></div></div>';
    }
    function textHtml(){
      return grp('Title', textLine('title0', 'Line 1') + textLine('title1', 'Line 2') + textLine('title2', 'Line 3')) +
        grp('Axis titles', textLine('xTitle', 'X axis') + textLine('yTitle', 'Y axis')) +
        grp('Numbers on the axes', fld('Y labels', 'y.size', 'num', { step: 0.5, min: 4, max: 40 }) + fld('X labels', 'x.size', 'num', { step: 0.5, min: 4, max: 40 })) +
        grp('Legend', fld('Show', 'legend.show', 'bool') + fld('Position', 'legend.pos', 'sel', { seg: true, opts: [['auto', 'Auto'], ['right', 'Right'], ['below', 'Below']] }) + fld('Size', 'legend.size', 'num', { step: 0.5, min: 4, max: 40 }) + fld('Takes no room', 'legend.float', 'bool', { hint: 'the plot grows into its space' }));
    }
    function pageHtml(){
      return grp('Size of the figure', '<div class="ck-pg">' + PAGES.map(function(p){ var on = Math.abs(spec.w - p[1]) < 0.01 && Math.abs(spec.h - p[2]) < 0.01; return '<button type="button" class="ck-pgb' + (on ? ' on' : '') + '" data-page="' + p[1] + ',' + p[2] + '" aria-pressed="' + on + '"><b>' + p[0] + '</b><em>' + p[1] + ' × ' + p[2] + ' in</em></button>'; }).join('') + '</div>' + pair(pf('Width (in)', 'w', { step: 0.1 }), pf('Height (in)', 'h', { step: 0.1 })) + fld('Scale with the page', 'scale', 'bool', { hint: 'text, lines and points follow the width' }) + '<div class="ck-note" id="ck-scalenote"></div>') +
        grp('Space around the plot (pt)', pair(pf('Left', 'margin.l', { step: 1 }), pf('Right', 'margin.r', { step: 1 })) + pair(pf('Top', 'margin.t', { step: 1 }), pf('Bottom', 'margin.b', { step: 1 }))) +
        grp('Reset', '<div class="ck-row"><button type="button" class="ck-btn" data-a="resetlayout">Positions &amp; margins</button><button type="button" class="ck-btn" data-a="resetall">Everything</button></div>') +
        '<div class="ck-note" id="ck-pngnote"></div>';
    }
    // ── the results table's section: whether, which parameters, how it is laid out and written, and its data ──
    function tableHtml(){
      var T = doc.table; if (!T || !T.cols) return '<div class="ck-hint">This figure has no table of fitted values.</div>';
      var t = spec.table, on = function(c){ return t.cols[c.id] === undefined ? c.on : !!t.cols[c.id]; }, none = !T.cols.some(on);
      return fld('Add the table under the figure', 'table.show', 'bool', { hint: 'one row per compound that is drawn; it follows the curve drawn, so a replicate left out refits it too', cls: 'ck-big' }) +
        grp('Parameters', '<div class="ck-tcols">' + T.cols.map(function(c){ return '<label class="ck-chip2"><input type="checkbox" data-tcol="' + esc(c.id) + '"' + (on(c) ? ' checked' : '') + '><span>' + esc(c.label) + '</span></label>'; }).join('') + '</div>' + (none ? '<div class="ck-warn">Switch on at least one parameter.</div>' : '')) +
        grp('Layout', fld('Compounds in', 'table.orient', 'sel', { seg: true, opts: [['rows', 'Rows'], ['cols', 'Columns']] }) + fld('Look', 'table.style', 'sel', { seg: true, opts: [['banded', 'Banded'], ['rules', 'Rules'], ['grid', 'Grid']] }) + fld('Text size', 'table.size', 'num', { step: 0.5, min: 4, max: 24 }) + fld('Colour mark beside each compound', 'table.swatch', 'bool') + fld('Footnote', 'table.note', 'bool', { hint: 'how it was fitted' })) +
        grp('Format', fld('Potency unit', 'table.potUnit', 'sel', { opts: [['auto', 'Automatic'], ['pM', 'pM'], ['nM', 'nM'], ['µM', 'µM'], ['mM', 'mM']] }) + fld('Units written', 'table.units', 'sel', { seg: true, opts: [['cell', 'Beside the value'], ['header', 'In the title']] }) + fld('Significant figures', 'table.sig', 'num', { step: 1, min: 1, max: 8 }) + fld('Decimals', 'table.dec', 'num', { step: 1, min: 0, max: 6, auto: true, hint: 'Hill, R², p-values' })) +
        grp('The data', '<div class="ck-row"><button type="button" class="ck-btn" data-a="tbl-copy">Copy</button><button type="button" class="ck-btn" data-a="tbl-csv">CSV</button>' + (window.XLSX ? '<button type="button" class="ck-btn" data-a="tbl-xlsx">Excel</button>' : '') + '</div>', 'Copy pastes into Excel, Prism or Word as written. The files hold the numbers themselves (potency in one unit named in its column title, 6 figures), laid out as the table is.');
    }
    function tableAoa(raw){ try { return C.tableData(doc, spec, raw); } catch (e) { return null; } }
    function tableOut(kind){
      var a = tableAoa(kind !== 'copy'); if (!a) { toast('There is no table to export — draw a compound with a fitted curve and switch a parameter on.', 'err'); return; }
      if (kind === 'copy') {
        var txt = a.map(function(r){ return r.map(function(c){ return String(c).replace(/[\t\r\n]+/g, ' '); }).join('\t'); }).join('\n');
        var ok = function(){ toast('Table copied — ' + (a.length - 1) + ' ' + (spec.table.orient === 'cols' ? 'parameter' : 'compound') + (a.length === 2 ? '' : 's') + ', paste it into Excel, Prism or Word.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(function(){ toast('The browser did not allow writing to the clipboard — use CSV.', 'err'); }); else toast('The browser has no clipboard here — use CSV.', 'err');
      } else if (kind === 'csv') {
        var q = function(c){ c = String(c); return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; };
        X.save(new Blob(['\ufeff' + a.map(function(r){ return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' }), base() + '_table.csv'); toast('Table saved as CSV.');
      } else if (window.XLSX) {
        var ws = XLSX.utils.aoa_to_sheet(a), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Table');
        X.save(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), base() + '_table.xlsx'); toast('Table saved as Excel.');
      }
    }

    // What the type comes to on paper: with Scale on the sizes follow the page width, so a narrow page is a small figure — and said so.
    function scaleNote(){
      var el = panel.querySelector('#ck-scalenote'); if (!el || !scene) return;
      var k = scene.k || 1, pt = spec.x.size * k, y = spec.y.size * k, lo = Math.min(pt, y);
      el.innerHTML = spec.scale ? 'Everything in the figure is drawn in proportion to its width, so the page can be resized without changing how it looks. Axis numbers are ' + (+lo.toFixed(1)) + ' pt at ' + (+spec.w.toFixed(1)) + ' in.' + (lo < 6 ? ' <span class="ck-warn">Most journals want 6 pt or more — raise the sizes, or use a wider page.</span>' : '') : 'Sizes are real points: a smaller page holds the same type and lines, so they take more of it.';
    }
    function pngNote(){ var el = panel.querySelector('#ck-pngnote'); if (!el || !scene) return; var s = X.pngSize(scene, dpi); el.textContent = 'PNG at ' + dpi + ' dpi: ' + s.w + ' × ' + s.h + ' px' + (s.scaled ? ' — larger than a browser can draw, so it is made at ' + s.effective + ' dpi' : '') + '.'; }
    function compoundsHtml(){
      var its = doc.items || [];
      if (!its.length) return '<div class="ck-hint">Nothing to plot yet.</div>';
      var anyOmit = Object.keys(spec.omit).some(function(k){ return spec.omit[k]; });
      var nOn = its.filter(function(it){ return !spec.hidden[it.id]; }).length;
      var cur = C.PALETTES.filter(function(x){ return x.id === spec.palette; })[0] || C.PALETTES[0];
      var strip = function(p){ return '<span class="ck-ps">' + palColors(p).slice(0, 8).map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</span>'; };
      var pal = '<div class="ck-palcur"><span class="ck-palname">' + esc(cur.name) + '</span>' + strip(cur) + '<button type="button" class="ck-link" data-a="togpal" aria-expanded="' + palOpen + '">' + (palOpen ? 'Done' : 'Change') + '</button></div>' +
        (palOpen ? '<div class="ck-pals">' + C.PALETTES.map(function(p){ return '<button type="button" class="ck-pal' + (spec.palette === p.id ? ' on' : '') + '" data-pal="' + p.id + '" title="' + p.name + '" aria-pressed="' + (spec.palette === p.id) + '"><span class="ck-pn">' + p.name + '</span>' + strip(p) + '</button>'; }).join('') + '</div>' : '');
      var head = '<div class="ck-note ck-first">' + (nOn ? 'Tick a compound to draw it.' : '<b>Nothing is drawn yet.</b> Tick the compounds to show.') + ' The square sets its colour; the arrow lists its replicates, and one you click is left out of the means, error bars and fits.' + (anyOmit ? ' <button type="button" class="ck-link" data-a="restoreomit">Put them all back</button>' : '') + '</div>' +
        (its.length > 1 ? '<div class="ck-dall"><span>' + nOn + ' of ' + its.length + ' drawn</span><span class="ck-dallb"><button type="button" class="ck-link" data-a="showall">Show all</button><button type="button" class="ck-link" data-a="hideall">Hide all</button></span></div>' : '');
      var list = its.map(function(it, ii){
        var hid = spec.hidden[it.id], col = C.itemColor(spec, it, ii, its.length);
        var failed = !hid && fitFailed().some(function(f){ return f.id === it.id; });
        var open = !!openItems[it.id];
        return '<div class="ck-dg' + (hid ? ' off' : '') + '"><div class="ck-dh"><span class="ck-dl"><input type="checkbox" class="ck-tick" data-a="toggleitem" data-id="' + esc(it.id) + '"' + (hid ? '' : ' checked') + ' aria-label="Draw ' + esc(it.name) + '"><button type="button" class="ck-chip' + (sel === 'bar:' + it.id ? ' on' : '') + '" style="background:' + col + '" data-pick="bar:' + esc(it.id) + '" title="Colour" aria-label="Colour of ' + esc(it.name) + ': ' + col + '"></button><button type="button" class="ck-name" data-a="openitem" data-id="' + esc(it.id) + '" aria-expanded="' + open + '">' + esc(it.name) + '</button>' + (spec.colors[it.id] ? '<button type="button" class="ck-link ck-pl" data-a="resetcolor" data-id="' + esc(it.id) + '" title="Back to the palette colour">palette</button>' : '') + '</span><button type="button" class="ck-chev' + (open ? ' open' : '') + '" data-a="openitem" data-id="' + esc(it.id) + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Hide' : 'Show') + ' the replicates of ' + esc(it.name) + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>' +
          (failed ? '<div class="ck-fitnote">Too few points left to refit — its curve is not drawn.</div>' : '') +
          (!open ? '' : (it.points || []).map(function(p){ return '<div class="ck-dp"><span class="ck-dx">' + esc(p.label != null ? p.label : p.x) + '</span><span class="ck-reps">' + (p.reps || []).map(function(r){ var off = spec.omit[r.id]; return '<button type="button" class="ck-rep' + (off ? ' off' : '') + '" data-omit="' + esc(r.id) + '" title="' + (off ? 'Omitted — click to put it back' : 'Click to omit') + '">' + esc(C.fin(r.v) ? String(+(+r.v).toPrecision(4)) : '–') + '</button>'; }).join('') + '</span></div>'; }).join('')) + '</div>';
      }).join('');
      return grp('Which are drawn', head + (its.length > 9 ? '<div class="ck-dlist">' + list + '</div>' : list)) + grp('Palette', pal, 'Choosing a palette recolours every compound; a colour picked for one compound is kept until you apply a palette again.');
    }

    // ── changes ────────────────────────────────────────────────
    function setPath(path, v, k){ pushUndo(k || path); put(spec, path, v); C.sanitize(spec); draw(); save(); }
    root.addEventListener('input', function(e){
      var t = e.target;
      if (t.dataset.p) { var v = t.dataset.t === 'bool' ? t.checked : t.dataset.t === 'selnum' ? +t.value : t.dataset.t === 'num' || t.dataset.t === 'numauto' ? (t.value === '' ? (t.dataset.t === 'numauto' ? null : 0) : +t.value) : t.value; if ((t.dataset.t === 'num' || t.dataset.t === 'numauto') && v !== null && !isFinite(v)) return; setPath(t.dataset.p, v); if (t.dataset.t === 'bool' || t.tagName === 'SELECT') { renderPanel(); syncBar(); } }
      else if (t.dataset.tp) { var vv = +t.value; if (!isFinite(vv) || t.value === '') return; setPath(t.dataset.tp, vv); }
      else if (t.dataset.text) { var id = t.dataset.text; pushUndo('text:' + id); if (id.indexOf('title') === 0) spec.title[+id.slice(5)].text = t.value; else spec[id].text = t.value; draw(); save(); }
      else if (t.dataset.item) { pushUndo('col:' + t.dataset.item); spec.colors[t.dataset.item] = t.value; draw(); save(); renderSwatches(); }
    });
    function renderSwatches(){ /* a colour picker holds its own value while it is dragged; the swatches in the selection card follow on change */ }
    root.addEventListener('change', function(e){
      var t = e.target;
      if (t.dataset.a === 'dpi') { dpi = +t.value; pngNote(); }
      else if (t.dataset.a === 'toggleitem') { pushUndo('hide'); if (t.checked) delete spec.hidden[t.dataset.id]; else spec.hidden[t.dataset.id] = true; if (!t.checked && sel && itemOf(sel) === t.dataset.id) sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (t.dataset.tcol !== undefined) { pushUndo('tcol'); spec.table.cols[t.dataset.tcol] = t.checked; draw(); renderPanel(); save(); }
      else if (t.dataset.a === 'snap') { pushUndo('snap'); spec.snap = t.checked; save(); }
      else if (t.dataset.hex) { var hx = String(t.value).trim(); if (hx.charAt(0) !== '#') hx = '#' + hx; if (/^#[0-9a-f]{6}$/i.test(hx)) { pushUndo('col:' + t.dataset.hex); spec.colors[t.dataset.hex] = hx.toLowerCase(); draw(); save(); } renderSel(); renderPanel(); }
      else if (t.dataset.item) { renderSel(); renderPanel(); }
      else if (t.dataset.p) renderPanel();
    });
    root.addEventListener('click', function(e){
      var t = e.target.closest('button, .ck-swb'); if (!t || !root.contains(t)) return;
      var d = t.dataset;
      if (d.kind) { pushUndo('kind'); spec.kind = d.kind; syncBar(); draw(); renderPanel(); save(); return; }
      if (d.menu) { if (cur === d.menu) closeMenu(); else openMenu(d.menu); return; }
      if (d.cm) { cmode = d.cm; renderSel(); return; }
      if (d.pick) { select(d.pick); return; }
      if (d.omit) { pushUndo('omit'); spec.omit[d.omit] = !spec.omit[d.omit]; if (!spec.omit[d.omit]) delete spec.omit[d.omit]; draw(); renderPanel(); save(); return; }
      if (d.pal) { pushUndo('palette'); spec.palette = d.pal; spec.colors = {}; palOpen = false; draw(); renderPanel(); renderSel(); save(); return; }
      if (d.page) { var p = d.page.split(','); pushUndo('page'); spec.w = +p[0]; spec.h = +p[1]; draw(); renderPanel(); save(); return; }
      if (d.tg) { var path = d.tg, tt = path.indexOf('title') === 0 ? spec.title[+path.charAt(5)] : spec[path.split('.')[0]], key = path.split('.')[1]; pushUndo('tg'); tt[key] = !tt[key]; draw(); renderSel(); renderPanel(); save(); return; }
      if (d.tset) {
        pushUndo('tset');
        if (d.tset === 'x.unit') { var u0 = C.xUnitOf(doc, spec); put(spec, d.tset, d.v); var u1 = C.xUnitOf(doc, spec), rt = u0.to && u1.to ? C.XU[u0.to] / C.XU[u1.to] : 1; ['min', 'max'].forEach(function(k){ if (rt !== 1 && spec.x[k] !== null && spec.x[k] !== '' && isFinite(+spec.x[k])) spec.x[k] = +(+spec.x[k] * rt).toPrecision(6); }); }   // an axis range typed in nM is the same range in µM
        else put(spec, d.tset, d.n ? +d.v : d.v); C.sanitize(spec); draw(); renderPanel(); syncBar(); save(); return; }
      if (d.al) { align(d.al); return; }
      var a = d.a; if (!a) return;
      if (a === 'undo') doUndo(); else if (a === 'redo') doRedo();
      else if (a === 'png') exportPNG(); else if (a === 'pdf') exportPDF(); else if (a === 'svg') exportSVG();
      else if (a === 'deselect') select(null);
      else if (a === 'togpal') { palOpen = !palOpen; renderPanel(); }
      else if (a === 'closepop') closeMenu();
      else if (a === 'setcolor') { pushUndo('col'); spec.colors[d.id] = d.c; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'resetcolor') { pushUndo('col'); delete spec.colors[d.id]; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'hideitem') { pushUndo('hide'); spec.hidden[d.id] = !spec.hidden[d.id]; if (!spec.hidden[d.id]) delete spec.hidden[d.id]; if (sel && itemOf(sel) === d.id) sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'openitem') { openItems[d.id] = !openItems[d.id]; renderPanel(); }
      else if (a === 'showall' || a === 'hideall') { pushUndo('hide'); (doc.items || []).forEach(function(it){ if (a === 'showall') delete spec.hidden[it.id]; else spec.hidden[it.id] = true; }); if (a === 'hideall') sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'tbl-copy') tableOut('copy'); else if (a === 'tbl-csv') tableOut('csv'); else if (a === 'tbl-xlsx') tableOut('xlsx');
      else if (a === 'hideleg') { pushUndo('leg'); spec.legend.show = false; sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'resetpos') { if (sel) { pushUndo('pos'); delete spec.pos[sel.indexOf('leg:') === 0 ? 'legend' : sel]; draw(); overlay(); save(); } }
      else if (a === 'restoreomit') { pushUndo('omit'); spec.omit = {}; draw(); renderPanel(); save(); }
      else if (a === 'resetlayout') { pushUndo('layout'); spec.pos = {}; spec.margin = { l: 0, r: 0, t: 0, b: 0 }; draw(); renderPanel(); save(); }
      else if (a === 'resetall') { pushUndo('all'); spec = C.withDefaults(null); adoptItems(); sel = null; syncBar(); draw(); renderSel(); renderPanel(); save(); }
    });

    // ── align ──────────────────────────────────────────────────
    function align(how){
      var id = sel && sel.indexOf('leg:') === 0 ? 'legend' : sel, nd = id && nodeOf(id); if (!nd || !scene) return;
      var r = rectOf(nd), cur = spec.pos[id] || { dx: 0, dy: 0 }, target = how === 'cx' ? scene.plot.x + scene.plot.w / 2 : scene.W / 2, mid = (r.l + r.r) / 2;
      pushUndo('align'); spec.pos[id] = { dx: +(cur.dx + (target - mid) / kk()).toFixed(2), dy: cur.dy }; draw(); overlay(); save();
    }

    // ── dragging with snap & align ─────────────────────────────
    svg.addEventListener('pointerdown', function(e){
      if (e.button !== 0) return;
      var el = e.target.closest('[data-el]'); root.focus({ preventScroll: true });
      if (!el) { select(null); return; }
      var id = el.dataset.el, did = id.indexOf('leg:') === 0 ? 'legend' : id; select(id, DRAG.test(did));
      if (!DRAG.test(did)) return;
      var nd = nodeOf(did); if (!nd) return;
      e.preventDefault();
      var start = spec.pos[did] || { dx: 0, dy: 0 }, r0 = rectOf(nd), cand = candidates(did);
      drag = { id: did, x: e.clientX, y: e.clientY, start: { dx: start.dx, dy: start.dy }, r0: r0, cand: cand, moved: false, marked: false };
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    });
    function candidates(skip){
      var xs = [], ys = [], P = scene.plot;
      [[P.x, P.x + P.w, P.y, P.y + P.h]].forEach(function(b){ xs.push(b[0], (b[0] + b[1]) / 2, b[1]); ys.push(b[2], (b[2] + b[3]) / 2, b[3]); });
      var FH = scene.figH || scene.H; xs.push(scene.W / 2, 8, scene.W - 8); ys.push(FH / 2, 8, FH - 8);
      svg.querySelectorAll('[data-el]').forEach(function(n){ var i = n.dataset.el; if (i === skip || !DRAG.test(i)) return; var r = rectOf(n); xs.push(r.l, (r.l + r.r) / 2, r.r); ys.push(r.t, (r.t + r.b) / 2, r.b); });
      return { xs: xs, ys: ys };
    }
    svg.addEventListener('pointermove', function(e){
      if (!drag) return;
      var k = scale(), ddx = (e.clientX - drag.x) / k, ddy = (e.clientY - drag.y) / k;
      if (!drag.moved && Math.abs(ddx) + Math.abs(ddy) < 2 / k) return;
      if (!drag.moved) { drag.moved = true; pushUndo('drag'); }
      var guides = [], r = drag.r0, w = r.r - r.l, h = r.b - r.t, thr = 6 / k, free = e.altKey || !spec.snap;
      if (!free) {
        var bx = null, by = null;
        [[r.l + ddx], [r.l + ddx + w / 2], [r.l + ddx + w]].forEach(function(p){ drag.cand.xs.forEach(function(c){ var dd = c - p[0]; if (Math.abs(dd) <= thr && (!bx || Math.abs(dd) < Math.abs(bx.d))) bx = { d: dd, c: c }; }); });
        [[r.t + ddy], [r.t + ddy + h / 2], [r.t + ddy + h]].forEach(function(p){ drag.cand.ys.forEach(function(c){ var dd = c - p[0]; if (Math.abs(dd) <= thr && (!by || Math.abs(dd) < Math.abs(by.d))) by = { d: dd, c: c }; }); });
        if (bx) { ddx += bx.d; guides.push({ v: bx.c }); }
        if (by) { ddy += by.d; guides.push({ h: by.c }); }
      }
      spec.pos[drag.id] = { dx: +(drag.start.dx + ddx / kk()).toFixed(2), dy: +(drag.start.dy + ddy / kk()).toFixed(2) };
      var keep = guides; draw(); overlay(keep);
    });
    function endDrag(){ if (!drag) return; var m = drag.moved; drag = null; if (m) { draw(); save(); } else { overlay(); if (sel) select(sel); } }   // released without moving it: that was a click, so its entry opens
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('dblclick', function(e){ var el = e.target.closest('[data-el]'); if (el && TEXTS[el.dataset.el]) { select(el.dataset.el); var inp = panel.querySelector('[data-text="' + el.dataset.el + '"]'); if (inp) { inp.focus(); inp.select(); } } });
    root.addEventListener('keydown', function(e){
      var t = e.target, typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT';
      var mod = e.metaKey || e.ctrlKey, k = (e.key || '').toLowerCase();
      if (mod && k === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
      if (e.key === 'Escape') { if (typing) t.blur(); select(null); closeMenu(); return; }
      if (typing) { if (e.key === 'Enter' && t.classList.contains('ck-txt')) { e.preventDefault(); t.blur(); } return; }
      var id = sel && sel.indexOf('leg:') === 0 ? 'legend' : sel;
      if (id && DRAG.test(id) && /^Arrow/.test(e.key)) {
        e.preventDefault(); var st = (e.shiftKey ? 10 : 1) / kk(), cur = spec.pos[id] || { dx: 0, dy: 0 };
        pushUndo('nudge:' + id); spec.pos[id] = { dx: +(cur.dx + (e.key === 'ArrowRight' ? st : e.key === 'ArrowLeft' ? -st : 0)).toFixed(3), dy: +(cur.dy + (e.key === 'ArrowDown' ? st : e.key === 'ArrowUp' ? -st : 0)).toFixed(3) }; draw(); overlay(); save();
      }
    });
    window.addEventListener('resize', function(){ fit(); overlay(); });

    // ── export ─────────────────────────────────────────────────
    function base(){ var n = opts.filename ? opts.filename() : (opts.key || 'chart'); return String(n || 'chart').replace(/[^\w.\-]+/g, '_').slice(0, 60); }
    function exportPNG(){
      if (!scene) return; toast('Making the ' + dpi + ' dpi PNG…');
      X.toPNG(scene, dpi).then(function(r){ X.save(r.blob, base() + '_' + dpi + 'dpi.png'); toast('PNG saved — ' + r.size.w + ' × ' + r.size.h + ' px, tagged ' + r.size.effective + ' dpi' + (r.size.scaled ? ' (the most this browser can draw)' : '') + '.'); }).catch(function(err){ toast(err.message, 'err'); });
    }
    function exportPDF(){ if (!scene) return; X.save(X.toPDF(scene), base() + '.pdf'); toast('PDF saved — vector, ' + (scene.W / 72).toFixed(1) + ' × ' + (scene.H / 72).toFixed(1) + ' in.'); }
    function exportSVG(){ if (!scene) return; X.save(new Blob([X.toSVG(scene)], { type: 'image/svg+xml' }), base() + '.svg'); toast('SVG saved.'); }

    var lastSig = null;
    // A figure of thirty compounds is a smear, so a compound the kit has not met yet starts unticked and the person picks the ones to draw.
    // One that was met keeps what was chosen, so new data never switches on something that was switched off. A lone compound is just drawn,
    // and so is every compound of a host that has its own chooser (opts.drawAll — Echo's "Compounds in the figure").
    function adoptItems(){
      var its = doc.items || []; spec.seen = spec.seen || {};
      its.forEach(function(it){ if (!spec.seen[it.id]) { spec.seen[it.id] = 1; if (its.length > 1 && !opts.drawAll) spec.hidden[it.id] = true; } });
      // what the app says its figure is made of (names beside the points, points joined) is the starting choice, and the person's after that
      // an app may start a figure from its own look (traces: no markers, no error bars) once; after that the person's choices stand
      if (doc.defaults && !spec.xy.init) { Object.keys(doc.defaults).forEach(function(k){ if (spec[k] && typeof spec[k] === 'object') Object.keys(doc.defaults[k]).forEach(function(kk){ spec[k][kk] = doc.defaults[k][kk]; }); }); spec.xy.init = true; }
      if (spec.xy.labels === null && doc.pointLabels) spec.xy.labels = true;
      if (spec.xy.join === null && doc.join) spec.xy.join = true;
    }
    function refresh(){
      try { doc = opts.doc ? opts.doc() || { items: [] } : { items: [] }; } catch (e) { doc = { items: [] }; }
      // different data: what was done to the old data (omitted replicates, colours, positions, retyped titles) goes
      if (doc.sig !== undefined && lastSig !== null && doc.sig !== lastSig) {
        openItems = {}; spec.omit = {}; spec.hidden = {}; spec.seen = {}; spec.colors = {}; spec.pos = {}; spec.ref.y = null; spec.title.forEach(function(t){ t.text = null; }); spec.xTitle.text = null; spec.yTitle.text = null; undo = []; redo = []; sel = null;
      }
      if (doc.sig !== undefined) lastSig = doc.sig;
      adoptItems();
      // a figure that is never a bar chart (a scatter, a standard curve) has no bars to ask for, and names what it is made of (doc.noun: 'Targets', 'Tiers')
      var kindSeg = root.querySelector('.ck-kind'); if (kindSeg) kindSeg.style.display = doc.kind ? 'none' : '';
      SEC_T.compounds = SEC_L.compounds = doc.noun || 'Compounds';
      var slot = root.querySelector('.ck-slot'); if (slot && opts.slot) { try { opts.slot(slot); } catch (e) {} }
      draw(); renderSel(); renderPanel(); syncBar();
      setTimeout(fit, 0);
    }
    refresh();
    return { refresh: refresh, draw: draw, spec: function(){ return spec; }, scene: function(){ return scene; }, select: select, open: function(id){ setSection(id, true); }, close: function(id){ setSection(id, false); }, sections: function(){ return cur ? [cur] : []; }, exportPNG: exportPNG, exportPDF: exportPDF };
  }
  return { mount: mount };
})();
