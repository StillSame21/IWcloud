from datetime import datetime
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


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

runtime_state: dict[str, Any] = {
  'active_run_id': None,
  'last_payload': None,
  'started_at': None,
  'training_status': 'Idle',
}


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
  return {
    'connected': True,
    'trainingStatus': runtime_state['training_status'],
    'checkedAt': timestamp(),
    'activeRunId': runtime_state['active_run_id'],
  }


@app.get('/api/runs/status')
def run_status() -> dict[str, Any]:
  return {
    'status': runtime_state['training_status'].lower(),
    'activeRunId': runtime_state['active_run_id'],
    'startedAt': runtime_state['started_at'],
    'payload': runtime_state['last_payload'],
  }


@app.post('/api/runs/start', status_code=status.HTTP_202_ACCEPTED)
def start_run(payload: StartRunRequest) -> dict[str, Any]:
  run_id = f'LIVE-{uuid4().hex[:8].upper()}'
  payload_data = payload.model_dump()

  runtime_state.update(
    {
      'active_run_id': run_id,
      'last_payload': payload_data,
      'started_at': timestamp(),
      'training_status': 'Running',
    },
  )

  return {
    'accepted': True,
    'runId': run_id,
    'status': 'running',
    'payload': payload_data,
  }


@app.post('/api/runs/stop')
def stop_run() -> dict[str, Any]:
  stopped_run_id = runtime_state['active_run_id']

  runtime_state.update(
    {
      'active_run_id': None,
      'training_status': 'Idle',
    },
  )

  return {
    'stopped': True,
    'runId': stopped_run_id,
    'status': 'stopped',
  }

