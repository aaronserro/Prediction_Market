import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart } from "../../src/components/graphics";
import { Badge, Button, Card, DataUnavailable, ScreenTitle, Segmented, Txt, UnderlineTabs } from "../../src/components/ui";
import { fmt, normSeries, sgn } from "../../src/data/pryzm";
import { openMarket, posRow } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";

const RANGES = { "1D": [3, 0.4, "today"], "1W": [11, 1.6, "past week"], "1M": [23, 4.9, "past month"], ALL: [41, 18.4, "all time"] } as const;
type Range = keyof typeof RANGES;

export default function Portfolio() {
  const { c, bal, pos, px, posValue, pl, total, markets, resolved, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>("1M");
  const [tab, setTab] = useState("Open");

  const [seed, chg, lbl] = RANGES[range];
  const won = resolved.filter((r) => r.won).length;
  const rows = pos.map((x) => posRow(x, px, c, markets)).filter((row) => row !== null);

  const Stat = ({ label, value, color, onPress, right, bottom }: { label: string; value: string; color?: string; onPress?: () => void; right?: boolean; bottom?: boolean }) => (
    <Pressable onPress={onPress} disabled={!onPress} style={{ width: "50%", paddingVertical: 13, paddingHorizontal: 16, borderRightWidth: right ? 1 : 0, borderBottomWidth: bottom ? 1 : 0, borderColor: c.bd }}>
      <Txt s={12} c={c.mu} style={{ marginBottom: 3 }}>{label}</Txt>
      <Txt s={17} w={600} mono ls={-0.03} c={color ?? c.tx}>{value}</Txt>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {realDataUnavailable ? (
        <><View style={{ padding: 16 }}><ScreenTitle title="Portfolio" sub="Track your active positions across markets" /></View><DataUnavailable title="Real portfolio data is not configured" /></>
      ) : (
      <ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Portfolio" sub="Track your active positions across markets" />

        <Card style={{ overflow: "hidden" }}>
          <View style={{ paddingTop: 16, paddingHorizontal: 16 }}>
            <Txt s={12.5} c={c.mu} style={{ marginBottom: 4 }}>Portfolio value</Txt>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
              <Txt s={32} w={600} mono ls={-0.05}>{fmt(total)}</Txt>
              <Txt s={13} c={c.mu}>PZC</Txt>
            </View>
            <Txt s={12.5} w={500} mono c={c.yes} style={{ marginTop: 3 }}>
              {"+" + fmt((total * chg) / 100) + " (+" + chg.toFixed(1) + "%)"} <Txt s={12.5} c={c.mu}>{lbl}</Txt>
            </Txt>
          </View>
          <LineChart height={110} lines={[{ pts: normSeries(seed, 50), color: c.pr }]} area={{ color: c.prs }} style={{ marginTop: 12 }} />
          <View style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 14 }}>
            <Segmented items={Object.keys(RANGES) as Range[]} value={range} onChange={setRange} h={28} s={12.5} mono />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: c.bd }}>
            <Stat label="Cash balance" value={fmt(bal)} onPress={() => router.push("/wallet")} right bottom />
            <Stat label="In positions" value={fmt(posValue)} bottom />
            <Stat label="Open P/L" value={sgn(pl)} color={pl >= 0 ? c.yes : c.no} right />
            <Stat label="Win rate" value={(resolved.length ? Math.round((won / resolved.length) * 100) : 0) + "%"} />
          </View>
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <UnderlineTabs items={[{ label: "Open", count: pos.length }, { label: "Resolved", count: resolved.length }]} value={tab} onChange={setTab} />
          {tab === "Open" ? (
            rows.length ? (
              rows.map((p) => (
                <Pressable key={p.mid + p.oi} onPress={() => openMarket(p.mid)} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, gap: 9 }}>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt s={14} w={600} lh={1.35}>{p.title}</Txt>
                      <Txt s={12} c={c.mu} style={{ marginTop: 2 }}>{p.cat} · Closes {p.close}</Txt>
                    </View>
                    <Badge label={p.side} bg={p.sideBg} color={p.sideColor} />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Txt s={12.5} mono c={c.mu}>{p.qtyFmt} sh</Txt>
                    <Txt s={12.5} mono c={c.mu}>{p.avg} → <Txt s={12.5} mono>{p.now}</Txt></Txt>
                    <Txt s={12.5} mono style={{ marginLeft: "auto" }}>{p.value}</Txt>
                    <Txt s={12.5} mono w={600} c={p.plColor}>{p.pl} <Txt s={11.5} mono c={p.plColor}>{p.plPct}</Txt></Txt>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={{ paddingVertical: 32, paddingHorizontal: 20, alignItems: "center", gap: 8 }}>
                <Txt s={16} w={650}>No Positions Yet</Txt>
                <Txt s={13.5} lh={1.5} c={c.mu} center>You haven&apos;t made any trades yet. Start trading on markets to build your portfolio.</Txt>
                <Button label="Browse Markets" onPress={() => router.navigate("/(tabs)/search")} bg={c.am} color="#1d1300" h={42} s={14} radius={10} style={{ marginTop: 8, paddingHorizontal: 18 }} />
              </View>
            )
          ) : (
            resolved.map((r) => {
              const d = r.payout - r.cost;
              return (
                <View key={r.title} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, gap: 9 }}>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt s={14} w={600} lh={1.35}>{r.title}</Txt>
                      <Txt s={12} c={c.mu} style={{ marginTop: 2 }}>Resolved {r.date} · Your pick: {r.pick}</Txt>
                    </View>
                    <Badge label={r.won ? "Won" : "Lost"} bg={r.won ? c.yess : c.nos} color={r.won ? c.yes : c.no} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Txt s={12.5} mono c={c.mu}>{fmt(r.qty)} sh</Txt>
                    <Txt s={12.5} mono c={c.mu}>Payout <Txt s={12.5} mono>{fmt(r.payout)}</Txt></Txt>
                    <Txt s={12.5} mono w={600} c={d >= 0 ? c.yes : c.no} style={{ marginLeft: "auto" }}>{sgn(d)}</Txt>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
      )}
    </View>
  );
}
