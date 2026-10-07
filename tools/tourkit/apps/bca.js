// BCA: from a plate-reader read of a BCA protein assay to how much water each sample needs. (The Hub calls it "spectra".)
(function(){
  var wf = function(){ switchTab('standards'); };
  var prep = function(name){ return function(){ switchTab('standards'); switchPrepTab(name); }; };
  var MISS_PLATE = 'This appears once a plate is imported. Paste one into the grid, or load the test data.';
  var MISS_CURVE = 'This appears once the standards are painted and a curve is fitted.';
  var MISS_SAMPLES = 'This appears once the standard curve is fitted and samples are painted.';
  tourRegister({
    id: 'bca', name: 'BCA',
    blurb: 'BCA turns the plate-reader absorbance of a **BCA protein assay** into concentrations: paste the plate, mark the BSA standards to fit a curve, mark your samples, and it tells you **how much sample and water** to bring every sample to the same concentration.',
    where: function(){ var t = document.querySelector('.tab.active'); return t && t.getAttribute('data-tab') === 'guide' ? 'guide' : 'workflow'; },
    data: { label: 'Load the test data', has: function(){ var r = document.getElementById('import-results'); return !!(r && r.offsetParent !== null); }, load: function(){ switchTab('standards'); loadTestData(); } },
    intro: [{ t: 'Welcome to BCA',
      b: 'Paste the plate, paint the standards and the samples, and read off **how much sample and water** each one needs. It is one page, top to bottom: each section opens when the one above it is done. About a minute; **Esc** leaves it at any point.',
      nodata: 'Everything below the plate needs a plate to show anything — the test data is a finished synthetic plate, loaded only if you press the button.' }],
    outro: [{ t: 'Come back any time', sel: '.tab[data-tab="guide"]', place: 'bottom', go: function(){ switchTab('guide'); },
      b: 'The **Guide** tab keeps the workflow, the R² table and the formulas in writing, with a tour of each section.' }],
    quick: [
      'Open your reader’s export in Excel, copy the **8 × 12** block of absorbances, click **A1** on the grid and paste. Press **Use this data**.',
      '**Standards:** drag across each duplicate pair of BSA wells and type its known concentration; pick Linear or Quadratic.',
      '**Sample prep › Setup:** drag across each sample’s duplicate wells and name it; set the default dilution.',
      '**Sample prep › Results:** set a target concentration and volume. The table says how much sample and water each one needs.',
      '**Export workbook**, or **Send to Labbook** from inside dHUB.'],
    tabs: [
      { id: 'workflow', label: 'Workflow', sel: '.tab[data-tab="standards"]', go: wf,
        lead: 'Everything happens on one page, top to bottom. Each section unlocks when the one above it is done — import, standards, samples, results.',
        do: ['Work down the page: **Import → Standards → Sample prep › Setup → Sample prep › Results**.',
          'Painting works the same way everywhere: **drag** across a duplicate pair of wells to create one point.',
          'Click an already-painted well **once** (no drag) to leave it out of its average; click again to bring it back.'],
        watch: [{ k: 'tip', t: 'If a section says “import a plate first” or “fit a standard curve above first”, it is waiting for the section above it — follow the page from the top.' }],
        steps: [{ sel: '#panel-standards', t: 'One page, top to bottom', place: 'right', miss: MISS_PLATE,
          b: 'Plate, then standards, then samples, then results. Each section opens when the one above is done, so there is always one obvious next step.' }] },

      { id: 'import', label: 'Workflow › Import the plate', tag: 'Import', sel: ['#import-results', '#paste-fallback'], go: wf, head: false,
        lead: 'Works with any plate reader. The values are pasted — not uploaded — so any export that gives you an 8 × 12 block of absorbance works.',
        do: ['Open the reader’s own export in Excel and **copy an 8 × 12 range** of absorbance values, no headers.',
          'Click cell **A1** on the grid at the top of the Workflow tab and paste (`⌘V` / `Ctrl+V`). You can also type values by hand.',
          'Press **Use this data**. The plate is drawn as a heatmap so a bad row or column shows at once.'],
        ref: [['Load test data', 'Fills in a synthetic demo plate — standards, samples and one deliberately bad replicate — so you can see every step working.'],
          ['Export CSV · Clear', 'On the imported plate: the raw values as a file, or start again with another plate.']],
        watch: [{ k: 'warn', t: 'Importing a new plate resets any standards or samples you have painted. Finish one plate’s analysis — or export it — before loading the next.' }],
        steps: [{ sel: ['#import-results', '#paste-fallback'], t: 'Import the plate', place: 'bottom',
          b: 'Copy an **8 × 12** block of absorbances from your reader’s export, click **A1** here and paste, then **Use this data**. The plate is drawn as a heatmap so a bad row stands out.' }] },

      { id: 'standards', label: 'Workflow › Standards', tag: 'Standards', sel: '#standards-body', go: wf, head: false,
        lead: 'Standards are BSA wells of known concentration, and they are what the curve is built from.',
        do: ['**Drag** across a technical-duplicate pair of wells to create one standard point, then type its known concentration (µg/µL) in the list on the right.',
          'Include a **blank** (0 µg/µL) — it anchors the curve.',
          'To leave out an overflowing or odd well, **click it once** (no drag). It stays visibly assigned — dimmed with a ✕ — so the record of what happened is not lost.',
          'Choose the fit above the curve: **Linear** or **Quadratic** (needs at least three points).'],
        ref: [['Linear vs quadratic', 'BCA is genuinely nonlinear over a wide range: a straight line biases interpolated concentrations, especially near the top. Use Quadratic unless your standards span a narrow, clearly linear range.'],
          ['R² > 0.99', 'Excellent — proceed with confidence.'],
          ['R² 0.95 – 0.99', 'Acceptable — consider excluding a borderline replicate.'],
          ['R² < 0.95', 'Poor — check pipetting, reagent freshness or a mistyped concentration.']],
        steps: [
          { sel: '#standards-grid-wrap', t: 'Paint the BSA standards', place: 'right', miss: MISS_PLATE,
            b: '**Drag across each duplicate pair** of standard wells, then type its known concentration in the list. Click a painted well once to leave it out of the average.' },
          { deep: true, sel: '#sc-canvas', t: 'The standard curve', place: 'left', miss: MISS_CURVE,
            b: 'Absorbance against concentration, with the fit through it. The R² badge and the equation below say how well it fits; an unusual R² usually means a bad well or a mistyped concentration.' },
          { deep: true, sel: '#sc-fit', t: 'Linear or quadratic?', place: 'bottom', miss: MISS_CURVE,
            b: 'BCA is nonlinear across a wide range, so **Quadratic** usually follows the standards better. Linear is fine when they span a narrow, clearly linear range.' }] },

      { id: 'samples', label: 'Workflow › Samples', tag: 'Sample prep', sel: '#prep-body', go: prep('setup'), head: false,
        lead: 'Paint each sample’s duplicate-well pair the same way as the standards and name it. Its concentration comes from the standard curve, corrected for how much it was diluted.',
        do: ['Under **Sample prep › Setup**, drag across a duplicate pair to create one sample, and give it a name.',
          'Set the **Default dilution ×** — how much each sample was diluted before it went on the plate. Override it on a single sample only if that one was prepared differently.',
          'A sample using the default reads “10× (default)”, so it is always clear which ones were set on purpose.'],
        ref: [['Assay-well concentration', 'The standard curve inverted at the sample’s mean absorbance.'],
          ['Final concentration', 'Assay-well concentration × the dilution factor.'],
          ['Extrapolated', 'The result is outside the standards’ concentration range — treat it with caution, or dilute the sample and run it again.'],
          ['“Only 1 well”', 'One replicate was excluded as a QC call, so the “average” is really a single read.']],
        steps: [
          { sel: '#samples-grid-wrap', t: 'Paint your samples', place: 'right', miss: MISS_CURVE,
            b: 'Drag across each sample’s duplicate wells and give it a name. A sample outside the range of the standards is flagged **Extrapolated**.' },
          { deep: true, sel: '#master-dilution', t: 'Default dilution', place: 'bottom', miss: MISS_CURVE,
            b: 'How much every sample was diluted **before** it went on the plate. The final concentration is corrected for it. Override one sample only if it was prepared differently.' }] },

      { id: 'results', label: 'Workflow › Results', tag: 'Sample prep', sel: '#prep-body', go: prep('results'), head: false,
        lead: 'Set one target concentration and volume. Every sample is diluted with water to it, and the table says exactly how.',
        do: ['In **Sample prep › Results**, type the **target concentration** (µg/µL) and **volume** (µL) — for a Western, the loading you want in every lane.',
          'Read the table: concentration, how much **sample** and how much **water** to pipette for each.',
          '**Export workbook** (Excel) or **Export CSV** for the table; inside dHUB, **Send to Labbook** puts the concentrations and loading volumes on an experiment’s Results tab.'],
        ref: [['Protein (µL)', 'target concentration × target volume ÷ final concentration.'],
          ['Water (µL)', 'target volume − protein volume.'],
          ['Too dilute', 'A sample already more dilute than the target cannot be concentrated by adding water. It is flagged instead of showing a negative water volume.']],
        steps: [
          { sel: '#norm-target-conc', t: 'One target for every sample', place: 'right', miss: MISS_SAMPLES,
            b: 'Type the concentration and volume you want in every lane. Each sample is diluted with water to that, from its final concentration.' },
          { sel: '#samples-table', t: 'How to prepare each sample', place: 'top', miss: MISS_SAMPLES,
            b: 'Concentration, then the **sample** and **water** volumes. A sample that is already more dilute than the target is flagged “too dilute” rather than given a negative volume.' },
          { deep: true, sel: function(){ return [].slice.call(document.querySelectorAll('#prep-panel-results .btn')).filter(function(b){ return /workbook/i.test(b.textContent); })[0]; }, t: 'Take it with you', place: 'top', miss: MISS_SAMPLES,
            b: '**Export workbook** for Excel, **Export CSV** for the table, and inside dHUB **Send to Labbook** puts concentrations and loading volumes on an experiment.' }] }
    ],
    words: [
      ['BSA standard', 'Bovine serum albumin at a known concentration — the points the curve is built from.'],
      ['Standard curve', 'Absorbance against known concentration, fitted linear or quadratic, then inverted to read samples.'],
      ['R²', 'How well the curve fits the standards. Above 0.99 is excellent; below 0.95 is poor.'],
      ['Dilution', 'How much a sample was diluted before it went on the plate.'],
      ['Final concentration', 'The concentration of the undiluted sample: assay-well concentration × dilution.'],
      ['Extrapolated', 'Outside the range of the standards.'],
      ['Target', 'The concentration and volume every sample is brought to.']],
    faq: [
      ['The sections say “import a plate first”', 'Each section needs the one above it. Standards appear after a plate is imported, and Sample prep after a standard curve is fitted.'],
      ['My R² is low', 'Look for a replicate that is far from its pair — click it once to leave it out — or a mistyped concentration. If the standards span a wide range, try Quadratic.'],
      ['A sample is “Extrapolated”', 'Its absorbance is outside the standards. Dilute it and re-run, or extend the standards.'],
      ['A sample is “too dilute”', 'It is already below the target concentration; water cannot concentrate it. Lower the target or load more volume.'],
      ['I imported another plate and lost my samples', 'Importing resets what you painted. Finish and export one plate before loading the next.'],
      ['Does it need a particular plate reader?', 'No. Any export that gives an 8 × 12 block of absorbances can be pasted.']],
    keys: [['⌘V / Ctrl+V', 'Paste the plate into the grid (click A1 first)'], ['Click a painted well', 'Leave it out of its average — again to bring it back'], ['Drag', 'Paint a duplicate pair as a standard or a sample']]
  });
})();
