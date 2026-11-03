#!/usr/bin/env python3
"""Build one NetRate design variant (a reference layout upgraded for NetRate) into site/variants/<name>/public/.

    python3 -I site/tools/build_variant.py fitraho
    python3 -I site/tools/build_variant.py byondbites

A variant is self-contained: site/variants/<name>/src/ holds its template (page.html), styles (css/site.css),
script (js/site.js), copy (i18n/fa.json, en.json) and its own photos (img/). Shared with the v1 site are only
NetRate-wide inputs: settings (site/src/config.json), the app's tokens, icons and brand mark (generated from the
app), the Vazirmatn files, the favicons/OG images and the stills of the app (site/assets/img/scenes).

Template syntax (no text lives in the template):
  {{a.b}}            i18n text, escaped          {{{a.b}}}   i18n text as trusted HTML (<b>, <br>)
  {{#each a.list}} … {{/each}}   loops, nestable; inside: {{.}} {{.key}} {{{.key}}} {{@index}} {{@n}} (1-based, localized)
  {{phone:SCENE:TONE:APPLANG:CLASSES}}   a still of the real app in a phone frame. SCENE may be .key (from the loop);
                     TONE is the app theme shown while the page follows the scroll (dusk / light / dark); APPLANG is
                     page, fa or en; CLASSES are extra classes. The script swaps stills when a theme is locked.
  {{icon:NAME}}      an icon from the app's sprite (NAME may be .key); {{icon:NAME:CLASSES}} adds classes
  {{use:APPLANG:a,b}} ships more stills (all themes) that the script shows on demand; renders nothing
  {{stores}} {{legalLinks}} {{officesCta}} and the head values (canonical, css, jsonld …)
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
LANGS = ("fa", "en")
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
THEMES = ("dusk", "light", "dark")
cfg = json.loads((SITE / "src/config.json").read_text(encoding="utf-8"))


def esc(s):
    return html.escape(str(s), quote=True)


def lookup(data, path):
    cur = data
    for part in path.split("."):
        cur = cur[int(part)] if isinstance(cur, list) else cur[part]
    return cur


def num(n, lang):
    return str(n).translate(FA_DIGITS) if lang == "fa" else str(n)


def page_url(lang):
    return cfg["siteUrl"].rstrip("/") + cfg["langs"][lang]["path"]


class Page:
    def __init__(self, t, lang, base, extra):
        self.t, self.lang, self.base, self.extra = t, lang, base, extra
        self.stills = set()

    # ---- values -------------------------------------------------------------
    def value(self, key, scope):
        if key.startswith("."):
            item = scope[-1]["item"] if scope else None
            if key == ".":
                return item
            return lookup(item, key[1:])
        if key == "@index":
            return scope[-1]["index"]
        if key == "@n":
            return num(scope[-1]["index"] + 1, self.lang)
        if key in self.extra:
            return self.extra[key]
        return lookup(self.t, key)

    def still(self, scene, tone, app_lang):
        return f"{self.base}assets/img/scenes/{app_lang}/{tone}/{scene}.webp"

    def phone(self, spec, scope):
        scene, tone, app_lang, classes = (spec.split(":") + ["", "", "", ""])[:4]
        if scene.startswith("."):
            scene = self.value(scene, scope)
        app_lang = self.lang if app_lang in ("", "page") else app_lang
        tone = tone or "dusk"
        for th in THEMES:
            self.stills.add((app_lang, th, scene))
        flags = classes.split()
        load = 'loading="eager" fetchpriority="high"' if "eager" in flags else 'loading="lazy"'
        cls = " ".join(c for c in flags if c not in ("eager", "cap"))
        cap = f'<figcaption class="demo-tag">{esc(self.t["demoTag"])}</figcaption>' if "cap" in flags else ""
        return (f'<figure class="phone {cls}" data-scene="{scene}" data-tone="{tone}" data-applang="{app_lang}" '
                f'style="--top:{top_color(app_lang, tone, scene)}">'
                f'<div class="phone__screen"><img class="phone__still" src="{self.still(scene, tone, app_lang)}" '
                f'alt="{esc(self.t["phoneAlt"])}" width="390" height="844" {load} decoding="async"></div>'
                f'<span class="phone__island" aria-hidden="true"></span>{cap}</figure>')

    # ---- rendering ----------------------------------------------------------
    def render(self, tpl, scope=None):
        scope = scope or []
        out, pos = [], 0
        open_re = re.compile(r"\{\{#each ([\w.@]+)\}\}")
        while True:
            m = open_re.search(tpl, pos)
            if not m:
                out.append(self.render_flat(tpl[pos:], scope))
                break
            out.append(self.render_flat(tpl[pos:m.start()], scope))
            depth, i = 1, m.end()
            while depth:
                nxt_open = open_re.search(tpl, i)
                nxt_close = tpl.find("{{/each}}", i)
                if nxt_close < 0:
                    sys.exit("unclosed {{#each}}")
                if nxt_open and nxt_open.start() < nxt_close:
                    depth, i = depth + 1, nxt_open.end()
                else:
                    depth, i = depth - 1, nxt_close + len("{{/each}}")
            body = tpl[m.end():i - len("{{/each}}")]
            items = self.value(m.group(1), scope)
            for idx, item in enumerate(items):
                out.append(self.render(body, scope + [{"item": item, "index": idx}]))
            pos = i
        return "".join(out)

    def render_flat(self, s, scope):
        s = re.sub(r"\{\{phone:([^}]+)\}\}", lambda m: self.phone(m.group(1), scope), s)
        s = re.sub(r"\{\{use:(\w+):([\w,\-]+)\}\}", lambda m: self.use(m.group(1), m.group(2)), s)
        s = re.sub(r"\{\{icon:([\w.\-]+)(?::([\w\- ]+))?\}\}", lambda m: self.icon(m.group(1), scope, m.group(2)), s)
        s = re.sub(r"\{\{\{([\w.@]+)\}\}\}", lambda m: str(self.value(m.group(1), scope)), s)
        return re.sub(r"\{\{([\w.@]+)\}\}", lambda m: self.text(m.group(1), scope), s)

    def text(self, key, scope):
        v = self.value(key, scope)
        return v if key in self.extra else esc(v)

    def use(self, app_lang, scenes):
        app_lang = self.lang if app_lang == "page" else app_lang
        for scene in scenes.split(","):
            for th in THEMES:
                self.stills.add((app_lang, th, scene))
        return ""

    def icon(self, name, scope, classes=None):
        if name.startswith("."):
            name = self.value(name, scope)
        cls = "ic" + (" " + classes if classes else "")
        return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#{esc(name)}"/></svg>'


_tops = {}


def top_color(app_lang, theme, scene):
    """Colour of a still's top edge: the frame paints its status strip in it, so strip and screen meet seamlessly."""
    key = (app_lang, theme, scene)
    if key not in _tops:
        from PIL import Image
        path = SITE / "assets/img/scenes" / app_lang / theme / f"{scene}.webp"
        if not path.exists():
            sys.exit(f"missing still: {path.relative_to(SITE)} (render it with tools/posters.js)")
        im = Image.open(path).convert("RGB")
        row = [im.getpixel((x, y)) for y in (0, 1, 2) for x in range(0, im.width, 6)]
        _tops[key] = "#" + "".join(f"{sum(c[i] for c in row) // len(row):02X}" for i in range(3))
    return _tops[key]


