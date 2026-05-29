import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatusBadge from './StatusBadge'
import { useAppState } from '../context/useAppState'

const chartColors = ['#0ea5e9', '#22c55e', '#a855f7', '#f97316']

const comparisonRows = [
  ['numberOfJobs', 'Jobs'],
  ['numberOfTasks', 'Tasks'],
  ['numberOfServerFarms', 'Server Farms'],
  ['numberOfServers', 'Servers'],
  ['numberOfVmTypes', 'VM Types'],
  ['energyCoeffAlpha', 'Energy Alpha'],
  ['energyCoeffBeta', 'Energy Beta'],
  ['optimalUtilizationRate', 'Optimal Utilization'],
  ['staticPower', 'Static Power'],
]

const summaryRows = [
  ['finalEnergyCost', 'Final Energy Cost'],
  ['totalEnergy', 'Total Energy'],
  ['rejectedTasks', 'Rejected Tasks'],
  ['avgStepTime', 'Avg Step Time'],
]

const chartSectionClass =
  'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
const tableHeadingClass =
  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500'
const tableLabelClass = 'whitespace-nowrap px-4 py-3 font-semibold text-slate-700'
const tableValueClass = 'whitespace-nowrap px-4 py-3 text-slate-600'

function formatMetric(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
  }).format(value)
}

function getMetricEpisode(point, index) {
  return point?.episode ?? index + 1
}

function getMetricTotalEnergyCost(point) {
  return point?.totalEnergyCost ?? point?.totalEnergy ?? point?.energyCost
}

function buildEpisodeEnergyData(selectedRuns) {
  if (selectedRuns.length === 0) {
    return []
  }

  const episodes = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.metrics.map((point, index) => getMetricEpisode(point, index)),
      ),
    ),
  ].sort((a, b) => a - b)

  return episodes.map((episode) => {
    const row = { episode }

    selectedRuns.forEach((run) => {
      const point = run.metrics.find(
        (metric, index) => getMetricEpisode(metric, index) === episode,
      )
      row[run.id] = getMetricTotalEnergyCost(point)
    })

    return row
  })
}

function buildBarData(selectedRuns) {
  return selectedRuns.map((run) => ({
    name: run.id,
    totalEnergy: run.summary.totalEnergy,
    rejectedTasks: run.summary.rejectedTasks,
    avgStepTime: run.summary.avgStepTime,
  }))
}

function getNextSelectedRunIds(currentIds, runId) {
  if (currentIds.includes(runId)) {
    return currentIds.filter((id) => id !== runId)
  }

  if (currentIds.length >= 4) {
    return currentIds
  }

  return [...currentIds, runId]
}

function PageIntro({ selectedCount }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
            Comparison
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select 2 to 4 completed runs for side-by-side analysis.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {selectedCount} selected
        </span>
      </div>
    </div>
  )
}

function RunSelectorGrid({ onToggleRun, runHistory, selectedRunIds }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {runHistory.map((run) => (
        <RunSelectorCard
          key={run.id}
          run={run}
          isSelected={selectedRunIds.includes(run.id)}
          isDisabled={
            !selectedRunIds.includes(run.id) && selectedRunIds.length >= 4
          }
          onToggle={() => onToggleRun(run.id)}
        />
      ))}
    </div>
  )
}

