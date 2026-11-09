"""Ink boxes of named regions in the reference (scaled to the build width) and in the build screenshot.
usage: inkcmp.py <ref.jpg> <build.png> <ref box x0,y0,x1,y1> <regions.json>
regions.json: {"name": [x0, y0, x1, y1, thr]} in build CSS px (1440 wide). Background = the region's top-left pixel."""
import json
import sys
from PIL import Image

ref_path, build_path, box, reg_path = sys.argv[1:5]
box = tuple(int(v) for v in box.split(','))
build = Image.open(build_path).convert('RGB')
ref = Image.open(ref_path).convert('RGB').crop(box)
ref = ref.resize((build.width, round(ref.height * build.width / ref.width)), Image.LANCZOS)

def ink(im, x0, y0, x1, y1, thr):
    px = im.load()
    bg = px[x0, y0]
    xs, ys = [], []
    for y in range(y0, min(y1, im.height)):
        for x in range(x0, x1):
            p = px[x, y]
            if abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2]) > thr:
                xs.append(x); ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1

for name, (x0, y0, x1, y1, thr) in json.load(open(reg_path)).items():
    a, b = ink(ref, x0, y0, x1, y1, thr), ink(build, x0, y0, x1, y1, thr)
    fmt = lambda r: f"x {r[0]}..{r[2]} w{r[2]-r[0]}  y {r[1]}..{r[3]} h{r[3]-r[1]}" if r else '-'
    d = ''
    if a and b:
        d = f"  Δx0 {b[0]-a[0]:+d} Δw {(b[2]-b[0])-(a[2]-a[0]):+d}  Δy0 {b[1]-a[1]:+d} Δh {(b[3]-b[1])-(a[3]-a[1]):+d}"
    print(f"{name:14s} ref {fmt(a):34s} build {fmt(b):34s}{d}")
