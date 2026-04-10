import { describe, expect, it } from "vitest";
import { classifyScore, computeTrustScore } from "./scoring.js";

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
      duplicateIdentityScore: -20,
      suspiciousLoginScore: -50,
    });
    const low = computeTrustScore({
      accountAgeMonths: 0,
      profileComplete: false,
      followers: 0,
      following: 1000,
      posts: 0,
      duplicateIdentityScore: 200,
      suspiciousLoginScore: 200,
    });

    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("rewards strong credibility signals with higher trust", () => {
    const trusted = computeTrustScore({
      accountAgeMonths: 36,
      profileComplete: true,
      followers: 2400,
      following: 300,
      posts: 180,
      duplicateIdentityScore: 5,
      suspiciousLoginScore: 5,
    });

    const risky = computeTrustScore({
      accountAgeMonths: 1,
      profileComplete: false,
      followers: 4,
      following: 650,
      posts: 1,
      duplicateIdentityScore: 85,
      suspiciousLoginScore: 80,
    });

    expect(trusted).toBeGreaterThan(risky);
    expect(trusted).toBeGreaterThanOrEqual(75);
    expect(risky).toBeLessThan(45);
  });

  it("penalizes suspicious signals instead of rewarding them", () => {
    const baseline = computeTrustScore({
      accountAgeMonths: 12,
      profileComplete: true,
      followers: 400,
      following: 180,
      posts: 60,
      duplicateIdentityScore: 10,
      suspiciousLoginScore: 10,
    });

    const suspicious = computeTrustScore({
      accountAgeMonths: 12,
      profileComplete: true,
      followers: 400,
      following: 180,
      posts: 60,
      duplicateIdentityScore: 90,
      suspiciousLoginScore: 90,
    });

    expect(suspicious).toBeLessThan(baseline);
  });

  it("applies extra penalties when multiple red flags appear together", () => {
    const mildRisk = computeTrustScore({
      accountAgeMonths: 2,
      profileComplete: true,
      followers: 40,
      following: 150,
      posts: 8,
      duplicateIdentityScore: 60,
      suspiciousLoginScore: 40,
    });

    const compoundedRisk = computeTrustScore({
      accountAgeMonths: 2,
      profileComplete: false,
      followers: 5,
      following: 500,
      posts: 2,
      duplicateIdentityScore: 60,
      suspiciousLoginScore: 75,
    });

    expect(compoundedRisk).toBeLessThan(mildRisk);
  });
});

describe("classifyScore", () => {
  it("classifies according to thresholds", () => {
    expect(classifyScore(80)).toBe("GENUINE");
    expect(classifyScore(75)).toBe("GENUINE");
    expect(classifyScore(74.9)).toBe("SUSPICIOUS");
    expect(classifyScore(45)).toBe("SUSPICIOUS");
    expect(classifyScore(44.9)).toBe("HIGH_RISK");
  });
});
