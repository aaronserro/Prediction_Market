// Shared data access for markets, prices and trades.
import { useEffect, useState } from "react";

export const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

export const CATEGORIES = ["SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];

export async function getJSON(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function fetchMarkets(category) {
  return getJSON(category && category !== "ALL" ? `/api/v1/markets/category/${category}` : "/api/v1/markets");
}

export const isOpenListing = (m) => m.status === "ACTIVE" || m.status === "UPCOMING";

/** Normalise a price response (int cents, decimal 0–1, or object) to an integer 0–100. */
export function toCents(raw) {
  let v = raw;
  if (v && typeof v === "object") v = v.price ?? v.currentPrice ?? v.value ?? v.pricePerShare;
  const n = Number(v);
  if (v === null || v === undefined || !Number.isFinite(n)) return null;
  return Math.round(n > 0 && n < 1 ? n * 100 : n);
}

/* ── caches so the same price/trade list isn't fetched by every card ── */
const TTL = 20_000;
const priceCache = new Map(); // marketId -> { at, promise }
const tradeCache = new Map();

function cached(cache, key, loader, force) {
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = loader();
  cache.set(key, { at: Date.now(), promise });
  return promise;
}

/** { [outcomeId]: cents } for every outcome of a market. */
export function loadPrices(market, { force = false } = {}) {
  return cached(priceCache, market.id, async () => {
    const entries = await Promise.all(
      (market.outcomes || []).map(async (o) => {
        try {
          return [o.id, toCents(await getJSON(`/api/v1/markets/${market.id}/outcomes/${o.id}/price`))];
        } catch {
          return [o.id, null];
        }
      })
    );
    return Object.fromEntries(entries.filter(([, p]) => p !== null));
  }, force);
}

/** Trades for a market (requires auth). Resolves to null when unavailable. */
export function loadTrades(marketId, { force = false } = {}) {
  return cached(tradeCache, marketId, async () => {
    try {
      const list = await getJSON(`/api/v1/trades/${marketId}`);
      return Array.isArray(list) ? list : [];
    } catch {
      return null;
    }
  }, force);
}

/** Loads prices (and optionally trades) for a list of markets. Pass a data
 *  `source` (see lib/dataSource.js) to read fixtures instead of the API. */
export function useMarketData(markets, { trades = false, source } = {}) {
  const getPrices = source?.loadPrices ?? loadPrices;
  const getTrades = source?.loadTrades ?? loadTrades;
  const [prices, setPrices] = useState({});
  const [tradeMap, setTradeMap] = useState({});
  const key = markets.map((m) => m.id).join(",");

  useEffect(() => {
    let alive = true;
    markets.forEach((m) => {
      getPrices(m).then((p) => alive && setPrices((s) => ({ ...s, [m.id]: p })));
      if (trades) getTrades(m.id).then((t) => alive && setTradeMap((s) => ({ ...s, [m.id]: t })));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, trades, source?.name]);

  return { prices, trades: tradeMap };
}

/* ── market shape helpers ── */
const label = (o) => o?.label || o?.description || "Outcome";

export function isBinary(market) {
  const outs = market?.outcomes || [];
  if (outs.length !== 2) return false;
  const names = outs.map((o) => label(o).trim().toLowerCase()).sort();
  return names[0] === "no" && names[1] === "yes";
}

export function yesOutcome(market) {
  return (market?.outcomes || []).find((o) => label(o).trim().toLowerCase() === "yes");
}

export const outcomeLabel = label;

export function volumeOf(trades) {
  if (!Array.isArray(trades)) return null;
  return trades.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
}

/** Card-ready summary for a market given its price map and trades. */
export function summarize(market, prices = {}, trades) {
  const binary = isBinary(market);
  const outs = (market.outcomes || []).map((o) => ({ id: o.id, label: label(o), pct: prices[o.id] ?? null }));
  let yes = null;
  if (binary) {
    const y = yesOutcome(market);
    yes = prices[y.id] ?? null;
  }
  const rows = [...outs].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1)).slice(0, 3);
  return {
    binary,
    yes,
    no: yes === null ? null : 100 - yes,
    rows,
    volume: volumeOf(trades),
    tradeCount: Array.isArray(trades) ? trades.length : 0,
  };
}
