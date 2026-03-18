import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell } from "../dashboard/Dashboard.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

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
  const [tradeQuantity, setTradeQuantity] = useState(10);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);

  const [outcomePrices, setOutcomePrices] = useState({});

  // Safely get the price for the pending trade
  const p = pendingTrade ? outcomePrices[pendingTrade.outcome.id] : undefined;

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
        setMarket(data);

        // Fetch prices for all outcomes
        if (data.outcomes && data.outcomes.length > 0) {
          const pricePromises = data.outcomes.map(async (outcome) => {
            try {
              const priceRes = await fetch(
                `${API_BASE_URL}/api/v1/markets/${marketId}/outcomes/${outcome.id}/price`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );

              if (!priceRes.ok) {
                console.warn(`[MarketDetail] Failed to fetch price for outcome ${outcome.id}: ${priceRes.status} ${priceRes.statusText}`);
                return { outcomeId: outcome.id, price: null };
              }

              if (priceRes.ok) {
                const priceData = await priceRes.json();
                return { outcomeId: outcome.id, price: priceData };
              }
            } catch (err) {
              console.error(`[MarketDetail] Failed to fetch price for outcome ${outcome.id}:`, err);
            }
            return { outcomeId: outcome.id, price: null };
          });

          const prices = await Promise.all(pricePromises);
          const pricesMap = {};
          prices.forEach(({ outcomeId, price }) => {
            let raw = price;

            if (raw === null || raw === undefined) return;

            if (raw && typeof raw === "object") {
              raw = raw.price ?? raw.currentPrice ?? raw.value ?? raw.pricePerShare;
            }

            if (raw === null || raw === undefined) return;

            const n = Number(raw);
            if (!Number.isFinite(n)) return;

            const finalPrice = n > 1 ? n / 100 : n;
            pricesMap[outcomeId] = finalPrice;
          });
          console.log('[MarketDetail] Prices map:', pricesMap);
          console.log("pricesMap keys:", Object.keys(pricesMap));
          console.log("first outcome id:", data.outcomes[0]?.id);
          setOutcomePrices(pricesMap);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load market");
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  const openTradeConfirmation = (outcome, action) => {
    setPendingTrade({ outcome, action });
    setShowConfirmModal(true);
  };

  const closeTradeConfirmation = () => {
    setShowConfirmModal(false);
    setPendingTrade(null);
  };

  const confirmTrade = () => {
    if (pendingTrade) {
      if (pendingTrade.action === 'BUY') {
        handleBuy(pendingTrade.outcome.id);
      } else {
        handleSell(pendingTrade.outcome.id);
      }
    }
    closeTradeConfirmation();
  };
  const fetchOutcomePrices = async (marketData) => {
  if (!marketData?.outcomes?.length) return;

  const pricePromises = marketData.outcomes.map(async (outcome) => {
    try {
      const priceRes = await fetch(
        `${API_BASE_URL}/api/v1/markets/${marketId}/outcomes/${outcome.id}/price`,
        { method: "GET", credentials: "include" }
      );

      if (!priceRes.ok) return { outcomeId: outcome.id, price: null };

      const priceData = await priceRes.json();
      return { outcomeId: outcome.id, price: priceData };
    } catch (err) {
      console.error(`[MarketDetail] Failed to fetch price for outcome ${outcome.id}:`, err);
      return { outcomeId: outcome.id, price: null };
    }
  });

  const prices = await Promise.all(pricePromises);

  const pricesMap = {};
  prices.forEach(({ outcomeId, price }) => {
    let raw = price;

    if (raw === null || raw === undefined) return;

    if (raw && typeof raw === "object") {
      raw = raw.price ?? raw.currentPrice ?? raw.value ?? raw.pricePerShare;
    }

    if (raw === null || raw === undefined) return;

    const n = Number(raw);
    if (!Number.isFinite(n)) return;

    const finalPrice = n > 1 ? n / 100 : n; // cents -> decimal
    pricesMap[outcomeId] = finalPrice;
  });

  setOutcomePrices(pricesMap);
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

        // Handle specific error cases
        if (text.includes("Insufficient balance") || text.includes("insufficient funds")) {
          throw new Error("Insufficient balance. Please add funds to your wallet.");
        }

        throw new Error(text || `Trade failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log("[MarketDetail] Trade response:", data);

      setTradeSuccess(
        `Bought ${data.quantity ?? tradeQuantity} shares at ${
          data.pricePerShare ?? "?"
        }¢`
      );
      await fetchOutcomePrices(market);

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

        // Handle specific error cases
        if (text.includes("Cannot sell more than outstanding")) {
          throw new Error("You don't have enough shares to sell. Please check your portfolio.");
        } else if (text.includes("outstanding=0")) {
          throw new Error("You don't own any shares of this outcome to sell.");
        }

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
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (error || !market) {
    return (
      <PageShell>
        <div className="pt-24 px-4 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-amber-400 transition-colors mb-5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to markets
          </button>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-red-300">
            {error || "Market not found"}
          </div>
        </div>
      </PageShell>
    );
  }

  const categoryColor = CATEGORY_COLORS[market.category] || CATEGORY_COLORS.OTHER;
  const categoryIcon = CATEGORY_ICONS[market.category] || CATEGORY_ICONS.OTHER;
  const isActive = market.status === "ACTIVE";

  return (
    <PageShell>
      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* back nav */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-amber-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to markets
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN ──────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Hero Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-[#0d0820]/60 to-[#0d0820]/80 overflow-hidden p-6"
              >
                {/* top accent */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500"
                    : "bg-gradient-to-r from-slate-700 to-slate-600"
                }`} />

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${categoryColor}`}>
                    <span>{categoryIcon}</span>
                    {market.category}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      {market.status}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                  {market.title}
                </h1>

                {market.description && (
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {market.description}
                  </p>
                )}

                {market.closeTime && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Closes {new Date(market.closeTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </motion.div>

              {/* Outcomes / Trade */}
              {Array.isArray(market.outcomes) && market.outcomes.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden"
                >
                  {/* trade header */}
                  <div className="flex items-center px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Trade</h2>
                  </div>

                  {/* outcome rows */}
                  <div className="divide-y divide-white/[0.05]">
                    {market.outcomes.map((outcome, idx) => {
                      const price = outcomePrices[outcome.id];
                      const pct = price !== undefined ? price * 100 : null;
                      const isYes = idx === 0;
                      const barColor = isYes ? "from-emerald-500 to-emerald-400" : "from-red-500 to-orange-400";
                      const priceColor = isYes ? "text-emerald-400" : "text-red-400";

                      return (
                        <div key={outcome.id || idx} className="px-6 py-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                isYes ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                              }`}>
                                {isYes ? "Y" : "N"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white leading-snug">
                                  {outcome.label || outcome.description || `Outcome ${idx + 1}`}
                                </p>
                                {outcome.description && outcome.label && (
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">{outcome.description}</p>
                                )}
                              </div>
                            </div>
                            {/* price display */}
                            <div className="text-right flex-shrink-0">
                              {pct !== null ? (
                                <>
                                  <p className={`text-2xl font-black ${priceColor}`}>{pct.toFixed(0)}¢</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{pct.toFixed(1)}% chance</p>
                                </>
                              ) : (
                                <p className="text-xl text-slate-600">—</p>
                              )}
                            </div>
                          </div>

                          {/* probability bar */}
                          {pct !== null && (
                            <div className="mb-4">
                              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 + idx * 0.1 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                                />
                              </div>
                            </div>
                          )}

                          {/* buy / sell */}
                          <div className="flex gap-3">
                            <button
                              disabled={!isActive || tradeLoading}
                              onClick={() => openTradeConfirmation(outcome, "BUY")}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                                isActive
                                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50"
                                  : "bg-white/[0.03] border border-white/[0.05] text-slate-600 cursor-not-allowed"
                              } ${tradeLoading ? "opacity-50 cursor-wait" : ""}`}
                            >
                              Buy
                            </button>
                            <button
                              disabled={!isActive || tradeLoading}
                              onClick={() => openTradeConfirmation(outcome, "SELL")}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                                isActive
                                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/50"
                                  : "bg-white/[0.03] border border-white/[0.05] text-slate-600 cursor-not-allowed"
                              } ${tradeLoading ? "opacity-50 cursor-wait" : ""}`}
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* trade feedback */}
                  {(tradeError || tradeSuccess) && (
                    <div className={`mx-6 mb-5 rounded-xl border px-4 py-3 text-sm ${
                      tradeError
                        ? "border-red-500/20 bg-red-500/[0.06] text-red-300"
                        : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
                    }`}>
                      {tradeError || tradeSuccess}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-10 text-center text-sm text-slate-500"
                >
                  This market has no outcomes configured yet.
                </motion.div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ─────────────────────────────────── */}
            <div className="space-y-5">
              {/* Market Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Details</h3>
                <div className="space-y-4">
                  {market.closeTime && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Closes</p>
                      <p className="text-sm text-slate-300 font-medium">
                        {new Date(market.closeTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  )}
                  {market.resolutionSource && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Resolution Source</p>
                      <p className="text-sm text-slate-300">{market.resolutionSource}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-sm text-slate-300">
                      {market.createdAt
                        ? new Date(market.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Outcomes</p>
                    <p className="text-sm text-slate-300">{market.outcomes?.length ?? 0}</p>
                  </div>
                </div>
              </motion.div>

              {/* Rules */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Rules</h3>
                <ul className="space-y-2.5">
                  {[
                    "Market resolves based on official results",
                    "Trades execute instantly at displayed prices",
                    "Winning shares pay out $1.00 each",
                  ].map((rule) => (
                    <li key={rule} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      {/* ── CONFIRMATION MODAL ───────────────────────────────── */}
      {showConfirmModal && pendingTrade && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e0b1c] overflow-hidden shadow-2xl"
          >
            {/* header accent */}
            <div className={`h-[2px] ${
              pendingTrade.action === "BUY"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`} />
            <div className="p-6">
              <h3 className="text-xl font-black text-white mb-4">Confirm {pendingTrade.action === "BUY" ? "Buy" : "Sell"}</h3>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3 mb-5">
                {/* Action */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Action</span>
                  <span className={`font-bold ${pendingTrade.action === "BUY" ? "text-emerald-400" : "text-amber-400"}`}>
                    {pendingTrade.action}
                  </span>
                </div>
                {/* Outcome */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Outcome</span>
                  <span className="font-bold text-white">
                    {pendingTrade.outcome.label || pendingTrade.outcome.description}
                  </span>
                </div>
                {/* Quantity dropdown */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Quantity</span>
                  <select
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Number(e.target.value))}
                    className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-sm text-white font-bold focus:outline-none focus:border-violet-500/50 cursor-pointer transition-colors"
                  >
                    {[10, 50, 100].map((qty) => (
                      <option key={qty} value={qty} className="bg-[#0e0b1c]">
                        {qty} shares
                      </option>
                    ))}
                  </select>
                </div>
                {/* Price */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Price</span>
                  <span className="font-bold text-white">
                    {p !== undefined ? `${(p * 100).toFixed(0)}¢ per share` : "—"}
                  </span>
                </div>
                {p !== undefined && (
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-white/[0.06]">
                    <span className="text-slate-400 font-semibold">
                      Total {pendingTrade.action === "BUY" ? "Cost" : "Proceeds"}
                    </span>
                    <span className="text-amber-400 font-black text-lg">
                      ${(p * tradeQuantity).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeTradeConfirmation}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 text-sm font-bold hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTrade}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                    pendingTrade.action === "BUY"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      : "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                  }`}
                >
                  Confirm {pendingTrade.action === "BUY" ? "Buy" : "Sell"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}
