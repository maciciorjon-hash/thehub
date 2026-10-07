// Blueprint and Ribbon invariants — the bug classes the 2026-09-28 beta test found, as checks that
// run every time. Same rule as tools/invariants.mjs: each check is a CLASS already found once by
// hand, and it is the bug put back that proves the check, not the check passing.
//
//   B1 a no-op is a no-op     Clicking the plate format already active does not offer to wipe
//                             the plate; opening the well editor and leaving it paints nothing.
//   B2 an edit changes one    Giving wells a type keeps their merged-label group.
//      thing
//   B3 the design is the      A renamed built-in type is undoable and travels with a saved
//      whole design           design; a saved plate brings back its own brackets; a saved gel
//                             its lane widths; exporting the same design twice is one entry.
//   B4 every paste shape      Plate-reader values pasted as tab, comma, semicolon (decimal
//                             comma) or SPACE separated grids fill every well they name.
//   B5 data belongs to its    Reader values do not survive a change of plate format.
//      plate
//   B6 position, not order    A dilution over a block gives replicates the same concentration.
//   B7 text round-trips       Every label re-rendered from state into an <input> keeps its
//                             quotes and angle brackets (plate brackets, gel lanes, gel brackets).
//   B8 a field owns its keys  ⌘V inside a gel label pastes text, never lanes; Tab leaves the
//                             plate when no well is active.
//   B9 destructive = undoable A change of comb keeps the lanes, and Clear / comb changes on the
//                             gel are undone by ⌘Z.
//   B10 the gel tools fold   Each tool section folds and unfolds (and Fold all does both), what is open
//                             is remembered and restored, a folded section shows the values that are
//                             set in it, and a folded section's controls still drive the gel.
//   B11 one way to every      Four tabs (Plate, Gel, History, Guide), the underline sits under the one
//       screen                that is active, and the Guide is a tab (the modal and its ? are gone).
//   B12 a toggle keeps its    The Types and Brackets buttons keep their icon and chevron when they open
//       icon                  and close (the Brackets one rewrote its own innerHTML), and say so in
//                             aria-expanded.
//   N1 Beacon paste shapes    Beacon's plate-reader parser (the fourth copy) reads tab, space,
//                             lettered, semicolon/decimal-comma and comma grids, and a blank A1
//                             stays in column 1. (It read a space-separated grid as one column.)
//   R1 save = load            Every field a Ribbon design is read back with is written when it
//                             is saved (residue labels were read, never written).
//   R2 a failure leaks        A design whose structure fails to load applies nothing to the next
//      nothing                structure, and the view keeps the id of what it shows.
//   R3 newest wins            A slow earlier search never replaces a newer search's results.
//
// Ribbon needs 3Dmol from its CDN; RCSB is stubbed with a synthetic two-chain structure. If the
// CDN is unreachable the Ribbon checks are reported as skipped, not passed.
//
// Usage (repo root):  node tools/design_invariants.mjs [--only=B1,R2] [--verbose]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);

function freePort() {
  return new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}
async function waitHttp(url, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  throw new Error('server did not come up: ' + url);
}

const out = [], counts = {}, skipped = [];
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail) });
}

