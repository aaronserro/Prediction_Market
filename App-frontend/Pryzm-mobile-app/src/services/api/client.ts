import { API_BASE_URL } from "../../constants/config";
import { getToken } from "../storage/authStorage";

export async function request(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");

  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message:
        typeof data === "object" && data?.message
          ? data.message
          : "API request failed",
      data,
    };
  }

  return data;
}

export const apiClient = {
  get: (endpoint: string) => {
    return request(endpoint, {
      method: "GET",
    });
  },

  post: (endpoint: string, body?: any) => {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put: (endpoint: string, body?: any) => {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint: string) => {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};