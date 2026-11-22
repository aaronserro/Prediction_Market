import { useState, useEffect, useCallback } from "react";
import AdminNavbar from "./AdminNavbar.jsx";
import { Field, Modal, Notice, Page, PageHeader, Spinner, StatusPill, btnDanger, btnPrimary, btnSecondary, btnSmall, card, inputCls, tdCls, thCls } from "../../components/ui.jsx";
import { request } from "../../lib/api.js";
import { fmt, fmtDate, fmtDateTime } from "../../lib/format.js";

const roleOf = (u) => u?.role ?? (u?.roles?.includes("ROLE_ADMIN") || u?.roles?.includes("ADMIN") ? "ADMIN" : "USER");
const accountStatusOf = (u) => u?.accountEnabled === false ? "DEACTIVATED" : "ACTIVE";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");
const ROLES = [
  { value: "ROLE_USER", label: "User" },
  { value: "ROLE_ADMIN", label: "Administrator" },
];

const EMPTY_FORM = { username: "", email: "", password: "", confirmPassword: "", role: "ROLE_USER", mfaCode: "" };

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
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null); // user object awaiting confirmation
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

    const username = form.username.trim();
    const email = form.email.trim();
    const mfaCode = form.mfaCode.trim();

    if (!username || !email || !form.password) {
      setCreateError("Username, email, and password are required.");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      setCreateError("Username must be 3–30 characters and contain only letters, numbers, and underscores.");
      return;
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCreateError("Enter a valid email address no longer than 254 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }
    if (form.password.length < 10 || form.password.length > 72) {
      setCreateError("Password must be between 10 and 72 characters.");
      return;
    }
    if (form.role === "ROLE_ADMIN" && !/^\d{6}$/.test(mfaCode)) {
      setCreateError("A six-digit MFA code is required to create an administrator.");
      return;
    }

    setCreating(true);
    try {
      await request("/api/v1/users", {
        method: "POST",
        body: {
          username,
          email,
          password: form.password,
          roles: [form.role],
          ...(form.role === "ROLE_ADMIN" ? { mfaCode } : {}),
        },
      });
      setCreateSuccess(`User "${username}" created successfully.`);
      setForm(EMPTY_FORM);
      await fetchUsers();
    } catch (err) {
      setCreateError(err.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  // --- Deactivate user ---
  const handleDeactivateConfirm = async () => {
    if (!confirmDeactivate) return;
    const userId = confirmDeactivate.id;
    setDeactivatingId(userId);
    setConfirmDeactivate(null);
    try {
      await request(`/api/v1/users/${userId}`, {
        method: "DELETE",
      });
      await fetchUsers();
    } catch (err) {
      setUsersError(err.message || "Could not deactivate user.");
    } finally {
      setDeactivatingId(null);
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
      u.role?.toLowerCase().includes(q) ||
      u.roles?.some((role) => role.toLowerCase().includes(q)) ||
      accountStatusOf(u).toLowerCase().includes(q)
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
                <input id="cu-username" name="username" type="text" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" required value={form.username} onChange={handleChange} placeholder="e.g. john_doe" className={inputCls} />
              </Field>
              <Field label="Email" htmlFor="cu-email">
                <input id="cu-email" name="email" type="email" maxLength={254} required value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" className={inputCls} />
              </Field>
              <Field label="Password" htmlFor="cu-password">
                <input id="cu-password" name="password" type="password" minLength={10} maxLength={72} required value={form.password} onChange={handleChange} placeholder="10–72 characters" className={inputCls} />
              </Field>
              <Field label="Confirm password" htmlFor="cu-confirm">
                <input id="cu-confirm" name="confirmPassword" type="password" minLength={10} maxLength={72} required value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" className={inputCls} />
              </Field>
            </div>
            <div className="sm:max-w-[calc(50%-8px)]">
              <Field label="Role" htmlFor="cu-role">
                <select id="cu-role" name="role" value={form.role} onChange={handleChange} className={`${inputCls} cursor-pointer`}>
                  {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </Field>
            </div>
            {form.role === "ROLE_ADMIN" && (
              <div className="sm:max-w-[calc(50%-8px)]">
                <Field label="Administrator MFA code" htmlFor="cu-mfa" hint="Enter your current six-digit TOTP to authorize administrator creation.">
                  <input
                    id="cu-mfa"
                    name="mfaCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={form.mfaCode}
                    onChange={handleChange}
                    placeholder="6-digit code"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

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
                    <th className={thCls}>Status</th>
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
                      <td className={tdCls}><StatusPill status={accountStatusOf(u)} /></td>
                      <td className={`${tdCls} text-mu hidden md:table-cell`}>{u.createdAt ? fmtDate(u.createdAt) : "—"}</td>
                      <td className={`${tdCls} text-right`}>
                        <div className="inline-flex gap-2">
                          <button onClick={() => handleView(u.id)} className={`${btnSecondary} ${btnSmall}`}>View</button>
                          <button
                            onClick={() => setConfirmDeactivate(u)}
                            disabled={deactivatingId === u.id || u.accountEnabled === false}
                            className="h-8 px-3 rounded-lg border-0 bg-nos text-no text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {deactivatingId === u.id ? "Deactivating…" : u.accountEnabled === false ? "Deactivated" : "Deactivate"}
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
                ["Account status", accountStatusOf(viewUser)],
                ["Deactivated", viewUser.deactivatedAt ? fmtDateTime(viewUser.deactivatedAt) : "—"],
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

      {/* ── Deactivation confirmation modal ── */}
      {confirmDeactivate && (
        <Modal onClose={() => setConfirmDeactivate(null)} maxWidth={400}>
          <h3 className="m-0 mb-2 text-[19px] font-[650] tracking-[-0.025em]">Deactivate user?</h3>
          <p className="m-0 mb-5 text-[14px] leading-[1.6] text-tx2">
            This will revoke access for <span className="text-tx font-semibold">{confirmDeactivate.username}</span> and anonymize their identity. Financial history will be retained.
          </p>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <button onClick={() => setConfirmDeactivate(null)} className={`${btnSecondary} !h-[46px]`}>Cancel</button>
            <button onClick={handleDeactivateConfirm} className={`${btnDanger} !h-[46px]`}>Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
