// Fixture data and helpers, ported from the design's pryzm-data.js.
import type { Palette } from "../theme";

export const DAY = 864e5;
export const TODAY = new Date(2026, 9, 25).getTime();

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const sgn = (n: number) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));
export const cpt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(Math.round(n));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Hermes' toLocaleDateString ignores options on some platforms, so format by hand.
export const dstr = (d: number, yr?: boolean) => {
  const t = new Date(TODAY + d * DAY);
  return MONTHS[t.getMonth()] + " " + t.getDate() + (yr ? ", " + t.getFullYear() : "");
};

export function rng(seed: number) {
  let x = seed % 2147483647 || 1;
  return () => (x = (x * 48271) % 2147483647) / 2147483647;
}
export const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function series(seed: number, end: number, n: number, vol: number) {
  const r = rng(seed);
  let v = end + (r() - 0.5) * vol * 3;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * vol + (end - v) * 0.06;
    v = Math.max(1, Math.min(99, v));
    pts.push(v);
  }
  pts[n - 1] = end;
  return pts;
}

export function normSeries(seed: number, n: number) {
  const r = rng(seed);
  let v = 30;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.42) * 9;
    v = Math.max(5, Math.min(95, v));
    pts.push(v);
  }
  const lo = Math.min(...pts), hi = Math.max(...pts);
  return pts.map((p) => 8 + ((p - lo) / (hi - lo || 1)) * 84);
}

export const toPath = (pts: number[], w: number, h: number) =>
  pts.map((v, i) => (i ? "L" : "M") + ((i / (pts.length - 1)) * w).toFixed(1) + " " + (h - (v / 100) * h).toFixed(1)).join(" ");

export type Category = "Politics" | "Sports" | "Finance" | "Technology" | "Entertainment" | "Other";
export const CATEGORIES: Category[] = ["Politics", "Sports", "Finance", "Technology", "Entertainment", "Other"];

export type Market = {
  id: string; cat: Category; title: string; o: [string, number][];
  vol: number; end: number; age: number; move: number; up?: number; src: string; desc: string;
};

