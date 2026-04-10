import { describe, expect, it } from "vitest";
import { hashEvidenceRecord, hashIdentity } from "./blockchainService.js";

describe("blockchainService hashing", () => {
  it("creates stable identity hashes for the same account payload", () => {
    const a = hashIdentity("acc-1", "Twitter", "@ExampleUser");
    const b = hashIdentity("acc-1", "twitter", "ExampleUser");

    expect(a).toBe(b);
  });

  it("creates stable evidence hashes regardless of key order", () => {
    const a = hashEvidenceRecord({
      caseId: "case-1",
      status: "OPEN",
      alerts: ["a1", "a2"],
    });
    const b = hashEvidenceRecord({
      alerts: ["a1", "a2"],
      status: "OPEN",
      caseId: "case-1",
    });

    expect(a).toBe(b);
  });
});
