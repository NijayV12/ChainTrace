import type { AccountInvestigationSummary } from "./investigation.js";
import type { FakeFeatures } from "./fakeScoring.js";
import type { AnomalyAssessment, MLAssessment } from "./ml.js";
import type { Classification, ScoringInput } from "./scoring.js";

export interface RuntimeActivityLog {
  ipAddress?: string | null;
  device?: string | null;
  loginTime: string;
}

export interface RuntimeAccountInput {
  accountAge: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
  handle: string;
  createdAt: string;
}

export interface EvaluateAccountRiskRequest {
  account: RuntimeAccountInput;
  activityLogs: RuntimeActivityLog[];
  duplicateIdentityScore: number;
  linkedProfileCount?: number;
}

export interface EvaluateAccountRiskResponse {
  trustScore: number;
  classification: Classification;
  suspiciousLoginScore: number;
  fakeFeatures: FakeFeatures;
  fakeTrustScore: number;
  fakeClassification: string;
  mlAssessment: MLAssessment;
  anomalyAssessment: AnomalyAssessment;
  fusedTrustScore: number;
  fusedClassification: Classification;
  fusedRiskScore: number;
}

export interface SummarizeAccountInvestigationRequest {
  account: RuntimeAccountInput & {
    trustScore: number | null;
    fakeTrustScore: number | null;
    fakeClassification?: string | null;
    mlFraudProbability?: number | null;
    mlRiskBand?: string | null;
    mlConfidence?: number | null;
    mlTopFeatures?: string | null;
    anomalyScore?: number | null;
    anomalyBand?: string | null;
    anomalyTopSignals?: string | null;
    fusedTrustScore?: number | null;
    fusedClassification?: string | null;
    duplicateIdentityScore?: number | null;
    similarAccountsDetected?: string | null;
  };
  activityLogs: RuntimeActivityLog[];
}

export interface SummarizeAccountInvestigationResponse
  extends AccountInvestigationSummary {}

export interface HealthResponse {
  status: "ok";
  service: "ai_engine";
}

export type AIEngineRuntimeRequest =
  | { kind: "evaluate"; payload: EvaluateAccountRiskRequest }
  | { kind: "summarize"; payload: SummarizeAccountInvestigationRequest };

export type AIEngineRuntimeResponse =
  | EvaluateAccountRiskResponse
  | SummarizeAccountInvestigationResponse
  | HealthResponse;

export type SharedScoringInput = ScoringInput;
