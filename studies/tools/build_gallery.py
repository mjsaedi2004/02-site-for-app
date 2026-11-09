#!/usr/bin/env python3
"""Assemble the studies gallery for one claude.ai artifact: dist/studies/.
The gallery (studies/index.html) becomes the artifact page (a fragment: the host adds doctype/html/head/body);
each built study is published beside it as its own full HTML page with its files, plus thumbnails,
the reference compare image(s) and the video contact sheets.
Usage: python3 -I studies/tools/build_gallery.py   (prints the files to publish)"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / 'dist' / 'studies'
BUILT = ['01-fintech']          # study folders that are finished and published live
COPY = ['thumbs', 'refs/compare', 'refs/sheets']

def fragment(html):
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    head = re.sub(r'\s*<meta (charset|name="viewport")[^>]*>', '', head)
    return head.strip() + '\n' + body.strip() + '\n'

def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / 'index.html').write_text(fragment((ROOT / 'index.html').read_text(encoding='utf-8')), encoding='utf-8')
    for d in BUILT + COPY:
        shutil.copytree(ROOT / d, OUT / d)
    files = sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob('*') if p.is_file() and p.name != 'index.html' or p.is_file() and p.parent != OUT)
    total = sum((OUT / f).stat().st_size for f in files)
    print(f'{len(files)} files beside the page, {total / 1024:.0f} KB')
    for f in files:
        print(f)

if __name__ == '__main__':
    main()
