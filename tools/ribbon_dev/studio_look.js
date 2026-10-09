// ── Look: lighting, one-click styles, colour-blind palettes, and the helpers on the picture ─────
// A style changes how the figure looks — colour mode, lighting, outline, background, projection — and never what is in it:
// labels, highlights, measurements and pockets stay. One click, one undo.
var PRESETS=[
  {id:'clean',n:'Clean',d:'One colour, soft light, white',sw:'linear-gradient(135deg,#5e87c5,#9fb6dd)',
   s:{style:'cartoon',color:'uniform',uniformColor:'#5e87c5',lighting:'soft',fog:false,border:'thin',bg:'white',projection:'orthographic',palette:'ribbon'}},
  {id:'ternary',n:'Ternary complex',d:'A colour per chain, the degrader magenta, its pocket',sw:'linear-gradient(135deg,#9fc5e8 0 33%,#f4b6b2 0 66%,#e642c8 0)',
   s:{style:'cartoon',color:'chain',lighting:'soft',fog:false,border:'thin',bg:'white',palette:'pastel'},
   after:function(){ var l=ligands[0]; if(l){ state.ligColors[l.key]='#e642c8'; state.pockets={}; state.pockets[l.key]=true; } }},
  {id:'pocket',n:'Ligand pocket',d:'Grey protein, yellow ligand, the residues around it, close up',sw:'linear-gradient(135deg,#c9ccd6 0 60%,#ffd400 0)',
   s:{style:'cartoon',color:'uniform',uniformColor:'#c9ccd6',lighting:'soft',fog:true,border:'thin',bg:'white'},
   after:function(){ var l=ligands[0]; if(l){ state.ligColors[l.key]='yellowCarbon'; state.pockets={}; state.pockets[l.key]=true; setTimeout(function(){ focusLigand(l); },60); } }},
  {id:'surface',n:'Surface',d:'A translucent surface over the chains',sw:'radial-gradient(circle at 40% 40%,#cfe0f7,#5e87c5)',
   s:{style:'surface',color:'chain',surfaceOpacity:0.55,lighting:'soft',fog:false,border:'thin',bg:'white',palette:'ribbon'}},
  {id:'cover',n:'Cover',d:'Dark, deep shadows, thick outline',sw:'linear-gradient(135deg,#13161e 0 45%,#e6194b 0 70%,#42d4f4 0)',
   s:{style:'cartoon',color:'chain',lighting:'full',fog:true,border:'thick',bg:'dark',projection:'orthographic',palette:'vivid'}},
  {id:'confidence',n:'Confidence',d:'Coloured by pLDDT or B-factor, with the key',sw:'linear-gradient(90deg,#ff7d45,#ffdb13,#65cbf3,#0053d6)',
   s:{style:'cartoon',color:'conf',lighting:'simple',fog:false,border:'thin',bg:'white'}}
];
function applyLook(patch,after){
  if(!currentModel) return;
  if(patch.color&&patch.color!=='uniform') state.chainColors={};
  Object.keys(patch).forEach(function(k){ state[k]=typeof patch[k]==='object'&&patch[k]?_clone(patch[k]):patch[k]; });
  if(after) after();
  syncControlsToState(); $('topColor').value=state.color;
  applyBackground(); applyProjection(); buildGeometry(); updateLegend(); renderChainList(); renderLigList(); updateSummaries(); if(SEQ.on) seqRender();
  if(!_userMoved) fitView({animate:true});
}
function applyPreset(id){
  var p=PRESETS.filter(function(x){ return x.id===id; })[0]; if(!p) return false;
  if(id==='confidence'&&!isAF()&&!(bRange[1]>bRange[0])) { showToast('This structure has no B-factors to colour by.'); return false; }
  applyLook(p.s,p.after); state.look=id; renderPresets(); return true;
}
function renderPresets(){
  var g=$('presetGrid'); if(!g) return;
  g.innerHTML=PRESETS.map(function(p){ return '<button type="button" class="preset'+(state.look===p.id?' on':'')+'" data-p="'+p.id+'" title="'+escapeHtml(p.d)+'" aria-pressed="'+(state.look===p.id)+'"><i style="background:'+p.sw+'"></i><b>'+escapeHtml(p.n)+'</b></button>'; }).join('');
}
function syncLookControls(){
  _segSet('lightSeg',state.lighting||'simple');
  var L=LIGHTING[state.lighting]||LIGHTING.simple; if($('lightHint')) $('lightHint').textContent=L.d;
  if($('fogChk')){ $('fogChk').checked=!!state.fog; $('fogChk').disabled=state.bg==='transparent'||!!L.flat; $('fogChk').parentNode.title=state.bg==='transparent'?'A depth cue needs a white or dark background: what is further away fades into it.':''; }
  if($('palSel')) $('palSel').value=state.palette||'ribbon';
  if($('valMapSel')) $('valMapSel').value=state.valMap||'consurf';
  if($('valMapFld')) $('valMapFld').hidden=!state.values;
  if($('scaleChk')) $('scaleChk').checked=!!state.scalebar;
  contrastCheck(); decorUpdate();
}
// A chain colour that nearly disappears against the background is named, so it can be changed before it reaches a slide.
function _contrast(a,b){ var la=_lum(a)+0.05, lb=_lum(b)+0.05; return la>lb?la/lb:lb/la; }
function contrastCheck(){
  var el=$('contrastWarn'); if(!el) return;
  if(!currentModel||state.style==='stick'){ el.hidden=true; return; }
  var bg=state.bg==='dark'?'#13161e':state.bg==='white'?'#ffffff':(document.documentElement.getAttribute('data-theme')==='dark'?'#13161e':'#ffffff');
  var lim=state.border==='none'?1.35:1.12;   // an outline carries a pale shape on its own
  var weak=visibleChains().filter(function(ch){ return _contrast(chainSolidColor(ch),bg)<lim; });
  if(state.color==='uniform'&&!weak.length&&_contrast(adjustColor(state.uniformColor),bg)<lim) weak=['all'];
  el.hidden=!weak.length;
  el.textContent=weak.length?(weak[0]==='all'?'This colour is hard to see on this background.':(weak.length===1?chainTitle(weak[0]):weak.length+' chains')+' will be hard to see on this background.'):'';
}
// The axes and the scale bar follow the camera
var _decorRaf=0;
function decorUpdate(){
  if(_decorRaf) return;
  _decorRaf=requestAnimationFrame(function(){ _decorRaf=0; drawAxes(); drawScaleBar(); });
}
function drawAxes(){
  var el=$('axesInd'); if(!el) return;
  var vp=$('viewport'), on=!!(currentModel&&viewer&&load('ribbon_axes')==='1')&&(!vp||vp.clientHeight>=170); el.toggleAttribute('hidden',!on); if(!on) return;   // an <svg> has no .hidden property; a viewer too short for them goes without
  var v; try{ v=viewer.getView(); }catch(e){ return; }
  var R=_camRot(v), cols=['#e5484d','#30a46c','#3e63dd'], names=['x','y','z'], h='';
  [0,1,2].map(function(i){ return {i:i,x:R[0][i],y:R[1][i],z:R[2][i]}; }).sort(function(a,b){ return a.z-b.z; }).forEach(function(a){
    var x=a.x*18, y=-a.y*18;   // the letters sit at 1.5× the arrow, inside the 66-unit box whichever way the axis points
    h+='<line x1="0" y1="0" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+cols[a.i]+'" opacity="'+(a.z<0?0.45:1)+'"/><text x="'+(x*1.5).toFixed(1)+'" y="'+(y*1.5+4).toFixed(1)+'" text-anchor="middle" fill="'+cols[a.i]+'">'+names[a.i]+'</text>';
  });
  el.innerHTML=h;
}
function scaleMeasure(){   // pixels per Å at the middle of the structure, and a round length that makes a 50–140 px bar
  if(!viewer||!currentModel) return null;
  var pts=fitPoints(); if(!pts.length) return null;
  var c={x:0,y:0,z:0}; pts.forEach(function(p){ c.x+=p.x; c.y+=p.y; c.z+=p.z; }); c.x/=pts.length; c.y/=pts.length; c.z/=pts.length;
  var v; try{ v=viewer.getView(); }catch(e){ return null; }
  var R=_camRot(v), ax={x:R[0][0],y:R[0][1],z:R[0][2]};   // the camera's x axis, in model coordinates
  var a=viewer.modelToScreen(c), b=viewer.modelToScreen({x:c.x+ax.x*10,y:c.y+ax.y*10,z:c.z+ax.z*10});
  var ppa=Math.hypot(b.x-a.x,b.y-a.y)/10; if(!(ppa>0)) return null;
  var L=[1,2,5,10,20,25,50,100,200,500].filter(function(x){ return x*ppa>=50&&x*ppa<=150; })[0]||[1,2,5,10,20,25,50,100,200,500].reduce(function(p,x){ return Math.abs(x*ppa-90)<Math.abs(p*ppa-90)?x:p; },10);
  return {ppa:ppa,len:L,px:L*ppa};
}
function drawScaleBar(){
  var el=$('scaleBar'); if(!el) return;
  var vp=$('viewport'), on=!!(state.scalebar&&currentModel)&&(!vp||vp.clientHeight>=110); el.hidden=!on; if(!on) return;   // still in the export; on screen only where it fits
  var m=scaleMeasure(); if(!m){ el.hidden=true; return; }
  var ink=state.bg==='dark'?'#e8eaf2':state.bg==='white'?'#1a1d2e':'';   // the bar is drawn on the picture's background, not the page's
  el.style.color=ink; el.querySelector('i').style.background=ink||''; el.querySelector('i').style.width=m.px.toFixed(1)+'px'; el.querySelector('span').textContent=m.len+' Å'; el.querySelector('span').style.color=ink||'';
}
function drawScaleBarToCtx(ctx,factor,rect,bgKey){
  var m=scaleMeasure(); if(!m) return;
  var dark=bgKey==='dark'||(bgKey==='transparent'&&state.bg==='dark'), ink=dark?'#e8eaf2':'#1a1d2e';
  var w=m.px*factor, x1=ctx.canvas.width-24*factor, x0=x1-w, y=ctx.canvas.height-28*factor;
  ctx.save(); ctx.fillStyle=ink; ctx.beginPath(); _roundRectPath(ctx,x0,y,w,4*factor,2*factor); ctx.fill();
  ctx.font='600 '+(12*factor)+"px 'IBM Plex Mono', monospace"; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(m.len+' Å',x0+w/2,y-4*factor); ctx.restore();
}
function veChips(){   // the empty viewer offers what was opened before, and two examples
  var el=$('veChips'); if(!el) return;
  var rec=[]; try{ rec=JSON.parse(load('ribbon_recent')||'[]'); }catch(e){}
  rec=(Array.isArray(rec)?rec:[]).filter(function(r){ return r&&typeof r.q==='string'; }).slice(0,4);
  var ex=[{q:'5T35',l:'PROTAC ternary complex'},{q:'P04637',l:'AlphaFold: p53'}].filter(function(x){ return !rec.some(function(r){ return r.q===x.q; }); });
  el.innerHTML=rec.map(function(r){ return '<button type="button" class="ve-chip" data-q="'+escapeHtml(r.q)+'"><b>'+escapeHtml(r.q)+'</b><span>'+escapeHtml(r.l&&r.l!==r.q?r.l:'opened before')+'</span></button>'; }).join('')
    +ex.slice(0,Math.max(0,4-rec.length)).map(function(r){ return '<button type="button" class="ve-chip" data-q="'+r.q+'"><b>'+r.q+'</b><span>'+r.l+'</span></button>'; }).join('');
}
function lookWire(){
  renderPresets();
  $('presetGrid').addEventListener('click',function(e){ var b=e.target.closest('.preset'); if(b) applyPreset(b.dataset.p); });
  segHandler('lightSeg','lighting',function(){ state.look=null; renderPresets(); applyBorder(); syncLookControls(); updateSummaries(); });
  $('fogChk').addEventListener('change',function(e){ state.fog=e.target.checked; applyBorder(); });
  $('palSel').innerHTML=Object.keys(PALETTES).map(function(k){ return '<option value="'+k+'">'+escapeHtml(PALETTES[k].n)+'</option>'; }).join('');
  $('palSel').addEventListener('change',function(e){ state.palette=e.target.value; if(state.color!=='chain'){ state.color='chain'; $('topColor').value='chain'; } state.chainColors={}; updateColorOrOpacity(); renderChainList(); contrastCheck(); if(SEQ.on) seqRender(); });
  $('valMapSel').innerHTML=Object.keys(VAL_MAPS).map(function(k){ return '<option value="'+k+'">'+escapeHtml(VAL_MAPS[k].n)+'</option>'; }).join('');
  $('valMapSel').addEventListener('change',function(e){ state.valMap=e.target.value; recolorStructure(); updateLegend(); renderChainList(); });
  $('scaleChk').addEventListener('change',function(e){ state.scalebar=e.target.checked; decorUpdate(); updateSummaries(); });
  $('axesChk').checked=load('ribbon_axes')==='1';
  $('axesChk').addEventListener('change',function(e){ store('ribbon_axes',e.target.checked?'1':'0'); decorUpdate(); });
  $('veChips').addEventListener('click',function(e){ var b=e.target.closest('.ve-chip'); if(!b) return; $('pdbInput').value=b.dataset.q; handleSubmit(); });
  veChips();
  _selListeners.push(contrastCheck);
}
function lookOnViewer(){ try{ viewer.setViewChangeCallback(function(){ decorUpdate(); }); }catch(e){} }
RB_CMDS.push(
  {n:['lighting','light','lights'],d:'Simple, soft, full or flat light',f:'lighting soft · lighting full',
   args:function(){ return Object.keys(LIGHTING).map(function(k){ return _cand(k,'word',LIGHTING[k].d); }); },
   run:function(a){ var l=a.trim().toLowerCase(); if(!LIGHTING[l]) return _err('lighting simple · soft · full · flat'); state.lighting=l; state.look=null; _segSet('lightSeg',l); applyBorder(); syncLookControls(); renderPresets(); return _ok(LIGHTING[l].n+' light.'); }},
  {n:['fog','depthcue','depth'],d:'Fade what is further away',f:'fog on · fog off',
   args:function(){ return [_cand('on','word',''),_cand('off','word','')]; },
   run:function(a){ var on=!/^(off|no|false|0)$/i.test(a.trim()); state.fog=on; applyBorder(); syncLookControls(); return _ok(on?(state.bg==='transparent'?'Depth cue on — it shows once the background is white or dark.':'Depth cue on.'):'Depth cue off.'); }},
  {n:['preset','look','theme'],d:'A whole look in one go',f:'preset ternary · preset pocket · preset cover',
   args:function(){ return PRESETS.map(function(p){ return _cand(p.id,'word',p.n+' — '+p.d); }); },
   run:function(a){ var n=needModel(); if(n) return n; var l=a.trim().toLowerCase(), p=PRESETS.filter(function(x){ return x.id===l||x.n.toLowerCase()===l||x.n.toLowerCase().indexOf(l)===0; })[0]; if(!p) return _err('preset '+PRESETS.map(function(x){ return x.id; }).join(' · ')); return applyPreset(p.id)?_ok(p.n+'.'):_err('Not for this structure.'); }},
  {n:['palette','colours','colors'],d:'The colours chains are given',f:'palette okabe · palette tol · palette pastel',
   args:function(){ return Object.keys(PALETTES).map(function(k){ return _cand(k,'word',PALETTES[k].n); }); },
   run:function(a){ var l=a.trim().toLowerCase(), k=Object.keys(PALETTES).filter(function(x){ return x===l||PALETTES[x].n.toLowerCase().indexOf(l)===0; })[0]; if(!k) return _err('palette '+Object.keys(PALETTES).join(' · ')); $('palSel').value=k; $('palSel').dispatchEvent(new Event('change')); return _ok(PALETTES[k].n+'.'); }},
  {n:['scalebar','scale'],d:'A scale bar in Å, in the export too',f:'scalebar on · scalebar off',
   args:function(){ return [_cand('on','word',''),_cand('off','word','')]; },
   run:function(a){ state.scalebar=!/^(off|no|false|0)$/i.test(a.trim()); syncLookControls(); decorUpdate(); return _ok('Scale bar '+(state.scalebar?'on.':'off.')); }},
  {n:['axes','axis'],d:'Show the x, y and z axes (screen only)',f:'axes on · axes off',
   args:function(){ return [_cand('on','word',''),_cand('off','word','')]; },
   run:function(a){ var on=!/^(off|no|false|0)$/i.test(a.trim()); store('ribbon_axes',on?'1':'0'); $('axesChk').checked=on; decorUpdate(); return _ok('Axes '+(on?'on.':'off.')); }}
);