// From src/fixtures/markets.js
export const MK: Market[] = [
  { id: "boc", cat: "Finance", title: "Will the Bank of Canada cut rates in December?", o: [["Yes", 64], ["No", 36]], vol: 1842300, end: 46, age: 75, move: 5, src: "Bank of Canada rate announcement", desc: "Resolves Yes if the Bank of Canada announces a reduction to its target for the overnight rate at its scheduled December decision. Resolves No if the rate is held or raised." },
  { id: "house", cat: "Politics", title: "Which party wins the US House in the 2026 midterms?", o: [["Democratic", 63], ["Republican", 37]], vol: 9412300, end: 9, age: 210, move: 4, src: "Clerk of the US House official results", desc: "Resolves to the party that holds a majority of seats in the US House of Representatives when the results of the November 3, 2026 general election are certified." },
  { id: "stanley", cat: "Sports", title: "Stanley Cup 2027 champion", o: [["Edmonton", 17], ["Florida", 13], ["Toronto", 11], ["Colorado", 10], ["Dallas", 8], ["Field", 41]], vol: 3306200, end: 234, age: 120, move: 2, src: "NHL official results", desc: "Resolves to the team that wins the 2027 Stanley Cup Final. 'Field' covers every team not listed." },
  { id: "btc", cat: "Finance", title: "Will Bitcoin close 2026 above $150K?", o: [["Yes", 23], ["No", 77]], vol: 2904550, end: 67, age: 280, move: -4, src: "Coinbase BTC-USD daily close", desc: "Resolves Yes if the BTC/USD daily close on Coinbase for December 31, 2026 is above $150,000." },
  { id: "canada", cat: "Politics", title: "Next Canadian federal election: largest party", o: [["Liberal", 46], ["Conservative", 44], ["NDP", 6], ["Bloc Québécois", 3], ["Green", 1]], vol: 6820450, end: 1084, age: 300, move: 2, src: "Elections Canada official results", desc: "Resolves to the party that wins the most seats in the House of Commons at the next Canadian federal general election, per Elections Canada certified results." },
  { id: "fed", cat: "Finance", title: "Fed decision in December?", o: [["25 bp cut", 58], ["No change", 34], ["50+ bp cut", 6], ["Hike", 2]], vol: 4216700, end: 45, age: 80, move: 6, src: "Federal Reserve FOMC statement", desc: "Resolves to the change in the upper bound of the federal funds target range announced at the FOMC's December meeting." },
  { id: "greycup", cat: "Sports", title: "Who wins the 2026 Grey Cup?", o: [["Montreal", 31], ["Saskatchewan", 26], ["Winnipeg", 19], ["BC", 12], ["Toronto", 12]], vol: 641700, end: 21, age: 140, move: 3, src: "CFL official results", desc: "Resolves to the winner of the 113th Grey Cup." },
  { id: "raptors", cat: "Sports", title: "Will the Raptors make the 2027 playoffs?", o: [["Yes", 38], ["No", 62]], vol: 512300, end: 169, age: 60, move: 4, src: "NBA official standings", desc: "Resolves Yes if the Toronto Raptors qualify for the 2027 NBA playoffs (play-in losses resolve No)." },
  { id: "gpt6", cat: "Technology", title: "Will OpenAI release GPT-6 before July 2027?", o: [["Yes", 36], ["No", 64]], vol: 1402800, end: 249, age: 130, move: -5, src: "OpenAI official announcements", desc: "Resolves Yes if OpenAI makes a model explicitly named GPT-6 generally available before July 1, 2027." },
  { id: "foldable", cat: "Technology", title: "Will Apple announce a foldable iPhone before October 2027?", o: [["Yes", 57], ["No", 43]], vol: 723100, end: 340, age: 190, move: 3, src: "Apple newsroom", desc: "Resolves Yes if Apple officially announces an iPhone with a folding display before October 1, 2027." },
  { id: "nba", cat: "Sports", title: "2027 NBA champion", o: [["Oklahoma City", 24], ["Denver", 14], ["Boston", 12], ["New York", 9], ["Field", 41]], vol: 2214900, end: 239, age: 110, move: 1, src: "NBA official results", desc: "Resolves to the team that wins the 2027 NBA Finals. 'Field' covers every team not listed." },
  { id: "oscars", cat: "Entertainment", title: "Will a streaming-first film win Best Picture in 2027?", o: [["Yes", 31], ["No", 69]], vol: 342500, end: 140, age: 90, move: 2, src: "Academy of Motion Picture Arts and Sciences", desc: "Resolves Yes if the Best Picture winner at the 2027 Academy Awards premiered on a streaming service rather than in a wide theatrical release." },
  { id: "drake", cat: "Entertainment", title: "Will Drake release a new studio album in 2026?", o: [["Yes", 44], ["No", 56]], vol: 409800, end: 67, age: 150, move: -6, src: "Spotify / Apple Music release listings", desc: "Resolves Yes if a new solo studio album by Drake is released on major streaming platforms before December 31, 2026." },
  { id: "tsx", cat: "Finance", title: "Will the TSX close above 30,000 on December 31?", o: [["Yes", 41], ["No", 59]], vol: 384600, end: 67, age: 100, move: 3, src: "TMX Group official close", desc: "Resolves Yes if the S&P/TSX Composite Index closes above 30,000 on the final trading day of 2026." },
  { id: "hottest", cat: "Other", title: "Will 2026 be the hottest year on record?", o: [["Yes", 61], ["No", 39]], vol: 233600, end: 84, age: 170, move: 3, src: "NOAA annual global climate report", desc: "Resolves Yes if NOAA's annual global climate report ranks 2026 as the warmest year in its record." },
  { id: "snow", cat: "Other", title: "Will Toronto get a white Christmas?", o: [["Yes", 52], ["No", 48]], vol: 95400, end: 61, age: 10, move: 0, up: 37, src: "Environment Canada daily climate data", desc: "Resolves Yes if Environment Canada records at least 2 cm of snow on the ground at Toronto Pearson on the morning of December 25. Trading opens December 1." },
  { id: "jays", cat: "Sports", title: "Will the Blue Jays make the 2027 postseason?", o: [["Yes", 44], ["No", 56]], vol: 118600, end: 344, age: 12, move: 0, up: 150, src: "MLB official standings", desc: "Resolves Yes if the Toronto Blue Jays qualify for the 2027 MLB postseason. Trading opens on Opening Day." },
];

