// The right-click menu, the same in every place that has one.
//   ctxBind(resolve)     resolve(event) returns the items for what is under the pointer, or null to
//                        leave the browser's own menu alone. Fields keep their native menu (paste,
//                        spelling) and so does any selected text — the kit never takes those.
//   ctxApp(resolve, opts) the whole menu for an app: resolve(event, target) returns the items for what the
//                        pointer is on (or null); the kit then adds what any page can offer — copy a
//                        cell / row / column / table, copy or save a chart as an image — then opts.acts
//                        (the app's own actions: [{l, f, args, k, danger, when}], shown only if function
//                        f exists), then Search / Dark mode / Back to the Hub. opts.canvas:false skips
//                        the image items (a WebGL viewer cannot be read back).
//   ctxOpen(items, x, y) items: {label, k:'⌘C', act, disabled, danger, check} | {sep:true} | {hd:'title'}
//   ctxClose(), ctxIsOpen(), CTX_MOD ('⌘' or 'Ctrl+')
// The menu is measured, then kept fully on screen; ↑ ↓ Enter Esc work; a press outside, a scroll,
// a resize or a blur puts it away. It needs the page's tokens (--surface, --border2, --text…).
var CTX_MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl+';
var ctxClose, ctxIsOpen, ctxOpen, ctxBind, ctxApp;
(function(){
  var el = null, on = -1;
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  ctxClose = function(){ if (el) { el.remove(); el = null; on = -1; } };
  ctxIsOpen = function(){ return !!el; };
  ctxOpen = function(items, x, y){
    ctxClose();
    var list = [];
    (items || []).forEach(function(it){
      if (!it) return;
      if (it.sep) { if (list.length && !list[list.length - 1].sep) list.push(it); return; }
      list.push(it);
    });
    while (list.length && list[list.length - 1].sep) list.pop();
    if (!list.filter(function(i){ return i.label; }).length) return;
    var m = document.createElement('div'); m.className = 'ctx'; m.setAttribute('role', 'menu'); m.tabIndex = -1;
    m.innerHTML = list.map(function(it, i){
      if (it.sep) return '<div class="ctx-sep" role="separator"></div>';
      if (it.hd) return '<div class="ctx-hd">' + esc(it.hd) + '</div>';
      return '<button class="ctx-i' + (it.danger ? ' danger' : '') + '" role="menuitem" data-i="' + i + '"' + (it.disabled ? ' disabled' : '') + '>' +
        (it.check !== undefined ? '<span class="ck">' + (it.check ? '✓' : '') + '</span>' : '') + '<span>' + esc(it.label) + '</span>' + (it.k ? '<span class="k">' + esc(it.k) + '</span>' : '') + '</button>';
    }).join('');
    document.body.appendChild(m);
    var w = m.offsetWidth, h = m.offsetHeight, M = 8;
    var left = x + w + M > window.innerWidth ? x - w : x, top = y + h + M > window.innerHeight ? y - h : y;
    m.style.left = Math.max(M, Math.min(left, window.innerWidth - w - M)) + 'px';
    m.style.top = Math.max(M, Math.min(top, window.innerHeight - h - M)) + 'px';
    requestAnimationFrame(function(){ m.classList.add('open'); });
    el = m;
    function hi(i){ on = i; m.querySelectorAll('.ctx-i').forEach(function(b){ b.classList.toggle('on', +b.dataset.i === i); }); }
    function move(d){
      var idx = list.map(function(it, i){ return it.label && !it.disabled ? i : -1; }).filter(function(i){ return i >= 0; });
      if (!idx.length) return;
      var p = idx.indexOf(on);
      hi(idx[p < 0 ? (d > 0 ? 0 : idx.length - 1) : (p + d + idx.length) % idx.length]);
    }
    function run(i){
      var it = list[i]; if (!it || !it.act || it.disabled) return;
      ctxClose();
      try { it.act(); } catch(err){ (window.hubToast || window.toast || console.error)('That did not work: ' + err.message); }
    }
    m.addEventListener('mouseover', function(e){ var b = e.target.closest('.ctx-i'); if (b && !b.disabled) hi(+b.dataset.i); });
    m.addEventListener('mouseleave', function(){ hi(-1); });
    m.addEventListener('click', function(e){ var b = e.target.closest('.ctx-i'); if (b) run(+b.dataset.i); });
    m.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    m.addEventListener('keydown', function(e){
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (on >= 0) run(on); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ctxClose(); }
      else if (e.key === 'Tab') { e.preventDefault(); ctxClose(); }
    });
    m.focus({ preventScroll: true });
  };
  ctxBind = function(resolve){
    document.addEventListener('contextmenu', function(e){
      var t = e.target; if (!t || !t.closest) return;
      if (t.closest('.ctx')) { e.preventDefault(); return; }
      if (e.defaultPrevented) return;   // the page already answered (its own menu on a canvas, a column header…)
      // Fields keep the browser's menu (paste, spelling), and so does any selected text.
      if (t.closest('input,textarea,select,[contenteditable="true"]')) return;
      var sel = window.getSelection && window.getSelection(); if (sel && String(sel).trim()) return;
      var items = resolve(e); if (!items) return;
      e.preventDefault();
      ctxOpen(items, e.clientX, e.clientY);
    });
  };
  // ── what any page can offer ────────────────────────────────────────────────────────────────
  function say(m){ (window.hubToast || window.toast || window.showToast || console.log)(m); }
  function copyText(txt, msg){
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function(){ say(msg); }).catch(function(){ say('The browser did not allow copying.'); });
    else say('The browser did not allow copying.');
  }
  function bgColour(){
    var v = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || getComputedStyle(document.body).backgroundColor;
    return v || '#fff';
  }
  function imageBlob(el, cb){
    var w = el.naturalWidth || el.width, h = el.naturalHeight || el.height;
    if (!w || !h) { say('Nothing to copy yet.'); return; }
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.fillStyle = bgColour(); x.fillRect(0, 0, w, h);
    try { x.drawImage(el, 0, 0, w, h); c.toBlob(function(b){ if (b) cb(b); else say('Could not make the image.'); }, 'image/png'); }
    catch(err){ say('That image cannot be read back.'); }
  }
  function download(name, blob){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
  }
  function imageItems(el, name){
    return [
      { label: 'Copy image', act: function(){
          if (!window.ClipboardItem || !navigator.clipboard || !navigator.clipboard.write) { say('This browser cannot copy images — use Save image.'); return; }
          imageBlob(el, function(b){ navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(function(){ say('Image copied.'); }).catch(function(){ say('The browser did not allow copying the image.'); }); });
        } },
      { label: 'Save image (.png)', act: function(){ imageBlob(el, function(b){ download((name || document.title || 'image').replace(/[\\/:*?"<>|\s]+/g, '_') + '.png', b); }); } }
    ];
  }
  function cellText(c){ return (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim(); }
  function tableItems(cell){
    var tb = cell.closest('table'); if (!tb) return [];
    var row = cell.closest('tr'), rows = Array.prototype.slice.call(tb.rows), ci = Array.prototype.indexOf.call(row.cells, cell);
    var tsv = function(rs){ return rs.map(function(r){ return Array.prototype.map.call(r.cells, cellText).join('\t'); }).join('\n'); };
    return [
      { label: 'Copy cell', act: function(){ copyText(cellText(cell), 'Copied.'); } },
      { label: 'Copy row', act: function(){ copyText(tsv([row]), 'Row copied.'); } },
      { label: 'Copy column', act: function(){ copyText(rows.map(function(r){ return r.cells[ci] ? cellText(r.cells[ci]) : ''; }).join('\n'), 'Column copied.'); } },
      { label: 'Copy table', act: function(){ copyText(tsv(rows), 'Table copied — paste it into Excel.'); } }
    ];
  }
  // the first argument of an inline handler on the element or an ancestor: onclick="openDrawer('c7')" → 'c7'
  function argOf(t, fn){
    var re = new RegExp(fn + "\\(\\s*\\\\?'([^'\\\\]+)");
    for (var n = t; n && n.nodeType === 1; n = n.parentElement) { var m = re.exec(n.getAttribute('onclick') || ''); if (m) return { id: m[1], el: n }; }
    return null;
  }
  function hosted(){ try { return window.parent && window.parent !== window; } catch(e){ return false; } }
  function toggleTheme(){
    var root = document.documentElement, was = root.getAttribute('data-theme'), chk = document.getElementById('theme-chk');
    if (chk) { chk.checked = was !== 'dark'; chk.dispatchEvent(new Event('change', { bubbles: true })); }
    if (root.getAttribute('data-theme') === was && typeof window.toggleTheme === 'function') window.toggleTheme();
    if (root.getAttribute('data-theme') === was) {   // neither wired: set it, and keep the Hub's choice
      var nx = was === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', nx); try { localStorage.setItem('hub_theme', nx); } catch(e){}
    }
  }
  function tail(){
    var dark = document.documentElement.getAttribute('data-theme') === 'dark', P = hosted() ? window.parent : null, items = [];
    if (P && P.hubSpot && P.hubSpot.open) items.push({ label: 'Search everything…', k: CTX_MOD + 'K', act: function(){ P.hubSpot.open(); } });
    items.push({ label: dark ? 'Light mode' : 'Dark mode', act: toggleTheme });
    if (P && typeof P.backToHub === 'function') items.push({ label: 'Back to the Hub', act: function(){ P.backToHub(); } });
    return items;
  }
  ctxApp = function(resolve, opts){
    opts = opts || {};
    ctxBind(function(e){
      var t = e.target, items = [], own = resolve ? resolve(e, t) : null;
      if (own) items = items.concat(own);
      var img = t.closest('canvas,img');
      if (opts.canvas !== false && img && (img.width || img.naturalWidth) > 60 && !img.closest('button,[role=button]')) items = items.concat(items.length ? [{ sep: true }] : [], imageItems(img, opts.name));
      var cell = t.closest('td,th');
      if (cell && cell.closest('table')) items = items.concat(items.length ? [{ sep: true }] : [], tableItems(cell));
      var acts = (opts.acts || []).filter(function(a){ return typeof window[a.f] === 'function' && (!a.when || a.when()); }).map(function(a){
        return { label: a.l, k: a.k, danger: a.danger, act: function(){ window[a.f].apply(null, a.args || []); } };
      });
      if (acts.length) items = items.concat(items.length ? [{ sep: true }] : [], acts);
      return items.concat(items.length ? [{ sep: true }] : [], tail());
    });
  };
  ctxApp.arg = argOf; ctxApp.copy = copyText; ctxApp.say = say; ctxApp.imageItems = imageItems;
  document.addEventListener('pointerdown', function(e){ if (el && !el.contains(e.target)) ctxClose(); }, true);
  window.addEventListener('blur', ctxClose);
  window.addEventListener('resize', ctxClose);
  document.addEventListener('scroll', function(e){ if (el && !el.contains(e.target)) ctxClose(); }, true);
})();
