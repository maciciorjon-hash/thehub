// Cell Archive: a cell line tile, and adding a line.
ctxApp(function(e, t){
  var a = ctxApp.arg(t, 'showCellLine'); if (!a) return null;
  var id = a.id, nm = (a.el.querySelector('.cell-tile-name') || {}).textContent || id;
  var mine = false; try { mine = typeof getUserLines === 'function' && getUserLines().some(function(L){ return L.id === id; }); } catch(err){}
  return [
    { hd: nm.trim() },
    { label: 'Open ' + nm.trim(), act: function(){ showCellLine(id, a.el); } },
    { label: 'Copy the name', act: function(){ ctxApp.copy(nm.trim(), 'Name copied.'); } },
    mine && { sep: true },
    mine && { label: 'Remove this line', danger: true, act: function(){ deleteUserLine(id); } }
  ];
}, { acts: [ { l: 'Add a cell line…', f: 'openAddLine' }, { l: 'Close the detail panel', f: 'hideCellLine' } ] });
