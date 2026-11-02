const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const base = process.argv[2] || 'http://127.0.0.1:8092/';
  for (const u of [base, base + 'en/']) {
    for (const [w, h] of [[1440, 900], [1920, 1080], [1024, 768], [768, 1024], [390, 844], [360, 740]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const logs = [];
      page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); });
      page.on('pageerror', e => logs.push(e.message));
      await page.goto(u, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      // scroll through the page so lazy parts and the phone have moved everywhere
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      let maxOver = 0;
      for (let y = 0; y < total; y += Math.round(h * 0.9)) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(120);
        maxOver = Math.max(maxOver, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
      }
      console.log(u.endsWith('/en/') ? 'en' : 'fa', `${w}x${h}`, 'overflow-x', maxOver, logs.length ? 'ERR ' + logs.join(' | ') : 'clean');
      await page.close();
    }
  }
  await browser.close();
})();
