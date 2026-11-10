/* NetRate × Design 1 — interactions and motion. Interactions (honesty panels, FAQ, download notes) work everywhere;
   the motion layer (Lenis smooth scroll, the load intro, scroll scenes, hover details) runs only when motion is allowed.
   The page is complete without it: no JS and reduced motion show the finished layout. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobile = window.matchMedia('(max-width: 860px)');
  var motion = !reduce && gsap && ST;
  function show() { root.classList.remove('js-intro'); }

  /* ============================================================ interactions (always) */
  // honesty: one panel open; hover or focus opens on wide screens, a tap opens on any screen
  var hp = $$('.hp__item'), hpTouched = false;
  function openCase(i) { hp.forEach(function (p, k) { p.classList.toggle('is-on', k === i); }); }
  hp.forEach(function (p, i) {
    p.addEventListener('click', function () { hpTouched = true; openCase(i); });
    p.addEventListener('focus', function () { hpTouched = true; openCase(i); });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hpTouched = true; openCase(i); } });
    if (finePointer) p.addEventListener('pointerenter', function () { hpTouched = true; openCase(i); });
  });
  // after release: the download buttons wait for the store links
  var toast = $('#toast'), toastT = null;
  $$('[data-store]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!toast) return;
      toast.textContent = 'The store links are added when the app is released.';
      toast.classList.add('is-on');
      clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
    });
  });

  /* phones: the menu (the floating header's copy of the button opens the same sheet) */
  var sheet = $('#msheet');
  function setMenu(open) {
    if (!sheet) return;
    sheet.hidden = !open;
    $$('.menu-btn').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu'); });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.menu-btn');
    if (btn) { setMenu(sheet.hidden); return; }
    if (sheet && !sheet.hidden && !e.target.closest('#msheet')) setMenu(false);
    if (e.target.closest && e.target.closest('#msheet a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* calculator: the app's order for any amount (fee rules from the app's ranked list) */
  var calcList = $('#calcList');
  var calcRows = calcList ? $$('li', calcList) : [];
  var fmt = function (n) { return Math.round(n).toLocaleString('en-GB'); };
  function calcGot(li, a) {
    var r = +li.dataset.rate, f = +li.dataset.fee, k = li.dataset.kind;
    if (k === 'fixed') return Math.max(0, a - f) * r;
    if (k === 'pct') return a * (1 - f / 100) * r;
    if (k === 'under') return (a < 1000 ? Math.max(0, a - f) : a) * r;
    return a * r;
  }
  var calcAnim = null; // set by the motion layer: animates the reorder and the numbers
  function calcUpdate(a) {
    var sorted = calcRows.map(function (li) { return { li: li, v: calcGot(li, a) }; }).sort(function (x, y) { return y.v - x.v; });
    var top = sorted[0].v || 1, low = sorted[sorted.length - 1].v, span = (top - low) || 1;
    var before = calcRows.map(function (li) { return li.getBoundingClientRect().top; });
    sorted.forEach(function (o, i) {
      calcList.appendChild(o.li);
      $('i', o.li).textContent = i + 1;
      o.li.style.setProperty('--w', (.18 + .82 * (o.v - low) / span).toFixed(4)); // the bars show the spread, not the whole amount
      var v = $('.v', o.li);
      if (calcAnim) calcAnim.num(v, o.v); else v.textContent = fmt(o.v);
    });
    if (calcAnim) calcAnim.move(calcRows, before);
    $('#calcHead').innerHTML = 'For <b>' + fmt(a) + '</b> pounds you get';
    var g = $('#calcGap');
    if (calcAnim) calcAnim.num(g, sorted[0].v - sorted[sorted.length - 1].v); else g.textContent = fmt(sorted[0].v - sorted[sorted.length - 1].v);
  }
  if (calcList) {
    var amtIn = $('#calcAmt'), quick = $$('.calc__quick button');
    var setPressed = function (a) { quick.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.a === a)); }); };
    amtIn.addEventListener('input', function () {
      var digits = amtIn.value.replace(/\D/g, '').slice(0, 6), a = Math.min(100000, +digits || 0);
      amtIn.value = a ? fmt(a) : '';
      setPressed(a);
      if (a >= 1) calcUpdate(a);
    });
    amtIn.addEventListener('blur', function () { if (!amtIn.value) { amtIn.value = '1,000'; setPressed(1000); calcUpdate(1000); } });
    quick.forEach(function (b) { b.addEventListener('click', function () { var a = +b.dataset.a; amtIn.value = fmt(a); setPressed(a); calcUpdate(a); }); });
    calcUpdate(1000);
  }

  if (!motion) { show(); return; }
  gsap.registerPlugin(ST);

  /* ============================================================ smooth scroll
     Lenis eases the wheel into a long, soft glide; touch keeps the phone's own momentum. */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function goTo(id) {
    var target = id === '#top' ? 0 : $(id);
    if (target === null) return false;
    var offset = id === '#top' ? 0 : -86;
    if (lenis) lenis.scrollTo(target, { offset: offset, duration: 1.5, easing: easeInOut });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-store')) return;
    var id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    if (goTo(id)) e.preventDefault();
  });

  /* ============================================================ helpers */
  function splitWords(el) {
    // wrap every word of the element's text (inside child spans too) in .w > span; svg and br stay as they are
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { if (n.tagName !== 'svg' && n.tagName !== 'BR') walk(n); return; }
        if (n.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = document.createElement('span'); w.className = 'w';
          var i = document.createElement('span'); i.textContent = p;
          w.appendChild(i); frag.appendChild(w); out.push(i);
        });
        n.parentNode.replaceChild(frag, n);
      });
    })(el);
    return out;
  }
  function onceIn(el, start, fn) { ST.create({ trigger: el, start: start, once: true, onEnter: fn }); }

  /* ============================================================ floating header: a capsule once the page leaves the
     top, with a thin line that fills as you read */
  var nav = $('.nav');
  var fl = nav.cloneNode(true);
  fl.classList.add('nav--float');
  fl.setAttribute('inert', '');
  fl.setAttribute('aria-hidden', 'true');
  $$('[id]', fl).forEach(function (n) { n.removeAttribute('id'); });
  var bar = document.createElement('i'); bar.className = 'bar'; fl.appendChild(bar);
  document.body.appendChild(fl);
  var setBar = gsap.quickSetter(bar, 'scaleX');
  ST.create({ start: 0, end: 'max', onUpdate: function (self) {
    var on = self.scroll() > 240;
    if (on !== fl.classList.contains('is-on')) {
      fl.classList.toggle('is-on', on);
      if (on) { fl.removeAttribute('inert'); fl.removeAttribute('aria-hidden'); } else { fl.setAttribute('inert', ''); fl.setAttribute('aria-hidden', 'true'); }
    }
    setBar(self.progress);
  } });

  /* ============================================================ load intro: the headline rises word by word and the app
     opens from its icon in the hero phone */
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
  var cta = $('.hero .email') || $('.hero .stores');
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .fromTo('.hero__map', { clipPath: 'circle(0% at 12% 40%)', opacity: .2 }, { clipPath: 'circle(140% at 12% 40%)', opacity: 1, duration: 2.4, ease: 'power2.inOut', clearProps: 'clipPath' }, 0)
    .from('.page .nav > *', { y: -16, opacity: 0, duration: .9, stagger: .07 }, .05)
    .from(words, { yPercent: 115, rotationX: -55, transformOrigin: '50% 100%', duration: 1.25, stagger: .05 }, .12)
    .from('.spark', { scale: 0, rotation: -135, duration: 1.2, ease: 'back.out(1.7)' }, .6)
    .from('.hero__lead', { y: 18, opacity: 0, duration: 1 }, .5)
    .fromTo(cta, { clipPath: 'inset(0% 100% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' }, .55)
    .from('.facts li', { y: 16, opacity: 0, duration: .8, stagger: .07 }, .8)
    .from('.hero__box', { opacity: 0, duration: .8, ease: 'power2.out' }, .05)
    .from('.phone--hero', { opacity: 0, duration: .7, ease: 'power2.out' }, .1)
    .from('.demo-tag--hero', { y: 12, opacity: 0, duration: .8 }, .9);
  gsap.to('.spark', { rotation: 90, scale: .84, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 1.6, delay: 2.4 });

  /* hero on scroll: the app's list scrolls inside the phone, the phone and its box part with a little depth */
  var hero = $('.hero');
  var heroST = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.phone--hero', { yPercent: -8, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__box', { yPercent: -3, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__map', { yPercent: 16, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__copy', { y: -40, ease: 'none', scrollTrigger: heroST });
  gsap.to('.phone--hero .scr__img', { yPercent: -28.7, ease: 'power1.inOut', scrollTrigger: { trigger: hero, start: 0, end: 'bottom 30%', scrub: .7 } });

  /* ============================================================ rates made clearer: the panel opens, the cards rise and
     each one plays its picture: offices sort themselves, an old rate expires, an alert sentence lights up */
  var panel = $('.easier__panel');
  gsap.fromTo(panel, { scale: .92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 98%', end: 'top 38%', scrub: true } });
  gsap.from('.easier__arcs circle', { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: panel, start: 'top 75%', once: true } });
  gsap.fromTo('.easier__arcs', { scale: .94 }, { scale: 1.14, transformOrigin: '50% 95%', ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
  var easierWords = splitWords($('.easier__title'));
  gsap.from(easierWords, { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });
  gsap.fromTo('.easier__title mark', { '--hl': 0 }, { '--hl': 1, duration: .9, ease: 'expo.inOut', delay: .45, scrollTrigger: { trigger: panel, start: 'top 72%', once: true } });
  gsap.from('.card', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.cards', start: 'top 88%', once: true } });
  $$('.card').forEach(function (card) {
    gsap.from($$('.card__rings circle', card), { scale: .7, opacity: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    gsap.fromTo($('.viz', card), { y: 18 }, { y: -18, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // a: the four offices, in the order they posted, sort themselves by Highest payout
  var rank = $$('.rank li');
  function sortRank() {
    gsap.timeline()
      .fromTo('.rank u', { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'expo.out', stagger: .08 })
      .to(rank, { '--slot': function (i, el) { return +el.dataset.r - 1; }, duration: 1, ease: 'power3.inOut', stagger: .05 }, .5);
  }
  function unsortRank() { gsap.set(rank, { '--slot': function (i) { return i; } }); }
  unsortRank(); // at rest the page shows them sorted; with motion they start in the order they posted
  onceIn('.card--a', 'top 62%', sortRank);
  $('.card--a').addEventListener('pointerenter', function () { if (finePointer) { unsortRank(); sortRank(); } });
  // b: the clock runs; the rate from yesterday fades and gets its label
  var ageViz = $('.viz--age'), old = $('.ages .is-old'), oldTag = $('.ages .is-old i');
  gsap.set(oldTag, { scale: 0, opacity: 0 });
  onceIn('.card--b', 'top 70%', function () {
    ageViz.classList.add('is-ticking');
    gsap.timeline({ delay: .5 })
      .from('.ages li', { x: -24, opacity: 0, duration: .8, ease: 'expo.out', stagger: .12 })
      .to(old, { opacity: .55, duration: 1, ease: 'power2.out' }, '+=.5')
      .to(oldTag, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2.2)' }, '-=.4');
  });
  // c: the alert sentence lights up word group by group, the bell rings, the notice arrives
  var chips = $$('.viz--alert .chip'), note = $('.note');
  chips.forEach(function (c) { c.classList.remove('is-on'); });
  gsap.set(note, { yPercent: -130, opacity: 0 });
  function playAlert() {
    chips.forEach(function (c) { c.classList.remove('is-on'); });
    gsap.set(note, { yPercent: -130, opacity: 0 });
    var tl = gsap.timeline();
    chips.forEach(function (c, i) { tl.add(function () { c.classList.add('is-on'); }, .3 + i * .45); });
    tl.fromTo('.bell svg', { rotation: 0 }, { rotation: 16, duration: .09, ease: 'sine.inOut', yoyo: true, repeat: 7 }, 1.75)
      .to(note, { yPercent: 0, opacity: 1, duration: .8, ease: 'back.out(1.4)' }, 2.1);
  }
  onceIn('.card--c', 'top 65%', playAlert);
  $('.card--c').addEventListener('pointerenter', function () { if (finePointer) playAlert(); });
  if (finePointer) {
    $$('.card').forEach(function (card) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(card, { transformPerspective: 1200 });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - .5) * 8); rx((py - .5) * -8);
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
    panel.addEventListener('pointermove', function (e) {
      var r = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', (e.clientX - r.left) + 'px'); panel.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ============================================================ kinetic band: the two lines slide against each other */
  var band = $('.band');
  gsap.fromTo('.band__row:not(.band__row--alt)', { xPercent: 0 }, { xPercent: -26, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: .4 } });
  gsap.fromTo('.band__row--alt', { xPercent: -26 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: .4 } });

  /* ============================================================ how it works: each card settles on top of the last;
     the cards underneath step back; each picture plays when its card arrives */
  var sc = $$('.sc');
  $$('.amt__v, .panel .type').forEach(function (t) { t.textContent = ' '; }); // typed in when they arrive
  gsap.from('.how .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.how', start: 'top 80%', once: true } });
  sc.forEach(function (card, i) {
    var next = sc[i + 1];
    if (next && !mobile.matches) {
      var shade = { trigger: next, start: 'top 85%', end: 'top 25%', scrub: true };
      gsap.fromTo(card, { scale: 1 }, { scale: .93, ease: 'none', scrollTrigger: shade });
      gsap.fromTo($('.sc__dim', card), { opacity: 0 }, { opacity: .16, ease: 'none', scrollTrigger: shade });
    }
    onceIn(card, 'top 70%', function () { playStep(i, card); });
  });
  function playStep(i, card) {
    if (i === 0) {
      var v = $('.amt__v', card), full = v.dataset.to, n = { k: 0 };
      gsap.to(n, { k: full.length, duration: .9, ease: 'none', delay: .3, onUpdate: function () { v.textContent = full.slice(0, Math.round(n.k)) || ' '; } });
      gsap.from($$('.chips span', card), { y: 14, opacity: 0, duration: .7, ease: 'expo.out', stagger: .08, delay: .9 });
    } else if (i === 1) {
      gsap.fromTo($$('.bars li', card), { '--g': 0 }, { '--g': 1, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .2 });
      gsap.from($$('.bars li', card), { x: 30, opacity: 0, duration: .8, ease: 'expo.out', stagger: .12, delay: .2 });
    } else if (i === 2) {
      gsap.from($('.office', card), { y: 24, opacity: 0, scale: .96, duration: .9, ease: 'expo.out', delay: .2 });
      gsap.from($$('.chips span, .otable tr', card), { y: 12, opacity: 0, duration: .7, ease: 'expo.out', stagger: .07, delay: .5 });
    } else {
      gsap.from($$('.acts span', card), { scale: .4, opacity: 0, duration: .8, ease: 'back.out(1.8)', stagger: .09, delay: .2 });
    }
  }

  /* ============================================================ the statement lights up word by word as you read;
     then a line draws itself under "never moves money" */
  var say = $('.say');
  var sayWords = splitWords($('.say__big'));
  gsap.fromTo(sayWords, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: say, start: 'top 78%', end: 'center 45%', scrub: true } });
  var line = $('.say__line path'), len = line.getTotalLength();
  gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: say, start: 'center 60%', end: 'center 35%', scrub: true } });
  gsap.from('.say__small', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.say__small', start: 'top 92%', once: true } });

  /* ============================================================ honesty: the panels rise; while nobody has chosen,
     they open one after another */
  gsap.from('.honest .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.honest', start: 'top 80%', once: true } });
  gsap.from(hp, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.hp', start: 'top 85%', once: true } });
  var hpTimer = null, hpI = 0;
  ST.create({ trigger: '.hp', start: 'top 70%', end: 'bottom 20%', onToggle: function (self) {
    clearInterval(hpTimer);
    if (self.isActive && !mobile.matches) hpTimer = setInterval(function () { if (hpTouched) { clearInterval(hpTimer); return; } hpI = (hpI + 1) % hp.length; openCase(hpI); }, 4200);
  } });

  /* ============================================================ showcase: the glass slides in, the phone leans into the
     pose of the owner's sample, the headline rises */
  var showBox = $('.show__box'), pShow = $('.p3d--show');
  gsap.from(showBox, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: showBox, start: 'top 92%', once: true } });
  gsap.timeline({ scrollTrigger: { trigger: showBox, start: 'top 85%', end: 'top 10%', scrub: .8 } })
    .fromTo(pShow, { '--rx': 26, '--ry': -52, '--rz': 22, '--ty': 260 }, { '--rx': 8, '--ry': -27, '--rz': 11, '--ty': 0, ease: 'power2.out', duration: 1 }, 0)
    .fromTo('.p3d--show .p3d__glint', { xPercent: -100 }, { xPercent: 100, ease: 'none', duration: .8 }, .25);
  gsap.fromTo('.show__slabs--back i', { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: showBox, start: 'top 80%', end: 'top 20%', scrub: .8 } });
  gsap.fromTo('.show__slabs--front i', { xPercent: 70 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: showBox, start: 'top bottom', end: 'bottom top', scrub: .6 } });
  gsap.from('.show__copy > *', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: showBox, start: 'top 60%', once: true } });
  gsap.from('.show__rule', { scaleX: 0, duration: 1, ease: 'expo.inOut', delay: .5, scrollTrigger: { trigger: showBox, start: 'top 60%', once: true } });
  gsap.fromTo(pShow, { '--sway': -1.4 }, { '--sway': 1.4, duration: 4.6, ease: 'sine.inOut', repeat: -1, yoyo: true });

  /* ============================================================ trust: the cards rise and their icons light up in turn */
  gsap.from('.trust .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.trust', start: 'top 80%', once: true } });
  var tcards = $$('.trust__grid li');
  gsap.from(tcards, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.trust__grid', start: 'top 85%', once: true } });
  onceIn('.trust__grid', 'top 65%', function () { tcards.forEach(function (li, i) { setTimeout(function () { li.classList.add('is-lit'); }, 300 + i * 160); }); });
  if (finePointer) tcards.forEach(function (li) {
    li.addEventListener('pointermove', function (e) { var r = li.getBoundingClientRect(); li.style.setProperty('--gx', (e.clientX - r.left) + 'px'); li.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
  });

  /* ============================================================ offices: the box opens, the panel types today's rate */
  var obox = $('.offices__box');
  gsap.from(obox, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: obox, start: 'top 92%', once: true } });
  gsap.from('.offices__copy > *, .offices__list li', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: obox, start: 'top 70%', once: true } });
  gsap.from('.panel', { y: 60, rotation: 3, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: obox, start: 'top 65%', once: true } });
  onceIn('.panel', 'top 70%', function () {
    $$('.panel .type').forEach(function (t, k) {
      var full = t.dataset.to, n = { k: 0 };
      t.textContent = ' ';
      gsap.to(n, { k: full.length, duration: .8, ease: 'none', delay: .6 + k * .7, onUpdate: function () { t.textContent = full.slice(0, Math.round(n.k)) || ' '; } });
    });
    gsap.fromTo('.panel__btn', { scale: 1 }, { scale: 1.05, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1, delay: 2.4 });
  });

  /* ============================================================ faq: one answer at a time, opening smoothly */
  gsap.from('.faq .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.faq', start: 'top 80%', once: true } });
  var qs = $$('.q');
  gsap.from(qs, { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.faq__list', start: 'top 85%', once: true } });
  /* the list keeps room for one open answer, so opening or closing never moves the page below it (nothing to re-measure);
     only the questions inside move, by transform (FLIP) */
  var faqList = $('.faq__list');
  function reserveFaq() {
    var was = qs.filter(function (q) { return q.open; });
    faqList.style.minHeight = '';
    qs.forEach(function (q) { q.open = false; });
    var base = faqList.offsetHeight, max = 0;
    qs.forEach(function (q) { q.open = true; max = Math.max(max, faqList.offsetHeight - base); q.open = false; });
    was.forEach(function (q) { q.open = true; });
    faqList.style.minHeight = (base + max) + 'px';
  }
  reserveFaq();
  var rT = null;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(reserveFaq, 200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveFaq);
  function toggleQ(d) {
    var opening = !d.open;
    var before = qs.map(function (el) { return el.getBoundingClientRect().top; });
    if (opening) qs.forEach(function (o) { if (o !== d) o.open = false; });
    d.open = opening;
    qs.forEach(function (el, i) {
      var dy = before[i] - el.getBoundingClientRect().top;
      if (Math.abs(dy) > .5) gsap.fromTo(el, { y: dy }, { y: 0, duration: .5, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
    });
    if (opening) gsap.fromTo($('p', d), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', delay: .05, clearProps: 'opacity,transform' });
  }
  qs.forEach(function (d) { $('summary', d).addEventListener('click', function (e) { e.preventDefault(); toggleQ(d); }); });

  /* ============================================================ the App Store phone: it turns into the reference pose,
     its glass catches the light, the screenshots slide by to the end of the page; then it breathes and leans toward
     the pointer */
  var soon = $('.soon'), p3d = $('.p3d--store');
  var soonWords = splitWords($('.soon__title'));
  gsap.from(soonWords, { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: soon, start: 'top 78%', once: true } });
  gsap.from('.soon__rings circle', { scale: .75, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: soon, start: 'top 70%', once: true } });
  gsap.timeline({ scrollTrigger: { trigger: soon, start: 'top 92%', end: function () { return mobile.matches ? 'top 12%' : 'top -6%'; }, scrub: .8, invalidateOnRefresh: true } })
    .fromTo(p3d, { '--rx': 62, '--ry': 54, '--rz': -16, '--ty': 300 }, { '--rx': 30.39, '--ry': 30.81, '--rz': -.68, '--ty': 0, ease: 'power2.out', duration: 1 }, 0)
    .fromTo('.p3d--store .p3d__glint', { xPercent: -100 }, { xPercent: 100, ease: 'none', duration: .7 }, .3)
    .fromTo('.soon__rings', { scale: .86, opacity: .4 }, { scale: 1, opacity: 1, transformOrigin: '50% 50%', ease: 'none', duration: 1 }, 0);
  gsap.fromTo('.as__track', { xPercent: 0 }, { xPercent: -48, ease: 'none', scrollTrigger: { trigger: soon, start: function () { return mobile.matches ? 'top 20%' : 'top 8%'; }, end: 'max', scrub: .8, invalidateOnRefresh: true } });
  gsap.fromTo('.as__strip', { x: 0 }, { x: function () { return -($('.as__strip').scrollWidth - $('.as__badges').clientWidth); }, ease: 'none', scrollTrigger: { trigger: soon, start: 'top 30%', end: 'max', scrub: .8, invalidateOnRefresh: true } });
  gsap.from('.demo-tag--soon, .stores--get', { y: 14, opacity: 0, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.demo-tag--soon', start: 'top 96%', once: true } });
  onceIn(soon, 'top 20%', function () { gsap.fromTo('.as__get', { scale: 1 }, { scale: 1.12, duration: .24, ease: 'power2.out', yoyo: true, repeat: 3, repeatDelay: .08, delay: .2 }); });
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

  /* ============================================================ footer: it opens from the top edge; the wordmark's
     outline draws itself and the light under it comes up as the page ends */
  gsap.from('.foot', { clipPath: 'inset(22% 0% 0% 0% round 37px 37px 0px 0px)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: '.foot', start: 'top 98%', once: true } });
  gsap.from('.foot__brand > *, .foot__cols > div, .foot__fine', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.foot', start: 'top 88%', once: true } });
  var marq = $('.marq__track');
  ST.create({ trigger: '.marq', start: 'top bottom', end: 'bottom top', onToggle: function (self) { marq.style.animationPlayState = self.isActive ? 'running' : 'paused'; } });
  gsap.from('.marq', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.marq', start: 'top 98%', once: true } });

  /* the home-screen panel: the picture settles, the words rise */
  gsap.from('.homes__box', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.homes__box', start: 'top 92%', once: true } });
  gsap.fromTo('.homes__img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.homes__box', start: 'top bottom', end: 'bottom 40%', scrub: true } });
  gsap.from('.homes__copy > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.homes__box', start: 'top 70%', once: true } });

  /* ============================================================ the problem: scattered messages sort themselves into one
     list (pinned on wide screens, scrubbed on phones) */
  var board = $('.why__board'), msgs = $$('.msg');
  if (board) {
    board.classList.add('is-messy');
    var kk = function () { return board.clientWidth / 700; };
    var whyTl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: .6 } });
    msgs.forEach(function (el, i) {
      var x0 = +el.dataset.x, y0 = +el.dataset.y;
      // wide: the scattered spot in the 700 × 600 board; phones: a smaller scatter around the full-width rows
      whyTl.fromTo(el, { x: function () { return mobile.matches ? (x0 - 200) / 700 * board.clientWidth * .35 : (x0 - 176) * kk(); },
        y: function () { return mobile.matches ? y0 / 600 * (board.clientHeight - 80) + 40 - (58 + i * 50) : (y0 - 86 - i * 66) * kk(); }, rotation: +el.dataset.r },
        { x: 0, y: 0, rotation: 0 }, i * .05);
    });
    var setMessy = function (self) { board.classList.toggle('is-messy', self.progress < .45); };
    if (!mobile.matches) ST.create({ trigger: '.why__stage', start: 'top top', end: '+=110%', pin: true, scrub: .6, animation: whyTl, invalidateOnRefresh: true, onUpdate: setMessy });
    else ST.create({ trigger: board, start: 'top 80%', end: 'center 45%', scrub: .6, animation: whyTl, invalidateOnRefresh: true, onUpdate: setMessy });
    gsap.from('.why__copy > *, .why__pts li', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.why', start: 'top 75%', once: true } });
  }

  /* ============================================================ calculator: rows move to their new places, numbers roll */
  if (calcList) {
    calcAnim = {
      num: function (el, to) {
        var from = +(el.textContent.replace(/\D/g, '')) || 0, o = { v: from };
        gsap.to(o, { v: to, duration: .6, ease: 'power3.out', overwrite: true, onUpdate: function () { el.textContent = fmt(o.v); } });
      },
      move: function (rows, before) {
        rows.forEach(function (li, i) {
          var dy = before[i] - li.getBoundingClientRect().top;
          if (Math.abs(dy) > .5) gsap.fromTo(li, { y: dy }, { y: 0, duration: .6, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
        });
      }
    };
    gsap.from('.calc__box', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.calc__box', start: 'top 90%', once: true } });
    gsap.from(calcRows, { x: 40, opacity: 0, duration: .8, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.calc__box', start: 'top 70%', once: true } });
    gsap.from('.calc .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.calc', start: 'top 80%', once: true } });
  }

  /* ============================================================ features: the chart draws itself; rate types, languages
     and themes change in turn while their tile is on screen */
  var bento = $('.bento');
  if (bento) {
    gsap.from('.bento .sec-head > *', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: bento, start: 'top 80%', once: true } });
    gsap.from('.tile', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.bento__grid', start: 'top 88%', once: true } });
    var cl = $('.chart__line'), cLen = cl.getTotalLength();
    gsap.fromTo(cl, { strokeDasharray: cLen, strokeDashoffset: cLen }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.tile--chart', start: 'top 80%', end: 'center 45%', scrub: .6 } });
    gsap.from('.chart__dot, .chart__t', { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)', stagger: .1, scrollTrigger: { trigger: '.tile--chart', start: 'center 50%', once: true } });
    var typeBtns = $$('.types span'), typeNums = $$('.types__nums b'), tI = 0, lI = 0, langs = $$('.lang p'), bTimer = null;
    var tick = function () {
      tI = 1 - tI;
      typeBtns.forEach(function (s, i) { s.classList.toggle('is-on', i === tI); });
      typeNums.forEach(function (b) { gsap.fromTo(b, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'power3.out', onStart: function () { b.textContent = tI ? b.dataset.b : b.dataset.a; } }); });
      lI = 1 - lI;
      langs.forEach(function (q, i) { q.classList.toggle('is-on', i === lI); });
    };
    ST.create({ trigger: '.bento__grid', start: 'top 85%', end: 'bottom 10%', onToggle: function (self) { clearInterval(bTimer); if (self.isActive) bTimer = setInterval(tick, 2600); } });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
