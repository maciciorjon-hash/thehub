// ── The selection language ──────────────────────────────────────────────────────────────────
// Words a person would use, and the ChimeraX and PyMOL spellings for the same things, so nobody has to learn a third:
//   chain A · A · /A · resi 45-60 · 45-60 · A:45-60 · /A:45-60 · :45 · lys · resn LYS,ARG · name CA · @CA · ligand · ions · waters
//   protein · nucleic · backbone · sidechain · helix · strand · loop · hydrophobic · polar · charged · basic · acidic · aromatic
//   sel · all · interface · pocket · visible · within 5 of ligand · byres …  ·  and / or / not ( ), and words side by side mean "and".
// It evaluates to atoms; a command that acts on residues takes the residues those atoms are in.
var SPEC_CLASSES={
  hydrophobic:['ALA','VAL','LEU','ILE','MET','PHE','TRP','PRO','CYS'], polar:['SER','THR','ASN','GLN','TYR','CYS','HIS'],
  charged:['ASP','GLU','LYS','ARG','HIS'], basic:['LYS','ARG','HIS'], positive:['LYS','ARG','HIS'], acidic:['ASP','GLU'], negative:['ASP','GLU'],
  aromatic:['PHE','TRP','TYR','HIS'], small:['GLY','ALA','SER','CYS','THR','PRO']
};
var SPEC_ALIAS={chain:'chain',chains:'chain','c.':'chain',resi:'resi',res:'resi',residue:'resi',residues:'resi','i.':'resi',resn:'resn',resname:'resn','r.':'resn',
  name:'name',atom:'name',atoms:'name','n.':'name',elem:'elem',element:'elem','e.':'elem',ligand:'ligand',ligands:'ligand',lig:'ligand',ligs:'ligand',organic:'ligand',
  ion:'ions',ions:'ions',metal:'ions',metals:'ions',water:'waters',waters:'waters',solvent:'waters',hoh:'waters',wat:'waters',protein:'protein',polymer:'protein',
  nucleic:'nucleic',dna:'nucleic',rna:'nucleic',backbone:'backbone',bb:'backbone',mainchain:'backbone',sidechain:'sidechain',sidechains:'sidechain',sc:'sidechain',
  helix:'helix',helices:'helix',helical:'helix',strand:'strand',strands:'strand',sheet:'strand',sheets:'strand',beta:'strand',coil:'coil',coils:'coil',loop:'coil',loops:'coil',
  sel:'sel',selection:'sel',selected:'sel',sele:'sel',all:'all','*':'all',everything:'all',interface:'interface',pocket:'pocket',pockets:'pocket',visible:'visible',shown:'visible',
  within:'within',around:'within',near:'within',byres:'byres',br:'byres',hetatm:'hetatm',het:'hetatm',
  and:'and','&':'and',or:'or','|':'or',not:'not','!':'not','~':'not',of:'of'};
Object.keys(SPEC_CLASSES).forEach(function(k){ SPEC_ALIAS[k]=k; });
SPEC_ALIAS.lysines='lys';
var SPEC_WORDS=['chain','resi','resn','name','elem','ligand','ions','waters','protein','nucleic','backbone','sidechain','helix','strand','coil','hydrophobic','polar','charged','basic','acidic','aromatic','small','sel','all','interface','pocket','visible','within','byres','hetatm','and','or','not'];
var SPEC_HELP={chain:'chain A, or /A',resi:'residue numbers, 45-60,70',resn:'residue names, LYS,ARG',name:'atom names, CA,CB',elem:'elements, S,FE',ligand:'every ligand',ions:'metal ions',waters:'water molecules',
  protein:'protein chains',nucleic:'DNA and RNA',backbone:'N, CA, C, O',sidechain:'side chains',helix:'α-helices',strand:'β-strands',coil:'loops',hydrophobic:'A V L I M F W P C',polar:'S T N Q Y C H',
  charged:'D E K R H',basic:'K R H',acidic:'D E',aromatic:'F W Y H',small:'G A S C T P',sel:'what is selected now',all:'everything',interface:'the interface of the two chains in Analyse',
  pocket:'residues around the ligands',visible:'what is drawn',within:'within 5 of ligand',byres:'whole residues of …',hetatm:'every hetero atom',and:'both',or:'either',not:'everything but'};
