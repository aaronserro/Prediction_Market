import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/features/auth/AuthContext";
import { apiClient } from "../src/services/api/client";

/* ── types ───────────────────────────────────────────────────────────── */
type Wallet = {
  balanceCents?: number;
  updatedAt?: string;
};
type FundRequest = {
  id: string | number;
  amountCents: number;
  reason?: string;
  status: string;
  createdAt?: string;
  processedAt?: string;
};

/* ── currency helper ─────────────────────────────────────────────────── */
function centsToCAD(cents: number) {
  return `$${((Number(cents) || 0) / 100).toFixed(2)} CAD`;
}

/* ── reason options ──────────────────────────────────────────────────── */
const REASONS = [
  "Account top-up",
  "Tournament entry",
  "Promotional credit",
  "Referral reward",
  "Other",
];

/* ── status helpers ──────────────────────────────────────────────────── */
function statusColor(status: string) {
  if (status === "APPROVED") return "#34d399";
  if (status === "REJECTED") return "#f87171";
  if (status === "PENDING")  return "#fbbf24";
  return "#94a3b8";
}
function statusBg(status: string) {
  if (status === "APPROVED") return "rgba(52,211,153,0.1)";
  if (status === "REJECTED") return "rgba(248,113,113,0.1)";
  if (status === "PENDING")  return "rgba(251,191,36,0.1)";
  return "rgba(255,255,255,0.04)";
}
function statusBorder(status: string) {
  if (status === "APPROVED") return "rgba(52,211,153,0.3)";
  if (status === "REJECTED") return "rgba(248,113,113,0.3)";
  if (status === "PENDING")  return "rgba(251,191,36,0.3)";
  return "rgba(255,255,255,0.08)";
}

