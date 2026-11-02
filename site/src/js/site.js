/* NetRate landing page behaviour. No libraries. All visible text comes from the HTML or #nr-data. */
(function () {
  'use strict';

  var root = document.documentElement;
  var DATA = JSON.parse(document.getElementById('nr-data').textContent);
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  var slowNet = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
  var LIVE = !reduceMq.matches && !slowNet;      // the moving phone with the real app
  var THEMES = ['dusk', 'light', 'dark'];
  var STORE_KEY = 'netrate-site-theme';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function posterUrl(appLang, theme, scene) {
    if (scene === 'lang') { appLang = appLang === 'fa' ? 'en' : 'fa'; scene = 'live'; }
    return DATA.poster.replace('{lang}', appLang).replace('{theme}', theme).replace('{scene}', scene);
  }

  /* ------------------------------------------------------------------ slots */
  var slots = DATA.slots.map(function (s) {
    var el = $('[data-slot="' + s.id + '"]');
    var section = el ? el.closest('section') : null;
    return {
      id: s.id, theme: s.theme, scene: s.scene, steps: s.steps || null, appLang: s.appLang,
      el: el, section: section,
      dock: el ? ($('.phone--static', el) || el) : null,
      stepEls: s.steps && section ? $$('[data-step]', section) : [],
      noteEl: s.steps && section ? $('.note', section) : null,
      rect: null
    };
  }).filter(function (s) { return s.el; });

  /* ------------------------------------------------------------------ theme story */
  var Theme = {
    current: root.getAttribute('data-theme') || 'dusk',
    mode: root.getAttribute('data-theme-mode') || 'auto',
    busy: null,
    set: function (theme, origin) {
      if (THEMES.indexOf(theme) < 0 || theme === this.current) return;
      var self = this;
      wash(origin, function () {
        self.current = theme;
        root.setAttribute('data-theme', theme);
        var m = $('meta[name="theme-color"]');
        if (m) m.setAttribute('content', DATA.themeColor[theme]);
        if (bridge) bridge.theme(theme);
        if (!LIVE) swapStaticPosters();
        else if (!appReady && activeSlot && posterEl) posterEl.src = posterUrl(activeSlot.appLang, theme, pendingScene || activeSlot.scene);
      });
      paintPicker();
    },
    pick: function (choice, btn) {
      var origin = centerOf(btn);
      if (choice === 'auto') {
        this.mode = 'auto';
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        root.setAttribute('data-theme-mode', 'auto');
        this.set(activeSlot ? activeSlot.theme : 'dusk', origin);
      } else {
        this.mode = 'lock';
        try { localStorage.setItem(STORE_KEY, choice); } catch (e) {}
        root.setAttribute('data-theme-mode', 'lock');
        this.set(choice, origin);
      }
      paintPicker();
    },
    follow: function (slot, origin) {
      if (this.mode === 'auto' && slot && slot.theme !== this.current) this.set(slot.theme, origin || phoneCenter());
    }
  };

  function centerOf(el) {
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // The new theme spreads from the phone as a growing circle while every colour morphs.
  var washAnim = null;
  function wash(origin, update) {
    var bg = $('.g-bg'), layer = $('.wash', bg), ring = $('.ring', bg);
    if (washAnim) { washAnim.finish(); }
    if (reduceMq.matches || !layer.animate) { update(); return; }
    origin = origin || { x: innerWidth / 2, y: innerHeight / 2 };
    var cs = getComputedStyle(bg);
    bg.style.backgroundImage = cs.backgroundImage;      // freeze the old ground
    bg.style.backgroundColor = cs.backgroundColor;
    update();
    var r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y)) + 40;
    var at = ' at ' + origin.x.toFixed(0) + 'px ' + origin.y.toFixed(0) + 'px)';
    bg.classList.add('is-washing');
    layer.style.opacity = '1';
    washAnim = layer.animate([{ clipPath: 'circle(0px' + at }, { clipPath: 'circle(' + r.toFixed(0) + 'px' + at }],
      { duration: 1050, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' });
    ring.style.left = origin.x + 'px';
    ring.style.top = origin.y + 'px';
    ring.animate([{ transform: 'scale(0.4)', opacity: 0.9 }, { transform: 'scale(' + (r / 20).toFixed(1) + ')', opacity: 0 }],
      { duration: 1050, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    if (layerEl && LIVE) {
      layerEl.firstElementChild.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: 0.32 }, { transform: 'scale(1)' }],
        { duration: 720, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    }
    washAnim.onfinish = function () {
      bg.style.backgroundImage = '';
      bg.style.backgroundColor = '';
      layer.style.opacity = '0';
      if (washAnim) washAnim.cancel();
      washAnim = null;
      bg.classList.remove('is-washing');
    };
  }

  function paintPicker() {
    var group = $('.themes');
    if (!group) return;
    var on = Theme.mode === 'auto' ? 'auto' : Theme.current;
    var btns = $$('[data-theme-pick]', group);
    btns.forEach(function (b, i) {
      var active = b.getAttribute('data-theme-pick') === on;
      b.setAttribute('aria-checked', active ? 'true' : 'false');
      if (active) {
        var dir = getComputedStyle(group).direction === 'rtl' ? -1 : 1;
        $('.themes__thumb', group).style.transform = 'translateX(' + (dir * i * b.offsetWidth) + 'px)';
      }
    });
  }

  $$('[data-theme-pick]').forEach(function (b) {
    b.addEventListener('click', function () { Theme.pick(b.getAttribute('data-theme-pick'), b); });
  });
  paintPicker();

  // static mode: posters follow a locked theme (story themes are already baked into each slot)
  function swapStaticPosters() {
    $$('.phone--static img').forEach(function (img) {
      var lock = Theme.mode === 'lock' ? Theme.current : null;
      var src = img.getAttribute('data-src0') || img.getAttribute('src');
      img.setAttribute('data-src0', src);
      img.setAttribute('src', lock ? src.replace(/\/(dusk|dark|light)\//, '/' + lock + '/') : src);
    });
  }
  if (!LIVE && Theme.mode === 'lock') swapStaticPosters();

  /* ------------------------------------------------------------------ the live phone */
  var layerEl = $('.phone-layer');
  var frameEl = layerEl ? $('.phone__app', layerEl) : null;
  var posterEl = layerEl ? $('.phone__poster', layerEl) : null;
  var coverEl = layerEl ? $('.phone__cover', layerEl) : null;
  var tagEl = null;
  var bridge = null;
  var activeSlot = null, activeScene = null, pendingScene = null, pendingKey = '', sceneTimer = 0, coverToken = 0;
  var pos = { x: 0, y: 0, s: 0.5, r: 0 }, vel = { x: 0, y: 0, s: 0 };
  var flightUntil = 0, rafId = 0, lastT = 0, placed = false, appReady = false;
  var PW = 414, PH = 898;

  function phoneCenter() { return { x: pos.x, y: pos.y }; }

  function nearestSlot() {
    var vh = innerHeight, focus = vh * 0.5, best = null, bestD = Infinity;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i], r = s.dock.getBoundingClientRect();
      s.rect = r;
      if (!r.width) continue;
      var d = Math.abs(r.top + r.height / 2 - focus);
      if (s === activeSlot) d -= 60;                 // hysteresis: stay put near boundaries
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  function activeStep(slot) {
    if (!slot.steps || !slot.stepEls.length) return slot.scene;
    var dock = slot.rect, vh = innerHeight, narrow = innerWidth < 960;
    var best = 0, bestD = Infinity;
    if (narrow) {
      // phones: steps are read below the pinned phone and its demo tag; a step fades out before it slides
      // under the phone, and the step on screen is the one the phone shows
      var cut = dock.bottom + 52, seen = -1, lastPast = 0;
      slot.stepEls.forEach(function (el, i) {
        var top = el.firstElementChild.getBoundingClientRect().top, past = top < cut;
        el.classList.toggle('is-past', past);
        if (past) lastPast = i;
        else if (seen < 0 && top < vh - 40) seen = i;
      });
      best = seen >= 0 ? seen : lastPast;
    } else {
      slot.stepEls.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var d = Math.abs(r.top + Math.min(r.height, vh * 0.4) / 2 - vh * 0.5);
        if (d < bestD) { bestD = d; best = i; }
        el.classList.remove('is-past');
      });
    }
    slot.stepEls.forEach(function (el, i) { el.classList.toggle('is-active', i === best); });
    if (slot.noteEl) slot.noteEl.classList.toggle('is-past', narrow && slot.noteEl.getBoundingClientRect().top < dock.bottom + 52);
    return slot.steps[best];
  }

  function tick(now) {
    rafId = 0;
    var dt = Math.min(0.05, ((now || performance.now()) - (lastT || now)) / 1000) || 0.016;
    lastT = now;
    var slot = nearestSlot();
    if (!slot) return;
    if (slot !== activeSlot) {
      if (activeSlot) flightUntil = now + 900;
      activeSlot = slot;
    }
    var scene = activeStep(slot);
    // keyed by slot too: two slots can share a scene name but not the app language
    if (slot.id + '|' + scene !== pendingKey) queueScene(slot, scene);

    var r = slot.rect, s = r.width / PW;
    var tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    if (!placed) { pos.x = tx; pos.y = ty; pos.s = s; placed = true; }
    var flying = now < flightUntil;
    var k = flying ? 150 : 1100, c = 2 * Math.sqrt(k) * (flying ? 0.82 : 1);
    // fixed 4 ms sub-steps keep the stiff spring stable when a frame arrives late (as in the app's own Spring)
    var steps = Math.max(1, Math.ceil(dt / 0.004)), h = dt / steps;
    for (var i = 0; i < steps; i++) {
      vel.x += (-k * (pos.x - tx) - c * vel.x) * h; pos.x += vel.x * h;
      vel.y += (-k * (pos.y - ty) - c * vel.y) * h; pos.y += vel.y * h;
      vel.s += (-k * (pos.s - s) - c * vel.s) * h; pos.s += vel.s * h;
    }
    if (!isFinite(pos.x + pos.y + pos.s) || Math.abs(pos.x - tx) > 4000 || Math.abs(pos.y - ty) > 4000) {
      pos.x = tx; pos.y = ty; pos.s = s; vel.x = vel.y = vel.s = 0;
    }
    var tilt = flying ? clamp(vel.x / 2600, -1, 1) * 10 : 0;
    pos.r += (tilt - pos.r) * Math.min(1, dt * 10);
    layerEl.style.transform = 'translate3d(' + (pos.x - PW / 2).toFixed(1) + 'px,' + (pos.y - PH / 2).toFixed(1) + 'px,0) rotate(' +
      pos.r.toFixed(2) + 'deg) scale(' + pos.s.toFixed(4) + ')';
    if (tagEl) tagEl.style.transform = 'translate3d(' + (pos.x - tagEl.offsetWidth / 2).toFixed(1) + 'px,' + (pos.y + PH * pos.s / 2 + 14).toFixed(1) + 'px,0)';

    // the page takes the phone's theme once the phone has arrived
    if (!flying || Math.hypot(pos.x - tx, pos.y - ty) < 40) Theme.follow(slot);

    var moving = Math.abs(vel.x) + Math.abs(vel.y) > 2 || Math.abs(vel.s) > 0.002 || Math.abs(pos.r) > 0.05 || flying;
    if (moving) wake();
  }
  function wake() { if (!rafId) rafId = requestAnimationFrame(tick); }

  // stills use the theme the section is heading to (the page may still be mid-wash)
  function stillTheme(slot) { return Theme.mode === 'lock' ? Theme.current : slot.theme; }

  function queueScene(slot, scene) {
    pendingScene = scene;
    pendingKey = slot.id + '|' + scene;
    clearTimeout(sceneTimer);
    if (!appReady) { posterEl.src = posterUrl(slot.appLang, stillTheme(slot), scene); return; }
    sceneTimer = setTimeout(function () { playScene(slot, scene); }, activeScene ? 420 : 0);
  }

  function playScene(slot, scene) {
    if (scene === activeScene && bridge.lang() === slot.appLang && scene !== 'lang') return;
    activeScene = scene;
    var needsRelaunch = scene === 'lang' || bridge.lang() !== slot.appLang;
    var covered = coverEl.classList.contains('is-on');
    var token = ++coverToken;
    // only the newest scene may lift the cover (an older one can finish while a newer relaunch runs)
    var lift = function () { if (token === coverToken) coverEl.classList.remove('is-on'); };
    if (needsRelaunch || covered) {   // hide the app's reload behind the still of the next scene
      coverEl.src = posterUrl(slot.appLang, stillTheme(slot), scene);
      coverEl.classList.add('is-on');
    }
    bridge.run(DATA.scenes[scene], slot.appLang).then(function (finished) {
      if (finished !== false) setTimeout(lift, needsRelaunch || covered ? 1100 : 0);
    }).catch(lift);
  }

  function startLive() {
    root.classList.add('is-live');
    layerEl.hidden = false;
    tagEl = document.createElement('span');
    tagEl.className = 'demo-tag live-tag';
    tagEl.textContent = layerEl.querySelector('.demo-tag').textContent;
    layerEl.querySelector('.demo-tag').remove();
    document.body.appendChild(tagEl);
    var first = slots[0];
    posterEl.src = posterUrl(first.appLang, stillTheme(first), first.scene);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', function () { placed = false; wake(); });
    tick(performance.now());
    wake();

    // load the app after the first paint, when the page is idle
    var go = function () {
      bridge = window.NetRateBridge(frameEl, { app: DATA.app, lang: DATA.lang, theme: Theme.current });
      bridge.load().then(function () {
        appReady = true;
        var slot = activeSlot || slots[0];
        playScene(slot, pendingScene || slot.scene);
        setTimeout(function () { frameEl.classList.add('is-on'); }, 700);
      }).catch(function () {      // the app cannot be driven here: keep the moving stills, free the frame
        bridge = null;
        frameEl.removeAttribute('src');
        frameEl.remove();
      });
    };
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1200); };
    if (document.readyState === 'complete') idle(go, { timeout: 2500 });
    else window.addEventListener('load', function () { idle(go, { timeout: 2500 }); });

    document.addEventListener('visibilitychange', function () {
      if (!bridge || !appReady) return;
      if (document.hidden) bridge.stop();
      else if (activeSlot) { activeScene = null; playScene(activeSlot, pendingScene); }
    });
  }

  /* ------------------------------------------------------------------ reveals */
  function reveals() {
    var els = $$('[data-rise]');
    if (!('IntersectionObserver' in window) || reduceMq.matches) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var vh = innerHeight;
    els.forEach(function (e) { if (e.getBoundingClientRect().top < vh * 0.95) e.classList.add('in'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.transitionDelay = Math.min(i, 4) * 60 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (e) { if (!e.classList.contains('in')) io.observe(e); });
  }

  /* scattered messages fall into an ordered list, and back when scrolled away */
  function viz() {
    var v = $('[data-viz]');
    if (!v) return;
    if (reduceMq.matches || !('IntersectionObserver' in window)) { v.classList.add('is-ordered'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { v.classList.toggle('is-ordered', en.isIntersecting); });
    }, { rootMargin: '-38% 0px -22% 0px' });
    io.observe(v);
  }

  /* FAQ: spring-ish height animation on top of native <details> */
  function faq() {
    $$('.qa').forEach(function (d) {
      var sum = $('summary', d), body = $('.qa__a', d);
      sum.addEventListener('click', function (e) {
        if (reduceMq.matches || !body.animate) return;
        e.preventDefault();
        if (d.open) {
          var h = body.offsetHeight;
          body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)' })
            .onfinish = function () { d.open = false; };
        } else {
          d.open = true;
          var h2 = body.offsetHeight;
          body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
        }
      });
    });
  }

  /* placeholders: store buttons and legal pages are not live yet */
  function placeholders() {
    $$('[aria-disabled="true"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.createElement('span');
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.textContent = a.getAttribute('data-toast') || DATA.text.soon;
        document.body.appendChild(t);
        var r = a.getBoundingClientRect();
        t.style.left = clamp(r.left + r.width / 2 - t.offsetWidth / 2, 8, innerWidth - t.offsetWidth - 8) + 'px';
        t.style.top = Math.max(8, r.top - t.offsetHeight - 10) + 'px';
        t.animate([{ opacity: 0, transform: 'translateY(6px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        setTimeout(function () {
          t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = function () { t.remove(); };
        }, 1300);
      });
    });
  }

  function header() {
    var bar = $('#bar');
    var on = function () { bar.classList.toggle('is-scrolled', scrollY > 8); };
    window.addEventListener('scroll', on, { passive: true });
    on();
  }

  /* static mode (reduced motion, slow connection, no live app): the theme still follows the sections,
     and a docked still follows the step being read (desktop stages) */
  function staticStory() {
    if (!('IntersectionObserver' in window)) return;
    var band = { rootMargin: '-45% 0px -45% 0px' };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var s = slots.filter(function (x) { return (x.section || x.el) === en.target; })[0];
        if (s) { activeSlot = s; Theme.follow(s, centerOf(s.dock)); }
      });
    }, band);
    slots.forEach(function (s) { io.observe(s.section || s.el); });

    slots.forEach(function (s) {
      if (!s.steps || !s.stepEls.length) return;
      var img = $('.phone--dock img', s.el);
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = s.stepEls.indexOf(en.target);
          s.stepEls.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
          if (img) showStill(img, posterUrl(s.appLang, s.theme, s.steps[i]));
        });
      }, band);
      s.stepEls.forEach(function (el) { sio.observe(el); });
      s.stepEls[0].classList.add('is-active');
    });
  }

  function showStill(img, src) {
    img.setAttribute('data-src0', src);
    var lock = Theme.mode === 'lock' ? Theme.current : null;
    var want = lock ? src.replace(/\/(dusk|dark|light)\//, '/' + lock + '/') : src;
    if (img.getAttribute('src') === want) return;
    var pre = new Image();          // swap only once decoded: no blank frame
    pre.onload = function () { img.setAttribute('src', want); };
    pre.src = want;
  }

  // read-only state for automated checks (tools/qa)
  window.__nrState = function () {
    return { live: LIVE, appReady: appReady, slot: activeSlot && activeSlot.id, scene: activeScene, pending: pendingScene,
      theme: Theme.current, mode: Theme.mode, x: Math.round(pos.x), y: Math.round(pos.y), s: +pos.s.toFixed(3) };
  };

  header();
  reveals();
  viz();
  faq();
  placeholders();
  if (LIVE && layerEl && frameEl && window.NetRateBridge) startLive();
  else staticStory();
})();
