import {
  classifyFakeScore,
  type FakeClassification,
  type FakeFeatures,
} from "./fakeScoring.js";
import { classifyScore, type Classification } from "./scoring.js";
import {
  computeSuspiciousLoginScore,
  type LoginActivitySignal,
} from "./activity.js";
import type { AnomalySignal, MLTopFeature } from "./ml.js";

export interface AccountFeatureInput {
  handle: string;
  createdAt: Date;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
}

export interface AccountInvestigationInput extends AccountFeatureInput {
  accountAge: number;
  trustScore: number | null;
  fakeTrustScore: number | null;
  fakeClassification?: string | null;
  mlFraudProbability?: number | null;
  mlRiskBand?: string | null;
  mlConfidence?: number | null;
  mlTopFeatures?: string | null;
  anomalyScore?: number | null;
  anomalyBand?: string | null;
  anomalyTopSignals?: string | null;
  fusedTrustScore?: number | null;
  fusedClassification?: string | null;
  duplicateIdentityScore?: number | null;
  similarAccountsDetected?: string | null;
}

export interface LinkedProfile {
  id: string;
  handle: string;
  platform: string;
  matchType: string;
  reason?: string;
}

export interface AccountInvestigationSummary {
  baseClassification: Classification | "PENDING";
  fakeProfileClassification: FakeClassification | "PENDING" | string;
  mlRiskBand: string;
  mlFraudProbability: number | null;
  mlConfidence: number | null;
  mlTopFeatures: MLTopFeature[];
  anomalyScore: number | null;
  anomalyBand: string;
  anomalyTopSignals: AnomalySignal[];
  fusedTrustScore: number | null;
  fusedClassification: string;
  riskSignals: string[];
  credibilitySignals: string[];
  loginRiskScore: number;
  linkedProfiles: LinkedProfile[];
  recommendedAction: string;
}

