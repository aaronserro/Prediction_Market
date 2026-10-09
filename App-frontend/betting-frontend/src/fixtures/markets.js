// ───────────────────────────────────────────────────────────────────────
// FIXTURE DATA — public (signed-out) market browsing.
//
// Every export here mirrors the shape of a real backend response so it can
// be swapped out without touching the UI. See FIXTURES.md at the project
// root for the endpoint each one stands in for. Nothing here is read when
// a user is signed in; those pages call the real API (src/lib/dataSource.js).
//
// Dates are relative to "now" so the fixtures never look stale.
// ───────────────────────────────────────────────────────────────────────

const DAY = 864e5;
const NOW = Date.now();
const iso = (ms) => new Date(ms).toISOString().slice(0, 19); // LocalDateTime, like the API

// Deterministic PRNG so the generated trades/charts are stable across reloads.
function rng(seed) {
  let x = seed % 2147483647 || 1;
  return () => (x = (x * 48271) % 2147483647) / 2147483647;
}
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/*
 * Source definitions. `outcomes` is [label, currentPrice] — the price
 * (cents == PZC == % chance) is what GET /markets/{id}/outcomes/{oid}/price
 * returns. `volume` is the target total PZC traded; `move` is the net price
 * change over the last week for the first outcome, so charts trend realistically.
 * `tags` and `featured` are fixture-only (no backend field yet).
 */
