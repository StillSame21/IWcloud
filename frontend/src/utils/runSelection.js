export function getInitialSelectedRunIds(runs, maxSelectedRuns) {
  return runs.slice(0, maxSelectedRuns).map((run) => run.id)
}

export function getNextSelectedRunIds(currentIds, runId, maxSelectedRuns) {
  if (currentIds.includes(runId)) {
    return currentIds.filter((id) => id !== runId)
  }

  if (currentIds.length >= maxSelectedRuns) {
    return currentIds
  }

  return [...currentIds, runId]
}
