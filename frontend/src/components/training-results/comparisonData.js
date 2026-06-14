import {
  getMetricEnergy,
  getMetricEpisode,
  getMetricWallTime,
} from '../../utils/runMetrics'

function getPointByEpisode(series, episode) {
  return series.find((point) => point.episode === episode)
}

function getEpisodesFromSeries(selectedRuns, getSeries) {
  return [
    ...new Set(
      selectedRuns.flatMap((run) => getSeries(run).map((point) => point.episode)),
    ),
  ].sort((a, b) => a - b)
}

export function buildRewardComparisonData(selectedRuns) {
  const episodes = getEpisodesFromSeries(
    selectedRuns,
    (run) => run.trainingResults.rewardSeries,
  )

  return episodes.map((episode) => {
    const row = { episode }

    selectedRuns.forEach((run) => {
      row[run.id] = getPointByEpisode(
        run.trainingResults.rewardSeries,
        episode,
      )?.reward
    })

    return row
  })
}

export function buildEnergyWallTimeComparisonData(selectedRuns) {
  const episodes = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.metrics.map((point, index) => getMetricEpisode(point, index)),
      ),
    ),
  ].sort((a, b) => a - b)

  return episodes.map((episode) => {
    const row = { episode }

    selectedRuns.forEach((run) => {
      const point = run.metrics.find(
        (metric, index) => getMetricEpisode(metric, index) === episode,
      )

      row[`${run.id}-energy`] = getMetricEnergy(point)
      row[`${run.id}-wallTime`] = getMetricWallTime(point)
    })

    return row
  })
}