export const isBin = (m: Market) => m.o.length === 2 && m.o[0][0] === "Yes";
export const byId = (id: string) => MK.find((m) => m.id === id)!;

export const USERS = ["northbay", "priya.k", "fx_watcher", "tdot_trader", "mapleleaf_quant", "hab_fan", "lakeshore", "yyz_macro", "quietbull", "oilersfaithful", "dk_research", "ottawa_insider", "snowbird", "margaux.t", "pacific_rim", "bayst_bets", "coldbrew", "the_6ix_edge", "riverdale", "kmac", "sable", "probably_42", "j.chen", "nordic_line"];

// From src/lib/rankUtils.ts
export type RankKey = "BRONZE_3" | "BRONZE_2" | "BRONZE_1" | "SILVER_3" | "SILVER_2" | "SILVER_1" | "GOLD_3" | "GOLD_2" | "GOLD_1";
export const RANKS: RankKey[] = ["BRONZE_3", "BRONZE_2", "BRONZE_1", "SILVER_3", "SILVER_2", "SILVER_1", "GOLD_3", "GOLD_2", "GOLD_1"];
export const TIERS: [number, number | null][] = [[0, 100], [100, 150], [150, 200], [200, 300], [300, 400], [400, 550], [550, 750], [750, 1000], [1000, null]];
export const rankIndex = (pts: number) => {
  let i = 0;
  TIERS.forEach((t, k) => { if (pts >= t[0]) i = k; });
  return i;
};
export const rankProgress = (pts: number) => {
  const i = rankIndex(pts), t = TIERS[i];
  return t[1] === null
    ? { pct: 100, next: t[0], isMax: true, i }
    : { pct: Math.min(((pts - t[0]) / (t[1] - t[0])) * 100, 100), next: t[1], isMax: false, i };
};
export const rankLabel = (k: RankKey) => {
  const [a, b] = k.split("_");
  return a[0] + a.slice(1).toLowerCase() + " " + ["", "I", "II", "III"][+b];
};

export type UserProfile = { name: string; overall: number; trader: number; predictor: number; resolved: number; joined: string; email: string };
export const ME: UserProfile = { name: "aaron", overall: 342, trader: 410, predictor: 268, resolved: 38, joined: "Sep 2025", email: "aaron@pryzm.ca" };

export type MarketComment = [user: string, outcomeIndex: number, ago: string, text: string];
export const COMMENTS: MarketComment[] = [
  ["mapleleaf_quant", 0, "2h", "Priced too low given the last two data releases. Added to my position this morning."],
  ["northbay", 1, "3h", "The market is overreacting to one headline. I expect this to drift back over the next week."],
  ["fx_watcher", 0, "5h", "Volume picked up a lot after the announcement. Watching where it settles."],
  ["priya.k", 0, "1d", "Comfortable holding through resolution at these levels."],
];

export type Position = { mid: string; oi: number; qty: number; avg: number };
export const INIT_POS: Position[] = [
  { mid: "boc", oi: 0, qty: 120, avg: 52 }, { mid: "stanley", oi: 0, qty: 200, avg: 14 },
  { mid: "btc", oi: 1, qty: 80, avg: 71 }, { mid: "raptors", oi: 0, qty: 150, avg: 44 }, { mid: "canada", oi: 1, qty: 60, avg: 41 },
];

