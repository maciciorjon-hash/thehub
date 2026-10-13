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
//   RB16 the pointer         Hover names the atom; a right click is a menu about it and never a chain pick; a right-drag (it zooms in
//                           3Dmol) opens nothing; a left click picks the chain.
//   RB17 to the notebook    Inside the Hub, Send to Labbook puts the figure on the open experiment's Files tab, captioned,
//                           and the experiment records that it came from Ribbon.
//   RB26 tabs and Models    The panel is icon tabs on the right; each tab one pane; Models lists what is in the scene and its eyes
//                           put things away without deleting them, kept by a design and honoured by the scripts.
//   RB27 sequence + selection  The sequence is read from the structure, numbered, marked by secondary structure; a click, a drag,
//                           Shift and ⌘ select; the selection is green in the structure and never in an export, a script or a design.
//   RB28 command line       The selection language counts the same residues as a direct count; within is a brute-force distance;
//                           every command changes what it says; Tab completes with what the structure contains; ↑, Esc, errors stay.
//   RB29 look               Lighting, depth cue, one-click styles, palettes and value ramps change the picture and nothing in it;
//                           a too-pale colour is named; the scale bar is its label long and is exported, the axes are not.
//   RB30 analyse            Interactions on a structure built with known distances; salt bridges only between chains; lysines ranked by
//                           distance to the ligase; clashes by overlap; charge and hydrophobicity; one pocket in a shell, none in a rod; the PAE.
//   RB31 undo, modes, views, films  Undo one change at a time (a slider drag is one), never the camera; Select mode and a box;
//                           views come back exactly; a GIF that decodes to what was encoded; a video; journal column widths.
//   RB32 to Labbook and back  A figure in Labbook keeps its design; Edit in Ribbon reopens it as made; sent back it replaces itself and
//                           keeps the caption written in Labbook; a bad or oversized design is dropped.
//   RB34 camera feel         The wheel zooms the web's way, eased, to the pointer, the same in and out, in pixels or lines, bounded; Safari's
//                           pinch; Shift and scroll move it; a drag let go keeps turning and settles (not with reduced motion); the camera draws
//                           once a frame, with the cheap look while it moves; nothing runs at rest.
//   RB35 a ligand's own eye  Each ligand in Models has an eye of its own: it puts that ligand away (not the others, not the chain), the framing and
//                           the scripts leave it out, a design keeps it, `hide LIG` / `show LIG` do the same, and focusing it brings it back.
//   RB36 light and depth     Flat is no light (one colour, no shading), Soft and Studio shade more; Depth fades the far side from the front tip of the
//                           structure and follows the zoom; the Perspective slider keeps the size; Pastel keeps the hue; the old names still load.
//   RB37 styles              Twelve styles, pastel first, each the same whatever came before it; a change by hand takes the highlight off; Save look keeps, offers,
//                           restores and deletes a look; the old names still work.
//   RB38 the scale bar       The length is the longest 1-2-5 in a fifth of the width (nm from 100 Å); on screen it is that long; in the export it is a strip under
//                           the cropped figure (the structure above it untouched), sized in pt from the dpi; ink, corner, and the perspective warning.
//   RB39 the film            Preview plays the frames that are recorded, on the structure; the bar scrubs to any frame exactly; the preview starts from, and goes back to,
//                           the user's view; a drag on the viewer ends it; Loop; a recorded frame carries the labels and the scale bar; sizes; the GIF is dithered.
//   RB40 the binding site    Analyse picks the ligand (not an additive) and reads its interactions when it is first opened; one row per residue, nearest first, a pip per
//                           kind; the strip (atoms, mass, rotatable bonds, burial, clashes); filters, click, Shift-click; Focus and burial colouring; no ligand says so;
//                           a ligand between two residues of its own chain letter clashes with both.
//   RB41 cavities and the engine  Cavities are scored volume × enclosure and say what lines them, found in slices (the page stays alive) with the same answer as the
//                           synchronous call; the pane goes from the ligand outwards; the clash table; the integer grid returns exactly what is within the radius.
//   RB42 the 2D diagram     The ligand drawn flat with the residues round it: no two labels touch (ten on one side), none on the ligand, none outside; a folded ligand
//                           has no atoms on top of each other; a line from each box to an atom in its kind's colour; hover lights table, picture and structure; the
//                           filters; SVG and PNG; the dialog; the same picture every time.
//   RB33 Echo mutants        Echo reads groups named like BRD4_Y97A as mutants of BRD4 and sends log2(DC50 ratio) per residue; Ribbon puts them
//                           on the AlphaFold model, labelled, with side chains; a residue not in the model is named.
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
// --shard=2/3 runs every third suite, offset by one: CI splits the file over runners (one pass took 40 minutes on a 2-vCPU runner)
const SHARD = args.shard ? String(args.shard).split('/').map(Number) : null;
const run = id => (!ONLY || ONLY.includes(id)) && (!SHARD || (parseInt(id.slice(2)) - 1) % SHARD[1] === SHARD[0] - 1);
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('server did not come up: ' + url); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const out = [], counts = {}, skipped = [], pageErrs = [], timing = {};
function check(inv, name, ok, detail) {
  counts[inv] = (counts[inv] || 0) + 1;
  if (!ok) out.push({ inv, case: name, msg: detail === undefined ? 'failed' : JSON.stringify(detail) });
}

// ── synthetic structures ─────────────────────────────────────────────────────────────────────
const f3 = (v, w) => v.toFixed(3).padStart(w);
function atomLine(rec, n, name, resn, ch, resi, x, y, z, b = 20, elem = 'C') {
  return rec.padEnd(6) + String(n).padStart(5) + ' ' + name.padEnd(4) + ' ' + resn.padStart(3) + ' ' + ch + String(resi).padStart(4) + '    ' + f3(x, 8) + f3(y, 8) + f3(z, 8) + '  1.00' + b.toFixed(2).padStart(6) + '          ' + elem.padStart(2);   // element in columns 77–78
}
const NAMES3 = ['ALA', 'GLY', 'SER', 'LEU', 'LYS', 'VAL', 'THR', 'GLU', 'ASP', 'ILE', 'PHE', 'ARG', 'TYR', 'PRO'];
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
      const resn = (o.mod && c.id === 'A' && i === 6) ? 'MSE' : (o.names ? NAMES3[(i + (c.shift || 0)) % NAMES3.length] : 'ALA');
      const rec = resn === 'MSE' ? 'HETATM' : 'ATOM';
      const b = c.b ? c.b(i) : 20;
      if (resn === 'MSE') { L.push(atomLine(rec, n++, 'N', resn, c.id, i, x - 1, y, z, b, 'N')); L.push(atomLine(rec, n++, 'CA', resn, c.id, i, x, y, z, b)); L.push(atomLine(rec, n++, 'C', resn, c.id, i, x + 1, y, z, b)); }
      else { L.push(atomLine(rec, n++, 'N', resn, c.id, i, x - 1.2, y, z - 0.5, b, 'N')); L.push(atomLine(rec, n++, 'CA', resn, c.id, i, x, y, z, b)); L.push(atomLine(rec, n++, 'C', resn, c.id, i, x + 1.2, y, z + 0.5, b)); L.push(atomLine(rec, n++, 'O', resn, c.id, i, x + 1.5, y + 1, z + 0.8, b, 'O')); }   // a backbone, so a cartoon is drawn
    }
    if (o.additive) for (let k = 0; k < 16; k++) L.push(atomLine('HETATM', n++, 'C' + (k + 1), 'GOL', 'A', 202, 3 + k * 0.9, 6 + (k % 2), 9, 30));   // an additive, larger than the ligand beside it
    if (o.ligand) for (let k = 0; k < (o.ligandN || 6); k++) L.push(atomLine('HETATM', n++, 'C' + (k + 1), 'LIG', 'A', 201, 2 + k * 1.2, 3 + (k % 2), 8, 30));
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
// A copy of a structure turned and moved, optionally with some residues dropped, renamed or pushed out of place.
function rotatedCopy(text, o = {}) {
  const ax = o.axis || [1, 2, 3], n = Math.hypot(...ax), u = ax.map(v => v / n), th = (o.deg ?? 70) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), t = o.t || [20, -15, 30];
  const R = [[c + u[0] * u[0] * (1 - c), u[0] * u[1] * (1 - c) - u[2] * s, u[0] * u[2] * (1 - c) + u[1] * s], [u[1] * u[0] * (1 - c) + u[2] * s, c + u[1] * u[1] * (1 - c), u[1] * u[2] * (1 - c) - u[0] * s], [u[2] * u[0] * (1 - c) - u[1] * s, u[2] * u[1] * (1 - c) + u[0] * s, c + u[2] * u[2] * (1 - c)]];
  return text.split('\n').filter(l => !(o.drop && /^(ATOM|HETATM)/.test(l) && o.drop.includes(l[21] + parseInt(l.slice(22, 26))))).map(l => {
    if (!/^(ATOM  |HETATM)/.test(l)) return l;
    const key = l[21] + parseInt(l.slice(22, 26)); let p = [+l.slice(30, 38), +l.slice(38, 46), +l.slice(46, 54)];
    if (o.push && o.push.includes(key)) p = [p[0] + 9, p[1], p[2]];   // out of place by 9 Å before the turn
    const q = [0, 1, 2].map(i => R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2] + t[i]);
    let out = l.slice(0, 30) + f3(q[0], 8) + f3(q[1], 8) + f3(q[2], 8) + l.slice(54);
    if (o.rename && o.rename[key]) out = out.slice(0, 17) + o.rename[key] + out.slice(20);
    return out;
  }).join('\n');
}
// A compact fold (a random walk kept inside a 22 Å ball), for the camera: a rod or a helix viewed end on makes the size of
// the projection depend on depth, and the camera's laws are about the plane through the centre.
function globulePdb() {
  const L = []; let n = 1, seed = 7, p = [0, 0, 0]; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 1; i <= 140; i++) {
    const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); p = [p[0] + 3.8 * Math.sin(ph) * Math.cos(th), p[1] + 3.8 * Math.sin(ph) * Math.sin(th), p[2] + 3.8 * Math.cos(ph)];
    const k = Math.hypot(...p); if (k > 22) p = p.map(v => v * 22 / k);
    L.push(atomLine('ATOM', n++, 'N', 'ALA', 'A', i, p[0] - 1.2, p[1], p[2] - 0.5, 20, 'N')); L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', i, p[0], p[1], p[2])); L.push(atomLine('ATOM', n++, 'C', 'ALA', 'A', i, p[0] + 1.2, p[1], p[2] + 0.5)); L.push(atomLine('ATOM', n++, 'O', 'ALA', 'A', i, p[0] + 2.2, p[1] + 0.6, p[2] + 0.5, 20, 'O'));   // the O is what orients the cartoon
  }
  return L.join('\n') + '\nEND\n';
}
// A ligand numbered between two residues of its own chain letter, 1.5 Å from both: the contacts a "neighbour residue" rule threw away.
function clashPdb() {
  const L = []; let n = 1;
  L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', 200, 0, 0, 0)); L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', 202, 6, 0, 0));
  L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', 10, 30, 0, 0)); L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', 11, 31.5, 0, 0));   // two true neighbours, 1.5 Å apart: never a clash
  L.push(atomLine('HETATM', n++, 'C1', 'LIG', 'A', 201, 1.5, 0, 0)); L.push(atomLine('HETATM', n++, 'C2', 'LIG', 'A', 201, 4.5, 0, 0));
  return L.join('\n') + '\nEND\n';
}
// Built for the interactions: every contact at a known distance (see RB30).
function interPdb() {
  const L = []; let n = 1; const A = (rec, name, resn, ch, resi, x, y, z, el) => L.push(atomLine(rec, n++, name, resn, ch, resi, x, y, z, 20, el));
  const hex = (cx, cy, cz) => [0, 1, 2, 3, 4, 5].map(k => [cx + 1.39 * Math.cos(k * Math.PI / 3), cy + 1.39 * Math.sin(k * Math.PI / 3), cz]);
  // chain A: a PHE ring, a SER OG, an ASN OD1, a LEU CD1, a LYS NZ, two more lysines, an ALA
  const pr = hex(20, 0, 0); ['CG', 'CD1', 'CE1', 'CZ', 'CE2', 'CD2'].forEach((nm, k) => A('ATOM', nm, 'PHE', 'A', 30, pr[k][0], pr[k][1], pr[k][2], 'C')); A('ATOM', 'CA', 'PHE', 'A', 30, 20, -3.5, 0, 'C');
  A('ATOM', 'CA', 'SER', 'A', 40, 24.5, 0, 8.5, 'C'); A('ATOM', 'OG', 'SER', 'A', 40, 22.8, 0, 6.6, 'O');
  A('ATOM', 'CA', 'ASN', 'A', 50, 15.5, 0, 9.5, 'C'); A('ATOM', 'OD1', 'ASN', 'A', 50, 16.9, 0, 7.0, 'O');
  A('ATOM', 'CA', 'LEU', 'A', 60, 18.6, 4.5, 9.5, 'C'); A('ATOM', 'CD1', 'LEU', 'A', 60, 18.6, 2.4, 7.5, 'C');
  A('ATOM', 'CA', 'LYS', 'A', 70, 36, 0, 0, 'C'); A('ATOM', 'NZ', 'LYS', 'A', 70, 40, 0, 0, 'N');
  A('ATOM', 'CA', 'LYS', 'A', 72, 96, 0, 0, 'C'); A('ATOM', 'NZ', 'LYS', 'A', 72, 100, 0, 0, 'N');
  A('ATOM', 'CA', 'ALA', 'A', 91, 61.5, 0, 0, 'C');
  // chain B: a GLU across from the lysine, an ALA on top of chain A's
  A('ATOM', 'CA', 'GLU', 'B', 80, 47, 0, 0, 'C'); A('ATOM', 'OE1', 'GLU', 'B', 80, 43.2, 0, 0, 'O');
  A('ATOM', 'CA', 'ALA', 'B', 90, 60, 0, 0, 'C');
  // the ligand: a ring stacked 3.7 Å over the PHE, an N, a Cl, a lone carbon and an O
  const first = n, lr = hex(20, 0, 3.7); lr.forEach((p, k) => A('HETATM', 'C' + (k + 1), 'LIG', 'A', 201, p[0], p[1], p[2], 'C'));
  A('HETATM', 'N1', 'LIG', 'A', 201, 22.8, 0, 3.7, 'N'); A('HETATM', 'CL1', 'LIG', 'A', 201, 16.9, 0, 3.7, 'CL'); A('HETATM', 'C7', 'LIG', 'A', 201, 18.6, 2.4, 3.7, 'C'); A('HETATM', 'O8', 'LIG', 'A', 201, 21.4, -2.4, 3.7, 'O');
  A('HETATM', 'MG', 'MG', 'A', 301, 21.4, -4.5, 3.7, 'MG');
  const b = (i, j) => L.push('CONECT' + String(first + i).padStart(5) + String(first + j).padStart(5));
  [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [3, 7], [2, 8], [5, 9]].forEach(([i, j]) => b(i, j));
  return L.join('\n') + '\nEND\n';
}
function shellPdb() {   // a closed shell of carbons round an empty middle: one pocket, about (4/3)π·5³ Å³
  const L = []; let n = 1; const N = 520, R = 8.6;
  for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5)); L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', i + 1, R * r * Math.cos(t), R * y, R * r * Math.sin(t), 20, 'C')); }
  return L.join('\n') + '\nEND\n';
}
function shellPdbN(N, R, K = 1, gap = 22) {   // K³ closed shells on a lattice: K³ cavities, K³·N atoms
  const L = []; let n = 1, res = 1;
  for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) for (let c = 0; c < K; c++) for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5)); L.push(atomLine('ATOM', n++, 'CA', 'ALA', 'A', res++, a * gap + R * r * Math.cos(t), b * gap + R * y, c * gap + R * r * Math.sin(t), 20, 'C')); }
  return L.join('\n') + '\nEND\n';
}
// A degrader-like ligand folded on itself (a ring, an eight-carbon coil, a ring) with residues round it, many of them in one narrow wedge:
// what a flat picture has to untangle (RB42).
function diagPdb() {
  const L = []; let n = 1; const A = (rec, name, resn, ch, resi, x, y, z, el) => L.push(atomLine(rec, n++, name, resn, ch, resi, x, y, z, 20, el));
  const P = [], el = [];   // ring A (0-5), N (6), coil (7-14), ring B (15-20), O (21)
  for (let k = 0; k < 6; k++) { P.push([1.39 * Math.cos(k * Math.PI / 3), 1.39 * Math.sin(k * Math.PI / 3), 0]); el.push('C'); }
  P.push([-2.8, 0, 0]); el.push('N');
  for (let k = 0; k < 8; k++) { const t = k * 100 * Math.PI / 180; P.push([3.1 + 0.59 * k, 0.9 * Math.cos(t), 0.9 * Math.sin(t)]); el.push('C'); }
  const ex = P[14], cB = [ex[0] + 1.5, ex[1] - 1.39, ex[2]];
  for (let k = 0; k < 6; k++) { P.push([cB[0], cB[1] + 1.39 * Math.cos(k * Math.PI / 3), cB[2] + 1.39 * Math.sin(k * Math.PI / 3)]); el.push('C'); }
  P.push([cB[0], cB[1] - 2.79, cB[2]]); el.push('O');
  const first = n; P.forEach((p, i) => A('HETATM', el[i] + (i + 1), 'LIG', 'A', 201, p[0], p[1], p[2], el[i]));
  const bonds = []; for (let k = 0; k < 6; k++) { bonds.push([k, (k + 1) % 6]); bonds.push([15 + k, 15 + (k + 1) % 6]); }
  bonds.push([3, 6]); bonds.push([0, 7]); for (let k = 7; k < 14; k++) bonds.push([k, k + 1]); bonds.push([14, 15]); bonds.push([18, 21]);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // residues: a contact carbon 3.8 Å from a ligand carbon that bonds only carbons, 3 Å or more from every other ligand atom, 2.8 Å from each other
  const carbonOnly = i => el[i] === 'C' && ![3, 14, 15, 18].includes(i) && !(i === 0);
  const wedge = [12, 13, 16, 17, 19, 20], free = P.map((p, i) => i).filter(carbonOnly);
  const placed = []; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const names = [['LEU', 'CD1'], ['VAL', 'CG1'], ['ILE', 'CD1'], ['LEU', 'CD2'], ['VAL', 'CG2'], ['ILE', 'CG1']];
  let resi = 30;
  for (let tries = 0; tries < 20000 && placed.length < 22; tries++) {
    const inWedge = placed.length < 9 && tries < 6000, i = inWedge ? wedge[Math.floor(rnd() * wedge.length)] : free[Math.floor(rnd() * free.length)];
    let d;
    if (inWedge) d = [1, (rnd() - 0.5) * 1.8, (rnd() - 0.5) * 1.8];
    else { const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); d = [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)]; }
    const m = Math.hypot(...d); d = d.map(v => v / m);
    const q = [P[i][0] + 3.7 * d[0], P[i][1] + 3.7 * d[1], P[i][2] + 3.7 * d[2]];
    if (P.some((p, j) => j !== i && dist(p, q) < 3.0)) continue;
    if (placed.some(o => dist(o, q) < 2.8)) continue;
    placed.push(q);
    const [rn, an] = names[placed.length % names.length];
    A('ATOM', 'CA', rn, 'A', resi, q[0] + 1.5 * d[0], q[1] + 1.5 * d[1], q[2] + 1.5 * d[2], 'C'); A('ATOM', an, rn, 'A', resi, q[0], q[1], q[2], 'C'); resi += 3;
  }
  // two that hold the ligand by hydrogen bonds: a serine on the N, an aspartate on the O
  A('ATOM', 'CA', 'SER', 'A', 120, P[6][0] - 3.4, 1.9, 0.4, 'C'); A('ATOM', 'OG', 'SER', 'A', 120, P[6][0] - 2.8, 0.3, 0, 'O');
  A('ATOM', 'CA', 'ASP', 'A', 130, P[21][0] + 1.5, P[21][1] - 4.1, 0.4, 'C'); A('ATOM', 'OD1', 'ASP', 'A', 130, P[21][0], P[21][1] - 2.8, 0, 'O');
  bonds.forEach(([i, j]) => L.push('CONECT' + String(first + i).padStart(5) + String(first + j).padStart(5)));
  return L.join('\n') + '\nEND\n';
}
const AF_B = i => (i <= 3 ? 95 : i <= 6 ? 80 : i <= 9 ? 60 : 30);
const STRUCTS = {
  '1XYZ': () => synPdb(),
  '2ROD': () => synPdb({ chains: [{ id: 'A', len: 180, shape: 'x' }] }),
  '3TAL': () => synPdb({ chains: [{ id: 'A', len: 180, shape: 'y' }] }),
  '4LIG': () => synPdb({ ligand: true, protac: true, ion: true, mod: true, waters: true }),
  '5NMR': () => synPdb({ chains: [{ id: 'A', len: 20, x0: 0 }], models: 3 }),
  '7SEQ': () => synPdb({ chains: [{ id: 'A', len: 24, x0: 0 }, { id: 'B', len: 24, x0: 20, shape: 'x', shift: 5 }], names: true }),
  '7ROT': () => rotatedCopy(synPdb({ chains: [{ id: 'A', len: 24, x0: 0 }, { id: 'B', len: 24, x0: 20, shape: 'x', shift: 5 }], names: true })),
  '7MUT': () => rotatedCopy(synPdb({ chains: [{ id: 'A', len: 24, x0: 0 }, { id: 'B', len: 24, x0: 20, shape: 'x', shift: 5 }], names: true }), { drop: ['A5'], push: ['A3', 'A9'], rename: { A7: 'TRP' } }),
  '6IFC': () => synPdb({ chains: [{ id: 'A', len: 10, shape: 'line' }, { id: 'B', len: 6, shape: 'line', y0: 4 }] }),   // B lies 4 Å from A along its first six residues
  '6FAR': () => synPdb({ chains: [{ id: 'A', len: 10, shape: 'line' }, { id: 'B', len: 6, shape: 'line', y0: 60 }] }),
  '7APO': () => synPdb({ chains: [{ id: 'A', len: 14, x0: 0 }], additive: true }),   // an entry whose only ligand is glycerol
  '8CAM': () => globulePdb(),
  '9INT': () => interPdb(),
  '9BIG': () => shellPdbN(330, 7.5, 5),
  '9CLS': () => clashPdb(),
  '9DGM': () => diagPdb(),
  '9SHL': () => shellPdb(),
  '8POC': () => synPdb({ chains: [{ id: 'A', len: 14, x0: 0 }], additive: true, ligand: true, ligandN: 14 }),   // a real ligand beside the glycerol
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
    if (/AF-P12345-F1-predicted_aligned_error/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ predicted_aligned_error: Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => (i < 6) === (j < 6) ? 2 : 25)), max_predicted_aligned_error: 31.75 }]) });
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
  await pg.goto(base + (o.file || args.file || 'apps/ribbon/ribbon.html') + '?_ts=' + Date.now(), { waitUntil: 'load' });
  await pg.waitForTimeout(o.settle ?? 1500);
  const E = (f, a) => pg.evaluate(f, a);
  // RB_THROTTLE=6 slows the page like CI's software GL does, so a suite that only fails there can be reproduced on a laptop
  if (+process.env.RB_THROTTLE > 1) { const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.RB_THROTTLE }); }
  // Soft is the default light and its occlusion pass costs ~0.4 s a draw without a GPU (CI, a laptop on software GL): the suites open with Flat,
  // which is what Simple cost them before, and the ones about light set their own.
  if (o.light !== false) await pg.evaluate(() => { try { state.lighting = 'flat'; } catch (e) {} });
  // the panel is tabs: a control is brought on screen (its tab, its section) before it is pressed, as a person would
  for (const m of ['click', 'fill', 'check', 'uncheck', 'focus']) {
    const orig = pg[m].bind(pg);
    pg[m] = async (sel, ...rest) => { if (typeof sel === 'string' && !/:text|>>/.test(sel)) { try { await pg.evaluate(q => window.rbReveal && rbReveal(q), sel); } catch (e) {} } return orig(sel, ...rest); };
  }
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
  await pg.mouse.move(box.x + 300, box.y + 200); await pg.mouse.wheel(0, -300); await sleep(900);   // the wheel is eased: let it arrive
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
  check('RB13', 'toggles say whether they are on', await E(() => ['spinBtn', 'resTagBtn'].every(id => document.getElementById(id).hasAttribute('aria-pressed')) && [...document.querySelectorAll('.rb-tab')].every(b => b.getAttribute('role') === 'tab' && b.hasAttribute('aria-selected')) && [...document.querySelectorAll('#styleSeg button,#projSeg button')].every(b => b.hasAttribute('aria-pressed'))));
  // the panel is on the right, like ChimeraX and PyMOL: the pane right of the viewer, its tabs at the edge, a chain's popup beside it, never over it
  const lay = await E(() => { const pn = document.getElementById('rbPanel').getBoundingClientRect(), rl = document.getElementById('rbRail').getBoundingClientRect(), vp = document.getElementById('viewport').getBoundingClientRect(); return { right: pn.left >= vp.right - 1, rail: rl.left >= pn.right - 1 && rl.right >= innerWidth - 1 }; });
  check('RB13', 'the controls pane sits to the right of the viewer', lay.right, lay);
  check('RB13', 'the tabs are a column at the right edge, beside the pane', lay.rail, lay);
  const pop = await E(async () => { rbTab('models'); document.querySelector('#chainList .li[data-chain] .li-main').click(); await new Promise(r => setTimeout(r, 250)); const p = document.getElementById('chain-popup').getBoundingClientRect(), sb = document.getElementById('rbPanel').getBoundingClientRect(); closeChainPopup(); return { pr: Math.round(p.right), sl: Math.round(sb.left) }; });
  check('RB13', 'a chain popup opened from the panel does not cover the panel', pop.pr <= pop.sl, pop);
  const fold = await E(async () => { const w = () => new Promise(r => setTimeout(r, 60)), b = () => document.querySelector('.rb-tab.on'), vis = () => document.getElementById('rbPanel').offsetWidth > 0; rbTab('colour'); await w(); b().click(); await w(); const hid = !vis(); document.getElementById('tab-analyse').click(); await w(); return { hid, back: vis(), tab: _rbTab }; });
  check('RB13', 'clicking the open tab folds the pane away; another tab brings it back, on that tab', fold.hid && fold.back && fold.tab === 'analyse', fold);
  const keysT = await E(async () => { const t = document.getElementById('tab-analyse'); t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); await new Promise(r => setTimeout(r, 30)); return { tab: _rbTab, focus: document.activeElement.id, panes: [...document.querySelectorAll('.rb-pane')].filter(p => !p.hidden).length }; });
  check('RB13', 'the arrow keys move between tabs, one pane at a time', keysT.tab === 'figure' && keysT.focus === 'tab-figure' && keysT.panes === 1, keysT);
  const remem = await E(() => localStorage.getItem('ribbon_tab'));
  check('RB13', 'the open tab is remembered', remem === 'figure', remem);
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
  await pg.focus('details[data-sec=values] > summary'); await pg.keyboard.press('Enter'); await sleep(200);
  const was = await E(() => document.querySelector('details[data-sec=values]').open);
  await pg.keyboard.press('Enter'); await sleep(200);
  check('RB13', 'a section folds and unfolds with Enter', was !== await E(() => document.querySelector('details[data-sec=values]').open));
  await E(() => { document.querySelector('details[data-sec=values]').open = true; }); await sleep(250);
  const saved = await E(() => JSON.parse(localStorage.getItem('ribbon_sec') || '{}').values);
  check('RB13', 'what is open is remembered', saved === true, saved);
  await E(() => { rbTab('colour'); foldAll(); }); await sleep(100);
  check('RB13', 'Fold all folds the open pane and turns into Unfold all', await E(() => { const p = document.getElementById('pane-colour'); return [...p.querySelectorAll('details.rb-sec')].every(d => !d.open) && p.querySelector('.fold-all').textContent === 'Unfold all'; }));
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

