# ecopycsim-api

Simple FastAPI bridge for the dashboard.

Run it from the project root:

```bash
venv/bin/python run_api.py
```

Or run Uvicorn directly:

```bash
venv/bin/uvicorn ecopycsim_api.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend calls `http://localhost:8000` by default. Override it with:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Useful endpoints:

- `GET /api/health`
- `GET /api/runs/status`
- `POST /api/runs/start`
- `POST /api/runs/stop`

