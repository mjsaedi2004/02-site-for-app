const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8099/studies/03-bank/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  for (let i = 0, y = 0; y < H; i++, y += 760) {
    await p.evaluate(y => window.scrollTo(0, y), y);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `m/m-${String(i).padStart(2, '0')}.png` });
  }
  const r = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  r.on('pageerror', e => errs.push(String(e)));
  await r.goto('http://127.0.0.1:8099/studies/03-bank/index.html', { waitUntil: 'networkidle' });
  await r.waitForTimeout(600);
  await r.screenshot({ path: 'm/reduced.png', fullPage: true });
  const t = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await t.goto('http://127.0.0.1:8099/studies/03-bank/index.html', { waitUntil: 'networkidle' });
  await t.waitForTimeout(800);
  const faq = await t.evaluate(async () => {
    const qs = [...document.querySelectorAll('.qa summary')];
    qs[0].click(); await new Promise(r => setTimeout(r, 900));
    const a = [...document.querySelectorAll('.qa')].map(d => d.open ? 1 : 0).join('');
    qs[0].click(); await new Promise(r => setTimeout(r, 900));
    const b2 = [...document.querySelectorAll('.qa')].map(d => d.open ? 1 : 0).join('');
    return a + ' -> ' + b2;
  });
  console.log('mobile H', H, 'scrollWidth', sw, '| faq open states', faq, '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
