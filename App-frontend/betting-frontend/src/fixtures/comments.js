// ───────────────────────────────────────────────────────────────────────
// FIXTURE DATA — market comments. There is no comments endpoint yet; this
// is the proposed response shape for GET /api/v1/markets/{id}/comments:
//
//   { id, marketId, user, holding: { outcome, shares } | null,
//     text, createdAt, likes }
// ───────────────────────────────────────────────────────────────────────

const H = 36e5;
const ago = (hours) => new Date(Date.now() - hours * H).toISOString().slice(0, 19);

const RAW = {
  "us-house-2026": [
    ["dk_research", "Democratic", 1200, 2, "Generic ballot has been D+3 to D+4 for six weeks straight. Historical midterm penalty for the president's party does the rest.", 41],
    ["bayst_bets", "Republican", 400, 5, "Redistricting in a handful of states is worth 4–6 seats on its own. 37 is too cheap for Republicans in my view.", 18],
    ["margaux.t", "Democratic", 250, 9, "Retirements list is lopsided this cycle. Open seats are where these things get decided.", 12],
    ["probably_42", null, 0, 20, "Watching turnout models more than polls at this point. Early vote numbers next week will move this a lot.", 7],
  ],
  "us-senate-2026": [
    ["dk_research", "Republican", 800, 3, "The map is brutal for Democrats. They need to flip two seats in states that went red by double digits last time.", 22],
    ["j.chen", "Democratic", 300, 11, "Candidate quality matters more in Senate races than House. A couple of these races are closer than the topline suggests.", 9],
  ],
  "canada-largest-party": [
    ["ottawa_insider", "Liberal", 900, 4, "Seat efficiency is the whole story. Liberals can lose the popular vote by 2 points and still win more seats.", 33],
    ["mapleleaf_quant", "Conservative", 1500, 6, "Long-dated market, but at 44 the Conservatives are underpriced given how the last two by-elections went.", 27],
    ["halifax_hal", "Liberal", 120, 26, "Atlantic Canada alone is a 20-seat swing. Nobody models it properly.", 8],
    ["kmac", null, 0, 50, "Remember this doesn't resolve until the next general election. Lots of time for this to drift.", 4],
  ],
  "boc-december-cut": [
    ["mapleleaf_quant", "Yes", 1200, 2, "Core inflation has come in under target two months running. The statement language last meeting was already softer.", 38],
    ["northbay", "No", 600, 3, "Labour market is still too tight. I think they hold in December and move in January.", 21],
    ["fx_watcher", "Yes", 300, 5, "Loonie weakness is the wildcard here, but the OIS curve is pricing a cut.", 15],
    ["priya.k", "Yes", 450, 24, "Bought more at 58. Comfortable holding through the decision.", 11],
  ],
  "fed-december": [
    ["yyz_macro", "25 bp cut", 2000, 1, "Dot plot plus the last two Fed speeches basically pre-announced this. 58 feels low.", 29],
    ["quietbull", "No change", 700, 7, "One hot jobs print and this flips. I'll take the other side at 34.", 14],
  ],
  "btc-150k-2026": [
    ["coldbrew", "No", 900, 2, "Needs roughly a 40% move in under three months. Possible, not 23% possible.", 19],
    ["sundial", "Yes", 3000, 8, "ETF inflows have been accelerating every week since September. Year-end rallies are a pattern for a reason.", 24],
    ["odd_lot", "No", 150, 30, "Selling every time this pops above 25.", 6],
  ],
  "stanley-cup-2027": [
    ["oilersfaithful", "Edmonton", 2500, 1, "Healthy roster and the best player in the world. 17% is a gift.", 44],
    ["the_6ix_edge", "Toronto", 800, 6, "Every year I tell myself not to. Every year I buy Toronto.", 52],
    ["snowbird", "Florida", 600, 12, "Depth wins in the spring. Nobody has more of it.", 16],
  ],
  "grey-cup-2026": [
    ["riverdale", "Saskatchewan", 400, 3, "Home-field advantage in the West final could be decisive. Riders are the value pick.", 10],
    ["stmarys", "Montreal", 700, 9, "Best record in the East and the defence is peaking at the right time.", 13],
  ],
  "raptors-playoffs": [
    ["tdot_trader", "Yes", 500, 4, "Play-in counts as No, which is why this is so low. If they finish 6th they're in.", 17],
    ["vert", "No", 250, 14, "Too young. Next year.", 5],
  ],
  "apple-foldable": [
    ["j.chen", "Yes", 600, 5, "Supply-chain reports have been consistent on a fall 2027 window. The question is announce vs ship.", 20],
    ["grit", "No", 300, 18, "Apple has been 'one year away' from this for four years.", 26],
  ],
  "gpt6-before-july": [
    ["sable", "No", 1100, 3, "Naming is the trap here. They'll ship something big, but will they call it GPT-6?", 31],
    ["nordic_line", "Yes", 400, 15, "Release cadence points to H1. I'm long at 36.", 9],
  ],
  "drake-album-2026": [
    ["lakeshore", "No", 350, 6, "Running out of runway. Studio album means studio album, not a mixtape or a deluxe.", 14],
  ],
  "hottest-year-2026": [
    ["pacific_rim", "Yes", 500, 10, "Year-to-date anomaly is already ahead of the previous record pace.", 12],
  ],
};

/** Keyed by market id. Markets without an entry show the empty state. */
export const FIXTURE_COMMENTS = Object.fromEntries(
  Object.entries(RAW).map(([marketId, rows]) => [
    marketId,
    rows.map(([user, outcome, shares, hours, text, likes], i) => ({
      id: `${marketId}-c${i}`,
      marketId,
      user,
      holding: outcome ? { outcome, shares } : null,
      text,
      createdAt: ago(hours),
      likes,
    })),
  ])
);
