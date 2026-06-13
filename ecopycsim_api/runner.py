"""Run orchestration: session lifecycle, validation, and result persistence."""

import asyncio
from datetime import datetime
from typing import Any
from uuid import uuid4

from ecopycsim_api import executors
from ecopycsim_api.config import (
  DASHBOARD_RESULTS_DIR,
  DEFAULT_SIMULATION_PARAMS,
  DEFAULT_TRAINING_PARAMS,
  MODELS_DIR,
  MODELS_FILE,
  RUN_HISTORY_FILE,
  RUN_TYPE_LABELS,
  RUN_TYPES,
  SIMULATION_PARAMETER_FIELDS,
  TRAINING_PARAMETER_FIELDS,
)
from ecopycsim_api.metrics import build_evaluation_results, build_training_results
from ecopycsim_api.naming import (
  get_next_evaluation_display_name,
  get_next_model_name,
  public_model,
  with_evaluation_display_names,
  with_simple_model_names,
)
from ecopycsim_api.params import normalize_sim_params, normalize_training_params
from ecopycsim_api.session import RunRequestError, RunSession
from ecopycsim_api.storage import load_json_file, write_json_file


class DashboardRunner:
  def __init__(self) -> None:
    DASHBOARD_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    self.sessions: dict[str, RunSession] = {}
    self.active_run_id: str | None = None
    self.run_history: list[dict[str, Any]] = load_json_file(RUN_HISTORY_FILE, [])
    self.models: list[dict[str, Any]] = load_json_file(MODELS_FILE, [])

  def config(self) -> dict[str, Any]:
    return {
      'runTypes': RUN_TYPES,
      'simulationParams': DEFAULT_SIMULATION_PARAMS,
      'trainingParams': DEFAULT_TRAINING_PARAMS,
      'simulationParameterFields': SIMULATION_PARAMETER_FIELDS,
      'trainingParameterFields': TRAINING_PARAMETER_FIELDS,
      'agentMetadata': {
        'numberOfAgents': 2,
        'agents': ['server_farm', 'server'],
      },
    }

  def list_models(self) -> list[dict[str, Any]]:
    return [public_model(model) for model in with_simple_model_names(self.models)]

  def get_model(self, model_id: str | None) -> dict[str, Any] | None:
    if not model_id:
      return None

    return next((model for model in self.models if model.get('id') == model_id), None)

  def list_run_history(self) -> list[dict[str, Any]]:
    return with_evaluation_display_names(self.run_history)

  def get_status(self) -> dict[str, Any]:
    active_session = self.sessions.get(self.active_run_id or '')
    return {
      'status': active_session.status if active_session else 'idle',
      'activeRunId': self.active_run_id,
      'startedAt': active_session.started_at if active_session else None,
      'runType': active_session.run_type if active_session else None,
    }

  async def start_run(self, payload: dict[str, Any]) -> RunSession:
    if self.active_run_id:
      active_session = self.sessions.get(self.active_run_id)
      if (
        active_session
        and active_session.status in {'pending', 'running'}
        and not active_session.stop_requested
      ):
        raise RunRequestError('A run is already active.', status_code=409)

    run_type = payload.get('runType') or 'random'
    if run_type not in RUN_TYPE_LABELS:
      raise RunRequestError(f'Unsupported run type: {run_type}')

    sim_params = normalize_sim_params(payload.get('simParams'))
    training_params = (
      normalize_training_params(payload.get('trainingParams'))
      if run_type == 'training'
      else None
    )
    selected_model = payload.get('selectedModel') if run_type == 'inference' else None

    if run_type == 'inference':
      self._validate_model_for_simulation(selected_model, sim_params)

    run_id = f'LIVE-{uuid4().hex[:8].upper()}'
    session = RunSession(
      run_id=run_id,
      run_type=run_type,
      sim_params=sim_params,
      training_params=training_params,
      selected_model=selected_model,
      status='pending',
    )

    self.sessions[run_id] = session
    self.active_run_id = run_id
    session.task = asyncio.create_task(self._execute_session(session))
    return session

  async def stop_run(self, run_id: str | None = None) -> dict[str, Any]:
    target_run_id = run_id or self.active_run_id
    session = self.sessions.get(target_run_id or '')

    if not session:
      return {'stopped': False, 'runId': target_run_id, 'status': 'not_found'}

    session.stop_requested = True
    if session.status in {'pending', 'running'}:
      session.status = 'stopping'

    if self.active_run_id == session.run_id:
      self.active_run_id = None

    return {'stopped': True, 'runId': session.run_id, 'status': 'stopping'}

  def _validate_model_for_simulation(self, model_id: str | None, sim_params: dict[str, Any]) -> None:
    model = self.get_model(model_id)
    if not model:
      raise RunRequestError('Select a trained model before evaluating a trained policy.')

    topology = model.get('topology', {})
    mismatches = [
      key
      for key in ('numberOfServerFarms', 'numberOfServers', 'numberOfVmTypes')
      if int(sim_params.get(key, 0)) != int(topology.get(key, -1))
    ]

    if mismatches:
      raise RunRequestError(
        'Selected model topology does not match the simulation topology.',
        details={'topology': topology, 'lockedFields': mismatches},
      )

  async def _execute_session(self, session: RunSession) -> None:
    try:
      session.status = 'running'
      await session.publish(
        'run_started',
        {
          'run': {
            'id': session.run_id,
            'type': session.run_type,
            'label': RUN_TYPE_LABELS[session.run_type],
            'startedAt': session.started_at,
          },
          'simParams': session.sim_params,
          'trainingParams': session.training_params,
          'selectedModel': session.selected_model,
        },
      )

      if session.run_type == 'training':
        await executors.run_training(self, session)
      else:
        await executors.run_evaluation(self, session)
    except Exception as error:
      session.status = 'error'
      await session.publish('run_error', {'message': str(error)})
    finally:
      if self.active_run_id == session.run_id:
        self.active_run_id = None

  def append_model_metadata(self, session: RunSession) -> dict[str, Any]:
    assert session.training_params is not None
    model_id = f'maddpg-{session.run_id.lower()}'
    created_at = datetime.now().isoformat(timespec='seconds')
    model_metadata = {
      'id': model_id,
      'name': get_next_model_name(self.models),
      'createdAt': created_at,
      'runId': session.run_id,
      'topology': {
        'numberOfServerFarms': session.sim_params['numberOfServerFarms'],
        'numberOfServers': session.sim_params['numberOfServers'],
        'numberOfVmTypes': session.sim_params['numberOfVmTypes'],
      },
      'simParams': session.sim_params,
      'trainingParams': session.training_params,
      'modelPath': str(MODELS_DIR / session.run_id / 'model.pt'),
    }
    self.models = [model for model in self.models if model.get('id') != model_id]
    self.models.insert(0, model_metadata)
    write_json_file(MODELS_FILE, self.models)
    return model_metadata

  def append_evaluation_history(
    self,
    session: RunSession,
    summary: dict[str, Any],
  ) -> dict[str, Any]:
    run_type_label = RUN_TYPE_LABELS[session.run_type]
    history_entry = {
      'id': session.run_id,
      'displayName': get_next_evaluation_display_name(
        self.run_history,
        run_type_label,
      ),
      'type': run_type_label,
      'dateTime': datetime.now().strftime('%Y-%m-%d %H:%M'),
      'parameters': {
        **session.sim_params,
        **({'selectedModel': session.selected_model} if session.selected_model else {}),
      },
      'metrics': session.live_metrics,
      'summary': summary,
      'evaluationResults': build_evaluation_results(
        session.live_metrics,
        session.sim_params,
        session.latest_heatmap,
      ),
    }
    self._append_history_entry(history_entry)
    return history_entry

  def append_training_history(
    self,
    session: RunSession,
    summary: dict[str, Any],
  ) -> dict[str, Any]:
    assert session.training_params is not None
    history_entry = {
      'id': session.run_id,
      'runType': session.run_type,
      'type': RUN_TYPE_LABELS[session.run_type],
      'dateTime': datetime.now().strftime('%Y-%m-%d %H:%M'),
      'parameters': {
        **session.sim_params,
        'training': session.training_params,
      },
      'metrics': session.live_metrics,
      'summary': summary,
      'trainingResults': build_training_results(
        session.episode_metrics,
        session.sim_params,
        session.training_params['episodes'],
        session.latest_heatmap,
      ),
    }
    self._append_history_entry(history_entry)
    return history_entry

  def _append_history_entry(self, history_entry: dict[str, Any]) -> None:
    self.run_history = [
      existing
      for existing in self.run_history
      if existing.get('id') != history_entry['id']
    ]
    self.run_history.insert(0, history_entry)
    write_json_file(RUN_HISTORY_FILE, self.run_history)
