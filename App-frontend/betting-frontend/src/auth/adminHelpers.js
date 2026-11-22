// src/admin/adminHelpers.js
import { request } from "../lib/api.js";

async function http(path, opts = {}) {
  return request(path.replace(/\n/g, ""), opts);
}
export async function fetchMe() {
  return request("/auth/me");
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
