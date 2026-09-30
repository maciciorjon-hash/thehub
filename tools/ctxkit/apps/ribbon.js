// Ribbon: the 3D viewer is WebGL and cannot be read back as an image, so only its controls are offered.
ctxApp(null, { canvas: false, acts: [
  { l: 'Controls…', f: 'openControls' },
  { l: 'Reset the chain', f: 'resetChain' }
] });
