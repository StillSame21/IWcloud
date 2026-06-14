import MetricRow from '../shared/MetricRow'
import SectionTitle from '../shared/SectionTitle'
import { tableHeadingClass } from '../../utils/chartTheme'
import { formatNumber, formatPercent } from '../../utils/format'
import { getCompletedJobSummary } from '../../utils/runMetrics'
import { getRunDisplayName } from './evaluationRuns'

export default function ConfigurationTable({ selectedRuns }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <SectionTitle title="Evaluation Configuration" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={tableHeadingClass}>Configuration</th>
              {selectedRuns.map((run) => (
                <th key={run.id} className={tableHeadingClass}>
                  {getRunDisplayName(run)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <MetricRow
              label="Evaluation Type"
              selectedRuns={selectedRuns}
              getValue={(run) => run.type}
            />
            <MetricRow
              label="Model"
              selectedRuns={selectedRuns}
              getValue={(run) => run.parameters.selectedModel ?? 'Not used'}
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
              label="VM Types"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.parameters.numberOfVmTypes, 0)}
            />
            <MetricRow
              label="Optimal Utilization"
              selectedRuns={selectedRuns}
              getValue={(run) =>
                formatPercent((run.parameters.optimalUtilizationRate ?? 0) * 100)
              }
            />
            <MetricRow
              label="Completed Jobs"
              selectedRuns={selectedRuns}
              getValue={getCompletedJobSummary}
            />
          </tbody>
        </table>
      </div>
    </section>
  )
}
