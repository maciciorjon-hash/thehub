// Assistant invariants — the help notes are written by hand, so they rot; this is what stops them.
//
// Every topic in every app's notes is asked the questions a stale note would fail:
//
//   A1  well-formed      ids are unique, every topic answers with something, has enough phrases in it
//                        (English and Spanish), its `see` links exist, no markup is left unrendered
//   A2  found by name    searching a topic's own title, and each of its phrases, finds it in the top 3 —
//                        run in the shell with every app open to the admin, so topics compete across apps
//   A3  points at real   for every topic that says "Show me": the element exists and is visible on the
//       things           screen it names, once the app has something in it; and before that, a step whose
//                        element is not there yet says why (`miss`). Every button it offers calls a
//                        function that exists.
//   A4  never over-      a visitor is only ever answered about what they can open: no app they have not
//       promises         unlocked, no admin topic, no unlock code word anywhere in the notes
//   A5  one bubble       standalone: one; in the Hub: one, and the app inside it draws none
//   A6  fits             the bubble and the panel are inside the screen upright and sideways, and clear of
//                        the Hub's bottom tab bar; the field is 16px on a touch screen
//   A7  points           "Show me" draws a ring inside the screen, and Esc puts it away
//   A8  honest           a question with no answer says so; screen() and diag() never throw
//
//   node tools/assist_invariants.mjs [--shell=PATH]      exit 1 on any finding
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const _cands = ['dist/index.html', 'dHUB.html'].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
const SHELL = arg('shell', _cands[0] || path.join(ROOT, 'dHUB.html'));   // the newest build: CI has only dist/, a laptop has both
const only = arg('only', '');
const run = id => !only || only.split(',').includes(id);

let hasKitGlobal = false;
const findings = [];
let passed = 0;
const bad = (inv, where, msg) => findings.push(`✗ ${inv} ${where} — ${msg}`);
const ok = () => { passed++; };

const browser = await chromium.launch();
async function open(url, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, opts || {}));
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  await page.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('hub_theme', 'light'); } catch (e) {} });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  return page;
}

// What "the app has something in it" means for each one, so a selector can be checked where it lives.
const APPS = [
  { id: 'spectra', file: 'apps/bca/bca.html', loaded: () => { loadTestData(); } },
  { id: 'lumina', file: 'apps/lumina/lumina.html', loaded: () => { loadLuminaTestData(); } },
  { id: 'labbook', file: 'apps/labbook/labbook.html', loaded: async () => {
      const P = LB.data.projects[0], f = (P.sections || [])[0];
      openNew(P.id, f && f.id); document.getElementById('nm-type').value = 'CTG'; nmUpdateCode(); nmResetSetup(); nmProtos();
      createExperiment(); await new Promise(r => setTimeout(r, 900));
      window.__expId = Object.keys(LB.data.experiments)[0];
    },
    before: t => { if ((t.on || []).includes('exp') && !t.prep) openExp(window.__expId); } }
];

