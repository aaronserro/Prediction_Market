import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { FIXTURE_DATA_ENABLED } from "../constants/config";
import {
  CATEGORIES, COMMENTS, dstr, FundRequest, INIT_POS, INIT_REQS, initialPrices, isBin, Market, MarketComment,
  ME, MK, mkTrade, NEWS, NewsItem, Notif, NOTIFS, Position, Prices,
  RankKey,
  RANKS,
  REASONS, RESOLVED,
  ResolvedPosition, rng, Trade, Transaction, TX, UserProfile, USERS,
} from "../data/pryzm";
import { Palette, palettes, ThemeName } from "../theme";

export type Side = "BUY" | "SELL";
export type Sheet = { mid: string; oi: number; side: Side };
export type Fill = { shares: number; price: number; cost: number; payout: number };
export type MyComment = { mid: string; user: string; ago: string; text: string; oi: number };

export type Prefs = Record<"email" | "push" | "alerts" | "tourn" | "winloss" | "twofa" | "pub" | "stats" | "confirm", boolean>;

function initFeed() {
  const r = rng(91), px = initialPrices();
  return Array.from({ length: 18 }, (_, k) => mkTrade(r, px, Date.now() - (k * 47 + 8) * 1000));
}

const ACTIVE_MARKETS: Market[] = FIXTURE_DATA_ENABLED ? MK : [];
const ACTIVE_CATEGORIES = FIXTURE_DATA_ENABLED ? CATEGORIES : [];
const ACTIVE_RESOLVED: ResolvedPosition[] = FIXTURE_DATA_ENABLED ? RESOLVED : [];
const ACTIVE_TRANSACTIONS: Transaction[] = FIXTURE_DATA_ENABLED ? TX : [];
const ACTIVE_NEWS: NewsItem[] = FIXTURE_DATA_ENABLED ? NEWS : [];
const ACTIVE_COMMENTS: MarketComment[] = FIXTURE_DATA_ENABLED ? COMMENTS : [];
const ACTIVE_LEADERBOARD_USERS = FIXTURE_DATA_ENABLED ? USERS : [];
const ACTIVE_FUNDING_REASONS = FIXTURE_DATA_ENABLED ? REASONS : [];

