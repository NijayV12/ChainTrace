import { classifyScore } from "./scoring.js";
import type { AnomalyAssessment, MLAssessment } from "./ml.js";
export interface FusionInput {
    deterministicTrustScore: number;
    fakeEngineTrustScore: number;
    mlAssessment: MLAssessment;
    anomalyAssessment: AnomalyAssessment;
}
export interface FusionResult {
    fusedTrustScore: number;
    fusedClassification: ReturnType<typeof classifyScore>;
    fusedRiskScore: number;
}
export declare function fuseRiskSignals(input: FusionInput): FusionResult;
