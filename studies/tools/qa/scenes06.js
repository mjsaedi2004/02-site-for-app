// Study 06: viewport 1440x1033 (the page box in the video is 542 x 389 → 1440 x 1033); each shot puts an anchor
// element at the viewport y it has in the reference frame
const { chromium } = require('playwright');
(async () => {
  const [url, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1033 }, reducedMotion: process.argv[4] === 'reduced' ? 'reduce' : 'no-preference' });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3600);
  await p.screenshot({ path: `${out}-hero.png` });
  const shots = [['most', '.hero__panel', 'bottom', 230], ['adv', '.adv .h2', 'top', 290], ['partners', '.partners .h2', 'top', 2], ['trade', '.trade__copy .h2', 'top', 150], ['get', '.get .h2', 'top', 322]];
  for (const [name, sel, edge, y] of shots) {
    await p.evaluate(([sel, edge, y]) => { const r = document.querySelector(sel).getBoundingClientRect(); window.scrollTo(0, (edge === 'bottom' ? r.bottom : r.top) + scrollY - y); }, [sel, edge, y]);
    await p.waitForTimeout(2200);
    await p.screenshot({ path: `${out}-${name}.png` });
  }
  console.log('height', await p.evaluate(() => document.documentElement.scrollHeight), 'sw', await p.evaluate(() => document.documentElement.scrollWidth), '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
