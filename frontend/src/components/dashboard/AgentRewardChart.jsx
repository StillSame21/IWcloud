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

export default function AgentRewardChart({ data }) {
  const yDomain = getAdaptiveDomain(data, [
    'farmReward',
    'serverReward',
    'smoothedFarmReward',
  ], { includeZero: true })

  return (
    <ChartCard title="Agent Reward Per Episode">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 18, left: 10 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={yDomain}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={72}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="linear"
            dataKey="farmReward"
            name="Server farm agent"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 2, strokeWidth: 1.5, fill: '#ffffff' }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="serverReward"
            name="Server agent"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 2, strokeWidth: 1.5, fill: '#ffffff' }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="smoothedFarmReward"
            name="Smoothed total reward"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={{ r: 2, strokeWidth: 1.5, fill: '#ffffff' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
