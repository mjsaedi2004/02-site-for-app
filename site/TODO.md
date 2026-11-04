# نت‌ریت — کارهایی که بعداً باید کامل شوند

<div dir="rtl">

این فهرست همان «یادداشت کارهای بعدی» است. هر مورد جای خالی‌اش در سایت آماده است؛ فقط باید اطلاعات واقعی برسد.
تنظیم‌ها در `site/src/config.json` و متن‌ها در `site/src/i18n/fa.json` و `en.json` هستند. بعد از هر تغییر:
`python3 -I site/tools/build.py`

## در انتظار اطلاعات از محمد

- [ ] **صفحه‌های حقوقی** (قوانین، حریم خصوصی، سلب مسئولیت، کوکی‌ها، حذف حساب) — متن‌ها بعداً نوشته می‌شوند.
  نشانی‌ها از خود اپ آمده‌اند (`legalSlugs` در config): فارسی `/ghavanin/`، `/harim-khosousi/`، `/salb-masouliat/`، `/cookie/`، `/hazf-hesab/`
  و انگلیسی `/en/terms/`، `/en/privacy/`، `/en/disclaimer/`، `/en/cookies/`، `/en/delete-account/`.
  وقتی آماده شدند: صفحه‌ها ساخته شوند و `legalReady` در config روی `true` برود (لینک‌های فوتر خودکار فعال می‌شوند).
- [ ] **لینک فروشگاه‌ها**: App Store، Google Play و دانلود مستقیم از خود سایت — در config بخش `stores`
  (`appStore`، `googlePlay`، `direct`) و بعد `comingSoon: false`. تا آن موقع همه‌جا «به‌زودی» نوشته شده.
- [ ] **راه تماس صرافی‌ها** (ایمیل یا فرم) برای دکمهٔ «تماس با ما» در بخش صرافی‌ها — config: `officesContact`.
  فعلاً دکمه فقط می‌گوید «راه تماس به‌زودی اعلام می‌شود».
- [ ] **طرح ویجت** صفحهٔ خانه و صفحهٔ قفل — بخش `#widget` فعلاً فقط توضیح و جای خالی دارد (طبق بریف چیزی کشیده نشده).
- [ ] **دامنه و سرور**: `siteUrl` در config فعلاً `https://netrate.app` است (همان نشانی‌ای که داخل اپ آمده).
  canonical، hreflang، sitemap، تصویر پیش‌نمایش لینک و JSON-LD همه از همین ساخته می‌شوند.
- [ ] **شعار و تیتر نهایی** — تیتر فعلی همان تیتر خود اپ است. گزینه‌های پیشنهادی:
  «نرخی که واقعاً می‌گیری»، «هر نرخ، با ساعتش»، «نرخ‌ها، کنار هم»، «بیشترین تومان، در یک نگاه».
- [ ] **قیمت اشتراک / جایگاه ویژه** — طبق بریف هیچ قیمتی در سایت نیست؛ اگر بعداً قرار شد نشان داده شود، تصمیمش با محمد.
- [ ] **بازارهای بعدی** — فعلاً فقط «بازارهای بیشتر به‌زودی» (اسم هیچ کشوری برده نشده).
- [ ] **اطلاعات شرکت** برای فوتر و `Organization` در JSON-LD (اگر قرار است اسم حقوقی یا نشانی بیاید). اسم کارفرما جایی نیامده.
- [ ] **تصاویر بخش صرافی‌ها** (پنل وب، کارت نرخ) — فعلاً صفحهٔ صرافی داخل خود اپ نشان داده می‌شود.

## نسخه‌های سایت

- **نسخهٔ متحرک (v1)** — `site/src`، همان‌طور که بود نگه داشته شده: https://claude.ai/artifact/5qGX81EFhmZsxMd6h8wqgB
- **نت‌ریت با قالب FitRaho** — `site/variants/fitraho`: https://claude.ai/artifact/Lu3ihedfAPNkN9XeRfhibk
- **نت‌ریت با قالب Byondbites** — `site/variants/byondbites`: https://claude.ai/artifact/B8eCE8P2kkquENQFWB4yGf
- **نت‌ریت Aurora (جهت فعلی)** — `site/variants/aurora`: https://claude.ai/artifact/X9ARuLEUaqmwv54cGbhBqt
  (سیاه پیش‌فرض و سفید با دکمه، گرادیان نئونی، هدر کپسولی؛ پلن: `site/variants/aurora/PLAN.md`)

تنظیم‌ها (`site/src/config.json`: لینک فروشگاه‌ها، راه تماس صرافی‌ها، دامنه، `legalReady`) برای هر سه مشترک است؛
متن‌های هر نسخه در پوشهٔ `i18n` خودش است. ساخت نسخه‌ها:
`python3 -I site/tools/build_variant.py fitraho`، `byondbites` و `aurora`،
و برای نسخهٔ آنلاین `python3 -I site/tools/build_artifact.py fitraho` (یا `byondbites` یا `aurora`).
Aurora تصویر پیش‌نمایش لینک خودش را دارد (تیره و نئونی): `node site/tools/og_aurora.js` → `site/variants/aurora/og/`.

## وقتی نسخهٔ تازهٔ اپ رسید

1. فایل را جای `site/app/netrate-demo.html` بگذار.
2. `python3 -I site/tools/sync_from_app.py` — رنگ‌ها، فونت‌ها، آیکون‌ها و نشان از اپ دوباره خوانده می‌شوند.
3. `node site/tools/posters.js` — عکس‌های ثابت هر صحنه (برای قبل از بارگذاری و حالت بدون حرکت).
4. `node site/tools/brand_assets.js` — آیکون‌ها و تصویر پیش‌نمایش لینک.
5. `python3 -I site/tools/build.py` و برای نسخهٔ آنلاین `python3 -I site/tools/build_artifact.py`.
6. `node site/tools/demo_data.js` — دادهٔ نمونهٔ کارت‌ها و ماشین‌حساب نسخه‌های Byondbites و Aurora از موتور خود اپ
   (و چک ماشین‌حساب با موتور)؛ بعد `node site/tools/og_aurora.js` و هر سه نسخه را با `build_variant.py` دوباره بساز.

## نکته‌هایی برای خود اپ (اپ جعبهٔ سیاه است؛ فقط گزارش)

- رنگ تأکید تم شفق (`#C4380F`) روی پس‌زمینهٔ شفق (`#E7E1DC`) برای متن ریز کنتراست ۴٫۱ دارد (حد AA ۴٫۵ است).
  سایت برای متن‌های ریزش کمی تیره‌ترش کرده؛ شاید در خود اپ هم ارزش بررسی داشته باشد.
- اپ هنگام گرم‌کردن صفحه‌های مخفی در کنسول Chrome پیام سطح verbose می‌دهد
  («Rendering was performed in a subtree hidden by content-visibility») — خطا نیست.

## بعد از انتشار روی دامنهٔ واقعی

- [ ] پیش‌نمایش لینک در واتس‌اپ و تلگرام بررسی شود (`og-fa.jpg` و `og-en.jpg`، زیر ۳۰۰ کیلوبایت).
- [ ] ثبت در Google Search Console با sitemap.
- [ ] اگر آمار بازدید لازم شد، فقط ابزار بدون کوکی (طبق بریف: بدون کوکی و ردیاب شخص ثالث).

</div>
