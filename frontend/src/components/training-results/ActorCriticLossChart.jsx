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
import { getTrainingRunDisplayName } from './trainingRuns'

export default function ActorCriticLossChart({ run, savedModels }) {
  const yDomain = getAdaptiveDomain(run.trainingResults.lossSeries, [
    'actorLoss',
    'criticLoss',
  ])

  return (
    <ChartCard
      title={`${getTrainingRunDisplayName(run, savedModels)} Actor and Critic Loss`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={run.trainingResults.lossSeries}
          margin={{ top: 12, right: 24, bottom: 24 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={yDomain}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={64}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actorLoss"
            name="Actor loss"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="criticLoss"
            name="Critic loss"
            stroke="#d97706"
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
