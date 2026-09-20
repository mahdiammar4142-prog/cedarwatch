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
  return response.json();
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
};
