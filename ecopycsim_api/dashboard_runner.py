import asyncio
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from statistics import mean
from typing import Any
from uuid import uuid4

os.environ.setdefault('MPLCONFIGDIR', '/tmp/matplotlib')
Path(os.environ['MPLCONFIGDIR']).mkdir(parents=True, exist_ok=True)

from env.cloud_scheduling_v0 import CloudSchedulingEnv
from schedulers.marl.maddpg.MADDPG import MADDPG


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DASHBOARD_RESULTS_DIR = PROJECT_ROOT / 'results' / 'dashboard'
RUN_HISTORY_FILE = DASHBOARD_RESULTS_DIR / 'run_history.json'
MODELS_FILE = DASHBOARD_RESULTS_DIR / 'models.json'
MODELS_DIR = DASHBOARD_RESULTS_DIR / 'models'

TERMINAL_EVENT_TYPES = {'run_completed', 'run_stopped', 'run_error'}

DEFAULT_SIMULATION_PARAMS: dict[str, Any] = {
  'numberOfJobs': 100,
  'numberOfTasks': 800,
  'numberOfServerFarms': 2,
  'numberOfServers': 30,
  'jobArrivalLambda': 0.5,
  'taskArrivalMu': 5,
  'taskArrivalVariance': 1.6,
  'requestCpuRange': [0, 1],
  'requestRamRange': [0, 1],
  'numberOfVmTypes': 10,
  'energyCoeffAlpha': 0.5,
  'energyCoeffBeta': 10,
  'optimalUtilizationRate': 0.7,
  'staticPower': 0.035,
}

DEFAULT_TRAINING_PARAMS: dict[str, Any] = {
  'episodes': 1000,
  'numberOfAgents': 2,
  'networkArchitecture': 'MLP(64,64)',
  'memorySize': 100000,
  'batchSize': 1024,
  'randomSteps': 'jobs x 0.1',
  'criticLearningRate': 0.0005,
  'actorLearningRate': 0.0005,
  'discountFactor': 0.9,
  'targetUpdateSteps': 5,
  'optimizer': 'Adam',
  'tau': 0.1,
}

SIMULATION_PARAMETER_FIELDS: list[dict[str, Any]] = [
  {
    'key': 'numberOfJobs',
    'label': 'Number of Jobs',
    'control': 'select',
    'options': [50, 100, 300, 500],
  },
  {
    'key': 'numberOfTasks',
    'label': 'Number of Tasks',
    'control': 'select',
    'options': [600, 800, 3600, 9000],
  },
  {
    'key': 'numberOfServerFarms',
    'label': 'Number of Server Farms',
    'control': 'select',
    'options': [2, 5, 10],
  },
  {
    'key': 'numberOfServers',
    'label': 'Number of Servers',
    'control': 'select',
    'options': [5, 30, 100],
  },
  {
    'key': 'jobArrivalLambda',
    'label': 'Job Arrival Time Lambda',
    'control': 'slider',
    'min': 0.1,
    'max': 2,
    'step': 0.1,
  },
  {'key': 'taskArrivalMu', 'label': 'Task Arrival Mu', 'control': 'number', 'step': 0.1},
  {
    'key': 'taskArrivalVariance',
    'label': 'Task Arrival Variance',
    'control': 'number',
    'step': 0.1,
  },
  {
    'key': 'requestCpuRange',
    'label': 'Request CPU Range',
    'control': 'dualRange',
    'min': 0,
    'max': 1,
    'step': 0.05,
  },
  {
    'key': 'requestRamRange',
    'label': 'Request RAM Range',
    'control': 'dualRange',
    'min': 0,
    'max': 1,
    'step': 0.05,
  },
  {'key': 'numberOfVmTypes', 'label': 'Number of VM Types', 'control': 'number', 'min': 1},
  {
    'key': 'energyCoeffAlpha',
    'label': 'Energy Coeff Alpha',
    'control': 'slider',
    'min': 0.3,
    'max': 0.8,
    'step': 0.05,
  },
  {'key': 'energyCoeffBeta', 'label': 'Energy Coeff Beta', 'control': 'number'},
  {
    'key': 'optimalUtilizationRate',
    'label': 'Optimal Utilization Rate',
    'control': 'slider',
    'min': 0,
    'max': 1,
    'step': 0.05,
  },
  {'key': 'staticPower', 'label': 'Static Power', 'control': 'number', 'step': 0.001},
]

