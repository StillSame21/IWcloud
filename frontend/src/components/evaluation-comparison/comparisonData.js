import { getMetricEnergy, getMetricStep } from '../../utils/runMetrics'
import { getWorkloadJobs } from './evaluationRuns'

export function buildEnergyPerTimeStepData(selectedRuns) {
  const timeSteps = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.metrics.map((point, index) => getMetricStep(point, index)),
      ),
    ),
  ].sort((a, b) => a - b)

  return timeSteps.map((timeStep) => {
    const row = { timeStep }

    selectedRuns.forEach((run) => {
      const point = run.metrics.find(
        (metric, index) => getMetricStep(metric, index) === timeStep,
      )

      row[run.id] = getMetricEnergy(point)
    })

    return row
  })
}

function buildWorkloadComparisonData(selectedRuns, getPoints, getValue) {
  const jobCounts = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        getPoints(run).map((point) => getWorkloadJobs(point)),
      ),
    ),
  ].sort((a, b) => a - b)

  return jobCounts.map((jobs) => {
    const row = { jobs, workload: `${jobs} jobs` }

    selectedRuns.forEach((run) => {
      const point = getPoints(run).find(
        (item) => getWorkloadJobs(item) === jobs,
      )

      row[run.id] = point ? getValue(point, run) : undefined
    })

    return row
  })
}

export function buildEnergyWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.averageEnergyByJobLoad,
    (point) => point.averageEnergy,
  )
}

export function buildWallTimePerWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.wallTimeByJobLoad,
    (point) => point.averageWallTime,
  )
}

function getFarmNumber(farm) {
  return Number(farm.replace('Farm ', ''))
}

export function buildServerFarmCpuData(selectedRuns) {
  const farms = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.evaluationResults.serverFarmAverageCpu.map((point) => point.farm),
      ),
    ),
  ].sort((a, b) => getFarmNumber(a) - getFarmNumber(b))

  return farms.map((farm) => {
    const row = { farm }

    selectedRuns.forEach((run) => {
      const point = run.evaluationResults.serverFarmAverageCpu.find(
        (item) => item.farm === farm,
      )

      row[run.id] = point?.averageCpu
    })

    return row
  })
}
