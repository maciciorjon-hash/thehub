/* CalcKit — the bench arithmetic behind the search box.
   Type what you would say ("10 mM to 50 uM in 1 mL") and get the pipetting. Pure functions, no DOM until html()/copy().
   answer(q) -> null when the text is not a calculation, else
     { kind, head, sub, cols, rows, notes:[{t,w}], copy }
   w:true is a warning (the answer is right but the bench will fight it); a card with no head is a question back
   ("add a volume"), never a guess. Nothing here writes anywhere: the answer is for the clipboard. */
var CalcKit = (function(){
  'use strict';
  // ── units. Factors are to the SI base: L, M, g, mol, g/L ─────────────────────────────────────
  var VOL={L:1,mL:1e-3,'µL':1e-6,nL:1e-9};
  var CONC={M:1,mM:1e-3,'µM':1e-6,nM:1e-9,pM:1e-12};
  var MASS={g:1,mg:1e-3,'µg':1e-6,ng:1e-9,pg:1e-12};
  var MOL={mol:1,mmol:1e-3,'µmol':1e-6,nmol:1e-9,pmol:1e-12,fmol:1e-15};
  var MCONC={'g/mL':1e3,'mg/mL':1,'µg/mL':1e-3,'ng/mL':1e-6,'pg/mL':1e-9};
  var SCALE={vol:VOL,conc:CONC,mass:MASS,mol:MOL,mconc:MCONC};
  function lowKey(t){ var o={}; Object.keys(t).forEach(function(k){ o[k.toLowerCase().replace('µ','u')]=t[k]; }); return o; }
  var LOW={vol:lowKey(VOL),conc:lowKey(CONC),mass:lowKey(MASS),mol:lowKey(MOL)};
  function nameOf(dim,f){ var T=SCALE[dim]; for(var k in T) if(Math.abs(T[k]/f-1)<1e-9) return k; return null; }
  // A unit as typed: returns {dim,f,name} or null. "M" is molar only in capitals; "mm" is millimolar, not a length.
  function unit(raw){
    var r=String(raw||'').replace(/[µμ]/g,'u').replace(/°/g,''), l=r.toLowerCase(), i;
    if(!r) return null;
    if(r==='M') return {dim:'conc',f:1,name:'M'};
    if(l==='g/mol'||l==='da') return {dim:'mw',f:1,name:'g/mol'};
    if(l==='kda') return {dim:'mw',f:1000,name:'g/mol'};
    if(l==='x') return {dim:'fold',f:1,name:'×'};
    if(l==='c'||l==='f') return {dim:'temp',f:0,name:'°'+l.toUpperCase()};
    if((i=l.indexOf('/'))>0){
      var a=LOW.mass[l.slice(0,i)], b=LOW.vol[l.slice(i+1)];
      if(a!==undefined&&b!==undefined){ var cf=a/b; return {dim:'mconc',f:cf,name:nameOf('mconc',cf)||r}; }
      return null; }
    for(var d in LOW) if(LOW[d][l]!==undefined){ if(l==='m') return null; return {dim:d,f:LOW[d][l],name:nameOf(d,LOW[d][l])}; }
    return null; }
  function num(s){ s=String(s).trim();
    if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)&&!/^0,/.test(s)) return parseFloat(s.replace(/,/g,''));
    return parseFloat(s.replace(',','.')); }
  // ── reading the text ─────────────────────────────────────────────────────────────────────────
  function norm(q){ return String(q||'').replace(/[µμ]/g,'u').replace(/→|=>|->/g,' to ').replace(/[×]/g,'x')
    .replace(/[–—]/g,'-').replace(/ /g,' ').replace(/\s+/g,' ').trim(); }
  // Every "number unit" in the text, in order. A number glued to a letter before it (EX41, HCT116) is not one.
  function tokens(s){ var out=[], re=/(^|[^\w.])([-+]?\d+(?:[.,]\d+)*(?:e[-+]?\d+)?)\s*([a-z°%]+(?:\/[a-z]+)?)?/gi, m;
    while((m=re.exec(s))){
      var u=m[3]?unit(m[3]):null, v=num(m[2]);
      if(isNaN(v)) continue;
      out.push({v:v,raw:m[3]||'',u:u,dim:u?u.dim:null,si:u&&u.dim!=='temp'?v*u.f:v,at:m.index+m[1].length,end:m.index+m[0].length}); }
    return out; }
  function take(s,re){ var m=re.exec(s); if(!m) return null; return {m:m,rest:(s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim()}; }
  // Molecular weight: "mw 450.5", "MW=450.5 g/mol", "450.5 g/mol", "55 kDa". Returned in g/mol, with the text it came from removed.
  function readMw(s){
    var t=take(s,/\b(?:mw|m\.w\.|mol(?:ecular)?\.? ?(?:weight|wt))\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(kda|da|g\/mol)?(?![a-z])/i)
         ||take(s,/(\d+(?:[.,]\d+)?)\s*(kda|da|g\/mol)(?![a-z])/i);
    if(!t) return {mw:null,rest:s};
    var v=num(t.m[1]), u=(t.m[2]||'').toLowerCase();
    return {mw:v*(u==='kda'?1000:1),rest:t.rest}; }
  // ── showing numbers ──────────────────────────────────────────────────────────────────────────
  function r3(x,sig){ return Number(x.toPrecision(sig||3)); }
  function group(n){ return n>=10000?n.toLocaleString('en-US'):String(n); }
  // x in SI, shown in the unit that puts it between 1 and 1000: 995 µL, 4.51 mg, 370 nM.
  function fmt(x,table,sig){ var names=Object.keys(table).sort(function(a,b){ return table[b]-table[a]; });
    if(!isFinite(x)||x===0) return '0 '+names[names.length-1];
    var i=0; while(i<names.length-1 && x<table[names[i]]*(1-1e-9)) i++;
    var v=r3(x/table[names[i]],sig); if(v>=1000&&i>0){ i--; v=r3(x/table[names[i]],sig); }
    return group(v)+' '+names[i]; }
  // 0.5 µL reads as 0.5 µL, not 500 nL: nothing at the bench is measured in nanolitres.
  function fv(x){ if(x>=9.9e-8&&x<1e-6) return group(r3(x/1e-6))+' µL'; return fmt(x,VOL); }
  function fc(x){ return fmt(x,CONC); } function fm(x,sig){ return fmt(x,MASS,sig); }
  function fn(x){ return fmt(x,MOL); } function fq(x){ return fmt(x,MCONC); }
  function fx(x){ return group(r3(x)); }
  function fOf(dim,x){ return dim==='vol'?fv(x):dim==='conc'?fc(x):dim==='mass'?fm(x):dim==='mol'?fn(x):dim==='mconc'?fq(x):fx(x)+'×'; }
  function card(kind,head,sub,extra){ var c={kind:kind,head:head||'',sub:sub||'',cols:null,rows:null,notes:[]}; for(var k in (extra||{})) c[k]=extra[k]; return c; }
  function note(c,t,w){ c.notes.push({t:t,w:!!w}); return c; }
  function finish(c){ var L=[]; if(c.head) L.push(c.head); if(c.sub) L.push(c.sub);
    if(c.rows){ if(c.cols) L.push(c.cols.join('\t')); c.rows.forEach(function(r){ L.push(r.join('\t')); }); }
    c.notes.forEach(function(n){ L.push((n.w?'! ':'')+n.t); }); c.copy=L.join('\n'); return c; }
  // ── dilution ─────────────────────────────────────────────────────────────────────────────────
  // Below this a hand pipette is guessing; the card says so and offers the intermediate that is not.
  var MIN_UL=1;
  // Stages of at most 1:100, each made from 2 µL, until the volume finally taken is 2 µL or more.
  function intermediate(V1){
    var take=V1, g=[];
    while(take<2e-6&&g.length<4){ var x=10; while(take*x<2e-6&&x<100) x*=10; g.push(x); take*=x; }
    var L=g.map(function(x,j){ return 'step '+(j+1)+': 2 µL '+(j?'of step '+j:'stock')+' + '+fv((2*x-2)*1e-6)+' diluent (1:'+x+', '+fv(2*x*1e-6)+')'; });
    return 'Go through '+(g.length>1?g.length+' intermediates':'an intermediate')+' — '+L.join('; ')+' — then take '+fv(take)+' of the last.'; }
  function dilute(C1,C2,V2,dim,label){
    var F=C1/C2;
    if(!(F>=1)){ var e=card('Dilution','Stock is more dilute than the target',fOf(dim,C1)+' → '+fOf(dim,C2));
      return note(e,'A stock cannot be diluted up. Use a stronger stock, or concentrate this one.',true); }
    if(F===1) return card('Dilution','No dilution: stock and target are both '+fOf(dim,C1));
    var c=card('Dilution');
    if(V2){ var V1=V2/F;
      c.head='Take '+fv(V1)+' '+(label||'stock')+' + '+fv(V2-V1)+' diluent';
      c.sub=fv(V2)+' at '+fOf(dim,C2)+'  ·  1:'+fx(F)+' ('+fx(F-1)+' parts diluent to 1 of stock)';
      if(V1<MIN_UL*1e-6) note(c,'Under '+MIN_UL+' µL a hand pipette is guessing. '+intermediate(V1),true);
    } else {
      c.head='Dilute 1:'+fx(F)+' — 1 part stock + '+fx(F-1)+' parts diluent';
      c.sub=fOf(dim,C1)+' → '+fOf(dim,C2)+'.  Per 1 mL: '+fv(1e-3/F)+' + '+fv(1e-3-1e-3/F);
      note(c,'Add a final volume (“in 1 mL”) to get the pipetting for it.');
    }
    // Compound plates are made in DMSO: say what the cells will see. Above 0.5 % most lines notice.
    if(dim==='conc'&&100/F>=0.01){ var pc=100/F; note(c,'If the stock is in DMSO the final carries '+fx(pc)+' % DMSO.',pc>0.5); }
    return c; }
  function ratioDilution(r,V2,hasVol){
    var c=card('Dilution');
    if(!(r>1)) return null;
    if(hasVol){ var V1=V2/r; c.head='Take '+fv(V1)+' + '+fv(V2-V1)+' diluent'; c.sub=fv(V2)+' at 1:'+fx(r)+' (1 part in '+fx(r)+' of the final volume)';
      if(V1<MIN_UL*1e-6) note(c,'Under '+MIN_UL+' µL a hand pipette is guessing. '+intermediate(V1),true);
    } else { c.head='1:'+fx(r)+' — 1 part in '+fx(r)+' of the final volume'; c.sub='Per 10 mL: '+fv(1e-2/r)+' + '+fv(1e-2-1e-2/r)+' diluent'; note(c,'Add a final volume (“in 10 mL”) to get the pipetting for it.'); }
    note(c,'Read as 1 part in '+fx(r)+' total, the way antibody dilutions are written — not 1 : '+fx(r)+' by volume.');
    return c; }
  // ── serial dilution ──────────────────────────────────────────────────────────────────────────
  function serial(s){
    var t=norm(s).toLowerCase(), f=null, n=null, m;
    if((m=/half[- ]?log/.exec(t))) f=Math.sqrt(10);
    else if((m=/(\d+(?:\.\d+)?)\s*-?\s*fold/.exec(t))) f=parseFloat(m[1]);
    else if((m=/1\s*:\s*(\d+(?:\.\d+)?)/.exec(t))) f=parseFloat(m[1]);
    else if((m=/(?:^|[\s,])(\d+(?:\.\d+)?)\s*x(?![a-z0-9])/.exec(t))) f=parseFloat(m[1]);
    if((m=/(\d+)\s*(?:steps?|points?|pts?|concs?|concentrations?|wells?|tubes?|doses?|dilutions?)/.exec(t))) n=parseInt(m[1],10);
    else if((m=/(?:^|\s)x\s*(\d+)(?!\d|\.|\s*(?:l|ml|ul|nl|m|mm|um|nm|pm|g|mg|ug|ng)\b)/.exec(t))) n=parseInt(m[1],10);
    var tk=tokens(norm(s)).filter(function(k){ return k.dim==='conc'||k.dim==='vol'||k.dim==='mconc'; });
    var top=tk.filter(function(k){ return k.dim!=='vol'; })[0], vol=tk.filter(function(k){ return k.dim==='vol'; })[0];
    var c=card('Serial dilution');
    if(!(f>1)||!(n>=2)||!top){
      c.head='Serial dilution needs a factor, a count and a top concentration';
      c.sub='e.g.  serial 1:3 x 8 from 10 µM, 100 µL'; return finish(c); }
    if(n>24){ c.head='At most 24 points'; return finish(c); }
    var dim=top.dim, T=vol?vol.si/f:null, D=vol?vol.si-T:null;
    c.head=n+' points, 1:'+fx(f)+' ('+fx(f)+'-fold) from '+fOf(dim,top.si);
    c.cols=['#','Concentration']; if(vol) c.cols.push('Transfer','Diluent');
    c.rows=[];
    for(var i=0;i<n;i++){ var row=[String(i+1),fOf(dim,top.si/Math.pow(f,i))];
      if(vol) row.push(i===0?'—':fv(T), i===0?'—':fv(D));
      c.rows.push(row); }
    c.sub='lowest '+fOf(dim,top.si/Math.pow(f,n-1));
    if(vol){ note(c,'Each tube holds '+fv(vol.si)+' once mixed: '+fv(T)+' from the one before + '+fv(D)+' diluent. Tubes 1–'+(n-1)+' give '+fv(T)+' onward, so make the top '+fv(vol.si)+' and mix before each transfer.');
      if(T<MIN_UL*1e-6) note(c,'Transfers under '+MIN_UL+' µL are not reliable; use a larger volume.',true);
    } else note(c,'Add a volume per tube (“100 µL”) to get the transfers.');
    return finish(c); }
  // ── master mix ───────────────────────────────────────────────────────────────────────────────
  function mastermix(s){
    var t=norm(s), c=card('Master mix'), over=10, m;
    t=t.replace(/^(?:master ?mix|mastermix|mix)\b[:\s]*/i,'');
    if((m=/\+\s*(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s*(?:extra|overage|overfill)?/i.exec(t))){ over=parseFloat(m[1]||m[2]); t=(t.slice(0,m.index)+' '+t.slice(m.index+m[0].length)); }
    var nm=/(\d+)\s*(?:rx|rxn|rxns|reactions?|samples?|wells?|tubes?|x)\b/i.exec(t);
    if(!nm){ c.head='Master mix needs a number of reactions'; c.sub='e.g.  mastermix 24 rx 10 + 2 + 0.5 µL +10%'; return finish(c); }
    var n=parseInt(nm[1],10); t=t.slice(0,nm.index)+' '+t.slice(nm.index+nm[0].length);
    var total=null, parts;
    var ci=t.indexOf(':');
    if(ci>=0){ var tt=tokens(t.slice(0,ci)).filter(function(k){ return k.dim==='vol'; })[0]; if(tt) total=tt.si; t=t.slice(ci+1); }
    parts=t.split(/\s*[+,;]\s*|\s+and\s+/i).map(function(p){ return p.trim(); }).filter(Boolean);
    var comp=[], lastU=null, i;
    for(i=parts.length-1;i>=0;i--){ var tk=tokens(parts[i])[0]; if(tk&&tk.dim==='vol') lastU=tk.u; }
    var rem=null;
    parts.forEach(function(p){
      var tk=tokens(p)[0], name=tk?(p.slice(0,tk.at)+' '+(tk.u?'':tk.raw)+' '+p.slice(tk.end)).replace(/\s+/g,' ').trim():p;
      if(tk&&tk.dim==='vol') comp.push({name:name,v:tk.si});
      else if(tk&&!tk.dim) comp.push({name:name,v:tk.v*(lastU?lastU.f:1e-6)});
      else if(/^(?:water|h2o|h₂o|nfw|nuclease[- ]free water|ddh2o|diluent)$/i.test(p)) rem={name:p};
    });
    if(!comp.length){ c.head='Master mix needs the volume of each component'; c.sub='e.g.  mastermix 24 rx 10 + 2 + 0.5 µL +10%'; return finish(c); }
    var sum=comp.reduce(function(a,k){ return a+k.v; },0);
    if(rem){ if(total===null){ c.head='Water to volume needs the volume per reaction'; c.sub='e.g.  mastermix 24 x 20 µL: 10 + 2 + water'; return finish(c); }
      if(total<sum){ c.head='The components add up to '+fv(sum)+', more than '+fv(total)+' per reaction'; return finish(c); }
      comp.push({name:rem.name,v:total-sum}); sum=total; }
    var k=n*(1+over/100);
    c.head=fv(sum*k)+' of mix for '+n+' reactions';
    c.sub=fv(sum)+' per reaction × '+fx(k)+' ('+n+' + '+fx(over)+' % overage)';
    c.cols=['Component','Per reaction','Master mix']; c.rows=comp.map(function(x,j){ return [x.name||('Component '+(j+1)),fv(x.v),fv(x.v*k)]; });
    c.rows.push(['Total',fv(sum),fv(sum*k)]);
    note(c,'Overage declared: '+fx(over)+' % extra, so '+fx(k)+' reactions are made for '+n+'. Dispense '+fv(sum)+' per reaction.');
    comp.forEach(function(x){ if(x.v*k<MIN_UL*1e-6) note(c,(x.name||'A component')+' comes to '+fv(x.v*k)+' in the mix, under '+MIN_UL+' µL: scale the batch up or pre-dilute it.',true); });
    return finish(c); }
  // ── molarity: mass ↔ amount ↔ concentration ↔ volume ─────────────────────────────────────────────────
  function molarity(tk,mw){
    var by=function(d){ return tk.filter(function(k){ return k.dim===d; })[0]; };
    var mass=by('mass'), mol=by('mol'), conc=by('conc'), mconc=by('mconc'), vol=by('vol');
    var m=mass?mass.si:(mol?mol.si*mw:null), C=conc?conc.si:(mconc?mconc.si/mw:null), V=vol?vol.si:null;
    var c=card('Molarity'), given=(m!==null?1:0)+(C!==null?1:0)+(V!==null?1:0);
    if(given<2){ if(m!==null){ c.head=fm(m)+' = '+fn(m/mw); c.sub='at '+fx(mw)+' g/mol'; return finish(c); }
      c.head='Molarity needs two of: mass, concentration, volume'; c.sub='e.g.  mw 450.5  10 mM  1 mL'; return finish(c); }
    if(m!==null&&C!==null&&V!==null){ c.head='Give two of mass, concentration and volume, not three'; return finish(c); }
    if(m===null){ m=C*V*mw; c.head='Weigh '+fm(m,4)+', dissolve to '+fv(V)+' for '+fc(C); c.sub=fn(C*V)+' at '+fx(mw)+' g/mol';
      if(m<1e-3) note(c,'Under 1 mg a balance is guessing. For '+fc(C)+' make '+fv(2e-3/(C*mw))+' (2 mg) and aliquot.',true); }
    else if(V===null){ V=m/mw/C; c.head='Dissolve '+fm(m,4)+' in '+fv(V)+' for '+fc(C); c.sub=fn(m/mw)+' at '+fx(mw)+' g/mol'; }
    else { C=m/mw/V; c.head=fm(m,4)+' in '+fv(V)+' is '+fc(C); c.sub=fn(m/mw)+' at '+fx(mw)+' g/mol'; }
    note(c,'Volume of the solid is ignored: bring to the final volume, do not add it to a measured volume.');
    return finish(c); }
  // ── conversion ───────────────────────────────────────────────────────────────────────────────
  function convert(v,target,mw){
    var c=card('Convert'), a=v.u, b=target;
    function show(val,u){ var x=val; return (x>=1e-3&&x<1e6||x===0?(Number(x.toPrecision(4))).toLocaleString('en-US',{maximumSignificantDigits:4}):Number(x.toPrecision(4)).toString())+' '+u; }
    if(a.dim==='temp'){ var fromC=a.name==='°C'?v.v:(v.v-32)*5/9, out=b.name==='°C'?fromC:fromC*9/5+32;
      if(a.dim!==b.dim) return null; c.head=show(out,b.name); c.sub=fx(v.v)+' '+a.name; return finish(c); }
    var base=v.v*a.f, dimA=a.dim, dimB=b.dim, via=null;
    if(dimA!==dimB){
      var need=function(){ c.head='Needs a molecular weight'; c.sub='add  mw 450.5  to convert '+a.name+' to '+b.name; return finish(c); };
      if(dimA==='mass'&&dimB==='mol'){ if(!mw) return need(); base=base/mw; via=fx(mw)+' g/mol'; }
      else if(dimA==='mol'&&dimB==='mass'){ if(!mw) return need(); base=base*mw; via=fx(mw)+' g/mol'; }
      else if(dimA==='mconc'&&dimB==='conc'){ if(!mw) return need(); base=base/mw; via=fx(mw)+' g/mol'; }
      else if(dimA==='conc'&&dimB==='mconc'){ if(!mw) return need(); base=base*mw; via=fx(mw)+' g/mol'; }
      else { c.head='Cannot convert '+a.name+' to '+b.name; c.sub='different kinds of quantity'; return finish(c); } }
    c.head=show(base/b.f,b.name); c.sub=fx(v.v)+' '+a.name+(via?'  at '+via:'');
    return finish(c); }
  // ── the one entry point ──────────────────────────────────────────────────────────────────────
  function answer(q){
    var s=norm(q); if(!s||s.length>200) return null;
    if(/^(?:master ?mix|mastermix|mix)\b/i.test(s)&&/\d/.test(s)) return mastermix(s);
    var lc=s.toLowerCase();
    if((/\bserial\b|\bseries\b|titrat|half[- ]?log|\d\s*-?\s*fold/.test(lc))&&/\d/.test(lc)) return serial(s);
    var W=readMw(s), mw=W.mw, body=W.rest, tk=tokens(body);
    var valued=tk.filter(function(k){ return k.dim; });
    // "250 nM to pM": one quantity, then a unit with no number.
    var tg=/\b(?:to|in|as|into)\s+([a-zµ°%]+(?:\/[a-z]+)?)\s*$/i.exec(body);
    if(tg&&valued.length===1){ var tu=unit(tg[1]); if(tu){
      var r=convert(valued[0],tu,mw); if(r) return r; } }
    var concs=valued.filter(function(k){ return k.dim==='conc'||k.dim==='mconc'||k.dim==='fold'; }), vols=valued.filter(function(k){ return k.dim==='vol'; });
    if(concs.length===2){
      var A=concs[0], B=concs[1], ordered=/\bto\b/.test(body), dim=A.dim;
      if(A.dim!==B.dim){
        if(!mw){ var e=card('Dilution','Needs a molecular weight','to compare '+A.u.name+' with '+B.u.name); return finish(note(e,'add  mw 450.5',false)); }
        if(A.dim==='mconc'){ A={si:A.si/mw,dim:'conc'}; } else if(B.dim==='mconc'){ B={si:B.si/mw,dim:'conc'}; }
        dim='conc'; }
      var hi=A.si, lo=B.si; if(!ordered&&lo>hi){ var t2=hi; hi=lo; lo=t2; }
      return finish(dilute(hi,lo,vols.length?vols[0].si:null,dim)); }
    var rm=/(?:^|[^\d.])1\s*:\s*(\d+(?:\.\d+)?)/.exec(body);
    if(rm&&!concs.length){ if(!vols.length&&!/\bdilut/i.test(body)) return null; var rr=ratioDilution(parseFloat(rm[1]),vols.length?vols[0].si:null,vols.length>0); if(rr) return finish(rr); }
    if(mw&&valued.length) return molarity(valued,mw);
    return null; }
  // ── showing a card (the host supplies esc) ──────────────────────────────────────────────────
  function html(r,esc){ if(!r) return '';
    var h='<div class="cq-card"><div class="cq-k">'+esc(r.kind)+'</div>'+(r.head?'<div class="cq-head">'+esc(r.head)+'</div>':'')+(r.sub?'<div class="cq-sub">'+esc(r.sub)+'</div>':'');
    if(r.rows){ h+='<table class="cq-t">'; if(r.cols) h+='<tr>'+r.cols.map(function(c){ return '<th>'+esc(c)+'</th>'; }).join('')+'</tr>';
      r.rows.forEach(function(row){ h+='<tr>'+row.map(function(c){ return '<td>'+esc(c)+'</td>'; }).join('')+'</tr>'; }); h+='</table>'; }
    r.notes.forEach(function(n){ h+='<div class="cq-n'+(n.w?' cq-w':'')+'">'+(n.w?'⚠ ':'')+esc(n.t)+'</div>'; });
    return h+'<div class="cq-hint">Enter to copy</div></div>'; }
  function copy(text,done){
    function fallback(){ try{ var ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); var ok=document.execCommand('copy'); document.body.removeChild(ta); done&&done(ok); }catch(e){ done&&done(false); } }
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ done&&done(true); },fallback); return; } }catch(e){}
    fallback(); }
  return {answer:answer, html:html, copy:copy, unit:unit, tokens:tokens};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=CalcKit;
