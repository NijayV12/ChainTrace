/**
 * LLM layer: generates reason, fraud likelihood, admin recommendation.
 * NEVER used to change the computed trust score.
 */

import OpenAI from "openai";
import { config } from "../config/index.js";
import type { Classification } from "./scoring.js";

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
  if (!config.llm.reasoningEnabled || !config.llm.apiKey) {
    return null;
  }
  const openai = new OpenAI({ apiKey: config.llm.apiKey });
  const prompt = `You are a fraud analyst. Based on the following verified metrics (the trust score is already computed and must NOT be changed), provide a short analysis.

Platform: ${params.platform}
Handle: ${params.handle}
Trust score: ${params.score} (classification: ${params.classification})
Account age: ${params.accountAgeMonths} months
Profile complete: ${params.profileComplete}
Followers: ${params.followers}, Following: ${params.following}, Posts: ${params.posts}

Respond in JSON only with exactly these keys (short 1-2 sentence each):
- reason: brief explanation of why this score/classification was assigned
- fraudLikelihood: description of fraud likelihood
- adminRecommendation: recommended action for admin (e.g. approve, review, flag)`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
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
