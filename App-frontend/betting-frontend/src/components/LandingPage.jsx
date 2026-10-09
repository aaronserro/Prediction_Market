import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chips, Coin, LineChart, LiveDot, MarketCard, MarketGrid } from "./ui.jsx";
import { fetchMarkets, isOpenListing, summarize, useMarketData, yesOutcome } from "../lib/markets.js";
import { buildHistory } from "../lib/history.js";
import { catLabel, fmtShortDate, fmtVol } from "../lib/format.js";
import rankImages, { RANK_KEYS, formatRank } from "../lib/rankImages.js";

const CHIPS = ["Trending", "New", "Politics", "Sports", "Finance", "Technology", "Entertainment", "Other"];

const STEPS = [
  { n: "01", title: "Create an account", desc: "Sign up in seconds and get access to all markets on the platform. No credit card required." },
  { n: "02", title: "Browse markets", desc: "Explore open markets across politics, sports, finance, and more. Filter by category or trending." },
  { n: "03", title: "Trade and track", desc: "Place your positions and monitor your portfolio in real time. Watch your insight pay off." },
];

function FeaturedCard({ market, summary, history }) {
  const yes = summary?.yes;
  const yesId = yesOutcome(market)?.id;
  const points = history?.series?.[yesId] || [];
  const change = points.length ? Math.round((points[points.length - 1] - points[0]) * 10) / 10 : 0;

  return (
    <Link
      to={`/markets/${market.id}`}
      className="block bg-sf border border-bd hover:border-bd2 rounded-[18px] p-[22px] text-tx shadow-lift transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-mu mb-2.5">
        <span className="font-semibold text-amt bg-ams px-2 py-[3px] rounded-md">Featured</span>
        <span>{catLabel(market.category)}</span>
        {market.status === "ACTIVE" && (
          <span className="ml-auto flex items-center gap-1.5 text-yes font-semibold"><LiveDot />LIVE</span>
        )}
      </div>
      <div className="text-[21px] font-[620] tracking-[-0.02em] leading-[1.3] mb-[18px]">{market.title}</div>
      <div className="flex items-baseline gap-2.5 mb-1.5">
        <span className="font-mono text-[40px] font-semibold tracking-[-0.05em] text-pr leading-none">{yes ?? "—"}%</span>
        <span className="text-[14px] text-mu">chance</span>
        {change !== 0 && (
          <span className={`font-mono text-[13px] font-medium ${change > 0 ? "text-yes" : "text-no"}`}>
            {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-1.5 mb-[18px]">
        <LineChart height={150} area lines={[{ points: points.length ? points : [yes ?? 50, yes ?? 50], color: "var(--pr)" }]} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-[46px] rounded-[11px] bg-yess text-yes font-semibold text-[15px] flex items-center justify-center gap-2">
          Buy Yes <span className="font-mono">{yes ?? "—"}</span>
        </div>
        <div className="h-[46px] rounded-[11px] bg-nos text-no font-semibold text-[15px] flex items-center justify-center gap-2">
          Buy No <span className="font-mono">{yes === null || yes === undefined ? "—" : 100 - yes}</span>
        </div>
      </div>
      <div className="flex justify-between mt-3.5 text-[12.5px] text-mu">
        <span><span className="font-mono text-tx2">{summary?.volume == null ? "—" : fmtVol(summary.volume)}</span> PZC vol</span>
        <span>Closes {fmtShortDate(market.endDate)}</span>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const [markets, setMarkets] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [chip, setChip] = useState("Trending");

  useEffect(() => {
    fetchMarkets()
      .then((data) => setMarkets((Array.isArray(data) ? data : []).filter(isOpenListing)))
      .catch(() => setMarkets([]))
      .finally(() => setLoaded(true));
  }, []);

  // The landing page is only shown to signed-out visitors, and the trades
  // endpoint needs auth, so cards here show prices without volume.
  const { prices, trades } = useMarketData(markets);
  const sum = (m) => summarize(m, prices[m.id], trades[m.id]);

  const featured = useMemo(
    () => markets.find((m) => m.status === "ACTIVE" && summarize(m).binary) || markets.find((m) => summarize(m).binary),
    [markets]
  );
  const featuredHistory = featured && prices[featured.id]
    ? buildHistory(featured, trades[featured.id], prices[featured.id], "1M")
    : null;

  const list = useMemo(() => {
    let l = [...markets];
    if (chip === "New") l.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (chip === "Trending") {
      l.sort((a, b) => (trades[b.id]?.length || 0) - (trades[a.id]?.length || 0) || (a.status === "ACTIVE" ? -1 : 1));
    } else l = l.filter((m) => m.category === chip.toUpperCase());
    return l.slice(0, 6);
  }, [markets, chip, trades]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-page mx-auto px-6 pt-[72px] pb-16 grid gap-14 items-center grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))]">
        <div>
          <div className="inline-flex items-center gap-2 py-[5px] pl-2.5 pr-3 rounded-full bg-sf border border-bd text-[13px] text-tx2 mb-7">
            <LiveDot size={7} />
            Prediction markets · Free to play with PZC
          </div>
          <h1 className="m-0 mb-[22px] text-[clamp(44px,6vw,68px)] leading-[1.02] font-[650] tracking-[-0.045em]">
            <span className="block">Trade on what</span>
            <span className="block text-pr">you know.</span>
          </h1>
          <p className="m-0 mb-[34px] text-[18px] leading-[1.6] text-tx2 max-w-[520px]">
            Pryzm is a prediction market platform where your insight has real value. Turn your edge on world events into measurable outcomes.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/signup" className="h-12 px-[22px] rounded-[11px] bg-pr hover:bg-prh text-white text-[15px] font-semibold flex items-center gap-2">
              Start Trading Free <span>→</span>
            </Link>
            <Link to="/login" className="h-12 px-5 rounded-[11px] bg-sf border border-bd hover:border-bd2 text-tx text-[15px] font-medium flex items-center">
              Sign in to your account
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-[22px] gap-y-2 mt-9 text-[13px] text-mu">
            <span className="flex items-center gap-[7px]"><Coin size={12} />Virtual currency only, no real money</span>
            <span className="flex items-center gap-[7px]"><span className="w-1.5 h-1.5 bg-pr rotate-45" />Ranked from Bronze to Gold</span>
          </div>
        </div>
        {featured ? (
          <FeaturedCard market={featured} summary={sum(featured)} history={featuredHistory} />
        ) : !loaded ? (
          <div className="h-[420px] rounded-[18px] bg-sf border border-bd shadow-lift animate-pulse" />
        ) : null}
      </section>

      {/* Trending markets */}
      <section className="max-w-page mx-auto px-6 pt-2 pb-[72px]">
        <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
          <h2 className="m-0 text-2xl font-[650] tracking-[-0.03em]">Trending markets</h2>
          <Link to="/markets" className="text-[14px] font-medium text-pr hover:text-prh">View all markets →</Link>
        </div>
        <div className="mb-[18px]">
          <Chips options={CHIPS} value={chip} onChange={setChip} />
        </div>
        {loaded && list.length === 0 ? (
          <div className="py-16 px-6 text-center border border-dashed border-bd2 rounded-2xl text-mu text-[14.5px]">
            No live markets in this category right now.
          </div>
        ) : (
          <MarketGrid>
            {list.map((m) => <MarketCard key={m.id} market={m} summary={sum(m)} />)}
          </MarketGrid>
        )}
      </section>

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
              <img
                key={k}
                src={rankImages[k]}
                alt={formatRank(k)}
                title={formatRank(k)}
                className="block min-w-0 flex-[0_1_auto]"
                style={{ width: 40 + i * 4 }}
              />
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
          <Link
            to="/signup"
            className="h-[50px] px-6 rounded-xl bg-[#fbbf24] hover:bg-[#fcd34d] text-[#1d1300] text-[15px] font-[650] flex items-center gap-2"
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
