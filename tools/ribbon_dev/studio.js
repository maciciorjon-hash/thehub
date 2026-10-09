// ═══ RIBBON STUDIO — the parts that make Ribbon a ChimeraX that is easy to use ════════════════
// One selection (residues), shared by the sequence, the structure, the command line and the panel.
// The selection is a working state, not part of a figure: it is tinted green on screen, never in an export, a script or a design.
var SEL_COLOR='#22c55e';
var _sel={}, _selN=0, _selAnchor=null, _selHide=false, _selListeners=[];
function rbSelTint(){ return (_selN&&!_selHide)?_sel:null; }
function rKey(ch,resi,ic){ return (ch||'')+'|'+resi+String(ic||'').trim(); }   // 3Dmol gives a blank insertion code as a space
function rKeyOf(a){ return rKey(a.chain,a.resi,a.icode); }
function rKeyParse(k){ var i=k.indexOf('|'), m=/^(-?\d+)(.*)$/.exec(k.slice(i+1))||[0,0,'']; return {chain:k.slice(0,i),resi:parseInt(m[1],10),ic:m[2]||''}; }
function selKeys(){ return Object.keys(_sel); }
function selHas(k){ return !!_sel[k]; }
// mode: 'replace' (the default) · 'add' · 'remove' · 'toggle'
function selSet(keys,mode){
  mode=mode||'replace';
  if(mode==='replace') _sel={};
  var allIn=mode==='toggle'&&keys.length&&keys.every(function(k){ return _sel[k]; });
  keys.forEach(function(k){
    if(mode==='remove'||(mode==='toggle'&&allIn)) delete _sel[k];
    else _sel[k]=1;
  });
  _selN=Object.keys(_sel).length;
  selChanged();
}
function selClear(){ if(!_selN) return; _sel={}; _selN=0; _selAnchor=null; selChanged(); }
function selChanged(){
  if(currentModel&&viewer) recolorStructure();
  seqPaintSel(); renderSelActs();
  if(typeof updateSummaries==='function') updateSummaries();
  _selListeners.forEach(function(f){ try{ f(); }catch(e){} });
}
// The selection by chain, as numbers (insertion codes are kept as their own residues by the key, and dropped in ranges)
function selByChain(){
  var by={};
  selKeys().forEach(function(k){ var r=rKeyParse(k); (by[r.chain]||(by[r.chain]=[])).push(r.resi); });
  return by;
}
function selRangesText(){   // "A:45-60, B:3-5" — the form the highlight box and the scripts already read
  var by=selByChain(), out=[];
  chainList.forEach(function(ch){ if(by[ch]) out.push(rangesText(ch.trim()?ch:'',by[ch])); });
  Object.keys(by).forEach(function(ch){ if(chainList.indexOf(ch)<0) out.push(rangesText(ch,by[ch])); });
  return out.join(', ');
}
function selSpec3D(){   // a 3Dmol selection for the selected residues
  var by=selByChain(), parts=Object.keys(by).map(function(ch){ return {chain:ch,resi:by[ch]}; });
  return parts.length===1?parts[0]:{or:parts};
}
function selDescribe(){
  if(!_selN) return '';
  var by=selByChain(), chs=Object.keys(by);
  return _selN+(_selN===1?' residue':' residues')+' · '+(chs.length>3?chs.length+' chains':selRangesText().slice(0,60)+(selRangesText().length>60?'…':''));
}
function selFocus(){ if(!_selN||!currentModel) return; _userMoved=true; fitView({focus:selSpec3D(),animate:true,margin:0.16}); }
function selAsHighlight(sticks){
  if(!_selN) return;
  var color=HL_COLORS[state.highlights.length%HL_COLORS.length];
  state.highlights.push({id:'h'+Date.now().toString(36),sel:selRangesText(),color:color,sticks:!!sticks});
  delete state.off.hl;
  recolorStructure(); renderHlList(); updateSummaries();
  showToast((sticks?'Drawn as sticks and coloured: ':'Coloured: ')+selRangesText().slice(0,50));
}
function selLabel(){
  if(!_selN) return;
  var ks=selKeys(), n=0;
  if(ks.length>40){ showToast('That is '+ks.length+' residues. Label up to 40 at a time — a figure with more labels than that is unreadable.'); return; }
  ks.forEach(function(k){
    var r=rKeyParse(k), a=currentModel.selectedAtoms({chain:r.chain,resi:r.resi})[0]; if(!a) return;
    if((state.residueLabels||[]).some(function(x){ return x.chain===r.chain&&x.resi===r.resi; })) return;
    state.residueLabels.push({chain:r.chain,resi:r.resi,resn:a.resn,text:(a.resn?a.resn+' ':'')+r.resi+(r.chain.trim()?' /'+r.chain:'')}); n++;
  });
  delete state.off.labels;
  renderLabelTags(); renderResLblList(); showToast(n?'Labelled '+n+(n===1?' residue':' residues'):'They are labelled already.');
}

