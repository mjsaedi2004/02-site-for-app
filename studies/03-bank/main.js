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
  root.classList.add('js-motion');

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

  /* ------------------------------------------------------------ hero phone: home -> send money and back (reference 0.6-2.5 s):
     the white home sheet slides down out of the screen, the dark header swaps to "Send money", then the white send sheet
     slides up from the bottom; the amount is typed, the slider is pulled, and it goes back the same way */
  var home = $('.scr--home'), send = $('.scr--send'), num = $('.snd__num'), heroPh = $('.phone--hero .ph');
  gsap.set('.snd__sheet', { yPercent: 102 });
  var loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.9, defaults: { ease: 'power3.inOut' } });
  loop.to('.scr--home .ph__sheet', { yPercent: 105, duration: .95, ease: 'power2.in' }, .2)
    .to('.scr--home .ph__top', { opacity: 0, duration: .3 }, .95)
    .set(send, { autoAlpha: 1 }, 1.05)
    .fromTo('.snd__top--dark', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, 1.1)
    .set(home, { autoAlpha: 0 }, 1.15)
    .add(function () { num.textContent = '450'; }, 1.2)
    .to('.snd__sheet', { yPercent: 0, duration: 1.05, ease: 'expo.out' }, 1.35)
    .add(function () { heroPh.classList.add('is-send'); }, 1.6)
    .fromTo('.snd__cards', { x: 120 }, { x: 0, duration: .9, ease: 'expo.out' }, 1.6)
    .fromTo('.snd__slide b', { x: 0 }, { x: function () { return $('.snd__slide').clientWidth - $('.snd__slide b').offsetWidth - 12; }, duration: .8 }, 3.6)
    // back home: the send sheet drops, the header swaps back, the home sheet rises
    .add(function () { heroPh.classList.remove('is-send'); }, 5.3)
    .to('.snd__sheet', { yPercent: 102, duration: .8, ease: 'power2.in' }, 5.3)
    .set(home, { autoAlpha: 1 }, 6.0)
    .to('.scr--home .ph__top', { opacity: 1, duration: .35 }, 6.05)
    .set(send, { autoAlpha: 0 }, 6.1)
    .set('.snd__slide b', { x: 0 }, 6.1)
    .to('.scr--home .ph__sheet', { yPercent: 0, duration: .95, ease: 'expo.out' }, 6.1);
  ST.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? loop.resume() : loop.pause(); } });

  /* ------------------------------------------------------------ about: title fills in, the wordmark is drawn, bubbles arrive */
  var tw = words($('.about__title'));
  gsap.set(tw, { color: '#C9C9C9' });
  gsap.to(tw, { color: '#111111', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 2%', scrub: .4 } });
  // the giant wordmark is drawn one letter after the other once the section is up, at its own pace (reference 4.0-7.0 s:
  // the page rests while the letters complete), and the bubbles pop in one by one beside it
  var g1 = prepDraw($$('.giant__g path')), g2 = prepDraw($$('.giant__shade path'));
  var draw = gsap.timeline({ paused: true });
  g1.forEach(function (p, i) { draw.to([p, g2[i]], { strokeDashoffset: 0, ease: 'power1.inOut', duration: .85 }, i * .62); });
  var bubs = $$('.bub');
  gsap.set(bubs, { scale: .6, opacity: 0, transformOrigin: '100% 100%' });
  bubs.forEach(function (b, i) { draw.to(b, { scale: 1, opacity: 1, duration: .8, ease: 'back.out(1.6)' }, .15 + i * .55); });
  ST.create({ trigger: '.about', start: 'top 30%', once: true, onEnter: function () { draw.play(); } });

  /* ------------------------------------------------------------ bento: pinned while the transactions scroll under a fixed
     focus slot (reference 9-13 s); the focused row turns dark and pops out past the phone's edges */
  var rows = $$('.lr'), lst = $('.lst'), hot = -1;
  function pitch() { return rows[1].offsetTop - rows[0].offsetTop; }
  function focus(i) {
    if (i === hot) return;
    var prev = rows[hot];
    hot = i;
    var cur = rows[hot];
    if (prev) { gsap.killTweensOf(prev); gsap.set(prev, { clearProps: 'backgroundColor' }); prev.classList.remove('is-hot'); gsap.to(prev, { scale: 1, duration: .45, ease: 'power3.out' }); }
    rows.forEach(function (r, k) { r.style.opacity = k < hot ? 0 : 1; });
    gsap.to(lst, { y: -hot * pitch(), duration: .7, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.fromTo(cur, { scale: 1, backgroundColor: '#9A9A9A' }, { scale: 1.16, backgroundColor: '#1A1A1A', duration: .6, ease: 'back.out(1.5)', delay: .25, onStart: function () { if (rows[hot] === cur) cur.classList.add('is-hot'); }, clearProps: 'backgroundColor' });
  }
  ST.create({ trigger: '.bento', start: 'top 78px', end: function () { return '+=' + window.innerHeight * 1.4; }, pin: true, anticipatePin: 1,
    onUpdate: function (s) { focus(Math.min(rows.length - 2, Math.floor(s.progress * (rows.length - 1)))); } });
  ST.create({ trigger: '.bento', start: 'top 75%', once: true, onEnter: function () { focus(0); } });
  gsap.from('.phone--list', { y: 160, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 80%', once: true } });
  gsap.from('.chart i', { scaleY: 0, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.bc--photo', start: 'top 80%', once: true } });
  gsap.from('.mc--bento', { rotate: -8, y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.bc--dark', start: 'top 75%', once: true } });
  gsap.to('.photo--track', { scale: 1.16, xPercent: 3, ease: 'none', scrollTrigger: { trigger: '.bc--photo', start: 'top bottom', end: 'bottom top', scrub: .5 } });

  /* ------------------------------------------------------------ faq title fills in like the about title */
  var fw = words($('.faq__title'));
  gsap.set(fw, { color: '#C9C9C9' });
  gsap.to(fw, { color: '#111111', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.faq', start: 'top 85%', end: 'top 35%', scrub: .4 } });
  gsap.from('.qa', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true } });
  // the reference arrives with every question closed and the second one opens a moment later
  var touched = false, auto = qas[1];
  qas.forEach(function (d) { d.querySelector('summary').addEventListener('click', function () { touched = true; }); });
  if (auto && auto.open) { auto.open = false; }
  ST.create({ trigger: '.faq', start: 'top 30%', once: true, onEnter: function () {
    setTimeout(function () { if (!touched && !auto.open) auto.querySelector('summary').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); touched = false; }, 900);
  } });
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
