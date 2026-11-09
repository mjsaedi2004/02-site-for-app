/* NetRate × Design 1 — motion layer: Lenis smooth scroll, a short load intro (the app opens in the hero phone), scroll
   scenes (the app's list scrolls inside the hero phone, the dark panel opens, the store phone turns into its pose and its
   screenshots slide) and hover details. The page is complete without it: no JS and reduced motion show the finished
   layout. */
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
  var mobile = window.matchMedia('(max-width: 860px)');

  /* ------------------------------------------------------------ smooth scroll
     Lenis eases the wheel (a long, soft glide); touch keeps the phone's own momentum. */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.082, smoothWheel: true, wheelMultiplier: 0.92, touchMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function goTo(id) {
    var target = id === '#top' ? 0 : $(id);
    if (target === null) return false;
    var offset = id === '#how' ? -120 : 0;
    if (lenis) lenis.scrollTo(target, { offset: offset, duration: 1.5, easing: easeInOut });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    if (goTo(id)) e.preventDefault();
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

  /* ------------------------------------------------------------ floating header: a capsule once the page leaves the top,
     with a thin line that fills as you read */
  var nav = $('.nav');
  var fl = nav.cloneNode(true);
  fl.classList.add('nav--float');
  fl.setAttribute('inert', '');
  fl.setAttribute('aria-hidden', 'true');
  $$('[id]', fl).forEach(function (n) { n.removeAttribute('id'); });
  var bar = document.createElement('i'); bar.className = 'bar'; fl.appendChild(bar);
  document.body.appendChild(fl);
  ST.create({ start: 0, end: 'max', onUpdate: function (self) {
    var on = self.scroll() > 240;
    if (on !== fl.classList.contains('is-on')) {
      fl.classList.toggle('is-on', on);
      if (on) { fl.removeAttribute('inert'); fl.removeAttribute('aria-hidden'); } else { fl.setAttribute('inert', ''); fl.setAttribute('aria-hidden', 'true'); }
    }
    fl.style.setProperty('--p', self.progress.toFixed(4));
  } });

  /* ------------------------------------------------------------ load intro (above the fold) */
  show();
  var words = [];
  $$('.hero__title .ln > span').forEach(function (line) {
    Array.prototype.slice.call(line.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var m = document.createElement('span'); m.className = 'wd';
        var w = document.createElement('span'); w.className = 'wi'; w.textContent = part;
        m.appendChild(w); frag.appendChild(m); words.push(w);
      });
      line.replaceChild(frag, n);
    });
  });
  // the app opens in the hero phone: its icon on the app's ground, then the main screen grows out of it
  var heroScreen = $('.phone--hero .phone__screen');
  var launch = document.createElement('div');
  launch.className = 'launch';
  launch.innerHTML = '<img src="img/netrate-icon.webp" alt="" width="256" height="256">';
  heroScreen.appendChild(launch);

  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .fromTo('.hero__map', { clipPath: 'circle(0% at 12% 40%)', opacity: .2 }, { clipPath: 'circle(140% at 12% 40%)', opacity: 1, duration: 2.4, ease: 'power2.inOut', clearProps: 'clipPath' }, 0)
    .from('.page .nav > *', { y: -16, opacity: 0, duration: .9, stagger: .07 }, .05)
    .from(words, { yPercent: 115, rotationX: -55, transformOrigin: '50% 100%', duration: 1.25, stagger: .05, ease: 'expo.out' }, .12)
    .from('.spark', { scale: 0, rotation: -135, duration: 1.2, ease: 'back.out(1.7)' }, .6)
    .from('.hero__lead', { y: 18, opacity: 0, duration: 1 }, .5)
    .fromTo('.hero .email', { clipPath: 'inset(0% 100% 0% 0% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.1, ease: 'expo.inOut' }, .55)
    .from('.hero .email .btn', { xPercent: -40, opacity: 0, duration: .9 }, .95)
    .from('.facts li', { y: 16, opacity: 0, duration: .8, stagger: .07 }, .8)
    .from('.facts b', { yPercent: 60, duration: .9, stagger: .07 }, .85)
    .from('.hero__box', { scaleY: .72, opacity: 0, transformOrigin: '50% 100%', duration: 1.25 }, .2)
    .from('.phone--hero', { y: 110, rotationX: 16, transformPerspective: 1100, transformOrigin: '50% 100%', opacity: 0, duration: 1.5 }, .3)
    .from('.launch img', { scale: .6, opacity: 0, duration: .7, ease: 'back.out(1.6)' }, .55)
    .to('.launch img', { scale: 3.2, opacity: 0, duration: .55, ease: 'power3.in' }, 1.25)
    .to('.launch', { opacity: 0, duration: .4, ease: 'power2.out', onComplete: function () { launch.remove(); } }, 1.55)
    .from('.phone--hero .scr', { scale: .84, opacity: 0, transformOrigin: '50% 38%', duration: 1.1 }, 1.5)
    .from('.phone--hero .tabbar', { y: 26, opacity: 0, duration: .9 }, 1.8)
    .from('.demo-tag--hero', { y: 12, opacity: 0, duration: .8 }, 1.9)
    .add(function () { gsap.set('.hero .email', { clearProps: 'clipPath' }); });
  // the sparkle keeps a slow twinkle (a quarter turn lands on the same four-point shape)
  gsap.to('.spark', { rotation: 90, scale: .84, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 1.6, delay: 2.4 });

  /* ------------------------------------------------------------ hero on scroll: the app's list scrolls inside the phone
     (like a thumb on the screen), the phone and its box part with a little depth, the copy drifts up */
  var hero = $('.hero');
  var heroST = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.phone--hero', { yPercent: -8, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__box', { yPercent: -3, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__map', { yPercent: 16, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__copy', { y: -40, ease: 'none', scrollTrigger: heroST });
  // 430 of the render's 1,500 app pixels: the market card leaves and the offices pass under the tab bar
  gsap.to('.phone--hero .scr__img', { yPercent: -28.7, ease: 'power1.inOut', scrollTrigger: { trigger: hero, start: 0, end: 'bottom 30%', scrub: .7 } });
  var vis = $('.hero__visual');
  if (finePointer && vis) {
    gsap.set(vis, { transformPerspective: 1600, transformOrigin: '76% 46%' });
    var tiltX = gsap.quickTo(vis, 'rotationX', { duration: .9, ease: 'power3' });
    var tiltY = gsap.quickTo(vis, 'rotationY', { duration: .9, ease: 'power3' });
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

  /* ------------------------------------------------------------ rates made clearer */
  var panel = $('.easier__panel');
  gsap.fromTo(panel, { scale: .92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 98%', end: 'top 38%', scrub: true } });
  gsap.from('.easier__arcs circle', { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: panel, start: 'top 75%', once: true } });
  gsap.fromTo('.easier__arcs', { scale: .94 }, { scale: 1.14, transformOrigin: '50% 95%', ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
  var easierWords = splitWords($('.easier__title'));
  gsap.from(easierWords, { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });
  gsap.fromTo('.easier__title mark', { '--hl': 0 }, { '--hl': 1, duration: .9, ease: 'expo.inOut', delay: .45, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });

  /* ------------------------------------------------------------ the three cards */
  gsap.from('.card', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.cards', start: 'top 88%', once: true } });
  gsap.from('.cards__note', { y: 14, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.cards__note', start: 'top 95%', once: true } });
  $$('.card').forEach(function (card) {
    var down = card.classList.contains('card--b');
    gsap.fromTo($('.phone--card', card), { y: down ? -26 : 26 }, { y: down ? 26 : -26, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from($$('.card__rings circle', card), { scale: .7, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    ST.create({ trigger: card, start: 'top 70%', once: true, onEnter: function () { card.classList.add('is-in'); } });
  });

  if (finePointer) {
    $$('.card').forEach(function (card) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(card, { transformPerspective: 1200 });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - .5) * 9); rx((py - .5) * -9);
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
    panel.addEventListener('pointermove', function (e) {
      var r = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', (e.clientX - r.left) + 'px'); panel.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ------------------------------------------------------------ coming soon: the store phone
     It comes in turned away and low, and turns into the reference pose as the section arrives; meanwhile its glass
     catches the light and the store's screenshots slide. Once there it breathes a little and leans toward the pointer. */
  var soon = $('.soon'), p3d = $('.p3d');
  var soonWords = splitWords($('.soon__title'));
  gsap.from(soonWords, { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: soon, start: 'top 78%', once: true } });
  gsap.from('.soon__rings circle', { scale: .75, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: soon, start: 'top 70%', once: true } });
  gsap.timeline({ scrollTrigger: { trigger: soon, start: 'top 92%', end: function () { return mobile.matches ? 'top 12%' : 'top -6%'; }, scrub: .8, invalidateOnRefresh: true } })
    .fromTo(p3d, { '--rx': 62, '--ry': 54, '--rz': -16, '--ty': 300 }, { '--rx': 30.39, '--ry': 30.81, '--rz': -.68, '--ty': 0, ease: 'power2.out', duration: 1 }, 0)
    .fromTo(p3d, { '--sx': -110 }, { '--sx': 110, ease: 'none', duration: .7 }, .3)
    .fromTo('.soon__rings', { scale: .86, opacity: .4 }, { scale: 1, opacity: 1, transformOrigin: '50% 50%', ease: 'none', duration: 1 }, 0);
  // once the phone has arrived, the store's screenshots slide by as you read on to the end of the page
  gsap.fromTo('.st__track', { xPercent: 0 }, { xPercent: -36, ease: 'none', scrollTrigger: { trigger: soon, start: function () { return mobile.matches ? 'top 20%' : 'top 8%'; }, end: 'max', scrub: .8, invalidateOnRefresh: true } });
  gsap.from('.demo-tag--soon', { y: 14, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.demo-tag--soon', start: 'top 96%', once: true } });
  ST.create({ trigger: soon, start: 'top 20%', once: true, onEnter: function () {
    gsap.fromTo('.st__get', { scale: 1 }, { scale: 1.12, duration: .24, ease: 'power2.out', yoyo: true, repeat: 3, repeatDelay: .08, delay: .2 });
  } });
  // breathing: a slow sway on top of the pose (its own variable, so the scroll scene keeps the pose)
  gsap.fromTo(p3d, { '--sway': -1.6 }, { '--sway': 1.6, duration: 4.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
  if (finePointer) {
    var wx = gsap.quickTo(p3d, '--wx', { duration: 1, ease: 'power3' }), wy = gsap.quickTo(p3d, '--wy', { duration: 1, ease: 'power3' });
    soon.addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      var r = soon.getBoundingClientRect();
      wy(((e.clientX - r.left) / r.width - .5) * 10); wx(((e.clientY - r.top) / r.height - .5) * -6);
    });
    soon.addEventListener('pointerleave', function () { wx(0); wy(0); });
  }

  /* ------------------------------------------------------------ footer */
  // the footer is the last block: reveal it with a clip (a y offset would stretch the page until it ran)
  gsap.from('.foot', { clipPath: 'inset(22% 0% 0% 0% round 37px 37px 0px 0px)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: '.foot', start: 'top 98%', once: true } });
  gsap.from('.foot__brand > *, .foot__cols > div, .foot__fine', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.foot', start: 'top 88%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
