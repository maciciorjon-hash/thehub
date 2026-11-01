/* MenuKit — the chrome the analysis apps share (Lumina, Beacon, Tempo).
     The Settings button and its panel   toggleOpts()      opens and closes it; Esc and a click outside close it, a click inside does not
     The theme                           toggleTheme()     one switch, kept in step with the page's data-theme however it changes (the switch, the Hub's setTheme message, the
                                                           attribute set from outside); stored as hub_theme; the app's charts are redrawn once per change
     Pop-up menus                        rsTogglePop(e, id) · rsCloseExport()
                                                           <span class="rs-menu"><button aria-haspopup="menu">…</button><div class="rs-pop" id="id" role="menu">…<button role="menuitem">…</button></div></span>
                                                           one open at a time; aria-expanded on the button; opened from the keyboard the focus goes in; ↑ ↓ Home End walk the items,
                                                           Esc and a click outside close, the focus goes back to the button; the menu is kept on screen.
   MenuKit.init({ redraw })      redraw() draws the charts again in the new theme
   MenuKit.items(id, rows)       fills a menu from rows [{ t, s, fn, off }] (a title, its line, what it runs) and null for a rule — for a menu whose items depend on the data
   MenuKit.closeAll()            a tab change closes whatever is open
   MenuKit.tabs({ bar, select, pane })  the tab row as one component: roving tabindex (the open tab is the one stop), ← → Home End move along it and wrap, the tab that gets the focus opens
                                 (select(name) is the app's own switch), aria-controls and role=tabpanel on the panes (pane(name) → the pane's id) */
