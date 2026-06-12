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
import { axisStroke, axisTick, chartGridStroke, tooltipStyle } from '../../utils/chartTheme'

export default function ReplayBufferChart({ data }) {
  const qValueDomain = getAdaptiveDomain(data, 'qValue', {
    includeZero: true,
  })

  return (
    <ChartCard title="Q-Value and Replay Buffer">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 40, bottom: 18, left: 0 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            yAxisId="qValue"
            domain={qValueDomain}
            stroke="#f97316"
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={64}
          />
          <YAxis
            yAxisId="buffer"
            orientation="right"
            domain={[0, 100]}
            stroke="#2563eb"
            tick={axisTick}
            width={56}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            yAxisId="qValue"
            type="monotone"
            dataKey="qValue"
            name="Q-value mean"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="buffer"
            type="monotone"
            dataKey="bufferFill"
            name="Buffer fill %"
            stroke="#2563eb"
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
