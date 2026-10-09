// Single blog post. Data: fetchPost(slug) in lib/dataSource.js (fixtures/blog.js).
// "market" blocks render live market cards from the current data source.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorNote, MarketCard, Page, Spinner } from "../components/ui.jsx";
import BlogCard, { BlogCover, PostMeta } from "../components/BlogCard.jsx";
import SignupGate from "../components/SignupGate.jsx";
import { fetchPost, fetchPosts, fixtureSource } from "../lib/dataSource.js";
import { summarize } from "../lib/markets.js";
import { useAuth } from "../auth/AuthContext.jsx";

function EmbeddedMarket({ marketId, source, onTrade }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let alive = true;
    source.fetchMarket(marketId)
      .then(async (m) => {
        const [p, t] = await Promise.all([source.loadPrices(m), source.loadTrades(m.id)]);
        if (alive) setState({ m, s: summarize(m, p, t) });
      })
      .catch(() => alive && setState(false));
    return () => { alive = false; };
  }, [marketId, source]);
  if (!state) return null; // missing markets are skipped silently
  return <div className="my-7 not-prose"><MarketCard market={state.m} summary={state.s} onTrade={onTrade} /></div>;
}

function Block({ b, source, onTrade }) {
  switch (b.type) {
    case "h2": return <h2 className="mt-9 mb-3 text-[22px] font-[650] tracking-[-0.025em] leading-[1.3]">{b.text}</h2>;
    case "quote": return <blockquote className="my-7 pl-5 border-l-[3px] border-pr text-[19px] leading-[1.5] font-[550] tracking-[-0.01em] text-tx">{b.text}</blockquote>;
    case "list": return (
      <ul className="my-5 p-0 list-none flex flex-col gap-2.5">
        {b.items.map((it) => (
          <li key={it} className="flex gap-3 text-[16.5px] leading-[1.65] text-tx2">
            <span className="w-[5px] h-[5px] mt-[11px] bg-am rotate-45 flex-none" />{it}
          </li>
        ))}
      </ul>
    );
    case "market": return <EmbeddedMarket marketId={b.marketId} source={source} onTrade={onTrade} />;
    default: return <p className="my-5 text-[16.5px] leading-[1.75] text-tx2">{b.text}</p>;
  }
}

export default function BlogPost() {
  const { slug } = useParams();
  const { user } = useAuth();
  // Embedded markets come from fixtures until the blog API exists (its
  // marketId values will then point at real markets).
  const source = fixtureSource;
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [more, setMore] = useState([]);
  const [gate, setGate] = useState(null);

  useEffect(() => {
    setPost(null);
    setError("");
    window.scrollTo(0, 0);
    fetchPost(slug).then(setPost).catch((e) => setError(e.message));
    fetchPosts().then((all) => setMore(all.filter((p) => p.slug !== slug).slice(0, 3)));
  }, [slug]);

  // Signed-in readers go straight to the market; signed-out readers get the prompt.
  const onTrade = user ? undefined : (market, outcome, side) => setGate({ market, outcome, side });

  if (error) return <Page><Link to="/blog" className="inline-block text-[13px] text-mu hover:text-tx mb-5">← Blog</Link><ErrorNote>{error}</ErrorNote></Page>;
  if (!post) return <Page><Spinner /></Page>;

  return (
    <Page className="!pt-6">
      <article className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-2 text-[13px] text-mu mb-[18px]">
          <Link to="/blog" className="text-mu hover:text-tx">Blog</Link><span>/</span><span className="text-tx2">{post.category}</span>
        </div>
        <h1 className="m-0 mb-4 text-[clamp(30px,4.4vw,44px)] font-[650] tracking-[-0.04em] leading-[1.1]">{post.title}</h1>
        <p className="m-0 mb-5 text-[18px] leading-[1.6] text-tx2">{post.excerpt}</p>
        <div className="flex items-center gap-3 mb-7">
          <span className="w-9 h-9 rounded-full bg-prs text-prt flex items-center justify-center text-[14px] font-[650] flex-none">
            {post.author.name.charAt(0)}
          </span>
          <div>
            <div className="text-[14px] font-semibold">{post.author.name}</div>
            <PostMeta post={post} />
          </div>
        </div>
        <BlogCover post={post} big className="aspect-[16/8] rounded-[18px] mb-4" />
        {post.body.map((b, i) => <Block key={i} b={b} source={source} onTrade={onTrade} />)}

        <div className="mt-12 px-6 py-5 rounded-2xl bg-prs flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <div className="text-[15px] font-[620] text-prt">Think you know how this ends?</div>
            <div className="text-[13.5px] text-tx2 mt-0.5">Put your call on the record with free virtual PZC.</div>
          </div>
          <Link
            to={user ? "/markets" : "/signup"}
            className="ml-auto h-10 px-4 rounded-[10px] bg-pr hover:bg-prh text-white text-[14px] font-semibold flex items-center"
          >
            {user ? "Browse markets →" : "Sign up free →"}
          </Link>
        </div>
      </article>

      {more.length > 0 && (
        <section className="mt-16">
          <h2 className="m-0 mb-4 text-2xl font-[650] tracking-[-0.03em]">More from the blog</h2>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
            {more.map((p) => <BlogCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}
      <SignupGate intent={gate} onClose={() => setGate(null)} />
    </Page>
  );
}
