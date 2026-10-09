// ── Analyse: interactions, reachable lysines, clashes, surface colours, pockets, AlphaFold's PAE ──
// Geometry only, from the coordinates in the file. Each result says how it was found, and where it cannot know something
// (a ligand's charges, which lysine an E2 will reach) it says that instead of guessing.
function heavy(atoms){ return atoms.filter(function(a){ var e=(a.elem||'C').toUpperCase(); return e!=='H'&&e!=='D'; }); }
function _d(a,b){ var dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z; return Math.sqrt(dx*dx+dy*dy+dz*dz); }
function _v(a,b){ return [b.x-a.x,b.y-a.y,b.z-a.z]; }
function _cross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function _dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function _norm(a){ var n=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/n,a[1]/n,a[2]/n]; }
function _atomsByIndex(){ var m={}; currentModel.selectedAtoms({}).forEach(function(a){ m[a.index]=a; }); return m; }
// Rings: by name in protein side chains; by the bond graph in a ligand (5- and 6-membered and flat, so aromatic in practice).
var PROT_RINGS={PHE:[['CG','CD1','CD2','CE1','CE2','CZ']],TYR:[['CG','CD1','CD2','CE1','CE2','CZ']],HIS:[['CG','ND1','CD2','CE1','NE2']],
  TRP:[['CD2','CE2','CE3','CZ2','CZ3','CH2'],['CG','CD1','NE1','CE2','CD2']]};
function ringOf(atoms){
  var c={x:0,y:0,z:0}; atoms.forEach(function(a){ c.x+=a.x; c.y+=a.y; c.z+=a.z; }); c.x/=atoms.length; c.y/=atoms.length; c.z/=atoms.length;
  var n=[0,0,0]; for(var i=0;i<atoms.length;i++){ var a=atoms[i], b=atoms[(i+1)%atoms.length]; n[0]+=(a.y-b.y)*(a.z+b.z); n[1]+=(a.z-b.z)*(a.x+b.x); n[2]+=(a.x-b.x)*(a.y+b.y); }   // Newell
  n=_norm(n); var dev=0; atoms.forEach(function(a){ dev=Math.max(dev,Math.abs(_dot(_v(c,a),n))); });
  return {c:c,n:n,flat:dev<0.3,atoms:atoms};
}
function proteinRings(atoms){
  var byRes={}, out=[];
  atoms.forEach(function(a){ if(PROT_RINGS[a.resn]&&!a.hetflag){ var k=rKeyOf(a); (byRes[k]||(byRes[k]={})); byRes[k][a.atom]=a; } });
  Object.keys(byRes).forEach(function(k){ var m=byRes[k], any=null; Object.keys(m).some(function(x){ any=m[x]; return true; });
    PROT_RINGS[any.resn].forEach(function(names){ var A=names.map(function(n){ return m[n]; }); if(A.every(Boolean)){ var r=ringOf(A); r.res=any; out.push(r); } }); });
  return out;
}
function ligandRings(atoms){
  var idx=_atomsByIndex(), set={}, out=[], seen={};
  atoms.forEach(function(a){ set[a.index]=a; });
  atoms.forEach(function(a){
    // the shortest cycle back to a through its neighbours, up to six atoms
    var q=[[a.index]], found=null;
    while(q.length&&!found){
      var p=q.shift(); if(p.length>6) break;
      var last=idx[p[p.length-1]]; (last.bonds||[]).forEach(function(j){
        if(found||!set[j]) return;
        if(j===a.index&&p.length>=5){ found=p; return; }
        if(p.indexOf(j)<0&&p.length<6) q.push(p.concat([j]));
      });
    }
    if(!found) return;
    var key=found.slice().sort(function(x,y){ return x-y; }).join(); if(seen[key]) return; seen[key]=1;
    var A=found.map(function(j){ return idx[j]; }); if(!A.every(function(x){ return /^(C|N|O|S)$/i.test(x.elem||'C'); })) return;
    var r=ringOf(A); if(r.flat){ r.res=a; out.push(r); }
  });
  return out;
}
var HYDRO_C={ALA:['CB'],VAL:['CB','CG1','CG2'],LEU:['CB','CG','CD1','CD2'],ILE:['CB','CG1','CG2','CD1'],MET:['CB','CG','SD','CE'],PHE:['CB','CG','CD1','CD2','CE1','CE2','CZ'],
  TRP:['CB','CG','CD2','CE3','CZ2','CZ3','CH2'],PRO:['CB','CG','CD'],TYR:['CB','CG','CD1','CD2','CE1','CE2'],CYS:['SG'],LYS:['CB','CG','CD'],ARG:['CB','CG'],THR:['CG2']};
var POS_ATOMS={LYS:['NZ'],ARG:['NH1','NH2','NE'],HIS:['ND1','NE2']}, NEG_ATOMS={ASP:['OD1','OD2'],GLU:['OE1','OE2']};
var INTER_TYPES={hbond:{n:'Hydrogen bonds',c:'#3e63dd',w:0.07},salt:{n:'Salt bridges',c:'#d6409f',w:0.08},hydro:{n:'Hydrophobic contacts',c:'#8b8d98',w:0.05},
  pi:{n:'π-stacking',c:'#30a46c',w:0.08},cation:{n:'Cation–π',c:'#e5484d',w:0.08},halogen:{n:'Halogen bonds',c:'#12a594',w:0.07},metal:{n:'Metal contacts',c:'#8e4ec6',w:0.08}};
