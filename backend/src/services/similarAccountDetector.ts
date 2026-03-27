/**
 * Detects similar or duplicate accounts in the database to flag suspicious identities.
 * Used to compute duplicateIdentityScore and surface "similar accounts" in results.
 */

import { prisma } from "../database/client.js";

export type SimilarAccountMatch = {
  id: string;
  platform: string;
  handle: string;
  matchType: "exact" | "similar_handle" | "same_user_platform";
  reason: string;
};

export type SimilarAccountsResult = {
  similarAccounts: SimilarAccountMatch[];
  duplicateIdentityScore: number; // 0–100: 0 = highly suspicious (exact dup), 100 = no similar
  isSuspicious: boolean;
};

function normalizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/^@/, "");
}

/** Simple similarity: same prefix or one handle contains the other (after normalize). */
function handlesSimilar(a: string, b: string): boolean {
  const na = normalizeHandle(a);
  const nb = normalizeHandle(b);
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.startsWith(nb.slice(0, 4)) || nb.startsWith(na.slice(0, 4))))
    return true;
  if (na.length >= 5 && nb.includes(na)) return true;
  if (nb.length >= 5 && na.includes(nb)) return true;
  return false;
}

/**
 * Find similar accounts in the DB for the given account.
 * - Exact: same platform + same normalized handle (different record) → duplicate identity.
 * - Similar handle: same platform + similar handle string (typos, variants).
 * - Same user, same platform: same userId has multiple accounts on same platform.
 */
export async function findSimilarAccounts(params: {
  accountId: string;
  userId: string;
  platform: string;
  handle: string;
}): Promise<SimilarAccountsResult> {
  const { accountId, userId, platform, handle } = params;
  const normalized = normalizeHandle(handle);
  const similarAccounts: SimilarAccountMatch[] = [];
  const seenIds = new Set<string>([accountId]);

  // 1) Exact match: same platform, same normalized handle, different account
  const samePlatformAll = await prisma.socialAccount.findMany({
    where: { id: { not: accountId }, platform },
    select: { id: true, platform: true, handle: true },
  });
  for (const acc of samePlatformAll) {
    if (normalizeHandle(acc.handle) !== normalized) continue;
    if (seenIds.has(acc.id)) continue;
    seenIds.add(acc.id);
    similarAccounts.push({
      id: acc.id,
      platform: acc.platform,
      handle: acc.handle,
      matchType: "exact",
      reason: "Same platform and handle already in database (possible duplicate identity).",
    });
  }

  // 2) Similar handle: same platform, different account, similar handle string (skip if exact already found)
  const hasExactMatch = similarAccounts.length > 0;
  if (!hasExactMatch) {
    for (const acc of samePlatformAll) {
      if (seenIds.has(acc.id)) continue;
      if (normalizeHandle(acc.handle) === normalized) continue; // already in exact
      if (!handlesSimilar(handle, acc.handle)) continue;
      seenIds.add(acc.id);
      similarAccounts.push({
        id: acc.id,
        platform: acc.platform,
        handle: acc.handle,
        matchType: "similar_handle",
        reason: "Similar handle on same platform (possible variant or impersonation).",
      });
    }
  }

  // 3) Same user, multiple accounts on same platform
  const sameUserSamePlatform = await prisma.socialAccount.findMany({
    where: { userId, platform, id: { not: accountId } },
    select: { id: true, platform: true, handle: true },
  });
  for (const acc of sameUserSamePlatform) {
    if (seenIds.has(acc.id)) continue;
    seenIds.add(acc.id);
    similarAccounts.push({
      id: acc.id,
      platform: acc.platform,
      handle: acc.handle,
      matchType: "same_user_platform",
      reason: "Same investigator submitted another account on this platform (multi-identity check).",
    });
  }

  // Compute duplicate identity score 0–100
  const hasExact = similarAccounts.some((s) => s.matchType === "exact");
  const hasSimilarHandle = similarAccounts.some((s) => s.matchType === "similar_handle");
  const hasSameUserPlatform = similarAccounts.some((s) => s.matchType === "same_user_platform");

  let duplicateIdentityScore = 100;
  if (hasExact) duplicateIdentityScore = Math.min(duplicateIdentityScore, 0);
  if (hasSimilarHandle) duplicateIdentityScore = Math.min(duplicateIdentityScore, 35);
  if (hasSameUserPlatform) duplicateIdentityScore = Math.min(duplicateIdentityScore, 50);

  const isSuspicious = similarAccounts.length > 0;

  return {
    similarAccounts,
    duplicateIdentityScore,
    isSuspicious,
  };
}
