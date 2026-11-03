/* NetRate × FitRaho
   Theme: "auto" follows the section in the middle of the screen with one calm crossfade of the page colours
   (the colours are registered CSS properties with a transition; nothing moves); a chosen theme is kept in
   localStorage and every app still switches to it. Also: still swaps, the honesty cases, the trust slider,
   the FAQ, the mobile menu, placeholder toasts and gentle reveals. No libraries. */
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
  function cases() {
    var btns = $$('.case');
    var ph = $('.honest__phone');
    if (!btns.length || !ph) return;
    function choose(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      ph.dataset.scene = b.dataset.scene;
      Phones.swap(ph, b.dataset.scene, Theme.mode === 'auto' ? ph.dataset.tone : Theme.mode);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { choose(b); }); });
    btns[0].setAttribute('aria-pressed', 'true');
  }

  function slider() {
    var track = $('.trust__track');
    if (!track) return;
    var prev = $('.rnav[data-dir="-1"]'), next = $('.rnav[data-dir="1"]');
    var sgn = rtl ? -1 : 1;
    function gap() { return parseFloat(getComputedStyle(track).columnGap) || 0; }
    function card() { return track.children[0].offsetWidth + gap(); }
    function pos() { return Math.abs(track.scrollLeft); }
    function max() { return track.scrollWidth - track.clientWidth; }
    function state() {
      prev.disabled = pos() < 4;
      next.disabled = pos() > max() - 4;
    }
    function page() { return card() * Math.max(1, Math.floor((track.clientWidth + gap()) / card())); }
    [prev, next].forEach(function (b) {
      b.addEventListener('click', function () {
        track.scrollBy({ left: sgn * Number(b.dataset.dir) * page(), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', function () { requestAnimationFrame(state); }, { passive: true });
    window.addEventListener('resize', state);
    state();

    /* drag with a mouse (touch and trackpads scroll natively) */
    var drag = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId };
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        track.classList.add('is-drag');
        track.setPointerCapture(drag.id);
      }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    function up() {
      if (!drag) return;
      var moved = drag.moved;
      drag = null;
      if (!moved) return;
      var w = card(), target = clamp(Math.round(pos() / w) * w, 0, max());
      track.classList.remove('is-drag');
      track.scrollTo({ left: sgn * target, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    track.addEventListener('click', function (e) { if (track.classList.contains('is-drag')) e.preventDefault(); }, true);
  }

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
    var wide = window.matchMedia('(min-width: 1041px)');
    var onWide = function (e) { if (e.matches) open(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  function header() {
    var bar = $('#bar');
    var on = function () { bar.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', on, { passive: true });
    on();
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
  reveals();
  sections();
  cases();
  slider();
  faq();
  menu();
  header();
  placeholders();
  window.addEventListener('resize', function () { Picker.sync(); });

  /* for QA */
  window.__nrState = function () {
    return { mode: Theme.mode, tone: Theme.tone, theme: root.getAttribute('data-theme'),
      phones: Phones.list.map(function (p) { return p.dataset.shown; }) };
  };
})();
