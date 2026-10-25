// Blot invariants — a figure is somebody's experiment; it must survive the browser, say what it is, and measure
// what is on it.
//
//   BL1  pictures out of localStorage  a figure with large pictures saves a small record, the pictures come back
//                                      after a reload, and a figure or a saved list from before (pictures inline)
//                                      loads, is put aside as it was, and is moved
//   BL2  lanes keep their widths       changing the lane count keeps the widths and label offsets of the lanes that stay
//   BL3  labels are text               formatting survives; scripts, handlers and foreign tags in a label never run
//   BL4  undo                          adding a panel, a setting and a typed label each undo and redo; a word typed is
//                                      one step; ⌘Z works outside a label
//   BL5  export                        the file is named after the proteins, and "Exported" is said when it exists
//   BL6  densitometry                  on a synthetic gel of known band ratios the relative signals are right within 5%,
//                                      the box finds the band, a loading control divides lane by lane, saturation is
//                                      flagged, and the CSV says the same numbers (formula-safe)
//   BL7  kDa markers                   a click places the size picked at that height; the figure and the export draw it there
//   BL8  adjustments                   invert, levels and rotation reach the cropped picture and are remembered
//   BL9  saved figures travel          a saved figure carries references and a preview, is small, and opens on a device
//                                      without the originals from its preview
//   BL10 sync                          a list saved here while offline goes up when the cloud is older
//   BL11 Labbook round trip            Send to Labbook files the figure with its design; Edit in Blot opens it as it was;
//                                      Update replaces the same file and keeps the caption written in Labbook
//   BL13 16-bit scans                  a 16-bit TIFF that uses 0-4000 of 65535 keeps its range (scaled over its own min-max, a straight
//                                      line), where it used to keep 16 grey levels; WhiteIsZero is inverted; 8-bit is untouched
//   BL14 densitometry is on the original  levels and invert set for the figure do not change the numbers: the relative signals of a
//                                      levelled and inverted panel match the gel's, and a stored box from before is migrated
//   BL15 keyboard and names            every dialog is role=dialog with its title as its name, takes focus, keeps Tab inside, closes on Esc
//                                      and returns focus; close buttons are named; editable labels are textboxes with a name and a
//                                      focus ring; the steppers are named and 24px wide; the toast is role=status; the state colours exist
//   BL16 shapes are data              a hostile list is cleaned (types, ranges, colours, ids, 200 at most); a typed text never runs;
//                                      shapes come back after a reload and travel in a portable copy and a preset
//   BL17 drawing and undo              an arrow dragged, or clicked, lands where it was drawn; one undo step each; Format opens and closes
//   BL18 what you see is exported      the box, the arrow beyond the figure and the text are in the PNG; the export widens for what overhangs
//   BL19 the pointer                   Shift squares, a drag and the arrow keys move, a handle resizes, the round handle rotates,
//                                      duplicate / order / align / lock / delete
//   BL20 text                          typing in a box, a double-click edits, an emptied text goes, typing is one undo step, the asterisk
//   BL21 the ribbon                    tabs, Format as a contextual tab, ids and labels kept, the Text group dimmed until a label is chosen
//   BL22 fill the lane labels          10 µM ÷3 ×8 gives 10 µM … 4.6 nM; units carry; hostile inputs; apply and undo
//   BL23 drop anywhere                 a picture dropped on the page fills the first empty panel (or adds one) and opens the crop
//   BL24 ladders are the makers'        every ladder is the list its maker publishes (the lists are pinned here: an edit has to be made twice), in
//        lists                          order, with its reference bands among its sizes; DNA says bp and groups thousands; an older, unverified
//                                      ladder keeps its markers as custom sizes; custom sizes are cleaned
//   BL25 a size from a height          markers on a known curve give back the size between them, exactly at each marker, never outside the first
//                                      and last, never past a neighbour; fewer than two or out of order is said, not fitted
//   BL26 snap to the band              a click near a band lands on its centre, a click far from any does not move, a faint ripple does not
//                                      beat a real band, both polarities; Alt places exactly; the toggle is respected; a band holds one marker
//   BL27 Measure                       a click reads the size, outside the markers is refused with the reason, Add as label makes a text shape
//   BL12 layout                        escape, runtime and alignment audits on the figure and every dialog, 1440/1024/390,
//                                      both themes
//
//   node tools/blot_invariants.mjs [--only=BL1,BL6] [--file=apps/western-blot/western-blot.html]      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const FILE = arg('file', 'apps/western-blot/western-blot.html');
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function guard(inv, fn) { try { await fn(); } catch (e) { bad(inv, 'threw: ' + String(e && e.message || e).split('\n')[0]); } }

const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/CLAUDE.md'); if (r.ok) break; } catch (e) {} await sleep(120); }
const URL = BASE + '/' + FILE;

const browser = await chromium.launch();
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 } });
  await ctx.addInitScript(([t, ls]) => { try { localStorage.setItem('hub_theme', t); if (ls) Object.keys(ls).forEach(k => localStorage.setItem(k, ls[k])); } catch (e) {} }, [opts.theme || 'light', opts.ls || null]);
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(URL); await page.waitForFunction(() => typeof FIG === 'object' && FIG && typeof blotUndo === 'function', null, { timeout: 15000 }); await sleep(400);
  return page;
}

// In the page: a synthetic gel — 12 equal lanes, one dark Gaussian band per lane with the given darkness.
const GEL = `window.__gel = function(amps, opts){
  opts = opts || {}; var W = 600, H = 120, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
  var id = x.createImageData(W, H), d = id.data, n = amps.length, sig = opts.sigma || 5, y0 = opts.y || 60, seed = 7;
  function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) {
    var L = Math.min(n - 1, Math.floor(xx / (W / n))), cx = (L + 0.5) * W / n, hw = W / n * 0.36, edge = Math.max(0, 1 - Math.max(0, Math.abs(xx - cx) - hw) / 3);
    var g = Math.exp(-((y - y0) * (y - y0)) / (2 * sig * sig)), v = 245 * (1 - Math.min(1, amps[L] * g * edge)) + (rnd() - 0.5) * (opts.noise == null ? 4 : opts.noise);
    v = Math.max(0, Math.min(255, v)); var i = (y * W + xx) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  x.putImageData(id, 0, 0); return c.toDataURL('image/png'); };
window.__noise = function(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data, s = 3;
  for (var i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (i % 4 === 3) ? 255 : s & 255; } x.putImageData(id, 0, 0); return c.toDataURL('image/png'); };`;

if (run('BL1')) await guard('BL1', async () => {
  const p = await open();
  const r = await p.evaluate(GEL + `;(async () => {
    var big = __noise(1400, 900); FIG.panels[0].src = big; FIG.panels[0].cropped = big; FIG.panels[0].prot = 'BRD4'; save(); render();
    await new Promise(r => setTimeout(r, 500));
    var st = localStorage.getItem('blot_figure'); return { mb: big.length / 1e6, kb: st.length / 1024, inline: st.indexOf('data:image') >= 0 }; })()`);
  r.mb > 2 ? ok() : bad('BL1', 'the test picture is too small to prove anything');
  !r.inline && r.kb < 20 ? ok() : bad('BL1', `the saved figure still carries its pictures (${r.kb.toFixed(0)} KB in localStorage)`);
  await p.reload(); await p.waitForFunction(() => typeof FIG === 'object' && FIG && FIG.panels[0] && /^data:/.test(FIG.panels[0].cropped || ''), null, { timeout: 8000 }).catch(() => {});
  const back = await p.evaluate(() => ({ img: /^data:image/.test(FIG.panels[0].cropped || ''), onScreen: !!document.querySelector('.panel-blot .blot-img'), prot: FIG.panels[0].prot }));
  back.img && back.onScreen && back.prot === 'BRD4' ? ok() : bad('BL1', 'the picture did not come back after a reload');
  await p.context().close();
  // From before: a figure and a saved list with their pictures inline.
  const old = await open();
  const legacy = await old.evaluate(GEL + `;(() => { var g = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]);
    var fig = JSON.parse(JSON.stringify(FIG)); fig.panels[0].src = g; fig.panels[0].cropped = g; fig.panels[0].prot = 'Old';
    return { fig: JSON.stringify(fig), store: JSON.stringify({ history: [{ ts: 1, fig: fig }], presets: [], updated: 5 }) }; })()`);
  await old.context().close();
  const p2 = await open({ ls: { blot_figure: legacy.fig, blot_store: legacy.store } });
  await sleep(1500);
  const m = await p2.evaluate(async () => {
    var kv = await _bIdb('kv', 'readonly', st => st.getAllKeys()), h = BSTORE.history[0];
    return { keys: kv || [], fig: /^data:/.test(FIG.panels[0].cropped || ''), prot: FIG.panels[0].prot, ls: localStorage.getItem('blot_figure').indexOf('data:image') >= 0,
      ref: h && /^idb:/.test(h.fig.panels[0].cropped || ''), pv: !!(h && h.pv && Object.keys(h.pv).length), storeInline: localStorage.getItem('blot_store').indexOf('data:image/png') >= 0 };
  });
  m.fig && m.prot === 'Old' ? ok() : bad('BL1', 'a figure saved before the move did not load with its picture');
  !m.ls ? ok() : bad('BL1', 'a figure from before was not moved out of localStorage');
  m.keys.indexOf('figure-before-idb') >= 0 && m.keys.some(k => /^store-before-idb-/.test(k)) ? ok() : bad('BL1', 'the figure and the list from before were not put aside first: ' + m.keys.join(','));
  m.ref && m.pv && !m.storeInline ? ok() : bad('BL1', 'a saved figure from before was not moved to references with a preview');
  p2.errs.length ? bad('BL1', 'errors: ' + p2.errs.join(' | ')) : ok();
  await p2.context().close();
});

if (run('BL2')) await guard('BL2', async () => {
  const p = await open();
  const r = await p.evaluate(() => { FIG.laneWeights = [3,1,1,1,1,1,1,1,1,1,1,2]; FIG.laneLabelOffsetX = [6,0,0,0,0,0,0,0,0,0,0,-4]; save();
    setLaneCount(14); var a = laneWeightsArr(FIG).slice(0, 2), off14 = laneLabelOffsetXArr(FIG)[0];
    setLaneCount(10); var b = laneWeightsArr(FIG).slice(0, 2);
    setLaneCount(12); return { a, off14, b, n: laneWeightsArr(FIG).length }; });
  r.a[0] === 3 && r.off14 === 6 ? ok() : bad('BL2', 'adding a lane reset the widths or label offsets: ' + JSON.stringify(r));
  r.b[0] === 3 && r.n === 12 ? ok() : bad('BL2', 'removing lanes reset the widths of the lanes that stay');
  await p.context().close();
});

if (run('BL3')) await guard('BL3', async () => {
  const p = await open();
  const r = await p.evaluate(async () => {
    window.__x = 0;
    var bad = ['<img src=x onerror="window.__x++">', '<svg onload="window.__x++"></svg>', '<script>window.__x++<\/script>', '<a href="javascript:window.__x++">a</a>', '<span style="background:url(javascript:window.__x++);color:red">c</span>', '<iframe srcdoc="<script>parent.__x++<\/script>"></iframe>'];
    FIG.lanes[0] = '<b>DMSO</b>' + bad[0]; FIG.panels[0].prot = '<i>BRD4</i>' + bad[1]; FIG.panels[0].kda = '70' + bad[2]; FIG.groups = [{ from: 1, to: 3, label: 'grp' + bad[3] }];
    FIG.condRows = [{ label: 'cmp' + bad[4] + bad[5], on: [] }]; render(); await new Promise(r => setTimeout(r, 300));
    var fig = document.getElementById('figure');
    return { x: window.__x, b: !!fig.querySelector('.lane-cell b'), i: !!fig.querySelector('.panel-prot i'), red: !!fig.querySelector('.cond-band span[style*="color"]'),
      foreign: fig.querySelectorAll('img:not(.blot-img),script,iframe,a[href],[onerror],[onload]').length };
  });
  r.x === 0 ? ok() : bad('BL3', 'markup in a label ran');
  r.foreign === 0 ? ok() : bad('BL3', `${r.foreign} foreign elements reached the figure from labels`);
  r.b && r.i && r.red ? ok() : bad('BL3', 'cleaning took the formatting with it (bold / italic / colour)');
  await p.context().close();
});

if (run('BL4')) await guard('BL4', async () => {
  const p = await open();
  const r = await p.evaluate(async () => {
    var o = {}; _uReset();
    var n0 = FIG.panels.length; addPanel(); o.added = FIG.panels.length === n0 + 1;
    setGap(30); blotUndo(); o.gapBack = FIG.gap === 10; blotUndo(); o.panelBack = FIG.panels.length === n0; blotRedo(); o.redo = FIG.panels.length === n0 + 1;
    var lbl = document.querySelector('.panel-prot .lbl-in'); lbl.focus();
    for (var w of ['G', 'GA', 'GAP', 'GAPDH']) { lbl.innerHTML = w; lbl.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 60)); }
    lbl.blur(); var depth = UNDO.length; blotUndo(); o.word = FIG.panels[0].prot === '' && UNDO.length === depth - 1;
    blotRedo();
    document.body.focus(); var e = new KeyboardEvent('keydown', { key: 'z', metaKey: true, ctrlKey: true, bubbles: true, cancelable: true }); document.dispatchEvent(e); o.kb = FIG.panels[0].prot === '';
    o.btn = !document.getElementById('tb-undo').disabled;
    return o;
  });
  r.added && r.gapBack && r.panelBack && r.redo ? ok() : bad('BL4', 'add panel / gap did not undo and redo: ' + JSON.stringify(r));
  r.word ? ok() : bad('BL4', 'a word typed in a label was not one undo step');
  r.kb ? ok() : bad('BL4', '⌘Z outside a label did not undo');
  r.btn ? ok() : bad('BL4', 'the Undo button stays disabled with steps to undo');
  await p.context().close();
});

