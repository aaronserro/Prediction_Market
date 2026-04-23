import { router } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../features/auth/AuthContext";
import { clearToken } from "../services/storage/authStorage";

export default function AppHeader() {
  const { user, refresh } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const username = user?.username ?? "";
  const initial = username.charAt(0).toUpperCase();

  async function handleLogout() {
    setMenuVisible(false);
    await clearToken();
    await refresh();
    router.replace("/login" as any);
  }

  function navigate(path: string) {
    setMenuVisible(false);
    router.push(path as any);
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0a18" />

      {/* ── header bar ─────────────────────────────────────────── */}
      <SafeAreaView style={s.safeArea}>
        <View style={s.bar}>

          {/* Brand */}
          <Pressable onPress={() => router.push("/tabs/home" as any)} style={s.brand}>
            <View style={s.logoBox}>
              <Text style={s.bolt}>⚡</Text>
            </View>
            <Text style={s.brandName}>Pryzm</Text>
          </Pressable>

          {/* Right: avatar button */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={s.avatarBtn}
            activeOpacity={0.75}
          >
            <View style={s.avatarBox}>
              <Text style={s.avatarLetter}>{initial}</Text>
            </View>
            <Text style={s.usernameText} numberOfLines={1}>{username}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── user menu modal ─────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={s.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={s.menu} onPress={(e) => e.stopPropagation()}>
            {/* user info row */}
            <View style={s.menuHeader}>
              <View style={s.menuAvatar}>
                <Text style={s.menuAvatarLetter}>{initial}</Text>
              </View>
              <Text style={s.menuUsername}>{username}</Text>
            </View>

            <View style={s.divider} />

            <MenuItem label="Settings" onPress={() => navigate("/settings")} />
            <MenuItem label="Wallet"   onPress={() => navigate("/wallet")} />

            <View style={s.divider} />

            <MenuItem label="Sign out" onPress={handleLogout} danger />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={s.menuItem} activeOpacity={0.7}>
      <Text style={[s.menuItemText, danger && s.menuItemDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safeArea:           { backgroundColor: "#0d0a18", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  bar:                { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },

  /* brand */
  brand:              { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox:            { width: 28, height: 28, borderRadius: 8, backgroundColor: "#6d28d9", alignItems: "center", justifyContent: "center", shadowColor: "#7c3aed", shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  bolt:               { fontSize: 14 },
  brandName:          { fontSize: 15, fontWeight: "700", color: "#c4b5fd" },

  /* avatar button */
  avatarBtn:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)" },
  avatarBox:          { width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  avatarLetter:       { fontSize: 11, fontWeight: "700", color: "#fff" },
  usernameText:       { fontSize: 13, color: "#cbd5e1", maxWidth: 90 },
  chevron:            { fontSize: 18, color: "#475569", lineHeight: 20 },

  /* overlay + menu */
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 60, paddingRight: 12 },
  menu:               { width: 180, borderRadius: 12, backgroundColor: "#131820", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 20, elevation: 12, overflow: "hidden" },

  menuHeader:         { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  menuAvatar:         { width: 30, height: 30, borderRadius: 8, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  menuAvatarLetter:   { fontSize: 13, fontWeight: "700", color: "#fff" },
  menuUsername:       { fontSize: 13, fontWeight: "600", color: "#f1f5f9", flex: 1 },

  divider:            { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  menuItem:           { paddingHorizontal: 14, paddingVertical: 12 },
  menuItemText:       { fontSize: 14, color: "#cbd5e1" },
  menuItemDanger:     { color: "#f87171" },
});
