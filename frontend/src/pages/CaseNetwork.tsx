import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { CaseIntelligence } from "../types/api";

type CaseRecord = {
  id: string;
  title: string;
  status: string;
  accounts: Array<{
    account: {
      id: string;
      platform: string;
      handle: string;
      fakeClassification?: string | null;
      mlFraudProbability?: number | null;
      anomalyScore?: number | null;
      fusedTrustScore?: number | null;
      fusedClassification?: string | null;
    };
  }>;
};

function riskTone(classification?: string | null): string {
  if (classification === "HIGH_RISK" || classification === "FAKE") {
    return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  }
  if (classification === "SUSPICIOUS") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }
  if (classification === "GENUINE") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  return "border-slate-700 bg-slate-900/50 text-slate-300";
}

export default function CaseNetwork() {
  const { id } = useParams<{ id: string }>();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [intelligence, setIntelligence] = useState<CaseIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [caseData, intelligenceData] = await Promise.all([
          api.cases.get(id),
          api.cases.intelligence(id),
        ]);
        if (!active) return;
        setCaseRecord(caseData as unknown as CaseRecord);
        setIntelligence(intelligenceData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load network evidence");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const nodeCards = useMemo(() => {
    const accounts = caseRecord?.accounts ?? [];
    return accounts.map(({ account }) => ({
      ...account,
      linkedCount:
        intelligence?.relationships.filter(
          (relationship) => relationship.fromAccountId === account.id
        ).length ?? 0,
    }));
  }, [caseRecord, intelligence]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-1/3 rounded-xl" />
        <div className="skeleton h-40 w-full rounded-[2rem]" />
        <div className="skeleton h-80 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (error || !caseRecord || !intelligence) {
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-100">
        {error ?? "Network evidence unavailable"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-5 rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_60px_rgba(8,15,26,0.45)] lg:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Network Evidence</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{caseRecord.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Review relationship density, linked profiles, anomaly hotspots, and ML risk concentration for this case.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1">
              Status: {caseRecord.status}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1">
              Accounts: {intelligence.summary.accountCount}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1">
              Relationships: {intelligence.summary.linkedRelationshipCount}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Cluster readout</p>
            <p className="mt-3 text-sm text-slate-300">
              Platforms in scope: <span className="text-white">{intelligence.summary.platforms.join(", ") || "None"}</span>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Recent alerts: <span className="text-amber-200">{intelligence.summary.alertCount}</span>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Evidence digest: <span className="break-all text-slate-400">{intelligence.evidenceDigest}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/cases/${caseRecord.id}`}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Back to case
            </Link>
            <Link
              to="/cases"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Case list
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">High-risk node</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {intelligence.summary.highestRiskAccount
              ? `${intelligence.summary.highestRiskAccount.platform} @${intelligence.summary.highestRiskAccount.handle}`
              : "None"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">ML hotspot</p>
          <p className="mt-3 text-3xl font-semibold text-sky-300">
            {intelligence.summary.highestRiskAccount?.mlFraudProbability != null
              ? `${(intelligence.summary.highestRiskAccount.mlFraudProbability * 100).toFixed(1)}%`
              : "--"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Anomaly hotspot</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">
            {intelligence.summary.highestRiskAccount?.anomalyScore != null
              ? `${(intelligence.summary.highestRiskAccount.anomalyScore * 100).toFixed(1)}%`
              : "--"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Fused decision</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {intelligence.summary.highestRiskAccount?.fusedClassification ?? "Pending"}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Cluster Nodes</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Accounts in this investigation cluster</h2>
          </div>
          <p className="max-w-md text-right text-xs text-slate-400">
            Each card shows the account’s fused decision, ML fraud probability, anomaly score, and local relationship count.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodeCards.map((node) => (
            <article
              key={node.id}
              className={`rounded-[1.5rem] border p-5 ${riskTone(node.fusedClassification ?? node.fakeClassification)}`}
            >
              <p className="text-lg font-medium text-white">
                {node.platform} @{node.handle}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                {node.fusedClassification ?? node.fakeClassification ?? "PENDING"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">ML risk</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100">
                    {node.mlFraudProbability != null ? `${(node.mlFraudProbability * 100).toFixed(1)}%` : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Anomaly</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100">
                    {node.anomalyScore != null ? `${(node.anomalyScore * 100).toFixed(1)}%` : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Fused trust</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100">
                    {node.fusedTrustScore != null ? node.fusedTrustScore.toFixed(2) : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Linked profiles</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100">{node.linkedCount}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Relationship Edges</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Linked profile evidence</h2>
          <div className="mt-5 space-y-3">
            {intelligence.relationships.length ? (
              intelligence.relationships.map((relationship, index) => (
                <article
                  key={`${relationship.fromAccountId}-${relationship.toAccountId}-${index}`}
                  className="rounded-[1.25rem] border border-slate-800 bg-slate-900/35 p-4"
                >
                  <p className="text-sm text-slate-100">
                    Account `{relationship.fromAccountId.slice(0, 8)}` linked to {relationship.platform} @{relationship.handle}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                    Relation type: {relationship.relation.replace(/_/g, " ")}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No linked-profile edges were detected for this case.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Alert Cluster</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Recent risk signals</h2>
          <div className="mt-5 space-y-3">
            {intelligence.recentAlerts.length ? (
              intelligence.recentAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-[1.25rem] border border-slate-800 bg-slate-900/35 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-wide text-amber-200">{alert.riskLevel}</p>
                    <p className="text-[11px] text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{alert.reason}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent alerts for this case.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
