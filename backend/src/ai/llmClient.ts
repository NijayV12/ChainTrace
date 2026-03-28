import OpenAI from "openai";
import { config } from "../config/index.js";

export function isLLMEnabled() {
  return config.llm.reasoningEnabled && Boolean(config.llm.apiKey);
}

export function createLLMClient() {
  return new OpenAI({
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseUrl,
  });
}
