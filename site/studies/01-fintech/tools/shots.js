// App screens for the NetRate × Design 1 page, rendered by the app itself (English, chosen theme).
// The phones on this page draw their own status bar with a Dynamic Island (54 px of a 390 px screen, 3.24 e of a
// 26 e phone), so the app is rendered 54 px shorter than a 390 × 844 screen: strip + render = the whole screen, tab bar
// included. 3x pixels, so the screens stay sharp on phones and in the large phones of the page.
// usage (from the repo root): node site/studies/01-fintech/tools/shots.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SITE = path.resolve(__dirname, '../../..');
const OUT = path.resolve(__dirname, '../img/raw');
const PORT = 8096;
const H = 844 - 54;
const JOBS = [
  // the hero (tall, below), the showcase (dark main screen) and the App Store page's five screenshots
  ['light', ['live', 'ranked', 'office-page', 'expired']],
  ['dark', ['live', 'f-chart']],
  // a tall main screen: the hero phone scrolls through it as the page scrolls (its tab bar is drawn from 'live')
  ['light', ['live'], 1500, '-tall'],
];
const only = process.argv[2];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const [theme, scenes, h = H, suffix = ''] of JOBS) {
      if (only && only !== theme + suffix) continue;
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
      page.on('pageerror', (e) => errors.push(`${theme}: ${e.message}`));
      await page.goto(`http://127.0.0.1:${PORT}/tools/poster-host.html`);
      await page.setViewportSize({ width: 390, height: Math.max(844, h) });
      await page.addStyleTag({ content: `iframe{height:${h}px!important}` });
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(([l, t]) => setup(l, t), ['en', theme]);
      await page.waitForTimeout(1500);
      for (const name of scenes) {
        await page.evaluate(([n, l]) => play(n, l), [name, 'en']);
        await page.waitForTimeout(1400);
        await page.locator('#app').screenshot({ path: path.join(OUT, `${name}-${theme}${suffix}.png`) });
        process.stdout.write(`${theme}/${name} `);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(errors.length ? '\nerrors:\n' + errors.join('\n') : '\nshots done, no errors');
})();
