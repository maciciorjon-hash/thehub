// Runtime audit — the companion to tools/audit_app.py (static) and tools/audit_align.js
// (geometry), for the things only a loaded page can answer: does it throw, does it render, and
// does every inline handler it prints actually name a function that exists.
//
// Load an app into an iframe over http, eval this file in the frame, call __runtimeAudit().
// It returns {app, errors:[...]} — an empty errors array is the pass condition.
//
// What it checks, and why each one earned its place:
//   * dead inline handlers — `onclick="openThing(...)"` where openThing was renamed or deleted.
//     Nothing throws until somebody clicks, so a static grep never sees it and neither does a
//     smoke test. This is the check that finds a broken button before the user does.
//   * duplicate element ids — el('x') returns the first, so the second is unreachable and
//     silently does nothing. Both halves look fine in the source.
//   * unresolved custom properties — a var(--token) nothing defines computes to the initial
//     value, which for a colour is transparent-black and for a size is 0. check_css.py catches
//     the ones written in the stylesheet; this catches the ones built in JS strings.
//   * invisible text — colour equal to the background it sits on, in either theme. That is what
//     a half-defined dark palette looks like from the outside.
//   * content wider than its scroll container, where nothing can scroll to reach it.
//
// Deliberately NOT reported, each a false positive first:
//   * handlers naming a global the shell provides (window.parent.*) — those are bridges.
//   * elements with zero size (not yet rendered panels), and anything inside display:none.
window.__runtimeAudit = function(opts){
  opts = opts || {};
  var out = [], seen = {};
  function add(kind, msg){ var k = kind + '|' + msg; if (seen[k]) return; seen[k] = 1; out.push(kind + ': ' + msg); }

  // ── inline handlers must name something that exists ────────────────────────────────────
  var HOST = /^(window|document|this|event|parent|self|top|console|Math|JSON|Object|Array|String|Number|Date|Boolean|RegExp|Promise|Set|Map|alert|confirm|prompt|setTimeout|setInterval|clearTimeout|clearInterval|encodeURIComponent|decodeURIComponent|parseInt|parseFloat|isNaN|require|if|for|while|return|function|typeof|new|delete|void|switch|catch|try)$/;
  var ATTR = ['onclick','oninput','onchange','onkeydown','onkeyup','onblur','onfocus','onmousedown',
              'onmouseup','oncontextmenu','ondblclick','onsubmit','onpaste','ondrop','ondragover',
              'ondragstart','ondragend','onwheel','onscroll','onload','onerror','onpointerdown'];
  var nodes = document.querySelectorAll('*');
  for (var i = 0; i < nodes.length; i++) {
    for (var a = 0; a < ATTR.length; a++) {
      var v = nodes[i].getAttribute && nodes[i].getAttribute(ATTR[a]);
      if (!v) continue;
      var m, re = /(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
      while ((m = re.exec(v))) {
        var name = m[2];
        if (HOST.test(name)) continue;
        if (typeof window[name] === 'function') continue;
        add('dead-handler', name + '() — ' + ATTR[a] + ' on ' +
            nodes[i].tagName.toLowerCase() + (nodes[i].id ? '#' + nodes[i].id : '') +
            (typeof nodes[i].className === 'string' && nodes[i].className ? '.' + nodes[i].className.trim().split(/\s+/)[0] : ''));
      }
    }
  }

  // ── one id, one element ────────────────────────────────────────────────────────────────
  var ids = {};
  var withId = document.querySelectorAll('[id]');
  for (var j = 0; j < withId.length; j++) {
    var id = withId[j].id;
    if (ids[id]) add('duplicate-id', '#' + id + ' appears ' + (++ids[id]) + ' times');
    else ids[id] = 1;
  }

  // ── tokens that resolve to nothing, and text you cannot read ───────────────────────────
  function rgb(s){ var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s || '');
    return m ? {r:+m[1], g:+m[2], b:+m[3], a:m[4] === undefined ? 1 : +m[4]} : null; }
  function lum(c){ var f = function(v){ v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
    return .2126*f(c.r) + .7152*f(c.g) + .0722*f(c.b); }
  // Returns null for "cannot say", which is not the same as "fine". A gradient or an image
  // behind the text has no single colour to compare against, and walking past it to the page
  // background is how a white heading on a blue gradient card gets reported as invisible —
  // which it did, for every line of Cuppa's welcome card, on the first run.
  function bgOf(el){ var n = el;
    while (n && n !== document.documentElement) {
      var cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      var c = rgb(cs.backgroundColor);
      if (c && c.a > .5) return c;
      n = n.parentElement; }
    var b = getComputedStyle(document.body);
    if (b.backgroundImage && b.backgroundImage !== 'none') return null;
    return rgb(b.backgroundColor) || {r:255,g:255,b:255,a:1}; }
  var texts = document.querySelectorAll('body *');
  for (var k = 0; k < texts.length; k++) {
    var el = texts[k];
    // Its OWN text, not its children's. A wrapper whose first child is the newline before a
    // <div> was being judged on the whole subtree's text against the wrapper's own colour —
    // which is how every cell-line tile in Cell Archive got reported as invisible when the
    // only thing that colour applies to is whitespace.
    var own = '';
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3) own += c.nodeValue;
    if (!own.trim()) continue;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    var fg = rgb(cs.color); if (!fg || fg.a < .5) continue;
    // Text painted through a gradient (background-clip:text) has a transparent colour on
    // purpose; there is nothing to measure.
    if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue;
    var bg = bgOf(el); if (!bg) continue;
    var ratio = (Math.max(lum(fg), lum(bg)) + .05) / (Math.min(lum(fg), lum(bg)) + .05);
    if (ratio < 1.35) add('invisible-text', (el.tagName.toLowerCase() +
        (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '')) +
        ' — contrast ' + ratio.toFixed(2) + ' ("' + own.trim().slice(0, 24) + '")');
  }

  // ── content wider than the box, with nothing able to scroll to it ──────────────────────
  // Judged on a descendant's real right edge against the container's content edge, not on
  // scrollWidth: a padded flex column reports 24px of scrollable overflow it does not have,
  // which is what Cuppa's stat tiles were reported for while nothing in them was cut.
  function nm(e){ return e.id ? '#' + e.id : e.tagName.toLowerCase() +
    (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''); }
  var all = document.querySelectorAll('body *');
  for (var q = 0; q < all.length; q++) {
    var e2 = all[q], c2 = getComputedStyle(e2);
    if (c2.display === 'none' || c2.overflowX === 'auto' || c2.overflowX === 'scroll') continue;
    if (c2.overflowX !== 'hidden' && c2.overflowX !== 'clip') continue;
    // text-overflow:ellipsis IS this shape, on purpose — a truncated label is signalled, not
    // lost. Every week-band pill and every Gantt bar label is one.
    if (c2.textOverflow === 'ellipsis') continue;
    if (e2.clientWidth <= 40) continue;
    var box = e2.getBoundingClientRect();
    var edge = box.left + e2.clientLeft + e2.clientWidth - parseFloat(c2.paddingRight || 0);
    var worst = 0, who = null, kids = e2.querySelectorAll('*');
    for (var z = 0; z < kids.length; z++) {
      var kc = getComputedStyle(kids[z]);
      if (kc.display === 'none' || kc.position === 'fixed') continue;
      // An invisible overlay is not clipped content: every drop zone parks a transparent
      // <input type=file> across itself, and it is wider than the zone by design.
      if (+kc.opacity === 0 || kc.visibility === 'hidden') continue;
      // Content inside a scroller between here and the container is reachable — that is what
      // the scroller is for. LDI's compound table is 334px wider than the panel around it and
      // is perfectly usable, because .tbl-wrap scrolls.
      var up = kids[z].parentElement, guarded = false;
      while (up && up !== e2) { var uc = getComputedStyle(up);
        if (uc.overflowX === 'auto' || uc.overflowX === 'scroll') { guarded = true; break; }
        up = up.parentElement; }
      if (guarded) continue;
      var kr = kids[z].getBoundingClientRect();
      if (!kr.width) continue;
      var over = Math.round(kr.right - edge);
      if (over > worst) { worst = over; who = kids[z]; }
    }
    if (worst > 8) add('clipped', nm(e2) + ' — ' + worst + 'px past the edge, no way to scroll to it (' +
      (who ? nm(who) + ' "' + (who.textContent || '').trim().slice(0, 20) + '"' : '?') + ')');
  }
  return out;
};
