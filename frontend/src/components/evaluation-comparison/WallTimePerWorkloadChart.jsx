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
import { formatNumber } from '../../utils/format'
import { getRunChartColor, getRunDisplayName } from './evaluationRuns'

export default function WallTimePerWorkloadChart({ data, selectedRuns }) {
  const yDomain = getAdaptiveDomain(data, selectedRuns.map((run) => run.id), {
    zeroMin: true,
  })

  return (
    <ChartCard
      title="Wall Time Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[24rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, bottom: 56 }}>
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="jobs"
            height={64}
            label={{
              value: 'Number of Jobs',
              position: 'insideBottom',
              offset: -6,
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
          />
          <YAxis
            domain={yDomain}
            label={{
              value: 'Wall Time (s)',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={72}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              `${formatNumber(value, 3)}s`,
              name,
            ]}
            labelFormatter={(jobs) => `${formatNumber(jobs, 0)} jobs`}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
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