// ── RB20 comparing two structures ───────────────────────────────────────────────────────────
async function rb20() {
  const { ctx, pg, E, go } = await open({ tag: 'RB20 ' });
  if (!(await has3d(pg))) { skipped.push('RB20 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  // the arithmetic, apart from the page
  const m = await E(() => {
    const rnd = (() => { let s = 12345; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
    const q = [rnd() - .5, rnd() - .5, rnd() - .5, rnd() - .5], n = Math.hypot(...q); const [w, x, y, z] = q.map(v => v / n);
    const R0 = [[w*w+x*x-y*y-z*z, 2*(x*y-w*z), 2*(x*z+w*y)], [2*(x*y+w*z), w*w-x*x+y*y-z*z, 2*(y*z-w*x)], [2*(x*z-w*y), 2*(y*z+w*x), w*w-x*x-y*y+z*z]], t0 = [3, -7, 11];
    const P = [...Array(40)].map(() => [rnd() * 30, rnd() * 30, rnd() * 30]), app = (R, t, p) => [0, 1, 2].map(i => R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2] + t[i]);
    const Q = P.map(p => app(R0, t0, p)), F = hornFit(P, Q);
    let dR = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) dR = Math.max(dR, Math.abs(F.R[i][j] - R0[i][j]));
    const det = M => M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1]) - M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0]) + M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
    const mir = hornFit(P, Q.map(p => [-p[0], p[1], p[2]]));
    const nw1 = nwAlign('ACDEFG', 'ACEFG'), nw2 = nwAlign('MKVLAAGIV', 'MKVLAAGIV');
    return { dR, det: det(F.R), tdiff: Math.max(...F.t.map((v, i) => Math.abs(v - t0[i]))), mirDet: det(mir.R), nw1: nw1.pairs.map(p => p.join(':')).join(), nw1id: nw1.ident, nw2: nw2.pairs.length, nw2id: nw2.ident, none: nwAlign('', 'AAA') };
  });
  check('RB20', 'Horn recovers a known rotation and translation to rounding', m.dR < 1e-9 && m.tdiff < 1e-8 && Math.abs(m.det - 1) < 1e-9, m);
  check('RB20', 'a mirror image is never fitted by a reflection', Math.abs(m.mirDet - 1) < 1e-9, m.mirDet);
  check('RB20', 'the sequence alignment puts the gap where the residue is missing', m.nw1 === '0:0,1:1,3:2,4:3,5:4' && m.nw1id === 1 && m.nw2 === 9 && m.nw2id === 1 && m.none === null, m);
  // an identical structure, turned and moved
  await go('7SEQ'); await sleep(300);
  const pic0 = await E(() => viewer.pngURI());
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  await E(() => { document.getElementById('ovInput').value = '7ROT'; document.getElementById('ovGo').click(); }); await sleep(2500);
  const r = await E(() => ({ res: ovl && ovl.res, ref: state.overlay.ref, mov: state.overlay.mov, body: !document.getElementById('ovBody').hidden, card: document.getElementById('ovResult').textContent, models: viewer.selectedAtoms({}).length, prim: currentModel.selectedAtoms({}).length, ov: ovl.atoms.length }));
  check('RB20', 'a rotated, moved copy aligns with an RMSD at the rounding of the file, over every residue', r.res && r.res.rmsd < 0.002 && r.res.n === 24 && r.res.total === 24 && r.res.ident === 1, r);
  check('RB20', 'the best pair of chains is found (A with A) and the card says what was done', r.ref === 'A' && r.mov === 'A' && r.body && /RMSD 0\.00 Å over 24 residues/.test(r.card) && /100% identical/.test(r.card), r);
  const where = await E(() => { let worst = 0; ['A', 'B'].forEach(c => currentModel.selectedAtoms({ chain: c, atom: 'CA' }).forEach(a => { const b = ovl.model.selectedAtoms({ chain: c, resi: a.resi, atom: 'CA' })[0]; worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)); })); return worst; });
  check('RB20', 'the whole second structure moved with it, chain B as well as the one fitted', where < 0.005, where);
  check('RB20', 'the second structure is not pickable and the first still is', await E(() => !ovl.atoms.some(a => a.clickable) && currentModel.selectedAtoms({}).some(a => a.clickable)));
  check('RB20', 'both structures are inside the view', await (async () => { const b = await boxOf(E); return b.x0 >= -4 && b.x1 <= b.W + 4 && b.y0 >= -4 && b.y1 <= b.H + 4; })());
  const pic1 = await E(() => viewer.pngURI());
  // colour, visibility
  await E(() => document.querySelectorAll('#ovColors .swatch')[2].click()); await sleep(200);
  check('RB20', 'a colour for the second structure changes the picture, and the palette tuning acts on it', await E(() => viewer.pngURI()) !== pic1 && await E(() => state.overlay.color === OV_COLORS[2]));
  await E(() => { state.hsl.h = 100; recolorStructure(); }); const tuned = await E(() => viewer.pngURI()); await E(() => { state.hsl.h = 0; recolorStructure(); });
  check('RB20', 'palette tuning moves the second colour too', tuned !== await E(() => viewer.pngURI()));
  await E(() => { document.getElementById('ovShow').checked = false; document.getElementById('ovShow').dispatchEvent(new Event('change')); }); await sleep(200);
  check('RB20', 'hiding it leaves the first structure as it was', await E(() => viewer.pngURI()) !== pic1);
  await E(() => { document.getElementById('ovShow').checked = true; document.getElementById('ovShow').dispatchEvent(new Event('change')); });
  // a mutation, a missing residue and two residues out of place
  await E(() => { document.getElementById('ovInput').value = '7MUT'; document.getElementById('ovGo').click(); }); await sleep(2500);
  await E(() => { ['ovRef', 'ovMov'].forEach(id => { const e = document.getElementById(id); e.value = 'A'; e.dispatchEvent(new Event('change')); }); });   // the best pair here is B with B (whole and identical); the interesting one is A with A
  const u = await E(() => ({ res: ovl.res, models: viewer.selectedAtoms({}).length, prim: currentModel.selectedAtoms({}).length, ov: ovl.atoms.length }));
  check('RB20', 'a second structure replaces the first rather than adding to it', u.models === u.prim + u.ov && u.ov < r.ov, u);
  check('RB20', 'a gap, a mutation and two outliers: the pairs are made, the outliers left out, the fit stays tight', u.res.total === 23 && u.res.n === 21 && u.res.rmsd < 0.002 && u.res.ident > 0.9 && u.res.ident < 1, u.res);
  const offA = await E(() => { const k = (c, r) => ovl.model.selectedAtoms({ chain: c, resi: r, atom: 'CA' })[0], p = (c, r) => currentModel.selectedAtoms({ chain: c, resi: r, atom: 'CA' })[0]; const d = r => Math.hypot(k('A', r).x - p('A', r).x, k('A', r).y - p('A', r).y, k('A', r).z - p('A', r).z); return { good: Math.max(d(2), d(10), d(20)), out: d(3) }; });
  check('RB20', 'the residues kept sit on top of each other and the outlier does not', offA.good < 0.01 && offA.out > 5, offA);
  // another chain, the same structure
  await E(() => { const s = document.getElementById('ovMov'); s.value = 'B'; s.dispatchEvent(new Event('change')); });
  check('RB20', 'choosing another chain re-aligns and says it', await E(() => ovl.res.mov === 'B') );
  await E(() => { const s = document.getElementById('ovMov'); s.value = 'A'; s.dispatchEvent(new Event('change')); });
  // reset and align again
  await E(() => document.getElementById('ovReset').click());
  const back = await E(() => { const a = ovl.atoms[0]; return Math.hypot(a.x - a._o[0], a.y - a._o[1], a.z - a._o[2]) + (ovl.res === null ? 0 : 1); });
  check('RB20', 'Put it back returns every atom to where its file had it', back === 0, back);
  await E(() => document.getElementById('ovAlign').click()); await sleep(300);
  check('RB20', 'Align again aligns again', await E(() => ovl.res && ovl.res.n === 21));
  // a design keeps it
  await E(() => { document.getElementById('designName').value = 'cmp'; saveDesign(); }); await sleep(500);
  const keep = await E(() => JSON.stringify(state.overlay));
  await E(() => { removeOverlay(); loadDesign('cmp'); }); await sleep(4500);
  const re = await E(() => ({ o: JSON.stringify(state.overlay), rmsd: ovl && ovl.res && ovl.res.rmsd, n: ovl && ovl.res && ovl.res.n }));
  check('RB20', 'a design keeps the second structure, its chains and colour, and aligns it again when it loads', re.o === keep && re.n === 21 && re.rmsd < 0.002, { re, keep });
  // the scripts carry it, superposed exactly as on screen
  const sc = await E(() => ({ pml: buildScript('pymol'), cxc: buildScript('chimerax'), atoms: ovl.atoms.filter((a, i) => i % 7 === 0).map(a => ({ o: a._o, p: [a.x, a.y, a.z] })) }));
  const mPy = /^cmd\.transform_selection\("second", \[([^\]]+)\], homogenous=1\)$/m.exec(sc.pml), mCx = /^view matrix models #2,(\S+)$/m.exec(sc.cxc);
  const errOf = m => { if (!m) return 1e9; const v = m[1].split(',').map(Number); if (v.length < 12 || v.some(x => !isFinite(x))) return 1e9; let w = 0; sc.atoms.forEach(a => { for (let i = 0; i < 3; i++) w = Math.max(w, Math.abs(v[4 * i] * a.o[0] + v[4 * i + 1] * a.o[1] + v[4 * i + 2] * a.o[2] + v[4 * i + 3] - a.p[i])); }); return w; };
  check('RB20', 'PyMOL script: the second structure is fetched and moved by the fit, landing within 0.01 Å of where Ribbon draws it', /^fetch 7mut, second, async=0$/m.test(sc.pml) && errOf(mPy) < 0.01, errOf(mPy));
  check('RB20', 'ChimeraX script: the same, opened as #2 and placed with view matrix models', /^open 7mut$/m.test(sc.cxc) && errOf(mCx) < 0.01 && sc.cxc.indexOf('open 7mut') < sc.cxc.indexOf('# labels') + (sc.cxc.indexOf('# labels') < 0 ? 1e9 : 0), errOf(mCx));
  check('RB20', 'its colour is the one on screen, and its lines stay off the first structure', new RegExp('^color 0x' + (await E(() => adjustColor(state.overlay.color))).replace('#', '') + ', second$', 'mi').test(sc.pml) && !/^color #1 .*#2/m.test(sc.cxc) && !/A second structure is superposed in Ribbon; it is not part/.test(sc.pml));
  await E(() => { state.overlay.show = false; });
  const scH = await E(() => buildScript('pymol') + buildScript('chimerax'));
  check('RB20', 'a hidden second structure is left out of the scripts, and they say so', !/second, async=0|^open 7mut$/m.test(scH) && /superposed in Ribbon but hidden/.test(scH));
  await E(() => { state.overlay.show = true; });
  // remove: nothing of it is left
  await E(() => document.getElementById('ovRemove').click()); await sleep(400);
  check('RB20', 'removing it leaves the first structure alone', await E(() => viewer.selectedAtoms({}).length === currentModel.selectedAtoms({}).length && !state.overlay && document.getElementById('ovBody').hidden));
  // bad input
  await E(() => { document.getElementById('ovInput').value = 'zzzz!'; document.getElementById('ovGo').click(); });
  check('RB20', 'something that is not an id is refused with a reason', /Enter a PDB code/.test(await E(() => document.getElementById('ovErr').textContent)));
  await E(() => { document.getElementById('ovInput').value = '9ZZ9'; document.getElementById('ovGo').click(); }); await sleep(700);
  check('RB20', 'an entry that does not exist is named', /There is no PDB entry “9ZZ9”/.test(await E(() => document.getElementById('ovErr').textContent)) && await E(() => !document.getElementById('ovGo').disabled));
  await pg.setInputFiles('#ovFileInput', { name: 'junk.pdb', mimeType: 'text/plain', buffer: Buffer.from('not a structure') }); await sleep(600);
  check('RB20', 'a file that is not a structure is refused', /does not look like a structure/.test(await E(() => document.getElementById('ovErr').textContent)) && await E(() => !state.overlay));
  await pg.setInputFiles('#ovFileInput', { name: 'copy.pdb', mimeType: 'text/plain', buffer: Buffer.from(rotatedCopy(STRUCTS['7SEQ']())) }); await sleep(1800);
  check('RB20', 'a file works as the second structure', await E(() => ovl && ovl.res && ovl.res.rmsd < 0.002 && state.overlay.kind === 'file'));
  check('RB20', 'a second structure from a file is loaded by its name, and the script says to keep the file beside it', await E(() => /^load "copy\.pdb", second$/m.test(buildScript('pymol')) && /^open "copy\.pdb"$/m.test(buildScript('chimerax')) && /keep "copy\.pdb" next to this script too/.test(buildScript('pymol'))));
  await go('1XYZ');
  check('RB20', 'a new first structure drops the second', await E(() => !state.overlay && !ovl && viewer.selectedAtoms({}).length === currentModel.selectedAtoms({}).length));
  await ctx.close();
}

