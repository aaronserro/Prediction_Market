import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell } from "../dashboard/Dashboard";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function StatTile({ label, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
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

          {/* header */}
          <div className="mb-8 pb-6 border-b border-white/[0.06]">
            <h1 className="text-2xl font-semibold text-white">Portfolio</h1>
            <p className="text-sm text-slate-500 mt-1">Track your active positions across markets</p>
          </div>

          {/* stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatTile label="Positions">
              <p className="text-2xl font-semibold text-white">{totalPositions}</p>
            </StatTile>
            <StatTile label="Invested">
              <p className="text-2xl font-semibold text-white">${totalInvested.toFixed(2)}</p>
            </StatTile>
            <StatTile label="Current Value">
              <p className="text-2xl font-semibold text-white">${totalValue.toFixed(2)}</p>
            </StatTile>
            <StatTile label="Total P/L">
              <p className={`text-2xl font-semibold ${totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}
              </p>
              <p className={`text-xs mt-1 ${totalPL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {totalPL >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%
              </p>
            </StatTile>
          </motion.div>

          {/* error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* positions */}
          {positions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
              <h3 className="text-base font-semibold text-white mb-2">No Positions Yet</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                You haven't made any trades yet. Start trading on markets to build your portfolio.
              </p>
              <button
                onClick={() => navigate("/markets")}
                className="px-5 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors"
              >
                Browse Markets
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {positions.map((pos, idx) => {
                const cp = outcomePrices[pos.id] ?? pos.currentPrice ?? 0;
                const invested = (pos.quantity || 0) * (pos.averagePrice || 0);
                const value = (pos.quantity || 0) * cp;
                const pl = value - invested;
                const plPct = pos.averagePrice && cp ? ((cp - pos.averagePrice) / pos.averagePrice) * 100 : 0;

                return (
                  <motion.div
                    key={pos.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/markets/${pos.marketId}`)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-violet-500/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* left */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {pos.marketCategory && (
                            <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded">
                              {pos.marketCategory}
                            </span>
                          )}
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                            pos.marketStatus === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : pos.marketStatus === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                          }`}>{pos.marketStatus}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{pos.marketTitle || "Market"}</h3>
                        <p className="text-xs text-slate-500 mb-2">{pos.outcomeName || pos.outcomeLabel || "Outcome"}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>{pos.quantity || 0} shares</span>
                          <span className="text-slate-700">·</span>
                          <span>Avg {pos.averagePrice ? `${(pos.averagePrice * 100).toFixed(1)}¢` : "—"}</span>
                          <span className="text-slate-700">·</span>
                          <span>Now {cp ? `${(cp * 100).toFixed(1)}¢` : "—"}</span>
                        </div>
                      </div>

                      {/* right */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-0.5">Invested</p>
                          <p className="text-sm font-medium text-slate-300">${invested.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-0.5">Value</p>
                          <p className="text-sm font-semibold text-white">${value.toFixed(2)}</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-xs text-slate-500 mb-0.5">P/L</p>
                          <p className={`text-sm font-semibold ${pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                          </p>
                          <p className={`text-xs ${pl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
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
