// Study 02 on a phone (390x844) with motion, a few scroll stops; plus reduced motion at 1440 (static layout)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8099/studies/02-violet/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);
  const total = await p.evaluate(() => { const s = document.getElementById('scroller'); return s.scrollHeight - s.clientHeight; });
  const N = 18;
  for (let i = 0; i < N; i++) {
    await p.evaluate(([i, N, t]) => { document.getElementById('scroller').scrollTop = Math.round(t * i / (N - 1)); }, [i, N, total]);
    await p.waitForTimeout(650);
    await p.screenshot({ path: `m/m-${String(i).padStart(2, '0')}.png` });
  }
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, document.getElementById('scroller').scrollWidth]);
  const r = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  r.on('pageerror', e => errs.push(String(e)));
  await r.goto('http://127.0.0.1:8099/studies/02-violet/index.html', { waitUntil: 'networkidle' });
  await r.waitForTimeout(800);
  const H = await r.evaluate(() => document.getElementById('scroller').scrollHeight);
  for (let i = 0, y = 0; y < H; i++, y += 820) {
    await r.evaluate(y => { document.getElementById('scroller').scrollTop = y; }, y);
    await r.waitForTimeout(250);
    await r.screenshot({ path: `m/r-${String(i).padStart(2, '0')}.png` });
  }
  console.log('mobile total', total, 'scrollWidths', sw, 'reduced height', H, '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
