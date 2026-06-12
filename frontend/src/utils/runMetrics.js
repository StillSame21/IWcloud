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

export function getJobAcceptanceRate(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0

  if (totalJobs === 0) {
    return 0
  }

  const acceptedJobs = Math.max(totalJobs - getRejectedJobs(run), 0)
  return (acceptedJobs / totalJobs) * 100
}

export function getJobAcceptanceSummary(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0
  const acceptedJobs = Math.max(totalJobs - getRejectedJobs(run), 0)

  return `${formatNumber(acceptedJobs, 0)}/${formatNumber(totalJobs, 0)}`
}
