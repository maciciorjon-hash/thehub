// Blot: an annotation (select it, then what the Format tab does), and for everything else what the pointer is on —
// a lane label, a condition or text row (and its cells), a group bracket, a panel or its gutters — then the figure's own actions.
var _blCtx = '';   // what the last right-click was on, so the figure-wide "Add …" actions do not repeat the ones that menu already has
// An editable label: Cut / Copy / Paste (the browser's own menu is replaced here) and Edit, which puts the caret at the end.
function blText(node){
  if (!node) return [];
  var s = window.getSelection(), has = !!(s && s.rangeCount && String(s).trim() && node.contains(s.anchorNode)), rg = has ? s.getRangeAt(0).cloneRange() : null;
  function back(){ node.focus(); var q = window.getSelection(); q.removeAllRanges(); if (rg) q.addRange(rg); else { var r = document.createRange(); r.selectNodeContents(node); r.collapse(false); q.addRange(r); } }
  return [
    { label: 'Edit the text', act: back },
    has && { label: 'Cut', k: CTX_MOD + 'X', act: function(){ back(); document.execCommand('cut'); } },
    has && { label: 'Copy', k: CTX_MOD + 'C', act: function(){ back(); document.execCommand('copy'); } },
    { label: 'Paste', k: CTX_MOD + 'V', act: function(){
        back();
        if (!navigator.clipboard || !navigator.clipboard.readText) { ctxApp.say('Press ' + CTX_MOD + 'V to paste here.'); return; }
        navigator.clipboard.readText().then(function(tx){ document.execCommand('insertText', false, String(tx).replace(/[\t\r\n]+/g, ' ')); }).catch(function(){ ctxApp.say('Press ' + CTX_MOD + 'V to paste here.'); });
      } }
  ];
}
ctxApp(function(e, t){
  if (typeof anFind !== 'function') return null;
  _blCtx = '';
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
  // ── what the pointer is on: a lane label, a condition row or cell, a group bracket, a panel (its picture or its gutters) ──
  var lc = t.closest('#figure .lane-cell');
  if (lc) {
    var li = +lc.getAttribute('data-i'), ln = FIG.laneCount, lhas = !!_stripHtml(FIG.lanes[li] || ''), lmoved = !!(laneLabelOffsetXArr(FIG)[li] || laneLabelDYArr(FIG)[li]);
    _blCtx = 'lane';
    return [{ hd: 'Lane ' + (li + 1) }].concat(blText(lc.querySelector('.lbl-in')), [
      lhas && { label: 'Clear the label', act: function(){ setLane(li, ''); render(); } },
      lmoved && { label: 'Reset the label position', act: function(){ laneLabelReset(li); } },
      { sep: true },
      { label: 'Add a lane before', disabled: ln >= 30, act: function(){ laneAddAt(li); } },
      { label: 'Add a lane after', disabled: ln >= 30, act: function(){ laneAddAt(li + 1); } },
      { label: 'Group bracket over this lane', act: function(){ addGroupAt(li + 1, li + 1); } },
      { sep: true },
      { label: 'Remove this lane', danger: true, disabled: ln <= 1, act: function(){ laneDelAt(li); } }
    ]);
  }
  var cc = t.closest('#figure .cond-cell'), cr = t.closest('#figure .cond-lblcell, #figure .cond-lanes'), cri = -1, ci = -1;
  if (cc) { cri = +cc.getAttribute('data-ri'); ci = +cc.getAttribute('data-i'); }
  else if (cr) { var band = cr.parentNode, same = Array.prototype.filter.call(band.children, function(c){ return c.className === cr.className; }); cri = same.indexOf(cr); }
  if (cri >= 0 && FIG.condRows[cri]) {
    var row = FIG.condRows[cri], text = row.kind === 'text', rows = FIG.condRows.length, ttl = _stripHtml(row.label || '');
    _blCtx = 'cond';
    var own = [];
    if (cc && text) own = blText(cc.querySelector('.lbl-in'));
    else if (cc) own = [{ label: row.on && row.on[ci] ? 'Turn it off' : 'Turn it on', act: function(){ toggleCond(cri, ci); } }];
    else if (cr.classList.contains('cond-lblcell')) own = blText(cr.querySelector('.lbl-in'));
    if (cc && ((row.dx && row.dx[ci]) || (row.dy && row.dy[ci]))) own.push({ label: 'Reset its position', act: function(){ resetCondCell(cri, ci); } });
    return [{ hd: (text ? 'Text row ' : 'Condition row ') + (cri + 1) + (ttl ? ' · ' + ttl.slice(0, 18) : '') }].concat(own, [
      { sep: true },
      { label: 'Move row up', disabled: cri === 0, act: function(){ moveCondRow(cri, -1); } },
      { label: 'Move row down', disabled: cri >= rows - 1, act: function(){ moveCondRow(cri, 1); } },
      { label: 'Duplicate row', act: function(){ dupCondRow(cri); } },
      { label: 'Clear row', act: function(){ clearCondRow(cri); } },
      { sep: true },
      { label: 'Add a condition row below', act: function(){ addCondRow('mark', cri + 1); } },
      { label: 'Add a text row below', act: function(){ addCondRow('text', cri + 1); } },
      { sep: true },
      { label: 'Remove this row', danger: true, act: function(){ delCondRow(cri); } }
    ]);
  }
  var gp = t.closest('#figure .grp');
  if (gp) {
    var gi = +gp.getAttribute('data-gi'), g = FIG.groups[gi]; if (!g) return null;
    _blCtx = 'group';
    return [{ hd: 'Group ' + (gi + 1) }].concat(blText(gp.querySelector('.grp-lbl')), [
      { label: 'Span all lanes', disabled: g.from <= 1 && g.to >= FIG.laneCount, act: function(){ spanGroup(gi); } },
      { sep: true },
      { label: 'Add a group bracket', act: function(){ addGroup(); } },
      { sep: true },
      { label: 'Remove this group', danger: true, act: function(){ delGroup(gi); } }
    ]);
  }
  var host = t.closest('#figure .panel-blot, #figure .blot-drop, #figure .panel-kda, #figure .panel-prot'); if (!host) return null;
  var pi = +host.getAttribute('data-pi'), p = FIG.panels[pi]; if (!p) return null;
  var has = _bIsData(p.cropped), np = FIG.panels.length, gut = host.classList.contains('panel-kda') ? 'kda' : host.classList.contains('panel-prot') ? 'prot' : '';
  _blCtx = 'panel';
  var mine = gut ? blText(host.querySelector('.lbl-in')) : [];
  if (gut && (p[gut === 'kda' ? 'kdaOffsetY' : 'protOffsetY'] || 0)) mine.push({ label: 'Reset the label position', act: function(){ panelLabelReset(pi, gut); } });
  return [{ hd: 'Panel ' + (pi + 1) }].concat(mine, mine.length ? [{ sep: true }] : [], has ? [
    { label: 'Size markers…', act: function(){ openMarkers(pi); } },
    { label: 'Measure a band', disabled: (p.marks || []).length < 2, act: function(){ MK.pi = pi; anMsStart(); } },
    { label: 'Crop…', act: function(){ openCrop(pi); } },
    { label: 'Quantify…', act: function(){ openQuant(pi); } },
    { label: 'Replace the image…', act: function(){ pickFile(pi); } }
  ] : [
    { label: _bIsRef(p.cropped) ? 'Add the picture again…' : 'Add an image…', act: function(){ pickFile(pi); } }
  ], [
    (p.shapes || []).length && { label: 'Select all annotations', k: CTX_MOD + 'A', act: function(){ anSelect(p.shapes.map(function(s){ return s.id; })); } },
    { sep: true },
    { label: 'Move panel up', disabled: pi === 0, act: function(){ movePanel(pi, -1); } },
    { label: 'Move panel down', disabled: pi >= np - 1, act: function(){ movePanel(pi, 1); } },
    { label: 'Add a panel below', act: function(){ addPanelAt(pi + 1); } },
    { sep: true },
    { label: 'Remove this panel', danger: true, disabled: np <= 1, act: function(){ removePanel(pi); } }
  ]);
}, { acts: [
  { l: 'Add a panel', f: 'addPanel', when: function(){ return _blCtx !== 'panel'; } },
  { l: 'Add a group bracket', f: 'addGroup', when: function(){ return _blCtx !== 'group'; } },
  { l: 'Add a condition row', f: 'addCondRow', when: function(){ return _blCtx !== 'cond'; } },
  { l: 'Add a text row', f: 'addCondRow', args: ['text'], when: function(){ return _blCtx !== 'cond'; } },
  { l: 'Reset lane widths', f: 'resetLaneWidths' },
  { l: 'Reset label positions', f: 'resetLaneLabelPos' },
  { l: 'Export PNG (high-res)', f: 'doExport', args: ['png'] },
  { l: 'Export PDF', f: 'doExport', args: ['pdf'] },
  { l: 'Export SVG (for Illustrator)', f: 'doExport', args: ['svg'] },
  { l: 'Save this figure', f: 'saveHistory' },
  { l: 'History…', f: 'openHistoryModal' },
  { l: 'Presets…', f: 'openPresetsModal' },
  { l: 'Reset the figure…', f: 'resetFigure', danger: true }
], editable: '#figure .lbl-in, #figure .grp-lbl' });
