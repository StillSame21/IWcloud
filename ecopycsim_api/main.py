from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ecopycsim_api.config import TERMINAL_EVENT_TYPES
from ecopycsim_api.runner import DashboardRunner
from ecopycsim_api.session import RunRequestError


class StartRunRequest(BaseModel):
  runType: str = Field(default='random')
  simParams: dict[str, Any] = Field(default_factory=dict)
  trainingParams: dict[str, Any] | None = None
  selectedModel: str | None = None


app = FastAPI(
  title='ecopycsim-api',
  version='0.1.0',
  description='Simple Uvicorn/FastAPI bridge for the EcoPyCSIM dashboard.',
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  allow_credentials=True,
  allow_methods=['*'],
  allow_headers=['*'],
)

runner = DashboardRunner()


def timestamp() -> str:
  return datetime.now().strftime('%H:%M:%S')


@app.get('/')
def root() -> dict[str, str]:
  return {
    'service': 'ecopycsim-api',
    'docs': '/docs',
    'health': '/api/health',
  }


@app.get('/api/health')
def health_check() -> dict[str, Any]:
  run_status = runner.get_status()
  return {
    'connected': True,
    'trainingStatus': run_status['status'].title(),
    'checkedAt': timestamp(),
    'activeRunId': run_status['activeRunId'],
  }


@app.get('/api/dashboard/config')
def dashboard_config() -> dict[str, Any]:
  return runner.config()


@app.get('/api/models')
def list_models() -> list[dict[str, Any]]:
  return runner.list_models()


@app.get('/api/runs/history')
def list_run_history() -> list[dict[str, Any]]:
  return runner.list_run_history()


@app.get('/api/runs/status')
def run_status() -> dict[str, Any]:
  return runner.get_status()


@app.post('/api/runs/start', status_code=status.HTTP_202_ACCEPTED)
async def start_run(payload: StartRunRequest) -> dict[str, Any]:
  try:
    session = await runner.start_run(payload.model_dump())
  except RunRequestError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={'message': error.message, **error.details},
    ) from error

  return {
    'accepted': True,
    'runId': session.run_id,
    'status': 'running',
    'streamUrl': f'/api/runs/{session.run_id}/stream',
    'payload': {
      'runType': session.run_type,
      'simParams': session.sim_params,
      'trainingParams': session.training_params,
      'selectedModel': session.selected_model,
    },
  }


@app.post('/api/runs/{run_id}/stop')
async def stop_run_by_id(run_id: str) -> dict[str, Any]:
  return await runner.stop_run(run_id)


@app.post('/api/runs/stop')
async def stop_run() -> dict[str, Any]:
  return await runner.stop_run()


@app.websocket('/api/runs/{run_id}/stream')
async def stream_run_events(websocket: WebSocket, run_id: str) -> None:
  await websocket.accept()
  session = runner.sessions.get(run_id)

  if not session:
    await websocket.send_json(
      {
        'type': 'run_error',
        'runId': run_id,
        'message': 'Run not found.',
      },
    )
    await websocket.close()
    return

  queue = session.subscribe()

  try:
    for event in session.events[:]:
      await websocket.send_json(event)
      if event.get('type') in TERMINAL_EVENT_TYPES:
        await websocket.close()
        return

    while True:
      event = await queue.get()
      await websocket.send_json(event)

      if event.get('type') in TERMINAL_EVENT_TYPES:
        await websocket.close()
        return
  except WebSocketDisconnect:
    return
  finally:
    session.unsubscribe(queue)
