import { formatNumber } from './format'

export function getMetricEnergy(point) {
  return point?.totalEnergyCost ?? point?.totalEnergy ?? point?.energyCost ?? 0
}

export function getMetricWallTime(point) {
  return point?.wallTime ?? point?.stepTime ?? 0
}

export function getMetricEpisode(point, index) {
  return point?.episode ?? index + 1
}

export function getMetricStep(point, index) {
  return point?.step ?? index + 1
}

export function getAverage(values) {
  const numericValues = values.filter(Number.isFinite)

  if (numericValues.length === 0) {
    return 0
  }

  return (
    numericValues.reduce((total, value) => total + value, 0) /
    numericValues.length
  )
}

export function getRejectedJobs(run) {
  return run.summary.rejectedJobs ?? run.summary.rejectedTasks ?? 0
}

export function getCompletedJobs(run) {
  const fromSummary = run.summary?.completedJobs ?? run.summary?.acceptedJobs
  if (Number.isFinite(fromSummary)) return Math.max(fromSummary, 0)
  const totalJobs = run.parameters.numberOfJobs ?? 0
  return Math.max(totalJobs - getRejectedJobs(run), 0)
}

export function getCompletedJobRate(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0
  return totalJobs === 0 ? 0 : (getCompletedJobs(run) / totalJobs) * 100
}

export function getCompletedJobSummary(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0
  return `${formatNumber(getCompletedJobs(run), 0)}/${formatNumber(totalJobs, 0)}`
}

export function getAverageEnergyPerJobLoad(run) {
  const points = run.trainingResults?.averageEnergyByJobLoad ?? []
  const values = points.map((p) => p.averageEnergy)
  return getAverage(values)
}