def store_buttons(t, lang):
    s = cfg["stores"]
    sep = "، " if lang == "fa" else ", "
    out = []
    for key, icon in (("appStore", "i-smartphone"), ("googlePlay", "i-smartphone"), ("direct", "i-download")):
        soon = s["comingSoon"]
        attrs = f'href="{esc(s[key])}"' + (f' aria-disabled="true" data-toast="{esc(t["stores"]["soon"])}" '
                                            f'aria-label="{esc(t["stores"][key])}{sep}{esc(t["stores"]["aria"])}"' if soon else "")
        out.append(f'<a class="store" data-store="{key}" {attrs}><svg class="ic" aria-hidden="true"><use href="#{icon}"/></svg>'
                   f'<span class="store__name">{esc(t["stores"][key])}</span>'
                   + (f'<span class="store__soon">{esc(t["stores"]["soon"])}</span>' if soon else "") + "</a>")
    return "".join(out)


def legal_links(t, lang, base):
    out = []
    for key, slugs in cfg["legalSlugs"].items():
        label = esc(t["footer"]["legal"][key])
        if cfg["legalReady"]:
            out.append(f'<a href="{base}{slugs[lang]}/">{label}</a>')
        else:
            out.append(f'<a href="#" aria-disabled="true" data-toast="{esc(t["footer"]["legalSoon"])}">{label}</a>')
    return "".join(out)


def offices_cta(t, cls):
    href = cfg["officesContact"]
    icon = '<svg class="ic" aria-hidden="true"><use href="#i-mail"/></svg>'
    if href and href != "#":
        return f'<a class="{cls}" href="{esc(href)}">{icon}<span>{esc(t["offices"]["cta"])}</span></a>'
    return (f'<a class="{cls}" href="#" aria-disabled="true" data-toast="{esc(t["offices"]["ctaSoon"])}">'
            f'{icon}<span>{esc(t["offices"]["cta"])}</span></a>')


