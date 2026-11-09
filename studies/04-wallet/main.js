/* Study 04 — motion layer: Lenis smooth scroll; the HODLERS intro with spinning coins; the pinned "send, receive"
   scene with depth-parallax token chips; the stats that light up with their illustration; the pinned phone whose
   screens slide while the copy changes; one-at-a-time FAQ. Without JS or with reduced motion the page is static and complete. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function show() { root.classList.remove('js-intro'); }

  /* ------------------------------------------------------------ FAQ (also without GSAP) */
  var qs = $$('.q');
  qs.forEach(function (d) {
    d.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault();
      var opening = !d.open;
      qs.forEach(function (o) { if (o !== d && o.open) close(o); });
      opening ? open(d) : close(d);
    });
  });
  function open(d) {
    d.open = true;
    if (!gsap || reduce) return;
    gsap.fromTo(d.querySelector('p'), { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .5, ease: 'power3.out', clearProps: 'height' });
  }
  function close(d) {
    if (!gsap || reduce) { d.open = false; return; }
    var p = d.querySelector('p');
    gsap.to(p, { height: 0, opacity: 0, duration: .35, ease: 'power3.inOut', onComplete: function () { d.open = false; gsap.set(p, { clearProps: 'height,opacity' }); } });
  }

  /* ------------------------------------------------------------ stats: the stat in the middle of the screen is lit (also without GSAP) */
  var stats = $$('.stat'), arts = $$('.art__img'), curStat = 0;
  function lightStat(i) {
    if (i === curStat && stats[i].classList.contains('is-on')) return;
    stats.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    var prev = arts[curStat], next = arts[i];
    curStat = i;
    if (gsap && !reduce) {
      arts.forEach(function (a) { if (a !== next && a !== prev) gsap.set(a, { opacity: 0 }); });
      if (prev !== next) gsap.to(prev, { opacity: 0, scale: .92, y: -16, duration: .4, ease: 'power2.in' });
      gsap.fromTo(next, { opacity: 0, scale: .86, y: 24, rotate: -4 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: .8, ease: 'back.out(1.6)', delay: prev !== next ? .2 : 0 });
    } else {
      arts.forEach(function (a, k) { a.style.opacity = k === i ? 1 : 0; });
    }
  }
  lightStat(0);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) lightStat(stats.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -45% 0px' });
    stats.forEach(function (s) { io.observe(s); });
  }

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
      if (lenis) lenis.scrollTo(t, { duration: 1.3 }); else window.scrollTo({ top: t ? t.offsetTop : 0, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------ hero intro */
  show();
  var title = $('.hero__title span');
  var letters = title.textContent.split('').map(function (ch) { return ch; });
  title.textContent = '';
  var chars = letters.map(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; title.appendChild(s); return s; });
  gsap.set(title, { clipPath: 'inset(0 -10% 0 -10%)' });
  var coins = $$('.coin');
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.nav > *', { y: -18, opacity: 0, duration: .9, stagger: .08 }, 0)
    .from('.hero__sub', { y: 16, opacity: 0, duration: .9 }, .15)
    .from(chars, { yPercent: 110, duration: 1.15, stagger: .06 }, .2)
    .from('.btn--hero', { y: 20, opacity: 0, duration: .9 }, .65)
    .from('.dev--l', { y: 380, rotate: -10, duration: 1.5 }, .45)
    .from('.dev--r', { y: 440, rotate: 14, duration: 1.6 }, .55)
    .from(coins, { scale: 0, rotation: function (i) { return i % 2 ? 180 : -180; }, opacity: 0, duration: 1.3, ease: 'back.out(1.5)', stagger: .07 }, .7)
    .add(function () { gsap.set(title, { clearProps: 'clipPath' }); });
  // coins keep floating and turning slowly (each at its own pace)
  coins.forEach(function (c, i) {
    gsap.to(c, { y: i % 2 ? -14 : 12, rotation: '+=' + (i % 2 ? 12 : -10), duration: 3.2 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 + i * .2 });
  });
  // scroll: the phones rise into the dark section, coins drift at different depths
  var heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 };
  gsap.to('.hero__phones', { y: function () { return -260 * innerWidth / 1440; }, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__title, .hero__sub, .btn--hero', { y: -90, opacity: .2, ease: 'none', scrollTrigger: heroST });
  coins.forEach(function (c, i) { gsap.to(c, { yPercent: -(60 + i * 35), ease: 'none', scrollTrigger: heroST }); });
  // the phone's live ticker in the hero
  var heroPrice = $('.dev--r .s-price'), hp = 3144;
  setInterval(function () { if (document.hidden) return; hp += Math.round((Math.random() - .45) * 4); heroPrice.textContent = '$' + Math.floor(hp / 1000) + ' ' + String(hp % 1000).padStart(3, '0'); }, 1800);

  /* ------------------------------------------------------------ send, receive, manage */
  var darkLines = $$('.dark__title > span');
  gsap.from(darkLines, { y: 120, opacity: 0, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.dark', start: 'top 85%', end: 'top 10%', scrub: .5 } });
  $$('.chip').forEach(function (c) {
    var d = parseFloat(c.style.getPropertyValue('--d')) || 1;
    gsap.fromTo(c, { y: 260 * d }, { y: -220 * d, ease: 'none', scrollTrigger: { trigger: '.dark', start: 'top bottom', end: 'bottom top', scrub: .5 } });
    gsap.to(c, { x: (Math.random() - .5) * 26 * d, duration: 3 + Math.random() * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });
  // pointer depth: near chips move more than far ones
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var chipList = $('.chips');
    var mx = gsap.quickTo(chipList, '--mx', { duration: .8, ease: 'power3' }), my = gsap.quickTo(chipList, '--my', { duration: .8, ease: 'power3' });
    $('.dark').addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      mx((e.clientX / innerWidth - .5) * 40); my((e.clientY / innerHeight - .5) * 30);
    });
  }

  /* ------------------------------------------------------------ steps: pinned phone and copy */
  var cps = $$('.cp'), screens = $$('.sp'), dots = $$('.pager i'), step = -1;
  gsap.set(screens, { yPercent: function (i) { return i ? 105 : 0; } });
  var buyAmt = $('.buy__amt'), keys = $$('.buy__keys span'), buyTl = null, livePrice = $('.live-price'), lp = 3143, tick = null;
  function typeBuy() {
    if (buyTl) buyTl.kill();
    buyAmt.textContent = '0';
    var press = function (i, val) { return function () { var k = keys[i]; k.classList.add('hit'); setTimeout(function () { k.classList.remove('hit'); }, 200); buyAmt.textContent = val; }; };
    buyTl = gsap.timeline({ delay: .5 }).add(press(0, '1'), 0).add(press(4, '15'), .45).add(press(10, '150'), .9).fromTo('.buy__go', { scale: 1 }, { scale: .96, duration: .12, yoyo: true, repeat: 1 }, 1.5);
  }
  function setStep(i) {
    if (i === step) return;
    var prev = step; step = i;
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    cps.forEach(function (c, k) {
      if (k === i) {
        c.classList.add('is-on');
        gsap.fromTo(c.children, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .07, overwrite: true });
      } else if (k === prev) {
        gsap.to(c.children, { y: -24, opacity: 0, duration: .35, ease: 'power2.in', overwrite: true, onComplete: function () { c.classList.remove('is-on'); } });
      } else c.classList.remove('is-on');
    });
    screens.forEach(function (s, k) {
      gsap.to(s, { yPercent: k < i ? -105 : k > i ? 105 : 0, duration: .9, ease: 'power3.inOut', overwrite: true });
    });
    if (i === 1) typeBuy();
    if (i === 2) gsap.fromTo('.sp--notes .nt', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'power3.out', stagger: .12, delay: .35 });
    if (i === 3) gsap.fromTo('.qr__code', { scale: .6, opacity: 0, rotate: -10 }, { scale: 1, opacity: 1, rotate: 0, duration: .9, ease: 'back.out(1.6)', delay: .35 });
    clearInterval(tick);
    if (i === 0) tick = setInterval(function () { lp += Math.round((Math.random() - .45) * 3); livePrice.textContent = Math.floor(lp / 1000) + ' ' + String(lp % 1000).padStart(3, '0'); }, 1400);
  }
  setStep(0);
  ST.create({ trigger: '.steps', start: 'top top', end: 'bottom bottom', onUpdate: function (s) { setStep(Math.min(3, Math.floor(s.progress * 4 * .999))); } });
  gsap.from('.sphone', { y: 200, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } });

  /* ------------------------------------------------------------ faq and footer */
  gsap.from('.q', { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true } });
  gsap.from('.faq__head > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true } });
  gsap.from('.foot__mail', { yPercent: 60, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 60%', once: true } });
  gsap.from('.soc', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.foot__soc', start: 'top 92%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
