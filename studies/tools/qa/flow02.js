// Study 02: scroll the framed window with the mouse wheel from top to bottom and grab frames (motion review)
const { chromium } = require('playwright');
(async () => {
  const [url, out, n] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1552, height: 1004 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);
  await p.mouse.move(776, 500);
  const total = await p.evaluate(() => { const s = document.getElementById('scroller'); return s.scrollHeight - s.clientHeight; });
  const N = +(n || 36);
  for (let i = 0; i < N; i++) {
    await p.evaluate(([i, N, total]) => { document.getElementById('scroller').scrollTop = Math.round(total * i / (N - 1)); }, [i, N, total]);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png`, clip: { x: 56, y: 50, width: 1440, height: 904 } });
  }
  console.log('total scroll', total);
  await b.close();
})();
