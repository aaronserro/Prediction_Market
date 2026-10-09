import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Chips, ErrorNote, MarketCard, MarketGrid, Page, PageHeader, Segmented, Spinner } from "../components/ui.jsx";
import { CATEGORIES, fetchMarkets, isOpenListing, summarize, useMarketData, volumeOf } from "../lib/markets.js";
import { catLabel } from "../lib/format.js";

const CHIPS = [{ value: "ALL", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: catLabel(c) }))];
const SORTS = ["Trending", "Volume", "Closing soon"];

export default function Markets() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("Trending");

  const setSearch = (q) => setParams(q ? { q } : {}, { replace: true });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchMarkets(category)
      .then((data) => alive && setMarkets(Array.isArray(data) ? data : []))
      .catch((e) => { if (alive) { setError(e.message); setMarkets([]); } })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [category]);

  const open = useMemo(() => markets.filter(isOpenListing), [markets]);
  const { prices, trades } = useMarketData(open, { trades: true });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = open.filter((m) => !q || m.title.toLowerCase().includes(q));
    const key = {
      Trending: (m) => -(trades[m.id]?.length || 0),
      Volume: (m) => -(volumeOf(trades[m.id]) || 0),
      "Closing soon": (m) => new Date(m.endDate).getTime() || Infinity,
    }[sort];
    return [...list].sort((a, b) => key(a) - key(b));
  }, [open, search, sort, trades]);

  const clear = () => { setCategory("ALL"); setSearch(""); };

  return (
    <Page>
      <div className="mb-[22px]">
        <PageHeader title="Markets" subtitle="Trade on the outcome of real-world events.">
          <label className="flex items-center gap-2.5 h-[42px] w-[min(100%,340px)] px-3.5 rounded-[11px] bg-sf border border-bd2 text-mu">
            <span className="block w-3 h-3 rounded-full border-[1.6px] border-current flex-none" />
            <input
              placeholder="Search markets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 border-0 outline-none bg-transparent text-tx text-[14.5px] placeholder:text-mu"
            />
          </label>
        </PageHeader>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-[18px] mb-5 border-b border-bd">
        <Chips options={CHIPS} value={category} onChange={setCategory} />
        <Segmented options={SORTS} value={sort} onChange={setSort} />
      </div>

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed border-bd2 rounded-2xl text-mu text-[14.5px]">
          <div>{search || category !== "ALL" ? "No markets match your filters." : "No markets available."}</div>
          {(search || category !== "ALL") && (
            <button
              onClick={clear}
              className="mt-3.5 h-9 px-3.5 rounded-[9px] border border-bd2 bg-sf text-tx text-[13.5px] font-medium cursor-pointer hover:bg-sf2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <MarketGrid>
            {filtered.map((m) => <MarketCard key={m.id} market={m} summary={summarize(m, prices[m.id], trades[m.id])} />)}
          </MarketGrid>
          <p className="mt-7 text-center text-[13px] text-mu">
            {filtered.length} market{filtered.length !== 1 ? "s" : ""}
            {markets.length !== filtered.length && ` (filtered from ${markets.length} total)`}
          </p>
        </>
      )}
    </Page>
  );
}