const DEFS = [
  // ── Politics ──
  { id: "us-house-2026", cat: "POLITICS", title: "Which party wins the US House in the 2026 midterms?", outcomes: [["Democratic", 63], ["Republican", 37]], volume: 9_412_300, endIn: 25, age: 210, move: 4, tags: ["US Midterms"], featured: 1,
    desc: "Resolves to the party that holds a majority of seats in the US House of Representatives when the results of the November 3, 2026 general election are certified.", source: "Clerk of the US House official results" },
  { id: "us-senate-2026", cat: "POLITICS", title: "Which party controls the US Senate after the midterms?", outcomes: [["Republican", 68], ["Democratic", 32]], volume: 7_104_800, endIn: 25, age: 210, move: -3, tags: ["US Midterms"],
    desc: "Resolves to the party with a working majority in the US Senate (including the Vice President's tie-breaking vote) once the 2026 midterm results are certified.", source: "US Senate official results" },
  { id: "canada-largest-party", cat: "POLITICS", title: "Next Canadian federal election: largest party", outcomes: [["Liberal", 46], ["Conservative", 44], ["NDP", 6], ["Bloc Québécois", 3], ["Green", 1]], volume: 6_820_450, endIn: 1100, age: 300, move: 2, tags: ["Canadian Politics"], featured: 3,
    desc: "Resolves to the party that wins the most seats in the House of Commons at the next Canadian federal general election, per Elections Canada certified results.", source: "Elections Canada official results" },
  { id: "canada-snap-election", cat: "POLITICS", title: "Will a federal election be called before July 2027?", outcomes: [["Yes", 21], ["No", 79]], volume: 872_100, endIn: 265, age: 150, move: -2, tags: ["Canadian Politics"],
    desc: "Resolves Yes if the Governor General dissolves Parliament for a general election before July 1, 2027.", source: "Elections Canada / Governor General announcements" },
  { id: "ontario-polls-leader", cat: "POLITICS", title: "Which party leads Ontario polling on December 31?", outcomes: [["PC", 52], ["Liberal", 31], ["NDP", 15], ["Green", 2]], volume: 318_900, endIn: 83, age: 90, move: -1, tags: ["Canadian Politics"],
    desc: "Resolves to the party with the highest vote share in the polling average published by 338Canada on December 31.", source: "338Canada Ontario polling average" },
  { id: "quebec-referendum", cat: "POLITICS", title: "Will Quebec announce a sovereignty referendum before 2028?", outcomes: [["Yes", 14], ["No", 86]], volume: 262_400, endIn: 448, age: 120, move: 1, tags: ["Canadian Politics"],
    desc: "Resolves Yes if the Government of Quebec formally announces a date for a sovereignty referendum before January 1, 2028.", source: "Government of Quebec announcements" },

  // ── Finance ──
  { id: "boc-december-cut", cat: "FINANCE", title: "Will the Bank of Canada cut rates in December?", outcomes: [["Yes", 64], ["No", 36]], volume: 1_842_300, endIn: 62, age: 75, move: 5, tags: ["Interest Rates"], featured: 2,
    desc: "Resolves Yes if the Bank of Canada announces a reduction to its target for the overnight rate at its scheduled December decision. Resolves No if the rate is held or raised.", source: "Bank of Canada rate announcement" },
  { id: "fed-december", cat: "FINANCE", title: "Fed decision in December?", outcomes: [["25 bp cut", 58], ["No change", 34], ["50+ bp cut", 6], ["Hike", 2]], volume: 4_216_700, endIn: 61, age: 80, move: 6, tags: ["Interest Rates"],
    desc: "Resolves to the change in the upper bound of the federal funds target range announced at the FOMC's December meeting.", source: "Federal Reserve FOMC statement" },
  { id: "btc-150k-2026", cat: "FINANCE", title: "Will Bitcoin close 2026 above $150K?", outcomes: [["Yes", 23], ["No", 77]], volume: 2_904_550, endIn: 83, age: 280, move: -4, tags: ["Crypto"], featured: 5,
    desc: "Resolves Yes if the BTC/USD daily close on Coinbase for December 31, 2026 is above $150,000.", source: "Coinbase BTC-USD daily close" },
  { id: "eth-6k", cat: "FINANCE", title: "Will Ethereum trade above $6,000 by December 31?", outcomes: [["Yes", 18], ["No", 82]], volume: 961_200, endIn: 83, age: 160, move: -2, tags: ["Crypto"],
    desc: "Resolves Yes if the ETH/USD price on Coinbase trades above $6,000 at any time before 11:59 PM ET on December 31.", source: "Coinbase ETH-USD" },
  { id: "tsx-30k", cat: "FINANCE", title: "Will the TSX close above 30,000 on December 31?", outcomes: [["Yes", 41], ["No", 59]], volume: 384_600, endIn: 83, age: 100, move: 3, tags: ["Markets"],
    desc: "Resolves Yes if the S&P/TSX Composite Index closes above 30,000 on the final trading day of 2026.", source: "TMX Group official close" },
  { id: "usdcad-140", cat: "FINANCE", title: "USD/CAD above 1.40 at year end?", outcomes: [["Yes", 47], ["No", 53]], volume: 211_900, endIn: 83, age: 70, move: -1, tags: ["Markets"],
    desc: "Resolves Yes if the Bank of Canada's published USD/CAD daily exchange rate for December 31 is above 1.4000.", source: "Bank of Canada daily exchange rates" },
  { id: "cpi-november", cat: "FINANCE", title: "Will Canada's November CPI come in above 2.5%?", outcomes: [["Yes", 38], ["No", 62]], volume: 146_300, endIn: 68, age: 40, move: -3, tags: ["Interest Rates"],
    desc: "Resolves Yes if Statistics Canada reports year-over-year CPI inflation for November above 2.5%.", source: "Statistics Canada CPI release" },
  { id: "home-price-650k", cat: "FINANCE", title: "Average Canadian home price below $650K in December?", outcomes: [["Yes", 55], ["No", 45]], volume: 121_800, endIn: 105, age: 60, move: 2, tags: ["Housing"],
    desc: "Resolves Yes if CREA's national average home price for December is below $650,000.", source: "CREA monthly statistics" },

  // ── Sports ──
  { id: "stanley-cup-2027", cat: "SPORTS", title: "Stanley Cup 2027 champion", outcomes: [["Edmonton", 17], ["Florida", 13], ["Toronto", 11], ["Colorado", 10], ["Dallas", 8], ["Field", 41]], volume: 3_306_200, endIn: 250, age: 120, move: 2, tags: ["NHL"], featured: 4,
    desc: "Resolves to the team that wins the 2027 Stanley Cup Final. 'Field' covers every team not listed.", source: "NHL official results" },
  { id: "grey-cup-2026", cat: "SPORTS", title: "Who wins the 2026 Grey Cup?", outcomes: [["Montreal", 31], ["Saskatchewan", 26], ["Winnipeg", 19], ["BC", 12], ["Toronto", 12]], volume: 641_700, endIn: 37, age: 140, move: 3, tags: ["CFL"],
    desc: "Resolves to the winner of the 113th Grey Cup.", source: "CFL official results" },
  { id: "nba-champion-2027", cat: "SPORTS", title: "2027 NBA champion", outcomes: [["Oklahoma City", 24], ["Denver", 14], ["Boston", 12], ["New York", 9], ["Field", 41]], volume: 2_214_900, endIn: 255, age: 110, move: 1, tags: ["NBA"],
    desc: "Resolves to the team that wins the 2027 NBA Finals. 'Field' covers every team not listed.", source: "NBA official results" },
  { id: "raptors-playoffs", cat: "SPORTS", title: "Will the Raptors make the 2027 playoffs?", outcomes: [["Yes", 38], ["No", 62]], volume: 512_300, endIn: 185, age: 60, move: 4, tags: ["NBA"],
    desc: "Resolves Yes if the Toronto Raptors qualify for the 2027 NBA playoffs (play-in losses resolve No).", source: "NBA official standings" },
  { id: "leafs-atlantic", cat: "SPORTS", title: "Will the Maple Leafs win the Atlantic Division?", outcomes: [["Yes", 27], ["No", 73]], volume: 289_400, endIn: 180, age: 30, move: -2, tags: ["NHL"],
    desc: "Resolves Yes if the Toronto Maple Leafs finish first in the Atlantic Division at the end of the 2026–27 regular season.", source: "NHL official standings" },
  { id: "jays-postseason-2027", cat: "SPORTS", title: "Will the Blue Jays make the 2027 postseason?", outcomes: [["Yes", 44], ["No", 56]], volume: 118_600, endIn: 360, age: 12, move: 0, tags: ["MLB"], upcoming: 150,
    desc: "Resolves Yes if the Toronto Blue Jays qualify for the 2027 MLB postseason. Trading opens on Opening Day.", source: "MLB official standings" },

  // ── Technology ──
  { id: "apple-foldable", cat: "TECHNOLOGY", title: "Will Apple announce a foldable iPhone before October 2027?", outcomes: [["Yes", 57], ["No", 43]], volume: 723_100, endIn: 356, age: 190, move: 3, tags: ["Big Tech"],
    desc: "Resolves Yes if Apple officially announces an iPhone with a folding display before October 1, 2027.", source: "Apple newsroom" },
  { id: "gpt6-before-july", cat: "TECHNOLOGY", title: "Will OpenAI release GPT-6 before July 2027?", outcomes: [["Yes", 36], ["No", 64]], volume: 1_402_800, endIn: 265, age: 130, move: -5, tags: ["AI"],
    desc: "Resolves Yes if OpenAI makes a model explicitly named GPT-6 generally available before July 1, 2027.", source: "OpenAI official announcements" },
  { id: "canada-ai-law", cat: "TECHNOLOGY", title: "Will Canada pass federal AI legislation in 2026?", outcomes: [["Yes", 9], ["No", 91]], volume: 88_400, endIn: 83, age: 200, move: -1, tags: ["AI"],
    desc: "Resolves Yes if a federal bill primarily regulating artificial intelligence receives Royal Assent before December 31, 2026.", source: "Parliament of Canada LEGISinfo" },
  { id: "starlink-phones-canada", cat: "TECHNOLOGY", title: "Direct-to-phone satellite service live in Canada by mid-2027?", outcomes: [["Yes", 49], ["No", 51]], volume: 152_700, endIn: 265, age: 80, move: 2, tags: ["Telecom"],
    desc: "Resolves Yes if a major Canadian carrier launches commercial satellite-to-phone texting or data service before July 1, 2027.", source: "Carrier press releases" },

  // ── Entertainment ──
  { id: "streaming-best-picture", cat: "ENTERTAINMENT", title: "Will a streaming-first film win Best Picture in 2027?", outcomes: [["Yes", 31], ["No", 69]], volume: 342_500, endIn: 156, age: 90, move: 2, tags: ["Oscars"],
    desc: "Resolves Yes if the Best Picture winner at the 2027 Academy Awards premiered on a streaming service rather than in a wide theatrical release.", source: "Academy of Motion Picture Arts and Sciences" },
  { id: "drake-album-2026", cat: "ENTERTAINMENT", title: "Will Drake release a new studio album in 2026?", outcomes: [["Yes", 44], ["No", 56]], volume: 409_800, endIn: 83, age: 150, move: -6, tags: ["Music"],
    desc: "Resolves Yes if a new solo studio album by Drake is released on major streaming platforms before December 31, 2026.", source: "Spotify / Apple Music release listings" },
  { id: "film-2b-2026", cat: "ENTERTAINMENT", title: "Will any 2026 release gross $2B worldwide?", outcomes: [["Yes", 22], ["No", 78]], volume: 187_300, endIn: 175, age: 110, move: -1, tags: ["Box Office"],
    desc: "Resolves Yes if any film released in 2026 reaches $2 billion in worldwide box office gross before April 1, 2027.", source: "Box Office Mojo" },

  // ── Other ──
  { id: "hottest-year-2026", cat: "OTHER", title: "Will 2026 be the hottest year on record?", outcomes: [["Yes", 61], ["No", 39]], volume: 233_600, endIn: 100, age: 170, move: 3, tags: ["Climate"],
    desc: "Resolves Yes if NOAA's annual global climate report ranks 2026 as the warmest year in its record.", source: "NOAA annual global climate report" },
  { id: "toronto-white-christmas", cat: "OTHER", title: "Will Toronto get a white Christmas?", outcomes: [["Yes", 52], ["No", 48]], volume: 95_400, endIn: 77, age: 10, move: 0, tags: ["Weather"], upcoming: 53,
    desc: "Resolves Yes if Environment Canada records at least 2 cm of snow on the ground at Toronto Pearson on the morning of December 25. Trading opens December 1.", source: "Environment Canada daily climate data" },
];

