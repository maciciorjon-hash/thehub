// Blot: an annotation (select it, then what the Format tab does), a picture (its tools), and the figure's own actions.
ctxApp(function(e, t){
  if (typeof anFind !== 'function') return null;
  var sg = t.closest('.an-s');
  if (sg && AN.tool === 'select') {
    var id = sg.getAttribute('data-id'), f = anFind(id); if (!f) return null;
    if (AN.ids.indexOf(id) < 0) anSelect([id]);
    var sh = anSel(), many = sh.length > 1, locked = sh.every(function(s){ return s.lock; }), one = sh[0];
    var name = many ? sh.length + ' annotations' : ({ line: one.head && one.head !== 'none' ? 'Arrow' : 'Line', rect: 'Box', ellipse: 'Circle', text: 'Text' })[one.t];
    return [
      { hd: name },
      !many && one.t === 'text' && !one.lock && { label: 'Edit text', act: function(){ anEditText(one.id, false); } },
      { label: 'Duplicate', k: CTX_MOD + 'D', act: anDup },
      { label: locked ? 'Unlock' : 'Lock', act: anLock },
      { sep: true },
      { label: 'Bring to front', act: function(){ anOrder('front'); } },
      { label: 'Bring forward', act: function(){ anOrder('fwd'); } },
      { label: 'Send backward', act: function(){ anOrder('bwd'); } },
      { label: 'Send to back', act: function(){ anOrder('back'); } },
      { sep: true },
      { label: 'Delete', k: 'Del', danger: true, disabled: locked, act: anDelete }
    ];
  }
  var host = t.closest('.panel-blot'); if (!host) return null;
  var pi = +host.getAttribute('data-pi'), p = FIG.panels[pi]; if (!p || !p.cropped) return null;
  return [
    { hd: 'Panel ' + (pi + 1) },
    { label: 'Size markers…', act: function(){ openMarkers(pi); } },
    { label: 'Measure a band', disabled: (p.marks || []).length < 2, act: function(){ MK.pi = pi; anMsStart(); } },
    { label: 'Crop…', act: function(){ openCrop(pi); } },
    { label: 'Quantify…', act: function(){ openQuant(pi); } },
    (p.shapes || []).length && { sep: true },
    (p.shapes || []).length && { label: 'Select all annotations', k: CTX_MOD + 'A', act: function(){ anSelect(p.shapes.map(function(s){ return s.id; })); } }
  ];
}, { acts: [
  { l: 'Add a panel', f: 'addPanel' },
  { l: 'Add a group bracket', f: 'addGroup' },
  { l: 'Add a condition row', f: 'addCondRow' },
  { l: 'Reset lane widths', f: 'resetLaneWidths' },
  { l: 'Reset label positions', f: 'resetLaneLabelPos' },
  { l: 'Export PNG (high-res)', f: 'doExport', args: ['png'] },
  { l: 'Export PDF', f: 'doExport', args: ['pdf'] },
  { l: 'Export SVG (for Illustrator)', f: 'doExport', args: ['svg'] },
  { l: 'Save this figure', f: 'saveHistory' },
  { l: 'History…', f: 'openHistoryModal' },
  { l: 'Presets…', f: 'openPresetsModal' },
  { l: 'Reset the figure…', f: 'resetFigure', danger: true }
] });
