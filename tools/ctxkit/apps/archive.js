// Archive: a protocol card or the protocol that is open.
ctxApp(function(e, t){
  var a = ctxApp.arg(t, 'openProtocol'), id = a ? a.id : window._openProtocolId;
  if (!id) return null;
  var p = (window.PROTOCOLS || []).filter(function(x){ return x.id === id; })[0];
  return [
    { hd: p ? p.name : id },
    !window._openProtocolId || a ? { label: 'Open', act: function(){ openProtocol(id); } } : null,
    { label: 'Copy as text', act: function(){ copyProtocolText(id); } },
    { label: 'Print / Save as PDF', act: function(){ exportProtocolPDF(id); } },
    { label: 'Download CSV (Excel)', act: function(){ exportProtocolCSV(id); } },
    { label: 'Use in a Labbook experiment', act: function(){ openProtocolInLabbook(id); } },
    window._openProtocolId && { sep: true },
    window._openProtocolId && { label: 'All protocols', act: closeProtocol }
  ];
}, { canvas: false, acts: [ { l: 'Keep the screen awake', f: 'toggleWake' } ] });