const USERS = [
  "northbay", "priya.k", "fx_watcher", "tdot_trader", "mapleleaf_quant", "hab_fan", "lakeshore", "yyz_macro", "quietbull", "oilersfaithful",
  "dk_research", "ottawa_insider", "snowbird", "margaux.t", "pacific_rim", "bayst_bets", "coldbrew", "the_6ix_edge", "riverdale", "kmac",
  "sable", "probably_42", "j.chen", "nordic_line", "stmarys", "grit", "halifax_hal", "odd_lot", "sundial", "vert",
];

/* ── generated trades (shape of GET /api/v1/trades/{marketId}) ───────── */
function generateTrades(def, market) {
  const r = rng(hash(def.id));
  const start = new Date(market.createdAt).getTime();
  const end = def.upcoming ? start + 2 * DAY : NOW - 60_000;
  const count = def.upcoming ? 0 : 70 + Math.floor(r() * 90);
  const trades = [];

  // A price path per outcome: starts away from today's price, trends toward
  // it with noise, and lands exactly on it. `f` is 0 → 1 across the market's life.
  const paths = def.outcomes.map(([, p], i) => {
    const swing = Math.max(3, Math.min(14, p * 0.35));
    const start0 = Math.max(1, Math.min(99, p - (i === 0 ? def.move * 3 : 0) + (r() - 0.5) * swing * 2));
    let v = start0;
    return (f) => {
      const target = start0 + (p - start0) * Math.pow(f, 2.5);
      const noise = (r() - 0.5) * swing * 0.9;
      v += noise + (target - v) * 0.22;
      if (f > 0.97) v = p + (v - p) * (1 - f) * 25; // settle onto today's price
      if (f > 0.997) v = p + (r() - 0.5) * Math.min(4, swing * 0.4); // small wobble in the last day
      return Math.max(1, Math.min(99, Math.round(v)));
    };
  });

  for (let k = 0; k < count; k++) {
    // Bunch trades toward the present, and put the last ~10% in the past day.
    const f = k / Math.max(1, count - 1);
    const at = k > count * 0.9 ? NOW - (1 - (k - count * 0.9) / (count * 0.1)) * DAY * 0.95 : start + (end - start) * Math.pow(f, 0.45) * 0.995;
    // Pick an outcome weighted by price so liquid outcomes trade more.
    const total = def.outcomes.reduce((s, [, p]) => s + p + 6, 0);
    let pick = r() * total, oi = 0;
    while (oi < def.outcomes.length - 1 && (pick -= def.outcomes[oi][1] + 6) > 0) oi++;
    const price = paths[oi]((at - start) / Math.max(1, NOW - start));
    trades.push({
      id: `${def.id}-t${k}`,
      marketId: def.id,
      marketTitle: def.title,
      outcomeId: market.outcomes[oi].id,
      outcomeName: def.outcomes[oi][0],
      user: USERS[Math.floor(r() * USERS.length)],
      quantity: 0, // filled below so the market hits its target volume
      pricePerShare: price,
      totalAmount: 0,
      side: r() < 0.72 ? "BUY" : "SELL",
      createdAt: iso(at),
      _w: 0.2 + r() * r() * 6,
    });
  }

  const weight = trades.reduce((s, t) => s + t._w * t.pricePerShare, 0) || 1;
  const scale = def.volume / weight;
  trades.forEach((t) => {
    t.quantity = Math.max(1, Math.round(t._w * scale / 5) * 5 || 5);
    t.totalAmount = t.quantity * t.pricePerShare;
    delete t._w;
  });
  return trades;
}