var MenuKit = (function(){
  var root = document.documentElement, redrawFn = null, pend = 0;
  function byId(i){ return document.getElementById(i); }
  /* ── the theme ── */
  function themeNow(){ return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function syncSwitch(){ var c = byId('theme-chk'); if (c) c.checked = themeNow() === 'dark'; }
  function stored(){ try { var t = localStorage.getItem('hub_theme') || localStorage.getItem('lumina_theme'); return t === 'dark' || t === 'light' ? t : null; } catch(e){ return null; } }
  function afterChange(){
    syncSwitch();
    if (pend) return; pend = requestAnimationFrame(function(){ pend = 0; try { if (redrawFn) redrawFn(); } catch(e){} });
  }
  function setTheme(t){ t = t === 'dark' ? 'dark' : 'light'; if (themeNow() !== t || !root.hasAttribute('data-theme')) root.setAttribute('data-theme', t); }
  function toggleTheme(){
    var c = byId('theme-chk'), t = c ? (c.checked ? 'dark' : 'light') : (themeNow() === 'dark' ? 'light' : 'dark');
    setTheme(t); try { localStorage.setItem('hub_theme', t); } catch(e){}
  }
  /* ── the Settings panel ── */
  function toggleOpts(force){
    var p = byId('opts-panel'), b = byId('opts-btn'); if (!p) return;
    var on = typeof force === 'boolean' ? force : !p.classList.contains('open');
    p.classList.toggle('open', on); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  /* ── pop-up menus ── */
  function trigger(m){ var p = m.parentNode; return p ? p.querySelector(':scope > button, :scope > .btn') : null; }
  function open(){ return [].slice.call(document.querySelectorAll('.rs-pop.open')); }
  function closeAll(except){
    var any = false;
    open().forEach(function(m){
      if (m === except) return; any = true; var b = trigger(m), had = m.contains(document.activeElement);
      m.classList.remove('open'); if (b) { b.setAttribute('aria-expanded', 'false'); if (had) b.focus(); }
    });
    return any;
  }
  function toggle(e, id){
    if (e && e.stopPropagation) e.stopPropagation();
    var m = byId(id); if (!m) return; var was = m.classList.contains('open');
    closeAll(m); m.classList.toggle('open', !was);
    var b = trigger(m); if (b) b.setAttribute('aria-expanded', !was ? 'true' : 'false');
    if (was) { if (b && m.contains(document.activeElement)) b.focus(); return; }
    // opened from the keyboard (a click with no pointer is detail 0): the focus goes in, so ↑ ↓ and Esc have something to act on
    if (e && e.detail === 0) setTimeout(function(){ var f = m.querySelector('[role=menuitem]:not([disabled])'); if (f) f.focus(); }, 0);
    // measured, then kept on screen: it opens under a button that can be anywhere on a narrow row
    m.style.right = '0px'; m.style.left = 'auto';
    var r = m.getBoundingClientRect(); if (r.left < 8) { m.style.right = 'auto'; m.style.left = (8 - m.parentNode.getBoundingClientRect().left) + 'px'; }
  }
  function items(id, rows){
    var m = byId(id); if (!m) return;
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    m.innerHTML = rows.map(function(r, i){ return r ? '<button type="button" role="menuitem"' + (r.off ? ' disabled' : '') + ' data-i="' + i + '"><b>' + esc(r.t) + '</b>' + (r.s ? '<span>' + esc(r.s) + '</span>' : '') + '</button>' : '<div class="rs-pop-sep" role="separator"></div>'; }).join('');
    m._rows = rows;
  }
  function tabs(o){
    var bar = typeof o.bar === 'string' ? document.querySelector(o.bar) : o.bar; if (!bar) return;
    var vis = function(t){ return !t.hidden && t.getClientRects().length > 0; };
    function list(){ return [].slice.call(bar.querySelectorAll('[role=tab]')).filter(vis); }
    function sync(){
      [].slice.call(bar.querySelectorAll('[role=tab]')).forEach(function(t){
        var on = t.getAttribute('aria-selected') === 'true' || t.classList.contains('active'); t.tabIndex = on ? 0 : -1;
        var id = o.pane && o.pane(t.dataset.tab), p = id && byId(id);
        if (p) { if (t.getAttribute('aria-controls') !== id) t.setAttribute('aria-controls', id); if (!p.getAttribute('role')) p.setAttribute('role', 'tabpanel'); }
      });
    }
    new MutationObserver(sync).observe(bar, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'hidden'] });
    bar.addEventListener('keydown', function(e){
      var t = e.target && e.target.closest && e.target.closest('[role=tab]'); if (!t || e.metaKey || e.ctrlKey || e.altKey) return;
      var all = list(), i = all.indexOf(t), k = e.key;
      var j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? all.length - 1 : null;
      if (j === null || i < 0) return;
      e.preventDefault(); j = (j + all.length) % all.length;
      if (!all[j].classList.contains('active')) o.select(all[j].dataset.tab);
      all[j].focus();
    });
    sync();
  }
  function init(o){
    redrawFn = o && o.redraw || null;
    var s = stored(); if (s) setTheme(s); syncSwitch();
    var c = byId('theme-chk'); if (c) c.addEventListener('change', toggleTheme);
    new MutationObserver(afterChange).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    // the Hub sets the attribute itself and also posts 'setTheme:dark'; Labbook posts { theme }
    window.addEventListener('message', function(e){
      var d = e.data, t = typeof d === 'string' && d.indexOf('setTheme:') === 0 ? d.slice(9) : d && typeof d === 'object' && typeof d.theme === 'string' ? d.theme : null;
      if (t === 'dark' || t === 'light') setTheme(t);
    });
    var b = byId('opts-btn'); if (b) { b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', 'Settings'); if (!b.title) b.title = 'Settings'; if (!b.getAttribute('onclick')) b.addEventListener('click', function(){ toggleOpts(); }); }
    var p = byId('opts-panel'); if (p && !p.getAttribute('role')) { p.setAttribute('role', 'group'); p.setAttribute('aria-label', 'Settings'); }
  }
  document.addEventListener('click', function(e){
    var p = byId('opts-panel');
    if (p && p.classList.contains('open') && !p.contains(e.target) && !(e.target.closest && e.target.closest('#opts-btn'))) toggleOpts(false);
    if (!e.target.closest || !e.target.closest('.rs-menu')) closeAll();
    // a row made by items(): run what it says, then close
    var it = e.target.closest && e.target.closest('.rs-pop [role=menuitem][data-i]'); if (it) { var m = it.closest('.rs-pop'), r = m._rows && m._rows[+it.dataset.i]; closeAll(); if (r && r.fn) r.fn(); }
  });
  document.addEventListener('keydown', function(e){
    var k = e.key;
    if (k === 'Escape') {
      // one layer per Esc: a menu or the Settings panel, and nothing under it
      var p = byId('opts-panel'), shut = closeAll();
      if (p && p.classList.contains('open')) { var inside = p.contains(document.activeElement); toggleOpts(false); if (inside) { var b = byId('opts-btn'); if (b) b.focus(); } shut = true; }
      if (shut) e.stopPropagation();
      return;
    }
    // on the button of a menu, ↓ opens it and goes in at the first item (↑ at the last)
    var t = e.target, tm = t && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('rs-menu') ? t.parentNode.querySelector(':scope > .rs-pop[role=menu]') : null;
    if (tm && (k === 'ArrowDown' || k === 'ArrowUp')) {
      e.preventDefault(); e.stopPropagation(); if (!tm.classList.contains('open')) toggle(null, tm.id);
      var li = tm.querySelectorAll('[role=menuitem]:not([disabled])'); if (li.length) li[k === 'ArrowUp' ? li.length - 1 : 0].focus(); return;
    }
    var m = e.target && e.target.closest && e.target.closest('.rs-pop[role=menu]'); if (!m) return;
    if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'Home' && k !== 'End') return;
    var list = [].slice.call(m.querySelectorAll('[role=menuitem]:not([disabled])')), i = list.indexOf(document.activeElement);
    var j = k === 'Home' ? 0 : k === 'End' ? list.length - 1 : k === 'ArrowDown' ? (i + 1) % list.length : (i <= 0 ? list.length - 1 : i - 1);
    e.preventDefault(); e.stopPropagation(); if (list[j]) list[j].focus();
  }, true);
  return { init: init, tabs: tabs, items: items, closeAll: closeAll, toggle: toggle, toggleOpts: toggleOpts, toggleTheme: toggleTheme };
})();
function toggleOpts(f){ MenuKit.toggleOpts(f); }
function toggleTheme(){ MenuKit.toggleTheme(); }
function rsTogglePop(e, id){ MenuKit.toggle(e, id); }
function rsCloseExport(){ MenuKit.closeAll(); }
