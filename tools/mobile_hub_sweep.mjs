// dHUB on a phone — the whole Hub, every app in its real frame.
//
// tools/mobile_sweep.mjs sweeps Labbook. This one sweeps everything else: the shell (visitor home,
// the workspace, every landing, Settings, search) and each of the apps, opened the way a phone user
// opens them — through the shell, inside the srcdoc frame, under the shell's own header and bottom
// tab bar — in an emulated phone (touch, DPR 2, mobile UA), in portrait AND landscape.
//
// The rule it enforces is Jon's (2026-09-29): *everything on screen can be seen, nothing overlaps,
// and a screen that cannot fit says so instead of drawing something nobody can read.* So at every
// screen it measures what a person's eye would catch:
//
//   overlap     two pieces of text whose boxes intersect and are both painted on top
//   covered     text that is there but has something else painted over it (elementFromPoint)
//   clipped     text cut by an ancestor with overflow:hidden|clip, or by the edge of the screen,
//               with no scroller that could bring it back (a text-overflow ellipsis is reported
//               separately as `truncated`, and only for short labels — names in a list may ellipse)
//   sideways    the document (or the app's own document) scrolls horizontally
//   offscreen   an interactive control whose box is outside the screen while nothing can scroll to it
//   tiny        visible text under MIN_FONT px
//   fixed       two visible position:fixed elements that overlap each other
//   unfit       a screen marked data-needs-landscape that is drawn instead of the rotate note
//               (or the reverse: the note is showing in landscape)
//
// plus the in-page audits (__runtimeAudit / __alignAudit) and any console / page error.
//
// Usage (repo root):
//   python3 embed.py && python3 -m http.server 8899 &
//   node tools/mobile_hub_sweep.mjs [--engine=chromium|webkit] [--url=URL]
//        [--sizes=390x844,375x667,320x568,844x390] [--themes=light,dark] [--only=echo,pd,shell]
//        [--shots=DIR] [--json=FILE] [--verbose] [--min-font=11]
// Exit 1 on any finding.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ENGINE  = args.engine || 'chromium';
const URL0    = args.url || 'http://127.0.0.1:8899/dHUB.html';
const SIZES   = String(args.sizes || '390x844,375x667,320x568,844x390').split(',').map(s => s.split('x').map(Number));
const THEMES  = String(args.themes || 'light,dark').split(',');
const ONLY    = args.only ? String(args.only).split(',') : null;
const SHOTS   = args.shots ? String(args.shots) : null;
const JSON_OUT= args.json ? String(args.json) : null;
const VERBOSE = !!args.verbose;
const OFFLINE = !!args.offline;   // block Firebase entirely: the state a phone at the bench with no signal is in
const MIN_FONT= Number(args['min-font'] || 11);
const here = path.dirname(new URL(import.meta.url).pathname);
const AUDITS = ['audit_runtime.js', 'audit_align.js'].map(f => fs.readFileSync(path.join(here, f), 'utf8'));