// ── Blueprint ────────────────────────────────────────────────────────────────────────────────
async function blueprint(pg) {
  const E = (f, a) => pg.evaluate(f, a);
  const wellAt = id => E(id => { const c = document.getElementById('plate-canvas-main'), m = c._meta, r = c.getBoundingClientRect(), i = wellIndices(id);
    return { x: r.left + (m.ox || 0) + m.labelW + i.ci * (m.wellPx + m.gap) + m.wellPx / 2, y: r.top + (m.oy || 0) + m.labelH + i.ri * (m.wellPx + m.gap) + m.wellPx / 2 }; }, id);
  const fresh = () => E(() => { hideFmtModal(); _doSetFormat('96'); wellState = {}; customTypes = []; pdBrackets = []; pdRenderBrackets();
    if (window._applyTypeNames) _applyTypeNames({}); clearSelection(); PD_UNDO.stack = []; PD_UNDO.redo = []; PD_UNDO.base = null; drawPlateCanvas(document.getElementById('plate-canvas-main')); });

  if (run('B1')) {
    await fresh();
    await E(() => { selection = new Set(['A1', 'A2']); setActiveTypeById('dose'); });
    await pg.click('.fmt-pill.active');
    check('B1', 'active format pill with wells', await E(() => document.getElementById('fmt-modal').style.display !== 'flex' && Object.keys(wellState).length === 2));
    await E(() => clearSelection());
    const p = await wellAt('E5');
    await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(80); await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(120);
    const opened = await E(() => document.getElementById('well-inline-edit').style.display === 'block');
    await pg.mouse.click(5, 5); await pg.waitForTimeout(150);
    check('B1', 'open + dismiss the well editor', opened && await E(() => !wellState.E5), { opened });
  }
  if (run('B2')) {
    await fresh();
    const w = await E(() => { selection = new Set(['B1', 'B2', 'B3']); document.getElementById('sp-lbl-input').value = 'Cpd X'; applyMergedLabel(); setActiveTypeById('control'); return wellState.B1; });
    check('B2', 'type change on a merged block', !!w.groupId && w.label === 'Cpd X' && w.typeId === 'control', w);
  }
  if (run('B3')) {
    await fresh();
    const r = await E(() => { renameType('cells', 'Renamed'); pdUndo(); const u = WELL_TYPES[0].name; pdRedo(); return [u, WELL_TYPES[0].name]; });
    check('B3', 'rename a built-in type, undo, redo', r[0] === 'Cells' && r[1] === 'Renamed', r);
    const h = await E(async () => {
      localStorage.removeItem('ld_history');
      selection = new Set(['A1', 'A2']); setActiveTypeById('compound'); pdAddBracket('top'); pdBrackets[0].label = 'Saved bracket';
      const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
      const ob = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new Blob()); };
      await exportPNG(); await exportPNG();
      HTMLAnchorElement.prototype.click = oc; HTMLCanvasElement.prototype.toBlob = ob;
      const n = ldHistGetList().length;
      pdBrackets = []; pdAddBracket('left'); pdBrackets[0].label = 'Other plate'; WELL_TYPES[0].name = 'Cells';
      ldHistLoadEntry(ldHistGetList()[0].id);
      return { n, br: pdBrackets.map(b => b.label), name: WELL_TYPES[0].name };
    });
    check('B3', 'export the same plate twice → one entry', h.n === 1, h);
    check('B3', 'a saved plate brings its own brackets', JSON.stringify(h.br) === '["Saved bracket"]', h);
    check('B3', 'a saved plate brings its type names', h.name === 'Renamed', h);
    const g = await E(() => {
      switchTab('gel', document.querySelector(`.tab[onclick*="'gel'"]`));
      gdWells[2].w = 2; gdWells[2].label = 'L3';
      const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
      gdDownload(); HTMLAnchorElement.prototype.click = oc;
      gdWells[2].w = 1; ldHistLoadEntry(ldHistGetList()[0].id);
      const r = gdWells[2].w; switchTab('designer', document.querySelector(`.tab[onclick*="'designer'"]`)); return r;
    });
    check('B3', 'a saved gel brings its lane widths', g === 2, g);
  }
  if (run('B4')) {
    const shapes = await E(() => {
      const G = (sep, dec, blankA1) => Array.from({ length: 8 }, (_, r) => Array.from({ length: 12 }, (_, c) =>
        (blankA1 && r + c === 0) ? '' : String((r * 12 + c + 1) / 10).replace('.', dec)).join(sep)).join('\n');
      const res = {};
      const cases = { tab: G('\t', '.'), tabBlankA1: G('\t', '.', true), comma: G(',', '.'), semicolonDecComma: G(';', ','),
        space: G('  ', '.'), spaceDecComma: G(' ', ','),
        spaceLabelled: '   1 2 3 4 5 6 7 8 9 10 11 12\n' + 'ABCDEFGH'.split('').map((L, r) => L + ' ' + Array.from({ length: 12 }, (_, c) => (r * 12 + c + 1) / 10).join(' ')).join('\n') };
      _doSetFormat('96');
      for (const k in cases) { const v = pdParseValues(cases[k]) || {}; res[k] = { n: Object.keys(v).length, A2: v.A2, H12: v.H12 }; }
      return res;
    });
    for (const [k, v] of Object.entries(shapes))
      check('B4', k, v.n === (k === 'tabBlankA1' ? 95 : 96) && v.A2 === 0.2 && v.H12 === 9.6, v);
  }
  if (run('B5')) {
    const r = await E(() => { _doSetFormat('96'); document.getElementById('pd-values-text').value = '1\t2\n3\t4'; pdApplyValues();
      const before = Object.keys(pdVals).length; _doSetFormat('384'); const after = Object.keys(pdVals).length; _doSetFormat('96'); return [before, after, pdHeatOn]; });
    check('B5', 'reader values after a change of format', r[0] > 0 && r[1] === 0 && r[2] === false, r);
  }
  if (run('B6')) {
    await fresh();
    const r = await E(() => {
      selection = new Set(['C1', 'C2', 'C3', 'D1', 'D2', 'D3']); updateSelToolbar();
      const shown = [document.getElementById('dil-btn').style.display, document.getElementById('dil-btn-col').style.display];
      document.getElementById('dil-start').value = '1000'; document.getElementById('dil-factor').value = '10'; document.getElementById('dil-unit').value = 'nM';
      applyDilution('row'); const across = ['C1', 'C2', 'C3', 'D1', 'D2', 'D3'].map(i => wellState[i].label);
      applyDilution('col'); const down = ['C1', 'D1', 'C3', 'D3'].map(i => wellState[i].label);
      return { shown, across, down };
    });
    check('B6', 'both directions offered for a block', r.shown.join('|') === '|', r.shown);
    check('B6', 'across a block', JSON.stringify(r.across) === JSON.stringify(['1µM', '100nM', '10nM', '1µM', '100nM', '10nM']), r.across);
    check('B6', 'down a block', JSON.stringify(r.down) === JSON.stringify(['1µM', '100nM', '1µM', '100nM']), r.down);
  }
  if (run('B7')) {
    const T = `5" insert <b>x</b> & 'y'`;
    const r = await E(T => {
      pdBrackets = []; pdAddBracket('top'); pdBrackets[0].label = T; pdRenderBrackets();
      const plate = document.querySelector('#pd-brack-list input[type=text]').value;
      switchTab('gel', document.querySelector(`.tab[onclick*="'gel'"]`));
      gdInit(); gdWells[2].label = T; gdRenderWells();
      const lane = document.querySelector('#gd-wells tr[data-idx="2"] input[type=text]').value;
      gdBrackets = []; gdAddBracket(); gdBrackets[0].label = T; gdRenderBrackets();
      const gb = document.querySelector('#gd-brackets input[type=text]').value;
      return { plate, lane, gb };
    }, T);
    for (const [k, v] of Object.entries(r)) check('B7', k, v === T, v);
  }
  if (run('B8')) {
    await E(() => { switchTab('gel', document.querySelector(`.tab[onclick*="'gel'"]`)); gdInit(); gdWells[3].label = 'Lane four';
      gdRenderWells(); gdSelected = new Set([3]); gdUpdateSelUI(); gdCopyRows(); gdSelected = new Set([7]); gdUpdateSelUI(); });
    await pg.locator('#gd-wells tr[data-idx="10"] input[type=text]').click();
    await pg.keyboard.press((process.platform === 'darwin' ? 'Meta' : 'Control') + '+v');
    check('B8', '⌘V inside a lane label leaves the lanes alone', await E(() => gdWells[7].label === ''), await E(() => gdWells[7].label));
    await E(() => { switchTab('designer', document.querySelector(`.tab[onclick*="'designer'"]`)); clearSelection(); document.getElementById('plate-canvas-main').focus(); });
    await pg.keyboard.press('Tab');
    check('B8', 'Tab leaves the plate with no well active', await E(() => document.activeElement.id !== 'plate-canvas-main'));
  }
  if (run('B9')) {
    const r = await E(() => {
      switchTab('gel', document.querySelector(`.tab[onclick*="'gel'"]`));
      document.getElementById('gd-gel').value = '20'; gdInit();
      if (!window.GD_UNDO) return { kept: '', undone: 'the gel has no undo', cleared: '' };
      GD_UNDO.stack = []; GD_UNDO.base = null; gdDraw();
      gdWells[3].label = 'Lysate A'; gdDraw();
      const sel = document.getElementById('gd-gel'); sel.value = '15'; sel.dispatchEvent(new Event('change'));
      const kept = gdWells[3].label + '|' + gdWells.length;
      gdUndo(); const undone = gdWells.length + '|' + sel.value;
      gdClearLabels(); gdUndo(); const cleared = gdWells[3].label;
      switchTab('designer', document.querySelector(`.tab[onclick*="'designer'"]`));
      return { kept, undone, cleared };
    });
    check('B9', 'a comb change keeps the lanes', r.kept === 'Lysate A|15', r.kept);
    check('B9', 'a comb change is undoable', r.undone === '20|20', r.undone);
    check('B9', 'Clear is undoable', r.cleared === 'Lysate A', r.cleared);
  }
  if (run('B10')) {
    await E(() => { switchTab('gel', document.querySelector(`.tab[onclick*="'gel'"]`)); localStorage.removeItem('bp_gd_sec'); gdSecInit(); gdInit(); });
    await pg.waitForTimeout(150);
    const secs = () => E(() => Object.fromEntries([...document.querySelectorAll('.gd-sec')].map(d => [d.dataset.sec, d.open])));
    const first = await secs();
    check('B10', 'six sections, and the first visit opens the comb, the labels and the lanes',
      Object.keys(first).join() === 'gel,labels,title,lanes,fill,extras' && first.gel && first.labels && first.lanes && !first.title && !first.fill && !first.extras, first);
    // a click on a summary folds it, and the choice is remembered
    await pg.click('.gd-sec[data-sec="lanes"] > summary'); await pg.waitForTimeout(200);
    await pg.click('.gd-sec[data-sec="title"] > summary'); await pg.waitForTimeout(200);
    const s1 = await secs(), stored = await E(() => JSON.parse(localStorage.getItem('bp_gd_sec') || 'null'));
    check('B10', 'a click folds one section and opens another', s1.lanes === false && s1.title === true, s1);
    check('B10', 'what is open is remembered', stored && stored.lanes === false && stored.title === true && stored.gel === true, stored);
    await E(() => { document.querySelectorAll('.gd-sec').forEach(d => { d.open = !d.open; }); gdSecInit(); });
    const s2 = await secs();
    check('B10', 'it is restored from what was remembered', s2.lanes === false && s2.title === true && s2.gel === true && s2.fill === false, s2);
    // Fold all / Unfold all
    const f = await E(() => { gdFoldAll(); const a = [...document.querySelectorAll('.gd-sec')].every(d => !d.open), l1 = document.getElementById('gd-fold-all').textContent;
      gdFoldAll(); const b = [...document.querySelectorAll('.gd-sec')].every(d => d.open), l2 = document.getElementById('gd-fold-all').textContent; return { a, l1, b, l2 }; });
    check('B10', 'Fold all folds every section, and the next press unfolds them all', f.a && f.b && f.l1 === 'Unfold all' && f.l2 === 'Fold all', f);
    // folded sections say what is in them, and still work
    const v = await E(() => {
      gdFoldAll();
      const g = id => document.getElementById(id), fire = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true }));
      g('gd-gel').value = '12'; fire(g('gd-gel'), 'change');
      g('gd-title').value = 'WB BRD4'; fire(g('gd-title'), 'input');
      g('gd-fsize').value = '14'; fire(g('gd-fsize'), 'input');
      gdWells[4].label = 'DMSO'; gdDraw();
      return { n: gdWells.length, gel: g('gd-sum-gel').textContent, title: g('gd-sum-title').textContent, labels: g('gd-sum-labels').textContent, lanes: g('gd-sum-lanes').textContent };
    });
    check('B10', 'a control inside a folded section still drives the gel', v.n === 12, v);
    check('B10', 'a folded section shows the comb it is set to', /12-well/.test(v.gel), v.gel);
    check('B10', 'the title section shows the title', /WB BRD4/.test(v.title), v.title);
    check('B10', 'the labels section shows the size', /14 pt/.test(v.labels), v.labels);
    check('B10', 'the lanes section counts the labelled lanes', /2 of 12/.test(v.lanes), v.lanes);
    await E(() => { document.getElementById('gd-gel').value = '20'; gdInit(); document.getElementById('gd-title').value = ''; document.getElementById('gd-fsize').value = '12'; gdDraw(); localStorage.removeItem('bp_gd_sec'); gdSecInit(); });
  }
  if (run('B11')) {
    const t = await E(() => {
      const tabs = [...document.querySelectorAll('.tabs .tab')].map(b => b.textContent.trim());
      switchTab('history', document.querySelector(`.tab[onclick*="'history'"]`));
      const ind = document.querySelector('.tab-indicator'), act = document.querySelector('.tab.active');
      return { tabs, tf: ind.style.transform, left: act.offsetLeft, w: act.offsetWidth, modal: !!document.getElementById('pd-guide-modal'), qbtn: !!document.getElementById('guide-btn') };
    });
    check('B11', 'four tabs, in order', t.tabs.join('|') === 'Plate Designer|Gel Designer|History|Guide', t.tabs);
    check('B11', 'the underline sits under the active tab', t.tf === 'translateX(' + t.left + 'px) scaleX(' + t.w + ')', t);
    check('B11', 'the guide is a tab, not a modal behind a ?', !t.modal && !t.qbtn, t);
    const g = await E(() => { switchTab('guide', document.querySelector(`.tab[onclick*="'guide'"]`)); const p = document.getElementById('panel-guide'); return { shown: p.classList.contains('active') && p.offsetHeight > 0, gel: /Gel Designer/.test(p.textContent) && /Fold|fold/.test(p.textContent) }; });
    check('B11', 'the Guide tab shows, and covers the gel tools', g.shown && g.gel, g);
    await E(() => switchTab('designer', document.querySelector(`.tab[onclick*="'designer'"]`)));
  }
  if (run('B12')) {
    const r = await E(() => {
      const btn = id => document.getElementById(id), n = id => btn(id).querySelectorAll('svg').length;
      const o = { before: [n('btn-brackets'), n('btn-types-panel')], ex0: btn('btn-brackets').getAttribute('aria-expanded') };
      pdToggleBracketsBar(); o.exOpen = btn('btn-brackets').getAttribute('aria-expanded'); o.afterOpen = n('btn-brackets');
      pdToggleBracketsBar(); o.exShut = btn('btn-brackets').getAttribute('aria-expanded'); o.afterShut = n('btn-brackets');
      toggleTypesPanel(); o.tOpen = btn('btn-types-panel').getAttribute('aria-expanded'); o.tIcons = n('btn-types-panel');
      toggleTypesPanel(); o.tShut = btn('btn-types-panel').getAttribute('aria-expanded');
      return o;
    });
    check('B12', 'the Brackets button keeps its icon and chevron through open and close', r.before[0] === 2 && r.afterOpen === 2 && r.afterShut === 2, r);
    check('B12', 'both buttons say whether their panel is open', r.ex0 === 'false' && r.exOpen === 'true' && r.exShut === 'false' && r.tOpen === 'true' && r.tShut === 'false' && r.tIcons === 2, r);
  }
}

