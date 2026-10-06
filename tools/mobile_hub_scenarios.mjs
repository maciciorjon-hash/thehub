// The screens tools/mobile_hub_sweep.mjs visits. One scenario = one place a phone user can be,
// reached the way they reach it (through the shell), measured once it has settled.
//
// A scenario gets { page, ctx, measure(label, frame?, opts?), frameOf(id), fresh({visitor}) }.
// `ctx` is { w, h, theme } — landscape is w > h.
//
// Each app is driven three ways: at rest; seeded with the app's own demo data (so tabs have
// something to draw); and crawled — every tab-like control and every button that opens a dialog
// is pressed once and the screen it produces is measured, then the dialog is put away.

const ADMIN = () => { window.isAdmin = true; window._authResolved = true; onAdminStateChanged(); };
const settle = (page, ms = 700) => page.waitForTimeout(ms);

async function asAdmin(page) { await page.evaluate(ADMIN); await settle(page, 500); }
async function home(page) { await page.evaluate(() => { try { backToHub({ plain: true }); } catch (e) { try { backToHub(); } catch (_) {} } }); await settle(page, 450); }

async function openAppFrame(page, id, ms = 1600) {
  await page.evaluate(i => openApp(i), id);
  await settle(page, ms);
  const h = await page.$(`#frame-${id}`); const fr = h ? await h.contentFrame() : null;
  if (fr) { try { await fr.waitForLoadState('domcontentloaded'); } catch (e) {} await fr.evaluate(() => 0).catch(() => {}); }
  if (fr) await dismissFirstRun(page, fr);
  return fr;
}

// Things that appear once, on purpose, on a fresh device: Labbook's backup note, the tour.
async function dismissFirstRun(page, fr) {
  await fr.evaluate(() => {
    try { document.querySelectorAll('.modal-back.open').forEach(m => { const ok = m.querySelector('button.primary, .btn.primary, button'); if (ok && /ok|got it|close|skip|done/i.test(ok.textContent)) ok.click(); }); } catch (e) {}
    try { if (window.tourEnd) tourEnd(true); } catch (e) {}
  }).catch(() => {});
  await page.evaluate(() => { try { document.querySelectorAll('#hub-dlg.open button').forEach(b => /ok|got it|close/i.test(b.textContent) && b.click()); } catch (e) {} }).catch(() => {});
}

// What each app needs to have something on screen. JS the app itself defines; a miss is ignored.
const SEEDS = {
  echo: ['loadTestData()'],
  deg: ['loadTestData()'],
  spectra: ['loadTestData()'],
  beacon: ["loadTestData('gain')"],
  lumina: ['loadLuminaTestData()'],
  hitfinder: ['loadHitFinderTestData()'],
  dna: ['loadSeqExample()', 'loadTrExample()', 'loadRtExample()'],
  pt: ['loadExample()'],
  protocols: ["openProtocol('gibson')"],
  ribbon: ["document.querySelector('.example-chip[data-pdb=\"1CRN\"]').click()"],
  // a synthetic blot: a grey field with two rows of bands, handed to the app the way a picked file is
  blot: [`(async()=>{ const c=document.createElement('canvas'); c.width=640; c.height=240; const x=c.getContext('2d'); x.fillStyle='#e6e6e6'; x.fillRect(0,0,640,240);
      for(let i=0;i<12;i++){ x.fillStyle='rgba(25,25,25,'+(0.25+0.05*i)+')'; x.fillRect(30+i*48,90,34,22); x.fillStyle='rgba(25,25,25,.7)'; x.fillRect(30+i*48,170,34,14); }
      const b=await new Promise(r=>c.toBlob(r,'image/png')); loadImageFile(0,new File([b],'blot.png',{type:'image/png'})); })()`],
  cellarchive: ["document.querySelector('.cell-tile').click()"],
};
// Pressed by label when the app has no such function.
const SEED_WAIT = { ribbon: 5000, blot: 1500 };   // ms after seeding: Ribbon fetches the structure from RCSB
const SEED_BUTTONS = { protocols: null };

const DENY = /delete|remove|clear|reset|erase|discard|wipe|sign ?out|log ?out|download|export|print|upload|import|trash|^x$|^✕$|^×$|new project|resign|kill|drop\b/i;
const CLOSE = /^(close|cancel|done|ok|got it|dismiss|skip|✕|×|x|back|never mind)$/i;

