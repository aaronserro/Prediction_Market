import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import rankImages, { formatRank } from "../lib/rankImages.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* ── tiny icons ──────────────────────────────────────────────────────── */
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

/* ── shared background ───────────────────────────────────────────────── */
export function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0d0a18] text-white relative overflow-x-hidden flex flex-col">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[140px] animate-[drift_22s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-amber-500/[0.12] blur-[120px] animate-[drift_28s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[350px] rounded-full bg-violet-500/[0.10] blur-[160px] animate-[drift_32s_ease-in-out_infinite]" />
      </div>
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
      {/* shared footer */}
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
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0d0a18; }
        ::-webkit-scrollbar-thumb { background: #2d1b4e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3d2a6e; }
      `}</style>
    </div>
  );
}

/* ── market card ─────────────────────────────────────────────────────── */
function MarketCard({ market }) {
  const navigate = useNavigate();
  const vol = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(market.volume || 0);
  const date = market.endDate ? new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const cat = (market.category || "Other").charAt(0) + (market.category || "Other").slice(1).toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/markets/${market.id}`)}
      className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 cursor-pointer hover:border-violet-500/20 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded">{cat}</span>
        {market.status && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${market.status === "ACTIVE" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
            {market.status}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-white leading-snug line-clamp-2 mb-auto min-h-[2.5rem]">{market.title}</h3>

      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-500">
        <span>{vol} vol</span>
        <span>{date}</span>
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs text-amber-400/60 group-hover:text-amber-400 transition-colors">
        Trade <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
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
     {
       id: "example",
       title: "Example announcement",
       body: "Announcement body text.",
       date: "2026-03-06",
       pinned: true,
     },
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

  return (
    <PageShell>
      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── welcome header ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8 pb-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-semibold text-amber-400">{loading ? "?" : username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{loading ? "Loading…" : `Welcome back, ${username}`}</h1>
                <p className="text-sm text-slate-500 mt-0.5">Prediction Markets</p>
              </div>
            </div>
            <Link to="/wallet" className="px-4 py-2 rounded-lg bg-amber-400 text-[#0d0a18] text-sm font-medium hover:bg-amber-300 transition-colors flex-shrink-0">
              Add Funds
            </Link>
          </motion.div>

          <div className="space-y-10">

          {/* ── stats ───────────────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</p>
                <p className="text-xl font-semibold text-white mt-0.5">{loading ? "…" : fmtBal}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center overflow-hidden">
                {rankLoading || !rank?.overallRank ? (
                  <TrophyIcon className="w-4 h-4 text-amber-400" />
                ) : (
                  <img src={rankImages[rank.overallRank]} alt={rank.overallRank} className="w-8 h-8 object-contain" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Rank</p>
                <p className="text-xl font-semibold text-white mt-0.5">
                  {rankLoading ? "…" : formatRank(rank?.overallRank)}
                </p>
              </div>
            </div>
          </motion.section>

          {/* ── rank breakdown ──────────────────────────────────── */}
          {!rankLoading && rank && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <h2 className="text-base font-semibold text-white mb-4">Your Ranking</h2>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">

                {/* overall row */}
                <div className="flex items-center gap-4 pb-5 border-b border-white/[0.05]">
                  <img
                    src={rankImages[rank.overallRank]}
                    alt={rank.overallRank}
                    className="w-14 h-14 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Overall</p>
                    <p className="text-lg font-semibold text-white">{formatRank(rank.overallRank)}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all"
                          style={{ width: `${Math.min((rank.overallPoints / 1000) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{rank.overallPoints} pts</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-slate-300">{rank.resolvedMarketsCount ?? 0}</p>
                    <p className="text-[11px] text-slate-600 uppercase tracking-wider">resolved</p>
                  </div>
                </div>

                {/* trader + predictor */}
                <div className="grid grid-cols-2 gap-4 pt-5">
                  {[
                    { label: "Trader",    rankKey: rank.traderRank,    pts: rank.traderPoints,    color: "from-violet-500 to-violet-400" },
                    { label: "Predictor", rankKey: rank.predictorRank, pts: rank.predictorPoints, color: "from-amber-500 to-amber-400" },
                  ].map(({ label, rankKey, pts, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <img
                        src={rankImages[rankKey]}
                        alt={rankKey}
                        className="w-10 h-10 object-contain flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-white truncate">{formatRank(rankKey)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${color}`}
                              style={{ width: `${Math.min((pts / 1000) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 flex-shrink-0">{pts} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* ── announcements ──────────────────────────────────── */}
          {sortedAnnouncements.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold text-white">Announcements</h2>
              </div>
              <div className="space-y-3">
                {sortedAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border px-5 py-4 ${
                      a.pinned
                        ? "border-violet-500/20 bg-violet-500/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">
                        {a.title}
                        {a.pinned && (
                          <span className="ml-2 text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">PINNED</span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                      <p className="mt-2 text-[11px] text-slate-600">
                        {a.date ? new Date(a.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── active markets ──────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Active Markets</h2>
                <p className="text-sm text-slate-500 mt-0.5">Trade on real-world events</p>
              </div>
              <Link to="/markets" className="text-sm text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {marketsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : activeMarkets.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                <p className="text-slate-500 text-sm">No active markets right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMarkets.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.04 }}>
                    <MarketCard market={m} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
