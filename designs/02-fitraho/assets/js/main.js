/* =========================================================
   FitRaho — Design 02 · motion & interactions
   GSAP 3 (ScrollTrigger, ScrambleText, Draggable, Inertia, DrawSVG) + Lenis
   ========================================================= */
(() => {
  'use strict';

  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger, CustomEase, ScrambleTextPlugin, Draggable, InertiaPlugin, DrawSVGPlugin);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  CustomEase.create('out', '0.16, 1, 0.3, 1');
  CustomEase.create('inout', '0.77, 0, 0.175, 1');
  gsap.defaults({ ease: 'out' });
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------------------------------------------------
     Smooth scroll
  --------------------------------------------------------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToEl = (target, offset = -80) => {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else {
      const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    e.preventDefault();
    if (id.length < 2) return;
    closeMenu();
    if (id === '#top') { scrollToEl(0, 0); return; }
    const el = $(id);
    if (el) scrollToEl(el, id === '#download' ? -40 : -80);
  });

  const counter = (el, to, { dur = 1.8, dec = 0, delay = 0, ease = 'power3.out' } = {}) => {
    const o = { v: 0 };
    return gsap.to(o, {
      v: to, duration: dur, delay, ease,
      onUpdate: () => { el.textContent = Number(o.v.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    });
  };
  function catmull(pts) {
    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${(p1.x + (p2.x - p0.x) / 6).toFixed(2)},${(p1.y + (p2.y - p0.y) / 6).toFixed(2)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(2)},${(p2.y - (p3.y - p1.y) / 6).toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }

  /* ---------------------------------------------------------
     Header + menu
  --------------------------------------------------------- */
  const header = $('.header');
  function initHeader() {
    let last = 0;
    const onScroll = (y) => {
      header.classList.toggle('is-scrolled', y > 20);
      header.classList.toggle('is-hidden', y > last && y > 500 && !document.body.classList.contains('menu-open'));
      last = y;
    };
    if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    $('.burger').addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));

    const links = $$('.nav__a');
    [['top', 0], ['rates', 1], ['scan', 2], ['charts', 3], ['coach', 4], ['reviews', 5]].forEach(([id, i]) => {
      const el = id === 'top' ? $('.hero') : document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({ trigger: el, start: 'top 40%', end: 'bottom 40%', onToggle: (s) => { if (s.isActive) links.forEach((l, k) => l.classList.toggle('is-active', k === i)); } });
    });
  }
  let menuTl = null;
  function openMenu() {
    document.body.classList.add('menu-open');
    $('.burger').setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    menuTl && menuTl.kill();
    menuTl = gsap.timeline()
      .set('.mnav', { visibility: 'visible' })
      .fromTo('.mnav', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'inout' })
      .fromTo('.mnav nav a', { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05 }, 0.3)
      .fromTo('.mnav .btn', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.55);
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    $('.burger').setAttribute('aria-expanded', 'false');
    menuTl && menuTl.kill();
    menuTl = gsap.timeline({ onComplete: () => { document.body.classList.remove('menu-open'); gsap.set('.mnav', { visibility: 'hidden' }); } })
      .to('.mnav', { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'inout' });
    lenis && lenis.start();
  }

  /* ---------------------------------------------------------
     Cursor + magnetic
  --------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || reduce) return;
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__ring span');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { if (!e.clientX && !e.clientY) return; dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      cur.classList.toggle('is-dark', !!t.closest('[data-dark], .mnav'));
      const inter = t.closest('a, button');
      const lab = t.closest('[data-cursor]');
      if (inter) { cur.classList.add('is-hover'); cur.classList.remove('is-label'); }
      else if (lab) { label.textContent = lab.getAttribute('data-cursor'); cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else cur.classList.remove('is-hover', 'is-label');
    });
  }
  function initMagnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------------------
     Screen animations (shared by section phones + hero clones)
  --------------------------------------------------------- */
  let homeChipDone = false;
  const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  function flash(el, up) {
    el.classList.remove('flash-up', 'flash-down');
    void el.offsetWidth;
    el.classList.add(up ? 'flash-up' : 'flash-down');
  }
  const Screens = {
    home(root) {
      const tl = gsap.timeline();
      const ring = $('.hm-ring__val', root), val = $('.js-hm-kcal', root), alertRow = $('.js-breakfast', root);
      const chipK = $('.js-chip-kcal');
      const inHero = !!root.closest('.hero');
      const o = { v: 0, p: 0 };
      let alive = true;
      const paint = () => {
        val.textContent = fmt(Math.round(o.v));
        if (chipK && inHero && !homeChipDone) chipK.textContent = fmt(Math.round(o.v));
        ring.style.strokeDashoffset = 100 - o.p;
      };
      alertRow.classList.remove('is-ck');
      tl.fromTo($$('.mac i b', root), { scaleX: 0 }, { scaleX: 1, duration: 1.4, stagger: 0.12 }, 0)
        .fromTo($('.hm-wo__bar b', root), { scaleX: 0 }, { scaleX: 1, duration: 1.4 }, 0.2)
        .to(o, { v: 131900, p: 79, duration: 2, ease: 'power3.out', onUpdate: paint }, 0)
        .add(() => alertRow.classList.add('is-ck'), 2.2)
        .fromTo(alertRow, { scale: 1 }, { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 2.2)
        .add(() => { if (inHero) homeChipDone = true; });
      const tick = () => {
        if (!alive) return;
        const d = Math.round((Math.random() - 0.45) * 70);
        o.v = clamp(o.v + d, 131500, 132400);
        val.textContent = fmt(o.v);
        flash(val, d >= 0);
        if (inHero && chipK) chipK.textContent = fmt(o.v);
        gsap.delayedCall(2.4, tick);
      };
      if (!reduce) gsap.delayedCall(3.4, tick);
      return () => { alive = false; tl.progress(1); tl.kill(); };
    },
    rates(root) {
      const rows = $$('.wo-ex', root), cont = $('.js-wo-cont', root);
      let alive = true, now = rows.findIndex((r) => r.classList.contains('is-now'));
      if (now < 0) now = 0;
      gsap.fromTo(rows, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.07 });
      gsap.fromTo($$('.wo-coins img', root), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(2)' });
      const state = rows.map((r) => ({ r, sell: +r.dataset.sell, buy: +r.dataset.buy, chg: +r.dataset.chg }));
      const tick = () => {
        if (!alive) return;
        const st = state[Math.floor(Math.random() * state.length)];
        const step = Math.max(1, Math.round(st.sell * 0.0004));
        const d = (Math.random() < 0.55 ? 1 : -1) * step * (1 + Math.floor(Math.random() * 3));
        st.sell += d; st.buy += d; st.chg += (d / st.sell) * 100;
        const se = $('.js-sell', st.r), be = $('.js-buy', st.r), em = $('em', st.r);
        se.textContent = fmt(st.sell); be.textContent = fmt(st.buy);
        em.textContent = `${st.chg >= 0 ? '▲' : '▼'} ${Math.abs(st.chg).toFixed(2)}%`;
        em.className = st.chg >= 0 ? 'up' : 'down';
        flash(se, d >= 0);
        gsap.delayedCall(1.1, tick);
      };
      const cycle = () => {
        if (!alive) return;
        rows[now].classList.remove('is-now');
        now = (now + 1) % rows.length;
        rows[now].classList.add('is-now');
        cont.textContent = rows[now].dataset.code;
        gsap.fromTo(rows[now], { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' });
        gsap.delayedCall(3.2, cycle);
      };
      if (!reduce) { gsap.delayedCall(1, tick); gsap.delayedCall(3.2, cycle); }
      return () => { alive = false; };
    },
    convert(root) {
      const main = $('.sc-frame--main', root), side = $('.sc-frame--side', root), line = $('.sc-line', root), sheet = $('.sc-sheet', root);
      const conf = $('.js-conf', root), out = $('.js-scan-kcal', root);
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
      tl.set([main, side], { opacity: 0 })
        .set(sheet, { yPercent: 105 })
        .fromTo(main, { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0.2)
        .fromTo(line, { top: '20%', opacity: 1 }, { top: '48%', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3)
        .add(() => { conf.textContent = '0'; counter(conf, 96, { dur: 1.4 }); }, 0.6)
        .to(line, { opacity: 0, duration: 0.3 }, 2.6)
        .fromTo(side, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }, 1.6)
        .to(sheet, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 2.5)
        .add(() => { out.textContent = '0'; counter(out, 3278688, { dur: 1.2 }); }, 2.7)
        .fromTo($$('.sc-macros div', root), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 2.8)
        .to({}, { duration: 3.4 })
        .to([main, side, sheet], { opacity: 0, duration: 0.4 });
      if (reduce) tl.progress(0.85).pause();
      return () => tl.kill();
    },
    charts(root) {
      return Progress.mount(root);
    },
    ai() { return () => {}; }
  };

  /* Timeframe chart (dataset morphing) */
  const Progress = (() => {
    const sets = [
      { label: 'GBP · Toman · today', delta: '+1.24%', xl: ['9:00', '11:00', '13:00', '15:00', 'Now'], v: [130280, 130100, 130450, 130900, 130700, 131200, 131050, 131500, 131300, 131700, 131900] },
      { label: 'GBP · Toman · this week', delta: '+2.49%', xl: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], v: [128700, 129100, 128900, 129600, 129400, 130100, 129800, 130500, 130280, 131000, 131900] },
      { label: 'GBP · Toman · this month', delta: '+4.35%', xl: ['W1', 'W2', 'W3', 'W4', 'Now'], v: [126400, 126900, 126500, 127400, 127100, 128000, 128700, 128300, 129600, 130280, 131900] },
      { label: 'GBP · Toman · this year', delta: '+17.3%', xl: ['Dec', 'Mar', 'Jun', 'Sep', 'Now'], v: [112400, 114800, 113900, 117200, 119500, 118700, 121900, 124600, 123800, 127900, 131900] }
    ];
    const norm = (arr) => { const mn = Math.min(...arr), mx = Math.max(...arr), pad = (mx - mn) * 0.15 || 1; return arr.map((v) => 14 + ((mx + pad - v) / (mx - mn + pad * 2)) * 72); };
    function mount(root) {
      const line = $('.pg-line', root), area = $('.pg-area', root), dot = $('.pg-dot', root);
      const label = $('.js-pg-label', root), val = $('.js-pg-val', root), delta = $('.js-pg-delta', root);
      const xl = $$('.js-pg-x span', root);
      const ind = $('.pg-tabs__ind', root), btns = $$('.pg-tabs button', root);
      let cur = norm(sets[0].v), idx = 0, auto = null, alive = true;
      const xs = cur.map((_, i) => 6 + (i * 228) / (cur.length - 1));
      const render = (ys) => {
        const d = catmull(ys.map((y, i) => ({ x: xs[i], y })));
        line.setAttribute('d', d);
        area.setAttribute('d', `${d}L${xs[xs.length - 1]},104L${xs[0]},104Z`);
        dot.setAttribute('cx', xs[xs.length - 1]);
        dot.setAttribute('cy', ys[ys.length - 1]);
      };
      render(cur);
      const draw = () => {
        gsap.fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' });
        gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.6 });
        gsap.fromTo(dot, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, delay: 1.4, ease: 'back.out(3)' });
        const st = sets[idx], o = { v: st.v[0] };
        gsap.to(o, { v: st.v[st.v.length - 1], duration: 1.6, ease: 'power2.inOut', onUpdate: () => { val.textContent = fmt(o.v); } });
      };
      const setTab = (i, user) => {
        if (i === idx && !user) return;
        idx = i;
        btns.forEach((b, k) => b.classList.toggle('is-on', k === i));
        ind.style.transform = `translateX(${i * 100}%)`;
        const st = sets[i], from = cur.slice(), to = norm(st.v), o = { t: 0 };
        label.textContent = st.label; delta.textContent = st.delta;
        xl.forEach((x, k) => { x.textContent = st.xl[k]; });
        gsap.fromTo(xl, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03 });
        gsap.to(o, { t: 1, duration: 0.9, ease: 'power3.inOut', onUpdate: () => { cur = from.map((y, k) => lerp(y, to[k], o.t)); render(cur); } });
        gsap.fromTo(delta, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
      };
      btns.forEach((b, i) => b.addEventListener('click', () => { setTab(i, true); restartAuto(); }));
      const restartAuto = () => {
        auto && auto.kill();
        if (reduce || !alive) return;
        auto = gsap.delayedCall(3.6, () => { setTab((idx + 1) % sets.length); restartAuto(); });
      };
      draw();
      restartAuto();
      return () => { alive = false; auto && auto.kill(); };
    }
    return { mount };
  })();

  /* Run a screen's animation while its phone is in view */
  function liveScreen(scr, type, trigger) {
    let stop = null;
    ScrollTrigger.create({
      trigger: trigger || scr, start: 'top 85%', end: 'bottom 15%',
      onToggle: (s) => {
        if (s.isActive && !stop) stop = Screens[type](scr);
        else if (!s.isActive && stop && type !== 'charts') { stop(); stop = null; }
      }
    });
  }

  /* ---------------------------------------------------------
     Hero: phone tabs, tilt, coach chip
  --------------------------------------------------------- */
  const Hero = (() => {
    const wrap = $('.hero__screens');
    const home = $('.scr--home', wrap);
    const phone = $('.hero__phone');
    const order = ['home', 'rates', 'convert', 'charts', 'ai'];
    const src = {
      rates: () => $('#rates .scr--workout'),
      convert: () => $('#scan .scr--scan'),
      charts: () => $('#charts .scr--progress'),
      ai: () => $('#coach .scr--chat')
    };
    let current = 'home';
    let stop = null;
    let busy = false;
    let ready = false;

    function show(name) {
      if (name === current || busy) return;
      busy = true;
      const dir = order.indexOf(name) > order.indexOf(current) ? 1 : -1;
      const old = $('.scr.is-on', wrap);
      let el;
      if (name === 'home') el = home;
      else {
        el = src[name]().cloneNode(true);
        if (name === 'ai') {
          const msgs = $('.ch-msgs', el);
          msgs.innerHTML = '<div class="msg msg--ai">Hi Sara 👋 Your <b>GBP alert</b> is just 0.45% away.</div><div class="msg msg--me">Convert $200 to Toman</div><div class="msg msg--ai">$200 is about <b>19,690,000 T</b> at today\'s live rate.</div>';
          gsap.set(msgs, { clearProps: 'transform' });
        }
      }
      el.classList.add('is-on');
      wrap.appendChild(el);
      $$('.tb--hero button').forEach((b) => b.classList.toggle('is-on', b.dataset.go === name));
      stop && stop();
      stop = null;
      gsap.fromTo(el, { xPercent: dir * 14, opacity: 0 }, { xPercent: 0, opacity: 1, duration: reduce ? 0 : 0.55, ease: 'out', clearProps: 'transform' });
      gsap.to(old, {
        xPercent: -dir * 14, opacity: 0, duration: reduce ? 0 : 0.45, ease: 'power2.in',
        onComplete: () => { old.classList.remove('is-on'); old.remove(); gsap.set(old, { clearProps: 'all' }); busy = false; }
      });
      current = name;
      stop = Screens[name](el);
    }

    function coachChip() {
      const el = $('.js-coach-chip');
      const msgs = ['Alert: USD hit target', 'Pound up 1.24% today', 'EUR alert set · 114k', 'Rate locked · 5 min'];
      let i = 0;
      const next = () => {
        i = (i + 1) % msgs.length;
        gsap.timeline()
          .to('.chip--coach', { y: -6, duration: 0.25, ease: 'power2.out' })
          .to(el, { duration: 0.9, scrambleText: { text: msgs[i], chars: 'upperAndLowerCase', speed: 0.6 } }, 0)
          .to('.chip--coach', { y: 0, duration: 0.7, ease: 'elastic.out(1, .4)' }, 0.25);
      };
      if (!reduce) setInterval(next, 4200);
    }

    function tilt() {
      if (!finePointer || reduce) return;
      const stage = $('.hero__visual');
      const glare = document.createElement('i');
      glare.className = 'iphone__glare';
      phone.appendChild(glare);
      const rX = gsap.quickTo(phone, 'rotationX', { duration: 1, ease: 'power3' });
      const rY = gsap.quickTo(phone, 'rotationY', { duration: 1, ease: 'power3' });
      const c1x = gsap.quickTo('.chip--kcal', 'x', { duration: 1.2, ease: 'power3' }), c1y = gsap.quickTo('.chip--kcal', 'y', { duration: 1.2, ease: 'power3' });
      const c2x = gsap.quickTo('.chip--coach', 'x', { duration: 1.2, ease: 'power3' });
      const gx = gsap.quickTo('.hero__glow', 'x', { duration: 1.6, ease: 'power3' }), gy = gsap.quickTo('.hero__glow', 'y', { duration: 1.6, ease: 'power3' });
      stage.addEventListener('pointermove', (e) => {
        if (!ready) return;
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rY(px * 16); rX(-py * 12);
        c1x(px * -26); c1y(py * -18); c2x(px * 30);
        gx(px * 80); gy(py * 60);
        glare.style.backgroundPosition = `${50 - px * 120}% 50%`;
      });
      stage.addEventListener('pointerleave', () => { rX(0); rY(0); c1x(0); c1y(0); c2x(0); gx(0); gy(0); });
    }

    function init() {
      $('.tb--hero').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) show(b.dataset.go);
      });
      coachChip();
      tilt();
    }
    function start() { stop = Screens.home(home); gsap.delayedCall(reduce ? 0 : 1.1, () => { ready = true; }); }
    return { init, start };
  })();

  /* ---------------------------------------------------------
     Section reveals
  --------------------------------------------------------- */
  function splitLines() {
    $$('[data-lines]').forEach((el) => {
      el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) => `<span class="lx"><span>${p.trim()}</span></span>`).join('');
    });
  }
  function initReveals() {
    if (reduce) return;
    $$('[data-lines]').forEach((el) => {
      gsap.from($$('.lx > span', el), { yPercent: 112, duration: 1.15, stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    const fades = $$('[data-fade]');
    gsap.set(fades, { opacity: 0, y: 26 });
    ScrollTrigger.batch(fades, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1, stagger: 0.08, clearProps: 'transform' }) });
    $$('.eyebrow').forEach((e) => {
      if (e.closest('.hero')) return;
      gsap.from(e, { opacity: 0, x: -14, duration: 0.9, scrollTrigger: { trigger: e, start: 'top 90%', once: true } });
      gsap.from($('svg', e), { rotation: -270, scale: 0.4, duration: 1.2, scrollTrigger: { trigger: e, start: 'top 90%', once: true } });
    });
    $$('.ticks').forEach((list) => {
      const items = $$('li', list);
      gsap.from(items, { opacity: 0, x: 24, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
      gsap.from($$('i', list), { scale: 0, rotation: -120, duration: 0.8, stagger: 0.1, ease: 'back.out(2.2)', scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
    });
  }

  function initStats() {
    $$('.js-count').forEach((el) => {
      const to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10), suf = el.dataset.suffix || '';
      const paint = (v) => { el.textContent = fmt(v, dec) + suf; };
      if (reduce) { paint(to); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => paint(o.v) }); } });
    });
  }

  function initWho() {
    if (reduce) return;
    $$('.who-card').forEach((card, i) => {
      const img = $('.who-card__img', card);
      const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 88%', once: true }, delay: i * 0.12 });
      tl.fromTo(img, { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'inout' })
        .from($('img', img), { scale: 1.4, duration: 1.8, ease: 'out', clearProps: 'transform' }, 0)
        .from($$('small, h3, p', card), { opacity: 0, y: 18, duration: 0.8, stagger: 0.07 }, 0.5);
    });
  }

  function initFeatures() {
    $$('.feat').forEach((sec) => {
      const media = $('.feat__media', sec), panel = $('.feat__panel', sec), phone = $('.feat__phone', sec);
      if (!reduce) {
        gsap.fromTo(panel, { clipPath: 'inset(18% 10% 18% 10% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.5, ease: 'inout', scrollTrigger: { trigger: media, start: 'top 85%', once: true } });
        gsap.from(phone, { opacity: 0, scale: 0.86, rotationX: 22, transformPerspective: 1200, duration: 1.5, scrollTrigger: { trigger: media, start: 'top 82%', once: true } });
        gsap.fromTo(phone, { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
        const chip = $('.chip', media);
        if (chip) {
          gsap.from(chip, { scale: 0.5, opacity: 0, duration: 1, delay: 0.8, ease: 'back.out(1.8)', scrollTrigger: { trigger: media, start: 'top 75%', once: true } });
          gsap.fromTo(chip, { y: 30 }, { y: -40, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      }
      const scr = $('.scr', phone);
      liveScreen(scr, scr.dataset.screen, media);
    });
  }

  /* ---------------------------------------------------------
     AI Coach chat
  --------------------------------------------------------- */
  const Coach = (() => {
    const panel = $('.coach__panel');
    const body = $('.coach .ch-body');
    const msgs = $('.coach .ch-msgs');
    const prompts = $$('.prompt');
    const QA = [
      {
        q: "What's the pound rate right now?",
        a: 'The pound is <b>131,900 T</b> to buy and <b>131,200 T</b> to sell — up <b>1.24%</b> today.',
        extra: '<div class="msg-table"><div><span>Day high</span><span>132,400</span></div><div><span>Day low</span><span>129,850</span></div><div><span>7-day average</span><span>130,620</span></div></div><span class="msg-btn"><svg><use href="#i-bell"/></svg>Set an alert</span>'
      },
      {
        q: 'How much is £500 in Toman?',
        a: '£500 is <b>65,600,000 T</b> at today\'s live rate — with no fee to your Arzino wallet.',
        extra: '<span class="msg-btn"><svg><use href="#i-swap"/></svg>Exchange now</span>'
      },
      {
        q: 'How did the dollar move this week?',
        a: 'The dollar rose <b>+0.62%</b> this week, peaking on Thursday. Volatility stayed <b>low</b>.',
        extra: '<div class="msg-bars"><i style="--h:48%"></i><i style="--h:56%"></i><i style="--h:52%"></i><i style="--h:100%"></i><i style="--h:74%"></i><i class="off" style="--h:22%"></i><i class="off" style="--h:18%"></i></div>'
      }
    ];
    let busy = false;
    let auto = true;
    let autoCall = null;
    let queued = null;

    function push(el) {
      const h0 = msgs.offsetHeight;
      msgs.appendChild(el);
      const h1 = msgs.offsetHeight;
      if (!reduce) gsap.fromTo(msgs, { y: h1 - h0 }, { y: 0, duration: 0.6, ease: 'out' });
      // trim old messages that scrolled far out of view
      while (msgs.offsetHeight > body.offsetHeight * 2.2 && msgs.children.length > 3) msgs.removeChild(msgs.firstElementChild);
    }
    function words(html) {
      const tpl = document.createElement('div');
      tpl.innerHTML = html;
      const walk = (n) => Array.from(n.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; f.appendChild(s); }
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      });
      walk(tpl);
      return tpl.innerHTML;
    }
    function send(i, fromUser) {
      if (fromUser) { auto = false; autoCall && autoCall.kill(); }
      if (busy) { if (fromUser) { queued = i; prompts.forEach((p, k) => p.classList.toggle('is-sent', k === i)); } return; }
      busy = true;
      const qa = QA[i];
      prompts.forEach((p, k) => p.classList.toggle('is-sent', k === i));
      const me = document.createElement('div');
      me.className = 'msg msg--me';
      me.textContent = qa.q;
      push(me);
      gsap.fromTo(me, { opacity: 0, scale: 0.9, transformOrigin: '100% 100%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
      const typing = document.createElement('div');
      typing.className = 'msg msg--ai msg--typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      gsap.delayedCall(reduce ? 0 : 0.5, () => {
        push(typing);
        gsap.fromTo(typing, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 });
        gsap.delayedCall(reduce ? 0 : 1.1, () => {
          typing.remove();
          const ai = document.createElement('div');
          ai.className = 'msg msg--ai';
          ai.innerHTML = words(qa.a) + qa.extra;
          push(ai);
          const ws = $$('.w', ai), extras = $$('.msg-table div, .msg-btn, .msg-bars', ai);
          if (!reduce) {
            gsap.fromTo(ai, { opacity: 0, scale: 0.94, transformOrigin: '0% 100%' }, { opacity: 1, scale: 1, duration: 0.4 });
            gsap.fromTo(ws, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.035, ease: 'none' });
            gsap.fromTo(extras, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, delay: ws.length * 0.035 });
            const bars = $$('.msg-bars i', ai);
            if (bars.length) gsap.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.06, delay: ws.length * 0.035 + 0.1, ease: 'back.out(1.6)' });
          }
          const doneAt = reduce ? 0 : ws.length * 0.035 + 0.8;
          gsap.delayedCall(doneAt, () => {
            busy = false;
            if (queued !== null) { const q = queued; queued = null; gsap.delayedCall(0.35, () => send(q)); }
            else if (auto && i < QA.length - 1) autoCall = gsap.delayedCall(2.6, () => send(i + 1));
          });
        });
      });
    }
    function init() {
      prompts.forEach((p) => p.addEventListener('click', () => send(+p.dataset.q, true)));
      ScrollTrigger.create({ trigger: '.coach__panel', start: 'top 60%', once: true, onEnter: () => { autoCall = gsap.delayedCall(0.8, () => { if (auto) send(0); }); } });
      panel.addEventListener('pointermove', (e) => {
        const r = panel.getBoundingClientRect();
        panel.style.setProperty('--mx', `${e.clientX - r.left}px`);
        panel.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      if (reduce) return;
      gsap.fromTo(panel, { clipPath: 'inset(0% 5% 0% 5% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: panel, start: 'top 95%', end: 'top 35%', scrub: true } });
      gsap.from('.coach__phone', { y: 220, rotation: 6, opacity: 0, duration: 1.6, scrollTrigger: { trigger: panel, start: 'top 70%', once: true } });
      gsap.from(prompts, { opacity: 0, x: -30, duration: 0.9, stagger: 0.1, scrollTrigger: { trigger: '.prompts', start: 'top 88%', once: true } });
    }
    return { init };
  })();

  /* ---------------------------------------------------------
     Four steps
  --------------------------------------------------------- */
  function initSteps() {
    const steps = $$('.step');
    if (!reduce) {
      gsap.from(steps, { y: 70, opacity: 0, duration: 1.2, stagger: 0.12, scrollTrigger: { trigger: '.steps__grid', start: 'top 85%', once: true } });
      gsap.from($$('.step__phone'), { yPercent: 40, duration: 1.6, stagger: 0.12, scrollTrigger: { trigger: '.steps__grid', start: 'top 85%', once: true }, clearProps: 'transform' });
    }
    // 01 rings
    const rings = $$('.scr--rings .rg');
    const ringVals = [78, 64, 46];
    ScrollTrigger.create({
      trigger: steps[0], start: 'top 85%', once: true,
      onEnter: () => rings.forEach((r, i) => gsap.fromTo(r, { strokeDashoffset: 100 }, { strokeDashoffset: 100 - ringVals[i], duration: reduce ? 0 : 1.8, delay: 0.3 + i * 0.15, ease: 'power3.out' }))
    });
    steps[0].addEventListener('mouseenter', () => rings.forEach((r, i) => gsap.fromTo(r, { strokeDashoffset: 100 }, { strokeDashoffset: 100 - ringVals[i], duration: 1.4, delay: i * 0.1, ease: 'power3.out' })));
    // 02 goal picker cycles
    const opts = $$('.scr--goal .gl-opt');
    const ck = $('.scr--goal .gl-ck');
    let pick = 0;
    const cycleGoal = () => {
      if (reduce) return;
      gsap.delayedCall(2.2, () => {
        pick = (pick + 1) % opts.length;
        opts.forEach((o, k) => o.classList.toggle('gl-opt--pick', k === pick));
        opts[pick].appendChild(ck);
        gsap.fromTo(ck, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2.4)' });
        gsap.fromTo(opts[pick], { scale: 0.96 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' });
        cycleGoal();
      });
    };
    ScrollTrigger.create({ trigger: steps[1], start: 'top 85%', once: true, onEnter: cycleGoal });
    // 03 alert approaching its target
    const tEl = $('.js-timer'), tLbl = $('.js-timer-lbl'), tRing = $('.scr--timer .tm-v'), meta = $('.js-tm-meta');
    const runTimer = () => {
      if (reduce) return;
      const o = { p: 0.45 };
      gsap.timeline({ repeat: -1, repeatDelay: 1.4 })
        .add(() => { tLbl.textContent = 'to target'; })
        .fromTo(o, { p: 0.45 }, { p: 0, duration: 7, ease: 'power1.inOut', onUpdate: () => { tEl.textContent = `${o.p.toFixed(2)}%`; meta.textContent = `Now ${fmt(Math.round(132500 * (1 - o.p / 100)))} · sell price`; } }, 0)
        .fromTo(tRing, { strokeDashoffset: 62 }, { strokeDashoffset: 0, duration: 7, ease: 'power1.inOut' }, 0)
        .add(() => { tEl.textContent = 'Sent'; tLbl.textContent = 'alert delivered'; })
        .fromTo('.scr--timer .tm-ring', { scale: 1 }, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 });
    };
    ScrollTrigger.create({ trigger: steps[2], start: 'top 85%', once: true, onEnter: runTimer });
    // 04 muscle glow
    if (!reduce) {
      gsap.to('.mp-glow', { scale: 1.5, opacity: 0.35, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.5 });
      gsap.fromTo('.mp-check', { scale: 0.92 }, { scale: 1.04, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
  }

  /* ---------------------------------------------------------
     Reviews slider (Draggable + inertia)
  --------------------------------------------------------- */
  const Reviews = (() => {
    const vp = $('.reviews__viewport');
    const track = $('.reviews__track');
    const prev = $('.rnav--prev'), next = $('.rnav--next');
    let drag = null, minX = 0, snaps = [];
    function measure() {
      const cs = getComputedStyle(vp);
      const inner = vp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      minX = Math.min(0, inner - track.scrollWidth);
      const cards = $$('.review', track), base = cards[0].offsetLeft;
      snaps = cards.map((c) => Math.max(minX, -(c.offsetLeft - base)));
      snaps = snaps.filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) > 2);
      if (drag) { drag.applyBounds({ minX, maxX: 0 }); }
      update();
    }
    function update() {
      const x = gsap.getProperty(track, 'x');
      const p = minX ? clamp(x / minX, 0, 1) : 0;
      prev.classList.toggle('is-off', p < 0.02);
      next.classList.toggle('is-off', p > 0.98);
    }
    const nearest = (x) => snaps.reduce((b, v, i) => (Math.abs(v - x) < Math.abs(snaps[b] - x) ? i : b), 0);
    function go(dir) {
      const x = gsap.getProperty(track, 'x');
      const i = clamp(nearest(x) + dir, 0, snaps.length - 1);
      gsap.to(track, { x: snaps[i], duration: 0.9, ease: 'out', onUpdate: update, onComplete: () => drag && drag.update() });
    }
    function init() {
      drag = Draggable.create(track, {
        type: 'x', bounds: { minX, maxX: 0 }, inertia: true, edgeResistance: 0.85, dragClickables: true,
        snap: { x: (v) => snaps[nearest(v)] },
        onDrag: update, onThrowUpdate: update
      })[0];
      measure();
      prev.addEventListener('click', () => go(-1));
      next.addEventListener('click', () => go(1));
      if (!reduce) {
        gsap.from($$('.review', track), { x: 120, opacity: 0, duration: 1.2, stagger: 0.08, scrollTrigger: { trigger: vp, start: 'top 85%', once: true } });
        ScrollTrigger.create({ trigger: vp, start: 'top 80%', once: true, onEnter: () => gsap.from($$('.review .stars svg', track), { scale: 0, rotation: -90, duration: 0.6, stagger: 0.025, ease: 'back.out(2.5)', delay: 0.4 }) });
      }
    }
    return { init, measure };
  })();

  /* ---------------------------------------------------------
     CTA
  --------------------------------------------------------- */
  function initCta() {
    const phone = $('.cta__phone');
    ScrollTrigger.create({
      trigger: '.cta__panel', start: 'top 75%', once: true,
      onEnter: () => {
        counter($('.js-rev'), 142.6, { dec: 1, dur: 2 });
        counter($('.js-members'), 1240, { dur: 2 });
        counter($('.js-checkins'), 860, { dur: 2 });
        if (!reduce) gsap.from('.ds-bars i', { scaleY: 0, duration: 1, stagger: 0.05, ease: 'back.out(1.6)', delay: 0.3 });
      }
    });
    if (reduce) return;
    gsap.fromTo(phone, { y: 160, rotation: 4 }, { y: 0, rotation: 0, ease: 'none', scrollTrigger: { trigger: '.cta__panel', start: 'top bottom', end: 'center 55%', scrub: true } });
  }

  function initFooter() {
    if (reduce) return;
    gsap.from('.footer__top > *', { y: 30, opacity: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true } });
  }

  /* ---------------------------------------------------------
     Loader + intro
  --------------------------------------------------------- */
  function waitAssets() {
    const imgs = $$('.hero img');
    const ps = imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); })));
    return Promise.race([Promise.all([document.fonts.ready, ...ps]), new Promise((r) => setTimeout(r, 4500))]);
  }
  function loader() {
    return new Promise((resolve) => {
      const num = $('.js-load'), val = $('.loader__val');
      const C = 2 * Math.PI * 52;
      gsap.set(val, { strokeDasharray: C, strokeDashoffset: C });
      gsap.from('.loader__center, .loader__brand', { opacity: 0, y: 14, duration: 0.8, stagger: 0.1 });
      const o = { v: 0 };
      const paint = () => { num.textContent = String(Math.round(o.v)).padStart(3, '0'); val.style.strokeDashoffset = C * (1 - o.v / 100); };
      const climb = gsap.to(o, { v: 86, duration: 1.6, ease: 'power2.out', onUpdate: paint });
      Promise.all([waitAssets(), new Promise((r) => setTimeout(r, 1500))]).then(() => {
        climb.kill();
        gsap.to(o, {
          v: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: paint,
          onComplete: () => {
            gsap.timeline({ onComplete: resolve })
              .to('.loader__ring', { scale: 1.15, duration: 0.35, ease: 'power2.out' })
              .to('.loader__center, .loader__brand', { opacity: 0, scale: 0.9, duration: 0.35, ease: 'power2.in' }, 0.2);
          }
        });
      });
    });
  }
  function intro() {
    gsap.set('.hero__title .ln > span', { yPercent: 112 });
    gsap.set(['.header__in > *', '.hero .eyebrow', '.hero__p', '.hero__btns > *', '.stat'], { opacity: 0, y: 22 });
    gsap.set('.hero__panel', { clipPath: 'inset(45% 40% 45% 40% round 28px)' });
    gsap.set('.hero__phone', { y: 200, rotationX: 30, opacity: 0, transformPerspective: 1400 });
    gsap.set('.chip', { scale: 0.6, opacity: 0 });
    $('.hero__grey').textContent = '';
    document.body.classList.remove('is-loading');
    const tl = gsap.timeline({ onComplete: () => { lenis && lenis.start(); ScrollTrigger.refresh(); gsap.delayedCall(6, () => $('.draft-badge').classList.add('is-mini')); } });
    tl.fromTo('.loader', { clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'inout' }, 0)
      .set('.loader', { display: 'none' })
      .to('.header__in > *', { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, clearProps: 'transform' }, 0.45)
      .to('.hero .eyebrow', { opacity: 1, y: 0, duration: 0.9 }, 0.55)
      .to('.hero__title .ln > span', { yPercent: 0, duration: 1.25, stagger: 0.1 }, 0.6)
      .to('.hero__grey', { duration: 1.4, scrambleText: { text: 'DESK', chars: 'upperCase', speed: 0.45, revealDelay: 0.2 } }, 0.95)
      .to('.hero__p', { opacity: 1, y: 0, duration: 1 }, 1.0)
      .to('.hero__btns > *', { opacity: 1, y: 0, duration: 1, stagger: 0.08, clearProps: 'transform' }, 1.1)
      .to('.hero__panel', { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, ease: 'inout' }, 0.55)
      .to('.hero__phone', { y: 0, rotationX: 0, opacity: 1, duration: 1.7, ease: 'expo.out' }, 0.95)
      .to('.chip', { scale: 1, opacity: 1, duration: 1, stagger: 0.15, ease: 'back.out(1.8)' }, 1.7)
      .to('.stat', { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 1.4)
      .add(() => Hero.start(), 1.8);
    return tl;
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  let lastW = window.innerWidth, rT;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      Reviews.measure();
      ScrollTrigger.refresh();
    }, 200);
  });

  function boot() {
    splitLines();
    initHeader();
    initCursor();
    initMagnetic();
    Hero.init();
    initStats();
    initWho();
    initFeatures();
    Coach.init();
    initSteps();
    Reviews.init();
    initCta();
    initFooter();
    document.fonts.ready.then(() => {
      initReveals();
      Reviews.measure();
      if (reduce) {
        document.body.classList.remove('is-loading');
        $('.loader').style.display = 'none';
        $('.draft-badge').classList.add('is-mini');
        Hero.start();
        return;
      }
      loader().then(intro);
    });
  }
  boot();
})();
