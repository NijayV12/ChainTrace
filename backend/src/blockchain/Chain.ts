import fs from "fs";
import path from "path";
import { Block, type BlockData } from "./Block.js";

const DIFFICULTY = 4;
const PREFIX = "0".repeat(DIFFICULTY);

export class Chain {
  private chain: Block[] = [];
  private readonly dataDir: string;
  private readonly chainPath: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.chainPath = path.join(dataDir, "chain.json");
    this.ensureDir();
    this.loadOrCreate();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadOrCreate(): void {
    if (fs.existsSync(this.chainPath)) {
      const raw = fs.readFileSync(this.chainPath, "utf-8");
      const arr = JSON.parse(raw) as Array<{
        index: number;
        timestamp: number;
        dataHash: string;
        previousHash: string;
        nonce: number;
        data: BlockData;
      }>;
      this.chain = arr.map((b) => Block.fromJSON({ ...b, data: b.data }));
      return;
    }
    const genesis = this.mineBlock(
      { identityHash: "genesis", accountId: "genesis" },
      "0"
    );
    this.chain = [genesis];
    this.persist();
  }

  private persist(): void {
    fs.writeFileSync(
      this.chainPath,
      JSON.stringify(this.chain.map((b) => b.toJSON()), null, 2),
      "utf-8"
    );
  }

  get lastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  get length(): number {
    return this.chain.length;
  }

  get blocks(): Block[] {
    return [...this.chain];
  }

  mineBlock(data: BlockData, previousHash: string): Block {
    let nonce = 0;
    const index = this.chain.length;
    const timestamp = Date.now();
    let block = new Block(index, timestamp, data, previousHash, nonce);

    while (!block.hash.startsWith(PREFIX)) {
      nonce++;
      block = new Block(index, timestamp, data, previousHash, nonce);
    }

    return block;
  }

  addBlock(data: BlockData): Block {
    const previousHash = this.lastBlock.hash;
    const block = this.mineBlock(data, previousHash);
    this.chain.push(block);
    this.persist();
    return block;
  }

  verifyChain(): boolean {
    if (this.chain.length === 0) return false;
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.previousHash !== previous.hash) return false;
      const recomputed = new Block(
        current.index,
        current.timestamp,
        current.data,
        current.previousHash,
        current.nonce
      );
      if (recomputed.hash !== current.hash) return false;
    }
    return true;
  }

  getBlockByIndex(index: number): Block | undefined {
    return this.chain[index];
  }

  getBlockByHash(hash: string): Block | undefined {
    return this.chain.find((b) => b.hash === hash);
  }

  findBlockByIdentityHash(identityHash: string): Block | undefined {
    return this.chain.find((b) => b.data.identityHash === identityHash);
  }
}
