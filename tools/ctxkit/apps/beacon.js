// Beacon: setup, fits, downloads.
ctxApp(null, { acts: [
  { l: 'Setup…', f: 'openSetupModal' },
  { l: 'Compute the dose-response fit', f: 'computeDoseResponse' },
  { l: 'Compute the tracer titration fit', f: 'computeTracerTitration' },
  { l: 'Download mBRET plate (.xlsx)', f: 'exportPlateMBretXLSX' },
  { l: 'Download ratios (.xlsx)', f: 'exportLiteRatiosXLSX' },
  { l: 'Download the full report (.xlsx)', f: 'generateOutputXLSX' }
] });
