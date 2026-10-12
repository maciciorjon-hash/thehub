# Writes the studio modules into apps/ribbon/ribbon.html between the RIBBON STUDIO markers (inside the main script, before Boot).
#   python3 tools/ribbon_dev/inject_studio.py           write it
#   python3 tools/ribbon_dev/inject_studio.py --check   exit 1 if the markers differ from the sources (tools/static_checks.sh runs this: an edit made
#                                                       inside the markers is lost by the next injection, as _noDraw nearly was)
import os, sys
# studio.js holds "// @@CMD@@" where the other modules go, in this order.
MODS=os.environ.get('RB_MODS','studio_cmd.js,studio_look.js,studio_analyse.js,studio_more.js').split(',')

p='apps/ribbon/ribbon.html'; s=open(p).read()
d='tools/ribbon_dev/'
body=''.join(open(d+m).read().rstrip()+'\n' for m in MODS if os.path.exists(d+m))
src=open(d+'studio.js').read().replace('// @@CMD@@\n',body).rstrip()+'\n'
B='// ═══ RIBBON STUDIO — the parts'; E='// ═══ RIBBON STUDIO — END ═══\n'
if B in s:
    a=s.index(B); b=s.index(E,a)+len(E); s=s[:a]+src+s[b:]
else:
    a=s.index('// ── Boot ─────'); s=s[:a]+src+'\n'+s[a:]
if '--check' in sys.argv:
    cur=open(p).read()
    if cur!=s: sys.exit('apps/ribbon/ribbon.html differs from tools/ribbon_dev — an edit was made inside the RIBBON STUDIO markers.\n  Port it to tools/ribbon_dev/*.js, then run: python3 tools/ribbon_dev/inject_studio.py')
    print('ribbon studio: in sync'); sys.exit(0)
open(p,'w').write(s); print('injected',len(src))
