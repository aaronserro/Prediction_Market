import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorNote, LiveDot, Page, Segmented, Spinner, Tabs, card } from "../components/ui.jsx";
import { API_BASE, getJSON, isBinary, outcomeLabel, summarize, useMarketData, volumeOf } from "../lib/markets.js";
import { fixtureSource, useDataSource } from "../lib/dataSource.js";
import SignupGate from "../components/SignupGate.jsx";
import { buildHistory, toPath, xTicks } from "../lib/history.js";
import { catLabel, fmt, fmtDate, fmtDateTime, fmtShortDate, timeAgo } from "../lib/format.js";
import { useWallet } from "../lib/wallet.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const COLORS = ["var(--pr)", "var(--am)", "oklch(0.62 0.12 195)", "var(--mu)", "oklch(0.6 0.14 15)", "var(--bd2)"];
const RANGES = ["1D", "1W", "1M", "ALL"];
const QTYS = [10, 50, 100];
const CHART_H = 260;
const WATCH_KEY = "pryzm-watch";

const readWatch = () => {
  try { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]"); } catch { return []; }
};

const Diamond = () => <span className="w-[5px] h-[5px] mt-2 bg-am rotate-45 flex-none" />;

async function postTrade(side, body) {
  const res = await fetch(`${API_BASE}/api/v1/trades/${side}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    if (/insufficient (balance|funds)/i.test(text)) throw new Error("Insufficient balance. Please add funds to your wallet.");
    if (text.includes("outstanding=0")) throw new Error("You don't own any shares of this outcome to sell.");
    if (text.includes("Cannot sell more than outstanding")) throw new Error("You don't have enough shares to sell. Please check your portfolio.");
    throw new Error(text || `Trade failed with status ${res.status}`);
  }
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function PriceChart({ outcomes, history, range, setRange, binary, weekChange }) {
  const lead = outcomes.find((o) => o.isYes) || outcomes[0];
  const lines = binary
    ? [{ id: lead?.id, color: "var(--pr)" }]
    : [...outcomes].sort((a, b) => (b.p ?? 0) - (a.p ?? 0)).slice(0, 4).map((o) => ({ id: o.id, color: o.color }));
  const legend = [...outcomes].sort((a, b) => (b.p ?? 0) - (a.p ?? 0)).slice(0, 4);

  return (
    <div className={`${card} px-[22px] py-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        {binary ? (
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-4xl font-semibold tracking-[-0.05em] text-pr leading-none">{lead?.p ?? "—"}%</span>
            <span className="text-[14px] text-mu">chance</span>
            {weekChange !== 0 && (
              <span className={`font-mono text-[13px] font-medium ${weekChange > 0 ? "text-yes" : "text-no"}`}>
                {weekChange > 0 ? "▲" : "▼"} {Math.abs(weekChange).toFixed(1)} past week
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-[18px] gap-y-2">
            {legend.map((o) => (
              <span key={o.id} className="flex items-center gap-[7px] text-[13.5px] text-tx2">
                <span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: o.color }} />
                {o.label} <span className="font-mono font-semibold text-tx">{o.p ?? "—"}%</span>
              </span>
            ))}
          </div>
        )}
        <Segmented options={RANGES} value={range} onChange={setRange} mono />
      </div>

      <div className="relative mt-[18px] pr-10" style={{ height: CHART_H }}>
        <div className="absolute inset-0 flex flex-col justify-between font-mono text-[11px] text-mu">
          {["100%", "75%", "50%", "25%", "0%"].map((l) => (
            <div key={l} className="flex items-center gap-2">
              <div className="flex-1 border-t border-dashed border-bd" />
              <span className="w-8">{l}</span>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 600 ${CHART_H}`} preserveAspectRatio="none" className="absolute top-0 left-0 h-full overflow-visible" style={{ width: "calc(100% - 40px)" }}>
          {lines.map((ln) => (
            <path
              key={ln.id}
              d={toPath(history.series[ln.id] || [], CHART_H)}
              style={{ fill: "none", stroke: ln.color, strokeWidth: 2.25, vectorEffect: "non-scaling-stroke", strokeLinejoin: "round" }}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2 pr-10 font-mono text-[11px] text-mu">
        {xTicks(history.start, history.end, range).map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

function ConfirmModal({ market, outcome, action, qty, setQty, onCancel, onConfirm, busy }) {
  const isBuy = action === "BUY";
  const price = isBuy ? outcome.buy : outcome.sell;
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!isBuy) { setQuote(null); return; }
    let alive = true;
    setQuote(null);
    getJSON(`/api/v1/markets/${market.id}/outcomes/${outcome.id}/quote?quantity=${qty}`)
      .then((q) => alive && setQuote(Number(q)))
      .catch(() => {});
    return () => { alive = false; };
  }, [isBuy, market.id, outcome.id, qty]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const total = isBuy && Number.isFinite(quote) ? quote : price * qty;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(10,8,20,.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] bg-sf border border-bd rounded-[18px] overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}
      >
        <div className="px-[22px] pt-[22px]">
          <div className="text-[13px] text-mu mb-1 truncate">{market.title}</div>
          <h3 className="m-0 mb-[18px] text-[21px] font-[650] tracking-[-0.025em]">
            Confirm {isBuy ? "Buy" : "Sell"} · <span style={{ color: outcome.color }}>{outcome.label}</span>
          </h3>
          <div className="text-[12.5px] text-mu font-medium mb-2">Shares to {isBuy ? "buy" : "sell"}</div>
          <div className="grid grid-cols-3 gap-2 mb-[18px]">
            {QTYS.map((n) => {
              const on = n === qty;
              return (
                <button
                  key={n}
                  onClick={() => setQty(n)}
                  className={`h-16 rounded-xl border-[1.5px] cursor-pointer flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    on ? "bg-prs border-pr text-prt" : "bg-sf border-bd text-tx2 hover:border-bd2"
                  }`}
                >
                  <span className="font-mono text-xl font-semibold tracking-[-0.03em]">{n}</span>
                  <span className="text-[11px]">shares</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2.5 px-4 py-3.5 rounded-xl bg-sf2 text-[14px]">
            <div className="flex justify-between"><span className="text-mu">Action</span><span className={`font-semibold ${isBuy ? "text-yes" : "text-amt"}`}>{action}</span></div>
            <div className="flex justify-between gap-4"><span className="text-mu">Outcome</span><span className="font-semibold truncate">{outcome.label}</span></div>
            <div className="flex justify-between"><span className="text-mu">Price</span><span className="font-mono">{price} PZC / share</span></div>
            <div className="flex justify-between pt-2.5 border-t border-bd">
              <span className="font-semibold">{isBuy ? "Total cost" : "Total proceeds"}</span>
              <span className="font-mono text-[17px] font-semibold text-amt">{isBuy ? "" : "≈ "}{fmt(total)} PZC</span>
            </div>
            {isBuy && (
              <div className="flex justify-between gap-4">
                <span className="text-mu truncate">Payout if {outcome.label}</span>
                <span className="font-mono text-yes font-semibold">{fmt(100 * qty)} PZC</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1.4fr] gap-2 px-[22px] pt-[18px] pb-[22px]">
          <button onClick={onCancel} className="h-[46px] rounded-[11px] border border-bd2 bg-sf text-tx2 text-[14.5px] font-[550] cursor-pointer hover:bg-sf2">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="h-[46px] border-0 rounded-[11px] bg-pr enabled:hover:bg-prh text-white text-[14.5px] font-semibold cursor-pointer disabled:opacity-60"
          >
            {busy ? "Placing…" : `Confirm ${isBuy ? "Buy" : "Sell"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketDetail() {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, refresh: refreshWallet } = useWallet();

  const [market, setMarket] = useState(null);
  const [prices, setPrices] = useState({});
  const [trades, setTrades] = useState(null);
  const [positions, setPositions] = useState([]);
  const [allMarkets, setAllMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [range, setRange] = useState("1M");
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState("rules");
  const [modal, setModal] = useState(null); // { outcomeIndex, action }
  const [qty, setQty] = useState(10);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { kind, text }
  const [watched, setWatched] = useState(() => readWatch().includes(marketId));
  const [shared, setShared] = useState(false);
  const [comments, setComments] = useState(null); // null = no comments API for this source
  const [gate, setGate] = useState(null);

  // Signed in: real API. Signed out: fixtures. A signed-in user opening a
  // fixture-only market (e.g. from a blog post) falls back to a read-only preview.
  const preferred = useDataSource();
  const [src, setSrc] = useState(preferred);
  const preview = Boolean(user) && src.name === "fixtures";
  const canTrade = Boolean(user) && !preview;

  const loadPositions = useCallback(
    () => getJSON("/api/v1/positions/me").then((d) => setPositions(Array.isArray(d) ? d : [])).catch(() => {}),
    []
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setSel(0);
    setWatched(readWatch().includes(marketId));
    setComments(null);
    const find = () =>
      preferred.fetchMarket(marketId)
        .then((m) => ({ m, s: preferred }))
        .catch((e) => {
          if (preferred === fixtureSource) throw e;
          return fixtureSource.fetchMarket(marketId).then((m) => ({ m, s: fixtureSource })).catch(() => { throw e; });
        });
    find()
      .then(async ({ m, s }) => {
        if (!alive) return;
        setSrc(s);
        setMarket(m);
        const [p, t, c] = await Promise.all([s.loadPrices(m, { force: true }), s.loadTrades(m.id, { force: true }), s.loadComments(m.id)]);
        if (!alive) return;
        setPrices(p);
        setTrades(t);
        setComments(c);
        s.fetchMarkets().then((d) => alive && setAllMarkets(Array.isArray(d) ? d : [])).catch(() => {});
        if (user && s !== fixtureSource) loadPositions();
      })
      .catch((e) => alive && setError(e.message || "Failed to load market"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [marketId, loadPositions, preferred, user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const binary = market ? isBinary(market) : false;

  const outcomes = useMemo(() => {
    if (!market) return [];
    return (market.outcomes || []).map((o, i) => {
      const lbl = outcomeLabel(o);
      const isYes = lbl.trim().toLowerCase() === "yes";
      const p = prices[o.id] ?? null;
      const own = (trades || []).filter((t) => t.outcomeId === o.id);
      return {
        id: o.id,
        label: lbl,
        isYes,
        p,
        buy: p === null ? "—" : Math.max(1, p),
        sell: p === null ? "—" : Math.max(1, p - 1),
        vol: trades ? volumeOf(own) : null,
        color: binary ? (isYes ? "var(--yes)" : "var(--no)") : COLORS[i % COLORS.length],
      };
    });
  }, [market, prices, trades, binary]);

  const history = useMemo(() => (market ? buildHistory(market, trades, prices, range) : null), [market, trades, prices, range]);
  const weekChange = useMemo(() => {
    if (!market || !binary) return 0;
    const yes = outcomes.find((o) => o.isYes);
    const pts = buildHistory(market, trades, prices, "1W").series[yes?.id] || [];
    return pts.length ? Math.round((pts[pts.length - 1] - pts[0]) * 10) / 10 : 0;
  }, [market, binary, outcomes, trades, prices]);

  const related = useMemo(
    () =>
      allMarkets
        .filter((m) => m.id !== market?.id && m.category === market?.category && m.status === "ACTIVE")
        .slice(0, 3),
    [allMarkets, market]
  );
  const { prices: relatedPrices } = useMarketData(related, { source: src });

  if (loading) return <Page><Spinner /></Page>;

  if (error || !market) {
    return (
      <Page>
        <button onClick={() => navigate("/markets")} className="text-[13px] text-mu hover:text-tx bg-transparent border-0 cursor-pointer p-0 mb-5">
          ← Back to markets
        </button>
        <ErrorNote>{error || "Market not found"}</ErrorNote>
      </Page>
    );
  }

  const isActive = market.status === "ACTIVE";
  const selected = outcomes[Math.min(sel, outcomes.length - 1)];
  const holding = positions.find((p) => p.marketId === market.id && p.outcomeId === selected?.id);
  const volume = volumeOf(trades);
  const activity = [...(trades || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

  const open = (outcomeIndex, action) => {
    const o = outcomes[outcomeIndex];
    if (!isActive || prices[o?.id] === undefined || preview) return;
    if (!user) {
      setSel(outcomeIndex);
      setGate({ market, outcome: { label: o.label, price: action === "BUY" ? o.buy : o.sell }, side: action });
      return;
    }
    setSel(outcomeIndex);
    setQty(10);
    setModal({ outcomeIndex, action });
  };

  const confirm = async () => {
    const o = outcomes[modal.outcomeIndex];
    const isBuy = modal.action === "BUY";
    setBusy(true);
    try {
      const res = await postTrade(isBuy ? "buy" : "sell", { marketId: market.id, outcomeId: o.id, quantity: qty });
      const n = res.quantity ?? res.filledQuantity ?? qty;
      const at = res.pricePerShare ?? res.pricePerShareCents ?? (isBuy ? o.buy : o.sell);
      setToast({ kind: "ok", text: `${isBuy ? "Bought" : "Sold"} ${n} shares of ${o.label} at ${at} PZC` });
      setModal(null);
      const [p, t] = await Promise.all([src.loadPrices(market, { force: true }), src.loadTrades(market.id, { force: true })]);
      setPrices(p);
      setTrades(t);
      loadPositions();
      refreshWallet();
    } catch (e) {
      setModal(null);
      setToast({ kind: "err", text: e.message || "Trade failed" });
    } finally {
      setBusy(false);
    }
  };

  const toggleWatch = () => {
    if (!user) { setGate({ market, reason: "Sign up to build a watchlist" }); return; }
    const list = readWatch();
    const next = watched ? list.filter((id) => id !== market.id) : [...list, market.id];
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setWatched(!watched);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: market.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* dismissed */ }
  };

  const ghostBtn = "h-9 px-3.5 rounded-[9px] border border-bd bg-sf text-tx2 text-[13.5px] font-medium cursor-pointer hover:bg-sf2";
  const rowCols = "grid-cols-[minmax(0,1fr)_64px] sm:grid-cols-[minmax(0,1fr)_80px_230px]";

  return (
    <Page className="!pt-6">
      <div className="flex items-center gap-2 text-[13px] text-mu mb-[18px]">
        <Link to="/markets" className="text-mu hover:text-tx">Markets</Link>
        <span>/</span>
        <span className="text-tx2">{catLabel(market.category)}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex-[1_1_520px] min-w-0">
          <h1 className="m-0 mb-3 text-[clamp(24px,3vw,30px)] font-[650] tracking-[-0.035em] leading-[1.2]">{market.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-mu">
            <span className="px-[9px] py-[3px] rounded-md bg-prs text-prt font-semibold">{catLabel(market.category)}</span>
            {isActive ? (
              <span className="flex items-center gap-1.5 text-yes font-semibold"><LiveDot />LIVE</span>
            ) : (
              <span className="px-[9px] py-[3px] rounded-md bg-ams text-amt font-semibold">{market.status === "UPCOMING" ? "UPCOMING" : "CLOSED"}</span>
            )}
            <span><span className="font-mono text-tx2">{volume === null ? "—" : fmt(volume)}</span> PZC vol</span>
            <span>Closes {fmtDate(market.endDate)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleWatch} className={`${ghostBtn} ${watched ? "!text-prt !bg-prs !border-prs" : ""}`}>
            {watched ? "Watching" : "Watch"}
          </button>
          <button onClick={share} className={ghostBtn}>{shared ? "Link copied" : "Share"}</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-5 items-start">
        {/* ── left column ── */}
        <div className="flex-[2_1_620px] min-w-0 flex flex-col gap-4">
          <PriceChart outcomes={outcomes} history={history} range={range} setRange={setRange} binary={binary} weekChange={weekChange} />

          {outcomes.length > 0 ? (
            <div className={`${card} overflow-hidden`}>
              <div className={`grid ${rowCols} gap-3.5 px-[22px] py-3 border-b border-bd bg-sf2 text-xs text-mu font-medium`}>
                <span>Outcome</span><span className="text-right">Chance</span><span className="hidden sm:block" />
              </div>
              {outcomes.map((o, i) => {
                const on = i === sel;
                const disabled = !isActive || o.p === null || preview;
                return (
                  <div
                    key={o.id}
                    onClick={() => setSel(i)}
                    className={`grid ${rowCols} gap-3.5 items-center px-[22px] py-3.5 border-b border-bd last:border-b-0 cursor-pointer transition-colors ${on ? "bg-sf2" : "hover:bg-sf2"}`}
                    style={{ boxShadow: on ? "inset 3px 0 0 var(--pr)" : "none" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-[3px] flex-none" style={{ background: o.color }} />
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold truncate">{o.label}</div>
                        <div className="text-xs text-mu mt-0.5"><span className="font-mono">{o.vol === null ? "—" : fmt(o.vol)}</span> PZC vol</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[18px] font-semibold tracking-[-0.03em]">{o.p ?? "—"}%</div>
                    <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                      <button
                        disabled={disabled}
                        onClick={(e) => { e.stopPropagation(); open(i, "BUY"); }}
                        className="h-10 border-0 rounded-[9px] bg-yess text-yes text-[14px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Buy <span className="font-mono">{o.buy}</span>
                      </button>
                      <button
                        disabled={disabled}
                        onClick={(e) => { e.stopPropagation(); open(i, "SELL"); }}
                        className="h-10 border-0 rounded-[9px] bg-nos text-no text-[14px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Sell <span className="font-mono">{o.sell}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`${card} p-10 text-center text-[14px] text-mu`}>This market has no outcomes configured yet.</div>
          )}

          <div className={`${card} overflow-hidden`}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "rules", label: "Rules" },
                { value: "comments", label: "Comments", count: comments ? comments.length : "" },
                { value: "activity", label: "Activity", count: trades ? trades.length : "" },
              ]}
            />
            {tab === "rules" && (
              <div className="px-[22px] py-5 flex flex-col gap-[18px]">
                {market.description && <p className="m-0 text-[14.5px] leading-[1.65] text-tx2">{market.description}</p>}
                <div className="grid gap-3.5 p-4 rounded-xl bg-sf2 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                  <div><div className="text-xs text-mu mb-[3px]">Closes</div><div className="text-[14px] font-[550]">{fmtDateTime(market.endDate)}</div></div>
                  <div><div className="text-xs text-mu mb-[3px]">Created</div><div className="text-[14px] font-[550]">{fmtDate(market.createdAt)}</div></div>
                  <div><div className="text-xs text-mu mb-[3px]">Outcomes</div><div className="text-[14px] font-[550]">{outcomes.length}</div></div>
                  <div><div className="text-xs text-mu mb-[3px]">Resolution source</div><div className="text-[14px] font-[550]">{market.resolutionSource || "—"}</div></div>
                </div>
                <div className="flex flex-col gap-[9px] text-[14px] text-tx2">
                  <div className="flex gap-2.5"><Diamond />Market resolves based on official results</div>
                  <div className="flex gap-2.5"><Diamond />Trades execute instantly at displayed prices</div>
                  <div className="flex gap-2.5"><Diamond />Winning shares pay out 100 PZC each</div>
                </div>
              </div>
            )}
            {tab === "comments" && (
              <div className="px-[22px] py-[18px] flex flex-col gap-1">
                <div className="flex gap-2.5 mb-3">
                  <input
                    disabled={canTrade}
                    readOnly={!user}
                    onFocus={() => !user && setGate({ market, reason: "Sign up to join the discussion" })}
                    placeholder="Add a comment"
                    className="flex-1 min-w-0 h-[42px] rounded-[10px] border border-bd2 bg-sf text-tx px-3.5 text-[14px] outline-none disabled:opacity-60 placeholder:text-mu"
                  />
                  <button
                    disabled={canTrade}
                    onClick={() => !user && setGate({ market, reason: "Sign up to join the discussion" })}
                    className="h-[42px] px-4 border-0 rounded-[10px] bg-pr text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
                {comments === null ? (
                  <div className="py-8 border-t border-bd text-center text-[14px] text-mu">Comments are coming soon.</div>
                ) : comments.length === 0 ? (
                  <div className="py-8 border-t border-bd text-center text-[14px] text-mu">No comments yet. Start the conversation.</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 py-3 border-t border-bd">
                      <div className="w-8 h-8 rounded-full bg-sf2 text-tx2 flex items-center justify-center text-[13px] font-semibold flex-none">
                        {c.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[13px]">
                          <span className="font-semibold">{c.user}</span>
                          {c.holding && (
                            <span className={`px-[7px] py-px rounded-[5px] text-[11.5px] font-semibold ${
                              c.holding.outcome.toLowerCase() === "no" ? "bg-nos text-no" : c.holding.outcome.toLowerCase() === "yes" ? "bg-yess text-yes" : "bg-prs text-prt"
                            }`}>
                              Holds {fmt(c.holding.shares)} {c.holding.outcome}
                            </span>
                          )}
                          <span className="text-mu">{timeAgo(c.createdAt)}</span>
                        </div>
                        <div className="text-[14px] leading-[1.55] text-tx2 mt-1">{c.text}</div>
                        <div className="text-xs text-mu mt-1.5">♥ {c.likes}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "activity" && (
              <div className="px-[22px] pt-1.5 pb-2.5">
                {trades === null ? (
                  <div className="py-8 text-center text-[14px] text-mu">Sign in to see recent trades.</div>
                ) : activity.length === 0 ? (
                  <div className="py-8 text-center text-[14px] text-mu">No trades yet. Be the first.</div>
                ) : (
                  activity.map((a) => {
                    const buy = a.side === "BUY";
                    const name = a.user || "trader";
                    return (
                      <div key={a.id} className="flex items-center gap-3 py-[11px] border-b border-bd last:border-b-0 text-[14px]">
                        <div className="w-7 h-7 rounded-full bg-sf2 text-tx2 flex items-center justify-center text-xs font-semibold flex-none">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className="font-semibold">{name === user?.username ? "You" : name}</span>{" "}
                          <span className={`font-[550] ${buy ? "text-yes" : "text-no"}`}>{buy ? "bought" : "sold"}</span>{" "}
                          <span className="font-mono">{a.quantity}</span> {a.outcomeName} at <span className="font-mono">{a.pricePerShare}</span>
                        </span>
                        <span className="text-[12.5px] text-mu flex-none">{timeAgo(a.createdAt)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── right column ── */}
        <aside className="flex-[1_1_300px] min-w-0 sticky top-20 flex flex-col gap-4">
          {selected && (
            <div className="bg-sf border border-bd rounded-2xl shadow-trade p-5">
              <div className="text-[13px] text-mu mb-1">Trade</div>
              <div className="flex items-center gap-[9px] text-[18px] font-[620] tracking-[-0.02em] mb-4 min-w-0">
                <span className="w-2.5 h-2.5 rounded-[3px] flex-none" style={{ background: selected.color }} />
                <span className="truncate">{selected.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-[11px] bg-sf2">
                  <div className="text-xs text-mu">Buy price</div>
                  <div className="font-mono text-[22px] font-semibold tracking-[-0.04em] mt-0.5">{selected.buy}</div>
                </div>
                <div className="p-3 rounded-[11px] bg-sf2">
                  <div className="text-xs text-mu">Sell price</div>
                  <div className="font-mono text-[22px] font-semibold tracking-[-0.04em] mt-0.5">{selected.sell}</div>
                </div>
              </div>
              {preview ? (
                <div className="px-3.5 py-3 rounded-[11px] bg-sf2 text-tx2 text-[13.5px] font-[550]">
                  This is a sample market and isn’t open for trading.
                </div>
              ) : isActive ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => open(sel, "BUY")}
                    disabled={selected.p === null}
                    className="h-[46px] border-0 rounded-[11px] bg-pr enabled:hover:bg-prh text-white text-[15px] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => open(sel, "SELL")}
                    disabled={selected.p === null}
                    className="h-[46px] rounded-[11px] border border-bd2 bg-sf enabled:hover:bg-sf2 text-tx text-[15px] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Sell
                  </button>
                </div>
              ) : (
                <div className="px-3.5 py-3 rounded-[11px] bg-ams text-amt text-[13.5px] font-[550]">
                  {market.status === "UPCOMING"
                    ? `Trading opens ${fmtShortDate(market.startDate)}.`
                    : "Trading is closed. This market is awaiting resolution."}
                </div>
              )}
              <div className="flex flex-col gap-[9px] mt-4 pt-4 border-t border-bd text-[13.5px]">
                {canTrade && <div className="flex justify-between gap-3">
                  <span className="text-mu">Your position</span>
                  <span className="font-mono text-right">
                    {holding ? `${fmt(holding.quantity)} shares · avg ${fmt(holding.avgBuyPriceCents)}` : "—"}
                  </span>
                </div>}
                <div className="flex justify-between gap-3"><span className="text-mu">Payout if correct</span><span className="font-mono">100 PZC / share</span></div>
                {canTrade ? (
                  <div className="flex justify-between gap-3"><span className="text-mu">Available</span><span className="font-mono">{balance === null ? "—" : `${fmt(balance)} PZC`}</span></div>
                ) : !user && (
                  <div className="text-mu">
                    <Link to="/signup" className="text-pr hover:text-prh font-medium">Sign up</Link> or{" "}
                    <Link to="/login" className="text-pr hover:text-prh font-medium">log in</Link> to trade with free PZC.
                  </div>
                )}
              </div>
            </div>
          )}

          {toast && (
            <div className={`px-4 py-[13px] rounded-xl text-[13.5px] font-[550] ${toast.kind === "ok" ? "bg-yess text-yes" : "bg-nos text-no"}`}>
              {toast.text}
              {toast.kind === "err" && /add funds/i.test(toast.text) && (
                <Link to="/wallet" className="ml-1.5 underline text-no">Go to wallet</Link>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div className={`${card} overflow-hidden`}>
              <div className="px-[18px] py-3.5 text-[14px] font-semibold border-b border-bd">Related markets</div>
              {related.map((r) => {
                const s = summarize(r, relatedPrices[r.id]);
                const p = s.binary ? s.yes : s.rows[0]?.pct;
                return (
                  <Link
                    key={r.id}
                    to={`/markets/${r.id}`}
                    className="flex items-center gap-3 px-[18px] py-3 border-b border-bd last:border-b-0 text-tx text-[13.5px] hover:bg-sf2"
                  >
                    <span className="flex-1 min-w-0 leading-[1.35]">{r.title}</span>
                    <span className="font-mono text-[14px] font-semibold">{p ?? "—"}%</span>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {modal && outcomes[modal.outcomeIndex] && (
        <ConfirmModal
          market={market}
          outcome={outcomes[modal.outcomeIndex]}
          action={modal.action}
          qty={qty}
          setQty={setQty}
          busy={busy}
          onCancel={() => !busy && setModal(null)}
          onConfirm={confirm}
        />
      )}
      <SignupGate intent={gate} onClose={() => setGate(null)} />
    </Page>
  );
}
