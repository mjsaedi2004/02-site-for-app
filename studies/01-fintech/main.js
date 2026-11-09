/* Study 01 — motion layer: Lenis smooth scroll, a short load intro, scroll scenes and hover details.
   The page is complete without it: no-JS and reduced motion show the finished layout. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  function show() { root.classList.remove('js-intro'); }
  if (reduce || !gsap || !ST) { show(); return; }
  gsap.registerPlugin(ST);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------ smooth scroll */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#') { e.preventDefault(); return; }
      var target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      var input = target && target.querySelector ? target.querySelector('input') : null;
      var focus = function () { if (input) input.focus({ preventScroll: true }); };
      if (lenis) lenis.scrollTo(target, { offset: target ? -140 : 0, duration: 1.2, onComplete: focus });
      else { (target || document.body).scrollIntoView({ behavior: 'smooth', block: 'center' }); focus(); }
    });
  });

  /* ------------------------------------------------------------ helpers */
  function splitWords(el) {
    // wrap each word of the element's text nodes in .w > span, leaving child elements (mark, spans) whole
    $$(':scope > *', el).forEach(function (child) { child.classList.add('w-keep'); });
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) { if (n.classList && n.classList.contains('w-keep')) { var w = document.createElement('span'); w.className = 'w'; n.parentNode.insertBefore(w, n); w.appendChild(n); } return; }
      var parts = n.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var w = document.createElement('span'); w.className = 'w';
        var i = document.createElement('span'); i.textContent = p;
        w.appendChild(i); frag.appendChild(w);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return $$('.w > *', el);
  }
  var money = function (v) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  /* ------------------------------------------------------------ floating header (appears when scrolling back up) */
  var nav = $('.nav');
  var fl = nav.cloneNode(true);
  fl.classList.add('nav--float');
  fl.setAttribute('inert', '');
  fl.setAttribute('aria-hidden', 'true');
  $$('[id]', fl).forEach(function (n) { n.removeAttribute('id'); });
  document.body.appendChild(fl);
  $$('a[href^="#"]', fl).forEach(function (a) { a.addEventListener('click', function (e) { var orig = $('.nav a[href="' + a.getAttribute('href') + '"]'); if (orig) { e.preventDefault(); orig.click(); } }); });
  ST.create({ start: 0, end: 'max', onUpdate: function (self) {
    var y = self.scroll();
    var on = y > 420 && self.direction < 0;
    fl.classList.toggle('is-on', on);
    on ? fl.removeAttribute('inert') : fl.setAttribute('inert', '');
  } });

  /* ------------------------------------------------------------ load intro (above the fold) */
  show();
  var bal = $('.app__bal');
  var count = { v: 0 };
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set('.hero__title .ln', { clipPath: 'inset(-30% -6% -8% -6%)' });
  intro
    .from('.hero__map', { opacity: 0, scale: 1.04, duration: 1.8, ease: 'power2.out' }, 0)
    .from('.page .nav > *', { y: -16, opacity: 0, duration: .9, stagger: .07 }, .05)
    .from('.hero__title .ln > span', { yPercent: 108, duration: 1.15, stagger: .09 }, .1)
    .from('.spark', { scale: 0, rotation: -135, duration: 1.2, ease: 'back.out(1.7)' }, .55)
    .from('.hero__lead', { y: 18, opacity: 0, duration: 1 }, .5)
    .fromTo('.hero .email', { clipPath: 'inset(0% 100% 0% 0% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.1, ease: 'expo.inOut' }, .55)
    .from('.hero .email .btn', { xPercent: -40, opacity: 0, duration: .9 }, .95)
    .from('.lg', { y: 16, opacity: 0, duration: .8, stagger: .06 }, .8)
    .from('.hero__box', { scaleY: .72, opacity: 0, transformOrigin: '50% 100%', duration: 1.25 }, .2)
    .from('.phone--hero', { y: 110, rotationX: 16, transformPerspective: 1100, transformOrigin: '50% 100%', opacity: 0, duration: 1.5 }, .3)
    .from('.app__lbl, .app__btns span, .app__sec, .app .row, .tabs', { x: 26, opacity: 0, duration: .9, stagger: .05 }, .85)
    .to(count, { v: 15786, duration: 1.6, ease: 'power3.out', onUpdate: function () { bal.textContent = money(count.v); }, onComplete: function () { bal.textContent = '$15,786.00'; } }, .8)
    .add(function () { gsap.set('.hero__title .ln', { clearProps: 'clipPath' }); gsap.set('.hero .email', { clearProps: 'clipPath' }); });
  bal.textContent = money(0);
  // the sparkle keeps a slow twinkle (a quarter turn lands on the same four-point shape)
  gsap.to('.spark', { rotation: 90, scale: .84, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 1.6, delay: 2.4 });

  /* ------------------------------------------------------------ hero: parallax and pointer tilt */
  var heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .3 };
  gsap.to('.phone--hero', { yPercent: -9, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__box', { yPercent: -3, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__map', { yPercent: 16, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__copy', { y: -40, ease: 'none', scrollTrigger: heroST });
  var vis = $('.hero__visual');
  if (finePointer && vis) {
    gsap.set(vis, { transformPerspective: 1600, transformOrigin: '76% 46%' });
    var tiltX = gsap.quickTo(vis, 'rotationX', { duration: .9, ease: 'power3' });
    var tiltY = gsap.quickTo(vis, 'rotationY', { duration: .9, ease: 'power3' });
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return; // Chromium's synthetic move
      var ph = $('.phone--hero').getBoundingClientRect();
      var dx = (e.clientX - (ph.left + ph.width / 2)) / 700;
      var dy = (e.clientY - (ph.top + ph.height / 2)) / 600;
      tiltY(Math.max(-1, Math.min(1, dx)) * 7);
      tiltX(Math.max(-1, Math.min(1, dy)) * -5);
    });
    hero.addEventListener('pointerleave', function () { tiltX(0); tiltY(0); });
  }

  /* ------------------------------------------------------------ banking made easier */
  var panel = $('.easier__panel');
  gsap.fromTo(panel, { scale: .93 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 95%', end: 'top 40%', scrub: .4 } });
  gsap.from('.easier__arcs circle', { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: panel, start: 'top 75%', once: true } });
  var easierWords = splitWords($('.easier__title'));
  gsap.from(easierWords, { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });
  gsap.fromTo('.easier__title mark', { '--hl': 0 }, { '--hl': 1, duration: .9, ease: 'expo.inOut', delay: .45, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });

  /* ------------------------------------------------------------ the three cards */
  gsap.from('.card', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.cards', start: 'top 88%', once: true } });
  $$('.card').forEach(function (card) {
    var down = card.classList.contains('card--b');
    gsap.fromTo($('.phone--card', card), { y: down ? -22 : 22 }, { y: down ? 22 : -22, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: .4 } });
    gsap.from($$('.card__rings circle', card), { scale: .7, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    ST.create({ trigger: card, start: 'top 75%', once: true, onEnter: function () { card.classList.add('is-in'); } });
  });

  /* ------------------------------------------------------------ app store: the phone turns into the reference pose */
  var soonWords = splitWords($('.soon__title'));
  gsap.from(soonWords, { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.soon', start: 'top 78%', once: true } });
  gsap.from('.soon__rings circle', { scale: .75, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.soon', start: 'top 70%', once: true } });
  gsap.fromTo('.p3d', { '--rx': 52, '--ry': 58, '--rz': -9, '--ty': 170 }, { '--rx': 30.39, '--ry': 30.81, '--rz': -.68, '--ty': 0, ease: 'power2.out', scrollTrigger: { trigger: '.soon', start: 'top 96%', end: 'top 32%', scrub: .5 } });
  ST.create({ trigger: '.soon', start: 'top 32%', once: true, onEnter: function () {
    gsap.fromTo('.st__get', { scale: 1 }, { scale: 1.14, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1, delay: .15 });
  } });

  /* ------------------------------------------------------------ footer */
  // the footer is the last block: reveal it with a clip (a y offset would stretch the page until it ran)
  gsap.from('.foot', { clipPath: 'inset(22% 0% 0% 0% round 37px 37px 0px 0px)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: '.foot', start: 'top 98%', once: true } });
  gsap.from('.foot__brand > *, .foot__cols > div', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
