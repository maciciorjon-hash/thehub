#!/usr/bin/env python3
"""Bundle all apps into dHUB.

Usage:
  python embed.py                                  ->  ./dHUB.html     (local dev, everything)
  python embed.py dist/index.html                 ->  dist/index.html (CI / GitHub Pages)
  python embed.py --profile=product dist/index.html
        ->  only the apps that make up the product story (see PROFILES). Personal-workflow
            apps stay in the repo and in the default build; they just don't ship.
  python embed.py --profile=labbook               ->  ./labbook-standalone.html
  python embed.py --profile=labbook-app           ->  mobile/www (the iPhone app's bundle: everything inside, see mobile/README.md)
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
    ('hitfinder', 'apps/hitfinder/hitfinder.html'),
    ('tempo', 'apps/tempo/tempo.html'),
    ('pd',   'apps/blueprint/blueprint.html'),
    ('dna',  'apps/helix/helix.html'),
    ('pt',   'apps/protein-tools/protein-tools.html'),
    ('spectra', 'apps/bca/bca.html'),
    ('cryo',    'apps/iceberg/iceberg.html'),
    ('cuppa',      'apps/cuppa/cuppa.html'),
    ('beacon',     'apps/beacon/beacon.html'),
    ('lumina',     'apps/lumina/lumina.html'),
    ('ribbon',     'apps/ribbon/ribbon.html'),
    ('protocols',  'apps/archive/archive.html'),
    ('cellarchive', 'apps/cell-archive/cell-archive.html'),
    ('incubator',   'apps/incubator/incubator.html'),
    ('labbook',     'apps/labbook/labbook.html'),
    ('blot',        'apps/western-blot/western-blot.html'),
]

# Which apps ship in which build. 'all' is the personal Hub; 'product' is the sellable
# story — the notebook, the analysis that feeds it, the protocol library and the modules
# they depend on. Cuppa and the off-path tools stay out (Fabricata, Cadence and LDI are retired to old_stuff/).
# The sellable build is the spine plus what feeds it: Labbook (the notebook), Archive (protocols
# AND the reagent Library, which now holds plasmids too), Cells (the three frames the merged app
# hosts), Echo, and the analysis apps Echo hands off to. Blueprint, Blot and Helix are useful in
# a TPD lab but sit outside the plan -> execute -> analyse loop, so they stay in the personal
# build and the repo. Plasmids is no longer shipped as its own app: it is a Library tab.
PROFILES = {
    'product': ['labbook', 'protocols',
                'incubator', 'cellarchive', 'cryo',
                'echo', 'hitfinder', 'deg', 'spectra', 'lumina', 'beacon'],
}
# ── Standalone Labbook ────────────────────────────────────────────────────
# Labbook + Archive as one self-contained file, with no dHUB around it. Archive is embedded
# verbatim as a base64 iframe: it publishes its bridge onto window.parent, which inside Labbook
# IS Labbook — so nothing in either app has to be forked or de-collided.
# ── Standalone Labbook, and the installable bench app ─────────────────────
# Both profiles build the same page; --profile=labbook-pwa additionally packages it for a phone.
#
# The Firebase tags and config are injected HERE and never written into apps/labbook/labbook.html:
# the source file stays free of project credentials and keeps the Bucket A rule (no shell globals,
# no hardcoded URLs of its own). lbFb() picks the parent's Firebase inside dHUB and its own here,
# so the two builds share one sync path, one conflict rule and one status pill.
LABBOOK_FB = '''
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js"></script>
<script>
// If these tags did not load — no signal on the first run, a blocked gstatic — `firebase` is
// simply undefined and _lbFbSelf() returns nothing. Nothing below the seam may depend on it.
var LB_FB_CONFIG = {
  apiKey: 'AIzaSyBpw9UbXnCciIi7VBapBeBJOq9U7RSS4g8',
  authDomain: 'thehub-f80ae.firebaseapp.com',
  projectId: 'thehub-f80ae',
  storageBucket: 'thehub-f80ae.firebasestorage.app',
  messagingSenderId: '30483085120',
  appId: '1:30483085120:web:1de8be497e632f12a22ca5',
  databaseURL: 'https://thehub-f80ae-default-rtdb.europe-west1.firebasedatabase.app'
};
</script>
</head>'''

# The bench app lives at an unguessable slug for the same reason Archive does: a private repo
# still serves a *public* Pages site. Unlike Archive this one holds real data behind a sign-in,
# so the slug is not the access control — the Firebase rules are — but it keeps the notebook out
# of anyone's way. NEVER change it: every installed home-screen app is pinned to it.
LABBOOK_SLUG = 'labbook-6b1d0c4f9a72'

# ── The native app: the same page, with everything it loads packaged INSIDE it ─────────────────────
# `labbook-app` writes the www/ folder of the Capacitor project (mobile/). Where the PWA fetches the Firebase SDK, the
# fonts and SheetJS from CDNs and leans on a service worker to remember them, the app carries them in its bundle:
# opened for the first time on a bench with no signal it still starts, and the only thing that needs a connection is
# the sync itself. Hashes come from vendor/MANIFEST.json (tools/vendor_fetch.py); a file that does not match refuses the build.
NATIVE_DIR = 'mobile/www'
def _vendor(rel):
    import hashlib, json
    man = json.load(open(os.path.join(BASE, 'vendor/MANIFEST.json')))
    data = open(os.path.join(BASE, 'vendor', rel), 'rb').read()
    want = man.get(rel, {}).get('integrity')
    got = 'sha384-' + base64.b64encode(hashlib.sha384(data).digest()).decode()
    if want != got:
        sys.stderr.write('labbook-app profile: vendor/%s does not match vendor/MANIFEST.json (run tools/vendor_fetch.py)\n' % rel)
        sys.exit(1)
    return data
_FONT_LINK = re.compile(r'<link href="https://fonts\.googleapis\.com/css2[^>]*>')
def _localize(html):
    # Every document the app embeds is localised the same way: the fonts and SheetJS are files next to index.html.
    # (A srcdoc frame resolves relative URLs against its parent's, so the same relative path works inside them.)
    html, n = _FONT_LINK.subn('<link rel="stylesheet" href="fonts/plex.css">', html)
    html = html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>',
                        '<script src="xlsx.full.min.js"></script>')
    return html

if profile in ('labbook', 'labbook-pwa', 'labbook-app'):
    lb = open(os.path.join(BASE, 'apps/labbook/labbook.html'), encoding='utf-8').read()
    arc = open(os.path.join(BASE, 'apps/archive/archive.html'), 'rb').read()
    if profile in ('labbook-app', 'labbook-pwa'):
        lb = _localize(lb)
        arc = _localize(arc.decode('utf-8')).encode('utf-8')
    arc_b64 = base64.b64encode(arc).decode('ascii')
    lb, n = re.subn(r'(?<=var ARCHIVE_B64 = ")[^"]*', arc_b64, lb)
    if n != 1:
        sys.stderr.write('labbook profile: expected 1 ARCHIVE_B64 placeholder, got %d\n' % n)
        sys.exit(1)
    # Cells on the phone: Incubator, Lines and Freezer are embedded the way Archive is, and read their host
    # through window.parent - which is Labbook here. The host side (JournalStore, the alert rules, the
    # cell-line reference, the built-in line list) is lifted from the shell between its CELLS-HOST markers, so
    # there is one copy of each and nothing to keep in step by hand.
    for var, rel in (('INCUBATOR_B64', 'apps/incubator/incubator.html'),
                     ('CELLARCHIVE_B64', 'apps/cell-archive/cell-archive.html'),
                     ('FREEZER_B64', 'apps/iceberg/iceberg.html')):
        raw = open(os.path.join(BASE, rel), 'rb').read()
        if profile in ('labbook-app', 'labbook-pwa'):
            raw = _localize(raw.decode('utf-8')).encode('utf-8')
        b64 = base64.b64encode(raw).decode('ascii')
        lb, n = re.subn(r'(?<=var %s = ")[^"]*' % var, lambda m: b64, lb)
        if n != 1:
            sys.stderr.write('labbook profile: expected 1 %s placeholder, got %d\n' % (var, n))
            sys.exit(1)
    shell_src = open(os.path.join(BASE, 'shell/hub-shell.html'), encoding='utf-8').read()
    a = shell_src.find('// CELLS-HOST:BEGIN')
    z = shell_src.find('// CELLS-HOST:END')
    if a < 0 or z < a:
        sys.stderr.write('labbook profile: the CELLS-HOST markers are missing from shell/hub-shell.html\n')
        sys.exit(1)
    cells_host = ('<script>\n// fbReady() is the shell\'s; here it is "the Firebase app exists and someone is signed in".\n'
                  'function fbReady(){ try{ return !!(window.firebase && firebase.apps && firebase.apps.length && firebase.auth().currentUser); }catch(e){ return false; } }\n'
                  + shell_src[a:z] + '\n</script>\n')
    fb_tags = LABBOOK_FB
    if profile in ('labbook-app', 'labbook-pwa'):
        fb_tags = re.sub(r'<script src="https://www\.gstatic\.com/firebasejs/[\d.]+/(firebase-[a-z]+-compat\.js)"></script>',
                         lambda m: '<script src="firebase/%s"></script>' % m.group(1), fb_tags)
    if profile == 'labbook-app':
        # LB_NATIVE: this is the installed app, not a browser tab. Google sign-in cannot complete inside a WKWebView
        # (popup and redirect are both refused), so the app signs in with email and password only.
        fb_tags = fb_tags.replace('<script>\n// If these tags', '<script>var LB_NATIVE = true;</script>\n<script>\n// If these tags', 1)
    lb, n = re.subn(r'</head>', lambda m: cells_host + fb_tags, lb, count=1)
    if n != 1:
        sys.stderr.write('labbook profile: could not find </head>\n')
        sys.exit(1)

    if profile == 'labbook':
        out = OUT if args else os.path.join(BASE, 'labbook-standalone.html')
        open(out, 'w', encoding='utf-8').write(lb)
        print('Labbook standalone: %s (%s chars, Archive embedded: %s chars)'
              % (out, f'{len(lb):,}', f'{len(arc_b64):,}'))
        sys.exit(0)

    def vendored_files():
        files = ['xlsx.full.min.js', 'fonts/plex.css'] + ['firebase/firebase-%s-compat.js' % n for n in ('app', 'auth', 'database', 'storage')]
        return files + sorted(f for f in (os.path.join('fonts', x) for x in os.listdir(os.path.join(BASE, 'vendor/fonts'))) if f.endswith('.woff2'))

    if profile == 'labbook-app':
        import shutil
        out_dir = os.path.abspath(args[0]) if args else os.path.join(BASE, NATIVE_DIR)
        if os.path.isdir(out_dir):
            shutil.rmtree(out_dir)
        os.makedirs(os.path.join(out_dir, 'firebase'))
        os.makedirs(os.path.join(out_dir, 'fonts'))
        lb = lb.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>', 1)
        open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(lb)
        files = vendored_files()
        for rel in files:
            open(os.path.join(out_dir, rel), 'wb').write(_vendor(rel))
        print('Labbook app bundle: %s (index.html %s chars, %d vendored files)' % (out_dir, f'{len(lb):,}', len(files)))
        sys.exit(0)

    # ── the installable bench app ──
    import hashlib, shutil, json
    out_dir = os.path.abspath(args[0]) if args else os.path.join(BASE, 'dist', LABBOOK_SLUG)
    head = '''
<meta name="robots" content="noindex, nofollow">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#13161e" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Labbook">
<meta name="description" content="Experiment notebook — plan, log, annotate and export. Works offline.">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      reg.addEventListener('updatefound', function(){
        var w = reg.installing; if (!w) return;
        w.addEventListener('statechange', function(){
          if (w.state === 'installed' && navigator.serviceWorker.controller && window.toast)
            toast('Update ready — reopen Labbook to apply');
        });
      });
    }).catch(function(){});
  });
}
</script>
</head>'''
    lb, n = re.subn(r'</head>', head, lb, count=1)
    if n != 1:
        sys.stderr.write('labbook-pwa profile: could not find </head>\n')
        sys.exit(1)
    ver = hashlib.sha256(lb.encode('utf-8')).hexdigest()[:10]

    manifest = '''{
  "name": "Labbook — experiment notebook",
  "short_name": "Labbook",
  "description": "Plan, log, annotate and export experiments. Works offline.",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#f4f5f8",
  "theme_color": "#3f6fa8",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
'''
    # Cache-first for the app, NEVER for the data. Archive can cache everything because its
    # content is the build; this holds a notebook that syncs, so anything reaching Firebase or
    # Google's auth must go to the network and fail honestly when there is none — a cached
    # answer to "what is in my notebook" is the one thing this app must not invent. The local
    # copy and IndexedDB are the offline store, exactly as they are in the Hub.
    sw = '''const CACHE = 'labbook-%s';
// The page and everything it loads, so the very first launch with no signal works: the Firebase SDK, the fonts
// and SheetJS are files of this app (vendor/), not CDN requests that had to be made once and remembered.
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'].concat(__VENDORED__);
// Data and auth only. (A blanket googleapis.com once also swallowed the fonts; they are local now,
// but the list stays specific so nothing static is ever excluded by accident.)
const NEVER = [/firebaseio\\.com/, /firebasedatabase\\.app/,
               /identitytoolkit\\.googleapis\\.com/, /securetoken\\.googleapis\\.com/,
               /firebasestorage\\.googleapis\\.com/, /firebaseapp\\.com\\/__\\/auth/];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  if (NEVER.some(rx => rx.test(req.url))) return;   // data and auth are never served from cache
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
''' % ver

    vend = vendored_files()
    sw = sw.replace('__VENDORED__', json.dumps(['./' + v for v in vend]))
    for rel in vend:
        dst = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'wb').write(_vendor(rel))
    os.makedirs(os.path.join(out_dir, 'icons'), exist_ok=True)
    open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(lb)
    open(os.path.join(out_dir, 'manifest.webmanifest'), 'w', encoding='utf-8').write(manifest)
    open(os.path.join(out_dir, 'sw.js'), 'w', encoding='utf-8').write(sw)
    for name in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']:
        src_icon = os.path.join(BASE, 'apps/labbook/icons', name)
        if not os.path.exists(src_icon):
            sys.stderr.write('labbook-pwa profile: missing icon %s (run tools/make_icons.py --app=labbook)\n' % name)
            sys.exit(1)
        shutil.copyfile(src_icon, os.path.join(out_dir, 'icons', name))
    print('Labbook PWA: %s (index.html %s chars, cache labbook-%s)'
          % (out_dir, f'{len(lb):,}', ver))
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

sys.path.insert(0, os.path.join(BASE, 'tools'))
from inline_3dmol import inline as _inline_3dmol

src = open(SHELL, encoding='utf-8').read()
errors = []
# SheetJS, once for the whole Hub. The shell carries it and a srcdoc frame is same-origin, so Echo, Beacon and BCA take
# window.parent.XLSX instead of each embedding the same 639 KB (about 850 KB once base64'd) — the source files keep their
# copy so each app still opens on its own; only the bundle drops it. With no parent copy (an app opened alone) the shim
# falls back to the CDN tag the other apps use.
_SHEETJS_BLOCK = re.compile(r'<script>\s*/\*! xlsx\.js \(C\) 2013-present SheetJS[^\n]*\n[\s\S]*?</script>')
_SHEETJS_SHIM = ('<script>/* SheetJS: the Hub shell\'s copy (embed.py removed this app\'s own) */(function(){ var p; try{ p = window.parent; }catch(e){}\n'
                 'if (p && p !== window && p.XLSX) { window.XLSX = p.hubXLSX ? p.hubXLSX() : p.XLSX; }\n'
                 'else { document.write(\'<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\\/script>\'); } })();</script>')
SHEETJS_SHARED = ('echo', 'beacon', 'spectra')
if not _SHEETJS_BLOCK.search(src):
    errors.append('shell: its SheetJS block is missing — the apps would have no XLSX to take from it')
# A deployed build (an output path was given, i.e. dist/) carries IBM Plex as files next to index.html instead of asking Google for it:
# the same face with no third-party request, and the first paint does not wait on one. (A srcdoc frame resolves a relative URL against
# its parent's, so fonts/plex.css works inside every app frame; the Labbook/Archive PWA profiles already do this.) The personal
# ./dHUB.html opened from disk keeps the Google link, since there is no fonts/ folder beside it.
SELF_FONTS = bool(args) and profile in ('all', 'product')
if SELF_FONTS:
    src = _FONT_LINK.sub('<link rel="stylesheet" href="fonts/plex.css">', src)

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
    if key == 'ribbon':
        # Ribbon's source loads 3Dmol from a CDN (pinned, integrity-checked). A Hub build carries the same bytes inline,
        # so the structure viewer works with no network. tools/inline_3dmol.py checks the hash before it writes anything.
        try:
            data = _inline_3dmol(data)
        except (ValueError, OSError) as e:
            errors.append('ribbon: could not embed 3Dmol - %s' % e)
            continue
    if key in SHEETJS_SHARED:
        html_txt, n_js = _SHEETJS_BLOCK.subn(lambda m: _SHEETJS_SHIM, data.decode('utf-8'))
        if n_js != 1:
            errors.append('%s: expected 1 inline SheetJS block to replace, got %d' % (key, n_js))
            continue
        data = html_txt.encode('utf-8')
    if key == 'echo':
        # Echo's test data is a file beside the build (see _ensureTestData in echo.html), not 870 KB inside every Hub.
        ECHO_TESTDATA = open(os.path.join(BASE, 'apps/echo/echo-testdata.js'), 'rb').read()
    if SELF_FONTS:
        data = _FONT_LINK.sub('<link rel="stylesheet" href="fonts/plex.css">', data.decode('utf-8')).encode('utf-8')
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
if any(k == 'echo' for k, _ in APPS) and out_dir:
    open(os.path.join(out_dir, 'echo-testdata.js'), 'wb').write(ECHO_TESTDATA)
    print(f'Wrote {os.path.join(out_dir, "echo-testdata.js")} (Echo test data, fetched on first use)')
if SELF_FONTS and out_dir:
    import shutil
    fdir = os.path.join(out_dir, 'fonts'); os.makedirs(fdir, exist_ok=True)
    for fn in os.listdir(os.path.join(BASE, 'vendor/fonts')):
        if fn.endswith(('.woff2', '.css')):
            shutil.copy(os.path.join(BASE, 'vendor/fonts', fn), os.path.join(fdir, fn))
    print(f'Wrote {fdir} (IBM Plex, self-hosted)')

# A dist/ build is the deployed Pages site — Jon's personal Hub and an unlisted Archive.
# Neither belongs in a search index. (robots.txt only counts at the site root, which is why
# it is written here rather than alongside the Archive build.)
if args and out_dir:
    open(os.path.join(out_dir, 'robots.txt'), 'w', encoding='utf-8').write(
        'User-agent: *\nDisallow: /\n')
    print(f'Wrote {os.path.join(out_dir, "robots.txt")} (noindex for the whole site)')