// ── Ribbon ───────────────────────────────────────────────────────────────────────────────────
function syntheticPdb() {
  const lines = []; let n = 1;
  for (const [ch, x0] of [['A', 0], ['B', 12]]) for (let i = 1; i <= 12; i++) {
    const f = (v, w) => v.toFixed(3).padStart(w);
    lines.push('ATOM  ' + String(n++).padStart(5) + '  CA  ALA ' + ch + String(i).padStart(4) + '    ' +
      f(x0 + Math.cos(i) * 4, 8) + f(Math.sin(i) * 4, 8) + f(i * 1.5, 8) + '  1.00  0.00           C');
  }
  return lines.join('\n') + '\nEND\n';
}
// ── Beacon ───────────────────────────────────────────────────────────────────────────────────
async function beacon(pg) {
  if (!run('N1')) return;
  const r = await pg.evaluate(() => { const out = [];
    for (const fmt of ['96', '384']) { const R = fmt === '96' ? 8 : 16, C = fmt === '96' ? 12 : 24, L = 'ABCDEFGHIJKLMNOP';
      const g = [...Array(R)].map((_, i) => [...Array(C)].map((_, j) => i * 100 + j + 1));
      const shapes = { tab: g.map(r => r.join('\t')), spaces: g.map(r => r.join(' ')), lettered: g.map((r, i) => L[i] + '  ' + r.join('   ')),
        semi: g.map(r => r.map(x => x + ',5').join(';')), csv: g.map(r => r.join(',')), blankA1: g.map((r, i) => (i === 0 ? '' : r[0]) + '\t' + r.slice(1).join('\t')) };
      for (const [n, l] of Object.entries(shapes)) { const x = parsePlateCSV(l.join('\n'), fmt), add = n === 'semi' ? 0.5 : 0;
        const okAll = !!x && x.length === R && x.every((row, i) => row.vals.length === C && row.vals.every((v, j) => (n === 'blankA1' && i === 0 && j === 0) ? v == null : v === i * 100 + j + 1 + add));
        out.push([fmt + ' ' + n, okAll, x ? x.map(row => row.vals.slice(0, 3)).slice(0, 2) : null]); } }
    return out; });
  r.forEach(([n, ok, d]) => check('N1', n, ok, d));
}
async function ribbon(pg) {
  if (!(await pg.evaluate(() => !!window.$3Dmol))) { skipped.push('Ribbon (3Dmol could not load from its CDN)'); return; }
  const E = (f, a) => pg.evaluate(f, a);
  const loaded = id => E(id => new Promise((res, rej) => { fetchPdb(id); const t0 = Date.now(), t = setInterval(() => {
    if (!$('fetchBtn').disabled) { clearInterval(t); res(currentPdbId); } else if (Date.now() - t0 > 15000) { clearInterval(t); rej(new Error('load timed out')); } }, 60); }), id);
  await loaded('1XYZ');
  if (run('R1')) {
    const r = await E(() => {
      localStorage.removeItem('ribbon_designs');
      state.style = 'stick'; state.color = 'chain'; state.uniformColor = '#123456'; state.border = 'thick'; state.bg = 'white';
      state.surfaceOpacity = 0.31; state.showLines = false; state.exportLabels = false; state.hsl = { h: 17, s: 60, l: 90 };
      state.labelStyle = Object.assign({}, state.labelStyle, { font: 'mono', size: 21, bold: true, italic: true, shape: 'square' });
      state.chainColors = { A: '#abcdef' }; state.chainLabels = { A: 'Chain A tag' }; state.labelOffsets = { A: { dx: 5, dy: -9 } };
      state.labelAnchors = { A: { x: 1, y: 2, z: 3 } };
      state.residueLabels = [{ chain: 'B', resi: 4, resn: 'ALA', text: 'ALA 4 /B' }];
      const want = JSON.stringify(state);
      $('designName').value = 'inv'; saveDesign();
      _pendingDesign = Object.assign({ _pdb: currentPdbId }, getDesigns().inv.state); applyPendingDesign();
      const got = JSON.stringify(state);
      const a = JSON.parse(want), b = JSON.parse(got);
      return Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    });
    check('R1', 'every state field survives save → load', !r.length, r);
  }
  if (run('R2')) {
    await E(() => { const d = getDesigns(); d.bad = { pdbId: '9ZZ9', ts: 1, state: { chainColors: { A: '#ff00ff' }, chainLabels: { A: 'LEAK' } } }; putDesigns(d); loadDesign('bad'); });
    await E(() => new Promise(res => { const t = setInterval(() => { if (!$('fetchBtn').disabled) { clearInterval(t); res(); } }, 60); }));
    check('R2', 'the view keeps the id of what it shows', await E(() => currentPdbId === '1XYZ'), await E(() => currentPdbId));
    await loaded('1XYZ');
    const r = await E(() => ({ c: state.chainColors, l: state.chainLabels }));
    check('R2', 'a failed design applies nothing to the next load', !Object.keys(r.c).length && !Object.keys(r.l).length, r);
  }
  if (run('R3')) {
    await E(() => { $('pdbInput').value = 'slowquery'; handleSubmit(); });
    await pg.waitForTimeout(80);
    await E(() => { $('pdbInput').value = 'fastquery'; handleSubmit(); });
    await pg.waitForTimeout(1600);
    const ids = await E(() => [...document.querySelectorAll('.sr-id')].map(e => e.textContent).join(','));
    check('R3', 'the newest search owns the list', ids === '2BBB', ids);
  }
}

