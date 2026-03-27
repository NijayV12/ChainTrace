import PQueue from "p-queue";
import { processScoring } from "../services/verificationService.js";
import { logger } from "../lib/logger.js";

const queue = new PQueue({ concurrency: 2 });

export function enqueueScoring(accountId: string): void {
  queue
    .add(() => processScoring(accountId))
    .catch((err) => logger.error("Scoring job failed", { accountId, err }));
}
