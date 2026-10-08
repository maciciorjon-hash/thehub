# Writes the studio modules into apps/ribbon/ribbon.html between the RIBBON STUDIO markers (inside the main script, before Boot).
import os
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
open(p,'w').write(s); print('injected',len(src))
