# Fixture data map

Signed-out visitors can browse Pryzm like a signed-in user: the home page, every market, market detail (chart, activity, comments) and the blog. Until the backend serves this publicly, all of it comes from fixtures.

**Rule:** signed-in pages call the real API. Signed-out pages (and the blog, for everyone) read fixtures. The switch lives in one place, `useDataSource()` in `src/lib/dataSource.js`.

## Files

| File | What's in it | Response shape it mimics |
|---|---|---|
| `src/fixtures/markets.js` → `FIXTURE_MARKETS` | 29 markets across all six categories | `GET /api/v1/markets` (`MarketResponse[]`) |
| `src/fixtures/markets.js` → `FIXTURE_PRICES` | Current price per outcome (cents = PZC = % chance) | `GET /api/v1/markets/{id}/outcomes/{outcomeId}/price` |
| `src/fixtures/markets.js` → `FIXTURE_TRADES` | Generated trade history per market (drives volume, charts, "Biggest movers" and Activity) | `GET /api/v1/trades/{marketId}` (`TradeResponse[]`) |
| `src/fixtures/markets.js` → `FIXTURE_MARKET_META` | Topic tags and featured-carousel order | **No endpoint yet.** Suggest adding `tags: string[]` and `featuredRank: number \| null` to `MarketResponse` |
| `src/fixtures/comments.js` → `FIXTURE_COMMENTS` | Comments on 13 markets | **No endpoint yet.** Proposed `GET /api/v1/markets/{id}/comments`, shape documented at the top of the file |
| `src/fixtures/blog.js` → `FIXTURE_POSTS` | 6 blog posts with block-based bodies | **No endpoint yet.** Proposed `GET /api/v1/blog/posts` and `GET /api/v1/blog/posts/{slug}`, shape documented at the top of the file |

All fixture dates are relative to the current time, so the data never looks stale.

## Where each piece is displayed

| Screen | Route | Fixture data used | Code |
|---|---|---|---|
| Home: category strip + topic tags | `/` (signed out) | markets, meta.tags | `src/components/LandingPage.jsx`, top of `LandingPage()` |
| Home: featured carousel | `/` | markets, prices, trades, meta.featured | `Featured` in `LandingPage.jsx` |
| Home: Biggest movers (24h) | `/` | markets, prices, trades | `Sidebar` + `movers` memo in `LandingPage.jsx` |
| Home: Hot topics | `/` | meta.tags, trades (volume) | `Sidebar` + `topics` memo in `LandingPage.jsx` |
| Home: All markets grid | `/` | markets, prices, trades | `list` memo in `LandingPage.jsx` → `MarketCard` |
| Home: From the blog | `/` | posts | `LandingPage.jsx` → `BlogCard` |
| Markets list | `/markets` (signed out) | markets, prices, trades | `src/pages/Markets.jsx` |
| Market detail: chart, outcomes, Activity tab | `/markets/:id` (signed out) | markets, prices, trades | `src/pages/MarketDetail.jsx` |
| Market detail: Comments tab | `/markets/:id` (signed out) | comments | `MarketDetail.jsx`, `tab === "comments"` |
| Market detail: Related markets | `/markets/:id` (signed out) | markets, prices | `MarketDetail.jsx`, `related` memo |
| Blog index | `/blog` (everyone) | posts | `src/pages/BlogPage.jsx` |
| Blog post (+ embedded market cards) | `/blog/:slug` (everyone) | posts, markets, prices, trades | `src/pages/BlogPost.jsx` |

Signed-in users who open a fixture-only market (for example from a blog post) see it as a read-only "sample market". That fallback is in the load effect of `MarketDetail.jsx`.

## Connecting the backend

1. **Public market reads.** `GET /api/v1/markets/**` is already `permitAll` in `SecurityConfig`. Trades (`GET /api/v1/trades/{marketId}`) are not, so either open that GET to anonymous users or add a public summary endpoint with volume and recent history.
2. **Swap the functions.** In `src/lib/dataSource.js`, each `fixtureSource` function has a `// BACKEND:` comment naming the endpoint to call. Replace the body with the API call (the `apiSource` versions show how). Once every function is swapped, `useDataSource()` can return `apiSource` for everyone.
3. **New endpoints.** Comments, blog posts and market tags need new endpoints. Match the shapes at the top of `comments.js` and `blog.js` and nothing in the UI changes.
4. **Delete `src/fixtures/`** once nothing imports it.

Trading itself never touches fixtures. Signed-out Buy/Sell, Watch and comment actions open the sign-up prompt (`src/components/SignupGate.jsx`).
