const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8099/studies/06-invest/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  for (let i = 0, y = 0; y < H; i++, y += 780) {
    await p.evaluate(y => window.scrollTo(0, y), y);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `m/m-${String(i).padStart(2, '0')}.png` });
  }
  const r = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  r.on('pageerror', e => errs.push(String(e)));
  await r.goto('http://127.0.0.1:8099/studies/06-invest/index.html', { waitUntil: 'networkidle' });
  await r.waitForTimeout(600);
  await r.screenshot({ path: 'm/reduced.png', fullPage: true });
  console.log('mobile H', H, 'scrollWidth', sw, '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