export type ResolvedPosition = { title: string; pick: string; won: boolean; qty: number; cost: number; payout: number; date: string };
export const RESOLVED: ResolvedPosition[] = [
  { title: "Will the Oilers reach the 2026 Stanley Cup Final?", pick: "Yes", won: true, qty: 100, cost: 3800, payout: 10000, date: "Jun 2" },
  { title: "Will Canada's August CPI come in above 3%?", pick: "No", won: true, qty: 120, cost: 8160, payout: 12000, date: "Sep 16" },
  { title: "Will the Bank of Canada cut rates in September?", pick: "No", won: false, qty: 150, cost: 6300, payout: 0, date: "Sep 17" },
  { title: "Will Toronto hit 35°C in July?", pick: "Yes", won: false, qty: 80, cost: 1440, payout: 0, date: "Aug 1" },
];

export const REASONS = ["Account top-up", "Tournament entry", "Promotional credit", "Referral reward", "Other"];

export type FundRequest = { id: number; amt: number; reason: string; status: "APPROVED" | "REJECTED" | "PENDING"; date: string };
export const INIT_REQS: FundRequest[] = [
  { id: 3, amt: 1000, reason: "Account top-up", status: "APPROVED", date: "Oct 21" },
  { id: 2, amt: 5000, reason: "Tournament entry", status: "REJECTED", date: "Oct 2" },
  { id: 1, amt: 10000, reason: "Promotional credit", status: "APPROVED", date: "Sep 12" },
];

export type Transaction = { date: string; type: string; kind: string; det: string; amt: number; bal: number };
export const TX: Transaction[] = [
  { date: "Oct 24", type: "Trade", kind: "Trades", det: "Bought 150 Yes · Raptors playoffs", amt: -6600, bal: 12480 },
  { date: "Oct 22", type: "Payout", kind: "Payouts", det: "Canada August CPI · No", amt: 12000, bal: 19080 },
  { date: "Oct 21", type: "Funding", kind: "Funding", det: "Fund request approved", amt: 1000, bal: 7080 },
  { date: "Oct 18", type: "Trade", kind: "Trades", det: "Sold 40 Yes · Bitcoin above $150K", amt: 1040, bal: 6080 },
  { date: "Oct 12", type: "Trade", kind: "Trades", det: "Bought 200 Edmonton · Stanley Cup", amt: -2800, bal: 5040 },
  { date: "Sep 12", type: "Funding", kind: "Funding", det: "Fund request approved", amt: 10000, bal: 10000 },
];

export type NewsItem = { cat: string; src: string; ago: string; title: string; desc: string };
export const NEWS: NewsItem[] = [
  { cat: "Finance", src: "Globe Markets", ago: "1h", title: "Bond yields slip as traders price in a December rate cut", desc: "Two-year Government of Canada yields fell for a third session after softer core inflation readings and a cautious tone from central bank officials." },
  { cat: "Finance", src: "Market Wire", ago: "3h", title: "Bitcoin steadies after a volatile week in crypto markets", desc: "The largest cryptocurrency held above key support levels as ETF flows turned positive again on Thursday." },
  { cat: "Finance", src: "Financial Daily", ago: "6h", title: "TSX edges higher, led by energy and financials", desc: "Canada’s main index gained for a second day as oil prices firmed and bank stocks recovered from early losses." },
  { cat: "Technology", src: "Tech Desk", ago: "2h", title: "Foldable phone shipments expected to double next year", desc: "Analysts say supply-chain orders point to new foldable devices from several major manufacturers in 2027." },
  { cat: "Technology", src: "The Circuit", ago: "5h", title: "AI labs race to ship the next generation of frontier models", desc: "Researchers and investors are watching for major model launches in the first half of next year." },
  { cat: "Technology", src: "Wired North", ago: "9h", title: "Satellite-to-phone texting trials expand across Canada", desc: "Carriers are testing direct-to-device service in rural regions ahead of a wider commercial rollout." },
  { cat: "Sports", src: "Rink Report", ago: "1h", title: "Oilers extend win streak to five behind strong goaltending", desc: "Edmonton moved into first place in the Pacific Division with a 4–1 win on the road." },
  { cat: "Sports", src: "CFL Insider", ago: "4h", title: "Grey Cup picture tightens heading into the division finals", desc: "Montreal and Saskatchewan enter the weekend as favourites, but injuries could reshape both matchups." },
  { cat: "Sports", src: "Hoops North", ago: "8h", title: "Raptors’ young core shows promise in early-season stretch", desc: "Toronto sits near .500 after ten games, with improved defence and ball movement." },
  { cat: "Politics", src: "Hill Times Digest", ago: "2h", title: "Midterm polling shows a narrow House race in key districts", desc: "Forecasters say a handful of suburban seats will decide control of the chamber next week." },
  { cat: "Politics", src: "Ottawa Brief", ago: "5h", title: "Federal parties trade leads in the latest national polls", desc: "The Liberals and Conservatives are within two points of each other in a new polling average." },
  { cat: "Politics", src: "Queen’s Park Today", ago: "1d", title: "Ontario PCs maintain polling lead into the winter session", desc: "The governing party remains ahead, though the gap has narrowed since the summer." },
];

