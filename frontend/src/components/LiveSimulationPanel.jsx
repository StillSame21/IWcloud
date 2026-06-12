import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppState } from '../context/useAppState'
import { formatAdaptiveTick, getAdaptiveDomain } from '../utils/chartAxes'

function getMetricEpisode(point, index) {
  return point?.episode ?? index + 1
}

function getMetricTotalEnergyCost(point) {
  return point?.totalEnergyCost ?? point?.totalEnergy ?? point?.energyCost
}

function getMetricWallTime(point) {
  return point?.stepTime
}

function buildEpisodeEnergyData(metrics) {
  return metrics.map((metric, index) => ({
    ...metric,
    episode: getMetricEpisode(metric, index),
    totalEnergyCost: getMetricTotalEnergyCost(metric),
    wallTime: getMetricWallTime(metric),
  }))
}

function PanelHeader() {
  return (
    <div className="border-b border-slate-200 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
        Live Simulation Progression
      </h2>
      <p className="mt-2 text-sm font-normal text-slate-500">
        Total energy cost and wall time per episode
      </p>
    </div>
  )
}

function LiveMetricsChart({ metrics }) {
  if (metrics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
        No live metrics yet
      </div>
    )
  }

  const episodeEnergyData = buildEpisodeEnergyData(metrics)
  const energyDomain = getAdaptiveDomain(episodeEnergyData, 'totalEnergyCost', {
    zeroMin: true,
  })
  const wallTimeDomain = getAdaptiveDomain(episodeEnergyData, 'wallTime', {
    zeroMin: true,
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={episodeEnergyData}
        margin={{ top: 10, right: 44, bottom: 42 }}
      >
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
        <XAxis
          dataKey="episode"
          height={56}
          label={{
            value: 'Episode',
            position: 'insideBottom',
            offset: -2,
            fill: '#64748b',
          }}
          stroke="#94a3b8"
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          yAxisId="energy"
          domain={energyDomain}
          label={{
            value: 'Total Energy Cost',
            angle: -90,
            position: 'insideLeft',
            fill: '#64748b',
          }}
          stroke="#94a3b8"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={formatAdaptiveTick}
          width={72}
        />
        <YAxis
          yAxisId="wallTime"
          orientation="right"
          domain={wallTimeDomain}
          label={{
            value: 'Wall Time',
            angle: 90,
            position: 'insideRight',
            fill: '#64748b',
          }}
          stroke="#94a3b8"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={formatAdaptiveTick}
          width={72}
        />
        <Tooltip
          contentStyle={{
            borderColor: '#334155',
            borderRadius: '12px',
            background: '#0f172a',
            color: '#ffffff',
          }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
        <Line
          yAxisId="energy"
          type="linear"
          dataKey="totalEnergyCost"
          name="Total Energy Cost"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ r: 2.5, strokeWidth: 1.5, fill: '#ffffff' }}
          isAnimationActive={false}
        />
        <Line
          yAxisId="wallTime"
          type="linear"
          dataKey="wallTime"
          name="Wall Time"
          stroke="#d97706"
          strokeWidth={3}
          dot={{ r: 2.5, strokeWidth: 1.5, fill: '#ffffff' }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function LiveSimulationPanel() {
  const { liveMetrics } = useAppState()

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <PanelHeader />

      <div className="space-y-6 p-6">
        <div className="h-80 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <LiveMetricsChart metrics={liveMetrics} />
        </div>
      </div>
    </section>
  )
}
