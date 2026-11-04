// Link-preview (Open Graph) images for NetRate Aurora: the app's monochrome black theme with stage light (rays, a
// spotlight, a floor grid), the app's brand mark in its black-theme colours, the hero headline and the app's
// black-theme main screen. Run from the repo root:
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
  mark.replace(/var\(--mark-fill\)/g, '#FFFFFF').replace(/var\(--mark-ink\)/g, '#09090B') + '</svg>';

const fontCss = `@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-arabic.woff2) format("woff2");unicode-range:U+0600-06FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}
@font-face{font-family:Vazirmatn;font-weight:100 900;src:url(/assets/fonts/vazirmatn-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F}`;

function ogHtml(lang) {
  const t = i18n[lang];
  const rtl = lang === 'fa';
  const start = rtl ? 'right' : 'left', end = rtl ? 'left' : 'right';
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${fontCss}
  *{box-sizing:border-box;margin:0}
  html,body{overflow:hidden}
  body{width:1200px;height:630px;font-family:Vazirmatn,sans-serif;color:#F5F5F6;background:#000}
  .og{position:relative;width:1200px;height:630px;overflow:hidden}  /* clips the lights: overflow on the start side of an RTL page shifts the view */
  .rays{position:absolute;inset:0;background:repeating-conic-gradient(from 172deg at 50% -40%,rgba(255,255,255,.06) 0deg 1.1deg,transparent 1.1deg 6.5deg);-webkit-mask:radial-gradient(70% 85% at 50% -10%,#000 8%,transparent 78%)}
  .top{position:absolute;inset:0;background:radial-gradient(46% 42% at 50% 0%,rgba(255,255,255,.1),transparent 72%)}
  .spot{position:absolute;top:-45%;${start}:-14%;width:62%;height:130%;background:radial-gradient(closest-side,rgba(255,255,255,.2),rgba(255,255,255,.07) 55%,transparent);rotate:${rtl ? 32 : -32}deg}
  .grid{position:absolute;inset:auto -10% 0 -10%;height:250px;background:linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px) 0 0/64px 64px,linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px) 0 0/64px 64px;transform:perspective(420px) rotateX(60deg);transform-origin:bottom;-webkit-mask:linear-gradient(transparent,#000 75%)}
  .copy{position:absolute;top:68px;${start}:76px;width:640px}
  .brand{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:780}
  .brand svg{width:54px;height:54px;filter:drop-shadow(0 8px 22px rgba(255,255,255,.18))}
  .badge{display:inline-flex;align-items:center;gap:10px;margin-top:40px;padding:7px 16px;border-radius:999px;font-size:20px;color:#C9C9D0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13)}
  .badge i{width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.14)}
  h1{margin-top:22px;font-size:${rtl ? 64 : 66}px;line-height:${rtl ? 1.32 : 1.06};font-weight:${rtl ? 820 : 800};letter-spacing:${rtl ? '-.01em' : '-.035em'}}
  h1 span{display:block;text-wrap:balance}
  .grad{background:linear-gradient(180deg,#FFFFFF 22%,#A1A1AA 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .legal{position:absolute;bottom:46px;${start}:76px;display:flex;align-items:center;gap:10px;font-size:21px;color:#B4B4BC}
  .legal i{width:22px;height:1px;background:rgba(255,255,255,.5)}
  .stage{position:absolute;top:64px;${end}:96px;width:300px}
  .halo{position:absolute;width:560px;height:560px;left:50%;top:44%;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.1),transparent 70%)}
  .ring{position:absolute;width:420px;height:420px;left:50%;top:40%;translate:-50% -50%;border-radius:50%;border:1px solid rgba(255,255,255,.16)}
  .ring2{position:absolute;width:520px;height:520px;left:50%;top:40%;translate:-50% -50%;border-radius:50%;border:1px solid rgba(255,255,255,.08)}
  .phone{position:relative;width:300px;height:650px;padding:9px;border-radius:44px;rotate:${rtl ? 6 : -6}deg;background:linear-gradient(150deg,#3d3d44,#121215 36%,#0b0b0c 62%,#2c2c32);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14),0 50px 90px -30px rgba(0,0,0,.9),0 0 70px -24px rgba(255,255,255,.25)}
  .phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:35px}
  .tag{position:absolute;top:26px;${end}:26px;display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:18px;color:#F5F5F6;background:rgba(17,17,19,.78);border:1px solid rgba(255,255,255,.14)}
  .tag i{width:7px;height:7px;border-radius:50%;background:#fff}
  </style></head><body><div class="og">
  <div class="rays"></div><div class="top"></div><div class="spot"></div><div class="grid"></div>
  <div class="copy"><div class="brand">${markSvg(54)}<span>${t.brand}</span></div>
  <p class="badge"><i></i>${t.hero.badge}</p>
  <h1><span>${t.hero.title1}</span><span class="grad">${t.hero.title2}</span></h1></div>
  <div class="stage"><div class="halo"></div><div class="ring2"></div><div class="ring"></div><div class="phone"><img src="/assets/img/scenes/${lang}/dark/live.webp"></div></div>
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
