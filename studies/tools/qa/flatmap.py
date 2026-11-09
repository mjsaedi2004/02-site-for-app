"""Map reference screen points (design page px) to flat phone coordinates (px from the phone's top-left, and in e = W/26)."""
import sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from posefit import unproject
PRM = [744.7157202026856, 2311.9065095428195, 458.47665596641036, 0.5303783345073783, 0.5377516071544022, -0.011907705682969187, 3653.261785562874]
W = PRM[2]; H = 2.052 * W; E = W / 26
PTS = {
    'time tl': (603.3, 1916.7), 'time br': (630, 1933.3),
    'notch bl': (683.3, 1953.3), 'notch br': (813.3, 1993.3),
    'status icons tl': (836.7, 2000), 'status icons br': (896.7, 2023.3),
    'back chevron tl': (582, 1951.3), 'Search br': (641.3, 1980),
    'icon tl': (586.7, 1984.7), 'icon tr': (683.3, 2008.7), 'icon bl': (586.7, 2103.3), 'icon br': (683.3, 2118),
    'name tl': (698.7, 2030), 'name br': (773.3, 2070),
    'sub tl': (698.7, 2063.3), 'sub br': (810, 2103.3),
    'get tl': (698.7, 2093.3), 'get centre': (728.7, 2111.3),
    'sep line a': (581.7, 2112.7), 'sep line b': (910, 2211.7),
    'ratings tl': (593.3, 2130.7), '4.8 tl': (610, 2161.7), 'stars tl': (595, 2181.7),
    'vsep1 top': (672.7, 2165), 'vsep1 bot': (672.7, 2201.7),
    'AGE tl': (708.3, 2166.7), '4+ tl': (706.7, 2188.3), 'years tl': (693.3, 2210),
    'vsep2 top': (761.7, 2193.3), 'CHART tl': (790, 2189.3), '#3 tl': (796.7, 2215), 'finance tl': (786.7, 2236.7),
    'vsep3 top': (851.7, 2218.3), 'DEV tl': (866.7, 2213.3), 'dev icon tl': (885, 2235), 'dev name tl': (865, 2263.3),
    'share tl': (881.7, 2165), 'share br': (898.3, 2185),
    'card1 tl': (588.3, 2221.7), 'card1 top right': (793.3, 2285), 'card2 tl': (800, 2283.3),
    'c1 time tl': (601.7, 2233.3), 'c1 grid tl': (601.7, 2263.3), 'c1 status tl': (745, 2276.7), 'c1 avatar tl': (755, 2301.7), 'c1 balance tl': (595, 2305),
}
print(f'W {W:.1f}  H {H:.1f}  e {E:.3f}')
for k, p in PTS.items():
    x, y = unproject(p, PRM)
    fx, fy = x + W / 2, y + H / 2
    print(f'{k:16s} flat px ({fx:6.1f}, {fy:6.1f})   e ({fx / E:5.2f}, {fy / E:5.2f})')
for k, p in {'left front edge 2180': (545, 2180), 'left screen 2180': (567.5, 2180), 'right rim 2200': (929.5, 2200), 'right screen 2200': (915, 2200),
             'top notch black 760': (760, 1937), 'notch bottom 760': (760, 1980), 'top edge 640': (640, 1895), 'screen top 640': (640, 1911)}.items():
    x, y = unproject(p, PRM)
    print(f'{k:22s} flat ({x + W / 2:6.1f}, {y + H / 2:6.1f})')