// ── The sequence, above the structure ───────────────────────────────────────────────────────
// One row per chain, letters coloured as the structure is, secondary structure as a band on top, a number every ten.
// Click a letter to select it, drag for a range, Shift to extend, ⌘/Ctrl to add; double-click zooms. What is selected
// in the structure is selected here, and the residue under the pointer in either is marked in the other.
var NUC1={DA:'A',DC:'C',DG:'G',DT:'T',DU:'U',DI:'I',A:'A',C:'C',G:'G',U:'U',T:'T',I:'I'};
var SEQ={chains:{},order:[],show:null,on:false,cols:{}}, _seqHoverShape=null, _seqDrag=null;
function seqLetter(resn){ return AA3[resn]||NUC1[resn]||'X'; }
function seqBuild(){
  SEQ.chains={}; SEQ.order=[]; SEQ.cols={};
  if(!currentModel) return;
  var lig={}; ligands.forEach(function(l){ lig[l.resn+':'+l.chain+':'+l.resi]=1; });
  var atoms=currentModel.selectedAtoms({}), map={};
  for(var i=0;i<atoms.length;i++){
    var a=atoms[i], ch=a.chain||'';
    if(chainList.indexOf(ch)<0||WATER_RESN.indexOf(a.resn)>=0) continue;
    if(a.hetflag&&(lig[a.resn+':'+ch+':'+a.resi]||ionResn.indexOf(a.resn)>=0)) continue;
    var k=rKeyOf(a), e=map[k];
    if(!e){ e=map[k]={k:k,ch:ch,resi:a.resi,ic:String(a.icode||'').trim(),resn:a.resn,l:seqLetter(a.resn),ss:'c',at:a}; (SEQ.chains[ch]||(SEQ.chains[ch]=[])).push(e); }
    if(a.atom==='CA'||a.atom==='P'){ e.at=a; e.ss=a.ss==='h'?'h':a.ss==='s'?'s':'c'; }
  }
  SEQ.order=chainList.filter(function(ch){ return SEQ.chains[ch]&&SEQ.chains[ch].length; });
  if(SEQ.order.indexOf(SEQ.show)<0&&SEQ.show!=='*') SEQ.show=SEQ.order[0]||null;
}
function seqShown(){ return SEQ.show==='*'?SEQ.order:(SEQ.show?[SEQ.show]:[]); }
function seqToggle(on){
  SEQ.on=on==null?!SEQ.on:!!on;
  store('ribbon_seq',SEQ.on?'1':'0');
  var b=$('seqBtn'); if(b){ b.classList.toggle('tb-active',SEQ.on); b.setAttribute('aria-pressed',SEQ.on?'true':'false'); }
  $('seqBar').hidden=!SEQ.on||!currentModel;
  if(SEQ.on) seqRender();
}
function seqRender(){
  var bar=$('seqBar'); if(!bar) return;
  bar.hidden=!SEQ.on||!currentModel||!SEQ.order.length;
  if(bar.hidden) return;
  var chips='';
  if(SEQ.order.length>1){
    SEQ.order.forEach(function(ch){ chips+='<button type="button" class="sq-chip'+(SEQ.show===ch?' on':'')+'" data-ch="'+escapeHtml(ch)+'" aria-pressed="'+(SEQ.show===ch)+'"><i style="background:'+chainDot(ch)+'"></i>'+escapeHtml(ch.trim()||'–')+'</button>'; });
    chips+='<button type="button" class="sq-chip'+(SEQ.show==='*'?' on':'')+'" data-ch="*" aria-pressed="'+(SEQ.show==='*')+'">All</button>';
  } else chips='<span class="sq-one">'+escapeHtml(chainTitle(SEQ.order[0]))+'</span>';
  $('sqChains').innerHTML=chips;
  var html='';
  seqShown().forEach(function(ch){
    var L=SEQ.chains[ch], prev=null, off=!!state.hiddenChains[ch], cells='';
    L.forEach(function(e){
      if(prev!==null&&e.resi!==prev+1&&!(e.resi===prev&&e.ic)) cells+='<span class="sq-gap" title="'+(e.resi-prev-1>0?(e.resi-prev-1)+' residues not in the model':'a break in the numbering')+'"></span>';
      var n=(e.resi%10===0&&!e.ic)?' data-n="'+e.resi+'"':'';
      cells+='<span class="sq-r ss-'+e.ss+'" data-k="'+escapeHtml(e.k)+'"'+n+'>'+e.l+'</span>';
      prev=e.resi;
    });
    html+='<div class="sq-row'+(off?' off':'')+'" data-ch="'+escapeHtml(ch)+'"><span class="sq-lab" title="'+escapeHtml(chainTitle(ch))+(chainInfo[ch]&&chainInfo[ch].name?' · '+escapeHtml(chainInfo[ch].name):'')+'">'+escapeHtml(ch.trim()||'–')+'</span><div class="sq-track">'+cells+'</div></div>';
  });
  $('sqRows').innerHTML=html;
  seqRecolor(); seqPaintSel(); renderSelActs();
}
// letters take the colour the structure gives the residue, lightened so the letter reads
var _seqRaf=0;
function seqRecolor(){
  if(!SEQ.on||$('seqBar').hidden) return;
  if(_seqRaf) return;
  _seqRaf=requestAnimationFrame(function(){
    _seqRaf=0;
    var fn=makeColorFn({noDim:true}), dark=document.documentElement.getAttribute('data-theme')==='dark', base=dark?'#13161e':'#ffffff', cache={};
    $('sqRows').querySelectorAll('.sq-r').forEach(function(sp){
      var e=seqEntry(sp.dataset.k); if(!e) return;
      var c=fn(e.at), v=cache[c];
      if(!v){ var bg=_mixHex(c,base,dark?0.55:0.62); v=cache[c]={bg:bg,fg:_lum(bg)>0.55?'#1a1d2e':'#f4f5f8'}; }
      sp.style.background=v.bg; sp.style.color=v.fg;
    });
  });
}
function seqEntry(k){
  var r=k&&k.indexOf('|')>=0?k.slice(0,k.indexOf('|')):null, L=r!=null&&SEQ.chains[r];
  if(!L) return null;
  if(!L._ix){ L._ix={}; L.forEach(function(e,i){ L._ix[e.k]=i; }); }
  var i=L._ix[k]; return i==null?null:L[i];
}
function seqPaintSel(){
  var rows=$('sqRows'); if(!rows||$('seqBar').hidden) return;
  rows.querySelectorAll('.sq-r').forEach(function(sp){ sp.classList.toggle('sel',!!_sel[sp.dataset.k]); });
}
function seqMarkHover(k){
  var rows=$('sqRows'); if(!rows) return;
  var o=rows.querySelector('.sq-r.hov'); if(o) o.classList.remove('hov');
  if(!k||$('seqBar').hidden) return;
  var sp=rows.querySelector('.sq-r[data-k="'+(window.CSS&&CSS.escape?CSS.escape(k):k)+'"]'); if(sp) sp.classList.add('hov');
}
function seq3DMark(e){   // a soft green ball on the residue under the pointer in the sequence
  if(!viewer) return;
  if(_seqHoverShape){ try{ viewer.removeShape(_seqHoverShape); }catch(x){} _seqHoverShape=null; }
  if(e&&e.at&&!state.hiddenChains[e.ch]){
    try{ _seqHoverShape=viewer.addSphere({center:{x:e.at.x,y:e.at.y,z:e.at.z},radius:2.1,color:SEL_COLOR,opacity:0.42,alpha:0.42,hidden:false,clickable:false}); }catch(x){}
  }
  viewer.render();
}
function seqRangeKeys(k0,k1){
  var a=seqEntry(k0), b=seqEntry(k1); if(!a||!b) return [k1];
  if(a.ch!==b.ch) return [k1];
  var L=SEQ.chains[a.ch], i=L._ix[a.k], j=L._ix[b.k], lo=Math.min(i,j), hi=Math.max(i,j);
  return L.slice(lo,hi+1).map(function(e){ return e.k; });
}
function seqInfo(e){
  var t=$('sqInfo'); if(!t) return;
  if(!e){ t.textContent=_selN?'Selected: '+selDescribe():'Click to select · drag for a range · double-click to zoom'; return; }
  t.textContent=(e.ch.trim()?e.ch+' · ':'')+e.resn+' '+e.resi+e.ic+' · '+({h:'helix',s:'strand',c:'loop'})[e.ss];
}
function seqWire(){
  var rows=$('sqRows');
  $('sqChains').addEventListener('click',function(ev){ var b=ev.target.closest('.sq-chip'); if(!b) return; SEQ.show=b.dataset.ch; seqRender(); });
  rows.addEventListener('pointerdown',function(ev){
    var sp=ev.target.closest('.sq-r'); if(!sp||ev.button!==0) return;
    ev.preventDefault();
    var k=sp.dataset.k, add=ev.metaKey||ev.ctrlKey;
    if(ev.shiftKey&&_selAnchor&&seqEntry(_selAnchor)&&seqEntry(_selAnchor).ch===seqEntry(k).ch){ selSet(seqRangeKeys(_selAnchor,k),add?'add':'replace'); return; }
    _seqDrag={k0:k,mode:add?(_sel[k]?'remove':'add'):'replace',base:Object.assign({},_sel)};
    _selAnchor=k;
    if(_seqDrag.mode==='replace'&&_selN===1&&_sel[k]){ _seqDrag.clearOnUp=true; }
    selSet([k],_seqDrag.mode==='remove'?'remove':_seqDrag.mode);
    try{ rows.setPointerCapture(ev.pointerId); }catch(x){}
  });
  rows.addEventListener('pointermove',function(ev){
    var el=document.elementFromPoint(ev.clientX,ev.clientY), sp=el&&el.closest&&el.closest('.sq-r');
    if(_seqDrag){
      if(!sp) return;
      var keys=seqRangeKeys(_seqDrag.k0,sp.dataset.k);
      _sel=_seqDrag.mode==='replace'?{}:Object.assign({},_seqDrag.base);
      keys.forEach(function(k){ if(_seqDrag.mode==='remove') delete _sel[k]; else _sel[k]=1; });
      _selN=Object.keys(_sel).length; _seqDrag.moved=_seqDrag.moved||sp.dataset.k!==_seqDrag.k0;
      seqPaintSel(); seqInfo(seqEntry(sp.dataset.k));
      return;
    }
    if(!sp){ seqInfo(null); return; }
    var e=seqEntry(sp.dataset.k); seqInfo(e);
    if(_seqDrag===null&&sp.dataset.k!==rows._hk){ rows._hk=sp.dataset.k; seq3DMark(e); seqMarkHover(sp.dataset.k); }
  });
  rows.addEventListener('pointerup',function(){
    if(!_seqDrag) return;
    var d=_seqDrag; _seqDrag=null;
    if(d.clearOnUp&&!d.moved){ selClear(); return; }
    selChanged();
  });
  rows.addEventListener('pointerleave',function(){ if(_seqDrag) return; rows._hk=null; seq3DMark(null); seqMarkHover(null); seqInfo(null); });
  rows.addEventListener('dblclick',function(ev){ var sp=ev.target.closest('.sq-r'); if(!sp) return; var e=seqEntry(sp.dataset.k); if(!e) return; selSet([e.k]); _userMoved=true; fitView({focus:{chain:e.ch,resi:e.resi},animate:true,margin:0.3}); });
}
// What can be done with the selection, wherever it was made: next to the sequence, and in the command line.
function renderSelActs(){
  var el=$('sqActs'); if(!el) return;
  if(!_selN){ el.innerHTML=''; seqInfo(null); return; }
  el.innerHTML='<button type="button" class="btn sm" data-a="zoom" title="Zoom to the selection">Zoom</button>'
    +'<button type="button" class="btn sm" data-a="colour" title="Colour the selection (a highlight)">Colour</button>'
    +'<button type="button" class="btn sm" data-a="sticks" title="Draw the selected side chains as sticks">Sticks</button>'
    +'<button type="button" class="btn sm" data-a="label" title="Label each selected residue">Label</button>'
    +'<button type="button" class="ibtn" data-a="clear" title="Clear the selection (Esc)" aria-label="Clear the selection"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>';
  seqInfo(null);
}
function selActClick(ev){
  var b=ev.target.closest('[data-a]'); if(!b) return;
  var a=b.dataset.a;
  if(a==='zoom') selFocus(); else if(a==='colour') selAsHighlight(false); else if(a==='sticks') selAsHighlight(true); else if(a==='label') selLabel(); else if(a==='clear') selClear();
}
// the structure → the sequence
function rbOnHover(atom){ _inspAtom=atom; inspectorPaint(); if(SEQ.on) seqMarkHover(rKeyOf(atom)); }
function rbOnHoverEnd(){ _inspAtom=null; inspectorPaint(); seqMarkHover(null); }
function rbOnModel(){ if(typeof analyseReset==='function') analyseReset(); if(typeof undoReset==='function') undoReset(); if(typeof renderViews==='function') setTimeout(renderViews,0); if(typeof analyseOnModel==='function') setTimeout(analyseOnModel,0); _sel={}; _selN=0; _selAnchor=null; _ligAtomsCache=null; _inspAtom=null; seqBuild(); seqRender(); inspectorPaint(); }
function rbAfterRecolor(){ seqRecolor(); }
function rbExtraRows(){
  return _selN?[{k:'sel',t:'Selection',m:selDescribe(),on:true,go:selFocus}]:[];
}
function rbExtraToggle(k,on){ if(k==='sel'){ if(!on) selClear(); return true; } return false; }
function rbExportBegin(){ if(_selN&&!_selHide){ _selHide=true; recolorStructure(); return true; } if(_seqHoverShape){ seq3DMark(null); } return false; }
function rbExportEnd(was){ if(was){ _selHide=false; recolorStructure(); } }
function studioBoot(){
  seqWire();
  $('sqActs').addEventListener('click',selActClick);
  $('seqBtn').addEventListener('click',function(){ seqToggle(); });
  cmdWire(); if(typeof lookWire==='function') lookWire(); if(typeof analyseWire==='function') analyseWire(); if(typeof moreWire==='function') moreWire();
  var s=load('ribbon_seq'), touch=!!(window.matchMedia&&matchMedia('(hover:none) and (pointer:coarse)').matches); SEQ.on=s==null?!isPhone()&&!touch:s==='1';   // a phone needs the room for the structure
  seqToggle(SEQ.on);
}
// @@CMD@@
// ═══ RIBBON STUDIO — END ═══
