import type { ActivityLog, SocialAccount } from "@prisma/client";
import { prisma } from "../database/client.js";
import { hashEvidenceRecord } from "./blockchainService.js";
import { getLinkedProfiles, summarizeAccountInvestigation } from "./aiEngineService.js";

type AccountWithSignals = Pick<
  SocialAccount,
  | "id"
  | "userId"
  | "platform"
  | "handle"
  | "accountAge"
  | "followers"
  | "following"
  | "posts"
  | "profileComplete"
  | "trustScore"
  | "fakeTrustScore"
  | "fakeClassification"
  | "mlFraudProbability"
  | "mlRiskBand"
  | "mlConfidence"
  | "mlTopFeatures"
  | "anomalyScore"
  | "anomalyBand"
  | "anomalyTopSignals"
  | "fusedTrustScore"
  | "fusedClassification"
  | "duplicateIdentityScore"
  | "similarAccountsDetected"
  | "blockchainHash"
  | "createdAt"
>;

export function buildAccountInvestigationSummary(
  account: AccountWithSignals,
  activityLogs: ActivityLog[]
) {
  return summarizeAccountInvestigation(account, activityLogs);
}

export async function buildCaseInvestigationIntelligence(caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      accounts: {
        include: {
          account: true,
        },
      },
      reports: true,
      decisions: true,
      notes: true,
    },
  });

  if (!c) return null;

  const accountIds = c.accounts.map((entry) => entry.account.id);
  const userIds = [...new Set(c.accounts.map((entry) => entry.account.userId))];
  const platforms = [...new Set(c.accounts.map((entry) => entry.account.platform))];

  const alerts = accountIds.length
    ? await prisma.alert.findMany({
        where: { accountId: { in: accountIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const relationships = c.accounts.flatMap((entry) => {
    const related = getLinkedProfiles(entry.account.similarAccountsDetected);
    return related.map((item) => ({
      fromAccountId: entry.account.id,
      toAccountId: item.id,
      relation: item.matchType,
      platform: item.platform,
      handle: item.handle,
    }));
  });

  const highestRiskAccount = c.accounts
    .map((entry) => entry.account)
    .sort((a, b) => {
      const aRisk = (a.mlFraudProbability ?? 0) * 100 + (100 - (a.fusedTrustScore ?? 100));
      const bRisk = (b.mlFraudProbability ?? 0) * 100 + (100 - (b.fusedTrustScore ?? 100));
      return bRisk - aRisk;
    })[0];

  const summary = {
    caseId: c.id,
    caseStatus: c.status,
    accountCount: accountIds.length,
    userCount: userIds.length,
    platforms,
    alertCount: alerts.length,
    reportCount: c.reports.length,
    decisionCount: c.decisions.length,
    noteCount: c.notes.length,
    linkedRelationshipCount: relationships.length,
    highestRiskAccount:
      highestRiskAccount == null
        ? null
        : {
            id: highestRiskAccount.id,
            platform: highestRiskAccount.platform,
            handle: highestRiskAccount.handle,
            duplicateIdentityScore: highestRiskAccount.duplicateIdentityScore ?? 0,
            trustScore: highestRiskAccount.trustScore,
            fakeTrustScore: highestRiskAccount.fakeTrustScore,
            mlFraudProbability: highestRiskAccount.mlFraudProbability,
            mlRiskBand: highestRiskAccount.mlRiskBand,
            anomalyScore: highestRiskAccount.anomalyScore,
            anomalyBand: highestRiskAccount.anomalyBand,
            fusedTrustScore: highestRiskAccount.fusedTrustScore,
            fusedClassification: highestRiskAccount.fusedClassification,
          },
  };

  const evidenceDigest = hashEvidenceRecord({
    caseId: c.id,
    status: c.status,
    accountIds,
    alertIds: alerts.map((alert) => alert.id),
    reportIds: c.reports.map((report) => report.id),
    decisionIds: c.decisions.map((decision) => decision.id),
    relationshipCount: relationships.length,
  });

  return {
    summary,
    relationships,
    recentAlerts: alerts.slice(0, 10).map((alert) => ({
      id: alert.id,
      accountId: alert.accountId,
      riskLevel: alert.riskLevel,
      reason: alert.reason,
      createdAt: alert.createdAt,
    })),
    evidenceDigest,
  };
}
