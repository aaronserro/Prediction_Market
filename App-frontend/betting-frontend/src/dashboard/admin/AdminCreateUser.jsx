import { useState, useEffect, useCallback } from "react";
import AdminNavbar from "./AdminNavbar.jsx";
import { Field, Modal, Notice, Page, PageHeader, Spinner, StatusPill, btnDanger, btnPrimary, btnSecondary, btnSmall, card, inputCls, tdCls, thCls } from "../../components/ui.jsx";
import { fmt, fmtDate, fmtDateTime } from "../../lib/format.js";

const roleOf = (u) => u?.role ?? (u?.roles?.includes("ROLE_ADMIN") || u?.roles?.includes("ADMIN") ? "ADMIN" : "USER");

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");
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

  const closeView = () => { setViewUser(null); setViewError(""); };

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Page className="flex flex-col gap-5">
        <PageHeader title="Users" subtitle="Provision new accounts and manage existing ones." />

        {/* ── Create user ── */}
        <section className={`${card} p-6`}>
          <h2 className="m-0 mb-1 text-[17px] font-[620] tracking-[-0.02em]">Create user</h2>
          <p className="m-0 mb-5 text-[13.5px] text-mu">Manually provision a new account. Users access the platform by invitation only.</p>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Username" htmlFor="cu-username">
                <input id="cu-username" name="username" type="text" value={form.username} onChange={handleChange} placeholder="e.g. john_doe" className={inputCls} />
              </Field>
              <Field label="Email" htmlFor="cu-email">
                <input id="cu-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" className={inputCls} />
              </Field>
              <Field label="Password" htmlFor="cu-password">
                <input id="cu-password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={inputCls} />
              </Field>
              <Field label="Confirm password" htmlFor="cu-confirm">
                <input id="cu-confirm" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" className={inputCls} />
              </Field>
            </div>
            <div className="sm:max-w-[calc(50%-8px)]">
              <Field label="Role" htmlFor="cu-role">
                <select id="cu-role" name="role" value={form.role} onChange={handleChange} className={`${inputCls} cursor-pointer`}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            {createError && <Notice kind="err">{createError}</Notice>}
            {createSuccess && <Notice kind="ok">{createSuccess}</Notice>}

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={creating} className={btnPrimary}>{creating ? "Creating…" : "Create user"}</button>
              <button type="button" onClick={() => { setForm(EMPTY_FORM); setCreateError(""); setCreateSuccess(""); }} className={btnSecondary}>
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* ── All users ── */}
        <section className={`${card} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px]">
            <div>
              <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">
                All users <span className="font-mono text-[13px] font-medium text-mu ml-1.5">{usersLoading ? "" : users.length}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name, email, role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} !h-[38px] !w-64 !text-[14px]`}
              />
              <button onClick={fetchUsers} title="Refresh" className={`${btnSecondary} !h-[38px] !w-[38px] !px-0`}>↻</button>
            </div>
          </div>

          {usersError && <div className="px-[22px] pb-4"><Notice kind="err">{usersError}</Notice></div>}

          {usersLoading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-mu border-t border-bd">{search ? "No users match your search." : "No users found."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Username</th>
                    <th className={`${thCls} hidden sm:table-cell`}>Email</th>
                    <th className={thCls}>Role</th>
                    <th className={`${thCls} hidden md:table-cell`}>Joined</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-sf2 transition-colors">
                      <td className={`${tdCls} font-[550]`}>{u.username}</td>
                      <td className={`${tdCls} text-tx2 hidden sm:table-cell`}>{u.email || "—"}</td>
                      <td className={tdCls}><StatusPill status={roleOf(u)} /></td>
                      <td className={`${tdCls} text-mu hidden md:table-cell`}>{u.createdAt ? fmtDate(u.createdAt) : "—"}</td>
                      <td className={`${tdCls} text-right`}>
                        <div className="inline-flex gap-2">
                          <button onClick={() => handleView(u.id)} className={`${btnSecondary} ${btnSmall}`}>View</button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={deletingId === u.id}
                            className="h-8 px-3 rounded-lg border-0 bg-nos text-no text-[13px] font-semibold cursor-pointer disabled:opacity-50"
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
      </Page>

      {/* ── View user modal ── */}
      {(viewLoading || viewUser !== null) && (
        <Modal onClose={closeView}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="m-0 text-[19px] font-[650] tracking-[-0.025em]">User details</h3>
            <button onClick={closeView} aria-label="Close" className="border-0 bg-transparent text-mu hover:text-tx text-xl leading-none cursor-pointer">×</button>
          </div>
          {viewLoading ? (
            <Spinner />
          ) : viewError ? (
            <Notice kind="err">{viewError}</Notice>
          ) : viewUser && (
            <div className="flex flex-col gap-2.5 px-4 py-3.5 rounded-xl bg-sf2 text-[14px]">
              {[
                ["ID", viewUser.id, true],
                ["Username", viewUser.username],
                ["Email", viewUser.email],
                ["Role", roleOf(viewUser)],
                ["Joined", viewUser.createdAt ? fmtDateTime(viewUser.createdAt) : "—"],
                ["Balance", viewUser.balanceCents != null ? `${fmt(viewUser.balanceCents)} PZC` : "—", true],
              ].map(([label, value, mono]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-mu flex-none">{label}</span>
                  <span className={`text-right break-all ${mono ? "font-mono" : "font-[550]"}`}>{value ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button onClick={closeView} className={btnSecondary}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} maxWidth={400}>
          <h3 className="m-0 mb-2 text-[19px] font-[650] tracking-[-0.025em]">Delete user?</h3>
          <p className="m-0 mb-5 text-[14px] leading-[1.6] text-tx2">
            This will permanently delete <span className="text-tx font-semibold">{confirmDelete.username}</span>. This action cannot be undone.
          </p>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <button onClick={() => setConfirmDelete(null)} className={`${btnSecondary} !h-[46px]`}>Cancel</button>
            <button onClick={handleDeleteConfirm} className={`${btnDanger} !h-[46px]`}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
