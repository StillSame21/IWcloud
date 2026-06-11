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
import { getRunChartColor, getRunDisplayName } from './evaluationRuns'

export default function ServerFarmCpuComparisonChart({ data, selectedRuns }) {
  return (
    <ChartCard
      title="Server Farm CPU Utilisation Rate"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 18 }}>
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
          {selectedRuns.map((run, index) => (
            <Bar
              key={run.id}
              dataKey={run.id}
              name={getRunDisplayName(run)}
              fill={getRunChartColor(index)}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
