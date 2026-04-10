import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@chaintrace.io" },
    update: {
      // Ensure existing admin user is promoted to SUPER_ADMIN
      role: "SUPER_ADMIN",
      isActive: true,
      passwordHash: hash,
    },
    create: {
      name: "Super Admin Demo",
      email: "admin@chaintrace.io",
      passwordHash: hash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const investigator = await prisma.user.upsert({
    where: { email: "investigator@demo.com" },
    update: {
      role: "INVESTIGATOR",
      isActive: true,
      passwordHash: hash,
    },
    create: {
      name: "Demo Investigator",
      email: "investigator@demo.com",
      phone: "+1234567890",
      passwordHash: hash,
      role: "INVESTIGATOR",
      isActive: true,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@demo.com" },
    update: {
      role: "ANALYST",
      isActive: true,
      passwordHash: hash,
    },
    create: {
      name: "Demo Analyst",
      email: "analyst@demo.com",
      phone: "+1234567890",
      passwordHash: hash,
      role: "ANALYST",
      isActive: true,
    },
  });

  await prisma.assistantMessage.deleteMany({
    where: {
      conversation: {
        userId: { in: [admin.id, investigator.id, analyst.id] },
      },
    },
  });
  await prisma.assistantConversation.deleteMany({
    where: { userId: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.adminActionLog.deleteMany({
    where: {
      OR: [{ actorId: { in: [admin.id, investigator.id, analyst.id] } }, { targetUserId: { in: [admin.id, investigator.id, analyst.id] } }],
    },
  });
  await prisma.caseNote.deleteMany({
    where: { authorId: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.analystDecision.deleteMany({
    where: { analystId: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.investigatorReport.deleteMany({
    where: { authorId: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.caseAccount.deleteMany({
    where: {
      case: {
        createdById: { in: [admin.id, investigator.id, analyst.id] },
      },
    },
  });
  await prisma.case.deleteMany({
    where: { createdById: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.alert.deleteMany({
    where: {
      account: {
        userId: { in: [admin.id, investigator.id, analyst.id] },
      },
    },
  });
  await prisma.activityLog.deleteMany({
    where: { userId: { in: [admin.id, investigator.id, analyst.id] } },
  });
  await prisma.socialAccount.deleteMany({
    where: { userId: { in: [admin.id, investigator.id, analyst.id] } },
  });

  const demoAccounts = [
    {
      userId: admin.id,
      platform: "Instagram",
      handle: "@veridian.newsroom",
      accountAge: 84,
      followers: 48200,
      following: 620,
      posts: 1830,
      profileComplete: true,
      verificationStatus: "VERIFIED",
      trustScore: 91.2,
      fakeTrustScore: 88.4,
      fakeClassification: "GENUINE",
      mlFraudProbability: 0.04,
      mlRiskBand: "LOW",
      mlConfidence: 0.96,
      mlTopFeatures: JSON.stringify([
        {
          name: "profile_completeness",
          impact: 0.98,
          direction: "risk",
          contribution: "Complete identity signals increase confidence.",
        },
        {
          name: "network_quality",
          impact: 0.88,
          direction: "risk",
          contribution: "Healthy audience structure supports authenticity.",
        },
        {
          name: "account_maturity",
          impact: 0.91,
          direction: "risk",
          contribution: "Long account history reduces uncertainty.",
        },
      ]),
      anomalyScore: 0.09,
      anomalyBand: "NORMAL",
      anomalyTopSignals: JSON.stringify([
        {
          name: "ip_device_variation",
          score: 0.08,
          explanation: "Stable usage pattern across sessions.",
        },
        {
          name: "identity_overlap",
          score: 0.03,
          explanation: "No meaningful duplicate identity overlap detected.",
        },
        {
          name: "cluster_linkage",
          score: 0.01,
          explanation: "No suspicious linked profile cluster observed.",
        },
      ]),
      fusedTrustScore: 92.1,
      fusedClassification: "GENUINE",
      llmReason: "Long-lived verified news account with strong audience quality and stable login behavior.",
      llmFraudLikelihood: "Very low",
      llmAdminRecommendation: "Allow normal monitoring and keep in baseline whitelist.",
      blockchainHash: "0x7d2c9f0e9a1b4c2e88c9b6a1f4c2d7a5a9e2d1c7b8f3e4a1b0c9d8e7f6a5b4c3",
      similarAccountsDetected: JSON.stringify([]),
      duplicateIdentityScore: 4,
    },
    {
      userId: investigator.id,
      platform: "X",
      handle: "@globaltech_updates88",
      accountAge: 5,
      followers: 240,
      following: 1480,
      posts: 14,
      profileComplete: false,
      verificationStatus: "PENDING",
      trustScore: 31.5,
      fakeTrustScore: 23.8,
      fakeClassification: "FAKE",
      mlFraudProbability: 0.89,
      mlRiskBand: "CRITICAL",
      mlConfidence: 0.94,
      mlTopFeatures: JSON.stringify([
        {
          name: "duplicate_identity",
          impact: 0.92,
          direction: "risk",
          contribution: "Strong identity overlap is a major synthetic account signal.",
        },
        {
          name: "suspicious_login",
          impact: 0.81,
          direction: "risk",
          contribution: "Login instability suggests compromised or coordinated access.",
        },
        {
          name: "linked_profiles",
          impact: 0.8,
          direction: "risk",
          contribution: "Multiple related profiles indicate cluster-style behavior.",
        },
      ]),
      anomalyScore: 0.87,
      anomalyBand: "SEVERE",
      anomalyTopSignals: JSON.stringify([
        {
          name: "ip_device_variation",
          score: 0.94,
          explanation: "Frequent IP and device switching stands out sharply.",
        },
        {
          name: "identity_overlap",
          score: 0.92,
          explanation: "Identity overlap is well above expected baseline.",
        },
        {
          name: "cluster_linkage",
          score: 0.78,
          explanation: "The account appears connected to a suspicious local cluster.",
        },
      ]),
      fusedTrustScore: 18.6,
      fusedClassification: "HIGH_RISK",
      llmReason: "Very new account with low profile completeness, weak follower structure, and repeated suspicious behaviors.",
      llmFraudLikelihood: "High",
      llmAdminRecommendation: "Escalate for analyst review and preserve evidence trail.",
      blockchainHash: "0x2e1f4c6a8b9d0e7f4c3a2b1d8e6f5a4c9b8d7e6f5a4c3b2a1d0e9f8c7b6a5d4",
      similarAccountsDetected: JSON.stringify([
        { id: "demo-sim-1", handle: "@globaltech_update87", platform: "X", matchType: "handle_similarity" },
        { id: "demo-sim-2", handle: "@globaltechupdates", platform: "X", matchType: "bio_similarity" },
      ]),
      duplicateIdentityScore: 92,
    },
    {
      userId: analyst.id,
      platform: "Facebook",
      handle: "maria.johnson.4098",
      accountAge: 14,
      followers: 680,
      following: 910,
      posts: 67,
      profileComplete: true,
      verificationStatus: "PENDING",
      trustScore: 58.4,
      fakeTrustScore: 54.7,
      fakeClassification: "SUSPICIOUS",
      mlFraudProbability: 0.51,
      mlRiskBand: "ELEVATED",
      mlConfidence: 0.51,
      mlTopFeatures: JSON.stringify([
        {
          name: "linked_profiles",
          impact: 0.59,
          direction: "risk",
          contribution: "Several linked profiles make the network look moderately coordinated.",
        },
        {
          name: "suspicious_login",
          impact: 0.43,
          direction: "risk",
          contribution: "Some login instability is visible but not extreme.",
        },
        {
          name: "profile_completeness",
          impact: 0.18,
          direction: "risk",
          contribution: "Profile completeness is helping, but other signals remain mixed.",
        },
      ]),
      anomalyScore: 0.46,
      anomalyBand: "UNUSUAL",
      anomalyTopSignals: JSON.stringify([
        {
          name: "cluster_linkage",
          score: 0.55,
          explanation: "A small connected profile cluster is visible.",
        },
        {
          name: "login_instability",
          score: 0.43,
          explanation: "Login pattern is somewhat more variable than the baseline.",
        },
        {
          name: "network_imbalance",
          score: 0.39,
          explanation: "Follower-to-following ratio is mixed and needs review.",
        },
      ]),
      fusedTrustScore: 56.7,
      fusedClassification: "SUSPICIOUS",
      llmReason: "Mid-confidence account with mixed identity signals and moderate network irregularities.",
      llmFraudLikelihood: "Medium",
      llmAdminRecommendation: "Monitor and request additional verification if the account escalates.",
      blockchainHash: "0x91b7d4f0a3c8e5b2d1f0a6c4e8b2d3f5a7c1e9d4b6a8f0c2d4e6f8a1b3c5d7e9",
      similarAccountsDetected: JSON.stringify([
        { id: "demo-sim-3", handle: "maria.johnson.4097", platform: "Facebook", matchType: "name_similarity" },
      ]),
      duplicateIdentityScore: 54,
    },
    {
      userId: investigator.id,
      platform: "LinkedIn",
      handle: "alex-rivera-contracting",
      accountAge: 38,
      followers: 112,
      following: 96,
      posts: 31,
      profileComplete: true,
      verificationStatus: "PENDING",
      trustScore: 76.9,
      fakeTrustScore: 71.5,
      fakeClassification: "LOW_RISK",
      mlFraudProbability: 0.18,
      mlRiskBand: "LOW",
      mlConfidence: 0.82,
      mlTopFeatures: JSON.stringify([
        {
          name: "account_maturity",
          impact: 0.74,
          direction: "risk",
          contribution: "Longer account age supports trustworthiness.",
        },
        {
          name: "network_quality",
          impact: 0.61,
          direction: "risk",
          contribution: "Balanced network behavior lowers suspicion.",
        },
        {
          name: "duplicate_identity",
          impact: 0.14,
          direction: "risk",
          contribution: "Minimal overlap with known suspicious identities.",
        },
      ]),
      anomalyScore: 0.21,
      anomalyBand: "NORMAL",
      anomalyTopSignals: JSON.stringify([
        {
          name: "identity_overlap",
          score: 0.12,
          explanation: "Only a small overlap signal is present.",
        },
        {
          name: "activity_velocity",
          score: 0.18,
          explanation: "Posting cadence is within a reasonable range.",
        },
        {
          name: "login_instability",
          score: 0.14,
          explanation: "Session consistency appears acceptable.",
        },
      ]),
      fusedTrustScore: 78.2,
      fusedClassification: "GENUINE",
      llmReason: "Professional-style profile with stable identity signals and moderate activity history.",
      llmFraudLikelihood: "Low",
      llmAdminRecommendation: "No immediate action required.",
      blockchainHash: "0x4a8c2b7e1f3d9a0c6e5b4f2d1a8c9e7f6b5a4d3c2b1e0f9a8d7c6b5a4e3d2c1f",
      similarAccountsDetected: JSON.stringify([]),
      duplicateIdentityScore: 12,
    },
    {
      userId: analyst.id,
      platform: "TikTok",
      handle: "@trendpulse.daily",
      accountAge: 2,
      followers: 9200,
      following: 42,
      posts: 188,
      profileComplete: false,
      verificationStatus: "PENDING",
      trustScore: 42.7,
      fakeTrustScore: 38.9,
      fakeClassification: "SUSPICIOUS",
      mlFraudProbability: 0.63,
      mlRiskBand: "HIGH",
      mlConfidence: 0.87,
      mlTopFeatures: JSON.stringify([
        {
          name: "network_quality",
          impact: 0.79,
          direction: "risk",
          contribution: "Follower structure is unusual for an organic creator account.",
        },
        {
          name: "activity_pattern",
          impact: 0.72,
          direction: "risk",
          contribution: "Posting velocity is high for a very young account.",
        },
        {
          name: "profile_completeness",
          impact: 0.54,
          direction: "risk",
          contribution: "Incomplete profile lowers confidence in authenticity.",
        },
      ]),
      anomalyScore: 0.69,
      anomalyBand: "UNUSUAL",
      anomalyTopSignals: JSON.stringify([
        {
          name: "activity_velocity",
          score: 0.83,
          explanation: "The account posts at a pace that is unusual for its age.",
        },
        {
          name: "network_imbalance",
          score: 0.76,
          explanation: "Follower-to-following pattern looks engineered.",
        },
        {
          name: "identity_overlap",
          score: 0.61,
          explanation: "Some overlap with other related accounts was detected.",
        },
      ]),
      fusedTrustScore: 44.1,
      fusedClassification: "SUSPICIOUS",
      llmReason: "High growth rate and incomplete profile make the account worth deeper review.",
      llmFraudLikelihood: "Medium-high",
      llmAdminRecommendation: "Monitor closely and review content provenance.",
      blockchainHash: "0xb3e4f2a1c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2",
      similarAccountsDetected: JSON.stringify([
        { id: "demo-sim-4", handle: "@trendpulse_weekly", platform: "TikTok", matchType: "content_similarity" },
      ]),
      duplicateIdentityScore: 61,
    },
  ];

  const createdAccounts = [];
  for (const account of demoAccounts) {
    const created = await prisma.socialAccount.create({ data: account });
    createdAccounts.push(created);
  }

  const accountMap = Object.fromEntries(createdAccounts.map((account) => [account.handle, account]));

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        loginTime: new Date("2026-04-09T08:00:00.000Z"),
        ipAddress: "203.0.113.10",
        device: "MacBook Pro",
      },
      {
        userId: investigator.id,
        loginTime: new Date("2026-04-09T09:30:00.000Z"),
        ipAddress: "198.51.100.24",
        device: "Windows Laptop",
      },
      {
        userId: analyst.id,
        loginTime: new Date("2026-04-09T11:15:00.000Z"),
        ipAddress: "192.0.2.44",
        device: "iPhone",
      },
    ],
  });

  await prisma.alert.createMany({
    data: [
      {
        accountId: accountMap["@globaltech_updates88"].id,
        riskLevel: "CRITICAL",
        reason: "Duplicate identity and login instability indicate likely synthetic activity.",
      },
      {
        accountId: accountMap["@trendpulse.daily"].id,
        riskLevel: "HIGH",
        reason: "Very new account with rapid activity growth and weak profile completeness.",
      },
    ],
  });

  const investigationCase = await prisma.case.create({
    data: {
      title: "Synthetic account cluster review",
      description: "Demo case seeded with high-risk and mixed-trust accounts for product walkthroughs.",
      status: "OPEN",
      createdById: admin.id,
      assignedToId: analyst.id,
      accounts: {
        create: [
          { accountId: accountMap["@globaltech_updates88"].id },
          { accountId: accountMap["@trendpulse.daily"].id },
          { accountId: accountMap["maria.johnson.4098"].id },
        ],
      },
      reports: {
        create: {
          authorId: investigator.id,
          summary:
            "The seeded demo accounts illustrate a spread from verified and stable to highly suspicious behavior patterns.",
          recommendation:
            "Escalate the most suspicious accounts for review and monitor the mid-confidence profile for trend changes.",
        },
      },
      decisions: {
        create: {
          analystId: analyst.id,
          riskRating: "HIGH",
          decision: "ESCALATE",
          rationale:
            "Multiple high-risk indicators converge on the synthetic cluster accounts, while the others are suitable for baseline monitoring.",
        },
      },
      notes: {
        create: [
          {
            authorId: investigator.id,
            body: "Seeded demo data is ready for UI walkthroughs and analyst training.",
          },
          {
            authorId: analyst.id,
            body: "Use the high-risk examples to show how explainable scoring works in practice.",
          },
        ],
      },
    },
  });

  await prisma.assistantConversation.create({
    data: {
      userId: investigator.id,
      caseId: investigationCase.id,
      contextKey: "demo-investigation-overview",
      scope: "CASE",
      label: "Demo Investigation Overview",
      messages: {
        create: [
          {
            role: "user",
            content: "Summarize the risk posture of the seeded demo accounts.",
          },
          {
            role: "assistant",
            content:
              "The demo set includes one clearly genuine account, one mixed-confidence professional account, and two accounts that are strong candidates for escalation.",
          },
        ],
      },
    },
  });

  console.log("Seeded admin:", admin.email);
  console.log("Seeded investigator:", investigator.email);
  console.log("Seeded analyst:", analyst.email);
  console.log("Seeded demo social accounts:", createdAccounts.length);
  console.log("Demo password for all: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
