export interface FakeFeatures {
  // PROFILE
  accountAgeDays: number;
  profileCompletenessScore: number; // 0..100
  usernameRandomnessScore: number;  // 0..100, higher = more random

  // NETWORK
  followerFollowingRatio: number;
  friendRequestRate: number;        // per day
  mutualConnectionScore: number;    // 0..100

  // ACTIVITY
  postingFrequency: number;         // posts per day
  loginLocationVariation: number;   // 0..100 (higher = more variation)
  activityTimePatternScore: number; // 0..100

  // CONTENT
  spamKeywordScore: number;         // 0..100 (higher = more spammy)
  repetitiveContentScore: number;   // 0..100

  // SECURITY
  duplicateIdentityFlag: boolean;
  multipleAccountsSameIp: boolean;
  deviceFingerprintRisk: number;    // 0..100
}

export type FakeClassification =
  | "GENUINE"
  | "LOW_RISK"
  | "SUSPICIOUS"
  | "FAKE";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function profileComponentScore(f: FakeFeatures): number {
  const ageYears = clamp(f.accountAgeDays / 365, 0, 1);
  const age = ageYears * 100;
  const completeness = clamp(f.profileCompletenessScore, 0, 100);
  const username = 100 - clamp(f.usernameRandomnessScore, 0, 100);
  return 0.4 * age + 0.35 * completeness + 0.25 * username;
}

function networkComponentScore(f: FakeFeatures): number {
  const ratio = f.followerFollowingRatio;
  let ratioScore: number;
  if (ratio === 0) ratioScore = 20;
  else if (ratio >= 3) ratioScore = 80;
  else if (ratio >= 1) ratioScore = 100;
  else if (ratio >= 0.5) ratioScore = 70;
  else ratioScore = 40;

  const frNorm = clamp(f.friendRequestRate / 50, 0, 1);
  const friendRateScore = 100 - frNorm * 100;
  const mutual = clamp(f.mutualConnectionScore, 0, 100);

  return 0.4 * ratioScore + 0.3 * friendRateScore + 0.3 * mutual;
}

function activityComponentScore(f: FakeFeatures): number {
  let freqScore: number;
  if (f.postingFrequency === 0) freqScore = 40;
  else if (f.postingFrequency < 0.1) freqScore = 50;
  else if (f.postingFrequency <= 10) freqScore = 100;
  else if (f.postingFrequency <= 30) freqScore = 70;
  else freqScore = 40;

  const locVar = 100 - clamp(f.loginLocationVariation, 0, 100);
  const pattern = clamp(f.activityTimePatternScore, 0, 100);
  return 0.4 * freqScore + 0.3 * locVar + 0.3 * pattern;
}

function contentComponentScore(f: FakeFeatures): number {
  const spam = 100 - clamp(f.spamKeywordScore, 0, 100);
  const repet = 100 - clamp(f.repetitiveContentScore, 0, 100);
  return 0.5 * spam + 0.5 * repet;
}

function identitySecurityComponentScore(f: FakeFeatures): number {
  const dupPenalty = f.duplicateIdentityFlag ? 40 : 0;
  const multiIpPenalty = f.multipleAccountsSameIp ? 30 : 0;
  const deviceRisk = clamp(f.deviceFingerprintRisk, 0, 100);
  const base = 100 - deviceRisk - dupPenalty - multiIpPenalty;
  return clamp(base, 0, 100);
}

export function computeFakeTrustScore(features: FakeFeatures): number {
  const accountAge = profileComponentScore(features);
  const profileCompleteness = profileComponentScore(features);
  const networkAuth = networkComponentScore(features);
  const activityPattern = activityComponentScore(features);
  const contentQuality = contentComponentScore(features);
  const identitySecurity = identitySecurityComponentScore(features);

  const score =
    0.20 * accountAge +
    0.15 * profileCompleteness +
    0.15 * networkAuth +
    0.15 * activityPattern +
    0.15 * contentQuality +
    0.20 * identitySecurity;

  return Math.round(clamp(score, 0, 100) * 100) / 100;
}

export function classifyFakeScore(score: number): FakeClassification {
  if (score > 80) return "GENUINE";
  if (score >= 60) return "LOW_RISK";
  if (score >= 40) return "SUSPICIOUS";
  return "FAKE";
}

