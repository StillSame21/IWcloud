import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function AverageEnergyByJobLoadChart({
  data,
  savedModels,
  selectedRuns,
}) {
  const yDomain = getAdaptiveDomain(data, selectedRuns.map((run) => run.id), {
    zeroMin: true,
  })

  return (
    <ChartCard
      title="Average Energy Usage Per Job Load"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 32 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="workload" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={yDomain}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={64}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={getTrainingRunDisplayName(run, savedModels)}
              fill={chartColors[index]}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
