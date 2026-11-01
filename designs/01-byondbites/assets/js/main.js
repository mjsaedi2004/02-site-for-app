/* =========================================================
   Byondbites — Design 01 · motion & interactions
   GSAP 3 (ScrollTrigger, SplitText, DrawSVG, MotionPath) + Lenis
   ========================================================= */
(() => {
  'use strict';

  const D = window.BB_DATA;
  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, CustomEase, ScrollToPlugin);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const IMG = (n) => `assets/img/${n}.webp`;
  const isDesktop = () => window.innerWidth >= 1100;

  CustomEase.create('soft', '0.16, 1, 0.3, 1');
  CustomEase.create('inout', '0.77, 0, 0.175, 1');
  gsap.defaults({ ease: 'soft' });
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------------------------------------------------
     Smooth scroll
  --------------------------------------------------------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTarget = (target, offset = -84) => {
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const el = typeof target === 'string' ? $(target) : target;
      const top = typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#home' ? 0 : el, id === '#download' ? 0 : -84);
  });

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */
  function roundedPath(pts) {
    const n = pts.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1x = p0.x - p1.x, v1y = p0.y - p1.y, l1 = Math.hypot(v1x, v1y) || 1e-6;
      const v2x = p2.x - p1.x, v2y = p2.y - p1.y, l2 = Math.hypot(v2x, v2y) || 1e-6;
      const r = Math.max(0, Math.min(p1.r || 0, l1 / 2, l2 / 2));
      const ax = p1.x + (v1x / l1) * r, ay = p1.y + (v1y / l1) * r;
      const bx = p1.x + (v2x / l2) * r, by = p1.y + (v2y / l2) * r;
      d += `${i ? 'L' : 'M'}${ax.toFixed(1)},${ay.toFixed(1)}Q${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
    }
    return d + 'Z';
  }
  function catmull(points) {
    if (points.length < 2) return '';
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }
  // layout offset relative to an ancestor (ignores transforms)
  const offY = (el, anc) => { let y = 0; while (el && el !== anc) { y += el.offsetTop; el = el.offsetParent; } return y; };
  const relRect = (el, parent) => {
    const r = el.getBoundingClientRect(), p = parent.getBoundingClientRect();
    return { x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height, cx: r.left - p.left + r.width / 2, cy: r.top - p.top + r.height / 2, r: r.right - p.left, b: r.bottom - p.top };
  };
  const counter = (el, to, { dur = 1.6, dec = 0, delay = 0, sep = true } = {}) => {
    const o = { v: parseFloat((el.textContent || '0').replace(/,/g, '')) || 0 };
    return gsap.to(o, {
      v: to, duration: dur, delay, ease: 'power3.out',
      onUpdate: () => {
        const v = dec ? o.v.toFixed(dec) : Math.round(o.v);
        el.textContent = sep ? Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v;
      }
    });
  };
  function wrapWords(html, cls) {
    const tpl = document.createElement('div');
    tpl.innerHTML = html;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = cls;
            s.textContent = part;
            frag.appendChild(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(tpl);
    return tpl.innerHTML;
  }
  function onVisible(el, cb, opts = {}) {
    return ScrollTrigger.create({ trigger: el, start: opts.start || 'top bottom', end: opts.end || 'bottom top', onToggle: (self) => cb(self.isActive) });
  }

  /* ---------------------------------------------------------
     Hero shape (preloader morphs into the hero panel)
  --------------------------------------------------------- */
  const hero = $('.hero');
  const heroInner = $('.hero__inner');
  const heroSvg = $('.hero__bg');
  const heroClip = $('.hero__clip');
  const heroShape = { t: reduce ? 1 : 0, geo: null };

  function computeHeroGeo() {
    const W = hero.clientWidth;
    let H = hero.clientHeight;
    const desktop = isDesktop();
    const inset = clamp(W * 0.018, 10, 28);
    const marker = $('.hero__rect-end');
    let h1 = offY(marker, hero);
    if (desktop) {
      const cards = $('.hero__cards');
      h1 = Math.max(h1, offY(cards, hero) + cards.offsetHeight + 46);
    }
    const phones = $$('.hero__phone');
    let fb = H;
    if (desktop) {
      // place the bottom row below the panel, then size the phones to the free space
      const bottom = $('.hero__bottom');
      bottom.style.marginTop = '0px';
      const base = offY(bottom, hero);
      bottom.style.marginTop = `${Math.max(40, Math.round(h1 + 105 - base))}px`;
      H = hero.clientHeight;
      fb = H;
      const btns = $('.hero__btns');
      const btnBottom = offY(btns, hero) + btns.offsetHeight;
      const phoneW = clamp((H - 6 - btnBottom - 46) / 2.36, 160, 236);
      phones.forEach((p) => p.style.setProperty('--pw', `${phoneW.toFixed(1)}px`));
    } else {
      $('.hero__bottom').style.marginTop = '';
      phones.forEach((p) => p.style.removeProperty('--pw'));
      const ph = $('.hero__phones');
      fb = offY(ph, hero) + ph.offsetHeight;
    }
    const pw = W - inset * 2;
    heroShape.geo = {
      W, H, inset, h1, fb, cx: W / 2,
      topHalf: desktop ? pw * 0.26 : Math.min(pw * 0.49, 360),
      botHalf: desktop ? pw * 0.115 : Math.min(pw * 0.3, 220),
      r: desktop ? 30 : 22, rj: desktop ? 48 : 34, rb: desktop ? 34 : 24
    };
    heroSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    heroSvg.setAttribute('width', W);
    heroSvg.setAttribute('height', H);
    buildBeams();
  }
  function renderHero() {
    const g = heroShape.geo;
    if (!g) return;
    const e = heroShape.t;
    const vh = Math.min(window.innerHeight, g.H);
    const ins = g.inset * e;
    const top = ins, left = ins, right = g.W - ins;
    const h1 = lerp(vh, g.h1, e);
    const fb = lerp(vh, g.fb, e);
    heroClip.setAttribute('d', roundedPath([
      { x: left, y: top, r: g.r * e },
      { x: right, y: top, r: g.r * e },
      { x: right, y: h1, r: g.r * e },
      { x: g.cx + g.topHalf, y: h1, r: g.rj * e },
      { x: g.cx + g.botHalf, y: fb, r: g.rb * e },
      { x: g.cx - g.botHalf, y: fb, r: g.rb * e },
      { x: g.cx - g.topHalf, y: h1, r: g.rj * e },
      { x: left, y: h1, r: g.r * e }
    ]));
  }
  function buildBeams() {
    const g = heroShape.geo;
    const beams = $$('.beam');
    const defs = [
      [[g.W * 0.74, -10], [g.W * 0.84, g.h1 * 0.42], [g.W * 1.02, g.h1 * 0.64]],
      [[-10, g.h1 * 0.3], [g.W * 0.1, g.h1 * 0.62], [g.W * 0.27, g.h1 + 4]],
      [[g.cx - g.topHalf * 0.5, g.h1 - 40], [g.cx, g.h1 + (g.fb - g.h1) * 0.4], [g.cx + g.botHalf * 0.6, g.fb + 10]]
    ];
    beams.forEach((b, i) => {
      const [p0, p1, p2] = defs[i];
      b.setAttribute('d', `M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`);
    });
  }
  function animateBeams() {
    if (reduce) return;
    $$('.beam').forEach((b, i) => {
      const len = b.getTotalLength();
      gsap.set(b, { strokeDasharray: `${len * 0.18} ${len}`, strokeDashoffset: len * 0.18 });
      gsap.to(b, { strokeDashoffset: -len, duration: 5 + i * 1.4, ease: 'none', repeat: -1, delay: i * 1.3, repeatDelay: 1.5 + i });
    });
  }

  /* ---------------------------------------------------------
     Header / navigation
  --------------------------------------------------------- */
  const header = $('.header');
  const nav = $('.nav');
  const navPill = $('.nav__pill');
  function initHeader() {
    let lastY = 0;
    const onScroll = (y) => {
      header.classList.toggle('is-scrolled', y > 30);
      const goingDown = y > lastY;
      header.classList.toggle('is-hidden', goingDown && y > 420 && !document.body.classList.contains('menu-open'));
      lastY = y;
    };
    if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

    // hover pill
    $$('.nav > .nav__link, .lang__btn').forEach((link) => {
      link.addEventListener('mouseenter', () => {
        const nr = nav.getBoundingClientRect(), r = link.getBoundingClientRect();
        gsap.to(navPill, { x: r.left - nr.left, width: r.width, opacity: 1, duration: 0.5, ease: 'soft' });
      });
    });
    nav.addEventListener('mouseleave', () => gsap.to(navPill, { opacity: 0, duration: 0.35 }));

    // active link by section
    const map = { home: 0, recipes: 1, meal: 1, features: 2, why: 2, bmi: 3, how: 3, story: 4, testimonials: 4, faq: 5, download: 5, contact: 5 };
    const links = $$('.nav > .nav__link');
    Object.keys(map).forEach((id) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => { if (self.isActive) links.forEach((l, i) => l.classList.toggle('is-active', i === map[id])); }
      });
    });

    // language
    const lang = $('.lang');
    const langBtn = $('.lang__btn');
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !lang.classList.contains('is-open');
      lang.classList.toggle('is-open', open);
      langBtn.setAttribute('aria-expanded', open);
    });
    $$('.lang__menu button').forEach((b) => b.addEventListener('click', () => {
      $$('.lang__menu button').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      lang.classList.remove('is-open');
    }));
    document.addEventListener('click', (e) => { if (!lang.contains(e.target)) lang.classList.remove('is-open'); });

    // burger
    $('.burger').addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  }
  let menuTl = null;
  function openMenu() {
    document.body.classList.add('menu-open');
    $('.burger').setAttribute('aria-expanded', 'true');
    $('.mmenu').setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    menuTl && menuTl.kill();
    menuTl = gsap.timeline()
      .fromTo('.mmenu__bg', { clipPath: 'circle(0% at calc(100% - 50px) 50px)' }, { clipPath: 'circle(150% at calc(100% - 50px) 50px)', duration: 0.9, ease: 'inout' })
      .fromTo('.mmenu__nav a', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.8 }, 0.3)
      .fromTo('.mmenu__cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.6);
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    $('.burger').setAttribute('aria-expanded', 'false');
    $('.mmenu').setAttribute('aria-hidden', 'true');
    menuTl && menuTl.kill();
    menuTl = gsap.timeline({ onComplete: () => document.body.classList.remove('menu-open') })
      .to('.mmenu__nav a, .mmenu__cta', { opacity: 0, y: -10, duration: 0.25, stagger: 0.02 })
      .to('.mmenu__bg', { clipPath: 'circle(0% at calc(100% - 50px) 50px)', duration: 0.7, ease: 'inout' }, 0.1);
    lenis && lenis.start();
  }

  /* ---------------------------------------------------------
     Cursor + magnetic + tilt
  --------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || reduce) return;
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { if (!e.clientX && !e.clientY) return; dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const inter = t.closest('a, button, input, textarea, .tile, .select__list li, .rcard');
      const lab = t.closest('[data-cursor]');
      if (inter && !(inter.classList.contains('rcard') && lab)) {
        cur.classList.add('is-hover'); cur.classList.remove('is-label');
      } else if (lab) {
        label.textContent = lab.getAttribute('data-cursor');
        cur.classList.add('is-label'); cur.classList.remove('is-hover');
      } else {
        cur.classList.remove('is-hover', 'is-label');
      }
    });
  }
  function initMagnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, .45)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, .45)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
  function initTilt() {
    if (!finePointer || reduce) return;
    $$('[data-tilt]').forEach((el) => {
      const rX = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const rY = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rY((px - 0.5) * 12);
        rX((0.5 - py) * 10);
        el.style.setProperty('--gx', `${px * 100}%`);
        el.style.setProperty('--gy', `${py * 100}%`);
      });
      el.addEventListener('pointerleave', () => { rX(0); rY(0); });
    });
  }

  /* ---------------------------------------------------------
     Hero phones — live UI
  --------------------------------------------------------- */
  function typeLoop(el) {
    const words = el.getAttribute('data-words').split('|');
    let wi = 0;
    const run = () => {
      const w = words[wi % words.length];
      const o = { n: 0 };
      gsap.timeline({ onComplete: () => { wi++; run(); } })
        .to(o, { n: w.length, duration: w.length * 0.055, ease: 'none', onUpdate: () => { el.textContent = w.slice(0, Math.round(o.n)); } })
        .to(o, { n: 0, duration: w.length * 0.025, ease: 'none', delay: 1.6, onUpdate: () => { el.textContent = w.slice(0, Math.round(o.n)); } });
    };
    run();
  }
  function heroScreens() {
    const val = $('.gauge__val');
    gsap.fromTo(val, { drawSVG: '0%' }, { drawSVG: '69%', duration: 2.2, ease: 'power3.out' });
    counter($('.js-gauge-num'), 69, { dur: 2.2 });
    counter($('.js-bmi-num'), 25.7, { dur: 2.2, dec: 1 });
    typeLoop($('.js-type'));
  }

  /* ---------------------------------------------------------
     Hero connector lines
  --------------------------------------------------------- */
  let sparkTweens = [];
  function buildHeroLines(animate) {
    const svg = $('.hero__lines');
    if (!isDesktop()) return;
    const W = hero.clientWidth, H = hero.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const cl = relRect($('.eco-card--l'), hero), cr = relRect($('.eco-card--r'), hero);
    const pl = relRect($('.hero__phone--l'), hero), pr = relRect($('.hero__phone--r'), hero);
    const s1 = { x: cl.r - 6, y: cl.b - 30 }, e1 = { x: pl.x + pl.w * 0.24, y: pl.y + pl.h * 0.1 };
    const s2 = { x: cr.x + 6, y: cr.b - 30 }, e2 = { x: pr.r - pr.w * 0.24, y: pr.y + pr.h * 0.1 };
    const lL = $('.hero__line--l'), lR = $('.hero__line--r');
    lL.setAttribute('d', `M${s1.x},${s1.y} C${s1.x + 70},${s1.y + 6} ${e1.x - 60},${e1.y - 40} ${e1.x},${e1.y}`);
    lR.setAttribute('d', `M${s2.x},${s2.y} C${s2.x - 70},${s2.y + 6} ${e2.x + 60},${e2.y - 40} ${e2.x},${e2.y}`);
    sparkTweens.forEach((t) => t.kill());
    sparkTweens = [];
    if (animate) gsap.fromTo([lL, lR], { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut', stagger: 0.15 });
    else gsap.set([lL, lR], { drawSVG: '100%' });
    if (reduce) return;
    [['.hero__spark--l', lL], ['.hero__spark--r', lR]].forEach(([s, path], i) => {
      sparkTweens.push(gsap.timeline({ repeat: -1, delay: (animate ? 1.4 : 0) + i * 0.9, repeatDelay: 1.2 })
        .set(s, { opacity: 0 })
        .to(s, { opacity: 1, duration: 0.2 })
        .to(s, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.6, ease: 'power1.inOut' }, 0)
        .to(s, { opacity: 0, duration: 0.3 }, 1.35));
    });
  }

  function heroInteractions() {
    if (reduce) return;
    // scroll parallax
    gsap.to('.hero__copy', { yPercent: -22, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: true } });
    gsap.to('.hero__phones', { y: () => (isDesktop() ? 70 : 30), ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__glow', { attr: { x: 80 }, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (!finePointer) return;
    const rig = $('.hero__phones-rig');
    const ry = gsap.quickTo(rig, 'rotationY', { duration: 1.2, ease: 'power3' });
    const rx = gsap.quickTo(rig, 'rotationX', { duration: 1.2, ease: 'power3' });
    const cards = $('.hero__cards');
    const cx = gsap.quickTo(cards, 'x', { duration: 1.4, ease: 'power3' });
    const cy = gsap.quickTo(cards, 'y', { duration: 1.4, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 14); rx(-py * 8);
      if (isDesktop()) { cx(px * -14); cy(py * -10); }
    });
    hero.addEventListener('pointerleave', () => { ry(0); rx(0); cx(0); cy(0); });
  }

  /* ---------------------------------------------------------
     Preloader + intro
  --------------------------------------------------------- */
  function waitAssets() {
    const imgs = $$('.hero img').map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); })));
    return Promise.race([Promise.all([document.fonts.ready, ...imgs]), new Promise((r) => setTimeout(r, 4500))]);
  }
  function runPreloader() {
    return new Promise((resolve) => {
      const pre = $('.preloader');
      const count = $('.js-count', pre), bar = $('.preloader__bar i', pre);
      const letters = $$('.preloader__word span', pre), mark = $('.preloader__mark', pre);
      gsap.set(letters, { yPercent: 115 });
      gsap.set(mark, { scale: 0.4, opacity: 0, rotation: -25 });
      gsap.timeline()
        .to(mark, { scale: 1, opacity: 1, rotation: 0, duration: 1, ease: 'back.out(1.8)' })
        .to(letters, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.25);
      const prog = { v: 0 };
      const upd = () => { count.textContent = Math.round(prog.v); bar.style.transform = `scaleX(${prog.v / 100})`; };
      const climb = gsap.to(prog, { v: 82, duration: 1.5, ease: 'power2.out', onUpdate: upd });
      Promise.all([waitAssets(), new Promise((r) => setTimeout(r, 1500))]).then(() => {
        climb.kill();
        gsap.to(prog, {
          v: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: upd,
          onComplete: () => {
            gsap.timeline({ onComplete: resolve })
              .to(letters, { yPercent: -115, duration: 0.5, stagger: 0.02, ease: 'power3.in' })
              .to([mark, bar.parentElement, count.parentElement], { opacity: 0, y: -16, duration: 0.45, ease: 'power3.in' }, 0.05);
          }
        });
      });
    });
  }

  let heroSplit = null;
  function intro() {
    heroSplit = SplitText.create('.hero__title', { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    const subWords = SplitText.create('.hero__sub', { type: 'words' });
    const storySplit = SplitText.create('.hero__story-txt', { type: 'lines', mask: 'lines', linesClass: 'split-line' });

    gsap.set(heroSplit.lines, { yPercent: 115 });
    gsap.set(subWords.words, { opacity: 0, y: 14, filter: 'blur(6px)' });
    gsap.set('.hero__btns > *', { opacity: 0, y: 24 });
    gsap.set('.header__bar > *', { opacity: 0, y: -24 });
    gsap.set('.eco-card', { opacity: 0, y: 50, scale: 0.88, rotationX: 25, transformPerspective: 900 });
    gsap.set('.hero__phone--l', { y: 380, rotation: 4, opacity: 0 });
    gsap.set('.hero__phone--r', { y: 420, rotation: -4, opacity: 0 });
    gsap.set('.hero__phones-shadow', { opacity: 0, scale: 0.4 });
    gsap.set(storySplit.lines, { yPercent: 115 });
    gsap.set('.hero__story .btn, .hero__video > *', { opacity: 0, y: 30 });

    document.body.classList.remove('is-loading');
    hero.classList.add('has-shape');

    const tl = gsap.timeline({
      onComplete: () => {
        lenis && lenis.start();
        ScrollTrigger.refresh();
        buildHeroLines(true);
        heroScreens();
      }
    });
    tl.to(heroShape, { t: 1, duration: 1.6, ease: 'inout', onUpdate: renderHero }, 0)
      .to('.header__bar > *', { opacity: 1, y: 0, duration: 1, stagger: 0.07 }, 0.85)
      .to(heroSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.85)
      .to(subWords.words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.025 }, 1.1)
      .to('.hero__btns > *', { opacity: 1, y: 0, duration: 1, stagger: 0.1, clearProps: 'transform' }, 1.25)
      .to('.hero__phone--l', { y: 0, rotation: -17, opacity: 1, duration: 1.6, ease: 'expo.out' }, 1.0)
      .to('.hero__phone--r', { y: 0, rotation: 17, opacity: 1, duration: 1.6, ease: 'expo.out' }, 1.12)
      .to('.hero__phones-shadow', { opacity: 1, scale: 1, duration: 1.4 }, 1.3)
      .to('.eco-card', { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1.3, stagger: 0.14, ease: 'back.out(1.2)' }, 1.45)
      .to(storySplit.lines, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 1.6)
      .to('.hero__story .btn, .hero__video > *', { opacity: 1, y: 0, duration: 1, stagger: 0.1, clearProps: 'transform' }, 1.75);
    return tl;
  }

  /* ---------------------------------------------------------
     Generic reveals
  --------------------------------------------------------- */
  function initReveals() {
    $$('[data-split]').forEach((el) => {
      let done = false;
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit(self) {
          if (done || reduce) return;
          return gsap.from(self.lines, {
            yPercent: 115, rotation: 2, duration: 1.2, stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onComplete: () => { done = true; }
          });
        }
      });
    });
    if (reduce) return;
    const items = $$('[data-reveal]');
    gsap.set(items, { opacity: 0, y: 40 });
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, overwrite: true, clearProps: 'transform' })
    });
    gsap.to('.scroll-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  /* ---------------------------------------------------------
     Recipes carousel
  --------------------------------------------------------- */
  const Recipes = (() => {
    const stage = $('.carousel__stage');
    const dotsWrap = $('.dots');
    const chips = $$('.chip');
    const ind = $('.chips__ind');
    let list = [];
    let cards = [];
    const pos = { v: 0 };
    let target = 0;
    let tween = null;
    let auto = null;
    let inView = false;
    let hovering = false;
    let dragging = false;

    const spacing = () => (window.innerWidth < 720 ? 250 : window.innerWidth < 1100 ? 300 : 340);
    const nList = () => cards.length;
    const activeIdx = () => { const n = nList(); return ((Math.round(pos.v) % n) + n) % n; };

    function build(items) {
      list = items;
      stage.innerHTML = items.map((r) => `
        <article class="rcard" data-id="${r.id}">
          <div class="rcard__plate"><img src="${IMG(r.img)}" alt="${r.title}" draggable="false" loading="lazy"></div>
          <h3>${r.title}</h3>
          <p>${r.desc}</p>
          <div class="rcard__meta"><span class="rcard__time"><svg><use href="#i-clock"/></svg>${r.time}</span><span class="rcard__kcal">${r.kcal} kcal</span></div>
          <a href="#meal" class="rcard__link" data-id="${r.id}">View Recipe <svg><use href="#i-arrow-right"/></svg></a>
        </article>`).join('');
      cards = $$('.rcard', stage);
      dotsWrap.innerHTML = items.map((_, i) => `<button aria-label="Go to recipe ${i + 1}" data-i="${i}"></button>`).join('');
      pos.v = 0; target = 0;
      layout();
    }

    function layout() {
      const n = nList();
      if (!n) return;
      const sp = spacing();
      cards.forEach((c, i) => {
        let o = i - pos.v;
        o = ((o % n) + n) % n;
        if (o > n / 2) o -= n;
        const a = Math.abs(o);
        const x = Math.sign(o) * (a <= 1 ? a * sp : sp + (a - 1) * sp * 0.78);
        const s = a <= 1 ? lerp(1, 0.84, a) : lerp(0.84, 0.7, Math.min(a - 1, 1));
        const y = a <= 1 ? lerp(-28, 26, a) : 26 + (a - 1) * 24;
        const edge = clamp((n / 2 - a) / 0.5, 0, 1);
        const op = Math.min(a <= 1.15 ? 1 : clamp(1 - (a - 1.15) / 0.55, 0, 1), edge);
        gsap.set(c, { x, y, scale: s, zIndex: Math.round(100 - a * 10), opacity: op, visibility: op < 0.02 ? 'hidden' : 'visible' });
        gsap.set(c.firstElementChild, { rotation: o * -60 });
        c.classList.toggle('is-active', a < 0.5);
      });
      const ai = activeIdx();
      $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('is-on', i === ai));
    }

    function go(t, dur = 0.95) {
      target = t;
      tween && tween.kill();
      tween = gsap.to(pos, { v: target, duration: reduce ? 0 : dur, ease: 'power3.out', onUpdate: layout });
    }
    const next = () => go(Math.round(target) + 1);
    const prev = () => go(Math.round(target) - 1);
    function goIndex(i) {
      const n = nList(), cur = ((Math.round(target) % n) + n) % n;
      let diff = i - cur;
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
      go(Math.round(target) + diff);
    }

    function startAuto() {
      stopAuto();
      if (reduce) return;
      auto = gsap.delayedCall(4.2, () => { if (inView && !hovering && !dragging) next(); startAuto(); });
    }
    function stopAuto() { auto && auto.kill(); auto = null; }

    function moveInd(chip, instant) {
      gsap.to(ind, { x: chip.offsetLeft, y: chip.offsetTop, width: chip.offsetWidth, height: chip.offsetHeight, duration: instant ? 0 : 0.6, ease: 'soft' });
    }

    function filter(cat, chip) {
      chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on); });
      moveInd(chip);
      const items = cat === 'all' ? D.recipes.slice() : D.recipes.filter((r) => r.cats.includes(cat));
      const old = cards;
      gsap.to(old, {
        opacity: 0, y: '+=40', scale: '-=0.08', duration: 0.35, stagger: 0.03, ease: 'power2.in',
        onComplete: () => {
          build(items);
          const vis = cards.filter((c) => gsap.getProperty(c, 'opacity') > 0.02);
          gsap.from(vis, { opacity: 0, y: '+=60', duration: 0.9, stagger: 0.06, ease: 'soft' });
          gsap.from(vis.map((c) => c.firstElementChild), { rotation: '-=120', scale: 0.6, duration: 1.1, stagger: 0.06, ease: 'back.out(1.4)' });
        }
      });
    }

    function initDrag() {
      let sx = 0, sv = 0, lastX = 0, lastT = 0, vx = 0, moved = false, pid = null;
      const carousel = $('.carousel');
      carousel.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.carousel__arrow, .rcard__link')) return;
        dragging = true; moved = false; pid = e.pointerId;
        sx = lastX = e.clientX; lastT = performance.now(); sv = pos.v; vx = 0;
        tween && tween.kill();
      });
      window.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pid) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 4) moved = true;
        const now = performance.now();
        vx = (e.clientX - lastX) / Math.max(1, now - lastT);
        lastX = e.clientX; lastT = now;
        pos.v = sv - dx / spacing();
        layout();
      });
      const end = (e) => {
        if (!dragging || (e && e.pointerId !== pid)) return;
        dragging = false;
        if (!moved) { pos.v = sv; return; }
        go(Math.round(pos.v - vx * 2.2), 0.8);
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      carousel.addEventListener('click', (e) => {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
        const card = e.target.closest('.rcard');
        if (card && !card.classList.contains('is-active') && !e.target.closest('.rcard__link')) goIndex(cards.indexOf(card));
      }, true);
    }

    function init() {
      build(D.recipes.slice());
      requestAnimationFrame(() => moveInd(chips[0], true));
      $('.carousel__arrow--next').addEventListener('click', next);
      $('.carousel__arrow--prev').addEventListener('click', prev);
      dotsWrap.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goIndex(+b.dataset.i); });
      chips.forEach((c) => c.addEventListener('click', () => { if (!c.classList.contains('is-active')) filter(c.dataset.cat, c); }));
      stage.addEventListener('click', (e) => {
        const link = e.target.closest('.rcard__link');
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        const r = D.recipes.find((x) => x.id === link.dataset.id);
        if (r) Meal.setRecipe(r, true);
        scrollToTarget('#meal', -40);
      });
      const carousel = $('.carousel');
      carousel.addEventListener('mouseenter', () => { hovering = true; });
      carousel.addEventListener('mouseleave', () => { hovering = false; });
      document.addEventListener('keydown', (e) => {
        if (!inView || e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      });
      initDrag();
      onVisible($('.recipes'), (v) => { inView = v; });
      startAuto();

      // entrance
      if (!reduce) {
        ScrollTrigger.create({
          trigger: '.carousel', start: 'top 85%', once: true,
          onEnter: () => {
            gsap.from(cards, { opacity: 0, y: '+=120', duration: 1.3, stagger: { each: 0.08, from: 'center' } });
            gsap.from(cards.map((c) => c.firstElementChild), { rotation: '-=160', scale: 0.5, duration: 1.6, stagger: { each: 0.08, from: 'center' }, ease: 'back.out(1.3)' });
            gsap.from('.carousel__arrow', { scale: 0, duration: 0.9, stagger: 0.1, ease: 'back.out(2)', delay: 0.4 });
          }
        });
      }
    }
    return { init, layout, moveInd: () => moveInd($('.chip.is-active'), true) };
  })();

  /* ---------------------------------------------------------
     Know your meal (tabs + phone)
  --------------------------------------------------------- */
  const Meal = (() => {
    const tabs = $$('.mtab');
    const ind = $('.meal__tabs-ind');
    const segBtns = $$('.rec__seg button');
    const segInd = $('.rec__seg-ind');
    const panes = $$('.rec__pane');
    const t1 = $('.meal__t1'), t2 = $('.meal__t2'), desc = $('.meal__desc-txt');
    let idx = 0;
    let recipe = D.recipes[0];
    let autoTl = null;
    let inView = false;
    let paused = false;

    function renderPanes() {
      const r = recipe;
      panes[0].innerHTML = r.ing.map(([n, q], i) => `<div class="ing-row${i < 3 ? ' will-ck' : ''}"><span class="ing-row__ck"><svg><use href="#i-check"/></svg></span><b>${n}</b><em>${q}</em></div>`).join('')
        + `<div class="rec__cta"><svg><use href="#i-cart"/></svg>Add missing to list</div>`;
      const tot = r.nut.p * 4 + r.nut.c * 4 + r.nut.f * 9;
      const pP = (r.nut.p * 4) / tot, pC = (r.nut.c * 4) / tot;
      const C = 2 * Math.PI * 28;
      panes[1].innerHTML = `
        <div class="nut">
          <div class="nut__ring"><svg viewBox="0 0 70 70"><circle cx="35" cy="35" r="28" stroke="#eef3f1"/>
            <circle class="nr nr-p" cx="35" cy="35" r="28" stroke="#1dcb98" stroke-dasharray="${C * pP - 3} ${C}" stroke-dashoffset="0"/>
            <circle class="nr nr-c" cx="35" cy="35" r="28" stroke="#ffb547" stroke-dasharray="${C * pC - 3} ${C}" stroke-dashoffset="${-C * pP}"/>
            <circle class="nr nr-f" cx="35" cy="35" r="28" stroke="#ff7a7f" stroke-dasharray="${C * (1 - pP - pC) - 3} ${C}" stroke-dashoffset="${-C * (pP + pC)}"/></svg>
            <div><b class="js-nut-kcal">${r.kcal}</b><small>kcal</small></div></div>
          <div class="nut__list">
            ${[['Protein', r.nut.p, '#1dcb98', 60], ['Carbs', r.nut.c, '#ffb547', 90], ['Fat', r.nut.f, '#ff7a7f', 45], ['Fiber', r.nut.fi, '#78b83a', 20]].map(([k, v, col, max]) => `
              <div class="nut__item"><div><span>${k}</span><b>${v} g</b></div><i><em style="background:${col};width:${Math.min(100, (v / max) * 100)}%"></em></i></div>`).join('')}
          </div>
        </div>
        <div class="nut__tip"><svg><use href="#i-sparkles"/></svg>High in protein · fits your daily goal</div>`;
      panes[2].innerHTML = r.steps.map(([s, t], i) => `<div class="dir-row"><span class="dir-row__n">${i + 1}</span><p>${s}</p><em>${t}</em></div>`).join('')
        + `<div class="rec__cta"><svg><use href="#i-chef"/></svg>Start cooking</div>`;
    }

    function animatePane(i) {
      const p = panes[i];
      if (reduce) { $$('.will-ck', p).forEach((r) => r.classList.add('is-ck')); return; }
      if (i === 0) {
        const rows = $$('.ing-row', p);
        gsap.fromTo(rows, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.06 });
        rows.forEach((r) => r.classList.remove('is-ck'));
        $$('.will-ck', p).forEach((r, k) => gsap.delayedCall(0.6 + k * 0.35, () => r.classList.add('is-ck')));
        gsap.fromTo($('.rec__cta', p), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.4 });
      } else if (i === 1) {
        const rings = $$('.nr', p);
        gsap.fromTo(rings, { opacity: 0, rotation: -90, svgOrigin: '35 35' }, { opacity: 1, rotation: 0, svgOrigin: '35 35', duration: 1.2, stagger: 0.12 });
        counter($('.js-nut-kcal', p), recipe.kcal, { dur: 1.2 }).vars.onStart = null;
        gsap.fromTo($$('.nut__item i em', p), { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.1, delay: 0.2 });
        gsap.fromTo($$('.nut__item, .nut__tip', p), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 });
      } else {
        gsap.fromTo($$('.dir-row, .rec__cta', p), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 });
      }
    }

    function moveInd(instant) {
      const t = tabs[idx];
      if (isDesktop()) gsap.to(ind, { x: 0, y: t.offsetTop, width: t.offsetWidth, height: t.offsetHeight, duration: instant ? 0 : 0.75, ease: 'soft' });
      else gsap.to(ind, { x: t.offsetLeft, y: t.offsetTop, width: t.offsetWidth, height: t.offsetHeight, duration: instant ? 0 : 0.6, ease: 'soft' });
    }

    function swapTitle(i, instant) {
      const d = D.mealTabs[i];
      if (instant || reduce) { t1.textContent = d.t1; t2.textContent = d.t2; desc.textContent = d.desc; return; }
      const outEls = [t1, t2];
      gsap.timeline()
        .to(outEls, { yPercent: -105, duration: 0.45, stagger: 0.05, ease: 'power3.in' })
        .to(desc, { opacity: 0, filter: 'blur(6px)', duration: 0.35 }, 0)
        .add(() => { t1.textContent = d.t1; t2.textContent = d.t2; desc.textContent = d.desc; })
        .fromTo(outEls, { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'soft' })
        .to(desc, { opacity: 1, filter: 'blur(0px)', duration: 0.6 }, '<0.15');
    }

    function setTab(i, { instant = false, user = false } = {}) {
      const prevIdx = idx;
      idx = i;
      tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      segBtns.forEach((b, k) => b.classList.toggle('is-on', k === i));
      segInd.style.transform = `translateX(${i * 100}%)`;
      moveInd(instant);
      if (prevIdx !== i || instant) swapTitle(i, instant);
      panes.forEach((p, k) => {
        const on = k === i;
        if (on) {
          p.classList.add('is-on');
          if (!reduce && !instant) gsap.fromTo(p, { opacity: 0, x: (k > prevIdx ? 30 : -30) }, { opacity: 1, x: 0, duration: 0.55, ease: 'soft' });
        } else if (p.classList.contains('is-on')) {
          gsap.to(p, { opacity: 0, duration: 0.25, onComplete: () => p.classList.remove('is-on') });
        }
      });
      animatePane(i);
      restartAuto();
      if (user) paused = false;
    }

    function restartAuto() {
      autoTl && autoTl.kill();
      $$('.mtab__ring circle').forEach((c) => gsap.set(c, { strokeDashoffset: 188.5 }));
      if (reduce) return;
      const ring = $('.mtab__ring circle', tabs[idx]);
      autoTl = gsap.to(ring, {
        strokeDashoffset: 0, duration: 6.5, ease: 'none',
        onComplete: () => setTab((idx + 1) % tabs.length)
      });
      if (!inView || paused) autoTl.pause();
    }

    function setRecipe(r, fromCarousel) {
      recipe = r;
      const img = $('.js-meal-img'), img2 = $('.js-meal-img2');
      const swap = () => {
        img.src = IMG(r.img); img2.src = IMG(r.img);
        $('.js-meal-name').textContent = r.title;
        $('.js-meal-time').textContent = r.time.replace(' mins', ' min');
        $('.js-meal-kcal').textContent = `${r.kcal} kcal`;
        renderPanes();
        setTab(fromCarousel ? 0 : idx, { instant: false });
      };
      if (reduce) { swap(); return; }
      gsap.timeline()
        .to([img, '.js-meal-name'], { opacity: 0, duration: 0.25 })
        .add(swap)
        .fromTo(img, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1.05, duration: 1.1, ease: 'soft' })
        .to('.js-meal-name', { opacity: 1, duration: 0.5 }, '<');
    }

    function cookTimer() {
      const time = $('.js-cook-time'), stepEl = $('.js-cook-step'), ring = $('.cook__timer-val');
      const C = 2 * Math.PI * 25;
      gsap.set(ring, { strokeDasharray: C, strokeDashoffset: 0 });
      let step = 2;
      const loop = () => {
        const o = { s: 299 };
        gsap.timeline({ onComplete: () => { step = step % 4 + 1; stepEl.textContent = step; loop(); } })
          .fromTo(ring, { strokeDashoffset: 0 }, { strokeDashoffset: C, duration: 8, ease: 'none' }, 0)
          .to(o, { s: 0, duration: 8, ease: 'none', onUpdate: () => { const s = Math.round(o.s); time.textContent = `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } }, 0);
      };
      if (!reduce) loop();
    }

    function init() {
      renderPanes();
      setTab(0, { instant: true });
      tabs.forEach((t, i) => t.addEventListener('click', () => setTab(i, { user: true })));
      segBtns.forEach((b, i) => b.addEventListener('click', () => setTab(i, { user: true })));
      const zone = $('.meal__grid');
      zone.addEventListener('mouseenter', () => { paused = true; autoTl && autoTl.pause(); });
      zone.addEventListener('mouseleave', () => { paused = false; if (inView) autoTl && autoTl.resume(); });
      onVisible($('.meal'), (v) => { inView = v; if (!autoTl) return; v && !paused ? autoTl.resume() : autoTl.pause(); }, { start: 'top 70%', end: 'bottom 30%' });
      cookTimer();
      gsap.set('.meal__phone--front', { x: 0, y: 0, xPercent: -36, yPercent: -50, rotation: 4 });
      gsap.set('.meal__phone--back', { x: 0, y: 0, xPercent: -80, yPercent: -47, rotation: -10, scale: 0.9 });
      if (!reduce) {
        gsap.from('.meal__phone--front', { y: 160, rotation: 14, opacity: 0, duration: 1.5, scrollTrigger: { trigger: '.meal__grid', start: 'top 80%', once: true } });
        gsap.from('.meal__phone--back', { y: 200, rotation: -24, opacity: 0, duration: 1.6, delay: 0.12, scrollTrigger: { trigger: '.meal__grid', start: 'top 80%', once: true } });
        gsap.from('.meal__tabs', { x: 220, opacity: 0, duration: 1.3, scrollTrigger: { trigger: '.meal__grid', start: 'top 75%', once: true } });
        gsap.from('.mtab__img', { scale: 0, rotation: -120, duration: 1.2, stagger: 0.12, delay: 0.25, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.meal__grid', start: 'top 75%', once: true } });
        gsap.from([t1, t2], { yPercent: 105, duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: '.meal__grid', start: 'top 75%', once: true } });
        gsap.from('.meal__dash', { scaleX: 0, transformOrigin: 'left', duration: 1, scrollTrigger: { trigger: '.meal__grid', start: 'top 70%', once: true } });
        gsap.from('.meal__desc-txt', { opacity: 0, y: 20, duration: 1, delay: 0.2, scrollTrigger: { trigger: '.meal__grid', start: 'top 70%', once: true } });
      }
    }
    return { init, setRecipe, moveInd: () => moveInd(true) };
  })();

  /* ---------------------------------------------------------
     BMI & calorie calculator
  --------------------------------------------------------- */
  const Calc = (() => {
    const form = $('.calc__form');
    const seg = $('.seg');
    const select = $('.select');
    const out = $('.calc__out'), empty = $('.calc__empty');
    let gender = 'female';
    let calculated = false;
    const needle = $('.res-needle');

    function bmiAngle(b) {
      const segs = [[15, 180], [18.5, 118], [25, 62], [30, 30], [40, 0]];
      if (b <= 15) return 180;
      if (b >= 40) return 0;
      for (let i = 0; i < segs.length - 1; i++) {
        const [b0, a0] = segs[i], [b1, a1] = segs[i + 1];
        if (b <= b1) return lerp(a0, a1, (b - b0) / (b1 - b0));
      }
      return 0;
    }
    function read() {
      const v = (id) => parseFloat($(`#${id}`).value);
      return { age: v('age'), w: v('weight'), h: v('height'), act: parseFloat(select.dataset.value), gender };
    }
    function validate() {
      let ok = true;
      [['age', 14, 99], ['weight', 30, 250], ['height', 120, 230]].forEach(([id, min, max]) => {
        const inp = $(`#${id}`), box = inp.parentElement, val = parseFloat(inp.value);
        const bad = !(val >= min && val <= max);
        box.classList.toggle('is-err', bad);
        if (bad) { ok = false; gsap.fromTo(box, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, .3)' }); }
      });
      return ok;
    }
    function compute(d) {
      const m = d.h / 100;
      const bmi = d.w / (m * m);
      const bmr = 10 * d.w + 6.25 * d.h - 5 * d.age + (d.gender === 'male' ? 5 : -161);
      const tdee = bmr * d.act;
      return {
        bmi, tdee,
        cat: bmi < 18.5 ? ['under', 'Underweight'] : bmi < 25 ? ['normal', 'Healthy weight'] : bmi < 30 ? ['over', 'Overweight'] : ['obese', 'Obese'],
        lose: tdee - 500, gain: tdee + 300,
        p: (tdee * 0.3) / 4, c: (tdee * 0.4) / 4, f: (tdee * 0.3) / 9,
        water: d.w * 0.033
      };
    }
    function show(r, first) {
      const badge = $('.js-bmi-cat');
      badge.textContent = r.cat[1];
      badge.dataset.cat = r.cat[0];
      if (first && !reduce) {
        gsap.timeline()
          .to(empty, { opacity: 0, scale: 0.92, duration: 0.4, ease: 'power3.in', onComplete: () => { empty.style.display = 'none'; } })
          .add(() => { out.hidden = false; })
          .fromTo(out.children, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 });
      } else { empty.style.display = 'none'; out.hidden = false; }
      gsap.to(needle, { rotation: 90 - bmiAngle(r.bmi), svgOrigin: '110 112', duration: reduce ? 0 : 1.8, ease: 'elastic.out(1, .55)', delay: first ? 0.45 : 0 });
      const dl = first ? 0.4 : 0;
      counter($('.js-bmi'), r.bmi, { dec: 1, delay: dl });
      counter($('.js-kcal'), r.tdee, { delay: dl });
      counter($('.js-lose'), r.lose, { delay: dl });
      counter($('.js-gain'), r.gain, { delay: dl });
      counter($('.js-p'), r.p, { delay: dl });
      counter($('.js-c'), r.c, { delay: dl });
      counter($('.js-f'), r.f, { delay: dl });
      counter($('.js-water'), r.water, { dec: 1, delay: dl });
      gsap.to('.js-pb', { scaleX: clamp(r.p / 220, 0.08, 1), duration: 1.2, delay: dl + 0.1 });
      gsap.to('.js-cb', { scaleX: clamp(r.c / 320, 0.08, 1), duration: 1.2, delay: dl + 0.2 });
      gsap.to('.js-fb', { scaleX: clamp(r.f / 110, 0.08, 1), duration: 1.2, delay: dl + 0.3 });
    }
    function calculate(first) {
      if (!validate()) return;
      show(compute(read()), first);
      calculated = true;
    }
    function init() {
      gsap.set(needle, { rotation: -90, svgOrigin: '110 112' });
      $$('.seg__opt', seg).forEach((b) => b.addEventListener('click', () => {
        gender = b.dataset.v;
        $$('.seg__opt', seg).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
        seg.classList.toggle('is-male', gender === 'male');
        if (calculated) calculate(false);
      }));
      const btn = $('.select__btn', select), listEl = $('.select__list', select);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !select.classList.contains('is-open');
        select.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open);
        if (open) gsap.fromTo($$('li', listEl), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03 });
      });
      $$('li', listEl).forEach((li) => li.addEventListener('click', () => {
        $$('li', listEl).forEach((x) => { x.classList.remove('is-on'); x.removeAttribute('aria-selected'); });
        li.classList.add('is-on'); li.setAttribute('aria-selected', 'true');
        select.dataset.value = li.dataset.v;
        $('.select__val', select).textContent = li.textContent;
        select.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        if (calculated) calculate(false);
      }));
      document.addEventListener('click', (e) => { if (!select.contains(e.target)) select.classList.remove('is-open'); });
      let deb;
      $$('input', form).forEach((inp) => inp.addEventListener('input', () => {
        inp.parentElement.classList.remove('is-err');
        if (!calculated) return;
        clearTimeout(deb);
        deb = setTimeout(() => calculate(false), 350);
      }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const sub = $('.calc__submit');
        sub.classList.add('is-busy');
        gsap.fromTo(sub, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .4)' });
        setTimeout(() => { sub.classList.remove('is-busy'); calculate(!calculated); }, reduce ? 0 : 420);
      });
      $('.res-reset').addEventListener('click', () => {
        if (!isDesktop()) scrollToTarget(form, -110);
        setTimeout(() => $('#weight').focus({ preventScroll: true }), 400);
      });
    }
    return { init };
  })();

  /* ---------------------------------------------------------
     How to use — scroll-drawn path
  --------------------------------------------------------- */
  const How = (() => {
    const wrap = $('.steps');
    const svg = $('.steps__svg');
    const path = $('.steps__path'), mask = $('.steps__mask'), dot = $('.steps__dot');
    let tl = null;
    function build() {
      const icons = $$('.step__ic', wrap);
      const w = wrap.clientWidth, h = wrap.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const P = icons.map((ic) => { const r = relRect(ic, wrap); return { x: r.cx, y: r.cy, r: ic.offsetWidth / 2 + 14 }; });
      let d;
      if (w > 860) {
        const [a, b, c] = P;
        d = `M${a.x + a.r},${a.y} C${a.x + a.r + 90},${a.y + 70} ${b.x - b.r - 90},${b.y + 70} ${b.x - b.r},${b.y} L${b.x + b.r},${b.y} C${b.x + b.r + 90},${b.y - 70} ${c.x - c.r - 90},${c.y - 70} ${c.x - c.r},${c.y}`;
      } else {
        const [a, b, c] = P;
        d = `M${a.x},${a.y + a.r} C${a.x + 70},${a.y + a.r + 80} ${b.x + 70},${b.y - b.r - 80} ${b.x},${b.y - b.r} L${b.x},${b.y + b.r} C${b.x - 70},${b.y + b.r + 80} ${c.x - 70},${c.y - c.r - 80} ${c.x},${c.y - c.r}`;
      }
      path.setAttribute('d', d);
      mask.setAttribute('d', d);
    }
    function init() {
      build();
      if (reduce) { gsap.set(dot, { opacity: 0 }); return; }
      const steps = $$('.step', wrap);
      gsap.set(mask, { drawSVG: '0%' });
      gsap.set(dot, { opacity: 0 });
      steps.forEach((s) => {
        gsap.set($('.step__ic', s), { scale: 0, rotation: -40 });
        gsap.set($$('h3, p', s), { opacity: 0, y: 20 });
      });
      tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 75%', end: 'bottom 55%', scrub: 1 } });
      const pop = (s, at) => {
        tl.to($('.step__ic', s), { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' }, at)
          .to($$('h3, p', s), { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, at + 0.05);
      };
      pop(steps[0], 0);
      tl.to(dot, { opacity: 1, duration: 0.05 }, 0.2)
        .to(mask, { drawSVG: '0% 50%', duration: 0.6, ease: 'none' }, 0.2)
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0.5 }, duration: 0.6, ease: 'none' }, 0.2);
      pop(steps[1], 0.75);
      tl.to(mask, { drawSVG: '0% 100%', duration: 0.6, ease: 'none' }, 0.95)
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0.5, end: 1 }, duration: 0.6, ease: 'none' }, 0.95);
      pop(steps[2], 1.5);
      tl.to(dot, { opacity: 0, duration: 0.1 }, 1.6);
    }
    return { init, build };
  })();

  /* ---------------------------------------------------------
     Features — numbers roll + lines grow
  --------------------------------------------------------- */
  function initFeatures() {
    if (reduce) return;
    $$('.feat-item').forEach((item, i) => {
      const digits = $$('.feat-item__num span', item);
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 85%', once: true }, delay: i * 0.12 });
      tl.from(digits, { yPercent: 110, duration: 1.1, stagger: 0.08 })
        .from($('.feat-item__line b', item), { scaleY: 0, duration: 0.8, ease: 'power3.out' }, 0.1)
        .fromTo(item, { '--ln': 0 }, { '--ln': 1, duration: 1.4, ease: 'power2.out' }, 0.3)
        .from($$('.feat-item__body > *', item), { opacity: 0, y: 24, duration: 0.9, stagger: 0.08 }, 0.35);
    });
  }

  /* ---------------------------------------------------------
     Why Byond — path + 3D cards
  --------------------------------------------------------- */
  const Why = (() => {
    const wrap = $('.why__wrap'), svg = $('.why__svg'), path = $('.why__path');
    function build() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const c = $$('.why-card').map((el) => {
        const r = el.getBoundingClientRect(), p = wrap.getBoundingClientRect();
        const x = r.left - p.left, y = el.offsetTop + el.parentElement.offsetTop;
        return { x, y, w: r.width, h: el.offsetHeight, cx: x + r.width / 2, cy: y + el.offsetHeight / 2, r: x + r.width };
      });
      if (c.length < 3) return;
      const pts = [
        { x: -20, y: c[0].cy + 150 },
        { x: c[0].x - 40, y: c[0].cy + 90 },
        { x: c[0].cx, y: c[0].cy + 10 },
        { x: (c[0].r + c[1].x) / 2, y: c[1].y + 70 },
        { x: c[1].cx, y: c[1].cy - 10 },
        { x: (c[1].r + c[2].x) / 2, y: c[2].cy + 30 },
        { x: c[2].cx, y: c[2].cy - 40 },
        { x: c[2].r + 50, y: c[2].y + 10 },
        { x: w + 20, y: c[2].y - 50 }
      ];
      path.setAttribute('d', catmull(pts));
    }
    function init() {
      build();
      if (reduce) return;
      gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 85%', end: 'bottom 60%', scrub: 1 } });
      gsap.from('.why-card', {
        y: 140, rotationX: -40, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1000, duration: 1.4, stagger: 0.16,
        scrollTrigger: { trigger: '.why__cards', start: 'top 82%', once: true }, clearProps: 'opacity'
      });
      gsap.from('.why-card__num', { scale: 0, rotation: -90, duration: 1, stagger: 0.16, delay: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.why__cards', start: 'top 82%', once: true } });
      $$('.why-card__leaf').forEach((leaf) => gsap.to(leaf, { yPercent: -18, rotation: 20, ease: 'none', scrollTrigger: { trigger: leaf.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    }
    return { init, build };
  })();

  /* ---------------------------------------------------------
     Our Story — living constellation
  --------------------------------------------------------- */
  const Story = (() => {
    const wrap = $('.constellation');
    const svg = $('.constellation__svg');
    const tilesWrap = $('.constellation__tiles');
    const card = $('.story-card');
    const textEl = $('.story-card__text');
    let tiles = [];
    let paths = [];
    let running = false;
    let raf = null;
    let mx = 0, my = 0, smx = 0, smy = 0;
    let lineProg = { v: reduce ? 1 : 0 };
    let chapter = 0;
    let chapTimer = null;
    let mobile = false;
    const chains = [
      ['edgeL', 11, 7, 8, 'cardL'],
      ['cardR', 9, 5, 6, 'edgeTR'],
      ['cardB', 14, 15, 16, 'edgeR'],
      [0, 1, 2, 3, 4]
    ];

    function measure() {
      mobile = window.innerWidth <= 860;
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
      const base = tilesWrap.offsetLeft;
      tiles.forEach((t) => {
        t.bx = base + t.el.offsetLeft + t.el.offsetWidth / 2;
        t.by = tilesWrap.offsetTop + t.el.offsetTop + t.el.offsetHeight / 2;
        t.dx = cw / 2 - t.bx; t.dy = ch / 2 - t.by;
      });
    }
    function anchor(key) {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const cr = { x: card.offsetLeft - card.offsetWidth / 2, y: card.offsetTop - card.offsetHeight / 2, w: card.offsetWidth, h: card.offsetHeight };
      // story-card is centered with margin-left/translateY, compute from layout
      const r = card.getBoundingClientRect(), p = wrap.getBoundingClientRect();
      cr.x = r.left - p.left; cr.y = r.top - p.top;
      switch (key) {
        case 'edgeL': return { x: -30, y: ch * 0.62 };
        case 'edgeR': return { x: cw + 30, y: ch * 0.98 };
        case 'edgeTR': return { x: cw + 30, y: ch * 0.12 };
        case 'cardL': return { x: cr.x, y: cr.y + cr.h * 0.7 };
        case 'cardR': return { x: cr.x + cr.w, y: cr.y + cr.h * 0.3 };
        case 'cardB': return { x: cr.x + cr.w * 0.8, y: cr.y + cr.h };
        default: return { x: 0, y: 0 };
      }
    }
    function draw() {
      paths.forEach((p, i) => {
        const pts = chains[i].map((k) => (typeof k === 'number' ? { x: tiles[k].bx + tiles[k].ox, y: tiles[k].by + tiles[k].oy } : anchor(k)));
        p.setAttribute('d', catmull(pts));
        p.style.strokeDashoffset = 1 - clamp(lineProg.v * 1.3 - i * 0.12, 0, 1);
      });
    }
    function tick(now) {
      const t = now / 1000;
      smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
      tiles.forEach((s) => {
        const e = s.enter;
        s.ox = Math.sin(t * s.sp + s.ph) * 7 + smx * -46 * s.d + (1 - e) * s.dx;
        s.oy = Math.cos(t * s.sp * 0.85 + s.ph) * 7 + smy * -34 * s.d + (1 - e) * s.dy;
        s.el.style.transform = `translate3d(${s.ox.toFixed(2)}px, ${s.oy.toFixed(2)}px, 0) scale(${(0.35 + 0.65 * e).toFixed(3)})`;
        s.el.style.opacity = e.toFixed(3);
      });
      draw();
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running || mobile) return; running = true; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function setChapter(i, first) {
      chapter = (i + D.story.length) % D.story.length;
      $('.js-chapter').textContent = `Chapter 0${chapter + 1}`;
      $$('.story-card__dots i').forEach((d, k) => d.classList.toggle('is-on', k === chapter));
      const render = () => {
        textEl.innerHTML = wrapWords(D.story[chapter], 'sw');
        if (!reduce) gsap.fromTo($$('.sw', textEl), { opacity: 0, y: 10, filter: 'blur(5px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.012 });
      };
      if (first || reduce) { render(); return; }
      gsap.to($$('.sw', textEl), { opacity: 0, y: -8, duration: 0.3, stagger: 0.003, onComplete: render });
    }
    function autoChapter() {
      chapTimer && chapTimer.kill();
      if (reduce) return;
      chapTimer = gsap.delayedCall(10, () => { setChapter(chapter + 1); autoChapter(); });
      if (!running && !mobile) chapTimer.pause();
    }

    function init() {
      tiles = $$('.tile', wrap).map((el) => ({
        el, d: parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 1,
        ph: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.5, ox: 0, oy: 0, enter: reduce ? 1 : 0, bx: 0, by: 0, dx: 0, dy: 0
      }));
      paths = chains.map(() => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
        svg.appendChild(p);
        return p;
      });
      measure();
      if (!mobile) gsap.set(card, { y: 0, yPercent: -50 });
      setChapter(0, true);
      $('.sbtn--next').addEventListener('click', () => { setChapter(chapter + 1); autoChapter(); });
      $('.sbtn--prev').addEventListener('click', () => { setChapter(chapter - 1); autoChapter(); });
      card.addEventListener('mouseenter', () => chapTimer && chapTimer.pause());
      card.addEventListener('mouseleave', () => chapTimer && chapTimer.resume());
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
      });
      wrap.addEventListener('pointerleave', () => { mx = 0; my = 0; });
      onVisible(wrap, (v) => { v ? start() : stop(); if (chapTimer) v ? chapTimer.resume() : chapTimer.pause(); });
      if (mobile) {
        // duplicate tiles for the marquee
        $$('.tile', tilesWrap).forEach((t) => tilesWrap.appendChild(t.cloneNode(true)));
        tiles.forEach((t) => { t.el.style.opacity = ''; t.el.style.transform = ''; });
      }
      if (!reduce && !mobile) {
        ScrollTrigger.create({
          trigger: wrap, start: 'top 75%', once: true,
          onEnter: () => {
            const order = tiles.slice().sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
            order.forEach((s, k) => gsap.to(s, { enter: 1, duration: 1.6, delay: 0.1 + k * 0.05, ease: 'expo.out' }));
            gsap.to(lineProg, { v: 1, duration: 2.6, delay: 0.9, ease: 'power2.inOut' });
            gsap.from(card, { scale: 0.85, opacity: 0, duration: 1.2, ease: 'back.out(1.3)' });
          }
        });
      } else {
        tiles.forEach((t) => { t.enter = 1; });
        lineProg.v = 1;
      }
      autoChapter();
    }
    return { init, measure };
  })();

  /* ---------------------------------------------------------
     Testimonials
  --------------------------------------------------------- */
  const Testi = (() => {
    const stack = $('.testi__stack');
    const textEl = $('.testi__text');
    const nameEl = $('.testi__name'), locEl = $('.testi__loc'), dateEl = $('.testi__date');
    const ring = $('.tbtn__ring circle');
    const T = D.testimonials;
    let idx = 0;
    let photos = [];
    let timer = null;
    let inView = false;

    function slots() {
      const h = stack.clientHeight;
      if (window.innerWidth <= 860) return { top: { y: -h, h }, mid: { y: 0, h }, bot: { y: h, h } };
      const g = 12, sm = Math.round(h * 0.26), mid = h - sm * 2 - g * 2;
      return { top: { y: 0, h: sm }, mid: { y: sm + g, h: mid }, bot: { y: sm + g + mid + g, h: sm } };
    }
    function layout(instant) {
      const s = slots(), n = T.length, mob = window.innerWidth <= 860;
      photos.forEach((p, i) => {
        let o = i - idx;
        o = ((o % n) + n) % n;
        if (o > n / 2) o -= n;
        let st, op = 1;
        if (o === 0) st = s.mid;
        else if (o === -1) { st = s.top; op = mob ? 0 : 1; }
        else if (o === 1) { st = s.bot; op = mob ? 0 : 1; }
        else if (o < 0) { st = { y: s.top.y - s.top.h - 20, h: s.top.h }; op = 0; }
        else { st = { y: s.bot.y + s.bot.h + 20, h: s.bot.h }; op = 0; }
        gsap.to(p, { top: st.y, height: st.h, opacity: op, duration: instant ? 0 : 0.9, ease: 'soft', zIndex: o === 0 ? 3 : 1 });
        gsap.to(p.firstElementChild, { scale: o === 0 ? 1 : 1.2, duration: instant ? 0 : 1.2, ease: 'soft' });
      });
    }
    function setText(first) {
      const t = T[idx];
      const render = () => {
        textEl.innerHTML = wrapWords(`“${t.text}”`, 'tw');
        nameEl.textContent = t.name; locEl.textContent = t.loc; dateEl.textContent = t.date;
        if (!reduce) {
          gsap.fromTo($$('.tw', textEl), { opacity: 0, y: 12, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.014 });
          gsap.fromTo([nameEl, locEl, dateEl], { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.07 });
        }
      };
      if (first || reduce) { render(); return; }
      gsap.to([...$$('.tw', textEl), nameEl, locEl, dateEl], { opacity: 0, y: -8, duration: 0.3, stagger: 0.003, onComplete: render });
    }
    function go(dir) {
      idx = (idx + dir + T.length) % T.length;
      layout();
      setText();
      restart();
    }
    function restart() {
      timer && timer.kill();
      gsap.set(ring, { strokeDashoffset: 176 });
      if (reduce) return;
      timer = gsap.to(ring, { strokeDashoffset: 0, duration: 7, ease: 'none', onComplete: () => go(1) });
      if (!inView) timer.pause();
    }
    function init() {
      stack.innerHTML = T.map((t) => `<div class="tphoto"><img src="${IMG(t.img)}" alt="${t.name}" loading="lazy"></div>`).join('');
      photos = $$('.tphoto', stack);
      layout(true);
      setText(true);
      $('.tbtn--next').addEventListener('click', () => go(1));
      $('.tbtn--prev').addEventListener('click', () => go(-1));
      const card = $('.testi__card');
      card.addEventListener('mouseenter', () => timer && timer.pause());
      card.addEventListener('mouseleave', () => inView && timer && timer.resume());
      let sx = null;
      $('.testi__grid').addEventListener('pointerdown', (e) => { sx = e.clientX; });
      $('.testi__grid').addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
      photos.forEach((p, i) => p.addEventListener('click', () => { const n = T.length; let o = i - idx; o = ((o % n) + n) % n; if (o > n / 2) o -= n; if (o) go(o); }));
      onVisible($('.testi'), (v) => { inView = v; if (timer) v ? timer.resume() : timer.pause(); });
      restart();
    }
    return { init, layout: () => layout(true) };
  })();

  /* ---------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------- */
  function initFaq() {
    const items = $$('.qa');
    let refreshT;
    const refresh = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 650); };
    const close = (qa) => {
      qa.classList.remove('is-open');
      $('.qa__q', qa).setAttribute('aria-expanded', 'false');
      gsap.to($('.qa__a', qa), { height: 0, duration: reduce ? 0 : 0.5, ease: 'power3.inOut' });
    };
    const open = (qa) => {
      qa.classList.add('is-open');
      $('.qa__q', qa).setAttribute('aria-expanded', 'true');
      const a = $('.qa__a', qa);
      gsap.fromTo(a, { height: a.offsetHeight }, { height: 'auto', duration: reduce ? 0 : 0.6, ease: 'soft' });
      gsap.fromTo(a.firstElementChild, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.1 });
    };
    items.forEach((qa) => {
      $('.qa__q', qa).addEventListener('click', () => {
        const isOpen = qa.classList.contains('is-open');
        items.forEach((o) => { if (o !== qa && o.classList.contains('is-open')) close(o); });
        isOpen ? close(qa) : open(qa);
        refresh();
      });
    });
  }

  /* ---------------------------------------------------------
     CTA — living app wall + spotlight
  --------------------------------------------------------- */
  function initCta() {
    const wall = $('.cta__wall');
    const cols = 16;
    let html = '';
    for (let c = 0; c < cols; c++) {
      html += '<div class="cta__col">';
      for (let k = 0; k < 10; k++) html += '<div class="cta__ph"></div>';
      html += '</div>';
    }
    wall.innerHTML = html;
    const cta = $('.cta');
    if (reduce) return;
    $$('.cta__col', wall).forEach((col, i) => {
      gsap.fromTo(col, { yPercent: i % 2 ? -50 : 0 }, { yPercent: i % 2 ? 0 : -50, duration: 38 + (i % 5) * 6, ease: 'none', repeat: -1 });
    });
    gsap.fromTo(wall, { y: 80 }, { y: -80, ease: 'none', scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom top', scrub: true } });
    cta.addEventListener('pointermove', (e) => {
      const r = cta.getBoundingClientRect();
      cta.style.setProperty('--sx', `${e.clientX - r.left}px`);
      cta.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });
  }

  /* ---------------------------------------------------------
     Contact form
  --------------------------------------------------------- */
  function initContact() {
    const form = $('.cform');
    const btn = $('.cform__send');
    const msg = $('.cform__msg');
    const check = $('.cform__check path');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('.cfield', form).forEach((f) => {
        const inp = $('input, textarea', f);
        const v = inp.value.trim();
        const bad = inp.type === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : v.length < 2;
        f.classList.toggle('is-err', bad);
        if (bad) { ok = false; gsap.fromTo(f, { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, .3)' }); }
      });
      if (!ok) { msg.textContent = 'Please fill in all fields with valid details.'; msg.style.color = '#e04848'; return; }
      msg.style.color = '';
      gsap.timeline()
        .to('.cform__lbl', { opacity: 0, y: -10, duration: 0.25 })
        .to(check, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
        .add(() => { msg.textContent = "Thanks! We'll get back to you within 24 hours."; })
        .to({}, { duration: 2.2 })
        .add(() => { form.reset(); })
        .to(check, { strokeDashoffset: 24, duration: 0.3 })
        .to('.cform__lbl', { opacity: 1, y: 0, duration: 0.3 });
      gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, .4)' });
    });
    $$('.cfield input, .cfield textarea', form).forEach((i) => i.addEventListener('input', () => i.parentElement.classList.remove('is-err')));
  }

  /* ---------------------------------------------------------
     Footer
  --------------------------------------------------------- */
  function initFooter() {
    $('.to-top').addEventListener('click', () => scrollToTarget(0, 0));
    if (reduce) return;
    const word = SplitText.create('.footer__word span', { type: 'chars' });
    gsap.from(word.chars, {
      yPercent: 100, opacity: 0, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top 90%', end: 'bottom bottom', scrub: 1 }
    });
    gsap.from('.footer__top > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.12, scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });
  }

  /* ---------------------------------------------------------
     Video modal (app reel)
  --------------------------------------------------------- */
  function initVideo() {
    const modal = $('.vmodal'), box = $('.vmodal__box'), back = $('.vmodal__backdrop');
    const slides = $$('.vmodal__slide', modal), bar = $('.vmodal__bar i'), time = $('.vmodal__time'), playBtn = $('.vmodal__play');
    let reel = null, origin = null;
    const total = slides.length * 4;
    function buildReel() {
      reel = gsap.timeline({ repeat: -1, onUpdate: () => {
        const t = reel.time();
        bar.style.transform = `scaleX(${t / total})`;
        time.textContent = `0:${String(Math.floor(t)).padStart(2, '0')} / 0:${total}`;
      } });
      slides.forEach((s, i) => {
        const at = i * 4;
        reel.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, at)
          .fromTo($('img', s), { scale: 1.25, rotation: -8 }, { scale: 1, rotation: 0, duration: 4.4, ease: 'none' }, at)
          .fromTo($('span', s), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, at + 0.3)
          .to(s, { opacity: 0, duration: 0.6 }, at + 3.6);
      });
    }
    function open(trigger) {
      origin = trigger;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      if (!reel) buildReel();
      reel.restart();
      const r = trigger.getBoundingClientRect(), b = box.getBoundingClientRect();
      gsap.set(box, { transformOrigin: '0 0' });
      gsap.timeline()
        .to(back, { opacity: 1, duration: 0.5 }, 0)
        .fromTo(box, { x: r.left - b.left, y: r.top - b.top, scaleX: r.width / b.width, scaleY: r.height / b.height, opacity: 0.6 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: reduce ? 0 : 0.9, ease: 'inout' }, 0);
      $('.vmodal__close').focus({ preventScroll: true });
    }
    function close() {
      const r = origin.getBoundingClientRect(), b = box.getBoundingClientRect();
      gsap.timeline({ onComplete: () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); reel && reel.pause(); gsap.set(box, { clearProps: 'all' }); } })
        .to(box, { x: r.left - b.left, y: r.top - b.top, scaleX: r.width / b.width, scaleY: r.height / b.height, opacity: 0, duration: reduce ? 0 : 0.7, ease: 'inout' }, 0)
        .to(back, { opacity: 0, duration: 0.5 }, 0.1);
      lenis && lenis.start();
    }
    $$('.js-video').forEach((b) => b.addEventListener('click', () => open(b.classList.contains('vcard') ? b : $('.vcard'))));
    $('.vmodal__close').addEventListener('click', close);
    back.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
    playBtn.addEventListener('click', () => {
      if (!reel) return;
      reel.paused(!reel.paused());
      playBtn.setAttribute('aria-label', reel.paused() ? 'Play' : 'Pause');
      playBtn.style.opacity = reel.paused() ? '.7' : '1';
    });
    $('.vcard').setAttribute('data-cursor', 'Play');
  }

  /* ---------------------------------------------------------
     Resize
  --------------------------------------------------------- */
  let lastW = window.innerWidth;
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const wChanged = window.innerWidth !== lastW;
      lastW = window.innerWidth;
      computeHeroGeo();
      renderHero();
      if (!wChanged) return;
      Recipes.layout();
      Recipes.moveInd();
      Meal.moveInd();
      How.build();
      Why.build();
      Story.measure();
      Testi.layout();
      buildHeroLines(false);
      ScrollTrigger.refresh();
    }, 180);
  });

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  function boot() {
    computeHeroGeo();
    renderHero();
    initHeader();
    initCursor();
    initMagnetic();
    initTilt();
    Recipes.init();
    Meal.init();
    Calc.init();
    How.init();
    initFeatures();
    Why.init();
    Story.init();
    Testi.init();
    initFaq();
    initCta();
    initContact();
    initFooter();
    initVideo();
    heroInteractions();
    animateBeams();

    document.fonts.ready.then(() => {
      initReveals();
      if (reduce) {
        document.body.classList.remove('is-loading');
        hero.classList.add('has-shape');
        heroShape.t = 1;
        computeHeroGeo();
        renderHero();
        buildHeroLines(false);
        $('.js-type').textContent = 'Search recipes…';
        return;
      }
      runPreloader().then(() => {
        computeHeroGeo();
        renderHero();
        intro();
      });
    });
  }

  boot();
})();
