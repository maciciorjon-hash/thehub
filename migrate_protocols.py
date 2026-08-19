#!/usr/bin/env python3
"""
One-shot migrator: Archive's 33 hand-authored protocol panes -> structured PROTOCOL_DATA.

The Protocol tab of each protocol is static HTML written by hand. That makes its times,
temperatures and volumes untouchable text, and it makes ARCHIVE_STEPS drop everything that
isn't a section heading or a list (100 proto-notes, 26 warnings, 21 tips, 30 tables).

This script parses those panes into stages -> steps -> typed params, so a protocol becomes
data. Extraction is mechanical; naming the params and setting each stage's `day` is human
work, so every generated label is prefixed TODO: for review.

    python3 migrate_protocols.py --from <html>            # parse and inject PROTOCOL_DATA
    python3 migrate_protocols.py --from <html> --dry-run  # parse and report, touch nothing
    python3 migrate_protocols.py --from <html> --check    # verify the round trip

The migration has already run: archive.html's Protocol panes are now generated, so it is no
longer its own source. Re-verify against the pre-migration file from git, e.g.

    git show <pre-migration-sha>:Archive/archive.html > /tmp/orig.html
    python3 migrate_protocols.py --from /tmp/orig.html --check

Without --from it reads archive.html and will refuse, because parsing the generated panes
would yield empty stages and injecting those would destroy all 33 protocols.

Not part of the build.
"""
import re, sys, json, html as htmllib
from html.parser import HTMLParser

SRC = 'Archive/archive.html'
BEGIN = '// <<< PROTOCOL_DATA GENERATED — see migrate_protocols.py >>>'
END   = '// <<< END PROTOCOL_DATA >>>'
VOID = {'br','img','input','hr','meta','link','source','area','base','col','embed','param','track','wbr'}


# ── minimal DOM with exact source offsets ────────────────────────────────────────────────
class Node:
    __slots__ = ('tag','attrs','children','parent','inner_start','inner_end','outer_start','outer_end')
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children = []
        self.inner_start = self.inner_end = self.outer_start = self.outer_end = None
    def cls(self):
        return (self.attrs.get('class') or '').split()
    def has(self, c):
        return c in self.cls()
    def find_all(self, pred):
        out = []
        for ch in self.children:
            if pred(ch): out.append(ch)
            out.extend(ch.find_all(pred))
        return out


