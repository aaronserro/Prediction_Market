import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import rankImages, { formatRank } from "../lib/rankImages.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* ── rank thresholds (must mirror backend RankTier logic) ────────────── */
const RANK_TIERS = [
  { floor: 0,    ceil: 100  }, // BRONZE_3
  { floor: 100,  ceil: 150  }, // BRONZE_2
  { floor: 150,  ceil: 200  }, // BRONZE_1
  { floor: 200,  ceil: 300  }, // SILVER_3
  { floor: 300,  ceil: 400  }, // SILVER_2
  { floor: 400,  ceil: 550  }, // SILVER_1
  { floor: 550,  ceil: 750  }, // GOLD_3
  { floor: 750,  ceil: 1000 }, // GOLD_2
  { floor: 1000, ceil: null }, // GOLD_1 (max)
];

function rankProgress(pts) {
  const tier = [...RANK_TIERS].reverse().find((t) => pts >= t.floor) ?? RANK_TIERS[0];
  if (tier.ceil === null) return { pct: 100, next: tier.floor, isMax: true };
  return {
    pct: Math.min(((pts - tier.floor) / (tier.ceil - tier.floor)) * 100, 100),
    next: tier.ceil,
    isMax: false,
  };
}

/** Mirrors backend RankTier logic exactly */
function computeRank(pts = 0) {
  if (pts >= 1000) return "GOLD_1";
  if (pts >= 750)  return "GOLD_2";
  if (pts >= 550)  return "GOLD_3";
  if (pts >= 400)  return "SILVER_1";
  if (pts >= 300)  return "SILVER_2";
  if (pts >= 200)  return "SILVER_3";
  if (pts >= 150)  return "BRONZE_1";
  if (pts >= 100)  return "BRONZE_2";
  return "BRONZE_3";
}

/* ── icons ───────────────────────────────────────────────────────────── */
const WalletIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16" />
  </svg>
);
const TrophyIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.81 18.75 7 19.78 7 21" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.19 18.75 17 19.78 17 21" />
    <path d="M18 4H6v8c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4V4z" />
  </svg>
);
const ChevronRight = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
const ZapIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const TargetIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const FlameIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2c0 0-5 4.5-5 9a5 5 0 0 0 10 0c0-2.5-1.5-4.5-1.5-4.5S14 9 12 9c0-2 2-4 2-4s-2 1-2-3z"/></svg>
);

