"""Evaluation and training loops executed for a run session.

Each executor drives the simulation environment, publishes live events on the
session, and persists results through the runner passed in.
"""

import asyncio
from statistics import mean
from typing import Any

from env.cloud_scheduling_v0 import CloudSchedulingEnv
from schedulers.marl.maddpg.MADDPG import MADDPG

from ecopycsim_api.config import MODELS_DIR
from ecopycsim_api.metrics import (
  build_average_heatmap,
  build_cpu_trend_point,
  build_step_metric,
  capture_cpu_sample,
  get_training_phase,
  round_value,
  summarize_metrics,
)
from ecopycsim_api.naming import public_model
from ecopycsim_api.params import (
  normalize_training_params,
  parse_hidden_dims,
  parse_random_steps,
)
from ecopycsim_api.session import RunSession

EVENT_PUBLISH_DELAY_SECONDS = 0.05


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


def _load_model_for_inference(runner, session: RunSession, dim_info: dict[str, Any]) -> MADDPG:
  model_metadata = runner.get_model(session.selected_model)
  if model_metadata is None:
    raise RuntimeError('Selected model is no longer available.')

  training_params = normalize_training_params(model_metadata.get('trainingParams'))
  return MADDPG.load(
    dim_info,
    model_metadata['modelPath'],
    capacity=training_params['memorySize'],
    batch_size=training_params['batchSize'],
    actor_lr=training_params['actorLearningRate'],
    critic_lr=training_params['criticLearningRate'],
    hidden_dims=parse_hidden_dims(training_params['networkArchitecture']),
    optimizer_name=training_params['optimizer'],
  )


async def run_evaluation(runner, session: RunSession) -> None:
  env = build_env(session.sim_params)
  obs, _ = env.reset(seed=42)
  model = None

  if session.run_type == 'inference':
    model = _load_model_for_inference(runner, session, get_dim_info(env))

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
    await asyncio.sleep(EVENT_PUBLISH_DELAY_SECONDS)

    done = {
      agent: terminated[agent] or truncated[agent]
      for agent in env.agents
    }
    if all(done.values()):
      break

  session.latest_heatmap = build_average_heatmap(cpu_samples, session.sim_params)
  await session.publish('heatmap', {'heatmap': session.latest_heatmap})
  summary = summarize_metrics(session.live_metrics, session.sim_params)
  history_entry = runner.append_evaluation_history(session, summary)
  session.status = 'completed'
  await session.publish(
    'run_completed',
    {
      'summary': summary,
      'runHistoryEntry': history_entry,
    },
  )


async def _run_training_episode(
  env: CloudSchedulingEnv,
  maddpg: MADDPG,
  session: RunSession,
  episode: int,
  random_steps: int,
  learn_interval: int,
) -> dict[str, Any] | None:
  """Run one training episode. Returns episode stats, or None when stopped."""
  training_params = session.training_params
  obs, _ = env.reset(seed=42 + episode)
  agent_reward = {agent_id: 0.0 for agent_id in env.agents}
  prices: list[float] = []
  wall_times: list[float] = []
  cpu_samples: list[list[list[float]]] = []
  latest_learn_metrics: dict[str, dict[str, float]] = {}
  step = 0

  while env.agents:
    if session.stop_requested:
      return None

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

  return {
    'agent_reward': agent_reward,
    'prices': prices,
    'wall_times': wall_times,
    'cpu_samples': cpu_samples,
    'learn_metrics': latest_learn_metrics,
  }


