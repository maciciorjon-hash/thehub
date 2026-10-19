/* ChartKit UI — the editor around the scene.
 *
 *   ChartKit.mount(el, { key, doc: function(){ return doc; }, filename: function(){ return 'name'; }, toast: function(msg, kind){} })
 *     → { refresh(), draw() }
 *
 * Click anything on the chart to edit it; drag titles and the legend (they snap to each other, to the plot and to
 * the figure's centre — hold Alt to move freely; arrow keys nudge); the panel has Data (omit a replicate), Text,
 * Axes, Style, Colours and Page. Export is PNG at 300 / 600 / 1200 dpi, a vector PDF, or SVG.
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
    var KEY = 'ck2:' + (opts.key || 'chart'), spec, doc = { items: [] }, scene = null, sel = null, tab = 'data', undo = [], redo = [], lastUndoKey = '', lastUndoAt = 0, dpi = 1200, saveT = 0, drag = null;
    try { spec = C.withDefaults(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { spec = C.withDefaults(null); }

    root.classList.add('ck-root'); root.setAttribute('tabindex', '-1');
    root.innerHTML =
      '<div class="ck-stage">' +
        '<div class="ck-bar" role="toolbar" aria-label="Chart">' +
          '<div class="ck-slot"></div>' +
          '<div class="ck-seg ck-kind" role="group" aria-label="Chart type"><button type="button" data-kind="auto">Auto</button><button type="button" data-kind="bars">Bars</button><button type="button" data-kind="xy">Curves</button></div>' +
          '<span class="ck-sep"></span>' +
          '<button type="button" class="ck-btn" data-a="undo" title="Undo (⌘Z)">Undo</button><button type="button" class="ck-btn" data-a="redo" title="Redo (⇧⌘Z)">Redo</button>' +
          '<label class="ck-chk" title="Titles and the legend snap to each other, to the plot and to the centre of the figure. Hold Alt to move freely."><input type="checkbox" data-a="snap"> Snap &amp; align</label>' +
          '<span class="ck-gap"></span>' +
          '<select class="ck-dpi" aria-label="PNG resolution" data-a="dpi"><option value="300">300 dpi</option><option value="600">600 dpi</option><option value="1200">1200 dpi</option></select>' +
          '<button type="button" class="ck-btn ck-pri" data-a="png">PNG</button><button type="button" class="ck-btn ck-pri" data-a="pdf">PDF</button><button type="button" class="ck-btn" data-a="svg">SVG</button>' +
        '</div>' +
        '<div class="ck-canvas"><svg class="ck-svg" role="img" aria-label="Chart preview"></svg></div>' +
        '<div class="ck-status" aria-live="polite"></div>' +
      '</div>' +
      '<div class="ck-panel">' +
        '<div class="ck-sel"></div>' +
        '<div class="ck-seg ck-tabs" role="tablist"></div>' +
        '<div class="ck-body"></div>' +
      '</div>';
    var svg = root.querySelector('.ck-svg'), panel = root.querySelector('.ck-body'), selBox = root.querySelector('.ck-sel'), tabsEl = root.querySelector('.ck-tabs'), status = root.querySelector('.ck-status');
    ['data:Data', 'text:Text', 'axes:Axes', 'style:Style', 'colors:Colours', 'page:Page'].forEach(function(t){ var p = t.split(':'); var b = document.createElement('button'); b.type = 'button'; b.dataset.tab = p[0]; b.textContent = p[1]; tabsEl.appendChild(b); });

    function toast(m, k){ if (opts.toast) opts.toast(m, k); status.textContent = m; status.classList.remove('ck-warnline'); lastFitNote = ''; }
    // Only the style is kept between visits. What was omitted, hidden, recoloured, moved or retitled belongs to the data it
    // was done to: a replicate left out of one experiment must not be silently left out of the next.
    function persistable(){
      var o = JSON.parse(JSON.stringify(spec)); o.omit = {}; o.hidden = {}; o.colors = {}; o.pos = {};
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
      root.querySelector('[data-a=snap]').checked = !!spec.snap; root.querySelector('[data-a=dpi]').value = String(dpi);
      root.querySelectorAll('.ck-kind button').forEach(function(b){ b.classList.toggle('active', b.dataset.kind === spec.kind); });
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
      overlay(); pngNote(); fitNote();
    }
    if (window.ResizeObserver) { var ro = new ResizeObserver(function(){ fit(); overlay(); }); ro.observe(root.querySelector('.ck-canvas')); ro.observe(root); }
    // A curve that cannot be refitted without the replicates left out is not drawn; say so where the figure is, not only in the Data tab.
    var lastFitNote = '';
    function fitFailed(){ return scene && scene.kind === 'xy' ? scene.items.filter(function(i){ return i.refitFailed && !i.hidden; }) : []; }
    function fitNote(){
      var f = fitFailed(), msgs = [];
      if (f.length) msgs.push((f.length === 1 ? f[0].name : f.length + ' compounds') + ': too few points are left to refit, so ' + (f.length === 1 ? 'its curve is' : 'their curves are') + ' not drawn. Put a replicate back to bring ' + (f.length === 1 ? 'it' : 'them') + ' back.');
      if (scene && scene.grew) msgs.push('The labels need more room than ' + scene.grew.askedW.toFixed(1) + ' × ' + scene.grew.askedH.toFixed(1) + ' in, so the figure is made ' + scene.grew.w.toFixed(1) + ' × ' + scene.grew.h.toFixed(1) + ' in. A larger page, a smaller legend or fewer compounds keeps the size you asked for.');
      var msg = msgs.join(' ');
      if (msg) { status.textContent = msg; status.classList.add('ck-warnline'); lastFitNote = msg; }
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
    function itemOf(id){ var m = /^(?:bar|fit|pt|leg):(.+)$/.exec(id || ''); return m ? m[1] : null; }
    function select(id){ sel = id || null; renderSel(); overlay(); if (sel && TEXTS[sel]) tab = tab === 'data' ? 'text' : tab; if (sel && itemOf(sel) && tab === 'text') tab = 'colors'; renderTabs(); renderPanel(); }
    function renderSel(){
      var h = '';
      if (!sel) h = '<div class="ck-hint"><b>Click anything on the chart to edit it.</b> Drag the titles and the legend — they snap to each other and to the plot; hold <kbd>Alt</kbd> to move freely, arrow keys nudge. Click a replicate in <b>Data</b> to omit it.</div>';
      else if (TEXTS[sel]) {
        var tt = sel.indexOf('title') === 0 ? spec.title[+sel.slice(5)] : spec[sel], cur = tt.text === null ? defaultText(sel) : tt.text;
        h = '<div class="ck-selh"><b>' + TEXTS[sel] + '</b><button type="button" class="ck-link" data-a="deselect">Done</button></div>' +
          '<input class="ck-in ck-txt" type="text" data-text="' + sel + '" value="' + esc(cur) + '" aria-label="' + TEXTS[sel] + '" placeholder="Empty hides it">' +
          '<div class="ck-row"><label class="ck-f"><span>Size</span><input class="ck-in" type="number" step="0.5" min="4" max="60" data-tp="' + sel + '.size" value="' + tt.size + '"></label>' +
          '<button type="button" class="ck-tg' + (tt.bold ? ' on' : '') + '" data-tg="' + sel + '.bold" title="Bold"><b>B</b></button><button type="button" class="ck-tg' + (tt.italic ? ' on' : '') + '" data-tg="' + sel + '.italic" title="Italic"><i>I</i></button></div>' + alignRow();
      } else if (sel === 'legend') {
        h = '<div class="ck-selh"><b>Legend</b><button type="button" class="ck-link" data-a="deselect">Done</button></div><div class="ck-row"><label class="ck-f"><span>Size</span><input class="ck-in" type="number" step="0.5" min="4" max="40" data-p="legend.size" data-t="num" value="' + spec.legend.size + '"></label><button type="button" class="ck-btn" data-a="hideleg">Hide</button></div>' + alignRow();
      } else if (itemOf(sel)) {
        var id = itemOf(sel), it = (doc.items || []).filter(function(x){ return x.id === id; })[0], ci = (doc.items || []).indexOf(it);
        if (it) {
          var col = C.itemColor(spec, it, ci, (doc.items || []).length), pal = C.PALETTES.filter(function(p){ return p.id === spec.palette; })[0] || C.PALETTES[0];
          h = '<div class="ck-selh"><b>' + esc(it.name) + '</b><button type="button" class="ck-link" data-a="deselect">Done</button></div>' +
            '<div class="ck-row"><label class="ck-f"><span>Colour</span><input class="ck-color" type="color" data-item="' + esc(id) + '" value="' + col + '"></label>' +
            '<button type="button" class="ck-link" data-a="resetcolor" data-id="' + esc(id) + '">Back to the palette</button><button type="button" class="ck-link" data-a="hideitem" data-id="' + esc(id) + '">Hide</button></div>' +
            '<div class="ck-sw">' + palColors(pal).map(function(c){ return '<button type="button" class="ck-swb' + (c.toLowerCase() === col.toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-a="setcolor" data-id="' + esc(id) + '" data-c="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>';
        }
      } else if (sel === 'ref') h = '<div class="ck-selh"><b>Reference line</b><button type="button" class="ck-link" data-a="deselect">Done</button></div><div class="ck-hint">Its value and style are under <b>Axes</b>.</div>';
      else if (sel === 'axisX' || sel === 'axisY') h = '<div class="ck-selh"><b>' + (sel === 'axisX' ? 'X' : 'Y') + ' axis</b><button type="button" class="ck-link" data-a="deselect">Done</button></div><div class="ck-hint">Range, ticks and line width are under <b>Axes</b>.</div>';
      selBox.innerHTML = h;
    }
    function palColors(pal){ var n = (doc.items || []).length; return pal.ramp ? Array.apply(null, Array(Math.max(2, Math.min(12, n)))).map(function(_, i, a){ return C.blueRamp(i, a.length); }) : pal.c; }
    function alignRow(){ return '<div class="ck-row ck-align"><button type="button" class="ck-btn" data-al="cx">Centre on plot</button><button type="button" class="ck-btn" data-al="fx">Centre on figure</button><button type="button" class="ck-link" data-a="resetpos">Reset position</button></div>'; }
    function defaultText(id){ if (id === 'xTitle') return doc.xTitle || ''; if (id === 'yTitle') return doc.yTitle || ''; return (doc.title && doc.title[+id.slice(5)]) || ''; }

    // ── the panel ──────────────────────────────────────────────
    function fld(label, path, type, o){
      o = o || {}; var v = get(spec, path), rg = C.RANGE[path]; if (rg) { if (o.min === undefined) o.min = rg[0]; if (o.max === undefined) o.max = rg[1]; }
      if (type === 'bool') return '<label class="ck-chk ck-f2"><input type="checkbox" data-p="' + path + '" data-t="bool"' + (v ? ' checked' : '') + '> ' + label + '</label>';
      if (type === 'sel') return '<label class="ck-f"><span>' + label + '</span><select class="ck-in" data-p="' + path + '" data-t="' + (o.num ? 'selnum' : 'str') + '">' + o.opts.map(function(x){ return '<option value="' + x[0] + '"' + (String(v) === String(x[0]) ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>';
      return '<label class="ck-f"><span>' + label + '</span><input class="ck-in" type="number" step="' + (o.step || 'any') + '"' + (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + ' data-p="' + path + '" data-t="' + (o.auto ? 'numauto' : 'num') + '" value="' + (v === null || v === undefined ? '' : v) + '"' + (o.auto ? ' placeholder="auto"' : '') + '></label>';
    }
    function renderTabs(){ tabsEl.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === tab); }); }
    function renderPanel(){
      var h = '', kind = scene ? scene.kind : 'bars';
      if (tab === 'data') h = dataHtml();
      else if (tab === 'text') {
        h = '<div class="ck-grp">Click a line of text to edit it, or pick one:</div><div class="ck-list">' + Object.keys(TEXTS).map(function(k){ return '<button type="button" class="ck-li' + (sel === k ? ' on' : '') + '" data-pick="' + k + '">' + TEXTS[k] + '</button>'; }).join('') + '<button type="button" class="ck-li' + (sel === 'legend' ? ' on' : '') + '" data-pick="legend">Legend</button></div>' +
          '<div class="ck-grp">Numbers on the axes</div><div class="ck-grid">' + fld('Y labels', 'y.size', 'num', { step: 0.5, min: 4, max: 40 }) + fld('X labels', 'x.size', 'num', { step: 0.5, min: 4, max: 40 }) + '</div>';
      }
      else if (tab === 'axes') {
        var yBad = C.fin(+spec.y.min) && C.fin(+spec.y.max) && spec.y.min !== null && spec.y.max !== null && +spec.y.min >= +spec.y.max;
        h = '<div class="ck-grp">Y axis</div><div class="ck-grid">' + fld('Minimum', 'y.min', 'num', { auto: 1 }) + fld('Maximum', 'y.max', 'num', { auto: 1 }) + fld('Major step', 'y.major', 'num', { auto: 1 }) + fld('Decimals', 'y.dec', 'num', { auto: 1, step: 1 }) + '</div>' + (yBad ? '<div class="ck-warn">The maximum has to be above the minimum — the axis is on auto until it is.</div>' : '') + fld('Logarithmic', 'y.log', 'bool') +
          '<div class="ck-grp">X axis</div><div class="ck-grid">' + (kind === 'bars' ? fld('Label angle', 'x.rot', 'sel', { num: 1, opts: [[0, 'Flat'], [45, '45°'], [90, 'Vertical']] }) + fld('Order', 'x.order', 'sel', { opts: [['given', 'As given'], ['desc', 'High → low'], ['asc', 'Low → high']] }) : fld('Minimum', 'x.min', 'num', { auto: 1 }) + fld('Maximum', 'x.max', 'num', { auto: 1 })) + '</div>' + (kind === 'bars' ? fld('Show concentration labels', 'x.labels', 'bool') : '') +
          '<div class="ck-grp">Lines</div><div class="ck-grid">' + fld('Axis width', 'axisW', 'num', { step: 0.25, min: 0.25, max: 5 }) + fld('Tick length', 'tick', 'num', { step: 0.5, min: 0, max: 12 }) + '</div>' + fld('Box around the plot', 'box', 'bool') + fld('Horizontal grid', 'grid', 'bool') +
          '<div class="ck-grp">Reference line</div>' + fld('Show', 'ref.show', 'bool') + '<div class="ck-grid">' + fld('At', 'ref.y', 'num', { auto: 1 }) + fld('Width', 'ref.w', 'num', { step: 0.25, min: 0.25, max: 5 }) + '</div>' + fld('Dotted', 'ref.dash', 'bool');
      }
      else if (tab === 'style') {
        h = (kind === 'bars' ? '<div class="ck-grp">Bars</div><div class="ck-grid">' + fld('Width', 'bar.width', 'num', { step: 0.05, min: 0.2, max: 1.2 }) + fld('Gap between groups', 'bar.gap', 'num', { step: 0.1, min: 0, max: 4 }) + fld('Gap inside a group', 'bar.inner', 'num', { step: 0.05, min: 0, max: 1 }) + fld('Border', 'bar.border', 'num', { step: 0.25, min: 0, max: 5 }) + '</div>' + fld('Fill', 'fill', 'sel', { opts: [['solid', 'Solid'], ['tint', 'Light fill, coloured border'], ['outline', 'Outline only']] }) + fld('Shade by concentration (highest darkest)', 'bar.shade', 'bool') + fld('Show every replicate as a point', 'pts.show', 'bool')
          : '<div class="ck-grp">Curves and points</div><div class="ck-grid">' + fld('Marker', 'xy.marker', 'sel', { opts: [['circle', 'Circle'], ['square', 'Square'], ['triangle', 'Triangle'], ['diamond', 'Diamond'], ['auto', 'One per compound']] }) + fld('Marker size', 'xy.msize', 'num', { step: 0.5, min: 1, max: 14 }) + fld('Line width', 'xy.lw', 'num', { step: 0.25, min: 0.25, max: 6 }) + '</div>' + fld('Show the fit', 'xy.fit', 'bool') + fld('Show the points', 'xy.points', 'bool') + fld('Open markers', 'xy.open', 'bool') + fld('Dashed fit', 'xy.dash', 'bool') + fld('Show every replicate beside its mean', 'pts.show', 'bool')) +
          '<div class="ck-grp">Error bars</div>' + fld('Show', 'err.type', 'sel', { opts: [['sd', 'SD'], ['sem', 'SEM'], ['ci95', '95% CI'], ['range', 'Range'], ['none', 'None']] }) + '<div class="ck-grid">' + (kind === 'bars' ? fld('Direction', 'err.dir', 'sel', { opts: [['up', 'Up only'], ['both', 'Both ways']] }) : '') + fld('Cap', 'err.cap', 'num', { step: 0.5, min: 0, max: 16 }) + fld('Width', 'err.w', 'num', { step: 0.25, min: 0.25, max: 5 }) + '</div>' +
          '<div class="ck-grp">Legend</div>' + fld('Show', 'legend.show', 'bool') + '<div class="ck-grid">' + fld('Size', 'legend.size', 'num', { step: 0.5, min: 4, max: 40 }) + fld('Position', 'legend.pos', 'sel', { opts: [['auto', 'Auto'], ['right', 'Right of the plot'], ['below', 'Below the plot']] }) + '</div>';
      }
      else if (tab === 'colors') {
        h = '<div class="ck-grp">Palette</div><div class="ck-pals">' + C.PALETTES.map(function(p){ return '<button type="button" class="ck-pal' + (spec.palette === p.id ? ' on' : '') + '" data-pal="' + p.id + '" title="' + p.name + '"><span class="ck-pn">' + p.name + '</span><span class="ck-ps">' + p.c.slice(0, 8).map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</span></button>'; }).join('') + '</div>' +
          '<div class="ck-grp">Each compound</div><div class="ck-items">' + (doc.items || []).map(function(it, i){ var col = C.itemColor(spec, it, i, (doc.items || []).length); return '<div class="ck-itrow"><input class="ck-color" type="color" data-item="' + esc(it.id) + '" value="' + col + '" aria-label="Colour of ' + esc(it.name) + '"><button type="button" class="ck-name" data-pick="bar:' + esc(it.id) + '">' + esc(it.name) + '</button>' + (spec.colors[it.id] ? '<button type="button" class="ck-link" data-a="resetcolor" data-id="' + esc(it.id) + '">palette</button>' : '') + '</div>'; }).join('') + '</div>' +
          '<div class="ck-note">Choosing a palette recolours every compound; a colour picked for one compound is kept until you apply a palette again.</div>';
      }
      else if (tab === 'page') {
        h = '<div class="ck-grp">Size of the figure</div><div class="ck-pg">' + PAGES.map(function(p){ return '<button type="button" class="ck-li' + (Math.abs(spec.w - p[1]) < 0.01 && Math.abs(spec.h - p[2]) < 0.01 ? ' on' : '') + '" data-page="' + p[1] + ',' + p[2] + '">' + p[0] + '<em>' + p[1] + ' × ' + p[2] + ' in</em></button>'; }).join('') + '</div>' +
          '<div class="ck-grid">' + fld('Width (in)', 'w', 'num', { step: 0.1 }) + fld('Height (in)', 'h', 'num', { step: 0.1 }) + '</div>' +
          fld('Scale text, lines and points with the page', 'scale', 'bool') + '<div class="ck-note" id="ck-scalenote"></div>' +
          '<div class="ck-grp">Space around the plot (pt)</div><div class="ck-grid">' + fld('Left', 'margin.l', 'num', { step: 1 }) + fld('Right', 'margin.r', 'num', { step: 1 }) + fld('Top', 'margin.t', 'num', { step: 1 }) + fld('Bottom', 'margin.b', 'num', { step: 1 }) + '</div>' +
          '<div class="ck-row"><button type="button" class="ck-btn" data-a="resetlayout">Reset positions &amp; margins</button><button type="button" class="ck-btn" data-a="resetall">Reset everything</button></div>' +
          '<div class="ck-note" id="ck-pngnote"></div>';
      }
      panel.innerHTML = h; pngNote(); scaleNote();
    }
    // What the type comes to on paper: with Scale on the sizes follow the page width, so a narrow page is a small figure — and said so.
    function scaleNote(){
      var el = panel.querySelector('#ck-scalenote'); if (!el || !scene) return;
      var k = scene.k || 1, pt = spec.x.size * k, y = spec.y.size * k, lo = Math.min(pt, y);
      el.innerHTML = spec.scale ? 'Everything in the figure is drawn in proportion to its width, so the page can be resized without changing how it looks. Axis numbers are ' + (+lo.toFixed(1)) + ' pt at ' + (+spec.w.toFixed(1)) + ' in.' + (lo < 6 ? ' <span class="ck-warn">Most journals want 6 pt or more — raise the sizes, or use a wider page.</span>' : '') : 'Sizes are real points: a smaller page holds the same type and lines, so they take more of it.';
    }
    function pngNote(){ var el = panel.querySelector('#ck-pngnote'); if (!el || !scene) return; var s = X.pngSize(scene, dpi); el.textContent = 'PNG at ' + dpi + ' dpi: ' + s.w + ' × ' + s.h + ' px' + (s.scaled ? ' — larger than a browser can draw, so it is made at ' + s.effective + ' dpi' : '') + '.'; }
    function dataHtml(){
      var its = doc.items || [];
      if (!its.length) return '<div class="ck-hint">Nothing to plot yet.</div>';
      var anyOmit = Object.keys(spec.omit).some(function(k){ return spec.omit[k]; });
      return '<div class="ck-note">Click a replicate to leave it out of the chart — means, error bars and fits are recalculated without it.' + (anyOmit ? ' <button type="button" class="ck-link" data-a="restoreomit">Put them all back</button>' : '') + '</div>' + its.map(function(it, ii){
        var hid = spec.hidden[it.id], col = C.itemColor(spec, it, ii, its.length);
        var failed = !hid && fitFailed().some(function(f){ return f.id === it.id; });
        return '<div class="ck-dg' + (hid ? ' off' : '') + '"><div class="ck-dh"><i style="background:' + col + '"></i><button type="button" class="ck-name" data-pick="bar:' + esc(it.id) + '">' + esc(it.name) + '</button><button type="button" class="ck-link" data-a="hideitem" data-id="' + esc(it.id) + '">' + (hid ? 'Show' : 'Hide') + '</button></div>' +
          (failed ? '<div class="ck-fitnote">Too few points left to refit — its curve is not drawn.</div>' : '') +
          (hid ? '' : (it.points || []).map(function(p){ return '<div class="ck-dp"><span class="ck-dx">' + esc(p.label != null ? p.label : p.x) + '</span><span class="ck-reps">' + (p.reps || []).map(function(r){ var off = spec.omit[r.id]; return '<button type="button" class="ck-rep' + (off ? ' off' : '') + '" data-omit="' + esc(r.id) + '" title="' + (off ? 'Omitted — click to put it back' : 'Click to omit') + '">' + esc(C.fin(r.v) ? String(+(+r.v).toPrecision(4)) : '–') + '</button>'; }).join('') + '</span></div>'; }).join('')) + '</div>';
      }).join('');
    }

    // ── changes ────────────────────────────────────────────────
    function setPath(path, v, k){ pushUndo(k || path); put(spec, path, v); C.sanitize(spec); draw(); save(); }
    root.addEventListener('input', function(e){
      var t = e.target;
      if (t.dataset.p) { var v = t.dataset.t === 'bool' ? t.checked : t.dataset.t === 'selnum' ? +t.value : t.dataset.t === 'num' || t.dataset.t === 'numauto' ? (t.value === '' ? (t.dataset.t === 'numauto' ? null : 0) : +t.value) : t.value; if ((t.dataset.t === 'num' || t.dataset.t === 'numauto') && v !== null && !isFinite(v)) return; setPath(t.dataset.p, v); if (t.dataset.t === 'bool' || t.tagName === 'SELECT') { renderPanel(); } }
      else if (t.dataset.tp) { var vv = +t.value; if (!isFinite(vv) || t.value === '') return; setPath(t.dataset.tp, vv); }
      else if (t.dataset.text) { var id = t.dataset.text; pushUndo('text:' + id); if (id.indexOf('title') === 0) spec.title[+id.slice(5)].text = t.value; else spec[id].text = t.value; draw(); save(); }
      else if (t.dataset.item) { pushUndo('col:' + t.dataset.item); spec.colors[t.dataset.item] = t.value; draw(); save(); renderSwatches(); }
    });
    function renderSwatches(){ /* a colour picker holds its own value while it is dragged; the swatches in the selection card follow on change */ }
    root.addEventListener('change', function(e){
      var t = e.target;
      if (t.dataset.a === 'dpi') { dpi = +t.value; pngNote(); }
      else if (t.dataset.a === 'snap') { pushUndo('snap'); spec.snap = t.checked; save(); }
      else if (t.dataset.item) { renderSel(); if (tab === 'data' || tab === 'colors') renderPanel(); }
      else if (t.dataset.p) renderPanel();
    });
    root.addEventListener('click', function(e){
      var t = e.target.closest('button, .ck-swb'); if (!t || !root.contains(t)) return;
      var d = t.dataset;
      if (d.kind) { pushUndo('kind'); spec.kind = d.kind; syncBar(); draw(); renderPanel(); save(); return; }
      if (d.tab) { tab = d.tab; renderTabs(); renderPanel(); return; }
      if (d.pick) { select(d.pick); return; }
      if (d.omit) { pushUndo('omit'); spec.omit[d.omit] = !spec.omit[d.omit]; if (!spec.omit[d.omit]) delete spec.omit[d.omit]; draw(); renderPanel(); save(); return; }
      if (d.pal) { pushUndo('palette'); spec.palette = d.pal; spec.colors = {}; draw(); renderPanel(); renderSel(); save(); return; }
      if (d.page) { var p = d.page.split(','); pushUndo('page'); spec.w = +p[0]; spec.h = +p[1]; draw(); renderPanel(); save(); return; }
      if (d.tg) { var path = d.tg, tt = path.indexOf('title') === 0 ? spec.title[+path.charAt(5)] : spec[path.split('.')[0]], key = path.split('.')[1]; pushUndo('tg'); tt[key] = !tt[key]; draw(); renderSel(); save(); return; }
      if (d.al) { align(d.al); return; }
      var a = d.a; if (!a) return;
      if (a === 'undo') doUndo(); else if (a === 'redo') doRedo();
      else if (a === 'png') exportPNG(); else if (a === 'pdf') exportPDF(); else if (a === 'svg') exportSVG();
      else if (a === 'deselect') select(null);
      else if (a === 'setcolor') { pushUndo('col'); spec.colors[d.id] = d.c; draw(); renderSel(); if (tab === 'colors' || tab === 'data') renderPanel(); save(); }
      else if (a === 'resetcolor') { pushUndo('col'); delete spec.colors[d.id]; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'hideitem') { pushUndo('hide'); spec.hidden[d.id] = !spec.hidden[d.id]; if (!spec.hidden[d.id]) delete spec.hidden[d.id]; if (sel && itemOf(sel) === d.id) sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'hideleg') { pushUndo('leg'); spec.legend.show = false; sel = null; draw(); renderSel(); renderPanel(); save(); }
      else if (a === 'resetpos') { if (sel) { pushUndo('pos'); delete spec.pos[sel.indexOf('leg:') === 0 ? 'legend' : sel]; draw(); overlay(); save(); } }
      else if (a === 'restoreomit') { pushUndo('omit'); spec.omit = {}; draw(); renderPanel(); save(); }
      else if (a === 'resetlayout') { pushUndo('layout'); spec.pos = {}; spec.margin = { l: 0, r: 0, t: 0, b: 0 }; draw(); renderPanel(); save(); }
      else if (a === 'resetall') { pushUndo('all'); spec = C.withDefaults(null); sel = null; syncBar(); draw(); renderSel(); renderPanel(); save(); }
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
      var id = el.dataset.el; select(id);
      var did = id.indexOf('leg:') === 0 ? 'legend' : id; if (!DRAG.test(did)) return;
      var nd = nodeOf(did); if (!nd) return;
      e.preventDefault();
      var start = spec.pos[did] || { dx: 0, dy: 0 }, r0 = rectOf(nd), cand = candidates(did);
      drag = { id: did, x: e.clientX, y: e.clientY, start: { dx: start.dx, dy: start.dy }, r0: r0, cand: cand, moved: false, marked: false };
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    });
    function candidates(skip){
      var xs = [], ys = [], P = scene.plot;
      [[P.x, P.x + P.w, P.y, P.y + P.h]].forEach(function(b){ xs.push(b[0], (b[0] + b[1]) / 2, b[1]); ys.push(b[2], (b[2] + b[3]) / 2, b[3]); });
      xs.push(scene.W / 2, 8, scene.W - 8); ys.push(scene.H / 2, 8, scene.H - 8);
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
    function endDrag(){ if (!drag) return; var m = drag.moved; drag = null; if (m) { draw(); save(); } else overlay(); }
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('dblclick', function(e){ var el = e.target.closest('[data-el]'); if (el && TEXTS[el.dataset.el]) { select(el.dataset.el); var inp = selBox.querySelector('.ck-txt'); if (inp) { inp.focus(); inp.select(); } } });
    root.addEventListener('keydown', function(e){
      var t = e.target, typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT';
      var mod = e.metaKey || e.ctrlKey, k = (e.key || '').toLowerCase();
      if (mod && k === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
      if (typing) { if (e.key === 'Enter' && t.classList.contains('ck-txt')) { e.preventDefault(); t.blur(); } return; }
      if (e.key === 'Escape') { select(null); return; }
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
    function refresh(){
      try { doc = opts.doc ? opts.doc() || { items: [] } : { items: [] }; } catch (e) { doc = { items: [] }; }
      // different data: what was done to the old data (omitted replicates, colours, positions, retyped titles) goes
      if (doc.sig !== undefined && lastSig !== null && doc.sig !== lastSig) {
        spec.omit = {}; spec.hidden = {}; spec.colors = {}; spec.pos = {}; spec.ref.y = null; spec.title.forEach(function(t){ t.text = null; }); spec.xTitle.text = null; spec.yTitle.text = null; undo = []; redo = []; sel = null;
      }
      if (doc.sig !== undefined) lastSig = doc.sig;
      var slot = root.querySelector('.ck-slot'); if (slot && opts.slot) { try { opts.slot(slot); } catch (e) {} }
      draw(); renderSel(); renderTabs(); renderPanel(); syncBar();
      setTimeout(fit, 0);
    }
    refresh();
    return { refresh: refresh, draw: draw, spec: function(){ return spec; }, scene: function(){ return scene; }, select: select, exportPNG: exportPNG, exportPDF: exportPDF };
  }
  return { mount: mount };
})();
