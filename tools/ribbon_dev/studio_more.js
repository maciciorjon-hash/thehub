// ── Undo and redo ───────────────────────────────────────────────────────────────────────────
// Everything a design keeps is one snapshot; a change is recorded when things settle (a slider dragged is one step, not fifty).
// The camera is not in it — turning the structure is not an edit — and neither is the second structure, which is a file.
var _undo={stack:[],redo:[],last:null,t:0,busy:false};
function undoSnap(){ if(!currentModel) return null; var st=collectDesign().state; delete st.overlay; return JSON.stringify(st); }
function undoReset(){ _undo.stack=[]; _undo.redo=[]; _undo.last=null; clearTimeout(_undo.t); setTimeout(function(){ _undo.last=undoSnap(); undoButtons(); },0); }
function undoNote(){ if(_undo.busy||!currentModel) return; clearTimeout(_undo.t); _undo.t=setTimeout(undoFlush,320); }
function undoFlush(){
  clearTimeout(_undo.t); if(_undo.busy||!currentModel) return;
  var cur=undoSnap(); if(cur==null) return;
  if(_undo.last==null){ _undo.last=cur; return; }
  if(cur!==_undo.last){ _undo.stack.push(_undo.last); if(_undo.stack.length>80) _undo.stack.shift(); _undo.redo=[]; _undo.last=cur; }
  undoButtons();
}
function undoApply(snap){
  _undo.busy=true;
  try{
    var view=null; try{ view=viewer.getView(); }catch(e){}
    var ov=state.overlay;
    _pendingDesign=Object.assign({_pdb:(currentPdbId||'').toUpperCase()},JSON.parse(snap));
    applyPendingDesign(); state.overlay=ov; _if=null; if(typeof analyseReset==='function'){ _inter=null; _lys=null; }
    syncControlsToState(); $('topColor').value=state.color;
    applyBackground(); applyProjection(); buildGeometry(); updateAll(); renderLabelTags(); if(SEQ.on) seqRender();
    if(view){ try{ viewer.setView(view); viewer.render(); }catch(e){} }
  } finally { _undo.busy=false; }
  _undo.last=snap; undoButtons();
}
function undo(){ undoFlush(); if(!_undo.stack.length){ showToast('Nothing to undo.'); return false; } _undo.redo.push(_undo.last); undoApply(_undo.stack.pop()); showToast('Undone.'); return true; }
function redo(){ undoFlush(); if(!_undo.redo.length){ showToast('Nothing to redo.'); return false; } _undo.stack.push(_undo.last); undoApply(_undo.redo.pop()); showToast('Redone.'); return true; }
function undoButtons(){ var u=$('undoBtn'), r=$('redoBtn'); if(u) u.disabled=!_undo.stack.length; if(r) r.disabled=!_undo.redo.length; }

