import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useWallet, userIdOf } from "../lib/wallet.jsx";
import { getJSON } from "../lib/markets.js";
import { fmt, fmtDate, fmtDateTime } from "../lib/format.js";
import { Coin, ErrorNote, Page, PageHeader, Segmented, card } from "../components/ui.jsx";
import { totals } from "../lib/positions.js";

// Amounts are PZC; the API stores them as cents (1 PZC = 1 cent).
const PRESETS = [100, 500, 1000, 5000];
const REASONS = ["Account top-up", "Tournament entry", "Promotional credit", "Referral reward", "Other"];
const TX_TABS = ["All", "Trades", "Payouts", "Funding"];

const PILL = {
  PENDING: "bg-ams text-amt",
  APPROVED: "bg-yess text-yes",
  REJECTED: "bg-nos text-no",
};
const Pill = ({ status }) => (
  <span className={`px-[9px] py-[3px] rounded-md text-xs font-semibold flex-none ${PILL[status] || "bg-sf2 text-mu"}`}>{status}</span>
);

function Stepper({ request }) {
  const st = request.status;
  const done = { dot: "bg-pr border-pr", inner: "bg-white", title: "text-tx" };
  const cur = { dot: "bg-sf border-am", inner: "bg-am", title: "text-tx" };
  const todo = { dot: "bg-sf border-bd2", inner: "bg-transparent", title: "text-mu" };
  const bad = { dot: "bg-no border-no", inner: "bg-white", title: "text-no" };
  const pending = st === "PENDING";
  const rejected = st === "REJECTED";

  const steps = [
    { ...done, label: "Submitted", sub: fmtDateTime(request.createdAt), line: pending ? "var(--bd)" : "var(--pr)" },
    {
      ...(pending ? cur : done),
      label: "Under review",
      sub: pending ? "Usually within 24 hours" : "Reviewed by admin",
      line: pending ? "var(--bd)" : rejected ? "var(--no)" : "var(--pr)",
    },
    {
      ...(pending ? todo : rejected ? bad : done),
      label: rejected ? "Rejected" : "Credited to wallet",
      sub: pending ? "Pending" : rejected ? "Not credited · contact support" : `${fmt(request.amountCents)} PZC added`,
      line: "transparent",
    },
  ];

  return (
    <div className="grid grid-cols-3">
      {steps.map((s) => (
        <div key={s.label} className="flex flex-col gap-2.5 min-w-0">
          <div className="flex items-center">
            <div className={`w-[22px] h-[22px] rounded-full flex-none border-2 flex items-center justify-center ${s.dot}`}>
              <div className={`w-2 h-2 rounded-full ${s.inner}`} />
            </div>
            <div className="flex-1 h-0.5 mx-2" style={{ background: s.line }} />
          </div>
          <div className="pr-3">
            <div className={`text-[14px] font-semibold ${s.title}`}>{s.label}</div>
            <div className="text-[12.5px] text-mu mt-0.5">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Wallet() {
  const { user } = useAuth();
  const userId = userIdOf(user);
  const { wallet, balance, refresh: refreshWallet } = useWallet();

  const [requests, setRequests] = useState([]);
  const [positions, setPositions] = useState([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [txTab, setTxTab] = useState("All");

  const refreshRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getJSON(`/api/v1/users/${userId}/wallet/fund-requests`);
      setRequests(
        (Array.isArray(list) ? list : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [userId]);

  useEffect(() => { refreshRequests(); }, [refreshRequests]);
  useEffect(() => {
    getJSON("/api/v1/positions/me").then((d) => setPositions(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const amt = parseFloat(amount);
  const canSubmit = amt > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    const amountCents = Math.round(amt);
    setSubmitting(true);
    setError(null);
    // Optimistically show the new request at the top of the list.
    const optimistic = { id: `tmp-${Date.now()}`, amountCents, reason, status: "PENDING", createdAt: new Date().toISOString() };
    setRequests((r) => [optimistic, ...r]);
    try {
      await getJSON(`/api/v1/users/${userId}/wallet/fund-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, reason }),
      });
      setAmount("");
      setReason(REASONS[0]);
      setSuccess(true);
      await Promise.all([refreshWallet(), refreshRequests()]);
    } catch (e) {
      setRequests((r) => r.filter((x) => x.id !== optimistic.id));
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const inPositions = totals(positions).value;
  const pending = requests.filter((r) => r.status === "PENDING").reduce((s, r) => s + (Number(r.amountCents) || 0), 0);
  const latest = requests[0];

  // No transaction-history endpoint yet: funding rows are derived from approved requests.
  const txs = useMemo(
    () =>
      requests
        .filter((r) => r.status === "APPROVED")
        .map((r) => ({ id: r.id, date: r.processedAt || r.createdAt, type: "Funding", desc: r.reason || "Fund request", amt: Number(r.amountCents) || 0 })),
    [requests]
  );
  const shownTxs = txTab === "All" || txTab === "Funding" ? txs : [];

  return (
    <Page className="flex flex-col gap-5">
      <PageHeader title="Wallet" subtitle="Your PZC balance, fund requests and transaction history" />

      {success && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5 rounded-xl bg-yess text-yes text-[14px]">
          <span className="font-semibold">Request submitted.</span>
          <span className="text-tx2">You’ll receive an email when it’s processed.</span>
          <button onClick={() => setSuccess(false)} className="ml-auto border-0 bg-transparent text-mu text-[13px] cursor-pointer hover:text-tx">
            Dismiss
          </button>
        </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap gap-4 items-stretch">
        <div className={`${card} flex-[1_1_380px] min-w-0 p-6 flex flex-col gap-[22px]`}>
          <div>
            <div className="text-[13px] text-mu mb-2">Available balance</div>
            <div className="flex items-center gap-3">
              <Coin size={30} ring={4} />
              <span className="font-mono text-[44px] font-semibold tracking-[-0.05em] leading-none">{balance === null ? "—" : fmt(balance)}</span>
              <span className="text-[15px] text-mu self-end pb-1">PZC</span>
            </div>
          </div>
          <div className="flex flex-col border-t border-bd">
            <div className="flex justify-between py-3 border-b border-bd text-[14px]">
              <span className="text-tx2">In open positions</span><span className="font-mono">{fmt(inPositions)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-bd text-[14px]">
              <span className="text-tx2">Pending requests</span><span className="font-mono text-amt">{fmt(pending)}</span>
            </div>
            <div className="flex justify-between py-3 text-[14px] font-semibold">
              <span>Total account value</span><span className="font-mono">{fmt((balance ?? 0) + inPositions)}</span>
            </div>
          </div>
          <div className="mt-auto text-[12.5px] text-mu">
            {wallet?.updatedAt ? `Last updated ${fmtDateTime(wallet.updatedAt)} · ` : ""}1 share pays 100 PZC on a correct outcome
          </div>
        </div>

        <div className={`${card} flex-[1_1_380px] min-w-0 p-6 flex flex-col gap-[18px]`}>
          <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Request funds</h2>
          <div>
            <label className="block text-[13px] text-tx2 font-medium mb-[7px]" htmlFor="pz-amount">Amount</label>
            <div className="flex items-center h-[50px] rounded-[11px] border border-bd2 bg-sf px-3.5 gap-2.5 focus-within:border-pr">
              <Coin size={16} />
              <input
                id="pz-amount"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 min-w-0 border-0 outline-none bg-transparent text-tx font-mono text-[20px] font-semibold tracking-[-0.03em] placeholder:text-mu"
              />
              <span className="text-[13px] text-mu">PZC</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {PRESETS.map((v) => {
                const on = amt === v;
                return (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`h-[34px] rounded-lg border font-mono text-[13px] font-medium cursor-pointer transition-colors ${
                      on ? "bg-prs border-pr text-prt" : "bg-sf border-bd text-tx2 hover:border-bd2"
                    }`}
                  >
                    {fmt(v)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-tx2 font-medium mb-[7px]" htmlFor="pz-reason">Reason</label>
            <select
              id="pz-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-[46px] rounded-[11px] border border-bd2 bg-sf text-tx px-3 text-[14.5px] cursor-pointer outline-none focus:border-pr"
            >
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="h-12 border-0 rounded-[11px] bg-am text-[#1d1300] text-[15px] font-[650] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 enabled:hover:brightness-105"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
          <p className="m-0 text-[12.5px] text-mu">An admin will review your request. You'll be notified once it's processed.</p>
        </div>
      </div>

      {latest && (
        <div className={`${card} px-6 py-[22px]`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 mb-[22px]">
            <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Latest request</h2>
            <span className="font-mono text-[14px] font-semibold">{fmt(latest.amountCents)} PZC</span>
            <span className="text-[13.5px] text-mu">{latest.reason}</span>
            <span className="ml-auto"><Pill status={latest.status} /></span>
          </div>
          <Stepper request={latest} />
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-start">
        <section className={`${card} flex-[2_1_560px] min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px]">
            <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Transactions</h2>
            <Segmented options={TX_TABS} value={txTab} onChange={setTxTab} />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[110px_86px_minmax(0,1fr)_100px_100px] gap-3 px-[22px] py-2.5 border-y border-bd bg-sf2 text-xs text-mu font-medium">
                <span>Date</span><span>Type</span><span>Details</span><span className="text-right">Amount</span><span className="text-right">Balance</span>
              </div>
              {shownTxs.length ? (
                shownTxs.map((x) => (
                  <div key={x.id} className="grid grid-cols-[110px_86px_minmax(0,1fr)_100px_100px] gap-3 items-center px-[22px] py-[13px] border-b border-bd last:border-b-0 text-[14px]">
                    <span className="text-[13px] text-mu">{fmtDate(x.date)}</span>
                    <span className="text-[13px] text-tx2">{x.type}</span>
                    <span className="truncate">{x.desc}</span>
                    <span className={`text-right font-mono font-semibold ${x.amt > 0 ? "text-yes" : "text-tx"}`}>
                      {x.amt > 0 ? "+" : "−"}{fmt(Math.abs(x.amt))}
                    </span>
                    <span className="text-right font-mono text-mu">—</span>
                  </div>
                ))
              ) : (
                <div className="px-[22px] py-10 text-center text-[14px] text-mu">
                  {txTab === "Trades" || txTab === "Payouts" ? `${txTab} history isn’t available yet.` : "No transactions yet."}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`${card} flex-[1_1_320px] min-w-0 overflow-hidden`}>
          <div className="px-[22px] py-[18px] border-b border-bd">
            <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Request history</h2>
          </div>
          {requests.length ? (
            requests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 px-[22px] py-3.5 border-b border-bd last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[15px] font-semibold tracking-[-0.02em]">
                    {fmt(r.amountCents)} <span className="font-sans font-normal text-[12.5px] text-mu">PZC</span>
                  </div>
                  {r.reason && <div className="text-[13px] text-tx2 mt-[3px]">{r.reason}</div>}
                  <div className="text-xs text-mu mt-[3px]">{fmtDateTime(r.createdAt)}</div>
                </div>
                <Pill status={r.status} />
              </div>
            ))
          ) : (
            <div className="px-[22px] py-10 text-center text-[14px] text-mu">No fund requests yet</div>
          )}
        </section>
      </div>
    </Page>
  );
}
