import { Router } from "express";
import { authMiddleware, requireRole, type AuthRequest } from "../auth/middleware.js";
import { prisma } from "../database/client.js";
import { getChainExplorerData } from "../services/blockchainService.js";

const router = Router();
router.use(authMiddleware);
// Analytics and admin endpoints are restricted to SUPER_ADMIN and ANALYST roles.
router.use(requireRole("SUPER_ADMIN", "ANALYST"));

router.get("/stats", async (_req, res) => {
  const [users, accounts, alerts, genuine, lowRisk, suspicious, fake] =
    await Promise.all([
      prisma.user.count(),
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

router.get("/accounts", async (req, res) => {
  const { risk, limit = "50" } = req.query;
  const take = Math.min(parseInt(limit as string, 10) || 50, 100);
  const where: {
    fakeTrustScore?: { lt?: number; gte?: number; lte?: number; gt?: number };
  } = {};
  if (risk === "fake") where.fakeTrustScore = { lt: 40 };
  else if (risk === "suspicious")
    where.fakeTrustScore = { gte: 40, lt: 60 };
  else if (risk === "low")
    where.fakeTrustScore = { gte: 60, lte: 80 };
  else if (risk === "genuine")
    where.fakeTrustScore = { gt: 80 };

  const accounts = await prisma.socialAccount.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(accounts);
});

router.get("/alerts", async (req, res) => {
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

router.get("/activity", async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    take: 200,
    orderBy: { loginTime: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(logs);
});

router.get("/blockchain", (_req, res) => {
  res.json(getChainExplorerData());
});

router.get("/accounts/:id", async (req: AuthRequest, res) => {
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

export default router;
