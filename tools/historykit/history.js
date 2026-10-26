/* HistoryKit — every analysis, kept under its name, in this browser's IndexedDB.
   An analysis with data is saved by itself a moment after anything changes; opening one puts it back as it was.
   The app says three things: what to keep (current), how to put it back (open) and where the list is drawn (root).
   HistoryKit.create({ key, noun, root, current, open, go, toast, onChange }) → { touch, save, render, load, list, id, adopt }
     key      the database is <key>_history, one store, one record per analysis
     root     the element (or its id) the list is drawn into
     current  () → null while there is nothing worth keeping, else { name, key?, bits: [], chips: [], files: [], data }
              data must survive structured clone; key is the identity of the readings, so loading the same data again in a
              new session finds its entry instead of making a second one
     open     (data, rec) → puts the analysis back; returns false when it could not
     go       () → shows the History tab
     toast    (message, kind) */
var HistoryKit = (function(){
  var MAX = 40, GAP = 700;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, w){ return n + ' ' + (n === 1 ? w : (w === 'analysis' ? 'analyses' : w + 's')); }
  function when(t){
    var d = new Date(t), now = new Date(), hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === now.toDateString() ? 'Today ' + hm : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + hm;
  }
  var IC = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 13v7"/></svg>',
    ren: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>'
  };
  // A small dialog of the kit's own, so a rename or a delete asks the same way in every app.
  function ask(title, body, o, cb){
    var back = document.createElement('div'); back.className = 'hk-back';
    back.innerHTML = '<div class="hk-dlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><h3>' + esc(title) + '</h3>' + (body ? '<p>' + esc(body) + '</p>' : '') + (o.input ? '<input type="text" maxlength="80" spellcheck="false" autocomplete="off" value="' + esc(o.value || '') + '">' : '') + '<div class="hk-btns"><button type="button" class="btn" data-x="0">Cancel</button><button type="button" class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-x="1">' + esc(o.ok || 'OK') + '</button></div></div>';
    var prev = document.activeElement;
    function done(ok){ var v = o.input ? back.querySelector('input').value : null; back.remove(); document.removeEventListener('keydown', key, true); if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) {} } cb(ok, v); }
    function key(e){ if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); } else if (e.key === 'Enter' && o.input) { e.preventDefault(); e.stopPropagation(); done(true); } }
    back.addEventListener('click', function(e){ if (e.target === back) done(false); else { var b = e.target.closest('[data-x]'); if (b) done(b.dataset.x === '1'); } });
    document.addEventListener('keydown', key, true);
    document.body.appendChild(back);
    var f = back.querySelector('input') || back.querySelector('[data-x="1"]'); if (f) { f.focus(); if (f.select) f.select(); }
  }
  function create(o){
    var H = { dbp: null, broken: null, list: [], q: '', timer: 0, loaded: false, id: null, quiet: 0, sig: '', warned: false };
    var noun = o.noun || 'analysis';
    function rootEl(){ return typeof o.root === 'string' ? document.getElementById(o.root) : o.root; }
    function toast(m, k){ if (o.toast) o.toast(m, k); }
    function db(){
      if (H.dbp) return H.dbp;
      H.dbp = new Promise(function(res, rej){
        var rq; try { rq = indexedDB.open(o.key + '_history', 1); } catch (e) { rej(e); return; }
        rq.onupgradeneeded = function(){ if (!rq.result.objectStoreNames.contains('runs')) rq.result.createObjectStore('runs', { keyPath: 'id' }); };
        rq.onsuccess = function(){ res(rq.result); };
        rq.onerror = function(){ rej(rq.error || new Error('Could not open the History database')); };
        rq.onblocked = function(){ rej(new Error('The History database is blocked by another tab')); };
      });
      H.dbp.catch(function(e){ H.broken = e; H.dbp = null; });
      return H.dbp;
    }
    function req(mode, fn){
      return db().then(function(d){ return new Promise(function(res, rej){
        var tx = d.transaction('runs', mode), r = fn(tx.objectStore('runs'));
        tx.oncomplete = function(){ res(r && 'result' in r ? r.result : undefined); };
        tx.onerror = tx.onabort = function(){ rej(tx.error || new Error('History write failed')); };
      }); });
    }
    function sort(){ H.list.sort(function(a, b){ return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updated - a.updated; }); }
    function changed(){ if (o.onChange) o.onChange(H.list); if (H.shown()) H.render(); }
    H.shown = function(){ return o.shown ? o.shown() : true; };
    H.load = function(){
      return req('readonly', function(st){ return st.getAll(); }).then(function(all){ H.list = all || []; sort(); H.loaded = true; changed(); })
        .catch(function(e){ H.broken = e; H.loaded = true; changed(); });
    };
    function find(id){ return H.list.filter(function(r){ return r.id === id; })[0]; }
    // Called after anything that changes the analysis. Saving waits for a quiet moment and skips what is already kept.
    H.touch = function(){
      if (H.broken || Date.now() < H.quiet) return;
      clearTimeout(H.timer); H.timer = setTimeout(H.save, GAP);
    };
    H.save = function(){
      clearTimeout(H.timer);
      if (H.broken || !H.loaded) return Promise.resolve();
      var cur; try { cur = o.current(); } catch (e) { return Promise.resolve(); }
      if (!cur) { if (H.id) { H.id = null; H.sig = ''; if (H.shown()) H.render(); } return Promise.resolve(); }   // the screen was emptied: nothing is "open now"
      var sig; try { sig = JSON.stringify([cur.name, cur.data]); } catch (e) { return Promise.resolve(); }
      var rec = (H.id && find(H.id)) || (cur.key && H.list.filter(function(r){ return r.dkey === cur.key; })[0]) || null;
      if (rec && H.id !== rec.id) { H.id = rec.id; H.sig = ''; }
      if (rec && sig === H.sig) return Promise.resolve();
      var now = Date.now();
      var out = { id: rec ? rec.id : 'h' + now.toString(36) + Math.random().toString(36).slice(2, 6), dkey: cur.key || '', name: rec && rec.named ? rec.name : (cur.name || 'Untitled ' + noun), named: !!(rec && rec.named),
        bits: cur.bits || [], chips: cur.chips || [], files: cur.files || [], data: cur.data, created: rec ? rec.created : now, updated: now, pinned: rec ? !!rec.pinned : false };
      return req('readwrite', function(st){ return st.put(out); }).then(function(){
        H.id = out.id; H.sig = sig;
        var i = H.list.findIndex(function(r){ return r.id === out.id; }); if (i >= 0) H.list[i] = out; else H.list.push(out);
        sort();
        var over = H.list.length - MAX, drop = over > 0 ? H.list.filter(function(r){ return !r.pinned && r.id !== out.id; }).slice(-over) : [];
        if (drop.length) {
          H.list = H.list.filter(function(r){ return drop.indexOf(r) < 0; });
          return req('readwrite', function(st){ drop.forEach(function(r){ st.delete(r.id); }); });
        }
      }).then(changed).catch(function(e){
        H.broken = e;
        if (!H.warned) { H.warned = true; toast('History cannot be kept in this browser (' + ((e && e.message) || 'storage unavailable') + '). Save the project to keep your numbers.', 'err'); }
      });
    };
    H.open = function(id){
      var rec = find(id); if (!rec) return;
      clearTimeout(H.timer);
      H.quiet = Date.now() + 1200;
      var r; try { r = o.open(typeof structuredClone === 'function' ? structuredClone(rec.data) : rec.data, rec); } catch (e) { console.warn('History open:', e); r = false; }
      // open may answer straight away or with a promise (Tempo reads its plates in again before it can say).
      Promise.resolve(r).then(function(ok){
        if (ok === false) { toast('“' + rec.name + '” could not be opened.', 'err'); return; }
        var cur = null; try { cur = o.current(); } catch (e) {}
        H.id = rec.id; try { H.sig = JSON.stringify([rec.named ? rec.name : (cur && cur.name), cur && cur.data]); } catch (e) { H.sig = ''; }
        H.quiet = Date.now() + 1200;
        if (o.afterOpen) o.afterOpen(rec);
        toast('“' + rec.name + '” is open.');
      }, function(e){ console.warn('History open:', e); toast('“' + rec.name + '” could not be opened.', 'err'); });
    };
    H.remove = function(id){
      var rec = find(id); if (!rec) return;
      ask('Delete “' + rec.name + '” from History?', 'Its readings and layout are deleted from this browser.' + (id === H.id ? ' It is the ' + noun + ' open now: it stays open, and the next change keeps it again as a new entry.' : ''), { ok: 'Delete', danger: true }, function(ok){
        if (!ok) return;
        req('readwrite', function(st){ return st.delete(id); }).then(function(){ H.list = H.list.filter(function(r){ return r.id !== id; }); if (id === H.id) { H.id = null; H.sig = ''; } changed(); });
      });
    };
    H.pin = function(id){
      var rec = find(id); if (!rec) return; rec.pinned = !rec.pinned;
      req('readwrite', function(st){ return st.put(rec); }).then(function(){ sort(); changed(); });
    };
    H.rename = function(id){
      var rec = find(id); if (!rec) return;
      ask('Rename this ' + noun, 'History keeps it under this name.', { input: true, value: rec.name, ok: 'Rename' }, function(ok, v){
        v = String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (!ok || !v || v === rec.name) return;
        rec.name = v; rec.named = true;
        req('readwrite', function(st){ return st.put(rec); }).then(changed);
      });
    };
    H.render = function(){
      var root = rootEl(); if (!root) return;
      function empty(t, p){ return '<div class="hk-empty">' + IC.clock + '<h3>' + esc(t) + '</h3><p>' + esc(p) + '</p></div>'; }
      if (H.broken && !H.list.length) { root.innerHTML = empty('History cannot be kept here', 'This browser would not give ' + (o.app || 'the app') + ' a place to store analyses (' + (H.broken.message || 'storage unavailable') + '). Everything else works; save the project to keep your numbers.'); return; }
      if (!H.loaded) { root.innerHTML = ''; return; }
      if (!H.list.length) { root.innerHTML = empty('Nothing saved yet', 'Every ' + noun + ' you read is kept here by itself, under its name — open it again later exactly as you left it.'); return; }
      var q = H.q.trim().toLowerCase(), shown = H.list.filter(function(r){ return !q || (r.name + ' ' + r.chips.join(' ') + ' ' + r.files.join(' ') + ' ' + r.bits.join(' ')).toLowerCase().indexOf(q) >= 0; });
      var h = '<div class="hk-bar"><div class="hk-title">History<span class="sub">' + plural(H.list.length, 'analysis') + ' · kept on this device</span></div><input class="hk-q" type="search" id="hk-q" placeholder="Find an ' + esc(noun) + ', compound or file" aria-label="Find in History" value="' + esc(H.q) + '"></div><div class="hk-list">';
      shown.forEach(function(r){
        var now = r.id === H.id;
        h += '<div class="hk-row' + (now ? ' now' : '') + '"><div class="hk-main"><div class="hk-name"><span class="n" title="' + esc(r.name) + '">' + esc(r.name) + '</span>' + (now ? '<span class="hk-pill">Open now</span>' : '') + (r.pinned ? '<span class="hk-pill pin">Pinned</span>' : '') + '</div>' +
          (r.bits.length ? '<div class="hk-meta">' + esc(r.bits.join(' · ')) + '</div>' : '') +
          (r.chips.length ? '<div class="hk-chips">' + r.chips.slice(0, 8).map(function(c){ return '<span class="hk-chip">' + esc(c) + '</span>'; }).join('') + (r.chips.length > 8 ? '<span class="hk-chip">+ ' + (r.chips.length - 8) + ' more</span>' : '') + '</div>' : '') +
          (r.files.length ? '<div class="hk-files" title="' + esc(r.files.join(', ')) + '">' + esc(r.files.join(' · ')) + '</div>' : '') + '</div>' +
          '<div class="hk-side"><div class="hk-when">' + when(r.updated) + '</div><div class="hk-acts">' +
          '<button type="button" class="hk-ic' + (r.pinned ? ' on' : '') + '" data-a="pin" data-id="' + esc(r.id) + '" title="' + (r.pinned ? 'Unpin' : 'Pin to the top') + '" aria-label="Pin">' + IC.pin + '</button>' +
          '<button type="button" class="hk-ic" data-a="ren" data-id="' + esc(r.id) + '" title="Rename" aria-label="Rename">' + IC.ren + '</button>' +
          '<button type="button" class="hk-ic" data-a="del" data-id="' + esc(r.id) + '" title="Delete from History" aria-label="Delete">' + IC.del + '</button>' +
          '<button type="button" class="btn' + (now ? '' : ' primary') + '" data-a="open" data-id="' + esc(r.id) + '">' + (now ? 'Show' : 'Open') + '</button></div></div></div>';
      });
      if (!shown.length) h += '<div class="hk-empty" style="margin:30px auto"><p>Nothing in History matches “' + esc(H.q) + '”.</p></div>';
      root.innerHTML = h + '</div><div class="hk-foot">An ' + esc(noun) + ' is saved a moment after any change. Renaming it here renames the entry.</div>';
    };
    (function wire(){
      var root = rootEl(); if (!root) return;
      root.addEventListener('click', function(e){
        var b = e.target.closest('[data-a]'); if (!b) return;
        var id = b.dataset.id, a = b.dataset.a;
        if (a === 'open') { if (id === H.id) { if (o.afterOpen) o.afterOpen(find(id)); } else H.open(id); }
        else if (a === 'del') H.remove(id); else if (a === 'pin') H.pin(id); else if (a === 'ren') H.rename(id);
      });
      root.addEventListener('input', function(e){
        if (e.target.id !== 'hk-q') return;
        H.q = e.target.value; var pos = e.target.selectionStart; H.render(); var q = document.getElementById('hk-q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} }
      });
    })();
    // Anything a person does can change the analysis: look again a moment after it, and keep what was typed when the tab is left.
    ['change', 'click', 'keyup', 'paste', 'drop'].forEach(function(ev){ document.addEventListener(ev, function(e){ var r = rootEl(); if (r && r.contains(e.target)) return; H.touch(); }, true); });
    document.addEventListener('visibilitychange', function(){ if (document.hidden) H.save(); });
    window.addEventListener('pagehide', function(){ H.save(); });
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    H.load();
    return H;
  }
  return { create: create, ask: ask };
})();
