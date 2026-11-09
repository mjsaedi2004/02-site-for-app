/* Study 06 — motion layer: Lenis smooth scroll; the hero intro with the hand-drawn loop drawing itself and live
   candles; every hand-drawn line draws with the scroll; analytics rings sweep in; the pulse banner's phone rises and its
   balance counts; tickers float and their prices tick; a sticky nav that frosts once the hero scrolls away.
   Without JS or with reduced motion the page is complete and still. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function show() { root.classList.remove('js-intro'); }

  /* ------------------------------------------------------------ candles on the chart phone (drawn once; moving with motion) */
  var cv = $('.candles');
  var bars = [];
  (function seed() {
    var v = 120;
    for (var i = 0; i < 46; i++) {
      var o = v, c = v + (Math.random() - .44) * 12;
      bars.push({ o: o, c: c, h: Math.max(o, c) + Math.random() * 6, l: Math.min(o, c) - Math.random() * 6 });
      v = c;
    }
  })();
  function drawCandles() {
    if (!cv) return;
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var g = cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    var lo = Infinity, hi = -Infinity;
    bars.forEach(function (b) { lo = Math.min(lo, b.l); hi = Math.max(hi, b.h); });
    var pad = H * .1, y = function (v) { return pad + (hi - v) / (hi - lo || 1) * (H - pad * 2); };
    // the two smooth guide curves behind the candles
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = dpr;
    [.18, .62].forEach(function (k, n) {
      g.beginPath();
      for (var x = 0; x <= W; x += 6 * dpr) { var yy = H * k + Math.sin(x / W * Math.PI * (1.2 + n * .4) + n) * H * .08; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    });
    var step = W / bars.length, bw = Math.max(1.5 * dpr, step * .42);
    bars.forEach(function (b, i) {
      var x = step * (i + .5), up = b.c >= b.o;
      g.strokeStyle = g.fillStyle = up ? '#D6EC3A' : '#E26D6D';
      g.lineWidth = Math.max(1, dpr * .9);
      g.beginPath(); g.moveTo(x, y(b.h)); g.lineTo(x, y(b.l)); g.stroke();
      var t = y(Math.max(b.o, b.c)), h = Math.max(1.5 * dpr, Math.abs(y(b.o) - y(b.c)));
      g.fillRect(x - bw / 2, t, bw, h);
    });
  }
  drawCandles();
  window.addEventListener('resize', drawCandles);

  if (reduce || !gsap || !ST) { show(); return; }
  root.classList.add('js-motion');
  gsap.registerPlugin(ST);

  /* ------------------------------------------------------------ smooth scroll */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -90, duration: 1.3 }); else window.scrollTo({ top: t ? t.offsetTop - 90 : 0, behavior: 'smooth' });
    });
  });

  /* helpers: strokes that draw */
  function prep(paths) {
    return paths.map(function (p) { var l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l + ' ' + l, strokeDashoffset: l }); return p; });
  }

  /* ------------------------------------------------------------ hero intro */
  show();
  var loop = prep($$('.hero__loop path'));
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set('.hero__title', { clipPath: 'inset(-10% -20% -14% -2%)' });
  intro.from('.nav > *', { y: -16, opacity: 0, duration: .9, stagger: .06 }, 0)
    .fromTo('.hero__panel', { clipPath: 'inset(12% 8% 12% 8% round 32px)', opacity: 0 }, { clipPath: 'inset(0% 0% 0% 0% round 32px)', opacity: 1, duration: 1.3, ease: 'expo.inOut' }, .05)
    .from('.hero__title .ln', { yPercent: 105, duration: 1.1, stagger: .1 }, .55)
    .from('.hero__spark', { scale: 0, rotation: -180, duration: 1.2, ease: 'back.out(1.8)' }, .9)
    .from('.hero__lead', { y: 20, opacity: 0, duration: 1 }, .8)
    .from('.hero__btn', { y: 20, opacity: 0, duration: .9 }, .95)
    .from('.hero__more', { y: 14, opacity: 0, duration: .8 }, 1.05)
    .to(loop, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: .3 }, 1)
    .from('.ph--market', { y: 260, rotation: -8, opacity: 0, duration: 1.5 }, .6)
    .from('.ph--chart', { y: 320, rotation: 10, opacity: 0, duration: 1.6 }, .72)
    .from('.ph-sheet', { y: 260, rotation: 8, opacity: 0, duration: 1.6 }, .85)
    .add(function () { gsap.set('.hero__title', { clearProps: 'clipPath' }); gsap.set('.hero__panel', { clearProps: 'clipPath' }); });
  // the sparkle keeps a slow twinkle
  gsap.to('.hero__spark', { rotation: 90, scale: .82, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1.4, delay: 2.6 });
  // the phones drift with the scroll; the panel content lifts a little
  var heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 };
  gsap.to('.ph--market', { yPercent: -10, ease: 'none', scrollTrigger: heroST });
  gsap.to('.ph--chart', { yPercent: -16, ease: 'none', scrollTrigger: heroST });
  gsap.to('.ph-sheet', { yPercent: -24, ease: 'none', scrollTrigger: heroST });
  // live candles: a new bar every 1.6 s while the hero is on screen
  var tick = null;
  ST.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: function (s) {
    clearInterval(tick);
    if (s.isActive) tick = setInterval(function () {
      var last = bars[bars.length - 1], o = last.c, c = o + (Math.random() - .44) * 12;
      bars.shift(); bars.push({ o: o, c: c, h: Math.max(o, c) + Math.random() * 6, l: Math.min(o, c) - Math.random() * 6 });
      drawCandles();
    }, 1600);
  } });

  /* sticky nav frosts once the hero has scrolled */
  var nav = $('.nav');
  ST.create({ start: 120, end: 'max', onToggle: function (s) { nav.classList.toggle('is-stuck', s.isActive); } });

  /* ------------------------------------------------------------ get the most out */
  gsap.from('.most .h2', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.most', start: 'top 80%', once: true } });
  gsap.from('.mc', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.most__cards', start: 'top 85%', once: true } });
  var mcDraw = prep($$('.mc .draw'));
  mcDraw.forEach(function (p) { gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('.mc'), start: 'top 95%', end: 'top 62%', scrub: .5 } }); });
  gsap.from('.mc__art--1 path:not(.draw)', { scale: .6, opacity: 0, transformOrigin: '50% 100%', duration: 1.3, ease: 'back.out(1.5)', stagger: .12, scrollTrigger: { trigger: '.most__cards', start: 'top 75%', once: true } });
  $$('.ring').forEach(function (r, i) {
    var da = r.getAttribute('stroke-dasharray').split(' ');
    gsap.fromTo(r, { strokeDasharray: '0 ' + da[1] }, { strokeDasharray: da[0] + ' ' + da[1], duration: 1.4, ease: 'power3.out', delay: i * .12, scrollTrigger: { trigger: '.most__cards', start: 'top 75%', once: true } });
  });

  /* ------------------------------------------------------------ advantages */
  gsap.from('.adv__intro > *', { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.adv', start: 'top 75%', once: true } });
  gsap.from('.av', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.adv__grid', start: 'top 80%', once: true } });
  gsap.from('.av i', { scale: 0, rotation: -90, duration: 1, ease: 'back.out(2)', stagger: .1, delay: .2, scrollTrigger: { trigger: '.adv__grid', start: 'top 80%', once: true } });

  /* ------------------------------------------------------------ partners + pulse */
  gsap.from('.partners .h2, .partners__lead', { y: 34, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.partners', start: 'top 80%', once: true } });
  gsap.from('.badges li', { y: 30, scale: .8, opacity: 0, duration: .9, ease: 'back.out(1.6)', stagger: .06, scrollTrigger: { trigger: '.badges', start: 'top 88%', once: true } });
  var pulseLine = prep($$('.pulse__line .draw'));
  gsap.to(pulseLine, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.pulse', start: 'top 92%', end: 'top 58%', scrub: .5 } });
  gsap.from('.pulse h2, .pulse .btn', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.pulse', start: 'top 75%', once: true } });
  gsap.fromTo('.pulse__phone', { y: 160 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.pulse', start: 'top bottom', end: 'top 58%', scrub: .5 } });
  var ppNum = $('.pp__num'), pp = { v: 0 };
  ST.create({ trigger: '.pulse', start: 'top 70%', once: true, onEnter: function () {
    gsap.to(pp, { v: 16988.31, duration: 1.8, ease: 'power3.out', onUpdate: function () { ppNum.textContent = pp.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } });
  } });

  /* ------------------------------------------------------------ trade */
  var tcLine = prep($$('.tc__line'));
  gsap.to(tcLine, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: '.trade', start: 'top 75%', once: true } });
  gsap.from('.trade__lime', { rotation: -12, scale: .8, opacity: 0, duration: 1.3, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.trade', start: 'top 80%', once: true } });
  gsap.from('.tc', { y: 50, rotation: 8, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.trade', start: 'top 80%', once: true } });
  gsap.from('.trade__copy > *, .stonks > *', { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.trade', start: 'top 65%', once: true } });
  var tkLine = prep($$('.tickers__line .draw'));
  gsap.to(tkLine, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.tickers', start: 'top 95%', end: 'top 25%', scrub: .5 } });
  gsap.from('.tickers__blob', { scale: .3, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.tickers', start: 'top 85%', once: true } });
  $$('.tk').forEach(function (t, i) {
    gsap.from(t, { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', delay: i * .12, scrollTrigger: { trigger: '.tickers', start: 'top 75%', once: true } });
    gsap.to(t, { y: i % 2 ? 8 : -8, duration: 2.6 + i * .5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
  });
  // prices tick while the tickers are on screen
  var ems = $$('.tk em[data-base]'), tkTimer = null;
  function fmt(v) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  ST.create({ trigger: '.tickers', start: 'top bottom', end: 'bottom top', onToggle: function (s) {
    clearInterval(tkTimer);
    if (s.isActive) tkTimer = setInterval(function () {
      ems.forEach(function (em) {
        var base = parseFloat(em.dataset.base), v = base * (1 + (Math.random() - .5) * .004);
        var small = em.querySelector('small');
        em.firstChild.nodeValue = fmt(v);
        if (small) em.appendChild(small);
        gsap.fromTo(em, { color: v >= base ? '#9DB12A' : '#E26D6D' }, { color: '#0E0E0E', duration: .9 });
      });
    }, 1900);
  } });

  /* ------------------------------------------------------------ get the app + footer */
  gsap.from('.get > *', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.get', start: 'top 80%', once: true } });
  gsap.from('.foot > *:not(.foot__note), .foot__cols > div', { y: 28, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.foot', start: 'top 90%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); drawCandles(); });
  window.addEventListener('load', function () { ST.refresh(); drawCandles(); });
})();
