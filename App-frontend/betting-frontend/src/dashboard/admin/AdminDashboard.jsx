// src/dashboard/admin/AdminDashboard.jsx

import { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import { ErrorNote, Page, PageHeader, Spinner, StatusPill, card, inputCls, tdCls, thCls } from "../../components/ui.jsx";
import { fmt } from "../../lib/format.js";

function StatCard({ label, value, hint }) {
  return (
    <div className={`${card} px-[22px] py-5`}>
      <div className="text-[13px] text-mu mb-1.5">{label}</div>
      <div className="font-mono text-[26px] font-semibold tracking-[-0.04em] leading-tight">{value ?? "—"}</div>
      {hint && <div className="mt-1 text-[12.5px] text-mu">{hint}</div>}
    </div>
  );
}

function TopList({ title, items, emptyLabel }) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="px-[22px] py-3.5 text-[14px] font-semibold border-b border-bd">{title}</div>
      {!items || items.length === 0 ? (
        <p className="px-[22px] py-5 m-0 text-[13.5px] text-mu">{emptyLabel}</p>
      ) : (
        items.map((item, idx) => (
          <div key={item.id ?? idx} className="flex items-center gap-3 px-[22px] py-3 border-b border-bd last:border-b-0 text-[13.5px]">
            <span className="font-mono text-mu w-4">{idx + 1}</span>
            <span className="flex-1 min-w-0 truncate">{item.name}</span>
            <span className="font-mono font-semibold">{item.metricLabel}</span>
          </div>
        ))
      )}
    </div>
  );
}

function ActiveUsersTable({ users, loading, error }) {
  return (
    <div className={`${card} overflow-hidden min-w-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px]">
        <div>
          <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">Active users</h2>
          <p className="m-0 mt-0.5 text-[13px] text-mu">Users with recent activity on Pryzm.</p>
        </div>
        <input type="text" placeholder="Search users…" className={`${inputCls} !h-[38px] !w-56 !text-[14px]`} />
      </div>

      {error && <div className="px-[22px] pb-4"><ErrorNote>{error}</ErrorNote></div>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Username</th>
                <th className={thCls}>Email</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Last active</th>
                <th className={`${thCls} !text-right`}>Trades</th>
                <th className={`${thCls} !text-right`}>Wallet PZC</th>
              </tr>
            </thead>
            <tbody>
              {!users || users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-[22px] py-10 text-center text-[14px] text-mu">
                    No active users loaded. Connect this to your API.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-sf2 transition-colors">
                    <td className={`${tdCls} font-[550]`}>{u.username}</td>
                    <td className={`${tdCls} text-tx2 truncate max-w-[200px]`}>{u.email}</td>
                    <td className={tdCls}><StatusPill status={(u.status ?? "Active").toUpperCase()} /></td>
                    <td className={`${tdCls} text-mu`}>{u.lastActive ?? "—"}</td>
                    <td className={`${tdCls} text-right font-mono`}>{u.betsCount ?? 0}</td>
                    <td className={`${tdCls} text-right font-mono`}>{fmt(u.walletVc ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [stats, setStats] = useState({
    newUsersCount: 0,
    outstandingFundRequests: 0,
    topMarkets: [],
    topTournaments: [],
    activeVcPercent: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadActiveUsers() {
      setUsersLoading(true);
      setUsersError("");
      try {
        // TODO: replace with real API call, e.g. fetchActiveUsers()
        const mock = [
          { id: 1, username: "pryzm_fan", email: "user1@example.com", status: "Active", lastActive: "Just now", betsCount: 23, walletVc: 1450 },
          { id: 2, username: "predictor_99", email: "user2@example.com", status: "Active", lastActive: "5 min ago", betsCount: 12, walletVc: 820 },
        ];
        if (!cancelled) setActiveUsers(mock);
      } catch (err) {
        if (!cancelled) setUsersError(err.message || "Failed to load active users.");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");
      try {
        // TODO: replace with real API call, e.g. fetchAdminOverviewStats()
        const overview = {
          newUsersCount: 7,
          outstandingFundRequests: 3,
          activeVcPercent: 64.3,
          topMarkets: [
            { id: "m1", name: "Raptors vs Bulls", metricLabel: "2.4K PZC" },
            { id: "m2", name: "BTC > $90k by EOY", metricLabel: "1.1K PZC" },
            { id: "m3", name: "Oscars: Best Picture", metricLabel: "980 PZC" },
          ],
          topTournaments: [
            { id: "t1", name: "NBA Playoffs 2026", metricLabel: "10.2K PZC" },
            { id: "t2", name: "Summer Blockbusters", metricLabel: "4.3K PZC" },
            { id: "t3", name: "Crypto Season", metricLabel: "3.9K PZC" },
          ],
        };
        if (!cancelled) setStats(overview);
      } catch (err) {
        if (!cancelled) setStatsError(err.message || "Failed to load admin statistics.");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadActiveUsers();
    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Page className="flex flex-col gap-5">
        <PageHeader title="Admin overview" subtitle="Monitor active users, fund request load, and top markets." />
        {statsError && <ErrorNote>{statsError}</ErrorNote>}

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <StatCard label="New users" value={statsLoading ? "…" : stats.newUsersCount} hint="Recent signups (last 7 days)" />
          <StatCard label="Outstanding fund requests" value={statsLoading ? "…" : stats.outstandingFundRequests} hint="Awaiting an admin decision" />
          <StatCard
            label="PZC in play"
            value={statsLoading ? "…" : stats.activeVcPercent != null ? `${stats.activeVcPercent.toFixed(1)}%` : "—"}
            hint="Share of PZC currently in markets"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)] items-start">
          <ActiveUsersTable users={activeUsers} loading={usersLoading} error={usersError} />
          <div className="flex flex-col gap-4">
            <TopList title="Top active markets" items={stats.topMarkets} emptyLabel="No market activity yet." />
            <TopList title="Top active tournaments" items={stats.topTournaments} emptyLabel="No tournament activity yet." />
          </div>
        </div>
      </Page>
    </div>
  );
}
