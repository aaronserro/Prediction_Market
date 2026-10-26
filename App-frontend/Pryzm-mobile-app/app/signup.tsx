import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Icon, Txt } from "../src/components/ui";
import { ErrorBox, Field, inputStyle } from "../src/components/forms";
import { useStore } from "../src/store/AppStore";

export default function Signup() {
  const { c } = useStore();
  const insets = useSafeAreaInsets();
  const [su, setSu] = useState("");
  const [se, setSe] = useState("");
  const [sp, setSp] = useState("");
  const [err, setErr] = useState("");

  const doSignup = () => {
    const e = su.trim().length < 3 ? "Username must be at least 3 characters."
      : !/^\S+@\S+\.\S+$/.test(se) ? "Enter a valid email address."
      : sp.length < 8 ? "Password must be at least 8 characters." : "";
    if (e) { setErr(e); return; }
    setErr("");
    router.replace("/onboarding");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 28 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, marginLeft: -10, marginBottom: 28, alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevron-back" size={24} color={c.tx} />
        </Pressable>
        <Txt s={30} w={650} ls={-0.04} style={{ marginBottom: 6 }}>Create your account</Txt>
        <Txt s={15} c={c.mu} style={{ marginBottom: 28 }}>Free to play with PZC. No real money, ever.</Txt>
        <View style={{ gap: 14 }}>
          <Field label="Username">
            <TextInput value={su} onChangeText={setSu} placeholder="Pick a username" placeholderTextColor={c.mu} autoCapitalize="none" autoCorrect={false} style={inputStyle(c)} />
          </Field>
          <Field label="Email">
            <TextInput value={se} onChangeText={setSe} placeholder="you@example.com" placeholderTextColor={c.mu} keyboardType="email-address" autoCapitalize="none" style={inputStyle(c)} />
          </Field>
          <Field label="Password" hint={<Txt s={12} c={sp.length >= 8 ? c.yes : c.mu}>{sp.length >= 8 ? "Looks good" : "At least 8 characters"}</Txt>}>
            <TextInput value={sp} onChangeText={setSp} placeholder="Create a password" placeholderTextColor={c.mu} secureTextEntry style={inputStyle(c)} />
          </Field>
          {!!err && <ErrorBox msg={err} />}
          <Button label="Create account" onPress={doSignup} bg={c.pr} color="#fff" style={{ marginTop: 6 }} />
        </View>
        <Txt s={13} c={c.mu} center style={{ marginTop: "auto", paddingTop: 24 }}>
          Already have an account? <Txt s={13} w={600} c={c.pr} onPress={() => router.back()}>Sign in</Txt>
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
