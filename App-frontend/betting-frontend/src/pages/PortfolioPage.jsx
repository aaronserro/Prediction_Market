import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorNote, Page, PageHeader, Spinner, Tabs, card, tdCls, thCls } from "../components/ui.jsx";
import PositionsTable from "../components/PositionsTable.jsx";
import { isOpenPosition, realizedTotal, totals } from "../lib/positions.js";
import { fetchMarkets, getJSON } from "../lib/markets.js";
import { fmt, signed, signedPct } from "../lib/format.js";

function Cell({ label, children, sub, color = "", last = false }) {
  return (
    <div className={`px-[22px] py-5 ${last ? "" : "border-r border-bd"}`}>
      <div className="text-[13px] text-mu mb-1.5">{label}</div>
      <div className={`font-mono text-[26px] font-semibold tracking-[-0.04em] leading-tight ${color}`}>{children}</div>
      {sub && <div className={`font-mono text-[12.5px] font-medium mt-0.5 ${color}`}>{sub}</div>}
    </div>
  );
}

const Unit = () => <span className="font-sans text-[13px] font-normal text-mu">PZC</span>;

export default function PortfolioPage() {
  const [positions, setPositions] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("open");

  useEffect(() => {
    getJSON("/api/v1/positions/me")
      .then((d) => setPositions(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message || "Failed to load positions"))
      .finally(() => setLoading(false));
    fetchMarkets().then((d) => setMarkets(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const marketsById = useMemo(() => Object.fromEntries(markets.map((m) => [m.id, m])), [markets]);
  // /positions/me returns every position; settled or sold-out ones have quantity 0.
  const open = useMemo(() => positions.filter(isOpenPosition), [positions]);
  const resolved = useMemo(() => positions.filter((p) => !isOpenPosition(p)), [positions]);
  const t = totals(open);
  const realized = realizedTotal(positions);
  const totalPl = t.pl + realized;
  const plColor = totalPl > 0 ? "text-yes" : totalPl < 0 ? "text-no" : "";
  const empty = !loading && positions.length === 0;

  return (
    <Page className="flex flex-col gap-5">
      <PageHeader title="Portfolio" subtitle="Track your active positions across markets" />

      <div className={`${card} overflow-hidden grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`}>
        <Cell label="Open positions">{open.length}</Cell>
        <Cell label="Invested">{fmt(t.invested)} <Unit /></Cell>
        <Cell label="Current value">{fmt(t.value)} <Unit /></Cell>
        <Cell label="Total P/L" color={plColor} sub={`Open ${signedPct(t.plPct, 2)} · Realized ${signed(realized)}`} last>{signed(totalPl)}</Cell>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <section className={`${card} overflow-hidden`}>
        {loading ? (
          <Spinner />
        ) : empty ? (
          <div className="py-16 px-6 text-center">
            <div className="text-[17px] font-[620] mb-1.5">No Positions Yet</div>
            <p className="mx-auto mb-5 max-w-[420px] text-[14px] leading-[1.6] text-mu">
              You haven't made any trades yet. Start trading on markets to build your portfolio.
            </p>
            <Link to="/markets" className="inline-flex items-center h-[42px] px-[18px] rounded-[10px] bg-am hover:brightness-105 text-[#1d1300] text-[14px] font-[650]">
              Browse Markets
            </Link>
          </div>
        ) : (
          <>
            <Tabs
              height={50}
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "open", label: "Open", count: open.length },
                { value: "resolved", label: "Closed", count: resolved.length },
              ]}
            />
            {tab === "open" ? (
              open.length ? (
                <div className="-mt-px"><PositionsTable positions={open} marketsById={marketsById} stackedPl /></div>
              ) : (
                <div className="py-12 text-center text-[14px] text-mu">No open positions.</div>
              )
            ) : resolved.length ? (
              <div className="overflow-x-auto -mt-px">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Market</th>
                      <th className={thCls}>Your pick</th>
                      <th className={`${thCls} !text-right`}>Realized P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map((p) => {
                      const r = Number(p.realizedPnlCents) || 0;
                      return (
                        <tr key={`${p.marketId}-${p.outcomeId}`} className="hover:bg-sf2 transition-colors">
                          <td className={`${tdCls} font-[550]`}>
                            <Link to={`/markets/${p.marketId}`} className="hover:text-pr">{p.marketTitle}</Link>
                          </td>
                          <td className={`${tdCls} text-tx2`}>{p.outcomeName}</td>
                          <td className={`${tdCls} text-right font-mono ${r > 0 ? "text-yes" : r < 0 ? "text-no" : ""}`}>
                            {signed(r)} <Unit />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[14px] text-mu">No closed positions yet.</div>
            )}
          </>
        )}
      </section>
    </Page>
  );
}
