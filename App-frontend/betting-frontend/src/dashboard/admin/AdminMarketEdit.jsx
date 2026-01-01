// src/dashboard/admin/AdminMarketEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminNavbar from "./AdminNavbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const CATEGORY_OPTIONS = ["SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];
const STATUS_OPTIONS = ["ACTIVE", "PENDING", "CLOSED", "RESOLVED"];

export default function AdminMarketEdit() {
  const { marketId } = useParams();
  const navigate = useNavigate();

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SPORTS");
  const [status, setStatus] = useState("ACTIVE");
  const [closeTime, setCloseTime] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");

  // Trades data (shell)
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);

  // Fetch market details
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
          throw new Error(`Failed to fetch market: ${res.status}`);
        }

        const data = await res.json();
        setMarket(data);

        // Populate form fields
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "SPORTS");
        setStatus(data.status || "ACTIVE");
        setCloseTime(data.closeTime ? data.closeTime.substring(0, 16) : "");
        setResolutionSource(data.resolutionSource || "");
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load market");
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  // Fetch trades for this market (shell - backend endpoint not implemented yet)
  useEffect(() => {
    const fetchTrades = async () => {
      setTradesLoading(true);

      try {
        // TODO: Implement backend endpoint /api/v1/admin/markets/{marketId}/trades
        const res = await fetch(`${API_BASE_URL}/api/v1/trades/${marketId}`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setTrades(data);
        } else {
          console.log("Trades endpoint not yet implemented");
          setTrades([]);
        }
      } catch (err) {
        console.log("Trades endpoint not yet implemented:", err.message);
        setTrades([]);
      } finally {
        setTradesLoading(false);
      }
    };

    if (marketId) {
      fetchTrades();
    }
  }, [marketId]);

  // Save market changes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/markets/${marketId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          status,
          endDate: closeTime || null,
          resolutionSource: resolutionSource || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update market: ${res.status}`);
      }

      const updatedMarket = await res.json();
      setMarket(updatedMarket);
      setSaveSuccess("Market updated successfully!");

      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update market");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !market) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminNavbar />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <button
            onClick={() => navigate("/admin/markets-events")}
            className="mb-4 text-sm text-slate-400 hover:text-violet-400 transition-colors"
          >
            ← Back to Markets
          </button>
          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNavbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin/markets-events")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Market</h1>
          <p className="text-slate-400">
            Update market information and view trading activity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Edit Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Market Details</h2>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {STATUS_OPTIONS.map((stat) => (
                        <option key={stat} value={stat}>
                          {stat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Close Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Close Time
                  </label>
                  <input
                    type="datetime-local"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                {/* Resolution Source */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Resolution Source
                  </label>
                  <input
                    type="text"
                    value={resolutionSource}
                    onChange={(e) => setResolutionSource(e.target.value)}
                    placeholder="e.g., ESPN, Official Results, etc."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                {/* Success/Error Messages */}
                {saveSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
                    {saveSuccess}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/markets-events")}
                    className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Trades Section (Shell) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Market Trades</h2>

              {tradesLoading ? (
                <div className="py-8 text-center text-slate-400">
                  Loading trades...
                </div>
              ) : trades.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                    <svg
                      className="w-6 h-6 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">
                    No trades yet or backend endpoint not implemented.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Endpoint: GET /api/v1/trades/{marketId}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        <th className="py-2 px-3 font-semibold text-slate-300">User</th>
                        <th className="py-2 px-3 font-semibold text-slate-300">Outcome</th>
                        <th className="py-2 px-3 font-semibold text-slate-300">Type</th>
                        <th className="py-2 px-3 font-semibold text-slate-300">Quantity</th>
                        <th className="py-2 px-3 font-semibold text-slate-300">Price</th>
                        <th className="py-2 px-3 font-semibold text-slate-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50">
                          <td className="py-2 px-3 text-slate-100">{trade.user || "—"}</td>
                          <td className="py-2 px-3 text-slate-300">{trade.outcomeName || "—"}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                trade.side === "BUY"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {trade.side || "—"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">{trade.quantity || "—"}</td>
                          <td className="py-2 px-3 text-slate-300">
                            {trade.pricePerShare ? `${trade.pricePerShare}¢` : "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-xs">
                            {trade.createdAt
                              ? new Date(trade.createdAt).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Market Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Market Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 mb-0.5">Market ID</p>
                  <p className="text-slate-300 font-mono text-xs break-all">{market.id}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Created</p>
                  <p className="text-slate-300">
                    {market.createdAt
                      ? new Date(market.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Outcomes</p>
                  <p className="text-slate-300">{market.outcomes?.length || 0} configured</p>
                </div>
              </div>
            </motion.div>

            {/* Outcomes List */}
            {market.outcomes && market.outcomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Outcomes</h3>
                <div className="space-y-2">
                  {market.outcomes.map((outcome, idx) => (
                    <div
                      key={outcome.id || idx}
                      className="rounded-lg bg-slate-950/50 border border-slate-800 p-3"
                    >
                      <p className="text-sm font-medium text-slate-100">
                        {outcome.label || outcome.description || `Outcome ${idx + 1}`}
                      </p>
                      {outcome.currentPrice && (
                        <p className="text-xs text-slate-400 mt-1">
                          Current: {(outcome.currentPrice * 100).toFixed(0)}¢
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
