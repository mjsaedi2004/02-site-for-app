# Design registry (project memory)

Every reference design the owner sends is recorded here and built as its **own, separate site**.
Designs are never mixed. Later we combine the strongest parts into one final site.

**The product:** a currency exchange / pricing app (pound, dollar, euro … against Toman).
The real name is not known yet — every design uses the placeholder brand **“Arzino”**. All rates,
figures and reviews are illustrative and labelled as samples (“Sample testimonial”, “Sample review”,
“Design preview · Rates and reviews shown are illustrative”).

## NetRate — the real site (built from the app, not from a reference)

The main track since the owner's brief: the landing site for **«نت‌ریت» / NetRate** (UK exchange-office rates,
pound → Toman). Lives in `site/` (own build, see `CLAUDE.md` → “NetRate site”), online at
https://claude.ai/artifact/5qGX81EFhmZsxMd6h8wqgB. Open items: `site/TODO.md`.

- **Identity = the app's:** tokens, three themes (dusk default · white · black), Vazirmatn variable, line icons,
  brand mark and living background are extracted from `site/app/netrate-demo.html` by `sync_from_app.py`.
- **Story:** the live app (not touchable) rides one phone between sections; the page takes the phone's theme with a
  circular wash — dusk → black (“three themes” moment, features) → white (daylight moment, honesty) → dusk.
