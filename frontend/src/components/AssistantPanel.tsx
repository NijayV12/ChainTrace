import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";

type ChatMessage =
  | { id: string; role: "assistant"; text: string; meta?: string; createdAt?: string }
  | { id: string; role: "user"; text: string; createdAt?: string };

interface AssistantPanelProps {
  caseId?: string;
  title?: string;
  intro?: string;
}

export default function AssistantPanel({
  caseId,
  title = "Operational chat support",
  intro = "Use the assistant to summarize platform risk, suggest next investigative actions, or help explain suspicious patterns. It does not change scores or overwrite case evidence.",
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contextLabel, setContextLabel] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await api.assistant.history(caseId ? { caseId } : undefined);
        if (!active) return;
        setContextLabel(history.contextLabel);
        if (history.messages.length === 0) {
          setMessages([
            {
              id: "assistant-welcome",
              role: "assistant",
              text: caseId
                ? "Ask for a case summary, evidence interpretation, next-step guidance, or a concise explanation of the current risk posture for this investigation."
                : "Ask for a quick operational summary, suspicious-pattern explanation, or next-step recommendation. I'll help interpret the current platform state without changing deterministic scores.",
              meta: caseId ? "Case-linked assistant" : "ChainTrace Analyst Assistant",
            },
          ]);
          return;
        }

        setMessages(
          history.messages.map((message) => ({
            id: message.id,
            role: message.role === "assistant" ? "assistant" : "user",
            text: message.content,
            meta: message.role === "assistant" ? message.meta ?? undefined : undefined,
            createdAt: message.createdAt,
          }))
        );
      } catch (err) {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "Failed to load assistant history");
        setMessages([
          {
            id: "assistant-fallback",
            role: "assistant",
            text: "I couldn't load your earlier conversation, but you can start a new one here.",
            meta: "History unavailable",
          },
        ]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [caseId]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const optimisticId = `user-${Date.now()}`;
    setMessages((current) => [...current, { id: optimisticId, role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await api.assistant.chat(caseId ? { message: trimmed, caseId } : { message: trimmed });
      setContextLabel(reply.contextLabel);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: reply.reply,
          meta: `${reply.summary} | ${reply.contextLabel}`,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assistant request failed");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "I couldn't complete that request right now. Please try again in a moment.",
          meta: "Assistant unavailable",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">LLM analyst assistant</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[11px] uppercase tracking-wide text-teal-200">
          Advisory only
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">{intro}</p>
      {contextLabel ? <p className="mt-2 text-xs text-slate-500">Context: {contextLabel}</p> : null}

      <div className="mt-5 space-y-3">
        {historyLoading ? (
          <>
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-16 w-4/5" />
          </>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-[1.5rem] border p-4 ${
                message.role === "assistant"
                  ? "border-slate-800 bg-slate-900/35"
                  : "border-teal-400/30 bg-teal-400/10"
              }`}
            >
              <p className="text-sm text-slate-100">{message.text}</p>
              {"meta" in message && message.meta ? (
                <p className="mt-3 text-[11px] text-slate-500">{message.meta}</p>
              ) : null}
              {message.createdAt ? (
                <p className="mt-2 text-[10px] text-slate-600">{new Date(message.createdAt).toLocaleString()}</p>
              ) : null}
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-5 space-y-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
          placeholder={
            caseId
              ? "Ask about this case's red flags, reporting gaps, next review steps, or how the existing evidence supports escalation."
              : "Ask for a summary of recent high-risk patterns, recommended analyst actions, or what deserves manual review next."
          }
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {caseId
              ? "Case mode keeps this conversation tied to the current investigation."
              : "Global mode keeps this conversation tied to your overall operations view."}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60"
          >
            {loading ? "Thinking..." : "Ask assistant"}
          </button>
        </div>
      </form>
    </section>
  );
}
