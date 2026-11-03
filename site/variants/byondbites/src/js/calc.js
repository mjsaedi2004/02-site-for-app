/* NetRate demo calculator: the app's own rule for ordering offices (the effective rate, fee included),
   over the app's demo offices. The data comes from the app's engine at build time (site/tools/demo_data.js),
   which also runs this file against the engine and fails the build if any order or amount differs. */
(function (g) {
  'use strict';

  function NetRateCalc(D) {
    function cur(s) {
      for (var i = 0; i < D.cur.length; i++) if (D.cur[i].k === s.cur) return D.cur[i];
      return D.cur[0];
    }
    function metal(s) { return !!cur(s).metal; }
    function fee(ex, s, amt) {
      var f = ex.fee;
      if (metal(s) || !f || f.t === 'none') return 0;
      if (f.t === 'fixed') return f.v;
      if (f.t === 'pct') return amt * f.v / 100;
      if (f.t === 'tier') return amt < f.under ? f.v : 0;
      return 0;
    }
    function rate(ex, s) {
      var c = cur(s), base = ex.send;
      if (c.metal) {
        var edge = base / 92000;
        return s.dir === 'send' ? c.metal * (2 - edge) * 1.012 : c.metal * edge * 0.988;
      }
      var t = D.type[s.type];
      return s.dir === 'send' ? base * c.g * t.send : base * c.g * (1 + ex.spr / 100) * t.recv;
    }
    /* sending (or selling metal): more is better; receiving (or buying metal): less is better */
    function higher(s) { return metal(s) ? s.dir !== 'send' : s.dir === 'send'; }
    function result(ex, s, amt) {
      var r = rate(ex, s);
      if (metal(s)) return amt * r;
      var f = fee(ex, s, amt);
      return s.dir === 'send' ? (amt - f) * r : (amt + f) * r;
    }
    function offers(ex, s) { return metal(s) || ex.types.indexOf(s.type) >= 0; }
    function ranked(s) {
      var hi = higher(s);
      var value = function (e) { return s.amount ? result(e, s, s.amount) : rate(e, s); };
      return D.ex.filter(function (e) { return offers(e, s); })
        .map(function (e) { return { ex: e, value: value(e), fee: fee(e, s, s.amount || 1000) }; })
        .sort(function (a, b) { return (hi ? b.value - a.value : a.value - b.value) || (a.ex.id < b.ex.id ? -1 : 1); });
    }
    return { cur: cur, metal: metal, fee: fee, rate: rate, result: result, higher: higher, ranked: ranked };
  }

  g.NetRateCalc = NetRateCalc;
})(typeof window !== 'undefined' ? window : this);
