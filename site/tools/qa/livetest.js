// usage: node livetest.js <url> <w> <h> slotA slotB ...   (scrolls each slot to centre, logs app state)
const { chromium } = require('playwright');
(async () => {
  const [url, w, h, ...ids] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nrState && window.__nrState().appReady, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const fr = () => page.frames().find(f => f.url().includes('netrate-demo'));
  const appState = async () => {
    try {
      return await fr().evaluate(() => {
        const s = document.querySelector('#setSheet'), a = window.__netrate;
        const pages = [...document.querySelectorAll('#setStack .st-page')].map(p => p.dataset.page + (p.classList.contains('off') ? '(off)' : ''));
        const of = document.querySelector('#officeSheet');
        return `tab=${a.S.tab} pushed=${a.isPushed()} lang=${a.lang()} set[h=${s.hidden},a=${s.getAttribute('aria-hidden')},pages=${pages.join('>')}] office[h=${of.hidden},a=${of.getAttribute('aria-hidden')}]`;
      });
    } catch (e) { return 'frame err ' + e.message; }
  };
  for (const id of ids) {
    await page.evaluate((sid) => {
      const el = document.querySelector('[data-slot="' + sid + '"]');
      const d = el.querySelector('.phone--static') || el;
      const r = d.getBoundingClientRect();
      window.scrollBy({ top: r.top + r.height / 2 - innerHeight / 2, behavior: 'instant' });
    }, id);
    for (const t of [1500, 3000, 5000]) {
      await page.waitForTimeout(t === 1500 ? 1500 : t - (t === 3000 ? 1500 : 3000));
      const st = await page.evaluate(() => JSON.stringify(window.__nrState()));
      console.log(id.padEnd(9), String(t).padStart(5), st, '|', await appState());
    }
    await page.screenshot({ path: `${require('os').tmpdir()}/lt_${id}.png` });
  }
  console.log(logs.join('\n') || 'no console errors');
  await browser.close();
})();
