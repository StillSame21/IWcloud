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

export default function QValueReplayBufferChart({ run, savedModels }) {
  const qValueDomain = getAdaptiveDomain(
    run.trainingResults.replaySeries,
    'qValue',
    { includeZero: true },
  )

  return (
    <ChartCard
      title={`${getTrainingRunDisplayName(run, savedModels)} Q-Value and Replay Buffer`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={run.trainingResults.replaySeries}
          margin={{ top: 12, right: 40, bottom: 24 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="episode" stroke={axisStroke} tick={axisTick} />
          <YAxis
            yAxisId="qValue"
            domain={qValueDomain}
            stroke="#d97706"
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
            name="Q-value"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="buffer"
            type="monotone"
            dataKey="bufferFill"
            name="Replay buffer %"
            stroke="#2563eb"
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
