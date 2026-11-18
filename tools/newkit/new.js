/* NewKit — "New analysis": keep the one on screen, start the next from the beginning with Setup open, or from a copy of this one.
   Every analysis app has a Setup; a person who runs the same experiment again with one thing changed should not have to type it all in
   again, and should not lose the first version. The button asks one question (empty, or a copy of the inputs) and the app does the rest.
   NewKit.create({ app, noun, has, flush, fork, blank, copy, setup, name, toast })
     has()     → true while there is something on screen worth keeping (nothing: the button goes straight to an empty Setup)
     flush()   → keeps the analysis on screen (History's save); may return a promise
     fork()    → what is on screen from now on is a new entry, never the one just kept (History's fork)
     blank()   → empties everything and goes back to where the app starts; may return a promise
     copy(n)   → keeps the inputs (readings, layout, settings), drops what was worked out from them, and gives the copy the name n
     setup()   → opens Setup on its first step
     name()    → the Assay ID on screen ('' when none), so the copy can be called "<id> (2)"; nextName(base) → that name
   → { ask, blank, copy }.  The button is the app's: <button onclick="…ask()">. Shown text is English. */
var NewKit = (function(){
  var IC = {
    blank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 11v6M9 14h6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
  };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function create(o){
    var N = { busy: false }, noun = o.noun || 'analysis';
    function say(m, k){ try { if (o.toast) o.toast(m, k); } catch (e) {} }
    function keep(){ return Promise.resolve().then(function(){ return o.flush && o.flush(); }).catch(function(){}); }
    // An empty analysis: what was on screen is kept first, then everything goes back to the start with Setup open.
    N.blank = function(){
      if (N.busy) return Promise.resolve(); N.busy = true;
      return keep().then(function(){ if (o.fork) o.fork(); return o.blank(); }).then(function(){
        if (o.flush) return o.flush();   // the screen is empty now: History lets go of the entry it had open
      }).then(function(){ o.setup(); }).catch(function(e){ console.warn('New analysis:', e); say('Could not start a new ' + noun + ': ' + ((e && e.message) || e), 'err'); }).then(function(){ N.busy = false; });
    };
    // The same inputs, to change only what differs. The first one stays as it was; the copy is saved on its own.
    N.copy = function(){
      if (N.busy) return Promise.resolve(); N.busy = true;
      var from = String(o.name ? o.name() : '').trim(), to = from ? (o.nextName ? o.nextName(from) : from + ' (2)') : '';
      return keep().then(function(){ if (o.fork) o.fork(); return o.copy(to); }).then(function(){
        return o.flush && o.flush();   // the copy is an entry of its own from this moment, not after the next edit
      }).then(function(){
        o.setup();
        say(from ? '“' + from + '” stays as it was. This is a copy called “' + to + '” — change what you want; it is saved on its own.' : 'This is a copy of the ' + noun + ' — change what you want; it is saved on its own and the first one stays as it was.');
      }).catch(function(e){ console.warn('New analysis (copy):', e); say('Could not copy the ' + noun + ': ' + ((e && e.message) || e), 'err'); }).then(function(){ N.busy = false; });
    };
    N.ask = function(){
      if (N.busy || document.querySelector('.nk-back')) return;
      if (!o.has()) { N.blank(); return; }
      var from = String(o.name ? o.name() : '').trim();
      var back = document.createElement('div'); back.className = 'nk-back';
      back.innerHTML = '<div class="nk-dlg" role="dialog" aria-modal="true" aria-label="New ' + esc(noun) + '"><h3>New ' + esc(noun) + '</h3>' +
        '<p>' + (from ? '“' + esc(from) + '”' : 'This ' + esc(noun)) + ' is kept in History as it is now.</p>' +
        '<div class="nk-opts"><button type="button" class="nk-opt" data-k="blank">' + IC.blank + '<div><b>Start empty</b><span>Back to the beginning with Setup open.</span></div></button>' +
        '<button type="button" class="nk-opt" data-k="copy">' + IC.copy + '<div><b>Keep these inputs</b><span>A copy with the same readings, layout and settings, to change only what is different. It is saved on its own.</span></div></button></div>' +
        '<div class="nk-foot"><button type="button" class="nk-cancel" data-k="cancel">Cancel</button></div></div>';
      var prev = document.activeElement;
      function done(k){
        document.removeEventListener('keydown', key, true); back.remove();
        if (k === 'blank') N.blank(); else if (k === 'copy') N.copy(); else if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
      }
      function key(e){
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done('cancel'); return; }
        if (e.key === 'Tab') {   // the focus stays inside the question
          var f = [].slice.call(back.querySelectorAll('button')), i = f.indexOf(document.activeElement);
          e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
        }
      }
      back.addEventListener('click', function(e){ if (e.target === back) { done('cancel'); return; } var b = e.target.closest && e.target.closest('[data-k]'); if (b) done(b.dataset.k); });
      document.addEventListener('keydown', key, true);
      document.body.appendChild(back);
      back.querySelector('[data-k="blank"]').focus();
    };
    return N;
  }
  return { create: create };
})();
