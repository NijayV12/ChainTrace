## CHAINTRACE API (v1)

Base URL: `http://localhost:4000`

Prefix: `/api/v1`

Authentication: JWT Bearer tokens in `Authorization: Bearer <token>` header.

Roles:
- `USER`: regular end users.
- `ADMIN`: investigation and operations staff.

---

### Auth

#### `POST /api/v1/auth/register`

Create a new user account.

- **Body**
  - `name` (string, required)
  - `email` (string, required, unique)
  - `phone` (string, optional)
  - `password` (string, min 6 chars)

- **Response 201**
  - `user` – `{ id, name, email, role }`
  - `token` – JWT access token

#### `POST /api/v1/auth/login`

Log in as user or admin.

- **Body**
  - `email` (string)
  - `password` (string)

- **Response 200**
  - `user` – `{ id, name, email, role }`
  - `token` – JWT access token

Activity logs are written with `login_time`, `ip_address`, and `device`.

---

### User Verification (role: USER)

All endpoints require `Authorization: Bearer <token>`.

#### `GET /api/v1/users/accounts`

List the authenticated user's social accounts.

- **Response 200** – array of:
  - `id`, `platform`, `handle`, `accountAge`, `followers`, `following`,
    `posts`, `profileComplete`, `verificationStatus`, `trustScore`, `blockchainHash`,
    `createdAt`, `updatedAt`

#### `POST /api/v1/users/verify`

Submit a social account for verification and scoring. Scoring runs asynchronously but for the demo is executed inline.

- **Body**
  - `platform` (string)
  - `handle` (string)
  - `accountAge` (integer, months, >= 0)
  - `followers` (integer, >= 0)
  - `following` (integer, >= 0)
  - `posts` (integer, >= 0)
  - `profileComplete` (boolean)

- **Response 201**
  - Created `socialAccount` row (including `id` and initial scores).

#### `GET /api/v1/users/accounts/:id/result`

Fetch trust score and classification for a specific account owned by the user.

- **Params**
  - `id` – account id (UUID)

- **Response 200**
  - All `social_accounts` fields plus:
    - `classification` – `"GENUINE" | "SUSPICIOUS" | "HIGH_RISK" | "PENDING"`
    - `onChain` – boolean, whether the identity hash can be located in the chain.

---

### Admin Investigation (role: ADMIN)

All endpoints require a JWT with `role = "ADMIN"`.

#### `GET /api/v1/admin/stats`

High-level risk analytics.

- **Response 200**
  - `users` – total users
  - `accounts` – total social accounts
  - `alerts` – total alerts
  - `byClassification` – `{ genuine, suspicious, highRisk }`

#### `GET /api/v1/admin/accounts`

List accounts filtered by risk.

- **Query params**
  - `risk` – `"genuine" | "suspicious" | "high" | (optional for all)"`
  - `limit` – max rows (default 50, max 100)

- **Response 200**
  - Array of accounts with user info:
    - `...socialAccount`, `user: { id, name, email }`

#### `GET /api/v1/admin/alerts`

Recent high-risk and suspicious alerts.

- **Response 200**
  - Array of alerts with:
    - `id`, `accountId`, `riskLevel`, `reason`, `createdAt`
    - `account` – `{ platform, handle, user: { name, email } }`

#### `GET /api/v1/admin/activity`

Login activity timeline.

- **Response 200**
  - Array of logs:
    - `id`, `userId`, `loginTime`, `ipAddress`, `device`, `createdAt`
    - `user` – `{ name, email }`

#### `GET /api/v1/admin/blockchain`

Proxy for blockchain explorer data (same shape as `/blockchain/explorer`).

---

### Blockchain Explorer

No authentication required for read-only explorer endpoints.

#### `GET /api/v1/blockchain/explorer`

Return high-level chain state and full block list.

- **Response 200**
  - `length` – number of blocks
  - `valid` – boolean from integrity check
  - `blocks` – array of:
    - `index`, `timestamp`, `hash`, `previousHash`, `dataHash`, `nonce`
    - `data` – `{ identityHash, accountId? }`

#### `GET /api/v1/blockchain/blocks/:hash`

Fetch a single block by hash.

- **Response 200**
  - `BlockShape` JSON as stored on disk.

#### `GET /api/v1/blockchain/blocks/index/:index`

Fetch a block by index.

- **Params**
  - `index` – non-negative integer

- **Response 200**
  - Same as `/blocks/:hash`.

---

### Health

#### `GET /health`

Simple health probe.

- **Response 200**
  - `{ "status": "ok" }`

