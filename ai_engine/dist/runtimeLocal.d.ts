import { type LoginActivitySignal } from "./activity.js";
import type { EvaluateAccountRiskRequest, EvaluateAccountRiskResponse } from "./runtimeContracts.js";
export declare function evaluateAccountRiskLocal(params: {
    account: Omit<EvaluateAccountRiskRequest["account"], "createdAt"> & {
        createdAt: Date;
    };
    activityLogs: LoginActivitySignal[];
    duplicateIdentityScore: number;
    linkedProfileCount?: number;
}): EvaluateAccountRiskResponse;
