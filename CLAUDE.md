# Project instructions — 02-site-for-app

The owner (**Mohammad**, writes in **Persian** — reply in Persian) builds landing sites for a mobile app.
Two tracks live in this repo:

1. **NetRate site (main track, `site/`)** — the real landing site for **«نت‌ریت» / NetRate**, an app Mohammad
   builds for a client: UK exchange-office rates for pound → Toman, side by side. Built from the **app's own
   design** (`site/app/netrate-demo.html` is the source of truth) and Mohammad's brief. See “NetRate site” below.
   Three versions: **v1 animated** (`site/src`, frozen on the owner's request) and two **design variants** on his
   reference layouts (`site/variants/fitraho`, `site/variants/byondbites`) — see “NetRate variants” below.
2. **Reference rebuilds (`designs/`)** — earlier exercises: reference designs rebuilt for a placeholder
   exchange app **“Arzino”** (illustrative content). Rules for them are in “Hard rules” below.

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
  NetRate × Byondbites: https://claude.ai/artifact/B8eCE8P2kkquENQFWB4yGf (all private to the owner until he shares them).
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
