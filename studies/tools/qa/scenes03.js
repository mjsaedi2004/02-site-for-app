// Study 03: viewport 1440x1009 (the page size in the reference video); capture sections at their reference moments
const { chromium } = require('playwright');
(async () => {
  const [url, out, mode] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1009 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${out}-hero.png` });
  for (const [name, sel, extra] of [['about', '.about', 0], ['bento', '.bento', 0], ['faq', '.faq', 0], ['design', '.design', -78], ['foot', 'end', 0]]) {
    await p.evaluate(([sel, extra]) => {
      const y = sel === 'end' ? document.documentElement.scrollHeight - innerHeight : document.querySelector(sel).getBoundingClientRect().top + scrollY - 78 + extra;
      window.scrollTo(0, y);
    }, [sel, extra]);
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}-${name}.png` });
  }
  console.log('height', await p.evaluate(() => document.documentElement.scrollHeight), '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
