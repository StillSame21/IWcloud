import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppState } from '../context/useAppState'

const cardClass = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
const chartCardClass = `${cardClass} min-h-[420px]`
const chartShellClass = 'mt-4 h-80'
const chartGridStroke = '#e2e8f0'
const axisStroke = '#94a3b8'
const tooltipStyle = {
  borderColor: '#334155',
  borderRadius: '12px',
  background: '#0f172a',
  color: '#ffffff',
}
const axisTick = { fill: '#64748b', fontSize: 12 }
const trainingRunType = 'training'

const kpiToneClasses = {
  sky: 'border-l-sky-500',
  emerald: 'border-l-emerald-500',
}

const phaseToneClasses = {
  neutral: 'bg-slate-100 text-slate-700',
  warning: 'bg-amber-200 text-amber-900',
  success: 'bg-emerald-300 text-emerald-950',
  info: 'bg-slate-300 text-slate-700',
}

const diagnosticToneClasses = {
  warning: 'border-l-amber-400 bg-amber-50 text-amber-900',
  success: 'border-l-emerald-500 bg-emerald-50 text-emerald-800',
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value)
}

function getMetricStep(point, index) {
  return point?.step ?? index + 1
}

function getMetricEpisode(point, index) {
  return point?.episode ?? index + 1
}

function getMetricEnergyUsage(point) {
  return point?.energyUsage ?? point?.energyCost ?? point?.totalEnergyCost ?? 0
}

function getMetricWallTime(point) {
  return point?.wallTime ?? point?.stepTime ?? 0
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

function getSelectedModelName(savedModels, selectedModel) {
  return savedModels.find((model) => model.id === selectedModel)?.name
}

function isTrainingRun(selectedRunType) {
  return selectedRunType === trainingRunType
}

function buildTrainingKpiCards(kpis) {
  return [
    {
      id: 'episode',
      label: 'Episode',
      value: `${kpis.episode.current}/${kpis.episode.total}`,
      helper: kpis.episode.helper,
      tone: 'sky',
    },
    {
      id: 'training-phase',
      label: 'Training Phase',
      value: kpis.trainingPhase.value,
      helper: kpis.trainingPhase.helper,
      tone: 'emerald',
    },
    {
      id: 'job-acceptance',
      label: 'Job Acceptance',
      value: `${kpis.jobAcceptance.value}%`,
      helper: kpis.jobAcceptance.helper,
      tone: 'emerald',
    },
  ]
}

function buildEvaluationKpiCards({
  liveMetrics,
  savedModels,
  selectedModel,
  selectedRunType,
  simParams,
}) {
  const lastMetric = liveMetrics.at(-1)
  const currentEpisode = liveMetrics.length
    ? getMetricEpisode(lastMetric, liveMetrics.length - 1)
    : 0
  const rejectedJobs = lastMetric?.rejectedJobs ?? 0
  const totalJobs = simParams.numberOfJobs ?? 0
  const acceptedJobs = Math.max(totalJobs - rejectedJobs, 0)
  const acceptanceRate =
    totalJobs > 0 ? (acceptedJobs / totalJobs) * 100 : 0
  const averageWallTime = getAverage(liveMetrics.map(getMetricWallTime))
  const selectedModelName = getSelectedModelName(savedModels, selectedModel)
  const episodeHelper =
    selectedRunType === 'inference' && selectedModelName
      ? selectedModelName
      : `${formatNumber(simParams.numberOfJobs, 0)} jobs configured`

  return [
    {
      id: 'episode',
      label: 'Episode',
      value: formatNumber(currentEpisode, 0),
      helper: episodeHelper,
      tone: 'sky',
    },
    {
      id: 'job-acceptance-rate',
      label: 'Job Acceptance Rate',
      value: `${formatNumber(acceptanceRate, 1)}%`,
      helper: `${formatNumber(acceptedJobs, 0)}/${formatNumber(
        totalJobs,
        0,
      )} jobs accepted`,
      tone: 'emerald',
    },
    {
      id: 'average-wall-time',
      label: 'Average Wall Time',
      value: `${formatNumber(averageWallTime, 3)}s`,
      helper: `${formatNumber(liveMetrics.length, 0)} time steps sampled`,
      tone: 'sky',
    },
  ]
}

function buildEnergyUsageSeries(liveMetrics) {
  return liveMetrics.map((metric, index) => ({
    timeStep: getMetricStep(metric, index),
    energyUsage: getMetricEnergyUsage(metric),
  }))
}

function getActivePhase(timeline) {
  return timeline.phases.find(
    (phase) =>
      timeline.currentEpisode >= phase.start &&
      timeline.currentEpisode < phase.end,
  )
}

function getTimelineMarkers(timeline) {
  const markers = timeline.phases.map((phase) => phase.start)
  return [...new Set([...markers, timeline.totalEpisodes])]
}

function getUtilizationClass(value) {
  if (value < 45) {
    return 'bg-emerald-100 text-emerald-800'
  }

  if (value < 65) {
    return 'bg-teal-500 text-white'
  }

  if (value < 75) {
    return 'bg-amber-300 text-slate-950'
  }

  if (value < 85) {
    return 'bg-orange-400 text-white'
  }

  return 'bg-rose-500 text-white'
}

function SectionTitle({ title }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
      {title}
    </h2>
  )
}

