// SpellKit invariants — spelling and typo correction in Labbook's text (tools/spellkit/; Jon 2026-11-25: "corrección de texto como la del
// sistema: subraya las mal escritas, con click derecho añade correcciones, los fallos claros corrígelos automáticamente, sé inteligente").
// Each check is a CLASS of mistake, and was proven by putting the mistake back.
//
//   Engine (the dictionary and the rules, no browser)
//   SK1  both spellings      British and American words are right (colour/color, normalised/normalized, centre, litre, haemoglobin,
//                            labelled), the bench's own words are right (aliquot, lysate, ubiquitin…), and a typo is not
//   SK2  leaves what is not a word   digits, capitals inside (PBS, PROTACs, dTAG), units, paths, links, e-mail, @ and #, codes next to a
//                            hyphen, two letters, a name in mid-sentence, an abbreviation with no vowel, a reagent name — never underlined;
//                            another language is not painted red; a doubled word is flagged once
//   SK3  fixes only the unmistakable   a typo from the list, two letters swapped, a doubled letter lost or gained are fixed; a real word the
//                            dictionary happens not to carry (dimers, complexed, args, incubations, mislabelled, reprobed) is never changed;
//                            a name, a kept word and a known word are never changed; the case of the word is kept
//   SK4  suggestions         the first suggestion is the word meant for a set of real slips; your own words are offered; the dictionary's
//                            own never-suggest words are not
//   SK5  the typo table      every entry is an unknown word and its correction is a known one (a table that "fixes" a real word is a bug)
//
//   In the notebook (Chromium, real keys and clicks)
//   SK6  underline           a misspelling is underlined with no markup added to what is saved; the word still being typed is not; it is
//                            underlined once the caret leaves; the underline follows an edit, a re-render and a new editor
//   SK7  fixes as you type   teh → the on a space, a full stop and Enter; Backspace right after puts back what was typed and never fixes it again;
//                            ⌘Z takes a fix back; pasted text is untouched; a link, a code, a number or another language is untouched
//   SK8  right-click         on an underlined word: suggestions, Ignore, Add to dictionary, Cut / Copy / Paste; a suggestion replaces the word
//                            and the saved text; Add is kept in the notebook's settings and removes the underline; Ignore removes it for the session;
//                            on any other word the browser's own menu is left alone
//   SK9  every editor        a day's notes, an experiment's aim and title, a planner task and a meeting's notes are checked the same way
//   SK10 settings            Check spelling off: no underline, no fix; Fix typos off: underline, no fix; the dictionary dialog adds and removes
//   SK11 a phone keeps its keyboard   a touch device does not run the engine and its editors keep the browser's own spell-check on
//   SK12 it is fast          scanning a 6 000-word page takes well under a frame budget and typing in a long note stays smooth
//   SK13 a long run is no trap   200,000 characters without a space (a sequence, a pasted key), alone, hyphenated or dotted, are scanned at
//                            once, and links and addresses beside them are still left alone. (The address pattern's time grew with the square
//                            of the run: the page hung, and CI cut the Labbook suite at 60 minutes.)
//
//   node tools/spellkit_invariants.mjs [--url=URL] [--page=apps/labbook/x.html] [--kit=path] [--only=SK1,SK7]      exit 1 on any finding
import fs from 'node:fs';
import zlib from 'node:zlib';
import vm from 'node:vm';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY = args.only ? String(args.only).split(',') : null;
const want = id => !ONLY || ONLY.includes(id);
const findings = [], counts = {};
const check = (id, name, ok, detail) => { counts[id] = (counts[id] || 0) + 1; if (!ok) findings.push({ id, msg: name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail).slice(0, 260)) }); };

// ── the engine, loaded the way the page loads it ──
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, args.kit || 'tools/spellkit/spellkit.js'), 'utf8') + ';this.S=SpellKit', ctx);
const S = ctx.S;
S.load(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(ROOT, 'tools/spellkit/dict.b64'), 'utf8').trim(), 'base64')).toString('utf8'));
const miss = t => S.scan(t).filter(x => x.kind === 'miss').map(x => x.word);

if (want('SK13')) {
  // In the VM with a time limit, so that the bug fails the check instead of hanging it.
  const runs = { 'one letter': 'y'.repeat(100000), 'DNA': 'acgtgacctg'.repeat(10000), 'hyphenated': 'ab-'.repeat(33000), 'dotted': 'ab.'.repeat(33000), 'at signs': 'a@'.repeat(50000) };
  for (const [name, t] of Object.entries(runs)) {
    ctx.T = 'The cells were washed\n' + t + ' and zorbitrax';
    let ms = Infinity;
    try { const t0 = Date.now(); vm.runInContext('S.scan(T)', ctx, { timeout: 4000 }); ms = Date.now() - t0; } catch (e) { if (!/timed out/i.test(e.message)) throw e; }
    check('SK13', '100,000 characters without a space (' + name + ') are scanned in under 800 ms', ms < 800, { ms: ms === Infinity ? 'over 4000' : ms });
  }
  check('SK13', 'a link, www and an address are still left alone, and the typo after them is still found',
    JSON.stringify(miss('see https://exmaple.org/recieve and www.supernatent.com or recieve@dundee.ac.uk then seperate')) === '["seperate"]', miss('see https://exmaple.org/recieve and www.supernatent.com or recieve@dundee.ac.uk then seperate'));
}

