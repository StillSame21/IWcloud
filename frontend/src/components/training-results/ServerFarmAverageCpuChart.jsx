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
import {
  axisStroke,
  axisTick,
  chartGridStroke,
  tooltipStyle,
} from '../../utils/chartTheme'
import { formatNumber } from '../../utils/format'
import { getTrainingRunDisplayName } from './trainingRuns'

export default function ServerFarmAverageCpuChart({ run, savedModels }) {
  return (
    <ChartCard
      title={`${getTrainingRunDisplayName(run, savedModels)} Server Farm Average CPU Utilisation Rate`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={run.trainingResults.serverFarmAverageCpu}
          margin={{ top: 12, right: 24, bottom: 18 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="farm" stroke={axisStroke} tick={axisTick} />
          <YAxis
            domain={[0, 1]}
            label={{
              value: 'CPU Utilization Rate',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            width={64}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatNumber(value, 2)}
          />
          <Legend />
          <Bar
            dataKey="averageCpu"
            name="Average CPU Utilization"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
