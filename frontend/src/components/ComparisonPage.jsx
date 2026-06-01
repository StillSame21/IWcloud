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

const maxSelectedRuns = 2
const evaluationRunTypes = [
  'Evaluation Random Algorithm',
  'Evaluated Trained Model',
]
const chartColors = ['#0ea5e9', '#10b981']
const workloadLineColors = {
  'Evaluated Trained Model': '#737373',
  'Evaluation Random Algorithm': '#ef4444',
}
const chartGridStroke = '#e2e8f0'
const axisStroke = '#94a3b8'
const axisTick = { fill: '#64748b', fontSize: 12 }
const electricityPricePerKwh = 0.16
const tooltipStyle = {
  borderColor: '#334155',
  borderRadius: '12px',
  background: '#0f172a',
  color: '#ffffff',
}

const cardClass = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
const chartCardClass = `${cardClass} min-h-[420px]`
const tableHeadingClass =
  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500'
const tableLabelClass = 'whitespace-nowrap px-4 py-3 font-semibold text-slate-700'
const tableValueClass = 'whitespace-nowrap px-4 py-3 text-slate-600'

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value ?? 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value ?? 0)
}

function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

function getEvaluationRuns(runHistory) {
  return runHistory.filter(
    (run) =>
      evaluationRunTypes.includes(run.type) && Boolean(run.evaluationResults),
  )
}

function getRunDisplayName(run) {
  if (run.type === 'Evaluation Random Algorithm') {
    return 'Random Algorithm'
  }

  if (run.type === 'Evaluated Trained Model') {
    return 'MADDPG'
  }

  return run.id
}

function getRunChartColor(run, index) {
  return workloadLineColors[run.type] ?? chartColors[index]
}

function getInitialSelectedRunIds(runHistory) {
  return getEvaluationRuns(runHistory)
    .slice(0, maxSelectedRuns)
    .map((run) => run.id)
}

function getNextSelectedRunIds(currentIds, runId) {
  if (currentIds.includes(runId)) {
    return currentIds.filter((id) => id !== runId)
  }

  if (currentIds.length >= maxSelectedRuns) {
    return currentIds
  }

  return [...currentIds, runId]
}

function getMetricEnergy(point) {
  return point?.totalEnergyCost ?? point?.totalEnergy ?? point?.energyCost ?? 0
}

function getMetricTimeStep(point, index) {
  return point?.step ?? index + 1
}

function getWorkloadJobs(point) {
  if (Number.isFinite(point.jobs)) {
    return point.jobs
  }

  const parsedJobs = Number(String(point.workload ?? '').match(/\d+/)?.[0])
  return Number.isFinite(parsedJobs) ? parsedJobs : 0
}

function getAverage(values) {
  const numericValues = values.filter(Number.isFinite)

  if (numericValues.length === 0) {
    return 0
  }

  return (
    numericValues.reduce((total, value) => total + value, 0) /
    numericValues.length
  )
}

function getAverageEnergyPerEpisode(run) {
  return getAverage(run.metrics.map(getMetricEnergy))
}

function getAverageElectricityPricePerEpisode(run) {
  return getAverageEnergyPerEpisode(run) * electricityPricePerKwh
}

function getRejectedJobs(run) {
  return run.summary.rejectedJobs ?? run.summary.rejectedTasks ?? 0
}

function getJobAcceptanceRate(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0

  if (totalJobs === 0) {
    return 0
  }

  const acceptedJobs = Math.max(totalJobs - getRejectedJobs(run), 0)
  return (acceptedJobs / totalJobs) * 100
}

function getJobAcceptanceSummary(run) {
  const totalJobs = run.parameters.numberOfJobs ?? 0
  const acceptedJobs = Math.max(totalJobs - getRejectedJobs(run), 0)

  return `${formatNumber(acceptedJobs, 0)}/${formatNumber(totalJobs, 0)}`
}

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

function SectionTitle({ title }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
      {title}
    </h2>
  )
}

