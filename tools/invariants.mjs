// Labbook invariants — the classes of bug that kept coming back, as checks that run every time.
//
// A bug hunt samples; this enumerates. Every check below is a CLASS that has already been found
// at least once by hand, and each one is run over every preset and every library module rather
// than over the one case that happened to be looked at:
//
//   I1 preview = record      What the Designer's review shows is what dsCreate makes — block
//                            for block, date for date, plate for plate. (the Echo plate, skip
//                            weekends with protocol stages)
//   I2 quick = designer      The quick window and the Designer, given the same preset and the
//                            same date, create the same experiment. (plasmids:'', blank:false)
//   I3 handover              Quick window → "design it" carries everything already answered.
//                            (protos:[], the picklist, skipWe)
//   I4 typed = stored        Every calculator field and every wait typed in the Designer is the
//                            value the created experiment carries. (cells/well 20,000 → 110,000,
//                            the chained volume, the wait)
//   I5 shown = stored        A step's prose, rendered for editing and written back, is the
//                            prose it started as — tokens intact. ({{c.*}} / {{setup}} spans)
//   I6 nothing dropped       Every key on the Designer's draft is read on the way to the record,
//                            and every key handed to buildExperimentFrom is read by it.
//   I7 save = reuse          Save a preset as a design, create from the copy: same experiment.
//                            (layout, setupAdd, setupHide lost)
//   I8 owned = setup         A calculator field the parameters own carries the parameter's
//                            value in the record.
//   I9 quick preview dates   The dates the quick window promises are the dates it creates.
//   I10 your words stay      Prose changed in the Designer on a preset-based run survives the
//                            load-time wording pass and is never offered as a "preset update".
//   I11 questions outlive    Delete the design a run was made from: the run still asks the same
//       the design           setup questions. (a deleted design fell back to Custom — 1 of 11)
//   I12 typing keeps focus   Every text and number box in the Designer, typed into, is still the
//                            focused box afterwards. ("Days after": 12 was stored as 1)
//   I13 defaults stay        A default preset (the ten types and the curated ones) offers no
//                            Delete, survives dgDel, and a copy of it is the lab's own.
//   I14 own parameters       A parameter added in the Designer is asked, quoted, stored and
//                            still asked after the run exists and after save-as-a-design.
//   I15 replicates           N biological replicates from the Designer are N linked runs with
//                            distinct codes, each dated from its own start.
//   I16 answers = stored     Every parameter typed on the Designer's parameters screen, through
//                            its own event, is the value the record's setup carries. (the
//                            Compounds list went into the quick window's state)
//   I17 every setup form     The same, for the quick window, Edit setup and the Designer's design editing:
//                            typing keeps the focus, and what was typed is what the form holds.
//                            (the preset editor redrew on every keystroke; its lists went to
//                            the quick window)
//   I19 record → preset      Save an experiment as a preset, create from that preset: the same
//       → record             steps, setup, questions and plate. (its own parameters and "blank"
//                            were dropped on the way)
//   I20 open + save = same  Opening a design and saving it untouched changes nothing, in the
//                            Designer. (the Designer froze every
//                            default answer into the design)
//   I21 a read ends a well   Every readout of a run starts from the same volume — each reads its
//                            own copy of the plate. (the 72 h CTG read "started from 140 µL")
//   I22 text follows numbers In the Designer, every number a step's text quotes from its
//                            calculator is the calculator's current value the moment a box is
//                            typed in. (changing "already in the well" repainted the recipe and
//                            left the sentence under it saying 11.11 µL into 100)
//   I23 the chain carries     What each step leaves in the well is what the next one starts
//       every step           from — in the Review and in the created record alike, for a step
//                            with no volume calculator that says what it adds too. (a step that
//                            added liquid was invisible; the read started from 111, not 123)
//   I24 the Review's plate   Edit on the Review's plate map opens it, and what is changed there
//       is editable          is the plate the experiment is created with. ("no plate map here")
//   I25 a moved day moves    Moving a day from its header moves every step dated that day, and
//       all of it            the later days follow only when asked; moving one step moves that
//                            step alone. (the day's first step moved and its siblings stayed)
//   I18 no box loses focus   Every text box, number box and editor on every screen reachable
//                            — experiments with the Report open, the plate editor, every
//                            dialog, the Journal, Visualize, the Designer — keeps the caret
//                            when typed into. (the Designer's own search box)
//
//   Report and exports — one experiment per preset, dressed with marked content:
//   R1 Report = record, live  Every section carries what the record holds, a change reaches it
//                            with nothing pressed, each toggle removes what it names, and hand-
//                            written wording is kept and goes stale when the record moves.
//   R2 nothing leaks         No {{token}}, undefined, NaN or double-escaped entity in the Report,
//                            Methods sheet, record PDF, bench sheet, JSON or What you need.
//   R3 every export runs     Through its own function, with no error, naming the experiment;
//                            every button on the Report calls a function that exists. (the
//                            record PDF that threw for every experiment)
//   R4 PDF = record          Every step and every marker is in the record PDF, and each box in
//                            the export dialog removes what it names.
//   R5 JSON round-trip       Export → import is the same experiment and prints the same; a
//                            folder bundle carries every experiment in the folder.
//   R6 CSV = record          Results and steps CSVs parse back to the record's rows, quotes and
//                            commas included.
//   R7 scopes                A folder/project/all PDF carries every experiment in it; a Journal
//                            day, month and the whole Journal carry each step done that day.
//
//   Beta test 2026-09-28 — the classes found by breaking Labbook on purpose (docs/BETA_TEST_REPORT.md):
//   B1 undo takes the trash   ⌘Z after a delete also removes it from Deleted items. (LB-4)
//   B2 one step per action    Move, archive, status, exclude, start date, code, duplicate and
//                            replicate are each one undo step that restores the record. (LB-6, LB-27)
//   B3 snooze keeps ticks     Snoozing never re-dates a step already ticked. (LB-5)
//   B4 reader grids           Tab, spaces, row letters, semicolons with comma decimals, CSV and a
//                            header row all fill every well of a 96 and a 384. (LB-1)
//   B5 no live formulas       No CSV cell starts with = + - @ unless it is a number. (LB-2)
//   B6 no script from text    Names, codes, notes, targets and an imported file never run. (LB-3, LB-19)
//   B7 payloads               Malformed results/tables/plates from another app, and a non-finite
//                            potency, break no screen. (LB-17, LB-20)
//   B8 tree shapes            A tree in the wrong shape still draws every screen. (LB-8)
//   B9 restore                Restore never offers an export as a notebook backup. (LB-21)
//   B10 mixes close           Every transfection/spike table's parts add up to its total, however
//                            small the stocks make the DNA. (LB-23, LB-24)
//   B11 imported replicate    An imported copy does not join the set it came from. (LB-9)
//   B12 concentrations        _fmtConc → _parseConcNM round-trips; a series reads as one either
//                            way. (LB-10, LB-28)
//   B13 picklists             Padded wells, a BOM and European Excel all read. (LB-22)
//   B14 inline sum            Only whole expressions are answered. (LB-12)
//   B15 message origin        Only the Hub's own origin can post into Labbook. (LB-18)
//   B16 typed code            Trimmed, never empty, never another experiment's. (LB-6)
//   B17 format change         Values, headers and labels of dropped wells go with them. (LB-11)
//   B18 one timer             Pressing a step's timer twice starts one. (LB-16)
//   B19 keyboard reach        Every clickable navigation element is reachable with Tab. (LB-15)
//
// Usage (repo root):  node tools/invariants.mjs [--url=URL,URL] [--only=I1,I4] [--verbose]
// Defaults to the source app AND labbook-standalone.html when it exists (the build that embeds
// Archive, so the protocol cases run). Serves the repo itself on a free port. Exit 1 on any
// finding.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const VERBOSE = !!args.verbose;

function freePort() {
  return new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}
async function waitHttp(url, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  throw new Error('server did not come up: ' + url);
}