/* ── shared background ───────────────────────────────────────────────── */
export function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#080612] text-white relative overflow-x-hidden flex flex-col">
      {/* ambient glow — more intense */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-violet-700/25 blur-[160px] animate-[drift_22s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/[0.18] blur-[130px] animate-[drift_28s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[400px] rounded-full bg-violet-600/[0.15] blur-[180px] animate-[drift_32s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-fuchsia-600/[0.08] blur-[100px] animate-[drift_18s_ease-in-out_infinite_reverse]" />
      </div>
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
      <footer className="relative z-10 border-t border-white/[0.04] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span>&copy; 2026 Pryzm</span>
          <div className="flex gap-5">
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="/support" className="hover:text-slate-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes drift {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(25px,-18px) scale(1.04)}
          66%{transform:translate(-18px,14px) scale(.97)}
        }
        @keyframes pulse-glow {
          0%,100%{opacity:1} 50%{opacity:0.4}
        }
        @keyframes shimmer {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes xp-fill {
          from{width:0} to{width:var(--xp-width)}
        }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #080612; }
        ::-webkit-scrollbar-thumb { background: #2d1b4e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3d2a6e; }
        .shimmer-text {
          background: linear-gradient(90deg, #a78bfa, #fbbf24, #a78bfa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .card-glow:hover { box-shadow: 0 0 28px -4px rgba(139,92,246,0.35); }
        .gold-glow:hover { box-shadow: 0 0 28px -4px rgba(251,191,36,0.35); }
        .live-dot { animation: pulse-glow 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ── stat card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accent = "violet", loading }) {
  const colors = {
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-400", glow: "hover:shadow-violet-500/20" },
    amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: "text-amber-400",  glow: "hover:shadow-amber-500/20"  },
    emerald:{ bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: "text-emerald-400",glow: "hover:shadow-emerald-500/20"},
  };
  const c = colors[accent] || colors.violet;
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`rounded-2xl border ${c.border} bg-white/[0.03] p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-xl ${c.glow} cursor-default`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
        <div className={c.icon}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 tracking-tight">{loading ? "…" : value}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── market card ─────────────────────────────────────────────────────── */
function MarketCard({ market, index }) {
  const navigate = useNavigate();
  const vol = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(market.volume || 0);
  const date = market.endDate ? new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const cat = (market.category || "Other").charAt(0) + (market.category || "Other").slice(1).toLowerCase();
  const isActive = market.status === "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.06, type: "spring", stiffness: 120 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => navigate(`/markets/${market.id}`)}
      className="card-glow group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden p-5 cursor-pointer transition-all duration-200"
    >
      {/* top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${isActive ? "bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500" : "bg-gradient-to-r from-slate-700 to-slate-600"}`} />

      <div className="flex items-center gap-2 mb-3 mt-1">
        <span className="text-[11px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{cat}</span>
        {isActive && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            LIVE
          </span>
        )}
        {!isActive && market.status && (
          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{market.status}</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-auto min-h-[2.5rem] group-hover:text-violet-100 transition-colors">{market.title}</h3>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
        <span className="text-slate-400 font-medium">{vol} vol</span>
        <span>{date}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-600">Closes {date}</span>
        <motion.div
          whileHover={{ x: 2 }}
          className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors"
        >
          Trade now <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── xp bar ──────────────────────────────────────────────────────────── */
function XpBar({ pct, color = "from-violet-500 to-amber-400" }) {
  return (
    <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`}
      />
      {/* shimmer */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 1.2 }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMarkets, setActiveMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [rank, setRank] = useState(null);
  const [rankLoading, setRankLoading] = useState(true);

  // ── announcements: edit this array to add/remove entries ────────────
  const announcements = [
    // { id: "ex", title: "Title", body: "Body.", date: "2026-03-06", pinned: true },
  ];
  const sortedAnnouncements = [...announcements].sort((a, b) =>
    a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1
  );

  /* fetch wallet */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const userId = user.id || user.userId || user.username;
    if (!userId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/users/${userId}/wallet`, { credentials: "include" });
        if (res.ok) setWallet(await res.json());
      } catch (e) { console.error("[Dashboard] wallet error", e); }
      finally { setLoading(false); }
    })();
  }, [user, authLoading]);

  /* fetch rank */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRankLoading(false); return; }
    const userId = user.id || user.userId || user.username;
    if (!userId) { setRankLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ranks/${userId}`, { credentials: "include" });
        if (res.ok) setRank(await res.json());
      } catch (e) { console.error("[Dashboard] rank error", e); }
      finally { setRankLoading(false); }
    })();
  }, [user, authLoading]);

  /* fetch markets */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/markets`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setActiveMarkets(data.filter((m) => m.status === "ACTIVE" || m.status === "UPCOMING").slice(0, 6));
        }
      } catch (e) { console.error("[Dashboard] markets error", e); }
      finally { setMarketsLoading(false); }
    })();
  }, []);

  const balance = wallet?.balanceCents ? wallet.balanceCents / 100 : 0;
  const fmtBal = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(balance);
  const username = user?.username || "User";
  const overallProgress = rank ? rankProgress(rank.overallPoints) : null;
  const overallPct = overallProgress?.pct ?? 0;

  /* derive rank keys from points so icons/labels always match actual points */
  const overallRankKey   = rank ? computeRank(rank.overallPoints ?? 0)   : null;
  const traderRankKey    = rank ? computeRank(rank.traderPoints ?? 0)    : null;
  const predictorRankKey = rank ? computeRank(rank.predictorPoints ?? 0) : null;

  return (
    <PageShell>
      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* ── HERO HEADER ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-violet-950/60 via-[#0d0820]/80 to-amber-950/30 p-6 sm:p-8"
          >
            {/* decorative bg grid */}
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)"}} />
            {/* top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* left: avatar + greeting */}
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
                    <span className="text-2xl font-black text-white">{loading ? "?" : username.charAt(0).toUpperCase()}</span>
                  </div>
                  {/* rank badge overlay */}
                  {!rankLoading && overallRankKey && (
                    <img
                      src={rankImages[overallRankKey]}
                      alt={overallRankKey}
                      className="absolute -bottom-2 -right-2 w-8 h-8 object-contain drop-shadow-lg"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Welcome back,</p>
                  <h1 className="text-3xl font-black tracking-tight shimmer-text">{loading ? "…" : username}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {!rankLoading && overallRankKey && (
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {formatRank(overallRankKey)}
                      </span>
                    )}
                    <span className="text-xs text-slate-600">{rank?.resolvedMarketsCount ?? 0} markets resolved</span>
                  </div>
                </div>
              </div>

              {/* right: XP bar + CTA */}
              <div className="w-full sm:w-72 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Overall XP</span>
                  <span className="text-amber-400 font-bold">{rank?.overallPoints ?? 0} pts</span>
                </div>
                <XpBar pct={overallPct} color="from-violet-500 via-fuchsia-500 to-amber-400" />
                <div className="flex gap-3">
                  <Link
                    to="/wallet"
                    className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1a0a00] text-sm font-black hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-900/30"
                  >
                    + Add Funds
                  </Link>
                  <Link
                    to="/markets"
                    className="flex-1 text-center py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-bold hover:bg-violet-500/20 hover:border-violet-500/50 transition-all"
                  >
                    Trade →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── STAT TILES ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatCard
              label="Balance"
              value={fmtBal}
              sub="Available to trade"
              icon={<WalletIcon className="w-5 h-5" />}
              accent="violet"
              loading={loading}
            />
            <StatCard
              label="Overall Rank"
              value={formatRank(overallRankKey)}
              sub={`${rank?.overallPoints ?? 0} overall pts`}
              icon={rankLoading || !overallRankKey
                ? <TrophyIcon className="w-5 h-5" />
                : <img src={rankImages[overallRankKey]} alt="" className="w-7 h-7 object-contain" />}
              accent="amber"
              loading={rankLoading}
            />
            <StatCard
              label="Markets Resolved"
              value={rank?.resolvedMarketsCount ?? "—"}
              sub="Completed predictions"
              icon={<TargetIcon className="w-5 h-5" />}
              accent="emerald"
              loading={rankLoading}
            />
          </motion.div>

          {/* ── ANNOUNCEMENTS ────────────────────────────────────── */}
          {sortedAnnouncements.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-base font-black text-white uppercase tracking-wider mb-4">📢 Announcements</h2>
              <div className="space-y-3">
                {sortedAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-2xl border px-5 py-4 ${
                      a.pinned ? "border-amber-500/20 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <p className="text-sm font-bold text-white leading-snug">
                      {a.pinned && <span className="mr-2 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">📌 PINNED</span>}
                      {a.title}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                    <p className="mt-2 text-[11px] text-slate-600">
                      {a.date ? new Date(a.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── ACTIVE MARKETS ───────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 inline-block opacity-60" style={{animationDelay:"0.3s"}} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">Live Markets</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Trade on real-world events in real time</p>
                </div>
              </div>
              <Link
                to="/markets"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300 text-sm font-bold hover:bg-violet-500/20 hover:border-violet-500/40 transition-all"
              >
                All markets <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {marketsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : activeMarkets.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-14 text-center">
                <p className="text-slate-500 text-sm">No active markets right now — check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMarkets.map((m, i) => (
                  <MarketCard key={m.id} market={m} index={i} />
                ))}
              </div>
            )}
          </motion.section>

        </div>
      </main>
    </PageShell>
  );
}


