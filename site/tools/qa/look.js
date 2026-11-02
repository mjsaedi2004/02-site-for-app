// usage: node look.js <url> <prefix> <w> <h> [steps]
const { chromium } = require('playwright');
(async () => {
  const [url, prefix, w, h, steps = '10'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => logs.push(`[reqfail] ${r.url()} ${r.failure() && r.failure().errorText}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${prefix}_00.png` });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const n = +steps;
  for (let i = 1; i <= n; i++) {
    const y = Math.round((total - +h) * i / n);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${prefix}_${String(i).padStart(2, '0')}.png` });
  }
  console.log('height', total, '| theme now', await page.evaluate(() => document.documentElement.dataset.theme));
  console.log(logs.join('\n') || 'no console errors');
  await browser.close();
})();
