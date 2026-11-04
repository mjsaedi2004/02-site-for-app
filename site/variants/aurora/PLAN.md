# NetRate Aurora — plan (v4)

Owner's brief for this version (after the FitRaho and Byondbites variants): both too plain. Wanted: a luxurious,
modern, professional site that goes beyond every earlier version; neon and gradient colour instead of flat
backgrounds; a rich page (not empty); many scroll, card and header interactions; exact phone sizes on every
screen; real mobile responsiveness. Two themes only, **black (default) and white**, switched by a button with a
simple but professional animation — the theme no longer changes on scroll. Boxes are soft squares (corners soft,
never round). The header is a capsule that detaches from the top on scroll, follows the page down and gets smaller.

All NetRate brief rules still hold (see `CLAUDE.md`): not an exchange office, “Coming soon”, ages on every number,
demo labels, direction colours only (up blue, down coral, never green), gold only for Featured, Vazirmatn, Persian
digits, the app's icons and mark, logical CSS, 44 px targets, AA contrast in both themes, legal sentences verbatim.

## Identity

- **Night (default):** near-black with a violet bias (`#06050A`), glass surfaces, neon gradient
  **ember → magenta → violet** (the app's own coral accent and its chart pink and violet), slow aurora light,
  film grain, a neon perspective grid in the hero. No green, no blue or cyan in decoration (blue means “up”),
  no gold outside Featured.
- **Day:** paper white (`#FAF9FC`), the same gradient deepened for AA, pastel aurora, ink text.
- **Type:** Vazirmatn variable. Headlines 780–820, big numbers 200–250, text ≥ 14 px.
- **Shape:** soft squares — 10 px (buttons, inputs), 14 px (cards), 18 px (large panels). Capsules only for the
  header and small chips.
- **App stills:** the site's night theme shows the app's black theme, day shows its white theme (both stills ship;
  CSS shows the right one, so the theme switch needs no image swaps).

## Motion system

GSAP 3.15 + ScrollTrigger + Flip (vendored, self-hosted) and Lenis smooth scroll. Reduced motion: no smooth scroll,
no pins, no scrubs, final states, instant theme.
- Header: wide transparent bar at the top → floating glass capsule (smaller, detached 12 px) once scrolling starts,
  spring easing from the app's tokens; sliding active-section pill; neon scroll-progress hairline.
- Theme switch: View Transitions circular reveal from the toggle (≈ 650 ms) + sun/moon morph; colour crossfade
  where View Transitions are missing.
- Hero entrance (CSS, once at load), floating phone and glass cards, pointer parallax.
- Section headings: line/word mask reveal; parts rise in once just before they enter (content complete at rest).
- Pinned “scattered messages → ordered list” story (scrubbed), sticky phone showcase for the four steps,
  scroll-scrubbed word highlight for the trust statement, chart drawing, marquee that speeds up with scroll.
- Cards: cursor spotlight + neon border glow, small 3D tilt; magnetic primary buttons.
- Calculator: sliding toggles, digit roll on changed digits only, FLIP re-order of the result rows.

## Sections

1. **Hero** — badge, headline with gradient words, lead, two CTAs, legal line, four product facts;
   phone (live screen) with neon halo and three glass cards (highest payout + age, market average + date, demo tag).
2. **Rate ticker** — marquee of the eight currencies (best rate, office, age) from the app engine, demo label.
3. **Why** — pinned: scattered rate messages without times fall into NetRate's ordered list with ages.
4. **How it works** — sticky phone; four steps (amount, ranked, office page, contact) switch its screen; each step
   carries a small piece of the app (amount field, three rows, office chips, contact actions); a neon line fills
   beside the steps as they pass.
4b. **A closer look** — the main screen with five numbered spots (direction, market average, amount, the labelled
   Featured spot with its real rank, the age of a rate) linked to callouts; a slow tour until the visitor takes over.
5. **Bento features** — rates & currencies (phone crop + chips), ages (mini list with an expired row), 30-day chart
   (engine series, hover tooltip), office card that flips to its week of opening hours, alert sentence, the app's
   three themes, two languages toggle, privacy.
5b. **Showroom** — eight app screens passing sideways while the section is pinned (swipe on phones).
6. **Calculator** — the app's ordering rule over its demo offices (`calc.js`, checked against the engine),
   gap between the first and the last office, every office as a dot between the lowest and highest value.
7. **Honesty** — Sunday / expired / offline cases with the phone.
8. **Trust** — the legal statement lighting up word by word, six facts.
9. **For offices** — web-panel mock (rate entry, reminder, rate card), daily Featured spot, one contact button.
10. **Widget** — description and placeholder only.
11. **FAQ** — accordion, FAQPage JSON-LD.
12. **Coming soon** — neon panel, stores (coming soon), wall of app screens moving slowly.
13. **Footer** — brand, legal sentences, placeholders, signature + Telegram, outlined wordmark.

## Sizes (checked at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 360×740)

- Container 1240 px, gutter `max(20px, safe areas)`; sections `clamp(88px, 10vw, 150px)` apart.
- Hero phone: `clamp(230px, min(23vw, (100svh − 230px) × 0.461), 320px)` — never taller than the screen.
- Showcase phone (sticky): `clamp(240px, (100svh − 200px) × 0.461, 310px)`; phones below 900 px stack per step.
- Bento: 12-column grid → 6 → 1 column; tiles keep their content at every width.

## Details added after the first publish

Cursor light (desktop), nav hover glide, hero scroll parallax, tile tilt, FAQ search (Persian-aware), back-to-top
ring, the office panel typing its rates in, phone turn-in at load, line-by-line headline, neon rules between sections,
language switch crossfade (cross-document View Transition).

Later: a closer look at the main screen (numbered spots + callouts, slow tour), the office card flipping to its week,
the pinned sideways showroom (fits 1280×720; previous/next buttons whenever it scrolls by itself), the spread of every
office's payout, a kinetic band of large words sliding with the scroll, the capsule's edge light under the pointer and
its drop-in at load, a glass reflection and hover glint on the phones, a neon ring riding the edge of the theme reveal.
Then: a richer phone menu (blurred scrim, cascading links with chevrons, the current section marked), entrance variety
(tiles tip up in 3D, office features slide in, panels unveil), skeleton home/lock screens with dashed slots for the
widget placeholder, an outlined question mark beside the sticky FAQ heading, the steps' small app parts replaying when
their step becomes active, the themes tile as a picker of the app's three themes, a balanced rates tile (larger phone,
the stat anchoring the bottom), the app's alert screen rising in the alert tile, chart labels kept inside the chart,
lighter scrolling on phones (no backdrop blur on in-flow parts, the ticker loop resting off screen), solid surfaces for
reduced transparency, and Aurora's own dark link-preview images (`site/tools/og_aurora.js`).

## Redesign (owner's second round)

Feedback: the neon gradient and the backgrounds were very bad; use attractive, well-known background patterns;
separate the sections better (or let them flow); some animations felt loose. Changes:

- **Colour = the app's black and white themes.** Monochrome: black `#000` / white, silver primary fill (the app's
  `--grad`), chrome text gradient, white/black accents; direction colours (blue up, coral down) and Featured gold are
  the only colours. The brand mark keeps the app's own colours.
- **Backgrounds = well-known patterns, one per section:** hero light rays fanning from above + a corner spotlight +
  a second weaker one + the moving floor grid; dot matrix (why, calculator, widget); ripple rings (closer look);
  graph paper (features); a lit stage floor (showroom); a lamp whose line widens and light comes on (trust); fine
  diagonal lines (offices); a spotlight and grid inside the dark panels; a grid rising behind the footer wordmark;
  film grain everywhere. Phones stand in a soft glow with thin rings and one slow ripple.
- **Sections = alternating bands:** ground / faint tint with hairline edges and a light at the middle of each band's
  top edge, so each section reads as its own chapter.
- **Motion = crisp:** native wheel scrolling, decisive easing, shorter durations and distances, low scrub lag, no
  bobbing, skew or magnetic pull, a shorter theme reveal.
