import type {
  AccountSummary,
  AdminActionLogEntry,
  AdminRole,
  AdminUserSummary,
  CaseListItem,
  ResultAccount,
} from "../types/api";

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
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Network request failed. Check that the API is deployed, the frontend API URL is correct, and CORS is configured for this site."
      );
    }
    throw error;
  }
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
    list: () => request<CaseListItem[]>("/cases"),
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
    getAccounts: () => request<AccountSummary[]>("/users/accounts"),
    verify: (body: Record<string, unknown>) =>
      request<Record<string, unknown>>("/users/verify", { method: "POST", body: JSON.stringify(body) }),
    getResult: (id: string) => request<ResultAccount>(`/users/accounts/${id}/result`),
  },
  blockchain: {
    explorer: () => request<{ length: number; blocks: unknown[]; valid: boolean }>("/blockchain/explorer"),
    blockByHash: (hash: string) => request<unknown>(`/blockchain/blocks/${hash}`),
  },
  assistant: {
    history: (params?: { caseId?: string }) => {
      const q = new URLSearchParams();
      if (params?.caseId) q.set("caseId", params.caseId);
      const query = q.toString();
      return request<{
        conversationId: string;
        contextLabel: string;
        scope: "GLOBAL" | "CASE";
        caseId: string | null;
        messages: Array<{
          id: string;
          role: string;
          content: string;
          meta: string | null;
          createdAt: string;
        }>;
      }>(`/assistant/history${query ? `?${query}` : ""}`);
    },
    chat: (body: { message: string; caseId?: string }) =>
      request<{ reply: string; summary: string; contextLabel: string; conversationId: string }>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  admin: {
    stats: () => request<Record<string, unknown>>("/admin/stats"),
    users: () => request<AdminUserSummary[]>("/admin/users"),
    auditLogs: () => request<AdminActionLogEntry[]>("/admin/audit-logs"),
    createUser: (body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role: AdminRole;
    }) =>
      request<{ user: AdminUserSummary; token: string }>("/admin/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    changeUserRole: (id: string, body: { role: AdminRole }) =>
      request<AdminUserSummary>(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    setUserStatus: (id: string, body: { isActive: boolean }) =>
      request<AdminUserSummary>(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    resetUserPassword: (id: string, body: { password: string }) =>
      request<AdminUserSummary>(`/admin/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
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
