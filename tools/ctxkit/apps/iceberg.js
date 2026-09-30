// Iceberg: a vial in the box map, an empty position, and the box-level actions.
ctxApp(function(e, t){
  var w = t.closest('.well[data-pos]');
  if (!w || typeof getCurrentBox !== 'function') return null;
  var pos = w.dataset.pos, box = getCurrentBox(), v = box && (box.vials || {})[pos];
  if (!box) return null;
  if (!v) return [{ hd: pos + ' · empty' }, { label: 'Add a vial here…', act: function(){ document.getElementById('vf-pos').value = pos; openAddVial(); } }];
  var cells = typeof vialKind === 'function' && vialKind(v) === 'cells';
  return [
    { hd: pos + ' · ' + (typeof vialLabel === 'function' ? vialLabel(v) : 'vial') },
    { label: 'Edit vial…', act: function(){ openEditVial(pos); } },
    { label: 'Duplicate to the next free position', act: function(){ openEditVial(pos); duplicateVial(); } },
    cells && { label: 'Thaw into a culture…', act: function(){ openEditVial(pos); thawVial(); } },
    { label: 'Discard… (kept in the box history)', act: function(){ openEditVial(pos); discardVial(); } },
    { label: 'Remove', danger: true, act: function(){ openEditVial(pos); deleteVial(); } }
  ];
}, { canvas: false, acts: [
  { l: 'Add a vial…', f: 'openAddVial', when: function(){ return !!getCurrentBox(); } },
  { l: 'Bulk add (paste)…', f: 'openBulkAdd', when: function(){ return !!getCurrentBox(); } },
  { l: 'Print the box map', f: 'printBoxMap', when: function(){ return !!getCurrentBox(); } },
  { l: 'Box history', f: 'showBoxLog', when: function(){ return !!getCurrentBox(); } },
  { l: 'Export everything (.xlsx)', f: 'exportAllXLSX' },
  { l: 'Import (.xlsx / .csv)…', f: 'importXLSXBtn' },
  { l: 'Download the template', f: 'downloadTemplate' }
] });
