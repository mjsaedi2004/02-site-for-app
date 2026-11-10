"""The site's other pages: legal drafts, offices, contact and 404, around the home page's own header and footer.
usage (from the repo root, after tools/build.py):  python3 -I site/studies/01-fintech/tools/pages.py [pre|post] [out_dir]
Defaults: pre, written beside index.html. The header and footer come from the built home of that version (index.html for
pre, live.html for post), so “Coming soon” / “Download” match; in-page links become index.html#… links.
The legal texts are DRAFTS from what the brief and the app say; [placeholders] wait for the client's details and a
lawyer's review before release."""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
release = sys.argv[1] if len(sys.argv) > 1 else 'pre'
out = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE
home = (HERE / ('index.html' if release == 'pre' else 'live.html')).read_text(encoding='utf-8')
# in this folder the after-release pages sit beside the before-release ones as live-*.html (live.html is their home);
# written anywhere else (an export) every version is plain: index.html, terms.html …
PFX = 'live-' if release == 'post' and out == HERE else ''
HOME = 'live.html' if PFX else 'index.html'
SLUGS = 'terms|privacy|disclaimer|cookies|delete-account|offices|contact|404'


def links(html):
    html = re.sub(rf'href="(?:live-)?({SLUGS})\.html', rf'href="{PFX}\1.html', html)
    return re.sub(r'href="(?:index|live)\.html', f'href="{HOME}', html)


def grab(pattern):
    m = re.search(pattern, home, re.S)
    assert m, pattern
    return m.group(0)


def relink(html):
    html = re.sub(r'href="#top"', 'href="index.html"', html)
    return re.sub(r'href="#((?!i-)[\w-]+)"', r'href="index.html#\1"', html)   # not the icons (#i-…)


SPRITE = grab(r'<svg width="0" height="0" style="position:absolute" aria-hidden="true">.*?</svg>')
HEADER = relink(grab(r'<header class="nav wrap">.*?</header>\s*<nav class="msheet".*?</nav>'))
FOOTER = relink(grab(r'<footer class="foot">.*?</footer>'))
BGX = '<div class="bgx" aria-hidden="true"><i class="bgx__glow"></i><i class="bgx__grid"></i><i class="bgx__dots"></i></div>'
DRAFT = ('<p class="draft">Draft for review: a starting text written from how NetRate works. Details in [brackets] and the '
         'whole text will be confirmed with the client and a lawyer before NetRate is released.</p>')
UPDATED = 'Last updated: [date of release]'


def ph(s):
    return re.sub(r'\[([^\]]+)\]', r'<span class="ph">[\1]</span>', s)


def page(slug, title, desc, body, eyebrow='', lead='', draft=False, toc=True):
    secs = re.findall(r'<section id="([\w-]+)"><h2>(.*?)</h2>', body)
    nav = ('<nav class="doc__toc" aria-label="On this page"><b>On this page</b>' + ''.join(f'<a href="#{i}">{h}</a>' for i, h in secs) + '</nav>') if toc and secs else ''
    main = (f'<header class="doc-hero"><p class="eyebrow">{eyebrow}</p><h1>{title}</h1>' + (f'<p>{lead}</p>' if lead else '') + (DRAFT if draft else '') + '</header>'
            f'<div class="doc">{nav}<article class="doc__body"' + ('' if nav else ' style="grid-column: 1 / -1"') + f'>{ph(body)}</article></div>')
    html = f'''<!doctype html>
<html lang="en" data-release="{release}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · NetRate</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="img/netrate-icon-64.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Inter+Tight:wght@300..800&display=swap">
<link rel="stylesheet" href="style.css">
<script defer src="pages.js"></script>
</head>
<body>
{SPRITE}
<div class="page page--doc">
  {BGX}
  {HEADER}
  <main id="top">
{main}
  </main>
  {FOOTER}
</div>
{'<p class="toast" id="toast" role="status" aria-live="polite"></p>' if release == 'post' else ''}
</body>
</html>
'''
    (out / f'{PFX}{slug}.html').write_text(links(html), encoding='utf-8')
    return slug


S = lambda i, h, inner: f'<section id="{i}"><h2>{h}</h2>{inner}</section>'

