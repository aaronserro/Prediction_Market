import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * Wallet.jsx — drop-in page
 * - Uses /api/v1/users/:userId/wallet endpoints
 * - Sends cookies (credentials: 'include') for JWT auth
 * - Robust fetch helper that surfaces non-JSON errors clearly
 * - Tailwind UI
 */

// ===== Config =====
// Keep empty and use a Vite proxy for '/api' -> 'http://localhost:8080'.
// If you prefer direct calls, set e.g. const API_BASE = "http://localhost:8080";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  const [reason, setReason] = useState("");
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
      setReason("");
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
    <div className="min-h-screen bg-[#0f0f14] text-white">
      {/* background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.2), transparent 80%), radial-gradient(1000px 500px at 90% -20%, rgba(217, 70, 239, 0.15), transparent 80%), #0f0f14",
        }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">Fund Wallet</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Request funds to add to your account balance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">User ID</span>
            <input
              type="number"
              min={1}
              value={userId}
              onChange={(e) => setUserId(parseInt(e.target.value || "1", 10))}
              className="w-20 rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={() => {
                refreshWallet();
                //refreshRequests();
              }}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-indigo-500 hover:to-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/30 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-red-300">Error</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/50 bg-green-950/30 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-300">Success</span>
            </div>
            <p className="mt-2 text-sm text-green-200">{success}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Balance card */}
          <div className="rounded-2xl border border-zinc-800/70 bg-black/30 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 12V7H5a2 2 0 010-4h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a2 2 0 012-2h16" />
                </svg>
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-zinc-400">Current Balance</div>
                <div className="text-3xl font-bold text-white">
                  {loadingWallet ? "…" : balancePretty}
                </div>
              </div>
            </div>
            {wallet?.updatedAt && (
              <div className="text-xs text-zinc-500">
                Last updated: {new Date(wallet.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Request funds card */}
          <div className="rounded-2xl border border-zinc-800/70 bg-black/30 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h2 className="text-lg font-semibold text-amber-400">Request Funds</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Amount (CAD)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-black/50 py-3 pl-8 pr-4 text-white placeholder-zinc-600 backdrop-blur-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Reason for Request</label>
                <textarea
                  placeholder="e.g., Account top-up for tournament entry"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white placeholder-zinc-600 backdrop-blur-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={onRequestFunds}
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-3 font-semibold text-white transition-all hover:from-indigo-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>

              <p className="text-xs text-zinc-500">
                An email will be sent to the admin for approval. You’ll be notified once processed.
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-6 rounded-2xl border border-zinc-800/70 bg-black/30 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-lg font-semibold text-amber-400">Request History</h2>
          </div>

          {loadingRequests ? (
            <div className="py-8 text-center text-zinc-400">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">No fund requests yet</div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="rounded-lg border border-zinc-800 bg-black/20 p-4 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-white">
                          {centsToCAD(req.amountCents)}
                        </span>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            color: getStatusColor(req.status),
                            backgroundColor: getStatusBg(req.status),
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">{req.reason}</p>
                      <div className="mt-2 text-xs text-zinc-500">
                        Requested: {req.createdAt ? new Date(req.createdAt).toLocaleString() : "—"}
                      </div>
                      {req.processedAt && (
                        <div className="text-xs text-zinc-500">
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}
