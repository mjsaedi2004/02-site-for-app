// scripted checks of every interactive part
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  await page.goto(process.argv[2] || 'http://127.0.0.1:8092/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nrState().appReady, null, { timeout: 30000 });
  const ok = (name, cond) => console.log((cond ? 'PASS ' : 'FAIL ') + name);
  const appTheme = () => page.frames().find(f => f.url().includes('netrate-demo')).evaluate(() => document.documentElement.getAttribute('data-theme'));
  // theme picker
  for (const th of ['dark', 'light', 'dusk']) {
    await page.click(`[data-theme-pick="${th}"]`);
    await page.waitForTimeout(1300);
    const st = await page.evaluate(() => ({ t: document.documentElement.dataset.theme, m: document.documentElement.dataset.themeMode, ls: localStorage.getItem('netrate-site-theme') }));
    ok(`picker ${th}: site=${st.t} mode=${st.m} stored=${st.ls} app=${await appTheme()}`, st.t === th && st.m === 'lock' && st.ls === th && (await appTheme()) === th);
  }
  // locked theme survives scrolling past a dark section
  await page.evaluate(() => document.querySelector('#dark').scrollIntoView());
  await page.waitForTimeout(1800);
  ok('lock holds while scrolling: ' + await page.evaluate(() => document.documentElement.dataset.theme), (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dusk');
  // auto returns to the story
  await page.click('[data-theme-pick="auto"]');
  await page.waitForTimeout(1800);
  const st2 = await page.evaluate(() => ({ t: document.documentElement.dataset.theme, ls: localStorage.getItem('netrate-site-theme') }));
  ok(`auto: theme=${st2.t} stored=${st2.ls}`, st2.t === 'dark' && st2.ls === null);
  // reload keeps a locked choice
  await page.click('[data-theme-pick="light"]');
  await page.waitForTimeout(600);
  await page.reload({ waitUntil: 'load' });
  ok('reload keeps lock: ' + await page.evaluate(() => document.documentElement.dataset.theme + '/' + document.documentElement.dataset.themeMode), (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light');
  await page.click('[data-theme-pick="auto"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  // store buttons: toast, no navigation
  const url0 = page.url();
  await page.click('.hero .store >> nth=0', { force: true });
  await page.waitForTimeout(250);
  ok('store toast: ' + await page.evaluate(() => (document.querySelector('.toast') || {}).textContent), (await page.evaluate(() => !!document.querySelector('.toast'))) && page.url() === url0);
  // offices contact placeholder
  await page.evaluate(() => document.querySelector('#offices .btn--ink').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(900);
  await page.click('#offices .btn--ink', { force: true });
  await page.waitForTimeout(250);
  ok('contact toast: ' + await page.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).pop()), page.url() === url0 && (await page.evaluate(() => scrollY)) > 1000);
  // FAQ open/close
  const q = page.locator('.qa summary').first();
  await q.scrollIntoViewIfNeeded();
  await q.click(); await page.waitForTimeout(600);
  const open1 = await page.evaluate(() => document.querySelector('.qa').open);
  await q.click(); await page.waitForTimeout(500);
  const open2 = await page.evaluate(() => document.querySelector('.qa').open);
  ok(`faq toggles open=${open1} then ${open2}`, open1 === true && open2 === false);
  // legal links do not navigate
  await page.click('[data-todo="legal"] >> nth=0', { force: true });
  await page.waitForTimeout(250);
  ok('legal placeholder stays: ' + await page.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).pop()), page.url() === url0);
  // telegram link
  const tg = await page.getAttribute('.sign__tg', 'href');
  ok('telegram href ' + tg, tg === 'https://t.me/Mohammad_s203');
  // language link
  const en = await page.getAttribute('.bar .lang', 'href');
  ok('language link ' + en, /\/en\/$/.test(en) || en === 'en/');
  // keyboard: theme radios reachable and labelled
  const labels = await page.$$eval('[data-theme-pick]', bs => bs.map(b => b.getAttribute('aria-label') || b.textContent.trim()));
  ok('theme buttons labelled: ' + labels.join(' | '), labels.every(Boolean));
  // the phone layer never takes pointer events
  ok('phone layer inert', (await page.evaluate(() => getComputedStyle(document.querySelector('.phone-layer')).pointerEvents)) === 'none');
  console.log(logs.join('\n') || 'no console errors');
  await browser.close();
})();