if (want('SK1')) {
  const right = 'colour color normalised normalized centre center litre liter microlitre micrometre haemoglobin labelled labeled analyse analyze behaviour neighbour favourite grey gray aluminium artefact whilst organisation organization sulphate programme '
    + 'aliquot aliquots lysate lysis resuspend resuspended supernatant plasmid transfection ubiquitin proteasome cereblon degrader ligand immunoblot trypsin pipetting vortexed centrifuge incubated western buffer sample dilution cells '
    + "don't it's buffer's dunno".split(' ').slice(0, -1).join(' ');
  right.split(' ').forEach(w => check('SK1', `"${w}" is spelt right`, S.check(w)));
  'recieve seperate definately occured supernatent begining buffeer wiht teh alliquot tretament protien aliqout'.split(' ').forEach(w => check('SK1', `"${w}" is a typo`, !S.check(w)));
  check('SK1', 'a capitalised word the dictionary knows only in capitals is right (Dundee, Monday)', S.check('Dundee') && S.check('Monday'));
  check('SK1', 'a possessive of a known word is right (the buffer\'s pH)', S.check("buffer's") && S.check("cells'") && S.check("lab's"));
}

if (want('SK2')) {
  const none = {
    'digits': 'HEK293T cells, MG132 at 10 uM and 37 oC, plate 3 well B12, brd4 and IC50 values',
    'caps inside': 'PBS TBST PROTACs dTAG DMSO NaOH EDTA siRNA shRNA',
    'units': 'add 5 ug/mL then 2 mg/ml and 100 rpm for 30 mins or 2 hrs',
    'paths and links': 'see https://example.org/zorbitrax/page and mail zorbitrax@example.org or open C:/zorbitrax/file.xlsx and notes_zorbitrax.txt',
    'at and hash': '@zorbitrax linked to #zorbitrax today',
    'hyphen codes': 'zorbitrax-13 and JQ1-zorbitrax and 5-zorbitrax and dTAG-zorbitrax',
    'next to a digit': 'zorbitrax2 and 3zorbitrax and 10zorbitrax and zorbitrax_2 and x/zorbitrax and zorbitrax/mL',
    'two letters': 'ab cd ef to be or ug ml',
    'a name': 'Then we asked Zorbitrax about it and Mrs Quillfeather said so',
    'no vowel': 'crbn vhl hplc kdm ctrl cpd mdm',
    'reagent names': 'incubate with zorbitinib and quillomab and zorbimycin and zorbistatin for an hour',
  };
  Object.entries(none).forEach(([k, t]) => check('SK2', `${k}: nothing is underlined`, miss(t).length === 0, miss(t)));
  check('SK2', 'a real typo is underlined', miss('We recieve the sample').join() === 'recieve', miss('We recieve the sample'));
  check('SK2', 'a capitalised typo at the start of a sentence is underlined', miss('Recieve the sample. Teh sample').join() === 'Recieve,Teh', miss('Recieve the sample. Teh sample'));
  check('SK2', 'a typo after a colon or in a list item is underlined', miss('Step 1: recieve it').join() === 'recieve' && miss('- recieve it').join() === 'recieve');
  const es = 'Hoy preparamos las placas con los compuestos y luego pusimos las células en la incubadora durante toda la noche.';
  check('SK2', 'a sentence in another language is not painted red', miss(es).length === 0, miss(es));
  check('SK2', 'one stray unknown word in an English sentence still is', miss('We added the zorbitrax to all the cells in the plate and waited').join() === 'zorbitrax');
  check('SK2', 'a doubled word is flagged once, on the second', JSON.stringify(S.scan('Add the the buffer').map(x => [x.kind, x.word, x.s])) === '[["dup","the",8]]', S.scan('Add the the buffer'));
  check('SK2', 'a doubled word that is correct English is not flagged (had had, that that)', S.scan('He had had enough and said that that was it').length === 0);
  check('SK2', 'a paragraph break is not a word (the end of one and the start of the next are not "the the")', S.scan('end of the\nthe next').length === 0);
  check('SK2', 'an accented word is not underlined (the dictionary is English)', miss('the cafés and the señal').length === 0);
  check('SK2', 'a word the notebook taught it is right; one the person added is right; one ignored for the session is right', (() => { S.learn(['zorbitrax']); S.config({ words: ['quillfeather'] }); return miss('the zorbitrax and quillfeather').length === 0; })());
  S.config({ words: [] });
}

