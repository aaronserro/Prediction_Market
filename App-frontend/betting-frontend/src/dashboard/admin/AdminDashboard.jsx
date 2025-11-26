// src/admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFundRequestsByStatus,
  approveFundRequest,
  rejectFundRequest,
} from "../../auth/adminHelpers";

const TABS = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // load whenever tab/status changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        console.log('[AdminDashboard] Fetching fund requests with status:', currentStatus);
        const data = await fetchFundRequestsByStatus(currentStatus);
        console.log('[AdminDashboard] Received data:', data);
        if (!cancelled) {
          setRequests(data || []);
        }
      } catch (err) {
        console.error('[AdminDashboard] Error fetching fund requests:', err);
        if (err.status === 401 || err.status === 403) {
          console.error('[AdminDashboard] Authorization failed - 403/401. User may not have admin privileges on backend.');
          setErrorMsg(`Access denied (${err.status}). Your account may not have admin privileges on the server.`);
          // Don't redirect immediately, show the error
          if (!cancelled) setLoading(false);
          return;
        }
        if (!cancelled) {
          setErrorMsg(err.message || "Failed to load fund requests.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStatus, navigate]);

  const formatAmount = (amountCents) => {
    if (amountCents == null) return "-";
    return `$${(amountCents / 100).toFixed(2)}`;
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  async function handleApprove(id) {
    setBusyId(id);
    setErrorMsg("");
    try {
      await approveFundRequest(id);
      // Remove from list in Pending tab
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/login", { replace: true, state: { from: "/admin" } });
        return;
      }
      setErrorMsg(err.message || "Failed to approve request.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    setBusyId(id);
    setErrorMsg("");
    try {
      await rejectFundRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/login", { replace: true, state: { from: "/admin" } });
        return;
      }
      setErrorMsg(err.message || "Failed to reject request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 text-slate-100">
      <h1 className="text-2xl font-bold mb-4">
        Admin – Fund Requests
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-700 pb-1">
        {TABS.map((tab) => {
          const active = tab.id === currentStatus;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentStatus(tab.id)}
              className={
                "px-4 py-2 rounded-t-lg text-sm font-semibold " +
                (active
                  ? "bg-slate-800 text-slate-50 border-x border-t border-slate-700"
                  : "bg-slate-900/40 text-slate-400 hover:text-slate-100")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-4 py-2 text-red-200">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div>Loading {currentStatus.toLowerCase()} requests…</div>
      ) : requests.length === 0 ? (
        <div className="mt-4 text-slate-300">
          No {currentStatus.toLowerCase()} fund requests.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  User
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  Reason
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-t border-slate-800 hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 text-slate-100">{req.id}</td>
                  <td className="px-4 py-3 text-slate-100">
                    {req.userIdentifier || req.username || req.userEmail}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatAmount(req.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-slate-100 max-w-xs break-words">
                    {req.reason}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {req.status}
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {currentStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={busyId === req.id}
                          className="inline-flex items-center rounded-lg bg-emerald-500/90 hover:bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === req.id ? "Approving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={busyId === req.id}
                          className="inline-flex items-center rounded-lg bg-rose-500/90 hover:bg-rose-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === req.id ? "Rejecting…" : "Reject"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
