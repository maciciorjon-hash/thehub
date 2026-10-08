# vendor/

Third-party code that `embed.py` writes into a build. The apps' source files never contain it.

| file | what | source | integrity (SHA-384) |
|---|---|---|---|
| `3Dmol-min-2.5.5.js` | 3Dmol.js 2.5.5, the molecular viewer behind Ribbon (BSD-3-Clause, notices in `3Dmol-min-2.5.5.js.LICENSE.txt`) | `https://unpkg.com/3dmol@2.5.5/build/3Dmol-min.js` | `sha384-OsczYbldvrHgslr9fFp/i4GiLSeuw9l+QIlv99ITw8soOwXcoGeflFMLg+CU/X1d` |

`tools/inline_3dmol.py` replaces Ribbon's pinned `<script src=…>` tag with this file, inline, and **refuses to build if the
file's hash is not the one the tag pins** — so the copy in the Hub is byte-for-byte the copy the CDN would have served.
Ribbon opened on its own (not through the Hub) still loads 3Dmol from the CDN (unpkg, then jsDelivr, then cdnjs).

To move to another version: change the version in `apps/ribbon/ribbon.html` (the head tag and `RB3D`), put the new file here,
and update the hash in both places; `tools/ribbon_invariants.mjs` RB2 and RB24 fail until all of it agrees.
