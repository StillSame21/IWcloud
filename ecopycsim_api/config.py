"""Static dashboard configuration: paths, defaults, and form field definitions."""

from pathlib import Path
from typing import Any

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
