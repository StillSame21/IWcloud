import {
  defaultSimulationParams,
  defaultTrainingParams,
} from '../config/fallbackConfig'

export const maxMetricPoints = 300

function formatWholePercent(value) {
  return `${Math.round(value)}%`
}

export function appendPoint(points, point) {
  return [...points, point].slice(-maxMetricPoints)
}

export function buildPhaseTimeline(currentEpisode = 0, totalEpisodes = 1) {
  const total = Math.max(Number(totalEpisodes) || 1, 1)
  const warmUpEnd = Math.max(1, Math.round(total * 0.1))
  const explorationEnd = Math.max(warmUpEnd + 1, Math.round(total * 0.35))
  const convergenceEnd = Math.max(explorationEnd + 1, Math.round(total * 0.7))

  return {
    currentEpisode,
    totalEpisodes: total,
    phases: [
      { id: 'warm-up', label: 'Warm-up', start: 0, end: warmUpEnd, tone: 'neutral' },
      {
        id: 'exploration',
        label: 'Exploration',
        start: warmUpEnd,
        end: explorationEnd,
        tone: 'warning',
      },
      {
        id: 'convergence',
        label: 'Convergence',
        start: explorationEnd,
        end: convergenceEnd,
        tone: 'success',
      },
      { id: 'stable', label: 'Stable', start: convergenceEnd, end: total, tone: 'info' },
    ],
  }
}

export function createEmptyHeatmap(simParams = defaultSimulationParams) {
  return {
    optimalRate: Number((simParams.optimalUtilizationRate ?? 0.7).toFixed(2)),
    farms: [],
  }
}

export function createDashboardTelemetry(
  simParams = defaultSimulationParams,
  trainingParams = defaultTrainingParams,
) {
  const totalEpisodes = trainingParams?.episodes ?? defaultTrainingParams.episodes

  return {
    kpis: {
      episode: {
        current: 0,
        total: totalEpisodes,
        helper: 'Waiting for training telemetry',
      },
      trainingPhase: {
        value: 'Waiting',
        helper: 'No training episode completed',
      },
      jobAcceptance: {
        value: 0,
        helper: 'Waiting for completed episodes',
      },
      averageEnergyUsage: {
        value: 0,
        helper: `${simParams.numberOfJobs ?? 0} jobs configured`,
      },
    },
    phaseTimeline: buildPhaseTimeline(0, totalEpisodes),
    rewardSeries: [],
    lossSeries: [],
    replaySeries: [],
    averageEnergySeries: [],
    jobOutcome: {
      acceptedPercent: 0,
      rejectedPercent: 0,
      wallTimeRatio: 0,
    },
    serverFarmUtilization: createEmptyHeatmap(simParams),
    diagnostics: [],
  }
}

export function updateTrainingTelemetry(currentTelemetry, metric) {
  const totalEpisodes = metric.totalEpisodes ?? currentTelemetry.kpis.episode.total
  const acceptedJobs = metric.acceptedJobs ?? 0
  const totalJobs = acceptedJobs + (metric.rejectedJobs ?? 0)
  const acceptanceHelper =
    totalJobs > 0
      ? `${acceptedJobs}/${totalJobs} jobs accepted`
      : 'Waiting for job outcomes'
  const farmLosses = metric.losses?.server_farm ?? {}
  const serverLosses = metric.losses?.server ?? {}

  return {
    ...currentTelemetry,
    kpis: {
      ...currentTelemetry.kpis,
      episode: {
        current: metric.episode,
        total: totalEpisodes,
        helper: `${formatWholePercent((metric.episode / Math.max(totalEpisodes, 1)) * 100)} complete`,
      },
      trainingPhase: {
        value: metric.phase ?? 'Training',
        helper: 'Updated after completed episode',
      },
      jobAcceptance: {
        value: metric.jobAcceptanceRate ?? 0,
        helper: acceptanceHelper,
      },
      averageEnergyUsage: {
        value: metric.totalEnergyCost ?? 0,
        helper: `Episode ${metric.episode}`,
      },
    },
    phaseTimeline: buildPhaseTimeline(metric.episode, totalEpisodes),
    rewardSeries: appendPoint(currentTelemetry.rewardSeries, {
      episode: metric.episode,
      farmReward: metric.rewards?.server_farm ?? 0,
      serverReward: metric.rewards?.server ?? 0,
      smoothedFarmReward: metric.smoothedReward ?? metric.totalReward ?? 0,
    }),
    lossSeries: appendPoint(currentTelemetry.lossSeries, {
      episode: metric.episode,
      farmActor: farmLosses.actor ?? 0,
      farmCritic: farmLosses.critic ?? 0,
      serverActor: serverLosses.actor ?? 0,
      serverCritic: serverLosses.critic ?? 0,
    }),
    replaySeries: appendPoint(currentTelemetry.replaySeries, {
      episode: metric.episode,
      qValue: metric.qValue ?? 0,
      bufferFill: metric.bufferFill ?? 0,
    }),
  }
}
