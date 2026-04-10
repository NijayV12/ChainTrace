import http from "http";
import { buildAccountInvestigationSummary } from "./investigation.js";
import { fuseRiskSignals } from "./fusion.js";
import { evaluateAccountRiskLocal } from "./runtimeLocal.js";
import type {
  EvaluateAccountRiskRequest,
  EvaluateAccountRiskResponse,
  HealthResponse,
  RuntimeActivityLog,
  SummarizeAccountInvestigationRequest,
  SummarizeAccountInvestigationResponse,
} from "./runtimeContracts.js";

const port = parseInt(process.env.AI_ENGINE_PORT ?? "4010", 10);
const pythonServiceUrl = (process.env.AI_ENGINE_PYTHON_URL ?? "").trim();

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  body: unknown
): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseDateLogs(logs: RuntimeActivityLog[]) {
  return logs.map((log) => ({
    ...log,
    loginTime: new Date(log.loginTime),
  }));
}

async function readJson<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw) as T;
}

async function callPythonInference(
  body: EvaluateAccountRiskRequest,
  suspiciousLoginScore: number,
  ipDeviceVariation: number
): Promise<Pick<EvaluateAccountRiskResponse, "mlAssessment" | "anomalyAssessment"> | null> {
  if (!pythonServiceUrl) return null;

  const response = await fetch(`${pythonServiceUrl}/infer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_age_months: body.account.accountAge,
      profile_complete: body.account.profileComplete,
      followers: body.account.followers,
      following: body.account.following,
      posts: body.account.posts,
      duplicate_identity_score: body.duplicateIdentityScore,
      suspicious_login_score: suspiciousLoginScore,
      linked_profile_count: body.linkedProfileCount ?? 0,
      ip_device_variation: ipDeviceVariation,
    }),
  });

  if (!response.ok) {
    throw new Error(`Python ML service failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    fraudProbability: number;
    riskBand: string;
    confidence: number;
    topFeatures: EvaluateAccountRiskResponse["mlAssessment"]["topFeatures"];
    anomalyAssessment: EvaluateAccountRiskResponse["anomalyAssessment"];
  };

  return {
    mlAssessment: {
      fraudProbability: data.fraudProbability,
      riskBand: data.riskBand as EvaluateAccountRiskResponse["mlAssessment"]["riskBand"],
      confidence: data.confidence,
      topFeatures: data.topFeatures,
    },
    anomalyAssessment: data.anomalyAssessment,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    const body: HealthResponse = { status: "ok", service: "ai_engine" };
    sendJson(res, 200, body);
    return;
  }

  if (req.method === "POST" && req.url === "/v1/evaluate-account") {
    try {
      const body = await readJson<EvaluateAccountRiskRequest>(req);
      const result: EvaluateAccountRiskResponse = evaluateAccountRiskLocal({
        account: {
          ...body.account,
          createdAt: new Date(body.account.createdAt),
        },
        activityLogs: parseDateLogs(body.activityLogs),
        duplicateIdentityScore: body.duplicateIdentityScore,
        linkedProfileCount: body.linkedProfileCount,
      });
      const pythonAssessment = await callPythonInference(
        body,
        result.suspiciousLoginScore,
        Math.max(
          result.fakeFeatures.loginLocationVariation,
          result.fakeFeatures.deviceFingerprintRisk
        )
      );
      const finalResult =
        pythonAssessment == null
          ? result
          : {
              ...result,
              mlAssessment: pythonAssessment.mlAssessment,
              anomalyAssessment: pythonAssessment.anomalyAssessment,
              ...fuseRiskSignals({
                deterministicTrustScore: result.trustScore,
                fakeEngineTrustScore: result.fakeTrustScore,
                mlAssessment: pythonAssessment.mlAssessment,
                anomalyAssessment: pythonAssessment.anomalyAssessment,
              }),
            };
      sendJson(res, 200, finalResult);
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/v1/summarize-account") {
    try {
      const body = await readJson<SummarizeAccountInvestigationRequest>(req);
      const account = {
        ...body.account,
        createdAt: new Date(body.account.createdAt),
      };
      const result: SummarizeAccountInvestigationResponse =
        buildAccountInvestigationSummary(account, parseDateLogs(body.activityLogs));
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`ai_engine runtime listening on http://localhost:${port}`);
});