// ── What a click on the structure does ──────────────────────────────────────────────────────
// One mode at a time, shown in the toolbar: pick a chain (colour and label it), select residues, measure, or label residues.
// In Select, Shift adds, and Alt-drag (or Shift-drag) draws a box; a plain drag still turns the structure.
var _mouseMode='pick', _selMode=false;
function setMouseMode(m){
  if(['pick','select','measure','label'].indexOf(m)<0) m='pick';
  if(m!=='measure'&&_measMode) toggleMeasure(false);
  if(m!=='label'&&_resLabelMode) toggleResLabelMode(false);
  _selMode=m==='select';
  if(m==='measure'&&!_measMode) toggleMeasure(true);
  if(m==='label'&&!_resLabelMode) toggleResLabelMode(true);
  _mouseMode=m; modeButtons();
  var hint=$('chainHint');
  if(_selMode){ hint.textContent='Select: click a residue · Shift-click adds · Shift-drag draws a box · Esc to stop'; hint.classList.add('show'); $('viewport').style.cursor='cell'; }
  else if(m==='pick'){ if(!_measMode&&!_resLabelMode){ hint.classList.remove('show'); $('viewport').style.cursor=''; } }
}
function modeButtons(){   // the two old toggles (T, M) keep working, and the group follows them
  var m=_measMode?'measure':_resLabelMode?'label':_selMode?'select':'pick'; _mouseMode=m;
  [['pickBtn','pick'],['selBtn','select'],['measBtn','measure'],['resTagBtn','label']].forEach(function(x){ var b=$(x[0]); if(!b) return; var on=x[1]===m; b.classList.toggle('tb-active',on); b.setAttribute('aria-pressed',on?'true':'false'); });
}
function boxSelectWire(){
  var vp=$('viewport'), band=null, start=null;
  vp.addEventListener('pointerdown',function(e){
    if(!_selMode||!(e.shiftKey||e.altKey)||e.button!==0||!currentModel) return;
    e.preventDefault(); e.stopPropagation();
    var r=vp.getBoundingClientRect(); start={x:e.clientX,y:e.clientY,add:e.shiftKey&&e.altKey||e.shiftKey};
    band=document.createElement('div'); band.className='sel-band'; vp.appendChild(band); band.style.left=(e.clientX-r.left)+'px'; band.style.top=(e.clientY-r.top)+'px';
    try{ vp.setPointerCapture(e.pointerId); }catch(x){}
  },true);
  vp.addEventListener('pointermove',function(e){ if(!band) return; e.stopPropagation(); var r=vp.getBoundingClientRect(), x0=Math.min(start.x,e.clientX)-r.left, y0=Math.min(start.y,e.clientY)-r.top;
    band.style.left=x0+'px'; band.style.top=y0+'px'; band.style.width=Math.abs(e.clientX-start.x)+'px'; band.style.height=Math.abs(e.clientY-start.y)+'px'; },true);
  vp.addEventListener('pointerup',function(e){
    if(!band) return; e.stopPropagation();
    var x0=Math.min(start.x,e.clientX), x1=Math.max(start.x,e.clientX), y0=Math.min(start.y,e.clientY), y1=Math.max(start.y,e.clientY), keys={};
    band.remove(); band=null;
    if(x1-x0<4&&y1-y0<4) return;
    currentModel.selectedAtoms({}).forEach(function(a){
      if(state.hiddenChains[a.chain||'']||WATER_RESN.indexOf(a.resn)>=0) return;
      if(!(a.atom==='CA'||a.atom==='P'||_isLigAtom(a))) return;
      var p; try{ p=viewer.modelToScreen({x:a.x,y:a.y,z:a.z}); }catch(x){ return; }
      if(p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1) keys[rKeyOf(a)]=1;
    });
    selSet(Object.keys(keys),start.add&&_selN?'add':'replace');
    showToast(Object.keys(keys).length+' residues in the box.');
  },true);
}

// ── Views: camera positions to come back to ─────────────────────────────────────────────────
// A view is the camera only. They are kept with a design, and used by the animation and the multi-panel figure.
function viewsList(){ return state.views||(state.views=[]); }
function viewAdd(name){
  if(!viewer) return null; var v; try{ v=viewer.getView(); }catch(e){ return null; }
  var L=viewsList(), nm=(name||'').trim()||('View '+(L.length+1)), vp=$('viewport');
  var row={id:'v'+Date.now().toString(36),name:nm,view:v,vp:[vp.clientWidth,vp.clientHeight]};
  var t=null; try{ var cv=vp.querySelector('canvas'), c=document.createElement('canvas'); c.width=96; c.height=64; var x=c.getContext('2d'); x.fillStyle=darkTone()?'#13161e':'#ffffff'; x.fillRect(0,0,96,64); var k=Math.min(96/cv.width,64/cv.height); x.drawImage(cv,(96-cv.width*k)/2,(64-cv.height*k)/2,cv.width*k,cv.height*k); t=c.toDataURL('image/jpeg',0.6); }catch(e){}
  row.thumb=t; L.push(row); renderViews(); undoNote(); return row;
}
function viewGo(id,ms){
  var r=viewsList().filter(function(x){ return x.id===id||x.name.toLowerCase()===String(id).toLowerCase(); })[0]; if(!r||!viewer) return false;
  _userMoved=true;
  if(reducedMotion()||ms===0){ viewer.setView(r.view); viewer.render(); if(!sameShape(r.vp)) ensureInView(); }
  else animateTo(r.view,ms||700);
  return true;
}
function renderViews(){
  var el=$('viewList'); if(!el) return; var L=viewsList();
  if(!L.length){ el.innerHTML='<div class="empty-note">No views yet. Turn the structure to an angle you like, then Add view.</div>'; return; }
  el.innerHTML=L.map(function(r,i){ return '<div class="vw"><button type="button" class="vw-go" data-i="'+i+'" title="Go to this view"><span class="vw-th"'+(r.thumb&&/^data:image\/jpeg;base64,/.test(r.thumb)?' style="background-image:url('+r.thumb+')"':'')+'></span><span class="vw-n">'+escapeHtml(r.name)+'</span></button><button type="button" class="ibtn danger vw-del" data-i="'+i+'" aria-label="Delete view '+escapeHtml(r.name)+'" title="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button></div>'; }).join('');
  el.querySelectorAll('.vw-go').forEach(function(b){ b.addEventListener('click',function(){ viewGo(L[+b.dataset.i].id); }); });
  el.querySelectorAll('.vw-del').forEach(function(b){ b.addEventListener('click',function(){ L.splice(+b.dataset.i,1); renderViews(); undoNote(); }); });
}

