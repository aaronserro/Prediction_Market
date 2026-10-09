// ───────────────────────────────────────────────────────────────────────
// FIXTURE DATA — blog. There is no blog endpoint yet; this is the proposed
// response shape for GET /api/v1/blog/posts (list) and
// GET /api/v1/blog/posts/{slug} (single post, same object):
//
//   { slug, title, excerpt, category, author: { name, role },
//     publishedAt, readMinutes, featured,
//     cover: { tone: "violet" | "amber" | "green" | "ink", kicker, stat },
//     body: Block[] }
//
//   Block = { type: "p" | "h2" | "quote", text }
//         | { type: "list", items: string[] }
//         | { type: "market", marketId }   // renders a live market card
// ───────────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 19);

const RESEARCH = { name: "Pryzm Research", role: "Research" };
const TEAM = { name: "Pryzm Team", role: "Product" };
const DESK = { name: "Markets Desk", role: "Markets" };

export const FIXTURE_POSTS = [
  {
    slug: "midterms-three-weeks-out",
    title: "Midterms 2026: what the market is saying three weeks out",
    excerpt: "The House leans Democratic, the Senate leans Republican, and a split Congress is now the single most likely outcome. Here's how traders got there.",
    category: "Markets",
    author: DESK,
    publishedAt: daysAgo(1),
    readMinutes: 6,
    featured: true,
    cover: { tone: "violet", kicker: "US Midterms", stat: "63%" },
    body: [
      { type: "p", text: "With three weeks to go before November 3, the two biggest markets on Pryzm are pointing in opposite directions. Traders give Democrats a 63% chance of winning the House and Republicans a 68% chance of holding the Senate. Put together, a divided Congress is the most likely result." },
      { type: "market", marketId: "us-house-2026" },
      { type: "h2", text: "Why the House moved" },
      { type: "p", text: "The House market spent most of the summer within a few points of a coin flip. It started to separate in September as the generic congressional ballot settled into a steady Democratic lead and a wave of Republican retirements opened up competitive seats." },
      { type: "p", text: "Volume tells the same story. More PZC has traded on this market in the past two weeks than in the three months before it, and most of that flow has been buying Democratic shares on dips." },
      { type: "h2", text: "Why the Senate didn't" },
      { type: "p", text: "The Senate map is a different animal. Only a third of seats are up, and the ones that are lean heavily toward Republicans. To flip control, Democrats would need to win races in states where they lost by wide margins last cycle." },
      { type: "market", marketId: "us-senate-2026" },
      { type: "quote", text: "The market isn't saying Republicans are more popular. It's saying the Senate map is a much harder hill for Democrats to climb." },
      { type: "h2", text: "What to watch" },
      { type: "list", items: [
        "Early-vote turnout reports, which tend to move both markets in the final two weeks.",
        "Late polling in the four or five Senate races priced between 35% and 65%.",
        "Any shift in the generic ballot of more than two points.",
      ] },
      { type: "p", text: "As always, these are probabilities, not predictions. A 63% favourite loses more than a third of the time." },
    ],
  },
  {
    slug: "how-pryzm-prices-a-share",
    title: "How Pryzm prices a share",
    excerpt: "Every price on Pryzm is a probability. A share that costs 64 PZC pays 100 PZC if it's right. Here's the machinery that keeps those prices honest.",
    category: "Guides",
    author: TEAM,
    publishedAt: daysAgo(4),
    readMinutes: 5,
    featured: false,
    cover: { tone: "amber", kicker: "Guide", stat: "100 PZC" },
    body: [
      { type: "p", text: "Every outcome on Pryzm trades between 1 and 99 PZC. If the outcome happens, each share pays out 100 PZC. If it doesn't, it pays nothing. That makes the price easy to read: a share trading at 64 means the market thinks there's roughly a 64% chance it happens." },
      { type: "h2", text: "Who's on the other side?" },
      { type: "p", text: "On a traditional exchange you need another person willing to take the opposite side of your trade. Pryzm uses an automated market maker instead, so you can always buy or sell immediately, even in a quiet market." },
      { type: "p", text: "The market maker follows a simple rule: the more shares of an outcome people buy, the more the next share costs. Buying Yes pushes the Yes price up and the No price down, and the prices across all outcomes always add up to about 100." },
      { type: "h2", text: "Why your total cost is a little higher than the price" },
      { type: "p", text: "Because each share you buy nudges the price, a large order costs slightly more per share than the price you see before trading. The confirm screen shows the exact total before you commit, so there are no surprises." },
      { type: "list", items: [
        "The price you see is the cost of the next share.",
        "Bigger orders move the price more.",
        "Selling works the same way in reverse.",
      ] },
      { type: "market", marketId: "boc-december-cut" },
      { type: "p", text: "That's it. No order books, no spreads to calculate, just a price that reflects what everyone trading the market believes." },
    ],
  },
  {
    slug: "introducing-ranks",
    title: "Introducing ranks: from Bronze 3 to Gold 1",
    excerpt: "Your rank now reflects how accurate your predictions are, not just how much you trade. Here's how it works and how to climb.",
    category: "Product",
    author: TEAM,
    publishedAt: daysAgo(8),
    readMinutes: 3,
    featured: false,
    cover: { tone: "ink", kicker: "New", stat: "9 ranks" },
    body: [
      { type: "p", text: "Starting today, every Pryzm account has a rank. There are nine of them, from Bronze 3 at the bottom to Gold 1 at the top, and you'll find yours on your dashboard." },
      { type: "h2", text: "How you earn XP" },
      { type: "p", text: "Ranks are based on XP, and you earn XP when markets you've traded resolve. Being right earns more than being active, and being right early, when the price was against you, earns the most." },
      { type: "list", items: [
        "Bronze 3 to Bronze 1: your first resolved markets.",
        "Silver 3 to Silver 1: consistent, calibrated calls across categories.",
        "Gold 3 to Gold 1: a sustained track record at the top of the leaderboard.",
      ] },
      { type: "quote", text: "We wanted a rank you can only earn by being right, not by being busy." },
      { type: "p", text: "Ranks never go down from a single bad call, but they do reward consistency. Tournaments and a public leaderboard are coming next." },
    ],
  },
  {
    slug: "bank-of-canada-december-explained",
    title: "The Bank of Canada market, explained",
    excerpt: "Traders now put a December rate cut at 64%. We walk through what has moved the price since September and what could move it next.",
    category: "Markets",
    author: DESK,
    publishedAt: daysAgo(12),
    readMinutes: 4,
    featured: false,
    cover: { tone: "green", kicker: "Interest rates", stat: "64%" },
    body: [
      { type: "p", text: "The December decision has become the most-traded finance market on Pryzm. A cut is now priced at 64%, up from the high 40s at the start of September." },
      { type: "market", marketId: "boc-december-cut" },
      { type: "h2", text: "What moved it" },
      { type: "p", text: "Two softer-than-expected inflation prints did most of the work. Each one moved the market by several points within an hour of release, and in both cases the move held." },
      { type: "p", text: "The other driver was the tone of the October statement, which dropped language about inflation risks being 'tilted to the upside'. Traders read that as an opening." },
      { type: "h2", text: "What could move it next" },
      { type: "list", items: [
        "The November CPI release, which has its own market on Pryzm.",
        "The next Labour Force Survey. A strong jobs number is the main risk to a cut.",
        "Any shift in the US Federal Reserve's December decision.",
      ] },
      { type: "market", marketId: "cpi-november" },
    ],
  },
  {
    slug: "five-mistakes-new-traders-make",
    title: "Five mistakes new traders make (and how to avoid them)",
    excerpt: "Buying long shots because they're cheap, ignoring how a market resolves, and three more habits that quietly drain a portfolio.",
    category: "Guides",
    author: RESEARCH,
    publishedAt: daysAgo(18),
    readMinutes: 5,
    featured: false,
    cover: { tone: "amber", kicker: "Guide", stat: "5" },
    body: [
      { type: "p", text: "Most new traders don't lose PZC because their opinions are wrong. They lose it because of a handful of habits that have nothing to do with being right." },
      { type: "h2", text: "1. Buying long shots because they're cheap" },
      { type: "p", text: "A 5 PZC share looks like a bargain, but it's priced that way because the market thinks it happens about one time in twenty. Cheap isn't the same as undervalued." },
      { type: "h2", text: "2. Not reading the resolution rules" },
      { type: "p", text: "Every market lists exactly how it resolves and which source it uses. 'Makes the playoffs' and 'makes the play-in' are not the same thing." },
      { type: "h2", text: "3. Putting everything on one market" },
      { type: "p", text: "Even a well-reasoned 70% call loses three times out of ten. Spreading positions across several markets smooths out the bad luck." },
      { type: "h2", text: "4. Never selling" },
      { type: "p", text: "You don't have to hold to resolution. If the price has moved to where you think it should be, selling locks in the gain." },
      { type: "h2", text: "5. Trading on headlines alone" },
      { type: "p", text: "By the time a story is everywhere, the price has usually already moved. The edge is in understanding what the headline actually changes." },
    ],
  },
  {
    slug: "calibration-is-the-scorecard",
    title: "Calibration: the only scorecard that matters",
    excerpt: "When a market says 70%, it should happen about 70% of the time. We look at why calibration, not hit rate, is how forecasts should be judged.",
    category: "Research",
    author: RESEARCH,
    publishedAt: daysAgo(27),
    readMinutes: 7,
    featured: false,
    cover: { tone: "violet", kicker: "Research", stat: "70%" },
    body: [
      { type: "p", text: "It's tempting to judge a forecaster by how often they're right. But a forecaster who only ever predicts sure things will be right a lot and tell you almost nothing." },
      { type: "h2", text: "What calibration means" },
      { type: "p", text: "A forecaster is well calibrated when the things they call 70% likely happen about 70% of the time, the things they call 30% happen about 30% of the time, and so on. It's a measure of honesty about uncertainty." },
      { type: "quote", text: "A 70% forecast that misses isn't a mistake. A long run of 70% forecasts that only hit half the time is." },
      { type: "h2", text: "Why markets tend to be well calibrated" },
      { type: "p", text: "In a market, anyone who spots a mispriced probability has a reason to trade on it, and their trade moves the price toward a better estimate. Over many markets, that pressure pushes prices toward calibration." },
      { type: "p", text: "That's the idea behind Pryzm's ranks. XP rewards being right in proportion to how surprising the outcome was, which is another way of rewarding calibration." },
      { type: "list", items: [
        "Judge forecasts in groups, not one at a time.",
        "A single upset tells you very little.",
        "The best traders are the ones whose 60s happen about 60% of the time.",
      ] },
    ],
  },
];
