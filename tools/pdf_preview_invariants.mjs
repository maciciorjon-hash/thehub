// PDF preview invariants — the page shown before an export is the page the export prints.
//
// The Export PDF dialog used to pour the print document into one tall frame: no margins (the text touched the
// edge), a width the printer never lays out at, none of the app's own stylesheet, no page edges, no running
// footer. It looked unfinished and it disagreed with the file it announced. The preview (`_pgvMount`) now lays the
// document out the way the printer does and shows it as sheets. This drives labbook.html itself and compares it with
// a real PDF made by Chromium's own printer from the very same document (`buildPrintDoc` → hydrate → `_printKeep`,
// the path `exportPDF` takes), page by page.
//
//   PV1 pages    the preview counts the pages the printer makes, for an experiment, a project (cover + one page break per
//                experiment), a Journal day and a landscape sheet (the week planner)
//   PV2 breaks   every page starts and ends on the same words in the preview and in the PDF, and the words of a page
//                are the words of that page (a break that falls one line off is a finding)
//   PV3 paper    the sheet is the @page size with its margins; the footer reads "Page n of m" with m = the pages; the
//                text never touches the paper's edge
//   PV4 fit      in the dialog at 1280 and at 390 the whole stage is inside the dialog, "Page" fits one whole sheet inside the
//                stage, "Width" never enlarges past the paper, and the dialog does not grow a scrollbar of its own
//   PV5 live     a box ticked off changes the preview (and only after the layout is done), the dark theme keeps white paper,
//                and a late layout from an older render never replaces a newer one
//   PV6 media    the app's own @media print rules are read as always and its @media screen rules as never
//
//   node tools/pdf_preview_invariants.mjs      exit 1 on any finding
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const waitHttp = async u => { for (let i = 0; i < 60; i++) { try { if ((await fetch(u)).ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 250)); } throw new Error('server did not start'); };
const findings = []; let checks = 0;
const bad = (inv, msg) => findings.push(`✗ ${inv} — ${msg}`);
const eq = (inv, what, got, want) => { checks++; if (JSON.stringify(got) !== JSON.stringify(want)) bad(inv, `${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); };
const yes = (inv, what, v) => { checks++; if (!v) bad(inv, what); };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pvinv-'));
const PY = `
import sys, json, fitz
d = fitz.open(sys.argv[1]); out = []
for p in d:
    foot = p.rect.height - float(sys.argv[2]) * 72 / 25.4
    out.append({'w': [w[4] for w in p.get_text('words') if w[1] < foot], 'foot': p.get_text('text', clip=fitz.Rect(0, foot, p.rect.width, p.rect.height)).split(), 'size': [round(p.rect.width / 72 * 25.4), round(p.rect.height / 72 * 25.4)]})
print(json.dumps(out))
`;
const norm = ws => ws.map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);

const SEED = `(function(){
  function d(off){ var x=new Date(); x.setHours(12,0,0,0); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); }
  var p=LB.data.projects[1], s=p.sections[0]; var out={project:p.id,section:s.id};
  function mk(type,title,off){ selectNode('expsec',p.id,s.id); openNew(); el('nm-type').value=type; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value=d(off); el('nm-title').value=title; nmUpdateCode(); nmPreview(); NM_PLATE=true; createExperiment(); return SEL.page; }
  out.bio=mk('NB_BIO_RTX96','BET biosensor run',-2);
  out.screen=mk('NB_SPARK_SCREEN96','SPARK screen',0);
  out.wb=mk('WB','Western blot of BRD4',-3);
  var e=LB.data.experiments[out.bio]; e.aim='Does compound X engage BRD4 BD1 in cells?'; e.blocks[0].done=true; e.blocks[0].completedAt=Date.now(); e.blocks[1].done=true; e.blocks[1].completedAt=Date.now();
  e.html='<p>Cells looked healthy at seeding. Plate 1 slightly bubbly in row H.</p>';
  e.results=[{compound:'EDA-099',target:'BRD4 BD1',potency:12.4,effect:88,hill:1.1,r2:0.99,label:'IC50'},{compound:'EDA-100',target:'BRD4 BD1',potency:230,effect:70,hill:0.9,r2:0.97,label:'IC50',flag:'shallow'}];
  save(); out.today=d(0); return out;
})()`;

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
try {
  await waitHttp(base + '/');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('lb_backup_nudged', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(base + '/' + (process.env.PV_FILE || 'apps/labbook/labbook.html')); await page.waitForTimeout(700);
  await page.evaluate(`try{localStorage.clear();localStorage.setItem('lb_backup_nudged','1');localStorage.setItem('lb_tour_done','1')}catch(e){}`);
  await page.reload(); await page.waitForTimeout(700);
  const ids = await page.evaluate(SEED);
  const E = fn => page.evaluate(fn);

  // The words of the document, page by page, as the preview lays it out: the same srcdoc a sheet gets, unshifted, so column n is page n.
  const WORDS = `(async function(host){
    var S=host._pgv, f=document.createElement('iframe'); f.style.cssText='position:fixed;left:-30000px;top:0;border:0;width:'+S.g.cw+'px;height:'+S.g.ch+'px';
    document.body.appendChild(f); await new Promise(function(r){ f.onload=r; f.srcdoc=_pgvDoc(S.inner,S.g,0); });
    var d=f.contentDocument, out=[]; for(var i=0;i<S.pages;i++) out.push([]);
    var tw=d.createTreeWalker(d.getElementById('print-root'),NodeFilter.SHOW_TEXT), n;
    while((n=tw.nextNode())){ var pe=n.parentElement; if(!pe||/^(STYLE|SCRIPT)$/.test(pe.tagName)) continue;
      var re=/\\S+/g, m; while((m=re.exec(n.nodeValue))){ var r=d.createRange(); r.setStart(n,m.index); r.setEnd(n,m.index+m[0].length); var b=r.getClientRects()[0]; if(!b||!b.width) continue;
        var c=Math.floor(b.left/S.g.cw+0.001); if(c>=0&&c<S.pages) out[c].push(m[0]); } }
    f.remove(); return out; })`;

  // One fixture: the preview and the printer, side by side.
  async function compare(tag, buildJs, geomWant) {
    const html = await page.evaluate(buildJs);   // the document string, built once
    await page.evaluate(`window.__doc=${JSON.stringify(html)}`);
    await page.evaluate(() => { var h = document.getElementById('pv-host'); if (h) h.remove(); h = document.createElement('div'); h.id = 'pv-host'; h.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:600px;z-index:99999'; document.body.appendChild(h); });
    await page.evaluate(`_pgvMount(document.getElementById('pv-host'), window.__doc)`);
    await page.waitForFunction(`(function(){ var h=document.getElementById('pv-host'); return h&&h._pgv&&h._pgv.pages>0&&!h.classList.contains('pgv-busy'); })()`, null, { timeout: 30000 });
    const pv = await page.evaluate(`(async function(){ var h=document.getElementById('pv-host'), S=h._pgv; return {pages:S.pages, g:{W:S.g.W,H:S.g.H,mt:S.g.mt,mb:S.g.mb,ml:S.g.ml,mr:S.g.mr}, words:await (${WORDS})(h), foot:[].map.call(h.querySelectorAll('.pgv-pg'),function(p){ return [].map.call(p.querySelectorAll('.pgv-mb'),function(m){ return m.textContent; }); })}; })()`);
    // The real thing: the same string into #print-root, the export's own preparation, Chromium's printer.
    await page.evaluate(`(async function(){ var pr=el('print-root'); pr.innerHTML=window.__doc; await Promise.all([hydrateAtt(pr),printFloatLayers(pr)]); _printKeep(pr); })()`);
    await page.emulateMedia({ media: 'print' });
    const file = path.join(tmp, tag + '.pdf');
    await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(`el('print-root').innerHTML=''`);
    const real = JSON.parse(execFileSync('python3', ['-I', '-c', PY, file, String(pv.g.mb)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
    // PV1
    eq('PV1', `${tag}: pages`, pv.pages, real.length);
    // PV3 paper + footer
    eq('PV3', `${tag}: sheet size`, [pv.g.W, pv.g.H], real[0].size);
    if (geomWant) eq('PV3', `${tag}: margins`, [pv.g.mt, pv.g.mr, pv.g.mb, pv.g.ml], geomWant);
    // PV2 per page
    for (let i = 0; i < Math.min(pv.pages, real.length); i++) {
      // List numbers are generated content (text in the PDF, not in the DOM) and "Opti-MEM" is one word in one and two in the other:
      // a page is its letters, with the one- and two-digit tokens left out, in any reading order (the PDF's extraction order is not the paint order, so how a page ends is read from its letters, not from its last word: a break one line off changes the letters).
      const a = norm(pv.words[i]).filter(w => !/^\d{1,2}$/.test(w)).join(''), b = norm(real[i].w).filter(w => !/^\d{1,2}$/.test(w)).join('');
      { const sa = [...a].sort().join(''), sb = [...b].sort().join(''); let k = 0; while (k < sa.length && sa[k] === sb[k]) k++;
        yes('PV2', `${tag} p${i + 1}: the page holds other text in the preview than in the PDF (${a.length} letters against ${b.length}, first difference at the sorted letter ${k})`, sa === sb); }
      if (process.env.PVDEBUG && a.length !== b.length) console.log(`  [${tag} p${i + 1}] preview ends …${a.slice(-60)}\n  [${tag} p${i + 1}] pdf ends     …${b.slice(-60)}`);
      // the footer the printer prints is the footer the sheet draws
      const pf = pv.foot[i].join(' ').replace(/\s+/g, ' ').trim(), rf = real[i].foot.join(' ').replace(/\s+/g, ' ').trim();
      eq('PV3', `${tag} p${i + 1}: running footer`, pf.split(' ').sort().join(' '), rf.split(' ').sort().join(' '));
    }
    return pv;
  }

  const bulk = (kind, extra) => `(function(){ var o=pdfOpts(); return buildPrintDoc(o,Object.assign({kind:'${kind}'},${extra||'{}'}),{}); })()`;
  await compare('exp', `(function(){ var o=pdfOpts(); return buildPrintDoc(o,{kind:'exp',id:'${ids.bio}'},{}); })()`, [16, 15, 17, 15]);
  await compare('exp-screen', `(function(){ var o=pdfOpts(); return buildPrintDoc(o,{kind:'exp',id:'${ids.screen}'},{}); })()`, [16, 15, 17, 15]);
  await compare('project', bulk('project', `{id:'${ids.project}'}`), [16, 15, 17, 15]);
  await compare('day', `(function(){ var o=pdfOpts(); return buildPrintDoc(o,{kind:'day',date:'${ids.today}'},{}); })()`, [16, 15, 17, 15]);
  // More experiments than the old preview showed (it stopped at four and said so): every one is laid out, and the page count is the print's.
  await page.evaluate(`(function(){ function d(off){ var x=new Date(); x.setHours(12,0,0,0); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); }
    var p=LB.data.projects[1], s=p.sections[0], types=['NB_BIO_RTX96','NB_SPARK_SCREEN96','WB'];
    for(var i=0;i<7;i++){ selectNode('expsec',p.id,s.id); openNew(); el('nm-type').value=types[i%3]; nmUpdateCode(); nmResetSetup(); nmProtos(); el('nm-date').value=d(-i); el('nm-title').value='Bulk '+i; nmUpdateCode(); nmPreview(); NM_PLATE=true; createExperiment(); } save(); })()`);
  const big = await compare('project-10', bulk('project', `{id:'${ids.project}'}`), [16, 15, 17, 15]);
  yes('PV1', `a project of ten experiments is shown whole (${big.pages} pages)`, big.pages >= 20);
  const capTxt = await page.evaluate(`_pdfxCapText({kind:'project',id:'${ids.project}'})`);
  yes('PV1', `the dialog no longer says the preview shows only some of them ("${capTxt}")`, !/preview shows/i.test(capTxt));
  // A landscape sheet with its own margins: the week planner.
  const wk = await compare('week', `buildWeekPrintDoc()`, [12, 12, 12, 12]);
  yes('PV3', 'the week planner is a landscape sheet', wk.g.W > wk.g.H);

  // PV3 / PV4 in the dialog itself
  for (const [w, h] of [[1280, 800], [390, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(`openExp('${ids.bio}'); openPdfExport()`);
    await page.waitForFunction(`(function(){ var h=document.getElementById('pdfx-prev'); return h&&h._pgv&&h._pgv.pages>0&&!h.classList.contains('pgv-busy'); })()`, null, { timeout: 30000 });
    await page.waitForTimeout(400);
    const m = await page.evaluate(`(function(){
      var card=document.getElementById('lb-dialog-card'), host=document.getElementById('pdfx-prev'), st=host.querySelector('.pgv-stage'), cr=card.getBoundingClientRect(), sr=st.getBoundingClientRect();
      var pg=host.querySelector('.pgv-pg'), pr=pg.getBoundingClientRect(), win=host.querySelector('.pgv-win'), wr=win.getBoundingClientRect();
      var o={vw:innerWidth, vh:innerHeight, card:[cr.left,cr.top,cr.right,cr.bottom], stage:[sr.left,sr.top,sr.right,sr.bottom], cardScroll:card.scrollHeight-card.clientHeight, cardScrollX:card.scrollWidth-card.clientWidth,
        sheet:[pr.width,pr.height], win:[wr.left-pr.left,wr.top-pr.top,pr.right-wr.right], z:host._pgv.z, zoom:host._pgv.zoom, stageClient:[st.clientWidth,st.clientHeight]};
      return o; })()`);
    const tag = `dialog ${w}`;
    yes('PV4', `${tag}: the dialog is inside the window (${m.card.map(Math.round)} in ${m.vw}×${m.vh})`, m.card[0] >= -1 && m.card[2] <= m.vw + 1 && m.card[1] >= -1 && m.card[3] <= m.vh + 1);
    yes('PV4', `${tag}: the stage is inside the dialog`, m.stage[0] >= m.card[0] - 1 && m.stage[2] <= m.card[2] + 1 && m.stage[3] <= m.card[3] + 1);
    yes('PV4', `${tag}: the dialog grew a scrollbar of its own (${m.cardScroll}px, ${m.cardScrollX}px across)`, m.cardScroll <= 1 && m.cardScrollX <= 1);
    yes('PV4', `${tag}: "Width" enlarged the paper (z ${m.z})`, m.z <= 1.0001);
    yes('PV3', `${tag}: the text sits ${m.win[0].toFixed(1)}px in from the paper's left edge, ${m.win[2].toFixed(1)}px from the right, ${m.win[1].toFixed(1)}px from the top`, m.win[0] > 20 * m.z && m.win[2] > 20 * m.z && m.win[1] > 20 * m.z);
    // Page: one whole sheet inside the stage
    await page.evaluate(`document.querySelector('#pdfx-prev [data-a=page]').click()`); await page.waitForTimeout(250);
    const f = await page.evaluate(`(function(){ var host=document.getElementById('pdfx-prev'), st=host.querySelector('.pgv-stage'), pg=host.querySelector('.pgv-pg').getBoundingClientRect(), sr=st.getBoundingClientRect(), cs=getComputedStyle(st);
      return {fitsH:pg.height<=st.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)+1, fitsW:pg.width<=st.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)+1, z:host._pgv.z, sheetH:pg.height, stageH:st.clientHeight}; })()`);
    yes('PV4', `${tag}: "Page" shows a whole sheet (sheet ${Math.round(f.sheetH)}px in a stage ${f.stageH}px, z ${f.z.toFixed(2)})`, f.fitsH && f.fitsW);
    await page.evaluate(`_lbDlgClose()`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  // PV5 live
  await page.evaluate(`openExp('${ids.bio}'); openPdfExport()`);
  await page.waitForFunction(`(function(){ var h=document.getElementById('pdfx-prev'); return h&&h._pgv&&h._pgv.pages>0&&!h.classList.contains('pgv-busy'); })()`, null, { timeout: 30000 });
  const n0 = await E(`document.getElementById('pdfx-prev')._pgv.pages`);
  await page.evaluate(`(function(){ var c=document.querySelector('#lb-dialog-card input[data-k=ticks]'); c.checked=true; var c2=document.querySelector('#lb-dialog-card input[data-k=why]'); c2.checked=true; var c3=document.querySelector('#lb-dialog-card input[data-k=plateText]'); c3.checked=true; _pdfxChange(); })()`);
  await page.waitForFunction(`(function(){ var h=document.getElementById('pdfx-prev'); return h&&!h.classList.contains('pgv-busy'); })()`, null, { timeout: 30000 }); await page.waitForTimeout(300);
  const n1 = await E(`document.getElementById('pdfx-prev')._pgv.pages`);
  yes('PV5', `ticking the plate-as-text, rationale and checklist boxes changed the page count (${n0} → ${n1})`, n1 > n0);
  // a late layout from an older render never wins: two renders in a row, the second one is what stays
  const late = await page.evaluate(`(async function(){ var h=document.getElementById('pdfx-prev'); var a=buildPrintDoc(pdfOpts(),{kind:'exp',id:'${ids.bio}'},{}), b=buildPrintDoc(pdfOpts(),{kind:'exp',id:'${ids.wb}'},{});
    _pgvMount(h,a); _pgvMount(h,b); await new Promise(function(r){ setTimeout(r,2500); }); return {pages:h._pgv.pages, shows:(h.querySelector('.pgv-win iframe')&&h.querySelector('.pgv-win iframe').srcdoc.indexOf('Western blot of BRD4')>=0)}; })()`);
  yes('PV5', 'an older render replaced the newer one', late.shows);
  await page.evaluate(`document.documentElement.setAttribute('data-theme','dark')`); await page.waitForTimeout(150);
  const dark = await page.evaluate(`(function(){ var s=document.querySelector('#pdfx-prev .pgv-sheet'); return getComputedStyle(s).backgroundColor; })()`);
  eq('PV5', 'the paper in the dark theme', dark, 'rgb(255, 255, 255)');
  // the printed page is ink on white in either theme: the frame carries the app's theme, so no text may come out light
  await page.evaluate(`_pdfxRender()`);
  await page.waitForFunction(`(function(){ var h=document.getElementById('pdfx-prev'); return h&&!h.classList.contains('pgv-busy')&&h.querySelector('.pgv-win iframe.on'); })()`, null, { timeout: 30000 });
  const lightInk = await page.evaluate(`(function(){ var d=document.querySelector('#pdfx-prev .pgv-win iframe').contentDocument, n=0, bad=[];
    function lum(c){ var m=c.match(/[\\d.]+/g).map(Number); return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255; }
    d.querySelectorAll('#print-root *').forEach(function(e){ var own=[].some.call(e.childNodes,function(x){ return x.nodeType===3&&x.nodeValue.trim(); }); if(!own||/^(STYLE|SCRIPT)$/.test(e.tagName)) return; n++; if(lum(getComputedStyle(e).color)>0.55) bad.push(e.className); });
    return {n:n, theme:d.documentElement.getAttribute('data-theme'), bad:bad.slice(0,5)}; })()`);
  eq('PV5', 'the frame carries the dark theme', lightInk.theme, 'dark'); yes('PV5', `light text on the white paper in the dark theme (${lightInk.bad})`, lightInk.n > 50 && lightInk.bad.length === 0);
  await page.evaluate(`document.documentElement.setAttribute('data-theme','light'); _lbDlgClose()`);

  // PV6 media
  const med = await page.evaluate(`({print:_pgvMedia('print'), screen:_pgvMedia('screen'), both:_pgvMedia('screen, print'), w:_pgvMedia('(max-width:760px)'), pw:_pgvMedia('print and (max-width:760px)'), sw:_pgvMedia('screen and (min-width:900px)'), nots:_pgvMedia('not screen')})`);
  eq('PV6', '@media print is always', med.print, ''); eq('PV6', '@media screen is never', med.screen, null);
  eq('PV6', 'screen, print is always', med.both, ''); eq('PV6', 'a bare width query stays', med.w, '(max-width:760px)');
  eq('PV6', 'print and a width query keeps the width query', med.pw, '(max-width:760px)'); eq('PV6', 'screen and a width query is never', med.sw, null);
  const css = await page.evaluate(`_pgvAppCss()`);
  yes('PV6', "the app's `body>*{display:none}` print rule is read (the preview structure depends on it being harmless)", /body>\*\{display:none!important/.test(css.replace(/\s+/g, '')));
  yes('PV6', "no @page of the app's own reaches a preview frame", !/@page/.test(css));

  yes('PV0', `no console errors (${errs.slice(0, 3).join(' | ')})`, errs.length === 0);
  await browser.close();
} finally { srv.kill(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
console.log(findings.length ? findings.join('\n') : `✓ PDF preview invariants — ${checks} checks`);
process.exit(findings.length ? 1 : 0);
