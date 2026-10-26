import { router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, PageScreen, Segmented, Toggle, Txt } from "../src/components/ui";
import { Prefs, useStore } from "../src/store/AppStore";

const LIMITS = ["No limit", "500 PZC / day", "1,000 PZC / day", "2,500 PZC / day", "5,000 PZC / day"];

const NOTIF: [keyof Prefs, string, string][] = [
  ["email", "Email Notifications", "Receive updates and alerts via email"],
  ["push", "Push Notifications", "Get real-time notifications on your device"],
  ["alerts", "Market Alerts", "Notifications about market changes and closures"],
  ["tourn", "Tournament Updates", "Get notified about tournament events"],
  ["winloss", "Win/Loss Notifications", "Receive alerts when your trades are settled"],
];
const PRIVACY: [keyof Prefs, string, string][] = [
  ["twofa", "Two-Factor Authentication", "Add an extra layer of security to your account"],
  ["pub", "Public Profile", "Allow others to view your trading history"],
  ["stats", "Show Statistics", "Display your win rate and stats on your profile"],
];
const TRADING: [keyof Prefs, string, string][] = [["confirm", "Trade Confirmation", "Require confirmation before placing trades"]];

export default function Settings() {
  const { c, theme, setTheme, prefs, setPrefs, limit, setLimit, signOut, user } = useStore();

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <>
      <Txt s={12.5} w={600} c={c.mu} style={{ paddingHorizontal: 4 }}>{title}</Txt>
      <View style={{ backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>{children}</View>
    </>
  );

  const toggles = (list: [keyof Prefs, string, string][]) =>
    list.map(([k, label, desc]) => (
      <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.bd }}>
        <View style={{ flex: 1 }}>
          <Txt s={14.5} w={550}>{label}</Txt>
          <Txt s={12} c={c.mu} style={{ marginTop: 1 }}>{desc}</Txt>
        </View>
        <Toggle on={prefs[k]} onPress={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
      </View>
    ));

  const kv = (k: string, v: string, last?: boolean) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.bd }}>
      <Txt s={14.5} c={c.mu}>{k}</Txt>
      <Txt s={14.5}>{v}</Txt>
    </View>
  );

  return (
    <PageScreen title="Settings">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 8 }}>
        <Section title="Account">
          {kv("Username", user?.name ?? "Unavailable")}
          {kv("Email", user?.email ?? "Unavailable")}
          {kv("Member Since", user?.joined ?? "Unavailable", true)}
        </Section>

        <Section title="Appearance">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14 }}>
            <Txt s={14.5} w={550}>Theme</Txt>
            <Segmented items={["Light", "Dark"] as const} value={theme === "dark" ? "Dark" : "Light"} onChange={(l) => setTheme(l === "Dark" ? "dark" : "light")} h={28} s={13} stretch={false} />
          </View>
        </Section>

        <Section title="Notifications">{toggles(NOTIF)}</Section>
        <Section title="Privacy & security">{toggles(PRIVACY)}</Section>
        <Section title="Trading">
          {toggles(TRADING)}
          <View style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
            <Txt s={14.5} w={550} style={{ marginBottom: 8 }}>Daily Trading Limit</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {LIMITS.map((l) => {
                const on = l === limit;
                return (
                  <Pressable key={l} onPress={() => setLimit(l)} style={{ height: 32, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: on ? c.pr : c.bd, backgroundColor: on ? c.prs : c.sf, justifyContent: "center" }}>
                    <Txt s={12.5} w={550} c={on ? c.prt : c.tx2}>{l}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Section>

        <Button label="Sign out" onPress={() => { signOut(); router.dismissAll(); router.replace("/"); }} bg={c.sf} color={c.no} border={c.bd} h={48} s={15} />
      </ScrollView>
    </PageScreen>
  );
}