function _isLigAtom(a){ return ligands.some(function(l){ return l.resn===a.resn&&l.chain===(a.chain||'')&&l.resi===a.resi; }); }
function _carbonOnlyC(a,idx){ return (a.elem||'C').toUpperCase()==='C'&&(a.bonds||[]).every(function(j){ var b=idx[j]; return !b||/^(C|H)$/i.test(b.elem||'C'); }); }
// src, tgt: atom lists. srcLig: src is a ligand (no charges known)
function interactions(src,tgt,srcLig){
  var out=[], idx=_atomsByIndex(), S=heavy(src), T=heavy(tgt), g=gridOf(T,6.5), add=function(type,a,b,d,pa,pb,extra){ out.push(Object.assign({type:type,a:a,b:b,d:d,pa:pa||{x:a.x,y:a.y,z:a.z},pb:pb||{x:b.x,y:b.y,z:b.z}},extra||{})); };
  var hydroBest={};
  S.forEach(function(a){
    var ea=(a.elem||'C').toUpperCase();
    gridNear(g,6.5,a.x,a.y,a.z,function(j){
      var b=T[j]; if(rKeyOf(a)===rKeyOf(b)&&(a.chain||'')===(b.chain||'')) return;
      var eb=(b.elem||'C').toUpperCase(), d=_d(a,b);
      if(d>4.5) return;
      if(/^[NO]$/.test(ea)&&/^[NO]$/.test(eb)&&d>=2.5&&d<=3.5) add('hbond',a,b,d);
      if(/^(F|CL|BR|I)$/.test(ea)&&/^[NOS]$/.test(eb)&&d<=3.5) add('halogen',a,b,d);
      if(!srcLig&&d<=4.0){ var pa=(POS_ATOMS[a.resn]||[]).indexOf(a.atom)>=0, na=(NEG_ATOMS[a.resn]||[]).indexOf(a.atom)>=0, pb=(POS_ATOMS[b.resn]||[]).indexOf(b.atom)>=0, nb=(NEG_ATOMS[b.resn]||[]).indexOf(b.atom)>=0;
        if((pa&&nb)||(na&&pb)) add('salt',a,b,d); }
      if(d<=4.0&&eb==='C'&&(HYDRO_C[b.resn]||[]).indexOf(b.atom)>=0&&(srcLig?_carbonOnlyC(a,idx):(HYDRO_C[a.resn]||[]).indexOf(a.atom)>=0)){
        var k=rKeyOf(a)+'>'+rKeyOf(b); if(!hydroBest[k]||d<hydroBest[k].d) hydroBest[k]={a:a,b:b,d:d};
      }
    });
  });
  Object.keys(hydroBest).forEach(function(k){ var h=hydroBest[k]; add('hydro',h.a,h.b,h.d); });
  // drop a hydrogen bond already counted as a salt bridge
  var saltK={}; out.forEach(function(x){ if(x.type==='salt') saltK[x.a.index+'-'+x.b.index]=1; });
  out=out.filter(function(x){ return !(x.type==='hbond'&&saltK[x.a.index+'-'+x.b.index]); });
  // rings
  var RS=srcLig?ligandRings(S):proteinRings(S), RT=proteinRings(T);
  RS.forEach(function(r){ RT.forEach(function(t){
    var d=_d(r.c,t.c); if(d>6.5) return;
    var ang=Math.acos(Math.min(1,Math.abs(_dot(r.n,t.n))))*180/Math.PI;
    var off=Math.sqrt(Math.max(0,d*d-Math.pow(_dot(_v(r.c,t.c),r.n),2)));
    if((d<=5.5&&ang<30&&off<=2.0)||(d<=6.5&&ang>=60&&off<=2.0)) add('pi',r.res,t.res,d,r.c,t.c,{shape:ang<30?'parallel':'T-shaped'});
  }); });
  // cation–π: a protein cation over a ring
  var cations=T.filter(function(b){ return (b.resn==='LYS'&&b.atom==='NZ')||(b.resn==='ARG'&&b.atom==='CZ'); });
  RS.forEach(function(r){ cations.forEach(function(b){ var d=_d(r.c,b); if(d>6.0) return; var off=Math.sqrt(Math.max(0,d*d-Math.pow(_dot(_v(r.c,b),r.n),2))); if(off<=2.0) add('cation',r.res,b,d,r.c,{x:b.x,y:b.y,z:b.z}); }); });
  if(!srcLig){ var cS=S.filter(function(b){ return (b.resn==='LYS'&&b.atom==='NZ')||(b.resn==='ARG'&&b.atom==='CZ'); }); RT.forEach(function(r){ cS.forEach(function(b){ var d=_d(r.c,b); if(d>6.0) return; var off=Math.sqrt(Math.max(0,d*d-Math.pow(_dot(_v(r.c,b),r.n),2))); if(off<=2.0) add('cation',b,r.res,d,{x:b.x,y:b.y,z:b.z},r.c); }); }); }
  // metals coordinating the ligand
  if(srcLig){ var ions=currentModel.selectedAtoms({}).filter(function(x){ return x.hetflag&&ionResn.indexOf(x.resn)>=0; });
    S.forEach(function(a){ if(!/^[NOS]$/i.test(a.elem||'')) return; ions.forEach(function(m){ var d=_d(a,m); if(d<=2.8) add('metal',a,m,d); }); }); }
  return out.sort(function(x,y){ return Object.keys(INTER_TYPES).indexOf(x.type)-Object.keys(INTER_TYPES).indexOf(y.type)||x.d-y.d; });
}
function _setAtoms(spec){   // 'lig:<key>' · 'chain:A' · 'sel' · 'protein'
  if(!currentModel) return [];
  if(spec==='sel') return currentModel.selectedAtoms({}).filter(function(a){ return _sel[rKeyOf(a)]; });
  if(spec==='protein') return currentModel.selectedAtoms({}).filter(function(a){ return !a.hetflag&&!state.hiddenChains[a.chain||'']; });
  var m=/^(lig|chain):(.*)$/.exec(spec||''); if(!m) return [];
  if(m[1]==='lig'){ var l=ligands.filter(function(x){ return x.key===m[2]; })[0]; return l?currentModel.selectedAtoms(ligSel(l)):[]; }
  return currentModel.selectedAtoms({chain:m[2]}).filter(function(a){ return !a.hetflag||!_isLigAtom(a)&&ionResn.indexOf(a.resn)<0&&WATER_RESN.indexOf(a.resn)<0; });
}
function _setName(spec){
  if(spec==='sel') return 'the selection'; if(spec==='protein') return 'the protein';
  var m=/^(lig|chain):(.*)$/.exec(spec||''); if(!m) return '';
  if(m[1]==='lig'){ var l=ligands.filter(function(x){ return x.key===m[2]; })[0]; return l?l.resn+' ('+chainTitle(l.chain).replace('Chain ','')+' '+l.resi+')':'?'; }
  return chainTitle(m[2]);
}
var _inter=null, _interShapes=[];
function interNow(){
  var f=state.inter; if(!f||!currentModel) return null;
  var key=f.src+'|'+f.tgt+'|'+chainList.join()+'|'+currentPdbId+'|'+_frame;
  if(_inter&&_inter.key===key) return _inter;
  var S=_setAtoms(f.src), T=f.tgt==='protein'?_setAtoms('protein').filter(function(a){ return S.indexOf(a)<0&&!_isLigAtom(a); }):_setAtoms(f.tgt);
  if(!S.length||!T.length){ _inter={key:key,list:[]}; return _inter; }
  _inter={key:key,list:interactions(S,T,/^lig:/.test(f.src))};
  return _inter;
}
function interShown(){ var f=state.inter; if(!f||!f.show) return []; var r=interNow(); return r?r.list.filter(function(x){ return f.types[x.type]!==false&&!state.hiddenChains[x.a.chain||'']&&!state.hiddenChains[x.b.chain||'']; }):[]; }
function interDraw(){
  if(!viewer) return;
  _interShapes.forEach(function(s){ try{ viewer.removeShape(s); }catch(e){} }); _interShapes=[];
  interShown().forEach(function(x){
    var t=INTER_TYPES[x.type];
    try{ _interShapes.push(viewer.addCylinder({start:x.pa,end:x.pb,radius:t.w,color:t.c,dashed:true,dashLength:0.28,gapLength:0.2,fromCap:1,toCap:1,clickable:false}));
      if(x.type==='pi'||x.type==='cation') _interShapes.push(viewer.addSphere({center:x.pa,radius:0.28,color:t.c,clickable:false})); }catch(e){}
  });
}
function interResidues(){   // residues on either side, for sticks and labels
  var o={}; interShown().forEach(function(x){ [x.a,x.b].forEach(function(a){ if(!_isLigAtom(a)&&!(a.hetflag&&ionResn.indexOf(a.resn)>=0)) o[rKeyOf(a)]={chain:a.chain||'',resi:a.resi,resn:a.resn}; }); }); return o;
}
function _atomLabel(a){ return (a.chain&&a.chain.trim()?a.chain+':':'')+a.resn+' '+a.resi+' '+a.atom; }
function renderInter(){
  var el=$('interList'); if(!el) return;
  var f=state.inter, r=f&&interNow(), L=r?r.list:[];
  $('interSum').textContent='';
  if(!f){ el.innerHTML='<div class="empty-note">Pick what to look at, then press Find.</div>'; $('interActs').hidden=true; return; }
  var by={}; L.forEach(function(x){ by[x.type]=(by[x.type]||0)+1; });
  $('interTypes').innerHTML=Object.keys(INTER_TYPES).filter(function(k){ return by[k]||k!=='metal'; }).map(function(k){ var t=INTER_TYPES[k], on=f.types[k]!==false;
    return '<button type="button" class="it-chip'+(on?' on':'')+'" data-t="'+k+'" aria-pressed="'+on+'"><i style="background:'+t.c+'"></i>'+t.n+' <b>'+(by[k]||0)+'</b></button>'; }).join('');
  $('interSum').textContent=L.length?L.length+' between '+_setName(f.src)+' and '+_setName(f.tgt):'None found between '+_setName(f.src)+' and '+_setName(f.tgt)+'.';
  var shown=L.filter(function(x){ return f.types[x.type]!==false; }).slice(0,80);
  el.innerHTML=shown.map(function(x,i){ var t=INTER_TYPES[x.type];
    return '<div class="li" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="li-dot" style="background:'+t.c+';cursor:default" aria-hidden="true"></span><button type="button" class="li-main" data-i="'+i+'"><span class="li-name">'+escapeHtml(_atomLabel(x.b))+'</span><span class="li-meta">'+escapeHtml(t.n.replace(/s$/,'').replace(/^Hydrogen bond$/,'H-bond')+(x.shape?' ('+x.shape+')':'')+' · from '+_atomLabel(x.a))+'</span></button><span class="mono-v">'+x.d.toFixed(2)+' Å</span></div>'; }).join('')
    +(L.length>80?'<div class="empty-note">+ '+(L.length-80)+' more in the copied table.</div>':'');
  el.querySelectorAll('.li-main').forEach(function(b){ b.addEventListener('click',function(){ var x=shown[+b.dataset.i]; _userMoved=true; fitView({focus:{index:[x.a.index,x.b.index]},animate:true,margin:0.3}); }); });
  $('interActs').hidden=!L.length;
}
function interCopy(){
  var r=interNow(); if(!r) return;
  var t='Type\tFrom\tTo\tDistance (Å)\n'+r.list.map(function(x){ return INTER_TYPES[x.type].n+'\t'+_atomLabel(x.a)+'\t'+_atomLabel(x.b)+'\t'+x.d.toFixed(2); }).join('\n');
  try{ navigator.clipboard.writeText(t).then(function(){ showToast('Copied '+r.list.length+' interactions.'); },function(){ showToast('The clipboard is not available here.'); }); }catch(e){ showToast('The clipboard is not available here.'); }
}
function interSet(src,tgt){
  var old=state.inter;
  state.inter={src:src,tgt:tgt||'protein',show:true,types:old?Object.assign({},old.types):{}};
  _inter=null; recolorStructure(); interDraw(); viewer.render(); renderInter(); updateSummaries();
}
function interFill(){
  var s=$('interSrc'), t=$('interTgt'); if(!s) return;
  var src=ligands.map(function(l){ return '<option value="lig:'+escapeHtml(l.key)+'">Ligand '+escapeHtml(l.resn)+' · '+escapeHtml(chainTitle(l.chain).replace('Chain ',''))+' '+l.resi+'</option>'; })
    .concat(chainList.map(function(c){ return '<option value="chain:'+escapeHtml(c)+'">'+escapeHtml(chainTitle(c))+'</option>'; }),['<option value="sel">The selection</option>']);
  s.innerHTML=src.join(''); t.innerHTML='<option value="protein">Every protein chain</option>'+chainList.map(function(c){ return '<option value="chain:'+escapeHtml(c)+'">'+escapeHtml(chainTitle(c))+'</option>'; }).join('');
  if(state.inter){ s.value=state.inter.src; t.value=state.inter.tgt; } else if(chainList.length>1&&!ligands.length) t.value='chain:'+chainList[1];
}

