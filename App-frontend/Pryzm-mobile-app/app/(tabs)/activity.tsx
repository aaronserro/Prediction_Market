import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Chips, DataUnavailable, PulseDot, Txt } from "../../src/components/ui";
import { ago, cpt, fmt, Trade } from "../../src/data/pryzm";
import { openMarket } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";

const FILTERS = ["All", "Buys", "Sells", "Whales"] as const;
const isWhale = (t: Trade) => t.qty * t.price >= 10000;

export default function Activity() {
  const { c, feed, marketById, realDataUnavailable } = useStore();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");

  const rows = feed.filter((t) => f === "All" || (f === "Buys" && t.side === "BUY") || (f === "Sells" && t.side === "SELL") || (f === "Whales" && isWhale(t)));
  const volToday = cpt(feed.reduce((a, t) => a + t.qty * t.price, 0) * 40);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ paddingTop: 4, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Txt s={28} w={650} ls={-0.04}>Activity</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: c.yess }}>
            <PulseDot color={c.yes} />
            <Txt s={11.5} w={650} c={c.yes}>LIVE</Txt>
          </View>
        </View>
        <Txt s={14} c={c.mu} style={{ marginTop: 2 }}>
          Every trade across Pryzm, as it happens · <Txt s={14} mono c={c.tx2}>{volToday}</Txt> PZC today
        </Txt>
      </View>
      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.bd }}>
        <Chips items={FILTERS} value={f} onChange={setF} h={32} s={13} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={realDataUnavailable ? <DataUnavailable title="Real activity data is not configured" /> : <Txt s={14} c={c.mu} center style={{ paddingVertical: 40, paddingHorizontal: 20 }}>No trades match this filter yet.</Txt>}
        renderItem={({ item: t }) => {
          const m = marketById(t.mid);
          if (!m) return null;
          const buy = t.side === "BUY", fresh = Date.now() - t.at < 3200, me = t.user.indexOf("(you)") > 0;
          return (
            <Pressable onPress={() => openMarket(t.mid)} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, backgroundColor: fresh ? c.prs : "transparent" }}>
              <Avatar name={t.user} size={34} s={13} bg={me ? c.pr : c.sf2} color={me ? "#fff" : c.tx2} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt s={14} lh={1.4}>
                  <Txt s={14} w={600}>{t.user}</Txt>{" "}
                  <Txt s={14} w={550} c={buy ? c.yes : c.no}>{buy ? "bought" : "sold"}</Txt>{" "}
                  <Txt s={14} mono>{fmt(t.qty)}</Txt> {m.o[t.oi][0]} at <Txt s={14} mono>{t.price}</Txt>
                </Txt>
                <Txt s={12.5} c={c.mu} numberOfLines={1} style={{ marginTop: 2 }}>{m.title}</Txt>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Txt s={13} w={600} mono>{fmt(t.qty * t.price)}</Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  {isWhale(t) && (
                    <View style={{ paddingHorizontal: 5, borderRadius: 4, backgroundColor: c.ams }}>
                      <Txt s={10} w={650} c={c.amt}>WHALE</Txt>
                    </View>
                  )}
                  <Txt s={11.5} c={c.mu}>{ago(t.at)}</Txt>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
