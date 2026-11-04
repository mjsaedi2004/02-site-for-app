/* NetRate Aurora
   Black (default) and white themes switched by the header button (a View Transition revealing the new theme in a
   circle from the button; instant where unsupported or with reduced motion). Lenis smooth scroll + GSAP
   ScrollTrigger for the scroll stories; Flip for the calculator's re-ordering. Everything degrades: without the
   libraries or with reduced motion the page is complete and still. */
(function () {
  'use strict';

  var root = document.documentElement;
  var DATA = JSON.parse(document.getElementById('nr-data').textContent);
  var KEY = 'netrate-aurora-theme';
  var THEME_COLOR = { dark: '#06050A', light: '#FAF9FC' };
  var rtl = root.getAttribute('dir') === 'rtl';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger, FLIP = window.Flip;
  var motion = !reduce && !!(G && ST);
  var lenis = null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function frame(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function local(s) { return DATA.lang === 'fa' ? String(s).replace(/\d/g, function (d) { return FA[d]; }) : String(s); }

  if (G && ST) {
    G.registerPlugin(ST);
    if (FLIP) G.registerPlugin(FLIP);
  }

  /* ------------------------------------------------------------ smooth scroll */
  function smooth() {
    if (!motion || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    root.classList.add('lenis');
  }
  function scrollToHash(hash) {
    var el = hash && hash.length > 1 && document.getElementById(hash.slice(1));
    if (!el) return false;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.3, easing: function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; } });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('aria-disabled') === 'true') return;
    var hash = a.getAttribute('href');
    if (hash === '#') return;
    if (scrollToHash(hash)) e.preventDefault();
  });

  /* ------------------------------------------------------------ theme: black / white */
  var tgl = $('.tgl');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[t]);
    if (tgl) tgl.setAttribute('aria-label', t === 'dark' ? tgl.dataset.toLight : tgl.dataset.toDark);
  }
  function preload(t) {
    /* the stills of the coming theme that are on screen, so the new snapshot already has them */
    var imgs = $$('.shot.is-on .shot__img--' + t).filter(function (img) {
      var r = img.closest('.device').getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    imgs.forEach(function (img) { img.loading = 'eager'; });
    var all = Promise.all(imgs.map(function (img) { return img.decode ? img.decode().catch(function () {}) : null; }));
    return Promise.race([all, new Promise(function (r) { setTimeout(r, 450); })]);
  }
  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (reduce || !document.startViewTransition) { applyTheme(next); return; }
    preload(next).then(function () {
      var r = tgl.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var ring = null;
      var vt = document.startViewTransition(function () {
        applyTheme(next);
        /* the ring lives in the new page, so it is drawn inside the growing circle, right at its edge */
        ring = document.createElement('span');
        ring.className = 'vt-ring';
        ring.setAttribute('aria-hidden', 'true');
        ring.style.setProperty('--vx', x + 'px');
        ring.style.setProperty('--vy', y + 'px');
        document.body.appendChild(ring);
      });
      var timing = { duration: 700, easing: 'cubic-bezier(.65, 0, .35, 1)' };
      vt.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: timing.duration, easing: timing.easing, pseudoElement: '::view-transition-new(root)' });
        if (ring) ring.animate([{ '--vr': '0px', opacity: 1 }, { '--vr': (R * .62) + 'px', opacity: 1, offset: .62 }, { '--vr': R + 'px', opacity: 0 }],
          { duration: timing.duration, easing: timing.easing, fill: 'forwards' });
      }).catch(function () {});
      vt.finished.then(function () { if (ring) ring.remove(); }, function () { if (ring) ring.remove(); });
    });
  }
  if (tgl) {
    applyTheme(root.getAttribute('data-theme'));
    tgl.addEventListener('click', toggleTheme);
  }

  /* ------------------------------------------------------------ header capsule */
  function header() {
    var hdr = $('#hdr'), bar = $('.hdr__progress', hdr), nav = $('.hdr__nav'), glide = $('.hdr__glide');
    var links = $$('.hdr__nav a');
    var floating = false;
    function onScroll() {
      var y = window.scrollY || root.scrollTop;
      var f = y > 10 || hdr.classList.contains('is-open');
      if (f !== floating) { floating = f; hdr.classList.toggle('is-float', f); setTimeout(place, 560); }
      var max = root.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }
    var current = null;
    function place() {
      $$('.sheet__nav a').forEach(function (l) {
        if (current && l.getAttribute('href') === '#' + current) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
      if (!glide || !nav) return;
      var a = current && links.filter(function (l) { return l.getAttribute('href') === '#' + current; })[0];
      if (!a || !nav.offsetWidth) { glide.classList.remove('is-on'); return; }
      var w = a.offsetWidth, L = a.offsetLeft;
      var x = rtl ? L - (nav.clientWidth - w) : L;
      glide.style.setProperty('--w', w + 'px');
      glide.style.setProperty('--x', x + 'px');
      glide.classList.add('is-on');
      links.forEach(function (l) { if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    }
    if ('IntersectionObserver' in window) {
      var ids = ['features', 'how', 'calc', 'trust', 'offices', 'faq'];
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) current = en.target.id;
          else if (current === en.target.id) current = null;
        });
        place();
      }, { rootMargin: '-50% 0px -49% 0px' });
      ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', place);
    onScroll();

    /* the menu sheet (phones and tablets) */
    var burger = $('.burger'), sheet = $('#sheet');
    function open(on) {
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      burger.setAttribute('aria-label', on ? burger.dataset.close : burger.dataset.open);
      hdr.classList.toggle('is-open', on);
      onScroll();
      if (on) { sheet.hidden = false; frame(function () { sheet.classList.add('is-open'); }); }
      else { sheet.classList.remove('is-open'); setTimeout(function () { if (!sheet.classList.contains('is-open')) sheet.hidden = true; }, 320); }
    }
    if (burger && sheet) {
      burger.addEventListener('click', function () { open(burger.getAttribute('aria-expanded') !== 'true'); });
      $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('aria-disabled') !== 'true') open(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { open(false); burger.focus(); } });
      document.addEventListener('click', function (e) { if (hdr.classList.contains('is-open') && (e.target === hdr || !hdr.contains(e.target))) open(false); });
    }
  }

  /* ------------------------------------------------------------ hero: pointer depth */
  function heroDepth() {
    var stage = $('[data-parallax]');
    if (!stage || !fine || reduce) return;
    var cards = $$('.gcard', stage), dev = $('.hero__device', stage), raf = 0, px = 0, py = 0;
    window.addEventListener('pointermove', function (e) {
      px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        cards.forEach(function (c) {
          var d = parseFloat(c.dataset.depth || 1);
          c.style.transform = 'translate3d(' + (px * 26 * d).toFixed(1) + 'px,' + (py * 20 * d).toFixed(1) + 'px,0)';
        });
        if (dev) dev.style.transform = 'perspective(1100px) rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg)';
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------ reveals and split headings */
  function inView(el) { var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }
  function reveals() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = $$('[data-reveal]');
    els.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 8) * 70 + 'ms');
    });
    root.classList.add('reveal-ready');
    var first = true;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (first && en.boundingClientRect.top < innerHeight) return;
        en.target.classList.add('is-in');
      });
      first = false;
    }, { rootMargin: '0px 0px 12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  function splitWords(el, cls) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map(function (w, i) {
      var outer = document.createElement('span');
      outer.className = cls;
      if (cls === 'split-w') { var inner = document.createElement('span'); inner.textContent = w; outer.appendChild(inner); }
      else outer.textContent = w;
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return outer;
    });
  }
  function headings() {
    if (!motion) return;
    $$('[data-split]').forEach(function (h) {
      var label = h.textContent.trim();
      var words = splitWords(h, 'split-w').map(function (w) { return w.firstChild; });
      h.setAttribute('aria-label', label);
      words.forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
      if (inView(h)) return;
      ST.create({ trigger: h, start: 'top bottom', once: true, onEnter: function () {
        G.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: .9, ease: 'power3.out', stagger: .045 });
      } });
    });
  }

  /* ------------------------------------------------------------ ticker */
  function ticker() {
    var track = $('.ticker__track'), vp = $('.ticker__viewport');
    if (!track) return;
    if (!motion) { vp.style.overflowX = 'auto'; return; }
    var clone = track.cloneNode(true);
    $$('li', clone).forEach(function (li) { li.setAttribute('aria-hidden', 'true'); });
    Array.prototype.slice.call(clone.children).forEach(function (li) { track.appendChild(li); });
    var tween = G.to(track, { xPercent: rtl ? 50 : -50, duration: 46, ease: 'none', repeat: -1 });
    var boost = G.quickTo(tween, 'timeScale', { duration: .6, ease: 'power2.out' });
    ST.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
      boost(1 + Math.min(5, Math.abs(self.getVelocity()) / 500));
      clearTimeout(ticker.t);
      ticker.t = setTimeout(function () { boost(1); }, 120);
    } });
    /* the loop rests while the ticker is off screen */
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) tween.play(); else tween.pause(); }, { rootMargin: '80px 0px' }).observe(vp);
    vp.addEventListener('pointerenter', function () { G.to(tween, { timeScale: .15, duration: .5 }); });
    vp.addEventListener('pointerleave', function () { G.to(tween, { timeScale: 1, duration: .5 }); });
  }

  /* ------------------------------------------------------------ why: messages fall into the ordered list */
  function why() {
    var stage = $('.why__stage'), items = $$('.msg');
    if (!stage || !items.length) return;
    var SX = [-14, 18, -22, 12, -6, 20], SY = [150, -40, 70, -150, 30, -90], SR = [-7, 5, -4, 8, -6, 4];
    function set(t) {
      stage.style.setProperty('--t', t.toFixed(3));
      var w = stage.clientWidth;
      items.forEach(function (it, i) {
        var e = clamp((t - i * .07) / .58, 0, 1);
        e = 1 - Math.pow(1 - e, 3);
        var k = 1 - e;
        it.style.setProperty('--e', e.toFixed(3));
        it.style.transform = k ? 'translate(' + (SX[i % 6] * w / 100 * k).toFixed(1) + 'px,' + (SY[i % 6] * k).toFixed(1) + 'px) rotate(' + (SR[i % 6] * k).toFixed(2) + 'deg) scale(' + (1 - .06 * k).toFixed(3) + ')' : '';
      });
    }
    if (!motion) { set(1); return; }
    set(0);
    var mm = G.matchMedia();
    mm.add('(min-width: 981px) and (min-height: 640px)', function () {
      var st = ST.create({ trigger: '.why', start: 'top top', end: '+=110%', pin: true, scrub: .6, onUpdate: function (s) { set(s.progress); } });
      return function () { st.kill(); };
    });
    mm.add('(max-width: 980px), (max-height: 639.98px)', function () {
      var o = { t: 0 };
      set(0);
      var st = ST.create({ trigger: stage, start: 'top 75%', once: true, onEnter: function () {
        G.to(o, { t: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: function () { set(o.t); } });
      } });
      return function () { st.kill(); };
    });
  }

  /* ------------------------------------------------------------ how: the phone stays, the steps change its screen */
  function how() {
    var steps = $$('.hstep'), dev = $('.how__device'), rail = $$('.how__rail i');
    if (!steps.length || !dev) return;
    var shots = $$('.shot', dev);
    function activate(i) {
      steps.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
      rail.forEach(function (r, j) { r.classList.toggle('is-on', j === i); });
      var scene = steps[i].dataset.scene;
      shots.forEach(function (sh) { sh.classList.toggle('is-on', sh.dataset.scene === scene); });
    }
    activate(0);
    var fill = $('.how__track i');
    if (fill && motion) {
      ST.create({ trigger: '.how__col', start: 'top 55%', end: 'bottom 55%', scrub: .3, onUpdate: function (st) { fill.style.setProperty('--p', st.progress.toFixed(4)); } });
    } else if (fill) fill.style.setProperty('--p', 1);
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(steps.indexOf(en.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------ bento */
  function spotlight() {
    if (!fine) return;
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
  function currencies() {
    var btns = $$('.cur'), items = $$('.curcard__item');
    if (!btns.length) return;
    function pick(b) {
      btns.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
      items.forEach(function (it) { it.classList.toggle('is-on', it.dataset.k === b.dataset.k); });
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var n = btns[(i + d + btns.length) % btns.length];
        n.focus(); pick(n);
      });
    });
    pick(btns[0]);
  }
  function chart() {
    var box = $('.chart');
    if (!box) return;
    var line = $('.chart__line', box), tip = $('.chart__tip', box), hits = $$('.chart__hits i', box);
    if (motion) {
      line.style.strokeDashoffset = '1';
      ST.create({ trigger: box, start: 'top 90%', once: true, onEnter: function () {
        G.to(line, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' });
      } });
      if (!inView(box)) G.set(line, { strokeDashoffset: 1 }); else line.style.strokeDashoffset = '0';
    }
    function show(i) {
      var h = hits[i];
      $('small', tip).textContent = h.dataset.date;
      $('b', tip).textContent = h.dataset.value;
      var x = parseFloat(h.style.getPropertyValue('--x')), y = parseFloat(h.dataset.y);
      tip.style.translate = 'calc(' + x + '% * ' + (box.clientWidth / 100) + ' / 1% - 50%) calc(' + (y * box.clientHeight / 100) + 'px - 100% - 14px)';
      tip.style.translate = (x / 100 * box.clientWidth - tip.offsetWidth / 2).toFixed(1) + 'px ' + (y / 100 * box.clientHeight - tip.offsetHeight - 14).toFixed(1) + 'px';
      tip.classList.add('is-on');
    }
    hits.forEach(function (h, i) {
      h.addEventListener('pointerenter', function () { show(i); });
    });
    box.addEventListener('pointerleave', function () { tip.classList.remove('is-on'); });
  }
  function langs() {
    var seg = $('.langs__seg');
    if (!seg) return;
    var btns = $$('button', seg), samples = $$('.langs__sample');
    function pick(i) {
      seg.dataset.at = i;
      btns.forEach(function (b, j) { b.setAttribute('aria-checked', j === i ? 'true' : 'false'); });
      samples.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    pick(0);
    /* a gentle demo: switch once when the tile comes into view */
    if (motion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        setTimeout(function () { if (seg.dataset.at === '0') pick(1); }, 900);
        setTimeout(function () { pick(0); }, 2600);
      }, { threshold: .7 });
      io.observe(seg);
    }
  }

  /* ------------------------------------------------------------ calculator */
  function rollTo(el, text) {
    var old = el.getAttribute('data-v') || el.textContent;
    el.setAttribute('data-v', text);
    if (old === text) return;
    if (reduce || !el.animate) { el.textContent = text; return; }
    var a = Array.from(old), b = Array.from(text);
    el.textContent = '';
    b.forEach(function (ch, i) {
      var oi = a.length - b.length + i, och = oi >= 0 ? a[oi] : '';
      var s = document.createElement('span'); s.className = 'dg';
      var inn = document.createElement('span'); inn.className = 'dg__in'; inn.textContent = ch;
      s.appendChild(inn); el.appendChild(s);
      if (och !== ch && /[0-9۰-۹]/.test(ch)) {
        inn.animate([{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 380, delay: (b.length - i) * 16, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
      }
    });
  }
  function calculator() {
    var form = $('#calc-form');
    if (!form || !window.NetRateCalc || !DATA.demo) return;
    var C = window.NetRateCalc(DATA.demo), T = DATA.calc, L = DATA.lang;
    var amountEl = $('#calc-amount'), unitEl = $('#calc-unit'), head = $('#calc-head'), list = $('#calc-rows');
    var more = $('#calc-more'), gapEl = $('#calc-gap'), gapUnit = $('#calc-gap-unit'), note = $('#calc-metal-note');
    var typeInputs = $$('#calc-types input');
    var spread = $('#calc-spread'), spreadMin = $('#calc-min'), spreadMax = $('#calc-max'), spreadN = $('#calc-n');
    var AR = '٠١٢٣٤٥٦٧٨٩';
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
      if (m < 1440) return r.hours.replace('{n}', local(Math.floor(m / 60)));
      if (m < 2880) return r.yesterday;
      return r.days.replace('{n}', local(Math.floor(m / 1440)));
    }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function clock() {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
      var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-clock');
      s.appendChild(u); return s;
    }
    var rows = {};                                           /* row elements by office id, reused between renders */
    $$('.crow', list).forEach(function (li, i) { li.dataset.id = DATA.demo.ex.filter(function () { return false; }).length ? '' : ''; });
    function rowFor(id) {
      if (rows[id]) return rows[id];
      var li = el('li', 'crow');
      li.dataset.id = id;
      li.appendChild(el('span', 'crow__n num'));
      var who = el('span', 'crow__who'); who.appendChild(el('b')); who.appendChild(el('small')); li.appendChild(who);
      var val = el('span', 'crow__val'); val.appendChild(el('b', 'num roll')); val.appendChild(el('small')); li.appendChild(val);
      var meta = el('span', 'crow__meta'); meta.appendChild(el('span'));
      var age = el('span', 'crow__age'); age.appendChild(clock()); age.appendChild(el('bdi')); meta.appendChild(age);
      li.appendChild(meta);
      rows[id] = li;
      return li;
    }
    function knobs() {
      $$('[data-seg]', form).forEach(function (seg) {
        var inputs = $$('input', seg);
        var i = inputs.findIndex(function (x) { return x.checked; });
        seg.style.setProperty('--i', Math.max(0, i));
      });
    }
    var firstRender = true;
    function render() {
      var s = { cur: form.elements.cur.value, dir: form.elements.dir.value, type: form.elements.type.value, amount: parse(amountEl.value) };
      var c = C.cur(s), metal = !!c.metal;
      $$('[data-metal-label]', form).forEach(function (x) { x.textContent = metal ? x.dataset.metalLabel : x.dataset.curText; });
      typeInputs.forEach(function (i) { i.disabled = metal; });
      if (note) note.hidden = !metal;
      knobs();
      var ranked = C.ranked(s), one = c.unit[L], many = c.units[L], a = s.amount, dec = metal ? 2 : 0;
      unitEl.textContent = a === 1 ? one : (L === 'fa' ? one : many);
      head.textContent = a ? (C.higher(s) ? T.headGet : T.headPay).replace('{a}', fmt(a, a % 1 ? 2 : 0)).replace('{u}', a === 1 ? one : many) : T.headRate;
      var unit = a ? (metal ? T.pound : T.toman) : (metal ? T.perGram : T.perUnit.replace('{u}', one));
      var top = ranked.slice(0, 3);
      var state = (motion && FLIP && !firstRender) ? FLIP.getState(list.children) : null;
      var fresh = [];
      top.forEach(function (r, i) {
        var known = !!rows[r.ex.id] && rows[r.ex.id].parentNode === list;
        var li = rowFor(r.ex.id);
        if (!known) fresh.push(li);
        li.querySelector('.crow__n').textContent = local(i + 1);
        li.querySelector('.crow__who b').textContent = r.ex.name[L];
        li.querySelector('.crow__who small').textContent = r.ex.city[L];
        rollTo(li.querySelector('.crow__val b'), fmt(r.value, dec));
        li.querySelector('.crow__val small').textContent = unit;
        li.querySelector('.crow__meta > span').textContent = metal || !a ? '' : (r.fee ? T.fee.replace('{v}', fmt(r.fee, r.fee % 1 ? 2 : 0) + ' ' + (r.fee === 1 ? one : many)) : T.feeNone);
        li.querySelector('.crow__age bdi').textContent = rel(r.ex.mins);
        list.appendChild(li);
      });
      Array.prototype.slice.call(list.children).forEach(function (li) {
        if (!top.some(function (r) { return r.ex.id === li.dataset.id; })) li.remove();
      });
      if (state) {
        FLIP.from(state, { duration: .6, ease: 'power3.out', simple: true });
        if (fresh.length) G.fromTo(fresh, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
      firstRender = false;
      var rest = ranked.length - 3;
      more.textContent = rest > 0 ? T.more.replace('{n}', local(rest)) : '';
      var last = ranked[ranked.length - 1];
      var gap = ranked.length > 1 ? Math.abs(top[0].value - last.value) : 0;
      rollTo(gapEl, fmt(gap, dec));
      gapUnit.textContent = unit;
      /* every office on one line between the lowest and the highest value (all dots alike: nothing marks "best") */
      if (spread) {
        var vals = ranked.map(function (r) { return r.value; });
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = hi - lo || 1;
        var dots = spread.children;
        while (dots.length < ranked.length) { var d = document.createElement('i'); d.className = 'spread__dot'; spread.appendChild(d); }
        while (dots.length > ranked.length) spread.lastChild.remove();
        ranked.slice().sort(function (a, b) { return a.ex.id < b.ex.id ? -1 : 1; }).forEach(function (r, k) {
          dots[k].style.setProperty('--x', ((r.value - lo) / span * 100).toFixed(2) + '%');
          dots[k].setAttribute('data-label', r.ex.name[L] + '  ' + fmt(r.value, dec));
        });
        spreadMin.textContent = fmt(lo, dec);
        spreadMax.textContent = fmt(hi, dec);
        spreadN.textContent = T.spreadNote.replace('{n}', local(ranked.length));
      }
    }
    /* the server-rendered rows become the first keyed rows */
    list.textContent = '';
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('.quick button', form).forEach(function (b) {
      b.addEventListener('click', function () { amountEl.value = fmt(Number(b.dataset.v), 0); render(); });
    });
    render();
  }

  /* ------------------------------------------------------------ honesty cases */
  function cases() {
    var tabs = $$('.case'), dev = $('.honest__device');
    if (!tabs.length || !dev) return;
    var shots = $$('.shot', dev);
    function pick(t) {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); x.tabIndex = x === t ? 0 : -1; });
      shots.forEach(function (s) { s.classList.toggle('is-on', s.dataset.scene === t.dataset.scene); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length];
        n.focus(); pick(n);
      });
    });
    pick(tabs[0]);
  }

  /* ------------------------------------------------------------ trust statement: words light up with the scroll */
  function statement() {
    var el = $('[data-words]');
    if (!el || !motion) return;
    var label = el.textContent.trim();
    var words = splitWords(el, 'w');
    el.setAttribute('aria-label', label);
    words.forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    ST.create({ trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: .4, onUpdate: function (s) {
      var p = s.progress * (words.length + 1);
      words.forEach(function (w, i) { w.style.setProperty('--o', clamp(p - i, .4, 1).toFixed(3)); });
    } });
  }

  /* ------------------------------------------------------------ FAQ, placeholders, magnets, footer word */
  function faq() {
    $$('.qa').forEach(function (qa, i) {
      var b = $('.qa__q', qa);
      var set = function (open) { qa.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); if (ST) setTimeout(function () { ST.refresh(); }, 520); };
      b.addEventListener('click', function () { set(!qa.classList.contains('is-open')); });
      if (i === 0) { qa.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
    });
  }
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
        t.style.left = clamp(r.left + r.width / 2 - t.offsetWidth / 2, 8, innerWidth - t.offsetWidth - 8) + 'px';
        t.style.top = Math.max(8, r.top - t.offsetHeight - 10) + 'px';
        if (t.animate && !reduce) t.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        setTimeout(function () {
          if (t.animate && !reduce) t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = function () { t.remove(); };
          else t.remove();
        }, 1500);
      });
    });
  }
  function magnets() {
    if (!fine || reduce) return;
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      b.style.transition = 'transform .5s cubic-bezier(.22, 1, .36, 1), box-shadow .35s';
    });
  }
  function footerWord() {
    var w = $('.foot__word');
    if (!w || !motion) return;
    G.fromTo(w, { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }


  /* ------------------------------------------------------------ details */
  function cursorLight() {
    if (!fine || reduce) return;
    var light = $('.aurora__cursor'), x = -999, y = -999, tx = x, ty = y, run = false;
    function step() {
      x += (tx - x) * .12; y += (ty - y) * .12;
      /* the light layer is placed from the inline start: in RTL that is the right edge */
      light.style.setProperty('--cx', (rtl ? x - innerWidth : x).toFixed(1) + 'px');
      light.style.setProperty('--cy', y.toFixed(1) + 'px');
      if (Math.abs(tx - x) + Math.abs(ty - y) > .5) requestAnimationFrame(step); else run = false;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || (e.clientX === 0 && e.clientY === 0)) return;
      tx = e.clientX; ty = e.clientY;
      if (x === -999) { x = tx; y = ty; }
      root.classList.add('has-cursor');
      if (!run) { run = true; requestAnimationFrame(step); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { root.classList.remove('has-cursor'); });
  }
  function navHover() {
    var nav = $('.hdr__nav'), glide = $('.hdr__glide');
    if (!nav || !glide || !fine) return;
    $$('a', nav).forEach(function (a) {
      a.addEventListener('pointerenter', function () {
        var w = a.offsetWidth, L = a.offsetLeft;
        glide.style.setProperty('--w', w + 'px');
        glide.style.setProperty('--x', (rtl ? L - (nav.clientWidth - w) : L) + 'px');
        glide.classList.add('is-on');
      });
    });
    nav.addEventListener('pointerleave', function () { window.dispatchEvent(new Event('resize')); });
  }
  function heroScroll() {
    if (!motion) return;
    G.to('.hero__stage', { yPercent: -10, scale: .96, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__copy', { yPercent: -6, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  }
  function tilt() {
    if (!fine || reduce) return;
    $$('.tile').forEach(function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        t.classList.add('is-tilt');
        t.style.transform = 'perspective(1200px) rotateX(' + (-py * 3).toFixed(2) + 'deg) rotateY(' + (px * 3).toFixed(2) + 'deg)';
      });
      t.addEventListener('pointerleave', function () { t.classList.remove('is-tilt'); t.style.transform = ''; });
    });
  }
  function faqSearch() {
    var input = $('#faq-q'), none = $('#faq-none'), items = $$('.qa');
    if (!input) return;
    /* Persian and Arabic forms of ye and kaf match, and the zero-width non-joiner is ignored */
    var norm = function (s) {
      return s.toLowerCase().replace(/‌/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    };
    var list = items.map(function (qa) { var t = $('.qa__t', qa); return { qa: qa, t: t, raw: t.textContent, text: norm(qa.textContent) }; });
    input.addEventListener('input', function () {
      var q = norm(input.value.trim()), shown = 0;
      list.forEach(function (x) {
        var hit = !q || x.text.indexOf(q) >= 0;
        x.qa.hidden = !hit;
        if (hit) shown++;
        x.t.textContent = x.raw;
        var i = q ? norm(x.raw).indexOf(q) : -1;
        if (hit && i >= 0 && norm(x.raw).length === x.raw.length) {
          x.t.textContent = '';
          x.t.appendChild(document.createTextNode(x.raw.slice(0, i)));
          var m = document.createElement('mark'); m.textContent = x.raw.slice(i, i + q.length); x.t.appendChild(m);
          x.t.appendChild(document.createTextNode(x.raw.slice(i + q.length)));
        }
      });
      none.hidden = shown > 0;
      if (ST) ST.refresh();
    });
  }
  function toTop() {
    var b = $('.totop');
    if (!b) return;
    function on() {
      var y = window.scrollY, max = root.scrollHeight - innerHeight;
      b.classList.toggle('is-on', y > innerHeight * 1.2);
      b.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }
    window.addEventListener('scroll', on, { passive: true });
    on();
  }
  function panelTyping() {
    var panel = $('.panel'), cells = $$('.rtable__in'), sw = $('.panel__rem .switch');
    if (!panel || !cells.length || reduce || !('IntersectionObserver' in window) || inView(panel)) return;
    var vals = cells.map(function (c) { return c.textContent; });
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      /* the office posts today's rates: each field types in, then the reminder switches on */
      cells.forEach(function (c) { c.textContent = ''; });
      if (sw) sw.classList.remove('is-on');
      var i = 0;
      (function next() {
        if (i >= cells.length) { if (sw) setTimeout(function () { sw.classList.add('is-on'); }, 200); return; }
        var c = cells[i], v = vals[i], k = 0;
        c.classList.add('is-typing');
        (function type() {
          c.textContent = v.slice(0, ++k);
          if (k < v.length) setTimeout(type, 42); else { c.classList.remove('is-typing'); i++; setTimeout(next, 90); }
        })();
      })();
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(panel);
  }


  function flipCard() {
    $$('[data-flip]').forEach(function (f) {
      var open = $('.flip__front .flip__btn', f), back = $('[data-flip-back]', f);
      function set(on) {
        f.classList.toggle('is-flipped', on);
        open.setAttribute('aria-expanded', on ? 'true' : 'false');
        setTimeout(function () { (on ? back : open).focus({ preventScroll: true }); }, 420);
      }
      open.addEventListener('click', function () { set(true); });
      back.addEventListener('click', function () { set(false); });
    });
  }


  /* a closer look: spots and callouts light each other up; a slow tour runs until the visitor takes over */
  function closerLook() {
    var hots = $$('.hot'), calls = $$('.callout');
    if (!hots.length) return;
    var at = -1, timer = 0, manual = false;
    function on(i) {
      at = i;
      hots.forEach(function (h) { h.classList.toggle('is-on', +h.dataset.i === i); h.setAttribute('aria-pressed', +h.dataset.i === i ? 'true' : 'false'); });
      calls.forEach(function (c) { c.classList.toggle('is-on', +c.dataset.i === i); });
    }
    function stop() { manual = true; clearInterval(timer); }
    hots.forEach(function (h) {
      h.addEventListener('click', function () { stop(); on(+h.dataset.i); });
      h.addEventListener('pointerenter', function () { if (fine) { stop(); on(+h.dataset.i); } });
      h.addEventListener('focus', function () { stop(); on(+h.dataset.i); });
    });
    calls.forEach(function (c) {
      c.addEventListener('pointerenter', function () { if (fine) { stop(); on(+c.dataset.i); } });
      c.addEventListener('focus', function () { stop(); on(+c.dataset.i); });
      c.addEventListener('click', function () { stop(); on(+c.dataset.i); });
    });
    on(0);
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      clearInterval(timer);
      if (!en[0].isIntersecting || manual) return;
      timer = setInterval(function () { on((at + 1) % hots.length); }, 2600);
    }, { threshold: .5 });
    io.observe($('.look__grid'));
  }


  /* showroom: on large screens the section pins and the screens pass sideways with the scroll; on phones it swipes */
  function showroom() {
    var sec = $('.show'), track = $('.show__track'), vp = $('.show__viewport'), bar = $('.show__bar i');
    if (!sec || !track) return;
    var arrows = $$('.show__arrow');
    function progress(p) { if (bar) bar.style.setProperty('--p', p.toFixed(4)); }
    function ends() {
      var max = vp.scrollWidth - vp.clientWidth, at = Math.abs(vp.scrollLeft);
      progress(max > 0 ? at / max : 0);
      arrows.forEach(function (b) {
        var off = +b.dataset.step < 0 ? at < 4 : at > max - 4;
        b.setAttribute('aria-disabled', off ? 'true' : 'false');
      });
    }
    vp.addEventListener('scroll', ends, { passive: true });
    addEventListener('resize', ends);
    arrows.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') return;
        var card = track.firstElementChild, gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        var step = card.getBoundingClientRect().width + gap;
        vp.scrollBy({ left: (rtl ? -1 : 1) * +b.dataset.step * step, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    ends();
    if (!motion) return;
    var mm = G.matchMedia();
    mm.add('(min-width: 981px) and (min-height: 640px)', function () {
      sec.classList.add('is-pinned');
      vp.removeAttribute('tabindex');
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      var tween = G.to(track, { x: function () { return (rtl ? 1 : -1) * dist(); }, ease: 'none' });
      var st = ST.create({ trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: '.show__pin', scrub: .7,
        animation: tween, invalidateOnRefresh: true, onUpdate: function (self) { progress(self.progress); } });
      return function () { st.kill(); tween.kill(); G.set(track, { clearProps: 'transform' }); sec.classList.remove('is-pinned'); vp.setAttribute('tabindex', '0'); ends(); };
    });
  }


  /* looping decoration (halo rings, the screen wall, the hero floor, glows) rests while its section is off screen */
  function restOffscreen() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-offscreen', !en.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    $$('.hero, .how, .look, .honest, .get, .ticker, .widget').forEach(function (el) { io.observe(el); });
  }


  /* kinetic band: two rows of words slide opposite ways with the scroll and lean a little with its speed */
  function band() {
    var el = $('.band');
    if (!el || !motion) return;
    var dir = rtl ? 1 : -1, rows = $$('.band__row', el);
    $$('.band__track', el).forEach(function (tr, i) {
      var a = i % 2 ? 18 : 2, b = i % 2 ? 2 : 18;
      G.fromTo(tr, { xPercent: dir * a }, { xPercent: dir * b, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 } });
    });
    var lean = rows.map(function (r) { return G.quickTo(r, 'skewX', { duration: .5, ease: 'power3.out' }); });
    ST.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
      var v = clamp(self.getVelocity() / 260, -7, 7) * (rtl ? -1 : 1);
      lean.forEach(function (f) { f(v); });
      clearTimeout(band.t);
      band.t = setTimeout(function () { lean.forEach(function (f) { f(0); }); }, 140);
    } });
  }


  /* the floating capsule's edge light follows the pointer */
  function capsuleLight() {
    var pill = $('.hdr__pill');
    if (!pill || !fine) return;
    pill.addEventListener('pointermove', function (e) {
      var r = pill.getBoundingClientRect();
      pill.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    });
  }


  /* the app's three themes: the picked card comes to the centre, the centre one takes its place */
  function themeFan() {
    var cards = $$('.fan__card');
    if (cards.length !== 3) return;
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        if (c.dataset.pos === '1') return;
        var mid = cards.filter(function (k) { return k.dataset.pos === '1'; })[0];
        mid.dataset.pos = c.dataset.pos;
        c.dataset.pos = '1';
        cards.forEach(function (k) { k.setAttribute('aria-pressed', k === c ? 'true' : 'false'); });
      });
    });
  }

  /* ------------------------------------------------------------ start */
  smooth();
  header();
  heroDepth();
  reveals();
  headings();
  ticker();
  why();
  how();
  spotlight();
  currencies();
  chart();
  langs();
  calculator();
  cases();
  statement();
  faq();
  placeholders();
  magnets();
  footerWord();
  cursorLight();
  navHover();
  heroScroll();
  tilt();
  faqSearch();
  toTop();
  panelTyping();
  flipCard();
  closerLook();
  showroom();
  restOffscreen();
  band();
  capsuleLight();
  themeFan();
  if (ST) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  window.__nrState = function () {
    return { theme: root.getAttribute('data-theme'), float: $('#hdr').classList.contains('is-float'),
      how: ($('.how__device .shot.is-on') || {}).dataset, lenis: !!lenis };
  };
})();
