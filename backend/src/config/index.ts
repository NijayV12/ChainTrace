import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "chaintrace-dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  database: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/chaintrace?schema=public",
  },
  blockchain: {
    dataDir: process.env.BLOCKCHAIN_DATA_DIR ?? "./data/chain",
  },
  llm: {
    apiKey:
      process.env.LLM_API_KEY ??
      process.env.GROQ_API_KEY ??
      process.env.OPENAI_API_KEY ??
      "",
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.LLM_MODEL ?? "gpt-4o-mini",
    reasoningEnabled: process.env.LLM_REASONING_ENABLED === "true",
  },
  log: {
    level: process.env.LOG_LEVEL ?? "info",
  },
} as const;
