import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { Chain } from "../blockchain/Chain.js";
import { config } from "../config/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export function hashIdentity(accountId: string, platform: string, handle: string): string {
  return crypto
    .createHash("sha256")
    .update(`${accountId}:${platform}:${handle}:${Date.now()}`)
    .digest("hex");
}

export function addToBlockchain(identityHash: string, accountId: string): { blockHash: string; index: number } {
  const chain = getChain();
  const block = chain.addBlock({ identityHash, accountId });
  return { blockHash: block.hash, index: block.index };
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
    data: { identityHash: string; accountId?: string };
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
  const block = chain.getBlockByIndex(index);
  return block?.toJSON();
}

export function verifyOnChain(identityHash: string): boolean {
  const chain = getChain();
  return !!chain.findBlockByIdentityHash(identityHash);
}
