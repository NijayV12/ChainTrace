import { prisma } from "../database/client.js";

export type CaseStatus = "OPEN" | "MONITORING" | "ACTION_TAKEN" | "CLOSED";

export async function createCase(params: {
  title: string;
  description?: string;
  createdById: string;
  assignedToId?: string;
  accountIds?: string[];
}) {
  const { title, description, createdById, assignedToId, accountIds = [] } = params;
  const created = await prisma.case.create({
    data: {
      title,
      description: description ?? null,
      status: "OPEN",
      createdById,
      assignedToId: assignedToId ?? null,
      accounts: {
        create: accountIds.map((accountId) => ({ accountId })),
      },
    },
    include: {
      accounts: {
        include: {
          account: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return created;
}

export async function listCasesForUser(params: {
  userId: string;
  role: string;
}) {
  const { userId, role } = params;
  const where =
    role === "SUPER_ADMIN"
      ? {}
      : role === "ANALYST"
      ? {}
      : {
          OR: [{ createdById: userId }, { assignedToId: userId }],
        };

  return prisma.case.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      accounts: {
        include: {
          account: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      },
      reports: true,
      decisions: true,
    },
  });
}

export async function getCaseById(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      accounts: {
        include: {
          account: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      },
      reports: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      decisions: {
        include: {
          analyst: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      notes: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateCaseStatus(params: {
  id: string;
  status: CaseStatus;
  assignedToId?: string | null;
}) {
  const { id, status, assignedToId } = params;
  return prisma.case.update({
    where: { id },
    data: {
      status,
      assignedToId: assignedToId ?? undefined,
    },
  });
}

export async function addInvestigatorReport(params: {
  caseId: string;
  authorId: string;
  summary: string;
  recommendation: string;
}) {
  const { caseId, authorId, summary, recommendation } = params;
  return prisma.investigatorReport.create({
    data: {
      caseId,
      authorId,
      summary,
      recommendation,
    },
  });
}

export async function addAnalystDecision(params: {
  caseId: string;
  analystId: string;
  riskRating: string;
  decision: string;
  rationale: string;
}) {
  const { caseId, analystId, riskRating, decision, rationale } = params;
  return prisma.analystDecision.create({
    data: {
      caseId,
      analystId,
      riskRating,
      decision,
      rationale,
    },
  });
}

export async function addCaseNote(params: {
  caseId: string;
  authorId: string;
  body: string;
}) {
  const { caseId, authorId, body } = params;
  return prisma.caseNote.create({
    data: {
      caseId,
      authorId,
      body,
    },
  });
}

export async function draftInvestigatorReport(caseId: string) {
  const c = await getCaseById(caseId);
  if (!c) return null;
  const accounts = c.accounts.map((a) => a.account);
  const alerts = await prisma.alert.findMany({
    where: { accountId: { in: accounts.map((a) => a.id) } },
    orderBy: { createdAt: "desc" },
  });

  const summaryLines: string[] = [];
  summaryLines.push(`Case involves ${accounts.length} account(s).`);
  for (const acc of accounts) {
    summaryLines.push(
      `- ${acc.platform} @${acc.handle}: base score ${acc.trustScore ?? "n/a"}, fake engine ${acc.fakeTrustScore ?? "n/a"}, classification ${acc.fakeClassification ?? "n/a"}.`
    );
  }
  if (alerts.length > 0) {
    summaryLines.push("Recent alerts:");
    for (const alert of alerts.slice(0, 5)) {
      summaryLines.push(`- [${alert.riskLevel}] ${alert.reason}`);
    }
  }

  const recommendation =
    "Review the above accounts in detail, focusing on duplicate identity signals, high-risk scores, and any clusters of similar accounts.";

  return {
    summary: summaryLines.join("\n"),
    recommendation,
  };
}

export async function draftAnalystDecision(caseId: string) {
  const c = await getCaseById(caseId);
  if (!c) return null;
  const accounts = c.accounts.map((a) => a.account);

  const highestRisk = accounts.reduce<"GENUINE" | "SUSPICIOUS" | "HIGH_RISK">(
    (acc, cur) => {
      const cls = (cur.fakeClassification as any) || "GENUINE";
      if (cls === "HIGH_RISK") return "HIGH_RISK";
      if (cls === "SUSPICIOUS" && acc === "GENUINE") return "SUSPICIOUS";
      return acc;
    },
    "GENUINE"
  );

  const decision =
    highestRisk === "HIGH_RISK"
      ? "Treat as likely fake or malicious. Recommend strong action (account takedown request, blocking, or escalation)."
      : highestRisk === "SUSPICIOUS"
      ? "Signals are mixed. Recommend continued monitoring and additional evidence collection."
      : "Signals are consistent with genuine behaviour. No immediate action required beyond routine monitoring.";

  const rationale =
    "Decision based on the distribution of trust scores, fake-engine classifications, alerts, and duplicate identity signals for the case accounts.";

  const riskRating =
    highestRisk === "HIGH_RISK" ? "HIGH" : highestRisk === "SUSPICIOUS" ? "MEDIUM" : "LOW";

  return { riskRating, decision, rationale };
}


