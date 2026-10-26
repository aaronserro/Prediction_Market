import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart } from "../../src/components/graphics";
import { Avatar, Badge, Button, Card, DataUnavailable, HeaderIconButton, LiveTag, PageScreen, Segmented, Txt, UnderlineTabs } from "../../src/components/ui";
import { ago, cpt, dstr, fmt, hash, isBin, rng, series } from "../../src/data/pryzm";
import { openMarket, posRow } from "../../src/lib/market";
import { useStore } from "../../src/store/AppStore";
import { fontFamily, seriesColors } from "../../src/theme";

type Range = "1D" | "1W" | "1M" | "ALL";

export default function MarketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    c, px, pos, watch, feed, myComments, setMyComments, toggleWatch, openSheet, flash,
    markets, user, comments, leaderboardUsers, marketById, fixtureDataEnabled,
  } = useStore();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>("1W");
  const [dTab, setDTab] = useState("Rules");
  const [sel, setSel] = useState(0);
  const [bookSide, setBookSide] = useState(0);
  const [comment, setComment] = useState("");
  const [, tick] = useState(0);

  // Re-render "ago" labels in the activity tab.
  useEffect(() => {
    if (!fixtureDataEnabled) return;
    const iv = setInterval(() => tick((x) => x + 1), 5000);
    return () => clearInterval(iv);
  }, [fixtureDataEnabled]);

  const m = marketById(id);
  if (!fixtureDataEnabled) return <PageScreen title="Market"><DataUnavailable title="Real market details are not configured" /></PageScreen>;
  if (!m || !user) return <PageScreen title="Market"><Txt center style={{ marginTop: 40 }}>Market not found.</Txt></PageScreen>;

  const p = px[m.id], bin = isBin(m), colors = seriesColors(c);
  const outs = m.o.map((x, i) => ({ label: x[0], p: p[i], bid: Math.max(1, p[i] - 1), color: bin ? (i === 0 ? c.yes : c.no) : colors[i], vol: cpt((m.vol * p[i]) / 100) }));
  const s = Math.min(sel, outs.length - 1);

  const RS: Record<Range, [number, string[]]> = { "1D": [5, ["6a", "12p", "6p", "Now"]], "1W": [13, ["Oct 19", "Oct 21", "Oct 23", "Now"]], "1M": [29, ["Sep 25", "Oct 5", "Oct 15", "Now"]], ALL: [47, [dstr(-m.age), "", "", "Now"]] };
  const seed = hash(m.id) + RS[range][0];
  const lines = bin
    ? [{ pts: series(seed, p[0], 70, 5), color: c.pr }]
    : outs.slice(0, 4).map((o, i) => ({ pts: series(seed + i * 17, o.p, 70, o.p > 20 ? 4 : 1.5), color: o.color }));

  const bo = bin ? bookSide : s, bp = outs[bo], r = rng(seed + bo * 7);
  const book = (side: "ask" | "bid") =>
    Array.from({ length: 5 }, (_, k) => {
      const price = side === "ask" ? bp.p + 4 - k : bp.bid - k;
      const qty = Math.round(200 + r() * 1800);
      return { price, qty, total: qty * price };
    }).filter((x) => x.price > 0 && x.price < 100);
  const asks = book("ask"), bids = book("bid"), maxQ = Math.max(...asks.concat(bids).map((x) => x.qty));
  const spread = asks.length && bids.length ? asks[asks.length - 1].price - bids[0].price : 0;

  const hold = pos.filter((x) => x.mid === m.id).map((x) => posRow(x, px, c, markets)).filter((row) => row !== null);
  const watched = watch.includes(m.id);
  const cm = [
    ...myComments.filter((x) => x.mid === m.id),
    ...comments.map(([commentUser, oi, a, text]) => ({ user: commentUser, ago: a, text, oi: Math.min(oi, outs.length - 1) })),
  ];
  const act = feed
    .filter((t) => t.mid === m.id)
    .concat(leaderboardUsers.slice(0, 6).map((u, k) => ({ id: "s" + k, user: u, mid: m.id, oi: k % Math.min(outs.length, 2), side: (k % 3 === 1 ? "SELL" : "BUY") as "BUY" | "SELL", qty: [50, 120, 10, 300, 25, 80][k], price: 0, at: Date.now() - [4, 9, 15, 22, 38, 61][k] * 60000 })))
    .slice(0, 10);
  const related = markets.filter((x) => x.cat === m.cat && x.id !== m.id).slice(0, 3);

  const postComment = () => {
    if (!comment.trim()) return;
    const mine = pos.find((x) => x.mid === m.id);
    setMyComments([{ mid: m.id, user: user.name, ago: "now", text: comment.trim(), oi: mine ? mine.oi : 0 }, ...myComments]);
    setComment("");
  };

  const BookRow = ({ x, ask }: { x: { price: number; qty: number; total: number }; ask: boolean }) => (
    <View style={{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 16 }}>
      <View style={{ position: "absolute", right: 0, top: 1, bottom: 1, width: `${(x.qty / maxQ) * 70}%`, backgroundColor: ask ? c.nos : c.yess }} />
      <Txt s={12.5} w={600} mono c={ask ? c.no : c.yes} style={{ flex: 1 }}>{x.price}</Txt>
      <Txt s={12.5} mono style={{ flex: 1, textAlign: "right" }}>{fmt(x.qty)}</Txt>
      <Txt s={12.5} mono c={c.mu} style={{ flex: 1, textAlign: "right" }}>{fmt(x.total)}</Txt>
    </View>
  );

  const footer = (
    <View style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) + 4, backgroundColor: c.sf, borderTopWidth: 1, borderTopColor: c.bd }}>
      {bin ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button h={50} bg={c.yes} color="#fff" style={{ flex: 1 }} onPress={() => openSheet(m.id, 0, "BUY")} label={<><Txt s={15.5} w={650} c="#fff">Buy Yes</Txt><Txt s={15.5} w={600} mono c="rgba(255,255,255,0.85)">{outs[0].p}</Txt></>} />
          <Button h={50} bg={c.no} color="#fff" style={{ flex: 1 }} onPress={() => openSheet(m.id, 1, "BUY")} label={<><Txt s={15.5} w={650} c="#fff">Buy No</Txt><Txt s={15.5} w={600} mono c="rgba(255,255,255,0.85)">{outs[1].p}</Txt></>} />
        </View>
      ) : (
        <Button h={50} bg={c.pr} color="#fff" onPress={() => openSheet(m.id, s, "BUY")} label={<Txt s={15.5} w={650} c="#fff">Buy {outs[s].label} · <Txt s={15.5} w={600} mono c="#fff">{outs[s].p}</Txt></Txt>} />
      )}
    </View>
  );

  return (
    <PageScreen
      title={<Txt s={13} c={c.mu}>Markets / <Txt s={13} c={c.tx2}>{m.cat}</Txt></Txt>}
      right={
        <>
          <HeaderIconButton name={watched ? "bookmark" : "bookmark-outline"} color={watched ? c.am : c.tx} onPress={() => toggleWatch(m.id)} />
          <HeaderIconButton name="share-outline" onPress={() => flash("Link copied to clipboard")} />
        </>
      }
      footer={footer}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View>
          <Txt s={23} w={650} ls={-0.035} lh={1.22} style={{ marginBottom: 10 }}>{m.title}</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 6 }}>
            <Badge label={m.cat} bg={c.prs} color={c.prt} s={12.5} />
            {m.up ? <Badge label="UPCOMING" bg={c.ams} color={c.amt} s={12.5} /> : <LiveTag />}
            <Txt s={12.5} c={c.mu}><Txt s={12.5} mono c={c.tx2}>{fmt(m.vol)}</Txt> PZC vol</Txt>
            <Txt s={12.5} c={c.mu}>Closes {dstr(m.end, true)}</Txt>
          </View>
        </View>

        <Card style={{ padding: 16 }}>
          {bin ? (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <Txt s={34} w={600} mono ls={-0.05} c={c.pr}>{outs[0].p}%</Txt>
              <Txt s={14} c={c.mu}>chance</Txt>
              <Txt s={12.5} w={500} mono c={m.move >= 0 ? c.yes : c.no}>{(m.move >= 0 ? "▲ " : "▼ ") + Math.abs(m.move) + " past week"}</Txt>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6 }}>
              {outs.slice(0, 4).map((o) => (
                <View key={o.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: o.color }} />
                  <Txt s={13} c={c.tx2}>{o.label} <Txt s={13} w={600} mono>{o.p}%</Txt></Txt>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 170, marginTop: 14, flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <View style={{ position: "absolute", inset: 0, justifyContent: "space-between" }}>
                {[0, 1, 2].map((i) => <View key={i} style={{ height: 1, backgroundColor: c.bd }} />)}
              </View>
              <LineChart height={170} lines={lines} area={bin ? { color: c.prs } : undefined} />
            </View>
            <View style={{ width: 34, justifyContent: "space-between", paddingLeft: 6, marginVertical: -6 }}>
              {["100%", "50%", "0%"].map((l) => <Txt key={l} s={10.5} mono c={c.mu}>{l}</Txt>)}
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingRight: 34 }}>
            {RS[range][1].map((t, i) => <Txt key={i} s={10.5} mono c={c.mu}>{t}</Txt>)}
          </View>
          <Segmented items={["1D", "1W", "1M", "ALL"] as Range[]} value={range} onChange={setRange} h={28} s={12.5} mono style={{ marginTop: 12 }} />
        </Card>

        {!!m.up && (
          <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.ams }}>
            <Txt s={13.5} w={550} c={c.amt}>Trading opens {dstr(m.up - 36, true)}. Add it to your watchlist to get notified.</Txt>
          </View>
        )}

        {hold.length > 0 && (
          <Card style={{ overflow: "hidden" }}>
            <Txt s={13} c={c.mu} style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>Your position</Txt>
            {hold.map((h) => (
              <View key={h.oi} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
                <Badge label={h.side} bg={h.sideBg} color={h.sideColor} />
                <View style={{ flex: 1 }}>
                  <Txt s={12.5} mono>{h.qtyFmt} sh · avg {h.avg}</Txt>
                  <Txt s={12.5} mono w={600} c={h.plColor}>{h.pl} ({h.plPct})</Txt>
                </View>
                <Button label="Sell" onPress={() => openSheet(m.id, h.oi, "SELL")} bg={c.sf} color={c.tx} border={c.bd2} h={34} s={13.5} radius={9} style={{ paddingHorizontal: 14 }} />
              </View>
            ))}
          </Card>
        )}

        <Card style={{ overflow: "hidden" }}>
          <View style={{ flexDirection: "row", gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, backgroundColor: c.sf2 }}>
            <Txt s={11.5} w={500} c={c.mu} style={{ flex: 1 }}>Outcome</Txt>
            <Txt s={11.5} w={500} c={c.mu} style={{ width: 56, textAlign: "right" }}>Chance</Txt>
            <View style={{ width: 128 }} />
          </View>
          {outs.map((o, i) => {
            const on = i === s && !bin;
            return (
              <Pressable key={o.label} onPress={() => setSel(i)} style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, backgroundColor: on ? c.sf2 : "transparent", borderLeftWidth: on ? 3 : 0, borderLeftColor: c.pr, paddingLeft: on ? 13 : 16 }}>
                <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: o.color }} />
                  <View style={{ minWidth: 0, flex: 1 }}>
                    <Txt s={14} w={600} numberOfLines={1}>{o.label}</Txt>
                    <Txt s={11} c={c.mu}><Txt s={11} mono c={c.mu}>{o.vol}</Txt> vol</Txt>
                  </View>
                </View>
                <Txt s={16} w={600} mono ls={-0.03} style={{ width: 56, textAlign: "right" }}>{o.p}%</Txt>
                <View style={{ width: 128, flexDirection: "row", gap: 6 }}>
                  <Pressable onPress={() => openSheet(m.id, i, "BUY")} style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: c.yess, alignItems: "center", justifyContent: "center" }}>
                    <Txt s={12.5} w={600} c={c.yes}>Buy <Txt s={12.5} mono c={c.yes}>{o.p}</Txt></Txt>
                  </Pressable>
                  <Pressable onPress={() => openSheet(m.id, i, "SELL")} style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: c.nos, alignItems: "center", justifyContent: "center" }}>
                    <Txt s={12.5} w={600} c={c.no}>Sell <Txt s={12.5} mono c={c.no}>{o.bid}</Txt></Txt>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingHorizontal: 16 }}>
            <Txt s={15} w={620} ls={-0.02}>Order book</Txt>
            <Txt s={11.5} mono c={c.mu}>Spread {spread}</Txt>
          </View>
          <UnderlineTabs
            h={40} s={13}
            items={bin ? outs.map((o) => ({ label: "Trade " + o.label, color: o.color })) : [{ label: "Trade " + outs[s].label }]}
            value={"Trade " + outs[bo].label}
            onChange={(l) => bin && setBookSide(outs.findIndex((o) => "Trade " + o.label === l))}
          />
          <View style={{ flexDirection: "row", paddingVertical: 8, paddingHorizontal: 16 }}>
            {["PRICE", "SHARES", "TOTAL"].map((h, i) => <Txt key={h} s={11} w={500} ls={0.02} c={c.mu} style={{ flex: 1, textAlign: i ? "right" : "left" }}>{h}</Txt>)}
          </View>
          {asks.map((x) => <BookRow key={"a" + x.price} x={x} ask />)}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.bd, backgroundColor: c.sf2 }}>
            <Txt s={12} w={500} mono c={c.tx2}>Last {bp.p}</Txt>
            <Txt s={12} w={500} mono c={c.tx2}>Spread {spread}</Txt>
          </View>
          {bids.map((x) => <BookRow key={"b" + x.price} x={x} ask={false} />)}
          <View style={{ height: 8 }} />
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <UnderlineTabs items={[{ label: "Rules" }, { label: "Comments", count: cm.length + 44 }, { label: "Activity" }]} value={dTab} onChange={setDTab} />
          {dTab === "Rules" && (
            <View style={{ padding: 16, gap: 16 }}>
              <Txt s={14} lh={1.6} c={c.tx2}>{m.desc}</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12, padding: 14, borderRadius: 12, backgroundColor: c.sf2 }}>
                {[["Closes", dstr(m.end, true)], ["Created", dstr(-m.age, true)], ["Outcomes", String(outs.length)], ["Resolution source", m.src]].map(([k, v]) => (
                  <View key={k} style={{ width: "50%", paddingRight: 8 }}>
                    <Txt s={11.5} c={c.mu} style={{ marginBottom: 2 }}>{k}</Txt>
                    <Txt s={13.5} w={550}>{v}</Txt>
                  </View>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                {["Market resolves based on official results", "Trades execute instantly at displayed prices", "Winning shares pay out 100 PZC each"].map((t) => (
                  <View key={t} style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ width: 5, height: 5, marginTop: 7, backgroundColor: c.am, transform: [{ rotate: "45deg" }] }} />
                    <Txt s={13.5} c={c.tx2}>{t}</Txt>
                  </View>
                ))}
              </View>
            </View>
          )}
          {dTab === "Comments" && (
            <View style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <TextInput value={comment} onChangeText={setComment} placeholder="Add a comment" placeholderTextColor={c.mu} onSubmitEditing={postComment} style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 10, borderWidth: 1, borderColor: c.bd2, backgroundColor: c.sf, color: c.tx, paddingHorizontal: 12, fontSize: 14, fontFamily: fontFamily(400) }} />
                <Button label="Post" onPress={postComment} disabled={!comment.trim()} bg={c.pr} color="#fff" h={42} s={14} radius={10} style={{ paddingHorizontal: 14 }} />
              </View>
              {cm.map((x, i) => {
                const posBg = bin ? (x.oi === 0 ? c.yess : c.nos) : c.prs, posColor = bin ? (x.oi === 0 ? c.yes : c.no) : c.prt;
                return (
                  <View key={i} style={{ flexDirection: "row", gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: c.bd }}>
                    <Avatar name={x.user} size={30} s={12.5} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <Txt s={12.5} w={600}>{x.user}</Txt>
                        <Badge label={"Holds " + outs[x.oi].label} bg={posBg} color={posColor} s={11} style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }} />
                        <Txt s={12.5} c={c.mu}>{x.ago}</Txt>
                      </View>
                      <Txt s={13.5} lh={1.5} c={c.tx2} style={{ marginTop: 3 }}>{x.text}</Txt>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          {dTab === "Activity" && (
            <View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 8 }}>
              {act.map((t) => {
                const buy = t.side === "BUY", o = outs[t.oi];
                return (
                  <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.bd }}>
                    <Avatar name={t.user} size={26} s={11.5} />
                    <Txt s={13.5} style={{ flex: 1, minWidth: 0 }}>
                      <Txt s={13.5} w={600}>{t.user}</Txt> <Txt s={13.5} w={550} c={buy ? c.yes : c.no}>{buy ? "bought" : "sold"}</Txt>{" "}
                      <Txt s={13.5} mono>{fmt(t.qty)}</Txt> {o.label} at <Txt s={13.5} mono>{buy ? o.p : o.bid}</Txt>
                    </Txt>
                    <Txt s={12} c={c.mu}>{ago(t.at)}</Txt>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <Txt s={14} w={600} style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>Related markets</Txt>
          {related.map((x) => (
            <Pressable key={x.id} onPress={() => openMarket(x.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>
              <Txt s={13.5} lh={1.35} style={{ flex: 1, minWidth: 0 }}>{x.title}</Txt>
              <Txt s={14} w={600} mono>{px[x.id][0]}%</Txt>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </PageScreen>
  );
}
