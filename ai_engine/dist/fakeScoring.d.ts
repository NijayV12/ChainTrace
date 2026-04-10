export interface FakeFeatures {
    accountAgeDays: number;
    profileCompletenessScore: number;
    usernameRandomnessScore: number;
    followerFollowingRatio: number;
    friendRequestRate: number;
    mutualConnectionScore: number;
    postingFrequency: number;
    loginLocationVariation: number;
    activityTimePatternScore: number;
    spamKeywordScore: number;
    repetitiveContentScore: number;
    duplicateIdentityFlag: boolean;
    multipleAccountsSameIp: boolean;
    deviceFingerprintRisk: number;
}
export type FakeClassification = "GENUINE" | "LOW_RISK" | "SUSPICIOUS" | "FAKE";
export declare function computeFakeTrustScore(features: FakeFeatures): number;
export declare function classifyFakeScore(score: number): FakeClassification;
