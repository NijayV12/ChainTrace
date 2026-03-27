import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface CaseItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string } | null;
  accounts?: { account: { platform: string; handle: string; fakeClassification?: string | null } }[];
}

export default function CasesList() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.cases.list();
        if (!active) return;
        setItems(data as CaseItem[]);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cases</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user?.role === "ANALYST" || user?.role === "SUPER_ADMIN"
              ? "Review and track investigation cases across the platform."
              : "Your investigation cases and their current status."}
          </p>
        </div>
        {user?.role === "INVESTIGATOR" || user?.role === "SUPER_ADMIN" ? (
          <Link
            to="/cases/new"
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-teal-400"
          >
            + New Case
          </Link>
        ) : null}
      </header>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-10 w-full rounded" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-100">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No cases yet.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-slate-700/60 bg-slate-900/80">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-700/60 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Assigned</th>
                <th className="px-4 py-2 text-left">Accounts</th>
                <th className="px-4 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const highest =
                  c.accounts && c.accounts.length
                    ? c.accounts.some((a) => a.account.fakeClassification === "FAKE")
                      ? "FAKE"
                      : c.accounts.some((a) => a.account.fakeClassification === "SUSPICIOUS")
                      ? "SUSPICIOUS"
                      : "GENUINE"
                    : "N/A";
                return (
                  <tr key={c.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-2">
                      <Link
                        to={`/cases/${c.id}`}
                        className="font-medium text-teal-300 hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {c.createdBy?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {c.assignedTo?.name ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {c.accounts?.length ?? 0} ·{" "}
                      <span className="text-[11px] text-slate-400">highest: {highest}</span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {new Date(c.updatedAt || c.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