// ── the in-page detector ────────────────────────────────────────────────────────────────────────
// One string, evaluated in the shell's window and in the app frame's window alike; it reads only
// its own document. `opts.frame` is the frame's rect inside the shell (unused for the shell itself).
export const DETECT = `
window.__hub = window.__hub || {};
window.__hub.detect = function(opts){
  opts = opts || {}; var MIN = opts.minFont || 11; var out = [];
  var W = innerWidth, H = innerHeight;
  function nm(n){ if(!n||!n.tagName) return '?'; var c = (typeof n.className==='string' && n.className.trim()) ? '.'+n.className.trim().split(/\\s+/).slice(0,2).join('.') : '';
    return (n.id?('#'+n.id):n.tagName.toLowerCase())+c; }
  function txt(s){ return String(s||'').replace(/\\s+/g,' ').trim().slice(0,38); }
  function shown(el){ for(var n=el;n&&n.nodeType===1&&n!==document.documentElement;n=n.parentElement){ var cs=getComputedStyle(n);
      if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return false; if(cs.visibility==='collapse') return false;
      // a closed <details> and a content-visibility:hidden subtree keep their boxes but paint nothing
      if(cs.contentVisibility==='hidden') return false;
      if(n.parentElement && n.parentElement.tagName==='DETAILS' && !n.parentElement.open && n.tagName!=='SUMMARY') return false; }
    return true; }
  // Text that belongs to a native control's value is not a text node; we read those separately.
  var SKIP = 'script,style,noscript,svg,canvas,#print-root,#copy-stage,#onenote-stage,.sr-only,[aria-hidden="true"],.pl-grid,.pp-grid,.pd-plate,[data-hub-skip]';
  // ── collect every painted line of text ──────────────────────────────────────────────────────
  var lines = [];
  var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var t;
  while((t = tw.nextNode())){
    var v = t.nodeValue; if(!v || !v.trim()) continue;
    var el = t.parentElement; if(!el || el.closest(SKIP)) continue;
    if(!shown(el)) continue;
    var rg = document.createRange(); rg.selectNodeContents(t);
    var rs = rg.getClientRects();
    for(var i=0;i<rs.length;i++){ var r = rs[i]; if(r.width<2||r.height<2) continue; lines.push({el:el,r:r,text:txt(v)}); }
  }
  // form values + placeholders are text too
  document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=hidden]),textarea,select,button').forEach(function(c){
    if(!shown(c)) return; var r = c.getBoundingClientRect(); if(r.width<2||r.height<2) return;
    var val = c.tagName==='SELECT' ? (c.options[c.selectedIndex]||{}).text : (c.tagName==='BUTTON' ? '' : (c.value||c.placeholder));
    if(val && String(val).trim()) lines.push({el:c,r:r,text:txt(val),control:true});
  });

  // ── clip box of an element: viewport ∩ every overflow:hidden|clip ancestor ────────────────
  // An ancestor clips a descendant only if it is in the descendant's containing-block chain: a
  // position:fixed element answers to the viewport alone, an absolute one skips every static ancestor
  // up to the first positioned one. (Echo's setup dialog is fixed inside a 137px overflow:hidden <main>.)
  function clipOf(el, self){
    var box = {l:0,t:0,r:W,b:H,by:'the screen edge',bl:'the screen edge',bt:'the screen edge',br:'the screen edge',bb:'the screen edge'}; var skipping = false;
    for(var n = self ? el : el.parentElement; n && n !== document.documentElement; n = n.parentElement){
      var cs = getComputedStyle(n);
      if(skipping){ if(cs.position !== 'static' || (cs.transform && cs.transform !== 'none')) skipping = false; else continue; }
      var ox = cs.overflowX, oy = cs.overflowY;
      var clipX = (ox==='hidden'||ox==='clip'), clipY = (oy==='hidden'||oy==='clip');
      var scrollX = (ox==='auto'||ox==='scroll'), scrollY = (oy==='auto'||oy==='scroll');
      if(clipX||clipY||scrollX||scrollY){
        var r = n.getBoundingClientRect();
        if(clipX||scrollX){ if(r.left>box.l){box.l=r.left;box.bl=nm(n);box.el_l=n;} if(r.right<box.r){box.r=r.right;box.br=nm(n);box.el_r=n;} }
        if(clipY||scrollY){ if(r.top>box.t){box.t=r.top;box.bt=nm(n);box.el_t=n;} if(r.bottom<box.b){box.b=r.bottom;box.bb=nm(n);box.el_b=n;} }
      }
      if(cs.position === 'fixed') break;
      if(cs.position === 'absolute') skipping = true;
    }
    return box;
  }
  // Which edge of the clip box cuts this rect the most, and who owns that edge (an ancestor, or the screen).
  function cutter(box, r){
    var c = [['l',box.l-r.left],['r',r.right-box.r],['t',box.t-r.top],['b',r.bottom-box.b]].sort(function(a,b){ return b[1]-a[1]; })[0][0];
    return {by:box['b'+c], el:box['el_'+c]};
  }
  // Does anything between the element and the document root scroll on this axis (so text outside
  // the clip is merely reachable, not lost)?
  function scrollsOn(el, axis){
    for(var n=el;n&&n!==document.documentElement&&n.nodeType===1;n=n.parentElement){
      var cs = getComputedStyle(n); var o = axis==='x'?cs.overflowX:cs.overflowY;
      if((o==='auto'||o==='scroll') && (axis==='x'? n.scrollWidth>n.clientWidth+1 : n.scrollHeight>n.clientHeight+1)) return n;
    }
    // the page itself scrolls (html/body are not clipped): whatever is above or below the edge is a scroll away
    var root = document.scrollingElement, rcs = getComputedStyle(document.documentElement), bcs = getComputedStyle(document.body);
    var oo = axis==='x' ? [rcs.overflowX, bcs.overflowX] : [rcs.overflowY, bcs.overflowY];
    if(root && oo.indexOf('hidden')<0 && oo.indexOf('clip')<0 && (axis==='x' ? root.scrollWidth>root.clientWidth+1 : root.scrollHeight>root.clientHeight+1)) return root;
    return null;
  }
  // Tokens that intentionally hide: off-canvas drawers translate away and are pointer-events:none.
  function inertOffscreen(el){ for(var n=el;n&&n.nodeType===1&&n!==document.documentElement;n=n.parentElement){
      var cs=getComputedStyle(n); if(cs.pointerEvents==='none' && n===el) return true;
      if(n.hasAttribute('inert')||n.getAttribute('aria-hidden')==='true') return true; } return false; }

  // A dialog, sheet or popover is a layer the person opened on purpose: whatever it covers is
  // covered by design. Only a covering element that is NOT one of these is a finding.
  var MODAL = '.menu.open,[role=menu],.es-resume,.toast,#toast,#pt-toast,[id$=-toast],[id*=Toast],.modal-back,.set-back,.overlay,#spot-back,[role=dialog],[aria-modal=true],.pop,.pop-sheet,#hub-dlg,#mobile-backdrop,.tour,#lb-tour,[data-hub-backdrop]';
  function isModal(n){
    if(n && n.closest && n.closest(MODAL)) return true;
    // Any fixed layer that fills most of the screen is a dialog, a sheet or a scrim, whatever the app calls it.
    for(var a=n;a&&a.nodeType===1&&a!==document.documentElement;a=a.parentElement){
      var cs=getComputedStyle(a); if(cs.position!=='fixed') continue;
      var r=a.getBoundingClientRect(); if(r.width*r.height >= 0.55*W*H && a.id!=='view-'+(a.id||'').slice(5) && !a.classList.contains('app-view')) return true;
    } return false; }
  // Text sitting under a fixed or sticky bar is normal until the page is scrolled; it is a finding
  // only when nothing can scroll it clear (the last line of a list under the tab bar).
  // (A sticky header covers the rows that scroll under it: that is what sticky is for.)
  function barOf(n){ for(var a=n;a&&a.nodeType===1&&a!==document.documentElement;a=a.parentElement){ var p=getComputedStyle(a).position; if(p==='fixed') return a; if(p==='sticky') return a; } return null; }
  function scrollerOf(el){ for(var n=el.parentElement;n&&n!==document.documentElement;n=n.parentElement){ var cs=getComputedStyle(n); if((cs.overflowY==='auto'||cs.overflowY==='scroll')&&n.scrollHeight>n.clientHeight+1) return n; }
    return document.scrollingElement; }
  function clearsByScroll(el, bar, r){
    if(getComputedStyle(bar).position==='sticky') return true;
    var sc = scrollerOf(el); if(!sc) return false; var br = bar.getBoundingClientRect();
    var inBottomHalf = (br.top+br.bottom)/2 > H/2;
    if(inBottomHalf) return sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2;   // can still move up
    return sc.scrollTop > 2;                                                        // can still move down
  }

  // The nearest ancestor that floats (fixed or absolute) and paints an opaque background: anything inside it hides what is beneath.
  function opaqueLayer(n){ for(var a=n;a&&a.nodeType===1&&a!==document.body;a=a.parentElement){ var cs=getComputedStyle(a);
      if(cs.position!=='fixed' && cs.position!=='absolute' && cs.position!=='sticky') continue;
      var m=(cs.backgroundColor||'').match(/rgba?\(([^)]+)\)/); if(!m) continue; var p=m[1].split(',').map(parseFloat); var al=p.length>3?p[3]:1;
      if(al>=0.9) return a; } return null; }
  function scrollsBetween(el, axis, stop){
    for(var n=el;n&&n.nodeType===1;n=n.parentElement){
      var cs=getComputedStyle(n); var o=axis==='x'?cs.overflowX:cs.overflowY;
      if((o==='auto'||o==='scroll') && (axis==='x'? n.scrollWidth>n.clientWidth+1 : n.scrollHeight>n.clientHeight+1)) return n;
      if(n===stop) break; }
    return null; }
  var seen = {}; function add(kind, msg, key){ var k = kind+'|'+(key||msg); if(seen[k]) return; seen[k]=1; out.push(kind+': '+msg); }

  // ── tiny + clipped + covered, per line ─────────────────────────────────────────────────────
  for(var li=0; li<lines.length; li++){
    var L = lines[li]; var el = L.el; var r = L.r;
    var cs = getComputedStyle(el); var fs = parseFloat(cs.fontSize);
    // on screen at all?
    var onscreen = r.bottom>0 && r.top<H && r.right>0 && r.left<W;
    var floor = el.closest('.well-grid,.pl-grid,.pp-grid,.pd-plate,.well,.pm-grid,.pm-row-hdr,.pm-col-hdr') ? 10 : MIN;   /* a plate's axis labels are sized to the wells; 10px is the floor there */
    if(fs>0 && fs<floor-0.01 && onscreen && !L.control && !el.closest('sub,sup')) add('tiny', nm(el)+' '+fs+'px (e.g. "'+L.text+'")', nm(el)+fs);
    var box = clipOf(el, !L.control);   // a control's own text is inside itself
    // fully outside its clip box: either scrolled out of view (fine) or lost
    var inX = Math.min(r.right,box.r)-Math.max(r.left,box.l), inY = Math.min(r.bottom,box.b)-Math.max(r.top,box.t);
    var outX = r.width - Math.max(0,inX), outY = r.height - Math.max(0,inY);
    var fullyOut = inX<=0 || inY<=0;
    if(!fullyOut && (outX>2 || outY>Math.max(3,r.height*0.2))){
      // partly cut. Ellipsis is a designed truncation; anything else is a cut-off word.
      var ell = false; for(var a=el;a&&a!==document.documentElement;a=a.parentElement){ var c2=getComputedStyle(a); if(c2.textOverflow==='ellipsis'){ell=true;break;} if(a===box.el) break; }
      var ct = cutter(box, r); box.by = ct.by; box.el = ct.el;
      var axis = outX>2 ? 'x' : 'y';
      // Text cut by an ancestor's box is rescued only by a scroller between it and that box (or the box itself);
      // text cut by the screen edge, by any scroller above it, or by the page's own scroll.
      var sc = box.by==='the screen edge' ? scrollsOn(el,axis) : scrollsBetween(el, axis, box.el);
      if(box.by==='the screen edge'){
        // cut by the screen edge: lost, unless a scroller inside the page can bring it back
        if(!sc && !inertOffscreen(el)) add('clipped', nm(el)+' "'+L.text+'" runs off the screen ('+Math.round(outX>2?outX:outY)+'px)');
      } else if(!sc){
        add(ell?'truncated':'clipped', nm(el)+' "'+L.text+'" cut by '+box.by+' ('+Math.round(outX>2?outX:outY)+'px)');
      }
    }
    // covered: sample five points; the text's own element (or a relative) must be on top
    // elementFromPoint cannot see through pointer-events:none, so a toast (or any inert overlay) reads as 'covered' by what is under it
    if(onscreen && !fullyOut && !L.control && cs.pointerEvents!=='none'){
      var pts = [[.5,.5],[.15,.5],[.85,.5],[.5,.25],[.5,.75]]; var cov = 0, by = null;
      for(var pi=0;pi<pts.length;pi++){ var px = r.left+r.width*pts[pi][0], py = r.top+r.height*pts[pi][1];
        if(px<0||py<0||px>=W||py>=H) continue;
        if(px<box.l||px>box.r||py<box.t||py>box.b) continue;
        var top = document.elementFromPoint(px,py); if(!top) continue;
        if(top===el||el.contains(top)||top.contains(el)) continue;
        // a label sitting over its own control, or a transparent hit-layer, is not covering text
        var tcs = getComputedStyle(top);
        if(top.tagName==='INPUT' && top.type==='file') continue;   /* the invisible hit layer over a drop zone */
        if(top.tagName==='LABEL'||top.closest('label')===el.closest('label')&&el.closest('label')) continue;
        cov++; by = top; }
      if(cov>=3 && by && !isModal(by)){
        var bar = barOf(by);
        if(!(bar && clearsByScroll(el, bar, r)))
          add('covered', nm(el)+' "'+L.text+'" is under '+nm(by));
      }
    }
  }

  // ── overlap between two painted pieces of text ─────────────────────────────────────────────
  // Only the part of a line that is actually painted can overlap something: cut it to its clip box.
  var vis = [];
  lines.forEach(function(L){ var b = clipOf(L.el, !L.control); var r = L.r;
    var l = Math.max(r.left,b.l,0), t = Math.max(r.top,b.t,0), rr = Math.min(r.right,b.r,W), bb = Math.min(r.bottom,b.b,H);
    if(rr-l<2||bb-t<2) return;
    vis.push({el:L.el, text:L.text, r:{left:l,top:t,right:rr,bottom:bb,width:rr-l,height:bb-t}, control:L.control}); });
  vis.sort(function(a,b){ return a.r.top-b.r.top; });
  for(var i2=0;i2<vis.length;i2++){ var A = vis[i2];
    for(var j2=i2+1;j2<vis.length;j2++){ var B = vis[j2];
      if(B.r.top>=A.r.bottom) break;
      if(A.el===B.el||A.el.contains(B.el)||B.el.contains(A.el)) {
        if(A.el!==B.el) continue; else continue; }
      var x = Math.min(A.r.right,B.r.right)-Math.max(A.r.left,B.r.left), y = Math.min(A.r.bottom,B.r.bottom)-Math.max(A.r.top,B.r.top);
      if(x<=2||y<=2) continue;
      var small = Math.min(A.r.width*A.r.height, B.r.width*B.r.height);
      if(x*y < small*0.3) continue;
      // one hides the other completely? then it is 'covered', already reported. Both reachable => overlap.
      var ca = document.elementFromPoint(Math.max(0,Math.min(W-1,(Math.max(A.r.left,B.r.left)+Math.min(A.r.right,B.r.right))/2)), Math.max(0,Math.min(H-1,(Math.max(A.r.top,B.r.top)+Math.min(A.r.bottom,B.r.bottom))/2)));
      // if a third opaque element is on top of the overlap, neither is really visible there
      if(ca && !(ca===A.el||A.el.contains(ca)||ca.contains(A.el)||ca===B.el||B.el.contains(ca)||ca.contains(B.el))) continue;
      // one of the two sits in a fixed bar and the other scrolls under it: not an overlap until it cannot scroll clear
      var barA = barOf(A.el), barB = barOf(B.el);
      if((barA && !barB && clearsByScroll(B.el, barA, B.r)) || (barB && !barA && clearsByScroll(A.el, barB, A.r))) continue;
      if(isModal(A.el) !== isModal(B.el)) continue;
      // one sits in an opaque floating layer (a sheet, a popover) the other is not part of: it is on top, the other is under it
      var oa = opaqueLayer(A.el), ob = opaqueLayer(B.el);
      if(oa !== ob && (oa || ob)) continue;
      if(A.el.closest('.toast,#toast,[id$=-toast]')||B.el.closest('.toast,#toast,[id$=-toast]')) continue;   // a toast is transient and sits over whatever is there
      add('overlap', nm(A.el)+' "'+A.text+'"  ×  '+nm(B.el)+' "'+B.text+'"  ('+Math.round(x)+'×'+Math.round(y)+'px)');
    } }


  // ── text that sticks out of the box it is drawn in (a long file name over a dashed border) ──
  function boxOf(el){ for(var a=el;a&&a.nodeType===1&&a!==document.body;a=a.parentElement){ var cs=getComputedStyle(a);
      if(cs.display==='inline'||cs.display==='contents') continue;
      var bw=parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
      var bg=cs.backgroundColor; var hasBg = bg && bg!=='transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg);
      if(bw>0 && cs.borderLeftStyle!=='none' || hasBg) return a; } return null; }
  vis.forEach(function(L){ if(L.control) return; var bx = boxOf(L.el); if(!bx) return;
    var cs=getComputedStyle(bx); if(cs.overflowX!=='visible') return;   // if it clips, the clip rules already speak
    var br=bx.getBoundingClientRect(); if(br.width<8||br.height<8) return;
    var over = Math.max(br.left-L.r.left, L.r.right-br.right);
    if(over>2 && L.r.right<W+1 && L.r.left>-1 && br.width<W-2) add('spill', nm(L.el)+' "'+L.text+'" sticks out of '+nm(bx)+' by '+Math.round(over)+'px', 'spill|'+nm(bx)+'|'+nm(L.el)); });

  // ── a plate must be seen whole: one wider than its box is only half there (reachable by scrolling, but nobody knows) ──
  document.querySelectorAll('.well-grid-wrap,.pl-gridwrap,.plate-scroll-area,#plate-wrap').forEach(function(b){
    if(!shown(b)) return; var over = b.scrollWidth - b.clientWidth; if(over>3)
      add('unfit', 'a plate ('+nm(b)+') is '+over+'px wider than its box: part of it is only reachable by scrolling sideways', 'plate|'+nm(b)); });

  // ── sideways scroll of the document ────────────────────────────────────────────────────────
  var de = document.documentElement;
  if(de.scrollWidth>W+1){
    var worst=null, wr=0; document.querySelectorAll('body *').forEach(function(n){ if(!shown(n)) return; var cs=getComputedStyle(n); if(cs.position==='fixed') return;
      var r=n.getBoundingClientRect(); if(r.width<2) return; if(r.right>wr && !scrollsOn(n,'x')){ wr=r.right; worst=n; } });
    add('sideways', 'the page is '+de.scrollWidth+'px wide in a '+W+'px screen'+(worst?(' — widest: '+nm(worst)+' right='+Math.round(wr)):''));
  }
  // ── a control the screen shows only partly, with nothing to scroll it back ─────────────────
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[onclick],.tab,.outer-tab,.dtab,.setup-stab,.filter-pill,.seg-btn,.chip,.pill').forEach(function(c){
    if(!shown(c)) return; if(c.closest(SKIP)) return; if(inertOffscreen(c)) return;
    var r = c.getBoundingClientRect(); if(r.width<4||r.height<4) return;
    if(r.bottom<=0||r.top>=H) return;   // below the fold: reachable by scrolling
    var cs = getComputedStyle(c); if(cs.position==='fixed'&&(r.right<=0||r.left>=W)) return;
    var box = clipOf(c);
    var cutR = r.right-Math.min(box.r,W), cutL = Math.max(box.l,0)-r.left;
    var lbl = txt(c.textContent||c.value||c.title||c.getAttribute('aria-label'));
    var hit = Math.max(cutR,cutL);
    if((cutR>3||cutL>3) && r.left<W && r.right>0 && !scrollsOn(c,'x')){
      add('offscreen', nm(c)+' "'+lbl+'" is cut '+Math.round(hit)+'px by '+(cutR>3?'the right':'the left')+' edge'+(cutter(box,r).by!=='the screen edge'?(' ('+cutter(box,r).by+')'):''));
    } else if((cutR>3||cutL>3) && r.left<W && r.right>0 && lbl){
      // Reachable by swiping, but a label sliced in half by the edge of a short scrolling row reads as a bug
      // and says nothing about there being more. (Tables and long panels scroll on purpose; a strip of
      // tabs or chips is the case.)
      var sc2 = scrollsOn(c,'x'); if(sc2 && c.matches('button,[role=tab],.tab,.outer-tab,.dtab,.setup-stab,.filter-pill,.seg-btn,.pill,.chip,select,a,label') && sc2.clientHeight<=76 && sc2.getBoundingClientRect().width>=W*0.5)
        add('strip', nm(c)+' "'+lbl+'" is cut '+Math.round(hit)+'px by the edge of a scrolling row ('+nm(sc2)+')', 'strip|'+nm(sc2));
    }
  });

  // ── a floating surface has to be opaque over text: at 86% a sheet shows the page through its own words ──
  document.querySelectorAll('body *').forEach(function(n){
    if(!shown(n) || !isModal(n)) return;
    var cs=getComputedStyle(n); var m=(cs.backgroundColor||'').match(/rgba?\(([^)]+)\)/); if(!m) return;
    var pp=m[1].split(',').map(parseFloat); var al=pp.length>3?pp[3]:1; if(!(al>0.05 && al<0.93)) return;
    var r=n.getBoundingClientRect(); if(r.width*r.height < 0.22*W*H) return;
    if(cs.position==='fixed' && r.width*r.height >= 0.9*W*H) return;              // a scrim is meant to be see-through
    if(n.matches('.modal-back,.set-back,.overlay,#spot-back,#hub-spot-back,#mobile-backdrop,[data-hub-backdrop]')) return;
    for(var q=n.parentElement;q&&q!==document.body;q=q.parentElement){ var qm=(getComputedStyle(q).backgroundColor||'').match(/rgba?\(([^)]+)\)/); if(qm){ var qp=qm[1].split(',').map(parseFloat); if((qp.length>3?qp[3]:1)>=0.93) return; } }   // a tint over an opaque card hides nothing
    var hasOwnText = false; for(var i=0;i<lines.length;i++){ if(n.contains(lines[i].el)){ hasOwnText=true; break; } } if(!hasOwnText) return;
    var beneath = 0, ex = '';
    for(var j=0;j<lines.length;j++){ var L=lines[j]; if(n.contains(L.el) || L.el.contains(n)) continue; if(isModal(L.el) && !n.contains(L.el) && L.el.closest(MODAL) === n.closest(MODAL)) continue;
      var xx=Math.min(L.r.right,r.right)-Math.max(L.r.left,r.left), yy=Math.min(L.r.bottom,r.bottom)-Math.max(L.r.top,r.top);
      if(xx>4 && yy>4 && xx*yy > 0.5*L.r.width*L.r.height){ beneath++; ex = ex || L.text; } }
    if(beneath) add('see-through', nm(n)+' is only '+Math.round(al*100)+'% opaque and '+beneath+' line(s) of the page show through it (e.g. "'+ex+'")', 'see|'+nm(n));
  });

  // ── two fixed things on top of each other ─────────────────────────────────────────────────
  var fx = [];
  document.querySelectorAll('body *').forEach(function(n){ var cs=getComputedStyle(n); if(cs.position!=='fixed') return; if(!shown(n)) return;
    if(cs.pointerEvents==='none') return; var r=n.getBoundingClientRect(); if(r.width<8||r.height<8) return;
    if(r.right<=0||r.left>=W||r.bottom<=0||r.top>=H) return;
    if(isModal(n)) return;
    if(n.classList.contains('app-view')) return;   // the app view is the page; the shell's own bars sit around it
    if(cs.backgroundColor==='rgba(0, 0, 0, 0)' && !n.textContent.trim() && !n.querySelector('img,svg,canvas,iframe')) return;
    fx.push({n:n,r:r}); });
  for(var a1=0;a1<fx.length;a1++) for(var b1=a1+1;b1<fx.length;b1++){ var FA=fx[a1], FB=fx[b1];
    if(FA.n.contains(FB.n)||FB.n.contains(FA.n)) continue;
    var xx=Math.min(FA.r.right,FB.r.right)-Math.max(FA.r.left,FB.r.left), yy=Math.min(FA.r.bottom,FB.r.bottom)-Math.max(FA.r.top,FB.r.top);
    if(xx>4&&yy>4) add('fixed', nm(FA.n)+' × '+nm(FB.n)+' ('+Math.round(xx)+'×'+Math.round(yy)+'px)'); }
  return out;
};
// Scroll every scroller that has somewhere to go to its end, and back again.
window.__hub.scrollEnd = function(){
  var moved = 0;
  var all = [document.scrollingElement].concat([].slice.call(document.querySelectorAll('body *')).filter(function(n){
    var cs=getComputedStyle(n); return (cs.overflowY==='auto'||cs.overflowY==='scroll') && n.scrollHeight>n.clientHeight+40 && n.clientHeight>80; }));
  all.forEach(function(n){ if(!n) return; n.__hubTop = n.scrollTop; n.scrollTop = n.scrollHeight; moved++; });
  return moved;
};
window.__hub.scrollBack = function(){
  var all = [document.scrollingElement].concat([].slice.call(document.querySelectorAll('body *')));
  all.forEach(function(n){ if(n && n.__hubTop!==undefined){ n.scrollTop = n.__hubTop; delete n.__hubTop; } });
};`;

