# NetRate site — QA scripts

Serve the built site first: `python3 -m http.server 8092 --directory site/public` (from the repo root).
All scripts use the pre-installed Playwright and print a PASS/FAIL or problem list.

| script | what it checks |
|---|---|
| `node look.js <url> <prefix> <w> <h> [steps]` | screenshots while scrolling the whole page (live phone, theme story) + console errors |
| `node livetest.js <url> <w> <h> <slot…>` | jumps to slots and logs the app state inside the iframe (tab, sheets, language) |
| `node static.js <url> <w> <h> <prefix> [steps]` | reduced-motion run: no iframe, stills, overflow, console |
| `node overflow.js [base-url]` | horizontal overflow + console at 6 viewports, fa and en |
| `node contrast.js <url> [w] [h]` | WCAG AA contrast of every visible text in dusk / white / black |
| `node targets.js <url> <w> <h>` | interactive targets smaller than 44 × 44 px |
| `node interact.js [url]` | theme picker, lock/auto, reload, placeholder toasts, FAQ, links |
| `python3 -I sheet.py out.jpg <cols> <width> img…` | contact sheet of screenshots |
| `python3 -I hostsim.py dist/netrate 8093` | serves the artifact build the way claude.ai wraps the page fragment |
