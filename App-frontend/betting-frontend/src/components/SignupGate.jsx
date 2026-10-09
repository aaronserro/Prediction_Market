import { Link } from "react-router-dom";
import { Coin, Modal, OutcomePill, btnPrimary, btnSecondary } from "./ui.jsx";

/**
 * Shown to signed-out visitors when they try to trade. `intent` is
 * { market, outcome: { label, price }, side: "YES" | "NO" | "BUY" | "SELL" } or
 * { reason } for non-trade actions (watchlist, comments).
 */
export default function SignupGate({ intent, onClose }) {
  if (!intent) return null;
  const { market, outcome, side, reason } = intent;
  const selling = side === "SELL";
  const label = outcome
    ? side === "NO" && outcome.label?.toLowerCase() !== "no" && outcome.label?.toLowerCase() !== "yes"
      ? `No · ${outcome.label}`
      : side === "NO" ? "No" : outcome.label
    : null;

  return (
    <Modal onClose={onClose}>
      {market && <div className="text-[13px] text-mu mb-1 truncate">{market.title}</div>}
      <h3 className="m-0 mb-4 text-[21px] font-[650] tracking-[-0.025em]">
        {reason || "Create a free account to trade"}
      </h3>

      {outcome && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-sf2 mb-4 text-[14px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-mu">{selling ? "Sell" : "Buy"}</span>
            <OutcomePill label={label} />
          </div>
          {outcome.price != null && <span className="font-mono font-semibold">{outcome.price} PZC / share</span>}
        </div>
      )}

      <ul className="m-0 mb-5 p-0 list-none flex flex-col gap-2.5 text-[14px] text-tx2">
        <li className="flex items-center gap-2.5"><Coin size={12} />Trade with virtual PZC. No real money, ever.</li>
        <li className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 bg-pr rotate-45 mx-[3px]" />Earn a rank as your calls prove out.</li>
        <li className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-yes mx-[3px]" />Winning shares pay 100 PZC each.</li>
      </ul>

      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <Link to="/login" className={`${btnSecondary} !h-[46px] !rounded-[11px]`}>Log in</Link>
        <Link to="/signup" className={`${btnPrimary} !h-[46px] !rounded-[11px]`}>Sign up free →</Link>
      </div>
      <button onClick={onClose} className="mt-3 w-full border-0 bg-transparent text-[13px] text-mu hover:text-tx cursor-pointer">
        Keep browsing
      </button>
    </Modal>
  );
}
