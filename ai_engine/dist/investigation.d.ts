import { type FakeClassification, type FakeFeatures } from "./fakeScoring.js";
import { type Classification } from "./scoring.js";
import { type LoginActivitySignal } from "./activity.js";
import type { AnomalySignal, MLTopFeature } from "./ml.js";
export interface AccountFeatureInput {
    handle: string;
    createdAt: Date;
    profileComplete: boolean;
    followers: number;
    following: number;
    posts: number;
}
export interface AccountInvestigationInput extends AccountFeatureInput {
    accountAge: number;
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
}
export interface LinkedProfile {
    id: string;
    handle: string;
    platform: string;
    matchType: string;
    reason?: string;
}
export interface AccountInvestigationSummary {
    baseClassification: Classification | "PENDING";
    fakeProfileClassification: FakeClassification | "PENDING" | string;
    mlRiskBand: string;
    mlFraudProbability: number | null;
    mlConfidence: number | null;
    mlTopFeatures: MLTopFeature[];
    anomalyScore: number | null;
    anomalyBand: string;
    anomalyTopSignals: AnomalySignal[];
    fusedTrustScore: number | null;
    fusedClassification: string;
    riskSignals: string[];
    credibilitySignals: string[];
    loginRiskScore: number;
    linkedProfiles: LinkedProfile[];
    recommendedAction: string;
}
export declare function estimateUsernameRandomness(handle: string): number;
export declare function extractFakeFeatures(account: AccountFeatureInput, activity: LoginActivitySignal[], now?: number): FakeFeatures;
export declare function parseLinkedProfiles(raw: string | null | undefined): LinkedProfile[];
export declare function buildAccountInvestigationSummary(account: AccountInvestigationInput, activityLogs: LoginActivitySignal[]): AccountInvestigationSummary;
