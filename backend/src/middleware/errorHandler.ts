import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ error: message });
}
