"""Compare a build screenshot with the reference page area.
usage: compare.py <ref.jpg> <build.png> <outprefix> <ref box x0,y0,x1,y1> <bands y0:y1,...> [scale]
The reference box is scaled to the build width; each band (build px) gives a side-by-side and an overlay image."""
import sys
from PIL import Image, ImageChops

ref_path, build_path, out = sys.argv[1:4]
box = tuple(int(v) for v in sys.argv[4].split(','))
bands = [tuple(int(v) for v in b.split(':')) for b in sys.argv[5].split(',')]
view = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
ref = Image.open(ref_path).convert('RGB').crop(box)
build = Image.open(build_path).convert('RGB')
k = build.width / ref.width
ref = ref.resize((build.width, round(ref.height * k)), Image.LANCZOS)
print('ref scaled', ref.size, 'build', build.size)
for i, (y0, y1) in enumerate(bands):
    a = ref.crop((0, y0, ref.width, min(y1, ref.height)))
    b = build.crop((0, y0, build.width, min(y1, build.height)))
    h = max(a.height, b.height)
    side = Image.new('RGB', (a.width * 2 + 16, h), (255, 0, 128))
    side.paste(a, (0, 0)); side.paste(b, (a.width + 16, 0))
    side = side.resize((round(side.width * view), round(side.height * view)), Image.LANCZOS)
    side.save(f'{out}-{i}-side.jpg', quality=85)
    if a.size == b.size:
        mix = Image.blend(a, b, .5)
        mix = mix.resize((round(mix.width * view * 1.4), round(mix.height * view * 1.4)), Image.LANCZOS)
        mix.save(f'{out}-{i}-mix.jpg', quality=85)
print('bands', len(bands))
