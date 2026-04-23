import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { apiClient } from "../../src/services/api/client";

const CATEGORIES = ["ALL", "SPORTS", "POLITICS", "FINANCE", "ENTERTAINMENT", "TECHNOLOGY", "OTHER"];

type Market = {
  id: string | number;
  title: string;
  status: string;
  category?: string;
  description?: string;
  endDate?: string;
  volume?: number;
};

function MarketCard({ market }: { market: Market }) {
  const cat = market.category
    ? market.category.charAt(0).toUpperCase() + market.category.slice(1).toLowerCase()
    : "Other";
  const date = market.endDate
    ? new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const isActive = market.status === "ACTIVE";

  return (
    <Pressable
      onPress={() => router.push(`/markets/${market.id}` as any)}
      style={({ pressed }) => [mk.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      {/* top accent */}
      <View style={[mk.accent, { backgroundColor: isActive ? "#a78bfa" : "#334155" }]} />

      {/* badges */}
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

      {/* title */}
      <Text style={mk.title} numberOfLines={2}>{market.title}</Text>

      {/* description */}
      {!!market.description && (
        <Text style={mk.desc} numberOfLines={2}>{market.description}</Text>
      )}

      {/* footer */}
      <View style={mk.footer}>
        <Text style={mk.closes}>
          Closes <Text style={mk.closesDate}>{date}</Text>
        </Text>
        <Text style={mk.tradeBtn}>Trade →</Text>
      </View>
    </Pressable>
  );
}

export default function MarketsScreen() {
  const [markets, setMarkets]   = useState<Market[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch]     = useState("");

  async function fetchMarkets(cat: string) {
    setLoading(true);
    setError("");
    try {
      const endpoint = cat !== "ALL"
        ? `/api/v1/markets/category/${cat}`
        : `/api/v1/markets`;
      const data: Market[] = await apiClient.get(endpoint);
      setMarkets(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load markets.");
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMarkets(category); }, [category]);

  const filtered = markets.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = m.status === "ACTIVE" || m.status === "UPCOMING";
    return matchSearch && matchStatus;
  });

  const ListHeader = (
    <View>
      {/* ── hero ──────────────────────────────────────────────── */}
      <View style={s.hero}>
        <View style={s.heroAccent} />
        <Text style={s.heroTitle}>Markets</Text>
        <Text style={s.heroSub}>Trade on the outcome of real-world events.</Text>
      </View>

      {/* ── search ────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search markets…"
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── category chips ────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsScroll}
        contentContainerStyle={s.chipsContent}
      >
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[s.chip, active && s.chipActive]}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── error ─────────────────────────────────────────────── */}
      {!!error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* ── loading / empty ───────────────────────────────────── */}
      {loading && (
        <View style={s.centered}>
          <ActivityIndicator color="#fbbf24" size="large" />
        </View>
      )}
      {!loading && filtered.length === 0 && (
        <View style={s.centered}>
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>
              {search || category !== "ALL"
                ? "No markets match your filters."
                : "No markets available."}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={s.screen}
      data={loading || filtered.length === 0 ? [] : filtered}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => <MarketCard market={item} />}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={
        !loading && filtered.length > 0 ? (
          <Text style={s.count}>
            {filtered.length} market{filtered.length !== 1 ? "s" : ""}
            {markets.length !== filtered.length ? ` (filtered from ${markets.length} total)` : ""}
          </Text>
        ) : null
      }
    />
  );
}

/* ── market card styles ─────────────────────────────────────────────── */
const mk = StyleSheet.create({
  card:        { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", overflow: "hidden", padding: 14, marginBottom: 10 },
  accent:      { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  badgeRow:    { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 10 },
  catBadge:    { borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  catText:     { fontSize: 10, fontWeight: "700", color: "#c4b5fd" },
  liveBadge:   { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" },
  liveText:    { fontSize: 10, fontWeight: "700", color: "#34d399" },
  statusBadge: { borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:  { fontSize: 10, fontWeight: "700", color: "#fbbf24" },
  title:       { fontSize: 14, fontWeight: "700", color: "#f1f5f9", lineHeight: 20, minHeight: 40 },
  desc:        { fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 15 },
  footer:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  closes:      { fontSize: 11, color: "#475569" },
  closesDate:  { color: "#94a3b8", fontWeight: "600" },
  tradeBtn:    { fontSize: 12, fontWeight: "700", color: "#fbbf24" },
});

/* ── screen styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#080612" },

  hero:         { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, margin: 14, marginBottom: 10, backgroundColor: "rgba(109,40,217,0.12)", overflow: "hidden", padding: 18 },
  heroAccent:   { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#a78bfa" },
  heroTitle:    { fontSize: 26, fontWeight: "900", color: "#fff", marginTop: 6 },
  heroSub:      { fontSize: 12, color: "#475569", marginTop: 4 },

  searchWrap:   { flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: 12 },
  searchIcon:   { fontSize: 14, marginRight: 8 },
  searchInput:  { flex: 1, height: 42, fontSize: 14, color: "#e2e8f0" },

  chipsScroll:  { flexGrow: 0, marginBottom: 12 },
  chipsContent: { paddingHorizontal: 14, gap: 8 },
  chip:         { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.03)" },
  chipActive:   { borderColor: "rgba(139,92,246,0.4)", backgroundColor: "rgba(139,92,246,0.15)" },
  chipText:     { fontSize: 11, fontWeight: "700", color: "#475569" },
  chipTextActive:{ color: "#c4b5fd" },

  errorBox:     { marginHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderRadius: 12, backgroundColor: "rgba(239,68,68,0.06)", padding: 12 },
  errorText:    { fontSize: 13, color: "#fca5a5" },

  centered:     { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyBox:     { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, alignItems: "center" },
  emptyText:    { color: "#475569", fontSize: 13, textAlign: "center" },

  list:         { paddingHorizontal: 14, paddingBottom: 24 },
  count:        { textAlign: "center", fontSize: 11, color: "#334155", marginTop: 8 },
});
