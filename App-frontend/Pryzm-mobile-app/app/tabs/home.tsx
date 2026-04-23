import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useAuth } from "../../src/features/auth/AuthContext";
import {
    computeRank,
    formatRank,
    rankColor,
    rankEmoji,
    rankProgress,
} from "../../src/lib/rankUtils";
import { apiClient } from "../../src/services/api/client";

/* ── types ──────────────────────────────────────────────────────────── */
type Wallet = { balanceCents: number };
type Rank = {
  overallPoints: number;
  traderPoints: number;
  predictorPoints: number;
  resolvedMarketsCount: number;
};
type Market = {
  id: string | number;
  title: string;
  status: string;
  category?: string;
  volume?: number;
  endDate?: string;
};

/* ── XP bar ──────────────────────────────────────────────────────────── */
function XpBar({ pct }: { pct: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={xpStyles.track}>
      <Animated.View style={[xpStyles.fill, { width }]} />
    </View>
  );
}
const xpStyles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  fill:  { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 4, backgroundColor: "#a78bfa" },
});

/* ── stat card ───────────────────────────────────────────────────────── */
type StatCardProps = { label: string; value: string; sub: string; emoji: string; accentColor: string; loading: boolean };
function StatCard({ label, value, sub, emoji, accentColor, loading }: StatCardProps) {
  return (
    <View style={[sc.card, { borderColor: accentColor + "33" }]}>
      <View style={[sc.iconBox, { backgroundColor: accentColor + "1a", borderColor: accentColor + "33" }]}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sc.label}>{label}</Text>
        <Text style={sc.value}>{loading ? "…" : value}</Text>
        <Text style={sc.sub}>{sub}</Text>
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  card:    { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  label:   { fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  value:   { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  sub:     { fontSize: 11, color: "#475569", marginTop: 1 },
});

/* ── market card ─────────────────────────────────────────────────────── */
function MarketCard({ market }: { market: Market }) {
  const vol = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(market.volume || 0);
  const date = market.endDate
    ? new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";
  const cat = market.category
    ? market.category.charAt(0).toUpperCase() + market.category.slice(1).toLowerCase()
    : "Other";
  const isActive = market.status === "ACTIVE";

  return (
    <Pressable
      onPress={() => router.push(`/markets/${market.id}` as any)}
      style={({ pressed }) => [mk.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      {/* top accent */}
      <View style={[mk.accent, { backgroundColor: isActive ? "#a78bfa" : "#334155" }]} />

      <View style={mk.badgeRow}>
        <View style={mk.catBadge}>
          <Text style={mk.catText}>{cat}</Text>
        </View>
        {isActive ? (
          <View style={mk.liveBadge}>
            <View style={mk.liveDot} />
            <Text style={mk.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={mk.statusBadge}>
            <Text style={mk.statusText}>{market.status}</Text>
          </View>
        )}
      </View>

      <Text style={mk.title} numberOfLines={2}>{market.title}</Text>

      <View style={mk.footer}>
        <Text style={mk.vol}>{vol} vol</Text>
        <Text style={mk.date}>{date}</Text>
      </View>
      <View style={mk.tradeRow}>
        <Text style={mk.tradeBtn}>Trade now →</Text>
      </View>
    </Pressable>
  );
}
const mk = StyleSheet.create({
  card:       { flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", overflow: "hidden", padding: 14, margin: 5, minWidth: 0 },
  accent:     { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  badgeRow:   { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 10 },
  catBadge:   { borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  catText:    { fontSize: 10, fontWeight: "700", color: "#c4b5fd" },
  liveBadge:  { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" },
  liveText:   { fontSize: 10, fontWeight: "700", color: "#34d399" },
  statusBadge:{ borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#fbbf24" },
  title:      { fontSize: 13, fontWeight: "600", color: "#f1f5f9", lineHeight: 18, minHeight: 36 },
  footer:     { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  vol:        { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  date:       { fontSize: 11, color: "#475569" },
  tradeRow:   { marginTop: 8, alignItems: "flex-end" },
  tradeBtn:   { fontSize: 12, fontWeight: "700", color: "#fbbf24" },
});

/* ── main screen ─────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();

  const [wallet, setWallet]               = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [rank, setRank]                   = useState<Rank | null>(null);
  const [rankLoading, setRankLoading]     = useState(true);
  const [markets, setMarkets]             = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);

  const userId = user?.id ?? user?.userId ?? user?.username ?? null;

  /* fetch wallet */
  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setWalletLoading(false); return; }
    (async () => {
      try {
        const data = await apiClient.get(`/api/v1/users/${userId}/wallet`);
        setWallet(data);
      } catch (_) {}
      finally { setWalletLoading(false); }
    })();
  }, [userId, authLoading]);

  /* fetch rank */
  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setRankLoading(false); return; }
    (async () => {
      try {
        const data = await apiClient.get(`/api/ranks/${userId}`);
        setRank(data);
      } catch (_) {}
      finally { setRankLoading(false); }
    })();
  }, [userId, authLoading]);

  /* fetch markets */
  useEffect(() => {
    (async () => {
      try {
        const data: Market[] = await apiClient.get("/api/v1/markets");
        setMarkets(data.filter((m) => m.status === "ACTIVE" || m.status === "UPCOMING").slice(0, 6));
      } catch (_) {}
      finally { setMarketsLoading(false); }
    })();
  }, []);

  const balance      = wallet?.balanceCents ? wallet.balanceCents / 100 : 0;
  const fmtBal       = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(balance);
  const username     = user?.username ?? "User";
  const overallRankKey   = rank ? computeRank(rank.overallPoints ?? 0)  : null;
  const overallProgress  = rank ? rankProgress(rank.overallPoints ?? 0) : null;
  const overallPct       = overallProgress?.pct ?? 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          {/* avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            {overallRankKey && (
              <View style={[s.rankBadge, { backgroundColor: rankColor(overallRankKey) + "22", borderColor: rankColor(overallRankKey) + "55" }]}>
                <Text style={{ fontSize: 14 }}>{rankEmoji(overallRankKey)}</Text>
              </View>
            )}
          </View>

          {/* greeting */}
          <View style={{ flex: 1 }}>
            <Text style={s.welcomeLabel}>Welcome back,</Text>
            <Text style={s.heroName} numberOfLines={1}>{authLoading ? "…" : username}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              {overallRankKey && (
                <View style={[s.pill, { borderColor: rankColor(overallRankKey) + "55", backgroundColor: rankColor(overallRankKey) + "22" }]}>
                  <Text style={[s.pillText, { color: rankColor(overallRankKey) }]}>{formatRank(overallRankKey)}</Text>
                </View>
              )}
              {rank && <Text style={s.resolvedText}>{rank.resolvedMarketsCount ?? 0} resolved</Text>}
            </View>
          </View>
        </View>

        {/* XP bar */}
        <View style={{ marginTop: 18 }}>
          <View style={s.xpRow}>
            <Text style={s.xpLabel}>Overall XP</Text>
            <Text style={s.xpPts}>{rank?.overallPoints ?? 0} pts</Text>
          </View>
          <XpBar pct={overallPct} />
        </View>

        {/* CTA buttons */}
        <View style={s.ctaRow}>
          <Pressable
            style={({ pressed }) => [s.ctaPrimary, pressed && { opacity: 0.82 }]}
            onPress={() => router.push("/wallet" as any)}
          >
            <Text style={s.ctaPrimaryText}>+ Add Funds</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.ctaSecondary, pressed && { opacity: 0.82 }]}
            onPress={() => router.push("/markets" as any)}
          >
            <Text style={s.ctaSecondaryText}>Trade →</Text>
          </Pressable>
        </View>
      </View>

      {/* ── STAT TILES ────────────────────────────────────────── */}
      <View style={{ marginBottom: 8 }}>
        <StatCard label="Balance" value={fmtBal} sub="Available to trade" emoji="💰" accentColor="#8b5cf6" loading={walletLoading} />
        <StatCard label="Overall Rank" value={formatRank(overallRankKey)} sub={`${rank?.overallPoints ?? 0} overall pts`} emoji={rankEmoji(overallRankKey)} accentColor={rankColor(overallRankKey)} loading={rankLoading} />
        <StatCard label="Markets Resolved" value={String(rank?.resolvedMarketsCount ?? "—")} sub="Completed predictions" emoji="🎯" accentColor="#10b981" loading={rankLoading} />
      </View>

      {/* ── LIVE MARKETS ──────────────────────────────────────── */}
      <View style={{ marginTop: 8, marginBottom: 32 }}>
        <View style={s.marketsHeader}>
          <View>
            <Text style={s.sectionTitle}>🟢 Live Markets</Text>
            <Text style={s.sectionSub}>Trade on real-world events in real time</Text>
          </View>
          <Pressable onPress={() => router.push("/markets" as any)} style={s.allMarketsBtn}>
            <Text style={s.allMarketsTxt}>All →</Text>
          </Pressable>
        </View>

        {marketsLoading ? (
          <View style={s.centered}>
            <ActivityIndicator color="#fbbf24" size="large" />
          </View>
        ) : markets.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No active markets right now — check back soon.</Text>
          </View>
        ) : (
          <View style={s.marketsGrid}>
            {markets.map((m) => (
              <View key={String(m.id)} style={s.marketCol}>
                <MarketCard market={m} />
              </View>
            ))}
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: "#080612" },
  content:         { padding: 16 },

  /* hero */
  hero:            { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, backgroundColor: "rgba(109,40,217,0.15)", padding: 18, marginBottom: 16 },
  heroTop:         { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap:      { position: "relative" },
  avatar:          { width: 60, height: 60, borderRadius: 16, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  avatarLetter:    { fontSize: 26, fontWeight: "900", color: "#fff" },
  rankBadge:       { position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  welcomeLabel:    { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  heroName:        { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  pill:            { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  pillText:        { fontSize: 10, fontWeight: "700" },
  resolvedText:    { fontSize: 11, color: "#475569" },
  xpRow:           { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  xpLabel:         { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  xpPts:           { fontSize: 12, color: "#fbbf24", fontWeight: "700" },
  ctaRow:          { flexDirection: "row", gap: 10, marginTop: 16 },
  ctaPrimary:      { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 14, backgroundColor: "#f59e0b" },
  ctaPrimaryText:  { fontSize: 13, fontWeight: "900", color: "#1a0a00" },
  ctaSecondary:    { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.1)" },
  ctaSecondaryText:{ fontSize: 13, fontWeight: "700", color: "#c4b5fd" },

  /* markets */
  marketsHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sectionTitle:    { fontSize: 14, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: 0.8 },
  sectionSub:      { fontSize: 11, color: "#475569", marginTop: 2 },
  allMarketsBtn:   { borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  allMarketsTxt:   { fontSize: 12, fontWeight: "700", color: "#c4b5fd" },
  marketsGrid:     { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  marketCol:       { width: "50%" },
  centered:        { paddingVertical: 60, alignItems: "center" },
  emptyBox:        { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, alignItems: "center" },
  emptyText:       { color: "#475569", fontSize: 13, textAlign: "center" },
});
