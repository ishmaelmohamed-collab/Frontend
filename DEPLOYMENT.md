# Deploying the full system online (always-on)

This repo now contains **everything**: the React frontend (root), the Node.js
backend (`backend/`), and the PostgreSQL schema + seed (`backend/sql/`).

```
Frontend/
├── src/                # React frontend (Vite)
├── backend/
│   ├── src/            # Express + double-entry ledger
│   ├── sql/            # migrations 001–013 (+ schema)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml  # PostgreSQL + backend (one command)
└── render.yaml         # Render blueprint (free hosting)
```

## Option A — Render (free, recommended)

1. Push this repo to GitHub.
2. Go to <https://render.com> → **New → Blueprint** and pick this repo.
3. Render asks for **ADMIN_PASSWORD** — choose a strong password (10+ characters) for the first Owner account.
4. Render reads `render.yaml` and creates:
   - **accounting-db** (PostgreSQL, free)
   - **accounting-backend** (Node API, free) — runs migrations on first boot
   - **accounting-frontend** (static site, free)
5. If Render gives the services different addresses than the names in `render.yaml`, update
   `VITE_API_URL` (frontend) and `CORS_ORIGIN` (backend) to the real addresses and redeploy both.
6. Done — the app is online.

First login: `admin` with the ADMIN_PASSWORD you chose. If you left it empty, a random password is
written **once** to the backend's log on first start. There is no built-in default password.
Free Render services sleep after 15 minutes without visits; the first visit after that takes about a minute.

## Option B — Docker (any host / your own server)

Create a `.env` file next to `docker-compose.yml` with `DB_PASSWORD`, `SESSION_SECRET` (32+ random
characters), `CORS_ORIGIN` (the frontend address) and optionally `ADMIN_PASSWORD`, then:

```bash
docker compose up --build -d
```

- Backend API: `http://localhost:8000/api`
- PostgreSQL: bundled, data kept in a `pgdata` volume

For the frontend against this backend, build it with:

```bash
VITE_USE_MOCKS=false VITE_API_URL=http://your-server:8000/api npm run build
```

and serve `dist/` with any static host (Nginx, Vercel, Netlify, S3…).

## Environment variables (backend)

| Var                                 | Purpose                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Full Postgres connection string (used by Render/Docker)                                                        |
| `SESSION_SECRET`                    | Cookie-signing secret — 32+ random characters (the server refuses to start in production without it)           |
| `CORS_ORIGIN`                       | Frontend address(es) allowed to call the API with the sign-in cookie, comma-separated (required in production) |
| `COOKIE_SAMESITE`                   | `none` when frontend and API are on different HTTPS domains (production default), `lax` for local/same-domain  |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | First Owner account, created once when there are no users. Empty password = random one printed once in the log |
| `PORT`                              | HTTP port (default 8000)                                                                                       |

## Applying migrations manually

```bash
cd backend
npm install
npm run migrate   # applies backend/sql/001…013 once
npm start         # API on :8000
```
