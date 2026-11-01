# Project instructions — 02-site-for-app

The owner (writes in **Persian** — reply in Persian) is building a **landing site that introduces a mobile app**.
They send reference designs in batches (rated ~6/10). Each reference is rebuilt as a complete,
much stronger site (target 9–10/10: professional polish, strong motion graphics and interactions).
Later the owner and Claude combine the best parts, step by step, into one final site.

## Hard rules
- **Never mix designs.** Each design lives only in `designs/NN-name/` with its own `index.html`,
  `assets/css`, `assets/js`, `assets/img`, `assets/fonts`. No design imports another design's files.
- Only libraries are shared: `vendor/` (GSAP, Lenis). No design code in `vendor/`.
- Save the owner's reference images under `references/NN-name/` (never delete them).
- Keep the reference's layout, section order and visual identity; elevate motion, interaction, detail.
- When a new design is added: next number (`03-...`), update `DESIGNS.md` (registry = project memory)
  and the hub `index.html` card (+ preview in `hub/`).
- Merging happens only when the owner asks; the merged site goes in its own folder (e.g. `designs/final/`).

## Tech conventions
- Static HTML/CSS/JS, no build step. Classic `<script>` tags so `index.html` also works from `file://`.
- GSAP 3.15 (all plugins are free) + Lenis smooth scroll; respect `prefers-reduced-motion`.
- Fonts self-hosted as woff2 with their OFL license files; images optimized `.webp` (free Unsplash photos).
- Phone mockups are built in HTML with em-based scaling: set `--pw` (phone width) → `font-size: calc(var(--pw)/N)`.
- Pitfalls already hit — avoid repeating:
  - A generic `.phone` / `.iphone` rule declared later overrides `--pw`/`position` of single-class
    modifiers → use compound selectors (`.iphone.hero__phone`).
  - Don't animate GSAP transforms on elements whose transform is driven by CSS classes/hover
    (GSAP's inline transform wins) — animate a wrapper or `clearProps: 'transform'`.
  - Transformed ancestors become `offsetParent` in Chrome → sum offsets up the chain (`offY` helper).
  - Chromium sends a synthetic pointer move at (0,0) → ignore it for custom cursors.

## QA routine (before every push)
1. `python3 -m http.server 8080` from the repo root.
2. Playwright screenshots: desktop 1440×900, laptop 1920×1080, tablet 1024×768, mobile 390×844.
3. Zero console errors/warnings; scripted interaction checks for every interactive component.
