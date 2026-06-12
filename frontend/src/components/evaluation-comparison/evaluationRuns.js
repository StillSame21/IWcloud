import { getAverage, getMetricEnergy } from '../../utils/runMetrics'

export const minSelectedRuns = 2
export const maxSelectedRuns = 4
export const energyPriceFactor = 0.16

const evaluationRunTypes = [
  'Evaluation Random Algorithm',
  'Evaluated Trained Model',
]
const chartColors = ['#2563eb', '#d97706', '#059669', '#7c3aed']

export function getEvaluationRuns(runHistory) {
  return runHistory.filter(
    (run) =>
      evaluationRunTypes.includes(run.type) && Boolean(run.evaluationResults),
  )
}

export function getRunDisplayName(run) {
  if (run.displayName) {
    return run.displayName
  }

  if (run.type === 'Evaluation Random Algorithm') {
    return 'Random Evaluation'
  }

  if (run.type === 'Evaluated Trained Model') {
    return 'MADDPG Evaluation'
  }

  return run.id
}

export function getRunChartColor(index) {
  return chartColors[index % chartColors.length]
}

export function getWorkloadJobs(point) {
  if (Number.isFinite(point.jobs)) {
    return point.jobs
  }

  const parsedJobs = Number(String(point.workload ?? '').match(/\d+/)?.[0])
  return Number.isFinite(parsedJobs) ? parsedJobs : 0
}

export function getAverageEnergyPerEpisode(run) {
  return getAverage(run.metrics.map(getMetricEnergy))
}

export function getAverageElectricityPricePerEpisode(run) {
  return getAverageEnergyPerEpisode(run) * energyPriceFactor
}