TRAINING_PARAMETER_FIELDS: list[dict[str, Any]] = [
  {'key': 'episodes', 'label': 'Episodes', 'control': 'number', 'min': 1},
  {
    'key': 'numberOfAgents',
    'label': 'Number of Agents',
    'control': 'number',
    'readOnly': True,
    'hint': 'Backend fixed: server_farm and server',
  },
  {
    'key': 'networkArchitecture',
    'label': 'Network Architecture',
    'control': 'select',
    'options': ['MLP(64,64)', 'MLP(128,128)', 'MLP(256,256)'],
  },
  {'key': 'memorySize', 'label': 'Memory Size', 'control': 'number', 'min': 1},
  {'key': 'batchSize', 'label': 'Batch Size', 'control': 'number', 'min': 1},
  {
    'key': 'randomSteps',
    'label': 'Random Steps',
    'control': 'text',
    'hint': 'Example: jobs x 0.1',
  },
  {
    'key': 'criticLearningRate',
    'label': 'Critic Learning Rate',
    'control': 'number',
    'step': 0.0001,
  },
  {
    'key': 'actorLearningRate',
    'label': 'Actor Learning Rate',
    'control': 'number',
    'step': 0.0001,
  },
  {
    'key': 'discountFactor',
    'label': 'Discount Factor Gamma',
    'control': 'slider',
    'min': 0,
    'max': 1,
    'step': 0.01,
  },
  {'key': 'targetUpdateSteps', 'label': 'Target Update Steps', 'control': 'number', 'min': 1},
  {
    'key': 'optimizer',
    'label': 'Optimizer',
    'control': 'select',
    'options': ['Adam', 'SGD', 'RMSProp'],
  },
  {
    'key': 'tau',
    'label': 'Tau',
    'control': 'slider',
    'min': 0,
    'max': 1,
    'step': 0.01,
  },
]

RUN_TYPES: list[dict[str, str]] = [
  {
    'id': 'random',
    'label': 'Evaluation Random Algorithm',
    'description': 'Evaluate EcoPyCSIM with stochastic scheduling inputs.',
  },
  {
    'id': 'training',
    'label': 'Train Model',
    'description': 'Configure MADDPG and simulation parameters together.',
  },
  {
    'id': 'inference',
    'label': 'Evaluated Trained Model',
    'description': 'Evaluate a saved policy model for scheduling decisions.',
  },
]

RUN_TYPE_LABELS = {run_type['id']: run_type['label'] for run_type in RUN_TYPES}
EVALUATION_DISPLAY_PREFIXES = {
  RUN_TYPE_LABELS['random']: 'Random Evaluation',
  RUN_TYPE_LABELS['inference']: 'MADDPG Evaluation',
}


def get_evaluation_display_prefix(run_type_label: str | None) -> str | None:
  return EVALUATION_DISPLAY_PREFIXES.get(run_type_label or '')


def with_evaluation_display_names(run_history: list[dict[str, Any]]) -> list[dict[str, Any]]:
  counts = {run_type: 0 for run_type in EVALUATION_DISPLAY_PREFIXES}
  named_entries: dict[int, dict[str, Any]] = {}

  for index in range(len(run_history) - 1, -1, -1):
    entry = run_history[index]
    run_type = entry.get('type')
    prefix = get_evaluation_display_prefix(run_type)

    if not prefix or not entry.get('evaluationResults'):
      continue

    counts[run_type] += 1
    named_entries[index] = {
      **entry,
      'displayName': entry.get('displayName') or f'{prefix}-{counts[run_type]}',
    }

  return [
    named_entries.get(index, entry)
    for index, entry in enumerate(run_history)
  ]


def get_next_evaluation_display_name(
  run_history: list[dict[str, Any]],
  run_type_label: str,
) -> str | None:
  prefix = get_evaluation_display_prefix(run_type_label)

  if not prefix:
    return None

  completed_count = sum(
    1
    for entry in run_history
    if entry.get('type') == run_type_label and entry.get('evaluationResults')
  )
  return f'{prefix}-{completed_count + 1}'


