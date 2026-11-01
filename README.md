# سایت معرفی اپ — طرح‌ها

<div dir="rtl">

هر نمونه‌ای که فرستاده می‌شود، به‌صورت یک **سایت کامل و جداگانه** با موشن‌گرافیک و تعاملات حرفه‌ای ساخته می‌شود.
طرح‌ها با هم **قاطی نمی‌شوند**؛ هر کدام پوشهٔ خودش را دارد. در مرحلهٔ بعد بهترین بخش‌ها را با هم ترکیب می‌کنیم.

| # | نام | سبک | مسیر |
|---|---|---|---|
| ۰۱ | Byondbites | اکوسیستم سلامت سبز (دستور پخت + ابزار سلامت) | `designs/01-byondbites/` |
| ۰۲ | FitRaho | فیتنس مشکی/سفید/لیمویی (باشگاه، مربی، ورزشکار) | `designs/02-fitraho/` |

**اجرا:** فایل `index.html` را باز کنید (صفحهٔ معرفی همهٔ طرح‌ها)، یا در همین پوشه:

</div>

```bash
python3 -m http.server 8000
```

<div dir="rtl">

و بعد آدرس `http://localhost:8000` را باز کنید.

جزئیات هر طرح (رنگ‌ها، فونت‌ها، ترتیب بخش‌ها و همهٔ انیمیشن‌ها) در فایل [`DESIGNS.md`](DESIGNS.md) ثبت شده است.

</div>

## Structure

```
index.html                 hub — links to every design
hub/                       hub styles + preview images
designs/01-byondbites/     Design 01 (self-contained: html, css, js, img, fonts)
designs/02-fitraho/        Design 02 (self-contained)
references/                the original reference images, one folder per design
vendor/                    shared libraries only (GSAP 3.15, Lenis 1.3)
DESIGNS.md                 design registry — palettes, type, sections, motion
CLAUDE.md                  working rules for future sessions
```

No build step, no dependencies to install — everything (fonts, images, libraries) is in the repo and works offline.

Photos: [Unsplash](https://unsplash.com/license) (free license). Fonts: SIL OFL (license files next to each font).
