// The help assistant, the same in every place that has one. No model behind it: a written knowledge
// base per app, searched the way Cmd+K searches, and a way to point at the real control.
//
//   assistRegister(id, kb)  kb = { name, blurb, first:[topic ids], screen(w)->id, diag(w)->[{msg, t?}],
//                                  avoid:[selectors], topics:[ … ] }
//   topic = { id, t:'title', q:['phrases people type, English and Spanish'], on:[screen ids],
//             a:'lead' | ['paragraphs'] | function(ctx)->…, steps:['…'], tip:'…', warn:'…',
//             show: 'selector' | {sel, say, miss} | [ … ],   // pointed at in the real page; miss = what to say when it is not on screen yet
//             prep: function(w){}                      // brings the screen up before pointing
//             go:[{l:'label', fn:'globalFunction', args:[…]} | {l, app:'appId'} | {l, hub:'shellFunction', args}],
//             see:['other topic ids'], group:'browse heading' }
//   Text takes **bold**, `code` and [[topic-id|label]] links. Functions in a kb receive the app's window.
//   assistOpen(), assistClose(), assistAsk('text')
//
// Inside dHUB the shell holds every app's knowledge base and draws the one bubble; an app that finds
// itself in the Hub draws nothing. On its own an app draws its own bubble with its own knowledge.
// Only what the person can open is ever answered: the shell asks ASSIST_HOST.can(id) before it speaks.
var assistRegister, assistOpen, assistClose, assistAsk, assistToggle;
(function(){
  var KBS = {}, ORDER = [];
  var H = null;                                    // the shell's ASSIST_HOST, if this page is or sits in the shell
  var PARENT = null;                               // a page around us that has its own assistant (Archive inside the standalone Labbook)
  try {
    if (window.ASSIST_HOST) H = window.ASSIST_HOST;
    else if (window.parent !== window) { if (window.parent.ASSIST_HOST) H = window.parent.ASSIST_HOST; else if (typeof window.parent.assistRegister === 'function') PARENT = window.parent; }
  } catch (e) {}
  var IN_SHELL = !!window.ASSIST_HOST, IN_HUB = !IN_SHELL && !!H;
  var topW = window;
  var D = document;

  assistRegister = function(id, kb){
    if (!kb || !kb.topics) return;
    if (IN_HUB) return;                            // the shell already holds this app's notes
    if (PARENT) { kb._win = window; try { PARENT.assistRegister(id, kb); } catch (e) {} return; }
    kb.id = id; KBS[id] = kb; if (ORDER.indexOf(id) < 0) ORDER.push(id);
    if (id !== 'hub' && kb.blurb && !kb.topics.some(function(t){ return t.id === 'about'; })) {
      var nm = kb.name || id;                        // "What is X?" is written once, from the blurb
      kb.topics.unshift({ id: 'about', t: 'What is ' + nm + '?', group: 'Overview', q: ['about ' + nm, 'what does ' + nm + ' do', 'what is ' + nm + ' for', 'que es ' + nm, 'para que sirve ' + nm, nm],
        a: kb.blurb, go: [{ l: 'Open ' + nm, app: id }] });
    }
    (kb.topics || []).forEach(function(t){ t._kb = id; });
  };

  // ── words ─────────────────────────────────────────────────────────────────
  var STOP = {}; ('a an the to of in on for and or is are do does did i my me it how can what where why when which with without from at as be this that you your could should would please se de el la los las un una y o en para por con sin que como cual cuando donde porque puedo puede pueden hago hacer haces quiero quiere necesito hay es son mi mis tu al del ya lo le les hacerlo ayuda ayudame tengo tiene there here get').split(' ').forEach(function(w){ STOP[w] = 1; });
  var SYN = [
    ['delete','remove','erase','clear','borrar','eliminar','quitar','limpiar','suprimir','vaciar'],
    ['add','create','new','make','crear','anadir','agregar','nuevo','nueva','insertar','insert'],
    ['export','download','save','descargar','exportar','guardar'],
    ['import','load','upload','drop','cargar','subir','importar','arrastrar','soltar','drag'],
    ['open','abrir'], ['close','cerrar'],
    ['plate','placa','plato'], ['well','pocillo','pozo','pocillos','pozos'],
    ['compound','compuesto','molecule','molecula'],
    ['concentration','dose','dosis','concentracion','conc'],
    ['dilution','dilucion','diluir','dilute','series','serie'],
    ['control','controls','controles','ctrl'],
    ['curve','curva','sigmoid','sigmoide'], ['fit','ajuste','ajustar','fitting','fitear'],
    ['result','resultado','output','salida'],
    ['chart','plot','graph','grafico','grafica','figure','figura'],
    ['unit','unidad','unidades','units'],
    ['sync','sincronizar','sincronizacion','synchronise','synchronize','cloud','nube'],
    ['backup','copia','respaldo','restore','restaurar','recuperar','recover'],
    ['experiment','experimento','run','ensayo','assay'],
    ['step','paso','pasos'], ['note','nota','anotacion','annotation','annotate','anotar','comentario','comment'],
    ['start','begin','empezar','comenzar','inicio','primeros','first','primer','onboarding','tutorial'],
    ['error','fail','failed','falla','fallo','problema','problem','bug','roto','broken','wrong','mal'],
    ['copy','copiar'], ['paste','pegar'], ['undo','deshacer','revert','revertir'],
    ['print','imprimir','pdf'], ['share','send','enviar','mandar','compartir'],
    ['setting','settings','ajustes','configuracion','preferencias','opciones','preferences','options'],
    ['dark','oscuro','theme','tema','night','noche'],
    ['phone','movil','celular','mobile','iphone','android','telefono'],
    ['offline','sinconexion','signal','senal'], ['install','instalar','pwa'],
    ['cell','celula','celulas','line','linea'], ['sequence','secuencia','dna','adn'],
    ['primer','cebador','oligo'], ['antibody','anticuerpo','ab'], ['protocol','protocolo'],
    ['calculator','calculadora','calculate','calcular','calc'],
    ['volume','volumen'], ['timer','temporizador','cronometro','alarma','countdown'],
    ['search','find','buscar','encontrar','busqueda','buscador','look','lookup'],
    ['name','rename','nombre','renombrar','nombrar','label','etiqueta','etiquetar'],
    ['move','mover','reorder','ordenar'], ['edit','editar','modificar','change','cambiar'],
    ['color','colour','colores','colours','colorear'],
    ['show','mostrar','ver','display'], ['hide','ocultar','esconder'],
    ['select','seleccionar','elegir','escoger','choose','pick'],
    ['row','fila','filas'], ['column','columna','columnas'],
    ['file','archivo','fichero','excel','xlsx','csv','spreadsheet','hoja'],
    ['data','datos'], ['sample','muestra','muestras'],
    ['standard','estandar','patron'], ['unknown','desconocido','desconocidos'],
    ['replicate','replicado','replicados','duplicate','duplicado','triplicate','triplicado'],
    ['login','signin','sign','entrar','acceder','iniciar','sesion','account','cuenta'],
    ['visitor','visitante','guest','invitado'], ['code','codigo','word','palabra','unlock','desbloquear','secret'],
    ['zoom','ampliar','agrandar'], ['image','imagen','picture','foto','png'],
    ['shortcut','atajo','atajos','keyboard','teclado','tecla','teclas','key','keys','hotkey']
  ];
  var CANON = {}; SYN.forEach(function(g){ g.forEach(function(w){ if (!CANON[w]) CANON[w] = g[0]; }); });

  function norm(s){ return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function stem(w){ return (w.length > 3 && /[^s]s$/.test(w)) ? w.slice(0, -1) : w; }
  function toks(s, keepStop){
    var out = [];
    norm(s).split(' ').forEach(function(w){
      if (!w) return;
      if (!keepStop && STOP[w]) return;
      w = stem(w); out.push(CANON[w] || w);
    });
    return out;
  }
  function dam(a, b, max){                          // optimal-string-alignment distance, abandoned past max
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= la; i++) { d[i] = [i]; }
    for (j = 0; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) {
      var rowMin = 99;
      for (j = 1; j <= lb; j++) {
        var c = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[la][lb];
  }
  function sim(q, w){                                // how well a query word matches a word in a topic
    if (q === w) return 1;
    if (q.length >= 3 && w.indexOf(q) === 0) return 0.85;
    if (w.length >= 4 && q.indexOf(w) === 0) return 0.72;
    var tol = q.length < 4 ? 0 : q.length < 8 ? 1 : 2;
    if (tol && dam(q, w, tol) <= tol) return 0.66;
    return 0;
  }
  function best(q, list){ var b = 0; for (var i = 0; i < list.length; i++) { var s = sim(q, list[i]); if (s > b) { b = s; if (b === 1) break; } } return b; }

  // ── the index of one topic, built once ────────────────────────────────────
  function plain(x){ return typeof x === 'function' ? '' : Array.isArray(x) ? x.map(plain).join(' ') : String(x == null ? '' : x); }
  function ix(t){
    if (t._ix) return t._ix;
    var title = toks(t.t), qtok = [], phr = [norm(t.t)];
    (t.q || []).forEach(function(p){ qtok = qtok.concat(toks(p)); phr.push(norm(p)); });
    var body = toks(plain(t.a) + ' ' + plain(t.steps) + ' ' + plain(t.tip) + ' ' + plain(t.warn));
    return (t._ix = { title: title, qtok: qtok, body: body, phr: phr });
  }
  function scoreTopic(qt, qn, t){
    var I = ix(t), sum = 0, strong = 0, i;
    for (i = 0; i < qt.length; i++) {
      var bt = best(qt[i], I.title), bq = best(qt[i], I.qtok), bb = best(qt[i], I.body);
      var b = Math.max(bt, bq * 0.95, bb * 0.4);
      if (bt >= 0.65 || bq >= 0.65) strong++;
      sum += b;
    }
    var s = sum / qt.length * 100;
    for (i = 0; i < I.phr.length; i++) {
      var p = I.phr[i]; if (!p) continue;
      if (p === qn) { s += 30; break; }
      if (qn.length >= 4 && p.indexOf(qn) >= 0) s += 12;
      else if (p.length >= 6 && qn.indexOf(p) >= 0) s += 10;
    }
    if (!strong) s = Math.min(s, 40);
    return s;
  }

  // ── what this person may be told ──────────────────────────────────────────
  function visibleKbs(){
    var out = [];
    ORDER.forEach(function(id){ if (!IN_SHELL || id === 'hub' || !H.can || H.can(id)) out.push(KBS[id]); });
    return out;
  }
  function ok(t){                                     // a topic marked for the admin, or for an app the person cannot open, is not theirs to see
    if (t.needs && (!IN_SHELL || (H.can && !H.can(t.needs)))) return false;   // on its own, an app has no neighbours to send things to
    if (!IN_SHELL) return true;
    if (t.admin && !(H.admin && H.admin())) return false;
    return true;
  }
  function curId(){ try { return IN_SHELL ? (H.current() || 'hub') : (ORDER[0] || 'hub'); } catch (e) { return 'hub'; } }
  function appWin(id){
    if (KBS[id] && KBS[id]._win) return KBS[id]._win;
    if (id === 'hub' || !IN_SHELL) return window;
    try { return H.win(id) || null; } catch (e) { return null; }
  }
  function safe(fn, dflt){ try { return fn(); } catch (e) { return dflt; } }
  function screenOf(kb){ var w = appWin(kb.id); return (kb.screen && w) ? safe(function(){ return kb.screen(w); }, '') : ''; }
  function ctxObj(kb){ return { w: appWin(kb.id), can: function(id){ return !IN_SHELL || id === 'hub' || !H.can || H.can(id); }, admin: !!(IN_SHELL && H.admin && H.admin()), shell: IN_SHELL }; }

  function search(raw){
    var qn = norm(raw), qt = toks(raw);
    if (!qt.length) qt = toks(raw, true);
    if (!qt.length) return [];
    var cur = curId(), curScreen = '', out = [];
    var curKb = KBS[cur]; if (curKb) curScreen = screenOf(curKb);
    visibleKbs().forEach(function(kb){
      kb.topics.forEach(function(t){
        if (!ok(t)) return;
        var s = scoreTopic(qt, qn, t);
        if (s < 30) return;
        if (kb.id === cur) s += 14;
        if (kb.id === cur && curScreen && t.on && t.on.indexOf(curScreen) >= 0) s += 8;
        out.push({ t: t, kb: kb, s: s });
      });
    });
    out.sort(function(a, b){ return b.s - a.s; });
    return out;
  }

  // ── writing ───────────────────────────────────────────────────────────────
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(s){
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<kbd>$1</kbd>')
      .replace(/\[\[([\w:-]+)\|(.+?)\]\]/g, function(_m, id, lbl){ return '<a href="#" class="as-link" data-as="topic" data-k="' + id + '">' + lbl + '</a>'; });
  }
  function listOf(x, ctx){ if (typeof x === 'function') x = safe(function(){ return x(ctx); }, ''); return x == null || x === '' ? [] : Array.isArray(x) ? x : [x]; }
  function key(t){ return t._kb + ':' + t.id; }
  function find(k){
    var kbId = null, id = k;
    if (k.indexOf(':') > 0) { kbId = k.split(':')[0]; id = k.split(':')[1]; }
    var pool = kbId ? [KBS[kbId]] : visibleKbs(), cur = KBS[curId()];
    if (!kbId && cur) pool.unshift(cur);
    for (var i = 0; i < pool.length; i++) { if (!pool[i]) continue; for (var j = 0; j < pool[i].topics.length; j++) if (pool[i].topics[j].id === id && ok(pool[i].topics[j])) return pool[i].topics[j]; }
    return null;
  }
  function showSteps(t){ var s = t.show; return !s ? [] : (Array.isArray(s) ? s : [s]).map(function(x){ return typeof x === 'string' ? { sel: x } : x; }); }

  function answerHtml(t, extra){
    var kb = KBS[t._kb], ctx = ctxObj(kb), h = '<article class="as-a">';
    h += '<h4 class="as-h">' + esc(t.t) + (extra && kb && kb.id !== 'hub' && visibleKbs().length > 1 ? ' <span class="as-tag">' + esc(kb.name) + '</span>' : '') + '</h4>';
    listOf(t.a, ctx).forEach(function(p){ h += '<p>' + fmt(p) + '</p>'; });
    var steps = listOf(t.steps, ctx);
    if (steps.length) h += '<ol class="as-steps">' + steps.map(function(s){ return '<li>' + fmt(s) + '</li>'; }).join('') + '</ol>';
    if (t.tip) h += '<p class="as-note">' + fmt(t.tip) + '</p>';
    if (t.warn) h += '<p class="as-note as-warn">' + fmt(t.warn) + '</p>';
    var btns = '', here = !IN_SHELL || kb.id === 'hub' || curId() === kb.id;
    if (showSteps(t).length) {
      btns += here ? '<button type="button" class="as-btn as-pri" data-as="show" data-k="' + key(t) + '">Show me</button>'
                   : '<button type="button" class="as-btn as-pri" data-as="openshow" data-k="' + key(t) + '">Open ' + esc(kb.name) + ' and show me</button>';
    }
    (t.go || []).forEach(function(g, i){
      if (g.app) { if (!ctx.can(g.app) || !IN_SHELL) return; btns += '<button type="button" class="as-btn" data-as="go" data-k="' + key(t) + '" data-i="' + i + '">' + esc(g.l || 'Open') + '</button>'; return; }
      if (!here) return;
      var w = g.hub ? window : appWin(kb.id);
      if (!w || typeof w[g.fn || g.hub] !== 'function') return;
      btns += '<button type="button" class="as-btn" data-as="go" data-k="' + key(t) + '" data-i="' + i + '">' + esc(g.l || g.fn) + '</button>';
    });
    if (btns) h += '<div class="as-acts">' + btns + '</div>';
    var see = (t.see || []).map(function(id){ return find(kb.id + ':' + id); }).filter(Boolean);
    if (see.length) h += '<div class="as-rel"><span>Also</span>' + see.map(function(x){ return '<a href="#" class="as-chip" data-as="topic" data-k="' + key(x) + '">' + esc(x.t) + '</a>'; }).join('') + '</div>';
    return h + '</article>';
  }

  // ── the panel ─────────────────────────────────────────────────────────────
  var root, body, input, bubble, open = false, MSGS = [], built = false, lastFocus = null;
  var ICON_CHAT = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16.5h-6.2L8.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M10.2 9.6a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.9.7-.9 1.3"/><path d="M12 14.2h.01"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_GO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function build(){
    if (built) return; built = true;
    root = D.createElement('div'); root.id = 'as-root'; root.className = 'as-root';
    root.innerHTML =
      '<button type="button" id="as-bubble" class="as-bubble" aria-label="Help" aria-expanded="false" aria-controls="as-panel" title="Help">' + ICON_CHAT + '</button>' +
      '<section id="as-panel" class="as-panel" role="dialog" aria-label="Help" aria-modal="false">' +
        '<header class="as-hd"><div class="as-hd-t">Help<span class="as-ctx" id="as-ctx"></span></div>' +
          '<button type="button" class="as-hb" data-as="browse">Topics</button>' +
          '<button type="button" class="as-x" data-as="close" aria-label="Close help">' + ICON_X + '</button></header>' +
        '<div class="as-body" id="as-body" aria-live="polite"></div>' +
        '<form class="as-in" id="as-form" autocomplete="off"><input id="as-q" type="text" placeholder="Ask how something works…" enterkeyhint="search" aria-label="Ask"><button type="submit" class="as-send" aria-label="Ask">' + ICON_GO + '</button></form>' +
      '</section>';
    D.body.appendChild(root);
    bubble = root.querySelector('#as-bubble');
    body = root.querySelector('#as-body'); input = root.querySelector('#as-q');
    bubble.addEventListener('click', function(){ assistToggle(); });
    root.addEventListener('click', onClick);
    root.querySelector('#as-form').addEventListener('submit', function(e){ e.preventDefault(); var v = input.value.trim(); if (v) { input.value = ''; ask(v); } });
    D.addEventListener('keydown', function(e){ if (e.key === 'Escape' && open && !spotOn) assistClose(); });
    window.addEventListener('resize', function(){ if (open) avoid(); });
  }

  function say(who, html){ MSGS.push({ who: who, html: html }); draw(true); }
  function draw(scroll){
    if (!body) return;
    if (!MSGS.length) { body.innerHTML = homeHtml(); }
    else body.innerHTML = MSGS.map(function(m){ return m.who === 'me' ? '<div class="as-me">' + esc(m.html) + '</div>' : '<div class="as-bot">' + m.html + '</div>'; }).join('');
    var c = root.querySelector('#as-ctx'), kb = KBS[curId()];
    if (c) c.textContent = kb && kb.id !== 'hub' && visibleKbs().length > 1 ? kb.name : '';
    if (scroll) body.scrollTop = body.scrollHeight;
  }
  function chip(t){ return '<a href="#" class="as-chip" data-as="topic" data-k="' + key(t) + '">' + esc(t.t) + '</a>'; }
  function homeHtml(){
    var kb = KBS[curId()] || KBS.hub || KBS[ORDER[0]], h = '';
    if (!kb) return '<p class="as-lead">Nothing to ask about here yet.</p>';
    h += '<p class="as-lead">' + fmt(kb.blurb || 'Ask how something works, or pick a topic.') + '</p>';
    var w = appWin(kb.id), diag = (kb.diag && w) ? safe(function(){ return kb.diag(w) || []; }, []) : [];
    if (diag.length) h += '<div class="as-now"><b>Right now</b><ul>' + diag.slice(0, 3).map(function(d){
      var t = d.t ? find(kb.id + ':' + d.t) : null;
      return '<li>' + fmt(d.msg) + (t ? ' <a href="#" class="as-link" data-as="topic" data-k="' + key(t) + '">How?</a>' : '') + '</li>'; }).join('') + '</ul></div>';
    var scr = screenOf(kb), here = kb.topics.filter(function(t){ return ok(t) && scr && t.on && t.on.indexOf(scr) >= 0; }).slice(0, 4);
    if (here.length) h += '<div class="as-sec">On this screen</div><div class="as-chips">' + here.map(chip).join('') + '</div>';
    var first = (kb.first || []).map(function(id){ return find(kb.id + ':' + id); }).filter(Boolean).filter(function(t){ return here.indexOf(t) < 0; });
    if (first.length) h += '<div class="as-sec">Start here</div><div class="as-chips">' + first.map(chip).join('') + '</div>';
    if (IN_SHELL && kb.id !== 'hub' && KBS.hub) {
      var about = find('hub:about'); if (about) h += '<div class="as-sec">About dHUB</div><div class="as-chips">' + chip(about) + '</div>';
    }
    return h;
  }
  function browseHtml(){
    var h = '<p class="as-lead">Everything I can answer.</p>';
    var kbs = visibleKbs(), cur = curId();
    kbs.sort(function(a, b){ return (a.id === cur ? -2 : a.id === 'hub' ? -1 : 0) - (b.id === cur ? -2 : b.id === 'hub' ? -1 : 0); });
    kbs.forEach(function(kb){
      var groups = {}, order = [];
      kb.topics.forEach(function(t){ if (!ok(t)) return; var g = t.group || 'General'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(t); });
      h += '<details class="as-grp"' + (kb.id === cur || kbs.length === 1 ? ' open' : '') + '><summary>' + esc(kb.name) + '<span>' + kb.topics.filter(ok).length + '</span></summary>';
      order.forEach(function(g){ h += '<div class="as-gh">' + esc(g) + '</div><div class="as-list">' + groups[g].map(function(t){ return '<a href="#" class="as-li" data-as="topic" data-k="' + key(t) + '">' + esc(t.t) + '</a>'; }).join('') + '</div>'; });
      h += '</details>';
    });
    return h;
  }

  function ask(q){
    say('me', q);
    var res = search(q);
    if (res.length && res[0].s >= 50) {
      var top = res[0], h = answerHtml(top.t, true);
      var more = res.slice(1).filter(function(r){ return r.s >= Math.max(45, top.s * 0.62) && r.t !== top.t; }).slice(0, 3);
      if (more.length) h += '<div class="as-rel"><span>Or</span>' + more.map(function(r){ return '<a href="#" class="as-chip" data-as="topic" data-k="' + key(r.t) + '">' + esc(r.t.t) + '</a>'; }).join('') + '</div>';
      say('bot', h);
    } else {
      var near = res.filter(function(r){ return r.s >= 33; }).slice(0, 4);
      var h2 = '<p>I don’t have an answer for that' + (near.length ? ', but these are close:' : '.') + '</p>';
      if (near.length) h2 += '<div class="as-chips">' + near.map(function(r){ return chip(r.t); }).join('') + '</div>';
      h2 += '<p class="as-note">Try a couple of plain words (“export results”, “add controls”), or <a href="#" class="as-link" data-as="browse">browse every topic</a>.</p>';
      say('bot', h2);
      try { var m = JSON.parse(localStorage.getItem('assist_miss') || '[]'); m.push({ q: q, at: Date.now(), app: curId() }); localStorage.setItem('assist_miss', JSON.stringify(m.slice(-200))); } catch (e) {}
    }
  }
  assistAsk = function(q){ assistOpen(); ask(String(q)); };

  function onClick(e){
    var a = e.target.closest ? e.target.closest('[data-as]') : null; if (!a) return;
    e.preventDefault();
    var k = a.getAttribute('data-k'), act = a.getAttribute('data-as'), t;
    if (act === 'close') return assistClose();
    if (act === 'browse') { MSGS = []; body.innerHTML = browseHtml(); body.scrollTop = 0; return; }
    if (act === 'topic') { t = find(k); if (t) { say('me', t.t); say('bot', answerHtml(t, true)); } return; }
    if (act === 'show') { t = find(k); if (t) runShow(t); return; }
    if (act === 'openshow') { t = find(k); if (t) openThen(t._kb, function(){ runShow(t); }); return; }
    if (act === 'go') { t = find(k); if (!t) return; var g = t.go[+a.getAttribute('data-i')]; if (g) runGo(t, g); }
  }
  function runGo(t, g){
    if (g.app) { if (IN_SHELL && H.open) { assistClose(); H.open(g.app); } return; }
    var w = g.hub ? window : appWin(t._kb), f = g.fn || g.hub;
    if (w && typeof w[f] === 'function') { assistClose(); safe(function(){ w[f].apply(w, g.args || []); }); }
  }
  function openThen(kbId, cb){
    if (!IN_SHELL || !H.open) return cb();
    assistClose(); H.open(kbId);
    var n = 0, iv = setInterval(function(){
      var w = appWin(kbId), ready = w && w.document && w.document.readyState === 'complete' && w.document.body;
      if (ready || ++n > 40) { clearInterval(iv); if (ready) setTimeout(cb, 250); }
    }, 150);
  }

  // ── pointing at the real control ──────────────────────────────────────────
  var spotOn = null;
  function visibleEl(w, sel){
    var els; try { els = w.document.querySelectorAll(sel); } catch (e) { return null; }
    for (var i = 0; i < els.length; i++) { var r = els[i].getBoundingClientRect(); if (r.width > 0 && r.height > 0) return els[i]; }
    return null;
  }
  function offs(w){
    var x = 0, y = 0;
    try { while (w && w !== topW && w.frameElement) { var r = w.frameElement.getBoundingClientRect(); x += r.left; y += r.top; w = w.parent; } } catch (e) {}
    return { x: x, y: y };
  }
  function runShow(t){
    var kb = KBS[t._kb], w = appWin(kb.id), steps = showSteps(t);
    if (!w || !steps.length) return;
    if (t.prep) safe(function(){ t.prep(w); });
    assistClose();
    setTimeout(function(){ spotStart(steps, w); }, t.prep ? 260 : 120);
  }
  function spotStart(steps, w){
    spotEnd(true);
    var i = 0, ring = D.createElement('div'), card = D.createElement('div');
    ring.className = 'as-ring'; card.className = 'as-spot'; card.setAttribute('role', 'status');
    D.body.appendChild(ring); D.body.appendChild(card);
    function place(){
      var st = steps[i], el = visibleEl(w, st.sel);
      if (!el) { ring.style.opacity = '0'; card.innerHTML = '<div class="as-spot-t">' + (st.miss ? fmt(st.miss) : 'I can’t see that on the current screen.') + '</div><div class="as-spot-b"><button type="button" class="as-btn" data-s="end">Close</button></div>'; card.style.left = '16px'; card.style.top = 'auto'; card.style.bottom = '96px'; return; }
      var r = el.getBoundingClientRect(), o = offs(w), pad = 5;
      var x = r.left + o.x - pad, y = r.top + o.y - pad, wd = r.width + pad * 2, ht = r.height + pad * 2;
      ring.style.opacity = '1'; ring.style.width = wd + 'px'; ring.style.height = ht + 'px'; ring.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      var n = steps.length;
      card.innerHTML = (st.say ? '<div class="as-spot-t">' + fmt(st.say) + '</div>' : '') +
        '<div class="as-spot-b">' + (n > 1 ? '<span class="as-spot-n">' + (i + 1) + ' / ' + n + '</span>' : '') +
        (i > 0 ? '<button type="button" class="as-btn" data-s="back">Back</button>' : '') +
        (i < n - 1 ? '<button type="button" class="as-btn as-pri" data-s="next">Next</button>' : '<button type="button" class="as-btn as-pri" data-s="end">Done</button>') + '</div>';
      var cw = card.offsetWidth, ch = card.offsetHeight, vw = topW.innerWidth, vh = topW.innerHeight;
      var cx = Math.max(12, Math.min(x, vw - cw - 12)), cy = y + ht + 10;
      if (cy + ch > vh - 12) cy = Math.max(12, y - ch - 10);
      if (cy < 12 || (cy + ch > y && cy < y + ht)) cy = Math.min(vh - ch - 12, Math.max(12, y + ht + 10));
      card.style.left = cx + 'px'; card.style.top = cy + 'px'; card.style.bottom = 'auto';
    }
    function show(){
      var el = visibleEl(w, steps[i].sel);
      if (el) { try { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch (e) {} }
      place(); setTimeout(place, 320);
    }
    card.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('[data-s]') : null; if (!b) return;
      var s = b.getAttribute('data-s');
      if (s === 'next') { i++; show(); } else if (s === 'back') { i--; show(); } else spotEnd();
    });
    var iv = setInterval(function(){ if (spotOn) place(); }, 350);
    var born = Date.now();
    function away(e){ if (card.contains(e.target) || Date.now() - born < 400) return; setTimeout(function(){ spotEnd(); }, 0); }
    var docs = [D]; try { if (w.document !== D) docs.push(w.document); } catch (e) {}
    docs.forEach(function(d){ d.addEventListener('pointerdown', away, true); });
    function onKey(e){ if (e.key === 'Escape') spotEnd(); }
    docs.forEach(function(d){ d.addEventListener('keydown', onKey, true); });
    spotOn = { ring: ring, card: card, iv: iv, docs: docs, away: away, onKey: onKey };
    show();
  }
  function spotEnd(quiet){
    if (!spotOn) return;
    var s = spotOn; spotOn = null; clearInterval(s.iv);
    s.docs.forEach(function(d){ d.removeEventListener('pointerdown', s.away, true); d.removeEventListener('keydown', s.onKey, true); });
    s.ring.remove(); s.card.remove();
    if (!quiet && built) { assistOpen(true); }
  }

  // ── open / close, and keeping clear of what the page already puts bottom-right ──
    function avoid(){
    if (!root) return;
    var kb = KBS[curId()], w = kb && appWin(kb.id), lift = 0;
    if (kb && kb.avoid && w) kb.avoid.forEach(function(sel){
      var el = visibleEl(w, sel); if (!el) return;
      var r = el.getBoundingClientRect(), o = offs(w), top = r.top + o.y;
      var right = r.right + o.x; if (right > topW.innerWidth - 90 && top < topW.innerHeight) lift = Math.max(lift, topW.innerHeight - top + 8);
    });
    root.style.setProperty('--as-lift', Math.round(lift) + 'px');
  }
  assistOpen = function(keep){
    build(); if (open) return; open = true;
    lastFocus = D.activeElement;
    root.classList.add('open'); bubble.setAttribute('aria-expanded', 'true'); bubble.setAttribute('aria-label', 'Close help');
    if (!keep && !MSGS.length) draw(false); else draw(false);
    avoid();
    setTimeout(function(){ try { input.focus({ preventScroll: true }); } catch (e) {} }, 60);
  };
  assistClose = function(){
    if (!open) return; open = false; if (!root) return;
    root.classList.remove('open'); bubble.setAttribute('aria-expanded', 'false'); bubble.setAttribute('aria-label', 'Help');
    try { if (lastFocus && lastFocus.focus && lastFocus !== D.body) lastFocus.focus({ preventScroll: true }); } catch (e) {}
  };
  assistToggle = function(){ open ? assistClose() : assistOpen(); };

  // ── when the bubble appears ───────────────────────────────────────────────
  function start(){
    if (IN_HUB || PARENT) return;                    // the Hub, or the page around us, already has one
    if (!ORDER.length) return;
    var go = function(){ build(); setInterval(function(){ if (root && (open || KBS[curId()] && KBS[curId()].avoid)) avoid(); }, 1500); };
    if (IN_SHELL && D.getElementById('hub-intro')) {
      var n = 0, iv = setInterval(function(){ if (!D.getElementById('hub-intro') || ++n > 20) { clearInterval(iv); go(); } }, 250);
    } else go();
  }
  window.ASSIST = { search: search, norm: norm, kbs: KBS, order: ORDER, find: find, visible: visibleKbs, answerHtml: answerHtml, cur: curId, open: function(){ return open; }, ask: ask, MSGS: function(){ return MSGS; }, showSteps: showSteps, appWin: appWin, screenOf: screenOf };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ setTimeout(start, 0); }); else setTimeout(start, 0);
})();
