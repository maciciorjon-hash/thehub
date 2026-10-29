// The Setup dialog every dHUB analysis opens with: numbered steps, Back / Next, titled groups. An app says what its steps are
// (a key, a label, a function that draws the step into its pane) and what its footer holds; the kit owns everything that
// must look and behave the same in each app — the dialog, the focus trap, Escape, the numbered tabs that turn green when a
// step is done, the buttons, and the small pieces most steps are made of (group, field, switch, drop zone, plate list,
// the plate drawn small, a control row, a review list).
//   var K = SetupKit.create({ id:'bs', title:'Beacon', sub:'Set up your analysis', steps:[{key:'assay', label:'Assay', render:fn, live:fn, done:fn, focus:false}],
//                              foot:[{label:'Clear all', title:'…', quiet:false, fn:fn}], nextLabel:fn(i, last), finish:fn, onOpen:fn, onClose:fn, wire:fn(dialog) });
//   An app whose steps are already in its page keeps them: a pane whose id exists is moved into the dialog, not made (ids.pane says what its id is).
//   Optional: cardClass (a class on the card), ids {close, sub, back, next, body, pane:fn(key)} (an app that already has ids for them),
//   status (id of a quiet line above the footer), navExtra (html after Next — a Run button), steps[].attrs / .extra (on / inside a tab), K.build().
//   K.open(step) · K.close() · K.go(i) · K.next() · K.back() · K.refresh() · K.tabs() · K.isOpen() · K.step · K.pane(key) · K.body · K.el
var SetupKit = (function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>';
  var UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>';

  // ── pieces ──────────────────────────────────────────────────────────────────────────────────
  // A titled card. `opt` is the quiet line on the right of the title ("optional — it travels with the exports").
  function group(title, opt, body, attrs){
    return '<section class="sx-group"' + (attrs ? ' ' + attrs : '') + '><div class="sx-ghd"><span class="sx-gt">' + title + '</span>' + (opt ? '<span class="sx-opt">' + opt + '</span>' : '') + '</div><div class="sx-gb">' + body + '</div></section>';
  }
  // A caption over a control, and a line of help under it.
  function field(label, forId, control, hint, hintId){
    return '<div class="sx-f"><label' + (forId ? ' for="' + forId + '"' : '') + '>' + label + '</label>' + control + (hint != null ? '<div class="sx-hint"' + (hintId ? ' id="' + hintId + '"' : '') + '>' + hint + '</div>' : '') + '</div>';
  }
  // A switch between a few choices: items [[value, text]], the active one by value; each button carries data-<attr>.
  function seg(id, items, active, attr, label){
    return '<div class="sx-seg" id="' + id + '" role="group"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + items.map(function(x){
      return '<button type="button" data-' + (attr || 'v') + '="' + esc(x[0]) + '"' + (x[2] ? ' title="' + esc(x[2]) + '"' : '') + ' class="' + (String(x[0]) === String(active) ? 'active' : '') + '">' + x[1] + '</button>';
    }).join('') + '</div>';
  }
  var CHL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>', CHR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  function drop(id, title, text){ return '<div class="sx-drop" id="' + id + '" role="button" tabindex="0">' + UP + '<div><b>' + title + '</b>' + text + '</div></div>'; }
  // A plate in the list of plates: its name and what it holds, chips for what has been read (items [[text, count]]), a remove button.
  function plateRow(i, on, name, sub, chips, del){
    return '<div class="sx-pl' + (on ? ' on' : '') + '"><div class="nm" data-plate="' + i + '"><b>' + esc(name) + '</b><span>' + esc(sub) + '</span></div><div class="sx-ch">' +
      chips.map(function(c){ return '<span class="sx-chip' + (c[1] ? ' ok' : '') + '">' + esc(c[0]) + (c[1] ? ' · ' + c[1] : '') + '</span>'; }).join('') + '</div>' +
      '<button class="sx-ghost" data-delplate="' + i + '" title="Remove this plate" aria-label="Remove ' + esc(name) + '">' + esc(del) + '</button></div>';
  }
  // The plate, small. paint: true when the plate is dragged on (see paint()). cell(r, c) → { bg: css colour or '', rd: has readings, cls: extra class, t: tooltip }. wells are the same on every app: rows A…, columns 1….
  function mini(o){
    var rows = o.rows, cols = o.cols, h = '<div class="sx-mini' + (o.paint ? ' paint' : '') + '" style="grid-template-columns:14px repeat(' + cols + ',1fr)"><span></span>', r, c;
    for (c = 0; c < cols; c++) h += '<span class="l" data-col="' + (c + 1) + '">' + (cols > 12 && c % 2 ? '' : c + 1) + '</span>';
    for (r = 0; r < rows; r++) {
      h += '<span class="l" data-row="' + String.fromCharCode(65 + r) + '">' + String.fromCharCode(65 + r) + '</span>';
      for (c = 0; c < cols; c++) {
        var x = o.cell(r, c) || {};
        h += '<span class="w' + (x.rd ? ' rd' : '') + (x.cls ? ' ' + x.cls : '') + '" data-p="' + pos(r, c) + '"' + (x.bg ? ' style="background:' + x.bg + ';"' : '') + (x.t ? ' title="' + esc(x.t) + '"' : '') + '></span>';
      }
    }
    return '<div class="sx-mini-t">' + esc(o.title || '') + '<span>' + esc(o.sub || '') + '</span></div>' + h + '</div>' + legend(o.legend || [], o.empty);
  }
  // Drag a box over the plate drawn by mini(): o.has(id) → the well already holds what is being painted (a drag that starts on one erases),
  // o.apply(ids, add) takes the wells of the box when the button is let go. A row letter or a column number takes the whole row or column; Esc cancels.
  // root is the element that holds the plate and stays when the plate is drawn again; calling paint twice on one root binds it once.
  function paint(root, o){
    if (!root || root._sxPaint) { if (root) root._sxPaint = o; return; }
    root._sxPaint = o;
    var drag = null;
    root._sxStop = function(){ if (!drag) return false; drag = null; show([], true); return true; };
    function cur(){ return root._sxPaint; }
    function box(a, b){
      var A = rc(a), B = rc(b), out = [], r, c;
      for (r = Math.min(A.r, B.r); r <= Math.max(A.r, B.r); r++) for (c = Math.min(A.c, B.c); c <= Math.max(A.c, B.c); c++) out.push(pos(r, c));
      return out;
    }
    function show(ids, add){
      var set = {}; (ids || []).forEach(function(x){ set[x] = 1; });
      Array.prototype.forEach.call(root.querySelectorAll('.sx-mini .w'), function(w){ var on = !!set[w.dataset.p]; w.classList.toggle('pv', on); w.classList.toggle('rm', on && !add); });
    }
    function wellAt(e){ var el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest ? el.closest('.sx-mini .w') : null; }
    function line(h){
      var o2 = cur(), ids = [], i, n = h.dataset.row ? o2.cols : o2.rows;
      for (i = 0; i < n; i++) ids.push(h.dataset.row ? h.dataset.row + (i + 1) : String.fromCharCode(65 + i) + h.dataset.col);
      return ids;
    }
    root.addEventListener('pointerdown', function(e){
      if (e.button) return;
      var o2 = cur(), w = e.target.closest && e.target.closest('.sx-mini .w'), h = e.target.closest && e.target.closest('.sx-mini .l[data-row], .sx-mini .l[data-col]');
      if (h) { var ids = line(h).filter(function(x){ return !o2.exists || o2.exists(x); }); if (!ids.length) return; var add = !ids.every(function(x){ return o2.has(x); }); e.preventDefault(); o2.apply(ids, add); return; }
      if (!w || (o2.exists && !o2.exists(w.dataset.p))) return;
      e.preventDefault();
      drag = { a: w.dataset.p, add: !o2.has(w.dataset.p), ids: [w.dataset.p] };
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
      show(drag.ids, drag.add);
    });
    root.addEventListener('pointermove', function(e){
      if (!drag) return; var w = wellAt(e); if (!w || w.dataset.p === drag.last) return;
      drag.last = w.dataset.p; var o2 = cur(); drag.ids = box(drag.a, w.dataset.p).filter(function(x){ return !o2.exists || o2.exists(x); }); show(drag.ids, drag.add);
    });
    function end(e, cancel){
      if (!drag) return; var d = drag; drag = null; show([], true);
      try { root.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!cancel && d.ids.length) cur().apply(d.ids, d.add);
    }
    root.addEventListener('pointerup', function(e){ end(e, false); });
    root.addEventListener('pointercancel', function(e){ end(e, true); });
    // Esc while the button is down only drops the box; the dialog's own Esc (which closes it) must not hear it, so this listens first, on the window
    if (!paintEsc) { paintEsc = true; window.addEventListener('keydown', function(e){ if (e.key !== 'Escape') return; var m = document.querySelector('.sx-mini.paint'), r = m && m.parentNode; if (r && r._sxStop && r._sxStop()) { e.stopPropagation(); e.preventDefault(); } }, true); }
  }
  var paintEsc = false;
  // items [[colour, text, count]]
  function legend(items, empty){
    return items.length ? '<div class="sx-legend">' + items.map(function(x){ return '<div><i style="background:' + x[0] + '"></i>' + esc(x[1]) + '<em>' + x[2] + '</em></div>'; }).join('') + '</div>'
      : '<div class="sx-hint" style="margin-top:8px">' + (empty || 'Nothing is marked on this plate yet.') + '</div>';
  }
  // One control row: swatch, name and what it is for, the box that takes A1:D1, how many wells.
  function ctlRow(key, color, name, hint, ph){
    return '<div class="sx-ctl" data-k="' + esc(key) + '"><i style="background:' + color + '"></i><div class="t"><b>' + esc(name) + '</b><span>' + esc(hint) + '</span></div><input type="text" data-role="' + esc(key) + '" placeholder="' + esc(ph || 'e.g. A1:D1') + '" aria-label="Wells of ' + esc(name) + '" spellcheck="false" autocomplete="off"><span class="n"></span></div>';
  }
  // The Review step's list. items [[level 1|2|3, html]] sorted by level; nothing in it says everything is there.
  function issues(items, okText){
    return '<div class="sx-issues">' + (items.length ? items.slice().sort(function(a, b){ return a[0] - b[0]; }).map(function(x){ return '<div class="sx-issue">' + WARN + '<div>' + x[1] + '</div></div>'; }).join('')
      : '<div class="sx-issue ok">' + OK + '<div><b>' + (okText || 'Everything the results need is there.') + '</b></div></div>') + '</div>';
  }
  // "A1:D1" for a set of wells: a rectangle is one range, anything else is runs along rows, joined when consecutive rows repeat them.
  function rangeStr(wells, pos){
    if (!wells.length) return '';
    var by = {}; wells.forEach(function(p){ var q = rc(p); (by[q.r] = by[q.r] || []).push(q.c); });
    var rows = Object.keys(by).map(Number).sort(function(a, b){ return a - b; }), items = [];
    rows.forEach(function(r){
      var cs = by[r].sort(function(a, b){ return a - b; }), runs = [], s = cs[0], prev = cs[0];
      for (var i = 1; i <= cs.length; i++) { if (cs[i] !== prev + 1) { runs.push([s, prev]); s = cs[i]; } prev = cs[i]; }
      items.push({ r: r, key: runs.map(function(x){ return x[0] + '-' + x[1]; }).join(','), runs: runs });
    });
    var out = [], i = 0;
    while (i < items.length) {
      var j = i; while (j + 1 < items.length && items[j + 1].key === items[i].key && items[j + 1].r === items[j].r + 1) j++;
      items[i].runs.forEach(function(x){ var a = pos(items[i].r, x[0]), b = pos(items[j].r, x[1]); out.push(a === b ? a : a + ':' + b); });
      i = j + 1;
    }
    return out.join(', ');
  }
  function rc(w){ var m = /^([A-P])(\d+)$/.exec(String(w || '')); return m ? { r: m[1].charCodeAt(0) - 65, c: +m[2] - 1 } : { r: 0, c: 0 }; }
  function pos(r, c){ return String.fromCharCode(65 + r) + (c + 1); }
  // Files dragged onto the dialog: the drop zone lights up and handle(FileList) takes them.
  function dropFiles(d, handle){
    var has = function(e){ return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; };
    d.addEventListener('dragover', function(e){ if (has(e)) { e.preventDefault(); var z = e.target.closest && e.target.closest('.sx-drop'); if (z) z.classList.add('over'); } });
    d.addEventListener('dragleave', function(e){ var z = e.target.closest && e.target.closest('.sx-drop'); if (z) z.classList.remove('over'); });
    d.addEventListener('drop', function(e){ if (!has(e)) return; e.preventDefault(); var z = d.querySelector('.sx-drop'); if (z) z.classList.remove('over'); handle(e.dataTransfer.files); });
  }
  // Values typed into a plate: a table of boxes. get(p) → the value shown; the app commits on change and reads data-p / data-r / data-c.
  function handGrid(rows, cols, get){
    var h = '<div class="sx-hand-wrap"><table><thead><tr><th></th>', r, c;
    for (c = 0; c < cols; c++) h += '<th>' + (c + 1) + '</th>';
    h += '</tr></thead><tbody>';
    for (r = 0; r < rows; r++) {
      h += '<tr><th class="r">' + String.fromCharCode(65 + r) + '</th>';
      for (c = 0; c < cols; c++) { var p = pos(r, c), v = get(p); h += '<td><input type="text" inputmode="decimal" data-p="' + p + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + p + '" value="' + (v === undefined || v === null ? '' : esc(String(v))) + '"></td>'; }
      h += '</tr>';
    }
    return h + '</tbody></table></div>';
  }
  // Arrow keys / Enter walk the typed grid; a block pasted from Excel fills from the cell it lands on. commit(input) stores one cell.
  function handKeys(root, e, inp){
    var d = { ArrowDown: [1, 0], ArrowUp: [-1, 0], Enter: [1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }[e.key]; if (!d) return;
    if ((e.key === 'ArrowRight' && inp.selectionEnd < inp.value.length) || (e.key === 'ArrowLeft' && inp.selectionStart > 0)) return;
    var t = root.querySelector('input[data-r="' + (+inp.dataset.r + d[0]) + '"][data-c="' + (+inp.dataset.c + d[1]) + '"]');
    if (t) { e.preventDefault(); t.focus(); t.select(); }
  }
  function handPaste(root, e, inp, commit){
    var txt = (e.clipboardData || window.clipboardData).getData('text') || '', rows = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(function(l){ return l.split('\t'); });
    if (rows.length === 1 && rows[0].length === 1) return;
    e.preventDefault();
    var r0 = +inp.dataset.r, c0 = +inp.dataset.c, last = null;
    rows.forEach(function(row, ri){ row.forEach(function(cell, ci){ var t = root.querySelector('input[data-r="' + (r0 + ri) + '"][data-c="' + (c0 + ci) + '"]'); if (t) { t.value = cell.trim(); commit(t); last = t; } }); });
    if (last) last.focus();
  }

  // ── the dialog ──────────────────────────────────────────────────────────────────────────────
  function create(o){
    var id = o.id, steps = o.steps, ids = o.ids || {}, K = { step: 0, from: null, built: false };
    function el(x){ return document.getElementById(x); }
    function paneId(key){ return ids.pane ? ids.pane(key) : id + '-p-' + key; }
    var idClose = ids.close || id + '-close', idBack = ids.back || id + '-back', idNext = ids.next || id + '-next', idBody = ids.body || id + '-body';
    function build(){
      var d = document.createElement('div'); d.id = id; d.className = 'setup-overlay hidden';
      var have = {}; steps.forEach(function(s){ var e = el(paneId(s.key)); if (e) have[s.key] = e; });
      d.innerHTML = '<div class="setup-card' + (o.cardClass ? ' ' + o.cardClass : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title" data-step="' + steps[0].key + '">' +
        '<div class="setup-hdr"><div><div class="setup-htitle" id="' + id + '-title">' + esc(o.title) + '</div><div class="setup-hsub"' + (ids.sub ? ' id="' + ids.sub + '"' : '') + '>' + esc(o.sub || '') + '</div></div><button class="setup-hclose" id="' + idClose + '" aria-label="Close setup" title="Close (Esc)">' + X + '</button></div>' +
        '<div class="setup-stabs" role="tablist">' + steps.map(function(s, i){ return '<button class="setup-stab" role="tab" id="' + id + '-t-' + esc(s.key) + '" aria-controls="' + paneId(s.key) + '" tabindex="-1" data-i="' + i + '" data-tab="' + esc(s.key) + '"' + (s.attrs ? ' ' + s.attrs : '') + '><span class="sx-n">' + (i + 1) + '</span>' + esc(s.label) + (s.extra || '') + '</button>'; }).join('') + '</div>' +
        '<div class="setup-sbody" id="' + idBody + '">' + steps.map(function(s){ return have[s.key] ? '<div data-adopt="' + esc(s.key) + '"></div>' : '<div class="setup-pane" id="' + paneId(s.key) + '"></div>'; }).join('') + '</div>' +
        '<div class="setup-foot">' + (o.status ? '<div class="setup-fstatus" id="' + o.status + '"></div>' : '') + '<div class="sx-proj">' + (o.foot || []).map(function(b, i){ return '<button class="sx-ghost' + (b.quiet ? ' q' : '') + '" data-foot="' + i + '"' + (b.title ? ' title="' + esc(b.title) + '"' : '') + '>' + esc(b.label) + '</button>'; }).join('') + '</div>' +
        '<div class="sx-nav"><button class="sx-sec" id="' + idBack + '">' + CHL + ' Back</button><button class="sx-pri" id="' + idNext + '">Next ' + CHR + '</button>' + (o.navExtra || '') + '</div></div></div>';
      document.body.appendChild(d);
      steps.forEach(function(s){ var h = have[s.key], at = h && d.querySelector('[data-adopt="' + s.key + '"]'); if (h && at) { h.classList.add('setup-pane'); at.replaceWith(h); } });
      steps.forEach(function(s){ var p = el(paneId(s.key)); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', id + '-t-' + s.key); } });
      K.el = d; K.body = el(idBody);
      var down = null;   // a press that began inside the card and ended on the backdrop (selecting text) is not a click on the backdrop
      d.addEventListener('mousedown', function(e){ down = e.target; });
      d.addEventListener('click', function(e){
        var from = down; down = null;
        if (e.target === d) { if (from === null || from === d) K.close(); return; }
        var t = e.target.closest && e.target.closest('button'); if (!t) return;
        if (t.id === idClose) K.close();
        else if (t.id === idBack) K.back();
        else if (t.id === idNext) K.next();
        else if (t.classList.contains('setup-stab')) K.go(+t.dataset.i);
        else if (t.dataset.foot !== undefined) o.foot[+t.dataset.foot].fn(K);
      });
      // Esc and Tab are heard on the document while the dialog is open, so they work wherever the focus is (on the page behind it too);
      // a question dialog drawn on top of this one says so with o.nested and keeps its own keys.
      K._keys = function(e){
        if (!K.isOpen() || (o.nested && o.nested())) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); K.close(); return; }
        if (e.key === 'Tab') {   // keep Tab inside the dialog
          var f = Array.prototype.filter.call(d.querySelectorAll('button,input,select,textarea,[tabindex]:not([tabindex="-1"])'), function(x){ return !x.disabled && x.offsetParent !== null; });
          if (!f.length) return; var a = f[0], z = f[f.length - 1];
          if (!d.contains(document.activeElement)) { e.preventDefault(); (d.querySelector('.setup-stab.active') || a).focus(); }
          else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
          return;
        }
        var t = e.target;   // the step tabs: one tab stop, moved by the arrows
        if (t && t.getAttribute && t.getAttribute('role') === 'tab' && d.contains(t)) {
          var n = e.key === 'ArrowRight' ? K.step + 1 : e.key === 'ArrowLeft' ? K.step - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? steps.length - 1 : -1;
          if (n >= 0 && n < steps.length) { e.preventDefault(); K.go(n, true); var tb = d.querySelectorAll('.setup-stab')[n]; if (tb) tb.focus(); }
        }
      };
      document.addEventListener('keydown', K._keys, true);
      if (o.wire) o.wire(d, K);
      K.built = true;
    }
    K.isOpen = function(){ return !!K.el && !K.el.classList.contains('hidden'); };
    K.build = function(){ if (!K.built) build(); return K; };
    K.pane = function(key){ return el(paneId(key)); };
    K.open = function(step){
      if (!K.built) build();
      K.from = document.activeElement;
      if (o.onOpen) o.onOpen(K);
      K.el.classList.remove('hidden');
      K.go(typeof step === 'number' ? step : (o.startStep ? o.startStep(K) : 0));
    };
    K.close = function(){
      if (!K.isOpen()) return;
      K.el.classList.add('hidden');
      if (o.onClose) o.onClose(K);
      try { if (K.from && K.from.focus) K.from.focus(); } catch (e) {}
    };
    K.hide = function(){ if (K.el) K.el.classList.add('hidden'); };      // away for a moment, without the close hook
    K.show = function(){ if (K.el) K.el.classList.remove('hidden'); };
    K.go = function(i, keepFocus){
      i = Math.max(0, Math.min(steps.length - 1, i)); K.step = i;
      K.el.querySelector('.setup-card').dataset.step = steps[i].key;
      K.el.querySelectorAll('.setup-stab').forEach(function(t, k){ t.classList.toggle('active', k === i); t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      K.el.querySelectorAll('.setup-pane').forEach(function(p, k){ p.classList.toggle('active', k === i); });
      el(idBack).style.visibility = i === 0 ? 'hidden' : '';
      el(idNext).innerHTML = (o.nextLabel ? o.nextLabel(i, i === steps.length - 1) : (i === steps.length - 1 ? 'Done' : 'Next')) + ' ' + CHR;
      steps[i].render(K);
      K.tabs();
      K.body.scrollTop = 0;
      if (steps[i].focus !== false && !keepFocus) {
        var f = K.pane(steps[i].key).querySelector('input:not([type=checkbox]),select,textarea');
        if (f) setTimeout(function(){ try { f.focus({ preventScroll: true }); } catch (e) {} }, 0);
      }
    };
    K.back = function(){ K.go(K.step - 1); };
    // Draw the step again where it is: what the person has scrolled to and typed into stays.
    K.render = function(){ steps[K.step].render(K); K.tabs(); };
    K.next = function(){ if (K.step >= steps.length - 1) { K.close(); if (o.finish) o.finish(K); } else K.go(K.step + 1); };
    // A change made inside a step redraws only the parts that report (the plates, the map, the summary), never the fields being typed in.
    K.refresh = function(){ var s = steps[K.step]; (s.live || s.render)(K); K.tabs(); };
    K.tabs = function(){
      K.el.querySelectorAll('.setup-stab').forEach(function(t, k){ t.classList.toggle('done', !!(steps[k].done && steps[k].done(K)) && k !== K.step); });
    };
    return K;
  }
  return { create: create, esc: esc, group: group, field: field, seg: seg, drop: drop, plateRow: plateRow, mini: mini, paint: paint, legend: legend, ctlRow: ctlRow, issues: issues, rangeStr: rangeStr, pos: pos, rc: rc,
           dropFiles: dropFiles, handGrid: handGrid, handKeys: handKeys, handPaste: handPaste, OK: OK, WARN: WARN, X: X, CHL: CHL, CHR: CHR };
})();
