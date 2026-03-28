/**
 * LLM layer: generates reason, fraud likelihood, admin recommendation.
 * NEVER used to change the computed trust score.
 */

import type { Classification } from "./scoring.js";
import { config } from "../config/index.js";
import { createLLMClient, isLLMEnabled } from "./llmClient.js";
import {
  buildFraudReasoningPrompt,
  FRAUD_REASONING_SYSTEM_PROMPT,
} from "./prompts.js";

export interface LLMReasoningResult {
  reason: string;
  fraudLikelihood: string;
  adminRecommendation: string;
}

export async function getLLMReasoning(params: {
  platform: string;
  handle: string;
  score: number;
  classification: Classification;
  accountAgeMonths: number;
  profileComplete: boolean;
  followers: number;
  following: number;
  posts: number;
}): Promise<LLMReasoningResult | null> {
  if (!isLLMEnabled()) {
    return null;
  }
  const openai = createLLMClient();
  const prompt = buildFraudReasoningPrompt(params);

  try {
    const completion = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        { role: "system", content: FRAUD_REASONING_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as LLMReasoningResult;
    return {
      reason: parsed.reason ?? "No reason provided.",
      fraudLikelihood: parsed.fraudLikelihood ?? "Unknown",
      adminRecommendation: parsed.adminRecommendation ?? "Manual review.",
    };
  } catch {
    return null;
  }
}
