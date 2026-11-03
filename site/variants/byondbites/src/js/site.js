/* NetRate × Byondbites
   Theme: "auto" follows the section in the middle of the screen with one calm crossfade of the page colours
   (registered CSS properties with a transition; nothing moves); a chosen theme is kept in localStorage and every
   app still switches to it. Also: the hero funnel, the currency deck, the app screens chosen by pills, the
   calculator (calc.js), the honesty cases, the FAQ, the mobile menu, placeholder toasts and gentle reveals. */
(function () {
  'use strict';

  var root = document.documentElement;
  var DATA = JSON.parse(document.getElementById('nr-data').textContent);
  var KEY = 'netrate-site-theme';
  var rtl = root.getAttribute('dir') === 'rtl';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function frame(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }

  /* ---------------------------------------------------------------- stills of the app */
  var Phones = {
    list: [],
    init: function () {
      this.list = $$('.phone');
      this.list.forEach(function (ph) { ph.dataset.shown = Phones.key(ph, ph.dataset.scene, ph.dataset.tone); });
    },
    key: function (ph, scene, theme) { return ph.dataset.applang + '/' + theme + '/' + scene; },
    url: function (ph, scene, theme) {
      return DATA.still.replace('{lang}', ph.dataset.applang).replace('{theme}', theme).replace('{scene}', scene);
    },
    /* theme = null: every phone shows its own section's tone */
    show: function (theme, instant) {
      this.list.forEach(function (ph) { Phones.swap(ph, ph.dataset.scene, theme || ph.dataset.tone, instant); });
    },
    swap: function (ph, scene, theme, instant) {
      var key = this.key(ph, scene, theme);
      if (ph.dataset.shown === key) return;
      ph.dataset.shown = key;
      var img = $('.phone__still', ph);
      var src = this.url(ph, scene, theme);
      var top = DATA.tops[key];
      if (instant || reduce.matches) {
        img.src = src;
        if (top) ph.style.setProperty('--top', top);
        return;
      }
      var pre = new Image();
      pre.src = src;
      var go = function () {
        if (ph.dataset.shown !== key) return;                 // a newer choice won
        var next = img.cloneNode();
        next.className = 'phone__still phone__still--next';
        next.removeAttribute('fetchpriority');
        next.setAttribute('aria-hidden', 'true');
        next.alt = '';
        next.loading = 'eager';
        next.src = src;
        img.parentNode.appendChild(next);
        if (top) ph.style.setProperty('--top', top);
        frame(function () { next.classList.add('is-on'); });
        setTimeout(function () {
          img.src = src;
          var drop = function () { next.remove(); };
          (img.decode ? img.decode() : Promise.resolve()).then(drop, drop);
        }, 480);
      };
      (pre.decode ? pre.decode() : Promise.resolve()).then(go, go);
    }
  };

  /* ---------------------------------------------------------------- theme */
  var Theme = {
    mode: root.getAttribute('data-theme-mode') === 'lock' ? root.getAttribute('data-theme') : 'auto',
    tone: 'dusk',
    set: function (t) {
      if (root.getAttribute('data-theme') === t) return;
      root.setAttribute('data-theme', t);
      var meta = $('meta[name="theme-color"]');
      if (meta && DATA.themeColor[t]) meta.setAttribute('content', DATA.themeColor[t]);
    },
    pick: function (mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      try { if (mode === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
      root.setAttribute('data-theme-mode', mode === 'auto' ? 'auto' : 'lock');
      this.set(mode === 'auto' ? this.tone : mode);
      Phones.show(mode === 'auto' ? null : mode);
      Picker.sync();
    },
    follow: function (tone) {
      this.tone = tone;
      if (this.mode === 'auto') this.set(tone);
    }
  };

  var Picker = {
    groups: [],
    init: function () {
      this.groups = $$('.themes');
      this.groups.forEach(function (g) {
        var btns = $$('[data-theme-pick]', g);
        btns.forEach(function (b) {
          b.addEventListener('click', function () { Theme.pick(b.getAttribute('data-theme-pick')); });
        });
        g.addEventListener('keydown', function (e) {
          var k = e.key, d = 0;
          if (k === 'ArrowDown' || k === (rtl ? 'ArrowLeft' : 'ArrowRight')) d = 1;
          if (k === 'ArrowUp' || k === (rtl ? 'ArrowRight' : 'ArrowLeft')) d = -1;
          if (!d) return;
          e.preventDefault();
          var i = btns.indexOf(document.activeElement);
          var b = btns[(i + d + btns.length) % btns.length];
          b.focus();
          Theme.pick(b.getAttribute('data-theme-pick'));
        });
      });
      this.sync();
    },
    sync: function () {
      this.groups.forEach(function (g) {
        var btns = $$('[data-theme-pick]', g), at = 0;
        btns.forEach(function (b, i) {
          var on = b.getAttribute('data-theme-pick') === Theme.mode;
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
          if (on) at = i;
        });
        var thumb = $('.themes__thumb', g);
        if (thumb && btns[0] && btns[0].offsetWidth) {
          thumb.style.transform = 'translateX(' + (rtl ? -1 : 1) * at * btns[0].offsetWidth + 'px)';
        }
      });
    }
  };

  /* the section in the middle of the screen sets the tone (auto) and the current nav link */
  function sections() {
    var secs = $$('[data-tone]');
    var links = $$('.nav a');
    var current = null, timer = 0, held = false, release = 0, first = true;

    function apply() {
      if (!current || held) return;
      if (first) {                                            // arriving mid-page: no fade on the first call
        first = false;
        root.classList.add('no-fade');
        Theme.follow(current.getAttribute('data-tone'));
        frame(function () { root.classList.remove('no-fade'); });
      } else {
        Theme.follow(current.getAttribute('data-tone'));
      }
      var owner = current.id ? current : current.parentElement && current.parentElement.closest('[id]');
      var id = owner ? owner.id : '';
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    if (!hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) current = en.target; });
      clearTimeout(timer);
      timer = setTimeout(apply, first ? 0 : 140);
    }, { rootMargin: '-50% 0px -49% 0px' });
    secs.forEach(function (s) { io.observe(s); });

    /* a jump through the page (menu, anchors) changes the tone once, where it lands */
    var end = function () { held = false; clearTimeout(release); apply(); };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('aria-disabled') === 'true' || a.getAttribute('href') === '#') return;
      held = true;
      clearTimeout(release);
      release = setTimeout(end, 1500);
    });
    if ('onscrollend' in window) window.addEventListener('scrollend', function () { if (held) end(); });
  }

  /* ---------------------------------------------------------------- page parts */
  function faq() {
    $$('.qa').forEach(function (qa, i) {
      var b = $('.qa__q', qa);
      var set = function (open) { qa.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); };
      b.addEventListener('click', function () { set(!qa.classList.contains('is-open')); });
      if (i === 0) set(true);
    });
  }

  function menu() {
    var burger = $('.burger'), m = $('#menu');
    if (!burger || !m) return;
    function open(on) {
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      burger.setAttribute('aria-label', on ? burger.dataset.close : burger.dataset.open);
      document.body.classList.toggle('menu-open', on);
      if (on) {
        m.hidden = false;
        Picker.sync();
        frame(function () { m.classList.add('is-open'); });
      } else {
        m.classList.remove('is-open');
        setTimeout(function () { if (!m.classList.contains('is-open')) m.hidden = true; }, 300);
      }
    }
    burger.addEventListener('click', function () { open(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', m).forEach(function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('aria-disabled') !== 'true') open(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { open(false); burger.focus(); }
    });
    var wide = window.matchMedia('(min-width: 1101px)');
    var onWide = function (e) { if (e.matches) open(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  var heroGeo = { solidAt: 400 };
  function header() {
    var bar = $('#bar');
    var on = function () { bar.classList.toggle('is-solid', window.scrollY > heroGeo.solidAt); };
    window.addEventListener('scroll', on, { passive: true });
    header.update = on;
    on();
  }

  /* the hero panel narrows into a funnel that holds the phones (drawn as a rounded path over the panel's box) */
  function heroShape() {
    var hero = $('.hero'), bg = $('.hero__bg'), cards = $('.hero__cards'), phones = $('.hero__phones');
    if (!hero || !bg) return;
    function f(v) { return Math.round(v * 10) / 10; }
    function rounded(pts) {
      var n = pts.length, d = '';
      for (var k = 0; k < n; k++) {
        var p = pts[k], a = pts[(k - 1 + n) % n], b = pts[(k + 1) % n];
        var da = Math.hypot(a.x - p.x, a.y - p.y), db = Math.hypot(b.x - p.x, b.y - p.y);
        var ra = Math.min(p.r, da / 2), rb = Math.min(p.r, db / 2);
        var p1 = { x: p.x + (a.x - p.x) * ra / da, y: p.y + (a.y - p.y) * ra / da };
        var p2 = { x: p.x + (b.x - p.x) * rb / db, y: p.y + (b.y - p.y) * rb / db };
        d += (k ? 'L' : 'M') + f(p1.x) + ' ' + f(p1.y) + 'Q' + f(p.x) + ' ' + f(p.y) + ' ' + f(p2.x) + ' ' + f(p2.y);
      }
      return d + 'Z';
    }
    function draw() {
      var W = hero.clientWidth, H = hero.clientHeight, top = hero.getBoundingClientRect().top;
      var vw = window.innerWidth / 100;
      var ix = clamp(4.2 * vw, 12, 60), iy = clamp(2.1 * vw, 10, 30), pts;
      if (window.innerWidth > 1080) {
        var h1 = cards.getBoundingClientRect().bottom - top + 72, fb = H - 28;
        var fw = Math.min(W - 2 * ix, 1320), th = fw * 0.303, bh = fw * 0.12, cx = W / 2;
        pts = [{ x: ix, y: iy, r: 30 }, { x: W - ix, y: iy, r: 30 }, { x: W - ix, y: h1, r: 30 }, { x: cx + th, y: h1, r: 48 },
          { x: cx + bh, y: fb, r: 34 }, { x: cx - bh, y: fb, r: 34 }, { x: cx - th, y: h1, r: 48 }, { x: ix, y: h1, r: 30 }];
        heroGeo.solidAt = h1 - 90;
      } else {
        var end = phones.getBoundingClientRect().bottom - top + 8;
        pts = [{ x: ix, y: iy, r: 24 }, { x: W - ix, y: iy, r: 24 }, { x: W - ix, y: end, r: 24 }, { x: ix, y: end, r: 24 }];
        heroGeo.solidAt = end - 80;
      }
      bg.style.clipPath = 'path("' + rounded(pts) + '")';
      if (header.update) header.update();
    }
    draw();
    if ('ResizeObserver' in window) new ResizeObserver(function () { requestAnimationFrame(draw); }).observe(hero);
    else window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }

  /* the deck of currency cards: the card nearest the middle is full size, the others a little smaller */
  function deck() {
    var track = $('.deck__track');
    if (!track) return;
    var cards = $$('.rcard', track), prev = $('.deck__nav--prev'), next = $('.deck__nav--next'), chips = $$('.chip');
    var sgn = rtl ? -1 : 1, raf = 0;
    function shown() { return cards.filter(function (c) { return !c.hidden; }); }
    function gap() { return parseFloat(getComputedStyle(track).columnGap) || 0; }
    function update() {
      raf = 0;
      var r = track.getBoundingClientRect(), mid = r.left + r.width / 2;
      shown().forEach(function (c) {
        var b = c.getBoundingClientRect(), w = c.offsetWidth + gap();
        var d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / w);
        c.style.setProperty('--s', reduce.matches ? 1 : (1 - 0.14 * d).toFixed(3));   /* side cards at 86 %: their buttons stay >= 44 px */
      });
      var max = track.scrollWidth - track.clientWidth, pos = Math.abs(track.scrollLeft);
      if (prev) prev.disabled = pos < 4;
      if (next) next.disabled = pos > max - 4;
    }
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    [prev, next].forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () {
        var c = shown()[0];
        track.scrollBy({ left: sgn * Number(b.dataset.dir) * (c.offsetWidth + gap()), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    });
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'); });
        var kind = ch.dataset.kind;
        cards.forEach(function (c) { c.hidden = kind !== 'all' && c.dataset.kind !== kind; });
        track.scrollTo({ left: 0 });
        update();
      });
    });
    /* drag with a mouse (touch and trackpads scroll natively) */
    var drag = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId };
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; track.style.scrollSnapType = 'none'; track.setPointerCapture(drag.id); }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    function up() {
      if (!drag) return;
      var moved = drag.moved;
      drag = null;
      if (!moved) return;
      var w = shown()[0].offsetWidth + gap(), target = Math.round(Math.abs(track.scrollLeft) / w) * w;
      track.style.scrollSnapType = '';
      track.scrollTo({ left: sgn * target, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    update();
  }

  /* know your rate: three screens of the app, chosen with the pills */
  function know() {
    var pills = $$('.pill'), words = $$('.know__word'), ph = $('.know__phone');
    if (!pills.length || !ph) return;
    function choose(p) {
      pills.forEach(function (x) { x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); });
      words.forEach(function (w) { w.classList.toggle('is-on', w.dataset.key === p.dataset.key); });
      ph.dataset.scene = p.dataset.scene;
      Phones.swap(ph, p.dataset.scene, Theme.mode === 'auto' ? ph.dataset.tone : Theme.mode);
    }
    pills.forEach(function (p) { p.addEventListener('click', function () { choose(p); }); });
    choose(pills[0]);
  }

  /* the calculator: the app's ordering rule (calc.js) over the app's demo offices */
  function calculator() {
    var form = $('#calc-form');
    if (!form || !window.NetRateCalc || !DATA.demo) return;
    var C = window.NetRateCalc(DATA.demo), T = DATA.calc, L = DATA.lang;
    var amountEl = $('#calc-amount'), curEl = $('#calc-cur'), head = $('#calc-head'), list = $('#calc-rows');
    var more = $('#calc-more'), note = $('#calc-metal-note'), typeInputs = $$('#calc-types input');
    var FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
    function local(s) { return L === 'fa' ? String(s).replace(/\d/g, function (d) { return FA[d]; }) : String(s); }
    function fmt(n, dec) {
      var s = n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return L === 'fa' ? local(s.replace(/\./g, '٫')) : s;
    }
    function parse(v) {
      var s = String(v).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); });
      s = s.replace(/[,،٬\s]/g, '').replace(/٫/g, '.');
      var n = parseFloat(s);
      return isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0;
    }
    function rel(m) {
      var r = DATA.demo.rel[L];
      if (m < 1) return r.now;
      if (m < 60) return r.mins.replace('{n}', local(m));
      return r.hours.replace('{n}', local(Math.floor(m / 60)));
    }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function clock() {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
      var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-clock');
      s.appendChild(u);
      return s;
    }
    function render() {
      var s = { cur: curEl.value, dir: form.elements.dir.value, type: form.elements.type.value, amount: parse(amountEl.value) };
      var c = C.cur(s), metal = !!c.metal;
      $$('[data-metal-label]', form).forEach(function (x) { x.textContent = metal ? x.dataset.metalLabel : x.dataset.curText; });
      typeInputs.forEach(function (i) { i.disabled = metal; });
      if (note) note.hidden = !metal;
      var rows = C.ranked(s), one = c.unit[L], many = c.units[L];
      var a = s.amount, dec = metal ? 2 : 0;
      head.textContent = a ? (C.higher(s) ? T.headGet : T.headPay).replace('{a}', fmt(a, a % 1 ? 2 : 0)).replace('{u}', a === 1 ? one : many) : T.headRate;
      var unit = a ? (metal ? T.pound : T.toman) : (metal ? T.perGram : T.perUnit.replace('{u}', one));
      list.textContent = '';
      rows.slice(0, 3).forEach(function (r, i) {
        var li = el('li', 'crow');
        li.appendChild(el('span', 'crow__n num', local(i + 1)));
        var who = el('span', 'crow__who'); who.appendChild(el('b', null, r.ex.name[L])); who.appendChild(el('small', null, r.ex.city[L])); li.appendChild(who);
        var val = el('span', 'crow__val'); val.appendChild(el('b', 'num', fmt(r.value, dec))); val.appendChild(el('small', null, unit)); li.appendChild(val);
        var meta = el('span', 'crow__meta');
        var fee = metal || !a ? '' : (r.fee ? T.fee.replace('{v}', fmt(r.fee, r.fee % 1 ? 2 : 0) + ' ' + (r.fee === 1 ? one : many)) : T.feeNone);
        meta.appendChild(el('span', null, fee));
        var age = el('span', 'crow__age'); age.appendChild(clock()); var b = el('bdi', null, rel(r.ex.mins)); age.appendChild(b); meta.appendChild(age);
        li.appendChild(meta);
        list.appendChild(li);
      });
      var rest = rows.length - 3;
      more.textContent = rest > 0 ? T.more.replace('{n}', local(rest)) : '';
    }
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('[data-calc-cur]').forEach(function (a) {
      a.addEventListener('click', function () { curEl.value = a.dataset.calcCur; render(); });
    });
    render();
  }

  /* honesty: three cases, each lighting up its screen among the tiles */
  function story() {
    var chs = $$('.story__ch'), dots = $$('.story__dots i'), tiles = $$('.tile[data-scene]'), at = 0;
    if (!chs.length) return;
    function show(k) {
      at = (k + chs.length) % chs.length;
      chs.forEach(function (c, j) { c.classList.toggle('is-on', j === at); });
      dots.forEach(function (d, j) { d.classList.toggle('is-on', j === at); });
      tiles.forEach(function (t) { t.classList.toggle('is-on', t.dataset.scene === chs[at].dataset.scene); });
    }
    $$('.story__nav .rnav').forEach(function (b) { b.addEventListener('click', function () { show(at + Number(b.dataset.dir)); }); });
    show(0);
  }

  /* the hero's theme card: dusk, then white, then black */
  function themeNext() {
    $$('[data-theme-next]').forEach(function (b) {
      b.addEventListener('click', function () {
        var order = ['dusk', 'light', 'dark'];
        Theme.pick(order[(order.indexOf(root.getAttribute('data-theme')) + 1) % order.length]);
      });
    });
  }

  /* placeholders: store buttons, legal pages and the offices' contact are not live yet */
  function placeholders() {
    $$('[aria-disabled="true"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.createElement('span');
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.textContent = a.getAttribute('data-toast') || DATA.text.soon;
        document.body.appendChild(t);
        var r = a.getBoundingClientRect();
        t.style.left = clamp(r.left + r.width / 2 - t.offsetWidth / 2, 8, window.innerWidth - t.offsetWidth - 8) + 'px';
        t.style.top = Math.max(8, r.top - t.offsetHeight - 10) + 'px';
        if (t.animate && !reduce.matches) {
          t.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        }
        setTimeout(function () {
          if (t.animate && !reduce.matches) t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = function () { t.remove(); };
          else t.remove();
        }, 1500);
      });
    });
  }

  function reveals() {
    if (!hasIO || reduce.matches) return;
    var els = $$('[data-rise]');
    els.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-rise'); });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
    });
    root.classList.add('rise-ready');
    var first = true;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (first && en.boundingClientRect.top < window.innerHeight) return;   // on screen at load: stays still
        en.target.classList.add('is-in');                                        // just below the fold: rises in
      });
      first = false;
    }, { rootMargin: '0px 0px 12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- start */
  Phones.init();
  if (Theme.mode !== 'auto') Phones.show(Theme.mode, true);
  Picker.init();
  header();
  heroShape();
  reveals();
  sections();
  deck();
  know();
  calculator();
  story();
  themeNext();
  faq();
  menu();
  placeholders();
  window.addEventListener('resize', function () { Picker.sync(); });

  /* for QA */
  window.__nrState = function () {
    return { mode: Theme.mode, tone: Theme.tone, theme: root.getAttribute('data-theme'),
      phones: Phones.list.map(function (p) { return p.dataset.shown; }) };
  };
})();
