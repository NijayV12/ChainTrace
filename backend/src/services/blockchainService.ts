import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { Chain } from "../blockchain/Chain.js";
import { config } from "../config/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type BlockchainEvidencePayload = {
  identityHash: string;
  accountId?: string;
  entityType?: string;
  entityId?: string;
  evidenceType?: string;
  summary?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

let chainInstance: Chain | null = null;

function getChain(): Chain {
  if (!chainInstance) {
    const dataDir = path.isAbsolute(config.blockchain.dataDir)
      ? config.blockchain.dataDir
      : path.resolve(path.join(__dirname, "../../.."), config.blockchain.dataDir);
    chainInstance = new Chain(dataDir);
  }
  return chainInstance;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `"${key}":${stableStringify(nested)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashIdentity(accountId: string, platform: string, handle: string): string {
  return sha256(
    stableStringify({
      accountId,
      platform: platform.trim().toLowerCase(),
      handle: handle.trim().toLowerCase().replace(/^@/, ""),
    })
  );
}

export function hashEvidenceRecord(record: Record<string, unknown>): string {
  return sha256(stableStringify(record));
}

export function addEvidenceToBlockchain(payload: BlockchainEvidencePayload): {
  blockHash: string;
  index: number;
  evidenceHash: string;
} {
  const chain = getChain();
  const evidenceHash = payload.identityHash;
  const block = chain.addBlock({
    ...payload,
    evidenceHash,
  });

  return { blockHash: block.hash, index: block.index, evidenceHash };
}

export function addToBlockchain(identityHash: string, accountId: string): {
  blockHash: string;
  index: number;
  evidenceHash: string;
} {
  return addEvidenceToBlockchain({
    identityHash,
    accountId,
    entityType: "SOCIAL_ACCOUNT",
    entityId: accountId,
    evidenceType: "ACCOUNT_VERIFICATION",
    source: "verification-service",
  });
}

export function getChainExplorerData(): {
  length: number;
  blocks: Array<{
    index: number;
    timestamp: number;
    hash: string;
    previousHash: string;
    dataHash: string;
    nonce: number;
    data: Record<string, unknown>;
  }>;
  valid: boolean;
} {
  const chain = getChain();
  const blocks = chain.blocks.map((b) => ({
    index: b.index,
    timestamp: b.timestamp,
    hash: b.hash,
    previousHash: b.previousHash,
    dataHash: b.dataHash,
    nonce: b.nonce,
    data: b.data,
  }));

  return {
    length: chain.length,
    blocks,
    valid: chain.verifyChain(),
  };
}

export function getBlockByHash(hash: string) {
  const chain = getChain();
  return chain.getBlockByHash(hash)?.toJSON();
}

export function getBlockByIndex(index: number) {
  const chain = getChain();
  return chain.getBlockByIndex(index)?.toJSON();
}

export function verifyOnChain(identityHash: string): boolean {
  const chain = getChain();
  return !!chain.findBlockByIdentityHash(identityHash);
}

export function verifyEvidenceOnChain(evidenceHash: string): boolean {
  return verifyOnChain(evidenceHash);
}