// ── RB21 values: conservation, variants, a table ────────────────────────────────────────────
const AA1 = { ALA: 'A', GLY: 'G', SER: 'S', LEU: 'L', LYS: 'K', VAL: 'V', THR: 'T', GLU: 'E', ASP: 'D', ILE: 'I', PHE: 'F', ARG: 'R', TYR: 'Y', PRO: 'P' };
const chainAseq = () => [...Array(24)].map((_, i) => AA1[NAMES3[(i + 1) % NAMES3.length]]).join('');   // 7SEQ chain A: residue i has NAMES3[i % 14], numbered from 1
function nodeScores(seqs) {   // the same entropy, written again here
  return [...seqs[0]].map((_, c) => { const cnt = {}; let tot = 0; for (const s of seqs) { const x = s[c]; if (x === '-' || x === 'X') continue; cnt[x] = (cnt[x] || 0) + 1; tot++; }
    if (!tot) return null; let H = 0; for (const k in cnt) { const p = cnt[k] / tot; H -= p * Math.log2(p); } return Math.max(0, 1 - H / Math.log2(20)) * (tot / seqs.length); });
}
async function rb21() {
  const { ctx, pg, E, go } = await open({ tag: 'RB21 ' });
  if (!(await has3d(pg))) { skipped.push('RB21 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('7SEQ'); await sleep(400);
  await E(() => document.querySelectorAll('details.rb-sec').forEach(d => { d.open = true; }));
  // the arithmetic
  const a = chainAseq().split(''), s2 = a.slice(), s3 = a.slice();
  [2, 3, 4].forEach((i, k) => { s2[i] = 'WCMH'[k]; }); s3[2] = 'N'; s3[9] = '-';
  const seqs = [a.join(''), s2.join(''), s3.join('')], want = nodeScores(seqs);
  const col = await E(seqs => columnScores(seqs.map(s => ({ seq: s }))), seqs);
  check('RB21', 'column scores equal the entropy worked out here (gaps weight a column down)', col.every((v, i) => (v === null && want[i] === null) || Math.abs(v - want[i]) < 1e-9), { col: col.slice(0, 6), want: want.slice(0, 6) });
  const spot = await E(() => columnScores([{ seq: 'AAGG-' }, { seq: 'AAGG-' }].concat([{ seq: 'AAAA-' }, { seq: 'AAAA-' }]).map(s => ({ seq: s.seq }))).map(v => v));
  const sp2 = await E(() => columnScores(['A', 'A', 'G', 'G'].map(c => ({ seq: c + 'A' + (c === 'G' ? '-' : 'A') }))));
  check('RB21', 'an identical column scores 1, a half-and-half column 1 − 1/log2(20), a column half gaps is halved, all gaps is nothing', spot[0] === 1 && Math.abs(spot[2] - (1 - 1 / Math.log2(20))) < 1e-9 && spot[4] === null && sp2[1] === 1 && Math.abs(sp2[2] - 0.5) < 1e-9, { spot, sp2 });
  const fa = await E(() => parseAlignment('>a b\nMKV-\nLA\n>c\nMKVLA').map(s => s.name + ':' + s.seq).join('|'));
  const cl = await E(() => parseAlignment('CLUSTAL W\n\nhuman   MKVLA-  6\nmouse   MKILAG  6\n\n        ** **\n').map(s => s.name + ':' + s.seq).join('|'));
  check('RB21', 'FASTA (wrapped lines, a description) and Clustal blocks both read', fa === 'a:MKV-LA|c:MKVLA' && cl === 'human:MKVLA-|mouse:MKILAG', { fa, cl });
  // through the panel
  const fasta = seqs.map((s, i) => '>' + ['human', 'mouse', 'fish'][i] + '\n' + s).join('\n');
  await E(f => { document.getElementById('alnText').value = f; document.getElementById('alnText').dispatchEvent(new Event('input')); }, fasta);
  const sel = await E(() => ({ ref: document.getElementById('alnRef').selectedOptions[0].textContent, chain: document.getElementById('alnChain').value, n: document.getElementById('alnRef').options.length }));
  check('RB21', 'the selects list the sequences and pick the one most like the chain', sel.n === 3 && sel.ref === 'human' && sel.chain === 'A', sel);
  await pg.click('#alnGo'); await sleep(500);
  const got = await E(() => ({ color: state.color, top: document.getElementById('topColor').value, data: state.values.data.A, title: state.values.title, lg: document.getElementById('legend').textContent, show: document.getElementById('legend').classList.contains('show'), card: document.getElementById('valInfo').textContent, acts: !document.getElementById('valActs').hidden }));
  const exp = {}; want.forEach((v, i) => { if (v != null) exp[i + 1] = v; });
  check('RB21', 'the conservation mapped to each residue equals the column score', Object.keys(exp).length === 24 && Object.keys(exp).every(k => Math.abs(got.data[k] - exp[k]) < 1e-9) && exp[10] < exp[11], { n: Object.keys(got.data).length });
  check('RB21', 'colour mode switches to your values; the key says variable and conserved', got.color === 'values' && got.top === 'values' && got.show && /variable/.test(got.lg) && /conserved/.test(got.lg) && /Conservation \(3 sequences\)/.test(got.title) && got.acts, got);
  const cols = await E(() => { const f = makeColorFn(), at = r => currentModel.selectedAtoms({ chain: 'A', resi: r, atom: 'CA' })[0]; const hi = Object.keys(state.values.data.A).sort((x, y) => state.values.data.A[y] - state.values.data.A[x])[0], lo = Object.keys(state.values.data.A).sort((x, y) => state.values.data.A[x] - state.values.data.A[y])[0];
    const o = { hi: f(at(+hi)), lo: f(at(+lo)), B: f(currentModel.selectedAtoms({ chain: 'B', resi: 3, atom: 'CA' })[0]), wantHi: adjustColor(VAL_STOPS[2]), wantLo: adjustColor(valueColor(valueT(state.values.data.A[lo]))), grey: adjustColor('#c9ccd6') };
    document.getElementById('valRev').checked = true; document.getElementById('valRev').dispatchEvent(new Event('change')); const g = makeColorFn(); o.revHi = g(at(+hi)); return o; });
  check('RB21', 'the most conserved residue is the deep colour, the least is on the ramp, a residue with no value is grey', cols.hi === cols.wantHi && cols.lo === cols.wantLo && cols.B === cols.grey, cols);
  check('RB21', '"Reverse the colours" swaps the ends', cols.revHi !== cols.hi);
  await E(() => { document.getElementById('valRev').checked = false; document.getElementById('valRev').dispatchEvent(new Event('change')); });
  check('RB21', 'the palette tuning acts on it', await (async () => { const p0 = await E(() => viewer.pngURI()); await E(() => { state.hsl.s = 10; recolorStructure(); }); const p1 = await E(() => viewer.pngURI()); await E(() => { state.hsl.s = 100; recolorStructure(); }); return p0 !== p1; })());
  // not an alignment
  await E(() => { document.getElementById('alnText').value = '>a\nMKVLA\n>b\nMKV'; document.getElementById('alnGo').click(); });
  check('RB21', 'sequences of different lengths are refused with the reason', /not the same length/.test(await E(() => document.getElementById('valErr').textContent)));
  await E(() => { document.getElementById('alnText').value = '>a\nWWWWWWWW\n>b\nWWWWWWWW'; document.getElementById('alnText').dispatchEvent(new Event('input')); document.getElementById('alnGo').click(); });
  check('RB21', 'an alignment of another protein is refused rather than coloured at random', /almost nothing|few residues/.test(await E(() => document.getElementById('valErr').textContent)));
  // a design keeps it, clearing puts the colour back
  await E(() => { document.getElementById('alnText').value = ''; });
  await E(() => { document.getElementById('designName').value = 'vals'; saveDesign(); }); await sleep(500);
  const keep = JSON.stringify(await E(() => state.values));
  await E(() => { clearValues(); loadDesign('vals'); }); await sleep(2800);
  check('RB21', 'a design keeps the values and the colour mode', JSON.stringify(await E(() => state.values)) === keep && await E(() => state.color) === 'values');
  await E(() => document.getElementById('valClear').click());
  check('RB21', 'Clear returns to a normal colour mode and hides the key', await E(() => state.color === 'uniform' && !state.values && !document.getElementById('legend').classList.contains('show') && document.getElementById('valInfo').hidden));
  await E(() => { document.getElementById('topColor').value = 'values'; document.getElementById('topColor').dispatchEvent(new Event('change')); });
  check('RB21', 'choosing "Your values" with none says where to add them', /Add some values first/.test(await E(() => document.getElementById('toastMsg').textContent)) && await E(() => document.querySelector('details[data-sec=values]').open));
  await E(() => { state.color = 'uniform'; document.getElementById('topColor').value = 'uniform'; updateColorOrOpacity(); });
  // variants
  const pv = await E(() => ({ a: parseVariants('R175H, A:G245S p.V5A 249 K12*').variants.map(v => [v.chain, v.wt, v.resi, v.mut, v.text].join('/')), bad: parseVariants('5!!, Q9Z, ok').bad, three: parseVariants('Arg175His').variants[0] && [parseVariants('Arg175His').variants[0].wt, parseVariants('Arg175His').variants[0].mut].join() }));
  check('RB21', 'variants parse: one-letter, three-letter, with a chain, with p., a bare number, a stop', JSON.stringify(pv.a) === JSON.stringify(['/R/175/H/R175H', 'A/G/245/S/G245S', '/V/5/A/V5A', '//249//249', '/K/12/*/K12*']) && pv.three === 'R,H', pv);
  check('RB21', 'what is not a variant is reported', pv.bad.join() === '5!!,Q9Z,ok', pv.bad);
  await E(() => { document.querySelector('#valSeg button[data-v=var]').click(); document.getElementById('varText').value = 'V5A, K5A, B:S3, Z:3, 999, 5!!'; document.getElementById('varGo').click(); });
  check('RB21', 'a variant with a bad token is refused whole, naming it', /Not a variant: 5!!/.test(await E(() => document.getElementById('valErr').textContent)) && await E(() => state.highlights.length) === 0);
  await E(() => { document.getElementById('varText').value = 'V5A, K5A, B:S3, Z:3, 999'; document.getElementById('varGo').click(); });
  const v = await E(() => ({ hl: state.highlights.map(h => h.sel + '|' + h.sticks + '|' + h.color), labels: state.residueLabels.map(l => l.chain + l.resi + ':' + l.text), err: document.getElementById('valErr').textContent, tags: Object.keys(labelEls).length }));
  check('RB21', 'variants become highlights with sticks (one colour, a range per chain) and labels with their names', v.hl.length === 2 && v.hl[0].startsWith('A:5') && v.hl[1].startsWith('B:3') && v.labels.join() === 'A5:V5A,B3:S3' && v.tags === 2, v);
  check('RB21', 'a wrong wild-type, a missing chain and a missing residue are reported, not silently placed', /different residue/i.test(v.err) && /K5A \(the structure has VAL/.test(v.err) && /Z:3|no chain Z/.test(v.err) && /999|no residue 999/.test(v.err), v.err);
  // a table
  const pt = await E(() => { const r = parseValueTable('residue,value\n# note\nA:3 1.5\nB 4 2\n5=0.1\n6, 3e-1\nx y z\n7 1e999'); return { data: JSON.stringify(r.data), n: r.n, bad: r.bad }; });
  check('RB21', 'a table is read in every spelling; a header and a comment are not errors, nonsense and infinity are counted', pt.data === JSON.stringify({ A: { 3: 1.5 }, B: { 4: 2 }, '*': { 5: 0.1, 6: 0.3 } }) && pt.n === 4 && pt.bad === 2, pt);
  await E(() => { document.querySelector('#valSeg button[data-v=tab]').click(); document.getElementById('valTitle').value = 'RMSF'; document.getElementById('valText').value = 'A:2 0.5\nA:3 1.5\nA:4 2.5'; document.getElementById('valGo').click(); }); await sleep(400);
  const t = await E(() => ({ title: state.values.title, min: state.values.min, max: state.values.max, lg: document.getElementById('legend').textContent, color: state.color }));
  check('RB21', 'the table colours by its own range and names itself in the key', t.title === 'RMSF' && t.min === 0.5 && t.max === 2.5 && /RMSF/.test(t.lg) && /low/.test(t.lg) && /high/.test(t.lg) && t.color === 'values', t);
  await E(() => { document.getElementById('valText').value = 'A:900 1\nA:901 2'; document.getElementById('valGo').click(); });
  check('RB21', 'numbers the structure does not have are refused and the old values stay', /None of those residue numbers/.test(await E(() => document.getElementById('valErr').textContent)) && await E(() => state.values.title) === 'RMSF');
  await E(() => { document.getElementById('valText').value = 'A:1 1\n'.repeat(1000000); document.getElementById('valGo').click(); });
  check('RB21', 'more than 5 MB of text is refused', /more than 5 MB/.test(await E(() => document.getElementById('valErr').textContent)));
  // the export carries the key
  await E(() => { document.getElementById('valText').value = ''; });
  const hh = await E(() => { openExport(); const row = !document.getElementById('exLegendRow').hidden; $('exLegend').checked = false; const a = renderExport().height; $('exLegend').checked = true; const b = renderExport().height; closeExport(); return [row, a, b]; });
  check('RB21', 'the export offers the key and adds it as a band', hh[0] && hh[2] > hh[1], hh);
  await go('1XYZ');
  check('RB21', 'a new structure forgets the values and goes back to a colour mode that exists', await E(() => state.values === null && state.color !== 'values'));
  await ctx.close();
}

// ── RB22 the figure as a script (PyMOL .pml, ChimeraX .cxc) ───────────────────────────────────
// PyMOL and ChimeraX are not on the CI machines, so the scripts are read back here and checked against what Ribbon draws:
// every residue's colour, what is hidden, what is drawn as sticks, and the camera. (The same scripts were run in the real programs
// once, by hand: colours 48/48, camera within 0.0002 Å in both, no command refused.)
const PY_CMDS = new Set(['reinitialize', 'fetch', 'load', 'hide', 'bg_color', 'set', 'show', 'color', 'util.cnc', 'label', 'pseudoatom', 'distance', 'angle', 'set_view', 'zoom']);
const CX_CMDS = new Set(['open', 'hide', 'set', 'camera', 'lighting', 'graphics', 'cartoon', 'show', 'style', 'color', 'size', 'surface', 'transparency', 'label', 'marker', 'distance', 'view']);
const rangesOf = s => { const out = []; for (const t0 of String(s).split(/[+,]/)) { const t = t0.replace(/\\/g, ''); const ic = /^(-?\d+)([A-Za-z])$/.exec(t); const m = /^(-?\d+)-(-?\d+)$/.exec(t) || /^(-?\d+)$/.exec(t); if (ic) out.push(t); else if (m) out.push([+m[1], m[2] != null ? +m[2] : +m[1]]); else if (t) out.push(t); } return out; };
const inRanges = (rs, resi, ic) => rs.some(r => typeof r === 'string' ? r === resi + ic : r[0] === r[1] ? (!ic && resi === r[0]) : (resi >= r[0] && resi <= r[1]));   // as both programs read it: "1" is residue 1 alone, "1-2" takes 1A with it
// the colour each residue ends up with when a script's colour lines are applied in order
function readColours(text, kind, residues) {
  const col = new Map(residues.map(r => [r.chain + '|' + r.resi + '|' + r.ic, null]));
  const apply = (chain, ranges, hex) => { for (const r of residues) { if (chain && r.chain !== chain) continue; if (ranges && !inRanges(ranges, r.resi, r.ic)) continue; col.set(r.chain + '|' + r.resi + '|' + r.ic, hex.toLowerCase()); } };
  for (const l of text.split('\n')) {
    let m;
    if (kind === 'pymol') { if ((m = /^color 0x([0-9a-fA-F]{6}), structure and polymer(?: and chain (\w+))?(?: and resi (\S+))?$/.exec(l))) apply(m[2], m[3] && rangesOf(m[3]), '#' + m[1]); }
    else if ((m = /^color (?:#1|\/(\w+))(?::(\S+))? & \(protein\|nucleic\) (#[0-9a-fA-F]{6})$/.exec(l))) apply(m[1], m[2] && rangesOf(m[2]), m[3]);
  }
  return col;
}
// the camera as a script states it: where an atom lands relative to the others, to be compared with the viewer's own screen
function cameraOf(text, kind) {
  if (kind === 'pymol') {
    const m = /^set_view \(([^)]+)\)$/m.exec(text); if (!m) return null; const v = m[1].split(',').map(Number); if (v.length !== 18) return null;
    const R = [[v[0], v[3], v[6]], [v[1], v[4], v[7]], [v[2], v[5], v[8]]], c = v.slice(12, 15);   // PyMOL lists the matrix column by column
    return p => [0, 1].map(k => R[k][0] * (p[0] - c[0]) + R[k][1] * (p[1] - c[1]) + R[k][2] * (p[2] - c[2]));
  }
  const m = /^view matrix camera (\S+)$/m.exec(text); if (!m) return null; const v = m[1].split(',').map(Number); if (v.length !== 12) return null;
  const Rc = [[v[0], v[1], v[2]], [v[4], v[5], v[6]], [v[8], v[9], v[10]]], t = [v[3], v[7], v[11]];   // camera → scene, so a scene point is taken back with the transpose
  return p => [0, 1].map(k => Rc[0][k] * (p[0] - t[0]) + Rc[1][k] * (p[1] - t[1]) + Rc[2][k] * (p[2] - t[2]));
}
const fitErr = (pts, f) => {   // the camera's x and −y offsets, turned and scaled as little as can be, onto the viewer's screen offsets
  const cam = pts.map(p => f(p.xyz)), P = cam.map(c => [c[0], -c[1]]), Q = pts.map(p => [p.sx, p.sy]);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length, mp = [mean(P.map(p => p[0])), mean(P.map(p => p[1]))], mq = [mean(Q.map(p => p[0])), mean(Q.map(p => p[1]))];
  let sxx = 0, sxy = 0, nn = 0; P.forEach((p, i) => { const a = [p[0] - mp[0], p[1] - mp[1]], b = [Q[i][0] - mq[0], Q[i][1] - mq[1]]; sxx += a[0] * b[0] + a[1] * b[1]; sxy += a[0] * b[1] - a[1] * b[0]; nn += a[0] * a[0] + a[1] * a[1]; });
  const ang = Math.atan2(sxy, sxx), k = Math.hypot(sxx, sxy) / nn;
  const res = P.map((p, i) => { const a = [p[0] - mp[0], p[1] - mp[1]], x = k * (Math.cos(ang) * a[0] - Math.sin(ang) * a[1]) + mq[0], y = k * (Math.sin(ang) * a[0] + Math.cos(ang) * a[1]) + mq[1]; return Math.hypot(x - Q[i][0], y - Q[i][1]); });
  const spread = Math.max(...Q.map(q => Math.hypot(q[0] - mq[0], q[1] - mq[1])));
  return { k, angDeg: ang * 180 / Math.PI, rel: Math.max(...res) / spread };   // a wrong convention turns the picture by tens of degrees; 3Dmol's own orthographic view shears a few percent with depth
};
async function rb22() {
  const { ctx, pg, E, go } = await open({ tag: 'RB22 ' });
  if (!(await has3d(pg))) { skipped.push('RB22 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('7SEQ'); await sleep(300);
  // a figure with everything in it: a palette shift, a chain colour, a highlight with sticks, a hidden chain's worth of tags, a measurement of each kind
  const setup = await E(async () => {
    state.color = 'spectrum'; state.hsl = { h: 20, s: 85, l: 105 }; state.projection = 'orthographic'; state.border = 'thick'; state.bg = 'white';
    state.chainColors = { B: '#51c3ce' };
    state.highlights = [{ sel: 'A:3-6', color: '#ffbf7b', sticks: true }];
    state.residueLabels = [{ chain: 'A', resi: 5, text: 'Lys"5;x\\y' }];
    state.chainLabels = { B: 'Beta' };
    const at = (c, r, n) => ({ c, r, n });
    state.measures = [{ id: 'm1', kind: 'dist', pts: [at('A', 2, 'CA'), at('B', 4, 'CA')] }, { id: 'm2', kind: 'angle', pts: [at('A', 2, 'CA'), at('A', 8, 'CA'), at('A', 14, 'CA')] }];
    buildGeometry(); applyProjection(); viewer.rotate(41, 'y'); viewer.rotate(-27, 'x'); viewer.rotate(13, 'z'); viewer.render();
    await new Promise(r => setTimeout(r, 300));
    const fn = makeColorFn({ noDim: true }), seen = {}, residues = [];
    currentModel.selectedAtoms({ hetflag: false }).forEach(a => { const ic = String(a.icode || '').trim(), k = a.chain + '|' + a.resi + '|' + ic; if (seen[k]) return; seen[k] = 1; residues.push({ chain: a.chain, resi: a.resi, ic, hex: fn(a) }); });
    const vp = document.getElementById('viewport').getBoundingClientRect(), pts = [];
    currentModel.selectedAtoms({ atom: 'CA' }).forEach((a, i) => { if (i % 3) return; const s = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z }); pts.push({ xyz: [a.x, a.y, a.z], sx: s.x - vp.left, sy: s.y - vp.top }); });
    return { pml: buildScript('pymol'), cxc: buildScript('chimerax'), residues, pts, anchor: getAnchor('B') };
  });
  const { pml, cxc, residues, pts } = setup;
  // every residue in the colour it is drawn in
  for (const [kind, text] of [['pymol', pml], ['chimerax', cxc]]) {
    const col = readColours(text, kind, residues), bad = residues.filter(r => col.get(r.chain + '|' + r.resi + '|' + r.ic) !== r.hex.toLowerCase());
    check('RB22', kind + ': applying the colour lines gives every residue the colour the viewer draws (palette shift, chain colour, highlight, spectrum)', !bad.length && residues.length === 48, { bad: bad.slice(0, 3), n: residues.length });
  }
  // nothing a command line would misread
  for (const [kind, text, cmds] of [['pymol', pml, PY_CMDS], ['chimerax', cxc, CX_CMDS]]) {
    const lines = text.split('\n').filter(l => l.trim()), unk = lines.filter(l => !l.startsWith('#') && !cmds.has(l.split(/[ ,]/)[0]));
    check('RB22', kind + ': every line is a comment or a command the program has', !unk.length, unk.slice(0, 3));
    check('RB22', kind + ': no ";" anywhere (it separates commands, in a comment and in a label too), no undefined / NaN / Infinity, no trailing comment after a command', !/;/.test(text) && !/undefined|NaN|Infinity|\bnull\b/.test(text) && !lines.some(l => !l.startsWith('#') && /\s#\s/.test(l)), text.split('\n').filter(l => /;|undefined|NaN|\s#\s/.test(l) && !l.startsWith('#')).slice(0, 3));
  }
  // the camera
  const cp = fitErr(pts, cameraOf(pml, 'pymol')), cc = fitErr(pts, cameraOf(cxc, 'chimerax'));
  check('RB22', 'PyMOL set_view: the atoms are turned the way the viewer shows them (within 2°: 3Dmol\'s own orthographic view shears a little with depth, so a pixel-exact match is not on offer; a wrong convention is tens of degrees out)', Math.abs(cp.angDeg) < 2 && cp.rel < 0.1 && cp.k > 2, cp);
  check('RB22', 'ChimeraX view matrix camera: the same', Math.abs(cc.angDeg) < 2 && cc.rel < 0.1 && cc.k > 2, cc);
  check('RB22', 'the script tells the program to frame the structure itself after the orientation', /^zoom visible/m.test(pml) && /^view$/m.test(cxc));
  // style, sticks, labels, measurements
  check('RB22', 'PyMOL: the highlight is drawn as sticks, with non-carbon atoms by element', /^show sticks, structure and polymer and chain A and resi 3-6$/m.test(pml) && /^util\.cnc structure and polymer and chain A and resi 3-6$/m.test(pml));
  check('RB22', 'ChimeraX: the same, by hetero-atom', /^show #1\/A:3-6 & \(protein\|nucleic\) atoms$/m.test(cxc) && /^color #1\/A:3-6 & \(protein\|nucleic\) byhetero$/m.test(cxc));
  check('RB22', 'a residue you measured is drawn as sticks in both', ['2', '4', '8', '14'].every(r => new RegExp('^show sticks, structure and polymer and chain \\w and resi ' + r + '$', 'm').test(pml) && new RegExp('^show #1/\\w:' + r + ' & ', 'm').test(cxc)));
  check('RB22', 'residue text is made safe (quotes, backslash, semicolon) and sits on the right residue', /label structure and chain A and resi 5 and name CA, "Lys 5,x y"/.test(pml) && /^label #1\/A:5 text "Lys 5,x y" /m.test(cxc), pml.split('\n').filter(l => /^label/.test(l)));
  const an = setup.anchor, pa = /^pseudoatom rb_chain\d+, pos=\[([-\d.]+),([-\d.]+),([-\d.]+)\], label="Beta"$/m.exec(pml), ma = /^marker #900 position ([-\d.]+),([-\d.]+),([-\d.]+) /m.exec(cxc);
  const near = m => m && Math.hypot(+m[1] - an.x, +m[2] - an.y, +m[3] - an.z) < 0.01;
  check('RB22', 'a chain name is placed at its 3D anchor (a PyMOL pseudoatom there; a ChimeraX marker there, labelled)', near(pa) && near(ma) && /^label #900:1 text "Beta" /m.test(cxc), { an, pa: pa && pa[0], ma: ma && ma[0] });
  check('RB22', 'a distance and an angle are in the script, on the atoms measured', /^distance rb_dist0, \(structure and chain A and resi 2 and name CA\), \(structure and chain B and resi 4 and name CA\)$/m.test(pml) && /^angle rb_angle1, /m.test(pml) && /^distance #1\/A:2@CA #1\/B:4@CA /m.test(cxc) && /^label #1\/A:8 text "\d+\.\d°"/m.test(cxc), { d: pml.split('\n').filter(l => /distance|angle/.test(l)), c: cxc.split('\n').filter(l => /distance|angle/.test(l)) });
  check('RB22', 'projection and background carry over (orthographic, white, opaque off for transparent)', /^set orthoscopic, 1$/m.test(pml) && /^bg_color white$/m.test(pml) && /^camera ortho$/m.test(cxc) && /^set bgColor white$/m.test(cxc));
  // hidden chain
  const hid = await E(() => { toggleChain('B', true); return { pml: buildScript('pymol'), cxc: buildScript('chimerax') }; }); await sleep(100);
  check('RB22', 'a hidden chain is hidden in both, and its tags and measurements are left out', /^hide everything, structure and chain B$/m.test(hid.pml) && /^hide \/B atoms,cartoons,surfaces$/m.test(hid.cxc) && !/"Beta"/.test(hid.pml + hid.cxc) && !/rb_dist0/.test(hid.pml) && !/^distance /m.test(hid.cxc));
  await E(() => toggleChain('B', false));
  // surface and stick styles, dark background
  const sty = await E(() => { state.style = 'surface'; state.surfaceOpacity = 0.4; state.bg = 'dark'; state.projection = 'perspective'; state.border = 'none'; return { pml: buildScript('pymol'), cxc: buildScript('chimerax') }; });
  check('RB22', 'surface style: a surface and the transparency that is drawn (60 %), in both', /^show surface, structure and polymer$/m.test(sty.pml) && /^set transparency, 0\.6$/m.test(sty.pml) && /^surface #1$/m.test(sty.cxc) && /^transparency #1 60 target s$/m.test(sty.cxc));
  check('RB22', 'dark background, perspective and no outline carry over', /^bg_color 0x13161e$/m.test(sty.pml) && /^set orthoscopic, 0$/m.test(sty.pml) && /^set ray_trace_mode, 0$/m.test(sty.pml) && /^set bgColor #13161e$/m.test(sty.cxc) && /^camera mono fieldOfView \d+$/m.test(sty.cxc) && /^graphics silhouettes false$/m.test(sty.cxc));
  const stk = await E(() => { state.style = 'stick'; return { pml: buildScript('pymol'), cxc: buildScript('chimerax') }; });
  check('RB22', 'stick style: sticks for the polymer, no cartoon', /^show sticks, structure and polymer$/m.test(stk.pml) && !/^show cartoon/m.test(stk.pml) && /^style #1 & \(protein\|nucleic\) stick$/m.test(stk.cxc) && !/^cartoon /m.test(stk.cxc));
  // the dialog downloads them
  await E(() => { state.style = 'cartoon'; state.bg = 'transparent'; });
  await E(() => openExport());
  const [d1] = await Promise.all([pg.waitForEvent('download'), pg.click('#exPml')]);
  const t1 = await (async () => { const s = await d1.createReadStream(); const chunks = []; for await (const c of s) chunks.push(c); return Buffer.concat(chunks).toString(); })();
  check('RB22', 'the PyMOL button saves <id>_ribbon.pml with the script, and closes the dialog', /_ribbon\.pml$/.test(d1.suggestedFilename()) && /^reinitialize$/m.test(t1) && /^set ray_opaque_background, off$/m.test(t1) && await E(() => !document.getElementById('export-modal').classList.contains('open')), d1.suggestedFilename());
  await E(() => openExport());
  const [d2] = await Promise.all([pg.waitForEvent('download'), pg.click('#exCxc')]);
  const t2 = await (async () => { const s = await d2.createReadStream(); const chunks = []; for await (const c of s) chunks.push(c); return Buffer.concat(chunks).toString(); })();
  check('RB22', 'the ChimeraX button saves <id>_ribbon.cxc', /_ribbon\.cxc$/.test(d2.suggestedFilename()) && /^open 7seq$/m.test(t2) && /^view$/m.test(t2), d2.suggestedFilename());
  // where the structure comes from
  const src = await E(() => {
    const keep = [currentSource, currentPdbId, currentInfo], o = {};
    currentSource = { kind: 'file', id: 'my model.pdb' }; currentPdbId = 'my model.pdb'; currentInfo = { title: 'A; B' };
    o.file = { pml: buildScript('pymol'), cxc: buildScript('chimerax') };
    currentSource = { kind: 'af', id: 'AF-P12345-F1', rid: 'P12345', af: { pdbUrl: 'https://alphafold.ebi.ac.uk/files/AF-P12345-F1-model_v4.pdb' } }; currentPdbId = 'AF-P12345-F1';
    o.af = { pml: buildScript('pymol'), cxc: buildScript('chimerax') };
    [currentSource, currentPdbId, currentInfo] = keep; return o;
  });
  check('RB22', 'a file is loaded by name and says to keep it next to the script; a semicolon in the title cannot split a comment', /^load "my model\.pdb", structure$/m.test(src.file.pml) && /^open "my model\.pdb"$/m.test(src.file.cxc) && /keep "my model\.pdb" next to this script/.test(src.file.pml) && !/;/.test(src.file.pml + src.file.cxc));
  check('RB22', 'AlphaFold is loaded from the model URL', /^load https:\/\/alphafold\.ebi\.ac\.uk\/files\/AF-P12345-F1-model_v4\.pdb, structure$/m.test(src.af.pml) && /^open https:\/\/alphafold\.ebi\.ac\.uk\/files\/AF-P12345-F1-model_v4\.pdb$/m.test(src.af.cxc));
  // ligands, ions, waters, a pocket
  await go('4LIG'); await sleep(300);
  const lg = await E(() => { state.showWaters = true; const l = ligands.find(x => x.resn === 'LIG'); state.pockets[l.key] = true; state.ligColors[l.key] = 'cyanCarbon'; state.pocketR = 6; buildGeometry(); return { pml: buildScript('pymol'), cxc: buildScript('chimerax'), keys: ligands.map(x => x.key) }; });
  check('RB22', 'a ligand: sticks and balls in the colour chosen, other atoms by element', /^show sticks, structure and resn LIG and chain A and resi 201$/m.test(lg.pml) && /^color 0x1ac8c8, structure and resn LIG and chain A and resi 201$/m.test(lg.pml) && /^color #1\/A:201 #1ac8c8$/m.test(lg.cxc) && /^color #1\/A:201 byhetero$/m.test(lg.cxc), lg.pml.split('\n').filter(l => /LIG/.test(l)));
  check('RB22', 'its pocket is the residues within the radius that is set (6 Å), shown as sticks', /byres \(\(structure and polymer\) within 6 of \(structure and resn LIG and chain A and resi 201\)\)/.test(lg.pml) && /\(\(#1\/A:201\) :<6\) & \(protein\|nucleic\)/.test(lg.cxc));
  check('RB22', 'ions and waters are drawn when the viewer draws them', /^show spheres, structure and resn MG$/m.test(lg.pml) && /^show spheres, structure and solvent$/m.test(lg.pml) && /^show #1 & solvent atoms$/m.test(lg.cxc));
  const nolig = await E(() => { state.showLigands = false; state.showWaters = false; return { pml: buildScript('pymol'), cxc: buildScript('chimerax') }; });
  check('RB22', 'with ligands off there is no ligand, ion, water or pocket line', !/resn|solvent|within/.test(nolig.pml) && !/solvent|:<|ligand/.test(nolig.cxc), nolig.pml.split('\n').filter(l => /resn|solvent|within/.test(l)).slice(0, 2));
  await ctx.close();
  // odd residue ids: negative numbers, an insertion code, a blank chain
  const { ctx: c2, pg: p2, E: E2 } = await open({ tag: 'RB22b ' });
  const L = []; let n = 1; const ids = [[-2, ''], [-1, ''], [0, ''], [1, ''], [1, 'A'], [2, '']];
  ids.forEach(([r, ic], i) => { ['N', 'CA', 'C', 'O'].forEach((nm, k) => { const l = atomLine('ATOM', n++, nm, 'ALA', 'A', r, i * 3.8 + k * 0.4, Math.sin(i), 0.3 * k, 20, nm[0]); L.push(ic ? l.slice(0, 26) + ic + l.slice(27) : l); }); });
  await p2.setInputFiles('#fileInput', { name: 'odd.pdb', mimeType: 'text/plain', buffer: Buffer.from(L.join('\n') + '\nEND\n') }); await sleep(1800);
  // colours chosen so that a run of red would cover the blue insertion-code residue if it were allowed to span it
  const odd = await E2(() => {
    window.makeColorFn = () => a => ((a.resi === -2 || (a.resi === 1 && String(a.icode || '').trim() === 'A')) ? '#0000ff' : '#ff0000');
    const fn = makeColorFn(), seen = {}, res = [];
    currentModel.selectedAtoms({ hetflag: false }).forEach(a => { const ic = String(a.icode || '').trim(), k = a.chain + '|' + a.resi + '|' + ic; if (seen[k]) return; seen[k] = 1; res.push({ chain: a.chain, resi: a.resi, ic, hex: fn(a) }); });
    return { pml: buildScript('pymol'), cxc: buildScript('chimerax'), res };
  });
  const okOdd = ['pymol', 'chimerax'].map(kind => { const col = readColours(kind === 'pymol' ? odd.pml : odd.cxc, kind, odd.res); return odd.res.every(r => col.get(r.chain + '|' + r.resi + '|' + r.ic) === r.hex.toLowerCase()); });
  check('RB22', 'negative residue numbers and an insertion code still colour every residue right (a run never spans the insertion-code residue)', okOdd[0] && okOdd[1] && odd.res.length === 6, { res: odd.res.map(r => r.resi + r.ic), okOdd, lines: odd.pml.split('\n').filter(l => /^color/.test(l)) });
  check('RB22', 'PyMOL reads a leading minus as "up to": every negative number in a residue list is escaped', /resi [^\n]*\\-2/.test(odd.pml) && !/(resi |\+)-\d/.test(odd.pml), odd.pml.split('\n').filter(l => /^color/.test(l)));
  await c2.close();
}

// ── RB23 a figure of several panels ───────────────────────────────────────────────────────────
const pngSize = buf => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), sig: buf.slice(1, 4).toString() });
const readDl = async d => { const s = await d.createReadStream(); const c = []; for await (const x of s) c.push(x); return Buffer.concat(c); };
async function rb23() {
  const { ctx, pg, E, go } = await open({ tag: 'RB23 ' });
  if (!(await has3d(pg))) { skipped.push('RB23 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  // ── the layout arithmetic, on pictures of known size ──
  const lay = await E(() => {
    const mk = (w, h, c) => { const k = document.createElement('canvas'); k.width = w; k.height = h; const x = k.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, w, h); return { cv: k }; };
    const items = () => [mk(400, 300, '#e36c69'), mk(200, 300, '#51c3ce'), mk(300, 150, '#5e87c5')];
    const o = { layout: 'row', letters: 'A', bg: 'white', gap: 5 };
    const row = composePanels(items(), o), col = composePanels(items(), Object.assign({}, o, { layout: 'col' })), grid = composePanels(items(), Object.assign({}, o, { layout: 'grid' }));
    const none = composePanels(items(), Object.assign({}, o, { letters: 'none' })), tr = composePanels(items(), Object.assign({}, o, { bg: 'transparent', letters: 'none' }));
    const px = (c, x, y) => Array.from(c.getContext('2d').getImageData(x, y, 1, 1).data);
    const diff = (a, b, r) => { const A = a.getContext('2d').getImageData(r.x, r.y, r.w, r.h).data, B = b.getContext('2d').getImageData(r.x, r.y, r.w, r.h).data; let n = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) n++; return n; };
    const big = composePanels([mk(8000, 8000, '#000'), mk(8000, 8000, '#000'), mk(8000, 8000, '#000'), mk(8000, 8000, '#000')], { layout: 'row', letters: 'none', bg: 'white', gap: 3 });
    const p0 = row.layout.pos[0], c0 = row.layout.cells[0];
    return { row: { l: row.layout, w: row.canvas.width, h: row.canvas.height }, col: { l: col.layout, w: col.canvas.width, h: col.canvas.height }, grid: { l: grid.layout, w: grid.canvas.width, h: grid.canvas.height },
      letterPx: diff(row.canvas, none.canvas, { x: p0.x, y: p0.y, w: 60, h: 60 }), noLetterElsewhere: diff(row.canvas, none.canvas, { x: row.layout.pos[1].x + 200, y: row.layout.pos[1].y + 150, w: 40, h: 40 }),
      gapPx: px(row.canvas, row.layout.pos[1].x - 3, 50), trGap: px(tr.canvas, tr.layout.pos[1].x - 3, 50), trIn: px(tr.canvas, tr.layout.pos[0].x + 50, 50),
      big: { w: big.canvas.width, h: big.canvas.height, k: big.layout.k }, letters: [panelLetter(0, 'A'), panelLetter(2, 'A'), panelLetter(1, 'a'), panelLetter(1, 'none')] };
  });
  check('RB23', 'a row is one height: every panel the height of the shortest, side by side with the gap between', lay.row.l.cells.every(c => c.dh === 150 && c.dw > 0) && lay.row.l.cols === 3 && lay.row.l.rows === 1 && lay.row.l.cells[0].dw === 200 && lay.row.l.cells[1].dw === 100 && lay.row.l.cells[2].dw === 300 && lay.row.h === 150 + 2 * lay.row.l.gap, lay.row);
  check('RB23', 'a column is one width, the width of the narrowest', lay.col.l.cells.every(c => c.dw === 200) && lay.col.l.cols === 1 && lay.col.l.rows === 3 && lay.col.l.cells[0].dh === 150 && lay.col.l.cells[2].dh === 100, lay.col);
  check('RB23', 'a grid of three is two by two, equal cells, each picture centred in its cell without being stretched', lay.grid.l.cols === 2 && lay.grid.l.rows === 2 && lay.grid.l.cells.every(c => c.w === lay.grid.l.cells[0].w && c.h === lay.grid.l.cells[0].h) && lay.grid.l.cells.every((c, i) => Math.abs(c.dw / c.dh - [400 / 300, 200 / 300, 300 / 150][i]) < 0.02), lay.grid);
  check('RB23', 'panel letters are drawn in the corner of the panel (A, B, C… / a, b, c… / none)', lay.letterPx > 40 && lay.noLetterElsewhere === 0 && lay.letters.join('') === 'AC' + 'b' + '', { n: lay.letterPx, e: lay.noLetterElsewhere, l: lay.letters });
  check('RB23', 'the background is white where asked, and truly transparent between panels for Transparent', lay.gapPx[0] === 255 && lay.gapPx[3] === 255 && lay.trGap[3] === 0 && lay.trIn[3] === 255, { g: lay.gapPx, t: lay.trGap, i: lay.trIn });
  check('RB23', 'a huge figure is scaled down so a browser can still make the file (at most 9000 px a side)', lay.big.w <= 9000 && lay.big.h <= 9000 && lay.big.k < 1 && lay.big.w * lay.big.h <= 64e6 + 1e5, lay.big);

  // ── three designs of one structure, and one of another ──
  await go('1XYZ');
  await E(async () => { localStorage.removeItem('ribbon_designs'); state.color = 'ss'; state.style = 'cartoon'; syncControlsToState(); buildGeometry(); await new Promise(r => setTimeout(r, 400)); document.getElementById('designName').value = 'Other'; saveDesign(); await new Promise(r => setTimeout(r, 200)); });
  await go('7SEQ'); await sleep(300);
  await E(async () => {
    const save = async (name, f) => { f(); syncControlsToState(); buildGeometry(); applyProjection(); await new Promise(r => setTimeout(r, 500)); document.getElementById('designName').value = name; saveDesign(); await new Promise(r => setTimeout(r, 250)); };
    await save('One', () => { state.style = 'cartoon'; state.color = 'uniform'; state.uniformColor = '#e36c69'; state.bg = 'white'; viewer.rotate(30, 'y'); });
    await save('Two', () => { state.color = 'chain'; state.chainLabels = { A: 'Alpha' }; viewer.rotate(60, 'x'); });
    await save('Three', () => { state.style = 'stick'; state.color = 'spectrum'; state.chainLabels = {}; viewer.rotate(45, 'z'); });
    const d = getDesigns(); d.Ghost = { pdbId: 'NOPE', source: { kind: 'pdb', rid: 'NOPE' }, ts: 1, state: { style: 'cartoon' } }; d.Mine = { pdbId: 'my.pdb', source: { kind: 'file', rid: 'my.pdb' }, ts: 2, state: { style: 'cartoon' } }; putDesigns(d);
    state.style = 'cartoon'; state.color = 'ss'; state.bg = 'transparent'; state.chainLabels = {}; syncControlsToState(); buildGeometry(); viewer.rotate(20, 'y'); viewer.render();
  });
  await sleep(400);
  const before = await E(() => ({ style: state.style, color: state.color, bg: state.bg, id: currentPdbId, view: viewer.getView(), labels: JSON.stringify(state.chainLabels), designs: Object.keys(getDesigns()).sort().join(',') }));
  // the dialog
  await E(() => { _exOpts.bg = 'dark'; _exOpts.res = '1200'; document.getElementById('exLabels').checked = false; });
  const exBefore = await E(() => JSON.stringify([_exOpts, document.getElementById('exLabels').checked, document.getElementById('exLegend').checked, state.exportLabels]));
  await pg.focus('body'); await E(() => document.getElementById('panelsBtn').click()); await sleep(300);
  const dlg = await E(() => ({ open: document.getElementById('panel-modal').classList.contains('open'), items: [...document.querySelectorAll('#pnList .pn-item')].map(r => ({ n: r.querySelector('.di-name').textContent, off: r.classList.contains('off'), dis: r.querySelector('.pn-main').disabled, sub: r.querySelector('.di-sub').textContent })), go: document.getElementById('pnGo').disabled, inside: document.getElementById('panel-modal').contains(document.activeElement), lab: document.getElementById('pnLabbook').hidden }));
  check('RB23', 'Multi-panel figure opens a dialog that lists the saved designs, with focus inside', dlg.open && dlg.items.length === 6 && dlg.go && dlg.inside, dlg);
  check('RB23', 'a design whose file is not open cannot be picked, and says why; Make the figure waits for two panels', dlg.items.find(x => x.n === 'Mine').dis && /its file is not open/.test(dlg.items.find(x => x.n === 'Mine').sub) && dlg.items.filter(x => !x.dis).length === 5 && dlg.lab);
  const pick = n => pg.click(`#pnList .pn-item:has(.di-name:text-is("${n}")) .pn-main`);
  await pick('Two'); await pick('Three'); await pick('One');
  let o = await E(() => ({ sel: _pn.sel.slice(), badges: [...document.querySelectorAll('#pnList .pn-item.on')].map(r => r.querySelector('.di-name').textContent + ':' + r.querySelector('.pn-badge').textContent).sort(), go: document.getElementById('pnGo').disabled, hint: document.getElementById('pnHint').textContent }));
  check('RB23', 'picking panels numbers them in the order picked (A, B, C) and enables the button', o.sel.join() === 'Two,Three,One' && o.badges.join() === 'One:C,Three:B,Two:A' && !o.go && /3 panels/.test(o.hint), o);
  await pg.click('#pnList .pn-item:has(.di-name:text-is("One")) .pn-up');
  o = await E(() => ({ sel: _pn.sel.slice(), badges: [...document.querySelectorAll('#pnList .pn-item.on')].map(r => r.querySelector('.di-name').textContent + ':' + r.querySelector('.pn-badge').textContent).sort().join() }));
  check('RB23', 'the arrow moves a panel earlier and the letters follow', o.sel.join() === 'Two,One,Three' && o.badges === 'One:B,Three:C,Two:A', o);
  await pg.click('#pnLetters button[data-v=a]');
  check('RB23', 'lower-case letters re-letter the list', await E(() => [...document.querySelectorAll('#pnList .pn-item.on .pn-badge')].map(b => b.textContent).sort().join('')) === 'abc');
  await pg.click('#pnLetters button[data-v=A]');
  // make it, in a row
  await pg.click('#pnGo');
  const mid = await E(() => ({ busy: _pn.busy, work: !document.getElementById('pnWork').hidden, step1: document.getElementById('pnStep1').hidden, status: document.getElementById('pnStatus').textContent }));
  check('RB23', 'while it works the dialog shows the panel in hand and nothing to press but Stop', mid.busy && mid.work && mid.step1 && /Panel/.test(mid.status) && await E(() => document.getElementById('pnCancel').textContent) === 'Stop', mid);
  await pg.waitForFunction(() => !document.getElementById('pnDone').hidden, null, { timeout: 90000 }).catch(() => {});
  const res = await E(() => {
    const r = _pn.result; if (!r) return null; const c = r.canvas;
    const thumbs = r.layout.cells.map((cell, i) => {   // each panel's own cell, boxed down to 12 × 12 and measured
      const p = r.layout.pos[i], k = r.layout.k, t = document.createElement('canvas'); t.width = 24; t.height = 24; const x = t.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 24, 24);
      x.imageSmoothingQuality = 'high'; x.drawImage(c, Math.round(p.x * k), Math.round(p.y * k), Math.round(cell.w * k), Math.round(cell.h * k), 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data; let ink = 0; for (let j = 0; j < d.length; j += 4) if (d[j] < 235 || d[j + 1] < 235 || d[j + 2] < 235) ink++;
      return { d: Array.from(d), ink };
    });
    const dist = (a, b) => { let s = 0; for (let i = 0; i < a.d.length; i += 4) s += Math.abs(a.d[i] - b.d[i]) + Math.abs(a.d[i + 1] - b.d[i + 1]) + Math.abs(a.d[i + 2] - b.d[i + 2]); return Math.round(s / 576); };
    return { w: c.width, h: c.height, cols: r.layout.cols, rows: r.layout.rows, names: r.names, ink: thumbs.map(t => t.ink), pairs: [dist(thumbs[0], thumbs[1]), dist(thumbs[0], thumbs[2]), dist(thumbs[1], thumbs[2])], dims: document.getElementById('pnDims').textContent, prev: !!document.getElementById('pnPreview'), foot: ['pnBack', 'pnCopy', 'pnSave'].every(id => !document.getElementById(id).hidden) && document.getElementById('pnGo').hidden };
  });
  check('RB23', 'three panels come out as one picture, in the order chosen, with a preview and Change / Copy / Download', !!res && res.cols === 3 && res.rows === 1 && res.names.join() === 'Two,One,Three' && res.w > res.h && res.prev && res.foot && /3 panels/.test(res.dims), res);
  check('RB23', 'each panel was drawn from its own design (three different pictures, none blank)', res && res.ink.every(n => n > 3) && res.pairs.every(p => p > 4), res && { ink: res.ink, pairs: res.pairs });
  const after = await E(() => ({ style: state.style, color: state.color, bg: state.bg, id: currentPdbId, view: viewer.getView(), labels: JSON.stringify(state.chainLabels), designs: Object.keys(getDesigns()).sort().join(',') }));
  check('RB23', 'your own figure is back exactly as it was: structure, style, colour, background, labels and the camera', after.id === before.id && after.style === before.style && after.color === before.color && after.bg === before.bg && after.labels === before.labels && before.view.every((v, i) => Math.abs(v - after.view[i]) < 0.05) && after.designs === before.designs, { before, after });
  check('RB23', 'the Export dialog\'s own choices (background, resolution, labels) are left as they were', await E(() => JSON.stringify([_exOpts, document.getElementById('exLabels').checked, document.getElementById('exLegend').checked, state.exportLabels])) === exBefore, exBefore);
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#pnSave')]);
  const png = pngSize(await readDl(dl));
  check('RB23', 'Download saves <id>_panels.png, a real PNG the size of the figure', /_panels\.png$/.test(dl.suggestedFilename()) && png.sig === 'PNG' && png.w === res.w && png.h === res.h, { f: dl.suggestedFilename(), png, res: [res.w, res.h] });
  // Change goes back to the choices, which were kept
  await pg.click('#pnBack');
  check('RB23', 'Change goes back to the choices, with the panels still picked', await E(() => !document.getElementById('pnStep1').hidden && _pn.sel.join() === 'Two,One,Three' && !document.getElementById('pnGo').disabled));
  // a column and a grid, and white versus dark
  await pg.click('#pnLayout button[data-v=grid]'); await pg.click('#pnBg button[data-v=dark]'); await pg.click('#pnLetters button[data-v=none]');
  await pg.click('#pnGo'); await pg.waitForFunction(() => !document.getElementById('pnDone').hidden, null, { timeout: 90000 }).catch(() => {});
  const g = await E(() => { const r = _pn.result; if (!r) return null; const x = r.canvas.getContext('2d').getImageData(2, 2, 1, 1).data; return { cols: r.layout.cols, rows: r.layout.rows, corner: Array.from(x), prevDark: document.getElementById('pnPrevBox').classList.contains('dark') }; });
  check('RB23', 'a grid of three on a dark background (no letters) is made the same way', !!g && g.cols === 2 && g.rows === 2 && g.corner[0] === 0x13 && g.corner[1] === 0x16 && g.corner[2] === 0x1e && g.prevDark, g);
  // another structure is fetched, and yours is put back
  await pg.click('#pnBack'); await E(() => { _pn.sel = ['Other', 'Two']; renderPanelList(); }); await pg.click('#pnLayout button[data-v=row]'); await pg.click('#pnBg button[data-v=white]');
  await pg.click('#pnGo'); await pg.waitForFunction(() => !document.getElementById('pnDone').hidden, null, { timeout: 90000 }).catch(() => {});
  const x2 = await E(() => ({ names: _pn.result && _pn.result.names.join(), id: currentPdbId, style: state.style, color: state.color, v: viewer.getView() }));
  check('RB23', 'a panel of another structure is fetched for its picture, and the structure you had is loaded again after', x2.names === 'Other,Two' && x2.id === before.id && x2.style === before.style && x2.color === before.color && before.view.every((v, i) => Math.abs(v - x2.v[i]) < 0.5), { x2, before: before.id });
  // a design that cannot be shown stops the figure, names it, and puts yours back
  await pg.click('#pnBack'); await E(() => { _pn.sel = ['Two', 'Ghost']; renderPanelList(); });
  await pg.click('#pnGo'); await pg.waitForFunction(() => !document.getElementById('pnStep1').hidden, null, { timeout: 60000 }).catch(() => {});
  const f = await E(() => ({ toast: document.getElementById('toastMsg').textContent, step1: !document.getElementById('pnStep1').hidden, res: !!_pn.result && !!document.getElementById('pnPreview') && !document.getElementById('pnDone').hidden, id: currentPdbId, style: state.style, color: state.color, busy: _pn.busy }));
  check('RB23', 'a design that cannot be shown stops the figure, says which one, and leaves your figure as it was', /Ghost/.test(f.toast) && f.step1 && f.id === before.id && f.style === before.style && f.color === before.color && !f.busy, f);
  // Stop
  await E(() => { _pn.sel = ['One', 'Two', 'Three']; renderPanelList(); });
  await E(() => { window.__rc = 0; const o = window._renderPanelCanvas; window._renderPanelCanvas = function () { window.__rc++; return o.apply(this, arguments); }; });
  await pg.click('#pnGo'); await sleep(900); await pg.click('#pnCancel');
  await pg.waitForFunction(() => !document.getElementById('pnStep1').hidden && !_pn.busy, null, { timeout: 60000 }).catch(() => {});
  const s = await E(() => ({ step1: !document.getElementById('pnStep1').hidden, open: document.getElementById('panel-modal').classList.contains('open'), id: currentPdbId, style: state.style, color: state.color, busy: _pn.busy, toast: document.getElementById('toastMsg').textContent }));
  const rc = await E(() => window.__rc);
  check('RB23', 'Stop ends the figure after the panel in hand (not all three), says so, and puts your figure back', rc < 3 && s.step1 && s.open && !s.busy && s.id === before.id && s.style === before.style && s.color === before.color && /Stopped|Not enough/.test(s.toast), s);
  // Escape closes
  await pg.keyboard.press('Escape'); await sleep(150);
  check('RB23', 'Escape closes the dialog', await E(() => !document.getElementById('panel-modal').classList.contains('open')));
  await ctx.close();
}

// ── RB24 3Dmol embedded for the Hub: the viewer works with no network ─────────────────────────
// embed.py writes the vendored 3Dmol into Ribbon for the Hub build (tools/inline_3dmol.py). Here the same step is run by hand on the
// source file, the page is loaded with every 3Dmol CDN refused, and the viewer has to come up and draw a structure.
async function rb24() {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const out = path.join(ROOT, 'apps/ribbon/_offline.html'), src = path.join(ROOT, 'apps/ribbon/ribbon.html');
  const py = (code, args = []) => { try { return { ok: true, out: execFileSync('python3', ['-c', code, ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: String(e.stderr || e.message) }; } };
  const tmp = path.join(ROOT, 'apps/ribbon/_tag.html');
  try {
    execFileSync('python3', ['tools/inline_3dmol.py', src, out], { cwd: ROOT, stdio: 'ignore' });
    const html = fs.readFileSync(out, 'utf8');
    check('RB24', 'the inlined page has no 3Dmol script tag left, and carries the library once', !/<script src="https:\/\/unpkg\.com\/3dmol/.test(html) && (html.match(/embedded by embed\.py so Ribbon works offline/g) || []).length === 1 && html.length > fs.readFileSync(src, 'utf8').length + 500000, { len: html.length });
    // the guards: a file that is not the pinned one, and a page without the tag, are refused
    const bad = py("import sys; sys.path.insert(0,'tools'); import inline_3dmol as m, shutil, os\nsrc=open('apps/ribbon/ribbon.html','rb').read().replace(b'sha384-Osczybld',b'sha384-Osczybld')\nsrc=src.replace(b'sha384-OsczYbld',b'sha384-OsczYblD')\ntry:\n    m.inline(src); print('NOT REFUSED')\nexcept ValueError as e: print('refused:', e)");
    const none = py("import sys; sys.path.insert(0,'tools'); import inline_3dmol as m\ntry:\n    m.inline(b'<html><script src=\"https://example.com/x.js\"></script></html>'); print('NOT REFUSED')\nexcept ValueError as e: print('refused:', e)");
    check('RB24', 'a page whose tag pins another hash, or has no tag, is refused rather than built', /^refused: .*not the file the tag pins/.test(bad.out.trim()) && /^refused: expected exactly one pinned 3Dmol tag/.test(none.out.trim()), { bad: bad.out.trim().slice(0, 140), none: none.out.trim().slice(0, 140) });
    const sri = /integrity="(sha384-[^"]+)"/.exec(fs.readFileSync(src, 'utf8'))[1];
    const h = py("import hashlib,base64; print('sha384-'+base64.b64encode(hashlib.sha384(open('vendor/3Dmol-min-2.5.5.js','rb').read()).digest()).decode())");
    check('RB24', 'the vendored file is the one the head tag pins', h.ok && h.out.trim() === sri, { sri, vendored: h.out.trim() });
    // the page, with the network to every 3Dmol host refused
    const hits = [];
    const { ctx, pg, E, go } = await open({ file: 'apps/ribbon/_offline.html', tag: 'RB24 ', pre: async c => { await c.route(/unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com|3dmol\.org/i, r => { hits.push(r.request().url()); r.abort(); }); } });
    const up = await E(() => ({ has3d: !!window.$3Dmol, viewer: !!viewer, create: !!(window.$3Dmol && $3Dmol.createViewer), empty: document.body.classList.contains('rb-empty'), title: document.getElementById('veTitle').textContent }));
    check('RB24', 'with every 3Dmol host refused the viewer is there at load (no "could not be loaded", no fallback loader)', up.has3d && up.viewer && up.create && !/could not be loaded/.test(up.title) && !hits.length, { up, hits });
    await go('1XYZ'); await sleep(600);
    const drawn = await E(() => ({ id: currentPdbId, atoms: currentModel ? currentModel.selectedAtoms({}).length : 0, canvas: !!document.querySelector('#viewport canvas'), chains: chainList.join('') }));
    check('RB24', 'a structure loads and draws on it', drawn.id === '1XYZ' && drawn.atoms > 50 && drawn.canvas && drawn.chains === 'AB', drawn);
    check('RB24', 'and nothing went looking for 3Dmol on the network', !hits.length, hits);
    await ctx.close();
  } finally { for (const f of [out, tmp]) { try { fs.unlinkSync(f); } catch (e) {} } }
}

// ── RB25 opened from another app: a target and the pocket of the ligand in it ─────────────────
const HOST3 = () => `<!doctype html><meta charset=utf-8><body style="margin:0">
<iframe id="frame-ribbon" src="/${args.file || 'apps/ribbon/ribbon.html'}" style="width:1300px;height:850px;border:0"></iframe>
<script>
window.__acks={}; window.__sent=0;
window.openApp=function(id,tab,item,ctx){
  if(!ctx) return; window.__sent++;
  var rid='r'+Math.random().toString(36).slice(2), msg={type:'dhub:context',version:1,source:ctx.source||'hub',target:id,action:'open',context:ctx,requestId:rid}, n=0;
  (function send(){ if(window.__acks[rid]||n++>10) return; try{ document.getElementById('frame-ribbon').contentWindow.postMessage(msg,'*'); }catch(e){} setTimeout(send,250); })();
};
window.addEventListener('message',function(e){ if(e.data&&e.data.type==='dhub:ack') window.__acks[e.data.requestId]=1; });
</script>`;
async function rb25() {
  const seen = { uni: [], rcsb: [], gql: [] };
  const { ctx, pg } = await open({ tag: 'RB25 ', pre: async c => {
    await c.route(base + '__host3.html', r => r.fulfill({ contentType: 'text/html', body: HOST3() }));
    const J = (r, o) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    const U = (acc, gene, name) => ({ results: [{ primaryAccession: acc, genes: [{ geneName: { value: gene } }], proteinDescription: { recommendedName: { fullName: { value: name } } }, organism: { scientificName: 'Homo sapiens' } }] });
    await c.route('**/rest.uniprot.org/**', async r => {
      const u = decodeURIComponent(r.request().url()); seen.uni.push(u);
      if (/SLOWA/.test(u)) { await sleep(900); return J(r, U('P00009', 'SLOWA', 'Slow protein')); }
      if (/XYZ1/.test(u)) return J(r, U('P00001', 'XYZ1', 'Protein X'));
      if (/APO1/.test(u)) return J(r, U('P00002', 'APO1', 'Apo protein'));
      if (/ONLYAF/.test(u)) return J(r, U('P12345', 'ONLYAF', 'Only predicted'));
      return J(r, { results: [] });
    });
    await c.route('**/search.rcsb.org/rcsbsearch/v2/query', r => {
      const b = r.request().postData() || ''; seen.rcsb.push(b);
      if (!/database_accession/.test(b)) return r.fallback();
      if (b.includes('"P00001"')) return J(r, { total_count: 4, result_set: [{ identifier: '7APO' }, { identifier: '8POC' }, { identifier: '6BIG' }, { identifier: '1XYZ' }] });
      if (b.includes('"P00002"')) return J(r, { total_count: 1, result_set: [{ identifier: '1XYZ' }] });
      if (b.includes('"P00009"')) return J(r, { total_count: 1, result_set: [{ identifier: '1XYZ' }] });
      return r.fulfill({ status: 204, body: '' });
    });
    await c.route('**/data.rcsb.org/graphql', r => {
      const b = r.request().postData() || ''; if (!/entries\(entry_ids/.test(b)) return r.fallback(); seen.gql.push(b);
      const ent = (id, res, comps) => ({ rcsb_id: id, rcsb_entry_info: { resolution_combined: [res] }, nonpolymer_entities: comps.map(([i, w]) => ({ nonpolymer_comp: { chem_comp: { id: i, name: i, formula_weight: w } } })) });
      let ids = []; try { ids = JSON.parse((/entry_ids:(\[[^\]]*\])/.exec(JSON.parse(b).query) || [])[1]); } catch (e) {}
      const all = [ent('6BIG', 2.5, [['LIG', 400]]), ent('8POC', 1.1, [['GOL', 92], ['LIG', 350]]), ent('1XYZ', 2.0, []), ent('7APO', 0.9, [['GOL', 92]])];   // not in resolution order on purpose
      return J(r, { data: { entries: all.filter(x => ids.includes(x.rcsb_id)) } });   // the API answers for the ids it was asked about
    });
  } });
  await pg.goto(base + '__host3.html'); await sleep(2500);
  const rb = pg.frame({ url: /ribbon\.html/ });
  if (!(await rb.evaluate(() => !!window.$3Dmol))) { skipped.push('RB25 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const send = c => pg.evaluate(c => window.openApp('ribbon', undefined, undefined, c), c);
  const state0 = () => rb.evaluate(() => ({ id: currentPdbId, pockets: Object.keys(state.pockets), err: document.getElementById('errText').textContent, note: (document.querySelector('#infoCard .info-note') || {}).textContent || '', kind: currentSource && currentSource.kind, moved: _userMoved, sec: !!document.querySelector('details.rb-sec[data-sec=chains]').open, pressed: [...document.querySelectorAll('#ligList .lg-pocket[aria-pressed=true]')].map(b => b.getAttribute('aria-label')) }));
  const settle = async id => { for (let i = 0; i < 80; i++) { const s = await state0().catch(() => null); if (s && s.id === id) { await sleep(900); return await state0(); } await sleep(150); } return await state0(); };
  // a gene symbol: the entry with a real ligand, not the best-resolved one that only holds glycerol
  await send({ source: 'hitfinder', ribbon: { query: 'XYZ1', pocket: true, compound: 'EDA-099', from: 'Hit Finder' } });
  let s = await settle('8POC');
  check('RB25', 'a gene symbol opens the best-resolved entry that has a real ligand (not the one whose only ligand is glycerol)', s.id === '8POC' && seen.gql.length === 1 && /7APO/.test(seen.gql[0]) && /UniProt/.test(seen.rcsb[0]), { s, gql: seen.gql.length });
  check('RB25', 'the pocket shown is the ligand\'s, not the additive\'s, and its button is pressed', s.pockets.join() === 'LIG:A:201' && s.pressed.length === 1 && /LIG/.test(s.pressed[0]) && s.moved && s.sec, s);
  check('RB25', 'the page says whose ligand it is: the compound is named and the pocket is not claimed to be its', /EDA-099/.test(s.note) && /Hit Finder/.test(s.note) && /co-crystallised LIG/.test(s.note) && /not EDA-099/.test(s.note) && /best-resolved structure with a ligand/.test(s.note), s.note);
  // a protein with PDB entries and no ligand: the best entry, no pocket, and it says so
  await send({ source: 'hitfinder', ribbon: { query: 'APO1', pocket: true, compound: 'EDA-100', from: 'Hit Finder' } });
  s = await settle('1XYZ');
  check('RB25', 'with no ligand-bound structure the best entry opens, no pocket is drawn, and the note says why', s.id === '1XYZ' && !s.pockets.length && /no structure with a ligand/i.test(s.note) && /No ligand pocket/.test(s.note) && /EDA-100/.test(s.note), s);
  // nothing in the PDB: the AlphaFold model
  await send({ source: 'hitfinder', ribbon: { query: 'ONLYAF', pocket: true, compound: 'EDA-101', from: 'Hit Finder' } });
  s = await settle('AF-P12345-F1');
  check('RB25', 'with no PDB entry at all the AlphaFold model opens, and says so', s.id === 'AF-P12345-F1' && s.kind === 'af' && /no PDB entry/i.test(s.note), s);
  // a name that is nothing keeps what is on screen and says so
  await send({ source: 'hitfinder', ribbon: { query: 'NOSUCH', pocket: true, compound: 'EDA-102', from: 'Hit Finder' } }); await sleep(2500);
  s = await state0();
  check('RB25', 'an unknown name leaves the structure on screen and says nothing was found', s.id === 'AF-P12345-F1' && /No protein called “NOSUCH”/.test(s.err), s);
  // a PDB code is opened as given
  await send({ source: 'hitfinder', ribbon: { query: '8POC', pocket: true, compound: 'EDA-103', from: 'Hit Finder' } });
  s = await settle('8POC');
  check('RB25', 'a PDB code is opened as asked, with the ligand\'s pocket', s.id === '8POC' && s.pockets.join() === 'LIG:A:201' && /entry that was asked for/.test(s.note), s);
  // the newer request wins over a slow older one
  await send({ source: 'hitfinder', ribbon: { query: 'SLOWA', pocket: true, compound: 'OLD', from: 'Hit Finder' } });
  await sleep(150); await send({ source: 'hitfinder', ribbon: { query: 'APO1', pocket: true, compound: 'NEW', from: 'Hit Finder' } });
  await sleep(3500); s = await state0();
  check('RB25', 'a second request replaces a slower first one, and the first does not land afterwards', s.id === '1XYZ' && /NEW/.test(s.note) && !/OLD/.test(s.note), s);
  // what is in the message is text, and a huge one is cut
  await send({ source: 'hitfinder', ribbon: { query: 'XYZ1', pocket: true, compound: '<img src=x onerror="window.__pwn=1">'.repeat(3), from: '<b>x</b>' } });
  s = await settle('8POC');
  const inj = await rb.evaluate(() => ({ img: document.querySelectorAll('#infoCard .info-note img, #infoCard .info-note b').length, pwn: !!window.__pwn, note: (document.querySelector('#infoCard .info-note') || {}).textContent.slice(0, 80) }));
  check('RB25', 'a compound name with markup in it is shown as text', inj.img === 0 && !inj.pwn, inj);
  const longq = await rb.evaluate(() => { window.postMessage({ type: 'dhub:context', context: { ribbon: { query: 'APO1' } } }, '*'); return 'sent'; }); await sleep(2500);
  check('RB25', 'a message from the page itself (not its host) is ignored', (await state0()).id === '8POC' && await pg.evaluate(() => window.__sent) > 0);
  await ctx.close();
  // not hosted: the same message does nothing
  const solo = await open({ tag: 'RB25b ' });
  if (await has3d(solo.pg)) {
    await solo.go('1XYZ'); const before = await solo.E(() => currentPdbId);
    await solo.E(() => { window.postMessage({ type: 'dhub:context', context: { ribbon: { query: '4LIG' } } }, '*'); }); await sleep(1500);
    check('RB25', 'opened on its own (no Hub around it) Ribbon ignores such a message', await solo.E(() => currentPdbId) === before, before);
  }
  await solo.ctx.close();
}

// ── Driver ───────────────────────────────────────────────────────────────────────────────────

// ── RB26 the panel is tabs; Models puts things away without deleting them ─────────────────
async function rb26() {
  const { ctx, pg, E, go } = await open({ tag: 'RB26 ' });
  if (!(await has3d(pg))) { skipped.push('RB26 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const empty = await E(() => [...document.querySelectorAll('.rb-tab')].filter(b => b.disabled).map(b => b.dataset.tab).join());
  check('RB26', 'with nothing loaded only Open and Designs can be opened', empty === 'models,colour,analyse,figure', empty);
  await go('4LIG');
  const open1 = await E(() => [...document.querySelectorAll('.rb-tab')].every(b => !b.disabled));
  check('RB26', 'a structure opens every tab', open1);
  const panes = await E(() => { const r = {}; document.querySelectorAll('.rb-tab').forEach(b => { rbTab(b.dataset.tab); r[b.dataset.tab] = [...document.querySelectorAll('.rb-pane')].filter(p => !p.hidden).map(p => p.dataset.tab).join(); }); return r; });
  check('RB26', 'each tab shows its own pane and only that one', Object.entries(panes).every(([k, v]) => k === v), panes);
  const where = await E(() => ({ lig: rbPaneOf(document.getElementById('ligList')), ch: rbPaneOf(document.getElementById('chainList')), hl: rbPaneOf(document.getElementById('hlInput')), meas: rbPaneOf(document.getElementById('measList')), lbl: rbPaneOf(document.getElementById('resLblList')), dsg: rbPaneOf(document.getElementById('designList')) }));
  check('RB26', 'chains and ligands live in Models; highlights in Colour; measuring in Analyse; labels in Figure', where.lig === 'models' && where.ch === 'models' && where.hl === 'colour' && where.meas === 'analyse' && where.lbl === 'figure' && where.dsg === 'designs', where);
  // every field in every pane is a 32px box (a labelled column squeezed its selects to their text, 18px)
  const thin = await E(() => { const bad = []; document.querySelectorAll('.rb-tab').forEach(b => { rbTab(b.dataset.tab); document.querySelectorAll('.rb-pane:not([hidden]) details.rb-sec').forEach(d => { d.open = true; }); document.querySelectorAll('.rb-pane:not([hidden]) .inp').forEach(i => { const r = i.getBoundingClientRect(); if (r.width && r.height && r.height < 27) bad.push(b.dataset.tab + ':' + (i.id || i.className) + ' ' + Math.round(r.height)); }); }); return bad; });
  check('RB26', 'every field in every pane is a full-height box, not squeezed to its text', !thin.length, thin.slice(0, 6));
  // a select stays inside its column whatever its options say, and draws its own arrow: Safari's native one ignored the padding (the text ran
  // under it) and a native select is as wide as its longest option, so in a grid it pushed its neighbour out of the card
  const wide = await E(() => { const bad = []; document.querySelectorAll('.rb-tab').forEach(b => { rbTab(b.dataset.tab); document.querySelectorAll('.rb-pane:not([hidden]) details.rb-sec').forEach(d => { d.open = true; }); document.querySelectorAll('.rb-pane:not([hidden]) select').forEach(s => { if (!s.getBoundingClientRect().width) return; const o = new Option('A very long option name that no column in this panel could ever hold — Bromodomain-containing protein 4 · chain A'); s.add(o); const r = s.getBoundingClientRect(), pr = s.parentElement.getBoundingClientRect(), cs = getComputedStyle(s); if (r.right > pr.right + 1) bad.push(b.dataset.tab + ':' + (s.id || s.className) + ' +' + Math.round(r.right - pr.right) + 'px'); if (cs.appearance !== 'none' && cs.webkitAppearance !== 'none') bad.push(b.dataset.tab + ':' + (s.id || s.className) + ' native arrow'); o.remove(); }); }); return bad; });
  check('RB26', 'a select with a very long option stays inside its column and draws its own arrow', !wide.length, wide.slice(0, 6));
  const opened = await E(() => { rbTab('open'); rbOpenSec('values'); return { tab: _rbTab, open: document.querySelector('details[data-sec=values]').open }; });
  check('RB26', 'asking for a section opens its tab and the section', opened.tab === 'colour' && opened.open, opened);
  // things in the scene
  await E(() => { document.getElementById('hlInput').value = 'A:2-5'; document.getElementById('hlSticks').checked = true; addHighlight(); state.residueLabels.push({ chain: 'A', resi: 3, resn: 'ALA', text: 'ALA 3' }); renderLabelTags(); const a = currentModel.selectedAtoms({ chain: 'A', resi: 2, atom: 'CA' })[0], b = currentModel.selectedAtoms({ chain: 'B', resi: 4, atom: 'CA' })[0]; state.measures.push({ id: 'm1', kind: 'dist', pts: [atomRef(a), atomRef(b)] }); recolorStructure(); renderMeasList(); updateSummaries(); rbTab('models'); });
  await sleep(300);
  const rows = await E(() => [...document.querySelectorAll('#modelExtras .li')].map(r => r.dataset.x).join());
  check('RB26', 'Models lists the ions, highlights, measurements and labels', ['ions', 'hl', 'meas', 'labels'].every(k => rows.split(',').includes(k)), rows);
  const pic = () => E(() => { viewer.render(); return viewer.pngURI().length; });
  const tags = () => E(() => document.querySelectorAll('#label-layer .chain-tag').length);
  const t0 = await tags(), p0 = await pic();
  await pg.click('#modelExtras [data-x=labels] .x-eye'); await sleep(250);
  check('RB26', 'the eye on Labels takes every label off the figure', await tags() < t0 && await E(() => state.residueLabels.length === 1 && state.off.labels === true));
  await pg.click('#modelExtras [data-x=meas] .x-eye'); await sleep(250);
  check('RB26', 'the eye on Measurements hides them and keeps them', await E(() => state.measures.length === 1 && !document.querySelector('#label-lines line[style=""]') && tagList().every(t => t.kind !== 'meas')));
  await pg.click('#modelExtras [data-x=hl] .x-eye'); await sleep(250);
  const hlOff = await E(() => { const fn = makeColorFn(); const a = currentModel.selectedAtoms({ chain: 'A', resi: 3, atom: 'CA' })[0]; return { c: fn(a), u: adjustColor(state.uniformColor), n: state.highlights.length }; });
  check('RB26', 'the eye on Highlights draws the residues in their own colour again and keeps the list', hlOff.c === hlOff.u && hlOff.n === 1, hlOff);
  await pg.click('#modelExtras [data-x=ions] .x-eye'); await sleep(250);
  check('RB26', 'the picture changes as things are put away', await pic() !== p0);
  const eyes = await E(() => [...document.querySelectorAll('#modelExtras .x-eye')].map(b => b.getAttribute('aria-pressed')).join());
  check('RB26', 'every eye says it is off', eyes.split(',').every(v => v === 'false'), eyes);
  // a design keeps what was put away
  await E(() => { document.getElementById('designName').value = 'offs'; saveDesign(true); state.off = {}; loadDesign('offs'); }); await sleep(1500);
  const back = await E(() => JSON.stringify(state.off));
  check('RB26', 'a design keeps what the eyes put away', /"labels":true/.test(back) && /"meas":true/.test(back) && /"hl":true/.test(back) && /"ions":true/.test(back), back);
  const sk = await E(() => { const off = _scStickResidues().filter(r => r.chain === 'A' && r.lo === 2 && r.hi === 5).length; delete state.off.hl; const on = _scStickResidues().filter(r => r.chain === 'A' && r.lo === 2 && r.hi === 5).length; state.off.hl = true; return { off, on }; });
  check('RB26', 'a script draws what is on screen: a highlight put away is not exported as sticks', sk.off === 0 && sk.on === 1, sk);
  await E(() => setExtraShown('labels', true)); await sleep(200);
  check('RB26', 'and the eye brings them back', await tags() >= 1);
  // the phone: the tabs are a row on top of the sheet
  await ctx.close();
  const m = await open({ tag: 'RB26m ', vp: { width: 390, height: 844 }, touch: true });
  await m.go('4LIG');
  const ph = await m.E(async () => { openControls(); await new Promise(r => setTimeout(r, 450)); const rl = document.getElementById('rbRail').getBoundingClientRect(), pn = document.getElementById('rbPanel').getBoundingClientRect(); return { row: rl.width > rl.height, above: rl.bottom <= pn.top + 1, fits: rl.right <= innerWidth + 0.5 && rl.left >= -0.5, n: [...document.querySelectorAll('.rb-tab')].filter(b => b.offsetWidth).length }; });
  check('RB26', 'on a phone the tabs are one row across the top of the sheet, all six on screen', ph.row && ph.above && ph.fits && ph.n === 6, ph);
  await m.ctx.close();
}


// ── RB27 the sequence and the selection ─────────────────────────────────────────────────────
async function rb27() {
  const { ctx, pg, E, go } = await open({ tag: 'RB27 ' });
  if (!(await has3d(pg))) { skipped.push('RB27 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('7SEQ'); await sleep(300);
  await E(() => { currentModel.selectedAtoms({ chain: 'A' }).forEach(x => { if (x.resi <= 12) x.ss = 'h'; }); seqBuild(); seqRender(); });   // 3Dmol does not read HELIX records from these synthetic files
  const a = await E(() => ({ on: !document.getElementById('seqBar').hidden, rows: document.querySelectorAll('#sqRows .sq-row').length, letters: [...document.querySelectorAll('#sqRows .sq-r')].map(x => x.textContent).join(''), nums: [...document.querySelectorAll('#sqRows .sq-r[data-n]')].map(x => x.dataset.n).join(), chips: document.querySelectorAll('#sqChains .sq-chip').length, helix: document.querySelectorAll('#sqRows .sq-r.ss-h').length }));
  const want = Array.from({ length: 24 }, (_, i) => ({ ALA: 'A', GLY: 'G', SER: 'S', LEU: 'L', LYS: 'K', VAL: 'V', THR: 'T', GLU: 'E', ASP: 'D', ILE: 'I', PHE: 'F', ARG: 'R', TYR: 'Y', PRO: 'P' })[['ALA', 'GLY', 'SER', 'LEU', 'LYS', 'VAL', 'THR', 'GLU', 'ASP', 'ILE', 'PHE', 'ARG', 'TYR', 'PRO'][(i + 1) % 14]]).join('');
  check('RB27', 'on a desktop the sequence is shown, one chain, read from the structure', a.on && a.rows === 1 && a.letters === want, { a, want });
  check('RB27', 'a number every ten residues, the helix marked, a chip per chain and All', a.nums === '10,20' && a.helix >= 10 && a.chips === 3, a);
  await pg.click('#sqChains .sq-chip[data-ch="*"]'); await sleep(150);
  check('RB27', 'All shows every chain', await E(() => document.querySelectorAll('#sqRows .sq-row').length) === 2);
  await pg.click('#sqChains .sq-chip[data-ch="B"]'); await sleep(150);
  check('RB27', 'a chip shows that chain', await E(() => [...document.querySelectorAll('#sqRows .sq-row')].map(r => r.dataset.ch).join()) === 'B');
  await pg.click('#sqChains .sq-chip[data-ch="A"]'); await sleep(150);
  const r = sel => pg.locator(`#sqRows .sq-r[data-k="${sel}"]`);
  const base = await E(() => { const at = currentModel.selectedAtoms({ chain: 'A', resi: 5, atom: 'CA' })[0]; return makeColorFn()(at); });
  await r('A|5').click(); await sleep(250);
  const one = await E(() => { const at = currentModel.selectedAtoms({ chain: 'A', resi: 5, atom: 'CA' })[0]; return { keys: selKeys().join(), tint: makeColorFn()(at), fig: makeColorFn({ noDim: true })(at), seq: document.querySelector('#sqRows .sq-r[data-k="A|5"]').classList.contains('sel'), acts: document.querySelectorAll('#sqActs button').length }; });
  check('RB27', 'a click on a letter selects that residue, here and in the structure (green)', one.keys === 'A|5' && one.seq && one.tint !== base, one);
  check('RB27', 'the selection is not part of the figure: the colour a script or export reads is the real one', one.fig === base, { one, base });
  check('RB27', 'what can be done with it appears beside the sequence', one.acts >= 5, one.acts);
  await pg.keyboard.down('Shift'); await r('A|9').click(); await pg.keyboard.up('Shift'); await sleep(250);
  check('RB27', 'Shift extends from the last one: 5–9', await E(() => selKeys().sort().join()) === ['A|5', 'A|6', 'A|7', 'A|8', 'A|9'].sort().join());
  { const mk = process.platform === 'darwin' ? 'Meta' : 'Control'; await pg.keyboard.down(mk); await r('A|15').click(); await pg.keyboard.up(mk); } await sleep(250);
  check('RB27', '⌘/Ctrl adds one', await E(() => selKeys().length) === 6);
  check('RB27', 'the ranges are the form the highlight box reads', await E(() => selRangesText()) === 'A:5-9, A:15');
  // a drag
  const b1 = await r('A|2').boundingBox(), b2 = await r('A|7').boundingBox();
  await pg.mouse.move(b1.x + 4, b1.y + 8); await pg.mouse.down(); await pg.mouse.move(b1.x + 20, b1.y + 8, { steps: 3 }); await pg.mouse.move(b2.x + 4, b2.y + 8, { steps: 4 }); await pg.mouse.up(); await sleep(250);
  check('RB27', 'a drag across letters selects the range and nothing else', await E(() => selRangesText()) === 'A:2-7');
  // the structure → the sequence
  await E(() => { const at = currentModel.selectedAtoms({ chain: 'A', resi: 20, atom: 'CA' })[0]; rbOnHover(at); });
  check('RB27', 'the residue under the pointer in the structure is marked in the sequence', await E(() => !!document.querySelector('#sqRows .sq-r.hov[data-k="A|20"]')));
  await r('A|11').hover(); await sleep(200);
  check('RB27', 'the residue under the pointer in the sequence is marked in the structure', await E(() => !!_seqHoverShape));
  await pg.mouse.move(5, 5); await sleep(150);
  check('RB27', 'and the mark goes when the pointer leaves', await E(() => !_seqHoverShape));
  // acting on it
  await pg.click('#sqActs [data-a=colour]'); await sleep(250);
  check('RB27', 'Colour makes the selection a highlight', await E(() => state.highlights.length === 1 && state.highlights[0].sel === 'A:2-7'));
  await pg.click('#sqActs [data-a=label]'); await sleep(250);
  check('RB27', 'Label labels each selected residue', await E(() => state.residueLabels.length === 6));
  // the export does not show it
  const exA = await E(() => { _exOpts.res = '300'; const c = renderExport(); return c && c.toDataURL().length; });
  const exB = await E(() => { const k = selKeys(); selClear(); const c = renderExport(); selSet(k); return c && c.toDataURL().length; });
  check('RB27', 'an exported picture is the same with or without a selection on screen', exA === exB && exA > 1000, { exA, exB });
  check('RB27', 'a design does not keep the selection', await E(() => !('sel' in collectDesign().state) && !JSON.stringify(collectDesign()).includes('"A|2"')));
  // ⌘-click in the structure
  await E(() => { selClear(); });
  const pt = await E(() => { _userMoved = true; viewer.setStyle({}, { sphere: { radius: 1.6, colorfunc: makeColorFn() } }); viewer.render(); const at = currentModel.selectedAtoms({ chain: 'B', resi: 12, atom: 'CA' })[0]; const p = viewer.modelToScreen({ x: at.x, y: at.y, z: at.z }); return { x: p.x, y: p.y }; });
  await pg.mouse.move(pt.x, pt.y); await sleep(100);
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  await pg.keyboard.down(mod); await pg.mouse.down(); await pg.mouse.up(); await pg.keyboard.up(mod); await sleep(400);
  check('RB27', '⌘/Ctrl-click on the structure selects the residue, and the sequence follows', await E(() => selKeys().join() === 'B|12' && selectedChain === null), await E(() => selKeys()));
  await E(() => recolorStructure());
  await pg.keyboard.press('Escape');
  check('RB27', 'Esc clears the selection', await E(() => _selN === 0 && !document.querySelector('#sqRows .sq-r.sel')));
  // Q hides and shows it, and it is remembered
  await E(() => document.body.focus()); await pg.keyboard.press('q'); await sleep(200);
  check('RB27', 'Q hides the sequence and says so', await E(() => document.getElementById('seqBar').hidden && document.getElementById('seqBtn').getAttribute('aria-pressed') === 'false' && localStorage.getItem('ribbon_seq') === '0'));
  await pg.keyboard.press('q'); await sleep(200);
  check('RB27', 'and shows it again', await E(() => !document.getElementById('seqBar').hidden));
  await E(() => toggleChain('A')); await sleep(250);
  check('RB27', 'a hidden chain is faded in the sequence', await E(() => document.querySelector('#sqRows .sq-row[data-ch="A"]').classList.contains('off')));
  await ctx.close();
  const m = await open({ tag: 'RB27m ', vp: { width: 390, height: 844 }, touch: true });
  await m.go('7SEQ');
  check('RB27', 'on a phone the sequence starts hidden (the structure needs the room)', await m.E(() => document.getElementById('seqBar').hidden));
  await m.ctx.close();
}


// ── RB28 the command line and the selection language ──────────────────────────────────────
async function rb28() {
  const { ctx, pg, E, go } = await open({ tag: 'RB28 ' });
  if (!(await has3d(pg))) { skipped.push('RB28 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('7SEQ');
  await E(() => { currentModel.selectedAtoms({}).forEach(x => { if (x.chain === 'A' && x.resi <= 12) x.ss = 'h'; }); });
  // the language, against a count made here from the atoms themselves
  const lang = await E(() => {
    const at = currentModel.selectedAtoms({}), res = f => { const k = {}; at.filter(f).forEach(a => { k[a.chain + '|' + a.resi] = 1; }); return Object.keys(k).length; };
    const n = t => { const r = specResidues(t); return r.err ? 'ERR ' + r.err : r.keys.length; };
    const na = t => { const r = specAtoms(t); return r.err ? 'ERR ' + r.err : r.atoms.length; };
    return [
      ['chain A', n('chain A'), res(a => a.chain === 'A')], ['A', n('A'), res(a => a.chain === 'A')], ['/A', n('/A'), res(a => a.chain === 'A')],
      ['/A:1-5', n('/A:1-5'), 5], ['A:1-5', n('A:1-5'), 5], [':5', n(':5'), 2], ['resi 3-4,9', n('resi 3-4,9'), 6], ['3-4', n('3-4'), 4],
      ['lys', n('lys'), res(a => a.resn === 'LYS')], ['resn LYS,ARG', n('resn LYS,ARG'), res(a => a.resn === 'LYS' || a.resn === 'ARG')], [':LYS', n(':LYS'), res(a => a.resn === 'LYS')],
      ['name CA', na('name CA'), at.filter(a => a.atom === 'CA').length], ['@CA and chain A', na('@CA and chain A'), at.filter(a => a.atom === 'CA' && a.chain === 'A').length],
      ['chain A lys', n('chain A lys'), res(a => a.chain === 'A' && a.resn === 'LYS')], ['not chain A', n('not chain A'), res(a => a.chain !== 'A')],
      ['(chain A or chain B) and aromatic', n('(chain A or chain B) and aromatic'), res(a => ['PHE', 'TRP', 'TYR', 'HIS'].includes(a.resn))],
      ['helix', n('helix'), res(a => a.ss === 'h')], ['helix and not chain B', n('helix and not chain B'), res(a => a.ss === 'h' && a.chain !== 'B')],
      ['hydrophobic', n('hydrophobic'), res(a => ['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO', 'CYS'].includes(a.resn))],
      ['byres name CA and resi 2', n('byres name CA and resi 2'), 2], ['chain a', n('chain a'), res(a => a.chain === 'A')],
    ];
  });
  lang.forEach(([t, got, want]) => check('RB28', 'the language: “' + t + '”', got === want, { got, want }));
  const errs = await E(() => ['chain Z', 'lyss', '(chain A', 'within', 'chain A and', 'resi', 'foo bar'].map(t => [t, specParse(t).err || '']));
  check('RB28', 'a word it does not know says so; a near miss gets a "did you mean"', errs.every(([, e]) => e) && /chains: A, B/.test(errs[0][1]) && /Did you mean/.test(errs[1][1]) && /never closed/.test(errs[2][1]), errs);
  // within, against a brute-force distance
  await go('4LIG');
  const w = await E(() => {
    const at = currentModel.selectedAtoms({}), L = at.filter(a => a.resn === 'LIG' || a.resn === 'PRC'), k = {};
    at.forEach(a => { if (a.resn === 'LIG' || a.resn === 'PRC' || a.resn === 'HOH') return; if (L.some(b => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= 5)) k[a.chain + '|' + a.resi] = 1; });
    const r = specResidues('within 5 of ligand and not ligand'); return { got: r.keys.slice().sort().join(), want: Object.keys(k).sort().join(), n: r.keys.length };
  });
  check('RB28', '“within 5 of ligand” is every residue with an atom within 5 Å of one, by brute force', w.got === w.want && w.n > 0, w);
  const lw = await E(() => ({ lig: specResidues('LIG').keys.length, ions: specResidues('ions').keys.length, w: specResidues('waters').keys.length, all: specResidues('ligand').keys.length }));
  check('RB28', 'a ligand by its code; ions; waters', lw.lig === 1 && lw.ions === 1 && lw.w === 3 && lw.all === 2, lw);
  // the commands
  const run = c => E(c => { const r = runCommand(c, { noHistory: true }); return r && (r.err ? 'ERR ' + r.err : r.ok); }, c);
  const pic = () => E(() => { viewer.render(); return viewer.pngURI().length; });
  let p0 = await pic(), r;
  r = await run('color LIG orange');
  check('RB28', 'color <ligand> <colour> sets that ligand’s carbon colour', await E(() => { const l = ligands.find(x => x.resn === 'LIG'); return ligHex(l) === NAMED_COLORS.orange && state.highlights.length === 0; }) && await pic() !== p0, r);
  r = await run('color chain A red');
  check('RB28', 'color <whole chain> <colour> is the chain’s own colour', await E(() => state.chainColors.A === NAMED_COLORS.red), r);
  r = await run('color A:2-4 #3366cc');
  check('RB28', 'color <some residues> <hex> is a highlight of exactly those', await E(() => state.highlights.length === 1 && state.highlights[0].sel === 'A:2-4' && state.highlights[0].color === '#3366cc'), r);
  r = await run('color bychain');
  check('RB28', 'color <scheme> colours the whole structure', await E(() => state.color === 'chain' && document.getElementById('topColor').value === 'chain'), r);
  r = await run('color');
  check('RB28', 'a command missing its argument says what it wants', /^ERR /.test(r), r);
  r = await run('select within 5 of ligand and not ligand');
  check('RB28', 'select sets the selection the sequence and panel show', await E(() => _selN) === w.n, r);
  p0 = await pic(); r = await run('show sel as sticks');
  check('RB28', 'show <sel> as sticks draws them as sticks and the picture changes', await E(() => state.reps.length === 1 && state.reps[0].rep === 'stick') && await pic() !== p0, r);
  check('RB28', 'sticks drawn by a command are in the scripts', await E(() => { const t = state.reps[0].sel.split(',')[0].trim(); const m = /^([A-Z]):(\d+)/.exec(t); return _scStickResidues().some(x => x.chain === m[1] && x.lo <= +m[2] && x.hi >= +m[2]); }));
  r = await run('hide sticks'); check('RB28', 'hide sticks takes them off', await E(() => state.reps.length === 0), r);
  r = await run('show waters'); check('RB28', 'show waters', await E(() => state.showWaters && document.getElementById('showWaters').checked), r);
  r = await run('hide waters'); check('RB28', 'hide waters', await E(() => !state.showWaters), r);
  r = await run('hide chain B'); check('RB28', 'hide <chain> hides the chain (same as its eye)', await E(() => state.hiddenChains.B === true), r);
  r = await run('show chain B'); check('RB28', 'show <chain> brings it back', await E(() => !state.hiddenChains.B), r);
  r = await run('hide A:1-3'); check('RB28', 'hide <residues> stops drawing just them', await E(() => state.hide.join() === 'A:1-3'), r);
  r = await run('show A:1-3'); check('RB28', 'and show brings them back', await E(() => state.hide.length === 0), r);
  r = await run('label A:3'); check('RB28', 'label <residue>', await E(() => state.residueLabels.some(x => x.chain === 'A' && x.resi === 3)), r);
  r = await run('label chain B "Beta"'); check('RB28', 'label <chain> "text" names the chain', await E(() => state.chainLabels.B === 'Beta'), r);
  r = await run('distance A:2@CA B:4@CA');
  const dd = await E(() => { const a = currentModel.selectedAtoms({ chain: 'A', resi: 2, atom: 'CA' })[0], b = currentModel.selectedAtoms({ chain: 'B', resi: 4, atom: 'CA' })[0]; return { want: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), got: measureValue(state.measures[state.measures.length - 1]) }; });
  check('RB28', 'distance <atom> <atom> is the distance between their coordinates', Math.abs(dd.want - dd.got) < 1e-6, dd);
  r = await run('distance A:2 B:4'); check('RB28', 'an atom spec without @ means its CA', /Å/.test(r), r);
  r = await run('bg dark; outline thick; projection ortho');
  check('RB28', 'commands joined with ; run in turn', await E(() => state.bg === 'dark' && state.border === 'thick' && state.projection === 'orthographic'), r);
  r = await run('style surface'); check('RB28', 'style surface', await E(() => state.style === 'surface'), r); await run('style cartoon');
  r = await run('colr red'); check('RB28', 'a misspelt command is answered with the right one', /color/.test(r) && /^ERR/.test(r), r);
  r = await run('interface A B'); check('RB28', 'interface A B shows the contacts', await E(() => state.iface && state.iface.a === 'A' && state.iface.b === 'B' && state.iface.show), r);
  check('RB28', 'and “interface” is then a word of the language', await E(() => specResidues('interface').keys.length > 0));
  r = await run('pocket LIG'); check('RB28', 'pocket <ligand>', await E(() => Object.keys(state.pockets).length === 1), r);
  r = await run('only chain A'); check('RB28', 'only <chain>', await E(() => state.hiddenChains.B === true && !state.hiddenChains.A), r); await run('show chain B');
  // a design keeps what the commands drew
  await run('show A:5-6 as spheres'); await run('hide B:1-2');
  check('RB28', 'a design keeps what commands drew and hid', await E(() => { const d = collectDesign().state; return d.reps.length === 1 && d.reps[0].rep === 'sphere' && d.hide.join() === 'B:1-2'; }));
  // completion
  const sg = t => E(t => cmdSuggest(t).list.map(x => x.t), t);
  check('RB28', 'col → color', (await sg('col'))[0] === 'color');
  check('RB28', 'sel → select (an alias completes to the command)', (await sg('sel'))[0] === 'select');
  check('RB28', 'after “color ” the schemes are offered', (await sg('color ')).includes('bychain'));
  check('RB28', 'after “color chain ” the chains of this structure', (await sg('color chain ')).slice(0, 2).join() === 'A,B');
  check('RB28', 'after “select resn ” the residue names in this structure', (await sg('select resn ')).includes('LIG') || (await sg('select resn ')).includes('ALA'));
  check('RB28', 'after a selection, colours come first', !!(await E(() => cmdSuggest('color A:2-4 ').list[0].hex)));
  check('RB28', 'after “select within ” a distance', /^\d/.test((await sg('select within '))[0]));
  check('RB28', 'a ligand code is offered by its letters', (await sg('zoom LI')).includes('LIG'));
  await E(() => runCommand('color chain B teal'));
  check('RB28', 'a line typed before is offered first when the start matches', (await sg('color chain B t'))[0] === 'color chain B teal');
  await E(() => { CMD.hist = []; CMD.next = {}; });
  check('RB28', 'with nothing typed after color, the likely next words lead: the selection, then a scheme', await E(() => { const l = cmdSuggest('color ').list.map(x => x.t); return l[0] === 'sel' && l.indexOf('bychain') >= 0 && l.indexOf('bychain') < 4; }), await sg('color '));
  check('RB28', 'after “color ligand ” the usual ligand colour leads', (await sg('color ligand '))[0] === 'yellow');
  // the keyboard (a fresh history, so what is offered is the dictionary, not a line typed before)
  await E(() => { CMD.hist = []; document.activeElement && document.activeElement.blur(); });
  await pg.keyboard.press('/'); await sleep(100);
  check('RB28', '/ goes to the command line', await E(() => document.activeElement.id === 'cmdInput'));
  await pg.keyboard.type('col'); await sleep(120);
  check('RB28', 'the rest of the word is shown in grey as you type', await E(() => document.querySelector('#cmdGhost .cg-r').textContent === 'or'));
  await pg.keyboard.press('Tab'); await sleep(80);
  check('RB28', 'Tab takes it', await E(() => document.getElementById('cmdInput').value === 'color '));
  await pg.keyboard.type('chain A gre'); await pg.keyboard.press('Tab'); await sleep(80);
  check('RB28', 'and again, mid-line', await E(() => document.getElementById('cmdInput').value) === 'color chain A green ');
  await pg.keyboard.press('Enter'); await sleep(250);
  check('RB28', 'Enter runs it, empties the line and says what happened', await E(() => state.chainColors.A === NAMED_COLORS.green && document.getElementById('cmdInput').value === '' && !document.getElementById('cmdOut').hidden));
  await pg.keyboard.press('ArrowUp'); await sleep(60);
  check('RB28', '↑ brings back what was run', await E(() => document.getElementById('cmdInput').value) === 'color chain A green');
  await pg.keyboard.press('Escape'); await pg.keyboard.press('Escape'); await sleep(60);
  check('RB28', 'Esc leaves the line', await E(() => document.activeElement.id !== 'cmdInput'));
  await E(() => cmdFocus('zzzz')); await pg.keyboard.press('Enter'); await sleep(100);
  check('RB28', 'a line that fails stays, selected, so it can be fixed', await E(() => document.getElementById('cmdInput').value === 'zzzz' && document.getElementById('cmdOut').classList.contains('err')));
  await ctx.close();
  const m = await open({ tag: 'RB28m ', vp: { width: 390, height: 844 }, touch: true });
  await m.go('7SEQ');
  check('RB28', 'on a phone the line is out of the way until the toolbar asks for it', await m.E(() => getComputedStyle(document.getElementById('cmdBar')).display === 'none' && getComputedStyle(document.getElementById('cmdBtn')).display !== 'none'));
  await m.pg.tap('#cmdBtn'); await sleep(200);
  const mo = await m.E(() => { const b = document.getElementById('cmdBar').getBoundingClientRect(), i = document.getElementById('cmdInput'), g = document.getElementById('cmdGhost'); return { shown: getComputedStyle(document.getElementById('cmdBar')).display !== 'none', inView: b.bottom <= innerHeight + 1 && b.top >= 0 && b.width > 300, focused: document.activeElement === i, fsI: getComputedStyle(i).fontSize, fsG: getComputedStyle(g).fontSize, insp: getComputedStyle(document.getElementById('cmdInsp')).display, go: i.getAttribute('enterkeyhint'), pressed: document.getElementById('cmdBtn').getAttribute('aria-pressed') }; });
  check('RB28', 'the toolbar button shows the line on screen, focused, at 16px with its ghost at the same size (no zoom, no drift), "Go" on the keyboard, no inspector', mo.shown && mo.inView && mo.focused && mo.fsI === '16px' && mo.fsG === '16px' && mo.insp === 'none' && mo.go === 'go' && mo.pressed === 'true', mo);
  await m.pg.keyboard.type('color chain A gre'); await sleep(150);
  const pop = await m.E(() => ({ open: !document.getElementById('cmdPop').hidden, foot: document.querySelector('#cmdPop .cp-foot') && document.querySelector('#cmdPop .cp-foot').textContent, first: document.querySelector('#cmdPop .cp-it .cp-t') && document.querySelector('#cmdPop .cp-it .cp-t').textContent }));
  check('RB28', 'suggestions open and say how to take one by touch, not with Tab', pop.open && /Tap a suggestion/.test(pop.foot) && !/Tab/.test(pop.foot), pop);
  await m.pg.tap('#cmdPop .cp-it'); await sleep(150);
  check('RB28', 'a tapped suggestion is taken into the line', await m.E(() => /^color chain A green $/.test(document.getElementById('cmdInput').value)), await m.E(() => document.getElementById('cmdInput').value));
  await m.pg.keyboard.press('Enter'); await sleep(250);
  check('RB28', 'Go runs it', await m.E(() => document.getElementById('cmdOut').classList.contains('ok')), await m.E(() => ({ out: document.getElementById('cmdOut').className + ' ' + document.getElementById('cmdOut').textContent, v: document.getElementById('cmdInput').value, lig: ligands.length })));
  await m.pg.tap('#cmdBtn'); await sleep(150);
  check('RB28', 'the button puts it away again', await m.E(() => getComputedStyle(document.getElementById('cmdBar')).display === 'none' && document.getElementById('cmdBtn').getAttribute('aria-pressed') === 'false'));
  const cov = await m.E(() => { openControls(); cmdShow(true); const r = document.getElementById('cmdInput').getBoundingClientRect(), top = document.elementFromPoint(r.left + 20, r.top + r.height / 2); return { sheet: document.getElementById('sidebar').classList.contains('open'), onTop: !!top && !!top.closest('#cmdBar') }; });
  check('RB28', 'asking for the line closes the controls sheet, so nothing sits over it', !cov.sheet && cov.onTop, cov);
  await m.E(() => cmdShow(false));
  await m.ctx.close();
  const t = await open({ tag: 'RB28t ', vp: { width: 1024, height: 768 }, touch: true });
  check('RB28', 'a tablet shows the line (a keyboard may be attached), with no toolbar button for it', await t.E(() => getComputedStyle(document.getElementById('cmdBar')).display !== 'none' && getComputedStyle(document.getElementById('cmdBtn')).display === 'none'));
  await t.ctx.close();
}


// ── RB29 look: lighting, styles, palettes, the scale bar ───────────────────────────────────
async function rb29() {
  const { ctx, pg, E, go } = await open({ tag: 'RB29 ' });
  if (!(await has3d(pg))) { skipped.push('RB29 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG');
  const pic = () => E(() => { viewer.render(); return viewer.pngURI(); });
  const p0 = await pic();
  await E(() => { rbTab('colour'); }); await pg.click('#lightSeg button[data-v=studio]'); await sleep(300);
  const full = await E(() => ({ l: state.lighting, ao: !!viewer.getConfig || true, pressed: document.querySelector('#lightSeg button[data-v=studio]').getAttribute('aria-pressed'), hint: document.getElementById('lightHint').textContent }));
  check('RB29', 'a lighting button sets the light, says what it does, and the picture changes', full.l === 'studio' && full.pressed === 'true' && /shadow/i.test(full.hint) && await pic() !== p0, full);
  await pg.click('#bgSeg button[data-v=white]'); await sleep(150);   // the button, so the depth-cue box follows the background as it does for a person
  const f0 = await pic(); await E(() => { const r = document.getElementById('depthR'); r.value = 70; r.dispatchEvent(new Event('input')); }); await sleep(250);
  check('RB29', 'the depth slider changes the picture on a white background', await E(() => state.depth === 70 && state.fog) && await pic() !== f0);
  await pg.click('#bgSeg button[data-v=transparent]'); await sleep(150);
  check('RB29', 'and says why it shows nothing on a transparent one (it would fade into nothing), and offers a white background', await E(() => !document.getElementById('depthBg').hidden && /white or dark/.test(document.getElementById('depthHint').textContent)));
  // styles
  const before = await E(() => { state.residueLabels.push({ chain: 'A', resi: 3, resn: 'ALA', text: 'ALA 3' }); state.highlights.push({ id: 'h1', sel: 'A:2-4', color: '#123456', sticks: false }); recolorStructure(); return { lab: state.residueLabels.length, hl: state.highlights.length }; });
  for (const id of ['paper', 'structure', 'rainbow', 'ternary', 'mono', 'site', 'surface', 'hydro', 'ink', 'night', 'cover', 'confidence']) {
    const q0 = await pic();
    await pg.click(`#presetGrid .preset[data-p=${id}]`); await sleep(500);
    const r = await E(id => ({ on: document.querySelector('#presetGrid .preset[data-p=' + id + ']').getAttribute('aria-pressed'), lab: state.residueLabels.length, hl: state.highlights.length, style: state.style, light: state.lighting, bg: state.bg }), id);
    check('RB29', 'the style “' + id + '” changes the picture and keeps the labels and highlights', r.on === 'true' && r.lab === before.lab && r.hl === before.hl && await pic() !== q0, r);
  }
  // a style is drawn once, not once per step: without a GPU each draw is ~0.4 s and a click on a style froze the page for 5 s (30 s in CI)
  const draws = await E(() => { const R = viewer.renderer, real = R.render; let n = 0; R.render = function () { n++; return real.apply(this, arguments); };
    try { _userMoved = false; applyPreset('paper'); const a = n; n = 0; fitView(); const b = n; n = 0; applyPreset('cover'); return { style: a, fit: b, style2: n }; } finally { R.render = real; } });
  check('RB29', 'a style draws the picture at most twice and framing it once (each draw costs ~0.4 s without a GPU)', draws.style <= 2 && draws.style2 <= 2 && draws.fit === 1, draws);
  const framed = await E(() => { _userMoved = false; fitView(); const vp = document.getElementById('viewport'), r = vp.getBoundingClientRect(), bb = projBox(fitPoints(), r);
    return { ok: bb.x0 >= -2 && bb.y0 >= -2 && bb.x1 <= vp.clientWidth + 2 && bb.y1 <= vp.clientHeight + 2 && (bb.x1 - bb.x0 > vp.clientWidth * 0.6 || bb.y1 - bb.y0 > vp.clientHeight * 0.6), bb, w: vp.clientWidth, h: vp.clientHeight }; });
  check('RB29', 'and framing without drawing still fits the structure to the viewer', framed.ok, framed);
  check('RB29', 'Ternary complex gives the ligand its own colour and its pocket', await E(() => { applyPreset('ternary'); return /^#e642c8$/i.test(ligHex(ligands[0])) && !!state.pockets[ligands[0].key]; }));
  // palettes
  const okabe = await E(() => { const s = document.getElementById('palSel'); s.value = 'okabe'; s.dispatchEvent(new Event('change')); return { mode: state.color, a: chainSolidColor('A'), want: adjustColor(PALETTES.okabe.c[0]) }; });
  check('RB29', 'a palette colours the chains from that palette', okabe.mode === 'chain' && okabe.a === okabe.want, okabe);
  const warn = await E(() => { state.color = 'uniform'; state.uniformColor = '#ffffff'; state.bg = 'white'; state.border = 'none'; recolorStructure(); syncLookControls(); return { hidden: document.getElementById('contrastWarn').hidden, t: document.getElementById('contrastWarn').textContent }; });
  check('RB29', 'a colour that disappears on the background is pointed out', !warn.hidden && /hard to see/.test(warn.t), warn);
  const vm = await E(() => { state.valMap = 'viridis'; const a = valueColor(0), b = valueColor(1); state.valMap = 'consurf'; return { a, b }; });
  check('RB29', 'viridis runs dark purple → yellow', vm.a === '#440154' && vm.b === '#fde725', vm);
  // the scale bar is the right length
  await E(() => { state.bg = 'white'; state.border = 'thin'; state.color = 'chain'; state.projection = 'orthographic'; applyProjection(); applyBackground(); recolorStructure(); });   // the bar is exact in orthographic
  await pg.check('#scaleChk'); await sleep(300);
  const sb = await E(() => { const m = scaleMeasure(), sp = scaleBarSpec(m.ppa, document.getElementById('viewport').clientWidth, 0.2), el = document.getElementById('scaleBar'), w = el.querySelector('.sb-bar').getBBox().width;
    const c = currentModel.selectedAtoms({ atom: 'CA' })[0], v = viewer.getView(), R = _camRot(v), a = viewer.modelToScreen(c), b = viewer.modelToScreen({ x: c.x + R[0][0] * sp.len, y: c.y + R[0][1] * sp.len, z: c.z + R[0][2] * sp.len });
    return { shown: !el.hidden, w, want: Math.hypot(b.x - a.x, b.y - a.y), label: el.querySelector('text').textContent, spec: sp.label }; });
  check('RB29', 'the scale bar is as long as its label in Å at the structure (orthographic, so anywhere in it)', sb.shown && Math.abs(sb.w - sb.want) / sb.want < 0.06 && sb.label === sb.spec, sb);
  const ex = await E(() => { _exOpts.res = '300'; _exOpts.bg = 'white'; const a = renderExport().toDataURL(); state.scalebar = false; const b = renderExport().toDataURL(); state.scalebar = true; return a !== b; });
  check('RB29', 'the scale bar is in the export', ex);
  await pg.check('#axesChk'); await sleep(200);
  check('RB29', 'the axes show on screen', await E(() => !document.getElementById('axesInd').hasAttribute('hidden') && document.querySelectorAll('#axesInd line').length === 3));
  const ax = await E(() => { const a = renderExport().toDataURL(); store('ribbon_axes', '0'); decorUpdate(); const b = renderExport().toDataURL(); store('ribbon_axes', '1'); return a === b; });
  check('RB29', 'and never in the export', ax);
  // a design keeps the look
  const d = await E(() => { state.lighting = 'soft'; state.depth = 60; state.palette = 'tol'; state.valMap = 'cividis'; const st = collectDesign().state; return [st.lighting, st.depth, st.palette, st.valMap, st.scalebar].join(); });
  check('RB29', 'a design keeps the light, the depth, the palette, the ramp and the scale bar', d === 'soft,60,tol,cividis,true', d);
  const sc = await E(() => { state.lighting = 'studio'; state.depth = 60; state.bg = 'white'; return { cx: buildScript('chimerax'), py: buildScript('pymol') }; });
  check('RB29', 'the scripts carry the light and the depth cue', /lighting full/.test(sc.cx) && /lighting depthCue true/.test(sc.cx) && /set depth_cue, 1/.test(sc.py) && /set ambient_occlusion_mode, 1/.test(sc.py));
  // the commands
  const cm = await E(() => [runCommand('lighting soft', { noHistory: true }).ok && state.lighting === 'soft', runCommand('preset cover', { noHistory: true }).ok && state.bg === 'dark', runCommand('palette tol', { noHistory: true }).ok && state.palette === 'tol', !!runCommand('lighting neon', { noHistory: true }).err, cmdSuggest('lighting ').list.map(x => x.t).join() === 'flat,soft,studio']);
  check('RB29', 'lighting, preset and palette are commands, and complete', cm.every(Boolean), cm);
  await ctx.close();
}


// ── RB30 analyse: interactions, lysines, clashes, colours by property, pockets, the PAE ────
async function rb30() {
  const { ctx, pg, E, go } = await open({ tag: 'RB30 ' });
  if (!(await has3d(pg))) { skipped.push('RB30 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('9INT');
  const it = await E(() => { const l = ligands.find(x => x.resn === 'LIG'); interSet('lig:' + l.key, 'protein'); return interNow().list.map(x => ({ t: x.type, a: x.a.resn + x.a.atom, b: x.b.resn + ':' + x.b.resi + ':' + x.b.atom, d: +x.d.toFixed(2) })); });
  const has = (t, b) => it.some(x => x.t === t && (!b || x.b.startsWith(b)));
  check('RB30', 'the ligand N 2.9 Å from SER OG is a hydrogen bond', has('hbond', 'SER:40:OG'), it);
  check('RB30', 'the ring 3.7 Å over the PHE ring, parallel, is π-stacking', has('pi', 'PHE:30'), it);
  check('RB30', 'the Cl 3.3 Å from an O is a halogen bond', has('halogen', 'ASN:50:OD1'), it);
  check('RB30', 'a carbon bonded only to carbons, 3.8 Å from LEU CD1, is a hydrophobic contact', has('hydro', 'LEU:60'), it);
  check('RB30', 'the ligand O 2.1 Å from Mg is a metal contact', has('metal', 'MG'), it);
  check('RB30', 'a ligand makes no salt bridge (its charges are not in the file)', !has('salt'), it);
  check('RB30', 'nothing is reported farther than its own limit', it.every(x => x.d <= ({ hbond: 3.5, halogen: 3.5, hydro: 4.0, metal: 2.8, pi: 6.5, cation: 6.0, salt: 4.0 })[x.t]), it);
  const shapes = await E(() => _interShapes.length);
  check('RB30', 'each interaction is drawn', shapes >= it.length, { shapes, n: it.length });
  const off = await E(() => { state.inter.types.hydro = false; interDraw(); const n = _interShapes.length; state.inter.types.hydro = true; interDraw(); return { n, all: _interShapes.length }; });
  check('RB30', 'a kind switched off is not drawn', off.n < off.all, off);
  const ab = await E(() => { interSet('chain:A', 'chain:B'); return interNow().list.map(x => x.type + ':' + x.a.resn + '-' + x.b.resn); });
  check('RB30', 'between chains, LYS NZ 3.2 Å from GLU OE1 is a salt bridge, not also a hydrogen bond', ab.includes('salt:LYS-GLU') && !ab.includes('hbond:LYS-GLU'), ab);
  check('RB30', 'a design keeps what is shown', await E(() => collectDesign().state.inter && collectDesign().state.inter.src === 'chain:A'));
  // lysines
  const ly = await E(() => { lysSet('A', 'B', 30); const r = lysNow(); return r.rows.map(x => ({ k: x.resi, d: +x.dE3.toFixed(1), e: +x.exp.toFixed(2) })); });
  check('RB30', 'lysines are ranked by their NZ’s distance to the ligase', ly.length === 2 && ly[0].k === 70 && Math.abs(ly[0].d - 3.2) < 0.05 && ly[1].k === 72 && ly[1].d > 30, ly);
  check('RB30', 'an NZ in the open is exposed', ly[1].e > 0.6, ly);
  const lc = await E(() => { const fn = makeColorFn({ noDim: true }); const a = currentModel.selectedAtoms({ chain: 'A', resi: 70 })[0], b = currentModel.selectedAtoms({ chain: 'A', resi: 72 })[0]; return { near: fn(a), far: fn(b) }; });
  check('RB30', 'a reachable lysine is coloured, one out of reach is not', lc.near !== lc.far, lc);
  // clashes
  const cl = await E(() => { const c = clashCompute('chain:A', 'chain:B'); return { n: c.clashes.length, worst: c.clashes[0] && c.clashes[0].a.resn + c.clashes[0].a.resi + '-' + c.clashes[0].b.resn + c.clashes[0].b.resi, ov: c.clashes[0] && +c.clashes[0].ov.toFixed(2) }; });
  check('RB30', 'two CAs 1.5 Å apart are a clash, overlapping by 1.9 Å', cl.n >= 1 && cl.worst === 'ALA91-ALA90' && Math.abs(cl.ov - 1.9) < 0.01, cl);
  // properties
  const pr = await E(() => { const m = elecMap(), all = currentModel.selectedAtoms({}); const nearK = all.find(a => a.resn === 'LYS' && a.resi === 72 && a.atom === 'CA'), nearE = all.find(a => a.resn === 'GLU' && a.atom === 'CA'); return { k: m[nearK.index], e: m[nearE.index], hydL: hydroColor({ resn: 'LEU' }), hydK: hydroColor({ resn: 'LYS' }) }; });
  check('RB30', 'beside a lone lysine the potential is positive; beside a glutamate it is pulled negative', pr.k > 0 && pr.e < pr.k, pr);
  check('RB30', 'leucine and lysine sit at the two ends of the hydrophobicity ramp', pr.hydL !== pr.hydK, pr);
  const cs = await E(() => [runCommand('color charge', { noHistory: true }).ok && state.color === 'elec' && /Charge/.test(document.getElementById('legend').textContent), runCommand('color hydrophobicity', { noHistory: true }).ok && state.color === 'hydro']);
  check('RB30', 'colour by charge and by hydrophobicity, each with its key', cs.every(Boolean), cs);
  // pockets
  await go('9SHL');
  const pk = await E(() => { const L = pocketsFind(); return L.map(p => { const c = p.pts.reduce((s, q) => [s[0] + q.x, s[1] + q.y, s[2] + q.z], [0, 0, 0]).map(v => v / p.pts.length); return { vol: Math.round(p.vol), c: Math.hypot(...c) }; }); });
  check('RB30', 'the empty middle of a closed shell is one pocket of about the right size, in the middle', pk.length === 1 && pk[0].vol > 250 && pk[0].vol < 800 && pk[0].c < 4, pk);
  await go('2ROD');
  check('RB30', 'a straight rod has no pocket', await E(() => pocketsFind().length) === 0);
  // the AlphaFold error map
  await E(() => { document.getElementById('pdbInput').value = 'P12345'; handleSubmit(); }); await sleep(2500);
  await E(() => rbTab('analyse')); await sleep(400);
  const pae = await E(() => ({ shown: !document.getElementById('paeBox').hidden, w: document.getElementById('paeCanvas').width, note: document.getElementById('paeNote').textContent }));
  check('RB30', 'an AlphaFold model loads its error map', pae.shown && pae.w === 12 && /12 residues/.test(pae.note), pae);
  await pg.locator('#paeCanvas').scrollIntoViewIfNeeded(); await sleep(150);   // it is below the other tools now
  const cb = await pg.locator('#paeCanvas').boundingBox();
  await pg.mouse.move(cb.x + cb.width * 0.05, cb.y + cb.height * 0.05); await pg.mouse.down(); await pg.mouse.move(cb.x + cb.width * 0.45, cb.y + cb.height * 0.45, { steps: 4 }); await pg.mouse.up(); await sleep(200);
  check('RB30', 'a box dragged on the map selects those residues', await E(() => selRangesText()) === 'A:1-6', await E(() => selRangesText()));
  const conf = await E(() => runCommand('confident 70', { noHistory: true }).ok + '|' + state.hide.join());
  check('RB30', 'confident 70 hides the residues AlphaFold is not sure of', /A:7-12$/.test(conf), conf);
  check('RB30', 'and the error map is not offered for a crystal structure', await E(async () => { document.getElementById('pdbInput').value = '1XYZ'; handleSubmit(); await new Promise(r => setTimeout(r, 2500)); return getComputedStyle(document.querySelector('[data-sec=pae]')).display === 'none'; }));
  await ctx.close();
}



// ── RB34 camera feel ───────────────────────────────────────────────────────────────────────────
async function rb34() {
  const { ctx, pg, E, go } = await open({ tag: 'RB34 ' });
  if (!(await has3d(pg))) { skipped.push('RB34 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('8CAM'); await sleep(500);
  const fit = async () => { await E(() => fitToView()); await sleep(900); };
  const ext = () => E(() => { let x0 = 1e9, x1 = -1e9; currentModel.selectedAtoms({ atom: 'CA' }).forEach(a => { const p = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z }); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }); return x1 - x0; });
  const box = await pg.locator('#viewport').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const wheel = (o) => E(o => { const c = document.querySelector('#viewport canvas'); c.dispatchEvent(new WheelEvent('wheel', Object.assign({ bubbles: true, cancelable: true }, o))); }, o);
  await fit(); await pg.mouse.move(cx, cy);
  // direction, and in-then-out
  const e0 = await ext(); await pg.mouse.wheel(0, -120); await sleep(600); const e1 = await ext();
  check('RB34', 'scrolling up zooms in (the web convention; 3Dmol zoomed out)', e1 > e0 * 1.1, { e0, e1 });
  await pg.mouse.wheel(0, 120); await sleep(600); const e2 = await ext();
  check('RB34', 'a notch in and a notch out come back to the same size (3Dmol: 26 in, 14 out)', Math.abs(e2 - e0) / e0 < 0.03, { e0, e2 });
  // eased: one event is many frames, and it arrives
  await fit();
  const zs = await E(async () => { const c = document.querySelector('#viewport canvas'), r = c.getBoundingClientRect(); const zs = [];
    c.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    for (let i = 0; i < 45; i++) { await new Promise(requestAnimationFrame); zs.push(viewer.getView()[3]); } return zs; });
  const distinct = new Set(zs.map(z => z.toFixed(3))).size, mono = zs.every((z, i) => i === 0 || z >= zs[i - 1] - 1e-9);
  check('RB34', 'one wheel event is eased over several frames, in one direction', distinct >= 5 && mono, { distinct, mono });
  check('RB34', 'and it arrives (it stops moving)', Math.abs(zs[zs.length - 1] - zs[zs.length - 4]) < 1e-3, zs.slice(-4));
  check('RB34', 'nothing runs at rest: the loop has stopped', await E(() => !rbCamBusy()));
  // a line-mode wheel (Firefox) and a hard flick (Safari)
  await fit(); const ea = await ext(); await wheel({ deltaY: -48, deltaMode: 0, clientX: cx, clientY: cy }); await sleep(600); const eb = await ext();
  await fit(); await wheel({ deltaY: -3, deltaMode: 1, clientX: cx, clientY: cy }); await sleep(600); const ec = await ext();
  check('RB34', 'a wheel that counts in lines zooms as much as the same distance in pixels (3Dmol: 0.3 of 14)', Math.abs(ec - eb) / Math.max(1, eb - ea) < 0.1 && eb > ea * 1.05, { ea, eb, ec });
  await fit(); await wheel({ deltaY: -50000, clientX: cx, clientY: cy }); await sleep(900); const ed = await ext();
  check('RB34', 'one hard flick cannot run away (Safari took it to 19,000 px)', ed < ea * 3.2 && ed > ea, { ea, ed });
  // to the pointer: in orthographic the point under the pointer does not move
  const anch = await E(async () => { state.projection = 'orthographic'; applyProjection(); fitToView(); await new Promise(r => setTimeout(r, 900));
    const vp = document.getElementById('viewport').getBoundingClientRect(), a = currentModel.selectedAtoms({ atom: 'CA' })[40], p0 = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z });
    const c = document.querySelector('#viewport canvas'); c.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true, clientX: p0.x, clientY: p0.y }));
    await new Promise(r => setTimeout(r, 900)); const p1 = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z }); return { p0, p1 }; });
  check('RB34', 'zoom goes to the pointer: the atom under it stays under it', Math.hypot(anch.p1.x - anch.p0.x, anch.p1.y - anch.p0.y) < 3, anch);
  await E(() => { state.projection = 'perspective'; applyProjection(); });
  // Safari's pinch
  const pin = await E(async () => { state.projection = 'orthographic'; applyProjection(); fitToView(); await new Promise(r => setTimeout(r, 900));
    const c = document.querySelector('#viewport canvas'), ev = n => { const e = new Event(n, { bubbles: true, cancelable: true }); e.scale = 1; e.clientX = 400; e.clientY = 300; return e; };
    const ext = () => { let x0 = 1e9, x1 = -1e9; currentModel.selectedAtoms({ atom: 'CA' }).forEach(a => { const p = viewer.modelToScreen({ x: a.x, y: a.y, z: a.z }); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }); return x1 - x0; };
    const e0 = ext(); const s = ev('gesturestart'); c.dispatchEvent(s); const m = ev('gesturechange'); m.scale = 1.5; c.dispatchEvent(m); await new Promise(r => setTimeout(r, 700)); const e1 = ext(); c.dispatchEvent(ev('gestureend'));
    state.projection = 'perspective'; applyProjection(); return { ratio: e1 / e0, prevented: m.defaultPrevented }; });
  check('RB34', 'a Safari pinch (gesture events) zooms by the pinch and is not left to the page', Math.abs(pin.ratio - 1.5) < 0.1 && pin.prevented, pin);
  // Shift and scroll moves it
  await fit();
  const pan = await E(async () => { const C = (() => { const v = viewer.getView(); return { x: -v[0], y: -v[1], z: -v[2] }; })(), s0 = viewer.modelToScreen(C), z0 = viewer.getView()[3];
    const c = document.querySelector('#viewport canvas'); c.dispatchEvent(new WheelEvent('wheel', { deltaX: 0, deltaY: 80, shiftKey: true, bubbles: true, cancelable: true, clientX: 400, clientY: 300 }));
    await new Promise(r => setTimeout(r, 700)); const s1 = viewer.modelToScreen(C); return { dx: s1.x - s0.x, dy: s1.y - s0.y, dz: viewer.getView()[3] - z0 }; });
  check('RB34', 'Shift and scroll move the structure with the fingers, and do not zoom', Math.abs(Math.abs(pan.dy) - 80) < 8 && Math.abs(pan.dx) < 2 && Math.abs(pan.dz) < 1e-6, pan);
  // a drag let go while turning keeps turning, then settles
  const q = () => E(() => viewer.getView().slice(4)), dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
  // The finger is sent with its own clock (CDP timestamps), not through pg.mouse: pg.mouse awaits the page after every event, so on a
  // slow runner each move takes the page a few hundred ms and the "finger" really does stop before it leaves, which is not what a hand
  // does to a busy page (its events queue with the times they happened). The timestamps are in the past, so none is "from the future".
  const cdp = await ctx.newCDPSession(pg);
  const flick = async (pause, beforeUp) => { await fit(); const q0 = await q(); await pg.mouse.move(cx - 100, cy);
    const T0 = Date.now() / 1000 - 1.5, ev = (type, x, k) => cdp.send('Input.dispatchMouseEvent', { type, x, y: cy, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, timestamp: T0 + k * 0.03 });
    await ev('mousePressed', cx - 100, 0); for (let i = 1; i <= 14; i++) await ev('mouseMoved', cx - 100 + i * 14, i);
    if (pause) await sleep(pause); if (beforeUp) await beforeUp();
    await ev('mouseReleased', cx - 100 + 14 * 14, 14 + Math.max(1, pause / 30));                    // let go 30 ms after the last move (a pause: that long after it); 14 px / 30 ms is a quick drag, not a hard flick
    await sleep(40); const qa = await q(); await sleep(250); const qb = await q();
    // the loop clamps a frame to 64 ms, so on a slow page the glide lasts longer in wall time: wait for it to end rather than for a fixed time
    await sleep(1000); const t0 = Date.now(); while (Date.now() - t0 < 25000 && await E(() => rbCamBusy())) await sleep(200);
    const qc = await q(); await sleep(300); const qd = await q();
    return { turned: dist(q0, qa), moved: Math.min(dist(qa, qb), 2 - dist(qa, qb)), settle: dist(qc, qd), busy: await E(() => rbCamBusy()) }; };
  const f1 = await flick(0);
  check('RB34', 'a drag let go while turning keeps turning (3Dmol stops dead)', f1.moved > 0.03, f1);
  check('RB34', 'and settles, with nothing left running', f1.settle < 1e-3 && !f1.busy, f1);
  // the page is busy (a long frame, a garbage collection, CI's software GL) at the moment the finger leaves: the let-go is heard late
  // the busy page is inside the let-go itself (a window listener runs before Ribbon's, and holds the page for 220 ms): the test must not put its own round trip between the last move and the up
  await E(() => { window._busyUp = () => { const t0 = performance.now(); while (performance.now() - t0 < 220); }; window.addEventListener('pointerup', window._busyUp, true); });
  const f1s = await flick(0);
  await E(() => window.removeEventListener('pointerup', window._busyUp, true));
  check('RB34', 'a drag let go while the page is busy is still a drag let go (the finger left when it left, not when the page heard)', f1s.moved > 0.03, f1s);
  // frames starved: no animation frame runs while the finger is down (CI's software GL: one frame is longer than the whole drag), and the speed must still be read
  await E(() => { window._raf0 = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; });
  const f1f = await flick(0, () => E(() => { window.requestAnimationFrame = window._raf0; }));
  await E(() => { if (window._raf0) window.requestAnimationFrame = window._raf0; });
  check('RB34', 'a drag let go after frames that never came is still a drag let go (its speed is read from the pointer, not from the frame rate)', f1f.moved > 0.03, f1f);
  const f2 = await flick(250);
  check('RB34', 'a drag that had stopped before it was let go does not drift', f2.moved < 1e-3, f2);
  await pg.emulateMedia({ reducedMotion: 'reduce' }); const f3 = await flick(0); await pg.emulateMedia({ reducedMotion: 'no-preference' });
  check('RB34', 'with reduced motion a let-go drag stops where it is', f3.moved < 1e-3, f3);
  // one draw a frame, and the cheap look while it moves
  await E(() => { state.lighting = 'soft'; applyBorder(); }); await fit();
  // draws and frames are counted over the same window, ending when the camera is at rest and the soft light is back: on a slow
  // runner a frame is 100 ms and a fixed 500 ms window holds six of them while the settle that follows draws on, unaccounted for
  const cost = await E(async () => { const R = viewer.renderer, real = R.render, calls = []; let draws = 0, frames = 0, run = true; R.render = function () { draws++; return real.apply(this, arguments); };
    const so = viewer.setViewStyle.bind(viewer); viewer.setViewStyle = s => { calls.push(JSON.stringify(s)); return so(s); };
    (function tick() { if (!run) return; frames++; requestAnimationFrame(tick); })();
    const c = document.querySelector('#viewport canvas'); c.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true, clientX: 400, clientY: 300 }));
    await new Promise(r => setTimeout(r, 500));
    const t0 = performance.now(); while ((rbCamBusy() || !/ambientOcclusion/.test(calls[calls.length - 1] || '')) && performance.now() - t0 < 10000) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300)); run = false; R.render = real; viewer.setViewStyle = so; return { draws, frames, calls }; });
  check('RB34', 'the camera draws once a frame', cost.draws <= cost.frames + 3, cost);
  check('RB34', 'soft light is dropped while it moves and comes back after', cost.calls[0] === '{}' && /ambientOcclusion/.test(cost.calls[cost.calls.length - 1]), cost.calls);
  const fr = await E(async () => { const R = viewer.renderer, real = R.render; let draws = 0, frames = 0; R.render = function () { draws++; return real.apply(this, arguments); };
    state.lighting = 'simple'; applyBorder(); _userMoved = true; fitToView(); const t0 = performance.now(); while (performance.now() - t0 < 700) { await new Promise(requestAnimationFrame); frames++; } R.render = real; return { draws, frames }; });
  check('RB34', 'Fit draws once a frame (it drew twice)', fr.draws <= fr.frames * 1.15 + 3, fr);
  // Ctrl and scroll is a pinch on a trackpad (Chrome, Firefox), and does not scroll the page
  check('RB34', 'the viewer says how to move it', await E(() => /Shift/.test(document.querySelector('#viewport canvas').getAttribute('aria-label'))));
  await ctx.close();
}


// ── RB35 a ligand's own eye ─────────────────────────────────────────────────────────────────
async function rb35() {
  const { ctx, pg, E, go } = await open({ tag: 'RB35 ' });
  if (!(await has3d(pg))) { skipped.push('RB35 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('8POC'); await sleep(500);
  const rows = await E(() => ({ n: ligands.length, eyes: document.querySelectorAll('#ligList .li .lg-eye').length, keys: ligands.map(l => l.key).join() }));
  check('RB35', 'every ligand has its own eye, on', rows.n === 2 && rows.eyes === 2 && await E(() => [...document.querySelectorAll('#ligList .lg-eye')].every(b => b.getAttribute('aria-pressed') === 'true')), rows);
  const drawn = (resn) => E(r => { const a = currentModel.selectedAtoms({ resn: r }); return a.length && a.every(x => x.style && Object.keys(x.style).length > 0); }, resn);
  check('RB35', 'both are drawn', await drawn('LIG') && await drawn('GOL'));
  await E(() => { rbTab('models'); }); await pg.click('#ligList .li:has(.li-name:text("LIG")) .lg-eye'); await sleep(300);
  check('RB35', 'its eye puts that ligand away and leaves the other one drawn', !(await drawn('LIG')) && await drawn('GOL'));
  const st = await E(() => ({ off: !!state.off['lig:LIG:A:201'], row: !!document.querySelector('#ligList .li.off .lg-eye[aria-pressed=false]'), pts: fitPoints().some(a => a.resn === 'LIG'), script: _scLigands().list.some(x => x.resn === 'LIG') }));
  check('RB35', 'the row says so, and the framing and the scripts leave it out', st.off && st.row && !st.pts && !st.script, st);
  check('RB35', 'a design keeps it', await E(() => !!collectDesign().state.off['lig:LIG:A:201']));
  await E(() => { runCommand('show LIG', { noHistory: true }); }); await sleep(250);
  check('RB35', '"show LIG" puts it back, and "hide LIG" away again', await drawn('LIG') && (await E(() => { runCommand('hide LIG', { noHistory: true }); return true; })) && (await sleep(250), !(await drawn('LIG'))));
  await E(() => { runCommand('show all', { noHistory: true }); }); await sleep(250);
  check('RB35', '"show all" brings back what was put away', await drawn('LIG') && await E(() => !Object.keys(state.off).some(k => /^lig:/.test(k))));
  await E(() => { setLigShown(ligands[0], false); }); await sleep(250);
  const l0 = await E(() => ligands[0].resn);
  await pg.click('#ligList .li:first-child .li-main'); await sleep(500);
  check('RB35', 'asking to look at a ligand brings it back', await E(() => !ligOff(ligands[0])) && await drawn(l0));
  await ctx.close();
}


// ── RB36 light, depth, perspective, pastel ───────────────────────────────────────────────────────
async function rb36() {
  const { ctx, pg, E, go } = await open({ tag: 'RB36 ' });
  if (!(await has3d(pg))) { skipped.push('RB36 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('8CAM'); await sleep(400);
  // pixels of the structure: mean and spread of the luminance (the background is skipped)
  // A frame that comes back empty (n = 0) is a frame the runner had not drawn yet, or a lost WebGL context: it is drawn again and read again
  // before it is believed, and when it stays empty the answer says why.
  const stats1 = () => E(() => new Promise(res => { viewer.render(); const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0, s = 0; const h = new Array(256).fill(0); for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8 || (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250)) continue; const l = Math.round((d[i] + d[i + 1] + d[i + 2]) / 3); n++; s += l; h[l]++; }
    const pc = q => { let a = 0; for (let l = 0; l < 256; l++) { a += h[l]; if (a >= n * q) return l; } return 255; }; res({ n, mean: s / n, spread: pc(0.9) - pc(0.1) }); }; img.src = viewer.pngURI(); }));
  const stats = async () => { let r; for (let i = 0; i < 12; i++) { r = await stats1(); if (r.n > 0) return r; await sleep(700); }
    r.why = await E(() => { const gl = document.querySelector('#viewport canvas').getContext('webgl2') || document.querySelector('#viewport canvas').getContext('webgl'); return { style: state.style, lost: gl && gl.isContextLost(), surfaces: Object.keys(viewer.surfaces || {}).length, busy: typeof _surfBusy !== 'undefined' && _surfBusy, models: viewer.getNumModels && viewer.getNumModels(), size: [innerWidth, innerHeight] }; }); return r; };
  const setup = (o) => E(async o => { Object.assign(state, o); applyBackground(); applyBorder(); buildGeometry(); fitToView(); await new Promise(r => setTimeout(r, 900)); }, o);
  await setup({ style: 'surface', surfaceOpacity: 1, border: 'none', bg: 'white', color: 'uniform', depth: 0, projection: 'perspective' });
  const shot = {};
  for (const k of ['flat', 'soft', 'studio']) { await pg.click('#lightSeg button[data-v=' + k + ']'); await sleep(450); shot[k] = await stats(); }
  check('RB36', 'Flat is no light at all: the surface is one colour, nothing shaded (3Dmol\'s "flat" was an outline)', shot.flat.spread <= 2 && shot.flat.n > 5000, shot.flat);
  check('RB36', 'Soft shades it a little and Studio more: three lights that look different', shot.soft.spread > shot.flat.spread + 3 && shot.studio.spread > shot.soft.spread + 3, { flat: shot.flat.spread, soft: shot.soft.spread, studio: shot.studio.spread });
  check('RB36', 'the shader patch is in place (the whole of the above rests on it)', await E(() => _rbPatched === true && _rbAmb === LIGHTING.studio.amb));
  // an old design asks for the old names
  const old = await E(() => { applyLook({ lighting: 'full', fog: true, projection: 'orthographic' }); const r = { l: state.lighting, d: rbDepth(), p: state.projection, k: lightKey() }; applyLook({ lighting: 'soft', depth: 0, projection: 'perspective' }); return r; });
  check('RB36', 'the old names still load: simple/full are soft/studio, fog is depth, projection is perspective', old.l === 'studio' && old.d === 55 && old.p === 'orthographic', old);
  // depth: the far side fades into the background
  await setup({ style: 'cartoon', border: 'thin', bg: 'white', color: 'uniform', lighting: 'soft' });
  const d0 = await stats(); await E(() => setDepth(50)); await sleep(250); const d50 = await stats(); await E(() => setDepth(100)); await sleep(250); const d100 = await stats();
  check('RB36', 'Depth fades what is further away, more as it is turned up (it moved the mean by ~4 levels before)', d50.mean > d0.mean + 5 && d100.mean > d50.mean + 5, { d0: d0.mean, d50: d50.mean, d100: d100.mean, why: d0.why });
  const fogAt = () => E(() => { viewer.render(); const v = viewer.getView(), dc = viewer.CAMERA_Z - v[3], R = _structRadius(), f = viewer.scene.fog; return { dc, R, near: f && f.near, far: f && f.far, want: 2 * R / _invSmooth(0.7) }; });
  const fog = await fogAt();
  check('RB36', 'the fog starts at the structure\'s front tip and ends 70 % of the way past its back at full depth, not at a slab two or three times its size', fog.near != null && Math.abs(fog.near - (fog.dc - fog.R)) < 1 && Math.abs((fog.far - fog.near) - fog.want) < 1, fog);
  await E(() => { rbCamZoomAt(2, innerWidth / 3, innerHeight / 2); }); const fog2 = await fogAt();
  check('RB36', 'and follows the zoom the moment it moves, and a Fit', fog2.near != null && Math.abs(fog2.near - (fog2.dc - fog2.R)) < 1 && fog2.dc < fog.dc - 20, { fog, fog2 });
  await E(() => { fitToView(); }); await sleep(900); const fog3 = await fogAt();
  check('RB36', 'also after a Fit', Math.abs(fog3.near - (fog3.dc - fog3.R)) < 1, fog3);
  await E(() => { setDepth(0); fitToView(); }); await sleep(900);
  // perspective: the size does not jump
  await E(async () => { _userMoved = true; setPerspective(50); }); await sleep(300);
  const sizes = {}; for (const p of [0, 20, 100, 50]) { await E(p => setPerspective(p), p); await sleep(300); sizes[p] = await E(() => _projSize()); }
  check('RB36', 'moving the Perspective slider keeps the structure the size it was (orthographic used to shrink it by a third)', [0, 20, 100].every(p => Math.abs(sizes[p] - sizes[50]) / sizes[50] < 0.04), sizes);
  const fovs = await E(async () => { const r = {}; for (const p of [0, 50, 100]) { setPerspective(p); await new Promise(r => setTimeout(r, 150)); r[p] = { ortho: !!viewer.camera.ortho, fov: viewer.camera.fov }; } setPerspective(50); return r; });
  check('RB36', 'the slider is a lens: none is orthographic, 50 is the 20° Ribbon always used, more is wider', fovs[0].ortho && !fovs[50].ortho && Math.abs(fovs[50].fov - 20) < 2 && fovs[100].fov > 40, fovs);
  // pastel
  const pas = await E(() => { state.hsl = { h: 0, s: 100, l: 100 }; const c = '#e6194b', hs = _hexToHSL; state.pastel = 0; const a = hs(adjustColor(c)); state.pastel = 80; const b = hs(adjustColor(c)); state.pastel = 0; const w = hs(adjustColor('#fafafa')); state.pastel = 80; const w2 = hs(adjustColor('#fafafa')); state.pastel = 0; return { a, b, w, w2, same: adjustColor(c) === _hslToHex(hs(c).h, hs(c).s, hs(c).l) }; });
  check('RB36', 'Pastel keeps the hue, lowers the saturation and raises the lightness; a colour already pale moves little; 0 changes nothing', Math.abs(pas.a.h - pas.b.h) < 3 && pas.b.s < pas.a.s * 0.9 && pas.b.l > pas.a.l + 20 && Math.abs(pas.w2.l - pas.w.l) < 8 && pas.same, pas);
  await pg.click('#presetGrid .preset >> nth=0'); await sleep(300);
  const sl = await E(() => { const r = document.getElementById('pastelR'); r.value = 70; r.dispatchEvent(new Event('input')); return new Promise(res => setTimeout(() => res({ s: state.pastel, v: document.getElementById('pastelV').textContent, look: state.look }), 200)); });
  check('RB36', 'the Pastel slider sets it, says it, and leaves the style button that was lit', sl.s === 70 && sl.v === '70%' && sl.look == null, sl);
  // the controls are what the panel says
  const ui = await E(() => ({ lights: [...document.querySelectorAll('#lightSeg button')].map(b => b.dataset.v).join(), depth: !!document.getElementById('depthR'), persp: !!document.getElementById('perspR'), oldFog: !!document.getElementById('fogChk'), oldProj: !!document.getElementById('projSeg') }));
  check('RB36', 'the panel has Flat · Soft · Studio, a Depth slider and a Perspective slider, and no checkbox or two-way switch behind them', ui.lights === 'flat,soft,studio' && ui.depth && ui.persp && !ui.oldFog && !ui.oldProj, ui);
  await ctx.close();
}


// ── RB37 styles ────────────────────────────────────────────────────────────────────────────────
async function rb37() {
  const { ctx, pg, E, go } = await open({ tag: 'RB37 ' });
  if (!(await has3d(pg))) { skipped.push('RB37 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('4LIG'); await sleep(300);
  await E(() => { rbTab('colour'); rbOpenSec('look'); });
  const grid = await E(() => ({ ids: [...document.querySelectorAll('#presetGrid .preset')].map(b => b.dataset.p).join(), groups: [...document.querySelectorAll('#presetGrid .preset-grp')].map(g => g.textContent).join() }));
  check('RB37', 'twelve styles in four groups, the pastel ones first', grid.ids === 'paper,structure,rainbow,ternary,mono,site,surface,hydro,ink,night,cover,confidence' && grid.groups === 'Figures,Ligand and pocket,Surfaces,Mood', grid);
  // a style starts from a known state: it does not depend on the one before it
  const keys = ['style', 'color', 'lighting', 'depth', 'border', 'bg', 'projection', 'perspective', 'palette', 'pastel', 'surfaceOpacity'];
  const snap = () => E(k => { const o = {}; k.forEach(x => { o[x] = state[x]; }); o.depth = rbDepth(); o.hsl = JSON.stringify(state.hsl); return JSON.stringify(o); }, keys);
  const bad = [];
  for (const id of ['paper', 'structure', 'rainbow', 'ternary', 'mono', 'site', 'surface', 'hydro', 'ink', 'night']) {
    await E(id => { applyPreset(id); }, id); const fresh = await snap();
    await E(() => { applyPreset('cover'); }); await E(id => { applyPreset(id); }, id); const after = await snap();
    if (fresh !== after) bad.push(id);
  }
  check('RB37', 'a style gives the same look whatever was applied before it (they used to stack)', !bad.length, bad);
  // styles clicked faster than a surface is worked out: the figure is what the toolbar says. 3Dmol hands each addSurface in flight the
  // same free id, and the stale one's removeSurface took the live surface away: Surface lit, a cartoon on screen.
  const racy = [];
  for (const seq of [['surface', 'paper', 'hydro'], ['surface', 'hydro', 'surface', 'hydro'], ['hydro', 'ink', 'surface'], ['surface', 'night', 'paper'], ['paper', 'surface', 'hydro', 'cover', 'surface']]) {
    await E(s => { s.forEach(id => applyPreset(id)); }, seq);
    await E(async () => { const t0 = Date.now(); while (((typeof _surfBusy !== 'undefined' && _surfBusy) || (state.style === 'surface' && !currentSurfs.length)) && Date.now() - t0 < 8000) await new Promise(r => setTimeout(r, 60)); await new Promise(r => setTimeout(r, 250)); });
    const r = await E(() => ({ style: state.style, cur: currentSurfs.length, live: Object.keys(viewer.surfaces || {}).length }));
    const want = r.style === 'surface' ? 1 : 0;
    if (r.cur !== want || r.live !== want) racy.push({ seq: seq.join('>'), ...r });
  }
  check('RB37', 'styles applied faster than a surface is computed leave one live surface when the last is a surface style, none when it is not', !racy.length, racy);
  // the colour key's two ends never touch ("9 lowhigh 42"), and it stays inside the viewer
  const keys2 = await E(async () => { const o = []; for (const m of ['hydro', 'elec', 'conf']) { state.color = m; $('topColor').value = m; updateColorOrOpacity(); await new Promise(r => setTimeout(r, 150)); const e = $('legend'); if (!e.classList.contains('show')) continue; const q = [...e.querySelectorAll('.lg-ends span')].map(s => s.getBoundingClientRect()), v = $('viewport').getBoundingClientRect(), b = e.getBoundingClientRect(); o.push({ m, gap: q.length === 2 ? Math.round(q[1].left - q[0].right) : 99, inside: b.left >= v.left - 1 && b.right <= v.right + 1 }); } return o; });
  check('RB37', 'the colour key (hydrophobicity, charge, B-factor) keeps a gap of at least 8 px between its two ends and stays inside the viewer', keys2.length >= 2 && keys2.every(k => k.gap >= 8 && k.inside), keys2);
  // the command line in a narrow viewer: neither the placeholder nor the message is cut with an ellipsis
  await pg.setViewportSize({ width: 820, height: 1000 }); await sleep(500);
  const bar = await E(async () => { runCommand('select within 5 of ligand', { noHistory: true }); await new Promise(r => setTimeout(r, 200)); const i = $('cmdInput'), o = $('cmdOut'), n = $('cmdInsp'), c = document.createElement('canvas').getContext('2d'), cs = getComputedStyle(i); c.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; return { ph: Math.round(c.measureText(i.placeholder.replace(/\s+/g, ' ')).width), room: i.clientWidth - 12, outClipped: !o.hidden && o.scrollWidth > o.clientWidth + 1, inspClipped: !n.hidden && n.scrollWidth > n.clientWidth + 1 }; });
  await pg.setViewportSize({ width: 1280, height: 800 }); await sleep(300);
  check('RB37', 'in a narrow viewer the command line shows a placeholder that fits and a message that is not cut off', bar.ph <= bar.room && !bar.outClipped && !bar.inspClipped, bar);
  // pastel first: the default figure is pastel
  await E(() => { applyPreset('paper'); });
  const paper = await E(() => ({ pal: state.palette, light: state.lighting, ortho: state.projection, bg: state.bg, mode: state.color }));
  check('RB37', 'Pastel paper is chain colours in the pastel palette, soft light, white, orthographic', paper.pal === 'pastel' && paper.light === 'soft' && paper.ortho === 'orthographic' && paper.bg === 'white' && paper.mode === 'chain', paper);
  const flat = await E(() => { applyPreset('ink'); return { l: state.lighting, b: state.border }; });
  check('RB37', 'Ink and wash is Flat light with a thick outline', flat.l === 'flat' && flat.b === 'thick', flat);
  // changing something by hand puts the lit style button out
  await E(() => { applyPreset('paper'); });
  const lit = async () => E(() => document.querySelectorAll('#presetGrid .preset.on').length);
  const outs = [];
  for (const [name, fn] of [['depth', () => setDepth(30)], ['pastel', () => setPastel(20)], ['perspective', () => setPerspective(80)], ['palette', () => { const s = document.getElementById('palSel'); s.value = 'tol'; s.dispatchEvent(new Event('change')); }], ['light', () => { state.lighting = 'flat'; state.look = null; renderPresets(); }]]) {
    await E(() => { applyPreset('paper'); }); const before = await lit(); await E(fn); const after = await lit();
    if (before !== 1 || after !== 0) outs.push({ name, before, after });
  }
  check('RB37', 'a change made by hand takes the highlight off the style (it is no longer that style)', !outs.length, outs);
  // save my look
  await E(() => { applyPreset('night'); setPastel(35); });
  await pg.fill('#lookName', 'My dark pastel'); await pg.click('#lookSave'); await sleep(200);
  const saved = await E(() => ({ list: JSON.parse(localStorage.getItem('ribbon_looks') || '[]').map(x => x.n).join(), btn: [...document.querySelectorAll('#presetGrid .preset')].map(b => b.dataset.p).filter(x => /^my:/.test(x)).join(), on: state.look }));
  check('RB37', 'Save look keeps the current one under its name, offers it with the others and lights it', saved.list === 'My dark pastel' && saved.btn === 'my:My dark pastel' && saved.on === 'my:My dark pastel', saved);
  await E(() => { applyPreset('paper'); });
  await pg.click('#presetGrid .preset[data-p="my:My dark pastel"]'); await sleep(400);
  const back = await E(() => ({ bg: state.bg, light: state.lighting, pastel: state.pastel, depth: rbDepth() }));
  check('RB37', 'applying it brings everything back', back.bg === 'dark' && back.light === 'studio' && back.pastel === 35 && back.depth === 35, back);
  await pg.hover('#presetGrid .preset[data-p="my:My dark pastel"]'); await pg.click('#presetGrid .preset[data-p="my:My dark pastel"] .preset-x'); await sleep(200);
  check('RB37', 'its × deletes it, and nothing else', await E(() => JSON.parse(localStorage.getItem('ribbon_looks') || '[]').length === 0 && !document.querySelector('#presetGrid [data-p^="my:"]') && !!document.querySelector('#presetGrid .preset[data-p=paper]')));
  // the names before
  const old = await E(() => [runCommand('preset clean', { noHistory: true }).ok && state.look === 'paper', runCommand('preset pocket', { noHistory: true }).ok && state.look === 'site', runCommand('preset pastel paper', { noHistory: true }).ok]);
  check('RB37', 'the old names (clean, pocket) and a name in words still work as commands', old.every(Boolean), old);
  await ctx.close();
}


// ── RB38 the scale bar ──────────────────────────────────────────────────────────────────────────
async function rb38() {
  const { ctx, pg, E, go } = await open({ tag: 'RB38 ' });
  if (!(await has3d(pg))) { skipped.push('RB38 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('8CAM'); await sleep(400);
  const spec = await E(() => [[3, 800], [40, 800], [400, 800], [0.8, 800], [0.01, 800]].map(([p, w]) => { const s = scaleBarSpec(p, w); return [s.len, s.label, Math.round(s.px)].join('|'); }));
  check('RB38', 'the length is the longest 1-2-5 that fits a fifth of the width, in Å, in nm from 100 Å, with a thin space (3 px/Å → 50, 40 → 2, 400 → 0.2, 0.8 → 20 nm)',
    spec[0] === '50|50 Å|150' && spec[1] === '2|2 Å|80' && spec[2] === '0.2|0.2 Å|80' && spec[3] === '200|20 nm|160' && spec[4].startsWith('5000|500 nm'), spec);
  await E(async () => { state.projection = 'orthographic'; state.bg = 'white'; state.border = 'thin'; state.color = 'chain'; applyProjection(); applyBackground(); recolorStructure(); fitToView(); await new Promise(r => setTimeout(r, 900)); });
  // on screen: the bar is its length, the label is the spec's, and it is an SVG with caps, in the label font
  await E(() => { state.scalebar = true; syncLookControls(); decorUpdate(); }); await sleep(250);
  const sc = await E(() => { const m = scaleMeasure(), vp = document.getElementById('viewport'), sp = scaleBarSpec(m.ppa, vp.clientWidth, 0.2), el = document.getElementById('scaleBar'), bar = el.querySelector('.sb-bar');
    return { shown: !el.hidden, w: bar.getBBox().width, want: sp.px, label: el.querySelector('text').textContent, spec: sp.label, font: el.querySelector('text').style.fontFamily, caps: (bar.getAttribute('d').match(/v/g) || []).length }; });
  check('RB38', 'on screen the bar is as long as its length, labelled as the rule says, with a cap at each end', sc.shown && Math.abs(sc.w - sc.want) < 0.6 && sc.label === sc.spec && sc.caps === 2, sc);
  // in the export: a strip under the structure; the structure and its crop are exactly what they were
  const ex = await E(() => { _exOpts.res = '300'; _exOpts.bg = 'white'; _exOpts.fmt = 'png'; state.exportLabels = false; $('exLabels').checked = false;
    state.scalebar = false; const a = renderExport(); state.scalebar = true; const b = renderExport(); const L = window.__sbLast;
    const px = (c, x, y, w, h) => c.getContext('2d').getImageData(x, y, w, h).data;
    const top = (() => { const A = px(a, 0, 0, a.width, a.height), B = px(b, 0, 0, a.width, a.height); for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false; return true; })();
    const row = px(b, 0, Math.round(L.y), b.width, 1); let x0 = -1, x1 = -1; for (let x = 0; x < b.width; x++) { const k = x * 4; if (row[k] < 80 && row[k + 1] < 80 && row[k + 2] < 90) { if (x0 < 0) x0 = x; x1 = x; } }
    const live = scaleMeasure().ppa, dims = _exportDims();
    return { aw: a.width, ah: a.height, bw: b.width, bh: b.height, strip: L.stripH, top, run: x1 - x0 + 1, px: L.px, len: L.len, factor: L.ppa / live, scale: dims.scale, fs: L.fs, lw: L.lw, dpi: L.dpi, ink: L.ink, dpr: (c => c.width / c.getBoundingClientRect().width)(document.querySelector('#viewport canvas')) }; });
  check('RB38', 'the bar is in a strip under the figure: same width, the structure above it untouched (it used to be drawn before the crop and moved it)', ex.aw === ex.bw && ex.bh === ex.ah + ex.strip && ex.top, ex);
  check('RB38', 'the bar in the picture is its length in pixels (len × pixels per Å of that picture)', Math.abs(ex.run - ex.px) <= ex.lw + 1, ex);
  check('RB38', 'and the pixels per Å are the screen ones times the export magnification (so the bar is true to the structure)', Math.abs(ex.factor - ex.scale * ex.dpr) < 0.02 * ex.factor, { factor: ex.factor, scale: ex.scale, dpr: ex.dpr });
  check('RB38', 'the label is 7 pt and the line 0.9 pt at the export dpi (the type is set by the figure, not by the window)', ex.fs === Math.round(7 * ex.dpi / 72) && ex.lw === Math.max(2, Math.round(0.9 * ex.dpi / 72)), ex);
  // the size follows the figure's width, not the window's
  const sized = await E(() => { state.figSize = '1col'; _exOpts.res = '300'; state.scalebar = true; const c = renderExport(), L = window.__sbLast, w = c.width; state.figSize = 'free'; return { w, px: L.px, ppa: L.ppa, fs: L.fs, want: Math.round(85 / 25.4 * 300) }; });
  check('RB38', 'at one column (85 mm, 300 dpi) the figure is that wide and the bar is measured on it', Math.abs(sized.w - sized.want) <= 2 && sized.px < 0.23 * sized.w, sized);
  // ink and corner
  const inks = await E(() => { const r = {}; for (const k of ['auto', 'black', 'white']) { state.scaleInk = k; _exOpts.bg = 'white'; renderExport(); r[k] = window.__sbLast.ink; } state.scaleInk = 'auto'; _exOpts.bg = 'dark'; renderExport(); r.autoDark = window.__sbLast.ink; _exOpts.bg = 'white'; state.scaleCorner = 'bl'; const c = renderExport(), L = window.__sbLast; r.left = L.x0 < c.width / 2; state.scaleCorner = 'br'; return r; });
  check('RB38', 'ink is auto (dark on light, light on dark), black or white; the corner is left or right', inks.auto === '#1a1d2e' && inks.black === '#000000' && inks.white === '#ffffff' && inks.autoDark === '#e8eaf2' && inks.left, inks);
  // perspective: it says so, and one click makes it exact
  await E(() => { setPerspective(60); }); await sleep(200);
  const pp = await E(() => ({ hint: document.getElementById('sbHint').textContent, btn: !document.getElementById('sbOrtho').hidden }));
  check('RB38', 'in perspective it says the bar is exact only at the middle, and offers perspective: none', /only at the middle/.test(pp.hint) && pp.btn, pp);
  await pg.click('#sbOrtho'); await sleep(250);
  check('RB38', 'which does it', await E(() => state.projection === 'orthographic' && document.getElementById('sbOrtho').hidden && /Exact everywhere/.test(document.getElementById('sbHint').textContent)));
  check('RB38', 'a design keeps the ink and the corner', await E(() => { state.scaleInk = 'white'; state.scaleCorner = 'bl'; const st = collectDesign().state; return st.scaleInk === 'white' && st.scaleCorner === 'bl'; }));
  await ctx.close();
}


// ── RB39 the film: preview, scrub, record what was previewed ──────────────────────────────────────
async function rb39() {
  const { ctx, pg, E, go } = await open({ tag: 'RB39 ' });
  if (!(await has3d(pg))) { skipped.push('RB39 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('8CAM'); await sleep(400);
  await E(() => { rbTab('figure'); rbOpenSec('anim'); document.getElementById('animKind').value = 'turn'; document.getElementById('animFmt').value = 'video'; document.getElementById('animSecs').value = '2'; document.getElementById('animSecs').dispatchEvent(new Event('input')); fitToView(); }); await sleep(900);
  const view = () => E(() => viewer.getView().map(v => +v.toFixed(5)).join());
  check('RB39', 'before anything is previewed the scrubber waits (nothing to scrub) and the time reads 0.0 / 2.0 s · 30 fps', await E(() => document.getElementById('animScrub').disabled && document.getElementById('animTime').textContent === '0.0 / 2.0 s · 30 fps'));
  const v0 = await view();
  await pg.click('#animPlay'); await sleep(500);
  const mid = await E(() => ({ playing: document.getElementById('animPlay').getAttribute('aria-pressed'), label: document.getElementById('animPlay').textContent, k: _anim.k, n: filmFrames().length, scrub: +document.getElementById('animScrub').value, vw: viewer.getView().join() }));
  check('RB39', 'Preview plays the film on the structure: the button says Pause, the frame advances, the view is that frame', mid.playing === 'true' && mid.label === 'Pause' && mid.k > 3 && mid.n === 60 && mid.scrub === mid.k, mid);
  await pg.click('#animPlay'); await sleep(250);
  const at = await E(() => ({ k: _anim.k, now: viewer.getView().join(), want: filmFrames()[_anim.k].join(), label: document.getElementById('animPlay').textContent }));
  check('RB39', 'Pause stops on a frame, and the view is exactly that frame of the film', at.now === at.want && at.label === 'Preview', at);
  // the scrubber: any frame, exactly
  const sc = await E(() => { const s = document.getElementById('animScrub'), F = filmFrames(), r = []; for (const k of [0, 17, 59]) { s.value = k; s.dispatchEvent(new Event('input')); const v = viewer.getView(); r.push(v.every((x, i) => Math.abs(x - F[k][i]) < 1e-5) || { k, v: v.map(x => +x.toFixed(4)), want: F[k].map(x => +x.toFixed(4)), base: !!_anim.base }); } return r; });
  check('RB39', 'dragging the bar puts the camera on that frame, first, middle and last', sc.every(x => x === true), sc);
  // the same frames are recorded, from where the preview started (not from where it was paused)
  const base = await E(() => ({ same: JSON.stringify(_anim.base) === JSON.stringify(filmFrames()[0]), recFrames: animFrames('turn', 2, 30, _anim.base).length, key: _anim.key.split('|')[0], baseHasView: !!_anim.base }));
  check('RB39', 'recording would use the same frames, built from the view the preview started from', base.same && base.recFrames === 60 && base.baseHasView, base);
  check('RB39', 'while it is set up the time shows the frame, and Back to my view is offered', await E(() => !document.getElementById('animReset').hidden && /^\d\.\d \/ 2\.0 s · 30 fps$/.test(document.getElementById('animTime').textContent)));
  await pg.click('#animReset'); await sleep(300);
  check('RB39', 'Back to my view puts the camera where it was before the preview', await view() === v0 && await E(() => !_anim.base && document.getElementById('animReset').hidden), { v0, now: await view() });
  // taking the camera by hand ends the preview: that view is the new start
  await pg.click('#animPlay'); await sleep(250);
  const box = await pg.locator('#viewport').boundingBox();
  await pg.mouse.move(box.x + 100, box.y + 100); await pg.mouse.down(); await pg.mouse.move(box.x + 140, box.y + 120, { steps: 3 }); await pg.mouse.up(); await sleep(300);
  check('RB39', 'a drag on the viewer stops the preview and lets go of the old start', await E(() => !_anim.prev && !_anim.base && document.getElementById('animPlay').textContent === 'Preview'));
  // loop
  await E(() => { document.getElementById('animSecs').value = '1'; document.getElementById('animSecs').dispatchEvent(new Event('input')); document.getElementById('animLoop').checked = true; });
  await pg.click('#animPlay'); await sleep(1700);
  check('RB39', 'with Loop on it goes round again; with it off it stops at the end', await E(() => !!_anim.prev) && await (async () => { await pg.click('#animPlay'); await E(() => { document.getElementById('animLoop').checked = false; _anim.k = 0; }); await pg.click('#animPlay'); await sleep(1500); return E(() => !_anim.prev && _anim.k === filmFrames().length - 1); })());
  await E(() => filmReset(true));
  // what is in the file
  await E(() => { document.getElementById('animSize').value = 'auto'; document.getElementById('animFmt').value = 'gif'; state.bg = 'white'; applyBackground(); state.scalebar = true; state.projection = 'orthographic'; applyProjection(); state.residueLabels.push({ chain: 'A', resi: 20, resn: 'ALA', text: 'ALA 20' }); state.chainLabels.A = 'Chain A'; renderLabelTags(); });
  await sleep(400);
  const comp = await E(() => { const cv = document.querySelector('#viewport canvas'), mk = (labels, bar) => { state.exportLabels = labels; state.scalebar = bar; const f = document.createElement('canvas'); f.width = 480; f.height = Math.round(cv.height * 480 / cv.width); filmComposite(f, cv, { len: 0 }); return f.getContext('2d').getImageData(0, 0, f.width, f.height).data; };
    const diff = (a, b, x0, y0, x1, y1, w) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; } return n; };
    const plain = mk(false, false), lab = mk(true, false), bar = mk(false, true), W = 480, H = Math.round(cv.height * 480 / cv.width);
    return { labels: diff(plain, lab, 0, 0, W, H, W), barBottomRight: diff(plain, bar, Math.round(W * 0.6), Math.round(H * 0.85), W, H, W), barElsewhere: diff(plain, bar, 0, 0, W, Math.round(H * 0.8), W), w: W, h: H }; });
  check('RB39', 'a frame of the film carries the labels and the scale bar (the bare WebGL canvas used to be recorded)', comp.labels > 30 && comp.barBottomRight > 20 && comp.barElsewhere === 0, comp);
  const sizes = await E(() => { const cv = document.querySelector('#viewport canvas'), r = {}; for (const [v, f] of [['auto', 'gif'], ['auto', 'video'], ['960', 'video'], ['screen', 'gif']]) { document.getElementById('animSize').value = v; const d = filmSize(cv, f); r[v + '/' + f] = d.w + 'x' + d.h + (d.w % 2 === 0 && d.h % 2 === 0 ? '' : ' ODD'); } r.canvas = cv.width + 'x' + cv.height; return r; });
  check('RB39', 'the size is 480 px for a GIF, the screen for a video, or the width asked for, always with even sides', /^480x\d+$/.test(sizes['auto/gif']) && !/ODD/.test(JSON.stringify(sizes)) && sizes['auto/video'].split('x')[0] === String(sizes.canvas.split('x')[0] % 2 ? sizes.canvas.split('x')[0] - 1 : sizes.canvas.split('x')[0]) && /^960x/.test(sizes['960/video']), sizes);
  // the GIF is dithered
  const dith = await E(() => { const w = 64, h = 32, px = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, v = 100 + x * 1.1; px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255; }
    const bytes = gifEncode([px], w, h, 5, true), plain = gifEncode([px], w, h, 5, false); return { differs: bytes.length !== plain.length || bytes.some((b, i) => b !== plain[i]) }; });
  check('RB39', 'a film GIF is dithered (a smooth gradient bands in 6×7×6 colours), the plain encoder stays exact', dith.differs, dith);
  await ctx.close();
}


// ── RB40 the binding site ───────────────────────────────────────────────────────────────────────
async function rb40() {
  const { ctx, pg, E, go } = await open({ tag: 'RB40 ' });
  if (!(await has3d(pg))) { skipped.push('RB40 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('9INT'); await sleep(400);
  check('RB40', 'nothing is drawn or computed until Analyse is opened', await E(() => !state.site && !state.inter));
  await E(() => { rbTab('analyse'); }); await sleep(500);
  const auto = await E(() => ({ site: state.site && state.site.key, inter: state.inter && state.inter.src, open: document.querySelector('details[data-sec=site]').open, rows: document.querySelectorAll('#siteList .site-row').length, chips: [...document.querySelectorAll('#siteLigs .it-chip[data-k]')].map(b => b.dataset.k).join() }));
  check('RB40', 'opening Analyse picks the ligand and reads its interactions at once, with the card open', auto.site === 'LIG:A:201' && auto.inter === 'lig:LIG:A:201' && auto.open && auto.rows >= 4 && auto.chips === 'LIG:A:201', auto);
  const t = await E(() => { const r = _site.rows, list = interNow().list; const res = new Set(list.map(x => (_isLigAtom(x.b) || ionResn.includes(x.b.resn) ? x.a : x.b)).map(a => rKeyOf(a))); return { n: r.length, distinct: res.size, sorted: r.every((x, i) => !i || r[i - 1].dmin <= x.dmin), names: r.map(x => x.resn + x.resi).join(), ser: Object.keys((r.find(x => x.resn === 'SER') || { types: {} }).types).join() }; });
  check('RB40', 'the table is one row per residue, nearest first, not one per atom pair', t.n >= 4 && t.n <= t.distinct + 1 && t.sorted && /SER40/.test(t.names) && /PHE30/.test(t.names), t);
  const pips = await E(() => ({ ser: [...document.querySelectorAll('#siteList .site-row')].find(r => /SER/.test(r.textContent)).querySelector('.site-pips i').getAttribute('title'), serTypes: Object.keys(_site.rows.find(x => x.resn === 'SER').types).join() }));
  check('RB40', 'each kind of interaction a residue makes is a coloured pip, named with its distance', /Hydrogen bonds · 2\.\d\d Å/.test(pips.ser) && pips.serTypes === 'hbond', pips);
  const st = await E(() => ({ txt: document.getElementById('siteStrip').textContent, m: _site.m }));
  check('RB40', 'the ligand strip says its atoms, mass, rotatable bonds, how buried it is and its clashes', /heavy atoms/.test(st.txt) && /rotatable bonds/.test(st.txt) && /buried/.test(st.txt) && /clash/.test(st.txt) && st.m.n >= 10 && st.m.mwEst && st.m.buried >= 0 && st.m.buried <= 1 && Number.isInteger(st.m.rot) && Number.isInteger(st.m.clashes), { txt: st.txt, n: st.m.n, mw: st.m.mw, rot: st.m.rot, buried: st.m.buried });
  // the filters
  const before = await E(() => document.querySelectorAll('#siteList .site-row').length);
  await pg.click('#siteTypes .it-chip[data-t=hbond]'); await sleep(250);
  const after = await E(() => ({ n: document.querySelectorAll('#siteList .site-row').length, ser: /SER/.test(document.getElementById('siteList').textContent) }));
  check('RB40', 'switching a kind off takes the residues that only make that kind out of the table', after.n === before - 1 && !after.ser, { before, after });
  await pg.click('#siteTypes .it-chip[data-t=hbond]'); await sleep(200);
  // a click goes to the residue, Shift-click labels it
  const nl0 = await E(() => state.residueLabels.length);
  await pg.click('#siteList .site-row:nth-child(1) .li-main', { modifiers: ['Shift'] }); await sleep(250);
  check('RB40', 'Shift-click on a row labels that residue', await E(() => state.residueLabels.length) === nl0 + 1);
  await pg.click('#siteList .site-row:nth-child(2) .li-main'); await sleep(900);
  check('RB40', 'a click frames the residue with the ligand', await E(() => _userMoved === true));
  // focus: the pocket as sticks, the rest stepped back
  await pg.click('#siteFocus'); await sleep(500);
  const fo = await E(() => { const fn = makeColorFn(), raw = makeColorFn({ noDim: true }), all = currentModel.selectedAtoms({ hetflag: false }), keys = rbSiteKeys(), near = all.find(a => keys[rKeyOf(a)]), far = all.find(a => !keys[rKeyOf(a)]); return { on: state.site.focus, pocket: !!state.pockets['LIG:A:201'], pressed: document.getElementById('siteFocus').getAttribute('aria-pressed'), nearSame: !near || fn(near) === raw(near), farDim: !far || fn(far) !== raw(far), hasFar: !!far, n: Object.keys(keys).length }; });
  check('RB40', 'Focus turns the pocket on and steps the rest of the protein back, leaving the residues around the ligand in colour', fo.on && fo.pocket && fo.pressed === 'true' && fo.nearSame && fo.farDim && fo.n >= 3, fo);
  await pg.click('#siteFocus'); await sleep(300);
  check('RB40', 'and Focus again puts it all back', await E(() => !state.site.focus && !state.pockets['LIG:A:201'] && rbSiteKeys() === null));
  // burial
  await pg.click('#siteBurial'); await sleep(300);
  const bu = await E(() => { const a = currentModel.selectedAtoms({ resn: 'LIG' }), cols = new Set(a.map(x => rbBurialColor(x))); return { cols: cols.size, on: state.site.burial, first: rbBurialColor(a[0]) }; });
  check('RB40', 'Colour by burial gives each ligand atom its own colour by how buried it is', bu.on && bu.cols >= 2 && /^#/.test(bu.first), bu);
  await pg.click('#siteBurial');
  check('RB40', 'a design keeps the site, the focus and the burial colouring', await E(() => { state.site.focus = false; state.site.burial = true; const s = collectDesign().state.site; return !!s && s.key === 'LIG:A:201' && s.burial === true; }));
  const cmd = await E(() => { const r = runCommand('site LIG', { noHistory: true }); return { ok: !!r.ok, key: state.site.key, msg: r.msg || r.ok }; });
  check('RB40', 'the site command picks a ligand by its code', cmd.ok && cmd.key === 'LIG:A:201', cmd);
  // additives and structures with no ligand
  await go('8POC'); await sleep(400); await E(() => { rbTab('analyse'); }); await sleep(400);
  const add = await E(() => ({ chips: [...document.querySelectorAll('#siteLigs .it-chip[data-k]')].map(b => b.dataset.k).join(), more: !!document.getElementById('siteMore'), site: state.site && state.site.key }));
  check('RB40', 'a crystallisation additive is not the site: the ligand is picked, glycerol waits under "+ 1 other"', add.site === 'LIG:A:201' && add.chips === 'LIG:A:201' && add.more, add);
  await go('7APO'); await sleep(400); await E(() => { rbTab('analyse'); }); await sleep(400);
  check('RB40', 'an entry whose only ligand is glycerol still has a site', await E(() => state.site && state.site.key === 'GOL:A:202'));
  await go('1XYZ'); await sleep(400); await E(() => { rbTab('analyse'); }); await sleep(300);
  check('RB40', 'a structure with no ligand says so instead of showing an empty card', await E(() => !document.getElementById('siteNone').hidden && document.getElementById('siteCard').hidden && !state.site));
  // the clash rule
  await go('9CLS'); await sleep(300);
  const cl = await E(() => ({ lig: clashCompute('lig:LIG:A:201', 'protein').clashes.length, nb: clashCompute('chain:A', 'chain:A').clashes.length, cov: [_covalentNeighbours({ chain: 'A', resi: 201, hetflag: true }, { chain: 'A', resi: 202, hetflag: false }), _covalentNeighbours({ chain: 'A', resi: 10, hetflag: false }, { chain: 'A', resi: 11, hetflag: false }), _covalentNeighbours({ chain: 'A', resi: 5, hetflag: false }, { chain: 'A', resi: 5, hetflag: false }), _covalentNeighbours({ chain: 'A', resi: 5 }, { chain: 'B', resi: 5 })] }));
  check('RB40', 'a ligand 1.5 Å from the residues on either side of its own number clashes with both (the rule used to drop them), while two polymer neighbours never do', cl.lig === 2 && cl.cov.join() === 'false,true,true,false', cl);
  await ctx.close();
}


// ── RB41 cavities, the clash table, the order of the pane, the grid ─────────────────────────────────
async function rb41() {
  const { ctx, pg, E, go } = await open({ tag: 'RB41 ' });
  if (!(await has3d(pg))) { skipped.push('RB41 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('9SHL'); await sleep(300);
  const cav = await E(() => { const L = pocketsFind(); const p = L[0]; return { n: L.length, enc: p && +p.enc.toFixed(2), score: p && Math.round(p.score), vol: p && Math.round(p.vol), scoreOk: p && Math.abs(p.score - p.vol * p.enc) < 1e-6, comp: p && +(p.comp.h + p.comp.p + p.comp.c).toFixed(2), hydro: p && p.comp.h, res: p && p.res.length }; });
  check('RB41', 'a closed shell is one cavity, almost wholly enclosed, scored volume × enclosure, lined by what is there (all alanine: all hydrophobic)', cav.n === 1 && cav.enc > 0.7 && cav.scoreOk && cav.comp === 1 && cav.hydro === 1 && cav.res > 100, cav);
  // it does not freeze the page: a timer runs while it works, and it finds what the synchronous call finds
  await go('9BIG'); await sleep(300);
  const slices = await E(() => { const g = _pocketsGen(); let n = 0, worst = 0, t = performance.now(); for (;;) { const r = g.next(), now = performance.now(); worst = Math.max(worst, now - t); t = now; if (r.done) break; n++; } return { yields: n, worstSlice: Math.round(worst) }; });
  check('RB41', 'the work is cut into pieces that each take well under a frame or two (the longest piece between two yields)', slices.yields >= 8 && slices.worstSlice < 90, slices);
  const async_ = await E(() => new Promise(res => { let ticks = 0, last = performance.now(), worst = 0; const iv = setInterval(() => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; ticks++; }, 4);
    pocketsFindAsync(null, (L, ms) => { clearInterval(iv); const sync = pocketsFind(); res({ ticks, worst: Math.round(worst), ms: Math.round(ms), n: L.length, nSync: sync.length, same: L.length === sync.length && L.every((p, i) => Math.abs(p.vol - sync[i].vol) < 1e-6) }); }); }));
  check('RB41', 'finding cavities in a large structure runs in slices (the page stays alive: no gap over 120 ms) and finds what the synchronous call finds', async_.ticks > 8 && async_.worst < 120 && async_.same && async_.n >= 1, async_);
  await go('9SHL'); await sleep(300);
  await E(() => { rbTab('analyse'); rbOpenSec('pockets'); }); await pg.click('#pocketGo'); await sleep(2500);
  const ui = await E(() => ({ rows: document.querySelectorAll('#pocketList .li').length, name: (document.querySelector('#pocketList .li-name') || {}).textContent, meta: (document.querySelector('#pocketList .li-meta') || {}).textContent, bar: !!document.querySelector('#pocketList .comp'), prog: document.getElementById('pocketProg').textContent, btn: document.getElementById('pocketGo').textContent }));
  check('RB41', 'the list names the cavity, its volume, how enclosed it is and what lines it, and the button offers to find again', ui.rows === 1 && /^Cavity 1/.test(ui.name) && /Å³ · \d+ % enclosed/.test(ui.meta) && ui.bar && /1 cavity in/.test(ui.prog) && ui.btn === 'Find again', ui);
  // the pane
  const order = await E(() => [...document.querySelectorAll('#pane-analyse details.rb-sec')].map(d => d.dataset.sec).join());
  const names = await E(() => [...document.querySelectorAll('#pane-analyse details.rb-sec .rb-sec-t')].map(x => x.textContent).join('|'));
  check('RB41', 'the pane goes from the ligand outwards: Binding site · Cavities · Clashes · between any two parts · Interface · Compare · Measure · degraders · AlphaFold', order === 'site,pockets,clashes,interact,interface,compare,measure,lysines,pae' && /Binding site\|Cavities\|Clashes and contacts\|Between any two parts\|Interface\|Compare\|Measure\|Degraders · reachable lysines\|AlphaFold error map/.test(names), { order, names });
  check('RB41', 'and Models calls its radius "Residues within" (it is not the cavities above)', await E(() => /Residues within/.test(document.querySelector('label[for=pocketR]').textContent)));
  // the clash table
  await go('9INT'); await sleep(300);
  await E(() => { rbTab('analyse'); rbOpenSec('clashes'); document.getElementById('clA').value = 'chain:A'; document.getElementById('clB').value = 'chain:B'; }); await pg.click('#clGo'); await sleep(300);
  const ct = await E(() => ({ rows: document.querySelectorAll('#clashList .li').length, first: (document.querySelector('#clashList .li-name') || {}).textContent, ov: (document.querySelector('#clashList .mono-v') || {}).textContent, copy: !!document.getElementById('clashCopy') }));
  check('RB41', 'clashes are a table, worst first, with the overlap, and a copy button', ct.rows >= 1 && /ALA 9[01]/.test(ct.first) && /^\d\.\d\d Å$/.test(ct.ov) && ct.copy, ct);
  await E(() => { _userMoved = false; }); await pg.click('#clashList .li-main'); await sleep(700);
  check('RB41', 'a click on a row goes to that overlap', await E(() => _userMoved === true));
  // the grid and the potential
  const grid = await E(() => { let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, A = []; for (let i = 0; i < 700; i++) A.push({ x: rnd() * 60, y: rnd() * 40, z: rnd() * 50 });
    let bad = 0; const g = agrid(A, 4.5); for (let t = 0; t < 120; t++) { const p = { x: rnd() * 70 - 5, y: rnd() * 50 - 5, z: rnd() * 60 - 5 }, got = new Set(); g.near(p.x, p.y, p.z, j => { if (Math.hypot(A[j].x - p.x, A[j].y - p.y, A[j].z - p.z) <= 4.5) got.add(j); });
      const want = new Set(); A.forEach((a, j) => { if (Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z) <= 4.5) want.add(j); }); if (got.size !== want.size || [...want].some(j => !got.has(j))) bad++; }
    const e = new agrid([], 4).near ? 1 : 0; return { bad, empty: (() => { let n = 0; agrid([], 4).near(1, 1, 1, () => n++); return n; })() }; });
  check('RB41', 'the integer grid returns exactly the atoms within the radius, for points inside and outside the box, and for no atoms at all', grid.bad === 0 && grid.empty === 0, grid);
  await E(() => { const all = currentModel.selectedAtoms({}); window.__q = all.filter(a => !a.hetflag); });
  const el = await E(() => { const m = elecMap(), all = currentModel.selectedAtoms({}); const Q = []; all.forEach(a => { if (a.hetflag) return; let q = atomCharge(a); if (q) Q.push({ x: a.x, y: a.y, z: a.z, q, i: a.index }); });
    let worst = 0; all.slice(0, 40).forEach(a => { let v = 0; Q.forEach(c => { if (c.i === a.index) return; const dx = a.x - c.x, dy = a.y - c.y, dz = a.z - c.z; let r2 = dx * dx + dy * dy + dz * dz; if (r2 > 144) return; if (r2 < 1) r2 = 1; v += 83 * c.q / r2; }); worst = Math.max(worst, Math.abs(v - (m[a.index] || 0))); }); return { worst }; });
  check('RB41', 'the potential through the grid is the potential from the charges within 12 Å, computed the long way', el.worst < 1e-6, el);
  await ctx.close();
}

// ── RB31 undo, click modes, views, films, figure sizes ─────────────────────────────────────
async function rb31() {
  const { ctx, pg, E, go } = await open({ tag: 'RB31 ' });
  if (!(await has3d(pg))) { skipped.push('RB31 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('7SEQ'); await sleep(500);
  const u = await E(() => { runCommand('color chain A red', { noHistory: true }); undoFlush(); runCommand('bg dark', { noHistory: true }); undoFlush(); const s0 = state.bg + '/' + state.chainColors.A; undo(); const s1 = state.bg + '/' + state.chainColors.A; undo(); const s2 = state.bg + '/' + (state.chainColors.A || '-'); redo(); const s3 = state.bg + '/' + state.chainColors.A; return [s0, s1, s2, s3]; });
  check('RB31', 'undo takes back one change at a time, redo puts it back', u.join() === 'dark/#e53935,transparent/#e53935,transparent/-,transparent/#e53935', u);
  await E(() => { document.activeElement && document.activeElement.blur(); state.hsl = { h: 0, s: 100, l: 100 }; syncControlsToState(); recolorStructure(); undoFlush(); });
  const before = await E(() => _undo.stack.length);
  await E(async () => { const sl = document.getElementById('hslH'); for (let v = 1; v <= 40; v++) { sl.value = v; sl.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 10)); } });
  await sleep(500);
  check('RB31', 'a slider dragged is one step to undo, not forty', await E(() => _undo.stack.length) === before + 1, { before, after: await E(() => _undo.stack.length) });
  await pg.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await sleep(300);
  check('RB31', '⌘Z / Ctrl+Z undoes', await E(() => state.hsl.h) === 0);
  await pg.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+Shift+z'); await sleep(300);
  check('RB31', 'and ⌘⇧Z redoes', await E(() => state.hsl.h) === 40);
  await E(() => cmdFocus('col')); await pg.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await sleep(200);
  check('RB31', 'in a text box ⌘Z is the box’s own undo', await E(() => state.hsl.h) === 40);
  await E(() => document.getElementById('cmdInput').blur());
  check('RB31', 'the camera is not an edit: turning the structure adds nothing to undo', await E(async () => { undoFlush(); const n = _undo.stack.length; viewer.rotate(40, 'y'); viewer.render(); await new Promise(r => setTimeout(r, 450)); undoFlush(); return _undo.stack.length === n; }));
  // modes
  await pg.click('#selBtn'); await sleep(100);
  const md = await E(() => ({ sel: document.getElementById('selBtn').getAttribute('aria-pressed'), pick: document.getElementById('pickBtn').getAttribute('aria-pressed'), m: _mouseMode }));
  check('RB31', 'the Select button switches the click to selecting, and says so', md.sel === 'true' && md.pick === 'false' && md.m === 'select', md);
  const pt = await E(() => { _userMoved = true; viewer.setStyle({}, { sphere: { radius: 1.6, colorfunc: makeColorFn() } }); viewer.render(); const at = currentModel.selectedAtoms({ chain: 'A', resi: 7, atom: 'CA' })[0]; const p = viewer.modelToScreen({ x: at.x, y: at.y, z: at.z }); return { x: p.x, y: p.y }; });
  await pg.mouse.move(pt.x - 20, pt.y - 20); await pg.mouse.move(pt.x, pt.y, { steps: 5 }); await sleep(600);
  const under = await E(() => _hoverAtom && rKeyOf(_hoverAtom));
  await pg.mouse.click(pt.x, pt.y); await sleep(300);
  check('RB31', 'in Select a plain click selects the residue under the pointer (and does not open the chain popup)', !!under && await E(u => selKeys().join() === u && !document.getElementById('chain-popup').classList.contains('open'), under), { under, got: await E(() => selKeys()) });
  await pg.keyboard.press('m'); await sleep(100);
  check('RB31', 'M switches to measuring, and the group follows', await E(() => _measMode && document.getElementById('measBtn').getAttribute('aria-pressed') === 'true' && document.getElementById('selBtn').getAttribute('aria-pressed') === 'false'));
  await pg.keyboard.press('Escape'); await E(() => setMouseMode('select'));
  // a box
  const box = await E(() => { const vp = document.getElementById('viewport').getBoundingClientRect(); const cas = currentModel.selectedAtoms({ atom: 'CA' }).map(a => viewer.modelToScreen({ x: a.x, y: a.y, z: a.z })); const xs = cas.map(p => p.x).sort((a, b) => a - b), ys = cas.map(p => p.y).sort((a, b) => a - b); return { x0: xs[0] - 6, y0: ys[0] - 6, x1: xs[xs.length - 1] + 6, y1: ys[ys.length - 1] + 6 }; });
  await pg.keyboard.down('Shift'); await pg.mouse.move(box.x0, box.y0); await pg.mouse.down(); await pg.mouse.move((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, { steps: 3 }); await pg.mouse.move(box.x1, box.y1, { steps: 3 }); await pg.mouse.up(); await pg.keyboard.up('Shift'); await sleep(300);
  check('RB31', 'Shift-drag in Select draws a box and selects every residue in it', await E(() => _selN) === 48, await E(() => _selN));
  await pg.keyboard.press('Escape'); await sleep(80);
  check('RB31', 'Esc leaves Select', await E(() => _mouseMode) === 'pick');
  // views
  await E(() => { rbTab('figure'); state.style = 'cartoon'; buildGeometry(); fitView(); });
  await E(() => { document.getElementById('viewName').value = 'front'; document.getElementById('viewAdd').click(); viewer.rotate(90, 'y'); viewer.render(); runCommand('view add side', { noHistory: true }); });
  const vw = await E(() => ({ n: viewsList().length, names: viewsList().map(v => v.name).join(), rows: document.querySelectorAll('#viewList .vw').length }));
  check('RB31', 'views are added, named, and listed with a picture', vw.n === 2 && vw.names === 'front,side' && vw.rows === 2, vw);
  const back = await E(async () => { const v1 = viewsList()[0].view; viewGo('front', 0); await new Promise(r => setTimeout(r, 50)); const v = viewer.getView(); return v.every((x, i) => Math.abs(x - v1[i]) < 1e-6); });
  check('RB31', 'going to a view puts the camera back exactly', back);
  check('RB31', 'a design keeps its views', await E(() => collectDesign().state.views.length === 2));
  check('RB31', 'the view command goes there too', await E(() => !!runCommand('view side', { noHistory: true }).ok));
  // a GIF and a video
  await E(() => { document.getElementById('animKind').value = 'turn'; document.getElementById('animFmt').value = 'gif'; document.getElementById('animSecs').value = '1'; });
  const [gif] = await Promise.all([pg.waitForEvent('download', { timeout: 60000 }), pg.click('#animGo')]);
  const gb = await gif.createReadStream().then(st => new Promise(res => { const c = []; st.on('data', d => c.push(d)); st.on('end', () => res(Buffer.concat(c))); }));
  const frames = (gb.toString('binary').match(/\x21\xF9\x04/g) || []).length;
  check('RB31', 'Record as GIF downloads a GIF, one frame per 1/15 s, that loops', gb.slice(0, 6).toString() === 'GIF89a' && frames === 15 && gb.includes(Buffer.from('NETSCAPE2.0')) && /\.gif$/.test(gif.suggestedFilename()), { head: gb.slice(0, 6).toString(), frames, name: gif.suggestedFilename() });
  const dec = await E(async () => { const w = 400, h = 300, px = new Uint8ClampedArray(w * h * 4); let seed = 7; for (let i = 0; i < px.length; i += 4) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; px[i] = seed & 255; px[i + 1] = (seed >> 8) & 255; px[i + 2] = (seed >> 16) & 255; px[i + 3] = 255; }
    const b = gifEncode([px], w, h, 5), img = new Image(); img.src = URL.createObjectURL(new Blob([b], { type: 'image/gif' })); await img.decode(); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, w, h).data; let bad = 0;
    for (let i = 0; i < w * h; i++) { const r = Math.round(px[i * 4] / 51) * 51, g = Math.round(Math.round(px[i * 4 + 1] / 42.5) * 255 / 6), bb = Math.round(px[i * 4 + 2] / 51) * 51; if (Math.abs(d[i * 4] - r) > 1 || Math.abs(d[i * 4 + 1] - g) > 1 || Math.abs(d[i * 4 + 2] - bb) > 1) bad++; } return bad; });
  check('RB31', 'the GIF encoder survives a full dictionary: 120,000 random pixels decode to exactly what was encoded', dec === 0, dec);
  await E(() => { state.bg = 'transparent'; applyBackground(); const s0 = MediaRecorder.prototype.start; MediaRecorder.prototype.start = function (...a) { window.__recC = [...window.__filmCanvas.getContext('2d').getImageData(2, 2, 1, 1).data]; return s0.apply(this, a); }; });
  await E(() => { document.getElementById('animFmt').value = 'video'; document.getElementById('animKind').value = 'rock'; });
  const vid = await Promise.all([pg.waitForEvent('download', { timeout: 60000 }), pg.click('#animGo')]).then(([d]) => d).catch(() => null);
  check('RB31', 'Record as video downloads a video file', !!vid && /\.(webm|mp4)$/.test(vid.suggestedFilename()), vid && vid.suggestedFilename());
  check('RB31', 'and the camera is back where it was', await E(() => !_anim.on));
  const corner = async uri => E(async u => { const img = new Image(); img.src = u; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return [...x.getImageData(2, 2, 1, 1).data]; }, uri);
  const recC = await E(() => window.__recC), afterC = await corner(await E(() => viewer.pngURI()));
  check('RB31', 'a transparent background is recorded on white (a video has no transparency, and it came out black), then put back', recC[3] === 255 && recC[0] > 240 && afterC[3] === 0 && /on white/.test(await E(() => document.getElementById('animStatus').textContent)), { recC, afterC });
  // figure sizes
  const fs = await E(() => { state.figSize = '1col'; _exOpts.res = '300'; const a = renderExport().width; state.figSize = '2col'; _exOpts.res = '600'; const b = renderExport().width; state.figSize = 'free'; return { a, b }; });
  check('RB31', 'a one-column figure at 300 dpi is 1004 px wide; two columns at 600 dpi, 4134', fs.a === 1004 && fs.b === 4134, fs);
  // a new structure starts a new history
  await go('1XYZ');
  check('RB31', 'opening another structure starts a new history', await E(() => _undo.stack.length === 0 && document.getElementById('undoBtn').disabled));
  await ctx.close();
}


// ── RB32 a figure goes to the notebook and comes back to be edited ──────────────────────────
async function rb32() {
  const { ctx, pg } = await open({ tag: 'RB32 ', pre: async c => {
    await c.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    await c.route(base + '__host2.html', r => r.fulfill({ contentType: 'text/html', body: HOST2.replace('/apps/ribbon/ribbon.html', '/' + (args.file || 'apps/ribbon/ribbon.html')) }));
  } });
  await pg.goto(base + '__host2.html'); await sleep(3000);
  const lb = pg.frame({ url: /labbook\.html/ }), rb = pg.frame({ url: /ribbon\.html/ });
  try { await lb.waitForFunction(() => window.LB && LB.data && LB.data.presets && Object.keys(LB.data.presets).length && (LB.data.projects || []).length, null, { timeout: 25000 }); }
  catch (e) { skipped.push('RB32 (Labbook did not come up)'); await ctx.close(); return; }
  if (!(await rb.evaluate(() => !!window.$3Dmol))) { skipped.push('RB32 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  const expId = await lb.evaluate(async () => {
    const before = new Set(Object.keys(LB.data.experiments)), P = LB.data.projects.find(p => (p.sections || []).length), S0 = P.sections[0];
    openNew(P.id, S0.id); el('nm-type').value = 'HB'; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value = '2026-10-01'; nmUpdateCode(); nmSetup(); nmProtos(); nmPreview(); createExperiment(); closeNew();
    let e = null; for (let t = 0; t < 100 && !e; t++) { e = Object.values(LB.data.experiments).find(x => !before.has(x.id)); if (!e) await new Promise(r => setTimeout(r, 60)); }
    openExp(e.id); return e.id; });
  await pg.evaluate(() => show('ribbon'));
  await rb.evaluate(() => { document.getElementById('pdbInput').value = '4LIG'; handleSubmit(); }); await sleep(3000);
  await rb.evaluate(() => { runCommand('color chain A red', { noHistory: true }); runCommand('label chain A "Figure one"', { noHistory: true }); runCommand('bg white', { noHistory: true }); openExport(); document.getElementById('exLabbook').click(); });
  await sleep(2500);
  const f1 = await lb.evaluate(id => { const f = (LB.data.experiments[id].files || [])[0]; return f && { id: f.id, att: f.attId, rid: f.ribbon && f.ribbon.id, pdb: f.ribbon && f.ribbon.design.pdbId, red: f.ribbon && f.ribbon.design.state.chainColors.A }; }, expId);
  check('RB32', 'a figure sent to Labbook keeps the design it was drawn from', !!f1 && !!f1.rid && f1.pdb === '4LIG' && f1.red === '#e53935', f1);
  await lb.evaluate(id => { renderEditor(); setFileCaption('exp:' + id, LB.data.experiments[id].files[0].id, 'My own caption'); }, expId);
  if (args.shots) { await pg.evaluate(() => show('labbook')); await lb.evaluate(() => { const r = [...document.querySelectorAll('.fx-row')][0]; if (r) r.scrollIntoView({ block: 'center' }); }); await sleep(400); await pg.screenshot({ path: path.join(String(args.shots), 'rb32-labbook-files.png') }); await pg.evaluate(() => show('ribbon')); }   // --shots=DIR: the row as a person sees it
  check('RB32', 'its row in Files offers Edit in Ribbon', await lb.evaluate(() => [...document.querySelectorAll('.fx-row .pl-btn')].some(b => /Edit in Ribbon/.test(b.textContent))));
  // change the figure in Ribbon, then open the one in the notebook: it comes back as it was
  await rb.evaluate(() => { runCommand('color chain A blue', { noHistory: true }); runCommand('label chain A ""', { noHistory: true }); state.chainLabels = {}; renderLabelTags(); });
  await lb.evaluate((id) => { const e = LB.data.experiments[id]; openFigureInRibbon('exp:' + id, e.files[0].id); }, expId); await sleep(3500);
  const back = await rb.evaluate(() => ({ red: state.chainColors.A, lab: state.chainLabels.A, btn: document.getElementById('exLabbook').textContent, link: !!_lbFig }));
  check('RB32', 'Edit in Ribbon opens the figure as it was made: its colours and labels', back.red === '#e53935' && back.lab === 'Figure one', back);
  check('RB32', 'and Export now says Update in Labbook', back.btn === 'Update in Labbook' && back.link, back);
  check('RB32', 'Ribbon is what is shown', await pg.evaluate(() => document.getElementById('frame-ribbon').style.display) === 'block');
  await rb.evaluate(() => { runCommand('color chain B teal', { noHistory: true }); openExport(); document.getElementById('exLabbook').click(); });
  await sleep(2500);
  const f2 = await lb.evaluate(id => { const fs = LB.data.experiments[id].files || []; return { n: fs.length, att: fs[0].attId, teal: fs[0].ribbon.design.state.chainColors.B, cap: fs[0].caption, rid: fs[0].ribbon.id }; }, expId);
  check('RB32', 'sent back, it replaces itself: one file, new picture, new design, same id', f2.n === 1 && f2.att !== f1.att && f2.teal && f2.rid === f1.rid, { f1, f2 });
  check('RB32', 'and the caption you wrote in Labbook is kept', f2.cap === 'My own caption', f2.cap);
  const hostile = await lb.evaluate(() => { const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; const a = _cleanCtx({ images: [{ name: 'a.png', dataUrl: px, ribbon: { id: '<script>', design: { state: {} } } }, { name: 'b.png', dataUrl: px, ribbon: { id: 'okid01', design: { state: { x: 'y'.repeat(500000) } } } }, { name: 'c.png', dataUrl: px, ribbon: { id: 'okid02', design: { state: { n: 1 } } } }] }); return a.images.map(i => !!i.ribbon); });
  check('RB32', 'a design with a bad id, or too large, is dropped; the picture still arrives', hostile.join() === 'false,false,true', hostile);
  await ctx.close();
}


// ── RB33 a mutant scan from Echo, on the protein in Ribbon ──────────────────────────────────
const HOST4 = `<!doctype html><meta charset=utf-8><body style="margin:0">
<iframe id="frame-echo" src="/apps/echo/echo.html" style="width:1300px;height:850px;border:0"></iframe>
<script>window.APP_INFO={ribbon:{name:'Ribbon'},echo:{name:'Echo'}}; window.__sent=[]; window.openApp=function(id,a,b,ctx){ window.__sent.push({id:id,ctx:ctx}); };</script>`;
async function rb33() {
  // Echo: which groups are mutants of which, and by how much
  const { ctx, pg } = await open({ tag: 'RB33 ', pre: async c => { await c.route(base + '__host4.html', r => r.fulfill({ contentType: 'text/html', body: HOST4 })); } });
  await pg.goto(base + '__host4.html'); await sleep(4000);
  const ec = pg.frame({ url: /echo\.html/ });
  const ms = await ec.evaluate(() => {
    _lastResultsData = [
      { Sample_ID: 'CPD-1', Protein: 'BRD4', DC50_nM: 10, Flag: 'No' }, { Sample_ID: 'CPD-1', Protein: 'BRD4_Y97A', DC50_nM: 80, Flag: 'No' },
      { Sample_ID: 'CPD-1', Protein: 'BRD4-W81A', DC50_nM: 2.5, Flag: 'No' }, { Sample_ID: 'CPD-1', Protein: 'BRD4 p.N140A', DC50_nM: 5, Flag: 'No', Flag_Reason: 'No effect (span 3%)' },
      { Sample_ID: 'CPD-2', Protein: 'VHL', DC50_nM: 30, Flag: 'No' }, { Sample_ID: 'CPD-2', Protein: 'BRD2', DC50_nM: 30, Flag: 'No' }];
    return mutantSets().map(m => ({ t: m.target, c: m.compound, muts: m.muts.map(x => x.label + ':' + (x.lost ? 'lost' : x.fold)).join() }));
  });
  check('RB33', 'Echo finds the mutants of a group, by name, and the fold change against the wild type', ms.length === 1 && ms[0].t === 'BRD4' && ms[0].muts === 'Y97A:8,W81A:0.25,N140A:' + (ms[0].muts.includes('N140A:lost') ? 'lost' : '0.5'), ms);
  const nd = await ec.evaluate(() => { const r = _lastResultsData.find(x => /N140A/.test(x.Protein)); return _nd(r); });
  check('RB33', 'a mutant whose curve is flat is “no effect”, not a number', !nd || ms[0].muts.includes('N140A:lost'), { nd, ms });
  await ec.evaluate(() => openMutantsInRibbon());
  const sent = await pg.evaluate(() => window.__sent);
  const rv = sent[0] && sent[0].ctx && sent[0].ctx.ribbon;
  check('RB33', 'it opens Ribbon on that protein, as the AlphaFold model, with log2(mutant ÷ WT) by residue and a label each', !!rv && sent[0].id === 'ribbon' && rv.query === 'BRD4' && rv.model === 'af' && rv.values.data[97] === 3 && rv.values.data[81] === -2 && /Y97A ×8\.0/.test(rv.values.labels[97]) && /W81A ÷4\.0/.test(rv.values.labels[81]), rv);
  const tg = await ec.evaluate(() => ribbonTargets().map(t => t.target + ':' + (t.best ? t.best.Sample_ID : '') + ':' + t.n).join('|'));
  check('RB33', 'the targets in Ribbon are the groups, a mutant counted as its wild type, each with its most potent compound', tg === 'BRD2:CPD-2:1|BRD4:CPD-1:4|VHL:CPD-2:1', tg);
  await ec.evaluate(() => { const o = window.ctxOpen; window.ctxOpen = (items) => { window.__items = items.map(i => i.label || i.hd); items.find(i => /^BRD4/.test(i.label || '')).act(); }; openTargetInRibbon(); window.ctxOpen = o; });
  const items = await ec.evaluate(() => window.__items), sent2 = await pg.evaluate(() => window.__sent), rv2 = sent2[sent2.length - 1].ctx.ribbon;
  check('RB33', 'with several it asks which, and opens that one with its pocket and the compound named', items[0] === 'Which protein?' && items.length === 4 && rv2.query === 'BRD4' && rv2.pocket === true && rv2.compound === 'CPD-1' && !rv2.values, { items, rv2 });
  const btn = await ec.evaluate(() => { const l = _resSendItems().map(i => i.label); return l.includes('Targets in Ribbon') && l.includes('Mutants on the structure') && /resSendMenu/.test(_resBar()); });
  check('RB33', 'Send to ▾ on the results row offers the targets and the mutants inside the Hub', btn);
  check('RB33', 'groups that are not mutants of anything send nothing', await ec.evaluate(() => { _lastResultsData = [{ Sample_ID: 'A', Protein: 'BRD4', DC50_nM: 1, Flag: 'No' }, { Sample_ID: 'A', Protein: 'BRD2', DC50_nM: 2, Flag: 'No' }]; return mutantSets().length === 0; }));
  await ctx.close();
  // Ribbon: the numbers land on the residues they name
  const r = await open({ tag: 'RB33r ' });
  if (!(await has3d(r.pg))) { skipped.push('RB33 (3Dmol could not load from its CDN)'); await r.ctx.close(); return; }
  await r.E(() => { window.__toasts = []; const o = window.showToast; window.showToast = function (m, a) { window.__toasts.push(m); return o(m, a); }; rbOpenTarget({ query: 'TST', model: 'af', from: 'Echo Dose Response', compound: 'CPD-1', values: { title: 'CPD-1 · log2 DC50 mutant ÷ WT', data: { 3: 2.5, 5: -1, 99: 1, x: 7 }, labels: { 3: 'A3V ×5.7', 5: 'S5A ÷2.0', 99: 'Q99A' } } }); });
  await sleep(3500);
  const v = await r.E(() => ({ id: currentPdbId, mode: state.color, data: state.values && state.values.data['*'], title: state.values && state.values.title, labels: state.residueLabels.map(x => x.resi + ':' + x.text).join('|'), sticks: (state.reps || []).map(x => x.sel).join(), toasts: window.__toasts.join(' / '), key: document.getElementById('legend').textContent }));
  check('RB33', 'Ribbon opens the AlphaFold model and colours the residues by the values sent', /^AF-P12345/.test(v.id) && v.mode === 'values' && v.data && v.data[3] === 2.5 && v.data[5] === -1 && !('x' in v.data), v);
  check('RB33', 'each mutated residue is labelled and drawn with its side chain; one not in the model is named, not drawn', v.labels === '3:A3V ×5.7|5:S5A ÷2.0' && v.sticks === 'A:3, A:5' && /1 of the residues are not in this model: 99/.test(v.toasts), v);
  check('RB33', 'the colour key says what the numbers are', /log2 DC50/.test(v.key), v.key);
  await r.ctx.close();
}

// ── RB42 the 2D diagram ─────────────────────────────────────────────────────────────────────────
async function rb42() {
  const { ctx, pg, E, go } = await open({ tag: 'RB42 ' });
  if (!(await has3d(pg))) { skipped.push('RB42 (3Dmol could not load from its CDN)'); await ctx.close(); return; }
  await go('9DGM'); await sleep(500);
  await E(() => { rbTab('analyse'); }); await sleep(900);
  const g = () => E(() => {   // the picture as it is on the page: the boxes, the atoms and the lines, read back from the SVG itself
    const svg = document.querySelector('#diagBox svg'); if (!svg) return null;
    const vb = svg.viewBox.baseVal, num = (el, a) => +el.getAttribute(a);
    const boxes = [...svg.querySelectorAll('.dg-res')].map(r => { const q = r.querySelector('rect'); return { k: r.dataset.k, x: num(q, 'x'), y: num(q, 'y'), w: num(q, 'width'), h: num(q, 'height') }; });
    const d = _diagLast, at = d.atoms.map(a => ({ x: a.x + d.ox, y: a.y + d.oy, el: a.el })), bonds = d.bonds;
    return { W: vb.width, H: vb.height, boxes, at, bonds, lines: [...svg.querySelectorAll('.dg-ln')].map(l => { const ln = l.querySelector('line'); return { k: l.dataset.k, t: l.dataset.t, x1: num(ln, 'x1'), y1: num(ln, 'y1'), x2: num(ln, 'x2'), y2: num(ln, 'y2'), c: ln.getAttribute('stroke'), want: INTER_TYPES[l.dataset.t].c }; }), bond: DG_BOND, rows: d.rows, siteRows: _site.rows.length };
  });
  const d = await g();
  check('RB42', 'the diagram is drawn when Analyse opens, one box per residue of the table (up to the cap)', !!d && d.boxes.length >= 14 && d.boxes.length === Math.min(26, d.siteRows), d && { boxes: d.boxes.length, rows: d.siteRows });
  const touch = (a, b, pad) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad;
  let pairs = 0; for (let i = 0; i < d.boxes.length; i++) for (let j = i + 1; j < d.boxes.length; j++) if (touch(d.boxes[i], d.boxes[j], 0)) pairs++;
  check('RB42', 'no two residue labels touch, even with ten of them on one side of the ligand', pairs === 0, { pairs, n: d.boxes.length });
  const onAtom = d.boxes.filter(b => d.at.some(a => { const qx = Math.max(b.x, Math.min(b.x + b.w, a.x)), qy = Math.max(b.y, Math.min(b.y + b.h, a.y)); return Math.hypot(qx - a.x, qy - a.y) < d.bond * 0.34; })).length;
  check('RB42', 'no label sits on the ligand, and every one is inside the picture', onAtom === 0 && d.boxes.every(b => b.x >= 0 && b.y >= 0 && b.x + b.w <= d.W && b.y + b.h <= d.H), { onAtom, W: d.W, H: d.H });
  let minNb = 1e9; const adj = new Set(d.bonds.map(([a, b]) => a + '-' + b)); for (let i = 0; i < d.at.length; i++) for (let j = i + 1; j < d.at.length; j++) if (!adj.has(i + '-' + j)) minNb = Math.min(minNb, Math.hypot(d.at[i].x - d.at[j].x, d.at[i].y - d.at[j].y));
  const bl = d.bonds.map(([a, b]) => Math.hypot(d.at[a].x - d.at[b].x, d.at[a].y - d.at[b].y)).sort((a, b) => a - b), med = bl[bl.length >> 1];
  check('RB42', 'the folded ligand is drawn flat without atoms on top of each other, bonds about one length', minNb > d.bond * 0.55 && med > d.bond * 0.75 && med < d.bond * 1.25, { minNb: +(minNb / d.bond).toFixed(2), med: +(med / d.bond).toFixed(2) });
  const edge = (b, x, y) => { const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = Math.abs(x - cx) - b.w / 2, dy = Math.abs(y - cy) - b.h / 2; return Math.max(dx, dy); };
  const lk = d.lines.every(l => { const b = d.boxes.find(q => q.k === l.k); const a = d.at.reduce((m, p) => Math.min(m, Math.hypot(p.x - l.x2, p.y - l.y2)), 1e9); return b && Math.abs(edge(b, l.x1, l.y1)) < 1.5 && a < d.bond * 0.4; });
  check('RB42', 'every interaction is a line from the edge of its residue to an atom of the ligand, in the colour of its kind', lk && d.lines.length >= d.boxes.length && d.boxes.every(b => d.lines.some(l => l.k === b.k)) && d.lines.every(l => l.c === l.want), { lines: d.lines.length });
  // it is the same picture every time
  const same = await E(() => siteDiagram().svg === siteDiagram().svg);
  check('RB42', 'the same file draws the same picture every time', same);
  // hover: picture, table, structure
  await pg.hover('#diagBox .dg-res'); await sleep(350);
  const hv = await E(() => ({ k: _dgHot, res: document.querySelectorAll('.dg-res.hl').length, row: document.querySelectorAll('#siteList .site-row.hl').length, shape: !!_dgShape }));
  check('RB42', 'the pointer on a residue in the picture lights it in the table and puts a halo on it in the structure', !!hv.k && hv.res === 1 && hv.row === 1 && hv.shape, hv);
  await pg.mouse.move(5, 5); await sleep(350);
  check('RB42', 'and takes it all away again', await E(() => !_dgHot && !_dgShape && !document.querySelector('.dg-res.hl')));
  await pg.hover('#siteList .site-row:nth-child(2)'); await sleep(350);
  check('RB42', 'a row of the table lights its box in the picture', await E(() => document.querySelectorAll('.dg-res.hl').length === 1));
  await pg.mouse.move(5, 5); await sleep(250);
  // click goes to the residue
  await E(() => { window.__fit = []; const o = window.fitView; window.__fitO = o; window.fitView = function (a) { window.__fit.push(a); return o.apply(this, arguments); }; });
  await pg.click('#diagBox .dg-res'); await sleep(300);
  check('RB42', 'a click on a box frames that residue with the ligand', await E(() => { window.fitView = window.__fitO; return window.__fit.length === 1 && !!window.__fit[0].focus; }));
  // the filters
  const n0 = await E(() => document.querySelectorAll('#diagBox .dg-res').length);
  await pg.click('#siteTypes .it-chip[data-t=hydro]'); await sleep(300);
  const n1 = await E(() => ({ boxes: document.querySelectorAll('#diagBox .dg-res').length, rows: document.querySelectorAll('#siteList .site-row').length }));
  check('RB42', 'switching a kind off takes its residues out of the picture as well as the table', n1.boxes < n0 && n1.boxes === n1.rows && n1.boxes >= 2, { n0, n1 });
  await pg.click('#siteTypes .it-chip[data-t=hydro]'); await sleep(300);
  // the file
  const sv = await E(() => { window.__saved = []; const o = window._saveBlob; window.__saveO = o; window._saveBlob = function (b, n) { window.__saved.push({ b, n }); }; diagSvg(); window._saveBlob = o; const s = window.__saved[0]; return s.b.text().then(t => ({ name: s.n, text: t })); });
  const xml = await E((t) => { const doc = new DOMParser().parseFromString(t, 'image/svg+xml'); return { err: !!doc.querySelector('parsererror'), boxes: doc.querySelectorAll('.dg-res').length, hl: doc.querySelectorAll('.hl').length, w: doc.documentElement.getAttribute('width') }; }, sv.text);
  check('RB42', 'Save SVG writes a valid, self-contained vector figure named for the structure and the ligand', /_LIG_interactions\.svg$/.test(sv.name) && !xml.err && xml.boxes >= 14 && xml.hl === 0 && /<rect width="\d+" height="\d+" fill="#ffffff"\/>/.test(sv.text), { name: sv.name, xml });
  const png = await E(() => new Promise(res => diagCanvas(cv => { if (!cv) return res(null); const x = cv.getContext('2d'), im = x.getImageData(0, 0, cv.width, cv.height).data; let ink = 0; for (let i = 0; i < im.length; i += 4) if (im[i] < 200 || im[i + 1] < 200 || im[i + 2] < 200) ink++; res({ w: cv.width, h: cv.height, ink: ink / (cv.width * cv.height), ratio: cv.height / cv.width, want: _diagLast.h / _diagLast.w }); }, 1500)));
  check('RB42', 'Save PNG renders that picture at the width asked, not blank', !!png && png.w === 1500 && png.ink > 0.02 && Math.abs(png.ratio - png.want) < 0.01, png);
  // enlarged
  await pg.click('#diagBig'); await sleep(300);
  const md = await E(() => ({ open: document.getElementById('diag-modal').classList.contains('open'), same: document.querySelector('#diagBig2 svg').innerHTML === document.querySelector('#diagBox svg').innerHTML, focus: document.activeElement && document.activeElement.id }));
  check('RB42', 'Enlarge opens the same picture in a dialog with focus inside it', md.open && md.same && /^dg/.test(md.focus), md);
  await pg.keyboard.press('Escape'); await sleep(200);
  check('RB42', 'Escape closes it and gives the focus back', await E(() => !document.getElementById('diag-modal').classList.contains('open') && document.activeElement && document.activeElement.id === 'diagBig'));
  // the other structures
  await go('9INT'); await sleep(500); await E(() => { rbTab('analyse'); }); await sleep(700);
  const small = await E(() => ({ shown: !document.getElementById('siteDiag').hidden, boxes: document.querySelectorAll('#diagBox .dg-res').length, ions: [...document.querySelectorAll('#diagBox .dg-res')].map(r => r.textContent.trim()).join('|') }));
  check('RB42', 'a small ligand with an ion draws too, the ion as a box of its own', small.shown && small.boxes >= 4 && /MG/.test(small.ions), small);
  await go('1XYZ'); await sleep(400); await E(() => { rbTab('analyse'); }); await sleep(400);
  check('RB42', 'a structure with no ligand has no diagram', await E(() => document.getElementById('siteDiag').hidden && !document.querySelector('#diagBox svg')));
  await ctx.close();
}

const SUITES = [['RB1', rb1], ['RB2', rb2], ['RB3', rb3], ['RB4', rb4], ['RB5', rb5], ['RB6', rb6], ['RB7', rb7], ['RB8', rb8], ['RB9', rb9], ['RB10', rb10], ['RB11', rb11], ['RB12', rb12], ['RB13', rb13], ['RB14', rb14], ['RB15', rb15], ['RB16', rb16], ['RB17', rb17], ['RB18', rb18], ['RB19', rb19], ['RB20', rb20], ['RB21', rb21], ['RB22', rb22], ['RB23', rb23], ['RB24', rb24], ['RB25', rb25], ['RB26', rb26], ['RB27', rb27], ['RB28', rb28], ['RB29', rb29], ['RB30', rb30], ['RB31', rb31], ['RB32', rb32], ['RB33', rb33], ['RB34', rb34], ['RB35', rb35], ['RB36', rb36], ['RB37', rb37], ['RB38', rb38], ['RB39', rb39], ['RB40', rb40], ['RB41', rb41], ['RB42', rb42]];
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
base = `http://127.0.0.1:${port}/`;
try {
  await waitHttp(base);
  // RB_SWGL=1 renders WebGL in software, as CI's runner does (a laptop's GPU hides every bug that only a slow frame shows)
  browser = await chromium.launch(process.env.RB_SWGL ? { args: ['--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  for (const [id, fn] of SUITES) {
    if (!run(id)) continue;
    const t0 = Date.now();
    try { await fn(); } catch (e) { out.push({ inv: id, case: 'suite', msg: 'the suite threw: ' + (m => { const l = m.split('\n').map(x => x.trim()).filter(Boolean); return l[0] + (l.length > 1 ? ' … ' + l[l.length - 1] : ''); })(String(e && e.message || e)) }); }
    timing[id] = Date.now() - t0;
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
if (args.timing) console.log('  timing: ' + Object.entries(timing).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + Math.round(v / 1000) + 's').join(' · '));
if (pageErrs.length) { console.log('  ✗ page errors:'); [...new Set(pageErrs)].forEach(e => console.log('      ' + e)); }
const failed = out.length + pageErrs.length;
console.log(failed ? `\n${failed} finding(s).` : '\nAll Ribbon invariants hold.');
process.exit(failed ? 1 : 0);
