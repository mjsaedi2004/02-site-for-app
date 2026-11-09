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
| 04 | `refs/designs/04.mp4` (720 × 540, 30 fps, 27 s) | Crypto wallet: condensed heavy type, isometric illustrations, stats, sticky phone steps, FAQ, marquee | `04-wallet/` | built |
| 05 | `refs/designs/05.mp4` (640 × 480, 29.97 fps, 15.5 s) | Finance platform: light grey, laptop + phone mockups, tabs with phone, dark CTA | `05-finance/` | built |
| 06 | `refs/designs/06.mp4` (640 × 480, 60 fps, 16.5 s) | Investing app: lime panels, hand-drawn arrows, market phones, partners, dark CTA | `06-invest/` | built |

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
   Video studies (round 2): `node tools/qa/scan.js <url> <dir> <w> <h> <step> [scroller] [clip]` captures the build every
   `step` px, then `python3 -I tools/qa/framematch.py refs/designs/0N.mp4 <page box> <dir> <out> 0.5` pairs every half
   second of the video with the closest capture (grey + edge correlation) → `<out>-NN.jpg` sheets and a score per moment.
4. Motion: `node tools/qa/motion01.js <url> out` (intro frames, rest state, scroll scenes, floating header, reduced motion,
   console). Overflow at 390 / 768 / 1024 / 1280 / 1920.
5. Gallery: add the study to `STUDIES` in `index.html` (status, thumb, ref), thumbnail with `tools/qa/thumb.js`,
   add the folder to `BUILT` in `tools/build_gallery.py`, run `python3 -I studies/tools/build_gallery.py` and publish
   `dist/studies/index.html` with `root` = `dist/studies` and every listed file (same file path keeps the URL).

## Study 06 notes

- The page is the white box x 48–589, y 45–433 of the 640-px video (542 px → 1440, × 2.657); `tools/qa/scenes06.js`
  uses a 1440 × 1033 viewport and puts an anchor element of each section at the y it has in the reference frame.
  Pass `reduced` as the third argument for exact positions: Lenis smoothing offsets programmatic scrolls by ~15 px,
  while the reduced-motion page has the same resting layout without it. Every section was checked as a 50 % overlay.
