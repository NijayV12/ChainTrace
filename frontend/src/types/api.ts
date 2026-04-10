export interface AccountSummary {
  id: string;
  platform: string;
  handle: string;
  verificationStatus: string;
  trustScore: number | null;
  fakeTrustScore?: number | null;
  mlFraudProbability?: number | null;
  mlRiskBand?: string | null;
  anomalyScore?: number | null;
  anomalyBand?: string | null;
  fusedTrustScore?: number | null;
  fusedClassification?: string | null;
  createdAt: string;
}

export interface SimilarAccountDetected {
  id: string;
  platform: string;
  handle: string;
  matchType: string;
  reason: string;
}

export interface InvestigationSummary {
  baseClassification: string;
  fakeProfileClassification: string;
  mlRiskBand: string;
  mlFraudProbability: number | null;
  mlConfidence: number | null;
  mlTopFeatures: Array<{
    name: string;
    impact: number;
    direction: "risk" | "protective";
    contribution: string;
  }>;
  anomalyScore: number | null;
  anomalyBand: string;
  anomalyTopSignals: Array<{
    name: string;
    score: number;
    explanation: string;
  }>;
  fusedTrustScore: number | null;
  fusedClassification: string;
  riskSignals: string[];
  credibilitySignals: string[];
  loginRiskScore: number;
  linkedProfiles: SimilarAccountDetected[];
  recommendedAction: string;
}

export interface ResultAccount {
  id: string;
  platform: string;
  handle: string;
  verificationStatus: string;
  trustScore: number | null;
  blockchainHash: string | null;
  classification: string;
  fakeTrustScore?: number | null;
  fakeClassification?: string;
  mlFraudProbability?: number | null;
  mlRiskBand?: string | null;
  mlConfidence?: number | null;
  mlTopFeatures?: string | null;
  anomalyScore?: number | null;
  anomalyBand?: string | null;
  anomalyTopSignals?: string | null;
  fusedTrustScore?: number | null;
  fusedClassification?: string | null;
  onChain: boolean;
  llmReason?: string | null;
  llmFraudLikelihood?: string | null;
  llmAdminRecommendation?: string | null;
  similarAccountsDetected?: SimilarAccountDetected[] | null;
  duplicateIdentityScore?: number | null;
  investigationSummary?: InvestigationSummary;
}

export interface CaseRelationship {
  fromAccountId: string;
  toAccountId: string;
  relation: string;
  platform: string;
  handle: string;
}

export interface CaseIntelligenceSummary {
  caseId: string;
  caseStatus: string;
  accountCount: number;
  userCount: number;
  platforms: string[];
  alertCount: number;
  reportCount: number;
  decisionCount: number;
  noteCount: number;
  linkedRelationshipCount: number;
  highestRiskAccount: {
    id: string;
    platform: string;
    handle: string;
    duplicateIdentityScore: number;
    trustScore: number | null;
    fakeTrustScore: number | null;
    mlFraudProbability: number | null;
    mlRiskBand: string | null;
    anomalyScore: number | null;
    anomalyBand: string | null;
    fusedTrustScore: number | null;
    fusedClassification: string | null;
  } | null;
}

export interface CaseIntelligence {
  summary: CaseIntelligenceSummary;
  relationships: CaseRelationship[];
  recentAlerts: Array<{
    id: string;
    accountId: string;
    riskLevel: string;
    reason: string;
    createdAt: string;
  }>;
  evidenceDigest: string;
}

export interface CaseAnchorResult {
  caseId: string;
  evidenceDigest: string;
  blockchain: {
    blockHash: string;
    index: number;
    evidenceHash: string;
  };
}

export interface CaseListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string } | null;
  accounts?: {
    account: {
      platform: string;
      handle: string;
      fakeClassification?: string | null;
      mlFraudProbability?: number | null;
      anomalyScore?: number | null;
      fusedClassification?: string | null;
    };
  }[];
}

export type AdminRole = "INVESTIGATOR" | "ANALYST" | "SUPER_ADMIN";

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: {
    loginTime: string;
    ipAddress?: string | null;
    device?: string | null;
  } | null;
}

export interface AdminActionLogEntry {
  id: string;
  action: string;
  metadata?: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
}
