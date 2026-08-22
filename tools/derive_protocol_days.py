#!/usr/bin/env python3
"""Propose a `day` (and `durationH`) for each Archive protocol stage from its own prose.

150 of 153 stages carry `day: 0`, so a multi-day protocol collapses onto one calendar day in
Labbook until somebody types the offsets in. The question this script answers is whether the
protocol text says enough to fill them in automatically.

It does NOT decide anything. It reads PROTOCOL_DATA, looks for the phrases that actually imply
a wait ("incubate overnight", "next morning", "48 h"), accumulates them down the stage list,
and writes a TSV for a human to check. --inject only ever reads a reviewed TSV back.

  python3 tools/derive_protocol_days.py                      # write review TSV to stdout
  python3 tools/derive_protocol_days.py -o days.tsv          # ...or to a file
  python3 tools/derive_protocol_days.py --inject days.tsv    # apply a REVIEWED file

Traps this obeys, both already paid for once:
  * PROTOCOL_VERSION lives OUTSIDE the PROTOCOL_DATA markers on purpose. Anything between them
    is regenerated away, and losing it made ARCHIVE_PROTOCOL return null and every experiment
    fall back to the flat one-block path with no error anywhere.
  * After injecting, re-run migrate_protocols.py --from <pre-migration> --check and require
    33/33. This script only rewrites numeric fields, but that is the guard that proves it.
"""
import argparse, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVE = os.path.join(BASE, 'apps/archive/archive.html')
DATA_RE = re.compile(r'(var PROTOCOL_DATA\s*=\s*)(\{.*?\})(;\s*\n)', re.S)

# Phrases that mean "and then time passes". Ordered longest-first so "next morning" is not
# eaten by "next".
WAIT = [
    (re.compile(r'\bover[- ]?night\b|\bo/n\b', re.I),                 16.0),
    (re.compile(r'\bnext morning\b|\bfollowing morning\b', re.I),     16.0),
    (re.compile(r'\bnext day\b|\bthe following day\b', re.I),         24.0),
]
# A bare duration, but only when it is something you wait through rather than a spin or a
# gel run: "incubate for 48 h" counts, "centrifuge 10 min" does not.
DUR = re.compile(
    r'\b(?:incubat\w*|grow\w*|cultur\w*|express\w*|induc\w*|treat\w*|recover\w*|rest\w*|leave|stand|wait|shak\w*)\b'
    r'[^.;]{0,80}?(\d+(?:\.\d+)?)\s*(?:[–\-]\s*(\d+(?:\.\d+)?)\s*)?(h|hr|hrs|hour|hours|day|days)\b', re.I)


def strip_html(h):
    return re.sub(r'<[^>]+>', ' ', h or '')


def stage_text(st):
    """The prose a human reads, with params rendered so "{{p.t}}" does not hide a duration."""
    out = [st.get('name') or '']
    for blk in st.get('body', []) or []:
        t = blk.get('t')
        if t == 'steps':
            for it in blk.get('items', []) or []:
                h = it.get('html', '')
                for k, v in (it.get('params') or {}).items():
                    val = v.get('v', v.get('value', ''))
                    unit = v.get('u', v.get('unit', ''))
                    h = h.replace('{{p.%s}}' % k, '%s %s' % (val, unit))
                out.append(strip_html(h))
        elif t in ('note', 'warn', 'tip'):
            out.append(strip_html(blk.get('html', '')))
    return ' '.join(out)


def explicit_day(name):
    """"Day 1 — Transfection" states its own offset and outranks any accumulation."""
    m = re.search(r'\bday\s*(\d+)', name or '', re.I)
    return int(m.group(1)) if m else None


# "incubate 10 min on ice OR overnight in fridge" offers a place to leave it, not a day to wait.
# Reading it as a scheduled wait put crispr-ko's annealing step on day 1 of a protocol that
# does it in the same sitting.
OPTIONAL = re.compile(r'\b(?:or|either)\s+(?:\w+\s+){0,3}?over[- ]?night\b', re.I)


def wait_hours(text):
    """Hours implied at the END of this stage, with the phrase that says so."""
    best, why = 0.0, ''
    for rx, hrs in WAIT:
        m = rx.search(text)
        if not m:
            continue
        if OPTIONAL.search(text) and 'night' in m.group(0).lower():
            continue
        if hrs > best:
            best, why = hrs, m.group(0)
    for m in DUR.finditer(text):
        lo = float(m.group(1))
        hi = float(m.group(2)) if m.group(2) else lo
        unit = m.group(3).lower()
        hrs = max(lo, hi) * (24.0 if unit.startswith('day') else 1.0)
        # Under 12 h does not move you to the next calendar day; it is still today.
        if hrs > best:
            best, why = hrs, m.group(0).strip()
    return best, why


