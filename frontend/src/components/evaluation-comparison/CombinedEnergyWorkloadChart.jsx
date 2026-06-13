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

export default function CombinedEnergyWorkloadChart({ data, selectedRuns }) {
  const energyKeys = selectedRuns.map((run) => `${run.id}`)
  const energyDomain = getAdaptiveDomain(data, energyKeys, { zeroMin: true })

  return (
    <ChartCard
      title="Average Energy Usage Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[28rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="10%"
          barGap={2}
          margin={{ top: 12, right: 24, bottom: 76, left: 16 }}
        >
          <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="workload"
            height={76}
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
            domain={energyDomain}
            label={{
              value: 'Average Energy Usage',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={76}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatNumber(value, 2), name]}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ lineHeight: '22px', paddingTop: 18 }}
          />
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