- Font: Outfit (closest to the reference's geometric face): hero 94u / 85, headings 47.5u / 48 (500), body 24–25u.
- Placeholders: companies Pear Inc / Sonar / Quadra Corp / Cratebox Inc / Harbor S&P, partner marks drawn here
  (no bank or card-network logos), the illustrations are drawn SVG; the brand "Pro Finance" became "Pro Finova".
- The lime circle in the trade section is cut by the page edge like in the video: `.frame { overflow-x: clip }`, so
  wide screens and full-page captures stay 1440 wide (same fix in study 03's `main`).

## Study 05 notes

- The page is the white column x 56–583 of the 640-px video (528 px → 1440, × 2.727); the grey around it is the video's
  backdrop. `tools/qa/scenes05.js` uses a 1440 × 1309 viewport (the video's 480 px height at that scale).
- Font: Plus Jakarta Sans (hero 77u / 560, section titles 46u / 540, CTA 58u).
- Placeholders: brand "Nimbo", person "Sam Rivera", partner wordmarks Fernpay / kite / Ledgerly / tandem, transactions
  Design Pro plan / Site Builder / Sketchbook. Laptop and phone mock-ups are HTML/CSS.
- Round 2 (frame-matched; the video shows the page 44 px below the frame top until it scrolls, so match with
  `framematch.py ... 56,44,583,480 ... --build-box 0,0,1440,1189`): nav 11u higher and a 44u logo mark, hero title
  78u / 105u lines (all within 1-5 px of the reference now); the dashboards are drawn at the reference's 0.72 UI scale
  (whole screen: chart, income / spend, transactions table, cards and goals column); the feature phone leaves fully when
  the laptop arrives; a page-wide dot cursor (dot -> swell on links -> "See more" over the hero panels).
- Pitfall: GSAP x/y on an element that also uses the CSS `scale` property bakes that scale into its transform (the cursor
  stayed at scale 0) → GSAP moves an outer box, the circle inside scales by class.

## Study 04 notes

- Page area in the video: x 36–683, y 67–472 → 1440 × 902 per screen. `tools/qa/scenes04.js` (viewport 1440 × 902).
- Fonts: Anton for the condensed headlines (HODLERS: 240u with .054em tracking to reach the reference width; the dark
  title 101u), Inter 600/500 for the rest.
- Placeholders: brand "Stalwart", tokens Orbit / Golden / Swirl / Xeno / Solis / Prism (glyphs drawn here, no real
  crypto logos), Sample Bank Ltd, Nimbus (NMB); the isometric illustrations are drawn SVG in the same style.
- Round 2 (frame-matched): the hero phones are full app screens (token list; range chips, Buy / Send, token card) that
  ride over the marquee band and the dark section (z-index above them, the hero clips only sideways; phones 1.3x the
  scroll, the title scrolls with the page); HODLERS keeps Anton's kerning after the letter split (a hidden probe holds the
  unsplit word and the letters get margins: the split alone made it 92 px wider); stats art 1.2x; the Receive phone has
  the grabber, address pill, QR card with a dense 29x29 code, glow and blurred rows; FAQ answers open smoothly, an open
  answer has no grey ground, and the fifth question is hovered then opened by itself like the reference's visitor.
- The pinned scenes (`.js-motion` only): the dark title stage and the four-step phone stage are sticky 100vh stages
  centered on a 902u box; without motion the steps stack beside a sticky phone and everything is visible.

## Study 03 notes

- The video shows the page at 640 × 480 with the page area x 30–612, y 34–442 → 1440 × 1009 per screen (header 78).
  `tools/qa/scenes03.js` captures each section at its reference moment (viewport 1440 × 1009).
- Brand "Luna" → placeholder "Nula" (same monoline style: the letters are stroked SVG paths, so the header logo and the
  giant about-section wordmark are drawn by `stroke-dashoffset`). Merchant names are placeholders (Pixel Store, Northwind,
  Cloud Apps, Studio Pro); people are drawn SVG avatars; photo textures are blurred CSS gradients sampled from the video.
- Font: Lexend (600 for headlines, 500 for sub-headings).
- Round 2 (frame-matched): the hero phone plays the reference's demo after load (home sheet slides down, dark
  "Send money" header, white send sheet slides up with $450.00 and a caret, slider pulled, back home); the giant wordmark
  is drawn letter after letter once the about section is up (time based, bubbles one by one); the bento is pinned below
  the header while the transactions scroll under a fixed focus slot (the focused row turns dark and pops out past the
  phone); the FAQ arrives closed and opens the second question by itself; FAQ questions 32u / 600; footer columns 190u.
- Pitfalls: GSAP `rotation` on an element with a CSS 3D pose replaces the pose (the cards lost their tilt) → the pose
  stays in CSS and GSAP animates `--sy` / `--sr` variables used inside it; the cards settle to exactly 0 offset when the
  section reaches the header so the resting layout matches the reference; scaled phones on small screens use `scale`
  (the inner UI keeps its design pixels).

## Study 02 notes

- The reference's brand ("superconscious") became the placeholder "innerconsensus" (same letter count; sizes set from
  the reference ink: hero 134u, wordmark 182u, so x-height and width match).
- Round 2 (frame-matched with `tools/qa/scan.js` + `framematch.py`):
  - Backdrop = WebGL light field (`main.js` → neon): measured from the video's edges, two violet / two blue / two dark
    lobes turn clockwise around the window (2-fold conic), brightest behind it, a soft disc edge at 0.55 window widths;
    here it also bends like liquid, turns faster while scrolling and leans toward the pointer. CSS glows without WebGL.
  - Hero cushion = superellipsoid sampled as a cube-sphere dot grid, lit from the upper left (canvas 2D, convex-hull
    body); hero / CTA phones use poses fitted to the video (`perspective(900u) rotateX(14.7) rotateY(26.2)`), with a real
    3D titanium side (`::after rotateY(90deg)` in a preserve-3d phone).
  - Seed: seven circles scroll in as a 270–300u hexagon, close to the seed of life (outer centres at r = 42u) once pinned,
    then turn 40°. Manifesto corners and the wordmark orb = one stripes shader (level lines of a bumped field).
    Pill glyphs = projected 3D wireframes (torus, interlocked rings, gyroscope), far side dimmer.
  - The nav slides away at the footer (GSAP, not a CSS transition: a transition on opacity made GSAP's intro from() read
    0 as the end value); the logo from far down flips the window in 3D back to the hero, like the video's loop.

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
