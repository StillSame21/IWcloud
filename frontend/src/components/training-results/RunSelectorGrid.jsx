import RunSelectorCard from '../shared/RunSelectorCard'
import SelectorStat from '../shared/SelectorStat'
import { formatNumber, formatPercent } from '../../utils/format'
import { getCompletedJobRate } from '../../utils/runMetrics'
import {
  getRunModelName,
  getTrainingRunDisplayName,
  maxSelectedRuns,
} from './trainingRuns'

export default function RunSelectorGrid({
  onToggleRun,
  savedModels,
  selectedRunIds,
  trainingRuns,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {trainingRuns.map((run) => {
        const isSelected = selectedRunIds.includes(run.id)
        const isDisabled = !isSelected && selectedRunIds.length >= maxSelectedRuns

        return (
          <RunSelectorCard
            key={run.id}
            badgeLabel={run.type}
            dateTime={run.dateTime}
            isDisabled={isDisabled}
            isSelected={isSelected}
            name={getTrainingRunDisplayName(run, savedModels)}
            statColsClass="sm:grid-cols-3"
            onToggle={() => onToggleRun(run.id)}
          >
            <SelectorStat label="Model" value={getRunModelName(run)} />
            <SelectorStat
              label="Episode"
              value={`${formatNumber(
                run.trainingResults.episode.current,
                0,
              )}/${formatNumber(run.trainingResults.episode.total, 0)}`}
            />
            <SelectorStat
              label="Completed Job %"
              value={formatPercent(getCompletedJobRate(run))}
            />
          </RunSelectorCard>
        )
      })}
    </div>
  )
}
