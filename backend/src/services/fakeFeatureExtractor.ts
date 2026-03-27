import type { SocialAccount, ActivityLog } from "@prisma/client";
import type { FakeFeatures } from "../ai/fakeScoring.js";

export function extractFakeFeatures(
  account: SocialAccount,
  activity: ActivityLog[]
): FakeFeatures {
  const now = Date.now();
  const createdDays =
    (now - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  const daysClamp = Number.isFinite(createdDays)
    ? Math.max(createdDays, 0)
    : 0;

  const distinctIps = new Set(
    activity.map((l) => (l.ipAddress ?? "").trim()).filter(Boolean)
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

    postingFrequency:
      account.posts / Math.max(daysClamp > 0 ? daysClamp : 1, 1),
    loginLocationVariation: Math.min(distinctIps * 10, 100),
    activityTimePatternScore: 70,

    spamKeywordScore: 0,
    repetitiveContentScore: 0,

    duplicateIdentityFlag: false,
    multipleAccountsSameIp: distinctIps > 5,
    deviceFingerprintRisk: 20,
  };
}

function estimateUsernameRandomness(handle: string): number {
  const normalized = handle.replace(/^@/, "");
  const letters = normalized.replace(/[^a-zA-Z]/g, "").length;
  const digits = normalized.replace(/[^0-9]/g, "").length;
  const specials = normalized.length - letters - digits;

  if (normalized.length === 0) return 50;

  const digitRatio = digits / normalized.length;
  const specialRatio = specials / normalized.length;

  const score =
    digitRatio * 60 + specialRatio * 40 + (letters === 0 ? 20 : 0);

  return Math.min(100, Math.max(0, score * 100));
}

