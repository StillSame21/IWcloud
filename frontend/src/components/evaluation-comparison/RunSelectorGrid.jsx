import RunSelectorCard from '../shared/RunSelectorCard'
import SelectorStat from '../shared/SelectorStat'
import { formatNumber, formatPercent } from '../../utils/format'
import { getJobAcceptanceRate } from '../../utils/runMetrics'
import {
  getAverageElectricityPricePerEpisode,
  getAverageEnergyPerEpisode,
  getRunDisplayName,
  maxSelectedRuns,
} from './evaluationRuns'

export default function RunSelectorGrid({
  evaluationRuns,
  onToggleRun,
  selectedRunIds,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {evaluationRuns.map((run) => {
        const isSelected = selectedRunIds.includes(run.id)
        const isDisabled = !isSelected && selectedRunIds.length >= maxSelectedRuns

        return (
          <RunSelectorCard
            key={run.id}
            badgeLabel={run.type}
            dateTime={run.dateTime}
            isDisabled={isDisabled}
            isSelected={isSelected}
            name={getRunDisplayName(run)}
            statColsClass="sm:grid-cols-4"
            onToggle={() => onToggleRun(run.id)}
          >
            <SelectorStat
              label="Episode"
              value={`${formatNumber(
                run.evaluationResults.episode.current,
                0,
              )}/${formatNumber(run.evaluationResults.episode.total, 0)}`}
            />
            <SelectorStat
              label="Avg Energy"
              value={formatNumber(getAverageEnergyPerEpisode(run), 1)}
            />
            <SelectorStat
              label="Avg Price"
              value={formatNumber(getAverageElectricityPricePerEpisode(run), 2)}
            />
            <SelectorStat
              label="Job Acceptance"
              value={formatPercent(getJobAcceptanceRate(run))}
            />
          </RunSelectorCard>
        )
      })}
    </div>
  )
}
