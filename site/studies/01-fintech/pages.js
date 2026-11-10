/* NetRate × Design 1 — the other pages (legal, offices, contact, 404): the phone menu and the download notes.
   No motion library: these pages are text, complete at rest. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var sheet = $('#msheet');
  function setMenu(open) {
    if (!sheet) return;
    sheet.hidden = !open;
    $$('.menu-btn').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu'); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    if (t.closest('.menu-btn')) { setMenu(sheet.hidden); return; }
    if (sheet && !sheet.hidden && (!t.closest('#msheet') || t.closest('#msheet a'))) setMenu(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
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
  // the footer's NetRate line glides only while it is on screen
  var marq = $('.marq__track');
  if (marq && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { marq.style.animationPlayState = es[0].isIntersecting ? 'running' : 'paused'; }).observe(marq.parentNode);
  }
})();