// ── Lysines a ligase can reach ──────────────────────────────────────────────────────────────
// For a degrader in a ternary complex: which lysines of the target face the ligase, and are on the surface.
var LIGASE_RE=/von hippel|vhl|cereblon|crbn|dcaf|ddb1|cullin|keap1|mdm2|xiap|ciap|birc|kelch|f-box|fbx|beta-trcp|btrc|ring|ligase|rbx|skp|elongin/i;
function lysGuess(){
  if(chainList.length<2) return null;
  var lig=chainList.filter(function(c){ return LIGASE_RE.test((chainInfo[c]&&chainInfo[c].name)||''); });
  var helpers=/elongin|ddb1|rbx|skp|cullin/i;
  var e3=lig.filter(function(c){ return !helpers.test(chainInfo[c].name||''); })[0]||lig[0];
  var near=ligands[0], tgt=null;
  if(near){ var L=currentModel.selectedAtoms(ligSel(near)), best=-1; chainList.forEach(function(c){ if(lig.indexOf(c)>=0||chainInfo[c].type!=='protein') return; var n=0, A=polyAtoms(c), g=gridOf(A,5); L.forEach(function(a){ gridNear(g,5,a.x,a.y,a.z,function(j){ if(_d(a,A[j])<=5) n++; }); }); if(n>best){ best=n; tgt=c; } }); }
  tgt=tgt||chainList.filter(function(c){ return lig.indexOf(c)<0&&chainInfo[c].type==='protein'; })[0]||chainList[0];
  e3=e3||chainList.filter(function(c){ return c!==tgt; })[0];
  return {target:tgt,ligase:e3};
}
function nzExposure(nz,all,g,cell){   // the fraction of NZ's solvent sphere not buried by any other heavy atom
  var P=spherePoints(60), R=atomR(nz)+1.4, nb=[];
  gridNear(g,cell,nz.x,nz.y,nz.z,function(j){ var b=all[j]; if(b===nz) return; var s=R+atomR(b)+1.4; if(_d(nz,b)<s) nb.push(b); });
  var free=0; P.forEach(function(p){ var x=nz.x+R*p[0], y=nz.y+R*p[1], z=nz.z+R*p[2]; if(!nb.some(function(b){ var r=atomR(b)+1.4, dx=x-b.x, dy=y-b.y, dz=z-b.z; return dx*dx+dy*dy+dz*dz<r*r; })) free++; });
  return free/P.length;
}
var _lys=null;
function lysNow(){
  var f=state.lys; if(!f||!currentModel) return null;
  var key=f.target+'|'+f.ligase+'|'+currentPdbId+'|'+_frame; if(_lys&&_lys.key===key) return _lys;
  var all=heavy(currentModel.selectedAtoms({}).filter(function(a){ return WATER_RESN.indexOf(a.resn)<0; })), cell=7, g=gridOf(all,cell);
  var E=polyAtoms(f.ligase), deg=ligands.length?currentModel.selectedAtoms({}).filter(_isLigAtom):[];
  var rows=currentModel.selectedAtoms({chain:f.target,resn:'LYS',atom:'NZ'}).map(function(nz){
    var best=1e9; E.forEach(function(e){ var d=_d(nz,e); if(d<best) best=d; });
    var dl=1e9; deg.forEach(function(e){ var d=_d(nz,e); if(d<dl) dl=d; });
    return {resi:nz.resi,chain:f.target,nz:nz,dE3:best,dLig:deg.length?dl:null,exp:nzExposure(nz,all,g,cell)};
  });
  rows.sort(function(a,b){ return a.dE3-b.dE3; });
  _lys={key:key,rows:rows}; return _lys;
}
function lysColours(){
  var f=state.lys; if(!f||!f.show) return null; var r=lysNow(); if(!r) return null;
  var o={}; o[f.target]={};
  r.rows.forEach(function(x){ if(x.exp<0.1) return; o[f.target][x.resi]=x.dE3<=f.cut?_mixHex('#ff7a1a','#ffd27a',Math.max(0,Math.min(1,x.dE3/f.cut))):'#c9ccd6'; });
  return o;
}
function renderLys(){
  var el=$('lysList'); if(!el) return; var f=state.lys;
  if(!f){ el.innerHTML='<div class="empty-note">Choose the target and the ligase, then press Find.</div>'; $('lysActs').hidden=true; return; }
  var r=lysNow(), near=r.rows.filter(function(x){ return x.exp>=0.1&&x.dE3<=f.cut; });
  $('lysSum').textContent=r.rows.length?near.length+' of '+r.rows.length+' lysines of '+chainTitle(f.target)+' are on the surface and within '+f.cut+' Å of '+chainTitle(f.ligase)+'.':chainTitle(f.target)+' has no lysines with an NZ in the model.';
  el.innerHTML=r.rows.slice(0,60).map(function(x,i){ var on=x.exp>=0.1&&x.dE3<=f.cut;
    return '<div class="li'+(on?'':' off')+'" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="li-dot" style="background:'+(on?_mixHex('#ff7a1a','#ffd27a',Math.min(1,x.dE3/f.cut)):'#c9ccd6')+';cursor:default" aria-hidden="true"></span><button type="button" class="li-main" data-i="'+i+'"><span class="li-name">K'+x.resi+'</span><span class="li-meta">'+Math.round(x.exp*100)+'% exposed'+(x.dLig!=null?' · '+x.dLig.toFixed(1)+' Å from the degrader':'')+'</span></button><span class="mono-v">'+x.dE3.toFixed(1)+' Å</span></div>'; }).join('');
  el.querySelectorAll('.li-main').forEach(function(b){ b.addEventListener('click',function(){ var x=r.rows[+b.dataset.i]; _userMoved=true; fitView({focus:{chain:x.chain,resi:x.resi},animate:true,margin:0.3}); }); });
  $('lysActs').hidden=!near.length;
}
function lysSet(target,ligase,cut){
  state.lys={target:target,ligase:ligase,cut:cut>0?cut:(state.lys&&state.lys.cut)||30,show:true}; _lys=null;
  recolorStructure(); renderLys(); updateSummaries();
}
function lysFill(){
  var t=$('lysTgt'), e=$('lysE3'); if(!t) return;
  var o=chainList.map(function(c){ return '<option value="'+escapeHtml(c)+'">'+escapeHtml(chainTitle(c)+(chainInfo[c]&&chainInfo[c].name?' · '+chainInfo[c].name:''))+'</option>'; }).join('');
  t.innerHTML=o; e.innerHTML=o;
  var g=state.lys||lysGuess(); if(g){ t.value=g.target; e.value=g.ligase; }
  if(state.lys) $('lysCut').value=state.lys.cut;
}

