// Shared building blocks for the Pryzm redesign.
import { Link } from "react-router-dom";
import { catLabel, fmtShortDate, fmtVol } from "../lib/format.js";
import { CHART_W as W, toPath } from "../lib/history.js";

/* ── layout ─────────────────────────────────────────────────────────── */
export function Page({ children, className = "" }) {
  return (
    <>
      <main className={`max-w-page mx-auto px-6 pt-9 pb-[72px] ${className}`}>{children}</main>
      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-bd">
      <div className="max-w-page mx-auto px-6 py-[22px] flex flex-wrap justify-between gap-3.5 text-[12.5px] text-mu">
        <span>© 2026 Pryzm</span>
        <div className="flex gap-5">
          <a href="/terms" className="text-mu hover:text-tx">Terms</a>
          <a href="/privacy" className="text-mu hover:text-tx">Privacy</a>
          <a href="mailto:pryzmcompany@gmail.com" className="text-mu hover:text-tx">Support</a>
        </div>
      </div>
    </footer>
  );
}

export const card = "bg-sf border border-bd rounded-2xl shadow-sh";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-[32px] font-[650] tracking-[-0.035em] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14.5px] text-mu">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── small pieces ───────────────────────────────────────────────────── */
export function Coin({ size = 14, ring = 2 }) {
  return (
    <span
      className="inline-block rounded-full bg-am flex-none"
      style={{ width: size, height: size, boxShadow: `inset 0 0 0 ${ring}px rgba(0,0,0,.12)` }}
    />
  );
}

export function LiveDot({ size = 6, color = "var(--yes)", pulse = true }) {
  return (
    <span
      className={`inline-block rounded-full flex-none ${pulse ? "pz-live" : ""}`}
      style={{ width: size, height: size, background: color }}
    />
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-bd border-t-pr animate-spin" />
    </div>
  );
}

export function ErrorNote({ children }) {
  return <div className="rounded-xl px-4 py-3 text-sm bg-nos text-no">{children}</div>;
}

