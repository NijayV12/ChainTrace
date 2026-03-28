import { useEffect, useMemo, useState } from "react";
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

function shortHash(value: string, start = 12, end = 10): string {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default function BlockchainExplorer() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.blockchain.explorer();
        if (!active) return;
        const explorerData = res as ExplorerData;
        setData(explorerData);
        setSelectedHash(explorerData.blocks[explorerData.blocks.length - 1]?.hash ?? null);
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

  const blocksNewestFirst = useMemo(
    () => (data?.blocks ? [...data.blocks].reverse() : []),
    [data]
  );

  const selectedBlock =
    blocksNewestFirst.find((block) => block.hash === selectedHash) ?? blocksNewestFirst[0];

  const overview = useMemo(() => {
    const blocks = data?.blocks ?? [];
    const anchoredAccounts = blocks.filter((block) => block.data.accountId).length;
    const avgNonce =
      blocks.length > 0
        ? Math.round(blocks.reduce((sum, block) => sum + block.nonce, 0) / blocks.length)
        : 0;
    return {
      anchoredAccounts,
      avgNonce,
      firstTimestamp: blocks[0]?.timestamp ?? null,
      latestTimestamp: blocks[blocks.length - 1]?.timestamp ?? null,
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <header className="grid gap-5 rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_60px_rgba(8,15,26,0.45)] lg:grid-cols-[1.15fr,0.85fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Blockchain explorer</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Trace how verification anchors move through the chain.</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            This view is designed for audit and review. Each block records a hashed identity anchor
            so the team can prove that verification events were written into a tamper-evident sequence.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/45 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Operational goal</p>
          <p className="mt-3 text-sm text-slate-300">
            Confirm chain integrity, inspect block lineage, and review which verification records were
            anchored on-chain for later evidence presentation or compliance review.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Blocks</p>
          <p className="mt-3 text-3xl font-semibold text-white">{loading ? "--" : data?.length ?? 0}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Anchored accounts</p>
          <p className="mt-3 text-3xl font-semibold text-sky-300">{loading ? "--" : overview.anchoredAccounts}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Average nonce</p>
          <p className="mt-3 text-3xl font-semibold text-teal-300">{loading ? "--" : overview.avgNonce}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Integrity</p>
          <p className={`mt-3 text-2xl font-semibold ${data?.valid ? "text-emerald-300" : "text-rose-300"}`}>
            {loading ? "--" : data?.valid ? "Valid" : "Invalid"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Chain timeline</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Select a block to inspect</h2>
            </div>
            <p className="text-xs text-slate-400">
              {loading
                ? "Loading blocks..."
                : `From ${
                    overview.firstTimestamp
                      ? new Date(overview.firstTimestamp).toLocaleDateString()
                      : "n/a"
                  } to ${
                    overview.latestTimestamp
                      ? new Date(overview.latestTimestamp).toLocaleDateString()
                      : "n/a"
                  }`}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <>
                <div className="skeleton h-20 w-full rounded-[1.5rem]" />
                <div className="skeleton h-20 w-full rounded-[1.5rem]" />
                <div className="skeleton h-20 w-full rounded-[1.5rem]" />
              </>
            ) : !blocksNewestFirst.length ? (
              <p className="text-sm text-slate-500">No blocks found.</p>
            ) : (
              blocksNewestFirst.map((block, index) => (
                <button
                  key={block.hash}
                  type="button"
                  onClick={() => setSelectedHash(block.hash)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    selectedBlock?.hash === block.hash
                      ? "border-teal-400/40 bg-teal-400/10"
                      : "border-slate-800 bg-slate-900/35 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Block #{block.index} {index === 0 ? "• Latest" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(block.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] ${
                      block.index === 0
                        ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                        : "border-slate-700 bg-slate-900/50 text-slate-400"
                    }`}>
                      nonce {block.nonce}
                    </span>
                  </div>
                  <p className="mt-3 break-all text-xs text-slate-300">{shortHash(block.hash)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_0_50px_rgba(8,15,26,0.35)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Selected block</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {selectedBlock ? `Detailed inspection for block #${selectedBlock.index}` : "No block selected"}
          </h2>

          {selectedBlock ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Block hash</p>
                  <p className="mt-3 break-all text-sm text-slate-200">{selectedBlock.hash}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Previous hash</p>
                  <p className="mt-3 break-all text-sm text-slate-200">{selectedBlock.previousHash}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Timestamp</p>
                  <p className="mt-3 text-sm text-white">{new Date(selectedBlock.timestamp).toLocaleString()}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Nonce</p>
                  <p className="mt-3 text-sm text-white">{selectedBlock.nonce}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Payload hash</p>
                  <p className="mt-3 break-all text-sm text-white">{selectedBlock.dataHash}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Anchored identity record</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Identity hash</p>
                    <p className="mt-2 break-all text-sm text-slate-200">{selectedBlock.data.identityHash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account reference</p>
                    <p className="mt-2 break-all text-sm text-slate-200">
                      {selectedBlock.data.accountId ?? "Genesis / no account reference"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/35 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Audit interpretation</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li>This block anchors a verification event using a hashed identity value rather than raw personal data.</li>
                  <li>The previous hash links this record to the chain history, making silent tampering easier to detect.</li>
                  <li>The nonce shows the proof-of-work effort required before the block was accepted.</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Select a block from the timeline to inspect it.</p>
          )}
        </div>
      </section>
    </div>
  );
}