// ── Clashes and contacts between two parts ──────────────────────────────────────────────────
// Overlap = the two van der Waals radii less the distance. A clash overlaps by 0.6 Å or more, a contact by −0.4 Å or more
// (ChimeraX's defaults). Atoms of one residue, and the peptide bond between neighbours, are not counted.
var _clash=null, _clashShapes=[];
function clashCompute(aSpec,bSpec){
  var A=heavy(_setAtoms(aSpec)), B=heavy(_setAtoms(bSpec)), Bi={}; B.forEach(function(b){ Bi[b.index]=1; });
  A=A.filter(function(a){ return !Bi[a.index]; });
  var g=gridOf(B,4.5), cl=[], ct=0;
  A.forEach(function(a){ gridNear(g,4.5,a.x,a.y,a.z,function(j){ var b=B[j];
    if((a.chain||'')===(b.chain||'')&&Math.abs(a.resi-b.resi)<=1) return;
    var d=_d(a,b), ov=atomR(a)+atomR(b)-d; if(ov>=-0.4) ct++; if(ov>=0.6) cl.push({a:a,b:b,d:d,ov:ov}); }); });
  cl.sort(function(x,y){ return y.ov-x.ov; });
  return {a:aSpec,b:bSpec,clashes:cl,contacts:ct};
}
function clashDraw(){
  if(!viewer) return; _clashShapes.forEach(function(s){ try{ viewer.removeShape(s); }catch(e){} }); _clashShapes=[];
  if(!_clash||!_clash.show) return;
  _clash.clashes.slice(0,300).forEach(function(x){ try{ _clashShapes.push(viewer.addCylinder({start:{x:x.a.x,y:x.a.y,z:x.a.z},end:{x:x.b.x,y:x.b.y,z:x.b.z},radius:0.09,color:'#e5484d',dashed:true,dashLength:0.2,gapLength:0.15,fromCap:1,toCap:1,clickable:false})); }catch(e){} });
}
function renderClash(){
  var el=$('clashOut'); if(!el) return;
  if(!_clash){ el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML='<div class="ic-line"><b>'+_clash.clashes.length+'</b> '+(_clash.clashes.length===1?'clash':'clashes')+' · <b>'+_clash.contacts+'</b> contacts between '+escapeHtml(_setName(_clash.a))+' and '+escapeHtml(_setName(_clash.b))+'</div>'
    +(_clash.clashes.length?'<div class="hint">Worst: '+_clash.clashes.slice(0,3).map(function(x){ return escapeHtml(_atomLabel(x.a)+' – '+_atomLabel(x.b))+' ('+x.ov.toFixed(2)+' Å)'; }).join(' · ')+'</div>':'<div class="hint">Nothing overlaps by 0.6 Å or more.</div>');
}
function clashFill(){
  var a=$('clA'), b=$('clB'); if(!a) return;
  var o=chainList.map(function(c){ return '<option value="chain:'+escapeHtml(c)+'">'+escapeHtml(chainTitle(c))+'</option>'; }).concat(ligands.map(function(l){ return '<option value="lig:'+escapeHtml(l.key)+'">Ligand '+escapeHtml(l.resn)+'</option>'; }),['<option value="sel">The selection</option>']).join('');
  a.innerHTML=o; b.innerHTML=o; if(chainList.length>1) b.value='chain:'+chainList[1];
}

// ── Colouring by a property of the residue or the atom ───────────────────────────────────────
var KD={ALA:1.8,ARG:-4.5,ASN:-3.5,ASP:-3.5,CYS:2.5,GLN:-3.5,GLU:-3.5,GLY:-0.4,HIS:-3.2,ILE:4.5,LEU:3.8,LYS:-3.9,MET:1.9,PHE:2.8,PRO:-1.6,SER:-0.8,THR:-0.7,TRP:-0.9,TYR:-1.3,VAL:4.2,MSE:1.9};
var HYDRO_STOPS=['#2a8fbd','#f3f1f1','#d9822b'], ELEC_STOPS=['#d1342f','#f7f7f7','#2f5fd1'];
function _ramp(stops,t){ t=Math.max(0,Math.min(1,t)); var n=stops.length-1, k=Math.min(n-1,Math.floor(t*n)); return _mixHex(stops[k],stops[k+1],t*n-k); }
function hydroColor(a){ var v=KD[a.resn]; return v==null?'#c9ccd6':_ramp(HYDRO_STOPS,(v+4.5)/9); }
var _elec=null;
function atomCharge(a){
  var r=a.resn, n=a.atom;
  if(r==='LYS'&&n==='NZ') return 1; if(r==='ARG'&&(n==='NH1'||n==='NH2'||n==='NE')) return 1/3;
  if(r==='ASP'&&(n==='OD1'||n==='OD2')) return -0.5; if(r==='GLU'&&(n==='OE1'||n==='OE2')) return -0.5;
  if(n==='OXT') return -1; return 0;
}
function elecMap(){   // Coulomb's law with a distance-dependent dielectric (ε = 4r), from the charges of the residues alone
  var key=currentPdbId+'|'+_frame+'|'+chainList.join(); if(_elec&&_elec.key===key) return _elec.m;
  var all=currentModel.selectedAtoms({}), Q=[], m={}, firstN={};
  all.forEach(function(a){ if(a.hetflag) return; var q=atomCharge(a); if(a.atom==='N'&&!firstN[a.chain||'']){ firstN[a.chain||'']=1; q=1; } if(q) Q.push({x:a.x,y:a.y,z:a.z,q:q,i:a.index}); });
  all.forEach(function(a){ var v=0; for(var k=0;k<Q.length;k++){ var c=Q[k]; if(c.i===a.index) continue; var dx=a.x-c.x, dy=a.y-c.y, dz=a.z-c.z, r2=dx*dx+dy*dy+dz*dz; if(r2<1) r2=1; v+=83*c.q/r2; } m[a.index]=v; });
  _elec={key:key,m:m}; return m;
}
function elecColor(a){ if(a.hetflag) return '#c9ccd6'; var v=elecMap()[a.index]||0; return _ramp(ELEC_STOPS,(v+10)/20); }

// ── Pockets: places in the protein a small molecule could sit ───────────────────────────────
// A grid over the visible protein; a point is a pocket point when it is outside every atom (plus a 1.4 Å probe) and protein
// lies within 8 Å along at least 10 of 14 directions. Points that touch are one pocket; pockets are ranked by size.
var _pockets=null, _pocketShapes=[];
function pocketsFind(){
  var A=heavy(currentModel.selectedAtoms({}).filter(function(a){ return !a.hetflag&&!state.hiddenChains[a.chain||'']; }));
  if(!A.length) return [];
  var h=1.0, x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9;
  A.forEach(function(a){ x0=Math.min(x0,a.x); y0=Math.min(y0,a.y); z0=Math.min(z0,a.z); x1=Math.max(x1,a.x); y1=Math.max(y1,a.y); z1=Math.max(z1,a.z); });
  var nx=Math.ceil((x1-x0)/h)+1, ny=Math.ceil((y1-y0)/h)+1, nz=Math.ceil((z1-z0)/h)+1;
  if(nx*ny*nz>2.5e6){ h=Math.cbrt((x1-x0)*(y1-y0)*(z1-z0)/2.5e6); nx=Math.ceil((x1-x0)/h)+1; ny=Math.ceil((y1-y0)/h)+1; nz=Math.ceil((z1-z0)/h)+1; }
  var occ=new Uint8Array(nx*ny*nz), I=function(i,j,k){ return (k*ny+j)*nx+i; };
  A.forEach(function(a){ var r=atomR(a)+1.4, ri=Math.ceil(r/h), ci=Math.round((a.x-x0)/h), cj=Math.round((a.y-y0)/h), ck=Math.round((a.z-z0)/h);
    for(var i=ci-ri;i<=ci+ri;i++) for(var j=cj-ri;j<=cj+ri;j++) for(var k=ck-ri;k<=ck+ri;k++){ if(i<0||j<0||k<0||i>=nx||j>=ny||k>=nz) continue; var dx=x0+i*h-a.x, dy=y0+j*h-a.y, dz=z0+k*h-a.z; if(dx*dx+dy*dy+dz*dz<=r*r) occ[I(i,j,k)]=1; } });
  var core=new Uint8Array(nx*ny*nz);   // atom bodies alone (no probe), for the rays
  A.forEach(function(a){ var r=atomR(a), ri=Math.ceil(r/h), ci=Math.round((a.x-x0)/h), cj=Math.round((a.y-y0)/h), ck=Math.round((a.z-z0)/h);
    for(var i=ci-ri;i<=ci+ri;i++) for(var j=cj-ri;j<=cj+ri;j++) for(var k=ck-ri;k<=ck+ri;k++){ if(i<0||j<0||k<0||i>=nx||j>=ny||k>=nz) continue; core[I(i,j,k)]=1; } });
  var D=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]], steps=Math.round(8/h);
  var pk=new Uint8Array(nx*ny*nz), i,j,k;
  for(k=1;k<nz-1;k++) for(j=1;j<ny-1;j++) for(i=1;i<nx-1;i++){
    if(occ[I(i,j,k)]) continue;
    var hits=0;
    for(var q=0;q<14&&hits+(14-q)>=10;q++){ var d=D[q]; for(var s=1;s<=steps;s++){ var a=i+d[0]*s, b=j+d[1]*s, c=k+d[2]*s; if(a<0||b<0||c<0||a>=nx||b>=ny||c>=nz) break; if(core[I(a,b,c)]){ hits++; break; } } }
    if(hits>=10) pk[I(i,j,k)]=1;
  }
  // connected pockets
  var lab=new Int32Array(nx*ny*nz), out=[], id=0;
  for(k=0;k<nz;k++) for(j=0;j<ny;j++) for(i=0;i<nx;i++){
    var st=I(i,j,k); if(!pk[st]||lab[st]) continue;
    id++; var stack=[[i,j,k]], pts=[]; lab[st]=id;
    while(stack.length){ var p=stack.pop(); pts.push(p); [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(function(d){ var a=p[0]+d[0], b=p[1]+d[1], c=p[2]+d[2]; if(a<0||b<0||c<0||a>=nx||b>=ny||c>=nz) return; var t=I(a,b,c); if(pk[t]&&!lab[t]){ lab[t]=id; stack.push([a,b,c]); } }); }
    if(pts.length*h*h*h>=30) out.push(pts.map(function(p){ return {x:x0+p[0]*h,y:y0+p[1]*h,z:z0+p[2]*h}; }));
  }
  out.sort(function(a,b){ return b.length-a.length; });
  var gA=gridOf(A,4);
  return out.slice(0,8).map(function(P,n){
    var res={}; P.forEach(function(p){ gridNear(gA,4,p.x,p.y,p.z,function(t){ if(_d(p,A[t])<=4) res[rKeyOf(A[t])]=1; }); });
    var lig=ligands.filter(function(l){ return currentModel.selectedAtoms(ligSel(l)).some(function(a){ return P.some(function(p){ return _d(p,a)<=2; }); }); }).map(function(l){ return l.resn; });
    return {n:n+1,pts:P,vol:P.length*h*h*h,res:Object.keys(res),lig:lig};
  });
}
var POCKET_COLS=['#e5484d','#3e63dd','#30a46c','#f5a524','#8e4ec6','#12a594','#d6409f','#6e56cf'];
function pocketDraw(){
  if(!viewer) return; _pocketShapes.forEach(function(s){ try{ viewer.removeShape(s); }catch(e){} }); _pocketShapes=[];
  if(!_pockets||!_pockets.show) return;
  _pockets.list.forEach(function(p,i){ if(_pockets.only!=null&&_pockets.only!==i) return; var step=Math.max(1,Math.ceil(p.pts.length/400));
    for(var q=0;q<p.pts.length;q+=step){ try{ _pocketShapes.push(viewer.addSphere({center:p.pts[q],radius:0.42,color:POCKET_COLS[i%POCKET_COLS.length],opacity:0.75,clickable:false})); }catch(e){} } });
}
// "FWZ ×2, EDO ×5", not the same name once per copy: a pocket in a crystal with ten glycerols listed them ten times
function pocketLigText(l){ var n={}, o=[]; (l||[]).forEach(function(x){ if(!n[x]){ n[x]=0; o.push(x); } n[x]++; }); return o.map(function(x){ return n[x]>1?x+' ×'+n[x]:x; }).join(', '); }
function renderPockets(){
  var el=$('pocketList'); if(!el) return;
  if(!_pockets){ el.innerHTML='<div class="empty-note">Press Find pockets: it takes a second or two on a large structure.</div>'; return; }
  if(!_pockets.list.length){ el.innerHTML='<div class="empty-note">No buried cavity of 30 Å³ or more in the chains shown.</div>'; return; }
  el.innerHTML=_pockets.list.map(function(p,i){ return '<div class="li'+(_pockets.only!=null&&_pockets.only!==i?' off':'')+'" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="li-dot" style="background:'+POCKET_COLS[i%POCKET_COLS.length]+';cursor:default" aria-hidden="true"></span><button type="button" class="li-main" data-i="'+i+'"><span class="li-name">Pocket '+p.n+(p.lig.length?' <span style="font-weight:400;color:var(--text2)">· holds '+escapeHtml(pocketLigText(p.lig))+'</span>':'')+'</span><span class="li-meta">'+Math.round(p.vol)+' Å³ · '+p.res.length+' residues</span></button><button type="button" class="ibtn pk-sel" data-i="'+i+'" title="Select its residues" aria-label="Select the residues of pocket '+p.n+'"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 2.5"/></svg></button></div>'; }).join('');
  el.querySelectorAll('.li-main').forEach(function(b){ b.addEventListener('click',function(){ var i=+b.dataset.i; _pockets.only=_pockets.only===i?null:i; pocketDraw(); viewer.render(); renderPockets(); var p=_pockets.list[i]; if(_pockets.only===i){ var c={x:0,y:0,z:0}; p.pts.forEach(function(q){ c.x+=q.x; c.y+=q.y; c.z+=q.z; }); _userMoved=true; var keys=p.res; selSet(keys); fitView({focus:selSpec3D(),animate:true,margin:0.2}); } }); });
  el.querySelectorAll('.pk-sel').forEach(function(b){ b.addEventListener('click',function(){ selSet(_pockets.list[+b.dataset.i].res); showToast('Selected the '+_pockets.list[+b.dataset.i].res.length+' residues lining pocket '+(+b.dataset.i+1)+'.'); }); });
}
function pocketsRun(){
  if(!currentModel) return;
  $('pocketGo').disabled=true; $('pocketGo').textContent='Looking…';
  setTimeout(function(){
    var t0=performance.now(), L=[]; try{ L=pocketsFind(); }catch(e){ console.error(e); }
    _pockets={list:L,show:true,only:null,ms:performance.now()-t0}; pocketDraw(); viewer.render(); renderPockets();
    $('pocketGo').disabled=false; $('pocketGo').textContent='Find again'; updateSummaries();
  },30);
}

