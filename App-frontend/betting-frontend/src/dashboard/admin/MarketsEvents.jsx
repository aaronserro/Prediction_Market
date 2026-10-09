// src/dashboard/admin/MarketsEvents.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import MarketCreation from "./MarketCreation";
import { Chips, ErrorNote, Page, PageHeader, Segmented, Spinner, StatusPill, Tabs, card, tdCls, thCls } from "../../components/ui.jsx";
import { catLabel, fmtShortDate } from "../../lib/format.js";


const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

const CATEGORY_OPTIONS = ["ALL", "SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];
const STATUS_OPTIONS = ["ALL", "UPCOMING", "ACTIVE", "CLOSED", "RESOLVED"];
const CATEGORY_CHIPS = CATEGORY_OPTIONS.map((c) => ({ value: c, label: c === "ALL" ? "All" : catLabel(c) }));
const STATUS_LABELS = STATUS_OPTIONS.map((s) => (s === "ALL" ? "All" : catLabel(s)));

export default function MarketsEvents() {
  const navigate = useNavigate();
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

  const statusLabel = statusFilter === "ALL" ? "All" : catLabel(statusFilter);
  const filtersOn = titleFilter || categoryFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Page className="flex flex-col gap-5">
        <PageHeader title="Markets" subtitle="Create new prediction markets and manage existing ones." />

        <div className={`${card} overflow-hidden`}>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { value: "create", label: "Create market" },
              { value: "manage", label: "Manage markets", count: activeTab === "manage" && !loading ? markets.length : "" },
            ]}
          />

          {activeTab === "create" && (
            <div className="p-6">
              <MarketCreation onMarketCreated={handleMarketCreated} />
            </div>
          )}

          {activeTab === "manage" && (
            <>
              <div className="flex flex-col gap-3 px-[22px] py-[18px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 h-[42px] w-[min(100%,340px)] px-3.5 rounded-[11px] bg-sf border border-bd2 text-mu">
                    <span className="block w-3 h-3 rounded-full border-[1.6px] border-current flex-none" />
                    <input
                      type="text"
                      placeholder="Search by title…"
                      className="flex-1 min-w-0 border-0 outline-none bg-transparent text-tx text-[14.5px] placeholder:text-mu"
                      value={titleFilter}
                      onChange={(e) => setTitleFilter(e.target.value)}
                    />
                  </label>
                  <Segmented
                    options={STATUS_LABELS}
                    value={statusLabel}
                    onChange={(l) => setStatusFilter(STATUS_OPTIONS[STATUS_LABELS.indexOf(l)])}
                  />
                </div>
                <Chips options={CATEGORY_CHIPS} value={categoryFilter} onChange={setCategoryFilter} small />
              </div>

              {error && <div className="px-[22px] pb-4"><ErrorNote>{error}</ErrorNote></div>}

              {loading ? (
                <Spinner />
              ) : filteredMarkets.length === 0 ? (
                <div className="mx-[22px] mb-[22px] py-14 px-6 text-center border border-dashed border-bd2 rounded-2xl">
                  <div className="text-[16px] font-[620] mb-1.5">No markets found</div>
                  <p className="m-0 mx-auto max-w-md text-[14px] text-mu">
                    {filtersOn
                      ? "Try adjusting your filters to see more results."
                      : "No markets have been created yet. Create your first market using the Create market tab."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse">
                      <thead>
                        <tr>
                          <th className={thCls}>Title</th>
                          <th className={thCls}>Category</th>
                          <th className={thCls}>Status</th>
                          <th className={thCls}>Outcomes</th>
                          <th className={thCls}>Closes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMarkets.map((market) => (
                          <tr
                            key={market.id}
                            onClick={() => navigate(`/admin/markets/${market.id}`)}
                            className="hover:bg-sf2 transition-colors cursor-pointer"
                          >
                            <td className={`${tdCls} max-w-[420px]`}>
                              <div className="font-[550] truncate">{market.title}</div>
                              {market.description && <div className="text-xs text-mu mt-0.5 truncate">{market.description}</div>}
                            </td>
                            <td className={`${tdCls} text-tx2`}>{catLabel(market.category)}</td>
                            <td className={tdCls}><StatusPill status={market.status} /></td>
                            <td className={`${tdCls} font-mono`}>{market.outcomes?.length ?? 0}</td>
                            <td className={`${tdCls} text-mu whitespace-nowrap`}>{fmtShortDate(market.endDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="m-0 py-4 text-center text-[13px] text-mu">
                    Showing {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
                    {markets.length !== filteredMarkets.length && ` (filtered from ${markets.length} total)`}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </Page>
    </div>
  );
}
