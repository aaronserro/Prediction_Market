import React from "react";
import { Pressable, View } from "react-native";
import { series, hash } from "../data/pryzm";
import { CardData, openMarket } from "../lib/market";
import { useStore } from "../store/AppStore";
import { cardShadow } from "../theme";
import { LineChart } from "./graphics";
import { Badge, Card, Icon, LiveTag, Txt } from "./ui";

/** Market card in the Home "Live markets" list. */
export function MarketCard({ d }: { d: CardData }) {
  const { c, openSheet, toggleWatch } = useStore();
  return (
    <Card onPress={() => openMarket(d.id)} style={{ padding: 15, gap: 13, borderRadius: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt s={12} w={500} c={c.mu} style={{ marginBottom: 4 }}>{d.cat}</Txt>
          <Txt s={15} w={600} lh={1.35} ls={-0.01}>{d.title}</Txt>
        </View>
        {d.bin && (
          <View style={{ alignItems: "flex-end" }}>
            <Txt s={22} w={600} mono ls={-0.04}>{d.yes}%</Txt>
            <Txt s={11} c={c.mu}>chance</Txt>
          </View>
        )}
      </View>

      {d.bin ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <YesNoButton label="Yes" price={d.yes} bg={c.yess} color={c.yes} onPress={() => openSheet(d.id, 0, "BUY")} />
          <YesNoButton label="No" price={d.no} bg={c.nos} color={c.no} onPress={() => openSheet(d.id, 1, "BUY")} />
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {d.rows.slice(0, 3).map((o) => (
            <View key={o.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Txt s={13.5} c={c.tx2} numberOfLines={1} style={{ flex: 1 }}>{o.label}</Txt>
              <Txt s={13.5} w={600} mono style={{ width: 40, textAlign: "right" }}>{o.pct}%</Txt>
              <Pressable onPress={() => openSheet(d.id, o.oi, "BUY")} style={{ height: 28, paddingHorizontal: 11, borderRadius: 7, backgroundColor: c.yess, justifyContent: "center" }}>
                <Txt s={12} w={600} c={c.yes}>Buy</Txt>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.bd }}>
        {d.upcoming ? (
          <>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.am }} />
            <Badge label="UPCOMING" bg={c.ams} color={c.amt} s={10.5} style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }} />
          </>
        ) : (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.yes }} />
        )}
        <Txt s={12} c={c.mu}><Txt s={12} mono c={c.tx2}>{d.vol}</Txt> PZC vol</Txt>
        <Txt s={12} c={c.mu} style={{ marginLeft: "auto" }}>Closes {d.close}</Txt>
        <Pressable onPress={() => toggleWatch(d.id)} hitSlop={8} style={{ width: 28, height: 28, margin: -6, marginLeft: 0, alignItems: "center", justifyContent: "center" }}>
          <Icon name={d.watchIcon} size={16} color={d.watchColor} />
        </Pressable>
      </View>
    </Card>
  );
}

function YesNoButton({ label, price, bg, color, onPress }: { label: string; price: number; bg: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, height: 40, borderRadius: 9, backgroundColor: bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, opacity: pressed ? 0.8 : 1 })}>
      <Txt s={14} w={600} c={color}>{label}</Txt>
      <Txt s={14} w={600} mono c={color}>{price}</Txt>
    </Pressable>
  );
}

/** Horizontal watchlist tile. */
export function WatchCard({ d }: { d: CardData }) {
  const { c } = useStore();
  return (
    <Card onPress={() => openMarket(d.id)} style={{ width: 210, padding: 13, gap: 10, borderRadius: 14 }}>
      <Txt s={13.5} w={600} lh={1.35} numberOfLines={2} style={{ height: 36 }}>{d.title}</Txt>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
        <Txt s={12} c={c.mu} numberOfLines={1} style={{ flexShrink: 1 }}>{d.top.label}</Txt>
        <Txt s={18} w={600} mono ls={-0.04}>{d.top.pct}%</Txt>
      </View>
      <Txt s={11.5} w={500} mono c={d.changeColor}>{d.change}</Txt>
    </Card>
  );
}

/** Compact row used in Search results. */
export function MarketRow({ d }: { d: CardData }) {
  const { c } = useStore();
  return (
    <Pressable onPress={() => openMarket(d.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bd }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Txt s={12} c={c.mu}>{d.cat} · Closes {d.close}</Txt>
          {d.upcoming && <Badge label="UPCOMING" bg={c.ams} color={c.amt} s={10.5} style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }} />}
        </View>
        <Txt s={14.5} w={600} lh={1.35} ls={-0.01}>{d.title}</Txt>
        <Txt s={12} c={c.mu} style={{ marginTop: 4 }}>
          <Txt s={12} mono c={c.tx2}>{d.vol}</Txt> PZC vol · <Txt s={12} mono c={d.changeColor}>{d.change}</Txt>
        </Txt>
      </View>
      <View style={{ alignItems: "flex-end", maxWidth: 96 }}>
        <Txt s={19} w={600} mono ls={-0.04}>{d.top.pct}%</Txt>
        <Txt s={11.5} c={c.mu} numberOfLines={1}>{d.top.label}</Txt>
      </View>
    </Pressable>
  );
}