/* ── exports ─────────────────────────────────────────────────────────── */

/** Shape of GET /api/v1/markets (MarketResponse[]). */
export const FIXTURE_MARKETS = DEFS.map((d) => {
  // `upcoming` = days until trading opens.
  const startMs = d.upcoming ? NOW + d.upcoming * DAY : NOW - d.age * DAY;
  return {
    id: d.id,
    title: d.title,
    description: d.desc,
    category: d.cat,
    outcomes: d.outcomes.map(([label], i) => ({ id: `${d.id}-o${i}`, label })),
    startDate: iso(startMs),
    endDate: iso(NOW + d.endIn * DAY),
    resolutionSource: d.source,
    status: d.upcoming ? "UPCOMING" : "ACTIVE",
    createdAt: iso(NOW - d.age * DAY),
    active: !d.upcoming,
  };
});

/** Shape of GET /api/v1/markets/{id}/outcomes/{outcomeId}/price, keyed by market then outcome. */
export const FIXTURE_PRICES = Object.fromEntries(
  DEFS.map((d) => [d.id, Object.fromEntries(d.outcomes.map(([, p], i) => [`${d.id}-o${i}`, p]))])
);

/** Shape of GET /api/v1/trades/{marketId} (TradeResponse[]), keyed by market. */
export const FIXTURE_TRADES = Object.fromEntries(
  DEFS.map((d, i) => [d.id, generateTrades(d, FIXTURE_MARKETS[i])])
);

/** Fixture-only metadata with no backend field yet: topic tags and hero-carousel order. */
export const FIXTURE_MARKET_META = Object.fromEntries(
  DEFS.map((d) => [d.id, { tags: d.tags || [], featured: d.featured ?? null }])
);
