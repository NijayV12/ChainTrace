import { describe, it, expect } from "vitest";
import {
  computeFakeTrustScore,
  classifyFakeScore,
  type FakeFeatures,
} from "./fakeScoring.js";

const baseFeatures: FakeFeatures = {
  accountAgeDays: 365,
  profileCompletenessScore: 100,
  usernameRandomnessScore: 10,
  followerFollowingRatio: 1.5,
  friendRequestRate: 1,
  mutualConnectionScore: 80,
  postingFrequency: 1,
  loginLocationVariation: 10,
  activityTimePatternScore: 80,
  spamKeywordScore: 0,
  repetitiveContentScore: 10,
  duplicateIdentityFlag: false,
  multipleAccountsSameIp: false,
  deviceFingerprintRisk: 10,
};

describe("fake scoring engine", () => {
  it("is deterministic for same input", () => {
    const a = computeFakeTrustScore(baseFeatures);
    const b = computeFakeTrustScore(baseFeatures);
    expect(a).toBe(b);
  });

  it("caps scores between 0 and 100", () => {
    const high = computeFakeTrustScore({
      ...baseFeatures,
      accountAgeDays: 9999,
      profileCompletenessScore: 100,
      usernameRandomnessScore: 0,
      spamKeywordScore: 0,
      repetitiveContentScore: 0,
      duplicateIdentityFlag: false,
      multipleAccountsSameIp: false,
      deviceFingerprintRisk: 0,
    });
    const low = computeFakeTrustScore({
      ...baseFeatures,
      accountAgeDays: 0,
      profileCompletenessScore: 0,
      usernameRandomnessScore: 100,
      spamKeywordScore: 100,
      repetitiveContentScore: 100,
      duplicateIdentityFlag: true,
      multipleAccountsSameIp: true,
      deviceFingerprintRisk: 100,
    });
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("classifies using 4-level thresholds", () => {
    expect(classifyFakeScore(85)).toBe("GENUINE");
    expect(classifyFakeScore(75)).toBe("LOW_RISK");
    expect(classifyFakeScore(50)).toBe("SUSPICIOUS");
    expect(classifyFakeScore(30)).toBe("FAKE");
  });
});

