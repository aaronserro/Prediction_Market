import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../dashboard/Dashboard";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");
const CATEGORIES = ["ALL", "SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];

export default function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchMarkets = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = category !== "ALL"
        ? `${API_BASE}/api/v1/markets/category/${category}`
        : `${API_BASE}/api/v1/markets`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      setMarkets(await res.json());
    } catch (err) {
      setError(err.message);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarkets(); }, [category]);

  const filtered = markets.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = m.status === "ACTIVE" || m.status === "UPCOMING";
    return matchSearch && matchStatus;
  });

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
            <h1 className="text-3xl font-black tracking-tight text-white">Markets</h1>
            <p className="text-sm text-slate-500 mt-1">Trade on the outcome of real-world events.</p>
          </motion.div>

          {/* filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-6 flex flex-col lg:flex-row gap-3"
          >
            <div className="relative lg:w-80">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search markets…"
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/40 focus:outline-none focus:bg-white/[0.05] transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    category === c
                      ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                      : "bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </motion.div>

          {/* error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          {/* body */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-14 text-center">
              <p className="text-slate-500 text-sm">
                {search || category !== "ALL" ? "No markets match your filters." : "No markets available."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((m, i) => {
                    const cat = (m.category || "Other").charAt(0) + (m.category || "Other").slice(1).toLowerCase();
                    const date = m.endDate ? new Date(m.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                    const isActive = m.status === "ACTIVE";

                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.18, delay: i * 0.03 }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        onClick={() => navigate(`/markets/${m.id}`)}
                        className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-500/20"
                      >
                        {/* top accent */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                          isActive
                            ? "bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500"
                            : "bg-gradient-to-r from-slate-700 to-slate-600"
                        }`} />

                        <div className="flex items-center gap-2 mb-3 mt-1">
                          <span className="text-[11px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{cat}</span>
                          {isActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{m.status}</span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white mb-auto line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-violet-100 transition-colors">{m.title}</h3>

                        {m.description && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2">{m.description}</p>
                        )}

                        <div className="border-t border-white/[0.05] pt-3 mt-4 flex items-center justify-between text-xs text-slate-600">
                          <span>Closes <span className="text-slate-400 font-medium">{date}</span></span>
                          <span className="group-hover:text-amber-400 font-bold transition-colors flex items-center gap-1">
                            Trade
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <p className="mt-8 text-center text-xs text-slate-600">
                {filtered.length} market{filtered.length !== 1 ? "s" : ""}
                {markets.length !== filtered.length && ` (filtered from ${markets.length} total)`}
              </p>
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}
