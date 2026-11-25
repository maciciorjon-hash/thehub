// Print preview in the other apps — Archive, Hit Finder, Tempo and the Freezer show the pages before they print.
//
// Archive, Hit Finder, Tempo and Iceberg printed from one click: the browser's own print dialog, or (the Freezer) a pop-up
// that printed at once and printed nothing when it was blocked. They share the Labbook engine now (tools/printkit/, PrintKit):
// the document laid out the way the printer lays it out, shown as sheets. tools/pdf_preview_invariants.mjs holds the engine to a real
// PDF in Labbook; this holds each app's own print to the same standard, with the app's own print stylesheet.
//
//   PA1 flow     the print button shows the pages and prints nothing; Cancel prints nothing and takes the dialog away; "Print / save PDF" prints
//                once and takes the dialog away; Escape cancels
//   PA2 pages    the preview counts the pages Chromium's printer makes from the same page, holds the same letters on every page and reads
//                the sheet and margins the app's @page asks for (Archive's, which had none, now states A4)
//   PA3 freezer  the Freezer sheet shows in its own frame, one A4 page, and prints from that frame (a blocked pop-up cannot lose it)
//   PA4 kit      the kit in every app is the kit in tools/printkit/ (sync_printkit.py --check), and no app opens a print pop-up
//
//   node tools/print_preview_apps_invariants.mjs      exit 1 on any finding
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pvapps-'));
const PY = `
import sys, json, fitz
d = fitz.open(sys.argv[1]); out = []
for p in d:
    out.append({'w': [w[4] for w in p.get_text('words')], 'size': [round(p.rect.width / 72 * 25.4), round(p.rect.height / 72 * 25.4)]})
print(json.dumps(out))
`;
// how many letters one page holds that the other does not (the PDF splits "2.5" and some axis ticks in two; a break one line off moves more than this)
const letterGap = (x, y) => { const c = t => [...t].reduce((m, ch) => (m[ch] = (m[ch] || 0) + 1, m), {}), cx = c(x), cy = c(y); let n = 0; new Set([...Object.keys(cx), ...Object.keys(cy)]).forEach(ch => { n += Math.abs((cx[ch] || 0) - (cy[ch] || 0)); }); return n; };
const norm = ws => ws.map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);

// What each app does to reach its print, and what its print root is.
const APPS = [
  { name: 'Archive', url: '/apps/archive/archive.html', margins: [16, 15, 17, 15], root: 'print-root', body: 'printing', flow: `exportProtocolPDF('gibson')` },
  { name: 'Tempo', url: '/apps/tempo/tempo.html', margins: [14, 14, 14, 14], root: 'tp-print', body: '', ready: `typeof tpLoadExample==='function'`,
    setup: `(async function(){ await tpLoadExample(); await new Promise(r=>setTimeout(r,1500)); })()`, flow: `tpPrint()` },
  { name: 'Hit Finder', url: '/apps/hitfinder/hitfinder.html', margins: [13, 12, 13, 12], root: 'hf-print', body: '', ready: `typeof loadHitFinderTestData==='function'`,
    setup: `(async function(){ hfResetSession(); loadHitFinderTestData(); await new Promise(r=>setTimeout(r,800)); hfComputeVerdicts(); hfRender(); })()`, flow: `hfPrintSummary()` },
];

