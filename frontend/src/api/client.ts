const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const API = API_BASE ? `${API_BASE}/api/v1` : "/api/v1";

function getToken(): string | null {
  return localStorage.getItem("chaintrace_token");
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ user: unknown; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  },
  cases: {
    list: () => request<unknown[]>("/cases"),
    get: (id: string) => request<Record<string, unknown>>(`/cases/${id}`),
    create: (body: {
      title: string;
      description?: string;
      assignedToId?: string;
      accountIds?: string[];
    }) =>
      request<Record<string, unknown>>("/cases", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateStatus: (id: string, body: { status: string; assignedToId?: string }) =>
      request<Record<string, unknown>>(`/cases/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    addReport: (id: string, body: { summary: string; recommendation: string }) =>
      request<Record<string, unknown>>(`/cases/${id}/reports`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    addDecision: (id: string, body: { riskRating: string; decision: string; rationale: string }) =>
      request<Record<string, unknown>>(`/cases/${id}/decisions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    addNote: (id: string, body: { body: string }) =>
      request<Record<string, unknown>>(`/cases/${id}/notes`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    draftReport: (id: string) =>
      request<{ summary: string; recommendation: string }>(
        `/cases/${id}/investigator-report/draft`,
        { method: "POST" }
      ),
    draftDecision: (id: string) =>
      request<{ riskRating: string; decision: string; rationale: string }>(
        `/cases/${id}/analyst-decision/draft`,
        { method: "POST" }
      ),
    export: (id: string) =>
      request<Record<string, unknown>>(`/cases/${id}/export`),
  },
  users: {
    getAccounts: () => request<Array<Record<string, unknown>>>("/users/accounts"),
    verify: (body: Record<string, unknown>) =>
      request<Record<string, unknown>>("/users/verify", { method: "POST", body: JSON.stringify(body) }),
    getResult: (id: string) => request<Record<string, unknown>>(`/users/accounts/${id}/result`),
  },
  blockchain: {
    explorer: () => request<{ length: number; blocks: unknown[]; valid: boolean }>("/blockchain/explorer"),
    blockByHash: (hash: string) => request<unknown>(`/blockchain/blocks/${hash}`),
  },
  admin: {
    stats: () => request<Record<string, unknown>>("/admin/stats"),
    accounts: (params?: { risk?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.risk) q.set("risk", params.risk);
      if (params?.limit) q.set("limit", String(params.limit));
      return request<unknown[]>(`/admin/accounts?${q}`);
    },
    alerts: () => request<unknown[]>("/admin/alerts"),
    activity: () => request<unknown[]>("/admin/activity"),
    account: (id: string) => request<Record<string, unknown>>(`/admin/accounts/${id}`),
  },
};
