from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from sklearn.ensemble import IsolationForest
except Exception:  # pragma: no cover
    IsolationForest = None  # type: ignore

try:
    from xgboost import XGBClassifier
except Exception:  # pragma: no cover
    XGBClassifier = None  # type: ignore


class MLRequest(BaseModel):
    account_age_months: int = Field(ge=0)
    profile_complete: bool
    followers: int = Field(ge=0)
    following: int = Field(ge=0)
    posts: int = Field(ge=0)
    duplicate_identity_score: float = Field(ge=0, le=100)
    suspicious_login_score: float = Field(ge=0, le=100)
    linked_profile_count: int = Field(ge=0)
    ip_device_variation: float = Field(default=0, ge=0, le=100)


def feature_vector(request: MLRequest) -> List[float]:
    ratio = request.followers / max(request.following, 1)
    posting_frequency = request.posts / max(request.account_age_months, 1)
    return [
        float(request.account_age_months),
        1.0 if request.profile_complete else 0.0,
        ratio,
        posting_frequency,
        request.duplicate_identity_score,
        request.suspicious_login_score,
        float(request.linked_profile_count),
        request.ip_device_variation,
    ]


class ModelBundle:
    def __init__(self) -> None:
        self.model_dir = Path(__file__).resolve().parents[1] / "models"
        self.model_dir.mkdir(exist_ok=True)
        self.xgb = None
        self.iforest = None
        self._init_fallbacks()

    def _init_fallbacks(self) -> None:
        baseline = np.array(
            [
                [36, 1, 2.3, 10.0, 5, 10, 0, 12],
                [24, 1, 1.1, 4.0, 12, 18, 1, 18],
                [2, 0, 0.08, 45.0, 88, 82, 4, 75],
                [1, 0, 0.02, 0.0, 95, 90, 5, 92],
                [12, 1, 0.35, 2.5, 40, 35, 2, 25],
            ],
            dtype=float,
        )
        labels = np.array([0, 0, 1, 1, 1], dtype=int)

        if XGBClassifier is not None:
            self.xgb = XGBClassifier(
                n_estimators=25,
                max_depth=3,
                learning_rate=0.15,
                objective="binary:logistic",
                eval_metric="logloss",
                verbosity=0,
            )
            self.xgb.fit(baseline, labels)

        if IsolationForest is not None:
            self.iforest = IsolationForest(
                n_estimators=40,
                contamination=0.2,
                random_state=42,
            )
            self.iforest.fit(baseline)

    def infer(self, request: MLRequest):
        values = np.array([feature_vector(request)], dtype=float)

        if self.xgb is not None:
            fraud_probability = float(self.xgb.predict_proba(values)[0][1])
        else:
            fraud_probability = min(
                max(
                    0.0032 * request.duplicate_identity_score
                    + 0.0024 * request.suspicious_login_score
                    + 0.12 * min(request.linked_profile_count / 5, 1)
                    + 0.08 * min(request.ip_device_variation / 100, 1),
                    0,
                ),
                1,
            )

        if self.iforest is not None:
            raw = float(self.iforest.score_samples(values)[0])
            anomaly_score = float(np.clip((0.65 - raw) / 0.65, 0, 1))
        else:
            anomaly_score = min(
                max(
                    0.3 * (request.suspicious_login_score / 100)
                    + 0.25 * (request.duplicate_identity_score / 100)
                    + 0.2 * min(request.linked_profile_count / 5, 1)
                    + 0.25 * (request.ip_device_variation / 100),
                    0,
                ),
                1,
            )

        return fraud_probability, anomaly_score


bundle = ModelBundle()
app = FastAPI(title="ChainTrace ML Service", version="0.2.0")


def fraud_band(probability: float) -> str:
    if probability >= 0.85:
        return "CRITICAL"
    if probability >= 0.65:
        return "HIGH"
    if probability >= 0.4:
        return "ELEVATED"
    return "LOW"


def anomaly_band(score: float) -> str:
    if score >= 0.8:
        return "SEVERE"
    if score >= 0.45:
        return "UNUSUAL"
    return "NORMAL"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/infer")
def infer(request: MLRequest):
    probability, anomaly_score = bundle.infer(request)
    probability = round(float(np.clip(probability, 0, 1)), 4)
    anomaly_score = round(float(np.clip(anomaly_score, 0, 1)), 4)

    return {
        "fraudProbability": probability,
        "riskBand": fraud_band(probability),
        "confidence": round(0.5 + abs(probability - 0.5), 4),
        "topFeatures": [
            {
                "name": "duplicate_identity",
                "impact": round(request.duplicate_identity_score / 100, 4),
                "direction": "risk",
                "contribution": "Duplicate identity overlap drives model suspicion.",
            },
            {
                "name": "suspicious_login",
                "impact": round(request.suspicious_login_score / 100, 4),
                "direction": "risk",
                "contribution": "Login instability increases the likelihood of coordinated misuse.",
            },
            {
                "name": "linked_profiles",
                "impact": round(min(request.linked_profile_count / 5, 1), 4),
                "direction": "risk",
                "contribution": "Linked internal profiles suggest cluster-style coordination.",
            },
        ],
        "anomalyAssessment": {
            "anomalyScore": anomaly_score,
            "anomalyBand": anomaly_band(anomaly_score),
            "topSignals": [
                {
                    "name": "ip_device_variation",
                    "score": round(request.ip_device_variation / 100, 4),
                    "explanation": "IP/device instability is higher than the expected baseline.",
                },
                {
                    "name": "duplicate_identity",
                    "score": round(request.duplicate_identity_score / 100, 4),
                    "explanation": "Identity overlap is outside the normal operating pattern.",
                },
                {
                    "name": "linked_profiles",
                    "score": round(min(request.linked_profile_count / 5, 1), 4),
                    "explanation": "Relationship density indicates an unusual local cluster.",
                },
            ],
        },
    }
