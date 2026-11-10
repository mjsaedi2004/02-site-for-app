/* Single-file exports only (tools/export.py): the site's other pages (terms, privacy, offices …) travel inside the
   one HTML file as <template id="sub-…"> and open over the home page as a full page of their own, with the same
   header and footer. Links between them, the browser's back button and links back to the home sections all work. */
(function () {
  'use strict';
  var IMG = JSON.parse(document.getElementById('sub-img').textContent);
  var layer = document.createElement('div');
  layer.className = 'sub';
  layer.id = 'sub';
  layer.hidden = true;
  layer.tabIndex = -1;
  layer.setAttribute('data-lenis-prevent', '');          // the wheel scrolls this layer, not the smooth-scrolled home
  layer.setAttribute('role', 'document');
  document.body.appendChild(layer);
  // the phone menu lives inside the home page's stacking context (.page isolates): lift it above the layer
  var ms = document.getElementById('msheet');
  if (ms) document.body.appendChild(ms);
  var current = null;
  var homeY = 0;

  function open(slug, hash, push) {
    var tpl = document.getElementById('sub-' + slug);
    if (!tpl) return false;
    if (!current) homeY = window.scrollY;
    layer.innerHTML = '';
    layer.appendChild(tpl.content.cloneNode(true));
    Array.prototype.forEach.call(layer.querySelectorAll('img[data-src]'), function (i) { i.src = IMG[i.getAttribute('data-src')] || ''; });
    layer.hidden = false;
    document.documentElement.classList.add('sub-open');
    current = slug;
    document.title = (layer.querySelector('h1') || {}).textContent + ' · NetRate';
    layer.scrollTop = 0;
    if (hash) { var t = layer.querySelector(hash); if (t) t.scrollIntoView(); }
    layer.focus({ preventScroll: true });
    if (push) { try { history.pushState({ sub: slug }, '', '#/' + slug); } catch (e) {} }
    return true;
  }
  function close(push) {
    if (!current) return;
    layer.hidden = true;
    layer.innerHTML = '';
    current = null;
    document.documentElement.classList.remove('sub-open');
    document.title = HOME_TITLE;
    window.scrollTo(0, homeY);
    if (push) { try { history.pushState({ sub: null }, '', location.pathname + location.search); } catch (e) {} }
  }
  var HOME_TITLE = document.title;

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var inLayer = layer.contains(a);
    var m = href.match(/^([\w-]+)\.html(#[\w-]+)?$/);
    if (m && m[1] !== 'index') {                          // another page of the site
      e.preventDefault(); e.stopPropagation();
      var sheet = document.getElementById('msheet');
      if (sheet && !sheet.hidden) {                       // the phone menu closes behind it
        sheet.hidden = true;
        Array.prototype.forEach.call(document.querySelectorAll('.menu-btn'), function (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Open the menu'); });
      }
      open(m[1], m[2], true);
      return;
    }
    if (!inLayer) {
      if (current && href.charAt(0) === '#') close(true);  // the phone menu's section links, over a page
      return;
    }
    if (a.hasAttribute('data-store')) { e.preventDefault(); e.stopPropagation(); toast('The store links are added when the app is released.'); return; }
    var h = href.match(/^index\.html(#[\w-]+)?$/);
    if (h) {                                              // back to the home page (or one of its sections)
      e.preventDefault(); e.stopPropagation();
      close(true);
      if (h[1]) {
        var go = document.createElement('a');             // let the home page's own smooth anchor jump take it
        go.href = h[1];
        go.style.display = 'none';
        document.body.appendChild(go);
        go.click();
        go.remove();
      }
      return;
    }
    if (href.charAt(0) === '#') {                         // a section of this page
      e.preventDefault(); e.stopPropagation();
      var t = href.length > 1 && layer.querySelector(href);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !current) return;
    var sheet = document.getElementById('msheet');
    if (sheet && !sheet.hidden) return;                   // the menu closes first
    close(true);
  }, true);
  window.addEventListener('popstate', function () {
    var m = location.hash.match(/^#\/([\w-]+)$/);
    if (m) open(m[1], null, false); else close(false);
  });
  var first = location.hash.match(/^#\/([\w-]+)$/);
  if (first) open(first[1], null, false);
})();
