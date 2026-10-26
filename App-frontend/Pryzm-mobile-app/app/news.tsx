import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Card, Chips, DataUnavailable, PageScreen, Txt } from "../src/components/ui";
import { cardData, openMarket } from "../src/lib/market";
import { useStore } from "../src/store/AppStore";

const CATS = ["Finance", "Technology", "Sports", "Politics"] as const;

export default function News() {
  const { c, px, watch, markets, news, realDataUnavailable } = useStore();
  const [cat, setCat] = useState<(typeof CATS)[number]>("Finance");
  const list = news.filter((n) => n.cat === cat);
  const lead = list[0];
  // Placeholder hatch for article.urlToImage until the news API is wired up.
  const hatch = { backgroundColor: c.sf2, borderWidth: 1, borderColor: c.bd } as const;

  return (
    <PageScreen title="Market News">
      {realDataUnavailable || !lead ? (
        <DataUnavailable title="Real news data is not configured" />
      ) : (
      <>
      <View style={{ paddingVertical: 12 }}>
        <Chips items={CATS} value={cat} onChange={setCat} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 14 }}>
        <Card style={{ overflow: "hidden" }}>
          <View style={[hatch, { aspectRatio: 16 / 9, borderWidth: 0, alignItems: "center", justifyContent: "center" }]}>
            <Txt s={11.5} mono c={c.mu}>article.urlToImage</Txt>
          </View>
          <View style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
            <Txt s={12} style={{ marginBottom: 6 }}><Txt s={12} w={600} c={c.amt}>{lead.src}</Txt><Txt s={12} c={c.mu}> · {lead.ago} ago</Txt></Txt>
            <Txt s={21} w={650} ls={-0.03} lh={1.22} style={{ marginBottom: 8 }}>{lead.title}</Txt>
            <Txt s={14} lh={1.55} c={c.tx2}>{lead.desc}</Txt>
          </View>
        </Card>
        {list.slice(1).map((n) => (
          <View key={n.title} style={{ flexDirection: "row", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.bd }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt s={12} style={{ marginBottom: 4 }}><Txt s={12} w={600} c={c.amt}>{n.src}</Txt><Txt s={12} c={c.mu}> · {n.ago} ago</Txt></Txt>
              <Txt s={15} w={600} lh={1.35} style={{ marginBottom: 4 }}>{n.title}</Txt>
              <Txt s={13} lh={1.5} c={c.mu} numberOfLines={2}>{n.desc}</Txt>
            </View>
            <View style={[hatch, { width: 84, height: 84, borderRadius: 10 }]} />
          </View>
        ))}
        <Txt s={14} w={600} style={{ marginTop: 4 }}>Trade the news</Txt>
        {markets.filter((m) => m.cat === cat).slice(0, 3).map((m) => {
          const d = cardData(m, px, watch, c);
          return (
            <Pressable key={m.id} onPress={() => openMarket(m.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, borderRadius: 12 }}>
              <Txt s={13.5} w={550} lh={1.35} style={{ flex: 1 }}>{m.title}</Txt>
              <Txt s={15} w={600} mono>{d.top.pct}%</Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      </>
      )}
    </PageScreen>
  );
}
