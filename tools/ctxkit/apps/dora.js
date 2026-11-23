// Dora: open, export.
ctxApp(null, { acts: [
  { l: 'Open from Echo', f: 'openFromEcho' },
  { l: 'Load the example', f: 'loadTestData' },
  { l: 'Download the template', f: 'downloadTemplate' },
  { l: 'Export the results (.csv)', f: 'exportCSV' },
  { l: 'Export structures and data (.sdf)', f: 'exportSDF', when: function(){ return RAW.some(function(c){ return c.smiles; }); } },
  { l: 'Export the plot (PNG)', f: 'exportScatter', args: ['transparent'] },
  { l: 'Export the table as an image', f: 'exportTable', args: ['transparent'] }
] });
