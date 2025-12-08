// src/dashboard/admin/MarketsEvents.jsx
import React, { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar";
import MarketCreation from "./MarketCreation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const CATEGORY_OPTIONS = ["ALL", "SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];
const STATUS_OPTIONS = ["ALL", "ACTIVE", "PENDING", "CLOSED", "RESOLVED"];

export default function MarketsEvents() {
  const [activeTab, setActiveTab] = useState("create"); // "create" or "manage"

  // Manage Markets state
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [titleFilter, setTitleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetch markets based on filters
  const fetchMarkets = async () => {
    setLoading(true);
    setError("");

    try {
      let endpoint = `${API_BASE_URL}/api/v1/markets`;

      // Apply category or status filter if selected
      if (categoryFilter !== "ALL" && statusFilter !== "ALL") {
        // Fetch by status first, then filter by category on frontend
        endpoint = `${API_BASE_URL}/api/v1/markets/status/${statusFilter}`;
      } else if (categoryFilter !== "ALL") {
        endpoint = `${API_BASE_URL}/api/v1/markets/category/${categoryFilter}`;
      } else if (statusFilter !== "ALL") {
        endpoint = `${API_BASE_URL}/api/v1/markets/status/${statusFilter}`;
      }

      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch markets: ${res.status}`);
      }

      let data = await res.json();

      // Apply additional filtering if needed
      if (categoryFilter !== "ALL" && statusFilter !== "ALL") {
        data = data.filter(m => m.category === categoryFilter);
      }

      setMarkets(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load markets");
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch markets when tab changes to manage or filters change
  useEffect(() => {
    if (activeTab === "manage") {
      fetchMarkets();
    }
  }, [activeTab, categoryFilter, statusFilter]);

  // Filter markets by title on frontend
  const filteredMarkets = markets.filter(market =>
    titleFilter === "" || market.title.toLowerCase().includes(titleFilter.toLowerCase())
  );

  // Callback when market is successfully created
  const handleMarketCreated = () => {
    setActiveTab("manage");
    // Reset filters to show all markets
    setTitleFilter("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNavbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "create"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Market
            {activeTab === "create" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-sky-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "manage"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Manage Markets
            {activeTab === "manage" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-sky-400" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "create" && <MarketCreation onMarketCreated={handleMarketCreated} />}
        {activeTab === "manage" && (
          <div className="w-full text-slate-50">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-50 mb-1">
                Manage Markets
              </h2>
              <p className="text-sm text-slate-400">
                View, filter, and manage all prediction markets
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Search by Title
                  </label>
                  <input
                    type="text"
                    placeholder="Type to filter..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Filter by Category
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "ALL" ? "All Categories" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Filter by Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status === "ALL" ? "All Statuses" : status.charAt(0) + status.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Markets Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  Loading markets...
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="p-8 text-center">
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
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    No Markets Found
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    {titleFilter || categoryFilter !== "ALL" || statusFilter !== "ALL"
                      ? "Try adjusting your filters to see more results."
                      : "No markets have been created yet. Create your first market using the Create Market tab."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">Title</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarkets.map((market) => (
                        <tr
                          key={market.id}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-100 font-medium">
                            {market.title}
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                            {market.description || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {market.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                market.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : market.status === "PENDING"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : market.status === "CLOSED"
                                  ? "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                                  : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                              }`}
                            >
                              {market.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Results Count */}
            {!loading && filteredMarkets.length > 0 && (
              <div className="mt-4 text-sm text-slate-400 text-center">
                Showing {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
                {markets.length !== filteredMarkets.length && ` (filtered from ${markets.length} total)`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
