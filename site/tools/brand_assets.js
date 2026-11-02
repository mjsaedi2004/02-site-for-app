// Favicons, app-icon PNGs and the link-preview (Open Graph) images, rendered from the app's own
// brand mark and the site's tokens/fonts. Run from the repo root after posters exist:
//   node site/tools/brand_assets.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SITE = path.resolve(__dirname, '..');
const PORT = 8098;
const sprite = fs.readFileSync(path.join(SITE, 'src/partials/sprite.svg'), 'utf8');
const mark = sprite.match(/<symbol id="brand-mark" viewBox="0 0 48 48">([\s\S]*?)<\/symbol>/)[1];
const i18n = { fa: require(path.join(SITE, 'src/i18n/fa.json')), en: require(path.join(SITE, 'src/i18n/en.json')) };

// dusk is the brand's default look: ember square, white N
const markSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">` +
  mark.replace(/var\(--mark-fill\)/g, '#D4401A').replace(/var\(--mark-ink\)/g, '#FFFFFF') + '</svg>';

const fontCss = `@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-arabic.woff2) format("woff2");unicode-range:U+0600-06FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}
@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F}`;

function ogHtml(lang) {
  const t = i18n[lang];
  const rtl = lang === 'fa';
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${fontCss}
  *{box-sizing:border-box;margin:0}body{width:1200px;height:630px;overflow:hidden;font-family:Vazirmatn,sans-serif;color:#1B1613;
  background:radial-gradient(70% 70% at ${rtl ? '8%' : '92%'} 0%,rgba(255,255,255,.75),transparent 60%),radial-gradient(60% 70% at ${rtl ? '100%' : '0%'} 60%,rgba(246,196,168,.75),transparent 62%),#E7E1DC}
  .wrap{position:absolute;inset:0;display:grid;grid-template-columns:1fr 330px;gap:40px;padding:64px 72px 0}
  .brand{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:760}.brand svg{width:56px;height:56px}
  h1{margin-top:44px;font-size:${rtl ? 54 : 58}px;line-height:${rtl ? 1.45 : 1.08};font-weight:300;letter-spacing:${rtl ? 0 : '-.03em'}}
  p{margin-top:22px;font-size:26px;line-height:1.6;color:#483D35}
  .legal{position:absolute;bottom:44px;${rtl ? 'right' : 'left'}:72px;font-size:21px;color:#574B43}
  .phone{align-self:start;width:330px;height:691px;padding:10px;border-radius:46px;background:linear-gradient(150deg,#34343a,#111113 36%,#0b0b0c 62%,#26262b);box-shadow:0 40px 80px -30px rgba(58,34,20,.5)}
  .phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:37px;display:block}
  .tag{position:absolute;top:24px;${rtl ? 'left' : 'right'}:24px;padding:6px 14px;border-radius:99px;background:#fff;font-size:18px;color:#483D35}</style></head>
  <body><div class="wrap"><div><div class="brand">${markSvg(56)}<span>${t.brand}</span></div><h1>${t.hero.title}</h1><p>${t.tagline}</p></div>
  <div class="phone"><img src="/assets/img/scenes/${lang}/dusk/live.webp"></div></div>
  <span class="tag">${t.demoTag}</span><p class="legal">${t.hero.legal}</p></body></html>`;
}

(async () => {
  const out = path.join(SITE, 'assets/img');
  fs.writeFileSync(path.join(out, 'icon.svg'), markSvg(48));
  fs.writeFileSync(path.join(SITE, 'tools/.og-fa.html'), ogHtml('fa'));
  fs.writeFileSync(path.join(SITE, 'tools/.og-en.html'), ogHtml('en'));
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  try {
    for (const [name, size, pad, bg] of [['icon-32.png', 32, 0, null], ['apple-touch-icon.png', 180, 0, '#D4401A'], ['logo-512.png', 512, 0, null]]) {
      const page = await browser.newPage({ viewport: { width: size, height: size } });
      const svg = bg ? markSvg(size).replace('<svg', `<svg style="background:${bg}"`) : markSvg(size);
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
      await page.screenshot({ path: path.join(out, name), omitBackground: !bg, clip: { x: 0, y: 0, width: size, height: size } });
      await page.close();
    }
    for (const lang of ['fa', 'en']) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
      await page.goto(`http://127.0.0.1:${PORT}/tools/.og-${lang}.html`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, `og-${lang}.png`) });
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
    for (const l of ['fa', 'en']) fs.rmSync(path.join(SITE, `tools/.og-${l}.html`), { force: true });
  }
  console.log('brand assets written to site/assets/img');
})();
