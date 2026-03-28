import bcrypt from "bcryptjs";
import { prisma } from "../database/client.js";

const SALT_ROUNDS = 10;

function adminError(message: string, statusCode: number): never {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  throw err;
}

async function writeAuditLog(params: {
  actorId: string;
  targetUserId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminActionLog.create({
    data: {
      actorId: params.actorId,
      targetUserId: params.targetUserId,
      action: params.action,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function changeUserRole(params: {
  actorId: string;
  targetUserId: string;
  role: string;
}) {
  if (params.actorId === params.targetUserId) {
    adminError("You cannot change your own role.", 400);
  }

  const user = await prisma.user.update({
    where: { id: params.targetUserId },
    data: { role: params.role },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await writeAuditLog({
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    action: "ROLE_CHANGED",
    metadata: { role: params.role },
  });

  return user;
}

export async function setUserActiveState(params: {
  actorId: string;
  targetUserId: string;
  isActive: boolean;
}) {
  if (params.actorId === params.targetUserId) {
    adminError("You cannot deactivate your own account.", 400);
  }

  const user = await prisma.user.update({
    where: { id: params.targetUserId },
    data: { isActive: params.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await writeAuditLog({
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    action: params.isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    metadata: { isActive: params.isActive },
  });

  return user;
}

export async function resetUserPassword(params: {
  actorId: string;
  targetUserId: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await prisma.user.update({
    where: { id: params.targetUserId },
    data: { passwordHash },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await writeAuditLog({
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    action: "PASSWORD_RESET",
  });

  return user;
}
