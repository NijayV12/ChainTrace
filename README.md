# CHAINTRACE

Blockchain-powered social media identity verification, fake-profile detection, and investigation platform.

Frontend (React + Vite) · Backend (Node + Express + Prisma) · Shared `ai_engine` runtime · Lightweight PoW blockchain · Hybrid deterministic + ML fraud analysis.

## Features

- Investigator workflow: login, submit social accounts, review trust/risk outputs, open cases, and anchor evidence on-chain.
- Analyst and admin workflow: review case intelligence, alerts, suspicious clusters, anomaly hotspots, and supervisory decisions.
- Hybrid intelligence engine:
  - deterministic trust score
  - fake-profile risk score
  - ML fraud probability, confidence, and top features
  - anomaly score and top behavioral signals
  - fused trust classification for triage
- Dedicated `ai_engine` boundary:
  - shared package for feature extraction, scoring, fusion, and summaries
  - optional HTTP runtime service
  - optional Python FastAPI inference backend for future XGBoost / LightGBM / Isolation Forest
- Case intelligence:
  - linked profile relationships
  - recent alert clustering
  - highest-risk account summary
  - network evidence page in the frontend
- Blockchain evidence ledger:
  - stable identity hashing
  - deterministic evidence hashing
  - case anchoring endpoint and explorer UI

## Project Structure

```text
backend/        # API, auth, workflows, Prisma, alerts, blockchain orchestration
frontend/       # React SPA for dashboards, case workspace, network evidence, explorer
ai_engine/      # shared scoring/ML engine + optional HTTP runtime + optional Python service
auth/           # shared role types
blockchain/     # legacy standalone blockchain module
database/       # logical DB layer handled through Prisma in backend/
admin/          # logical admin layer implemented in backend/src/admin
workers/        # background queue helpers
docs/           # API docs and future architecture notes
scripts/        # setup script
```

## Key Files

### Backend

- `backend/src/services/aiEngineService.ts`: local or HTTP-based `ai_engine` orchestration
- `backend/src/services/verificationService.ts`: verification, score fusion, ML/anomaly persistence, alerts, blockchain anchoring
- `backend/src/services/investigationIntelligenceService.ts`: case summaries, linked relationships, highest-risk account selection
- `backend/src/services/blockchainService.ts`: stable evidence hashing and case anchoring
- `backend/src/routes/caseRoutes.ts`: case intelligence and anchor endpoints

### Frontend

- `frontend/src/pages/UserDashboard.tsx`: investigator-facing dashboard with fused trust and ML risk
- `frontend/src/pages/ScoreResult.tsx`: score detail, ML probability, anomaly score, top features/signals
- `frontend/src/pages/CaseDetail.tsx`: case workspace, intelligence digest, anchoring
- `frontend/src/pages/CaseNetwork.tsx`: cluster and linked-profile evidence view
- `frontend/src/pages/AdminDashboard.tsx`: hotspot analytics and suspicious account monitoring
- `frontend/src/pages/BlockchainExplorer.tsx`: chain explorer with evidence-oriented payloads

### AI Engine

- `ai_engine/src/scoring.ts`: deterministic trust scoring
- `ai_engine/src/fakeScoring.ts`: fake-profile scoring
- `ai_engine/src/ml.ts`: ML fraud and anomaly assessment
- `ai_engine/src/fusion.ts`: score fusion
- `ai_engine/src/investigation.ts`: shared investigation summary helpers
- `ai_engine/src/httpService.ts`: runtime boundary
- `ai_engine/python_service/app/main.py`: optional Python inference service

## Prerequisites

- Node.js `>= 18`
- npm
- Postgres

Optional for the Python ML service:

- Python `>= 3.10`

## Setup

From the repository root:

```bash
npm run setup
```

That installs dependencies, prepares Prisma, and seeds demo data where applicable.

## Development

```bash
# backend + frontend
npm run dev

# ai_engine runtime + backend + frontend
npm run dev:with-ai

# apply the latest Prisma schema
npm run db:push
```

Local endpoints:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Backend health: `http://localhost:4000/health`
- AI engine health: `http://localhost:4010/health`

## Environment

Copy `.env.example` to `.env` if needed.

Important values:

- `DATABASE_URL`: Postgres connection string
- `AI_ENGINE_URL=http://localhost:4010`: tells backend to use the `ai_engine` HTTP boundary
- `AI_ENGINE_TIMEOUT_MS=5000`: backend timeout for `ai_engine`
- `AI_ENGINE_PORT=4010`: port used by the `ai_engine` service
- `AI_ENGINE_PYTHON_URL=http://localhost:8010`: optional Python inference endpoint used by `ai_engine`

## Deployment

### Frontend on Vercel

- Import the repo into Vercel.
- Set the root directory to `frontend`.
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to your deployed backend URL, for example `https://chaintrace-api.onrender.com`

The SPA rewrite config is already present in `frontend/vercel.json`.

### Backend on Render

- Import the repo into Render as a Web Service.
- Use the repo root so Render can see both `backend/` and `ai_engine/`.
- A Render blueprint is already included in `render.yaml`.
- If you prefer manual settings:
  - Build command: `cd ai_engine && npm install && npm run build && cd ../backend && npm install && npm run build`
  - Start command: `cd backend && npm run start`

Required environment variables on Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

Optional environment variables:

- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `LLM_API_KEY`
- `AI_ENGINE_URL`
- `AI_ENGINE_PYTHON_URL`

After first deploy, run Prisma schema sync against the production database:

```bash
cd backend
npx prisma db push
```

## Optional Python ML Service

The project is ready for a Python-backed inference service for XGBoost / LightGBM and anomaly models.

See:

- `ai_engine/python_service/README.md`
- `ai_engine/datasets/README.md`
- `ai_engine/datasets/fraud_training_schema.csv`

## Current Architecture

- Frontend: presents fraud probability, anomaly score, top features, case intelligence, and network evidence
- Backend: API, auth, workflow orchestration, persistence, alerts, blockchain
- `ai_engine`: feature extraction, scoring, ML inference, anomaly inference, fusion, summaries
- Optional Python service: future production-grade tabular fraud and anomaly inference

## Verification

Build commands used during this implementation:

```bash
cd ai_engine && npm run build
cd backend && npm run build
cd frontend && npm run build
```

## Important Follow-Up

The Prisma schema now includes ML, anomaly, and fused-score fields. Apply it to your database before expecting those values to persist:

```bash
npm run db:push
```
