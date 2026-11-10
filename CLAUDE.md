# Project instructions — 02-site-for-app

The owner (**Mohammad**, writes in **Persian** — reply in Persian) builds landing sites for a mobile app.
Four tracks live in this repo (the fourth is the current work). **`HANDOFF.md`** is the short entry point for whoever continues:

1. **NetRate site (main track, `site/`)** — the real landing site for **«نت‌ریت» / NetRate**, an app Mohammad
   builds for a client: UK exchange-office rates for pound → Toman, side by side. Built from the **app's own
   design** (`site/app/netrate-demo.html` is the source of truth) and Mohammad's brief. See “NetRate site” below.
   Four versions: **v1 animated** (`site/src`, frozen on the owner's request), two **design variants** on his
   reference layouts (`site/variants/fitraho`, `site/variants/byondbites`) and **Aurora** (`site/variants/aurora`,
   the newest: luxury black/white with neon gradients) — see “NetRate variants” and “NetRate Aurora” below.
2. **Reference rebuilds (`designs/`)** — earlier exercises: reference designs rebuilt for a placeholder
   exchange app **“Arzino”** (illustrative content). Rules for them are in “Hard rules” below.
3. **Reference rebuilds v2 (`studies/`, current, Nov 2026)** — Mohammad paused NetRate and sent six new references
   (`studies/refs/`): rebuild each **exactly** (English only, original copy, placeholder brands), check twice, then add
   smooth motion; one at a time in his order 01 → 06; all in one numbered gallery artifact. See “Studies” below and
   `studies/README.md` (registry, workflow, numbers).
4. **NetRate × studies (`site/studies/`, current, Nov 2026)** — Mohammad liked studies **1, 6, 2** (in that order) and
   wants NetRate built on their structures, one at a time, each **before and after the app's release**; all of them live
   on the **NetRate page of the Reference Rebuilds gallery** (`#netrate`). Design 1 is done (round 2); the next starts
   only on his word. See “NetRate × studies” below and `site/studies/README.md`.

The owner does not run things locally — he views every site as a **claude.ai artifact** (he calls it “local”).
Keep earlier artifacts alive; a new site gets a new artifact.

## Hard rules (reference rebuilds in `designs/`)
- **Never mix designs.** Each design lives only in `designs/NN-name/` with its own `index.html`,
  `assets/css`, `assets/js`, `assets/img`, `assets/fonts`. No design imports another design's files.
- Only libraries are shared: `vendor/` (GSAP, Lenis). No design code in `vendor/`.
- Save the owner's reference images under `references/NN-name/` (never delete them).
- **The template must match the reference exactly** (owner's explicit request): same sections and order,
  same grid width, element sizes, positions and proportions. Only images (and the copy, adapted to the
  exchange app) may change. Do not add blocks the reference doesn't have (ribbons, rails, progress bars,
  giant wordmarks, extra tags). Motion, interaction and detail are where we go beyond the reference.
  Measure against the reference (see QA) — numbers per design are recorded in `DESIGNS.md`.
- Honesty: sample content is labelled inside the template's own slots (“Sample testimonial · date”,
  “Sample review · City”, footer “Design preview · Rates and reviews shown are illustrative”). Forms are not
  connected → say so; show email/phone as text, not mailto/tel links. Never use a real company's brand.
- When a new design is added: next number (`03-...`), update `DESIGNS.md` (registry = project memory),
  the hub `index.html` card (+ preview in `hub/`), and publish it as an artifact.
- Merging happens only when the owner asks; the merged site goes in its own folder (e.g. `designs/final/`).

## NetRate site (`site/`)

Online: https://claude.ai/artifact/5qGX81EFhmZsxMd6h8wqgB (private to the owner until he shares it).
Workflow (from the repo root):
`python3 -I site/tools/sync_from_app.py` (tokens, fonts, icons, brand mark from the app) →
`node site/tools/posters.js` (90 stills: app language × theme × scene, 2x) → `node site/tools/brand_assets.js`
(favicons, OG images) → `python3 -I site/tools/build.py` (→ `site/public/`, fa at `/`, en at `/en/`) →
`python3 -I site/tools/build_artifact.py` (→ `dist/netrate/`, then publish: `file_path` = `dist/netrate/index.html`,
`root` = `dist/netrate`, `files` = every other file there). Open items for later: `site/TODO.md`.
Source: `site/src/page.html` (template), `src/i18n/{fa,en}.json` (all copy, key by key), `src/config.json`
(placeholders: store links, contact, siteUrl, legalReady), `src/scenes.json` (which app screen each section shows).

