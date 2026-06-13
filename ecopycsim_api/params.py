"""Validation and normalization of incoming simulation/training parameters."""

import re
from typing import Any

from ecopycsim_api.config import DEFAULT_SIMULATION_PARAMS, DEFAULT_TRAINING_PARAMS


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
  resolved['randomSteps'] = _coerce_float(resolved.get('randomSteps'), 0.1, 0)
  return resolved


def parse_hidden_dims(network_architecture: str) -> tuple[int, ...]:
  hidden_dims = tuple(int(value) for value in re.findall(r'\d+', network_architecture or ''))
  return hidden_dims or (64, 64)


def parse_random_steps(value: Any, number_of_jobs: int) -> int:
  """Resolve the random-steps multiplier into an absolute step count.

  ``value`` is a multiplier applied to the number of jobs. Legacy text values
  such as ``'jobs x 0.1'`` (stored in older saved models) are parsed for their
  numeric part and treated the same way.
  """
  if isinstance(value, (int, float)):
    return max(0, int(number_of_jobs * float(value)))

  number_match = re.search(r'[0-9.]+', str(value or ''))
  multiplier = float(number_match.group(0)) if number_match else 0.1
  return max(0, int(number_of_jobs * multiplier))
