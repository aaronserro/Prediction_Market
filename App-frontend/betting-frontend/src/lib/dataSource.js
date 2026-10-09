// Where page data comes from.
//
//   apiSource      real backend, used when a user is signed in.
//   fixtureSource  src/fixtures/*, used for signed-out browsing and the blog.
//
// Both expose the same async functions, so pages never care which one they
// have. To move a fixture onto the backend, replace the body of the matching
// fixtureSource function with the API call noted beside it (see FIXTURES.md).
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchMarkets, getJSON, loadPrices, loadTrades } from "./markets.js";
import { FIXTURE_MARKETS, FIXTURE_MARKET_META, FIXTURE_PRICES, FIXTURE_TRADES } from "../fixtures/markets.js";
import { FIXTURE_COMMENTS } from "../fixtures/comments.js";
import { FIXTURE_POSTS } from "../fixtures/blog.js";

// Small delay so loading states behave the same as the real network.
const later = (value, ms = 120) => new Promise((r) => setTimeout(() => r(structuredClone(value)), ms));

export const apiSource = {
  name: "api",
  fetchMarkets,
  fetchMarket: (id) => getJSON(`/api/v1/markets/${id}`),
  loadPrices,
  loadTrades,
  loadComments: async () => null, // no comments endpoint yet
  marketMeta: () => ({ tags: [], featured: null }),
};

export const fixtureSource = {
  name: "fixtures",
  // BACKEND: GET /api/v1/markets  or  /api/v1/markets/category/{CATEGORY}
  fetchMarkets: (category) =>
    later(category && category !== "ALL" ? FIXTURE_MARKETS.filter((m) => m.category === category) : FIXTURE_MARKETS),
  // BACKEND: GET /api/v1/markets/{id}
  fetchMarket: (id) => {
    const m = FIXTURE_MARKETS.find((x) => x.id === id);
    return m ? later(m) : Promise.reject(new Error("Market not found"));
  },
  // BACKEND: GET /api/v1/markets/{id}/outcomes/{outcomeId}/price, per outcome
  loadPrices: (market) => later(FIXTURE_PRICES[market.id] || {}, 60),
  // BACKEND: GET /api/v1/trades/{marketId}
  loadTrades: (marketId) => later(FIXTURE_TRADES[marketId] || [], 60),
  // BACKEND: GET /api/v1/markets/{id}/comments (endpoint doesn't exist yet)
  loadComments: (marketId) => later(FIXTURE_COMMENTS[marketId] || []),
  // BACKEND: no field yet; topic tags + hero carousel order
  marketMeta: (marketId) => FIXTURE_MARKET_META[marketId] || { tags: [], featured: null },
};

/** Signed in → real API. Signed out → fixtures. */
export function useDataSource() {
  const { user } = useAuth();
  return user ? apiSource : fixtureSource;
}

/* ── blog (fixtures for everyone until a blog endpoint exists) ── */
// BACKEND: GET /api/v1/blog/posts
export const fetchPosts = () => later(FIXTURE_POSTS);
// BACKEND: GET /api/v1/blog/posts/{slug}
export const fetchPost = (slug) => {
  const p = FIXTURE_POSTS.find((x) => x.slug === slug);
  return p ? later(p) : Promise.reject(new Error("Post not found"));
};
