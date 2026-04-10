export interface ScoringInput {
  accountAgeMonths: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
  duplicateIdentityScore: number;
  suspiciousLoginScore: number;
}

export type Classification = "GENUINE" | "SUSPICIOUS" | "HIGH_RISK";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function accountAgeScore(accountAgeMonths: number): number {
  if (accountAgeMonths <= 0) return 0;
  if (accountAgeMonths >= 24) return 100;
  return clamp((accountAgeMonths / 24) * 100, 0, 100);
}

function profileCompletenessScore(profileComplete: boolean): number {
  return profileComplete ? 100 : 0;
}

function followerRatioScore(followers: number, following: number): number {
  if (following === 0) return followers > 0 ? 100 : 50;

  const ratio = followers / following;
  if (ratio >= 2) return 100;
  if (ratio >= 1) return 82;
  if (ratio >= 0.5) return 65;
  if (ratio >= 0.2) return 42;
  return clamp(ratio * 100, 0, 25);
}

function postingPatternScore(posts: number): number {
  if (posts >= 100) return 100;
  if (posts >= 50) return 90;
  if (posts >= 20) return 80;
  if (posts >= 10) return 68;
  if (posts >= 5) return 58;
  if (posts >= 1) return 46;
  return 15;
}

function profileRiskScore(profileComplete: boolean): number {
  return profileComplete ? 0 : 70;
}

function networkRiskScore(followers: number, following: number): number {
  if (followers === 0 && following === 0) return 85;
  if (following === 0) return followers > 0 ? 10 : 75;

  const ratio = followers / following;
  if (followers < 10 && following > 200) return 85;
  if (ratio < 0.1) return 80;
  if (ratio < 0.25) return 65;
  if (ratio < 0.5) return 45;
  if (ratio > 8 && followers < 100) return 40;
  return 15;
}

function activityRiskScore(posts: number, accountAgeMonths: number): number {
  if (posts === 0) return 85;

  const postsPerMonth = posts / Math.max(accountAgeMonths, 1);
  if (postsPerMonth > 200) return 90;
  if (postsPerMonth > 100) return 70;
  if (postsPerMonth > 40) return 45;
  if (postsPerMonth < 0.5 && accountAgeMonths > 12) return 35;
  return 15;
}

export function computeTrustScore(input: ScoringInput): number {
  const duplicateRisk = clamp(input.duplicateIdentityScore, 0, 100);
  const loginRisk = clamp(input.suspiciousLoginScore, 0, 100);
  const networkRisk = networkRiskScore(input.followers, input.following);
  const activityRisk = activityRiskScore(input.posts, input.accountAgeMonths);

  const credibilityBoost =
    0.22 * accountAgeScore(input.accountAgeMonths) +
    0.2 * profileCompletenessScore(input.profileComplete) +
    0.18 * followerRatioScore(input.followers, input.following) +
    0.12 * postingPatternScore(input.posts);

  const riskPenalty =
    0.16 * duplicateRisk +
    0.16 * loginRisk +
    0.08 * profileRiskScore(input.profileComplete) +
    0.05 * networkRisk +
    0.03 * activityRisk;

  let interactionPenalty = 0;

  if (
    input.accountAgeMonths < 3 &&
    (!input.profileComplete || input.posts < 5) &&
    duplicateRisk >= 60
  ) {
    interactionPenalty += 12;
  }

  if (loginRisk >= 70 && networkRisk >= 65) {
    interactionPenalty += 8;
  }

  if (activityRisk >= 70 && duplicateRisk >= 70) {
    interactionPenalty += 6;
  }

  const score = 45 + credibilityBoost - riskPenalty - interactionPenalty;
  return Math.round(clamp(score, 0, 100) * 100) / 100;
}

export function classifyScore(score: number): Classification {
  if (score >= 75) return "GENUINE";
  if (score >= 45) return "SUSPICIOUS";
  return "HIGH_RISK";
}