def analyse(D):
    """Propose a day ONLY where the text for this stage, or the one immediately before it,
    actually says so.

    A first version accumulated waits down the whole stage list. It produced 28 proposals of
    which about six were defensible, and the failures were systematic:

      * It ran straight through variant boundaries. crispr-ki s10-s15 are the SECOND delivery
        method — a parallel branch that restarts at day 0 — and every one of them was pushed to
        day 2 by waits belonging to the first branch.
      * It treated a duration as always ending the day. ctg2 s2 treats for 72 h; the readout is
        day 3, and accumulation put the next stage on day 1.
      * It carried a day onto stages that are desk work (crispr-ki s5, "Plasmid donor design"),
        which are not scheduled after an incubation at all.

    A wrong day is worse than 0: 0 reads as "not set yet" and Labbook asks you, while a wrong
    date silently schedules the bench work on the wrong day. So the rule is now direct evidence
    or nothing, and the residue is small on purpose.
    """
    rows = []
    for pid in sorted(D):
        stages = D[pid].get('stages', []) or []
        prev_wait, prev_variant, prev_day, prev_why = 0.0, None, 0, ''
        for st in stages:
            text = stage_text(st)
            ex = explicit_day(st.get('name') or '')
            hrs, why = wait_hours(text)
            variant = st.get('variant') or None

            if ex is not None:
                day, src, ev = ex, 'stated in the stage name', (st.get('name') or '').strip()
            elif variant != prev_variant:
                # A different delivery method is a parallel branch, not a later day.
                day, src, ev = st.get('day', 0), '', ''
            elif prev_wait >= 12:
                # Relative to where the previous stage sat, not derived from the wait alone:
                # two overnights in a row are day 1 then day 2, and computing an absolute day
                # from the wait length put both on day 1.
                day = prev_day + max(1, int(round(prev_wait / 24.0)))
                src, ev = 'the previous stage ends with a wait', prev_why
            else:
                day, src, ev = st.get('day', 0), '', ''

            rows.append({
                'pid': pid, 'sid': st.get('id'), 'name': (st.get('name') or '').strip(),
                'current': st.get('day', 0), 'proposed': day,
                'durationH': round(hrs, 1) if hrs else '',
                'evidence': ev or why, 'source': src,
            })
            prev_wait, prev_why, prev_variant, prev_day = hrs, why, variant, day
    return rows


def load():
    src = open(ARCHIVE, encoding='utf-8').read()
    m = DATA_RE.search(src)
    if not m:
        sys.stderr.write('could not find PROTOCOL_DATA in %s\n' % ARCHIVE)
        sys.exit(1)
    return src, m, json.loads(m.group(2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('-o', '--out')
    ap.add_argument('--inject', metavar='TSV')
    a = ap.parse_args()

    src, m, D = load()

    if a.inject:
        changed = 0
        with open(a.inject, encoding='utf-8') as f:
            for ln in f:
                if ln.startswith('#') or not ln.strip():
                    continue
                c = ln.rstrip('\n').split('\t')
                if len(c) < 5 or c[0] == 'protocol':
                    continue
                pid, sid, day, dur = c[0], c[1], c[3], c[4]
                st = next((x for x in D.get(pid, {}).get('stages', []) if x.get('id') == sid), None)
                if not st:
                    sys.stderr.write('unknown stage %s/%s — skipped\n' % (pid, sid))
                    continue
                if day.strip() != '':
                    st['day'] = int(day)
                st['durationH'] = float(dur) if dur.strip() else None
                changed += 1
        # Only the numbers move. Rewriting the JSON wholesale is what makes the round-trip
        # check afterwards non-negotiable.
        out = src[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + src[m.end(2):]
        open(ARCHIVE, 'w', encoding='utf-8').write(out)
        print('injected %d stage(s) into %s' % (changed, os.path.relpath(ARCHIVE, BASE)))
        print('NOW RUN:  python3 tools/migrate_protocols.py --from <pre-migration>.html --check   (expect 33/33)')
        return 0

    rows = analyse(D)
    lines = ['# Review this file, then: python3 tools/derive_protocol_days.py --inject <file>',
             '# Edit the "proposed" column. Blank leaves the current value alone.',
             '\t'.join(['protocol', 'stage', 'name', 'proposed', 'durationH', 'current', 'why', 'evidence'])]
    for r in rows:
        lines.append('\t'.join([r['pid'], str(r['sid']), r['name'][:60], str(r['proposed']),
                                str(r['durationH']), str(r['current']), r['source'], r['evidence']]))
    text = '\n'.join(lines) + '\n'
    if a.out:
        open(a.out, 'w', encoding='utf-8').write(text)
        print('wrote %s' % a.out)
    else:
        sys.stdout.write(text)

    moved = [r for r in rows if r['proposed'] != r['current']]
    withdur = [r for r in rows if r['durationH'] != '']
    sys.stderr.write('\n%d stages · %d would change day · %d have a duration in their prose\n'
                     % (len(rows), len(moved), len(withdur)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
