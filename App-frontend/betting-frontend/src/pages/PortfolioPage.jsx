import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorNote, Page, PageHeader, Spinner, Tabs, card } from "../components/ui.jsx";
import PositionsTable from "../components/PositionsTable.jsx";
import { totals } from "../lib/positions.js";
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
  // /positions/me only returns positions in ACTIVE markets; settled ones are
  // filtered server-side, so the Resolved tab stays empty until an endpoint exists.
  const resolved = [];
  const t = totals(positions);
  const plColor = t.pl > 0 ? "text-yes" : t.pl < 0 ? "text-no" : "";
  const empty = !loading && positions.length === 0 && resolved.length === 0;

  return (
    <Page className="flex flex-col gap-5">
      <PageHeader title="Portfolio" subtitle="Track your active positions across markets" />

      <div className={`${card} overflow-hidden grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`}>
        <Cell label="Positions">{positions.length}</Cell>
        <Cell label="Invested">{fmt(t.invested)} <Unit /></Cell>
        <Cell label="Current value">{fmt(t.value)} <Unit /></Cell>
        <Cell label="Total P/L" color={plColor} sub={signedPct(t.plPct, 2)} last>{signed(t.pl)}</Cell>
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
                { value: "open", label: "Open", count: positions.length },
                { value: "resolved", label: "Resolved", count: resolved.length },
              ]}
            />
            {tab === "open" ? (
              positions.length ? (
                <div className="-mt-px"><PositionsTable positions={positions} marketsById={marketsById} stackedPl /></div>
              ) : (
                <div className="py-12 text-center text-[14px] text-mu">No open positions.</div>
              )
            ) : (
              <div className="py-12 text-center text-[14px] text-mu">No resolved positions yet.</div>
            )}
          </>
        )}
      </section>
    </Page>
  );
}
