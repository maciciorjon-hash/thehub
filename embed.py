#!/usr/bin/env python3
"""Bundle all apps into dHUB.

Usage:
  python embed.py                                  ->  ./dHUB.html     (local dev, everything)
  python embed.py dist/index.html                 ->  dist/index.html (CI / GitHub Pages)
  python embed.py --profile=product dist/index.html
        ->  only the apps that make up the product story (see PROFILES). Personal-workflow
            apps stay in the repo and in the default build; they just don't ship.
  python embed.py --profile=labbook               ->  ./labbook-standalone.html
  python embed.py --profile=archive [dist/archive]
        ->  Archive on its own as an installable, offline PWA (phone use at the bench).

Every build parses each app's inline JavaScript first (tools/check_js.py) and refuses to
write a bundle that would ship a SyntaxError. --no-js-check skips that gate.
"""
import base64, re, os, sys

BASE  = os.path.dirname(os.path.abspath(__file__))
SHELL = os.path.join(BASE, 'shell/hub-shell.html')

args    = [a for a in sys.argv[1:] if not a.startswith('--')]
flags   = [a for a in sys.argv[1:] if a.startswith('--')]
profile = 'all'
for f in flags:
    if f.startswith('--profile='):
        profile = f.split('=', 1)[1]
OUT = args[0] if args else os.path.join(BASE, 'dHUB.html')

# There is no build step and no module system here, so a stray brace in an app's inline
# script only shows up as a blank pane in a srcdoc iframe — and the shell's retry loop
# hides even that. Parse everything first; a bundle that cannot run is not worth writing.
if '--no-js-check' not in flags:
    import subprocess
    _chk = subprocess.run([sys.executable, os.path.join(BASE, 'tools/check_js.py'), '--quiet'])
    if _chk.returncode == 1:
        sys.stderr.write('\nembed.py FAILED — JS parse errors above. Nothing was written.\n'
                         '(Use --no-js-check only if you know why.)\n')
        sys.exit(1)
    if _chk.returncode == 2:
        print('  (node not found — JS parse check skipped)')

APPS = [
    ('echo', 'apps/echo/echo.html'),
    ('deg',  'apps/dora/dora.html'),
    ('pd',   'apps/blueprint/blueprint.html'),
    ('dna',  'apps/helix/helix.html'),
    ('pt',   'apps/protein-tools/protein-tools.html'),
    ('spectra', 'apps/bca/bca.html'),
    ('ldi',     'apps/ldi/ldi.html'),
    ('cryo',    'apps/iceberg/iceberg.html'),
    ('cuppa',      'apps/cuppa/cuppa.html'),
    ('fabricata',  'apps/fabricata/fabricata.html'),
    ('beacon',     'apps/beacon/beacon.html'),
    ('lumina',     'apps/lumina/lumina.html'),
    ('ribbon',     'apps/ribbon/ribbon.html'),
    ('protocols',  'apps/archive/archive.html'),
    ('cellarchive', 'apps/cell-archive/cell-archive.html'),
    ('incubator',   'apps/incubator/incubator.html'),
    ('labbook',     'apps/labbook/labbook.html'),
    ('blot',        'apps/western-blot/western-blot.html'),
    ('gantt',       'apps/gantt/gantt.html'),
]

# Which apps ship in which build. 'all' is the personal Hub; 'product' is the sellable
# story — the notebook, the analysis that feeds it, the protocol library and the modules
# they depend on. Cuppa/Fabricata/Cadence and the off-path tools stay out.
# The sellable build is the spine plus what feeds it: Labbook (the notebook), Archive (protocols
# AND the reagent Library, which now holds plasmids too), Cells (the three frames the merged app
# hosts), Echo, and the analysis apps Echo hands off to. Blueprint, Blot and Helix are useful in
# a TPD lab but sit outside the plan -> execute -> analyse loop, so they stay in the personal
# build and the repo. Plasmids is no longer shipped as its own app: it is a Library tab.
PROFILES = {
    'product': ['labbook', 'protocols',
                'incubator', 'cellarchive', 'cryo',
                'echo', 'deg', 'spectra', 'ldi', 'lumina', 'beacon'],
}
# ── Standalone Labbook ────────────────────────────────────────────────────
# Labbook + Archive as one self-contained file, with no dHUB around it. Archive is embedded
# verbatim as a base64 iframe: it publishes its bridge onto window.parent, which inside Labbook
# IS Labbook — so nothing in either app has to be forked or de-collided.
if profile == 'labbook':
    lb = open(os.path.join(BASE, 'apps/labbook/labbook.html'), encoding='utf-8').read()
    arc = open(os.path.join(BASE, 'apps/archive/archive.html'), 'rb').read()
    arc_b64 = base64.b64encode(arc).decode('ascii')
    lb, n = re.subn(r'(?<=var ARCHIVE_B64 = ")[^"]*', arc_b64, lb)
    if n != 1:
        sys.stderr.write('labbook profile: expected 1 ARCHIVE_B64 placeholder, got %d\n' % n)
        sys.exit(1)
    out = OUT if args else os.path.join(BASE, 'labbook-standalone.html')
    open(out, 'w', encoding='utf-8').write(lb)
    print('Labbook standalone: %s (%s chars, Archive embedded: %s chars)'
          % (out, f'{len(lb):,}', f'{len(arc_b64):,}'))
    sys.exit(0)