function ChartCard({ children, title }) {
  return (
    <section className={chartCardClass}>
      <SectionTitle title={title} />
      <div className={chartShellClass}>{children}</div>
    </section>
  )
}

function EmptyChartState({ children }) {
  return (
    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
      {children}
    </div>
  )
}

function KpiGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <section
          key={card.id}
          className={`${cardClass} border-l-4 ${kpiToneClasses[card.tone]}`}
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {card.value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
        </section>
      ))}
    </div>
  )
}

function TrainingPhaseTimeline({ timeline }) {
  const activePhase = getActivePhase(timeline)
  const markers = getTimelineMarkers(timeline)

  return (
    <section className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Training Phase Timeline" />
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {activePhase?.label ?? 'Waiting'}
        </span>
      </div>

      <div className="flex overflow-hidden rounded-lg border border-slate-200">
        {timeline.phases.map((phase) => {
          const width =
            ((phase.end - phase.start) / timeline.totalEpisodes) * 100
          const isActive = activePhase?.id === phase.id

          return (
            <div
              key={phase.id}
              className={`flex min-h-10 items-center justify-center px-3 text-xs font-semibold ${
                phaseToneClasses[phase.tone]
              } ${isActive ? 'ring-2 ring-inset ring-slate-900/20' : ''}`}
              style={{ width: `${width}%` }}
            >
              {isActive ? `${phase.label} now` : phase.label}
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        {markers.map((episode) => (
          <span key={episode}>Ep {episode}</span>
        ))}
      </div>
    </section>
  )
}

function AgentRewardChart({ data }) {
  return (
    <ChartCard title="Agent Reward Per Episode">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, left: 10 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis stroke={axisStroke} tick={axisTick} width={62} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <ReferenceArea
            x1={60}
            x2={90}
            y1={-600}
            y2={-180}
            fill="#ef4444"
            fillOpacity={0.08}
          />
          <Line
            type="monotone"
            dataKey="farmReward"
            name="Server farm agent"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="serverReward"
            name="Server agent"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="smoothedFarmReward"
            name="Smoothed farm"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ActorCriticLossChart({ data }) {
  return (
    <ChartCard title="Actor and Critic Loss">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, left: 0 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis stroke={axisStroke} tick={axisTick} width={42} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="farmActor"
            name="Farm actor"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="farmCritic"
            name="Farm critic"
            stroke="#059669"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="serverActor"
            name="Server actor"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="serverCritic"
            name="Server critic"
            stroke="#2563eb"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ReplayBufferChart({ data }) {
  return (
    <ChartCard title="Q-Value and Replay Buffer">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, left: 0 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            yAxisId="qValue"
            stroke="#f97316"
            tick={axisTick}
            width={42}
          />
          <YAxis
            yAxisId="buffer"
            orientation="right"
            domain={[0, 100]}
            stroke="#0ea5e9"
            tick={axisTick}
            width={42}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            yAxisId="qValue"
            type="monotone"
            dataKey="qValue"
            name="Q-value mean"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="buffer"
            type="monotone"
            dataKey="bufferFill"
            name="Buffer fill %"
            stroke="#0ea5e9"
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function EnergyUsagePerTimeStepChart({ data }) {
  return (
    <ChartCard title="Energy Usage Per Time Step">
      {data.length === 0 ? (
        <EmptyChartState>No energy telemetry yet</EmptyChartState>
      ) : (
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
                value: 'Energy Usage (kWh)',
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
            <Line
              type="monotone"
              dataKey="energyUsage"
              name="Energy usage"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

function ServerFarmHeatmap({
  data,
  title = 'Server Farm CPU Utilisation Snapshot - 10 Farms x 10 Servers',
}) {
  return (
    <section className={cardClass}>
      <SectionTitle title={title} />
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px] space-y-2">
          {data.farms.map((servers, farmIndex) => (
            <div
              key={`farm-${farmIndex + 1}`}
              className="grid items-center gap-1"
              style={{
                gridTemplateColumns: '2.75rem repeat(10, minmax(2.25rem, 1fr))',
              }}
            >
              <span className="text-xs font-medium text-slate-500">
                F{farmIndex + 1}
              </span>
              {servers.map((value, serverIndex) => (
                <span
                  key={`${farmIndex}-${serverIndex}`}
                  className={`rounded-md px-2 py-1.5 text-center text-xs font-semibold ${getUtilizationClass(
                    value,
                  )}`}
                  title={`Farm ${farmIndex + 1}, server ${
                    serverIndex + 1
                  }: ${value}% CPU util`}
                >
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Low</span>
        {[28, 56, 70, 80, 90].map((value) => (
          <span
            key={value}
            className={`h-3 w-6 rounded-full ${getUtilizationClass(value)}`}
          />
        ))}
        <span>High - above optimal {data.optimalRate}%</span>
      </div>
    </section>
  )
}

function DiagnosticsPanel({ diagnostics }) {
  return (
    <section className="space-y-3">
      <SectionTitle title="Signals and Diagnostics" />
      {diagnostics.map((item) => (
        <article
          key={item.id}
          className={`rounded-lg border border-slate-200 border-l-4 p-4 ${
            diagnosticToneClasses[item.tone]
          }`}
        >
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm leading-6">{item.message}</p>
        </article>
      ))}
    </section>
  )
}

function TrainingDashboardOverview({ dashboardTelemetry }) {
  const kpiCards = useMemo(
    () => buildTrainingKpiCards(dashboardTelemetry.kpis),
    [dashboardTelemetry.kpis],
  )

  return (
    <section className="space-y-6">
      <KpiGrid cards={kpiCards} />
      <TrainingPhaseTimeline timeline={dashboardTelemetry.phaseTimeline} />
    </section>
  )
}

function EvaluationDashboardOverview({
  liveMetrics,
  savedModels,
  selectedModel,
  selectedRunType,
  simParams,
}) {
  const kpiCards = useMemo(
    () =>
      buildEvaluationKpiCards({
        liveMetrics,
        savedModels,
        selectedModel,
        selectedRunType,
        simParams,
      }),
    [liveMetrics, savedModels, selectedModel, selectedRunType, simParams],
  )

  return (
    <section className="space-y-6">
      <KpiGrid cards={kpiCards} />
    </section>
  )
}

function TrainingVisualizations({ dashboardTelemetry }) {
  return (
    <section className="space-y-6">
      <AgentRewardChart data={dashboardTelemetry.rewardSeries} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActorCriticLossChart data={dashboardTelemetry.lossSeries} />
        <ReplayBufferChart data={dashboardTelemetry.replaySeries} />
      </div>

      <ServerFarmHeatmap data={dashboardTelemetry.serverFarmUtilization} />
      <DiagnosticsPanel diagnostics={dashboardTelemetry.diagnostics} />
    </section>
  )
}

function EvaluationVisualizations({ dashboardTelemetry, liveMetrics }) {
  const energyUsageSeries = useMemo(
    () => buildEnergyUsageSeries(liveMetrics),
    [liveMetrics],
  )

  return (
    <section className="space-y-6">
      <EnergyUsagePerTimeStepChart data={energyUsageSeries} />
      <ServerFarmHeatmap
        data={dashboardTelemetry.serverFarmUtilization}
        title="Server Farm CPU Utilisation Heatmap"
      />
    </section>
  )
}

export function DashboardOverview() {
  const {
    dashboardTelemetry,
    liveMetrics,
    savedModels,
    selectedModel,
    selectedRunType,
    simParams,
  } = useAppState()

  if (isTrainingRun(selectedRunType)) {
    return <TrainingDashboardOverview dashboardTelemetry={dashboardTelemetry} />
  }

  return (
    <EvaluationDashboardOverview
      liveMetrics={liveMetrics}
      savedModels={savedModels}
      selectedModel={selectedModel}
      selectedRunType={selectedRunType}
      simParams={simParams}
    />
  )
}

export default function DashboardVisualizations() {
  const { dashboardTelemetry, liveMetrics, selectedRunType } = useAppState()

  if (isTrainingRun(selectedRunType)) {
    return <TrainingVisualizations dashboardTelemetry={dashboardTelemetry} />
  }

  return (
    <EvaluationVisualizations
      dashboardTelemetry={dashboardTelemetry}
      liveMetrics={liveMetrics}
    />
  )
}