function _isRangeTok(t){ return /^-?\d+[A-Za-z]?(?:\s*[-–]\s*-?\d+[A-Za-z]?)?(?:,-?\d+[A-Za-z]?(?:[-–]-?\d+[A-Za-z]?)?)*$/.test(t); }
function _rangesOf(t){   // "45-60,70" → [[45,60],[70,70]]
  return t.split(',').filter(Boolean).map(function(p){ var m=/^(-?\d+)[A-Za-z]?(?:[-–](-?\d+)[A-Za-z]?)?$/.exec(p.trim()); if(!m) return null; var a=+m[1], b=m[2]!=null?+m[2]:a; return a<=b?[a,b]:[b,a]; }).filter(Boolean);
}
function _inRanges(v,R){ for(var i=0;i<R.length;i++) if(v>=R[i][0]&&v<=R[i][1]) return true; return false; }
function specTokens(text){
  var T=[], re=/\s*(\(|\)|&|\||!|~|"[^"]*"|'[^']*'|[^\s()&|!~]+)/g, m;
  while((m=re.exec(text))){ if(!m[1]) break; T.push(m[1]); }
  return T;
}
function specLigKey(l){ return l.resn+':'+l.chain+':'+l.resi; }
// → {test:function(atom), err?} — a predicate over atoms
function specParse(text){
  var T=specTokens(String(text||'')), i=0, err=null;
  var lig={}; ligands.forEach(function(l){ lig[specLigKey(l)]=1; });
  var ligResn={}; ligands.forEach(function(l){ ligResn[l.resn.toUpperCase()]=1; });
  var allResn={}; if(currentModel) currentModel.selectedAtoms({}).forEach(function(a){ allResn[a.resn.toUpperCase()]=1; });
  function low(t){ return t==null?'':String(t).toLowerCase(); }
  function word(t){ return SPEC_ALIAS[low(t)]||null; }
  function fail(m){ if(!err) err=m; i=T.length; return function(){ return false; }; }   // stop reading: a parse that fails must not loop
  function list(){ var t=T[i++]; if(t==null) return null; return String(t).replace(/^["']|["']$/g,'').split(',').map(function(x){ return x.trim(); }).filter(Boolean); }
  function isLigand(a){ return !!lig[a.resn+':'+(a.chain||'')+':'+a.resi]; }
  function primary(){
    var t=T[i];
    if(t==null) return fail('Something is missing after “'+(T[i-1]||'')+'”.');
    if(t==='('){ i++; var e=orE(); if(T[i]!==')') return fail('A “(” is never closed.'); i++; return e; }
    var w=word(t), m;
    if(/^[A-Z0-9]{2,3}$/.test(t)&&ligResn[t]){ i++; return function(a){ return a.resn.toUpperCase()===t&&isLigand(a); }; }   // a ligand code typed as it is written (LIG) beats a word it happens to spell
    // ChimeraX / our own forms first
    if((m=/^\/([A-Za-z0-9]{1,4}(?:,[A-Za-z0-9]{1,4})*)(?::(.+?))?(?:@([A-Za-z0-9*',]+))?$/.exec(t))){ i++; var cs=m[1].split(','), R=m[2]&&_isRangeTok(m[2])?_rangesOf(m[2]):null, rn=m[2]&&!R?m[2].toUpperCase().split(','):null, nm=m[3]?m[3].toUpperCase().split(','):null;
      return function(a){ return cs.indexOf(a.chain||'')>=0&&(!R||_inRanges(a.resi,R))&&(!rn||rn.indexOf(a.resn.toUpperCase())>=0)&&(!nm||nm.indexOf(String(a.atom).toUpperCase())>=0); }; }
    if((m=/^([A-Za-z0-9]{1,4}):(-?\d[\d,\-–A-Za-z]*)(?:@([A-Za-z0-9*',]+))?$/.exec(t))&&chainList.indexOf(m[1])>=0){ i++; var R2=_rangesOf(m[2]), ch2=m[1], nm2=m[3]?m[3].toUpperCase().split(','):null;
      return function(a){ return (a.chain||'')===ch2&&_inRanges(a.resi,R2)&&(!nm2||nm2.indexOf(String(a.atom).toUpperCase())>=0); }; }
    if((m=/^:(.+?)(?:@([A-Za-z0-9*',]+))?$/.exec(t))){ i++; var r3=_isRangeTok(m[1])?_rangesOf(m[1]):null, n3=r3?null:m[1].toUpperCase().split(','), a3=m[2]?m[2].toUpperCase().split(','):null;
      return function(a){ return (r3?_inRanges(a.resi,r3):n3.indexOf(a.resn.toUpperCase())>=0)&&(!a3||a3.indexOf(String(a.atom).toUpperCase())>=0); }; }
    if((m=/^@([A-Za-z0-9*',]+)$/.exec(t))){ i++; var a4=m[1].toUpperCase().split(','); return function(a){ return a4.indexOf(String(a.atom).toUpperCase())>=0; }; }
    if(_isRangeTok(t)&&!w){ i++; var R5=_rangesOf(t); return function(a){ return _inRanges(a.resi,R5); }; }
    if(w==='chain'){ i++; var c=list(); if(!c) return fail('Which chain? e.g. chain A'); var bad=c.filter(function(x){ return chainList.indexOf(x)<0&&chainList.map(low).indexOf(low(x))<0; }); if(bad.length) return fail('There is no chain “'+bad[0]+'” here (chains: '+chainList.join(', ')+').');
      var cc=c.map(function(x){ return chainList.indexOf(x)>=0?x:chainList.filter(function(y){ return low(y)===low(x); })[0]; }); return function(a){ return cc.indexOf(a.chain||'')>=0; }; }
    if(w==='resi'){ i++; var r=T[i++]; if(r==null||!_isRangeTok(r)) return fail('resi wants numbers: resi 45-60,70'); var R6=_rangesOf(r); return function(a){ return _inRanges(a.resi,R6); }; }
    if(w==='resn'){ i++; var n=list(); if(!n) return fail('resn wants residue names: resn LYS,ARG'); n=n.map(function(x){ return x.toUpperCase(); }); return function(a){ return n.indexOf(a.resn.toUpperCase())>=0; }; }
    if(w==='name'){ i++; var nn=list(); if(!nn) return fail('name wants atom names: name CA'); nn=nn.map(function(x){ return x.toUpperCase(); }); return function(a){ return nn.indexOf(String(a.atom).toUpperCase())>=0; }; }
    if(w==='elem'){ i++; var ee=list(); if(!ee) return fail('elem wants elements: elem S'); ee=ee.map(function(x){ return x.toUpperCase(); }); return function(a){ return ee.indexOf(String(a.elem||'').toUpperCase())>=0; }; }
    if(w==='within'){ i++; var d=parseFloat(T[i]); if(!(d>0&&d<=40)) return fail('within wants a distance in Å: within 5 of ligand'); i++; if(word(T[i])==='of') i++; var inner=primaryNot(); return withinOf(d,inner,false); }
    if(w==='byres'){ i++; var inn=primaryNot(); return byres(inn); }
    if(w&&SPEC_CLASSES[w]){ i++; var rs=SPEC_CLASSES[w]; return function(a){ return !a.hetflag&&rs.indexOf(a.resn)>=0; }; }
    if(w==='ligand'){ i++; return function(a){ return isLigand(a); }; }
    if(w==='ions'){ i++; return function(a){ return a.hetflag&&ionResn.indexOf(a.resn)>=0; }; }
    if(w==='waters'){ i++; return function(a){ return WATER_RESN.indexOf(a.resn)>=0; }; }
    if(w==='hetatm'){ i++; return function(a){ return !!a.hetflag; }; }
    if(w==='protein'){ i++; return function(a){ var ci=chainInfo[a.chain||'']; return ci&&ci.type==='protein'&&!isLigand(a)&&WATER_RESN.indexOf(a.resn)<0&&!(a.hetflag&&ionResn.indexOf(a.resn)>=0); }; }
    if(w==='nucleic'){ i++; return function(a){ var ci=chainInfo[a.chain||'']; return ci&&ci.type==='nucleic'&&!isLigand(a)&&WATER_RESN.indexOf(a.resn)<0; }; }
    if(w==='backbone'){ i++; var BB=['N','CA','C','O','P',"O5'","C5'","C4'","C3'","O3'"]; return function(a){ return !isLigand(a)&&BB.indexOf(a.atom)>=0; }; }
    if(w==='sidechain'){ i++; var B2=['N','CA','C','O','OXT']; return function(a){ return !a.hetflag&&B2.indexOf(a.atom)<0; }; }
    if(w==='helix'){ i++; return function(a){ return a.ss==='h'; }; }
    if(w==='strand'){ i++; return function(a){ return a.ss==='s'; }; }
    if(w==='coil'){ i++; return function(a){ return !a.hetflag&&a.ss!=='h'&&a.ss!=='s'; }; }
    if(w==='sel'){ i++; return function(a){ return !!_sel[rKeyOf(a)]; }; }
    if(w==='all'){ i++; return function(){ return true; }; }
    if(w==='visible'){ i++; return function(a){ return !state.hiddenChains[a.chain||'']&&(WATER_RESN.indexOf(a.resn)<0||state.showWaters)&&(!isLigand(a)||state.showLigands); }; }
    if(w==='interface'){ i++; var ic=state.iface&&ifaceNow(); if(!ic) return fail('No interface yet — choose two chains under Analyse → Interface, or type: interface A B'); var ra={}; [state.iface.a,state.iface.b].forEach(function(ch){ ifaceResidues(ic,ch).forEach(function(r){ ra[ch+'|'+r]=1; }); }); return function(a){ return !!ra[(a.chain||'')+'|'+a.resi]; }; }
    if(w==='pocket'){ i++; var ls=ligands; if(T[i]&&ligResn[String(T[i]).toUpperCase()]){ var only=String(T[i++]).toUpperCase(); ls=ligands.filter(function(l){ return l.resn.toUpperCase()===only; }); }
      if(!ls.length) return fail('There are no ligands here.'); var lp=function(a){ return ls.some(function(l){ return a.resn===l.resn&&(a.chain||'')===l.chain&&a.resi===l.resi; }); };
      return byres(withinOf(state.pocketR||5,lp,true)); }
    if(w==='not'||w==='and'||w==='or'||w==='of') return fail('“'+t+'” needs something on each side.');
    // a bare chain id, a ligand code, a residue name
    if(chainList.indexOf(t)>=0&&/^[A-Za-z0-9]{1,4}$/.test(t)){ i++; return function(a){ return (a.chain||'')===t; }; }
    var up=String(t).toUpperCase();
    if(ligResn[up]){ i++; return function(a){ return a.resn.toUpperCase()===up&&isLigand(a); }; }
    if(AA3[up]||allResn[up]||(up.length===3&&SPEC_ALIAS[low(t)]==='lys')){ i++; var rr=up==='LYSINES'?'LYS':up; return function(a){ return a.resn.toUpperCase()===rr; }; }
    if(up==='LYSINES'){ i++; return function(a){ return a.resn==='LYS'; }; }
    var near=specSuggest(t);
    return fail('I do not know “'+t+'”.'+(near?' Did you mean '+near+'?':''));
  }
  function primaryNot(){ var t=T[i]; if(word(t)==='not'){ i++; var e=primaryNot(); return function(a){ return !e(a); }; } return primary(); }
  function andE(){
    var e=primaryNot();
    while(!err&&i<T.length&&T[i]!==')'&&word(T[i])!=='or'){
      if(word(T[i])==='and') i++;
      var r=primaryNot(), l=e; e=(function(l,r){ return function(a){ return l(a)&&r(a); }; })(l,r);
    }
    return e;
  }
  function orE(){ var e=andE(); while(!err&&word(T[i])==='or'){ i++; var r=andE(), l=e; e=(function(l,r){ return function(a){ return l(a)||r(a); }; })(l,r); } return e; }
  function byres(inner){ var cache=null; return function(a){ if(!cache){ cache={}; currentModel.selectedAtoms({}).forEach(function(x){ if(inner(x)) cache[rKeyOf(x)]=1; }); } return !!cache[rKeyOf(a)]; }; }
  function withinOf(d,inner,exclude){
    var cache=null;
    return function(a){
      if(!cache){
        cache={}; var all=currentModel.selectedAtoms({}), src=all.filter(inner), g=gridOf(src,d), d2=d*d;
        all.forEach(function(x){ if(exclude&&inner(x)) return; if(WATER_RESN.indexOf(x.resn)>=0&&!state.showWaters) return; var hit=false; gridNear(g,d,x.x,x.y,x.z,function(j){ if(!hit){ var y=src[j], dx=x.x-y.x, dy=x.y-y.y, dz=x.z-y.z; if(dx*dx+dy*dy+dz*dz<=d2) hit=true; } }); if(hit) cache[x.index]=1; });
      }
      return !!cache[a.index];
    };
  }
  if(!T.length) return {err:'Say what: e.g. chain A, ligand, within 5 of ligand.'};
  var test=orE();
  if(!err&&i<T.length) err='I did not understand “'+T.slice(i).join(' ')+'”.';
  return err?{err:err}:{test:test};
}
function specAtoms(text){
  var p=specParse(text); if(p.err) return p;
  var at=currentModel.selectedAtoms({}).filter(p.test);
  return {atoms:at};
}
function specResidues(text){   // → {keys, atoms} residues of the atoms, waters only when asked for
  var r=specAtoms(text); if(r.err) return r;
  var keys={}, wantW=/water|hoh|solvent/i.test(text);
  r.atoms.forEach(function(a){ if(WATER_RESN.indexOf(a.resn)>=0&&!wantW) return; keys[rKeyOf(a)]=1; });
  return {keys:Object.keys(keys),atoms:r.atoms};
}
function keysRangesText(keys){ var by={}; keys.forEach(function(k){ var r=rKeyParse(k); (by[r.chain]||(by[r.chain]=[])).push(r.resi); }); return chainList.filter(function(c){ return by[c]; }).concat(Object.keys(by).filter(function(c){ return chainList.indexOf(c)<0; })).map(function(c){ return rangesText(c,by[c]); }).join(', '); }
// "did you mean": the nearest word of the language, a chain, a residue name or a ligand
function _dl(a,b){ a=a.toLowerCase(); b=b.toLowerCase(); if(Math.abs(a.length-b.length)>2) return 9; var d=[], i, j; for(i=0;i<=a.length;i++){ d[i]=[i]; } for(j=0;j<=b.length;j++) d[0][j]=j;
  for(i=1;i<=a.length;i++) for(j=1;j<=b.length;j++){ var c=a[i-1]===b[j-1]?0:1; d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c); if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1); } return d[a.length][b.length]; }
function specSuggest(t){
  var pool=SPEC_WORDS.concat(Object.keys(SPEC_ALIAS).filter(function(k){ return k.length>2&&/^[a-z]+$/.test(k); }),Object.keys(AA3).filter(function(k){ return k.length===3; }).map(function(k){ return k.toLowerCase(); }),ligands.map(function(l){ return l.resn; })), best=null, bd=3;
  pool.forEach(function(w){ var d=_dl(t,w); if(d<bd&&d<=Math.max(1,Math.floor(t.length/3))){ bd=d; best=w; } });
  return best?'“'+best+'”':null;
}

// ── Commands ─────────────────────────────────────────────────────────────────────────────────
// Each: names (the first is the one shown), what it does, the form, and run(args) → a sentence or {err}. args is the text after the verb.
var NAMED_COLORS={red:'#e53935',green:'#43a047',blue:'#1e66d0',yellow:'#fdd835',orange:'#fb8c00',purple:'#8e44ad',magenta:'#d81b9a',cyan:'#00acc1',teal:'#26a69a',pink:'#f48fb1',
  salmon:'#e36c69',coral:'#ff7f50',gold:'#f5c518',lime:'#9ccc65',olive:'#808000',navy:'#1a237e',slate:'#5e87c5',grey:'#9e9e9e',gray:'#9e9e9e',white:'#ffffff',black:'#1a1d2e',
  brown:'#8d6e63',tan:'#d2b48c',violet:'#9c5cf0',wheat:'#f5deb3',forest:'#2d9462',sky:'#51c3ce',lightblue:'#9ec9f0',lightgreen:'#a5d6a7',hotpink:'#ff69b4',tomato:'#ff6347',
  firebrick:'#b22222',crimson:'#dc143c',indigo:'#3f51b5',turquoise:'#40e0d0',plum:'#dda0dd',khaki:'#c3b091',chocolate:'#d2691e',sienna:'#a0522d',peach:'#ffbf7b',mauve:'#a56983',
  lavender:'#b39ddb',mint:'#98d8c8',sand:'#e2c98f',charcoal:'#36454f',silver:'#c5c5c5',beige:'#e8dcc4',rose:'#e8a0a8',amber:'#ffbf00',emerald:'#2ecc71',ruby:'#c0392b',sapphire:'#2a52be'};
var COLOR_SCHEMES={bychain:'chain',chain:'chain',chains:'chain',rainbow:'spectrum',spectrum:'spectrum',ntoc:'spectrum',bfactor:'conf',bfactors:'conf',b:'conf',plddt:'conf',confidence:'conf',
  ss:'ss',secondary:'ss',structure:'ss',uniform:'uniform',single:'uniform',values:'values'};
function colorOf(t){ t=String(t||'').toLowerCase(); if(NAMED_COLORS[t]) return NAMED_COLORS[t]; if(/^#?[0-9a-f]{6}$/.test(t)) return t[0]==='#'?t:'#'+t; if(/^#[0-9a-f]{3}$/.test(t)) return '#'+t[1]+t[1]+t[2]+t[2]+t[3]+t[3]; return null; }
var REPS={sticks:'stick',stick:'stick',licorice:'stick',spheres:'sphere',sphere:'sphere',vdw:'sphere',balls:'sphere',cartoon:'cartoon',ribbon:'cartoon',cartoons:'cartoon',surface:'surface',surf:'surface',lines:'stick',line:'stick'};
var SHOW_THINGS={waters:'waters',water:'waters',solvent:'waters',ligands:'ligands',ligand:'ligands',ions:'ions',labels:'labels',label:'labels',measurements:'meas',measures:'meas',distances:'meas',
  highlights:'hl',sequence:'seq',seq:'seq',selection:'selection',surface:'surface',everything:'all',all:'all'};
function _ok(m){ return {ok:m}; }
function _err(m){ return {err:m}; }
function splitLast(args,pred){   // "chain A and lys red" → {spec:'chain A and lys', last:'red'} when the last word passes pred
  var w=args.trim().split(/\s+/), l=w[w.length-1];
  if(w.length&&pred(l)) return {spec:w.slice(0,-1).join(' '),last:l};
  return {spec:args.trim(),last:null};
}
function needModel(){ if(!currentModel) return _err('Open a structure first: open 5T35'); return null; }
function applyResidueSpec(args,fn){ var n=needModel(); if(n) return n; var r=specResidues(args); if(r.err) return _err(r.err); if(!r.keys.length) return _err('Nothing matches “'+args.trim()+'”.'); return fn(r); }
function addRep(keys,rep){
  state.reps=(state.reps||[]).filter(function(x){ return x.rep!==rep||x.sel!==keysRangesText(keys); });
  state.reps.push({id:'r'+Date.now().toString(36)+state.reps.length,sel:keysRangesText(keys),rep:rep});
}
function chainsOf(keys){ var o={}; keys.forEach(function(k){ o[rKeyParse(k).chain]=1; }); return Object.keys(o); }
function wholeChains(keys){   // the chains the keys cover completely
  var by={}; keys.forEach(function(k){ var c=rKeyParse(k).chain; by[c]=(by[c]||0)+1; });
  return Object.keys(by).filter(function(c){ return SEQ.chains[c]&&by[c]>=SEQ.chains[c].length; });
}
var RB_CMDS=[
  {n:['select','sel','pick'],d:'Select residues — then act on them, here or beside the sequence',f:'select chain A and lys · select within 5 of ligand · select add A:50-60 · select clear',
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().split(/\s+/), mode='replace', l=(w[0]||'').toLowerCase();
     if(!a.trim()) return _err('Select what? e.g. select ligand');
     if(l==='clear'||l==='none'||l==='nothing'){ selClear(); return _ok('Selection cleared.'); }
     if(l==='invert'){ var all=specResidues('protein or nucleic or ligand'); selSet(all.keys.filter(function(k){ return !_sel[k]; })); return _ok(_selN+' selected (the rest).'); }
     if(l==='add'||l==='+'||l==='more'){ mode='add'; a=w.slice(1).join(' '); } else if(l==='remove'||l==='-'||l==='less'||l==='subtract'){ mode='remove'; a=w.slice(1).join(' '); }
     var r=specResidues(a); if(r.err) return _err(r.err); if(!r.keys.length&&mode==='replace') return _err('Nothing matches “'+a.trim()+'”.');
     selSet(r.keys,mode); return _ok(_selN+(_selN===1?' residue':' residues')+' selected'+(mode==='replace'?'':' in all')+'.'); }},
  {n:['color','colour','col','c'],d:'Colour residues, or the whole structure by a scheme',f:'color ligand yellow · color chain B #5e87c5 · color bychain · color rainbow · color sel salmon',
   run:function(a){ var n=needModel(); if(n) return n; a=a.trim(); if(!a) return _err('Colour what, and how? e.g. color chain A red');
     var lw=a.toLowerCase();
     if(COLOR_SCHEMES[lw]){ state.color=COLOR_SCHEMES[lw]; $('topColor').value=state.color; updateColorOrOpacity(); return _ok('Coloured '+(COLOR_NAMES[state.color]||state.color).toLowerCase()+'.'); }
     if(colorOf(lw)){ state.color='uniform'; state.uniformColor=colorOf(lw); $('topColor').value='uniform'; buildSwatches(); updateColorOrOpacity(); return _ok('Everything '+lw+'.'); }
     var sp=splitLast(a,function(x){ return !!colorOf(x)||!!COLOR_SCHEMES[x.toLowerCase()]; });
     if(!sp.last) return _err('Which colour? End with a colour: color '+a+' red');
     if(COLOR_SCHEMES[sp.last.toLowerCase()]) return _err('A scheme colours the whole structure: color '+sp.last+'. For part of it, give a colour: color '+sp.spec+' red');
     var hex=colorOf(sp.last);
     return applyResidueSpec(sp.spec,function(r){
       // a ligand takes the colour as its carbon colour; residues of a chain become a highlight; whole chains, their chain colour
       var ligK={}; ligands.forEach(function(l){ ligK[rKey(l.chain,l.resi)]=l; });
       var lk=r.keys.filter(function(k){ return ligK[k]; }); lk.forEach(function(k){ state.ligColors[ligK[k].key]=hex; });
       r.keys=r.keys.filter(function(k){ return !ligK[k]; });
       if(!r.keys.length){ recolorStructure(); renderLigList(); return _ok((lk.length===1?ligK[lk[0]].resn:lk.length+' ligands')+' '+sp.last+'.'); }
       var whole=wholeChains(r.keys), only=chainsOf(r.keys);
       if(whole.length&&whole.length===only.length){ whole.forEach(function(ch){ state.chainColors[ch]=hex; }); recolorStructure(); renderChainList(); updateLegend(); return _ok((whole.length===1?chainTitle(whole[0]):whole.length+' chains')+' '+sp.last+'.'); }
       state.highlights.push({id:'h'+Date.now().toString(36),sel:keysRangesText(r.keys),color:hex,sticks:false}); delete state.off.hl;
       recolorStructure(); renderHlList(); renderLigList(); updateSummaries(); return _ok(r.keys.length+(r.keys.length===1?' residue ':' residues ')+sp.last+(lk.length?' (and '+lk.length+(lk.length===1?' ligand':' ligands')+')':'')+'.'); }); }},
  {n:['show','sh','display','draw'],d:'Show something, or draw residues a way',f:'show A:45-60 as sticks · show ligand pocket as sticks · show waters · show labels · show sequence',
   run:function(a){ return showHide(a,true); }},
  {n:['hide','h','undisplay'],d:'Hide something, or take a way of drawing off',f:'hide waters · hide chain B · hide sticks · hide labels · hide A:1-20',
   run:function(a){ return showHide(a,false); }},
  {n:['sticks','stick'],d:'Draw residues as sticks (side chains included)',f:'sticks within 5 of ligand · sticks sel',
   run:function(a){ return showHide(a+' as sticks',true); }},
  {n:['only','isolate','solo'],d:'Show only the chains of something',f:'only chain A · only A,B',
   run:function(a){ return applyResidueSpec(a,function(r){ var cs=chainsOf(r.keys); state.hiddenChains={}; chainList.forEach(function(c){ if(cs.indexOf(c)<0) state.hiddenChains[c]=true; }); chainsChanged(); return _ok('Only '+cs.map(chainTitle).join(', ')+'.'); }); }},
  {n:['style','st','as'],d:'Draw everything as cartoon, surface or sticks',f:'style cartoon · style surface · style sticks',
   run:function(a){ var r=REPS[a.trim().toLowerCase()]; if(!r||r==='sphere') return _err('style cartoon, style surface or style sticks'); state.style=r; _segSet('styleSeg',r); if(currentModel) buildGeometry(); updateSummaries(); return _ok('Drawn as '+(r==='stick'?'sticks':r)+'.'); }},
  {n:['label','lab','labels'],d:'Label residues — a label per residue, or one text for a chain',f:'label ligand pocket · label A:45 · label chain A "BRD4" · label clear',
   run:function(a){ var n=needModel(); if(n) return n; a=a.trim(); if(/^(clear|none|off|remove)$/i.test(a)){ state.residueLabels=[]; state.chainLabels={}; renderLabelTags(); renderResLblList(); renderChainList(); return _ok('Labels cleared.'); }
     var q=/^(.*?)\s+["'](.+)["']$/.exec(a);
     if(q){ return applyResidueSpec(q[1],function(r){ var cs=chainsOf(r.keys); if(cs.length!==1||wholeChains(r.keys).length!==1){ return _err('A text label goes on one chain: label chain A "'+q[2]+'"'); } state.chainLabels[cs[0]]=q[2]; delete state.off.labels; renderLabelTags(); renderChainList(); return _ok(chainTitle(cs[0])+' is labelled “'+q[2]+'”.'); }); }
     return applyResidueSpec(a,function(r){ var k0=Object.assign({},_sel); _sel={}; r.keys.forEach(function(k){ _sel[k]=1; }); _selN=r.keys.length; var before=state.residueLabels.length; selLabel(); _sel=k0; _selN=Object.keys(_sel).length; recolorStructure(); return _ok((state.residueLabels.length-before)+' labels added.'); }); }},
  {n:['unlabel'],d:'Take labels off residues',f:'unlabel all · unlabel A:45',
   run:function(a){ var n=needModel(); if(n) return n; if(/^(all|everything)?$/i.test(a.trim())){ state.residueLabels=[]; renderLabelTags(); renderResLblList(); return _ok('Residue labels cleared.'); }
     return applyResidueSpec(a,function(r){ var b=state.residueLabels.length; state.residueLabels=state.residueLabels.filter(function(x){ return r.keys.indexOf(rKey(x.chain,x.resi))<0; }); renderLabelTags(); renderResLblList(); return _ok((b-state.residueLabels.length)+' labels removed.'); }); }},
  {n:['zoom','focus','z','center','show me'],d:'Bring something into view; alone, fit everything',f:'zoom ligand · zoom A:45-60 · zoom sel · zoom',
   run:function(a){ var n=needModel(); if(n) return n; if(!a.trim()||/^(all|everything)$/i.test(a.trim())){ fitToView(); return _ok('Fitted.'); }
     var r=specAtoms(a); if(r.err) return _err(r.err); if(!r.atoms.length) return _err('Nothing matches “'+a.trim()+'”.');
     var idx=r.atoms.map(function(x){ return x.index; }); _userMoved=true; fitView({focus:{index:idx},animate:true,margin:0.16}); return _ok('Zoomed to '+r.atoms.length+' atoms.'); }},
  {n:['fit','reset'],d:'Fit the structure to the view (F)',f:'fit',run:function(){ fitToView(); return _ok('Fitted.'); }},
  {n:['turn','rotate','rot'],d:'Turn the structure about an axis of the screen',f:'turn y 90 · turn x -30',
   run:function(a){ var m=/^([xyz])\s*(-?\d+(?:\.\d+)?)?$/i.exec(a.trim()); if(!m) return _err('turn x|y|z degrees, e.g. turn y 90'); if(!viewer) return _err('The viewer is not ready.'); viewer.rotate(parseFloat(m[2]||90),m[1].toLowerCase(),reducedMotion()?0:400); _userMoved=true; return _ok('Turned '+(m[2]||90)+'° about '+m[1]+'.'); }},
  {n:['spin','rock'],d:'Turn it slowly, round and round (S)',f:'spin · spin x · spin off',
   run:function(a){ var l=a.trim().toLowerCase(); if(l==='off'||l==='stop'){ if(_spinning) toggleSpin(); return _ok('Stopped.'); } if(!_spinning) toggleSpin(); if(/^[xz]$/.test(l)&&viewer) viewer.spin(l); return _ok('Spinning.'); }},
  {n:['stop'],d:'Stop spinning',f:'stop',run:function(){ if(_spinning) toggleSpin(); return _ok('Stopped.'); }},
  {n:['background','bg','bgcolor'],d:'The background',f:'bg white · bg dark · bg transparent',
   run:function(a){ var l=a.trim().toLowerCase(), k=l==='black'||l==='dark'?'dark':l==='white'?'white':l==='transparent'||l==='none'||l==='clear'?'transparent':null; if(!k) return _err('bg white, bg dark or bg transparent'); state.bg=k; _segSet('bgSeg',k); applyBackground(); if(currentModel) recolorStructure(); return _ok('Background '+k+'.'); }},
  {n:['outline','silhouette','silhouettes'],d:'The outline around the shapes',f:'outline none · outline thin · outline thick',
   run:function(a){ var l=a.trim().toLowerCase(); l=l==='off'||l==='false'?'none':l==='on'||l==='true'?'thin':l; if(['none','thin','thick'].indexOf(l)<0) return _err('outline none, thin or thick'); state.border=l; _segSet('borderSeg',l); applyBorder(); return _ok('Outline '+l+'.'); }},
  {n:['projection','camera','proj'],d:'Perspective or orthographic',f:'projection ortho · projection perspective',
   run:function(a){ var l=a.trim().toLowerCase(), k=/^o/.test(l)?'orthographic':/^p|^m/.test(l)?'perspective':null; if(!k) return _err('projection ortho or projection perspective'); state.projection=k; _segSet('projSeg',k); applyProjection(); updateSummaries(); return _ok(k[0].toUpperCase()+k.slice(1)+'.'); }},
  {n:['open','fetch','load','o'],d:'Open a structure: a PDB code, a UniProt id or a name',f:'open 5T35 · open P04637 · open crbn',
   run:function(a){ if(!a.trim()) return _err('open what? e.g. open 5T35'); $('pdbInput').value=a.trim(); handleSubmit(); return _ok('Opening '+a.trim()+'…'); }},
  {n:['align','superpose','super','overlay','compare','mm','matchmaker'],d:'Lay a second structure over this one',f:'align 4HHB · align P04637',
   run:function(a){ var n=needModel(); if(n) return n; if(!a.trim()) return _err('align what? e.g. align 4HHB'); addOverlay(a.trim()); rbOpenSec('compare'); return _ok('Aligning '+a.trim()+'…'); }},
  {n:['interface','iface','contacts','buried'],d:'The residues two chains touch with',f:'interface A B · interface A B 4.0',
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().split(/[\s,]+/).filter(Boolean); if(w.length<2) return _err('interface A B');
     var A=chainList.indexOf(w[0])>=0?w[0]:null, B=chainList.indexOf(w[1])>=0?w[1]:null; if(!A||!B||A===B) return _err('Two different chains of this structure: '+chainList.join(', '));
     var cut=parseFloat(w[2]); state.iface={a:A,b:B,cut:cut>=2.5&&cut<=8?cut:4.5,show:true,sticks:true,colorA:'#ffbf7b',colorB:'#51c3ce'}; _if=null; ifaceFill(); syncIface(); recolorStructure(); renderIface(); rbOpenSec('interface');
     var c=ifaceNow(); return c?_ok(c.v.pairs.length+' contacts between '+A+' and '+B+'.'):_ok('Interface of '+A+' and '+B+'.'); }},
  {n:['pocket'],d:'Show the residues around a ligand (or take them away)',f:'pocket MZ1 · pocket off',
   run:function(a){ var n=needModel(); if(n) return n; var l=a.trim().toUpperCase(); if(!ligands.length) return _err('There are no ligands here.');
     if(l==='OFF'||l==='NONE'){ state.pockets={}; recolorStructure(); renderLigList(); return _ok('Pockets off.'); }
     var ls=l?ligands.filter(function(x){ return x.resn.toUpperCase()===l; }):ligands.slice(0,1); if(!ls.length) return _err('No ligand '+l+' here (ligands: '+ligands.map(function(x){ return x.resn; }).join(', ')+').');
     ls.forEach(function(x){ state.pockets[x.key]=true; }); recolorStructure(); renderLigList(); updateSummaries(); focusLigand(ls[0]); return _ok('Pocket of '+ls[0].resn+' shown.'); }},
  {n:['distance','dist','measure','d'],d:'Measure a distance between two atoms (or an angle, three)',f:'distance A:45@CA B:30@CA · angle A:10@CA A:11@CA A:12@CA',
   run:function(a){ return measureCmd(a,'dist'); }},
  {n:['angle'],d:'Measure an angle at the middle of three atoms',f:'angle A:10@CA A:11@CA A:12@CA',run:function(a){ return measureCmd(a,'angle'); }},
  {n:['highlight','hl','emphasise','emphasize'],d:'Colour residues and draw them as sticks',f:'highlight A:45-60 · highlight pocket orange',
   run:function(a){ var sp=splitLast(a,function(x){ return !!colorOf(x); }); return applyResidueSpec(sp.spec,function(r){ state.highlights.push({id:'h'+Date.now().toString(36),sel:keysRangesText(r.keys),color:sp.last?colorOf(sp.last):HL_COLORS[state.highlights.length%HL_COLORS.length],sticks:true}); delete state.off.hl; recolorStructure(); renderHlList(); updateSummaries(); return _ok(r.keys.length+' residues highlighted.'); }); }},
  {n:['sequence','seq'],d:'Show or hide the sequence (Q)',f:'sequence · sequence off · sequence B',
   run:function(a){ var l=a.trim(); if(/^(off|hide|no)$/i.test(l)){ seqToggle(false); return _ok('Sequence hidden.'); } if(l&&SEQ.chains[l]){ SEQ.show=l; } else if(/^all$/i.test(l)) SEQ.show='*'; seqToggle(true); return _ok('Sequence shown.'); }},
  {n:['panel','tab','go'],d:'Open a tab of the panel',f:'panel colour · panel analyse',
   run:function(a){ var l=a.trim().toLowerCase(), m={open:'open',structure:'open',models:'models',model:'models',chains:'models',colour:'colour',color:'colour',colours:'colour',analyse:'analyse',analyze:'analyse',analysis:'analyse',figure:'figure',labels:'figure',export:'figure',designs:'designs',design:'designs'}[l]; if(!m) return _err('panel open · models · colour · analyse · figure · designs'); rbTab(m,{reveal:true}); return _ok('The '+m+' tab.'); }},
  {n:['save'],d:'Save what is on screen as a design',f:'save my figure',
   run:function(a){ var n=needModel(); if(n) return n; $('designName').value=a.trim(); saveDesign(); return _ok('Saved.'); }},
  {n:['export','png','image','snapshot'],d:'Export the picture; with a format and a resolution, straight to a file',f:'export · export png 600 · export jpeg 300',
   run:function(a){ var n=needModel(); if(n) return n; var w=a.trim().toLowerCase().split(/\s+/).filter(Boolean); if(!w.length){ openExport(); return _ok('Export…'); }
     var fmt=w.indexOf('jpeg')>=0||w.indexOf('jpg')>=0?'jpeg':'png', res=(w.filter(function(x){ return /^(300|600|1200)$/.test(x); })[0])||'600'; _exOpts.fmt=fmt; _exOpts.res=res; doExport(); return _ok('Exported '+fmt.toUpperCase()+' at '+res+' dpi.'); }},
  {n:['pymol'],d:'Download a PyMOL script that rebuilds this figure',f:'pymol',run:function(){ var n=needModel(); if(n) return n; exportScript('pymol'); return _ok('PyMOL script downloaded.'); }},
  {n:['chimerax','chimera'],d:'Download a ChimeraX script that rebuilds this figure',f:'chimerax',run:function(){ var n=needModel(); if(n) return n; exportScript('chimerax'); return _ok('ChimeraX script downloaded.'); }},
  {n:['help','?','commands','h?'],d:'What the commands are',f:'help · help color',
   run:function(a){ var c=cmdFind(a.trim().split(/\s+/)[0]); if(c) return _ok(c.n[0]+' — '+c.d+'. e.g. '+c.f.split(' · ')[0]); cmdHelp(); return _ok('The commands are listed above. Tab completes; ↑ brings back the last one.'); }}
];
function showHide(a,on){
  var n=needModel(); if(n) return n; a=a.trim(); var l=a.toLowerCase();
  if(!a) return _err(on?'Show what? e.g. show waters':'Hide what? e.g. hide waters');
  var thing=SHOW_THINGS[l];
  if(thing){
    if(thing==='waters'){ state.showWaters=on; $('showWaters').checked=on; recolorStructure(); return _ok((on?'Showing':'Hiding')+' waters.'); }
    if(thing==='ligands'){ state.showLigands=on; $('showLigands').checked=on; recolorStructure(); renderLigList(); return _ok((on?'Showing':'Hiding')+' ligands.'); }
    if(thing==='seq'){ seqToggle(on); return _ok('Sequence '+(on?'shown.':'hidden.')); }
    if(thing==='surface'){ state.style=on?'surface':'cartoon'; _segSet('styleSeg',state.style); buildGeometry(); return _ok(on?'Surface.':'Cartoon.'); }
    if(thing==='all'){ if(on){ state.hiddenChains={}; state.hide=[]; state.off={}; chainsChanged(); renderModelExtras(); return _ok('Everything shown.'); } return _err('Hide everything? Say what: hide chain B, hide waters…'); }
    if(thing==='selection'){ if(on){ _selHide=false; } else { _selHide=true; } recolorStructure(); return _ok('Selection '+(on?'shown.':'hidden (still selected).')); }
    setExtraShown(thing,on); return _ok((on?'Showing ':'Hiding ')+l+'.');
  }
  var m=/^(.*?)\s+(?:as\s+)?(sticks?|spheres?|cartoons?|surface|lines?|licorice|vdw|balls|ribbon)$/i.exec(a), rep=null, spec=a;
  if(m){ rep=REPS[m[2].toLowerCase()]; spec=m[1].replace(/\s+as$/i,''); }
  else if(REPS[l]){ rep=REPS[l]; spec=''; }
  if(rep&&!spec.trim()){   // "hide sticks": take every drawn way of that kind off; "show sticks" is the style
    if(on){ if(rep==='sphere') return _err('Spheres for what? e.g. show ligand as spheres'); state.style=rep; _segSet('styleSeg',rep); buildGeometry(); return _ok('Drawn as '+(rep==='stick'?'sticks':rep)+'.'); }
    state.reps=(state.reps||[]).filter(function(x){ return x.rep!==rep; }); state.highlights.forEach(function(h){ if(rep==='stick') h.sticks=false; }); recolorStructure(); renderHlList(); return _ok(rep==='stick'?'No more sticks.':'Done.'); }
  return applyResidueSpec(spec,function(r){
    var whole=wholeChains(r.keys), cs=chainsOf(r.keys);
    if(!rep){
      if(whole.length===cs.length){ cs.forEach(function(c){ if(on) delete state.hiddenChains[c]; else state.hiddenChains[c]=true; }); state.hide=(state.hide||[]).filter(function(x){ return !cs.some(function(c){ return x.indexOf(c+':')===0; }); }); chainsChanged(); return _ok((on?'Showing ':'Hiding ')+cs.map(chainTitle).join(', ')+'.'); }
      if(on){ var t=keysRangesText(r.keys); state.hide=(state.hide||[]).filter(function(x){ return x!==t; }); cs.forEach(function(c){ delete state.hiddenChains[c]; }); recolorStructure(); return _ok('Shown.'); }
      state.hide=(state.hide||[]).concat([keysRangesText(r.keys)]); recolorStructure(); return _ok(r.keys.length+' residues hidden.');
    }
    if(rep==='cartoon'||rep==='surface'){ if(!on) return _err('To hide part of the cartoon: hide '+spec); cs.forEach(function(c){ delete state.hiddenChains[c]; }); chainsChanged(); return _ok('Shown.'); }
    if(on){ addRep(r.keys,rep); recolorStructure(); renderModelExtras(); return _ok(r.keys.length+' residues as '+(rep==='stick'?'sticks':'spheres')+'.'); }
    var t2=keysRangesText(r.keys), b2=(state.reps||[]).length; state.reps=(state.reps||[]).filter(function(x){ return !(x.rep===rep&&x.sel===t2); });
    if(state.reps.length===b2){ state.reps=(state.reps||[]).filter(function(x){ return x.rep!==rep||!r.keys.some(function(k){ return parseResidues(x.sel).ranges.some(function(g){ var p=rKeyParse(k); return (g.chain==='*'||g.chain===p.chain)&&p.resi>=g.lo&&p.resi<=g.hi; }); }); }); }
    recolorStructure(); renderModelExtras(); return _ok('Done.');
  });
}
function atomSpecOne(t){
  var r=specAtoms(/@/.test(t)?t:t+'@CA'); if(r.err) return r;
  if(!r.atoms.length) return {err:'No atom “'+t+'”.'}; if(r.atoms.length>1) return {err:'“'+t+'” is '+r.atoms.length+' atoms; add @ and an atom name, e.g. '+t.split('@')[0]+'@CA'};
  return {atom:r.atoms[0]};
}
function measureCmd(a,kind){
  var n=needModel(); if(n) return n; var w=a.trim().split(/\s+/).filter(Boolean);
  if(w.length===3&&kind==='dist') kind='angle';
  var need=kind==='dist'?2:3; if(w.length!==need) return _err(kind==='dist'?'distance A:45@CA B:30@CA':'angle A:10@CA A:11@CA A:12@CA');
  var pts=[]; for(var i=0;i<w.length;i++){ var o=atomSpecOne(w[i]); if(o.err) return _err(o.err); pts.push(atomRef(o.atom)); }
  var m={id:'m'+(++_measSeq)+Date.now().toString(36),kind:kind,pts:pts}; state.measures.push(m); delete state.off.meas;
  recolorStructure(); renderLabelTags(); renderMeasList(); updateSummaries(); return _ok(measureText(m)+'.');
}
var _cmdIndex=null;
function cmdFind(w){ w=String(w||'').toLowerCase(); if(!w) return null; for(var i=0;i<RB_CMDS.length;i++) if(RB_CMDS[i].n.indexOf(w)>=0) return RB_CMDS[i]; return null; }
// Run a line. Several commands can be joined with ";".
function runCommand(line,opts){
  opts=opts||{}; line=String(line||'').trim(); if(!line) return null;
  var parts=line.split(';').map(function(x){ return x.trim(); }).filter(Boolean), last=null;
  for(var i=0;i<parts.length;i++){
    var p=parts[i], m=/^(\S+)\s*([\s\S]*)$/.exec(p), c=cmdFind(m[1]);
    if(!c){
      var guess=cmdGuess(m[1]);
      last=_err('There is no command “'+m[1]+'”.'+(guess?' Did you mean '+guess+'?':' Type help for the list.'));
      if(!guess&&currentModel){ var asSpec=specResidues(p); if(!asSpec.err&&asSpec.keys.length){ selSet(asSpec.keys); last=_ok(asSpec.keys.length+' residues selected (“'+p+'” read as a selection).'); } }
      break;
    }
    try{ last=c.run(m[2]||'')||_ok('Done.'); }catch(e){ console.error(e); last=_err('That did not work: '+(e&&e.message||e)); }
    if(last.err) break;
  }
  if(!opts.quiet) cmdSay(last);
  if(!opts.noHistory) cmdRemember(line,!!(last&&last.ok));
  return last;
}
function cmdGuess(w){ var best=null, bd=3; RB_CMDS.forEach(function(c){ c.n.forEach(function(x){ if(x.length<2) return; var d=_dl(w,x); if(d<bd&&d<=Math.max(1,Math.floor(w.length/3))){ bd=d; best='“'+c.n[0]+'”'; } }); }); return best; }

// ── The command line: autocompletion that knows the language ───────────────────────────────
// Tab takes the suggestion (the grey text); ↑ ↓ choose in the list, or walk through what was typed before; Enter runs.
// What it offers depends on where you are: a command first; then what that command takes — a selection (the words, the chains,
// the residue names and ligands in THIS structure), a colour, a way of drawing, a number. A line typed before that starts the same
// way is offered first, and words that usually follow the one before are offered before words that rarely do.
var CMD={hist:[],hi:-1,draft:'',sug:[],si:-1,next:{},freq:{}};
function cmdLoad(){ try{ var o=JSON.parse(load('ribbon_cmd')||'{}'); CMD.hist=Array.isArray(o.h)?o.h.filter(function(x){ return typeof x==='string'; }).slice(-200):[]; CMD.next=o.n&&typeof o.n==='object'?o.n:{}; CMD.freq=o.f&&typeof o.f==='object'?o.f:{}; }catch(e){} }
function cmdSave(){ store('ribbon_cmd',JSON.stringify({h:CMD.hist.slice(-200),n:CMD.next,f:CMD.freq})); }
function cmdRemember(line,ok){
  CMD.hist=CMD.hist.filter(function(x){ return x!==line; }); CMD.hist.push(line); CMD.hi=-1;
  if(ok){ var w=line.toLowerCase().split(/\s+/); var c=cmdFind(w[0]); if(c){ CMD.freq[c.n[0]]=(CMD.freq[c.n[0]]||0)+1; }
    for(var i=1;i<w.length;i++){ var k=w[i-1]; (CMD.next[k]||(CMD.next[k]={}))[w[i]]=(CMD.next[k][w[i]]||0)+1; } }
  cmdSave();
}
function _cand(t,kind,d,extra){ return Object.assign({t:t,k:kind,d:d||''},extra||{}); }
function specCandidates(prev){
  var L=[], pl=String(prev||'').toLowerCase(), pw=SPEC_ALIAS[pl];
  if(pw==='chain'||pl==='/'){ chainList.forEach(function(c){ L.push(_cand(c,'chain',(chainInfo[c]&&chainInfo[c].name)||chainTitle(c))); }); return L; }
  if(pw==='resn'){ var seen={}; currentModel&&currentModel.selectedAtoms({}).forEach(function(a){ if(!seen[a.resn]&&WATER_RESN.indexOf(a.resn)<0){ seen[a.resn]=1; L.push(_cand(a.resn,'resn','residue name')); } }); return L; }
  if(pw==='resi'){ chainList.forEach(function(c){ var r=chainRange[c]; if(r) L.push(_cand(r[0]+'-'+r[1],'num',chainTitle(c)+' runs '+r[0]+'–'+r[1])); }); return L; }
  if(pw==='name'){ ['CA','CB','N','C','O','NZ','OG','SG','OH','NE2'].forEach(function(x){ L.push(_cand(x,'atom','atom name')); }); return L; }
  if(pw==='elem'){ ['C','N','O','S','P','FE','ZN','MG','CA'].forEach(function(x){ L.push(_cand(x,'atom','element')); }); return L; }
  if(pw==='within'){ ['4','5','6','8','3.5'].forEach(function(x){ L.push(_cand(x,'num','Å')); }); return L; }
  if(/^\d+(\.\d+)?$/.test(pl)&&specPrevWord==='within'){ L.push(_cand('of','word','within … of what')); return L; }
  if(pw==='pocket'){ ligands.forEach(function(l){ L.push(_cand(l.resn,'lig',l.name||'ligand')); }); }
  ligands.forEach(function(l){ L.push(_cand(l.resn,'lig',(l.name&&l.name!==l.resn?l.name:'ligand')+' · '+chainTitle(l.chain).replace('Chain ','')+' '+l.resi)); });
  SPEC_WORDS.forEach(function(w){ L.push(_cand(w,'word',SPEC_HELP[w]||'')); });
  chainList.forEach(function(c){ if(c.trim()) L.push(_cand(c,'chain',(chainInfo[c]&&chainInfo[c].name)||chainTitle(c))); });
  if(currentModel){ var seen2={}; currentModel.selectedAtoms({atom:'CA'}).forEach(function(a){ var t=a.resn.toLowerCase(); if(!seen2[t]&&AA3[a.resn]){ seen2[t]=1; L.push(_cand(t,'resn','every '+a.resn)); } }); }
  return L;
}
var specPrevWord=null;
function argKinds(c){
  var n=c.n[0];
  return ({select:['selhead','spec'],color:['spec+colour'],show:['showthing','spec','rep'],hide:['showthing','spec','rep'],sticks:['spec'],only:['spec'],style:['rep3'],label:['spec'],unlabel:['spec'],
    zoom:['spec'],turn:['axis','deg'],spin:['axis'],background:['bg'],outline:['outline'],projection:['proj'],open:['id'],align:['id'],interface:['chain','chain'],pocket:['lig'],
    distance:['atom'],angle:['atom'],highlight:['spec+colour'],sequence:['seqarg'],panel:['tab'],export:['fmt','res'],help:['cmdname']})[n]||[];
}
function cmdSuggest(text){
  var out=[];
  var words=text.replace(/^\s+/,'').split(/\s+/), cur=/\s$/.test(text)?'':words[words.length-1], before=/\s$/.test(text)?words.filter(Boolean):words.slice(0,-1);
  var curL=cur.toLowerCase();
  // a whole line typed before that starts this way
  var hist=[]; if(text.trim().length>=1){ for(var i=CMD.hist.length-1;i>=0&&hist.length<3;i--){ var h=CMD.hist[i]; if(h.toLowerCase().indexOf(text.toLowerCase())===0&&h.length>text.length) hist.push(_cand(h,'hist','typed before',{line:true})); } }
  if(!before.length){
    RB_CMDS.forEach(function(c){
      c.n.forEach(function(nm,ix){ if(!curL||nm.indexOf(curL)===0) out.push(_cand(c.n[0],'cmd',(ix?nm+' → ':'')+c.d,{score:(nm===curL?100:0)+(CMD.freq[c.n[0]]||0)*2+(ix?0:3)-c.n[0].length*0.05,alias:ix?nm:''})); });
    });
    if(curL.length>=3&&!out.length) RB_CMDS.forEach(function(c){ if(_dl(curL,c.n[0])<=1) out.push(_cand(c.n[0],'cmd','did you mean? '+c.d,{score:-1})); });
    out=dedupe(out).sort(function(a,b){ return b.score-a.score; });
    return {list:hist.concat(out).slice(0,9),cur:cur};
  }
  var c=cmdFind(before[0]); if(!c) return {list:hist,cur:cur};
  var kinds=argKinds(c), pos=before.length-1, prev=before[before.length-1]||'', prevL=prev.toLowerCase();
  specPrevWord=before.length>=2?SPEC_ALIAS[before[before.length-2].toLowerCase()]:null;
  var k=c.args?'own':(kinds[Math.min(pos,kinds.length-1)]||''), L=[];
  function add(arr){ L=L.concat(arr); }
  var hasSpec=pos>0, wantsValue=['chain','resn','resi','name','elem','within','pocket','of','byres','not','and','or'].indexOf(SPEC_ALIAS[prevL]||'')>=0||/^\d+(\.\d+)?$/.test(prevL)&&specPrevWord==='within';
  if(k==='spec+colour'||k==='spec'||k==='selhead'||k==='showthing'||k==='rep'){
    if(k==='selhead'&&pos===0) add(['add','remove','clear','invert'].map(function(x){ return _cand(x,'word',{add:'to what is selected',remove:'from what is selected',clear:'select nothing',invert:'everything else'}[x]); }));
    if(k==='showthing'&&pos===0) add(Object.keys(SHOW_THINGS).filter(function(x){ return ['waters','ligands','ions','labels','measurements','highlights','sequence','selection','surface','everything'].indexOf(x)>=0; }).map(function(x){ return _cand(x,'thing',''); }));
    add(specCandidates(prev));
    if((c.n[0]==='color'||c.n[0]==='highlight')&&!wantsValue){ var cols=Object.keys(NAMED_COLORS).map(function(x){ return _cand(x,'colour','',{hex:NAMED_COLORS[x]}); });
      if(pos===0&&c.n[0]==='color') add(['bychain','rainbow','ss',isAF()?'plddt':'bfactor','uniform'].map(function(x){ return _cand(x,'scheme',{bychain:'a colour per chain',rainbow:'N-terminus blue → C-terminus red',ss:'helix · strand · loop',plddt:'AlphaFold confidence',bfactor:'B-factor',uniform:'one colour'}[x]); }));
      if(hasSpec) L=cols.concat(L); else add(cols); }
    if((c.n[0]==='show'||c.n[0]==='hide')&&hasSpec&&!wantsValue) L=['as sticks','as spheres','sticks','spheres'].map(function(x){ return _cand(x,'rep',''); }).concat(L);
    // the most likely next words first: what is selected, then the words people start a selection with
    if(!curL&&!wantsValue&&(k==='spec+colour'||k==='spec'||k==='selhead')&&!hasSpec){ var pri=(_selN?['sel']:[]).concat(c.n[0]==='color'?['bychain','rainbow','chain','ligand','ss']:['chain','ligand','within','pocket','protein']); L.forEach(function(x){ var j=pri.indexOf(x.t); if(j>=0) x.pri=20-j; }); }
  }
  else if(k==='own') add(c.args(pos,prev)||[]);
  else if(k==='rep3') add(['cartoon','surface','sticks'].map(function(x){ return _cand(x,'rep',''); }));
  else if(k==='axis') add(['y','x','z'].map(function(x){ return _cand(x,'word','axis'); }).concat(c.n[0]==='spin'?[_cand('off','word','stop')]:[]));
  else if(k==='deg') add(['90','180','45','-90','30'].map(function(x){ return _cand(x,'num','degrees'); }));
  else if(k==='bg') add(['white','dark','transparent'].map(function(x){ return _cand(x,'word','background'); }));
  else if(k==='outline') add(['none','thin','thick'].map(function(x){ return _cand(x,'word','outline'); }));
  else if(k==='proj') add(['orthographic','perspective'].map(function(x){ return _cand(x,'word',''); }));
  else if(k==='id'){ var rec=[]; try{ rec=JSON.parse(load('ribbon_recent')||'[]'); }catch(e){} (Array.isArray(rec)?rec:[]).forEach(function(r){ var id=r&&r.q; if(id) add([_cand(String(id),'id',r.l&&r.l!==id?r.l:'recent')]); }); ['5T35','1CRN','4HHB','6VXX','P04637'].forEach(function(x){ add([_cand(x,'id','example')]); }); }
  else if(k==='chain') chainList.forEach(function(ch){ if(before.indexOf(ch)<0) add([_cand(ch,'chain',(chainInfo[ch]&&chainInfo[ch].name)||'')]); });
  else if(k==='lig'){ ligands.forEach(function(l){ add([_cand(l.resn,'lig',l.name||'ligand')]); }); add([_cand('off','word','no pockets')]); }
  else if(k==='atom'){ chainList.forEach(function(ch){ var r=chainRange[ch]; if(r) add([_cand(ch+':'+r[0]+'@CA','atom',chainTitle(ch)+' '+r[0]+'–'+r[1]+'; change the number')]); }); }
  else if(k==='seqarg'){ add([_cand('off','word','hide it'),_cand('all','word','every chain')]); SEQ.order.forEach(function(ch){ add([_cand(ch,'chain','')]); }); }
  else if(k==='tab') add(['open','models','colour','analyse','figure','designs'].map(function(x){ return _cand(x,'word','tab'); }));
  else if(k==='fmt') add([_cand('png','word',''),_cand('jpeg','word','')]);
  else if(k==='res') add(['600','300','1200'].map(function(x){ return _cand(x,'num','dpi'); }));
  else if(k==='cmdname') RB_CMDS.forEach(function(cc){ add([_cand(cc.n[0],'cmd',cc.d)]); });
  // rank: what is being typed first (prefix, then a word inside, then one letter off), then what usually follows the word before
  var nx=CMD.next[prevL]||{};
  L.forEach(function(x,ix){
    var t=x.t.toLowerCase(), s=0;
    if(!curL) s=1; else if(t===curL) s=40; else if(t.indexOf(curL)===0) s=30; else if(curL.length>=2&&t.indexOf(curL)>0) s=8; else if(curL.length>=3&&_dl(curL,t)<=1) s=5; else s=-1;
    if(x.alias&&curL&&x.alias.indexOf(curL)===0) s=Math.max(s,28);
    s+=(nx[t]||0)*3+(x.pri||0)+(PRIOR_NEXT[prevL]&&PRIOR_NEXT[prevL][t]||0)-ix*0.002;
    x.score=s;
  });
  L=dedupe(L.filter(function(x){ return x.score>=0; })).sort(function(a,b){ return b.score-a.score; });
  return {list:hist.concat(L).slice(0,10),cur:cur};
}
// what usually follows a word, before anybody has typed anything (the line's own history adds to this)
var PRIOR_NEXT={ligand:{yellow:3,magenta:2,cyan:2,orange:1},pocket:{orange:2,peach:2},interface:{orange:2,teal:2},sel:{salmon:2,teal:1,orange:1},helix:{red:1},strand:{gold:1,yellow:1},
  hydrophobic:{orange:2},charged:{blue:1,red:1},basic:{blue:3},acidic:{red:3},aromatic:{purple:1},within:{'5':3,'4':2,'6':1},of:{ligand:4,sel:2},show:{sel:2},select:{within:2,chain:2,ligand:1}};
function dedupe(L){ var seen={}; return L.filter(function(x){ var k=x.k+'|'+x.t.toLowerCase(); if(seen[k]) return false; seen[k]=1; return true; }); }
function cmdApply(text,cand,cur){   // what the line becomes when a suggestion is taken
  if(cand.line) return cand.t+' ';
  var base=text.slice(0,text.length-cur.length);
  return base+cand.t+' ';
}
function cmdRefresh(){
  var inp=$('cmdInput'), v=inp.value, pop=$('cmdPop'), gh=$('cmdGhost');
  if(document.activeElement!==inp||!v.trim()&&!CMD.forceOpen){ pop.hidden=true; CMD.sug=[]; gh.innerHTML=''; return; }
  var r=cmdSuggest(v); CMD.sug=r.list; CMD.cur=r.cur; if(CMD.si>=CMD.sug.length) CMD.si=-1;
  var top=CMD.sug[CMD.si>=0?CMD.si:0], ghost='';
  if(top){ var full=cmdApply(v,top,r.cur).replace(/ $/,''); if(full.toLowerCase().indexOf(v.toLowerCase())===0&&full.length>v.length) ghost=full.slice(v.length); }
  gh.innerHTML='<span class="cg-t">'+escapeHtml(v)+'</span><span class="cg-r">'+escapeHtml(ghost)+'</span>'; gh.scrollLeft=inp.scrollLeft;
  CMD.ghost=ghost;
  if(!CMD.sug.length){ pop.hidden=true; return; }
  pop.innerHTML=CMD.sug.map(function(x,i){
    var sw=x.hex?'<i class="cp-sw2" style="background:'+x.hex+'"></i>':'', ic={cmd:'cmd',hist:'again',chain:'chain',lig:'ligand',word:'word',colour:'',scheme:'scheme',rep:'draw',num:'value',resn:'res',atom:'atom',thing:'show',id:'entry'}[x.k]||'';
    return '<div class="cp-it'+(i===(CMD.si>=0?CMD.si:0)?' on':'')+'" role="option" data-i="'+i+'" aria-selected="'+(i===CMD.si)+'"><span class="cp-k cp-k-'+x.k+'">'+(sw||escapeHtml(ic))+'</span><span class="cp-t">'+escapeHtml(x.t)+'</span><span class="cp-d">'+escapeHtml(x.d||'')+'</span></div>';
  }).join('')+'<div class="cp-foot"><kbd>Tab</kbd> take · <kbd>↑</kbd><kbd>↓</kbd> choose · <kbd>Enter</kbd> run · <kbd>Esc</kbd> close</div>';
  pop.hidden=false;
}
function cmdTake(i){
  var inp=$('cmdInput'), x=CMD.sug[i==null?(CMD.si>=0?CMD.si:0):i]; if(!x) return false;
  inp.value=cmdApply(inp.value,x,CMD.cur); CMD.si=-1; inp.setSelectionRange(inp.value.length,inp.value.length); cmdRefresh(); return true;
}
var _sayT=null;
function cmdSay(res){
  var el=$('cmdOut'); if(!el||!res) return;
  el.textContent=res.err||res.ok||''; el.className='cmd-out '+(res.err?'err':'ok'); el.hidden=false;
  clearTimeout(_sayT); _sayT=setTimeout(function(){ el.hidden=true; inspectorPaint(); },res.err?7000:3500);
  $('cmdInsp').hidden=true;
}
function cmdHelp(){
  var pop=$('cmdPop');
  pop.innerHTML='<div class="cp-help">'+RB_CMDS.map(function(c){ return '<div class="cp-h"><b>'+escapeHtml(c.n[0])+'</b>'+(c.n.length>1?'<span class="cp-al">'+escapeHtml(c.n.slice(1,4).join(' · '))+'</span>':'')+'<span>'+escapeHtml(c.d)+'</span><code>'+escapeHtml(c.f.split(' · ')[0])+'</code></div>'; }).join('')+'</div>'
    +'<div class="cp-foot">A selection: <code>chain A</code> <code>/A:45-60</code> <code>lys</code> <code>ligand</code> <code>within 5 of ligand</code> <code>helix and not chain B</code> · <kbd>Esc</kbd> close</div>';
  pop.hidden=false; CMD.helpOpen=true;
}
// What is under the pointer, or what is selected, at the right of the command line (the inspector).
var _inspAtom=null;
function inspectorPaint(){
  var el=$('cmdInsp'); if(!el) return;
  if($('cmdOut')&&!$('cmdOut').hidden) return;
  var t='';
  if(_inspAtom){
    var a=_inspAtom; t=(a.chain&&a.chain.trim()?a.chain+' · ':'')+a.resn+' '+a.resi+String(a.icode||'').trim()+' · '+a.atom+(typeof a.b==='number'?' · '+(isAF()?'pLDDT ':'B ')+a.b.toFixed(1):'');
    var near=nearestLigandDist(a); if(near) t+=' · '+near.d.toFixed(1)+' Å from '+near.l.resn;
  } else if(_selN) t=selDescribe();
  else if(currentModel) t=currentPdbId+' · '+chainList.length+(chainList.length===1?' chain':' chains')+(ligands.length?' · '+ligands.length+(ligands.length===1?' ligand':' ligands'):'');
  el.textContent=t; el.hidden=!t;
}
var _ligAtomsCache=null;
function nearestLigandDist(a){
  if(!ligands.length||!currentModel) return null;
  if(!_ligAtomsCache){ _ligAtomsCache=[]; ligands.forEach(function(l){ currentModel.selectedAtoms(ligSel(l)).forEach(function(x){ _ligAtomsCache.push({x:x.x,y:x.y,z:x.z,l:l}); }); }); }
  var best=null, bd=1e9; _ligAtomsCache.forEach(function(p){ var dx=p.x-a.x, dy=p.y-a.y, dz=p.z-a.z, d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; best=p; } });
  if(!best||isLigandAtom(a)) return null; var d=Math.sqrt(bd); return d<=12?{d:d,l:best.l}:null;
}
function isLigandAtom(a){ return ligands.some(function(l){ return l.resn===a.resn&&l.chain===(a.chain||'')&&l.resi===a.resi; }); }
function cmdWire(){
  cmdLoad();
  var inp=$('cmdInput'), pop=$('cmdPop');
  inp.addEventListener('input',function(){ CMD.si=-1; CMD.hi=-1; CMD.helpOpen=false; cmdRefresh(); });
  inp.addEventListener('focus',function(){ document.body.classList.add('cmd-focus'); cmdRefresh(); });
  inp.addEventListener('blur',function(){ document.body.classList.remove('cmd-focus'); setTimeout(function(){ if(document.activeElement!==inp){ pop.hidden=true; $('cmdGhost').innerHTML=''; } },120); });
  inp.addEventListener('scroll',function(){ $('cmdGhost').scrollLeft=inp.scrollLeft; });
  inp.addEventListener('keydown',function(e){
    var open=!pop.hidden&&CMD.sug.length&&!CMD.helpOpen;
    if(e.key==='Tab'){ e.preventDefault(); if(open||CMD.ghost){ if(e.shiftKey&&open){ CMD.si=(CMD.si<=0?CMD.sug.length:CMD.si)-1; cmdRefresh(); } else cmdTake(); } return; }
    if(e.key==='ArrowRight'&&inp.selectionStart===inp.value.length&&CMD.ghost){ e.preventDefault(); cmdTake(); return; }
    if(e.key==='ArrowDown'){ e.preventDefault(); if(open){ CMD.si=(CMD.si+1)%CMD.sug.length; cmdRefresh(); } else if(CMD.hi>=0){ CMD.hi++; if(CMD.hi>=CMD.hist.length){ CMD.hi=-1; inp.value=CMD.draft; } else inp.value=CMD.hist[CMD.hi]; } return; }
    if(e.key==='ArrowUp'){ e.preventDefault();
      if(open&&CMD.si>=0){ CMD.si=CMD.si-1; cmdRefresh(); return; }
      if(!CMD.hist.length) return; if(CMD.hi<0){ CMD.draft=inp.value; CMD.hi=CMD.hist.length; } CMD.hi=Math.max(0,CMD.hi-1); inp.value=CMD.hist[CMD.hi]; pop.hidden=true; $('cmdGhost').innerHTML=''; return; }
    if(e.key==='Enter'){ e.preventDefault();
      if(open&&CMD.si>=0){ cmdTake(); return; }
      var v=inp.value; if(!v.trim()) return; var res=runCommand(v); inp.value=''; CMD.si=-1; pop.hidden=true; $('cmdGhost').innerHTML=''; if(res&&res.err){ inp.value=v; inp.select(); } return; }
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); if(!pop.hidden){ pop.hidden=true; CMD.helpOpen=false; } else { inp.blur(); } return; }
  });
  pop.addEventListener('mousedown',function(e){ var it=e.target.closest('.cp-it'); if(!it) return; e.preventDefault(); cmdTake(+it.dataset.i); inp.focus(); });
  _selListeners.push(inspectorPaint);
}
function cmdFocus(prefill){ var inp=$('cmdInput'); if(!inp||$('cmdBar').offsetParent===null) return false; if(prefill!=null){ inp.value=prefill; } inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length); cmdRefresh(); return true; }
