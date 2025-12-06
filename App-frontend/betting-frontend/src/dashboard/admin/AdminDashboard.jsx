// src/admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">
        {value ?? "---"}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

function TopList({ title, items, emptyLabel }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-xs font-semibold text-slate-200 mb-2">
        {title}
      </h3>
      {(!items || items.length === 0) ? (
        <p className="text-xs text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5 text-xs text-slate-300">
          {items.map((item, idx) => (
            <li key={item.id ?? idx} className="flex justify-between">
              <span className="truncate max-w-[60%]">
                {idx + 1}. {item.name}
              </span>
              <span className="text-slate-400">
                {item.metricLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveUsersTable({ users, loading, error }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            Active Users
          </h2>
          <p className="text-xs text-slate-500">
            Users with recent activity on Pryzm.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          className="text-xs rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-violet-500"
        />
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-6 text-sm text-slate-300">
          Loading active users…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 pr-3 font-medium">Username</th>
                <th className="text-left py-2 pr-3 font-medium">Email</th>
                <th className="text-left py-2 pr-3 font-medium">Status</th>
                <th className="text-left py-2 pr-3 font-medium">Last Active</th>
                <th className="text-right py-2 pl-3 font-medium">Bets</th>
                <th className="text-right py-2 pl-3 font-medium">Wallet VC</th>
              </tr>
            </thead>
            <tbody>
              {(!users || users.length === 0) ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-500"
                  >
                    No active users loaded. Connect this to your API.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-900/80 hover:bg-slate-800/60"
                  >
                    <td className="py-2 pr-3 text-slate-100">
                      {u.username}
                    </td>
                    <td className="py-2 pr-3 text-slate-400 truncate max-w-[180px]">
                      {u.email}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                        {u.status ?? "Active"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {u.lastActive ?? "-"}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-100">
                      {u.betsCount ?? 0}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-100">
                      {u.walletVc ?? 0}
                    </td>
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
        // const data = await fetchActiveUsers();
        const mock = [
          {
            id: 1,
            username: "pryzm_fan",
            email: "user1@example.com",
            status: "Active",
            lastActive: "Just now",
            betsCount: 23,
            walletVc: 1450,
          },
          {
            id: 2,
            username: "predictor_99",
            email: "user2@example.com",
            status: "Active",
            lastActive: "5 min ago",
            betsCount: 12,
            walletVc: 820,
          },
        ];
        if (!cancelled) {
          setActiveUsers(mock);
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(err.message || "Failed to load active users.");
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }

    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");
      try {
        // TODO: replace with real API call, e.g. fetchAdminOverviewStats()
        // const overview = await fetchAdminOverviewStats();
        const overview = {
          newUsersCount: 7,
          outstandingFundRequests: 3,
          activeVcPercent: 64.3,
          topMarkets: [
            { id: "m1", name: "Raptors vs Bulls", metricLabel: "2.4k VC" },
            { id: "m2", name: "BTC > $90k by EOY", metricLabel: "1.1k VC" },
            { id: "m3", name: "Oscars: Best Picture", metricLabel: "980 VC" },
          ],
          topTournaments: [
            { id: "t1", name: "NBA Playoffs 2026", metricLabel: "10.2k VC" },
            { id: "t2", name: "Summer Blockbusters", metricLabel: "4.3k VC" },
            { id: "t3", name: "Crypto Season", metricLabel: "3.9k VC" },
          ],
        };
        if (!cancelled) {
          setStats(overview);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(err.message || "Failed to load admin statistics.");
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadActiveUsers();
    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNavbar />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">
              Admin Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor active users, fund request load, and top markets/tournaments.
            </p>
          </div>

          {statsError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs text-red-200 max-w-sm">
              {statsError}
            </div>
          )}
        </div>

        {/* Main grid: Active Users (left) + Stats (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)] gap-6">
          {/* Left side: Active Users table */}
          <ActiveUsersTable
            users={activeUsers}
            loading={usersLoading}
            error={usersError}
          />

          {/* Right side: Stats column */}
          <div className="space-y-4 lg:sticky lg:top-20 h-fit">
            {/* Top stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard
                label="New Users"
                value={statsLoading ? "…" : stats.newUsersCount}
                hint="Recent signups (e.g., last 7 days)"
              />
              <StatCard
                label="Outstanding Fund Requests"
                value={
                  statsLoading ? "…" : stats.outstandingFundRequests
                }
                hint="Requests awaiting admin decision"
              />
              <StatCard
                label="Active VC Usage"
                value={
                  statsLoading
                    ? "…"
                    : stats.activeVcPercent != null
                    ? `${stats.activeVcPercent.toFixed(1)}%`
                    : "---"
                }
                hint="% of VC currently in markets / tournaments"
              />
            </div>

            {/* Top markets & tournaments */}
            <TopList
              title="Top 3 Active Markets"
              items={stats.topMarkets}
              emptyLabel="No market activity yet."
            />
            <TopList
              title="Top 3 Active Tournaments"
              items={stats.topTournaments}
              emptyLabel="No tournament activity yet."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
