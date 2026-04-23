import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../src/services/api/client";

/* ── types ───────────────────────────────────────────────────────────── */
type Outcome = {
  id: string | number;
  label?: string;
  description?: string;
};
type Market = {
  id: string | number;
  title: string;
  description?: string;
  status: string;
  category?: string;
  closeTime?: string;
  createdAt?: string;
  resolutionSource?: string;
  outcomes?: Outcome[];
};
type PendingTrade = { outcome: Outcome; action: "BUY" | "SELL" };

/* ── category config ─────────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: "⚽", POLITICS: "🗳️", FINANCE: "💰",
  ENTERTAINMENT: "🎬", TECHNOLOGY: "💻", OTHER: "📌",
};
const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "#60a5fa", POLITICS: "#f87171", FINANCE: "#34d399",
  ENTERTAINMENT: "#c084fc", TECHNOLOGY: "#22d3ee", OTHER: "#94a3b8",
};

/* ── helpers ─────────────────────────────────────────────────────────── */
function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  let v: unknown = raw;
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    const candidate = o.price ?? o.currentPrice ?? o.value ?? o.pricePerShare;
    v = candidate !== undefined ? candidate : null;
  }
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n > 1 ? n / 100 : n;
}

/* ── probability bar ─────────────────────────────────────────────────── */
function ProbBar({ pct, isYes }: { pct: number; isYes: boolean }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: isYes ? "#34d399" : "#f87171" }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 14 },
  fill:  { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 3 },
});

