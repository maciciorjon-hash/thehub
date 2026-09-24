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
    dsSyncMods(DS);
  }
  function previewPlate(D, ps) {
    if (!(D.plate || D.echo)) return null;
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
    const variants = [{ n: 'defaults', o: {} }, { n: 'skip weekends', o: { skipWe: true } }];
    if (PROTOS) variants.push({ n: 'protocols + skip weekends', o: { skipWe: true, protos: PROTOS } });
    for (const key of KEYS) for (const v of variants) {
      const cs = `${key} · ${v.n}`;
      designFrom(key, v.o);
      const ps = dsPseudo(DS), pv = previewPlate(DS, ps);
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
        const UI = ['mode', 'step', 'cur', 'editKey', 'setupTouched', 'pid', 'sid'];   // navigation, not content
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
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); } catch (e) {} });
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
