// Full-page screenshot (reduced motion, everything in its final state) + section offsets.
// usage: node tools/qa/fullpage.js <url> <out.png> [width=1440] [height=900]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 1440, h = 900] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' })).newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += +h * 0.8) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  const rows = await page.evaluate(() => [...document.querySelectorAll('section, footer')].map((e) => `${(e.id || e.className).toString().slice(0, 32).padEnd(32)} top=${Math.round(e.getBoundingClientRect().top + scrollY)} h=${Math.round(e.offsetHeight)}`));
  console.log(`scrollHeight ${await page.evaluate(() => document.documentElement.scrollHeight)}  scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
  console.log(rows.join('\n'));
  await page.screenshot({ path: out, fullPage: true });
  console.log(logs.join('\n') || 'no console errors');
  await browser.close();
})();