function parseMLTopFeatures(raw: string | null | undefined): MLTopFeature[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseAnomalySignals(raw: string | null | undefined): AnomalySignal[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function estimateUsernameRandomness(handle: string): number {
  const normalized = handle.replace(/^@/, "");
  const letters = normalized.replace(/[^a-zA-Z]/g, "").length;
  const digits = normalized.replace(/[^0-9]/g, "").length;
  const specials = normalized.length - letters - digits;

  if (normalized.length === 0) return 50;

  const digitRatio = digits / normalized.length;
  const specialRatio = specials / normalized.length;
  const score = digitRatio * 60 + specialRatio * 40 + (letters === 0 ? 20 : 0);

  return clamp(score * 100, 0, 100);
}

export function extractFakeFeatures(
  account: AccountFeatureInput,
  activity: LoginActivitySignal[],
  now = Date.now()
): FakeFeatures {
  const createdDays = (now - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysClamp = Number.isFinite(createdDays) ? Math.max(createdDays, 0) : 0;
  const distinctIps = new Set(
    activity.map((entry) => entry.ipAddress?.trim()).filter(Boolean)
  ).size;

  return {
    accountAgeDays: daysClamp,
    profileCompletenessScore: account.profileComplete ? 100 : 40,
    usernameRandomnessScore: estimateUsernameRandomness(account.handle),
    followerFollowingRatio:
      account.following === 0
        ? account.followers > 0
          ? account.followers
          : 0
        : account.followers / account.following,
    friendRequestRate: 0,
    mutualConnectionScore: 70,
    postingFrequency: account.posts / Math.max(daysClamp > 0 ? daysClamp : 1, 1),
    loginLocationVariation: Math.min(distinctIps * 10, 100),
    activityTimePatternScore: 70,
    spamKeywordScore: 0,
    repetitiveContentScore: 0,
    duplicateIdentityFlag: false,
    multipleAccountsSameIp: distinctIps > 5,
    deviceFingerprintRisk: 20,
  };
}

export function parseLinkedProfiles(raw: string | null | undefined): LinkedProfile[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildAccountInvestigationSummary(
  account: AccountInvestigationInput,
  activityLogs: LoginActivitySignal[]
): AccountInvestigationSummary {
  const riskSignals: string[] = [];
  const credibilitySignals: string[] = [];
  const linkedProfiles = parseLinkedProfiles(account.similarAccountsDetected);
  const mlTopFeatures = parseMLTopFeatures(account.mlTopFeatures);
  const anomalyTopSignals = parseAnomalySignals(account.anomalyTopSignals);
  const loginRisk = computeSuspiciousLoginScore(activityLogs);

  if (account.accountAge >= 24) credibilitySignals.push("Long account age improves trust.");
  else if (account.accountAge < 3) riskSignals.push("Very new account age increases fraud risk.");

  if (account.profileComplete) credibilitySignals.push("Profile appears complete.");
  else riskSignals.push("Incomplete profile reduces authenticity confidence.");

  if (account.following > 0 && account.followers / account.following >= 1) {
    credibilitySignals.push("Follower-to-following ratio looks relatively healthy.");
  } else if (account.following > 0 && account.followers / account.following < 0.25) {
    riskSignals.push("Weak follower ratio suggests inorganic or low-trust activity.");
  }

  if (account.posts === 0) riskSignals.push("No posting history available for corroboration.");
  else if (account.posts >= 50) credibilitySignals.push("Posting history is substantial enough for review.");

  if ((account.duplicateIdentityScore ?? 0) >= 75) {
    riskSignals.push("Strong duplicate or impersonation signal detected.");
  } else if ((account.duplicateIdentityScore ?? 0) >= 45) {
    riskSignals.push("Moderate duplicate identity overlap detected.");
  }

  if (loginRisk >= 70) riskSignals.push("Login activity pattern is operationally suspicious.");
  else if (loginRisk <= 30) credibilitySignals.push("Login activity pattern looks relatively stable.");

  if (linkedProfiles.length > 0) {
    riskSignals.push(`${linkedProfiles.length} related profile link(s) found in internal records.`);
  }

  if ((account.mlFraudProbability ?? 0) >= 0.8) {
    riskSignals.push("ML fraud model marked this account as high-probability synthetic or malicious.");
  } else if ((account.mlFraudProbability ?? 0) >= 0.45) {
    riskSignals.push("ML fraud model detected elevated anomaly patterns.");
  }

  if ((account.fusedTrustScore ?? 100) >= 75) {
    credibilitySignals.push("Fused risk model still rates this profile as relatively trustworthy.");
  } else if ((account.fusedTrustScore ?? 100) < 45) {
    riskSignals.push("Combined scoring engines converge on high-risk behavior.");
  }

  if ((account.anomalyScore ?? 0) >= 0.8) {
    riskSignals.push("Anomaly detector marked this account as severely atypical.");
  } else if ((account.anomalyScore ?? 0) >= 0.45) {
    riskSignals.push("Anomaly detector found unusual behavioral patterns.");
  }

  return {
    baseClassification:
      account.trustScore != null ? classifyScore(account.trustScore) : "PENDING",
    fakeProfileClassification:
      account.fakeTrustScore != null
        ? classifyFakeScore(account.fakeTrustScore)
        : account.fakeClassification ?? "PENDING",
    mlRiskBand: account.mlRiskBand ?? "PENDING",
    mlFraudProbability: account.mlFraudProbability ?? null,
    mlConfidence: account.mlConfidence ?? null,
    mlTopFeatures,
    anomalyScore: account.anomalyScore ?? null,
    anomalyBand: account.anomalyBand ?? "PENDING",
    anomalyTopSignals,
    fusedTrustScore: account.fusedTrustScore ?? null,
    fusedClassification: account.fusedClassification ?? "PENDING",
    riskSignals,
    credibilitySignals,
    loginRiskScore: loginRisk,
    linkedProfiles,
    recommendedAction:
      riskSignals.length >= 3
        ? "Escalate for analyst review and preserve evidence trail."
        : riskSignals.length > 0
        ? "Keep under monitoring and collect more corroborating evidence."
        : "Maintain routine monitoring.",
  };
}
