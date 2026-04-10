# ChainTrace Python ML Service

Optional FastAPI service for tabular fraud inference and anomaly scoring.

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

## Endpoints

- `GET /health`
- `POST /infer`

The service is designed to evolve into:

- `fraudProbability`
- `riskBand`
- `confidence`
- `topFeatures`
- `anomalyAssessment`

## Suggested Integration

Set:

```bash
AI_ENGINE_URL=http://localhost:4010
AI_ENGINE_PYTHON_URL=http://localhost:8010
```

Then run the Node `ai_engine` runtime. It will keep trust/fake-engine logic in TypeScript and delegate ML/anomaly inference to this Python service when available.
