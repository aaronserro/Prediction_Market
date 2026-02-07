import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPositions = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/positions/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch positions: ${res.status}`);
        }

        const data = await res.json();
        console.log("[PortfolioPage] Fetched positions:", data);
        setPositions(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load positions");
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // Calculate portfolio stats
  const totalPositions = positions.length;
  const totalValue = positions.reduce((sum, pos) => {
    const value = (pos.quantity || 0) * (pos.currentPrice || 0);
    return sum + value;
  }, 0);
  const totalShares = positions.reduce((sum, pos) => sum + (pos.quantity || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            My Portfolio
          </h1>
          <p className="text-slate-400">
            Track all your active positions across markets
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Total Positions</p>
            <p className="text-3xl font-bold text-white">{totalPositions}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Total Shares</p>
            <p className="text-3xl font-bold text-white">{totalShares}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Portfolio Value</p>
            <p className="text-3xl font-bold text-amber-400">${totalValue.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/50 bg-red-500/10 p-6 mb-8"
          >
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Positions List */}
        {positions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Positions Yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              You haven't made any trades yet. Start trading on markets to build your portfolio.
            </p>
            <button
              onClick={() => navigate("/markets")}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
            >
              Browse Markets
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {positions.map((position, idx) => {
              const categoryColor = CATEGORY_COLORS[position.marketCategory] || CATEGORY_COLORS.OTHER;
              const categoryIcon = CATEGORY_ICONS[position.marketCategory] || CATEGORY_ICONS.OTHER;
              const positionValue = (position.quantity || 0) * (position.currentPrice || 0);
              const profitLoss = positionValue - ((position.quantity || 0) * (position.averagePrice || 0));
              const profitLossPercent = position.averagePrice
                ? ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100
                : 0;

              return (
                <motion.div
                  key={position.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => navigate(`/markets/${position.marketId}`)}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Market & Outcome Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-gradient-to-r ${categoryColor}`}
                        >
                          <span>{categoryIcon}</span>
                          {position.marketCategory}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            position.marketStatus === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : position.marketStatus === "PENDING"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                          }`}
                        >
                          {position.marketStatus}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                        {position.marketTitle || "Market"}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">
                        <span className="text-slate-300 font-medium">
                          {position.outcomeName || position.outcomeLabel || "Outcome"}
                        </span>
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{position.quantity || 0} shares</span>
                        <span>•</span>
                        <span>
                          Avg: {position.averagePrice ? `${(position.averagePrice * 100).toFixed(1)}¢` : "—"}
                        </span>
                        <span>•</span>
                        <span>
                          Current: {position.currentPrice ? `${(position.currentPrice * 100).toFixed(1)}¢` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Value & P/L */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Position Value</p>
                        <p className="text-2xl font-bold text-white">
                          ${positionValue.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Profit/Loss</p>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-lg font-bold ${
                              profitLoss >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              profitLoss >= 0
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {profitLoss >= 0 ? "+" : ""}
                            {profitLossPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
