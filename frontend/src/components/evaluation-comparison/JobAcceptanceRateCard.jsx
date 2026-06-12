import SectionTitle from '../shared/SectionTitle'
import { cardClass } from '../../utils/chartTheme'
import { formatPercent } from '../../utils/format'
import {
  getJobAcceptanceRate,
  getJobAcceptanceSummary,
} from '../../utils/runMetrics'
import { getRunChartColor, getRunDisplayName } from './evaluationRuns'

export default function JobAcceptanceRateCard({ selectedRuns }) {
  return (
    <section
      className={`${cardClass} min-h-[420px] border-l-4 border-l-emerald-500`}
    >
      <SectionTitle title="Job Acceptance Rate" />
      <div className="mt-6 space-y-5">
        {selectedRuns.map((run, index) => (
          <div key={run.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {getRunDisplayName(run)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {getJobAcceptanceSummary(run)} jobs accepted
                </p>
              </div>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getRunChartColor(index) }}
              />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">
              {formatPercent(getJobAcceptanceRate(run))}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
