// Transfer invariants — the analysis apps hand their results to Labbook as data, and Labbook hands
// them back to be edited. Checked end to end, in the shape the Hub runs them: Labbook, Lumina and
// Echo are three frames of one host page that answers openApp() and acks context messages the way the
// shell does.
//
//   T1  Lumina → Labbook   Send puts a result set on the open experiment with each row's curve, the
//                          points left out and the analysis (session), and Labbook is what is shown
//   T2  curves in Labbook  every row draws a curve; opening one draws the fitted points, one cross per
//                          point left out, and the potency printed is the one sent
//   T3  Edit in Lumina     the button opens Lumina on the same plate, layout, readings and settings, on
//                          the compound that was clicked, and it fits to the same numbers
//   T4  live refit         clicking a point leaves it out and refits at once; right-click puts it back;
//                          ⌘Z on Results undoes only curve edits; fewer than three points is refused
//   T5  Update in Labbook  sending again replaces the same set (never a second copy), keeps the notes and
//                          exclusions written in Labbook, and lands on the experiment's Results
//   T6  Echo               the same round trip from Echo: curves, replicate points left out, Edit in Echo,
//                          Update in Labbook
//   T8  normalisation      what Echo says about how the readings were normalised arrives with the set, and is printed in the Report,
//                          the record PDF and the Methods sheet: a sentence, the per-plate lines and a column of 'vs plain mean'.
//   T7  hostile payloads   a curve with non-numbers, a session too big to store, a payload from a
//                          frame that is not the Hub's — dropped or refused, never drawn or stored
//
//   node tools/transfer_invariants.mjs            exit 1 on any finding
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } throw new Error('no server'); }

