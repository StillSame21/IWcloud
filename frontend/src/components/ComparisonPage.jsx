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
import ChartCard from './shared/ChartCard'
import EmptyComparison from './shared/EmptyComparison'
import MetricRow from './shared/MetricRow'
import PageIntro from './shared/PageIntro'
import SectionTitle from './shared/SectionTitle'
import SelectorStat from './shared/SelectorStat'
import { useAppState } from '../context/useAppState'
import { formatAdaptiveTick, getAdaptiveDomain } from '../utils/chartAxes'
import {
  axisStroke,
  axisTick,
  cardClass,
  chartGridStroke,
  tableHeadingClass,
  tooltipStyle,
} from '../utils/chartTheme'
import { formatNumber, formatPercent } from '../utils/format'
import {
  getAverage,
  getJobAcceptanceRate,
  getJobAcceptanceSummary,
  getMetricEnergy,
  getMetricStep,
} from '../utils/runMetrics'
import {
  getInitialSelectedRunIds,
  getNextSelectedRunIds,
} from '../utils/runSelection'

const minSelectedRuns = 2
const maxSelectedRuns = 4
const evaluationRunTypes = [
  'Evaluation Random Algorithm',
  'Evaluated Trained Model',
]
const chartColors = ['#2563eb', '#d97706', '#059669', '#7c3aed']
const energyPriceFactor = 0.16

function getEvaluationRuns(runHistory) {
  return runHistory.filter(
    (run) =>
      evaluationRunTypes.includes(run.type) && Boolean(run.evaluationResults),
  )
}

function getRunDisplayName(run) {
  if (run.displayName) {
    return run.displayName
  }

  if (run.type === 'Evaluation Random Algorithm') {
    return 'Random Evaluation'
  }

  if (run.type === 'Evaluated Trained Model') {
    return 'MADDPG Evaluation'
  }

  return run.id
}

function getRunChartColor(index) {
  return chartColors[index % chartColors.length]
}

function getWorkloadJobs(point) {
  if (Number.isFinite(point.jobs)) {
    return point.jobs
  }

  const parsedJobs = Number(String(point.workload ?? '').match(/\d+/)?.[0])
  return Number.isFinite(parsedJobs) ? parsedJobs : 0
}

function getAverageEnergyPerEpisode(run) {
  return getAverage(run.metrics.map(getMetricEnergy))
}

