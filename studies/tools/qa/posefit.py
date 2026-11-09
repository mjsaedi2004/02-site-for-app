"""Pose fit with edges + flat-horizontal content lines; closed-form unprojection (homography of the front plane)."""
import math, sys

TOP = [(640, 1895), (700, 1916), (760, 1936), (820, 1957), (860, 1970)]
RIGHT = [(924, 2050), (927, 2140), (929, 2200), (932, 2290)]
LEFT = [(545, 2050), (543, 2180), (541, 2300)]
BACK = [(524, 2050), (521, 2180), (520, 2300)]
PAIRS = [((616.7, 1924.7), (886.7, 2018.0)), ((581.7, 2112.7), (910.0, 2211.7)), ((588.3, 2223.3), (793.3, 2286.7))]

def rot(rx, ry, rz):
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    X = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]]; Y = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]; Z = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]]
    mul = lambda A, B: [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    return mul(mul(X, Y), Z)

def proj(p, prm):
    Cx, Cy, W, rx, ry, rz, P = prm
    R = rot(rx, ry, rz)
    q = [sum(R[i][k] * p[k] for k in range(3)) for i in range(3)]
    f = P / (P - q[2])
    return Cx + q[0] * f, Cy + q[1] * f

def unproject(pt, prm):
    Cx, Cy, W, rx, ry, rz, P = prm
    r = rot(rx, ry, rz)
    H = [[P * r[0][0] - Cx * r[2][0], P * r[0][1] - Cx * r[2][1], Cx * P],
         [P * r[1][0] - Cy * r[2][0], P * r[1][1] - Cy * r[2][1], Cy * P],
         [-r[2][0], -r[2][1], P]]
    a, b, c = H[0]; d, e, f = H[1]; g, h, i = H[2]
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    inv = [[(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
           [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
           [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]]
    X, Y = pt
    u = inv[0][0] * X + inv[0][1] * Y + inv[0][2]; v = inv[1][0] * X + inv[1][1] * Y + inv[1][2]; w = inv[2][0] * X + inv[2][1] * Y + inv[2][2]
    return u / w, v / w

def line_dist(pt, a, b):
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    return ((pt[0] - x0) * dy - (pt[1] - y0) * dx) / math.hypot(dx, dy)

def resid(prm, wpair=2.0):
    W = prm[2]; H, T = 2.052 * W, .107 * W
    out = []
    for pts, a, b in ((TOP, (-W / 2, -H / 2, 0), (W / 2, -H / 2, 0)), (RIGHT, (W / 2, -H / 2, 0), (W / 2, H / 2, 0)),
                      (LEFT, (-W / 2, -H / 2, 0), (-W / 2, H / 2, 0)), (BACK, (-W / 2, -H / 2, -T), (-W / 2, H / 2, -T))):
        A, B = proj(a, prm), proj(b, prm)
        out += [line_dist(p, A, B) for p in pts]
    for a, b in PAIRS:
        x, y = unproject(a, prm)
        out.append(wpair * line_dist(b, proj((x - 100, y, 0), prm), proj((x + 400, y, 0), prm)))
    return out

def cost(prm):
    if prm[2] < 300 or prm[2] > 700 or prm[6] < 500:
        return 1e12
    return sum(r * r for r in resid(prm))

def nelder_mead(f, x0, steps, iters=6000, tol=1e-9):
    n = len(x0)
    pts = [list(x0)] + [[x0[j] + (steps[j] if j == i else 0) for j in range(n)] for i in range(n)]
    vals = [f(p) for p in pts]
    for _ in range(iters):
        order = sorted(range(n + 1), key=lambda i: vals[i]); pts, vals = [pts[i] for i in order], [vals[i] for i in order]
        if abs(vals[-1] - vals[0]) < tol: break
        c = [sum(p[j] for p in pts[:-1]) / n for j in range(n)]
        xr = [c[j] + (c[j] - pts[-1][j]) for j in range(n)]; fr = f(xr)
        if fr < vals[0]:
            xe = [c[j] + 2 * (c[j] - pts[-1][j]) for j in range(n)]; fe = f(xe)
            pts[-1], vals[-1] = (xe, fe) if fe < fr else (xr, fr)
        elif fr < vals[-2]: pts[-1], vals[-1] = xr, fr
        else:
            xc = [c[j] + .5 * (pts[-1][j] - c[j]) for j in range(n)]; fc = f(xc)
            if fc < vals[-1]: pts[-1], vals[-1] = xc, fc
            else:
                pts = [pts[0]] + [[pts[0][j] + .5 * (p[j] - pts[0][j]) for j in range(n)] for p in pts[1:]]
                vals = [vals[0]] + [f(p) for p in pts[1:]]
    return pts[0], vals[0]

if __name__ == '__main__':
    best = None
    for P in (1200, 2500, 5000):
        x0 = [760, 2386, 470, math.radians(8.5), math.radians(34), math.radians(-.8), P]
        for _ in range(3):
            x0, v = nelder_mead(cost, x0, [15, 15, 15, .05, .05, .03, P * .2])
        print('start P', P, '->', round(v, 2), [round(c, 3) for c in x0], flush=True)
        if best is None or v < best[1]: best = (x0, v)
    prm, v = best
    Cx, Cy, W, rx, ry, rz, P = prm
    print(f'BEST cost {v:.2f}  C ({Cx:.1f}, {Cy:.1f})  W {W:.1f}  rotateX {math.degrees(rx):.2f} rotateY {math.degrees(ry):.2f} rotateZ {math.degrees(rz):.2f}  P {P:.0f}')
    print('residuals', [round(r, 1) for r in resid(prm)])
    print('PRM', prm)
