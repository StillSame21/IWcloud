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

export default function EnergyWallTimeComparisonChart({
  data,
  savedModels,
  selectedRuns,
}) {
  const energyKeys = selectedRuns.map((run) => `${run.id}-energy`)
  const wallTimeKeys = selectedRuns.map((run) => `${run.id}-wallTime`)
  const energyDomain = getAdaptiveDomain(data, energyKeys, { zeroMin: true })
  const wallTimeDomain = getAdaptiveDomain(data, wallTimeKeys, {
    zeroMin: true,
  })

  return (
    <ChartCard
      title="Energy and Wall Time Per Episode"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 44, bottom: 48 }}>
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
            yAxisId="energy"
            domain={energyDomain}
            label={{
              value: 'Energy',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
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
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={72}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
          {selectedRuns.map((run, index) => (
            <Line
              key={`${run.id}-energy`}
              yAxisId="energy"
              type="monotone"
              dataKey={`${run.id}-energy`}
              name={`${getTrainingRunDisplayName(run, savedModels)} energy`}
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
              name={`${getTrainingRunDisplayName(run, savedModels)} wall time`}
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
