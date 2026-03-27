import { describe, it, expect } from "vitest";
import { computeTrustScore, classifyScore } from "./scoring.js";

describe("computeTrustScore", () => {
  it("is deterministic for the same input", () => {
    const input = {
      accountAgeMonths: 12,
      profileComplete: true,
      followers: 500,
      following: 200,
      posts: 50,
      duplicateIdentityScore: 80,
      suspiciousLoginScore: 70,
    };
    const a = computeTrustScore(input);
    const b = computeTrustScore(input);
    expect(a).toBe(b);
  });

  it("caps score between 0 and 100", () => {
    const high = computeTrustScore({
      accountAgeMonths: 240,
      profileComplete: true,
      followers: 100000,
      following: 1,
      posts: 1000,
      duplicateIdentityScore: 200,
      suspiciousLoginScore: 200,
    });
    const low = computeTrustScore({
      accountAgeMonths: 0,
      profileComplete: false,
      followers: 0,
      following: 1000,
      posts: 0,
      duplicateIdentityScore: -10,
      suspiciousLoginScore: -10,
    });
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });
});

describe("classifyScore", () => {
  it("classifies according to thresholds", () => {
    expect(classifyScore(80)).toBe("GENUINE");
    expect(classifyScore(75)).toBe("SUSPICIOUS");
    expect(classifyScore(50)).toBe("SUSPICIOUS");
    expect(classifyScore(49.9)).toBe("HIGH_RISK");
  });
});

