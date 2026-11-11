// Display helpers. Currency is virtual PZC; 1 PZC = 1 backend cent,
// so a winning share (100¢) pays 100 PZC and prices 1–99 match % chance.

export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");

export const signed = (n) => {
  const v = Math.round(Number(n) || 0);
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toLocaleString("en-US");
};

export const signedPct = (n, digits = 1) => {
  const v = Number(n) || 0;
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(digits) + "%";
};

export const fmtVol = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return Math.round(v / 1e3) + "K";
  return String(Math.round(v));
};

export const catLabel = (c) => {
  const s = String(c || "Other");
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/* ── Timestamps ──
 * The API sends Java LocalDateTime values without a zone ("2025-01-02T15:04:05").
 * The server runs in UTC, so treat zone-less date-times as UTC instead of
 * letting the browser read them as local time. */
const ZONELESS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

export function toDate(d) {
  if (d instanceof Date) return d;
  if (typeof d === "string" && ZONELESS.test(d)) return new Date(d + "Z");
  return new Date(d);
}

/** Millisecond timestamp, NaN if missing/invalid. */
export const toTime = (d) => (d ? toDate(d).getTime() : NaN);

const pad = (n) => String(n).padStart(2, "0");

/** API (UTC) date-time -> value for <input type="datetime-local"> in the user's zone. */
export function toLocalInput(d) {
  if (!d) return "";
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local"> value (user's zone) -> zone-less UTC string for the API. */
export function fromLocalInput(v) {
  if (!v) return null;
  const date = new Date(v); // datetime-local strings parse as local time
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19);
}

/** "Dec 10" for this year, "Sep 30, 2027" otherwise. */
export function fmtShortDate(d) {
  if (!d) return "—";
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDate(d, opts = { month: "short", day: "numeric", year: "numeric" }) {
  if (!d) return "—";
  const date = toDate(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", opts);
}

export function fmtDateTime(d) {
  if (!d) return "—";
  const date = toDate(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(d) {
  const t = toTime(d);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
