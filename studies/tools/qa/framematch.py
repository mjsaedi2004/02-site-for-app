"""Pair each moment of a reference video with the closest capture of the build (from scan.js).
usage: framematch.py <video> <page box x0,y0,x1,y1> <scan dir> <out prefix> [step s] [t0] [t1] [--build-box x0,y0,x1,y1]
--build-box crops every capture first (when the video shows only part of the viewport, e.g. a page that starts lower).
For every <step> seconds the video's page area is compared with every capture (grey levels and edges, both
normalised); the best capture is paired with the frame. Writes <out>-NN.jpg sheets (reference | build, 6 rows each)
and <out>.csv (time, scroll y, score). A low score marks a moment the build does not reproduce."""
import csv
import subprocess
import sys
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

args = sys.argv[1:]
bbox = None
if '--build-box' in args:
    k = args.index('--build-box'); bbox = tuple(int(v) for v in args[k + 1].split(',')); del args[k:k + 2]
sys.argv = [sys.argv[0]] + args
video, box, scan, out = sys.argv[1:5]
step = float(sys.argv[5]) if len(sys.argv) > 5 else .5
t0 = float(sys.argv[6]) if len(sys.argv) > 6 else 0.
t1 = float(sys.argv[7]) if len(sys.argv) > 7 else 1e9
x0, y0, x1, y1 = (int(v) for v in box.split(','))
FW, FH = 120, 75  # feature size

probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                        '-of', 'csv=p=0', video], capture_output=True, text=True).stdout.strip().split(',')
VW, VH = int(probe[0]), int(probe[1])


def feat(im):
    g = im.convert('L').resize((FW, FH), Image.BILINEAR).filter(ImageFilter.GaussianBlur(.8))
    a = np.asarray(g, np.float32)
    gy, gx = np.gradient(a)
    e = np.hypot(gx, gy)
    out = []
    for v in (a, e):
        v = v - v.mean()
        n = np.linalg.norm(v)
        out.append(v / n if n > 1e-6 else v)
    return out


idx = json.load(open(f'{scan}/index.json'))
shots = idx['shots']
feats, thumbs = [], []
for s in shots:
    im = Image.open(f"{scan}/{s['file']}").convert('RGB')
    if bbox: im = im.crop(bbox)
    feats.append(feat(im))
    thumbs.append(im.resize((480, round(480 * im.height / im.width)), Image.LANCZOS))
A = np.stack([f[0].ravel() for f in feats]); E = np.stack([f[1].ravel() for f in feats])

cmd = ['ffmpeg', '-v', 'error', '-ss', str(t0)] + (['-t', str(t1 - t0)] if t1 < 1e8 else []) + \
      ['-i', video, '-vf', f'fps={1 / step}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
rows = []
k = 0
while True:
    b = p.stdout.read(VW * VH * 3)
    if len(b) < VW * VH * 3:
        break
    fr = Image.fromarray(np.frombuffer(b, np.uint8).reshape(VH, VW, 3)).crop((x0, y0, x1, y1))
    fa, fe = feat(fr)
    sc = .5 * (A @ fa.ravel()) + .5 * (E @ fe.ravel())
    j = int(np.argmax(sc))
    t = t0 + k * step
    rows.append((t, shots[j]['y'], float(sc[j]), fr, j))
    k += 1

with open(out + '.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['t', 'scrollY', 'score'])
    for t, y, s, _, _ in rows:
        w.writerow([f'{t:.2f}', y, f'{s:.3f}'])

per = 6
for n in range(0, len(rows), per):
    part = rows[n:n + per]
    th = thumbs[0].height
    sheet = Image.new('RGB', (480 * 2 + 12, (th + 22) * len(part)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    for i, (t, y, s, fr, j) in enumerate(part):
        yy = i * (th + 22)
        sheet.paste(fr.resize((480, th), Image.LANCZOS), (0, yy + 18))
        sheet.paste(thumbs[j], (492, yy + 18))
        col = (120, 230, 140) if s > .8 else (240, 200, 90) if s > .6 else (255, 110, 110)
        d.text((4, yy + 3), f'ref t={t:5.2f}s', fill=(230, 230, 230))
        d.text((496, yy + 3), f'build y={y}  score={s:.2f}', fill=col)
    sheet.save(f'{out}-{n // per:02d}.jpg', quality=84)
print('frames', len(rows), 'sheets', (len(rows) + per - 1) // per, 'low (<.6):',
      ', '.join(f'{t:.1f}s' for t, y, s, _, _ in rows if s < .6) or 'none')
