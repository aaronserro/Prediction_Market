import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { RankBadge, XpBar } from "../src/components/graphics";
import { Avatar, Card, DataUnavailable, HeaderIconButton, PageScreen, Txt } from "../src/components/ui";
import { rankLabel, rankProgress } from "../src/data/pryzm";
import { myRank } from "../src/lib/market";
import { useStore } from "../src/store/AppStore";

export default function Profile() {
  const { c, user, ranks, realDataUnavailable } = useStore();

  if (realDataUnavailable || !user) {
    return <PageScreen title="Profile"><DataUnavailable title="Real profile data is not configured" /></PageScreen>;
  }

  const rank = myRank(user), ri = rank.rp.i;

  const stats: [string, string, string?][] = [[String(user.resolved), "Resolved"], ["61%", "Win rate"], ["+6,200", "Best trade", c.yes]];

  return (
    <PageScreen title="Profile" right={<HeaderIconButton name="settings-outline" onPress={() => router.push("/settings")} />}>
      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 28, gap: 14 }}>
        <View style={{ alignItems: "center", gap: 6 }}>
          <Avatar name={user.name} size={76} s={30} bg={c.prs} color={c.prt} />
          <Txt s={22} w={650} ls={-0.03}>{user.name}</Txt>
          <Txt s={13} c={c.mu}>Member since {user.joined}</Txt>
        </View>

        <Card style={{ flexDirection: "row" }}>
          {stats.map(([v, l, col], i) => (
            <View key={l} style={{ flex: 1, padding: 13, alignItems: "center", borderRightWidth: i < 2 ? 1 : 0, borderRightColor: c.bd }}>
              <Txt s={18} w={600} mono c={col ?? c.tx}>{v}</Txt>
              <Txt s={11.5} c={c.mu}>{l}</Txt>
            </View>
          ))}
        </Card>

        <Card style={{ padding: 18, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Txt s={13} c={c.mu}>Your rank</Txt>
            <Txt s={13} w={500} c={c.pr} onPress={() => router.push("/leaderboard")}>Leaderboard →</Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <RankBadge rank={rank.rk} width={72} />
            <View>
              <Txt s={24} w={650} ls={-0.03}>{rank.label}</Txt>
              <Txt s={13} c={c.mu} style={{ marginTop: 2 }}>{user.resolved} markets resolved · top 22%</Txt>
            </View>
          </View>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
              <Txt s={12.5} c={c.mu}>Progress to {rank.nextLabel}</Txt>
              <Txt s={12.5} mono c={c.tx2}>{rank.xpText}</Txt>
            </View>
            <XpBar pct={rank.xpPct} h={8} track={c.sf2} from={c.pr} to={c.am} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: c.bd }}>
            {ranks.map((k, i) => (
              <RankBadge key={k} rank={k} width={32} opacity={i === ri ? 1 : i < ri ? 0.55 : 0.28} grayscale={i > ri} />
            ))}
          </View>
        </Card>

        <Txt s={14} w={600} style={{ marginTop: 4 }}>Rank breakdown</Txt>
        {([["Overall", user.overall], ["Trader", user.trader], ["Predictor", user.predictor]] as const).map(([l, pts]) => {
          const g = rankProgress(pts), k = ranks[g.i];
          return (
            <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, borderRadius: 14, padding: 14 }}>
              <RankBadge rank={k} width={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Txt s={12} c={c.mu}>{l}</Txt>
                  <Txt s={12} w={500} mono c={c.tx2}>{pts} pts</Txt>
                </View>
                <Txt s={16} w={620} style={{ marginTop: 1, marginBottom: 7 }}>{rankLabel(k)}</Txt>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: c.sf2, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${g.pct}%`, backgroundColor: c.pr, borderRadius: 99 }} />
                </View>
                <Txt s={11} c={c.mu} style={{ marginTop: 4 }}>{g.isMax ? "Max" : "Next at " + g.next}</Txt>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </PageScreen>
  );
}