if (run('BL5')) await guard('BL5', async () => {
  const p = await open();
  const r = await p.evaluate(GEL + `;(async () => { var g = __gel([.6,.6,.6,.6,.6,.6,.6,.6,.6,.6,.6,.6]); FIG.panels[0].cropped = g; FIG.panels[0].src = g; FIG.panels[0].prot = 'BRD4'; FIG.panels[1].prot = '<b>GAPDH</b>'; save(); render();
    var got = [], said = [], tt = window.toast; window.toast = function(m){ said.push([m, got.length]); tt(m); }; window.downloadBlob = function(b, n){ got.push({ n: n, size: b.size, type: b.type }); };
    await doExport('png'); await doExport('pdf'); return { got: got, said: said }; })()`);
  r.got.length === 2 && r.got[0].n === 'BRD4_GAPDH_blot.png' && r.got[1].n === 'BRD4_GAPDH_blot.pdf' ? ok() : bad('BL5', 'export names: ' + r.got.map(g => g.n).join(', '));
  r.got.every(g => g.size > 1000) ? ok() : bad('BL5', 'an export was empty');
  const done = r.said.filter(s => /^Exported/.test(s[0]));
  done.length === 2 && done[0][1] >= 1 && done[1][1] >= 2 ? ok() : bad('BL5', '"Exported" was said before the file existed');
  await p.context().close();
});

if (run('BL6')) await guard('BL6', async () => {
  const p = await open();
  const amps = [0.15, 0.3, 0.6, 0.9, 0.45, 0.2, 0.05, 0.75, 0.3, 0.6, 0.15, 0.9], lcA = [0.5, 0.5, 0.25, 0.5, 0.5, 1.0, 0.5, 0.5, 0.5, 0.25, 0.5, 0.5];
  const r = await p.evaluate(GEL + `;(async (A, B) => {
    FIG.panels[0].cropped = __gel(A); FIG.panels[0].src = FIG.panels[0].cropped; FIG.panels[0].prot = 'Target';
    FIG.panels[1].cropped = __gel(B, { sigma: 4 }); FIG.panels[1].src = FIG.panels[1].cropped; FIG.panels[1].prot = 'GAPDH';
    FIG.panels.push(newPanel('Sat', '')); FIG.panels[2].cropped = __gel([1,1,1,1,1,1,1,1,1,1,1,1], { sigma: 10, noise: 0 }); FIG.panels[2].src = FIG.panels[2].cropped;
    save(); render();
    var meas = async i => { var im = await _dnLoad(i); var G = _dnGrey(im); if (!FIG.panels[i].quant){ var a = _dnAuto(G, _dnDarkAuto(G)); FIG.panels[i].quant = { y0: a.y0, y1: a.y1, dark: _dnDarkAuto(G) }; } return dnMeasure(G, FIG.panels[i].quant); };
    openQuant(0); await new Promise(r => setTimeout(r, 400));
    var q = FIG.panels[0].quant, t = await meas(0), l = await meas(1), s = await meas(2);
    dnSetLc('1'); DN.ref = 0; await new Promise(r => setTimeout(r, 500));
    var csv = null; window.downloadBlob = function(b){ b.text().then(x => { csv = x; }); };
    FIG.lanes[3] = '=HYPERLINK("x")'; exportQuantCSV(); await new Promise(r => setTimeout(r, 900));
    var shown = document.getElementById('dn-tbl').textContent;
    closeQuant();
    return { q: q, t: t.map(x => x.vol), l: l.map(x => x.vol), sat: s.map(x => x.sat), tsat: t.map(x => x.sat), csv: csv, shown: shown, dark: q.dark };
  })(${JSON.stringify(amps)}, ${JSON.stringify(lcA)})`);
  r.q.y0 < 0.5 && r.q.y1 > 0.5 && r.q.y1 - r.q.y0 < 0.6 ? ok() : bad('BL6', `the box did not find the band (y ${r.q.y0.toFixed(2)}–${r.q.y1.toFixed(2)})`);
  r.dark === true ? ok() : bad('BL6', 'dark bands on a light film were not recognised');
  const rel = r.t.map(v => v / r.t[0]), want = amps.map(a => a / amps[0]);
  const worst = Math.max(...rel.map((v, i) => Math.abs(v - want[i]) / want[i]));
  worst < 0.05 ? ok() : bad('BL6', `relative band signal off by ${(worst * 100).toFixed(1)}% (got ${rel.map(v => v.toFixed(2)).join(' ')})`);
  const norm = r.t.map((v, i) => v / r.l[i]), nrel = norm.map(v => v / norm[0]), nwant = amps.map((a, i) => (a / lcA[i]) / (amps[0] / lcA[0]));
  const nworst = Math.max(...nrel.map((v, i) => Math.abs(v - nwant[i]) / nwant[i]));
  nworst < 0.06 ? ok() : bad('BL6', `normalised to the loading control off by ${(nworst * 100).toFixed(1)}%`);
  r.sat.every(s => s > 0.005) && r.tsat.every(s => s <= 0.005) ? ok() : bad('BL6', 'saturation: flagged on the clean panel or missed on the saturated one');
  /Loading/.test(r.shown) ? ok() : bad('BL6', 'the table does not show the loading control');
  if (!r.csv) bad('BL6', 'no CSV was written');
  else {
    const lines = r.csv.replace(/^﻿/, '').trim().split(/\r\n/), head = lines[0].split(',');
    lines.length === 13 ? ok() : bad('BL6', `CSV has ${lines.length - 1} lanes`);
    const iRel = head.findIndex(h => /^Target relative/.test(h)), row3 = lines[3].split(',');
    Math.abs(+row3[iRel] - nwant[2]) / nwant[2] < 0.06 ? ok() : bad('BL6', `CSV relative for lane 3 is ${row3[iRel]}, ${nwant[2].toFixed(3)} expected`);
    /'=HYPERLINK/.test(lines[4]) ? ok() : bad('BL6', 'a lane label starting with = left the CSV as a formula');
  }
  p.errs.length ? bad('BL6', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL7')) await guard('BL7', async () => {
  const p = await open();
  await p.evaluate(GEL + `;(() => { var g = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]); FIG.panels[0].cropped = g; FIG.panels[0].src = g; FIG.panels[0].prot = 'BRD4'; save(); render(); openMarkers(0); })()`);
  await sleep(500);
  const state = await p.evaluate(() => ({ tool: AN.tool, tab: document.getElementById('rb-tab-format').textContent, shown: !document.getElementById('rb-tab-format').hidden, dialog: !!document.getElementById('mk-back') }));
  state.tool === 'mk' && state.tab === 'Markers' && state.shown && !state.dialog ? ok() : bad('BL7', 'markers did not open in place: ' + JSON.stringify(state));
  const img = async () => p.locator('.panel-blot .blot-img').first().boundingBox();
  let box = await img();
  await p.evaluate(() => mkPick(3)); // 70 kDa in PageRuler Plus
  await p.mouse.move(box.x + box.width / 2, box.y + box.height * 0.5);
  const guide = await p.evaluate(() => { var g = document.getElementById('an-mkg-0'); return g && g.style.display !== 'none' && g.querySelector('text').textContent; });
  guide === '70 kDa' ? ok() : bad('BL7', 'the guide does not say which size the next click places: ' + guide);
  await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.25);
  box = await img();
  await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.7); // the next size, 55 kDa
  box = await img();
  // drag the 70 kDa dot (left edge of the picture) down to 40% of the height
  const grip = await p.locator('.an-mk-grip[data-k="70"]').boundingBox();
  await p.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await p.mouse.down();
  await p.mouse.move(grip.x + grip.width / 2, box.y + box.height * 0.4, { steps: 5 }); await p.mouse.up();
  const r = await p.evaluate(async () => {
    mkDone(); await new Promise(r => setTimeout(r, 200));
    var m = FIG.panels[0].marks, img = document.querySelector('.panel-blot .blot-img').getBoundingClientRect(), mk = [...document.querySelectorAll('.panel-kda .mk')].map(e => { var b = e.querySelector('.mk-t').getBoundingClientRect(); return { k: e.textContent.trim(), y: (b.top + b.height / 2 - img.top) / img.height }; });
    var cv = await renderFigureCanvas(1), x = cv.getContext('2d'), fr = document.getElementById('figure').getBoundingClientRect(), t = document.querySelector('.panel-kda .mk-t').getBoundingClientRect();
    var px = x.getImageData(Math.round(t.left - fr.left + 18 + t.width / 2), Math.round(t.top - fr.top + 18 + t.height / 2), 1, 1).data;
    return { m: m, mk: mk, px: [px[0], px[1], px[2]], kdaHidden: !document.querySelector('.panel-kda[data-pi="0"] .lbl-in'), tool: AN.tool, undo: UNDO.length };
  });
  r.m.length === 2 && r.m[0].k === 55 === false ? 0 : 0;
  const m70 = r.m.find(x => x.k === 70), m55 = r.m.find(x => x.k === 55);
  r.m.length === 2 && m70 && Math.abs(m70.y - 0.4) < 0.03 && m55 && Math.abs(m55.y - 0.7) < 0.02 ? ok() : bad('BL7', 'markers stored (70 dragged to .4, 55 at .7): ' + JSON.stringify(r.m));
  r.mk.length === 2 && r.mk.every(x => { var q = r.m.find(y => y.k === +x.k); return q && Math.abs(x.y - q.y) < 0.02; }) ? ok() : bad('BL7', 'the markers are not drawn at their heights: ' + JSON.stringify(r.mk));
  r.px[0] < 160 ? ok() : bad('BL7', 'the export does not draw the marker tick (pixel ' + r.px.join(',') + ')');
  r.kdaHidden ? ok() : bad('BL7', 'with markers set, the single kDa label is still drawn beside them');
  r.tool === 'select' ? ok() : bad('BL7', 'Done did not leave the marker tool');
  p.errs.length ? bad('BL7', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL8')) await guard('BL8', async () => {
  const p = await open();
  const r = await p.evaluate(GEL + `;(async () => { var g = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5], { noise: 0 }); FIG.panels[0].src = g; FIG.panels[0].cropped = g; save();
    var px = async u => { var im = new Image(); im.src = u; await im.decode(); var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; var x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(5, 5, 1, 1).data[0]; };
    openCrop(0); await new Promise(r => setTimeout(r, 400)); _crop.rect = { x: 0, y: 0, w: el('crop-canvas').width, h: el('crop-canvas').height };
    adjSet('inv', true); confirmCrop(); var inv = await px(FIG.panels[0].cropped), a1 = JSON.stringify(FIG.panels[0].adj);
    openCrop(0); await new Promise(r => setTimeout(r, 400)); var kept = document.getElementById('adj-inv').checked;
    adjSet('inv', false); adjSet('lo', 0); adjSet('hi', 128); confirmCrop(); var lev = await px(FIG.panels[0].cropped);
    openCrop(0); await new Promise(r => setTimeout(r, 400)); adjReset(); adjSet('rot', 12); confirmCrop();
    return { inv: inv, a1: a1, kept: kept, lev: lev, rot: FIG.panels[0].adj && FIG.panels[0].adj.rot }; })()`);
  r.inv < 20 ? ok() : bad('BL8', `invert did not reach the cropped picture (corner ${r.inv}, 245 → ~10 expected)`);
  /"inv":true/.test(r.a1) && r.kept ? ok() : bad('BL8', 'the adjustment was not remembered for the next crop');
  r.lev >= 250 ? ok() : bad('BL8', `levels did not reach the picture (corner ${r.lev})`);
  r.rot === 12 ? ok() : bad('BL8', 'the rotation was not kept');
  await p.context().close();
});

if (run('BL9')) await guard('BL9', async () => {
  const p = await open();
  const r = await p.evaluate(GEL + `;(async () => { var big = __noise(1200, 800); FIG.panels[0].src = big; FIG.panels[0].cropped = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]); FIG.panels[0].prot = 'BRD4'; save();
    await saveHistory(); var h = BSTORE.history[0], size = JSON.stringify(BSTORE).length;
    // Another device: none of the pictures are here.
    await _bIdb('img', 'readwrite', st => st.clear()); _bHave.clear();
    FIG = defaultFig(); render(); loadHistoryEntry(0); await new Promise(r => setTimeout(r, 700));
    return { refs: /^idb:/.test(h.fig.panels[0].src) && /^idb:/.test(h.fig.panels[0].cropped), pv: !!(h.pv && h.pv[h.fig.panels[0].id]), size: size,
      loaded: /^data:image\\/jpeg/.test(FIG.panels[0].cropped || ''), prot: FIG.panels[0].prot, srcRef: /^idb:/.test(FIG.panels[0].src || '') }; })()`);
  r.refs && r.pv ? ok() : bad('BL9', 'a saved figure did not keep references and a preview');
  r.size < 150000 ? ok() : bad('BL9', `the saved list is ${Math.round(r.size / 1024)} KB with one figure`);
  r.loaded && r.prot === 'BRD4' ? ok() : bad('BL9', 'on a device without the originals the figure did not open from its preview');
  r.srcRef ? ok() : bad('BL9', 'the original\'s reference was lost when it opened from a preview');
  await p.context().close();
});

