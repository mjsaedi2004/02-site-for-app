// print page-coordinate boxes of selectors: node boxes.js <url> <width> <sel1> <sel2> ...
const { chromium } = require('playwright');
(async () => {
  const [url, w, ...sels] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  for (const s of sels) {
    const r = await page.evaluate(s => [...document.querySelectorAll(s)].map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)].join(','); }), s);
    console.log(s.padEnd(28), r.join('  '));
  }
  await browser.close();
})();
