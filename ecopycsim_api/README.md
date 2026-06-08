# ecopycsim_api

FastAPI bridge between the React dashboard and the EcoPyCSIM/MADDPG runtime.

## Run

Use Python `3.10.11` for the backend/simulation environment to avoid dependency compatibility issues.

From the repository root:

```bash
venv/bin/python run_api.py
```

Or run Uvicorn directly:

```bash
venv/bin/uvicorn ecopycsim_api.main:app --reload --host 127.0.0.1 --port 8000
```

API docs are available at `http://127.0.0.1:8000/docs`.

## Structure

```text
ecopycsim_api/
  main.py              FastAPI app, routes, CORS, WebSocket stream endpoint
  dashboard_runner.py  Run orchestration, parameter defaults, history/model storage
  __init__.py          Package marker
```

## Main Endpoints

- `GET /api/health` checks API status.
- `GET /api/dashboard/config` returns dashboard field definitions and defaults.
- `GET /api/models` lists saved trained models.
- `GET /api/runs/history` lists previous dashboard runs.
- `GET /api/runs/status` returns current run status.
- `POST /api/runs/start` starts random evaluation, training, or inference.
- `POST /api/runs/stop` stops the active run.
- `WS /api/runs/{run_id}/stream` streams live run events.

## Generated Data

Dashboard data is stored under `results/dashboard/`:

```text
results/dashboard/
  run_history.json
  models.json
  models/<RUN_ID>/
    maddpg.log
    model.pt
```

This folder is generated automatically and ignored by Git. If it does not exist, the API creates it and starts with empty model/history lists.

## Important

- Use Python `3.10.11`; newer Python versions may cause dependency issues with the simulation stack.
- Run the API from the repository root so imports and result paths resolve correctly.
- Inference requires a trained model listed in `results/dashboard/models.json` and its matching `model.pt`.
- The frontend expects the API at `http://localhost:8000` unless `VITE_API_BASE_URL` is set.