// ── Driver ─────────────────────────────────────────────────────────────────────────────────────
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const pageErrs = [];
try {
  await waitHttp(base);
  const browser = await chromium.launch();
  for (const [app, suite, prep] of [
    ['apps/blueprint/blueprint.html', blueprint, null],
    ['apps/beacon/beacon.html', beacon, null],
    ['apps/ribbon/ribbon.html', ribbon, async ctx => {
      await ctx.route('**/files.rcsb.org/download/**', r => /1XYZ\.pdb$/.test(r.request().url())
        ? r.fulfill({ status: 200, contentType: 'text/plain', body: syntheticPdb() }) : r.fulfill({ status: 404, body: '' }));
      await ctx.route('**/rcsbsearch/v2/query', async r => { const body = r.request().postData() || '';
        if (body.includes('slowquery')) await new Promise(t => setTimeout(t, 900));
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result_set: [{ identifier: body.includes('slowquery') ? '1AAA' : '2BBB' }] }) }); });
      await ctx.route('**/data.rcsb.org/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"struct":{"title":"stub"}}' }));
    }]]) {
    if (ONLY && !ONLY.some(o => o[0] === (suite === blueprint ? 'B' : suite === beacon ? 'N' : 'R'))) continue;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.removeItem('ribbon_last'); } catch (e) {} });
    if (prep) await prep(ctx);
    const pg = await ctx.newPage();
    pg.on('pageerror', e => pageErrs.push(path.basename(app) + ': ' + String(e && e.message || e)));
    await pg.goto(base + app + '?_ts=' + Date.now(), { waitUntil: 'load' });
    await pg.waitForTimeout(1200);
    try { await suite(pg); }
    catch (e) { out.push({ inv: 'harness', case: path.basename(app), msg: 'the suite threw: ' + String(e && e.message || e).split('\n')[0] }); }
    await ctx.close();
  }
  await browser.close();
} finally { srv.kill(); }

const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort();
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
skipped.forEach(s => console.log('  – skipped: ' + s));
if (pageErrs.length) { console.log('  ✗ page errors:'); [...new Set(pageErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + pageErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Blueprint and Ribbon invariants hold.');
process.exit(failed ? 1 : 0);