const port = await freePort();
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
try {
  await waitHttp(base + '/');
  const browser = await chromium.launch();
  const errs = [];
  for (const A of APPS.filter(x => !process.env.PA_ONLY || x.name === process.env.PA_ONLY)) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    // only this server: fonts and libraries from elsewhere stay out
    await ctx.route(/^https?:/, r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(`${A.name}: ${String(e)}`));
    await page.goto(base + A.url); await page.waitForTimeout(900);
    if (A.ready) await page.waitForFunction(A.ready, null, { timeout: 20000 });
    if (A.setup) await page.evaluate(A.setup);
    await page.evaluate(() => { window.__prints = 0; window.print = function () { window.__prints++; }; });
    const open = async () => {
      await page.evaluate(`PrintKit.close(true); ${A.flow}`);
      await page.waitForFunction(`(function(){ var h=document.querySelector('.prk-prev'); return h&&h._pgv&&h._pgv.pages>0&&!h.classList.contains('pgv-busy'); })()`, null, { timeout: 30000 });
    };
    // PA1
    await open();
    eq('PA1', `${A.name}: nothing printed before the preview is confirmed`, await page.evaluate(`window.__prints`), 0);
    await page.evaluate(`document.querySelector('.prk-prev').scrollTop=0`);
    // PA2 against the real PDF
    const pv = await page.evaluate(`(async function(){ var h=document.querySelector('.prk-prev'), S=h._pgv, G=S.G||S.g, f=document.createElement('iframe'); f.style.cssText='position:fixed;left:-30000px;top:0;border:0;width:'+G.sw+'px;height:'+G.sh+'px';
      document.body.appendChild(f); await new Promise(function(r){ f.onload=r; f.srcdoc=PrintKit.doc(S,0); });
      var d=f.contentDocument, out=[]; for(var i=0;i<S.pages;i++) out.push([]);
      var tw=d.createTreeWalker(d.getElementById(S.o.root),NodeFilter.SHOW_TEXT), n;
      while((n=tw.nextNode())){ var pe=n.parentElement; if(!pe||/^(STYLE|SCRIPT)$/.test(pe.tagName)) continue;
        var re=/\\S+/g, m; while((m=re.exec(n.nodeValue))){ var r=d.createRange(); r.setStart(n,m.index); r.setEnd(n,m.index+m[0].length); var b=r.getClientRects()[0]; if(!b||!b.width) continue;
          var c=Math.floor((b.left-G.ml*96/25.4)/G.cw+0.001); if(c>=0&&c<S.pages) out[c].push(m[0]); } }
      f.remove(); return {pages:S.pages, g:{W:S.g.W,H:S.g.H,mt:S.g.mt,mr:S.g.mr,mb:S.g.mb,ml:S.g.ml}, words:out, root:S.o.root, body:S.o.bodyClass||''}; })()`);
    // the real thing: the app's own print stylesheet, the app's own print root, Chromium's printer
    await page.evaluate(`PrintKit.close(true); ${A.body ? `document.body.classList.add('${A.body}')` : ''}`);
    await page.emulateMedia({ media: 'print' });
    const file = path.join(tmp, A.name.replace(/\W/g, '') + '.pdf');
    await page.pdf({ path: file, format: 'A4', preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(`${A.body ? `document.body.classList.remove('${A.body}')` : ''}`);
    const real = JSON.parse(execFileSync('python3', ['-I', '-c', PY, file], { encoding: 'utf8', maxBuffer: 1 << 26 }));
    eq('PA2', `${A.name}: pages`, pv.pages, real.length);
    eq('PA2', `${A.name}: sheet size`, [pv.g.W, pv.g.H], real[0].size);
    eq('PA2', `${A.name}: margins the app's @page asks for`, [pv.g.mt, pv.g.mr, pv.g.mb, pv.g.ml], A.margins);
    for (let i = 0; i < Math.min(pv.pages, real.length); i++) {
      // tokens of three characters or more: a list number, an axis tick split in two by the PDF, a lone unit are extraction, not layout
      const a = norm(pv.words[i]).filter(w => w.length >= 3).join(''), b = norm(real[i].w).filter(w => w.length >= 3).join('');
      const sa = [...a].sort().join(''), sb = [...b].sort().join(''); let k = 0; while (k < sa.length && sa[k] === sb[k]) k++;
      if (process.env.PVDEBUG && sa !== sb) { const cnt = t => [...t].reduce((m, c) => (m[c] = (m[c] || 0) + 1, m), {}), ca = cnt(sa), cb = cnt(sb); console.log(`  [${A.name} p${i + 1}] letters that differ:`, Object.keys({ ...ca, ...cb }).filter(c => (ca[c] || 0) !== (cb[c] || 0)).map(c => `${c}: preview ${ca[c] || 0}, pdf ${cb[c] || 0}`).join(' | ')); }
      yes('PA2', `${A.name} p${i + 1}: the page holds other text in the preview than in the PDF (${a.length} letters against ${b.length}, first difference at the sorted letter ${k})`, a.length > 20 && Math.abs(a.length - b.length) <= 4 && letterGap(sa, sb) <= 4);
    }
    // PA1 again: Cancel, Escape, Print
    await open();
    await page.evaluate(`document.querySelector('.prk-btn[data-a=cancel]').click()`); await page.waitForTimeout(100);
    eq('PA1', `${A.name}: Cancel prints nothing and takes the dialog away`, [await page.evaluate(`window.__prints`), await page.evaluate(`!!document.querySelector('.prk-back')`)], [0, false]);
    await open();
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    eq('PA1', `${A.name}: Escape cancels`, [await page.evaluate(`window.__prints`), await page.evaluate(`!!document.querySelector('.prk-back')`)], [0, false]);
    await open();
    await page.evaluate(`document.querySelector('.prk-btn[data-a=print]').click()`); await page.waitForTimeout(200);
    eq('PA1', `${A.name}: "Print / save PDF" prints once and takes the dialog away`, [await page.evaluate(`window.__prints`), await page.evaluate(`!!document.querySelector('.prk-back')`)], [1, false]);
    await ctx.close();
  }

  // PA3 the Freezer sheet
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route(/^https?:/, r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(`Freezer: ${String(e)}`));
    let popups = 0; ctx.on('page', p => { if (p !== page) popups++; });
    await page.goto(base + '/apps/iceberg/iceberg.html'); await page.waitForTimeout(900);
    await page.evaluate(() => { window.open = function () { window.__popup = 1; return null; }; });
    await page.evaluate(`printStorageSheet(currentTab)`);
    await page.waitForSelector('.prk-doc', { timeout: 10000 }); await page.waitForTimeout(900);
    const f = await page.evaluate(`(function(){ var fr=document.querySelector('.prk-doc'), d=fr.contentDocument, pg=d&&d.querySelector('.page'); var printed=0; fr.contentWindow.print=function(){ printed++; window.__fprint=printed; };
      return {page:!!pg, w:pg&&Math.round(pg.getBoundingClientRect().width), h:pg&&Math.round(pg.getBoundingClientRect().height), popup:window.__popup||0, title:document.querySelector('.prk-sub').textContent}; })()`);
    yes('PA3', 'the freezer sheet is in the dialog as one A4 page', f.page && Math.abs(f.w - 794) <= 2 && Math.abs(f.h - 1123) <= 2);
    eq('PA3', 'no pop-up was opened', [f.popup, popups], [0, 0]);
    await page.evaluate(`document.querySelector('.prk-btn[data-a=print]').click()`); await page.waitForTimeout(200);
    eq('PA3', 'Print / save PDF prints the sheet\'s own frame, once', await page.evaluate(`window.__fprint||0`), 1);
    await ctx.close();
  }

  // PA4 the kit is one
  const kit = fs.readFileSync(path.join(ROOT, 'tools/printkit/printkit.js'), 'utf8').trim();
  for (const f of ['labbook/labbook', 'archive/archive', 'hitfinder/hitfinder', 'tempo/tempo', 'iceberg/iceberg']) {
    const src = fs.readFileSync(path.join(ROOT, 'apps', f + '.html'), 'utf8');
    yes('PA4', `${f}: carries the kit, byte for byte (run tools/sync_printkit.py)`, src.includes(kit));
    yes('PA4', `${f}: opens no print pop-up`, !/window\.open\(\s*['"]{2}\s*,\s*['"]_blank['"]\s*\)[\s\S]{0,200}\.print\(\)/.test(src));
  }
  yes('PA0', `no page errors (${errs.slice(0, 3).join(' | ')})`, errs.length === 0);
  await browser.close();
} finally { srv.kill(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
console.log(findings.length ? findings.join('\n') : `✓ print preview in the apps — ${checks} checks`);
process.exit(findings.length ? 1 : 0);
