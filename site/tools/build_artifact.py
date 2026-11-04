#!/usr/bin/env python3
"""Artifact copy of the NetRate site, for previewing on claude.ai: dist/netrate/.

Run after build.py (and from the repo root):

    python3 -I site/tools/build.py
    python3 -I site/tools/build_artifact.py

A design variant (site/variants/<name>, built by build_variant.py) goes to dist/netrate-<name>/:

    python3 -I site/tools/build_artifact.py fitraho

Differences from site/public (the real, deployable site):
  * index.html (Persian) becomes a fragment: the artifact host wraps the page in its own
    doctype/html/head/body, so a boot script restores <html lang, dir, data-theme, class>
    before anything paints.
  * en/index.html stays a full page (supporting pages are served as they are).
  * the site's two Vazirmatn files are inlined as data: URIs; the app copy loads the same
    files from assets/fonts/ instead of its own embedded copies (identical bytes).
  * vendored libraries (a variant's assets/vendor/) load from the identical files on jsDelivr, the CDN the
    artifact host allows, instead of being republished;
  * tags that only matter on the real domain are dropped (canonical, hreflang, Open Graph,
    Twitter, JSON-LD, robots.txt, sitemap.xml) and directory links get an explicit index.html.
"""
import base64
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
VARIANT = sys.argv[1] if len(sys.argv) > 1 else None
PUBLIC = SITE / "variants" / VARIANT / "public" if VARIANT else SITE / "public"
OUT = SITE.parent / "dist" / (f"netrate-{VARIANT}" if VARIANT else "netrate")
GSAP = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/"
LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"
# the artifact's name in the gallery and the browser tab (the real site keeps its SEO title)
NAMES = {"fitraho": "NetRate FitRaho", "byondbites": "NetRate Byondbites", "aurora": "NetRate Aurora"}
FONTS = ("vazirmatn-arabic.woff2", "vazirmatn-latin.woff2")


def data_uri(name):
    return "data:font/woff2;base64," + base64.b64encode((PUBLIC / "assets/fonts" / name).read_bytes()).decode()


def common(html, prefix):
    for name in FONTS:
        html = html.replace(f"url({prefix}assets/fonts/{name})", f"url({data_uri(name)})")
        html = html.replace(f'url("{prefix}assets/fonts/{name}")', f'url("{data_uri(name)}")')
    assert f"{prefix}assets/fonts/" not in html.split("<style>", 1)[1].split("</style>", 1)[0], "font url left in CSS"
    html = re.sub(r'\s*<link rel="preload" href="[^"]*assets/fonts/[^"]*"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="(canonical|alternate)"[^>]*>', "", html)
    html = re.sub(r'\s*<meta (property="og:|name="twitter:)[^>]*>', "", html)
    html = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', "", html, flags=re.S)
    html = re.sub(r'src="(?:\.\./)?assets/vendor/gsap/([\w.]+\.js)"', lambda m: f'src="{GSAP}{m.group(1)}"', html)
    html = re.sub(r'src="(?:\.\./)?assets/vendor/lenis/lenis\.min\.js"', f'src="{LENIS}"', html)
    return html


def fragment(html):
    """The host adds <!doctype><html><head><body>: publish head assets + body, with a boot script first."""
    html_tag = re.search(r"<html([^>]*)>", html).group(1)
    attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', html_tag))
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    head = re.sub(r'\s*<meta (charset|name="viewport"|name="description"|name="theme-color"|name="color-scheme")[^>]*>', "", head)
    sets = "".join(f"d.setAttribute('{k}', '{attrs[k]}');" for k in ("data-theme", "data-theme-mode") if k in attrs)
    boot = ("<script>(function (d) {"
            f"d.lang = '{attrs['lang']}'; d.dir = '{attrs['dir']}';" + sets +
            "d.classList.add('no-js');"
            "})(document.documentElement);</script>")
    return boot + "\n" + head.strip() + "\n" + body.strip() + "\n"


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(PUBLIC, OUT)
    for junk in ("robots.txt", "sitemap.xml", "assets/img/og-fa.jpg", "assets/img/og-en.jpg"):
        (OUT / junk).unlink(missing_ok=True)
    if (OUT / "assets/vendor").exists():                      # served from the CDN in the artifact
        shutil.rmtree(OUT / "assets/vendor")

    fa = common((OUT / "index.html").read_text(encoding="utf-8"), "")
    fa = fa.replace('href="en/"', 'href="en/index.html"')
    if VARIANT in NAMES:
        fa = re.sub(r"<title>.*?</title>", f"<title>{NAMES[VARIANT]}</title>", fa, count=1)
    (OUT / "index.html").write_text(fragment(fa), encoding="utf-8")

    en = common((OUT / "en/index.html").read_text(encoding="utf-8"), "../")
    en = en.replace('href="../"', 'href="../index.html"')
    (OUT / "en/index.html").write_text(en, encoding="utf-8")

    # the app (v1 only): same file, but its two embedded fonts come from the shared font files
    if not (OUT / "app/netrate-demo.html").exists():
        return report()
    app = (OUT / "app/netrate-demo.html").read_text(encoding="utf-8")
    faces = re.findall(r"url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)", app)
    assert len(faces) == 2, "expected the app's two embedded fonts"
    for b64 in faces:
        raw = base64.b64decode(b64)
        name = next(n for n in FONTS if (PUBLIC / "assets/fonts" / n).read_bytes() == raw)
        app = app.replace(f"url(data:font/woff2;base64,{b64})", f"url(../assets/fonts/{name})")
    (OUT / "app/netrate-demo.html").write_text(app, encoding="utf-8")
    report()


def report():
    for p in (OUT / "index.html", OUT / "en/index.html"):
        text = p.read_text(encoding="utf-8")
        assert "netrate.app" not in text.split("<script id=\"nr-data\"", 1)[0], f"{p}: real-domain URL left"
    files = sorted(p for p in OUT.rglob("*") if p.is_file())
    print(f"{OUT.relative_to(SITE.parent)}: {len(files)} files, {sum(p.stat().st_size for p in files) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