// A stand-in for the Firebase compat SDK: signs the admin in, holds nothing, accepts every write.
const FIREBASE_STUB = `(function(){
  function snap(v){ return { val:function(){return v;}, exists:function(){return v!=null;}, forEach:function(){}, key:null, child:function(){return snap(null);} }; }
  function ref(path){ var r = {
    on:function(e,cb){ setTimeout(function(){ try{ cb(snap(null)); }catch(x){} },0); return cb; },
    once:function(){ return Promise.resolve(snap(null)); }, off:function(){},
    set:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); }, remove:function(){ return Promise.resolve(); },
    push:function(){ return ref(path+'/k'); }, child:function(p){ return ref(path+'/'+p); },
    orderByChild:function(){return r;}, limitToLast:function(){return r;}, limitToFirst:function(){return r;}, equalTo:function(){return r;},
    onDisconnect:function(){ return { set:function(){}, remove:function(){}, cancel:function(){} }; },
    transaction:function(){ return Promise.resolve({committed:true,snapshot:snap(null)}); },
    key:String(path).split('/').pop(), put:function(){ return Promise.resolve({ref:r}); },
    getDownloadURL:function(){ return Promise.resolve(''); }, delete:function(){ return Promise.resolve(); } };
    return r; }
  var user = { email:'maciciorjon@gmail.com', uid:'stub', displayName:'Jon', getIdToken:function(){ return Promise.resolve('t'); } };
  var auth = { currentUser:null, onAuthStateChanged:function(cb){ var u = window.__STUB_NOUSER ? null : user; auth.currentUser = u; setTimeout(function(){ cb(u); }, 60); return function(){}; },
    signOut:function(){ return Promise.resolve(); }, signInWithPopup:function(){ return Promise.resolve({user:user}); } };
  var F = { initializeApp:function(){}, apps:[{}], SDK_VERSION:'stub',
    database:function(){ return { ref:ref, goOffline:function(){}, goOnline:function(){} }; },
    auth:function(){ return auth; }, storage:function(){ return { ref:ref }; } };
  F.auth.GoogleAuthProvider = function(){}; F.auth.EmailAuthProvider = { credential:function(){} };
  F.database.ServerValue = { TIMESTAMP: Date.now() };
  window.firebase = F;
})();`;

