## CHAINTRACE

**Blockchain Powered Social Media Identity Verification & Fake Profile Detection Platform.**

Frontend (React + Vite) · Backend (Node + Express + Prisma) · Lightweight PoW blockchain · Deterministic AI scoring + optional LLM reasoning.

---

### 1. Features

- **User flow**: Register/Login → Dashboard → Submit social account → Deterministic trust score → On-chain anchoring.
- **Admin flow**: Admin login → Investigation dashboard → Risk analytics, suspicious accounts, alerts, activity timeline, blockchain view.
- **Lightweight blockchain**: File-backed `chain.json` with SHA-256, Proof-of-Work (configurable difficulty), explorer APIs.
- **Deterministic AI scoring engine**:
  - `score = 0.25*account_age_score + 0.20*profile_completeness_score + 0.20*follower_ratio_score + 0.15*posting_pattern_score + 0.10*duplicate_identity_score + 0.10*suspicious_login_score`
  - LLM reasoning layer can explain scores but **never modifies** them.

---

### 2. Project structure

```text
backend/        # API gateway, services, Prisma, auth, blockchain, AI scoring
frontend/       # React SPA (landing, user/admin flows, explorer)
blockchain/     # (legacy) standalone blockchain module (backend now vendors its code)
ai_engine/      # placeholder package metadata for AI engine
auth/           # shared role types
database/       # (logical) database layer handled via Prisma in backend/
admin/          # (logical) admin layer implemented in backend/src/admin
workers/        # background queue (backend/src/workers)
tests/          # high-level test docs (backend has concrete tests)
docs/           # api.md and future architecture docs
scripts/        # setup script
```

Backend (selected files):

- `src/app.ts` – Express app, route wiring, middleware.
- `src/auth/*` – JWT, middleware, login/register service.
- `src/ai/scoring.ts` – deterministic trust score + classification.
- `src/ai/llmReasoning.ts` – optional LLM explanation layer (OpenAI).
- `src/blockchain/*` – `Block` and `Chain` with PoW and file persistence.
- `src/services/verificationService.ts` – verification + scoring + alerts + blockchain anchoring.
- `src/admin/adminRoutes.ts` – admin analytics, suspicious accounts, alerts, activity, blockchain.

Frontend (selected files):

- `src/pages/Landing.tsx` – marketing/landing page.
- `src/pages/UserLogin.tsx`, `AdminLogin.tsx`.
- `src/pages/UserDashboard.tsx` – user metrics + accounts list.
- `src/pages/VerificationForm.tsx` – submit verification.
- `src/pages/ScoreResult.tsx` – trust score view.
- `src/pages/AdminDashboard.tsx` – risk analytics, alerts, activity timeline.
- `src/pages/BlockchainExplorer.tsx` – chain explorer UI.

---

### 3. Prerequisites

- Node.js **>= 18**
- npm

No message broker is required; Prisma uses **Postgres** and the blockchain uses a JSON file under `./data/chain`.

---

### 4. Setup & run (one-time + dev)

From the repository root:

```bash
# one-time setup: install deps, push Prisma schema, seed demo data
npm run setup

# start backend (port 4000) and frontend (port 5173) together
npm run dev
```

Then open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

Environment:

- Copy `.env.example` to `.env` if you want to customize values.
- Backend uses `backend/.env` for Prisma + runtime config.
- For local development and production, set `DATABASE_URL` to a Postgres connection string.

---

### 4.1 Deploying on Vercel + Render

- **Frontend**: deploy `frontend/` to **Vercel**
- **Backend**: deploy `backend/` to **Render** as a **Web Service**

Frontend settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://your-render-service.onrender.com`

Backend settings:

- Root directory: `backend`
- Build command: `npm install && npm run build && npx prisma db push`
- Start command: `npm run start`
- Environment variables:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `JWT_SECRET=change-this-in-production`
  - `DATABASE_URL=...`
  - `BLOCKCHAIN_DATA_DIR=./data/chain`
  - `CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`
  - `OPENAI_API_KEY=` (optional)
  - `LLM_REASONING_ENABLED=false`

Notes:

