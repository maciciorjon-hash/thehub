// Everything stays in its box — the check the other audits could not make.
//
//   audit_runtime.js  asks what only a loaded page knows (dead handlers, duplicate ids, unreadable text)
//   audit_align.js    asks whether the controls on a row line up
//   this              asks whether anything LEAVES the thing drawn around it, or lands on top of its neighbour
//
// Findings (one string each; an empty array is a clean screen):
//   · an icon, image or run of text that sticks out of the nearest box that draws something around it (a button, pill, card, cell, field…)
//     — the empty-state icons that were 44px inside 32px buttons, a glyph taller than the button that held it
//   · two runs of text, not nested in one another, whose painted boxes intersect — "4.29 nM ×/÷1.2" over "98%" in a grid whose tracks had shrunk
//     below their content, which no clipping rule noticed because the text was neither clipped nor outside its row
//   · two <text> labels of one chart that touch, or a label outside its own svg
//   · a scroller that hides part of its content behind a sideways scroll (a data table inside its own box is fine: pass `allowScroll`
//     as a selector; everything a person must read whole is a finding)
//   · the page itself scrolling sideways
//
// What it deliberately does NOT count (each one was a false positive first):
//   · text cut by its own box with text-overflow:ellipsis (the ellipsis is the message)
//   · content inside an overflow:auto|scroll box on the scrolled axis — that is what the scrollbar is for
//   · text under a layer drawn over the page (#hf-drawer, [role=dialog], .modal, .dlg) — a layer covers the page by design; a pair is only
//     compared when both are in the same layer
//   · a run that is not painted at its own centre (scrolled out of a box, covered): elementFromPoint must land in it or around it
//
// Use:  page.evaluate(fs.readFileSync('tools/audit_escape.js','utf8'))  →  string[]        (window.__escapeAudit(opts) after the first call)
//       opts.allowScroll  CSS selector of scrollers that may hide content sideways (default: textarea, select, input, pre)
window.__escapeAudit = (opts = {}) => {
  const allow = (opts.allowScroll ? opts.allowScroll + ',' : '') + 'textarea,select,input,pre';
  // Every visible text run, icon and image must sit inside the nearest box that draws something around it
  // (a button, pill, chip, card, cell, field…). Clipped boxes are skipped: what they cut is the overflow detector's job.
  const out = [];
  const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const drawn = el => {
    const cs = getComputedStyle(el);
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA|TD|TH)$/.test(el.tagName)) return true;
    const bg = cs.backgroundColor, hasBg = bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg);
    const hasBd = ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(cs['border' + s + 'Color']));
    return hasBg || hasBd || cs.overflow !== 'visible' || cs.overflowX !== 'visible';
  };
  const desc = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
  const txt = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
  const seen = new Set();
  const items = [];
  // icons and images
  document.querySelectorAll('svg, img, canvas').forEach(el => { if (el.closest('svg') !== el && el.tagName !== 'svg') return; if (vis(el)) items.push(el); });
  // text nodes → their parent element, measured by a Range so the text's own box is used, not the element's
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const p = n.parentElement; if (!p || /^(SCRIPT|STYLE|OPTION|NOSCRIPT)$/.test(p.tagName) || p.closest('svg') || !vis(p)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rs = [...rg.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5);
    if (!rs.length) continue;
    items.push({ _text: true, el: p, rects: rs });
  }
  for (const it of items) {
    const el = it._text ? it.el : it;
    const rects = it._text ? it.rects : [el.getBoundingClientRect()];
    // nearest drawn ancestor (not the element itself for an svg/img inside a button — the button is the box)
    let a = it._text ? el : el.parentElement;
    while (a && a !== document.body && a !== document.documentElement && !drawn(a)) a = a.parentElement;
    if (!a || a === document.body || a === document.documentElement) continue;
    const ar = a.getBoundingClientRect();
    if (ar.width === 0 || ar.height === 0) continue;
    const acs = getComputedStyle(a);
    const bw = s => parseFloat(acs['border' + s + 'Width']) || 0;
    for (const r of rects) {
      const dl = ar.left + bw('Left') - r.left, dr = r.right - (ar.right - bw('Right')), dt = ar.top + bw('Top') - r.top, db = r.bottom - (ar.bottom - bw('Bottom'));
      const sy = /(auto|scroll)/.test(acs.overflowY), sx = /(auto|scroll)/.test(acs.overflowX);
      const ell = acs.textOverflow === 'ellipsis' && it._text;   // a name cut with an ellipsis says it is cut: that is the design for a name in a list
      const m = Math.max(sx || ell ? 0 : dl, sx || ell ? 0 : dr, sy ? 0 : dt, sy ? 0 : db);
      if (m > 1.5) {
        const side = m === dl ? 'left' : m === dr ? 'right' : m === dt ? 'top' : 'bottom';
        const k = desc(el) + '>' + desc(a) + side;
        if (seen.has(k)) break; seen.add(k);
        out.push(`${it._text ? 'text' : el.tagName.toLowerCase()} "${it._text ? txt(el) : (el.getAttribute('class') || '')}" in ${desc(a)} sticks out ${side} by ${Math.round(m)}px (${Math.round(r.width)}×${Math.round(r.height)} in ${Math.round(ar.width)}×${Math.round(ar.height)})`);
        break;
      }
    }
  }

  // text over text: two runs that are not nested in one another and whose boxes intersect
  const T = items.filter(i => i._text && i.rects.length === 1).map(i => ({ el: i.el, r: i.rects[0] })).filter(t => t.r.bottom > 0 && t.r.top < innerHeight * 3);
  if (T.length < 2500) {
    T.sort((a, b) => a.r.left - b.r.left);
    const seenP = new Set();
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const A = T[i], B = T[j]; if (B.r.left >= A.r.right - 1) break;
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const LA = A.el.closest('#hf-drawer,[role=dialog],.modal,.dlg'), LB = B.el.closest('#hf-drawer,[role=dialog],.modal,.dlg'); if (LA !== LB) continue;   // a layer over the page covers it by design
      const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ox > 2 && oy > 3) { const cx = Math.max(A.r.left, B.r.left) + ox / 2, cy = Math.max(A.r.top, B.r.top) + oy / 2; if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue; const tp = document.elementFromPoint(cx, cy); if (!tp || !(A.el.contains(tp) || B.el.contains(tp))) continue; const own = t => { const x = t.r.left + t.r.width / 2, y = t.r.top + t.r.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false; const e = document.elementFromPoint(x, y); return !!e && (t.el.contains(e) || e.contains(t.el)); }; if (!own(A) || !own(B)) continue; const k = desc(A.el) + '|' + desc(B.el); if (seenP.has(k)) continue; seenP.add(k); out.push(`text "${txt(A.el)}" overlaps "${txt(B.el)}" by ${Math.round(ox)}×${Math.round(oy)}px (${desc(A.el)} / ${desc(B.el)})`); }
    }
  }

  // text inside charts: <text> labels of the same svg must not touch one another
  document.querySelectorAll('svg').forEach(sv => {
    if (!vis(sv)) return;
    const tx = [...sv.querySelectorAll('text')].filter(t => (t.textContent || '').trim() && getComputedStyle(t).visibility !== 'hidden').map(t => ({ el: t, r: t.getBoundingClientRect() })).filter(t => t.r.width > 0 && t.r.height > 0);
    const seenS = new Set();
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
      const A = tx[i], B = tx[j];
      const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ox > 1.5 && oy > 3) { const k = (A.el.textContent + '|' + B.el.textContent).trim(); if (seenS.has(k)) continue; seenS.add(k); out.push(`chart label "${txt(A.el)}" touches "${txt(B.el)}" by ${Math.round(ox)}×${Math.round(oy)}px in ${(sv.getAttribute('aria-label') || sv.getAttribute('class') || 'svg').slice(0, 40)}`); }
    }
    // a label outside the svg's own box is cut off (overflow:visible hides nothing, the card's edge does)
    const sr = sv.getBoundingClientRect();
    for (const t of tx) { if (t.r.left < sr.left - 2 || t.r.right > sr.right + 2 || t.r.top < sr.top - 2 || t.r.bottom > sr.bottom + 2) { out.push(`chart label "${txt(t.el)}" sticks out of its chart (${Math.round(t.r.left - sr.left)},${Math.round(t.r.right - sr.right)},${Math.round(t.r.top - sr.top)},${Math.round(t.r.bottom - sr.bottom)})`); break; } }
  });

  // boxes that hide part of their content behind a sideways scroll: fine for a wide data table, a finding for anything a person must read whole
  document.querySelectorAll('*').forEach(el => { const cs = getComputedStyle(el); if (!/(auto|scroll)/.test(cs.overflowX) || !vis(el)) return; const hid = el.scrollWidth - el.clientWidth; if (hid > 2 && !el.matches(allow)) out.push(`scroller ${desc(el)} hides ${hid}px of its content to the right`); });
  // the page itself
  const sw = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (sw > 1) out.push('page scrolls sideways by ' + sw + 'px');
  return out;
};
window.__escapeAudit();