def with_simple_model_names(models: list[dict[str, Any]]) -> list[dict[str, Any]]:
  named_models: dict[int, dict[str, Any]] = {}

  for sequence, index in enumerate(range(len(models) - 1, -1, -1), start=1):
    model = models[index]
    named_models[index] = {
      **model,
      'name': model.get('name') if str(model.get('name', '')).startswith('Model ') else f'Model {sequence}',
    }

  return [
    named_models.get(index, model)
    for index, model in enumerate(models)
  ]


def get_next_model_name(models: list[dict[str, Any]]) -> str:
  return f'Model {len(models) + 1}'


class RunRequestError(Exception):
  def __init__(self, message: str, status_code: int = 400, details: dict[str, Any] | None = None):
    super().__init__(message)
    self.message = message
    self.status_code = status_code
    self.details = details or {}


@dataclass
class RunSession:
  run_id: str
  run_type: str
  sim_params: dict[str, Any]
  training_params: dict[str, Any] | None
  selected_model: str | None
  status: str = 'pending'
  started_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))
  events: list[dict[str, Any]] = field(default_factory=list)
  subscribers: set[asyncio.Queue] = field(default_factory=set)
  stop_requested: bool = False
  sequence: int = 0
  task: asyncio.Task | None = None
  live_metrics: list[dict[str, Any]] = field(default_factory=list)
  episode_metrics: list[dict[str, Any]] = field(default_factory=list)
  latest_heatmap: dict[str, Any] | None = None

  async def publish(self, event_type: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    self.sequence += 1
    event = {
      'type': event_type,
      'runId': self.run_id,
      'sequence': self.sequence,
      'emittedAt': datetime.now().isoformat(timespec='seconds'),
      **(data or {}),
    }
    self.events.append(event)

    for queue in list(self.subscribers):
      await queue.put(event)

    return event

  def subscribe(self) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    self.subscribers.add(queue)
    return queue

  def unsubscribe(self, queue: asyncio.Queue) -> None:
    self.subscribers.discard(queue)


def _load_json_file(path: Path, default: Any) -> Any:
  if not path.exists():
    return default

  try:
    return json.loads(path.read_text(encoding='utf-8'))
  except (OSError, json.JSONDecodeError):
    return default


def _write_json_file(path: Path, data: Any) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  temp_path = path.with_suffix(f'{path.suffix}.tmp')
  temp_path.write_text(json.dumps(data, indent=2), encoding='utf-8')
  temp_path.replace(path)


def _round(value: float | int | None, digits: int = 2) -> float:
  if value is None:
    return 0.0
  return round(float(value), digits)


def _coerce_int(value: Any, default: int, minimum: int = 0) -> int:
  try:
    coerced = int(float(value))
  except (TypeError, ValueError):
    coerced = default
  return max(minimum, coerced)


def _coerce_float(value: Any, default: float, minimum: float | None = None) -> float:
  try:
    coerced = float(value)
  except (TypeError, ValueError):
    coerced = default

  if minimum is not None:
    coerced = max(minimum, coerced)

  return coerced


def _coerce_range(value: Any, default: list[float]) -> list[float]:
  if not isinstance(value, (list, tuple)) or len(value) != 2:
    return default[:]

  low = _coerce_float(value[0], default[0], 0)
  high = _coerce_float(value[1], default[1], 0)

  if high < low:
    low, high = high, low

  return [min(low, 1), min(high, 1)]


def normalize_sim_params(params: dict[str, Any] | None) -> dict[str, Any]:
  incoming = params or {}
  resolved = {**DEFAULT_SIMULATION_PARAMS, **incoming}
  resolved['numberOfJobs'] = _coerce_int(resolved.get('numberOfJobs'), 100, 1)
  resolved['numberOfTasks'] = _coerce_int(resolved.get('numberOfTasks'), 800, resolved['numberOfJobs'])
  resolved['numberOfServerFarms'] = _coerce_int(resolved.get('numberOfServerFarms'), 2, 1)
  resolved['numberOfServers'] = _coerce_int(
    resolved.get('numberOfServers'),
    30,
    resolved['numberOfServerFarms'],
  )
  resolved['jobArrivalLambda'] = _coerce_float(resolved.get('jobArrivalLambda'), 0.5, 0.001)
  resolved['taskArrivalMu'] = _coerce_float(resolved.get('taskArrivalMu'), 5, 0.001)
  resolved['taskArrivalVariance'] = _coerce_float(resolved.get('taskArrivalVariance'), 1.6, 0)
  resolved['requestCpuRange'] = _coerce_range(resolved.get('requestCpuRange'), [0, 1])
  resolved['requestRamRange'] = _coerce_range(resolved.get('requestRamRange'), [0, 1])
  resolved['numberOfVmTypes'] = _coerce_int(resolved.get('numberOfVmTypes'), 10, 1)
  resolved['energyCoeffAlpha'] = _coerce_float(resolved.get('energyCoeffAlpha'), 0.5, 0)
  resolved['energyCoeffBeta'] = _coerce_float(resolved.get('energyCoeffBeta'), 10, 0)
  resolved['optimalUtilizationRate'] = _coerce_float(
    resolved.get('optimalUtilizationRate'),
    0.7,
    0,
  )
  resolved['staticPower'] = _coerce_float(resolved.get('staticPower'), 0.035, 0)
  return resolved


def normalize_training_params(params: dict[str, Any] | None) -> dict[str, Any]:
  incoming = params or {}
  resolved = {**DEFAULT_TRAINING_PARAMS, **incoming}
  resolved['episodes'] = _coerce_int(resolved.get('episodes'), 1000, 1)
  resolved['numberOfAgents'] = 2
  resolved['memorySize'] = _coerce_int(resolved.get('memorySize'), 100000, 1)
  resolved['batchSize'] = _coerce_int(resolved.get('batchSize'), 1024, 1)
  resolved['criticLearningRate'] = _coerce_float(resolved.get('criticLearningRate'), 0.0005, 0)
  resolved['actorLearningRate'] = _coerce_float(resolved.get('actorLearningRate'), 0.0005, 0)
  resolved['discountFactor'] = _coerce_float(resolved.get('discountFactor'), 0.9, 0)
  resolved['targetUpdateSteps'] = _coerce_int(resolved.get('targetUpdateSteps'), 5, 1)
  resolved['tau'] = _coerce_float(resolved.get('tau'), 0.1, 0)
  resolved['optimizer'] = resolved.get('optimizer') or 'Adam'
  resolved['networkArchitecture'] = resolved.get('networkArchitecture') or 'MLP(64,64)'
  resolved['randomSteps'] = resolved.get('randomSteps') or 'jobs x 0.1'
  return resolved


def parse_hidden_dims(network_architecture: str) -> tuple[int, ...]:
  hidden_dims = tuple(int(value) for value in re.findall(r'\d+', network_architecture or ''))
  return hidden_dims or (64, 64)


def parse_random_steps(value: Any, number_of_jobs: int) -> int:
  if isinstance(value, (int, float)):
    return max(0, int(value))

  text = str(value or '').lower().replace('x', '*')
  multiplier_match = re.search(r'jobs\s*\*\s*([0-9.]+)', text)
  if multiplier_match:
    return max(0, int(number_of_jobs * float(multiplier_match.group(1))))

  number_match = re.search(r'[0-9.]+', text)
  if number_match:
    return max(0, int(float(number_match.group(0))))

  return max(0, int(number_of_jobs * 0.1))


def get_training_phase(episode: int, total_episodes: int) -> str:
  progress = episode / max(total_episodes, 1)

  if progress < 0.1:
    return 'Warm-up'
  if progress < 0.35:
    return 'Exploration'
  if progress < 0.7:
    return 'Convergence'
  return 'Stable'


def get_dim_info(env: CloudSchedulingEnv) -> dict[str, dict[str, Any]]:
  dim_info = {}

  for agent_id in env.agents:
    obs_space = env.observation_space(agent_id)
    obs_shape = {key: space.shape for key, space in obs_space.spaces.items()}
    action_dim = env.action_space(agent_id).n
    dim_info[agent_id] = {
      'obs_shape': obs_shape,
      'action_dim': action_dim,
    }

  return dim_info


def build_env(sim_params: dict[str, Any]) -> CloudSchedulingEnv:
  return CloudSchedulingEnv(
    sim_params['numberOfJobs'],
    sim_params['numberOfServerFarms'],
    sim_params['numberOfServers'],
    num_tasks=sim_params['numberOfTasks'],
    job_arrival_lambda=sim_params['jobArrivalLambda'],
    task_arrival_mu=sim_params['taskArrivalMu'],
    task_arrival_variance=sim_params['taskArrivalVariance'],
    request_cpu_range=sim_params['requestCpuRange'],
    request_ram_range=sim_params['requestRamRange'],
    num_vm_types=sim_params['numberOfVmTypes'],
    energy_alpha=sim_params['energyCoeffAlpha'],
    energy_beta=sim_params['energyCoeffBeta'],
    optimal_utilization_rate=sim_params['optimalUtilizationRate'],
    static_power=sim_params['staticPower'],
    show_progress=False,
  )


def capture_cpu_sample(env: CloudSchedulingEnv) -> list[list[float]]:
  return [
    [
      _round(server.cpu_utilization_rate, 2)
      for server in server_farm.servers.values()
    ]
    for server_farm in env.server_farms.values()
  ]


def build_average_heatmap(
  samples: list[list[list[float]]],
  sim_params: dict[str, Any],
) -> dict[str, Any]:
  if not samples:
    return {
      'optimalRate': _round(sim_params['optimalUtilizationRate'], 2),
      'farms': [],
    }

  farm_count = max(len(sample) for sample in samples)
  farms = []

  for farm_index in range(farm_count):
    server_count = max(
      (len(sample[farm_index]) for sample in samples if farm_index < len(sample)),
      default=0,
    )
    farm_values = []

    for server_index in range(server_count):
      server_samples = [
        sample[farm_index][server_index]
        for sample in samples
        if farm_index < len(sample) and server_index < len(sample[farm_index])
      ]
      farm_values.append(_round(mean(server_samples), 2) if server_samples else 0)

    farms.append(farm_values)

  return {
    'optimalRate': _round(sim_params['optimalUtilizationRate'], 2),
    'farms': farms,
  }


def build_step_metric(
  env: CloudSchedulingEnv,
  info: dict[str, Any],
  step: int,
  episode: int = 1,
) -> dict[str, Any]:
  server_farm_info = info.get('server_farm', {})
  rejected_jobs = len(server_farm_info.get('rejected_job_ids', []))
  rejected_tasks = server_farm_info.get('rejected_tasks_count', 0)
  wall_time = _round(server_farm_info.get('wall_time'), 3)
  energy_cost = _round(server_farm_info.get('price'), 4)

  return {
    'step': step,
    'episode': episode,
    'wallTime': wall_time,
    'stepTime': wall_time,
    'energyCost': energy_cost,
    'totalEnergyCost': energy_cost,
    'rejectedJobs': rejected_jobs,
    'rejectedTasks': rejected_tasks,
    'acceptedJobs': env.num_completed_jobs,
    'completedJobs': env.num_completed_jobs,
    'activeJobs': env.num_active_jobs,
  }


def summarize_metrics(metrics: list[dict[str, Any]], parameters: dict[str, Any]) -> dict[str, Any]:
  if not metrics:
    return {
      'totalSteps': 0,
      'finalEnergyCost': 0,
      'rejectedJobs': 0,
      'rejectedTasks': 0,
      'totalEnergy': 0,
      'avgStepTime': 0,
      'acceptedJobs': 0,
    }

  final_point = metrics[-1]
  total_energy = sum(metric.get('totalEnergyCost', metric.get('energyCost', 0)) for metric in metrics)
  accepted_jobs = final_point.get(
    'acceptedJobs',
    max(parameters.get('numberOfJobs', 0) - final_point.get('rejectedJobs', 0), 0),
  )

  return {
    'totalSteps': len(metrics),
    'finalEnergyCost': _round(final_point.get('totalEnergyCost', final_point.get('energyCost')), 4),
    'rejectedJobs': final_point.get('rejectedJobs', 0),
    'rejectedTasks': final_point.get('rejectedTasks', 0),
    'totalEnergy': _round(total_energy, 4),
    'avgStepTime': _round(mean(metric.get('stepTime', 0) for metric in metrics), 3),
    'acceptedJobs': accepted_jobs,
  }


def build_server_farm_average_cpu(heatmap: dict[str, Any] | None) -> list[dict[str, Any]]:
  if not heatmap:
    return []

  return [
    {
      'farm': f'Farm {index + 1}',
      'averageCpu': _round(mean(values), 2) if values else 0,
    }
    for index, values in enumerate(heatmap.get('farms', []))
  ]


def build_evaluation_results(
  metrics: list[dict[str, Any]],
  sim_params: dict[str, Any],
  heatmap: dict[str, Any] | None,
) -> dict[str, Any]:
  average_energy = _round(mean(metric.get('totalEnergyCost', 0) for metric in metrics), 4) if metrics else 0
  final_wall_time = metrics[-1].get('wallTime', 0) if metrics else 0
  workload_label = f"{sim_params['numberOfJobs']} jobs"

  return {
    'episode': {
      'current': 1 if metrics else 0,
      'total': 1,
    },
    'averageEnergyByJobLoad': [
      {
        'jobs': sim_params['numberOfJobs'],
        'workload': workload_label,
        'averageEnergy': average_energy,
      },
    ],
    'wallTimeByJobLoad': [
      {
        'jobs': sim_params['numberOfJobs'],
        'workload': workload_label,
        'averageWallTime': _round(final_wall_time, 3),
      },
    ],
    'serverFarmAverageCpu': build_server_farm_average_cpu(heatmap),
  }


def build_training_results(
  episode_metrics: list[dict[str, Any]],
  sim_params: dict[str, Any],
  total_episodes: int,
  heatmap: dict[str, Any] | None,
) -> dict[str, Any]:
  reward_series = [
    {
      'episode': metric['episode'],
      'reward': _round(metric.get('totalReward', 0), 4),
      'farmReward': _round(metric.get('rewards', {}).get('server_farm', 0), 4),
      'serverReward': _round(metric.get('rewards', {}).get('server', 0), 4),
      'smoothedFarmReward': _round(metric.get('smoothedReward', 0), 4),
    }
    for metric in episode_metrics
  ]
  loss_series = [
    {
      'episode': metric['episode'],
      'actorLoss': _round(metric.get('averageActorLoss', 0), 6),
      'criticLoss': _round(metric.get('averageCriticLoss', 0), 6),
      'farmActor': _round(metric.get('losses', {}).get('server_farm', {}).get('actor', 0), 6),
      'farmCritic': _round(metric.get('losses', {}).get('server_farm', {}).get('critic', 0), 6),
      'serverActor': _round(metric.get('losses', {}).get('server', {}).get('actor', 0), 6),
      'serverCritic': _round(metric.get('losses', {}).get('server', {}).get('critic', 0), 6),
    }
    for metric in episode_metrics
  ]
  replay_series = [
    {
      'episode': metric['episode'],
      'qValue': _round(metric.get('qValue', 0), 6),
      'bufferFill': _round(metric.get('bufferFill', 0), 2),
    }
    for metric in episode_metrics
  ]
  average_energy = (
    _round(mean(metric.get('totalEnergyCost', 0) for metric in episode_metrics), 4)
    if episode_metrics
    else 0
  )

  return {
    'episode': {
      'current': episode_metrics[-1]['episode'] if episode_metrics else 0,
      'total': total_episodes,
    },
    'rewardSeries': reward_series,
    'lossSeries': loss_series,
    'replaySeries': replay_series,
    'averageEnergyByJobLoad': [
      {
        'jobs': sim_params['numberOfJobs'],
        'workload': f"{sim_params['numberOfJobs']} jobs",
        'averageEnergy': average_energy,
      },
    ],
    'serverFarmAverageCpu': build_server_farm_average_cpu(heatmap),
  }


def public_model(model: dict[str, Any]) -> dict[str, Any]:
  return {key: value for key, value in model.items() if key != 'modelPath'}


class DashboardRunner:
  def __init__(self) -> None:
    DASHBOARD_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    self.sessions: dict[str, RunSession] = {}
    self.active_run_id: str | None = None
    self.run_history: list[dict[str, Any]] = _load_json_file(RUN_HISTORY_FILE, [])
    self.models: list[dict[str, Any]] = _load_json_file(MODELS_FILE, [])

  def config(self) -> dict[str, Any]:
    return {
      'activePreset': 'Backend',
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
        await self._run_training(session)
      else:
        await self._run_evaluation(session)
    except Exception as error:
      session.status = 'error'
      await session.publish('run_error', {'message': str(error)})
    finally:
      if self.active_run_id == session.run_id:
        self.active_run_id = None

  async def _run_evaluation(self, session: RunSession) -> None:
    env = build_env(session.sim_params)
    obs, _ = env.reset(seed=42)
    dim_info = get_dim_info(env)
    model = None

    if session.run_type == 'inference':
      model_metadata = self.get_model(session.selected_model)
      if model_metadata is None:
        raise RuntimeError('Selected model is no longer available.')

      training_params = normalize_training_params(model_metadata.get('trainingParams'))
      model = MADDPG.load(
        dim_info,
        model_metadata['modelPath'],
        capacity=training_params['memorySize'],
        batch_size=training_params['batchSize'],
        actor_lr=training_params['actorLearningRate'],
        critic_lr=training_params['criticLearningRate'],
        hidden_dims=parse_hidden_dims(training_params['networkArchitecture']),
        optimizer_name=training_params['optimizer'],
      )

    step = 0
    cpu_samples: list[list[list[float]]] = []
    while env.agents:
      if session.stop_requested:
        session.status = 'stopped'
        await session.publish('run_stopped', {'message': 'Run stopped by user.'})
        return

      if model is None:
        actions = {agent: env.action_space(agent).sample() for agent in env.agents}
      else:
        actions = model.select_action(obs)

      obs, _reward, terminated, truncated, info = env.step(actions)
      step += 1
      cpu_samples.append(capture_cpu_sample(env))
      metric = build_step_metric(env, info, step)
      session.live_metrics.append(metric)
      await session.publish('step_metric', {'metric': metric})
      await asyncio.sleep(0.05)

      done = {
        agent: terminated[agent] or truncated[agent]
        for agent in env.agents
      }
      if all(done.values()):
        break

    session.latest_heatmap = build_average_heatmap(cpu_samples, session.sim_params)
    await session.publish('heatmap', {'heatmap': session.latest_heatmap})
    summary = summarize_metrics(session.live_metrics, session.sim_params)
    history_entry = self._append_evaluation_history(session, summary)
    session.status = 'completed'
    await session.publish(
      'run_completed',
      {
        'summary': summary,
        'runHistoryEntry': history_entry,
      },
    )

  async def _run_training(self, session: RunSession) -> None:
    assert session.training_params is not None
    env = build_env(session.sim_params)
    obs, _ = env.reset(seed=42)
    dim_info = get_dim_info(env)
    training_params = session.training_params
    random_steps = parse_random_steps(training_params['randomSteps'], session.sim_params['numberOfJobs'])
    learn_interval = training_params['targetUpdateSteps']
    hidden_dims = parse_hidden_dims(training_params['networkArchitecture'])
    model_dir = MODELS_DIR / session.run_id
    model_dir.mkdir(parents=True, exist_ok=True)

    maddpg = MADDPG(
      dim_info,
      capacity=training_params['memorySize'],
      batch_size=training_params['batchSize'],
      actor_lr=training_params['actorLearningRate'],
      critic_lr=training_params['criticLearningRate'],
      res_dir=str(model_dir),
      hidden_dims=hidden_dims,
      optimizer_name=training_params['optimizer'],
    )

    total_episodes = training_params['episodes']
    rewards_for_smoothing: list[float] = []

    for episode in range(1, total_episodes + 1):
      if session.stop_requested:
        session.status = 'stopped'
        await session.publish('run_stopped', {'message': 'Training stopped by user.'})
        return

      obs, _ = env.reset(seed=42 + episode)
      agent_reward = {agent_id: 0.0 for agent_id in env.agents}
      prices: list[float] = []
      wall_times: list[float] = []
      cpu_samples: list[list[list[float]]] = []
      latest_learn_metrics: dict[str, dict[str, float]] = {}
      step = 0

      while env.agents:
        if session.stop_requested:
          session.status = 'stopped'
          await session.publish('run_stopped', {'message': 'Training stopped by user.'})
          return

        step += 1
        if episode == 1 and step < random_steps:
          actions = {agent_id: env.action_space(agent_id).sample() for agent_id in env.agents}
        else:
          actions = maddpg.select_action(obs)

        next_obs, reward, terminated, truncated, info = env.step(actions)
        cpu_samples.append(capture_cpu_sample(env))
        done = {
          agent_id: terminated[agent_id] or truncated[agent_id]
          for agent_id in env.agents
        }
        maddpg.add(obs, actions, reward, next_obs, done)

        for agent_id, value in reward.items():
          agent_reward[agent_id] += float(value)

        server_farm_info = info.get('server_farm', {})
        prices.append(float(server_farm_info.get('price', 0)))
        wall_times.append(float(server_farm_info.get('wall_time', 0)))
        obs = next_obs

        if step >= random_steps and step % learn_interval == 0:
          latest_learn_metrics = maddpg.learn(
            training_params['batchSize'],
            training_params['discountFactor'],
          )
          maddpg.update_target(training_params['tau'])

        if all(done.values()):
          break

      total_reward = sum(agent_reward.values())
      rewards_for_smoothing.append(total_reward)
      smoothing_window = rewards_for_smoothing[-10:]
      session.latest_heatmap = build_average_heatmap(cpu_samples, session.sim_params)
      rejected_jobs = env.num_rejected_jobs
      accepted_jobs = max(session.sim_params['numberOfJobs'] - rejected_jobs, 0)
      acceptance_rate = (
        (accepted_jobs / session.sim_params['numberOfJobs']) * 100
        if session.sim_params['numberOfJobs']
        else 0
      )
      losses = {
        agent_id: {
          'actor': _round(latest_learn_metrics.get(agent_id, {}).get('actorLoss', 0), 6),
          'critic': _round(latest_learn_metrics.get(agent_id, {}).get('criticLoss', 0), 6),
        }
        for agent_id in ('server_farm', 'server')
      }
      actor_losses = [loss['actor'] for loss in losses.values()]
      critic_losses = [loss['critic'] for loss in losses.values()]
      q_values = [
        latest_learn_metrics.get(agent_id, {}).get('qValue', 0)
        for agent_id in ('server_farm', 'server')
      ]

      metric = {
        'episode': episode,
        'totalEpisodes': total_episodes,
        'step': episode,
        'totalReward': _round(total_reward, 4),
        'rewards': {agent_id: _round(value, 4) for agent_id, value in agent_reward.items()},
        'smoothedReward': _round(mean(smoothing_window), 4),
        'losses': losses,
        'averageActorLoss': _round(mean(actor_losses), 6),
        'averageCriticLoss': _round(mean(critic_losses), 6),
        'qValue': _round(mean(q_values), 6),
        'bufferFill': _round(maddpg.buffer_fill_percent, 2),
        'wallTime': _round(wall_times[-1] if wall_times else 0, 3),
        'stepTime': _round(wall_times[-1] if wall_times else 0, 3),
        'energyCost': _round(mean(prices), 4) if prices else 0,
        'totalEnergyCost': _round(sum(prices), 4) if prices else 0,
        'rejectedJobs': rejected_jobs,
        'rejectedTasks': env.rejected_tasks_count,
        'acceptedJobs': accepted_jobs,
        'jobAcceptanceRate': _round(acceptance_rate, 2),
        'phase': get_training_phase(episode, total_episodes),
      }
      session.episode_metrics.append(metric)
      session.live_metrics.append(metric)
      await session.publish('episode_metric', {'metric': metric})
      await session.publish('heatmap', {'heatmap': session.latest_heatmap})
      await asyncio.sleep(0.05)

    maddpg.save({})
    model_metadata = self._append_model_metadata(session)
    summary = summarize_metrics(session.live_metrics, session.sim_params)
    history_entry = self._append_training_history(session, summary)
    session.status = 'completed'
    await session.publish(
      'run_completed',
      {
        'summary': summary,
        'model': public_model(model_metadata),
        'runHistoryEntry': history_entry,
      },
    )

  def _append_model_metadata(self, session: RunSession) -> dict[str, Any]:
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
    _write_json_file(MODELS_FILE, self.models)
    return model_metadata

  def _append_evaluation_history(
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

  def _append_training_history(
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
    _write_json_file(RUN_HISTORY_FILE, self.run_history)
