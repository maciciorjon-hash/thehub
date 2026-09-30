// Echo: the analysis, the project, the gradient planner. Its column headers and plots keep their own menus.
ctxApp(null, { acts: [
  { l: 'Run the analysis', f: 'runPipeline' },
  { l: 'Setup…', f: 'openSetupModal' },
  { l: 'Open a project…', f: 'openEchoProject' },
  { l: 'Save the project', f: 'saveEchoProject' },
  { l: 'Load the test data', f: 'loadTestData' },
  { l: 'Copy the transfer summary', f: '_egCopy' },
  { l: 'Export the transfer plan (.csv)', f: '_egExportPlan' }
] });
