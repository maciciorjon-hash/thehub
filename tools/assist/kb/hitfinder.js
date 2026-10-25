// Hit Finder: from many analysed screens to a short list of hits.
(function(){
  var go = function(id){ return function(w){ w.hfTab(id); }; };
  var T = function(id){ return '#hf-tabs .tab[data-tab="' + id + '"]'; };
  var ALL = ['screens', 'criteria', 'hits', 'sens', 'plots', 'health', 'chem', 'export', 'guide'];
  var NOREF = 'Charts appear once a compound has been measured in three or more runs of the same screen. Load the next run, or press **Example with 12 reference runs**.';
  assistRegister('hitfinder', {
    name: 'Hit Finder',
    blurb: 'Hit Finder turns the screens you analysed in Echo Dose Response or Lumina into a short list of hits. You say what a hit is, and it shows who passes, who almost does, who cannot be judged yet, how much the list leans on each threshold, and whether the assay itself held still from run to run.',
    first: ['start', 'criteria', 'tiers', 'sensitivity', 'export'],
    avoid: [],
    screen: function(w){ return (w.HF && w.HF.ui && w.HF.ui.tab) || 'screens'; },
    diag: function(w){
      var d = [];
      if (w.HF && w.HF.screens && !w.HF.screens.size) d.push({ msg: 'No screens are loaded. Use **From Echo**, **Open files…**, or load the **Example screen** to look around.', t: 'start' });
      return d;
    },
    topics: [
      { id: 'start', t: 'Your first list of hits', group: 'Getting started', on: ALL,
        q: ['first list', 'get started', 'how do i start', 'how to use', 'tutorial', 'walkthrough', 'quick start', 'hit finder', 'empezar', 'como empiezo', 'como se usa', 'primeros pasos', 'buscar hits'],
        a: 'Hit Finder works in four moves: load the screens, say what each group is for, say what a hit is, and read the list.',
        steps: ['On **Screens**, press **From Echo**, **Open files…** or **Example screen**.', 'Check the **slot** of each group: primary, anti-target, viability, counter-screen, rescue or control.',
          'On **Criteria**, start from a preset and change the numbers until the sentences say what you mean by a hit.', 'On **Hits**, read the funnel, then open a compound to see why it is where it is.',
          'On **Sensitivity** and **Health**, check that the list does not hang on one threshold and that the assay held still.'],
        tip: 'Everything stays in this browser, and your session is autosaved and offered back when you return.',
        prep: go('screens'), show: [{ sel: T('screens'), say: 'Start on **Screens**.' }, { sel: T('criteria'), say: 'Then say what a hit is on **Criteria**.' }],
        go: [{ l: 'Load an example screen', fn: 'loadHitFinderTestData' }], see: ['criteria', 'tiers'] },
      { id: 'criteria', t: 'Say what a hit is (criteria)', group: 'Judging', on: ['criteria', 'hits'],
        q: ['criteria', 'what is a hit', 'threshold', 'gate', 'preset', 'pass edge', 'borderline edge', 'criterios', 'que es un hit', 'umbral', 'puerta'],
        a: 'Each criterion reads one number about a compound in one screen and says pass, borderline, fail or unknown. A **gate** must pass for a hit, a **score** only ranks, an **advisory** is shown and never decides.',
        steps: ['Pick a **preset** under **Start from**.', 'Read the sentence under each criterion and move its numbers; the counts follow as you type, and an edge on the histogram can be dragged.',
          'Choose what happens when a number cannot be read: **Unverified**, **Fail** or **Skip**.', '**Add a criterion…** brings in effect, selectivity, viability window, hook window, fit quality and more.'],
        tip: 'A midpoint beyond the doses tested is a bound, not a value: "> 10 µM" fails a gate of "≤ 100 nM" for certain and never enters a mean.',
        prep: go('criteria'), show: [{ sel: '#pane-criteria .crit-top .l', say: 'Start from a preset here, and **Add a criterion…** next to it.', miss: 'Load a screen first.' }], see: ['tiers', 'sensitivity'] },
      { id: 'tiers', t: 'Hit, Borderline, Unverified, Rejected', group: 'Judging', on: ['hits', 'criteria'],
        q: ['tier', 'tiers', 'borderline', 'unverified', 'rejected', 'why is it rejected', 'why borderline', 'categorias', 'por que rechazado', 'sin verificar'],
        a: 'A **hit** passes every gate on measured numbers. **Borderline** fails nothing but sits between a pass edge and its borderline edge on at least one gate. **Rejected** fails a gate. **Unverified** means a gate could not be read: it has not passed.',
        tip: 'Your own call (hit, maybe, reject) is kept beside the tier and never changes it.',
        prep: go('hits'), show: [{ sel: '#pane-hits', say: 'The tier of each compound is here; open one to see every criterion it was read against.', miss: 'Load a screen first.' }], see: ['unverified'] },
      { id: 'unverified', t: 'Why is my compound Unverified?', group: 'Judging', on: ['hits', 'screens'],
        q: ['why unverified', 'unverified', 'not fitted', 'missing viability', 'could not be read', 'unread', 'no result', 'no verificado', 'por que sin verificar', 'falta viabilidad'],
        a: 'One of its gates could not be read, usually because it has no result in the viability or counter-screen. A missing number is never a pass and never a zero.',
        steps: ['Open the compound and look for the row marked **?**.', '**Screens → Compounds** lists who is missing from which screen.', 'If you would rather not require that gate, set its **If unread** to **Skip** on Criteria.'],
        prep: go('hits'), show: [{ sel: '#pane-hits', say: 'Open a compound: the row with a **?** is the gate that could not be read.', miss: 'Load a screen first.' }] },
      { id: 'hook', t: 'A compound with a hook', group: 'Judging', on: ['hits', 'plots', 'criteria'],
        q: ['hook', 'hook effect', 'bell shaped', 'productive window', 'dmax with hook', 'efecto gancho', 'ventana productiva'],
        a: 'A hook is not a defect. The hook is left out of the fit, **Dmax** is the effect without it, and the **productive window** (last productive dose ÷ DC50) says how forgiving the doses are.',
        prep: go('plots'), show: [{ sel: '#pl-window', say: 'Diamonds are curves with a hook.', miss: 'Load a screen with hook data from Echo.' }] },
      { id: 'sensitivity', t: 'How stable is the hit list? (sensitivity)', group: 'Judging', on: ['sens', 'criteria', 'hits'],
        q: ['sensitivity', 'how stable', 'robust', 'robustness', 'move the threshold', 'what if i change', 'near misses', 'fragile hits', 'sensibilidad', 'robustez', 'estable', 'cambiar el umbral'],
        a: 'Sensitivity moves each gate a few steps either way, on its own, and counts the hits again. The numbers are not re-read: only the line moves, so what changes is exactly the decision.',
        steps: ['The three tiles: hits with every gate one step **tighter**, **as set**, and one step **looser**.', 'In the table, **most** marks the gate the list leans on.',
          '**Hits that hang on one edge** lists what is lost when a gate moves; **Within one step of a hit** lists what one relaxation would let in.'],
        tip: 'A step is ×1.4 on a potency or a ratio, half the near-miss tolerance on a linear gate and one unit on a count.',
        prep: go('sens'), show: [{ sel: '#pane-sens .sn-tiles', say: 'Tighter, as set, looser.', miss: 'Load a screen first.' }, { sel: '#pane-sens .sn-t', say: 'One row per gate; **most** marks the one the list hangs on.', miss: 'Load a screen first.' }], see: ['criteria'] },
      { id: 'health', t: 'Is the assay holding still? (screen health)', group: 'Judging', on: ['health', 'screens'],
        q: ['screen health', 'levey jennings', 'control chart', 'reference compound', 'drift', 'run to run', 'westgard', 'out of control', 'salud del ensayo', 'grafico de control', 'compuesto de referencia', 'deriva'],
        a: 'A compound measured in every run is the assay’s own control. Each chart has one point per run: the line is the median, the others are ±1, 2 and 3 SD. A point beyond 3 SD, or two in a row beyond 2 SD on one side, is out of control; four beyond 1 SD or ten on one side is a drift or a shift.',
        tip: 'Limits need six runs and use the median and 1.4826 × the median absolute deviation, so one bad run cannot widen its own limits. Nothing here changes a tier.',
        prep: go('health'), show: [{ sel: '#pane-health .hl-ctl', say: 'Choose the screen and whether to follow potency or Dmax. ' + NOREF, miss: 'Load a screen first.' }],
        go: [{ l: 'Load 12 simulated reference runs', fn: 'hfLoadHealthDemo' }] },
      { id: 'efficiency', t: 'LE, LLE and CNS MPO', group: 'Structures', on: ['chem', 'criteria'],
        q: ['ligand efficiency', 'lipophilic efficiency', 'lle', 'cns mpo', 'mpo', 'efficiency', 'wager', 'eficiencia de ligando', 'eficiencia lipofilica'],
        a: 'Add them from **Criteria → Add** once structures are loaded. **LE** = 1.37 × pDC50 ÷ heavy atoms, **LLE** = pDC50 − cLogP; both come from the DC50, so they are approximate for a degrader. A potency bound stays a range.',
        tip: 'CNS MPO is Wager’s six desirabilities. ClogD and pKa come from your structure file; without them the score is a range, never a 0 or a 1.',
        prep: go('chem'), show: [{ sel: T('chem'), say: 'Structures are added on **Chemistry**.' }] },
      { id: 'export', t: 'Export: workbook, report, cherry-pick', group: 'Results', on: ['export'],
        q: ['export', 'report', 'pdf report', 'workbook', 'excel', 'cherry pick', 'retest', 'save project', 'print', 'exportar', 'informe', 'informe pdf', 'libro de excel', 'guardar proyecto'],
        steps: ['**Workbook** has everything, so the list can be rebuilt from the file.', '**Report (.pdf)** is the long form: gates, attrition, hits with how well each holds, plots, the assay’s rhythm and where every number came from.',
          '**Print** is the one-page summary.', '**Cherry-pick** lists each compound with a 10-point series centred on its potency.', '**Save project** keeps the whole session in one file.'],
        prep: go('export'), show: [{ sel: '#ex-xlsx', say: 'The workbook.', miss: 'Load a screen first.' }, { sel: '#ex-pdf', say: 'The PDF report.', miss: 'Load a screen first.' }] },
      { id: 'send', t: 'Sending results in and out', group: 'Results', on: ['screens', 'export'],
        q: ['send to hit finder', 'send from echo', 'send from lumina', 'send to labbook', 'bridge', 'enviar a hit finder', 'enviar desde lumina', 'enviar a labbook'],
        a: 'Inside dHUB, **Send to Hit Finder** in Echo, Tempo and Lumina opens Hit Finder with the analysis loaded. **Send to Labbook** on Export puts the hit list and the criteria on an experiment as two tables, without touching its Results.',
        prep: go('export'), show: [{ sel: '#ex-pdf', say: 'Next to the report, inside dHUB, **Send to Labbook** appears for someone who can open Labbook.', miss: 'Load a screen first.' }] }
    ]
  });
})();
