// Backup retention: the automatic backups keep a file for every day of the last N days (30 by default)
// and, before that, one per week (or month, or none) — and the newest one always. The policy is pure
// text that lives in two files (the shell and Labbook), so this runs it from both, checks the two copies
// are the same text, and checks the settings that choose it are wired in.
//   node tools/backup_retention_invariants.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const SHELL = fs.readFileSync(arg('shell') || path.join(root, 'shell/hub-shell.html'), 'utf8');
const LAB = fs.readFileSync(arg('labbook') || path.join(root, 'apps/labbook/labbook.html'), 'utf8');

let bad = 0;
const check = (id, what, ok, info) => { console.log((ok ? '✓ ' : '✗ ') + id + ' ' + what + (ok ? '' : '  ' + (info === undefined ? '' : JSON.stringify(info)))); if (!ok) bad++; };

const region = (src) => { const a = src.indexOf('// backup-retention:begin'), b = src.indexOf('// backup-retention:end'); return a >= 0 && b > a ? src.slice(a, b) : null; };
const rs = region(SHELL), rl = region(LAB);
check('R1', 'the policy exists in the shell and in Labbook, as the same text', !!rs && rs === rl, { shell: !!rs, labbook: !!rl });
if (!rs) process.exit(1);

const store = {};
const load = (code) => new Function('localStorage', code + '\nreturn { backupPrune, backupPolicyClean, backupPolicyRead, backupPolicyWrite, backupPolicyText };')({ getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } });
const K = load(rs);

const DAY = 864e5;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);          // UTC days only, so the test has no timezone in it
const base = Date.UTC(2026, 10, 25);                                   // 2026-11-25
const TODAY = iso(base);
const run = (n) => Array.from({ length: n }, (_, i) => 'labbook-' + iso(base - i * DAY) + '.json.gz');
// ISO week by a different road than the code under test: the Monday of that date
const monday = (s) => { const d = new Date(s + 'T00:00:00Z'); const k = (d.getUTCDay() + 6) % 7; return iso(d.getTime() - k * DAY); };
const survivors = (names, del) => names.filter((n) => !del.includes(n));
const dateOf = (n) => n.match(/\d{4}-\d{2}-\d{2}/)[0];
const age = (n) => Math.round((base - Date.parse(dateOf(n) + 'T00:00:00Z')) / DAY);

// R2 the default: 30 daily + one per week of what is older
{
  const names = run(120), del = K.backupPrune(names, TODAY, { days: 30, older: 'week' }), kept = survivors(names, del);
  const daily = kept.filter((n) => age(n) < 30), old = kept.filter((n) => age(n) >= 30);
  const weeks = new Set(old.map((n) => monday(dateOf(n))));
  const allOldWeeks = new Set(names.filter((n) => age(n) >= 30).map((n) => monday(dateOf(n))));
  check('R2', '30 daily backups for the last month, and exactly one per week of everything older', daily.length === 30 && old.length === weeks.size && weeks.size === allOldWeeks.size, { daily: daily.length, old: old.length, weeks: weeks.size, allOldWeeks: allOldWeeks.size });
  const want = new Set(names.filter((n) => age(n) < 30)); const seenW = new Set();
  names.filter((n) => age(n) >= 30).sort().forEach((n) => { const m = monday(dateOf(n)); if (!seenW.has(m)) { seenW.add(m); want.add(n); } });
  check('R2b', 'the kept set is exactly the last 30 days (today and 29 before) plus the first backup of each older week', kept.length === want.size && kept.every((n) => want.has(n)), { kept: kept.length, want: want.size });
  const firstOfWeek = old.every((n) => { const m = monday(dateOf(n)); return !names.some((x) => age(x) >= 30 && monday(dateOf(x)) === m && dateOf(x) < dateOf(n)); });
  check('R3', 'the one kept for an old week is its earliest, so it does not change as the days go by', firstOfWeek);
}

// R4 pruning what survived deletes nothing more
{
  const names = run(200), kept = survivors(names, K.backupPrune(names, TODAY, { days: 30, older: 'week' }));
  check('R4', 'pruning twice changes nothing', K.backupPrune(kept, TODAY, { days: 30, older: 'week' }).length === 0);
}

// R5 the real life: one backup a day for 400 days, pruned after each, never grows past 30 + the weeks
{
  let files = [], maxN = 0;
  for (let i = 400; i >= 0; i--) { const t = base - i * DAY; files.push('labbook-' + iso(t) + '.json.gz'); const del = K.backupPrune(files, iso(t), { days: 30, older: 'week' }); files = survivors(files, del); maxN = Math.max(maxN, files.length); }
  const old = files.filter((n) => age(n) >= 30), weeks = new Set(old.map((n) => monday(dateOf(n))));
  check('R5', 'a year of daily backups settles at 30 + one per week, and is stable', files.length <= 30 + Math.ceil(371 / 7) + 1 && old.length === weeks.size && maxN <= 30 + 60, { n: files.length, maxN, old: old.length, weeks: weeks.size });
}

