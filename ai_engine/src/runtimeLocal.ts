import {
  computeSuspiciousLoginScore,
  type LoginActivitySignal,
} from "./activity.js";
import { computeFakeTrustScore, classifyFakeScore } from "./fakeScoring.js";
import { fuseRiskSignals } from "./fusion.js";
import { extractFakeFeatures } from "./investigation.js";
import { inferAnomalyRisk, inferFraudRisk } from "./ml.js";
import { classifyScore, computeTrustScore, type ScoringInput } from "./scoring.js";
import type {
  EvaluateAccountRiskRequest,
  EvaluateAccountRiskResponse,
} from "./runtimeContracts.js";

export function evaluateAccountRiskLocal(params: {
  account: Omit<EvaluateAccountRiskRequest["account"], "createdAt"> & { createdAt: Date };
  activityLogs: LoginActivitySignal[];
  duplicateIdentityScore: number;
  linkedProfileCount?: number;
}): EvaluateAccountRiskResponse {
  const { account, activityLogs, duplicateIdentityScore, linkedProfileCount = 0 } = params;
  const suspiciousLoginScore = computeSuspiciousLoginScore(activityLogs);

  const scoringInput: ScoringInput = {
    accountAgeMonths: account.accountAge,
    profileComplete: account.profileComplete,
    followers: account.followers,
    following: account.following,
    posts: account.posts,
    duplicateIdentityScore,
    suspiciousLoginScore,
  };

  const trustScore = computeTrustScore(scoringInput);
  const classification = classifyScore(trustScore);

  const baseFakeFeatures = extractFakeFeatures(account, activityLogs);
  const fakeFeatures = {
    ...baseFakeFeatures,
    duplicateIdentityFlag: duplicateIdentityScore >= 75,
    deviceFingerprintRisk: Math.max(baseFakeFeatures.deviceFingerprintRisk, suspiciousLoginScore),
  };
  const fakeTrustScore = computeFakeTrustScore(fakeFeatures);
  const fakeClassification = classifyFakeScore(fakeTrustScore);

  const mlAssessment = inferFraudRisk({
    accountAgeMonths: account.accountAge,
    profileComplete: account.profileComplete,
    followers: account.followers,
    following: account.following,
    posts: account.posts,
    duplicateIdentityScore,
    suspiciousLoginScore,
    linkedProfileCount,
  });
  const anomalyAssessment = inferAnomalyRisk({
    accountAgeMonths: account.accountAge,
    profileComplete: account.profileComplete,
    followers: account.followers,
    following: account.following,
    posts: account.posts,
    duplicateIdentityScore,
    suspiciousLoginScore,
    linkedProfileCount,
  });
  const fusion = fuseRiskSignals({
    deterministicTrustScore: trustScore,
    fakeEngineTrustScore: fakeTrustScore,
    mlAssessment,
    anomalyAssessment,
  });

  return {
    trustScore,
    classification,
    suspiciousLoginScore,
    fakeFeatures,
    fakeTrustScore,
    fakeClassification,
    mlAssessment,
    anomalyAssessment,
    fusedTrustScore: fusion.fusedTrustScore,
    fusedClassification: fusion.fusedClassification,
    fusedRiskScore: fusion.fusedRiskScore,
  };
}