**Brief — hard rules (never break):**
- NetRate is **not an exchange office and never moves money**: no text/button/image implying it (no “send money”,
  “convert currency”), no money/flag/circular-arrows icons. Everywhere “به‌زودی / Coming soon” instead of download.
- No competitor names, rate predictions, ranking/store-approval promises, unjustified “first/only/best”,
  fake stats/users/testimonials/ratings, regulator names/logos, or the client's name.
- Every number shows its age (even demos); app data is labelled «نمونهٔ نمایشی / Demo data».
- Colour only for direction (up blue, down coral, never green, never “good”); gold only for the purchasable
  Featured spot; nothing marks “best”.
- Type: Vazirmatn variable, big numbers thin, text ≥ 14 px; Persian digits with ASCII comma (۹۲,۹۰۰), decimal «٫»,
  percent «٪», numbers isolated (`unicode-bidi: isolate`), no «·» next to Persian digits, «تومان» never «ریال».
- Icons: the app's line icons only; brand mark taken from the app (never redrawn); no emoji.
- Motion: iOS-like springs, small motions < 480 ms, digit roll only on changed digits, respect `prefers-reduced-motion`.
- Logical CSS properties only; touch targets ≥ 44 px; AA contrast in all three themes (dusk / white / black).
- Glossary: «ارسال به ایران / Send to Iran», «دریافت از ایران / Receive from Iran», «تومان / Toman»,
  «بیشترین مبلغ دریافتی / Highest payout», «جایگاه ویژه / Featured».
- Legal sentences verbatim: «نت‌ریت صرافی نیست و پول جابه‌جا نمی‌کند.» / «NetRate is not an exchange office and never
  moves money.» and «نرخ‌ها را خود صرافی‌ها اعلام می‌کنند و فقط برای اطلاع‌اند؛ برای نرخ قطعی، پیش از معامله با صرافی تماس بگیر.»
- Offices section: no prices, no free/paid, no ranking or sales promises, one contact button. Widget: description and
  placeholder only. No cookies or third-party trackers. Language in the URL, theme only in localStorage.
- SEO: hreflang fa / en-GB / x-default→en, canonical per page, title ≤ 60, description 110–160,
  JSON-LD only Organization, WebSite, FAQPage. Code, comments and file names in English; copy only in i18n files.
- Footer signature `DESIGNED & DEVELOPED BY — M.S` + Telegram icon → https://t.me/Mohammad_s203.
- The app is a black box: use only its public hooks; if the app needs a change, tell Mohammad.

**Owner's decisions:** the app inside the site is not touchable, only smoothly animated; placeholder links until he
sends store / direct-download links; start on dusk, the page turns black/white with a strong animation when the
phone (moving between sections) shows the black/white app; all numbers are samples; legal pages later (TODO);
use the app's **English states a lot**, not only Persian (`scenes.json` → per-slot `lang`).

**How it works:** one fixed `.phone-layer` (live app in a same-origin iframe, driven by `src/js/bridge.js` through
`window.__netrate` / `__v2theme` / demo controls) springs between `[data-slot]` places; stage sections pin it
(desktop beside the steps, phones above them). Scenes are keyed by slot + scene. A language switch reloads the
app behind a still (`.phone__cover`) of the next scene. The page theme follows the slot's theme with a circular
wash from the phone. Reduced motion / save-data / slow network → no iframe: stills per step, instant themes.
`window.__nrState()` exposes state for QA.

**Pitfalls already hit (NetRate):**
- Two slots can share a scene name with different app languages → key pending scenes by `slot|scene`.
- Only the newest scene may lift the cover (token); an older run finishing later must not reveal a reloading app.
- A no-op relaunch (`setLang` to the current language) never fires `load` → check the language first, race a timeout.
- The settings sheet keeps its stack until its close animation ends; `base()` closes it, waits, then navigates.
- Stills over/under the iframe must be exactly 390 × 844 (a generic `.phone__screen img` rule made them 874 tall
  → 3.5 % ghosting during the cross-fade).
- The app's dusk accent fails AA for small text on the page ground → site uses `--accent-text` (deepened mix).
- Playwright refuses to click `aria-disabled` links → `{ force: true }` in tests.