// ── Animation: turn, rock, or travel through the views — as a video or a GIF ─────────────────
// The canvas is recorded as it is drawn (MediaRecorder: WebM in Chrome, MP4 in Safari); a GIF is made frame by frame here.
var _anim={on:false};
function animFrames(kind,secs,fps){   // the views, in order, that make the film
  var v0=viewer.getView(), N=Math.max(2,Math.round(secs*fps)), out=[], i;
  function rotY(v,deg){ var a=deg*Math.PI/180, q=[0,Math.sin(a/2),0,Math.cos(a/2)], p=v.slice(4); // q ⊗ p
    var r=[q[3]*p[0]+q[0]*p[3]+q[1]*p[2]-q[2]*p[1],q[3]*p[1]-q[0]*p[2]+q[1]*p[3]+q[2]*p[0],q[3]*p[2]+q[0]*p[1]-q[1]*p[0]+q[2]*p[3],q[3]*p[3]-q[0]*p[0]-q[1]*p[1]-q[2]*p[2]];
    return v.slice(0,4).concat(r); }
  if(kind==='turn') for(i=0;i<N;i++) out.push(rotY(v0,360*i/N));
  else if(kind==='rock') for(i=0;i<N;i++) out.push(rotY(v0,25*Math.sin(2*Math.PI*i/N)));
  else {   // the views, eased from one to the next, holding a moment on each
    var V=viewsList().map(function(r){ return r.view; }); if(V.length<2) return null;
    var per=Math.max(2,Math.floor(N/(V.length-1)));
    for(var k=0;k<V.length-1;k++) for(i=0;i<per;i++){ var t=i/per, e=t<0.15?0:t>0.85?1:(t-0.15)/0.7; e=e*e*(3-2*e); var a=V[k], b=V[k+1], v=[]; for(var j=0;j<4;j++) v.push(a[j]+(b[j]-a[j])*e); out.push(v.concat(_slerp(a.slice(4),b.slice(4),e))); }
    out.push(V[V.length-1]);
  }
  return out;
}
function _animStatus(t){ var e=$('animStatus'); if(e) e.textContent=t||''; }
function animStop(){ _anim.abort=true; }
function animRun(){
  if(!currentModel||!viewer||_anim.on) return;
  var kind=$('animKind').value, fmt=$('animFmt').value, secs=Math.max(1,Math.min(30,parseFloat($('animSecs').value)||6)), fps=fmt==='gif'?15:30;
  var frames=animFrames(kind,secs,fps); if(!frames){ showToast('Add at least two views for a fly-through.'); return; }
  var cv=$('viewport').querySelector('canvas'), v0=viewer.getView(), wasSpin=_spinning; if(wasSpin) toggleSpin();
  _anim={on:true,abort:false}; $('animGo').hidden=true; $('animStop').hidden=false;
  var selWas=rbExportBegin();
  function done(msg){ _anim.on=false; $('animGo').hidden=false; $('animStop').hidden=true; rbExportEnd(selWas); try{ viewer.setView(v0); viewer.render(); }catch(e){} if(wasSpin) toggleSpin(); _animStatus(msg); }
  var name=(currentPdbId||'structure').replace(/[\\/:*?"<>|\s]+/g,'_')+'_'+kind;
  if(fmt==='gif'){
    var W=cv.width, H=cv.height, sc=Math.min(1,480/Math.max(W,H)), w=Math.round(W*sc), h=Math.round(H*sc), gifF=[], i=0, off=document.createElement('canvas'); off.width=w; off.height=h; var ox=off.getContext('2d',{willReadFrequently:true});
    (function step(){
      if(_anim.abort){ done('Stopped.'); return; }
      if(i>=frames.length){ _animStatus('Encoding the GIF…'); setTimeout(function(){ var bytes=gifEncode(gifF,w,h,Math.round(100/fps)); _saveBlob(new Blob([bytes],{type:'image/gif'}),name+'.gif'); done('Saved a GIF: '+frames.length+' frames, '+(bytes.length/1e6).toFixed(1)+' MB.'); },20); return; }
      viewer.setView(frames[i]); viewer.render();
      ox.fillStyle=state.bg==='dark'?'#13161e':'#ffffff'; ox.fillRect(0,0,w,h); ox.drawImage(cv,0,0,w,h); gifF.push(ox.getImageData(0,0,w,h).data);
      i++; _animStatus('Frame '+i+' of '+frames.length); requestAnimationFrame(step);
    })();
    return;
  }
  if(!cv.captureStream||!window.MediaRecorder){ done('This browser cannot record video. Choose GIF.'); return; }
  var mime=['video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm'].filter(function(m){ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } })[0];
  if(!mime){ done('This browser cannot record video. Choose GIF.'); return; }
  var stream=cv.captureStream(fps), rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8e6}), chunks=[], k=0, t0=performance.now();
  rec.ondataavailable=function(e){ if(e.data&&e.data.size) chunks.push(e.data); };
  rec.onstop=function(){ if(_anim.abort&&!chunks.length){ done('Stopped.'); return; } var ext=/mp4/.test(mime)?'mp4':'webm'; var blob=new Blob(chunks,{type:mime.split(';')[0]}); _saveBlob(blob,name+'.'+ext); done('Saved a '+ext.toUpperCase()+' video: '+secs+' s.'); };
  rec.start();
  (function tick(){
    if(_anim.abort){ rec.stop(); return; }
    var want=Math.floor((performance.now()-t0)/1000*fps);
    if(want>=frames.length){ setTimeout(function(){ rec.stop(); },120); return; }
    if(want!==k){ k=want; viewer.setView(frames[k]); viewer.render(); _animStatus('Recording · '+Math.round(k/fps*10)/10+' / '+secs+' s'); }
    requestAnimationFrame(tick);
  })();
}
// A small GIF89a encoder: a 6×7×6 colour cube, LZW, one frame after another. Enough for a turning protein on a flat background.
function gifEncode(frames,w,h,delay){
  var out=[], push=function(){ for(var i=0;i<arguments.length;i++) out.push(arguments[i]); }, u16=function(v){ push(v&255,(v>>8)&255); };
  'GIF89a'.split('').forEach(function(c){ push(c.charCodeAt(0)); }); u16(w); u16(h); push(0xF7,0,0);   // global table of 256
  for(var r=0;r<6;r++) for(var g=0;g<7;g++) for(var b=0;b<6;b++) push(Math.round(r*255/5),Math.round(g*255/6),Math.round(b*255/5));
  for(var p=252;p<256;p++) push(0,0,0);
  push(0x21,0xFF,11); 'NETSCAPE2.0'.split('').forEach(function(c){ push(c.charCodeAt(0)); }); push(3,1,0,0,0);   // loop for ever
  frames.forEach(function(px){
    push(0x21,0xF9,4,0,delay&255,(delay>>8)&255,0,0);
    push(0x2C); u16(0); u16(0); u16(w); u16(h); push(0);
    var idx=new Uint8Array(w*h);
    for(var i=0,j=0;i<idx.length;i++,j+=4){ idx[i]=Math.round(px[j]/51)*42+Math.round(px[j+1]/42.5)*6+Math.round(px[j+2]/51); }
    var minCode=8; push(minCode); var bytes=lzw(idx,minCode), k=0;
    while(k<bytes.length){ var n=Math.min(255,bytes.length-k); push(n); for(var q=0;q<n;q++) push(bytes[k+q]); k+=n; }
    push(0);
  });
  push(0x3B); return new Uint8Array(out);
}
function lzw(data,minCode){
  var clear=1<<minCode, eoi=clear+1, size=minCode+1, next=eoi+1, dict=new Map(), out=[], cur=0, bits=0;
  function emit(c){ cur|=c<<bits; bits+=size; while(bits>=8){ out.push(cur&255); cur>>=8; bits-=8; } }
  emit(clear); var w=data[0];
  for(var i=1;i<data.length;i++){ var k=data[i], key=w*4096+k, got=dict.get(key);
    if(got!==undefined){ w=got; continue; }
    emit(w); if(next<4096){ dict.set(key,next++); if(next>(1<<size)&&size<12) size++; } else { emit(clear); dict.clear(); size=minCode+1; next=eoi+1; }
    w=k; }
  emit(w); emit(eoi); if(bits>0) out.push(cur&255); return out;
}

