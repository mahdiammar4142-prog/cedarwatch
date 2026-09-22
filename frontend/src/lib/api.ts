const API_BASE = import.meta.env.VITE_API_URL ?? "";

let getAccessToken: () => Promise<string | null> = async () => null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAccessToken = getter;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg?: string }) => item.msg).join(", ")
          : body.error || "Request failed";
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  getIncidents: (status = "ACTIVE") =>
    request(`/api/incidents?status=${status}`),
  getStats: () => request("/api/stats"),
  createReport: (payload: unknown) =>
    request("/api/reports", { method: "POST", body: JSON.stringify(payload) }),
  confirmIncident: (id: number) =>
    request(`/api/incidents/${id}/confirm`, { method: "POST" }),
  resolveIncident: (id: number) =>
    request(`/api/incidents/${id}/resolve`, { method: "POST" }),
  getHistory: () => request("/api/history"),
  getMe: () => request("/api/me"),
  updateMe: (payload: { displayName?: string; area?: string; bio?: string }) =>
    request("/api/me", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadAvatar: async (file: File) => {
    const token = await getAccessToken();
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${API_BASE}/api/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const detail = payload.detail;
      throw new Error(
        typeof detail === "string" ? detail : "Could not upload photo"
      );
    }
    return response.json();
  },
  adminOverview: () => request("/api/admin/overview"),
  adminUsers: () => request("/api/admin/users"),
  adminUpdateUser: (id: string, payload: unknown) =>
    request(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminDeleteUser: (id: string) =>
    request(`/api/admin/users/${id}`, { method: "DELETE" }),
  adminReports: () => request("/api/admin/reports"),
  adminUpdateReport: (id: number, payload: unknown) =>
    request(`/api/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminDeleteReport: (id: number) =>
    request(`/api/admin/reports/${id}`, { method: "DELETE" }),
  adminIncidents: () => request("/api/admin/incidents"),
  adminUpdateIncident: (id: number, payload: unknown) =>
    request(`/api/admin/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminDeleteIncident: (id: number) =>
    request(`/api/admin/incidents/${id}`, { method: "DELETE" }),
};
