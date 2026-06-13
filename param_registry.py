"""Parameter registry for EcoPyCSim paper tables and runtime objects."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class ParamField:
  value: Any
  label: str
  type: str
  editable: bool


@dataclass(frozen=True)
class MADDPGHyperparams:
  episodes: ParamField
  n_agents: ParamField
  network_layers: ParamField
  memory_size: ParamField
  batch_size: ParamField
  random_steps_factor: ParamField
  critic_lr: ParamField
  actor_lr: ParamField
  discount_factor: ParamField
  target_update_steps: ParamField
  optimizer: ParamField
  tau: ParamField


@dataclass(frozen=True)
class SimulationParams:
  n_jobs: ParamField
  n_tasks: ParamField
  n_server_farms: ParamField
  n_servers: ParamField
  job_arrival_lambda: ParamField
  task_arrival_mu: ParamField
  task_arrival_sigma2: ParamField
  cpu_range: ParamField
  ram_range: ParamField
  n_vm_types: ParamField
  alpha_range: ParamField
  beta: ParamField
  optimal_util_rate: ParamField
  static_power: ParamField


TABLE_2_DEFAULTS = {
  "episodes": 1000,
  "n_agents": 2,
  "network_layers": [64, 64],
  "memory_size": 100000,
  "batch_size": 1024,
  "random_steps_factor": 0.1,
  "critic_lr": 0.0005,
  "actor_lr": 0.0005,
  "discount_factor": 0.9,
  "target_update_steps": 5,
  "optimizer": "Adam",
  "tau": 0.1,
}


TABLE_3_DEFAULTS = {
  "n_jobs": [50, 100, 300, 500],
  "n_tasks": [600, 800, 3600, 9000],
  "n_server_farms": [2, 5, 10],
  "n_servers": [5, 30, 100],
  "job_arrival_lambda": 0.5,
  "task_arrival_mu": 5,
  "task_arrival_sigma2": 1.6,
  "cpu_range": [0, 1],
  "ram_range": [0, 1],
  "n_vm_types": 10,
  "alpha_range": [0.3, 0.8],
  "beta": 10,
  "optimal_util_rate": 0.7,
  "static_power": 0.035,
}


HYPERPARAM_LABELS = {
  "episodes": "Episode",
  "n_agents": "Number of agent",
  "network_layers": "Network",
  "memory_size": "Memory size",
  "batch_size": "Batch size",
  "random_steps_factor": "Random steps",
  "critic_lr": "Critic learning rate",
  "actor_lr": "Actor learning rate",
  "discount_factor": "Discount factor",
  "target_update_steps": "Target_update_steps",
  "optimizer": "Optimizer",
  "tau": "Tau",
}


SIMULATION_LABELS = {
  "n_jobs": "Number of job",
  "n_tasks": "Number of task",
  "n_server_farms": "Number of server farm",
  "n_servers": "Number of server",
  "job_arrival_lambda": "Job arrival time",
  "task_arrival_mu": "Task arrival time mean",
  "task_arrival_sigma2": "Task arrival time variance",
  "cpu_range": "Request CPU range",
  "ram_range": "Request RAM range",
  "n_vm_types": "Number of VM type",
  "alpha_range": "Dynamic energy consumption coefficient alpha",
  "beta": "Dynamic energy consumption coefficient beta",
  "optimal_util_rate": "Optimal utilization rate",
  "static_power": "Static power",
}


FIELD_TYPES = {
  "episodes": "int",
  "n_agents": "int",
  "network_layers": "list",
  "memory_size": "int",
  "batch_size": "int",
  "random_steps_factor": "float",
  "critic_lr": "float",
  "actor_lr": "float",
  "discount_factor": "float",
  "target_update_steps": "int",
  "optimizer": "str",
  "tau": "float",
  "n_jobs": "list",
  "n_tasks": "list",
  "n_server_farms": "list",
  "n_servers": "list",
  "job_arrival_lambda": "float",
  "task_arrival_mu": "float",
  "task_arrival_sigma2": "float",
  "cpu_range": "list",
  "ram_range": "list",
  "n_vm_types": "int",
  "alpha_range": "list",
  "beta": "float",
  "optimal_util_rate": "float",
  "static_power": "float",
}


FIXED_HYPERPARAMS = {"n_agents", "network_layers", "optimizer"}


def load_params(env_config: dict, agent_config: dict) -> dict:
  """Load parameter metadata from EcoPyCSim runtime objects and config values.

  Expected inputs may include actual objects, for example:
    env_config={"env": env}
    agent_config={"maddpg": maddpg, "episodes": 1000, "gamma": 0.9}

  Values not stored by the live objects are filled from the supplied dicts and
  then from the paper defaults.
  """
  env = _find_env(env_config)
  maddpg = _find_maddpg(agent_config)

  hyper_values = dict(TABLE_2_DEFAULTS)
  hyper_values.update({
    "episodes": _config_value(agent_config, ("episodes", "episode_num"), hyper_values["episodes"]),
    "n_agents": _n_agents(env, maddpg, hyper_values["n_agents"]),
    "network_layers": _network_layers(maddpg, hyper_values["network_layers"]),
    "memory_size": _memory_size(maddpg, agent_config, hyper_values["memory_size"]),
    "batch_size": _attr_or_config(maddpg, agent_config, ("batch_size",), hyper_values["batch_size"]),
    "random_steps_factor": _random_steps_factor(env, agent_config, hyper_values["random_steps_factor"]),
    "critic_lr": _optimizer_lr(maddpg, "critic_optimizer", agent_config, "critic_lr", hyper_values["critic_lr"]),
    "actor_lr": _optimizer_lr(maddpg, "actor_optimizer", agent_config, "actor_lr", hyper_values["actor_lr"]),
    "discount_factor": _config_value(agent_config, ("discount_factor", "gamma"), hyper_values["discount_factor"]),
    "target_update_steps": _config_value(
      agent_config,
      ("target_update_steps", "learn_iterval", "learn_interval"),
      hyper_values["target_update_steps"],
    ),
    "optimizer": _optimizer_name(maddpg, hyper_values["optimizer"]),
    "tau": _config_value(agent_config, ("tau",), hyper_values["tau"]),
  })

  simulation_values = dict(TABLE_3_DEFAULTS)
  simulation_values.update({
    "n_jobs": _attr_or_config(env, env_config, ("num_jobs", "n_jobs"), simulation_values["n_jobs"]),
    "n_tasks": _n_tasks(env, env_config, simulation_values["n_tasks"]),
    "n_server_farms": _attr_or_config(
      env,
      env_config,
      ("num_server_farms", "n_server_farms"),
      simulation_values["n_server_farms"],
    ),
    "n_servers": _attr_or_config(env, env_config, ("num_servers", "n_servers"), simulation_values["n_servers"]),
    "job_arrival_lambda": _config_value(
      env_config,
      ("job_arrival_lambda", "lambda_"),
      simulation_values["job_arrival_lambda"],
    ),
    "task_arrival_mu": _config_value(env_config, ("task_arrival_mu", "mu"), simulation_values["task_arrival_mu"]),
    "task_arrival_sigma2": _config_value(
      env_config,
      ("task_arrival_sigma2", "sigma2"),
      simulation_values["task_arrival_sigma2"],
    ),
    "cpu_range": _resource_range(env, "task_cpu", simulation_values["cpu_range"]),
    "ram_range": _resource_range(env, "task_ram", simulation_values["ram_range"]),
    "n_vm_types": _n_vm_types(env, env_config, simulation_values["n_vm_types"]),
    "alpha_range": _alpha_range(env, env_config, simulation_values["alpha_range"]),
    "beta": _beta(env, env_config, simulation_values["beta"]),
    "optimal_util_rate": _config_value(
      env_config,
      ("optimal_util_rate", "optimal_utilization_rate"),
      simulation_values["optimal_util_rate"],
    ),
    "static_power": _config_value(env_config, ("static_power",), simulation_values["static_power"]),
  })

  return {
    "hyperparameters": asdict(_build_hyperparams(hyper_values)),
    "simulation": asdict(_build_simulation_params(simulation_values)),
  }


def get_defaults() -> dict:
  """Return Table 2 and Table 3 defaults without a running simulation."""
  return {
    "hyperparameters": asdict(_build_hyperparams(TABLE_2_DEFAULTS)),
    "simulation": asdict(_build_simulation_params(TABLE_3_DEFAULTS)),
  }


def _build_hyperparams(values: dict[str, Any]) -> MADDPGHyperparams:
  return MADDPGHyperparams(
    **{
      key: _field(
        values[key],
        HYPERPARAM_LABELS[key],
        FIELD_TYPES[key],
        editable=key not in FIXED_HYPERPARAMS,
      )
      for key in TABLE_2_DEFAULTS
    }
  )


def _build_simulation_params(values: dict[str, Any]) -> SimulationParams:
  return SimulationParams(
    **{
      key: _field(values[key], SIMULATION_LABELS[key], FIELD_TYPES[key], editable=True)
      for key in TABLE_3_DEFAULTS
    }
  )


def _field(value: Any, label: str, field_type: str, editable: bool) -> ParamField:
  safe_value = _json_safe(value)
  return ParamField(
    value=safe_value,
    label=label,
    type=_infer_field_type(safe_value, field_type),
    editable=editable,
  )


def _infer_field_type(value: Any, default: str) -> str:
  if isinstance(value, list):
    return "list"
  if isinstance(value, bool):
    return default
  if isinstance(value, int):
    return "int"
  if isinstance(value, float):
    return "float"
  if isinstance(value, str):
    return "str"
  return default


def _find_env(config: Any) -> Any:
  if not isinstance(config, dict):
    return config
  for key in ("env", "environment", "cloud_env", "cloud_scheduling_env"):
    if key in config:
      return config[key]
  for value in config.values():
    if all(hasattr(value, attr) for attr in ("num_jobs", "num_server_farms", "num_servers")):
      return value
  return None


def _find_maddpg(config: Any) -> Any:
  if not isinstance(config, dict):
    return config
  for key in ("maddpg", "agent", "maddpg_agent"):
    if key in config:
      return config[key]
  for value in config.values():
    if all(hasattr(value, attr) for attr in ("agents", "buffers")):
      return value
  return None


def _config_value(config: Any, names: tuple[str, ...], default: Any) -> Any:
  if isinstance(config, dict):
    for name in names:
      if name in config and config[name] is not None:
        return config[name]
  return default


def _attr_or_config(obj: Any, config: Any, names: tuple[str, ...], default: Any) -> Any:
  for name in names:
    if obj is not None and hasattr(obj, name):
      value = getattr(obj, name)
      if value is not None:
        return value
  return _config_value(config, names, default)


def _first_maddpg_agent(maddpg: Any) -> Any:
  agents = getattr(maddpg, "agents", None)
  if isinstance(agents, dict) and agents:
    return next(iter(agents.values()))
  return None


def _n_agents(env: Any, maddpg: Any, default: int) -> int:
  agents = getattr(env, "agents", None)
  if agents is not None:
    return len(agents)
  agents = getattr(maddpg, "agents", None)
  if agents is not None:
    return len(agents)
  return default


def _network_layers(maddpg: Any, default: list[int]) -> list[int]:
  agent = _first_maddpg_agent(maddpg)
  actor = getattr(agent, "actor", None)
  net = getattr(actor, "net", None)
  if net is None:
    return default

  linear_layers = [
    layer
    for layer in net
    if layer.__class__.__name__ == "Linear" and hasattr(layer, "out_features")
  ]
  if len(linear_layers) < 2:
    return default
  return [int(layer.out_features) for layer in linear_layers[:-1]]


def _memory_size(maddpg: Any, config: Any, default: int) -> int:
  buffers = getattr(maddpg, "buffers", None)
  if isinstance(buffers, dict) and buffers:
    capacity = getattr(next(iter(buffers.values())), "capacity", None)
    if capacity is not None:
      return int(capacity)
  return int(_config_value(config, ("memory_size", "capacity"), default))


def _random_steps_factor(env: Any, config: Any, default: float) -> float:
  factor = _config_value(config, ("random_steps_factor",), None)
  if factor is not None:
    return float(factor)

  random_steps = _config_value(config, ("random_steps",), None)
  num_jobs = getattr(env, "num_jobs", None)
  if random_steps is not None and num_jobs:
    return float(random_steps) / float(num_jobs)

  return default


def _optimizer_lr(maddpg: Any, optimizer_attr: str, config: Any, config_name: str, default: float) -> float:
  agent = _first_maddpg_agent(maddpg)
  optimizer = getattr(agent, optimizer_attr, None)
  param_groups = getattr(optimizer, "param_groups", None)
  if param_groups:
    return float(param_groups[0].get("lr", default))
  return float(_config_value(config, (config_name,), default))


def _optimizer_name(maddpg: Any, default: str) -> str:
  agent = _first_maddpg_agent(maddpg)
  for attr in ("actor_optimizer", "critic_optimizer"):
    optimizer = getattr(agent, attr, None)
    if optimizer is not None:
      return optimizer.__class__.__name__
  return default


def _n_tasks(env: Any, config: Any, default: Any) -> Any:
  value = _config_value(config, ("n_tasks", "num_tasks"), None)
  if value is not None:
    return value

  jobs = getattr(env, "jobs", None)
  if isinstance(jobs, dict) and jobs:
    return sum(_job_task_count(job) for job in jobs.values())

  return default


def _job_task_count(job: Any) -> int:
  num_tasks = getattr(job, "num_tasks", None)
  if num_tasks is not None:
    return int(num_tasks)
  tasks = getattr(job, "tasks", None)
  if tasks is not None:
    return len(tasks)
  return 0


def _resource_range(env: Any, observation_key: str, default: list[int]) -> list[Any]:
  spaces = getattr(env, "observation_spaces", None)
  if not isinstance(spaces, dict):
    return default

  for obs_space in spaces.values():
    inner_spaces = getattr(obs_space, "spaces", {})
    space = inner_spaces.get(observation_key)
    if space is None:
      continue
    low = _scalar_bound(getattr(space, "low", None))
    high = _scalar_bound(getattr(space, "high", None))
    if low is not None and high is not None:
      return [low, high]

  return default


def _scalar_bound(value: Any) -> Any:
  if value is None:
    return None
  if hasattr(value, "flatten"):
    flattened = value.flatten()
    if len(flattened) == 0:
      return None
    return _json_safe(flattened[0])
  return _json_safe(value)


def _servers(env: Any) -> list[Any]:
  server_farms = getattr(env, "server_farms", None)
  if not isinstance(server_farms, dict):
    return []

  servers = []
  for farm in server_farms.values():
    farm_servers = getattr(farm, "servers", None)
    if isinstance(farm_servers, dict):
      servers.extend(farm_servers.values())
  return servers


def _n_vm_types(env: Any, config: Any, default: int) -> int:
  value = _config_value(config, ("n_vm_types", "num_vm_types"), None)
  if value is not None:
    return int(value)

  servers = _servers(env)
  if servers:
    return int(max(getattr(server, "vm_numbers", 0) for server in servers))

  return default


def _alpha_range(env: Any, config: Any, default: list[float]) -> list[float]:
  value = _config_value(config, ("alpha_range",), None)
  if value is not None:
    return value

  alphas = [
    float(getattr(server, "alpha"))
    for server in _servers(env)
    if hasattr(server, "alpha")
  ]
  if alphas:
    return [min(alphas), max(alphas)]

  return default


def _beta(env: Any, config: Any, default: float) -> float:
  value = _config_value(config, ("beta",), None)
  if value is not None:
    return float(value)

  betas = [
    float(getattr(server, "beta"))
    for server in _servers(env)
    if hasattr(server, "beta")
  ]
  if betas:
    unique_betas = sorted(set(betas))
    return unique_betas[0] if len(unique_betas) == 1 else unique_betas

  return default


def _json_safe(value: Any) -> Any:
  if isinstance(value, dict):
    return {str(key): _json_safe(val) for key, val in value.items()}
  if isinstance(value, (list, tuple, set)):
    return [_json_safe(item) for item in value]
  if hasattr(value, "item"):
    return value.item()
  return value


__all__ = [
  "MADDPGHyperparams",
  "ParamField",
  "SimulationParams",
  "get_defaults",
  "load_params",
]
