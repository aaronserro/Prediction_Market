import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarketRow } from "../../src/components/MarketCards";
import { Button, Chips, DataUnavailable, Icon, Segmented, Txt } from "../../src/components/ui";
import { cardData } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";
import { fontFamily } from "../../src/theme";

const SORTS = ["Trending", "Volume", "Closing soon"] as const;
const TRENDING: [string, string][] = [["US Midterms", "House"], ["Interest Rates", "rate"], ["NHL", "Stanley"], ["Crypto", "Bitcoin"], ["AI", "GPT"]];

export default function Search() {
  const { c, px, watch, markets, categories, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Trending");

  const cats = ["All", ...categories];
  const query = q.trim().toLowerCase();
  const list = markets.filter((m) => (cat === "All" || m.cat === cat) && (!query || m.title.toLowerCase().includes(query) || m.o.some((o) => o[0].toLowerCase().includes(query))));
  if (sort === "Volume") list.sort((a, b) => b.vol - a.vol);
  else if (sort === "Closing soon") list.sort((a, b) => a.end - b.end);
  else list.sort((a, b) => Math.abs(b.move) * Math.pow(b.vol, 0.3) - Math.abs(a.move) * Math.pow(a.vol, 0.3));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ paddingTop: 4, paddingHorizontal: 16 }}>
        <Txt s={28} w={650} ls={-0.04} style={{ marginBottom: 12 }}>Search</Txt>
        <View style={{ height: 44, borderRadius: 12, backgroundColor: c.sf2, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
          <Icon name="search-outline" size={18} color={c.mu} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search markets or outcomes" placeholderTextColor={c.mu} autoCorrect={false} style={{ flex: 1, minWidth: 0, color: c.tx, fontSize: 15.5, fontFamily: fontFamily(400), height: 44 }} />
          {!!q && (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Icon name="close-circle" size={18} color={c.mu} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={{ paddingTop: 12 }}>
        <Chips items={cats} value={cat} onChange={setCat} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>
        <Txt s={12.5} c={c.mu} style={{ flexShrink: 1 }}>
          {list.length} markets{list.length !== markets.length ? " (filtered from " + markets.length + " total)" : ""}
        </Txt>
        <Segmented items={SORTS} value={sort} onChange={setSort} h={26} s={12} stretch={false} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        {realDataUnavailable ? (
          <DataUnavailable title="Real markets are not configured" />
        ) : list.length > 0 ? (
          list.map((m) => <MarketRow key={m.id} d={cardData(m, px, watch, c)} />)
        ) : (
          <View style={{ marginTop: 20, paddingVertical: 36, paddingHorizontal: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.bd2, borderRadius: 16, alignItems: "center", gap: 12 }}>
            <Txt s={15} w={600}>No markets match your filters.</Txt>
            <Button label="Clear filters" onPress={() => { setQ(""); setCat("All"); }} bg={c.sf} color={c.tx} border={c.bd2} h={38} s={14} radius={10} style={{ paddingHorizontal: 16 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 6 }}>
              {TRENDING.map(([label, term]) => (
                <Pressable key={label} onPress={() => { setQ(term); setCat("All"); }} style={{ height: 30, paddingHorizontal: 11, borderRadius: 999, backgroundColor: c.sf2, justifyContent: "center" }}>
                  <Txt s={12.5} c={c.tx2}>{label}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