// ── the run ──────────────────────────────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const findings = [];           // {size, theme, screen, msg}
// A finding is reported at the first state where it shows up, not again at every later state of
// the same scenario (a dialog left open would otherwise repeat its whole page thirty times).
const seenInScenario = new Map();
let screens = 0;
const shotDir = SHOTS ? (fs.mkdirSync(SHOTS, {recursive:true}), SHOTS) : null;

async function frameOf(page, id) {
  const h = await page.$(`#frame-${id}`); if (!h) return null;
  return await h.contentFrame();
}

async function measure(page, label, ctx, frame, opts = {}) {
  screens++;
  const size = `${ctx.w}x${ctx.h}`;
  const scen = `${size}/${ctx.theme}/${label.split(':')[0]}`;
  if (!seenInScenario.has(scen)) seenInScenario.set(scen, new Set());
  const seenSet = seenInScenario.get(scen);
  const push = (where, msgs) => { for (const m of msgs) { const k = where + '|' + m.replace(/\s*\[at the end of the scroll\]$/, ''); if (seenSet.has(k)) continue; seenSet.add(k); findings.push({ size, theme: ctx.theme, screen: label, where, msg: m }); } };
  const base = { minFont: MIN_FONT };
  const scan = async (target, where) => {
    // top of the page, then again with every scroller at its end (what can never be scrolled clear)
    const a = await target.evaluate(o => window.__hub.detect(o), base);
    let b = [];
    try { const n = await target.evaluate(() => window.__hub.scrollEnd()); if (n) { await page.waitForTimeout(60); b = await target.evaluate(o => window.__hub.detect(o), { ...base, atEnd: true }); await target.evaluate(() => window.__hub.scrollBack()); } } catch (e) {}
    const seenMsg = new Set(a);
    push(where, a); push(where, b.filter(m => !seenMsg.has(m) && /^(covered|overlap|clipped|offscreen)/.test(m)).map(m => m + '  [at the end of the scroll]'));
  };
  try { await scan(page, 'shell'); } catch (e) { push('shell', ['detector threw: ' + e.message]); }
  if (frame) {
    try {
      await frame.evaluate(DETECT);
      await scan(frame, 'app');
      if (opts.audits !== false) for (const src of AUDITS) await frame.evaluate(src).catch(() => {});
      const a = opts.audits === false ? [] : await frame.evaluate(() => { let o = []; try { o = o.concat((window.__runtimeAudit && window.__runtimeAudit()) || []); } catch (e) {} try { o = o.concat((window.__alignAudit && window.__alignAudit()) || []); } catch (e) {} return o; });
      // dead handlers / duplicate ids are covered by the desktop audits; here only the visual ones
      push('app', a.filter(s => /invisible|contrast|clipped|wider|align|different left|height/i.test(s)).map(s => 'audit ' + s));
    } catch (e) { push('app', ['detector threw: ' + e.message]); }
  }
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `${ctx.theme}-${size}-${label.replace(/[^a-z0-9]+/gi, '_')}.png`) });
}