/** Full-height swipeable card used in the Home "Feed" mode. */
export function FeedCard({ d, idx, total, first }: { d: CardData; idx: number; total: number; first: boolean }) {
  const { c, openSheet, toggleWatch } = useStore();
  const spark = series(hash(d.id), d.yes, 48, 5);
  return (
    <Pressable
      onPress={() => openMarket(d.id)}
      style={{ flex: 1, borderRadius: 22, backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, padding: 20, gap: 14, overflow: "hidden", ...(c.shadow ? { ...cardShadow, shadowColor: "#3c1e8c", shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } } : null) }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Badge label={d.cat} bg={c.prs} color={c.prt} s={12.5} />
        <LiveTag />
        <Txt s={12} w={500} mono c={c.mu} style={{ marginLeft: "auto" }}>{idx} / {total}</Txt>
      </View>
      <Txt s={25} w={650} ls={-0.035} lh={1.18}>{d.title}</Txt>
      {d.bin ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 9 }}>
            <Txt s={52} w={600} mono ls={-0.06} c={c.pr} style={{ lineHeight: 56 }}>{d.yes}%</Txt>
            <Txt s={14} c={c.mu}>chance</Txt>
          </View>
          <Txt s={13} w={500} mono c={d.changeColor} style={{ marginTop: -6 }}>{d.change}</Txt>
          <LineChart height={110} lines={[{ pts: spark, color: c.pr }]} area={{ color: c.prs, opacity: 0.8 }} />
        </>
      ) : (
        <View style={{ gap: 9 }}>
          {d.rows.slice(0, 4).map((o) => (
            <View key={o.label} style={{ height: 46, borderRadius: 11, backgroundColor: c.sf2, overflow: "hidden", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 10 }}>
              <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(2, o.pct)}%`, backgroundColor: o.color, opacity: 0.16 }} />
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: o.color }} />
              <Txt s={14.5} w={550} style={{ flex: 1 }}>{o.label}</Txt>
              <Txt s={16} w={600} mono ls={-0.03}>{o.pct}%</Txt>
              <Pressable onPress={() => openSheet(d.id, o.oi, "BUY")} style={{ height: 30, paddingHorizontal: 12, borderRadius: 8, backgroundColor: c.sf, justifyContent: "center", ...(c.shadow ? cardShadow : null) }}>
                <Txt s={12.5} w={600} c={c.yes}>Buy</Txt>
              </Pressable>
            </View>
          ))}
          {d.m.o.length > 4 && <Txt s={12.5} c={c.mu}>+{d.m.o.length - 4} more outcomes</Txt>}
        </View>
      )}
      <View style={{ flex: 1 }} />
      {d.bin && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => openSheet(d.id, 0, "BUY")} style={{ flex: 1, height: 54, borderRadius: 13, backgroundColor: c.yes, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Txt s={16} w={650} c="#fff">Buy Yes</Txt><Txt s={16} w={600} mono c="rgba(255,255,255,0.85)">{d.yes}</Txt>
          </Pressable>
          <Pressable onPress={() => openSheet(d.id, 1, "BUY")} style={{ flex: 1, height: 54, borderRadius: 13, backgroundColor: c.no, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Txt s={16} w={650} c="#fff">Buy No</Txt><Txt s={16} w={600} mono c="rgba(255,255,255,0.85)">{d.no}</Txt>
          </Pressable>
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Txt s={12.5} c={c.mu}><Txt s={12.5} mono c={c.tx2}>{d.vol}</Txt> vol</Txt>
        <Txt s={12.5} c={c.mu}>Closes {d.close}</Txt>
        <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="chatbubble-outline" size={15} color={c.mu} />
          <Txt s={12.5} mono c={c.mu}>{d.comments}</Txt>
        </View>
        <Pressable onPress={() => toggleWatch(d.id)} hitSlop={8} style={{ width: 30, height: 30, margin: -6, alignItems: "center", justifyContent: "center" }}>
          <Icon name={d.watchIcon} size={18} color={d.watchColor} />
        </Pressable>
      </View>
      {first && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginVertical: -4 }}>
          <Icon name="chevron-up" size={14} color={c.mu} />
          <Txt s={12} c={c.mu}>Swipe up for the next market</Txt>
        </View>
      )}
    </Pressable>
  );
}