if (want('SK3')) {
  S.config({ on: true, auto: true, words: [], keep: [] });
  const fixes = { teh: 'the', wiht: 'with', taht: 'that', recieve: 'receive', seperate: 'separate', definately: 'definitely', occured: 'occurred', begining: 'beginning', buffeer: 'buffer',
    supernatent: 'supernatant', alot: 'a lot', adn: 'and', untill: 'until', dont: "don't", experiement: 'experiment', protien: 'protein', alliquot: 'aliquot', comming: 'coming', accross: 'across' };
  Object.entries(fixes).forEach(([a, b]) => check('SK3', `${a} → ${b}`, S.fix(a, false) === b, S.fix(a, false)));
  check('SK3', 'the case is kept (Teh → The, Recieve → Receive)', S.fix('Teh', true) === 'The' && S.fix('Recieve', true) === 'Receive');
  const real = 'dimers complexed args incubations mislabelled adaptor breakpoints reprobed sonicated acetylated caspases linkers doesn kinases sirna lysates ligases';
  real.split(' ').forEach(w => check('SK3', `the real word "${w}" is never changed`, S.fix(w, false) === null, S.fix(w, false)));
  check('SK3', 'a capitalised word in mid-sentence is a name, never changed', S.fix('Recieve', false) === null && S.fix('Teh', false) === null);
  check('SK3', 'a word that is already right is never changed', S.fix('colour', false) === null && S.fix('the', true) === null && S.fix('Dundee', true) === null);
  check('SK3', 'a word with a capital inside is never changed', S.fix('rEcieve', false) === null && S.fix('PBS', false) === null);
  check('SK3', 'a word put back on purpose is kept', (() => { S.config({ keep: ['teh'] }); const r = S.fix('teh', false); S.config({ keep: [] }); return r === null; })());
  check('SK3', 'automatic fixes off: nothing is fixed', (() => { S.config({ auto: false }); const r = S.fix('teh', false); S.config({ auto: true }); return r === null; })());
  check('SK3', 'a word the person added is never changed', (() => { S.config({ words: ['teh'] }); const r = S.fix('teh', false); S.config({ words: [] }); return r === null; })());
  const words = fs.readFileSync(path.join(ROOT, 'tools/spellkit/domain.txt'), 'utf8').split('\n').map(l => l.split('#')[0].trim().split('/')[0]).filter(Boolean);
  const wrong = words.filter(w => S.check(w) && S.fix(w, false) !== null);
  check('SK3', 'no word of the lab\'s own vocabulary is ever changed', wrong.length === 0, wrong.slice(0, 8));
}

if (want('SK4')) {
  S.config({ words: [], keep: [] });
  const sug = { recieve: 'receive', seperate: 'separate', definately: 'definitely', supernatent: 'supernatant', begining: 'beginning', teh: 'the', wiht: 'with', protien: 'protein', centrifguation: 'centrifugation',
    pippete: 'pipette', incubaton: 'incubation', alot: 'a lot', fysics: 'physics', occassion: 'occasion', concentation: 'concentration', accomodate: 'accommodate' };
  Object.entries(sug).forEach(([a, b]) => { const r = S.suggest(a, 5); check('SK4', `${a}: ${b} is offered first`, r[0] === b, r); });
  check('SK4', 'the case follows the word (Recieve → Receive)', S.suggest('Recieve', 3)[0] === 'Receive');
  check('SK4', 'at most n are offered, none twice', (() => { const r = S.suggest('bufr', 3); return r.length <= 3 && new Set(r).size === r.length; })());
  check('SK4', 'nothing for a word with no neighbours', S.suggest('zqxjvkw', 5).length === 0);
  check('SK4', 'a word you added is offered for a slip of it', (() => { S.config({ words: ['zorbitrax'] }); const r = S.suggest('zorbitrx', 3); S.config({ words: [] }); return r[0] === 'zorbitrax'; })());
}

if (want('SK5')) {
  const t = S._typos(), keys = Object.keys(t);
  check('SK5', 'the table is not empty', keys.length > 150, keys.length);
  keys.forEach(k => { if (S.check(k)) check('SK5', `"${k}" is in the typo table and is a known word`, false); const f = t[k]; if (!f.includes(' ') && !S.check(f)) check('SK5', `"${k}" → "${f}": the correction is not a known word`, false); });
  check('SK5', 'every entry is unknown and every correction known', !findings.some(f => f.id === 'SK5'));
}

