// LDI: calculate and export.
ctxApp(null, { acts: [
  { l: 'Calculate', f: 'runCalc' },
  { l: 'Add a row', f: 'addRow' },
  { l: 'Open from Echo', f: 'ldiOpenFromEcho' },
  { l: 'Load the example', f: 'ldiLoadExample' },
  { l: 'Download the template', f: 'ldiDownloadTemplate' },
  { l: 'Export CSV', f: 'exportCSV' },
  { l: 'Chart as PNG', f: 'exportBarPNG' },
  { l: 'Curve as PNG', f: 'exportCurvePNG' },
  { l: 'Clear everything', f: 'clearAll', danger: true }
] });