type PaletteKey = keyof Omit<Palette, "shadow">;
export type Notif = { id: number; icon: string; color: PaletteKey; bg: PaletteKey; title: string; body: string; ago: string; unread: boolean };
export const NOTIFS: Notif[] = [
  { id: 1, icon: "trophy-outline", color: "yes", bg: "yess", title: "Market resolved · You won", body: "Will the Oilers reach the 2026 Stanley Cup Final? resolved Yes. 10,000 PZC paid out.", ago: "2h", unread: true },
  { id: 2, icon: "trending-up-outline", color: "prt", bg: "prs", title: "Price alert", body: "Bank of Canada December cut is now 64% (+5 this week).", ago: "5h", unread: true },
  { id: 3, icon: "wallet-outline", color: "amt", bg: "ams", title: "Fund request approved", body: "1,000 PZC was credited to your wallet.", ago: "4d", unread: true },
  { id: 4, icon: "chatbubble-outline", color: "tx2", bg: "sf2", title: "New reply", body: "northbay replied to your comment on Stanley Cup 2027 champion.", ago: "5d", unread: false },
  { id: 5, icon: "ribbon-outline", color: "prt", bg: "prs", title: "Rank up", body: "You reached Silver II. 58 points to Silver I.", ago: "1w", unread: false },
  { id: 6, icon: "time-outline", color: "amt", bg: "ams", title: "Closing soon", body: "Who wins the 2026 Grey Cup? closes in 21 days.", ago: "1w", unread: false },
];

export type Prices = Record<string, number[]>;
export type Trade = { id: string; user: string; mid: string; oi: number; side: "BUY" | "SELL"; qty: number; price: number; at: number };

export const initialPrices = (): Prices => Object.fromEntries(MK.map((m) => [m.id, m.o.map((x) => x[1])]));

export function mkTrade(r: () => number, px: Prices, at: number): Trade {
  const pool = MK.filter((m) => !m.up);
  const m = pool[Math.floor(r() * pool.length)];
  const oi = Math.floor(r() * Math.min(m.o.length, 3));
  const side = r() < 0.72 ? "BUY" : "SELL";
  const qty = [10, 25, 50, 80, 120, 200, 300, 500, 1000][Math.floor(r() * 9)];
  const p = px[m.id][oi];
  return { id: "t" + Math.floor(r() * 1e9), user: USERS[Math.floor(r() * USERS.length)], mid: m.id, oi, side, qty, price: side === "BUY" ? p : Math.max(1, p - 1), at };
}

export const ago = (at: number) => {
  const d = (Date.now() - at) / 1000;
  return d < 60 ? Math.max(1, Math.round(d)) + "s" : d < 3600 ? Math.round(d / 60) + "m" : Math.round(d / 3600) + "h";
};
