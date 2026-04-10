export interface ScoringInput {
    accountAgeMonths: number;
    profileComplete: boolean;
    followers: number;
    following: number;
    posts: number;
    duplicateIdentityScore: number;
    suspiciousLoginScore: number;
}
export type Classification = "GENUINE" | "SUSPICIOUS" | "HIGH_RISK";
export declare function computeTrustScore(input: ScoringInput): number;
export declare function classifyScore(score: number): Classification;
