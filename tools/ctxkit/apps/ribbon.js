// Ribbon: the 3D viewer is WebGL and cannot be read back as an image by the kit, so the viewer has its own menu
// (the structure under the pointer, in ribbon.html) and everywhere else offers the figure's actions.
ctxApp(null, { canvas: false, acts: [
  { l: 'Fit to view', f: 'fitToView', k: 'F', when: function(){ return !!window.currentModel; } },
  { l: 'Export image…', f: 'openExport', when: function(){ return !!window.currentModel; } },
  { l: 'Copy image', f: 'copyImage', when: function(){ return !!window.currentModel; } },
  { l: 'Open file…', f: 'rbOpenFilePicker' },
  { l: 'Controls…', f: 'openControls', when: function(){ return window.innerWidth <= 760; } }
] });
