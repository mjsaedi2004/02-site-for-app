# Reference rebuilds (`studies/`)

Mohammad's request (Nov 2026, the previous NetRate direction is on hold): rebuild each design he sent **exactly as it
is** (English only, not the NetRate app yet), check it **twice** against the original, then upgrade it a little with
professional, smooth motion, interaction and scrolling. Each image or video is a separate design (a whole homepage or
one section). Build them **one at a time in his priority order (01 → 06)**; after each one, update the gallery
artifact, give him the link and continue without asking. Later the best parts get combined into the NetRate site.

Gallery (one artifact, numbered, opens each study in place with Live / Reference / Split / Onion skin):
**Reference Rebuilds** — https://claude.ai/artifact/DJ1wyggQMRGJ6CdQxi8axG (private to the owner until he shares it).

## Registry

| # | Reference | What it is | Folder | Status |
|---|-----------|------------|--------|--------|
| 01 | `refs/designs/01.jpg` (Dribbble shot 1200 × 2139) | Fintech homepage: hero with phone, black "Banking easier" panel + 3 cards, App Store 3D phone, footer | `01-fintech/` | built |
| 02 | `refs/designs/02.mp4` (720 × 540, 30 fps, 30.2 s) | Violet AI landing: animated neon/purple background, kinetic headline with icon pills, floating cards, phone, giant wordmark | `02-violet/` | built |
| 03 | `refs/designs/03.mp4` (640 × 480, 60 fps, 30 s) | Digital bank: blurred maroon photo gradients, "Banking for future", giant wordmark, FAQ, 3D cards | `03-bank/` | built |
| 04 | `refs/designs/04.mp4` (720 × 540, 30 fps, 27 s) | Crypto wallet: condensed heavy type, isometric illustrations, stats, sticky phone steps, FAQ, marquee | — | next |
| 05 | `refs/designs/05.mp4` (640 × 480, 29.97 fps, 15.5 s) | Finance platform: light grey, laptop + phone mockups, tabs with phone, dark CTA | — | queued |
| 06 | `refs/designs/06.mp4` (640 × 480, 60 fps, 16.5 s) | Investing app: lime panels, hand-drawn arrows, market phones, partners, dark CTA | — | queued |

Also sent with the request (references to use in places later, not studies themselves):
- `refs/backgrounds/bg-01.jpg … bg-08.jpg` — background photos (bg-01 ← photo_2026-07-26_10-57-08, bg-02 ← 2026-08-04_10-51-13,
  bg-03 ← 2026-11-08_15-57-09, bg-04 ← 15-57-45, bg-05 ← 15-58-01, bg-06 ← 15-58-59, bg-07 ← 16-02-07, bg-08 ← 16-02-34).
- `refs/Exchange_Background_Lab.html` — his own background lab page (read it fully before publishing any part of it).

## Rules

- Same sections, order, grid, sizes and positions as the reference. Only real brands change: brand names, logos,
  people's names and photos become placeholders of similar shape and length (01 uses "Arzino", Adatum/zeta/NOVA/…);
  sample ratings are labelled ("SAMPLE RATING"). The original copy otherwise stays.
- Each study is self-contained in its folder (`index.html`, `style.css`, `main.js`, `img/`); libraries from jsDelivr
  (gsap 3.15.0 + ScrollTrigger, lenis 1.3.27), fonts from Google Fonts — the same files work locally and in the artifact.
- The page is complete without JS and with reduced motion; intro hiding uses a `js-intro` class set in `<head>` with a
  4 s safety timeout.

## Workflow

1. Serve the repo: `python3 -m http.server 8099 --bind 127.0.0.1` (from the repo root).
2. Video references: `ffprobe` for size/fps/duration, `ffmpeg` frames (12-frame sheets in `refs/sheets/`; denser frames
   in the scratchpad for motion analysis).
3. Fidelity (image references): `node tools/qa/shot.js <url> build.png 1440 900`, then
   `python3 -I tools/qa/compare.py refs/designs/01.jpg build.png out 60,60,1140,2078 0:990,990:1700,1700:2320,2320:2691 0.5`
   (side-by-side + 50 % blend per band), `tools/qa/inkcmp.py` (ink boxes of named regions in both), `tools/qa/boxes.js`
   (element boxes). 3D mockups: measure edges, solve the CSS pose with `tools/qa/posefit.py`, map reference points onto
   the flat phone with `tools/qa/flatmap.py`.
