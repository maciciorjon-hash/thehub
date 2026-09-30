// BCA: export and send.
ctxApp(null, { acts: [
  { l: 'Load test data', f: 'loadTestData' },
  { l: 'Export the plate (.csv)', f: 'exportPlateCSV' },
  { l: 'Export the samples (.csv)', f: 'exportSamplesCSV' },
  { l: 'Export the workbook (.xlsx)', f: 'exportWorkbook' },
  { l: 'Send the samples to Labbook', f: 'sendSamplesToLabbook' },
  { l: 'Clear the plate', f: 'clearPlate', danger: true }
] });
