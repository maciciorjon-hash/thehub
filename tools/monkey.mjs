// A monkey for the working apps: seed the app with its demo data, go to each tab, and put hostile values into every text box, number box and
// select — empty, zero, negative, enormous, text, a decimal comma, markup, a formula — while watching for what a person would call broken:
// an uncaught error, "NaN" / "undefined" / "Infinity" / "[object" on screen, a blank where a table was. It cannot know what a right answer is;
// it only finds the places where there is no answer at all. Run it after changing an app that takes input.
//
//   node tools/monkey.mjs [--only=bca,dora] [--url=http://127.0.0.1:8791] [--verbose]      (serve the repo first: python3 -m http.server 8791)
import { chromium } from 'playwright';
import { HF_SEED } from './hitfinder_seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const BASE = args.url || 'http://127.0.0.1:8791';
const ONLY = args.only ? String(args.only).split(',') : null;
const APPS = {
  echo: { url: '/apps/echo/echo.html', seed: ['document.getElementById("setup-modal") && document.getElementById("setup-modal").classList.add("hidden")', 'loadTestData()'], wait: 6000, pre: p => p.evaluate(() => { try { runPipeline(); } catch (e) {} }), ready: '() => typeof _lastResultsData !== "undefined" && _lastResultsData && _lastResultsData.length' },
  hitfinder: { url: '/apps/hitfinder/hitfinder.html', seed: HF_SEED, wait: 3500 },
  dora: { url: '/apps/dora/dora.html', seed: ['loadTestData()'], wait: 800 },
  bca: { url: '/apps/bca/bca.html', seed: ['loadTestData()'], wait: 800, views: ['switchTab("import")', 'switchTab("standards")', 'switchTab("samples")'] },
  beacon: { url: '/apps/beacon/beacon.html', seed: ["loadTestData('gain')"], wait: 800, views: ['openSetupModal(); switchSetupTab("assay")', 'openSetupModal(); switchSetupTab("platemap")', 'switchTab("qc")', 'switchTab("dose")'] },
  lumina: { url: '/apps/lumina/lumina.html', seed: ['loadLuminaTestData()'], wait: 800 },
};
const HOSTILE = ['', ' ', '0', '-1', '1e999', '99999999999', 'abc', '0,5', '1.2.3', '<img src=x onerror=window.__mx=1>', '=1+1', '٣٢١', 'A1:A99999999', 'ZZ9:A1', 'B2:C11'];
const BAD = /\bNaN\b|\bundefined\b|\bInfinity\b|\[object |\bnull\b(?!\s*(?:hypothesis|and void))/;
const found = new Map();
const note = (k, v) => { if (!found.has(k)) found.set(k, v); };
const browser = await chromium.launch();

async function visibleText(page) { return page.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/.test(p.tagName)) continue; const t = n.textContent.trim(); if (!t) continue; const r = p.getBoundingClientRect(); const cs = getComputedStyle(p); if (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') out.push(t); } return out.join(' ¶ '); }); }

for (const [id, A] of Object.entries(APPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  const tabsN = A.views ? A.views.length : await (async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const pg = await ctx.newPage(); await pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await pg.goto(BASE + A.url); await pg.waitForTimeout(800); const n = await pg.evaluate(() => [...document.querySelectorAll('.tab,.dtab,.outer-tab,[role=tab],.nav-tab')].filter(e => e.getBoundingClientRect().width > 0 && !/^\s*$/.test(e.textContent)).length); await ctx.close(); return Math.min(n, 9);
  })();
  for (let ti = 0; ti < Math.max(1, tabsN); ti++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(String(e && e.message || e)));
    await pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} });
    await pg.goto(BASE + A.url); await pg.waitForTimeout(900);
    for (const js of A.seed) { try { await pg.evaluate(js); } catch (e) {} }
    if (A.pre) await A.pre(pg); if (A.ready) { try { await pg.waitForFunction(A.ready, null, { timeout: 60000 }); } catch (e) {} }
    await pg.waitForTimeout(A.wait);
    const tabName = A.views ? (await pg.evaluate(js => { try { (0, eval)(js); } catch (e) {} }, A.views[ti]), A.views[ti].slice(0, 28)) : await pg.evaluate(k => { const t = [...document.querySelectorAll('.tab,.dtab,.outer-tab,[role=tab],.nav-tab')].filter(e => e.getBoundingClientRect().width > 0 && !/^\s*$/.test(e.textContent)); const e = t[k]; if (!e) return 'main'; e.click(); return e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, ti);
    await pg.waitForTimeout(700);
    const where = id + ' › ' + tabName;
    const base = await visibleText(pg); const baseBad = new Set((base.match(new RegExp(BAD.source, 'g')) || []));
    const ctrls = await pg.evaluate(() => { const out = []; document.querySelectorAll('input:not([type=file]):not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=color]),textarea,select').forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || e.disabled || e.readOnly) return; e.setAttribute('data-mk', String(out.length)); out.push({ k: out.length, tag: e.tagName, type: e.type, label: (e.id || e.name || e.placeholder || e.getAttribute('aria-label') || e.className || '').toString().slice(0, 36) }); }); return out.slice(0, 40); });
    if (args.verbose) console.log(`  ${where}: ${ctrls.length} controls`);
    for (const c of ctrls) {
      const sel = `[data-mk="${c.k}"]`;
      const vals = c.tag === 'SELECT' ? ['__cycle__'] : HOSTILE;
      for (const v of vals) {
        const nErr = errs.length;
        try {
          if (v === '__cycle__') { const n = await pg.evaluate(s => document.querySelector(s) ? document.querySelector(s).options.length : 0, sel); for (let o = 0; o < Math.min(n, 8); o++) { await pg.evaluate(([s, o]) => { const e = document.querySelector(s); if (!e) return; e.selectedIndex = o; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, o]); await pg.waitForTimeout(25); } }
          else await pg.evaluate(([s, v]) => { const e = document.querySelector(s); if (!e) return; if (e.type === 'range' || e.type === 'number') { try { e.value = v; } catch (x) {} } else e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.dispatchEvent(new Event('blur', { bubbles: true })); }, [sel, v]);
        } catch (e) {}
        await pg.waitForTimeout(40);
        if (errs.length > nErr) note('ERR  ' + where + ' · ' + c.label + ' = ' + JSON.stringify(v) + ' → ' + errs[errs.length - 1].slice(0, 140), 1);
        const txt = await visibleText(pg); const bad = [...new Set(txt.match(new RegExp(BAD.source, 'g')) || [])].filter(x => !baseBad.has(x));
        if (bad.length) { const i = txt.search(BAD), ctx2 = txt.slice(Math.max(0, i - 40), i + 30).replace(/\s+/g, ' '); note('TEXT ' + where + ' · ' + c.label + ' = ' + JSON.stringify(v) + ' → "' + bad.join(',') + '" in …' + ctx2 + '…', 1); }
        if (await pg.evaluate(() => window.__mx === 1)) note('XSS  ' + where + ' · ' + c.label + ' ran markup', 1);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(found.size ? [...found.keys()].join('\n') : 'No errors and no NaN / undefined / Infinity on screen.');
console.log(`\n${found.size} finding(s).`);
process.exit(found.size ? 1 : 0);
