import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorBox, Field, inputStyle } from "../src/components/forms";
import { PryzmLogo } from "../src/components/graphics";
import { Button, Txt } from "../src/components/ui";
import { login } from "../src/features/auth/authService";
import { useStore } from "../src/store/AppStore";

export default function Login() {
  const { c, fixtureDataEnabled } = useStore();
  const insets = useSafeAreaInsets();
  const [lu, setLu] = useState(fixtureDataEnabled ? "aaron" : "");
  const [lp, setLp] = useState(fixtureDataEnabled ? "password" : "");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async () => {
    if (!lu.trim() || !lp) { setErr("Enter your username and password."); return; }
    setErr("");
    setSubmitting(true);
    try {
      await login({ username: lu.trim(), password: lp });
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error && typeof error.message === "string"
          ? error.message
          : "Unable to sign in. Check your credentials and connection.";
      setErr(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 50, paddingBottom: insets.bottom + 24, paddingHorizontal: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 44 }}>
          <PryzmLogo size={32} />
          <Txt s={20} w={650} ls={-0.02}>Pryzm</Txt>
        </View>
        <Txt s={30} w={650} ls={-0.04} style={{ marginBottom: 6 }}>Welcome back</Txt>
        <Txt s={15} c={c.mu} style={{ marginBottom: 28 }}>Sign in to your account to continue</Txt>

        <View style={{ gap: 14 }}>
          <Field label="Username">
            <TextInput value={lu} onChangeText={setLu} placeholder="Enter your username" placeholderTextColor={c.mu} autoCapitalize="none" autoCorrect={false} style={inputStyle(c)} />
          </Field>
          <Field label="Password">
            <TextInput value={lp} onChangeText={setLp} placeholder="Enter your password" placeholderTextColor={c.mu} secureTextEntry onSubmitEditing={doLogin} style={inputStyle(c)} />
          </Field>
          {!!err && <ErrorBox msg={err} />}
          <Button label={submitting ? "Signing In…" : "Sign In"} onPress={doLogin} disabled={submitting} bg={c.pr} color="#fff" style={{ marginTop: 6 }} />
          <Button label="Create an account" onPress={() => router.push("/signup")} bg={c.sf} color={c.tx} border={c.bd2} h={48} s={15} />
        </View>

        <View style={{ marginTop: "auto", paddingTop: 24, borderTopWidth: 1, borderTopColor: c.bd, gap: 10 }}>
          <Txt s={12.5} lh={1.5} c={c.mu}>
            Pryzm lets you turn your opinions into ranked predictions using virtual currency. Questions?{" "}
            <Txt s={12.5} c={c.pr} onPress={() => Linking.openURL("mailto:pryzmcompany@gmail.com")}>pryzmcompany@gmail.com</Txt>
          </Txt>
          <Txt s={12.5} c={c.mu}>© 2026 Pryzm</Txt>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