# ── Standalone Archive (installable PWA) ──────────────────────────────────
# apps/archive/archive.html is already self-contained (no external JS, notes in localStorage, the
# two dHUB hooks degrade to a toast). This profile only *packages* it for a phone: a web
# manifest, icons and a service worker so "Add to Home Screen" gives a real offline app at
# the bench. The source file is untouched — the PWA tags are injected here, so the copy
# embedded in dHUB never registers a service worker.
# The path is deliberately an unguessable slug, not /archive/: the Pages site is public
# (private-repo Pages sites still serve to anyone), so the URL itself is the access control.
# It is a bearer link — unguessable, but permanent for anyone you send it to. Keep the slug
# stable or every installed home-screen app breaks.
ARCHIVE_SLUG = 'archive-14cadcd792a2'
if profile == 'archive':
    import hashlib, shutil
    out_dir = os.path.abspath(args[0]) if args else os.path.join(BASE, 'dist', ARCHIVE_SLUG)
    html = open(os.path.join(BASE, 'apps/archive/archive.html'), encoding='utf-8').read()

    head = '''
<meta name="robots" content="noindex, nofollow">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#13161e" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Archive">
<meta name="description" content="Assay and experiment protocol library with live calculators — works offline.">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      reg.addEventListener('updatefound', function(){
        var w = reg.installing; if (!w) return;
        w.addEventListener('statechange', function(){
          // Only after a first install is there anything to update *from*.
          if (w.state === 'installed' && navigator.serviceWorker.controller && window.showToast)
            showToast('Update ready — reopen Archive to apply');
        });
      });
    }).catch(function(){});
  });
}
</script>
</head>'''
    html, n = re.subn(r'</head>', head, html, count=1)
    if n != 1:
        sys.stderr.write('archive profile: could not find </head>\n')
        sys.exit(1)
    # Hash the *built* page, so a change to the injected head is a new cache too.
    ver = hashlib.sha256(html.encode('utf-8')).hexdigest()[:10]

    manifest = '''{
  "name": "Archive — protocol library",
  "short_name": "Archive",
  "description": "Assay and experiment protocol library with live calculators.",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#f4f5f8",
  "theme_color": "#a56983",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
'''
    # Cache-first: at the bench there is often no signal, and a protocol that loads instantly
    # matters more than one that is seconds-fresh. A new build gets a new cache name, so the
    # next launch after an update picks it up and the old cache is dropped.
    sw = '''const CACHE = 'archive-%s';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Navigations always resolve to the cached shell so the app opens with no network.
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // Runtime-cache what we fetch (the Google Fonts CSS/woff2 among it) so the second
      // launch is fully offline. Opaque cross-origin responses cache fine here.
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
''' % ver

    os.makedirs(os.path.join(out_dir, 'icons'), exist_ok=True)
    open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(html)
    open(os.path.join(out_dir, 'manifest.webmanifest'), 'w', encoding='utf-8').write(manifest)
    open(os.path.join(out_dir, 'sw.js'), 'w', encoding='utf-8').write(sw)
    icons = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']
    for name in icons:
        src_icon = os.path.join(BASE, 'apps/archive/icons', name)
        if not os.path.exists(src_icon):
            sys.stderr.write('archive profile: missing icon %s (run tools/make_icons.py)\n' % name)
            sys.exit(1)
        shutil.copyfile(src_icon, os.path.join(out_dir, 'icons', name))
    print('Archive PWA: %s (index.html %s chars, cache %s)' % (out_dir, f'{len(html):,}', 'archive-' + ver))
    sys.exit(0)

