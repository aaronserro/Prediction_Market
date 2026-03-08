import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { PageShell } from "./Dashboard.jsx";

/**
 * Wallet.jsx — drop-in page
 * - Uses /api/v1/users/:userId/wallet endpoints
 * - Sends cookies (credentials: 'include') for JWT auth
 * - Robust fetch helper that surfaces non-JSON errors clearly
 * - Tailwind UI
 */

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

// ===== Small fetch helper (robust JSON + good error messages) =====
async function http(path, opts = {}) {
  const url = `${API_BASE}${path}`.replace(/\n/g, "");
  const hasBody = opts.body != null && opts.method && opts.method !== "GET";

  const res = await fetch(url, {
    credentials: "include", // send cookies (JWT)
    ...opts,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });

  // read text once so we can parse or show HTML error
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text.slice(0, 400)}`);
  }
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType} :: ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse JSON :: ${text.slice(0, 400)}`);
  }
}

// ===== Currency helpers =====
const fmtCAD = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const centsToCAD = (cents) => fmtCAD.format((Number(cents) || 0) / 100);

// ===== API (consistent, all under /api/v1) =====
const api = {
  getWallet: (userId) => http(`/api/v1/users/${userId}/wallet`),
  listFundRequests: (userId) =>
    http(`/api/v1/users/${userId}/wallet/fund-requests`),

  createFundRequest: (userId, amountCents, reason) =>
    http(`/api/v1/users/${userId}/wallet/fund-requests`, {
      method: "POST",
      body: JSON.stringify({ amountCents, reason }),
    }),

  // Adjust these if your backend uses different paths:
  //listFundRequests: (userId) => http(`/api/v1/users/${userId}/wallet/fund-requests`),
  /*
  createFundRequest: (userId, amountCents, reason) =>
    http(`/api/v1/users/${userId}/wallet/fund-requests`, {
      method: "POST",
      body: JSON.stringify({ amountCents, reason }),
    }),
    */
};

export default function Wallet() {
  const { user } = useAuth();
  const userId = user?.userId || user?.id || 1;

  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Fund requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Account top-up");
  const [submitting, setSubmitting] = useState(false);

  // UX state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const refreshWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      setError(null);
      const w = await api.getWallet(userId);
      setWallet(w);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingWallet(false);
    }
  }, [userId]);

const refreshRequests = useCallback(async () => {
  try {
    setLoadingRequests(true);
    setError(null);
    const list = await api.listFundRequests(userId);
    setRequests(Array.isArray(list) ? list : []);
  } catch (e) {
    setError(e.message || String(e));
  } finally {
    setLoadingRequests(false);
  }
}, [userId]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const balancePretty = useMemo(
    () => centsToCAD(wallet?.balanceCents || 0),
    [wallet]
  );

  async function onRequestFunds() {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const cents = Math.round(parseFloat(amount || "0") * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Enter a positive amount.");
      if (!reason.trim()) throw new Error("Please provide a reason for this request.");

      await api.createFundRequest(userId, cents, reason);

      setAmount("");
      setReason("Account top-up");
      setSuccess("Fund request submitted! You’ll receive an email when it’s processed.");

      await Promise.all([refreshWallet(), refreshRequests()]);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return "#34d399";
      case "REJECTED": return "#f87171";
      case "PENDING":  return "#fbbf24";
      default:         return "#9ca3af";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "APPROVED": return "#064e3b";
      case "REJECTED": return "#7f1d1d";
      case "PENDING":  return "#78350f";
      default:         return "#1f2937";
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">Wallet</h1>
          <p className="mt-1 text-sm text-slate-500">
            Request funds to add to your account balance
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
            <p className="whitespace-pre-wrap text-sm text-red-300/80">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <p className="text-sm font-semibold text-emerald-400 mb-1">Success</p>
            <p className="text-sm text-emerald-300/80">{success}</p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Balance card */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 12V7H5a2 2 0 010-4h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a2 2 0 012-2h16" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Current Balance</p>
                <p className="text-3xl font-black text-white mt-0.5 tracking-tight">
                  {loadingWallet ? "…" : balancePretty}
                </p>
              </div>
            </div>
            {wallet?.updatedAt && (
              <p className="text-xs text-slate-600">
                Last updated: {new Date(wallet.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Request funds card */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
            <div className="flex items-center gap-2 mb-5">
              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h2 className="text-base font-black text-white uppercase tracking-wider">Request Funds</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-widest">Amount (CAD)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] py-3 pl-8 pr-4 text-white placeholder-slate-600 focus:border-violet-500/50 focus:outline-none focus:bg-white/[0.06] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-widest">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.07] bg-[#0d0a1a] py-3 px-4 text-white focus:border-violet-500/50 focus:outline-none focus:bg-[#110d20] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Account top-up">Account top-up</option>
                  <option value="Tournament entry">Tournament entry</option>
                  <option value="Promotional credit">Promotional credit</option>
                  <option value="Referral reward">Referral reward</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                onClick={onRequestFunds}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 font-black text-[#1a0a00] text-sm transition-all hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-900/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>

              <p className="text-xs text-slate-600">
                An admin will review your request. You'll be notified once it's processed.
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
          <div className="mb-5 flex items-center gap-2">
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Request History</h2>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-violet-900 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No fund requests yet</div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-black text-white">
                          {centsToCAD(req.amountCents)}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          req.status === "APPROVED" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                          req.status === "REJECTED" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                          req.status === "PENDING"  ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                          "text-slate-400 bg-white/[0.04] border-white/[0.06]"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.reason && <p className="mt-2 text-sm text-slate-400">{req.reason}</p>}
                      <div className="mt-2 text-xs text-slate-600">
                        Requested: {req.createdAt ? new Date(req.createdAt).toLocaleString() : "—"}
                      </div>
                      {req.processedAt && (
                        <div className="text-xs text-slate-600">
                          Processed: {new Date(req.processedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
