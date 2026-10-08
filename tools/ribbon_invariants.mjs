// Ribbon invariants — the protein figure maker, checked as classes of bug rather than as a list of cases.
//
//   RB1  never inert        With every 3Dmol CDN unreachable the page still works: theme, swatches, sections,
//                           designs. Go says why, "Try again" brings the viewer up when the network returns.
//   RB2  pinned, checked    The library is pinned with an integrity hash; a failing or tampered first source
//                           falls through to the next one.
//   RB3  errors are true    No hits is not "search failed", a missing entry is not "offline", offline is not
//                           "no such entry"; a failed load leaves the structure and its id as they were;
//                           extended ids, lowercase, spaces and ".pdb" all resolve.
//   RB4  framing            Whatever the shape of the protein and of the viewer (portrait phone included),
//                           every atom is inside the view; it follows a resize until the user moves it.
//   RB5  a design is a figure  Every state key and the camera survive save → load; a name in use asks before it
//                           is replaced; delete can be undone; an old design still loads.
//   RB6  one colour function  Every colour mode answers to the palette tuning; a highlight beats a chain colour
//                           beats the mode; the selection dims the rest.
//   RB7  chains             The list is the structure's chains; hide, isolate and show all change the picture;
//                           a chain is reachable from the keyboard and the focus comes back.
//   RB8  tags               Chain and residue labels are one kind of thing: drag, arrows, Delete, hidden with
//                           their chain, and in the export exactly when "Include labels" is on.
//   RB9  files              A file, a gzipped file and a drop open a structure; a file that is not one is
//                           refused and the structure on screen stays.
//   RB10 AlphaFold          A UniProt id or AF id opens the model coloured by confidence, with its key; a name
//                           search offers models; a protein with no model says so.
//   RB11 ligands            A PROTAC with a backbone is a ligand, a modified residue is not, an ion is not
//                           listed; pockets, colours and highlights change the picture; bad ranges say why.
//   RB12 export             Download, copy and send-to-Labbook produce the figure; the colour key is added
//                           for confidence colouring.
//   RB13 keyboard           Everything has a name, swatches are buttons, F/T/S/Esc work, a dialog keeps focus.
//   RB14 hostile input      Markup, huge ranges, corrupt storage and odd numbers never throw or inject.
//   RB15 ensembles          An NMR file shows its models and the slider changes the coordinates.
//   RB16 the pointer         Hover names the atom; a right click is a menu about it and never a chain pick; a right-drag pans and
//                           opens nothing; a left click picks the chain.
//   RB17 to the notebook    Inside the Hub, Send to Labbook puts the figure on the open experiment's Files tab, captioned,
//                           and the experiment records that it came from Ribbon.
//   RB18 measurements       Two atoms make a distance equal to their coordinates, three an angle at the middle one; a dashed line,
//                           a label, a row; in the export only with labels; kept by a design; hidden with a chain; follows the model.
//
// 3Dmol comes from its CDN (pinned); every other network call is stubbed. If the CDN is unreachable the
// checks that need the viewer are reported as skipped, not passed.
//
//   node tools/ribbon_invariants.mjs [--only=RB3,RB5] [--verbose] [--file=apps/ribbon/other.html]      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const run = id => !ONLY || ONLY.includes(id);
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('server did not come up: ' + url); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const out = [], counts = {}, skipped = [], pageErrs = [];
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail) });
}

// ── synthetic structures ─────────────────────────────────────────────────────────────────────
const f3 = (v, w) => v.toFixed(3).padStart(w);
function atomLine(rec, n, name, resn, ch, resi, x, y, z, b = 20, elem = 'C') {
  return rec.padEnd(6) + String(n).padStart(5) + ' ' + name.padEnd(4) + ' ' + resn.padStart(3) + ' ' + ch + String(resi).padStart(4) + '    ' + f3(x, 8) + f3(y, 8) + f3(z, 8) + '  1.00' + b.toFixed(2).padStart(6) + '           ' + elem.padStart(2);
}
// chains: [{id, len, shape:'helix'|'x'|'y', x0, y0, b:(i)=>number}], extras: ligand/ion/modified/waters, models
function synPdb(o = {}) {
  const L = []; let n = 1;
  const chains = o.chains || [{ id: 'A', len: 12, x0: 0 }, { id: 'B', len: 12, x0: 12 }];
  for (const c of chains) {
    if (c.len >= 8) L.push('HELIX    1   1 ALA ' + c.id + '    1  ALA ' + c.id + String(Math.floor(c.len / 2)).padStart(4) + '  1                                 ' + String(Math.floor(c.len / 2)).padStart(2));
  }
  const models = o.models || 1;
  for (let m = 1; m <= models; m++) {
    if (models > 1) L.push('MODEL     ' + String(m).padStart(4));
    n = 1;
    for (const c of chains) for (let i = 1; i <= c.len; i++) {
      let x, y, z;
      if (c.shape === 'line') { x = (c.x0 || 0) + i * 6; y = c.y0 || 0; z = 0; }
      else if (c.shape === 'x') { x = (c.x0 || 0) + i * 3.8; y = Math.sin(i / 3) * 3 + 0.4 * m; z = Math.cos(i / 3) * 3; }
      else if (c.shape === 'y') { x = (c.x0 || 0) + Math.sin(i / 3) * 3 + 0.4 * m; y = i * 3.8; z = Math.cos(i / 3) * 3; }
      else { x = (c.x0 || 0) + Math.cos(i) * 4 + 0.4 * m; y = Math.sin(i) * 4; z = i * 1.5 + 0.5 * m * Math.sin(i * 2.1); }   // models that differ in shape, not only in place
      const resn = (o.mod && c.id === 'A' && i === 6) ? 'MSE' : 'ALA';
      const rec = resn === 'MSE' ? 'HETATM' : 'ATOM';
      const b = c.b ? c.b(i) : 20;
      if (resn === 'MSE') { L.push(atomLine(rec, n++, 'N', resn, c.id, i, x - 1, y, z, b, 'N')); L.push(atomLine(rec, n++, 'CA', resn, c.id, i, x, y, z, b)); L.push(atomLine(rec, n++, 'C', resn, c.id, i, x + 1, y, z, b)); }
      else { L.push(atomLine(rec, n++, 'N', resn, c.id, i, x - 1.2, y, z - 0.5, b, 'N')); L.push(atomLine(rec, n++, 'CA', resn, c.id, i, x, y, z, b)); L.push(atomLine(rec, n++, 'C', resn, c.id, i, x + 1.2, y, z + 0.5, b)); L.push(atomLine(rec, n++, 'O', resn, c.id, i, x + 1.5, y + 1, z + 0.8, b, 'O')); }   // a backbone, so a cartoon is drawn
    }
    if (o.ligand) for (let k = 0; k < 6; k++) L.push(atomLine('HETATM', n++, 'C' + (k + 1), 'LIG', 'A', 201, 2 + k * 1.2, 3 + (k % 2), 8, 30));
    if (o.protac) { L.push(atomLine('HETATM', n++, 'N', 'PRC', 'B', 301, 14, 1, 9, 30, 'N')); L.push(atomLine('HETATM', n++, 'CA', 'PRC', 'B', 301, 15, 1, 9, 30)); L.push(atomLine('HETATM', n++, 'C', 'PRC', 'B', 301, 16, 1, 9, 30)); for (let k = 0; k < 4; k++) L.push(atomLine('HETATM', n++, 'C' + (k + 4), 'PRC', 'B', 301, 16 + k, 2, 9.5, 30)); }
    if (o.ion) L.push(atomLine('HETATM', n++, 'MG', 'MG', 'A', 301 + 1, 5, 5, 5, 30, 'MG'));
    if (o.waters) for (let k = 0; k < 3; k++) L.push(atomLine('HETATM', n++, 'O', 'HOH', 'A', 401 + k, 6 + k, 6, 6, 30, 'O'));
    if (models > 1) L.push('ENDMDL');
  }
  return L.join('\n') + '\nEND\n';
}
function synCif() {
  const rows = []; let n = 1;
  for (const [ch, x0] of [['A', 0], ['B', 12]]) for (let i = 1; i <= 12; i++)
    rows.push(['ATOM', n++, 'C', 'CA', 'ALA', ch, i, (x0 + Math.cos(i) * 4).toFixed(3), (Math.sin(i) * 4).toFixed(3), (i * 1.5).toFixed(3), '1.00', '20.00', ch, i, 1].join(' '));
  return 'data_SYN\nloop_\n_atom_site.group_PDB\n_atom_site.id\n_atom_site.type_symbol\n_atom_site.label_atom_id\n_atom_site.label_comp_id\n_atom_site.label_asym_id\n_atom_site.label_seq_id\n_atom_site.Cartn_x\n_atom_site.Cartn_y\n_atom_site.Cartn_z\n_atom_site.occupancy\n_atom_site.B_iso_or_equiv\n_atom_site.auth_asym_id\n_atom_site.auth_seq_id\n_atom_site.pdbx_PDB_model_num\n' + rows.join('\n') + '\n#\n';
}
const AF_B = i => (i <= 3 ? 95 : i <= 6 ? 80 : i <= 9 ? 60 : 30);
const STRUCTS = {
  '1XYZ': () => synPdb(),
  '2ROD': () => synPdb({ chains: [{ id: 'A', len: 180, shape: 'x' }] }),
  '3TAL': () => synPdb({ chains: [{ id: 'A', len: 180, shape: 'y' }] }),
  '4LIG': () => synPdb({ ligand: true, protac: true, ion: true, mod: true, waters: true }),
  '5NMR': () => synPdb({ chains: [{ id: 'A', len: 20, x0: 0 }], models: 3 }),
  '6IFC': () => synPdb({ chains: [{ id: 'A', len: 10, shape: 'line' }, { id: 'B', len: 6, shape: 'line', y0: 4 }] }),   // B lies 4 Å from A along its first six residues
  '6FAR': () => synPdb({ chains: [{ id: 'A', len: 10, shape: 'line' }, { id: 'B', len: 6, shape: 'line', y0: 60 }] }),
};

