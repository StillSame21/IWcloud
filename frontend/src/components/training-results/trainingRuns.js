export const maxSelectedRuns = 2
export const chartColors = ['#2563eb', '#d97706']

const trainingRunTypes = new Set(['Training', 'Train Model'])

export function getTrainingRuns(runHistory) {
  return runHistory.filter(
    (run) =>
      (run.runType === 'training' || trainingRunTypes.has(run.type)) &&
      run.trainingResults,
  )
}

export function getTrainingRunDisplayName(run, savedModels) {
  const linkedModel = savedModels.find((model) => model.runId === run.id)
  return linkedModel?.name ?? run.displayName ?? run.id
}

export function getRunModelName(run) {
  return run.parameters.training?.networkArchitecture ?? 'Not recorded'
}