function useStoreValue() {
  const system = useColorScheme();
  const [themeOverride, setTheme] = useState<ThemeName | null>(null);
  const theme: ThemeName = themeOverride ?? (system === "dark" ? "dark" : "light");
  const c: Palette = palettes[theme];

  const fixtureDataEnabled = FIXTURE_DATA_ENABLED;
  const markets = ACTIVE_MARKETS;
  const categories = ACTIVE_CATEGORIES;
  const user: UserProfile | null = fixtureDataEnabled ? ME : null;
  const resolved = ACTIVE_RESOLVED;
  const transactions = ACTIVE_TRANSACTIONS;
  const news = ACTIVE_NEWS;
  const comments = ACTIVE_COMMENTS;
  const leaderboardUsers = ACTIVE_LEADERBOARD_USERS;
  const fundingReasons = ACTIVE_FUNDING_REASONS;
  const ranks: RankKey[] = RANKS;

  const [px, setPx] = useState<Prices>(() => fixtureDataEnabled ? initialPrices() : {});
  const [feed, setFeed] = useState<Trade[]>(() => fixtureDataEnabled ? initFeed() : []);
  const [bal, setBal] = useState(fixtureDataEnabled ? 12480 : 0);
  const [pos, setPos] = useState<Position[]>(() => fixtureDataEnabled ? INIT_POS.map((x) => ({ ...x })) : []);
  const [watch, setWatch] = useState<string[]>(fixtureDataEnabled ? ["boc", "stanley", "fed"] : []);
  const [reqs, setReqs] = useState<FundRequest[]>(() => fixtureDataEnabled ? INIT_REQS.slice() : []);
  const [notifs, setNotifs] = useState<Notif[]>(() => fixtureDataEnabled ? NOTIFS.map((x) => ({ ...x })) : []);
  const [prefs, setPrefs] = useState<Prefs>({ email: true, push: true, alerts: true, tourn: false, winloss: true, twofa: false, pub: true, stats: true, confirm: true });
  const [limit, setLimit] = useState("No limit");
  const [tourNotify, setTourNotify] = useState(false);
  const [interests, setInterests] = useState<string[]>(fixtureDataEnabled ? ["Finance", "Sports"] : []);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState("");
  const liveTicker = fixtureDataEnabled;

  const marketById = useCallback((id: string) => markets.find((market) => market.id === id), [markets]);

  // Live ticker: nudge one binary market and append a synthetic trade every 3s.
  const r = useRef<() => number>(rng(Date.now() % 100000));
  const pxRef = useRef(px);
  pxRef.current = px;
  useEffect(() => {
    if (!liveTicker) return;
    const iv = setInterval(() => {
      const rand = r.current;
      const next = { ...pxRef.current };
      const bins = markets.filter((m) => isBin(m) && !m.up);
      if (!bins.length) return;
      const m = bins[Math.floor(rand() * bins.length)];
      const y = Math.max(3, Math.min(97, next[m.id][0] + (rand() < 0.5 ? -1 : 1)));
      next[m.id] = [y, 100 - y];
      const tr = mkTrade(rand, next, Date.now());
      setPx(next);
      setFeed((f) => [tr, ...f].slice(0, 40));
    }, 3000);
    return () => clearInterval(iv);
  }, [liveTicker, markets]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((t: string) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const openSheet = useCallback((mid: string, oi: number, side: Side) => {
    if (!fixtureDataEnabled) { flash("Real trading is not configured yet"); return; }
    const m = marketById(mid);
    if (!m) return;
    if (m.up) { flash("Trading opens " + dstr(m.up - 36)); return; }
    setSheet({ mid, oi, side });
  }, [fixtureDataEnabled, flash, marketById]);

  const toggleWatch = useCallback((id: string) => {
    if (!fixtureDataEnabled) return;
    const on = watch.includes(id);
    setWatch(on ? watch.filter((x) => x !== id) : [...watch, id]);
    flash(on ? "Removed from watchlist" : "Added to watchlist");
  }, [fixtureDataEnabled, watch, flash]);

  const confirmTrade = useCallback((sh: Sheet, calc: Fill) => {
    if (!fixtureDataEnabled || !user) return;
    if (sh.side === "BUY") {
      setBal((b) => b - calc.cost);
      setPos((prev) => {
        const next = prev.map((x) => ({ ...x }));
        const t = next.find((x) => x.mid === sh.mid && x.oi === sh.oi);
        if (t) { t.avg = Math.round((t.avg * t.qty + calc.cost) / (t.qty + calc.shares)); t.qty += calc.shares; }
        else next.push({ mid: sh.mid, oi: sh.oi, qty: calc.shares, avg: calc.price });
        return next;
      });
    } else {
      setBal((b) => b + calc.cost);
      setPos((prev) => prev.map((x) => (x.mid === sh.mid && x.oi === sh.oi ? { ...x, qty: x.qty - calc.shares } : x)).filter((x) => x.qty > 0));
    }
    const tr: Trade = { id: "me" + Date.now(), user: user.name + " (you)", mid: sh.mid, oi: sh.oi, side: sh.side, qty: calc.shares, price: calc.price, at: Date.now() };
    setFeed((f) => [tr, ...f].slice(0, 40));
  }, [fixtureDataEnabled, user]);

  const submitRequest = useCallback((amt: number, reason: string) => {
    if (!fixtureDataEnabled) return;
    setReqs((rs) => [{ id: Date.now(), amt, reason, status: "PENDING", date: "Today" }, ...rs]);
  }, [fixtureDataEnabled]);

  const signOut = useCallback(() => setSheet(null), []);

  const posValue = pos.reduce((a, x) => a + x.qty * (px[x.mid]?.[x.oi] ?? 0), 0);
  const posCost = pos.reduce((a, x) => a + x.qty * x.avg, 0);

  return {
    fixtureDataEnabled, realDataUnavailable: !fixtureDataEnabled,
    markets, categories, user, resolved, transactions, news, comments, leaderboardUsers, fundingReasons, ranks, marketById,
    theme, c, setTheme, px, feed, bal, pos, watch, reqs, notifs, setNotifs, prefs, setPrefs, limit, setLimit,
    tourNotify, setTourNotify, interests, setInterests, myComments, setMyComments, sheet, setSheet, toast, flash,
    openSheet, toggleWatch, confirmTrade, submitRequest, signOut,
    posValue, pl: posValue - posCost, total: bal + posValue, unread: notifs.filter((n) => n.unread).length,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside AppStoreProvider");
  return v;
}

export const useColors = () => useStore().c;

// Memoised palette-aware StyleSheet factory.
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
