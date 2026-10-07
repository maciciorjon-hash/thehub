// The guided tour and the Guide tab, the same in every app. One definition per app (tools/tourkit/apps/<folder>.js)
// drives all three things a person asks of "help": a walk through the whole app, a walk through one tab, and
// the written Guide — so they cannot describe different apps.
//
//   tourRegister({
//     id:'echo', name:'Echo Dose Response', blurb:'one sentence',
//     where: function(){ return 'results'; },            // the tab on screen now (the tour puts you back there)
//     data:  { label:'Load the example', has: function(){…}, load: function(){…}, can: function(){…}, wait: 20000 },   // optional (can: false when the person has started filling the app in)
//     intro: [{ t, b, sel? }], outro: [{ t, b, sel? }],  // optional — there are defaults
//     quick: ['First do this', …],                       // "Where do I start" on the Guide
//     order: ['files','results',…],                      // the tour's order (default: tabs in the order given)
//     tabs: [{ id, label, sel:'selector of the tab button', go: function(){…},
//              lead:'what this tab is for', do:['steps'], ref:[['term','meaning']], watch:[{k:'tip'|'warn', t}],
//              skip: function(){ return true if it is not on screen }, head:false (no step for the tab itself),
//              full:false (a minor tab: in the Guide and its own tour, not the whole one),
//              steps:[{ sel:'selector' | ['a','b'] | fn, t:'title', b:'body', needs:'data', miss:'say why it is not there',
//                       deep:true (only in this tab's own tour, not the whole one),
//                       nodata:'added to the body while the app is empty', go: fn, after: fn, place:'right|left|top|bottom' }] }],
//     words: [['DC50','what it is']], faq: [['question','answer']], keys: [['⌘Z','what it does']]
//   })
//   appTour()            the whole tour          appTour('plots')   one tab's
//   tourGuideRefresh()   redraw the Guide        tourEnd()
// Text takes **bold**, `keys` and [[tab:id|label]] links. Nothing here loads data unasked: an example is
// offered, and only when the app is empty.
var tourRegister, appTour, tourEnd, tourGuideRefresh, tourOffer;
(function(){
  var DEF = null, T = null, D = document;
  var KEY = function(k){ return 'tk_' + k + '_' + (DEF ? DEF.id : ''); };
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(s){
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<kbd>$1</kbd>')
      .replace(/\[\[tab:([\w-]+)\|(.+?)\]\]/g, function(_m, id, lbl){ return '<a href="#" class="tk-lnk" data-tk="tab" data-t="' + id + '">' + lbl + '</a>'; });
  }
  function safe(fn, dflt){ try { return fn(); } catch (e) { return dflt; } }
  function tabById(id){ for (var i = 0; i < DEF.tabs.length; i++) if (DEF.tabs[i].id === id) return DEF.tabs[i]; return null; }
  function hasData(){ return !DEF.data || !!safe(function(){ return DEF.data.has(); }, false); }
  // an example is only ever offered to an app with nothing in it — and not to one whose person has started to fill it in
  function canLoad(){ return !!(DEF.data && DEF.data.load && !hasData() && (!DEF.data.can || safe(DEF.data.can, true))); }
  function reduced(){ return !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }

  tourRegister = function(def){
    DEF = def;
    if (def.tabs) def.tabs.forEach(function(t){ t.steps = t.steps || []; });
    function ready(){ guideDraw(); setTimeout(function(){ maybeOffer(); }, 1400); }
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', ready); else setTimeout(ready, 0);
  };

  // ── finding the thing a step points at ────────────────────────────────────
  function vis(el){
    if (!el) return false;
    var r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false;
    var cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.02;
  }
  function find(sel){
    if (!sel) return null;
    var list = [].concat(sel);
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (typeof s === 'function') { var n = safe(s, null); if (vis(n)) return n; continue; }
      var els; try { els = D.querySelectorAll(s); } catch (e) { continue; }
      for (var j = 0; j < els.length; j++) if (vis(els[j]) && !els[j].closest('#tk-root,#tk-offer')) return els[j];
    }
    return null;
  }
  function scrollParent(el){
    for (var p = el.parentElement; p && p !== D.body; p = p.parentElement) {
      var cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 4) return p;
    }
    return D.scrollingElement || D.documentElement;
  }

  // ── the steps ─────────────────────────────────────────────────────────────
  function buildSteps(only){
    var S = [], tabs = DEF.tabs || [];
    var order = only ? [only] : (DEF.order || tabs.map(function(t){ return t.id; }));
    if (!only) {
      (DEF.intro || [{ t: 'Welcome to ' + DEF.name, b: DEF.blurb + ' This takes about a minute — **Esc** leaves it at any point, and it is always on the **Guide** tab.' }])
        .forEach(function(s){ S.push(Object.assign({ kind: 'intro' }, s)); });
    }
    order.forEach(function(id){
      var tab = tabById(id); if (!tab) return;
      if (tab.skip && safe(tab.skip, false)) {                          // not on screen now: say what it is and when it appears, instead of nothing
        if (only) S.push({ kind: 'note', t: tab.label, b: tab.lead + ' **It is not on screen at the moment**' + (tab.tag ? ' — ' + tab.tag + '.' : '.') });
        return;
      }
      if (!only && tab.full === false) return;                          // a minor tab: in the Guide and in its own tour, not in the whole one
      if (tab.head !== false) {
        var head = { tab: id, first: true, t: tab.label, b: tab.lead, sel: tab.sel, kind: 'tab', place: tab.place || 'bottom' };
        if (tab.needs) { head.needs = tab.needs; head.nodata = tab.nodata || 'It fills in once there is data.'; }
        S.push(head);
      }
      tab.steps.forEach(function(s){ if (s.deep && !only) return; S.push(Object.assign({ tab: id }, s)); });
    });
    if (!only) {
      (DEF.outro || [{ t: 'That is the tour', b: 'The **Guide** tab keeps all of it in writing, with a tour for each tab — and anything you meant to look at is still where you left it.' }])
        .forEach(function(s){ S.push(Object.assign({ kind: 'outro' }, s)); });
    }
    return S;
  }

  // ── the tour ──────────────────────────────────────────────────────────────
  var ICON_X = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  appTour = function(only){
    if (!DEF) return;
    if (T) tourEnd(true);
    dropOffer();
    var steps = buildSteps(only && typeof only === 'string' ? only : null);
    if (!steps.length) return;
    var root = D.createElement('div'); root.id = 'tk-root'; root.className = 'tk-root';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Tour of ' + DEF.name);
    root.innerHTML = '<div class="tk-hole"></div><div class="tk-card fade" aria-live="polite"></div>';
    D.body.appendChild(root);
    T = { steps: steps, i: 0, root: root, only: typeof only === 'string' ? only : null, lastTab: null, placed: false, tok: 0,
          back: safe(function(){ return DEF.where ? DEF.where() : null; }, null), focus: D.activeElement };
    T.onKey = function(e){
      if (!T) return;
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); tourEnd(); }
      else if (k === 'ArrowRight' || k === 'Enter' && !(e.target && e.target.closest && e.target.closest('#tk-root button'))) { e.preventDefault(); e.stopImmediatePropagation(); go(1); }
      else if (k === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); go(-1); }
      else if (k === 'Tab') {                              // the tour holds the focus: an app's own dialog would otherwise take it back
        var b = [].slice.call(root.querySelectorAll('button:not([disabled])')); if (!b.length) return;
        var i = b.indexOf(D.activeElement); e.preventDefault(); e.stopImmediatePropagation();
        b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
      }
    };
    T.onResize = function(){ place(); };
    D.addEventListener('keydown', T.onKey, true);
    window.addEventListener('resize', T.onResize);
    root.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('[data-tk]') : null; if (!b) return;
      var a = b.getAttribute('data-tk');
      if (a === 'next') go(1); else if (a === 'back') go(-1); else if (a === 'end') tourEnd();
      else if (a === 'demo') loadDemo(function(){ show(); }); else if (a === 'skip') go(1);
    });
    T.iv = setInterval(function(){ if (T && T.target && !T.busy) place(); }, 420);
    show();
  };
  function go(dir){
    if (!T) return;
    var n = T.i + dir, cur = T.steps[T.i];
    if (n >= T.steps.length) { tourEnd(); return; }
    if (n < 0) return;
    if (cur && cur.after) safe(function(){ cur.after(); });
    T.i = n; show();
  }
  tourEnd = function(silent){
    var t = T; if (!t) return; T = null; clearInterval(t.iv); clearTimeout(t.t);
    lsSet(KEY('done'), '1');
    D.removeEventListener('keydown', t.onKey, true); window.removeEventListener('resize', t.onResize);
    if (t.root.parentNode) t.root.parentNode.removeChild(t.root);
    var cur = t.steps[t.i]; if (cur && cur.after) safe(function(){ cur.after(); });
    if (silent) return;
    if (DEF.leave) safe(function(){ DEF.leave(); });
    if (t.back) { var tab = tabById(t.back); if (tab && tab.go && t.lastTab && t.lastTab !== t.back) safe(function(){ tab.go(); }); }
    try { if (t.focus && t.focus.focus && t.focus !== D.body) t.focus.focus({ preventScroll: true }); } catch (e) {}
  };

  function loadDemo(then){
    if (!DEF.data || !DEF.data.load) return then && then();
    var card = T && T.root.querySelector('.tk-card');
    if (card) card.innerHTML = '<div class="tk-t">Loading the example…</div><div class="tk-b">This takes a moment.</div><div class="tk-f"><button class="tk-btn" data-tk="end">Cancel</button></div>';
    T && (T.busy = true);
    safe(function(){ DEF.data.load(); });
    var t0 = Date.now(), cap = DEF.data.wait || 20000;
    (function poll(){
      if (T === null && card) return;
      if (hasData()) { if (T) T.busy = false; setTimeout(function(){ then && then(); }, 350); return; }
      if (Date.now() - t0 > cap) { if (T) T.busy = false; then && then(); return; }
      setTimeout(poll, 250);
    })();
  }

  function show(){
    var Tn = T; if (!Tn) return;
    var st = Tn.steps[Tn.i], card = Tn.root.querySelector('.tk-card'), tok = ++Tn.tok;
    card.classList.add('fade'); Tn.target = null; Tn.busy = true;
    safe(function(){ if (window.closeCtx) closeCtx(); });
    if (st.tab && Tn.lastTab !== st.tab) { var tb = tabById(st.tab); if (tb && tb.go) safe(function(){ tb.go(); }); Tn.lastTab = st.tab; }
    if (st.go) safe(function(){ st.go(); });
    var t0 = Date.now(), wantSel = st.sel;
    (function wait(){
      if (!T || Tn !== T || tok !== Tn.tok) return;
      var el = wantSel ? find(wantSel) : null;
      if (!wantSel || el || Date.now() - t0 > 1500) {
        if (el) { aim(el); stable(el, tok, function(){ paint(st, el, tok); }); } else paint(st, null, tok);
        return;
      }
      setTimeout(wait, 70);
    })();
  }
  // Bring the target into view, then wait until it stops moving: a drawer that slides in, a smooth scroll and a tab that
  // fades in all change where the thing is, and a spotlight placed before they finish points at where it was.
  function aim(el){
    var big = el.getBoundingClientRect().height > innerHeight * 0.8;
    try { el.scrollIntoView({ block: big ? 'start' : 'center', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) {}
  }
  function stable(el, tok, cb){
    var last = '', n = 0, t0 = Date.now();
    (function poll(){
      if (!T || T.tok !== tok) return;
      var r = el.getBoundingClientRect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join();
      if (k === last) n++; else { n = 0; last = k; }
      if (n >= 2 || Date.now() - t0 > 1400) return cb();
      setTimeout(poll, 70);
    })();
  }
  function paint(st, el, tok){
    var Tn = T; if (!Tn) return;
    var card = Tn.root.querySelector('.tk-card'), n = Tn.steps.length, last = Tn.i === n - 1;
    var needsData = st.needs === 'data' && !hasData() && st.kind !== 'tab';
    var firstOfAll = Tn.i === 0 && !Tn.only;
    var body = needsData ? (st.miss || 'This fills in once there is data.') : (el || !st.sel ? st.b : (st.miss || st.b));
    if (!needsData && !hasData() && st.nodata) body += ' ' + st.nodata;
    var acts = '';
    if (canLoad() && (needsData || st.needs === 'data' || firstOfAll))
      acts += '<button class="tk-btn' + (needsData ? ' go' : '') + '" data-tk="demo">' + esc(DEF.data.label || 'Load the example') + '</button>';
    var where = st.tab ? (tabById(st.tab) ? tabById(st.tab).label : '') : '';
    card.innerHTML =
      '<div class="tk-k"><span class="tk-prog"><i style="width:' + Math.round((Tn.i + 1) / n * 100) + '%"></i></span><span>' + (where ? esc(where) + ' · ' : '') + (Tn.i + 1) + ' of ' + n + '</span>'
        + '<button class="tk-x" data-tk="end" aria-label="Leave the tour" title="Leave the tour (Esc)">' + ICON_X + '</button></div>'
      + '<div class="tk-t" id="tk-t">' + fmt(st.t) + '</div>'
      + '<div class="tk-b">' + fmt(body) + '</div>'
      + '<div class="tk-f">' + acts
      + '<span class="tk-sp"></span>'
      + (Tn.i ? '<button class="tk-btn" data-tk="back">Back</button>' : '')
      + (needsData ? '<button class="tk-btn" data-tk="skip">Skip this</button>' : '')
      + '<button class="tk-btn go" data-tk="next">' + (last ? 'Done' : (Tn.i ? 'Next' : 'Start')) + '</button></div>';
    Tn.root.setAttribute('aria-labelledby', 'tk-t');
    var tgt = needsData ? null : el;
    Tn.target = tgt;
    function finish(){
      if (!T || T.tok !== tok) return;
      Tn.busy = false; place(); card.classList.remove('fade');
      var b = card.querySelector('.go'); if (b) safe(function(){ b.focus({ preventScroll: true }); });
    }
    if (tgt && innerWidth <= 640) { reserve(tgt); stable(tgt, tok, finish); } else finish();
  }
  // On a phone the card sits along the bottom edge: keep what it points at above it.
  function reserve(el){
    if (!el || !T) return;
    var card = T.root.querySelector('.tk-card'), vh = innerHeight;
    if (innerWidth > 640) return;
    var r = el.getBoundingClientRect(), room = vh - card.offsetHeight - 24;
    if (r.height < room && r.bottom > room) { var sp = scrollParent(el); sp.scrollTop += r.bottom - room + 12; }
    else if (r.top < 8) { var sp2 = scrollParent(el); sp2.scrollTop += r.top - 12; }
  }
  function place(){
    var Tn = T; if (!Tn) return;
    var hole = Tn.root.querySelector('.tk-hole'), card = Tn.root.querySelector('.tk-card'), el = Tn.target;
    var vw = innerWidth, vh = innerHeight, pad = 6, r = null;
    if (el && vis(el)) {
      var b = el.getBoundingClientRect();
      var l = Math.max(6, b.left), t = Math.max(6, b.top), R = Math.min(vw - 6, b.right), B = Math.min(vh - 6, b.bottom);
      if (R - l >= 4 && B - t >= 4) r = { l: l, t: t, w: R - l, h: B - t };
    }
    if (r) { hole.classList.add('on'); hole.style.left = (r.l - pad) + 'px'; hole.style.top = (r.t - pad) + 'px'; hole.style.width = (r.w + pad * 2) + 'px'; hole.style.height = (r.h + pad * 2) + 'px'; }
    else { hole.classList.remove('on'); hole.style.left = (vw / 2 - 1) + 'px'; hole.style.top = (vh / 2 - 1) + 'px'; hole.style.width = '2px'; hole.style.height = '2px'; }
    var cw = card.offsetWidth || 360, ch = card.offsetHeight || 200, g = 14, x, y;
    var st = Tn.steps[Tn.i], want = st && st.place;
    if (vw <= 640) { x = 12; y = vh - ch - 12 - 0; card.classList.add('sheet'); }
    else {
      card.classList.remove('sheet');
      if (!r) { x = (vw - cw) / 2; y = (vh - ch) / 2; }
      else {
        var fit = {
          right: vw - (r.l + r.w) - pad >= cw + g * 2, left: r.l - pad >= cw + g * 2,
          bottom: vh - (r.t + r.h) - pad >= ch + g * 2, top: r.t - pad >= ch + g * 2 };
        var pos = { right: [r.l + r.w + pad + g, r.t], left: [r.l - pad - g - cw, r.t], bottom: [r.l, r.t + r.h + pad + g], top: [r.l, r.t - pad - g - ch] };
        var order = want ? [want, 'bottom', 'right', 'top', 'left'] : ['right', 'bottom', 'left', 'top'];
        var pick = null; for (var i = 0; i < order.length; i++) if (fit[order[i]]) { pick = order[i]; break; }
        if (pick) { x = pos[pick][0]; y = pos[pick][1]; }
        else { x = r.l + r.w - cw - g; y = r.t + r.h - ch - g; }       // a target the size of the window: the card sits inside it
      }
      x = Math.max(12, Math.min(vw - cw - 12, x)); y = Math.max(12, Math.min(vh - ch - 12, y));
    }
    if (!Tn.placed) { card.style.transition = 'none'; hole.style.transition = 'none'; }
    card.style.left = x + 'px'; card.style.top = y + 'px';
    if (!Tn.placed) { void card.offsetWidth; card.style.transition = ''; hole.style.transition = ''; Tn.placed = true; }
  }

  // ── the first-time offer: a card in the corner, never a modal, once per device ──────────────
  function dropOffer(){ var o = D.getElementById('tk-offer'); if (o && o.parentNode) o.parentNode.removeChild(o); }
  function maybeOffer(){
    if (!DEF || T) return;
    try { if (navigator.webdriver) return; } catch (e) {}
    if (lsGet(KEY('done')) || lsGet(KEY('seen'))) return;
    if (/[?&]notour\b/.test(location.search)) return;
    if (DEF.fresh ? !safe(DEF.fresh, false) : hasData()) return;      // somebody who already has work here has used it
    var tries = 0;
    (function when(){
      tries++;
      var shown = true;
      try { if (window.frameElement) { var r = window.frameElement.getBoundingClientRect(); shown = r.width > 0 && r.height > 0 && window.frameElement.ownerDocument.visibilityState !== 'hidden'; } } catch (e) {}
      if (D.visibilityState === 'hidden') shown = false;
      if (shown && !T) { drawOffer(); return; }
      if (tries < 30) setTimeout(when, 1500);
    })();
  }
  function drawOffer(){
    if (D.getElementById('tk-offer')) return;
    lsSet(KEY('seen'), '1');
    var o = D.createElement('div'); o.id = 'tk-offer'; o.className = 'tk-offer'; o.setAttribute('role', 'region'); o.setAttribute('aria-label', 'Tour of ' + DEF.name);
    o.innerHTML = '<div class="tk-o-t">New to ' + esc(DEF.name) + '?</div><div class="tk-o-b">A one-minute tour moves through each tab and points at what it is for. It is always on the <b>Guide</b> tab.</div>'
      + '<div class="tk-f"><button class="tk-btn" data-tk="no">Not now</button><span class="tk-sp"></span><button class="tk-btn go" data-tk="yes">Take the tour</button></div>';
    o.addEventListener('click', function(e){ var b = e.target.closest ? e.target.closest('[data-tk]') : null; if (!b) return; dropOffer(); if (b.getAttribute('data-tk') === 'yes') appTour(); });
    D.body.appendChild(o);
  }
  tourOffer = drawOffer;

  // ── the Guide ─────────────────────────────────────────────────────────────
  function guideHtml(){
    var d = DEF, h = '', tabs = (d.tabs || []).filter(function(t){ return t.guide !== false; });
    var navItems = [['tkg-start', 'Start here']];
    tabs.forEach(function(t){ navItems.push(['tkg-' + t.id, t.label]); });
    if (d.words && d.words.length) navItems.push(['tkg-words', 'Words']);
    if (d.faq && d.faq.length) navItems.push(['tkg-faq', 'Questions']);
    if (d.keys && d.keys.length) navItems.push(['tkg-keys', 'Keys']);
    h += '<div class="tkg"><div class="tkg-nav" role="navigation" aria-label="Sections of this guide">' + navItems.map(function(n){ return '<a href="#" data-tk="jump" data-id="' + n[0] + '">' + esc(n[1]) + '</a>'; }).join('') + '</div><div class="tkg-body">';
    h += '<div class="tkg-hd" id="tkg-start"><h2>' + esc(d.name) + ' — Guide</h2><p class="tkg-blurb">' + fmt(d.blurb) + '</p>'
      + '<div class="tkg-tour"><div><b>A tour of ' + esc(d.name) + '</b><span>About a minute. It moves through each tab and points at the real controls; <kbd>Esc</kbd> leaves it. Every tab below has its own.</span></div>'
      + '<div class="tkg-acts"><button class="tk-btn go" data-tk="tour">Take the tour</button>' + (canLoad() ? '<button class="tk-btn" data-tk="load">' + esc(d.data.label || 'Load the example') + '</button>' : '') + '</div></div></div>';
    if (d.quick && d.quick.length) h += '<div class="tkg-sec"><h3>Where to start</h3><ol class="tkg-do tkg-quick">' + d.quick.map(function(q){ return '<li>' + fmt(q) + '</li>'; }).join('') + '</ol></div>';
    tabs.forEach(function(t){
      h += '<div class="tkg-sec" id="tkg-' + t.id + '"><div class="tkg-sh"><h3>' + esc(t.label) + (t.tag ? ' <span class="tkg-tag">' + esc(t.tag) + '</span>' : '') + '</h3>'
        + (t.steps && t.steps.length || t.sel ? '<button class="tk-btn" data-tk="tab-tour" data-t="' + t.id + '">Tour this tab</button>' : '') + '</div>';
      if (t.lead) h += '<p class="tkg-lead">' + fmt(t.lead) + '</p>';
      if (t.do && t.do.length) h += '<div class="tkg-k">How to use it</div><ol class="tkg-do">' + t.do.map(function(x){ return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol>';
      if (t.ref && t.ref.length) h += '<div class="tkg-k">What is on it</div><dl class="tkg-ref">' + t.ref.map(function(r){ return '<dt>' + fmt(r[0]) + '</dt><dd>' + fmt(r[1]) + '</dd>'; }).join('') + '</dl>';
      (t.watch || []).forEach(function(w){ h += '<p class="tkg-note ' + (w.k === 'warn' ? 'warn' : 'tip') + '">' + fmt(w.t) + '</p>'; });
      h += '</div>';
    });
    if (d.words && d.words.length) h += '<div class="tkg-sec" id="tkg-words"><h3>Words used in this app</h3><dl class="tkg-ref">' + d.words.map(function(r){ return '<dt>' + fmt(r[0]) + '</dt><dd>' + fmt(r[1]) + '</dd>'; }).join('') + '</dl></div>';
    if (d.faq && d.faq.length) h += '<div class="tkg-sec" id="tkg-faq"><h3>When something looks wrong</h3>' + d.faq.map(function(q){ return '<details class="tkg-q"><summary>' + fmt(q[0]) + '</summary><p>' + fmt(q[1]) + '</p></details>'; }).join('') + '</div>';
    if (d.keys && d.keys.length) h += '<div class="tkg-sec" id="tkg-keys"><h3>Keyboard</h3><table class="tkg-keys">' + d.keys.map(function(k){ return '<tr><td><kbd>' + esc(k[0]) + '</kbd></td><td>' + fmt(k[1]) + '</td></tr>'; }).join('') + '</table></div>';
    return h + '</div></div>';
  }
  function guideDraw(){
    var host = D.querySelector('[data-tk-guide]'); if (!host || !DEF) return;
    host.innerHTML = guideHtml();
    if (!host._tkBound) {
      host._tkBound = true;
      host.addEventListener('click', function(e){
        var b = e.target.closest ? e.target.closest('[data-tk]') : null; if (!b) return;
        var a = b.getAttribute('data-tk'); e.preventDefault();
        if (a === 'tour') appTour();
        else if (a === 'tab-tour') appTour(b.getAttribute('data-t'));
        else if (a === 'load') { if (DEF.data && DEF.data.load) { safe(function(){ DEF.data.load(); }); b.disabled = true; b.textContent = 'Loading…'; setTimeout(guideDraw, 1800); } }
        else if (a === 'tab') { var tb = tabById(b.getAttribute('data-t')); if (tb && tb.go) safe(function(){ tb.go(); }); }
        else if (a === 'jump') { var t = D.getElementById(b.getAttribute('data-id')); if (t) t.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }
      });
      if ('IntersectionObserver' in window) {                 // when the Guide is shown, whether there is data yet may have changed
        new IntersectionObserver(function(es){ if (es[0].isIntersecting && DEF && !host._tkBusy) { var s = host.querySelector('.tkg-acts'); if (s) { var now = !canLoad(); var has = !!s.querySelector('[data-tk=load]'); if (now === has) guideDraw(); } } }).observe(host);
      }
    }
  }
  tourGuideRefresh = guideDraw;
})();
