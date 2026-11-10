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

All of them are on the **NetRate page of the Reference Rebuilds gallery**:
https://claude.ai/artifact/DJ1wyggQMRGJ6CdQxi8axG (open it and pick “NetRate”, or add `#netrate`).

| Page | Folder | Pages | Also alone |
| --- | --- | --- | --- |
| Design 1 (fintech) | `01-fintech/` | `index.html` before release, `live.html` after release; other pages `terms.html` … / `live-terms.html` … | “NetRate × Design 1”, https://claude.ai/artifact/PmdwM4ASFvM7oNRjBXNXFd |

## Design 1 (`01-fintech/`)

Round 2 (current): one source `page.html` → `python3 -I site/studies/01-fintech/tools/build.py` → `index.html` (before
release) and `live.html` (after release). Renders: `node site/studies/01-fintech/tools/shots.js` (3x, 390 × 790 under a
54 px strip with a Dynamic Island) → `python3 -I site/studies/01-fintech/tools/convert.py`. Gallery:
`python3 -I studies/tools/build_gallery.py` → publish `dist/studies/index.html` with every listed file. The notes below
are from round 1 (the strip was 46 px and the cards had phones then).

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

## Design 1, round 2 (owner, Nov 2026) — plan and rules

Owner's requests: make the last phone look as much like the App Store as possible; expand the site with NetRate content
and sharper images; two versions of the page, **before release** (`index.html`) and **after release** (`live.html`, the
lasting site), from one source (`page.html` → `tools/build.py`); put every NetRate build on a separate **NetRate page
inside the Reference Rebuilds gallery artifact**. Then (his interruption): **show the phone/app much less** — the app in
one or two places at most (hero, and the App Store phone he asked for), plus **one showcase section in the style of
`refs/showcase-sample.webp`** (dark navy, tilted phone, blue glass slabs; NetRate content and colours, not the sample's
brand); everything else is motion and graphics, borrowing ideas from the other studies (02 stacked cards, word-by-word
statement, footer light; 03 wordmark drawn by scroll, one-at-a-time FAQ; 04 depth parallax, stats lighting up; 05 hover
panels with a follow cursor; 06 hand-drawn lines drawn by scroll).

Planned order: hero (phone) → kinetic band → “We Made Rates Clearer!” cards with animated rate rows / age labels /
alert sentence (no phones) → how it works as stacked cards → statement word by word with a drawn underline → honesty as
hover panels → showcase (tilted phone, dark app screen) → trust grid → for offices (panel mock-up) → FAQ → App Store
phone (SOON before release, GET + download buttons after) → footer with a wordmark drawn by scroll.

`brand/netrate-poster-uk.webp` is the owner's poster (“NetRate.app”). Round 3 uses its graphic part only
(`img/home-screen.webp`, the phone with the NetRate icon) in the “one tap away” panel; its “best exchange rates” line,
currency coins, flag and Apple badge stay out because of the brief.

Round 3 (owner): Inter Tight + Inter, no hollow letters, a very large NetRate marquee at the end (left to right, faded
edges), phone images at once, stronger contrast and framing (white boxes with an edge on a cool off-white ground), a
dotted background in soft patches with perspective dot floors, lighter rendering for smooth scrolling.

## Design 1, round 5 — the other pages and the hand-off

- `tools/pages.py` (run by `tools/build.py` for both versions) writes Terms of use, Privacy, Disclaimer, Cookies, Delete
  account, For exchange offices, Contact and 404 around the built home page's own header, phone menu and footer (in-page
  links become `index.html#…`). The legal texts are **drafts** from how the app works: `[placeholders]` (company, address,
  emails, law, retention, providers) show as amber `.ph` spans and a “Draft for review” note heads each page.
- The phone menu: `.menu-btn` in the header (and its floating copy) opens `#msheet`; `main.js` on the home page,
  `pages.js` on the others.
- `python3 -I tools/export.py` (repo root) → `exports/`: before/after zips, single offline HTML files of both versions
  and of the gallery, and the source zip. See `HANDOFF.md`.