function RunSelectorCard({ isDisabled, isSelected, onToggle, run }) {
  const selectedClass = isSelected
    ? 'border-sky-500 ring-2 ring-sky-500/15'
    : 'border-slate-200'
  const disabledClass = isDisabled ? 'opacity-55' : ''

  return (
    <label
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${selectedClass} ${disabledClass}`}
    >
      <div className="flex items-start gap-3">
        <input
          className="mt-1 h-4 w-4 accent-sky-500"
          type="checkbox"
          checked={isSelected}
          disabled={isDisabled}
          onChange={onToggle}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-950">{run.id}</span>
            <StatusBadge label={run.type} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{run.dateTime}</p>
        </div>
      </div>
    </label>
  )
}

function EmptyComparison() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
      Select at least two runs to compare metrics and parameters.
    </div>
  )
}

function ComparisonResults({ barData, episodeEnergyData, selectedRuns }) {
  return (
    <>
      <ComparisonTable selectedRuns={selectedRuns} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <EnergyCostChart
          data={episodeEnergyData}
          selectedRuns={selectedRuns}
        />
        <FinalMetricBars data={barData} />
      </div>
    </>
  )
}

function ComparisonTable({ selectedRuns }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={tableHeadingClass}>Parameter / Metric</th>
              {selectedRuns.map((run) => (
                <th key={run.id} className={tableHeadingClass}>
                  {run.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <MetricTableRows
              rows={comparisonRows}
              selectedRuns={selectedRuns}
              getValue={(run, key) => run.parameters[key]}
            />
            <MetricTableRows
              rows={summaryRows}
              selectedRuns={selectedRuns}
              getValue={(run, key) => run.summary[key]}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricTableRows({ getValue, rows, selectedRuns }) {
  return rows.map(([key, label]) => (
    <tr key={key}>
      <td className={tableLabelClass}>{label}</td>
      {selectedRuns.map((run) => (
        <td key={`${run.id}-${key}`} className={tableValueClass}>
          {formatMetric(getValue(run, key))}
        </td>
      ))}
    </tr>
  ))
}

function ChartSection({ children, title }) {
  return (
    <section className={chartSectionClass}>
      <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
        {title}
      </h3>
      <div className="mt-4 h-80">{children}</div>
    </section>
  )
}

function EnergyCostChart({ data, selectedRuns }) {
  return (
    <ChartSection title="Total Energy Cost Per Episode">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 18 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            dataKey="episode"
            label={{
              value: 'Episode',
              position: 'insideBottom',
              offset: -8,
              fill: '#64748b',
            }}
            stroke="#94a3b8"
          />
          <YAxis
            label={{
              value: 'Total Energy Cost',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke="#94a3b8"
            width={72}
          />
          <Tooltip />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.id}
              stroke={chartColors[index]}
              strokeWidth={3}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartSection>
  )
}

function FinalMetricBars({ data }) {
  return (
    <ChartSection title="Final Metric Bars">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis yAxisId="energy" stroke="#0ea5e9" width={64} />
          <YAxis yAxisId="small" orientation="right" stroke="#64748b" />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="energy"
            dataKey="totalEnergy"
            name="Total Energy"
            fill="#0ea5e9"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            yAxisId="small"
            dataKey="rejectedTasks"
            name="Rejected Tasks"
            fill="#f97316"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            yAxisId="small"
            dataKey="avgStepTime"
            name="Avg Step Time"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartSection>
  )
}

export default function ComparisonPage() {
  const { runHistory } = useAppState()
  const [selectedRunIds, setSelectedRunIds] = useState(
    runHistory.slice(0, 2).map((run) => run.id),
  )

  const selectedRuns = useMemo(
    () => runHistory.filter((run) => selectedRunIds.includes(run.id)),
    [runHistory, selectedRunIds],
  )

  const episodeEnergyData = useMemo(
    () => buildEpisodeEnergyData(selectedRuns),
    [selectedRuns],
  )
  const barData = useMemo(() => buildBarData(selectedRuns), [selectedRuns])

  const toggleRun = (runId) => {
    setSelectedRunIds((currentIds) => getNextSelectedRunIds(currentIds, runId))
  }

  return (
    <section className="space-y-5">
      <PageIntro selectedCount={selectedRunIds.length} />

      <RunSelectorGrid
        runHistory={runHistory}
        selectedRunIds={selectedRunIds}
        onToggleRun={toggleRun}
      />

      {selectedRuns.length < 2 ? (
        <EmptyComparison />
      ) : (
        <ComparisonResults
          barData={barData}
          episodeEnergyData={episodeEnergyData}
          selectedRuns={selectedRuns}
        />
      )}
    </section>
  )
}
