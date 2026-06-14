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
      id: 'completed-job',
      label: 'Completed Job %',
      value: `${kpis.completedJob.value}%`,
      helper: kpis.completedJob.helper,
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
  const completedJobs = lastMetric?.completedJobs ?? 0
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
  const wallTime = getMetricWallTime(lastMetric)
  const cumulativeEnergy = lastMetric?.cumulativeEnergy ?? 0
  const pricePerJob = acceptedJobs > 0 ? cumulativeEnergy / acceptedJobs : 0
  const selectedModelName = savedModels.find(
    (model) => model.id === selectedModel,
  )?.name
  const episodeHelper =
    selectedRunType === 'inference' && selectedModelName
      ? selectedModelName
      : `${formatNumber(simParams.numberOfJobs, 0)} jobs configured`

  return [
    {
      id: 'episode',
      label: 'Episode',
      value: formatNumber(currentEpisode, 0),
      helper: episodeHelper,
      tone: 'sky',
    },
    {
      id: 'completed-job-pct',
      label: 'Completed Job %',
      value: `${formatNumber(completionRate, 1)}%`,
      helper: `${formatNumber(completedJobs, 0)}/${formatNumber(
        totalJobs,
        0,
      )} jobs completed`,
      tone: 'emerald',
    },
    {
      id: 'wall-time',
      label: 'Wall Time',
      value: `${formatNumber(wallTime, 3)}s`,
      helper: 'Simulation time elapsed',
      tone: 'sky',
    },
    {
      id: 'price-per-job',
      label: 'Avg Price per Job',
      value: formatNumber(pricePerJob, 2),
      helper: 'Avg cost per completed job',
      tone: 'emerald',
    },
  ]
}
