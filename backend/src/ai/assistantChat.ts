import { config } from "../config/index.js";
import { prisma } from "../database/client.js";
import { ANALYST_ASSISTANT_SYSTEM_PROMPT, buildAssistantPrompt } from "./prompts.js";
import { createLLMClient, isLLMEnabled } from "./llmClient.js";

const MAX_HISTORY_MESSAGES = 12;

export interface AssistantChatReply {
  reply: string;
  summary: string;
  contextLabel: string;
  conversationId: string;
}

export interface AssistantHistoryItem {
  id: string;
  role: string;
  content: string;
  meta: string | null;
  createdAt: Date;
}

export interface AssistantHistoryReply {
  conversationId: string;
  contextLabel: string;
  scope: "GLOBAL" | "CASE";
  caseId: string | null;
  messages: AssistantHistoryItem[];
}

function assistantError(message: string, statusCode: number): never {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  throw err;
}

async function getCaseContext(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
      accounts: {
        include: {
          account: {
            select: {
              id: true,
              platform: true,
              handle: true,
              trustScore: true,
              fakeTrustScore: true,
              fakeClassification: true,
              blockchainHash: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      reports: {
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          summary: true,
          recommendation: true,
          createdAt: true,
          author: { select: { name: true, email: true } },
        },
      },
      decisions: {
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          riskRating: true,
          decision: true,
          rationale: true,
          createdAt: true,
          analyst: { select: { name: true, email: true } },
        },
      },
      notes: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          body: true,
          createdAt: true,
          author: { select: { name: true, email: true } },
        },
      },
    },
  });
}

async function getOrCreateConversation(params: { userId: string; caseId?: string }) {
  const scope = params.caseId ? "CASE" : "GLOBAL";
  const contextKey = params.caseId ? `CASE:${params.caseId}` : "GLOBAL";
  const conversation = await prisma.assistantConversation.upsert({
    where: {
      userId_contextKey: {
        userId: params.userId,
        contextKey,
      },
    },
    update: {
      contextKey,
      scope,
      label: params.caseId ? "Case assistant" : "Operations assistant",
    },
    create: {
      userId: params.userId,
      caseId: params.caseId ?? null,
      contextKey,
      scope,
      label: params.caseId ? "Case assistant" : "Operations assistant",
    },
  });

  return conversation;
}

function buildContextLabel(params: {
  recentAlerts: number;
  recentCases: number;
  latestAccounts: number;
  caseTitle?: string | null;
  caseAccounts?: number;
}) {
  if (params.caseTitle) {
    return `${params.caseTitle} | ${params.caseAccounts ?? 0} linked accounts | ${params.recentAlerts} recent alerts`;
  }

  return `${params.recentAlerts} alerts, ${params.recentCases} cases, ${params.latestAccounts} recent accounts`;
}

export async function getAssistantHistory(params: {
  userId: string;
  caseId?: string;
}): Promise<AssistantHistoryReply> {
  const caseContext = params.caseId ? await getCaseContext(params.caseId) : null;
  if (params.caseId && !caseContext) {
    assistantError("Case not found for assistant context.", 404);
  }

  const conversation = await getOrCreateConversation(params);
  const messages = await prisma.assistantMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY_MESSAGES,
  });

  const [recentAlerts, recentCases, latestAccounts] = await Promise.all([
    prisma.alert.count(),
    prisma.case.count(),
    prisma.socialAccount.count(),
  ]);

  return {
    conversationId: conversation.id,
    contextLabel: buildContextLabel({
      recentAlerts,
      recentCases,
      latestAccounts,
      caseTitle: caseContext?.title,
      caseAccounts: caseContext?.accounts.length,
    }),
    scope: params.caseId ? "CASE" : "GLOBAL",
    caseId: params.caseId ?? null,
    messages,
  };
}

