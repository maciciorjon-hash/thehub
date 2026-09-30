// Blot: the figure's own actions.
ctxApp(null, { acts: [
  { l: 'Add a panel', f: 'addPanel' },
  { l: 'Add a group bracket', f: 'addGroup' },
  { l: 'Add a condition row', f: 'addCondRow' },
  { l: 'Reset lane widths', f: 'resetLaneWidths' },
  { l: 'Reset label positions', f: 'resetLaneLabelPos' },
  { l: 'Export PNG (high-res)', f: 'doExport', args: ['png'] },
  { l: 'Export PDF', f: 'doExport', args: ['pdf'] },
  { l: 'Save this figure', f: 'saveHistory' },
  { l: 'History…', f: 'openHistoryModal' },
  { l: 'Presets…', f: 'openPresetsModal' },
  { l: 'Reset the figure…', f: 'resetFigure', danger: true }
] });
