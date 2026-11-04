#!/usr/bin/env node
/* Demo data for the NetRate design variants, taken from the app's own engine (site/app/netrate-demo.html):
   currencies, rate types and the live demo offices with their rates, fees and ages, each currency's market
   summary, the pound's 30-day market average with its dates and today's change. Writes src/data/demo.json for
   every variant that has a calculator (src/js/calc.js) and checks that calculator against the engine for every
   currency, direction, rate type and a range of amounts.

     node site/tools/demo_data.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = path.resolve(__dirname, '..');
const VARIANTS = fs.readdirSync(path.join(SITE, 'variants'))
  .map((v) => path.join(SITE, 'variants', v, 'src'))
  .filter((d) => fs.existsSync(path.join(d, 'js', 'calc.js')));
const html = fs.readFileSync(path.join(SITE, 'app', 'netrate-demo.html'), 'utf8');

function block(startText, endText) {
  const a = html.indexOf(startText);
  const b = html.indexOf(endText, a);
  if (a < 0 || b < 0) throw new Error('not found in the app: ' + startText);
  return html.slice(a, b);
}
/* an object literal that starts at `key: {` after `from` (balanced braces, strings skipped) */
function literal(from, key) {
  let i = html.indexOf(key, html.indexOf(from)) + key.length - 1;
  const s = i;
  let depth = 0, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return vm.runInNewContext('(' + html.slice(s, i + 1) + ')');
}

const ctx = vm.createContext({});
vm.runInContext(block('var NetRateEngine = (function () {', 'if (typeof module !== "undefined" && module.exports) module.exports = NetRateEngine;') + '\nthis.N = NetRateEngine;', ctx);
const N = ctx.N;
const EN = literal('var STR_EN = {', '\n  names: {');
const REL = { fa: literal('  rel: {', '  rel: {'), en: literal('var STR_EN = {', '\n  rel: {') };

const S = { cur: 'gbp', dir: 'send', type: 'cash', amount: 0, sort: 'best', featBest: false };
const E = N.bind(S);

const data = {
  source: 'site/app/netrate-demo.html (NetRateEngine), via site/tools/demo_data.js',
  cur: N.CUR.map((c) => Object.assign({ k: c.k, name: { fa: c.fa, en: EN.cur[c.k] }, unit: { fa: c.unit, en: EN.unit[c.k] }, units: { fa: c.unit, en: EN.units[c.k] } },
    c.metal ? { metal: c.metal } : { g: c.g })),
  type: Object.fromEntries(Object.entries(N.TYPE).map(([k, t]) => [k, { send: t.send, recv: t.recv, name: { fa: t.fa, en: EN.types[k] } }])),
  ex: N.EX.filter((e) => !e.st).map((e) => ({
    id: e.id, name: { fa: e.n, en: EN.offices[e.id] }, city: { fa: e.city, en: EN.cities[e.city] },
    initial: { fa: e.i, en: EN.short[e.id].charAt(0) },
    send: e.send, spr: e.spr, fee: e.fee, mins: e.mins, types: e.types, verified: !!e.ver
  })),
  rel: Object.fromEntries(['fa', 'en'].map((l) => [l, { now: REL[l].now, mins: REL[l].mins, hours: REL[l].hours, yesterday: REL[l].yesterday, days: REL[l].days }])),
  expired: N.EX.filter((e) => e.st === 'expired').map((e) => ({ id: e.id, name: { fa: e.n, en: EN.offices[e.id] }, city: { fa: e.city, en: EN.cities[e.city] },
    initial: { fa: e.i, en: EN.short[e.id].charAt(0) }, send: e.send, mins: e.mins }))[0],
  market: {}
};

