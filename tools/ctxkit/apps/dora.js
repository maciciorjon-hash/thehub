// Dora: open, export.
ctxApp(null, { acts: [
  { l: 'Open from Echo', f: 'openFromEcho' },
  { l: 'Load test data', f: 'loadTestData' },
  { l: 'Download the template', f: 'downloadTemplate' },
  { l: 'Export the table (.csv)', f: 'exportCSV' },
  { l: 'Export the scatter (PNG)', f: 'exportScatter', args: ['transparent'] },
  { l: 'Export the table as an image', f: 'exportTable', args: ['transparent'] }
] });