def jsonld(t, lang):
    site = cfg["siteUrl"].rstrip("/")
    data = [
        {"@context": "https://schema.org", "@type": "Organization", "name": "NetRate", "alternateName": "نت‌ریت",
         "url": site + "/", "logo": site + "/assets/img/logo-512.png"},
        {"@context": "https://schema.org", "@type": "WebSite", "name": t["meta"]["siteName"], "url": page_url(lang),
         "inLanguage": cfg["langs"][lang]["htmlLang"]},
    ]
    if t.get("faq", {}).get("items"):
        data.append({"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": cfg["langs"][lang]["htmlLang"],
                     "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}}
                                    for q in t["faq"]["items"]]})
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def min_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,>])\s*", r"\1", css)
    return css.replace(";}", "}").strip()


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: build_variant.py <name>")
    name = sys.argv[1]
    var = SITE / "variants" / name
    src, out = var / "src", var / "public"
    if out.exists():
        shutil.rmtree(out)
    (out / "assets/img").mkdir(parents=True)
    shutil.copytree(SITE / "assets/fonts", out / "assets/fonts")
    for icon in ("icon.svg", "icon-32.png", "apple-touch-icon.png", "logo-512.png"):
        shutil.copy2(SITE / "assets/img" / icon, out / "assets/img" / icon)
    from PIL import Image
    for og in (SITE / "assets/img").glob("og-*.png"):          # link previews stay under ~300 KB
        Image.open(og).convert("RGB").save(out / "assets/img" / (og.stem + ".jpg"), "JPEG", quality=86, optimize=True, progressive=True)
    if (src / "img").exists():
        shutil.copytree(src / "img", out / "assets/img/variant")
    (out / "assets/js").mkdir()
    js = (src / "js/site.js").read_text(encoding="utf-8")
    (out / "assets/js/site.js").write_text(js, encoding="utf-8")

    css = min_css((SITE / "src/css/tokens.css").read_text(encoding="utf-8") + "\n" + (src / "css/site.css").read_text(encoding="utf-8"))
    sprite = (SITE / "src/partials/sprite.svg").read_text(encoding="utf-8").strip()
    tpl = (src / "page.html").read_text(encoding="utf-8")
    stills = set()

    for lang in LANGS:
        t = json.loads((src / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        other = "en" if lang == "fa" else "fa"
        base = "" if lang == "fa" else "../"
        preloads = "\n".join('<link rel="preload" href="{0}assets/fonts/vazirmatn-{1}.woff2" as="font" type="font/woff2" crossorigin>'
                             .format(base, f) for f in (("arabic", "latin") if lang == "fa" else ("latin",)))
        page_data = {
            "lang": lang, "still": base + "assets/img/scenes/{lang}/{theme}/{scene}.webp",
            "themeColor": {"dusk": "#E7E1DC", "light": "#F3F3F5", "dark": "#000000"},
            "text": t.get("script", {}),
        }
        extra = {
            "base": base, "htmlLang": cfg["langs"][lang]["htmlLang"], "dir": cfg["langs"][lang]["dir"],
            "canonical": page_url(lang), "urlFa": page_url("fa"), "urlEn": page_url("en"),
            "ogImage": cfg["siteUrl"].rstrip("/") + f"/assets/img/og-{lang}.jpg",
            "otherLocale": "en_GB" if lang == "fa" else "fa_IR",
            "otherHref": "en/" if lang == "fa" else "../", "otherHtmlLang": cfg["langs"][other]["htmlLang"],
            "fontPreloads": preloads, "css": css.replace("url(../fonts/", f"url({base}assets/fonts/"),
            "jsonld": jsonld(t, lang), "sprite": sprite, "telegram": esc(cfg["telegram"]),
            "stores": store_buttons(t, lang), "legalLinks": legal_links(t, lang, base),
            "officesCta": offices_cta(t, "btn btn--dark"),
            "pageData": "@@PAGEDATA@@",
        }
        page = Page(t, lang, base, extra)
        html_out = page.render(tpl)
        page_data["tops"] = {f"{l}/{th}/{sc}": top_color(l, th, sc) for l, th, sc in sorted(page.stills)}
        html_out = html_out.replace("@@PAGEDATA@@", json.dumps(page_data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
        left = re.findall(r"\{\{[^}]*\}\}", html_out)
        if left:
            sys.exit(f"{lang}: unresolved template tags: {sorted(set(left))[:8]}")
        stills |= page.stills
        target = out / ("index.html" if lang == "fa" else "en/index.html")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html_out, encoding="utf-8")
        title, desc = t["meta"]["title"], t["meta"]["description"]
        print(f"{name}/{lang}: {len(html_out.encode()) // 1024} KB | title {len(title)} | description {len(desc)}")
        if len(title) > 60 or not 110 <= len(desc) <= 160:
            print(f"  ! {lang}: title must be <= 60 and description 110-160 characters")

    for app_lang, theme, scene in sorted(stills):              # only the stills this variant shows (all three themes)
        rel = Path("assets/img/scenes") / app_lang / theme / f"{scene}.webp"
        if not (SITE / rel).exists():
            sys.exit(f"missing still: {rel} (render it with tools/posters.js)")
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SITE / rel, out / rel)

    site = cfg["siteUrl"].rstrip("/")
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n", encoding="utf-8")
    alts = "".join(f'<xhtml:link rel="alternate" hreflang="{cfg["langs"][l]["hreflang"]}" href="{page_url(l)}"/>' for l in LANGS)
    alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{page_url(cfg["xDefault"])}"/>'
    urls = "".join(f"<url><loc>{page_url(l)}</loc>{alts}</url>" for l in LANGS)
    (out / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                                     f'xmlns:xhtml="http://www.w3.org/1999/xhtml">{urls}</urlset>\n', encoding="utf-8")
    print(f"{name}: css {len(css) // 1024} KB inline, js {len(js) // 1024} KB, {len(stills)} stills")


if __name__ == "__main__":
    main()
