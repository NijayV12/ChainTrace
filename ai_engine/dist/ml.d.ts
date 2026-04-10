export type MLRiskBand = "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
export type AnomalyBand = "NORMAL" | "UNUSUAL" | "SEVERE";
export interface MLFeatureInput {
    accountAgeMonths: number;
    profileComplete: boolean;
    followers: number;
    following: number;
    posts: number;
    duplicateIdentityScore: number;
    suspiciousLoginScore: number;
    linkedProfileCount: number;
}
export interface MLTopFeature {
    name: string;
    impact: number;
    direction: "risk" | "protective";
    contribution: string;
}
export interface MLAssessment {
    fraudProbability: number;
    riskBand: MLRiskBand;
    confidence: number;
    topFeatures: MLTopFeature[];
}
export interface AnomalySignal {
    name: string;
    score: number;
    explanation: string;
}
export interface AnomalyAssessment {
    anomalyScore: number;
    anomalyBand: AnomalyBand;
    topSignals: AnomalySignal[];
}
export declare function inferFraudRisk(input: MLFeatureInput): MLAssessment;
export declare function inferAnomalyRisk(input: MLFeatureInput): AnomalyAssessment;