// ── AlphaFold: the predicted aligned error ──────────────────────────────────────────────────
// How sure the model is of where residue j sits when residue i is held in place. Two domains each confident in themselves
// but not in each other show as two dark squares with pale off-diagonal blocks. Drag a rectangle to select those residues.
var _pae=null;
function paeUrl(){ var af=currentSource&&currentSource.af; if(af&&af.paeDocUrl) return af.paeDocUrl; var acc=currentSource&&currentSource.rid; return acc?'https://alphafold.ebi.ac.uk/files/AF-'+acc+'-F1-predicted_aligned_error_v4.json':null; }
function paeLoad(){
  var el=$('paeBox'); if(!el) return;
  if(!isAF()){ el.hidden=true; return; } el.hidden=false;
  if(_pae&&_pae.id===currentPdbId){ paeDraw(); return; }
  var u=paeUrl(); if(!u){ $('paeNote').textContent='No error map for this model.'; return; }
  $('paeNote').textContent='Loading the error map…';
  var id=currentPdbId;
  rbFetch(u).then(function(r){ return r.json(); }).then(function(j){
    if(id!==currentPdbId) return;
    var o=Array.isArray(j)?j[0]:j, M=o&&(o.predicted_aligned_error||o.pae);
    if(!Array.isArray(M)||!M.length||!Array.isArray(M[0])) throw new Error('shape');
    _pae={id:id,M:M,max:o.max_predicted_aligned_error||31.75}; paeDraw();
  }).catch(function(e){ if(id!==currentPdbId) return; _pae=null; $('paeNote').textContent=e&&e.message==='shape'?'The error map could not be read.':netMessage(e,'AlphaFold DB'); });
}
function paeDraw(){
  var cv=$('paeCanvas'); if(!cv||!_pae) return;
  var M=_pae.M, N=M.length, S=Math.min(512,N); cv.width=S; cv.height=S;
  var ctx=cv.getContext('2d'), img=ctx.createImageData(S,S), k=N/S;
  for(var y=0;y<S;y++) for(var x=0;x<S;x++){ var v=M[Math.floor(y*k)][Math.floor(x*k)], t=Math.min(1,v/30), c=_mixHex('#0b5d1e','#ffffff',t), p=(y*S+x)*4;
    img.data[p]=parseInt(c.slice(1,3),16); img.data[p+1]=parseInt(c.slice(3,5),16); img.data[p+2]=parseInt(c.slice(5,7),16); img.data[p+3]=255; }
  ctx.putImageData(img,0,0);
  if(_pae.box){ var b=_pae.box; ctx.strokeStyle='#e5484d'; ctx.lineWidth=Math.max(1,S/180); ctx.strokeRect(b.x0/k,b.y0/k,(b.x1-b.x0+1)/k,(b.y1-b.y0+1)/k); }
  $('paeNote').textContent=N+' residues · dark = confident (0 Å), white = 30 Å or more. Drag a box to select those residues.';
}
function paeWire(){
  var cv=$('paeCanvas'); if(!cv) return; var drag=null;
  function at(e){ var r=cv.getBoundingClientRect(), N=_pae.M.length; return {i:Math.max(0,Math.min(N-1,Math.floor((e.clientX-r.left)/r.width*N))),j:Math.max(0,Math.min(N-1,Math.floor((e.clientY-r.top)/r.height*N)))}; }
  cv.addEventListener('pointerdown',function(e){ if(!_pae) return; drag=at(e); try{ cv.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); });
  cv.addEventListener('pointermove',function(e){ if(!_pae) return; var p=at(e);
    $('paeHover').textContent='residue '+(p.j+1)+' aligned on '+(p.i+1)+': '+_pae.M[p.j][p.i].toFixed(1)+' Å';
    if(drag){ _pae.box={x0:Math.min(drag.i,p.i),x1:Math.max(drag.i,p.i),y0:Math.min(drag.j,p.j),y1:Math.max(drag.j,p.j)}; paeDraw(); } });
  cv.addEventListener('pointerup',function(){ if(!drag||!_pae) return; drag=null; var b=_pae.box; if(!b) return;
    var L=SEQ.chains[SEQ.order[0]]||[], keys={}; L.forEach(function(e,ix){ if((ix>=b.x0&&ix<=b.x1)||(ix>=b.y0&&ix<=b.y1)) keys[e.k]=1; });
    selSet(Object.keys(keys)); showToast('Selected residues '+(b.x0+1)+'–'+(b.x1+1)+(b.y0!==b.x0||b.y1!==b.x1?' and '+(b.y0+1)+'–'+(b.y1+1):'')+'.'); });
}
var _plddtHide=null;
function confidentOnly(cut){   // hide what AlphaFold is not sure of
  var hide={}; currentModel.selectedAtoms({atom:'CA'}).forEach(function(a){ if((a.b||0)<cut) (hide[a.chain||'']||(hide[a.chain||'']=[])).push(a.resi); });
  var t=Object.keys(hide).map(function(c){ return rangesText(c,hide[c]); }).filter(Boolean).join(', ');
  state.hide=(state.hide||[]).filter(function(x){ return x!==_plddtHide; }); _plddtHide=t||null;
  if(t) state.hide.push(t);
  recolorStructure(); return Object.keys(hide).reduce(function(n,c){ return n+hide[c].length; },0);
}

