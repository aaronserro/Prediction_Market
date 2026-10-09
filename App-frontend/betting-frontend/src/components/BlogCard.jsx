import { Link } from "react-router-dom";
import { fmtDate } from "../lib/format.js";

const TONES = {
  violet: { bg: "var(--pr)", fg: "#fff" },
  amber: { bg: "#f5a50b", fg: "#1d1300" },
  green: { bg: "#0f8a52", fg: "#fff" },
  ink: { bg: "#15121d", fg: "#f3f2f7" },
};

/** Generated cover art: kicker, big mono stat, subtle chart lines. */
export function BlogCover({ post, className = "", big = false }) {
  const t = TONES[post.cover?.tone] || TONES.violet;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: t.bg, color: t.fg }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 225" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-[0.18]">
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1="0" x2="400" y1={45 + k * 45} y2={45 + k * 45} stroke="currentColor" strokeDasharray="3 5" strokeWidth="1" />
        ))}
        <path d="M0 170 L40 160 L80 166 L120 140 L160 146 L200 118 L240 124 L280 96 L320 102 L360 70 L400 62" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <div className={`relative h-full flex flex-col justify-between ${big ? "p-8" : "p-5"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] opacity-90">{post.cover?.kicker || post.category}</span>
          <img src="/pryzm-icon.svg" alt="" className={`${big ? "w-7 h-7" : "w-5 h-5"} opacity-90`} />
        </div>
        <span className={`font-mono font-semibold tracking-[-0.05em] leading-none ${big ? "text-[64px]" : "text-[44px]"}`}>{post.cover?.stat}</span>
      </div>
    </div>
  );
}

export function PostMeta({ post, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-mu ${className}`}>
      <span className="font-semibold text-amt">{post.category}</span>
      <span>·</span>
      <span>{fmtDate(post.publishedAt)}</span>
      <span>·</span>
      <span>{post.readMinutes} min read</span>
    </div>
  );
}

export default function BlogCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex flex-col bg-sf border border-bd hover:border-bd2 rounded-[14px] shadow-sh overflow-hidden text-tx transition-colors"
    >
      <BlogCover post={post} className="aspect-video" />
      <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2">
        <PostMeta post={post} />
        <h3 className="m-0 text-[16px] font-semibold tracking-[-0.015em] leading-[1.35]">{post.title}</h3>
        <p className="m-0 text-[13.5px] leading-[1.55] text-tx2 line-clamp-3">{post.excerpt}</p>
      </div>
    </Link>
  );
}
