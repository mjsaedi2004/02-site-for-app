// Study 02: capture the window at reference moments. node scenes02.js <url> <outprefix> [reduced]
// The viewport 1552x1004 makes the framed window exactly 1440 x 904 (the reference's site size).
const { chromium } = require('playwright');
(async () => {
  const [url, out, mode] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1552, height: 1004 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2600);
  const win = await p.evaluate(() => { const r = document.querySelector('.win').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  const shots = [
    ['hero', null, 0],
    ['seed', '.seed', .62], ['flower', '.seed', .74],
    ['mf-open', '.manifesto', .44], ['mf-para', '.manifesto', .97],
    ['up-mid', '.upgrade', .5],
    ['feats', '.feats', 'top'],
    ['stack-a', '.stack', .42], ['stack-b', '.stack', .97],
    ['mark', '.mark', .5], ['dream', '.dream', 'top'], ['foot', '.foot', 'end']
  ];
  for (const [name, sel, at] of shots) {
    await p.evaluate(([sel, at]) => {
      const sc = document.getElementById('scroller');
      let y = 0;
      if (sel) {
        const el = document.querySelector(sel);
        if (at === 'top') y = el.offsetTop;
        else if (at === 'end') y = sc.scrollHeight - sc.clientHeight;
        else y = el.offsetTop + at * (el.offsetHeight - sc.clientHeight);
      }
      sc.scrollTop = y;
    }, [sel, at]);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${out}-${name}.png`, clip: win });
  }
  console.log('window', JSON.stringify(win), '| errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
