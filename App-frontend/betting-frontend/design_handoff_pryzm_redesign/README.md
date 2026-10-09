# Handoff: Pryzm web redesign

## Overview
A full visual redesign of the Pryzm web frontend (`App-frontend/betting-frontend`) covering Landing, Dashboard, Markets, Market detail, Portfolio, Wallet and News. Direction: Kalshi-like calm and trust with Polymarket-like density. Brand stays violet + amber. Light theme is the default, with a dark theme toggle. Currency is shown as virtual **PZC (Pryzm Coins)**.

## About the design files
The `.dc.html` files in this bundle are **design references built in HTML**. They are prototypes that show the intended look and behaviour, not production code. Recreate them in the existing React + Vite + Tailwind app in `App-frontend/betting-frontend/src`, using its routing (`react-router-dom`), `AuthContext`, and existing API calls. Each file opens directly in a browser. Mock data lives in the `class Component` script block at the bottom of each file.

## Fidelity
**High-fidelity.** Colours, type, spacing, radii and interactions are final. Match them closely using Tailwind (extend `tailwind.config.js` with the tokens below, or use CSS variables).

## Global
- **Fonts:** Geist (UI) + Geist Mono (all numbers, prices, balances, %). Google Fonts: `Geist:wght@100..900`, `Geist+Mono:wght@400..700`. This replaces DM Sans / DM Mono / Fraunces.
- **Theme:** CSS variables on a root `[data-theme="light"|"dark"]` element (see tokens). Persist the choice in `localStorage['pryzm-theme']`. Remove the old ambient glow orbs, grid overlays and gradient accent lines from `PageShell`.
- **Page container:** max-width 1240px, horizontal padding 24px, top padding 36px, bottom 72px.
- **Cards:** bg `--sf`, 1px `--bd` border, radius 16px (market cards 14px), shadow `--sh`. Hover: border becomes `--bd2`. No translate/scale hover.
- **Pricing model (assumption to confirm with backend):** a winning share pays **100 PZC**, so prices are integers 1–99 and match the % chance. Existing `price` values (0–1 or cents) map as `Math.round(p*100)`.
- **Coin glyph:** a circle filled with `--am` with an inset 2px rgba(0,0,0,.12) ring (14px in the nav, 30px on the wallet).

## Nav (`Nav.dc.html`, replaces `components/Navbar.jsx`)
Sticky, 60px tall, bg `--sf`, bottom border `--bd`. The inner row is flex with a 16px gap.
- Logo `pryzm-icon.svg` 28px plus "Pryzm" 17px/650, letter-spacing -0.02em.
- Search box: flex `1 1 0`, max 420px, min 38px, height 38px, radius 10px, bg `--sf2`. Below the label's width it collapses to the icon only (the label wraps out of sight).
- Links: Dashboard, Markets, Portfolio, News, Tournaments. 14px, padding 7px 8px, radius 8px. Active: `--tx`, weight 600, bg `--sf2`. Inactive: `--mu`, weight 500.
- Right side: theme toggle (36px square, half-filled circle icon), balance pill (coin + mono balance, links to Wallet), "Add funds" (primary, links to Wallet), avatar initial (30px circle, `--prs` / `--prt`).
- Logged out: "Log in" (ghost) + "Sign up" (primary).

## Screens

### Landing (`Landing.dc.html`, replaces `components/LandingPage.jsx`)
1. **Hero:** two columns (auto-fit, min 460px), gap 56px, padding 72px top.
   - Pill: "Prediction markets · Free to play with PZC" with a pulsing green dot.
   - H1 "Trade on what / you know." at clamp(44px, 6vw, 68px), weight 650, letter-spacing -0.045em. The second line is `--pr`.
   - Sub copy (existing), 18px, `--tx2`.
   - CTAs: "Start Trading Free →" (primary, 48px tall, radius 11px) and "Sign in to your account" (secondary).
   - Two small facts below, 13px `--mu`.
   - Right column: featured market card, radius 18px, with a large shadow. It shows the title, a 40px mono % in `--pr`, a 150px line chart with soft area fill, and Buy Yes / Buy No buttons (46px tall).
2. **Trending markets:** H2 24px, category chips (34px pills; active pill is inverted `--tx` / `--bg`), market card grid (auto-fill, min 340px, gap 14px).
3. **How it works:** a `--sf` band with three steps. Each step has a 2px top rule (the first is `--pr`), an amber mono number and existing copy.
4. **Ranks:** copy plus the nine rank SVGs, Bronze 3 → Gold 1, at increasing size.
5. **CTA band:** solid `--pr`, radius 22px, white text. Button is #fbbf24 with #1d1300 text, "Create Free Account →".
6. **Footer:** existing columns and copy.

