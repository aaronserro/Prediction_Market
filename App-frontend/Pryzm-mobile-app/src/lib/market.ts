import { router } from "expo-router";
import { cpt, dstr, fmt, hash, isBin, Market, Position, Prices, rankLabel, rankProgress, RANKS, sgn, UserProfile } from "../data/pryzm";
import { Palette, seriesColors } from "../theme";

export type OutcomeRow = { label: string; pct: number; oi: number; color: string };

export function cardData(m: Market, px: Prices, watch: string[], c: Palette) {
  const p = px[m.id], bin = isBin(m), watched = watch.includes(m.id), colors = seriesColors(c);
  const rows: OutcomeRow[] = m.o.map((x, i) => ({ label: x[0], pct: p[i], oi: i, color: colors[i] })).sort((a, b) => b.pct - a.pct);
  return {
    m, id: m.id, cat: m.cat, title: m.title, bin, yes: p[0], no: p[1], rows,
    vol: cpt(m.vol), close: dstr(m.end), upcoming: !!m.up,
    watched, watchIcon: (watched ? "bookmark" : "bookmark-outline") as "bookmark" | "bookmark-outline",
    watchColor: watched ? c.am : c.mu,
    change: (m.move >= 0 ? "▲ " : "▼ ") + Math.abs(m.move) + " this week",
    changeColor: m.move >= 0 ? c.yes : c.no,
    top: rows[0], comments: 8 + (hash(m.id) % 90),
  };
}
export type CardData = ReturnType<typeof cardData>;

export function posRow(x: Position, px: Prices, c: Palette, markets: Market[]) {
  const m = markets.find((market) => market.id === x.mid);
  const now = px[x.mid]?.[x.oi];
  if (!m || now === undefined) return null;
  const v = x.qty * now, d = x.qty * (now - x.avg), pct = ((now - x.avg) / x.avg) * 100, lab = m.o[x.oi][0];
  const side = lab === "Yes" ? [c.yess, c.yes] : lab === "No" ? [c.nos, c.no] : [c.prs, c.prt];
  return {
    ...x, title: m.title, cat: m.cat, close: dstr(m.end), side: lab, sideBg: side[0], sideColor: side[1],
    qtyFmt: fmt(x.qty), now, value: fmt(v), pl: sgn(d), plPct: (pct >= 0 ? "+" : "−") + Math.abs(pct).toFixed(1) + "%",
    plColor: d >= 0 ? c.yes : c.no,
  };
}

export function myRank(user: UserProfile) {
  const rp = rankProgress(user.overall), rk = RANKS[rp.i];
  return {
    rp, rk, label: rankLabel(rk), nextLabel: rankLabel(RANKS[Math.min(rp.i + 1, 8)]),
    xpText: user.overall + " / " + rp.next + " pts", xpPct: rp.pct,
  };
}

export const openMarket =(id: string) => router.push({ pathname: "/market/[id]", params: { id } });
