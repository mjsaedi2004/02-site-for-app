const { chromium } = require('playwright');
(async () => {
  const [url, w, h] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1600); // let entrance animations (header drop-in, scale) settle first
  const res = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a, button, summary, [role="radio"], input, select').forEach((el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('.phone-layer')) return;
      // inline links inside running text are exempt (WCAG 2.5.8 inline exception)
      if (el.tagName === 'A' && cs.display === 'inline' && el.closest('p')) return;
      if (r.width < 44 || r.height < 44) out.push(`${Math.round(r.width)}x${Math.round(r.height)} <${el.tagName.toLowerCase()} class="${el.className}"> ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}`);
    });
    return out;
  });
  console.log(res.length ? res.join('\n') : 'all targets >= 44px');
  await browser.close();
})();