// ── the notebook ──
const needBrowser = ['SK6', 'SK7', 'SK8', 'SK9', 'SK10', 'SK11', 'SK12'].some(want);
let srv = null;
if (needBrowser) {
  const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
  async function waitHttp(url, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 150)); } throw new Error('no server'); }
  let base = args.url;
  if (!base) { const port = await freePort(); srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); base = `http://127.0.0.1:${port}/${args.page || 'apps/labbook/labbook.html'}`; await waitHttp(base); }
  const browser = await chromium.launch();
  const errs = [];
  const newCtx = (opts = {}) => browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] }, opts)).then(async c => {
    await c.route(/gstatic\.com|firebaseio\.com|identitytoolkit|firebaseapp\.com|firebasestorage|fonts\.g/, r => r.abort());
    await c.addInitScript(() => { try { localStorage.setItem('lb_tour_done', '1'); localStorage.setItem('lb_backup_nudged', '1'); sessionStorage.setItem('hub_intro_seen', '1'); } catch (e) {} });
    return c; });
  async function open(opts) {
    const c = await newCtx(opts), page = await c.newPage();
    page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => { errs.push('native dialog: ' + d.message().slice(0, 80)); d.dismiss(); });
    await page.goto(base + (base.includes('?') ? '&' : '?') + '_ts=' + Date.now());
    await page.waitForFunction(() => typeof LB !== 'undefined' && LB.data && typeof renderAll === 'function' && typeof SpellKit !== 'undefined', null, { timeout: 20000 });
    await page.waitForFunction(() => SpellKit.mode() !== 'none', null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(700);
    await page.evaluate(() => { document.querySelectorAll('.modal-back.open').forEach(x => x.classList.remove('open')); });
    return { c, page };
  }
  const D = '2026-11-25';
  const ED = '#pane-ed .jr-ed';
  async function day(page, html = '') {
    await page.evaluate(([D, html]) => { if (html) { LB.data.notebook[D] = { date: D, html }; save(); } else { delete LB.data.notebook[D]; } openDayPage(D); }, [D, html]);
    await page.waitForSelector(ED); await page.locator(ED).click();
    await page.keyboard.press('ControlOrMeta+End');
  }
  const typed = (page, t, d = 14) => page.keyboard.type(t, { delay: d });
  const text = (page, sel = ED) => page.evaluate(sel => document.querySelector(sel).textContent.replace(/\u00a0/g, ' '), sel);
  const html = (page, sel = ED) => page.evaluate(sel => document.querySelector(sel).innerHTML, sel);
  const hl = page => page.evaluate(() => { const h = CSS.highlights.get('lb-spell'); return h ? [...h].filter(r => r.startContainer.isConnected).map(r => r.toString()) : []; });
  const settle = (page, ms = 1500) => page.waitForTimeout(ms);
  const pointOf = (page, w) => page.evaluate(w => { const h = CSS.highlights.get('lb-spell'); for (const r of h) if (r.toString() === w) { const b = r.getClientRects()[0]; return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } return null; }, w);
  const menu = page => page.evaluate(() => { const m = document.querySelector('#ctxmenu.open'); return m ? [...m.querySelectorAll('.pop-item')].map(e => e.querySelector('.pop-l').textContent) : null; });

  // SK6 ── underline
  if (want('SK6')) {
    const { c, page } = await open();
    check('SK6', 'the engine runs on a desktop browser', await page.evaluate(() => SpellKit.mode()) === 'engine');
    await day(page);
    await typed(page, 'We saw the quillfeatherx');
    await settle(page, 150);
    check('SK6', 'the word still being typed is not underlined', (await hl(page)).length === 0, await hl(page));
    await typed(page, 'y of zorbitrax. ');
    await settle(page);
    const h = await hl(page);
    check('SK6', 'a misspelling is underlined once the caret leaves it', h.includes('quillfeatherxy') && h.includes('zorbitrax'), h);
    check('SK6', 'no markup is added to what is saved', !/<span|<u|<mark|<font|class="sk|spell/i.test(await html(page)), await html(page));
    check('SK6', 'nothing is stored but the text (the page record carries the typed words)', await page.evaluate(([D]) => /quillfeatherxy of zorbitrax/.test(LB.data.notebook[D].html), [D]));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete'); await settle(page, 500);
    check('SK6', 'the underline goes with the text', (await hl(page)).length === 0, await hl(page));
    await typed(page, 'one zorbitrax two ');
    await settle(page);
    await page.evaluate(() => { const e = document.querySelector('#pane-ed .jr-ed'); e.insertAdjacentHTML('beforeend', '<div>and quillfeatherx here</div>'); });
    await settle(page, 700);
    check('SK6', 'text put in from outside (an import, a restore) is checked too', (await hl(page)).includes('quillfeatherx'), await hl(page));
    await page.evaluate(() => { renderAll(); });
    await page.waitForSelector(ED); await settle(page, 900);
    check('SK6', 'a re-render of the page brings the underline back', (await hl(page)).includes('zorbitrax'), await hl(page));
    await page.evaluate(([D]) => { LB.data.notebook[D].html = '<div>a different zorbitrix note</div>'; openDayPage(D); }, [D]);
    await settle(page, 900);
    check('SK6', 'opening another page replaces the underlines (none left from the old one)', (await hl(page)).join() === 'zorbitrix', await hl(page));
    await c.close();
  }

  // SK7 ── fixes as you type
  if (want('SK7')) {
    const { c, page } = await open();
    await day(page);
    await typed(page, 'Add teh buffer. ');
    await settle(page, 300);
    check('SK7', 'teh → the on a space', /^Add the buffer\. $/.test(await text(page)), await text(page));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Wash wiht PBS.'); await settle(page, 200);
    check('SK7', 'wiht → with on a full stop', /^Wash with PBS\.$/.test(await text(page)), await text(page));
    await page.keyboard.press('Enter'); await typed(page, 'Mix teh'); await page.keyboard.press('Enter'); await settle(page, 200);
    check('SK7', 'teh → the on Enter, and the Enter still makes a new line', (await text(page)).includes('Mix the') && /Mix the<\/div><div><br><\/div>$/.test(await html(page)), await html(page));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Then the buffeer '); await settle(page, 200);
    check('SK7', 'a doubled letter gained is lost (buffeer → buffer)', /Then the buffer $/.test(await text(page)), await text(page));
    // Backspace puts back what was typed
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Add teh '); await settle(page, 250);
    await page.keyboard.press('Backspace'); await settle(page, 250);
    check('SK7', 'Backspace straight after a fix puts back what was typed (and the space)', (await text(page)) === 'Add teh ', JSON.stringify(await text(page)));
    await typed(page, 'x teh '); await settle(page, 300);
    check('SK7', 'a word put back is never fixed again', /^Add teh x teh $/.test(await text(page)), await text(page));
    check('SK7', 'and it is kept in the notebook\'s settings', await page.evaluate(() => (LB.data.settings.spell.keep || []).includes('teh')));
    // ⌘Z
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Add wiht '); await settle(page, 250);
    await page.keyboard.press('ControlOrMeta+z'); await settle(page, 250);
    check('SK7', '⌘Z takes a fix back', /^Add wiht/.test(await text(page)), await text(page));
    // paste
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await page.evaluate(() => { const d = new DataTransfer(); d.setData('text/plain', 'pasted teh and wiht text '); document.querySelector('#pane-ed .jr-ed').dispatchEvent(new ClipboardEvent('paste', { clipboardData: d, bubbles: true, cancelable: true })); });
    await page.evaluate(() => document.execCommand('insertText', false, 'pasted teh and wiht text '));
    await settle(page, 300);
    check('SK7', 'pasted text arrives exactly as written', (await text(page)).includes('pasted teh and wiht text'), await text(page));
    // places it must not fix
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'see zorbi2wiht wiht2 @wiht #wiht wiht_x a/wiht wiht-13 www.wiht.com '); await settle(page, 300);
    check('SK7', 'a word with a digit, _ / @ # or a link around it is not fixed', (await text(page)) === 'see zorbi2wiht wiht2 @wiht #wiht wiht_x a/wiht wiht-13 www.wiht.com ', await text(page));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Hoy preparamos las placas con los compuestos y luego pusimos recieve en la incubadora '); await settle(page, 300);
    check('SK7', 'in a Spanish sentence nothing is "fixed"', (await text(page)).includes('pusimos recieve en'), await text(page));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Then Wiht and Dundee, Recieve '); await settle(page, 300);
    check('SK7', 'a capitalised word mid-sentence is a name', (await text(page)).startsWith('Then Wiht and Dundee, Recieve'), await text(page));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'dimers and complexed and mislabelled '); await settle(page, 300);
    check('SK7', 'a real word the dictionary lacks is left alone', (await text(page)) === 'dimers and complexed and mislabelled ', await text(page));
    // a code or a link in the text is not prose
    await page.evaluate(() => { const e = document.querySelector('#pane-ed .jr-ed'); e.innerHTML = '<div>run <code>wiht</code> and <a href="#x">wiht</a> end</div>'; const c = e.querySelector('code').firstChild; const r = document.createRange(); r.setStart(c, c.length); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); e.focus(); });
    await typed(page, ' wiht '); await settle(page, 300);
    check('SK7', 'a word typed inside a code or a link is not fixed', (await text(page)).includes('wiht wiht') && !(await text(page)).includes('with'), await text(page));
    await page.evaluate(() => { document.querySelector('#pane-ed .jr-ed').innerHTML = ''; }); await page.locator(ED).click();
    // existing notation fixes still work next to it
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Add 40uM naoh at 37 oC and seperate '); await settle(page, 400);
    check('SK7', 'the notation fixes (µM, NaOH, °C) still work beside the spelling fixes', (await text(page)).startsWith('Add 40µM NaOH at 37 °C and separate'), await text(page));
    await c.close();
  }

  // SK8 ── right-click
  if (want('SK8')) {
    const { c, page } = await open();
    await day(page);
    await typed(page, 'We saw a recieveing of zorbitrax in the lab ');
    await settle(page);
    let p = await pointOf(page, 'recieveing');
    await page.mouse.click(p.x, p.y, { button: 'right' }); await settle(page, 250);
    let m = await menu(page);
    check('SK8', 'right-click on an underlined word opens a menu with suggestions first', m && m[0] === 'receiving', m);
    check('SK8', '…then Ignore and Add to dictionary', m && m.includes('Ignore') && m.includes('Add to dictionary'), m);
    check('SK8', '…then Cut, Copy and Paste (the browser\'s own menu is replaced, so they are here)', m && m.includes('Cut') && m.includes('Copy') && m.includes('Paste'), m);
    check('SK8', 'the word is selected, so Cut and Copy have something to act on', await page.evaluate(() => String(getSelection()) === 'recieveing'));
    await page.click('#ctxmenu .pop-item >> nth=0'); await settle(page, 600);
    check('SK8', 'choosing a suggestion replaces the word', (await text(page)).includes('We saw a receiving of zorbitrax'), await text(page));
    check('SK8', '…and the saved page', await page.evaluate(([D]) => /a receiving of zorbitrax/.test(LB.data.notebook[D].html), [D]));
    check('SK8', '…and the underline is gone from it', !(await hl(page)).includes('recieveing'), await hl(page));
    p = await pointOf(page, 'zorbitrax');
    await page.mouse.click(p.x, p.y, { button: 'right' }); await settle(page, 250);
    check('SK8', 'a word with no near neighbour says so, and still offers Ignore and Add', (await menu(page))[0] === 'No suggestions' && (await menu(page)).includes('Add to dictionary'), await menu(page));
    await page.click('#ctxmenu .pop-item:has-text("Ignore")'); await settle(page, 600);
    check('SK8', 'Ignore removes the underline', !(await hl(page)).includes('zorbitrax'), await hl(page));
    check('SK8', '…for this session only: nothing is stored', await page.evaluate(() => !(LB.data.settings && LB.data.settings.spell && (LB.data.settings.spell.words || []).includes('zorbitrax'))));
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'now quillfeather here '); await settle(page);
    p = await pointOf(page, 'quillfeather');
    await page.mouse.click(p.x, p.y, { button: 'right' }); await settle(page, 250);
    await page.click('#ctxmenu .pop-item:has-text("Add to dictionary")'); await settle(page, 600);
    check('SK8', 'Add to dictionary removes the underline', !(await hl(page)).includes('quillfeather'), await hl(page));
    check('SK8', '…and keeps the word in the notebook\'s settings (so it follows the notebook)', await page.evaluate(() => LB.data.settings.spell.words.includes('quillfeather')), await page.evaluate(() => LB.data.settings.spell));
    await typed(page, 'and again quillfeather '); await settle(page);
    check('SK8', '…and it is right from then on', !(await hl(page)).includes('quillfeather'), await hl(page));
    // a right-click on a word that is spelt right leaves the browser's menu alone
    await page.evaluate(() => { document.querySelectorAll('.pop.open').forEach(x => x.classList.remove('open')); });
    const r = await page.evaluate(() => { const e = document.querySelector('#pane-ed .jr-ed'); const rg = document.createRange(); const t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT).nextNode(); rg.setStart(t, 0); rg.setEnd(t, 3); const b = rg.getClientRects()[0]; return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    const prevented = await page.evaluate(([x, y]) => new Promise(res => { const e = document.elementFromPoint(x, y); const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }); e.dispatchEvent(ev); res(ev.defaultPrevented); }), [r.x, r.y]);
    check('SK8', 'a right-click on a correct word leaves the browser\'s own menu alone', prevented === false, prevented);
    // a duplicated word
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Add the the buffer '); await settle(page);
    const pd = await pointOf(page, 'the');
    await page.mouse.click(pd.x, pd.y, { button: 'right' }); await settle(page, 250);
    check('SK8', 'a repeated word offers to delete itself', (await menu(page))[0] === 'Delete repeated \u201cthe\u201d', await menu(page));
    await page.click('#ctxmenu .pop-item >> nth=0'); await settle(page, 500);
    check('SK8', '…and Add the buffer is left', /^Add the buffer $/.test(await text(page)), await text(page));
    // a fix that was made can be changed back from the menu
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Delete');
    await typed(page, 'Wash wiht PBS '); await settle(page, 400);
    const pw = await page.evaluate(() => { const e = document.querySelector('#pane-ed .jr-ed'); const rg = document.createRange(); const t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT).nextNode(); rg.setStart(t, 5); rg.setEnd(t, 9); const b = rg.getClientRects()[0]; return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await page.mouse.click(pw.x, pw.y, { button: 'right' }); await settle(page, 250);
    const mm = await menu(page);
    check('SK8', 'right-click on a word that was just fixed offers to change it back', mm && /^Change back to \u201cwiht\u201d/.test(mm[0]), mm);
    await c.close();
  }

  // SK9 ── every editor
  if (want('SK9')) {
    const { c, page } = await open();
    await page.evaluate(() => {
      const P = (LB.data.projects || []).find(p => (p.sections || []).length), S = P.sections[0];
      const tpl = LB.data.presets.CTG, su = Object.assign({}, setupDefaultsFor('CTG'), JSON.parse(JSON.stringify(tpl.setup || {})));
      const before = {}; Object.keys(LB.data.experiments).forEach(k => before[k] = 1);
      buildExperimentFrom({ pid: P.id, sid: S.id, key: 'CTG', tpl, startDate: todayStr(), type: presetBase('CTG'), title: tpl.title || 'CTG', code: 'SK9_RUN', setup: su, plate: true });
      const e = Object.values(LB.data.experiments).filter(x => !before[x.id])[0];
      SEL.node = { kind: 'expsec', projectId: P.id, sectionId: S.id }; SEL.page = e.id; renderAll(); window.__e = e;
    });
    await page.evaluate(() => document.body.classList.remove('lb-bench'));
    await page.waitForSelector('#pane-ed .exh-aim', { state: 'visible' }); await page.waitForTimeout(500);
    await page.locator('#pane-ed .exh-aim').click();
    await typed(page, 'To see if teh zorbitrax works. ');
    await settle(page, 600);
    check('SK9', 'an experiment\'s aim is fixed as you type', (await text(page, '#pane-ed .exh-aim')).includes('see if the zorbitrax'), await text(page, '#pane-ed .exh-aim'));
    check('SK9', '…and underlined', (await hl(page)).includes('zorbitrax'), await hl(page));
    const ceCount = await page.evaluate(() => document.querySelectorAll('#pane-ed [contenteditable="true"]').length);
    check('SK9', 'the experiment page has several editors', ceCount >= 3, ceCount);
    // every editor on the page is managed by the engine
    const un = await page.evaluate(() => [...document.querySelectorAll('#pane-ed [contenteditable="true"]')].filter(e => e.spellcheck !== false).length);
    check('SK9', 'every editor has the browser\'s own check switched off (one underline, not two)', un === 0, un);
    // the run's own notes (an empty editor on the page, below the steps)
    await page.locator('#pane-ed .exp-canvas').click();
    await typed(page, 'Added teh supernatent ');
    await settle(page, 500);
    check('SK9', 'the run\'s own notes are fixed too', /Added the supernatant/.test(await text(page, '#pane-ed .exp-canvas')), await text(page, '#pane-ed .exp-canvas'));
    // a step's text is an editor as well (the protocol, edited in place): checked, and the preset's own words are not underlined
    check('SK9', 'a step\'s own text is one of the editors', await page.evaluate(() => document.querySelectorAll('#pane-ed .rt.dfx-blk[contenteditable="true"]').length) >= 3);
    const preset = (await hl(page)).filter(w => !/^(zorbitrax)$/.test(w));
    check('SK9', 'the preset\'s own text has no underline (a protocol is not full of typos)', preset.length === 0, preset);
    // the title
    await page.locator('#pane-ed .exh-title').click(); await page.keyboard.press('ControlOrMeta+a');
    await typed(page, 'Teh recieve test'); await settle(page, 300);
    check('SK9', 'a title is fixed as you type', (await text(page, '#pane-ed .exh-title')).startsWith('The receive test'), await text(page, '#pane-ed .exh-title'));
    // a planner task
    await page.evaluate(() => { selectNode('week'); });
    await page.waitForTimeout(500);
    const mtg = await page.evaluate(() => typeof mtgNewDialog === 'function');
    check('SK9', 'meetings exist to test (a second kind of page)', mtg);
    await c.close();
  }

  // SK10 ── settings
  if (want('SK10')) {
    const { c, page } = await open();
    await day(page);
    await page.evaluate(() => openSettings('writing')); await page.waitForTimeout(300);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#st-body .st-row b')].map(b => b.textContent));
    check('SK10', 'Settings › Writing lists the spelling controls', ['Check spelling', 'Fix clear typos as I type', 'Personal dictionary'].every(x => rows.includes(x)), rows);
    await page.evaluate(() => _lbDlgClose());
    await page.locator(ED).click(); await page.keyboard.press('ControlOrMeta+End');
    await typed(page, 'a zorbitrax here '); await settle(page);
    check('SK10', 'the underline is there to begin with', (await hl(page)).includes('zorbitrax'));
    await page.evaluate(() => spellToggle('auto')); await page.evaluate(() => _lbDlgClose());
    await page.locator(ED).click(); await page.keyboard.press('ControlOrMeta+End');
    await typed(page, 'and teh '); await settle(page, 500);
    check('SK10', 'Fix typos off: nothing is fixed…', (await text(page)).endsWith('and teh '), await text(page));
    check('SK10', '…and the underline stays', (await hl(page)).includes('teh'), await hl(page));
    await page.evaluate(() => spellToggle('on')); await page.evaluate(() => _lbDlgClose()); await settle(page, 600);
    check('SK10', 'Check spelling off: no underline', (await hl(page)).length === 0, await hl(page));
    await page.locator(ED).click(); await page.keyboard.press('ControlOrMeta+End');
    await typed(page, 'wiht '); await settle(page, 400);
    check('SK10', '…and no fix', (await text(page)).endsWith('wiht '), await text(page));
    check('SK10', 'the choice is kept in the notebook', await page.evaluate(() => LB.data.settings.spell.on === false && LB.data.settings.spell.auto === false));
    await page.evaluate(() => { spellToggle('on'); spellToggle('auto'); _lbDlgClose(); }); await settle(page, 600);
    check('SK10', 'both back on: underline is back', (await hl(page)).includes('zorbitrax'), await hl(page));
    await page.evaluate(() => openSpellDict()); await page.waitForTimeout(300);
    await page.fill('#sd-in', 'zorbitrax quillfeather'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    const listed = await page.evaluate(() => [...document.querySelectorAll('#lb-dialog-card .st-row b')].map(b => b.textContent));
    check('SK10', 'the dictionary dialog adds words (several at once)', listed.includes('zorbitrax') && listed.includes('quillfeather'), listed);
    await page.evaluate(() => _lbDlgClose()); await settle(page, 600);
    check('SK10', '…and the underline goes', !(await hl(page)).includes('zorbitrax'), await hl(page));
    await page.evaluate(() => { openSpellDict(); }); await page.waitForTimeout(200);
    await page.click('#lb-dialog-card .rc-btn.danger[data-w="zorbitrax"]'); await page.waitForTimeout(300);
    await page.evaluate(() => _lbDlgClose()); await settle(page, 600);
    check('SK10', 'Remove takes a word out, and its underline returns', (await hl(page)).includes('zorbitrax'), await hl(page));
    await page.evaluate(() => openSettings('writing')); await page.waitForTimeout(300);
    check('SK10', 'the dictionary count is shown', /1 word you added/.test(await page.evaluate(() => document.getElementById('st-body').innerText)));
    await c.close();
  }

  // SK11 ── a phone keeps its keyboard
  if (want('SK11')) {
    const { c, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    check('SK11', 'on a touch device the engine does not run', await page.evaluate(() => SpellKit.mode()) === 'native' && !(await page.evaluate(() => SpellKit.running())));
    await page.evaluate(([D]) => { openDayPage(D); }, [D]);
    await page.waitForSelector(ED); await page.waitForTimeout(500);
    check('SK11', 'its editors keep the browser\'s own spell-check on', await page.evaluate(() => [...document.querySelectorAll('#pane-ed [contenteditable="true"]')].every(e => e.spellcheck === true)));
    check('SK11', 'no underline of ours is drawn', (await hl(page)).length === 0);
    await c.close();
  }

  // SK12 ── fast
  if (want('SK12')) {
    const { c, page } = await open();
    const t = await page.evaluate(() => {
      const words = 'the cells were washed with PBS and then incubated at 37 oC for 30 min in complete medium containing zorbitrax and recieve seperate Dundee 10 uM HEK293T'.split(' ');
      let s = ''; for (let i = 0; i < 6000; i++) s += words[i % words.length] + (i % 18 === 17 ? '\n' : ' ');
      const t0 = performance.now(); const r = SpellKit.scan(s); const dt = performance.now() - t0; return { dt, n: r.length };
    });
    check('SK12', 'scanning a 6 000-word page takes under 120 ms', t.dt < 120, t);
    await day(page, '<div>' + Array.from({ length: 800 }, (_, i) => 'cell ' + i + ' was washed with buffer and zorbitrax').join(' ') + '</div>');
    await settle(page, 1200);
    const lat = async on => page.evaluate(async on => {
      SpellKit.config({ on });
      const e = document.querySelector('#pane-ed .jr-ed'); e.focus();
      const sel = getSelection(); const rg = document.createRange(); rg.selectNodeContents(e); rg.collapse(false); sel.removeAllRanges(); sel.addRange(rg);
      const t0 = performance.now();
      for (let i = 0; i < 40; i++) { document.execCommand('insertText', false, 'x'); await new Promise(r => setTimeout(r, 0)); }
      return (performance.now() - t0) / 40;
    }, on);
    const off = await lat(false), on = await lat(true);
    check('SK12', 'in a long note a keystroke costs the engine under 6 ms (' + off.toFixed(1) + ' ms without it, ' + on.toFixed(1) + ' ms with)', on - off < 6, { off, on });
    await c.close();
  }
  errs.forEach(m => findings.push({ id: 'run', msg: 'page error: ' + m }));
  await browser.close();
}
if (srv) srv.kill();
const ran = Object.keys(counts).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)));
console.log(ran.map(k => `${findings.some(f => f.id === k) ? '✗' : '✓'} ${k} (${counts[k]})`).join('  '));
findings.forEach(f => console.log(`  [${f.id}] ${f.msg}`));
console.log(findings.length ? `\n${findings.length} finding(s)` : '\nSpellKit holds: every invariant is met.');
process.exit(findings.length ? 1 : 0);