- The frontend uses `VITE_API_URL` in production and falls back to the local Vite proxy in development.
- Vercel SPA route rewrites are configured in `frontend/vercel.json`.
- Create a **Render Postgres** database and use its connection string for `DATABASE_URL`.

---

### 5. Demo credentials & sample data

The Prisma seed (`backend/prisma/seed.ts`) creates two demo users:

- **Admin**
  - Email: `admin@chaintrace.io`
  - Password: `demo1234`
  - Role: `ADMIN`
- **User**
  - Email: `user@demo.com`
  - Password: `demo1234`
  - Role: `USER`

Use these to explore:

- User login via `/login` → submit verifications, view scores, see user dashboard.
- Admin login via `/admin/login` → admin investigation dashboard & blockchain view.

---

### 6. Architecture overview

- **Frontend (React)** – SPA with:
  - Landing page, user/admin auth screens.
  - User dashboard with animated cards, skeleton loaders, and table of social accounts.
  - Verification form page and score result page.
  - Admin dashboard (risk analytics cards, risk distribution bars, alerts list, activity timeline).
  - Blockchain explorer page.

- **API gateway (Express)** – single entrypoint exposing:
  - `/api/v1/auth/*` – registration, login.
  - `/api/v1/users/*` – user accounts & verification.
  - `/api/v1/admin/*` – admin analytics & investigations.
  - `/api/v1/blockchain/*` – blockchain explorer APIs.

- **Auth service** – JWT bearer auth with roles:
  - `USER` – can manage only their own accounts.
  - `ADMIN` – can access analytics, all accounts, alerts, blockchain status.

- **Verification + AI scoring**:
  - Deterministic scoring function combines:
    - account age, profile completeness, follower/following ratio, posting patterns,
      duplicate identity signal and suspicious login signal.
  - Resulting score ∈ \[0, 100] and classification:
    - `GENUINE` if score > 75
    - `SUSPICIOUS` if 50–75
    - `HIGH_RISK` if < 50
  - Optional LLM layer (OpenAI) can generate:
    - natural-language reason,
    - fraud likelihood explanation,
    - admin recommendation.
  - The LLM **never** changes the computed numeric score.

- **Blockchain service**:
  - Custom `Block` and `Chain` implementation with:
    - index, timestamp, data hash, previous hash, nonce.
    - Proof-of-Work (difficulty prefix of 4 zeroes).
  - Chain stored as `chain.json` under `./data/chain`.
  - Only hashed identity data is stored (`identityHash`, `accountId`).
  - Explorer APIs expose full chain and individual blocks.

- **Background worker / queue**:
  - `p-queue` based lightweight scoring worker used by `verificationService`.
  - In this demo, scoring is run inline for simplicity, but the worker
    (`backend/src/workers/scoringQueue.ts`) is ready to be used as an async queue.

- **Database layer**:
  - Prisma models map to required tables:
    - `User` – users.
    - `SocialAccount` – social media accounts and scoring attributes.
    - `ActivityLog` – login events with IP/device.
    - `Alert` – risk alerts (Suspicious / High risk).

---

### 7. Tests

Backend tests (Vitest):

- **Unit**:
  - `src/ai/scoring.test.ts` – deterministic scoring & classification boundaries.
- **Blockchain integrity**:
  - `src/blockchain/Chain.test.ts` – mine a block, verify chain, reload from disk.
- **API test**:
  - `src/app.test.ts` – `/health` endpoint via Supertest.

Run:

```bash
cd backend
npm test
```

Frontend tests are wired with Vitest and can be extended as needed:

```bash
cd frontend
npm test
```

---

### 8. API reference

A concise API reference lives in `docs/api.md` and covers:

- Auth endpoints (register/login).
- User verification and score result endpoints.
- Admin analytics, alerts, and activity.
- Blockchain explorer endpoints.

---

### 9. Security notes

- JWT secret and DB path are configurable via environment variables – **change `JWT_SECRET` in production**.
- Passwords are stored using **bcrypt** hashes.
- CORS is enabled for local development; in production restrict `origin`.
- Only hashed identity data is written to the blockchain; raw PII stays in the database.

