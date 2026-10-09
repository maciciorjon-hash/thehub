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
  const box = await p.locator('#mk-canvas').boundingBox();
  await p.evaluate(() => mkPick(3)); // 70 kDa in PageRuler Plus
  await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.25);
  await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.7); // the next size, 55 kDa
  const r = await p.evaluate(async () => {
    closeMarkers(); render(); await new Promise(r => setTimeout(r, 200));
    var m = FIG.panels[0].marks, img = document.querySelector('.panel-blot .blot-img').getBoundingClientRect(), mk = [...document.querySelectorAll('.panel-kda .mk')].map(e => { var b = e.querySelector('.mk-t').getBoundingClientRect(); return { k: e.textContent.trim(), y: (b.top + b.height / 2 - img.top) / img.height }; });
    var cv = await renderFigureCanvas(1), x = cv.getContext('2d'), fr = document.getElementById('figure').getBoundingClientRect(), t = document.querySelector('.panel-kda .mk-t').getBoundingClientRect();
    var px = x.getImageData(Math.round(t.left - fr.left + 18 + t.width / 2), Math.round(t.top - fr.top + 18 + t.height / 2), 1, 1).data;
    return { m: m, mk: mk, px: [px[0], px[1], px[2]], kdaHidden: !document.querySelector('.panel-kda[data-pi="0"] .lbl-in') };
  });
  r.m.length === 2 && r.m[0].k === 70 && Math.abs(r.m[0].y - 0.25) < 0.02 && r.m[1].k === 55 ? ok() : bad('BL7', 'markers stored: ' + JSON.stringify(r.m));
  r.mk.length === 2 && r.mk.every((x, i) => Math.abs(x.y - r.m[i].y) < 0.02) ? ok() : bad('BL7', 'the markers are not drawn at their heights: ' + JSON.stringify(r.mk));
  r.px[0] < 160 ? ok() : bad('BL7', 'the export does not draw the marker tick (pixel ' + r.px.join(',') + ')');
  r.kdaHidden ? ok() : bad('BL7', 'with markers set, the single kDa label is still drawn beside them');
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

if (run('BL12')) await guard('BL12', async () => {
  const ESC = fs.readFileSync(path.join(ROOT, 'tools/audit_escape.js'), 'utf8').replace(/window\.__escapeAudit\(\);\s*$/, '');
  const RT = fs.readFileSync(path.join(ROOT, 'tools/audit_runtime.js'), 'utf8'), AL = fs.readFileSync(path.join(ROOT, 'tools/audit_align.js'), 'utf8');
  for (const theme of ['light', 'dark']) for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
    const p = await open({ w, h, theme });
    await p.evaluate(GEL + `;(() => { var g = __gel([.2,.4,.6,.8,.2,.4,.6,.8,.2,.4,.6,.8]); FIG.panels[0].src = g; FIG.panels[0].cropped = g; FIG.panels[0].prot = 'BRD4'; FIG.panels[0].marks = [{ k: 70, y: .3 }, { k: 55, y: .7 }]; FIG.lanes = FIG.lanes.map((x, i) => 'Lane ' + (i + 1)); save(); render(); })()`);
    const screens = [['figure', null], ['crop', () => openCrop(0)], ['quantify', () => openQuant(0)], ['markers', () => openMarkers(0)]];
    for (const [name, fn] of screens) {
      if (fn) { await p.evaluate(fn); await sleep(500); }
      const f = [].concat(
        await p.evaluate(ESC + ';window.__escapeAudit({allowScroll:".fig-shell,.stage,.dn-tblwrap,.crop-area,.dn-body,.toolbar"})').catch(x => ['escape audit crashed: ' + x.message]).then(r => r.map(x => 'ESCAPE ' + x)),
        await p.evaluate(RT + ';(window.__runtimeAudit||(()=>[]))({accentInk:' + (theme === 'dark' ? 4.5 : 3) + '})').catch(() => []).then(r => (r || []).map(x => 'RUNTIME ' + x)),
        await p.evaluate(AL + ';(window.__alignAudit||(()=>[]))()').catch(() => []).then(r => (r || []).map(x => 'ALIGN ' + x)));
      f.length ? f.slice(0, 4).forEach(x => bad('BL12', `${theme} ${w}×${h} ${name}: ${x}`)) : ok();
      if (fn) await p.evaluate(() => { closeCrop(); closeQuant(); closeMarkers(); });
    }
    p.errs.length ? bad('BL12', `${theme} ${w}: errors: ` + p.errs.join(' | ')) : ok();
    await p.context().close();
  }
});

await browser.close(); srv.kill();
findings.forEach(f => console.log(f));
console.log(`\nBlot invariants: ${passed} passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
