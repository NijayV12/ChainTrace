import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { AdminActionLogEntry, AdminRole, AdminUserSummary } from "../types/api";

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string; description: string }> = [
  {
    value: "INVESTIGATOR",
    label: "Investigator",
    description: "Handles intake, reviews evidence, and drafts investigation reports.",
  },
  {
    value: "ANALYST",
    label: "Analyst",
    description: "Assesses risk patterns, escalations, and analyst decisions on cases.",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Owns access control, account lifecycle, and platform governance.",
  },
];

function formatRole(role: AdminRole) {
  return role.replace("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function parseAuditMetadata(value?: string | null) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, entry]) => `${key}: ${String(entry)}`)
      .join(" | ");
  } catch {
    return value;
  }
}

export default function AdminUserCreate() {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("INVESTIGATOR");
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRole>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [auditFilter, setAuditFilter] = useState("");

  const userCount = users.length;
  const activeCount = users.filter((entry) => entry.isActive).length;
  const inactiveCount = userCount - activeCount;
  const superAdminCount = users.filter((entry) => entry.role === "SUPER_ADMIN").length;

  const sortedUsers = useMemo(
    () =>
      [...users].sort((left, right) => {
        if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedUsers.filter((entry) => {
      const matchesQuery =
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        (entry.phone ?? "").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && entry.isActive) ||
        (statusFilter === "INACTIVE" && !entry.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [search, sortedUsers, statusFilter]);

  const filteredAuditLogs = useMemo(() => {
    const query = auditFilter.trim().toLowerCase();
    if (!query) return auditLogs;
    return auditLogs.filter((entry) =>
      [
        entry.action,
        entry.actor.name,
        entry.actor.email,
        entry.targetUser.name,
        entry.targetUser.email,
        parseAuditMetadata(entry.metadata),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [auditFilter, auditLogs]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [nextUsers, nextLogs] = await Promise.all([api.admin.users(), api.admin.auditLogs()]);
      setUsers(nextUsers);
      setAuditLogs(nextLogs);
      setRoleDrafts(
        Object.fromEntries(nextUsers.map((entry) => [entry.id, entry.role]))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await api.admin.createUser({
        name,
        email,
        phone: phone || undefined,
        password,
        role,
      });
      toast.success("Account created successfully");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("INVESTIGATOR");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (target: AdminUserSummary) => {
    const nextRole = roleDrafts[target.id] ?? target.role;
    if (nextRole === target.role) {
      toast("Choose a different role before saving.");
      return;
    }

    setBusyUserId(target.id);
    try {
      const updated = await api.admin.changeUserRole(target.id, { role: nextRole });
      setUsers((current) => current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry)));
      toast.success(`Role updated for ${target.name}`);
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleStatusToggle = async (target: AdminUserSummary) => {
    setBusyUserId(target.id);
    try {
      const updated = await api.admin.setUserStatus(target.id, { isActive: !target.isActive });
      setUsers((current) => current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry)));
      toast.success(target.isActive ? "Account deactivated" : "Account reactivated");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account status");
    } finally {
      setBusyUserId(null);
    }
  };

  const handlePasswordReset = async (target: AdminUserSummary) => {
    const nextPassword = (passwordDrafts[target.id] ?? "").trim();
    if (nextPassword.length < 8) {
      toast.error("Temporary password must be at least 8 characters.");
      return;
    }

    setBusyUserId(target.id);
    try {
      await api.admin.resetUserPassword(target.id, { password: nextPassword });
      setPasswordDrafts((current) => ({ ...current, [target.id]: "" }));
      toast.success(`Password reset for ${target.name}`);
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="grid gap-5 rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_60px_rgba(8,15,26,0.45)] lg:grid-cols-[1.15fr,0.85fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Super admin lifecycle console</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Manage internal identities, access state, and administrative actions from one secure desk.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Provision new users, rotate credentials, adjust roles, and review the latest audit trail
            without leaving the operations workspace.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Directory</p>
            <p className="mt-3 text-3xl font-semibold text-white">{userCount}</p>
            <p className="mt-1 text-xs text-slate-400">Tracked users across investigator, analyst, and admin roles.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Access state</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">{activeCount}</p>
            <p className="mt-1 text-xs text-slate-400">{inactiveCount} inactive accounts awaiting review or reactivation.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5 sm:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Governance note</p>
            <p className="mt-3 text-sm text-slate-300">
              Keep `SUPER_ADMIN` accounts tightly limited. There are currently{" "}
              <span className="font-semibold text-white">{superAdminCount}</span> super admin accounts in the system.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Provision account</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Create internal user</h2>
            </div>
            <div className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[11px] uppercase tracking-wide text-teal-200">
              Admin controlled
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-400">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                placeholder="Aarav Sharma"
                required
              />
            </label>
            <label className="block text-sm text-slate-400">
              Work email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                placeholder="aarav@agency.gov"
                required
              />
            </label>
            <label className="block text-sm text-slate-400">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                placeholder="+91 98XXXXXXX"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Temporary password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </label>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-400">Role assignment</p>
            <div className="mt-3 grid gap-3">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`block rounded-2xl border px-4 py-4 transition ${
                    role === option.value
                      ? "border-teal-400/40 bg-teal-400/10"
                      : "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="role"
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{option.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60"
          >
            {creating ? "Creating account..." : "Create internal account"}
          </button>
        </form>

        <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Audit feed</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Recent admin actions</h2>
            </div>
            <button
              type="button"
              onClick={() => void loadAdminData()}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900"
            >
              Refresh
            </button>
          </div>

          <input
            value={auditFilter}
            onChange={(event) => setAuditFilter(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
            placeholder="Filter by action, actor, or target"
          />

          <div className="mt-5 space-y-3">
            {loading ? (
              <>
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/35 p-5 text-sm text-slate-400">
                No matching admin activity found.
              </div>
            ) : (
              filteredAuditLogs.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{entry.action.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {entry.actor.name} ({formatRole(entry.actor.role)}) {"->"} {entry.targetUser.name}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {entry.actor.email} | {entry.targetUser.email}
                  </p>
                  {parseAuditMetadata(entry.metadata) ? (
                    <p className="mt-2 text-xs text-teal-200">{parseAuditMetadata(entry.metadata)}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Account lifecycle</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Provisioned users</h2>
            <p className="mt-2 text-sm text-slate-400">
              Update role ownership, suspend access, or issue a new temporary password. Your own
              super admin account remains protected from self-lockout actions.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[240px,160px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
              placeholder="Search name, email, or phone"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <>
              <div className="skeleton h-28 w-full" />
              <div className="skeleton h-28 w-full" />
              <div className="skeleton h-28 w-full" />
            </>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/35 p-5 text-sm text-slate-400">
              No users match the current search or status filter.
            </div>
          ) : (
            filteredUsers.map((entry) => {
              const isCurrentUser = currentUser?.id === entry.id;
              const isBusy = busyUserId === entry.id;

              return (
                <article
                  key={entry.id}
                  className="rounded-[1.75rem] border border-slate-800 bg-slate-900/40 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">{entry.name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide ${
                            entry.isActive
                              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                              : "border border-rose-400/30 bg-rose-400/10 text-rose-200"
                          }`}
                        >
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                        {isCurrentUser ? (
                          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-sky-200">
                            Current session
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-300">{entry.email}</p>
                      <p className="text-xs text-slate-500">
                        {entry.phone || "No phone provided"} | Created {formatDate(entry.createdAt)} | Last updated{" "}
                        {formatDate(entry.updatedAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Last login: {formatDate(entry.lastLogin?.loginTime)} | IP {entry.lastLogin?.ipAddress ?? "n/a"} |
                        Device {entry.lastLogin?.device ?? "n/a"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[180px,auto] xl:min-w-[420px]">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Role</label>
                        <select
                          value={roleDrafts[entry.id] ?? entry.role}
                          onChange={(event) =>
                            setRoleDrafts((current) => ({
                              ...current,
                              [entry.id]: event.target.value as AdminRole,
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
                          disabled={isBusy}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleRoleChange(entry)}
                          disabled={isBusy || (roleDrafts[entry.id] ?? entry.role) === entry.role}
                          className="mt-3 w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                        >
                          Save role
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                          <label className="text-xs uppercase tracking-wide text-slate-500">
                            Temporary password
                            <input
                              type="password"
                              value={passwordDrafts[entry.id] ?? ""}
                              onChange={(event) =>
                                setPasswordDrafts((current) => ({
                                  ...current,
                                  [entry.id]: event.target.value,
                                }))
                              }
                              placeholder="Set a new 8+ character password"
                              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-teal-400 focus:outline-none"
                              disabled={isBusy}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void handlePasswordReset(entry)}
                            disabled={isBusy}
                            className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-400/15 disabled:opacity-50 md:self-end"
                          >
                            Reset password
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleStatusToggle(entry)}
                          disabled={isBusy || isCurrentUser}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50 ${
                            entry.isActive
                              ? "border border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
                              : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
                          }`}
                        >
                          {entry.isActive ? "Deactivate account" : "Reactivate account"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