class DOM(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.starts = [0]
        for line in src.split('\n'):
            self.starts.append(self.starts[-1] + len(line) + 1)
        self.root = Node('#root', {}, None)
        self.stack = [self.root]
        self.feed(src)

    def _abs(self):
        ln, col = self.getpos()
        return self.starts[ln - 1] + col

    def handle_starttag(self, tag, attrs):
        pos = self._abs()
        if tag in VOID:
            return
        n = Node(tag, attrs, self.stack[-1])
        n.outer_start = pos
        n.inner_start = pos + len(self.get_starttag_text() or '')
        self.stack[-1].children.append(n)
        self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        pos = self._abs()
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                for n in self.stack[i:]:
                    if n.inner_end is None:
                        n.inner_end = pos
                        n.outer_end = pos + len(tag) + 3
                del self.stack[i:]
                return

    def inner(self, n):
        return self.src[n.inner_start:n.inner_end] if n.inner_end else ''

    def text(self, n):
        return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', self.inner(n))).strip()


# ── typographic entities -> real characters (keeps the JSON readable and regexes simple) ──
TYPO = {'&deg;':'°','&times;':'×','&ndash;':'–','&mdash;':'—','&minus;':'−','&prime;':'′',
        '&rarr;':'→','&larr;':'←','&ge;':'≥','&le;':'≤','&plusmn;':'±','&micro;':'µ',
        '&alpha;':'α','&beta;':'β','&sup2;':'²','&sup3;':'³','&hellip;':'…','&bull;':'•',
        '&frac12;':'½','&deg':'°'}
def detypo(s):
    for k, v in TYPO.items():
        s = s.replace(k, v)
    return s   # &amp; &lt; &gt; &nbsp; deliberately left as entities


# ── parameter extraction ─────────────────────────────────────────────────────────────────
# Ordered most-specific first. Each: (regex, type, unit-group or literal, key suffix)
# Every unit the prose uses, longest-first so `min` wins over `m` and `hours` over `h`.
UNIT_ALT = (r'(?:°C|ng/µL|ng/uL|mg/mL|µg/mL|U/µL|cycles|µmol|nmol|pmol|hours|days|'
            r'µL|uL|μL|mL|rpm|min|sec|hrs|nM|µM|uM|mM|bp|nt|µg|ug|mg|hr|day|%|×|L|M|h|s|g|d)')
UEND = r'(?![A-Za-z0-9])'
# Ordered most-specific first. A range must be tried before the singular patterns, or
# "invert 4–6×" is captured as a bare 6× and the lower bound is orphaned in the prose.
PARAM_RES = [
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)\s*×\s*10(&#\d+;|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)'), 'sci'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)\s*(' + UNIT_ALT + r')' + UEND), 'range'),
    (re.compile(r'(?<![\w.])(-?−?\d+(?:\.\d+)?)\s*°C'), 'temp'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*(min|hours|hour|hrs|hr|h|sec|s|days|day|d)' + UEND), 'time'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*(µL|uL|μL|mL|L)' + UEND), 'vol'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*(ng/µL|ng/uL|mg/mL|µg/mL|U/µL|nM|µM|uM|mM|M)' + UEND), 'conc'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*(pmol|nmol|µmol|ng|µg|ug|mg|g)' + UEND), 'mass'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*%'), 'pct'),
    (re.compile(r'(?<![\w.])1\s*:\s*(\d+(?:,\d+)?)'), 'ratio'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*×(?!\s*g)(?!\s*10)'), 'fold'),
    (re.compile(r'(?<![\w.])(\d+(?:\.\d+)?)\s*(bp|nt|cycles|rpm)' + UEND), 'count'),
]
UNIT_FOR = {'temp':'°C','pct':'%','fold':'×','ratio':''}
SUFFIX   = {'sci':'Range','temp':'T','time':'Min','vol':'Vol','conc':'Conc','mass':'Amt','pct':'Pct',
            'ratio':'Ratio','fold':'X','count':'N','range':'Range'}
STOP = {'the','a','an','and','or','of','to','in','at','for','with','on','by','is','are','be',
        'add','then','from','into','each','all','it','its','this','that','if','as','per','no'}

def slug(words, fallback='p'):
    ws = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in words]
    ws = [w for w in ws if w and w not in STOP and not w.isdigit()]
    if not ws: return fallback
    out = ws[0]
    for w in ws[1:3]:
        out += w[:1].upper() + w[1:]
    return out[:22] or fallback

def extract_params(step_html, used):
    """Replace param tokens in text nodes with {{p.key}} and return the param dict."""
    params = {}
    # only touch text segments, never markup (URLs and attributes carry digits too)
    parts = re.split(r'(<[^>]+>)', step_html)
    for i, seg in enumerate(parts):
        if seg.startswith('<'):
            continue
        for rx, kind in PARAM_RES:
            def repl(m):
                # Context must exclude placeholders written by earlier passes, or their key
                # fragments leak into the next name (pIcetTransformVol, ncubatePExchange…).
                pre  = re.sub(r'\{\{p\.[^}]*\}\}', ' ', seg[max(0, m.start() - 60):m.start()])
                post = re.sub(r'\{\{p\.[^}]*\}\}', ' ', seg[m.end():m.end() + 40])
                wb = re.findall(r"[A-Za-z]{2,}", pre)[-3:]
                wa = re.findall(r"[A-Za-z]{2,}", post)[:3]
                key = slug(wb or wa, 'val') + SUFFIX.get(kind, '')
                # Carry the surrounding phrase into the label so naming can be done from the
                # report without opening the protocol.
                phrase = re.sub(r'\s+', ' ', (' '.join(wb[-2:]) + ' ⟨' + m.group(0).strip()
                                               + '⟩ ' + ' '.join(wa[:2])).strip())
                n = key
                k = 2
                while n in used:
                    n = key + str(k); k += 1
                used.add(n)
                if kind == 'sci':
                    lo, hi, exp = m.group(1), m.group(2), m.group(3)
                    params[n] = {'type':'range','value':float(lo),'max':float(hi),
                                 'unit':'×10' + exp, 'label':'TODO: ' + phrase}
                elif kind == 'range':
                    lo, hi, unit = m.group(1), m.group(2), m.group(3)
                    params[n] = {'type':'range','value':float(lo),'max':float(hi),'unit':unit,
                                 'label':'TODO: ' + phrase}
                else:
                    unit = UNIT_FOR.get(kind)
                    if unit is None:
                        unit = m.group(2) if m.lastindex and m.lastindex >= 2 else ''
                    val = m.group(1).replace('−', '-')
                    try: val = float(val)
                    except ValueError: pass
                    params[n] = {'type':kind,'value':val,'unit':unit,'label':'TODO: ' + phrase}
                return '{{p.' + n + '}}'
            seg = rx.sub(repl, seg)
        parts[i] = seg
    return ''.join(parts), params