export { measure };

async function main() {
  const browserType = ENGINE === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch();
  for (const [w, h] of SIZES) for (const theme of THEMES) {
    const ctx = { w, h, theme };
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
    if (OFFLINE) await context.route(/gstatic\.com\/firebasejs|firebaseio|identitytoolkit|firebaseapp\.com|firebasestorage/, r => r.abort());
    else {
      // The signed-in, healthy state: the SDK answers, the admin is signed in, nothing is in the cloud.
      await context.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-app-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: FIREBASE_STUB }));
      await context.route(/gstatic\.com\/firebasejs\/[^/]+\/firebase-(auth|database|storage)-compat\.js/, r => r.fulfill({ contentType: 'application/javascript', body: '' }));
      await context.route(/firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage/, r => r.abort());
    }
    await context.addInitScript(t => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('hub_theme', t); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} }, theme);
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('page error: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|fonts\.g/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
    for (let a = 0; ; a++) { try { await page.goto(URL0, { timeout: 120000 }); break; } catch (e) { if (a >= 2) throw e; } }
    await page.waitForTimeout(1200);
    await page.evaluate(DETECT);
    const { SCENARIOS } = await import('./mobile_hub_scenarios.mjs');
    for (const sc of SCENARIOS) {
      if (ONLY && !ONLY.includes(sc.id)) continue;
      try { await sc.run({ page, ctx, measure: (label, frame, o) => measure(page, `${sc.id}:${label}`, ctx, frame, o), frameOf: id => frameOf(page, id), DETECT, report: (label, msg) => findings.push({ size: `${w}x${h}`, theme, screen: `${sc.id}:${label}`, where: 'app', msg }), measureOn: (pg, label, frame, o) => measure(pg, `${sc.id}:${label}`, ctx, frame, o),
              fresh: async (o = {}) => { const pg = await context.newPage(); if (o.visitor) await pg.addInitScript(() => { window.__STUB_NOUSER = 1; }); await pg.goto(URL0, { timeout: 120000 }); await pg.waitForTimeout(1200); await pg.evaluate(DETECT); return pg; } }); }
      catch (e) { findings.push({ size: `${w}x${h}`, theme, screen: sc.id, where: 'harness', msg: 'scenario threw: ' + e.message.split('\n')[0] }); }
    }
    for (const e of errs) findings.push({ size: `${w}x${h}`, theme, screen: 'run', where: 'console', msg: e });
    await context.close();
    process.stdout.write(`  ${w}x${h} ${theme}: ${findings.filter(f => f.size === `${w}x${h}` && f.theme === theme).length} findings\n`);
  }
  await browser.close();
  // group identical findings across sizes/themes
  const byKey = new Map();
  for (const f of findings) { const k = `${f.screen}|${f.where}|${f.msg}`; if (!byKey.has(k)) byKey.set(k, { ...f, at: new Set() }); byKey.get(k).at.add(`${f.size}/${f.theme[0]}`); }
  const rows = [...byKey.values()];
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(rows.map(r => ({ ...r, at: [...r.at] })), null, 1));
  console.log(`\n${screens} screens measured, ${rows.length} distinct findings`);
  const ADVISORY = /^truncated:/;
  const kinds = {};
  for (const r of rows) { const k = r.msg.split(':')[0]; kinds[k] = (kinds[k] || 0) + 1; }
  console.log(JSON.stringify(kinds));
  for (const r of rows.slice(0, VERBOSE ? 9999 : 120)) console.log(`✗ [${r.screen}] (${r.where}) ${r.msg}   @ ${[...r.at].slice(0, 6).join(' ')}${r.at.size > 6 ? ' …' : ''}`);
  // `truncated` (a name or a summary cut with an ellipsis) is reported so it can be judged, but it is a
  // design choice in a dense list and does not fail the run; --strict counts it.
  const failing = rows.filter(r => args.strict || !ADVISORY.test(r.msg));
  console.log(`${failing.length} failing, ${rows.length - failing.length} advisory`);
  process.exit(failing.length ? 1 : 0);
}
if (process.argv[1] && process.argv[1].endsWith('mobile_hub_sweep.mjs')) main();