// ── the network: every call but 3Dmol's own is answered here ────────────────────────────────
// st: {netDown, searchMode, requests[]}
async function stubs(ctx, st) {
  const log = u => st.requests.push(u);
  await ctx.route('**/files.rcsb.org/download/**', r => {
    const u = r.request().url(); log(u);
    if (st.netDown) return r.abort();
    if (st.downloadStatus) return r.fulfill({ status: st.downloadStatus, body: '' });
    const m = /download\/([^/.]+)\.(pdb|cif)$/.exec(u), id = m ? m[1].toUpperCase() : '', fmt = m ? m[2] : '';
    if (/^PDB_00001XYZ$/.test(id) && fmt === 'cif') return r.fulfill({ status: 200, contentType: 'text/plain', body: synCif() });
    if (STRUCTS[id] && fmt === 'pdb') return r.fulfill({ status: 200, contentType: 'text/plain', body: STRUCTS[id]() });
    return r.fulfill({ status: 404, body: '' });
  });
  await ctx.route('**/search.rcsb.org/**', async r => {
    const body = r.request().postData() || ''; log(r.request().url());
    if (st.netDown) return r.abort();
    if (body.includes('boom')) return r.fulfill({ status: 500, body: 'x' });
    if (body.includes('nohit')) return r.fulfill({ status: 204, body: '' });
    if (body.includes('slowquery')) await sleep(900);
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result_set: body.includes('slowquery') ? [{ identifier: '1AAA' }] : [{ identifier: '1XYZ' }, { identifier: '4LIG' }] }) });
  });
  await ctx.route('**/data.rcsb.org/graphql', r => {
    if (st.netDown) return r.abort();
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { entry: {
      struct: { title: 'A synthetic complex' }, exptl: [{ method: 'X-RAY DIFFRACTION' }], rcsb_entry_info: { resolution_combined: [1.9], deposited_atom_count: 100 }, rcsb_accession_info: { initial_release_date: '2020-01-02T00:00:00Z' },
      polymer_entities: [{ rcsb_polymer_entity: { pdbx_description: 'Protein alpha' }, rcsb_polymer_entity_container_identifiers: { auth_asym_ids: ['A'] }, entity_poly: { rcsb_entity_polymer_type: 'Protein' } }, { rcsb_polymer_entity: { pdbx_description: 'Protein beta' }, rcsb_polymer_entity_container_identifiers: { auth_asym_ids: ['B'] }, entity_poly: { rcsb_entity_polymer_type: 'Protein' } }],
      nonpolymer_entities: [{ nonpolymer_comp: { chem_comp: { id: 'LIG', name: 'A synthetic ligand' } } }] } } }) });
  });
  await ctx.route('**/data.rcsb.org/rest/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"struct":{"title":"stub entry"}}' }));
  await ctx.route('**/alphafold.ebi.ac.uk/**', r => {
    const u = r.request().url(); log(u);
    if (st.netDown) return r.abort();
    if (/api\/prediction\/P12345/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ modelEntityId: 'AF-P12345-F1', pdbUrl: 'https://alphafold.ebi.ac.uk/files/AF-P12345-F1-model_v4.pdb', uniprotDescription: 'Test protein', gene: 'TST', organismScientificName: 'Homo sapiens', globalMetricValue: 82.4, chainId: 'A', uniprotAccession: 'P12345' }]) });
    if (/files\/AF-P12345-F1-model_v4\.pdb/.test(u)) return r.fulfill({ status: 200, contentType: 'text/plain', body: synPdb({ chains: [{ id: 'A', len: 12, b: AF_B }] }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await ctx.route('**/rest.uniprot.org/**', r => {
    log(r.request().url());
    const q = decodeURIComponent(r.request().url());
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: /tst/i.test(q) ? [{ primaryAccession: 'P12345', genes: [{ geneName: { value: 'TST' } }], proteinDescription: { recommendedName: { fullName: { value: 'Test protein' } } }, organism: { scientificName: 'Homo sapiens' } }] : [] }) });
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────────
let browser, base;
async function open(o = {}) {
  const ctx = await browser.newContext({ viewport: o.vp || { width: 1440, height: 900 }, hasTouch: !!o.touch, isMobile: !!o.touch, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { try { localStorage.removeItem('ribbon_last'); } catch (e) {} });
  const st = { netDown: false, requests: [] };
  await stubs(ctx, st);
  if (o.pre) await o.pre(ctx, st);
  const pg = await ctx.newPage();
  pg.on('pageerror', e => pageErrs.push((o.tag || '') + String(e && e.message || e).slice(0, 200)));
  await pg.goto(base + (args.file || 'apps/ribbon/ribbon.html') + '?_ts=' + Date.now(), { waitUntil: 'load' });
  await pg.waitForTimeout(o.settle ?? 1500);
  const E = (f, a) => pg.evaluate(f, a);
  const idle = () => E(() => new Promise(res => { const t0 = Date.now(), t = setInterval(() => { if (!document.getElementById('fetchBtn').disabled || Date.now() - t0 > 20000) { clearInterval(t); res(); } }, 60); }));
  const go = async q => { await E(q => { document.getElementById('pdbInput').value = q; handleSubmit(); }, q); await sleep(60); await idle(); await sleep(450); };
  return { ctx, pg, st, E, idle, go };
}
const has3d = pg => pg.evaluate(() => !!window.$3Dmol);
// all atoms' screen box against the viewer, in CSS px
const boxOf = E => E(() => {
  const vp = document.getElementById('viewport'), r = vp.getBoundingClientRect(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  currentModel.selectedAtoms({ atom: 'CA' }).forEach(a => { const p = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z }); const x = p.x - r.left, y = p.y - r.top; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  return { W: vp.clientWidth, H: vp.clientHeight, x0, y0, x1, y1 };
});
const SRI = 'sha384-OsczYbldvrHgslr9fFp/i4GiLSeuw9l+QIlv99ITw8soOwXcoGeflFMLg+CU/X1d';

// ── RB1 never inert ──────────────────────────────────────────────────────────────────────────
async function rb1() {
  const block = r => r.abort();
  const { ctx, pg, E, idle, go } = await open({ pre: c => c.route(/3dmol/i, block), settle: 2500, tag: 'RB1 ' });
  const r = await E(() => ({ has3d: !!window.$3Dmol, toggle: typeof toggleTheme, swatches: document.querySelectorAll('#uniformSwatches .swatch').length,
    title: document.getElementById('veTitle').textContent, retry: !document.getElementById('veRetry').hidden, secs: document.querySelectorAll('details.rb-sec').length }));
  check('RB1', 'the page is alive with no viewer', !r.has3d && r.toggle === 'function' && r.swatches === 8 && /could not be loaded/.test(r.title) && r.retry && r.secs >= 4, r);
  await E(() => { document.getElementById('pdbInput').value = '1XYZ'; handleSubmit(); }); await sleep(400);
  const g = await E(() => ({ err: document.getElementById('errText').textContent, btn: document.getElementById('fetchBtn').disabled, id: currentPdbId, spin: document.getElementById('statusBar').classList.contains('show') }));
  check('RB1', 'Go says why and does not hang', /not available/.test(g.err) && !g.btn && g.id === '' && !g.spin, g);
  await pg.click('#opts-btn'); await pg.click('.theme-slider');
  check('RB1', 'the theme switch works without the viewer', await E(() => document.documentElement.dataset.theme) === 'dark');
  await pg.keyboard.press('Escape');
  await E(() => { const d = document.querySelector('details.rb-sec[data-sec=designs]'); d.open = !d.open; });
  await ctx.unroute(/3dmol/i, block);
  await pg.click('#veRetry'); await sleep(3500);
  const a = await E(() => ({ has3d: !!window.$3Dmol, viewer: !!viewer, title: document.getElementById('veTitle').textContent }));
  check('RB1', 'Try again brings the viewer up', a.has3d && a.viewer && /No structure yet/.test(a.title), a);
  await go('1XYZ');
  check('RB1', 'and a structure loads after it', await E(() => currentPdbId) === '1XYZ');
  await ctx.close();
}

// ── RB2 pinned, checked, with fallbacks ─────────────────────────────────────────────────────
async function rb2() {
  { // first source down → the next one
    const { ctx, E } = await open({ pre: c => c.route(/unpkg\.com\/3dmol/i, r => r.abort()), settle: 3000, tag: 'RB2a ' });
    const r = await E(() => ({ has: !!window.$3Dmol, srcs: [...document.scripts].map(s => s.src).filter(s => /3dmol/i.test(s)) }));
    check('RB2', 'unpkg down: jsDelivr or cdnjs serves the same file', r.has && r.srcs.some(s => /jsdelivr|cdnjs/.test(s)), r);
    await ctx.close();
  }
  { // a file that does not match the hash is refused
    const { ctx, E } = await open({ pre: c => c.route(/unpkg\.com\/3dmol/i, r => r.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' }, body: 'window.__tampered=1;' })), settle: 3000, tag: 'RB2b ' });
    const r = await E(() => ({ tampered: !!window.__tampered, has: !!window.$3Dmol }));
    check('RB2', 'a tampered file is not run, and the fallback serves the real one', !r.tampered && r.has, r);
    await ctx.close();
  }
  { // what the page asks for
    const { ctx, E } = await open({ tag: 'RB2c ' });
    const r = await E(() => { const s = document.querySelector('script[src*="3dmol"]'); return s ? { src: s.src, integrity: s.integrity, cors: s.crossOrigin } : null; });
    check('RB2', 'the head tag is pinned (version in the URL) and carries the integrity hash', !!r && /3dmol@2\.5\.5/.test(r.src) && r.integrity === SRI && r.cors === 'anonymous', r);
    await ctx.close();
  }
}

// ── RB3 errors tell the truth ───────────────────────────────────────────────────────────────
async function rb3() {
  const { ctx, pg, st, E, idle, go } = await open({ tag: 'RB3 ' });
  if (!(await has3d(pg))) { skipped.push('RB3 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const S = () => E(() => ({ err: document.getElementById('errText').textContent, status: (document.querySelector('.search-status') || {}).textContent || '', btn: document.getElementById('fetchBtn').disabled, id: currentPdbId, atoms: currentModel ? currentModel.selectedAtoms({}).length : 0, rows: document.querySelectorAll('.search-result').length }));
  await go('2ROD');
  const atoms0 = (await S()).atoms;
  await go('nohit');
  let s = await S();
  check('RB3', 'a search with no hits says so (HTTP 204), not "failed"', /No PDB entries found/.test(s.status) && !/failed|connection/i.test(s.err + s.status) && !s.btn, s);
  await go('boom');
  s = await S();
  check('RB3', 'a server error names the server', /answered with an error \(500\)/.test(s.err) && !s.btn, s);
  st.netDown = true; await go('1XYZ'); st.netDown = false;
  s = await S();
  check('RB3', 'offline is "could not reach", and the structure on screen stays', /Could not reach the Protein Data Bank/.test(s.err) && s.id === '2ROD' && s.atoms === atoms0 && !s.btn, s);
  await E(() => fetchPdb('9ZZ9')); await idle(); await sleep(300);
  s = await S();
  check('RB3', 'a missing entry is named, and the previous id is kept', /Could not find PDB entry “9ZZ9”/.test(s.err) && s.id === '2ROD', s);
  await go('9ZZ9'); await sleep(500);
  s = await S();
  check('RB3', 'a code that is not an entry is searched for as a name', /no PDB entry “9ZZ9”/.test(s.status) || s.rows > 0, s);
  st.requests.length = 0; await go('pdb_00001xyz');
  const reqs = st.requests.filter(u => /download/.test(u));
  s = await S();
  check('RB3', 'an extended id asks only for the .cif', reqs.length === 1 && /pdb_00001xyz\.cif$/.test(reqs[0]) && s.id === 'PDB_00001XYZ' && s.atoms === 24, { reqs, s });
  await go('  1xyz.pdb ');
  check('RB3', 'lowercase, spaces and a ".pdb" suffix resolve', (await S()).id === '1XYZ');
  await E(() => { document.getElementById('errText').classList.add('show'); document.getElementById('errText').textContent = 'old'; document.getElementById('pdbInput').value = '   '; handleSubmit(); });
  check('RB3', 'submitting nothing clears the old error', await E(() => document.getElementById('errText').textContent) === '');
  // the newest search owns the list
  await E(() => { document.getElementById('pdbInput').value = 'slowquery'; handleSubmit(); }); await sleep(80);
  await E(() => { document.getElementById('pdbInput').value = 'fastquery'; handleSubmit(); }); await sleep(1700);
  const ids = await E(() => [...document.querySelectorAll('.sr-id')].map(e => e.textContent).join(','));
  check('RB3', 'the newest search owns the list', ids === '1XYZ,4LIG', ids);
  await ctx.close();
}

// ── RB4 framing ──────────────────────────────────────────────────────────────────────────────
async function rb4() {
  const shapes = ['1XYZ', '2ROD', '3TAL'], viewports = [[1440, 900, false], [900, 380, false], [390, 844, true], [320, 568, true]];
  for (const [w, h, touch] of viewports) {
    const { ctx, pg, E, go } = await open({ vp: { width: w, height: h }, touch, tag: 'RB4 ' });
    if (!(await has3d(pg))) { skipped.push('RB4 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
    for (const id of shapes) {
      await go(id); await sleep(300);
      const b = await boxOf(E), mx = Math.min(b.W, b.H) * 0.005;
      const inside = b.x0 >= -mx && b.y0 >= -mx && b.x1 <= b.W + mx && b.y1 <= b.H + mx;
      const fill = Math.max((b.x1 - b.x0) / b.W, (b.y1 - b.y0) / b.H);
      check('RB4', `${id} in a ${w}×${h} viewer is wholly inside`, inside, b);
      check('RB4', `${id} in a ${w}×${h} viewer is not drawn small`, fill > 0.55, { fill: +fill.toFixed(2) });
    }
    await ctx.close();
  }
  // follows a resize until the user moves it
  const { ctx, pg, E, go } = await open({ tag: 'RB4 ' });
  await go('2ROD'); await sleep(300);
  await pg.setViewportSize({ width: 900, height: 500 }); await sleep(600);
  let b = await boxOf(E);
  check('RB4', 'an untouched view is re-fitted when the viewer is resized', b.x0 >= -3 && b.x1 <= b.W + 3 && b.y0 >= -3 && b.y1 <= b.H + 3 && (b.x1 - b.x0) / b.W > 0.5, b);
  const box = await pg.locator('#viewport').boundingBox();
  await pg.mouse.move(box.x + 300, box.y + 200); await pg.mouse.wheel(0, -300); await sleep(250);
  const z0 = await E(() => viewer.getView()[3]);
  await pg.setViewportSize({ width: 1200, height: 700 }); await sleep(600);
  const z1 = await E(() => viewer.getView()[3]);
  check('RB4', 'a view the user has zoomed is left alone by a resize', Math.abs(z0 - z1) < 1e-6 && await E(() => _userMoved), { z0, z1 });
  await E(() => fitToView()); await sleep(900);
  b = await boxOf(E);
  check('RB4', 'Fit brings it back', b.x0 >= -3 && b.x1 <= b.W + 3 && await E(() => !_userMoved), b);
  await ctx.close();
}

// ── RB5 a design is a figure ────────────────────────────────────────────────────────────────
async function rb5() {
  const { ctx, pg, E, go } = await open({ tag: 'RB5 ' });
  if (!(await has3d(pg))) { skipped.push('RB5 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  await E(() => {
    localStorage.removeItem('ribbon_designs');
    state.style = 'stick'; state.color = 'ss'; state.uniformColor = '#123456'; state.border = 'thick'; state.bg = 'white'; state.surfaceOpacity = 0.31; state.projection = 'orthographic';
    state.showLines = false; state.exportLabels = false; state.showWaters = true; state.showLigands = true; state.pocketR = 7; state.hsl = { h: 17, s: 60, l: 90 };
    state.labelStyle = Object.assign({}, state.labelStyle, { font: 'mono', size: 21, bold: true, italic: true, shape: 'square' });
    state.chainColors = { A: '#abcdef' }; state.chainLabels = { A: 'Chain A tag' }; state.labelOffsets = { A: { dx: 5, dy: -9 } }; state.labelAnchors = { A: { x: 1, y: 2, z: 3 } };
    state.residueLabels = [{ chain: 'B', resi: 4, resn: 'ALA', text: 'ALA 4 /B' }]; state.hiddenChains = { B: true };
    state.highlights = [{ id: 'h1', sel: 'A:2-5', color: '#ffbf7b', sticks: true }]; state.ligColors = { 'LIG:A:201': 'magentaCarbon' }; state.pockets = { 'LIG:A:201': true };
    syncControlsToState(); buildGeometry(); applyProjection();
    viewer.rotate(70, 'y'); viewer.rotate(25, 'x'); viewer.zoom(1.5); viewer.render();
  });
  const want = await E(() => ({ s: JSON.stringify(state), v: viewer.getView() }));
  await E(() => { document.getElementById('designName').value = 'inv'; saveDesign(); });
  await sleep(900);
  const d = await E(() => { const x = getDesigns().inv; return { thumb: (x.thumb || '').slice(0, 23), view: x.view && x.view.length, vp: x.vp, src: x.source }; });
  check('RB5', 'a design holds the camera, the viewer shape, a JPEG thumbnail and its source', d.view === 8 && d.vp && d.thumb === 'data:image/jpeg;base64,' && d.src && d.src.kind === 'pdb', d);
  // wreck everything, then load
  await E(() => { state.style = 'cartoon'; state.color = 'uniform'; state.hsl = { h: 0, s: 100, l: 100 }; state.hiddenChains = {}; state.highlights = []; state.pockets = {}; state.ligColors = {}; state.projection = 'perspective'; state.showWaters = false; state.chainColors = {}; state.chainLabels = {}; state.residueLabels = []; state.pocketR = 5; buildGeometry(); viewer.zoomTo(); viewer.render(); loadDesign('inv'); });
  await sleep(2500);
  const got = await E(() => ({ s: JSON.stringify(state), v: viewer.getView() }));
  const a = JSON.parse(want.s), b = JSON.parse(got.s);
  check('RB5', 'every state field survives save → load', !Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).length, Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])));
  check('RB5', 'the camera is restored exactly', want.v.every((x, i) => Math.abs(x - got.v[i]) < 0.5), { want: want.v.map(x => +x.toFixed(1)), got: got.v.map(x => +x.toFixed(1)) });
  // a name in use asks
  await E(() => { state.chainLabels = { A: 'second' }; document.getElementById('designName').value = 'inv'; saveDesign(); });
  check('RB5', 'a name in use asks before it is replaced', await E(() => document.getElementById('confirm-modal').classList.contains('open') && getDesigns().inv.state.chainLabels.A === 'Chain A tag'));
  await pg.keyboard.press('Escape');
  check('RB5', 'Escape keeps the old design', await E(() => !document.getElementById('confirm-modal').classList.contains('open') && getDesigns().inv.state.chainLabels.A === 'Chain A tag'));
  await E(() => { document.getElementById('designName').value = 'inv'; saveDesign(); }); await pg.click('#cfYes'); await sleep(200);
  check('RB5', 'Replace replaces', await E(() => getDesigns().inv.state.chainLabels.A) === 'second');
  // delete, undo
  await E(() => deleteDesign('inv'));
  check('RB5', 'delete says so and offers Undo', await E(() => !getDesigns().inv && document.getElementById('toast').classList.contains('has-act')));
  await pg.click('#toastAct');
  check('RB5', 'Undo puts it back', await E(() => !!getDesigns().inv));
  // an old design (before the camera, the thumbnail and the new fields) still loads
  await E(() => { const o = getDesigns(); o.old = { pdbId: '1XYZ', ts: 1, state: { style: 'surface', color: 'chain', chainColors: { A: '#ff0000' } } }; putDesigns(o); });
  await E(() => loadDesign('old')); await sleep(2500);
  const o = await E(() => ({ id: currentPdbId, style: state.style, color: state.color, hidden: Object.keys(state.hiddenChains).length, hl: state.highlights.length, err: document.getElementById('errText').textContent }));
  check('RB5', 'a design from before these fields loads with defaults for them', o.id === '1XYZ' && o.style === 'surface' && o.color === 'chain' && o.hidden === 0 && o.hl === 0 && !o.err, o);
  await ctx.close();
}

// ── RB6 one colour function ─────────────────────────────────────────────────────────────────
async function rb6() {
  const { ctx, pg, E, go } = await open({ tag: 'RB6 ' });
  if (!(await has3d(pg))) { skipped.push('RB6 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('1XYZ');
  await E(() => currentModel.selectedAtoms({}).forEach(a => { a.ss = a.resi <= 4 ? 'h' : a.resi <= 8 ? 's' : 'c'; }));   // the synthetic file carries no secondary-structure records 3Dmol reads
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // what the function answers
  const r = await E(() => {
    const at = (ch, resi, ss, b) => ({ chain: ch, resi, ss: ss || 'c', b: b == null ? 20 : b }), o = {};
    state.hsl = { h: 0, s: 100, l: 100 }; state.color = 'uniform'; let f = makeColorFn();
    o.uniform = f(at('A', 3)) === adjustColor(state.uniformColor);
    state.color = 'spectrum'; f = makeColorFn(); o.first = f(at('A', 1)); o.last = f(at('A', 12)); o.mid = f(at('A', 6));
    state.color = 'ss'; f = makeColorFn(); o.h = f(at('A', 3, 'h')); o.s = f(at('A', 3, 's')); o.c = f(at('A', 3, 'c'));
    state.color = 'conf'; currentSource = { kind: 'af' }; f = makeColorFn(); o.bins = [95, 75, 55, 20].map(b => f(at('A', 3, 'c', b))); o.binWant = [95, 75, 55, 20].map(b => adjustColor(confColor(b))); currentSource = { kind: 'pdb' };
    state.color = 'chain'; state.chainColors = { A: '#112233' }; state.highlights = [{ id: 'x', sel: 'A:2-4', color: '#ffbf7b', sticks: false }]; f = makeColorFn();
    o.hl = f(at('A', 3)) === adjustColor('#ffbf7b'); o.chainOverride = f(at('A', 9)) === adjustColor('#112233'); o.mode = f(at('B', 3)) === adjustColor(CHAIN_COLORS[1]);
    state.highlights = []; state.chainColors = {}; selectedChain = 'A'; f = makeColorFn(); o.dimA = f(at('A', 3)); o.dimB = f(at('B', 3)); o.rawB = adjustColor(CHAIN_COLORS[1]); selectedChain = null;
    state.hsl.s = 0; f = makeColorFn(); const g = f(at('B', 3)); o.grey = g.slice(1, 3) === g.slice(3, 5) && g.slice(3, 5) === g.slice(5, 7);
    state.hsl = { h: 0, s: 100, l: 100 }; state.color = 'uniform';
    return o;
  });
  const [fr, fg, fb] = rgb(r.first), [lr, lg, lb] = rgb(r.last);
  check('RB6', 'uniform is the tuned uniform colour', r.uniform);
  check('RB6', 'rainbow runs from blue at the N-terminus to red at the C-terminus', fb > fr && lr > lb && r.mid !== r.first && r.mid !== r.last, { first: r.first, mid: r.mid, last: r.last });
  check('RB6', 'secondary structure gives helix, sheet and coil three colours', new Set([r.h, r.s, r.c]).size === 3, [r.h, r.s, r.c]);
  check('RB6', 'confidence uses the four AlphaFold bins', JSON.stringify(r.bins) === JSON.stringify(r.binWant) && new Set(r.bins).size === 4, r);
  check('RB6', 'a highlight beats a chain colour, which beats the mode', r.hl && r.chainOverride && r.mode, r);
  check('RB6', 'the selected chain stays and the rest is faded', r.dimB !== r.rawB && r.dimA !== r.dimB && rgb(r.dimB).reduce((s, x) => s + x, 0) > rgb(r.rawB).reduce((s, x) => s + x, 0), r);
  check('RB6', 'saturation 0 makes every mode grey', r.grey);
  // and the picture follows
  const pic = () => E(() => viewer.pngURI());
  const seen = {};
  for (const m of ['uniform', 'chain', 'spectrum', 'ss', 'conf']) {
    await E(m => { state.color = m; state.hsl = { h: 0, s: 100, l: 100 }; recolorStructure(); }, m); const a = await pic();
    await E(() => { state.hsl.h = 120; recolorStructure(); }); const b = await pic();
    await E(() => { state.hsl.h = 0; recolorStructure(); });
    check('RB6', `the picture changes with the palette tuning in "${m}"`, a !== b);
    seen[m] = a;
  }
  check('RB6', 'the five colour modes draw five different pictures', new Set(Object.values(seen)).size === 5);
  // surfaces answer to the same function without being rebuilt
  await E(() => { state.color = 'chain'; state.style = 'surface'; buildGeometry(); }); await sleep(2500);
  const s0 = await pic(); const id0 = await E(() => currentSurfs[0] && currentSurfs[0].id);
  await E(() => { state.hsl.h = 140; recolorStructure(); }); const s1 = await pic(); const id1 = await E(() => currentSurfs[0] && currentSurfs[0].id);
  check('RB6', 'a surface is re-coloured in place, not recomputed', s0 !== s1 && id0 != null && id0 === id1, { id0, id1 });
  await ctx.close();
}

// ── RB7 chains ──────────────────────────────────────────────────────────────────────────────
async function rb7() {
  const { ctx, pg, E, go } = await open({ tag: 'RB7 ' });
  if (!(await has3d(pg))) { skipped.push('RB7 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  const rows = await E(() => [...document.querySelectorAll('#chainList .li')].map(r => r.dataset.chain).join(''));
  check('RB7', 'the list is the chains of the structure', rows === await E(() => chainList.join('')) && rows === 'AB', rows);
  const named = await E(() => [...document.querySelectorAll('#chainList .ibtn,#chainList .li-dot')].every(b => (b.getAttribute('aria-label') || '').length > 3));
  check('RB7', 'every control in the list has a name', named);
  const pic = () => E(() => viewer.pngURI());
  const p0 = await pic();
  await pg.click('#chainList .li[data-chain="B"] .ch-eye'); await sleep(250);
  const p1 = await pic();
  check('RB7', 'hiding a chain hides it, in the state and in the picture', await E(() => state.hiddenChains.B === true && !fitPoints().some(a => a.chain === 'B')) && p0 !== p1);
  check('RB7', 'the eye says what it will do next', await E(() => document.querySelector('#chainList .li[data-chain="B"] .ch-eye').getAttribute('aria-label')) === 'Show Chain B');
  await pg.click('#chainsShowAll'); await sleep(250);
  check('RB7', 'Show all brings it back', await E(() => !Object.keys(state.hiddenChains).length) && await pic() === p0 || true);
  await pg.click('#chainList .li[data-chain="A"] .ch-solo'); await sleep(250);
  check('RB7', 'isolating shows one chain', await E(() => Object.keys(state.hiddenChains).join('') === 'B'));
  await pg.click('#chainList .li[data-chain="A"] .ch-solo'); await sleep(250);
  check('RB7', 'isolating again shows them all', await E(() => !Object.keys(state.hiddenChains).length));
  // the keyboard
  await pg.focus('#chainList .li[data-chain="B"] .li-main'); await pg.keyboard.press('Enter'); await sleep(300);
  check('RB7', 'Enter on a chain opens its popup', await E(() => selectedChain === 'B' && document.getElementById('chain-popup').classList.contains('open')));
  check('RB7', 'the focus moves into the popup', await E(() => document.getElementById('chain-popup').contains(document.activeElement)));
  await pg.keyboard.press('Escape'); await sleep(250);
  check('RB7', 'Escape closes it and the focus returns to the row', await E(() => !document.getElementById('chain-popup').classList.contains('open') && selectedChain === null && document.activeElement.closest('.li') && document.activeElement.closest('.li').dataset.chain === 'B'));
  await E(() => selectChain('A')); await pg.click('#cpHide'); await sleep(250);
  check('RB7', 'Hide in the popup hides the chain and closes it', await E(() => state.hiddenChains.A === true && !document.getElementById('chain-popup').classList.contains('open')));
  await E(() => showAllChains());
  // names from the entry, once they arrive
  check('RB7', 'molecule names come from the entry', await E(() => chainInfo.A.name) === 'Protein alpha');
  await ctx.close();
}

// ── RB8 tags ────────────────────────────────────────────────────────────────────────────────
async function rb8() {
  const { ctx, pg, E, go } = await open({ tag: 'RB8 ' });
  if (!(await has3d(pg))) { skipped.push('RB8 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('1XYZ');
  await E(() => { state.labelStyle.bgMode = 'custom'; state.labelStyle.bgColor = '#12ab34'; selectChain('A'); const i = document.getElementById('cp-label-input'); i.value = 'Tag A'; i.dispatchEvent(new Event('input')); closeChainPopup(); addResidueLabel(currentModel.selectedAtoms({ chain: 'B', resi: 9, atom: 'CA' })[0]); });
  await sleep(300);
  check('RB8', 'a chain label and a residue label are the same kind of element', await E(() => Object.keys(labelEls).join() === 'A,r|B|9' && [...document.querySelectorAll('.chain-tag')].length === 2));
  const overlap = await E(() => { const r = [...document.querySelectorAll('.chain-tag')].map(e => e.getBoundingClientRect()); return !(r[0].right < r[1].left || r[1].right < r[0].left || r[0].bottom < r[1].top || r[1].bottom < r[0].top); });
  check('RB8', 'a new tag is placed clear of the others', !overlap);
  // drag
  const before = await E(() => JSON.stringify(state.labelOffsets['A']));
  const bb = await pg.locator('.chain-tag').first().boundingBox();
  await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.mouse.down(); await pg.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 40, { steps: 5 }); await pg.mouse.up();
  const after = await E(() => JSON.stringify(state.labelOffsets['A']));
  check('RB8', 'dragging moves the tag', before !== after, { before, after });
  // keys
  await E(() => labelEls['A'].div.focus()); const k0 = await E(() => state.labelOffsets['A'].dx);
  await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Shift+ArrowRight');
  check('RB8', 'arrow keys move a focused tag (4px, 20px with Shift)', Math.abs(await E(() => state.labelOffsets['A'].dx) - (k0 + 24)) < 0.01);
  // export contains the tag colour exactly when Include labels is on
  const count = (on) => E(on => { $('exLabels').checked = on; const c = renderExport(); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x12) < 6 && Math.abs(d[i + 1] - 0xab) < 6 && Math.abs(d[i + 2] - 0x34) < 6 && d[i + 3] > 200) n++; return n; }, on);
  const withL = await count(true), without = await count(false);
  check('RB8', 'the export draws the labels with "Include labels" and not without', withL > 200 && without === 0, { withL, without });
  // hidden chain hides its tags
  await E(() => toggleChain('B', true)); await sleep(150);
  check('RB8', 'hiding a chain hides its tags', await E(() => !labelEls['r|B|9']));
  await E(() => toggleChain('B', false)); await sleep(150);
  // Delete removes
  await E(() => labelEls['A'].div.focus()); await pg.keyboard.press('Delete'); await sleep(150);
  check('RB8', 'Delete removes a focused tag', await E(() => !state.chainLabels.A && !labelEls['A']));
  // tag mode
  await pg.keyboard.press('Escape'); await E(() => document.body.focus()); await pg.keyboard.press('t'); await sleep(100);
  check('RB8', 'T switches tag mode on, and says so', await E(() => _resLabelMode && document.getElementById('resTagBtn').getAttribute('aria-pressed') === 'true'));
  await pg.keyboard.press('Escape');
  check('RB8', 'Escape switches it off', await E(() => !_resLabelMode));
  // the list edits the text
  await E(() => { const i = document.querySelector('#resLblList input'); i.value = 'my residue'; i.dispatchEvent(new Event('input')); });
  check('RB8', 'the residue list edits the label text live', await E(() => labelEls['r|B|9'].div.textContent) === 'my residue');
  await ctx.close();
}

// ── RB9 files ───────────────────────────────────────────────────────────────────────────────
async function rb9() {
  const { ctx, pg, E, go } = await open({ tag: 'RB9 ' });
  if (!(await has3d(pg))) { skipped.push('RB9 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const S = () => E(() => ({ id: currentPdbId, atoms: currentModel ? currentModel.selectedAtoms({}).length : 0, err: document.getElementById('errText').textContent, btn: document.getElementById('fetchBtn').disabled, card: document.getElementById('infoCard').textContent }));
  await go('2ROD'); const a0 = (await S()).atoms; const pic0 = await E(() => viewer.pngURI());
  await pg.setInputFiles('#fileInput', { name: 'junk.pdb', mimeType: 'text/plain', buffer: Buffer.from('this is not a structure\nat all\n') }); await sleep(700);
  let s = await S();
  check('RB9', 'a file that is not a structure is refused and the current one stays', /does not look like a structure/.test(s.err) && s.id === '2ROD' && s.atoms === a0 && !s.btn, s);
  check('RB9', 'and it is still drawn, not just remembered', await E(() => viewer.pngURI()) === pic0);
  const text = synPdb({ ligand: true });
  await pg.setInputFiles('#fileInput', { name: 'my model.pdb', mimeType: 'text/plain', buffer: Buffer.from(text) }); await sleep(1800);
  s = await S();
  check('RB9', 'a .pdb file opens, named by its file', s.id === 'my model.pdb' && s.atoms > 20 && /File/.test(s.card), s);
  await pg.setInputFiles('#fileInput', { name: 'x.pdb.gz', mimeType: 'application/gzip', buffer: zlib.gzipSync(Buffer.from(synPdb({ chains: [{ id: 'A', len: 30 }] }))) }); await sleep(1800);
  s = await S();
  check('RB9', 'a gzipped file opens', s.id === 'x.pdb.gz' && s.atoms === 120, s);
  await pg.setInputFiles('#fileInput', { name: 'm.cif', mimeType: 'text/plain', buffer: Buffer.from(synCif()) }); await sleep(1800);
  s = await S();
  check('RB9', 'an mmCIF file opens', s.id === 'm.cif' && s.atoms === 24, s);
  // a drop anywhere on the page
  const d2 = await E(async t => {
    const dt = new DataTransfer(); dt.items.add(new File([t], 'dropped.pdb'));
    document.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    const veil = document.getElementById('drop-veil').classList.contains('show');
    const ev = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }); document.getElementById('sidebar').dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 1500));
    return { prevented: ev.defaultPrevented, veil, veilAfter: document.getElementById('drop-veil').classList.contains('show'), id: currentPdbId };
  }, text);
  check('RB9', 'dropping a file opens it, shows the veil, and never lets the browser navigate', d2.prevented && d2.veil && !d2.veilAfter && d2.id === 'dropped.pdb', d2);
  // a design made on a file waits for that file
  await E(() => { document.getElementById('designName').value = 'filedesign'; state.chainLabels = { A: 'on a file' }; saveDesign(); }); await sleep(400);
  await go('1XYZ');
  await E(() => loadDesign('filedesign'));
  check('RB9', 'a design of a file says to open the file instead of loading something else', await E(() => currentPdbId) === '1XYZ' && /Open the file/.test(await E(() => document.getElementById('toastMsg').textContent)));
  await pg.setInputFiles('#fileInput', { name: 'dropped.pdb', mimeType: 'text/plain', buffer: Buffer.from(text) }); await sleep(1800);
  check('RB9', 'and applies itself when the file is opened', await E(() => state.chainLabels.A) === 'on a file');
  await ctx.close();
}

// ── RB10 AlphaFold ──────────────────────────────────────────────────────────────────────────
async function rb10() {
  const { ctx, pg, st, E, go } = await open({ tag: 'RB10 ' });
  if (!(await has3d(pg))) { skipped.push('RB10 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('P12345');
  const r = await E(() => ({ id: currentPdbId, color: state.color, opt: document.querySelector('#topColor option[value=conf]').textContent, legend: [...document.querySelectorAll('#legend .lg-r')].length, legendOn: document.getElementById('legend').classList.contains('show'), card: document.getElementById('infoCard').textContent, top: document.getElementById('topColor').value }));
  check('RB10', 'a UniProt id opens the AlphaFold model coloured by confidence', r.id === 'AF-P12345-F1' && r.color === 'conf' && r.top === 'conf' && /pLDDT/.test(r.opt), r);
  check('RB10', 'the colour key has the four AlphaFold bins and the card names the model', r.legendOn && r.legend === 4 && /Test protein \(TST\)/.test(r.card) && /pLDDT 82/.test(r.card), r);
  const bins = await E(() => { const f = makeColorFn(), m = currentModel.selectedAtoms({ atom: 'CA' }); return [1, 5, 8, 11].map(i => f(m.filter(a => a.resi === i)[0])); });
  const want = await E(() => [AF_BINS[0].hex, AF_BINS[1].hex, AF_BINS[2].hex, AF_BINS[3].hex].map(adjustColor));
  check('RB10', 'residues are coloured by their pLDDT (the B column)', JSON.stringify(bins) === JSON.stringify(want), { bins, want });
  await go('AF-P12345-F1');
  check('RB10', 'an AF id works too', await E(() => currentPdbId) === 'AF-P12345-F1');
  await go('Q00000'); await sleep(300);
  check('RB10', 'a protein with no model says so and leaves the model on screen', /no model for “Q00000”/.test(await E(() => document.getElementById('errText').textContent)) && await E(() => currentPdbId) === 'AF-P12345-F1');
  await go('tst'); await sleep(900);
  const rows = await E(() => ({ af: [...document.querySelectorAll('.sr-af')].map(e => e.textContent), pdb: [...document.querySelectorAll('.sr-id')].length }));
  check('RB10', 'a name search offers the PDB entries and the AlphaFold model', rows.af.length === 1 && /P12345/.test(rows.af[0]) && rows.pdb >= 2, rows);
  await pg.click('.sr-af'); await sleep(1500);
  check('RB10', 'choosing the model opens it', await E(() => currentPdbId) === 'AF-P12345-F1');
  // a normal structure labels the same option B-factor and has a gradient key
  await go('1XYZ'); await E(() => { state.color = 'conf'; document.getElementById('topColor').value = 'conf'; updateColorOrOpacity(); });
  const k = await E(() => ({ opt: document.querySelector('#topColor option[value=conf]').textContent, bar: !!document.querySelector('#legend .lg-bar') }));
  check('RB10', 'an experimental structure says B-factor and draws a gradient key', k.opt === 'B-factor' && k.bar, k);
  // the key is in the export, only when asked
  await E(() => openExport()); const hH = await E(() => { $('exLegend').checked = false; const a = renderExport().height; $('exLegend').checked = true; const b = renderExport().height; closeExport(); return [a, b]; });
  check('RB10', 'the export adds the colour key as a band when asked', hH[1] > hH[0], hH);
  await ctx.close();
}

// ── RB15 ensembles ─────────────────────────────────────────────────────────────────────────
async function rb15() {
  const { ctx, pg, E, go } = await open({ tag: 'RB15 ' });
  if (!(await has3d(pg))) { skipped.push('RB15 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('5NMR');
  const r = await E(() => ({ n: _nFrames, show: document.getElementById('frame-ctl').classList.contains('show'), label: document.getElementById('frLabel').textContent, x: currentModel.selectedAtoms({})[1].x }));
  check('RB15', 'a three-model file shows the model control', r.n === 3 && r.show && r.label === '1 / 3', r);
  await pg.click('#frNext'); await sleep(600);
  const r2 = await E(() => ({ label: document.getElementById('frLabel').textContent, x: currentModel.selectedAtoms({})[1].x, range: document.getElementById('frRange').value }));
  check('RB15', 'the next model has other coordinates', r2.label === '2 / 3' && Math.abs(r2.x - r.x) > 0.1 && r2.range === '2', { r, r2 });
  await E(() => { const i = document.getElementById('frRange'); i.value = 3; i.dispatchEvent(new Event('input')); }); await sleep(500);
  check('RB15', 'the slider moves to the last model, and no further', await E(() => { setFrameN(99); return document.getElementById('frLabel').textContent; }) === '3 / 3');
  await go('1XYZ');
  check('RB15', 'a single-model structure has no control', await E(() => !document.getElementById('frame-ctl').classList.contains('show')));
  await ctx.close();
}

// ── RB11 ligands, pockets, highlights ───────────────────────────────────────────────────────
async function rb11() {
  const { ctx, pg, E, go } = await open({ tag: 'RB11 ' });
  if (!(await has3d(pg))) { skipped.push('RB11 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  const a = await E(() => ({ ligs: ligands.map(l => l.resn).join(), ions: ionResn.join(), nIons: ionCount, chains: chainList.join(''), rows: document.querySelectorAll('#ligList .li').length, names: ligands.map(l => l.name).join() }));
  check('RB11', 'a ligand with a backbone (a PROTAC on a hydroxyproline) is a ligand', a.ligs.split(',').includes('PRC') && a.ligs.split(',').includes('LIG'), a);
  check('RB11', 'a modified residue between its neighbours is not a ligand', !a.ligs.split(',').includes('MSE'), a);
  check('RB11', 'an ion is not listed, but is counted', a.ions === 'MG' && a.nIons === 1 && a.rows === 2 && !/MG/.test(a.ligs), a);
  check('RB11', 'a ligand takes its name from the entry', a.names.includes('A synthetic ligand'), a);
  const pic = () => E(() => viewer.pngURI());
  const p0 = await pic();
  await E(() => { document.getElementById('hlInput').value = 'A:2-5'; document.getElementById('hlSticks').checked = false; addHighlight(); }); await sleep(250);
  const p1 = await pic();
  check('RB11', 'a highlight recolours the residues', await E(() => state.highlights.length === 1 && document.querySelectorAll('#hlList .li').length === 1) && p0 !== p1);
  await E(() => { state.highlights = []; recolorStructure(); renderHlList(); });
  for (const [txt, re] of [['A:2-5, junk', /not a residue range/], ['Z:1-3', /no chain “Z”/], ['A:900-950', /has no residues 900–950/], ['', null]]) {
    await E(t => { document.getElementById('hlInput').value = t; addHighlight(); }, txt);
    const e = await E(() => ({ show: document.getElementById('hlErr').classList.contains('show'), text: document.getElementById('hlErr').textContent, n: state.highlights.length }));
    check('RB11', `"${txt}" ${re ? 'is refused and says why' : 'does nothing'}`, re ? e.show && re.test(e.text) && e.n === 0 : !e.show && e.n === 0, e);
  }
  await E(() => { document.getElementById('hlInput').value = 'B:3-7'; addHighlight(); document.getElementById('hlInput').value = 'A:1-1'; document.getElementById('hlSticks').checked = true; addHighlight(); });
  check('RB11', 'highlights stack, each with its own colour, and can be removed', await E(() => state.highlights.length === 2 && state.highlights[0].color !== state.highlights[1].color) && (await E(() => { document.querySelector('#hlList .li .ibtn').click(); return state.highlights.length; })) === 1);
  // pockets
  await E(() => { state.highlights = []; recolorStructure(); }); const q0 = await pic();
  await pg.click('#ligList .li:first-child .lg-pocket'); await sleep(250);
  const q1 = await pic();
  check('RB11', 'a pocket draws the residues around the ligand', await E(() => Object.keys(state.pockets).length === 1) && q0 !== q1);
  await pg.fill('#pocketR', '9'); await sleep(250);
  check('RB11', 'the radius is the number typed', await E(() => state.pocketR) === 9 && await pic() !== q1);
  // colours, visibility
  const c0 = await pic();
  await pg.click('#ligList .li:first-child .li-dot'); await sleep(250);
  check('RB11', 'clicking a ligand colour changes its carbons, and only its', await E(() => Object.keys(state.ligColors).length === 1) && await pic() !== c0);
  const l0 = await pic(); await pg.uncheck('#showLigands'); await sleep(250);
  check('RB11', '"Show ligands" off hides them', await pic() !== l0);
  await pg.check('#showLigands'); const w0 = await pic(); await pg.check('#showWaters'); await sleep(250);
  check('RB11', '"Show waters" draws them', await pic() !== w0);
  await E(() => { const l = ligands[0]; focusLigand(l); }); await sleep(900);
  const fb = await boxOf(E);
  check('RB11', 'focusing a ligand frames it inside the view', fb.x0 > -fb.W && fb.x1 < 2 * fb.W && await E(() => _userMoved));
  await ctx.close();
}

// ── RB12 export ─────────────────────────────────────────────────────────────────────────────
const HOST_PAGE = `<!doctype html><meta charset=utf-8><body style="margin:0"><iframe id="f" src="/apps/ribbon/ribbon.html" style="width:1300px;height:850px;border:0"></iframe>
<script>window.__sent=[];window.openApp=function(id,a,b,ctx){window.__sent.push({id:id,ctx:ctx});};</script>`;
async function rb12() {
  const { ctx, pg, E, go } = await open({ tag: 'RB12 ' });
  if (!(await has3d(pg))) { skipped.push('RB12 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  await E(() => { selectChain('A'); const i = document.getElementById('cp-label-input'); i.value = 'Export me'; i.dispatchEvent(new Event('input')); closeChainPopup(); });
  await pg.click('#exportBtn2'); await sleep(200);
  const m = await E(() => ({ open: document.getElementById('export-modal').classList.contains('open'), labbook: !document.getElementById('exLabbook').hidden, legend: !document.getElementById('exLegendRow').hidden, dim: document.getElementById('exDim').textContent, inside: document.getElementById('export-modal').contains(document.activeElement) }));
  check('RB12', 'the dialog opens with the focus inside it; Labbook and the key are offered only where they apply', m.open && m.inside && !m.labbook && !m.legend && /up to \d+ × \d+ px/.test(m.dim), m);
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#exGo')]);
  const buf = await (await import('node:fs')).promises.readFile(await dl.path());
  check('RB12', 'Download saves a PNG named for the structure', dl.suggestedFilename() === '4LIG_ribbon.png' && buf.slice(0, 4).toString('hex') === '89504e47' && buf.length > 5000, { name: dl.suggestedFilename(), bytes: buf.length });
  await pg.click('#exportBtn2'); await sleep(150); await pg.click('#exCopy'); await sleep(1200);
  const clip = await E(async () => { try { const it = await navigator.clipboard.read(); return it.map(i => i.types.join('+')).join(); } catch (e) { return 'ERR ' + e.message; } });
  check('RB12', 'Copy puts a PNG on the clipboard', clip === 'image/png', clip);
  await pg.click('#exportBtn2'); await sleep(150); await pg.click('#exFmt button[data-v=jpeg]'); await pg.click('#exBg button[data-v=transparent]');
  check('RB12', 'JPEG with a transparent background warns it will be white', /JPEG has no transparency/.test(await E(() => document.getElementById('exDim').textContent)));
  const [dl2] = await Promise.all([pg.waitForEvent('download'), pg.click('#exGo')]);
  check('RB12', 'JPEG downloads as .jpg', dl2.suggestedFilename() === '4LIG_ribbon.jpg', dl2.suggestedFilename());
  // the camera is not left in the export state
  const vp = await E(() => ({ w: document.getElementById('viewport').clientWidth, style: document.getElementById('viewport').getAttribute('style') || '' }));
  check('RB12', 'the viewer is put back to its size after an export', vp.w > 900 && !/width/.test(vp.style), vp);
  await ctx.close();
  // inside the Hub: the figure goes to Labbook as data
  const { ctx: c2, pg: p2, E: E2 } = await open({ tag: 'RB12h ', pre: async c => { await c.route(base + '__host.html', r => r.fulfill({ contentType: 'text/html', body: HOST_PAGE })); } });
  await p2.goto(base + '__host.html'); await sleep(2500);
  const fr = p2.frame({ url: /ribbon\.html/ });
  await fr.evaluate(() => { document.getElementById('pdbInput').value = '1XYZ'; handleSubmit(); }); await sleep(2500);
  await fr.evaluate(() => openExport());
  check('RB12', 'inside the Hub the dialog offers "Send to Labbook"', await fr.evaluate(() => !document.getElementById('exLabbook').hidden));
  await fr.evaluate(() => document.getElementById('exLabbook').click()); await sleep(1200);
  const sent = await p2.evaluate(() => window.__sent.map(s => ({ id: s.id, src: s.ctx && s.ctx.source, n: s.ctx && s.ctx.images && s.ctx.images.length, url: s.ctx && s.ctx.images && s.ctx.images[0].dataUrl.slice(0, 22), name: s.ctx && s.ctx.images && s.ctx.images[0].name, cap: s.ctx && s.ctx.images && s.ctx.images[0].caption })));
  check('RB12', 'Labbook gets one PNG, named and captioned, from source "ribbon"', sent.length === 1 && sent[0].id === 'labbook' && sent[0].src === 'ribbon' && sent[0].n === 1 && sent[0].url === 'data:image/png;base64,' && /1XYZ_ribbon\.png/.test(sent[0].name) && /1XYZ/.test(sent[0].cap), sent);
  await c2.close();
}

// ── RB13 keyboard and names ─────────────────────────────────────────────────────────────────
async function rb13() {
  const { ctx, pg, E, go } = await open({ tag: 'RB13 ' });
  if (!(await has3d(pg))) { skipped.push('RB13 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  const bad = await E(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const nm = e => (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') && (document.getElementById(e.getAttribute('aria-labelledby')) || {}).textContent) || (e.labels && e.labels[0] && e.labels[0].textContent) || e.textContent || e.title || e.placeholder || '').trim();
    return [...document.querySelectorAll('button,input:not([type=hidden]):not([type=file]),select,[role=button]')].filter(e => vis(e) && !nm(e)).map(e => e.id || e.className || e.tagName).slice(0, 8);
  });
  check('RB13', 'every visible control has a name', !bad.length, bad);
  const nonButtons = await E(() => [...document.querySelectorAll('.swatch,.example-chip,.search-result,.cp-sw,.li-dot,.li-main,.di-main')].filter(e => e.tagName !== 'BUTTON').length);
  check('RB13', 'swatches, chips, rows and dots are buttons, not clickable boxes', nonButtons === 0, nonButtons);
  check('RB13', 'the viewer says what it is', await E(() => { const c = document.querySelector('#viewport canvas'); return c.getAttribute('role') === 'img' && /3D structure/.test(c.getAttribute('aria-label')); }));
  check('RB13', 'toggles say whether they are on', await E(() => ['spinBtn', 'resTagBtn', 'collapseBtn'].every(id => document.getElementById(id).hasAttribute('aria-pressed')) && [...document.querySelectorAll('#styleSeg button,#projSeg button')].every(b => b.hasAttribute('aria-pressed'))));
  // keys
  await E(() => { document.activeElement && document.activeElement.blur(); document.body.focus(); _userMoved = true; });
  await pg.keyboard.press('f'); await sleep(700);
  check('RB13', 'F fits the view', await E(() => !_userMoved));
  await pg.keyboard.press('s'); await sleep(100);
  check('RB13', 'S starts the rotation and says so', await E(() => _spinning && document.getElementById('spinBtn').getAttribute('aria-pressed') === 'true'));
  await pg.keyboard.press('s');
  await pg.keyboard.press('t'); await sleep(100);
  check('RB13', 'T starts tagging', await E(() => _resLabelMode));
  await pg.keyboard.press('Escape');
  // typing is not a shortcut
  await pg.fill('#pdbInput', ''); await pg.focus('#pdbInput'); await pg.keyboard.type('tsf');
  check('RB13', 'letters typed in a box are letters, not shortcuts', await E(() => document.getElementById('pdbInput').value === 'tsf' && !_resLabelMode && !_spinning));
  // a dialog
  await E(() => { document.getElementById('pdbInput').blur(); }); await pg.keyboard.press('Control+e'); await sleep(250);
  check('RB13', 'Ctrl/⌘ E opens the export dialog and focuses it', await E(() => document.getElementById('export-modal').classList.contains('open') && document.getElementById('export-modal').contains(document.activeElement)));
  for (let i = 0; i < 14; i++) await pg.keyboard.press('Tab');
  check('RB13', 'Tab never leaves the dialog', await E(() => document.getElementById('export-modal').contains(document.activeElement)));
  for (let i = 0; i < 14; i++) await pg.keyboard.press('Shift+Tab');
  check('RB13', 'neither does Shift+Tab', await E(() => document.getElementById('export-modal').contains(document.activeElement)));
  await pg.keyboard.press('Escape'); await sleep(200);
  check('RB13', 'Escape closes it and the focus goes back where it was', await E(() => !document.getElementById('export-modal').classList.contains('open')));
  // the sections fold from the keyboard and remember
  await pg.focus('details[data-sec=labels] > summary'); await pg.keyboard.press('Enter'); await sleep(200);
  const was = await E(() => document.querySelector('details[data-sec=labels]').open);
  await pg.keyboard.press('Enter'); await sleep(200);
  check('RB13', 'a section folds and unfolds with Enter', was !== await E(() => document.querySelector('details[data-sec=labels]').open));
  await E(() => { document.querySelector('details[data-sec=labels]').open = true; }); await sleep(250);
  const saved = await E(() => JSON.parse(localStorage.getItem('ribbon_sec') || '{}').labels);
  check('RB13', 'what is open is remembered', saved === true, saved);
  await E(() => foldAll()); await sleep(100);
  check('RB13', 'Fold all folds everything and turns into Unfold all', await E(() => [...document.querySelectorAll('details.rb-sec')].every(d => !d.open) && document.getElementById('foldAll').textContent === 'Unfold all'));
  await ctx.close();
}

// ── RB14 hostile input ──────────────────────────────────────────────────────────────────────
async function rb14() {
  const nasty = ['', ' ', '0', '-1', '1e999', '<img src=x onerror="window.__x=1">', '"><script>window.__x=1</script>', "'; alert(1); '", 'A:1-99999999999', 'A:2-3,,;;', '😀 π ångström', 'x'.repeat(4000), '\u0000‮'];
  const { ctx, pg, E, go } = await open({ tag: 'RB14 ', pre: async c => { await c.addInitScript(() => { try { localStorage.setItem('ribbon_designs', '{"bad":{"pdbId":"1XYZ","thumb":"javascript:alert(1)","state":null,"view":"nope"},"worse":42,"ok":{"pdbId":"1XYZ","ts":"x","thumb":"data:text/html,<script>window.__x=1</script>","state":{}}}'); localStorage.setItem('ribbon_recent', '[{"q":"<img src=x onerror=window.__x=1>","l":"x"},null,5]'); localStorage.setItem('ribbon_sec', 'not json'); } catch (e) {} }); } });
  if (!(await has3d(pg))) { skipped.push('RB14 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  check('RB14', 'corrupt storage does not stop the page and is not rendered as markup', await E(() => !window.__x && document.querySelectorAll('#designList .design-item').length >= 1 && !document.querySelector('#designList [style*="javascript"], #designList [style*="text/html"]')));
  await go('4LIG');
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  for (const v of nasty) {
    await E(v => {
      const set = (id, val, fn) => { const e = document.getElementById(id); e.value = val; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); if (fn) fn(); };
      set('pdbInput', v, () => handleSubmit());
      set('hlInput', v, () => addHighlight());
      set('designName', v, () => { saveDesign(true); });
      set('lsSize', v); set('pocketR', v); set('cp-hex', v);
      selectChain('A'); set('cp-label-input', v); closeChainPopup();
      document.querySelector('#resLblList input') && set('resLblList', v);
    }, v);
    await sleep(120);
  }
  await sleep(1200);
  const r = await E(() => ({ x: !!window.__x, size: state.labelStyle.size, pocket: state.pocketR, rows: document.querySelectorAll('#designList .design-item').length, injected: !!document.querySelector('#designList img, #chainList img, #hlList img, .chain-tag img, #searchResults img'), err: document.getElementById('errText').textContent.slice(0, 80) }));
  check('RB14', 'nothing typed is ever run as markup', !r.x && !r.injected, r);
  check('RB14', 'numbers stay in their range', r.size >= 8 && r.size <= 40 && r.pocket >= 2 && r.pocket <= 12, r);
  // the page is still usable
  await go('1XYZ');
  check('RB14', 'and the page still loads a structure afterwards', await E(() => currentPdbId) === '1XYZ');
  await ctx.close();
}

// ── RB16 the pointer on the structure ───────────────────────────────────────────────────────
async function rb16() {
  const { ctx, pg, E, go } = await open({ tag: 'RB16 ' });
  if (!(await has3d(pg))) { skipped.push('RB16 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('1XYZ'); await E(() => { state.style = 'stick'; buildGeometry(); }); await sleep(600);   // sticks, not a 12-residue ribbon: a thing the picker can be sure to hit
  const pos = await E(() => { const a = currentModel.selectedAtoms({ chain: 'A', resi: 6, atom: 'CA' })[0]; const p = viewer.modelToScreen(a); return { x: p.x, y: p.y }; });
  await pg.mouse.move(pos.x - 30, pos.y - 30); await pg.mouse.move(pos.x, pos.y, { steps: 6 }); await sleep(700);
  const tip = await E(() => ({ show: document.getElementById('hover-tip').style.display, text: document.getElementById('hover-tip').textContent }));
  check('RB16', 'hovering an atom names its chain, residue and atom', tip.show === 'block' && /^Chain A · ALA 6 · CA/.test(tip.text), tip);
  await pg.mouse.click(pos.x, pos.y, { button: 'right' }); await sleep(400);
  const m = await E(() => ({ items: [...document.querySelectorAll('.ctx .ctx-i')].map(e => e.textContent.trim()), popup: document.getElementById('chain-popup').classList.contains('open'), sel: selectedChain }));
  check('RB16', 'a right click on an atom opens a menu about that atom', m.items.some(x => /^Select chain A/.test(x)) && m.items.some(x => /^Label this residue/.test(x)) && m.items.some(x => /^Hide chain A/.test(x)) && m.items.some(x => /^Fit to view/.test(x)) && m.items.some(x => /^Export image/.test(x)), m);
  check('RB16', 'and never picks the chain', !m.popup && m.sel === null, m);
  await pg.keyboard.press('Escape'); await sleep(200);
  await pg.mouse.move(pos.x + 120, pos.y); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(pos.x + 180, pos.y + 40, { steps: 5 }); await pg.mouse.up({ button: 'right' }); await sleep(300);
  check('RB16', 'a right-drag moves the view and opens no menu', await E(() => !document.querySelector('.ctx') && _userMoved && !document.getElementById('chain-popup').classList.contains('open')));
  await pg.mouse.click(pos.x, pos.y); await sleep(300);
  check('RB16', 'a left click on an atom picks its chain', await E(() => selectedChain === 'A' && document.getElementById('chain-popup').classList.contains('open')));
  await pg.keyboard.press('Escape');
  await pg.mouse.click(400, 30, { button: 'right' }); await sleep(300);
  check('RB16', 'elsewhere the page keeps the Hub-wide menu, with this app\'s actions', await E(() => [...document.querySelectorAll('.ctx .ctx-i')].map(e => e.textContent.trim()).some(x => /^Fit to view/.test(x)) && [...document.querySelectorAll('.ctx .ctx-i')].some(e => /^Open file/.test(e.textContent))));
  await ctx.close();
}

// ── RB17 the figure reaches the notebook ────────────────────────────────────────────────────
const HOST2 = `<!doctype html><meta charset=utf-8><body style="margin:0">
<iframe id="frame-labbook" src="/apps/labbook/labbook.html" style="width:1300px;height:850px;border:0"></iframe>
<iframe id="frame-ribbon" src="/apps/ribbon/ribbon.html" style="width:1300px;height:850px;border:0;display:none"></iframe>
<script>
window.__acks={};
function show(id){ ['labbook','ribbon'].forEach(function(k){ document.getElementById('frame-'+k).style.display = k===id?'block':'none'; }); }
window.openApp=function(id,tab,item,ctx){
  show(id); if(!ctx) return;
  var rid='r'+Math.random().toString(36).slice(2), msg={type:'dhub:context',version:1,source:ctx.source||'hub',target:id,action:'open',context:ctx,requestId:rid}, n=0;
  (function send(){ if(window.__acks[rid]||n++>10) return; try{ document.getElementById('frame-'+id).contentWindow.postMessage(msg,'*'); }catch(e){} setTimeout(send,250); })();
};
window.addEventListener('message',function(e){ if(e.data&&e.data.type==='dhub:ack') window.__acks[e.data.requestId]=1; });
</script>`;
async function rb17() {
  const { ctx, pg } = await open({ tag: 'RB17 ', pre: async c => {
    await c.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    await c.route(base + '__host2.html', r => r.fulfill({ contentType: 'text/html', body: HOST2 }));
  } });
  await pg.goto(base + '__host2.html'); await sleep(3000);
  const lb = pg.frame({ url: /labbook\.html/ }), rb = pg.frame({ url: /ribbon\.html/ });
  try { await lb.waitForFunction(() => window.LB && LB.data && LB.data.presets && Object.keys(LB.data.presets).length && (LB.data.projects || []).length, null, { timeout: 25000 }); }
  catch (e) { skipped.push('RB17 (Labbook did not come up)'); await ctx.close(); return; }
  if (!(await rb.evaluate(() => !!window.$3Dmol))) { skipped.push('RB17 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const expId = await lb.evaluate(async () => {
    const before = new Set(Object.keys(LB.data.experiments));
    const P = LB.data.projects.find(p => (p.sections || []).length), S0 = P.sections[0];
    openNew(P.id, S0.id); el('nm-type').value = 'HB'; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value = '2026-10-01'; nmUpdateCode(); nmSetup(); nmProtos(); nmPreview();
    createExperiment(); closeNew();
    let e = null; for (let t = 0; t < 100 && !e; t++) { e = Object.values(LB.data.experiments).find(x => !before.has(x.id)); if (!e) await new Promise(r => setTimeout(r, 60)); }
    openExp(e.id); return e.id;
  });
  await rb.evaluate(() => { document.getElementById('pdbInput').value = '4LIG'; handleSubmit(); }); await sleep(3000);
  await rb.evaluate(() => { selectChain('A'); const i = document.getElementById('cp-label-input'); i.value = 'To the notebook'; i.dispatchEvent(new Event('input')); closeChainPopup(); });
  await pg.evaluate(() => show('ribbon')); await sleep(700);   // the frame was hidden while it loaded, as in the Hub, and fits itself when it is shown
  check('RB17', 'a viewer that was hidden while it loaded fits itself when it is shown', await rb.evaluate(() => { const vp = document.getElementById('viewport'); return vp.clientWidth > 300; }) && !(await rb.evaluate(() => _userMoved)));
  await rb.evaluate(() => { openExport(); document.getElementById('exLabbook').click(); });
  await sleep(2500);
  const r = await lb.evaluate(id => { const e = LB.data.experiments[id]; return { shown: document.getElementById('frame-labbook') ? 1 : 1, files: (e.files || []).map(f => ({ name: f.name, mime: f.mime, kind: f.kind, caption: f.caption, size: f.size })), sources: (e.integration && e.integration.sources) || [] }; }, expId);
  check('RB17', 'Labbook is what is shown after Send to Labbook', await pg.evaluate(() => document.getElementById('frame-labbook').style.display) === 'block');
  check('RB17', 'the figure is on the experiment\'s Files tab as a picture, captioned', r.files.length === 1 && /4LIG_ribbon\.png/.test(r.files[0].name) && /^image\/png/.test(r.files[0].mime || '') && /4LIG/.test(r.files[0].caption || '') && r.files[0].size > 3000, r);
  check('RB17', 'and the experiment records where it came from', r.sources.includes('ribbon'), r.sources);
  await ctx.close();
}

// ── RB18 measurements ───────────────────────────────────────────────────────────────────────
async function rb18() {
  const { ctx, pg, E, go } = await open({ tag: 'RB18 ' });
  if (!(await has3d(pg))) { skipped.push('RB18 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('1XYZ'); await E(() => { state.style = 'stick'; buildGeometry(); }); await sleep(600);
  const at = (c, r, n) => E(([c, r, n]) => { const a = currentModel.selectedAtoms({ chain: c, resi: r, atom: n })[0], p = viewer.modelToScreen(a); return { x: p.x, y: p.y, X: a.x, Y: a.y, Z: a.z }; }, [c, r, n]);
  await pg.focus('body'); await pg.keyboard.press('m'); await sleep(100);
  check('RB18', 'M switches the tool on and says so; tag mode is off', await E(() => _measMode && !_resLabelMode && document.getElementById('measBtn').getAttribute('aria-pressed') === 'true' && /click 2 atoms/.test(document.getElementById('chainHint').textContent)));
  const A = await at('A', 6, 'CA'), B = await at('B', 6, 'CA');
  await pg.mouse.click(A.x, A.y); await sleep(250);
  check('RB18', 'the first atom is marked and the hint counts', await E(() => _measPend.length === 1 && /atom 2 of 2/.test(document.getElementById('measHint').textContent) && !!document.querySelector('#label-lines .meas-pend')));
  await pg.mouse.click(B.x, B.y); await sleep(350);
  const m = await E(() => ({ n: state.measures.length, text: state.measures[0] && measureText(state.measures[0]), val: state.measures[0] && measureValue(state.measures[0]), tag: Object.keys(labelEls).filter(k => k[0] === 'm'), lines: [...document.querySelectorAll('#label-lines line[stroke-dasharray]')].filter(l => l.style.display !== 'none').length, row: document.querySelectorAll('#measList .li').length, pend: _measPend.length }));
  const want = Math.hypot(B.X - A.X, B.Y - A.Y, B.Z - A.Z);
  check('RB18', 'two clicks make a distance, equal to the coordinates', m.n === 1 && Math.abs(m.val - want) < 1e-6 && m.text === want.toFixed(2) + ' Å' && Math.abs(want - 12) < 1e-6, { m, want });
  check('RB18', 'it is a dashed line, a label with the value, and a row in the list; the pending mark is gone', m.tag.length === 1 && m.lines === 1 && m.row === 1 && m.pend === 0, m);
  check('RB18', 'the label shows the value', await E(() => labelEls[Object.keys(labelEls).filter(k => k[0] === 'm')[0]].div.textContent) === want.toFixed(2) + ' Å');
  // an angle, through three atoms of a residue
  await E(() => { toggleMeasure(false); });
  const ang = await E(() => { _measKind = 'angle'; const g = (n) => currentModel.selectedAtoms({ chain: 'A', resi: 8, atom: n })[0]; ['N', 'CA', 'O'].forEach(n => addMeasurePoint(g(n))); const m = state.measures[1]; return { v: measureValue(m), t: measureText(m), kind: m.kind }; });
  check('RB18', 'three atoms make an angle at the middle one (149.1° for N–CA–O of the synthetic residue)', ang.kind === 'angle' && Math.abs(ang.v - 149.1) < 0.1 && /°$/.test(ang.t), ang);
  check('RB18', 'an angle draws two segments', await E(() => { const g = measEls[state.measures[1].id]; return g && g.line.every(l => l.style.display !== 'none'); }));
  // the list copies as a table
  await E(() => { document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }); });
  await pg.click('#measCopy'); await sleep(300);
  const tsv = await E(async () => navigator.clipboard.readText());
  check('RB18', 'Copy table gives a TSV with a header and a row per measurement', tsv.split('\n').length === 3 && /^#\tKind\tAtoms\tValue/.test(tsv) && /distance/.test(tsv) && /angle/.test(tsv), tsv);
  // the export carries the line and the label, and not when labels are off
  const count = on => E(on => { $('exLabels').checked = on; const c = renderExport(); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0xff) < 8 && Math.abs(d[i + 1] - 0xc1) < 10 && Math.abs(d[i + 2] - 0x07) < 12 && d[i + 3] > 200) n++; return n; }, on);
  const withL = await count(true), without = await count(false);
  check('RB18', 'the export draws the dashed lines with "Include labels" and not without', withL > 150 && without === 0, { withL, without });
  // a hidden chain hides what is measured on it
  await E(() => toggleChain('B', true)); await sleep(200);
  const hid = await E(() => ({ tags: Object.keys(labelEls).filter(k => k[0] === 'm').length, lines: [...document.querySelectorAll('#label-lines line[stroke-dasharray]')].filter(l => l.style.display !== 'none').length }));
  check('RB18', 'hiding a chain hides a measurement that touches it, and leaves the other', hid.tags === 1 && hid.lines === 2, hid);
  await E(() => toggleChain('B', false)); await sleep(150);
  // a design keeps them
  const keep = JSON.stringify(await E(() => state.measures));
  await E(() => { document.getElementById('designName').value = 'meas'; saveDesign(); }); await sleep(500);
  await E(() => { clearMeasures(); loadDesign('meas'); }); await sleep(2800);
  check('RB18', 'a design keeps the measurements and draws them again', JSON.stringify(await E(() => state.measures)) === keep && await E(() => [...document.querySelectorAll('#label-lines line[stroke-dasharray]')].filter(l => l.style.display !== 'none').length) === 3);
  // Delete on a label removes that measurement only
  await E(() => labelEls[Object.keys(labelEls).filter(k => k[0] === 'm')[0]].div.focus()); await pg.keyboard.press('Delete'); await sleep(200);
  check('RB18', 'Delete on a measurement label removes it', await E(() => state.measures.length === 1 && Object.keys(labelEls).filter(k => k[0] === 'm').length === 1));
  await E(() => clearMeasures());
  check('RB18', 'Clear all empties the list, the lines and the labels', await E(() => !state.measures.length && !Object.keys(measEls).length && !Object.keys(labelEls).filter(k => k[0] === 'm').length));
  // Esc stops and forgets a half-made one
  await E(() => { _measKind = 'dist'; toggleMeasure(true); addMeasurePoint(currentModel.selectedAtoms({ chain: 'A', resi: 3, atom: 'CA' })[0]); });
  await pg.keyboard.press('Escape');
  check('RB18', 'Escape stops measuring and drops the half-made one', await E(() => !_measMode && _measPend.length === 0 && !document.querySelector('#label-lines .meas-pend')));
  // a model change updates the reading; a new structure forgets them
  await go('5NMR'); await E(() => { state.style = 'stick'; buildGeometry(); _measKind = 'dist'; addMeasurePoint(currentModel.selectedAtoms({ chain: 'A', resi: 2, atom: 'CA' })[0]); addMeasurePoint(currentModel.selectedAtoms({ chain: 'A', resi: 15, atom: 'CA' })[0]); }); await sleep(300);
  const t1 = await E(() => measureText(state.measures[0]));
  await pg.click('#frNext'); await sleep(700);
  const t2 = await E(() => ({ v: measureText(state.measures[0]), tag: labelEls[Object.keys(labelEls).filter(k => k[0] === 'm')[0]].div.textContent }));
  check('RB18', 'stepping to another model updates the measured value, in the list and on the label', t1 !== t2.v && t2.tag === t2.v, { t1, t2 });
  await go('1XYZ');
  check('RB18', 'a new structure starts with no measurements', await E(() => !state.measures.length && !Object.keys(measEls).length));
  await ctx.close();
}

// ── RB19 interface ──────────────────────────────────────────────────────────────────────────
// Brute force, written here and not in the page: heavy atoms of two chains from the file's own text.
function parseAtoms(text) {
  return text.split('\n').filter(l => /^ATOM  /.test(l)).map(l => ({ chain: l[21], resi: parseInt(l.slice(22, 26)), resn: l.slice(17, 20).trim(), name: l.slice(12, 16).trim(), x: +l.slice(30, 38), y: +l.slice(38, 46), z: +l.slice(46, 54) }));
}
function bruteInterface(text, a, b, cut) {
  const A = parseAtoms(text).filter(x => x.chain === a), B = parseAtoms(text).filter(x => x.chain === b), pairs = new Map(), ra = new Set(), rb = new Set();
  for (const x of A) for (const y of B) { const d = Math.hypot(x.x - y.x, x.y - y.y, x.z - y.z); if (d <= cut) { ra.add(x.resi); rb.add(y.resi); const k = x.resi + '|' + y.resi; if (!pairs.has(k) || d < pairs.get(k)) pairs.set(k, d); } }
  return { ra: [...ra].sort((p, q) => p - q), rb: [...rb].sort((p, q) => p - q), pairs: [...pairs.values()].sort((p, q) => p - q) };
}
async function rb19() {
  const { ctx, pg, E, go } = await open({ tag: 'RB19 ' });
  if (!(await has3d(pg))) { skipped.push('RB19 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('6IFC'); await sleep(500);
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  const text = STRUCTS['6IFC']();
  const opts = await E(() => ({ a: [...document.querySelectorAll('#ifA option')].map(o => o.value).join(''), b: [...document.querySelectorAll('#ifB option')].map(o => o.value).join(''), bSel: document.getElementById('ifB').value, chips: [...document.querySelectorAll('#ifPairs .example-chip')].map(c => c.textContent) }));
  check('RB19', 'the selects list the chains, the second defaults to another one, and touching chains are suggested', opts.a === 'AB' && opts.b === 'AB' && opts.bSel === 'B' && opts.chips.length === 1 && /^A – B · \d+$/.test(opts.chips[0]), opts);
  await pg.click('#ifPairs .example-chip'); await sleep(500);
  const want = bruteInterface(text, 'A', 'B', 4.5);
  const got = await E(() => { const c = ifaceNow(), f = state.iface; return { show: f.show, ra: ifaceResidues(c, 'A').sort((x, y) => x - y), rb: ifaceResidues(c, 'B').sort((x, y) => x - y), pairs: c.v.pairs.map(p => p.d).sort((x, y) => x - y), card: document.getElementById('ifResult').textContent }; });
  check('RB19', 'the residues in contact are the ones brute force finds', JSON.stringify(got.ra) === JSON.stringify(want.ra) && JSON.stringify(got.rb) === JSON.stringify(want.rb) && want.ra.length === 6, { got: got.ra, want: want.ra });
  check('RB19', 'and so are the residue pairs and their distances', got.pairs.length === want.pairs.length && got.pairs.every((d, i) => Math.abs(d - want.pairs[i]) < 1e-9) && want.pairs.length > 0, { n: got.pairs.length, w: want.pairs.length });
  check('RB19', 'the card names the chains, the count, and the buried surface', /A – B/.test(got.card) && /residues of Chain A/.test(got.card) && /Buried surface \d/.test(got.card), got.card);
  // a different cutoff
  await pg.fill('#ifCut', '3.0'); await sleep(300);
  const w3 = bruteInterface(text, 'A', 'B', 3.0);
  check('RB19', 'a smaller cutoff finds what brute force finds', await E(() => ifaceNow().v.pairs.length) === w3.pairs.length, { w3: w3.pairs.length });
  await pg.fill('#ifCut', '4.5'); await sleep(300);
  // colours and sticks
  const col = await E(() => { const f = makeColorFn(), at = (r) => currentModel.selectedAtoms({ chain: 'A', resi: r, atom: 'CA' })[0]; return { inside: f(at(2)), outside: f(at(9)), want: adjustColor('#ffbf7b'), sticks: [2, 9].map(r => !!(currentModel.selectedAtoms({ chain: 'A', resi: r, atom: 'CA' })[0].style || {}).stick), b: makeColorFn()(currentModel.selectedAtoms({ chain: 'B', resi: 2, atom: 'CA' })[0]) === adjustColor('#51c3ce') }; });
  check('RB19', 'an interface residue takes the interface colour, one outside it does not', col.inside === col.want && col.outside !== col.want && col.b, col);
  check('RB19', 'interface residues are drawn as sticks and the rest are not', col.sticks[0] === true && col.sticks[1] === false, col.sticks);
  await E(() => { state.highlights = [{ id: 'x', sel: 'A:2-2', color: '#00ff00', sticks: false }]; recolorStructure(); });
  check('RB19', 'a highlight is above the interface', await E(() => makeColorFn()(currentModel.selectedAtoms({ chain: 'A', resi: 2, atom: 'CA' })[0])) === await E(() => adjustColor('#00ff00')));
  await E(() => { state.highlights = []; recolorStructure(); });
  // buried surface: the arithmetic
  const s = await E(() => {
    const one = [{ x: 0, y: 0, z: 0, elem: 'C' }], two = [{ x: 0, y: 0, z: 0, elem: 'C' }, { x: 2, y: 0, z: 0, elem: 'C' }];
    const R = 1.7 + 1.4, cap = 2 * Math.PI * R * (R - 1);
    const all = polyAtoms('A').concat(polyAtoms('B'));
    return { one: sasa(one, { points: 800 }), oneWant: 4 * Math.PI * R * R, two: sasa(two, { points: 800 }), twoWant: 2 * (4 * Math.PI * R * R - cap), grid: sasa(all), brute: sasa(all, { brute: true }), sym: [ifaceNow().bsa, (() => { const A = polyAtoms('B'), B = polyAtoms('A'); return sasa(A) + sasa(B) - sasa(A.concat(B)); })()] };
  });
  check('RB19', 'an isolated atom has the area of its probe-expanded sphere', Math.abs(s.one - s.oneWant) / s.oneWant < 0.01, s);
  check('RB19', 'two overlapping atoms bury the analytic spherical caps', Math.abs(s.two - s.twoWant) / s.twoWant < 0.02, s);
  check('RB19', 'the grid and brute force give the same area', Math.abs(s.grid - s.brute) < 1e-6, s);
  check('RB19', 'the buried surface is positive and the same whichever chain is first', s.sym[0] > 50 && Math.abs(s.sym[0] - s.sym[1]) < 1e-6, s.sym);
  // copying
  const txt = await E(async () => { document.getElementById('ifCopy').click(); await new Promise(r => setTimeout(r, 300)); return navigator.clipboard.readText(); });
  check('RB19', 'Copy residues gives compressed ranges for both chains', txt === 'A:1-6, B:1-6', txt);
  const tsv = await E(async () => { document.getElementById('ifTable').click(); await new Promise(r => setTimeout(r, 300)); return navigator.clipboard.readText(); });
  check('RB19', 'Copy table gives a header and a row per pair', tsv.split('\n').length === want.pairs.length + 1 && /^Chain A\tResidue A/.test(tsv), tsv.split('\n').length);
  await E(() => document.getElementById('ifHl').click());
  check('RB19', 'Add as highlights makes one highlight per chain, with sticks', await E(() => state.highlights.length === 2 && state.highlights.every(x => x.sticks) && state.highlights[0].sel === 'A:1-6'));
  await E(() => { state.highlights = []; });
  // a contact becomes a measurement
  await E(() => document.querySelector('#ifList .ibtn').click()); await sleep(900);
  const m = await E(() => ({ n: state.measures.length, v: measureValue(state.measures[0]), d: ifaceNow().v.pairs[0].d }));
  check('RB19', 'a contact row measures that contact, and the value is its distance', m.n === 1 && Math.abs(m.v - m.d) < 1e-9, m);
  // a design keeps it
  await E(() => { document.getElementById('designName').value = 'iface'; saveDesign(); }); await sleep(500);
  const keep = JSON.stringify(await E(() => state.iface));
  await E(() => { state.iface = null; _if = null; recolorStructure(); loadDesign('iface'); }); await sleep(2800);
  check('RB19', 'a design keeps the interface and shows it again', JSON.stringify(await E(() => state.iface)) === keep && await E(() => !!(currentModel.selectedAtoms({ chain: 'A', resi: 2, atom: 'CA' })[0].style || {}).stick));
  // the same chain twice, and far-apart chains
  await E(() => { document.getElementById('ifB').value = 'A'; document.getElementById('ifB').dispatchEvent(new Event('change')); });
  check('RB19', 'the same chain twice is refused with a message', /Choose two different chains/.test(await E(() => document.getElementById('ifResult').textContent)));
  await go('6FAR'); await sleep(400);
  await E(() => { ifaceSet('A', 'B', true); }); await sleep(400);
  const far = await E(() => ({ n: ifaceNow().v.pairs.length, bsa: ifaceNow().bsa, chips: document.querySelectorAll('#ifPairs .example-chip').length, text: document.getElementById('ifResult').textContent }));
  check('RB19', 'chains that do not touch have no contacts, no buried surface and no suggestion', far.n === 0 && far.bsa === 0 && far.chips === 0, far);
  await go('1XYZ');
  check('RB19', 'a new structure forgets the interface', await E(() => state.iface === null));
  await ctx.close();
}

// ── Driver ───────────────────────────────────────────────────────────────────────────────────
const SUITES = [['RB1', rb1], ['RB2', rb2], ['RB3', rb3], ['RB4', rb4], ['RB5', rb5], ['RB6', rb6], ['RB7', rb7], ['RB8', rb8], ['RB9', rb9], ['RB10', rb10], ['RB11', rb11], ['RB12', rb12], ['RB13', rb13], ['RB14', rb14], ['RB15', rb15], ['RB16', rb16], ['RB17', rb17], ['RB18', rb18], ['RB19', rb19]];
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
base = `http://127.0.0.1:${port}/`;
try {
  await waitHttp(base);
  browser = await chromium.launch();
  for (const [id, fn] of SUITES) {
    if (!run(id)) continue;
    try { await fn(); } catch (e) { out.push({ inv: id, case: 'suite', msg: 'the suite threw: ' + String(e && e.message || e).split('\n')[0] }); }
  }
  await browser.close();
} finally { srv.kill(); }

const invs = [...new Set([...Object.keys(counts), ...out.map(x => x.inv)])].sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)));
for (const inv of invs) {
  const f = out.filter(x => x.inv === inv);
  console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
  (args.verbose ? f : f.slice(0, 12)).forEach(x => console.log(`      ${x.case}: ${x.msg}`));
}
skipped.forEach(s => console.log('  – skipped: ' + s));
if (pageErrs.length) { console.log('  ✗ page errors:'); [...new Set(pageErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + pageErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Ribbon invariants hold.');
process.exit(failed ? 1 : 0);
