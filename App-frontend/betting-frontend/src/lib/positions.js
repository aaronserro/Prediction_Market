// Values from GET /api/v1/positions/me are in cents, which equal PZC.
// The endpoint returns every position, including settled/sold-out ones with quantity 0.
export const isOpenPosition = (p) => (Number(p.quantity) || 0) > 0;

export const realizedTotal = (positions) =>
  positions.reduce((s, p) => s + (Number(p.realizedPnlCents) || 0), 0);

export function positionStats(p) {
  const qty = Number(p.quantity) || 0;
  const cost = Number(p.costBasisCents) || 0;
  const value = Number(p.marketValueCents) || qty * (Number(p.currentPriceCents) || 0);
  const pl = p.unrealizedPnlCents ?? value - cost;
  return {
    qty,
    avg: Number(p.avgBuyPriceCents) || (qty ? cost / qty : 0),
    now: Number(p.currentPriceCents) || 0,
    cost,
    value,
    pl,
    plPct: cost ? (pl / cost) * 100 : 0,
  };
}

export function totals(positions) {
  const invested = positions.reduce((s, p) => s + positionStats(p).cost, 0);
  const value = positions.reduce((s, p) => s + positionStats(p).value, 0);
  const pl = value - invested;
  return { invested, value, pl, plPct: invested ? (pl / invested) * 100 : 0 };
}