TERMS = ''.join([
    S('about', 'About NetRate', '<p>NetRate is an app and website that puts side by side the pound-to-toman rates that UK exchange offices post themselves, with the fee and the age of every rate. It is run by [company name], [registered address] (“we”).</p>'),
    S('not-office', 'NetRate is not an exchange office', '<p><strong>NetRate is not an exchange office and never moves money.</strong> We do not buy, sell, hold, send or receive money for anyone, and no deal is made through NetRate.</p>'),
    S('rates', 'Rates and information', '<p>The offices post the rates themselves, for information only; for a firm rate, contact the office before you deal.</p><ul><li>Every rate shows when it was posted. A rate that was not updated today is marked “Expired” for one day, faded, and never counted in the order or the average.</li><li>The order of the list is by the money you get after the fee, for the amount you type. A rank is just a number.</li><li>NetRate does not predict rates and gives no financial advice.</li></ul>'),
    S('dealing', 'Dealing with an office', '<p>When you call, message or visit an office, the deal is directly between you and that office, on its own terms. Check the rate, the fee and the office yourself before you deal; the “Verified” badge, reviews and “Always up to date” are there to help you decide.</p>'),
    S('accounts', 'Your account', '<p>You can see rates, the office list, the chart and search without an account. An account is only needed for rate alerts, saved offices and writing reviews. You can delete your account and its data at any time (see <a href="delete-account.html">Delete account</a>).</p>'),
    S('reviews', 'Reviews', '<p>Every review is checked before it is published. Reviews must be about your own experience with the office, without personal data of others, insults, advertising or anything unlawful. We may refuse or remove reviews that break these rules.</p>'),
    S('badges', 'The Verified badge and the Featured spot', '<p>An office becomes “Verified” in one of two equal ways: two active verified offices vouch for it, or it gives its company number and AML number and our team checks them. The badge cannot be bought and has one level.</p><p>The daily “Featured” spot is limited and bought by offices day by day; it is always clearly labelled “Featured”, its real rank is shown next to it, and it never changes the order of the list.</p>'),
    S('use', 'Fair use', '<p>Do not misuse NetRate: no scraping or copying the rates in bulk, no attempts to break or overload the service, no false reviews and no impersonating an office.</p>'),
    S('liability', 'Availability and liability', '<p>We work to keep NetRate accurate and available, but rates come from the offices and can change at any time. To the extent the law allows, we are not responsible for an office\'s rates, fees, services or conduct, or for losses from decisions made on information shown in NetRate. Nothing here limits rights you have under the law.</p>'),
    S('changes', 'Changes, law and contact', '<p>We may update these terms; the date above shows the latest version. These terms are governed by the law of [England and Wales — to be confirmed]. Questions: [contact email].</p>'),
])
PRIVACY = ''.join([
    S('who', 'Who we are', '<p>NetRate is run by [company name], [registered address], the controller of your personal data. Contact: [privacy contact email].</p>'),
    S('without', 'Without an account', '<p>Seeing rates, the office list, the chart and search needs no account. <strong>We don\'t ask for your location</strong>: you pick your city yourself.</p>'),
    S('collect', 'What we collect with an account', '<ul><li>The details you give when you sign up, for example [an email address or phone number].</li><li>Your rate alerts, saved offices and the reviews you write.</li><li>Basic technical data needed to run the service securely, for example [app version and device type].</li></ul>'),
    S('use', 'How we use it', '<p>Only to run the features you use: sending the alerts you set (each alert tells you at most once a day), keeping your saved offices, publishing your reviews after they are checked, and keeping the service secure. We do not sell your data and we do not use it for advertising.</p>'),
    S('share', 'Who we share it with', '<p>Your reviews are published with [the name you choose]. Otherwise we share data only with the providers that host and run NetRate for us, under contract, and when the law requires it. [List of providers to be added.]</p>'),
    S('keep', 'How long we keep it', '<p>For as long as you have an account. When you delete your account, its data is deleted [within 30 days — to be confirmed], except what the law requires us to keep.</p>'),
    S('rights', 'Your rights', '<p>Under UK data protection law you can ask to see, correct, export or delete your data, and object to or restrict how we use it. Write to [privacy contact email]. You can also complain to the UK data protection authority.</p>'),
    S('site', 'This website', '<p>This website uses no cookies and no trackers. See <a href="cookies.html">Cookies</a> for the few outside requests it makes.</p>'),
])
DISCLAIMER = ''.join([
    S('information', 'Information only', '<p>The offices post the rates themselves, for information only; for a firm rate, contact the office before you deal. NetRate is not an exchange office and never moves money.</p>'),
    S('accuracy', 'Accuracy and age', '<p>Every rate shows how long ago it was posted. Rates can change after they are posted, and an office may give a different rate when you contact it. Expired rates are labelled and left out of the order and the average.</p>'),
    S('advice', 'No advice and no predictions', '<p>NetRate does not predict rates and gives no financial, legal or tax advice. The chart shows past market averages only.</p>'),
    S('offices', 'The offices', '<p>Each office is responsible for its own rates, fees, services and compliance. A “Verified” badge says how the office was checked; it is not a guarantee of its services.</p>'),
    S('demo', 'On this website', '<p>The app screens, numbers, office names and addresses shown on this website are demo data; they are made up to show how NetRate works.</p>'),
])
COOKIES = ''.join([
    S('none', 'No cookies, no trackers', '<p>This website sets <strong>no cookies</strong> and uses <strong>no analytics or advertising trackers</strong>. It remembers nothing about you between visits.</p>'),
    S('requests', 'Outside requests', '<p>To show its fonts and run its animations, the site loads the Inter fonts from Google Fonts and two open-source animation libraries (GSAP and Lenis) from the jsDelivr network. Like any web request, these share your IP address with those providers; they set no cookies from this site. [The released site may host these files itself.]</p>'),
    S('app', 'The app', '<p>How the app handles your data is in the <a href="privacy.html">Privacy</a> page.</p>'),
])
DELETE = ''.join([
    S('how', 'Delete your account', '<p>Whenever you want, your account and its data are deleted. You do not need an account to see rates, so after deleting it you can keep using NetRate without one.</p><ul><li><strong>In the app:</strong> open your account settings and choose “Delete account” [exact menu path to be confirmed].</li><li><strong>Without the app:</strong> write to [contact email] from the address on your account.</li></ul>'),
    S('what', 'What is deleted', '<ul><li>Your account details.</li><li>Your rate alerts and saved offices.</li><li>Your reviews [are removed or shown without your name — to be confirmed].</li></ul><p>Deletion is completed [within 30 days — to be confirmed], except data the law requires us to keep.</p>'),
])
OFFICES = ''.join([
    S('panel', 'Post your rate every day from a simple panel', '<p>The NetRate web panel works well on a phone, and you get a reminder to post your rate. Your rate is shown with the time it was posted, next to the rest.</p><div class="doc__cards"><div><b>Post your rate, with reminders</b><p>Every day from your phone or computer, in seconds.</p></div><div><b>A rate card with your logo</b><p>A polished card from that rate, as an image or text, for your channel and social media.</p></div><div><b>Daily Featured spot</b><p>Limited and bought day by day, always clearly labelled “Featured”; its real rank is shown next to it.</p></div><div><b>Reports and stats</b><p>Weekly and monthly reports and full statistics.</p></div></div>'),
    S('shown', 'How your rate is shown', '<ul><li>Side by side with the other offices, with your fee included in the order for the amount a person types.</li><li>With the time it was posted. A rate not updated today is marked “Expired” for one day and left out of the order and the average.</li><li>No office gets a special frame or colour; a rank is just a number.</li></ul>'),
    S('verified', 'Becoming “Verified”', '<p>In one of two equal ways: two active verified offices vouch for you, or you give your company number and AML number and our team checks them. The badge cannot be bought and has only one level.</p>'),
    S('reviews', 'Reviews', '<p>Every review is checked before it is published, and you can see the reviews of your office on its page.</p>'),
    S('contact', 'Join NetRate', '<p>Contact details for offices are coming soon.</p><p class="doc__cta"><span class="btn btn--ghost" aria-disabled="true" style="background:var(--tint);color:#3A3D48;box-shadow:inset 0 0 0 1px var(--card-line)">Contact details coming soon</span></p>'),
])
CONTACT = ''.join([
    S('people', 'For people using NetRate', '<p>For a rate or a deal, contact the office directly from its page in the app: call, message or get directions. NetRate is not an exchange office and never moves money, so we cannot answer for an office\'s rate.</p><p>For questions about the app or your account: [contact email — coming soon].</p>'),
    S('offices', 'For exchange offices', '<p>See <a href="offices.html">For exchange offices</a>; contact details for offices are coming soon.</p>'),
    S('maker', 'The site', '<p>Designed and developed by M.S — <a href="https://t.me/Mohammad_s203" target="_blank" rel="noopener">Telegram</a>.</p>'),
])

