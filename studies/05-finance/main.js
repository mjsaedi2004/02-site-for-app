/* Study 05 — motion layer: Lenis smooth scroll, a soft intro, panels that grow under a "See more" follow cursor,
   the pinned feature story (phone → laptop), tabs you can pick, and reveals. Complete without JS or with reduced motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function show() { root.classList.remove('js-intro'); }

  /* tabs: pick one (also without GSAP) */
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () { $$('.tab').forEach(function (o) { o.classList.toggle('is-on', o === t); }); });
  });

  /* follow cursor (fine pointers only): with motion allowed it is a page-wide dot that becomes "See more" over the
     panels (reference); with reduced motion it stays the panels' own circle */
  var panels = $('.panels'), cursor = $('.cursor');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (cursor && fine && !reduce && gsap) {
    cursor.insertAdjacentHTML('afterbegin', '<i></i>');
    document.body.appendChild(cursor);
    cursor.classList.add('is-page');
    root.classList.add('cur-dot');
    var cx = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    var first = true;
    window.addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      if (first) { gsap.set(cursor, { x: e.clientX, y: e.clientY }); first = false; }
      cx(e.clientX); cy(e.clientY);
      root.classList.add('cur-on');
      var t = e.target;
      cursor.classList.toggle('is-panel', !!(t.closest && t.closest('.panel')));
      cursor.classList.toggle('is-link', !!(t.closest && t.closest('a:not(.panel), button, summary, .tab, input')));
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('cur-on'); });
    panels = null; // the page-wide cursor replaces the panels-only one
  }
  if (panels && fine) {
    var place = function (x, y) { cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
    var qx = null, qy = null;
    if (gsap && !reduce) { qx = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' }); qy = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' }); }
    panels.addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      var r = panels.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (qx) { qx(x); qy(y); } else place(x, y);
      panels.classList.toggle('is-hover', !!e.target.closest('.panel'));
    });
    panels.addEventListener('pointerleave', function () { panels.classList.remove('is-hover'); });
  }

  if (reduce || !gsap || !ST) { show(); return; }
  root.classList.add('js-motion');
  gsap.registerPlugin(ST);

  /* smooth scroll */
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
      if (lenis) lenis.scrollTo(t, { duration: 1.3 }); else window.scrollTo({ top: t ? t.offsetTop : 0, behavior: 'smooth' });
    });
  });

  /* intro: the title rises line by line, the panels open from the bottom */
  show();
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set('.hero__title', { clipPath: 'inset(0 0 -12% 0)' });
  intro.from('.nav > *', { y: -16, opacity: 0, duration: .9, stagger: .07 }, 0)
    .from('.hero__title .ln', { yPercent: 70, opacity: 0, duration: 1.2, stagger: .12 }, .1)
    .from('.hero__lead', { y: 20, opacity: 0, duration: 1 }, .4)
    .fromTo('.panel', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', stagger: .1 }, .45)
    .from('.shot', { yPercent: 18, scale: 1.12, duration: 1.8, stagger: .1 }, .5)
    .add(function () { gsap.set('.panel', { clearProps: 'clipPath' }); gsap.set('.hero__title', { clearProps: 'clipPath' }); });
  // the panels drift a little with the scroll
  gsap.to('.panel--laptop .lap', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.panels', start: 'top bottom', end: 'bottom top', scrub: .4 } });
  gsap.to('.panel--phone .iph', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.panels', start: 'top bottom', end: 'bottom top', scrub: .4 } });

  /* partners */
  gsap.from('.partners__label > *, .pl', { y: 26, opacity: 0, duration: .9, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.partners', start: 'top 85%', once: true } });

  /* pinned feature story */
  var mq = window.matchMedia('(max-width: 860px)');
  if (!mq.matches) {
    var fs1 = $('.fs--1'), fs2 = $('.fs--2');
    gsap.set(fs2, { autoAlpha: 0 });
    gsap.set('.fx__laptop', { autoAlpha: 0, xPercent: 90, yPercent: 80 });
    gsap.from('.feature__title', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.feature', start: 'top 75%', once: true } });
    gsap.from(fs1.children, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.feature', start: 'top 55%', once: true } });
    gsap.from('.tab', { x: -30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.feature', start: 'top 45%', once: true } });
    gsap.from('.fx__phone .iph', { yPercent: 70, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.feature', start: 'top 50%', once: true } });
    var story = gsap.timeline({ scrollTrigger: { trigger: '.feature', start: 'top top', end: 'bottom bottom', scrub: .6 } });
    story.to({}, { duration: .3 })
      .to(fs1, { autoAlpha: 0, y: -30, duration: .14 }, .3)
      .to('.fx__phone .iph', { yPercent: 125, autoAlpha: 0, duration: .25, ease: 'power2.in' }, .3)
      .to('.fx__laptop', { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: .3, ease: 'power2.out' }, .42)
      .fromTo(fs2, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .16 }, .46)
      .from('.checks li', { x: -24, opacity: 0, stagger: .03, duration: .12 }, .52)
      .to({}, { duration: .2 }, .8);
  }

  /* cta and footer */
  gsap.from('.cta', { scaleX: .92, opacity: .2, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 85%', once: true } });
  gsap.from('.cta h2, .cta__btns', { y: 34, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.cta', start: 'top 75%', once: true } });
  gsap.from('.foot__brand, .foot__cols > div, .foot__legal', { y: 26, opacity: 0, duration: .9, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.foot', start: 'top 90%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