// ── Figure sizes: the export at the size a journal asks for ─────────────────────────────────
// Width in mm at 300 or 600 dpi; the height follows the viewer's shape. Common column widths are presets.
var FIG_SIZES=[{id:'free',n:'As on screen'},{id:'1col',n:'One column · 85 mm',mm:85},{id:'15col',n:'One and a half columns · 120 mm',mm:120},{id:'2col',n:'Two columns · 175 mm',mm:175},{id:'slide',n:'Slide · 1920 px wide',px:1920}];
function figTargetWidthPx(dpi){ var f=FIG_SIZES.filter(function(x){ return x.id===state.figSize; })[0]; if(!f||f.id==='free') return null; return f.px||Math.round(f.mm/25.4*(dpi||300)); }

function moreWire(){
  $('undoBtn').addEventListener('click',undo); $('redoBtn').addEventListener('click',redo);
  $('pickBtn').addEventListener('click',function(){ setMouseMode('pick'); });
  $('selBtn').addEventListener('click',function(){ setMouseMode(_selMode?'pick':'select'); });
  boxSelectWire();
  $('viewAdd').addEventListener('click',function(){ var r=viewAdd($('viewName').value); $('viewName').value=''; if(r) showToast('Saved “'+r.name+'”.'); });
  $('viewName').addEventListener('keydown',function(e){ if(e.key==='Enter') $('viewAdd').click(); });
  $('animGo').addEventListener('click',animRun); $('animStop').addEventListener('click',animStop);
  $('figSize').innerHTML=FIG_SIZES.map(function(f){ return '<option value="'+f.id+'">'+escapeHtml(f.n)+'</option>'; }).join('');
  $('figSize').addEventListener('change',function(e){ state.figSize=e.target.value; if(typeof updateExDim==='function') updateExDim(); });
  renderViews(); undoButtons();
}
DESIGN_KEYS.push('views','figSize');
RB_CMDS.push(
  {n:['undo','u'],d:'Take back the last change (⌘Z)',f:'undo',run:function(){ return undo()?_ok('Undone.'):_err('Nothing to undo.'); }},
  {n:['redo'],d:'Put it back (⌘⇧Z)',f:'redo',run:function(){ return redo()?_ok('Redone.'):_err('Nothing to redo.'); }},
  {n:['mode','mouse'],d:'What a click does: pick a chain, select, measure or label',f:'mode select · mode pick',
   args:function(){ return ['pick','select','measure','label'].map(function(x){ return _cand(x,'word',''); }); },
   run:function(a){ var m=a.trim().toLowerCase(); if(['pick','select','measure','label'].indexOf(m)<0) return _err('mode pick · select · measure · label'); setMouseMode(m); return _ok('A click now '+({pick:'picks a chain',select:'selects a residue',measure:'measures',label:'labels a residue'})[m]+'.'); }},
  {n:['view','views','camera','saveview'],d:'Save the camera as a view, or go back to one',f:'view add top · view top · view list',
   args:function(pos){ return pos===0?[_cand('add','word','save the camera now')].concat(viewsList().map(function(r){ return _cand(r.name,'word','go there'); })):[]; },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim(), m=/^(add|save|new)\b\s*(.*)$/i.exec(w);
     if(m){ var r=viewAdd(m[2]); return r?_ok('Saved the view “'+r.name+'”.'):_err('The viewer is not ready.'); }
     if(!w||/^list$/i.test(w)) return viewsList().length?_ok(viewsList().map(function(r){ return r.name; }).join(' · ')):_err('No views yet: view add <name>');
     return viewGo(w)?_ok('Gone to “'+w+'”.'):_err('No view called “'+w+'”.'); }},
  {n:['movie','animate','record','gif','video'],d:'Record the structure turning, rocking or travelling through the views',f:'movie turn · movie rock gif · movie views',
   args:function(pos){ return pos===0?['turn','rock','views'].map(function(x){ return _cand(x,'word',''); }):['video','gif'].map(function(x){ return _cand(x,'word',''); }); },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().toLowerCase().split(/\s+/); if(w[0]&&['turn','rock','views'].indexOf(w[0])>=0) $('animKind').value=w[0]; if(w.indexOf('gif')>=0) $('animFmt').value='gif'; else if(w.indexOf('video')>=0) $('animFmt').value='video'; rbOpenSec('anim'); animRun(); return _ok('Recording…'); }}
);
