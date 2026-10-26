import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PryzmLogo, RankBadge, XpBar } from "../../src/components/graphics";
import { FeedCard, MarketCard, WatchCard } from "../../src/components/MarketCards";
import { Card, Chips, CoinDot, DataUnavailable, Icon, PulseDot, Segmented, Txt } from "../../src/components/ui";
import { fmt, sgn } from "../../src/data/pryzm";
import { cardData, myRank } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";

export default function Home() {
  const { c, bal, unread, total, pl, watch, px, markets, categories, user, marketById, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"Markets" | "Feed">("Markets");
  const [cat, setCat] = useState("All");
  const [feedH, setFeedH] = useState(0);
  const cats = ["All", ...categories];

  if (realDataUnavailable || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16 }}><PryzmLogo size={28} /><Txt s={17} w={650}>Pryzm</Txt></View>
        <DataUnavailable title="Real market data is not configured" message="Authentication can use the live API, but markets, balances, and portfolio data still need backend endpoint contracts." />
      </View>
    );
  }

  const rank = myRank(user);

  const cards = markets.filter((m) => cat === "All" || m.cat === cat).map((m) => cardData(m, px, watch, c));
  const watchCards = watch.map(marketById).filter((market) => market !== undefined).map((market) => cardData(market, px, watch, c));
  const feed = markets.filter((m) => !m.up).sort((a, b) => b.vol - a.vol).map((m) => cardData(m, px, watch, c));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 10 }}>
        <PryzmLogo size={28} />
        <Txt s={17} w={650} ls={-0.02}>Pryzm</Txt>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push("/wallet")} style={{ height: 34, paddingLeft: 10, paddingRight: 12, borderRadius: 999, borderWidth: 1, borderColor: c.bd, backgroundColor: c.sf, flexDirection: "row", alignItems: "center", gap: 7 }}>
          <CoinDot />
          <Txt s={13.5} w={600} mono ls={-0.02}>{fmt(bal)}</Txt>
        </Pressable>
        <Pressable onPress={() => router.push("/notifications")} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: c.bd, backgroundColor: c.sf, alignItems: "center", justifyContent: "center" }}>
          <Icon name="notifications-outline" size={19} color={c.tx} />
          {unread > 0 && (
            <View style={{ position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 99, backgroundColor: c.no, borderWidth: 2, borderColor: c.bg, alignItems: "center", justifyContent: "center" }}>
              <Txt s={10.5} w={600} mono c="#fff">{unread}</Txt>
            </View>
          )}
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Segmented items={["Markets", "Feed"] as const} value={mode} onChange={setMode} />
      </View>

      {mode === "Markets" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 18 }} showsVerticalScrollIndicator={false}>
          <Card onPress={() => router.navigate("/(tabs)/portfolio")} style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <View>
                <Txt s={13} c={c.mu} style={{ marginBottom: 4 }}>Welcome back, {user.name}</Txt>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
                  <Txt s={30} w={600} mono ls={-0.05}>{fmt(total)}</Txt>
                  <Txt s={13} c={c.mu}>PZC</Txt>
                </View>
                <Txt s={13} w={500} mono c={pl >= 0 ? c.yes : c.no} style={{ marginTop: 2 }}>
                  {sgn(pl)} <Txt s={13} c={c.mu}>open P/L</Txt>
                </Txt>
              </View>
              <Pressable onPress={() => router.push("/profile")} style={{ alignItems: "center", gap: 3 }}>
                <RankBadge rank={rank.rk} width={46} />
                <Txt s={11.5} w={600} c={c.tx2}>{rank.label}</Txt>
              </Pressable>
            </View>
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Txt s={12} c={c.mu}>Progress to {rank.nextLabel}</Txt>
                <Txt s={12} mono c={c.tx2}>{rank.xpText}</Txt>
              </View>
              <XpBar pct={rank.xpPct} track={c.sf2} from={c.pr} to={c.am} />
            </View>
          </Card>

          {watchCards.length > 0 && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Icon name="bookmark" size={15} color={c.am} />
                <Txt s={17} w={650} ls={-0.025}>Watchlist</Txt>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={220} decelerationRate="fast" style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 2 }}>
                {watchCards.map((d) => <WatchCard key={d.id} d={d} />)}
              </ScrollView>
            </View>
          )}

          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <PulseDot size={7} color={c.yes} />
                <Txt s={17} w={650} ls={-0.025}>Live markets</Txt>
              </View>
              <Pressable onPress={() => router.navigate("/(tabs)/search")} hitSlop={8}>
                <Txt s={13.5} w={550} c={c.pr}>See all</Txt>
              </Pressable>
            </View>
            <View style={{ marginHorizontal: -16, marginBottom: 12 }}>
              <Chips items={cats} value={cat} onChange={setCat} />
            </View>
            <View style={{ gap: 10 }}>
              {cards.map((d) => <MarketCard key={d.id} d={d} />)}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} onLayout={(e) => setFeedH(e.nativeEvent.layout.height)}>
          {feedH > 0 && (
            <FlatList
              data={feed}
              keyExtractor={(d) => d.id}
              pagingEnabled
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, i) => ({ length: feedH, offset: feedH * i, index: i })}
              renderItem={({ item, index }) => (
                <View style={{ height: feedH, paddingTop: 2, paddingHorizontal: 16, paddingBottom: 14 }}>
                  <FeedCard d={item} idx={index + 1} total={feed.length} first={index === 0} />
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
