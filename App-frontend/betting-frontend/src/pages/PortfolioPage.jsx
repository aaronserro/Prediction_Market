import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell } from "../dashboard/Dashboard";
import { useAuth } from "../auth/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

function StatTile({ label, value, sub, accent = "violet" }) {
  const colors = {
    violet:  { border: "border-violet-500/20",  bg: "bg-violet-500/[0.05]"  },
    amber:   { border: "border-amber-500/20",   bg: "bg-amber-500/[0.05]"   },
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.05]" },
    red:     { border: "border-red-500/20",     bg: "bg-red-500/[0.05]"     },
  };
  const c = colors[accent] || colors.violet;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [outcomePrices, setOutcomePrices] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/v1/positions/me`, { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to fetch positions: ${res.status}`);
        const data = await res.json();
        setPositions(data);

        if (data.length > 0) {
          const prices = await Promise.all(
            data.map(async (pos) => {
              try {
                const r = await fetch(`${API_BASE}/api/v1/markets/${pos.marketId}/outcomes/${pos.outcomeId}/price`, { credentials: "include" });
                if (!r.ok) return { id: pos.id, price: null };
                const p = await r.json();
                let raw = typeof p === "number" ? p : (p.price ?? p.currentPrice ?? p.value ?? p.pricePerShare ?? 50);
                return { id: pos.id, price: raw > 1 ? raw / 100 : raw };
              } catch { return { id: pos.id, price: null }; }
            })
          );
          const map = {};
          prices.forEach(({ id, price }) => { map[id] = price; });
          setOutcomePrices(map);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* stats */
  const totalPositions = positions.length;
  const totalInvested = positions.reduce((s, p) => s + (p.quantity || 0) * (p.averagePrice || 0), 0);
  const totalValue = positions.reduce((s, p) => {
    const cp = outcomePrices[p.id] ?? p.currentPrice ?? 0;
    return s + (p.quantity || 0) * cp;
  }, 0);
  const totalPL = totalValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="w-8 h-8 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* hero header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-[#0d0820]/60 to-[#0d0820]/80 overflow-hidden px-6 py-7"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500" />
            <h1 className="text-3xl font-black tracking-tight text-white">Portfolio</h1>
            <p className="text-sm text-slate-500 mt-1">Track your active positions across markets</p>
          </motion.div>

          {/* stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatTile label="Positions" value={totalPositions} accent="violet" />
            <StatTile label="Invested" value={`$${totalInvested.toFixed(2)}`} accent="amber" />
            <StatTile label="Current Value" value={`$${totalValue.toFixed(2)}`} accent="violet" />
            <StatTile
              label="Total P/L"
              value={
                <span className={totalPL >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}
                </span>
              }
              sub={`${totalPL >= 0 ? "+" : ""}${totalPLPct.toFixed(2)}%`}
              accent={totalPL >= 0 ? "emerald" : "red"}
            />
          </motion.div>

          {/* error */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* positions */}
          {positions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-14 text-center">
              <h3 className="text-base font-black text-white mb-2">No Positions Yet</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                You haven't made any trades yet. Start trading on markets to build your portfolio.
              </p>
              <button
                onClick={() => navigate("/markets")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1a0a00] text-sm font-black hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-900/20"
              >
                Browse Markets
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos, idx) => {
                const cp = outcomePrices[pos.id] ?? pos.currentPrice ?? 0;
                const invested = (pos.quantity || 0) * (pos.averagePrice || 0);
                const value = (pos.quantity || 0) * cp;
                const pl = value - invested;
                const plPct = pos.averagePrice && cp ? ((cp - pos.averagePrice) / pos.averagePrice) * 100 : 0;
                const winning = pl >= 0;

                return (
                  <motion.div
                    key={pos.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/markets/${pos.marketId}`)}
                    className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden p-5 hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer"
                  >
                    {/* left P/L accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${
                      winning ? "bg-emerald-500" : "bg-red-500"
                    }`} />

                    <div className="pl-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* left */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {pos.marketCategory && (
                            <span className="text-[11px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                              {pos.marketCategory.charAt(0) + pos.marketCategory.slice(1).toLowerCase()}
                            </span>
                          )}
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            pos.marketStatus === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : pos.marketStatus === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                          }`}>{pos.marketStatus}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 leading-snug group-hover:text-violet-100 transition-colors">
                          {pos.marketTitle || "Market"}
                        </h3>
                        <p className="text-xs text-slate-500">{pos.outcomeName || pos.outcomeLabel || "Outcome"}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                          <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">{pos.quantity || 0} shares</span>
                          <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">Avg {pos.averagePrice ? `${(pos.averagePrice * 100).toFixed(1)}¢` : "—"}</span>
                          <span className="bg-white/[0.04] px-2 py-0.5 rounded-full">Now {cp ? `${(cp * 100).toFixed(1)}¢` : "—"}</span>
                        </div>
                      </div>

                      {/* right metrics */}
                      <div className="flex items-center gap-5 lg:gap-7">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-600 uppercase tracking-wider mb-0.5">Invested</p>
                          <p className="text-sm font-semibold text-slate-400">${invested.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-600 uppercase tracking-wider mb-0.5">Value</p>
                          <p className="text-sm font-bold text-white">${value.toFixed(2)}</p>
                        </div>
                        <div className={`text-right min-w-[72px] rounded-xl border px-3 py-2 ${
                          winning
                            ? "bg-emerald-500/[0.08] border-emerald-500/20"
                            : "bg-red-500/[0.08] border-red-500/20"
                        }`}>
                          <p className={`text-sm font-black ${
                            winning ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                          </p>
                          <p className={`text-[11px] font-semibold ${
                            winning ? "text-emerald-500" : "text-red-500"
                          }`}>
                            {pl >= 0 ? "+" : ""}{plPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
