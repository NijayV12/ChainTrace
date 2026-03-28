import type { Classification } from "./scoring.js";

interface ReasoningPromptParams {
  platform: string;
  handle: string;
  score: number;
  classification: Classification;
  accountAgeMonths: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
}

interface AssistantPromptParams {
  role: string;
  userQuestion: string;
  scope: "GLOBAL" | "CASE";
  historySection: string;
  alertsSection: string;
  casesSection: string;
  accountsSection: string;
  caseSection: string;
}

export const FRAUD_REASONING_SYSTEM_PROMPT = `You are ChainTrace Fraud Reasoning Assistant.
You explain already-computed deterministic fraud and trust outcomes for internal review teams.
You must never change the score, invent new inputs, or claim to make final enforcement decisions.
Keep the output short, operational, and grounded in the supplied metrics.
Reply in JSON only.`;

export const ANALYST_ASSISTANT_SYSTEM_PROMPT = `You are ChainTrace Analyst Assistant, a careful fraud-review aide for internal investigators, analysts, and super admins.
You must never claim to change trust scores, overwrite deterministic outputs, or approve final enforcement decisions.
You may summarize risk, suggest next investigative actions, explain likely concerns, summarize a case, and point out what to review next.
If a case context is provided, ground the answer in that case first.
Be concise, operational, and professional.
Reply in JSON with exactly these keys:
- reply: 2-6 sentence answer to the user
- summary: one short line summarizing the recommendation`;

export function buildFraudReasoningPrompt(params: ReasoningPromptParams) {
  return `Verified account metrics:
Platform: ${params.platform}
Handle: ${params.handle}
Trust score: ${params.score} (classification: ${params.classification})
Account age: ${params.accountAgeMonths} months
Profile complete: ${params.profileComplete}
Followers: ${params.followers}
Following: ${params.following}
Posts: ${params.posts}

Respond in JSON only with exactly these keys:
- reason: brief explanation of why this score and classification were assigned
- fraudLikelihood: concise description of likely fraud risk
- adminRecommendation: recommended operational action for the admin team`;
}

export function buildAssistantPrompt(params: AssistantPromptParams) {
  return `User role: ${params.role}
Conversation scope: ${params.scope}
User question: ${params.userQuestion}

Prior conversation:
${params.historySection}

Recent alerts:
${params.alertsSection}

Recent cases:
${params.casesSection}

Recent accounts:
${params.accountsSection}

${params.caseSection}`;
}
