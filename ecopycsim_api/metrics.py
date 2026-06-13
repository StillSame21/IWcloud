"""Builders that turn raw environment state into dashboard metric payloads."""

from statistics import mean
from typing import Any

from env.cloud_scheduling_v0 import CloudSchedulingEnv


def round_value(value: float | int | None, digits: int = 2) -> float:
  if value is None:
    return 0.0
  return round(float(value), digits)


def get_training_phase(episode: int, total_episodes: int) -> str:
  progress = episode / max(total_episodes, 1)

  if progress < 0.1:
    return 'Warm-up'
  if progress < 0.35:
    return 'Exploration'
  if progress < 0.7:
    return 'Convergence'
  return 'Stable'


def capture_vm_occupancy_sample(env: CloudSchedulingEnv) -> list[list[float]]:
  """Busy-VM share per server (busy VMs / total VMs), the DRL-Cloud
  busy-cores/total-cores notion. The raw ``cpu_utilization_rate`` stays in the
  energy model but is too small to visualize (single-digit percents at best)."""
  return [
    [
      sum(1 for vm in server.vms.values() if vm.status == 1)
      / max(len(server.vms), 1)
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
      'optimalRate': round_value(sim_params['optimalUtilizationRate'], 2),
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
      # Average over the active window only: idle steps (value 0) would
      # otherwise dilute the figure to near zero on lightly loaded runs.
      server_samples = [
        sample[farm_index][server_index]
        for sample in samples
        if farm_index < len(sample)
        and server_index < len(sample[farm_index])
        and sample[farm_index][server_index] > 0
      ]
      farm_values.append(round_value(mean(server_samples), 2) if server_samples else 0)

    farms.append(farm_values)

  return {
    'optimalRate': round_value(sim_params['optimalUtilizationRate'], 2),
    'farms': farms,
  }


def build_cpu_trend_point(cpu_samples: list[list[list[float]]]) -> dict[str, float]:
  """Compute global-mean and per-farm min/max from a full episode's CPU samples."""
  if not cpu_samples:
    return {'cpuMean': 0.0, 'cpuMin': 0.0, 'cpuMax': 0.0}

  farm_count = max(len(s) for s in cpu_samples)
  farm_means: list[float] = []

  for farm_idx in range(farm_count):
    values = [
      cpu_samples[step][farm_idx][srv_idx]
      for step in range(len(cpu_samples))
      if farm_idx < len(cpu_samples[step])
      for srv_idx in range(len(cpu_samples[step][farm_idx]))
    ]
    if values:
      farm_means.append(mean(values))

  if not farm_means:
    return {'cpuMean': 0.0, 'cpuMin': 0.0, 'cpuMax': 0.0}

  return {
    'cpuMean': round_value(mean(farm_means), 3),
    'cpuMin': round_value(min(farm_means), 3),
    'cpuMax': round_value(max(farm_means), 3),
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
  wall_time = round_value(server_farm_info.get('wall_time'), 3)
  energy_cost = round_value(server_farm_info.get('price'), 4)

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
    'finalEnergyCost': round_value(final_point.get('totalEnergyCost', final_point.get('energyCost')), 4),
    'rejectedJobs': final_point.get('rejectedJobs', 0),
    'rejectedTasks': final_point.get('rejectedTasks', 0),
    'totalEnergy': round_value(total_energy, 4),
    'avgStepTime': round_value(mean(metric.get('stepTime', 0) for metric in metrics), 3),
    'acceptedJobs': accepted_jobs,
  }


def build_server_farm_average_cpu(heatmap: dict[str, Any] | None) -> list[dict[str, Any]]:
  if not heatmap:
    return []

  return [
    {
      'farm': f'Farm {index + 1}',
      'averageCpu': round_value(mean(values), 2) if values else 0,
    }
    for index, values in enumerate(heatmap.get('farms', []))
  ]


def build_evaluation_results(
  metrics: list[dict[str, Any]],
  sim_params: dict[str, Any],
  heatmap: dict[str, Any] | None,
) -> dict[str, Any]:
  average_energy = round_value(mean(metric.get('totalEnergyCost', 0) for metric in metrics), 4) if metrics else 0
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
        'finalWallTime': round_value(final_wall_time, 3),
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
      'reward': round_value(metric.get('totalReward', 0), 4),
      'farmReward': round_value(metric.get('rewards', {}).get('server_farm', 0), 4),
      'serverReward': round_value(metric.get('rewards', {}).get('server', 0), 4),
      'smoothedFarmReward': round_value(metric.get('smoothedReward', 0), 4),
    }
    for metric in episode_metrics
  ]
  loss_series = [
    {
      'episode': metric['episode'],
      'actorLoss': round_value(metric.get('averageActorLoss', 0), 6),
      'criticLoss': round_value(metric.get('averageCriticLoss', 0), 6),
      'farmActor': round_value(metric.get('losses', {}).get('server_farm', {}).get('actor', 0), 6),
      'farmCritic': round_value(metric.get('losses', {}).get('server_farm', {}).get('critic', 0), 6),
      'serverActor': round_value(metric.get('losses', {}).get('server', {}).get('actor', 0), 6),
      'serverCritic': round_value(metric.get('losses', {}).get('server', {}).get('critic', 0), 6),
    }
    for metric in episode_metrics
  ]
  replay_series = [
    {
      'episode': metric['episode'],
      'qValue': round_value(metric.get('qValue', 0), 6),
      'bufferFill': round_value(metric.get('bufferFill', 0), 2),
    }
    for metric in episode_metrics
  ]
  average_energy = (
    round_value(mean(metric.get('totalEnergyCost', 0) for metric in episode_metrics), 4)
    if episode_metrics
    else 0
  )

  cpu_series = [
    {
      'episode': metric['episode'],
      'cpuMean': metric.get('cpuMean', 0),
      'cpuMin': metric.get('cpuMin', 0),
      'cpuMax': metric.get('cpuMax', 0),
    }
    for metric in episode_metrics
  ]

  return {
    'episode': {
      'current': episode_metrics[-1]['episode'] if episode_metrics else 0,
      'total': total_episodes,
    },
    'rewardSeries': reward_series,
    'lossSeries': loss_series,
    'replaySeries': replay_series,
    'cpuSeries': cpu_series,
    'optimalRate': round_value(sim_params.get('optimalUtilizationRate', 0.7), 2),
    'averageEnergyByJobLoad': [
      {
        'jobs': sim_params['numberOfJobs'],
        'workload': f"{sim_params['numberOfJobs']} jobs",
        'averageEnergy': average_energy,
      },
    ],
    'serverFarmAverageCpu': build_server_farm_average_cpu(heatmap),
  }
