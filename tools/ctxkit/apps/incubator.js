// Incubator: a culture (row or flask/plate card) and the list-level actions.
ctxApp(function(e, t){
  var a = ctxApp.arg(t, 'openDrawer'); if (!a) return null;
  var id = a.id, nm = (a.el.querySelector('.cl-name,.vsl-name,b,strong') || {}).textContent;
  return [
    { hd: (nm || 'Culture').trim().slice(0, 40) },
    { label: 'Open details', act: function(){ openDrawer(id); } },
    { label: 'Split / passage…', act: function(){ openSplit(id); } },
    { label: 'Freeze vials…', act: function(){ freezeCulture(id); } },
    { label: 'Edit…', act: function(){ openCellForm(id); } },
    { label: 'Log a mycoplasma test', act: function(){ logMyco(id); } },
    { label: 'Open in Labbook', act: function(){ openCultureInLabbook(id); } },
    { sep: true },
    { label: 'Remove…', danger: true, act: function(){ askRemove(id); } }
  ];
}, { canvas: false, acts: [
  { l: 'New culture…', f: 'openCellForm', args: ['new'] },
  { l: 'Pick a cell line…', f: 'openCellPicker' },
  { l: 'Show as list', f: 'setIncLayout', args: ['list'] },
  { l: 'Show as grid', f: 'setIncLayout', args: ['grid'] }
] });
