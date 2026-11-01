# Design registry (project memory)

Every reference design the owner sends is recorded here and built as its **own, separate site**.
Designs are never mixed. Later we combine the strongest parts into one final site.

| # | Name | Direction | Folder | References | Status |
|---|---|---|---|---|---|
| 01 | Byondbites | Green wellness ecosystem (recipes + health tools) | `designs/01-byondbites/` | `references/01-byondbites/` | v1 built |
| 02 | FitRaho | Black / white / lime fitness ecosystem (gyms, trainers, members) | `designs/02-fitraho/` | `references/02-fitraho/` | v1 built |

Owner's rating of the original references: **6/10**. Target for every rebuild: **9–10/10** — same
layout and section order as the reference, but much stronger motion, interaction and polish.

---

## 01 — Byondbites

**References:** `references/01-byondbites/full-page.webp` (whole page), `hero.webp` (hero close-up).

**Identity**
- Palette: deep green `#0A5C44` → `#0D7D5B` → emerald `#17C08F` (hero gradient), mint `#1DCB98`
  (primary accent), light mint `#D4F6EA` / `#EBFBF5` (fields, FAQ), olive `#8DB33A`, lime `#78B83A`,
  page `#F5F6F4`, ink `#111614`.
- Type: **Montserrat** (headings, 500–800), **PT Serif** (descriptive copy), **Inter** (UI/nav/buttons).
- Shape language: big rounded green hero panel with a **funnel/trapezoid** extending down to hold two
  tilted phones in a **V**; white rounded cards; pill buttons; green highlighted words in headings.

**Sections (reference order)**
1. Hero — nav inside the green panel, title “Your Everyday Wellness Ecosystem”, serif subtitle,
   Download / Watch buttons, ByondBites + ByondHealth cards with connector lines to the phones,
   bottom-left story text + “Scan Your Pantry”, bottom-right video card + “WATCH VIDEO”.
2. Recipes — category chips + carousel (circular food plates popping out of white cards), arrows, dots.
3. Know Your Meal, Cook It Better — big thin “Smart Ingredients” text, phones, right-edge pill tabs
   (Ingredients / Nutritions / Directions).
4. Free BMI & Calorie Calculator — form card + results panel.
5. How to Use — Snap / Scan / Cook on a dashed wavy line.
6. Features In Byond — staggered 01–04 numbers (black / serif green / dark green / lime) with vertical lines.
7. Why Byond — three green gradient cards (middle lower) on a connecting line.
8. Our Story — photo constellation linked by curves around a central story card.
9. Our Testimonials — stacked portraits + quote card with arrows.
10. FAQ — mint accordion.
11. CTA band — “Start Your Smarter Wellness Journey” over a wall of tilted phone silhouettes, store badges.
12. Contact — green “Contact Us” card overlapping a white form card.
13. Footer — emerald, logo, socials, 3 link columns.

**Motion & interaction implemented (v1)**
- Preloader whose green screen **morphs into the hero shape** (SVG path interpolation, rounded joints).
- Split-line reveals, smooth scroll (Lenis), scroll progress bar, magnetic buttons, custom cursor with labels.
- Hero: phones rise in, mouse-parallax 3D tilt, connector lines draw with travelling sparks, light beams,
  live phone UIs (typing search, trending marquee, gauge + BMI counters).
- Recipes: coverflow with drag/swipe + inertia, spinning plates, autoplay, chip filter with sliding pill,
  keyboard arrows; “View Recipe” loads that recipe into the phone in the next section.
- Know Your Meal: tabs with sliding pill + autoplay progress ring, masked title swap, phone panes
  (ingredient check-offs, nutrition rings, timed directions), cooking-mode timer on the back phone.
- BMI calculator **works** (Mifflin–St Jeor, activity factors, macros, water); gauge needle, counters,
  live recalculation after first run.
