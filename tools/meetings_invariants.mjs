// Meetings invariants — Meetings is a Labbook workspace of its own (filed by project or topic), written in the Journal's own editor.
//
// A meeting is a record in LB.data.meetings (a cloud map), not a Journal page: the Journal migration files any page that
// is not a Note into a day and deletes it, so a meeting kept as a page would have gone. Drives labbook.html itself.
//
//   MT1  nav       Meetings is its own workspace (one entry in Labbook's own switcher, none per project, none in the Experiments column);
//                  it opens the overview across every project and topic and remembers where you left it; the crumb says where
//   MT2  create    each of the ten kinds makes a record under the project, with its agenda and notes skeleton; place and
//                  times come from the last meeting of that kind, people from the project's regulars; dated ahead = Planned
//   MT12 dialog    "+ New" asks for the project or topic (dropdown, with "new project or topic"), the kind and the date, and
//                  says who is invited; the meeting is filed under what was picked
//   MT13 regulars  the project remembers who comes (learnt, then pinned with the star); x takes someone off ONE meeting,
//                  apologies change nothing, "Add the regulars" puts them back, the overview edits the list
//   MT14 list      the list is grouped by project (a header per project that has meetings), filters by project, and can be
//                  read by date; a meeting moved to another project follows
//   MT15 fold      each project's group folds to its header (remembered on the device); a search or a project filter never hides a result;
//                  one button folds or opens them all
//   MT16 right-click  a project's header in the list and its tile on the overview, a meeting row and the blank list each open a menu; rename, duplicate
//                  (nothing done), move to project, status, kind, delete and delete-a-project's-meetings work on an id without the meeting being open
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
//   MT18 carry     a new Biology Alignment copies the own sections of the latest Safety committee of its project
//   MT19 centre    a Biology Alignment keeps no list of people (the whole centre comes)
//   MT17 sections  each project decides what its meetings are made of: sections switched off, renamed, moved, and sections of its own (list,
//                  checklist, text) in the dialog; nothing stored for the default; a template (Safety committee) sets them and the kind; what a
//                  hidden section holds stays; the page, the PDF and the plain text all follow; hiding Notes takes the toolbar with it
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
  eq('MT2', 'ten kinds', types.length, 10);
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
    await E(() => openPdfExport()); await p.waitForFunction(() => { var h = document.getElementById('pdfx-prev'); return h && h._pgv && h._pgv.inner != null && !h.classList.contains('pgv-busy'); }, null, { timeout: 15000 });
    const dlg = await E(() => ({ rows: [...document.querySelectorAll('#lb-dialog-card .pdfx-row')].filter(x => x.style.display !== 'none').length, sel: document.getElementById('pdfx-scope').value.split(':')[0], frame: !!(document.getElementById('pdfx-prev')._pgv.inner || '').includes('pd-mt') }));
    eq('MT8', 'the dialog shows only the meeting boxes, and previews the minutes', [dlg.rows, dlg.sel, dlg.frame], [10, 'meeting', true]);
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
    eq('MT12', 'the dialog offers every project, "new", ten kinds and today', [d.opts.length, /New project or topic/.test(d.opts[d.opts.length - 1]), d.kinds, d.date], [pj.length + 1, true, 10, true]);
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


  // ── MT16 right-click: project header, tile, meeting row, blank list
  {
    const items = async sel => { await p.waitForTimeout(320); /* a menu ignores presses for 260 ms after it opens */ return E(() => [...document.querySelectorAll('#ctxmenu.open .pop-item .pop-l')].map(x => x.textContent)); };
    const click = async label => { await p.locator('#ctxmenu.open .pop-item', { hasText: new RegExp('^' + label) }).first().click(); await p.waitForTimeout(250); };
    await E(() => { Object.keys(MTG_FOLD).forEach(k => delete MTG_FOLD[k]); MTG_PROJ = ''; MTG_Q = ''; MTG_VIEW = 'project'; mtgNew(LB.data.projects[0].id, 'group', { date: '2026-03-02' }); mtgNew(LB.data.projects[0].id, 'update', { date: '2026-03-09' }); mtgNew(LB.data.projects[1].id, 'group', { date: '2026-03-03' }); mtgOpen('', null); }); await p.waitForTimeout(250);
    const pj = await E(() => LB.data.projects.filter(x => mtgList(x.id).length)[0].id);
    await p.locator('#mtg-rows .mtg-grp').first().click({ button: 'right' });
    const ph = await items();
    for (const w of ['New meeting', 'Overview', 'Regular participants…', 'Export PDF…', 'Rename project…', 'Change colour', 'Delete its meetings…', 'Delete project…']) yes('MT16', 'project header menu has ' + w + ' (got ' + ph.join(' | ') + ')', ph.includes(w));
    yes('MT16', 'a right-click on a header does not fold it', await E(() => document.querySelector('#mtg-rows .mtg-grp').getAttribute('aria-expanded') === 'true'));
    await click('Hide its meetings');
    eq('MT16', 'Hide its meetings folds that project', await E(() => document.querySelector('#mtg-rows .mtg-grp').getAttribute('aria-expanded')), 'false');
    await E(() => { Object.keys(MTG_FOLD).forEach(k => delete MTG_FOLD[k]); _mtgRowsPaint(); });
    // rename the project from its header
    await p.locator('#mtg-rows .mtg-grp').first().click({ button: 'right' }); await items(); await click('Rename project…');
    await p.locator('#lb-dlg-input').fill('Renamed topic'); await p.locator('#lb-dlg-ok').click(); await p.waitForTimeout(300);
    eq('MT16', 'Rename project renames it, in the list too', await E(a => [projById(a.pj).name, document.querySelector('#mtg-rows .mtg-grp .mtg-gn').textContent], { pj }), ['Renamed topic', 'Renamed topic']);
    // the blank list
    await E(() => { document.getElementById('mtg-rows').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 })); });
    const lm = await items(); yes('MT16', 'the blank list offers New meeting and Export PDF (got ' + lm.join(' | ') + ')', lm.includes('New meeting') && lm.includes('Export PDF…'));
    await p.keyboard.press('Escape'); await E(() => { var c = document.getElementById('ctxmenu'); c.classList.remove('open'); });
    // a meeting row
    const mid1 = await E(a => mtgList(a.pj)[0].id, { pj });
    await p.locator('#mtg-rows .mtg-item[data-m="' + mid1 + '"]').click({ button: 'right' });
    const mm = await items();
    for (const w of ['Open', 'Rename…', 'Duplicate', 'Move to project…', 'Change kind…', 'Planned', 'Held', 'Cancelled', 'Export PDF…', 'History…', 'Delete']) yes('MT16', 'meeting menu has ' + w + ' (got ' + mm.join(' | ') + ')', mm.includes(w));
    await click('Rename…'); await p.locator('#lb-dlg-input').fill('Pizza night'); await p.locator('#lb-dlg-ok').click(); await p.waitForTimeout(300);
    eq('MT16', 'Rename sets the title (row and record)', await E(a => [LB.data.meetings[a.mid1].title, document.querySelector('#mtg-rows .mtg-item[data-m="' + a.mid1 + '"] .page-title').textContent], { mid1 }), ['Pizza night', 'Pizza night']);
    await p.locator('#mtg-rows .mtg-item[data-m="' + mid1 + '"]').click({ button: 'right' }); await items(); await click('Cancelled');
    eq('MT16', 'Cancelled marks it, without opening it', await E(a => LB.data.meetings[a.mid1].status, { mid1 }), 'cancelled');
    // duplicate: same agenda and people, nothing done
    await E(a => { var m = LB.data.meetings[a.mid1]; m.actions = [{ id: 'a1', t: 'Do it', who: 'Ana', due: '', done: 0 }]; m.decisions = [{ id: 'd1', t: 'Yes' }]; m.agenda.forEach(x => x.d = 1); m.attendees = [{ n: 'Ana Ruiz', a: 1 }]; }, { mid1 });
    const n0 = await E(() => Object.keys(LB.data.meetings).length);
    await p.locator('#mtg-rows .mtg-item[data-m="' + mid1 + '"]').click({ button: 'right' }); await items(); await click('Duplicate');
    const dup = await E(a => { var c = mtgCur(), o = LB.data.meetings[a.mid1]; return { n: Object.keys(LB.data.meetings).length, other: c.id !== a.mid1, title: c.title, agenda: c.agenda.length === o.agenda.length, undone: c.agenda.every(x => !x.d), noAct: !c.actions.length && !c.decisions.length, who: c.attendees.map(x => x.n + ':' + x.a), same: c.projectId === o.projectId, st: c.status }; }, { mid1 });
    eq('MT16', 'Duplicate makes another planned meeting: same agenda unticked and people present, no actions or decisions', [dup.n, dup.other, dup.title, dup.agenda, dup.undone, dup.noAct, dup.who, dup.same, dup.st], [n0 + 1, true, 'Pizza night', true, true, true, ['Ana Ruiz:0'], true, 'planned']);
    // move + kind, by id, with the meeting not open
    const other = await E(a => LB.data.projects.filter(x => x.id !== a.pj)[0].id, { pj });
    await E(() => { mtgOpen('', null); }); await p.waitForTimeout(200);
    await E(a => { mtgMoveTo(a.mid1, a.other); mtgSetKind(a.mid1, 'jc'); }, { mid1, other });
    eq('MT16', 'move to project and change kind work on an id', await E(a => { var m = LB.data.meetings[a.mid1]; return [m.projectId === a.other, m.type]; }, { mid1, other }), [true, 'jc']);
    // delete a project's meetings in one go; the project stays; one undo brings them back
    await E(() => { MTG_PROJ = ''; mtgOpen('', null); });
    const want = await E(a => mtgList(a.other).length, { other });
    await E(a => { delProjectMeetings(a.other); }, { other }); await p.waitForTimeout(200);
    await p.locator('#lb-dlg-ok').click(); await p.waitForTimeout(300);
    eq('MT16', 'Delete its meetings empties the project and keeps it', await E(a => [mtgList(a.other).length, !!projById(a.other)], { other }), [0, true]);
    yes('MT16', 'the deleted meetings are in Deleted items (' + want + ')', await E(w => Object.values(LB.data.trash || {}).filter(t => t.kind === 'meeting').length >= w || (LB.data.trash || []).filter && (LB.data.trash || []).filter(t => t.kind === 'meeting').length >= w, want));
    await E(() => { MTG_PROJ = ''; Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); });
  }

  // ── MT17 sections: a project that is not science
  {
    const pj = await E(() => { addProject('Safety zz'); return LB.data.projects[LB.data.projects.length - 1].id; });
    const heads = () => E(() => [...document.querySelectorAll('#pane-ed .mtg-sh .exp-sec-t')].map(x => x.textContent));
    await E(a => { mtgNew(a.pj, 'group'); }, { pj }); await p.waitForTimeout(350);
    eq('MT17', 'no layout stored = every section, in the default order', [await E(a => projById(a.pj).mtgLayout === undefined, { pj }), await heads()],
      [true, ['Purpose', 'People', 'Agenda', 'Notes', 'Decisions', 'Action items', 'In one line', 'Experiments discussed', 'Next meeting']]);
    const mid = await E(() => mtgCur().id);
    await E(a => { var m = mtgCur(); m.exps = []; m.decisions = [{ id: 'dd1', t: 'Wear goggles' }]; m.actions = [{ id: 'aa1', t: 'Check the eyewash', who: 'Ana', due: '', done: 0 }]; m.purpose = 'Quarterly look'; m.attendees = [{ n: 'Ana Ruiz', a: 0 }, { n: 'Bo Li', a: 1 }]; save(); renderEditor(); }, { pj });
    // the dialog: pick the Safety template, save
    await p.locator('#pane-ed .mtg-acts button', { hasText: 'Sections' }).click(); await p.waitForSelector('#lb-dialog.open .mtg-sd');
    await p.selectOption('#mtg-sd-pre', 'safetyfull'); await p.waitForTimeout(150);
    await p.locator('#lb-dialog-card .btn', { hasText: /^Save$/ }).click(); await p.waitForTimeout(350);
    eq('MT17', 'the detailed Safety template reorders, renames and adds the lists',
      await heads(), ['Attendance', 'Agenda', 'Incidents and near misses', 'Inspections and audits', 'Risk assessments and COSHH', 'Training and compliance', 'Minutes', 'Decisions', 'Action items', 'Key message', 'Next meeting']);
    eq('MT17', 'no Purpose and no Experiments on the page, the toolbar and the editor are still there', await E(() => [!/Purpose|Experiments discussed/.test(document.getElementById('pane-ed').innerText), !!document.querySelector('#pane-ed .jr-b'), !!document.querySelector('#pane-ed .jr-ed')]), [true, true, true]);
    const k = await E(a => Object.fromEntries(_mtgLayout(a.pj).secs.filter(s => s.custom).map(s => [s.n, s.k])), { pj });
    // type a list with real keys
    const inc = '#mtg-cx-' + k['Incidents and near misses'];
    await p.locator(inc + ' ~ .mtg-add').first().click(); await p.waitForTimeout(150);
    await p.keyboard.type('Slip in corridor'); await p.keyboard.press('Enter'); await p.waitForTimeout(150); await p.keyboard.type('Near miss at the fume hood'); await p.waitForTimeout(150);
    eq('MT17', 'a list of your own takes lines with Enter and keeps them in the meeting', await E(a => (mtgMap()[a.mid].cx[a.k] || []).map(x => x.t), { mid, k: k['Incidents and near misses'] }), ['Slip in corridor', 'Near miss at the fume hood']);
    eq('MT17', 'its rows are numbered', await E(a => [...document.querySelectorAll('#pane-ed .mtg-sec-cx-' + a.k + ' .mtg-dn')].map(x => x.textContent), { k: k['Incidents and near misses'] }), ['1', '2']);
    // a checklist and a text section added in the dialog
    await p.locator('#pane-ed .mtg-acts button', { hasText: 'Sections' }).click(); await p.waitForSelector('#lb-dialog.open .mtg-sd');
    await p.fill('#mtg-sd-newn', 'Fire drill'); await p.selectOption('#mtg-sd-newk', 'checks'); await p.locator('#lb-dialog-card .btn', { hasText: /^Add section$/ }).click(); await p.waitForTimeout(120);
    await p.fill('#mtg-sd-newn', 'Note for the fire warden'); await p.selectOption('#mtg-sd-newk', 'text'); await p.locator('#lb-dialog-card .btn', { hasText: /^Add section$/ }).click(); await p.waitForTimeout(120);
    // rename Action items, hide Decisions, move Minutes up one
    const row = n => p.locator('#lb-dialog-card .mtg-sd-row', { has: p.locator('input.mtg-sd-name[value="' + n + '"]') });
    await row('Action items').locator('input.mtg-sd-name').fill('Actions and owners');
    await row('Decisions').locator('input[type=checkbox]').first().uncheck(); await p.waitForTimeout(120);
    await row('Minutes').locator('button[aria-label="Move up"]').click(); await p.waitForTimeout(120);
    yes('MT17', 'a hidden section says how many meetings still hold something in it', await E(() => /in 1/.test(document.querySelector('#lb-dialog-card .mtg-sd-row.off .mtg-sd-used')?.textContent || '')));
    await p.locator('#lb-dialog-card .btn', { hasText: /^Save$/ }).click(); await p.waitForTimeout(350);
    const h2 = await heads();
    eq('MT17', 'renamed, hidden and moved: the page follows', h2, ['Attendance', 'Agenda', 'Incidents and near misses', 'Inspections and audits', 'Risk assessments and COSHH', 'Minutes', 'Training and compliance', 'Actions and owners', 'Key message', 'Next meeting', 'Fire drill', 'Note for the fire warden']);
    yes('MT17', 'Decisions is gone from the page, Actions and owners is there, Minutes sits before Training and compliance', h2.indexOf('Decisions') < 0 && h2.includes('Actions and owners') && h2.indexOf('Minutes') < h2.indexOf('Training and compliance') && h2.indexOf('Minutes') >= 0);
    eq('MT17', 'the two new sections are at the end', h2.slice(-2), ['Fire drill', 'Note for the fire warden']);
    eq('MT17', 'hiding a section does not empty it', await E(a => [mtgMap()[a.mid].decisions.length, mtgMap()[a.mid].decisions[0].t], { mid }), [1, 'Wear goggles']);
    // checklist: add, tick, count; text: typed
    await p.locator('#mtg-cx-' + (await E(a => _mtgLayout(a.pj).secs.filter(s => s.n === 'Fire drill')[0].k, { pj })) + ' ~ .mtg-add').first().click(); await p.waitForTimeout(150);
    await p.keyboard.type('Exits clear'); await p.waitForTimeout(100);
    await p.locator('#pane-ed .mtg-row input[type=checkbox][onchange*="mtgCxTick"]').first().check(); await p.waitForTimeout(150);
    eq('MT17', 'ticking a check updates the row and the header count', await E(() => [document.querySelector('#pane-ed .mtg-row.done input[onchange*="mtgCxTick"]') !== null, /1\/1 done/.test(document.getElementById('pane-ed').innerText)]), [true, true]);
    await p.locator('#pane-ed textarea.mtg-ta').fill('Warden: Ana\nAssembly point: car park'); await p.waitForTimeout(150);
    eq('MT17', 'a text section keeps what was typed, with its line break', await E(a => { var s = _mtgLayout(a.pj).secs.filter(x => x.n === 'Note for the fire warden')[0]; return _mtgCxText(mtgMap()[a.mid], s.k); }, { pj, mid }), 'Warden: Ana\nAssembly point: car park');
    // the PDF and the plain text follow the layout
    const out = await E(a => { var m = mtgMap()[a.mid], doc = _pdMeetingHtml(m, pdfOpts()), off = _pdMeetingHtml(m, Object.assign(pdfOpts(), { mCustom: 0 })); return { doc: doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), off: off.replace(/<[^>]+>/g, ' '), txt: _mtgText(m), srch: _mtgSearchText(m) }; }, { mid });
    for (const w of ['Attendance', 'Incidents and near misses', 'Slip in corridor', 'Near miss at the fume hood', 'Fire drill', 'Exits clear', 'Note for the fire warden', 'Assembly point: car park', 'Actions and owners'])
      yes('MT17', 'the PDF carries "' + w + '"', out.doc.includes(w));
    yes('MT17', 'the PDF leaves out the hidden Decisions and the experiments', !/Decisions|Wear goggles|Experiments discussed/.test(out.doc));
    yes('MT17', 'the "Sections of your own" box takes them off the paper', !/Incidents and near misses|Slip in corridor|Fire drill/.test(out.off) && /Actions and owners/.test(out.off));
    yes('MT17', 'the plain text has the lists, the check state and the renamed heading', /Incidents and near misses\n1\. Slip in corridor\n2\. Near miss/.test(out.txt) && /\[ \] Exits clear|\[x\] Exits clear/.test(out.txt) && /Actions and owners/.test(out.txt) && !/Wear goggles/.test(out.txt));
    yes('MT17', 'the search reads sections of your own', /fume hood/.test(out.srch) && /car park/.test(out.srch));
    // the other meeting kinds of a project with the template start as a Safety committee, with its agenda
    eq('MT17', 'the Safety committee kind starts with nothing to delete', await E(() => [mtgType('safety').name, mtgType('safety').agenda.length]), ['Safety committee', 0]);
    eq('MT17', 'Biology Alignment is a kind of its own, offered in New meeting, blank too', await E(a => { mtgNewDialog(a.pj); var o = [...document.querySelectorAll('#mtg-nd-t option')].map(x => x.value + ':' + x.textContent); _lbDlgClose(); var t = mtgType('bioalign'); return [o.includes('bioalign:Biology Alignment'), t.name, t.agenda.length, t.notes.length]; }, { pj }), [true, 'Biology Alignment', 0, 0]);
    // a Biology Alignment starts with a copy of the latest Safety committee's own sections
    const ba = await E(() => {
      addProject('Safety carry'); var id = LB.data.projects[LB.data.projects.length - 1].id, L = _mtgPresetLayout(MTG_PRESETS.filter(x => x.id === 'safety')[0]);
      L.secs.push({ k: 'chid', on: 0, n: 'Hidden one', custom: 1, kind: 'list' }, { k: 'ctxt', on: 1, n: 'Remarks', custom: 1, kind: 'text' }); _mtgLayoutSave(id, { secs: L.secs, fields: _mtgLayout(id).fields, defKind: 'safety' });
      var K = Object.fromEntries(_mtgLayout(id).secs.filter(s => s.custom).map(s => [s.n, s.k]));
      var cx = (t) => { var o = {}; o[K['Inspection Notes']] = [{ id: 'r1' + t, t: 'Eyewash ' + t }, { id: 'r2' + t, t: '  ' }]; o[K['Round Table']] = [{ id: 'r3' + t, t: 'Gloves ' + t }]; o.chid = [{ id: 'r4' + t, t: 'secret' }]; o.ctxt = 'Para ' + t; return o; };
      var mk = (type, date, over) => mtgNew(id, type, Object.assign({ date }, over || {}));
      var early = mk('bioalign', '2026-01-01');
      mk('safety', '2026-09-24', { cx: cx('sep') }); var oct = mk('safety', '2026-10-29', { cx: cx('oct'), actions: [{ id: 'a1', t: 'Fix it', who: '', due: '', done: 0 }], html: '<div>minutes</div>' });
      mk('safety', '2026-10-30', { cx: cx('can'), status: 'cancelled' }); mk('safety', '2026-12-17', { cx: cx('dec') });
      var n = mk('bioalign', '2026-10-30'), said = document.getElementById('toast') ? document.getElementById('toast').textContent : document.body.innerText;
      var C = n.cx || (n.cx = {}), R = C[K['Round Table']] || (C[K['Round Table']] = [{ id: 'none', t: '' }]);
      var got = { insp: (n.cx[K['Inspection Notes']] || []).map(r => r.t), rt: (n.cx[K['Round Table']] || []).map(r => r.t), lab: n.cx[K['Lab Management Notes']] || null, hid: n.cx.chid || null, txt: n.cx.ctxt, acts: n.actions.length, notes: /minutes/.test(n.html) };
      var fresh = R[0].id !== oct.cx[K['Round Table']][0].id; R[0].t = 'edited'; var kept = oct.cx[K['Round Table']][0].t;
      mtgDup(n.id); var dup = Object.keys(mtgCur().cx || {}).length;
      var other = mk('group', '2026-10-30').cx || null;
      var nov = mk('safety', '2026-11-26'), afterEmpty = mk('bioalign', '2026-11-27').cx || null;
      Object.keys(LB.data.meetings).forEach(k => { if (LB.data.meetings[k].projectId === id) delete LB.data.meetings[k]; });
      return { got, fresh, kept, said: /Copied Inspection Notes, Round Table and Remarks from Safety committee/.test(said), early: early.cx || null, dup, other, afterEmpty };
    });
    eq('MT18', 'a Biology Alignment copies the own sections that are on, from the latest Safety committee up to its date (not a cancelled or a later one), without actions or notes', ba.got,
      { insp: ['Eyewash oct'], rt: ['Gloves oct'], lab: null, hid: null, txt: 'Para oct', acts: 0, notes: false });
    eq('MT18', 'it is a copy: editing it leaves the committee’s minutes alone', [ba.fresh, ba.kept], [true, 'Gloves oct']);
    yes('MT18', 'it says what it copied and from where', ba.said);
    eq('MT18', 'nothing is copied with no earlier committee, into another kind, into a duplicate, or from an older one when the latest is empty', [ba.early, ba.dup, ba.other, ba.afterEmpty], [null, 0, null, null]);
    // right-click on a Safety committee makes its Biology Alignment, from that one and not the latest
    {
      const ids = await E(() => {
        addProject('Safety rc'); var id = LB.data.projects[LB.data.projects.length - 1].id, L = _mtgPresetLayout(MTG_PRESETS.filter(x => x.id === 'safety')[0]); _mtgLayoutSave(id, { secs: L.secs, fields: _mtgLayout(id).fields, defKind: 'safety' });
        var k = _mtgLayout(id).secs.filter(s => s.custom)[0].k, cx = t => ({ [k]: [{ id: 'q' + t, t }] });
        var fri = mtgNew(id, 'safety', { date: '2026-10-30', cx: cx('october') }).id, late = mtgNew(id, 'safety', { date: '2026-11-26', cx: cx('november') }).id,
          cxl = mtgNew(id, 'safety', { date: '2026-09-24', status: 'cancelled' }).id, grp = mtgNew(id, 'group', { date: '2026-08-01' }).id;
        MTG_PROJ = id; mtgOpen(id, late); return { pj: id, k, fri, late, cxl, grp };
      });
      await p.waitForTimeout(300);
      const item = () => p.locator('#ctxmenu .pop-item', { hasText: 'Create Biology Alignment from this' });
      const offered = [];
      for (const m of [ids.cxl, ids.grp, ids.fri]) { await p.locator('.mtg-item[data-m="' + m + '"]').click({ button: 'right' }); await p.waitForTimeout(450); offered.push(await item().count()); if (m !== ids.fri) { await E(() => document.getElementById('ctxmenu').classList.remove('open')); await p.waitForTimeout(150); } }
      eq('MT18', 'the right-click option is on a Safety committee, not on a cancelled one or another kind', offered, [0, 0, 1]);
      if (offered[2]) { await item().first().click(); await p.waitForTimeout(350); }
      eq('MT18', 'it makes and opens that committee’s Biology Alignment, Monday after a Friday, with its notes and not the latest ones', await E(a => { var m = mtgCur(); return [m.type, m.projectId === a.pj, m.date, ((m.cx || {})[a.k] || []).map(r => r.t)]; }, ids), ['bioalign', true, '2026-11-02', ['october']]);
      eq('MT18', 'after a Thursday it is the next day', await E(a => { var m = mtgBioFromSafety(a.late); return [m.date, m.cx[a.k].map(r => r.t)]; }, ids), ['2026-11-27', ['november']]);
      await E(a => { Object.keys(LB.data.meetings).forEach(k => { if (LB.data.meetings[k].projectId === a.pj) delete LB.data.meetings[k]; }); MTG_PROJ = ''; save(); }, ids);
      await E(a => mtgOpen(a.pj, a.mid), { pj, mid }); await p.waitForTimeout(250);
    }
    // the whole centre comes to a Biology Alignment: it keeps no list of people
    {
      const r = await E(() => {
        addProject('Safety nobody'); var id = LB.data.projects[LB.data.projects.length - 1].id, L = _mtgPresetLayout(MTG_PRESETS.filter(x => x.id === 'safety')[0]); _mtgLayoutSave(id, { secs: L.secs, fields: _mtgLayout(id).fields, defKind: 'safety' });
        var ppl = () => [{ n: 'Ana Ruiz', a: 0 }, { n: 'Bo Li', a: 1 }];
        mtgNew(id, 'safety', { date: '2026-10-29', attendees: ppl() });
        var heads = () => [...document.querySelectorAll('#pane-ed .mtg-sh .exp-sec-t')].map(x => x.textContent);
        var b = mtgNew(id, 'bioalign', { date: '2026-10-30' }), page = heads(), made = b.attendees.length;
        b.attendees = ppl(); save(); mtgOpen(id, b.id);   // one made before this rule still holds names: hidden, not deleted
        var old = [heads().includes('People'), !!document.getElementById('mtg-att-in'), / people/.test(document.querySelector('.mtg-item[data-m="' + b.id + '"]').textContent), /Ana Ruiz|Bo Li/.test(_mtgText(b)), /Ana Ruiz|Bo Li/.test(_pdMeetingHtml(b, pdfOpts())), b.attendees.length];
        mtgDup(b.id); var dup = mtgCur().attendees.length;
        for (var i = 1; i <= 5; i++) mtgNew(id, 'bioalign', { date: '2026-11-0' + i });
        Object.values(LB.data.meetings).filter(m => m.projectId === id && m.type === 'bioalign').forEach(m => m.attendees = [{ n: 'Cy Dahl', a: 0 }]);
        var regs = _mtgRoster(id);
        mtgNewDialog(id, 'safety'); var before = document.getElementById('mtg-nd-ppl').textContent, sel = document.getElementById('mtg-nd-t'); sel.value = 'bioalign'; sel.dispatchEvent(new Event('change')); var after = document.getElementById('mtg-nd-ppl').textContent; _lbDlgClose();
        var safety = mtgNew(id, 'safety', { date: '2026-11-26' }), safeHeads = heads();
        Object.keys(LB.data.meetings).forEach(k => { if (LB.data.meetings[k].projectId === id) delete LB.data.meetings[k]; }); save();
        return { page, made, old, dup, regs, dlg: [/Ana Ruiz/.test(before), /whole centre/.test(after), /Ana Ruiz/.test(after)], safety: [safeHeads.includes('People'), safety.attendees.map(x => x.n)] };
      });
      eq('MT19', 'a new Biology Alignment has no People section and nobody filled in', [r.page.includes('People'), r.page.includes('Round Table'), r.made], [false, true, 0]);
      eq('MT19', 'names an older one holds are not shown on the page, the list, the text or the PDF, and are not deleted', r.old, [false, false, false, false, false, 2]);
      eq('MT19', 'a duplicate has nobody', r.dup, 0);
      eq('MT19', 'it does not count when the regulars are learnt', r.regs, ['Ana Ruiz']);
      eq('MT19', 'the New meeting dialog follows the kind', r.dlg, [true, true, false]);
      eq('MT19', 'the Safety committee keeps its People and its regulars', r.safety, [true, ['Ana Ruiz']]);
      await E(a => mtgOpen(a.pj, a.mid), { pj, mid }); await p.waitForTimeout(250);
    }
    // hide Minutes: the toolbar and the editor go, the minutes stay
    await E(a => { var p = projById(a.pj); p.mtgLayout.secs.forEach(s => { if (s.k === 'notes') s.on = 0; }); mtgMap()[a.mid].html = '<div>Kept text</div>'; save(); renderEditor(); }, { pj, mid }); await p.waitForTimeout(300);
    eq('MT17', 'with Minutes hidden there is no toolbar and no editor, and the text is kept', await E(a => [!!document.querySelector('#pane-ed .jr-b'), !!document.querySelector('#pane-ed .jr-ed'), mtgMap()[a.mid].html], { mid }), [false, false, '<div>Kept text</div>']);
    // a new project from the New meeting dialog with the template: layout saved, kind chosen
    await E(() => { mtgOpen('', null); }); await p.waitForTimeout(250);
    await E(() => { mtgNewDialog(); }); await p.waitForSelector('#mtg-nd-p');
    await p.selectOption('#mtg-nd-p', '__new'); await p.fill('#mtg-nd-new', 'H&S committee'); await p.selectOption('#mtg-nd-lay', 'safety'); await p.waitForTimeout(100);
    eq('MT17', 'choosing the template in the dialog picks the Safety committee kind', await E(() => document.getElementById('mtg-nd-t').value), 'safety');
    await p.locator('#lb-dialog-card .btn', { hasText: /^Create$/ }).click(); await p.waitForTimeout(500);
    const np = await E(() => { var m = mtgCur(), p = projById(m.projectId); return { name: p.name, type: m.type, secs: (p.mtgLayout && p.mtgLayout.secs.filter(s => s.on).map(s => s.n)) || [], agenda: m.agenda.length }; });
    eq('MT17', 'a new project made with the template carries its layout; the first meeting is a Safety committee', [np.name, np.type, np.agenda, np.secs.includes('Inspection Notes'), np.secs.includes('Experiments discussed')], ['H&S committee', 'safety', 0, true, false]);
    eq('MT17', 'the Safety committee template is exactly Jon\'s five sections, no toolbar, every detail field', [await heads(), await E(() => !!document.querySelector('#pane-ed .jr-b')), await E(() => document.querySelectorAll('#pane-ed .mtg-f').length)], [['People', 'Inspection Notes', 'Lab Management Notes', 'Round Table', 'Action points'], false, 8]);
    // back to the default: nothing stored again
    await p.locator('#pane-ed .mtg-acts button', { hasText: 'Sections' }).click(); await p.waitForSelector('#lb-dialog.open .mtg-sd');
    await p.selectOption('#mtg-sd-pre', 'research'); await p.waitForTimeout(120); await p.locator('#lb-dialog-card .btn', { hasText: /^Save$/ }).click(); await p.waitForTimeout(350);
    eq('MT17', 'saving the research template stores nothing', await E(() => [mtgCur() && projById(mtgCur().projectId).mtgLayout === undefined, [...document.querySelectorAll('#pane-ed .mtg-sh .exp-sec-t')].length]), [true, 9]);
    await E(() => { Object.keys(LB.data.meetings).forEach(k => delete LB.data.meetings[k]); });
  }

  eq('MT11', 'no console errors', errs, []);
  await browser.close();
} finally { srv.kill(); }

console.log(findings.length ? findings.join('\n') : `✓ meetings invariants pass (${checks} checks)`);
process.exit(findings.length ? 1 : 0);
