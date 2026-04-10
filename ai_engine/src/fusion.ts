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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fuseRiskSignals(input: FusionInput): FusionResult {
  const deterministicRisk = 100 - clamp(input.deterministicTrustScore, 0, 100);
  const fakeEngineRisk = 100 - clamp(input.fakeEngineTrustScore, 0, 100);
  const mlRisk = clamp(input.mlAssessment.fraudProbability, 0, 1) * 100;
  const anomalyRisk = clamp(input.anomalyAssessment.anomalyScore, 0, 1) * 100;

  const fusedRiskScore =
    0.4 * deterministicRisk +
    0.25 * fakeEngineRisk +
    0.25 * mlRisk +
    0.1 * anomalyRisk;
  const fusedTrustScore = Number((100 - fusedRiskScore).toFixed(2));

  return {
    fusedRiskScore: Number(fusedRiskScore.toFixed(2)),
    fusedTrustScore,
    fusedClassification: classifyScore(fusedTrustScore),
  };
}
