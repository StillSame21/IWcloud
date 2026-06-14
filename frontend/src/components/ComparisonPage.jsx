import { useMemo, useState } from 'react'
import ComparisonResults from './evaluation-comparison/ComparisonResults'
import RunSelectorGrid from './evaluation-comparison/RunSelectorGrid'
import {
  getEvaluationRuns,
  maxSelectedRuns,
  minSelectedRuns,
} from './evaluation-comparison/evaluationRuns'
import EmptyComparison from './shared/EmptyComparison'
import PageIntro from './shared/PageIntro'
import { useAppState } from '../context/useAppState'
import {
  getInitialSelectedRunIds,
  getNextSelectedRunIds,
} from '../utils/runSelection'

export default function ComparisonPage() {
  const { runHistory } = useAppState()
  const evaluationRuns = useMemo(
    () => getEvaluationRuns(runHistory),
    [runHistory],
  )
  const [selectedRunIds, setSelectedRunIds] = useState(() =>
    getInitialSelectedRunIds(getEvaluationRuns(runHistory), maxSelectedRuns),
  )

  const selectedRuns = useMemo(
    () =>
      selectedRunIds
        .map((runId) => evaluationRuns.find((run) => run.id === runId))
        .filter(Boolean),
    [evaluationRuns, selectedRunIds],
  )

  const toggleRun = (runId) => {
    setSelectedRunIds((currentIds) =>
      getNextSelectedRunIds(currentIds, runId, maxSelectedRuns),
    )
  }

  return (
    <section className="space-y-5">
      <PageIntro
        title="Evaluation Comparison"
        description="Compare random algorithm and trained model evaluation runs."
        badges={[
          `${selectedRunIds.length}/${maxSelectedRuns} selected`,
          `${evaluationRuns.length} evaluation runs`,
        ]}
      />
      <RunSelectorGrid
        evaluationRuns={evaluationRuns}
        selectedRunIds={selectedRunIds}
        onToggleRun={toggleRun}
      />

      {selectedRuns.length < minSelectedRuns ? (
        <EmptyComparison>
          Select at least two evaluation runs to compare performance.
        </EmptyComparison>
      ) : (
        <ComparisonResults selectedRuns={selectedRuns} />
      )}
    </section>
  )
}
