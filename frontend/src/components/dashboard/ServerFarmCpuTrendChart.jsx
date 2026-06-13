import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from '../shared/ChartCard'
import { axisStroke, axisTick, chartGridStroke, tooltipStyle } from '../../utils/chartTheme'

const Y_DOMAIN = [0, 1]

function formatUtilPct(value) {
  return `${Math.round(value * 100)}%`
}

export default function ServerFarmCpuTrendChart({ data, optimalRate }) {
  const refValue = typeof optimalRate === 'number' ? optimalRate : 0.7

  return (
    <ChartCard title="CPU Utilisation Trend Per Episode">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 18, left: 0 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={Y_DOMAIN}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatUtilPct}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatUtilPct(value), name]}
          />
          <Legend />

          {/* Band: cpuMax fills down to axis; cpuMin white-fills the bottom, leaving the band visible */}
          <Area
            type="monotone"
            dataKey="cpuMax"
            name="Farm CPU max"
            fill="#10b981"
            fillOpacity={0.15}
            stroke="none"
            dot={false}
            legendType="none"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="cpuMin"
            name="Farm CPU min"
            fill="#ffffff"
            fillOpacity={1}
            stroke="none"
            dot={false}
            legendType="none"
            isAnimationActive={false}
          />

          {/* Mean line */}
          <Line
            type="monotone"
            dataKey="cpuMean"
            name="Global CPU mean"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />

          {/* Optimal reference */}
          <ReferenceLine
            y={refValue}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `Optimal ${formatUtilPct(refValue)}`,
              position: 'insideTopRight',
              fill: '#d97706',
              fontSize: 11,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
