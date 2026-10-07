// Dora: a degradation screen's summary — DC50 and Dmax by compound, target and series — as a table and a plot.
(function(){
  var tabEl = function(i){ return function(){ return document.querySelectorAll('.tabs .tab')[i]; }; };
  var to = function(n){ return function(){ switchTab(n); }; };
  var MISS = 'This fills in once a screen is loaded.';
  tourRegister({
    id: 'dora', name: 'Dora',
    blurb: 'Dora is a quick explorer for the **summary of a degradation screen**: DC50 and Dmax for every compound against every target. Filter to what is potent and deep, plot potency against effect, look at properties, and export a clean table or picture.',
    where: function(){ var t = document.querySelectorAll('.tabs .tab'); for (var i = 0; i < t.length; i++) if (t[i].classList.contains('active')) return TAB_NAMES[i]; return 'load'; },
    data: { label: 'Load the test data', has: function(){ return !!(RAW && RAW.length); }, load: function(){ switchTab('load'); loadTestData(); } },
    intro: [{ t: 'Welcome to Dora',
      b: 'Load a summary of a degradation screen and see **DC50 against Dmax** for every compound and target — as a table you can filter and export, and as a plot that shows who is potent and deep. About a minute; **Esc** leaves it at any point.',
      nodata: 'The other tabs need a screen to show anything. The button loads a small made-up one (six compounds, two targets) — only if you press it.' }],
    outro: [{ t: 'Come back any time', sel: tabEl(4), place: 'bottom', go: to('guide'),
      b: 'The **Guide** tab has each tab in writing, with a tour of each, and what to do when a number looks odd.' }],
    quick: [
      'On **Load Data**, drop the screen’s summary workbook, open an analysis from **Echo Dose Response**, or press **Load test data**.',
      'Set what “good” means — **Dmax ≥** and **DC50 ≤** — on the same tab.',
      'In **Table**, search and filter with the sliders and quality pills; click a row for its detail card; export as PNG or CSV.',
      'In **DC50 vs Dmax**, look at who sits top-left (potent and deep); the **Zones** label the quadrants.',
      'Add a SMILES file in **Properties** for structures and molecular properties.'],
    tabs: [
      { id: 'load', label: 'Load Data', sel: tabEl(0), go: to('load'),
        lead: 'Where a screen comes in, and where you say what “good” means. Targets, cell line and time point are detected from the file.',
        do: ['Drop an Excel summary (`*_degradation_summary.xlsx`) on the drop zone, or click to browse. **Template** (top right) downloads the layout it expects.',
          'Or press **Open from Echo Dose Response** to pick one of the analyses Echo has fitted — they are synced across your devices.',
          'Set the **quality thresholds**: **Dmax ≥** and **DC50 ≤** define what counts as Good in the table, the pills and the plot.',
          '**Load test data** fills in a small example.'],
        ref: [['Detected automatically', 'The target columns, and the assay, cell line and time point read from the file name and header.'],
          ['Open from Echo Dose Response', 'Reads Echo’s fitted History. A curve Echo flagged as having no effect is shown as n.d., and a midpoint beyond the doses tested as a bound — not as the number that was fitted.'],
          ['Bounds', 'A potency written `> 10000` is a bound: the compound did not reach half-effect within the doses tested. It is kept as a bound through the table, the detail card, the CSV and the plot (a hollow triangle), and can never pass an “at most” limit.']],
        watch: [{ k: 'tip', t: 'A potency of 0, or an empty cell, is treated as no data — never as the best potency in the table.' }],
        steps: [
          { sel: '#load-dz', t: 'Drop a screen', place: 'bottom',
            b: 'Drop an Excel summary here — a row per compound, DC50 and Dmax per target. Targets, cell line and time are detected from it. **Template** shows the layout.' },
          { sel: '.btn-load-test', t: 'From Echo, or an example', place: 'bottom',
            b: '**Open from Echo Dose Response** lists the analyses Echo has fitted, synced across your devices. **Load test data** fills in a small example.' },
          { deep: true, sel: function(){ var q = document.getElementById('q-dmax'); return q && q.parentNode && q.parentNode.parentNode; }, t: 'What “good” means', place: 'top',
            b: '**Dmax ≥** and **DC50 ≤** decide the **Good** badge, the quality pills and the colour in the plot. Change them to match your own cut-off.' }] },

      { id: 'table', label: 'Table', sel: tabEl(1), go: to('table'), needs: 'data',
        lead: 'Every compound with its DC50 and Dmax against each target. Filter to what matters, open a row for the detail, and export the table as a picture or a CSV.',
        do: ['**Search** by name, drag the **Dmax ≥** and **DC50 ≤** sliders, or press the **quality pills** (Good · Moderate · Weak). **Hide no-data** drops rows with nothing measured.',
          'Choose the **unit** (nM, µM, M) and the **scale** (log₁₀, linear, pDC50) for the potency column.',
          'Click a column header to sort; click a row to open its **detail card**.',
          'Export: **PNG** on a white, black or transparent background (W / B / T), or **CSV** of what is filtered.'],
        ref: [['DC50 (nM) · Dmax (%)', 'Per target. DC50 is shown with its SD (“3.4 ± 0.8”); Dmax as a whole percentage.'],
          ['Good · Moderate · Weak', 'Good: Dmax and DC50 both inside your thresholds. Weak: neither. The pills filter the table.'],
          ['n.d. and bounds', '“n.d.” means no half-effect midpoint; “>” / “<” means the midpoint was beyond the doses tested.']],
        steps: [
          { sel: '#panel-table .controls', t: 'Filter to what matters', place: 'bottom', miss: MISS,
            b: 'Search, **Dmax ≥** and **DC50 ≤** sliders, the unit and scale of the potency, and the **quality pills** — Good, Moderate, Weak. The badge counts what is left.' },
          { sel: '#table-capture', t: 'One row per compound', place: 'top', miss: MISS,
            b: 'DC50 with its SD and Dmax for each target. **Click a header** to sort and **a row** for its detail card. Export it as a PNG on white, black or transparent, or as a CSV.' }] },

      { id: 'scatter', label: 'DC50 vs Dmax', sel: tabEl(2), go: to('scatter'), needs: 'data',
        lead: 'The screen as one picture: potency along the bottom (log scale), effect up the side, a colour per target. Compounds that are potent and deep sit top-left.',
        do: ['Switch **targets** on and off at the top; search a compound to highlight it.',
          'Use the same sliders and pills as the table to focus on a subset.',
          '**Zones** shade the quadrants — Hit, Active/Impotent, Partial, Inactive — at your thresholds; **Error bars** shows the SD; **Labels** names the points.',
          'Hover a point for a tooltip (with the structure, if SMILES are loaded). Export a PNG on a white, black or transparent background.'],
        ref: [['Axes', 'X: DC50 (nM, log scale by default — or linear, or pDC50). Y: Dmax (%).'],
          ['Zones', 'Top-left **Hit**: potent and deep. Top-right **Active/Impotent**: deep but weak. Bottom-left **Partial**: potent but shallow. Bottom-right **Inactive**: neither.'],
          ['Hollow triangle', 'A bound: the true potency is beyond the doses tested.']],
        steps: [
          { sel: '#scatter-chart', t: 'Potency against effect', place: 'top', miss: MISS,
            b: 'One point per compound and target — DC50 along the bottom, Dmax up the side. **Top-left is potent and deep.** Hover for the numbers; a hollow triangle is a bound.' },
          { deep: true, sel: '#panel-scatter .scatter-controls', t: 'Targets, zones, error bars', place: 'bottom', miss: MISS,
            b: 'Switch targets on and off, filter with the sliders, and **Zones** shades the quadrants, **Error bars** adds the SD and **Labels** names the points.' }] },

      { id: 'props', label: 'Properties', sel: tabEl(3), go: to('props'), tag: 'needs a SMILES file',
        lead: 'Molecular properties beside the assay values. Upload a SMILES file and Dora draws each structure and computes its properties.',
        do: ['Drop a CSV or Excel file with **Compound** and **SMILES** columns.',
          'Read the table: 2D structure, MW, logP, HBA, HBD, TPSA and rotatable bonds, next to each compound’s DC50 and Dmax from the loaded screen.',
          'Structures also appear in the tooltips of the plot.'],
        watch: [{ k: 'warn', t: 'Structures use RDKit, fetched from the internet the first time — so this one panel needs a connection; nothing else in Dora does. Nothing you load leaves your machine.' }],
        steps: [{ sel: '#props-dz', t: 'Add structures', place: 'bottom',
          b: 'Drop a CSV or Excel file with **Compound** and **SMILES** columns. Dora draws each structure and computes MW, logP, HBA, HBD, TPSA and rotatable bonds.' }] }
    ],
    words: [
      ['DC50', 'The concentration giving half of the maximal degradation.'],
      ['Dmax', 'The maximal degradation reached, as a percentage.'],
      ['pDC50', '−log₁₀ of the DC50 in M: bigger is more potent.'],
      ['Good', 'Dmax ≥ your Dmax threshold and DC50 ≤ your DC50 threshold.'],
      ['n.d.', 'No midpoint — the curve barely moved.'],
      ['Bound (> or <)', 'The midpoint is beyond the doses tested; the number is a limit, not a measurement.'],
      ['Zones', 'Hit · Active/Impotent · Partial · Inactive: the quadrants of the DC50–Dmax plot.']],
    faq: [
      ['A compound shows no data', 'Nothing was measured for it on that target — often a vehicle row. **Hide no-data** removes it from the table.'],
      ['A potency has a “>” in front of it', 'Its midpoint was beyond the highest dose tested. It stays a bound everywhere and is never counted as better than a measured value.'],
      ['The structures are missing', 'Structures need RDKit from the internet the first time. Offline, the Properties tab and the structure tooltips are unavailable; everything else works.'],
      ['The file does not load', 'Dora reads an Excel workbook with one row per compound and a DC50 and Dmax column per target. **Template** downloads the layout.']],
    keys: [['Click a header', 'Sort the table'], ['Click a row', 'Open its detail card']]
  });
})();
