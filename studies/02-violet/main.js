/* Study 02 — motion layer: the framed site scrolls inside .win with Lenis; ScrollTrigger drives sticky scenes;
   canvases draw the dotted sphere (hero) and the drifting moiré waves. Without JS or with reduced motion the
   page shows a static, complete layout (scenes collapse to normal blocks). */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var scroller = document.getElementById('scroller');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  function show() { root.classList.remove('js-intro'); }

  /* ------------------------------------------------------------ frame toggle (works without GSAP) */
  var toggle = $('.frame-toggle');
  try { if (localStorage.getItem('s02:noframe') === '1') root.classList.add('no-frame'); } catch (e) {}
  function syncToggle() {
    var off = root.classList.contains('no-frame');
    toggle.setAttribute('aria-pressed', String(off));
    toggle.querySelector('span').textContent = off ? 'Framed view' : 'Full view';
    toggle.title = off ? 'Show the page in its neon frame' : 'Show the page without the frame';
  }
  syncToggle();
  toggle.addEventListener('click', function () {
    root.classList.toggle('no-frame');
    try { localStorage.setItem('s02:noframe', root.classList.contains('no-frame') ? '1' : '0'); } catch (e) {}
    syncToggle();
    setTimeout(function () { resizeCanvases(); if (ST) ST.refresh(); }, 950);
  });

  /* ------------------------------------------------------------ canvases */
  var canvases = [];
  function fit(c) {
    var r = c.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * DPR)), h = Math.max(1, Math.round(r.height * DPR));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }
  function resizeCanvases() { canvases.forEach(function (o) { fit(o.c); o.draw(o.t || 0); }); }

  // dotted cushion-shaped sphere lit from above (hero): a shaded body under a dense mesh of dots
  function sphere(c) {
    var g = c.getContext('2d'), N = 5200, pts = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var k = 1 / Math.pow(Math.pow(Math.abs(x), 2.3) + Math.pow(Math.abs(y), 2.3) + Math.pow(Math.abs(z), 2.3), 1 / 2.3);
      pts.push([x * k, y * k, z * k]);
    }
    return function (t) {
      var W = c.width, H = c.height; g.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H * .5, RX = W * .43, RY = H * .41;
      var halo = g.createRadialGradient(cx, cy - RY * .2, RX * .2, cx, cy, RX * 1.25);
      halo.addColorStop(0, 'rgba(150,110,255,.35)'); halo.addColorStop(1, 'rgba(80,40,200,0)');
      g.fillStyle = halo; g.fillRect(0, 0, W, H);
      // body: a rounded superellipse lit from the top
      g.save(); g.beginPath();
      for (var s = 0; s <= 120; s++) {
        var a = s / 120 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        var px = cx + RX * Math.sign(ca) * Math.pow(Math.abs(ca), .86), py = cy + RY * Math.sign(sa) * Math.pow(Math.abs(sa), .86);
        s ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
      var body = g.createLinearGradient(0, cy - RY, 0, cy + RY);
      body.addColorStop(0, '#7458E2'); body.addColorStop(.3, '#4C31BC'); body.addColorStop(.65, '#2C1886'); body.addColorStop(1, '#170D52');
      g.fillStyle = body; g.fill(); g.clip();
      var a1 = t * .00005, c1 = Math.cos(a1), s1 = Math.sin(a1), tx = -.38, ct = Math.cos(tx), st2 = Math.sin(tx);
      for (var j = 0; j < N; j++) {
        var p = pts[j];
        var x1 = p[0] * c1 + p[2] * s1, z1 = -p[0] * s1 + p[2] * c1, y1 = p[1];
        var y2 = y1 * ct - z1 * st2, z2 = y1 * st2 + z1 * ct;
        if (z2 < 0) continue;
        var nl = Math.hypot(x1, y2, z2) || 1;
        var light = Math.max(0, (-y2 * .8 + z2 * .5 - x1 * .12) / nl);
        var b = .12 + .88 * Math.pow(light, 1.3);
        var sx = cx + x1 / 1.12 * RX, sy = cy + y2 / 1.12 * RY;
        var sz = (1.3 + z2 * 1.9) * (W / 1360);
        g.fillStyle = 'rgba(' + Math.round(175 + 80 * b) + ',' + Math.round(160 + 95 * b) + ',255,' + (.38 + .62 * b * (.4 + .6 * z2)).toFixed(3) + ')';
        g.beginPath(); g.arc(sx, sy, Math.max(.6, sz), 0, Math.PI * 2); g.fill();
      }
      var sheen = g.createRadialGradient(cx - RX * .1, cy - RY * .75, 0, cx, cy - RY * .5, RX * .9);
      sheen.addColorStop(0, 'rgba(225,210,255,.3)'); sheen.addColorStop(1, 'rgba(225,210,255,0)');
      g.fillStyle = sheen; g.fillRect(0, 0, W, H);
      var shade = g.createLinearGradient(0, cy, 0, cy + RY);
      shade.addColorStop(0, 'rgba(10,5,40,0)'); shade.addColorStop(1, 'rgba(10,5,40,.55)');
      g.fillStyle = shade; g.fillRect(0, 0, W, H);
      g.restore();
    };
  }
  // warped neon stripes; opt.dir 'v' = stripes run vertically, 'd' = diagonal; opt.mask = soft shape
  function moire(c, opt) {
    var g = c.getContext('2d');
    return function (t) {
      var W = c.width, H = c.height; g.clearRect(0, 0, W, H);
      var ph = t * .00035 * (opt.speed || 1), gap = (opt.gap || 15) * DPR * (W / (opt.base || 600) / DPR);
      g.save();
      var grad = g.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, opt.c1 || '#3A2BFF'); grad.addColorStop(1, opt.c2 || '#9B4BFF');
      g.strokeStyle = grad; g.lineWidth = gap * (opt.lw || .46); g.lineCap = 'round';
      var n = Math.ceil((opt.dir === 'd' ? W + H : W) / gap) + 4;
      for (var i = -2; i < n; i++) {
        g.beginPath();
        for (var s = 0; s <= 60; s++) {
          var u = s / 60, x, y;
          if (opt.dir === 'd') {
            var base = i * gap - H;
            x = base + u * (W + H); y = u * H * 1.1 - H * .05;
            var w = (Math.sin(u * 4.2 + ph + i * .33) * gap * 1.9 + Math.sin(u * 9.5 - ph * 1.3 + i * .12) * gap * 1.05 + Math.sin(i * .21 + ph * .5 + u * 1.7) * gap * 1.4) * (opt.amp || 1);
            x += w; y -= w * .4;
          } else {
            y = u * H; x = i * gap + Math.sin(u * 4.6 + ph + i * .2) * gap * 2.4 + Math.sin(u * 9.5 - ph * .8 + i * .07) * gap;
          }
          s ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.globalCompositeOperation = 'destination-in';
      opt.mask(g, W, H);
      g.restore();
    };
  }
  function blobMask(parts) {
    // union of soft lobes, painted on an offscreen canvas and applied as one destination-in mask
    var m = document.createElement('canvas');
    return function (g, W, H) {
      if (m.width !== W || m.height !== H) { m.width = W; m.height = H; }
      var mg = m.getContext('2d');
      mg.clearRect(0, 0, W, H);
      mg.globalCompositeOperation = 'lighter';
      parts.forEach(function (p) {
        var r = p[2] * Math.min(W, H);
        var gr = mg.createRadialGradient(p[0] * W, p[1] * H, r * (p[3] || .2), p[0] * W, p[1] * H, r);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.6, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        mg.fillStyle = gr; mg.fillRect(0, 0, W, H);
      });
      g.drawImage(m, 0, 0);
    };
  }
  var hs = $('.hero__sphere');
  if (hs) canvases.push({ c: hs, draw: sphere(hs) });
  var tr = $('.moire--tr'), bl = $('.moire--bl'), mb = $('.moire--blob');
  if (tr) canvases.push({ c: tr, draw: moire(tr, { dir: 'v', gap: 15, base: 520, speed: 1, mask: blobMask([[1, 0, 1.1, .05]]) }) });
  if (bl) canvases.push({ c: bl, draw: moire(bl, { dir: 'v', gap: 15, base: 470, speed: -.8, c1: '#5A2BFF', c2: '#2A22E8', mask: blobMask([[0, 1, 1.1, .05]]) }) });
  if (mb) canvases.push({ c: mb, draw: moire(mb, { dir: 'd', gap: 22, lw: .36, base: 1000, speed: .9, amp: 2.3, c1: '#2E22F0', c2: '#9C46FF', mask: blobMask([[.26, .33, .27, .15], [.6, .63, .37, .15]]) }) });
  canvases.forEach(function (o) { fit(o.c); o.draw(0); o.on = false; });
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { canvases.forEach(function (o) { if (o.c === e.target) o.on = e.isIntersecting; }); }); }, { root: scroller, rootMargin: '120px' });
    canvases.forEach(function (o) { io.observe(o.c); });
    (function loop(t) { canvases.forEach(function (o) { if (o.on) { o.t = t; o.draw(t); } }); requestAnimationFrame(loop); })(0);
  }
  window.addEventListener('resize', function () { resizeCanvases(); });

  if (reduce || !gsap || !ST) { show(); return; }

  /* ------------------------------------------------------------ smooth scroll inside the window */
  root.classList.add('js-motion');
  gsap.registerPlugin(ST);
  ST.defaults({ scroller: scroller });
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ wrapper: scroller, content: scroller.firstElementChild, lerp: .09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  scroller.setAttribute('tabindex', '-1');
  try { scroller.focus({ preventScroll: true }); } catch (e) {}
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else scroller.scrollTo({ top: t ? t.offsetTop : 0, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------ helpers */
  function chars(el) {
    var span = el.querySelector('span') || el;
    var txt = span.textContent;
    span.textContent = '';
    var out = [];
    txt.split('').forEach(function (ch) {
      if (ch === ' ') { span.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; span.appendChild(s); out.push(s);
    });
    return out;
  }
  function words(el) {
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = '';
    var out = [];
    parts.forEach(function (p) {
      if (!p) return;
      if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); return; }
      var s = document.createElement('span'); s.className = 'w'; s.textContent = p; el.appendChild(s); out.push(s);
    });
    return out;
  }
  function fromMiddle(list) { var m = (list.length - 1) / 2; return function (i) { return Math.abs(i - m) / m; }; }
  var U = function () { return scroller.clientWidth / (window.innerWidth <= 760 ? 760 : 1440); };

  /* ------------------------------------------------------------ hero: intro, then dissolve on scroll */
  show();
  var heroChars = chars($('.hero__word'));
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.nav', { y: -24, opacity: 0, duration: 1 }, .1)
    .from(heroChars, { yPercent: 60, opacity: 0, filter: 'blur(14px)', duration: 1.3, stagger: { each: .045, from: 'center' } }, .15)
    .from('.hero__sub', { y: 14, opacity: 0, duration: 1 }, .6)
    .from('.hero__sphere', { scale: .8, opacity: 0, duration: 1.8 }, .2)
    .from('.hero__ph', { y: 220, opacity: 0, rotation: 8, duration: 1.6 }, .35)
    .from('.wait', { x: 40, opacity: 0, duration: 1.1 }, .8);
  var heroOut = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 } });
  // scroll tweens on elements the intro also animates start from explicit values (never from the intro's from-state)
  heroOut.fromTo(heroChars, { yPercent: 0, opacity: 1, filter: 'blur(0px)' }, { yPercent: -30, opacity: 0, filter: 'blur(16px)', ease: 'none', stagger: { each: .02, from: 'center' }, duration: .55, immediateRender: false }, 0)
    .fromTo('.hero__sub', { y: 0, opacity: 1 }, { y: -40, opacity: 0, ease: 'none', duration: .4, immediateRender: false }, 0)
    .fromTo('.hero__ph', { yPercent: 0 }, { yPercent: -36, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.wait', { y: 0 }, { y: -90, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__sphere', { yPercent: 0, scale: 1, opacity: 1 }, { yPercent: -18, scale: .92, opacity: .4, ease: 'none', duration: 1, immediateRender: false }, 0);
  var nav = $('.nav');
  ST.create({ trigger: '.hero', start: 'top top', end: 'bottom 12%', onToggle: function (s) { nav.classList.toggle('is-light', s.isActive); } });
  nav.classList.add('is-light');
  ST.create({ start: 0, end: 'max', onUpdate: function (s) { nav.style.setProperty('--p', s.progress.toFixed(4)); } });

  /* ------------------------------------------------------------ seed: circles gather into the flower and dock in the nav */
  var seedSvg = $('.seed__svg');
  var R = 20, ring = [[0, 0]];
  for (var k = 0; k < 6; k++) ring.push([Math.cos(k * Math.PI / 3) * R, Math.sin(k * Math.PI / 3) * R]);
  var seedTl = gsap.timeline({ scrollTrigger: { trigger: '.seed', start: 'top bottom', end: 'bottom bottom', scrub: .5 } });
  ring.forEach(function (p, i) {
    var c = $('.s' + i, seedSvg);
    var ang = i ? (i - 1) * Math.PI / 3 + Math.PI / 6 : 0, far = i ? 150 : 0;
    gsap.set(c, { attr: { cx: Math.cos(ang) * far, cy: Math.sin(ang) * far + 150 } });
    seedTl.to(c, { attr: { cx: p[0], cy: p[1] }, ease: 'power2.inOut', duration: .55 }, 0);
  });
  gsap.set(seedSvg, { scale: 3.25 });
  seedTl.to('.seed__more', { opacity: 1, duration: .1 }, .56)
    .fromTo(seedSvg, { rotation: -20, scale: 3.25 }, { rotation: 40, scale: 1.6, ease: 'power1.inOut', duration: .2 }, .55)
    .to(seedSvg, { scale: .5, x: function () { return (499 - 720) * U(); }, y: function () { return 61 * U() - scroller.clientHeight / 2; }, opacity: 0, ease: 'power2.in', duration: .22 }, .75)
    .add(function () { var l = $('.nav__logo'); l.classList.remove('is-docked'); void l.offsetWidth; l.classList.add('is-docked'); }, .97)
    .set({}, {}, 1);

  /* ------------------------------------------------------------ manifesto */
  var mfLines = $$('.mf__line'), pills = $$('.mf__pill'), glyphs = $$('.glyph');
  var paraWords = words($('.mf__para'));
  var lastLine = $('.mf__line--3');
  gsap.set(pills, { width: 0, marginLeft: function () { return 12 * U(); }, marginRight: function () { return 12 * U(); }, opacity: 0 });
  // the lines rise into place while the section scrolls in (no empty screen between scenes)
  gsap.fromTo(mfLines, { y: function () { return 110 * U(); } }, { y: 0, ease: 'none', stagger: .08, scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'top top', scrub: .5 } });
  gsap.set('.moire--tr, .moire--bl', { opacity: 0 });
  var mf = gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: .6 } });
  mf.to('.moire--tr, .moire--bl', { opacity: 1, duration: .14 }, .04)
    .to(pills, { width: function () { return window.innerWidth <= 760 ? 80 : 162 * U(); }, marginLeft: function () { return window.innerWidth <= 760 ? 17 : 34 * U(); }, marginRight: function () { return window.innerWidth <= 760 ? 15 : 30 * U(); }, opacity: 1, ease: 'power2.inOut', stagger: .03, duration: .16 }, .14)
    .from(glyphs, { scale: .3, opacity: 0, stagger: .03, duration: .12 }, .22)
    .to('.mf__line--1, .mf__line--2, .mf__line--3 > .mf__w:first-child', { opacity: 0, y: function () { return -30 * U(); }, duration: .08 }, .5)
    .to('.moire--tr, .moire--bl', { opacity: 0, duration: .1 }, .5)
    .to(lastLine, {
      // the pill and Reality end at the reference spot; narrow windows keep them inside and below the paragraph
      x: function () { return Math.min(398 * U(), scroller.clientWidth - 20 - (lastLine.offsetLeft + lastLine.offsetWidth)); },
      y: function () { var p = $('.mf__para'); return Math.max(56 * U(), p.offsetTop + p.offsetHeight + 24 * U() - lastLine.offsetTop); },
      ease: 'power2.inOut', duration: .14 }, .52)
    .to('.mf__para', { opacity: 1, duration: .08 }, .6)
    .set({}, {}, 1);
  ST.create({ trigger: '.manifesto', start: 'top top', end: 'bottom bottom', onUpdate: function (s) {
    var p = gsap.utils.clamp(0, 1, (s.progress - .66) / .28), n = Math.round(p * paraWords.length);
    paraWords.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  } });

  /* ------------------------------------------------------------ upgrade your reality + drifting cards */
  var upA = chars($('.up__a')), upB = chars($('.up__b'));
  var cards = $$('.dc');
  var up = gsap.timeline({ scrollTrigger: { trigger: '.upgrade', start: 'top top', end: 'bottom bottom', scrub: .5 } });
  var upIn = { trigger: '.upgrade', start: 'top 92%', end: 'top 8%', scrub: .5 };
  gsap.from(upA, { yPercent: 80, opacity: 0, filter: 'blur(10px)', stagger: .04, ease: 'power3.out', scrollTrigger: upIn });
  gsap.from(upB, { yPercent: 60, opacity: 0, filter: 'blur(10px)', stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.upgrade', start: 'top 70%', end: 'top 0%', scrub: .5 } });
  cards.forEach(function (c) {
    var s = parseFloat(getComputedStyle(c).getPropertyValue('--s')) || 1;
    up.fromTo(c, { y: function () { return scroller.clientHeight * 1.1 * s; } }, { y: function () { return -scroller.clientHeight * 1.1 * s; }, ease: 'none', duration: 1 }, 0);
  });
  up.set({}, {}, 1);
  // the headline leaves with the stage and fades so the next section starts clean
  gsap.to('.up', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.upgrade', start: 'bottom bottom', end: function () { return '+=' + scroller.clientHeight * .55; }, scrub: .3 } });

  /* ------------------------------------------------------------ features */
  gsap.from('.ft', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.feats', start: 'top 70%', once: true } });
  gsap.from('.il__lines path', { strokeDasharray: 400, strokeDashoffset: 400, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.feats', start: 'top 55%', once: true } });

  /* ------------------------------------------------------------ stacked cards */
  var counters = $$('[data-count]').map(function (el) { var r = el.dataset.count.split(':'); return { el: el, a: +r[0], b: +r[1] }; });
  var st = gsap.timeline({ scrollTrigger: { trigger: '.stack', start: 'top bottom', end: 'bottom bottom', scrub: .5 } });
  st.fromTo('.sc--a', { scale: .82, y: function () { return 120 * U(); }, borderRadius: function () { return 60 * U(); } }, { scale: 1, y: 0, borderRadius: function () { return 30 * U(); }, ease: 'power2.out', duration: .3 }, 0)
    .fromTo('.phone--card', { y: function () { return 160 * U(); } }, { y: 0, ease: 'power2.out', duration: .32 }, .02)
    .fromTo('.sc--b', { y: function () { return scroller.clientHeight; } }, { y: 0, ease: 'power2.inOut', duration: .3 }, .55)
    .fromTo('.sc--a', { scale: 1, yPercent: 0, filter: 'brightness(1)' }, { scale: .9, yPercent: -9, filter: 'brightness(.5)', ease: 'power2.inOut', duration: .3, immediateRender: false }, .55)
    .fromTo('.dash', { x: function () { return 90 * U(); } }, { x: 0, ease: 'power2.out', duration: .3 }, .6)
    .set({}, {}, 1);
  ST.create({ trigger: '.stack', start: 'top top', end: 'bottom bottom', onUpdate: function (s) {
    var p = gsap.utils.clamp(0, 1, (s.progress - .45) / .55);
    counters.forEach(function (c) { c.el.textContent = Math.round(c.a + (c.b - c.a) * p); });
  } });

  /* ------------------------------------------------------------ wordmark */
  var markChars = chars($('.mark__word'));
  var mk = gsap.timeline({ scrollTrigger: { trigger: '.mark', start: 'top bottom', end: 'bottom top', scrub: .5 } });
  mk.from(markChars, { x: function () { return -60 * U(); }, opacity: 0, filter: 'blur(18px)', stagger: .02, duration: .2, ease: 'power2.out' }, .1)
    .from('.mark__tag', { y: 20, opacity: 0, duration: .12 }, .26)
    .from('.moire--blob', { scale: .7, opacity: 0, duration: .3 }, .05)
    .to(markChars, { y: function () { return -40 * U(); }, opacity: 0, filter: 'blur(16px)', stagger: { each: .015, from: 'center' }, duration: .18, ease: 'power2.in' }, .74)
    .to('.mark__tag', { opacity: 0, duration: .1 }, .74)
    .set({}, {}, 1);

  /* ------------------------------------------------------------ dream card and footer */
  var dr = gsap.timeline({ scrollTrigger: { trigger: '.dream', start: 'top bottom', end: 'top top', scrub: .5 } });
  dr.fromTo('.dream__card', { scaleX: .86, scaleY: .94, opacity: .4 }, { scaleX: 1, scaleY: 1, opacity: 1, ease: 'power2.out', duration: 1 }, 0)
    .fromTo('.dream__ph', { y: function () { return 260 * U(); }, rotation: 10 }, { y: 0, rotation: 0, ease: 'power2.out', duration: 1 }, 0)
    .from('.dream__copy > *', { y: 40, opacity: 0, stagger: .1, duration: .6 }, .3)
    .set({}, {}, 1);
  var footChars = chars($('.foot__word'));
  gsap.from(footChars, { yPercent: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .035, scrollTrigger: { trigger: '.foot', start: 'top 40%', once: true } });
  gsap.from('.foot__top > *, .foot__social li', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.foot', start: 'top 70%', once: true } });

  /* ------------------------------------------------------------ hero phone follows the pointer a little */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var hp = $('.hero__ph');
    gsap.set(hp, { transformPerspective: 1400 });
    var rx = gsap.quickTo(hp, 'rotationX', { duration: 1, ease: 'power3' }), ry = gsap.quickTo(hp, 'rotationY', { duration: 1, ease: 'power3' });
    $('.hero').addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      var r = this.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 10);
      rx(((e.clientY - r.top) / r.height - .5) * -8);
    });
    $('.hero').addEventListener('pointerleave', function () { rx(0); ry(0); });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('resize', function () { ST.refresh(); });
})();
