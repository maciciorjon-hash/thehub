// What the assistant may ask the Hub. Defined before the kit runs; every reference is looked up when
// it is called, so nothing here needs the rest of the shell to have loaded yet.
window.ASSIST_HOST = {
  // an app is answered about only if this person could open it — a visitor is never pointed at Labbook
  can: function(id){
    if (id === 'hub') return true;
    try { return !!(typeof APP_INFO !== 'undefined' && APP_INFO[id] && _isAppAccessible(id)); } catch (e) { return false; }
  },
  admin: function(){ try { return !!isAdmin; } catch (e) { return false; } },
  // which app is on screen: its id, or null on the home page
  current: function(){
    try { return currentApp === 'cells' ? (_cellsTab || null) : currentApp; } catch (e) { return null; }
  },
  win: function(id){ var f = document.getElementById('frame-' + id); return f && f.contentWindow || null; },
  open: function(id){ try { openApp(id); } catch (e) {} }
};

// "Take the tour": whichever tool is open runs its own guided tour (the kit in tools/tourkit/ gives each one appTour).
window.hubAppTour = function(){
  var id = window.ASSIST_HOST.current(), w = id && window.ASSIST_HOST.win(id);
  if (w && typeof w.appTour === 'function') { try { w.appTour(); } catch (e) {} return true; }
  try { if (typeof hubToast === 'function') hubToast('Open a tool first — its guided tour starts from there.'); } catch (e) {}
  return false;
};
