// AA contrast of every visible text element against its effective background, per theme
const { chromium } = require('playwright');
(async () => {
  const [url, w = '1440', h = '900'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  for (const theme of ['dusk', 'light', 'dark']) {
    await page.evaluate((th) => {
      const root = document.documentElement;
      root.setAttribute('data-theme', th); root.setAttribute('data-theme-mode', 'lock');
      document.querySelectorAll('[data-rise]').forEach(e => e.classList.add('in'));
    }, theme);
    await page.waitForTimeout(1500);
    const res = await page.evaluate((th) => {
      const root = document.documentElement;
      const parse = (c) => {
        let m = c.match(/color\(srgb ([^)]+)\)/);
        if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 }; }
        m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
      const pageBg = parse(getComputedStyle(root).getPropertyValue('--bg').trim().startsWith('#') ? (() => { const d = document.createElement('div'); d.style.color = getComputedStyle(root).getPropertyValue('--bg'); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })() : getComputedStyle(document.body).backgroundColor);
      const bgOf = (el) => {
        const stack = [];
        for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
          const cs = getComputedStyle(e);
          const c = parse(cs.backgroundColor);
          if (cs.backgroundImage && cs.backgroundImage !== 'none' && !e.classList.contains('g-bg')) return { img: true };
          if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
        }
        let bg = pageBg;
        for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
        return bg;
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const t = walker.currentNode; if (!t.textContent.trim()) continue;
        const el = t.parentElement; if (seen.has(el)) continue; seen.add(el);
        if (el.closest('.phone, .phone-layer, script, style, [aria-hidden="true"], .moment__word')) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        if (cs.visibility === 'hidden' || cs.display === 'none' || !r.width || +cs.opacity === 0) continue;
        let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
        if (op < 0.95) continue;                       // dimmed-by-design states (inactive steps) are checked active
        const bg = bgOf(el); if (bg.img) continue;
        let fg = parse(cs.color); fg = blend(fg, bg);
        const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
        const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        if (ratio < need) out.push(`${ratio.toFixed(2)} < ${need} ${size}px "${t.textContent.trim().slice(0, 40)}" <${el.tagName.toLowerCase()} class="${el.className}">`);
      }
      return out;
    }, theme);
    console.log(`== ${theme}: ${res.length} failing`);
    console.log(res.slice(0, 40).join('\n'));
  }
  await browser.close();
})();