## NetRate variants (`site/variants/<name>/`)

Owner's feedback on v1: too animated, the theme-change wash looked bad, and his two reference designs are better.
So v1 stays as it is (same link, `site/src` untouched; maybe resumed later), and each reference layout was rebuilt
for NetRate as its own site. Same brief rules as v1; differences:
- **The app is still:** real app stills (`site/assets/img/scenes`) in drawn phones; no iframe, no flying phone.
  Stills swap with a 450 ms crossfade only when the user asks (theme pick, honesty cases, pills).
- **Theme change = one calm crossfade:** the colour tokens are registered `@property` colours with a 780 ms
  transition on `:root` (even gradients built from them crossfade). Auto mode follows the section in the middle of the
  screen (`data-tone`), with a 140 ms debounce and no change while an anchor jump scrolls; a chosen theme locks the
  page and switches every still. Reduced motion: instant. No wash, ring or grain.
- **Content at rest:** nothing waits at `opacity: 0`; parts below the fold rise in once (keyframe), parts on screen
  at load stay still (artifact rule: page complete at rest).
- **Build:** `python3 -I site/tools/build_variant.py fitraho|byondbites` → `site/variants/<name>/public/`
  (gitignored), then `python3 -I site/tools/build_artifact.py <name>` → `dist/netrate-<name>/` (artifact name
  “NetRate FitRaho” / “NetRate Byondbites”). Each variant has its own `src/page.html`, `css/site.css`, `js/*.js`,
  `i18n/{fa,en}.json`, `img/`; shared are only config, app tokens/icons/mark, fonts, stills. Template tags are listed
  at the top of `build_variant.py` (`{{phone:…}}`, `{{tile:…}}`, `{{use:…}}`, `{{@nn}}` …).
