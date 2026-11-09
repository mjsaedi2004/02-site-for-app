/* Study 03 — motion layer: Lenis smooth scroll, the stroke wordmark drawn in the header and across the about section,
   the hero phone cycling between home and send-money screens, the transaction list highlight, a smooth FAQ accordion
   and the 3D cards. The page is complete without it (no JS or reduced motion: everything drawn and still). */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function show() { root.classList.remove('js-intro'); }

  /* ------------------------------------------------------------ FAQ: one open at a time, height animated (works without GSAP too) */
  var qas = $$('.qa');
  qas.forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('p');
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      var opening = !d.open;
      qas.forEach(function (o) { if (o !== d && o.open) close(o); });
      opening ? open(d) : close(d);
    });
    function open(el) {
      el.open = true;
      var p = el.querySelector('p');
      if (!gsap || reduce) return;
      gsap.fromTo(p, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'height' });
    }
    function close(el) {
      var p = el.querySelector('p');
      if (!gsap || reduce) { el.open = false; return; }
      gsap.to(p, { height: 0, opacity: 0, duration: .4, ease: 'power3.inOut', onComplete: function () { el.open = false; gsap.set(p, { clearProps: 'height,opacity' }); } });
    }
    void body;
  });

  if (reduce || !gsap || !ST) { show(); return; }
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
      if (lenis) lenis.scrollTo(t, { offset: -78, duration: 1.2 }); else window.scrollTo({ top: t ? t.offsetTop : 0, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------ helpers */
  function prepDraw(paths) {
    return paths.map(function (p) { var l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l + ' ' + l, strokeDashoffset: l }); return p; });
  }
  function words(el) {
    var parts = el.textContent.split(/(\s+)/); el.textContent = '';
    return parts.filter(Boolean).map(function (w) {
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return null; }
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.appendChild(s); return s;
    }).filter(Boolean);
  }

  /* ------------------------------------------------------------ load intro: the logo draws itself, the hero settles */
  show();
  var logoPaths = prepDraw($$('.hd__logo path'));
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.hd > *:not(.hd__logo)', { y: -14, opacity: 0, duration: .9, stagger: .06 }, 0)
    .to(logoPaths, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut', stagger: .22 }, .15)
    .from('.photo--hero', { scale: 1.25, filter: 'blur(26px)', duration: 2.2, ease: 'power3.out' }, 0)
    .from('.hero__title span', { yPercent: 105, opacity: 0, duration: 1.2, stagger: .12 }, .35)
    .from('.stores .store', { y: 24, opacity: 0, duration: 1, stagger: .08 }, .7)
    .from('.phone--hero', { y: 260, rotation: 6, opacity: 0, duration: 1.6 }, .3);

  /* the hero photo keeps drifting slowly (a living texture) */
  gsap.to('.photo--hero', { xPercent: -3, yPercent: 2, scale: 1.1, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.2 });

  /* ------------------------------------------------------------ hero phone: home <-> send money */
  var home = $('.scr--home'), send = $('.scr--send'), num = $('.snd__num'), keys = $$('.snd__keys span');
  function press(i) { return function () { var k = keys[i]; if (!k) return; k.classList.add('hit'); setTimeout(function () { k.classList.remove('hit'); }, 180); }; }
  var loop = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 2.6, defaults: { ease: 'power3.inOut' } });
  loop.to('.scr--home .ph__sheet', { yPercent: -18, duration: 1.1 }, 1.4)
    .to(home, { autoAlpha: 0, duration: .45 }, 2.3)
    .fromTo(send, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .6 }, 2.4)
    .fromTo('.snd__cards', { x: 120 }, { x: 0, duration: .9, ease: 'expo.out' }, 2.5)
    .add(function () { num.textContent = '0'; }, 2.4)
    .add(press(3), 3.3).add(function () { num.textContent = '4'; }, 3.3)
    .add(press(4), 3.65).add(function () { num.textContent = '45'; }, 3.65)
    .add(press(10), 4.0).add(function () { num.textContent = '450'; }, 4.0)
    .fromTo('.snd__slide b', { x: 0 }, { x: function () { return $('.snd__slide').clientWidth - $('.snd__slide b').offsetWidth - 12; }, duration: .8 }, 4.7)
    .to(send, { autoAlpha: 0, duration: .45 }, 5.9)
    .set('.snd__slide b', { x: 0 }, 6.4)
    .to(home, { autoAlpha: 1, duration: .5 }, 6.0)
    .to('.scr--home .ph__sheet', { yPercent: 0, duration: 1 }, 6.1);
  ST.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? loop.resume() : loop.pause(); } });

  /* ------------------------------------------------------------ about: title fills in, the wordmark is drawn, bubbles arrive */
  var tw = words($('.about__title'));
  gsap.set(tw, { color: '#C9C9C9' });
  gsap.to(tw, { color: '#111111', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 25%', scrub: .4 } });
  var g1 = prepDraw($$('.giant__g path')), g2 = prepDraw($$('.giant__shade path'));
  var draw = gsap.timeline({ scrollTrigger: { trigger: '.about', start: 'top 62%', end: 'top 12%', scrub: .5 } });
  g1.forEach(function (p, i) { draw.to([p, g2[i]], { strokeDashoffset: 0, ease: 'none', duration: 1 }, i * .85); });
  $$('.bub').forEach(function (b, i) {
    gsap.from(b, { scale: .6, opacity: 0, transformOrigin: '100% 100%', duration: .9, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about', start: (35 - i * 6) + '% bottom', once: true }, delay: i * .12 });
  });

  /* ------------------------------------------------------------ bento: the transaction list highlight cycles */
  var rows = $$('.lr'), hot = -1;
  function nextHot() {
    var prev = rows[hot];
    hot = (hot + 1) % 4;
    var cur = rows[hot];
    if (prev) { gsap.to(prev, { scale: 1, duration: .5, ease: 'power3.out', onComplete: function () { prev.classList.remove('is-hot'); } }); }
    cur.classList.add('is-hot');
    gsap.fromTo(cur, { scale: 1 }, { scale: 1.16, duration: .55, ease: 'back.out(1.7)' });
  }
  var hotTimer = null;
  ST.create({ trigger: '.bento', start: 'top 70%', end: 'bottom top', onToggle: function (s) {
    if (s.isActive && !hotTimer) { nextHot(); hotTimer = setInterval(nextHot, 1700); }
    if (!s.isActive && hotTimer) { clearInterval(hotTimer); hotTimer = null; }
  } });
  gsap.from('.phone--list', { y: 160, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 80%', once: true } });
  gsap.from('.chart i', { scaleY: 0, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.bc--photo', start: 'top 80%', once: true } });
  gsap.from('.mc--bento', { rotate: -8, y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.bc--dark', start: 'top 75%', once: true } });
  gsap.to('.photo--track', { scale: 1.16, xPercent: 3, ease: 'none', scrollTrigger: { trigger: '.bc--photo', start: 'top bottom', end: 'bottom top', scrub: .5 } });

  /* ------------------------------------------------------------ faq title fills in like the about title */
  var fw = words($('.faq__title'));
  gsap.set(fw, { color: '#C9C9C9' });
  gsap.to(fw, { color: '#111111', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.faq', start: 'top 85%', end: 'top 35%', scrub: .4 } });
  gsap.from('.qa', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true } });
  gsap.from('.ask', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.faq', start: 'top 55%', once: true } });

  /* ------------------------------------------------------------ cards: they turn a little with the scroll and lean to the pointer */
  // the CSS pose stays on the cards; the scroll only moves two variables inside it (GSAP never owns the transform)
  // they settle exactly into the reference pose when the section reaches the header, then drift a little further
  var settle = { trigger: '.design', start: 'top bottom', end: 'top 78px', scrub: .6 };
  gsap.fromTo('.dcard--front', { '--sy': '140px', '--sr': '-7deg' }, { '--sy': '0px', '--sr': '0deg', ease: 'power1.out', scrollTrigger: settle });
  gsap.fromTo('.dcard--back', { '--sy': '240px', '--sr': '-4deg' }, { '--sy': '0px', '--sr': '0deg', ease: 'power1.out', scrollTrigger: settle });
  gsap.to('.dcard', { '--sy': '-50px', '--sr': '3deg', ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.design', start: 'top 78px', end: 'bottom top', scrub: .6 } });
  var stage = $('.design__stage');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = gsap.quickTo(stage, 'rotationY', { duration: 1, ease: 'power3' }), ty = gsap.quickTo(stage, 'rotationX', { duration: 1, ease: 'power3' });
    gsap.set(stage, { transformPerspective: 2000 });
    stage.addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      var r = stage.getBoundingClientRect();
      tx(((e.clientX - r.left) / r.width - .5) * 8); ty(((e.clientY - r.top) / r.height - .5) * -6);
    });
    stage.addEventListener('pointerleave', function () { tx(0); ty(0); });
  }
  gsap.from('.design__panel > *', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.design', start: 'top 65%', once: true } });

  /* ------------------------------------------------------------ footer */
  gsap.from('.ft__brand, .ft__cols > div, .ft__news', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.ft', start: 'top 85%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
