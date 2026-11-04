// Link-preview (Open Graph) images for NetRate Aurora: the night identity with neon glows, the app's brand mark in
// its black-theme colours, the hero headline and the app's black-theme main screen. Run from the repo root:
//   node site/tools/og_aurora.js        → site/variants/aurora/og/og-{fa,en}.png (build_variant.py prefers these)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SITE = path.resolve(__dirname, '..');
const VAR = path.join(SITE, 'variants/aurora');
const PORT = 8097;
const sprite = fs.readFileSync(path.join(SITE, 'src/partials/sprite.svg'), 'utf8');
const mark = sprite.match(/<symbol id="brand-mark" viewBox="0 0 48 48">([\s\S]*?)<\/symbol>/)[1];
const i18n = { fa: require(path.join(VAR, 'src/i18n/fa.json')), en: require(path.join(VAR, 'src/i18n/en.json')) };

// the app's black theme: white square, near-black N
const markSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">` +
  mark.replace(/var\(--mark-fill\)/g, '#FFFFFF').replace(/var\(--mark-ink\)/g, '#0B0A10') + '</svg>';

const fontCss = `@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-arabic.woff2) format("woff2");unicode-range:U+0600-06FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}
@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F}`;

function ogHtml(lang) {
  const t = i18n[lang];
  const rtl = lang === 'fa';
  const start = rtl ? 'right' : 'left', end = rtl ? 'left' : 'right';
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${fontCss}
  *{box-sizing:border-box;margin:0}
  html,body{overflow:hidden}
  body{width:1200px;height:630px;font-family:Vazirmatn,sans-serif;color:#F4F1FA;background:#06050A}
  .og{position:relative;width:1200px;height:630px;overflow:hidden}  /* clips the glows: overflow on the start side of an RTL page shifts the view */
  .glow{position:absolute;border-radius:50%;filter:blur(10px)}
  .g1{width:760px;height:760px;${end}:-260px;top:-300px;background:radial-gradient(closest-side,rgba(141,110,255,.42),transparent 72%)}
  .g2{width:620px;height:620px;${start}:-200px;bottom:-360px;background:radial-gradient(closest-side,rgba(255,106,61,.34),transparent 72%)}
  .g3{width:520px;height:520px;${end}:120px;bottom:-300px;background:radial-gradient(closest-side,rgba(242,70,142,.36),transparent 72%)}
  .grid{position:absolute;inset:auto 0 0 0;height:260px;opacity:.22;background:linear-gradient(transparent 0 calc(100% - 1px),rgba(242,70,142,.6) 0) 0 0/100% 32px,linear-gradient(90deg,transparent 0 calc(100% - 1px),rgba(141,110,255,.6) 0) 0 0/64px 100%;transform:perspective(420px) rotateX(58deg);transform-origin:bottom;-webkit-mask:linear-gradient(transparent,#000 70%)}
  .copy{position:absolute;top:68px;${start}:76px;width:640px}
  .brand{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:780}
  .brand svg{width:54px;height:54px;filter:drop-shadow(0 8px 22px rgba(242,70,142,.45))}
  .badge{display:inline-flex;align-items:center;gap:10px;margin-top:40px;padding:7px 16px;border-radius:999px;font-size:20px;color:#CFC8DE;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
  .badge i{width:9px;height:9px;border-radius:50%;background:linear-gradient(120deg,#FF6A3D,#F2468E,#8D6EFF);box-shadow:0 0 12px #F2468E}
  h1{margin-top:22px;font-size:${rtl ? 64 : 66}px;line-height:${rtl ? 1.32 : 1.06};font-weight:${rtl ? 820 : 800};letter-spacing:${rtl ? '-.01em' : '-.035em'}}
  h1 span{display:block;text-wrap:balance}
  .grad{background:linear-gradient(100deg,#FF8A60,#FF6AA6 55%,#B39BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
  .legal{position:absolute;bottom:46px;${start}:76px;display:flex;align-items:center;gap:10px;font-size:21px;color:#B9B2C9}
  .legal i{width:22px;height:1px;background:linear-gradient(90deg,#F2468E,#8D6EFF)}
  .stage{position:absolute;top:64px;${end}:96px;width:300px}
  .halo{position:absolute;width:560px;height:560px;left:50%;top:44%;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,rgba(242,70,142,.32),transparent 70%)}
  .ring{position:absolute;width:420px;height:420px;left:50%;top:40%;translate:-50% -50%;border-radius:50%;padding:1.5px;background:conic-gradient(#FF6A3D,#F2468E,#8D6EFF,#FF6A3D);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;opacity:.7}
  .phone{position:relative;width:300px;height:650px;padding:9px;border-radius:44px;rotate:${rtl ? 6 : -6}deg;background:linear-gradient(150deg,#3d3d44,#121215 36%,#0b0b0c 62%,#2c2c32);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.12),0 50px 90px -30px rgba(0,0,0,.85),0 0 60px -20px rgba(242,70,142,.5)}
  .phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:35px}
  .tag{position:absolute;top:26px;${end}:26px;display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:18px;color:#E9E4F3;background:rgba(20,16,30,.72);border:1px solid rgba(255,255,255,.14)}
  .tag i{width:7px;height:7px;border-radius:50%;background:linear-gradient(120deg,#FF6A3D,#F2468E,#8D6EFF)}
  </style></head><body><div class="og">
  <div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div><div class="grid"></div>
  <div class="copy"><div class="brand">${markSvg(54)}<span>${t.brand}</span></div>
  <p class="badge"><i></i>${t.hero.badge}</p>
  <h1><span>${t.hero.title1}</span><span class="grad">${t.hero.title2}</span></h1></div>
  <div class="stage"><div class="halo"></div><div class="ring"></div><div class="phone"><img src="/assets/img/scenes/${lang}/dark/live.webp"></div></div>
  <span class="tag"><i></i>${t.demoTag}</span>
  <p class="legal"><i></i>${t.hero.legal}</p></div></body></html>`;
}

(async () => {
  const out = path.join(VAR, 'og');
  fs.mkdirSync(out, { recursive: true });
  for (const lang of ['fa', 'en']) fs.writeFileSync(path.join(SITE, `tools/.og-aurora-${lang}.html`), ogHtml(lang));
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  try {
    for (const lang of ['fa', 'en']) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
      await page.goto(`http://127.0.0.1:${PORT}/tools/.og-aurora-${lang}.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, `og-${lang}.png`) });
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
    for (const l of ['fa', 'en']) fs.rmSync(path.join(SITE, `tools/.og-aurora-${l}.html`), { force: true });
  }
  console.log('Aurora link previews written to site/variants/aurora/og');
})();
