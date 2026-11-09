// Study 04: viewport 1440x902 (the page size in the reference video); capture the reference moments
const { chromium } = require('playwright');
(async () => {
  const [url, out, mode] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 902 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3200);
  await p.screenshot({ path: `${out}-hero.png` });
  const at = async (name, fn, wait) => { await p.evaluate(fn); await p.waitForTimeout(wait || 1600); await p.screenshot({ path: `${out}-${name}.png` }); };
  const top = s => `document.querySelector('${s}').getBoundingClientRect().top + scrollY`;
  await at('dark', `window.scrollTo(0, ${top('.dark')} + (document.querySelector('.dark').offsetHeight - innerHeight) * .5)`);
  for (let i = 0; i < 3; i++) await at('stat' + i, `(() => { const s = document.querySelectorAll('.stat')[${i}]; const r = s.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY - innerHeight / 2 + 60); })()`, 1800);
  for (let i = 0; i < 4; i++) await at('step' + i, `window.scrollTo(0, ${top('.steps')} + (document.querySelector('.steps').offsetHeight - innerHeight) * ${(i + .5) / 4})`, 2400);
  await at('faq', `window.scrollTo(0, ${top('.faq')})`);
  await at('foot', `window.scrollTo(0, document.documentElement.scrollHeight)`);
  console.log('height', await p.evaluate(() => document.documentElement.scrollHeight), 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth), '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
