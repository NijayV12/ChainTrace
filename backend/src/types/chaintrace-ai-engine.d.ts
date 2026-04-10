declare module "chaintrace-ai-engine" {
  export { classifyFakeScore, computeFakeTrustScore } from "../../../ai_engine/src/fakeScoring.js";
  export type { FakeClassification, FakeFeatures } from "../../../ai_engine/src/fakeScoring.js";

  export { classifyScore, computeTrustScore } from "../../../ai_engine/src/scoring.js";
  export type { Classification, ScoringInput } from "../../../ai_engine/src/scoring.js";

  export {
    buildAccountInvestigationSummary,
    extractFakeFeatures,
    parseLinkedProfiles,
  } from "../../../ai_engine/src/investigation.js";
  export type {
    AccountInvestigationSummary,
    LinkedProfile,
  } from "../../../ai_engine/src/investigation.js";

  export { evaluateAccountRiskLocal } from "../../../ai_engine/src/runtimeLocal.js";
  export type {
    EvaluateAccountRiskRequest,
    EvaluateAccountRiskResponse,
    SummarizeAccountInvestigationRequest,
    SummarizeAccountInvestigationResponse,
  } from "../../../ai_engine/src/runtimeContracts.js";
}