def _build_episode_metric(
  env: CloudSchedulingEnv,
  session: RunSession,
  maddpg: MADDPG,
  episode: int,
  total_episodes: int,
  episode_stats: dict[str, Any],
  rewards_for_smoothing: list[float],
) -> dict[str, Any]:
  agent_reward = episode_stats['agent_reward']
  prices = episode_stats['prices']
  wall_times = episode_stats['wall_times']
  learn_metrics = episode_stats['learn_metrics']

  total_reward = sum(agent_reward.values())
  rewards_for_smoothing.append(total_reward)
  smoothing_window = rewards_for_smoothing[-10:]

  rejected_jobs = env.num_rejected_jobs
  accepted_jobs = env.num_completed_jobs
  acceptance_rate = (
    (accepted_jobs / session.sim_params['numberOfJobs']) * 100
    if session.sim_params['numberOfJobs']
    else 0
  )
  losses = {
    agent_id: {
      'actor': round_value(learn_metrics.get(agent_id, {}).get('actorLoss', 0), 6),
      'critic': round_value(learn_metrics.get(agent_id, {}).get('criticLoss', 0), 6),
    }
    for agent_id in ('server_farm', 'server')
  }
  actor_losses = [loss['actor'] for loss in losses.values()]
  critic_losses = [loss['critic'] for loss in losses.values()]
  q_values = [
    learn_metrics.get(agent_id, {}).get('qValue', 0)
    for agent_id in ('server_farm', 'server')
  ]

  return {
    'episode': episode,
    'totalEpisodes': total_episodes,
    'step': episode,
    'totalReward': round_value(total_reward, 4),
    'rewards': {agent_id: round_value(value, 4) for agent_id, value in agent_reward.items()},
    'smoothedReward': round_value(mean(smoothing_window), 4),
    'losses': losses,
    'averageActorLoss': round_value(mean(actor_losses), 6),
    'averageCriticLoss': round_value(mean(critic_losses), 6),
    'qValue': round_value(mean(q_values), 6),
    'bufferFill': round_value(maddpg.buffer_fill_percent, 2),
    'wallTime': round_value(wall_times[-1] if wall_times else 0, 3),
    'stepTime': round_value(wall_times[-1] if wall_times else 0, 3),
    'energyCost': round_value(mean(prices), 4) if prices else 0,
    'totalEnergyCost': round_value(sum(prices), 4) if prices else 0,
    'rejectedJobs': rejected_jobs,
    'rejectedTasks': env.rejected_tasks_count,
    'acceptedJobs': accepted_jobs,
    'jobAcceptanceRate': round_value(acceptance_rate, 2),
    'phase': get_training_phase(episode, total_episodes),
    **build_cpu_trend_point(episode_stats['cpu_samples']),
    'optimalRate': round_value(session.sim_params.get('optimalUtilizationRate', 0.7), 2),
  }


async def run_training(runner, session: RunSession) -> None:
  assert session.training_params is not None
  env = build_env(session.sim_params)
  env.reset(seed=42)
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
    episode_stats = None
    if not session.stop_requested:
      episode_stats = await _run_training_episode(
        env,
        maddpg,
        session,
        episode,
        random_steps,
        learn_interval,
      )

    if episode_stats is None:
      session.status = 'stopped'
      await session.publish('run_stopped', {'message': 'Training stopped by user.'})
      return

    session.latest_heatmap = build_average_heatmap(
      episode_stats['cpu_samples'],
      session.sim_params,
    )
    metric = _build_episode_metric(
      env,
      session,
      maddpg,
      episode,
      total_episodes,
      episode_stats,
      rewards_for_smoothing,
    )
    session.episode_metrics.append(metric)
    session.live_metrics.append(metric)
    await session.publish('episode_metric', {'metric': metric})
    await session.publish('heatmap', {'heatmap': session.latest_heatmap})
    await asyncio.sleep(EVENT_PUBLISH_DELAY_SECONDS)

  maddpg.save({})
  model_metadata = runner.append_model_metadata(session)
  summary = summarize_metrics(session.live_metrics, session.sim_params)
  history_entry = runner.append_training_history(session, summary)
  session.status = 'completed'
  await session.publish(
    'run_completed',
    {
      'summary': summary,
      'model': public_model(model_metadata),
      'runHistoryEntry': history_entry,
    },
  )
