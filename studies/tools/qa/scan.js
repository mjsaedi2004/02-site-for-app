// Scroll through a study and capture the page area every <step> px (for framematch.py).
// node scan.js <url> <outdir> <width> <height> <step> [scroller selector|-] [clip selector|-] [settle ms]
// Without a scroller selector the document scrolls; without a clip selector the whole viewport is captured.
// Captures are saved as s<scrollY>.jpg (CSS pixels) with an index.json of positions.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out, w, h, step, scrollerSel = '-', clipSel = '-', settle = '650'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  // the GPU stall notice comes from the screenshot reading back WebGL canvases, not from the page
  p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall due to ReadPixels/.test(m.text())) errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3000);
  const sc = scrollerSel === '-' ? null : scrollerSel;
  const max = await p.evaluate(sel => {
    const el = sel ? document.querySelector(sel) : document.scrollingElement;
    return el.scrollHeight - el.clientHeight;
  }, sc);
  let clip = null;
  if (clipSel !== '-') clip = await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }, clipSel);
  const index = [];
  for (let y = 0; y <= max + +step - 1; y += +step) {
    const yy = Math.min(y, max);
    await p.evaluate(([sel, yy]) => { const el = sel ? document.querySelector(sel) : document.scrollingElement; el.scrollTop = yy; }, [sc, yy]);
    await p.waitForTimeout(+settle);
    const file = `s${String(yy).padStart(6, '0')}.jpg`;
    await p.screenshot({ path: `${out}/${file}`, clip: clip || undefined, type: 'jpeg', quality: 80, scale: 'css' });
    index.push({ y: yy, file });
    if (yy === max) break;
  }
  fs.writeFileSync(`${out}/index.json`, JSON.stringify({ url, max, clip, step: +step, shots: index }, null, 1));
  console.log('captures', index.length, 'max scroll', max, '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
