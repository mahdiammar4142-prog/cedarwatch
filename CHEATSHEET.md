# CedarWatch cheatsheet

Daily commands to run the project on Windows (PowerShell).

## What talks to what

```
Browser  →  React (http://localhost:5173)
              ↓  /api proxy
            FastAPI (http://localhost:8000)
              ↓
            PostgreSQL (localhost:5432)
              +
            Supabase Auth (sign in / sign up)
```

| Piece | Folder | Port |
|---|---|---|
| Frontend | `frontend/` | 5173 |
| API | `backend/` | 8000 |
| Database | local PostgreSQL | 5432 |
| Agent | `agent/` | none (calls the API) |

---

## First-time setup (once)

### 1. Database

PostgreSQL must be running. Check:

```powershell
Get-Service postgresql*
```

If it is stopped:

```powershell
Start-Service postgresql-x64-18
```

(Service name may differ. Use whatever `Get-Service postgresql*` shows.)

Create the app database (once):

```powershell
& "D:\PostgreSQL\Data\bin\psql.exe" -U postgres
```

```sql
CREATE USER cedarwatch WITH PASSWORD 'cedarwatch';
CREATE DATABASE cedarwatch OWNER cedarwatch;
```

### 2. Backend Python env

```powershell
cd D:\1.Projects\CedarWatch\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env`:

```
DATABASE_URL=postgresql+psycopg://cedarwatch:cedarwatch@localhost:5432/cedarwatch
AGENT_API_KEY=cedarwatch-dev-agent-key
CORS_ORIGINS=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_JWT_SECRET=
```

`SUPABASE_URL` must be `https://<project-ref>.supabase.co`, not the dashboard URL. JWT secret can stay empty; the API verifies tokens via Supabase JWKS.

Seed sample outages (optional):

```powershell
python seed.py
```

### 3. Frontend

```powershell
cd D:\1.Projects\CedarWatch\frontend
npm install
copy .env.example .env
```

Edit `frontend/.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Use the **publishable** key. Never put the `sb_secret_...` key in the frontend.

---

## Start the project (every session)

Open **three** terminals (agent is optional).

### Terminal 1 — PostgreSQL

Usually already running. If the API cannot connect:

```powershell
Start-Service postgresql-x64-18
```

### Terminal 2 — API

```powershell
cd D:\1.Projects\CedarWatch\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Ready when you see: `Uvicorn running on http://127.0.0.1:8000`

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- `http://localhost:8000/` itself is 404 — that is normal

**Restart API:** click that terminal → **Ctrl+C** → run the `uvicorn` line again. Needed after changing `backend/.env`. `--reload` restarts on Python file saves.

### Terminal 3 — Frontend

```powershell
cd D:\1.Projects\CedarWatch\frontend
npm run dev
```

Open http://localhost:5173

**Restart frontend:** **Ctrl+C**, then `npm run dev` again. Needed after changing `frontend/.env`.

### Terminal 4 — Monitoring agent (optional)

```powershell
cd D:\1.Projects\CedarWatch\agent
$env:AGENT_ID="beirut-home"
$env:AGENT_API_KEY="cedarwatch-dev-agent-key"
$env:CEDARWATCH_API_URL="http://localhost:8000"
$env:AGENT_LAT="33.8938"
$env:AGENT_LNG="35.5018"
$env:AGENT_AREA="Hamra, Beirut"
python main.py
```

`AGENT_API_KEY` must match `AGENT_API_KEY` in `backend/.env`.

---

## Auth (Supabase)

1. Create a project at https://supabase.com
2. **Authentication → Email:** enable Email. For local testing, turn **Confirm email** off.
3. **Settings → API Keys**
   - **Publishable key** → `frontend/.env` `VITE_SUPABASE_ANON_KEY`
   - Do **not** use **Secret keys** in this app
4. **Settings → JWT Keys** — you do not need to copy the ECC key. FastAPI loads it automatically from `SUPABASE_URL`.
5. Restart API and frontend after env changes.

Sign up / sign in: http://localhost:5173/signup and http://localhost:5173/login

Dashboard and map are public. Reporting and confirming require a signed-in user.

---

## Order that matters

1. PostgreSQL running  
2. API on port 8000  
3. Frontend on port 5173  

If the frontend starts first, the map still opens, but incidents fail until the API is up. Refresh the page.

---

## Quick troubleshooting

| Problem | Fix |
|---|---|
| `password authentication failed` for Postgres | Wrong `DATABASE_URL` user/password |
| API 503 / auth not configured | Set `SUPABASE_URL` in `backend/.env` to `https://xxxx.supabase.co` |
| Sign in button disabled / yellow banner | Fill `frontend/.env` publishable key + URL, restart Vite |
| Report/confirm “Invalid or expired session” | Restart API after auth code/env changes; sign in again |
| Port 5173 in use | Stop the other Vite process, or use the port Vite prints |
| Map empty / “Failed to load” | Start the API, then refresh |
| Email confirmation required | Turn off Confirm email in Supabase for local testing |

---

## Useful paths

```
D:\1.Projects\CedarWatch\backend\.env
D:\1.Projects\CedarWatch\frontend\.env
D:\PostgreSQL\Data\bin\psql.exe
```
