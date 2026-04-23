import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/features/auth/AuthContext";

/* ── daily limit options ─────────────────────────────────────────────── */
const DAILY_LIMITS = ["No Limit", "$50 / day", "$100 / day", "$250 / day", "$500 / day"];

/* ── section header ──────────────────────────────────────────────────── */
function SectionHeader({
  icon,
  iconColor,
  iconBg,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
}) {
  return (
    <View style={sh.row}>
      <View style={[sh.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={sh.title}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title:   { fontSize: 17, fontWeight: "800", color: "#fff" },
});

/* ── toggle row ──────────────────────────────────────────────────────── */
function ToggleRow({
  label,
  description,
  value,
  onChange,
  last = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[tr.row, last && tr.lastRow]}>
      <View style={tr.text}>
        <Text style={tr.label}>{label}</Text>
        <Text style={tr.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#1e293b", true: "#f59e0b" }}
        thumbColor="#fff"
        ios_backgroundColor="#1e293b"
      />
    </View>
  );
}
const tr = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  lastRow: { borderBottomWidth: 0 },
  text:    { flex: 1, paddingRight: 12 },
  label:   { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 2 },
  desc:    { fontSize: 12, color: "#64748b", lineHeight: 16 },
});

/* ── info field ──────────────────────────────────────────────────────── */
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={inf.wrap}>
      <Text style={inf.label}>{label}</Text>
      <View style={inf.box}>
        <Text style={inf.value}>{value}</Text>
      </View>
    </View>
  );
}
const inf = StyleSheet.create({
  wrap:  { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "500", color: "#64748b", marginBottom: 6 },
  box:   { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: 14, paddingVertical: 12 },
  value: { fontSize: 14, color: "#fff" },
});