function getAverageElectricityPricePerEpisode(run) {
  return getAverageEnergyPerEpisode(run) * energyPriceFactor
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
        label="Selected Evaluations"
        value={`${selectedRuns.length}/${maxSelectedRuns}`}
        helper={`${minSelectedRuns}-${maxSelectedRuns} evaluations can be compared`}
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
            <span className="font-semibold text-slate-950">
              {getRunDisplayName(run)}
            </span>
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
          </div>
        </div>
      </div>
    </label>
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

function buildEnergyPerTimeStepData(selectedRuns) {
  const timeSteps = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.metrics.map((point, index) => getMetricStep(point, index)),
      ),
    ),
  ].sort((a, b) => a - b)

  return timeSteps.map((timeStep) => {
    const row = { timeStep }

    selectedRuns.forEach((run) => {
      const point = run.metrics.find(
        (metric, index) => getMetricStep(metric, index) === timeStep,
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

function buildEnergyWorkloadData(selectedRuns) {
  return buildWorkloadComparisonData(
    selectedRuns,
    (run) => run.evaluationResults.averageEnergyByJobLoad,
    (point, run) => ({
      [`${run.id}-energy`]: point.averageEnergy,
      [`${run.id}-price`]: Number((point.averageEnergy * energyPriceFactor).toFixed(2)),
    }),
  ).map((row) => {
    const nextRow = { jobs: row.jobs, workload: row.workload }

    selectedRuns.forEach((run) => {
      const values = row[run.id]

      nextRow[`${run.id}-energy`] = values?.[`${run.id}-energy`]
      nextRow[`${run.id}-price`] = values?.[`${run.id}-price`]
    })

    return nextRow
  })
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
  const yDomain = getAdaptiveDomain(data, selectedRuns.map((run) => run.id), {
    zeroMin: true,
  })

  return (
    <ChartCard
      title="Energy Per Time Step"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 48 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="timeStep"
            height={58}
            label={{
              value: 'Time Step',
              position: 'insideBottom',
              offset: -4,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            domain={yDomain}
            label={{
              value: 'Energy',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={72}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
          {selectedRuns.map((run, index) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.id}
              name={getRunDisplayName(run)}
              stroke={getRunChartColor(index)}
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

function WallTimePerWorkloadChart({ data, selectedRuns }) {
  const yDomain = getAdaptiveDomain(data, selectedRuns.map((run) => run.id), {
    zeroMin: true,
  })

  return (
    <ChartCard
      title="Wall Time Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 56 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="jobs"
            height={64}
            label={{
              value: 'Number of Jobs',
              position: 'insideBottom',
              offset: -6,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            domain={yDomain}
            label={{
              value: 'Wall Time (s)',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
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
          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={getRunDisplayName(run)}
              fill={getRunChartColor(index)}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function CombinedEnergyWorkloadChart({ data, selectedRuns }) {
  const energyKeys = selectedRuns.map((run) => `${run.id}-energy`)
  const priceKeys = selectedRuns.map((run) => `${run.id}-price`)
  const energyDomain = getAdaptiveDomain(data, energyKeys, {
    zeroMin: true,
  })
  const priceDomain = getAdaptiveDomain(data, priceKeys, { zeroMin: true })

  return (
    <ChartCard
      title="Energy Usage and Price Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[28rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="10%"
          barGap={2}
          margin={{ top: 12, right: 52, bottom: 76, left: 16 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="workload"
            height={76}
            label={{
              value: 'Number of Jobs',
              position: 'insideBottom',
              offset: -6,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            yAxisId="energy"
            domain={energyDomain}
            label={{
              value: 'Energy Usage',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={76}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            domain={priceDomain}
            label={{
              value: 'Energy Price',
              angle: 90,
              position: 'insideRight',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={76}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatNumber(value, 2),
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ lineHeight: '22px', paddingTop: 18 }}
          />
          {selectedRuns.map((run, index) => (
            <Bar
              key={`${run.id}-energy`}
              yAxisId="energy"
              dataKey={`${run.id}-energy`}
              name={`${getRunDisplayName(run)} energy usage`}
              fill={getRunChartColor(index)}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
          {selectedRuns.map((run, index) => (
            <Bar
              key={`${run.id}-price`}
              yAxisId="price"
              dataKey={`${run.id}-price`}
              name={`${getRunDisplayName(run)} energy price`}
              fill={getRunChartColor(index)}
              fillOpacity={0.42}
              stroke={getRunChartColor(index)}
              strokeWidth={1.5}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ServerFarmCpuComparisonChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Server Farm CPU Utilisation Rate"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="farm" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={[0, 1]}
            label={{
              value: 'CPU Utilization Rate',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={64}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatNumber(value, 2)}
          />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={getRunDisplayName(run)}
              fill={getRunChartColor(index)}
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
  const energyWorkloadData = useMemo(
    () => buildEnergyWorkloadData(selectedRuns),
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
      <CombinedEnergyWorkloadChart
        data={energyWorkloadData}
        selectedRuns={selectedRuns}
      />
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
    getInitialSelectedRunIds(getEvaluationRuns(runHistory), maxSelectedRuns),
  )

  const selectedRuns = useMemo(
    () =>
      selectedRunIds
        .map((runId) => evaluationRuns.find((run) => run.id === runId))
        .filter(Boolean),
    [evaluationRuns, selectedRunIds],
  )

  const toggleRun = (runId) => {
    setSelectedRunIds((currentIds) =>
      getNextSelectedRunIds(currentIds, runId, maxSelectedRuns),
    )
  }

  return (
    <section className="space-y-5">
      <PageIntro
        title="Evaluation Comparison"
        description="Compare random algorithm and trained model evaluation runs."
        badges={[
          `${selectedRunIds.length}/${maxSelectedRuns} selected`,
          `${evaluationRuns.length} evaluation runs`,
        ]}
      />
      <EvaluationOverview selectedRuns={selectedRuns} />
      <RunSelectorGrid
        evaluationRuns={evaluationRuns}
        selectedRunIds={selectedRunIds}
        onToggleRun={toggleRun}
      />

      {selectedRuns.length < minSelectedRuns ? (
        <EmptyComparison>
          Select at least two evaluation runs to compare performance.
        </EmptyComparison>
      ) : (
        <ComparisonResults selectedRuns={selectedRuns} />
      )}
    </section>
  )
}
