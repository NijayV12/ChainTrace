import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface CaseAccount {
  account: {
    id: string;
    platform: string;
    handle: string;
    trustScore: number | null;
    fakeTrustScore: number | null;
    fakeClassification: string | null;
    blockchainHash: string | null;
    user?: {
      name: string;
      email: string;
      phone?: string | null;
      role: string;
    };
  };
}

interface CaseData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string } | null;
  accounts: CaseAccount[];
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState("");
  const [reportRecommendation, setReportRecommendation] = useState("");
  const [decisionRisk, setDecisionRisk] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res = await api.cases.get(id);
        if (!active) return;
        setData(res as unknown as CaseData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load case");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const canInvestigator =
    user?.role === "INVESTIGATOR" || user?.role === "SUPER_ADMIN";
  const canAnalyst = user?.role === "ANALYST" || user?.role === "SUPER_ADMIN";

  const handleDraftReport = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const draft = await api.cases.draftReport(id);
      setReportSummary(draft.summary);
      setReportRecommendation(draft.recommendation);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveReport = async () => {
    if (!id) return;
    if (!reportSummary || !reportRecommendation) {
      toast.error("Summary and recommendation are required.");
      return;
    }
    setBusy(true);
    try {
      await api.cases.addReport(id, {
        summary: reportSummary,
        recommendation: reportRecommendation,
      });
      toast.success("Investigator report saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDraftDecision = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const draft = await api.cases.draftDecision(id);
      setDecisionRisk(draft.riskRating);
      setDecisionText(draft.decision);
      setDecisionRationale(draft.rationale);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!id) return;
    if (!decisionRisk || !decisionText || !decisionRationale) {
      toast.error("Risk rating, decision, and rationale are required.");
      return;
    }
    setBusy(true);
    try {
      await api.cases.addDecision(id, {
        riskRating: decisionRisk,
        decision: decisionText,
        rationale: decisionRationale,
      });
      toast.success("Analyst decision saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const bundle = await api.cases.export(id);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `case-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-1/2 rounded" />
        <div className="skeleton h-40 w-full rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-100">
        {error ?? "Case not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/15 text-base">
              🧾
            </span>
            {data.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Status:{" "}
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-200">
              {data.status}
            </span>
          </p>
          {data.description && (
            <p className="mt-1 text-sm text-slate-300">{data.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Export JSON
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-sm">
        <h2 className="text-sm font-medium text-slate-200">Linked accounts</h2>
        {data.accounts.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            No accounts linked to this case yet.
          </p>
        ) : (
          <div className="mt-2 overflow-auto text-xs">
            <table className="min-w-full">
              <thead className="border-b border-slate-700/60 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-1 text-left">Account</th>
                  <th className="px-2 py-1 text-left">Scores</th>
                  <th className="px-2 py-1 text-left">Classification</th>
                  <th className="px-2 py-1 text-left">Investigator</th>
                  <th className="px-2 py-1 text-left">Blockchain</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map(({ account }) => (
                  <tr key={account.id} className="border-b border-slate-800/60">
                    <td className="px-2 py-1 text-slate-200">
                      {account.platform} · @{account.handle}
                    </td>
                    <td className="px-2 py-1 text-slate-200">
                      base {account.trustScore ?? "n/a"} · fake{" "}
                      {account.fakeTrustScore ?? "n/a"}
                    </td>
                    <td className="px-2 py-1 text-slate-200">
                      {account.fakeClassification ?? "PENDING"}
                    </td>
                    <td className="px-2 py-1 text-[11px] text-slate-300">
                      {account.user ? (
                        <span>
                          {account.user.name}{" "}
                          <span className="text-slate-500">
                            ({account.user.email}
                            {account.user.phone ? ` · ${account.user.phone}` : ""})
                          </span>
                        </span>
                      ) : (
                        "n/a"
                      )}
                    </td>
                    <td className="px-2 py-1 text-[11px] text-slate-400">
                      {account.blockchainHash
                        ? `${account.blockchainHash.slice(0, 10)}...`
                        : "n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {canInvestigator && (
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-200">
            <h2 className="text-sm font-medium text-slate-200">
              Investigator report
            </h2>
            <button
              type="button"
              disabled={busy}
              onClick={handleDraftReport}
              className="rounded bg-slate-800 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-60"
            >
              {busy ? "Drafting..." : "Generate draft from data"}
            </button>
            <label className="block text-[11px] text-slate-400">
              Summary
              <textarea
                value={reportSummary}
                onChange={(e) => setReportSummary(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <label className="block text-[11px] text-slate-400">
              Recommendation
              <textarea
                value={reportRecommendation}
                onChange={(e) => setReportRecommendation(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={handleSaveReport}
              className="mt-1 rounded bg-teal-500 px-3 py-1 text-[11px] font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-60"
            >
              Save report
            </button>
          </div>
        )}

        {canAnalyst && (
          <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-200">
            <h2 className="text-sm font-medium text-slate-200">
              Analyst decision
            </h2>
            <button
              type="button"
              disabled={busy}
              onClick={handleDraftDecision}
              className="rounded bg-slate-800 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-60"
            >
              {busy ? "Drafting..." : "Suggest decision"}
            </button>
            <label className="block text-[11px] text-slate-400">
              Risk rating (e.g. LOW / MEDIUM / HIGH)
              <input
                value={decisionRisk}
                onChange={(e) => setDecisionRisk(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <label className="block text-[11px] text-slate-400">
              Decision
              <textarea
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <label className="block text-[11px] text-slate-400">
              Rationale
              <textarea
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={handleSaveDecision}
              className="mt-1 rounded bg-teal-500 px-3 py-1 text-[11px] font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-60"
            >
              Save decision
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

