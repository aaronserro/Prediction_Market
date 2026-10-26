import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Button, Card, Chips, CoinDot, DataUnavailable, Icon, IconName, KV, PageScreen, Txt } from "../src/components/ui";
import { fmt, sgn } from "../src/data/pryzm";
import { useStore } from "../src/store/AppStore";
import { fontFamily } from "../src/theme";

const TX_TABS = ["All", "Trades", "Payouts", "Funding"] as const;

export default function Wallet() {
  const { c, bal, posValue, reqs, submitRequest, fundingReasons, transactions, realDataUnavailable } = useStore();
  const [amt, setAmt] = useState("");
  const [reason, setReason] = useState(fundingReasons[0] ?? "");
  const [txTab, setTxTab] = useState<(typeof TX_TABS)[number]>("All");
  const [done, setDone] = useState(false);
  const n = +amt || 0;

  if (realDataUnavailable) {
    return <PageScreen title="Wallet"><DataUnavailable title="Real wallet data is not configured" message="Balances, funding requests, and transaction history require backend endpoint contracts." /></PageScreen>;
  }

  const pending = reqs.filter((r) => r.status === "PENDING").reduce((a, r) => a + r.amt, 0);
  const last = reqs[0], st = last.status;
  const steps: [string, boolean][] = [["Submitted", true], ["Under review", true], [st === "REJECTED" ? "Rejected" : "Credited to wallet", st !== "PENDING"]];
  const pill = (s: string) => (s === "APPROVED" ? [c.yess, c.yes] : s === "REJECTED" ? [c.nos, c.no] : [c.ams, c.amt]);

  const submit = () => {
    if (!(n > 0)) return;
    submitRequest(n, reason);
    setAmt("");
    setDone(true);
  };

  return (
    <PageScreen title="Wallet">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }} keyboardShouldPersistTaps="handled">
        {done && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.yess }}>
            <Icon name="checkmark-circle" size={18} color={c.yes} />
            <Txt s={13.5} w={550} c={c.yes} style={{ flex: 1 }}>Request submitted. You&apos;ll be notified once it&apos;s processed.</Txt>
            <Pressable onPress={() => setDone(false)} hitSlop={8}><Txt s={13} w={600} c={c.yes}>Dismiss</Txt></Pressable>
          </View>
        )}

        <Card style={{ padding: 18 }}>
          <Txt s={13} c={c.mu} style={{ marginBottom: 6 }}>Available balance</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <CoinDot size={30} />
            <Txt s={40} w={600} mono ls={-0.05}>{fmt(bal)}</Txt>
            <Txt s={14} c={c.mu}>PZC</Txt>
          </View>
          <View style={{ gap: 9, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.bd }}>
            <KV k="In open positions" v={fmt(posValue)} />
            <KV k="Pending requests" v={fmt(pending)} />
            <KV k="Total account value" v={fmt(bal + posValue + pending)} bold />
          </View>
          <Txt s={11.5} c={c.mu} style={{ marginTop: 12 }}>Last updated just now</Txt>
        </Card>

        <Card style={{ padding: 18, gap: 12 }}>
          <Txt s={16} w={620} ls={-0.02}>Request funds</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 52, borderRadius: 12, borderWidth: 1, borderColor: c.bd2, backgroundColor: c.sf, paddingHorizontal: 14 }}>
            <TextInput value={amt} onChangeText={(v) => setAmt(v.replace(/[^0-9]/g, "").slice(0, 6))} keyboardType="number-pad" placeholder="0" placeholderTextColor={c.mu} style={{ flex: 1, minWidth: 0, color: c.tx, fontSize: 20, fontFamily: fontFamily(600, true) }} />
            <Txt s={14} c={c.mu}>PZC</Txt>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[100, 500, 1000, 5000].map((x) => {
              const on = n === x;
              return (
                <Pressable key={x} onPress={() => setAmt(String(x))} style={{ flex: 1, height: 36, borderRadius: 9, borderWidth: 1, borderColor: on ? c.pr : c.bd, backgroundColor: on ? c.prs : c.sf, alignItems: "center", justifyContent: "center" }}>
                  <Txt s={13} w={500} mono c={on ? c.prt : c.tx2}>{fmt(x)}</Txt>
                </Pressable>
              );
            })}
          </View>
          <View style={{ gap: 6 }}>
            <Txt s={12.5} c={c.mu}>Reason</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {fundingReasons.map((r) => {
                const on = r === reason;
                return (
                  <Pressable key={r} onPress={() => setReason(r)} style={{ height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: on ? c.pr : c.bd2, backgroundColor: on ? c.prs : c.sf, justifyContent: "center" }}>
                    <Txt s={13} w={550} c={on ? c.prt : c.tx2}>{r}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Button label="Submit Request" onPress={submit} disabled={!(n > 0)} bg={c.am} color="#1d1300" h={48} s={15} radius={11} />
          <Txt s={12} lh={1.5} c={c.mu} center>An admin will review your request. You&apos;ll be notified once it&apos;s processed.</Txt>
        </Card>

        <Card style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <Txt s={14} w={600}>Latest request</Txt>
            <Txt s={13} w={500} mono c={c.tx2}>{fmt(last.amt)} PZC · {last.date}</Txt>
          </View>
          <View style={{ flexDirection: "row" }}>
            {steps.map(([label, isDone], i) => {
              const cur = st === "PENDING" && i === 1, rej = st === "REJECTED" && i === 2;
              const filled = isDone && !cur;
              const dot = rej ? c.no : filled ? c.pr : c.sf;
              const ring = rej ? c.no : cur ? c.am : isDone ? c.pr : c.bd2;
              const line = i < 2 ? (st !== "PENDING" || i === 0 ? c.pr : c.bd2) : "transparent";
              const icon: IconName | null = rej ? "close" : filled ? "checkmark" : null;
              return (
                <View key={label} style={{ flex: 1, gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: dot, borderWidth: 2, borderColor: ring, alignItems: "center", justifyContent: "center" }}>
                      {icon && <Icon name={icon} size={13} color="#fff" />}
                    </View>
                    <View style={{ flex: 1, height: 2, backgroundColor: line, marginHorizontal: 6 }} />
                  </View>
                  <Txt s={12} w={550} c={cur || isDone ? c.tx : c.mu} style={{ paddingRight: 6 }}>{label}</Txt>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <Txt s={16} w={620} ls={-0.02} style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 }}>Transactions</Txt>
          <View style={{ paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.bd }}>
            <Chips items={TX_TABS} value={txTab} onChange={setTxTab} h={30} s={12.5} />
          </View>
          {transactions.filter((t) => txTab === "All" || t.kind === txTab).map((t) => (
            <View key={t.date + t.det} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.sf2, alignItems: "center", justifyContent: "center" }}>
                <Icon name={t.type === "Trade" ? "swap-horizontal" : t.type === "Payout" ? "trophy-outline" : "add"} size={16} color={c.tx2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt s={13.5} w={550} numberOfLines={1}>{t.det}</Txt>
                <Txt s={12} c={c.mu}>{t.type} · {t.date}</Txt>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Txt s={13.5} w={600} mono c={t.amt >= 0 ? c.yes : c.tx}>{sgn(t.amt)}</Txt>
                <Txt s={11.5} mono c={c.mu}>{fmt(t.bal)}</Txt>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ overflow: "hidden" }}>
          <Txt s={16} w={620} ls={-0.02} style={{ padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>Request history</Txt>
          {reqs.map((r) => {
            const [bg, col] = pill(r.status);
            return (
              <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd }}>
                <View style={{ flex: 1 }}>
                  <Txt s={15} w={600} mono>{fmt(r.amt)} PZC</Txt>
                  <Txt s={12} c={c.mu} style={{ marginTop: 2 }}>{r.reason} · {r.date}</Txt>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: bg }}>
                  <Txt s={11.5} w={650} c={col}>{r.status}</Txt>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </PageScreen>
  );
}
