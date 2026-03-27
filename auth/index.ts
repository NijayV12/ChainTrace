/**
 * Auth module - used by backend.
 * JWT creation/verification and role checks live in backend/src/auth/
 */

export type Role = "SUPER_ADMIN" | "INVESTIGATOR" | "ANALYST";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  INVESTIGATOR: "INVESTIGATOR",
  ANALYST: "ANALYST",
} as const;
