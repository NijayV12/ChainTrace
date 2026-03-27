/**
 * Deterministic trust score – never use LLM to change this value.
 * Formula:
 * score = 0.25 * account_age_score
 *       + 0.20 * profile_completeness_score
 *       + 0.20 * follower_ratio_score
 *       + 0.15 * posting_pattern_score
 *       + 0.10 * duplicate_identity_score
 *       + 0.10 * suspicious_login_score
 */

export interface ScoringInput {
  accountAgeMonths: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
  duplicateIdentityScore: number; // 0–100, from external check
  suspiciousLoginScore: number;    // 0–100, from activity
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 0–100: newer accounts score lower. 24+ months = 100. */
function accountAgeScore(accountAgeMonths: number): number {
  if (accountAgeMonths <= 0) return 0;
  if (accountAgeMonths >= 24) return 100;
  return clamp((accountAgeMonths / 24) * 100, 0, 100);
}

/** 0 or 100 */
function profileCompletenessScore(profileComplete: boolean): number {
  return profileComplete ? 100 : 0;
}

/** 0–100: healthy ratio (followers/following) scores higher. Avoid division by zero. */
function followerRatioScore(followers: number, following: number): number {
  if (following === 0) return followers > 0 ? 100 : 50;
  const ratio = followers / following;
  if (ratio >= 2) return 100;
  if (ratio >= 1) return 80;
  if (ratio >= 0.5) return 60;
  if (ratio >= 0.2) return 40;
  return clamp(ratio * 100, 0, 30);
}

/** 0–100: some posts = good; zero or extreme can be suspicious */
function postingPatternScore(posts: number): number {
  if (posts >= 100) return 100;
  if (posts >= 50) return 90;
  if (posts >= 20) return 80;
  if (posts >= 10) return 70;
  if (posts >= 5) return 60;
  if (posts >= 1) return 50;
  return 20;
}

export function computeTrustScore(input: ScoringInput): number {
  const a = 0.25 * accountAgeScore(input.accountAgeMonths);
  const b = 0.2 * profileCompletenessScore(input.profileComplete);
  const c = 0.2 * followerRatioScore(input.followers, input.following);
  const d = 0.15 * postingPatternScore(input.posts);
  const e = 0.1 * clamp(input.duplicateIdentityScore, 0, 100);
  const f = 0.1 * clamp(input.suspiciousLoginScore, 0, 100);
  const score = a + b + c + d + e + f;
  return Math.round(clamp(score, 0, 100) * 100) / 100;
}

export type Classification = "GENUINE" | "SUSPICIOUS" | "HIGH_RISK";

export function classifyScore(score: number): Classification {
  if (score > 75) return "GENUINE";
  if (score >= 50) return "SUSPICIOUS";
  return "HIGH_RISK";
}
