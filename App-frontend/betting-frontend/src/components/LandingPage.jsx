// Signed-out home. Works like the signed-in app (browse, filter, open
// markets, read the blog); trading opens a sign-up prompt instead.
// Data: fixtureSource via useDataSource() — see FIXTURES.md.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Chips, LineChart, LiveDot, MarketCard, MarketGrid, Segmented, btnPrimary, card } from "./ui.jsx";
import SignupGate from "./SignupGate.jsx";
import BlogCard from "./BlogCard.jsx";
import { CATEGORIES, isOpenListing, summarize, useMarketData, volumeOf } from "../lib/markets.js";
import { useDataSource, fetchPosts } from "../lib/dataSource.js";
import { buildHistory } from "../lib/history.js";
import { catLabel, fmt, fmtShortDate, fmtVol, timeAgo } from "../lib/format.js";
import rankImages, { RANK_KEYS, formatRank } from "../lib/rankImages.js";

const COLORS = ["var(--pr)", "var(--am)", "oklch(0.62 0.12 195)", "var(--mu)"];
const SORTS = ["Trending", "New", "Volume", "Closing soon"];
const PAGE = 12;

const STEPS = [
  { n: "01", title: "Create an account", desc: "Sign up in seconds and get access to all markets on the platform. No credit card required." },
  { n: "02", title: "Browse markets", desc: "Explore open markets across politics, sports, finance, and more. Filter by category or trending." },
  { n: "03", title: "Trade and track", desc: "Place your positions and monitor your portfolio in real time. Watch your insight pay off." },
];

/** Lead outcome = Yes for binary markets, else the highest-priced outcome. */
function leadOf(market, prices = {}) {
  const outs = market.outcomes || [];
  const yes = outs.find((o) => o.label.trim().toLowerCase() === "yes");
  return yes || [...outs].sort((a, b) => (prices[b.id] ?? 0) - (prices[a.id] ?? 0))[0];
}