### Market card (shared by Landing, Dashboard, Markets)
- 16px padding, flex column, gap 14px.
- Top: category (12px `--mu`) and title (15px/600, line-height 1.35).
- Binary: the % chance sits on the right (22px mono), with a two-up row of Yes / No buttons (38px, radius 9px, `--yess`/`--yes` and `--nos`/`--no`).
- Multi-outcome: up to three rows of name, mono %, and small Yes / No chips (26px).
- Footer: top border, live dot, "{vol} PZC vol", "Closes {date}". Upcoming markets get an amber dot and an "UPCOMING" tag.

### Dashboard (`Dashboard.dc.html`, replaces `dashboard/Dashboard.jsx`)
- **Header:** "Welcome back," + username (32px/650). Buttons "+ Add Funds" (amber `--am`, #1d1300 text) and "Trade →" (secondary, links to Markets).
- **Row (flex wrap):**
  - Portfolio card (flex 2 1 560px): value 38px mono, change for the selected range in `--yes`, range tabs 1D/1W/1M/ALL (segmented control), a 170px line chart, and a four-cell stat strip: Cash balance, In positions, Open P/L, Win rate.
  - Rank card (flex 1 1 300px): badge 72px, rank name 24px, subtext, an XP progress bar (8px, gradient `--pr` → `--am`), and a ladder of all nine badges. Past ranks are at 55% opacity; future ranks are greyscale at 28%. Data: `GET /api/ranks/{userId}` → `rankImages.js`.
- **Open positions table:** columns Market | Outcome pill | Shares | Avg | Now | Value | P/L (+%). Header row bg `--sf2`, 12px `--mu`. Rows 14px, hover `--sf2`. Outcome pill: Yes is green, No is red, a named outcome is violet. Data: `GET /api/v1/positions/me`.
- **Live markets:** chips and the card grid.

### Markets (`Markets.dc.html`, replaces `pages/Markets.jsx`)
- Header "Markets" + "Trade on the outcome of real-world events." on the left, a search input (42px, 340px max) on the right.
- Filter row with a bottom border: category chips (All, Sports, Politics, Finance, Entertainment, Technology, Other) and a sort control (Trending, Volume, Closing soon).
- Card grid, then the count text "N markets (filtered from M total)".
- Empty state: dashed border, "No markets match your filters.", "Clear filters" button.
- Same API as today: `/api/v1/markets` and `/api/v1/markets/category/{CAT}`; filter to ACTIVE or UPCOMING.

### Market detail (`Market.dc.html`, replaces `pages/MarketDetail.jsx`)
- Breadcrumb "Markets / {Category}".
- Header: H1 clamp(24px, 3vw, 30px); meta row with category pill, LIVE or CLOSED, volume, close date; Watch and Share buttons.
- **Left column (flex 2 1 620px):**
  - Chart card. Binary: % chance in `--pr` plus the weekly change. Multi: a legend of the top four outcomes. Range tabs; a 260px chart with dashed gridlines at 0/25/50/75/100% and labels on the right; x-axis ticks.
  - Outcomes table: colour square, name, volume, mono chance, and Buy {price} / Sell {price−1} buttons (40px). Clicking a row selects it (bg `--sf2`, inset 3px left bar `--pr`).
  - Tabs: Rules (description, a details grid with Closes / Created / Outcomes / Resolution source, and three rule bullets with amber diamonds), Comments (input + list with a "Holds X" pill), Activity (recent trades).
  - **No order book.** It isn't supported by the platform yet.
- **Right column (sticky, top 80px):**
  - Trade card: selected outcome, buy and sell price tiles, Buy (primary) and Sell (secondary) buttons, your position, payout per share, available balance. When closed, show an amber notice instead of the buttons.
  - Success toast after a trade.
  - Related markets list.
- **Confirm modal** (keeps the existing flow): overlay rgba(10,8,20,.55) with a 4px blur; card max 420px, radius 18px.
  - Title "Confirm Buy · {outcome}".
  - Share presets 10 / 50 / 100 (64px tiles; selected tile is `--prs` with a `--pr` border).
  - Summary: Action, Outcome, Price, Total cost or proceeds (amber), and Payout if correct (buy only).
  - Buttons Cancel / Confirm. Endpoints: existing `/api/v1/trades/buy` and `/api/v1/trades/sell`.

### Portfolio (`Portfolio.dc.html`, replaces `pages/PortfolioPage.jsx`)
- Header "Portfolio" + "Track your active positions across markets".
- One stat strip card with four cells: Positions, Invested, Current value, Total P/L (+%). P/L is coloured green or red.
- Tabs "Open N" / "Resolved N":
  - Open table: Market (+ category · close date) | Outcome pill | Shares | Avg | Now | Value | P/L.
  - Resolved table: Market (+ resolved date) | Your pick | Won/Lost pill | Shares | Payout | P/L.
- Empty state: "No Positions Yet" plus an amber "Browse Markets" button.

### Wallet (`Wallet.dc.html`, replaces `dashboard/Wallet.jsx`)
- Header "Wallet" + subtitle. Success banner after a request: green, "Request submitted.", Dismiss.
- **Row:**
  - Balance card: "Available balance" at 44px mono with the coin glyph, then breakdown rows (In open positions, Pending requests, Total account value) and a last-updated line.
  - Request funds card: amount input (50px, mono 20px), presets 100 / 500 / 1,000 / 5,000, reason select (existing options), "Submit Request" (amber, disabled until amount > 0), and a helper note.
- **Latest request stepper:** Submitted → Under review → Credited to wallet (or Rejected). Done steps are `--pr`; the current step has an amber ring; future steps are `--bd2`; rejected is `--no`.
- **Row:**
  - Transactions table: tabs All / Trades / Payouts / Funding; columns Date | Type | Details | Amount (+ in green) | Balance.
  - Request history list with status pills: PENDING is amber, APPROVED is green, REJECTED is red.
- Endpoints: existing `/api/v1/users/{id}/wallet` and `/wallet/fund-requests`. Transactions need a new endpoint (or derive them from trades and payouts).

### News (`News.dc.html`, replaces `pages/NewsPage.jsx`)
- Header "Market News" with chips Finance / Technology / Sports / Politics (maps to `/api/v1/news/{CATEGORY}`).
- Lead article: two-column card with the image (`urlToImage`) and source (amber), date, a 30px headline and the description.
- Grid of article cards (min 320px): 16:9 image, source/date, 16px title, three-line clamped description. Links open `article.url` in a new tab.

## Interactions & state
- Theme toggle on every page, persisted in localStorage.
- Category chips, sort and search filter on the client (Markets, Landing, Dashboard).
- Chart range tabs swap the dataset. The prototypes use generated mock series; real price history needs an endpoint.
- Market: selected outcome index, active tab, modal `{outcomeIndex, action}`, quantity (default 10), and a toast that clears after 4s.
- Wallet: amount, reason, and an optimistic new PENDING request prepended to the list.
- Transitions are minimal: colour and border changes only. The live dot pulses (`opacity` 1 → .35, 1.8s ease-in-out, infinite).

## Design tokens
| Token | Light | Dark |
|---|---|---|
| --bg | #f6f5f9 | #0b0a10 |
| --sf (surface) | #ffffff | #13121a |
| --sf2 (subtle) | #f1f0f5 | #1c1a25 |
| --bd | #e6e4ec | #26232f |
| --bd2 | #d4d1de | #36323f |
| --tx | #15121d | #f3f2f7 |
| --tx2 | #45414f | #c6c3d1 |
| --mu | #6f6b7d | #918da1 |
| --pr (violet) | #6d3ae6 | #8b5cf6 |
| --prh (hover) | #5b2bd0 | #a07cf8 |
| --prs (soft) | #efe9fd | #231b3b |
| --prt (text on soft) | #5b2bd0 | #bba6fb |
| --am (amber) | #f5a50b | #fbbf24 |
| --ams | #fdf3dc | #2a2112 |
| --amt | #8f5400 | #fbbf24 |
| --yes | #0f8a52 | #34c47e |
| --yess | #e3f4ea | #11281c |
| --no | #d43a47 | #f2646f |
| --nos | #fbe9ea | #2d1519 |
| --sh | 0 1px 2px rgba(20,16,40,.05) | none |

- **Type scale:** 11, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18, 20, 24, 28, 32, plus display sizes (38, 40, 44, 68). Headings use weight 620–650 and negative letter-spacing (-0.02em to -0.045em).
- **Radii:** 5–7 (pills, tags), 8–9 (small buttons), 10–11 (inputs, buttons), 12 (inner panels), 14 (market cards), 16 (cards), 18 (featured card, modal), 22 (CTA band), 999 (chips).
- **Spacing:** 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 36, 56, 72.
- **Control heights:** 26, 28, 32–34, 36, 38, 40, 42, 46, 48, 50.

## Assets
- `assets/pryzm-icon.svg`: the existing logo, unchanged (`public/pryzm-icon.svg`).
- `assets/ranks/*.svg`: the existing rank badges (`public/ranks/`).
- News images are striped placeholders; use `article.urlToImage`.

## Files
- Pages: `Landing.dc.html`, `Dashboard.dc.html`, `Markets.dc.html`, `Market.dc.html`, `Portfolio.dc.html`, `Wallet.dc.html`, `News.dc.html`
- Shared: `Nav.dc.html`
- `support.js` is the prototype runtime only and isn't needed in the app.