# ── walk one protocol pane into stages ───────────────────────────────────────────────────
def parse_protocol(dom, wrap, pid, report):
    pane = None
    for n in wrap.find_all(lambda x: x.tag == 'div' and x.attrs.get('data-tab') == 'protocol'):
        pane = n; break
    if pane is None:
        report.append((pid, 'NO PROTOCOL PANE')); return None

    stages, cur, preamble, si = [], None, [], 0
    used_keys = set()

    variants, cur_variant, cur_part = [], [None], [None]

    def open_stage(name, badge=None):
        nonlocal cur, si
        si += 1
        # body[] keeps document order. Buckets would render a "do not exceed 80 bp" warning
        # five steps away from the step it warns about, which is where it is useless.
        cur = {'id':'s%d' % si, 'name':name, 'day':0, 'durationH':None, 'body':[]}
        if badge: cur['badge'] = badge
        # A stage inside a .method-branch belongs to that delivery method; a stage outside
        # one is shared by every variant. That is the whole crispr-ko/ki "two methods" model.
        if cur_variant[0]: cur['variant'] = cur_variant[0]
        # 'Part 1 — Clone the gRNA into PX458' groups several stages; it sits one level
        # above proto-day/proto-section, so it rides along on each stage it covers.
        if cur_part[0]: cur['part'] = cur_part[0]
        stages.append(cur)
        return cur

    def sink():
        if cur is not None: return cur['body']
        if not stages:      return preamble
        return open_stage('')['body']

    def walk(node):
        """Document-order walk. Recognised content is handled and not descended into;
        anything else is a layout wrapper, so descend — .proto-day, and ~20% of the
        sections/lists/notes, live one level down inside wrapper divs."""
        nonlocal cur
        for ch in node.children:
            c = ch.cls()
            if 'proto-part' in c:
                cur_part[0] = detypo(dom.text(ch)); cur = None
            elif 'proto-section' in c:
                open_stage(detypo(dom.text(ch)))
            elif 'proto-day' in c:
                badge = next((dom.text(x) for x in ch.children if x.has('proto-day-badge')), '')
                label = next((dom.text(x) for x in ch.children if x.has('proto-day-label')), '')
                open_stage(detypo(label or badge), detypo(badge))
            elif 'proto-list' in c and ch.tag in ('ol','ul'):
                if cur is None: open_stage('')
                base = sum(len(b['items']) for b in cur['body'] if b['t'] == 'steps')
                items = []
                for j, li in enumerate((x for x in ch.children if x.tag == 'li'), 1):
                    raw = detypo(dom.inner(li)).strip()
                    h, params = extract_params(raw, used_keys)
                    items.append({'id':'%s.%s.%d' % (pid, cur['id'], base + j),
                                  'html':h, 'params':params})
                if items:
                    cur['body'].append({'t':'steps', 'ordered': ch.tag == 'ol', 'items':items})
            elif 'proto-note' in c:
                kind = 'warn' if 'warn' in c else ('tip' if 'tip' in c else 'note')
                body = detypo(dom.inner(ch)).strip()
                if kind == 'tip':
                    body = re.sub(r'<div class="tip-header">.*?</div>', '', body, flags=re.S).strip()
                sink().append({'t':kind, 'html':body})
            elif 'proto-table' in c or ch.tag == 'table':
                tbl = parse_table(dom, ch); tbl['t'] = 'table'
                sink().append(tbl)
            elif 'delivery-bar' in c:
                # The <select> already enumerates the delivery methods — read them off it.
                opts = []
                for sel in ch.find_all(lambda x: x.tag == 'select'):
                    for op in sel.find_all(lambda x: x.tag == 'option'):
                        v = op.attrs.get('value')
                        if not v: continue
                        o = {'id': v, 'label': detypo(dom.text(op))}
                        opts.append(o)
                        if not any(x['id'] == v for x in variants): variants.append(o)
                lbl = next((dom.text(x) for x in ch.find_all(
                    lambda y: y.has('delivery-bar-label'))), 'Delivery method')
                sink().append({'t':'variantPicker', 'label': detypo(lbl), 'options': opts})
            elif 'method-branch' in c:
                prev, prevp = cur_variant[0], cur_part[0]
                cur_variant[0] = ch.attrs.get('data-method') or prev
                cur_part[0] = None
                cur = None          # a branch always starts its own stage
                walk(ch)
                cur_variant[0], cur_part[0] = prev, prevp
                cur = None
            elif ch.tag in ('div','section','details'):
                walk(ch)                      # layout wrapper — keep going down
            elif ch.tag in ('p','ol','ul'):
                txt = dom.text(ch)
                if txt:
                    sink().append({'t':'note', 'html':detypo(dom.inner(ch)).strip()})

    walk(pane)

    out = {'stages':stages, 'preamble':preamble}
    if variants: out['variants'] = variants
    return out


