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
  const energyKeys = selectedRuns.map((run) => `${run.id}-energy`)
  const priceKeys = selectedRuns.map((run) => `${run.id}-price`)
  const energyDomain = getAdaptiveDomain(data, energyKeys, {
    zeroMin: true,
  })
  const priceDomain = getAdaptiveDomain(data, priceKeys, { zeroMin: true })

  return (
    <ChartCard
      title="Energy Usage and Price Per Workload / Number of Jobs"
      bodyClass="mt-4 h-[28rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="10%"
          barGap={2}
          margin={{ top: 12, right: 52, bottom: 76, left: 16 }}
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
            yAxisId="energy"
            domain={energyDomain}
            label={{
              value: 'Energy Usage',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={76}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            domain={priceDomain}
            label={{
              value: 'Energy Price',
              angle: 90,
              position: 'insideRight',
              fill: '#64748b',
            }}
            stroke={axisStroke}
            tick={axisTick}
            tickFormatter={formatAdaptiveTick}
            width={76}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatNumber(value, 2),
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ lineHeight: '22px', paddingTop: 18 }}
          />
          {selectedRuns.map((run, index) => (
            <Bar
              key={`${run.id}-energy`}
              yAxisId="energy"
              dataKey={`${run.id}-energy`}
              name={`${getRunDisplayName(run)} energy usage`}
              fill={getRunChartColor(index)}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
          {selectedRuns.map((run, index) => (
            <Bar
              key={`${run.id}-price`}
              yAxisId="price"
              dataKey={`${run.id}-price`}
              name={`${getRunDisplayName(run)} energy price`}
              fill={getRunChartColor(index)}
              fillOpacity={0.42}
              stroke={getRunChartColor(index)}
              strokeWidth={1.5}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
