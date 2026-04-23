import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useAuth } from "../../src/features/auth/AuthContext";
import {
    computeRank,
    formatRank,
    rankColor,
    rankProgress,
} from "../../src/lib/rankUtils";
import { apiClient } from "../../src/services/api/client";

/* ── types ───────────────────────────────────────────────────────────── */
type Position = {
  id: string | number;
  marketId: string | number;
  outcomeId: string | number;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  marketTitle?: string;
  marketStatus?: string;
  marketCategory?: string;
  outcomeName?: string;
  outcomeLabel?: string;
};
type RankData = {
  overallPoints?: number;
  traderPoints?: number;
  predictorPoints?: number;
  resolvedMarketsCount?: number;
};

/* ── XP bar ──────────────────────────────────────────────────────────── */
function XpBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(pct, 100), duration: 1000, useNativeDriver: false }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={xp.track}>
      <Animated.View style={[xp.fill, { width, backgroundColor: color }]} />
    </View>
  );
}
const xp = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  fill:  { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 3 },
});

/* ── stat tile ───────────────────────────────────────────────────────── */
function StatTile({ label, value, sub, borderColor, bgColor }: {
  label: string; value: string; sub?: string; borderColor: string; bgColor: string;
}) {
  return (
    <View style={[tile.box, { borderColor, backgroundColor: bgColor }]}>
      <Text style={tile.label}>{label}</Text>
      <Text style={tile.value}>{value}</Text>
      {!!sub && <Text style={tile.sub}>{sub}</Text>}
    </View>
  );
}
const tile = StyleSheet.create({
  box:   { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, minWidth: "45%" },
  label: { fontSize: 9, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: "900", color: "#fff" },
  sub:   { fontSize: 11, color: "#475569", marginTop: 2 },
});

