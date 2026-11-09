// one look at the gallery: index (dark, 1440), viewer onion + split (1440), index light at 390; console errors
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2], out = process.argv[3];
  const b = await chromium.launch();
  const errs = [];
  const mk = async (opts) => { const p = await b.newPage(opts); p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  let p = await mk({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '-index.png' });
  await p.evaluate(() => { localStorage.setItem('rr:mode', 'onion'); location.hash = 'study-01'; });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const f = document.querySelector('iframe'); f.contentWindow.scrollTo(0, 1100); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + '-onion.png' });
  await p.click('#modes [data-mode="split"]'); await p.waitForTimeout(2500);
  await p.evaluate(() => { const f = document.querySelector('iframe'); f.contentWindow.scrollTo(0, 1650); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: out + '-split.png' });
  await p.evaluate(() => { location.hash = 'study-02'; }); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '-queued.png' });
  const q = await mk({ viewport: { width: 390, height: 844 }, colorScheme: 'light', deviceScaleFactor: 1 });
  await q.goto(base, { waitUntil: 'networkidle' }); await q.waitForTimeout(300);
  const sw = await q.evaluate(() => document.documentElement.scrollWidth);
  await q.screenshot({ path: out + '-390.png', fullPage: true });
  console.log('390 scrollWidth', sw, '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
