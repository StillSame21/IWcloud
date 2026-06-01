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
const trainingRunType = 'Training'
const chartColors = ['#0ea5e9', '#10b981']
const chartGridStroke = '#e2e8f0'
const axisStroke = '#94a3b8'
const axisTick = { fill: '#64748b', fontSize: 12 }
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

function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

function getTrainingRuns(runHistory) {
  return runHistory.filter(
    (run) => run.type === trainingRunType && run.trainingResults,
  )
}

function getInitialSelectedRunIds(runHistory) {
  return getTrainingRuns(runHistory)
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

function getMetricEpisode(point, index) {
  return point?.episode ?? index + 1
}

function getMetricEnergy(point) {
  return point?.totalEnergyCost ?? point?.totalEnergy ?? point?.energyCost ?? 0
}

function getMetricWallTime(point) {
  return point?.wallTime ?? point?.stepTime ?? 0
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

function getRunModelName(run) {
  return run.parameters.training?.networkArchitecture ?? 'Not recorded'
}

function SectionTitle({ title }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
      {title}
    </h2>
  )
}

function PageIntro({ selectedCount, trainingRunCount }) {
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionTitle title="Training Results" />
          <p className="mt-2 text-sm text-slate-500">
            Compare completed trained model runs side by side.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {selectedCount}/{maxSelectedRuns} selected
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {trainingRunCount} training runs
          </span>
        </div>
      </div>
    </section>
  )
}

