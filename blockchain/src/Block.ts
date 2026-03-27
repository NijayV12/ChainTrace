import crypto from "crypto";

export interface BlockData {
  identityHash: string;
  accountId?: string;
  [key: string]: unknown;
}

export interface BlockShape {
  index: number;
  timestamp: number;
  dataHash: string;
  previousHash: string;
  nonce: number;
  data: BlockData;
}

export class Block {
  readonly index: number;
  readonly timestamp: number;
  readonly dataHash: string;
  readonly previousHash: string;
  readonly nonce: number;
  readonly data: BlockData;

  constructor(
    index: number,
    timestamp: number,
    data: BlockData,
    previousHash: string,
    nonce: number
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.dataHash = this.computeDataHash();
  }

  private computeDataHash(): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(this.data) + this.timestamp)
      .digest("hex");
  }

  get hash(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.timestamp +
          this.dataHash +
          this.previousHash +
          this.nonce
      )
      .digest("hex");
  }

  toJSON(): BlockShape {
    return {
      index: this.index,
      timestamp: this.timestamp,
      dataHash: this.dataHash,
      previousHash: this.previousHash,
      nonce: this.nonce,
      data: this.data,
    };
  }

  static fromJSON(obj: BlockShape): Block {
    return new Block(
      obj.index,
      obj.timestamp,
      obj.data,
      obj.previousHash,
      obj.nonce
    );
  }
}
