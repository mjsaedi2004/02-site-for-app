"""Aurora's extra template data, formatted from the app engine's demo data (src/data/demo.json).

Called by tools/build_variant.py for each language: extend(view, t, lang, demo, helpers)."""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
I18N = {l: json.loads((HERE / "i18n" / f"{l}.json").read_text(encoding="utf-8")) for l in ("fa", "en")}


def date_long(d, lang, num):
    t = I18N[lang]
    if lang == "fa":
        return f'{t["days"][d["dow"]]} {num(d["j"]["jd"], lang)} {t["months"][d["j"]["jm"] - 1]}'
    return f'{t["days"][d["dow"]]} {d["g"]["gd"]} {t["months"][d["g"]["gm"] - 1]}'


def date_short(d, lang, num):
    t = I18N[lang]
    if lang == "fa":
        return f'{num(d["j"]["jd"], lang)} {t["months"][d["j"]["jm"] - 1]}'
    return f'{d["g"]["gd"]} {t["months"][d["g"]["gm"] - 1][:3]}'


def smooth(points):
    """Catmull-Rom through the points, as cubic Bézier segments."""
    if len(points) < 2:
        return ""
    d = f"M{points[0][0]:.1f} {points[0][1]:.1f}"
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < len(points) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d


def extend(view, t, lang, demo, H):
    fmt, num, rel = H["fmt"], H["num"], H["rel"]
    pct_sign = "٪" if lang == "fa" else "%"
    ex = {e["id"]: e for e in demo["ex"]}
    today = demo["today"]
    gbp = demo["market"]["gbp"]
    best = ex[gbp["bestId"]]

    view["hero"] = {
        "best": fmt(gbp["best"], lang), "office": best["name"][lang], "age": rel(best["mins"], lang, demo),
        "avg": fmt(today["avg"], lang), "pct": fmt(abs(today["pct"]), lang, 2) + pct_sign,
        "dir": "up" if today["pct"] >= 0 else "down", "date": date_long(today["date"], lang, num),
        "from": t["hero"]["from"].replace("{n}", num(today["n"], lang)),
    }

    # the pound's offices by today's cash rate (Send to Iran): the ordered list of the "why" story
    ranked = sorted(demo["ex"], key=lambda e: (-e["send"], e["id"]))
    view["why"] = [{"n": num(i + 1, lang), "initial": e["initial"][lang], "name": e["name"][lang], "city": e["city"][lang],
                    "value": fmt(e["send"], lang), "unit": t["calc"]["toman"], "age": rel(e["mins"], lang, demo)}
                   for i, e in enumerate(ranked[:6])]

    exp = demo["expired"]
    view["ages"] = [
        {"initial": e["initial"][lang], "name": e["name"][lang], "value": fmt(e["send"], lang), "age": rel(e["mins"], lang, demo), "cls": ""}
        for e in ranked[:2]
    ] + [{"initial": exp["initial"][lang], "name": exp["name"][lang], "value": fmt(exp["send"], lang),
          "age": rel(exp["mins"], lang, demo), "cls": "is-expired"}]

    # 30-day market average: a smooth line, its area, hover points and the Sundays without data
    W, Hh, top, bottom = 560, 200, 18, 30
    vals = [s["avg"] for s in demo["series"] if s["avg"]]
    lo, hi = min(vals), max(vals)
    pad = (hi - lo) * 0.12
    lo_v, hi_v = lo - pad, hi + pad
    n = len(demo["series"])

    def xy(i, v):
        return (6 + i * (W - 12) / (n - 1), top + (hi_v - v) / (hi_v - lo_v) * (Hh - top - bottom))
    pts, hover, sundays = [], [], []
    for i, s in enumerate(demo["series"]):
        x = 6 + i * (W - 12) / (n - 1)
        if s["avg"] is None:
            sundays.append({"x": f"{x / W * 100:.2f}"})
            continue
        p = xy(i, s["avg"])
        pts.append(p)
        hover.append({"x": f"{p[0] / W * 100:.2f}", "y": f"{p[1] / Hh * 100:.2f}", "date": date_short(s, lang, num),
                      "value": fmt(s["avg"], lang)})
    line = smooth(pts)
    area = line + f"L{pts[-1][0]:.1f} {Hh - bottom + 8}L{pts[0][0]:.1f} {Hh - bottom + 8}Z"
    i_hi = max(range(len(hover)), key=lambda i: float(vals[i]))
    i_lo = min(range(len(hover)), key=lambda i: float(vals[i]))
    view["chart"] = {
        "w": W, "h": Hh, "line": line, "area": area, "points": hover, "sundays": sundays,
        "last": hover[-1], "from": date_short(demo["series"][0], lang, num), "to": date_short(demo["series"][-1], lang, num),
        "hi": {"value": fmt(vals[i_hi], lang), "date": hover[i_hi]["date"], "x": hover[i_hi]["x"], "y": hover[i_hi]["y"]},
        "lo": {"value": fmt(vals[i_lo], lang), "date": hover[i_lo]["date"], "x": hover[i_lo]["x"], "y": hover[i_lo]["y"]},
    }

    o = demo["office"]
    close = o["hours"][1]
    clock = f"{close // 60}:{close % 60:02d}"
    view["office"] = {
        "initial": best["initial"][lang], "name": best["name"][lang], "city": best["city"][lang],
        "branches": t["bento"]["office"]["branches"].replace("{n}", num(o["branches"], lang)),
        "rating": fmt(o["rating"], lang, 1), "reviews": t["bento"]["office"]["reviews"].replace("{n}", num(o["reviews"], lang)),
        "open": t["bento"]["office"]["open"].replace("{t}", num(clock, lang)),
        "rate": fmt(best["send"], lang), "age": rel(best["mins"], lang, demo),
    }

    view["alert"] = {"value": fmt(math.ceil((gbp["best"] + 500) / 500) * 500, lang)}

    view["langs"] = {
        "fa": {"value": fmt(gbp["best"], "fa"), "unit": I18N["fa"]["calc"]["toman"], "date": date_long(today["date"], "fa", num)},
        "en": {"value": fmt(gbp["best"], "en"), "unit": I18N["en"]["calc"]["toman"], "date": date_long(today["date"], "en", num)},
    }

    ty = demo["type"]
    view["panel"] = {
        "rows": [{"type": t["calc"]["types"][k],
                  "send": fmt(best["send"] * ty[k]["send"], lang),
                  "recv": fmt(best["send"] * (1 + best["spr"] / 100) * ty[k]["recv"], lang)} for k in ("cash", "bank", "official")],
        "last": rel(best["mins"], lang, demo), "date": date_long(today["date"], lang, num), "rate": fmt(best["send"], lang),
    }

    for c in view["currencies"]:
        c["checked"] = "checked" if c["selected"] else ""

    p = demo["preset"]
    view["calc"]["gap"] = fmt(p["rows"][0]["value"] - p["last"]["value"], lang)
    view["quick"] = [{"v": v, "label": fmt(v, lang)} for v in (500, 1000, 2500, 5000)]
