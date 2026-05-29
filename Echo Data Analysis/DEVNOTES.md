# Echo Data Analysis — Developer Notes

Single self-contained HTML app (`Echo_Data_Analysis.html`, ~5800 lines).  
No build step. Open directly in browser. All analysis runs in-browser via **Pyodide** (Python WASM).

---

## Architecture

| Layer | What it does |
|---|---|
| CSS (lines 8–262) | CSS variables for dark/light theme, all component styles |
| HTML (lines 264–548) | Static shell: header, left sidebar (inputs + params), right panel (tabs) |
| JS globals (lines 604–612) | `pyodide`, `echoFile`, `readerFiles`, `scatterData`, `compoundData`, etc. |
| Pyodide init (lines 624–645) | Loads Python + `pandas numpy scipy matplotlib openpyxl micropip` |
| Python pipeline (lines 1069–1580) | `buildPy()` returns a Python string that Pyodide runs: parses Echo CSV, PHERAstar XLS, normalises, fits 4PL, produces PDFs + JSON |
| JS pipeline runner (lines 855–1030) | `runPipeline()` — writes files to Pyodide FS, calls Python, reads results back |
| Results rendering (lines 1580–) | `renderResults()`, `renderScatter()`, `renderCurvesTab()`, `renderPlateTab()`, etc. |

---

## Key global state

```
scatterData          Array of fitted compound objects (source of truth for all plot tabs)
window._resultsData  Same reference (used by selectivity / histogram / stats)
window._bpData       Box plot data (same as scatterData after run)
window._plateData    Plate layout JSON from Python
window._cvCfg        Curves tab render config { showReps, lineStyle, pointShape, … }
compoundData         { sampleId → { svg, MW, logP, … } } from SMILES CSV + RDKit.js
pcolorMap            { proteinName → {fg, bg} } — scatter group colors (PCOLORS palette)
```

---

## Color system

### Group colors (`PCOLORS`, line ~760)
12 vivid distinct colors. Order matters — first protein seen gets index 0.
```
0: #dc1e1e  vivid red
1: #145ad2  vivid blue
2: #0aa050  vivid green
3: #8c32d2  purple
4: #00b4c8  cyan
5: #be3282  hot pink
6: #1ea064  emerald
7: #1e32b4  indigo
8: #b41e50  crimson
9: #008ca0  dark cyan
10: #64a01e  yellow-green
11: #501ea0  deep indigo
```
**Flagged compounds** use amber `#f0a000` / `rgba(240,160,0,0.75)` — intentionally not in PCOLORS.

### Curves tab palette (`CV_PALETTE`, line ~4088)
Separate set of 12 colors used in the Curves tab canvas rendering.  
The click-on-scatter side panel overrides with `pcolor(protein).fg` via `cfg.palette`.

---

## Scatter / Plots tab

### Data flow
```
runPipeline() → Python JSON → renderScatter(data) → scatterData
                                  ↓
updateScatter() → buildScatterChart(rows) → Chart.js scatter
```

### Filtering chain (buildScatterChart ~line 2527)
1. Flag filter: `if (!showFlags) rows = rows.filter(r => r.Flag !== 'Yes')`
2. **Hit filters**: `rows = _applyHitFilters(rows)` — reads `sc-dmax-min/max`, `sc-dc50-min/max`
3. Protein filter: `if (protFilter !== 'all') rows = rows.filter(...)`

`_applyHitFilters(rows)` is also called in `renderBoxPlotVar` and `buildSelectivityChart`.

### Filter element IDs (in scatter toolbar HTML ~line 2342)
```
sc-x, sc-y           X/Y axis metric selects
sc-prot              Group filter select
sc-flags             Show flagged checkbox
sc-xmin/xmax         X axis range
sc-ymin/ymax         Y axis range
sc-dmax-min/max      Dmax (%) hit filter  ← NEW
sc-dc50-min/max      DC50 (nM) hit filter ← NEW
sc-search            Sample ID search
sc-colorby, sc-sizeby
```
`_scFilterIds()` returns all these IDs and is used to snapshot/restore filter state for undo/redo.

---

## Curve rendering

