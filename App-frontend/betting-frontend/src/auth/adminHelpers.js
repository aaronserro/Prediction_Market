// src/admin/adminHelpers.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function http(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`.replace(/\n/g, ""), {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include",
    ...opts,
  });

  if (res.status === 401 || res.status === 403) {
    const err = new Error("unauthorized");
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} — ${text}`);
  }

  if (res.status === 204) return null;

  return res.json();
}
export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include", // send the JWT cookie
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json(); // { username, roles }
}
// Generic by-status fetch
export async function fetchFundRequestsByStatus(status) {
  return http(`/api/v1/admin/fund-requests?status=${encodeURIComponent(status)}`);
}

export async function approveFundRequest(id) {
  return http(`/api/v1/admin/fund-requests/${id}/approve`, {
    method: "PUT",
  });
}

export async function rejectFundRequest(id) {
  return http(`/api/v1/admin/fund-requests/${id}/reject`, {
    method: "PUT",
  });
}