- How to Use path is scroll-drawn with a travelling dot; icons pop with micro-animations.
- Features: rolling digits + growing lines. Why Byond: 3D card entrance, tilt + glare, scroll-drawn path.
- Story: living constellation (floating tiles, mouse depth parallax, lines that follow the tiles),
  word-by-word chapter text (3 chapters).
- Testimonials: rotating portrait stack, blur-in quote, autoplay ring on the next button, swipe.
- FAQ height animation, CTA phone wall marquee + cursor spotlight, contact form validation + success state,
  footer wordmark reveal, FLIP video modal with an app “reel”.

**Content source:** `designs/01-byondbites/assets/js/data.js` (recipes, tabs, story, testimonials).

---

## 02 — FitRaho

**References:** `references/02-fitraho/full-page.webp` (whole page), `hero.webp` (hero close-up).

**Identity**
- Palette: ink `#0A0A0A`, lime `#CBF23D` (accent), olive `#7F9A25`, warm panel `#F3F3EF`, white,
  muted `#6B6B6B`, lines `#E8E8E4`. Phone UI dark `#0A0A0B` / cards `#151517`.
- Type: **FitRaho Display** = Orbitron (OFL) with an unslashed zero, renamed per the OFL Reserved Font
  Name clause (build script in `assets/fonts/build-fitraho-display.py`) — headings & numbers, uppercase;
  **Inter** for body/UI.
- Shape language: clean white page, warm-gray rounded panels holding dark iPhones, lime ring “eyebrow”
  icons, black pill CTAs, floating white chips.

**Sections (reference order)**
1. Nav (Home, Gym Owners, Trainers, Members, AI Coach, Blog + Download app) with divider line.
2. Hero — eyebrow, “ONE APP. YOUR ENTIRE FITNESS JOURNEY.” (JOURNEY grey), two CTAs, phone in panel,
   chips “Calories today” and “AI Coach”.
3. Stats row — 105 gyms · 7 cities · 21,869 reviews · 4.7 rating.
4. Who it's for — 3 dark gym photo cards (members / trainers / gym owners).
5. AI Workouts (phone left) · 6. AI Diet (phone right) · 7. Progress (phone left) — each with ticks.
8. AI Coach — black panel, “ASK FITRAHO”, three prompt rows, chat phone.
9. Four simple steps — 4 cropped phones in panels.
10. Trusted by members — review cards + arrows.
11. CTA — “READY TO TRAIN SMARTER?”, store badges, owner dashboard phone cropped by the panel.
12. Footer — minimal, 3 columns.

**Motion & interaction implemented (v1)**
- Loader with a lime progress ring + 000→100 counter, clip-path curtain exit, scramble-decode “JOURNEY”.
- Hero phone is a **working mini app**: persistent tab bar (Home / Meals / Workout / Progress / Coach)
  slides between live screens; 3D mouse tilt with glare; chips parallax; calories ring + chip count up
  together (breakfast check adds 480 kcal); AI-coach chip cycles messages.
- All 10 phone screens are HTML/SVG (no screenshots): home, leg-day workout (rest-timer loop),
  AI food scan (scan line, lock-on frames, bottom sheet), progress chart (morphs between 4 datasets),
  chat, onboarding rings, goal picker, squat rest timer, muscle map, owner dashboard.
- Count-up stats, clip-path photo reveals with hover states, panel/phone reveals with scroll parallax.
- AI Coach: click a question → user bubble, typing indicator, word-streamed answer with rich content
  (workout table, swap button, weekly bars); auto-demo on first view; queued clicks; cursor spotlight;
  panel expands on scroll.
- Steps: scroll rail with pips, rings draw, goal picker cycles, timer counts down, muscle glow.
- Reviews: Draggable + inertia slider with snapping, arrows, progress bar.
- Crossing lime/black ribbons whose speed reacts to scroll velocity.

---

## Combination candidates (for the merge phase)
- FitRaho: interactive hero phone with tab navigation, AI-coach chat demo, scan screen, ribbons.
- Byondbites: preloader→hero morph, recipe carousel + “View recipe” → phone hand-off, working
  BMI/calorie calculator, story constellation, testimonials stack.
