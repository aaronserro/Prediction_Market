import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../dashboard/Dashboard";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
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

          {/* header */}
          <div className="mb-8 pb-6 border-b border-white/[0.06]">
            <h1 className="text-2xl font-semibold text-white">Markets</h1>
            <p className="text-sm text-slate-500 mt-1">Trade on the outcome of real-world events.</p>
          </div>

          {/* filters */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="relative lg:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search markets…"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/30 focus:outline-none transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === c
                      ? "bg-violet-500 text-white"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          {/* body */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
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

                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => navigate(`/markets/${m.id}`)}
                        className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 cursor-pointer hover:border-violet-500/20 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded">{cat}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            m.status === "ACTIVE" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                          }`}>{m.status}</span>
                        </div>

                        <h3 className="text-sm font-medium text-white mb-3 line-clamp-2 leading-snug flex-1">{m.title}</h3>

                        {m.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{m.description}</p>
                        )}

                        <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between mt-auto text-xs text-slate-500">
                          <span>Closes <span className="text-slate-300">{date}</span></span>
                          <span className="group-hover:text-amber-400 transition-colors flex items-center gap-1">
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
