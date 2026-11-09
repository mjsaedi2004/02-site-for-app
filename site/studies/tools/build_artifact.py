#!/usr/bin/env python3
"""Artifact copy of a NetRate page built on a reference study (site/studies/<name>/): dist/netrate-<name>/.

    python3 -I site/studies/tools/build_artifact.py 01-fintech

The page becomes a fragment (the artifact host adds doctype/html/head/body; a boot line restores <html lang>) and its
<title> becomes the artifact's name; the page's tools/ and raw renders stay out. GSAP, Lenis and the font already load
from jsDelivr and Google Fonts. Prints the files to publish beside index.html."""
import re
import shutil
import sys
from pathlib import Path

STUDIES = Path(__file__).resolve().parent.parent
NAMES = {'01-fintech': 'NetRate × Design 1'}           # the artifact's name in the gallery and the browser tab
SKIP = {'tools', 'raw', '.gitignore', 'page.html', 'tops.json'}


def fragment(html, title):
    lang = re.search(r'<html[^>]*\slang="([^"]+)"', html).group(1)
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    head = re.sub(r'\s*<meta (charset|name="viewport"|name="description"|name="theme-color")[^>]*>', '', head)
    head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, count=1)
    rel = re.search(r'<html[^>]*\sdata-release="([^"]+)"', html)
    boot = f"document.documentElement.lang = '{lang}';" + (f" document.documentElement.dataset.release = '{rel.group(1)}';" if rel else '')
    return f"<script>{boot}</script>\n" + head.strip() + '\n' + body.strip() + '\n'


def main():
    name = sys.argv[1]
    src = STUDIES / name
    out = STUDIES.parent.parent / 'dist' / f'netrate-{name}'
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src, out, ignore=lambda d, names: [n for n in names if n in SKIP])
    page = out / 'index.html'
    page.write_text(fragment(page.read_text(encoding='utf-8'), NAMES[name]), encoding='utf-8')
    files = sorted(p.relative_to(out).as_posix() for p in out.rglob('*') if p.is_file() and p != page)
    total = sum((out / f).stat().st_size for f in files)
    print(f'{out.relative_to(STUDIES.parent.parent)}: index.html + {len(files)} files, {total / 1024:.0f} KB')
    for f in files:
        print(f)


if __name__ == '__main__':
    main()
