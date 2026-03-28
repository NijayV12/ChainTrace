export interface AccountSummary {
  id: string;
  platform: string;
  handle: string;
  verificationStatus: string;
  trustScore: number | null;
  fakeTrustScore?: number | null;
  createdAt: string;
}

export interface SimilarAccountDetected {
  id: string;
  platform: string;
  handle: string;
  matchType: string;
  reason: string;
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
  onChain: boolean;
  llmReason?: string | null;
  llmFraudLikelihood?: string | null;
  llmAdminRecommendation?: string | null;
  similarAccountsDetected?: SimilarAccountDetected[] | null;
  duplicateIdentityScore?: number | null;
}

export interface CaseListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string } | null;
  accounts?: { account: { platform: string; handle: string; fakeClassification?: string | null } }[];
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
