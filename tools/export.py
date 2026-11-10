#!/usr/bin/env python3
"""Hand-off packages for the owner: the NetRate × Design 1 site before and after release, the Reference Rebuilds gallery,
and the project's source, each as a zip and (the sites and the gallery) as ONE self-contained HTML file to show anyone.

usage (from the repo root):  python3 -I tools/export.py          → exports/ (gitignored)

  exports/netrate-design1-before-release.zip    the site as files: index.html + terms, privacy, … + 404, css, js, img
  exports/netrate-design1-before-release.html   the same site in one file: fonts, libraries and images inside; the
                                                other pages travel as <template>s and open over the home page
  exports/netrate-design1-after-release.zip / .html   the same for the after-release site (live.html → index.html)
  exports/reference-rebuilds-gallery.zip         the gallery as files (open with a local server for the synced split view)
  exports/reference-rebuilds-gallery.html        the gallery in one file: every page inside, shown through srcdoc frames
  exports/netrate-project-source.zip             the repository at HEAD (git archive) + HANDOFF.md, to continue the work

The zips keep the sites as they are published: fonts from Google Fonts, GSAP and Lenis from jsDelivr. The single files
need no network at all: Google Fonts' woff2 files (only the subsets the page's characters need) and the vendored
GSAP 3.15.0 / Lenis 1.3.27 (vendor/) are inlined. Downloads are cached in dist/.cache/."""
import base64
import hashlib
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'exports'
WORK = ROOT / 'dist' / 'export'
CACHE = ROOT / 'dist' / '.cache'
NR = ROOT / 'site' / 'studies' / '01-fintech'
GAL = ROOT / 'studies'
SUB_JS = ROOT / 'site' / 'studies' / 'tools' / 'export_sub.js'
VENDOR = {
    'gsap.min.js': ROOT / 'vendor/gsap/gsap.min.js',
    'ScrollTrigger.min.js': ROOT / 'vendor/gsap/ScrollTrigger.min.js',
    'lenis.min.js': ROOT / 'vendor/lenis/lenis.min.js',
}
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
MIME = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2', '.gif': 'image/gif'}
SUBS = ['terms', 'privacy', 'disclaimer', 'cookies', 'delete-account', 'offices', 'contact']
NR_SKIP = {'tools', 'raw', '.gitignore', 'page.html', 'tops.json'}


