import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";

export default function VerificationForm() {
  const [platform, setPlatform] = useState("Twitter");
  const [handle, setHandle] = useState("");
  const [accountAge, setAccountAge] = useState(12);
  const [followers, setFollowers] = useState(100);
  const [following, setFollowing] = useState(50);
  const [posts, setPosts] = useState(20);
  const [profileComplete, setProfileComplete] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const account = await api.users.verify({
        platform,
        handle,
        accountAge,
        followers,
        following,
        posts,
        profileComplete,
      });
      toast.success("Verification submitted");
      const id = (account as { id: string }).id;
      navigate(`/accounts/${id}/result`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">
          Submit Social Account for Verification
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Provide public metrics for your profile. CHAINTRACE will compute a
          deterministic trust score and anchor a hashed identity to the
          blockchain.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-slate-700/60 bg-slate-900/80 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            >
              <option>Twitter</option>
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>Facebook</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Account age (months)
            </label>
            <input
              type="number"
              min={0}
              value={accountAge}
              onChange={(e) => setAccountAge(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Followers
            </label>
            <input
              type="number"
              min={0}
              value={followers}
              onChange={(e) => setFollowers(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Following
            </label>
            <input
              type="number"
              min={0}
              value={following}
              onChange={(e) => setFollowing(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Posts
            </label>
            <input
              type="number"
              min={0}
              value={posts}
              onChange={(e) => setPosts(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              id="profile-complete"
              type="checkbox"
              checked={profileComplete}
              onChange={(e) => setProfileComplete(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
            />
            <label
              htmlFor="profile-complete"
              className="text-sm text-slate-300"
            >
              Profile is complete (photo, bio, links)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700/60 pt-4">
          <p className="text-xs text-slate-500">
            Your raw profile metrics are used to compute a deterministic trust
            score. Only a hashed identity is written on-chain.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Scoring..." : "Submit for verification"}
          </button>
        </div>
      </form>
    </div>
  );
}

