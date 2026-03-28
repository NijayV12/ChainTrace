import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AssistantPanel from "../components/AssistantPanel";

interface Stats {
  users: number;
  accounts: number;
  alerts: number;
  byClassification: {
    genuine: number;
    suspicious: number;
    highRisk: number;
  };
}

interface CaseSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  accounts?: {
    account: {
      id: string;
      platform: string;
      handle: string;
      fakeClassification?: string | null;
      user?: { name: string; email: string; phone?: string | null; role: string };
    };
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, a, act, cs] = await Promise.all([
          api.admin.stats(),
          api.admin.alerts(),
          api.admin.activity(),
          api.cases.list(),
        ]);
        if (!active) return;
        setStats(s as unknown as Stats);
        setAlerts(a as unknown as any[]);
        setActivity(act as unknown as any[]);
        setCases(cs as unknown as CaseSummary[]);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load admin data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalAccounts = stats?.accounts ?? 0;
  const genuine = stats?.byClassification.genuine ?? 0;
  const suspicious = stats?.byClassification.suspicious ?? 0;
  const highRisk = stats?.byClassification.highRisk ?? 0;

  const pct = (value: number) =>
    totalAccounts === 0 ? 0 : Math.round((value / totalAccounts) * 100);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/15 text-base">
            📈
          </span>
          {user?.role === "SUPER_ADMIN"
            ? "Super Admin Console"
            : "Risk & Analytics Console"}
        </h1>
        <p className="text-sm text-slate-400">
          Central view for risk levels, alerts, and platform activity. This
          area is restricted to{" "}
          {user?.role === "SUPER_ADMIN"
            ? "Super Admins (user and access management) and senior investigators."
            : "analysts and supervising investigators for monitoring only."}
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Users
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="skeleton block h-7 w-12" /> : stats?.users ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Accounts
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {loading ? (
              <span className="skeleton block h-7 w-12" />
            ) : (
              totalAccounts
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Open Alerts
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">
            {loading ? (
              <span className="skeleton block h-7 w-12" />
            ) : (
              stats?.alerts ?? 0
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Risk Distribution
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-300">Genuine</span>
              <span className="text-slate-400">{pct(genuine)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-emerald-400"
                style={{ width: `${pct(genuine)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-300">Suspicious</span>
              <span className="text-slate-400">{pct(suspicious)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-amber-400"
                style={{ width: `${pct(suspicious)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-rose-300">High risk</span>
              <span className="text-slate-400">{pct(highRisk)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-rose-400"
                style={{ width: `${pct(highRisk)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-300">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            How to use this view
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              Start with <span className="font-semibold">risk distribution</span> to
              understand overall fake-profile pressure on the system.
            </li>
            <li>
              Drill into <span className="font-semibold">suspicious &amp; high-risk
              accounts</span> to prioritise manual investigation.
            </li>
            <li>
              Use the <span className="font-semibold">activity timeline</span> to
              correlate logins, devices, and IPs with spikes in alerts.
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-300">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Role-specific focus
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              <span className="font-semibold">Super Admin</span>: monitor user
              volume and alert spikes; adjust access policies and escalation
              paths offline.
            </li>
            <li>
              <span className="font-semibold">Analyst</span>: track trends over
              time, spot clusters of related alerts, and feed findings back into
              investigation playbooks.
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-300">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Investigation workload
          </p>
          <p className="mt-2">
            Use the counts of alerts and high-risk classifications as a proxy
            for active workload. When open alerts grow faster than they can be
            handled, consider rebalancing cases or tightening intake criteria.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-[11px]">
                ⚠️
              </span>
              Suspicious & High-Risk Accounts
            </h2>
          </div>
          <div className="max-h-80 overflow-auto text-xs">
            {loading ? (
              <div className="space-y-2 p-4">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ) : alerts.length === 0 ? (
              <p className="p-4 text-slate-500">
                No alerts currently raised.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {alerts.map((alert) => (
                  <li key={alert.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          {alert.account?.platform} · @{alert.account?.handle}
                        </p>
                        <p className="text-xs text-slate-200">
                          {alert.reason}
                        </p>
                      </div>
                      <span
                        className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] ${
                          alert.riskLevel === "HIGH_RISK"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {alert.riskLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {new Date(alert.createdAt).toLocaleString()} ·{" "}
                      {alert.account?.user?.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-[11px]">
                🕒
              </span>
              Activity Timeline
            </h2>
          </div>
          <div className="max-h-80 overflow-auto p-4 text-xs">
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-4/6" />
              </div>
            ) : activity.length === 0 ? (
              <p className="text-slate-500">No recent login activity.</p>
            ) : (
              <ol className="relative border-l border-slate-700/70">
                {activity.map((log) => (
                  <li key={log.id} className="mb-4 ml-4">
                    <div className="absolute -left-1.5 mt-1 h-2 w-2 rounded-full bg-teal-400" />
                    <time className="text-[10px] text-slate-500">
                      {new Date(log.loginTime).toLocaleString()}
                    </time>
                    <p className="mt-0.5 text-xs text-slate-200">
                      {log.user?.email} logged in
                    </p>
                    <p className="text-[10px] text-slate-500">
                      IP: {log.ipAddress ?? "n/a"} · Device:{" "}
                      {log.device ?? "n/a"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {(user?.role === "ANALYST" || user?.role === "SUPER_ADMIN") && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-200">
            Recent suspected accounts by investigator
          </h2>
          <p className="text-xs text-slate-400">
            Cards show high-risk or suspicious accounts grouped by case, with the
            investigator responsible for the checks.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cases
              .flatMap((c) =>
                (c.accounts ?? [])
                  .filter(
                    (a) =>
                      a.account.fakeClassification === "SUSPICIOUS" ||
                      a.account.fakeClassification === "HIGH_RISK" ||
                      a.account.fakeClassification === "FAKE"
                  )
                  .map((a) => ({ caseTitle: c.title, ...a }))
              )
              .slice(0, 9)
              .map(({ caseTitle, account }) => (
                <div
                  key={account.id}
                  className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-3 text-xs"
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {account.platform} · @{account.handle}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-100">
                    {account.fakeClassification ?? "PENDING"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Case: <span className="text-slate-200">{caseTitle}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Investigator:{" "}
                    {account.user ? (
                      <span className="text-slate-200">
                        {account.user.name}{" "}
                        <span className="text-slate-500">
                          ({account.user.email}
                          {account.user.phone ? ` · ${account.user.phone}` : ""})
                        </span>
                      </span>
                    ) : (
                      "n/a"
                    )}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      <AssistantPanel />
    </div>
  );
}

