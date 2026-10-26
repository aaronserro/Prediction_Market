import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fmt, isBin } from "../data/pryzm";
import { Fill, useStore } from "../store/AppStore";
import { seriesColors } from "../theme";
import { Button, Icon, KV, Segmented, Txt } from "./ui";

type Done = { verb: string; shares: string; label: string; price: number; total: string; payout: string; isBuy: boolean; title: string };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

export default function TradeSheet() {
  const { c, sheet, setSheet, px, bal, pos, confirmTrade, fixtureDataEnabled, marketById } = useStore();
  const insets = useSafeAreaInsets();
  const [amt, setAmt] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  // Reset the keypad whenever a new sheet opens or the side flips.
  useEffect(() => { setAmt(""); }, [sheet?.mid, sheet?.side]);
  useEffect(() => { if (!sheet) setDone(null); }, [sheet]);

  if (!fixtureDataEnabled || !sheet) return <Modal visible={false} transparent />;

  const m = marketById(sheet.mid);
  if (!m) return <Modal visible={false} transparent />;
  const p = px[m.id], bin = isBin(m);
  const isBuy = sheet.side === "BUY";
  const price = isBuy ? p[sheet.oi] : Math.max(1, p[sheet.oi] - 1);
  const n = +amt || 0;
  const held = pos.find((x) => x.mid === sheet.mid && x.oi === sheet.oi)?.qty ?? 0;

  let calc: Fill, err = "";
  if (isBuy) {
    const shares = Math.floor(n / price);
    calc = { shares, price, cost: shares * price, payout: shares * 100 };
    if (n > bal) err = "Insufficient balance. Request funds from your wallet.";
    else if (n > 0 && shares === 0) err = "Minimum is " + price + " PZC (1 share).";
  } else {
    calc = { shares: n, price, cost: n * price, payout: 0 };
    if (n > held) err = held ? "You only hold " + fmt(held) + " shares." : "You don't have any shares to sell.";
  }
  const can = calc.shares > 0 && !err;
  const ret = calc.cost ? Math.round(((calc.payout - calc.cost) / calc.cost) * 100) : 0;
  const lab = m.o[sheet.oi][0];
  const colors = seriesColors(c);

  const close = () => setSheet(null);
  const add = (x: number) => setAmt(String(Math.min(999999, n + x)));
  const press = (k: string) => setAmt((a) => (k === "del" ? a.slice(0, -1) : a.length < 6 ? (a + k).replace(/^0+/, "") : a));
  const confirm = () => {
    if (!can) return;
    confirmTrade(sheet, calc);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDone({ verb: isBuy ? "Bought" : "Sold", shares: fmt(calc.shares), label: lab, price: calc.price, total: fmt(calc.cost), payout: fmt(calc.payout), isBuy, title: m.title });
  };

  const quick: [string, () => void][] = isBuy
    ? [["+10", () => add(10)], ["+50", () => add(50)], ["+100", () => add(100)], ["Max", () => setAmt(String(bal))]]
    : [["25%", () => setAmt(String(Math.floor(held / 4)))], ["50%", () => setAmt(String(Math.floor(held / 2)))], ["Max", () => setAmt(String(held))]];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(10,8,20,0.55)", justifyContent: "flex-end" }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: c.sf, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 12 }}>
          <View style={{ width: 38, height: 5, borderRadius: 99, backgroundColor: c.bd2, alignSelf: "center", marginBottom: 2 }} />

          {!done ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Txt s={13.5} w={550} c={c.tx2} numberOfLines={1} style={{ flex: 1 }}>{m.title}</Txt>
                <Pressable onPress={close} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.sf2, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={17} color={c.tx2} />
                </Pressable>
              </View>

              <Segmented items={["Buy", "Sell"] as const} value={isBuy ? "Buy" : "Sell"} s={14} onChange={(l) => setSheet({ ...sheet, side: l === "Buy" ? "BUY" : "SELL" })} />

              {bin ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[0, 1].map((i) => {
                    const on = i === sheet.oi, y = i === 0;
                    return (
                      <Pressable key={i} onPress={() => setSheet({ ...sheet, oi: i })} style={{ flex: 1, height: 46, borderRadius: 11, backgroundColor: on ? (y ? c.yes : c.no) : y ? c.yess : c.nos, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Txt s={15} w={650} c={on ? "#fff" : y ? c.yes : c.no}>{m.o[i][0]}</Txt>
                        <Txt s={15} w={600} mono c={on ? "rgba(255,255,255,0.85)" : y ? c.yes : c.no}>{isBuy ? p[i] : Math.max(1, p[i] - 1)}</Txt>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
                  {m.o.map((o, i) => {
                    const on = i === sheet.oi;
                    return (
                      <Pressable key={o[0]} onPress={() => setSheet({ ...sheet, oi: i })} style={{ height: 40, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1.5, borderColor: on ? c.pr : c.bd, backgroundColor: on ? c.prs : c.sf, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors[i] }} />
                        <Txt s={13.5} w={600} c={on ? c.prt : c.tx2}>{o[0]}</Txt>
                        <Txt s={13.5} w={600} mono c={on ? c.prt : c.tx2}>{p[i]}</Txt>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={{ alignItems: "center", paddingTop: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Txt s={46} w={600} mono ls={-0.06} c={amt ? c.tx : c.bd2} style={{ lineHeight: 50 }}>{amt || "0"}</Txt>
                  <Txt s={15} c={c.mu}>{isBuy ? "PZC" : "shares"}</Txt>
                </View>
                <Txt s={12.5} c={c.mu} style={{ marginTop: 4 }}>{isBuy ? "Balance " + fmt(bal) + " PZC" : "You hold " + fmt(held) + " shares"}</Txt>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
                {quick.map(([label, fn]) => (
                  <Pressable key={label} onPress={fn} style={{ height: 30, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: c.bd, backgroundColor: c.sf, justifyContent: "center" }}>
                    <Txt s={12.5} w={500} mono c={c.tx2}>{label}</Txt>
                  </Pressable>
                ))}
              </View>

              <View style={{ gap: 7, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.sf2 }}>
                <KV k="Price" v={price + " PZC / share"} />
                {isBuy ? (
                  <>
                    <KV k="Shares" v={fmt(calc.shares)} />
                    <KV k={"Payout if " + lab} v={<Txt s={13.5} mono w={600} c={c.yes}>{fmt(calc.payout)} PZC <Txt s={13.5} mono c={c.yes}>({(ret >= 0 ? "+" : "") + ret}%)</Txt></Txt>} />
                  </>
                ) : (
                  <KV k="Total proceeds" v={<Txt s={13.5} mono w={600} c={c.amt}>{fmt(calc.cost)} PZC</Txt>} />
                )}
              </View>

              {!!err && <Txt s={12.5} w={500} c={c.no} center style={{ marginVertical: -4 }}>{err}</Txt>}

              <Button
                label={!amt ? "Enter an amount" : (isBuy ? "Buy " : "Sell ") + lab + " · " + fmt(calc.cost) + " PZC"}
                onPress={confirm}
                disabled={!can}
                bg={isBuy ? c.pr : c.tx}
                color={isBuy ? "#fff" : c.bg}
                radius={13}
              />

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {KEYS.map((k) => (
                  <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => ({ width: "33.333%", height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.sf2 : "transparent" })}>
                    {k === "del" ? <Icon name="backspace-outline" size={22} color={c.tx} /> : <Txt s={22} w={500} mono>{k}</Txt>}
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={{ alignItems: "center", gap: 8, paddingTop: 18, paddingBottom: 6 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.yess, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="checkmark" size={34} color={c.yes} />
                </View>
                <Txt s={22} w={650} ls={-0.03} style={{ marginTop: 6 }}>Order filled</Txt>
                <Txt s={14.5} c={c.tx2} center>
                  {done.verb} <Txt s={14.5} mono c={c.tx2}>{done.shares}</Txt> shares of {done.label} at <Txt s={14.5} mono c={c.tx2}>{done.price}</Txt> PZC
                </Txt>
                <Txt s={12.5} c={c.mu} center style={{ maxWidth: 300 }}>{done.title}</Txt>
              </View>
              <View style={{ gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.sf2 }}>
                <KV k="Total" v={<Txt s={13.5} mono w={600} c={c.amt}>{done.total} PZC</Txt>} />
                {done.isBuy && <KV k="Payout if correct" v={<Txt s={13.5} mono w={600} c={c.yes}>{done.payout} PZC</Txt>} />}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button label="View portfolio" s={15} h={48} bg={c.sf} color={c.tx} border={c.bd2} style={{ flex: 1 }} onPress={() => { close(); router.navigate("/(tabs)/portfolio"); }} />
                <Button label="Done" s={15} h={48} bg={c.pr} color="#fff" style={{ flex: 1 }} onPress={close} />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