def parse_table(dom, node):
    tnode = node if node.tag == 'table' else next(
        (x for x in node.find_all(lambda y: y.tag == 'table')), None)
    if tnode is None:
        return {'headers': [], 'rows': [], 'html': detypo(dom.inner(node)).strip()}
    headers, rows = [], []
    for tr in tnode.find_all(lambda x: x.tag == 'tr'):
        ths = [detypo(dom.inner(c)).strip() for c in tr.children if c.tag == 'th']
        tds = [detypo(dom.inner(c)).strip() for c in tr.children if c.tag == 'td']
        if ths and not headers: headers = ths
        elif tds: rows.append(tds)
    return {'headers': headers, 'rows': rows}


# ── main ─────────────────────────────────────────────────────────────────────────────────
def main():
    dry   = '--dry-run' in sys.argv
    check = '--check' in sys.argv
    frm = SRC
    if '--from' in sys.argv:
        frm = sys.argv[sys.argv.index('--from') + 1]
    src = open(frm, encoding='utf-8').read()
    dom = DOM(src)

    wraps = [n for n in dom.root.find_all(lambda x: x.has('detail-wrap')) if n.attrs.get('data-pid')]
    print('detail-wrap encontrados: %d' % len(wraps))

    report, data = [], {}
    for w in wraps:
        pid = w.attrs['data-pid']
        p = parse_protocol(dom, w, pid, report)
        if p: data[pid] = p

    # Refuse to run against already-generated panes. They parse to empty stages, --check
    # would then compare empty with empty and pass, and an inject would wipe every protocol.
    total_steps = sum(len(b['items']) for p in data.values() for s in p['stages']
                      for b in s['body'] if b['t'] == 'steps')
    if total_steps < 100:
        print('\nABORTA: %s produce solo %d pasos — sus paneles ya están generados.\n'
              'Este script necesita el HTML PRE-migración. Sácalo de git:\n'
              '  git log --oneline -- Archive/archive.html\n'
              '  git show <sha>:Archive/archive.html > /tmp/orig.html\n'
              '  python3 migrate_protocols.py --from /tmp/orig.html --check'
              % (frm, total_steps), file=sys.stderr)
        return 2

    # ── coverage report ──
    n_st = sum(len(p['stages']) for p in data.values())
    def bodies(): return ([b for p in data.values() for s in p['stages'] for b in s['body']]
                          + [b for p in data.values() for b in p['preamble']])
    allsteps = [i for b in bodies() if b['t'] == 'steps' for i in b['items']]
    n_sp = len(allsteps)
    n_pa = sum(len(i['params']) for i in allsteps)
    n_co = len([b for b in bodies() if b['t'] in ('note','warn','tip')])
    n_tb = len([b for b in bodies() if b['t'] == 'table'])
    print('protocolos %d · etapas %d · pasos %d · params %d · callouts %d · tablas %d'
          % (len(data), n_st, n_sp, n_pa, n_co, n_tb))
    nv = {k:len(v['variants']) for k,v in data.items() if v.get('variants')}
    if nv: print('protocolos con variantes de método: %s' % nv)
    noparam = [i['id'] for i in allsteps if not i['params']]
    print('pasos sin ningún parámetro detectado: %d / %d' % (len(noparam), n_sp))
    if report:
        print('\n--- incidencias ---')
        for pid, msg in report: print('  %-14s %s' % (pid, msg))

    out = '/private/tmp/claude-501/-Users-jonmacicior-Desktop-The-Hub/2e4a7707-c788-4214-b2d1-14cd7d3a1fc2/scratchpad'
    json.dump(data, open(out + '/protocol_data.json','w',encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('\nJSON -> %s/protocol_data.json' % out)

    if check:
        return do_check(dom, wraps, data)
    if dry:
        print('(dry-run: archive.html sin tocar)')
        return 0
    inject(open(SRC, encoding='utf-8').read(), data)
    return 0


def render_text(p):
    """Reconstruct the readable prose from the JSON, in document order, for the check."""
    bits = []
    def emit(b):
        t = b['t']
        if t == 'steps':
            for st in b['items']:
                h = st['html']
                for k, v in st['params'].items():
                    rep = str(v['value'])
                    if v['type'] == 'range': rep += '-' + str(v.get('max',''))
                    if v.get('unit'): rep += ' ' + v['unit']
                    h = h.replace('{{p.%s}}' % k, rep)
                bits.append(h)
        elif t == 'table':
            bits.extend(b.get('headers') or [])
            for r in b.get('rows') or []: bits.extend(r)
            if b.get('html'): bits.append(b['html'])
        elif t == 'variantPicker':
            bits.append(b.get('label',''))
            bits.extend(v['label'] for v in b.get('options') or [])
        else:
            if t == 'tip': bits.append('Tip')     # the badge the migrator folded into the kind
            bits.append(b.get('html',''))
    for b in p['preamble']: emit(b)
    last_part = None
    for s in p['stages']:
        if s.get('part') and s['part'] != last_part:
            bits.append(s['part']); last_part = s['part']
        if s.get('badge'): bits.append(s['badge'])
        bits.append(s['name'])
        for b in s['body']: emit(b)
    return bits


def norm(s):
    s = re.sub(r'<[^>]+>', ' ', s)
    s = htmllib.unescape(detypo(s))
    s = re.sub(r'[\s ]+', ' ', s)
    return re.sub(r'[^\w%°×–/.:+-]', '', s).lower()


def do_check(dom, wraps, data):
    """Every word of the original pane must survive into the JSON."""
    bad = 0
    for w in wraps:
        pid = w.attrs['data-pid']
        if pid not in data: continue
        pane = next(n for n in w.find_all(lambda x: x.attrs.get('data-tab') == 'protocol'))
        orig = norm(dom.inner(pane))
        got  = norm(' '.join(render_text(data[pid])))
        # numbers may be reformatted (60 -> 60.0); compare on letters only, plus a length guard
        o_l = re.sub(r'[^a-z]', '', orig)
        g_l = re.sub(r'[^a-z]', '', got)
        if o_l != g_l:
            bad += 1
            miss = len(o_l) - len(g_l)
            print('  DIFF %-14s letras orig=%d json=%d (falta %d)' % (pid, len(o_l), len(g_l), miss))
            for i in range(min(len(o_l), len(g_l))):
                if o_l[i] != g_l[i]:
                    print('        primer desvío @%d: orig …%s… json …%s…'
                          % (i, o_l[max(0,i-30):i+30], g_l[max(0,i-30):i+30]))
                    break
    print('\ncheck: %d/%d protocolos idénticos' % (len(data) - bad, len(data)))
    return 1 if bad else 0


def inject(src, data):
    js = 'var PROTOCOL_DATA = ' + json.dumps(data, ensure_ascii=False,
                                             separators=(',', ':')) + ';'
    block = BEGIN + '\n' + js + '\n' + END
    if BEGIN in src:
        src = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), lambda m: block, src, flags=re.S)
    else:
        anchor = 'var PROTOCOLS = ['
        i = src.index(anchor)
        src = src[:i] + block + '\n' + src[i:]
    open(SRC, 'w', encoding='utf-8').write(src)
    print('PROTOCOL_DATA inyectado en %s' % SRC)


if __name__ == '__main__':
    sys.exit(main())
