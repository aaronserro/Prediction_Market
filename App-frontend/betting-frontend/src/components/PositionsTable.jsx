import { Link } from "react-router-dom";
import { OutcomePill } from "./ui.jsx";
import { catLabel, fmt, fmtShortDate, signed, signedPct } from "../lib/format.js";
import { positionStats } from "../lib/positions.js";

const COLS = "grid-cols-[minmax(0,2.6fr)_minmax(0,1.1fr)_repeat(5,minmax(0,0.8fr))]";

/** Open positions table. Pass `marketsById` to show a category · close date subline. */
export default function PositionsTable({ positions, marketsById, stackedPl = false }) {
  return (
    <div className="overflow-x-auto">
      <div className={stackedPl ? "min-w-[820px]" : "min-w-[760px]"}>
        <div className={`grid ${COLS} gap-3 px-[22px] py-2.5 border-y border-bd bg-sf2 text-xs text-mu font-medium`}>
          <span>Market</span><span>Outcome</span>
          <span className="text-right">Shares</span><span className="text-right">Avg</span>
          <span className="text-right">Now</span><span className="text-right">Value</span><span className="text-right">P/L</span>
        </div>
        {positions.map((p, i) => {
          const s = positionStats(p);
          const m = marketsById?.[p.marketId];
          const plColor = s.pl >= 0 ? "text-yes" : "text-no";
          return (
            <Link
              key={`${p.marketId}-${p.outcomeId}-${i}`}
              to={`/markets/${p.marketId}`}
              className={`grid ${COLS} gap-3 items-center px-[22px] py-3.5 border-b border-bd last:border-b-0 text-tx text-[14px] hover:bg-sf2 transition-colors`}
            >
              <span className="min-w-0">
                <span className="block font-[550] truncate">{p.marketTitle || "Market"}</span>
                {m && (
                  <span className="block text-xs text-mu mt-0.5">
                    {catLabel(m.category)} · Closes {fmtShortDate(m.endDate)}
                  </span>
                )}
              </span>
              <span className="min-w-0"><OutcomePill label={p.outcomeName || "Outcome"} /></span>
              <span className="text-right font-mono">{fmt(s.qty)}</span>
              <span className="text-right font-mono text-mu">{fmt(s.avg)}</span>
              <span className="text-right font-mono">{fmt(s.now)}</span>
              <span className="text-right font-mono">{fmt(s.value)}</span>
              <span className={`text-right font-mono font-semibold ${plColor}`}>
                {signed(s.pl)}
                <span className={`font-normal text-xs ${stackedPl ? "block" : "ml-1"}`}>{signedPct(s.plPct)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