// Press, once each, everything that looks like it changes the screen; measure what it produced.
async function crawl(page, fr, measure, label, { max = 22, defer = null } = {}) {
  const visited = new Set();
  for (let step = 0; step < max; step++) {
    const pick = await fr.evaluate(({ deny, visitedKeys, defer }) => {
      const D = new RegExp(deny, 'i');
      const Df = defer ? new RegExp(defer, 'i') : null;
      const sel = 'button,[role=tab],[role=button],.tab,.tab-btn,.nav-tab,.outer-tab,.dtab,.seg-btn,.chip,.pill,a[onclick],[onclick]';
      const list = [];
      const shown = el => { for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4; };
      document.querySelectorAll(sel).forEach(el => {
        if (['INPUT', 'SELECT', 'TEXTAREA', 'HTML', 'BODY'].includes(el.tagName)) return;
        if (!shown(el)) return;
        const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) return;
        const t = (el.textContent || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 34) return;
        if (D.test(t) || D.test(el.getAttribute('onclick') || '')) return;
        const key = el.tagName + '|' + t + '|' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '');
        if (visitedKeys.includes(key)) return;
        list.push({ key, t, top: r.top, left: r.left });
      });
      if (!list.length) return null;
      // things that leave the screen the others live on are pressed last
      const c = (Df && list.find(x => !Df.test(x.t))) || list[0];
      // mark the chosen node so the click below is on exactly it
      document.querySelectorAll('[data-crawl]').forEach(n => n.removeAttribute('data-crawl'));
      const all = [...document.querySelectorAll(sel)].filter(el => { const t = (el.textContent || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim(); const k = el.tagName + '|' + t + '|' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''); return k === c.key && shown(el); });
      if (all[0]) all[0].setAttribute('data-crawl', '1');
      return { key: c.key, t: c.t };
    }, { deny: DENY.source, visitedKeys: [...visited], defer: defer && defer.source }).catch(() => null);
    if (!pick) break;
    visited.add(pick.key);
    await fr.evaluate(() => { const el = document.querySelector('[data-crawl]'); if (el) { try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} el.click(); } }).catch(() => {});
    await settle(page, 380);
    await measure(`${label}:${pick.t.slice(0, 22)}`, fr, { audits: false });
    // put away whatever it opened, so the next press starts from the same place
    await fr.evaluate(re => {
      const C = new RegExp(re, 'i');
      // any fixed layer filling most of the screen is a dialog: press its close/done/cancel
      const layers = [...document.querySelectorAll('body *')].filter(n => { const cs = getComputedStyle(n); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = n.getBoundingClientRect(); return r.width * r.height >= 0.4 * innerWidth * innerHeight && !n.classList.contains('app-view'); });
      layers.forEach(m => { const b = [...m.querySelectorAll('button,[role=button],.x,.close,[class*=close]')].find(x => C.test((x.textContent || x.getAttribute('aria-label') || x.title || '').trim())); if (b) b.click(); });
    }, CLOSE.source).catch(() => {});
    await fr.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).catch(() => {});
    await settle(page, 150);
  }
}

// A screen that cannot be drawn honestly in portrait carries a note asking for the phone to be
// turned. This checks the whole contract: in portrait the note is on screen, readable, and the
// thing it stands in for is NOT (so nothing unreadable is drawn); in landscape it is the other way
// round. Each entry says how to reach the state and what marks the note and the thing.
const GATES = [
  { app: 'lumina', how: "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='384-well').click()", note: '#lm-rotate', thing: '#lm-body' },
  { app: 'labbook', how: "(()=>{ const P=LB.data.projects[0], s=P.sections[0]; selectNode('expsec',P.id,s.id); openNew(); document.getElementById('nm-type').value='HB'; nmUpdateCode(); nmResetSetup(); nmProtos(); document.getElementById('nm-title').value='t384'; nmPreview(); createExperiment(); const ids=Object.keys(LB.data.experiments), id=ids[ids.length-1]; LB.data.experiments[id].plate={format:'384',title:'p',types:[],wells:{}}; openPlateEditor('exp:'+id); })()", note: '#pl-rotate', thing: '.pl-gridwrap', cleanup: 'closePlateEditor()' },
  { app: 'pd',     how: "setFormat('384')",                                                                           note: '#pd-rotate', thing: '#plate-scroll-area' },
];

export const APPS = ['echo', 'hitfinder', 'deg', 'pd', 'dna', 'pt', 'spectra', 'cryo', 'cuppa', 'beacon', 'lumina', 'ribbon', 'protocols', 'cellarchive', 'incubator', 'blot'];