export async function generateAssistantReply(params: {
  userId: string;
  message: string;
  role: string;
  caseId?: string;
}): Promise<AssistantChatReply> {
  const caseContext = params.caseId ? await getCaseContext(params.caseId) : null;
  if (params.caseId && !caseContext) {
    assistantError("Case not found for assistant context.", 404);
  }

  const conversation = await getOrCreateConversation({
    userId: params.userId,
    caseId: params.caseId,
  });

  const [recentAlerts, recentCases, latestAccounts, history] = await Promise.all([
    prisma.alert.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          select: {
            platform: true,
            handle: true,
            fakeClassification: true,
            fakeTrustScore: true,
          },
        },
      },
    }),
    prisma.case.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        accounts: {
          include: {
            account: {
              select: {
                platform: true,
                handle: true,
                fakeClassification: true,
                fakeTrustScore: true,
              },
            },
          },
        },
      },
    }),
    prisma.socialAccount.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        platform: true,
        handle: true,
        fakeClassification: true,
        fakeTrustScore: true,
        trustScore: true,
      },
    }),
    prisma.assistantMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    }),
  ]);

  const contextLabel = buildContextLabel({
    recentAlerts: recentAlerts.length,
    recentCases: recentCases.length,
    latestAccounts: latestAccounts.length,
    caseTitle: caseContext?.title,
    caseAccounts: caseContext?.accounts.length,
  });

  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: params.message,
    },
  });

  if (!isLLMEnabled()) {
    const fallback = {
      reply:
        "LLM assistance is disabled right now. Enable `LLM_REASONING_ENABLED=true` and provide `LLM_API_KEY` or another supported provider key to use the analyst assistant.",
      summary:
        "Assistant unavailable because LLM reasoning is disabled or the API key is missing.",
      contextLabel,
      conversationId: conversation.id,
    };

    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: fallback.reply,
        meta: `${fallback.summary} | ${contextLabel}`,
      },
    });

    return fallback;
  }

  const openai = createLLMClient();

  const caseSection = caseContext
    ? `Case context:
- Title: ${caseContext.title}
- Status: ${caseContext.status}
- Description: ${caseContext.description ?? "No description"}
- Created by: ${caseContext.createdBy?.name ?? "Unknown"} (${caseContext.createdBy?.email ?? "n/a"})
- Assigned to: ${caseContext.assignedTo?.name ?? "Unassigned"} (${caseContext.assignedTo?.email ?? "n/a"})
- Linked accounts:
${caseContext.accounts
  .map(
    ({ account }) =>
      `  - ${account.platform} @${account.handle} | base ${account.trustScore ?? "n/a"} | fake ${
        account.fakeTrustScore ?? "n/a"
      } | classification ${account.fakeClassification ?? "n/a"} | chain ${
        account.blockchainHash ?? "not anchored"
      } | owner ${account.user?.name ?? "n/a"}`
  )
  .join("\n")}
- Latest investigator reports:
${caseContext.reports.length
  ? caseContext.reports
      .map(
        (report) =>
          `  - ${report.author?.name ?? "Unknown"} on ${report.createdAt.toISOString()}: ${report.summary} | recommendation ${report.recommendation}`
      )
      .join("\n")
  : "  - none"}
- Latest analyst decisions:
${caseContext.decisions.length
  ? caseContext.decisions
      .map(
        (decision) =>
          `  - ${decision.analyst?.name ?? "Unknown"} on ${decision.createdAt.toISOString()}: ${decision.riskRating} | ${decision.decision} | rationale ${decision.rationale}`
      )
      .join("\n")
  : "  - none"}
- Latest case notes:
${caseContext.notes.length
  ? caseContext.notes
      .map(
        (note) =>
          `  - ${note.author?.name ?? "Unknown"} on ${note.createdAt.toISOString()}: ${note.body}`
      )
      .join("\n")
  : "  - none"}`
    : "Case context: none";

  const historySection = history.length
    ? history
        .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
        .join("\n")
    : "No prior conversation in this scope.";

  const prompt = buildAssistantPrompt({
    role: params.role,
    scope: params.caseId ? "CASE" : "GLOBAL",
    userQuestion: params.message,
    historySection,
    alertsSection: recentAlerts
      .map(
        (alert) =>
          `- ${alert.riskLevel}: ${alert.account?.platform ?? "unknown"} @${
            alert.account?.handle ?? "unknown"
          } | classification ${alert.account?.fakeClassification ?? "n/a"} | fake score ${
            alert.account?.fakeTrustScore ?? "n/a"
          } | reason ${alert.reason}`
      )
      .join("\n"),
    casesSection: recentCases
      .map(
        (caseItem) =>
          `- ${caseItem.title} (${caseItem.status}) with ${caseItem.accounts.length} linked account(s)`
      )
      .join("\n"),
    accountsSection: latestAccounts
      .map(
        (account) =>
          `- ${account.platform} @${account.handle} | base ${account.trustScore ?? "n/a"} | fake ${
            account.fakeTrustScore ?? "n/a"
          } | classification ${account.fakeClassification ?? "n/a"}`
      )
      .join("\n"),
    caseSection,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        { role: "system", content: ANALYST_ASSISTANT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      const fallback = {
        reply: "The assistant could not produce a response at this time.",
        summary: "No assistant output returned.",
        contextLabel,
        conversationId: conversation.id,
      };

      await prisma.assistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: fallback.reply,
          meta: `${fallback.summary} | ${contextLabel}`,
        },
      });

      return fallback;
    }

    const parsed = JSON.parse(content) as Partial<AssistantChatReply>;
    const response = {
      reply: parsed.reply ?? "The assistant could not produce a response at this time.",
      summary: parsed.summary ?? "No summary available.",
      contextLabel,
      conversationId: conversation.id,
    };

    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: response.reply,
        meta: `${response.summary} | ${contextLabel}`,
      },
    });

    return response;
  } catch {
    const fallback = {
      reply: "The assistant is temporarily unavailable. Please try again after checking the LLM configuration.",
      summary: "Assistant request failed.",
      contextLabel,
      conversationId: conversation.id,
    };

    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: fallback.reply,
        meta: `${fallback.summary} | ${contextLabel}`,
      },
    });

    return fallback;
  }
}
