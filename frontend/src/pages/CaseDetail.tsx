import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AssistantPanel from "../components/AssistantPanel";

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

interface ReportEntry {
  id: string;
  summary: string;
  recommendation: string;
  createdAt: string;
  author?: { name: string; email: string; role: string };
}

interface DecisionEntry {
  id: string;
  riskRating: string;
  decision: string;
  rationale: string;
  createdAt: string;
  analyst?: { name: string; email: string; role: string };
}

interface NoteEntry {
  id: string;
  body: string;
  createdAt: string;
  author?: { name: string; email: string; role: string };
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
  reports?: ReportEntry[];
  decisions?: DecisionEntry[];
  notes?: NoteEntry[];
}

function riskTone(classification: string | null | undefined): string {
  if (classification === "FAKE" || classification === "HIGH_RISK") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }
  if (classification === "SUSPICIOUS") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  }
  if (classification === "GENUINE") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  return "border-slate-700 bg-slate-900/40 text-slate-300";
}

function scoreLabel(score: number | null): string {
  if (score == null) return "Pending";
  if (score >= 75) return "Low concern";
  if (score >= 50) return "Review required";
  return "High concern";
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

  const loadCase = async (caseId: string) => {
    const res = await api.cases.get(caseId);
    setData(res as unknown as CaseData);
  };

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

  const summary = useMemo(() => {
    const accounts = data?.accounts ?? [];
    const highRisk = accounts.filter(
      ({ account }) =>
        account.fakeClassification === "FAKE" ||
        account.fakeClassification === "HIGH_RISK"
    ).length;
    const suspicious = accounts.filter(
      ({ account }) => account.fakeClassification === "SUSPICIOUS"
    ).length;
    const anchored = accounts.filter(({ account }) => !!account.blockchainHash).length;
    return { highRisk, suspicious, anchored };
  }, [data]);

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
      await loadCase(id);
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
      await loadCase(id);
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
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `case-${id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-1/2 rounded" />
        <div className="skeleton h-44 w-full rounded-[2rem]" />
        <div className="skeleton h-80 w-full rounded-[2rem]" />
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
    <div className="space-y-8">
      <header className="grid gap-5 rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_60px_rgba(8,15,26,0.45)] lg:grid-cols-[1.2fr,0.8fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Investigation case</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{data.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-slate-200">
              Status: {data.status}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-slate-400">
              Opened {new Date(data.createdAt).toLocaleString()}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-slate-400">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-slate-400">
            {data.description || "No case description has been added yet."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Case ownership</p>
            <p className="mt-3 text-sm text-slate-300">
              Created by <span className="font-medium text-white">{data.createdBy?.name ?? "Unknown"}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{data.createdBy?.email ?? "No creator email available"}</p>
            <p className="mt-4 text-sm text-slate-300">
              Assigned to <span className="font-medium text-white">{data.assignedTo?.name ?? "Unassigned"}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{data.assignedTo?.email ?? "No assignee email available"}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-300"
            >
              Export case bundle
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Linked accounts</p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.accounts.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">High concern</p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{summary.highRisk}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Under review</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{summary.suspicious}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Anchored on-chain</p>
          <p className="mt-3 text-3xl font-semibold text-sky-300">{summary.anchored}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Evidence board</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Linked accounts and anchor status</h2>
          </div>
          <p className="max-w-md text-right text-xs text-slate-400">
            Review each account’s scoring position, classification, and blockchain reference before drafting recommendations.
          </p>
        </div>

        {data.accounts.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">No accounts linked to this case yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {data.accounts.map(({ account }) => (
              <article
                key={account.id}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-medium text-white">
                      {account.platform} @{account.handle}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Investigator: {account.user?.name ?? "Unassigned"} • {account.user?.email ?? "No email"}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide ${riskTone(account.fakeClassification)}`}>
                    {account.fakeClassification ?? "PENDING"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Base trust score</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {account.trustScore != null ? account.trustScore.toFixed(2) : "--"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{scoreLabel(account.trustScore)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Fake-engine score</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {account.fakeTrustScore != null ? account.fakeTrustScore.toFixed(2) : "--"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Operational fraud signal</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Blockchain reference</p>
                  <p className="mt-2 break-all text-xs text-slate-300">
                    {account.blockchainHash ?? "No blockchain anchor recorded yet."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        {canInvestigator && (
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Investigator report</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Evidence summary and field recommendation</h2>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleDraftReport}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-60"
              >
                {busy ? "Drafting..." : "Generate draft"}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-400">
                Executive summary
                <textarea
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  rows={8}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="Summarize the account behaviour, key red flags, and what was verified."
                />
              </label>
              <label className="block text-sm text-slate-400">
                Recommendation
                <textarea
                  value={reportRecommendation}
                  onChange={(e) => setReportRecommendation(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="Describe the next action: monitor, escalate, preserve evidence, or clear."
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveReport}
                className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60"
              >
                Save investigator report
              </button>
            </div>
          </div>
        )}

        {canAnalyst && (
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Analyst decision</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Risk rating and supervisory action</h2>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleDraftDecision}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-60"
              >
                {busy ? "Drafting..." : "Suggest decision"}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-400">
                Risk rating
                <input
                  value={decisionRisk}
                  onChange={(e) => setDecisionRisk(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="LOW / MEDIUM / HIGH"
                />
              </label>
              <label className="block text-sm text-slate-400">
                Decision
                <textarea
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="Document the analyst conclusion and operational outcome."
                />
              </label>
              <label className="block text-sm text-slate-400">
                Rationale
                <textarea
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  placeholder="Explain why the risk rating was assigned and what evidence supports it."
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveDecision}
                className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60"
              >
                Save analyst decision
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr,0.9fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Saved reports</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Investigator submissions</h2>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-400">
              {data.reports?.length ?? 0} entries
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {data.reports?.length ? (
              data.reports.map((report) => (
                <article key={report.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{report.author?.name ?? "Unknown author"}</p>
                    <p className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm text-slate-300">{report.summary}</p>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Recommendation</p>
                    <p className="mt-2 text-sm text-slate-300">{report.recommendation}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No investigator reports saved yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Saved decisions</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Analyst conclusions</h2>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-400">
              {data.decisions?.length ?? 0} entries
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {data.decisions?.length ? (
              data.decisions.map((decision) => (
                <article key={decision.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{decision.analyst?.name ?? "Unknown analyst"}</p>
                    <p className="text-xs text-slate-500">{new Date(decision.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="mt-3 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-wide text-sky-200">
                    {decision.riskRating}
                  </span>
                  <p className="mt-3 text-sm text-slate-300">{decision.decision}</p>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Rationale</p>
                    <p className="mt-2 text-sm text-slate-300">{decision.rationale}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No analyst decisions saved yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Case notes</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Audit trail</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {data.notes?.length ? (
              data.notes.map((note) => (
                <article key={note.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-4">
                  <p className="text-sm text-slate-300">{note.body}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {note.author?.name ?? "Unknown author"} • {new Date(note.createdAt).toLocaleString()}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No notes recorded yet.</p>
            )}
          </div>
        </div>
      </section>

      <AssistantPanel
        caseId={data.id}
        title="Case-linked analyst assistant"
        intro="Use the assistant to interpret this case in context, summarize evidence already on file, surface reporting gaps, and suggest the next investigative or analyst action. It remains advisory and does not alter scores, notes, or decisions."
      />
    </div>
  );
}
