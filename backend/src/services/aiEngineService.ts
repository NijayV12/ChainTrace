import type { ActivityLog, SocialAccount } from "@prisma/client";
import {
  buildAccountInvestigationSummary as buildSharedAccountInvestigationSummary,
  evaluateAccountRiskLocal,
  parseLinkedProfiles,
  type AccountInvestigationSummary,
  type EvaluateAccountRiskRequest,
  type EvaluateAccountRiskResponse,
  type LinkedProfile,
  type SummarizeAccountInvestigationRequest,
  type SummarizeAccountInvestigationResponse,
} from "chaintrace-ai-engine";
import { config } from "../config/index.js";

export type AccountRiskEvaluation = EvaluateAccountRiskResponse;

function shouldUseRuntime(): boolean {
  return config.aiEngine.url.length > 0;
}

function toRuntimeActivityLogs(activityLogs: ActivityLog[]) {
  return activityLogs.map((log) => ({
    ipAddress: log.ipAddress,
    device: log.device,
    loginTime: log.loginTime.toISOString(),
  }));
}

async function postToAIEngine<TRequest, TResponse>(
  path: string,
  payload: TRequest
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.aiEngine.timeoutMs);

  try {
    const response = await fetch(`${config.aiEngine.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error((data.error as string | undefined) ?? "AI engine request failed");
    }
    return data as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function evaluateAccountRisk(params: {
  account: Pick<
    SocialAccount,
    | "accountAge"
    | "profileComplete"
    | "followers"
    | "following"
    | "posts"
    | "handle"
    | "createdAt"
  >;
  activityLogs: ActivityLog[];
  duplicateIdentityScore: number;
  linkedProfileCount?: number;
}): Promise<AccountRiskEvaluation> {
  if (shouldUseRuntime()) {
    const payload: EvaluateAccountRiskRequest = {
      account: {
        accountAge: params.account.accountAge,
        profileComplete: params.account.profileComplete,
        followers: params.account.followers,
        following: params.account.following,
        posts: params.account.posts,
        handle: params.account.handle,
        createdAt: params.account.createdAt.toISOString(),
      },
      activityLogs: toRuntimeActivityLogs(params.activityLogs),
      duplicateIdentityScore: params.duplicateIdentityScore,
      linkedProfileCount: params.linkedProfileCount,
    };
    return postToAIEngine<EvaluateAccountRiskRequest, EvaluateAccountRiskResponse>(
      "/v1/evaluate-account",
      payload
    );
  }

  return evaluateAccountRiskLocal({
    account: {
      accountAge: params.account.accountAge,
      profileComplete: params.account.profileComplete,
      followers: params.account.followers,
      following: params.account.following,
      posts: params.account.posts,
      handle: params.account.handle,
      createdAt: params.account.createdAt,
    },
    activityLogs: params.activityLogs,
    duplicateIdentityScore: params.duplicateIdentityScore,
    linkedProfileCount: params.linkedProfileCount,
  });
}

export async function summarizeAccountInvestigation(
  account: Pick<
    SocialAccount,
    | "accountAge"
    | "profileComplete"
    | "followers"
    | "following"
    | "posts"
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
    | "handle"
    | "createdAt"
  >,
  activityLogs: ActivityLog[]
): Promise<AccountInvestigationSummary> {
  if (shouldUseRuntime()) {
    const payload: SummarizeAccountInvestigationRequest = {
      account: {
        accountAge: account.accountAge,
        profileComplete: account.profileComplete,
        followers: account.followers,
        following: account.following,
        posts: account.posts,
        trustScore: account.trustScore,
        fakeTrustScore: account.fakeTrustScore,
        fakeClassification: account.fakeClassification,
        mlFraudProbability: account.mlFraudProbability,
        mlRiskBand: account.mlRiskBand,
        mlConfidence: account.mlConfidence,
        mlTopFeatures: account.mlTopFeatures,
        anomalyScore: account.anomalyScore,
        anomalyBand: account.anomalyBand,
        anomalyTopSignals: account.anomalyTopSignals,
        fusedTrustScore: account.fusedTrustScore,
        fusedClassification: account.fusedClassification,
        duplicateIdentityScore: account.duplicateIdentityScore,
        similarAccountsDetected: account.similarAccountsDetected,
        handle: account.handle,
        createdAt: account.createdAt.toISOString(),
      },
      activityLogs: toRuntimeActivityLogs(activityLogs),
    };
    return postToAIEngine<
      SummarizeAccountInvestigationRequest,
      SummarizeAccountInvestigationResponse
    >("/v1/summarize-account", payload);
  }

  return buildSharedAccountInvestigationSummary(
    {
      ...account,
      accountAge: account.accountAge,
    },
    activityLogs
  );
}

export function getLinkedProfiles(similarAccountsDetected?: string | null): LinkedProfile[] {
  return parseLinkedProfiles(similarAccountsDetected);
}
