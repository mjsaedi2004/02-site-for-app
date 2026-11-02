// Generate the still images ("posters") of every phone scene from the app itself.
// usage (from the repo root):  node site/tools/posters.js [lang] [theme] [scene]
// Writes site/assets/img/scenes/<appLang>/<theme>/<scene>.png, then run
// `python3 -I site/tools/build.py --posters` (or build.py) to convert them to .webp.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SITE = path.resolve(__dirname, '..');
const PORT = 8097;
const LANGS = ['fa', 'en'];
const THEMES = ['dusk', 'dark', 'light'];

(async () => {
  const [onlyLang, onlyTheme, onlyScene] = process.argv.slice(2);
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const scenes = JSON.parse(fs.readFileSync(path.join(SITE, 'src/scenes.json'), 'utf8')).scenes;
  const names = Object.keys(scenes).filter((n) => n !== 'lang' && (!onlyScene || n === onlyScene));
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const lang of LANGS.filter((l) => !onlyLang || l === onlyLang)) {
      for (const theme of THEMES.filter((t) => !onlyTheme || t === onlyTheme)) {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        page.on('pageerror', (e) => errors.push(`${lang}/${theme}: ${e.message}`));
        await page.goto(`http://127.0.0.1:${PORT}/tools/poster-host.html`);
        await page.evaluate(() => localStorage.clear());
        await page.evaluate(([l, t]) => setup(l, t), [lang, theme]);
        await page.waitForTimeout(1500);
        const dir = path.join(SITE, 'assets/img/scenes', lang, theme);
        fs.mkdirSync(dir, { recursive: true });
        for (const name of names) {
          await page.evaluate(([n, l]) => play(n, l), [name, lang]);
          await page.waitForTimeout(1400);
          await page.locator('#app').screenshot({ path: path.join(dir, `${name}.png`) });
          process.stdout.write(`${lang}/${theme}/${name} `);
        }
        process.stdout.write('\n');
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'posters done, no errors');
})();
