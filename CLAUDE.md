# Project instructions — 02-site-for-app

The owner (writes in **Persian** — reply in Persian) is building a **landing site that introduces a mobile app**:
a **currency exchange / pricing app** (pound, dollar, euro … against Toman). The real app name is not known
yet — use the placeholder brand **“Arzino”** and keep every rate/review clearly illustrative.
They send reference designs in batches (rated ~6/10). Each reference is rebuilt as a complete,
much stronger site (target 9–10/10: professional polish, strong motion graphics and interactions).
Later the owner and Claude combine the best parts, step by step, into one final site.
The owner does not run things locally — they view the designs as **claude.ai artifacts** (see below).

## Hard rules
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
  Design 01: https://claude.ai/artifact/8heoX6NtmifHRNWoSK7Zfb · Design 02: https://claude.ai/artifact/4DD5tufpffMfe1jHwy1gWG
  (both private to the owner until they share them).

## QA routine (before every push)
1. `python3 -m http.server 8080` from the repo root.
2. Reference fidelity: `node tools/qa/fullpage.js <url> /tmp/x.png` then
   `python3 -I tools/qa/ref_sheet.py references/NN/full-page.webp <site box> /tmp/x.png /tmp/cmp` and compare
   section by section (positions, sizes, container width). Site boxes are in `DESIGNS.md`.
3. Playwright screenshots: desktop 1440×900, laptop 1920×1080, tablet 1024×768, mobile 390×844; no horizontal overflow.
4. Zero console errors/warnings; scripted interaction checks for every interactive component.
5. Rebuild `dist/` and re-publish the artifacts when a design changes.