/* each currency's market today (Send to Iran / buying metal, cash): highest payout or lowest price, average, count */
N.CUR.forEach((c) => {
  Object.assign(S, { cur: c.k, dir: 'send', type: 'cash', amount: 0 });
  const st = E.stats(), top = E.ranked()[0];
  data.market[c.k] = { best: E.rateOf(top), bestId: top.id, mins: top.mins, avg: st.avg, n: st.n, higherIsBetter: E.higherIsBetter() };
});

/* the pound's market average over the last 30 days (Sundays empty), with each day's date, and today's change */
const DOW = N.dayInfo(0).dow;
data.series = N.marketSeries(30, DOW).map((m, i) => {
  const d = N.dayInfo(29 - i);
  return { avg: m ? m.avg : null, g: d.g, j: d.j, dow: d.dow };
});
Object.assign(S, { cur: 'gbp', dir: 'send', type: 'cash', amount: 0 });
const today = E.stats();
const prev = data.series.slice(0, -1).reverse().find((x) => x.avg);
data.today = { avg: today.avg, hi: today.hi, lo: today.lo, n: today.n, prevAvg: prev.avg, pct: (today.avg - prev.avg) / prev.avg * 100,
  date: N.dayInfo(0) };

/* the calculator's starting state: 1,000 pounds, Send to Iran, cash */
Object.assign(S, { cur: 'gbp', dir: 'send', type: 'cash', amount: 1000 });
const start = E.ranked();
data.preset = { cur: 'gbp', dir: 'send', type: 'cash', amount: 1000, total: start.length,
  rows: start.slice(0, 3).map((e) => ({ id: e.id, value: E.resultOf(e, 1000), fee: E.feeFor(e, 1000) })),
  last: { id: start[start.length - 1].id, value: E.resultOf(start[start.length - 1], 1000) } };

/* one office's page, as the app shows it (Aria, the highest rate today) */
const aria = N.byId('aria'), prof = N.profile('aria');
data.office = { id: 'aria', rating: N.ratingMean(aria), reviews: N.reviewCount(aria), branches: aria.br, since: prof.since,
  hours: prof.hours[1], week: prof.hours, verified: !!aria.ver, types: aria.types };

/* every variant's calculator must order and price exactly like the engine */
for (const VAR of VARIANTS) {
  const calcCtx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(VAR, 'js', 'calc.js'), 'utf8'), calcCtx);
  const calc = calcCtx.window.NetRateCalc(data);
  let cases = 0;
  for (const c of N.CUR) for (const dir of ['send', 'recv']) for (const type of Object.keys(N.TYPE))
    for (const amount of [0, 1, 100, 250, 500, 999, 1000, 1001, 2500, 10000, 123456]) {
      Object.assign(S, { cur: c.k, dir, type, amount });
      const want = E.ranked().map((e) => [e.id, amount ? E.resultOf(e, amount) : E.rateOf(e)]);
      const got = calc.ranked({ cur: c.k, dir, type, amount }).map((r) => [r.ex.id, r.value]);
      const same = want.length === got.length && want.every((w, i) => w[0] === got[i][0] && Math.abs(w[1] - got[i][1]) < 1e-6);
      if (!same) { console.error(VAR, 'calc.js differs from the app engine:', { cur: c.k, dir, type, amount }, want.slice(0, 3), got.slice(0, 3)); process.exit(1); }
      cases++;
    }
  fs.mkdirSync(path.join(VAR, 'data'), { recursive: true });
  fs.writeFileSync(path.join(VAR, 'data', 'demo.json'), JSON.stringify(data, null, 1) + '\n');
  console.log(`${path.relative(SITE, VAR)}/data/demo.json: ${data.cur.length} currencies, ${data.ex.length} live offices; calc.js matches the engine in ${cases} cases`);
}
console.log('today', data.today.avg.toFixed(2), 'prev', data.today.prevAvg.toFixed(2), 'pct', data.today.pct.toFixed(3), 'dow', DOW,
  'series', data.series.filter((x) => x.avg).length, 'days with data', JSON.stringify(data.series[0].j), '->', JSON.stringify(data.series[29].j));
