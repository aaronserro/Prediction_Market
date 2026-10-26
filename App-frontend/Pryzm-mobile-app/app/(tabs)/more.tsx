import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RankBadge } from "../../src/components/graphics";
import { Avatar, Card, Icon, IconName, IconTile, Txt } from "../../src/components/ui";
import { fmt } from "../../src/data/pryzm";
import { myRank } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";

export default function More() {
  const { c, bal, unread, signOut, user } = useStore();
  const insets = useSafeAreaInsets();
  const rank = user ? myRank(user) : null;

  const Row = ({ icon, bg, color, label, href, right, last, danger, onPress }: { icon: IconName; bg: string; color: string; label: string; href?: Href; right?: ReactNode; last?: boolean; danger?: boolean; onPress?: () => void }) => (
    <Pressable
      onPress={onPress ?? (() => href && router.push(href))}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, height: 56, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.bd, backgroundColor: pressed ? c.sf2 : "transparent" })}
    >
      <IconTile name={icon} bg={bg} color={color} />
      <Txt s={15} w={550} c={danger ? c.no : c.tx} style={{ flex: 1 }}>{label}</Txt>
      {right}
      {!danger && <Icon name="chevron-forward" size={17} color={c.mu} />}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 20, gap: 16 }}>
        <Txt s={28} w={650} ls={-0.04}>More</Txt>

        <Card onPress={() => router.push("/profile")} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name={user?.name ?? "Account"} size={52} s={21} bg={c.prs} color={c.prt} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt s={17} w={650} ls={-0.02}>{user?.name ?? "Live account"}</Txt>
            <Txt s={13} c={c.mu} style={{ marginTop: 2 }}>{rank ? rank.label + " · " + rank.xpText : "Profile data unavailable"}</Txt>
          </View>
          {rank && <RankBadge rank={rank.rk} width={40} />}
          <Icon name="chevron-forward" size={18} color={c.mu} />
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <Row icon="wallet-outline" bg={c.ams} color={c.amt} label="Wallet" href="/wallet" right={<Txt s={13.5} w={500} mono c={c.tx2}>{fmt(bal)} PZC</Txt>} />
          <Row
            icon="notifications-outline" bg={c.prs} color={c.prt} label="Notifications" href="/notifications"
            right={unread > 0 ? (
              <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 99, backgroundColor: c.no, alignItems: "center", justifyContent: "center" }}>
                <Txt s={11.5} w={600} mono c="#fff">{unread}</Txt>
              </View>
            ) : null}
          />
          <Row icon="podium-outline" bg={c.yess} color={c.yes} label="Leaderboard" href="/leaderboard" />
          <Row
            icon="trophy-outline" bg={c.ams} color={c.amt} label="Tournaments" href="/tournaments"
            right={<View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: c.sf2 }}><Txt s={11} w={650} c={c.mu}>SOON</Txt></View>}
          />
          <Row icon="newspaper-outline" bg={c.sf2} color={c.tx2} label="News" href="/news" last />
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <Row icon="settings-outline" bg={c.sf2} color={c.tx2} label="Settings" href="/settings" />
          <Row icon="log-out-outline" bg={c.nos} color={c.no} label="Sign out" danger last onPress={() => { signOut(); router.replace("/"); }} />
        </Card>

        <Txt s={12} c={c.mu} center>
          © 2026 Pryzm · <Txt s={12} c={c.mu} onPress={() => Linking.openURL("mailto:pryzmcompany@gmail.com")}>pryzmcompany@gmail.com</Txt>
        </Txt>
      </ScrollView>
    </View>
  );
}
