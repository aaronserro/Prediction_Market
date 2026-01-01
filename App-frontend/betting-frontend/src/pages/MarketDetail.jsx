import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function MarketDetail() {
  const { marketId } = useParams();
  const navigate = useNavigate();

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tradeQuantity, setTradeQuantity] = useState(20);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);

  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/markets/${marketId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch market ${marketId}: ${res.status}`);
        }

        const data = await res.json();
        console.log('[MarketDetail] Fetched market:', data);
        console.log('[MarketDetail] Outcomes count:', data.outcomes?.length);
        console.log('[MarketDetail] Outcomes:', data.outcomes);
        setMarket(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load market");
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  const openTradeConfirmation = (outcome, tradeType) => {
    setPendingTrade({ outcome, tradeType });
    setShowConfirmModal(true);
  };

  const closeTradeConfirmation = () => {
    setShowConfirmModal(false);
    setPendingTrade(null);
  };

  const confirmTrade = () => {
    if (pendingTrade) {
      if (pendingTrade.tradeType === 'YES') {
        handleBuy(pendingTrade.outcome.id);
      } else {
        handleSell(pendingTrade.outcome.id);
      }
    }
    closeTradeConfirmation();
  };

  const handleBuy = async (outcomeId) => {
    if (!tradeQuantity || tradeQuantity <= 0) return;

    console.log('[MarketDetail] handleBuy called with outcomeId:', outcomeId);
    console.log('[MarketDetail] Sending trade request:', { outcomeId, quantity: tradeQuantity });

    setTradeLoading(true);
    setTradeError("");
    setTradeSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/trades/buy`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId: market.id,
          outcomeId: outcomeId,
          quantity: tradeQuantity,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[MarketDetail] Trade failed:', res.status, text);
        throw new Error(text || `Trade failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log("[MarketDetail] Trade response:", data);

      setTradeSuccess(
        `Bought ${data.filledQuantity ?? tradeQuantity} shares at ${
          data.pricePerShareCents ?? "?"
        }¢`
      );

      // OPTIONAL: refresh market data after successful trade
    } catch (err) {
      console.error(err);
      setTradeError(err.message || "Trade failed");
    } finally {
      setTradeLoading(false);
    }
  };

  const handleSell = async (outcomeId) => {
    if (!tradeQuantity || tradeQuantity <= 0) return;

    console.log('[MarketDetail] handleSell called with outcomeId:', outcomeId);
    console.log('[MarketDetail] Sending sell request:', { outcomeId, quantity: tradeQuantity });

    setTradeLoading(true);
    setTradeError("");
    setTradeSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/trades/sell`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId: market.id,
          outcomeId: outcomeId,
          quantity: tradeQuantity,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[MarketDetail] Sell failed:', res.status, text);
        throw new Error(text || `Sell failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log("[MarketDetail] Sell response:", data);

      setTradeSuccess(
        `Sold ${data.filledQuantity ?? tradeQuantity} shares at ${
          data.pricePerShareCents ?? "?"
        }¢`
      );

      // OPTIONAL: refresh market data after successful trade
    } catch (err) {
      console.error(err);
      setTradeError(err.message || "Sell failed");
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-slate-950 pt-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-slate-400 hover:text-amber-400"
            >
              ← Back
            </button>
          </div>
          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6 text-red-200">
            {error || "Market not found"}
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[market.category] || CATEGORY_COLORS.OTHER;
  const categoryIcon = CATEGORY_ICONS[market.category] || CATEGORY_ICONS.OTHER;

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to markets
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border bg-gradient-to-r ${categoryColor}`}
                >
                  <span>{categoryIcon}</span>
                  {market.category}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    market.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : market.status === "PENDING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                  }`}
                >
                  {market.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {market.title}
              </h1>

              {market.description && (
                <p className="text-slate-400 leading-relaxed">
                  {market.description}
                </p>
              )}
            </motion.div>

            {/* Market Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4">
                <p className="text-xs text-slate-500 mb-1">Volume</p>
                <p className="text-xl font-bold text-white">${Math.floor(Math.random() * 100000 + 10000).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4">
                <p className="text-xs text-slate-500 mb-1">Traders</p>
                <p className="text-xl font-bold text-white">{Math.floor(Math.random() * 1000 + 100)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4">
                <p className="text-xs text-slate-500 mb-1">Liquidity</p>
                <p className="text-xl font-bold text-white">${Math.floor(Math.random() * 50000 + 5000).toLocaleString()}</p>
              </div>
            </motion.div>


            {/* Outcomes Trading Section */}
            {Array.isArray(market.outcomes) && market.outcomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Trade</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Quantity</span>
                    <input
                    type="number"
                    min={1}
                    value={tradeQuantity}
                    onChange={(e) =>
                        setTradeQuantity(parseInt(e.target.value || "1", 20))
                    }
                    className="w-20 px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>
                </div>
                <div className="space-y-3">
                  {market.outcomes.map((outcome, idx) => (
                    <div
                      key={outcome.id || idx}
                      className="group rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-sm text-white">
                              {idx === 0 ? "✓" : "✗"}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">
                                {outcome.label || outcome.description || `Outcome ${idx + 1}`}
                              </p>
                              {outcome.description && outcome.label && (
                                <p className="text-xs text-slate-500 mt-0.5">{outcome.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {outcome.currentPrice ? `${(outcome.currentPrice * 100).toFixed(0)}¢` : "—"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {outcome.currentPrice ? `${(outcome.currentPrice * 100).toFixed(1)}%` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                        <button
                        disabled={market.status !== "ACTIVE" || tradeLoading}
                        onClick={() => openTradeConfirmation(outcome, 'YES')}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            market.status === "ACTIVE"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        } ${tradeLoading ? "opacity-70 cursor-wait" : ""}`}
                        >
                        {tradeLoading ? "Processing..." : "Yes"}
                        </button>
                        {tradeError && (
                        <p className="mt-4 text-xs text-red-400">
                            {tradeError}
                        </p>
                        )}
                        {tradeSuccess && (
                        <p className="mt-4 text-xs text-emerald-400">
                            {tradeSuccess}
                        </p>
                        )}

                          <button
                            disabled={market.status !== "ACTIVE" || tradeLoading}
                            onClick={() => openTradeConfirmation(outcome, 'NO')}
                            className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                              market.status === "ACTIVE"
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            } ${tradeLoading ? "opacity-70 cursor-wait" : ""}`}
                          >
                            {tradeLoading ? "Processing..." : "No"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {(!market.outcomes || market.outcomes.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-8 text-center"
              >
                <p className="text-slate-400">This market has no outcomes configured yet.</p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Market Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Market ID</p>
                  <p className="text-sm font-mono text-slate-300">#{market.id}</p>
                </div>
                {market.closeTime && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Close Date</p>
                    <p className="text-sm text-slate-300">
                      {new Date(market.closeTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {market.resolutionSource && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Resolution Source</p>
                    <p className="text-sm text-slate-300">{market.resolutionSource}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Created</p>
                  <p className="text-sm text-slate-300">
                    {market.createdAt
                      ? new Date(market.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-3">Rules</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Market resolves based on official results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Trades execute instantly at displayed prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Winning shares pay out $1.00 each</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-3">
              Confirm Trade
            </h3>

            <div className="bg-slate-950 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Outcome:</span>
                <span className="text-white font-medium">
                  {pendingTrade.outcome.label || pendingTrade.outcome.description}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trade Type:</span>
                <span className={`font-semibold ${
                  pendingTrade.tradeType === 'YES' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {pendingTrade.tradeType === 'YES' ? 'Buy Yes' : 'Sell No'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-white font-medium">{tradeQuantity} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Price:</span>
                <span className="text-white font-medium">
                  {pendingTrade.outcome.currentPrice
                    ? `${(pendingTrade.outcome.currentPrice * 100).toFixed(0)}¢ per share`
                    : '—'}
                </span>
              </div>
              {pendingTrade.outcome.currentPrice && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Total Cost:</span>
                  <span className="text-amber-400 font-bold">
                    ${(pendingTrade.outcome.currentPrice * tradeQuantity).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to proceed with this trade?
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeTradeConfirmation}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                  pendingTrade.tradeType === 'YES'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                }`}
              >
                Confirm Trade
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
