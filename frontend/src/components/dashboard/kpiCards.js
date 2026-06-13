import { formatNumber } from '../../utils/format'
import { getMetricEpisode, getMetricWallTime } from '../../utils/runMetrics'

export function buildTrainingKpiCards(kpis) {
  return [
    {
      id: 'episode',
      label: 'Episode',
      value: `${kpis.episode.current}/${kpis.episode.total}`,
      helper: kpis.episode.helper,
      tone: 'sky',
    },
    {
      id: 'training-phase',
      label: 'Training Phase',
      value: kpis.trainingPhase.value,
      helper: kpis.trainingPhase.helper,
      tone: 'emerald',
    },
    {
      id: 'job-acceptance',
      label: 'Job Acceptance',
      value: `${kpis.jobAcceptance.value}%`,
      helper: kpis.jobAcceptance.helper,
      tone: 'emerald',
    },
  ]
}

export function buildEvaluationKpiCards({
  liveMetrics,
  savedModels,
  selectedModel,
  selectedRunType,
  simParams,
}) {
  const lastMetric = liveMetrics.at(-1)
  const currentEpisode = liveMetrics.length
    ? getMetricEpisode(lastMetric, liveMetrics.length - 1)
    : 0
  const totalJobs = simParams.numberOfJobs ?? 0
  const acceptedJobs = lastMetric?.acceptedJobs ?? 0
  const acceptanceRate =
    totalJobs > 0 ? (acceptedJobs / totalJobs) * 100 : 0
  const wallTime = getMetricWallTime(lastMetric)
  const selectedModelName = savedModels.find(
    (model) => model.id === selectedModel,
  )?.name
  const episodeHelper =
    selectedRunType === 'inference' && selectedModelName
      ? selectedModelName
      : `${formatNumber(simParams.numberOfJobs, 0)} jobs configured`

  return [
    {
      id: 'step',
      label: 'Step',
      value: formatNumber(currentEpisode, 0),
      helper: episodeHelper,
      tone: 'sky',
    },
    {
      id: 'job-acceptance-rate',
      label: 'Job Acceptance Rate',
      value: `${formatNumber(acceptanceRate, 1)}%`,
      helper: `${formatNumber(acceptedJobs, 0)}/${formatNumber(
        totalJobs,
        0,
      )} jobs accepted`,
      tone: 'emerald',
    },
    {
      id: 'wall-time',
      label: 'Wall Time',
      value: `${formatNumber(wallTime, 3)}s`,
      helper: 'Simulation time elapsed',
      tone: 'sky',
    },
  ]
}
