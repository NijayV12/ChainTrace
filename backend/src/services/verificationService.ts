import { prisma } from "../database/client.js";
import {
  computeTrustScore,
  classifyScore,
  type ScoringInput,
  type Classification,
} from "../ai/scoring.js";
import {
  computeFakeTrustScore,
  classifyFakeScore,
} from "../ai/fakeScoring.js";
import { getLLMReasoning } from "../ai/llmReasoning.js";
import {
  hashIdentity,
  addToBlockchain,
  verifyOnChain,
} from "./blockchainService.js";
import { extractFakeFeatures } from "./fakeFeatureExtractor.js";
import { findSimilarAccounts, type SimilarAccountMatch } from "./similarAccountDetector.js";
import { logger } from "../lib/logger.js";

export interface SubmitVerificationInput {
  userId: string;
  platform: string;
  handle: string;
  accountAge: number;
  followers: number;
  following: number;
  posts: number;
  profileComplete: boolean;
}

export async function submitVerification(input: SubmitVerificationInput) {
  const account = await prisma.socialAccount.create({
    data: {
      userId: input.userId,
      platform: input.platform,
      handle: input.handle,
      accountAge: input.accountAge,
      followers: input.followers,
      following: input.following,
      posts: input.posts,
      profileComplete: input.profileComplete,
      verificationStatus: "PENDING",
    },
  });

  // Queue scoring (in production would be a job; here we do inline for simplicity)
  await processScoring(account.id);
  const updated = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: account.id },
  });
  return updated;
}

export async function processScoring(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
  });

  const similarResult = await findSimilarAccounts({
    accountId,
    userId: account.userId,
    platform: account.platform,
    handle: account.handle,
  });

  const input: ScoringInput = {
    accountAgeMonths: account.accountAge,
    profileComplete: account.profileComplete,
    followers: account.followers,
    following: account.following,
    posts: account.posts,
    duplicateIdentityScore: similarResult.duplicateIdentityScore,
    suspiciousLoginScore: 80, // placeholder: could check activity_logs
  };

  const trustScore = computeTrustScore(input);
  const classification = classifyScore(trustScore);

  const activityLogs = await prisma.activityLog.findMany({
    where: { userId: account.userId },
  });
  const fakeFeatures = extractFakeFeatures(account, activityLogs);
  const fakeTrustScore = computeFakeTrustScore(fakeFeatures);
  const fakeClassification = classifyFakeScore(fakeTrustScore);

  const identityHash = hashIdentity(account.id, account.platform, account.handle);
  const { blockHash } = addToBlockchain(identityHash, account.id);

  let llmReasoning: Awaited<ReturnType<typeof getLLMReasoning>> = null;
  try {
    llmReasoning = await getLLMReasoning({
      platform: account.platform,
      handle: account.handle,
      score: trustScore,
      classification,
      accountAgeMonths: account.accountAge,
      profileComplete: account.profileComplete,
      followers: account.followers,
      following: account.following,
      posts: account.posts,
    });
  } catch (e) {
    logger.warn("LLM reasoning failed", e);
  }

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      trustScore,
      verificationStatus: "VERIFIED",
      blockchainHash: blockHash,
      fakeTrustScore,
      fakeClassification,
      similarAccountsDetected:
        similarResult.similarAccounts.length > 0
          ? JSON.stringify(similarResult.similarAccounts)
          : null,
      duplicateIdentityScore: similarResult.duplicateIdentityScore,
      ...(llmReasoning && {
        llmReason: llmReasoning.reason,
        llmFraudLikelihood: llmReasoning.fraudLikelihood,
        llmAdminRecommendation: llmReasoning.adminRecommendation,
      }),
    },
  });

  const alertReasons: string[] = [
    `Scores – base: ${trustScore.toFixed(2)}, fake-engine: ${fakeTrustScore.toFixed(2)}. Classification: ${fakeClassification ?? classification}.`,
  ];
  if (similarResult.isSuspicious) {
    alertReasons.push(
      `Similar accounts in database: ${similarResult.similarAccounts.length} found (duplicate/similar identity signal).`
    );
  }
  if (
    classification === "SUSPICIOUS" ||
    classification === "HIGH_RISK" ||
    fakeClassification === "SUSPICIOUS" ||
    fakeClassification === "FAKE" ||
    similarResult.isSuspicious
  ) {
    await prisma.alert.create({
      data: {
        accountId,
        riskLevel: fakeClassification ?? classification,
        reason: alertReasons.join(" "),
      },
    });
  }

  logger.info(`Scoring done for account ${accountId}: ${trustScore} (${classification})`);
  return;
}

export async function getVerificationResult(accountId: string, userId: string) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) return null;
  const classification = account.trustScore != null ? classifyScore(account.trustScore) : null;
  const fakeClassification =
    account.fakeTrustScore != null
      ? classifyFakeScore(account.fakeTrustScore)
      : null;
  const onChain = account.blockchainHash
    ? verifyOnChain(
        hashIdentity(account.id, account.platform, account.handle)
      )
    : false;
  const similarAccountsDetected =
    typeof account.similarAccountsDetected === "string" && account.similarAccountsDetected
      ? (JSON.parse(account.similarAccountsDetected) as SimilarAccountMatch[])
      : null;

  return {
    ...account,
    classification: classification ?? "PENDING",
    fakeClassification: fakeClassification ?? "PENDING",
    onChain,
    similarAccountsDetected,
  };
}

export async function listUserAccounts(userId: string) {
  return prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
