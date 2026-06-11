import { cardClass } from '../../utils/chartTheme'
import { formatNumber } from '../../utils/format'
import { maxSelectedRuns, minSelectedRuns } from './evaluationRuns'

function getEvaluationEpisodeValue(selectedRuns) {
  if (selectedRuns.length === 0) {
    return '0/0'
  }

  return selectedRuns
    .map(
      (run) =>
        `${formatNumber(run.evaluationResults.episode.current, 0)}/${formatNumber(
          run.evaluationResults.episode.total,
          0,
        )}`,
    )
    .join(' vs ')
}

function OverviewCard({ helper, label, tone, value }) {
  return (
    <section className={`${cardClass} border-l-4 ${tone}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </section>
  )
}

export default function EvaluationOverview({ selectedRuns }) {
  const episodeValue = getEvaluationEpisodeValue(selectedRuns)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <OverviewCard
        label="Evaluation Episode"
        value={episodeValue}
        helper="Current/total episode coverage"
        tone="border-l-sky-500"
      />
      <OverviewCard
        label="Selected Evaluations"
        value={`${selectedRuns.length}/${maxSelectedRuns}`}
        helper={`${minSelectedRuns}-${maxSelectedRuns} evaluations can be compared`}
        tone="border-l-emerald-500"
      />
    </div>
  )
}
