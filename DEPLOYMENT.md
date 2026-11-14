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
3. Render reads `render.yaml` and creates:
   - **accounting-db** (PostgreSQL, free)
   - **accounting-backend** (Node API, free) — runs migrations on first boot
   - **accounting-frontend** (static site, free)
4. After the backend is live, open the frontend service's env var and set
   `VITE_API_URL` to `https://accounting-backend.onrender.com/api`
   (then redeploy the frontend so the URL is baked in).
5. Done — the app is online 24/7.

First login: `admin` / `admin12345`.

## Option B — Docker (any host / your own server)

```bash
docker compose up --build -d
```

- Backend API: `http://localhost:8000/api`
- PostgreSQL: bundled, data kept in a `pgdata` volume

For the frontend against this backend, build it with:

```bash
VITE_API_URL=http://your-server:8000/api npm run build
```

and serve `dist/` with any static host (Nginx, Vercel, Netlify, S3…).

## Environment variables (backend)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Full Postgres connection string (used by Render/Docker) |
| `SESSION_SECRET` | Cookie-signing secret (generate a long random value) |
| `PORT` | HTTP port (default 8000) |

## Applying migrations manually

```bash
cd backend
npm install
npm run migrate   # applies backend/sql/001…013 once
npm start         # API on :8000
```
