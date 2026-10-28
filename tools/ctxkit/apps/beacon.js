// Beacon: readings in, results out.
ctxApp(function(e, t){ return typeof bDataCtx === 'function' ? bDataCtx(e, t) : null; }, { acts: [
  { l: 'Choose reader files…', f: 'bPickFiles' },
  { l: 'Paste values from the clipboard', f: 'bPasteButton' },
  { l: 'Set up the analysis…', f: 'bsOpen' },
  { l: 'Add a plate', f: 'bAddPlate' },
  { l: 'Download plate mBRET (.xlsx)', f: 'exportPlateMBretXLSX' },
  { l: 'Download results (.csv)', f: 'exportResultsCSV' },
  { l: 'Copy for Prism', f: 'copyPrism' },
  { l: 'Copy the results table', f: 'copyResultsTSV' },
  { l: 'Send to Labbook…', f: 'sendResultsToLabbook' },
  { l: 'Clear all', f: 'bClearAll' },
  { l: 'Download the full workbook (.xlsx)', f: 'generateOutputXLSX' }
] });
