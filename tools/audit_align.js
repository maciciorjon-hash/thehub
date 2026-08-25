// Alignment audit — the companion to tools/audit_app.py, for the thing a static scan cannot
// see: whether the controls on one row actually line up.
//
// Run it from the Browser pane against a page served over http (file:// blocks the iframe
// reads). Load every app into a 1280x900 iframe, eval this file in the frame, call
// __alignAudit(), and it returns one short line per row that is out of line.
//
// What it reports, and why each rule is the rule:
//   * "centres off by N"  — controls that do not share a centre line. The worst kind: it is
//                           what a checkbox floating between its neighbours' label row and
//                           their inputs looks like.
//   * "not on one line"   — controls of the same height whose bottoms disagree.
//   * "heights a/b/c"     — one row, several control heights. docs/UI.md says 32px and means
//                           every control.
//   * "checkbox centred against an N-line label" — the box belongs on the first line, not in
//                           the gap between the lines.
//
// What it deliberately ignores, because each of these was a false positive first:
//   * controls under 22px (a checkbox, a radio, a colour swatch, a round tick) — judged on
//     their centre line only; they are meant to be smaller than a text field.
//   * a zero-height control — the hidden native checkbox behind a custom switch.
//   * a child holding more than one control — a stacked group is centred as a block on
//     purpose, so comparing one of its controls with a single-row sibling compares nothing.
//   * children over 90px tall — that is a layout pane, not a field row.
//
window.__alignAudit=function(){
  var R=[], seen={};
  function vis(e){ var r=e.getBoundingClientRect(); if(!(r.width>0&&r.height>0)) return false;
    var cs=getComputedStyle(e); return cs.visibility!=='hidden'&&cs.opacity!=='0'; }
  var CTL='input:not([type=hidden]),select,textarea,button';
  function ctl(e){ return (e.matches&&e.matches(CTL))?e:e.querySelector(CTL); }
  function sel(t){ if(!t) return '?';
    return t.tagName.toLowerCase()+(t.type&&t.tagName==='INPUT'?'[type='+t.type+']':'')
      +(t.className&&typeof t.className==='string'&&t.className.trim()?'.'+t.className.trim().split(/\s+/).slice(0,2).join('.'):''); }
  function nm(e){ var t=ctl(e); var s=(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,14);
    return sel(t)+(s?'\u00a0"'+s+'"':''); }
  function path(e){ var p=[],n=e; while(n&&n!==document.body&&p.length<2){
      p.push(n.tagName.toLowerCase()+(n.id?'#'+n.id.replace(/[0-9a-z]{10,}/g,'*'):'')
        +(n.className&&typeof n.className==='string'?'.'+n.className.trim().split(/\s+/).slice(0,2).join('.'):'')); n=n.parentElement; }
    return p.join('<'); }
  document.querySelectorAll('*').forEach(function(P){
    if(!vis(P)) return;
    var cs=getComputedStyle(P), d=cs.display;
    if(!(d==='grid'||d==='inline-grid'||((d==='flex'||d==='inline-flex')&&cs.flexDirection.indexOf('row')===0))) return;
    var kids=[].filter.call(P.children,function(c){
      if(c.nodeType!==1||!vis(c)) return false;
      var t=ctl(c); if(!t||t.getBoundingClientRect().height<1) return false;  /* a hidden native
        checkbox behind a custom switch is not something anyone can see out of line */
      if(c!==t && c.querySelectorAll(CTL).length>1) return false;             /* a stacked group
        is centred as a block on purpose; judging one of its controls against a single-row
        sibling compares different things */
      return c.getBoundingClientRect().height<=90; });       /* a field row, not a layout pane */
    if(kids.length<2) return;
    var rows=[];
    kids.forEach(function(c){ var r=c.getBoundingClientRect();
      var g=rows.find(function(x){ return !(r.bottom<=x.top+2||r.top>=x.bottom-2); });
      if(g){ g.items.push(c); g.top=Math.min(g.top,r.top); g.bottom=Math.max(g.bottom,r.bottom); }
      else rows.push({top:r.top,bottom:r.bottom,items:[c]}); });
    rows.forEach(function(g){
      if(g.items.length<2) return;
      var cts=g.items.map(ctl);
      var b=cts.map(function(t){return t.getBoundingClientRect().bottom;});
      var t0=cts.map(function(t){return t.getBoundingClientRect().top;});
      /* a checkbox, a radio, a colour swatch or any control under 20px is intrinsically small;
         it is judged on its centre line, not on matching a text field's height */
      var small=cts.map(function(t){ return /^(checkbox|radio|color|range)$/.test(t.type||'')
        || t.getBoundingClientRect().height<22; });
      var h=cts.map(function(t){return t.getBoundingClientRect().height;});
      var hBig=h.filter(function(_,i){ return !small[i]; });
      var mid=cts.map(function(t){var r=t.getBoundingClientRect();return r.top+r.height/2;});
      var bBig=b.filter(function(_,i){ return !small[i]; });
      var sp=bBig.length>1?(Math.max.apply(null,bBig)-Math.min.apply(null,bBig)):0;
      var hs=hBig.length>1?(Math.max.apply(null,hBig)-Math.min.apply(null,hBig)):0;
      var ms=Math.max.apply(null,mid)-Math.min.apply(null,mid);
      /* controls of equal height should share a line; of unequal height, a centre line */
      var kind = ms>1.5 ? 'centres off by '+Math.round(ms)+' (h '+h.map(Math.round).join('/')+')'
               : (hBig.length>1 && hs<=1 && sp>1.5) ? 'not on one line'
               : (hs>2.5) ? 'heights '+h.map(Math.round).join('/') : null;
      if(!kind) return;
      var key=path(P)+'|'+kind; if(seen[key]) return; seen[key]=1;
      R.push(path(P)+' — '+kind+' :: '+g.items.map(nm).join(' | '));
    });
  });
  document.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(function(bx){
    if(!vis(bx)) return; var L=bx.closest('label')||bx.parentElement; if(!L||!vis(L)) return;
    var cs=getComputedStyle(L);
    if(cs.display.indexOf('flex')<0||cs.flexDirection.indexOf('row')!==0||cs.alignItems!=='center') return;
    var rg=document.createRange(), lines=0;
    [].forEach.call(L.childNodes,function(c){ if(c===bx) return;
      if(c.nodeType===3&&!(c.textContent||'').trim()) return;
      try{ rg.selectNode(c); }catch(e){ return; }
      lines=Math.max(lines, rg.getClientRects().length); });
    if(lines>1){
      var key='wrap|'+path(L); if(seen[key]) return; seen[key]=1;
      R.push(path(L)+' — checkbox centred against a '+lines+'-line label :: '+(L.textContent||'').trim().replace(/\s+/g,' ').slice(0,50)); }
  });
  return R;
};
