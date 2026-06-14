import SectionTitle from '../shared/SectionTitle'
import { cardClass } from '../../utils/chartTheme'
import { formatNumber, formatPercent } from '../../utils/format'
import {
  getAverageEnergyPerJobLoad,
  getCompletedJobRate,
  getCompletedJobSummary,
} from '../../utils/runMetrics'
import { chartColors, getTrainingRunDisplayName } from './trainingRuns'

export default function ModelComparisonCards({ savedModels, selectedRuns }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* Card A — Completed Job % */}
      <section className={`${cardClass} border-l-4 border-l-emerald-500`}>
        <SectionTitle title="Completed Job %" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {selectedRuns.map((run, index) => (
            <div key={run.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {getTrainingRunDisplayName(run, savedModels)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {getCompletedJobSummary(run)} jobs completed
                  </p>
                </div>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: chartColors[index] }}
                />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {formatPercent(getCompletedJobRate(run))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Card B — Energy Usage */}
      <section className={`${cardClass} border-l-4 border-l-sky-500`}>
        <SectionTitle title="Energy Usage" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {selectedRuns.map((run, index) => {
            const avgEnergy = getAverageEnergyPerJobLoad(run)
            return (
              <div key={run.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {getTrainingRunDisplayName(run, savedModels)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      avg energy per job load
                    </p>
                  </div>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: chartColors[index] }}
                  />
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-950">
                  {formatNumber(avgEnergy, 2)}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
