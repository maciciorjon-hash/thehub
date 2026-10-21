// Cell Archive audit invariants — the lines a person adds are records, and the 2026-10 audit found them deleted without a question, stored with nonsense
// numbers and a script link, and shown half empty in the list. Each check fails with the bug put back (run against the HEAD file to see them all fail).
//
//   CA1  delete is asked       Delete on a line you added asks in the app first; Cancel and Escape keep it, and give focus back; Delete deletes and says so
//   CA2  what is saved is sane  a name is required and not a twin of a line already there; the link must be http(s); doubling time, interval and passage limit are numbers
//                               in range or empty (1e999, -3 and 12abc used to be stored); nothing is stored when one is refused, and the message says which
//   CA3  a stored link cannot run   a record that holds a javascript: URL is drawn without a link
//   CA4  the list is whole      a line you added shows its medium and doubling time in the list like the built-in ones
//   CA5  dialogs                the add form takes focus, keeps Tab inside, closes on Escape and gives focus back; the search box has a name; the toast is a status;
//                               micrographs have a name and open from the keyboard
//
//   node tools/cellarchive_audit_invariants.mjs [--url=http://127.0.0.1:8806]      exit 1 on any finding
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = arg('url', null);
const FILE = URL ? URL + '/apps/cell-archive/cell-archive.html' : 'file://' + path.join(ROOT, 'apps/cell-archive/cell-archive.html');
const findings = []; let checks = 0;
const check = (id, name, ok, detail) => { checks++; if (!ok) findings.push(`✗ ${id} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
async function page() {
  const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(FILE); await p.waitForFunction(() => typeof renderUserCells === 'function'); return p;
}
const fill = (p, o) => p.evaluate(o => { openAddLine(); for (const k in o) document.getElementById('ca-f-' + k).value = o[k]; saveAddLine(); return { n: getUserLines().length, toast: (document.getElementById('ca-toast') || {}).textContent || '', open: document.getElementById('ca-modal-back').classList.contains('open') }; }, o);
try {
  {
    const p = await page();
    // CA2
    const bad = [['no name', {}], ['twin of a built-in line', { name: 'a549' }], ['javascript link', { name: 'Z1', url: 'javascript:alert(1)' }], ['doubling 1e999', { name: 'Z1', doublingH: '1e999' }], ['doubling -3', { name: 'Z1', doublingH: '-3' }],
      ['interval 2.5', { name: 'Z1', intervalDays: '2.5' }], ['interval 12abc', { name: 'Z1', intervalDays: '12abc' }], ['limit 0', { name: 'Z1', passageLimit: '0' }], ['limit 1000', { name: 'Z1', passageLimit: '1000' }]];
    for (const [k, o] of bad) { const r = await fill(p, o); check('CA2', `${k} is refused with a message and nothing is stored`, r.n === 0 && r.open && r.toast.length > 8, JSON.stringify(r)); }
    const ok = await fill(p, { name: 'Z1 clone', tissue: 'Kidney', url: 'https://www.atcc.org/x', doublingH: '24,5', intervalDays: '3', passageLimit: '30', media: 'DMEM + 10% FBS' });
    check('CA2', 'a good line (decimal comma in the doubling time, an https link) is stored and says so', ok.n === 1 && !ok.open && /Added/.test(ok.toast), JSON.stringify(ok));
    const twin = await fill(p, { name: 'Z1 CLONE' }); check('CA2', 'a second line with the same name (any case) is refused', twin.n === 1, JSON.stringify(twin));
    await p.evaluate(() => closeAddLine());
    // CA4
    const row = await p.evaluate(() => { const t = document.querySelector('.cell-tile[data-user]'); return { med: t.querySelector('.cell-tile-med') && t.querySelector('.cell-tile-med').textContent, dt: t.querySelector('.cell-tile-dt') && t.querySelector('.cell-tile-dt').textContent }; });
    check('CA4', 'the line you added shows its medium and doubling time in the list', row.med === 'DMEM + 10% FBS' && /24\.5/.test(row.dt || ''), JSON.stringify(row));
    // CA1
    await p.focus('.cell-tile[data-user]'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.click('#cell-full-u_' + (await p.evaluate(() => getUserLines()[0].id)) + ' .cell-close-btn');
    await p.waitForTimeout(150);
    const dlg = await p.evaluate(() => { const b = document.getElementById('ca-ask'); return { open: b.classList.contains('open'), name: document.getElementById(b.querySelector('[role=alertdialog]').getAttribute('aria-labelledby')).textContent, focus: document.activeElement.id, n: getUserLines().length }; });
    check('CA1', 'Delete opens a named question and deletes nothing yet', dlg.open && /Z1 clone/.test(dlg.name) && dlg.focus === 'ca-ask-ok' && dlg.n === 1, JSON.stringify(dlg));
    let left = false; for (let i = 0; i < 8 && !left; i++) { await p.keyboard.press('Tab'); left = await p.evaluate(() => !document.getElementById('ca-ask').contains(document.activeElement)); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const esc = await p.evaluate(() => ({ open: document.getElementById('ca-ask').classList.contains('open'), n: getUserLines().length, back: document.activeElement.textContent.trim() }));
    check('CA1', 'Tab stays inside the question; Escape keeps the line and gives focus back to Delete', !left && !esc.open && esc.n === 1 && esc.back === 'Delete', JSON.stringify({ left, esc }));
    await p.click('#cell-full-u_' + (await p.evaluate(() => getUserLines()[0].id)) + ' .cell-close-btn'); await p.waitForTimeout(100); await p.click('#ca-ask-ok'); await p.waitForTimeout(150);
    const gone = await p.evaluate(() => ({ n: getUserLines().length, toast: document.getElementById('ca-toast').textContent, show: document.getElementById('ca-toast').classList.contains('show') }));
    check('CA1', 'confirming deletes the line and says so', gone.n === 0 && /Deleted Z1 clone/.test(gone.toast) && gone.show, JSON.stringify(gone));
    await p.close();
  }
  {
    // CA3 a record from an older version or a sync holds a script link
    const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    await p.addInitScript(() => { try { localStorage.setItem('hub_cell_archive_user', JSON.stringify([{ id: 'x-1', name: 'Hostile', url: 'javascript:window.__x=1', type: 'Adherent' }, { id: 'x-2', name: 'Fine', url: 'https://example.org/a', type: 'Adherent' }])); } catch (e) {} });
    await p.goto(FILE); await p.waitForFunction(() => typeof renderUserCells === 'function');
    const r = await p.evaluate(() => ({ bad: !!document.querySelector('#cell-full-u_x-1 a'), good: !!document.querySelector('#cell-full-u_x-2 a[href^="https://"]') }));
    check('CA3', 'a javascript: link in a stored record is not drawn as a link; an https one is', !r.bad && r.good, JSON.stringify(r));
    await p.close();
  }
  {
    // CA5 dialogs
    const p = await page();
    const r0 = await p.evaluate(() => ({ q: document.getElementById('ca-q').getAttribute('aria-label'), toast: document.getElementById('ca-toast').getAttribute('role') }));
    check('CA5', 'the search box has a name and the toast is a status', !!r0.q && r0.toast === 'status', JSON.stringify(r0));
    await p.focus('.cell-add-tile'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    const f = await p.evaluate(() => document.activeElement.id);
    let left = false; for (let i = 0; i < 30 && !left; i++) { await p.keyboard.press(i % 4 ? 'Tab' : 'Shift+Tab'); left = await p.evaluate(() => !document.getElementById('ca-modal-back').contains(document.activeElement)); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const back = await p.evaluate(() => document.activeElement.className);
    check('CA5', 'the add form starts in the name, keeps Tab inside, and Escape returns focus to Add cell line', f === 'ca-f-name' && !left && /cell-add-tile/.test(back), JSON.stringify({ f, left, back }));
    const im = await p.evaluate(() => { const i = document.querySelector('img.ca-micro'); return { alt: i.alt, tab: i.tabIndex }; });
    await p.evaluate(() => { document.querySelector('.cell-tile[data-cell]').click(); document.querySelector('img.ca-micro').focus(); }); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    const z = await p.evaluate(() => document.getElementById('ca-zoom').classList.contains('open'));
    check('CA5', 'a micrograph has a name and opens from the keyboard', /micrograph/i.test(im.alt) && im.tab === 0 && z, JSON.stringify({ im, z }));
    await p.close();
  }
} catch (e) { findings.push('✗ the run stopped: ' + (e && e.stack || e)); }
await browser.close();
if (findings.length) { findings.forEach(f => console.log(f)); console.log(`\n${findings.length} finding(s), ${checks - findings.length} checks passed.`); process.exit(1); }
console.log(`Cell Archive audit invariants: ${checks} checks passed.`);
