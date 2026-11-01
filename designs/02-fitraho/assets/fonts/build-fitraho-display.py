import copy, sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.ttLib.tables.TupleVariation import TupleVariation

src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
glyf, gvar = f['glyf'], f['gvar']
O, Z = glyf['O'], glyf['zero']
ovars = list(gvar.variations['O'])      # decompile before touching glyf
zvars = list(gvar.variations['zero'])
adv, _ = f['hmtx']['zero']
oxmin = min(x for x, _ in O.coordinates); oxmax = max(x for x, _ in O.coordinates)
shift = round((adv - (oxmax - oxmin)) / 2 - oxmin)   # centre O inside zero's advance
nz = copy.deepcopy(O)
nz.coordinates = GlyphCoordinates([(x + shift, y) for x, y in O.coordinates])
nz.recalcBounds(glyf)
glyf['zero'] = nz
npts = len(O.coordinates)
newvars = []
for ov, zv in zip(ovars, zvars):
    assert ov.axes == zv.axes
    newvars.append(TupleVariation(dict(ov.axes), list(ov.coordinates[:npts]) + list(zv.coordinates[-4:])))
gvar.variations['zero'] = newvars
f['hmtx']['zero'] = (adv, nz.xMin)
# OFL Reserved Font Name: rename the modified font
for rec in f['name'].names:
    s = rec.toUnicode()
    if 'Orbitron' in s and rec.nameID not in (0, 13, 14):
        rec.string = s.replace('Orbitron', 'FitRaho Display')
f.flavor = 'woff2'
f.save(out)
print('ok shift', shift, 'pts', npts)
