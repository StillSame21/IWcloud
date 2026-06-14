import MetricRow from '../shared/MetricRow'
import SectionTitle from '../shared/SectionTitle'
import { tableHeadingClass } from '../../utils/chartTheme'
import { formatNumber } from '../../utils/format'
import { getRunModelName, getTrainingRunDisplayName } from './trainingRuns'

function TableSection({ columnCount, label }) {
  return (
    <tr className="bg-slate-50/80">
      <td
        className="px-4 py-2 text-xs font-semibold uppercase tracking-normal text-slate-500"
        colSpan={columnCount}
      >
        {label}
      </td>
    </tr>
  )
}

export default function ComparisonTable({ savedModels, selectedRuns }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <SectionTitle title="Model Comparison Table" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={tableHeadingClass}>Metric</th>
              {selectedRuns.map((run) => (
                <th key={run.id} className={tableHeadingClass}>
                  {getTrainingRunDisplayName(run, savedModels)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <TableSection
              label="Configuration"
              columnCount={selectedRuns.length + 1}
            />
            <MetricRow
              label="Model Architecture"
              selectedRuns={selectedRuns}
              getValue={getRunModelName}
            />
            <MetricRow
              label="Optimizer"
              selectedRuns={selectedRuns}
              getValue={(run) => run.parameters.training?.optimizer}
            />
            <MetricRow
              label="Jobs"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.parameters.numberOfJobs, 0)}
            />
            <MetricRow
              label="Tasks"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.parameters.numberOfTasks, 0)}
            />
            <MetricRow
              label="Server Farms"
              selectedRuns={selectedRuns}
              getValue={(run) =>
                formatNumber(run.parameters.numberOfServerFarms, 0)
              }
            />
            <MetricRow
              label="Servers"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.parameters.numberOfServers, 0)}
            />
            <MetricRow
              label="Batch Size"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.parameters.training?.batchSize, 0)}
            />

            <TableSection label="Episode" columnCount={selectedRuns.length + 1} />
            <MetricRow
              label="Total Episodes"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.trainingResults.episode.total, 0)}
            />
          </tbody>
        </table>
      </div>
    </section>
  )
}
