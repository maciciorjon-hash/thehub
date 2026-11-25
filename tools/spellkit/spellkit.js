// SpellKit — spelling and typo correction for contenteditable text, the way the system does it.
//   Misspelled words are underlined (the CSS Custom Highlight API: no markup is added to what is saved), a right-click
//   on one offers corrections, Ignore and Add to dictionary, and a clear typo is corrected as the word is finished.
//
//   SpellKit.init(opts)        decode the dictionary, watch every editor (opts.selector), start underlining. Resolves
//                              to true when the engine runs, false when this browser or this device leaves spelling to the system.
//   SpellKit.host              {save(state), toast(text), menu(items, x, y)} — the app's own persistence and menu.
//   SpellKit.config(c)         {on, auto, words:[…], keep:[…]} — what the person chose; SpellKit.state() reads it back.
//   SpellKit.learn(words|text) words the notebook itself uses (a project, a cell line, a name): known, not saved.
//   SpellKit.check(word)       true if the word is spelt right.   SpellKit.suggest(word, n)   the likeliest words.
//   SpellKit.scan(text)        [{s, e, word, kind:'miss'|'dup'}] for a string (a newline is a paragraph).
//   SpellKit.fix(word, start)  the correction made automatically when the word is finished, or null.
//
// What it will not do, and why it is built that way:
//   · It never touches a word with a digit, a capital inside it (PBS, PROTACs, dTAG), an _ / @ #, a link, or a code or
//     chip in the text; a capitalised word in mid-sentence is a name; a word of two letters is a unit or an abbreviation.
//   · It corrects automatically only what is unmistakable — a typo from a list of them, two letters swapped (teh, wiht),
//     a doubled letter lost or gained (begining, buffeer) — never a word that merely sits one letter from another.
//   · A sentence in another language is left alone (more than four words in ten unknown), not underlined in red.
//   · Backspace straight after a correction puts back what was typed, and that word is never corrected again.
//   · A phone or a tablet keeps its own keyboard's spelling; this engine does not run there.
var SpellKit = (function () {
  'use strict';
  var L = new Set(), C = new Set(), NS = new Set(), RANK = Object.create(null), REP = [], RANKN = 0;
  var USER = Object.create(null), LEARN = Object.create(null), SESSION = Object.create(null), KEEP = Object.create(null);
  var CFG = { on: true, auto: true }, loaded = false, running = false, MODE = 'none', TYPOS = Object.create(null);
  var host = { save: function () {}, toast: function () {}, menu: null };
  var A = 'abcdefghijklmnopqrstuvwxyz';

  // ── The words ────────────────────────────────────────────────────────────────────────────────────────────────────
  function unfront(s) {
    var out = [], prev = '', lines = s.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i]; if (!ln) continue;
      var c = ln.charCodeAt(0), n = c < 58 ? c - 48 : c - 87;
      prev = prev.slice(0, n) + ln.slice(1); out.push(prev);
    }
    return out;
  }
  // The typos a hand wrote down: each one is certain, which is why they are corrected without a second thought.
  var TYPO_LIST = ('teh:the hte:the thier:their recieve:receive recieved:received recieving:receiving reciept:receipt seperate:separate ' +
    'seperated:separated seperately:separately seperation:separation definately:definitely definatly:definitely definitly:definitely ' +
    'definetly:definitely definate:definite occured:occurred occuring:occurring occurence:occurrence occurences:occurrences ' +
    'accomodate:accommodate acommodate:accommodate adress:address adn:and nad:and wich:which whcih:which wihch:which taht:that ' +
    'tath:that thsi:this htis:this wiht:with wtih:with freind:friend freinds:friends beleive:believe belive:believe wierd:weird ' +
    'untill:until unitl:until becuase:because becasue:because beacuse:because becuse:because bcause:because becaus:because ' +
    'remeber:remember rember:remember diffrent:different differnt:different diferent:different differnce:difference ' +
    'intresting:interesting interesing:interesting probaly:probably probbaly:probably prbably:probably enviroment:environment ' +
    'goverment:government independant:independent existance:existence resistence:resistance refered:referred refering:referring ' +
    'transfered:transferred transfering:transferring prefered:preferred prefering:preferring ocurred:occurred succesful:successful ' +
    'successfull:successful sucessful:successful succesfully:successfully sucessfully:successfully sucess:success succes:success ' +
    'neccessary:necessary necesary:necessary necessery:necessary neccesary:necessary nessesary:necessary tommorow:tomorrow ' +
    'tomorow:tomorrow tommorrow:tomorrow yesturday:yesterday wensday:wednesday wednseday:wednesday thurday:thursday calender:calendar ' +
    'grammer:grammar publically:publicly basicly:basically basicaly:basically actualy:actually usualy:usually finaly:finally ' +
    'realy:really exactely:exactly immediatly:immediately imediately:immediately imediate:immediate apparant:apparent ' +
    'apparantly:apparently arguement:argument truely:truly noticable:noticeable occassion:occasion ocassion:occasion ' +
    'occassionally:occasionally concious:conscious knowlege:knowledge recomend:recommend reccomend:recommend recomended:recommended ' +
    'relevent:relevant alot:a_lot jsut:just yuo:you yoru:your nto:not wil:will wnat:want tehn:then ' +
    'supernatent:supernatant supernantant:supernatant incubater:incubator pippete:pipette pippette:pipette pippeting:pipetting ' +
    'diluton:dilution diluion:dilution concentation:concentration concetration:concentration consentration:concentration ' +
    'preperation:preparation prepartion:preparation preparaton:preparation experiement:experiment experment:experiment ' +
    'expirement:experiment experimet:experiment temprature:temperature temperture:temperature tempreature:temperature ' +
    'volumn:volume volumne:volume analisis:analysis anlysis:analysis calcuate:calculate absorbtion:absorption ' +
    'antibodys:antibodies sensative:sensitive sensetive:sensitive proceedure:procedure proceedures:procedures ' +
    'seperatly:separately thourough:thorough thoroughly:thoroughly paramter:parameter paramters:parameters ' +
    'resuspention:resuspension centrifugaton:centrifugation centrifugtion:centrifugation transfecton:transfection ' +
    'tranfection:transfection tranfected:transfected tranfect:transfect plamid:plasmid plasmd:plasmid lysat:lysate ' +
    'electrophoresi:electrophoresis blocing:blocking wahsed:washed wahs:wash incubaiton:incubation inubation:incubation ' +
    'incubaton:incubation overnigth:overnight overnite:overnight ovenight:overnight reppeat:repeat repat:repeat ' +
    'colum:column dissapear:disappear dissapeared:disappeared disapear:disappear disapeared:disappeared ' +
    'accross:across agressive:aggressive tecnique:technique techique:technique tecnhique:technique ' +
    'accuratly:accurately accuratley:accurately comparision:comparison comparsion:comparison ' +
    'sevral:several severel:several diference:difference compleat:complete compleatly:completely completly:completely ' +
    "dont:don't doesnt:doesn't didnt:didn't isnt:isn't wasnt:wasn't arent:aren't werent:weren't couldnt:couldn't wouldnt:wouldn't " +
    "shouldnt:shouldn't havent:haven't hasnt:hasn't hadnt:hadn't theres:there's thats:that's whats:what's").split(' ');
  function typosInit() {
    TYPOS = Object.create(null);
    for (var i = 0; i < TYPO_LIST.length; i++) {
      var p = TYPO_LIST[i].split(':'), fx = p[1].replace(/_/g, ' ');
      if (p[0] !== p[1] && !L.has(p[0]) && (fx.indexOf(' ') > 0 || L.has(fx))) TYPOS[p[0]] = fx;
    }
  }
  function load(text) {
    var parts = text.split('\n§\n');
    L = new Set(unfront(parts[0] || '')); C = new Set(unfront(parts[1] || ''));
    NS = new Set((parts[2] || '').split('\n').filter(Boolean));
    RANK = Object.create(null); RANKN = 0;
    (parts[3] || '').split('\n').forEach(function (w, i) { if (w) { RANK[w] = i; RANKN = i + 1; } });
    REP = (parts[4] || '').split('\n').filter(Boolean).map(function (l) { return l.split(' '); });
    typosInit(); loaded = true;
    return L.size;
  }
  function norm(w) { return String(w).replace(/[‘’ʼ]/g, "'"); }
  function isK(lw) { return L.has(lw) || USER[lw] === 1 || LEARN[lw] === 1; }
  function isCap(w) { return w.length > 1 && w[0] !== w[0].toLowerCase() && w.slice(1) === w.slice(1).toLowerCase(); }
  function chemKnown(lw) { try { return typeof CHEM_FIX !== 'undefined' && CHEM_FIX && CHEM_FIX[lw] !== undefined; } catch (e) { return false; } }
  // Spelt right? `w` is the word as typed, letters and inner apostrophes only.
  function known(w) {
    w = norm(w);
    var lw = w.toLowerCase();
    if (isK(lw) || SESSION[lw] === 1 || chemKnown(lw)) return true;
    if (w !== lw && C.has(w)) return true;
    var m = /^(.+?)'(?:s|ll|re|ve|d|m)$/.exec(lw) || /^(.+s)'$/.exec(lw);
    if (m && (isK(m[1]) || (w !== lw && C.has(w.replace(/'.*$/, ''))))) return true;
    return false;
  }

  // ── Which words are not for a dictionary ─────────────────────────────────────────────────────────────────────────
  // The character before and after decide it: a path, a unit (ug/mL), a file name, a mention, a code, a plate well.
  function skipContext(text, i, len) {
    var p = i > 0 ? text.charAt(i - 1) : '', n = text.charAt(i + len);
    if (p && /[0-9_@#\/\\%$&=+*<>~^|]/.test(p)) return true;
    if (n && /[0-9_\/\\@=+*<>~^|]/.test(n)) return true;
    if (p === '.' && i > 1 && /[A-Za-z0-9]/.test(text.charAt(i - 2))) return true;
    if (n === '.' && /[A-Za-z0-9]/.test(text.charAt(i + len + 1))) return true;
    if (p === '-' && i > 1) { var b = /[A-Za-z0-9_]*$/.exec(text.slice(0, i - 1))[0]; if (/[0-9_A-Z]/.test(b)) return true; }
    if (n === '-') { var f = /^[A-Za-z0-9_]*/.exec(text.slice(i + len + 1))[0]; if (/[0-9_A-Z]/.test(f)) return true; }
    return false;
  }
  var CHEMY = /(ase|ose|ine|ide|ate|ite|one|ium|mab|nib|mycin|cillin|zole|vir|statin|cycline|oxin|ogen|ene|yne|yl|ol|in)$/;
  // Does a sentence open at text[i]? Looks only at the 14 characters before it; a sentinel keeps `^` for the real start.
  function sentenceStart(text, i) {
    var pre = text.slice(Math.max(0, i - 14), i); if (i > 14) pre = '\u0003' + pre;
    return /(^|[.!?\n\u0001]\s*["'(\[\u201c\u2018]*|[:;]\s+|^\s*(?:[-\u2022*]|\d+[.)])\s*)$/.test(pre);
  }
  // Shape of a name for something — an abbreviation with no vowel (crbn), a drug or protein (-ase, -mab, -ib) nowhere near a
  // real word. It is left alone: underlining every reagent in a protocol is how a checker gets switched off.
  function techShape(lw) {
    if (!/[aeiouy]/.test(lw) && lw.length <= 7) return true;
    if (lw.length >= 7 && CHEMY.test(lw)) { var n = near(lw); if (!n.T.length && !n.D.length && !n.I.length && !n.S.length) return true; }
    return false;
  }
  var DUP_OK = { had: 1, that: 1, bye: 1, no: 1, so: 1, very: 1, ha: 1, sure: 1, well: 1, yes: 1, many: 1, few: 1, new: 1, one: 1 };
  var TOKEN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

  // The misspelled words of a string. A newline ends a paragraph; \u0001 stands for something that is not text (a chip, a link).
  function scan(text) {
    var out = [];
    if (!loaded || !CFG.on) return out;
    var skipRx = /(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+/g, skip = [], sm;
    while ((sm = skipRx.exec(text))) skip.push([sm.index, sm.index + sm[0].length]);
    var off = 0, blocks = text.split('\n');
    blocks.forEach(function (blk) {
      var base = off; off += blk.length + 1;
      if (!blk) return;
      var res = [], checked = 0, bad = 0, prev = null, m;
      if ((blk.match(/[À-ɏ]/g) || []).length >= 3) return;                         // accented text: another language
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(blk))) {
        var tok = m[0], i = m.index, gi = base + i, letters = tok.replace(/['’]/g, '').length;
        var cur = { s: gi, e: gi + tok.length, word: tok, lw: norm(tok).toLowerCase(), skip: true };
        if (/[À-ɏͰ-῿]/.test(blk.charAt(i - 1) + blk.charAt(i + tok.length))) { prev = null; continue; }
        if (letters <= 2) { prev = null; continue; }
        if (/[A-Z]/.test(tok.slice(1))) { prev = null; continue; }                            // PBS, PROTACs, dTAG, McX
        var inLink = skip.some(function (r) { return gi >= r[0] && gi < r[1]; });
        if (inLink || skipContext(blk, i, tok.length)) { prev = null; continue; }
        var ntok = norm(tok), cap = isCap(ntok);
        if (cap && !sentenceStart(blk, i)) { prev = null; continue; }               // a name
        cur.skip = false; checked++;
        if (known(ntok)) {
          // "the the": the same word twice, only whitespace between.
          if (prev && !prev.skip && prev.lw === cur.lw && !DUP_OK[cur.lw] && /^[ \t ]+$/.test(blk.slice(prev.e - base, i)))
            res.push({ s: gi, e: gi + tok.length, from: prev.e, word: tok, kind: 'dup' });
          prev = cur; continue;
        }
        prev = cur;
        if (techShape(cur.lw)) { checked--; continue; }
        bad++; res.push({ s: gi, e: gi + tok.length, word: tok, kind: 'miss' });
      }
      if (checked >= 6 && bad / checked > 0.4) res = res.filter(function (r) { return r.kind === 'dup'; });   // another language
      out = out.concat(res);
    });
    return out;
  }

  // ── Near words, suggestions, automatic fixes ─────────────────────────────────────────────────────────────────────
  // Known words one edit from lw, sorted into what kind of slip made them: two letters swapped (T), a doubled letter lost or
  // gained (Dd, Id: begining → beginning), any other letter lost / gained / changed (D, I, S).
  function near(lw) {
    var n = lw.length, T = [], D = [], I = [], S = [], Dd = [], Id = [], seen = Object.create(null), i, j, x;
    function add(arr, x, dbl, arr2) {
      if (x === lw || seen[x] || !isK(x) || NS.has(x)) return;
      seen[x] = 1; arr.push(x); if (dbl) arr2.push(x);
    }
    for (i = 0; i < n - 1; i++) if (lw.charAt(i) !== lw.charAt(i + 1)) add(T, lw.slice(0, i) + lw.charAt(i + 1) + lw.charAt(i) + lw.slice(i + 2));
    for (i = 0; i < n; i++) add(D, lw.slice(0, i) + lw.slice(i + 1), lw.charAt(i) === lw.charAt(i - 1) || lw.charAt(i) === lw.charAt(i + 1), Dd);
    for (i = 0; i <= n; i++) for (j = 0; j < 26; j++) {
      x = A.charAt(j); add(I, lw.slice(0, i) + x + lw.slice(i), x === lw.charAt(i - 1) || x === lw.charAt(i), Id);
    }
    for (i = 0; i < n; i++) for (j = 0; j < 26; j++) { x = A.charAt(j); if (x !== lw.charAt(i)) add(S, lw.slice(0, i) + x + lw.slice(i + 1)); }
    return { T: T, D: D, I: I, S: S, Dd: Dd, Id: Id };
  }
  function uniq(a) { var s = Object.create(null); return a.filter(function (x) { return s[x] ? false : (s[x] = 1); }); }
  function rk(x) { return RANK[x] === undefined ? 1e9 : RANK[x]; }
  // The likeliest of several, only when one of them is clearly a common word and the rest are not.
  function bestByRank(list) {
    if (!list.length) return null;
    var s = list.slice().sort(function (a, b) { return rk(a) - rk(b); });
    if (rk(s[0]) === 1e9) return null;
    if (s.length === 1 || rk(s[1]) === 1e9 || rk(s[1]) / Math.max(1, rk(s[0])) >= 4) return s[0];
    return null;
  }
  function matchCase(fx, w) { return w.charAt(0) !== w.charAt(0).toLowerCase() ? fx.charAt(0).toUpperCase() + fx.slice(1) : fx; }
  // The correction for the word just finished, or null. `start` — the word opens a sentence (so a capital is not a name).
  function fix(w, start) {
    if (!loaded || !CFG.on || !CFG.auto) return null;
    var tok = norm(w), lw = tok.toLowerCase();
    if (tok.length < 3 || /[A-Z]/.test(tok.slice(1)) || KEEP[lw] === 1 || SESSION[lw] === 1 || known(tok)) return null;
    if (isCap(tok) && !start) return null;
    var fx = TYPOS[lw] || null;
    if (!fx && /^[a-z]+$/.test(lw) && lw.length >= 4) {
      var nr = near(lw);
      // Two letters swapped. On a word of four letters only when the word it makes is a common one (wiht → with, not args → rags).
      if (nr.T.length) { var c = nr.T.length === 1 ? nr.T[0] : bestByRank(nr.T); if (c && (lw.length >= 5 || rk(c) < 1500)) fx = c; }
      // A doubled letter lost or gained (begining, buffeer), into a word that turns up in ordinary text. A rare word one letter
      // away (dimers → dimmers) is more likely a real word the dictionary lacks than a slip.
      if (!fx && lw.length >= 5) {
        var d = uniq(nr.Dd.concat(nr.Id)).filter(function (x) { return rk(x) < 1e9; });
        if (d.length === 1) fx = d[0]; else if (d.length > 1) fx = bestByRank(d);
      }
    }
    return fx ? matchCase(fx, tok) : null;
  }
  // Is the writing before this word English? Another language is left alone: the last words before it, mostly unknown, say no.
  function langOk(pre) {
    var tail = pre.slice(-90);
    if (/[\u00c0-\u024f]/.test(tail)) return false;
    var ws = (tail.match(/[A-Za-z]+/g) || []).slice(-8).filter(function (w) { return w.length >= 3 && !/[A-Z]/.test(w.slice(1)); });
    if (ws.length < 4) return true;
    var unk = 0; ws.forEach(function (w) { if (!known(w)) unk++; });
    return unk / ws.length <= 0.35;
  }
  // Edit distance with a swap of neighbours counting as one.
  function osa(a, b, max) {
    var n = a.length, m = b.length; if (Math.abs(n - m) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= n; i++) { d[i] = [i]; }
    for (j = 1; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[n][m];
  }
  function edits1(w) {
    var out = [], n = w.length, i, j, x;
    for (i = 0; i < n; i++) out.push(w.slice(0, i) + w.slice(i + 1));
    for (i = 0; i < n - 1; i++) out.push(w.slice(0, i) + w.charAt(i + 1) + w.charAt(i) + w.slice(i + 2));
    for (i = 0; i < n; i++) for (j = 0; j < 26; j++) out.push(w.slice(0, i) + A.charAt(j) + w.slice(i + 1));
    for (i = 0; i <= n; i++) for (j = 0; j < 26; j++) out.push(w.slice(0, i) + A.charAt(j) + w.slice(i));
    return out;
  }
  function suggest(w, n) {
    n = n || 5;
    var tok = norm(w), lw = tok.toLowerCase(), cap = tok.charAt(0) !== tok.charAt(0).toLowerCase(), sc = Object.create(null);
    if (!loaded || !lw) return [];
    function put(x, s) {
      if (x === lw || NS.has(x)) return;
      if (x.charAt(0) === lw.charAt(0)) s -= 15;
      var pf = 0, sf = 0;                                  // a slip keeps its beginning and its ending
      while (pf < 4 && pf < x.length && x.charAt(pf) === lw.charAt(pf)) pf++;
      while (sf < 4 && sf < x.length && x.charAt(x.length - 1 - sf) === lw.charAt(lw.length - 1 - sf)) sf++;
      s -= 3 * pf + 3 * sf;
      var r = RANK[x]; if (r !== undefined) s -= Math.max(0, 30 - r / 200);
      if (USER[x] === 1) s -= 40; else if (LEARN[x] === 1) s -= 12;
      if (sc[x] === undefined || s < sc[x]) sc[x] = s;
    }
    var nr = near(lw);
    if (TYPOS[lw]) { var tf = TYPOS[lw]; sc[tf] = -999; }   // a typo that is in the list: its correction is first, always
    nr.T.forEach(function (x) { put(x, 80); });
    nr.I.forEach(function (x) { put(x, 96); });
    nr.D.forEach(function (x) { put(x, 98); });
    nr.S.forEach(function (x) { put(x, 100); });
    REP.forEach(function (r) {
      var a = r[0], b = r[1], at = lw.indexOf(a);
      while (at >= 0) { var x = lw.slice(0, at) + b + lw.slice(at + a.length); if (isK(x)) put(x, 105); at = lw.indexOf(a, at + 1); }
    });
    // Two words run together (alot, tobe) — offered only when nothing nearer was found, or every misspelling would get one.
    if (lw.length >= 4 && Object.keys(sc).length < 2) for (var i = 1; i < lw.length; i++) {
      var a1 = lw.slice(0, i), b1 = lw.slice(i);
      if (b1.length >= 2 && (a1.length >= 2 || a1 === 'a' || a1 === 'i') && isK(a1) && isK(b1) && !NS.has(a1) && !NS.has(b1)) put(a1 + ' ' + b1, 135);
    }
    var keys = Object.keys(sc);
    if (keys.length < 3 && lw.length >= 4 && lw.length <= 12) {
      var seen = Object.create(null);
      edits1(lw).forEach(function (e) {
        if (seen[e]) return; seen[e] = 1;
        edits1(e).forEach(function (f) { if (!seen[f] && f !== lw && isK(f)) { seen[f] = 1; put(f, 200); } });
      });
    }
    [USER, LEARN].forEach(function (set) {
      for (var u in set) if (set[u] === 1 && Math.abs(u.length - lw.length) <= 2 && osa(lw, u, 2) <= 2) put(u, 90 + 40 * (osa(lw, u, 2) - 1));
    });
    var res = Object.keys(sc).sort(function (a, b) { return sc[a] - sc[b] || (a < b ? -1 : 1); }).slice(0, n);
    return res.map(function (x) { return cap ? x.charAt(0).toUpperCase() + x.slice(1) : x; });
  }

  // ── The editors ──────────────────────────────────────────────────────────────────────────────────────────────────
  var SEL = '[contenteditable="true"]:not([data-nospell])';
  var BLOCK = /^(DIV|P|LI|UL|OL|H[1-6]|BLOCKQUOTE|PRE|TABLE|TR|TD|TH|SECTION|FIGURE|FIGCAPTION)$/;
  var SKIPEL = /^(A|CODE|PRE|KBD|SAMP|SCRIPT|STYLE|SVG|BUTTON|INPUT|TEXTAREA|SELECT|IMG|CANVAS|SUP|SUB)$/;
  var ED = new Map(), HL = null, dirty = new Set(), timer = 0, all = false, lastInput = 0, lastEd = null, busy = false, LAST = null, RECENT = [];
  var hasHL = typeof window !== 'undefined' && window.CSS && CSS.highlights && typeof Highlight === 'function';
  // The text of an editor as one string, with where each piece came from, so a word can be turned back into a Range.
  function collect(ed) {
    var str = '', map = [];
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { map.push({ node: c, start: str.length }); str += c.data.replace(/ /g, ' '); }
        else if (c.nodeType === 1) {
          var tag = c.tagName;
          if (tag === 'BR') { str += '\n'; continue; }
          if (SKIPEL.test(tag) || c.getAttribute('contenteditable') === 'false' || c.hasAttribute('data-nospell')) { str += '\u0001'; continue; }
          var blk = BLOCK.test(tag);
          if (blk && str && str.charAt(str.length - 1) !== '\n') str += '\n';
          walk(c);
          if (blk && str && str.charAt(str.length - 1) !== '\n') str += '\n';
        }
      }
    })(ed);
    return { str: str, map: map };
  }
  function pos(col, at) {
    var m = col.map, lo = 0, hi = m.length - 1, k = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (m[mid].start <= at) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    if (k < 0) return null;
    var e = m[k], len = e.node.data.length;
    if (at - e.start > len) return null;
    return { node: e.node, off: at - e.start };
  }
  function rangeFor(col, s, e) {
    var a = pos(col, s), b = pos(col, e - 1); if (!a || !b) return null;
    var r = document.createRange();
    try { r.setStart(a.node, a.off); r.setEnd(b.node, Math.min(b.node.data.length, b.off + 1)); } catch (x) { return null; }
    return r;
  }
  function caretIndex(ed, col) {
    var sel = window.getSelection && window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed || !ed.contains(sel.anchorNode)) return -1;
    for (var i = 0; i < col.map.length; i++) if (col.map[i].node === sel.anchorNode) return col.map[i].start + sel.anchorOffset;
    return -1;
  }
  function ensureHL() { if (!HL && hasHL) { HL = new Highlight(); CSS.highlights.set('lb-spell', HL); } return HL; }
  function clearEd(st) { if (HL) st.ranges.forEach(function (r) { HL.delete(r); }); st.ranges = []; st.items = []; }
  function scanEditor(ed, force) {
    var st = ED.get(ed);
    if (!st) { st = { ranges: [], items: [], sig: null, ck: null }; ED.set(ed, st); }
    if (ed.spellcheck !== false) ed.spellcheck = false;
    if (!running || !CFG.on) { if (st.items.length) clearEd(st); st.sig = null; return; }
    var col = collect(ed), typing = lastEd === ed && Date.now() - lastInput < 1100;
    var ci = typing ? caretIndex(ed, col) : -1, stale = st.ranges.length && !st.ranges[0].startContainer.isConnected;
    var key = col.str + '\u0002' + ci;
    if (!force && !stale && key === st.ck) return;
    st.ck = key;
    clearEd(st);
    var hl = ensureHL(); if (!hl) return;
    scan(col.str).forEach(function (it) {
      if (ci >= it.s && ci <= it.e) return;                    // still being typed
      var r = rangeFor(col, it.s, it.e); if (!r) return;
      it.range = r;
      if (it.kind === 'dup') it.del = rangeFor(col, it.from, it.e);
      st.items.push(it); st.ranges.push(r); hl.add(r);
    });
  }
  function discover(root) {
    var list = (root || document).querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) if (!ED.has(list[i])) ED.set(list[i], { ranges: [], items: [], sig: null, ck: null });
  }
  function sweep() {
    ED.forEach(function (st, ed) { if (!ed.isConnected) { clearEd(st); ED.delete(ed); } });
  }
  function run() {
    timer = 0;
    var list = [];
    if (all) { all = false; discover(); dirty.clear(); ED.forEach(function (_st, ed) { if (ed.isConnected) list.push(ed); }); }
    else { dirty.forEach(function (e) { if (e.isConnected) list.push(e); }); dirty.clear(); }
    for (var i = 0; i < list.length; i++) { try { scanEditor(list[i]); } catch (e) { if (window.console) console.error('SpellKit', e); } }
    sweep();
  }
  function schedule(ms, ed) {
    if (ed) dirty.add(ed); else all = true;
    clearTimeout(timer); timer = setTimeout(run, ms);
  }
  function rescanAll() { ED.forEach(function (st) { st.ck = null; }); schedule(0, null); }
  function editorOf(n) { var e = n && (n.nodeType === 1 ? n : n.parentElement); return e && e.closest ? e.closest(SEL) : null; }

  // The correction of the word before the caret, as the separator that closes it arrives. The replacement goes through
  // execCommand so ⌘Z takes it back; it is deferred out of the input event because Chrome refuses a nested execCommand, and it
  // re-reads the live selection because typing a trailing space makes Chrome rebuild the text node.
  function wordBefore(node, off) {
    var pe = node.parentElement;
    if (pe && pe.closest && pe.closest('a,code,pre,kbd,samp,sup,sub,[data-nospell],[contenteditable="false"]')) return null;   // a link, a code, a chip: not prose
    var stem = node.data.slice(0, off).replace(/ /g, ' '), m = /([A-Za-z]+(?:['’][A-Za-z]+)*)$/.exec(stem);
    if (!m) return null;
    var at = stem.length - m[0].length, pre = stem.slice(0, at);
    if (at > 0 && /[À-ɏ]/.test(stem.charAt(at - 1))) return null;
    if (at === 0) { var ps = node.previousSibling; if (ps && (ps.nodeType === 3 || (ps.nodeType === 1 && !BLOCK.test(ps.tagName) && ps.tagName !== 'BR'))) return null; }
    return { tok: m[0], at: at, pre: pre, start: at === 0 || sentenceStart(stem, at) };
  }
  function applyAt(ed, expect, text, remember) {
    setTimeout(function () {
      try {
        var sel = window.getSelection(); if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
        var node = sel.anchorNode, off = sel.anchorOffset;
        if (!node || node.nodeType !== 3) return;
        var from = off - expect.length; if (from < 0) return;
        if (node.data.slice(from, off).replace(/ /g, ' ') !== expect.replace(/ /g, ' ')) return;
        var r = document.createRange(); r.setStart(node, from); r.setEnd(node, off);
        sel.removeAllRanges(); sel.addRange(r);
        busy = true; var ok = document.execCommand('insertText', false, text); busy = false;
        if (ok && remember) { LAST = { ed: ed, orig: remember.orig, fixed: remember.fixed, sep: remember.sep, at: Date.now() }; RECENT.unshift({ fixed: remember.fixed.toLowerCase(), orig: remember.orig }); RECENT.length = Math.min(RECENT.length, 40); }
        schedule(60, ed);
      } catch (e) { busy = false; }
    }, 0);
  }
  function onInput(e) {
    var ed = editorOf(e.target); if (!ed) return;
    if (busy) return;
    lastEd = ed; lastInput = Date.now();
    schedule(260, ed); clearTimeout(onInput._t); onInput._t = setTimeout(function () { schedule(0, ed); }, 1200);
    if (!CFG.on || !CFG.auto || e.isComposing || e.inputType !== 'insertText') return;
    var ch = e.data; if (!ch || ch.length !== 1 || !/[\s .,;:!?)\]}"”]/.test(ch)) return;
    var sel = window.getSelection(); if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    var node = sel.anchorNode; if (!node || node.nodeType !== 3) return;
    var off = sel.anchorOffset, w = wordBefore(node, off - 1); if (!w) return;
    var text = w.pre + w.tok + ch;
    if (skipContext(text, w.at, w.tok.length)) return;
    if (!langOk(w.pre)) return;
    var fx = fix(w.tok, w.start); if (!fx) return;
    applyAt(ed, w.tok + ch, fx + ch, { orig: w.tok, fixed: fx, sep: ch });
  }
  // Enter finishes a word too — and does it before the paragraph is split, so it is done now, not deferred.
  function onKeyDown(e) {
    if (!running || !CFG.on) return;
    var ed = editorOf(e.target); if (!ed) return;
    var sel = window.getSelection(); if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    var node = sel.anchorNode; if (!node || node.nodeType !== 3) return;
    if (e.key === 'Backspace' && LAST && LAST.ed === ed && Date.now() - LAST.at < 20000 && !e.isComposing) {
      var tail = LAST.fixed + LAST.sep, off = sel.anchorOffset, have = node.data.slice(Math.max(0, off - tail.length), off).replace(/ /g, ' ');
      if (off >= tail.length && have === tail.replace(/ /g, ' ')) {
        e.preventDefault();
        var r = document.createRange(); r.setStart(node, off - tail.length); r.setEnd(node, off);
        sel.removeAllRanges(); sel.addRange(r);
        busy = true; document.execCommand('insertText', false, LAST.orig + LAST.sep); busy = false;
        KEEP[LAST.orig.toLowerCase()] = 1; persist(); LAST = null; schedule(60, ed);
        return;
      }
    }
    if (e.key === 'Enter' && !e.isComposing && CFG.on && CFG.auto && !e.shiftKey) {
      var w = wordBefore(node, sel.anchorOffset); if (!w || skipContext(w.pre + w.tok + ' ', w.at, w.tok.length)) return;
      if (!langOk(w.pre)) return;
      var fx = fix(w.tok, w.start); if (!fx) return;
      var r2 = document.createRange(); r2.setStart(node, w.at); r2.setEnd(node, w.at + w.tok.length);
      sel.removeAllRanges(); sel.addRange(r2);
      busy = true; var ok = document.execCommand('insertText', false, fx); busy = false;
      if (ok) { RECENT.unshift({ fixed: fx.toLowerCase(), orig: w.tok }); RECENT.length = Math.min(RECENT.length, 40); schedule(60, ed); }
    }
  }

  // ── The menu ─────────────────────────────────────────────────────────────────────────────────────────────────────
  function hit(ed, x, y) {
    var st = ED.get(ed); if (!st) return null;
    for (var i = 0; i < st.items.length; i++) {
      var it = st.items[i]; if (!it.range || !it.range.startContainer.isConnected) continue;
      var rs = it.range.getClientRects();
      for (var j = 0; j < rs.length; j++) { var r = rs[j]; if (x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1) return it; }
    }
    return null;
  }
  function select(range) { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range.cloneRange()); }
  function replaceWith(ed, range, text) {
    try { ed.focus({ preventScroll: true }); } catch (e) { ed.focus(); }
    select(range); document.execCommand('insertText', false, text); schedule(60, ed);
  }
  function wordAt(x, y) {
    var r = null, node, off;
    if (document.caretPositionFromPoint) { var p = document.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
    else if (document.caretRangeFromPoint) { r = document.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
    if (!node || node.nodeType !== 3) return null;
    var d = node.data, s = off, e = off;
    while (s > 0 && /[A-Za-z'’]/.test(d.charAt(s - 1))) s--;
    while (e < d.length && /[A-Za-z'’]/.test(d.charAt(e))) e++;
    if (e <= s) return null;
    var rg = document.createRange(); rg.setStart(node, s); rg.setEnd(node, e);
    return { range: rg, word: d.slice(s, e) };
  }
  function clip(op) {
    if (op === 'paste') {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t) document.execCommand('insertText', false, t); }, function () { host.toast('Press ' + (/Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘V' : 'Ctrl+V') + ' to paste'); });
      else host.toast('Press ' + (/Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘V' : 'Ctrl+V') + ' to paste');
    } else document.execCommand(op);
  }
  var MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? '⌘' : 'Ctrl+';
  function clipItems() {
    return [{ sep: true }, { label: 'Cut', sub: MOD + 'X', fn: function () { clip('cut'); } }, { label: 'Copy', sub: MOD + 'C', fn: function () { clip('copy'); } }, { label: 'Paste', sub: MOD + 'V', fn: function () { clip('paste'); } }];
  }
  function onContext(e) {
    if (!running || !CFG.on || !host.menu) return;
    var ed = editorOf(e.target); if (!ed) return;
    var it = hit(ed, e.clientX, e.clientY), items;
    if (it) {
      if (it.kind === 'dup') {
        items = [{ label: 'Delete repeated “' + it.word + '”', fn: function () { replaceWith(ed, it.del, ''); } }, { label: 'Ignore', fn: function () { SESSION[it.word.toLowerCase()] = 1; rescanAll(); } }];
      } else {
        var sg = suggest(it.word, 5), lw = norm(it.word).toLowerCase();
        items = sg.map(function (s) { return { label: s, fn: function () { replaceWith(ed, it.range, s); } }; });
        if (!items.length) items = [{ label: 'No suggestions', dis: true }];
        items.push({ sep: true });
        items.push({ label: 'Ignore', fn: function () { SESSION[lw] = 1; rescanAll(); } });
        items.push({ label: 'Add to dictionary', fn: function () { USER[lw] = 1; persist(); rescanAll(); host.toast('“' + it.word + '” added to your dictionary'); } });
      }
      select(it.range);
      items = items.concat(clipItems());
    } else if (RECENT.length) {
      var wa = wordAt(e.clientX, e.clientY); if (!wa) return;
      var low = wa.word.toLowerCase(), rec = null;
      for (var i = 0; i < RECENT.length; i++) if (RECENT[i].fixed === low) { rec = RECENT[i]; break; }
      if (!rec) return;
      items = [{ label: 'Change back to “' + rec.orig + '”', fn: function () { replaceWith(ed, wa.range, rec.orig); } },
        { label: 'Never correct “' + rec.orig + '”', fn: function () { KEEP[rec.orig.toLowerCase()] = 1; persist(); replaceWith(ed, wa.range, rec.orig); } }];
      select(wa.range); items = items.concat(clipItems());
    } else return;
    e.preventDefault(); e.stopImmediatePropagation();
    host.menu(items, e.clientX, e.clientY);
  }

  // ── What the person chose ────────────────────────────────────────────────────────────────────────────────────────
  function words(set) { return Object.keys(set).filter(function (k) { return set[k] === 1; }).sort(); }
  function state() { return { on: CFG.on, auto: CFG.auto, words: words(USER), keep: words(KEEP) }; }
  function persist() { try { host.save(state()); } catch (e) {} }
  function config(c) {
    if (!c) return;
    if (c.on !== undefined) CFG.on = !!c.on;
    if (c.auto !== undefined) CFG.auto = !!c.auto;
    if (c.words) { USER = Object.create(null); c.words.forEach(function (w) { USER[String(w).toLowerCase()] = 1; }); }
    if (c.keep) { KEEP = Object.create(null); c.keep.forEach(function (w) { KEEP[String(w).toLowerCase()] = 1; }); }
    if (running) rescanAll();
  }
  function addWord(w) { w = String(w).trim().toLowerCase(); if (!w) return; USER[w] = 1; persist(); rescanAll(); }
  function removeWord(w) { delete USER[String(w).toLowerCase()]; persist(); rescanAll(); }
  function removeKeep(w) { delete KEEP[String(w).toLowerCase()]; persist(); }
  function learn(x) {
    var list = Array.isArray(x) ? x : (String(x).match(/[A-Za-z]+(?:'[A-Za-z]+)*/g) || []);
    list.forEach(function (w) { w = norm(w).toLowerCase(); if (w.length >= 3 && /^[a-z']+$/.test(w)) LEARN[w] = 1; });
  }
  // Words the notebook uses over and over — a reagent, a gene, a nickname — are the writer's, not typos. Counted over the
  // text, learned from the third use on, unless an automatic fix would have changed them (a repeated typo is still a typo).
  function learnFrom(text) {
    var cnt = Object.create(null), m, rx = /[a-z]{4,}/g;
    while ((m = rx.exec(text))) {
      var w = m[0], p = text.charAt(m.index - 1), n = text.charAt(m.index + w.length);
      if ((p && /[A-Za-z0-9_\-#@\/.]/.test(p)) || (n && /[A-Za-z0-9_\-\/@]/.test(n))) continue;      // a code, a path, a part of a longer token
      if (!isK(w) && !SESSION[w]) cnt[w] = (cnt[w] || 0) + 1;
    }
    var n = 0, was = CFG.auto; CFG.auto = true;
    Object.keys(cnt).forEach(function (w) { if (cnt[w] >= 3 && !TYPOS[w] && fix(w, false) === null) { LEARN[w] = 1; n++; } });
    CFG.auto = was; return n;
  }

  // ── Starting ─────────────────────────────────────────────────────────────────────────────────────────────────────
  function inflate(b64) {
    var bin = atob(b64.replace(/\s+/g, '')), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  // On a phone or a tablet the keyboard has its own spelling, better than this one; it is switched on and left alone.
  function nativeMode() {
    function on() { var l = document.querySelectorAll(SEL); for (var i = 0; i < l.length; i++) if (!l[i].spellcheck) l[i].spellcheck = true; }
    on(); new MutationObserver(function () { clearTimeout(nativeMode._t); nativeMode._t = setTimeout(on, 200); }).observe(document.body, { childList: true, subtree: true });
  }
  function init(opts) {
    opts = opts || {};
    if (opts.selector) SEL = opts.selector;
    if (opts.host) host = Object.assign(host, opts.host);
    if (typeof document === 'undefined') return Promise.resolve(false);
    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    if (coarse || !hasHL || typeof DecompressionStream !== 'function') { MODE = 'native'; nativeMode(); return Promise.resolve(false); }
    var tag = document.getElementById(opts.data || 'sk-dict'); if (!tag) return Promise.resolve(false);
    return inflate(tag.textContent).then(function (t) {
      load(t); tag.textContent = '';
      running = true; MODE = 'engine';
      document.addEventListener('input', onInput, true);
      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('contextmenu', onContext, true);
      document.addEventListener('selectionchange', function () { if (lastEd && Date.now() - lastInput < 1500) schedule(120, lastEd); });
      document.addEventListener('focusout', function (e) { var ed = editorOf(e.target); if (ed) schedule(40, ed); }, true);
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var m = ms[i], n = m.target.nodeType === 3 ? m.target.parentNode : m.target, ed = n && n.closest ? n.closest(SEL) : null;
          if (ed) { dirty.add(ed); if (!ED.has(ed)) ED.set(ed, { ranges: [], items: [], sig: null, ck: null }); continue; }
          if (m.addedNodes.length) for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; if (a.nodeType === 1 && ((a.matches && a.matches(SEL)) || a.querySelector(SEL))) { all = true; break; } }
        }
        if (dirty.size || all) { clearTimeout(timer); timer = setTimeout(run, 250); }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
      all = true; run();
      return true;
    }, function () { MODE = 'native'; nativeMode(); return false; });
  }
  return {
    init: init, load: load, known: known, check: known, scan: scan, fix: fix, suggest: suggest, learn: learn, learnFrom: learnFrom,
    config: config, state: state, addWord: addWord, removeWord: removeWord, removeKeep: removeKeep, rescan: rescanAll,
    get host() { return host; }, set host(h) { host = Object.assign(host, h); },
    enabled: function () { return running && CFG.on; }, running: function () { return running; }, mode: function () { return MODE; },
    _typos: function () { return TYPOS; }, _near: near, _size: function () { return { L: L.size, C: C.size, F: RANKN }; }
  };
})();
