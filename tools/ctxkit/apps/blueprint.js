// Blueprint: the plate's own actions (the plate canvas keeps its own right-click).
ctxApp(null, { acts: [
  { l: 'Select all wells', f: 'selectAll' },
  { l: 'Deselect', f: 'clearSelection' },
  { l: 'Paste reader values…', f: 'pdOpenValues' },
  { l: 'Export PNG', f: 'exportPNG' },
  { l: 'Send to Labbook', f: 'sendPlateToLabbook' },
  { l: 'Clear the plate', f: 'clearPlate', danger: true }
] });