if (run('BL10')) await guard('BL10', async () => {
  const p = await open();
  const r = await p.evaluate(() => { var sent = null, ref = { on: function(ev, cb){ cb({ val: function(){ return { updated: 1, history: [], presets: [] }; } }); }, set: function(v){ sent = v; return Promise.resolve(); }, off: function(){} };
    BSTORE.presets = [{ id: 'pr1', name: 'Offline preset', fig: defaultFig() }]; BSTORE.updated = Date.now(); _bFbRef = ref; bInitSync();
    return { sent: !!sent && sent.presets && sent.presets[0] && sent.presets[0].name }; });
  r.sent === 'Offline preset' ? ok() : bad('BL10', 'a list newer here than in the cloud was not sent up');
  await p.context().close();
});

if (run('BL11')) await guard('BL11', async () => {
  const HOST = `<!doctype html><meta charset=utf-8><body style="margin:0">
<iframe id="frame-labbook" src="/apps/labbook/labbook.html" style="width:1300px;height:900px;border:0"></iframe>
<iframe id="frame-blot" src="/${FILE}" style="width:1300px;height:900px;border:0;display:none"></iframe>
<script>window.__acks={}; function show(id){ ['labbook','blot'].forEach(function(k){ document.getElementById('frame-'+k).style.display=k===id?'block':'none'; }); window.__cur=id; }
window.openApp=function(id,tab,item,ctx){ show(id); if(!ctx) return; var rid='r'+Math.random().toString(36).slice(2), msg={type:'dhub:context',version:1,source:ctx.source,target:id,context:ctx,requestId:rid}, n=0;
 (function send(){ if(window.__acks[rid]||n++>10) return; try{ document.getElementById('frame-'+id).contentWindow.postMessage(msg,'*'); }catch(e){} setTimeout(send,250); })(); };
window.addEventListener('message',function(e){ if(e.data&&e.data.type==='dhub:ack') window.__acks[e.data.requestId]=1; });</script>`;
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route(BASE + '/__bhost.html', r => r.fulfill({ contentType: 'text/html', body: HOST }));
  await page.goto(BASE + '/__bhost.html');
  const lb = page.frame({ url: /\/apps\/labbook\// }), bl = page.frame({ url: /western-blot/ });
  await lb.waitForFunction(() => window.LB && LB.data && (LB.data.projects || []).length && LB.data.presets, null, { timeout: 25000 });
  await bl.waitForFunction(() => typeof sendToLabbook === 'function', null, { timeout: 15000 });
  const expId = await lb.evaluate(() => { var before = new Set(Object.keys(LB.data.experiments)); var P = LB.data.projects.find(p => (p.sections || []).length);
    openNew(P.id, P.sections[0].id); el('nm-type').value = 'WB'; nmUpdateCode(); nmResetSetup(); nmProtos(); nmSetup(); nmPreview(); createExperiment(); closeNew();
    var id = Object.keys(LB.data.experiments).find(k => !before.has(k)); openExp(id); return id; });
  await bl.evaluate(GEL + `;(() => { var g = __gel([.2,.4,.6,.8,.2,.4,.6,.8,.2,.4,.6,.8]); FIG.panels[0].src = g; FIG.panels[0].cropped = g; FIG.panels[0].prot = 'BRD4'; FIG.panels[1].src = g; FIG.panels[1].cropped = g; FIG.panels[1].prot = 'GAPDH'; FIG.lanes[0] = 'DMSO'; save(); render(); })()`);
  await page.evaluate(() => show('blot'));
  // Blot is opened from an experiment, so Send knows where to go.
  await bl.evaluate(id => { _lbFig = { exp: id }; sendToLabbook(); }, expId);
  await sleep(3500);
  const f1 = await lb.evaluate(id => { var fs = (LB.data.experiments[id].files || []).filter(f => f.blot); return fs.map(f => ({ id: f.id, bid: f.blot.id, panels: f.blot.design.fig.panels.length, pv: Object.keys(f.blot.design.pv || {}).length, name: f.name, cap: f.caption })); }, expId);
  f1.length === 1 && f1[0].panels === 2 && f1[0].pv === 2 ? ok() : bad('BL11', 'Send to Labbook did not file the figure with its design: ' + JSON.stringify(f1));
  f1.length && /BRD4_GAPDH_blot\.png/.test(f1[0].name) ? ok() : bad('BL11', 'the file in Labbook is not named after the proteins');
  if (f1.length) {
    await lb.evaluate(([id, fid]) => { var f = LB.data.experiments[id].files.find(x => x.id === fid); f.caption = 'Written in Labbook'; save(); }, [expId, f1[0].id]);
    // Edit in Blot, from a Blot that has meanwhile moved on to another figure.
    await bl.evaluate(() => { FIG = defaultFig(); FIG.panels[0].prot = 'Other'; _lbFig = null; render(); save(); });
    await page.evaluate(() => show('labbook'));
    const hasBtn = await lb.evaluate(([id, fid]) => { renderEditor(); return !!document.querySelector('[onclick*="openFigureInBlot"]'); }, [expId, f1[0].id]);
    hasBtn ? ok() : bad('BL11', 'Labbook offers no Edit in Blot on the filed figure');
    await lb.evaluate(([id, fid]) => openFigureInBlot('exp:' + id, fid), [expId, f1[0].id]);
    await sleep(2500);
    const opened = await bl.evaluate(() => ({ prots: FIG.panels.map(p => _stripHtml(p.prot)), lane: FIG.lanes[0], img: FIG.panels.every(p => /^data:image/.test(p.cropped || '')), lb: _lbFig && _lbFig.id, btn: (el('exp-labbook') || {}).textContent, kept: BSTORE.history.some(h => (h.fig.panels || []).some(p => p.prot === 'Other')) }));
    opened.prots.join(',') === 'BRD4,GAPDH' && opened.lane === 'DMSO' && opened.img ? ok() : bad('BL11', 'Edit in Blot did not open the figure as it was: ' + JSON.stringify(opened));
    opened.lb === f1[0].bid && /Update in Labbook/.test(opened.btn) ? ok() : bad('BL11', 'Blot does not know it is editing a Labbook figure');
    // The figure Blot had on screen is kept: it had no picture, so nothing needed keeping — only check no error.
    await bl.evaluate(() => { FIG.panels[0].prot = 'BRD4 (24 h)'; save(); render(); sendToLabbook(); });
    await sleep(3500);
    const f2 = await lb.evaluate(id => (LB.data.experiments[id].files || []).filter(f => f.blot).map(f => ({ id: f.id, cap: f.caption, prot: f.blot.design.fig.panels[0].prot })), expId);
    f2.length === 1 && f2[0].id === f1[0].id && f2[0].prot === 'BRD4 (24 h)' ? ok() : bad('BL11', 'Update did not replace the same file: ' + JSON.stringify(f2));
    f2.length && f2[0].cap === 'Written in Labbook' ? ok() : bad('BL11', 'the caption written in Labbook was lost on update');
  }
  errs.length ? bad('BL11', 'errors: ' + errs.slice(0, 3).join(' | ')) : ok();
  await ctx.close();
});

if (run('BL13')) await guard('BL13', async () => {
  const p = await open();
  const r = await p.evaluate(async () => {
    function tiff(w, h, vals, photometric) { const ifdOff = 8, nEnt = 9, dataOff = ifdOff + 2 + nEnt * 12 + 4, buf = new ArrayBuffer(dataOff + w * h * 2), dv = new DataView(buf);
      dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); dv.setUint16(2, 42, true); dv.setUint32(4, ifdOff, true); dv.setUint16(ifdOff, nEnt, true); let o = ifdOff + 2;
      const ent = (tag, type, cnt, val) => { dv.setUint16(o, tag, true); dv.setUint16(o + 2, type, true); dv.setUint32(o + 4, cnt, true); if (type === 3) dv.setUint16(o + 8, val, true); else dv.setUint32(o + 8, val, true); o += 12; };
      ent(256, 3, 1, w); ent(257, 3, 1, h); ent(258, 3, 1, 16); ent(259, 3, 1, 1); ent(262, 3, 1, photometric); ent(273, 4, 1, dataOff); ent(277, 3, 1, 1); ent(278, 3, 1, h); ent(279, 4, 1, w * h * 2);
      dv.setUint32(o, 0, true); for (let i = 0; i < w * h; i++) dv.setUint16(dataOff + i * 2, vals[i], true); return buf; }
    const w = 200, h = 60, vals = new Uint16Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) vals[y * w + x] = Math.round(300 + Math.exp(-((y - 30) ** 2) / 40) * (x > 20 && x < 80 ? 1 : x > 100 && x < 160 ? 0.5 : 0) * 3700);
    const out = {};
    for (const ph of [1, 0]) {
      FIG.panels[0].src = null; loadImageFile(0, new File([tiff(w, h, vals, ph)], 'g' + ph + '.tif', { type: 'image/tiff' })); await new Promise(r => setTimeout(r, 800));
      const im = new Image(); im.src = FIG.panels[0].src; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let mn = 255, mx = 0, bandMid = 0, half = 0; for (let i = 0; i < d.length; i += 4) { mn = Math.min(mn, d[i]); mx = Math.max(mx, d[i]); }
      bandMid = d[(30 * w + 50) * 4]; half = d[(30 * w + 130) * 4]; const bg = d[(5 * w + 5) * 4];
      out['p' + ph] = { mn, mx, bandMid, half, bg, flag: FIG.panels[0].bits16 === true }; closeCrop();
    }
    return out;
  });
  const a = r.p1, b = r.p0;
  a.mx - a.mn >= 250 ? ok() : bad('BL13', `a 16-bit scan using 0-4000 came out spanning ${a.mn}-${a.mx} of 255`);
  Math.abs((a.half - a.bg) / (a.bandMid - a.bg) - 0.5) < 0.03 ? ok() : bad('BL13', `a band half as strong is ${(a.half - a.bg)}/${(a.bandMid - a.bg)} of the strong one, not one half`);
  b.mx - b.mn >= 250 && b.bandMid < b.bg ? ok() : bad('BL13', 'a WhiteIsZero 16-bit scan was not inverted and spread');
  a.flag ? ok() : bad('BL13', 'the panel does not remember it was 16-bit');
  await p.context().close();
});

if (run('BL14')) await guard('BL14', async () => {
  const p = await open();
  const amps = [0.15, 0.3, 0.6, 0.9, 0.45, 0.2, 0.05, 0.75, 0.3, 0.6, 0.15, 0.9];
  const r = await p.evaluate(GEL + `;(async A => {
    var g = __gel(A), img = new Image(); img.src = g; await img.decode();
    var pn = FIG.panels[0]; pn.src = g; pn.crop = { x: 0, y: 0, w: 600, h: 120 }; pn.prot = 'T';
    var measure = async () => { pn.quant = undefined; var r = await _dnMeasurePanel(0); return r.map(x => x.vol); };
    pn.cropped = g; pn.adj = null; var plain = await measure();
    var adj = { rot: 0, lo: 90, hi: 170, inv: true }, c = _adjCanvas(img, adj, 1); pn.cropped = c.toDataURL('image/png'); pn.adj = adj;
    var shown = await measure();
    // a box stored before the migration (no v) on an inverted panel: polarity must be flipped, the box kept
    pn.quant = { y0: 0.3, y1: 0.7, dark: false }; var before = JSON.stringify(pn.quant); await _dnMeasurePanel(0);
    return { plain: plain, shown: shown, migrated: pn.quant }; })(${JSON.stringify(amps)})`);
  const rel = v => v.map(x => x / v[0]), want = amps.map(a => a / amps[0]);
  const worst = Math.max(...rel(r.shown).map((v, i) => Math.abs(v - want[i]) / want[i]));
  worst < 0.05 ? ok() : bad('BL14', `levels 90-170 + invert changed the relative signals by ${(worst * 100).toFixed(1)}% (got ${rel(r.shown).map(v => v.toFixed(2)).join(' ')})`);
  const same = Math.max(...r.plain.map((v, i) => Math.abs(v - r.shown[i]) / Math.max(1, v)));
  same < 0.02 ? ok() : bad('BL14', `the same gel gives different signals with and without levels (${(same * 100).toFixed(1)}%)`);
  r.migrated.v === 2 && r.migrated.dark === true && r.migrated.y0 === 0.3 ? ok() : bad('BL14', 'a stored box from before was not migrated (polarity flipped, box kept): ' + JSON.stringify(r.migrated));
  await p.context().close();
});

