export type MLRiskBand = "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
export type AnomalyBand = "NORMAL" | "UNUSUAL" | "SEVERE";

export interface MLFeatureInput {
  accountAgeMonths: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
  duplicateIdentityScore: number;
  suspiciousLoginScore: number;
  linkedProfileCount: number;
}

export interface MLTopFeature {
  name: string;
  impact: number;
  direction: "risk" | "protective";
  contribution: string;
}

export interface MLAssessment {
  fraudProbability: number;
  riskBand: MLRiskBand;
  confidence: number;
  topFeatures: MLTopFeature[];
}

export interface AnomalySignal {
  name: string;
  score: number;
  explanation: string;
}

export interface AnomalyAssessment {
  anomalyScore: number;
  anomalyBand: AnomalyBand;
  topSignals: AnomalySignal[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function normalizeFollowers(followers: number, following: number): number {
  if (following <= 0) return followers > 0 ? 0.2 : 0.7;
  const ratio = followers / following;
  if (ratio >= 2) return 0.15;
  if (ratio >= 1) return 0.25;
  if (ratio >= 0.5) return 0.45;
  if (ratio >= 0.25) return 0.65;
  return 0.85;
}

function normalizePosting(posts: number, accountAgeMonths: number): number {
  if (posts === 0) return 0.85;
  const postsPerMonth = posts / Math.max(accountAgeMonths, 1);
  if (postsPerMonth > 120) return 0.82;
  if (postsPerMonth > 60) return 0.66;
  if (postsPerMonth > 20) return 0.46;
  if (postsPerMonth < 0.5 && accountAgeMonths > 12) return 0.58;
  return 0.22;
}

function riskBand(probability: number): MLRiskBand {
  if (probability >= 0.85) return "CRITICAL";
  if (probability >= 0.65) return "HIGH";
  if (probability >= 0.4) return "ELEVATED";
  return "LOW";
}

function anomalyBand(score: number): AnomalyBand {
  if (score >= 0.8) return "SEVERE";
  if (score >= 0.45) return "UNUSUAL";
  return "NORMAL";
}

export function inferFraudRisk(input: MLFeatureInput): MLAssessment {
  const featureWeights = [
    {
      name: "duplicate_identity",
      value: clamp(input.duplicateIdentityScore / 100, 0, 1),
      weight: 2.2,
      direction: "risk" as const,
      contribution: "Duplicate identity overlap strongly increases fraud risk.",
    },
    {
      name: "suspicious_login",
      value: clamp(input.suspiciousLoginScore / 100, 0, 1),
      weight: 1.8,
      direction: "risk" as const,
      contribution: "Login instability suggests possible coordinated or compromised access.",
    },
    {
      name: "profile_completeness",
      value: input.profileComplete ? 0 : 1,
      weight: 1.1,
      direction: "risk" as const,
      contribution: "Incomplete profiles are more often associated with synthetic identities.",
    },
    {
      name: "network_quality",
      value: normalizeFollowers(input.followers, input.following),
      weight: 1.15,
      direction: "risk" as const,
      contribution: "Weak follower quality pushes the model toward fraud likelihood.",
    },
    {
      name: "activity_pattern",
      value: normalizePosting(input.posts, input.accountAgeMonths),
      weight: 0.9,
      direction: "risk" as const,
      contribution: "Posting behavior diverges from healthy account growth patterns.",
    },
    {
      name: "account_maturity",
      value: 1 - clamp(input.accountAgeMonths / 24, 0, 1),
      weight: 0.95,
      direction: "risk" as const,
      contribution: "New accounts have less behavioral history and higher uncertainty.",
    },
    {
      name: "linked_profiles",
      value: clamp(input.linkedProfileCount / 5, 0, 1),
      weight: 1.25,
      direction: "risk" as const,
      contribution: "More related internal profiles increase the chance of coordinated fraud.",
    },
  ];

  const linearScore =
    -1.9 +
    featureWeights.reduce((sum, feature) => sum + feature.value * feature.weight, 0);
  const fraudProbability = Number(sigmoid(linearScore).toFixed(4));
  const confidence = Number((0.5 + Math.abs(fraudProbability - 0.5)).toFixed(4));

  const topFeatures = featureWeights
    .map((feature) => ({
      name: feature.name,
      impact: Number((feature.value * feature.weight).toFixed(4)),
      direction: feature.direction,
      contribution: feature.contribution,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  return {
    fraudProbability,
    riskBand: riskBand(fraudProbability),
    confidence,
    topFeatures,
  };
}

export function inferAnomalyRisk(input: MLFeatureInput): AnomalyAssessment {
  const signals = [
    {
      name: "login_instability",
      score: clamp(input.suspiciousLoginScore / 100, 0, 1),
      explanation: "High IP or device variation makes the account behavior operationally unusual.",
    },
    {
      name: "network_imbalance",
      score: normalizeFollowers(input.followers, input.following),
      explanation: "Follower-to-following structure diverges from normal organic growth.",
    },
    {
      name: "activity_velocity",
      score: normalizePosting(input.posts, input.accountAgeMonths),
      explanation: "Posting frequency is atypical for the account age profile.",
    },
    {
      name: "identity_overlap",
      score: clamp(input.duplicateIdentityScore / 100, 0, 1),
      explanation: "Internal identity overlap is stronger than expected for independent accounts.",
    },
    {
      name: "cluster_linkage",
      score: clamp(input.linkedProfileCount / 5, 0, 1),
      explanation: "The number of linked profiles suggests cluster-style coordination.",
    },
  ];

  const anomalyScore = Number(
    (
      0.3 * signals[0].score +
      0.2 * signals[1].score +
      0.15 * signals[2].score +
      0.2 * signals[3].score +
      0.15 * signals[4].score
    ).toFixed(4)
  );

  return {
    anomalyScore,
    anomalyBand: anomalyBand(anomalyScore),
    topSignals: signals
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((signal) => ({
        name: signal.name,
        score: Number(signal.score.toFixed(4)),
        explanation: signal.explanation,
      })),
  };
}
