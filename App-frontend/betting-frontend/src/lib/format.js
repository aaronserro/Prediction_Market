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

/** "Dec 10" for this year, "Sep 30, 2027" otherwise. */
export function fmtShortDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDate(d, opts = { month: "short", day: "numeric", year: "numeric" }) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", opts);
}

export function fmtDateTime(d) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(d) {
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
