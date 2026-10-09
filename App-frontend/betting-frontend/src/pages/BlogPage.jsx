// Blog index. Data: fetchPosts() in lib/dataSource.js (fixtures/blog.js).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chips, Page, PageHeader, Spinner } from "../components/ui.jsx";
import BlogCard, { BlogCover, PostMeta } from "../components/BlogCard.jsx";
import { fetchPosts } from "../lib/dataSource.js";

export default function BlogPage() {
  const [posts, setPosts] = useState(null);
  const [cat, setCat] = useState("All");

  useEffect(() => { fetchPosts().then(setPosts).catch(() => setPosts([])); }, []);

  const cats = useMemo(() => ["All", ...new Set((posts || []).map((p) => p.category))], [posts]);
  const list = (posts || []).filter((p) => cat === "All" || p.category === cat);
  const lead = cat === "All" ? list.find((p) => p.featured) || list[0] : list[0];
  const rest = list.filter((p) => p !== lead);

  return (
    <Page>
      <div className="mb-6">
        <PageHeader title="Blog" subtitle="Market analysis, guides and product news from the Pryzm team.">
          <Chips options={cats} value={cat} onChange={setCat} wrap />
        </PageHeader>
      </div>

      {!posts ? (
        <Spinner />
      ) : !lead ? (
        <div className="py-16 text-center border border-dashed border-bd2 rounded-2xl text-mu text-[14.5px]">No posts yet.</div>
      ) : (
        <>
          <Link
            to={`/blog/${lead.slug}`}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] bg-sf border border-bd hover:border-bd2 rounded-[18px] shadow-sh overflow-hidden text-tx mb-5 transition-colors"
          >
            <BlogCover post={lead} big className="min-h-[300px] h-full" />
            <div className="p-[clamp(22px,3vw,36px)] flex flex-col justify-center gap-3">
              <PostMeta post={lead} />
              <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] font-[650] tracking-[-0.03em] leading-[1.2]">{lead.title}</h2>
              <p className="m-0 text-[15px] leading-[1.6] text-tx2">{lead.excerpt}</p>
              <span className="text-[13.5px] text-mu">{lead.author.name}</span>
            </div>
          </Link>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
            {rest.map((p) => <BlogCard key={p.slug} post={p} />)}
          </div>
        </>
      )}
    </Page>
  );
}
