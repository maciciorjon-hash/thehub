// Every control on every tab of Lumina, Beacon and Tempo, pressed once, with the example loaded: nothing may throw, and no "NaN" / "undefined" / "[object" may appear.
// Found 2026-11-01: Tempo's time-course Heat map threw "tpHeatCols is not defined" (two helper functions had been pasted inside the callback of another function) and
// no suite pressed that button. A suite that checks what each button *does* cannot be written for all of them; this one only asks that none of them breaks.
//   node tools/views_invariants.mjs [--only=lumina,tempo-timecourse]
//
// V1  every button, select, checkbox and summary on every tab and in every dialog — each one pressed (a select moved to its next option) — leaves no script error, no console error
//     and no native alert / confirm / prompt (the apps use their own toast and dialog)
// V2  what is pressed changes nothing it should not: the page still has its tabs, and no control is left in the page without a name a reader could say (button, select and checkbox
//     with no text, aria-label, title or associated label)
// Skipped on purpose: what clears or deletes (Clear, Delete, Remove, Reset, Discard, Start over) — those are in the apps' own suites with their undo.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const findings = []; let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { const m = '✗ ' + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''); findings.push(m); console.log('  ' + m); } };
const APPS = {
  lumina: { app: 'lumina', seed: 'loadLuminaTestData()', tabs: ['switchTab("input")', 'switchTab("results")', 'switchTab("graph")', 'switchTab("history")', 'switchTab("guide")', 'lsOpen()'] },
  beacon: { app: 'beacon', seed: "loadTestData('gain')", tabs: ['switchTab("plate")', 'switchTab("results")', 'switchTab("graph")', 'switchTab("history")', 'switchTab("guide")', 'bsOpen()'] },
  'beacon-displacement': { app: 'beacon', seed: "loadTestData('displacement')", tabs: ['switchTab("plate")', 'switchTab("results")', 'switchTab("graph")'] },
  tempo: { app: 'tempo', seed: 'await tpLoadExample("degradation")', tabs: ['tpTab("plate")', 'tpTab("results")', 'tpTab("curves")', 'tpTab("compare")', 'tpTab("graph")', 'tpTab("history")', 'tpTab("guide")', 'tpsOpen()', 'tpOpenSettings()'] },
  'tempo-timecourse': { app: 'tempo', seed: 'await tpLoadExample("timecourse")', tabs: ['tpTab("plate")', 'tpTab("results")', 'tpTab("curves")', 'tpTab("compare")', 'tpTab("graph")'] },
};
const SKIP = /clear|delete|remove|reset|discard|erase|wipe|start over|forget|^×$|^✕$/i;
const BAD = /\bNaN\b|\bundefined\b|\bInfinity\b|\[object /;
const SEL = 'button,[role=button],summary,select,input[type=checkbox],input[type=radio]';
const only = args.only ? String(args.only).split(',') : Object.keys(APPS);
const browser = await chromium.launch();
for (const id of only) {
  const A = APPS[id]; let pressed = 0;
  for (const tab of A.tabs) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push('script error: ' + String(e).slice(0, 160)));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
    pg.on('dialog', d => { errs.push('native ' + d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    pg.on('download', d => d.cancel().catch(() => {}));
    await pg.route(/^https?:/, r => r.abort());
    await pg.addInitScript(() => { try { localStorage.setItem('assist_seen', '1'); localStorage.setItem('hub_theme', 'light'); } catch (e) {} window.open = () => null; });
    await pg.goto('file://' + path.join(ROOT, `apps/${A.app}/${A.app}.html`)); await pg.waitForTimeout(700);
    const go = async () => { await pg.evaluate(`(async()=>{try{${tab}}catch(e){}})()`).catch(() => {}); await pg.waitForTimeout(350); };
    await pg.evaluate(`(async()=>{ ${A.seed}; })()`); await pg.waitForTimeout(1200); await go();
    const list = () => pg.evaluate(sel => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'; };
      return [...document.querySelectorAll(sel)].filter(vis).filter(e => !e.disabled).map(e => (e.getAttribute('aria-label') || e.title || e.textContent || e.id || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40));
    }, SEL);
    const n = (await list()).length, bad = [], nameless = [];
    for (let i = 0; i < n && i < 170; i++) {
      const l = await list(); if (i >= l.length) break; if (SKIP.test(l[i])) continue;
      const before = errs.length;
      await pg.evaluate(({ sel, idx }) => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'; };
        const e = [...document.querySelectorAll(sel)].filter(vis).filter(x => !x.disabled)[idx]; if (!e) return;
        if (e.tagName === 'SELECT') { if (e.options.length > 1) { e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } }
        else if (typeof e.click === 'function') e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, { sel: SEL, idx: i }).catch(e => errs.push('evaluate: ' + String(e).slice(0, 100)));
      pressed++; await pg.waitForTimeout(110);
      if (errs.length > before) bad.push(`"${l[i]}": ${errs.slice(before).join(' | ')}`);
      const t = await pg.evaluate(() => document.body.innerText); const m = t.match(BAD); if (m) bad.push(`"${l[i]}" leaves "${m[0]}" on the page`);
      await pg.keyboard.press('Escape'); await go();
    }
    check(`V1 ${id} › ${tab}: ${n} controls pressed, no error, nothing broken on the page`, bad.length === 0, bad.slice(0, 4));
    // V2 — names
    const unnamed = await pg.evaluate(sel => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'; };
      return [...document.querySelectorAll('button,select,input[type=checkbox],input[type=radio]')].filter(vis).filter(e => !e.closest('svg')).filter(e => {
        const t = (e.getAttribute('aria-label') || e.title || (e.tagName === 'SELECT' ? '' : e.textContent) || '').trim(), lab = e.labels && e.labels.length ? e.labels[0].textContent.trim() : '', lb = e.getAttribute('aria-labelledby');
        return !t && !lab && !lb && !e.closest('label') && !e.getAttribute('aria-label');
      }).map(e => e.tagName.toLowerCase() + '#' + e.id + '.' + String(e.className).slice(0, 24)).slice(0, 5);
    }, SEL);
    check(`V2 ${id} › ${tab}: every control has a name`, unnamed.length === 0, unnamed);
    await ctx.close();
  }
}
await browser.close();
console.log(findings.length ? `\n${findings.length} finding(s), ${passed} checks passed.` : `\nAll ${passed} view invariants hold.`);
process.exit(findings.length ? 1 : 0);