/* ── hero carousel ─────────────────────────────────────────────────── */
function Featured({ items, prices, trades, meta, onTrade }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const n = items.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => { if (!paused.current) setI((x) => (x + 1) % n); }, 8000);
    return () => clearInterval(t);
  }, [n]);

  if (!n) return <div className={`${card} flex-[2_1_620px] min-h-[440px] animate-pulse`} />;
  const m = items[i % n];
  const p = prices[m.id] || {};
  const s = summarize(m, p, trades[m.id]);
  const hist = buildHistory(m, trades[m.id], p, "1M");
  const ranked = [...m.outcomes].sort((a, b) => (p[b.id] ?? 0) - (p[a.id] ?? 0));
  const lines = s.binary
    ? [{ id: leadOf(m, p).id, color: "var(--pr)" }]
    : ranked.slice(0, 4).map((o, k) => ({ id: o.id, color: COLORS[k] }));
  const lead = leadOf(m, p);
  const week = buildHistory(m, trades[m.id], p, "1W").series[lead.id] || [];
  const change = week.length ? Math.round((week[week.length - 1] - week[0]) * 10) / 10 : 0;
  const tag = meta(m.id).tags[0];
  const go = (d) => setI((x) => (x + d + n) % n);

  return (
    <div
      className="flex-[2_1_620px] min-w-0 bg-sf border border-bd rounded-[18px] shadow-lift flex flex-col"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <Link to={`/markets/${m.id}`} className="block px-[22px] pt-[22px] text-tx">
        <div className="flex items-center gap-2 text-xs text-mu mb-2.5">
          <span className="font-semibold text-amt bg-ams px-2 py-[3px] rounded-md">Featured</span>
          <span>{catLabel(m.category)}</span>
          {tag && <><span>·</span><span>{tag}</span></>}
          <span className="ml-auto flex items-center gap-1.5 text-yes font-semibold"><LiveDot />LIVE</span>
        </div>
        <div className="text-[clamp(20px,2.2vw,24px)] font-[650] tracking-[-0.025em] leading-[1.25] mb-4">{m.title}</div>

        {s.binary ? (
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[40px] font-semibold tracking-[-0.05em] text-pr leading-none">{s.yes}%</span>
            <span className="text-[14px] text-mu">chance</span>
            {change !== 0 && (
              <span className={`font-mono text-[13px] font-medium ${change > 0 ? "text-yes" : "text-no"}`}>
                {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)} this week
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-[18px] gap-y-2">
            {ranked.slice(0, 4).map((o, k) => (
              <span key={o.id} className="flex items-center gap-[7px] text-[13.5px] text-tx2">
                <span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: COLORS[k] }} />
                {o.label} <span className="font-mono font-semibold text-tx">{p[o.id]}%</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <LineChart height={220} area={s.binary} lines={lines.map((ln) => ({ points: hist.series[ln.id] || [], color: ln.color }))} />
        </div>
      </Link>

      <div className="px-[22px] pt-4">
        {s.binary ? (
          <div className="grid grid-cols-2 gap-2.5">
            {["YES", "NO"].map((side) => {
              const o = m.outcomes.find((x) => x.label.toLowerCase() === side.toLowerCase());
              const price = side === "YES" ? s.yes : s.no;
              return (
                <button
                  key={side}
                  onClick={() => onTrade(m, { ...o, price }, side)}
                  className={`h-[46px] rounded-[11px] border-0 font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer hover:brightness-95 ${
                    side === "YES" ? "bg-yess text-yes" : "bg-nos text-no"
                  }`}
                >
                  Buy {side === "YES" ? "Yes" : "No"} <span className="font-mono">{price}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {ranked.slice(0, 2).map((o, k) => (
              <button
                key={o.id}
                onClick={() => onTrade(m, { ...o, price: p[o.id] }, "YES")}
                className="h-[46px] px-4 rounded-[11px] border border-bd bg-sf hover:bg-sf2 text-tx text-[14.5px] font-semibold flex items-center gap-2.5 cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-[3px] flex-none" style={{ background: COLORS[k] }} />
                <span className="truncate">{o.label}</span>
                <span className="ml-auto font-mono text-yes">Yes {p[o.id]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live tape: latest trades on this market */}
      <div className="mx-[22px] mt-4 rounded-xl bg-sf2 px-4 py-1">
        {[...(trades[m.id] || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 py-2 text-[13px] border-b border-bd last:border-b-0">
            <span className="w-6 h-6 rounded-full bg-sf text-tx2 flex items-center justify-center text-[11px] font-semibold flex-none">{t.user.charAt(0).toUpperCase()}</span>
            <span className="flex-1 min-w-0 truncate">
              <span className="font-semibold">{t.user}</span>{" "}
              <span className={t.side === "BUY" ? "text-yes font-[550]" : "text-no font-[550]"}>{t.side === "BUY" ? "bought" : "sold"}</span>{" "}
              <span className="font-mono">{fmt(t.quantity)}</span> {t.outcomeName} at <span className="font-mono">{t.pricePerShare}</span>
            </span>
            <span className="text-xs text-mu flex-none">{timeAgo(t.createdAt)}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-3 px-[22px] py-4 text-[12.5px] text-mu">
        <span><span className="font-mono text-tx2">{fmtVol(s.volume)}</span> PZC vol</span>
        <span>Closes {fmtShortDate(m.endDate)}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {items.map((x, k) => (
            <button
              key={x.id}
              aria-label={`Show featured market ${k + 1}`}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full border-0 p-0 cursor-pointer transition-all ${k === i % n ? "w-5 bg-pr" : "w-1.5 bg-bd2"}`}
            />
          ))}
          <button onClick={() => go(-1)} aria-label="Previous" className="ml-2 w-8 h-8 rounded-lg border border-bd bg-sf text-tx2 cursor-pointer hover:bg-sf2">‹</button>
          <button onClick={() => go(1)} aria-label="Next" className="w-8 h-8 rounded-lg border border-bd bg-sf text-tx2 cursor-pointer hover:bg-sf2">›</button>
        </div>
      </div>
    </div>
  );
}

/* ── sidebar: movers + hot topics ──────────────────────────────────── */
function Sidebar({ movers, topics, onTopic }) {
  return (
    <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-bd">
          <span className="text-[14px] font-semibold flex items-center gap-2"><LiveDot />Biggest movers</span>
          <span className="text-xs text-mu">24h</span>
        </div>
        {movers.map(({ m, lead, pct, change }, k) => (
          <Link key={m.id} to={`/markets/${m.id}`} className="flex items-center gap-3 px-[18px] py-3 border-b border-bd last:border-b-0 text-tx hover:bg-sf2">
            <span className="font-mono text-xs text-mu w-3">{k + 1}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] leading-[1.35] line-clamp-2">{m.title}</span>
              {lead.label.toLowerCase() !== "yes" && <span className="block text-xs text-mu mt-0.5 truncate">{lead.label}</span>}
            </span>
            <span className="text-right flex-none">
              <span className="block font-mono text-[14px] font-semibold">{pct}%</span>
              <span className={`block font-mono text-xs ${change >= 0 ? "text-yes" : "text-no"}`}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-[18px] py-3.5 border-b border-bd text-[14px] font-semibold">Hot topics</div>
        {topics.map((t, k) => (
          <button
            key={t.tag}
            onClick={() => onTopic(t.tag)}
            className="w-full flex items-center gap-3 px-[18px] py-3 border-0 border-b border-bd last:border-b-0 bg-transparent text-left text-tx cursor-pointer hover:bg-sf2"
          >
            <span className="font-mono text-xs text-mu w-3">{k + 1}</span>
            <span className="flex-1 min-w-0 text-[13.5px] font-[550] truncate">{t.tag}</span>
            <span className="text-xs text-mu">{t.count} markets</span>
            <span className="font-mono text-[13px] font-semibold w-14 text-right">{fmtVol(t.volume)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function LandingPage() {
  const source = useDataSource();
  const [markets, setMarkets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("Trending"); // "Trending" | "New" | CATEGORY | topic tag
  const [sort, setSort] = useState("Trending");
  const [shown, setShown] = useState(PAGE);
  const [gate, setGate] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    source.fetchMarkets().then((d) => setMarkets((d || []).filter(isOpenListing))).catch(() => setMarkets([]));
    fetchPosts().then(setPosts).catch(() => {});
  }, [source]);

  const { prices, trades } = useMarketData(markets, { trades: true, source });
  const ready = markets.length > 0 && markets.every((m) => prices[m.id] && trades[m.id]);

  const featured = useMemo(
    () => markets.filter((m) => source.marketMeta(m.id).featured).sort((a, b) => source.marketMeta(a.id).featured - source.marketMeta(b.id).featured),
    [markets, source]
  );

  const movers = useMemo(() => {
    if (!ready) return [];
    return markets
      .filter((m) => m.status === "ACTIVE")
      .map((m) => {
        const lead = leadOf(m, prices[m.id]);
        const pts = buildHistory(m, trades[m.id], prices[m.id], "1D").series[lead.id] || [];
        return { m, lead, pct: prices[m.id][lead.id], change: pts.length ? Math.round((pts[pts.length - 1] - pts[0]) * 10) / 10 : 0 };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);
  }, [ready, markets, prices, trades]);

  const topics = useMemo(() => {
    const agg = {};
    markets.forEach((m) => source.marketMeta(m.id).tags.forEach((tag) => {
      agg[tag] ??= { tag, volume: 0, count: 0 };
      agg[tag].volume += volumeOf(trades[m.id]) || 0;
      agg[tag].count += 1;
    }));
    return Object.values(agg).sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [markets, trades, source]);

  const list = useMemo(() => {
    let l = markets;
    if (CATEGORIES.includes(filter)) l = l.filter((m) => m.category === filter);
    else if (filter !== "Trending" && filter !== "New") l = l.filter((m) => source.marketMeta(m.id).tags.includes(filter));
    const effective = filter === "New" ? "New" : sort;
    const key = {
      // Trending = PZC traded in the past 7 days.
      Trending: (m) => -(volumeOf(trades[m.id]?.filter((t) => Date.now() - new Date(t.createdAt) < 7 * 864e5)) || 0),
      New: (m) => -new Date(m.createdAt).getTime(),
      Volume: (m) => -(volumeOf(trades[m.id]) || 0),
      "Closing soon": (m) => new Date(m.endDate).getTime(),
    }[effective];
    return [...l].sort((a, b) => key(a) - key(b));
  }, [markets, filter, sort, trades, source]);

  const pickFilter = (f) => {
    setFilter(f);
    setShown(PAGE);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const onTrade = (market, outcome, side) => setGate({ market, outcome, side });

  const strip = [
    { value: "Trending", label: "Trending" },
    { value: "New", label: "New" },
    ...CATEGORIES.map((c) => ({ value: c, label: catLabel(c) })),
  ];
  const isTopic = !strip.some((s) => s.value === filter);

  return (
    <div className="min-h-screen">
      {/* Category strip under the nav */}
      <div className="sticky top-[60px] z-30 bg-sf border-b border-bd">
        <div className="max-w-page mx-auto px-6 h-12 flex items-center gap-1 pz-scroll-x">
          {strip.map((s) => (
            <button
              key={s.value}
              onClick={() => pickFilter(s.value)}
              className={`flex-none h-8 px-2.5 rounded-lg border-0 text-[14px] cursor-pointer transition-colors ${
                filter === s.value ? "bg-sf2 text-tx font-semibold" : "bg-transparent text-mu font-medium hover:text-tx"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="flex-none w-px h-5 bg-bd mx-2" />
          {topics.map((t) => (
            <button
              key={t.tag}
              onClick={() => pickFilter(t.tag)}
              className={`flex-none h-8 px-2.5 rounded-lg border-0 text-[13.5px] cursor-pointer transition-colors ${
                filter === t.tag ? "bg-prs text-prt font-semibold" : "bg-transparent text-mu hover:text-tx"
              }`}
            >
              {t.tag}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-page mx-auto px-6 pt-7 pb-[72px] flex flex-col gap-7">
        {/* Hero: featured carousel + movers/topics */}
        <div className="flex flex-wrap gap-4 items-stretch">
          <Featured items={featured} prices={prices} trades={trades} meta={source.marketMeta} onTrade={onTrade} />
          <Sidebar movers={movers} topics={topics} onTopic={pickFilter} />
        </div>

        {/* Guest welcome strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-[22px] py-4 rounded-2xl bg-prs">
          <div className="min-w-0">
            <div className="text-[15px] font-[620] text-prt">Trade on what you know.</div>
            <div className="text-[13.5px] text-tx2 mt-0.5">Pryzm is free to play with virtual PZC. No real money, ever.</div>
          </div>
          <div className="ml-auto flex gap-2">
            <Link to="/blog/how-pryzm-prices-a-share" className="h-10 px-4 rounded-[10px] text-prt text-[14px] font-medium flex items-center hover:underline">How it works</Link>
            <Link to="/signup" className={btnPrimary}>Sign up free</Link>
          </div>
        </div>

        {/* All markets */}
        <section ref={gridRef} className="scroll-mt-[124px]">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="m-0 text-2xl font-[650] tracking-[-0.03em]">
              {filter === "Trending" ? "All markets" : filter === "New" ? "New markets" : isTopic ? filter : catLabel(filter)}
              <span className="font-mono text-[14px] font-medium text-mu ml-2">{list.length}</span>
            </h2>
            {filter !== "New" && <Segmented options={SORTS} value={sort} onChange={setSort} />}
          </div>
          {isTopic && (
            <div className="mb-4">
              <Chips options={[{ value: filter, label: `${filter} ✕` }]} value={filter} onChange={() => pickFilter("Trending")} small />
            </div>
          )}
          <MarketGrid>
            {list.slice(0, shown).map((m) => (
              <MarketCard key={m.id} market={m} summary={summarize(m, prices[m.id], trades[m.id])} onTrade={onTrade} />
            ))}
          </MarketGrid>
          {shown < list.length && (
            <div className="flex justify-center mt-6">
              <button onClick={() => setShown((x) => x + PAGE)} className="h-10 px-5 rounded-[10px] border border-bd2 bg-sf hover:bg-sf2 text-tx text-[14px] font-[550] cursor-pointer">
                Show more markets
              </button>
            </div>
          )}
        </section>

        {/* Blog teaser */}
        {posts.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <h2 className="m-0 text-2xl font-[650] tracking-[-0.03em]">From the blog</h2>
              <Link to="/blog" className="text-[14px] font-medium text-pr hover:text-prh">All posts →</Link>
            </div>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
              {posts.slice(0, 3).map((p) => <BlogCard key={p.slug} post={p} />)}
            </div>
          </section>
        )}
      </main>

      {/* How it works */}
      <section className="border-t border-bd bg-sf">
        <div className="max-w-page mx-auto px-6 py-[72px]">
          <h2 className="m-0 mb-9 text-[28px] font-[650] tracking-[-0.03em]">Get up and running in minutes</h2>
          <div className="grid gap-9 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`flex flex-col gap-2.5 pt-[18px] border-t-2 ${i === 0 ? "border-pr" : "border-bd2"}`}>
                <span className="font-mono text-[13px] font-medium text-amt">{s.n}</span>
                <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="m-0 text-[14.5px] leading-[1.6] text-tx2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranks */}
      <section className="max-w-page mx-auto px-6 py-[72px]">
        <div className="grid gap-10 items-center grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          <div>
            <h2 className="m-0 mb-3.5 text-[28px] font-[650] tracking-[-0.03em]">Earn your rank with accurate predictions.</h2>
            <p className="m-0 text-[15.5px] leading-[1.65] text-tx2 max-w-[460px]">
              Every resolved market counts toward your reputation. Start at Bronze 3 and climb to Gold 1 as your calls prove out.
            </p>
          </div>
          <div className="flex gap-1.5 items-end justify-between p-[22px] rounded-2xl bg-sf border border-bd">
            {RANK_KEYS.map((k, i) => (
              <img key={k} src={rankImages[k]} alt={formatRank(k)} title={formatRank(k)} className="block min-w-0 flex-[0_1_auto]" style={{ width: 40 + i * 4 }} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-page mx-auto px-6 pb-20">
        <div className="rounded-[22px] bg-pr text-white p-[clamp(36px,6vw,64px)] flex flex-wrap items-center justify-between gap-7">
          <div>
            <h2 className="m-0 mb-2.5 text-[clamp(28px,4vw,40px)] font-[650] tracking-[-0.035em] leading-[1.1]">
              <span className="block">Your edge is worth something.</span>
              <span className="block">Start proving it.</span>
            </h2>
            <p className="m-0 text-[15.5px] text-white">Join thousands of traders making their predictions count.</p>
          </div>
          <Link to="/signup" className="h-[50px] px-6 rounded-xl bg-[#fbbf24] hover:bg-[#fcd34d] text-[#1d1300] text-[15px] font-[650] flex items-center gap-2">
            Create Free Account →
          </Link>
        </div>
      </section>

      <LandingFooter />
      <SignupGate intent={gate} onClose={() => setGate(null)} />
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-bd">
      <div className="max-w-page mx-auto px-6 pt-12 pb-9 flex flex-wrap justify-between gap-10">
        <div className="max-w-[260px]">
          <div className="flex items-center gap-[9px] mb-2.5">
            <img src="/pryzm-icon.svg" alt="" className="w-6 h-6" />
            <span className="text-[16px] font-[650] tracking-[-0.02em]">Pryzm</span>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.6] text-mu">The future of prediction markets. Trade on what you know.</p>
        </div>
        <div className="flex gap-14 flex-wrap text-[14px]">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-mu">Product</span>
            <Link to="/markets" className="text-tx2 hover:text-tx">Markets</Link>
            <Link to="/dashboard" className="text-tx2 hover:text-tx">Dashboard</Link>
            <Link to="/portfolio" className="text-tx2 hover:text-tx">Portfolio</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-mu">Company</span>
            <Link to="/blog" className="text-tx2 hover:text-tx">Blog</Link>
            <a href="mailto:pryzmcompany@gmail.com" className="text-tx2 hover:text-tx">Contact</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-mu">Legal</span>
            <span className="text-mu">Terms</span>
            <span className="text-mu">Privacy</span>
          </div>
        </div>
      </div>
      <div className="max-w-page mx-auto px-6 pt-5 pb-8 border-t border-bd text-[12.5px] text-mu">
        © 2026 Pryzm. All rights reserved. Pryzm uses virtual currency only.
      </div>
    </footer>
  );
}
