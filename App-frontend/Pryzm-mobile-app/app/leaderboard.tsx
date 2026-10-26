import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RankBadge } from "../src/components/graphics";
import { Avatar, Card, Chips, DataUnavailable, PageScreen, Segmented, Txt } from "../src/components/ui";
import { fmt, hash, rankIndex, rng } from "../src/data/pryzm";
import { myRank } from "../src/lib/market";
import { useStore } from "../src/store/AppStore";

const TYPES = ["Overall", "Trader", "Predictor"] as const;
const PERIODS = ["Week", "Month", "All time"] as const;

export default function Leaderboard() {
  const { c, user, leaderboardUsers, ranks, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<(typeof TYPES)[number]>("Overall");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Week");

  if (realDataUnavailable || !user) {
    return <PageScreen title="Leaderboard"><DataUnavailable title="Real leaderboard data is not configured" /></PageScreen>;
  }

  const r = rng(hash(type + period));
  let pts = period === "Week" ? 220 : period === "Month" ? 640 : 1480;
  const rows = leaderboardUsers.slice(0, 20).map((u, i) => {
    pts -= Math.round(r() * pts * 0.06 + 2);
    const p = period === "All time" ? pts : Math.round(pts * 6.5);
    const k = ranks[rankIndex(period === "All time" ? pts : 200 + pts)];
    return { n: i + 1, user: u, pts: fmt(pts), pl: "+" + fmt(p * (6 + r() * 8)), rank: k };
  });
  const podium = [rows[1], rows[0], rows[2]].map((x, i) => ({ ...x, h: [74, 98, 58][i], size: [44, 54, 40][i] }));
  const me = {
    n: period === "Week" ? 37 : period === "Month" ? 52 : 118,
    pts: fmt(type === "Trader" ? user.trader : type === "Predictor" ? user.predictor : user.overall),
  };

  const footer = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) + 4, backgroundColor: c.prs, borderTopWidth: 1, borderTopColor: c.bd }}>
      <Txt s={13} w={600} mono c={c.prt} style={{ width: 36 }}>#{me.n}</Txt>
      <Avatar name={user.name} size={32} s={13} bg={c.pr} color="#fff" />
      <Txt s={14} w={600} c={c.prt} style={{ flex: 1 }}>{user.name} (you)</Txt>
      <RankBadge rank={myRank(user).rk} width={24} />
      <Txt s={14} w={600} mono c={c.prt}>{me.pts}</Txt>
    </View>
  );

  return (
    <PageScreen title="Leaderboard" footer={footer}>
      <View style={{ paddingTop: 12, paddingHorizontal: 16, gap: 10 }}>
        <Segmented items={TYPES} value={type} onChange={setType} />
        <Chips items={PERIODS} value={period} onChange={setPeriod} h={30} s={12.5} scroll={false} />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
          {podium.map((p) => (
            <View key={p.user} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View style={{ borderRadius: 99, borderWidth: 2, borderColor: c.am }}>
                <Avatar name={p.user} size={p.size} s={17} bg={c.prs} color={c.prt} />
              </View>
              <Txt s={12.5} w={600} numberOfLines={1}>{p.user}</Txt>
              <View style={{ width: "100%", height: p.h, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, alignItems: "center", justifyContent: "center", gap: 2 }}>
                <Txt s={20} w={600} mono c={c.amt}>{p.n}</Txt>
                <Txt s={11.5} w={500} mono c={c.mu}>{p.pts}</Txt>
              </View>
            </View>
          ))}
        </View>
        <Card style={{ overflow: "hidden" }}>
          {rows.slice(3).map((x) => (
            <View key={x.user} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.bd }}>
              <Txt s={13} w={600} mono c={c.mu} center style={{ width: 24 }}>{x.n}</Txt>
              <Avatar name={x.user} size={32} s={12.5} />
              <Txt s={14} w={550} style={{ flex: 1, minWidth: 0 }}>{x.user}</Txt>
              <RankBadge rank={x.rank} width={24} />
              <View style={{ alignItems: "flex-end", width: 70 }}>
                <Txt s={13.5} w={600} mono>{x.pts}</Txt>
                <Txt s={11} mono c={c.yes}>{x.pl}</Txt>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </PageScreen>
  );
}
