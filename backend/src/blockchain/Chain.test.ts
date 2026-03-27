import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { Chain } from "./Chain.js";

describe("Chain", () => {
  it("mines and verifies a simple chain", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chaintrace-test-"));
    const chain = new Chain(tmpDir);
    const before = chain.length;
    const block = chain.addBlock({
      identityHash: "test-identity",
      accountId: "account-1",
    });
    expect(chain.length).toBe(before + 1);
    expect(block.hash.startsWith("0000")).toBe(true);
    expect(chain.verifyChain()).toBe(true);

    const chain2 = new Chain(tmpDir);
    expect(chain2.length).toBe(chain.length);
    expect(chain2.verifyChain()).toBe(true);
  });
});

