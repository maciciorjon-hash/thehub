// RDKit travels with the Hub — structures, properties and SAR in Echo, Dora and Hit Finder work with no network.
//
//   RD1 the file is the file    tools/inline_rdkit.py checks the vendored JS and wasm against the SHA-384 the loader pins and refuses to build on a mismatch,
//                               whichever of the two is changed; the loader's pin, vendor/ and the embedded blobs are one version
//   RD2 a personal build        a Hub built with --embed-rdkit (what dHUB.html is) carries RDKit inline: with every request to the network refused, Dora opens, reads
//                               SMILES, draws the structures and computes the properties, and no request names a CDN
//   RD3 a deployed build        dist/ writes rdkit/ beside index.html and keeps the page small: with the CDNs refused, the same thing works from those files
//   RD4 alone, no network       Dora opened on its own with no RDKit anywhere says "offline" once and every other part still works (DO7 holds the rest)
//
//   node tools/rdkit_embed_invariants.mjs [--only=RD2]     builds into a temporary folder; exit 1 on any finding
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
const run = id => !only || only.split(',').includes(id);
const findings = []; let passed = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const ok = () => { passed++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rdkit-embed-'));
const py = (code, env) => spawnSync('python3', ['-I', '-c', code], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}) });

// ── RD1: the hashes ──
if (run('RD1')) {
  const good = py(`import sys; sys.path.insert(0,'tools'); import inline_rdkit as m; js,w=m.load(); print(len(js),len(w))`);
  good.status === 0 ? ok() : bad('RD1', 'the vendored RDKit does not match the loader\'s pins: ' + good.stderr.split('\n').slice(-2)[0]);
  for (const which of ['JS', 'WASM']) {
    const f = path.join(tmp, which + '.bin'), src = which === 'JS' ? 'vendor/rdkit-minimal-2026.9.1.js' : 'vendor/rdkit-minimal-2026.9.1.wasm';
    const buf = fs.readFileSync(path.join(ROOT, src)); buf[Math.floor(buf.length / 2)] ^= 1; fs.writeFileSync(f, buf);
    const r = py(`import sys; sys.path.insert(0,'tools'); import inline_rdkit as m; m.${which}=${JSON.stringify(f)}\ntry:\n    m.load(); print('LOADED')\nexcept ValueError as e:\n    print('REFUSED', e)`);
    /REFUSED/.test(r.stdout) && !/LOADED/.test(r.stdout) ? ok() : bad('RD1', 'a changed ' + which + ' was accepted: ' + r.stdout.trim().slice(0, 120));
  }
  const echo = fs.readFileSync(path.join(ROOT, 'apps/echo/echo.html'), 'utf8'), dora = fs.readFileSync(path.join(ROOT, 'apps/dora/dora.html'), 'utf8'), hf = fs.readFileSync(path.join(ROOT, 'apps/hitfinder/hitfinder.html'), 'utf8');
  const blk = t => (t.match(/RDKIT LOADER — BEGIN[\s\S]*?RDKIT LOADER — END/) || [''])[0];
  blk(echo) && blk(echo) === blk(dora) && blk(echo) === blk(hf) ? ok() : bad('RD1', 'the RDKIT LOADER block differs between Echo, Dora and Hit Finder (run tools/sync_screen_engine.py)');
}

