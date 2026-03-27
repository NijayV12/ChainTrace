import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

interface SimilarAccountDetected {
  id: string;
  platform: string;
  handle: string;
  matchType: string;
  reason: string;
}

interface ResultAccount {
  id: string;
  platform: string;
  handle: string;
  verificationStatus: string;
  trustScore: number | null;
  blockchainHash: string | null;
  classification: string;
  fakeTrustScore?: number | null;
  fakeClassification?: string;
  onChain: boolean;
  llmReason?: string | null;
  llmFraudLikelihood?: string | null;
  llmAdminRecommendation?: string | null;
  similarAccountsDetected?: SimilarAccountDetected[] | null;
  duplicateIdentityScore?: number | null;
}

export default function ScoreResult() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResultAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res = await api.users.getResult(id);
        if (!active) return;
        setData(res as unknown as ResultAccount);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load result");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const classificationColor = (cls: string) => {
    if (cls === "GENUINE") return "bg-emerald-500/20 text-emerald-300";
    if (cls === "LOW_RISK") return "bg-sky-500/20 text-sky-300";
    if (cls === "SUSPICIOUS") return "bg-amber-500/20 text-amber-300";
    if (cls === "FAKE") return "bg-rose-500/20 text-rose-300";
    return "bg-slate-700 text-slate-200";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Trust Score Result
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Deterministic AI scoring based on your supplied account metrics.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          Back to dashboard
        </Link>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-32 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-sm text-slate-400">
          Result not found.
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Account
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {data.platform} · @{data.handle}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classificationColor(
                      data.fakeClassification ?? data.classification
                    )}`}
                  >
                    {data.fakeClassification ?? data.classification}
                  </span>
                  {data.fakeTrustScore != null && (
                    <p className="text-[11px] text-slate-500">
                      Engine score: {data.fakeTrustScore.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Base Trust Score
                  </p>
                  <p className="mt-1 text-4xl font-bold text-white">
                    {data.trustScore != null
                      ? data.trustScore.toFixed(2)
                      : "--"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Weighted composite of account age, completeness, follower
                    ratio, posting patterns and risk signals.
                  </p>
                </div>
                <div className="w-40">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Risk Meter</span>
                    <span>0 – 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${
                        data.trustScore == null
                          ? "bg-slate-600"
                          : data.trustScore > 75
                          ? "bg-emerald-400"
                          : data.trustScore >= 50
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                      style={{
                        width:
                          data.trustScore != null
                            ? `${Math.max(
                                5,
                                Math.min(100, data.trustScore)
                              )}%`
                            : "30%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {data.similarAccountsDetected && data.similarAccountsDetected.length > 0 && (
                <div className="rounded-xl border border-amber-600/60 bg-amber-950/30 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                    Detection: Similar accounts in database
                  </p>
                  <p className="mt-1 text-xs text-slate-200">
                    This profile matches or resembles other accounts already in the system. Treat as suspicious and verify identity.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {data.similarAccountsDetected.map((s) => (
                      <li key={s.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-xs">
                        <span className="font-medium text-slate-200">{s.platform} · @{s.handle}</span>
                        <span className="ml-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-200">
                          {s.matchType === "exact" ? "Exact match" : s.matchType === "similar_handle" ? "Similar handle" : "Same user, platform"}
                        </span>
                        <p className="mt-1 text-slate-400">{s.reason}</p>
                      </li>
                    ))}
                  </ul>
                  {data.duplicateIdentityScore != null && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Duplicate/similarity signal: {data.duplicateIdentityScore}/100 (lower = more suspicious).
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Blockchain Status
                </p>
                <p className="mt-1 text-slate-200">
                  {data.onChain
                    ? "Identity hash located in chain."
                    : "Awaiting on-chain confirmation."}
                </p>
                <p className="mt-2 break-all text-xs text-slate-500">
                  Block hash:{" "}
                  {data.blockchainHash ?? "Will be populated after mining."}
                </p>
                <Link
                  to="/blockchain"
                  className="mt-2 inline-block text-xs text-teal-400 hover:underline"
                >
                  Open blockchain explorer
                </Link>
              </div>
              {data.llmReason && (
                <div className="rounded-xl border border-teal-700/60 bg-slate-900/80 p-4 text-xs text-slate-200">
                  <p className="text-xs uppercase tracking-wide text-teal-300">
                    LLM Reasoning (Explanation Only)
                  </p>
                  <p className="mt-2 text-slate-200">{data.llmReason}</p>
                  {data.llmFraudLikelihood && (
                    <p className="mt-2 text-slate-300">
                      <span className="font-semibold text-slate-100">
                        Fraud likelihood:
                      </span>{" "}
                      {data.llmFraudLikelihood}
                    </p>
                  )}
                  {data.llmAdminRecommendation && (
                    <p className="mt-1 text-slate-300">
                      <span className="font-semibold text-slate-100">
                        Recommendation:
                      </span>{" "}
                      {data.llmAdminRecommendation}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500">
                    This narrative is generated by the LLM to help interpret the
                    deterministic scores. It does not change the underlying
                    trust score or classification.
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-400">
                <p className="font-semibold text-slate-200">
                  How to interpret this score
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    &gt; 75 – strong organic behaviour and profile completeness
                    consistent with genuine users.
                  </li>
                  <li>
                    50 – 75 – mixed signals: some risk markers present, manual
                    review recommended.
                  </li>
                  <li>
                    &lt; 50 – high-risk indicators such as abnormal ratios or
                    low history; treat as likely fake.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