/* ── main screen ─────────────────────────────────────────────────────── */
export default function SettingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  /* notification toggles */
  const [emailNotifications,    setEmailNotifications]    = useState(true);
  const [pushNotifications,     setPushNotifications]     = useState(false);
  const [marketAlerts,          setMarketAlerts]          = useState(true);
  const [tournamentUpdates,     setTournamentUpdates]     = useState(true);
  const [winLossNotifications,  setWinLossNotifications]  = useState(true);

  /* security toggles */
  const [twoFactorAuth,  setTwoFactorAuth]  = useState(false);
  const [publicProfile,  setPublicProfile]  = useState(true);
  const [showStats,      setShowStats]      = useState(true);

  /* betting prefs */
  const [autoRenewBets,   setAutoRenewBets]   = useState(false);
  const [betConfirmation, setBetConfirmation] = useState(true);
  const [dailyLimit,      setDailyLimit]      = useState("No Limit");
  const [limitModal,      setLimitModal]      = useState(false);

  function onChangePassword() {
    Alert.alert("Change Password", "Password change functionality coming soon.");
  }
  function onDeactivate() {
    Alert.alert("Deactivate Account", "Are you sure you want to temporarily disable your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Deactivate", style: "destructive", onPress: () => {} },
    ]);
  }
  function onDelete() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} },
      ]
    );
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

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* heading */}
        <View style={s.hero}>
          <View style={s.heroAccent} />
          <Text style={s.heroTitle}>⚙️  Settings</Text>
          <Text style={s.heroSub}>Manage your account preferences and security settings</Text>
        </View>

        {/* ── Profile Information ────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader icon="person-outline" iconColor="#fbbf24" iconBg="rgba(251,191,36,0.15)" title="Profile Information" />
          <InfoField label="Username"     value={(user as any)?.username || "Guest"} />
          <InfoField label="Email"        value={(user as any)?.email    || "Not provided"} />
          <InfoField
            label="Member Since"
            value={(user as any)?.createdAt
              ? new Date((user as any).createdAt).toLocaleDateString()
              : "N/A"}
          />
        </View>

        {/* ── Notifications ──────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader icon="notifications-outline" iconColor="#818cf8" iconBg="rgba(129,140,248,0.15)" title="Notifications" />
          <ToggleRow label="Email Notifications"    description="Receive updates and alerts via email"              value={emailNotifications}   onChange={setEmailNotifications} />
          <ToggleRow label="Push Notifications"     description="Get real-time notifications on your device"        value={pushNotifications}    onChange={setPushNotifications} />
          <ToggleRow label="Market Alerts"          description="Notifications about market changes and closures"   value={marketAlerts}         onChange={setMarketAlerts} />
          <ToggleRow label="Tournament Updates"     description="Get notified about tournament events"              value={tournamentUpdates}    onChange={setTournamentUpdates} />
          <ToggleRow label="Win/Loss Notifications" description="Receive alerts when your bets are settled"         value={winLossNotifications} onChange={setWinLossNotifications} last />
        </View>

        {/* ── Security & Privacy ─────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader icon="shield-checkmark-outline" iconColor="#4ade80" iconBg="rgba(74,222,128,0.15)" title="Security & Privacy" />
          <ToggleRow label="Two-Factor Authentication" description="Add an extra layer of security to your account"   value={twoFactorAuth} onChange={setTwoFactorAuth} />
          <ToggleRow label="Public Profile"            description="Allow others to view your betting history"         value={publicProfile} onChange={setPublicProfile} />
          <ToggleRow label="Show Statistics"           description="Display your win rate and stats on your profile"   value={showStats}     onChange={setShowStats}     last />
          <View style={s.divider} />
          <Pressable
            onPress={onChangePassword}
            style={({ pressed }) => [s.changePassBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={s.changePassText}>🔑  Change Password</Text>
          </Pressable>
        </View>

        {/* ── Betting Preferences ────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader icon="bar-chart-outline" iconColor="#c084fc" iconBg="rgba(192,132,252,0.15)" title="Betting Preferences" />
          <ToggleRow label="Auto-Renew Bets"  description="Automatically place similar bets in recurring markets" value={autoRenewBets}   onChange={setAutoRenewBets} />
          <ToggleRow label="Bet Confirmation" description="Require confirmation before placing bets"               value={betConfirmation} onChange={setBetConfirmation} last />
          <View style={s.divider} />
          <Text style={s.fieldLabel}>Daily Betting Limit</Text>
          <Pressable onPress={() => setLimitModal(true)} style={s.pickerBtn}>
            <Text style={s.pickerText}>{dailyLimit}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
        </View>

        {/* ── Danger Zone ────────────────────────────────────────── */}
        <View style={[s.card, s.dangerCard]}>
          <SectionHeader icon="warning-outline" iconColor="#f87171" iconBg="rgba(248,113,113,0.15)" title="Danger Zone" />

          {/* Deactivate */}
          <View style={s.dangerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerLabel}>Deactivate Account</Text>
              <Text style={s.dangerDesc}>Temporarily disable your account</Text>
            </View>
            <Pressable onPress={onDeactivate} style={s.deactivateBtn}>
              <Text style={s.deactivateBtnText}>Deactivate</Text>
            </Pressable>
          </View>

          {/* Delete */}
          <View style={[s.dangerRow, s.deleteRow]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.dangerLabel, { color: "#fca5a5" }]}>Delete Account</Text>
              <Text style={[s.dangerDesc, { color: "#f87171" }]}>Permanently delete your account and all data</Text>
            </View>
            <Pressable onPress={onDelete} style={s.deleteBtn}>
              <Text style={s.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {/* footer */}
        <Text style={s.footer}>© 2026 Pryzm. All rights reserved.</Text>
      </ScrollView>

      {/* daily limit modal */}
      <Modal visible={limitModal} transparent animationType="slide">
        <Pressable style={m.overlay} onPress={() => setLimitModal(false)}>
          <Pressable style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.sheetTitle}>Daily Betting Limit</Text>
            {DAILY_LIMITS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => { setDailyLimit(opt); setLimitModal(false); }}
                style={m.option}
              >
                <Text style={[m.optionText, dailyLimit === opt && m.optionSelected]}>{opt}</Text>
                {dailyLimit === opt && <Ionicons name="checkmark" size={16} color="#a78bfa" />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080612" },
  scroll: { padding: 12, paddingBottom: 48 },

  topBar:   { backgroundColor: "#0a0716", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:  { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  backText: { fontSize: 15, color: "#a78bfa", fontWeight: "600" },

  hero:       { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, backgroundColor: "rgba(109,40,217,0.12)", overflow: "hidden", padding: 16, marginBottom: 12 },
  heroAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#a78bfa" },
  heroTitle:  { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 4 },
  heroSub:    { fontSize: 13, color: "#475569" },

  card:       { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", padding: 18, marginBottom: 12 },
  dangerCard: { borderColor: "rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.04)" },

  divider:   { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 16 },
  fieldLabel:{ fontSize: 12, fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },

  changePassBtn:  { backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  changePassText: { fontSize: 14, fontWeight: "700", color: "#a5b4fc" },

  pickerBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 14, paddingVertical: 13 },
  pickerText: { fontSize: 14, color: "#fff" },

  dangerRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  deleteRow:    { borderBottomWidth: 0, backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 12, paddingHorizontal: 12, marginTop: 8 },
  dangerLabel:  { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  dangerDesc:   { fontSize: 12, color: "#64748b" },
  deactivateBtn:{ backgroundColor: "#1e293b", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  deactivateBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  deleteBtn:    { backgroundColor: "#dc2626", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  deleteBtnText:{ fontSize: 13, fontWeight: "600", color: "#fff" },

  footer: { fontSize: 12, color: "#1e293b", textAlign: "center", marginTop: 8 },
});

const m = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:          { backgroundColor: "#0e0b1c", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle:         { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "center", marginBottom: 18 },
  sheetTitle:     { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 14 },
  option:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  optionText:     { fontSize: 15, color: "#94a3b8" },
  optionSelected: { color: "#fff", fontWeight: "700" },
});