if (run('BL15')) await guard('BL15', async () => {
  const p = await open();
  await p.evaluate(GEL + `;(() => { var g = __gel([.2,.4,.6,.8,.2,.4,.6,.8,.2,.4,.6,.8]); FIG.panels[0].src = g; FIG.panels[0].cropped = g; FIG.panels[0].prot = 'BRD4'; FIG.panels[0].crop = { x: 0, y: 0, w: 600, h: 120 }; save(); render(); })()`);
  await sleep(300);
  const dialogs = [['crop-back', 'openCrop(0)', 'closeCrop'], ['dn-back', 'openQuant(0)', 'closeQuant'], ['sr-back', 'srOpen()', 'srClose'], ['hist-back', 'openHistoryModal()', 'closeHistoryModal'], ['preset-back', 'openPresetsModal()', 'closePresetsModal']];
  for (const [id, open_, close_] of dialogs) {
    await p.evaluate(() => { const b = document.getElementById('exp-labbook') || document.querySelector('.toolbar .btn'); b && b.focus(); });
    const before = await p.evaluate(() => { const e = document.activeElement; e.setAttribute('data-opener', '1'); return e.tagName; });
    await p.evaluate(open_); await sleep(500);
    const r = await p.evaluate(id => { const b = document.getElementById(id), m = b.querySelector('.modal'), t = m.querySelector('h3'), c = b.querySelector('.iconbtn');
      const f = [...b.querySelectorAll('button,input,select,textarea')].filter(e => e.getClientRects().length && !e.disabled);
      return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'), name: !!(t && m.getAttribute('aria-labelledby') === t.id), close: c && c.getAttribute('aria-label'), w: c && c.getBoundingClientRect().width, inside: b.contains(document.activeElement), n: f.length }; }, id);
    if (r.role !== 'dialog' || r.modal !== 'true' || !r.name) bad('BL15', `${id}: role=${r.role} modal=${r.modal} named=${r.name}`); else ok();
    if (r.close !== 'Close' || r.w < 28) bad('BL15', `${id}: the close button is "${r.close}" ${r.w}px`); else ok();
    if (!r.inside) bad('BL15', `${id}: focus did not move into the dialog`); else ok();
    // Tab from the last control stays inside
    const stay = await p.evaluate(id => { const b = document.getElementById(id), f = [...b.querySelectorAll('button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => e.getClientRects().length && !e.disabled); f[f.length - 1].focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); return b.contains(document.activeElement); }, id);
    await p.keyboard.press('Tab'); const stay2 = await p.evaluate(id => document.getElementById(id).contains(document.activeElement), id);
    if (!stay || !stay2) bad('BL15', `${id}: Tab leaves the dialog`); else ok();
    await p.keyboard.press('Escape'); await sleep(350);
    const back = await p.evaluate(id => ({ closed: !document.getElementById(id).classList.contains('open'), opener: document.activeElement && document.activeElement.getAttribute('data-opener') === '1' }), id);
    if (!back.closed) bad('BL15', `${id}: Esc does not close it`); else ok();
    if (!back.opener) bad('BL15', `${id}: focus did not go back to the control that opened it`); else ok();
    await p.evaluate(() => document.querySelectorAll('[data-opener]').forEach(e => e.removeAttribute('data-opener')));
    await p.evaluate(close_ + '()').catch(() => {});
  }
  const q = await p.evaluate(() => {
    const labs = [...document.querySelectorAll('.lbl-in,.grp-lbl')];
    const ring = (() => { const l = document.querySelector('.lane-cell .lbl-in'); l.focus(); const cs = getComputedStyle(l); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2; })();
    // the steppers are spread over the ribbon's tabs now (Lanes on Home, Width / Gap / Size on Layout): open each to measure them
    const st = []; for (const t of ['home', 'layout']) { rbTab(t); [...document.querySelectorAll('.rb-pane.on .tb-step button')].forEach(b => st.push({ w: b.getBoundingClientRect().width, n: b.getAttribute('aria-label') })); } rbTab('home');
    const inp = [...document.querySelectorAll('.tb-step input')].map(i => i.getAttribute('aria-label'));
    const root = getComputedStyle(document.documentElement);
    return { labs: labs.length, unnamed: labs.filter(l => l.getAttribute('role') !== 'textbox' || !l.getAttribute('aria-label')).length, ring, smallStep: st.filter(x => x.w < 24 || !x.n).length, inp: inp.filter(x => !x), toast: document.getElementById('toast').getAttribute('role'), tokens: ['--good', '--warn', '--danger', '--shadow-xs'].filter(t => !root.getPropertyValue(t).trim()) };
  });
  q.labs && !q.unnamed ? ok() : bad('BL15', `${q.unnamed} of ${q.labs} editable labels are not named textboxes`);
  q.ring ? ok() : bad('BL15', 'an editable label shows no focus ring');
  !q.smallStep && !q.inp.length ? ok() : bad('BL15', `${q.smallStep} stepper buttons are under 24px or unnamed, ${q.inp.length} unnamed number boxes`);
  q.toast === 'status' ? ok() : bad('BL15', 'the toast is not role=status');
  !q.tokens.length ? ok() : bad('BL15', 'tokens missing: ' + q.tokens.join(', '));
  await p.context().close();
});

// ── Annotations, ribbon, series, drop ───────────────────────────────────────────────────────
// A page with one gel in panel 0 (the others empty), 12 lanes. Shapes are drawn below the top 45px, where the panel's hover bar sits.
const withGel = async (opts) => {
  const p = await open(opts);
  await p.evaluate(GEL + `;(() => { var g = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]); FIG.panels[0].cropped = g; FIG.panels[0].src = g; FIG.panels[0].prot = 'BRD4'; save(); render(); })()`);
  await sleep(400); return p;
};
const imgBox = p => p.locator('.panel-blot .blot-img').first().boundingBox();
const shapes = p => p.evaluate(() => FIG.panels[0].shapes);
// Open a ribbon tab the way a person does: a click, except on the tab already open (clicking that one folds the ribbon away).
const tab = async (p, n) => { const on = await p.evaluate(n => { var r = document.getElementById('ribbon'); return r.dataset.tab === n && r.dataset.collapsed !== '1'; }, n); if (!on) await p.click('#rb-tab-' + n); };

if (run('BL16')) await guard('BL16', async () => {
  const p = await withGel();
  const r = await p.evaluate(() => {
    window.__x = 0;
    var many = []; for (var i = 0; i < 500; i++) many.push({ t: 'line', x1: 0, y1: 0, x2: 1, y2: 1 });
    var hostile = [
      { t: '__proto__' }, { t: 'constructor' }, { t: 'script' }, null, 5, 'x',
      { t: 'text', s: '<img src=x onerror="window.__x=1">\u0001\u0007ok', x: 'abc', y: NaN, fs: 1e9, col: 'red;background:url(//evil)', ff: '__proto__', op: -4, rot: 1e9, al: 'z' },
      { t: 'rect', x: 1e9, y: -1e9, w: -5, h: Infinity, sw: 1e9, fill: 'url(#x)', fo: 7, dash: 'evil' },
      { t: 'line', x1: null, y1: undefined, x2: '0.5', y2: {}, head: 'both;', hs: 'XL', sw: 0, id: '<b>' },
      { t: 'line', id: 'dup' }, { t: 'line', id: 'dup' }
    ].concat(many);
    var c = anClean(hostile);
    var txt = c.find(s => s.t === 'text'), rect = c.find(s => s.t === 'rect'), ln = c.filter(s => s.t === 'line');
    var ids = c.map(s => s.id), fin = c.every(s => Object.keys(s).every(k => typeof s[k] !== 'number' || isFinite(s[k])));
    FIG.panels[0].shapes = c; render();
    var layer = document.querySelector('.an-layer'), foreign = layer.querySelectorAll('img,script,foreignObject,iframe,style').length;
    var texts = [...layer.querySelectorAll('text')].map(x => x.textContent).join('|');
    return { types: c.every(s => ['line', 'rect', 'ellipse', 'text'].indexOf(s.t) >= 0), n: c.length, txt: txt, rect: rect, ln0: ln[0], uniq: new Set(ids).size === ids.length, fin: fin, x: window.__x, foreign: foreign, texts: texts, dupIds: ids.filter(i => i === 'dup').length, errs: 0 };
  });
  r.n <= 200 ? ok() : bad('BL16', 'a panel took ' + r.n + ' shapes');
  r.types ? ok() : bad('BL16', 'a shape of an unknown type (__proto__, constructor, script) got through');
  r.txt && r.txt.s === '<img src=x onerror="window.__x=1">ok' && r.txt.col === '#111111' && r.txt.ff === 'sans' && r.txt.fs <= 160 && r.txt.op >= 0.05 && r.txt.al === 'c' ? ok() : bad('BL16', 'a hostile text was kept as it came: ' + JSON.stringify(r.txt));
  r.rect && r.rect.fill === null && r.rect.dash === 'solid' && r.rect.fo <= 1 && r.rect.sw <= 24 && r.rect.w > 0 && r.rect.x <= 4 ? ok() : bad('BL16', 'a hostile box was not brought into range: ' + JSON.stringify(r.rect));
  r.ln0 && r.ln0.head === 'none' && r.ln0.hs === 'M' && /^[\w-]{1,24}$/.test(r.ln0.id) ? ok() : bad('BL16', 'a hostile line kept a bad head or id: ' + JSON.stringify(r.ln0));
  r.uniq && r.dupIds <= 1 ? ok() : bad('BL16', 'two shapes share an id');
  r.fin ? ok() : bad('BL16', 'a shape holds a number that is not finite');
  r.x === 0 && r.foreign === 0 ? ok() : bad('BL16', 'markup in a text ran or reached the page (x=' + r.x + ', ' + r.foreign + ' foreign)');
  r.texts.indexOf('<img src=x') >= 0 ? ok() : bad('BL16', 'the typed text is not shown as text: ' + r.texts);
  // survives: reload, portable copy, preset
  const keep = await p.evaluate(async () => {
    FIG.panels[0].shapes = anClean([{ t: 'line', x1: .1, y1: .6, x2: .3, y2: .6, head: 'end', col: '#c04040' }, { t: 'text', x: .6, y: .7, s: 'HA' }]); save(); render();
    var port = await _bPortable(FIG), back = await _bFromPortable(JSON.parse(JSON.stringify(port)));
    var pre = JSON.parse(JSON.stringify(FIG)); pre.panels.forEach(q => { q.src = null; q.crop = null; q.cropped = null; });
    var mig = migrateFig(JSON.parse(JSON.stringify(pre)));
    return { portable: back.fig.panels[0].shapes.length, preset: mig.panels[0].shapes.length, col: back.fig.panels[0].shapes[0].col };
  });
  keep.portable === 2 && keep.preset === 2 && keep.col === '#c04040' ? ok() : bad('BL16', 'shapes did not travel with the figure: ' + JSON.stringify(keep));
  await p.reload(); await p.waitForFunction(() => typeof FIG === 'object' && FIG && FIG.panels[0].cropped, null, { timeout: 15000 }); await sleep(400);
  const after = await shapes(p);
  after.length === 2 && after[1].s === 'HA' ? ok() : bad('BL16', 'the shapes did not come back after a reload: ' + JSON.stringify(after));
  p.errs.length ? bad('BL16', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL17')) await guard('BL17', async () => {
  const p = await withGel();
  const box = await imgBox(p);
  await tab(p, 'insert'); await p.click('[data-tool="arrow"]');
  const u0 = await p.evaluate(() => UNDO.length);
  await p.mouse.move(box.x + box.width * .8, box.y + box.height * .6); await p.mouse.down();
  await p.mouse.move(box.x + box.width * .55, box.y + box.height * .75, { steps: 8 }); await p.mouse.up(); await sleep(150);
  let s = await shapes(p);
  s.length === 1 && s[0].head === 'end' && Math.abs(s[0].x1 - .8) < .01 && Math.abs(s[0].x2 - .55) < .01 && Math.abs(s[0].y1 - .6) < .02 && Math.abs(s[0].y2 - .75) < .02 ? ok() : bad('BL17', 'an arrow drawn by dragging is not where it was drawn: ' + JSON.stringify(s));
  const st = await p.evaluate(() => ({ tool: AN.tool, tab: document.getElementById('ribbon').dataset.tab, sel: AN.ids.length, u: UNDO.length }));
  st.tool === 'select' && st.tab === 'format' && st.sel === 1 ? ok() : bad('BL17', 'after drawing: tool/tab/selection ' + JSON.stringify(st));
  st.u === u0 + 1 ? ok() : bad('BL17', 'drawing an arrow is ' + (st.u - u0) + ' undo steps, not one');
  // a click, not a drag, points at what was clicked
  await tab(p, 'insert'); await p.click('[data-tool="arrow"]');
  await p.mouse.click(box.x + box.width * .3, box.y + box.height * .85); await sleep(120);
  s = await shapes(p); const a2 = s[1];
  a2 && Math.abs(a2.x2 - .3) < .005 && Math.abs((a2.x1 - a2.x2) * box.width - 48) < 1.5 && a2.head === 'end' ? ok() : bad('BL17', 'a click did not make a 48px arrow pointing at it: ' + JSON.stringify(a2));
  // undo / redo walk back through them
  await p.evaluate(() => blotUndo()); s = await shapes(p);
  s.length === 1 ? ok() : bad('BL17', 'undo did not remove the second arrow');
  await p.evaluate(() => blotUndo()); s = await shapes(p);
  s.length === 0 ? ok() : bad('BL17', 'undo did not remove the first arrow');
  const gone = await p.evaluate(() => ({ layer: document.querySelectorAll('.an-s').length, sel: AN.ids.length, tabHidden: document.getElementById('rb-tab-format').hidden }));
  gone.layer === 0 && gone.sel === 0 && gone.tabHidden ? ok() : bad('BL17', 'after undo the layer, the selection or the Format tab still show it: ' + JSON.stringify(gone));
  await p.evaluate(() => { blotRedo(); blotRedo(); }); s = await shapes(p);
  s.length === 2 ? ok() : bad('BL17', 'redo did not bring both back');
  p.errs.length ? bad('BL17', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL18')) await guard('BL18', async () => {
  const p = await withGel();
  const r = await p.evaluate(async () => {
    FIG.panels[0].shapes = anClean([
      { id: 'bx', t: 'rect', x: .1, y: .55, w: .15, h: .3, col: '#ff0000', sw: 3, fill: '#00ff00', fo: 1 },
      { id: 'ar', t: 'line', x1: 1.1, y1: .3, x2: 1.0, y2: .3, head: 'end', col: '#0000ff', sw: 4 },
      { id: 'tx', t: 'text', x: .6, y: .7, s: 'Ub', fs: 30, b: true, col: '#ff00ff' }
    ]); save(); render(); await new Promise(r => setTimeout(r, 200));
    var im = document.querySelector('.panel-blot .blot-img').getBoundingClientRect(), fig = document.getElementById('figure').getBoundingClientRect();
    var base = anOverhang(fig);
    var cv = await renderFigureCanvas(1), x = cv.getContext('2d'), W = im.width, H = im.height;
    var ox = im.left - fig.left + 18 + base.l, oy = im.top - fig.top + 18 + base.t;
    var px = (fx, fy) => { var d = x.getImageData(Math.round(ox + fx * W), Math.round(oy + fy * H), 1, 1).data; return [d[0], d[1], d[2]]; };
    // what the screen's SVG says
    var ln = document.querySelector('.an-s[data-id="ar"] line:not(.an-hit)'), rc = document.querySelector('.an-s[data-id="bx"] rect:not(.an-hit)');
    var svg = { lx1: +ln.getAttribute('x1'), ly: +ln.getAttribute('y1'), rw: +rc.getAttribute('width') };
    var wide = cv.width, figW = Math.round(fig.width + 36);
    return { base: base, wide: wide, figW: figW, fill: px(.175, .7), edge: px(.1, .7), shaft: px(1.05, .3), text: (() => { var n = 0; for (var dx = -20; dx <= 20; dx += 2) for (var dy = -14; dy <= 14; dy += 2) { var q = px(.6 + dx / W, .7 + dy / H); if (q[0] > 200 && q[1] < 80 && q[2] > 200) n++; } return n; })(), svg: svg, W: W };
  });
  r.fill[1] > 200 && r.fill[0] < 60 ? ok() : bad('BL18', 'the export does not fill the box with its colour: ' + r.fill);
  r.edge[0] > 200 && r.edge[1] < 60 ? ok() : bad('BL18', 'the export does not draw the box outline: ' + r.edge);
  r.shaft[2] > 200 && r.shaft[0] < 60 ? ok() : bad('BL18', 'the arrow beyond the figure is not in the export: ' + r.shaft);
  r.base.r >= 15 && r.wide >= r.figW + r.base.r - 2 ? ok() : bad('BL18', 'the export was not widened for an arrow that reaches past the figure (overhang ' + JSON.stringify(r.base) + ', ' + r.wide + ' vs ' + r.figW + ')');
  r.text > 5 ? ok() : bad('BL18', 'the text is not in the export (' + r.text + ' coloured pixels)');
  Math.abs(r.svg.lx1 - 1.1 * r.W) < .6 && Math.abs(r.svg.rw - .15 * r.W) < .6 ? ok() : bad('BL18', 'the screen draws a shape somewhere other than its stored fractions: ' + JSON.stringify(r.svg));
  // with nothing past the edge the export is its old size again
  const back = await p.evaluate(async () => { FIG.panels[0].shapes = []; render(); var cv = await renderFigureCanvas(1), fig = document.getElementById('figure').getBoundingClientRect(); return { w: cv.width, f: Math.round(fig.width + 36) }; });
  Math.abs(back.w - back.f) <= 1 ? ok() : bad('BL18', 'the export is ' + back.w + ' wide with no shapes (figure ' + back.f + ')');
  p.errs.length ? bad('BL18', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL19')) await guard('BL19', async () => {
  const p = await withGel();
  const c = async (sel) => { const b = await p.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  // a box, drawn with Shift, is square
  const box = await imgBox(p);
  await tab(p, 'insert'); await p.click('[data-tool="rect"]');
  await p.keyboard.down('Shift'); await p.mouse.move(box.x + box.width * .1, box.y + box.height * .5); await p.mouse.down();
  await p.mouse.move(box.x + box.width * .2, box.y + box.height * .6, { steps: 6 }); await p.mouse.up(); await p.keyboard.up('Shift'); await sleep(120);
  let s = (await shapes(p))[0];
  s && Math.abs(s.w * box.width - s.h * box.height) < 1.5 && s.w * box.width > 20 ? ok() : bad('BL19', 'a box drawn with Shift is not square: ' + JSON.stringify(s));
  await p.evaluate(() => anSet('fill', '#2d9462'));   // a filled box can be grabbed anywhere inside, which the locked-drag check below needs
  // move by dragging its edge; Shift holds an axis
  const id = s.id, x0 = s.x, y0 = s.y;
  const edge = await p.evaluate(id => { var r = document.querySelector('.an-s[data-id="' + id + '"] .an-hit').getBoundingClientRect(); return { x: r.left + r.width * .25, y: r.top + 1 }; }, id);   // a quarter along the top edge: the middle is the north handle
  await p.mouse.move(edge.x, edge.y); await p.mouse.down(); await p.mouse.move(edge.x + 60, edge.y + 4, { steps: 6 }); await p.mouse.up(); await sleep(100);
  s = (await shapes(p))[0];
  Math.abs((s.x - x0) * box.width - 60) < 2 && Math.abs((s.y - y0) * box.height - 4) < 2 ? ok() : bad('BL19', 'dragging moved the box by (' + ((s.x - x0) * box.width).toFixed(1) + ',' + ((s.y - y0) * box.height).toFixed(1) + ') not (60,4)');
  // arrow keys: 1px, Shift 10px
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowDown'); await sleep(60);
  const s2 = (await shapes(p))[0];
  Math.abs((s2.x - s.x) * box.width - 1) < .1 && Math.abs((s2.y - s.y) * box.height - 10) < .1 ? ok() : bad('BL19', 'arrow keys nudge by (' + ((s2.x - s.x) * box.width).toFixed(2) + ',' + ((s2.y - s.y) * box.height).toFixed(2) + ') not (1,10)');
  // resize by the south-east handle
  const w0 = s2.w;
  const se = await c('.an-h[data-h="se"]'); await p.mouse.move(se.x, se.y); await p.mouse.down(); await p.mouse.move(se.x + 40, se.y + 10, { steps: 5 }); await p.mouse.up(); await sleep(100);
  const s3 = (await shapes(p))[0];
  Math.abs((s3.w - w0) * box.width - 40) < 2 && Math.abs(s3.x - s2.x) < .001 ? ok() : bad('BL19', 'the corner handle did not grow the box by 40px with its corner fixed: ' + JSON.stringify([s2.x, s2.w, s3.x, s3.w]));
  // rotate: drag the round handle to the right of the centre = 90°
  const rot = await c('.an-h.rot'); const ctr = await p.evaluate(id => { var r = document.querySelector('.an-s[data-id="' + id + '"] .an-hit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, id);
  await p.mouse.move(rot.x, rot.y); await p.mouse.down(); await p.mouse.move(ctr.x + 80, ctr.y + 8, { steps: 6 }); await p.keyboard.down('Shift'); await p.mouse.move(ctr.x + 80, ctr.y + 6, { steps: 2 });
  await p.mouse.up(); await p.keyboard.up('Shift'); await sleep(100);   // ~94° by hand, 90° with Shift
  const s4 = (await shapes(p))[0];
  Math.abs(s4.rot - 90) < 1 ? ok() : bad('BL19', 'the rotate handle gave ' + s4.rot + '°, not 90°');
  // duplicate, order, align, lock, delete
  await p.keyboard.press('Control+d'); await sleep(100);
  let all = await shapes(p);
  all.length === 2 && all[1].id !== id && Math.abs(all[1].x - s4.x) > 0 ? ok() : bad('BL19', 'duplicate did not make an offset copy: ' + all.length);
  await p.evaluate(() => anOrder('back')); all = await shapes(p);
  all[0].id !== id ? ok() : bad('BL19', 'To back left the copy on top');
  await p.evaluate(() => anAlign('l')); const al = await p.evaluate(() => { var b = anBox(0), s = anSel()[0]; return anAABB(s, b.W, b.H).x0; });
  Math.abs(al) < .6 ? ok() : bad('BL19', 'Align left left the shape at x=' + al);
  await p.evaluate(() => { anOrder('front'); anLock(); }); const xl = (await shapes(p))[1].x;   // on top, so the pointer can land on it
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Delete'); await sleep(60);
  // and the pointer: a drag on a locked shape moves nothing
  const lk = await p.evaluate(() => { var r = document.querySelector('.an-s.lock .an-hit').getBoundingClientRect(); for (var fx = 0; fx <= 1; fx += .05) for (var fy = 0; fy <= 1; fy += .05) { var x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), g = e && e.closest && e.closest('.an-s'); if (g && g.classList.contains('lock')) return { x: x, y: y }; } return { x: r.left + 1, y: r.top + 1 }; });   // a point that is really on the locked one
  await p.mouse.move(lk.x, lk.y); await p.mouse.down(); await p.mouse.move(lk.x + 50, lk.y + 20, { steps: 5 }); await p.mouse.up(); await sleep(80);
  all = await shapes(p);
  all.length === 2 && all[1].x === xl ? ok() : bad('BL19', 'a locked shape moved or was deleted (' + all.length + ' left, x ' + xl + ' -> ' + (all[1] && all[1].x) + ')');
  await p.evaluate(() => anLock()); await p.keyboard.press('Delete'); await sleep(60);
  all = await shapes(p);
  all.length === 1 ? ok() : bad('BL19', 'Delete did not remove the unlocked shape');
  // Esc: let go; a click on empty stage lets go too
  await p.evaluate(() => anSelect([FIG.panels[0].shapes[0].id])); await p.keyboard.press('Escape');
  (await p.evaluate(() => AN.ids.length)) === 0 ? ok() : bad('BL19', 'Esc did not let go of the selection');
  p.errs.length ? bad('BL19', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL20')) await guard('BL20', async () => {
  const p = await withGel();
  const box = await imgBox(p);
  await tab(p, 'insert'); await p.click('[data-tool="text"]');
  await p.mouse.click(box.x + box.width * .5, box.y + box.height * .6); await sleep(150);
  (await p.locator('#an-edit').count()) === 1 ? ok() : bad('BL20', 'clicking with the text tool did not open a box to type in');
  await p.keyboard.type('HA <b>tag</b>'); await p.keyboard.press('Control+Enter'); await sleep(120);
  let r = await p.evaluate(() => ({ s: FIG.panels[0].shapes.map(x => x.s), bold: document.querySelectorAll('.an-layer b').length, shown: [...document.querySelectorAll('.an-layer text')].map(t => t.textContent).join('|'), edit: !!document.getElementById('an-edit') }));
  r.s.length === 1 && r.s[0] === 'HA <b>tag</b>' && r.bold === 0 && r.shown.indexOf('<b>tag</b>') >= 0 && !r.edit ? ok() : bad('BL20', 'typed text: ' + JSON.stringify(r));
  // a double-click opens it again; emptying it removes the shape
  const pt = await p.evaluate(() => { var r = document.querySelector('.an-s[data-t="text"] .an-hit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.dblclick(pt.x, pt.y); await sleep(150);
  (await p.locator('#an-edit').count()) === 1 ? ok() : bad('BL20', 'a double-click did not reopen the text');
  await p.keyboard.press('Control+a'); await p.keyboard.press('Delete'); await p.keyboard.press('Control+Enter'); await sleep(120);
  (await shapes(p)).length === 0 ? ok() : bad('BL20', 'an emptied text stayed as an invisible shape');
  // typing is one undo step, not one per key
  await tab(p, 'insert'); await p.click('[data-tool="text"]'); await p.mouse.click(box.x + box.width * .4, box.y + box.height * .7); await sleep(120);
  const u0 = await p.evaluate(() => UNDO.length);
  await p.keyboard.type('Ub-smear'); await p.keyboard.press('Control+Enter'); await sleep(100);
  const u1 = await p.evaluate(() => UNDO.length);
  u1 - u0 <= 1 ? ok() : bad('BL20', 'typing "Ub-smear" made ' + (u1 - u0) + ' undo steps');
  // the asterisk is a bold text with no typing step
  await tab(p, 'insert'); await p.click('[data-tool="star"]'); await p.mouse.click(box.x + box.width * .7, box.y + box.height * .8); await sleep(100);
  const st = await p.evaluate(() => FIG.panels[0].shapes.map(x => x.s + ':' + x.b));
  st.indexOf('*:true') >= 0 && !(await p.locator('#an-edit').count()) ? ok() : bad('BL20', 'the asterisk tool: ' + JSON.stringify(st));
  p.errs.length ? bad('BL20', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL21')) await guard('BL21', async () => {
  const p = await withGel();
  const state = () => p.evaluate(() => ({ tab: document.getElementById('ribbon').dataset.tab, panes: [...document.querySelectorAll('.rb-pane.on')].map(x => x.dataset.pane), fmt: !document.getElementById('rb-tab-format').hidden }));
  let s = await state();
  s.tab === 'home' && s.panes.join() === 'home' && !s.fmt ? ok() : bad('BL21', 'start: ' + JSON.stringify(s));
  await tab(p, 'layout'); s = await state();
  s.tab === 'layout' && s.panes.join() === 'layout' ? ok() : bad('BL21', 'Layout tab: ' + JSON.stringify(s));
  // every id the rest of the app reads is still there, and every select/number in the ribbon says what it is
  const ids = await p.evaluate(() => ['tb-lanes', 'tb-figw', 'tb-gap', 'tb-border-on', 'tb-border-px', 'tb-laneorient', 'tb-labelpos', 'tb-lanelabelsize', 'tb-movelabels', 'tb-condstyle', 'tb-condpos', 'tb-undo', 'tb-redo', 'tb-text', 'brb-swatches', 'exp-btn', 'exp-menu', 'more-menu', 'exp-labbook'].filter(i => !document.getElementById(i)));
  ids.length === 0 ? ok() : bad('BL21', 'the ribbon lost: ' + ids.join(', '));
  const unlabeled = await p.evaluate(() => [...document.querySelectorAll('#ribbon select,#ribbon input')].filter(e => !(e.getAttribute('aria-label') || (e.labels && e.labels.length && e.closest('label').textContent.trim()) || e.title)).map(e => e.id || e.outerHTML.slice(0, 60)));
  unlabeled.length === 0 ? ok() : bad('BL21', 'unlabelled controls in the ribbon: ' + unlabeled.join(' | '));
  // lanes and the layout controls still do their jobs from their new place
  await p.evaluate(() => { var i = document.getElementById('tb-laneorient'); i.value = 'horiz'; i.dispatchEvent(new Event('change')); var g = document.getElementById('tb-figw'); g.value = 600; g.dispatchEvent(new Event('change')); });
  const lay = await p.evaluate(() => ({ o: FIG.laneOrient, w: FIG.figW }));
  lay.o === 'horiz' && lay.w === 600 ? ok() : bad('BL21', 'Layout controls do not reach the figure: ' + JSON.stringify(lay));
  // selecting a shape opens Format; letting go returns to the tab you were on
  await p.evaluate(() => { var s = anAdd(0, anNew('rect', { x: .2, y: .5, w: .1, h: .2 })); save(); anRender(); anSelect([s.id]); });
  s = await state();
  s.tab === 'format' && s.fmt ? ok() : bad('BL21', 'selecting did not open Format: ' + JSON.stringify(s));
  await p.evaluate(() => anSelect([])); s = await state();
  s.tab === 'layout' && !s.fmt ? ok() : bad('BL21', 'letting go did not return to Layout: ' + JSON.stringify(s));
  // clicking the tab you are on folds the ribbon away; clicking any tab opens it again
  await p.click('#rb-tab-layout'); let fold = await p.evaluate(() => document.getElementById('ribbon').dataset.collapsed);
  const paneHidden = await p.evaluate(() => getComputedStyle(document.querySelector('.rb-panes')).display);
  fold === '1' && paneHidden === 'none' ? ok() : bad('BL21', 'clicking the open tab did not fold the ribbon (' + fold + ', ' + paneHidden + ')');
  await p.click('#rb-tab-insert'); fold = await p.evaluate(() => document.getElementById('ribbon').dataset.collapsed);
  fold === '0' ? ok() : bad('BL21', 'clicking another tab did not open the ribbon');
  // the Text group on Home is dimmed until a label has the caret
  await tab(p, 'home');
  const dim = await p.evaluate(() => getComputedStyle(document.querySelector('#tb-text .rb-row')).pointerEvents);
  dim === 'none' ? ok() : bad('BL21', 'the Text group is live with no label chosen');
  p.errs.length ? bad('BL21', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL22')) await guard('BL22', async () => {
  const p = await open();
  const T = await p.evaluate(() => {
    var d = { ctl: 'DMSO', ctlpos: 'first', top: 10, unit: 'µM', fold: 3, n: 8, sf: 2, dir: 'desc', marker: false };
    var L = o => srLabels(Object.assign({}, d, o));
    return {
      base: L({}), tenfold: L({ fold: 10, n: 4 }), half: L({ fold: 3.1623, n: 5, ctlpos: 'none' }), asc: L({ n: 3, dir: 'asc', ctlpos: 'last' }), marker: L({ n: 2, marker: true }),
      carry: srFmt(999.6, 2), small: srFmt(0.0005, 2), big: srFmt(2.5e6, 2), sf3: srFmt(370.37, 3),
      hostile: [L({ n: 0 }), L({ n: 99 }), L({ fold: 0 }), L({ fold: -3 }), L({ top: -5 }), L({ top: '' }), L({ top: 'abc' }), L({ top: 1e999 }), L({ unit: 'zz' }), L({ sf: 99 }), L({ n: 'x' })].map(a => a.join(',')).join('|'),
      count99: L({ n: 99 }).length
    };
  });
  JSON.stringify(T.base) === JSON.stringify(['DMSO', '10 µM', '3.3 µM', '1.1 µM', '370 nM', '120 nM', '41 nM', '14 nM', '4.6 nM']) ? ok() : bad('BL22', '10 µM ÷3 ×8: ' + T.base.join(', '));
  JSON.stringify(T.tenfold) === JSON.stringify(['DMSO', '10 µM', '1 µM', '100 nM', '10 nM']) ? ok() : bad('BL22', '10 µM ÷10 ×4: ' + T.tenfold.join(', '));
  JSON.stringify(T.half) === JSON.stringify(['10 µM', '3.2 µM', '1 µM', '320 nM', '100 nM']) ? ok() : bad('BL22', 'half-log: ' + T.half.join(', '));
  JSON.stringify(T.asc) === JSON.stringify(['1.1 µM', '3.3 µM', '10 µM', 'DMSO']) ? ok() : bad('BL22', 'lowest first, control last: ' + T.asc.join(', '));
  JSON.stringify(T.marker) === JSON.stringify(['M', 'DMSO', '10 µM', '3.3 µM']) ? ok() : bad('BL22', 'marker lane first: ' + T.marker.join(', '));
  T.carry === '1 µM' && T.small === '0.5 pM' && T.big === '2.5 mM' && T.sf3 === '370 nM' ? ok() : bad('BL22', 'unit changes: ' + [T.carry, T.small, T.big, T.sf3].join(' / '));
  !/NaN|undefined|Infinity|null/.test(T.hostile) && T.count99 <= 29 ? ok() : bad('BL22', 'hostile inputs gave: ' + T.hostile);
  // the dialog: preview, warning about typed labels, apply, undo
  await p.evaluate(() => { FIG.lanes[0] = 'typed'; render(); srOpen(); });
  await sleep(200);
  const prev = await p.evaluate(() => ({ lanes: document.querySelectorAll('#sr-prev .sr-lane').length, warn: document.getElementById('sr-warn').textContent }));
  prev.lanes === 9 && /replaces 1 label/.test(prev.warn) ? ok() : bad('BL22', 'the dialog preview: ' + JSON.stringify(prev));
  await p.click('#sr-back .btn.primary'); await sleep(200);
  const ap = await p.evaluate(() => ({ n: FIG.laneCount, l: FIG.lanes.slice(0, 3).map(_stripHtml), open: document.getElementById('sr-back').classList.contains('open') }));
  ap.n === 9 && ap.l.join() === 'DMSO,10 µM,3.3 µM' && !ap.open ? ok() : bad('BL22', 'Apply gave ' + JSON.stringify(ap));
  await p.evaluate(() => blotUndo()); const un = await p.evaluate(() => ({ n: FIG.laneCount, l: _stripHtml(FIG.lanes[0]) }));
  un.l === 'typed' ? ok() : bad('BL22', 'undo did not bring back the label that was typed: ' + JSON.stringify(un));
  p.errs.length ? bad('BL22', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL23')) await guard('BL23', async () => {
  const p = await open();
  const drop = (pi) => p.evaluate(async () => {
    var g = __gel([.5, .5, .5, .5, .5, .5, .5, .5, .5, .5, .5, .5]), blob = await (await fetch(g)).blob(), dt = new DataTransfer(); dt.items.add(new File([blob], 'gel.png', { type: 'image/png' }));
    var target = document.getElementById('stage');
    target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 900));
    return { n: FIG.panels.length, loaded: FIG.panels.map(q => !!q.src), crop: document.getElementById('crop-back').classList.contains('open') };
  });
  await p.evaluate(GEL);
  const hintBefore = await p.evaluate(() => !document.getElementById('an-hint').hidden);
  hintBefore ? ok() : bad('BL23', 'no hint on an empty page');
  let r = await drop();
  r.loaded[0] && !r.loaded[1] && r.n === 2 && r.crop ? ok() : bad('BL23', 'a picture dropped on the page did not fill the first empty panel and open the crop: ' + JSON.stringify(r));
  await p.evaluate(() => { confirmCrop(); }); await sleep(500);
  r = await drop();
  r.loaded[1] ? ok() : bad('BL23', 'the second drop did not go to the second panel: ' + JSON.stringify(r));
  await p.evaluate(() => { confirmCrop(); }); await sleep(500);
  r = await drop();
  r.n === 3 && r.loaded[2] ? ok() : bad('BL23', 'with every panel full, a drop did not add one: ' + JSON.stringify(r));
  const hide = await p.evaluate(() => document.getElementById('an-hint').hidden);
  hide ? ok() : bad('BL23', 'the hint stays once there is a picture');
  p.errs.length ? bad('BL23', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL24')) await guard('BL24', async () => {
  // Read from each maker's data sheet or product page on 2026-10-25. Not here, on purpose: SeeBlue Plus2 (its sizes depend on the gel and
  // buffer system), Chameleon Duo and NEB's Color Prestained Broad Range (no band list in text), NEB 1 kb (its 500/517 pair is listed twice).
  const LOCK = {
    pageruler_plus: ['kDa', [250,130,100,70,55,35,25,15,10], [70,25,10]],
    pageruler: ['kDa', [180,130,100,70,55,40,35,25,15,10], [70,10]],
    spectra_br: ['kDa', [260,140,100,70,50,40,35,25,15,10], []],
    spectra_hr: ['kDa', [300,250,180,130,100,70,50,40], []],
    novex_sharp: ['kDa', [260,160,110,80,60,50,40,30,20,15,10,3.5], []],
    precision_plus: ['kDa', [250,150,100,75,50,37,25,20,15,10], [75,25]],
    precision_kaleido: ['kDa', [250,150,100,75,50,37,25,20,15,10], []],
    precision_unstained: ['kDa', [250,150,100,75,50,37,25,20,15,10], [75,50,25]],
    pageruler_unstained: ['kDa', [200,150,120,100,85,70,60,50,40,30,25,20,15,10], [50]],
    pageruler_unstained_br: ['kDa', [250,150,100,70,50,40,30,20,15,10,5], [100,50,20]],
    gr_1kb: ['bp', [10000,8000,6000,5000,4000,3500,3000,2500,2000,1500,1000,750,500,250], [6000,3000,1000]],
    gr_1kb_plus: ['bp', [20000,10000,7000,5000,4000,3000,2000,1500,1000,700,500,400,300,200,75], [5000,1500,500]],
    gr_100: ['bp', [1000,900,800,700,600,500,400,300,200,100], [500]],
    gr_100_plus: ['bp', [3000,2000,1500,1200,1000,900,800,700,600,500,400,300,200,100], [1000,500]],
    neb_1kb_plus: ['bp', [10002,8001,6001,5001,4001,3001,2017,1517,1200,1000,900,800,700,600,500,400,300,200,100], [3001,1000,500]],
    neb_100: ['bp', [1517,1200,1000,900,800,700,600,500,400,300,200,100], [1000,500]],
    neb_50: ['bp', [1350,916,766,700,650,600,550,500,450,400,350,300,250,200,150,100,50], [500,200]],
    lambda_hind3: ['bp', [23130,9416,6557,4361,2322,2027,564,125], []]
  };
  const p = await open();
  const r = await p.evaluate(() => { var o = {}; Object.keys(LADDERS).forEach(k => { var L = LADDERS[k]; o[k] = { unit: L.unit, type: L.type, k: L.k, ref: L.ref, grp: L.grp, mfr: !!L.mfr, cat: !!L.cat, note: typeof L.note === 'string' }; });
    return { o: o, groups: MK_GROUPS, retired: ['chameleon', 'seeblue', 'neb_1kb'].map(k => !!LADDERS[k]) }; });
  const ids = Object.keys(LOCK);
  JSON.stringify(Object.keys(r.o).sort()) === JSON.stringify(ids.slice().sort()) ? ok() : bad('BL24', 'the ladders in the app and the pinned list differ: ' + Object.keys(r.o).filter(k => !LOCK[k]).concat(ids.filter(k => !r.o[k])).join(','));
  for (const id of ids) {
    const L = r.o[id], [unit, k, ref] = LOCK[id]; if (!L) continue;
    JSON.stringify(L.k) === JSON.stringify(k) && L.unit === unit ? ok() : bad('BL24', `${id}: sizes differ from the maker's list: ${JSON.stringify(L.k)}`);
    JSON.stringify(L.ref) === JSON.stringify(ref) ? ok() : bad('BL24', `${id}: reference bands differ: ${JSON.stringify(L.ref)}`);
    L.k.every((v, i) => v > 0 && (i === 0 || v < L.k[i - 1])) && L.ref.every(v => L.k.indexOf(v) >= 0) && L.type === (unit === 'bp' ? 'dna' : 'protein') && r.groups.indexOf(L.grp) >= 0 && L.mfr && L.cat && L.note
      ? ok() : bad('BL24', `${id}: not in order, a reference band is not a size, or a field is missing`);
  }
  r.retired.every(x => !x) ? ok() : bad('BL24', 'a ladder that was not read from a data sheet is back in the list');
  // DNA reads in bp with thousands grouped; protein in kDa
  await p.evaluate(GEL + `;(() => { var g = __gel([.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5]); var q = FIG.panels[0]; q.src = g; q.cropped = g; q.ladder = 'gr_1kb_plus'; q.marks = [{ k: 20000, y: .2 }, { k: 1500, y: .6 }]; save(); render(); })()`);
  await sleep(500);
  const d = await p.evaluate(() => ({ lbl: [...document.querySelectorAll('.panel-kda .mk-l')].map(e => e.textContent), dna: !!document.querySelector('.panel-kda.is-dna'), unit: mkUnit(FIG.panels[0]) }));
  d.lbl.join('|') === '20,000|1,500' && d.dna && d.unit === 'bp' ? ok() : bad('BL24', 'a DNA ladder does not read in bp with thousands grouped: ' + JSON.stringify(d));
  await p.evaluate(() => { openMarkers(0); }); await sleep(300);
  const svg = await p.evaluate(() => [...document.querySelectorAll('.an-mk-lbl')].map(e => e.textContent).filter(Boolean));
  svg.includes('20,000 bp') && svg.includes('1,500 bp') ? ok() : bad('BL24', 'the guides on the blot do not carry the unit: ' + svg.join('|'));
  const chips = await p.evaluate(() => ({ n: document.querySelectorAll('#rb-format .mk-chip').length, ref: [...document.querySelectorAll('#rb-format .mk-chip.ref')].map(e => e.textContent), opt: [...document.querySelectorAll('#rb-format select option')].length }));
  chips.n === 15 && chips.ref.join('|') === '5,000|1,500|500' && chips.opt > 18 ? ok() : bad('BL24', 'the chips or the list do not show the ladder: ' + JSON.stringify(chips));
  // an older build listed Chameleon and SeeBlue from memory; a panel that used one keeps its markers as custom sizes
  const mig = await p.evaluate(() => { var f = JSON.parse(JSON.stringify(FIG)); f.panels[0].ladder = 'chameleon'; f.panels[0].marks = [{ k: 260, y: .1 }, { k: 8, y: .8 }]; f.panels[0].shapes = []; migrateFig(f); var q = f.panels[0];
    var h = JSON.parse(JSON.stringify(FIG)); h.panels[0].ladder = 'no_such'; migrateFig(h);
    return { lad: q.ladder, cl: q.cl, marks: q.marks, junk: h.panels[0].ladder }; });
  mig.lad === 'custom' && JSON.stringify(mig.cl) === '{"unit":"kDa","k":[260,8]}' && mig.marks.length === 2 && mig.marks[0].k === 260 && mig.junk == null ? ok() : bad('BL24', 'a retired or unknown ladder was not handled: ' + JSON.stringify(mig));
  const cs = await p.evaluate(() => ({ a: mkParseSizes('x, 245; 180 180 -5 1e9 135,100 0 1,000'), bp: mkParseSizes('10,000 8,000 6,000 20000,10000 500', 'bp'), b: mkParseSizes(''), c: mkParseSizes(null), d: mkParseSizes(Array.from({ length: 60 }, (_, i) => i + 1).join(' ')).length }));
  JSON.stringify(cs.a) === '[245,180,135,100,1]' && JSON.stringify(cs.bp) === '[20000,10000,8000,6000,500]' && cs.b.length === 0 && cs.c.length === 0 && cs.d === 40 ? ok() : bad('BL24', 'custom sizes are not cleaned: ' + JSON.stringify(cs));
  // custom sizes typed in, then used for markers
  await p.evaluate(() => { mkSetLadder('custom'); }); await sleep(300);
  await p.evaluate(() => { var i = document.getElementById('mk-cl-k'); i.value = '245, 180, 135'; i.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(300);
  const cu = await p.evaluate(() => ({ cl: FIG.panels[0].cl, chips: [...document.querySelectorAll('#rb-format .mk-chip')].map(e => e.textContent), next: MK.next }));
  JSON.stringify(cu.cl) === '{"unit":"kDa","k":[245,180,135]}' && cu.chips.join('|') === '245|180|135' ? ok() : bad('BL24', 'custom sizes did not reach the chips: ' + JSON.stringify(cu));
  p.errs.length ? bad('BL24', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL25')) await guard('BL25', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    var out = {}, rel = (a, b) => Math.abs(a - b) / b;
    // a straight line in log10(size) against height: the answer must be the line, to rounding
    var lin = [250, 130, 70, 25, 10].map((k, i) => ({ k: k, y: 0 })); var yl = i => 0.1 + 0.8 * (Math.log10(250) - Math.log10(lin[i].k)) / (Math.log10(250) - Math.log10(10)); lin.forEach((m, i) => m.y = yl(i));
    var worst = 0; for (var t = 0.1; t <= 0.9; t += 0.013) { var want = Math.pow(10, Math.log10(250) - (t - 0.1) / 0.8 * (Math.log10(250) - Math.log10(10))); var e = mkEstimate(lin, t); worst = Math.max(worst, rel(e.v, want)); }
    out.lin = worst;
    // a sigmoid gel (what a real gel does): exact at each marker, between its two neighbours everywhere, whatever the input order
    var sig = [250, 150, 100, 75, 50, 37, 25, 20, 15, 10].map((k, i) => ({ k: k, y: 0.08 + 0.84 * (1 / (1 + Math.exp(-(i - 4.5) / 2.2))) })); sig.forEach((m, i) => m.y = 0.08 + 0.84 * (i / 9) + 0.06 * Math.sin(i * 0.7) * (i > 0 && i < 9 ? 1 : 0));
    var shuf = sig.slice().reverse(), at = 0, between = 0, n = 0;
    sig.forEach(m => { var e = mkEstimate(shuf, m.y); if (rel(e.v, m.k) < 1e-9) at++; });
    for (var y = sig[0].y; y <= sig[9].y; y += 0.0007) { var e2 = mkEstimate(shuf, y); n++; if (e2.v <= e2.hi * (1 + 1e-9) && e2.v >= e2.lo * (1 - 1e-9)) between++; }
    out.at = at; out.between = between; out.n = n;
    out.above = mkEstimate(sig, sig[0].y - 0.01); out.below = mkEstimate(sig, sig[9].y + 0.01);
    out.one = mkEstimate([sig[0]], 0.2); out.none = mkEstimate([], 0.2);
    out.order = mkEstimate([{ k: 100, y: .2 }, { k: 70, y: .4 }, { k: 80, y: .6 }], .3);
    out.same = mkEstimate([{ k: 100, y: .2 }, { k: 70, y: .2 }], .2);
    out.two = mkEstimate([{ k: 100, y: .2 }, { k: 10, y: .8 }], .5);
    out.txt = [mkSizeText(47.3, 'kDa'), mkSizeText(8.44, 'kDa'), mkSizeText(1234, 'bp'), mkSizeText(147, 'kDa'), mkSizeText(9.96, 'kDa'), mkSizeText(23130, 'bp')];
    out.msgs = [mkEstText(out.above, 'kDa'), mkEstText(out.below, 'bp'), mkEstText(out.order, 'kDa'), mkEstText(out.one, 'kDa'), mkEstText(out.none, 'kDa')];
    return out; });
  r.lin < 1e-9 ? ok() : bad('BL25', 'markers on a straight log line do not return the line (worst relative error ' + r.lin + ')');
  r.at === 10 ? ok() : bad('BL25', `at a marker the estimate is not the marker's size (${r.at} of 10), or depends on the input order`);
  r.between === r.n && r.n > 1000 ? ok() : bad('BL25', `between two markers the estimate leaves them (${r.n - r.between} of ${r.n} points)`);
  r.above.err === 'out' && r.above.above && r.below.err === 'out' && !r.below.above ? ok() : bad('BL25', 'a height beyond the first or last marker is extrapolated: ' + JSON.stringify([r.above, r.below]));
  r.one.err === 'need' && r.none.err === 'need' ? ok() : bad('BL25', 'fewer than two markers is fitted: ' + JSON.stringify([r.one, r.none]));
  r.order.err === 'order' && r.same.err === 'order' ? ok() : bad('BL25', 'markers out of order, or at the same height, are fitted: ' + JSON.stringify([r.order, r.same]));
  r.two.v > 31 && r.two.v < 32.7 ? ok() : bad('BL25', 'two markers are not joined by a straight line in log size: ' + r.two.v);
  JSON.stringify(r.txt) === JSON.stringify(['47 kDa', '8.4 kDa', '1,200 bp', '150 kDa', '10 kDa', '23,000 bp']) ? ok() : bad('BL25', 'sizes are written to the wrong precision: ' + r.txt.join(' | '));
  r.msgs[0] === 'Above the 250 marker: not extrapolated' && r.msgs[1] === 'Below the 10 marker: not extrapolated' && /out of order: 70 is above 80/.test(r.msgs[2]) && /second marker/.test(r.msgs[3]) && /markers first/.test(r.msgs[4]) ? ok() : bad('BL25', 'the reasons are not said: ' + r.msgs.join(' | '));
  p.errs.length ? bad('BL25', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL26')) await guard('BL26', async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    function img(w, h, bands, dark, noise) { var g = new Float32Array(w * h), s = 11; for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var v = 0; bands.forEach(b => { v += b.a * Math.exp(-((y - b.y) * (y - b.y)) / (2 * (b.s || 3) * (b.s || 3))); }); s = (s * 16807) % 2147483647; var n = (s / 2147483647 - 0.5) * (noise == null ? 4 : noise); g[y * w + x] = dark ? Math.max(0, Math.min(255, 235 - v + n)) : Math.max(0, Math.min(255, 20 + v + n)); } return { g: g, w: w, h: h }; }
    var B = [{ y: 100, a: 120 }, { y: 200.4, a: 120 }, { y: 300, a: 120 }], o = {};
    var G = img(100, 400, B, true), s1 = mkSnapY(G, .5, 207 / 400, true); o.near = [s1.snapped, s1.y * 400 - 0.5];
    var s2 = mkSnapY(G, .5, 193 / 400, true); o.nearUp = [s2.snapped, s2.y * 400 - 0.5];
    var s3 = mkSnapY(G, .5, 150 / 400, true); o.far = [s3.snapped, s3.y * 400];
    var L = img(100, 400, B, false); var s4 = mkSnapY(L, .5, 107 / 400, false); o.light = [s4.snapped, s4.y * 400 - 0.5];
    var F = img(100, 400, [{ y: 200, a: 1.2, s: 3 }], true, 3); var s5 = mkSnapY(F, .5, 205 / 400, true); o.ripple = s5.snapped;
    var W = img(100, 400, [{ y: 195, a: 10 }, { y: 205, a: 120 }], true), s6 = mkSnapY(W, .5, 197 / 400, true); o.weak = [s6.snapped, s6.y * 400 - 0.5];
    var W2 = img(100, 400, [{ y: 195, a: 70 }, { y: 205, a: 120 }], true), s7 = mkSnapY(W2, .5, 196 / 400, true); o.near2 = [s7.snapped, s7.y * 400 - 0.5];
    var edge = mkSnapY(G, 0, 100 / 400, true), edge2 = mkSnapY(G, 1, 100 / 400, true); o.edge = [edge.snapped, edge2.snapped];
    var tiny = mkSnapY({ g: new Float32Array(4), w: 2, h: 2 }, .5, .5, true); o.tiny = tiny.snapped;
    return o; });
  r.near[0] && Math.abs(r.near[1] - 200.4) < 0.5 && r.nearUp[0] && Math.abs(r.nearUp[1] - 200.4) < 0.5 ? ok() : bad('BL26', 'a click near a band did not land on its centre: ' + JSON.stringify([r.near, r.nearUp]));
  !r.far[0] && Math.abs(r.far[1] - 150) < 1e-6 ? ok() : bad('BL26', 'a click far from a band moved: ' + JSON.stringify(r.far));
  r.light[0] && Math.abs(r.light[1] - 100) < 0.5 ? ok() : bad('BL26', 'a light band on a dark film was not found: ' + JSON.stringify(r.light));
  !r.ripple ? ok() : bad('BL26', 'a faint ripple was taken for a band');
  r.weak[0] && Math.abs(r.weak[1] - 205) < 0.7 ? ok() : bad('BL26', 'a faint neighbour won over a strong band: ' + JSON.stringify(r.weak));
  r.near2[0] && Math.abs(r.near2[1] - 195) < 1 ? ok() : bad('BL26', 'a real band nearer the click lost to a stronger one further away: ' + JSON.stringify(r.near2));
  r.edge.every(x => typeof x === 'boolean') && r.tiny === false ? ok() : bad('BL26', 'the picture edge or a tiny picture is not handled');
  // in the page: the picture's own bands (one dark band across at 50 % of the height)
  await p.evaluate(GEL + `;(() => { var g = __gel([.8,.8,.8,.8,.8,.8,.8,.8,.8,.8,.8,.8]); var q = FIG.panels[0]; q.src = g; q.cropped = g; q.ladder = 'pageruler_plus'; q.marks = []; save(); render(); openMarkers(0); })()`);
  await sleep(500);
  const box = async () => p.locator('.panel-blot .blot-img').first().boundingBox();
  let b = await box(); const lane = b.x + b.width * (0.5 / 12);
  await p.mouse.click(lane, b.y + b.height * 0.53); b = await box();
  let m = await p.evaluate(() => FIG.panels[0].marks.map(x => x.y));
  m.length === 1 && Math.abs(m[0] - 0.5) < 0.012 ? ok() : bad('BL26', 'a click at 53 % with a band at 50 % did not land on the band: ' + JSON.stringify(m));
  await p.keyboard.down('Alt'); await p.mouse.click(lane, b.y + b.height * 0.53); await p.keyboard.up('Alt'); b = await box();
  m = await p.evaluate(() => FIG.panels[0].marks.map(x => x.y));
  m.length === 2 && Math.abs(m[1] - 0.53) < 0.006 ? ok() : bad('BL26', 'Alt did not place exactly where clicked (a band is 3 % away): ' + JSON.stringify(m));
  await p.evaluate(() => { mkSnapSet(false); mkPick(2); }); b = await box();
  await p.mouse.click(lane, b.y + b.height * 0.54);
  m = await p.evaluate(() => FIG.panels[0].marks.map(x => x.y));
  m.length === 3 && Math.abs(m[2] - 0.54) < 0.01 ? ok() : bad('BL26', 'with Snap to band off the click was moved: ' + JSON.stringify(m));
  await p.evaluate(() => { mkSnapSet(true); mkPick(3); }); b = await box();
  await p.mouse.click(lane, b.y + b.height * 0.52);   // the band the first marker is already on
  const twin = await p.evaluate(() => ({ n: FIG.panels[0].marks.length, toast: (document.querySelector('.toast, #toast') || {}).textContent || '' }));
  twin.n === 3 && /already on that band/.test(twin.toast) ? ok() : bad('BL26', 'a second size was placed on a band that has a marker: ' + JSON.stringify(twin));
  const guide = await p.evaluate(() => { mkSnapSet(true); return mkSnapClick(0, 0.04, 0.53, null); });
  guide.snapped && Math.abs(guide.y - 0.5) < 0.012 ? ok() : bad('BL26', 'the hover guide does not snap: ' + JSON.stringify(guide));
  p.errs.length ? bad('BL26', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL27')) await guard('BL27', async () => {
  const p = await open();
  await p.evaluate(GEL + `;(() => { var g = __gel([.8,.8,.8,.8,.8,.8,.8,.8,.8,.8,.8,.8]); var q = FIG.panels[0]; q.src = g; q.cropped = g; q.prot = 'BRD4'; q.ladder = 'pageruler_plus';
    q.marks = [{ k: 250, y: .1 }, { k: 100, y: .3 }, { k: 70, y: .5 }, { k: 10, y: .9 }]; save(); render(); })()`);
  await sleep(400);
  await p.evaluate(() => { var f = FIG.panels[0]; f.marks = [f.marks[0]]; anMsStart(); });
  (await p.evaluate(() => AN.tool)) !== 'ms' ? ok() : bad('BL27', 'Measure opened with one marker');
  await p.evaluate(() => { FIG.panels[0].marks = [{ k: 250, y: .1 }, { k: 100, y: .3 }, { k: 70, y: .5 }, { k: 10, y: .9 }]; render(); anMsStart(); }); await sleep(300);
  const st = await p.evaluate(() => ({ tool: AN.tool, tab: document.getElementById('rb-tab-format').textContent, shown: !document.getElementById('rb-tab-format').hidden }));
  st.tool === 'ms' && st.tab === 'Measure' && st.shown ? ok() : bad('BL27', 'Measure did not open its tab: ' + JSON.stringify(st));
  const b = await p.locator('.panel-blot .blot-img').first().boundingBox(), x = b.x + b.width * 0.5;
  await p.keyboard.down('Alt'); await p.mouse.move(x, b.y + b.height * 0.4);
  const hov = await p.evaluate(() => { var g = document.getElementById('an-mkg-0'); return g && g.style.display !== 'none' && g.querySelector('text').textContent; });
  await p.mouse.click(x, b.y + b.height * 0.4); await p.keyboard.up('Alt');
  const r1 = await p.evaluate(() => ({ pin: MK.pin && MK.pin.text, want: mkEstText(mkEstimate(FIG.panels[0].marks, MK.pin.y), 'kDa'), y: MK.pin.y, res: (document.querySelector('#rb-format .mk-res') || {}).textContent, btn: !!document.querySelector('#rb-format button[onclick="anMsLabel()"]') }));
  Math.abs(r1.y - 0.4) < 0.01 && r1.pin === r1.want && /^≈ \d+ kDa$/.test(r1.pin) && r1.res === r1.pin && r1.btn ? ok() : bad('BL27', 'a click did not read a size: ' + JSON.stringify(r1));
  hov === r1.pin ? ok() : bad('BL27', 'the hover guide does not say the size before the click: ' + hov + ' vs ' + r1.pin);
  const v = parseFloat(r1.pin.replace(/[^\d.]/g, '')); v > 70 && v < 100 ? ok() : bad('BL27', 'a band between the 100 and 70 markers reads ' + v);
  await p.keyboard.down('Alt'); await p.mouse.click(x, b.y + b.height * 0.04); await p.keyboard.up('Alt');
  const r2 = await p.evaluate(() => ({ pin: MK.pin.text, err: MK.pin.e.err, btn: !!document.querySelector('#rb-format button[onclick="anMsLabel()"]') }));
  r2.err === 'out' && /not extrapolated/.test(r2.pin) && !r2.btn ? ok() : bad('BL27', 'a click above the markers was answered: ' + JSON.stringify(r2));
  await p.keyboard.down('Alt'); await p.mouse.click(x, b.y + b.height * 0.4); await p.keyboard.up('Alt');
  const n0 = await p.evaluate(() => (FIG.panels[0].shapes || []).length);
  await p.evaluate(() => anMsLabel());
  const r3 = await p.evaluate(() => { var s = FIG.panels[0].shapes, t = s[s.length - 1]; return { n: s.length, t: t.t, s: t.s, y: t.y, tool: AN.tool, sel: AN.ids.length, undo: UNDO.length }; });
  r3.n === n0 + 1 && r3.t === 'text' && r3.s === r1.pin && Math.abs(r3.y - 0.4) < 0.01 && r3.tool === 'select' && r3.sel === 1 ? ok() : bad('BL27', 'Add as label did not make a text shape beside the band: ' + JSON.stringify(r3));
  await p.evaluate(() => blotUndo()); await sleep(200);
  (await p.evaluate(() => (FIG.panels[0].shapes || []).length)) === n0 ? ok() : bad('BL27', 'the label is not one undo step');
  // DNA: the unit follows the ladder
  await p.evaluate(() => { var q = FIG.panels[0]; q.ladder = 'gr_1kb'; q.marks = [{ k: 10000, y: .1 }, { k: 3000, y: .4 }, { k: 250, y: .9 }]; render(); anMsStart(); }); await sleep(300);
  const b2 = await p.locator('.panel-blot .blot-img').first().boundingBox();
  await p.keyboard.down('Alt'); await p.mouse.click(b2.x + b2.width * 0.5, b2.y + b2.height * 0.25); await p.keyboard.up('Alt');
  const r4 = await p.evaluate(() => MK.pin.text);
  /^≈ [\d,]+ bp$/.test(r4) ? ok() : bad('BL27', 'a DNA gel is measured in kDa: ' + r4);
  await p.evaluate(() => mkDone());
  (await p.evaluate(() => AN.tool)) === 'select' ? ok() : bad('BL27', 'Done did not leave Measure');
  p.errs.length ? bad('BL27', 'errors: ' + p.errs.join(' | ')) : ok();
  await p.context().close();
});

if (run('BL12')) await guard('BL12', async () => {
  const ESC = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8').replace(/window\.__escapeAudit\(\);\s*$/, '');
  const RT = fs.readFileSync(path.join(ROOT, 'tools/audit_runtime.js'), 'utf8'), AL = fs.readFileSync(path.join(ROOT, 'tools/audit_align.js'), 'utf8');
  for (const theme of ['light', 'dark']) for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
    const p = await open({ w, h, theme });
    await p.evaluate(GEL + `;(() => { var g = __gel([.2,.4,.6,.8,.2,.4,.6,.8,.2,.4,.6,.8]); FIG.panels[0].src = g; FIG.panels[0].cropped = g; FIG.panels[0].prot = 'BRD4'; FIG.panels[0].marks = [{ k: 70, y: .3 }, { k: 55, y: .7 }]; FIG.panels[0].shapes = anClean([{ t: 'line', x1: 1.1, y1: .5, x2: 1, y2: .5, head: 'end' }, { t: 'rect', x: .3, y: .4, w: .1, h: .3, fill: '#2d9462', fo: .2 }, { t: 'text', x: .7, y: .3, s: 'Ub-smear' }]); FIG.lanes = FIG.lanes.map((x, i) => 'Lane ' + (i + 1)); save(); render(); })()`);
    const screens = [['figure', null], ['crop', () => openCrop(0)], ['quantify', () => openQuant(0)], ['markers in place', () => openMarkers(0)], ['format', () => { anTool('select'); anSelect([FIG.panels[0].shapes[1].id]); }],
      ['format of an arrow', () => anSelect([FIG.panels[0].shapes[0].id])], ['insert tab', () => { anSelect([]); rbTab('insert'); }], ['layout tab', () => rbTab('layout')], ['fill series', () => { rbTab('home'); srOpen(); }],
      ['markers, DNA ladder', () => { var q = FIG.panels[0]; q.ladder = 'gr_1kb_plus'; q.marks = [{ k: 20000, y: .2 }, { k: 1500, y: .6 }]; render(); openMarkers(0); }],
      ['markers, custom sizes', () => { mkSetLadder('custom'); FIG.panels[0].cl = { unit: 'kDa', k: [245, 180, 135, 100, 75, 63, 48, 35, 25, 20, 17, 11] }; render(); openMarkers(0); }],
      ['measure', () => { var q = FIG.panels[0]; q.ladder = 'pageruler_plus'; q.cl = null; q.marks = [{ k: 250, y: .1 }, { k: 100, y: .3 }, { k: 10, y: .9 }]; render(); anMsStart(); MK.pin = { pi: 0, y: .5, e: mkEstimate(q.marks, .5), text: mkEstText(mkEstimate(q.marks, .5), 'kDa') }; anFormat(); anDraw(0); }]];
    for (const [name, fn] of screens) {
      if (fn) { await p.evaluate(fn); await sleep(500); }
      const f = [].concat(
        await p.evaluate(ESC + ';window.__escapeAudit({allowScroll:".fig-shell,.stage,.dn-tblwrap,.crop-area,.dn-body,.toolbar,.rb-pane,.rb-panes,.sr-body"})').catch(x => ['escape audit crashed: ' + x.message]).then(r => r.map(x => 'ESCAPE ' + x)),
        await p.evaluate(RT + ';(window.__runtimeAudit||(()=>[]))({accentInk:' + (theme === 'dark' ? 4.5 : 3) + '})').catch(() => []).then(r => (r || []).map(x => 'RUNTIME ' + x)),
        await p.evaluate(AL + ';(window.__alignAudit||(()=>[]))()').catch(() => []).then(r => (r || []).map(x => 'ALIGN ' + x)));
      f.length ? f.slice(0, 4).forEach(x => bad('BL12', `${theme} ${w}×${h} ${name}: ${x}`)) : ok();
      if (fn) await p.evaluate(() => { closeCrop(); closeQuant(); srClose(); anTool('select'); anSelect([]); rbTab('home'); });
    }
    p.errs.length ? bad('BL12', `${theme} ${w}: errors: ` + p.errs.join(' | ')) : ok();
    await p.context().close();
  }
});

await browser.close(); srv.kill();
findings.forEach(f => console.log(f));
console.log(`\nBlot invariants: ${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
