"""Turn the raw app renders (tools/shots.js → img/raw/*.png) into the page's images:
img/app/live-light-tall.webp at 780 px (2x of the 390 px screen), the rest as img/app/sm/<scene>-<theme>.webp at 420 px,
and print each screen's top-edge colour (the phone paints its status strip in it).
usage (from the repo root): python3 -I site/studies/01-fintech/tools/convert.py"""
import pathlib
from PIL import Image

here = pathlib.Path(__file__).resolve().parent.parent
raw = here / 'img' / 'raw'
out = here / 'img' / 'app'
(out / 'sm').mkdir(parents=True, exist_ok=True)
FULL = {'live-light-tall'}                      # the hero phone (347 px wide at 1440): full 2x render
SMALL = {'list-light', 'expired-light', 'f-alerts-light', 'live-light', 'office-page-light', 'f-chart-light', 'live-dark'}
for d in (out, out / 'sm'):
    for old in d.glob('*.webp'):
        old.unlink()
for p in sorted(raw.glob('*.png')):
    if p.stem not in FULL | SMALL:
        continue
    im = Image.open(p).convert('RGB')
    row = [im.getpixel((x, y)) for y in (0, 1, 2) for x in range(0, im.width, 6)]
    top = '#' + ''.join(f'{sum(c[i] for c in row) // len(row):02X}' for i in range(3))
    if p.stem in FULL:
        im.save(out / f'{p.stem}.webp', 'WEBP', quality=86, method=6)
        print(f'{p.stem:22s} top {top}  {(out / (p.stem + ".webp")).stat().st_size // 1024} KB')
    else:                                       # card phones and the store's screenshots: 420 px
        sm = im.resize((420, round(420 * im.height / im.width)), Image.LANCZOS)
        sm.save(out / 'sm' / f'{p.stem}.webp', 'WEBP', quality=84, method=6)
        print(f'{p.stem:22s} top {top}  sm {(out / "sm" / (p.stem + ".webp")).stat().st_size // 1024} KB')

# the main screen's tab bar, cut from its normal render: the hero phone lays it over the tall, scrolling render
# (capsule at x 44–336, y 715–775 of the 390 × 798 screen; found by scanning the render's edges)
live = Image.open(raw / 'live-light.png').convert('RGB')
live.crop((88, 1430, 672, 1550)).save(out / 'tabbar-live-light.webp', 'WEBP', quality=92, method=6)
print('tab bar cut')
