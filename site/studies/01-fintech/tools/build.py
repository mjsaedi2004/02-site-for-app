"""Build NetRate × Design 1 from page.html into its two pages, side by side in this folder:
  index.html  before release ("Coming soon" everywhere, the App Store page says SOON)
  live.html   after release (download buttons, the App Store page says GET) — the lasting site
usage (from the repo root): python3 -I site/studies/01-fintech/tools/build.py

Template marks in page.html:
  <!--pre-->…<!--/pre--> / <!--post-->…<!--/post-->  kept only in that version
  {{RELEASE}}                     pre | post (on <html data-release>)
  {{SPRITE}}                      the app's line icons the page uses (site/src/partials/sprite.svg)
  {{sb}} / {{sb:light}}           a phone's status bar (dark / light text)
  {{rings}} / {{body}}            a card's three rings / a 3D phone's body and side buttons
  {{stores[:get|foot]}}           the two download buttons (after release)
  {{top:scene}}                   the colour of a screen's top edge (img/app/tops.json)
  {{shot:scene:kind[:eager|lazy][:class]}}  an app screen with srcset (600 / 1170 px) sized for its phone"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
SITE = HERE.parent.parent
SPRITE = (SITE / 'src/partials/sprite.svg').read_text(encoding='utf-8')
TOPS = json.loads((HERE / 'img/app/tops.json').read_text())

# the CSS width of each kind of screen: 1440 layout (u = 1 px, capped) / phones (≤ 860 px)
SIZES = {
    'hero': '(max-width: 860px) 236px, min(21.7vw, 312px)',
    'how': '(max-width: 860px) 236px, min(21.7vw, 312px)',
    'card': '(max-width: 860px) 198px, min(12.7vw, 183px)',
    'truth': '(max-width: 860px) 216px, min(18.75vw, 270px)',
    'theme': '(max-width: 860px) 126px, min(15.6vw, 225px)',
    'store': '(max-width: 860px) 126px, min(14.4vw, 207px)',
    'show': '(max-width: 860px) 205px, min(24.5vw, 352px)',
}
STORE = ('<a class="store" href="#" data-store="iphone"><svg aria-hidden="true"><use href="#i-smartphone"/></svg><span><small>Download for</small>iPhone</span></a>'
         '<a class="store" href="#" data-store="android"><svg aria-hidden="true"><use href="#i-download"/></svg><span><small>Download for</small>Android</span></a>')
# a 3D phone's body: 14 stacked rounded slabs (its edge follows the corners) and the side buttons
BODY = ('<div class="p3d__body" aria-hidden="true">' + '<i></i>' * 14 + '</div>'
        '<div class="p3d__side" aria-hidden="true"><i></i><i></i><i></i></div>')
SB = '<div class="sb{cls}" aria-hidden="true"><b>9:41</b><i class="sb__icons"><span></span><span></span><span></span></i></div>'
RINGS = ('<svg class="card__rings" viewBox="0 0 344 344" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5">'
         '<circle cx="172" cy="172" r="141"/><circle cx="172" cy="172" r="155.5"/><circle cx="172" cy="172" r="170"/></g></svg>')


def shot(m):
    scene, kind, *rest = m.group(1).split(':')
    load = rest[0] if rest and rest[0] else 'eager'          # the few app screens load at once: no blank phones while scrolling
    cls = (' ' + rest[1]) if len(rest) > 1 else ''
    h = 4500 if scene.endswith('-tall') else 2370
    pri = ' fetchpriority="high"' if load == 'eager' else ''
    return (f'<img class="scr__img{cls}" src="img/app/sm/{scene}.webp" srcset="img/app/sm/{scene}.webp 600w, img/app/{scene}.webp 1170w" '
            f'sizes="{SIZES[kind]}" width="1170" height="{h}" alt="" loading="{load}" decoding="async"{pri}>')


def sprite(html):
    used = sorted(set(re.findall(r'href="#(i-[\w-]+)"', html)))
    out = []
    for name in used:
        m = re.search(rf'<symbol id="{name}"[^>]*>.*?</symbol>', SPRITE, re.S)
        assert m, f'icon {name} is not in the app sprite'
        out.append(m.group(0))
    return '\n    '.join(out)


def build(release):
    html = (HERE / 'page.html').read_text(encoding='utf-8')
    other = 'post' if release == 'pre' else 'pre'
    html = re.sub(rf'<!--{other}-->.*?<!--/{other}-->', '', html, flags=re.S)
    html = re.sub(rf'<!--/?{release}-->', '', html)
    html = html.replace('{{RELEASE}}', release)
    html = re.sub(r'\{\{shot:([^}]+)\}\}', shot, html)
    html = re.sub(r'\{\{top:([\w-]+)\}\}', lambda m: TOPS[m.group(1)], html)
    html = html.replace('{{sb:light}}', SB.format(cls=' sb--light')).replace('{{sb}}', SB.format(cls=''))
    html = html.replace('{{rings}}', RINGS).replace('{{body}}', BODY)
    html = re.sub(r'\{\{stores(?::(\w+))?\}\}', lambda m: f'<div class="stores{" stores--" + m.group(1) if m.group(1) else ""}">{STORE}</div>', html)
    html = html.replace('{{SPRITE}}', sprite(html))
    html = re.sub(r'\n[ \t]*\n(?=[ \t]*\n)', '\n', html)                     # blank lines left by removed blocks
    assert '{{' not in html, re.findall(r'\{\{[^}]*\}\}', html)[:3]
    note = f'<!-- Generated from page.html by tools/build.py ({"before" if release == "pre" else "after"} release); edit page.html. -->\n'
    name = 'index.html' if release == 'pre' else 'live.html'
    (HERE / name).write_text(html.replace('<!doctype html>\n', '<!doctype html>\n' + note, 1), encoding='utf-8')
    return name, len(html)


if __name__ == '__main__':
    for r in ('pre', 'post'):
        print('%s %d bytes' % build(r))