export const SCENARIOS = [
  { id: 'visitor', async run({ measureOn, fresh }) {
      // the signed-out public face: title, discover box, unlock — a page of its own, no admin anywhere
      const pg = await fresh({ visitor: true });
      await measureOn(pg, 'home');
      await pg.close();
  } },
  { id: 'shell', async run({ page, measure }) {
      await asAdmin(page);
      await measure('home');
      for (const ws of ['analysis', 'archive', 'cells', 'more']) {
        await page.evaluate(w => wsGo(w), ws); await settle(page, 700);
        await measure('landing-' + ws);
      }
      await page.evaluate(() => wsGo('planner')); await settle(page, 1500);
      const lb = await page.$('#frame-labbook').then(h => h && h.contentFrame());
      if (lb) await dismissFirstRun(page, lb);
      await measure('planner', lb);
  } },
  { id: 'settings', async run({ page, measure }) {
      await asAdmin(page);
      await page.evaluate(() => toggleOpts()); await settle(page, 600);
      await measure('open');
      const n = await page.$$eval('#settings-back .set-tab', els => els.length);
      for (let i = 0; i < n; i++) { await page.evaluate(k => document.querySelectorAll('#settings-back .set-tab')[k].click(), i); await settle(page, 350); await measure('tab' + i); }
      await page.evaluate(() => closeSettings()); await settle(page, 400);
  } },
  { id: 'search', async run({ page, measure }) {
      await asAdmin(page);
      await page.evaluate(() => { try { openSpot(); } catch (e) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })); } });
      await settle(page, 500);
      await measure('open');
      await page.keyboard.type('west'); await settle(page, 500);
      await measure('typed');
      await page.keyboard.press('Escape'); await settle(page, 300);
  } },
  { id: 'rotate', async run({ page, ctx, measure, report }) {
      const portrait = ctx.h > ctx.w && ctx.w <= 640;
      await asAdmin(page);
      for (const g of GATES) {
        const fr = await openAppFrame(page, g.app);
        await fr.evaluate(g.how).catch(() => {});
        await settle(page, 700);
        const st = await fr.evaluate(({ note, thing }) => {
          const on = sel => { const e = document.querySelector(sel); if (!e) return null; let n = e; for (; n && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; };
          return { note: on(note), thing: on(thing) };
        }, g).catch(() => ({}));
        if (portrait && st.note !== true) report(`${g.app}-384`, `unfit: in portrait the 384-well plate has no "turn your phone" note (${g.note} not visible)`);
        if (portrait && st.thing === true) report(`${g.app}-384`, `unfit: in portrait the 384-well plate is drawn as well as the note (${g.thing} still visible)`);
        if (!portrait && st.note === true) report(`${g.app}-384`, `unfit: the "turn your phone" note shows although the phone is already wide enough`);
        if (!portrait && st.thing === false) report(`${g.app}-384`, `unfit: the 384-well plate is not drawn in landscape (${g.thing} not visible)`);
        await measure(`${g.app}-384`, fr, { audits: false });
        if (g.cleanup) await fr.evaluate(g.cleanup).catch(() => {});
        await home(page);
      }
  } },
  ...APPS.map(id => ({ id, async run({ page, measure }) {
      await asAdmin(page);
      const fr = await openAppFrame(page, id);
      await measure('rest', fr);
      // seed with demo data so the tabs have something to draw
      let seeded = false;
      for (const js of (SEEDS[id] || [])) { try { await fr.evaluate(js); seeded = true; await settle(page, SEED_WAIT[id] || 500); } catch (e) {} }
      if (SEED_BUTTONS[id]) { seeded = await fr.evaluate(re => { const R = new RegExp(re, 'i'); const b = [...document.querySelectorAll('button')].find(x => R.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }, SEED_BUTTONS[id].source).catch(() => false) || seeded; await settle(page, 500); }
      if (id === 'echo' && seeded) {
        // the Review step, before anything is run
        await fr.evaluate("switchSetupTab('review')").catch(() => {}); await settle(page, 2500); await measure('review', fr);
        await fr.evaluate('runPipeline()').catch(() => {}); await settle(page, 7000);
        // a second analysis of the same files gives History a version to show and Compare something to compare
        await fr.evaluate("document.getElementById('p-r2').value='0.9'; runPipeline()").catch(() => {}); await settle(page, 7000);
        await fr.evaluate('try{closeSetupModal()}catch(e){}').catch(() => {}); await settle(page, 400);
        await fr.evaluate("document.querySelector('.tab[data-tab=\"history\"]').click()").catch(() => {}); await settle(page, 900); await measure('history', fr);
        await fr.evaluate("(()=>{const r=Object.values(_hx.runs).sort((a,b)=>a.ver-b.ver); if(r.length>1) hxCompare(r[0].id,r[1].id);})()").catch(() => {}); await settle(page, 1000); await measure('compare', fr);
        await fr.evaluate("hxCloseCompare(); document.querySelector('.tab[data-tab=\"results\"]').click()").catch(() => {}); await settle(page, 400);
      }
      if (seeded) await measure('seeded', fr);
      await crawl(page, fr, measure, 'crawl', { max: id === 'echo' ? 34 : 22, defer: id === 'echo' ? /gradient planner/ : null });
      await home(page);
  } })),
];
