import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/features/auth/AuthContext";
import { clearToken } from "../../src/services/storage/authStorage";

export default function ProfileScreen() {
  const { user } = useAuth();

  async function handleLogout() {
    await clearToken();
    router.replace("/login" as any);
  }

  const username = user?.username ?? "—";
  const rankKey = null; // fetch rank here in a future step

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>

      {/* info rows */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Username</Text>
          <Text style={styles.rowValue}>{username}</Text>
        </View>
      </View>

      {/* logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#080612" },
  avatarRow:     { alignItems: "center", paddingVertical: 32, gap: 14 },
  avatar:        { width: 80, height: 80, borderRadius: 22, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  avatarLetter:  { fontSize: 34, fontWeight: "900", color: "#fff" },
  username:      { fontSize: 22, fontWeight: "800", color: "#fff" },
  card:          { borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.03)", marginBottom: 16 },
  row:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rowLabel:      { fontSize: 14, color: "#64748b" },
  rowValue:      { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  logoutBtn:     { marginTop: 24, borderWidth: 1, borderColor: "rgba(239,68,68,0.35)", borderRadius: 14, backgroundColor: "rgba(239,68,68,0.1)", paddingVertical: 14, alignItems: "center" },
  logoutText:    { fontSize: 15, fontWeight: "700", color: "#f87171" },
});
