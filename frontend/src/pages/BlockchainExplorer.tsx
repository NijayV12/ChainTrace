import { useEffect, useState } from "react";
import { api } from "../api/client";

interface BlockSummary {
  index: number;
  timestamp: number;
  hash: string;
  previousHash: string;
  dataHash: string;
  nonce: number;
  data: {
    identityHash: string;
    accountId?: string;
  };
}

interface ExplorerData {
  length: number;
  blocks: BlockSummary[];
  valid: boolean;
}

export default function BlockchainExplorer() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.blockchain.explorer();
        if (!active) return;
        setData(res as ExplorerData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load chain");
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
      <header>
        <h1 className="text-2xl font-semibold text-white">
          Blockchain Explorer
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Inspect the lightweight identity chain anchoring verification events.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Chain Overview
            </p>
            <p className="mt-1 text-slate-200">
              {loading
                ? "Loading..."
                : `${data?.length ?? 0} blocks · ${
                    data?.valid ? "valid" : "invalid"
                  } integrity`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Latest</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span>Historical</span>
            </div>
          </div>
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-800/80 bg-slate-950/40">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Index</th>
                <th className="px-3 py-2 text-left font-medium">Hash</th>
                <th className="px-3 py-2 text-left font-medium">Previous</th>
                <th className="px-3 py-2 text-left font-medium">Identity Hash</th>
                <th className="px-3 py-2 text-left font-medium">Account</th>
                <th className="px-3 py-2 text-left font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4">
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton h-4 w-5/6" />
                      <div className="skeleton h-4 w-4/6" />
                    </div>
                  </td>
                </tr>
              ) : !data || data.blocks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No blocks found.
                  </td>
                </tr>
              ) : (
                data.blocks
                  .slice()
                  .reverse()
                  .map((block, idx) => (
                    <tr
                      key={block.hash}
                      className={`border-t border-slate-800/60 ${
                        idx === 0 ? "bg-sky-500/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-200">{block.index}</td>
                      <td className="px-3 py-2">
                        <code className="break-all text-[11px] text-slate-300">
                          {block.hash}
                        </code>
                      </td>
                      <td className="px-3 py-2">
                        <code className="break-all text-[11px] text-slate-500">
                          {block.previousHash}
                        </code>
                      </td>
                      <td className="px-3 py-2">
                        <code className="break-all text-[11px] text-slate-400">
                          {block.data.identityHash}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {block.data.accountId ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {new Date(block.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

