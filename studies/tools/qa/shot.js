// full-page screenshot of a study at a given width (motion settled): node shot.js <url> <out.png> [width] [height]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w, h] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +(w || 1440), height: +(h || 900) } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // walk down so any scroll-triggered parts settle, then back to the top
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out, fullPage: true });
  console.log('height', H, errs.length ? 'ERRORS ' + errs.join(' | ') : 'clean');
  await browser.close();
})();
