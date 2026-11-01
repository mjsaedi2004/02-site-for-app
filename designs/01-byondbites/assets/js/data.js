/* Arzino (placeholder brand) — content for Design 01.
   All prices are ILLUSTRATIVE sample values in Toman. Replace with live data/API later.
   buy  = price the desk pays when you sell that currency
   sell = price you pay when you buy that currency
   hist = sell price [today, yesterday, 7 days ago, 30 days ago] */
window.BB_DATA = {
  currencies: [
    { id: 'gbp', code: 'GBP', name: 'British Pound', flag: 'gb', city: 'london', sym: '£', buy: 131200, sell: 131900, chg: 1.24, cats: ['popular', 'europe'],
      desc: 'Sterling from trusted exchange desks, refreshed every few seconds.',
      hist: [131900, 130280, 128700, 126400], alerts: [['Sell price ≥ 132,500 T', true], ['Daily move above 1%', true], ['Weekly price summary', false]] },
    { id: 'usd', code: 'USD', name: 'US Dollar', flag: 'us', city: 'newyork', sym: '$', buy: 98450, sell: 98950, chg: 0.62, cats: ['popular', 'americas'],
      desc: 'The world\'s most traded currency, with a clear daily range.',
      hist: [98950, 98340, 97600, 96200], alerts: [['Sell price ≥ 99,000 T', true], ['Daily move above 0.5%', true], ['Morning rate digest', false]] },
    { id: 'eur', code: 'EUR', name: 'Euro', flag: 'eu', city: 'paris', sym: '€', buy: 114300, sell: 114900, chg: 0.48, cats: ['popular', 'europe'],
      desc: 'For travel, tuition and business payments across the eurozone.',
      hist: [114900, 114350, 113100, 111800], alerts: [['Buy price ≤ 113,500 T', true], ['Daily move above 1%', false], ['Weekly price summary', true]] },
    { id: 'aed', code: 'AED', name: 'UAE Dirham', flag: 'ae', city: 'dubai', sym: 'AED ', buy: 26780, sell: 26950, chg: 0.55, cats: ['popular', 'mideast'],
      desc: 'For trade, travel and family transfers between Dubai and home.',
      hist: [26950, 26800, 26580, 26200], alerts: [['Sell price ≥ 27,000 T', true], ['Daily move above 0.5%', false], ['Weekly price summary', true]] },
    { id: 'try', code: 'TRY', name: 'Turkish Lira', flag: 'tr', city: 'istanbul', sym: '₺', buy: 2360, sell: 2410, chg: -0.31, cats: ['europe', 'mideast'],
      desc: 'For trips to Istanbul, study abroad and cross-border shopping.',
      hist: [2410, 2418, 2440, 2480], alerts: [['Buy price ≤ 2,350 T', true], ['Daily move above 1%', true], ['Weekly price summary', false]] },
    { id: 'cad', code: 'CAD', name: 'Canadian Dollar', flag: 'ca', city: 'toronto', sym: 'C$', buy: 71900, sell: 72400, chg: 0.21, cats: ['americas'],
      desc: 'For students, families and transfers to Toronto and beyond.',
      hist: [72400, 72250, 71800, 70900], alerts: [['Sell price ≥ 72,500 T', true], ['Daily move above 0.5%', false], ['Weekly price summary', true]] },
    { id: 'chf', code: 'CHF', name: 'Swiss Franc', flag: 'ch', city: 'zurich', sym: 'CHF ', buy: 121800, sell: 122600, chg: 0.37, cats: ['europe'],
      desc: 'The classic safe-haven currency, tracked live all day.',
      hist: [122600, 122150, 121400, 119800], alerts: [['Sell price ≥ 123,000 T', true], ['Daily move above 1%', false], ['Weekly price summary', true]] },
    { id: 'jpy', code: 'JPY', name: 'Japanese Yen (100)', flag: 'jp', city: 'tokyo', sym: '¥', buy: 65900, sell: 66500, chg: -0.44, cats: ['mideast'],
      desc: 'Quoted per 100 yen, for travel and trade with Japan.',
      hist: [66500, 66790, 67100, 67900], alerts: [['Buy price ≤ 65,500 T', true], ['Daily move above 1%', true], ['Weekly price summary', false]] },
    { id: 'cny', code: 'CNY', name: 'Chinese Yuan', flag: 'cn', city: 'shanghai', sym: '¥', buy: 13550, sell: 13700, chg: 0.09, cats: ['mideast'],
      desc: 'For importers, suppliers and business payments to China.',
      hist: [13700, 13688, 13600, 13450], alerts: [['Sell price ≥ 13,800 T', false], ['Daily move above 0.5%', true], ['Weekly price summary', true]] },
    { id: 'aud', code: 'AUD', name: 'Australian Dollar', flag: 'au', city: 'sydney', sym: 'A$', buy: 64500, sell: 65100, chg: -0.12, cats: ['americas'],
      desc: 'For students, visas and family transfers to Australia.',
      hist: [65100, 65180, 64800, 64300], alerts: [['Buy price ≤ 64,000 T', true], ['Daily move above 1%', false], ['Weekly price summary', true]] }
  ],

  mealTabs: [
    { t1: 'Live', t2: 'Prices', desc: 'Buy and sell prices from trusted desks, updated every few seconds so you never trade on an old number.' },
    { t1: 'Smart', t2: 'Alerts', desc: 'Set a target price and get notified the moment the pound, dollar or euro reaches it.' },
    { t1: 'Instant', t2: 'Converter', desc: 'Convert any amount between 30+ currencies and Toman, with the fee shown upfront.' }
  ],

  story: [
    "It started with a simple question at a family dinner: <b>what is the real price of the pound today?</b> Five apps, five different numbers, and no idea which one to trust. That's when we realized how many people <b>exchange money blind</b> — and lose a little every time. <b>The right rate exists</b>, people just need a clear way to see it.",
    "So we built Arzino: <b>live prices from trusted desks</b>, an honest converter and alerts that tell you <b>when the market moves</b> — all designed to take the guesswork out of every single exchange.",
    "Today, families, students and businesses use Arzino to <b>exchange at the right moment</b>. Every rate, alert and order moves us closer to our mission: <b>fair exchange for everyone</b>, one transaction at a time."
  ],

  testimonials: [
    { name: 'Sara Ahmadi', loc: 'London, United Kingdom', date: 'October 08, 2026', img: 'person-01',
      text: 'I used to call three exchange shops before every transfer. Now I check Arzino, set an alert and exchange when the pound reaches my number.' },
    { name: 'Reza Karimi', loc: 'Toronto, Canada', date: 'September 21, 2026', img: 'person-02',
      text: 'The calculator shows the fee upfront, so there are no surprises. I finally know exactly what my family receives at home.' },
    { name: 'Neda Hosseini', loc: 'Dublin, Ireland', date: 'September 02, 2026', img: 'person-03',
      text: 'As a student abroad, the price alerts saved me real money on my tuition payments this year.' },
    { name: 'Maryam Rahimi', loc: 'Sydney, Australia', date: 'August 14, 2026', img: 'person-04',
      text: 'Clean, fast and honest. The live chart helps me understand the market instead of guessing.' },
    { name: 'Arash Tehrani', loc: 'Dubai, UAE', date: 'July 30, 2026', img: 'person-05',
      text: 'We pay suppliers in three currencies. The rates and history make planning every invoice so much easier.' }
  ]
};
