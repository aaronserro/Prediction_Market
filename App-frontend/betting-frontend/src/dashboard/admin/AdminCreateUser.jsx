import React, { useState, useEffect, useCallback } from "react";
import AdminNavbar from "./AdminNavbar.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const ROLES = ["USER", "ADMIN"];

const EMPTY_FORM = { username: "", email: "", password: "", confirmPassword: "", role: "USER" };

export default function AdminCreateUser() {
  // --- Create form state ---
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");

  // --- Users list state ---
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // user object awaiting confirmation
  const [viewUser, setViewUser] = useState(null);   // full user detail object
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  // --- Fetch users ---
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.content ?? []);
    } catch (err) {
      setUsersError(err.message || "Could not load users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Create user ---
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCreateError("");
    setCreateSuccess("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setCreateError("Username, email, and password are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to create user (${res.status})`);
      }
      setCreateSuccess(`User "${form.username.trim()}" created successfully.`);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (err) {
      setCreateError(err.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  // --- Delete user ---
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/${confirmDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete user (${res.status})`);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
    } catch (err) {
      setUsersError(err.message || "Could not delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- View user ---
  const handleView = async (userId) => {
    setViewUser(null);
    setViewError("");
    setViewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
      setViewUser(await res.json());
    } catch (err) {
      setViewError(err.message || "Could not load user.");
      setViewUser({});
    } finally {
      setViewLoading(false);
    }
  };

  // --- Filtered users ---
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Section 1: Create User ── */}
        <section>
          <div className="mb-6 pb-5 border-b border-slate-800">
            <h1 className="text-xl font-semibold text-slate-100">Create User</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manually provision a new account. Users access the platform by invitation only.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. john_doe"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {createError && (
              <div className="p-3 rounded-md bg-red-500/[0.08] border border-red-500/20">
                <p className="text-sm text-red-400">{createError}</p>
              </div>
            )}
            {createSuccess && (
              <div className="p-3 rounded-md bg-emerald-500/[0.08] border border-emerald-500/20">
                <p className="text-sm text-emerald-400">{createSuccess}</p>
              </div>
            )}

            <div className="pt-1 flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 rounded-md bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating…" : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => { setForm(EMPTY_FORM); setCreateError(""); setCreateSuccess(""); }}
                className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-400 text-sm font-medium hover:text-white hover:border-slate-500 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* ── Section 2: All Users ── */}
        <section>
          <div className="mb-6 pb-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">All Users</h2>
              <p className="text-sm text-slate-500 mt-1">
                {usersLoading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} registered`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by name, email, role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
              <button
                onClick={fetchUsers}
                className="px-3 py-2 rounded-md border border-slate-700 text-slate-400 text-sm hover:text-white hover:border-slate-500 transition-colors"
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>

          {usersError && (
            <div className="p-3 rounded-md bg-red-500/[0.08] border border-red-500/20 mb-4">
              <p className="text-sm text-red-400">{usersError}</p>
            </div>
          )}

          {usersLoading ? (
            <div className="py-16 flex justify-center">
              <div className="w-6 h-6 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500">{search ? "No users match your search." : "No users found."}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{u.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          u.role === "ADMIN" || u.roles?.includes("ROLE_ADMIN") || u.roles?.includes("ADMIN")
                            ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                            : "bg-slate-700/40 text-slate-400 border-slate-700"
                        }`}>
                          {u.role ?? (u.roles?.includes("ROLE_ADMIN") ? "ADMIN" : "USER")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(u.id)}
                            className="px-3 py-1.5 rounded text-xs font-medium border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={deletingId === u.id}
                            className="px-3 py-1.5 rounded text-xs font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-40 transition-colors"
                          >
                            {deletingId === u.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── View user modal ── */}
      {(viewLoading || viewUser !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">User Details</h3>
              <button
                onClick={() => { setViewUser(null); setViewError(""); }}
                className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {viewLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : viewError ? (
              <p className="text-sm text-red-400 py-4">{viewError}</p>
            ) : viewUser && (
              <div className="space-y-3 text-sm">
                {[
                  ["ID",       viewUser.id],
                  ["Username", viewUser.username],
                  ["Email",    viewUser.email],
                  ["Role",     viewUser.role ?? (viewUser.roles?.includes("ROLE_ADMIN") ? "ADMIN" : "USER")],
                  ["Joined",   viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString() : "—"],
                  ["Balance",  viewUser.balanceCents != null ? `$${(viewUser.balanceCents / 100).toFixed(2)}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-slate-800 pb-2 last:border-0">
                    <span className="text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-slate-200 text-right break-all">{value ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setViewUser(null); setViewError(""); }}
                className="px-4 py-2 rounded-md border border-slate-700 text-slate-400 text-sm hover:text-white hover:border-slate-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Delete user?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete{" "}
              <span className="text-white font-medium">{confirmDelete.username}</span>.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-md border border-slate-700 text-slate-400 text-sm hover:text-white hover:border-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