function RunSelectorGrid({ onToggleRun, selectedRunIds, trainingRuns }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {trainingRuns.map((run) => {
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectorStat label="Model" value={getRunModelName(run)} />
            <SelectorStat
              label="Episode"
              value={`${formatNumber(
                run.trainingResults.episode.current,
                0,
              )}/${formatNumber(run.trainingResults.episode.total, 0)}`}
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
      Select two training runs to compare trained model metrics.
    </section>
  )
}

function ComparisonTable({ selectedRuns }) {
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
                  {run.id}
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
              label="Current Episode"
              selectedRuns={selectedRuns}
              getValue={(run) =>
                formatNumber(run.trainingResults.episode.current, 0)
              }
            />
            <MetricRow
              label="Total Episodes"
              selectedRuns={selectedRuns}
              getValue={(run) => formatNumber(run.trainingResults.episode.total, 0)}
            />

            <TableSection
              label="Job Acceptance Rate"
              columnCount={selectedRuns.length + 1}
            />
            <MetricRow
              label="Job Acceptance Rate"
              selectedRuns={selectedRuns}
              getValue={(run) => formatPercent(getJobAcceptanceRate(run))}
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

function ChartCard({ bodyClass = 'mt-4 h-80', children, title }) {
  return (
    <section className={chartCardClass}>
      <SectionTitle title={title} />
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

function getPointByEpisode(series, episode) {
  return series.find((point) => point.episode === episode)
}

function getEpisodesFromSeries(selectedRuns, getSeries) {
  return [
    ...new Set(
      selectedRuns.flatMap((run) => getSeries(run).map((point) => point.episode)),
    ),
  ].sort((a, b) => a - b)
}

function buildRewardComparisonData(selectedRuns) {
  const episodes = getEpisodesFromSeries(
    selectedRuns,
    (run) => run.trainingResults.rewardSeries,
  )

  return episodes.map((episode) => {
    const row = { episode }

    selectedRuns.forEach((run) => {
      row[run.id] = getPointByEpisode(
        run.trainingResults.rewardSeries,
        episode,
      )?.reward
    })

    return row
  })
}

function buildEnergyWallTimeComparisonData(selectedRuns) {
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

      row[`${run.id}-energy`] = getMetricEnergy(point)
      row[`${run.id}-wallTime`] = getMetricWallTime(point)
    })

    return row
  })
}

function buildAverageEnergyComparisonData(selectedRuns) {
  const workloads = [
    ...new Set(
      selectedRuns.flatMap((run) =>
        run.trainingResults.averageEnergyByJobLoad.map((point) => point.workload),
      ),
    ),
  ]

  return workloads.map((workload) => {
    const row = { workload }

    selectedRuns.forEach((run) => {
      const point = run.trainingResults.averageEnergyByJobLoad.find(
        (item) => item.workload === workload,
      )

      row[run.id] = point?.averageEnergy
    })

    return row
  })
}

function RewardComparisonChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Rewards Per Episode"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="episode"
            label={{
              value: 'Episode',
              position: 'insideBottom',
              offset: -8,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis stroke={axisStroke} tick={axisTick} width={64} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.id}
              name={`${run.id} reward`}
              stroke={chartColors[index]}
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

function EnergyWallTimeComparisonChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Energy and Wall Time Per Episode"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 28, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="episode"
            label={{
              value: 'Episode',
              position: 'insideBottom',
              offset: -8,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            yAxisId="energy"
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
          <YAxis
            yAxisId="wallTime"
            orientation="right"
            label={{
              value: 'Wall Time',
              angle: 90,
              position: 'insideRight',
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
              key={`${run.id}-energy`}
              yAxisId="energy"
              type="monotone"
              dataKey={`${run.id}-energy`}
              name={`${run.id} energy`}
              stroke={chartColors[index]}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {selectedRuns.map((run, index) => (
            <Line
              key={`${run.id}-wallTime`}
              yAxisId="wallTime"
              type="monotone"
              dataKey={`${run.id}-wallTime`}
              name={`${run.id} wall time`}
              stroke={chartColors[index]}
              strokeDasharray="6 5"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ActorCriticLossChart({ run }) {
  return (
    <ChartCard title={`${run.id} Actor and Critic Loss`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={run.trainingResults.lossSeries}
          margin={{ top: 12, right: 24, bottom: 18 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis stroke={axisStroke} tick={axisTick} width={56} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actorLoss"
            name="Actor loss"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="criticLoss"
            name="Critic loss"
            stroke="#0ea5e9"
            strokeDasharray="6 5"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function QValueReplayBufferChart({ run }) {
  return (
    <ChartCard title={`${run.id} Q-Value and Replay Buffer`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={run.trainingResults.replaySeries}
          margin={{ top: 12, right: 24, bottom: 18 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            yAxisId="qValue"
            stroke="#f97316"
            tick={axisTick}
            width={56}
          />
          <YAxis
            yAxisId="buffer"
            orientation="right"
            domain={[0, 100]}
            stroke="#0ea5e9"
            tick={axisTick}
            width={56}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            yAxisId="qValue"
            type="monotone"
            dataKey="qValue"
            name="Q-value"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="buffer"
            type="monotone"
            dataKey="bufferFill"
            name="Replay buffer %"
            stroke="#0ea5e9"
            strokeDasharray="6 5"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function AverageEnergyByJobLoadChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Average Energy Usage Per Job Load"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="workload" stroke={axisStroke} tick={axisTick} />
          <YAxis stroke={axisStroke} tick={axisTick} width={64} />
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

function ServerFarmAverageCpuChart({ run }) {
  return (
    <ChartCard title={`${run.id} Server Farm Average CPU Utilisation`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={run.trainingResults.serverFarmAverageCpu}
          margin={{ top: 12, right: 24, bottom: 18 }}
        >
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
          <Bar
            dataKey="averageCpu"
            name="Average CPU %"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ComparisonResults({ selectedRuns }) {
  const rewardComparisonData = useMemo(
    () => buildRewardComparisonData(selectedRuns),
    [selectedRuns],
  )
  const energyWallTimeData = useMemo(
    () => buildEnergyWallTimeComparisonData(selectedRuns),
    [selectedRuns],
  )
  const averageEnergyData = useMemo(
    () => buildAverageEnergyComparisonData(selectedRuns),
    [selectedRuns],
  )

  return (
    <>
      <ComparisonTable selectedRuns={selectedRuns} />
      <RewardComparisonChart
        data={rewardComparisonData}
        selectedRuns={selectedRuns}
      />
      <EnergyWallTimeComparisonChart
        data={energyWallTimeData}
        selectedRuns={selectedRuns}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <ActorCriticLossChart key={run.id} run={run} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <QValueReplayBufferChart key={run.id} run={run} />
        ))}
      </div>

      <AverageEnergyByJobLoadChart
        data={averageEnergyData}
        selectedRuns={selectedRuns}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <ServerFarmAverageCpuChart key={run.id} run={run} />
        ))}
      </div>
    </>
  )
}

export default function TrainingResultsPage() {
  const { runHistory } = useAppState()
  const trainingRuns = useMemo(() => getTrainingRuns(runHistory), [runHistory])
  const [selectedRunIds, setSelectedRunIds] = useState(() =>
    getInitialSelectedRunIds(runHistory),
  )

  const selectedRuns = useMemo(
    () => trainingRuns.filter((run) => selectedRunIds.includes(run.id)),
    [selectedRunIds, trainingRuns],
  )

  const toggleRun = (runId) => {
    setSelectedRunIds((currentIds) => getNextSelectedRunIds(currentIds, runId))
  }

  return (
    <section className="space-y-5">
      <PageIntro
        selectedCount={selectedRunIds.length}
        trainingRunCount={trainingRuns.length}
      />

      <RunSelectorGrid
        trainingRuns={trainingRuns}
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
