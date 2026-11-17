// Meetings invariants — Meetings is a Labbook workspace of its own (filed by project or topic), written in the Journal's own editor.
//
// A meeting is a record in LB.data.meetings (a cloud map), not a Journal page: the Journal migration files any page that
// is not a Note into a day and deletes it, so a meeting kept as a page would have gone. Drives labbook.html itself.
//
//   MT1  nav       Meetings is its own workspace (one entry in Labbook's own switcher, none per project, none in the Experiments column);
//                  it opens the overview across every project and topic and remembers where you left it; the crumb says where
//   MT2  create    each of the eight kinds makes a record under the project, with its agenda and notes skeleton; place and
//                  times come from the last meeting of that kind, people from the project's regulars; dated ahead = Planned
//   MT12 dialog    "+ New" asks for the project or topic (dropdown, with "new project or topic"), the kind and the date, and
//                  says who is invited; the meeting is filed under what was picked
//   MT13 regulars  the project remembers who comes (learnt, then pinned with the star); x takes someone off ONE meeting,
//                  apologies change nothing, "Add the regulars" puts them back, the overview edits the list
//   MT14 list      the list is grouped by project (a header per project that has meetings), filters by project, and can be
//                  read by date; a meeting moved to another project follows
//   MT15 fold      each project's group folds to its header (remembered on the device); a search or a project filter never hides a result;
//                  one button folds or opens them all
//   MT3  fields    people (Enter, a comma list, apologies), agenda (tick, minutes, Enter adds, Backspace on empty removes),
//                  decisions, actions (owner, due, done) all land in the record and survive a reload
//   MT4  carry     "Open from earlier meetings" lists the open actions of EARLIER meetings only, never a cancelled one's,
//                  and ticking one there ticks it in its own meeting
//   MT5  notes     the notes are the Journal's editor: typed with real keys, bold, a checklist, Tab in a list; kept in .html
//   MT6  planner   an action added to the Planner is a task on its due date; ticking the action ticks the task
//   MT7  data      meetings are a cloud map (fingerprint carries them), are in a backup, survive _journalMigrate, a deleted
//                  meeting and a deleted project (with its meetings) come back from Deleted items
//   MT8  export    the PDF for a meeting and for a project's meetings carries each section the boxes ask for, and nothing else;
//                  the bulk one has a cover with every open action; the dialog opens on the meeting you are in
//   MT9  search    the meeting is in the search (title and the words of its notes, actions and people)
//   MT10 fit       no horizontal overflow and every control inside the sheet at 1280 and 390; the list rows name type and date
//   MT11 text      the plain-text copy carries the minutes; no console errors
//
//   node tools/meetings_invariants.mjs      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const waitHttp = async u => { for (let i = 0; i < 60; i++) { try { if ((await fetch(u)).ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 250)); } throw new Error('server did not start'); };
const findings = []; let checks = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const eq = (inv, what, got, want) => { checks++; if (JSON.stringify(got) !== JSON.stringify(want)) bad(inv, `${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
const yes = (inv, what, v) => { checks++; if (!v) bad(inv, what); };

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
try {
  await waitHttp(base + '/');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e && e.message || e)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) errs.push(m.text()); });
  const boot = async () => {
    await p.goto(base + '/apps/labbook/labbook.html');
    await p.waitForFunction(() => window.LB && LB.data && (LB.data.projects || []).length, null, { timeout: 20000 });
    await p.waitForTimeout(700);
    const d = p.locator('#lb-dialog.open button'); if (await d.count()) await d.first().click();
  };
  await boot();
  const E = (fn, a) => p.evaluate(fn, a);

  // ── MT1 nav
  {
    await E(() => { selectNode('exps'); LB.data.projects.forEach(x => EXPANDED[x.id] = true); renderSections(); });
    const leaves = await E(() => [...document.querySelectorAll('#pane-sec .sec-item')].filter(x => /^Meetings/.test(x.textContent.trim()) && !x.classList.contains('sub')).length);
    eq('MT1', 'one Meetings entry in the workspace switcher, not one per project', leaves, 1);
    eq('MT1', 'and none below the Experiments heading', await E(() => { const c = document.getElementById('pane-sec'), l = [...c.querySelectorAll('.pane-lbl')].filter(x => /^Experiments/.test(x.textContent.trim()))[0]; return l ? [...c.querySelectorAll('.sec-item')].filter(x => l.compareDocumentPosition(x) & 4 && !x.classList.contains('sub') && /^Meetings/.test(x.textContent.trim())).length : -1; }), 0);
    await p.locator('#pane-sec .sec-item', { hasText: /^Meetings/ }).first().click(); await p.waitForTimeout(300);
    const s = await E(() => ({ k: SEL.node.kind, ws: lbWorkspace(), crumb: [...document.querySelectorAll('#topbar .crumb-s')].map(x => x.textContent), home: !!document.querySelector('#pane-ed .mtg-home'), list: !!document.querySelector('#pane-pages .pages-hd'), active: [...document.querySelectorAll('#pane-sec .sec-item.active')].some(x => /^Meetings/.test(x.textContent.trim())) }));
    eq('MT1', 'the entry opens the overview in its own workspace', [s.k, s.ws, s.home, s.list, s.active], ['meetings', 'meetings', true, true, true]);
    yes('MT1', 'the crumb names Meetings', s.crumb.includes('Meetings'));
    const back = await E(() => { const pj = LB.data.projects[0].id; mtgOpen(pj, null); selectNode('exps'); const inExps = lbWorkspace(); openMeetingsWs(); return [inExps, lbWorkspace(), MTG_PROJ === pj]; });
    eq('MT1', 'Experiments is left, and coming back to Meetings finds the project you were looking at', back, ['experiments', 'meetings', true]);
    await E(() => { MTG_PROJ = ''; });
  }

  // ── MT2 create
  const types = await E(() => MTG_TYPES.map(t => t.id));
  eq('MT2', 'eight kinds', types.length, 8);
  const pid = await E(() => LB.data.projects[0].id);
  for (const t of types) {
    const r = await E(a => { var m = mtgNew(a.pid, a.t); var T = mtgType(a.t); return { proj: m.projectId, type: m.type, ag: m.agenda.length, want: T.agenda.length, notes: (m.html.match(/<h3>/g) || []).length, wantN: T.notes.length, held: m.status, open: SEL.page === m.id }; }, { pid, t });
    eq('MT2', t + ': record, agenda and notes skeleton', [r.proj === pid, r.type === t, r.ag === r.want, r.notes === r.wantN, r.open], [true, true, true, true, true]);
  }
  eq('MT2', 'a meeting made today is Held', await E(() => Object.values(LB.data.meetings).every(m => m.status === 'held')), true);
  {
    await E(a => { Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); }, 0);
    const r = await E(a => {
      var m1 = mtgNew(a.pid, 'group', { date: '2026-01-05' }); m1.start = '10:00'; m1.end = '11:00'; m1.place = 'Room 4'; m1.attendees = [{ n: 'Ana Ruiz', a: 0 }, { n: 'Bo Li', a: 1 }]; m1.chair = 'Ana Ruiz';
      var m2 = mtgNew(a.pid, 'group', { date: '2999-01-01' });
      return { start: m2.start, end: m2.end, place: m2.place, people: m2.attendees.map(x => x.n + ':' + x.a), chair: m2.chair, status: m2.status };
    }, { pid });
    eq('MT2', 'a new meeting takes the last of its kind’s place and times, and the project’s regulars (someone who sent apologies is not one yet)', [r.start, r.end, r.place, r.people, r.chair], ['10:00', '11:00', 'Room 4', ['Ana Ruiz:0'], 'Ana Ruiz']);
    eq('MT2', 'a meeting dated ahead is Planned', r.status, 'planned');
    await E(() => { Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); });
  }

  // ── MT3 fields, with real input
  let mid;
  {
    mid = await E(a => { var m = mtgNew(a.pid, 'oneone', { date: '2026-02-10' }); return m.id; }, { pid });
    await p.waitForTimeout(250);
    await p.locator('.mtg-title').click(); await p.keyboard.type('Weekly catch-up'); await p.waitForTimeout(150);
    const inp = p.locator('#mtg-att-in'); await inp.click(); await p.keyboard.type('Ana Ruiz', { delay: 20 }); await p.keyboard.press('Enter');
    await p.keyboard.type('Bo Li, Cy Dahl', { delay: 20 }); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.locator('.mtg-chip', { hasText: 'Bo Li' }).first().click(); await p.waitForTimeout(150);
    let m = await E(id => LB.data.meetings[id], mid);
    eq('MT3', 'title and people typed', [m.title, m.attendees.map(x => x.n + ':' + x.a)], ['Weekly catch-up', ['Ana Ruiz:0', 'Bo Li:1', 'Cy Dahl:0']]);
    // agenda: Enter adds a row after the focused one, Backspace on an empty row removes it, a tick and minutes are kept
    const n0 = await E(id => LB.data.meetings[id].agenda.length, mid);
    await p.locator('.mtg-sec-agenda .mtg-in[data-r]').first().click(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.keyboard.type('Extra point'); await p.waitForTimeout(100);
    m = await E(id => LB.data.meetings[id], mid);
    eq('MT3', 'Enter in an agenda row adds one after it and the typing goes in it', [m.agenda.length, m.agenda[1].t], [n0 + 1, 'Extra point']);
    for (let i = 0; i < 'Extra point'.length; i++) await p.keyboard.press('Backspace');
    await p.keyboard.press('Backspace'); await p.waitForTimeout(250);
    eq('MT3', 'Backspace on an empty agenda row removes it', await E(id => LB.data.meetings[id].agenda.length, mid), n0);
    await p.locator('.mtg-sec-agenda input[type=checkbox]').first().check(); await p.waitForTimeout(100);
    await p.locator('.mtg-sec-agenda .mtg-min').first().fill('25'); await p.waitForTimeout(100);
    await p.locator('.mtg-sec .mtg-add, .mtg-add', { hasText: 'Decision' }).click(); await p.waitForTimeout(200);
    await p.keyboard.type('Use the new antibody lot'); await p.waitForTimeout(100);
    await p.locator('.mtg-add', { hasText: 'Action item' }).click(); await p.waitForTimeout(200);
    await p.keyboard.type('Repeat the blot'); await p.waitForTimeout(100);
    await p.locator('.mtg-sec-actions .mtg-who-in').first().fill('Ana Ruiz'); await p.locator('.mtg-sec-actions .mtg-due-in').first().fill('2026-02-20'); await p.waitForTimeout(150);
    await p.locator('.mtg-purpose').fill('Check the blot and plan'); await p.locator('.mtg-take').fill('Blot is clean'); await p.waitForTimeout(150);
    await p.waitForTimeout(900);
    await boot();
    await E(a => mtgOpen(a.pid, a.mid), { pid, mid }); await p.waitForTimeout(400);
    m = await E(id => LB.data.meetings[id], mid);
    eq('MT3', 'agenda tick and minutes survive a reload', [m.agenda[0].d, m.agenda[0].m], [1, 25]);
    eq('MT3', 'decision, action, purpose and takeaway survive a reload', [m.decisions.map(x => x.t), m.actions.map(x => [x.t, x.who, x.due, x.done]), m.purpose, m.summary],
      [['Use the new antibody lot'], [['Repeat the blot', 'Ana Ruiz', '2026-02-20', 0]], 'Check the blot and plan', 'Blot is clean']);
    eq('MT3', 'the page draws what the record holds', await E(() => [document.querySelector('.mtg-title').textContent, document.querySelectorAll('.mtg-chip').length, document.querySelector('.mtg-chip.away .mtg-cn').textContent]), ['Weekly catch-up', 3, 'Bo Li']);
  }

  // ── MT4 carry-over
  {
    const r = await E(a => {
      var A = LB.data.meetings[a.mid];
      var early = mtgNew(a.pid, 'group', { date: '2026-01-10' }); early.actions = [{ id: 'ea1', t: 'Early open', who: 'Bo Li', due: '', done: 0 }, { id: 'ea2', t: 'Early done', who: '', due: '', done: 1 }];
      var cx = mtgNew(a.pid, 'group', { date: '2026-01-20', status: 'cancelled' }); cx.actions = [{ id: 'ca1', t: 'From a cancelled one', who: '', due: '', done: 0 }];
      var late = mtgNew(a.pid, 'group', { date: '2026-03-01' }); late.actions = [{ id: 'la1', t: 'Later open', who: '', due: '', done: 0 }];
      mtgOpen(a.pid, a.mid);
      return { carry: _mtgOpenActions(a.pid, LB.data.meetings[a.mid]).map(x => x.a.t), shown: [...document.querySelectorAll('#pane-ed .mtg-carry .mtg-aro-t')].map(x => x.textContent) };
    }, { pid, mid });
    eq('MT4', 'only open actions of earlier meetings, not a cancelled meeting’s, not a later one', r.carry, ['Early open']);
    eq('MT4', 'the card shows them', r.shown, ['Early open']);
    await p.locator('#pane-ed .mtg-carry input[type=checkbox]').first().click(); await p.waitForTimeout(250);
    const t = await E(() => Object.values(LB.data.meetings).filter(m => (m.actions || []).some(a => a.id === 'ea1')).map(m => m.actions.find(a => a.id === 'ea1').done));
    eq('MT4', 'ticking it there ticks it in its own meeting, and the card goes', [t, await E(() => document.querySelectorAll('#pane-ed .mtg-carry').length)], [[1], 0]);
  }

  // ── MT5 notes in the Journal's editor
  {
    await E(a => { mtgOpen(a.pid, a.mid); LB.data.meetings[a.mid].html = ''; renderEditor(); }, { pid, mid }); await p.waitForTimeout(300);
    const ed = p.locator('#pane-ed .jr-ed'); await ed.click();
    const ty = x => p.keyboard.type(x, { delay: 25 });
    await ty('Blot looks clean'); await p.keyboard.press('Enter'); await ty('- first'); await p.keyboard.press('Enter'); await p.keyboard.press('Tab'); await ty('nested');
    await p.keyboard.press('Enter'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Shift+Tab'); await ty('after the list');
    await p.keyboard.press('ControlOrMeta+A'); await p.keyboard.press('ControlOrMeta+B'); await p.waitForTimeout(900);
    const h = await E(id => LB.data.meetings[id].html, mid);
    yes('MT5', 'text typed with the keyboard is in the record: ' + h.slice(0, 120), /Blot looks clean/.test(h) && /after the list/.test(h));
    yes('MT5', 'a "- " starts a list, Tab nests it', /<ul>[\s\S]*<ul>[\s\S]*nested/.test(h));
    yes('MT5', 'Ctrl+B bolds the selection', /<b>|<strong>|font-weight/.test(h));
    eq('MT5', 'the Journal’s toolbar is on the page', await E(() => !!document.querySelector('#pane-ed #jr-bar')), true);
    await p.waitForTimeout(400); await boot(); await E(a => mtgOpen(a.pid, a.mid), { pid, mid }); await p.waitForTimeout(300);
    yes('MT5', 'the notes come back after a reload', /Blot looks clean/.test(await E(() => document.querySelector('#pane-ed .jr-ed').innerText)));
  }

  // ── MT6 planner
  {
    await E(a => { mtgOpen(a.pid, a.mid); }, { pid, mid }); await p.waitForTimeout(250);
    await p.locator('#pane-ed .mtg-sec-actions .exh-act').first().click(); await p.waitForTimeout(300);
    let r = await E(id => { var a = LB.data.meetings[id].actions[0], t = LB.data.planner.tasks[a.task]; return { has: !!t, date: t && t.date, text: t && t.text, done: t && !!t.done }; }, mid);
    eq('MT6', 'the action is a Planner task on its due date, naming the meeting', [r.has, r.date, /Repeat the blot/.test(r.text || '') && /Weekly catch-up/.test(r.text || '')], [true, '2026-02-20', true]);
    await p.locator('#pane-ed .mtg-sec-actions input[type=checkbox]').first().check(); await p.waitForTimeout(250);
    r = await E(id => { var a = LB.data.meetings[id].actions[0]; return { a: a.done, t: !!LB.data.planner.tasks[a.task].done }; }, mid);
    eq('MT6', 'ticking the action ticks the task', [r.a, r.t], [1, true]);
  }

  // ── MT7 data
  {
    const r = await E(a => {
      var fp = _cloudFingerprint(), keys = Object.keys(fp).filter(k => k.indexOf('meetings/') === 0);
      var before = Object.keys(LB.data.meetings).length; _journalMigrate(); var after = Object.keys(LB.data.meetings).length;
      return { map: _CLOUD_MAPS.indexOf('meetings') >= 0, fp: keys.length === before && before > 0, mig: before === after, blank: 'meetings' in lbBlank() };
    }, 0);
    eq('MT7', 'a cloud map, in the fingerprint, in a blank tree, and the Journal migration leaves meetings alone', [r.map, r.fp, r.mig, r.blank], [true, true, true, true]);
    const bk = await E(async () => { var r = await _buildBackupPayload(); return Object.keys((r.payload.data || {}).meetings || {}).length; }, 0);
    yes('MT7', 'a backup carries the meetings (' + bk + ')', bk > 0);
    const d = await E(async a => {
      var m = LB.data.meetings[a.mid]; var tid = null;
      var _c = window.lbConfirm; window.lbConfirm = () => Promise.resolve(true);
      delMeeting(a.mid); await new Promise(r => setTimeout(r, 200));
      var gone = !LB.data.meetings[a.mid]; tid = Object.keys(LB.data.trash).filter(k => LB.data.trash[k].kind === 'meeting')[0];
      lbTrashRestore(tid); await new Promise(r => setTimeout(r, 200));
      var back = LB.data.meetings[a.mid] && LB.data.meetings[a.mid].title === 'Weekly catch-up';
      var n = Object.keys(LB.data.meetings).filter(k => LB.data.meetings[k].projectId === a.pid).length;
      delProject(a.pid); await new Promise(r => setTimeout(r, 200));
      var pg = !projById(a.pid), none = Object.keys(LB.data.meetings).filter(k => LB.data.meetings[k].projectId === a.pid).length === 0;
      var pt = Object.keys(LB.data.trash).filter(k => LB.data.trash[k].kind === 'project')[0];
      lbTrashRestore(pt); await new Promise(r => setTimeout(r, 200));
      var all = Object.keys(LB.data.meetings).filter(k => LB.data.meetings[k].projectId === a.pid).length;
      window.lbConfirm = _c;
      return { gone, back, pg, none, same: all === n, n, all };
    }, { mid, pid });
    eq('MT7', 'delete a meeting and restore it; delete a project (meetings go with it) and restore it', [d.gone, d.back, d.pg, d.none, d.same], [true, true, true, true, true]);
  }

  // ── MT8 export
  {
    const r = await E(a => {
      mtgOpen(a.pid, a.mid);
      var sc = pdfScopeDefault(), o = Object.assign({}, pdfOpts()), doc = buildPrintDoc(o, sc);
      var off = Object.assign({}, o, { mSummary: 0, mPeople: 0, mAgenda: 0, mNotes: 0, mDecisions: 0, mActions: 0, mCarry: 0, mExps: 0, mNext: 0 }), docOff = buildPrintDoc(off, sc);
      var bulk = buildPrintDoc(o, { kind: 'meetings', id: a.pid, from: '', to: '' });
      var txt = s => { var d = document.createElement('div'); d.innerHTML = s; return d.textContent; };
      return { sc: sc.kind + ':' + (sc.id === a.mid), doc: txt(doc), docOff: txt(docOff), bulk: txt(bulk), pages: (bulk.match(/class="pd-mt pd-mt-pg"/g) || []).length, n: mtgList(a.pid).length, label: pdfScopeLabel(sc) };
    }, { pid, mid });
    eq('MT8', 'from a meeting the export opens on that meeting', r.sc, 'meeting:true');
    for (const w of ['Weekly catch-up', 'Check the blot and plan', 'Blot is clean', 'Ana Ruiz', 'Apologies', 'Agenda', 'Use the new antibody lot', 'Repeat the blot', 'Blot looks clean', 'after the list'])
      yes('MT8', 'the minutes carry "' + w + '"', r.doc.includes(w));
    yes('MT8', 'with every box off only the head is left', !/Agenda|Decisions|Action items|Blot is clean|Apologies/.test(r.docOff) && r.docOff.includes('Weekly catch-up'));
    yes('MT8', 'no undefined or NaN on paper', !/undefined|NaN|\[object/.test(r.doc + r.bulk));
    eq('MT8', 'the project export is a cover and one page per meeting', [r.pages, /Open actions/.test(r.bulk)], [r.n, true]);
    await E(() => openPdfExport()); await p.waitForTimeout(900);
    const dlg = await E(() => ({ rows: [...document.querySelectorAll('#lb-dialog-card .pdfx-row')].filter(x => x.style.display !== 'none').length, sel: document.getElementById('pdfx-scope').value.split(':')[0], frame: !!(document.getElementById('pdfx-frame').srcdoc || '').includes('pd-mt') }));
    eq('MT8', 'the dialog shows only the meeting boxes, and previews the minutes', [dlg.rows, dlg.sel, dlg.frame], [9, 'meeting', true]);
    await E(() => _lbDlgClose());
  }

  // ── MT9 search
  {
    const r = await E(() => { var ix = spotAll().filter(x => x.a === 'Weekly catch-up').length, c = spotContent().filter(x => x.a === 'Weekly catch-up'); return { ix, hit: c.length === 1 && c[0].t.includes('blot looks clean') && c[0].t.includes('repeat the blot') && c[0].t.includes('bo li') }; });
    eq('MT9', 'the meeting is in the search by name', r.ix, 1);
    yes('MT9', 'and by the words in it', r.hit);
  }

  // ── MT10 fit, MT11 text
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(300);
    await E(a => { mtgOpen(a.pid, a.mid); }, { pid, mid }); await p.waitForTimeout(500);
    const r = await E(() => {
      var sh = document.querySelector('#pane-ed .mtg-sheet'), q = sh.getBoundingClientRect(), out = [];
      sh.querySelectorAll('.mtg-in,.mtg-f input,.mtg-f select,.mtg-chip,.mtg-seg,.mtg-type,.exp-sec-h').forEach(n => { var b = n.getBoundingClientRect(); if (b.width && (b.left < q.left - 1 || b.right > q.right + 1)) out.push(n.className + ' ' + Math.round(b.left - q.left) + '/' + Math.round(b.right - q.right)); });
      var ed = document.getElementById('pane-ed');
      return { out, x: ed.scrollWidth > ed.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1 };
    });
    eq('MT10', w + 'px: no horizontal overflow and nothing outside the sheet', [r.x, r.out], [false, []]);
  }
  await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(300);
  {
    const r = await E(a => { mtgOpen(a.pid, a.mid); return { rows: [...document.querySelectorAll('#pane-pages .mtg-item')].map(x => { var m = LB.data.meetings[x.dataset.m]; return [x.querySelector('.page-body').textContent.toLowerCase().includes(mtgType(m.type).name.toLowerCase()), /^\d{1,2}[A-Z]{3}$/.test(x.querySelector('.mtg-d').textContent.trim())].join(); }), txt: _mtgText(LB.data.meetings[a.mid]) }; }, { pid, mid });
    yes('MT10', 'every list row names its kind (as its title or beside it) and its date: ' + r.rows.join(' ; '), r.rows.length >= 4 && r.rows.every(x => x === 'true,true'));
    for (const w of ['Weekly catch-up', 'Present: Ana Ruiz', 'Apologies: Bo Li', 'Decisions', 'D1. Use the new antibody lot', '[x] Repeat the blot', 'Blot is clean']) yes('MT11', 'the plain text carries "' + w + '"', r.txt.includes(w));
  }
  // ── MT12 dialog, MT13 regulars, MT14 list
  {
    const pj = await E(() => LB.data.projects.map(x => x.id));
    await E(() => { Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); LB.data.projects.forEach(x => delete x.mtgPeople); MTG_PROJ = ''; selectNode('exps'); mtgOpen('', null); });
    await p.waitForTimeout(300);
    await p.locator('#pane-pages .pages-new').click(); await p.waitForTimeout(300);
    const d = await E(() => ({ opts: [...document.querySelectorAll('#mtg-nd-p option')].map(o => o.textContent), kinds: document.querySelectorAll('#mtg-nd-t option').length, date: document.getElementById('mtg-nd-d').value === todayStr(), ppl: document.getElementById('mtg-nd-ppl').textContent }));
    eq('MT12', 'the dialog offers every project, "new", eight kinds and today', [d.opts.length, /New project or topic/.test(d.opts[d.opts.length - 1]), d.kinds, d.date], [pj.length + 1, true, 8, true]);
    yes('MT12', 'a project with no history says it has no regulars: ' + d.ppl, /No regulars yet/.test(d.ppl));
    const B = pj[1], A = pj[0];
    await p.locator('#mtg-nd-p').selectOption(B); await p.locator('#mtg-nd-t').selectOption('tap'); await p.locator('#lb-dialog-card .modal-act .btn', { hasText: 'Create' }).click(); await p.waitForTimeout(400);
    const m = await E(() => { const m = mtgCur(); return { proj: m.projectId, type: m.type, open: SEL.node.kind }; });
    eq('MT12', 'created under the project picked, of the kind picked, and open', [m.proj, m.type, m.open], [B, 'tap', 'meetings']);
    await p.locator('#mtg-att-in').click(); await p.keyboard.type('Dee Fox, Eli Gray, Fay Hill', { delay: 15 }); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.locator('.mtg-chip', { hasText: 'Dee Fox' }).locator('.mtg-star').click(); await p.locator('.mtg-chip', { hasText: 'Eli Gray' }).locator('.mtg-star').click(); await p.waitForTimeout(200);
    let r = await E(a => ({ roster: projById(a.B).mtgPeople, pressed: [...document.querySelectorAll('.mtg-chip .mtg-star')].map(x => x.getAttribute('aria-pressed')) }), { B });
    eq('MT13', 'the star pins the regulars on the project', [r.roster, r.pressed], [['Dee Fox', 'Eli Gray'], ['true', 'true', 'false']]);
    await p.locator('.mtg-chip', { hasText: 'Dee Fox' }).locator('button[aria-label^="Take"]').click(); await p.waitForTimeout(150);
    await p.locator('.mtg-chip', { hasText: 'Eli Gray' }).locator('.mtg-cn').click(); await p.waitForTimeout(150);
    r = await E(a => ({ roster: projById(a.B).mtgPeople, here: mtgCur().attendees.map(x => x.n + ':' + x.a), quick: !!document.querySelector('#mtg-quick .mtg-add') }), { B });
    eq('MT13', 'x and apologies leave the regulars alone', [r.roster, r.here, r.quick], [['Dee Fox', 'Eli Gray'], ['Eli Gray:1', 'Fay Hill:0'], true]);
    await p.locator('#mtg-quick .mtg-add').click(); await p.waitForTimeout(150);
    eq('MT13', '"Add the regulars" puts Dee back, once', await E(() => mtgCur().attendees.map(x => x.n)), ['Eli Gray', 'Fay Hill', 'Dee Fox']);
    await E(() => mtgOpen('', null)); await p.waitForTimeout(250);
    await p.locator('#pane-pages .pages-new').click(); await p.waitForTimeout(250);
    await p.locator('#mtg-nd-p').selectOption(B); await p.waitForTimeout(100);
    yes('MT13', 'picking the project shows its regulars in the dialog', /Invited\s*Dee Fox, Eli Gray/.test(await E(() => document.getElementById('mtg-nd-ppl').textContent)));
    await p.locator('#lb-dialog-card .modal-act .btn', { hasText: 'Create' }).click(); await p.waitForTimeout(400);
    eq('MT13', 'the next meeting of the project starts with its regulars, all present', await E(() => mtgCur().attendees.map(x => x.n + ':' + x.a)), ['Dee Fox:0', 'Eli Gray:0']);
    eq('MT13', 'another project does not get them', await E(a => mtgNew(a.A, 'group').attendees.length, { A }), 0);
    await E(a => mtgOpen(a.B, null), { B }); await p.waitForTimeout(300);
    await p.locator('#mtg-ros-in').click(); await p.keyboard.type('Gus Ito', { delay: 15 }); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    eq('MT13', 'the overview adds a regular', await E(a => projById(a.B).mtgPeople, { B }), ['Dee Fox', 'Eli Gray', 'Gus Ito']);
    await p.locator('.mtg-home .mtg-chip', { hasText: 'Dee Fox' }).locator('.mtg-x').click(); await p.waitForTimeout(250);
    eq('MT13', 'and removes one', await E(a => projById(a.B).mtgPeople, { B }), ['Eli Gray', 'Gus Ito']);
    await E(() => mtgOpen('', null)); await p.locator('#pane-pages .pages-new').click(); await p.waitForTimeout(250);
    await p.locator('#mtg-nd-p').selectOption('__new'); await p.locator('#mtg-nd-new').fill('Zeta topic'); await p.locator('#lb-dialog-card .modal-act .btn', { hasText: 'Create' }).click(); await p.waitForTimeout(500);
    eq('MT12', 'a new project or topic is made and the meeting is filed under it', await E(() => [LB.data.projects[LB.data.projects.length - 1].name, mtgCur().projectId === LB.data.projects[LB.data.projects.length - 1].id]), ['Zeta topic', true]);
    await E(() => { MTG_PROJ = ''; MTG_VIEW = 'project'; mtgOpen('', null); }); await p.waitForTimeout(300);
    const L = await E(() => ({ heads: [...document.querySelectorAll('#mtg-rows .mtg-grp .mtg-gn')].map(x => x.textContent), withMeet: LB.data.projects.filter(x => mtgList(x.id).length).map(x => x.name) }));
    eq('MT14', 'one header per project that has meetings, in project order', L.heads, L.withMeet);
    await p.locator('#mtg-fp').selectOption(B); await p.waitForTimeout(250);
    eq('MT14', 'the project filter shows only that project', await E(a => [...document.querySelectorAll('#mtg-rows .mtg-item')].length === mtgList(a.B).length && document.querySelectorAll('#mtg-rows .mtg-grp').length === 1, { B }), true);
    await p.locator('#mtg-fp').selectOption(''); await p.locator('.mtg-seg-s button', { hasText: 'Date' }).click(); await p.waitForTimeout(250);
    yes('MT14', 'by date, rows carry their project and there are no project headers', await E(() => document.querySelectorAll('#mtg-rows .mtg-grp').length === 0 && document.querySelectorAll('#mtg-rows .mtg-pj').length > 0));
    await E(() => { MTG_VIEW = 'project'; });
    const mv = await E(a => { const m = mtgAll().filter(x => x.projectId === a.B)[0]; mtgOpen(a.B, m.id); mtgProject(a.A); return LB.data.meetings[m.id].projectId === a.A && mtgList(a.A).some(x => x.id === m.id); }, { A, B });
    eq('MT14', 'a meeting moved to another project is listed there', mv, true);

    // ── MT15 fold: a project's group folds to its header, remembered; a search or filter never hides a result
    await E(() => { Object.keys(MTG_FOLD).forEach(k => delete MTG_FOLD[k]); MTG_PROJ = ''; MTG_Q = ''; MTG_VIEW = 'project'; mtgOpen('', null); }); await p.waitForTimeout(250);
    const heads = await E(() => [...document.querySelectorAll('#mtg-rows .mtg-grp')].map(x => x.getAttribute('aria-expanded')));
    yes('MT15', 'every project starts open, with a button for each header', heads.length >= 2 && heads.every(x => x === 'true'));
    const rowsBefore = await E(() => document.querySelectorAll('#mtg-rows .mtg-item').length);
    await p.locator('#mtg-rows .mtg-grp').first().click(); await p.waitForTimeout(150);
    const f1 = await E(() => ({ exp: document.querySelector('#mtg-rows .mtg-grp').getAttribute('aria-expanded'), rows: document.querySelectorAll('#mtg-rows .mtg-item').length, heads: document.querySelectorAll('#mtg-rows .mtg-grp').length, saved: Object.keys(JSON.parse(localStorage.getItem('lb_mtg_fold') || '{}')).length }));
    eq('MT15', 'clicking a header folds that project only (its rows go, the header stays) and the fold is stored', [f1.exp, f1.rows < rowsBefore, f1.heads, f1.saved], ['false', true, heads.length, 1]);
    await p.locator('#mtg-q').fill('a'); await p.waitForTimeout(200);
    yes('MT15', 'a search opens every group that has a match', await E(() => [...document.querySelectorAll('#mtg-rows .mtg-grp')].every(x => x.getAttribute('aria-expanded') === 'true')));
    await p.locator('#mtg-q').fill(''); await p.waitForTimeout(200);
    await p.locator('#mtg-foldall').click(); await p.waitForTimeout(150);
    eq('MT15', 'fold-all folds every project', await E(() => document.querySelectorAll('#mtg-rows .mtg-item').length), 0);
    await p.locator('#mtg-foldall').click(); await p.waitForTimeout(150);
    eq('MT15', 'and a second click opens them all again', await E(() => document.querySelectorAll('#mtg-rows .mtg-item').length), rowsBefore);
    await E(() => { Object.keys(MTG_FOLD).forEach(k => delete MTG_FOLD[k]); MTG_Q = ''; try { localStorage.removeItem('lb_mtg_fold'); } catch (e) {} });
    await E(() => { Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); MTG_PROJ = ''; });
  }

  eq('MT11', 'no console errors', errs, []);
  await browser.close();
} finally { srv.kill(); }

console.log(findings.length ? findings.join('\n') : `✓ meetings invariants pass (${checks} checks)`);
process.exit(findings.length ? 1 : 0);