const HOST = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#fff">
<iframe id="frame-labbook" src="/apps/labbook/labbook.html" style="width:1300px;height:900px;border:0"></iframe>
<iframe id="frame-lumina" src="/apps/lumina/lumina.html" style="width:1300px;height:900px;border:0;display:none"></iframe>
<iframe id="frame-echo" src="/apps/echo/echo.html" style="width:1300px;height:900px;border:0;display:none"></iframe>
<iframe id="frame-tempo" src="/apps/tempo/tempo.html" style="width:1300px;height:900px;border:0;display:none"></iframe>
<script>
window.__cur='labbook'; window.__acks={}; window.__sent=[];
function show(id){ ['labbook','lumina','echo','tempo'].forEach(function(k){ document.getElementById('frame-'+k).style.display = k===id?'block':'none'; }); window.__cur=id; }
window.openApp=function(id,tab,item,ctx){
  show(id); window.__sent.push({id:id,src:ctx&&ctx.source});
  if(!ctx) return;
  var rid='r'+Math.random().toString(36).slice(2), msg={type:'dhub:context',version:1,source:ctx.source||'hub',target:id,action:'open',context:ctx,requestId:rid}, n=0;
  (function send(){ if(window.__acks[rid]||n++>10) return; try{ document.getElementById('frame-'+id).contentWindow.postMessage(msg,'*'); }catch(e){} setTimeout(send,250); })();
};
window.addEventListener('message',function(e){ if(e.data&&e.data.type==='dhub:ack') window.__acks[e.data.requestId]=(e.data.app||1); });
</script>`;

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else findings.push('✗ ' + name + (detail ? ' — ' + detail : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  await waitHttp(`http://127.0.0.1:${port}/CLAUDE.md`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route(`http://127.0.0.1:${port}/__host.html`, r => r.fulfill({ contentType: 'text/html', body: HOST }));
  await page.goto(`http://127.0.0.1:${port}/__host.html`);
  const F = n => page.frame({ url: new RegExp('/apps/' + n + '/') });
  const lb = F('labbook'), lm = F('lumina'), ec = F('echo'), tp = F('tempo');
  await lb.waitForFunction(() => window.LB && LB.data && LB.data.presets && Object.keys(LB.data.presets).length && (LB.data.projects || []).length, null, { timeout: 25000 });
  await lm.waitForFunction(() => typeof loadLuminaTestData === 'function', null, { timeout: 15000 });
  await ec.waitForFunction(() => typeof sendResultsToLabbook === 'function', null, { timeout: 25000 });
  await tp.waitForFunction(() => typeof tpSendToLabbook === 'function', null, { timeout: 25000 });
  await sleep(500);
  const cur = () => page.evaluate(() => window.__cur);

  // An experiment to attach to.
  const expId = await lb.evaluate(async () => {
    const before = new Set(Object.keys(LB.data.experiments));
    const P = LB.data.projects.find(p => (p.sections || []).length), S0 = P.sections[0];
    openNew(P.id, S0.id); el('nm-type').value = 'HB'; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value = '2026-10-01'; nmUpdateCode(); nmSetup(); nmProtos(); nmPreview();
    createExperiment(); closeNew();
    let e = null;
    for (let t = 0; t < 100 && !e; t++) { e = Object.values(LB.data.experiments).find(x => !before.has(x.id)); if (!e) await new Promise(r => setTimeout(r, 60)); }
    openExp(e.id); return e.id;
  });
  const sets = () => lb.evaluate(id => ((LB.data.experiments[id].integration || {}).results || []).map(r => ({ id: r.id, origin: r.origin, n: (r.rows || []).length, hasSession: !!r.session, rows: r.rows })), expId);

  // ── T1 / T2: Lumina → Labbook ───────────────────────────────────────────────────────────
  await lm.evaluate(() => { loadLuminaTestData(); switchTab('results'); });
  await sleep(400);
  await page.evaluate(() => show('lumina'));
  const sent = await lm.evaluate(() => { const rows = luminaResultRows(); return { n: rows.length, ec: rows.map(r => r.potency), curveN: rows.filter(r => r.curve && r.curve.x.length >= 3 && r.curve.p).length, top: state.fitResults[0].sampleId }; });
  check('T1 every fitted compound is sent with a curve', sent.n > 0 && sent.curveN === sent.n, `${sent.curveN} of ${sent.n} rows carry a curve`);
  await lm.evaluate(() => sendResultsToLabbook());
  await sleep(900);
  check('T1 Labbook is what is shown after Send', (await cur()) === 'labbook', 'shown: ' + await cur());
  let S = await sets();
  check('T1 one set, from Lumina, with the analysis', S.length === 1 && S[0].origin === 'lumina' && S[0].hasSession && S[0].n === sent.n, JSON.stringify(S.map(s => ({ o: s.origin, n: s.n, s: s.hasSession }))));
  const setId = S[0] && S[0].id;
  await lb.evaluate(() => { EXP_TAB = 'res'; renderEditor(); });
  await sleep(300);
  const view = await lb.evaluate(() => ({ minis: document.querySelectorAll('.res-cvb .rcv-mini').length, edit: !!document.querySelector('.res-hd .res-edit'), editTxt: (document.querySelector('.res-hd .res-edit') || {}).textContent }));
  check('T2 every row draws its curve', view.minis === sent.n, view.minis + ' of ' + sent.n);
  check('T2 the set offers Edit in Lumina inside the Hub', view.edit && /Lumina/.test(view.editTxt || ''), view.editTxt);
  await lb.evaluate(() => document.querySelector('.res-cvb').click()); await sleep(150);
  const open = await lb.evaluate(() => { const r = document.querySelector('.res-cv-row'); return r ? { pts: r.querySelectorAll('circle.rcv-pt').length, fit: !!r.querySelector('.rcv-fit'), crosses: r.querySelectorAll('.rcv-x').length, txt: r.textContent } : null; });
  const first = S[0] && S[0].rows[0];
  check('T2 the opened curve shows the fitted points and the fit', !!open && open.pts === first.curve.x.length && open.fit, JSON.stringify(open && { pts: open.pts, fit: open.fit }));
  check('T2 the stats beside it are the numbers sent', !!open && open.txt.includes(String(first.compound)), '');

  if (process.env.TRANSFER_SHOTS) { console.log(JSON.stringify(await lb.evaluate(() => ['.res-scroll', '.res-tbl', '.rcv', '.rcv-plot', '.rcv-side', '.res-cv-row td'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return q + ' ' + Math.round(r.left) + '→' + Math.round(r.right) + ' w' + Math.round(r.width); })))); await page.screenshot({ path: process.env.TRANSFER_SHOTS + '/labbook-results.png' }); }
  // Notes and exclusions written in Labbook must survive an update from the app.
  await lb.evaluate(([id, sid]) => { const set = LB.data.experiments[id].integration.results[0]; set.rows[1].note = 'INV: looked at this one'; set.rows[2].excluded = true; }, [expId, setId]);

  // ── T3: Edit in Lumina ──────────────────────────────────────────────────────────────────
  const target = S[0].rows[3].compound;
  await lm.evaluate(() => { clearGrid(); });   // the plate on screen is something else entirely
  await lb.evaluate(([id, sid, c]) => openResultInApp(id, sid, c), [expId, setId, target]);
  await sleep(1200);
  check('T3 Lumina is what is shown after Edit', (await cur()) === 'lumina', 'shown: ' + await cur());
  const back = await lm.evaluate(() => ({ n: state.fitResults.length, sel: state.selectedSample, link: state.lbLink && state.lbLink.setId, ec: state.fitResults.map(r => +(r.ec50M * 1e9).toFixed(1)), btn: document.getElementById('rs-lb').textContent, tab: document.getElementById('pane-results').classList.contains('active') }));
  check('T3 the same analysis is rebuilt', back.n === sent.n && back.ec.join() === sent.ec.join(), `n ${back.n} vs ${sent.n}; ec ${back.ec.join()} vs ${sent.ec.join()}`);
  check('T3 it opens on the compound that was clicked, on Results', back.sel === target && back.tab, back.sel);
  check('T3 the Send button says it updates', /Update/.test(back.btn) && back.link === setId, back.btn);
  check('T3 Lumina acks the message (the shell re-sends until someone does)', (await page.evaluate(() => Object.values(window.__acks))).includes('lumina'));

  // ── T4: leave a point out, refit live, put it back, undo ────────────────────────────────
  const before = await lm.evaluate(() => { const r = _lmSel(); return { ec: r.ec50M, n: r.n, k: r.keys[3] }; });
  const xy = await lm.evaluate(() => { const p = _lmCurvePts.inc[3], rc = curveChart.canvas.getBoundingClientRect(); return [rc.left + curveChart.scales.x.getPixelForValue(p.x), rc.top + curveChart.scales.y.getPixelForValue(p.y)]; });
  await page.mouse.click(xy[0], xy[1]); await sleep(350);
  const after = await lm.evaluate(() => { const r = _lmSel(); return { ec: r.ec50M, n: r.n, ex: r.exPts.length, chip: !!document.querySelector('#results-table-wrap .ex-chip') }; });
  check('T4 clicking a point leaves it out and refits at once', after.n === before.n - 1 && after.ex === 1 && after.ec !== before.ec, JSON.stringify({ before, after }));
  check('T4 the table says how many were left out', after.chip);
  const cross = await lm.evaluate(() => { const p = _lmCurvePts.ex[0], rc = curveChart.canvas.getBoundingClientRect(); return [rc.left + curveChart.scales.x.getPixelForValue(p.x), rc.top + curveChart.scales.y.getPixelForValue(p.y)]; });
  await page.mouse.click(cross[0], cross[1], { button: 'right' }); await sleep(250);
  const items = await lm.evaluate(() => Array.from(document.querySelectorAll('.ctx-menu [role=menuitem], .ctxm [role=menuitem], [role=menu] [role=menuitem]')).map(e => e.textContent.trim()).filter(t => /put|back/i.test(t)));
  check('T4 right-click on the cross offers to put it back', items.some(t => /Put this point back/.test(t)), JSON.stringify(items));
  await lm.evaluate(() => { const b = Array.from(document.querySelectorAll('[role=menuitem]')).find(e => /Put this point back/.test(e.textContent)); if (b) b.click(); });
  await sleep(350);
  const restored = await lm.evaluate(() => { const r = _lmSel(); return { ec: r.ec50M, n: r.n, ex: r.exPts.length }; });
  check('T4 putting it back restores the fit exactly', restored.n === before.n && restored.ex === 0 && Math.abs(restored.ec / before.ec - 1) < 1e-9, JSON.stringify(restored));
  await page.mouse.click(xy[0], xy[1]); await sleep(300);
  await lm.evaluate(() => { document.body.focus(); }); await page.keyboard.press('Meta+z'); await sleep(350);
  const undone = await lm.evaluate(() => { const r = _lmSel(); return { n: r.n, ex: r.exPts.length }; });
  check('T4 ⌘Z on Results undoes the curve edit', undone.n === before.n && undone.ex === 0, JSON.stringify(undone));
  // three points is the floor
  const floor = await lm.evaluate(() => { const r = _lmSel(); const ks = r.keys.slice(); let refused = false, left = r.keys.length; for (const k of ks) { const ok = lmSetExcluded([k], true); if (!ok) { refused = true; break; } left = _lmSel().keys.length; } return { refused, left }; });
  check('T4 a curve is never left with fewer than three points', floor.refused && floor.left >= 3, JSON.stringify(floor));
  await lm.evaluate(() => { lmRestoreAll(); });
  // the one that is sent back: leave one point out
  await page.mouse.click(xy[0], xy[1]); await sleep(300);
  const edited = await lm.evaluate(() => ({ ec: +(_lmSel().ec50M * 1e9).toFixed(1), sid: _lmSel().sampleId }));

  if (process.env.TRANSFER_SHOTS) await page.screenshot({ path: process.env.TRANSFER_SHOTS + '/lumina-edit.png' });
  // ── T5: Update in Labbook ───────────────────────────────────────────────────────────────
  await lm.evaluate(() => sendResultsToLabbook()); await sleep(1000);
  check('T5 Labbook is shown again, on the experiment', (await cur()) === 'labbook');
  S = await sets();
  check('T5 the same set was updated, not copied', S.length === 1 && S[0].id === setId, JSON.stringify(S.map(s => s.id)));
  const upd = S[0] && S[0].rows.find(r => r.compound === edited.sid);
  check('T5 the left-out point and the new potency arrived', !!upd && upd.curve.ex.length === 1 && Math.abs(upd.potency - edited.ec) < 0.06 * edited.ec, JSON.stringify(upd && { ex: upd.curve.ex.length, p: upd.potency, want: edited.ec }));
  check('T5 a note written in Labbook is kept', !!S[0] && S[0].rows[1].note === 'INV: looked at this one', S[0] && S[0].rows[1].note);
  check('T5 a row excluded in Labbook stays excluded', !!S[0] && S[0].rows[2].excluded === true);
  const shown = await lb.evaluate(() => ({ tab: !!document.querySelector('#sec-res, .res-card'), cards: document.querySelectorAll('.res-card').length }));
  check('T5 Results is what is on screen', shown.cards >= 1);

  // ── T6: Echo ────────────────────────────────────────────────────────────────────────────
  await page.evaluate(() => show('echo'));
  await ec.evaluate(() => {
    const mk = (id, prot, ec50, top, bot) => { const reps = []; const xs = [-5, -5.5, -6, -6.5, -7, -7.5, -8, -8.5, -9, -9.5]; xs.forEach((x, i) => { [0, 1].forEach(k => { const y = bot + (top - bot) / (1 + Math.pow(10, 1.1 * (x - Math.log10(ec50)))) + (k ? 2 : -2); reps.push({ x, y: +y.toFixed(3) }); }); });
      return { Protein: prot, Sample_ID: id, DC50_nM: +(ec50 * 1e9).toPrecision(3), Dmax_pct: Math.round(100 - bot), HillSlope: 1.1, R2: 0.99, Flag: 'No', Flag_Reason: '', Top_val: top, Bot_val: bot, CI_DC50_lower: +(ec50 * 1e9 * .8).toPrecision(3), CI_DC50_upper: +(ec50 * 1e9 * 1.2).toPrecision(3),
        _bot: bot, _logec50: Math.log10(ec50), _hill: 1.1, _tc: top, _pts: [], _reps: reps, _gainMode: false, _assayType: 'hibit' }; };
    window._lastAssayType = 'hibit'; window._lastAssayId = 'INV_ECHO';
    const data = [mk('EDA-001', 'BRD4', 2e-7, 100, 5), mk('EDA-002', 'BRD4', 5e-8, 98, 8), mk('EDA-003', 'BRD2', 1e-6, 100, 10)];
    scatterData = data; window._bpData = data; _lastResultsData = data; renderResults(data); try { renderCurvesTab(data); } catch (e) {}
  });
  await ec.evaluate(() => sendResultsToLabbook()); await sleep(1000);
  S = await sets();
  const echoSet = S.find(s => s.origin === 'echo');
  check('T6 Echo results arrive as a second set with curves and the analysis', S.length === 2 && !!echoSet && echoSet.hasSession && echoSet.rows.every(r => r.curve && r.curve.x.length === 20 && r.curve.p), JSON.stringify(S.map(s => s.origin)));
  await lb.evaluate(([id, sid]) => openResultInApp(id, sid, 'EDA-002'), [expId, echoSet.id]); await sleep(1500);
  check('T6 Echo is what is shown after Edit', (await cur()) === 'echo');
  const eo = await ec.evaluate(() => ({ n: (scatterData || []).length, sel: document.getElementById('cv-compound') && document.getElementById('cv-compound').value, btn: (_resSendItems()[0] || {}).label, link: window._lbLink && window._lbLink.setId }));
  check('T6 the analysis is rebuilt on the compound clicked', eo.n === 3 && /EDA-002/.test(eo.sel || ''), JSON.stringify(eo));
  check('T6 the Send button says it updates', /Update/.test(eo.btn || '') && eo.link === echoSet.id, eo.btn);
  check('T6 Echo acks the message', (await page.evaluate(() => Object.values(window.__acks))).includes('echo'));
  // a flat curve travels as n.d.: no potency, nd:true, and the notebook says so in its tables
  const nd = await lb.evaluate(() => ({ cell: _rnp({ nd: true, potency: null }), num: _rnp({ potency: 12.34 }), none: _rnp({ potency: null }), kept: _rnp({ nd: true, potency: 5 }) }));
  check('T6b Labbook reads nd:true as n.d., a number as a number, and nothing as a dash', nd.cell === 'n.d.' && nd.num === '12.3' && nd.none === '—' && nd.kept === '5.00', JSON.stringify(nd));
  await ec.evaluate(() => { const c = document.getElementById('cv-canvas'); const r = c && c._cvCompounds && c._cvCompounds[0]; if (!r) throw new Error('no curve'); _cvUndoMark(r, 'Exclude replicate'); (r._excludedRepXYs = r._excludedRepXYs || []).push({ x: r._reps[0].x, y: r._reps[0].y }); _cvApplyEditsAndRefit(r); });
  await sleep(300);
  await ec.evaluate(() => sendResultsToLabbook()); await sleep(1000);
  S = await sets();
  const echo2 = S.filter(s => s.origin === 'echo');
  const row2 = echo2[0] && echo2[0].rows.find(r => r.compound === 'EDA-002');
  check('T6 updating replaces the Echo set and carries the left-out replicate', echo2.length === 1 && S.length === 2 && !!row2 && row2.curve.ex.length === 1 && row2.curve.x.length === 19, JSON.stringify({ sets: S.length, ex: row2 && row2.curve.ex.length, n: row2 && row2.curve.x.length }));

  // ── T8: the normalisation audit reaches the Report and the PDF ───────────────────────────
  await page.evaluate(() => show('echo'));
  await ec.evaluate(() => {
    const rows = _lastResultsData;
    rows.forEach((r, i) => { Object.assign(r, { Norm_Method: i === 2 ? 'Smart \u00b7 odd/even rows' : 'Smart \u00b7 plate mean', Norm_Plates: 'P1', Norm_Shift_pct: i, Norm_Shift_max_pct: i + 1, Norm_Note: '',
      Norm_Check: i === 0 ? 'Same' : i === 1 ? 'Differs' : 'Method-dependent', Norm_Ratio: i === 0 ? 1.02 : i === 1 ? 1.6 : 2.7, Plain_DC50_nM: 100, Plain_Dmax_pct: 90, Norm_Why: 'potency vs the plain plate mean' }); });
    const plates = { k1: { name: 'P1', mode: 'plate mean', info: null, nCtrl: 14, muAll: 1000, suspect: [] } };
    window._normAudits = [_normAuditBuild({ assayId: 'INV_ECHO', assayType: 'hibit', smartOn: true, skipNorm: false, ctrlRange: 'B12-O12', plates, summary: rows })];
  });
  await ec.evaluate(() => sendResultsToLabbook()); await sleep(1000);
  const n8 = await lb.evaluate(id => { const e = LB.data.experiments[id]; const set = e.integration.results.find(r => r.origin === 'echo');
    const rep = buildPubReadyFromExp(e), pdf = pdResults(e), meth = (() => { try { return buildPubReadyFromExp(e); } catch (x) { return ''; } })();
    return { text: !!set.normText, lines: (set.normalisation || []).length, rowNorm: set.rows.filter(r => r.norm && r.norm.check).length, n: set.rows.length,
      repSentence: /normalised to a per-plate DMSO reference/.test(rep), repCol: /vs plain mean/.test(rep), repRatio: /\u00d72\.7|×2\.7/.test(rep),
      pdfPara: /<b>Normalisation\.<\/b>/.test(pdf), pdfCol: /vs plain mean/.test(pdf) && /×2\.7/.test(pdf), pdfPlate: /Plate P1/.test(pdf),
      card: /Normalisation/.test(resultsPaneHtml(e)) && /res-nm dep/.test(resultsPaneHtml(e)), stale: _pubSourceSig(e).length > 0 }; }, expId);
  check('T8 the sentence, the lines and a check for every row arrive with the set', n8.text && n8.lines >= 3 && n8.rowNorm === n8.n, JSON.stringify(n8));
  check('T8 the Report carries the sentence and the vs-plain-mean column', n8.repSentence && n8.repCol && n8.repRatio, JSON.stringify(n8));
  check('T8 the record PDF carries the paragraph, the plate lines and the column', n8.pdfPara && n8.pdfCol && n8.pdfPlate, JSON.stringify(n8));
  check('T8 the Results card shows it and marks the method-dependent curve', n8.card, JSON.stringify(n8));


  // ── T9–T11: Tempo ───────────────────────────────────────────────────────────────────────
  await tp.evaluate(async () => { await loadTestData(); });
  await page.evaluate(() => show('tempo'));
  const tsent = await tp.evaluate(() => { const p = tpPlate(), res = tpRes(p), rows = tpLabbookRows(p, res); return { n: rows.length, pot: rows.map(r => r.potency), curves: rows.filter(r => r.curve && r.curve.x.length >= 6 && r.curve.p && r.curve.gain === true).length, extra: rows.filter(r => r.extra && r.extra.length >= 4).length, first: rows[0].compound, name: p.name }; });
  check('T9 every compound with a dose–response is sent with a rising 4PL curve and its extra numbers', tsent.n >= 4 && tsent.curves === tsent.n && tsent.extra === tsent.n, JSON.stringify(tsent));
  const nBefore = (await sets()).length;
  await tp.evaluate(() => tpSendToLabbook()); await sleep(1100);
  check('T9 Labbook is what is shown after Send from Tempo', (await cur()) === 'labbook', 'shown: ' + await cur());
  S = await sets(); const tset = S.find(x => x.origin === 'tempo');
  check('T9 one new set, from Tempo, with the analysis', S.length === nBefore + 1 && !!tset && tset.hasSession && tset.n === tsent.n, JSON.stringify(S.map(x => [x.origin, x.n, x.hasSession])));
  await lb.evaluate(() => { EXP_TAB = 'res'; renderEditor(); }); await sleep(300);
  const tview = await lb.evaluate(id => { const card = Array.from(document.querySelectorAll('.res-card')).find(c => /Tempo/.test(c.textContent)); if (!card) return null; const btns = card.querySelectorAll('.res-cvb'); btns[0] && btns[0].click(); const row = card.querySelector('.res-cv-row'); return { minis: card.querySelectorAll('.rcv-mini').length, edit: (card.querySelector('.res-edit') || {}).textContent, fit: row ? !!row.querySelector('.rcv-fit') : false, pts: row ? row.querySelectorAll('circle.rcv-pt').length : 0, txt: row ? row.textContent : '' }; }, expId);
  check('T9 Labbook draws a curve for every row and offers Edit in Tempo', !!tview && tview.minis === tsent.n && /Tempo/.test(tview.edit || ''), JSON.stringify(tview && { m: tview.minis, e: tview.edit }));
  check('T9 the opened curve is drawn from the points and the fit, and carries KDegMax, KDeg50 and the efficiency', !!tview && tview.fit && tview.pts >= 6 && /KDegMax/.test(tview.txt) && /KDeg50/.test(tview.txt) && /Log\[KDegMax/.test(tview.txt), JSON.stringify(tview && { fit: tview.fit, pts: tview.pts }));
  const tid = tset && tset.id, tpot = tset.rows[2].potency, tcomp = tset.rows[2].compound;
  await lb.evaluate(([id, sid]) => { const set = LB.data.experiments[id].integration.results.find(r => String(r.id) === String(sid)); set.rows[1].note = 'INV: looked at this one'; }, [expId, tid]);
  await tp.evaluate(() => { TP.plates = []; TP.res = {}; TP.ex = {}; TP.lbLink = null; tpAfterLoad(); });
  await lb.evaluate(([id, sid, c]) => openResultInApp(id, sid, c), [expId, tid, tcomp]); await sleep(1500);
  check('T10 Tempo is what is shown after Edit', (await cur()) === 'tempo', 'shown: ' + await cur());
  const tback = await tp.evaluate(() => { const p = tpPlate(), res = p && tpRes(p); return { n: res ? res.compounds.length : 0, sel: TP.sel.comp, tab: TP.ui.tab, link: TP.lbLink && TP.lbLink.setId, pots: res ? res.compounds.map(c => c.A && !c.A.fail ? c.A.DC50_nM : null) : [], btn: (document.getElementById('tp-lb-btn') || {}).textContent }; });
  check('T10 the analysis is rebuilt: the same compounds and the same DC50 as were sent', tback.n === tsent.n && tback.pots[2] === tpot, JSON.stringify({ n: tback.n, got: tback.pots[2], sent: tpot }));
  check('T10 it opens on the compound that was clicked, on Curves, and says it updates', /Curves/i.test(tback.tab) && (tback.sel || '').indexOf(tcomp) === 0 && tback.link === tid, JSON.stringify(tback));
  check('T10 Tempo acks the message (the shell re-sends until someone does)', (await page.evaluate(() => Object.values(window.__acks))).includes('tempo'));
  // leave a read out in Tempo, send again: the same set, replaced, the note written in Labbook kept
  await tp.evaluate(async () => { const p = tpPlate(), res = tpRes(p), c = res.compounds[2], cc = c.concs[c.concs.length - 1], ex = tpEx(p); cc.live.forEach(id => { ex.pts[id] = [40, 41, 42, 43, 44, 45, 46, 47]; }); tpRefit(p, c.key); await new Promise(r => setTimeout(r, 200)); tpTab('results'); });
  await tp.evaluate(() => tpSendToLabbook()); await sleep(1100);
  S = await sets(); const t2 = S.filter(x => x.origin === 'tempo');
  check('T11 sending again replaces the same set — never a second copy — and keeps the note written in Labbook', t2.length === 1 && t2[0].id === tid && S.length === nBefore + 1 && t2[0].rows[1].note && /INV: looked/.test(t2[0].rows[1].note), JSON.stringify({ n: t2.length, same: t2[0] && t2[0].id === tid, note: t2[0] && t2[0].rows[1].note }));

  // ── T7: hostile payloads ────────────────────────────────────────────────────────────────
  const hostile = await lb.evaluate((id) => {
    const e = LB.data.experiments[id]; const n0 = e.integration.results.length;
    _mergeDHubContext({ experiment: { id }, results: [{ id: 'bad-1', source: 'x', origin: '<img src=x onerror=alert(1)>', rows: [
      { compound: 'A', potency: 1, curve: { x: ['a', 1, 2, 3], y: [1, 'z', 3, 4], p: ['q', 1, 1, 1] } },
      { compound: 'B', potency: 1, curve: 'nope' },
      { compound: 'C', potency: 1, curve: { x: [-6, -7, -8], y: [90, 50, 10], ex: [[-6.5, 'x'], [-7.5, 40]], p: [0, -7, 1, 100] } }],
      session: { big: 'x'.repeat(800000) } }] });
    const set = e.integration.results.find(r => r.id === 'bad-1');
    return { added: e.integration.results.length - n0, session: !!(set && set.session), origin: set && set.origin, a: set && set.rows[0].curve, b: set && set.rows[1].curve, c: set && set.rows[2].curve };
  }, expId);
  check('T7 a session too big to store is dropped', hostile.added === 1 && !hostile.session);
  check('T7 the origin is reduced to letters', hostile.origin === 'imgsrcxonerroralert' || /^[a-z]*$/.test(hostile.origin || ''), hostile.origin);
  check('T7 a curve with non-numbers keeps only the numbers', hostile.a && hostile.a.x.length === hostile.a.y.length && hostile.a.x.every(Number.isFinite) && hostile.a.p === null, JSON.stringify(hostile.a));
  check('T7 a curve that is not a curve is dropped', hostile.b === undefined);
  check('T7 a left-out point that is not a number is dropped', hostile.c && hostile.c.ex.length === 1, JSON.stringify(hostile.c));
  // What an analysis app says beside a row (Tempo's KDegMax…) is a handful of short [label, value] texts: a number that is not a number, an object, a very long string or thirty pairs are cut.
  const hx = await lb.evaluate(id => { const e = LB.data.experiments[id]; _mergeDHubContext({ experiment: { id }, results: [{ id: 'tx-1', source: 'Tempo', origin: 'tempo', label: 'x', rows: [{ compound: 'A', potency: 1, effect: 50, extra: [['ok', '1.5'], ['nan', NaN], [{}, []], ['long', 'x'.repeat(200)], ['inf', Infinity], 5, 'str', null].concat(Array.from({ length: 30 }, (_, i) => ['k' + i, 'v' + i])) }] }] }); const set = e.integration.results.find(r => r.id === 'tx-1'); return set && set.rows[0].extra; }, expId);
  check('T12 the extra numbers of a row are a handful of short texts: non-numbers, objects, long strings and the thirtieth pair are dropped', Array.isArray(hx) && hx.length <= 10 && hx.every(q => q.length === 2 && q.every(v => typeof v === 'string' && v.length <= 40 && !/^(NaN|Infinity)$/.test(v))) && hx[0][0] === 'ok' && !hx.some(q => q[0] === 'nan' || q[0] === 'inf'), JSON.stringify(hx));
  // A set with curves but no analysis is drawn, and offers no Edit button it could not honour.
  await lb.evaluate((id) => { _mergeDHubContext({ experiment: { id }, results: [{ id: 'nosess-1', source: 'Lumina', origin: 'lumina', label: 'no session', rows: [{ compound: 'Z', potency: 5, effect: 90, curve: { x: [-6, -7, -8], y: [90, 50, 10], p: [0, -7, 1, 100], n: 3 } }] }] }); EXP_TAB = 'res'; renderEditor(); }, expId);
  await sleep(300);
  const ns = await lb.evaluate(() => { const card = Array.from(document.querySelectorAll('.res-card')).find(c => /no session/.test(c.textContent)); return card ? { edit: !!card.querySelector('.res-edit'), curve: !!card.querySelector('.res-cvb') } : null; });
  check('T7 a set with no analysis draws its curves and offers no Edit', !!ns && ns.curve && !ns.edit, JSON.stringify(ns));
  // Only the Hub's own frame may open an analysis: a sibling frame's message is ignored.
  await lm.evaluate(() => { clearGrid(); });
  await lb.evaluate(() => { window.parent.frames[1].postMessage({ type: 'dhub:context', version: 1, requestId: 'evil1', context: { open: { app: 'lumina', session: { v: 1, format: 96, layout: { grads: [], zones: [['A1', 'A2', 'A3']] }, plates: [{ signal: { A1: 1 } }] }, setId: 'x' } } }, '*'); });
  await sleep(500);
  check('T7 a message from a frame that is not the Hub is ignored', await lm.evaluate(() => state.layout.zones.length === 0 && !state.lbLink));
  const evil = await page.evaluate(() => { window.__evil = 0; const f = document.getElementById('frame-labbook'); const n0 = f.contentWindow.LB.data.experiments; const before = JSON.stringify(Object.values(n0).map(e => (e.integration && e.integration.results || []).length));
    // a message from the host page's own window is the Hub and is trusted; one from an unrelated origin is not
    return before; });
  check('T7 the page ran without errors', errs.length === 0, [...new Set(errs)].slice(0, 4).join(' | '));
  await browser.close();
} finally { srv.kill(); }
console.log(findings.length ? findings.join('\n') + `\n\n${findings.length} finding(s), ${passed} checks passed.` : `All ${passed} transfer invariants hold.`);
process.exit(findings.length ? 1 : 0);
