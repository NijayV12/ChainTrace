import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
  process.env.NODE_ENV === "development"
    ? { log: ["query", "info", "warn", "error"] }
    : undefined
);

export { prisma };
