// Study 01 motion check: intro frames, rest state vs static, scroll scenes, floating header, reduced motion, console
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const browser = await chromium.launch();
  const errs = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  for (const t of [250, 700, 1300]) { await page.waitForTimeout(t === 250 ? 250 : t - (t === 700 ? 250 : 700)); await page.screenshot({ path: `${out}-intro-${t}.png` }); }
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}-rest-top.png` });
  const bal = await page.textContent('.app__bal');
  // scroll to the cards and the app store section with the wheel (Lenis)
  const pos = async sel => page.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  for (const [name, sel, off] of [['cards', '.cards', 260], ['store', '.soon', 60], ['foot', '.foot', 300]]) {
    const y = await pos(sel);
    await page.evaluate(y => window.scrollTo(0, y), y - off);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}-${name}.png` });
  }
  const p3d = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('.p3d')); return ['--rx', '--ry', '--rz', '--ty'].map(k => s.getPropertyValue(k).trim()).join(' '); });
  // scroll up a little: floating header should show
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(900);
  const floatOn = await page.evaluate(() => document.querySelector('.nav--float').classList.contains('is-on'));
  await page.screenshot({ path: `${out}-float.png` });
  console.log('balance', bal, '| p3d', p3d, '| float on', floatOn);
  // reduced motion: everything visible immediately
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto(url, { waitUntil: 'networkidle' });
  const hidden = await rm.evaluate(() => [...document.querySelectorAll('.hero__title .ln > span, .phone--hero, .card, .p3d')].filter(e => getComputedStyle(e).opacity !== '1').length);
  console.log('reduced motion hidden elements', hidden, '| errors', errs.length ? errs.join(' | ') : 'none');
  await browser.close();
})();