/* ── detail row ──────────────────────────────────────────────────────── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{value}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row:   { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  label: { fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  value: { fontSize: 13, color: "#cbd5e1", fontWeight: "500" },
});

/* ── main screen ─────────────────────────────────────────────────────── */
export default function MarketDetailScreen() {
  const { marketId } = useLocalSearchParams<{ marketId: string }>();

  const [market, setMarket]             = useState<Market | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [outcomePrices, setOutcomePrices] = useState<Record<string | number, number>>({});

  const [tradeQuantity, setTradeQuantity] = useState(10);
  const [tradeLoading, setTradeLoading]   = useState(false);
  const [tradeError, setTradeError]       = useState("");
  const [tradeSuccess, setTradeSuccess]   = useState("");

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingTrade, setPendingTrade]     = useState<PendingTrade | null>(null);

  /* fetch prices */
  async function fetchPrices(marketData: Market) {
    if (!marketData.outcomes?.length) return;
    const results = await Promise.all(
      marketData.outcomes.map(async (o) => {
        try {
          const data = await apiClient.get(`/api/v1/markets/${marketData.id}/outcomes/${o.id}/price`);
          return { id: o.id, price: parsePrice(data) };
        } catch {
          return { id: o.id, price: null };
        }
      })
    );
    const map: Record<string | number, number> = {};
    results.forEach(({ id, price }) => { if (price !== null) map[id] = price; });
    setOutcomePrices(map);
  }

  /* fetch market */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data: Market = await apiClient.get(`/api/v1/markets/${marketId}`);
        setMarket(data);
        await fetchPrices(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load market.");
      } finally {
        setLoading(false);
      }
    })();
  }, [marketId]);

  /* trade handlers */
  async function executeTrade(action: "BUY" | "SELL", outcomeId: string | number) {
    setTradeLoading(true);
    setTradeError("");
    setTradeSuccess("");
    try {
      const endpoint = action === "BUY" ? "/api/v1/trades/buy" : "/api/v1/trades/sell";
      const data = await apiClient.post(endpoint, {
        marketId: market!.id,
        outcomeId,
        quantity: tradeQuantity,
      });
      if (action === "BUY") {
        setTradeSuccess(`Bought ${data.quantity ?? tradeQuantity} shares at ${data.pricePerShare ?? "?"}¢`);
      } else {
        setTradeSuccess(`Sold ${data.filledQuantity ?? tradeQuantity} shares at ${data.pricePerShareCents ?? "?"}¢`);
      }
      if (market) await fetchPrices(market);
    } catch (e: any) {
      let msg = e?.message ?? `${action === "BUY" ? "Buy" : "Sell"} failed.`;
      if (msg.includes("Insufficient balance")) msg = "Insufficient balance. Please add funds to your wallet.";
      if (msg.includes("Cannot sell more") || msg.includes("outstanding=0")) msg = "You don't have enough shares to sell.";
      setTradeError(msg);
    } finally {
      setTradeLoading(false);
    }
  }

  function openConfirm(outcome: Outcome, action: "BUY" | "SELL") {
    setPendingTrade({ outcome, action });
    setConfirmVisible(true);
  }

  function confirmTrade() {
    if (pendingTrade) executeTrade(pendingTrade.action, pendingTrade.outcome.id);
    setConfirmVisible(false);
    setPendingTrade(null);
  }

  /* ── loading / error states ───────────────────────────────────────── */
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#fbbf24" size="large" />
      </View>
    );
  }

  if (error || !market) {
    return (
      <View style={s.screen}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color="#a78bfa" />
            <Text style={s.backText}>Markets</Text>
          </Pressable>
        </View>
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error || "Market not found."}</Text>
        </View>
      </View>
    );
  }

  const isActive    = market.status === "ACTIVE";
  const catIcon     = CATEGORY_ICONS[market.category ?? ""] ?? "📌";
  const catColor    = CATEGORY_COLORS[market.category ?? ""] ?? "#94a3b8";
  const pendingPrice = pendingTrade ? outcomePrices[pendingTrade.outcome.id] : undefined;

  return (
    <View style={s.screen}>
      {/* sticky top bar with back button */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color="#a78bfa" />
          <Text style={s.backText}>Markets</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <View style={s.hero}>
          <View style={[s.heroAccent, { backgroundColor: isActive ? "#a78bfa" : "#334155" }]} />
          <View style={s.badgeRow}>
            <View style={[s.catBadge, { borderColor: catColor + "55", backgroundColor: catColor + "22" }]}>
              <Text style={s.catBadgeText}>{catIcon} </Text>
              <Text style={[s.catBadgeText, { color: catColor }]}>{market.category}</Text>
            </View>
            {isActive ? (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            ) : (
              <View style={s.statusBadge}>
                <Text style={s.statusText}>{market.status}</Text>
              </View>
            )}
          </View>

          <Text style={s.heroTitle}>{market.title}</Text>
          {!!market.description && <Text style={s.heroDesc}>{market.description}</Text>}

          {!!market.closeTime && (
            <View style={s.closePill}>
              <Text style={s.closePillText}>
                📅  Closes {new Date(market.closeTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          )}
        </View>

        {/* ── OUTCOMES / TRADE ──────────────────────────────────── */}
        {market.outcomes && market.outcomes.length > 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Trade</Text>

            {market.outcomes.map((outcome, idx) => {
              const price = outcomePrices[outcome.id];
              const pct   = price !== undefined ? price * 100 : null;
              const isYes = idx === 0;
              const priceColor = isYes ? "#34d399" : "#f87171";
              const label = outcome.label || outcome.description || `Outcome ${idx + 1}`;

              return (
                <View key={String(outcome.id)} style={[s.outcomeRow, idx > 0 && s.outcomeRowBorder]}>
                  <View style={s.outcomeHeader}>
                    <View style={[s.outcomeIcon, { backgroundColor: priceColor + "22" }]}>
                      <Text style={[s.outcomeIconText, { color: priceColor }]}>{isYes ? "Y" : "N"}</Text>
                    </View>
                    <Text style={s.outcomeLabel} numberOfLines={2}>{label}</Text>
                    <View style={s.priceBlock}>
                      {pct !== null ? (
                        <>
                          <Text style={[s.priceValue, { color: priceColor }]}>{pct.toFixed(0)}¢</Text>
                          <Text style={s.priceSub}>{pct.toFixed(1)}%</Text>
                        </>
                      ) : (
                        <Text style={s.priceDash}>—</Text>
                      )}
                    </View>
                  </View>

                  {pct !== null && <ProbBar pct={pct} isYes={isYes} />}

                  <View style={s.tradeButtons}>
                    <Pressable
                      disabled={!isActive || tradeLoading}
                      onPress={() => openConfirm(outcome, "BUY")}
                      style={({ pressed }) => [
                        s.tradeBtn, s.buyBtn,
                        (!isActive || tradeLoading) && s.tradeBtnDisabled,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Text style={[s.tradeBtnText, { color: isActive ? "#34d399" : "#475569" }]}>Buy</Text>
                    </Pressable>
                    <Pressable
                      disabled={!isActive || tradeLoading}
                      onPress={() => openConfirm(outcome, "SELL")}
                      style={({ pressed }) => [
                        s.tradeBtn, s.sellBtn,
                        (!isActive || tradeLoading) && s.tradeBtnDisabled,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Text style={[s.tradeBtnText, { color: isActive ? "#fbbf24" : "#475569" }]}>Sell</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* trade feedback */}
            {(!!tradeError || !!tradeSuccess) && (
              <View style={[s.feedback, tradeError ? s.feedbackError : s.feedbackSuccess]}>
                <Text style={[s.feedbackText, { color: tradeError ? "#fca5a5" : "#6ee7b7" }]}>
                  {tradeError || tradeSuccess}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[s.card, s.centered]}>
            <Text style={{ color: "#475569", fontSize: 13 }}>No outcomes configured yet.</Text>
          </View>
        )}

        {/* ── DETAILS ───────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Details</Text>
          {!!market.closeTime && (
            <DetailRow label="Closes" value={new Date(market.closeTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
          )}
          {!!market.resolutionSource && (
            <DetailRow label="Resolution Source" value={market.resolutionSource} />
          )}
          {!!market.createdAt && (
            <DetailRow label="Created" value={new Date(market.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
          )}
          <DetailRow label="Outcomes" value={String(market.outcomes?.length ?? 0)} />
        </View>

        {/* ── RULES ─────────────────────────────────────────────── */}
        <View style={[s.card, { marginBottom: 32 }]}>
          <Text style={s.cardTitle}>Rules</Text>
          {[
            "Market resolves based on official results",
            "Trades execute instantly at displayed prices",
            "Winning shares pay out $1.00 each",
          ].map((rule) => (
            <View key={rule} style={s.ruleRow}>
              <Text style={s.ruleDot}>•</Text>
              <Text style={s.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── CONFIRM MODAL ─────────────────────────────────────────── */}
      <Modal visible={confirmVisible} transparent animationType="slide" onRequestClose={() => setConfirmVisible(false)}>
        <Pressable style={m.overlay} onPress={() => setConfirmVisible(false)}>
          <Pressable style={m.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={[m.sheetAccent, {
              backgroundColor: pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24",
            }]} />

            <Text style={m.title}>
              Confirm {pendingTrade?.action === "BUY" ? "Buy" : "Sell"}
            </Text>

            {/* qty picker */}
            <Text style={m.qtyLabel}>Shares to {pendingTrade?.action === "BUY" ? "buy" : "sell"}</Text>
            <View style={m.qtyRow}>
              {[10, 50, 100].map((qty) => {
                const selected = tradeQuantity === qty;
                const activeColor = pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24";
                return (
                  <Pressable
                    key={qty}
                    onPress={() => setTradeQuantity(qty)}
                    style={[m.qtyBtn, selected && { borderColor: activeColor + "99", backgroundColor: activeColor + "22" }]}
                  >
                    <Text style={[m.qtyNum, selected && { color: activeColor }]}>{qty}</Text>
                    <Text style={[m.qtySub, selected && { color: activeColor + "aa" }]}>shares</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* summary */}
            <View style={m.summary}>
              <View style={m.summaryRow}>
                <Text style={m.summaryLabel}>Action</Text>
                <Text style={[m.summaryValue, { color: pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24" }]}>
                  {pendingTrade?.action}
                </Text>
              </View>
              <View style={m.summaryRow}>
                <Text style={m.summaryLabel}>Outcome</Text>
                <Text style={m.summaryValue} numberOfLines={1}>
                  {pendingTrade?.outcome.label || pendingTrade?.outcome.description}
                </Text>
              </View>
              <View style={m.summaryRow}>
                <Text style={m.summaryLabel}>Price</Text>
                <Text style={m.summaryValue}>
                  {pendingPrice !== undefined ? `${(pendingPrice * 100).toFixed(0)}¢/share` : "—"}
                </Text>
              </View>
              {pendingPrice !== undefined && (
                <View style={[m.summaryRow, m.summaryTotal]}>
                  <Text style={m.totalLabel}>
                    Total {pendingTrade?.action === "BUY" ? "Cost" : "Proceeds"}
                  </Text>
                  <Text style={m.totalValue}>${(pendingPrice * tradeQuantity).toFixed(2)}</Text>
                </View>
              )}
            </View>

            <View style={m.actions}>
              <Pressable onPress={() => setConfirmVisible(false)} style={m.cancelBtn}>
                <Text style={m.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmTrade}
                style={[m.confirmBtn, {
                  borderColor: (pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24") + "66",
                  backgroundColor: (pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24") + "22",
                }]}
              >
                <Text style={[m.confirmText, { color: pendingTrade?.action === "BUY" ? "#34d399" : "#fbbf24" }]}>
                  Confirm {pendingTrade?.action === "BUY" ? "Buy" : "Sell"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── screen styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: "#080612" },
  scroll:          { padding: 12, paddingBottom: 32 },
  centered:        { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },

  /* sticky top navigation bar */
  topBar:          { backgroundColor: "#0a0716", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:         { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 2 },
  backText:        { fontSize: 15, color: "#a78bfa", fontWeight: "600" },

  /* hero */
  hero:            { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, backgroundColor: "rgba(109,40,217,0.12)", overflow: "hidden", padding: 16, marginBottom: 12 },
  heroAccent:      { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  badgeRow:        { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 12 },
  catBadge:        { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText:    { fontSize: 11, fontWeight: "700" },
  liveBadge:       { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" },
  liveText:        { fontSize: 11, fontWeight: "700", color: "#34d399" },
  statusBadge:     { borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:      { fontSize: 11, fontWeight: "700", color: "#fbbf24" },
  heroTitle:       { fontSize: 22, fontWeight: "900", color: "#fff", lineHeight: 28, marginBottom: 8 },
  heroDesc:        { fontSize: 13, color: "#64748b", lineHeight: 18, marginBottom: 10 },
  closePill:       { alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.03)" },
  closePillText:   { fontSize: 11, color: "#64748b" },

  /* shared card */
  card:            { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", marginBottom: 12, overflow: "hidden" },
  cardTitle:       { fontSize: 11, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: 1, padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },

  /* outcome */
  outcomeRow:      { padding: 14 },
  outcomeRowBorder:{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  outcomeHeader:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  outcomeIcon:     { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  outcomeIconText: { fontSize: 13, fontWeight: "900" },
  outcomeLabel:    { flex: 1, fontSize: 13, fontWeight: "700", color: "#f1f5f9", lineHeight: 18 },
  priceBlock:      { alignItems: "flex-end" },
  priceValue:      { fontSize: 22, fontWeight: "900" },
  priceSub:        { fontSize: 10, color: "#475569", marginTop: 1 },
  priceDash:       { fontSize: 18, color: "#334155" },

  /* trade buttons */
  tradeButtons:    { flexDirection: "row", gap: 10 },
  tradeBtn:        { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  buyBtn:          { borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)" },
  sellBtn:         { borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.1)" },
  tradeBtnDisabled:{ borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.03)" },
  tradeBtnText:    { fontSize: 13, fontWeight: "900" },

  /* feedback */
  feedback:        { margin: 14, marginTop: 0, borderRadius: 10, borderWidth: 1, padding: 12 },
  feedbackError:   { borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.06)" },
  feedbackSuccess: { borderColor: "rgba(52,211,153,0.2)", backgroundColor: "rgba(52,211,153,0.06)" },
  feedbackText:    { fontSize: 13 },

  /* error page */
  errorBox:        { margin: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderRadius: 12, backgroundColor: "rgba(239,68,68,0.06)", padding: 16 },
  errorText:       { color: "#fca5a5", fontSize: 13 },

  /* rules */
  ruleRow:         { flexDirection: "row", gap: 8, padding: 14, paddingTop: 0, paddingBottom: 0, marginBottom: 10 },
  ruleDot:         { color: "#fbbf24", fontSize: 14, lineHeight: 20 },
  ruleText:        { flex: 1, fontSize: 12, color: "#64748b", lineHeight: 18 },
});

/* ── modal styles ───────────────────────────────────────────────────── */
const m = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet:       { backgroundColor: "#0e0b1c", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", padding: 20, paddingBottom: 36 },
  sheetAccent: { height: 2, marginBottom: 16 },
  title:       { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 16 },

  qtyLabel:    { fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  qtyRow:      { flexDirection: "row", gap: 10, marginBottom: 16 },
  qtyBtn:      { flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  qtyNum:      { fontSize: 22, fontWeight: "900", color: "#475569" },
  qtySub:      { fontSize: 10, fontWeight: "600", color: "#334155", textTransform: "uppercase", marginTop: 2 },

  summary:     { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", padding: 14, marginBottom: 16 },
  summaryRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel:{ fontSize: 13, color: "#475569" },
  summaryValue:{ fontSize: 13, fontWeight: "700", color: "#fff", maxWidth: "60%" },
  summaryTotal:{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 10, marginBottom: 0 },
  totalLabel:  { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  totalValue:  { fontSize: 20, fontWeight: "900", color: "#fbbf24" },

  actions:     { flexDirection: "row", gap: 10 },
  cancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center" },
  cancelText:  { fontSize: 14, fontWeight: "700", color: "#64748b" },
  confirmBtn:  { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  confirmText: { fontSize: 14, fontWeight: "900" },
});