// ── Hooks the core calls ─────────────────────────────────────────────────────────────────────
function rbStudioColour(a,ch){   // a colour from Analyse that sits over the mode (lysines), or null
  var lc=_lysCol; if(lc&&lc[ch]&&lc[ch][a.resi]) return lc[ch][a.resi];
  return null;
}
var _lysCol=null;
function rbStudioBegin(){ _lysCol=lysColours(); }
function rbStudioStyles(ef){
  var ir=interResidues(); Object.keys(ir).forEach(function(k){ var r=ir[k]; if(state.hiddenChains[r.chain]) return; viewer.addStyle({chain:r.chain,resi:r.resi,not:{resn:WATER_RESN}},{stick:{radius:0.15,colorfunc:ef}}); });
  var f=state.lys; if(f&&f.show){ var lr=lysNow(); if(lr&&!state.hiddenChains[f.target]){ var rs=lr.rows.filter(function(x){ return x.exp>=0.1&&x.dE3<=f.cut; }).map(function(x){ return x.resi; }); if(rs.length) viewer.addStyle({chain:f.target,resi:rs,resn:'LYS'},{stick:{radius:0.17,colorfunc:ef}}); } }
}
function rbStudioShapes(){ interDraw(); clashDraw(); pocketDraw(); }
function analyseReset(){ _inter=null; _lys=null; _clash=null; _pockets=null; _pae=null; _elec=null; _interShapes=[]; _clashShapes=[]; _pocketShapes=[]; }   // the viewer was cleared: the shapes went with it
function analyseOnModel(){ document.body.classList.toggle('rb-af',isAF()); interFill(); lysFill(); clashFill(); renderInter(); renderLys(); renderClash(); renderPockets(); paeLoad(); }
function analyseWire(){
  $('interGo').addEventListener('click',function(){ interSet($('interSrc').value,$('interTgt').value); });
  $('interTypes').addEventListener('click',function(e){ var b=e.target.closest('.it-chip'); if(!b||!state.inter) return; state.inter.types[b.dataset.t]=state.inter.types[b.dataset.t]===false; recolorStructure(); interDraw(); viewer.render(); renderInter(); });
  $('interCopy').addEventListener('click',interCopy);
  $('interLabel').addEventListener('click',function(){ var ir=interResidues(), ks=Object.keys(ir); if(!ks.length) return; var k0=Object.assign({},_sel); _sel={}; ks.forEach(function(k){ _sel[k]=1; }); _selN=ks.length; selLabel(); _sel=k0; _selN=Object.keys(_sel).length; recolorStructure(); });
  $('interSel').addEventListener('click',function(){ selSet(Object.keys(interResidues())); });
  $('interClear').addEventListener('click',function(){ state.inter=null; _inter=null; recolorStructure(); interDraw(); viewer.render(); renderInter(); updateSummaries(); });
  $('lysGo').addEventListener('click',function(){ var c=parseFloat($('lysCut').value); lysSet($('lysTgt').value,$('lysE3').value,c>=5&&c<=80?c:30); });
  $('lysCut').addEventListener('change',function(){ if(!state.lys) return; var c=parseFloat(this.value); if(c>=5&&c<=80){ state.lys.cut=c; recolorStructure(); renderLys(); } });
  $('lysSel').addEventListener('click',function(){ var r=lysNow(), f=state.lys; if(!r) return; selSet(r.rows.filter(function(x){ return x.exp>=0.1&&x.dE3<=f.cut; }).map(function(x){ return rKey(f.target,x.resi); })); });
  $('lysLabel').addEventListener('click',function(){ var r=lysNow(), f=state.lys; if(!r) return; var near=r.rows.filter(function(x){ return x.exp>=0.1&&x.dE3<=f.cut; }).slice(0,12);
    near.forEach(function(x){ if(!state.residueLabels.some(function(y){ return y.chain===f.target&&y.resi===x.resi; })) state.residueLabels.push({chain:f.target,resi:x.resi,resn:'LYS',text:'K'+x.resi}); }); delete state.off.labels; renderLabelTags(); renderResLblList(); showToast('Labelled the '+near.length+' nearest.'); });
  $('lysCopy').addEventListener('click',function(){ var r=lysNow(); if(!r) return; var t='Lysine\tDistance to ligase (Å)\tNZ exposed (%)\tDistance to degrader (Å)\n'+r.rows.map(function(x){ return 'K'+x.resi+'\t'+x.dE3.toFixed(1)+'\t'+Math.round(x.exp*100)+'\t'+(x.dLig!=null?x.dLig.toFixed(1):''); }).join('\n'); try{ navigator.clipboard.writeText(t).then(function(){ showToast('Copied.'); },function(){ showToast('The clipboard is not available here.'); }); }catch(e){} });
  $('lysClear').addEventListener('click',function(){ state.lys=null; _lys=null; recolorStructure(); renderLys(); updateSummaries(); });
  $('clGo').addEventListener('click',function(){ _clash=clashCompute($('clA').value,$('clB').value); _clash.show=true; clashDraw(); viewer.render(); renderClash(); updateSummaries(); });
  $('pocketGo').addEventListener('click',pocketsRun);
  $('paeHide').addEventListener('click',function(){ var n=confidentOnly(70); showToast(n?'Hid '+n+' residues with pLDDT under 70.':'Every residue is at 70 or more.'); });
  paeWire();
}
// Design keys for what Analyse shows
DESIGN_KEYS.push('inter','lys');
RB_CMDS.push(
  {n:['interactions','inter','contacts2','plip','hbonds'],d:'What a ligand (or a chain) makes with the protein: H-bonds, salt bridges, hydrophobic, π, halogen, metal',f:'interactions MZ1 · interactions A B · interactions off',
   args:function(pos){ return pos===0?ligands.map(function(l){ return _cand(l.resn,'lig',l.name||'ligand'); }).concat(chainList.map(function(c){ return _cand(c,'chain',''); }),[_cand('sel','word','the selection'),_cand('off','word','none')]):chainList.map(function(c){ return _cand(c,'chain',''); }); },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().split(/\s+/).filter(Boolean);
     if(/^(off|none|clear)$/i.test(w[0]||'')){ state.inter=null; _inter=null; recolorStructure(); interDraw(); viewer.render(); renderInter(); return _ok('Interactions off.'); }
     var src=null, x=(w[0]||'').toUpperCase(), l=ligands.filter(function(q){ return q.resn.toUpperCase()===x; })[0];
     if(!w.length&&ligands.length) l=ligands[0];
     if(l) src='lig:'+l.key; else if(chainList.indexOf(w[0])>=0) src='chain:'+w[0]; else if(/^sel/i.test(w[0]||'')) src='sel';
     if(!src) return _err('interactions <ligand code>, interactions A B, or interactions sel');
     var tgt=w[1]&&chainList.indexOf(w[1])>=0?'chain:'+w[1]:'protein'; interSet(src,tgt); rbOpenSec('interact'); var r=interNow(); return _ok(r.list.length+' interactions.'); }},
  {n:['lysines','lys','ubiquitin','ub'],d:'Lysines of a target on the surface and near the ligase (for degraders)',f:'lysines A D · lysines A D 25',
   args:function(){ return chainList.map(function(c){ return _cand(c,'chain',(chainInfo[c]&&chainInfo[c].name)||''); }); },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().split(/\s+/).filter(Boolean), g=lysGuess()||{};
     if(/^(off|none)$/i.test(w[0]||'')){ state.lys=null; _lys=null; recolorStructure(); renderLys(); return _ok('Off.'); }
     var t=chainList.indexOf(w[0])>=0?w[0]:g.target, e=chainList.indexOf(w[1])>=0?w[1]:g.ligase, c=parseFloat(w[2]);
     if(!t||!e||t===e) return _err('lysines <target chain> <ligase chain> [Å]'); lysSet(t,e,c>=5&&c<=80?c:30); lysFill(); rbOpenSec('lysines');
     var r=lysNow(); return _ok(r.rows.filter(function(x){ return x.exp>=0.1&&x.dE3<=state.lys.cut; }).length+' lysines of '+t+' within '+state.lys.cut+' Å of '+e+'.'); }},
  {n:['clashes','clash','overlaps'],d:'Atoms that overlap between two parts',f:'clashes A B · clashes MZ1 A',
   args:function(){ return chainList.map(function(c){ return _cand(c,'chain',''); }).concat(ligands.map(function(l){ return _cand(l.resn,'lig',''); })); },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().split(/\s+/).filter(Boolean);
     function sp(t){ if(!t) return null; if(chainList.indexOf(t)>=0) return 'chain:'+t; var l=ligands.filter(function(q){ return q.resn.toUpperCase()===t.toUpperCase(); })[0]; if(l) return 'lig:'+l.key; if(/^sel/i.test(t)) return 'sel'; return null; }
     var A=sp(w[0]), B=sp(w[1]); if(!A||!B) return _err('clashes <chain|ligand|sel> <chain|ligand|sel>');
     _clash=clashCompute(A,B); _clash.show=true; clashDraw(); viewer.render(); clashFill(); renderClash(); rbOpenSec('clashes'); return _ok(_clash.clashes.length+' clashes, '+_clash.contacts+' contacts.'); }},
  {n:['pockets','cavities','cavity'],d:'Find buried cavities a small molecule could sit in',f:'pockets',
   run:function(){ var n=needModel(); if(n) return n; rbOpenSec('pockets'); pocketsRun(); return _ok('Looking for pockets…'); }},
  {n:['confident','plddt'],d:'Hide the residues AlphaFold is not sure of',f:'confident 70 · confident off',
   run:function(a){ var n=needModel(); if(n) return n; if(!isAF()&&!/off/i.test(a)) return _err('This is not an AlphaFold model.');
     if(/off/i.test(a)){ state.hide=(state.hide||[]).filter(function(x){ return x!==_plddtHide; }); _plddtHide=null; recolorStructure(); return _ok('Showing every residue.'); }
     var c=parseFloat(a)||70; var k=confidentOnly(c); return _ok('Hid '+k+' residues under '+c+'.'); }}
);
COLOR_SCHEMES.hydrophobicity='hydro'; COLOR_SCHEMES.hydrophobic='hydro'; COLOR_SCHEMES.hydro='hydro'; COLOR_SCHEMES.kd='hydro';
COLOR_SCHEMES.charge='elec'; COLOR_SCHEMES.electrostatic='elec'; COLOR_SCHEMES.electrostatics='elec'; COLOR_SCHEMES.coulombic='elec'; COLOR_SCHEMES.elec='elec';
