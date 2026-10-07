// BCA: from a plate-reader read to how to prepare each sample. (The Hub calls it "spectra".)
(function(){
  var MISS_PLATE = 'This appears once a plate is imported. Paste one into the grid (or load the test data) first.';
  var MISS_CURVE = 'This appears once the standards are painted and a curve is fitted.';
  var setup = function(w){ if (w.switchPrepTab) w.switchPrepTab('setup'); };
  function vis(w, sel){ var e = w.document.querySelector(sel); return !!(e && e.offsetParent !== null); }
  assistRegister('spectra', {
    name: 'BCA',
    blurb: 'BCA turns the plate-reader absorbance of a BCA protein assay into concentrations: paste the plate, mark the BSA standards to fit a curve, mark your samples, and it tells you how much water to add to bring every sample to the same concentration.',
    first: ['start', 'tour', 'import', 'standards', 'samples'],
    screen: function(w){ return vis(w, '#panel-guide.active') ? 'guide' : 'workflow'; },
    diag: function(w){
      var d = [];
      if (vis(w, '#panel-guide.active')) return d;
      if (!vis(w, '#import-results')) d.push({ msg: 'Next: **paste the plate** into the grid and press **Use this data**.', t: 'import' });
      else if (!vis(w, '#standards-body')) d.push({ msg: 'Next: **paint the BSA standards.**', t: 'standards' });
      else if (!(w.document.getElementById('standards-list') || {}).textContent || !w.document.getElementById('standards-list').textContent.trim()) d.push({ msg: 'Next: **drag across each duplicate pair** of standards.', t: 'standards' });
      else if (vis(w, '#prep-body') && vis(w, '#prep-panel-setup') && !(w.document.getElementById('samples-list') || {}).textContent.trim()) d.push({ msg: 'Next: **paint your samples.**', t: 'samples' });
      return d;
    },
    topics: [
      { id: 'tour', t: 'Take a guided tour', group: 'Getting started', on: ['workflow'],
        q: ['guided tour', 'take the tour', 'tour of this tool', 'show me around', 'visita guiada', 'recorrido guiado', 'enseñame la herramienta'],
        a: 'A one-minute tour moves through each part of this tool and points at what it is for. It is also on the **Guide** tab, where every part has a tour of its own.',
        go: [{ l: 'Take the tour', fn: 'appTour' }],
        show: { sel: '.tab[data-tab="guide"]', say: 'The Guide tab keeps the tour, and a tour for each part.' } },
      { id: 'start', t: 'The workflow, start to finish', group: 'Getting started', on: ['workflow'],
        q: ['how does it work', 'how to use', 'get started', 'workflow', 'steps', 'first time', 'tutorial', 'como funciona', 'como se usa', 'empezar', 'primeros pasos', 'flujo'],
        a: 'Everything happens on one page, top to bottom. Each section unlocks when the one above is done.',
        steps: ['**Import** the plate: paste the absorbance values.', '**Standards:** paint the BSA duplicates and give each its concentration; a curve is fitted.', '**Samples:** paint your samples and name them.', '**Results:** set a target concentration and volume; the table says how much sample and water to use.'],
        show: [{ sel: '#paste-grid-wrap', say: 'Start by pasting the plate here.' }],
        go: [{ l: 'Load the test data', fn: 'loadTestData' }], see: ['import', 'standards', 'samples', 'target'] },
      { id: 'import', t: 'Import the plate from a reader', group: 'Plate', on: ['workflow'],
        q: ['import', 'paste', 'paste plate', 'load data', 'plate reader', 'absorbance', 'excel', 'copy from excel', 'importar', 'pegar', 'pegar placa', 'cargar datos', 'lector de placas', 'absorbancia', 'use this data', '562'],
        a: 'It works with any plate reader.',
        steps: ['Open the reader’s export in Excel and copy an **8×12** range of absorbance values, with no headers.', 'Click cell **A1** in the grid and paste (`⌘V` / `Ctrl+V`). You can also type values by hand.', 'Press **Use this data**.'],
        tip: 'The imported plate is drawn as a heatmap so a bad row or column is obvious before you go on.',
        show: [{ sel: '#paste-grid-wrap', say: 'Click **A1** here, then paste.' }, { sel: '#paste-fallback .btn-sm', say: 'Then press **Use this data**.' }],
        go: [{ l: 'Load the test data', fn: 'loadTestData' }] },
      { id: 'test-data', t: 'Try it with test data', group: 'Plate', on: ['workflow'],
        q: ['test data', 'example', 'demo', 'sample data', 'try it', 'datos de prueba', 'ejemplo', 'probar'],
        a: 'The test-data button fills the grid with a finished example so you can see every step working before using your own plate.',
        go: [{ l: 'Load the test data', fn: 'loadTestData' }] },
      { id: 'standards', t: 'Paint the BSA standards', group: 'Standards', on: ['workflow'],
        q: ['standards', 'bsa', 'standard curve', 'paint wells', 'known concentration', 'duplicate', 'estandares', 'curva estandar', 'curva patron', 'pintar pocillos', 'concentracion conocida', 'duplicados'],
        a: 'Standards are BSA wells of known concentration, and they are what the curve is built from.',
        steps: ['Drag across a **technical-duplicate pair** of wells to create one standard point.', 'Enter its known concentration (µg/µL) in the list on the right.', 'Repeat for every standard.'],
        tip: 'To leave out an overflowing or odd well, click a painted well once (without dragging). Click it again to bring it back.',
        show: [{ sel: '#standards-grid-wrap', say: 'Drag across each duplicate pair.', miss: MISS_PLATE }, { sel: '#standards-list', say: 'Type each concentration here.', miss: MISS_PLATE }], see: ['curve', 'exclude-well'] },
      { id: 'exclude-well', t: 'Leave out a bad well', group: 'Standards', on: ['workflow'],
        q: ['exclude well', 'outlier', 'remove well', 'overflow', 'ignore well', 'bad well', 'excluir pocillo', 'quitar pocillo', 'pocillo malo', 'valor raro', 'include well'],
        a: 'Click an already-painted well once, without dragging, to exclude it from the average — an overflow or an obvious outlier. Click it again to include it.',
        show: { sel: '#standards-grid-wrap', say: 'Click a painted well once.', miss: MISS_PLATE } },
      { id: 'curve', t: 'Linear or quadratic curve?', group: 'Standards', on: ['workflow'],
        q: ['linear', 'quadratic', 'fit', 'r2', 'r squared', 'curve fit', 'equation', 'lineal', 'cuadratica', 'ajuste', 'ecuacion', 'r cuadrado', 'standard curve fit', 'nonlinear'],
        a: 'Choose the fit above the curve. BCA is genuinely nonlinear across a wide range, so **quadratic** usually follows the standards better over a wide range; **linear** is fine when the standards span a narrow range.',
        tip: 'The R² badge and the equation under the curve tell you how well it fits. A poor R² usually means a bad well or a wrong concentration.',
        show: { sel: '#sc-fit', say: 'Pick the fit here.', miss: MISS_CURVE } },
      { id: 'samples', t: 'Paint and name your samples', group: 'Samples', on: ['workflow'],
        q: ['samples', 'paint samples', 'name samples', 'unknowns', 'muestras', 'pintar muestras', 'nombrar muestras', 'desconocidas', 'lysates', 'lisados', 'sample prep'],
        steps: ['Under **Sample prep → Setup**, drag across a duplicate pair of wells to create one sample.', 'Give it a name.', 'Repeat for every sample.'],
        tip: 'Dilution defaults to the value at the top for every sample; change it for one sample only if you prepared that one differently.',
        prep: setup,
        show: { sel: '#samples-grid-wrap', say: 'Drag across each sample’s duplicate pair.', miss: 'This appears once the standard curve is fitted.' }, see: ['dilution', 'target'] },
      { id: 'dilution', t: 'The dilution of my samples', group: 'Samples', on: ['workflow'],
        q: ['dilution', 'diluted', 'default dilution', 'dilution factor', 'dilucion', 'diluido', 'factor de dilucion', 'per sample dilution', '10x'],
        a: 'Enter how much each sample was diluted **before** it went on the plate. **Default dilution ×** applies to every sample, and you can override it on any one. The final concentration is corrected for it.',
        prep: setup,
        show: { sel: '#master-dilution', say: 'The default dilution for all samples.', miss: 'This appears once the standard curve is fitted.' } },
      { id: 'target', t: 'Get every sample to the same concentration', group: 'Results', on: ['workflow'],
        q: ['normalize', 'normalise', 'target concentration', 'target volume', 'add water', 'equal loading', 'how much water', 'igualar', 'normalizar', 'concentracion final', 'volumen final', 'cuanta agua', 'carga igual', 'western loading'],
        a: 'On **Results**, set the target concentration (µg/µL) and volume (µL). Each sample is diluted with water to that concentration and volume from its final, dilution-corrected concentration; the table gives the sample and water volumes.',
        warn: 'A sample already more dilute than the target can’t be concentrated. It is flagged instead of showing a negative water volume.',
        prep: function(w){ if (w.switchPrepTab) w.switchPrepTab('results'); },
        show: [{ sel: '#norm-target-conc', say: 'Target concentration.', miss: 'This appears once samples are painted.' }, { sel: '#norm-target-vol', say: 'And target volume.', miss: 'This appears once samples are painted.' }, { sel: '#samples-table', say: 'The table says how to prepare each sample.', miss: 'This appears once samples are painted.' }] },
      { id: 'export', t: 'Export the tables', group: 'Results', on: ['workflow'],
        q: ['export', 'download', 'save', 'excel', 'csv', 'workbook', 'exportar', 'descargar', 'guardar', 'xlsx'],
        a: 'Under the results table: **Export workbook** (Excel), **Export CSV** for the sample table, and on the imported plate **Export CSV** for the raw values.',
        show: { sel: '#samples-table', say: 'The buttons for exporting are just below this table.', miss: 'This appears once samples are painted.' },
        prep: function(w){ if (w.switchPrepTab) w.switchPrepTab('results'); } },
      { id: 'send-labbook', t: 'Send the samples to Labbook', group: 'Results', needs: 'labbook',
        q: ['labbook', 'send to labbook', 'notebook', 'experiment', 'enviar a labbook', 'cuaderno'],
        a: 'Inside dHUB, **Send to Labbook** puts the sample table — concentrations and loading volumes — on an experiment’s Results tab.' },
      { id: 'guide', t: 'Where is the guide?', group: 'Getting started',
        q: ['guide', 'help', 'manual', 'documentation', 'guia', 'ayuda', 'instrucciones'],
        a: 'The **Guide** tab, next to Workflow, explains the assay and the method in more detail.',
        show: { sel: '.tab[data-tab="guide"]', say: 'The Guide is here.' } },
      { id: 'sections-locked', t: 'Why do the sections say “import a plate first”?', group: 'Getting started', on: ['workflow'],
        q: ['import a plate above first', 'nothing shows', 'empty', 'section is empty', 'why is it empty', 'no aparece', 'vacio', 'no sale nada', 'greyed', 'locked', 'fit a standard curve above first'],
        a: 'Each section needs the one above it. **Standards** appear after a plate is imported, and **Sample prep** after a standard curve is fitted. Follow the page from the top.' }
    ]
  });
})();
