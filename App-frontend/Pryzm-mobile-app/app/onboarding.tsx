import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RankBadge } from "../src/components/graphics";
import { Button, DataUnavailable, Icon, Txt } from "../src/components/ui";
import { useStore } from "../src/store/AppStore";

const ICONS: Record<string, React.ComponentProps<typeof Icon>["name"]> = {
  on: "checkmark-circle", off: "add-circle-outline",
};

export default function Onboarding() {
  const { c, interests, setInterests, categories, ranks, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [ob, setOb] = useState(0);
  const finish = () => router.replace("/(tabs)/home");
  const card = { backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, borderRadius: 18 } as const;

  if (realDataUnavailable) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 8 }}>
        <DataUnavailable title="Live onboarding data is not configured" message="The fixture market walkthrough is disabled in real-data mode." />
        <Button label="Continue to app" onPress={finish} bg={c.pr} color="#fff" style={{ marginHorizontal: 24 }} />
      </View>
    );
  }

  const Heading = ({ children, sub }: { children: React.ReactNode; sub: string }) => (
    <View>
      <Txt s={32} w={650} ls={-0.045} lh={1.1} style={{ marginBottom: 10 }}>{children}</Txt>
      <Txt s={16} lh={1.55} c={c.tx2}>{sub}</Txt>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 40 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ height: 6, width: i === ob ? 22 : 6, borderRadius: 99, backgroundColor: i === ob ? c.pr : c.bd2 }} />
          ))}
        </View>
        <Pressable onPress={finish} hitSlop={8}><Txt s={14} w={550} c={c.mu}>Skip</Txt></Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
        {ob === 0 && (
          <>
            <View style={[card, { padding: 18, gap: 14 }]}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Txt s={12} c={c.mu} style={{ marginBottom: 4 }}>Finance</Txt>
                  <Txt s={15} w={600} lh={1.35}>Will the Bank of Canada cut rates in December?</Txt>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt s={24} w={600} mono ls={-0.04} c={c.pr}>64%</Txt>
                  <Txt s={11} c={c.mu}>chance</Txt>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: c.yess, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Txt s={14} w={600} c={c.yes}>Yes</Txt><Txt s={14} w={600} mono c={c.yes}>64</Txt>
                </View>
                <View style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: c.nos, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Txt s={14} w={600} c={c.no}>No</Txt><Txt s={14} w={600} mono c={c.no}>36</Txt>
                </View>
              </View>
            </View>
            <Heading sub="Buy shares in outcomes across sports, politics, finance and more. Prices run from 1 to 99 PZC and match the market's % chance.">
              Trade on what{"\n"}<Txt s={32} w={650} ls={-0.045} c={c.pr}>you know.</Txt>
            </Heading>
          </>
        )}
        {ob === 1 && (
          <>
            <View style={[card, { padding: 20, gap: 12 }]}>
              <Row k="You buy" v="100 Yes at 64" />
              <Row k="Cost" v="6,400 PZC" />
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: c.bd }}>
                <Txt s={14.5} w={600}>If Yes wins</Txt>
                <Txt s={18} w={600} mono c={c.yes}>10,000 PZC</Txt>
              </View>
              <Row k="If No wins" v="0 PZC" vColor={c.no} />
            </View>
            <Heading sub="If your outcome is right, every share pays out 100 PZC. You can sell at any time before the market closes.">
              Winning shares{"\n"}pay <Txt s={32} w={650} ls={-0.045} c={c.amt}>100 PZC.</Txt>
            </Heading>
          </>
        )}
        {ob === 2 && (
          <>
            <View style={[card, { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 4, paddingVertical: 28, paddingHorizontal: 12 }]}>
              {ranks.map((k, i) => <RankBadge key={k} rank={k} width={22 + i * 3.2} />)}
            </View>
            <Heading sub="Earn points for accurate predictions and good trades. Work your way from Bronze III to Gold I.">Climb the ranks.</Heading>
          </>
        )}
        {ob === 3 && (
          <>
            <Heading sub="We'll show these markets first. You can change this later.">What do you follow?</Heading>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {categories.map((label) => {
                const on = interests.includes(label);
                return (
                  <Pressable
                    key={label}
                    onPress={() => setInterests(on ? interests.filter((x) => x !== label) : [...interests, label])}
                    style={{ height: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: on ? c.pr : c.bd, backgroundColor: on ? c.prs : c.sf, flexDirection: "row", alignItems: "center", gap: 7 }}
                  >
                    <Icon name={on ? ICONS.on : ICONS.off} size={18} color={on ? c.prt : c.tx2} />
                    <Txt s={15} w={550} c={on ? c.prt : c.tx2}>{label}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      <Button label={ob < 3 ? "Continue" : "Start trading →"} onPress={() => (ob < 3 ? setOb(ob + 1) : finish())} bg={c.pr} color="#fff" />
    </View>
  );

  function Row({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Txt s={14.5} c={c.mu}>{k}</Txt>
        <Txt s={14.5} mono c={vColor ?? c.tx}>{v}</Txt>
      </View>
    );
  }
}
