import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { TrustScoreChart } from "../components/TrustScoreChart";

interface Account {
  id: string;
  platform: string;
  handle: string;
  verificationStatus: string;
  trustScore: number | null;
  fakeTrustScore?: number | null;
  createdAt: string;
}

export default function UserDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.users.getAccounts();
        if (!active) return;
        setAccounts(
          (data as unknown as Account[]).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const latest = accounts[0];

  const classificationLabel = (score: number | null) => {
    if (score == null) return "PENDING";
    if (score > 75) return "GENUINE";
    if (score >= 50) return "SUSPICIOUS";
    return "HIGH RISK";
  };

  const classificationColor = (score: number | null) => {
    if (score == null) return "bg-slate-700 text-slate-200";
    if (score > 75) return "bg-emerald-500/20 text-emerald-300";
    if (score >= 50) return "bg-amber-500/20 text-amber-300";
    return "bg-rose-500/20 text-rose-300";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/15 text-base">
              📊
            </span>
            Identity Trust Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Submit social accounts, track verification status, and review your
            blockchain-backed trust scores.
          </p>
        </div>
        <Link
          to="/verify"
          className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-slate-900 shadow hover:bg-teal-400"
        >
          + New Verification
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total Accounts
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="skeleton block h-7 w-12" /> : accounts.length}
          </p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Latest Classification
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-32 skeleton" />
          ) : latest ? (
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${classificationColor(
                latest.trustScore
              )}`}
            >
              {classificationLabel(latest.trustScore)}
            </span>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No accounts yet</p>
          )}
        </motion.div>
        <motion.div
          className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            On-Chain Protection
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Verified identities are hashed and anchored to a lightweight
            blockchain for tamper-evident audit trails.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1.3fr]">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-200">
            Verified Social Accounts
          </h2>
          <span className="text-xs text-slate-500">
            {accounts.length} account{accounts.length === 1 ? "" : "s"}
          </span>
        </div>
        {error && (
          <div className="border-b border-rose-500/40 bg-rose-950/40 px-4 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}
          <div className="max-h-[420px] overflow-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-1 px-2">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Account</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Trust Score</th>
                <th className="px-4 py-2 text-left font-medium">Created</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-24" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No accounts yet.{" "}
                    <Link
                      to="/verify"
                      className="text-teal-400 underline-offset-2 hover:underline"
                    >
                      Submit your first verification.
                    </Link>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">
                        {acc.platform}
                      </div>
                      <div className="text-xs text-slate-400">@{acc.handle}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${classificationColor(
                          acc.trustScore
                        )}`}
                      >
                        {classificationLabel(acc.trustScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-slate-200">
                      {acc.trustScore != null ? (
                        <span>{acc.trustScore.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(acc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/accounts/${acc.id}/result`}
                        className="text-xs text-teal-400 hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
        <div className="h-full">
          <TrustScoreChart
            points={accounts.map((a) => ({
              createdAt: a.createdAt,
              trustScore: a.fakeTrustScore ?? a.trustScore,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

