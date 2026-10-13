// Beacon: readings in, results out.
ctxApp(null, { acts: [
  { l: 'Choose reader files…', f: 'bPickFiles' },
  { l: 'Paste values from the clipboard', f: 'bPasteButton' },
  { l: 'Add a plate', f: 'bAddPlate' },
  { l: 'Download plate mBRET (.xlsx)', f: 'exportPlateMBretXLSX' },
  { l: 'Download results (.csv)', f: 'exportResultsCSV' },
  { l: 'Copy the results table', f: 'copyResultsTSV' },
  { l: 'Download the full workbook (.xlsx)', f: 'generateOutputXLSX' }
] });
