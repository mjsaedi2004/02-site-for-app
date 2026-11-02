/* NetRate app bridge.
 * Drives the app demo inside a same-origin <iframe> with the app's own public hooks
 * (window.__netrate, window.__v2theme) and its demo controls. Shared by the live site
 * (assets/js/site.js) and the poster generator (tools/posters.js).
 * The app is treated as a black box: only documented hooks and visible controls are used.
 */
(function (global) {
  'use strict';

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function NetRateBridge(frame, opts) {
    opts = opts || {};
    var cfg = opts.app;                 // config.app
    var pageLang = opts.lang || 'fa';
    var instant = !!opts.instant;       // posters: no typing delays, no loops
    var loops = [];
    var runId = 0;
    var loadWaiters = [];
    var state = { theme: opts.theme || 'dusk', lang: pageLang };

    function win() { try { return frame.contentWindow; } catch (e) { return null; } }
    function doc() { var w = win(); try { return w && w.document; } catch (e) { return null; } }
    function api() { var w = win(); try { return w && w.__netrate; } catch (e) { return null; } }
    function $(sel) { var d = doc(); return d ? d.querySelector(sel) : null; }

    function writePrefs() {
      try {
        localStorage.setItem(cfg.keys.view, 'phone');
        localStorage.setItem(cfg.keys.theme, state.theme);
        localStorage.setItem(cfg.keys.lang, state.lang);
      } catch (e) { /* storage blocked: the #phone hash still skips the picker */ }
    }

    function injectCss() {
      try {
        var d = doc();
        // the document can be mid-navigation (no root yet): just try again on the next poll
        if (!d || !d.documentElement || d.getElementById('nr-site-hide')) return;
        var st = d.createElement('style');
        st.id = 'nr-site-hide';
        st.textContent = cfg.hideCss;
        (d.head || d.documentElement).appendChild(st);
      } catch (e) { /* retried by waitReady */ }
    }

    function isReady() {
      var a = api();
      try { return !!(a && a.isReady && a.isReady()); } catch (e) { return false; }
    }

    // resolves when the app (re)loads and reports ready; also used after a language relaunch
    function waitReady(timeout) {
      timeout = timeout || 12000;
      var t0 = Date.now();
      return new Promise(function (resolve, reject) {
        (function poll() {
          injectCss();
          if (isReady()) { injectCss(); resolve(true); return; }
          if (Date.now() - t0 > timeout) { reject(new Error('app not ready')); return; }
          setTimeout(poll, 60);
        })();
      });
    }

    frame.addEventListener('load', function () {
      injectCss();
      loadWaiters.splice(0).forEach(function (fn) { fn(); });
    });

    function nextLoad() { return new Promise(function (r) { loadWaiters.push(r); }); }

    function load() {
      writePrefs();
      if (!frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
      return waitReady(20000).then(function () { applyTheme(state.theme); return true; });
    }

    function click(sel) {
      var el = $(sel);
      if (el) el.click();
      return !!el;
    }

    function visible(el) {
      if (!el || el.hidden) return false;
      var w = win();
      var cs = w.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    }

    function escape() {
      var d = doc(), w = win();
      if (!d || !w) return;
      try { d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (e) {}
    }

    function applyTheme(theme) {
      state.theme = theme;
      writePrefs();
      var w = win();
      try { if (w && typeof w.__v2theme === 'function') w.__v2theme(theme); } catch (e) {}
    }

    function stopLoops() { loops.splice(0).forEach(clearInterval); }

    function setAmount(value) {
      var w = win(), inp = $('#amt');
      if (!inp) return;
      inp.value = value;
      inp.dispatchEvent(new w.Event('input', { bubbles: true }));
      inp.dispatchEvent(new w.Event('change', { bubbles: true }));
    }

    async function typeAmount(value, id) {
      setAmount('');
      if (instant) { setAmount(value); return; }
      await sleep(260);
      for (var i = 1; i <= value.length; i++) {
        if (id !== runId) return;
        setAmount(value.slice(0, i));
        await sleep(150);
      }
    }

    function scrollPage(sel, top) {
      var el = $(sel);
      if (el) el.scrollTo({ top: top === 'end' ? el.scrollHeight : top, behavior: instant ? 'auto' : 'smooth' });
    }

    async function relaunchTo(lang) {
      var a = api();
      state.lang = lang;
      writePrefs();
      try { if (a && a.lang() === lang) return; } catch (e) {}
      var reloaded = nextLoad();
      try { a.setLang(lang, lang); } catch (e) { frame.contentWindow.location.reload(); }
      await Promise.race([reloaded, sleep(6000)]);
      await waitReady();
      applyTheme(state.theme);
      await sleep(instant ? 300 : 500);
    }

    async function base(lang, id) {
      stopLoops();
      var a = api();
      if (!a) return;
      lang = lang || state.want || pageLang;
      if (a.lang && a.lang() !== lang) { await relaunchTo(lang); a = api(); }
      if (id !== runId || !a) return;
      var done = $('#setDone');
      if (done && visible($('#setSheet'))) { done.click(); await sleep(instant ? 120 : 320); }
      escape();
      // dropdown menus (rate type, currency, sort) close by toggling their trigger
      var d0 = doc();
      if (d0) Array.prototype.forEach.call(d0.querySelectorAll('[aria-expanded="true"]'), function (b) { b.click(); });
      var back = $('#sheetBack');
      if (visible(back)) { back.click(); await sleep(instant ? 120 : 280); }
      try { if (a.isPushed && a.isPushed()) { a.selectTab(a.S.tab); await sleep(instant ? 150 : 420); } } catch (e) {}
      try { if (a.S.view && a.S.view !== 'h1') click('#optView [data-v="h1"]'); } catch (e) {}
      var amt = $('#amt');
      if (amt && amt.value) { if (!click('#amtClear')) setAmount(''); }
      try { if (a.S.tab !== 'rates') { a.selectTab('rates'); await sleep(instant ? 150 : 380); } } catch (e) {}
      scrollPage('#pageRates', 0);
    }

    async function settings(key) {
      var a = api();
      a.selectTab('me');
      await sleep(instant ? 300 : 520);
      click('#gearBtn');
      await sleep(instant ? 450 : 650);
      var btn = $('#setSheet [data-go="' + key + '"]') || $('#setSheet [data-k="' + key + '"]');
      if (btn) btn.click();
    }

    // run a scene: a list of [command, ...args]; a newer run cancels an older one
    async function run(steps, lang) {
      var id = ++runId;
      state.want = lang || pageLang;
      // the app may still be reloading from an earlier language switch
      if (!isReady()) { try { await waitReady(); } catch (e) { return false; } }
      for (var i = 0; i < steps.length; i++) {
        if (id !== runId) return false;
        var s = steps[i], cmd = s[0], a = api();
        if (!a) return false;
        switch (cmd) {
          case 'base': await base(state.want, id); break;
          case 'wait': await sleep(instant ? Math.min(s[1], 500) : s[1]); break;
          case 'tab': a.selectTab(s[1]); break;
          case 'view': if (a.S.view !== s[1]) click('#optView [data-v="' + s[1] + '"]'); break;
          case 'click': click(s[1]); break;
          case 'amount': setAmount(s[1]); break;
          case 'typeAmount': await typeAmount(s[1], id); break;
          case 'scroll': scrollPage(s[1], s[2]); break;
          case 'scrollEnd': scrollPage(s[1], 'end'); break;
          case 'office': a.openOffice(s[1]); break;
          case 'officeFull': click('#officeBody .of-full'); break;
          case 'settings': await settings(s[1]); break;
          case 'otherLang':       // the app in the slot's other language, fresh from its home screen
            var other = state.want === 'fa' ? 'en' : 'fa';
            if (a.lang() === other) await base(other, id); else await relaunchTo(other);
            break;
          case 'loop':
            if (!instant && s[1] === 'tick') loops.push(setInterval(function () { click('#tickBtn'); }, s[2]));
            break;
          default: break;
        }
        if (!instant) await sleep(40);
      }
      return id === runId;
    }

    return {
      load: load,
      ready: isReady,
      run: run,
      stop: function () { runId++; stopLoops(); },
      tick: function () { click('#tickBtn'); },
      theme: applyTheme,
      lang: function () { var a = api(); try { return a ? a.lang() : state.lang; } catch (e) { return state.lang; } }
    };
  }

  global.NetRateBridge = NetRateBridge;
})(typeof window !== 'undefined' ? window : this);
