# vendor/

Third-party code that `embed.py` writes into a build. The apps' source files never contain it.

| file | what | source | integrity (SHA-384) |
|---|---|---|---|
| `3Dmol-min-2.5.5.js` | 3Dmol.js 2.5.5, the molecular viewer behind Ribbon (BSD-3-Clause, licence in `3Dmol-LICENSE.txt`) | `https://unpkg.com/3dmol@2.5.5/build/3Dmol-min.js` | `sha384-OsczYbldvrHgslr9fFp/i4GiLSeuw9l+QIlv99ITw8soOwXcoGeflFMLg+CU/X1d` |
| `rdkit-minimal-2026.9.1.js` + `.wasm` | RDKit.js 2026.9.1, the chemistry toolkit behind structures, properties and SAR in Echo, Dora and Hit Finder (BSD-3-Clause, licence in `RDKit-LICENSE.txt`) | `https://unpkg.com/@rdkit/rdkit@2026.9.1/dist/RDKit_minimal.{js,wasm}` | js `sha384-gBdna7fxxnpz64Sewln4eBm8+sAiS6ur6q7X0xEum//b7MzSjJGK3ENuAmuRL5Y3`, wasm `sha384-o1WTb3ojy+rYWbWbFHMcvH3BDxTKFBRJoH2UQ5Y2GNCDxwp13z33o8ZNtWOBGBxL` |

`tools/inline_3dmol.py` replaces Ribbon's pinned `<script src=…>` tag with this file, inline, and **refuses to build if the
file's hash is not the one the tag pins** — so the copy in the Hub is byte-for-byte the copy the CDN would have served.
Ribbon opened on its own (not through the Hub) still loads 3Dmol from the CDN (unpkg, then jsDelivr, then cdnjs).

`tools/inline_rdkit.py` writes RDKit into the shell of a build with no output path (`dHUB.html`, or `--embed-rdkit`) as two text blobs, or beside `index.html` as `rdkit/` for a deployed build, and **refuses to build if either file is not the one the loader pins** (`RDKIT_SRI` in the RDKIT LOADER block). To move RDKit: change `RDKIT_VERSION` and `RDKIT_SRI` in Echo's loader block (then `tools/sync_screen_engine.py`), put the new files here and update `inline_rdkit.py`'s two paths; `tools/rdkit_embed_invariants.mjs` RD1 fails until all of it agrees.

To move 3Dmol to another version: change the version in `apps/ribbon/ribbon.html` (the head tag and `RB3D`), put the new file here,
and update the hash in both places; `tools/ribbon_invariants.mjs` RB2 and RB24 fail until all of it agrees.

## Carried inside the phone app (`embed.py --profile=labbook-app`)

Fetched and hashed by `tools/vendor_fetch.py` (it is the only place the versions are named); the full list with SHA-384 is
`vendor/MANIFEST.json`, and `embed.py` refuses to build if a file does not match it.

| path | what | source |
|---|---|---|
| `firebase/firebase-{app,auth,database,storage}-compat.js` | Firebase JS SDK 10.12.2 (Apache-2.0) | `https://www.gstatic.com/firebasejs/10.12.2/` |
| `xlsx.full.min.js` | SheetJS 0.18.5 (Apache-2.0), Freezer's .xlsx import/export | `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/` |
| `fonts/plex.css` + `fonts/*.woff2` | IBM Plex Sans and Mono, Latin + Latin-ext (SIL OFL 1.1) | Google Fonts |

