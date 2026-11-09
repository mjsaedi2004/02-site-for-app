// Study 05: viewport 1440x1309 (the page in the video is 528 px wide → 1440; 480 px tall → 1309); capture moments
const { chromium } = require('playwright');
(async () => {
  const [url, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1309 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3200);
  // the reference frame shows 122 px of grey above the page top: shoot the page with the same offset by scrolling 0 and clipping
  await p.screenshot({ path: `${out}-hero.png` });
  const shoot = async (name, js, wait) => { await p.evaluate(js); await p.waitForTimeout(wait || 1800); await p.screenshot({ path: `${out}-${name}.png` }); };
  await shoot('partners', `window.scrollTo(0, document.querySelector('.partners').getBoundingClientRect().top + scrollY - 54)`);
  await shoot('state1', `window.scrollTo(0, document.querySelector('.feature').getBoundingClientRect().top + scrollY + (document.querySelector('.feature').offsetHeight - innerHeight) * .12)`, 2400);
  await shoot('state2', `window.scrollTo(0, document.querySelector('.feature').getBoundingClientRect().top + scrollY + (document.querySelector('.feature').offsetHeight - innerHeight) * .98)`, 2400);
  await shoot('cta', `window.scrollTo(0, document.documentElement.scrollHeight)`);
  // hover: the laptop panel grows and the cursor shows
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
  await p.mouse.move(200, 700); await p.mouse.move(380, 860, { steps: 6 }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}-hover.png` });
  console.log('height', await p.evaluate(() => document.documentElement.scrollHeight), 'sw', await p.evaluate(() => document.documentElement.scrollWidth), '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