// ── A1 / A3 / A5 / A8 per app, standalone ────────────────────────────────────
for (const A of APPS) {
  if (!(run('A1') || run('A3') || run('A5') || run('A7') || run('A8'))) break;
  const url = 'file://' + path.join(ROOT, A.file);
  if (!fs.existsSync(path.join(ROOT, A.file))) continue;
  const page = await open(url);
  const has = await page.evaluate(id => !!(window.ASSIST && window.ASSIST.kbs[id]), A.id);
  if (!has) { bad('A1', A.id, 'the app carries no notes (run tools/sync_assist.py)'); await page.context().close(); continue; }

  // A5 — exactly one bubble on its own
  if (run('A5')) {
    const n = await page.evaluate(() => document.querySelectorAll('#as-bubble').length);
    n === 1 ? ok() : bad('A5', A.id, `${n} bubbles standalone`);
  }

  // A1 — well-formed
  if (run('A1')) {
    const probs = await page.evaluate(id => {
      const kb = ASSIST.kbs[id], out = [], seen = {};
      kb.topics.forEach(t => {
        const w = t._kb + ':' + t.id;
        if (seen[t.id]) out.push(`${w}: duplicate id`); seen[t.id] = 1;
        if (!t.t) out.push(`${w}: no title`);
        if (!(t.a || t.steps || (t.show) || (t.go && t.go.length))) out.push(`${w}: says nothing`);
        if (t.id !== 'about' && (t.q || []).length < 3) out.push(`${w}: needs more phrases (has ${(t.q || []).length})`);
        (t.see || []).forEach(s => { if (!kb.topics.some(x => x.id === s)) out.push(`${w}: see "${s}" does not exist`); });
        const html = ASSIST.answerHtml(t, false);
        if (/undefined|NaN|\[\[|\*\*|`/.test(html.replace(/<[^>]+>/g, ' '))) out.push(`${w}: unrendered markup or undefined in the answer`);
        // links to other topics must resolve
        (JSON.stringify([t.a && typeof t.a !== 'function' ? t.a : '', t.steps, t.tip, t.warn]).match(/\[\[([\w:-]+)\|/g) || []).forEach(m => {
          const k = m.slice(2, -1); if (!ASSIST.find(k.indexOf(':') > 0 ? k : id + ':' + k)) out.push(`${w}: link [[${k}]] does not resolve`);
        });
      });
      return out;
    }, A.id);
    probs.length ? probs.forEach(p => bad('A1', A.id, p)) : ok();
  }

  // A8 — screen() and diag() never throw, before and after there is something in the app
  const probe = async label => {
    const r = await page.evaluate(id => { try { const kb = ASSIST.kbs[id]; const s = kb.screen ? kb.screen(window) : ''; const d = kb.diag ? kb.diag(window) : []; return (typeof s === 'string' && Array.isArray(d)) ? '' : 'wrong types'; } catch (e) { return e.message; } }, A.id);
    r ? bad('A8', A.id, `screen()/diag() ${label}: ${r}`) : ok();
  };
  if (run('A8')) await probe('fresh');

  // A3 — fresh: a missing element must say why
  let freshRows = [];
  const stepsProbe = (id, spec) => page.evaluate(async ({ id, hasBefore }) => {
    const kb = ASSIST.kbs[id], rows = [];
    for (const t of kb.topics) {
      if (t.needs) continue;
      const steps = ASSIST.showSteps(t);
      if (!steps.length) continue;
      try { if (window.__before) window.__before(t); if (t.prep) t.prep(window); } catch (e) { rows.push({ w: t.id, sel: '(prep)', err: e.message }); continue; }
      await new Promise(r => setTimeout(r, 120));
      steps.forEach(s => {
        let vis = false; try { vis = [...document.querySelectorAll(s.sel)].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); } catch (e) { rows.push({ w: t.id, sel: s.sel, err: 'bad selector' }); return; }
        rows.push({ w: t.id, sel: s.sel, vis, miss: !!s.miss });
      });
    }
    return rows;
  }, { id, hasBefore: !!spec.before });
  if (A.before) await page.evaluate(src => { window.__before = eval('(' + src + ')'); }, A.before.toString());
  if (run('A3')) {
    freshRows = await stepsProbe(A.id, A);
  }

  // put something in the app
  await page.evaluate(`(${A.loaded.toString()})()`);
  await page.waitForTimeout(1200);
  if (run('A8')) await probe('loaded');

  if (run('A3')) {
    const loaded = await stepsProbe(A.id, A);
    // an element must be on screen in at least one of the two states (the paste grid goes once a plate is
    // loaded; the results appear only after a fit), and one that is missing in the fresh state says why
    loaded.forEach((r, i) => {
      const f = freshRows[i] || {};
      if (r.err) bad('A3', A.id, `${r.w}: ${r.err} ${r.sel}`);
      else if (!r.vis && !f.vis) bad('A3', A.id, `${r.w}: "${r.sel}" is not visible on its screen, fresh or with data in the app`);
      else if (!f.vis && !r.miss) bad('A3', A.id, `${r.w}: "${r.sel}" is not there in a fresh app and the step has no \`miss\` to say why`);
    });
    // every button the notes offer calls something that exists
    const fns = await page.evaluate(id => {
      const out = []; ASSIST.kbs[id].topics.forEach(t => (t.go || []).forEach(g => { if (g.fn && typeof window[g.fn] !== 'function') out.push(`${t.id}: go "${g.l}" calls ${g.fn}(), which does not exist`); }));
      return out;
    }, A.id);
    fns.length ? fns.forEach(f => bad('A3', A.id, f)) : ok();
  }

  // A7 — Show me draws a ring on screen, Esc puts it away
  if (run('A7')) {
    const r = await page.evaluate(async id => {
      const kb = ASSIST.kbs[id]; const t = kb.topics.find(t => !t.needs && ASSIST.showSteps(t).length && !t.prep);
      if (!t) return { skip: true };
      assistAsk(t.t); await new Promise(r => setTimeout(r, 250));
      const btns = [...document.querySelectorAll('#as-body [data-as=show]')]; if (!btns.length) return { err: 'no Show me button for ' + t.id };
      btns[btns.length - 1].click(); await new Promise(r => setTimeout(r, 900));
      const ring = document.querySelector('.as-ring'), card = document.querySelector('.as-spot');
      if (!ring || !card) return { err: 'no ring/card after Show me on ' + t.id };
      const b = ring.getBoundingClientRect(), c = card.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      const inside = x => x.left >= -1 && x.top >= -1 && x.right <= W + 1 && x.bottom <= H + 1;
      const res = { ring: inside(b), card: inside(c), topic: t.id };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      res.gone = !document.querySelector('.as-ring') && !document.querySelector('.as-spot');
      return res;
    }, A.id);
    if (r.skip) ok(); else if (r.err) bad('A7', A.id, r.err);
    else { (r.ring && r.card) ? ok() : bad('A7', A.id, `${r.topic}: ring or card outside the screen`); r.gone ? ok() : bad('A7', A.id, 'Esc did not put the pointer away'); }
  }

  // A8 — honest: nonsense gets no answer, and a real question gets one
  if (run('A8')) {
    const r = await page.evaluate(() => ({ none: ASSIST.search('zzqxv blorp wug').length, real: ASSIST.search(ASSIST.kbs[ASSIST.order[0]].topics[1].t).length }));
    (r.none === 0 && r.real > 0) ? ok() : bad('A8', A.id, `nonsense found ${r.none}, a real title found ${r.real}`);
  }
  if (page.errs.length) bad('A8', A.id, 'page error: ' + page.errs.slice(0, 2).join(' | '));
  await page.context().close();
}

// ── the Hub: A2 A4 A5 A6 ──────────────────────────────────────────────────────
if (run('A2') || run('A4') || run('A5') || run('A6')) {
  if (!fs.existsSync(SHELL)) { bad('A0', SHELL, 'the built Hub is missing — run python3 embed.py first'); }
  else {
    const url = 'file://' + SHELL;
    const page = await open(url);
    const hasKit = await page.evaluate(() => !!(window.ASSIST && window.ASSIST.kbs.hub));
    hasKitGlobal = hasKit;
    if (!hasKit) bad('A0', 'shell', 'the Hub carries no assistant');
    else {
      // A4 — a visitor first
      if (run('A4')) {
        const v = await page.evaluate(async () => {
          isAdmin = false; _unlockedApps.clear();
          const out = { vis: ASSIST.visible().map(k => k.id) };
          out.leaks = [];
          ['labbook', 'lumina', 'incubator', 'cell archive', 'send to labbook', 'echo', 'plate map', 'planner', 'sync', 'rail'].forEach(q => ASSIST.search(q).forEach(r => { if (r.kb.id !== 'hub' || r.t.admin || r.t.needs) out.leaks.push(`"${q}" answered by ${r.kb.id}:${r.t.id}`); }));
          const apps = ASSIST.find('hub:apps'); out.apps = ASSIST.answerHtml(apps, true).replace(/<[^>]+>/g, ' ');
          assistOpen(); await new Promise(r => setTimeout(r, 200)); document.querySelector('[data-as=browse]').click();
          out.browse = document.getElementById('as-body').textContent;
          assistClose();
          // asked about codes, the assistant must never say one (they are ordinary words elsewhere, so this is
          // about the answers to those questions, not a search of the notes)
          const words = Object.values(APP_UNLOCK_WORDS || {}).map(String).concat(Object.values(SUITE_UNLOCK_WORDS || {}).map(x => String(x.word))).filter(w => w.length > 3);
          out.words = [];
          ['code word', 'what is the code for lumina', 'unlock echo', 'secret code', 'password', 'how do i unlock lumina', 'codigo', 'discover box', 'suite code', 'unlock the whole data analysis suite', 'unlock hit finder', 'unlock beacon'].forEach(q => {
            const r = ASSIST.search(q)[0]; if (!r) return;
            const txt = ASSIST.answerHtml(r.t, true).replace(/<[^>]+>/g, ' ').toLowerCase();
            words.forEach(w => { if (new RegExp('\\b' + w + '\\b').test(txt)) out.words.push(`"${q}" -> ${w}`); });
          });
          // unlock one app: it appears, its neighbours' hidden topics do not
          _unlockedApps.add('lumina');
          out.vis2 = ASSIST.visible().map(k => k.id);
          out.labSend = !!ASSIST.find('lumina:send-labbook');
          out.adminTopic = !!ASSIST.find('hub:sync');
          isAdmin = true;
          out.vis3 = ASSIST.visible().length; out.adminTopic3 = !!ASSIST.find('hub:sync'); out.labSend3 = !!ASSIST.find('lumina:send-labbook');
          isAdmin = false;
          // the suite word: opens every tool the suite lists (admin-only ones included), and nothing outside it
          _unlockedApps.clear();
          const SU = SUITE_UNLOCK_WORDS.analysis, accessible = () => SU.apps.filter(id => _isAppAccessible(id));
          out.suiteBefore = accessible().length;
          tryUnlock(SU.word);
          out.suiteAfter = accessible().length; out.suiteAll = SU.apps.length;
          out.suiteLeak = ['labbook', 'incubator', 'cellarchive'].filter(id => _isAppAccessible(id));
          _unlockedApps.clear(); try { localStorage.removeItem('hub_unlocked'); } catch (e) {} _pendingDeepLink = null;
          return out;
        });
        (v.vis.length === 1 && v.vis[0] === 'hub') ? ok() : bad('A4', 'visitor', `sees notes for ${v.vis.join(', ')}`);
        v.leaks.length ? v.leaks.forEach(l => bad('A4', 'visitor', l)) : ok();
        /Lumina|Labbook|Echo/.test(v.apps) ? bad('A4', 'visitor', '"Which tools can I use?" names tools they cannot open: ' + v.apps.slice(0, 120)) : ok();
        /Lumina|Labbook|Incubator/.test(v.browse) ? bad('A4', 'visitor', 'Topics lists a tool they cannot open') : ok();
        v.words.length ? bad('A4', 'notes', 'an answer about unlocking says a code word: ' + v.words.join(', ')) : ok();
        (v.vis2.includes('lumina') && !v.vis2.includes('labbook')) ? ok() : bad('A4', 'after unlocking Lumina', 'sees ' + v.vis2.join(', '));
        (!v.labSend && !v.adminTopic) ? ok() : bad('A4', 'after unlocking Lumina', 'still sees a Labbook or admin-only topic');
        (v.vis3 > 2 && v.adminTopic3 && v.labSend3) ? ok() : bad('A4', 'admin', 'an admin does not see everything');
        (v.suiteBefore === 0 && v.suiteAfter === v.suiteAll) ? ok() : bad('A4', 'suite code', `before ${v.suiteBefore}, after ${v.suiteAfter} of ${v.suiteAll}`);
        v.suiteLeak.length ? bad('A4', 'suite code', 'also opened ' + v.suiteLeak.join(', ')) : ok();
      }

      // A2 — found by name, in the Hub with everything open (topics compete across apps)
      if (run('A2')) {
        const r = await page.evaluate(() => {
          isAdmin = true; const out = [];
          Object.values(ASSIST.kbs).forEach(kb => kb.topics.forEach(t => {
            if (!ASSIST.find(kb.id + ':' + t.id)) return;
            ASSIST_HOST.current = () => (kb.id === 'hub' ? null : kb.id);     // asked from inside that app, as a person would
            const rank = q => { const res = ASSIST.search(q); const i = res.findIndex(x => x.t === t); return i; };
            const byTitle = rank(t.t);
            if (byTitle < 0 || byTitle > 2) out.push(`${kb.id}:${t.id}: its own title "${t.t}" finds it at ${byTitle < 0 ? 'nowhere' : '#' + (byTitle + 1)}`);
            (t.q || []).forEach(p => { const i = rank(p); if (i < 0 || i > 2) out.push(`${kb.id}:${t.id}: the phrase "${p}" finds it at ${i < 0 ? 'nowhere' : '#' + (i + 1)}`); });
          }));
          isAdmin = false; return out;
        });
        // a phrase shared by two topics is ambiguous by design; only report a topic that loses most of its phrases
        const byTopic = {};
        r.forEach(x => { const k = x.split(': ')[0]; (byTopic[k] = byTopic[k] || []).push(x); });
        let n = 0; Object.keys(byTopic).forEach(k => { const title = byTopic[k].find(x => /its own title/.test(x)); if (title) { bad('A2', 'Hub', title); n++; } else if (byTopic[k].length >= 3) { bad('A2', 'Hub', `${k}: ${byTopic[k].length} of its phrases do not find it, e.g. ${byTopic[k][0].split(': ')[1]}`); n++; } });
        if (!n) ok();
      }
      if (page.errs.length) bad('A8', 'Hub', 'page error: ' + page.errs.slice(0, 2).join(' | '));
    }
    await page.context().close();

    // A5 in the Hub: the app inside draws none, the Hub draws one
    if (run('A5') && hasKitGlobal) {
      const p = await open(url);
      const r = await p.evaluate(async () => {
        isAdmin = true; openApp('lumina'); await new Promise(r => setTimeout(r, 2500));
        const f = document.getElementById('frame-lumina'); const w = f && f.contentWindow;
        return { shell: document.querySelectorAll('#as-bubble').length, frame: w ? w.document.querySelectorAll('#as-bubble').length : -1, cur: ASSIST.cur() };
      });
      (r.shell === 1 && r.frame === 0) ? ok() : bad('A5', 'Hub', `shell has ${r.shell} bubble(s), the app inside has ${r.frame}`);
      r.cur === 'lumina' ? ok() : bad('A5', 'Hub', `the assistant thinks the open app is "${r.cur}"`);
      await p.context().close();
    }

    // A6 — fits upright, sideways, and clear of the bottom tab bar
    if (run('A6') && hasKitGlobal) {
      for (const [w, h, label] of [[1440, 900, 'desktop'], [390, 844, 'phone upright'], [844, 390, 'phone sideways']]) {
        const touch = w < 900;
        const p = await open(url, touch ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: h } });
        const r = await p.evaluate(async () => {
          assistOpen(); await new Promise(r => setTimeout(r, 400));
          const inside = e => { const b = e.getBoundingClientRect(); return b.left >= -1 && b.top >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1; };
          const panel = document.getElementById('as-panel'), inp = document.getElementById('as-q');
          const out = { panel: inside(panel), fs: parseFloat(getComputedStyle(inp).fontSize), h: panel.getBoundingClientRect().height, vh: innerHeight };
          assistClose(); await new Promise(r => setTimeout(r, 300));
          out.bubble = inside(document.getElementById('as-bubble'));
          // signed in on a phone, the tab bar is at the bottom: the bubble must sit above it
          document.body.classList.add('ws');
          const tabs = document.getElementById('ws-tabs');
          if (tabs && getComputedStyle(tabs).display !== 'none') { out.tabs = tabs.getBoundingClientRect().top; out.bub = document.getElementById('as-bubble').getBoundingClientRect().bottom; }
          return out;
        });
        r.panel ? ok() : bad('A6', label, 'the panel is outside the screen');
        r.bubble ? ok() : bad('A6', label, 'the bubble is outside the screen');
        if (touch) (r.fs >= 16 ? ok() : bad('A6', label, `the field is ${r.fs}px; iOS zooms the page below 16`));
        if (r.tabs !== undefined) (r.bub <= r.tabs + 1 ? ok() : bad('A6', label, `the bubble (bottom ${Math.round(r.bub)}) sits on the tab bar (top ${Math.round(r.tabs)})`));
        await p.context().close();
      }
    }
  }
}

await browser.close();
console.log(findings.length ? findings.join('\n') : '');
console.log(`assistant invariants: ${passed} checks passed, ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
process.exit(findings.length ? 1 : 0);
