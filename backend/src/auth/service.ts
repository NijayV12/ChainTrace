import bcrypt from "bcryptjs";
import { prisma } from "../database/client.js";
import { signToken } from "./jwt.js";
import { logger } from "../lib/logger.js";

const SALT_ROUNDS = 10;

export async function register(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    const err = new Error("Email already registered") as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
      passwordHash,
      // Default newly created accounts to INVESTIGATOR role.
      // Public self-registration is disabled at the routing layer; this is used by internal provisioning only.
      role: (params.role as any) ?? "INVESTIGATOR",
    },
  });
  logger.info(`User registered: ${user.email}`);
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}

export async function login(
  email: string,
  password: string,
  meta?: { ip?: string; device?: string }
) {
  const user = await prisma.user.findUnique({ where: { email } });
  const badCreds = (): never => {
    const err = new Error("Invalid email or password") as Error & { statusCode?: number };
    err.statusCode = 401;
    throw err;
  };
  if (!user) return badCreds();
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return badCreds();
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      loginTime: new Date(),
      ipAddress: meta?.ip ?? null,
      device: meta?.device ?? null,
    },
  });
  logger.info(`User logged in: ${user.email}`);
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}
