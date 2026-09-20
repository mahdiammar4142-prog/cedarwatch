# CedarWatch

Lebanon infrastructure monitoring platform. People report electricity, internet, and water outages; the system clusters nearby reports, scores confidence, and shows results on a live map and dashboard.

Daily start commands: see [CHEATSHEET.md](CHEATSHEET.md). Future feature ideas: [FUTURE.md](FUTURE.md).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Backend | Python FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| Map | Leaflet |
| Agent | Python (`agent/main.py`) |

## Project layout

```
frontend/     React UI (dashboard + map)
backend/      FastAPI API and outage logic
agent/        Internet monitoring agent
docker-compose.yml   PostgreSQL
```

## Run locally

### 1. Start PostgreSQL

```powershell
docker compose up -d
```

Default connection: `postgresql://cedarwatch:cedarwatch@localhost:5432/cedarwatch`

### 2. Start the Python API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

In another terminal, seed sample incidents:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python seed.py
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Start the React app

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the FastAPI server on port 8000.

## Auth (Supabase)

Reporting and confirming outages requires an account. Dashboard and map viewing stay public.

1. Create a project at [https://supabase.com](https://supabase.com).
2. In **Authentication → Providers**, keep Email enabled.
3. For local testing, turn off **Confirm email** under **Authentication → Providers → Email** (or **Authentication → Sign In / Providers**).
4. Copy keys from **Project Settings → API**:
   - Frontend `VITE_SUPABASE_URL` = Project URL
   - Frontend `VITE_SUPABASE_ANON_KEY` = `anon` `public` key
   - Backend `SUPABASE_JWT_SECRET` = JWT Secret (under **API** / **JWT Keys**)
   - Backend `SUPABASE_URL` = Project URL
5. Put those values in `frontend/.env` and `backend/.env`, then restart both servers.

Do not commit real keys.

### 4. Optional monitoring agent

```powershell
cd agent
$env:AGENT_ID="beirut-home"
$env:AGENT_API_KEY="cedarwatch-dev-agent-key"
$env:CEDARWATCH_API_URL="http://localhost:8000"
$env:AGENT_LAT="33.8938"
$env:AGENT_LNG="35.5018"
$env:AGENT_AREA="Hamra, Beirut"
python main.py
```

If two or more agents in the same ~2 km area fail within 10 minutes, the API creates or updates a possible internet outage.

## How outages are scored

| Level | Typical signals |
|---|---|
| Unverified | 1 report, no confirmations |
| Possible | 2+ reports, confirmations, or 2 agent failures |
| Likely | 3+ reports with confirmations, or mixed strong signals |
| Confirmed | 5+ reports with 3+ confirmations, or 3+ agents failing |

Nearby reports of the same type within 2 km are grouped into one incident.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/me` | GET | Current user (Bearer token) |
| `/api/reports` | GET, POST | List reports; create requires auth |
| `/api/reports/{id}/confirm` | POST | Confirm a report (auth) |
| `/api/incidents` | GET | List incidents (`?status=ACTIVE`) |
| `/api/incidents/{id}/confirm` | POST | Confirm an incident (auth) |
| `/api/incidents/{id}/resolve` | POST | Mark resolved (auth) |
| `/api/stats` | GET | Dashboard statistics |
| `/api/agent/check` | POST | Agent telemetry (`x-agent-key` header) |

## License

MIT
