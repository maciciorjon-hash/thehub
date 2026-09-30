// Helix: what the tab you are on can do.
function _hxOn(id){ var p = document.getElementById('panel-' + id); return !!p && p.classList.contains('active'); }
ctxApp(null, { acts: [
  { l: 'Translate', f: 'runTranslate', when: function(){ return _hxOn('genetic'); } },
  { l: 'Reverse translate', f: 'runReverseTranslate', when: function(){ return _hxOn('genetic'); } },
  { l: 'Load the translation example', f: 'loadTrExample', when: function(){ return _hxOn('genetic'); } },
  { l: 'Analyse the sequence', f: 'runSeqTools', when: function(){ return _hxOn('seqtools'); } },
  { l: 'Load the example', f: 'loadSeqExample', when: function(){ return _hxOn('seqtools'); } },
  { l: 'Clear', f: 'clearSeqTools', when: function(){ return _hxOn('seqtools'); } },
  { l: 'Compare', f: 'runCompare', when: function(){ return _hxOn('compare'); } },
  { l: 'Open Archive → Plasmids', f: 'hxOpenPlasmids' }
] });
