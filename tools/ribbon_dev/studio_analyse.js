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
// A uniform grid with integer cell numbers and no allocation per query. The grid in the core builds an "x,y,z" string for each of the 27
// cells of every query; Interactions, Lysines, Clashes and Pockets each make tens of thousands of queries on a large structure.
function agrid(atoms,cell){
  var n=atoms.length, x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9, i, a;
  for(i=0;i<n;i++){ a=atoms[i]; if(a.x<x0)x0=a.x; if(a.y<y0)y0=a.y; if(a.z<z0)z0=a.z; if(a.x>x1)x1=a.x; if(a.y>y1)y1=a.y; if(a.z>z1)z1=a.z; }
  if(!n){ x0=y0=z0=x1=y1=z1=0; }
  var nx,ny,nz;
  for(;;){ nx=Math.floor((x1-x0)/cell)+3; ny=Math.floor((y1-y0)/cell)+3; nz=Math.floor((z1-z0)/cell)+3; if(nx*ny*nz<=6e6) break; cell*=1.5; }   // one empty cell each side
  var head=new Int32Array(nx*ny*nz).fill(-1), next=new Int32Array(n);
  for(i=0;i<n;i++){ a=atoms[i]; var c=((Math.floor((a.z-z0)/cell)+1)*ny+(Math.floor((a.y-y0)/cell)+1))*nx+(Math.floor((a.x-x0)/cell)+1); next[i]=head[c]; head[c]=i; }
  return {near:function(x,y,z,fn){
    var cx=Math.floor((x-x0)/cell)+1, cy=Math.floor((y-y0)/cell)+1, cz=Math.floor((z-z0)/cell)+1;
    for(var k=Math.max(0,cz-1);k<=Math.min(nz-1,cz+1);k++) for(var j=Math.max(0,cy-1);j<=Math.min(ny-1,cy+1);j++) for(var q=Math.max(0,cx-1);q<=Math.min(nx-1,cx+1);q++)
      for(var m=head[(k*ny+j)*nx+q];m>=0;m=next[m]) fn(m);
  }};
}
// Which hetero residues are ligands: one lookup, rebuilt when the structure changes (it was a scan of the ligand list for every atom, copied four times).
var _ligKeysFor=null, _ligKeys={};
function _ligKeysMap(){ if(_ligKeysFor!==ligands){ _ligKeysFor=ligands; _ligKeys={}; ligands.forEach(function(l){ _ligKeys[l.key]=1; }); } return _ligKeys; }
function _isLigAtom(a){ return !!_ligKeysMap()[a.resn+':'+(a.chain||'')+':'+a.resi]; }
function _carbonOnlyC(a,idx){ return (a.elem||'C').toUpperCase()==='C'&&(a.bonds||[]).every(function(j){ var b=idx[j]; return !b||/^(C|H)$/i.test(b.elem||'C'); }); }
// src, tgt: atom lists. srcLig: src is a ligand (no charges known)
function interactions(src,tgt,srcLig){
  var out=[], idx=_atomsByIndex(), S=heavy(src), T=heavy(tgt), g=agrid(T,4.5), add=function(type,a,b,d,pa,pb,extra){ out.push(Object.assign({type:type,a:a,b:b,d:d,pa:pa||{x:a.x,y:a.y,z:a.z},pb:pb||{x:b.x,y:b.y,z:b.z}},extra||{})); };
  var hydroBest={};
  S.forEach(function(a){
    var ea=(a.elem||'C').toUpperCase();
    g.near(a.x,a.y,a.z,function(j){
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
  var key=f.src+'|'+f.tgt+'|'+chainList.join()+'|'+Object.keys(state.hiddenChains).join()+'|'+currentPdbId+'|'+_frame+'|'+((f.src==='sel'||f.tgt==='sel')?selKeys().join(','):'');   // the selection and the chains shown are part of the question
  if(_inter&&_inter.key===key) return _inter;
  var S=_setAtoms(f.src), si={}; S.forEach(function(a){ si[a.index]=1; });
  var T=f.tgt==='protein'?_setAtoms('protein').filter(function(a){ return !si[a.index]&&!_isLigAtom(a); }):_setAtoms(f.tgt);
  if(!S.length||!T.length){ _inter={key:key,list:[]}; return _inter; }
  _inter={key:key,list:interactions(S,T,/^lig:/.test(f.src))};
  return _inter;
}
function interShown(){ var f=state.inter; if(!f||!f.show) return []; var r=interNow(); return r?r.list.filter(function(x){ return f.types[x.type]!==false&&!state.hiddenChains[x.a.chain||'']&&!state.hiddenChains[x.b.chain||'']&&!ligAtomOff(x.a)&&!ligAtomOff(x.b); }):[]; }
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

// ── The binding site ─────────────────────────────────────────────────────────────────────────────────────────────
// What a SeeSAR-style view is for, as far as the coordinates go: pick a ligand, see what holds it. The ligand is chosen for you (the
// largest that is not a crystallisation additive — the rule used when a target is opened from Echo), the interactions are read at
// once, and the residues are listed one row each, with a pip for every kind of interaction, nearest first — not one row per atom
// pair. There is no affinity here: SeeSAR's HYDE needs a force field and a solvation model. These are geometric rules on the
// coordinates (no hydrogens), and the card says so.
var ELEM_MASS={H:1.008,C:12.011,N:14.007,O:15.999,F:18.998,P:30.974,S:32.06,CL:35.45,BR:79.904,I:126.904,B:10.81,SE:78.97,FE:55.845,ZN:65.38,MG:24.305,CA:40.078,NA:22.99,K:39.098,MN:54.938,CU:63.546};
var _site=null, _siteAll=false, _siteAuto={}, _allGrid=null;
function siteLigands(){   // {main: the ligands worth a site, largest first; other: additives, ions' neighbours and the small}
  var main=[], other=[];
  ligands.forEach(function(l){ (RB_ADDITIVES.indexOf(String(l.resn).toUpperCase())<0&&(l.n||0)>=6?main:other).push(l); });
  var bySize=function(a,b){ return (b.n||0)-(a.n||0); };
  main.sort(bySize); other.sort(bySize);
  if(!main.length&&other.length){ main=[other.shift()]; }   // an entry whose only ligand is glycerol still has a site
  return {main:main,other:other};
}
function sitePrimary(){ var L=siteLigands(); return L.main[0]||null; }
function _siteBonds(L,idx){   // the bonds inside the ligand: {a,b,order,ring}
  var inL={}; L.forEach(function(a){ inL[a.index]=1; });
  var out=[], seen={};
  L.forEach(function(a){ (a.bonds||[]).forEach(function(j,q){ if(!inL[j]) return; var k=a.index<j?a.index+'-'+j:j+'-'+a.index; if(seen[k]) return; seen[k]=1; out.push({a:a,b:idx[j],order:(a.bondOrder&&a.bondOrder[q])||1}); }); });
  out.forEach(function(e){   // a bond is in a ring when its ends are still joined without it
    var q=[e.a.index], vis={}; vis[e.a.index]=1; var ring=false;
    while(q.length&&!ring){ var u=idx[q.shift()]; (u.bonds||[]).forEach(function(j){ if(ring||!inL[j]) return; if((u===e.a&&j===e.b.index)||(u===e.b&&j===e.a.index)) return; if(j===e.b.index){ ring=true; return; } if(!vis[j]){ vis[j]=1; q.push(j); } }); }
    e.ring=ring;
  });
  return out;
}
function _sasaPer(src,grid,probe,points){   // the exposed area of each src atom among the atoms the grid holds
  var P=spherePoints(points||60), out=[], total=0;
  src.forEach(function(a){
    var R=atomR(a)+probe, nb=[]; grid.near(a.x,a.y,a.z,function(j){ var b=grid.atoms[j]; if(b===a) return; var s=R+atomR(b)+probe; if(_d(a,b)<s) nb.push(b); });
    var free=0; P.forEach(function(p){ var x=a.x+R*p[0], y=a.y+R*p[1], z=a.z+R*p[2]; if(!nb.some(function(b){ var r=atomR(b)+probe, dx=x-b.x, dy=y-b.y, dz=z-b.z; return dx*dx+dy*dy+dz*dz<r*r; })) free++; });
    var area=free/P.length*4*Math.PI*R*R; out.push(area); total+=area;
  });
  return {each:out,total:total};
}
function _siteGrid(){
  var key=currentPdbId+'|'+_frame; if(_allGrid&&_allGrid.key===key) return _allGrid;
  var all=heavy(currentModel.selectedAtoms({}).filter(function(a){ return WATER_RESN.indexOf(a.resn)<0; })), g=agrid(all,7); g.atoms=all;
  return (_allGrid={key:key,g:g,all:all});
}
function siteMetrics(l){
  var idx=_atomsByIndex(), L=heavy(currentModel.selectedAtoms(ligSel(l))), n=L.length, mw=l.mw||0, est=!mw;
  if(!mw){ L.forEach(function(a){ mw+=ELEM_MASS[(a.elem||'C').toUpperCase()]||12; }); }
  var bonds=_siteBonds(L,idx), deg={}; bonds.forEach(function(e){ deg[e.a.index]=(deg[e.a.index]||0)+1; deg[e.b.index]=(deg[e.b.index]||0)+1; });
  var amide=function(e){ var c=/^C$/i.test(e.a.elem||'')?e.a:/^C$/i.test(e.b.elem||'')?e.b:null, nn=/^N$/i.test(e.a.elem||'')?e.a:/^N$/i.test(e.b.elem||'')?e.b:null; if(!c||!nn) return false;
    return (c.bonds||[]).some(function(j,q){ var o=idx[j]; return o&&/^O$/i.test(o.elem||'')&&(c.bondOrder&&c.bondOrder[q])===2; }); };
  var rot=bonds.filter(function(e){ return e.order===1&&!e.ring&&(deg[e.a.index]||0)>1&&(deg[e.b.index]||0)>1&&!amide(e); }).length;
  var G=_siteGrid(), alone=agrid(L,7); alone.atoms=L;
  var A=_sasaPer(L,alone,1.4), C=_sasaPer(L,{near:G.g.near,atoms:G.all},1.4);
  var burial={}; L.forEach(function(a,i){ burial[a.index]=A.each[i]>0.01?Math.max(0,Math.min(1,1-C.each[i]/A.each[i])):0; });
  var clashes=clashCompute('lig:'+l.key,'protein');
  return {n:n,mw:mw,mwEst:est,rot:rot,buried:A.total>0?Math.max(0,1-C.total/A.total):0,burial:burial,clashes:clashes.clashes.length,clashList:clashes.clashes};
}
function siteRows(list){   // the interactions as one row per residue
  var by={}, order=[];
  list.forEach(function(x){
    var r=_isLigAtom(x.b)||(x.b.hetflag&&ionResn.indexOf(x.b.resn)>=0)?x.a:x.b; if(_isLigAtom(r)) r=x.b;
    var k=rKeyOf(r), row=by[k]; if(!row){ row=by[k]={k:k,chain:r.chain||'',resi:r.resi,resn:r.resn,atom:r,types:{},n:0,dmin:99,pair:x}; order.push(row); }
    var t=row.types[x.type]||(row.types[x.type]={n:0,d:99}); t.n++; if(x.d<t.d) t.d=x.d; row.n++; if(x.d<row.dmin){ row.dmin=x.d; row.pair=x; }
  });
  return order.sort(function(a,b){ return a.dmin-b.dmin; });
}
function siteNow(){
  var f=state.site; if(!f||!currentModel) return null;
  var l=ligands.filter(function(x){ return x.key===f.key; })[0]; if(!l) return null;
  var key=[l.key,currentPdbId,_frame,chainList.join(),Object.keys(state.hiddenChains).join(),state.pocketR].join('|');
  if(_site&&_site.key===key) return _site;
  var m=siteMetrics(l), L=heavy(currentModel.selectedAtoms(ligSel(l))), shell={}, G=agrid(L,Math.max(4,state.pocketR));
  currentModel.selectedAtoms({hetflag:false}).forEach(function(a){ if(state.hiddenChains[a.chain||'']) return; G.near(a.x,a.y,a.z,function(j){ if(_d(a,L[j])<=state.pocketR) shell[rKeyOf(a)]=1; }); });
  _site={key:key,lig:l,m:m,shell:shell,rows:null};
  return _site;
}
function siteSet(key){
  var l=ligands.filter(function(x){ return x.key===key; })[0]; if(!l) return false;
  var old=state.site&&state.site.key===key?state.site:{};
  state.site={key:key,focus:!!old.focus,burial:!!old.burial}; _site=null;
  interSet('lig:'+key,'protein');   // the lines, the sticks and the list below; the card is a reading of the same result
  renderSite(); return true;
}
function siteAuto(){   // the first time Analyse is opened for a structure: the ligand is chosen, the interactions are read
  if(!currentModel||!viewer||_siteAuto[currentPdbId]||state.inter||state.site) return;
  _siteAuto[currentPdbId]=1; var l=sitePrimary(); if(l) siteSet(l.key);
}
function siteFocus(on){
  var f=state.site; if(!f) return; f.focus=on; var l=ligands.filter(function(x){ return x.key===f.key; })[0]; if(!l) return;
  if(on) state.pockets[l.key]=true; else delete state.pockets[l.key];
  recolorStructure(); renderLigList(); renderSite();
  if(on) focusLigand(l); else fitToView();
}
function siteBurial(on){ if(!state.site) return; state.site.burial=on; recolorStructure(); renderSite(); }
function rbSiteKeys(){ var f=state.site; if(!f||!f.focus) return null; var s=siteNow(); return s?s.shell:null; }   // the residues kept in colour while the rest is dimmed
function rbBurialColor(a){ var f=state.site, s=f&&f.burial&&_site; if(!s) return null; var v=s.m.burial[a.index]; return v==null?null:_ramp(['#fff1c9','#7fc8b2','#1d6f7a'],v); }
function _typeDots(types){ return Object.keys(INTER_TYPES).filter(function(k){ return types[k]; }).map(function(k){ return '<i style="background:'+INTER_TYPES[k].c+'" title="'+escapeHtml(INTER_TYPES[k].n+' · '+types[k].d.toFixed(2)+' Å'+(types[k].n>1?' (+'+(types[k].n-1)+')':''))+'"></i>'; }).join(''); }
function renderSite(){
  var el=$('siteBody'); if(!el) return;
  var L=siteLigands(), all=L.main.concat(_siteAll?L.other:[]), f=state.site, s=f&&siteNow();
  diagHot(null);
  var chips=all.map(function(l){ var on=f&&f.key===l.key; return '<button type="button" class="it-chip'+(on?' on':'')+'" data-k="'+escapeHtml(l.key)+'" aria-pressed="'+!!on+'" title="'+escapeHtml(l.name||l.resn)+'"><b>'+escapeHtml(l.resn)+'</b> '+escapeHtml(chainTitle(l.chain).replace('Chain ',''))+' '+l.resi+' <em>'+(l.n||0)+' atoms</em></button>'; }).join('')
    +(L.other.length?'<button type="button" class="it-chip" id="siteMore">'+(_siteAll?'Hide':'+ '+L.other.length)+(_siteAll?'':' other')+'</button>':'');
  $('siteLigs').innerHTML=chips;
  var none=!ligands.length;
  $('siteNone').hidden=!none; $('siteLigsWrap').hidden=none; $('siteCard').hidden=none||!s;
  if(none||!s){ $('sum-site').textContent=''; $('siteDiag').hidden=true; $('diagBox').innerHTML=''; _diagLast=null; return; }
  var r=interNow(), list=r?r.list:[], types=f&&state.inter?state.inter.types:{}, shownList=list.filter(function(x){ return types[x.type]!==false; });
  var rows=siteRows(shownList), m=s.m;
  var by={}; list.forEach(function(x){ by[x.type]=(by[x.type]||0)+1; });
  $('siteStrip').innerHTML=[[m.n,'heavy atoms'],[(m.mwEst?'≈ ':'')+m.mw.toFixed(m.mwEst?0:1),m.mwEst?'mass, heavy atoms':'molecular weight'],[m.rot,'rotatable bonds'],[Math.round(m.buried*100)+' %','buried'],[m.clashes,m.clashes===1?'clash':'clashes'],[rows.length,'residues touching']]
    .map(function(t){ return '<div><b>'+t[0]+'</b><span>'+t[1]+'</span></div>'; }).join('');
  $('siteTypes').innerHTML=Object.keys(INTER_TYPES).filter(function(k){ return by[k]; }).map(function(k){ var t=INTER_TYPES[k], on=types[k]!==false;
    return '<button type="button" class="it-chip'+(on?' on':'')+'" data-t="'+k+'" aria-pressed="'+on+'"><i style="background:'+t.c+'"></i>'+t.n+' <b>'+by[k]+'</b></button>'; }).join('');
  $('siteList').innerHTML=rows.length?rows.map(function(x,i){ return '<div class="li site-row" data-i="'+i+'" data-k="'+escapeHtml(x.k)+'"><button type="button" class="li-main" data-i="'+i+'" title="Zoom to it · Shift-click to label it"><span class="li-name">'+escapeHtml(x.resn)+' '+x.resi+' <span style="font-weight:400;color:var(--text2)">· '+escapeHtml(chainTitle(x.chain).replace('Chain ',''))+'</span></span><span class="li-meta">'+x.n+(x.n===1?' contact':' contacts')+'</span></button><span class="site-pips">'+_typeDots(x.types)+'</span><span class="mono-v">'+x.dmin.toFixed(1)+' Å</span></div>'; }).join('')
    :'<div class="empty-note">'+(list.length?'Every kind is switched off.':'No contacts within the usual distances: this ligand is not held by the protein here, or it is far from it.')+'</div>';
  $('siteList').querySelectorAll('.li-main').forEach(function(b){ b.addEventListener('click',function(ev){ sitePick(rows[+b.dataset.i],ev.shiftKey); }); });
  $('siteFocus').setAttribute('aria-pressed',!!f.focus); $('siteFocus').classList.toggle('on',!!f.focus);
  $('siteBurial').setAttribute('aria-pressed',!!f.burial); $('siteBurial').classList.toggle('on',!!f.burial);
  $('site3d').checked=!state.inter||state.inter.show!==false;
  $('sum-site').textContent=s.lig.resn+' · '+rows.length+' residues';
  s.rows=rows; diagRender();
}
function sitePick(x,shift){   // a residue chosen in the table or in the picture: frame it with the ligand, or with Shift label it
  var s=_site; if(!s||!x) return; _userMoved=true;
  if(shift){ if(!state.residueLabels.some(function(y){ return y.chain===x.chain&&y.resi===x.resi; })) state.residueLabels.push({chain:x.chain,resi:x.resi,resn:x.resn,text:x.resn+' '+x.resi}); delete state.off.labels; renderLabelTags(); renderResLblList(); return; }
  fitView({focus:{or:[ligSel(s.lig),{chain:x.chain,resi:x.resi}]},animate:true,margin:0.3});
}
function siteCopy(){
  var s=_site; if(!s||!s.rows) return;
  var t='Residue\tChain\tInteractions\tNearest (Å)\tContacts\n'+s.rows.map(function(x){ return x.resn+' '+x.resi+'\t'+x.chain+'\t'+Object.keys(x.types).map(function(k){ return INTER_TYPES[k].n; }).join(', ')+'\t'+x.dmin.toFixed(2)+'\t'+x.n; }).join('\n');
  try{ navigator.clipboard.writeText(t).then(function(){ showToast('Copied '+s.rows.length+' residues.'); },function(){ showToast('The clipboard is not available here.'); }); }catch(e){ showToast('The clipboard is not available here.'); }
}
function siteWire(){
  $('siteLigs').addEventListener('click',function(e){ var m=e.target.closest('#siteMore'); if(m){ _siteAll=!_siteAll; renderSite(); return; } var b=e.target.closest('.it-chip[data-k]'); if(b) siteSet(b.dataset.k); });
  $('siteTypes').addEventListener('click',function(e){ var b=e.target.closest('.it-chip'); if(!b||!state.inter) return; state.inter.types[b.dataset.t]=state.inter.types[b.dataset.t]===false; recolorStructure(); interDraw(); viewer.render(); renderInter(); renderSite(); });
  $('site3d').addEventListener('change',function(e){ if(!state.inter) return; state.inter.show=e.target.checked; recolorStructure(); interDraw(); viewer.render(); });
  $('siteFocus').addEventListener('click',function(){ if(state.site) siteFocus(!state.site.focus); });
  $('siteBurial').addEventListener('click',function(){ if(state.site) siteBurial(!state.site.burial); });
  $('siteSel').addEventListener('click',function(){ var r=_site&&_site.rows; if(r) selSet(r.map(function(x){ return x.k; })); });
  $('siteLabel').addEventListener('click',function(){ var r=_site&&_site.rows; if(!r) return; r.slice(0,16).forEach(function(x){ if(!state.residueLabels.some(function(y){ return y.chain===x.chain&&y.resi===x.resi; })) state.residueLabels.push({chain:x.chain,resi:x.resi,resn:x.resn,text:x.resn+' '+x.resi}); }); delete state.off.labels; renderLabelTags(); renderResLblList(); showToast('Labelled '+Math.min(16,r.length)+' residues.'); });
  $('siteCopy').addEventListener('click',siteCopy);
}

// ── The 2D diagram ───────────────────────────────────────────────────────────────────────────────────────────────
// The picture a paper shows for a binding mode: the ligand drawn flat, the residues that hold it set round it, a dashed line for every
// interaction, coloured by kind. It is not a chemical drawing made from the bonds: the ligand's own coordinates are flattened onto the
// plane that holds most of it (the two largest axes of its atoms), then relaxed until the bonds are one length and no two atoms sit on
// each other — what a folded linker needs. Each residue is set on the side of the ligand where it really is and the boxes are pushed
// apart until none touches another or the ligand. Everything is one SVG string, so the picture on the card, the enlarged one and the
// file are the same thing. What it cannot do: it knows nothing of stereochemistry or of the ligand's chemistry beyond the bonds in the file.
function _eig3(M){   // Jacobi sweeps on a symmetric 3×3 → {val, vec} with the largest first; vec[i] is a unit vector
  var A=[M[0].slice(),M[1].slice(),M[2].slice()], V=[[1,0,0],[0,1,0],[0,0,1]], s, p, q, k;
  for(s=0;s<30;s++){
    if(Math.abs(A[0][1])+Math.abs(A[0][2])+Math.abs(A[1][2])<1e-12) break;
    for(p=0;p<2;p++) for(q=p+1;q<3;q++){
      if(Math.abs(A[p][q])<1e-15) continue;
      var th=(A[q][q]-A[p][p])/(2*A[p][q]), t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), sn=t*c, x, y;
      for(k=0;k<3;k++){ x=A[k][p]; y=A[k][q]; A[k][p]=c*x-sn*y; A[k][q]=sn*x+c*y; }
      for(k=0;k<3;k++){ x=A[p][k]; y=A[q][k]; A[p][k]=c*x-sn*y; A[q][k]=sn*x+c*y; }
      for(k=0;k<3;k++){ x=V[k][p]; y=V[k][q]; V[k][p]=c*x-sn*y; V[k][q]=sn*x+c*y; }
    }
  }
  var ev=[A[0][0],A[1][1],A[2][2]], ord=[0,1,2].sort(function(a,b){ return ev[b]-ev[a]; });
  return {val:ord.map(function(i){ return ev[i]; }),vec:ord.map(function(i){ return [V[0][i],V[1][i],V[2][i]]; })};
}
var DG_BOND=26;   // one bond, in the diagram's units (1 unit = 1 px at 100 %)
function _diagFlatten(L,bonds){   // L: the ligand's heavy atoms → {xy:[[x,y]], c, u, v, s}: where each atom goes in the picture
  var n=L.length, c=[0,0,0], i, j, pos={};
  L.forEach(function(a,q){ c[0]+=a.x; c[1]+=a.y; c[2]+=a.z; pos[a.index]=q; }); c=c.map(function(t){ return t/n; });
  var C=[[0,0,0],[0,0,0],[0,0,0]];
  L.forEach(function(a){ var p=[a.x-c[0],a.y-c[1],a.z-c[2]]; for(i=0;i<3;i++) for(j=0;j<3;j++) C[i][j]+=p[i]*p[j]/n; });
  var e=_eig3(C), u=e.vec[0], v=e.vec[1];
  var lens=bonds.map(function(b){ return _d(b.a,b.b); }).sort(function(a,b){ return a-b; }), med=lens.length?lens[lens.length>>1]:1.5, s=DG_BOND/Math.max(1,med);
  var X=L.map(function(a){ var p=[a.x-c[0],a.y-c[1],a.z-c[2]]; return [s*_dot(p,u),s*_dot(p,v)]; });
  var fx=X.filter(function(p){ return Math.abs(p[0])>2; })[0], fy=X.filter(function(p){ return Math.abs(p[1])>2; })[0];   // the hand is arbitrary: fix it, so that the same file always draws the same picture
  if(fx&&fx[0]>0){ u=u.map(function(t){ return -t; }); X.forEach(function(p){ p[0]=-p[0]; }); }
  if(fy&&fy[1]>0){ v=v.map(function(t){ return -t; }); X.forEach(function(p){ p[1]=-p[1]; }); }
  if(n<3) return {xy:X,c:c,u:u,v:v,s:s};
  var nb=L.map(function(){ return []; }); bonds.forEach(function(b){ var p=pos[b.a.index], q=pos[b.b.index]; if(p!=null&&q!=null){ nb[p].push(q); nb[q].push(p); } });
  var near=[], local={};   // pairs within three bonds keep their true separation as far as a flat page allows; the rest only keep apart
  for(i=0;i<n;i++){ var dep={}, fr=[i]; dep[i]=0; while(fr.length){ var u0=fr.shift(); if(dep[u0]>=3) continue; nb[u0].forEach(function(w){ if(dep[w]==null){ dep[w]=dep[u0]+1; fr.push(w); } }); }
    Object.keys(dep).forEach(function(k){ k=+k; if(k>i){ local[i*n+k]=1; near.push([i,k,s*_d(L[i],L[k]),dep[k]===1?1:dep[k]===2?0.6:0.3]); } }); }
  var X0=X.map(function(p){ return p.slice(); }), minD=DG_BOND*0.8, F=X.map(function(){ return [0,0]; }), it;
  for(it=0;it<260;it++){
    for(i=0;i<n;i++){ F[i][0]=(X0[i][0]-X[i][0])*0.03; F[i][1]=(X0[i][1]-X[i][1])*0.03; }
    near.forEach(function(r){ var a=r[0], b=r[1], dx=X[b][0]-X[a][0], dy=X[b][1]-X[a][1], d=Math.sqrt(dx*dx+dy*dy)||1e-6, k=(d-r[2])/d*0.5*r[3]; if(d<1e-5){ dx=1e-3*(a+1); dy=1e-3*(b+1); }
      F[a][0]+=k*dx; F[a][1]+=k*dy; F[b][0]-=k*dx; F[b][1]-=k*dy; });
    for(i=0;i<n;i++) for(j=i+1;j<n;j++){ if(local[i*n+j]) continue; var dx=X[j][0]-X[i][0], dy=X[j][1]-X[i][1], d=Math.sqrt(dx*dx+dy*dy);
      if(d<minD){ if(d<1e-5){ dx=1e-3*(i+1); dy=1e-3*(j+1); d=Math.sqrt(dx*dx+dy*dy); } var k=(d-minD)/d*0.5; F[i][0]+=k*dx; F[i][1]+=k*dy; F[j][0]-=k*dx; F[j][1]-=k*dy; } }
    var step=0.5; for(i=0;i<n;i++){ X[i][0]+=F[i][0]*step; X[i][1]+=F[i][1]*step; }
  }
  return {xy:X,c:c,u:u,v:v,s:s};
}
var DG_CLASS={ALA:'h',VAL:'h',LEU:'h',ILE:'h',MET:'h',PHE:'h',TRP:'h',PRO:'h',CYS:'h',SER:'p',THR:'p',ASN:'p',GLN:'p',TYR:'p',GLY:'p',HIS:'+',LYS:'+',ARG:'+',ASP:'-',GLU:'-'};
var DG_FILL={h:['#fbe9d3','#d9822b'],p:['#eceef3','#8b8d98'],'+':['#dfe6fb','#3e63dd'],'-':['#fadce9','#d6409f'],x:['#eadff5','#8e4ec6']};
var DG_KEY={h:'hydrophobic',p:'polar','+':'positive','-':'negative'};
var DG_ELEM={N:'#3e63dd',O:'#e5484d',S:'#b7791f',P:'#e8590c',F:'#12a594',CL:'#12a594',BR:'#a0522d',I:'#7b4bb7'};
function _diagOverlap(B,A,rA,pad){   // the first pair of boxes that touch, or a box on an atom; null when the picture is clean
  var i, j, p;
  for(i=0;i<B.length;i++){ for(j=i+1;j<B.length;j++){ if(Math.abs(B[i].x-B[j].x)<(B[i].w+B[j].w)/2+pad&&Math.abs(B[i].y-B[j].y)<(B[i].h+B[j].h)/2+pad) return [i,j]; }
    for(p=0;p<A.length;p++){ var qx=Math.max(B[i].x-B[i].w/2,Math.min(B[i].x+B[i].w/2,A[p][0])), qy=Math.max(B[i].y-B[i].h/2,Math.min(B[i].y+B[i].h/2,A[p][1])); if(Math.hypot(qx-A[p][0],qy-A[p][1])<rA+pad*0.5) return [i,-1-p]; } }
  return null;
}
function _diagSpread(B,support){   // boxes that want the same side are spread along the ligand in the order of their directions, so a crowd wraps round it instead of piling outwards
  var n=B.length, o=B.map(function(b,q){ return q; }), th=B.map(function(b){ return Math.atan2(b.uy,b.ux); }), TWO=2*Math.PI, it, k;
  if(n<2) return;
  o.sort(function(a,b){ return th[a]-th[b]; });
  var R=0; B.forEach(function(b){ R+=support(b.ux,b.uy)+30; }); R/=n;
  var need=function(a,b){ var t=(th[a]+th[b])/2, w=(B[a].w+B[b].w)/2, h=(B[a].h+B[b].h)/2; return (Math.abs(Math.sin(t))*w+Math.abs(Math.cos(t))*h+7)/R; };   // the arc two neighbours need
  for(it=0;it<300;it++){ var moved=0;
    for(k=0;k<n;k++){ var a=o[k], b=o[(k+1)%n], gap=th[b]-th[a]; if(k===n-1) gap+=TWO; var g=Math.min(need(a,b),TWO/n*0.98);
      if(gap<g){ var d=(g-gap)/2*0.5; th[a]-=d; th[b]+=d; moved++; } }
    if(!moved) break; }
  B.forEach(function(b,q){ b.ux=Math.cos(th[q]); b.uy=Math.sin(th[q]); });
}
function _diagPlace(B,A,rA){   // B: boxes {w,h,ux,uy} → x,y (centres): round the ligand on their own side, clear of each other and of its atoms
  var pad=7, n=B.length, i, j, p, it, grow=1, att;
  var support=function(ux,uy){ var m=0; A.forEach(function(q){ var t=q[0]*ux+q[1]*uy; if(t>m) m=t; }); return m+rA; };
  _diagSpread(B,support);
  for(att=0;att<8;att++){
    B.forEach(function(b,q){ var rho=support(b.ux,b.uy)+pad+Math.abs(b.ux)*b.w/2+Math.abs(b.uy)*b.h/2+10*grow; b.gx=b.ux*rho; b.gy=b.uy*rho; b.x=b.gx+(q%3-1)*0.5; b.y=b.gy+(q%5-2)*0.5; });
    for(it=0;it<420;it++){
      var pull=it<300?0.05*(1-it/300):0;
      for(i=0;i<n;i++){ for(j=i+1;j<n;j++){ var dx=B[j].x-B[i].x, dy=B[j].y-B[i].y, ox=(B[i].w+B[j].w)/2+pad-Math.abs(dx), oy=(B[i].h+B[j].h)/2+pad-Math.abs(dy);
          if(ox>0&&oy>0){ if(ox<oy){ var sx=dx>=0?1:-1; B[i].x-=sx*ox/2; B[j].x+=sx*ox/2; } else { var sy=dy>=0?1:-1; B[i].y-=sy*oy/2; B[j].y+=sy*oy/2; } } }
        for(p=0;p<A.length;p++){ var qx=Math.max(B[i].x-B[i].w/2,Math.min(B[i].x+B[i].w/2,A[p][0])), qy=Math.max(B[i].y-B[i].h/2,Math.min(B[i].y+B[i].h/2,A[p][1])), d=Math.hypot(qx-A[p][0],qy-A[p][1]), need=rA+pad;
          if(d<need){ var ex, ey; if(d>1e-6){ ex=(qx-A[p][0])/d; ey=(qy-A[p][1])/d; } else { ex=B[i].ux; ey=B[i].uy; } B[i].x+=ex*(need-d); B[i].y+=ey*(need-d); } }
        B[i].x+=(B[i].gx-B[i].x)*pull; B[i].y+=(B[i].gy-B[i].y)*pull; }
    }
    if(!_diagOverlap(B,A,rA,pad)) return;
    grow*=1.35;
  }
  // there was no room: set them evenly on a circle wide enough that neighbours cannot touch, in the order of their directions
  var order=B.map(function(b,q){ return q; }).sort(function(a,b){ return Math.atan2(B[a].uy,B[a].ux)-Math.atan2(B[b].uy,B[b].ux); }), md=0;
  B.forEach(function(b){ md=Math.max(md,b.w,b.h); });
  var R=Math.max((md+pad)*Math.SQRT2/(2*Math.sin(Math.PI/Math.max(2,n))),support(1,0)+md,support(-1,0)+md,support(0,1)+md,support(0,-1)+md);
  order.forEach(function(q,k){ var t=2*Math.PI*k/n; B[q].x=R*Math.cos(t); B[q].y=R*Math.sin(t); });
}
function _diagEdge(b,tx,ty){   // where the line from a box's middle to (tx,ty) leaves the box
  var dx=tx-b.x, dy=ty-b.y; if(!dx&&!dy) return [b.x,b.y];
  var k=Math.min(dx?(b.w/2)/Math.abs(dx):1e9,dy?(b.h/2)/Math.abs(dy):1e9); return [b.x+dx*k,b.y+dy*k];
}
var DG_CAP=26;   // residues drawn; the rest are named under the picture
function siteDiagram(){   // → {svg, w, h, boxes, atoms, bonds, lines, more} for the ligand of the Binding site card, or null
  var s=siteNow(); if(!s||!currentModel) return null;
  var r=interNow(), types=state.inter?state.inter.types:{}, list=(r?r.list:[]).filter(function(x){ return types[x.type]!==false; });
  var L=heavy(currentModel.selectedAtoms(ligSel(s.lig))); if(!L.length) return null;
  var idx=_atomsByIndex(), bonds=_siteBonds(L,idx), fl=_diagFlatten(L,bonds), pos={};
  L.forEach(function(a,q){ pos[a.index]=q; });
  var rows=siteRows(list), more=Math.max(0,rows.length-DG_CAP); rows=rows.slice(0,DG_CAP);
  var rowOf={}; rows.forEach(function(row){ rowOf[row.k]=row; row.links=[]; });
  list.forEach(function(x){ var la=_isLigAtom(x.a)?x.a:_isLigAtom(x.b)?x.b:null, ra=la===x.a?x.b:x.a; if(!la||pos[la.index]==null) return; var row=rowOf[rKeyOf(ra)]; if(!row) return;
    var have=row.links.filter(function(l){ return l.type===x.type; }); if(have.length>=2||have.some(function(l){ return l.atom===la.index; })) return; row.links.push({type:x.type,d:x.d,atom:la.index,ra:ra}); });
  var rA=DG_BOND*0.34, ctr=fl.xy.reduce(function(m,p){ return [m[0]+p[0]/fl.xy.length,m[1]+p[1]/fl.xy.length]; },[0,0]);
  var A=fl.xy.map(function(p){ return [p[0]-ctr[0],p[1]-ctr[1]]; });
  var chains=chainList.length>1, FS=12;
  var B=rows.map(function(row){
    var a=row.atom, lab=/^[A-Z]{3}$/.test(row.resn)&&DG_CLASS[row.resn]?row.resn.charAt(0)+row.resn.slice(1).toLowerCase():row.resn, t1=lab+' '+row.resi, ch=chains&&row.chain?' '+row.chain:'';
    var p=[a.x-fl.c[0],a.y-fl.c[1],a.z-fl.c[2]], ux=fl.s*_dot(p,fl.u)-ctr[0], uy=fl.s*_dot(p,fl.v)-ctr[1], m=Math.hypot(ux,uy);
    if(m<DG_BOND*0.9&&row.links.length){ var q=A[pos[row.links[0].atom]]; ux=q[0]; uy=q[1]; m=Math.hypot(ux,uy); }   // above or below the ligand: use the side of its nearest atom
    if(m<1e-6){ ux=1; uy=0; m=1; }
    return {k:row.k,row:row,text:t1,chain:ch,w:Math.round((t1.length+ch.length)*FS*0.58+16),h:FS+11,ux:ux/m,uy:uy/m,cls:DG_CLASS[row.resn]||(ionResn.indexOf(row.resn)>=0?'x':'p')};
  });
  _diagPlace(B,A,rA);
  // the drawing's bounds
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9, grow=function(x,y,r){ x0=Math.min(x0,x-r); y0=Math.min(y0,y-r); x1=Math.max(x1,x+r); y1=Math.max(y1,y+r); };
  A.forEach(function(p){ grow(p[0],p[1],rA+4); }); B.forEach(function(b){ x0=Math.min(x0,b.x-b.w/2); x1=Math.max(x1,b.x+b.w/2); y0=Math.min(y0,b.y-b.h/2); y1=Math.max(y1,b.y+b.h/2); });
  var present={}; rows.forEach(function(row){ row.links.forEach(function(l){ present[l.type]=1; }); });
  var keyT=Object.keys(INTER_TYPES).filter(function(k){ return present[k]; }), clsP={}; B.forEach(function(b){ if(DG_KEY[b.cls]) clsP[b.cls]=1; });
  var keyC=Object.keys(DG_KEY).filter(function(k){ return clsP[k]; });
  var M=18, minW=300, W=Math.max(minW,Math.ceil(x1-x0)+2*M), ox=-x0+(W-(x1-x0))/2;   // the picture is centred in at least a phone-card width
  // the key: lines first, then the box colours, wrapping at the width
  var kx=M, ky=0, KR=18, key=[], kw=function(t){ return t.length*6.4+36; };
  var place=function(w){ if(kx>M&&kx+w>W-M){ kx=M; ky+=KR; } var x=kx; kx+=w+10; return x; };
  keyT.forEach(function(k){ var w=kw(INTER_TYPES[k].n), x=place(w); key.push({t:'line',x:x,y:ky,c:INTER_TYPES[k].c,text:INTER_TYPES[k].n}); });
  keyC.forEach(function(k){ var w=kw(DG_KEY[k]), x=place(w); key.push({t:'box',x:x,y:ky,k:k,text:DG_KEY[k]}); });
  var keyH=key.length?ky+KR+10:0, H=Math.ceil(y1-y0)+2*M+keyH, oy=-y0+M, KY=Math.ceil(y1-y0)+2*M+4;
  var ink='#1a1d2e', ink2='#5a5f7a', font=_labelFontFamily();
  var X=function(v){ return +(v+ox).toFixed(1); }, Y=function(v){ return +(v+oy).toFixed(1); };
  var o=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" font-family="'+escapeHtml(font)+'" role="img" aria-label="'+escapeHtml('Interactions of '+s.lig.resn+' with the protein, drawn flat')+'">',
    '<rect width="'+W+'" height="'+H+'" fill="#ffffff"/>'];
  // bonds, shortened where an atom carries a letter
  var lab={}; L.forEach(function(a,q){ var el=(a.elem||'C').toUpperCase(); if(el!=='C') lab[q]=el; });
  var bondSvg=[];
  bonds.forEach(function(e){ var p=pos[e.a.index], q=pos[e.b.index], P=A[p], Q=A[q], dx=Q[0]-P[0], dy=Q[1]-P[1], d=Math.hypot(dx,dy)||1, ux=dx/d, uy=dy/d, cut=DG_BOND*0.3;
    var sx=P[0]+(lab[p]?ux*cut:0), sy=P[1]+(lab[p]?uy*cut:0), ex=Q[0]-(lab[q]?ux*cut:0), ey=Q[1]-(lab[q]?uy*cut:0), nx=-uy, ny=ux, k=e.order>=3?3:e.order===2?2:1, off=3;
    for(var t=0;t<k;t++){ var f=(t-(k-1)/2)*off; bondSvg.push('<line x1="'+X(sx+nx*f)+'" y1="'+Y(sy+ny*f)+'" x2="'+X(ex+nx*f)+'" y2="'+Y(ey+ny*f)+'"/>'); } });
  o.push('<g class="dg-bonds" stroke="'+ink+'" stroke-width="1.8" stroke-linecap="round">'+bondSvg.join('')+'</g>');
  // the interactions
  var lines=[], lnSvg=[];
  B.forEach(function(b){ b.row.links.forEach(function(l){ var P=A[pos[l.atom]], e=_diagEdge(b,P[0],P[1]), t=INTER_TYPES[l.type], dx=P[0]-e[0], dy=P[1]-e[1], d=Math.hypot(dx,dy)||1, stop=lab[pos[l.atom]]?DG_BOND*0.34:DG_BOND*0.12;
      var tx=P[0]-dx/d*stop, ty=P[1]-dy/d*stop, hy=l.type==='hydro';
      lines.push({k:b.k,type:l.type,d:l.d,x1:e[0],y1:e[1],x2:tx,y2:ty});
      lnSvg.push('<g class="dg-ln" data-k="'+escapeHtml(b.k)+'" data-t="'+l.type+'"><line x1="'+X(e[0])+'" y1="'+Y(e[1])+'" x2="'+X(tx)+'" y2="'+Y(ty)+'" stroke="'+t.c+'" stroke-width="'+(hy?1.2:1.9)+'" stroke-dasharray="'+(hy?'2 4':'6 4')+'" stroke-linecap="round"/>'
        +(hy?'':'<text x="'+X((e[0]+tx)/2)+'" y="'+Y((e[1]+ty)/2)+'" font-size="10" text-anchor="middle" dominant-baseline="central" fill="'+ink2+'" stroke="#ffffff" stroke-width="3.2" paint-order="stroke">'+l.d.toFixed(1)+'</text>')+'</g>'); }); });
  o.push('<g class="dg-links">'+lnSvg.join('')+'</g>');
  // the hetero atoms
  var atSvg=[]; L.forEach(function(a,q){ if(!lab[q]) return; var el=lab[q], c=DG_ELEM[el]||'#5a5f7a', t=el.charAt(0)+el.slice(1).toLowerCase();
    atSvg.push('<text x="'+X(A[q][0])+'" y="'+Y(A[q][1])+'" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="'+c+'">'+t+'</text>'); });
  o.push('<g class="dg-atoms">'+atSvg.join('')+'</g>');
  // the residues
  o.push('<g class="dg-resg">'+B.map(function(b){ var f=DG_FILL[b.cls]||DG_FILL.p, top=Object.keys(INTER_TYPES).filter(function(k){ return b.row.types[k]; })[0], sc=top?INTER_TYPES[top].c:f[1];
    return '<g class="dg-res" data-k="'+escapeHtml(b.k)+'" tabindex="0" role="button" aria-label="'+escapeHtml(b.text+b.chain+', '+b.row.n+(b.row.n===1?' contact':' contacts'))+'"><rect x="'+X(b.x-b.w/2)+'" y="'+Y(b.y-b.h/2)+'" width="'+b.w+'" height="'+b.h+'" rx="6" fill="'+f[0]+'" stroke="'+sc+'" stroke-width="1.6"/>'
      +'<text x="'+X(b.x)+'" y="'+Y(b.y)+'" font-size="'+FS+'" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="'+ink+'">'+escapeHtml(b.text)+(b.chain?'<tspan font-weight="400" fill="'+ink2+'">'+escapeHtml(b.chain)+'</tspan>':'')+'</text></g>'; }).join('')+'</g>');
  if(key.length) o.push('<g class="dg-key" font-size="11" fill="'+ink2+'">'+key.map(function(k){
    return k.t==='line'?'<line x1="'+(k.x)+'" y1="'+(KY+k.y+7)+'" x2="'+(k.x+20)+'" y2="'+(KY+k.y+7)+'" stroke="'+k.c+'" stroke-width="2" stroke-dasharray="6 3" stroke-linecap="round"/><text x="'+(k.x+26)+'" y="'+(KY+k.y+7)+'" dominant-baseline="central">'+escapeHtml(k.text)+'</text>'
      :'<rect x="'+k.x+'" y="'+(KY+k.y+1)+'" width="20" height="12" rx="3" fill="'+DG_FILL[k.k][0]+'" stroke="'+DG_FILL[k.k][1]+'" stroke-width="1.2"/><text x="'+(k.x+26)+'" y="'+(KY+k.y+7)+'" dominant-baseline="central">'+escapeHtml(k.text)+'</text>'; }).join('')+'</g>');
  o.push('</svg>');
  return {svg:o.join(''),w:W,h:H,ox:ox,oy:oy,boxes:B.map(function(b){ return {k:b.k,x:b.x,y:b.y,w:b.w,h:b.h}; }),atoms:L.map(function(a,q){ return {index:a.index,x:A[q][0],y:A[q][1],el:(a.elem||'C').toUpperCase()}; }),
    bonds:bonds.map(function(e){ return [pos[e.a.index],pos[e.b.index]]; }),lines:lines,more:more,rows:rows.length};
}
var _diagFlat=null;   // the flattening is the costly part and depends on the ligand only
function _diagName(ext){ var s=_site; return (currentPdbId||'structure').replace(/[\\/:*?"<>|\s]+/g,'_')+'_'+(s?s.lig.resn:'ligand')+'_interactions.'+ext; }
function diagRender(){
  var box=$('diagBox'); if(!box) return null;
  var d=null; try{ d=siteDiagram(); }catch(e){ d=null; }
  $('siteDiag').hidden=!d||!d.rows;
  box.innerHTML=d&&d.rows?d.svg:'';
  $('diagSum').textContent=d&&d.rows?d.rows+' residues'+(d.more?' · the '+d.more+' farthest are in the table':''):'';
  if($('diag-modal').classList.contains('open')) $('diagBig2').innerHTML=d&&d.rows?d.svg:'';
  _diagLast=d; return d;
}
var _diagLast=null, _dgHot=null, _dgShape=null, _dgT=0, _dgPrev=null;
function diagHot(k){   // the residue under the pointer, in the picture, the table and the structure
  if(k===_dgHot) return; _dgHot=k; clearTimeout(_dgT);
  [].forEach.call(document.querySelectorAll('.dg-res,.dg-ln,#siteList .site-row'),function(e){ e.classList.toggle('hl',k!=null&&e.getAttribute('data-k')===k); });
  var had=!!_dgShape; if(_dgShape){ try{ viewer.removeShape(_dgShape); }catch(e){} _dgShape=null; }
  var row=k&&_site&&_site.rows?_site.rows.filter(function(r){ return r.k===k; })[0]:null;
  if(!row||!viewer){ if(had&&viewer){ try{ viewer.render(); }catch(e){} } return; }
  _dgT=setTimeout(function(){ if(_dgHot!==k) return; try{ _dgShape=viewer.addSphere({center:{x:row.atom.x,y:row.atom.y,z:row.atom.z},radius:1.1,color:'#ffb000',alpha:0.5,clickable:false}); viewer.render(); }catch(e){} },80);
}
function diagOpen(){
  var d=diagRender(); if(!d||!d.rows){ showToast('Open Analyse and pick a ligand first.'); return; }
  $('dgLabbook').hidden=!hosted(); $('diagBig2').innerHTML=d.svg; $('diagBig2').firstChild.style.maxWidth=Math.round(d.w*1.7)+'px';
  _dgPrev=document.activeElement; $('diag-modal').classList.add('open'); $('dgPng').focus();
}
function diagClose(){ $('diag-modal').classList.remove('open'); if(_dgPrev&&_dgPrev.focus){ try{ _dgPrev.focus(); }catch(e){} } }
function diagSvg(){ var d=_diagLast||diagRender(); if(!d||!d.rows) return false; _saveBlob(new Blob([d.svg],{type:'image/svg+xml;charset=utf-8'}),_diagName('svg')); return true; }
function diagCanvas(cb,width){   // the picture as a canvas, 2400 px wide unless asked
  var d=_diagLast||diagRender(); if(!d||!d.rows){ cb(null); return; }
  var img=new Image(), url=URL.createObjectURL(new Blob([d.svg],{type:'image/svg+xml;charset=utf-8'}));
  img.onload=function(){ var k=(width||2400)/d.w, cv=document.createElement('canvas'); cv.width=Math.round(d.w*k); cv.height=Math.round(d.h*k);
    var x=cv.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,cv.width,cv.height); x.drawImage(img,0,0,cv.width,cv.height); URL.revokeObjectURL(url); cb(cv); };
  img.onerror=function(){ URL.revokeObjectURL(url); cb(null); };
  img.src=url;
}
function diagPng(){ diagCanvas(function(cv){ if(!cv){ showToast('The picture could not be made.'); return; } cv.toBlob(function(b){ if(b) _saveBlob(b,_diagName('png')); else showToast('The image is too large for this browser.'); },'image/png'); }); }
function diagLabbook(){
  diagCanvas(function(cv){ if(!cv||!_site) return; var s=_site, n=_diagLast?_diagLast.rows:0;
    if(_sendCanvasToLabbook(cv,_diagName('png'),s.lig.resn+' in '+(currentPdbId||'the structure')+': the '+n+' residues that touch it, drawn flat. Interactions are read from the coordinates (no hydrogens).',null)) diagClose(); });
}
function diagWire(){
  var over=function(e){ var g=e.target.closest&&e.target.closest('.dg-res,.site-row'); diagHot(g?g.getAttribute('data-k'):null); };
  var host=['diagBox','siteList'].map($);
  host.forEach(function(el){ el.addEventListener('mouseover',over); el.addEventListener('mouseleave',function(){ diagHot(null); }); el.addEventListener('focusin',over); el.addEventListener('focusout',function(){ diagHot(null); }); });
  var pick=function(e){ var g=e.target.closest('.dg-res'); if(!g){ if(e.target.closest('svg')) diagOpen(); return; } var row=_site&&_site.rows&&_site.rows.filter(function(r){ return r.k===g.getAttribute('data-k'); })[0]; if(row) sitePick(row,e.shiftKey); };
  $('diagBox').addEventListener('click',pick);
  $('diagBox').addEventListener('keydown',function(e){ if((e.key==='Enter'||e.key===' ')&&e.target.closest('.dg-res')){ e.preventDefault(); pick(e); } });
  $('diagBig').addEventListener('click',diagOpen); $('diagSvg').addEventListener('click',diagSvg); $('diagPng').addEventListener('click',diagPng);
  $('dgSvg').addEventListener('click',diagSvg); $('dgPng').addEventListener('click',diagPng); $('dgLabbook').addEventListener('click',diagLabbook);
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
  if(near){ var L=currentModel.selectedAtoms(ligSel(near)), best=-1; chainList.forEach(function(c){ if(lig.indexOf(c)>=0||chainInfo[c].type!=='protein') return; var n=0, A=polyAtoms(c), g=agrid(A,5); L.forEach(function(a){ g.near(a.x,a.y,a.z,function(j){ if(_d(a,A[j])<=5) n++; }); }); if(n>best){ best=n; tgt=c; } }); }
  tgt=tgt||chainList.filter(function(c){ return lig.indexOf(c)<0&&chainInfo[c].type==='protein'; })[0]||chainList[0];
  e3=e3||chainList.filter(function(c){ return c!==tgt; })[0];
  return {target:tgt,ligase:e3};
}
function nzExposure(nz,all,g,cell){   // the fraction of NZ's solvent sphere not buried by any other heavy atom
  var P=spherePoints(60), R=atomR(nz)+1.4, nb=[];
  g.near(nz.x,nz.y,nz.z,function(j){ var b=all[j]; if(b===nz) return; var s=R+atomR(b)+1.4; if(_d(nz,b)<s) nb.push(b); });
  var free=0; P.forEach(function(p){ var x=nz.x+R*p[0], y=nz.y+R*p[1], z=nz.z+R*p[2]; if(!nb.some(function(b){ var r=atomR(b)+1.4, dx=x-b.x, dy=y-b.y, dz=z-b.z; return dx*dx+dy*dy+dz*dz<r*r; })) free++; });
  return free/P.length;
}
var _lys=null;
function lysNow(){
  var f=state.lys; if(!f||!currentModel) return null;
  var key=f.target+'|'+f.ligase+'|'+currentPdbId+'|'+_frame; if(_lys&&_lys.key===key) return _lys;
  var all=heavy(currentModel.selectedAtoms({}).filter(function(a){ return WATER_RESN.indexOf(a.resn)<0; })), cell=7, g=agrid(all,cell);
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
// Not counted: atoms of one residue, and the peptide link between two neighbouring POLYMER residues. A ligand that shares a chain letter
// with the protein is not a neighbour of residue i±1 (the old rule dropped its real contacts with residues 200 and 202 for a ligand numbered 201).
function _covalentNeighbours(a,b){
  if((a.chain||'')!==(b.chain||'')) return false;
  if(a.resi===b.resi&&(a.icode||'')===(b.icode||'')) return true;
  return !a.hetflag&&!b.hetflag&&Math.abs(a.resi-b.resi)<=1;
}
function clashCompute(aSpec,bSpec){
  var A=heavy(_setAtoms(aSpec)), B=heavy(_setAtoms(bSpec)), Bi={}; B.forEach(function(b){ Bi[b.index]=1; });
  A=A.filter(function(a){ return !Bi[a.index]; });
  var g=agrid(B,4.5), cl=[], ct=0;
  A.forEach(function(a){ g.near(a.x,a.y,a.z,function(j){ var b=B[j];
    if(_covalentNeighbours(a,b)) return;
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
  var C=_clash.clashes, top=C.slice(0,30);
  el.innerHTML='<div class="ic-line"><b>'+C.length+'</b> '+(C.length===1?'clash':'clashes')+' · <b>'+_clash.contacts+'</b> contacts between '+escapeHtml(_setName(_clash.a))+' and '+escapeHtml(_setName(_clash.b))+'</div>'
    +(C.length?'<div class="list" id="clashList">'+top.map(function(x,i){ return '<div class="li" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="li-dot" style="background:#e5484d;cursor:default" aria-hidden="true"></span><button type="button" class="li-main" data-i="'+i+'" title="Zoom to this overlap"><span class="li-name">'+escapeHtml(_atomLabel(x.a))+'</span><span class="li-meta">with '+escapeHtml(_atomLabel(x.b))+'</span></button><span class="mono-v">'+x.ov.toFixed(2)+' Å</span></div>'; }).join('')+(C.length>30?'<div class="empty-note">+ '+(C.length-30)+' more, smaller overlaps, in the copied table.</div>':'')+'</div><div class="row"><button type="button" class="btn sm" id="clashCopy">Copy table</button></div>':'<div class="hint">Nothing overlaps by 0.6 Å or more.</div>');
  el.querySelectorAll('#clashList .li-main').forEach(function(b){ b.addEventListener('click',function(){ var x=top[+b.dataset.i]; _userMoved=true; fitView({focus:{index:[x.a.index,x.b.index]},animate:true,margin:0.4}); }); });
  var cp=el.querySelector('#clashCopy'); if(cp) cp.addEventListener('click',function(){ var t='Atom\tWith\tOverlap (Å)\n'+C.map(function(x){ return _atomLabel(x.a)+'\t'+_atomLabel(x.b)+'\t'+x.ov.toFixed(2); }).join('\n'); try{ navigator.clipboard.writeText(t).then(function(){ showToast('Copied '+C.length+' clashes.'); },function(){ showToast('The clipboard is not available here.'); }); }catch(e){ showToast('The clipboard is not available here.'); } });
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
function elecMap(){   // Coulomb's law with a distance-dependent dielectric (ε = 4r), from the charges of the residues alone, within 12 Å
  var key=currentPdbId+'|'+_frame+'|'+chainList.join(); if(_elec&&_elec.key===key) return _elec.m;
  var all=currentModel.selectedAtoms({}), Q=[], m={}, firstN={};
  all.forEach(function(a){ if(a.hetflag) return; var q=atomCharge(a); if(a.atom==='N'&&!firstN[a.chain||'']){ firstN[a.chain||'']=1; q=1; } if(q) Q.push({x:a.x,y:a.y,z:a.z,q:q,i:a.index}); });
  var g=agrid(Q,12);
  all.forEach(function(a){ var v=0; g.near(a.x,a.y,a.z,function(k){ var c=Q[k]; if(c.i===a.index) return; var dx=a.x-c.x, dy=a.y-c.y, dz=a.z-c.z, r2=dx*dx+dy*dy+dz*dz; if(r2>144) return; if(r2<1) r2=1; v+=83*c.q/r2; }); m[a.index]=v; });
  _elec={key:key,m:m}; return m;
}
function elecColor(a){ if(a.hetflag) return '#c9ccd6'; var v=elecMap()[a.index]||0; return _ramp(ELEC_STOPS,(v+10)/20); }

// ── Cavities: places in the protein a small molecule could sit ───────────────────────────────
// A grid over the visible protein; a point is a cavity point when it is outside every atom (plus a 1.4 Å probe) and protein lies within
// 8 Å along at least 10 of 14 directions. Points that touch are one cavity. Each is scored by volume × enclosure (how many of the 14
// directions are closed, on average) and says what lines it: a flat ranking by volume put a shallow groove above a closed pocket.
// It runs in slices (a generator, stepped for ~12 ms at a time) so a large structure no longer freezes the page; `pocketsFind()` runs it
// to the end for the command line and the tests.
var _pockets=null, _pocketShapes=[];
var HYDROPHOBIC_RES={ALA:1,VAL:1,LEU:1,ILE:1,MET:1,PHE:1,TRP:1,PRO:1,CYS:1}, CHARGED_RES={ASP:1,GLU:1,LYS:1,ARG:1};
function* _pocketsGen(){
  var A=heavy(currentModel.selectedAtoms({}).filter(function(a){ return !a.hetflag&&!state.hiddenChains[a.chain||'']; }));
  if(!A.length) return [];
  var h=1.0, x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9, i, j, k, q;
  A.forEach(function(a){ x0=Math.min(x0,a.x); y0=Math.min(y0,a.y); z0=Math.min(z0,a.z); x1=Math.max(x1,a.x); y1=Math.max(y1,a.y); z1=Math.max(z1,a.z); });
  var nx=Math.ceil((x1-x0)/h)+1, ny=Math.ceil((y1-y0)/h)+1, nz=Math.ceil((z1-z0)/h)+1;
  if(nx*ny*nz>2.5e6){ h=Math.cbrt((x1-x0)*(y1-y0)*(z1-z0)/2.5e6); nx=Math.ceil((x1-x0)/h)+1; ny=Math.ceil((y1-y0)/h)+1; nz=Math.ceil((z1-z0)/h)+1; }
  var N=nx*ny*nz, occ=new Uint8Array(N), core=new Uint8Array(N), I=function(i,j,k){ return (k*ny+j)*nx+i; };
  function* mark(arr,pad,what){   // every voxel within (atom radius + pad) of an atom
    var cnt=0;
    for(var ai=0;ai<A.length;ai++){ var a=A[ai], r=atomR(a)+pad, ri=Math.ceil(r/h), ci=Math.round((a.x-x0)/h), cj=Math.round((a.y-y0)/h), ck=Math.round((a.z-z0)/h);
      for(var i=ci-ri;i<=ci+ri;i++) for(var j=cj-ri;j<=cj+ri;j++) for(var k=ck-ri;k<=ck+ri;k++){ if(i<0||j<0||k<0||i>=nx||j>=ny||k>=nz) continue; var dx=x0+i*h-a.x, dy=y0+j*h-a.y, dz=z0+k*h-a.z; if(dx*dx+dy*dy+dz*dz<=r*r) arr[I(i,j,k)]=1; }
      if(++cnt>=1200){ cnt=0; yield what; } }
  }
  yield* mark(occ,1.4,'surface'); yield* mark(core,0,'atoms');
  var D=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]], steps=Math.round(8/h);
  var pk=new Uint8Array(N), enc=new Uint8Array(N), seen=0;
  for(k=1;k<nz-1;k++){ for(j=1;j<ny-1;j++) for(i=1;i<nx-1;i++){
    if(occ[I(i,j,k)]) continue;
    var hits=0;
    for(q=0;q<14&&hits+(14-q)>=10;q++){ var d=D[q]; for(var st=1;st<=steps;st++){ var a=i+d[0]*st, b=j+d[1]*st, c=k+d[2]*st; if(a<0||b<0||c<0||a>=nx||b>=ny||c>=nz) break; if(core[I(a,b,c)]){ hits++; break; } } }
    if(hits>=10){ pk[I(i,j,k)]=1; enc[I(i,j,k)]=hits; }
    seen++; }
    if(seen>6000){ seen=0; yield 'rays'; } }
  var lab=new Uint8Array(N), out=[], stack=new Int32Array(N), NB=[1,-1,nx,-nx,nx*ny,-nx*ny];
  for(var s0=0;s0<N;s0++){
    if(!pk[s0]||lab[s0]) continue;
    var top=0, pts=[], eSum=0; stack[top++]=s0; lab[s0]=1;
    var pops=0;
    while(top){ if(++pops>=30000){ pops=0; yield 'cavities'; } var u=stack[--top]; pts.push(u); eSum+=enc[u]; var ui=u%nx, uj=Math.floor(u/nx)%ny, uk=Math.floor(u/(nx*ny));
      for(var m=0;m<6;m++){ var ni=ui+(m===0?1:m===1?-1:0), nj=uj+(m===2?1:m===3?-1:0), nk=uk+(m===4?1:m===5?-1:0); if(ni<0||nj<0||nk<0||ni>=nx||nj>=ny||nk>=nz) continue; var w=I(ni,nj,nk); if(pk[w]&&!lab[w]){ lab[w]=1; stack[top++]=w; } } }
    if(pts.length*h*h*h>=30) out.push({idx:pts,enc:eSum/pts.length/14});
    if(out.length%4===0) yield 'cavities';
  }
  var gA=agrid(A,4), res=[];
  out.forEach(function(o){
    var P=o.idx.map(function(u){ var ui=u%nx, uj=Math.floor(u/nx)%ny, uk=Math.floor(u/(nx*ny)); return {x:x0+ui*h,y:y0+uj*h,z:z0+uk*h}; });
    var vol=P.length*h*h*h; res.push({pts:P,vol:vol,enc:o.enc,score:vol*o.enc});
  });
  res.sort(function(a,b){ return b.score-a.score; });
  return res.slice(0,8).map(function(r,n){
    var rs={}, names={}; r.pts.forEach(function(p){ gA.near(p.x,p.y,p.z,function(t){ if(_d(p,A[t])<=4){ var key=rKeyOf(A[t]); rs[key]=1; names[key]=A[t].resn; } }); });
    var keys=Object.keys(rs), c={h:0,p:0,c:0}; keys.forEach(function(kk){ var rn=names[kk]; if(HYDROPHOBIC_RES[rn]) c.h++; else if(CHARGED_RES[rn]) c.c++; else c.p++; });
    var tot=keys.length||1; c.h/=tot; c.p/=tot; c.c/=tot;
    var lig=ligands.filter(function(l){ return currentModel.selectedAtoms(ligSel(l)).some(function(a){ return r.pts.some(function(p){ return _d(p,a)<=2; }); }); }).map(function(l){ return l.resn; });
    return {n:n+1,pts:r.pts,vol:r.vol,enc:r.enc,score:r.score,res:keys,comp:c,lig:lig};
  });
}
function pocketsFind(){ var g=_pocketsGen(), r; do{ r=g.next(); }while(!r.done); return r.value; }
function pocketsFindAsync(onStep,done){
  var g=_pocketsGen(), t0=performance.now();
  (function slice(){
    var end=performance.now()+12, r;
    try{ do{ r=g.next(); }while(!r.done&&performance.now()<end); }catch(e){ console.error(e); done([],0); return; }
    if(r.done){ done(r.value,performance.now()-t0); return; }
    if(onStep) onStep(r.value); setTimeout(slice,0);
  })();
}
var POCKET_COLS=['#e5484d','#3e63dd','#30a46c','#f5a524','#8e4ec6','#12a594','#d6409f','#6e56cf'];
function pocketDraw(){
  if(!viewer) return; _pocketShapes.forEach(function(s){ try{ viewer.removeShape(s); }catch(e){} }); _pocketShapes=[];
  if(!_pockets||!_pockets.show) return;
  _pockets.list.forEach(function(p,i){ if(_pockets.only!=null&&_pockets.only!==i) return; var step=Math.max(1,Math.ceil(p.pts.length/150));
    for(var q=0;q<p.pts.length;q+=step){ try{ _pocketShapes.push(viewer.addSphere({center:p.pts[q],radius:Math.min(0.9,0.42*Math.cbrt(step)),color:POCKET_COLS[i%POCKET_COLS.length],opacity:0.7,clickable:false})); }catch(e){} } });
}
// "FWZ ×2, EDO ×5", not the same name once per copy: a pocket in a crystal with ten glycerols listed them ten times
function pocketLigText(l){ var n={}, o=[]; (l||[]).forEach(function(x){ if(!n[x]){ n[x]=0; o.push(x); } n[x]++; }); return o.map(function(x){ return n[x]>1?x+' ×'+n[x]:x; }).join(', '); }
function _compBar(c){ return '<span class="comp" title="Lined by '+Math.round(c.h*100)+' % hydrophobic, '+Math.round(c.p*100)+' % polar, '+Math.round(c.c*100)+' % charged residues"><i style="flex:'+c.h+';background:#d9822b"></i><i style="flex:'+c.p+';background:#8b8d98"></i><i style="flex:'+c.c+';background:#3e63dd"></i></span>'; }
function renderPockets(){
  var el=$('pocketList'); if(!el) return;
  if(!_pockets){ el.innerHTML='<div class="empty-note">Press Find cavities: a large structure takes a few seconds, and the page stays usable.</div>'; return; }
  if(!_pockets.list.length){ el.innerHTML='<div class="empty-note">No buried cavity of 30 Å³ or more in the chains shown.</div>'; return; }
  el.innerHTML=_pockets.list.map(function(p,i){ return '<div class="li'+(_pockets.only!=null&&_pockets.only!==i?' off':'')+'" style="grid-template-columns:auto minmax(0,1fr) auto auto"><span class="li-dot" style="background:'+POCKET_COLS[i%POCKET_COLS.length]+';cursor:default" aria-hidden="true"></span><button type="button" class="li-main" data-i="'+i+'"><span class="li-name">Cavity '+p.n+(p.lig.length?' <span style="font-weight:400;color:var(--text2)">· holds '+escapeHtml(pocketLigText(p.lig))+'</span>':'')+'</span><span class="li-meta">'+Math.round(p.vol)+' Å³ · '+Math.round(p.enc*100)+' % enclosed · '+p.res.length+' residues</span></button>'+_compBar(p.comp)+'<button type="button" class="ibtn pk-sel" data-i="'+i+'" title="Select its residues" aria-label="Select the residues of cavity '+p.n+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4.2 4.2L19 6.5"/></svg></button></div>'; }).join('');
  el.querySelectorAll('.li-main').forEach(function(b){ b.addEventListener('click',function(){ var i=+b.dataset.i; _pockets.only=_pockets.only===i?null:i; pocketDraw(); viewer.render(); renderPockets(); var p=_pockets.list[i]; if(_pockets.only===i){ _userMoved=true; selSet(p.res); fitView({focus:selSpec3D(),animate:true,margin:0.2}); } }); });
  el.querySelectorAll('.pk-sel').forEach(function(b){ b.addEventListener('click',function(){ selSet(_pockets.list[+b.dataset.i].res); showToast('Selected the '+_pockets.list[+b.dataset.i].res.length+' residues lining cavity '+(+b.dataset.i+1)+'.'); }); });
}
function pocketsRun(){
  if(!currentModel) return;
  var btn=$('pocketGo'); btn.disabled=true; btn.textContent='Looking…';
  pocketsFindAsync(function(step){ $('pocketProg').textContent='Looking… ('+step+')'; },function(L,ms){
    _pockets={list:L,show:true,only:null,ms:ms}; pocketDraw(); viewer.render(); renderPockets();
    btn.disabled=false; btn.textContent='Find again'; $('pocketProg').textContent=L.length?L.length+(L.length===1?' cavity':' cavities')+' in '+(ms/1000).toFixed(1)+' s.':''; updateSummaries();
  });
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
function analyseReset(){ _site=null; _allGrid=null; _inter=null; _lys=null; _clash=null; _pockets=null; _pae=null; _elec=null; _interShapes=[]; _clashShapes=[]; _pocketShapes=[]; }   // the viewer was cleared: the shapes went with it
function analyseOnModel(){ document.body.classList.toggle('rb-af',isAF()); renderSite(); interFill(); lysFill(); clashFill(); renderInter(); renderLys(); renderClash(); renderPockets(); paeLoad(); }
function analyseWire(){
  siteWire(); diagWire();
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
DESIGN_KEYS.push('inter','lys','site');
RB_CMDS.push(
  {n:['site','bindingsite','sites'],d:'The binding site of a ligand: what holds it, residue by residue',f:'site · site MZ1',
   args:function(){ return siteLigands().main.concat(siteLigands().other).map(function(l){ return _cand(l.resn,'lig',l.name||'ligand'); }); },
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().toUpperCase(), L=siteLigands(), l=w?L.main.concat(L.other).filter(function(x){ return x.resn.toUpperCase()===w; })[0]:L.main[0];
     if(!l) return _err(ligands.length?'site <ligand code>':'This structure has no ligand.'); siteSet(l.key); rbTab('analyse'); rbOpenSec('site'); var s=siteNow(); return _ok(l.resn+': '+(s&&s.rows?s.rows.length:0)+' residues touch it.'); }},
  {n:['diagram','plot2d','flat'],d:'The ligand and what holds it, drawn flat: a figure for a paper',f:'diagram · diagram svg · diagram png',
   args:function(pos){ return pos===0?[_cand('svg','word','save it as a vector figure'),_cand('png','word','save it as an image')]:[]; },
   run:function(a){ var n=needModel(); if(n) return n; if(!state.site){ var l=sitePrimary(); if(!l) return _err('This structure has no ligand.'); siteSet(l.key); }
     var w=a.trim().toLowerCase(); rbTab('analyse'); rbOpenSec('site'); var d=diagRender(); if(!d||!d.rows) return _err('Nothing touches this ligand within the usual distances.');
     if(w==='svg'){ diagSvg(); return _ok('Saved the diagram as an SVG.'); } if(w==='png'){ diagPng(); return _ok('Saving the diagram as a PNG.'); }
     diagOpen(); return _ok(d.rows+' residues, drawn flat.'); }},
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
  {n:['cavities','pockets','cavity'],d:'Find buried cavities a small molecule could sit in',f:'cavities',
   run:function(){ var n=needModel(); if(n) return n; rbOpenSec('pockets'); pocketsRun(); return _ok('Looking for cavities…'); }},
  {n:['confident','plddt'],d:'Hide the residues AlphaFold is not sure of',f:'confident 70 · confident off',
   run:function(a){ var n=needModel(); if(n) return n; if(!isAF()&&!/off/i.test(a)) return _err('This is not an AlphaFold model.');
     if(/off/i.test(a)){ state.hide=(state.hide||[]).filter(function(x){ return x!==_plddtHide; }); _plddtHide=null; recolorStructure(); return _ok('Showing every residue.'); }
     var c=parseFloat(a)||70; var k=confidentOnly(c); return _ok('Hid '+k+' residues under '+c+'.'); }}
);
COLOR_SCHEMES.hydrophobicity='hydro'; COLOR_SCHEMES.hydrophobic='hydro'; COLOR_SCHEMES.hydro='hydro'; COLOR_SCHEMES.kd='hydro';
COLOR_SCHEMES.charge='elec'; COLOR_SCHEMES.electrostatic='elec'; COLOR_SCHEMES.electrostatics='elec'; COLOR_SCHEMES.coulombic='elec'; COLOR_SCHEMES.elec='elec';
