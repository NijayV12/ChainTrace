import { Router, type Response } from "express";
import { body, param } from "express-validator";
import { authMiddleware, requireRole, type AuthRequest } from "../auth/middleware.js";
import { prisma } from "../database/client.js";
import { getChainExplorerData } from "../services/blockchainService.js";
import { register } from "../auth/service.js";
import { handleValidation } from "../middleware/validate.js";
import {
  changeUserRole,
  resetUserPassword,
  setUserActiveState,
} from "../services/adminUserService.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("SUPER_ADMIN", "ANALYST"));

router.get("/stats", async (_req, res: Response) => {
  const [users, accounts, alerts, genuine, lowRisk, suspicious, fake] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.socialAccount.count(),
      prisma.alert.count(),
      prisma.socialAccount.count({
        where: { fakeTrustScore: { gt: 80 } },
      }),
      prisma.socialAccount.count({
        where: { fakeTrustScore: { gte: 60, lte: 80 } },
      }),
      prisma.socialAccount.count({
        where: { fakeTrustScore: { gte: 40, lt: 60 } },
      }),
      prisma.socialAccount.count({
        where: { fakeTrustScore: { lt: 40 } },
      }),
    ]);

  res.json({
    users,
    accounts,
    alerts,
    byClassification: { genuine, lowRisk, suspicious, fake },
  });
});

router.get("/accounts", async (req: AuthRequest, res: Response) => {
  const { risk, limit = "50" } = req.query;
  const take = Math.min(parseInt(limit as string, 10) || 50, 100);
  const where: {
    fakeTrustScore?: { lt?: number; gte?: number; lte?: number; gt?: number };
  } = {};

  if (risk === "fake") where.fakeTrustScore = { lt: 40 };
  else if (risk === "suspicious") where.fakeTrustScore = { gte: 40, lt: 60 };
  else if (risk === "low") where.fakeTrustScore = { gte: 60, lte: 80 };
  else if (risk === "genuine") where.fakeTrustScore = { gt: 80 };

  const accounts = await prisma.socialAccount.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(accounts);
});

router.get("/alerts", async (_req, res: Response) => {
  const alerts = await prisma.alert.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      account: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  res.json(alerts);
});

router.get("/activity", async (_req, res: Response) => {
  const logs = await prisma.activityLog.findMany({
    take: 200,
    orderBy: { loginTime: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(logs);
});

router.get("/blockchain", (_req, res: Response) => {
  res.json(getChainExplorerData());
});

router.get("/accounts/:id", async (req: AuthRequest, res: Response) => {
  const account = await prisma.socialAccount.findUnique({
    where: { id: req.params.id },
    include: { user: true, alerts: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(account);
});

router.get("/users", requireRole("SUPER_ADMIN"), async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      activityLogs: {
        orderBy: { loginTime: "desc" },
        take: 1,
        select: {
          loginTime: true,
          ipAddress: true,
          device: true,
        },
      },
    },
  });

  res.json(
    users.map((user) => ({
      ...user,
      lastLogin: user.activityLogs[0] ?? null,
      activityLogs: undefined,
    }))
  );
});

router.get("/audit-logs", requireRole("SUPER_ADMIN"), async (_req, res: Response) => {
  const logs = await prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
      targetUser: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  res.json(logs);
});

router.post(
  "/users",
  requireRole("SUPER_ADMIN"),
  [
    body("name").trim().notEmpty().withMessage("Name required"),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional().trim(),
    body("password").isLength({ min: 8 }).withMessage("Password min 8 chars"),
    body("role")
      .isIn(["INVESTIGATOR", "ANALYST", "SUPER_ADMIN"])
      .withMessage("Invalid role"),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const result = await register({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: req.body.role,
    });

    await prisma.adminActionLog.create({
      data: {
        actorId: req.user!.userId,
        targetUserId: (result.user as { id: string }).id,
        action: "USER_CREATED",
        metadata: JSON.stringify({ role: req.body.role }),
      },
    });

    res.status(201).json(result);
  }
);

router.patch(
  "/users/:id/role",
  requireRole("SUPER_ADMIN"),
  [
    param("id").isUUID(),
    body("role")
      .isIn(["INVESTIGATOR", "ANALYST", "SUPER_ADMIN"])
      .withMessage("Invalid role"),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const user = await changeUserRole({
      actorId: req.user!.userId,
      targetUserId: req.params.id,
      role: req.body.role,
    });
    res.json(user);
  }
);

router.patch(
  "/users/:id/status",
  requireRole("SUPER_ADMIN"),
  [param("id").isUUID(), body("isActive").isBoolean()],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const user = await setUserActiveState({
      actorId: req.user!.userId,
      targetUserId: req.params.id,
      isActive: req.body.isActive,
    });
    res.json(user);
  }
);

router.patch(
  "/users/:id/password",
  requireRole("SUPER_ADMIN"),
  [param("id").isUUID(), body("password").isLength({ min: 8 })],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const user = await resetUserPassword({
      actorId: req.user!.userId,
      targetUserId: req.params.id,
      password: req.body.password,
    });
    res.json(user);
  }
);

export default router;
