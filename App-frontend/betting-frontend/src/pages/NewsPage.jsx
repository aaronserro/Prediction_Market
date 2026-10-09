import { useEffect, useState } from "react";
import { Chips, ErrorNote, Page, Spinner } from "../components/ui.jsx";
import { API_BASE } from "../lib/markets.js";
import { catLabel, fmtDate } from "../lib/format.js";

const CATEGORIES = ["FINANCE", "TECHNOLOGY", "SPORTS", "POLITICS"];
const CHIPS = CATEGORIES.map((c) => ({ value: c, label: catLabel(c) }));
const PLACEHOLDER = "repeating-linear-gradient(135deg, var(--sf2) 0 10px, var(--bg) 10px 20px)";

function ArticleImage({ article, className }) {
  const [failed, setFailed] = useState(false);
  if (!article.urlToImage || failed) {
    return <div className={className} style={{ background: PLACEHOLDER }} />;
  }
  return (
    <img
      src={article.urlToImage}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover w-full`}
    />
  );
}

function Meta({ article, size = "text-xs" }) {
  return (
    <div className={`flex justify-between gap-3 ${size}`}>
      <span className="font-semibold text-amt truncate">{article.source?.name}</span>
      <span className="text-mu flex-none">{fmtDate(article.publishedAt)}</span>
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("FINANCE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/v1/news/${category}`)
      .then((res) => {
        if (!res.ok) throw new Error(`News request failed (${res.status})`);
        return res.json();
      })
      .then((data) => alive && setArticles(data?.articles || []))
      .catch((e) => { if (alive) { setError(e?.message || "Unable to load news right now."); setArticles([]); } })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [category]);

  const [lead, ...rest] = articles;

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h1 className="m-0 text-[32px] font-[650] tracking-[-0.035em] leading-tight">Market News</h1>
        <Chips options={CHIPS} value={category} onChange={setCategory} wrap />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote>
          <p className="font-semibold">Could not load news</p>
          <p className="mt-1">{error}</p>
        </ErrorNote>
      ) : !lead ? (
        <div className="py-16 px-6 text-center border border-dashed border-bd2 rounded-2xl text-mu text-[14.5px]">
          No articles in this category right now.
        </div>
      ) : (
        <>
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] bg-sf border border-bd hover:border-bd2 rounded-[18px] shadow-sh overflow-hidden text-tx mb-5 transition-colors"
          >
            <ArticleImage article={lead} className="min-h-[280px] h-full" />
            <div className="p-[clamp(22px,3vw,36px)] flex flex-col justify-center gap-3">
              <Meta article={lead} size="text-[12.5px]" />
              <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] font-[650] tracking-[-0.03em] leading-[1.2]">{lead.title}</h2>
              {lead.description && <p className="m-0 text-[15px] leading-[1.6] text-tx2">{lead.description}</p>}
            </div>
          </a>

          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
            {rest.map((a) => (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col bg-sf border border-bd hover:border-bd2 rounded-[14px] shadow-sh overflow-hidden text-tx transition-colors"
              >
                <ArticleImage article={a} className="aspect-video" />
                <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2">
                  <Meta article={a} />
                  <h3 className="m-0 text-[16px] font-semibold tracking-[-0.015em] leading-[1.35]">{a.title}</h3>
                  {a.description && <p className="m-0 text-[13.5px] leading-[1.55] text-tx2 line-clamp-3">{a.description}</p>}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
