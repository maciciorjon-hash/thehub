// Beacon: the data analysis of NanoBRET — PHERAstar plate in, mBRET for every well, the controls it was read against, Z′, dose-response.
(function(){
  var setupOpen = function(){ var m = document.getElementById('setup-modal'); return !!(m && !m.classList.contains('hidden')); };
  var closeSetup = function(){ if (setupOpen()) closeSetupModal(); };
  var setupGo = function(sub){ return function(){ if (!setupOpen()) openSetupModal(); switchSetupTab(sub); }; };
  var tabGo = function(id){ return function(){ closeSetup(); switchTab(id); }; };
  var tabSel = function(id){ return '.tab[data-tab="' + id + '"]'; };
  var MISS = 'This fills in once a plate is loaded.';
  var MISS_CTRL = 'This fills in once you have marked the control wells on the plate map.';
  tourRegister({
    id: 'beacon', name: 'Beacon',
    blurb: 'Beacon reads a **NanoBRET plate** from the PHERAstar: the mBRET of every well, the controls it was read against, assay quality (Z′), and a dose-response fit. The default flow is a protein–protein interaction: drop the Excel export, mark the controls on the plate, and read the ratios.',
    where: function(){ if (setupOpen()) { var a = document.querySelector('.setup-stab.active'); return 'setup-' + (a ? a.getAttribute('data-tab') : 'files'); } return activeTab; },
    data: { label: 'Load the demo plate', has: function(){ return !!(state.donor && state.acceptor); }, load: function(){ closeSetup(); loadTestData('gain'); } },
    intro: [{ t: 'Welcome to Beacon',
      b: 'A **PHERAstar export** goes in; **mBRET for every well**, the controls it was read against, Z′ and a dose-response fit come out. About a minute; **Esc** leaves it at any point.',
      nodata: 'Most of the app needs a plate to show anything. The demo plate is a synthetic gain-of-signal run — loaded only if you press the button.' }],
    outro: [{ t: 'Come back any time', sel: tabSel('guide'), place: 'bottom', go: tabGo('guide'),
      b: 'The **Guide** tab has the workflow, how to read Z′, the dose-response and tracer fits, and what to do when a number looks off — with a tour of each tab.' }],
    quick: [
      'Open **Setup** (it opens by itself). On **Files**, drop the PHERAstar `.xlsx` — plate format and the donor and acceptor channels are found for you.',
      'On **Assay Info**, choose **Gain-of-Signal** (two interacting proteins) or **Tracer Displacement** (one protein and a tracer).',
      'On **Plate Map**, paint the roles: the controls — no HaloTag ligand, donor only, acceptor only, no substrate, mock — and, for a dose series, compound groups with their concentrations.',
      '**Plate** shows mBRET for every well; **Controls** shows the donor and acceptor counts of each control; **Endpoint / QC** gives Z′.',
      '**Dose-Response** fits the series; **Report** gathers everything and downloads the Excel workbook.'],
    tabs: [
      { id: 'setup-files', label: 'Setup › Files', tag: 'Setup', sel: '.setup-stab[data-tab="files"]', go: setupGo('files'), head: false,
        lead: 'Where the data comes in. Setup opens by itself while there is nothing loaded, and comes back any time with the **Setup** button.',
        do: ['Drop the **PHERAstar `.xlsx`** export on the box, or click it. Beacon reads the “Table End point” sheet directly.',
          'The **plate format** (96 or 384) and the **donor and acceptor channels** are found for you — a long-pass filter is the acceptor, a band-pass filter the donor. The “Protocol Information” sheet fills the assay details.',
          'Choose how to use it: **Full workflow** (assay mode, plate map, QC, dose-response) or **Just show ratios**.',
          'For another reader: **Or import donor/acceptor CSVs separately** lets you pick the format and load two plate-shaped CSVs (donor at 460 nm, acceptor at 618 nm).'],
        watch: [{ k: 'tip', t: 'Assay Info and Plate Map stay greyed until the step before them is done — they need the plate first.' }],
        steps: [{ sel: '#phera-drop', t: 'Drop the PHERAstar file', place: 'right',
          b: 'The Excel export goes here. Beacon reads the “Table End point” sheet, finds the plate format and tells the **donor** from the **acceptor** channel by their filters. No manual set-up.' }] },

      { id: 'setup-assay', label: 'Setup › Assay Info', tag: 'Setup', sel: '.setup-stab[data-tab="assay"]', go: setupGo('assay'), head: false,
        lead: 'What kind of experiment the plate is. It decides which roles can be painted and how the dose-response is fitted.',
        do: ['**Gain-of-Signal** — two proteins of interest; signal rises with the interaction. The 4-parameter fit direction follows whatever the dose series actually does.',
          '**Tracer Displacement** — one NanoLuc-fused protein and a fluorescent tracer; a test compound displaces the tracer and the signal falls. It adds a **Tracer** role and the **Tracer Titration** tab.'],
        watch: [{ k: 'tip', t: 'For a protein–protein interaction choose Gain-of-Signal. Choosing Tracer Displacement later reveals the extra role and tab; switching back hides them.' }],
        steps: [{ sel: '#setup-pane-assay', t: 'Gain-of-Signal or Tracer Displacement', place: 'right',
          b: '**Gain-of-Signal** is for two interacting proteins: signal rises with the interaction. **Tracer Displacement** is one protein and a tracer a compound pushes off: signal falls, and Ki can be worked out.',
          miss: 'This opens once a plate is loaded on Files.' }] },

      { id: 'setup-platemap', label: 'Setup › Plate Map', tag: 'Setup', sel: '.setup-stab[data-tab="platemap"]', go: setupGo('platemap'), head: false,
        lead: 'What each well is. Pick a role from the list, then click, or click and drag, across wells to paint them.',
        do: ['**Background** and **DMSO** are paint-and-go: they join one shared pool as you paint.',
          'Mark the **NanoBRET controls**: no HaloTag ligand, donor only, acceptor only, no substrate and mock transfection.',
          'Each **Compound** (or **Tracer**) drag creates one new dose point with its own colour and an inline **concentration** field — drag again for another concentration.',
          '**Clear** empties the role you are painting.'],
        ref: [['No HaloTag ligand', 'The same transfection with the ligand left out: it reads donor bleed-through into the acceptor channel, and is what the **corrected** mBRET subtracts.'],
          ['Donor only · Acceptor only', 'Cells with one fusion partner: what the donor and the acceptor read on their own.'],
          ['No substrate · Mock', 'Cells with no luciferase substrate, and cells with no plasmid: the background of the read.']],
        steps: [
          { sel: '#platemap-grid-wrap', t: 'Paint what the wells are', place: 'right',
            b: 'Pick a role on the right, then **click or drag** across wells. Controls are flat lists of wells; each compound drag makes a new dose point with its own concentration.',
            miss: 'This opens once the assay mode is chosen.' },
          { deep: true, sel: '#pm-ctrl-roles', t: 'The five controls', place: 'left',
            b: '**No HaloTag ligand**, **donor only**, **acceptor only**, **no substrate** and **mock**. The Controls tab plots each, and no-HaloTag-ligand wells are what the corrected mBRET subtracts.',
            miss: 'This opens once the assay mode is chosen.' }] },

      { id: 'plate', label: 'Plate', sel: tabSel('plate'), go: tabGo('plate'), needs: 'data',
        lead: 'Every well of the plate as **mBRET** — the acceptor over the donor, times 1000 — drawn as a heatmap so a bad row, column or edge is obvious.',
        do: ['Choose **Corrected mBRET** or **Raw mBRET**. Corrected subtracts the mean of the no-HaloTag-ligand wells; with none painted, it shows raw and says so.',
          '**Mark controls…** takes you to the Plate Map. **Download Excel** writes every well — donor, acceptor, raw and corrected mBRET, and which control it is.'],
        ref: [['mBRET (mBU)', '(acceptor ÷ donor) × 1000. A well whose donor or acceptor is missing or zero has no ratio — it is blank, never 0.'],
          ['Corrected', 'Raw minus the mean raw mBRET of the no-HaloTag-ligand control, which carries the donor bleed-through into the acceptor channel.']],
        steps: [{ sel: '#plate-pane-wrap', t: 'mBRET for every well', place: 'top', miss: MISS,
          b: 'Acceptor ÷ donor × 1000, as a heatmap. **Corrected** subtracts the no-HaloTag-ligand wells; if none are painted it shows raw and says so. **Mark controls…** takes you to the plate map.' }] },

      { id: 'controls', label: 'Controls', sel: tabSel('controls'), go: tabGo('controls'), needs: 'data',
        lead: 'The donor and acceptor counts of each control you painted — to see whether the donor fired at all and whether the acceptor channel is clean.',
        do: ['Mark the controls on the plate map first.',
          'Read the **bar graph**: donor beside acceptor for every control that has wells, raw counts on one shared axis from zero, with SD whiskers and the number of wells.',
          'Read the **table** under it: the same numbers and each control’s raw mBRET.'],
        ref: [['Raw counts, not ratios', 'A ratio hides what you check here: whether the luciferase signal is there at all (no substrate, mock) and whether the acceptor channel is clean.']],
        steps: [{ sel: '#controls-pane-wrap', t: 'Did the controls behave?', place: 'top', miss: MISS_CTRL,
          b: 'Donor beside acceptor for each control, in raw counts on one axis. **No substrate** and **mock** should be near zero; **donor only** should have no acceptor signal.' }] },

      { id: 'qc', label: 'Endpoint / QC', sel: tabSel('qc'), go: tabGo('qc'), needs: 'data',
        lead: 'How good the assay is: Z′ from the spread between a positive and a negative condition.',
        do: ['Painting **Background** and **DMSO** on the plate map creates a read-only “Background (Plate Map)” / “DMSO (Plate Map)” pair here, already paired — nothing to set up in the standard case.',
          'Read **Z′** for each pair. For anything unusual — a second background group — **+ Add custom condition (advanced)** takes a well range (`A1-A3`, `A1:B3` or `A1,B2,C3`) and a background to pair with.'],
        ref: [['Z′', '1 − [3×SD(+ligand) + 3×SD(no ligand)] ÷ |mean(+ligand) − mean(no ligand)|.'],
          ['Z′ ≥ 0.5', 'Excellent separation; the assay is reliable.'],
          ['Z′ 0 – 0.5', 'Marginal — usable but noisy.'],
          ['Z′ < 0', 'The two populations overlap too much to trust.']],
        steps: [{ sel: '#qc-auto-wrap', t: 'Z′ from the plate map', place: 'bottom', miss: MISS,
          b: 'Background and DMSO wells painted on the plate map become a ready-made pair here. **Z′ ≥ 0.5** is an excellent assay, 0–0.5 marginal, below 0 untrustworthy.' }] },

      { id: 'dose', label: 'Dose-Response', sel: tabSel('dose'), go: tabGo('dose'), needs: 'data',
        lead: 'A 4-parameter fit of the dose series you painted — IC50 or EC50 against log concentration, rising or falling as the assay mode says.',
        do: ['The series comes straight from the Plate Map: painted Background wells are the baseline subtracted from every dose point, and each Compound group with a concentration is one point.',
          'With at least **4 compound groups** that have a concentration, press **Compute fit**. Error bars are the SD across replicate wells.',
          'A painted **DMSO** group is drawn as a vehicle reference point but is not in the fit.'],
        ref: [['R² under ~0.7', 'A red badge: the fit is unreliable — check for missing wells, a Background group that does not match the dose plate, or too few groups across the inflection.'],
          ['Ki (Tracer Displacement)', 'Computed once the tracer titration has given the tracer Kd: Ki = IC50 ÷ (1 + [T]/Kd), the Cheng–Prusoff equation.']],
        steps: [{ sel: '#dose-summary-wrap', t: 'The dose series, from the plate map', place: 'bottom', miss: MISS,
          b: 'Each painted compound group with a concentration is a point. With at least four, press **Compute fit** for a 4-parameter curve and the IC50 or EC50.' }] },

      { id: 'tracer', label: 'Tracer Titration', tag: 'displacement only', sel: tabSel('tracer'), go: tabGo('tracer'), full: false,
        skip: function(){ var t = document.querySelector('.tab[data-tab="tracer"]'); return !t || t.style.display === 'none'; },
        lead: 'Shown only for Tracer Displacement. It fits the tracer series you painted to a one-site binding curve and gives the tracer’s Kd — and a working concentration for the displacement assay.',
        do: ['Paint the **Tracer** role as a dose series on the plate map.',
          'Press **Compute fit**: signal = Bmax × [tracer] ÷ (Kd + [tracer]); the Kd is marked with a dashed line.',
          'Use the suggested **working tracer concentration** (at Kd, 50 % of Bmax) or type your own; the Ki on Dose-Response updates as you do.'],
        ref: [['Why tracer ≤ Kd', 'At [T] = Kd the measured IC50 is exactly 2 × Ki — a well-tolerated 2-fold difference. A much higher tracer (say 4 × Kd) inflates the IC50 about 5-fold and makes compounds look weaker than their true Ki.']],
        steps: [{ sel: '#tracer-summary-wrap', t: 'The tracer’s Kd', place: 'bottom', miss: 'This tab appears when the assay mode is Tracer Displacement.',
          b: 'A one-site binding fit of the tracer series gives its **Kd** and a working concentration at Kd. The Ki on the Dose-Response tab uses it.' }] },

      { id: 'report', label: 'Report', sel: tabSel('report'), go: tabGo('report'), needs: 'data',
        lead: 'Everything about this run in one place, and the workbook that carries it out.',
        do: ['Read the summary: assay mode, where the plate data came from, QC and dose-response results and, for Tracer Displacement, the titration.',
          'Press **Download Excel report**: Results, Plate Map, Assay Protocol, PHERAstar Protocol (when a PHERAstar file was loaded) and **Prism Copy** — a paste-ready table for GraphPad Prism.'],
        steps: [{ sel: '#report-panel', t: 'The run on one page', place: 'top', miss: MISS,
          b: 'Assay mode, data source, QC and the fit. **Download Excel report** writes Results, Plate Map, the protocols and a Prism-ready table.' }] }
    ],
    words: [
      ['mBRET (mBU)', 'milliBRET units: (acceptor ÷ donor) × 1000 — the raw ratio on a more convenient scale.'],
      ['NanoBRET', 'Energy transfer between a NanoLuc donor (about 460 nm) and a HaloTag acceptor labelled with a fluorescent ligand (about 618 nm). Interaction raises the 618:460 ratio.'],
      ['Corrected mBRET', 'The ratio minus the donor bleed-through measured in the no-HaloTag-ligand wells.'],
      ['Z′', 'Assay quality from the spread of two controls. ≥ 0.5 is excellent.'],
      ['Gain-of-Signal', 'The signal rises with the interaction (two proteins of interest).'],
      ['Tracer Displacement', 'A compound displaces a fluorescent tracer and the signal falls.'],
      ['Kd · Ki', 'The tracer’s dissociation constant, and the compound’s binding constant after the Cheng–Prusoff correction.']],
    faq: [
      ['Assay Info and Plate Map are greyed out', 'They need the step before them: load the plate on Files, then choose an assay mode.'],
      ['“Correcting needs wells marked no HaloTag ligand”', 'Corrected mBRET subtracts that control. Paint it on the Plate Map (Mark controls…), or read the raw mBRET.'],
      ['Compute fit does nothing', 'It needs at least four compound groups with a concentration. Paint them on the Plate Map and type each concentration in its chip.'],
      ['R² is red', 'The fit is unreliable. Check for a missing well, a Background group that does not belong to this plate, or too few points around the inflection.'],
      ['A well is blank', 'Its donor or acceptor reading is missing or zero, so there is no ratio — it is never shown as 0.'],
      ['Which reader files work?', 'PHERAstar `.xlsx` exports are read directly. For anything else, import donor and acceptor as two plate-shaped CSVs.']],
    keys: [['Click · drag', 'Paint wells on the plate map']]
  });
})();
