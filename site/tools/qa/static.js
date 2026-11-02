// reduced-motion run: static posters, no iframe; usage: node static.js <url> <w> <h> <prefix> <steps>
const { chromium } = require('playwright');
(async () => {
  const [url, w, h, prefix, steps = '8'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const logs = [], reqs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  page.on('request', r => { if (r.url().includes('netrate-demo')) reqs.push(r.url()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  for (let i = 0; i <= +steps; i++) {
    await page.evaluate((v) => window.scrollTo(0, v), Math.round((total - +h) * i / +steps));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${prefix}_${String(i).padStart(2, '0')}.png` });
  }
  console.log('height', total, 'overflow-x', ow, 'app requested:', reqs.length, '| state', await page.evaluate(() => JSON.stringify(window.__nrState())));
  console.log(logs.join('\n') || 'no console errors');
  await browser.close();
})();