4. Motion: `node tools/qa/motion01.js <url> out` (intro frames, rest state, scroll scenes, floating header, reduced motion,
   console). Overflow at 390 / 768 / 1024 / 1280 / 1920.
5. Gallery: add the study to `STUDIES` in `index.html` (status, thumb, ref), thumbnail with `tools/qa/thumb.js`,
   add the folder to `BUILT` in `tools/build_gallery.py`, run `python3 -I studies/tools/build_gallery.py` and publish
   `dist/studies/index.html` with `root` = `dist/studies` and every listed file (same file path keeps the URL).

## Study 03 notes

- The video shows the page at 640 × 480 with the page area x 30–612, y 34–442 → 1440 × 1009 per screen (header 78).
  `tools/qa/scenes03.js` captures each section at its reference moment (viewport 1440 × 1009).
- Brand "Luna" → placeholder "Nula" (same monoline style: the letters are stroked SVG paths, so the header logo and the
  giant about-section wordmark are drawn by `stroke-dashoffset`). Merchant names are placeholders (Pixel Store, Northwind,
  Cloud Apps, Studio Pro); people are drawn SVG avatars; photo textures are blurred CSS gradients sampled from the video.
- Font: Lexend (600 for headlines, 500 for sub-headings).
- Pitfalls: GSAP `rotation` on an element with a CSS 3D pose replaces the pose (the cards lost their tilt) → the pose
  stays in CSS and GSAP animates `--sy` / `--sr` variables used inside it; the cards settle to exactly 0 offset when the
  section reaches the header so the resting layout matches the reference; scaled phones on small screens use `scale`
  (the inner UI keeps its design pixels).

## Study 02 notes

- The video shows a 1440 × 904 site in a rounded window on a glowing backdrop; the rebuild keeps that frame: a fixed `.win`
  (inset `3.6vw / 5vh`) with its own scroller, Lenis on that wrapper (`wrapper`/`content`) and `ScrollTrigger.defaults({ scroller })`.
  Inside, `--u = 100cqi / 1440` (the window is a size container); scenes are sticky stages in tall sections.
- QA viewport 1552 × 1004 makes the window exactly 1440 × 904: `tools/qa/scenes02.js` captures the reference moments,
  `tools/qa/flow02.js` a scroll walkthrough. Reference panel crops: frame x 36–684, y 66–473 at 1×, scaled to 1440 × 904.
- Fonts: Manrope 500 (sizes from the reference ink: headline 97.4u, wordmark 146u / 191u, footer caps 150u 600) and
  Instrument Serif italic for "Manifest / Reality".
- Pitfalls: scrubbed timelines map progress to their own length, so each ends with `.set({}, {}, 1)`; scroll tweens on
  elements the intro also animates use `fromTo` with `immediateRender: false`; a filter tween from `none` rendered as
  `brightness(0)` (always give `brightness(1)` as the start); `destination-in` with several gradients intersects them
  (paint the union on an offscreen canvas first); split text keeps spaces as text nodes; overlapping sticky scenes
  (`margin-bottom: -30cqb`, transparent stages) remove empty screens between scenes.

## Study 01 notes (numbers that matter)

- The shot's page area is x 60–1140, y 60–2078 → 1440 design (× 4/3); `--u` = one design px (`min(100cqi,1440px)/1440`).
  Page height 2691 px, same as the reference.
- Phones: `--pw` width, `--e = --pw / 26` for every position (font-size em compounding broke positions); content layers
  are inset `-1.3e` so coordinates are measured from the phone's outer edge.
- Fonts: Outfit stands in for the reference's Gilroy; section titles keep the reference's ink height and get
  `letter-spacing: .045em` (cards `.032em`) to reach its width.
- App Store phone: flat 458.5 × 940.8, `perspective(3653) rotateX(30.39deg) rotateY(30.81deg) rotateZ(-0.68deg)` about
  its centre (fit to the reference edges and content lines, ≈ 1 px residual); `main.js` turns it into this pose on scroll
  through four CSS variables.
- Pitfalls: GSAP `from()` reads the end value at creation, so remove the `js-intro` hiding class first; `cloneNode` of the
  header copied GSAP's inline from-states (clone before the intro); a `y` offset on the last block (footer) stretches the
  page until it plays (use a clip reveal); Playwright full-page shots include clipped overflow (`.hero { overflow-x: clip }`).
