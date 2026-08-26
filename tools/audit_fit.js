// Fit audit — the third companion to tools/audit_app.py and tools/audit_align.js, for the one
// thing neither of them can see: whether the text inside a control actually fits inside it.
//
// A select clipped to "full DNA of that plas▾" is not a cosmetic problem. The control is
// showing a choice the user cannot read, and unlike a truncated heading there is no way to
// recover the rest of it without opening the menu.
//
// Run it from the Browser pane against a page served over http: load the app, eval this file
// in the frame, call __fitAudit(). It returns one short line per control whose text is cut.
//
// The four rules:
//   * "select clips its widest option by Npx" — a <select> is as wide as the longest thing it
//     can be set to, or it is lying about the choice on offer. The widest option is measured
//     against the box minus its padding and the native arrow.
//   * "button/label text clipped by Npx"      — scrollWidth past clientWidth with no ellipsis
//     and no scrollbar to recover it: the text is simply gone.
//   * "placeholder clipped by Npx"            — a value can be scrolled, a placeholder cannot,
//     so it is the one string in a text field that has to fit.
//   * "option wider than the menu"            — reported once per select, so a fix can widen
//     the box or shorten the option.
//
// Deliberately ignored, each a false positive first:
//   * text-overflow:ellipsis or a scrollable overflow — truncation that was chosen and that
//     the user can undo (hover, scroll) is not this bug.
//   * an <input> holding a value too long for it — text fields scroll, and a notebook has
//     fields people paste paragraphs into.
//   * anything under 8px over: sub-pixel metrics and the native arrow's own width vary
//     between engines, and a word is never lost to 8px.
//   * hidden controls, and controls inside [hidden]/display:none panes.
window.__fitAudit=function(){
  var R=[], seen={}, ARROW=20, TOL=8;
  var cv=document.createElement('canvas').getContext('2d');
  function vis(e){ var r=e.getBoundingClientRect(); if(!(r.width>0&&r.height>0)) return false;
    var cs=getComputedStyle(e); return cs.visibility!=='hidden'&&cs.opacity!=='0'; }
  function font(cs){ return cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+'/'+cs.lineHeight+' '+cs.fontFamily; }
  function px(s,cs){ cv.font=font(cs); var w=cv.measureText(s).width;
    var ls=parseFloat(cs.letterSpacing); if(isFinite(ls)) w+=ls*s.length; return w; }
  function path(e){ var p=[],n=e; while(n&&n!==document.body&&p.length<2){
      p.push(n.tagName.toLowerCase()+(n.id?'#'+n.id.replace(/[0-9a-z]{10,}/g,'*'):'')
        +(n.className&&typeof n.className==='string'&&n.className.trim()?'.'+n.className.trim().split(/\s+/).slice(0,2).join('.'):'')); n=n.parentElement; }
    return p.join('<'); }
  // The key carries the text, not just the path: two selects in the same grid share a class
  // path and are two different controls with two different strings cut off.
  function add(e,msg){ var k=path(e)+'|'+msg.replace(/by \d+px/,''); if(seen[k]) return; seen[k]=1; R.push(path(e)+' — '+msg); }

  document.querySelectorAll('select').forEach(function(s){
    if(!vis(s)) return;
    var cs=getComputedStyle(s), r=s.getBoundingClientRect();
    var room=r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)
             -parseFloat(cs.borderLeftWidth)-parseFloat(cs.borderRightWidth)-ARROW;
    var worst=null, wmax=0;
    [].forEach.call(s.options,function(o){ var w=px(o.text,cs); if(w>wmax){ wmax=w; worst=o.text; } });
    if(wmax>room+TOL) add(s,'select clips its widest option by '+Math.round(wmax-room)+'px :: "'+worst+'"');
  });

  document.querySelectorAll('button,label,th,.btn,legend,option').forEach(function(e){
    if(e.tagName==='OPTION'||!vis(e)) return;
    if(e.querySelector('input,select,textarea')) return;   /* a field label wraps; its control is judged on its own */
    var cs=getComputedStyle(e);
    if(cs.textOverflow==='ellipsis') return;                /* truncation someone chose */
    if(/(auto|scroll)/.test(cs.overflowX)) return;          /* recoverable by scrolling */
    if(cs.whiteSpace==='nowrap'||cs.overflow==='hidden'){
      var over=e.scrollWidth-e.clientWidth;
      if(over>TOL) add(e,(e.tagName.toLowerCase())+' text clipped by '+Math.round(over)+'px :: "'
        +(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40)+'"');
    }
  });

  document.querySelectorAll('input[placeholder]').forEach(function(i){
    if(!vis(i)||!i.placeholder) return;
    var cs=getComputedStyle(i), r=i.getBoundingClientRect();
    var room=r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-4;
    var w=px(i.placeholder,cs);
    if(w>room+TOL) add(i,'placeholder clipped by '+Math.round(w-room)+'px :: "'+i.placeholder+'"');
  });
  return R;
};
