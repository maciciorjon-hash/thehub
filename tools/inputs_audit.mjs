// Can every box be read? For each Data Analysis app, seeded with its demo data, at every width that matters, in both themes: every visible text box, number box,
// select and text area is checked for
//   clipped    the value (or the selected option) is wider than the box that holds it
//   tiny       text under 16px in a box on a touch screen — iOS zooms the whole page when one is focused and never zooms back
//   short      a box under 28px high (desktop) or 40px (touch): not a thing a finger or a pointer can hit
//   faint      text or placeholder in a colour that does not read on the box behind it (WCAG contrast under 3 for a placeholder, 4.5 for a value)
//
//   node tools/inputs_audit.mjs [--only=bca,dora] [--url=http://127.0.0.1:8791] [--verbose]      (serve the repo first: python3 -m http.server 8791)
import { chromium } from 'playwright';
import { HF_SEED } from './hitfinder_seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const BASE = args.url || 'http://127.0.0.1:8791';
const ONLY = args.only ? String(args.only).split(',') : null;
const APPS = {
  echo: { url: '/apps/echo/echo.html', seed: ['loadTestData()'], views: ['switchPanel && switchPanel("gradient")', ''], wait: 1500 },
  hitfinder: { url: '/apps/hitfinder/hitfinder.html', seed: HF_SEED, views: ['hfTab("screens")', 'hfTab("criteria")', 'hfTab("hits")', 'hfTab("chem")', 'hfTab("export")'], wait: 3500 },
  dora: { url: '/apps/dora/dora.html', seed: ['loadTestData()'], views: ['switchTab("table")', 'switchTab("scatter")'], wait: 800 },
  bca: { url: '/apps/bca/bca.html', seed: ['loadTestData()'], views: ['switchTab("import")', 'switchTab("standards")', 'switchTab("samples")'], wait: 800 },
  beacon: { url: '/apps/beacon/beacon.html', seed: ["loadTestData('gain')"], views: ['switchTab("qc")', 'switchTab("dose")', 'openSetupModal(); switchSetupTab("assay")', 'openSetupModal(); switchSetupTab("platemap")'], wait: 800 },
  lumina: { url: '/apps/lumina/lumina.html', seed: ['loadLuminaTestData()'], views: ['', ''], wait: 800 },
};
const SIZES = [[1440, 900, false], [1024, 768, false], [768, 1024, true], [390, 844, true], [320, 568, true]];
const found = new Map();
const browser = await chromium.launch();

const AUDIT = () => {
  const out = [], lum = c => { let m = c.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number); if (/^color\(/.test(c)) m = m.map(v => v * 255);   // color-mix() computes to color(srgb 0.5 0.5 0.5), 0 to 1
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor, m = c.match(/[\d.]+/g); if (m && (m.length < 4 || +m[3] > 0.5)) return c; } return 'rgb(255,255,255)'; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const touch = matchMedia('(hover:none)').matches;
  document.querySelectorAll('input:not([type=file]):not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=color]):not([type=range]),textarea,select').forEach(e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || cs.display === 'none' || e.disabled) return;
    let op = 1; for (let n = e; n; n = n.parentElement) op *= +getComputedStyle(n).opacity; if (op < 0.2) return;
    if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight * 3) return;
    const name = (e.id || e.name || e.placeholder || e.getAttribute('aria-label') || e.className || e.tagName).toString().slice(0, 30), push = (k, v) => out.push(k + ' · ' + name + ' · ' + v);
    const fs = parseFloat(cs.fontSize), pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    if (e.tagName !== 'SELECT') { const v = e.value; if (v && e.scrollWidth > e.clientWidth + 2 && e.tagName === 'INPUT') push('clipped', '"' + v.slice(0, 24) + '" needs ' + e.scrollWidth + 'px in ' + e.clientWidth + 'px'); }
    else { const o = e.options[e.selectedIndex]; if (o) { const c = document.createElement('canvas').getContext('2d'); c.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; const w = c.measureText(o.text).width + pad + 22; if (w > r.width + 2) push('clipped', '"' + o.text.slice(0, 24) + '" needs ~' + Math.round(w) + 'px in ' + Math.round(r.width) + 'px'); } }
    if (touch && fs < 16 && e.tagName !== 'SELECT') push('tiny', fs + 'px');
    if (touch && fs < 16 && e.tagName === 'SELECT') push('tiny', fs + 'px (select)');
    if (r.height < (touch ? 40 : 26)) push('short', Math.round(r.height) + 'px high');
    const bg = bgOf(e);
    if ((e.value || e.tagName === 'SELECT') && contrast(cs.color, bg) < 4.5) push('faint', 'text ' + contrast(cs.color, bg).toFixed(1) + ':1');
    if (!e.value && e.placeholder) { const ph = getComputedStyle(e, '::placeholder').color; if (ph && contrast(ph, bg) < 3) push('faint', 'placeholder ' + contrast(ph, bg).toFixed(1) + ':1'); }
  });
  return out;
};

for (const [id, A] of Object.entries(APPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  for (const [w, h, touch] of SIZES) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    const pg = await ctx.newPage(); await pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await pg.addInitScript(t => { try { localStorage.setItem('hub_theme', t); localStorage.setItem('assist_seen', '1'); localStorage.setItem('lb_tour_done', '1'); } catch (e) {} }, theme);
    await pg.goto(BASE + A.url); await pg.waitForTimeout(800); await pg.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    for (const js of A.seed) { try { await pg.evaluate(js); } catch (e) {} }
    await pg.waitForTimeout(A.wait);
    for (const v of A.views) {
      if (v) { try { await pg.evaluate(js => { (0, eval)(js); }, v); } catch (e) {} await pg.waitForTimeout(450); }
      const res = await pg.evaluate(AUDIT);
      for (const r of res) { const k = `${id} › ${v || 'main'} · ${r}`; const at = `${w}${touch ? 't' : ''}/${theme[0]}`; found.set(k, (found.get(k) || new Set()).add(at)); }
    }
    await ctx.close();
  }
}
await browser.close();
const lines = [...found.entries()].map(([k, s]) => `✗ ${k}   @ ${[...s].join(' ')}`);
console.log(lines.length ? lines.join('\n') : 'Every box reads, at every width, in both themes.');
console.log(`\n${lines.length} finding(s).`);
process.exit(lines.length ? 1 : 0);