if profile != 'all':
    if profile not in PROFILES:
        sys.stderr.write('unknown profile: %s (known: %s)\n' % (profile, ', '.join(PROFILES)))
        sys.exit(1)
    keep = set(PROFILES[profile])
    unknown = keep - {k for k, _ in APPS}
    if unknown:
        sys.stderr.write('profile %s lists unknown app ids: %s\n' % (profile, ', '.join(sorted(unknown))))
        sys.exit(1)
    dropped = [k for k, _ in APPS if k not in keep]
    APPS = [(k, r) for k, r in APPS if k in keep]
    print('profile=%s — shipping %d apps, omitting: %s' % (profile, len(APPS), ', '.join(dropped)))

src = open(SHELL, encoding='utf-8').read()
errors = []

def strip_card(html, key):
    r"""Remove one app's home card, matching <div>s by depth.

    A lazy [\s\S]*? up to the next indented </div> stops at the one closing
    .card-header-row, not the card: it took 4 opens and 3 closes, leaving an
    orphaned .card-desc/.card-foot and unbalanced DOM in the build. Anchor on
    data-app-id rather than class="card" too — Labbook and Incubator carry
    class="card dash-admin-card" and a class-exact match would skip them.
    """
    m = re.search(r'[ \t]*<div class="card[^"]*"[^>]*\bdata-app-id="' + re.escape(key) + r'"', html)
    if not m:
        return html, False
    depth, i, n = 0, m.start(), len(html)
    tag = re.compile(r'<(/?)div\b', re.I)
    while i < n:
        t = tag.search(html, i)
        if not t:
            return html, False           # unbalanced source — leave it alone rather than guess
        depth += -1 if t.group(1) else 1
        i = t.end()
        if depth == 0:
            end = html.find('>', i)
            if end < 0:
                return html, False
            end += 1
            while end < n and html[end] in ' \t':
                end += 1
            if end < n and html[end] == '\n':
                end += 1
            return html[:m.start()] + html[end:], True
    return html, False


# Omitted apps keep their placeholder in the shell, so blank it (no payload) and strip their
# home card, otherwise the build ships a card that opens an empty iframe.
if profile != 'all':
    for key in dropped:
        src, n_blank = re.subn(r'(?<=' + key + r': ")[^"]*', '', src)
        # Same reasoning as the fill loop below: a renamed key here silently ships the
        # dropped app's full payload inside a build that claims not to contain it.
        if n_blank != 1:
            errors.append('%s: expected 1 placeholder to blank, got %d' % (key, n_blank))
        src, ok = strip_card(src, key)
        if not ok:
            errors.append('%s: home card not found or unbalanced — it would ship a dead card' % key)

for key, rel in APPS:
    path = os.path.join(BASE, rel)
    try:
        data = open(path, 'rb').read()
    except FileNotFoundError:
        print(f'  {key}: MISSING SOURCE — {rel}')
        errors.append(f'{key}: source file not found ({rel})')
        continue
    b64 = base64.b64encode(data).decode('ascii')
    src, n = re.subn(r'(?<=' + key + r': ")[^"]*', b64, src)
    print(f'  {key}: {n} replacement(s)')
    # Exactly one placeholder must be filled. n==0 (typo'd/renamed key) or n>1
    # (duplicated entry) would ship a blank/broken app silently — fail loudly.
    if n != 1:
        errors.append(f'{key}: expected 1 placeholder replacement, got {n}')

if errors:
    sys.stderr.write('\nembed.py FAILED — the bundle was NOT written:\n  - '
                     + '\n  - '.join(errors) + '\n')
    sys.exit(1)

out_abs = os.path.abspath(OUT)
out_dir = os.path.dirname(out_abs)
if out_dir:
    os.makedirs(out_dir, exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(src)
print(f'Output: {OUT} ({len(src):,} chars)')

# A dist/ build is the deployed Pages site — Jon's personal Hub and an unlisted Archive.
# Neither belongs in a search index. (robots.txt only counts at the site root, which is why
# it is written here rather than alongside the Archive build.)
if args and out_dir:
    open(os.path.join(out_dir, 'robots.txt'), 'w', encoding='utf-8').write(
        'User-agent: *\nDisallow: /\n')
    print(f'Wrote {os.path.join(out_dir, "robots.txt")} (noindex for the whole site)')