made = [
    page('terms', 'Terms of use', 'The terms for using NetRate: what it is, what it is not, and how rates, accounts, reviews, the Verified badge and the Featured spot work.', TERMS, 'Legal', UPDATED, True),
    page('privacy', 'Privacy', 'What NetRate collects and why: no account is needed to see rates, and we never ask for your location.', PRIVACY, 'Legal', UPDATED, True),
    page('disclaimer', 'Disclaimer', 'NetRate shows rates the offices post themselves, for information only, each with its age; it is not an exchange office.', DISCLAIMER, 'Legal', UPDATED, True),
    page('cookies', 'Cookies', 'This website sets no cookies and uses no trackers; here are the few outside requests it makes.', COOKIES, 'Legal', UPDATED, True),
    page('delete-account', 'Delete account', 'How to delete your NetRate account and its data, whenever you want.', DELETE, 'Your account', UPDATED, True),
    page('offices', 'For exchange offices', 'Post your rate every day from a simple panel: reminders, a rate card with your logo, reports, and a clearly labelled Featured spot.', OFFICES, 'NetRate', 'Your rate, next to the rest, with the time you posted it.'),
    page('contact', 'Contact', 'How to reach NetRate, and how to contact an exchange office about a rate.', CONTACT, 'NetRate', 'NetRate is not an exchange office and never moves money.'),
]
# 404
lost = f'''<!doctype html>
<html lang="en" data-release="{release}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · NetRate</title>
<meta name="robots" content="noindex">
<link rel="icon" href="img/netrate-icon-64.png" type="image/png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Inter+Tight:wght@300..800&display=swap">
<link rel="stylesheet" href="style.css">
<script defer src="pages.js"></script>
</head>
<body>
{SPRITE}
<div class="page page--doc">
  {BGX}
  {HEADER}
  <main id="top" class="lost"><div><b>404</b><h1>This page isn't here</h1><p>The link may be old, or the page has moved.</p><a class="btn" href="index.html">Back to NetRate</a></div></main>
</div>
</body>
</html>
'''
(out / f'{PFX}404.html').write_text(links(lost), encoding='utf-8')
print(release, 'pages:', ', '.join(made + ['404']), '→', out)
