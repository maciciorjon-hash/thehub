// ── Look: lighting, one-click styles, colour-blind palettes, and the helpers on the picture ─────
// A style changes how the figure looks — colour mode, lighting, outline, background, projection — and never what is in it:
// labels, highlights, measurements and pockets stay. One click, one undo.
// A style starts from the same known state and sets what it needs on top, so styles never stack (Ternary used to leave a
// perspective and a colour tuning behind for the next one). Pastel first: the figure Jon makes most is a pastel one.
var LOOK_BASE={style:'cartoon',color:'chain',palette:'pastel',uniformColor:'#5e87c5',lighting:'soft',depth:0,border:'thin',bg:'white',projection:'perspective',perspective:50,pastel:0,surfaceOpacity:0.55,hsl:{h:0,s:100,l:100},ligColors:{}};
var PRESETS=[
  {grp:'Figures',id:'paper',n:'Pastel paper',d:'A soft pastel colour per chain, soft light, white, no perspective — the figure for a paper',sw:'linear-gradient(135deg,#9fc5e8 0 34%,#f4b6b2 0 68%,#b6d7a8 0)',
   s:{projection:'orthographic'}},
  {id:'structure',n:'By structure',d:'Helices, sheets and loops in soft colours',sw:'linear-gradient(135deg,#f4b6b2 0 34%,#f9cb9c 0 68%,#d9d9d9 0)',
   s:{color:'ss',pastel:55,projection:'orthographic'}},
  {id:'rainbow',n:'Pastel rainbow',d:'From the N to the C terminus in a soft rainbow',sw:'linear-gradient(90deg,#f4a6b4,#f9cb9c,#ffe599,#b6d7a8,#9fc5e8,#c9b8e0)',
   s:{color:'spectrum',pastel:62,projection:'orthographic'}},
  {id:'ternary',n:'Ternary complex',d:'A pastel colour per protein, the degrader in magenta with its pocket',sw:'linear-gradient(135deg,#9fc5e8 0 33%,#f4b6b2 0 66%,#e642c8 0)',
   s:{depth:25,perspective:40},
   after:function(){ var l=ligands[0]; if(l){ state.ligColors[l.key]='#e642c8'; state.pockets={}; state.pockets[l.key]=true; } }},
  {id:'mono',n:'Grey + accent',d:'A quiet grey protein, the ligand in colour — for a sober figure',sw:'linear-gradient(135deg,#d3d7e2 0 62%,#ffd400 0)',
   s:{color:'uniform',uniformColor:'#d3d7e2',projection:'orthographic'},
   after:function(){ var l=ligands[0]; if(l) state.ligColors[l.key]='yellowCarbon'; }},
  {grp:'Ligand and pocket',id:'site',n:'Binding site',d:'A pale protein, the ligand in yellow, the residues around it, close up',sw:'linear-gradient(135deg,#d3d7e2 0 55%,#ffd400 0)',
   s:{color:'uniform',uniformColor:'#d3d7e2',depth:40},
   after:function(){ var l=ligands[0]; if(l){ state.ligColors[l.key]='yellowCarbon'; state.pockets={}; state.pockets[l.key]=true; setTimeout(function(){ focusLigand(l); },60); } }},
  {grp:'Surfaces',id:'surface',n:'Pastel surface',d:'A nearly opaque pastel surface over the chains',sw:'radial-gradient(circle at 40% 40%,#f4d8d6,#9fc5e8)',
   s:{style:'surface',surfaceOpacity:0.85,projection:'orthographic'}},
  {id:'hydro',n:'Hydrophobic surface',d:'Greasy patches in warm tones, polar ones in cool, on the surface',sw:'linear-gradient(135deg,#f4c6a0,#ffffff 50%,#a8c8ec)',
   s:{style:'surface',color:'hydro',surfaceOpacity:0.92,pastel:20,projection:'orthographic'}},
  {grp:'Mood',id:'ink',n:'Ink and wash',d:'No light, a heavy outline: a drawing',sw:'linear-gradient(135deg,#fff 0 40%,#9fc5e8 0 70%,#1a1d2e 0)',
   s:{lighting:'flat',border:'thick',projection:'orthographic'}},
  {id:'night',n:'Pastel on dark',d:'Pastels on a dark background, a key light with deep shadows',sw:'linear-gradient(135deg,#13161e 0 40%,#9fc5e8 0 68%,#f4b6b2 0)',
   s:{lighting:'studio',bg:'dark',depth:35}},
  {id:'cover',n:'Cover',d:'Dark, vivid, deep shadows, a thick outline',sw:'linear-gradient(135deg,#13161e 0 45%,#e6194b 0 70%,#42d4f4 0)',
   s:{palette:'vivid',lighting:'studio',border:'thick',bg:'dark',depth:45,perspective:62}},
  {id:'confidence',n:'Confidence',d:'Coloured by pLDDT or B-factor, with the key',sw:'linear-gradient(90deg,#ff7d45,#ffdb13,#65cbf3,#0053d6)',
   s:{color:'conf'}}
];
var PRESET_ALIAS={clean:'paper',pocket:'site'};   // the names before 2026-10-12
// "Save my look": what a style sets, kept on this device and offered with the others.
var LOOK_KEYS=['style','color','uniformColor','lighting','depth','border','bg','projection','perspective','palette','pastel','hsl','surfaceOpacity'];
function looksGet(){ try{ var a=JSON.parse(load('ribbon_looks')||'[]'); return Array.isArray(a)?a.filter(function(x){ return x&&typeof x.n==='string'&&x.s&&typeof x.s==='object'; }):[]; }catch(e){ return []; } }
function lookSave(name){
  name=(name||'').trim().replace(/\s+/g,' ').slice(0,28); if(!name) return false;
  var s={}; LOOK_KEYS.forEach(function(k){ if(state[k]!==undefined) s[k]=_clone(state[k]); }); s.depth=rbDepth(); s.perspective=_persp()||50; s.projection=_persp()===0?'orthographic':'perspective';
  var a=looksGet().filter(function(x){ return x.n!==name; }); a.push({n:name,s:s}); store('ribbon_looks',JSON.stringify(a.slice(-12)));
  state.look='my:'+name; renderPresets(); return true;
}
function lookDelete(name){ store('ribbon_looks',JSON.stringify(looksGet().filter(function(x){ return x.n!==name; }))); if(state.look==='my:'+name) state.look=null; renderPresets(); }
function applyLook(patch,after){
  if(!currentModel) return;
  patch=Object.assign({},patch);   // the names before 2026-10-12: fog → depth, projection → perspective, simple/full → soft/studio
  if(patch.fog!==undefined&&patch.depth===undefined) patch.depth=patch.fog?55:0;
  delete patch.fog;
  if(patch.perspective!==undefined&&patch.projection===undefined) patch.projection=patch.perspective===0?'orthographic':'perspective';
  if(patch.lighting) patch.lighting=LIGHT_OLD[patch.lighting]||patch.lighting;
  if(patch.color&&patch.color!=='uniform') state.chainColors={};
  Object.keys(patch).forEach(function(k){ state[k]=typeof patch[k]==='object'&&patch[k]?_clone(patch[k]):patch[k]; });
  if(after) after();
  state.fog=rbDepth()>0; state.projection=_persp()===0?'orthographic':'perspective'; if(_persp()>0) state.perspective=_persp();
  syncControlsToState(); $('topColor').value=state.color;
  _noDraw(function(){   // one draw for the whole style, not one per step (see _noDraw)
    applyBackground(); applyProjection(); buildGeometry(); updateLegend(); renderChainList(); renderLigList(); updateSummaries(); if(SEQ.on) seqRender();
    if(!_userMoved) fitView({animate:true});
  });
  viewer.render();
}
function applyPreset(id){
  id=PRESET_ALIAS[id]||id;
  var my=/^my:/.test(id)?looksGet().filter(function(x){ return 'my:'+x.n===id; })[0]:null;
  var p=my?{id:id,s:my.s}:PRESETS.filter(function(x){ return x.id===id; })[0]; if(!p) return false;
  if(id==='confidence'&&!isAF()&&!(bRange[1]>bRange[0])) { showToast('This structure has no B-factors to colour by.'); return false; }
  if(state.look==='site'&&id!=='site') _userMoved=false;   // leaving the close-up of a site: the whole structure is framed again
  applyLook(Object.assign({},LOOK_BASE,p.s),p.after); state.look=id; renderPresets(); return true;
}
function renderPresets(){
  var g=$('presetGrid'); if(!g) return;
  var h='', btn=function(p,my){ return '<button type="button" class="preset'+(state.look===p.id?' on':'')+'" data-p="'+escapeHtml(p.id)+'" title="'+escapeHtml(p.d)+'" aria-pressed="'+(state.look===p.id)+'"><i style="background:'+p.sw+'"></i><b>'+escapeHtml(p.n)+'</b>'+(my?'<span class="preset-x" role="button" tabindex="0" title="Delete this look" aria-label="Delete '+escapeHtml(p.n)+'">×</span>':'')+'</button>'; };
  PRESETS.forEach(function(p){ if(p.grp) h+='<div class="preset-grp">'+escapeHtml(p.grp)+'</div>'; h+=btn(p,false); });
  var mine=looksGet();
  if(mine.length){ h+='<div class="preset-grp">My looks</div>'+mine.map(function(x){ return btn({id:'my:'+x.n,n:x.n,d:'A look you saved',sw:'linear-gradient(135deg,'+(/dark/.test(x.s.bg)?'#13161e':'#ffffff')+' 0 40%,'+(x.s.uniformColor||'#9fc5e8')+' 0)'},true); }).join(''); }
  g.innerHTML=h;
}
function syncLookControls(){
  _segSet('lightSeg',lightKey());
  var L=LIGHTING[lightKey()]; if($('lightHint')) $('lightHint').textContent=L.d;
  var d=rbDepth(); if($('depthR')){ $('depthR').value=d; $('depthV').textContent=d?d+'%':'Off';
    var needBg=d>0&&state.bg==='transparent'; $('depthHint').textContent=needBg?'Depth fades into the background, so it shows once the background is white or dark.':'What is further away fades into the background.'; $('depthBg').hidden=!needBg; }
  var pp=_persp(); if($('perspR')){ $('perspR').value=pp; $('perspV').textContent=pp===0?'None':pp<30?'Gentle':pp<70?'Natural':'Strong'; }
  if($('palSel')) $('palSel').value=state.palette||'ribbon';
  if($('valMapSel')) $('valMapSel').value=state.valMap||'consurf';
  if($('valMapFld')) $('valMapFld').hidden=!state.values;
  if($('scaleChk')) $('scaleChk').checked=!!state.scalebar;
  if($('sbOpts')){ var sbp=_persp()>0; $('sbOpts').hidden=!state.scalebar; _segSet('sbInk',state.scaleInk||'auto'); _segSet('sbCorner',state.scaleCorner||'br');
    $('sbHint').textContent=sbp?'In perspective the bar is exact only at the middle of the structure: nearer parts are drawn larger and further ones smaller.':'Exact everywhere: orthographic keeps parallel lines parallel.'; $('sbOrtho').hidden=!sbp; }
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
// ── The scale bar ───────────────────────────────────────────────────────────────────────────────────────────────
// One rule for the screen, the export and a film: the longest 1-2-5 length that fits in `frac` of the width, said in Å (in nm from
// 100 Å, with a thin space before the unit). It used to be chosen to be 50–150 *screen* pixels, so its printed size depended on the
// window and the crop, and drawn before the crop, so the crop took the corner it sat in as part of the structure.
var SB_LENS=[0.1,0.2,0.5,1,2,5,10,20,50,100,200,500,1000,2000,5000];
function scaleBarSpec(ppa,widthPx,frac){
  if(!(ppa>0)||!(widthPx>0)) return null;
  var max=(frac||0.22)*widthPx, L=SB_LENS[0], i;
  for(i=0;i<SB_LENS.length;i++) if(SB_LENS[i]*ppa<=max) L=SB_LENS[i];
  var big=L>=100, v=big?L/10:L;
  return {len:L,px:L*ppa,label:(Math.abs(v-Math.round(v))<1e-9?String(Math.round(v)):String(+v.toFixed(2)))+' '+(big?'nm':'Å')};
}
function scaleMeasure(){   // pixels per Å at the middle of the structure (exact there; in perspective nearer parts are larger)
  if(!viewer||!currentModel) return null;
  var pts=fitPoints(); if(!pts.length) return null;
  var c={x:0,y:0,z:0}; pts.forEach(function(p){ c.x+=p.x; c.y+=p.y; c.z+=p.z; }); c.x/=pts.length; c.y/=pts.length; c.z/=pts.length;
  var v; try{ v=viewer.getView(); }catch(e){ return null; }
  var R=_camRot(v), ax={x:R[0][0],y:R[0][1],z:R[0][2]};   // the camera's x axis, in model coordinates
  var a=viewer.modelToScreen(c), b=viewer.modelToScreen({x:c.x+ax.x*10,y:c.y+ax.y*10,z:c.z+ax.z*10});
  var ppa=Math.hypot(b.x-a.x,b.y-a.y)/10; if(!(ppa>0)) return null;
  return {ppa:ppa};
}
function _sbInk(bgKey){
  if(state.scaleInk==='black') return '#000000'; if(state.scaleInk==='white') return '#ffffff';
  var dark=bgKey==='dark'||(bgKey==='transparent'&&darkTone());   // the bar is drawn on the picture's background, not the page's
  return dark?'#e8eaf2':'#1a1d2e';
}
// On screen: an SVG, the label over the bar, a cap at each end, in the label font.
function drawScaleBar(){
  var el=$('scaleBar'); if(!el) return;
  var vp=$('viewport'), on=!!(state.scalebar&&currentModel)&&(!vp||vp.clientHeight>=110); el.hidden=!on; if(!on) return;   // still in the export; on screen only where it fits
  var m=scaleMeasure(), sp=m&&scaleBarSpec(m.ppa,vp.clientWidth,0.2); if(!sp){ el.hidden=true; return; }
  var ink=_sbInk(state.bg), w=Math.ceil(sp.px)+8, h=34, x1=(4+sp.px).toFixed(2);
  el.className='scale-bar'+(state.scaleCorner==='bl'?' bl':'');
  el.innerHTML='<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><text x="'+(w/2)+'" y="13" text-anchor="middle" fill="'+ink+'">'+sp.label+'</text>'
    +'<path class="sb-bar" d="M4 25H'+x1+'M4 20v10M'+x1+' 20v10" stroke="'+ink+'" stroke-width="2" fill="none"/></svg>';
  var t=el.querySelector('text'); t.style.font='600 13px '+_labelFontFamily();
}
// In the export, in a strip added under the figure after it has been cropped and brought to its width, so the bar never
// takes part in the crop and its size is set from the figure: a 7 pt label, a 0.9 pt line, at the export's dpi.
// ppa is the pixels per Å of THIS canvas.
function _withScaleBar(cv,bgKey,ppa,dpi){
  var sp=scaleBarSpec(ppa,cv.width,0.22); if(!sp) return cv;
  dpi=dpi||300; var pt=function(v){ return v*dpi/72; };
  var fs=Math.max(9,Math.round(pt(7))), lw=Math.max(2,Math.round(pt(0.9))), cap=Math.max(3,Math.round(pt(2.6))), pad=Math.round(pt(5)), gap=Math.round(pt(2));
  var stripH=pad+fs+gap+cap*2+pad;
  var out=document.createElement('canvas'); out.width=cv.width; out.height=cv.height+stripH;
  var x=out.getContext('2d');
  if(bgKey==='white'||bgKey==='jpeg-white'){ x.fillStyle='#fff'; x.fillRect(0,0,out.width,out.height); } else if(bgKey==='dark'){ x.fillStyle='#13161e'; x.fillRect(0,0,out.width,out.height); }
  x.drawImage(cv,0,0);
  var ink=_sbInk(bgKey), x0=state.scaleCorner==='bl'?pad*2:out.width-pad*2-sp.px, x1=x0+sp.px, yb=cv.height+pad+fs+gap+cap;
  x.strokeStyle=ink; x.lineWidth=lw; x.lineCap='butt'; x.beginPath();
  x.moveTo(x0,yb); x.lineTo(x1,yb); x.moveTo(x0,yb-cap); x.lineTo(x0,yb+cap); x.moveTo(x1,yb-cap); x.lineTo(x1,yb+cap); x.stroke();
  x.fillStyle=ink; x.font='600 '+fs+'px '+_labelFontFamily(); x.textAlign='center'; x.textBaseline='alphabetic'; x.fillText(sp.label,(x0+x1)/2,cv.height+pad+fs*0.82);
  window.__sbLast={ppa:ppa,len:sp.len,px:sp.px,label:sp.label,stripH:stripH,y:yb,x0:x0,x1:x1,dpi:dpi,fs:fs,lw:lw,ink:ink};   // what the last export drew, for the invariant
  return out;
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
  $('presetGrid').addEventListener('click',function(e){
    var x=e.target.closest('.preset-x'); if(x){ e.stopPropagation(); var pb=x.closest('.preset'); if(pb) lookDelete(pb.dataset.p.replace(/^my:/,'')); return; }
    var b=e.target.closest('.preset'); if(b) applyPreset(b.dataset.p); });
  $('lookSave').addEventListener('click',function(){ var i=$('lookName'), nm=i.value.trim()||('My look '+(looksGet().length+1)); if(lookSave(nm)){ i.value=''; showToast('Saved “'+nm+'”.'); } });
  $('lookName').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); $('lookSave').click(); } });
  segHandler('lightSeg','lighting',function(){ state.look=null; renderPresets(); applyBorder(); syncLookControls(); updateSummaries(); });
  $('depthR').addEventListener('input',function(e){ setDepth(+e.target.value); });
  $('depthBg').addEventListener('click',function(){ state.bg='white'; _segSet('bgSeg','white'); applyBackground(); if(selectedChain!==null) recolorStructure(); syncLookControls(); rbFogSync(); if(viewer) viewer.render(); });
  $('perspR').addEventListener('input',function(e){ setPerspective(+e.target.value); });
  $('palSel').innerHTML=Object.keys(PALETTES).map(function(k){ return '<option value="'+k+'">'+escapeHtml(PALETTES[k].n)+'</option>'; }).join('');
  $('palSel').addEventListener('change',function(e){ state.look=null; renderPresets(); state.palette=e.target.value; if(state.color!=='chain'){ state.color='chain'; $('topColor').value='chain'; } state.chainColors={}; updateColorOrOpacity(); renderChainList(); contrastCheck(); if(SEQ.on) seqRender(); });
  $('valMapSel').innerHTML=Object.keys(VAL_MAPS).map(function(k){ return '<option value="'+k+'">'+escapeHtml(VAL_MAPS[k].n)+'</option>'; }).join('');
  $('valMapSel').addEventListener('change',function(e){ state.valMap=e.target.value; recolorStructure(); updateLegend(); renderChainList(); });
  $('scaleChk').addEventListener('change',function(e){ state.scalebar=e.target.checked; syncLookControls(); decorUpdate(); updateSummaries(); });
  segHandler('sbInk','scaleInk',function(){ decorUpdate(); });
  segHandler('sbCorner','scaleCorner',function(){ decorUpdate(); });
  $('sbOrtho').addEventListener('click',function(){ setPerspective(0); });
  $('axesChk').checked=load('ribbon_axes')==='1';
  $('axesChk').addEventListener('change',function(e){ store('ribbon_axes',e.target.checked?'1':'0'); decorUpdate(); });
  $('veChips').addEventListener('click',function(e){ var b=e.target.closest('.ve-chip'); if(!b) return; $('pdbInput').value=b.dataset.q; handleSubmit(); });
  veChips();
  _selListeners.push(contrastCheck);
}
function lookOnViewer(){ try{ viewer.setViewChangeCallback(function(){ decorUpdate(); }); }catch(e){} }
RB_CMDS.push(
  {n:['lighting','light','lights'],d:'Flat, soft or studio light',f:'lighting flat · lighting soft · lighting studio',
   args:function(){ return Object.keys(LIGHTING).map(function(k){ return _cand(k,'word',LIGHTING[k].d); }); },
   run:function(a){ var l=a.trim().toLowerCase(); l=LIGHT_OLD[l]||l; if(!LIGHTING[l]) return _err('lighting flat · soft · studio'); state.lighting=l; state.look=null; _segSet('lightSeg',l); applyBorder(); syncLookControls(); renderPresets(); updateSummaries(); return _ok(LIGHTING[l].n+' light.'); }},
  {n:['depth','fog','depthcue'],d:'Fade what is further away, 0–100',f:'depth 60 · depth off',
   args:function(){ return [_cand('off','word','no fade'),_cand('40','word','a little'),_cand('70','word','a lot')]; },
   run:function(a){ var s=a.trim().toLowerCase(), v=/^(off|no|false|none)$/.test(s)?0:/^(on|yes|true)$/.test(s)?55:parseFloat(s); if(!isFinite(v)) return _err('depth 0–100, or depth off'); v=Math.max(0,Math.min(100,Math.round(v))); setDepth(v); return _ok(v?('Depth '+v+'%'+(state.bg==='transparent'?' — it shows once the background is white or dark.':'.')):'Depth off.'); }},
  {n:['pastel'],d:'Soften every colour, 0–100',f:'pastel 60 · pastel off',
   args:function(){ return [_cand('off','word','as chosen'),_cand('40','word','a little'),_cand('80','word','a lot')]; },
   run:function(a){ var s=a.trim().toLowerCase(), v=/^(off|no|none)$/.test(s)?0:/^(on|yes)$/.test(s)?60:parseFloat(s); if(!isFinite(v)) return _err('pastel 0–100, or pastel off'); v=Math.max(0,Math.min(100,Math.round(v))); setPastel(v); return _ok(v?'Pastel '+v+'%.':'Pastel off.'); }},
  {n:['preset','look','theme'],d:'A whole look in one go',f:'preset paper · preset ternary · preset cover',
   args:function(){ return PRESETS.map(function(p){ return _cand(p.id,'word',p.n+' — '+p.d); }).concat(looksGet().map(function(x){ return _cand(x.n,'word','A look you saved'); })); },
   run:function(a){ var n=needModel(); if(n) return n; var l=a.trim().toLowerCase(); l=PRESET_ALIAS[l]||l;
     var mine=looksGet().filter(function(x){ return x.n.toLowerCase()===l; })[0];
     var p=mine?{id:'my:'+mine.n,n:mine.n}:PRESETS.filter(function(x){ return x.id===l||x.n.toLowerCase()===l||x.n.toLowerCase().indexOf(l)===0; })[0];
     if(!p) return _err('preset '+PRESETS.map(function(x){ return x.id; }).join(' · ')); return applyPreset(p.id)?_ok(p.n+'.'):_err('Not for this structure.'); }},
  {n:['palette','colours','colors'],d:'The colours chains are given',f:'palette okabe · palette tol · palette pastel',
   args:function(){ return Object.keys(PALETTES).map(function(k){ return _cand(k,'word',PALETTES[k].n); }); },
   run:function(a){ var l=a.trim().toLowerCase(), k=Object.keys(PALETTES).filter(function(x){ return x===l||PALETTES[x].n.toLowerCase().indexOf(l)===0; })[0]; if(!k) return _err('palette '+Object.keys(PALETTES).join(' · ')); $('palSel').value=k; $('palSel').dispatchEvent(new Event('change')); return _ok(PALETTES[k].n+'.'); }},
  {n:['scalebar','scale'],d:'A scale bar in Å, in the export too; black, white or auto ink; left or right',f:'scalebar on · scalebar off · scalebar white · scalebar left',
   args:function(){ return ['on','off','auto','black','white','left','right'].map(function(w){ return _cand(w,'word',''); }); },
   run:function(a){ var w=a.trim().toLowerCase();
     if(/^(black|white|auto)$/.test(w)){ state.scaleInk=w; state.scalebar=true; } else if(/^(left|right)$/.test(w)){ state.scaleCorner=w==='left'?'bl':'br'; state.scalebar=true; } else state.scalebar=!/^(off|no|false|0)$/.test(w);
     syncLookControls(); decorUpdate(); updateSummaries(); return _ok('Scale bar '+(state.scalebar?'on.':'off.')); }},
  {n:['axes','axis'],d:'Show the x, y and z axes (screen only)',f:'axes on · axes off',
   args:function(){ return [_cand('on','word',''),_cand('off','word','')]; },
   run:function(a){ var on=!/^(off|no|false|0)$/i.test(a.trim()); store('ribbon_axes',on?'1':'0'); $('axesChk').checked=on; decorUpdate(); return _ok('Axes '+(on?'on.':'off.')); }}
);
