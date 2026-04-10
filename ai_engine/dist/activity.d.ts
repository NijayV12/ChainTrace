export interface LoginActivitySignal {
    ipAddress?: string | null;
    device?: string | null;
    loginTime: Date;
}
export declare function computeSuspiciousLoginScore(activityLogs: LoginActivitySignal[], now?: number): number;
