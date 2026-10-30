// Tempo: kinetic degradation and the time course of a protein level — from the reads of a plate to the parameters.
(function(){
  var tabEl = function(n){ return function(){ return document.querySelector('#tp-tabs [data-tab="' + n + '"]'); }; };
  var to = function(n){ return function(){ tpTab(n); }; };
  var MISS = 'This fills in once a plate is loaded.';
  tourRegister({
    id: 'tempo', name: 'Tempo',
    blurb: 'Tempo reads the **time course of a plate** — a live-cell HiBiT kinetic of a degrader, or the level of a protein over time — normalises it, fits it, and gives the numbers: DC50 and Dmax, the rate constant K and its efficiency, or the largest change, its time and where it settles.',
    where: function(){ return (window.TP && TP.ui && TP.ui.tab) || 'plate'; },
    data: { label: 'Load an example plate', has: function(){ return !!(window.TP && TP.plates && TP.plates.length); }, load: function(){ tpLoadExample('degradation'); } },
    intro: [{ t: 'Welcome to Tempo',
      b: 'Load a plate of reads over time and Tempo normalises it the way ProNect does, fits every concentration, and reports **two analyses side by side** — or, for a protein level over time, what changed, when and how far. About a minute; **Esc** leaves it at any point.',
      nodata: 'The other tabs need a plate to show anything. The button loads a small made-up one (two plates, ten kinds of curve) — only if you press it.' }],
    outro: [{ t: 'Come back any time', sel: tabEl('guide'), place: 'bottom', go: to('guide'),
      b: 'The **Guide** tab has each tab in writing, with a tour of each, and what to do when a number looks odd.' }],
    quick: [
      'On **Plate**, choose the experiment — **Kinetic degradation** or **Time course** — then **Set up a plate**, **Choose files** (ProNect or GloMax) or **Load an example plate**.',
      'Say which wells are the vehicle (or control), the background and the compounds, and give the doses. **Setup** does it step by step.',
      'In **Results**, read the table: DC50 and Dmax, and the rate constant K with its efficiency. **Fit detail** adds the interval and R².',
      'In **Curves**, look at each compound — click a read to leave it out, and the fit is redone for that compound alone.',
      'In **Compare**, rank compounds, or plot one measure against another; **Export** writes the workbook, Prism tables or the ProNect-compatible files.'],
    tabs: [
      { id: 'plate', label: 'Plate', sel: tabEl('plate'), go: to('plate'),
        lead: 'The plate as it was read: which well is what, and the reads of each. Two experiments share it: a kinetic degradation and a time course.',
        do: ['Pick the experiment on the two cards (or the **Experiment** switch once a plate is open).',
          '**Setup** walks through Reads · Time · Controls · Compounds · Review. On **Controls**, drag a box over the plate to mark Vehicle, Background, Blank or Left out.',
          'Or drop a ProNect export (`normalized_data.json` with `raw_kinetic.csv`) or a GloMax time-course file; the layout travels with a ProNect file.',
          'Doses can be molar (nM) or by mass (ng/mL, µg/mL, mg/mL) — mass is for a time course.'],
        ref: [['Vehicle', 'The wells everything is divided by (DMSO). In a time course they are the **control**.'],
          ['Background', 'Wells with no signal of their own; their mean is subtracted at every read.'],
          ['Blank', 'Marked, not subtracted — ProNect does not subtract them.'],
          ['n.d. reads', 'A blank or `OVRFLW` reading is missing, never 0.']],
        watch: [{ k: 'tip', t: 'The plate, its layout, the left-out wells and the normalisation are shared by both experiments; switching one for the other never changes a kinetic number.' }],
        steps: [{ sel: '#pane-plate', t: 'The plate', place: 'top', miss: MISS,
          b: 'Each well shows its role and, hover for the reads. **Setup** is the guided way in; the plate itself is editable.' }] },

      { id: 'results', label: 'Results', sel: tabEl('results'), go: to('results'), needs: 'data',
        lead: 'One row per compound: the potency and depth of degradation (Analysis A) and the rate and efficiency (Analysis B), with what the plate itself was worth.',
        do: ['Read **DC50 (Dmax50)** and **Dmax**, then **KDegMax**, **KDeg50** and their efficiency; sort by clicking a header.',
          'Press **Fit detail** to add the 95 % interval of the DC50 and the R² of the Dmax fit.',
          'Check **Plate quality** below: vehicle against background (Z′), and how steady the vehicle was through the run.',
          'The card **How this was calculated** is the method, written from the settings in force — it follows them when you change one.'],
        ref: [['DC50 (Dmax50)', 'The concentration giving half of Dmax, from the plateau of each concentration against dose.'],
          ['Dmax', 'The depth of degradation: 1 − plateau, in %.'],
          ['KDegMax, KDeg50', 'K against concentration follows K = KDegMax·c/(KDeg50 + c): how fast at most, and at what concentration half of that.'],
          ['Bound (> ≥ <)', 'A potency beyond the doses tested, or a plateau not reached, is written as a bound and never as a plain number.'],
          ['Z′', 'Plate quality from the vehicle and the background: ≥ 0.5 excellent, 0–0.5 marginal, below 0 they overlap.']],
        steps: [
          { sel: '#tp-restbl', t: 'Both analyses', place: 'top', miss: MISS, b: 'One row per compound. A bound is written as such and “n.d.” is a curve that does not move enough to have a midpoint. Click a row to open its curves.' },
          { deep: true, sel: '#tp-method', t: 'How this was calculated', place: 'top', miss: MISS, b: 'Normalisation, equations and what was left out, in words, from the live settings. The workbook, Prism tables and saved figures carry the same text.' }] },

      { id: 'curves', label: 'Curves', sel: tabEl('curves'), go: to('curves'), needs: 'data',
        lead: 'Each compound\'s traces and fits, in views: the kinetics, the raw reads, the dose–response, K against dose, the heat map and the checks on the fit.',
        do: ['Pick a compound on the left and a view across the top: **Kinetics**, **Raw (RLU)**, **Dmax–response**, **K-response**, **Over time**, **Heat map**, **Residuals**, **First-order check**.',
          'Click a read to leave it out (a red cross puts it back); shift-drag across the plot to leave a time range out for the whole plate. Only that compound is refitted.',
          'Type a minimum and maximum for any axis; leave a box empty for automatic.',
          'A time course has its own views: the level over time, by dose, and a heat map.'],
        ref: [['Dashed line', 'The fit; the dotted lines mark the plateau, t½ and the delay.'],
          ['Dashed trace', 'A concentration past the optimum (a hook), left out of the fit.'],
          ['First-order check', 'A plain log plot: a straight line means a first-order decay.']],
        steps: [{ sel: '#pane-curves', t: 'The curves', place: 'top', miss: MISS, b: 'Views across the top, doses under them. Hover a trace for its numbers; export the figure as PNG or SVG from **Export**.' }] },

      { id: 'compare', label: 'Compare', sel: tabEl('compare'), go: to('compare'), needs: 'data',
        lead: 'Compounds side by side: a ranking, two measures against each other, and the strongest traces together.',
        do: ['Choose the measure to rank by (efficiency by default; for a time course, the size of the change) and its direction.',
          'Plot any two measures against each other to see who is both fast and deep.',
          'Show the strongest dose of each compound as traces, or all of them.'],
        steps: [{ sel: '#pane-compare', t: 'Side by side', place: 'top', miss: MISS, b: 'Pick the measures; hover a point for the compound. Axis ranges can be typed here too.' }] },

      { id: 'history', label: 'History', sel: tabEl('history'), go: to('history'), full: false,
        lead: 'Every analysis you have made, kept in this browser under its name and opened as you left it.',
        do: ['Search, pin and rename; open one to carry on from where you stopped.'],
        steps: [{ sel: '#th-root', t: 'What you have made', place: 'top', b: 'Analyses save themselves a moment after you stop; the newest is first.' }] }
    ],
    words: [
      ['T0', 'The first read: every well is divided by its own T0, so 1 means “as at the start”.'],
      ['Vehicle ratio', 'Each well after T0 normalisation, divided by the vehicle trace normalised the same way (ratio of means).'],
      ['K', 'The rate constant of the decay, per hour: y = (1 − P)·e^(−Kt) + P.'],
      ['Plateau', 'Where the trace settles (P). Dmax = 1 − P.'],
      ['t½', 'The time to half of the change.'],
      ['Onset', 'The first read beyond the noise for three reads running.'],
      ['Z′', '1 − 3(SD + SD)/|difference of the means|, vehicle against background.'],
      ['Bound', 'A number that is a limit: `>` faster than the read interval, `≥` a plateau not reached.']],
    faq: [
      ['A value has “≥” or “>” in front of it', 'The trace had not settled, or the rate is faster than the read interval. It is a limit, not a measurement, and is exported as one.'],
      ['A compound says n.d.', 'Its curve does not move enough to have a midpoint, or is no better than a flat line.'],
      ['A dose by mass is missing from the degradation results', 'A DC50 is in nM and no molecular weight is known, so mass doses are only used in a time course.'],
      ['The numbers differ slightly from ProNect', 'The normalisation is ProNect\'s (verified against its own files, to the rounding of its export); the fits are Tempo\'s.']],
    keys: [['Click a read', 'Leave it out'], ['⌘Z', 'Undo'], ['Click a header', 'Sort the table']]
  });
})();
