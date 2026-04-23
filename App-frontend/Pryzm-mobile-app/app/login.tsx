import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/features/auth/AuthContext";
import { login } from "../src/features/auth/authService";

export default function LoginScreen() {
  const { refresh } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      await refresh();
      router.replace("/tabs/home" as any);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Text style={s.brand}>Pryzm</Text>

        {/* Heading */}
        <View style={s.headingBlock}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.subheading}>Sign in to your account to continue</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {/* Username */}
          <View style={s.field}>
            <Text style={s.label}>Username</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your username"
              placeholderTextColor="#334155"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor="#334155"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [s.submitBtn, (loading || pressed) && s.submitBtnPressed]}
          >
            {loading
              ? <ActivityIndicator color="#0b0e14" size="small" />
              : <Text style={s.submitText}>Sign In</Text>
            }
          </Pressable>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Pryzm lets you turn your opinions into ranked predictions using virtual currency.{" "}
            Questions?{" "}
            <Text style={s.footerLink}>pryzmcompany@gmail.com</Text>
          </Text>
          <Text style={s.copyright}>© 2026 Pryzm</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#0b0e14" },
  scroll:           { flexGrow: 1, paddingHorizontal: 28 },

  brand:            { fontSize: 22, fontWeight: "700", color: "#fff", letterSpacing: -0.5, marginBottom: 48 },

  headingBlock:     { marginBottom: 32 },
  heading:          { fontSize: 26, fontWeight: "600", color: "#fff", marginBottom: 4 },
  subheading:       { fontSize: 14, color: "#64748b" },

  form:             { gap: 16, marginBottom: 40 },

  field:            { gap: 6 },
  label:            { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 },
  input:            {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#fff",
  },

  errorBox:         {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorText:        { fontSize: 13, color: "#f87171" },

  submitBtn:        {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnPressed: { backgroundColor: "#cbd5e1" },
  submitText:       { fontSize: 15, fontWeight: "700", color: "#0b0e14" },

  footer:           { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 24, gap: 12 },
  footerText:       { fontSize: 12, color: "#475569", lineHeight: 18 },
  footerLink:       { color: "#64748b" },
  copyright:        { fontSize: 11, color: "#1e293b" },
});