/* ── main screen ─────────────────────────────────────────────────────── */
export default function WalletScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const userId = (user as any)?.userId ?? (user as any)?.id ?? user?.username;

  const [wallet,           setWallet]          = useState<Wallet | null>(null);
  const [loadingWallet,    setLoadingWallet]    = useState(false);
  const [requests,         setRequests]         = useState<FundRequest[]>([]);
  const [loadingRequests,  setLoadingRequests]  = useState(false);
  const [amount,           setAmount]           = useState("");
  const [reason,           setReason]           = useState("Account top-up");
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState("");
  const [success,          setSuccess]          = useState("");
  const [reasonModal,      setReasonModal]      = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!userId) return;
    setLoadingWallet(true);
    setError("");
    try {
      const w = await apiClient.get(`/api/v1/users/${userId}/wallet`);
      setWallet(w);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load wallet.");
    } finally {
      setLoadingWallet(false);
    }
  }, [userId]);

  const refreshRequests = useCallback(async () => {
    if (!userId) return;
    setLoadingRequests(true);
    try {
      const list = await apiClient.get(`/api/v1/users/${userId}/wallet/fund-requests`);
      setRequests(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load fund requests.");
    } finally {
      setLoadingRequests(false);
    }
  }, [userId]);

  useEffect(() => { refreshWallet(); },   [refreshWallet]);
  useEffect(() => { refreshRequests(); }, [refreshRequests]);

  const balancePretty = useMemo(() => centsToCAD(wallet?.balanceCents ?? 0), [wallet]);

  async function onRequestFunds() {
    setError("");
    setSuccess("");
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setError("Enter a positive amount."); return; }
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    setSubmitting(true);
    try {
      await apiClient.post(`/api/v1/users/${userId}/wallet/fund-requests`, {
        amountCents: cents,
        reason,
      });
      setAmount("");
      setReason("Account top-up");
      setSuccess("Fund request submitted! You'll receive an email when it's processed.");
      await Promise.all([refreshWallet(), refreshRequests()]);
    } catch (e: any) {
      setError(e?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.screen}>
      {/* sticky top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color="#a78bfa" />
          <Text style={s.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* heading */}
        <View style={s.hero}>
          <View style={s.heroAccent} />
          <Text style={s.heroTitle}>Wallet</Text>
          <Text style={s.heroSub}>Request funds to add to your account balance</Text>
        </View>

        {/* error / success banners */}
        {!!error && (
          <View style={[s.banner, s.bannerError]}>
            <Text style={[s.bannerTitle, { color: "#f87171" }]}>Error</Text>
            <Text style={[s.bannerBody, { color: "#fca5a5" }]}>{error}</Text>
          </View>
        )}
        {!!success && (
          <View style={[s.banner, s.bannerSuccess]}>
            <Text style={[s.bannerTitle, { color: "#34d399" }]}>Success</Text>
            <Text style={[s.bannerBody, { color: "#6ee7b7" }]}>{success}</Text>
          </View>
        )}

        {/* balance card */}
        <View style={s.balanceCard}>
          <View style={s.walletIconBox}>
            <Ionicons name="wallet-outline" size={24} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.balanceLabel}>Current Balance</Text>
            <Text style={s.balanceValue}>{loadingWallet ? "…" : balancePretty}</Text>
            {!!wallet?.updatedAt && (
              <Text style={s.balanceUpdated}>
                Last updated: {new Date(wallet.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {/* request funds card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="add-circle-outline" size={18} color="#a78bfa" />
            <Text style={s.cardTitle}>Request Funds</Text>
          </View>

          {/* amount input */}
          <Text style={s.fieldLabel}>Amount (CAD)</Text>
          <View style={s.amountRow}>
            <Text style={s.dollarSign}>$</Text>
            <TextInput
              style={s.amountInput}
              placeholder="100.00"
              placeholderTextColor="#334155"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
            />
          </View>

          {/* reason picker */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Reason</Text>
          <Pressable onPress={() => setReasonModal(true)} style={s.reasonBtn}>
            <Text style={s.reasonBtnText}>{reason}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>

          {/* submit */}
          <Pressable
            onPress={onRequestFunds}
            disabled={submitting}
            style={({ pressed }) => [s.submitBtn, (submitting || pressed) && { opacity: 0.7 }]}
          >
            {submitting
              ? <ActivityIndicator color="#1a0a00" size="small" />
              : <Text style={s.submitText}>Submit Request</Text>
            }
          </Pressable>

          <Text style={s.hint}>
            An admin will review your request. You'll be notified once it's processed.
          </Text>
        </View>

        {/* history card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text-outline" size={18} color="#a78bfa" />
            <Text style={s.cardTitle}>Request History</Text>
          </View>

          {loadingRequests ? (
            <View style={s.historyLoading}>
              <ActivityIndicator color="#fbbf24" />
            </View>
          ) : requests.length === 0 ? (
            <Text style={s.emptyText}>No fund requests yet</Text>
          ) : (
            requests.map((req) => (
              <View key={String(req.id)} style={s.reqRow}>
                <View style={s.reqTop}>
                  <Text style={s.reqAmount}>{centsToCAD(req.amountCents)}</Text>
                  <View style={[s.statusBadge, { backgroundColor: statusBg(req.status), borderColor: statusBorder(req.status) }]}>
                    <Text style={[s.statusText, { color: statusColor(req.status) }]}>{req.status}</Text>
                  </View>
                </View>
                {!!req.reason && <Text style={s.reqReason}>{req.reason}</Text>}
                <Text style={s.reqDate}>
                  Requested: {req.createdAt ? new Date(req.createdAt).toLocaleString() : "—"}
                </Text>
                {!!req.processedAt && (
                  <Text style={s.reqDate}>
                    Processed: {new Date(req.processedAt).toLocaleString()}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* reason picker modal */}
      <Modal visible={reasonModal} transparent animationType="slide">
        <Pressable style={m.overlay} onPress={() => setReasonModal(false)}>
          <Pressable style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.sheetTitle}>Select Reason</Text>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => { setReason(r); setReasonModal(false); }}
                style={[m.option, reason === r && m.optionSelected]}
              >
                <Text style={[m.optionText, reason === r && m.optionTextSelected]}>{r}</Text>
                {reason === r && <Ionicons name="checkmark" size={16} color="#a78bfa" />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── styles ──────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080612" },
  scroll: { padding: 12, paddingBottom: 40 },

  topBar:   { backgroundColor: "#0a0716", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:  { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  backText: { fontSize: 15, color: "#a78bfa", fontWeight: "600" },

  hero:       { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, backgroundColor: "rgba(109,40,217,0.12)", overflow: "hidden", padding: 16, marginBottom: 12 },
  heroAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#a78bfa" },
  heroTitle:  { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 4 },
  heroSub:    { fontSize: 13, color: "#475569" },

  banner:        { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  bannerError:   { borderColor: "rgba(239,68,68,0.2)",  backgroundColor: "rgba(239,68,68,0.06)" },
  bannerSuccess: { borderColor: "rgba(52,211,153,0.2)", backgroundColor: "rgba(52,211,153,0.06)" },
  bannerTitle:   { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  bannerBody:    { fontSize: 13, lineHeight: 18 },

  balanceCard:    { borderWidth: 1, borderColor: "rgba(251,191,36,0.2)", borderRadius: 16, backgroundColor: "rgba(251,191,36,0.05)", padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  walletIconBox:  { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(251,191,36,0.1)", borderWidth: 1, borderColor: "rgba(251,191,36,0.2)", alignItems: "center", justifyContent: "center" },
  balanceLabel:   { fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  balanceValue:   { fontSize: 28, fontWeight: "900", color: "#fff" },
  balanceUpdated: { fontSize: 11, color: "#334155", marginTop: 4 },

  card:       { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", marginBottom: 12, padding: 18 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle:  { fontSize: 13, fontWeight: "900", color: "#fff", textTransform: "uppercase", letterSpacing: 0.8 },

  fieldLabel:  { fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  amountRow:   { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 12 },
  dollarSign:  { fontSize: 16, color: "#475569", fontWeight: "600", marginRight: 4 },
  amountInput: { flex: 1, fontSize: 16, color: "#fff", paddingVertical: 13 },

  reasonBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  reasonBtnText: { fontSize: 14, color: "#fff" },

  submitBtn:  { backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  submitText: { fontSize: 15, fontWeight: "900", color: "#1a0a00" },
  hint:       { fontSize: 11, color: "#334155", lineHeight: 16, textAlign: "center" },

  historyLoading: { paddingVertical: 28, alignItems: "center" },
  emptyText:      { fontSize: 13, color: "#475569", textAlign: "center", paddingVertical: 24 },

  reqRow:    { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.02)", padding: 14, marginBottom: 10 },
  reqTop:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  reqAmount: { fontSize: 18, fontWeight: "900", color: "#fff" },
  statusBadge:{ borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  reqReason: { fontSize: 13, color: "#94a3b8", marginBottom: 6 },
  reqDate:   { fontSize: 11, color: "#334155" },
});

const m = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:           { backgroundColor: "#0e0b1c", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle:          { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "center", marginBottom: 18 },
  sheetTitle:      { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 14 },
  option:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  optionSelected:  { },
  optionText:      { fontSize: 15, color: "#94a3b8" },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
});
