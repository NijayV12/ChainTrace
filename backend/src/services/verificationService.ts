import { classifyFakeScore } from "../ai/fakeScoring.js";
import { classifyScore } from "../ai/scoring.js";
import { getLLMReasoning } from "../ai/llmReasoning.js";
import { prisma } from "../database/client.js";
import { logger } from "../lib/logger.js";
import {
  addToBlockchain,
  hashIdentity,
  verifyOnChain,
} from "./blockchainService.js";
import {
  evaluateAccountRisk,
  summarizeAccountInvestigation,
} from "./aiEngineService.js";
import {
  findSimilarAccounts,
  type SimilarAccountMatch,
} from "./similarAccountDetector.js";

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

  await processScoring(account.id);
  return prisma.socialAccount.findUniqueOrThrow({
    where: { id: account.id },
  });
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

  const activityLogs = await prisma.activityLog.findMany({
    where: { userId: account.userId },
  });

  const {
    trustScore,
    classification,
    fakeTrustScore,
    fakeClassification,
    mlAssessment,
    anomalyAssessment,
    fusedTrustScore,
    fusedClassification,
  } = await evaluateAccountRisk({
    account,
    activityLogs,
    duplicateIdentityScore: similarResult.duplicateIdentityScore,
    linkedProfileCount: similarResult.similarAccounts.length,
  });

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
  } catch (error) {
    logger.warn("LLM reasoning failed", error);
  }

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      trustScore,
      verificationStatus: "VERIFIED",
      blockchainHash: blockHash,
      fakeTrustScore,
      fakeClassification,
      mlFraudProbability: mlAssessment.fraudProbability,
      mlRiskBand: mlAssessment.riskBand,
      mlConfidence: mlAssessment.confidence,
      mlTopFeatures: JSON.stringify(mlAssessment.topFeatures),
      anomalyScore: anomalyAssessment.anomalyScore,
      anomalyBand: anomalyAssessment.anomalyBand,
      anomalyTopSignals: JSON.stringify(anomalyAssessment.topSignals),
      fusedTrustScore,
      fusedClassification,
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
    `Scores - base: ${trustScore.toFixed(2)}, fake-engine: ${fakeTrustScore.toFixed(
      2
    )}, fused: ${fusedTrustScore.toFixed(2)}. ML fraud probability: ${(
      mlAssessment.fraudProbability * 100
    ).toFixed(1)}%. Anomaly score: ${(anomalyAssessment.anomalyScore * 100).toFixed(
      1
    )}%. Classification: ${fusedClassification}.`,
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
    mlAssessment.riskBand === "HIGH" ||
    mlAssessment.riskBand === "CRITICAL" ||
    anomalyAssessment.anomalyBand === "SEVERE" ||
    fusedClassification === "SUSPICIOUS" ||
    fusedClassification === "HIGH_RISK" ||
    similarResult.isSuspicious
  ) {
    await prisma.alert.create({
      data: {
        accountId,
        riskLevel: fusedClassification ?? fakeClassification ?? classification,
        reason: alertReasons.join(" "),
      },
    });
  }

  logger.info(
    `Scoring done for account ${accountId}: ${trustScore} (${classification}), ML ${(mlAssessment.fraudProbability * 100).toFixed(1)}%, fused ${fusedTrustScore} (${fusedClassification})`
  );
}

export async function getVerificationResult(accountId: string, userId: string) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) return null;

  const classification =
    account.trustScore != null ? classifyScore(account.trustScore) : null;
  const fakeClassification =
    account.fakeTrustScore != null
      ? classifyFakeScore(account.fakeTrustScore)
      : null;
  const onChain = account.blockchainHash
    ? verifyOnChain(hashIdentity(account.id, account.platform, account.handle))
    : false;
  const similarAccountsDetected =
    typeof account.similarAccountsDetected === "string" &&
    account.similarAccountsDetected
      ? (JSON.parse(account.similarAccountsDetected) as SimilarAccountMatch[])
      : null;
  const activityLogs = await prisma.activityLog.findMany({
    where: { userId: account.userId },
    orderBy: { loginTime: "desc" },
    take: 25,
  });
  const investigationSummary = await summarizeAccountInvestigation(account, activityLogs);

  return {
    ...account,
    classification: classification ?? "PENDING",
    fakeClassification: fakeClassification ?? "PENDING",
    onChain,
    similarAccountsDetected,
    investigationSummary,
  };
}

export async function listUserAccounts(userId: string) {
  return prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
