import SectionTitle from '../shared/SectionTitle'
import { cardClass } from '../../utils/chartTheme'
import { formatNumber, formatPercent } from '../../utils/format'
import {
  getJobAcceptanceRate,
  getJobAcceptanceSummary,
} from '../../utils/runMetrics'
import { getRunChartColor, getRunDisplayName } from './evaluationRuns'

function getEnergyPerAcceptedJob(run) {
  const totalEnergy = run.summary?.totalEnergy ?? 0
  const totalJobs = run.parameters?.numberOfJobs ?? 0
  const rejectedJobs = run.summary?.rejectedJobs ?? 0
  const acceptedJobs = Math.max(totalJobs - rejectedJobs, 0)
  if (acceptedJobs === 0) return null
  return totalEnergy / acceptedJobs
}

export default function JobAcceptanceRateCard({ selectedRuns }) {
  return (
    <section
      className={`${cardClass} min-h-[420px] border-l-4 border-l-emerald-500`}
    >
      <SectionTitle title="Job Acceptance Rate" />
      <div className="mt-6 space-y-5">
        {selectedRuns.map((run, index) => {
          const energyPerJob = getEnergyPerAcceptedJob(run)
          return (
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
              {energyPerJob !== null ? (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {formatNumber(energyPerJob, 4)} energy per accepted job
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