// ── Everything below runs inside the page ─────────────────────────────────────────────────────
async function suite(opts) {
  const ONLY = opts.only;
  const out = [];           // {inv, case, msg}
  const counts = {};        // inv → cases checked
  function run(inv) { return !ONLY || ONLY.includes(inv); }
  function bad(inv, cs, msg) { out.push({ inv, case: cs, msg }); }
  function tick(inv) { counts[inv] = (counts[inv] || 0) + 1; }
  // One case that throws is a finding for that case, not the end of the run.
  async function guard(inv, cs, fn) { try { await fn(); } catch (x) { bad(inv, cs, 'threw: ' + String(x && x.message || x)); } }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Quiet the app: nothing here should block on a dialog or a toast.
  window.lbAlert = function () { return Promise.resolve(); };
  window.lbConfirm = function () { return Promise.resolve(true); };

  const START = '2026-10-01';          // a Thursday: day 2 and 3 are a weekend
  const P = (LB.data.projects || []).find(p => (p.sections || []).length);
  if (!P) return { out: [{ inv: 'setup', case: '-', msg: 'no project with a folder to create into' }], counts };
  const PID = P.id, SID = P.sections[0].id;
  const archive = await new Promise(r => { try { ensureArchive(ok => r(!!ok && archiveIndex().length > 0)); } catch (e) { r(false); } setTimeout(() => r(false), 9000); });

  // ── helpers ──
  function canon(v) {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => { if (v[k] !== undefined) o[k] = canon(v[k]); }); return o; }
    return v;
  }
  const J = v => JSON.stringify(canon(v));
  function normHtml(h) { const d = document.createElement('div'); d.innerHTML = String(h || ''); return d.innerHTML; }
  function blkSig(b) {
    const s = { title: b.title || '', day: +b.dayOffset || 0, date: b.date || '', wait: +b.waitMin || 0 };
    if (b.proto || b.dsProto) { s.stage = (b.proto && b.proto.stageId) || (b.dsProto && b.dsProto.stage && b.dsProto.stage.id) || '(flat)'; return s; }
    s.html = normHtml(b.html); s.pub = b.pub || ''; s.noPub = !!b.noPub;
    if (b.calc) { s.kind = b.calc.kind; s.inputs = canon(b.calc.inputs || {}); }
    return s;
  }
  function blocksSig(list) {
    return (list || []).map(blkSig).sort((a, b) => a.date.localeCompare(b.date) || a.day - b.day || a.title.localeCompare(b.title));
  }
  function plateSig(p) {
    if (!p) return null;
    const w = {}; Object.keys(p.wells || {}).sort().forEach(k => { w[k] = canon(p.wells[k]); });
    return J({ format: String(p.format), title: p.title || '', wells: w,
      types: (p.types || []).map(t => ({ id: t.id, label: t.label, no: t.no })), groups: p.groups || null });
  }
  function plateDiff(p, q) {
    if (!p || !q) return `review ${p ? p.format + '-well' : 'none'} vs record ${q ? q.format + '-well' : 'none'}`;
    const out = [];
    if (String(p.format) !== String(q.format)) out.push(`format ${p.format} vs ${q.format}`);
    if ((p.title || '') !== (q.title || '')) out.push(`title "${p.title}" vs "${q.title}"`);
    const ws = new Set([...Object.keys(p.wells || {}), ...Object.keys(q.wells || {})]);
    const wd = [...ws].filter(w => J((p.wells || {})[w]) !== J((q.wells || {})[w]));
    if (wd.length) out.push(`${wd.length} wells differ, e.g. ${wd[0]}: ${J((p.wells || {})[wd[0]])} vs ${J((q.wells || {})[wd[0]])}`);
    const ta = J((p.types || []).map(t => [t.id, t.label, t.no])), tb = J((q.types || []).map(t => [t.id, t.label, t.no]));
    if (ta !== tb) out.push(`types ${ta.slice(0, 160)} vs ${tb.slice(0, 160)}`);
    if (J(p.groups || null) !== J(q.groups || null)) out.push('groups differ');
    return out.join('; ') || 'differs';
  }
  function diffBlocks(inv, cs, A, B, la, lb) {
    const a = blocksSig(A), b = blocksSig(B);
    if (a.length !== b.length) { bad(inv, cs, `${la} has ${a.length} steps, ${lb} has ${b.length}: ${la}=[${a.map(x => x.date + ' ' + x.title).join(' | ')}] ${lb}=[${b.map(x => x.date + ' ' + x.title).join(' | ')}]`); return; }
    for (let i = 0; i < a.length; i++) {
      const x = a[i], y = b[i];
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
        if (J(x[k]) !== J(y[k])) {
          let d = '';
          if (k === 'inputs') {
            const ks = new Set([...Object.keys(x.inputs || {}), ...Object.keys(y.inputs || {})]);
            d = [...ks].filter(q => J((x.inputs || {})[q]) !== J((y.inputs || {})[q]))
              .map(q => `${q}: ${J((x.inputs || {})[q])} vs ${J((y.inputs || {})[q])}`).join('; ');
          } else d = `${String(J(x[k])).slice(0, 140)} vs ${String(J(y[k])).slice(0, 140)}`;
          bad(inv, cs, `step "${x.title}" (${x.date}) — ${k} differs, ${la} vs ${lb}: ${d}`);
        }
      }
    }
  }
  async function created(fn) {
    const before = new Set(Object.keys(LB.data.experiments || {}));
    fn();
    for (let t = 0; t < 150; t++) {
      const nk = Object.keys(LB.data.experiments || {}).filter(k => !before.has(k));
      if (nk.length) return LB.data.experiments[nk[0]];
      await sleep(60);
    }
    return null;
  }
  function openQuick(key, o) {
    o = o || {};
    openNew(PID, SID);
    el('nm-type').value = key;
    nmUpdateCode(); nmResetSetup(); nmProtos();
    el('nm-date').value = o.date || START;
    if (o.setup) Object.assign(NM_SETUP, o.setup);
    if (o.protos) { NM_PROTOS = o.protos.map(p => { const e = { id: p.id, name: p.name || p.id }; nmLoadStages(e); if (p.off != null) e.off = p.off; return e; }); }
    if (o.echo) { NM_ECHO = o.echo; NM_PLATE = true; if (NM_SETUP && NM_SETUP.format !== undefined) NM_SETUP.format = o.echo.format; }
    if (o.skipWe) NM_SKIPWE = true;
    nmUpdateCode(); nmSetup(); nmProtos(); nmPreview();
  }
  function designFrom(key, o) {
    o = o || {};
    dsOpen({ mode: 'exp', pid: PID, sid: SID, presetKey: key });
    DS.startDate = o.date || START;
    if (o.setup) { Object.assign(DS.setup, o.setup); Object.keys(o.setup).forEach(k => DS.setupTouched[k] = 1); }
    if (o.protos) { DS.protos = o.protos.map(p => { const e = { id: p.id, name: p.name || p.id }; nmLoadStages(e); if (p.off != null) e.off = p.off; return e; }); }
    if (o.echo) { DS.echo = o.echo; DS.plate = true; }
    if (o.skipWe) DS.skipWe = true;
    if (o.layout !== undefined) { DS.layout = o.layout; DS.plate = true; }
    dsSyncMods(DS);
  }
  function previewPlate(D, ps) {
    if (!(D.plate || D.echo)) return null;
    if (typeof dsPlateFor === 'function') return dsPlateFor(D, ps);
    return experimentPlateFor(D.presetKey || '', D.type, ps.setup || D.setup || {}, ps, D.echo || null);
  }
  function echoFixture() {
    const rows = ['[DETAILS]', 'Protocol Name,HB20260924_INV.edr', 'Run Date/Time,2026-10-01 10:00', '',
      'Source Plate Name,Source Well,Destination Plate Name,Destination Well,Transfer Volume,Actual Volume,Sample Name,Destination Concentration,Destination Concentration Units,Transfer Status'];
    ['B2', 'B3', 'B4', 'C2', 'C3', 'C4'].forEach((w, i) => rows.push(`SRC,A${i + 1},DEST1,${w},25,25,CPD-${1 + (i % 3)},${(1e-6 / Math.pow(3, i % 3)).toExponential(3)},M,`));
    rows.push('SRC,P1,DEST1,D2,25,25,,,M,');                         // a DMSO backfill
    rows.push('SRC,A9,DEST1,D3,25,0,CPD-9,1E-06,M,Failed');          // a transfer that never landed
    const res = parseEchoPicklist(rows.join('\n'));
    const dest = res.plates[0];
    const cmp = {}; Object.keys(dest.wells).forEach(w => { const c = dest.wells[w]; if (!c.dmsoOnly && c.compound) cmp[c.compound] = 1; });
    return { dest, format: echoGuessFormat(dest), meta: res.meta || {}, compounds: Object.keys(cmp) };
  }
  function cleanup(e) { if (e) delete LB.data.experiments[e.id]; }

  const KEYS = allPresetKeys();
  const PROTOS = archive ? [{ id: 'gibson' }, { id: 'transfo', off: 1 }] : null;

  // ── I1 preview = record, and I6 (half) nothing dropped on the way ──
  if (run('I1') || run('I6')) {
    const variants = [{ n: 'defaults', o: {} }, { n: 'skip weekends', o: { skipWe: true } }, { n: 'empty plate', o: { layout: 'none' } }];
    if (PROTOS) variants.push({ n: 'protocols + skip weekends', o: { skipWe: true, protos: PROTOS } });
    const manual = { n: 'manual series', o: { setup: { dosing: 'Manual (serial dilution)', compounds: 'INV-A\nINV-B\nINV-C', format: '384' } } };
    const runs1 = [];
    for (const key of KEYS) { for (const v of variants) runs1.push([key, v]); if (presetBase(key) === 'HB') runs1.push([key, manual]); }
    for (const [key, v] of runs1) {
      const cs = `${key} · ${v.n}`;
      designFrom(key, v.o);
      const ps = dsPseudo(DS), pv = previewPlate(DS, ps);
      if (v === manual && !(pv && Object.keys(pv.wells || {}).length)) bad('I1', cs, 'a manual HiBiT series with compounds listed previews an empty plate');
      // I6: wrap the draft and the call so any key nobody reads shows up.
      const readDS = new Set(), readSP = new Set(); let spKeys = [];
      const raw = DS;
      window.DS = new Proxy(raw, { get(t, k) { if (typeof k === 'string') readDS.add(k); return t[k]; } });
      const orig = window.buildExperimentFrom;
      window.buildExperimentFrom = function (sp) {
        spKeys = Object.keys(sp);
        return orig(new Proxy(sp, { get(t, k) { if (typeof k === 'string') readSP.add(k); return t[k]; } }));
      };
      let e;
      try { e = await created(() => dsCreate()); } finally { window.buildExperimentFrom = orig; }
      if (!e) { bad('I1', cs, 'dsCreate made no experiment'); continue; }
      if (run('I1')) {
        tick('I1');
        diffBlocks('I1', cs, ps.blocks.map(b => b.dsProto ? Object.assign({}, b, { proto: null }) : b), e.blocks, 'review', 'record');
        const a = plateSig(pv), b = plateSig(e.plate);
        if (a !== b) bad('I1', cs, `plate differs — ${plateDiff(pv, e.plate)}`);
      }
      if (run('I6')) {
        tick('I6');
        const UI = ['mode', 'step', 'cur', 'editKey', 'setupTouched', 'pid', 'sid', '_at'];   // navigation, not content
        Object.keys(raw).filter(k => !UI.includes(k) && !readDS.has(k))
          .forEach(k => bad('I6', cs, `draft key DS.${k} is never read on the way to the record (value ${String(J(raw[k])).slice(0, 80)})`));
        spKeys.filter(k => !readSP.has(k)).forEach(k => bad('I6', cs, `buildExperimentFrom is handed "${k}" and never reads it`));
      }
      cleanup(e);
    }
    dsClose();
  }

  // ── I2 quick = designer, I8 owned = setup, I9 quick preview dates ──
  if (run('I2') || run('I8') || run('I9')) {
    const variants = [{ n: 'defaults', o: {} }, { n: 'skip weekends', o: { skipWe: true } }];
    if (PROTOS) variants.push({ n: 'protocols', o: { protos: PROTOS } }, { n: 'protocols + skip weekends', o: { protos: PROTOS, skipWe: true } });
    for (const key of KEYS) for (const v of variants) {
      const cs = `${key} · ${v.n}`;
      openQuick(key, v.o);
      // I9 — the dates the preview lists, read off the screen it draws.
      const promised = [...document.querySelectorAll('#nm-preview .nm-pv-row')].map(r => {
        const m = (r.querySelector('.nm-pv-day') || {}).textContent.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : null; }).filter(Boolean);
      const A = await created(() => createExperiment());
      closeNew();
      designFrom(key, v.o);
      const B = await created(() => dsCreate());
      dsClose();
      if (!A || !B) { bad('I2', cs, `creation failed — quick ${!!A}, designer ${!!B}`); cleanup(A); cleanup(B); continue; }
      if (run('I2')) {
        tick('I2');
        diffBlocks('I2', cs, A.blocks, B.blocks, 'quick', 'designer');
        for (const k of ['type', 'presetKey', 'plasmids', 'cellLines', 'setup', 'blank', 'startDate', 'protocols'])
          if (J(A[k] || null) !== J(B[k] || null)) bad('I2', cs, `${k}: quick ${String(J(A[k])).slice(0, 120)} vs designer ${String(J(B[k])).slice(0, 120)}`);
        if (plateSig(A.plate) !== plateSig(B.plate)) bad('I2', cs, 'plate differs between quick and designer');
        // Absolute, not relative: both routes can be wrong the same way.
        const isBlank = !!((LB.data.presets[key] || {}).blank || (EXTRA_PRESET_SEED[key] || {}).blank);
        if (isBlank && !A.blank) bad('I2', cs, 'a Blank experiment from the quick window is not marked blank');
        if (isBlank && !B.blank) bad('I2', cs, 'a Blank experiment from the designer is not marked blank');
      }
      if (run('I9')) {
        tick('I9');
        const got = [...new Set(A.blocks.map(b => b.date))].sort(), want = [...new Set(promised)].sort();
        if (J(got) !== J(want)) bad('I9', cs, `quick preview promised ${want.join(', ')} — created ${got.join(', ')}`);
      }
      if (run('I8')) {
        tick('I8');
        const su = A.setup || {};
        // What the parameters name has to reach the record's own fields — the header, Cmd+K and
        // the prep sheet read these, not the setup. (plasmids:'' passed I2: both routes were wrong.)
        const pl = String(A.plasmids || '').toLowerCase();
        ['donors', 'acceptors', 'plasmid', 'plasmids'].forEach(k => String(su[k] == null ? '' : su[k]).split(/[,;]+/).map(x => x.trim()).filter(Boolean)
          .forEach(n => { if (pl.indexOf(n.toLowerCase()) < 0) bad('I8', cs, `the parameters name plasmid "${n}", the record's plasmids are "${A.plasmids}"`); }));
        if (su.cellLine && !String(A.cellLines || '').trim()) bad('I8', cs, `the parameters name cell line ${su.cellLine}, the record has none`);
        (A.blocks || []).forEach(b => {
          const I = b.calc && b.calc.inputs; if (!I) return;
          // A step marked as on its own plate (the 6-well a NanoBRET is transfected in) is exempt
          // from the plate's format and density — but NOT from the cell line — and it must still be
          // on the plate it was authored on: an own-plate step rescaled to the run's format is the
          // bug (800,000 cells in 2 mL → 4,700 in 30 µL) that flag exists to stop.
          if (b.calc.fmtOwn) {
            const src = (LB.data.presets[key] || {}).blocks || [];
            const t = src.find(x => x.calc && x.calc.fmtOwn && (x.title || '') === (b.tpl && b.tpl.title || b.title || ''));
            if (t && String(t.calc.inputs.format) !== String(I.format))
              bad('I8', cs, `own-plate step "${b.title}" was moved to a ${I.format}-well plate; it was authored on ${t.calc.inputs.format}`);
            if (su.cellLine && I.cellLine != null && I.cellLine !== su.cellLine)
              bad('I8', cs, `step "${b.title}" uses ${I.cellLine}, the parameters say ${su.cellLine}`);
            return;
          }
          if (su.format != null && su.format !== '' && I.format != null && String(I.format) !== String(su.format))
            bad('I8', cs, `step "${b.title}" is on a ${I.format}-well plate, the parameters say ${su.format}`);
          if (su.cellLine && I.cellLine != null && I.cellLine !== su.cellLine)
            bad('I8', cs, `step "${b.title}" uses ${I.cellLine}, the parameters say ${su.cellLine}`);
          if (su.cellsPerWell != null && su.cellsPerWell !== '' && I.cellsPerWell != null && +I.cellsPerWell !== +su.cellsPerWell)
            bad('I8', cs, `step "${b.title}" seeds ${I.cellsPerWell} cells/well, the parameters say ${su.cellsPerWell}`);
        });
      }
      cleanup(A); cleanup(B);
    }
  }

  // ── I3 the handover carries everything ──
  if (run('I3')) {
    const echo = echoFixture();
    const cases = [];
    for (const key of KEYS) cases.push({ key, o: { skipWe: true, setup: {} } });
    const hb = KEYS.find(k => presetBase(k) === 'HB');
    if (hb) cases.push({ key: hb, n: 'echo picklist', o: { echo } });
    if (PROTOS) cases.push({ key: KEYS[0], n: 'protocols', o: { protos: PROTOS, skipWe: true } });
    for (const c of cases) {
      const cs = `${c.key} · ${c.n || 'skip weekends'}`;
      tick('I3');
      // Change one answer the way a person would, so "carried" is tested against a non-default.
      const f = setupFieldsFor(c.key).find(x => x.t === 'num' || x.t === 'number');
      const setup = Object.assign({}, c.o.setup || {});
      if (f) setup[f.f] = (+(setupDefaultsFor(c.key)[f.f]) || 1) * 2 + 1;
      const o = Object.assign({}, c.o, { setup });
      openQuick(c.key, o);
      el('nm-title').value = 'Handover ' + c.key; el('nm-poi').value = 'INV'; nmUpdateCode();
      const A0 = await created(() => createExperiment());
      closeNew();
      // Taken off the notebook before B is made, or B's code is uniqued against it (_2).
      const A = A0 && JSON.parse(JSON.stringify(A0)); cleanup(A0);
      openQuick(c.key, o);
      el('nm-title').value = 'Handover ' + c.key; el('nm-poi').value = 'INV'; nmUpdateCode();
      dsFromQuick();
      const B = await created(() => dsCreate());
      dsClose();
      if (!A || !B) { bad('I3', cs, `creation failed — quick ${!!A}, handed over ${!!B}`); cleanup(A); cleanup(B); continue; }
      diffBlocks('I3', cs, A.blocks, B.blocks, 'quick', 'handed-over');
      for (const k of ['type', 'presetKey', 'title', 'plasmids', 'cellLines', 'setup', 'startDate', 'protocols', 'echoRun', 'blank'])
        if (J(A[k] || null) !== J(B[k] || null)) bad('I3', cs, `${k}: quick ${String(J(A[k])).slice(0, 120)} vs handed-over ${String(J(B[k])).slice(0, 120)}`);
      if (A.code !== B.code) bad('I3', cs, `code: quick ${A.code} vs handed-over ${B.code}`);
      if (plateSig(A.plate) !== plateSig(B.plate)) bad('I3', cs, 'plate differs after the handover');
      if (o.echo) [['quick', A], ['handed-over', B]].forEach(([nm, X]) => {
        Object.keys(o.echo.dest.wells).forEach(w => { const c = o.echo.dest.wells[w];
          if (c.dmsoOnly || !c.compound) return;
          const got = X.plate && X.plate.wells && X.plate.wells[w];
          if (!got || got.compound !== c.compound) bad('I3', cs, `${nm}: the picklist puts ${c.compound} in ${w}, the plate map has ${got ? J(got.compound) : 'nothing'}`); }); });
      cleanup(A); cleanup(B);
    }
  }

  // ── I4 typed = stored ──
  // Two shapes, both through the app's own paths (the add button's line, dsSetupUpd reading the
  // form, dsCalcSet, dsSetWait) — a harness that does the app's syncing for it cannot notice when
  // the app stops doing it:
  //   · every library module, in a design of every type, added and THEN the plate changed in the
  //     parameters before typing (the 110,000-cells frame bug needs the plate to move);
  //   · every module of every preset, where the chain above and the setup's wait tokens exist.
  function typeAll(i, owned) {
    const m = DS.mods[i], C = CALC_KINDS[m.calc.kind], typed = {};
    C.fields.forEach(f => {
      if (owned[f.k] || f.t === 'cellline' || f.t === 'format') return;   // owned: I8; these two rescale on purpose
      const cur = m.calc.inputs[f.k];
      let val;
      if (f.t === 'check') val = !cur;
      else if (f.t === 'select') { const o = (f.opts || []).filter(x => String(x) !== String(cur)); if (!o.length) return; val = o[o.length - 1]; }
      else if (f.t === 'txt') val = 'INV-' + f.k;
      else { const n = parseFloat(cur); val = Math.round(((isFinite(n) && n > 0 ? n : 1) * 3 + 7) * 100) / 100; }
      dsCalcSet(i, f.k, (f.t === 'num' || !f.t) ? String(val) : val);
      typed[f.k] = val;
    });
    return typed;
  }
  function checkTyped(cs, C, b, typed, wantWait) {
    Object.keys(typed).forEach(k => {
      const got = b.calc.inputs[k], want = typed[k];
      const same = (typeof want === 'number') ? Math.abs(+got - want) < 1e-9 : String(got) === String(want);
      if (!same) bad('I4', cs, `${C.label} · "${(C.fields.find(f => f.k === k) || {}).lbl || k}": typed ${J(want)}, stored ${J(got)}`);
    });
    if (wantWait != null && +b.waitMin !== wantWait) bad('I4', cs, `wait on "${b.title}": typed ${wantWait} min, stored ${b.waitMin}`);
  }
  function setFormat(fmt) {
    DS.step = 1; dsDraw();
    const n = document.querySelector('#ds-body [data-sf="format"]');
    if (!n) return false;
    if (![...n.options || []].some(o => o.value === fmt)) return false;
    n.value = fmt; dsSetupUpd(); return true;
  }
  if (run('I4')) {
    const specs = STEP_LIBRARY.filter(s => s.calc && CALC_KINDS[s.calc]);
    for (const ty of EXP_TYPES.map(t => t.id)) for (const sp of specs) {
      const cs = `${ty} · ${sp.id}`;
      tick('I4');
      dsOpen({ mode: 'exp', pid: PID, sid: SID });
      dsSetType(ty); DS.startDate = START;
      DS.mods.push(dsSyncMod(dsMod(sp), DS.setup, true));           // the Add button's own line
      const f0 = String(DS.setup.format || '');
      if (f0) setFormat(f0 === '384' ? '96' : '384');                  // the plate moves after the module is in
      DS.step = 3; DS.cur = 0; dsDraw();
      const m = DS.mods[0], C = CALC_KINDS[m.calc.kind];
      const typed = typeAll(0, dsOwned(m.calc.kind, DS.setup || {}));
      dsSetWait(0, '2 h 15');
      const e = await created(() => dsCreate());
      if (!e) { bad('I4', cs, 'dsCreate made no experiment'); continue; }
      const b = (e.blocks || []).find(x => x.calc && x.calc.kind === m.calc.kind);
      if (!b) bad('I4', cs, 'the created experiment has no step with this calculator');
      else checkTyped(cs, C, b, typed, 135);
      cleanup(e);
    }
    for (const key of KEYS) {
      designFrom(key, {});
      DS.step = 3; DS.cur = 0; dsDraw();
      const typedBy = [];
      DS.mods.forEach((m, i) => {
        DS.cur = i;
        const typed = m.calc && CALC_KINDS[m.calc.kind] ? typeAll(i, dsOwned(m.calc.kind, DS.setup || {})) : null;
        dsSetWait(i, String(100 + i) + ' min');
        typedBy.push({ title: m.label, typed, kind: m.calc && m.calc.kind, wait: 100 + i });
      });
      const e = await created(() => dsCreate());
      dsClose();
      if (!e) { bad('I4', key, 'dsCreate made no experiment'); continue; }
      typedBy.forEach(t => {
        tick('I4');
        const hits = (e.blocks || []).filter(b => !b.proto && b.title === t.title);
        if (hits.length !== 1) return;          // regenerated or ambiguous by title: nothing to pin it to
        const b = hits[0];
        if (t.typed && b.calc) checkTyped(`${key} · ${t.title}`, CALC_KINDS[t.kind], b, t.typed, t.wait);
        else if (+b.waitMin !== t.wait) bad('I4', `${key} · ${t.title}`, `wait: typed ${t.wait} min, stored ${b.waitMin}`);
      });
      cleanup(e);
    }
    dsClose();
  }

  // ── I5 shown = stored: prose rendered for editing and written back is unchanged ──
  if (run('I5')) {
    for (const key of KEYS) {
      designFrom(key, {});
      const ps = dsPseudo(DS);
      DS.mods.forEach((m, i) => {
        tick('I5');
        const live = (ps.blocks || []).find(b => b.dsIdx === i);
        const shown = _fillSetupSpans(fillCalc(m.html || '<p></p>', live || { calc: m.calc }, ps), DS.setup);
        const d = document.createElement('div'); d.innerHTML = shown;
        // Through the real write path, not a copy of what it does today.
        const keep = m.html; dsSetHtml(i, d.innerHTML); const back = m.html; m.html = keep;
        if (normHtml(back) !== normHtml(m.html || '<p></p>'))
          bad('I5', `${key} · designer · ${m.label}`, `edit round-trip changes the stored prose: ${normHtml(m.html).slice(0, 90)} → ${normHtml(back).slice(0, 90)}`);
      });
      // The same in a created experiment: what setExpBlockHtml stores from what fillCalc drew.
      const e = await created(() => dsCreate());
      (e && e.blocks || []).forEach(b => {
        if (b.proto || !b.html) return;
        tick('I5');
        const d = document.createElement('div'); d.innerHTML = fillCalc(b.html, b, e);
        const back = _unfillCalc(d.innerHTML);
        if (normHtml(back) !== normHtml(b.html))
          bad('I5', `${key} · experiment · ${b.title}`, `edit round-trip changes the stored prose: ${normHtml(b.html).slice(0, 90)} → ${normHtml(back).slice(0, 90)}`);
      });
      cleanup(e);
    }
    dsClose();
  }

  // ── I7 save as a design, create from the copy: the same experiment ──
  if (run('I7')) {
    for (const key of KEYS) {
      const cs = key;
      tick('I7');
      designFrom(key, {});
      const tpl = dsTemplate(DS); dsClose();
      const tmp = '__INV_' + key.replace(/\W/g, '_');
      tpl.name = 'Invariant copy of ' + key;
      LB.data.presets[tmp] = tpl;
      try {
        const qa = setupFieldsFor(key).map(f => f.f).sort(), qb = setupFieldsFor(tmp).map(f => f.f).sort();
        if (J(qa) !== J(qb)) bad('I7', cs, `the copy asks different questions: [${qa}] vs [${qb}]`);
        openQuick(key, {}); const A = await created(() => createExperiment()); closeNew();
        openQuick(tmp, {}); const B = await created(() => createExperiment()); closeNew();
        if (!A || !B) { bad('I7', cs, 'creation failed'); }
        else {
          diffBlocks('I7', cs, A.blocks, B.blocks, 'preset', 'saved copy');
          for (const k of ['type', 'plasmids', 'cellLines', 'setup', 'blank'])
            if (J(A[k] || null) !== J(B[k] || null)) bad('I7', cs, `${k}: preset ${String(J(A[k])).slice(0, 100)} vs copy ${String(J(B[k])).slice(0, 100)}`);
          if (plateSig(A.plate) !== plateSig(B.plate)) bad('I7', cs, `plate differs — preset ${A.plate ? A.plate.title || A.plate.format : 'none'} vs copy ${B.plate ? B.plate.title || B.plate.format : 'none'}`);
        }
        cleanup(A); cleanup(B);
      } finally { delete LB.data.presets[tmp]; }
    }
  }


  // ── I10 your words stay ──
  if (run('I10')) {
    for (const key of KEYS) await guard('I10', key, async () => {
      tick('I10');
      designFrom(key, {});
      const marks = [];
      DS.mods.forEach((m, i) => { if (!m.html && m.html !== '') return; const mk = 'INV-OWN-' + i; marks.push(mk); dsSetHtml(i, (m.html || '') + '<p>' + mk + '</p>'); });
      const e = await created(() => dsCreate()); dsClose();
      if (!e) { bad('I10', key, 'dsCreate made no experiment'); return; }
      const before = JSON.parse(JSON.stringify(LB.data.presets));
      _rewordFromPresets(before);
      const all = (e.blocks || []).map(b => b.html || '').join(' ');
      marks.forEach(mk => { if (all.indexOf(mk) < 0) bad('I10', key, `prose written in the Designer (${mk}) was replaced by the preset's wording`); });
      const st = expPresetStale(e);
      (st || []).forEach(x => { if (/INV-OWN-/.test(x.b.html || '')) bad('I10', key, `step "${x.b.title}" carries your words and is offered as a preset update`); });
      cleanup(e);
    });
  }

  // ── I11 questions outlive the design ──
  if (run('I11')) {
    for (const key of KEYS) await guard('I11', key, async () => {
      tick('I11');
      designFrom(key, {});
      const tmp = '__INV11_' + key.replace(/\W/g, '_');
      const tpl = dsTemplate(DS); tpl.name = 'I11 ' + key; dsClose();
      LB.data.presets[tmp] = tpl;
      designFrom(tmp, {});
      const e = await created(() => dsCreate()); dsClose();
      if (!e) { delete LB.data.presets[tmp]; bad('I11', key, 'creation failed'); return; }
      const qa = expSetupFields(e).map(f => f.f).join(',');
      delete LB.data.presets[tmp];
      const qb = expSetupFields(e).map(f => f.f).join(',');
      if (qa !== qb) bad('I11', key, `after the design is deleted the run asks [${qb}], it was made with [${qa}]`);
      cleanup(e);
    });
  }

  // ── I12 typing keeps focus ──
  if (run('I12')) {
    const isBox = n => (n.tagName === 'TEXTAREA' || (n.tagName === 'INPUT' && !/^(checkbox|radio|file|button|date)$/.test(n.type)) || n.isContentEditable)
      && !n.disabled && n.offsetParent !== null && !n.closest('.cv');
    for (const key of KEYS) await guard('I12', key, async () => {
      designFrom(key, {});
      const screens = [[0, 0], [1, 0]].concat(DS.mods.map((m, i) => [3, i])).concat([[4, 0]]);
      for (const [step, cur] of screens) {
        DS.step = step; DS.cur = cur; dsDraw();
        const boxes = [...document.querySelectorAll('#ds-body input, #ds-body textarea, #ds-body [contenteditable="true"]')].filter(isBox);
        for (let bi = 0; bi < boxes.length; bi++) {
          const all = [...document.querySelectorAll('#ds-body input, #ds-body textarea, #ds-body [contenteditable="true"]')].filter(isBox);
          const n = all[bi]; if (!n) break;
          tick('I12');
          n.focus();
          if (n.isContentEditable) { n.dispatchEvent(new InputEvent('input', { bubbles: true })); }
          else { const v = n.value; n.value = (n.type === 'number') ? String((parseFloat(v) || 0) + 1) : (v + 'x'); n.dispatchEvent(new Event('input', { bubbles: true })); }
          if (!n.isConnected || document.activeElement !== n)
            bad('I12', `${key} · step ${step + 1}${step === 3 ? ' module ' + (cur + 1) : ''}`, `typing into "${(n.closest('label,.mrow,.ds-fld') || n).textContent.trim().slice(0, 40) || n.placeholder || n.tagName}" took the focus away`);
        }
      }
      dsClose();
    });
  }

  // ── I13 defaults stay ──
  if (run('I13')) {
    const defs = EXP_TYPES.map(t => t.id).concat(Object.keys(EXTRA_PRESET_SEED)).filter(k => LB.data.presets[k]);
    for (const k of defs) await guard('I13', k, async () => {
      tick('I13');
      if (!isDefaultPreset(k)) bad('I13', k, 'a shipped preset is not recognised as a default');
      const origConfirm = window.lbConfirm; window.lbConfirm = () => Promise.resolve(true);
      try { dgDel(k); await sleep(20); } finally { window.lbConfirm = origConfirm; }
      if (!LB.data.presets[k]) { bad('I13', k, 'dgDel deleted a default preset (it would come back on the next load)'); restoreDefaultPreset(k); }
      const host = document.createElement('div'); DS_PF = 'all'; DG_Q = ''; renderDesigner(host);
      const card = [...host.querySelectorAll('.dg-card')].find(c => (c.getAttribute('oncontextmenu') || '').indexOf("'" + k + "'") >= 0);
      if (card && [...card.querySelectorAll('button')].some(b => /^Delete$/.test(b.textContent.trim()))) bad('I13', k, 'the Designer offers Delete on a default');
    });
    await guard('I13', 'duplicate', async () => {
      tick('I13');
      const origPrompt = window.lbPrompt; window.lbPrompt = () => Promise.resolve('INV13 copy');
      const before = new Set(Object.keys(LB.data.presets));
      try { dgDup('NB'); await sleep(30); } finally { window.lbPrompt = origPrompt; }
      const nk = Object.keys(LB.data.presets).filter(k => !before.has(k));
      if (nk.length !== 1) bad('I13', 'duplicate', `dgDup made ${nk.length} presets`);
      nk.forEach(k => { if (isDefaultPreset(k)) bad('I13', 'duplicate', 'the copy of a default is itself a default');
        if (LB.data.presets[k]._seedSig) bad('I13', 'duplicate', 'the copy carries the shipped signature'); delete LB.data.presets[k]; });
    });
  }

  // ── I14 own parameters ──
  if (run('I14')) {
    for (const key of KEYS) await guard('I14', key, async () => {
      tick('I14');
      designFrom(key, {});
      DS.setupAdd = (DS.setupAdd || []).concat([{ f: 'invOwn', t: 'txt', lbl: 'INV own', d: 'INV-DEF', custom: true }]);
      DS.setup.invOwn = 'INV-VAL, "q"';
      if (!dsFields(DS, DS.setup).some(f => f.f === 'invOwn')) bad('I14', key, 'an added parameter is not asked on the parameters screen');
      DS.step = 1; dsDraw();
      if (!document.querySelector('#ds-body [data-sf="invOwn"]')) bad('I14', key, 'the parameters screen draws no box for an added parameter');
      const quoted = !!DS.mods[0];
      if (quoted) {
        // Through the "Insert a parameter" chip, as a person would: the token has to be stored,
        // not the value it showed. (insertHTML stripped the span, so "1:1000" was stored.)
        DS.step = 3; DS.cur = 0; dsDraw();
        const rt = el('ds-rt');
        if (rt) { rt.focus(); const r = document.createRange(); r.selectNodeContents(rt); r.collapse(false);
          getSelection().removeAllRanges(); getSelection().addRange(r); DS_LASTED = 'rt'; dsInsTok(0, 'invOwn');
          if (String(DS.mods[0].html || '').indexOf('{{invOwn}}') < 0) bad('I14', key, 'the Insert-a-parameter chip stored the value, not the {{token}}'); }
        dsSetHtml(0, (DS.mods[0].html || '') + '<p>Own: {{invOwn}}</p>');
      }
      const tpl = dsTemplate(DS);
      const e = await created(() => dsCreate()); dsClose();
      if (!e) { bad('I14', key, 'creation failed'); return; }
      if (e.setup.invOwn !== 'INV-VAL, "q"') bad('I14', key, `the record stores ${J(e.setup.invOwn)}`);
      if (!expSetupFields(e).some(f => f.f === 'invOwn')) bad('I14', key, 'Edit setup on the record does not ask the added parameter');
      const tdiv = document.createElement('div'); tdiv.innerHTML = (e.blocks || []).map(b => b.html || '').join(' ');
      const txt = tdiv.textContent;
      if (quoted && txt.indexOf('Own: INV-VAL') < 0) bad('I14', key, 'a step quoting the parameter does not show its value in the record');
      if (/\{\{invOwn\}\}/.test((e.blocks || []).map(b => b.html || '').join(' '))) bad('I14', key, 'the token leaks into the record unfilled');
      // Changed later through Edit setup, the steps that quote it follow.
      if (quoted) {
        const cf0 = window.lbConfirm; window.lbConfirm = () => Promise.resolve(true);
        try {
          SEL.page = e.id; openSetupEditor(e.id);
          const box = document.querySelector('#es-fields [data-sf="invOwn"]');
          if (!box) bad('I14', key, 'Edit setup draws no box for the added parameter');
          else { box.value = 'INV-NEW'; box.dispatchEvent(new Event('input', { bubbles: true })); applySetupEdit(); await sleep(60);
            const t2 = document.createElement('div'); t2.innerHTML = (e.blocks || []).map(b => b.html || '').join(' ');
            if (t2.textContent.indexOf('Own: INV-NEW') < 0) bad('I14', key, 'changing the parameter in Edit setup does not reach the step that quotes it'); }
        } finally { window.lbConfirm = cf0; try { closeSetupEditor(); } catch (x) {} }
      }
      const tmp = '__INV14_' + key.replace(/\W/g, '_'); tpl.name = 'I14 ' + key; LB.data.presets[tmp] = tpl;
      try { if (!setupFieldsFor(tmp).some(f => f.f === 'invOwn')) bad('I14', key, 'a design saved with the parameter does not ask it'); }
      finally { delete LB.data.presets[tmp]; }
      cleanup(e);
    });
  }

  // ── I15 replicates ──
  if (run('I15')) {
    const cases15 = ['HB', 'CTG', 'NB', 'BLANK'].filter(k => LB.data.presets[k]).map(k => [k, {}]);
    if (PROTOS) cases15.push(['HB', { protos: PROTOS }]);   // each run is built asynchronously
    for (const [key, o15] of cases15) await guard('I15', key + (o15.protos ? ' + protocols' : ''), async () => {
      tick('I15');
      designFrom(key, o15); DS.reps = 3; DS.repGap = 7;
      const before = new Set(Object.keys(LB.data.experiments));
      dsCreate();
      let got = [];
      for (let t = 0; t < 300 && got.length < 3; t++) { await sleep(40); got = Object.keys(LB.data.experiments).filter(k => !before.has(k)).map(k => LB.data.experiments[k]); }
      if (got.length !== 3) { bad('I15', key, `asked for 3 replicates, made ${got.length}`); got.forEach(cleanup); return; }
      got.sort((a, b) => (a.repIndex || 0) - (b.repIndex || 0));
      const g = got[0].repGroup;
      if (!g || got.some(x => x.repGroup !== g)) bad('I15', key, 'the replicates are not one linked set');
      if (J(got.map(x => x.repIndex)) !== J([1, 2, 3])) bad('I15', key, `replicate indices ${J(got.map(x => x.repIndex))}`);
      if (new Set(got.map(x => x.code)).size !== 3) bad('I15', key, `codes are not distinct: ${got.map(x => x.code)}`);
      got.forEach((x, i) => { if (x.startDate !== addDays(START, 7 * i)) bad('I15', key, `replicate ${i + 1} starts ${x.startDate}, expected ${addDays(START, 7 * i)}`);
        const first = [...(x.blocks || [])].map(b => b.date).sort()[0];
        if (first && first < x.startDate) bad('I15', key, `replicate ${i + 1} has a step before its own start`); });
      if (DS) { bad('I15', key, 'the Designer is still open after the set was made'); dsClose(); }
      got.forEach(cleanup);
    });
  }

  // ── I16 answers typed on the parameters screen are the answers stored ──
  if (run('I16')) {
    for (const key of KEYS) await guard('I16', key, async () => {
      designFrom(key, {});
      DS.setupAdd = (DS.setupAdd || []).concat([{ f: 'invList', t: 'list', lbl: 'INV list', d: '', custom: true }]);
      DS.step = 1; dsDraw();
      const want = {}, done = new Set();
      for (let guardN = 0; guardN < 60; guardN++) {
        const n = [...document.querySelectorAll('#ds-body [data-sf]')].find(x => !done.has(x.getAttribute('data-sf')));
        if (!n) break;
        const k = n.getAttribute('data-sf'); done.add(k);
        const f = dsFields(DS).find(x => x.f === k);
        if (!f || f.t === 'format' || f.t === 'cellline') continue;   // side effects are the point of those two
        tick('I16');
        if (n.type === 'checkbox') { n.checked = !n.checked; want[k] = n.checked; n.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (n.tagName === 'SELECT') { const o = n.options[n.options.length - 1]; n.value = o.value; want[k] = o.value; n.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (n.tagName === 'TEXTAREA') { n.value = 'INV-A\nINV-B'; want[k] = n.value; n.dispatchEvent(new Event('input', { bubbles: true })); }
        else if (n.type === 'number') { const v = 7 + done.size; n.value = String(v); want[k] = v; n.dispatchEvent(new Event('input', { bubbles: true })); }
        else { n.value = 'INV-' + k; want[k] = n.value; n.dispatchEvent(new Event('input', { bubbles: true })); }
        if (String(DS.setup[k]) !== String(want[k])) bad('I16', key, `parameter "${k}" typed as ${J(want[k])}, the draft holds ${J(DS.setup[k])} until something else is touched`);
      }
      const e = await created(() => dsCreate()); dsClose();
      if (!e) { bad('I16', key, 'creation failed'); return; }
      Object.keys(want).forEach(k => {
        if (!expSetupFields(e, e.setup).some(f => f.f === k)) return;   // a later answer made it not asked
        if (String(e.setup[k]) !== String(want[k])) bad('I16', key, `parameter "${k}" typed as ${J(want[k])}, stored as ${J(e.setup[k])}`);
      });
      cleanup(e);
    });
  }

  // ── I17 every setup form: focus kept, typed = held ──
  if (run('I17')) {
    async function typeInto(hostSel, cs, tag, hold) {
      const want = {}, done = new Set();
      for (let g = 0; g < 60; g++) {
        const host = document.querySelector(hostSel); if (!host) { bad('I17', cs, `${tag}: no form`); return; }
        const n = [...host.querySelectorAll('[data-sf]')].find(x => !done.has(x.getAttribute('data-sf')) && x.offsetParent !== null);
        if (!n) break;
        const k = n.getAttribute('data-sf'); done.add(k);
        if (k === 'format' || k === 'cellLine') continue;
        tick('I17');
        if (n.type === 'checkbox') { n.checked = !n.checked; want[k] = n.checked; n.dispatchEvent(new Event('change', { bubbles: true })); continue; }
        if (n.tagName === 'SELECT') { const o = n.options[n.options.length - 1]; n.value = o.value; want[k] = o.value; n.dispatchEvent(new Event('change', { bubbles: true })); continue; }
        n.focus();
        if (n.tagName === 'TEXTAREA') { n.value = 'INV-A\nINV-B'; want[k] = n.value; }
        else if (n.type === 'number') { const v = 5 + done.size; n.value = String(v); want[k] = v; }
        else { n.value = 'INV-' + k; want[k] = n.value; }
        n.dispatchEvent(new Event('input', { bubbles: true }));
        if (!n.isConnected || document.activeElement !== n) bad('I17', cs, `${tag}: typing into "${k}" took the focus away`);
        // Checked at once, not only at the end: a later box re-reading the whole form hides a box
        // that never stored itself — which is exactly what hid the preset editor's list fields.
        const now = hold();
        if (String(now[k]) !== String(want[k])) bad('I17', cs, `${tag}: "${k}" typed as ${J(want[k])}, the form holds ${J(now[k])} until something else is touched`);
      }
      const st = hold();
      Object.keys(want).forEach(k => { if (!document.querySelector(`${hostSel} [data-sf="${k}"]`)) return;
        if (String(st[k]) !== String(want[k])) bad('I17', cs, `${tag}: "${k}" typed as ${J(want[k])}, the form holds ${J(st[k])}`); });
    }
    for (const key of KEYS) await guard('I17', key, async () => {
      openQuick(key, {}); nmSetup();
      await typeInto('#nm-setup', key, 'quick window', () => NM_SETUP || {});
      closeNew();
      // Designs are edited in the Designer only (the older preset editor was retired 2026-09-26).
      dsOpen({ mode: 'preset', presetKey: key }); DS.step = 1; dsDraw();
      await typeInto('#ds-body', key, 'Designer (editing the design)', () => (DS && DS.setup) || {});
      dsClose();
      openQuick(key, {}); const e = await created(() => createExperiment()); closeNew();
      if (e) { openSetupEditor(e.id);
        if (el('es-modal').classList.contains('open')) await typeInto('#es-fields', key, 'Edit setup', () => ES_SETUP || {});
        closeSetupEditor(); cleanup(e); }
    });
  }

  // ── I19 experiment → preset → experiment ──
  if (run('I19')) {
    for (const key of KEYS) await guard('I19', key, async () => {
      tick('I19');
      designFrom(key, {});
      DS.setupAdd = (DS.setupAdd || []).concat([{ f: 'invOwn', t: 'txt', lbl: 'INV own', d: 'INV-DEF', custom: true }]);
      DS.setup.invOwn = 'INV-19';
      if (DS.mods[0]) dsSetHtml(0, (DS.mods[0].html || '') + '<p>Own: {{invOwn}}</p>');
      const A = await created(() => dsCreate()); dsClose();
      if (!A) { bad('I19', key, 'creation failed'); return; }
      const pr0 = window.lbPrompt, before = new Set(Object.keys(LB.data.presets));
      window.lbPrompt = () => Promise.resolve('INV19 ' + key);
      try { saveExpAsPreset(A.id); await sleep(40); } finally { window.lbPrompt = pr0; }
      const nk = Object.keys(LB.data.presets).find(k => !before.has(k));
      if (!nk) { bad('I19', key, 'saveExpAsPreset made no preset'); cleanup(A); return; }
      try {
        const qa = expSetupFields(A).map(f => f.f).sort().join(','), qb = setupFieldsFor(nk).map(f => f.f).sort().join(',');
        if (qa !== qb) bad('I19', key, `the preset asks [${qb}], the experiment was asked [${qa}]`);
        if (!!A.blank !== !!LB.data.presets[nk].blank) bad('I19', key, 'the preset lost what kind of page it is (blank)');
        designFrom(nk, {});
        const B = await created(() => dsCreate()); dsClose();
        if (!B) bad('I19', key, 'creation from the saved preset failed');
        else {
          diffBlocks('I19', key, A.blocks, B.blocks, 'experiment', 'from its preset');
          if (J(A.setup) !== J(B.setup)) bad('I19', key, `setup: ${String(J(A.setup)).slice(0, 140)} vs ${String(J(B.setup)).slice(0, 140)}`);
          if (plateSig(A.plate) !== plateSig(B.plate)) bad('I19', key, `plate differs — ${plateDiff(A.plate, B.plate)}`);
          cleanup(B);
        }
      } finally { delete LB.data.presets[nk]; cleanup(A); }
    });
  }

  // ── I20 open a design, save it untouched: nothing changes ──
  if (run('I20')) {
    const pdiff = (a, b, path, out) => { if (J(a) === J(b)) return out;
      if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => pdiff(a[k], b[k], path + '.' + k, out)); return out; }
      out.push(`${path}: ${String(J(a)).slice(0, 80)} → ${String(J(b)).slice(0, 80)}`); return out; };
    for (const k of KEYS) await guard('I20', k, async () => {
      const key = '__INV20_' + k.replace(/\W/g, '_'), orig = JSON.parse(JSON.stringify(LB.data.presets[k])); delete orig._seedSig;
      try {
        tick('I20');
        LB.data.presets[key] = JSON.parse(JSON.stringify(orig));
        dsOpen({ mode: 'preset', presetKey: key }); dsSavePreset(true); await sleep(10);
        pdiff(orig, JSON.parse(JSON.stringify(LB.data.presets[key])), 'preset', []).forEach(d => bad('I20', k, `Designer, saved untouched: ${d}`));
      } finally { delete LB.data.presets[key]; try { dsClose(); closePresetEditor(); } catch (x) {} }
    });
  }

  // ── I21 a lytic read ends the well: every readout starts from the same volume ──
  if (run('I21')) {
    for (const key of KEYS) await guard('I21', key, async () => {
      tick('I21');
      designFrom(key, {});
      const reads = dsChain(dsPseudo(DS)).filter(x => x.b.calc && VOL_TERMINAL[x.b.calc.kind]);
      dsClose();
      const b0 = reads.length ? reads[0].before : null;
      reads.forEach(x => { if (x.before !== b0) bad('I21', key, `readout "${x.b.title}" starts from ${x.before} µL; the first readout started from ${b0} µL — a read went into wells another read had already lysed`); });
    });
  }

  // ── I22 the Designer's step text follows its calculator as it is typed ──
  if (run('I22')) {
    for (const key of KEYS) await guard('I22', key, async () => {
      designFrom(key, {});
      DS.step = 3;
      for (let i = 0; i < DS.mods.length; i++) {
        const m = DS.mods[i]; if (!m.calc || !CALC_KINDS[m.calc.kind] || !/\{\{c\./.test(m.html || '')) continue;
        DS.cur = i; dsDraw();
        const inputs = [...document.querySelectorAll('.ds-calc .cc-inputs input[type="number"]:not([disabled])')];
        for (const inp of inputs) {
          tick('I22');
          const v0 = +inp.value || 0; inp.value = String(Math.round((v0 || 10) * 1.7 + 3)); inp.dispatchEvent(new Event('input', { bubbles: true }));
          const ps = dsPseudo(DS); const live = ps.blocks.find(b => b.dsIdx === i);
          const vals = calcValuesChained(live, ps) || {};
          [...document.querySelectorAll('#ds-rt span.cv[data-c]')].forEach(sp => {
            const k = sp.getAttribute('data-c'); if (k === 'wait') return;
            const want = vals[k] == null ? '—' : String(vals[k]).replace(/<[^>]+>/g, '');
            if (sp.textContent !== want) bad('I22', key, `"${m.label}": typed into "${inp.closest('label') && inp.closest('label').innerText.split('\n')[0]}", the text still says ${k}=${sp.textContent}, the calculator says ${want}`);
          });
        }
      }
      dsClose();
    });
  }

  // ── I23 what each step leaves is what the next starts from, Review and record alike ──
  if (run('I23')) {
    for (const key of KEYS) await guard('I23', key, async () => {
      designFrom(key, {});
      // A step with no volume calculator that says it adds 7 µL, dropped in after the first step
      // that puts liquid in the well.
      const ch0 = dsChain(dsPseudo(DS)); const first = ch0.findIndex(x => x.add > 0);
      if (first < 0) { dsClose(); return; }
      tick('I23');
      const at = ch0[first].b.dsIdx + 1;
      const extra = dsMod({ title: 'INV adds 7', html: '<p>add 7 µL</p>' }); extra.addUL = 7; DS.mods.splice(at, 0, extra);
      const ps = dsPseudo(DS), ch = dsChain(ps);
      const ix = ch.findIndex(x => x.b.title === 'INV adds 7');
      if (ix < 0 || Math.abs(ch[ix].add - 7) > 1e-9) bad('I23', key, `a step that says it adds 7 µL adds ${ix < 0 ? 'nothing (not in the chain)' : ch[ix].add} in the Review`);
      for (let j = 1; j < ch.length; j++) {
        const prev = ch[j - 1], cur = ch[j];
        const expect = (prev.b.calc && VOL_TERMINAL[prev.b.calc.kind]) ? prev.before : prev.after;
        const k = cur.b.calc && cur.b.calc.kind;
        if (k && (CHAINED_INPUTS[k] || []).length && !(cur.b.calc.own || {})[CHAINED_INPUTS[k][0]] && expect > 0 && cur.before !== expect)
          bad('I23', key, `"${cur.b.title}" starts from ${cur.before} µL; the step above leaves ${expect} µL`);
      }
      const review = ch.map(x => x.b.title + ':' + x.after);
      const e = await created(() => dsCreate());
      if (!e) { bad('I23', key, 'the design did not create an experiment'); return; }
      const rec = dsChain(e).map(x => x.b.title + ':' + x.after);
      if (JSON.stringify(rec) !== JSON.stringify(review)) bad('I23', key, `the record's well volumes are not the Review's: record ${rec.join(' · ')} / review ${review.join(' · ')}`);
    });
  }

  // ── I24 the Review's plate map can be edited, and the edit is the plate created ──
  if (run('I24')) {
    for (const key of KEYS) await guard('I24', key, async () => {
      designFrom(key, {});
      if (!DS.plate) { dsClose(); return; }
      DS.step = 4; dsDraw();
      const pl0 = dsPlateFor(DS, dsPseudo(DS)); if (!pl0) { dsClose(); return; }
      tick('I24');
      const btn = [...document.querySelectorAll('.ds-plate button')].find(b => /openPlateEditor/.test(b.getAttribute('onclick') || ''));
      if (!btn) { bad('I24', key, 'the Review draws a plate with no Edit button'); dsClose(); return; }
      const lbToast0 = window.toast; let said = ''; window.toast = t => { said = String(t); };
      btn.click(); window.toast = lbToast0;
      const open = document.getElementById('plate-modal').classList.contains('open');
      if (!open) { bad('I24', key, `Edit on the Review's plate did not open the editor${said ? ` ("${said}")` : ''}`); dsClose(); return; }
      const p = plCur(); p.title = 'INV edited on the Review'; platePersist(PL.key); closePlateEditor();
      const shown = dsPlateFor(DS, dsPseudo(DS));
      if (!shown || shown.title !== 'INV edited on the Review') bad('I24', key, 'an edit made on the Review is not the plate the Review then shows');
      const e = await created(() => dsCreate());
      if (!e) { bad('I24', key, 'the design did not create an experiment'); return; }
      if (!e.plate || e.plate.title !== 'INV edited on the Review') bad('I24', key, `the experiment was created with ${e.plate ? 'a different plate' : 'no plate'} than the one edited on the Review`);
    });
  }

  // ── I25 moving a day moves every step on it ──
  if (run('I25')) {
    const lbPrompt0 = window.lbPrompt, lbChoose0 = window.lbChoose;
    for (const key of KEYS) for (const ans of ['all', 'one']) await guard('I25', key + ' / ' + ans, async () => {
      openQuick(key, {});
      const e = await created(() => createExperiment()); closeNew();
      if (!e) { bad('I25', key, 'the quick window did not create an experiment'); return; }
      const dates = [...new Set((e.blocks || []).map(b => b.date).filter(Boolean))].sort();
      // A day with company, so there are siblings to leave behind; else any day.
      const day = dates.find(d => e.blocks.filter(b => b.date === d).length > 1) || dates[0];
      if (!day) return;
      tick('I25');
      const before = {}; e.blocks.forEach(b => { before[b.id] = b.date; });
      const nd = addDays(day, 2);
      window.lbPrompt = () => Promise.resolve(nd);
      window.lbChoose = () => Promise.resolve(ans);
      setDayDate(e.id, day);
      await sleep(80);
      window.lbPrompt = lbPrompt0; window.lbChoose = lbChoose0;
      e.blocks.forEach(b => {
        const was = before[b.id];
        const want = was === day ? nd : (was > day && ans === 'all') ? addDays(was, 2) : was;
        if (b.date !== want) bad('I25', key + ' / ' + ans, `"${b.title}" was on ${was}; moving ${day} to ${nd} (${ans === 'all' ? 'and the rest' : 'this day only'}) left it on ${b.date}, not ${want}`);
      });
      // And one step on its own moves alone.
      const one = e.blocks.find(b => b.date === nd), sib = e.blocks.filter(b => b.date === nd && b !== one);
      if (one) {
        window.lbChoose = () => Promise.resolve('one');
        setBlockDate(one.id, addDays(nd, 1), false, e.id);
        await sleep(50);
        window.lbChoose = lbChoose0;
        if (one.date !== addDays(nd, 1)) bad('I25', key, `"Change the date" on one step did not move it`);
        sib.forEach(b => { if (b.date !== nd) bad('I25', key, `moving one step also moved "${b.title}"`); });
      }
    });
  }

  // ── I18 no box anywhere loses the caret ──
  if (run('I18')) {
    const lbAlert0 = window.lbAlert, lbConfirm0 = window.lbConfirm;
    window.lbConfirm = () => Promise.resolve(false);
    const vis = root => [...(root || document).querySelectorAll('input,textarea,[contenteditable="true"]')].filter(n => {
      if (n.disabled || n.readOnly || n.offsetParent === null || n.closest('[inert]')) return false;
      if (n.tagName === 'INPUT' && /^(checkbox|radio|file|button|date|color|range|submit|time)$/.test(n.type)) return false;
      const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const desc = n => ((n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.split(' ')[0] : '') + ' ' + (n.getAttribute('placeholder') || '').slice(0, 30)).trim();
    const shut = () => { document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')); try { dsClose(); } catch (e) {} };
    const made18 = [];
    for (const k of ['NB_SPARK_RTX96', 'CTG', 'WB']) { openQuick(k, {}); const e = await created(() => createExperiment()); closeNew(); if (e) made18.push(e); }
    const [eA, eB, eC] = made18;
    const screens = [
      ['experiment + Report', () => { selectNode('expsec', PID, SID); SEL.page = eA.id; REPORT_OPEN = true; renderAll(); }],
      ['experiment (CTG)', () => { SEL.page = eB.id; renderAll(); }],
      ['experiment (WB)', () => { SEL.page = eC.id; renderAll(); }],
      ['plate editor', () => { SEL.page = eA.id; renderAll(); openPlateEditor('exp:' + eA.id); }],
      ['new experiment', () => openNew(PID, SID)],
      ['edit setup', () => openSetupEditor(eA.id)],
      ['design editor', () => { dsOpen({ mode: 'preset', presetKey: 'NB_SPARK_RTX96' }); DS.step = 1; dsDraw(); }],
      ['experiments list', () => { selectNode('exps'); renderAll(); }],
      ['today', () => { selectNode('today'); renderAll(); }],
      ['journal', () => { openJournalWs(); renderAll(); }],
      ['visualize', () => { selectNode('viz'); renderAll(); }],
      ['designer surface', () => { selectNode('design'); renderAll(); }],
      ['settings', () => openSettings()],
    ];
    for (const [nm, go] of screens) await guard('I18', nm, async () => {
      shut(); go(); await sleep(420);   // past the screen cross-fade
      const n0 = vis().length;
      for (let i = 0; i < n0; i++) {
        const n = vis()[i]; if (!n) break;
        n.focus(); if (document.activeElement !== n) continue;
        tick('I18');
        if (n.isContentEditable) document.execCommand('insertText', false, 'x');
        else { const v = n.value; n.value = (n.type === 'number') ? String((parseFloat(v) || 0) + 1) : (v + 'x'); n.dispatchEvent(new Event('input', { bubbles: true })); }
        await sleep(20);
        if (!n.isConnected || document.activeElement !== n) bad('I18', nm, `typing into ${desc(n) || n.tagName} took the caret away`);
      }
    });
    shut(); made18.forEach(cleanup); window.lbAlert = lbAlert0; window.lbConfirm = lbConfirm0;
  }

  // ══ Report and exports ═════════════════════════════════════════════════════════════════════
  // One experiment per preset, dressed with content no seed has — a ticked step with a log, a
  // result table with a flagged row, an excluded row and a compound whose name carries a comma
  // and quotes, an observation, an outcome, a file, a plate well, a deviation — each carrying a
  // marker. Then every way the experiment leaves the notebook is asked whether it says so.
  const RUN_R = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'].some(run);
  if (RUN_R) {
    const DL = [];                                      // everything _dl was handed
    const origDl = window._dl, origPrint = window.print;
    window._dl = function (name, text, mime) { DL.push({ name, text: String(text), mime }); };
    window.print = function () {};
    window.lbChoose = function (m, o) { const a = ((o && o.answers) || []).find(x => x.safe) || ((o && o.answers) || [])[0]; return Promise.resolve(a ? a.id : null); };
    const pageErrs = []; const onErr = ev => pageErrs.push(String(ev && (ev.message || ev.reason) || ev));
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
    function text(html) {
      const d = document.createElement('div'); d.innerHTML = String(html || '');
      d.querySelectorAll('style,script').forEach(n => n.remove());
      return (d.textContent || '').replace(/\s+/g, ' ');
    }
    // What must never reach anything that leaves the notebook.
    const LEAKS = [[/\{\{/, 'a raw {{token}}'], [/\bundefined\b/, '"undefined"'], [/\bNaN\b/, '"NaN"'], [/\[object /, '"[object …]"'],
      [/&(amp|lt|gt|quot|nbsp|ndash|mdash|minus|deg|times);/, 'a double-escaped entity'], [/\bInfinity\b/, '"Infinity"']];
    function leaks(inv, cs, where, t) { LEAKS.forEach(([re, what]) => { const m = t.match(re); if (m) bad(inv, cs, `${where} contains ${what}: …${t.slice(Math.max(0, m.index - 50), m.index + 40)}…`); }); }
    function parseCSV(t) {
      t = t.replace(/^﻿/, ''); const rows = []; let row = [], f = '', q = false;
      for (let i = 0; i < t.length; i++) { const c = t[i];
        if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
        else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
        else if (c === '\r') {} else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
      row.push(f); rows.push(row); return rows;
    }
    const RES = [
      { compound: 'INV-CPD-1', target: 'BRD4', potency: 12.3, effect: 85, hill: 1.1, r2: 0.99 },
      { compound: 'INV "Q", 2', target: 'BRD4', potency: 45, effect: 60, hill: 0.9, r2: 0.95, flag: 'R2<0.97', note: 'INV-NOTE' },
      { compound: 'INV-X', target: 'BRD4', potency: 999, effect: 10, hill: 1, r2: 0.5, excluded: true, note: 'INV-EXCL' }];
    function dress(e) {
      e.aim = 'INV-AIM does it work';
      e.html = '<p>INV-OBS seen</p>';
      e.outcome = { verdict: 'partial', text: 'INV-OUTCOME', at: Date.now() };
      e.integration = { results: [{ id: 'r_inv', source: 'Echo', label: 'INV run', assay: e.type, potencyLabel: 'DC50', potencyUnit: 'nM',
        effectLabel: 'Dmax', effectUnit: '%', createdAt: new Date().toISOString(), rows: JSON.parse(JSON.stringify(RES)) }] };
      e.files = [{ id: 'f_inv', attId: 'att_inv', name: 'INV-FILE.csv', mime: 'text/csv', size: 12, kind: 'data', added: Date.now(), caption: 'INV-CAP', include: true }];
      const bs = (e.blocks || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const t = bs[0];
      if (t) { t.done = true; t.completedAt = new Date((t.date || START) + 'T10:15:00').getTime(); t.log = 'INV-LOG happened'; }
      if (!e.plate) e.plate = newPlate('96');
      const ty = (e.plate.types || []).find(x => x.id !== 'blank') || { id: 'dose' };
      e.plate.wells = e.plate.wells || {};
      e.plate.wells.H12 = { typeId: ty.id, compound: 'INV-PL', conc: '1 µM' };
      // A deviation: one planned calculator number changed.
      const cb = (e.blocks || []).find(b => b.calc && b.calcSeed && Object.keys(b.calcSeed).some(k => typeof b.calcSeed[k] === 'number' && b.calc.inputs[k] === b.calcSeed[k]));
      if (cb) { const k = Object.keys(cb.calcSeed).find(k => typeof cb.calcSeed[k] === 'number' && cb.calc.inputs[k] === cb.calcSeed[k]); cb.calc.inputs[k] = cb.calcSeed[k] * 2 + 1; e._invDev = cb.title; }
      e.updated = Date.now();
      return { ticked: t };
    }
    const made = [];
    for (const key of KEYS) await guard('R3', key + ' (creating it)', async () => {
      openQuick(key, {});
      const e = await created(() => createExperiment()); closeNew();
      if (!e) { bad('R3', key, 'could not create an experiment to dress'); return; }
      const d = dress(e); made.push({ key, e, d });
    });
    // And one whose steps are Archive protocol stages, where Archive is there to give them.
    if (PROTOS) { openQuick(KEYS[0], { protos: PROTOS }); const e = await created(() => createExperiment()); closeNew();
      if (e) made.push({ key: KEYS[0] + ' + protocols', e, d: dress(e) }); }
    const ALLON = Object.assign({}, PDF_DEFAULTS); Object.keys(ALLON).forEach(k => ALLON[k] = 1);
    const pdfTxt = (o, sc) => text(buildPrintDoc(o, sc));

    // ── R1 the Report is the record, live ──
    if (run('R1')) for (const { key, e, d } of made) await guard('R1', key, async () => {
      tick('R1');
      e.pubEdited = false; delete e.pubOpts;
      let t = text(pubText(e));
      const want = [['aim', 'INV-AIM'], ['log', 'INV-LOG'], ['obs', 'INV-OBS'], ['outcome', 'INV-OUTCOME'], ['results', 'INV-CPD-1'], ['files', 'INV-FILE.csv'], ['results', 'INV-EXCL']];
      want.forEach(([k, m]) => { if (t.indexOf(m) < 0) bad('R1', key, `the Report does not carry ${m} (${k})`); });
      if (e._invDev && !deviationsSentence(e)) bad('R1', key, `a changed number on "${e._invDev}" is not reported as a deviation`);
      if (e._invDev && t.indexOf('Deviations') < 0) bad('R1', key, 'the Report has no Deviations section though the run deviated');
      const rs = text(pubResultsSentence(e) || '');
      if (rs.indexOf('INV-X') >= 0) bad('R1', key, 'an excluded measurement is quoted in the results sentence');
      // Live: a change to the record reaches the Report with nothing pressed.
      if (d.ticked) { d.ticked.log = 'INV-LIVE-2'; if (text(pubText(e)).indexOf('INV-LIVE-2') < 0) bad('R1', key, 'a changed step log does not reach the live Report'); }
      e.aim = 'INV-AIM-2'; if (text(pubText(e)).indexOf('INV-AIM-2') < 0) bad('R1', key, 'a changed aim does not reach the live Report');
      // Every section toggle does what it says: off removes it, on brings it back.
      const markers = { aim: 'INV-AIM-2', obs: 'INV-OBS', outcome: 'INV-OUTCOME', files: 'INV-FILE.csv', log: 'INV-LIVE-2', results: 'INV-CPD-1' };
      PUB_SECTIONS.forEach(sec => { const m = markers[sec.k]; if (!m) return;
        const o = pubOpts(e); o[sec.k] = false; e.pubOpts = o;
        if (text(pubText(e)).indexOf(m) >= 0) bad('R1', key, `turning "${sec.lbl}" off leaves ${m} in the Report`);
        delete e.pubOpts; });
      // Your wording is kept, and the Report says when the record has moved on under it.
      pubEdit(e.id, pubText(e) + '<p>INV-MINE</p>');
      if (pubIsStale(e)) bad('R1', key, 'writing in the Report makes it look stale by itself');
      if (d.ticked) { d.ticked.log = 'INV-LIVE-3'; if (!pubIsStale(e)) bad('R1', key, 'the record changed under hand-written wording and the Report does not say it is stale'); }
      if (text(pubText(e)).indexOf('INV-MINE') < 0) bad('R1', key, 'hand-written wording was not kept');
      e.pubEdited = false; delete e.pubSrcSig; if (d.ticked) d.ticked.log = 'INV-LOG happened'; e.aim = 'INV-AIM does it work';
    });

    // ── R2 nothing leaks: tokens, undefined, NaN, double escapes ──
    if (run('R2')) for (const { key, e } of made) await guard('R2', key, async () => {
      tick('R2');
      leaks('R2', key, 'the Report', text(pubText(e)));
      leaks('R2', key, 'the Methods sheet', text(buildMethodsDoc(e)));
      leaks('R2', key, 'the record PDF', pdfTxt(ALLON, { kind: 'exp', id: e.id }));
      leaks('R2', key, 'the bench sheet', text(buildLabSheet(e)));
      // The JSON is the record, and the record's prose is stored with its tokens on purpose —
      // it is checked by parsing instead: it must be valid and name the experiment.
      try { const j = JSON.parse(buildExpJSON(e)); if (!j.experiment || j.experiment.id !== e.id) bad('R2', key, 'the JSON does not carry the experiment'); }
      catch (x) { bad('R2', key, 'the JSON does not parse: ' + x.message); }
      try { openPrepSheet({ expId: e.id }); const c = el('lb-dialog-card'); if (c) leaks('R2', key, 'What you need', (c.textContent || '').replace(/\s+/g, ' ')); } catch (x) { bad('R2', key, 'What you need threw: ' + x.message); }
      try { _lbDlgClose(); } catch (x) {}
    });

    // ── R3 every export runs, through its own button ──
    if (run('R3')) for (const { key, e } of made) await guard('R3', key, async () => {
      tick('R3');
      selectNode('expsec', e.projectId, e.sectionId); SEL.page = e.id; REPORT_OPEN[e.id] = true; renderAll();
      await sleep(30);
      // Every handler on the Report names a function that exists.
      const host = document.querySelector('#sec-pub') || document.getElementById('pane-ed');
      (host ? [...host.querySelectorAll('[onclick]')] : []).forEach(n => {
        const m = String(n.getAttribute('onclick')).match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);
        if (m && typeof window[m[1]] !== 'function') bad('R3', key, `a Report button calls ${m[1]}(), which does not exist`);
      });
      const exp = [...(reportExportsHtml(e).matchAll(/onclick="([A-Za-z_$][\w$]*)\(/g))].map(x => x[1]);
      exp.forEach(fn => { if (typeof window[fn] !== 'function') bad('R3', key, `export button calls ${fn}(), which does not exist`); });
      const calls = [
        ['record PDF', () => exportPDF(ALLON, { kind: 'exp', id: e.id }), () => el('print-root').textContent],
        ['Methods sheet', () => exportMethods(e.id), () => el('print-root').textContent],
        ['bench sheet', () => exportLab(e.id), () => el('print-root').textContent],
        ['results CSV', () => exportResultsCSV(e.id), null], ['steps CSV', () => exportStepsCSV(e.id), null],
        ['JSON', () => exportExpJSON(e.id), null], ['plate PNG', () => exportPlatePNG('exp:' + e.id), null],
        ['copy', () => copyPubReady(e.id), null], ['copy rendered', () => copyRendered(), null],
      ];
      for (const [nm, fn, after] of calls) {
        const n0 = DL.length, e0 = pageErrs.length;
        try { fn(); } catch (x) { bad('R3', key, `${nm} threw: ${x.message}`); continue; }
        await sleep(nm === 'plate PNG' ? 250 : 40);
        if (pageErrs.length > e0) bad('R3', key, `${nm} raised: ${pageErrs.slice(e0).join(' | ')}`);
        if (after) { const t = after() || ''; if (t.indexOf(e.code) < 0 && t.indexOf(e.title) < 0) bad('R3', key, `${nm} printed a page that does not name the experiment`); }
        if (/CSV|JSON/.test(nm) && DL.length === n0) bad('R3', key, `${nm} produced no file`);
      }
      try { await buildOneNoteHtml(); } catch (x) { bad('R3', key, 'Word export threw: ' + x.message); }
    });

    // ── R4 the record PDF is the record, and every box does what it says ──
    if (run('R4')) for (const { key, e } of made) await guard('R4', key, async () => {
      tick('R4');
      const sc = { kind: 'exp', id: e.id }, all = pdfTxt(ALLON, sc);
      (e.blocks || []).forEach(b => { if (b.title && all.indexOf(text(b.title).trim()) < 0) bad('R4', key, `the record PDF has no step "${b.title}"`); });
      ['INV-AIM', 'INV-OUTCOME', 'INV-OBS', 'INV-LOG', 'INV-CPD-1', 'INV-FILE.csv', 'INV-PL'].forEach(m => { if (all.indexOf(m) < 0) bad('R4', key, `the record PDF (everything on) does not carry ${m}`); });
      const marks = { aim: 'INV-AIM', obs: 'INV-OBS', log: 'INV-LOG', results: 'INV-CPD-1', files: 'INV-FILE.csv', plateText: 'H12' };   // the grid draws the name too; the well list is what names H12
      if (e._invDev) marks.deviations = 'Deviations from plan';
      // The well list is a table of its own; the grid's dose key also names ranges, so the
      // box is checked by the element it adds, not by a well id.
      { const on = buildPrintDoc(ALLON, sc), o = Object.assign({}, ALLON); o.plateText = 0;
        if (e.plate && /class="pk-sumt"/.test(on) === false) bad('R4', key, 'with "Plate maps as text" on there is no well list under the map');
        if (/class="pk-sumt"/.test(buildPrintDoc(o, sc))) bad('R4', key, 'with "Plate maps as text" off the well list is still printed'); }
      delete marks.plateText;
      Object.keys(marks).forEach(k => { const o = Object.assign({}, ALLON); o[k] = 0;
        const t = pdfTxt(o, sc);
        if (t.indexOf(marks[k]) >= 0) bad('R4', key, `with "${(PDF_FIELDS.find(f => f[0] === k) || [k, k])[1]}" off the PDF still carries ${marks[k]}`); });
    });

    // ── R5 JSON out and back in is the same experiment ──
    if (run('R5')) {
      const STRIP = ['id', 'created', 'updated', 'imported', 'code', 'projectId', 'sectionId'];
      const norm = x => { const c = JSON.parse(JSON.stringify(x)); STRIP.forEach(k => delete c[k]); (c.blocks || []).forEach(b => delete b.id); return canon(c); };
      for (const { key, e } of made) await guard('R5', key, async () => {
        tick('R5');
        const env = JSON.parse(buildExpJSON(e));
        const e2 = _reidExperiment(env.experiment); _landImported(e2, env, e.projectId, e.sectionId);
        if (J(norm(e)) !== J(norm(e2))) {
          const a = norm(e), b = norm(e2); const ks = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => J(a[k]) !== J(b[k]));
          bad('R5', key, `the imported copy differs in ${ks.join(', ')}`);
        }
        if (!e2.imported || !e2.imported.originalId) bad('R5', key, 'the imported copy does not say where it came from');
        const p1 = pdfTxt(ALLON, { kind: 'exp', id: e.id }).split(e.code).join('#'), p2 = pdfTxt(ALLON, { kind: 'exp', id: e2.id }).split(e2.code).join('#');
        if (p1 !== p2) bad('R5', key, 'the imported copy prints differently from the original');
        delete LB.data.experiments[e2.id];
      });
      tick('R5');
      const sc = { kind: 'folder', id: PID, sectionId: SID }, n0 = DL.length;
      exportBundleJSON(sc);
      const f = DL[n0]; if (!f) bad('R5', 'bundle', 'the folder bundle produced no file');
      else { const B = JSON.parse(f.text), want = pdfScopeExps(sc).length;
        if ((B.experiments || []).length !== want) bad('R5', 'bundle', `the folder holds ${want} experiments, the bundle ${(B.experiments || []).length}`); }
    }

    // ── R6 the CSVs are the record, and parse back ──
    if (run('R6')) for (const { key, e } of made) await guard('R6', key, async () => {
      tick('R6');
      let n0 = DL.length; exportResultsCSV(e.id);
      const rc = DL[n0]; if (!rc) { bad('R6', key, 'no results CSV'); return; }
      const rows = parseCSV(rc.text).filter(r => r.length > 1), H = rows[0] || [], body = rows.slice(1);
      const ci = n => H.indexOf(n);
      if (body.length !== RES.length) bad('R6', key, `results CSV has ${body.length} rows, the record ${RES.length}`);
      RES.forEach((x, i) => { const r = body[i] || [];
        const cc = ci('Compound'); if (cc < 0) { if (i === 0) bad('R6', key, 'results CSV has no Compound column: ' + H.join('|')); return; }
        if (r[cc] !== x.compound) bad('R6', key, `results CSV row ${i + 1}: compound ${J(r[cc])}, record ${J(x.compound)}`);
        const ex = H.findIndex(h => /^excluded$/i.test(h)); if (ex >= 0 && (r[ex] === 'yes') !== !!x.excluded) bad('R6', key, `results CSV row ${i + 1}: excluded "${r[ex]}", record ${!!x.excluded}`);
        const pc = H.findIndex(h => /potency|dc50|value/i.test(h)); if (pc >= 0 && Math.abs(parseFloat(r[pc]) - x.potency) > 1e-9) bad('R6', key, `results CSV row ${i + 1}: potency ${r[pc]}, record ${x.potency}`);
      });
      n0 = DL.length; exportStepsCSV(e.id);
      const sc2 = DL[n0]; if (!sc2) { bad('R6', key, 'no steps CSV'); return; }
      const sr = parseCSV(sc2.text).filter(r => r.length > 1), SH = sr[0], sb = sr.slice(1);
      if (sb.length !== (e.blocks || []).length) bad('R6', key, `steps CSV has ${sb.length} rows, the record ${(e.blocks || []).length} steps`);
      const dn = SH.indexOf('Done'), st = SH.indexOf('Step');
      const doneWant = (e.blocks || []).filter(b => b.done).length, doneGot = sb.filter(r => r[dn] === 'yes').length;
      if (doneWant !== doneGot) bad('R6', key, `steps CSV marks ${doneGot} done, the record ${doneWant}`);
      (e.blocks || []).forEach(b => { if (!sb.some(r => r[st] === (b.title || ''))) bad('R6', key, `steps CSV has no row for "${b.title}"`); });
    });

    // ── R7 a scope prints everything in it ──
    if (run('R7')) {
      const scopes = [{ kind: 'folder', id: PID, sectionId: SID }, { kind: 'project', id: PID }, { kind: 'allexps' }];
      for (const sc of scopes) await guard('R7', sc.kind, async () => {
        tick('R7');
        const t = pdfTxt(ALLON, sc), exps = pdfScopeExps(sc);
        exps.forEach(x => { if (x.code && t.indexOf(x.code) < 0) bad('R7', sc.kind, `${x.code} is in the ${sc.kind} but not in its PDF`); });
        const want = Object.keys(LB.data.experiments).map(k => LB.data.experiments[k]).filter(isCoded)
          .filter(x => sc.kind === 'allexps' || (x.projectId === PID && (sc.kind === 'project' || x.sectionId === SID)));
        if (want.length !== exps.length) bad('R7', sc.kind, `the ${sc.kind} holds ${want.length} coded experiments, the export takes ${exps.length}`);
      });
      // The Journal: a day prints what its page shows, and the month and the whole Journal take the day.
      const withTick = made.find(m => m.d.ticked);
      if (withTick) {
        const D = _dateKey(withTick.d.ticked.completedAt);
        const groups = doneOnDay(D);
        for (const sc of [{ kind: 'day', date: D }, { kind: 'month', month: D.slice(0, 7) }, { kind: 'journal' }]) await guard('R7', sc.kind, async () => {
          tick('R7');
          const t = pdfTxt(ALLON, sc);
          groups.forEach(g => g.rows.forEach(r => { const nm = text(r.block.title || 'Step').trim();
            if (t.indexOf(nm) < 0) bad('R7', sc.kind, `a step done on ${D} ("${nm}", ${g.exp.code}) is not in the ${sc.kind} PDF`); }));
          if (t.indexOf('INV-LOG') < 0) bad('R7', sc.kind, `the ${sc.kind} PDF does not carry the step's log`);
        });
      }
    }

    made.forEach(m => cleanup(m.e));
    window._dl = origDl; window.print = origPrint;
    window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
  }

  // ── Beta test 2026-09-28 — every class found by breaking Labbook on purpose ─────────────────
  // Each of these was a bug that shipped; each check was proven by putting its bug back.
  {
    const lbAlert0 = window.lbAlert, lbPrompt0 = window.lbPrompt, lbChoose0 = window.lbChoose, lbPicker0 = window.lbPicker, toast0 = window.toast, dl0 = window._dl;
    window.toast = () => {};
    const mkB = async (key) => { openQuick(key || 'HB', {}); const e = await created(() => createExperiment()); closeNew(); return e; };
    const nTrash = k => Object.keys(LB.data.trash || {}).filter(t => LB.data.trash[t].kind === k).length;
    const clean = [];

    // B1 — undo takes the trash entry with it (a later restore wrote a stale copy over live edits).
    if (run('B1')) await guard('B1', 'deletes', async () => {
      const e = await mkB(); clean.push(e); openExp(e.id);
      const cases = [
        ['experiment', () => delExperiment(e.id)],
        ['block', () => { openExp(e.id); delBlock(LB.data.experiments[e.id].blocks[1].id); }],
        ['file', () => { const x = LB.data.experiments[e.id]; x.files = [{ id: 'invf', attId: 'inva', name: 'f.txt', mime: 'text/plain', size: 1, kind: 'other', added: 1 }]; removeFile('exp:' + e.id, 'invf'); }],
        ['result', () => { const x = LB.data.experiments[e.id]; x.integration = { results: [{ id: 'invr', rows: [{ compound: 'A', potency: 1 }] }] }; delResult(e.id, 'invr'); }],
        ['day', () => { LB.data.notebook['2031-01-02'] = { date: '2031-01-02', html: '<p>x</p>' }; delDay('2031-01-02'); }],
        ['page', () => { newPage(); const pg = _curPage(); pg.title = 'INV'; delPage(pg.id); }],
      ];
      for (const [k, fn] of cases) { tick('B1');
        const t0 = nTrash(k); fn(); await sleep(60);
        if (nTrash(k) !== t0 + 1) { bad('B1', k, `deleting a ${k} did not put it in Deleted items`); continue; }
        lbUndo(); await sleep(30);
        if (nTrash(k) !== t0) bad('B1', k, `⌘Z brought the ${k} back and left it in Deleted items too`);
      }
      delete LB.data.notebook['2031-01-02'];
    });

    // B2 — an action that changes the record is one undo step, and undoing it restores the record.
    if (run('B2')) await guard('B2', 'actions', async () => {
      const e = await mkB(); clean.push(e); openExp(e.id);
      window.lbPrompt = (m, v) => Promise.resolve(v); window.lbPicker = (t, items, cb) => cb(items[items.length - 1]);
      LB.data.experiments[e.id].integration = { results: [{ id: 'r', rows: [{ compound: 'A', potency: 1 }] }] };
      const acts = [
        ['snooze', () => snoozeBlock(e.id, LB.data.experiments[e.id].blocks[1].id, 1)],
        ['move', () => moveExpTo(e.id)], ['archive', () => setExpArchived(e.id, true)], ['status', () => setExpStatus(e.id, 'paused')],
        ['exclude', () => toggleResultExcluded(e.id, 'r', 0)], ['start date', () => { openExp(e.id); setField('startDate', '2031-03-03'); }],
        ['code', () => { openExp(e.id); setField('code', 'INV_CODE_B2'); }],
      ];
      for (const [k, fn] of acts) { tick('B2');
        const before = JSON.stringify(LB.data.experiments[e.id]), n0 = UNDO.stack.length;
        fn(); await sleep(60);
        if (JSON.stringify(LB.data.experiments[e.id]) === before) { bad('B2', k, 'the action changed nothing (harness)'); continue; }
        if (UNDO.stack.length <= n0) { bad('B2', k, `"${k}" changed the experiment with no undo step`); continue; }
        lbUndo(); await sleep(30);
        if (JSON.stringify(LB.data.experiments[e.id]) !== before) bad('B2', k, `⌘Z after "${k}" did not give the experiment back as it was`);
      }
      for (const [k, fn, cnt] of [['duplicate', () => dupExperiment(e.id)], ['replicate', () => repeatExperiment(e.id)]]) { tick('B2');
        const n = Object.keys(LB.data.experiments).length; fn(); await sleep(80); lbUndo(); await sleep(30);
        if (Object.keys(LB.data.experiments).length !== n) bad('B2', k, `⌘Z after "${k}" left the new experiment behind`); }
      window.lbPrompt = lbPrompt0; window.lbPicker = lbPicker0;
    });

    // B3 — snoozing a step never re-dates a ticked one.
    if (run('B3')) for (const key of KEYS) await guard('B3', key, async () => {
      openQuick(key, {}); const e = await created(() => createExperiment()); closeNew(); if (!e) return; clean.push(e);
      const bs = blocksInRunOrder(e).filter(b => b.date); if (bs.length < 2) return; tick('B3');
      setBlockDone(e.id, bs[0].id, true, true); const d0 = bs[0].date;
      snoozeBlock(e.id, bs[bs.length - 1] === bs[0] ? bs[1].id : bs[1].id, 2);
      if (LB.data.experiments[e.id].blocks.find(b => b.id === bs[0].id).date !== d0) bad('B3', key, 'snoozing a later step moved a step that was already ticked');
    });

    // B4 — a plate-reader grid is read whatever separates its numbers.
    if (run('B4')) await guard('B4', 'shapes', async () => {
      for (const fmt of ['96', '384']) { const d = PLATE_FORMATS[fmt], R = String(PLATE_ROWS).slice(0, d.r).split('');
        const g = R.map((r, i) => Array.from({ length: d.c }, (_, j) => i * 100 + j + 1));
        const shapes = { tab: g.map(r => r.join('\t')), spaces: g.map(r => r.join(' ')), wide: g.map(r => r.join('    ')),
          lettered: g.map((r, i) => R[i] + '  ' + r.join(' ')), semi: g.map(r => r.map(x => x + ',5').join(';')), csv: g.map(r => r.join(',')),
          header: [Array.from({ length: d.c }, (_, j) => j + 1).join('\t')].concat(g.map((r, i) => R[i] + '\t' + r.join('\t'))) };
        for (const [n, lines] of Object.entries(shapes)) { tick('B4');
          const v = plParseValues(lines.join('\n'), fmt), want = d.r * d.c, got = v ? Object.keys(v).length : 0;
          if (got !== want) { bad('B4', fmt + ' ' + n, `read ${got} of ${want} wells`); continue; }
          const last = R[d.r - 1] + d.c, exp = (d.r - 1) * 100 + d.c + (n === 'semi' ? 0.5 : 0);
          if (v[last] !== exp) bad('B4', fmt + ' ' + n, `${last} read as ${v[last]}, not ${exp}`); }
      }
    });

    // B5 — no CSV cell a spreadsheet would run as a formula.
    if (run('B5')) await guard('B5', 'csv', async () => {
      const e = await mkB(); clean.push(e); tick('B5');
      e.integration = { results: [{ id: 'r', source: '=cmd', rows: [{ compound: '=HYPERLINK("x")', target: '@SUM(A1)', potency: -5, effect: '+1', note: '-note' }] }] };
      e.blocks[0].note = '<p>=2+2</p>'; e.blocks[0].title = '+step';
      const got = []; window._dl = (n, t) => { got.push(String(t)); };
      try { exportResultsCSV(e.id); } catch (x) {} try { exportStepsCSV(e.id); } catch (x) {}
      window._dl = dl0;
      if (!got.length) { bad('B5', 'csv', 'no CSV was produced (harness)'); return; }
      got.join('\n').split(/\r?\n/).forEach(line => { const cells = []; let cur = '', q = false;
        for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { cells.push(cur); cur = ''; } else cur += ch; }
        cells.push(cur);
        cells.forEach(c => { if (/^[=+\-@]/.test(c) && !/^[+\-]?(\d+\.?\d*|\.\d+)(e[+\-]?\d+)?$/i.test(c)) bad('B5', 'csv', `a cell starts a formula: ${c.slice(0, 40)}`); }); });
    });

    // B6 — text somebody else wrote never runs as script: names, codes, notes, targets, imports.
    if (run('B6')) await guard('B6', 'injection', async () => {
      window.__invX = 0; tick('B6');
      const X = t => `<img src=x onerror="__invX++">${t}');__invX++;//"'`;
      const e = await mkB(); clean.push(e);
      e.title = X('t'); e.aim = X('a'); e.code = 'C' + X('c'); e.plasmids = X('p'); e.outcome = { verdict: 'worked', text: X('o'), at: Date.now() };
      e.blocks[0].title = X('s'); e.blocks[0].log = X('l'); e.blocks[0].done = true; e.blocks[0].completedAt = Date.now();
      e.integration = { results: [{ id: 'r', source: X('src'), potencyUnit: 'nM', rows: [{ compound: X('cmp'), target: X('tg1'), potency: 5 }, { compound: 'B', target: X('tg2'), potency: 7, note: X('n') }] }] };
      e.startDate = todayStr(); e.blocks.forEach(b => { b.date = todayStr(); });   // Visualize counts up to today
      e.plate = { format: '96', title: X('pt'), types: [{ id: 'ty', name: X('ty'), color: '#f00' }], wells: { A1: { typeId: 'ty', compound: X('w'), label: X('wl'), note: X('wn') } } };
      save();
      const screens = [() => selectNode('home'), () => selectNode('exps'), () => selectNode('today'), () => selectNode('week'), () => openJournalWs(),
        () => selectNode('viz'), () => { selectNode('viz'); try { VZ.range = 'all'; VZ.proj = ''; VZ.type = ''; } catch (x) {} renderAll(); if (!document.querySelector('.vz-tchips')) bad('B6', 'chips', 'Visualize drew no target chips (harness)'); document.querySelectorAll('.vz-tchips .vz-chip').forEach(c => c.click()); }, () => openExp(e.id),
        () => { openExp(e.id); expTab('pub'); }, () => { openPlateEditor('exp:' + e.id); }, () => { try { closePlateEditor(); } catch (x) {} openPdfExport(); }];
      for (const s of screens) { try { s(); } catch (x) {} await sleep(60); }
      // and through an import, where rich text is expected
      const src = JSON.parse(buildExpJSON(e)); src.experiment.blocks[0].note = '<p>ok</p><img src=x onerror="__invX++"><a href="javascript:__invX++">l</a>';
      importExpFile(new File([JSON.stringify(src)], 'x.json')); await sleep(400);
      document.querySelectorAll('.modal-back.open .btn.primary').forEach(b => b.click()); await sleep(300);
      const imp = Object.keys(LB.data.experiments).map(k => LB.data.experiments[k]).find(x => x.imported && x.imported.originalId === e.id);
      if (imp) { clean.push(imp); openExp(imp.id); await sleep(200);
        // Absolute, not only what happens to be drawn: nothing executable survives an import.
        const bad6 = []; (function walk(o, at) { if (typeof o === 'string') { if (/\son[a-z]+\s*=|javascript:|<script/i.test(o)) bad6.push(at); }
          else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], at + '.' + k)); })(imp, 'e');
        if (bad6.length) bad('B6', 'import', 'an imported record still carries executable markup at ' + bad6.slice(0, 3).join(', ')); }
      else bad('B6', 'import', 'the import did not land (harness)');
      try { closePdfExport && closePdfExport(); } catch (x) {} document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open'));
      await sleep(150);
      if (window.__invX) bad('B6', 'injection', `text from a record ran as script ${window.__invX} time(s)`);
    });

    // B7 — a malformed payload from another app, or a potency that is not finite, breaks nothing.
    if (run('B7')) await guard('B7', 'payloads', async () => {
      const e = await mkB(); clean.push(e); openExp(e.id);
      const cases = { nullResult: { results: [null] }, rowsNotList: { results: [{ rows: 'x' }] }, nullRow: { results: [{ rows: [null, { compound: 'A', potency: 'abc' }] }] },
        tableBad: { tables: [{ cols: 'x', rows: 5 }] }, plateBad: { plate: { wells: 'x' } }, infinite: { results: [{ id: 'i', potencyUnit: 'nM', rows: [{ compound: 'I', target: 'T', potency: 'Infinity' }, { compound: 'J', target: 'T', potency: 1e12 }] }] } };
      for (const [n, ctx] of Object.entries(cases)) { tick('B7');
        try { _mergeDHubContext(Object.assign({ experiment: { id: e.id } }, ctx)); openExp(e.id); expTab('res'); renderEditor(); selectNode('home'); selectNode('viz'); }
        catch (x) { bad('B7', n, 'threw: ' + x.message); }
        LB.data.experiments[e.id].integration = { results: [], tables: [] }; delete LB.data.experiments[e.id].plate; }
    });

    // B8 — a tree in the wrong shape still draws every screen.
    if (run('B8')) await guard('B8', 'shapes', async () => {
      const keep = LB.data;
      const shapes = { projectsObject: { projects: { 0: { id: 'p', name: 'P', sections: { 0: { id: 's', name: 'S' } } } }, experiments: {} },
        nullRecords: { projects: [null, { id: 'p', name: 'P' }], experiments: { x: null }, pages: { y: null }, notebook: { '2030-01-01': null } },
        blocksNotList: { projects: [], experiments: { e: { id: 'e', projectId: 'p', blocks: 'oops' } } } };
      for (const [n, d] of Object.entries(shapes)) { tick('B8');
        try { LB.data = Object.assign(lbBlank(), JSON.parse(JSON.stringify(d))); _lbNormTree(LB.data);
          ['home', 'exps', 'today', 'week', 'viz'].forEach(k => selectNode(k)); openJournalWs(); }
        catch (x) { bad('B8', n, 'threw: ' + x.message); }
      }
      LB.data = keep; selectNode('home');
    });

    // B9 — Restore never takes an export for a backup.
    if (run('B9')) await guard('B9', 'restore', async () => {
      const asked = []; const c0 = window.lbConfirm; window.lbConfirm = (m) => { asked.push(m); return Promise.resolve(false); }; window.lbAlert = () => Promise.resolve();
      for (const [n, obj] of [['bundle', { _lbBundle: 1, experiments: [] }], ['experiment', { _lbExperiment: 1, experiment: { id: 'x' }, experiments: {} }], ['list', { experiments: [] }]]) { tick('B9');
        asked.length = 0; restoreFromBackupFile(new File([JSON.stringify(obj)], n + '.json')); await sleep(200);
        if (asked.length) bad('B9', n, `a ${n} file was offered as a backup to replace the notebook with`); }
      window.lbConfirm = c0; window.lbAlert = lbAlert0;
    });

    // B10 — a mix comes to the volume it says, however small the stocks make the DNA.
    if (run('B10')) await guard('B10', 'mixes', async () => {
      const num = s => parseFloat(String(s).replace(/,/g, ''));
      const rowsOf = h => { const d = document.createElement('div'); d.innerHTML = h; return [...d.querySelectorAll('table.cc-tbl tr')].slice(1); };
      for (const st of [1e6, 1e4, 1000, 100, 10]) {
        tick('B10');
        const v = Object.assign({}, CALC_KINDS.nbtx.defaults, { donorNames: 'NL', acceptorNames: 'HT', ratios: '50', donorStock: st, acceptorStock: st, carrierStock: st, nPair: 24, nDonor: 8, nAcceptor: 8, nMock: 8 });
        rowsOf(CALC_KINDS.nbtx.compute(v, {})).forEach(tr => { const td = [...tr.children]; if (/no complex|short by/.test(tr.textContent)) return;
          const n = td.length, tot = num(td[n - 1].querySelector('b').textContent), om = num(td[n - 2].textContent), fu = num(td[n - 3].textContent);
          let dna = 0; td.slice(2, n - 3).forEach(c => { const m = /→\s*([\d.,]+)\s*µL/.exec(c.textContent); const b = c.querySelector('b'); dna += m ? num(m[1]) : (b ? num(b.textContent) : 0); });
          if (Math.abs(dna + fu + om - tot) > Math.max(0.05, tot * 0.002)) bad('B10', `nbtx stock ${st} · ${td[1].textContent.slice(0, 20)}`, `${dna.toFixed(2)} DNA + ${fu} FuGENE + ${om} Opti-MEM ≠ ${tot} µL`); });
        // The single master mix and the spike-in: the parts in the table add up to its total.
        const tbl = h => { const d = document.createElement('div'); d.innerHTML = h; return [...d.querySelectorAll('table.cc-tbl tr')].slice(1).map(tr => [...tr.children].map(c => c.textContent)); };
        const r = Object.assign({}, CALC_KINDS.rtxmix.defaults, { stockNgUl: st * 10, nWells: 3 }), rt = tbl(CALC_KINDS.rtxmix.compute(r));
        if (rt.length >= 4) { const parts = rt.slice(0, 3).map(x => num(x[1])), total = num(rt[3][1]);
          if (Math.abs(parts.reduce((a, b) => a + b, 0) - total) > Math.max(0.05, total * 0.002)) bad('B10', 'rtxmix stock ' + st * 10, `${parts.join(' + ')} ≠ ${total} µL`); }
        const sp = Object.assign({}, CALC_KINDS.spike.defaults, { stockUM: st, nWells: 4 }), sr = tbl(CALC_KINDS.spike.compute(sp));
        if (sr.length === 3) { const need = num(sr[0][1]), stk = num(sr[1][1]), dil = num(sr[2][1]);
          if (Math.abs(stk + dil - need) > Math.max(0.05, need * 0.002)) bad('B10', 'spike stock ' + st, `${stk} + ${dil} ≠ ${need} µL`); }
      }
    });

    // B11 — an imported copy of a replicate does not join the set it was copied from.
    if (run('B11')) await guard('B11', 'replicates', async () => {
      tick('B11'); const e = await mkB(); clean.push(e);
      window.lbPrompt = (m, v) => Promise.resolve(v); repeatExperiment(e.id); await sleep(200); window.lbPrompt = lbPrompt0;
      const n = repSiblings(LB.data.experiments[e.id]).length;
      importExpFile(new File([buildExpJSON(LB.data.experiments[e.id])], 'x.json')); await sleep(400);
      document.querySelectorAll('.modal-back.open .btn.primary').forEach(b => b.click()); await sleep(300);
      Object.keys(LB.data.experiments).map(k => LB.data.experiments[k]).filter(x => x.imported || (x.repGroup && x.repGroup === LB.data.experiments[e.id].repGroup && x.id !== e.id)).forEach(x => clean.push(x));
      if (repSiblings(LB.data.experiments[e.id]).length !== n) bad('B11', 'import', `importing a copy made it replicate ${n + 1} of the original's set`);
    });

    // B12 — concentrations read back as written; a series is a series in either direction.
    if (run('B12')) await guard('B12', 'concentrations', async () => {
      for (let lg = -12; lg <= 9; lg += 0.37) { tick('B12'); const x = Math.pow(10, lg), s = _fmtConc(x), y = _parseConcNM(s);
        if (!(Math.abs(y - x) / x < 0.006)) bad('B12', s, `${x} nM prints as "${s}" and reads back as ${y}`);
        if (/^1000 /.test(s)) bad('B12', s, `${x} nM prints as "${s}" — a unit boundary not taken`); }
      for (const df of [2, 3, 3.16, 10]) { const desc = Array.from({ length: 8 }, (_, i) => _fmtConc(1000 / Math.pow(df, i)));
        for (const [n, seq] of [['falling', desc], ['rising', desc.slice().reverse()]]) { tick('B12');
          const t = _seriesText(seq).text; if (!/8 pts, [\d.]+-fold/.test(t)) bad('B12', n + ' ' + df, `a ${df}-fold ${n} series reads as "${t}"`); } }
    });

    // B13 — an Echo picklist reads the same however it was saved.
    if (run('B13')) await guard('B13', 'picklist', async () => {
      const head = ['[DETAILS]', 'Protocol Name,HB_INV.edr', '', 'Source Plate Name,Source Well,Destination Plate Name,Destination Well,Sample Name,Destination Concentration,Destination Concentration Units,Transfer Volume,Transfer Status'];
      const rows = ['S,A1,D,B02,CPD-1,2.001E-05,M,25,', 'S,A2,D,C10,CPD-2,1E-06,M,25,OK'];
      const csv = head.concat(rows).join('\r\n');
      for (const [n, t] of [['csv', csv], ['bom', '﻿' + csv], ['semicolon', csv.replace(/,/g, ';').replace('2.001E-05', '2,001E-05')]]) { tick('B13');
        const r = parseEchoPicklist(t); if (r.error) { bad('B13', n, r.error); continue; }
        const w = r.plates[0].wells; if (!w.B2 || !w.C10) { bad('B13', n, 'wells read as ' + Object.keys(w).join(',')); continue; }
        if (w.B2.conc !== '20.01 µM') bad('B13', n, 'B2 concentration read as ' + w.B2.conc); }
    });

    // B14 — the inline sum answers whole expressions only.
    if (run('B14')) await guard('B14', 'sum', async () => {
      const host = document.createElement('div'); host.className = 'rt'; host.contentEditable = 'true'; host.style.cssText = 'position:fixed;left:-9999px;top:0;width:400px'; document.body.appendChild(host);
      for (const [typed, want] of [['9*9=', '9*9=81'], ['3.5e3*2=', '3.5e3*2='], ['B12*2=', 'B12*2='], ['x 10/4=', 'x 10/4=2.5'], ['(2+3)*4=', '(2+3)*4=20']]) { tick('B14');
        host.innerHTML = ''; host.focus(); const r = document.createRange(); r.selectNodeContents(host); r.collapse(false); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r);
        for (const ch of typed) { document.execCommand('insertText', false, ch); await sleep(5); }
        await sleep(30); const got = host.textContent.replace(/ /g, ' ').trim();
        if (got !== want) bad('B14', typed, `typing "${typed}" gave "${got}", not "${want}"`); }
      host.remove();
    });

    // B15 — only the Hub's own frames can post into Labbook.
    if (run('B15')) await guard('B15', 'origin', async () => {
      const e = await mkB(); clean.push(e); openExp(e.id);
      for (const [origin, want] of [['https://attacker.example', false], [self.origin, true]]) { tick('B15');
        LB.data.experiments[e.id].integration = { results: [] };
        window.dispatchEvent(new MessageEvent('message', { origin, data: { type: 'dhub:context', version: 1, context: { experiment: { id: e.id }, results: [{ id: 'm', rows: [{ compound: 'X', potency: 1 }] }] } } }));
        await sleep(60);
        const got = ((LB.data.experiments[e.id].integration || {}).results || []).length > 0;
        if (got !== want) bad('B15', origin, want ? 'a message from the Hub\'s own origin was refused' : 'a message from another origin wrote into the experiment'); }
    });

    // B16 — a typed code is trimmed, never empty, never another experiment's.
    if (run('B16')) await guard('B16', 'code', async () => {
      const a = await mkB(), b = await mkB(); clean.push(a, b); openExp(b.id); tick('B16');
      setField('code', a.code); if (LB.data.experiments[b.id].code === a.code) bad('B16', 'dup', 'two experiments carry one code');
      setField('code', '   '); if (!String(LB.data.experiments[b.id].code || '').trim()) bad('B16', 'blank', 'a blank code was stored');
      setField('code', '  INV_TRIM  '); if (LB.data.experiments[b.id].code !== 'INV_TRIM') bad('B16', 'trim', `stored as "${LB.data.experiments[b.id].code}"`);
    });

    // B17 — changing the plate format drops what hung off the wells it drops.
    if (run('B17')) await guard('B17', 'format', async () => {
      const e = await mkB(); clean.push(e); tick('B17');
      e.plate = { format: '384', title: '', types: [], wells: { A1: { typeId: 'dose', conc: '1 µM' }, P24: { typeId: 'dose', conc: '2 µM', groupId: 'g' } }, groups: { g: { label: 'gone' } }, colLabels: { 23: 'x' }, values: { data: { A1: 1, P24: 999 }, min: 1, max: 999 } };
      openExp(e.id); openPlateEditor('exp:' + e.id); plSetFormat('96'); closePlateEditor();
      const p = LB.data.experiments[e.id].plate;
      if (p.values && p.values.data && p.values.data.P24 != null) bad('B17', 'values', 'a dropped well\'s reader value survived');
      if (p.values && p.values.max === 999) bad('B17', 'values', 'the colour range still includes a dropped well');
      if (p.colLabels && p.colLabels[23]) bad('B17', 'headers', 'a header past the last column survived');
      if (p.groups && p.groups.g) bad('B17', 'groups', 'a block label with no wells survived');
    });

    // B18 — one press, one timer.
    if (run('B18')) await guard('B18', 'timer', async () => {
      const e = await mkB(); clean.push(e); tick('B18'); const b = LB.data.experiments[e.id].blocks[0]; b.waitMin = 30;
      const n = LB_TIMERS.length; startWaitTimer(e.id, b.id); startWaitTimer(e.id, b.id);
      if (LB_TIMERS.length !== n + 1) bad('B18', 'twice', `pressing twice started ${LB_TIMERS.length - n} timers`);
      LB_TIMERS.filter(t => t.expId === e.id).forEach(t => stopTimer(t.id));
    });

    // B19 — everything you can click to navigate, you can reach with Tab.
    if (run('B19')) await guard('B19', 'keyboard', async () => {
      const e = await mkB(); clean.push(e);
      for (const [n, fn] of [['home', () => selectNode('home')], ['exps', () => selectNode('exps')], ['folder', () => openExp(e.id)], ['journal', () => openJournalWs()], ['today', () => selectNode('today')]]) {
        tick('B19'); fn(); await sleep(80);
        const miss = [...document.querySelectorAll('[onclick]:not(button):not(a):not(input):not(select):not(textarea):not(label):not(option)')]
          .filter(x => x.offsetParent && x.tabIndex < 0 && !x.closest('[contenteditable]:not([contenteditable="false"])'));
        if (miss.length) bad('B19', n, `${miss.length} clickable element(s) Tab cannot reach, e.g. ${miss[0].className || miss[0].tagName}`); }
    });

    clean.forEach(cleanup);
    window.lbAlert = lbAlert0; window.lbPrompt = lbPrompt0; window.lbChoose = lbChoose0; window.lbPicker = lbPicker0; window.toast = toast0; window._dl = dl0;
    try { selectNode('home'); } catch (x) {}
  }

  return { out, counts, archive, presets: KEYS.length };
}

// ── Driver ─────────────────────────────────────────────────────────────────────────────────────
const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
let failed = 0;
try {
  await waitHttp(base);
  const urls = args.url ? String(args.url).split(',')
    : ['apps/labbook/labbook.html'].concat(fs.existsSync(path.join(ROOT, 'labbook-standalone.html')) ? ['labbook-standalone.html'] : []);
  const browser = await chromium.launch();
  for (const u of urls) {
    const url = /^https?:/.test(u) ? u : base + u;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e && e.message || e)));
    await pg.goto(url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now(), { waitUntil: 'load' });
    await pg.waitForFunction(() => window.LB && LB.data && LB.data.presets && Object.keys(LB.data.presets).length && (LB.data.projects || []).length, null, { timeout: 20000 });
    await pg.waitForTimeout(600);
    const t0 = Date.now();
    let r;
    try { r = await pg.evaluate(suite, { only: ONLY }); }
    catch (e) { r = { out: [{ inv: 'harness', case: '-', msg: 'the suite itself threw: ' + String(e && e.message || e).split('\n')[0] }], counts: {}, archive: false, presets: 0 }; }
    const name = path.basename(u);
    console.log(`\n${name} — ${r.presets} presets, Archive ${r.archive ? 'embedded (protocol cases run)' : 'absent (protocol cases skipped)'}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    const invs = [...new Set([...Object.keys(r.counts), ...r.out.map(x => x.inv)])].sort();
    for (const inv of invs) {
      const f = r.out.filter(x => x.inv === inv);
      console.log(`  ${f.length ? '✗' : '✓'} ${inv}  ${r.counts[inv] || 0} cases${f.length ? `, ${f.length} findings` : ''}`);
      const show = VERBOSE ? f : f.slice(0, 12);
      show.forEach(x => console.log(`      ${x.case}: ${x.msg}`));
      if (!VERBOSE && f.length > show.length) console.log(`      … ${f.length - show.length} more (--verbose)`);
    }
    if (errs.length) { console.log('  ✗ page errors:'); [...new Set(errs)].forEach(e => console.log('      ' + e)); }
    failed += r.out.length + errs.length;
    await ctx.close();
  }
  await browser.close();
} finally { srv.kill(); }
console.log(failed ? `\n${failed} finding(s).` : '\nAll invariants hold.');
process.exit(failed ? 1 : 0);
