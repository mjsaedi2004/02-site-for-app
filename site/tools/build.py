#!/usr/bin/env python3
"""Build the NetRate landing page into site/public/ (static, no server code).

    python3 -I site/tools/build.py

  public/index.html        Persian (root, RTL)
  public/en/index.html     English (/en/, LTR)
  public/assets/...        css (also inlined), js, fonts, images, posters (.webp)
  public/app/...           the app demo, served from the same origin (iframe control)
  public/robots.txt, sitemap.xml

All copy lives in src/i18n/<lang>.json (key by key). The template src/page.html holds no text.
Posters (.png from tools/posters.js) are converted to .webp here.
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
SRC, OUT = SITE / "src", SITE / "public"
LANGS = ("fa", "en")
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

cfg = json.loads((SRC / "config.json").read_text(encoding="utf-8"))
scenes = json.loads((SRC / "scenes.json").read_text(encoding="utf-8"))
SLOTS = {s["id"]: s for s in scenes["slots"]}


def esc(s):
    return html.escape(str(s), quote=True)


def lookup(data, path):
    cur = data
    for part in path.split("."):
        if isinstance(cur, list):
            cur = cur[int(part)]
        else:
            cur = cur[part]
    return cur


def num(n, lang):
    s = str(n)
    return s.translate(FA_DIGITS) if lang == "fa" else s


def app_lang(slot, lang):
    return slot.get("lang", {}).get(lang, lang)


def poster_url(base, slot, scene, lang):
    al = app_lang(slot, lang)
    if scene == "lang":               # the language demo shows the other language at rest
        al, scene = ("en" if al == "fa" else "fa"), "live"
    return f"{base}assets/img/scenes/{al}/{slot['theme']}/{scene}.webp"


def phone_static(t, base, slot, scene, lang, eager=False, extra=""):
    load = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<figure class="phone phone--static{extra}" data-scene="{scene}">'
            f'<div class="phone__screen"><img src="{poster_url(base, slot, scene, lang)}" alt="{esc(t["phoneAlt"])}" '
            f'width="390" height="844" {load} decoding="async"></div><span class="phone__island"></span>'
            f'<figcaption class="demo-tag">{esc(t["demoTag"])}</figcaption></figure>')


def store_buttons(t, lang):
    s = cfg["stores"]
    items = [("appStore", "i-smartphone"), ("googlePlay", "i-smartphone"), ("direct", "i-download")]
    out = []
    for key, icon in items:
        soon = s["comingSoon"]
        sep = "، " if lang == "fa" else ", "
        attrs = f'href="{esc(s[key])}"' + (f' aria-disabled="true" aria-label="{esc(t["stores"][key])}{sep}{esc(t["stores"]["aria"])}"'
                                            if soon else "")
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
        else:   # pages come later (site/TODO.md); keep the slot without a dead link
            out.append(f'<a href="#" aria-disabled="true" data-todo="legal" data-toast="{esc(t["footer"]["legalSoon"])}">{label}</a>')
    return "".join(out)


def offices_cta(t):
    href = cfg["officesContact"]
    icon = '<svg class="ic" aria-hidden="true"><use href="#i-mail"/></svg>'
    if href and href != "#":
        return f'<a class="btn btn--ink" href="{esc(href)}" data-rise>{icon}{esc(t["offices"]["cta"])}</a>'
    # no contact channel yet (site/TODO.md): a button that says so instead of a dead link
    return (f'<a class="btn btn--ink" href="#" aria-disabled="true" data-toast="{esc(t["offices"]["ctaSoon"])}" data-rise>'
            f'{icon}{esc(t["offices"]["cta"])}</a>')


def chips(items):
    if not items:
        return ""
    return '<ul class="chips">' + "".join(f"<li>{esc(c)}</li>" for c in items) + "</ul>"


def page_url(lang):
    return cfg["siteUrl"].rstrip("/") + cfg["langs"][lang]["path"]


def jsonld(t, lang):
    site = cfg["siteUrl"].rstrip("/")
    data = [
        {"@context": "https://schema.org", "@type": "Organization", "name": "NetRate", "alternateName": "نت‌ریت",
         "url": site + "/", "logo": site + "/assets/img/logo-512.png"},
        {"@context": "https://schema.org", "@type": "WebSite", "name": t["meta"]["siteName"], "url": page_url(lang),
         "inLanguage": cfg["langs"][lang]["htmlLang"]},
        {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": cfg["langs"][lang]["htmlLang"],
         "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}}
                        for q in t["faq"]["items"]]},
    ]
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def min_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,>])\s*", r"\1", css)
    return css.replace(";}", "}").strip()


def render(tpl, t, lang, ctx):
    base = ctx["base"]

    def each(m):
        path, body = m.group(1), m.group(2)
        items = lookup(t, path)
        out = []
        for i, item in enumerate(items):
            b = body
            slot_id = None
            for sid in ("how", "features", "honest"):
                if path.startswith(sid + "."):
                    slot_id = sid
            if slot_id:
                scene = SLOTS[slot_id]["steps"][i]
                b = b.replace("{{step:%s}}" % slot_id, scene)
                b = b.replace("{{phone:%s:step}}" % slot_id,
                              phone_static(t, base, SLOTS[slot_id], scene, lang, extra=" phone--step"))
            b = re.sub(r"\{\{chips:\.(\w+)\}\}", lambda mm: chips(item.get(mm.group(1)) if isinstance(item, dict) else None), b)
            b = b.replace("{{@index}}", str(i)).replace("{{@n}}", num(i + 1, lang))
            if isinstance(item, dict):
                b = re.sub(r"\{\{\.(\w+)\}\}", lambda mm: esc(item[mm.group(1)]), b)
            else:
                b = b.replace("{{.}}", esc(item))
            out.append(b)
        return "".join(out)

    tpl = re.sub(r"\{\{#each ([\w.]+)\}\}(.*?)\{\{/each\}\}", each, tpl, flags=re.S)
    def first_scene(slot):
        return slot.get("scene") or slot["steps"][0]

    tpl = re.sub(r"\{\{phone:(\w+)\}\}",
                 lambda m: phone_static(t, base, SLOTS[m.group(1)], first_scene(SLOTS[m.group(1)]), lang, eager=m.group(1) == "hero",
                                        extra=" phone--dock" if "steps" in SLOTS[m.group(1)] else ""),
                 tpl)
    tpl = re.sub(r"\{\{@(\w+)\}\}", lambda m: esc(cfg[m.group(1)]), tpl)

    def var(m):
        key = m.group(1)
        if key in ctx:
            return ctx[key]
        return esc(lookup(t, key))

    return re.sub(r"\{\{([\w.]+)\}\}", var, tpl)


def build_posters():
    """Convert tools/posters.js output (.png, 2x) to .webp next to it."""
    from PIL import Image
    n = 0
    for png in sorted((SITE / "assets/img/scenes").rglob("*.png")):
        webp = png.with_suffix(".webp")
        if not webp.exists() or webp.stat().st_mtime < png.stat().st_mtime:
            Image.open(png).convert("RGB").save(webp, "WEBP", quality=74, method=6)
            n += 1
    return n


def main():
    converted = build_posters()
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    shutil.copytree(SITE / "assets/fonts", OUT / "assets/fonts")
    shutil.copytree(SITE / "assets/img", OUT / "assets/img", ignore=shutil.ignore_patterns("*.png", ".*"))
    for extra in (SITE / "assets/img").glob("*.png"):          # icons are png on purpose (og-*.png ship as jpg below)
        if not extra.name.startswith("og-"):
            shutil.copy2(extra, OUT / "assets/img" / extra.name)
    from PIL import Image                                       # link previews must stay under ~300 KB (WhatsApp)
    for og in (SITE / "assets/img").glob("og-*.png"):
        Image.open(og).convert("RGB").save(OUT / "assets/img" / (og.stem + ".jpg"), "JPEG", quality=86, optimize=True, progressive=True)
    (OUT / "app").mkdir()
    shutil.copy2(SITE / "app/netrate-demo.html", OUT / "app/netrate-demo.html")
    (OUT / "assets/js").mkdir()
    js = (SRC / "js/bridge.js").read_text(encoding="utf-8") + "\n" + (SRC / "js/site.js").read_text(encoding="utf-8")
    (OUT / "assets/js/site.js").write_text(js, encoding="utf-8")

    css = min_css((SRC / "css/tokens.css").read_text(encoding="utf-8") + "\n" + (SRC / "css/site.css").read_text(encoding="utf-8"))
    sprite = (SRC / "partials/sprite.svg").read_text(encoding="utf-8").strip()
    tpl = (SRC / "page.html").read_text(encoding="utf-8")

    for lang in LANGS:
        t = json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        other = "en" if lang == "fa" else "fa"
        base = "" if lang == "fa" else "../"
        css_lang = css.replace("url(../fonts/", f"url({base}assets/fonts/")
        preloads = ['<link rel="preload" href="{0}assets/fonts/vazirmatn-{1}.woff2" as="font" type="font/woff2" crossorigin>'.format(base, f)
                    for f in (("arabic", "latin") if lang == "fa" else ("latin",))]
        page_data = {
            "lang": lang, "base": base, "app": cfg["app"], "comingSoon": cfg["stores"]["comingSoon"],
            "slots": [{**s, "appLang": app_lang(s, lang)} for s in scenes["slots"]],
            "scenes": scenes["scenes"],
            "poster": base + "assets/img/scenes/{lang}/{theme}/{scene}.webp",
            "themeColor": {"dusk": "#E7E1DC", "light": "#F3F3F5", "dark": "#000000"},
            "text": {"soon": t["stores"]["soon"]},
        }
        ctx = {
            "base": base, "htmlLang": cfg["langs"][lang]["htmlLang"], "dir": cfg["langs"][lang]["dir"],
            "canonical": page_url(lang), "urlFa": page_url("fa"), "urlEn": page_url("en"),
            "ogImage": cfg["siteUrl"].rstrip("/") + f"/assets/img/og-{lang}.jpg",
            "otherLocale": "en_GB" if lang == "fa" else "fa_IR",
            "otherHref": ("en/" if lang == "fa" else "../"), "otherHreflang": cfg["langs"][other]["hreflang"],
            "otherHtmlLang": cfg["langs"][other]["htmlLang"],
            "fontPreloads": "\n".join(preloads), "css": css_lang, "jsonld": jsonld(t, lang), "sprite": sprite,
            "storeButtons": store_buttons(t, lang), "legalLinks": legal_links(t, lang, base), "officesCta": offices_cta(t),
            "pageData": json.dumps(page_data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"),
        }
        out = render(tpl, t, lang, ctx)
        left = re.findall(r"\{\{[^}]*\}\}", out)
        if left:
            sys.exit(f"{lang}: unresolved template tags: {sorted(set(left))[:8]}")
        target = OUT / ("index.html" if lang == "fa" else "en/index.html")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(out, encoding="utf-8")
        title, desc = t["meta"]["title"], t["meta"]["description"]
        print(f"{lang}: {target.relative_to(SITE)} {len(out.encode()) // 1024} KB | title {len(title)} chars | description {len(desc)} chars")
        if len(title) > 60 or not 110 <= len(desc) <= 160:
            print(f"  ! {lang}: title must be <= 60 and description 110-160 characters")

    site = cfg["siteUrl"].rstrip("/")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n", encoding="utf-8")
    alts = "".join(f'<xhtml:link rel="alternate" hreflang="{cfg["langs"][l]["hreflang"]}" href="{page_url(l)}"/>' for l in LANGS)
    alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{page_url(cfg["xDefault"])}"/>'
    urls = "".join(f"<url><loc>{page_url(l)}</loc>{alts}</url>" for l in LANGS)
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                                     f'xmlns:xhtml="http://www.w3.org/1999/xhtml">{urls}</urlset>\n', encoding="utf-8")
    print(f"posters converted: {converted}; css {len(css) // 1024} KB inline; js {len(js) // 1024} KB")


if __name__ == "__main__":
    main()
