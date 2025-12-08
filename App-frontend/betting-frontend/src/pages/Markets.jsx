import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const CATEGORY_OPTIONS = ["ALL", "SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];

const CATEGORY_COLORS = {
  SPORTS: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300",
  POLITICS: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-300",
  FINANCE: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-300",
  ENTERTAINMENT: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300",
  TECHNOLOGY: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-300",
  OTHER: "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300",
};

const CATEGORY_ICONS = {
  SPORTS: "⚽",
  POLITICS: "🗳️",
  FINANCE: "💰",
  ENTERTAINMENT: "🎬",
  TECHNOLOGY: "💻",
  OTHER: "📌",
};

export default function Markets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch markets
  const fetchMarkets = async () => {
    setLoading(true);
    setError("");

    try {
      let endpoint = `${API_BASE_URL}/api/v1/markets`;

      if (categoryFilter !== "ALL") {
        endpoint = `${API_BASE_URL}/api/v1/markets/category/${categoryFilter}`;
      }

      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch markets: ${res.status}`);
      }

      const data = await res.json();
      setMarkets(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load markets");
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [categoryFilter]);

  // Filter by search query
  const filteredMarkets = markets.filter(market =>
    searchQuery === "" || market.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-16">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-purple-950/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Live <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Markets</span>
          </h1>
          <p className="text-lg text-slate-400">
            Trade on the outcomes of real-world events. Make predictions, compete with others, and win rewards.
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Markets
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 pl-11 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="lg:flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Filter by Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30"
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-amber-400 border border-slate-700"
                    }`}
                  >
                    {cat === "ALL" ? "All" : `${CATEGORY_ICONS[cat]} ${cat.charAt(0) + cat.slice(1).toLowerCase()}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Markets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-400 rounded-full animate-spin animation-delay-150" style={{ animationDirection: "reverse" }} />
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur-xl p-12 text-center shadow-2xl"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3">No Markets Found</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              {searchQuery || categoryFilter !== "ALL"
                ? "Try adjusting your search or filters to see more markets."
                : "No markets are currently available. Check back soon for new prediction opportunities!"}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredMarkets.map((market, idx) => (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all cursor-pointer"
                  >
                    {/* Hover Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-600/0 opacity-0 group-hover:opacity-10 transition-opacity" />

                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-purple-500/0 opacity-0 group-hover:from-amber-500/5 group-hover:to-purple-500/5 group-hover:opacity-100 blur-xl transition-all" />

                    <div className="relative z-10 p-6">
                      {/* Category Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-gradient-to-r ${CATEGORY_COLORS[market.category]}`}>
                          <span>{CATEGORY_ICONS[market.category]}</span>
                          {market.category}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          market.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : market.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                        }`}>
                          {market.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-amber-300 transition-colors">
                        {market.title}
                      </h3>

                      {/* Description */}
                      {market.description && (
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {market.description}
                        </p>
                      )}

                      {/* Market Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Volume</p>
                          <p className="text-sm font-bold text-slate-200">
                            ${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Traders</p>
                          <p className="text-sm font-bold text-slate-200">
                            {Math.floor(Math.random() * 500 + 50)}
                          </p>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
                      >
                        Trade Now
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Results Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center text-sm text-slate-400"
            >
              Showing {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
              {markets.length !== filteredMarkets.length && ` (filtered from ${markets.length} total)`}
            </motion.div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}
