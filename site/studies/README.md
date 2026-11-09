# NetRate × studies

NetRate landing pages built on the structures of the reference studies (`studies/`) the owner liked most:
design **1**, then **6**, then **2** (his order). One at a time: a page is finished, published and reported, and the
next one starts only when Mohammad says so.

Rules (owner, Nov 2026):

- Keep the study's structure exactly (sections, order, grid, sizes); change only the content to NetRate's.
- English version of the app for now; the copy follows the NetRate brief (CLAUDE.md, “NetRate site”) and reuses
  Aurora's vetted English (`site/variants/aurora/src/i18n/en.json`).
- Only a short introduction of the app, not the whole app.
- Logo: the gradient icon tile from `brand/` on light grounds.
- Make the motion complete and professional: smooth scrolling (Lenis), scroll-driven scenes, and finish the parts the
  study left incomplete.

| Page | Folder | Artifact |
| --- | --- | --- |
| Design 1 (fintech) | `01-fintech/` | “NetRate × Design 1”, https://claude.ai/artifact/PmdwM4ASFvM7oNRjBXNXFd |

## Design 1 (`01-fintech/`)

- App screens are the app's own renders: `node site/studies/01-fintech/tools/shots.js` drives the app through
  `site/tools/poster-host.html` (its public hooks) at **390 × 798**, so the phone's drawn status strip (2.75 e of a 26 e
  phone = 46 px of 390) plus the render make the whole 390 × 844 screen, tab bar included. A 390 × 1500 render of the
  main screen lets the hero phone's list scroll as the page scrolls; its tab bar is cut from the normal render and laid
  over it. Then `python3 -I site/studies/01-fintech/tools/convert.py` writes the webp files (raw PNGs stay in
  `img/raw/`, gitignored) and prints each screen's top colour for the strip (`--top`).
- Card highlights (`.spot`) sit on the app's own elements, in app pixels × 23.4 e / 390.
- The store phone is the reference pose (perspective 3653, rotateX 30.39°, rotateY 30.81°, rotateZ −0.68°) with a body
  of 14 stacked rounded slabs, so its edge follows the corners; the section is tall enough for the whole phone.
- Artifact: `python3 -I site/studies/tools/build_artifact.py 01-fintech` → `dist/netrate-01-fintech/`, then publish
  `index.html` with `root` = that folder and every listed file.
- Known gap: English only, written with physical CSS properties; a Persian version needs a logical-property pass.
