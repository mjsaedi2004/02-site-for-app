# usage: python3 sheet.py out.jpg cols width img1 img2 ...
import sys
from PIL import Image
out, cols, width = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert('RGB') for p in sys.argv[4:]]
th = [int(im.height * width / im.width) for im in ims]
rows = (len(ims) + cols - 1) // cols
H = sum(max(th[r*cols:(r+1)*cols]) + 8 for r in range(rows))
sheet = Image.new('RGB', (cols * (width + 8), H), (40, 40, 40))
y = 0
for r in range(rows):
    rh = max(th[r*cols:(r+1)*cols])
    for c in range(cols):
        i = r * cols + c
        if i >= len(ims): break
        sheet.paste(ims[i].resize((width, th[i])), (c * (width + 8), y))
    y += rh + 8
sheet.save(out, quality=82)
