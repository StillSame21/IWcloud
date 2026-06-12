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
import { chartColors, getTrainingRunDisplayName } from './trainingRuns'

export default function RewardComparisonChart({ data, savedModels, selectedRuns }) {
  const yDomain = getAdaptiveDomain(data, selectedRuns.map((run) => run.id), {
    includeZero: true,
  })

  return (
    <ChartCard
      title="Rewards Per Episode"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 48 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="episode"
            height={58}
            label={{
              value: 'Episode',
              position: 'insideBottom',
              offset: -4,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            domain={yDomain}
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
              name={`${getTrainingRunDisplayName(run, savedModels)} reward`}
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
