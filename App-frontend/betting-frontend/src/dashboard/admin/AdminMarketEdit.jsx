// src/dashboard/admin/AdminMarketEdit.jsx
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { ErrorNote, Field, Notice, Page, Spinner, StatusPill, btnAmber, btnPrimary, btnSecondary, card, inputCls, tdCls, textareaCls, thCls } from "../../components/ui.jsx";
import { catLabel, fmt, fmtDate, fmtDateTime, fromLocalInput, toLocalInput } from "../../lib/format.js";
import { errorFromResponse, loadPrices } from "../../lib/markets.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

const CATEGORY_OPTIONS = ["SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];
// RESOLVED is set only by the Resolve action, which settles positions and pays winners.
const STATUS_OPTIONS = ["UPCOMING", "ACTIVE", "CLOSED"];

export default function AdminMarketEdit() {
  const { marketId } = useParams();
  const navigate = useNavigate();

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  // Resolve market state
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [resolveSuccess, setResolveSuccess] = useState("");
  const [selectedWinningOutcome, setSelectedWinningOutcome] = useState("");
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SPORTS");
  const [status, setStatus] = useState("ACTIVE");
  const [closeTime, setCloseTime] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");

  const [prices, setPrices] = useState({});

  // Trades data
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

        if (!res.ok) throw await errorFromResponse(res);

        const data = await res.json();
        setMarket(data);
        loadPrices(data, { force: true }).then(setPrices).catch(() => {});

        // Populate form fields
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "SPORTS");
        setStatus(data.status || "ACTIVE");
        setCloseTime(toLocalInput(data.endDate));
        setResolutionSource(data.resolutionSource || "");
        // A CLOSED market with a recorded winner is a resolution that didn't finish.
        if (data.winningOutcomeId) setSelectedWinningOutcome(data.winningOutcomeId);
      } catch (err) {
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
          setTrades((Array.isArray(data) ? data : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } else {
          setTrades([]);
        }
      } catch {
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
          // Only send status when the admin actually changed it.
          ...(status !== market.status ? { status } : {}),
          endDate: fromLocalInput(closeTime),
          resolutionSource: resolutionSource || null,
        }),
      });

      if (!res.ok) throw await errorFromResponse(res);

      const updatedMarket = await res.json();
      setMarket(updatedMarket);
      setStatus(updatedMarket.status || status);
      setSaveSuccess("Market updated successfully!");

      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update market");
    } finally {
      setSaveLoading(false);
    }
  };

  // Resolve market
  const handleResolveMarket = async () => {
    if (!selectedWinningOutcome) {
      setResolveError("Please select a winning outcome");
      return;
    }

    setResolveLoading(true);
    setResolveError("");
    setResolveSuccess("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/admin/markets/${marketId}/resolve?winningOutcomeId=${selectedWinningOutcome}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const err = await errorFromResponse(res);
        if (err.status === 409 && /could not be settled/i.test(err.message)) {
          // Winner is recorded; some payouts failed. Keep the panel open so the admin can retry.
          setMarket((m) => ({ ...m, winningOutcomeId: selectedWinningOutcome }));
          throw new Error(`${err.message}. Click “Confirm resolve” again to retry.`);
        }
        throw err;
      }

      // 204 No Content on success
      setMarket((m) => ({ ...m, status: "RESOLVED", winningOutcomeId: selectedWinningOutcome }));
      setStatus("RESOLVED");

      setResolveSuccess("Market resolved successfully!");
      setShowResolveConfirm(false);

      setTimeout(() => setResolveSuccess(""), 5000);
    } catch (err) {
      setResolveError(err.message || "Failed to resolve market");
    } finally {
      setResolveLoading(false);
    }
  };

  const back = (
    <Link to="/admin/markets-events" className="inline-block text-[13px] text-mu hover:text-tx mb-[18px]">← Markets</Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <AdminNavbar />
        <Page><Spinner /></Page>
      </div>
    );
  }

  if (error && !market) {
    return (
      <div className="min-h-screen">
        <AdminNavbar />
        <Page>{back}<ErrorNote>{error}</ErrorNote></Page>
      </div>
    );
  }

  const volume = trades.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  const isResolved = market.status === "RESOLVED";
  const resolvePending = market.status === "CLOSED" && !!market.winningOutcomeId;
  const winner = market.outcomes?.find((o) => o.id === market.winningOutcomeId);

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Page className="!pt-6">
        {back}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="m-0 mb-3 text-[clamp(24px,3vw,30px)] font-[650] tracking-[-0.035em] leading-[1.2]">{market.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-mu">
              <span className="px-[9px] py-[3px] rounded-md bg-prs text-prt font-semibold">{catLabel(market.category)}</span>
              <StatusPill status={market.status} />
              <span><span className="font-mono text-tx2">{fmt(volume)}</span> PZC vol</span>
              <span><span className="font-mono text-tx2">{trades.length}</span> trades</span>
            </div>
          </div>
          <Link to={`/markets/${market.id}`} className={btnSecondary}>View public page</Link>
        </div>

        <div className="flex flex-wrap gap-5 items-start">
          {/* Left column */}
          <div className="flex-[2_1_620px] min-w-0 flex flex-col gap-4">
            <form onSubmit={handleSave} className={`${card} p-6 flex flex-col gap-4`}>
              <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Market details</h2>
              {isResolved && <Notice kind="warn">Resolved markets can’t be edited.</Notice>}

              <fieldset disabled={isResolved} className="contents">
              <Field label="Title" htmlFor="me-title">
                <input id="me-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
              </Field>
              <Field label="Description" htmlFor="me-desc">
                <textarea id="me-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={textareaCls} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" htmlFor="me-cat">
                  <select id="me-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{catLabel(cat)}</option>)}
                  </select>
                </Field>
                <Field label="Status" htmlFor="me-status">
                  <select id="me-status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{catLabel(st)}</option>)}
                    {isResolved && <option value="RESOLVED" disabled>Resolved</option>}
                  </select>
                </Field>
              </div>
              <Field label="Closes" htmlFor="me-close">
                <input id="me-close" type="datetime-local" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Resolution source" htmlFor="me-src">
                <input
                  id="me-src"
                  type="text"
                  value={resolutionSource}
                  onChange={(e) => setResolutionSource(e.target.value)}
                  placeholder="e.g. ESPN, official results"
                  className={inputCls}
                />
              </Field>
              </fieldset>

              {saveSuccess && <Notice kind="ok">{saveSuccess}</Notice>}
              {error && <Notice kind="err">{error}</Notice>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saveLoading || isResolved} className={btnPrimary}>{saveLoading ? "Saving…" : "Save changes"}</button>
                <button type="button" onClick={() => navigate("/admin/markets-events")} className={btnSecondary}>Cancel</button>
              </div>
            </form>

            <section className={`${card} overflow-hidden`}>
              <div className="px-[22px] py-[18px]">
                <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">
                  Trades <span className="font-mono text-[13px] font-medium text-mu ml-1.5">{trades.length}</span>
                </h2>
              </div>
              {tradesLoading ? (
                <Spinner />
              ) : trades.length === 0 ? (
                <div className="py-10 text-center text-[14px] text-mu border-t border-bd">No trades yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className={thCls}>User</th>
                        <th className={thCls}>Outcome</th>
                        <th className={thCls}>Side</th>
                        <th className={`${thCls} !text-right`}>Shares</th>
                        <th className={`${thCls} !text-right`}>Price</th>
                        <th className={thCls}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, idx) => (
                        <tr key={trade.id ?? idx} className="hover:bg-sf2 transition-colors">
                          <td className={`${tdCls} font-[550]`}>{trade.user || "—"}</td>
                          <td className={`${tdCls} text-tx2`}>{trade.outcomeName || "—"}</td>
                          <td className={tdCls}>{trade.side ? <StatusPill status={trade.side} /> : "—"}</td>
                          <td className={`${tdCls} text-right font-mono`}>{trade.quantity ?? "—"}</td>
                          <td className={`${tdCls} text-right font-mono`}>{trade.pricePerShare ?? "—"}</td>
                          <td className={`${tdCls} text-mu whitespace-nowrap`}>{trade.createdAt ? fmtDateTime(trade.createdAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
            <div className={`${card} p-5 flex flex-col gap-3 text-[13.5px]`}>
              <div className="text-[14px] font-semibold">Market info</div>
              <div className="flex justify-between gap-3"><span className="text-mu">Created</span><span>{fmtDate(market.createdAt)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-mu">Closes</span><span>{fmtDate(market.endDate)}</span></div>
              <div>
                <div className="text-mu mb-1">Market ID</div>
                <div className="font-mono text-xs break-all text-tx2">{market.id}</div>
              </div>
            </div>

            {market.outcomes && market.outcomes.length > 0 && (
              <div className={`${card} overflow-hidden`}>
                <div className="px-[18px] py-3.5 text-[14px] font-semibold border-b border-bd">
                  Outcomes <span className="font-mono text-[13px] font-medium text-mu ml-1">{market.outcomes.length}</span>
                </div>
                {market.outcomes.map((outcome, idx) => (
                  <div key={outcome.id || idx} className="flex items-center gap-3 px-[18px] py-3 border-b border-bd last:border-b-0 text-[14px]">
                    <span className="flex-1 min-w-0 truncate font-[550]">{outcome.label || outcome.description || `Outcome ${idx + 1}`}</span>
                    <span className="font-mono font-semibold">{prices[outcome.id] != null ? `${prices[outcome.id]}%` : "—"}</span>
                  </div>
                ))}
              </div>
            )}

            {(market.status === "UPCOMING" || market.status === "ACTIVE") && (
              <Notice kind="warn">Close the market (set status to Closed and save) before resolving it.</Notice>
            )}

            {market.status === "CLOSED" && market.outcomes && market.outcomes.length > 0 && (
              <div className="bg-sf border border-bd rounded-2xl shadow-trade p-5 flex flex-col gap-4">
                <div>
                  <div className="text-[14px] font-semibold">Resolve market</div>
                  <p className="m-0 mt-1 text-[13px] text-mu">Sets the status to Resolved and pays 100 PZC per winning share.</p>
                </div>

                {resolvePending && !resolveError && (
                  <Notice kind="warn">A previous resolve didn’t finish paying out. Resolve again with the same outcome to retry.</Notice>
                )}
                {resolveSuccess && <Notice kind="ok">{resolveSuccess}</Notice>}
                {resolveError && <Notice kind="err">{resolveError}</Notice>}

                <Field label="Winning outcome" htmlFor="me-winner">
                  <select
                    id="me-winner"
                    value={selectedWinningOutcome}
                    onChange={(e) => setSelectedWinningOutcome(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                    disabled={resolveLoading || resolvePending}
                  >
                    <option value="">Select an outcome</option>
                    {market.outcomes.map((outcome) => (
                      <option key={outcome.id} value={outcome.id}>
                        {outcome.label || outcome.description || `Outcome ${outcome.id}`}
                      </option>
                    ))}
                  </select>
                </Field>

                {!showResolveConfirm ? (
                  <button
                    onClick={() => setShowResolveConfirm(true)}
                    disabled={!selectedWinningOutcome || resolveLoading}
                    className={`${btnAmber} w-full !h-[46px] !rounded-[11px]`}
                  >
                    Resolve market
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Notice kind="warn">
                      <span className="font-semibold">This can’t be undone.</span> Payouts go to holders of the winning outcome.
                    </Notice>
                    <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                      <button onClick={() => setShowResolveConfirm(false)} disabled={resolveLoading} className={`${btnSecondary} !h-[46px]`}>Cancel</button>
                      <button onClick={handleResolveMarket} disabled={resolveLoading} className={`${btnPrimary} !h-[46px]`}>
                        {resolveLoading ? "Resolving…" : "Confirm resolve"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isResolved && (
              <Notice kind="ok">
                <span className="font-semibold">Market resolved.</span>
                {winner ? ` Winner: ${winner.label || winner.description}.` : ""}
                {" "}Payouts have been distributed.
              </Notice>
            )}
          </aside>
        </div>
      </Page>
    </div>
  );
}
