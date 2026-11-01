#!/usr/bin/env python3
"""Side-by-side sheets: reference full-page image vs. our full-page screenshot, both scaled to the
same width, cut into chunks with a y-ruler (ruler values = 620px-wide scale; x2.3226 for 1440px).

usage: python3 -I tools/qa/ref_sheet.py <reference.webp> <x0,y0,x1,y1 site box inside the ref> <ours.png> <out_prefix>
       e.g. references/01-byondbites/full-page.webp 10,24,279,1976 /tmp/d1_full.png /tmp/cmp1
The site box excludes the presentation frame around the reference (find it by column brightness).
"""
import sys
from PIL import Image, ImageDraw

ref_path, box, ours_path, prefix = sys.argv[1], tuple(map(int, sys.argv[2].split(','))), sys.argv[3], sys.argv[4]
W, CH = 620, 1000
ref = Image.open(ref_path).convert('RGB').crop(box)
ref = ref.resize((W, round(ref.height * W / ref.width)), Image.LANCZOS)
me = Image.open(ours_path).convert('RGB')
me = me.resize((W, round(me.height * W / me.width)), Image.LANCZOS)
print('reference height', ref.height, '| ours', me.height, '(at 620px wide)')
for i in range(max(ref.height, me.height) // CH + 1):
    sheet = Image.new('RGB', (W * 2 + 30, CH), (255, 0, 255))
    sheet.paste(ref.crop((0, i * CH, W, (i + 1) * CH)), (0, 0))
    sheet.paste(me.crop((0, i * CH, W, (i + 1) * CH)), (W + 30, 0))
    d = ImageDraw.Draw(sheet)
    for y in range(0, CH, 100):
        d.line([(W, y), (W + 30, y)], fill=(0, 0, 0))
        d.text((W + 2, y + 2), str(i * CH + y), fill=(0, 0, 0))
    sheet.save(f'{prefix}_{i}.jpg', quality=82)
