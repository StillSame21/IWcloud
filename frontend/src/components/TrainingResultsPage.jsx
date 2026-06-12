import { useMemo, useState } from 'react'
import EmptyComparison from './shared/EmptyComparison'
import PageIntro from './shared/PageIntro'
import ComparisonResults from './training-results/ComparisonResults'
import RunSelectorGrid from './training-results/RunSelectorGrid'
import { getTrainingRuns, maxSelectedRuns } from './training-results/trainingRuns'
import { useAppState } from '../context/useAppState'
import {
  getInitialSelectedRunIds,
  getNextSelectedRunIds,
} from '../utils/runSelection'

export default function TrainingResultsPage() {
  const { runHistory, savedModels } = useAppState()
  const trainingRuns = useMemo(() => getTrainingRuns(runHistory), [runHistory])
  const [selectedRunIds, setSelectedRunIds] = useState(() =>
    getInitialSelectedRunIds(getTrainingRuns(runHistory), maxSelectedRuns),
  )
  const effectiveSelectedRunIds = useMemo(() => {
    const availableIds = trainingRuns.map((run) => run.id)
    const validSelectedIds = selectedRunIds.filter((id) =>
      availableIds.includes(id),
    )

    if (validSelectedIds.length > 0) {
      return validSelectedIds.slice(0, maxSelectedRuns)
    }

    return availableIds.slice(0, maxSelectedRuns)
  }, [selectedRunIds, trainingRuns])

  const selectedRuns = useMemo(
    () =>
      trainingRuns.filter((run) => effectiveSelectedRunIds.includes(run.id)),
    [effectiveSelectedRunIds, trainingRuns],
  )

  const toggleRun = (runId) => {
    setSelectedRunIds(
      getNextSelectedRunIds(effectiveSelectedRunIds, runId, maxSelectedRuns),
    )
  }

  return (
    <section className="space-y-5">
      <PageIntro
        title="Training Results"
        description="Compare completed trained model runs side by side."
        badges={[
          `${effectiveSelectedRunIds.length}/${maxSelectedRuns} selected`,
          `${trainingRuns.length} training runs`,
        ]}
      />

      <RunSelectorGrid
        savedModels={savedModels}
        trainingRuns={trainingRuns}
        selectedRunIds={effectiveSelectedRunIds}
        onToggleRun={toggleRun}
      />

      {selectedRuns.length < maxSelectedRuns ? (
        <EmptyComparison>
          Select two training runs to compare trained model metrics.
        </EmptyComparison>
      ) : (
        <ComparisonResults
          savedModels={savedModels}
          selectedRuns={selectedRuns}
        />
      )}
    </section>
  )
}
