#!/usr/bin/env python3
"""Build artifact-ready copies of each design into dist/<design>/.

The repo versions work fully offline (vendored libraries, self-hosted fonts).
claude.ai artifacts load scripts only from approved CDNs or the page's own files,
so the build swaps:
  * ../../vendor/gsap|lenis  ->  identical files on cdn.jsdelivr.net
  * self-hosted Google fonts ->  fonts.googleapis.com stylesheet
  * FitRaho Display (modified Orbitron) -> inlined as a data: URI
Usage:  python3 tools/build_artifacts.py
"""
import base64, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
GSAP = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/"
LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"
TITLES = {"01-byondbites": "Arzino Design 01", "02-fitraho": "Arzino Design 02"}
# artifact pages run under phone system bars: keep fixed bars clear of the safe areas
SAFE_CSS = """
/* ---- artifact build: safe-area offsets for fixed bars ---- */
.header { top: env(safe-area-inset-top, 0px); }
.draft-badge { margin-bottom: env(safe-area-inset-bottom, 0px); }
"""
GOOGLE = {
    "01-byondbites": "https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Montserrat:ital,wght@0,300..800;1,300..800&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap",
    "02-fitraho": "https://fonts.googleapis.com/css2?family=Inter:wght@400..800&display=swap",
}

def build(name):
    src, out = ROOT / "designs" / name, DIST / name
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src, out, ignore=shutil.ignore_patterns("fonts"))
    html = (out / "index.html").read_text()
    html = re.sub(r'\.\./\.\./vendor/gsap/([\w]+\.min\.js)', lambda m: GSAP + m.group(1), html)
    html = html.replace("../../vendor/lenis/lenis.min.js", LENIS)
    html = re.sub(r'\s*<link rel="preload" href="assets/fonts/[^"]+"[^>]*>', "", html)
    fonts = (f'  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
             f'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
             f'  <link rel="stylesheet" href="{GOOGLE[name]}">\n')
    html = html.replace('  <link rel="stylesheet" href="assets/css/style.css">', fonts + '  <link rel="stylesheet" href="assets/css/style.css">')
    assert "../../" not in html, f"{name}: unresolved relative path"
    html = to_fragment(html, TITLES[name])
    (out / "index.html").write_text(html)

    css_path = out / "assets/css/style.css"
    css = css_path.read_text()
    def face(m):
        rule = m.group(0)
        if "fitraho-display" in rule:
            data = base64.b64encode((src / "assets/fonts/fitraho-display-wght.woff2").read_bytes()).decode()
            return re.sub(r'url\("\.\./fonts/[^"]+"\)', f'url("data:font/woff2;base64,{data}")', rule)
        return ""  # served by Google Fonts in the artifact
    css = re.sub(r'@font-face\s*\{[^}]*\}\n?', face, css)
    assert "../fonts/" not in css, f"{name}: font path left in CSS"
    css_path.write_text(css + SAFE_CSS)
    files = sorted(p for p in out.rglob("*") if p.is_file())
    print(f"{name}: {len(files)} files, {sum(p.stat().st_size for p in files)/1024:.0f} KB")

def to_fragment(html, title):
    """The artifact host wraps the page in its own <!doctype><html><head><body>,
    so publish the head's links/styles followed by the body content."""
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body_m = re.search(r"<body([^>]*)>(.*)</body>", html, re.S)
    body_cls = re.search(r'class="([^"]*)"', body_m.group(1))
    head = re.sub(r'\s*<meta (charset|name="viewport"|name="description"|name="theme-color")[^>]*>', "", head)
    head = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", head, flags=re.S)
    boot = "<script>document.documentElement.lang='en';"
    if body_cls:
        boot += f"document.body.classList.add({', '.join(repr(c) for c in body_cls.group(1).split())});"
    boot += "</script>"
    return head.strip() + "\n" + boot + "\n" + body_m.group(2).strip() + "\n"

if __name__ == "__main__":
    for d in GOOGLE:
        build(d)
