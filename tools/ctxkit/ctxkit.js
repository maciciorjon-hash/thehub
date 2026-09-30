// The right-click menu, the same in every place that has one.
//   ctxBind(resolve)     resolve(event) returns the items for what is under the pointer, or null to
//                        leave the browser's own menu alone. Fields keep their native menu (paste,
//                        spelling) and so does any selected text — the kit never takes those.
//   ctxOpen(items, x, y) items: {label, k:'⌘C', act, disabled, danger, check} | {sep:true} | {hd:'title'}
//   ctxClose(), ctxIsOpen(), CTX_MOD ('⌘' or 'Ctrl+')
// The menu is measured, then kept fully on screen; ↑ ↓ Enter Esc work; a press outside, a scroll,
// a resize or a blur puts it away. It needs the page's tokens (--surface, --border2, --text…).
var CTX_MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl+';
var ctxClose, ctxIsOpen, ctxOpen, ctxBind;
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
      // Fields keep the browser's menu (paste, spelling), and so does any selected text.
      if (t.closest('input,textarea,select,[contenteditable="true"]')) return;
      var sel = window.getSelection && window.getSelection(); if (sel && String(sel).trim()) return;
      var items = resolve(e); if (!items) return;
      e.preventDefault();
      ctxOpen(items, e.clientX, e.clientY);
    });
  };
  document.addEventListener('pointerdown', function(e){ if (el && !el.contains(e.target)) ctxClose(); }, true);
  window.addEventListener('blur', ctxClose);
  window.addEventListener('resize', ctxClose);
  document.addEventListener('scroll', function(e){ if (el && !el.contains(e.target)) ctxClose(); }, true);
})();
