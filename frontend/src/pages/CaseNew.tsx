import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";

export default function CaseNew() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    try {
      const created = await api.cases.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Case created");
      const id = (created as { id: string }).id;
      navigate(`/cases/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-white">New Case</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create an investigation case to group related accounts, reports, and decisions.
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/80 p-5 text-sm"
      >
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            placeholder="Example: Suspicious Twitter cluster around @handle"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            placeholder="Short context about why this case is being opened."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create case"}
          </button>
        </div>
      </form>
    </div>
  );
}