### `drawMultiCurve(canvas, compounds, cfg)` (~line 4615)
Main canvas curve renderer used in Curves tab, QC tab, and click-on-scatter panel.

Key `cfg` options:
```
showReps      true = individual replicate dots | false = mean±SD (default)
palette       string[] — override CV_PALETTE per compound index
sdStyle       'bars' | 'band' | 'none'
lineStyle     'solid' | 'dashed' | 'dotted' | 'dashdot'
pointShape    'circle' | 'square' | 'diamond' | 'triangle' | 'cross'
```

### `makeCurveSVG(r)` (~line 2714)
Inline SVG curve for the hover tooltip (customTooltip). Always shows individual `_reps` when available; falls back to mean±SD from `_pts` when `_reps` is empty.

### `openCurvePanel(pt)` (~line 5053)
Opens side panel on scatter point click. Always forces `showReps:true` and passes `pcolor(pt.protein).fg` as palette override so color matches scatter chart.

---

## Data structures

Each compound in `scatterData` / `_resultsData`:
```js
{
  Protein, Sample_ID,
  DC50_nM, AbsDC50_nM, Dmax_pct, LogIC50_M, pDC50,
  HillSlope, R2, Flag, Flag_Reason,
  // 4PL params for curve drawing:
  _bot, _logec50, _hill, _tc,
  _xmin, _xmax,
  _pts:   [{x, y, sd}, …],   // mean ± SD per concentration
  _reps:  [{x, y}, …],       // individual technical replicates
  _hook_concs: [logConc, …], // excluded hook-effect concentrations
  _is_hook: bool,
}
```

---

## Progress indicator

- **Progress bar**: 3px line at top of right panel (`#pbar`)
- **Bat animation**: fixed bottom-right corner (`#bat-corner`), bounces during analysis
- **Label**: `#bat-corner-lbl` below bat sprite — uses `color:inherit` from bat-corner inline style (set to `#9099d8` dark / `#4455a0` light). Font-size 11px.
- Progress messages from Python: `__PROG__N/Total/pct` → parsed in `_log_cb` callback (~line 911)

---

## Assay types

Set via `#p-assay-type` select. Affects normalisation and curve orientation:
```
hibit        HiBiT degradation — signal decreases, Dmax = 100 − bottom
ctg          CTG viability — similar to HiBiT
displacement Displacement — needs 0% wells (p-zero-pct)
gain         Gain of signal — signal increases, bot fixed at 0
```

---

## Theme

`data-theme="light"` on `<html>` element. Toggled by `toggleTheme()`.  
CSS variables in `:root` (dark) and `[data-theme="light"]` overrides (~line 9–21).

---

## History

Last 10 analyses saved to `localStorage` key `eda_history_v1`.  
Each entry includes full `data` array + `plateData`. Loaded via `loadHistoryEntry(idx)`.

---

## Test data

Embedded as base64 in JS constants `_TEST_ECHO_B64` / `_TEST_READER_B64_*` (~line 784).  
Loaded via `loadTestData()` button.

---

## Recent changes (Claude Code sessions)

| Date | Change |
|---|---|
| 2026-05-27 | Hover tooltip & click panel: always show individual `_reps` points; fall back to mean±SD only if `_reps` empty |
| 2026-05-27 | Click panel color matches scatter group color via `pcolor(pt.protein).fg` passed as `cfg.palette` |
| 2026-05-27 | `drawMultiCurve`: accepts `cfg.palette` to override CV_PALETTE per compound |
| 2026-05-27 | Progress bat label: `color:inherit` + 11px font (was 9px muted `--text3`) |
| 2026-05-27 | Removed non-functional "📊 Histogram" button from scatter toolbar + guide |
| 2026-05-27 | `PCOLORS`: replaced with 12 vivid colors (red/blue/green first); no amber to avoid clash with flag color |
| 2026-05-27 | Added Dmax/DC50 hit filter inputs to scatter toolbar; `_applyHitFilters()` applied in scatter, box plot, selectivity |
| 2026-05-27 | Unified button heights: `height:30px` on `.theme-btn`/`.badge`/`.scatter-dl-btn`; `height:28px` on `.stbtn`/`.sc-clear` |