// ── building ──
function build(dir, flags) {
  fs.mkdirSync(dir, { recursive: true });
  const r = spawnSync('python3', ['embed.py', '--no-js-check', ...flags, path.join(dir, 'index.html')], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0;
}
const serve = dir => new Promise(res => { const s = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } const ext = path.extname(f); r.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.woff2': 'font/woff2' }[ext] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });

const browser = await chromium.launch();
// Open Dora through the Hub with the network refused; report what happened to structures
async function hubStructures(url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await ctx.newPage(), net = [], errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => { net.push(r.request().url()); r.abort(); });
  await page.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); localStorage.setItem('hub_theme', 'light'); } catch (e) {} });
  await page.goto(url); await page.waitForTimeout(1200);
  await page.evaluate(() => openApp('deg')); await page.waitForTimeout(2000);
  let dora = null; for (const f of page.frames()) { try { if (await f.evaluate(() => typeof loadTestData === 'function' && typeof Chem !== 'undefined')) dora = f; } catch (e) {} }
  if (!dora) { await ctx.close(); return { err: 'Dora did not open' }; }
  const info = await dora.evaluate(async () => {
    loadTestData(); await Chem.load(); await Chem.computeAll();
    switchTab('table'); await new Promise(r => setTimeout(r, 1500));
    const c = RAW.find(x => x._ch && x._ch.ok);
    return { state: Chem.state(), ok: RAW.filter(x => x._ch && x._ch.ok).length, mw: c && c._ch.p.mw, svgs: document.querySelectorAll('#table-body .tile svg').length, chip: document.getElementById('chem-chip').dataset.s };
  });
  const rd = net.filter(u => /unpkg|jsdelivr|rdkit/i.test(u));
  await ctx.close(); return Object.assign(info, { cdn: rd, errs: errs.filter(e => !/Failed to load|net::/.test(e)) });
}
if (run('RD2')) {
  const dir = path.join(tmp, 'personal'); const built = build(dir, ['--embed-rdkit']);
  if (!built) bad('RD2', 'the build failed'); else {
    const size = fs.statSync(path.join(dir, 'index.html')).size, hasSib = fs.existsSync(path.join(dir, 'rdkit'));
    const srv = await serve(dir), r = await hubStructures('http://127.0.0.1:' + srv.address().port + '/index.html'); srv.close();
    r.state === 'ready' && r.ok > 20 && r.mw > 100 && r.svgs > 0 ? ok() : bad('RD2', 'with no network the embedded RDKit gave ' + JSON.stringify(r));
    r.cdn && r.cdn.length === 0 ? ok() : bad('RD2', 'a request still went to a CDN: ' + (r.cdn || []).join(' '));
    !hasSib && size > 20e6 ? ok() : bad('RD2', 'an embedded build should hold RDKit itself (' + size + ' bytes) and write no rdkit/ folder (' + hasSib + ')');
  }
}
if (run('RD3')) {
  const dir = path.join(tmp, 'dist'); const built = build(dir, []);
  if (!built) bad('RD3', 'the build failed'); else {
    const size = fs.statSync(path.join(dir, 'index.html')).size, sib = ['RDKit_minimal.js', 'RDKit_minimal.wasm'].every(f => fs.existsSync(path.join(dir, 'rdkit', f)));
    const srv = await serve(dir), r = await hubStructures('http://127.0.0.1:' + srv.address().port + '/index.html'); srv.close();
    sib && size < 20e6 ? ok() : bad('RD3', 'a deployed build should write rdkit/ and keep the page small: files ' + sib + ', page ' + size + ' bytes');
    r.state === 'ready' && r.ok > 20 && r.svgs > 0 && r.cdn.length === 0 ? ok() : bad('RD3', 'with the CDNs refused the rdkit/ files gave ' + JSON.stringify(r));
  }
}
if (run('RD4')) {
  const ctx = await browser.newContext(), page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); } catch (e) {} });
  const srv = await serve(ROOT);
  await page.goto('http://127.0.0.1:' + srv.address().port + '/apps/dora/dora.html'); await page.waitForTimeout(500);
  const r = await page.evaluate(async () => { loadTestData(); try { await Chem.load(); } catch (e) {} await new Promise(r => setTimeout(r, 400)); switchTab('table'); await new Promise(r => setTimeout(r, 500)); return { chip: document.getElementById('chem-chip').dataset.s, rows: document.querySelectorAll('#table-body tr').length }; });
  srv.close();
  r.chip === 'failed' && r.rows > 20 && !errs.length ? ok() : bad('RD4', 'alone with no RDKit: ' + JSON.stringify(r) + errs.join('|'));
  await ctx.close();
}
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
for (const f of findings) console.log(f);
console.log(`\nrdkit embed invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
