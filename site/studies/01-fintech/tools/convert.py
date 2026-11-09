"""Turn the raw app renders (tools/shots.js -> img/raw/*.png, 3x) into the page's images:
img/app/<scene>-<theme>.webp at 1170 px (3x of the 390 px screen) and img/app/sm/<scene>-<theme>.webp at 600 px
(the page picks one with srcset), img/app/tabbar-live-light.webp (the main screen's tab bar, laid over the tall
render in the hero phone) and img/app/tops.json (each screen's top-edge colour: the phone paints its status strip in it).
usage (from the repo root): python3 -I site/studies/01-fintech/tools/convert.py"""
import json
import pathlib
from PIL import Image

here = pathlib.Path(__file__).resolve().parent.parent
raw = here / 'img' / 'raw'
out = here / 'img' / 'app'
(out / 'sm').mkdir(parents=True, exist_ok=True)
for d in (out, out / 'sm'):
    for old in d.glob('*.webp'):
        old.unlink()
tops = {}
for p in sorted(raw.glob('*.png')):
    im = Image.open(p).convert('RGB')
    row = [im.getpixel((x, y)) for y in (0, 1, 2) for x in range(0, im.width, 9)]
    tops[p.stem] = '#' + ''.join(f'{sum(c[i] for c in row) // len(row):02X}' for i in range(3))
    im.save(out / f'{p.stem}.webp', 'WEBP', quality=80, method=6)
    sm = im.resize((600, round(600 * im.height / im.width)), Image.LANCZOS)
    sm.save(out / 'sm' / f'{p.stem}.webp', 'WEBP', quality=82, method=6)
    print(f'{p.stem:22s} top {tops[p.stem]}  {(out / (p.stem + ".webp")).stat().st_size // 1024} KB, sm {(out / "sm" / (p.stem + ".webp")).stat().st_size // 1024} KB')
(out / 'tops.json').write_text(json.dumps(tops, indent=1) + '\n')
# the tab bar capsule of the main screen, at 3x: x 44-336, y 703-768 of the 390 x 790 render (scanned from its edges)
live = Image.open(raw / 'live-light.png').convert('RGB')
live.crop((132, 2109, 1008, 2304)).save(out / 'tabbar-live-light.webp', 'WEBP', quality=90, method=6)
print('tab bar cut, tops.json written')
