import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useWallet, userIdOf } from "../lib/wallet.jsx";
import { fetchMarkets, getJSON, summarize, useMarketData } from "../lib/markets.js";
import { fmt, signed } from "../lib/format.js";
import rankImages, { RANK_KEYS, computeRank, formatRank, rankProgress } from "../lib/rankImages.js";
import { Chips, LineChart, LiveDot, MarketCard, MarketGrid, Page, Segmented, card } from "../components/ui.jsx";
import PositionsTable from "../components/PositionsTable.jsx";
import { totals } from "../lib/positions.js";

const RANGES = ["1D", "1W", "1M", "ALL"];
const CHIPS = ["All", "Politics", "Sports", "Finance", "Technology", "Entertainment"];

function Stat({ label, children, className = "", last = false }) {
  return (
    <div className={`px-[22px] py-4 ${last ? "" : "border-r border-bd"}`}>
      <div className="text-[12.5px] text-mu mb-1">{label}</div>
      <div className={`font-mono text-[18px] font-semibold tracking-[-0.03em] ${className}`}>{children}</div>
    </div>
  );
}

function PortfolioCard({ balance, positions }) {
  const [range, setRange] = useState("1M");
  const t = totals(positions);
  const total = (balance ?? 0) + t.value;

  return (
    <div className={`${card} flex-[2_1_560px] min-w-0 flex flex-col`}>
      <div className="px-[22px] pt-[22px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[13px] text-mu mb-1.5">Portfolio value</div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono text-[38px] font-semibold tracking-[-0.05em] leading-none">{balance === null ? "—" : fmt(total)}</span>
            <span className="text-[14px] text-mu">PZC</span>
          </div>
          {/* No portfolio-history endpoint yet, so the range change can't be computed. */}
          <div className="text-[13.5px] text-mu mt-1">Value history isn’t available yet</div>
        </div>
        <Segmented options={RANGES} value={range} onChange={setRange} mono />
      </div>
      <div className="mt-[18px] mx-[22px]">
        <LineChart height={170} area lines={[{ points: [50, 50], color: "var(--pr)" }]} />
      </div>
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] border-t border-bd">
        <Stat label="Cash balance">{balance === null ? "—" : fmt(balance)}</Stat>
        <Stat label="In positions">{fmt(t.value)}</Stat>
        <Stat label="Open P/L" className={t.pl > 0 ? "text-yes" : t.pl < 0 ? "text-no" : ""}>{signed(t.pl)}</Stat>
        <Stat label="Win rate" last>—</Stat>
      </div>
    </div>
  );
}

function RankCard({ rank }) {
  const points = Number(rank?.overallPoints) || 0;
  const key = computeRank(points);
  const ri = RANK_KEYS.indexOf(key);
  const next = RANK_KEYS[Math.min(ri + 1, RANK_KEYS.length - 1)];
  const prog = rankProgress(points);
  const resolved = rank?.resolvedMarketsCount;

  return (
    <div className={`${card} flex-[1_1_300px] min-w-0 p-[22px] flex flex-col gap-[18px]`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-mu">Your rank</span>
        <Link to="/tournaments" className="text-[13px] font-medium text-pr hover:text-prh">Leaderboard →</Link>
      </div>
      <div className="flex items-center gap-[18px]">
        <img src={rankImages[key]} alt={formatRank(key)} className="w-[72px] block flex-none" />
        <div className="min-w-0">
          <div className="text-2xl font-[650] tracking-[-0.03em]">{formatRank(key)}</div>
          <div className="text-[13.5px] text-mu mt-0.5">
            {resolved != null ? `${resolved} market${resolved === 1 ? "" : "s"} resolved` : "Resolve markets to earn XP"}
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[12.5px] text-mu mb-[7px]">
          <span>Progress to {prog.isMax ? "top rank" : formatRank(next)}</span>
          <span className="font-mono text-tx2">{prog.isMax ? "Max" : `${fmt(prog.have)} / ${fmt(prog.need)} XP`}</span>
        </div>
        <div className="h-2 rounded-full bg-sf2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${prog.pct}%`, background: "linear-gradient(90deg, var(--pr), var(--am))" }} />
        </div>
      </div>
      <div className="mt-auto flex items-end gap-1 pt-4 border-t border-bd">
        {RANK_KEYS.map((k, i) => (
          <img
            key={k}
            src={rankImages[k]}
            alt={formatRank(k)}
            title={formatRank(k)}
            className="flex-[1_1_0] min-w-0 w-full block"
            style={{ opacity: i === ri ? 1 : i < ri ? 0.55 : 0.28, filter: i > ri ? "grayscale(1)" : "none" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const userId = userIdOf(user);
  const [positions, setPositions] = useState([]);
  const [rank, setRank] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [chip, setChip] = useState("All");

  useEffect(() => {
    getJSON("/api/v1/positions/me").then((d) => setPositions(Array.isArray(d) ? d : [])).catch(() => setPositions([]));
    fetchMarkets().then((d) => setMarkets((Array.isArray(d) ? d : []).filter((m) => m.status === "ACTIVE"))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    getJSON(`/api/ranks/${userId}`).then(setRank).catch(() => setRank(null));
  }, [userId]);

  const live = useMemo(
    () => (chip === "All" ? markets : markets.filter((m) => m.category === chip.toUpperCase())).slice(0, 6),
    [markets, chip]
  );
  const { prices, trades } = useMarketData(live, { trades: true });

  return (
    <Page className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[14px] text-mu mb-1">Welcome back,</div>
          <h1 className="m-0 text-[32px] font-[650] tracking-[-0.035em] leading-tight">{user?.username}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/wallet" className="h-10 px-4 rounded-[10px] bg-am hover:brightness-105 text-[#1d1300] text-[14px] font-[650] flex items-center">
            + Add Funds
          </Link>
          <Link to="/markets" className="h-10 px-4 rounded-[10px] bg-sf border border-bd hover:border-bd2 text-tx text-[14px] font-[550] flex items-center">
            Trade →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-stretch">
        <PortfolioCard balance={balance} positions={positions} />
        <RankCard rank={rank} />
      </div>

      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between px-[22px] py-[18px]">
          <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">
            Open positions <span className="font-mono text-[13px] font-medium text-mu ml-1.5">{positions.length}</span>
          </h2>
          <Link to="/portfolio" className="text-[13px] font-medium text-pr hover:text-prh">Full portfolio →</Link>
        </div>
        {positions.length ? (
          <PositionsTable positions={positions.slice(0, 5)} />
        ) : (
          <div className="px-[22px] py-10 border-t border-bd text-center text-[14px] text-mu">
            No open positions yet. <Link to="/markets" className="text-pr hover:text-prh font-medium">Browse markets →</Link>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-3.5 flex-wrap">
          <h2 className="m-0 text-xl font-[650] tracking-[-0.025em] flex items-center gap-2.5">
            <LiveDot size={8} />Live markets
          </h2>
          <Chips options={CHIPS} value={chip} onChange={setChip} small />
        </div>
        {live.length ? (
          <MarketGrid>
            {live.map((m) => <MarketCard key={m.id} market={m} summary={summarize(m, prices[m.id], trades[m.id])} />)}
          </MarketGrid>
        ) : (
          <div className="py-14 px-6 text-center border border-dashed border-bd2 rounded-2xl text-mu text-[14.5px]">
            No live markets right now — check back soon.
          </div>
        )}
      </section>
    </Page>
  );
}