/** Pill chips; the active pill is inverted (tx on bg). */
export function Chips({ options, value, onChange, small = false, wrap = false }) {
  return (
    <div className={`flex gap-1.5 min-w-0 ${wrap ? "flex-wrap" : "pz-scroll-x"}`}>
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-none rounded-full border font-medium cursor-pointer transition-colors ${
              small ? "h-8 px-[13px] text-[13px]" : "h-[34px] px-3.5 text-[13.5px]"
            } ${on ? "bg-tx text-bg border-tx" : "bg-sf text-tx2 border-bd hover:border-bd2"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented control (range tabs, sort). */
export function Segmented({ options, value, onChange, mono = false }) {
  return (
    <div className="flex gap-0.5 p-[3px] rounded-[9px] bg-sf2 flex-none">
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`h-7 border-0 rounded-[7px] cursor-pointer transition-colors ${
              mono ? "px-[11px] font-mono text-[12.5px] font-medium" : "px-3 text-[13px] font-medium"
            } ${on ? "bg-sf text-tx shadow-seg" : "bg-transparent text-mu hover:text-tx"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs used by Portfolio and Market detail. */
export function Tabs({ tabs, value, onChange, height = 48 }) {
  return (
    <div className="flex gap-1 px-3.5 border-b border-bd">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{ height }}
            className={`px-2.5 border-0 border-b-2 bg-transparent text-[14px] font-[550] cursor-pointer -mb-px transition-colors ${
              on ? "border-pr text-tx" : "border-transparent text-mu hover:text-tx"
            }`}
          >
            {t.label}{" "}
            {t.count !== undefined && t.count !== "" && (
              <span className="font-mono text-xs font-normal text-mu">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Yes = green, No = red, any named outcome = violet. */
export function OutcomePill({ label }) {
  const l = String(label || "").trim().toLowerCase();
  const cls = l === "yes" ? "bg-yess text-yes" : l === "no" ? "bg-nos text-no" : "bg-prs text-prt";
  return (
    <span className={`inline-block max-w-full truncate align-middle px-[9px] py-[3px] rounded-md text-[12.5px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/* ── chart ──────────────────────────────────────────────────────────── */
/** Lines over a 0–100 scale. `area` fills under the first line. */
export function LineChart({ lines, height, area = false, gridLines = 3 }) {
  return (
    <div className="relative" style={{ height }}>
      {gridLines > 0 && (
        <div className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: gridLines }, (_, i) => <div key={i} className="border-t border-dashed border-bd" />)}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
        {area && lines[0] && (
          <path d={`${toPath(lines[0].points, height)} L${W} ${height} L0 ${height} Z`} style={{ fill: "var(--prs)", opacity: 0.7 }} />
        )}
        {lines.map((ln, i) => (
          <path
            key={i}
            d={toPath(ln.points, height)}
            style={{ fill: "none", stroke: ln.color, strokeWidth: 2.25, vectorEffect: "non-scaling-stroke", strokeLinejoin: "round" }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ── market card ────────────────────────────────────────────────────── */
export function MarketCard({ market, summary }) {
  const upcoming = market.status === "UPCOMING";
  const s = summary || {};
  const pct = (v) => (v === null || v === undefined ? "—" : v);

  return (
    <Link
      to={`/markets/${market.id}`}
      className="flex flex-col gap-3.5 p-4 bg-sf border border-bd rounded-[14px] shadow-sh text-tx hover:border-bd2 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-mu font-medium mb-[5px]">
            <span>{catLabel(market.category)}</span>
            {upcoming && <span className="px-1.5 py-px rounded-[5px] bg-ams text-amt font-semibold text-[11px]">UPCOMING</span>}
          </div>
          <div className="text-[15px] font-semibold leading-[1.35] tracking-[-0.01em]">{market.title}</div>
        </div>
        {s.binary && (
          <div className="text-right flex-none">
            <div className="font-mono text-[22px] font-semibold tracking-[-0.04em] leading-tight">{pct(s.yes)}%</div>
            <div className="text-[11px] text-mu">chance</div>
          </div>
        )}
      </div>

      {s.binary ? (
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="h-[38px] rounded-[9px] bg-yess text-yes font-semibold text-[14px] flex items-center justify-center gap-1.5">
            Yes <span className="font-mono">{pct(s.yes)}</span>
          </div>
          <div className="h-[38px] rounded-[9px] bg-nos text-no font-semibold text-[14px] flex items-center justify-center gap-1.5">
            No <span className="font-mono">{pct(s.no)}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[7px] mt-auto">
          {(s.rows || (market.outcomes || []).slice(0, 3).map((o) => ({ id: o.id, label: o.label, pct: null }))).map((o) => (
            <div key={o.id} className="flex items-center gap-2.5 text-[13.5px]">
              <span className="flex-1 min-w-0 truncate text-tx2">{o.label}</span>
              <span className="font-mono font-semibold w-[38px] text-right">{pct(o.pct)}%</span>
              <span className="h-[26px] px-2.5 rounded-[7px] bg-yess text-yes text-xs font-semibold flex items-center">Yes</span>
              <span className="h-[26px] px-2.5 rounded-[7px] bg-nos text-no text-xs font-semibold flex items-center">No</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-bd text-xs text-mu">
        <LiveDot pulse={false} color={upcoming ? "var(--am)" : "var(--yes)"} />
        <span>
          <span className="font-mono text-tx2">{s.volume === null || s.volume === undefined ? "—" : fmtVol(s.volume)}</span> PZC vol
        </span>
        <span className="ml-auto">Closes {fmtShortDate(market.endDate)}</span>
      </div>
    </Link>
  );
}

export function MarketGrid({ children }) {
  return <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))]">{children}</div>;
}

/* ── forms, buttons, notices ────────────────────────────────────────── */
export const inputCls =
  "w-full h-[46px] px-3.5 rounded-[11px] border border-bd2 bg-sf text-tx text-[14.5px] placeholder:text-mu outline-none focus:border-pr transition-colors disabled:opacity-60";
export const textareaCls =
  "w-full px-3.5 py-3 rounded-[11px] border border-bd2 bg-sf text-tx text-[14.5px] leading-[1.55] placeholder:text-mu outline-none focus:border-pr transition-colors resize-y";

const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-[14px] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary = `${btnBase} h-10 px-4 border-0 bg-pr enabled:hover:bg-prh text-white font-semibold`;
export const btnSecondary = `${btnBase} h-10 px-4 border border-bd2 bg-sf enabled:hover:bg-sf2 text-tx font-[550]`;
export const btnAmber = `${btnBase} h-10 px-4 border-0 bg-am enabled:hover:brightness-105 text-[#1d1300] font-[650]`;
export const btnDanger = `${btnBase} h-10 px-4 border-0 bg-no enabled:hover:brightness-110 text-white font-semibold`;
export const btnSmall = "!h-8 !px-3 !text-[13px] !rounded-lg";

export function Field({ label, hint, htmlFor, children }) {
  return (
    <div>
      {label && <label htmlFor={htmlFor} className="block text-[13px] text-tx2 font-medium mb-[7px]">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-mu">{hint}</p>}
    </div>
  );
}

/** Inline banner: kind = ok | err | warn. */
export function Notice({ kind = "ok", children, onDismiss }) {
  const cls = kind === "err" ? "bg-nos text-no" : kind === "warn" ? "bg-ams text-amt" : "bg-yess text-yes";
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-[14px] ${cls}`}>
      <div className="flex-1 min-w-0 break-words">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="border-0 bg-transparent text-mu text-[13px] cursor-pointer hover:text-tx flex-none">
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Status pill shared by markets, fund requests and roles. */
const STATUS_CLS = {
  ACTIVE: "bg-yess text-yes",
  APPROVED: "bg-yess text-yes",
  BUY: "bg-yess text-yes",
  PENDING: "bg-ams text-amt",
  UPCOMING: "bg-ams text-amt",
  CLOSED: "bg-sf2 text-tx2",
  RESOLVED: "bg-prs text-prt",
  ADMIN: "bg-prs text-prt",
  REJECTED: "bg-nos text-no",
  SELL: "bg-nos text-no",
};
export function StatusPill({ status }) {
  return (
    <span className={`inline-block px-[9px] py-[3px] rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_CLS[status] || "bg-sf2 text-mu"}`}>
      {status}
    </span>
  );
}

export function Modal({ onClose, children, maxWidth = 420 }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(10,8,20,.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full bg-sf border border-bd rounded-[18px] p-[22px]"
        style={{ maxWidth, boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}
      >
        {children}
      </div>
    </div>
  );
}

/** Table header row cell classes. */
export const thCls = "px-[22px] py-2.5 text-left text-xs text-mu font-medium bg-sf2 border-y border-bd whitespace-nowrap";
export const tdCls = "px-[22px] py-3.5 text-[14px] border-b border-bd";

/** Two-tone switch used on Settings. */
export function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-[42px] flex-none items-center rounded-full p-[3px] border-0 cursor-pointer transition-colors ${on ? "bg-pr" : "bg-bd2"}`}
    >
      <span className={`block h-[18px] w-[18px] rounded-full bg-white shadow-seg transition-transform ${on ? "translate-x-[18px]" : ""}`} />
    </button>
  );
}