function ChartCard({ bodyClass = 'mt-4 h-80', children, title }) {
  return (
    <section className={chartCardClass}>
      <SectionTitle title={title} />
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

function PageIntro({ evaluationRunCount, selectedCount }) {
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionTitle title="Evaluation Comparison" />
          <p className="mt-2 text-sm text-slate-500">
            Compare random algorithm and trained model evaluation runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {selectedCount}/{maxSelectedRuns} selected
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {evaluationRunCount} evaluation runs
          </span>
        </div>
      </div>
    </section>
  )
}

function EvaluationOverview({ selectedRuns }) {
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
        label="Evaluation Pair"
        value={`${selectedRuns.length}/${maxSelectedRuns}`}
        helper="Random algorithm and trained model"
        tone="border-l-emerald-500"
      />
    </div>
  )
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

function RunSelectorGrid({ evaluationRuns, onToggleRun, selectedRunIds }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {evaluationRuns.map((run) => {
        const isSelected = selectedRunIds.includes(run.id)
        const isDisabled = !isSelected && selectedRunIds.length >= maxSelectedRuns

        return (
          <RunSelectorCard
            key={run.id}
            run={run}
            isDisabled={isDisabled}
            isSelected={isSelected}
            onToggle={() => onToggleRun(run.id)}
          />
        )
      })}
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
      className={`block rounded-xl border bg-white p-5 shadow-sm transition ${selectedClass} ${disabledClass}`}
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <SelectorStat
              label="Episode"
              value={`${formatNumber(
                run.evaluationResults.episode.current,
                0,
              )}/${formatNumber(run.evaluationResults.episode.total, 0)}`}
            />
            <SelectorStat
              label="Avg Energy"
              value={`${formatNumber(getAverageEnergyPerEpisode(run), 1)} kWh`}
            />
            <SelectorStat
              label="Avg Price"
              value={formatCurrency(getAverageElectricityPricePerEpisode(run))}
            />
            <SelectorStat
              label="Job Acceptance"
              value={formatPercent(getJobAcceptanceRate(run))}
            />
          </div>
        </div>
      </div>
    </label>
  )
}

function SelectorStat({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function EmptyComparison() {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
      Select two evaluation runs to compare random algorithm and trained model
      performance.
    </section>
  )
}

function ConfigurationTable({ selectedRuns }) {
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
                  {run.id}
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
              label="Accepted Jobs"
              selectedRuns={selectedRuns}
              getValue={getJobAcceptanceSummary}
            />
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MetricRow({ getValue, label, selectedRuns }) {
  return (
    <tr>
      <td className={tableLabelClass}>{label}</td>
      {selectedRuns.map((run) => (
        <td key={`${run.id}-${label}`} className={tableValueClass}>
          {getValue(run) ?? 'Not recorded'}
        </td>
      ))}
    </tr>
  )
}

function buildEnergyPerTimeStepData(selectedRuns) {
  const timeSteps = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.metrics.map((point, index) => getMetricTimeStep(point, index)),
      ),
    ),
  ].sort((a, b) => a - b)

  return timeSteps.map((timeStep) => {
    const row = { timeStep }

    selectedRuns.forEach((run) => {
      const point = run.metrics.find(
        (metric, index) => getMetricTimeStep(metric, index) === timeStep,
      )

      row[run.id] = getMetricEnergy(point)
    })

    return row
  })
}

function buildWorkloadComparisonData(selectedRuns, getPoints, getValue) {
  const jobCounts = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        getPoints(run).map((point) => getWorkloadJobs(point)),
      ),
    ),
  ].sort((a, b) => a - b)

  return jobCounts.map((jobs) => {
    const row = { jobs, workload: `${jobs} jobs` }

    selectedRuns.forEach((run) => {
      const point = getPoints(run).find(
        (item) => getWorkloadJobs(item) === jobs,
      )

      row[run.id] = point ? getValue(point, run) : undefined
    })

    return row
  })
}

function buildEnergyUsagePerWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.averageEnergyByJobLoad,
    (point) => point.averageEnergy,
  )
}

function buildEnergyPricePerWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.averageEnergyByJobLoad,
    (point) => Number((point.averageEnergy * electricityPricePerKwh).toFixed(2)),
  )
}

function buildWallTimePerWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.wallTimeByJobLoad,
    (point) => point.averageWallTime,
  )
}

function getFarmNumber(farm) {
  return Number(farm.replace('Farm ', ''))
}

function buildServerFarmCpuData(selectedRuns) {
  const farms = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.evaluationResults.serverFarmAverageCpu.map((point) => point.farm),
      ),
    ),
  ].sort((a, b) => getFarmNumber(a) - getFarmNumber(b))

  return farms.map((farm) => {
    const row = { farm }

    selectedRuns.forEach((run) => {
      const point = run.evaluationResults.serverFarmAverageCpu.find(
        (item) => item.farm === farm,
      )

      row[run.id] = point?.averageCpu
    })

    return row
  })
}

function EnergyPerTimeStepChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Energy Per Time Step"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="timeStep"
            label={{
              value: 'Time Step',
              position: 'insideBottom',
              offset: -8,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            label={{
              value: 'Energy',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={72}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.id}
              name={getRunDisplayName(run)}
              stroke={getRunChartColor(run, index)}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function JobAcceptanceRateCard({ selectedRuns }) {
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
                style={{ backgroundColor: getRunChartColor(run, index) }}
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

function WallTimePerWorkloadChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Wall Time Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 24 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="jobs"
            label={{
              value: 'Number of Jobs',
              position: 'insideBottom',
              offset: -10,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            label={{
              value: 'Wall Time (s)',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={72}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              `${formatNumber(value, 3)}s`,
              name,
            ]}
            labelFormatter={(jobs) => `${formatNumber(jobs, 0)} jobs`}
          />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={getRunDisplayName(run)}
              fill={getRunChartColor(run, index)}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function WorkloadLineChart({
  data,
  formatValue,
  selectedRuns,
  title,
  yAxisLabel,
}) {
  return (
    <ChartCard
      title={title}
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 28, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="jobs"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={data.map((point) => point.jobs)}
            label={{
              value: 'Number of Jobs',
              position: 'insideBottom',
              offset: -10,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={76}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatValue(value),
              name,
            ]}
            labelFormatter={(jobs) => `${formatNumber(jobs, 0)} jobs`}
          />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Line
              key={run.id}
              type="linear"
              dataKey={run.id}
              name={getRunDisplayName(run)}
              stroke={getRunChartColor(run, index)}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function EnergyUsagePerWorkloadChart({ data, selectedRuns }) {
  return (
    <WorkloadLineChart
      data={data}
      formatValue={(value) => `${formatNumber(value, 2)} kWh`}
      selectedRuns={selectedRuns}
      title="Energy Usage Per Workload / Number of Jobs"
      yAxisLabel="Energy Usage (kWh)"
    />
  )
}

function EnergyPricePerWorkloadChart({ data, selectedRuns }) {
  return (
    <WorkloadLineChart
      data={data}
      formatValue={formatCurrency}
      selectedRuns={selectedRuns}
      title="Energy Price Per Workload / Number of Jobs"
      yAxisLabel="Energy Price ($)"
    />
  )
}

function ServerFarmCpuComparisonChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Server Farm CPU Utilisation"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="farm" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={[0, 100]}
            label={{
              value: 'CPU %',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={64}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={run.id}
              fill={chartColors[index]}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ComparisonResults({ selectedRuns }) {
  const energyPerTimeStepData = useMemo(
    () => buildEnergyPerTimeStepData(selectedRuns),
    [selectedRuns],
  )
  const energyUsagePerWorkloadData = useMemo(
    () => buildEnergyUsagePerWorkloadData(selectedRuns),
    [selectedRuns],
  )
  const energyPricePerWorkloadData = useMemo(
    () => buildEnergyPricePerWorkloadData(selectedRuns),
    [selectedRuns],
  )
  const wallTimePerWorkloadData = useMemo(
    () => buildWallTimePerWorkloadData(selectedRuns),
    [selectedRuns],
  )
  const serverFarmCpuData = useMemo(
    () => buildServerFarmCpuData(selectedRuns),
    [selectedRuns],
  )

  return (
    <>
      <ConfigurationTable selectedRuns={selectedRuns} />
      <EnergyPerTimeStepChart
        data={energyPerTimeStepData}
        selectedRuns={selectedRuns}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <JobAcceptanceRateCard selectedRuns={selectedRuns} />
        <WallTimePerWorkloadChart
          data={wallTimePerWorkloadData}
          selectedRuns={selectedRuns}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <EnergyUsagePerWorkloadChart
          data={energyUsagePerWorkloadData}
          selectedRuns={selectedRuns}
        />
        <EnergyPricePerWorkloadChart
          data={energyPricePerWorkloadData}
          selectedRuns={selectedRuns}
        />
      </div>
      <ServerFarmCpuComparisonChart
        data={serverFarmCpuData}
        selectedRuns={selectedRuns}
      />
    </>
  )
}

export default function ComparisonPage() {
  const { runHistory } = useAppState()
  const evaluationRuns = useMemo(
    () => getEvaluationRuns(runHistory),
    [runHistory],
  )
  const [selectedRunIds, setSelectedRunIds] = useState(() =>
    getInitialSelectedRunIds(runHistory),
  )

  const selectedRuns = useMemo(
    () => evaluationRuns.filter((run) => selectedRunIds.includes(run.id)),
    [evaluationRuns, selectedRunIds],
  )

  const toggleRun = (runId) => {
    setSelectedRunIds((currentIds) => getNextSelectedRunIds(currentIds, runId))
  }

  return (
    <section className="space-y-5">
      <PageIntro
        evaluationRunCount={evaluationRuns.length}
        selectedCount={selectedRunIds.length}
      />
      <EvaluationOverview selectedRuns={selectedRuns} />
      <RunSelectorGrid
        evaluationRuns={evaluationRuns}
        selectedRunIds={selectedRunIds}
        onToggleRun={toggleRun}
      />

      {selectedRuns.length < maxSelectedRuns ? (
        <EmptyComparison />
      ) : (
        <ComparisonResults selectedRuns={selectedRuns} />
      )}
    </section>
  )
}