/* ── main screen ─────────────────────────────────────────────────────── */
export default function PortfolioScreen() {
  const { user } = useAuth();
  const [positions, setPositions]       = useState<Position[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [outcomePrices, setOutcomePrices] = useState<Record<string | number, number>>({});
  const [rank, setRank]                 = useState<RankData | null>(null);

  /* fetch positions + prices */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data: Position[] = await apiClient.get("/api/v1/positions/me");
        setPositions(data);
        if (data.length > 0) {
          const results = await Promise.all(
            data.map(async (pos) => {
              try {
                const p = await apiClient.get(
                  `/api/v1/markets/${pos.marketId}/outcomes/${pos.outcomeId}/price`
                );
                let raw: number =
                  typeof p === "number" ? p : (p?.price ?? p?.currentPrice ?? p?.value ?? p?.pricePerShare ?? 50);
                return { id: pos.id, price: raw > 1 ? raw / 100 : raw };
              } catch {
                return { id: pos.id, price: null };
              }
            })
          );
          const map: Record<string | number, number> = {};
          results.forEach(({ id, price }) => { if (price !== null) map[id] = price as number; });
          setOutcomePrices(map);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load positions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* fetch rank */
  useEffect(() => {
    if (!user) return;
    const userId = (user as any).id ?? (user as any).userId ?? user.username;
    if (!userId) return;
    apiClient.get(`/api/ranks/${userId}`).then(setRank).catch(() => {});
  }, [user]);

  /* derived stats */
  const totalInvested = positions.reduce((s, p) => s + (p.quantity || 0) * (p.averagePrice || 0), 0);
  const totalValue    = positions.reduce((s, p) => {
    const cp = outcomePrices[p.id] ?? p.currentPrice ?? 0;
    return s + (p.quantity || 0) * cp;
  }, 0);
  const totalPL    = totalValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

  const overallRankKey   = rank ? computeRank(rank.overallPoints   ?? 0) : null;
  const traderRankKey    = rank ? computeRank(rank.traderPoints    ?? 0) : null;
  const predictorRankKey = rank ? computeRank(rank.predictorPoints ?? 0) : null;
  const overallProgress  = rank ? rankProgress(rank.overallPoints  ?? 0) : null;
  const traderProgress   = rank ? rankProgress(rank.traderPoints   ?? 0) : null;
  const predictorProgress = rank ? rankProgress(rank.predictorPoints ?? 0) : null;

  /* ── header (hero + rank + stats) ───────────────────────────────── */
  const ListHeader = (
    <View>
      {/* hero */}
      <View style={s.hero}>
        <View style={s.heroAccent} />
        <Text style={s.heroTitle}>Portfolio</Text>
        <Text style={s.heroSub}>Track your active positions across markets</Text>
      </View>

      {/* rank breakdown */}
      {rank && overallRankKey && (
        <View style={s.rankCard}>
          {/* section label */}
          <View style={s.rankHeader}>
            <Ionicons name="flash" size={14} color="#fbbf24" />
            <Text style={s.rankHeaderText}>Rank Breakdown</Text>
          </View>

          {/* overall */}
          <View style={s.rankOverall}>
            <View style={s.rankOverallInfo}>
              <Text style={s.rankSectionLabel}>Overall</Text>
              <Text style={[s.rankName, { color: rankColor(overallRankKey) }]}>
                {formatRank(overallRankKey)}
              </Text>
              <View style={s.xpLabelRow}>
                <Text style={s.xpLabel}>Progress to next rank</Text>
                <Text style={s.xpValue}>
                  {rank.overallPoints} / {overallProgress?.isMax ? "MAX" : `${overallProgress?.next} pts`}
                </Text>
              </View>
              <XpBar pct={overallProgress?.pct ?? 0} color="#a78bfa" />
            </View>
            <View style={s.resolvedBlock}>
              <Text style={s.resolvedNum}>{rank.resolvedMarketsCount ?? 0}</Text>
              <Text style={s.resolvedLabel}>Resolved</Text>
            </View>
          </View>

          {/* trader + predictor */}
          <View style={s.rankSubRow}>
            {[
              { label: "Trader",    key: traderRankKey,    prog: traderProgress,    pts: rank.traderPoints    ?? 0, color: "#a78bfa" },
              { label: "Predictor", key: predictorRankKey, prog: predictorProgress, pts: rank.predictorPoints ?? 0, color: "#fbbf24" },
            ].map(({ label, key, prog, pts, color }) => key && (
              <View key={label} style={s.rankSubCard}>
                <Text style={s.rankSectionLabel}>{label}</Text>
                <Text style={[s.rankSubName, { color: rankColor(key) }]}>{formatRank(key)}</Text>
                <View style={s.xpLabelRow}>
                  <Text style={s.xpLabel}>XP</Text>
                  <Text style={s.xpValue}>{pts} / {prog?.isMax ? "MAX" : `${prog?.next} pts`}</Text>
                </View>
                <XpBar pct={prog?.pct ?? 0} color={color} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* stat tiles */}
      <View style={s.statGrid}>
        <View style={s.statRow}>
          <StatTile label="Positions"     value={String(positions.length)}     borderColor="rgba(167,139,250,0.2)" bgColor="rgba(167,139,250,0.05)" />
          <StatTile label="Invested"      value={`$${totalInvested.toFixed(2)}`} borderColor="rgba(251,191,36,0.2)"  bgColor="rgba(251,191,36,0.05)" />
        </View>
        <View style={s.statRow}>
          <StatTile label="Current Value" value={`$${totalValue.toFixed(2)}`}  borderColor="rgba(167,139,250,0.2)" bgColor="rgba(167,139,250,0.05)" />
          <StatTile
            label="Total P/L"
            value={`${totalPL >= 0 ? "+" : ""}$${totalPL.toFixed(2)}`}
            sub={`${totalPL >= 0 ? "+" : ""}${totalPLPct.toFixed(2)}%`}
            borderColor={totalPL >= 0 ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}
            bgColor={totalPL >= 0 ? "rgba(52,211,153,0.05)" : "rgba(239,68,68,0.05)"}
          />
        </View>
      </View>

      {/* error */}
      {!!error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* empty state */}
      {!loading && positions.length === 0 && (
        <View style={s.emptyCard}>
          <Text style={s.emptyTitle}>No Positions Yet</Text>
          <Text style={s.emptySub}>
            You haven't made any trades yet. Start trading on markets to build your portfolio.
          </Text>
          <Pressable onPress={() => router.push("/tabs/markets" as any)} style={s.browseBtn}>
            <Text style={s.browseBtnText}>Browse Markets</Text>
          </Pressable>
        </View>
      )}

      {/* positions label */}
      {positions.length > 0 && (
        <Text style={s.sectionLabel}>Your Positions</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#fbbf24" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.content}
      data={positions}
      keyExtractor={(item, index) => (item.id != null ? String(item.id) : String(index))}
      ListHeaderComponent={ListHeader}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: pos }) => {
        const cp       = outcomePrices[pos.id] ?? pos.currentPrice ?? 0;
        const invested = (pos.quantity || 0) * (pos.averagePrice || 0);
        const value    = (pos.quantity || 0) * cp;
        const pl       = value - invested;
        const plPct    = pos.averagePrice && cp ? ((cp - pos.averagePrice) / pos.averagePrice) * 100 : 0;
        const winning  = pl >= 0;

        return (
          <Pressable
            onPress={() => router.push(`/markets/${pos.marketId}` as any)}
            style={({ pressed }) => [s.posCard, pressed && { opacity: 0.85 }]}
          >
            {/* left P/L accent bar */}
            <View style={[s.plAccent, { backgroundColor: winning ? "#34d399" : "#ef4444" }]} />

            <View style={s.posBody}>
              {/* badges */}
              <View style={s.badgeRow}>
                {!!pos.marketCategory && (
                  <View style={s.catBadge}>
                    <Text style={s.catBadgeText}>
                      {pos.marketCategory.charAt(0) + pos.marketCategory.slice(1).toLowerCase()}
                    </Text>
                  </View>
                )}
                {!!pos.marketStatus && (
                  <View style={[
                    s.statusBadge,
                    pos.marketStatus === "ACTIVE"
                      ? s.statusActive
                      : pos.marketStatus === "PENDING"
                      ? s.statusPending
                      : s.statusOther,
                  ]}>
                    <Text style={[
                      s.statusText,
                      pos.marketStatus === "ACTIVE"
                        ? { color: "#34d399" }
                        : pos.marketStatus === "PENDING"
                        ? { color: "#fbbf24" }
                        : { color: "#94a3b8" },
                    ]}>{pos.marketStatus}</Text>
                  </View>
                )}
              </View>

              {/* title + outcome */}
              <Text style={s.posTitle} numberOfLines={2}>{pos.marketTitle || "Market"}</Text>
              <Text style={s.posOutcome}>{pos.outcomeName || pos.outcomeLabel || "Outcome"}</Text>

              {/* share info pills */}
              <View style={s.pillRow}>
                <View style={s.pill}><Text style={s.pillText}>{pos.quantity || 0} shares</Text></View>
                <View style={s.pill}><Text style={s.pillText}>Avg {pos.averagePrice ? `${(pos.averagePrice * 100).toFixed(1)}¢` : "—"}</Text></View>
                <View style={s.pill}><Text style={s.pillText}>Now {cp ? `${(cp * 100).toFixed(1)}¢` : "—"}</Text></View>
              </View>

              {/* metrics */}
              <View style={s.metricsRow}>
                <View>
                  <Text style={s.metricLabel}>Invested</Text>
                  <Text style={s.metricValue}>${invested.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={s.metricLabel}>Value</Text>
                  <Text style={[s.metricValue, { color: "#fff" }]}>${value.toFixed(2)}</Text>
                </View>
                <View style={[s.plBadge, winning ? s.plBadgeWin : s.plBadgeLoss]}>
                  <Text style={[s.plValue, { color: winning ? "#34d399" : "#ef4444" }]}>
                    {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                  </Text>
                  <Text style={[s.plPct, { color: winning ? "#34d399" : "#ef4444" }]}>
                    {pl >= 0 ? "+" : ""}{plPct.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: "#080612" },
  content: { padding: 12, paddingBottom: 32 },
  centered:{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#080612" },

  /* hero */
  hero:      { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, backgroundColor: "rgba(109,40,217,0.12)", overflow: "hidden", padding: 16, marginBottom: 12 },
  heroAccent:{ position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#a78bfa" },
  heroTitle: { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 4 },
  heroSub:   { fontSize: 13, color: "#475569" },

  /* rank card */
  rankCard:       { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.02)", marginBottom: 12, overflow: "hidden" },
  rankHeader:     { flexDirection: "row", alignItems: "center", gap: 6, padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rankHeaderText: { fontSize: 11, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
  rankOverall:    { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(109,40,217,0.08)" },
  rankOverallInfo:{ flex: 1, gap: 4 },
  rankSectionLabel:{ fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 },
  rankName:       { fontSize: 20, fontWeight: "900" },
  xpLabelRow:     { flexDirection: "row", justifyContent: "space-between", marginTop: 6, marginBottom: 3 },
  xpLabel:        { fontSize: 10, color: "#475569" },
  xpValue:        { fontSize: 10, color: "#fbbf24", fontWeight: "700" },
  resolvedBlock:  { alignItems: "center" },
  resolvedNum:    { fontSize: 28, fontWeight: "900", color: "#fff" },
  resolvedLabel:  { fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: 0.6 },
  rankSubRow:     { flexDirection: "row" },
  rankSubCard:    { flex: 1, padding: 14, gap: 3, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.05)" },
  rankSubName:    { fontSize: 15, fontWeight: "900" },

  /* stat grid */
  statGrid: { gap: 8, marginBottom: 12 },
  statRow:  { flexDirection: "row", gap: 8 },

  /* error */
  errorBox:  { borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderRadius: 12, backgroundColor: "rgba(239,68,68,0.06)", padding: 14, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#fca5a5" },

  /* empty */
  emptyCard:    { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.02)", padding: 32, alignItems: "center", marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 8 },
  emptySub:     { fontSize: 13, color: "#475569", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  browseBtn:    { backgroundColor: "#fbbf24", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 11 },
  browseBtnText:{ fontSize: 14, fontWeight: "900", color: "#1a0a00" },

  /* section label */
  sectionLabel: { fontSize: 11, fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

  /* position card */
  posCard:   { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", marginBottom: 10, overflow: "hidden", flexDirection: "row" },
  plAccent:  { width: 3 },
  posBody:   { flex: 1, padding: 14 },
  badgeRow:  { flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" },
  catBadge:  { borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: "700", color: "#c4b5fd" },
  statusBadge:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)" },
  statusPending:{ borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.1)" },
  statusOther:  { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" },
  statusText:   { fontSize: 10, fontWeight: "700" },
  posTitle:     { fontSize: 13, fontWeight: "700", color: "#f1f5f9", lineHeight: 18, marginBottom: 3 },
  posOutcome:   { fontSize: 11, color: "#475569", marginBottom: 10 },
  pillRow:      { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  pill:         { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText:     { fontSize: 10, color: "#64748b" },
  metricsRow:   { flexDirection: "row", alignItems: "center", gap: 16 },
  metricLabel:  { fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  metricValue:  { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  plBadge:      { marginLeft: "auto", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  plBadgeWin:   { borderColor: "rgba(52,211,153,0.2)", backgroundColor: "rgba(52,211,153,0.08)" },
  plBadgeLoss:  { borderColor: "rgba(239,68,68,0.2)",  backgroundColor: "rgba(239,68,68,0.08)" },
  plValue:      { fontSize: 13, fontWeight: "900" },
  plPct:        { fontSize: 10, fontWeight: "600" },
});
