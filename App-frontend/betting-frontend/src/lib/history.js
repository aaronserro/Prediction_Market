// Builds price-history series from a market's trade log. There is no
// dedicated price-history endpoint yet, so each trade's pricePerShare is
// treated as that outcome's price at the moment of the trade.

export const RANGES = {
  "1D": 864e5,
  "1W": 7 * 864e5,
  "1M": 30 * 864e5,
  ALL: Infinity,
};

const SAMPLES = 80;
const clamp = (v) => Math.max(0, Math.min(100, v));

/**
 * @returns {{ start: number, end: number, series: Record<outcomeId, number[]> }}
 */
export function buildHistory(market, trades, prices, range = "1M") {
  const end = Date.now();
  const outcomes = market?.outcomes || [];
  const list = (Array.isArray(trades) ? trades : [])
    .map((t) => ({ ...t, at: new Date(t.createdAt).getTime(), p: Number(t.pricePerShare) }))
    .filter((t) => Number.isFinite(t.at) && Number.isFinite(t.p))
    .sort((a, b) => a.at - b.at);

  const first = list.length ? list[0].at : end - 864e5;
  const created = market?.createdAt ? new Date(market.createdAt).getTime() : first;
  const origin = Math.min(first, Number.isFinite(created) ? created : first);
  const span = RANGES[range] ?? RANGES["1M"];
  const start = span === Infinity ? origin : Math.max(origin, end - span);

  const series = {};
  outcomes.forEach((o) => {
    const own = list.filter((t) => t.outcomeId === o.id);
    const current = prices?.[o.id];
    // Value at range start: last trade before it, else first trade, else current.
    let idx = 0;
    let value = own.length ? own[0].p : current ?? 50;
    while (idx < own.length && own[idx].at <= start) { value = own[idx].p; idx++; }

    const pts = [];
    for (let i = 0; i < SAMPLES; i++) {
      const t = start + ((end - start) * i) / (SAMPLES - 1);
      while (idx < own.length && own[idx].at <= t) { value = own[idx].p; idx++; }
      pts.push(clamp(value));
    }
    if (current !== undefined && current !== null) pts[pts.length - 1] = clamp(current);
    series[o.id] = pts;
  });

  return { start, end, series };
}

/** Four evenly spaced x-axis labels, the last one "Now". */
export function xTicks(start, end, range) {
  const day = range === "1D";
  return [0, 1 / 3, 2 / 3, 1].map((f, i) => {
    if (i === 3) return "Now";
    const d = new Date(start + (end - start) * f);
    return day
      ? d.toLocaleTimeString("en-US", { hour: "numeric" }).replace(" AM", "a").replace(" PM", "p")
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

/* SVG path over a CHART_W × h viewBox for values on a 0–100 scale. */
export const CHART_W = 600;

export function toPath(points, h) {
  if (!points.length) return "";
  const n = points.length;
  return points
    .map((v, i) => `${i ? "L" : "M"}${(n === 1 ? 0 : (i / (n - 1)) * CHART_W).toFixed(1)} ${(h - (v / 100) * h).toFixed(1)}`)
    .join(" ");
}