- **Sections:** hero (app headline, stores “به‌زودی”, legal line) · why (scattered messages fall into an ordered list) ·
  how, three steps (pinned phone) · black moment · features (rates, offices, chart, alerts — English app) ·
  white moment · honesty (Sunday summary, expired rates, offline bar, two languages) · widget (placeholder) ·
  trust (legal statement card + 6 facts, app's About screen) · for offices (4 tiles, one contact button) ·
  FAQ (app's questions + 1) · coming soon · footer (legal placeholders, both legal sentences, signature + Telegram).
- **App language per section:** Persian page → Persian app in hero/why/how, English app from the black moment on
  (owner: use the English states a lot); English page → English app everywhere except the two-languages step.
- **Fallbacks:** stills (posters) before the app loads, under reduced motion / save-data / slow network, and behind
  every language relaunch. No libraries; ~100 KB HTML per page (CSS inline), 27 KB JS.

### NetRate variants (the reference layouts, upgraded for NetRate)

After v1 the owner asked for less motion, a simpler theme change and his two references. v1 stays frozen; each
reference layout became its own NetRate site in `site/variants/<name>/` (see `CLAUDE.md` → “NetRate variants”).

| Variant | Layout kept from the reference | NetRate upgrades | Online |
|---|---|---|---|
| NetRate × FitRaho | header 88 px, copy beside a 640 px soft panel with the phone and two notes, stats row, three photo cards, three alternating 620 px feature rows, dark panel with prompts → honesty cases, four step cards, card slider → trust facts, closing panel | app stills, three themes with one crossfade, honesty cases switch the screen, offices block + FAQ added for the brief, demo tags | https://claude.ai/artifact/Lu3ihedfAPNkN9XeRfhibk |
| NetRate × Byondbites | hero panel inset 60/30 with the header inside, funnel (0.303 / 0.12 of 1320 px) holding two tilted phones, two side cards, story + video card → theme card, coverflow deck (312 px cards, 205 px plates), pills + phone, calculator, steps on a wave, staggered 01–04, three raised cards, story among tiles, testimonials → trust, mint FAQ, closing band, contact → offices | dark app card instead of green, the deck and calculator run on the app engine's demo data (`tools/demo_data.js`), app stills and tiles, theme crossfade | https://claude.ai/artifact/B8eCE8P2kkquENQFWB4yGf |

---

| # | Reference | Direction | Folder | References | Online (claude.ai artifact) | Status |
|---|---|---|---|---|---|---|
| 01 | Byondbites | Green panel + funnel hero, mint accents | `designs/01-byondbites/` | `references/01-byondbites/` | https://claude.ai/artifact/8heoX6NtmifHRNWoSK7Zfb | v3 |
| 02 | FitRaho | Black / white / lime, phones in warm panels | `designs/02-fitraho/` | `references/02-fitraho/` | https://claude.ai/artifact/4DD5tufpffMfe1jHwy1gWG | v3 |

Owner's rating of the original references: **6/10**. Target for every rebuild: **9–10/10**.

**Owner's rule (v3): the template must match the reference exactly** — same sections, order, grid,
element sizes and positions. Only images (and the copy, for the exchange app) may change. Motion and
interaction are where we go beyond the reference. Extra blocks that are not in the reference
(ribbons, progress rails, wordmarks, chapter tags …) are not allowed.

Version history: v1 = original subjects (recipes / fitness) · v2 = exchange-app content (Arzino) ·
v3 = exact-layout pass against the references + artifact build.

---

## 01 — Byondbites → Arzino (green)

**References:** `references/01-byondbites/full-page.webp` (whole page; site box inside the frame =
`10,24,279,1976`), `hero.webp` (hero close-up).

**Identity**
- Palette: deep green `#0A5C44` → `#0D7D5B` → emerald `#17C08F` (hero gradient), mint `#1DCB98`
  (primary accent), light mint `#D4F6EA` / `#EBFBF5` (fields, FAQ), olive `#8DB33A`, lime `#78B83A`,
  page `#F5F6F4`, ink `#111614`.
- Type: **Montserrat** (headings), **PT Serif** (descriptive copy), **Inter** (UI/nav/buttons).
- Shape language: big rounded green hero panel with a **funnel** holding two tilted phones in a
  **V**; white rounded cards; pill buttons; green highlighted words in headings.

**Measured layout at 1440 px (v3 — matches the reference)**
- Grid: content 1324 px (`--container: 1372px` incl. 24 px padding) → 58 px side margins.
- Hero panel inset 60 px sides / 30 px top; header inside it (logo x=90, CTA right edge 1350, centre y=83).
  Title 40 px Montserrat 600 (lines at 220/269), subtitle 22 px serif, buttons 51 px tall / 20 px text,
  eco cards 264×201 at y=337 (30 px inside the panel), panel bottom 610, funnel top half-width 0.303×,
  bottom 0.12× of the panel (capped at 1320 px), phones ±24° overlapping (right one in front),
  silver frames, top 530 / bottom 942; story text 20 px serif at y≈743, buttons at y≈943,
  video card 205×197, green “WATCH VIDEO” pill with white disc. Hero height ≈ 993.
- Section title centres (y): Rates 1102 · Know your rate 2032 · Calculator 2966 · How to use 3737 ·
  Features 4291 · Why 5056 · Story 6015 · Testimonials 6856 · FAQ 7687 · CTA 8500–9028 ·
  form card 9128 · footer 9891 · page end 10448 (reference 10449).
- Cards: currency card 312 px (flag plate 205 px rising 134 px), side cards at 81 % scale bottom-aligned,
  407 px spacing, 84 px arrows at the grid edges. Meal pills 547×176 (inactive shifted 132 px), title 80 px.
  Why cards 405×484 (middle one 159 px lower). Testimonials 273 px photos + 963 px card. FAQ 987 px wide,
  70 px rows, 35 px gaps. Contact: 500 px green card overlapping a 1076 px form card. Footer 550 px, no wordmark.
- Section titles 40 px, subs 20 px serif.

**Sections (reference order, exchange content)**
1. Hero — “Your Everyday Exchange Ecosystem”, Live Rates + Smart Exchange cards, phones (rates home +
   market pulse), story text + “Check Live Rates”, video card + “WATCH VIDEO”.
2. Live Rates — chips (All / Popular / Europe / Middle East & Asia / Americas & Pacific) + currency carousel:
   flag plate, name, “Buy … · Sell … Toman” description, clock line “Updated Xs ago” + change, “View Chart”.
3. Know Your Rate, Exchange It Better — “Live Prices” title, phones, pills Live Prices / Alerts / Converter.
4. Free Currency & Fee Calculator — form card + result panel (works: Toman ⇄ 10 currencies, fees, rate score).
5. How to Use — Choose / Compare / Exchange on a dashed wavy line.
6. Features In Arzino — 01–04 staggered numerals with vertical lines.
7. Why Arzino — three green cards on a connecting line.
8. Our Story — 23 photo tiles in four loose rows around the story card (S-curve behind it; ‹ › buttons only).
9. Our Testimonials — portrait stack + quote card (third line: “Sample testimonial · date”).
10. FAQ — mint accordion. 11. CTA band with phone wall + store badges. 12. Contact. 13. Footer (2-item bottom bar).

**Motion & interaction**
- Preloader whose green screen **morphs into the hero shape** (SVG path, rounded joints); split-line reveals,
  Lenis smooth scroll, scroll progress, magnetic buttons, custom cursor with labels.
- Hero: phones rise in, mouse-parallax 3D tilt, connector lines with travelling sparks, light beams,
  live phone UIs (ticking pound price, rate gauge, USD counter, chart draw).
- Currency carousel: coverflow with drag/swipe + inertia, autoplay, chip filter with sliding pill, live buy/sell
  ticks with green/red flashes; “View Chart” loads that currency into the phone in the next section.
- Know your rate: tabs with sliding pill + autoplay ring, masked title swap, panes (price rows, alert toggles,
  converter), sparkline draw.
- Calculator: custom selects with auto-swap, segmented control, animated gauge/counters, honest “preview” note.
- How-to path scroll-drawn with a travelling dot; features rolling digits; Why cards 3D entrance + tilt/glare;
  story constellation (floating tiles, mouse depth, lines follow tiles, word-by-word chapters); testimonials
  portrait stack + blur-in quote + autoplay ring; FAQ; CTA phone wall + spotlight; contact form validation with an
  honest “not connected” message; FLIP video modal with a city reel.

**Content source:** `designs/01-byondbites/assets/js/data.js` (currencies, tabs, story, testimonials).

---

## 02 — FitRaho → Arzino (black / white / lime)

**References:** `references/02-fitraho/full-page.webp` (site box `12,15,389,1984`), `hero.webp`.

**Identity**
- Palette: ink `#0A0A0A`, lime `#CBF23D`, olive `#7F9A25`, warm panel `#F3F3EF`, white, muted `#6B6B6B`,
  lines `#E8E8E4`. Phone UI `#0A0A0B` / cards `#151517`.
- Type: **FitRaho Display** = Orbitron (OFL) with an unslashed zero, renamed per the OFL Reserved Font
  Name clause (`assets/fonts/build-fitraho-display.py`) — headings & numbers; **Inter** for body/UI.

**Measured layout at 1440 px (v3)**
- Grid: content 1200 px (`--wrap: 1260px`) → 120 px margins. Header 88 px with divider.
- Hero: phone panel 520×640 at y=158 (phone ≈280×604), title 62 px (lines 304/368/432/496),
  paragraph 18.5 px / 32 px lines, buttons 48 px at y≈700, stats row 886–1022.
- Feature blocks: 560×620 panels with ≈280 px phones, 780 px pitch (tops at 2032 / 2812 / 3592).
- Coach panel 4382–5072. Steps: 4 cards 281×330 (top 5424). Reviews: exactly 3 cards in the grid
  (382 px, 27 px gaps, no peeking), arrows top-right. CTA panel 500 px, title on two lines. Page end 7530
  (reference 7521).

**Sections (reference order, exchange content)**
1. Nav (Home, Live Rates, Converter, Charts, AI Assistant, Reviews + Download app).
2. Hero — “ONE APP. YOUR ENTIRE EXCHANGE DESK.” (DESK grey), interactive phone, chips “Pound today” / “Arzino AI”.
3. Stats — 38 live currencies · 3s price refresh · 1.2M monthly conversions · 4.8 rating.
4. Who it's for — individuals / families & students / businesses.
5. Live rates board · 6. Smart converter (price-tag scanner) · 7. Charts (1D/1W/1M/1Y).
8. Ask Arzino — black panel, three prompts, chat phone. 9. Four simple steps. 10. Trusted by users
(role line “Sample review · City”). 11. CTA “READY TO TRADE SMARTER?” + wallet phone. 12. Footer.

**Motion & interaction**
- Loader with a lime ring + counter, clip-path curtain, scramble-decode “DESK”.
- Hero phone is a working mini app: persistent tab bar (Home / Rates / Convert / Charts / AI) sliding between
  live screens, 3D tilt + glare, chip parallax, live pound ticker, AI chip cycling alerts.
- All phone screens are HTML/SVG: home, rates board, scanner (scan line, lock-on, bottom sheet), chart morphing
  between timeframes, chat, onboarding rings, currency picker, alert timer, rate-locked check, wallet dashboard.
- Count-up stats, clip-path photo reveals with hover, panel/phone reveals with parallax, AI chat demo
  (typing indicator, streamed answer, queued clicks, spotlight), steps animations, Draggable + inertia
  review slider with snapping.

---

## Combination candidates (for the merge phase)
- 02: interactive hero phone with tab navigation, AI-assistant chat demo, price-tag scanner screen, chart morph.
- 01: preloader→hero morph, currency carousel + “View Chart” → phone hand-off, working currency/fee calculator,
  story constellation, testimonials stack.