# ------------------------------------------------------------------ helpers
def get(url):
    """Download through the session's proxy with curl (cached)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if not f.exists():
        data = subprocess.run(['curl', '-sSfL', '-A', UA, url], check=True, capture_output=True).stdout
        f.write_bytes(data)
    return f.read_bytes()


def uri(data, ext):
    return f'data:{MIME[ext]};base64,' + base64.b64encode(data).decode()


def file_uri(path):
    return uri(Path(path).read_bytes(), Path(path).suffix.lower())


def ranges(spec):
    out = []
    for part in spec.split(','):
        part = part.strip().upper().replace('U+', '')
        if '-' in part:
            a, b = part.split('-')
            out.append((int(a, 16), int(b, 16)))
        elif '?' in part:
            out.append((int(part.replace('?', '0'), 16), int(part.replace('?', 'F'), 16)))
        else:
            out.append((int(part, 16), int(part, 16)))
    return out


def fonts_css(url, chars):
    """Google Fonts CSS with each needed woff2 subset inlined (subsets none of the page's characters fall in are dropped)."""
    css = get(url.replace('&amp;', '&')).decode()
    keep = []
    for block in re.findall(r'@font-face\s*\{[^}]*\}', css):
        m = re.search(r'unicode-range:\s*([^;]+);', block)
        if m:
            rs = ranges(m.group(1))
            if not any(any(a <= c <= b for a, b in rs) for c in chars):
                continue
        src = re.search(r'url\((https://[^)]+)\)', block).group(1)
        keep.append(block.replace(src, uri(get(src), '.woff2')))
    return '\n'.join(keep)


def css_inline(css, base):
    def rep(m):
        p = m.group(2)
        if p.startswith(('data:', 'http:', 'https:', '#')):
            return m.group(0)
        f = (base / p).resolve()
        return f'url("{file_uri(f)}")' if f.exists() else m.group(0)
    return re.sub(r'url\(([\'"]?)([^)\'"]+)\1\)', rep, css)


def script_text(src, base):
    name = src.rsplit('/', 1)[-1]
    if src.startswith('http'):
        assert name in VENDOR, src
        js = VENDOR[name].read_text(encoding='utf-8')
    else:
        js = (base / src).read_text(encoding='utf-8')
    return js.replace('</script', '<\\/script')


def page_chars(*texts):
    return {ord(c) for t in texts for c in t}


def inline_page(html, base, extra_text=''):
    """Turn a page and its files into one HTML string: CSS, fonts, scripts and images inside."""
    chars = page_chars(re.sub(r'<[^>]+>', ' ', html), extra_text)
    for js in re.findall(r'<script[^>]*src="([^"]+)"', html):
        if not js.startswith('http'):
            chars |= page_chars((base / js).read_text(encoding='utf-8'))
    html = re.sub(r'\s*<link rel="(?:preconnect|preload)"[^>]*>', '', html)
    html = re.sub(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/[^"]+)">',
                  lambda m: '<style>\n' + fonts_css(m.group(1), chars) + '\n</style>', html)
    html = re.sub(r'<link rel="stylesheet" href="([^"h][^"]*)">',
                  lambda m: '<style>\n' + css_inline((base / m.group(1)).read_text(encoding='utf-8'), (base / m.group(1)).parent) + '\n</style>', html)
    html = re.sub(r'<link rel="icon" href="([^"]+)"([^>]*)>', lambda m: f'<link rel="icon" href="{file_uri(base / m.group(1))}"{m.group(2)}>', html)

    def img(m):
        tag = m.group(0)
        srcset = re.search(r'\ssrcset="([^"]+)"', tag)
        if srcset:
            best = max((c.strip().split() for c in srcset.group(1).split(',')), key=lambda c: int(c[1][:-1]))[0]
            tag = re.sub(r'\s(?:srcset|sizes)="[^"]*"', '', tag)
            tag = re.sub(r'\ssrc="[^"]*"', f' src="{best}"', tag)
        src = re.search(r'\ssrc="([^"]+)"', tag).group(1)
        if src.startswith(('data:', 'http')) or not (base / src).is_file():   # (or an <img> written inside a script)
            return tag
        return tag.replace(f' src="{src}"', f' src="{file_uri(base / src)}"')
    html = re.sub(r'<img\b[^>]*>', img, html)
    html = re.sub(r'(style="[^"]*)', lambda m: css_inline(m.group(1), base), html)

    late = []

    def script(m):
        tag, src = m.group(0), m.group(1)
        body = '<script>\n' + script_text(src, base) + '\n</script>'
        if ' defer' in tag:
            late.append(body)                             # deferred scripts run after the document: put them at its end
            return ''
        return body
    html = re.sub(r'<script[^>]*\ssrc="([^"]+)"[^>]*>\s*</script>', script, html)
    if late:
        i = html.rindex('</body>')
        html = html[:i] + '\n'.join(late) + '\n' + html[i:]
    return html


def zip_dir(src, dest, arc_root):
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(src.rglob('*')):
            if f.is_file():
                z.write(f, Path(arc_root) / f.relative_to(src))


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


# ------------------------------------------------------------------ NetRate × Design 1
def plain_links(html):
    """After-release pages under their plain names: live.html → index.html, live-terms.html → terms.html."""
    html = re.sub(r'href="live-([\w-]+)\.html', r'href="\1.html', html)
    return html.replace('href="live.html', 'href="index.html')


def nr_folder(release):
    """The site as files, ready to upload: exports/…/netrate-design1-<before|after>-release/."""
    name = f'netrate-design1-{"before" if release == "pre" else "after"}-release'
    d = WORK / name
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    home = (NR / ('index.html' if release == 'pre' else 'live.html')).read_text(encoding='utf-8')
    home = re.sub(r'<!-- Generated from page\.html[^>]*-->\n', '', home)
    write(d / 'index.html', plain_links(home))
    subprocess.run([sys.executable, '-I', str(NR / 'tools/pages.py'), release, str(d)], check=True, capture_output=True)
    for f in ('style.css', 'main.js', 'pages.js'):
        shutil.copy(NR / f, d / f)
    shutil.copytree(NR / 'img', d / 'img', ignore=lambda _, names: [n for n in names if n in NR_SKIP])
    shutil.copy(ROOT / 'HANDOFF.md', d / 'HANDOFF.md')                   # how to continue (the whole project)
    write(d / 'README.md', SITE_README.format(
        title='before release' if release == 'pre' else 'after release',
        what=('“Coming soon” everywhere; the App Store page on the last phone says SOON.' if release == 'pre' else
              'Download buttons in the header, hero, under the phone and in the footer; the App Store page says GET. '
              'The buttons show a note until the real store links are added (search main.js and pages.js for data-store).')))
    return name, d


def nr_single(release, folder):
    """One HTML file: the home page inlined; the other pages as templates opened by export_sub.js."""
    home = (folder / 'index.html').read_text(encoding='utf-8')
    tpls, imgs, texts = [], {}, ''
    for slug in SUBS:
        h = (folder / f'{slug}.html').read_text(encoding='utf-8')
        body = re.search(r'<body>(.*)</body>', h, re.S).group(1)
        body = re.sub(r'<svg width="0" height="0" style="position:absolute" aria-hidden="true">.*?</svg>', '', body, count=1, flags=re.S)
        body = re.sub(r'<p class="toast"[^>]*></p>', '', body)
        body = re.sub(r'\s*<nav class="msheet".*?</nav>', '', body, count=1, flags=re.S)
        body = body.replace('<main id="top"', '<main')
        for src in re.findall(r'<img\b[^>]*\ssrc="([^"]+)"', body):
            imgs[src] = file_uri(folder / src)
        body = re.sub(r'(<img\b[^>]*\s)src="', r'\1data-src="', body)
        texts += body
        tpls.append(f'<template id="sub-{slug}">{body.strip()}</template>')
    html = inline_page(home, folder, extra_text=re.sub(r'<[^>]+>', ' ', texts))
    head_css = ('<style>\n/* the other pages, over the home page (single-file export) */\n'
                '.sub { position: fixed; inset: 0; z-index: 55; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; '
                'background: var(--ground); container-type: inline-size; outline: none; animation: subIn .34s var(--ease); }\n'
                '.sub[hidden] { display: none; }\nhtml.sub-open { overflow: hidden; }\n'
                '@keyframes subIn { from { opacity: 0; translate: 0 14px; } }\n'
                '@media (prefers-reduced-motion: reduce) { .sub { animation: none; } }\n</style>\n')
    html = html.replace('</head>', head_css + '</head>', 1)
    tail = ('\n'.join(tpls) + '\n<script type="application/json" id="sub-img">' + json.dumps(imgs) + '</script>\n'
            '<script>\n' + SUB_JS.read_text(encoding='utf-8') + '\n</script>\n')
    i = html.rindex('</body>')
    html = html[:i] + tail + html[i:]
    note = ('<!-- NetRate × Design 1 (' + ('before' if release == 'pre' else 'after') + ' release) — single-file export made by '
            'tools/export.py. Fonts, GSAP, Lenis and images are inside; works offline. Source: site/studies/01-fintech/page.html. -->\n')
    return html.replace('<!doctype html>\n', '<!doctype html>\n' + note, 1)


SITE_README = '''# NetRate × Design 1 — {title}

{what}

## Open it
- Double-click `index.html` (needs internet for the fonts and the animation libraries), or serve the folder:
  `python3 -m http.server 8080` → http://localhost:8080
- To put it online: upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, cPanel …). No build step.

## Files
- `index.html` — the home page. `terms.html`, `privacy.html`, `disclaimer.html`, `cookies.html`, `delete-account.html`,
  `offices.html`, `contact.html`, `404.html` — the other pages.
- `style.css` — all styles (one file for every page). `main.js` — the home page's interactions and motion
  (GSAP + ScrollTrigger + Lenis from jsDelivr). `pages.js` — the phone menu and download notes on the other pages.
- `img/` — the app screens (rendered from the app itself), the NetRate icon and the poster crop.

## Before going live
- The legal pages are **drafts**: every `[bracketed]` detail (company name, address, contact email, law, retention
  period …) must be filled in, and the whole text reviewed by the client's lawyer.
- Contact details for offices and the store links are placeholders (“Contact details coming soon”, data-store buttons).
- Every number, office and screen on the site is demo data, labelled as such.

These files are generated. To change the site, edit the source (`site/studies/01-fintech/page.html`, `style.css`,
`main.js`, `tools/pages.py`) in the project and rebuild — see `HANDOFF.md` in `netrate-project-source.zip`.
'''


# ------------------------------------------------------------------ the gallery
GAL_README = '''# Reference Rebuilds — the gallery

The six reference rebuilds (studies 01–06, from the owner's reference designs) and the NetRate pages built on them
(design 1, before and after release; designs 6 and 2 are queued), in one viewer: Live / Reference (or the study live) /
Split / Onion skin + Difference, widths Fit, 1440, 1280, 768, 390; keys ← → 1–6 Esc.

## Open it
- Best: serve the folder and open it — `python3 -m http.server 8080` → http://localhost:8080
  (the synced scrolling of Split / Onion needs the pages on the same origin).
- Double-clicking `index.html` also works; the synced scrolling may not.
- `reference-rebuilds-gallery.html` (beside this zip) is the same gallery in one file and works offline anywhere.

## Folders
- `01-fintech/` … `06-invest/` — each study: `index.html`, `style.css`, `main.js` (+ `img/` for 01).
- `netrate/01-fintech/` — NetRate × Design 1: `index.html` (before release) + its pages, `live.html` (after release) + `live-*.html`.
- `thumbs/` — card pictures; `refs/compare/` — the study 01 reference shot; `refs/sheets/` — 12-frame sheets of the reference videos.
'''


def gallery_folder():
    d = WORK / 'reference-rebuilds'
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    shutil.copy(GAL / 'index.html', d / 'index.html')
    for s in ['01-fintech', '02-violet', '03-bank', '04-wallet', '05-finance', '06-invest', 'thumbs', 'refs/compare', 'refs/sheets']:
        shutil.copytree(GAL / s, d / s)
    shutil.copytree(NR, d / 'netrate' / '01-fintech', ignore=lambda _, names: [n for n in names if n in NR_SKIP])
    write(d / 'README.md', GAL_README)
    shutil.copy(ROOT / 'HANDOFF.md', d / 'HANDOFF.md')
    return d


def gallery_single(folder, nr_pages):
    html = inline_page((folder / 'index.html').read_text(encoding='utf-8'), folder)       # the gallery's own fonts first
    pages = {}
    for s in ['01-fintech', '02-violet', '03-bank', '04-wallet', '05-finance', '06-invest']:
        pages[f'{s}/index.html'] = inline_page((folder / s / 'index.html').read_text(encoding='utf-8'), folder / s)
    pages.update(nr_pages)
    files = {p.relative_to(folder).as_posix(): file_uri(p) for d in ('thumbs', 'refs/compare', 'refs/sheets') for p in sorted((folder / d).iterdir())}
    for a, b in [("sf.src = s.ref.src;", "__put(sf, s.ref.src);"),
                 ("frame.src = s.src;", "__put(frame, s.src);"),
                 ("lf.src = s.ref.src;", "__put(lf, s.ref.src);"),
                 ("i.src = s.ref.src;", "i.src = __file(s.ref.src);"),
                 ("<img src=\"' + s.thumb + '\"", "<img src=\"' + __file(s.thumb) + '\""),
                 ("$('vOpen').href = s.src;", "$('vOpen').href = __href(s.src);")]:
        assert html.count(a) == 1, a
        html = html.replace(a, b)
    idx, blocks = {}, []
    for n, (path, page) in enumerate(pages.items()):
        idx[path] = f'emb-p{n}'
        blocks.append(f'<script type="application/json" id="emb-p{n}">' + json.dumps(page).replace('<', '\\u003c') + '</script>')
    blocks.append('<script type="application/json" id="emb-files">' + json.dumps(files) + '</script>')
    helper = '''<script>
/* single-file export (tools/export.py): every page and picture is inside this file; frames show pages through srcdoc */
var __EMB = %s, __FILES = null, __blobs = {};
function __page(p) { var id = __EMB[p], el = id && document.getElementById(id); return el ? JSON.parse(el.textContent) : null; }
function __put(f, p) { var h = __page(p); if (h === null) f.src = p; else f.srcdoc = h; }
function __file(p) { if (!__FILES) __FILES = JSON.parse(document.getElementById('emb-files').textContent); return __FILES[p] || p; }
function __href(p) { if (__blobs[p]) return __blobs[p]; var h = __page(p); return h === null ? p : (__blobs[p] = URL.createObjectURL(new Blob([h], { type: 'text/html' }))); }
</script>
''' % json.dumps(idx)
    html = html.replace('</head>', helper + '</head>', 1)
    i = html.index('>', html.index('<body')) + 1                       # the data first: the gallery's script reads it as it runs
    html = html[:i] + '\n' + '\n'.join(blocks) + html[i:]
    note = ('<!-- Reference Rebuilds — single-file export made by tools/export.py: the six studies and the NetRate pages are '
            'inside (shown through srcdoc frames), with their fonts, libraries and pictures; works offline. -->\n')
    return html.replace('<!doctype html>\n', '<!doctype html>\n' + note, 1)


# ------------------------------------------------------------------ main
def main():
    OUT.mkdir(exist_ok=True)
    subprocess.run([sys.executable, '-I', str(NR / 'tools/build.py')], check=True, capture_output=True)
    made, nr_pages = [], {}
    for release in ('pre', 'post'):
        name, folder = nr_folder(release)
        zip_dir(folder, OUT / f'{name}.zip', name)
        single = nr_single(release, folder)
        write(OUT / f'{name}.html', single)
        nr_pages['netrate/01-fintech/' + ('index.html' if release == 'pre' else 'live.html')] = single
        made += [f'{name}.zip', f'{name}.html']
    g = gallery_folder()
    zip_dir(g, OUT / 'reference-rebuilds-gallery.zip', 'reference-rebuilds')
    write(OUT / 'reference-rebuilds-gallery.html', gallery_single(g, nr_pages))
    made += ['reference-rebuilds-gallery.zip', 'reference-rebuilds-gallery.html']
    src = OUT / 'netrate-project-source.zip'
    subprocess.run(['git', '-C', str(ROOT), 'archive', '--format=zip', '--prefix=02-site-for-app/', '-o', str(src), 'HEAD'], check=True)
    made.append(src.name)
    for f in made:
        print(f'{(OUT / f).stat().st_size / 1048576:6.2f} MB  exports/{f}')


if __name__ == '__main__':
    main()