- **Byondbites demo data** comes from the app's own engine: `node site/tools/demo_data.js` extracts `NetRateEngine`
  from the app (via `vm`), writes `src/data/demo.json` (currencies, rate types, live offices, each currency's market)
  and runs the page calculator (`src/js/calc.js`) against the engine in 528 cases — re-run it when the app changes.
- Online: FitRaho https://claude.ai/artifact/Lu3ihedfAPNkN9XeRfhibk · Byondbites
  https://claude.ai/artifact/B8eCE8P2kkquENQFWB4yGf (private to the owner until he shares them).
- Pitfalls hit: a demo tag over a phone hides app content on phones → tags sit at panel corners / under phones;
  RTL rules like `html[dir=rtl] .pill { translate }` outrank `.pill[aria-pressed]` → set a variable instead;
  scaled side cards shrink their buttons below 44 px → scale less, bigger button; the contrast script can't see the
  hero panel (a sibling layer) → the header/hero results there are false alarms (text is `--on-ink` on the dark card).

## NetRate Aurora (`site/variants/aurora/`, the current direction)

Owner's feedback on the two variants: both too plain. His brief for Aurora (see `site/variants/aurora/PLAN.md`):
luxurious, modern, rich (not empty), neon/gradient colour instead of flat backgrounds, many scroll/card/header
interactions, exact phone sizes on every screen, real mobile responsiveness; **two themes only — black (default) and
white** — switched by a button with a simple, professional animation (no theme change on scroll); boxes are **soft
squares** (10/14/18/22 px, never round); a **capsule header** that detaches from the top, follows and shrinks.
- Owner's second round: the neon gradient (ember → magenta → violet) and the backgrounds were “very bad”; wanted
  attractive, well-known background patterns, clearer section separation and tighter animation. So the identity now
  comes from the **app's own black and white themes** (monochrome: black/white, silver `--neon` = the app's primary
  fill, chrome text gradient `--tgrad`; colour only for direction, gold only for Featured). Richness comes from light
  and patterns: hero light rays + spotlights + floor grid, dot matrix (why, calc, widget), ripple rings (look),
  graph paper (features), a stage floor (showroom), a lamp (trust), diagonal lines (offices), grids inside the dark
  panels and the footer, film grain. Sections alternate ground / faint `--band` tint with hairline edges and a light
  at the middle of each band's top edge. The dark ink panels (honesty, coming soon) always use the black-theme tokens.
  Tokens are prefixed (`--bg0`, `--tx1`, `--ln1` …) because `tokens.css` (the app's) also defines `--bg`, `--ink`,
  `--line` under `[data-theme]`; the brand mark follows the app's `--mark-fill`/`--mark-ink` (set them on a dark
  card to force the black-theme mark — CSS can't reach inside `<use>`).
- Phones are `{{device:…}}`: each screen ships in the app's black and white theme; CSS shows the one matching the site.
- Motion: Lenis + GSAP ScrollTrigger/Flip (vendored; in the artifact they load from jsDelivr, so no unread third-party
  file is published). Motion is crisp: native wheel scrolling (Lenis only eases anchor jumps), `--ease`
  `cubic-bezier(.2,.8,.2,1)`, small motions ≤ ~400 ms, scrub lag ≤ .25, no bobbing, no velocity skew, no magnetic
  buttons. Theme switch = View Transition circle from the button with a silver ring on its edge (560 ms). Pinned “why”
  story, sticky phone steps, closer look (numbered spots), pinned sideways showroom (arrows when not pinned), kinetic
  word band, word-by-word trust statement under the lamp, chart drawing, ticker, cursor light, tile tilt, typing
  panel, capsule edge light, phone glass glint.
- Data: `view.py` (build hook) formats the engine data — hero cards, why list, 30-day chart path, office card, panel.
- Build: `node site/tools/demo_data.js` → (`node site/tools/og_aurora.js` when the hero copy or the app's main screen
  changes: Aurora's own dark link previews in `variants/aurora/og/`) → `python3 -I site/tools/build_variant.py aurora` →
  `python3 -I site/tools/build_artifact.py aurora` (artifact “NetRate Aurora”): https://claude.ai/artifact/X9ARuLEUaqmwv54cGbhBqt
- Pitfalls hit: an `<input>`'s intrinsic width widened a `1fr` grid track on phones → `minmax(0, 1fr)` everywhere and
  `flex: 1 1 0` on the input; Persian “۰۱” reads oddly → `{{@nn}}` gives plain digits in Persian; the footer outline
  word showed only letter dots when pushed down → keep it in view with a mask; a crowded heredoc in one shell command
  tripped the safety check → write snippets to the scratchpad and insert them with a short script; scaling a
  full-viewport overlay (the theme ring) scales its box too, so the ring stayed in the far corner → animate a registered
  `@property` length (`--vr`) instead, and never register `--r` (it is the radius token); an element added in the view
  transition's update callback is part of the live new view, so it is drawn inside the reveal's clip; the pinned showroom
  must fit short laptops (1280×720) → `--show-chrome` budget under `max-height: 900px`; no rating values in the site's
  own mock-ups (brief: no fake ratings — the app's stills may show its own demo ratings).

## Studies (`studies/`, reference rebuilds v2)
- Gallery artifact **“Reference Rebuilds”**: https://claude.ai/artifact/DJ1wyggQMRGJ6CdQxi8axG — `studies/index.html`
  (numbered cards, viewer with Live / Reference / Split with synced scroll / Onion skin + Difference, widths 1440–390,
  keys ← → 1–6 Esc). Build `python3 -I studies/tools/build_gallery.py` → `dist/studies/`, publish `index.html` with
  `root` = `dist/studies` and every listed file. Videos are never published: 12-frame sheets (`refs/sheets/`) instead.
- After each finished study: thumbnail, `STUDIES` entry (status built), `BUILT` list, rebuild, republish, commit, push,
  tell Mohammad (in Persian) with the link, and move on to the next study without asking.
- Exactness first: measure against the reference at 1440 (`studies/tools/qa/`: compare.py bands, inkcmp.py, boxes.js,
  posefit.py for 3D mockups, scenes0N.js per video study; for exact positions shoot with reduced motion, since Lenis
  shifts programmatic scrolls). Real brands, logos and people become placeholders of similar shape, including the
  reference's own product name (superconscious → innerconsensus, Luna → Nula, Faithful → Stalwart, Dubank → Nimbo,
  Pro Finance → Pro Finova); sample ratings are labelled. Motion upgrades never change the resting layout.
- Status (Nov 2026): all six studies built and published; round 2 (Mohammad: "many are not exactly like the originals,
  make the motion more professional, design 2's background more animated") reworked all six frame by frame with
  `tools/qa/scan.js` + `framematch.py` (gallery v11). Then he chose 1, 6 and 2 for NetRate (see “NetRate × studies”);
  gallery v12 adds the NetRate page.
- Pitfalls (round 2): a CSS transition on opacity/translate of an element GSAP animates makes from() read a mid-transition
  end value (study 02's nav stayed invisible); splitting a word into inline-block letters drops the font's kerning
  (study 04's HODLERS grew 92 px; keep letters at their kerned spots); fromTo in a click timeline renders its start at
  once unless `immediateRender: false`; GSAP caches function values unless `invalidateOnRefresh`.

## NetRate × studies (`site/studies/<NN-name>/`, the current direction)
- Owner's brief: keep the study's structure and change the content to NetRate's; the app's **English** version; the
  gradient logo tile from `brand/`; complete, professional motion, smooth scrolling and scroll-driven scenes; fix what
  the study left incomplete. Round 2 (his words): expand the site with NetRate content and sharper images; make the
  last phone look as much like the **App Store** as possible; two versions of each page, **before release**
  (`index.html`, “Coming soon”) and **after release** (`live.html`, download buttons, the lasting site); and **show the
  app/phone much less** — the app in one or two places at most (hero + the App Store phone), plus **one showcase** in
  the style of his sample `site/studies/refs/showcase-sample.webp` (dark navy, tilted phone, blue glass slabs; never the
  sample's brand). Everything else is type, graphics and motion, borrowing ideas from the other studies. Tell him when a
  page is done and wait for his word before the next.
- Every NetRate build goes on the gallery's NetRate page: `NETRATE` entries in `studies/index.html` (1A/1B …; viewer
  modes Live / the study live / Split with the study), copied by `studies/tools/build_gallery.py` (`NETRATE` list) to
  `dist/studies/netrate/<name>/`; thumbnails `studies/thumbs/nr-*.jpg`. Queued designs show their study with a note.
- Round 3 (his words): talk to him in Persian, work in English; more professional fonts — **Inter Tight** for headings,
  numbers and the wordmark, **Inter** for text; **no outlined/hollow letters**; the page's end is a **very large NetRate
  gliding left to right without end**, edges faded (CSS loop of two equal halves, transform only, paused off screen);
  phone images must show at once (eager loading, no app splash, scripts deferred in the head); **contrast and framing**:
  a cool off-white ground (`--ground`), white boxes with an edge and a soft shadow (`--edge`), rows inside on `--tint`;
  a **non-white, professional background**: a dot grid shown only in soft masked patches, faint blue light and dot floors
  in perspective under three sections, all still (painted once); smooth, light scrolling. His poster
  `brand/netrate-poster-uk.webp` is used as its graphic part only (`img/home-screen.webp`: crop 250,715–1122,1402, the
  phone with the NetRate icon among the other apps) in the “Today's rates, one tap away” panel: its headline (“best
  exchange rates”), coins, flag and Apple badge stay out because of the brief.
- Round 4 (his words): the background was good but too little → twice as much (13 dot patches, a line grid in other
  patches, dot floors under eight sections); everything looked small and centred on his wide screen → the layout keeps
  growing past 1440 (`--u` capped at 2200 px), boxes are 1376u wide, the footer spans the page; the gallery viewer has a
  **Fit** width (the page at the stage's own width, now the default); the FAQ was janky → the list reserves room for one
  open answer so the page below never moves, questions move by transform only, no ScrollTrigger refresh; the hero phone
  looked tilted at load → no transform intro and no pointer tilt on it; more content: “the problem” (seven scattered
  messages sort themselves into one list with times, pinned on wide screens), a **calculator** (the app's ranked list and
  fee rules: no fee / fixed pounds / percent / “under 1,000”; it reproduces the app's order for 1,000 pounds exactly),
  and five feature tiles (a 30-day chart drawn by the scroll with Sundays shaded, rate types, themes, English/Persian in
  Vazirmatn, widgets coming soon).
- Round 5 (his words: check and fix, build the other pages a product site needs, then give complete outputs for another
  AI, the before/after sites as two zips + HTML files to show the client, and the gallery as a zip + HTML): a phone menu
  (`.menu-btn` + `#msheet`, also in the floating header), real footer links, `max(14px, …)` floors on the calculator, and
  the other pages from `tools/pages.py` (run by `tools/build.py`) around the home page's own header and footer: Terms,
  Privacy, Disclaimer, Cookies, Delete account (drafts with `[placeholders]` in `.ph` spans and a “Draft for review”
  note), For exchange offices, Contact, 404 — `terms.html` … beside `index.html`, `live-terms.html` … beside `live.html`
  (`pages.js`: menu + download notes). Hand-off: **`HANDOFF.md`** (read it first) and `python3 -I tools/export.py` →
  `exports/` (gitignored): the two sites as zips (live.html → index.html) and as single offline HTML files (fonts' used
  subsets, vendored GSAP/Lenis and images inlined; the other pages as `<template>`s opened over the home page by
  `site/studies/tools/export_sub.js`), the gallery as a zip and as one file (pages in `srcdoc` frames, so the synced split
  works from a double-clicked file), and the repo at HEAD (`git archive`).
- Pitfalls (round 5): `.page` has `isolation: isolate`, so its fixed children (`#msheet` z 70, the floating header) stack
  inside it — a layer at body level covers them; the export lifts `#msheet` to the body. Inlined `defer` scripts must
  move to the end of the body; data a page's inline script reads must come before that script; JSON embedded in a
  `<script>` needs `<` escaped as `\u003c` (a page's own `<!--`/`<script` would confuse the HTML tokenizer).
- The brief's hard rules hold (no money moving, Coming soon, demo data with its date, legal sentences verbatim,
  signature + Telegram, AA contrast, text ≥ 14 px with `max(14px, …)` floors on scaled text, 44 px targets on touch).
- Design 1: `site/studies/01-fintech/` — source `page.html` (`<!--pre-->`/`<!--post-->` blocks and `{{…}}` tags, see
  `tools/build.py`) → `index.html` + `live.html`. App screens come from the app itself at 3x: `node …/tools/shots.js`
  (390 × 790 under a drawn 54 px status strip with a Dynamic Island; a 390 × 1500 main screen scrolls inside the hero
  phone under the tab bar cut from the normal render) → `python3 -I …/tools/convert.py` (600 / 1170 px webp,
  `img/app/tops.json`) → `python3 -I …/tools/build.py`. Sections: hero (phone) → “We Made Rates Clearer!” cards with
  animated pictures (offices sort themselves, a rate expires, an alert sentence lights up) → kinetic band → stacked
  how-it-works cards → statement lit word by word with a drawn underline → honesty panels → showcase (3D phone, dark
  app) → trust → offices panel (types its rate) → FAQ (one at a time) → “one tap away” panel (his poster's graphic
  part) → App Store page on the 3D iPhone (iOS points: header, info strip of true facts, captioned screenshots, tab bar;
  SOON / GET) → footer with the NetRate marquee.
  Also published alone as “NetRate × Design 1”: https://claude.ai/artifact/PmdwM4ASFvM7oNRjBXNXFd
  (`python3 -I site/studies/tools/build_artifact.py 01-fintech` → `dist/netrate-01-fintech/`, live.html beside it).
- Smoothness: a 3D phone's pose variables are registered `@property … inherits: false` (moving it never restyles its
  screen), its glint is its own element moved by GSAP, no `backdrop-filter` inside 3D or over moving parts, no `filter`
  tweens (the stacked cards dim with a shade element), no scale scrubs on large boxes (one-time reveals instead).
- Pitfalls (round 3): a full-page screenshot draws a 3D phone's screen black although it renders in the viewport — check
  3D in viewport shots; Inter is wider than Outfit, so pills need `max(14px, …)` and a narrow-phone rule.
- Pitfalls: the App Store page has no fake ratings, rank, age rating, size or developer name — its info strip shows true
  facts; tweening `filter` from `none` starts at brightness(0) (cards went black) → fromTo with an explicit start; a
  variable font's glyphs overlap inside, so a stroked wordmark shows inner lines → `paint-order: stroke` with an opaque
  fill; the app's `f-offices` scene leaves an office sheet open that `base` does not close → render it last; at rest
  (reduced motion) every picture shows its finished state, motion starts it from the beginning.
- Pitfalls (round 1): a render must leave room for the phone's status strip, or the strip crops the app's tab bar; a 3D phone made
  of one front plane and one side plane breaks at the rounded corners → stack rounded slabs (preserve-3d) for the body;
  give scroll-scrubbed poses their own variables (`--sway`, `--wx`, `--wy` added in the transform) so idle and pointer
  motion never fight the scrub; a fixed-height footer clips fine print that wraps on laptops → let it flow.

## Tech conventions
- Static HTML/CSS/JS, no build step for the repo. Classic `<script>` tags so `index.html` also works from `file://`.
- GSAP 3.15 (all plugins are free) + Lenis smooth scroll; respect `prefers-reduced-motion`.
- Fonts self-hosted as woff2 with their OFL license files; images optimized `.webp` (free Unsplash photos).
- Phone mockups are built in HTML with em-based scaling: set `--pw` (phone width) → `font-size: calc(var(--pw)/N)`.
- Pitfalls already hit — avoid repeating:
  - A generic `.phone` / `.iphone` rule declared later overrides `--pw`/`position` of single-class
    modifiers → use compound selectors (`.iphone.hero__phone`).
  - Don't animate GSAP transforms on elements whose transform is driven by CSS classes/hover
    (GSAP's inline transform wins) — animate a wrapper or `clearProps: 'transform'`.
  - **A CSS `transition` on `transform` breaks GSAP tweens on that element**: during `ScrollTrigger.refresh()`
    GSAP re-reads a mid-transition value and the element freezes (reviews stuck 120 px right). Do hover lifts
    with the independent `translate` property instead (`translate: 0 -4px; transition: translate .5s`).
  - Transformed ancestors become `offsetParent` in Chrome → sum offsets up the chain (`offY` helper).
  - Margin collapse through a block changes measured offsets → `display: flow-root` on measured containers.
  - Class names are global: a section class (`.who`) also hit a card's `.who` row → scope with `.sec.who`/ids.
  - Decorative overflow (carousels, curves) must not widen the document → `overflow-x: clip` per section.
  - Shapes computed from the viewport (D1 funnel) need a cap so 1920 px keeps the 1440 px proportions.
  - Chromium sends a synthetic pointer move at (0,0) → ignore it for custom cursors.

## Artifacts (how the owner views the designs)
- `python3 -I tools/build_artifacts.py` → `dist/<design>/` (gitignored): vendor scripts → jsDelivr
  (`gsap@3.15.0`, `lenis@1.3.27`), self-hosted fonts → Google Fonts (FitRaho Display inlined as data URI),
  page turned into a fragment (the host adds `<!doctype><html><head><body>`; body classes added by a tiny script),
  safe-area offsets for fixed bars.
- Publish with the Artifact tool: `file_path` = `dist/<design>/index.html`, `root` = `dist/<design>`,
  `files` = every other file in that folder. Re-publishing the same `file_path` keeps the URL.
  Design 01: https://claude.ai/artifact/8heoX6NtmifHRNWoSK7Zfb · Design 02: https://claude.ai/artifact/4DD5tufpffMfe1jHwy1gWG ·
  NetRate v1: https://claude.ai/artifact/5qGX81EFhmZsxMd6h8wqgB · NetRate × FitRaho: https://claude.ai/artifact/Lu3ihedfAPNkN9XeRfhibk ·
  NetRate × Byondbites: https://claude.ai/artifact/B8eCE8P2kkquENQFWB4yGf · NetRate Aurora: https://claude.ai/artifact/X9ARuLEUaqmwv54cGbhBqt ·
  NetRate × Design 1: https://claude.ai/artifact/PmdwM4ASFvM7oNRjBXNXFd (all private to the owner until he shares them).
- Publishing a file Claude did not write (the app demo) requires reading the whole file first: when the app changes,
  read the new `dist/netrate/app/netrate-demo.html` before republishing it.

## QA routine (before every push)
NetRate: the same spirit with `site/tools/qa/` (see its README) — look (4 viewports), livetest, static,
overflow, contrast (3 themes), targets, interact, and `hostsim.py` for the artifact build. Numbered steps below
are for the reference rebuilds.
1. `python3 -m http.server 8080` from the repo root.
2. Reference fidelity: `node tools/qa/fullpage.js <url> /tmp/x.png` then
   `python3 -I tools/qa/ref_sheet.py references/NN/full-page.webp <site box> /tmp/x.png /tmp/cmp` and compare
   section by section (positions, sizes, container width). Site boxes are in `DESIGNS.md`.
3. Playwright screenshots: desktop 1440×900, laptop 1920×1080, tablet 1024×768, mobile 390×844; no horizontal overflow.
4. Zero console errors/warnings; scripted interaction checks for every interactive component.
5. Rebuild `dist/` and re-publish the artifacts when a design changes.
