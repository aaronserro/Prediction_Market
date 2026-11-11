// src/admin/AdminFundRequests.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import {
  fetchFundRequestsByStatus,
  approveFundRequest,
  rejectFundRequest,
} from "../../auth/adminHelpers";
import { ErrorNote, Page, PageHeader, Spinner, StatusPill, Tabs, card, tdCls, thCls } from "../../components/ui.jsx";
import { fmt, fmtDateTime } from "../../lib/format.js";

const TABS = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

export default function AdminFundRequests() {
  const [requests, setRequests] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await fetchFundRequestsByStatus(currentStatus);
        // Each request includes userId and username.
        if (!cancelled) setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          setErrorMsg(`Access denied (${err.status}). Your account may not have admin privileges on the server.`);
          if (!cancelled) setLoading(false);
          return;
        }
        if (!cancelled) setErrorMsg(err.message || "Failed to load fund requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentStatus, navigate]);

  // Fund request amounts are stored in cents; 1 PZC = 1 cent.
  const formatAmount = (amountCents) => (amountCents == null ? "—" : `${fmt(amountCents)} PZC`);

  // 409 = the request is no longer PENDING (processed elsewhere); drop it from this list.
  function handleConflict(id, err) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setErrorMsg(`Request #${id} was already processed: ${err.message}`);
  }

  async function handleApprove(id) {
    setBusyId(id);
    setErrorMsg("");
    try {
      await approveFundRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/login", { replace: true, state: { from: "/admin" } });
        return;
      }
      if (err.status === 409) return handleConflict(id, err);
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
      if (err.status === 409) return handleConflict(id, err);
      setErrorMsg(err.message || "Failed to reject request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Page className="flex flex-col gap-5">
        <PageHeader title="Fund requests" subtitle="Review PZC top-up requests from users." />

        {errorMsg && <ErrorNote>{errorMsg}</ErrorNote>}

        <section className={`${card} overflow-hidden`}>
          <Tabs
            value={currentStatus}
            onChange={setCurrentStatus}
            tabs={TABS.map((t) => ({ value: t.id, label: t.label, count: t.id === currentStatus && !loading ? requests.length : "" }))}
          />
          {loading ? (
            <Spinner />
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-mu">No {currentStatus.toLowerCase()} fund requests.</div>
          ) : (
            <div className="overflow-x-auto -mt-px">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>ID</th>
                    <th className={thCls}>User</th>
                    <th className={`${thCls} !text-right`}>Amount</th>
                    <th className={thCls}>Reason</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Created</th>
                    <th className={`${thCls} !text-right`}>{currentStatus === "PENDING" ? "Actions" : ""}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-sf2 transition-colors">
                      <td className={`${tdCls} font-mono text-mu`}>{req.id}</td>
                      <td className={`${tdCls} font-[550]`}>
                        {req.username || req.userId || "—"}
                      </td>
                      <td className={`${tdCls} text-right font-mono font-semibold whitespace-nowrap`}>{formatAmount(req.amountCents)}</td>
                      <td className={`${tdCls} text-tx2 max-w-xs break-words`}>{req.reason}</td>
                      <td className={tdCls}><StatusPill status={req.status} /></td>
                      <td className={`${tdCls} text-mu whitespace-nowrap`}>{fmtDateTime(req.createdAt)}</td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        {currentStatus === "PENDING" && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={busyId === req.id}
                              className="h-8 px-3 rounded-lg border-0 bg-yess text-yes text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {busyId === req.id ? "Approving…" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={busyId === req.id}
                              className="h-8 px-3 rounded-lg border-0 bg-nos text-no text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {busyId === req.id ? "Rejecting…" : "Reject"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Page>
    </div>
  );
}