// R6 .json and .json.gz of one day go together
{
  const names = ['labbook-2026-01-05.json', 'labbook-2026-01-05.json.gz', 'labbook-2026-01-06.json.gz', 'labbook-2026-11-25.json.gz'];
  const del = K.backupPrune(names, TODAY, { days: 30, older: 'week' });   // Mon 5 kept, Tue 6 same week → deleted
  check('R6', 'both files of a day are kept or deleted together', !del.includes('labbook-2026-01-05.json') && !del.includes('labbook-2026-01-05.json.gz') && del.includes('labbook-2026-01-06.json.gz') && del.length === 1, del);
}

// R7 not ours is never touched; the local snapshot files thin on their own
{
  const names = ['labbook-notes.txt', 'readme.md', 'labbook-2026-02-30x', ...run(3), 'dhub-backup-local-2026-03-01.json.gz', 'dhub-backup-2026-03-02.json.gz', 'dhub-backup-2026-03-03.json.gz'];
  const del = K.backupPrune(names, TODAY, { days: 30, older: 'week' });
  check('R7', 'a file that is not a dated backup is never deleted', !del.includes('labbook-notes.txt') && !del.includes('readme.md') && !del.includes('labbook-2026-02-30x'), del);
  check('R8', 'the backups made when the cloud could not be read are thinned apart from the real ones, and the newest of each kind stays', !del.includes('dhub-backup-local-2026-03-01.json.gz') && !del.includes('dhub-backup-2026-03-03.json.gz'), del);
}

// R9 away for months: the newest is never deleted
{
  const names = ['labbook-2026-06-01.json.gz', 'labbook-2026-06-02.json.gz', 'labbook-2026-06-03.json.gz'];
  const del = K.backupPrune(names, TODAY, { days: 7, older: 'none' });
  check('R9', 'when every backup is old, the newest is still kept, even with “nothing”', !del.includes('labbook-2026-06-03.json.gz') && del.length === 2, del);
}

// R10 the choices
{
  const names = run(100);
  const week = survivors(names, K.backupPrune(names, TODAY, { days: 7, older: 'week' })), month = survivors(names, K.backupPrune(names, TODAY, { days: 7, older: 'month' })), none = survivors(names, K.backupPrune(names, TODAY, { days: 7, older: 'none' })), d90 = survivors(names, K.backupPrune(names, TODAY, { days: 90, older: 'week' }));
  const months = new Set(names.filter((n) => age(n) >= 7).map((n) => dateOf(n).slice(0, 7)));
  check('R10', '7 days: seven daily; then one a week, or one a month, or nothing', week.filter((n) => age(n) < 7).length === 7 && none.length === 7 && month.filter((n) => age(n) >= 7).length === months.size && month.length < week.length && d90.length >= 90, { week: week.length, month: month.length, none: none.length, d90: d90.length });
}

// R11 a stored policy that is not one of the choices falls back to the default; a file dated in the future is kept
{
  const c = K.backupPolicyClean({ days: 5, older: 'forever' });
  store.hub_backup_keep = '{not json';
  const fallback = K.backupPolicyRead();
  K.backupPolicyWrite({ days: 60, older: 'month' });
  const back = K.backupPolicyRead();
  check('R11', 'an unknown choice, or broken storage, gives 30 days and one a week; a saved choice reads back', c.days === 30 && c.older === 'week' && fallback.days === 30 && fallback.older === 'week' && back.days === 60 && back.older === 'month', { c, fallback, back });
  const del = K.backupPrune(['labbook-2027-01-01.json.gz', ...run(2)], TODAY, { days: 30, older: 'none' });
  check('R12', 'a file dated after today (a clock that was wrong) is kept', del.length === 0, del);
}

// R13 the settings that choose it are wired in, in both places
{
  const shellOk = /id="set-bk-days"[^>]*onchange="onBackupPolicy\(\)"/.test(SHELL) && /id="set-bk-older"[^>]*onchange="onBackupPolicy\(\)"/.test(SHELL) && /id="set-bk-keep-note"/.test(SHELL) && /renderBackupPolicy\(\); \}/.test(SHELL);
  const labOk = /id="rc-bk-days"/.test(LAB) && /id="rc-bk-older"/.test(LAB) && /_bkPolSet\(\)/.test(LAB);
  check('R13', 'Settings → Data → Backup and Labbook → Recover both offer the two choices', shellOk && labOk, { shellOk, labOk });
  const callsOk = SHELL.includes("rotateBackups('dhub-backup-')") && LAB.includes("window.parent.rotateBackups('labbook-')") && LAB.includes("_rotateSelfBackups('labbook-')") && !/BACKUP_KEEP/.test(LAB) && !/rotateBackups\('[a-z-]+',\s*\d+\)/.test(SHELL + LAB);
  check('R14', 'every rotation goes through the policy; no fixed “keep 30 files” is left', callsOk);
  const embedded = /function _bkPolRead\(\)\{ try\{ if\(window\.parent&&window\.parent!==window&&window\.parent\.backupPolicyRead\)/.test(LAB);
  check('R15', 'Labbook inside dHUB reads and writes the shell’s policy, so the two never disagree', embedded);
}

process.exit(bad ? 1 : 0);
