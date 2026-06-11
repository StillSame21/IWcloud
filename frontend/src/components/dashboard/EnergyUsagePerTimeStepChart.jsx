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
import ChartCard from '../shared/ChartCard'
import { formatAdaptiveTick, getAdaptiveDomain } from '../../utils/chartAxes'
import {
  axisStroke,
  axisTick,
  chartGridStroke,
  tooltipStyle,
} from '../../utils/chartTheme'

function EmptyChartState({ children }) {
  return (
    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
      {children}
    </div>
  )
}

export default function EnergyUsagePerTimeStepChart({ data }) {
  const yDomain = getAdaptiveDomain(data, 'energyUsage', { zeroMin: true })

  return (
    <ChartCard title="Energy Usage Per Time Step">
      {data.length === 0 ? (
        <EmptyChartState>No energy telemetry yet</EmptyChartState>
      ) : (
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
                value: 'Energy Usage',
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
            <Line
              type="monotone"
              dataKey="energyUsage"
              name="Energy usage"
              stroke="#2563eb"
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
